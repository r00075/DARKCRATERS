import { Room, Client } from "colyseus";
import type {
  LocalNetworkState,
  NetworkPing,
  NetworkEnemyAttackEvent,
  NetworkLandingQuality,
  NetworkPlayerState,
  NetworkPlayerStatus,
  NetworkPong,
  NetworkPvpEvent,
  NetworkReviveRequest,
  NetworkReviveResult,
  NetworkRoomLifecycle,
  NetworkRoomStatus,
  NetworkShot,
  NetworkVec3,
  NetworkContainerClaimRequest,
  NetworkContainerOpenRequest,
  NetworkHeavyCargoActionRequest,
  NetworkHeavyCargoState,
  NetworkObjectiveCompleteRequest,
} from "../../shared/MultiplayerProtocol";
import { NetworkEnemyManager, type ServerEnemyPlayer } from "./NetworkEnemyManager";
import { SharedWorldManager } from "./SharedWorldManager";

type ServerPlayerState = NetworkPlayerState & Readonly<{
  squadId: string;
  lastShotAt: number;
}>;

const maxPlayers = 8;
const minShotIntervalMs = 80;
const playerRadius = 0.72;
const playerHitCenterYOffset = 1.05;
const enemySimulationRate = 12;
const heavyCargoId = "heavy-cargo-helium-3-drill-core";
const heavyCargoPickupRange = 5.25;
const heavyCargoSecureRange = 9;
const heavyCargoSurfaceY = 0.35;
const heavyCargoShipSecurePosition: NetworkVec3 = { x: -104, y: 0, z: -109.85 };
const reviveRange = 4.2;
const revivedHealth = 35;

export class RaidRoom extends Room {
  public maxClients = maxPlayers;
  private readonly players = new Map<string, ServerPlayerState>();
  private readonly enemies = new NetworkEnemyManager();
  private readonly sharedWorld = new SharedWorldManager();
  private readonly landingQuality: NetworkLandingQuality = this.rollLandingQuality();
  private lifecycle: NetworkRoomLifecycle = "waiting";

  public onCreate(): void {
    console.info(
      `[RaidRoom] sharedWorld protocol=v${SharedWorldManager.protocolVersion} poiRewardAuthority=v${SharedWorldManager.poiRewardAuthorityVersion} heavyCargoAuthority=v${SharedWorldManager.heavyCargoAuthorityVersion} enabled=true room=${this.roomId}`,
    );
    console.info(
      `[RaidRoom] heavyCargoAuthority=v${SharedWorldManager.heavyCargoAuthorityVersion} enabled=true room=${this.roomId} cargo=${heavyCargoId} state=${this.sharedWorld.getHeavyCargo(heavyCargoId)?.status ?? "missing"}`,
    );
    console.info(`[RaidRoom] reviveAuthority=v1 enabled=true room=${this.roomId}`);

    this.setSimulationInterval(() => {
      this.updateEnemies(1 / enemySimulationRate);
      for (const event of this.enemies.consumeDespawnEvents()) {
        this.broadcast("enemyDespawned", event);
      }
      this.broadcastPlayers();
      if (this.enemies.shouldBroadcastSnapshot(1 / enemySimulationRate)) {
        this.broadcast("enemySnapshot", this.enemies.snapshot);
      }
      this.broadcastRoomStatus();
    }, 1000 / enemySimulationRate);

    this.onMessage("state", (client, message: LocalNetworkState) => {
      const player = this.players.get(client.sessionId);

      if (!player || player.status !== "active") {
        return;
      }

      this.players.set(client.sessionId, {
        ...player,
        x: this.sanitize(message.x, player.x),
        y: this.sanitize(message.y, player.y),
        z: this.sanitize(message.z, player.z),
        yaw: this.sanitize(message.yaw, player.yaw),
        crouch: this.clamp(this.sanitize(message.crouch, player.crouch), 0, 1),
        ads: Boolean(message.ads),
        armor: this.clamp(this.sanitize(message.armor, player.armor), 0, 100),
        currentWeapon: this.sanitizeText(message.currentWeapon, player.currentWeapon, 32),
      });
    });

    this.onMessage("shot", (client, message: NetworkShot) => {
      this.handleShot(client, message);
    });

    this.onMessage("containerOpen", (client, message: NetworkContainerOpenRequest) => {
      try {
        this.handleContainerOpen(client, message);
      } catch (error) {
        console.warn(`[RaidRoom] container open failed client=${client.sessionId}`, error);
        client.send("containerState", null);
      }
    });

    this.onMessage("containerClaim", (client, message: NetworkContainerClaimRequest) => {
      try {
        this.handleContainerClaim(client, message);
      } catch (error) {
        console.warn(`[RaidRoom] container claim failed client=${client.sessionId}`, error);
      }
    });

    this.onMessage("objectiveComplete", (client, message: NetworkObjectiveCompleteRequest) => {
      this.handleObjectiveComplete(client, message);
    });

    this.onMessage("heavyCargoRelease", (client, message: NetworkHeavyCargoActionRequest) => {
      this.handleHeavyCargoRelease(client, message);
    });

    this.onMessage("heavyCargoPickup", (client, message: NetworkHeavyCargoActionRequest) => {
      this.handleHeavyCargoPickup(client, message);
    });

    this.onMessage("heavyCargoDrop", (client, message: NetworkHeavyCargoActionRequest) => {
      this.handleHeavyCargoDrop(client, message);
    });

    this.onMessage("heavyCargoSecure", (client, message: NetworkHeavyCargoActionRequest) => {
      this.handleHeavyCargoSecure(client, message);
    });

    this.onMessage("revive", (client, message: NetworkReviveRequest) => {
      this.handleRevive(client, message);
    });

    this.onMessage("extract", (client) => {
      const player = this.players.get(client.sessionId);
      if (!player || player.status !== "active") {
        return;
      }
      for (const cargo of this.sharedWorld.markHeavyCargoExtracted()) {
        this.broadcast("heavyCargoState", cargo);
        console.info(`[RaidRoom] heavy cargo extraction room=${this.roomId} cargo=${cargo.id} from=secured to=${cargo.status} ok=true rewardCount=${cargo.status === "extracted" ? 1 : 0}`);
      }
      this.setPlayerStatus(client, "extracted");
    });

    this.onMessage("downed", (client) => {
      this.setPlayerStatus(client, "downed");
    });

    this.onMessage("dead", (client) => {
      this.setPlayerStatus(client, "dead");
    });

    this.onMessage("ping", (client, message: NetworkPing) => {
      const sentAt = this.sanitize(message?.sentAt, Date.now());
      client.send("pong", { sentAt, serverTime: Date.now() } satisfies NetworkPong);
    });
  }

  public onJoin(client: Client, options: { name?: string; squadId?: string }): void {
    const player: ServerPlayerState = {
      id: client.sessionId,
      name: this.sanitizeText(options.name, `Runner-${client.sessionId.slice(0, 4)}`, 18),
      squadId: this.sanitizeText(options.squadId, client.sessionId, 24),
      x: 0,
      y: 1.05,
      z: 0,
      yaw: 0,
      crouch: 0,
      ads: false,
      health: 100,
      armor: 0,
      currentWeapon: "pistol",
      status: "active",
      pvpState: "neutral",
      lastShotAt: 0,
    };

    this.players.set(client.sessionId, player);
    this.refreshLifecycle();
    console.log(`[RaidRoom] join ${player.name} (${client.sessionId}) players=${this.players.size}`);
    client.send("enemySnapshot", this.enemies.snapshot);
    client.send("sharedWorldSnapshot", this.sharedWorld.snapshot);
    this.broadcastRoomStatus();
  }

  public onLeave(client: Client): void {
    const player = this.players.get(client.sessionId);
    if (player) {
      this.releaseHeavyCargoForPlayer(player, "leave");
    }
    this.players.delete(client.sessionId);
    console.log(`[RaidRoom] leave ${player?.name ?? client.sessionId} players=${this.players.size}`);
    this.checkRaidEnd();
    this.broadcastRoomStatus();
  }

  private setPlayerStatus(client: Client, status: NetworkPlayerStatus): void {
    const player = this.players.get(client.sessionId);

    if (!player || (player.status !== "active" && status !== "dead")) {
      return;
    }

    const nextPlayer: ServerPlayerState = {
      ...player,
      status,
      health: status === "dead" || status === "downed" ? 0 : player.health,
    };
    this.players.set(client.sessionId, nextPlayer);
    if (status === "dead" || status === "downed") {
      this.handlePlayerDowned(nextPlayer, "client");
    }
    console.log(`[RaidRoom] ${player.name} status=${status}`);
    this.checkRaidEnd();
    this.broadcastRoomStatus();
  }

  private handleShot(client: Client, message: NetworkShot): void {
    const shooter = this.players.get(client.sessionId);
    const now = Date.now();

    if (!shooter || shooter.status !== "active" || now - shooter.lastShotAt < minShotIntervalMs) {
      return;
    }

    this.players.set(shooter.id, { ...shooter, lastShotAt: now });
    const range = this.clamp(this.sanitize(message.range, 0), 1, 160);
    const damage = this.clamp(this.sanitize(message.damage, 0), 1, 95);
    const origin = message.origin;
    const direction = this.normalize(message.direction);

    if (!this.isVec3(origin) || !direction) {
      return;
    }

    const currentShooter = this.players.get(shooter.id) ?? shooter;
    const enemyHit = this.enemies.applyShot(currentShooter.id, origin, direction, range, damage);
    if (enemyHit) {
      if (enemyHit.killed) {
        this.broadcast("enemyKilled", enemyHit);
        console.log(`[RaidRoom] enemy killed id=${enemyHit.id} attacker=${currentShooter.name}`);
      } else {
        this.broadcast("enemyDamaged", enemyHit);
      }
      this.broadcast("enemySnapshot", this.enemies.snapshot);
      return;
    }

    let bestHit: { player: ServerPlayerState; distance: number } | null = null;

    for (const player of this.players.values()) {
      if (player.id === shooter.id || player.status !== "active" || player.squadId === shooter.squadId) {
        continue;
      }

      const hitDistance = this.raySphereDistance(
        origin,
        direction,
        { x: player.x, y: player.y + playerHitCenterYOffset, z: player.z },
        playerRadius,
      );

      if (hitDistance === null || hitDistance > range) {
        continue;
      }

      if (!bestHit || hitDistance < bestHit.distance) {
        bestHit = { player, distance: hitDistance };
      }
    }

    if (!bestHit) {
      return;
    }

    const victimWasHostile = bestHit.player.pvpState === "hostile";
    const armorAbsorb = Math.min(bestHit.player.armor, damage * 0.45);
    const healthDamage = Math.max(1, damage - armorAbsorb);
    const nextArmor = Math.max(0, bestHit.player.armor - armorAbsorb);
    const nextHealth = Math.max(0, bestHit.player.health - healthDamage);
    const nextStatus: NetworkPlayerStatus = nextHealth === 0 ? "downed" : bestHit.player.status;
    const victim: ServerPlayerState = {
      ...bestHit.player,
      health: nextHealth,
      armor: nextArmor,
      status: nextStatus,
    };

    this.players.set(currentShooter.id, { ...currentShooter, pvpState: "hostile" });
    this.players.set(victim.id, victim);
    this.clients.find((candidate) => candidate.sessionId === victim.id)?.send("health", { health: victim.health });

    const event: NetworkPvpEvent = {
      type: victim.health === 0 ? "kill" : "damage",
      attackerId: currentShooter.id,
      attackerName: currentShooter.name,
      victimId: victim.id,
      victimName: victim.name,
      victimWasHostile,
      damage: Math.round(healthDamage),
      healthRemaining: Math.round(victim.health),
    };
    this.broadcast("pvpEvent", event);

    if (victim.health === 0) {
      this.handlePlayerDowned(victim, currentShooter.name);
      this.checkRaidEnd();
    }
  }

  private broadcastPlayers(): void {
    this.broadcast(
      "players",
      Array.from(this.players.values()).map((player): NetworkPlayerState => ({
        id: player.id,
        name: player.name,
        x: player.x,
        y: player.y,
        z: player.z,
        yaw: player.yaw,
        crouch: player.crouch,
        ads: player.ads,
        health: player.health,
        armor: player.armor,
        currentWeapon: player.currentWeapon,
        status: player.status,
        pvpState: player.pvpState,
      })),
    );
  }

  private updateEnemies(dt: number): void {
    const attacks = this.enemies.update(dt, this.enemyPlayers);

    for (const attack of attacks) {
      this.applyEnemyAttack(attack);
    }
  }

  private applyEnemyAttack(attack: NetworkEnemyAttackEvent): void {
    const player = this.players.get(attack.targetPlayerId);

    if (!player || player.status !== "active") {
      return;
    }

    const nextHealth = Math.max(0, player.health - attack.damage);
    const nextStatus: NetworkPlayerStatus = nextHealth === 0 ? "downed" : player.status;
    const nextPlayer = {
      ...player,
      health: nextHealth,
      status: nextStatus,
    };
    this.players.set(player.id, nextPlayer);
    const event: NetworkEnemyAttackEvent = {
      ...attack,
      healthRemaining: Math.round(nextHealth),
    };
    this.clients.find((candidate) => candidate.sessionId === player.id)?.send("health", { health: nextHealth });
    this.broadcast("enemyAttack", event);

    if (nextStatus === "downed") {
      console.log(`[RaidRoom] enemy downed player=${player.name} enemy=${attack.enemyId}`);
      this.handlePlayerDowned(nextPlayer, attack.enemyId);
      this.checkRaidEnd();
    }
  }

  private handlePlayerDowned(player: ServerPlayerState, source: string): void {
    console.info(
      `[RaidRoom] player downed room=${this.roomId} player=${player.name} by=${source} position=${this.formatVec(player)} state=${player.status}`,
    );
    this.releaseHeavyCargoForPlayer(player, "downed");
  }

  private handleRevive(client: Client, message: NetworkReviveRequest): void {
    const reviver = this.players.get(client.sessionId);
    const targetId = this.sanitizeText(message?.targetPlayerId, "", 96);
    const target = targetId ? this.players.get(targetId) : null;
    const reject = (reason: NetworkReviveResult["reason"], targetHealth = target?.health ?? 0): void => {
      const result: NetworkReviveResult = {
        ok: false,
        reason,
        reviverPlayerId: reviver?.id ?? null,
        targetPlayerId: target?.id ?? targetId ?? null,
        targetHealth,
      };
      client.send("reviveResult", result);
      console.info(
        `[Revive] request room=${this.roomId} reviver=${reviver?.name ?? client.sessionId} target=${target?.name ?? (targetId || "none")} accepted=false reason=${reason}`,
      );
    };

    if (!reviver || !targetId) {
      reject("invalid");
      return;
    }
    if (reviver.id === targetId) {
      reject("self");
      return;
    }
    if (reviver.status !== "active" || reviver.health <= 0) {
      reject("reviver-not-active");
      return;
    }
    if (!target) {
      reject("target-missing");
      return;
    }
    if (target.status !== "downed" && target.status !== "dead") {
      reject("not-downed", target.health);
      return;
    }

    const distance = this.distance2d(reviver, target);
    if (distance > reviveRange) {
      reject("out-of-range", target.health);
      return;
    }

    const revived: ServerPlayerState = {
      ...target,
      status: "active",
      health: revivedHealth,
    };
    this.players.set(target.id, revived);
    const result: NetworkReviveResult = {
      ok: true,
      reason: "revived",
      reviverPlayerId: reviver.id,
      targetPlayerId: target.id,
      targetHealth: revivedHealth,
    };
    client.send("reviveResult", result);
    this.clients.find((candidate) => candidate.sessionId === target.id)?.send("reviveResult", result);
    this.clients.find((candidate) => candidate.sessionId === target.id)?.send("health", { health: revivedHealth });
    this.broadcastPlayers();
    this.refreshLifecycle();
    this.broadcastRoomStatus();
    console.info(`[Revive] request room=${this.roomId} reviver=${reviver.name} target=${target.name} accepted=true reason=revived`);
    console.info(`[Revive] complete room=${this.roomId} reviver=${reviver.name} target=${target.name} from=${target.status} to=active health=${revivedHealth} ok=true`);
  }

  private handleContainerOpen(client: Client, message: NetworkContainerOpenRequest): void {
    const player = this.players.get(client.sessionId);
    const containerId = this.sanitizeText(message?.containerId, "", 96);

    if (!player || !containerId || player.status !== "active") {
      console.info(`[RaidRoom] container open invalid player=${client.sessionId} container=${containerId || "none"}`);
      return;
    }

    const before = this.sharedWorld.getContainerDiagnostics(containerId);
    console.info(
      `[RaidRoom] container open request room=${this.roomId} player=${player.id} container=${containerId} recognized=${before.recognized} opened=${before.opened} depleted=${before.depleted} items=${before.itemCount}`,
    );
    const state = this.sharedWorld.openContainer(containerId, player.id);
    if (!state) {
      client.send("containerState", null);
      console.info(`[RaidRoom] container open missing id=${containerId} player=${player.name}`);
      return;
    }

    console.info(`[RaidRoom] container open response room=${this.roomId} container=${containerId} outcome=${state.depleted ? "depleted" : "approved"} items=${state.items.length}`);
    this.broadcast("containerState", state);
    this.broadcast("sharedWorldSnapshot", this.sharedWorld.snapshot);
  }

  private handleContainerClaim(client: Client, message: NetworkContainerClaimRequest): void {
    const player = this.players.get(client.sessionId);
    const containerId = this.sanitizeText(message?.containerId, "", 96);
    const requestedIndex = message?.itemIndex;

    if (!player || player.status !== "active" || !containerId || (requestedIndex !== "all" && typeof requestedIndex !== "number")) {
      return;
    }

    const expectedType = typeof message?.expectedType === "string"
      ? this.sanitizeText(message.expectedType, "", 64)
      : null;
    const expectedQuantity = typeof message?.expectedQuantity === "number"
      ? this.clamp(Math.floor(this.sanitize(message.expectedQuantity, 0)), 0, 999)
      : null;
    const result = this.sharedWorld.claim(containerId, requestedIndex, player.id, expectedType, expectedQuantity);
    client.send("containerClaimResult", result);
    console.info(
      `[RaidRoom] container claim room=${this.roomId} player=${player.id} container=${containerId} ok=${result.ok} reason=${result.reason} claimed=${result.claimedItems.length} remaining=${result.container?.items.length ?? 0}`,
    );
    if (result.container) {
      this.broadcast("containerState", result.container);
    }
    this.broadcast("sharedWorldSnapshot", this.sharedWorld.snapshot);
  }

  private handleObjectiveComplete(client: Client, message: NetworkObjectiveCompleteRequest): void {
    const player = this.players.get(client.sessionId);
    const objectiveId = this.sanitizeText(message?.objectiveId, "", 128);
    const objectiveType = this.sanitizeText(message?.objectiveType, "unknown", 48);
    const poiId = this.sanitizeText(message?.poiId, "unknown", 64);

    if (!player || player.status !== "active" || !objectiveId) {
      return;
    }

    const result = this.sharedWorld.completeObjective(objectiveId, objectiveType, poiId, player.id);
    this.broadcast("objectiveState", result.state);
    this.broadcast("sharedWorldSnapshot", this.sharedWorld.snapshot);
    if (result.changed) {
      console.log(
        `[RaidRoom] shared objective complete room=${this.roomId} id=${objectiveId} type=${objectiveType} poi=${poiId} player=${player.name} reward=${result.reward?.rewardChestId ?? "none"} rewardStatus=${result.reward?.reason ?? "none"}`,
      );
    } else if (result.reward) {
      console.info(
        `[RaidRoom] shared objective duplicate room=${this.roomId} id=${objectiveId} player=${player.name} reward=${result.reward.rewardChestId} rewardStatus=${result.reward.reason}`,
      );
    }
  }

  private handleHeavyCargoRelease(client: Client, message: NetworkHeavyCargoActionRequest): void {
    const player = this.players.get(client.sessionId);
    const id = this.sanitizeText(message?.id, "", 96);

    if (!player || !id) {
      return;
    }
    if (player.status !== "active") {
      client.send("heavyCargoActionResult", { ok: false, reason: "invalid" as const, cargo: this.sharedWorld.getHeavyCargo(id) });
      return;
    }

    const cargo = this.sharedWorld.getHeavyCargo(id);
    const requestDistance = cargo ? this.distance2d(player, cargo.position) : Number.POSITIVE_INFINITY;
    console.info(
      `[HeavyCargo] unlock request room=${this.roomId} player=${player.name} id=${id} state=${cargo?.status ?? "missing"} player=${this.formatVec(player)} cargo=${this.formatVec(cargo?.position)} range=${this.formatRange(requestDistance)}`,
    );
    if (!this.isSupportedHeavyCargoId(id) || !cargo) {
      const result = { ok: false, reason: "invalid" as const, cargo };
      client.send("heavyCargoActionResult", result);
      console.info(`[HeavyCargo] unlock rejected room=${this.roomId} player=${player.name} id=${id} reason=invalid broadcast=false`);
      return;
    }

    if (requestDistance > heavyCargoPickupRange) {
      const result = { ok: false, reason: "out-of-range" as const, cargo };
      client.send("heavyCargoActionResult", result);
      console.info(
        `[HeavyCargo] unlock rejected room=${this.roomId} player=${player.name} id=${id} state=${cargo.status} reason=out-of-range player=${this.formatVec(player)} cargo=${this.formatVec(cargo.position)} range=${this.formatRange(requestDistance)} broadcast=false`,
      );
      return;
    }

    const from = cargo.status;
    const result = this.sharedWorld.releaseHeavyCargo(id, player.id);
    client.send("heavyCargoActionResult", result);
    if (result.cargo) {
      this.broadcast("heavyCargoState", result.cargo);
      this.broadcast("sharedWorldSnapshot", this.sharedWorld.snapshot);
    }
    console.info(
      result.ok
        ? `[RaidRoom] heavy cargo release room=${this.roomId} player=${player.name} cargo=${id} from=${from} to=${result.cargo?.status ?? "missing"} ok=true reason=released player=${this.formatVec(player)} cargo=${this.formatVec(result.cargo?.position)} range=${this.formatRange(requestDistance)} broadcast=true`
        : `[HeavyCargo] unlock rejected room=${this.roomId} player=${player.name} id=${id} from=${from} to=${result.cargo?.status ?? "missing"} reason=${result.reason} player=${this.formatVec(player)} cargo=${this.formatVec(result.cargo?.position)} range=${this.formatRange(requestDistance)} broadcast=${result.cargo ? "true" : "false"}`,
    );
  }

  private handleHeavyCargoPickup(client: Client, message: NetworkHeavyCargoActionRequest): void {
    const player = this.players.get(client.sessionId);
    const id = this.sanitizeText(message?.id, "", 96);

    if (!player || !id) {
      return;
    }
    if (player.status !== "active") {
      client.send("heavyCargoActionResult", { ok: false, reason: "invalid" as const, cargo: this.sharedWorld.getHeavyCargo(id) });
      return;
    }

    const cargo = this.sharedWorld.getHeavyCargo(id);
    const requestDistance = cargo ? this.distance2d(player, cargo.position) : Number.POSITIVE_INFINITY;
    console.info(
      `[HeavyCargo] pickup request room=${this.roomId} player=${player.name} id=${id} state=${cargo?.status ?? "missing"} player=${this.formatVec(player)} cargo=${this.formatVec(cargo?.position)} range=${this.formatRange(requestDistance)}`,
    );
    if (!this.isSupportedHeavyCargoId(id) || !cargo) {
      const result = { ok: false, reason: "invalid" as const, cargo };
      client.send("heavyCargoActionResult", result);
      console.info(`[HeavyCargo] pickup rejected room=${this.roomId} player=${player.name} id=${id} reason=invalid broadcast=false`);
      return;
    }

    if (cargo.status !== "carried" && requestDistance > heavyCargoPickupRange) {
      const result = { ok: false, reason: "out-of-range" as const, cargo };
      client.send("heavyCargoActionResult", result);
      console.info(
        `[HeavyCargo] pickup rejected room=${this.roomId} player=${player.name} id=${id} state=${cargo.status} reason=out-of-range player=${this.formatVec(player)} cargo=${this.formatVec(cargo.position)} range=${this.formatRange(requestDistance)} broadcast=false`,
      );
      return;
    }

    const from = cargo.status;
    const result = this.sharedWorld.pickupHeavyCargo(id, player.id);
    client.send("heavyCargoActionResult", result);
    if (result.cargo) {
      this.broadcast("heavyCargoState", result.cargo);
      this.broadcast("sharedWorldSnapshot", this.sharedWorld.snapshot);
    }
    if (result.ok && result.cargo) {
      const spawned = result.pressureTriggered ? this.enemies.triggerHeavyCargoPressure(result.cargo.position, player.id) : 0;
      if (spawned > 0) {
        this.broadcast("enemySnapshot", this.enemies.snapshot);
      }
      console.info(`[RaidRoom] heavy cargo pickup room=${this.roomId} player=${player.name} cargo=${id} from=${from} to=${result.cargo.status} ok=true reason=claimed player=${this.formatVec(player)} cargo=${this.formatVec(result.cargo.position)} range=${this.formatRange(requestDistance)} pressureTriggered=${Boolean(result.pressureTriggered)} threats=${spawned} broadcast=true`);
    } else {
      console.info(`[RaidRoom] heavy cargo pickup room=${this.roomId} player=${player.name} cargo=${id} from=${from} to=${result.cargo?.status ?? "missing"} ok=false reason=${result.reason} player=${this.formatVec(player)} cargo=${this.formatVec(result.cargo?.position)} range=${this.formatRange(requestDistance)} broadcast=${result.cargo ? "true" : "false"}`);
    }
  }

  private handleHeavyCargoDrop(client: Client, message: NetworkHeavyCargoActionRequest): void {
    const player = this.players.get(client.sessionId);
    const id = this.sanitizeText(message?.id, "", 96);

    if (!player || !id) {
      return;
    }
    if (player.status !== "active") {
      client.send("heavyCargoActionResult", { ok: false, reason: "invalid" as const, cargo: this.sharedWorld.getHeavyCargo(id) });
      return;
    }

    if (!this.isSupportedHeavyCargoId(id)) {
      const result = { ok: false, reason: "invalid" as const, cargo: this.sharedWorld.getHeavyCargo(id) };
      client.send("heavyCargoActionResult", result);
      console.info(`[HeavyCargo] drop rejected room=${this.roomId} player=${player.name} id=${id} reason=invalid`);
      return;
    }

    const cargoBeforeDrop = this.sharedWorld.getHeavyCargo(id);
    const from = cargoBeforeDrop?.status ?? "missing";
    const dropResolution = this.resolveHeavyCargoDropPosition(player, message?.position, "manual");
    const dropPosition = dropResolution.resolved;
    const requestedDistance = message?.position ? this.distance2d(player, message.position) : 0;
    console.info(
      `[HeavyCargo] drop resolve room=${this.roomId} player=${player.name} reason=manual requested=${this.formatVec(message?.position)} resolved=${this.formatVec(dropPosition)} groundCorrected=${dropResolution.groundCorrected}`,
    );
    const result = this.sharedWorld.dropHeavyCargo(id, player.id, dropPosition);
    client.send("heavyCargoActionResult", result);
    if (result.cargo) {
      this.broadcast("heavyCargoState", result.cargo);
      this.broadcast("sharedWorldSnapshot", this.sharedWorld.snapshot);
    }
    console.info(
      result.ok
        ? `[RaidRoom] heavy cargo drop room=${this.roomId} player=${player.name} cargo=${id} from=${from} to=${result.cargo?.status ?? "missing"} ok=true reason=dropped player=${this.formatVec(player)} requested=${this.formatVec(message?.position)} resolved=${this.formatVec(dropPosition)} groundCorrected=${dropResolution.groundCorrected} requestedRange=${this.formatRange(requestedDistance)} cargo=${this.formatVec(result.cargo?.position)} broadcast=true`
        : `[RaidRoom] heavy cargo drop room=${this.roomId} player=${player.name} cargo=${id} from=${from} to=${result.cargo?.status ?? "missing"} ok=false reason=${result.reason} player=${this.formatVec(player)} requested=${this.formatVec(message?.position)} resolved=${this.formatVec(dropPosition)} groundCorrected=${dropResolution.groundCorrected} requestedRange=${this.formatRange(requestedDistance)} cargo=${this.formatVec(result.cargo?.position)} broadcast=${result.cargo ? "true" : "false"}`,
    );
  }

  private handleHeavyCargoSecure(client: Client, message: NetworkHeavyCargoActionRequest): void {
    const player = this.players.get(client.sessionId);
    const id = this.sanitizeText(message?.id, "", 96);

    if (!player || !id) {
      return;
    }
    if (player.status !== "active") {
      client.send("heavyCargoActionResult", { ok: false, reason: "invalid" as const, cargo: this.sharedWorld.getHeavyCargo(id) });
      return;
    }

    const cargo = this.sharedWorld.getHeavyCargo(id);
    if (!this.isSupportedHeavyCargoId(id) || !cargo) {
      const result = { ok: false, reason: "invalid" as const, cargo };
      client.send("heavyCargoActionResult", result);
      console.info(`[HeavyCargo] secure rejected room=${this.roomId} player=${player.name} id=${id} reason=invalid`);
      return;
    }

    const secureDistance = this.distance2d(player, heavyCargoShipSecurePosition);
    if (secureDistance > heavyCargoSecureRange) {
      const result = { ok: false, reason: "out-of-range" as const, cargo };
      client.send("heavyCargoActionResult", result);
      console.info(
        `[HeavyCargo] secure rejected room=${this.roomId} player=${player.name} id=${id} reason=out-of-range player=${this.formatVec(player)} cargoBay=${this.formatVec(heavyCargoShipSecurePosition)} range=${this.formatRange(secureDistance)} broadcast=false`,
      );
      return;
    }

    const from = cargo.status;
    const result = this.sharedWorld.secureHeavyCargo(id, player.id);
    client.send("heavyCargoActionResult", result);
    if (result.cargo) {
      this.broadcast("heavyCargoState", result.cargo);
      this.broadcast("sharedWorldSnapshot", this.sharedWorld.snapshot);
    }
    console.info(
      result.ok
        ? `[RaidRoom] heavy cargo secure room=${this.roomId} player=${player.name} cargo=${id} from=${from} to=${result.cargo?.status ?? "missing"} ok=true reason=secured extractionUnlocked=true player=${this.formatVec(player)} cargoBay=${this.formatVec(heavyCargoShipSecurePosition)} range=${this.formatRange(secureDistance)} broadcast=true`
        : `[RaidRoom] heavy cargo secure room=${this.roomId} player=${player.name} cargo=${id} from=${from} to=${result.cargo?.status ?? "missing"} ok=false reason=${result.reason} player=${this.formatVec(player)} cargoBay=${this.formatVec(heavyCargoShipSecurePosition)} range=${this.formatRange(secureDistance)} broadcast=${result.cargo ? "true" : "false"}`,
    );
  }

  private broadcastHeavyCargoChanges(changes: readonly NetworkHeavyCargoState[]): void {
    for (const cargo of changes) {
      this.broadcast("heavyCargoState", cargo);
    }
    if (changes.length > 0) {
      this.broadcast("sharedWorldSnapshot", this.sharedWorld.snapshot);
    }
  }

  private releaseHeavyCargoForPlayer(player: ServerPlayerState, reason: "leave" | "downed"): void {
    const before = this.sharedWorld.getHeavyCargo(heavyCargoId);
    const releaseReason = reason === "downed" ? "carrier-downed" : "carrier-leave";
    const requestedDropPosition = this.getSafeDownedHeavyCargoDropPosition(player);
    const dropResolution = this.resolveHeavyCargoDropPosition(player, requestedDropPosition, releaseReason);
    const dropPosition = dropResolution.resolved;
    const changes = this.sharedWorld.releaseHeavyCargoCarrier(player.id, dropPosition);
    if (changes.length > 0) {
      console.info(
        `[HeavyCargo] drop resolve room=${this.roomId} player=${player.name} reason=${releaseReason} requested=${this.formatVec(requestedDropPosition)} resolved=${this.formatVec(dropPosition)} groundCorrected=${dropResolution.groundCorrected}`,
      );
      if (reason === "downed") {
        for (const cargo of changes) {
          console.info(
            `[HeavyCargo] release-on-downed room=${this.roomId} player=${player.name} id=${cargo.id} from=${before?.status ?? "missing"} to=${cargo.status} requested=${this.formatVec(requestedDropPosition)} position=${this.formatVec(cargo.position)} groundCorrected=${dropResolution.groundCorrected} ok=true reason=carrier-downed`,
          );
        }
      } else {
        this.logHeavyCargoReleases(changes, reason, player, requestedDropPosition, dropResolution.groundCorrected);
      }
      this.broadcastHeavyCargoChanges(changes);
      return;
    }

    const current = this.sharedWorld.getHeavyCargo(heavyCargoId);
    if (reason === "leave") {
      const skipReason = before?.carrierPlayerId === player.id && before?.status !== "carried"
        ? "already-dropped-after-downed"
        : "not-current-carrier";
      console.info(
        `[HeavyCargo] release-on-leave skipped room=${this.roomId} player=${player.name} id=${heavyCargoId} reason=${skipReason} state=${current?.status ?? "missing"}`,
      );
    }
  }

  private logHeavyCargoReleases(
    changes: readonly NetworkHeavyCargoState[],
    reason: "leave" | "downed",
    player: ServerPlayerState,
    requestedPosition: NetworkVec3,
    groundCorrected: boolean,
  ): void {
    for (const cargo of changes) {
      console.info(`[HeavyCargo] release-on-${reason} room=${this.roomId} player=${player.name} id=${cargo.id} state=${cargo.status} player=${this.formatVec(player)} requested=${this.formatVec(requestedPosition)} cargo=${this.formatVec(cargo.position)} groundCorrected=${groundCorrected} broadcast=true`);
    }
  }

  private isSupportedHeavyCargoId(id: string): boolean {
    return id === heavyCargoId;
  }

  private distance2d(a: NetworkVec3, b: NetworkVec3): number {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }

  private resolveHeavyCargoDropPosition(
    player: ServerPlayerState,
    requested: NetworkVec3 | undefined,
    reason: string,
  ): { resolved: NetworkVec3; groundCorrected: boolean } {
    const playerPosition = { x: player.x, y: player.y, z: player.z };
    const canonical = !requested || this.distance2d(playerPosition, requested) > 3
      ? playerPosition
      : {
        x: this.sanitize(requested.x, player.x),
        y: this.sanitize(requested.y, player.y),
        z: this.sanitize(requested.z, player.z),
      };
    const resolved = this.resolveHeavyCargoSurfacePosition(canonical);
    const groundCorrected = Math.abs(resolved.y - canonical.y) > 0.001;
    if (groundCorrected && reason !== "manual") {
      console.info(
        `[HeavyCargo] surface correction room=${this.roomId} player=${player.name} reason=${reason} requested=${this.formatVec(canonical)} resolved=${this.formatVec(resolved)}`,
      );
    }
    return { resolved, groundCorrected };
  }

  private resolveHeavyCargoSurfacePosition(position: NetworkVec3): NetworkVec3 {
    return {
      x: this.sanitize(position.x, 0),
      y: Number.isFinite(position.y) ? Math.max(heavyCargoSurfaceY, Math.min(40, position.y)) : heavyCargoSurfaceY,
      z: this.sanitize(position.z, 0),
    };
  }

  private getSafeDownedHeavyCargoDropPosition(player: ServerPlayerState): NetworkVec3 {
    return {
      x: player.x + 1.15,
      y: player.y,
      z: player.z + 0.45,
    };
  }

  private formatVec(position: NetworkVec3 | null | undefined): string {
    if (!position) {
      return "none";
    }
    return `${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)}`;
  }

  private formatRange(range: number): string {
    return Number.isFinite(range) ? range.toFixed(2) : "none";
  }

  private get enemyPlayers(): ServerEnemyPlayer[] {
    return Array.from(this.players.values()).map((player) => ({
      id: player.id,
      x: player.x,
      y: player.y,
      z: player.z,
      health: player.health,
      status: player.status,
    }));
  }

  private broadcastRoomStatus(): void {
    this.broadcast("roomStatus", {
      roomId: this.roomId,
      lifecycle: this.lifecycle,
      playerCount: this.players.size,
      maxPlayers,
      landingQuality: this.landingQuality,
      sharedWorldVersion: SharedWorldManager.protocolVersion,
    } satisfies NetworkRoomStatus);
  }

  private checkRaidEnd(): void {
    const players = Array.from(this.players.values());

    if (players.length > 0 && players.every((player) => player.status !== "active")) {
      if (this.lifecycle !== "ended") {
        console.log(`[RaidRoom] ended room=${this.roomId}`);
      }

      this.lifecycle = "ended";
      this.broadcast("raidEnded", {});
      return;
    }

    this.refreshLifecycle();
  }

  private refreshLifecycle(): void {
    if (this.lifecycle === "ended") {
      return;
    }

    this.lifecycle = this.players.size >= 2 ? "active" : "waiting";
  }

  private normalize(vector: NetworkVec3): NetworkVec3 | null {
    if (!this.isVec3(vector)) {
      return null;
    }

    const length = Math.hypot(vector.x, vector.y, vector.z);

    if (!Number.isFinite(length) || length < 0.0001) {
      return null;
    }

    return {
      x: vector.x / length,
      y: vector.y / length,
      z: vector.z / length,
    };
  }

  private raySphereDistance(
    origin: NetworkVec3,
    direction: NetworkVec3,
    center: NetworkVec3,
    radius: number,
  ): number | null {
    const ox = origin.x - center.x;
    const oy = origin.y - center.y;
    const oz = origin.z - center.z;
    const b = ox * direction.x + oy * direction.y + oz * direction.z;
    const c = ox * ox + oy * oy + oz * oz - radius * radius;
    const discriminant = b * b - c;

    if (discriminant < 0) {
      return null;
    }

    const distance = -b - Math.sqrt(discriminant);
    return distance >= 0 ? distance : null;
  }

  private isVec3(value: unknown): value is NetworkVec3 {
    const vector = value as Partial<NetworkVec3> | null;
    return (
      typeof vector?.x === "number" &&
      typeof vector.y === "number" &&
      typeof vector.z === "number" &&
      Number.isFinite(vector.x) &&
      Number.isFinite(vector.y) &&
      Number.isFinite(vector.z)
    );
  }

  private sanitize(value: number | undefined, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  }

  private sanitizeText(value: unknown, fallback: string, maxLength: number): string {
    return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private rollLandingQuality(): NetworkLandingQuality {
    const roll = Math.random();
    if (roll < 0.58) return "clean";
    if (roll < 0.9) return "rough";
    return "damaged";
  }
}
