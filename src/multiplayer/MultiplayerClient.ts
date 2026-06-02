import { Scene } from "@babylonjs/core";
import { Client } from "colyseus.js";
import type { MotorState } from "../world/PlayerMotor";
import type { PlayerHealthSnapshot } from "../combat/PlayerHealth";
import { RemotePlayerRenderer } from "./RemotePlayerRenderer";
import { NetworkEnemyRenderer } from "./NetworkEnemyRenderer";
import type { EnemyDebugState } from "../ai/EnemyAgent";
import type {
  LocalNetworkState,
  NetworkEnemyAttackEvent,
  NetworkContainerClaimResult,
  NetworkContainerState,
  NetworkEnemyDespawnEvent,
  NetworkEnemyEvent,
  NetworkEnemySnapshot,
  NetworkHeavyCargoActionResult,
  NetworkHeavyCargoState,
  NetworkLandingQuality,
  NetworkObjectiveState,
  NetworkPlayerState,
  NetworkPong,
  NetworkPvpEvent,
  NetworkReviveResult,
  NetworkRoomStatus,
  NetworkShot,
  NetworkSharedWorldSnapshot,
} from "./MultiplayerTypes";

type ColyseusRoom = {
  id?: string;
  roomId?: string;
  sessionId: string;
  send: (type: string, message?: unknown) => void;
  onMessage: (type: string, callback: (message: unknown) => void) => void;
  onLeave: (callback: (code?: number) => void) => void;
  leave: () => Promise<unknown>;
};

type NetworkAuthorityState = "LOCAL" | "SERVER" | "DISCONNECTED";

export type MultiplayerConnectionSnapshot = Readonly<{
  status: "offline" | "connecting" | "connected" | "error";
  endpoint: string;
  roomId: string | null;
  localPlayerId: string | null;
  lifecycle: string;
  playerCount: number;
  maxPlayers: number;
  remotePlayerCount: number;
  authoritativeEnemyCount: number;
  activeEnemyCount: number;
  dormantEnemyCount: number;
  renderedNetworkEnemyCount: number;
  enemySnapshotRate: number;
  enemyServerTickRate: number;
  enemySnapshotId: number;
  enemyCorrectionCount: number;
  lastEnemyAffectedId: string | null;
  pingMs: number | null;
  lastEvent: string;
  lastRoomLifecycleEvent: string;
  lastRoomLeaveCode: number | null;
  lastNetworkStateResetReason: string;
  lastEnemyEvent: string;
  lastNetworkEnemyClearReason: string;
  worldAuthority: NetworkAuthorityState;
  sharedContainerCount: number;
  sharedContainersDepleted: number;
  lastContainerEvent: string;
  activeSharedObjectiveId: string | null;
  sharedObjectiveState: string;
  extractionUnlockAuthority: NetworkAuthorityState;
  lastObjectiveEvent: string;
  duplicateClaimCount: number;
  sharedWorldSupported: boolean;
  sharedWorldVersion: number | null;
  lastContainerRequestId: string | null;
  lastContainerOpenResult: string;
  lastContainerOpenItemCount: number | null;
  lastContainerMapping: "none" | "found" | "missing";
  activeLootPanelApplied: boolean;
  lastClaimRequest: string;
  lastClaimResult: string;
  lastClaimantPlayerId: string | null;
  lastClaimWasLocal: boolean;
  lastInventoryAddApplied: boolean;
  heavyCargoAuthority: NetworkAuthorityState;
  heavyCoreState: string;
  heavyCoreCarrierPlayerId: string | null;
  heavyCoreShipSecured: boolean;
  heavyCoreLastEvent: string;
  heavyCargoPressure: string;
  heavyCargoPressureTrigger: string;
  landingQuality: NetworkLandingQuality | null;
}>;

export class MultiplayerClient {
  private readonly renderer: RemotePlayerRenderer;
  private readonly enemyRenderer: NetworkEnemyRenderer;
  private room: ColyseusRoom | null = null;
  private remotePlayers: NetworkPlayerState[] = [];
  private networkEnemies: NetworkEnemySnapshot["enemies"] = [];
  private sendTimer = 0;
  private pingTimer = 0;
  private connectPromise: Promise<boolean> | null = null;
  private lastConnectionError = "none";
  private readonly localName = `Runner-${Math.floor(1000 + Math.random() * 8999)}`;
  private snapshotState: MultiplayerConnectionSnapshot = {
    status: "offline",
    endpoint: this.endpoint,
    roomId: null,
    localPlayerId: null,
    lifecycle: "offline",
    playerCount: 0,
    maxPlayers: 8,
    remotePlayerCount: 0,
    authoritativeEnemyCount: 0,
    activeEnemyCount: 0,
    dormantEnemyCount: 0,
    renderedNetworkEnemyCount: 0,
    enemySnapshotRate: 0,
    enemyServerTickRate: 0,
    enemySnapshotId: 0,
    enemyCorrectionCount: 0,
    lastEnemyAffectedId: null,
    pingMs: null,
    lastEvent: "offline",
    lastRoomLifecycleEvent: "offline",
    lastRoomLeaveCode: null,
    lastNetworkStateResetReason: "none",
    lastEnemyEvent: "none",
    lastNetworkEnemyClearReason: "none",
    worldAuthority: "LOCAL",
    sharedContainerCount: 0,
    sharedContainersDepleted: 0,
    lastContainerEvent: "none",
    activeSharedObjectiveId: null,
    sharedObjectiveState: "none",
    extractionUnlockAuthority: "LOCAL",
    lastObjectiveEvent: "none",
    duplicateClaimCount: 0,
    sharedWorldSupported: false,
    sharedWorldVersion: null,
    lastContainerRequestId: null,
    lastContainerOpenResult: "none",
    lastContainerOpenItemCount: null,
    lastContainerMapping: "none",
    activeLootPanelApplied: false,
    lastClaimRequest: "none",
    lastClaimResult: "none",
    lastClaimantPlayerId: null,
    lastClaimWasLocal: false,
    lastInventoryAddApplied: false,
    heavyCargoAuthority: "LOCAL",
    heavyCoreState: "local",
    heavyCoreCarrierPlayerId: null,
    heavyCoreShipSecured: false,
    heavyCoreLastEvent: "none",
    heavyCargoPressure: "inactive",
    heavyCargoPressureTrigger: "none",
    landingQuality: null,
  };

  public constructor(
    scene: Scene,
    private readonly onServerHealth: (health: number) => void,
    private readonly onPvpEvent: (event: NetworkPvpEvent) => void,
    private readonly onRaidEnded: () => void,
    private readonly onEnemyEvent: (event: NetworkEnemyEvent) => void,
    private readonly onEnemyAttack: (event: NetworkEnemyAttackEvent) => void,
    private readonly onContainerState: (state: NetworkContainerState | null) => void,
    private readonly onContainerClaimResult: (result: NetworkContainerClaimResult) => void,
    private readonly onObjectiveState: (state: NetworkObjectiveState) => void,
    private readonly onHeavyCargoState: (state: NetworkHeavyCargoState) => void,
    private readonly onHeavyCargoActionResult: (result: NetworkHeavyCargoActionResult) => void,
    private readonly onReviveResult: (result: NetworkReviveResult) => void,
  ) {
    this.renderer = new RemotePlayerRenderer(scene);
    this.enemyRenderer = new NetworkEnemyRenderer(scene);
  }

  public async connect(): Promise<boolean> {
    if (this.room) {
      if (this.snapshotState.lifecycle !== "ended" && this.snapshotState.lifecycle !== "disconnected") {
        return true;
      }
      this.leaveRoom("stale room cleared before reconnect");
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = this.connectInternal();
    const result = await this.connectPromise;
    this.connectPromise = null;
    return result;
  }

  public get serverEndpoint(): string {
    return this.endpoint;
  }

  public get matchmakingEndpoint(): string {
    const endpoint = this.endpoint.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://");
    return `${endpoint.replace(/\/$/, "")}/matchmake/joinOrCreate/raid_room`;
  }

  public get lastConnectError(): string {
    return this.lastConnectionError;
  }

  public update(
    dt: number,
    motor: MotorState,
    health: PlayerHealthSnapshot,
    adsHeld: boolean,
    armor: number,
    currentWeapon: string,
  ): void {
    this.sendTimer += dt;
    this.pingTimer += dt;

    if (this.room && this.sendTimer >= 1 / 15) {
      this.sendTimer = 0;
      this.room.send("state", this.createLocalState(motor, health, adsHeld, armor, currentWeapon));
    }

    if (this.room && this.pingTimer >= 1) {
      this.pingTimer = 0;
      this.room.send("ping", { sentAt: Date.now() });
    }

    this.renderer.update(dt, this.remotePlayers);
    this.enemyRenderer.update(dt, this.networkEnemies);
    this.updateSnapshot({
      renderedNetworkEnemyCount: this.enemyRenderer.renderedCount,
      enemyCorrectionCount: this.enemyRenderer.correctionCount,
    });
  }

  public sendShot(shot: NetworkShot): void {
    this.room?.send("shot", shot);
  }

  public sendExtracted(): void {
    this.room?.send("extract");
    this.setLastEvent("extracted");
  }

  public sendDowned(): void {
    this.room?.send("downed");
    this.setLastEvent("downed");
  }

  public sendDead(): void {
    this.room?.send("dead");
    this.setLastEvent("dead");
  }

  public requestRevive(targetPlayerId: string): void {
    if (!this.room) {
      this.setLastEvent("revive no room");
      return;
    }
    this.room.send("revive", { targetPlayerId });
    this.setLastEvent(`revive ${targetPlayerId}`);
  }

  public requestContainerOpen(containerId: string): void {
    if (this.room && this.snapshotState.lastContainerRequestId === containerId && this.snapshotState.lastContainerOpenResult === "pending") {
      this.updateSnapshot({
        lastContainerEvent: `open suppressed ${containerId}`,
      });
      console.info(`[ClientLoot] open suppressed container=${containerId} reason=request-pending`);
      return;
    }

    if (!this.room) {
      this.updateSnapshot({
        lastContainerRequestId: containerId,
        lastContainerOpenResult: "no room",
        lastNetworkStateResetReason: "container open without active room",
      });
      this.logLifecycle("containerOpen blocked without active room");
      return;
    }

    if (!this.snapshotState.sharedWorldSupported) {
      this.updateSnapshot({
        lastContainerRequestId: containerId,
        lastContainerOpenResult: "unsupported",
        lastContainerOpenItemCount: null,
        lastNetworkStateResetReason: "shared world unsupported by room",
      });
      this.logLifecycle("containerOpen blocked: shared world unsupported");
      return;
    }

    this.room.send("containerOpen", { containerId });
    this.updateSnapshot({
      lastContainerRequestId: containerId,
      lastContainerOpenResult: "pending",
      lastContainerOpenItemCount: null,
      activeLootPanelApplied: false,
    });
    this.setLastEvent(`open ${containerId}`);
  }

  public requestContainerClaim(
    containerId: string,
    itemIndex: number | "all",
    expectedItem?: Readonly<{ type: string; quantity: number }>,
  ): void {
    if (!this.room) {
      this.updateSnapshot({
        lastClaimRequest: `${containerId}:${itemIndex}`,
        lastClaimResult: "no room",
        lastInventoryAddApplied: false,
        lastNetworkStateResetReason: "container claim without active room",
      });
      this.logLifecycle("containerClaim blocked without active room");
      return;
    }

    if (!this.snapshotState.sharedWorldSupported) {
      this.updateSnapshot({
        lastClaimRequest: `${containerId}:${itemIndex}`,
        lastClaimResult: "unsupported",
        lastInventoryAddApplied: false,
        lastNetworkStateResetReason: "shared world unsupported by room",
      });
      this.logLifecycle("containerClaim blocked: shared world unsupported");
      return;
    }

    this.room.send("containerClaim", {
      containerId,
      itemIndex,
      expectedType: expectedItem?.type,
      expectedQuantity: expectedItem?.quantity,
    });
    this.updateSnapshot({
      lastClaimRequest: `${containerId}:${itemIndex}`,
      lastClaimResult: "pending",
      lastInventoryAddApplied: false,
    });
    this.setLastEvent(`claim ${containerId}`);
  }

  public requestHeavyCargoPickup(id: string): void {
    if (!this.room) {
      this.updateSnapshot({ heavyCoreLastEvent: `pickup ${id} no room` });
      return;
    }
    this.room.send("heavyCargoPickup", { id });
    this.updateSnapshot({ heavyCoreLastEvent: `pickup ${id} pending` });
  }

  public requestHeavyCargoRelease(id: string): void {
    if (!this.room) {
      this.updateSnapshot({ heavyCoreLastEvent: `release ${id} no room` });
      return;
    }
    this.room.send("heavyCargoRelease", { id });
    this.updateSnapshot({ heavyCoreLastEvent: `release ${id} pending` });
  }

  public requestHeavyCargoDrop(id: string, position: Readonly<{ x: number; y: number; z: number }>): void {
    if (!this.room) {
      this.updateSnapshot({ heavyCoreLastEvent: `drop ${id} no room` });
      return;
    }
    this.room.send("heavyCargoDrop", { id, position });
    this.updateSnapshot({ heavyCoreLastEvent: `drop ${id} pending` });
  }

  public requestHeavyCargoSecure(id: string): void {
    if (!this.room) {
      this.updateSnapshot({ heavyCoreLastEvent: `secure ${id} no room` });
      return;
    }
    this.room.send("heavyCargoSecure", { id });
    this.updateSnapshot({ heavyCoreLastEvent: `secure ${id} pending` });
  }

  public markInventoryAddApplied(applied: boolean): void {
    this.updateSnapshot({ lastInventoryAddApplied: applied });
  }

  public markContainerMapping(mapped: boolean, panelApplied: boolean): void {
    this.updateSnapshot({
      lastContainerMapping: mapped ? "found" : "missing",
      activeLootPanelApplied: panelApplied,
    });
  }

  public sendObjectiveComplete(objectiveId: string, objectiveType: string, poiId: string): void {
    this.room?.send("objectiveComplete", { objectiveId, objectiveType, poiId });
    this.setLastEvent(`objective ${objectiveId}`);
  }

  public get localPlayerId(): string | null {
    return this.room?.sessionId ?? null;
  }

  public get snapshot(): MultiplayerConnectionSnapshot {
    return this.snapshotState;
  }

  public get enemyDebugStates(): EnemyDebugState[] {
    return this.enemyRenderer.debugStates;
  }

  public get remotePlayerStates(): readonly NetworkPlayerState[] {
    return this.remotePlayers;
  }

  public setEnemyHitboxDebugVisible(visible: boolean): void {
    this.enemyRenderer.setHitboxDebugVisible(visible);
  }

  public leaveRoom(reason = "manual leave"): void {
    if (!this.room) {
      this.updateSnapshot({
        status: "offline",
        roomId: null,
        localPlayerId: null,
        lifecycle: "disconnected",
        worldAuthority: "DISCONNECTED",
        extractionUnlockAuthority: "DISCONNECTED",
        heavyCargoAuthority: "DISCONNECTED",
        lastRoomLifecycleEvent: reason,
        lastNetworkStateResetReason: reason,
        lastNetworkEnemyClearReason: reason,
        lastEvent: reason,
      });
      return;
    }

    const room = this.room;
    this.room = null;
    this.remotePlayers = [];
    this.networkEnemies = [];
    this.renderer.clear();
    this.enemyRenderer.clear("room leave requested");
    this.updateSnapshot({
      status: "offline",
      roomId: null,
      localPlayerId: null,
      lifecycle: "disconnected",
      playerCount: 0,
      remotePlayerCount: 0,
      authoritativeEnemyCount: 0,
      activeEnemyCount: 0,
      dormantEnemyCount: 0,
      renderedNetworkEnemyCount: 0,
      worldAuthority: "DISCONNECTED",
      extractionUnlockAuthority: "DISCONNECTED",
      heavyCargoAuthority: "DISCONNECTED",
      sharedWorldSupported: false,
      lastRoomLifecycleEvent: reason,
      lastNetworkStateResetReason: reason,
      lastNetworkEnemyClearReason: reason,
      lastEvent: reason,
    });
    void room.leave();
  }

  public dispose(): void {
    this.logLifecycle("disposed multiplayer client");
    this.leaveRoom("disposed multiplayer client");
    this.renderer.dispose();
    this.enemyRenderer.dispose();
  }

  private async connectInternal(): Promise<boolean> {
    try {
      this.lastConnectionError = "none";
      this.updateSnapshot({ status: "connecting", endpoint: this.endpoint, lastEvent: "connecting" });
      const client = new Client(this.endpoint);
      this.room = await client.joinOrCreate("raid_room", {
        name: this.localName,
        squadId: this.squadId,
      });
      this.room.onMessage("players", this.handlePlayersMessage);
      this.room.onMessage("health", this.handleHealthMessage);
      this.room.onMessage("pvpEvent", this.handlePvpEventMessage);
      this.room.onMessage("enemySnapshot", this.handleEnemySnapshotMessage);
      this.room.onMessage("enemyDamaged", this.handleEnemyEventMessage);
      this.room.onMessage("enemyKilled", this.handleEnemyEventMessage);
      this.room.onMessage("enemyDespawned", this.handleEnemyDespawnMessage);
      this.room.onMessage("enemyAttack", this.handleEnemyAttackMessage);
      this.room.onMessage("containerState", this.handleContainerStateMessage);
      this.room.onMessage("containerClaimResult", this.handleContainerClaimResultMessage);
      this.room.onMessage("objectiveState", this.handleObjectiveStateMessage);
      this.room.onMessage("heavyCargoState", this.handleHeavyCargoStateMessage);
      this.room.onMessage("heavyCargoActionResult", this.handleHeavyCargoActionResultMessage);
      this.room.onMessage("reviveResult", this.handleReviveResultMessage);
      this.room.onMessage("sharedWorldSnapshot", this.handleSharedWorldSnapshotMessage);
      this.room.onMessage("roomStatus", this.handleRoomStatusMessage);
      this.room.onMessage("pong", this.handlePongMessage);
      this.room.onMessage("raidEnded", () => {
        this.setLastEvent("raid ended");
        this.onRaidEnded();
      });
      this.room.onLeave((code?: number) => {
        const reason = `room leave${typeof code === "number" ? ` code ${code}` : ""}`;
        this.logLifecycle(reason);
        this.room = null;
        this.remotePlayers = [];
        this.networkEnemies = [];
        this.updateSnapshot({
          status: "offline",
          roomId: null,
          localPlayerId: null,
          lifecycle: "disconnected",
          lastRoomLeaveCode: typeof code === "number" ? code : null,
          playerCount: 0,
          remotePlayerCount: 0,
          authoritativeEnemyCount: 0,
          activeEnemyCount: 0,
          dormantEnemyCount: 0,
          renderedNetworkEnemyCount: 0,
          enemySnapshotId: 0,
          lastEnemyAffectedId: null,
          worldAuthority: "DISCONNECTED",
          extractionUnlockAuthority: "DISCONNECTED",
          lastRoomLifecycleEvent: reason,
          lastNetworkStateResetReason: reason,
          lastNetworkEnemyClearReason: reason,
          lastEnemyEvent: "cleared by room leave",
          sharedWorldSupported: false,
          sharedWorldVersion: null,
          heavyCargoAuthority: "DISCONNECTED",
          lastClaimantPlayerId: null,
          lastClaimWasLocal: false,
          lastInventoryAddApplied: false,
          landingQuality: null,
          lastEvent: reason,
        });
      });
      this.updateSnapshot({
        status: "connected",
        roomId: this.room.roomId ?? this.room.id ?? null,
        localPlayerId: this.room.sessionId,
        worldAuthority: "SERVER",
        extractionUnlockAuthority: "SERVER",
        heavyCargoAuthority: "SERVER",
        lastRoomLeaveCode: null,
        lastRoomLifecycleEvent: "joined room",
        lastNetworkStateResetReason: "none",
        lastNetworkEnemyClearReason: "none",
        lastEvent: "joined room",
      });
      return true;
    } catch (error) {
      console.warn("[MultiplayerClient] Could not connect to DARK CRATERS server", error);
      this.lastConnectionError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      this.room = null;
      this.remotePlayers = [];
      this.networkEnemies = [];
      this.updateSnapshot({
        status: "error",
        roomId: null,
        localPlayerId: null,
        worldAuthority: "DISCONNECTED",
        extractionUnlockAuthority: "DISCONNECTED",
        heavyCargoAuthority: "DISCONNECTED",
        lastRoomLifecycleEvent: "connection failed",
        lastRoomLeaveCode: null,
        lastNetworkStateResetReason: "connection failed",
        lastNetworkEnemyClearReason: "connection failed",
        lastEvent: "connection failed",
      });
      return false;
    }
  }

  private createLocalState(
    motor: MotorState,
    health: PlayerHealthSnapshot,
    adsHeld: boolean,
    armor: number,
    currentWeapon: string,
  ): LocalNetworkState {
    return {
      x: motor.position.x,
      y: motor.position.y,
      z: motor.position.z,
      yaw: motor.yaw,
      crouch: motor.crouchAmount,
      ads: adsHeld,
      health: health.current,
      armor,
      currentWeapon,
    };
  }

  private readonly handlePlayersMessage = (message: unknown): void => {
    if (!Array.isArray(message)) {
      return;
    }

    this.remotePlayers = message.filter((player): player is NetworkPlayerState => {
      return typeof player === "object" && player !== null && (player as { id?: string }).id !== this.room?.sessionId;
    });
    this.updateSnapshot({ remotePlayerCount: this.remotePlayers.length });
  };

  private readonly handleHealthMessage = (message: unknown): void => {
    const health = (message as { health?: unknown } | null)?.health;

    if (typeof health === "number" && Number.isFinite(health)) {
      this.onServerHealth(health);
    }
  };

  private readonly handlePvpEventMessage = (message: unknown): void => {
    const event = message as Partial<NetworkPvpEvent> | null;

    if (
      (event?.type !== "damage" && event?.type !== "kill") ||
      typeof event?.attackerId !== "string" ||
      typeof event.attackerName !== "string" ||
      typeof event.victimId !== "string" ||
      typeof event.victimName !== "string"
    ) {
      return;
    }

    this.onPvpEvent({
      type: event.type,
      attackerId: event.attackerId,
      attackerName: event.attackerName,
      victimId: event.victimId,
      victimName: event.victimName,
      victimWasHostile: Boolean(event.victimWasHostile),
      damage: typeof event.damage === "number" ? event.damage : 0,
      healthRemaining: typeof event.healthRemaining === "number" ? event.healthRemaining : 0,
    });
  };

  private readonly handleEnemySnapshotMessage = (message: unknown): void => {
    const snapshot = message as Partial<NetworkEnemySnapshot> | null;

    if (!snapshot || !Array.isArray(snapshot.enemies)) {
      return;
    }

    const previousEnemyCount = this.networkEnemies.length;
    this.networkEnemies = snapshot.enemies.filter((enemy) => {
      return typeof enemy?.id === "string" &&
        typeof enemy.type === "string" &&
        typeof enemy.x === "number" &&
        typeof enemy.z === "number";
    }) as NetworkEnemySnapshot["enemies"];
    this.updateSnapshot({
      authoritativeEnemyCount: this.networkEnemies.length,
      activeEnemyCount: typeof snapshot.activeCount === "number" ? snapshot.activeCount : this.snapshotState.activeEnemyCount,
      dormantEnemyCount: typeof snapshot.dormantCount === "number" ? snapshot.dormantCount : this.snapshotState.dormantEnemyCount,
      enemySnapshotRate: typeof snapshot.snapshotRate === "number" ? snapshot.snapshotRate : this.snapshotState.enemySnapshotRate,
      enemyServerTickRate: typeof snapshot.serverTickRate === "number" ? snapshot.serverTickRate : this.snapshotState.enemyServerTickRate,
      enemySnapshotId: typeof snapshot.snapshotId === "number" ? snapshot.snapshotId : this.snapshotState.enemySnapshotId,
      lastEnemyEvent: `snapshot ${this.networkEnemies.length}`,
      lastNetworkEnemyClearReason: previousEnemyCount > 0 && this.networkEnemies.length === 0 ? "server snapshot 0" : this.snapshotState.lastNetworkEnemyClearReason,
    });
  };

  private readonly handleEnemyEventMessage = (message: unknown): void => {
    const event = message as Partial<NetworkEnemyEvent> | null;

    if (!event || typeof event.id !== "string" || typeof event.type !== "string") {
      return;
    }

    const normalized: NetworkEnemyEvent = {
      id: event.id,
      type: event.type as NetworkEnemyEvent["type"],
      attackerId: typeof event.attackerId === "string" ? event.attackerId : null,
      damage: typeof event.damage === "number" ? event.damage : 0,
      healthRemaining: typeof event.healthRemaining === "number" ? event.healthRemaining : 0,
      maxHealth: typeof event.maxHealth === "number" ? event.maxHealth : 1,
      hitZone: event.hitZone === "head" || event.hitZone === "legs" ? event.hitZone : "body",
      killed: Boolean(event.killed),
    };
    this.updateSnapshot({
      lastEnemyEvent: `${normalized.killed ? "killed" : "damaged"} ${normalized.id}`,
      lastEnemyAffectedId: normalized.id,
    });
    this.onEnemyEvent(normalized);
  };

  private readonly handleEnemyDespawnMessage = (message: unknown): void => {
    const event = message as Partial<NetworkEnemyDespawnEvent> | null;

    if (!event || typeof event.id !== "string") {
      return;
    }

    this.enemyRenderer.despawn(event.id);
    this.networkEnemies = this.networkEnemies.filter((enemy) => enemy.id !== event.id);
    this.updateSnapshot({
      authoritativeEnemyCount: this.networkEnemies.length,
      renderedNetworkEnemyCount: this.enemyRenderer.renderedCount,
      lastEnemyEvent: `despawn ${event.id}`,
      lastEnemyAffectedId: event.id,
    });
  };

  private readonly handleEnemyAttackMessage = (message: unknown): void => {
    const event = message as Partial<NetworkEnemyAttackEvent> | null;

    if (!event || typeof event.enemyId !== "string" || typeof event.targetPlayerId !== "string") {
      return;
    }

    const normalized: NetworkEnemyAttackEvent = {
      enemyId: event.enemyId,
      enemyType: typeof event.enemyType === "string" ? event.enemyType as NetworkEnemyAttackEvent["enemyType"] : "grunt",
      targetPlayerId: event.targetPlayerId,
      damage: typeof event.damage === "number" ? event.damage : 0,
      healthRemaining: typeof event.healthRemaining === "number" ? event.healthRemaining : 0,
    };
    this.updateSnapshot({ lastEnemyEvent: `attack ${normalized.enemyId}`, lastEnemyAffectedId: normalized.enemyId });
    this.onEnemyAttack(normalized);
  };

  private readonly handleReviveResultMessage = (message: unknown): void => {
    const result = message as Partial<NetworkReviveResult> | null;
    const normalized: NetworkReviveResult = {
      ok: Boolean(result?.ok),
      reason: this.normalizeReviveReason(result?.reason),
      reviverPlayerId: typeof result?.reviverPlayerId === "string" ? result.reviverPlayerId : null,
      targetPlayerId: typeof result?.targetPlayerId === "string" ? result.targetPlayerId : null,
      targetHealth: typeof result?.targetHealth === "number" ? result.targetHealth : 0,
    };
    this.setLastEvent(`revive ${normalized.ok ? "ok" : "rejected"} ${normalized.reason}`);
    this.onReviveResult(normalized);
  };

  private readonly handleContainerStateMessage = (message: unknown): void => {
    const state = this.normalizeContainerState(message);
    this.updateSnapshot({
      lastContainerEvent: state ? `state ${state.id}` : "missing container",
      lastContainerOpenResult: state ? (state.depleted ? "depleted" : "approved") : "not found",
      lastContainerOpenItemCount: state ? state.items.length : null,
    });
    this.onContainerState(state);
  };

  private readonly handleContainerClaimResultMessage = (message: unknown): void => {
    const result = message as Partial<NetworkContainerClaimResult> | null;
    const container = this.normalizeContainerState(result?.container);
    const claimedItems = Array.isArray(result?.claimedItems)
      ? result.claimedItems
        .map((item) => this.normalizeNetworkLootStack(item))
        .filter((item): item is NetworkContainerClaimResult["claimedItems"][number] => item !== null)
      : [];

    const normalized: NetworkContainerClaimResult = {
      ok: Boolean(result?.ok),
      reason: result?.reason === "claimed" || result?.reason === "depleted" || result?.reason === "missing" || result?.reason === "invalid"
        ? result.reason
        : "invalid",
      containerId: typeof result?.containerId === "string" ? result.containerId : container?.id ?? "unknown",
      claimantPlayerId: typeof result?.claimantPlayerId === "string" ? result.claimantPlayerId : null,
      requestedItemIndex: result?.requestedItemIndex === "all" || typeof result?.requestedItemIndex === "number"
        ? result.requestedItemIndex
        : -1,
      container,
      claimedItems,
    };
    this.updateSnapshot({
      lastContainerEvent: `${normalized.ok ? "claimed" : normalized.reason} ${container?.id ?? "unknown"}`,
      lastClaimResult: normalized.ok ? "approved" : normalized.reason,
      lastClaimantPlayerId: normalized.claimantPlayerId,
      lastClaimWasLocal: normalized.claimantPlayerId === this.room?.sessionId,
    });
    this.onContainerClaimResult(normalized);
  };

  private readonly handleObjectiveStateMessage = (message: unknown): void => {
    const state = this.normalizeObjectiveState(message);

    if (!state) {
      return;
    }

    this.updateSnapshot({
      activeSharedObjectiveId: state.id,
      sharedObjectiveState: state.completed ? "completed" : "active",
      extractionUnlockAuthority: state.extractionUnlocked ? "SERVER" : this.snapshotState.extractionUnlockAuthority,
      lastObjectiveEvent: `${state.completed ? "complete" : "state"} ${state.id}`,
    });
    this.onObjectiveState(state);
  };

  private readonly handleHeavyCargoStateMessage = (message: unknown): void => {
    const state = this.normalizeHeavyCargoState(message);

    if (!state) {
      return;
    }

    this.updateSnapshot({
      heavyCargoAuthority: "SERVER",
      heavyCoreState: state.status,
      heavyCoreCarrierPlayerId: state.carrierPlayerId,
      heavyCoreShipSecured: state.shipSecured,
      heavyCoreLastEvent: state.lastEvent,
      heavyCargoPressure: state.pressure,
      heavyCargoPressureTrigger: state.pressureTrigger,
    });
    this.onHeavyCargoState(state);
  };

  private readonly handleHeavyCargoActionResultMessage = (message: unknown): void => {
    const result = message as Partial<NetworkHeavyCargoActionResult> | null;
    const cargo = this.normalizeHeavyCargoState(result?.cargo);

    if (cargo) {
      this.handleHeavyCargoStateMessage(cargo);
    }

    this.updateSnapshot({
      heavyCoreLastEvent: `${result?.ok ? "ok" : "rejected"} ${result?.reason ?? "unknown"}`,
    });
    this.onHeavyCargoActionResult({
      ok: Boolean(result?.ok),
      reason: this.normalizeHeavyCargoReason(result?.reason),
      cargo,
      pressureTriggered: Boolean(result?.pressureTriggered),
    });
  };

  private readonly handleSharedWorldSnapshotMessage = (message: unknown): void => {
    const snapshot = message as Partial<NetworkSharedWorldSnapshot> | null;

    if (!snapshot) {
      return;
    }

    if (Array.isArray(snapshot.objectives)) {
      for (const objective of snapshot.objectives) {
        const state = this.normalizeObjectiveState(objective);
        if (state) {
          this.onObjectiveState(state);
        }
      }
    }

    if (Array.isArray(snapshot.containers)) {
      for (const container of snapshot.containers) {
        const state = this.normalizeContainerState(container);
        if (state?.opened || state?.depleted) {
          this.onContainerState(state);
        }
      }
    }

    if (Array.isArray(snapshot.heavyCargo)) {
      for (const cargo of snapshot.heavyCargo) {
        const state = this.normalizeHeavyCargoState(cargo);
        if (state) {
          this.handleHeavyCargoStateMessage(state);
        }
      }
    }

    this.updateSnapshot({
      worldAuthority: "SERVER",
      heavyCargoAuthority: Array.isArray(snapshot.heavyCargo) ? "SERVER" : this.snapshotState.heavyCargoAuthority,
      extractionUnlockAuthority: snapshot.extractionUnlocked ? "SERVER" : this.snapshotState.extractionUnlockAuthority,
      sharedWorldSupported: Array.isArray(snapshot.containers) || typeof snapshot.protocolVersion === "number",
      sharedWorldVersion: typeof snapshot.protocolVersion === "number" ? snapshot.protocolVersion : this.snapshotState.sharedWorldVersion,
      sharedContainerCount: typeof snapshot.containerCount === "number" ? snapshot.containerCount : this.snapshotState.sharedContainerCount,
      sharedContainersDepleted: typeof snapshot.containersDepleted === "number" ? snapshot.containersDepleted : this.snapshotState.sharedContainersDepleted,
      duplicateClaimCount: typeof snapshot.duplicateClaimCount === "number" ? snapshot.duplicateClaimCount : this.snapshotState.duplicateClaimCount,
      lastContainerEvent: typeof snapshot.lastContainerEvent === "string" ? snapshot.lastContainerEvent : this.snapshotState.lastContainerEvent,
      lastObjectiveEvent: typeof snapshot.lastObjectiveEvent === "string" ? snapshot.lastObjectiveEvent : this.snapshotState.lastObjectiveEvent,
    });
  };

  private readonly handleRoomStatusMessage = (message: unknown): void => {
    const status = message as Partial<NetworkRoomStatus> | null;

    if (!status || typeof status.roomId !== "string") {
      return;
    }

    this.updateSnapshot({
      roomId: status.roomId,
      lifecycle: String(status.lifecycle ?? "waiting"),
      playerCount: typeof status.playerCount === "number" ? status.playerCount : this.snapshotState.playerCount,
      maxPlayers: typeof status.maxPlayers === "number" ? status.maxPlayers : this.snapshotState.maxPlayers,
      sharedWorldSupported: typeof status.sharedWorldVersion === "number" ? true : this.snapshotState.sharedWorldSupported,
      sharedWorldVersion: typeof status.sharedWorldVersion === "number" ? status.sharedWorldVersion : this.snapshotState.sharedWorldVersion,
      landingQuality: status.landingQuality === "clean" || status.landingQuality === "rough" || status.landingQuality === "damaged"
        ? status.landingQuality
        : this.snapshotState.landingQuality,
    });
  };

  private readonly handlePongMessage = (message: unknown): void => {
    const pong = message as Partial<NetworkPong> | null;

    if (typeof pong?.sentAt !== "number") {
      return;
    }

    this.updateSnapshot({ pingMs: Math.max(0, Date.now() - pong.sentAt) });
  };

  private updateSnapshot(update: Partial<MultiplayerConnectionSnapshot>): void {
    this.snapshotState = {
      ...this.snapshotState,
      ...update,
    };
  }

  private normalizeContainerState(message: unknown): NetworkContainerState | null {
    const state = message as Partial<NetworkContainerState> | null;
    if (!state || typeof state.id !== "string" || !Array.isArray(state.items)) {
      return null;
    }

    const items = state.items
      .map((item) => {
        const normalized = this.normalizeNetworkLootStack(item);
        const keys = item && typeof item === "object" ? Object.keys(item as Record<string, unknown>).join(",") : "none";
        console.info(`[ClientLoot] row normalized container=${state.id} inputKeys=${keys} itemId=${normalized?.type ?? "missing"} rawType=${normalized?.type ?? "missing"} known=${normalized !== null}`);
        return normalized;
      })
      .filter((item): item is NetworkContainerState["items"][number] => item !== null);

    return {
      id: state.id,
      opened: Boolean(state.opened),
      depleted: Boolean(state.depleted),
      items,
      lastInteractionPlayerId: typeof state.lastInteractionPlayerId === "string" ? state.lastInteractionPlayerId : null,
    };
  }

  private normalizeNetworkLootStack(item: unknown): NetworkContainerState["items"][number] | null {
    const payload = item as {
      type?: unknown;
      rawType?: unknown;
      itemType?: unknown;
      id?: unknown;
      itemId?: unknown;
      quantity?: unknown;
      count?: unknown;
      amount?: unknown;
    } | null;

    if (!payload || typeof payload !== "object") {
      return null;
    }

    const type = typeof payload.type === "string"
      ? payload.type
      : typeof payload.rawType === "string"
        ? payload.rawType
        : typeof payload.itemType === "string"
          ? payload.itemType
          : typeof payload.itemId === "string"
            ? payload.itemId
            : typeof payload.id === "string"
              ? payload.id
              : null;
    const quantity = typeof payload.quantity === "number"
      ? payload.quantity
      : typeof payload.count === "number"
        ? payload.count
        : typeof payload.amount === "number"
          ? payload.amount
          : 1;

    if (!type || !Number.isFinite(quantity)) {
      return null;
    }

    return {
      type,
      quantity,
    };
  }

  private normalizeObjectiveState(message: unknown): NetworkObjectiveState | null {
    const state = message as Partial<NetworkObjectiveState> | null;
    if (!state || typeof state.id !== "string") {
      return null;
    }

    return {
      id: state.id,
      objectiveType: typeof state.objectiveType === "string" ? state.objectiveType : "unknown",
      poiId: typeof state.poiId === "string" ? state.poiId : "unknown",
      completed: Boolean(state.completed),
      extractionUnlocked: Boolean(state.extractionUnlocked),
      completedByPlayerId: typeof state.completedByPlayerId === "string" ? state.completedByPlayerId : null,
    };
  }

  private normalizeHeavyCargoState(message: unknown): NetworkHeavyCargoState | null {
    const state = message as Partial<NetworkHeavyCargoState> | null;
    const position = state?.position as Partial<NetworkHeavyCargoState["position"]> | null | undefined;
    const status = state?.status;
    const pressure = state?.pressure;
    const pressureTrigger = state?.pressureTrigger;

    if (!state || typeof state.id !== "string" || !position) {
      return null;
    }

    return {
      id: state.id,
      itemType: typeof state.itemType === "string" ? state.itemType : "helium-drill-core",
      label: typeof state.label === "string" ? state.label : "Helium-3 Drill Core",
      status: status === "locked" || status === "available" || status === "carried" || status === "dropped" || status === "secured" || status === "extracted"
        ? status
        : "locked",
      carrierPlayerId: typeof state.carrierPlayerId === "string" ? state.carrierPlayerId : null,
      position: {
        x: typeof position.x === "number" ? position.x : 0,
        y: typeof position.y === "number" ? position.y : 0,
        z: typeof position.z === "number" ? position.z : 0,
      },
      shipSecured: Boolean(state.shipSecured),
      pressure: pressure === "inactive" || pressure === "triggered" || pressure === "active" || pressure === "resolved"
        ? pressure
        : "inactive",
      pressureTrigger: pressureTrigger === "core released" || pressureTrigger === "core carried" || pressureTrigger === "core secured"
        ? pressureTrigger
        : "none",
      lastEvent: typeof state.lastEvent === "string" ? state.lastEvent : "none",
    };
  }

  private normalizeHeavyCargoReason(reason: unknown): NetworkHeavyCargoActionResult["reason"] {
    if (
      reason === "released" ||
      reason === "picked-up" ||
      reason === "dropped" ||
      reason === "secured" ||
      reason === "missing" ||
      reason === "busy" ||
      reason === "already-carried" ||
      reason === "invalid" ||
      reason === "invalid-state" ||
      reason === "locked" ||
      reason === "not-carrier" ||
      reason === "already-secured" ||
      reason === "out-of-range"
    ) {
      return reason;
    }
    return "invalid";
  }

  private normalizeReviveReason(reason: unknown): NetworkReviveResult["reason"] {
    if (
      reason === "revived" ||
      reason === "invalid" ||
      reason === "self" ||
      reason === "not-downed" ||
      reason === "out-of-range" ||
      reason === "reviver-not-active" ||
      reason === "target-missing"
    ) {
      return reason;
    }
    return "invalid";
  }

  private setLastEvent(lastEvent: string): void {
    this.updateSnapshot({ lastEvent });
  }

  private logLifecycle(message: string): void {
    if (import.meta.env.DEV) {
      console.info(`[MultiplayerClient] ${message}`);
    }
    this.updateSnapshot({ lastRoomLifecycleEvent: message });
  }

  private get endpoint(): string {
    return import.meta.env.VITE_SERVER_URL ?? import.meta.env.VITE_COLYSEUS_ENDPOINT ?? "ws://localhost:2567";
  }

      private get squadId(): string {
    const params = new URLSearchParams(window.location.search);
    const explicitSquad = params.get("squad");

    if (explicitSquad) {
      return explicitSquad.slice(0, 24);
    }

    const storageKey = "dark-craters.multiplayer.squad-id.v1";
    const existing = window.localStorage.getItem(storageKey);

    if (existing) {
      return existing;
    }

    const randomUuid =
      typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    const next = `squad-${randomUuid}`;
    window.localStorage.setItem(storageKey, next);
    return next;
  }
}
