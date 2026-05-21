import { AbstractMesh, Ray, UniversalCamera, Vector3 } from "@babylonjs/core";
import type { InputController } from "../input/InputController";
import { clamp, yawToBasis } from "../math/angles";
import type { SettingsManager } from "../settings/SettingsManager";
import type { PlayerCharacter } from "../world/PlayerCharacter";

const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const cameraTuning = {
  yawSensitivity: 0.0009,
  pitchSensitivity: 0.0008,
  maxLookUpDegrees: 86,
  maxLookDownDegrees: 82,
  followSharpness: 34,
  crouchCameraDrop: 0.52,
  normalFovDegrees: 80,
  adsFovDegrees: 55,
  minNormalCameraDistance: 2.5,
  maxNormalCameraDistance: 6,
  defaultNormalCameraDistance: 4,
  zoomStep: 0.35,
  zoomSmoothingSpeed: 10,
  adsCameraDistance: 1.8,
  normalShoulderOffsetXRight: 0.9,
  normalShoulderOffsetXLeft: -0.9,
  adsShoulderOffsetXRight: 1.35,
  adsShoulderOffsetXLeft: -1.35,
  shoulderSwapTransitionSpeed: 10,
  normalShoulderOffsetY: 1.6,
  adsShoulderOffsetY: 1.68,
  normalAimForwardOffset: 4,
  adsAimForwardOffset: 5,
  normalAimRightBias: 0.68,
  adsAimRightBias: 0.86,
  adsTransitionSpeed: 10,
  recoilRecoverySharpness: 18,
  coverShoulderPeekOffset: 0.42,
  coverAimPeekOffset: 0.24,
  collisionProbeRadius: 0.24,
  collisionPadding: 0.18,
  minimumCollisionDistance: 0.65,
  cameraFocusDistance: 60,
};

export type ShoulderSide = "right" | "left";

export const shoulderSwapConfig = {
  currentShoulderSide: "right" as ShoulderSide,
  normalShoulderOffsetXRight: cameraTuning.normalShoulderOffsetXRight,
  normalShoulderOffsetXLeft: cameraTuning.normalShoulderOffsetXLeft,
  adsShoulderOffsetXRight: cameraTuning.adsShoulderOffsetXRight,
  adsShoulderOffsetXLeft: cameraTuning.adsShoulderOffsetXLeft,
  shoulderSwapTransitionSpeed: cameraTuning.shoulderSwapTransitionSpeed,
} as const;

export type CameraHandlingModifiers = Readonly<{
  adsFovOffsetDegrees: number;
  adsTransitionMultiplier: number;
  adsSensitivityMultiplier: number;
}>;

export type AimAssistModifier = Readonly<{
  lookScale: number;
  yawOffset: number;
  pitchOffset: number;
}>;

export type CoverCameraModifier = Readonly<{
  active: boolean;
  peek: -1 | 0 | 1;
}>;

export class ThirdPersonCameraRig {
  private cameraYaw = 0;
  private pitch = 0.18;
  private adsAmount = 0;
  private recoilOffset = 0;
  private recoilYawOffset = 0;
  private currentShoulderSide: ShoulderSide = shoulderSwapConfig.currentShoulderSide;
  private shoulderSideBlend = 1;
  private normalDistanceTarget = cameraTuning.defaultNormalCameraDistance;
  private normalDistance = cameraTuning.defaultNormalCameraDistance;
  private handlingModifiers: CameraHandlingModifiers = {
    adsFovOffsetDegrees: 0,
    adsTransitionMultiplier: 1,
    adsSensitivityMultiplier: 1,
  };
  private aimAssistModifier: AimAssistModifier = {
    lookScale: 1,
    yawOffset: 0,
    pitchOffset: 0,
  };
  private coverCameraModifier: CoverCameraModifier = {
    active: false,
    peek: 0,
  };
  private traversalLocked = false;
  private readonly lookAtOffset = new Vector3(0, 1.2, 0);

  public constructor(
    private readonly camera: UniversalCamera,
    private readonly target: PlayerCharacter,
    private readonly input: InputController,
    private readonly settingsManager: SettingsManager,
  ) {}

  public get yaw(): number {
    return this.cameraYaw;
  }

  public get aimDirection(): Vector3 {
    return this.getAimDirection(this.cameraYaw, this.pitch);
  }

  public get adsBlend(): number {
    return this.adsAmount;
  }

  public get pitchRadians(): number {
    return this.pitch;
  }

  public get shoulderSide(): ShoulderSide {
    return this.currentShoulderSide;
  }

  public addRecoil(vertical: number, horizontal: number): void {
    this.recoilOffset = Math.min(this.recoilOffset + vertical, 0.24);
    this.recoilYawOffset = clamp(this.recoilYawOffset + horizontal, -0.08, 0.08);
  }

  public setHandlingModifiers(modifiers: CameraHandlingModifiers): void {
    this.handlingModifiers = modifiers;
  }

  public setAimAssistModifier(modifier: AimAssistModifier): void {
    this.aimAssistModifier = modifier;
  }

  public setCoverModifier(modifier: CoverCameraModifier): void {
    this.coverCameraModifier = modifier;
  }

  public setTraversalLocked(locked: boolean): void {
    this.traversalLocked = locked;
  }

  public update(dt: number): void {
    const snapshot = this.input.snapshot;
    const adsHeld = snapshot.adsHeld && !this.traversalLocked;
    this.updateAds(dt, adsHeld);
    this.updateNormalZoom(dt, snapshot.zoomDelta, adsHeld);
    this.updateShoulderSide(dt, snapshot.shoulderSwapPressed);
    this.recoverRecoil(dt);

    const settings = this.settingsManager.snapshot;
    const sensitivityMultiplier = this.lerp(
      1,
      settings.graphics.adsSensitivityMultiplier * this.handlingModifiers.adsSensitivityMultiplier,
      this.adsAmount,
    );
    this.cameraYaw +=
      snapshot.lookX * this.aimAssistModifier.lookScale * cameraTuning.yawSensitivity * sensitivityMultiplier +
      this.aimAssistModifier.yawOffset;
    this.pitch = clamp(
      this.pitch +
        snapshot.lookY * this.aimAssistModifier.lookScale * cameraTuning.pitchSensitivity * sensitivityMultiplier +
        this.aimAssistModifier.pitchOffset,
      -degreesToRadians(cameraTuning.maxLookUpDegrees),
      degreesToRadians(cameraTuning.maxLookDownDegrees),
    );
    this.aimAssistModifier = { lookScale: 1, yawOffset: 0, pitchOffset: 0 };

    const { right } = yawToBasis(this.cameraYaw);
    const targetState = this.target.state;
    const crouchDrop = targetState.crouchAmount * cameraTuning.crouchCameraDrop;
    const targetPosition = targetState.position;
    const lookAt = targetPosition.add(this.lookAtOffset).addInPlace(new Vector3(0, -crouchDrop, 0));
    const coverShoulderOffset = this.coverCameraModifier.active
      ? this.coverCameraModifier.peek * cameraTuning.coverShoulderPeekOffset
      : 0;
    const coverAimOffset = this.coverCameraModifier.active
      ? this.coverCameraModifier.peek * cameraTuning.coverAimPeekOffset
      : 0;
    const normalShoulderOffsetX = this.lerp(
      cameraTuning.normalShoulderOffsetXLeft,
      cameraTuning.normalShoulderOffsetXRight,
      (this.shoulderSideBlend + 1) / 2,
    );
    const adsShoulderOffsetX = this.lerp(
      cameraTuning.adsShoulderOffsetXLeft,
      cameraTuning.adsShoulderOffsetXRight,
      (this.shoulderSideBlend + 1) / 2,
    );
    const shoulderOffsetX = this.lerp(
      normalShoulderOffsetX,
      adsShoulderOffsetX,
      this.adsAmount,
    ) + coverShoulderOffset;
    const shoulderOffsetY = this.lerp(
      cameraTuning.normalShoulderOffsetY,
      cameraTuning.adsShoulderOffsetY,
      this.adsAmount,
    );
    const shoulder = lookAt.add(right.scale(shoulderOffsetX)).addInPlace(
      new Vector3(0, shoulderOffsetY - this.lookAtOffset.y, 0),
    );
    const distance = this.lerp(
      this.normalDistance,
      cameraTuning.adsCameraDistance,
      this.adsAmount,
    );
    const aimDirection = this.getAimDirection(this.cameraYaw, this.pitch);
    const desired = shoulder.subtract(aimDirection.scale(distance));
    const blend = 1 - Math.exp(-cameraTuning.followSharpness * dt);
    const smoothed = Vector3.Lerp(this.camera.position, desired, blend);

    this.camera.position = this.resolveCameraCollision(shoulder, smoothed);
    const recoilAimDirection = this.getAimDirection(
      this.cameraYaw + this.recoilYawOffset,
      this.pitch - this.recoilOffset,
    );
    const recoilBasis = yawToBasis(this.cameraYaw + this.recoilYawOffset);
    const shoulderBias = recoilBasis.right.scale(
      this.lerp(cameraTuning.normalAimRightBias, cameraTuning.adsAimRightBias, this.adsAmount) *
        this.shoulderSideBlend +
        coverAimOffset,
    );
    this.camera.setTarget(
      this.camera.position
        .add(recoilAimDirection.scale(cameraTuning.cameraFocusDistance))
        .addInPlace(shoulderBias.scale(0.08)),
    );
  }

  private updateAds(dt: number, adsHeld: boolean): void {
    const target = adsHeld ? 1 : 0;
    const blend = 1 - Math.exp(cameraTuning.adsTransitionSpeed * this.handlingModifiers.adsTransitionMultiplier * -dt);
    this.adsAmount += (target - this.adsAmount) * blend;
    this.camera.fov = degreesToRadians(
      this.lerp(
        this.settingsManager.snapshot.graphics.fovDegrees,
        cameraTuning.adsFovDegrees + this.handlingModifiers.adsFovOffsetDegrees,
        this.adsAmount,
      ),
    );
  }

  private updateNormalZoom(dt: number, zoomDelta: number, adsHeld: boolean): void {
    if (!adsHeld && zoomDelta !== 0) {
      this.normalDistanceTarget = clamp(
        this.normalDistanceTarget + zoomDelta * cameraTuning.zoomStep,
        cameraTuning.minNormalCameraDistance,
        cameraTuning.maxNormalCameraDistance,
      );
    }

    const blend = 1 - Math.exp(-cameraTuning.zoomSmoothingSpeed * dt);
    this.normalDistance += (this.normalDistanceTarget - this.normalDistance) * blend;
  }

  private updateShoulderSide(dt: number, shoulderSwapPressed: boolean): void {
    if (shoulderSwapPressed) {
      this.currentShoulderSide = this.currentShoulderSide === "right" ? "left" : "right";
    }

    const target = this.currentShoulderSide === "right" ? 1 : -1;
    const blend = 1 - Math.exp(-cameraTuning.shoulderSwapTransitionSpeed * dt);
    this.shoulderSideBlend += (target - this.shoulderSideBlend) * blend;
  }

  private recoverRecoil(dt: number): void {
    const blend = 1 - Math.exp(-cameraTuning.recoilRecoverySharpness * dt);
    this.recoilOffset += (0 - this.recoilOffset) * blend;
    this.recoilYawOffset += (0 - this.recoilYawOffset) * blend;
  }

  private getAimDirection(yaw: number, pitch: number): Vector3 {
    const { forward } = yawToBasis(yaw);
    return forward
      .scale(Math.cos(pitch))
      .addInPlace(new Vector3(0, -Math.sin(pitch), 0))
      .normalize();
  }

  private resolveCameraCollision(pivot: Vector3, desired: Vector3): Vector3 {
    const boom = desired.subtract(pivot);
    const distance = boom.length();

    if (distance <= cameraTuning.minimumCollisionDistance) {
      return desired;
    }

    const direction = boom.scale(1 / distance);
    const ray = new Ray(pivot, direction, distance);
    const hit = this.camera.getScene().pickWithRay(ray, (mesh) => this.canBlockCamera(mesh));

    if (!hit?.hit) {
      return desired;
    }

    const safeDistance = clamp(
      hit.distance - cameraTuning.collisionProbeRadius - cameraTuning.collisionPadding,
      cameraTuning.minimumCollisionDistance,
      distance,
    );
    return pivot.add(direction.scale(safeDistance));
  }

  private canBlockCamera(mesh: AbstractMesh): boolean {
    const metadata = mesh.metadata as { entityType?: string; gameplayTag?: string } | null | undefined;
    const tag = metadata?.gameplayTag;

    if (
      mesh === this.target.root ||
      metadata?.entityType === "player" ||
      metadata?.entityType === "player-socket" ||
      tag === "extraction-zone" ||
      tag === "extraction-beam" ||
      tag === "objective-marker" ||
      tag === "traversal-prompt"
    ) {
      return false;
    }

    return mesh.isEnabled() && mesh.checkCollisions;
  }

  private lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount;
  }
}
