import {
  AbstractMesh,
  MeshBuilder,
  Scene,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import { PlayerAnimationController } from "../animation/PlayerAnimationController";
import type { PlayerHealthSnapshot } from "../combat/PlayerHealth";
import type { CosmeticPalette } from "../cosmetics/CosmeticManager";
import type { InputSnapshot } from "../input/InputController";
import type { WeaponState } from "../weapons/WeaponController";
import { ImportedPlayerModel } from "./ImportedPlayerModel";
import { PlayerMotor, type MotorState } from "./PlayerMotor";
import { StylizedRaiderModel, type StylizedRaiderSockets } from "./StylizedRaiderModel";

export class PlayerCharacter {
  public readonly root: AbstractMesh;
  public readonly weaponSocket: AbstractMesh;
  public readonly sockets: StylizedRaiderSockets;
  private static readonly visibleAlpha = 1;
  private static readonly obstructingAimAlpha = 0.42;
  private static readonly aimFadeSharpness = 16;
  private readonly motor: PlayerMotor;
  private readonly model: StylizedRaiderModel;
  private readonly importedModel: ImportedPlayerModel;
  private readonly animationController: PlayerAnimationController;
  private materialAlpha = PlayerCharacter.visibleAlpha;

  public constructor(scene: Scene, spawnPosition: Vector3) {
    this.root = MeshBuilder.CreateBox("player-root-collider", { size: 1 }, scene);
    this.root.position.copyFrom(spawnPosition);
    this.root.ellipsoid = new Vector3(0.42, 0.98, 0.42);
    this.root.ellipsoidOffset = new Vector3(0, 0.98, 0);
    this.root.checkCollisions = true;
    this.root.isVisible = false;

    this.model = new StylizedRaiderModel(scene, this.root);
    this.importedModel = new ImportedPlayerModel(scene, this.root, () => {
      this.model.setEnabled(false);
      this.importedModel.setAlpha(this.materialAlpha);
      this.updateCrouchVisuals();
    });
    this.weaponSocket = this.model.sockets.weaponHand;
    this.sockets = this.model.sockets;
    this.motor = new PlayerMotor(this.root);
    this.animationController = new PlayerAnimationController(this.model.animationRig);

    // Reserved metadata keeps entity ownership explicit for future network replication.
    this.root.metadata = {
      networkRole: "local-authority",
      entityType: "player",
    };

    void this.importedModel.load().catch((error: unknown) => {
      console.warn("Imported player model failed during startup; placeholder Crater Runner remains active.", error);
    });
  }

  public get state(): MotorState {
    return this.motor.state;
  }

  public get modelStatus(): string {
    return this.importedModel.status === "ready" ? "Imported GLB" : "Placeholder fallback";
  }

  public update(dt: number, input: InputSnapshot, cameraYaw: number): void {
    this.motor.update(dt, input, cameraYaw);
    this.updateCrouchVisuals();
  }

  public setTraversalPosition(position: Vector3): void {
    this.motor.setKinematicPosition(position);
    this.updateCrouchVisuals();
  }

  public addTraversalLaunch(velocity: Vector3): void {
    this.motor.addLaunchVelocity(velocity);
  }

  public cancelTraversalMotion(): void {
    this.motor.cancelMotion();
  }

  public updateAnimation(
    dt: number,
    input: InputSnapshot,
    weapon: WeaponState,
    health: PlayerHealthSnapshot,
  ): void {
    this.animationController.update(dt, input, this.motor.state, weapon, health);
  }

  public reset(position: Vector3): void {
    this.motor.reset(position);
    this.root.rotation.set(0, 0, 0);
    this.animationController.reset();
    this.materialAlpha = PlayerCharacter.visibleAlpha;
    this.model.setAlpha(this.materialAlpha);
    this.importedModel.setAlpha(this.materialAlpha);
    this.updateCrouchVisuals();
  }

  public applyCosmeticPalette(palette: CosmeticPalette): void {
    this.model.applyCosmeticPalette(palette);
  }

  public updateAimFade(dt: number, camera: UniversalCamera): void {
    const shouldFade = this.isBlockingAimRay(camera);
    const targetAlpha = shouldFade
      ? PlayerCharacter.obstructingAimAlpha
      : PlayerCharacter.visibleAlpha;
    const blend = 1 - Math.exp(-PlayerCharacter.aimFadeSharpness * dt);

    this.materialAlpha += (targetAlpha - this.materialAlpha) * blend;
    this.model.setAlpha(this.materialAlpha);
    this.importedModel.setAlpha(this.materialAlpha);
  }

  private isBlockingAimRay(camera: UniversalCamera): boolean {
    const ray = camera.getForwardRay(8);

    const visualMeshes = this.importedModel.status === "ready"
      ? this.importedModel.visualMeshes
      : this.model.parts.visualMeshes;

    return visualMeshes.some((mesh) => ray.intersectsMesh(mesh, false).hit);
  }

  private updateCrouchVisuals(): void {
    const crouchAmount = this.motor.state.crouchAmount;
    this.model.updateCrouchAccessories(crouchAmount, this.lerp);
    this.importedModel.setCrouchAmount(crouchAmount);
  }

  private lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount;
  }
}
