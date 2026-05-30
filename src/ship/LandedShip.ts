import {
  AbstractMesh,
  Color3,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { themeConfig } from "../theme/ThemeConfig";
import type { ShipState } from "./ShipManager";

type ShipPart = Readonly<{
  mesh: AbstractMesh;
  cleanPosition: Vector3;
  cleanRotation: Vector3;
}>;

const cargoAccessLocal = new Vector3(0, 0.15, 3.85);
const launchAccessLocal = new Vector3(-2.75, 0.15, -1.45);
export const landedShipConfig = {
  cargoAccessRadius: 3.15,
  launchAccessRadius: 2.75,
} as const;

// TODO: Multiplayer phases should make this spawn server-authoritative, replicate
// ship damage/extraction state, support shared squad cargo permissions, handle ship
// theft/sabotage events, and decide disconnected player cargo ownership.
export class LandedShip {
  private readonly root: TransformNode;
  private readonly cargoAccess: TransformNode;
  private readonly launchAccess: TransformNode;
  private readonly parts: ShipPart[] = [];
  private readonly materials: StandardMaterial[] = [];
  private readonly warningLight: PointLight;
  private readonly bayLight: PointLight;
  private readonly cargoDebugRing: AbstractMesh;
  private readonly launchDebugRing: AbstractMesh;
  private warningPulse = 0;
  private warningBaseIntensity = 0;
  private warningPulseSpeed = 5.5;
  private landingDustTimer = 0;
  private landingDustStrength = 1;

  public constructor(private readonly scene: Scene, position: Vector3) {
    this.root = new TransformNode("landed-ship-root", scene);
    this.root.position.copyFrom(position);
    this.root.rotation.y = Math.PI;

    this.cargoAccess = new TransformNode("landed-ship-cargo-access", scene);
    this.cargoAccess.parent = this.root;
    this.cargoAccess.position.copyFrom(cargoAccessLocal);

    this.launchAccess = new TransformNode("landed-ship-launch-access", scene);
    this.launchAccess.parent = this.root;
    this.launchAccess.position.copyFrom(launchAccessLocal);

    const hull = this.createMaterial("landed-ship-hull-material", new Color3(0.075, 0.09, 0.12), themeConfig.colors.cyan.scale(0.035));
    const panel = this.createMaterial("landed-ship-panel-material", new Color3(0.13, 0.16, 0.2), themeConfig.colors.cyan.scale(0.06));
    const glass = this.createMaterial("landed-ship-glass-material", new Color3(0.025, 0.12, 0.16), themeConfig.colors.cyan.scale(0.48));
    const light = this.createMaterial("landed-ship-light-material", new Color3(0.08, 0.32, 0.38), themeConfig.colors.cyan.scale(0.82));
    const warning = this.createMaterial("landed-ship-warning-material", new Color3(0.34, 0.12, 0.04), themeConfig.colors.orange.scale(0.66));
    const dust = this.createMaterial("landed-ship-dust-material", new Color3(0.18, 0.19, 0.2), Color3.Black());
    const pad = this.createMaterial("landed-ship-pad-material", new Color3(0.08, 0.09, 0.1), themeConfig.colors.cyan.scale(0.02));
    const crate = this.createMaterial("landed-ship-crate-material", new Color3(0.13, 0.16, 0.2), themeConfig.colors.cyan.scale(0.04));
    const canister = this.createMaterial("landed-ship-canister-material", new Color3(0.08, 0.16, 0.22), themeConfig.colors.cyan.scale(0.18));
    const marker = this.createMaterial("landed-ship-marker-material", new Color3(0.3, 0.16, 0.04), themeConfig.colors.orange.scale(0.22));
    dust.alpha = 0.55;
    pad.alpha = 0.74;

    this.addBox("landed-ship-pad-main", new Vector3(0, 0.018, 0.3), new Vector3(10.5, 0.035, 11.5), pad, false);
    this.addBox("landed-ship-pad-centerline", new Vector3(0, 0.042, 3.3), new Vector3(1.4, 0.035, 5.8), light, false);
    this.addBox("landed-ship-main-hull", new Vector3(0, 1.35, 0), new Vector3(4.8, 1.55, 6.2), hull, true);
    this.addBox("landed-ship-nose", new Vector3(0, 1.42, -3.65), new Vector3(3.45, 1.18, 1.9), hull, true);
    this.addBox("landed-ship-cockpit", new Vector3(0, 2.15, -2.25), new Vector3(2.3, 0.58, 1.35), glass, false);
    this.addBox("landed-ship-cargo-bay", new Vector3(0, 1.1, 3.22), new Vector3(3.3, 1.05, 0.35), panel, true);
    this.addBox("landed-ship-bay-light-left", new Vector3(-1.85, 1.66, 3.52), new Vector3(0.28, 0.22, 0.2), light, false);
    this.addBox("landed-ship-bay-light-right", new Vector3(1.85, 1.66, 3.52), new Vector3(0.28, 0.22, 0.2), light, false);
    this.addBox("landed-ship-warning-beacon", new Vector3(0, 2.42, 2.15), new Vector3(0.44, 0.28, 0.44), warning, false);
    this.addBox("landed-ship-engine-glow-left", new Vector3(-3.0, 1.12, 3.42), new Vector3(0.62, 0.22, 0.86), light, false);
    this.addBox("landed-ship-engine-glow-right", new Vector3(3.0, 1.12, 3.42), new Vector3(0.62, 0.22, 0.86), light, false);

    for (const [index, x, z] of [
      [0, -2.25, -2.1],
      [1, 2.25, -2.1],
      [2, -2.35, 2.25],
      [3, 2.35, 2.25],
    ] as const) {
      const leg = this.addBox(`landed-ship-leg-${index}`, new Vector3(x, 0.55, z), new Vector3(0.38, 1.1, 0.38), panel, true);
      leg.mesh.rotation.z = x < 0 ? -0.16 : 0.16;
      const foot = this.addBox(`landed-ship-foot-${index}`, new Vector3(x, 0.08, z), new Vector3(1.1, 0.16, 0.86), hull, true);
      foot.mesh.rotation.y = z < 0 ? 0.12 : -0.12;
    }

    for (const [index, x] of [[0, -3.0], [1, 3.0]] as const) {
      this.addBox(`landed-ship-wing-${index}`, new Vector3(x, 1.2, 0.15), new Vector3(1.8, 0.24, 4.4), hull, true);
      this.addBox(`landed-ship-thruster-${index}`, new Vector3(x, 1.12, 2.85), new Vector3(0.92, 0.58, 0.78), panel, true);
    }

    this.createFieldBaseProps(crate, canister, marker, light);

    const scorch = MeshBuilder.CreateCylinder(
      "landed-ship-scorch-mark",
      { height: 0.018, diameter: 7.8, tessellation: 40 },
      scene,
    );
    scorch.parent = this.root;
    scorch.position.set(0, 0.02, 0.55);
    scorch.material = dust;
    scorch.checkCollisions = false;
    scorch.metadata = { gameplayTag: "ship-landing-scorch" };
    this.parts.push({
      mesh: scorch,
      cleanPosition: scorch.position.clone(),
      cleanRotation: scorch.rotation.clone(),
    });

    this.warningLight = new PointLight("landed-ship-warning-light", new Vector3(0, 2.8, 2.15), scene);
    this.warningLight.parent = this.root;
    this.warningLight.diffuse = themeConfig.colors.orange;
    this.warningLight.range = 7;
    this.warningLight.intensity = 0;

    this.bayLight = new PointLight("landed-ship-cargo-bay-light", new Vector3(0, 1.5, 4.05), scene);
    this.bayLight.parent = this.root;
    this.bayLight.diffuse = themeConfig.colors.cyan;
    this.bayLight.range = 8;
    this.bayLight.intensity = 0.45;

    this.cargoDebugRing = MeshBuilder.CreateTorus(
      "landed-ship-cargo-access-debug-ring",
      { diameter: landedShipConfig.cargoAccessRadius * 2, thickness: 0.045, tessellation: 40 },
      scene,
    );
    this.cargoDebugRing.parent = this.cargoAccess;
    this.cargoDebugRing.rotation.x = Math.PI / 2;
    this.cargoDebugRing.material = light;
    this.cargoDebugRing.checkCollisions = false;
    this.cargoDebugRing.setEnabled(false);
    this.cargoDebugRing.metadata = { gameplayTag: "ship-cargo-access-debug" };

    this.launchDebugRing = MeshBuilder.CreateTorus(
      "landed-ship-launch-access-debug-ring",
      { diameter: landedShipConfig.launchAccessRadius * 2, thickness: 0.04, tessellation: 40 },
      scene,
    );
    this.launchDebugRing.parent = this.launchAccess;
    this.launchDebugRing.rotation.x = Math.PI / 2;
    this.launchDebugRing.material = warning;
    this.launchDebugRing.checkCollisions = false;
    this.launchDebugRing.setEnabled(false);
    this.launchDebugRing.metadata = { gameplayTag: "ship-launch-access-debug" };
  }

  public get cargoAccessPosition(): Vector3 {
    return this.cargoAccess.getAbsolutePosition();
  }

  public get cargoAccessRadius(): number {
    return landedShipConfig.cargoAccessRadius;
  }

  public get launchAccessPosition(): Vector3 {
    return this.launchAccess.getAbsolutePosition();
  }

  public get launchAccessRadius(): number {
    return landedShipConfig.launchAccessRadius;
  }

  public setCargoAccessDebugVisible(visible: boolean): void {
    this.cargoDebugRing.setEnabled(visible);
    this.launchDebugRing.setEnabled(visible);
  }

  public setEnabled(enabled: boolean): void {
    this.root.setEnabled(enabled);
    this.warningLight.setEnabled(enabled);
    this.bayLight.setEnabled(enabled);
  }

  public applyShipState(state: ShipState): void {
    // TODO: Future ship gameplay can bind these states to repair costs, extraction
    // cooldowns, cargo risk, and landing-quality-specific cargo handling rules.
    this.root.rotation.z = state.landingQuality === "clean"
      ? 0
      : state.landingQuality === "rough"
        ? -0.045
        : 0.095;
    this.root.rotation.x = state.landingQuality === "damaged" ? -0.035 : 0;

    for (const part of this.parts) {
      part.mesh.position.copyFrom(part.cleanPosition);
      part.mesh.rotation.copyFrom(part.cleanRotation);
    }

    this.warningBaseIntensity = state.landingQuality === "clean" || (state.landingQuality === "rough" && state.repaired)
      ? 0
      : state.landingQuality === "rough"
        ? 0.35
        : state.repaired
          ? 0.36
          : 0.9;
    this.warningPulseSpeed = state.repairStatus === "patched" ? 2.8 : state.repaired ? 1.5 : 5.5;
    this.warningLight.intensity = this.warningBaseIntensity;
    this.bayLight.intensity = state.landingQuality === "damaged"
      ? state.repairStatus === "repaired" ? 0.48 : state.repairStatus === "patched" ? 0.34 : 0.22
      : 0.52;

    const damagedPanel = this.parts.find((part) => part.mesh.name === "landed-ship-cargo-bay");
    if (damagedPanel && state.landingQuality === "damaged") {
      damagedPanel.mesh.rotation.z = 0.13;
      damagedPanel.mesh.position.y -= 0.18;
    }

    const warningBeacon = this.parts.find((part) => part.mesh.name === "landed-ship-warning-beacon");
    if (warningBeacon && state.landingQuality === "damaged" && state.repairStatus !== "repaired") {
      warningBeacon.mesh.rotation.y = 0.35;
    }
  }

  public setDescentPose(descentProgress: number, stability: number, alignmentOffset = 0): void {
    const progress = Math.max(0, Math.min(1, descentProgress));
    const instability = 1 - Math.max(0, Math.min(1, stability));
    const altitude = (1 - progress) * 24;
    const forwardOffset = -(1 - progress) * 68;
    const lateralOffset = alignmentOffset * 5.5 * (1 - progress);
    const settle = progress >= 0.96 ? Math.sin((progress - 0.96) * Math.PI * 25) * 0.08 : 0;

    for (const part of this.parts) {
      if (!this.isShipFlightPart(part.mesh.name)) {
        continue;
      }

      part.mesh.position.copyFrom(part.cleanPosition);
      part.mesh.position.x -= lateralOffset;
      part.mesh.position.y += altitude + settle;
      part.mesh.position.z -= forwardOffset;
      part.mesh.rotation.copyFrom(part.cleanRotation);
      part.mesh.rotation.z += Math.sin(progress * Math.PI * 5) * instability * 0.035;
      part.mesh.rotation.x += Math.cos(progress * Math.PI * 4) * instability * 0.025;
    }

    this.bayLight.intensity = 0.56 + (1 - progress) * 0.28;
    this.warningLight.intensity = Math.max(this.warningBaseIntensity, instability * 0.55);
  }

  public settleAfterDescent(state: ShipState): void {
    this.applyShipState(state);
    this.landingDustTimer = 1;
    this.landingDustStrength = state.landingQuality === "clean" ? 0.75 : state.landingQuality === "rough" ? 1.15 : 1.55;
  }

  public update(dt: number): void {
    this.warningPulse += dt;
    this.landingDustTimer = Math.max(0, this.landingDustTimer - dt);
    const scorch = this.parts.find((part) => part.mesh.name === "landed-ship-scorch-mark")?.mesh;
    if (scorch) {
      const pulse = this.landingDustTimer > 0 ? this.landingDustTimer * this.landingDustStrength : 0;
      scorch.scaling.setAll(1 + pulse * 0.16);
      scorch.isVisible = true;
    }

    if (this.warningBaseIntensity <= 0) {
      return;
    }

    this.warningLight.intensity = this.warningBaseIntensity * (0.68 + Math.sin(this.warningPulse * this.warningPulseSpeed) * 0.22);
  }

  public dispose(): void {
    for (const part of this.parts) {
      part.mesh.dispose(false, true);
    }

    for (const material of this.materials) {
      material.dispose();
    }

    this.warningLight.dispose();
    this.bayLight.dispose();
    this.cargoDebugRing.dispose(false, true);
    this.launchDebugRing.dispose(false, true);
    this.cargoAccess.dispose();
    this.launchAccess.dispose();
    this.root.dispose();
  }

  private addBox(
    name: string,
    position: Vector3,
    scaling: Vector3,
    material: StandardMaterial,
    collidable: boolean,
  ): ShipPart {
    const mesh = MeshBuilder.CreateBox(name, { size: 1 }, this.scene);
    mesh.parent = this.root;
    mesh.position.copyFrom(position);
    mesh.scaling.copyFrom(scaling);
    mesh.material = material;
    mesh.checkCollisions = collidable;
    mesh.metadata = { gameplayTag: collidable ? "ship-cover" : "ship-detail" };
    const part = {
      mesh,
      cleanPosition: mesh.position.clone(),
      cleanRotation: mesh.rotation.clone(),
    };
    this.parts.push(part);
    return part;
  }

  private addCylinder(
    name: string,
    position: Vector3,
    height: number,
    diameter: number,
    material: StandardMaterial,
    collidable: boolean,
  ): ShipPart {
    const mesh = MeshBuilder.CreateCylinder(name, { height, diameter, tessellation: 12 }, this.scene);
    mesh.parent = this.root;
    mesh.position.copyFrom(position);
    mesh.material = material;
    mesh.checkCollisions = collidable;
    mesh.metadata = { gameplayTag: collidable ? "ship-field-prop" : "ship-field-detail" };
    const part = {
      mesh,
      cleanPosition: mesh.position.clone(),
      cleanRotation: mesh.rotation.clone(),
    };
    this.parts.push(part);
    return part;
  }

  private createFieldBaseProps(
    crate: StandardMaterial,
    canister: StandardMaterial,
    marker: StandardMaterial,
    light: StandardMaterial,
  ): void {
    for (const [index, x, z, sx, sz] of [
      [0, -5.1, 4.2, 1.4, 1.1],
      [1, -6.4, 3.4, 1.0, 1.3],
      [2, 5.6, 4.4, 1.2, 1.0],
    ] as const) {
      this.addBox(`landed-ship-cargo-crate-${index}`, new Vector3(x, 0.42, z), new Vector3(sx, 0.84, sz), crate, true);
    }

    for (const [index, x, z] of [
      [0, -4.9, -3.9],
      [1, -5.7, -3.3],
      [2, 4.9, -3.7],
    ] as const) {
      this.addCylinder(`landed-ship-oxygen-canister-${index}`, new Vector3(x, 0.58, z), 1.16, 0.42, canister, true);
    }

    const mast = this.addCylinder("landed-ship-beacon-mast", new Vector3(5.6, 1.35, -4.9), 2.7, 0.16, crate, false);
    mast.mesh.rotation.z = 0.08;
    this.addBox("landed-ship-beacon-tip", new Vector3(5.6, 2.82, -4.9), new Vector3(0.42, 0.24, 0.42), light, false);

    for (const [index, x, z] of [
      [0, -4.5, 5.8],
      [1, 4.5, 5.8],
      [2, -5.6, -5.0],
      [3, 5.6, -5.0],
    ] as const) {
      this.addCylinder(`landed-ship-hazard-marker-${index}`, new Vector3(x, 0.34, z), 0.68, 0.38, marker, false);
    }

    for (const [index, x, z, yaw] of [
      [0, -2.3, 5.1, 0.14],
      [1, 2.3, 5.1, -0.14],
      [2, -2.7, -4.9, -0.12],
      [3, 2.7, -4.9, 0.12],
    ] as const) {
      const skid = this.addBox(`landed-ship-skid-mark-${index}`, new Vector3(x, 0.055, z), new Vector3(1.9, 0.025, 0.24), marker, false);
      skid.mesh.rotation.y = yaw;
    }
  }

  private createMaterial(name: string, diffuse: Color3, emissive: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = diffuse;
    material.emissiveColor = emissive;
    material.specularColor = new Color3(0.16, 0.18, 0.22);
    this.materials.push(material);
    return material;
  }

  private isShipFlightPart(name: string): boolean {
    return !(
      name.includes("pad") ||
      name.includes("crate") ||
      name.includes("canister") ||
      name.includes("beacon") ||
      name.includes("hazard-marker") ||
      name.includes("skid-mark") ||
      name.includes("scorch")
    );
  }
}
