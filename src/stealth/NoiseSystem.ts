import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
  type AbstractMesh,
} from "@babylonjs/core";
import type { EnvironmentGameplayModifiers } from "../environment/EnvironmentManager";
import type { InputSnapshot } from "../input/InputController";
import type { MotorState } from "../world/PlayerMotor";

export type NoiseEventType =
  | "walk"
  | "sprint"
  | "crouch-walk"
  | "jump"
  | "land"
  | "fire-unsuppressed"
  | "fire-suppressed"
  | "loot"
  | "heal"
  | "clear-jam"
  | "jump-pad";

export type NoiseEvent = Readonly<{
  type: NoiseEventType;
  position: Vector3;
  radius: number;
  strength: number;
  ttl: number;
}>;

export type NoiseSystemState = Readonly<{
  recentType: NoiseEventType | null;
  recentRadius: number;
  stealthLabel: string;
  quiet: boolean;
}>;

const noiseConfig = {
  eventTtl: 0.35,
  footstepInterval: 0.42,
  crouchFootstepInterval: 0.62,
  radii: {
    walk: 7,
    sprint: 18,
    "crouch-walk": 3.5,
    jump: 9,
    land: 12,
    "fire-unsuppressed": 34,
    "fire-suppressed": 13,
    loot: 8,
    heal: 7,
    "clear-jam": 6,
    "jump-pad": 24,
  } satisfies Record<NoiseEventType, number>,
};

export class NoiseSystem {
  private readonly debugMaterial: StandardMaterial;
  private readonly debugCircles: Array<{ mesh: AbstractMesh; ttl: number }> = [];
  private readonly events: NoiseEvent[] = [];
  private footstepTimer = 0;
  private previousGrounded = false;
  private hasMotorSample = false;
  private recentType: NoiseEventType | null = null;
  private recentRadius = 0;
  private recentTimer = 0;

  public constructor(private readonly scene: Scene) {
    this.debugMaterial = new StandardMaterial("noise-debug-material", scene);
    this.debugMaterial.emissiveColor = new Color3(0.38, 0.82, 1);
    this.debugMaterial.disableLighting = true;
    this.debugMaterial.alpha = 0.4;
  }

  public update(
    dt: number,
    input: InputSnapshot,
    motor: MotorState,
    environment: EnvironmentGameplayModifiers,
  ): NoiseSystemState {
    this.updateDebug(dt);
    this.updateRecent(dt);
    this.updateMovementNoise(dt, input, motor, environment);
    return this.stateFor(input, motor);
  }

  public emit(type: NoiseEventType, position: Vector3, environment: EnvironmentGameplayModifiers, multiplier = 1): void {
    const radius = noiseConfig.radii[type] * environment.alertPropagationMultiplier * multiplier;
    const event: NoiseEvent = {
      type,
      position: position.clone(),
      radius,
      strength: radius / noiseConfig.radii.sprint,
      ttl: noiseConfig.eventTtl,
    };

    this.events.push(event);
    this.recentType = type;
    this.recentRadius = radius;
    this.recentTimer = 1.4;
    this.spawnDebugCircle(event);
  }

  public consumeEvents(): NoiseEvent[] {
    const active = this.events.map((event) => ({
      ...event,
      position: event.position.clone(),
    }));
    this.events.length = 0;
    return active;
  }

  public reset(): void {
    this.events.length = 0;
    this.footstepTimer = 0;
    this.previousGrounded = false;
    this.hasMotorSample = false;
    this.recentType = null;
    this.recentRadius = 0;
    this.recentTimer = 0;

    for (const circle of this.debugCircles) {
      circle.mesh.dispose();
    }

    this.debugCircles.length = 0;
  }

  public dispose(): void {
    this.reset();
    this.debugMaterial.dispose();
  }

  private updateMovementNoise(
    dt: number,
    input: InputSnapshot,
    motor: MotorState,
    environment: EnvironmentGameplayModifiers,
  ): void {
    const moving = Math.hypot(input.moveX, input.moveZ) > 0.1 && motor.horizontalSpeed > 0.45;
    const sprinting = input.sprintHeld && input.moveZ > 0 && !input.crouchHeld && !input.adsHeld;
    const interval = motor.crouched ? noiseConfig.crouchFootstepInterval : noiseConfig.footstepInterval;

    if (moving && motor.grounded) {
      this.footstepTimer -= dt;

      if (this.footstepTimer <= 0) {
        this.emit(
          sprinting ? "sprint" : motor.crouched ? "crouch-walk" : "walk",
          motor.position,
          environment,
        );
        this.footstepTimer = sprinting ? interval * 0.72 : interval;
      }
    } else {
      this.footstepTimer = 0;
    }

    if (input.jumpPressed && this.previousGrounded && !motor.grounded) {
      this.emit("jump", motor.position, environment);
    }

    if (this.hasMotorSample && motor.grounded && !this.previousGrounded) {
      this.emit("land", motor.position, environment, Math.min(1.25, Math.max(0.65, motor.horizontalSpeed / 7)));
    }

    this.previousGrounded = motor.grounded;
    this.hasMotorSample = true;
  }

  private stateFor(input: InputSnapshot, motor: MotorState): NoiseSystemState {
    const moving = Math.hypot(input.moveX, input.moveZ) > 0.1 && motor.horizontalSpeed > 0.45;
    const quiet = motor.crouched && moving;
    const stealthLabel = input.sprintHeld && input.moveZ > 0
      ? "Loud"
      : quiet
        ? "Quiet"
        : this.recentTimer > 0
          ? "Noise"
          : "Stealth";

    return {
      recentType: this.recentTimer > 0 ? this.recentType : null,
      recentRadius: this.recentTimer > 0 ? this.recentRadius : 0,
      stealthLabel,
      quiet,
    };
  }

  private updateRecent(dt: number): void {
    this.recentTimer = Math.max(0, this.recentTimer - dt);

    if (this.recentTimer === 0) {
      this.recentType = null;
      this.recentRadius = 0;
    }
  }

  private updateDebug(dt: number): void {
    for (let i = this.debugCircles.length - 1; i >= 0; i -= 1) {
      const circle = this.debugCircles[i];
      circle.ttl -= dt;
      circle.mesh.isVisible = circle.ttl > 0;

      if (circle.ttl > 0) {
        continue;
      }

      circle.mesh.dispose();
      this.debugCircles.splice(i, 1);
    }
  }

  private spawnDebugCircle(event: NoiseEvent): void {
    const circle = MeshBuilder.CreateTorus(
      `noise-debug-${event.type}`,
      { diameter: event.radius * 2, thickness: 0.035, tessellation: 72 },
      this.scene,
    );
    circle.position.copyFrom(event.position);
    circle.position.y = 0.08;
    circle.rotation.x = Math.PI / 2;
    circle.material = this.debugMaterial;
    this.debugCircles.push({ mesh: circle, ttl: event.ttl });
  }
}
