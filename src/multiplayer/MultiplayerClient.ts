import { Scene } from "@babylonjs/core";
import { Client } from "colyseus.js";
import type { MotorState } from "../world/PlayerMotor";
import type { PlayerHealthSnapshot } from "../combat/PlayerHealth";
import { RemotePlayerRenderer } from "./RemotePlayerRenderer";
import type {
  LocalNetworkState,
  NetworkPlayerState,
  NetworkPong,
  NetworkPvpEvent,
  NetworkRoomStatus,
  NetworkShot,
} from "./MultiplayerTypes";

type ColyseusRoom = {
  id?: string;
  roomId?: string;
  sessionId: string;
  send: (type: string, message?: unknown) => void;
  onMessage: (type: string, callback: (message: unknown) => void) => void;
  onLeave: (callback: () => void) => void;
};

export type MultiplayerConnectionSnapshot = Readonly<{
  status: "offline" | "connecting" | "connected" | "error";
  endpoint: string;
  roomId: string | null;
  localPlayerId: string | null;
  lifecycle: string;
  playerCount: number;
  maxPlayers: number;
  remotePlayerCount: number;
  pingMs: number | null;
  lastEvent: string;
}>;

export class MultiplayerClient {
  private readonly renderer: RemotePlayerRenderer;
  private room: ColyseusRoom | null = null;
  private remotePlayers: NetworkPlayerState[] = [];
  private sendTimer = 0;
  private pingTimer = 0;
  private connectPromise: Promise<boolean> | null = null;
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
    pingMs: null,
    lastEvent: "offline",
  };

  public constructor(
    scene: Scene,
    private readonly onServerHealth: (health: number) => void,
    private readonly onPvpEvent: (event: NetworkPvpEvent) => void,
    private readonly onRaidEnded: () => void,
  ) {
    this.renderer = new RemotePlayerRenderer(scene);
  }

  public async connect(): Promise<boolean> {
    if (this.room) {
      return true;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = this.connectInternal();
    const result = await this.connectPromise;
    this.connectPromise = null;
    return result;
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

  public get localPlayerId(): string | null {
    return this.room?.sessionId ?? null;
  }

  public get snapshot(): MultiplayerConnectionSnapshot {
    return this.snapshotState;
  }

  public dispose(): void {
    this.renderer.dispose();
  }

  private async connectInternal(): Promise<boolean> {
    try {
      this.updateSnapshot({ status: "connecting", endpoint: this.endpoint, lastEvent: "connecting" });
      const client = new Client(this.endpoint);
      this.room = await client.joinOrCreate("raid_room", {
        name: this.localName,
        squadId: this.squadId,
      });
      this.room.onMessage("players", this.handlePlayersMessage);
      this.room.onMessage("health", this.handleHealthMessage);
      this.room.onMessage("pvpEvent", this.handlePvpEventMessage);
      this.room.onMessage("roomStatus", this.handleRoomStatusMessage);
      this.room.onMessage("pong", this.handlePongMessage);
      this.room.onMessage("raidEnded", () => {
        this.setLastEvent("raid ended");
        this.onRaidEnded();
      });
      this.room.onLeave(() => {
        this.room = null;
        this.remotePlayers = [];
        this.updateSnapshot({
          status: "offline",
          roomId: null,
          localPlayerId: null,
          lifecycle: "offline",
          playerCount: 0,
          remotePlayerCount: 0,
          lastEvent: "left room",
        });
      });
      this.updateSnapshot({
        status: "connected",
        roomId: this.room.roomId ?? this.room.id ?? null,
        localPlayerId: this.room.sessionId,
        lastEvent: "joined room",
      });
      return true;
    } catch (error) {
      console.warn("[MultiplayerClient] Could not connect to DARK CRATERS server", error);
      this.room = null;
      this.remotePlayers = [];
      this.updateSnapshot({ status: "error", roomId: null, localPlayerId: null, lastEvent: "connection failed" });
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

  private setLastEvent(lastEvent: string): void {
    this.updateSnapshot({ lastEvent });
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

    const next = `squad-${crypto.randomUUID()}`;
    window.localStorage.setItem(storageKey, next);
    return next;
  }
}
