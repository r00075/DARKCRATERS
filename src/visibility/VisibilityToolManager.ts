import {
  Color3,
  MeshBuilder,
  Scene,
  SpotLight,
  StandardMaterial,
  UniversalCamera,
  Vector3,
  type AbstractMesh,
  type LinesMesh,
} from "@babylonjs/core";
import type { InputSnapshot } from "../input/InputController";
import type { PlayerCharacter } from "../world/PlayerCharacter";

export type VisibilityToolState = Readonly<{
  flashlightOn: boolean;
  laserOn: boolean;
  nightVisionOn: boolean;
  battery: number;
  hipfireSpreadMultiplier: number;
  enemyDetectionMultiplier: number;
}>;

const visibilityConfig = {
  maxBattery: 100,
  flashlightDrainPerSecond: 0,
  nightVisionDrainPerSecond: 3.4,
  batteryPickupCharge: 35,
  flashlightEnemyDetectionMultiplier: 1.35,
  laserEnemyDetectionMultiplier: 1.14,
  nightVisionEnemyDetectionMultiplier: 1.04,
  laserHipfireSpreadMultiplier: 0.88,
};

export class VisibilityToolManager {
  private readonly flashlight: SpotLight;
  private readonly laserMaterial: StandardMaterial;
  private readonly laserDotMaterial: StandardMaterial;
  private readonly nightVisionOverlay = document.createElement("div");
  private laserLine: LinesMesh | null = null;
  private laserDot: AbstractMesh | null = null;
  private flashlightOn = false;
  private laserOn = false;
  private nightVisionOn = false;
  private battery = visibilityConfig.maxBattery;
  private stateSnapshot: VisibilityToolState = this.createState();

  public constructor(
    private readonly scene: Scene,
    private readonly camera: UniversalCamera,
    private readonly player: PlayerCharacter,
  ) {
    this.flashlight = new SpotLight(
      "player-flashlight",
      camera.position.clone(),
      camera.getForwardRay(1).direction,
      Math.PI / 4.2,
      12,
      scene,
    );
    this.flashlight.diffuse = new Color3(0.78, 0.9, 1);
    this.flashlight.specular = new Color3(0.72, 0.9, 1);
    this.flashlight.range = 42;
    this.flashlight.intensity = 0;

    this.laserMaterial = new StandardMaterial("laser-beam-material", scene);
    this.laserMaterial.emissiveColor = new Color3(1, 0.05, 0.02);
    this.laserMaterial.diffuseColor = new Color3(1, 0.05, 0.02);
    this.laserMaterial.alpha = 0.62;
    this.laserMaterial.disableLighting = true;

    this.laserDotMaterial = new StandardMaterial("laser-dot-material", scene);
    this.laserDotMaterial.emissiveColor = new Color3(1, 0.02, 0.02);
    this.laserDotMaterial.diffuseColor = new Color3(1, 0.02, 0.02);
    this.laserDotMaterial.disableLighting = true;

    this.nightVisionOverlay.className = "night-vision-overlay";
    document.body.append(this.nightVisionOverlay);
  }

  public get state(): VisibilityToolState {
    return this.stateSnapshot;
  }

  public toggleFlashlight(): void {
    this.flashlightOn = !this.flashlightOn;
  }

  public toggleLaser(): void {
    this.laserOn = !this.laserOn;
  }

  public update(dt: number, input: InputSnapshot): VisibilityToolState {
    if (input.toggleLaserPressed) {
      this.laserOn = !this.laserOn;
    }

    if (input.toggleNightVisionPressed) {
      this.nightVisionOn = !this.nightVisionOn;
    }

    this.drainBattery(dt);
    this.updateFlashlight();
    this.updateLaser();
    this.nightVisionOverlay.classList.toggle("active", this.nightVisionOn);
    this.stateSnapshot = this.createState();
    return this.stateSnapshot;
  }

  public resetForRaid(): void {
    this.flashlightOn = false;
    this.laserOn = false;
    this.nightVisionOn = false;
    this.battery = visibilityConfig.maxBattery;
    this.stateSnapshot = this.createState();
    this.updateFlashlight();
    this.updateLaser();
    this.nightVisionOverlay.classList.remove("active");
  }

  public addBatteryCharge(quantity: number): void {
    this.battery = Math.min(
      visibilityConfig.maxBattery,
      this.battery + visibilityConfig.batteryPickupCharge * quantity,
    );
    this.stateSnapshot = this.createState();
  }

  public dispose(): void {
    this.flashlight.dispose();
    this.laserLine?.dispose();
    this.laserDot?.dispose();
    this.nightVisionOverlay.remove();
  }

  private drainBattery(dt: number): void {
    const drain =
      (this.flashlightOn ? visibilityConfig.flashlightDrainPerSecond : 0) +
      (this.nightVisionOn ? visibilityConfig.nightVisionDrainPerSecond : 0);

    if (drain <= 0) {
      return;
    }

    this.battery = Math.max(0, this.battery - drain * dt);

    if (this.battery <= 0) {
      this.flashlightOn = false;
      this.nightVisionOn = false;
    }
  }

  private updateFlashlight(): void {
    const ray = this.camera.getForwardRay(42);
    this.flashlight.position = ray.origin.add(ray.direction.scale(0.4));
    this.flashlight.direction = ray.direction;
    this.flashlight.intensity = this.flashlightOn ? 24 : 0;
  }

  private updateLaser(): void {
    this.laserLine?.dispose();
    this.laserLine = null;

    if (!this.laserOn) {
      if (this.laserDot) {
        this.laserDot.setEnabled(false);
      }
      return;
    }

    const ray = this.camera.getForwardRay(35);
    const start = this.player.weaponSocket.getAbsolutePosition().add(new Vector3(0.08, 0.02, 0.22));
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      return mesh.isEnabled() &&
        mesh !== this.player.root &&
        mesh.metadata?.entityType !== "player" &&
        mesh.metadata?.entityType !== "player-socket";
    });
    const end = hit?.hit && hit.pickedPoint
      ? hit.pickedPoint
      : ray.origin.add(ray.direction.scale(35));

    this.laserLine = MeshBuilder.CreateLines("laser-beam", { points: [start, end] }, this.scene);
    this.laserLine.color = new Color3(1, 0.04, 0.02);
    this.laserLine.material = this.laserMaterial;

    if (!this.laserDot) {
      this.laserDot = MeshBuilder.CreateSphere("laser-dot", { diameter: 0.12, segments: 8 }, this.scene);
      this.laserDot.material = this.laserDotMaterial;
    }

    this.laserDot.setEnabled(true);
    this.laserDot.position.copyFrom(end);
  }

  private createState(): VisibilityToolState {
    const activeDetectionMultiplier =
      (this.flashlightOn ? visibilityConfig.flashlightEnemyDetectionMultiplier : 1) *
      (this.laserOn ? visibilityConfig.laserEnemyDetectionMultiplier : 1) *
      (this.nightVisionOn ? visibilityConfig.nightVisionEnemyDetectionMultiplier : 1);

    return {
      flashlightOn: this.flashlightOn,
      laserOn: this.laserOn,
      nightVisionOn: this.nightVisionOn,
      battery: this.battery,
      hipfireSpreadMultiplier: this.laserOn ? visibilityConfig.laserHipfireSpreadMultiplier : 1,
      enemyDetectionMultiplier: activeDetectionMultiplier,
    };
  }
}
