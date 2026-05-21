import { AbstractMesh, Ray, Vector3 } from "@babylonjs/core";
import type { InputSnapshot } from "../input/InputController";
import { clamp, wrapAngle, yawToBasis } from "../math/angles";

export type PlayerMotorConfig = Readonly<{
  walkSpeed: number;
  sprintSpeed: number;
  strafeSpeedMultiplier: number;
  acceleration: number;
  deceleration: number;
  airControl: number;
  jumpSpeed: number;
  gravity: number;
  groundedProbeDistance: number;
  rotationSharpness: number;
  standingHalfHeight: number;
  crouchedHalfHeight: number;
  crouchedSpeedMultiplier: number;
  crouchSharpness: number;
  adsSpeedMultiplier: number;
  bunnyhopTimingWindow: number;
  bunnyhopMomentumGain: number;
  maxBunnyhopSpeedMultiplier: number;
  bunnyhopMomentumDecayRate: number;
  sharpDirectionChangePenalty: number;
  strafeMomentumBlend: number;
  minForwardHopInput: number;
}>;

const defaultConfig: PlayerMotorConfig = {
  walkSpeed: 5.2,
  sprintSpeed: 8.6,
  strafeSpeedMultiplier: 0.88,
  acceleration: 34,
  deceleration: 28,
  airControl: 0.35,
  jumpSpeed: 8.4,
  gravity: 24,
  groundedProbeDistance: 0.08,
  rotationSharpness: 18,
  standingHalfHeight: 0.98,
  crouchedHalfHeight: 0.58,
  crouchedSpeedMultiplier: 0.56,
  crouchSharpness: 14,
  adsSpeedMultiplier: 0.75,
  bunnyhopTimingWindow: 0.22,
  bunnyhopMomentumGain: 0.1,
  maxBunnyhopSpeedMultiplier: 1.6,
  bunnyhopMomentumDecayRate: 2.5,
  sharpDirectionChangePenalty: 0.5,
  strafeMomentumBlend: 0.35,
  minForwardHopInput: 0.45,
};

export type MotorState = Readonly<{
  position: Vector3;
  velocity: Vector3;
  grounded: boolean;
  yaw: number;
  crouched: boolean;
  crouchAmount: number;
  consecutiveHopCount: number;
  bunnyhopMomentumMultiplier: number;
  horizontalSpeed: number;
}>;

export class PlayerMotor {
  private readonly config: PlayerMotorConfig;
  private velocity = Vector3.Zero();
  private grounded = false;
  private yaw = 0;
  private wantsCrouch = false;
  private crouchAmount = 0;
  private consecutiveHopCount = 0;
  private bunnyhopMomentumMultiplier = 1;
  private timeSinceLanding = Number.POSITIVE_INFINITY;
  private previousGrounded = false;
  private wasAirborneBeforeLanding = false;
  private canBunnyhopAfterLanding = false;
  private previousMoveDirection = Vector3.Zero();

  public constructor(
    private readonly body: AbstractMesh,
    config: Partial<PlayerMotorConfig> = {},
  ) {
    this.config = { ...defaultConfig, ...config };
  }

  public get state(): MotorState {
    return {
      position: this.body.position.clone(),
      velocity: this.velocity.clone(),
      grounded: this.grounded,
      yaw: this.yaw,
      crouched: this.wantsCrouch || this.crouchAmount > 0.5,
      crouchAmount: this.crouchAmount,
      consecutiveHopCount: this.consecutiveHopCount,
      bunnyhopMomentumMultiplier: this.bunnyhopMomentumMultiplier,
      horizontalSpeed: new Vector3(this.velocity.x, 0, this.velocity.z).length(),
    };
  }

  public update(dt: number, input: InputSnapshot, cameraYaw: number): void {
    this.updateCrouchIntent(input);
    this.updateCrouchCollider(dt);
    this.updateBunnyhopDecay(dt, input);

    const desiredVelocity = this.getDesiredVelocity(input, cameraYaw);
    const horizontalVelocity = new Vector3(this.velocity.x, 0, this.velocity.z);
    const hasMoveInput = desiredVelocity.lengthSquared() > 0.0001;
    const control = this.grounded ? 1 : this.config.airControl;
    const response = hasMoveInput ? this.config.acceleration : this.config.deceleration;
    const maxDelta = response * control * dt;
    const nextHorizontal = this.moveTowards(horizontalVelocity, desiredVelocity, maxDelta);

    this.velocity.x = nextHorizontal.x;
    this.velocity.z = nextHorizontal.z;

    if (this.grounded && this.velocity.y < 0) {
      this.velocity.y = -0.5;
    }

    if (input.jumpPressed && this.grounded) {
      this.handleJumpMomentum(input, desiredVelocity);
      this.velocity.y = this.config.jumpSpeed;
      this.grounded = false;
    }

    this.velocity.y -= this.config.gravity * dt;
    this.body.moveWithCollisions(this.velocity.scale(dt));
    this.resolveGrounded();
    this.updateLandingTimer(dt);
    this.updateFacing(dt, cameraYaw);
  }

  public setKinematicPosition(position: Vector3): void {
    this.body.position.copyFrom(position);
    this.velocity = Vector3.Zero();
    this.resolveGrounded();
  }

  public addLaunchVelocity(velocity: Vector3): void {
    this.velocity.x += velocity.x;
    this.velocity.y = Math.max(this.velocity.y, velocity.y);
    this.velocity.z += velocity.z;
    this.grounded = false;
    this.previousGrounded = false;
    this.wasAirborneBeforeLanding = true;
  }

  public cancelMotion(): void {
    this.velocity = Vector3.Zero();
  }

  public reset(position: Vector3): void {
    this.body.position.copyFrom(position);
    this.velocity = Vector3.Zero();
    this.grounded = false;
    this.wantsCrouch = false;
    this.crouchAmount = 0;
    this.consecutiveHopCount = 0;
    this.bunnyhopMomentumMultiplier = 1;
    this.timeSinceLanding = Number.POSITIVE_INFINITY;
    this.previousGrounded = false;
    this.wasAirborneBeforeLanding = false;
    this.canBunnyhopAfterLanding = false;
    this.previousMoveDirection = Vector3.Zero();
  }

  private getDesiredVelocity(input: InputSnapshot, cameraYaw: number): Vector3 {
    if (input.moveX === 0 && input.moveZ === 0) {
      return Vector3.Zero();
    }

    const { forward, right } = yawToBasis(cameraYaw);
    const speedMultiplier = this.getMovementSpeedMultiplier(input.adsHeld);
    const canSprint = input.sprintHeld && input.moveZ > 0 && !this.isCrouching() && !input.adsHeld;
    const forwardSpeed = canSprint
      ? this.config.sprintSpeed
      : this.config.walkSpeed * speedMultiplier;
    const strafeSpeed = this.config.walkSpeed * this.config.strafeSpeedMultiplier * speedMultiplier;

    const momentum = this.getBunnyhopMovementMultiplier(input);
    const forwardMomentum = input.moveZ > 0 ? momentum : 1;
    const strafeMomentum = this.lerp(1, momentum, this.config.strafeMomentumBlend);
    const desiredVelocity = forward
      .scale(input.moveZ * forwardSpeed * forwardMomentum)
      .addInPlace(right.scale(input.moveX * strafeSpeed * strafeMomentum));

    this.applySharpDirectionPenalty(desiredVelocity);
    return desiredVelocity;
  }

  private handleJumpMomentum(input: InputSnapshot, desiredVelocity: Vector3): void {
    if (!this.canUseBunnyhop(input) || input.moveZ < this.config.minForwardHopInput) {
      this.resetBunnyhopMomentum();
      return;
    }

    const landedRecently =
      this.canBunnyhopAfterLanding && this.timeSinceLanding <= this.config.bunnyhopTimingWindow;

    if (!landedRecently) {
      this.resetBunnyhopMomentum();
      this.canBunnyhopAfterLanding = false;
      this.previousMoveDirection = this.horizontalDirection(desiredVelocity);
      return;
    }

    const forwardStrength = clamp(input.moveZ, 0, 1);
    const gain = this.config.bunnyhopMomentumGain * forwardStrength;

    this.consecutiveHopCount += 1;
    this.bunnyhopMomentumMultiplier = Math.min(
      this.bunnyhopMomentumMultiplier * (1 + gain),
      this.config.maxBunnyhopSpeedMultiplier,
    );
    this.canBunnyhopAfterLanding = false;
    this.previousMoveDirection = this.horizontalDirection(desiredVelocity);
  }

  private updateBunnyhopDecay(dt: number, input: InputSnapshot): void {
    if (!this.canUseBunnyhop(input)) {
      this.resetBunnyhopMomentum();
      return;
    }

    const missedHopWindow = this.grounded && this.timeSinceLanding > this.config.bunnyhopTimingWindow;
    const noForwardIntent = input.moveZ <= 0;

    if (missedHopWindow || noForwardIntent) {
      this.decayBunnyhopMomentum(dt);
    }
  }

  private getBunnyhopMovementMultiplier(input: InputSnapshot): number {
    if (!this.canUseBunnyhop(input)) {
      return 1;
    }

    return this.bunnyhopMomentumMultiplier;
  }

  private canUseBunnyhop(input: InputSnapshot): boolean {
    return !input.adsHeld && !this.isCrouching();
  }

  private applySharpDirectionPenalty(desiredVelocity: Vector3): void {
    if (this.bunnyhopMomentumMultiplier <= 1.001) {
      this.previousMoveDirection = this.horizontalDirection(desiredVelocity);
      return;
    }

    const direction = this.horizontalDirection(desiredVelocity);

    if (direction.lengthSquared() === 0) {
      return;
    }

    if (this.previousMoveDirection.lengthSquared() > 0) {
      const dot = Vector3.Dot(direction, this.previousMoveDirection);

      if (dot < 0.35) {
        const bonus = this.bunnyhopMomentumMultiplier - 1;
        this.bunnyhopMomentumMultiplier = 1 + bonus * (1 - this.config.sharpDirectionChangePenalty);
      }
    }

    this.previousMoveDirection = direction;
  }

  private updateLandingTimer(dt: number): void {
    if (this.grounded && !this.previousGrounded) {
      this.timeSinceLanding = 0;
      this.canBunnyhopAfterLanding = this.wasAirborneBeforeLanding;
      this.wasAirborneBeforeLanding = false;
    } else if (this.grounded) {
      this.timeSinceLanding += dt;
    } else {
      this.timeSinceLanding = Number.POSITIVE_INFINITY;
      this.wasAirborneBeforeLanding = true;
    }

    this.previousGrounded = this.grounded;
  }

  private decayBunnyhopMomentum(dt: number): void {
    if (this.bunnyhopMomentumMultiplier <= 1) {
      this.bunnyhopMomentumMultiplier = 1;
      this.consecutiveHopCount = 0;
      return;
    }

    const decay = this.config.bunnyhopMomentumDecayRate * dt;
    this.bunnyhopMomentumMultiplier = Math.max(1, this.bunnyhopMomentumMultiplier - decay);

    if (this.bunnyhopMomentumMultiplier <= 1.001) {
      this.resetBunnyhopMomentum();
    }
  }

  private resetBunnyhopMomentum(): void {
    this.consecutiveHopCount = 0;
    this.bunnyhopMomentumMultiplier = 1;
    this.canBunnyhopAfterLanding = false;
  }

  private horizontalDirection(vector: Vector3): Vector3 {
    const horizontal = new Vector3(vector.x, 0, vector.z);
    const length = horizontal.length();

    return length > 0.0001 ? horizontal.scale(1 / length) : Vector3.Zero();
  }

  private updateCrouchIntent(input: InputSnapshot): void {
    if (input.crouchHeld) {
      this.wantsCrouch = true;
      return;
    }

    this.wantsCrouch = !this.hasStandUpClearance();
  }

  private updateCrouchCollider(dt: number): void {
    if (!this.wantsCrouch && this.crouchAmount > 0 && !this.hasStandUpClearance()) {
      this.wantsCrouch = true;
    }

    const target = this.wantsCrouch ? 1 : 0;
    const blend = 1 - Math.exp(-this.config.crouchSharpness * dt);
    this.crouchAmount += (target - this.crouchAmount) * blend;

    const halfHeight = this.lerp(
      this.config.standingHalfHeight,
      this.config.crouchedHalfHeight,
      this.crouchAmount,
    );

    this.body.ellipsoid.y = halfHeight;
    this.body.ellipsoidOffset.y = halfHeight;
  }

  private hasStandUpClearance(): boolean {
    const currentHalfHeight = this.lerp(
      this.config.standingHalfHeight,
      this.config.crouchedHalfHeight,
      this.crouchAmount,
    );
    const currentHeight = currentHalfHeight * 2;
    const standingHeight = this.config.standingHalfHeight * 2;
    const origin = this.body.position.add(new Vector3(0, currentHeight + 0.02, 0));
    const ray = new Ray(origin, Vector3.Up(), standingHeight - currentHeight + 0.08);
    const hit = this.body.getScene().pickWithRay(ray, (mesh) => {
      return mesh !== this.body && mesh.checkCollisions;
    });

    return !hit?.hit;
  }

  private isCrouching(): boolean {
    return this.wantsCrouch || this.crouchAmount > 0.05;
  }

  private getCrouchSpeedMultiplier(): number {
    return this.lerp(1, this.config.crouchedSpeedMultiplier, this.crouchAmount);
  }

  private getMovementSpeedMultiplier(adsHeld: boolean): number {
    const adsMultiplier = adsHeld ? this.config.adsSpeedMultiplier : 1;
    return this.getCrouchSpeedMultiplier() * adsMultiplier;
  }

  private resolveGrounded(): void {
    const yBefore = this.body.position.y;
    this.body.moveWithCollisions(new Vector3(0, -this.config.groundedProbeDistance, 0));
    const yAfter = this.body.position.y;

    this.grounded = Math.abs(yBefore - yAfter) < 0.0001 && this.velocity.y <= 0;

    if (!this.grounded) {
      this.body.position.y = yBefore;
    }
  }

  private updateFacing(dt: number, cameraYaw: number): void {
    const delta = wrapAngle(cameraYaw - this.yaw);
    const blend = 1 - Math.exp(-this.config.rotationSharpness * dt);
    this.yaw = wrapAngle(this.yaw + delta * blend);
    this.body.rotation.y = this.yaw;
  }

  private moveTowards(current: Vector3, target: Vector3, maxDelta: number): Vector3 {
    const delta = target.subtract(current);
    const distance = delta.length();

    if (distance <= maxDelta || distance === 0) {
      return target.clone();
    }

    return current.add(delta.scale(maxDelta / distance));
  }

  private lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount;
  }
}
