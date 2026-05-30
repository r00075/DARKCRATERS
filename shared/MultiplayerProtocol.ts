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

export type NetworkReviveRequest = Readonly<{
  targetPlayerId: string;
}>;

export type NetworkReviveResult = Readonly<{
  ok: boolean;
  reason: "revived" | "invalid" | "self" | "not-downed" | "out-of-range" | "reviver-not-active" | "target-missing";
  reviverPlayerId: string | null;
  targetPlayerId: string | null;
  targetHealth: number;
}>;

export type NetworkRoomStatus = Readonly<{
  roomId: string;
  lifecycle: NetworkRoomLifecycle;
  playerCount: number;
  maxPlayers: number;
  landingQuality: NetworkLandingQuality | null;
  sharedWorldVersion?: number;
}>;

export type NetworkPing = Readonly<{
  sentAt: number;
}>;

export type NetworkPong = Readonly<{
  sentAt: number;
  serverTime: number;
}>;

export type NetworkLootStack = Readonly<{
  type: string;
  quantity: number;
}>;

export type NetworkContainerState = Readonly<{
  id: string;
  opened: boolean;
  depleted: boolean;
  items: NetworkLootStack[];
  lastInteractionPlayerId: string | null;
}>;

export type NetworkContainerOpenRequest = Readonly<{
  containerId: string;
}>;

export type NetworkContainerClaimRequest = Readonly<{
  containerId: string;
  itemIndex: number | "all";
  expectedType?: string;
  expectedQuantity?: number;
}>;

export type NetworkContainerClaimResult = Readonly<{
  ok: boolean;
  reason: "claimed" | "depleted" | "missing" | "invalid";
  containerId: string;
  claimantPlayerId: string | null;
  requestedItemIndex: number | "all";
  container: NetworkContainerState | null;
  claimedItems: NetworkLootStack[];
}>;

export type NetworkHeavyCargoStatus =
  | "locked"
  | "available"
  | "carried"
  | "dropped"
  | "secured"
  | "extracted";

export type NetworkHeavyCargoPressureState = "inactive" | "triggered" | "active" | "resolved";

export type NetworkHeavyCargoState = Readonly<{
  id: string;
  itemType: string;
  label: string;
  status: NetworkHeavyCargoStatus;
  carrierPlayerId: string | null;
  position: NetworkVec3;
  shipSecured: boolean;
  pressure: NetworkHeavyCargoPressureState;
  pressureTrigger: "none" | "core released" | "core carried" | "core secured";
  lastEvent: string;
}>;

export type NetworkHeavyCargoActionRequest = Readonly<{
  id: string;
  position?: NetworkVec3;
}>;

export type NetworkHeavyCargoActionResult = Readonly<{
  ok: boolean;
  reason:
    | "released"
    | "picked-up"
    | "dropped"
    | "secured"
    | "missing"
    | "busy"
    | "already-carried"
    | "invalid"
    | "invalid-state"
    | "locked"
    | "not-carrier"
    | "already-secured"
    | "out-of-range";
  cargo: NetworkHeavyCargoState | null;
  pressureTriggered?: boolean;
}>;

export type NetworkObjectiveState = Readonly<{
  id: string;
  objectiveType: string;
  poiId: string;
  completed: boolean;
  extractionUnlocked: boolean;
  completedByPlayerId: string | null;
}>;

export type NetworkObjectiveCompleteRequest = Readonly<{
  objectiveId: string;
  objectiveType: string;
  poiId: string;
}>;

export type NetworkSharedWorldSnapshot = Readonly<{
  protocolVersion?: number;
  containers: NetworkContainerState[];
  objectives: NetworkObjectiveState[];
  heavyCargo?: NetworkHeavyCargoState[];
  extractionUnlocked: boolean;
  containerCount: number;
  containersDepleted: number;
  duplicateClaimCount: number;
  lastContainerEvent: string;
  lastObjectiveEvent: string;
}>;
