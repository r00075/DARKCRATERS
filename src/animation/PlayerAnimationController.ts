import { AbstractMesh, Vector3 } from "@babylonjs/core";
import type { PlayerHealthSnapshot } from "../combat/PlayerHealth";
import type { InputSnapshot } from "../input/InputController";
import type { WeaponState } from "../weapons/WeaponController";
import type { MotorState } from "../world/PlayerMotor";

export type PlayerAnimationState =
  | "idle"
  | "walk-forward"
  | "walk-backward"
  | "strafe-left"
  | "strafe-right"
  | "sprint"
  | "jump"
  | "fall"
  | "land"
  | "crouch-idle"
  | "crouch-walk"
  | "reload"
  | "weapon-swap"
  | "hit-reaction"
  | "death";

export type PlayerAnimationRig = Readonly<{
  body: AbstractMesh;
  shoulder: AbstractMesh;
  head: AbstractMesh;
  leftArm: AbstractMesh;
  rightArm: AbstractMesh;
  leftLeg: AbstractMesh;
  rightLeg: AbstractMesh;
  weaponSocket: AbstractMesh;
}>;

const animationTuning = {
  blendSharpness: 16,
  footstepWalkInterval: 0.48,
  footstepSprintInterval: 0.32,
  landingDuration: 0.22,
  fireDuration: 0.16,
  reloadDuration: 0.9,
  swapDuration: 0.34,
  hitDuration: 0.24,
  deathBlendSharpness: 5,
} as const;

export class PlayerAnimationController {
  private currentState: PlayerAnimationState = "idle";
  private previousGrounded = true;
  private previousReloading = false;
  private previousWeaponId: string | null = null;
  private previousHealth = 100;
  private walkCycle = 0;
  private footstepTimer = 0;
  private landTimer = 0;
  private fireTimer = 0;
  private reloadTimer = 0;
  private swapTimer = 0;
  private hitTimer = 0;
  private deathAmount = 0;
  private upperRecoil = 0;

  public constructor(private readonly rig: PlayerAnimationRig) {}

  public get state(): PlayerAnimationState {
    return this.currentState;
  }

  public update(
    dt: number,
    input: InputSnapshot,
    motor: MotorState,
    weapon: WeaponState,
    health: PlayerHealthSnapshot,
  ): void {
    this.updateTimers(dt, weapon, health);
    this.currentState = this.resolveState(input, motor, health);
    this.updateFootsteps(dt, input, motor);
    this.applyPose(dt, input, motor, weapon, health);

    this.previousGrounded = motor.grounded;
    this.previousReloading = weapon.reloading;
    this.previousWeaponId = weapon.equippedId;
    this.previousHealth = health.current;
  }

  public reset(): void {
    this.currentState = "idle";
    this.previousGrounded = true;
    this.previousReloading = false;
    this.previousWeaponId = null;
    this.previousHealth = 100;
    this.walkCycle = 0;
    this.footstepTimer = 0;
    this.landTimer = 0;
    this.fireTimer = 0;
    this.reloadTimer = 0;
    this.swapTimer = 0;
    this.hitTimer = 0;
    this.deathAmount = 0;
    this.upperRecoil = 0;
  }

  private updateTimers(dt: number, weapon: WeaponState, health: PlayerHealthSnapshot): void {
    if (weapon.recoilBloom > 0.65 && this.fireTimer <= 0.01) {
      this.fireTimer = animationTuning.fireDuration;
      this.upperRecoil = 1;
    }

    if (weapon.reloading && !this.previousReloading) {
      this.reloadTimer = animationTuning.reloadDuration;
    }

    if (this.previousWeaponId !== null && weapon.equippedId !== this.previousWeaponId) {
      this.swapTimer = animationTuning.swapDuration;
    }

    if (health.current < this.previousHealth || health.recentDamage) {
      this.hitTimer = animationTuning.hitDuration;
    }

    this.fireTimer = Math.max(0, this.fireTimer - dt);
    this.reloadTimer = Math.max(0, this.reloadTimer - dt);
    this.swapTimer = Math.max(0, this.swapTimer - dt);
    this.hitTimer = Math.max(0, this.hitTimer - dt);
    this.landTimer = Math.max(0, this.landTimer - dt);
    this.upperRecoil += (0 - this.upperRecoil) * (1 - Math.exp(-22 * dt));
  }

  private resolveState(
    input: InputSnapshot,
    motor: MotorState,
    health: PlayerHealthSnapshot,
  ): PlayerAnimationState {
    if (!health.alive) {
      return "death";
    }

    if (this.hitTimer > 0) {
      return "hit-reaction";
    }

    if (this.reloadTimer > 0) {
      return "reload";
    }

    if (this.swapTimer > 0) {
      return "weapon-swap";
    }

    if (!motor.grounded) {
      return motor.velocity.y > 0 ? "jump" : "fall";
    }

    if (!this.previousGrounded && motor.grounded) {
      this.landTimer = animationTuning.landingDuration;
      return "land";
    }

    if (this.landTimer > 0) {
      return "land";
    }

    const moving = Math.hypot(input.moveX, input.moveZ) > 0.05;

    if (motor.crouched) {
      return moving ? "crouch-walk" : "crouch-idle";
    }

    if (input.sprintHeld && input.moveZ > 0 && !input.adsHeld) {
      return "sprint";
    }

    if (input.moveZ > 0.2) {
      return "walk-forward";
    }

    if (input.moveZ < -0.2) {
      return "walk-backward";
    }

    if (input.moveX < -0.2) {
      return "strafe-left";
    }

    if (input.moveX > 0.2) {
      return "strafe-right";
    }

    return "idle";
  }

  private updateFootsteps(dt: number, input: InputSnapshot, motor: MotorState): void {
    const moving = motor.grounded && motor.horizontalSpeed > 0.8;

    if (!moving) {
      this.footstepTimer = 0;
      return;
    }

    const interval = this.currentState === "sprint"
      ? animationTuning.footstepSprintInterval
      : animationTuning.footstepWalkInterval;
    this.footstepTimer += dt;

    if (this.footstepTimer >= interval) {
      this.footstepTimer -= interval;
      this.walkCycle += Math.PI;
    }

    this.walkCycle += dt * (this.currentState === "sprint" ? 11 : 7) * Math.max(0.25, Math.hypot(input.moveX, input.moveZ));
  }

  private applyPose(
    dt: number,
    input: InputSnapshot,
    motor: MotorState,
    weapon: WeaponState,
    health: PlayerHealthSnapshot,
  ): void {
    const blend = 1 - Math.exp(-this.poseSharpness(health) * dt);
    const moveAmount = Math.min(1, motor.horizontalSpeed / 5.2);
    const crouch = motor.crouchAmount;
    const ads = input.adsHeld ? 1 : 0;
    const sprint = this.currentState === "sprint" ? 1 : 0;
    const land = this.landTimer / animationTuning.landingDuration;
    const reload = Math.min(1, this.reloadTimer / animationTuning.reloadDuration);
    const swap = Math.min(1, this.swapTimer / animationTuning.swapDuration);
    const hit = Math.min(1, this.hitTimer / animationTuning.hitDuration);
    const fire = Math.min(1, this.fireTimer / animationTuning.fireDuration);
    const cycle = this.walkCycle;
    const legSwing = Math.sin(cycle) * moveAmount;
    const armSwing = Math.sin(cycle + Math.PI) * moveAmount;
    const strafeLean = input.moveX * 0.08;
    const backwardsLean = input.moveZ < -0.1 ? -0.05 : 0;
    const crouchLean = crouch * 0.12;
    const aimRaise = 0.42 + ads * 0.18;
    const death = health.alive ? 0 : 1;

    this.deathAmount += (death - this.deathAmount) * blend;

    this.lerpRotation(
      this.rig.body,
      new Vector3(
        crouchLean + sprint * 0.18 + backwardsLean + land * 0.1 + hit * -0.12 + this.deathAmount * 1.32,
        0,
        -strafeLean + hit * 0.18,
      ),
      blend,
    );
    this.lerpPosition(
      this.rig.body,
      new Vector3(0, 0.98 - crouch * 0.4 - land * 0.08 - this.deathAmount * 0.62, this.deathAmount * 0.18),
      blend,
    );
    this.rig.body.scaling.y = this.lerp(this.rig.body.scaling.y, 1 - crouch * 0.4, blend);

    this.lerpRotation(this.rig.head, new Vector3(-ads * 0.08, 0, hit * 0.1), blend);
    this.lerpPosition(this.rig.head, new Vector3(0, 1.98 - crouch * 0.5 - this.deathAmount * 0.9, 0.02), blend);

    this.lerpRotation(
      this.rig.shoulder,
      new Vector3(aimRaise + sprint * 0.18 - reload * 0.38 - swap * 0.3 - fire * 0.22 - this.upperRecoil * 0.12, 0, -strafeLean),
      blend,
    );

    this.lerpLimbPose(
      this.rig.leftArm,
      new Vector3(0.46, 1.34 - crouch * 0.47, 0.2),
      new Vector3(aimRaise - armSwing * 0.08 + reload * 0.35, 0.12, -0.18 - ads * 0.1),
      blend,
    );
    this.lerpLimbPose(
      this.rig.rightArm,
      new Vector3(0.22, 1.34 - crouch * 0.47, 0.4),
      new Vector3(aimRaise + armSwing * 0.06 - fire * 0.18 - this.upperRecoil * 0.2, -0.05, 0.16 + ads * 0.08),
      blend,
    );

    const legForward = this.currentState === "sprint" ? 0.22 : 0.15;
    this.lerpLimbPose(
      this.rig.leftLeg,
      new Vector3(-0.16, 0.42 - crouch * 0.16 - this.deathAmount * 0.52, legSwing * legForward),
      new Vector3(-legSwing * 0.38 + crouch * 0.22, 0, 0.04),
      blend,
    );
    this.lerpLimbPose(
      this.rig.rightLeg,
      new Vector3(0.16, 0.42 - crouch * 0.16 - this.deathAmount * 0.52, -legSwing * legForward),
      new Vector3(legSwing * 0.38 + crouch * 0.22, 0, -0.04),
      blend,
    );

    this.lerpRotation(
      this.rig.weaponSocket,
      new Vector3(-ads * 0.04 - fire * 0.12 - this.upperRecoil * 0.16 + reload * 0.45, ads * -0.02, swap * 0.5),
      blend,
    );
    this.lerpPosition(
      this.rig.weaponSocket,
      new Vector3(0.34 + ads * 0.05, 1.32 - crouch * 0.46 - reload * 0.1, 0.42 + ads * 0.08 - reload * 0.08),
      blend,
    );

    if (weapon.triggerHeld && !input.adsHeld) {
      this.rig.shoulder.rotation.x += 0.02;
    }
  }

  private poseSharpness(health: PlayerHealthSnapshot): number {
    return health.alive ? animationTuning.blendSharpness : animationTuning.deathBlendSharpness;
  }

  private lerpLimbPose(mesh: AbstractMesh, position: Vector3, rotation: Vector3, blend: number): void {
    this.lerpPosition(mesh, position, blend);
    this.lerpRotation(mesh, rotation, blend);
  }

  private lerpPosition(mesh: AbstractMesh, target: Vector3, blend: number): void {
    mesh.position.x = this.lerp(mesh.position.x, target.x, blend);
    mesh.position.y = this.lerp(mesh.position.y, target.y, blend);
    mesh.position.z = this.lerp(mesh.position.z, target.z, blend);
  }

  private lerpRotation(mesh: AbstractMesh, target: Vector3, blend: number): void {
    mesh.rotation.x = this.lerp(mesh.rotation.x, target.x, blend);
    mesh.rotation.y = this.lerp(mesh.rotation.y, target.y, blend);
    mesh.rotation.z = this.lerp(mesh.rotation.z, target.z, blend);
  }

  private lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount;
  }
}
