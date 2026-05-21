import { Room, Client } from "colyseus";
import type {
  LocalNetworkState,
  NetworkPing,
  NetworkPlayerState,
  NetworkPlayerStatus,
  NetworkPong,
  NetworkPvpEvent,
  NetworkRoomLifecycle,
  NetworkRoomStatus,
  NetworkShot,
  NetworkVec3,
} from "../../shared/MultiplayerProtocol";

type ServerPlayerState = NetworkPlayerState & Readonly<{
  squadId: string;
  lastShotAt: number;
}>;

const maxPlayers = 8;
const minShotIntervalMs = 80;
const playerRadius = 0.72;
const playerHitCenterYOffset = 1.05;

export class RaidRoom extends Room {
  public maxClients = maxPlayers;
  private readonly players = new Map<string, ServerPlayerState>();
  private lifecycle: NetworkRoomLifecycle = "waiting";

  public onCreate(): void {
    this.setSimulationInterval(() => {
      this.broadcastPlayers();
      this.broadcastRoomStatus();
    }, 1000 / 15);

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

    this.onMessage("extract", (client) => {
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
    this.broadcastRoomStatus();
  }

  public onLeave(client: Client): void {
    const player = this.players.get(client.sessionId);
    this.players.delete(client.sessionId);
    console.log(`[RaidRoom] leave ${player?.name ?? client.sessionId} players=${this.players.size}`);
    this.checkRaidEnd();
    this.broadcastRoomStatus();
  }

  private setPlayerStatus(client: Client, status: NetworkPlayerStatus): void {
    const player = this.players.get(client.sessionId);

    if (!player || player.status !== "active") {
      return;
    }

    this.players.set(client.sessionId, {
      ...player,
      status,
      health: status === "dead" || status === "downed" ? 0 : player.health,
    });
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

    const currentShooter = this.players.get(shooter.id) ?? shooter;
    const victimWasHostile = bestHit.player.pvpState === "hostile";
    const armorAbsorb = Math.min(bestHit.player.armor, damage * 0.45);
    const healthDamage = Math.max(1, damage - armorAbsorb);
    const nextArmor = Math.max(0, bestHit.player.armor - armorAbsorb);
    const nextHealth = Math.max(0, bestHit.player.health - healthDamage);
    const nextStatus: NetworkPlayerStatus = nextHealth === 0 ? "dead" : bestHit.player.status;
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
      console.log(`[RaidRoom] death victim=${victim.name} attacker=${currentShooter.name}`);
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

  private broadcastRoomStatus(): void {
    this.broadcast("roomStatus", {
      roomId: this.roomId,
      lifecycle: this.lifecycle,
      playerCount: this.players.size,
      maxPlayers,
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
}
