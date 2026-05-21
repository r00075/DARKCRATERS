export type NetworkPlayerStatus = "active" | "downed" | "dead" | "extracted" | "disconnected";
export type NetworkRoomLifecycle = "waiting" | "active" | "ended";
export type NetworkPvpState = "neutral" | "hostile";

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
}>;

export type NetworkPing = Readonly<{
  sentAt: number;
}>;

export type NetworkPong = Readonly<{
  sentAt: number;
  serverTime: number;
}>;
