export type NetworkPlayerStatus = "active" | "downed" | "dead" | "extracted" | "disconnected";
export type NetworkRoomLifecycle = "waiting" | "active" | "ended";
export type NetworkPvpState = "neutral" | "hostile";
export type NetworkEnemyType = "grunt" | "charger" | "spitter" | "guard" | "elite";
export type NetworkEnemyAiState = "idle" | "patrol" | "alert" | "chase" | "attack" | "dead";
export type NetworkLandingQuality = "clean" | "rough" | "damaged";

export type NetworkVec3 = Readonly<{
  x: number;
  y: number;
  z: number;
}>;

export type NetworkPlayerState = Readonly<{
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  crouch: number;
  ads: boolean;
  health: number;
  armor: number;
  currentWeapon: string;
  status: NetworkPlayerStatus;
  pvpState: NetworkPvpState;
}>;

export type LocalNetworkState = Readonly<{
  x: number;
  y: number;
  z: number;
  yaw: number;
  crouch: number;
  ads: boolean;
  health: number;
  armor: number;
  currentWeapon: string;
}>;

export type NetworkShot = Readonly<{
  origin: NetworkVec3;
  direction: NetworkVec3;
  damage: number;
  range: number;
}>;

export type NetworkEnemyState = Readonly<{
  id: string;
  type: NetworkEnemyType;
  x: number;
  y: number;
  z: number;
  yaw: number;
  health: number;
  maxHealth: number;
  state: NetworkEnemyAiState;
  targetPlayerId: string | null;
  active: boolean;
}>;

export type NetworkEnemySnapshot = Readonly<{
  enemies: NetworkEnemyState[];
  activeCount: number;
  dormantCount: number;
  serverTickRate: number;
  snapshotRate: number;
  snapshotId: number;
  serverTime: number;
}>;

export type NetworkEnemyEvent = Readonly<{
  id: string;
  type: NetworkEnemyType;
  attackerId: string | null;
  damage: number;
  healthRemaining: number;
  maxHealth: number;
  hitZone: "body" | "head" | "legs";
  killed: boolean;
}>;

export type NetworkEnemyAttackEvent = Readonly<{
  enemyId: string;
  enemyType: NetworkEnemyType;
  targetPlayerId: string;
  damage: number;
  healthRemaining: number;
}>;

export type NetworkEnemyDespawnEvent = Readonly<{
  id: string;
  reason: "dead" | "room-reset" | "out-of-scope";
}>;

export type NetworkPvpEvent = Readonly<{
  type: "damage" | "kill";
  attackerId: string;
  attackerName: string;
  victimId: string;
  victimName: string;
  victimWasHostile: boolean;
  damage: number;
  healthRemaining: number;
}>;

export type NetworkRoomStatus = Readonly<{
  roomId: string;
  lifecycle: NetworkRoomLifecycle;
  playerCount: number;
  maxPlayers: number;
  landingQuality: NetworkLandingQuality | null;
}>;

export type NetworkPing = Readonly<{
  sentAt: number;
}>;

export type NetworkPong = Readonly<{
  sentAt: number;
  serverTime: number;
}>;
