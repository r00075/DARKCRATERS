import type { Vector3 } from "@babylonjs/core";
import type { InputSnapshot } from "../input/InputController";

export type PlayerInputCommand = Readonly<{
  sequence: number;
  clientTime: number;
  input: InputSnapshot;
  cameraYaw: number;
}>;

export type ReplicatedPlayerState = Readonly<{
  entityId: string;
  position: Vector3;
  velocity: Vector3;
  yaw: number;
  grounded: boolean;
  equippedWeaponId: string;
}>;
