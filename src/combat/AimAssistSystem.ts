import { Ray, Scene, UniversalCamera, Vector3 } from "@babylonjs/core";
import type { EnemyDebugState } from "../ai/EnemyAgent";
import type { AimAssistModifier } from "../camera/ThirdPersonCameraRig";
import type { InputSnapshot } from "../input/InputController";
import { wrapAngle } from "../math/angles";
import type { SettingsManager } from "../settings/SettingsManager";

const aimAssistConfig = {
  coneDegrees: 5,
  slowdownMultiplier: 0.55,
  maxRange: 42,
  magnetismSharpness: 5.5,
  maxYawStep: 0.012,
  maxPitchStep: 0.008,
} as const;

export class AimAssistSystem {
  public constructor(
    private readonly scene: Scene,
    private readonly settingsManager: SettingsManager,
  ) {}

  public update(
    dt: number,
    input: InputSnapshot,
    camera: UniversalCamera,
    cameraYaw: number,
    cameraPitch: number,
    enemies: readonly EnemyDebugState[],
  ): AimAssistModifier {
    const settings = this.settingsManager.snapshot;

    if (!settings.gameplay.aimAssistEnabled || input.activeInputMethod !== "controller") {
      return this.emptyModifier;
    }

    const target = this.findTarget(camera, enemies);

    if (!target) {
      return this.emptyModifier;
    }

    const assistMultiplier = input.adsHeld
      ? settings.gameplay.adsAimAssistMultiplier
      : settings.gameplay.hipfireAimAssistMultiplier;
    const strength = settings.gameplay.aimAssistStrength * assistMultiplier;
    const magnetismActive = input.adsHeld || input.fireHeld;
    const lookScale = 1 - (1 - aimAssistConfig.slowdownMultiplier) * strength;

    if (!magnetismActive) {
      return {
        lookScale,
        yawOffset: 0,
        pitchOffset: 0,
      };
    }

    const toTarget = target.subtract(camera.position).normalize();
    const desiredYaw = Math.atan2(toTarget.x, toTarget.z);
    const horizontal = Math.hypot(toTarget.x, toTarget.z);
    const desiredPitch = Math.atan2(toTarget.y, horizontal);
    const blend = Math.min(1, aimAssistConfig.magnetismSharpness * dt * strength);
    const yawOffset = this.clamp(
      wrapAngle(desiredYaw - cameraYaw) * blend,
      -aimAssistConfig.maxYawStep,
      aimAssistConfig.maxYawStep,
    );
    const pitchOffset = this.clamp(
      (desiredPitch - cameraPitch) * blend,
      -aimAssistConfig.maxPitchStep,
      aimAssistConfig.maxPitchStep,
    );

    return {
      lookScale,
      yawOffset,
      pitchOffset,
    };
  }

  private findTarget(camera: UniversalCamera, enemies: readonly EnemyDebugState[]): Vector3 | null {
    const origin = camera.position;
    const forward = camera.getForwardRay(1).direction.normalize();
    const coneDot = Math.cos((aimAssistConfig.coneDegrees * Math.PI) / 180);
    let bestTarget: Vector3 | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const enemy of enemies) {
      if (enemy.health <= 0) {
        continue;
      }

      const target = enemy.position.add(new Vector3(0, 1.05, 0));
      const toTarget = target.subtract(origin);
      const distance = toTarget.length();

      if (distance > aimAssistConfig.maxRange || distance <= 0.001) {
        continue;
      }

      const direction = toTarget.scale(1 / distance);
      const dot = Vector3.Dot(forward, direction);

      if (dot < coneDot || !this.hasLineOfSight(origin, direction, distance)) {
        continue;
      }

      const angleScore = 1 - dot;
      const distanceScore = distance / aimAssistConfig.maxRange * 0.08;
      const score = angleScore + distanceScore;

      if (score < bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }

    return bestTarget;
  }

  private hasLineOfSight(origin: Vector3, direction: Vector3, distance: number): boolean {
    const ray = new Ray(origin, direction, distance + 0.2);
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      return mesh.isEnabled() && mesh.checkCollisions;
    });

    if (!hit?.hit || !hit.pickedMesh || !hit.pickedPoint) {
      return true;
    }

    const metadata = hit.pickedMesh.metadata as { gameplayTag?: string } | null | undefined;

    if (metadata?.gameplayTag === "damageable") {
      return true;
    }

    return Vector3.Distance(origin, hit.pickedPoint) >= distance - 0.35;
  }

  private get emptyModifier(): AimAssistModifier {
    return {
      lookScale: 1,
      yawOffset: 0,
      pitchOffset: 0,
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
