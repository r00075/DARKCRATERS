import {
  Color3,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type { OrbitalDeploymentSequenceState } from "./OrbitalDeploymentSequence";

type CorridorGate = Readonly<{
  root: TransformNode;
  rails: Mesh[];
}>;

export class OrbitalDeploymentScene {
  private readonly root: TransformNode;
  private readonly cyanMaterial: StandardMaterial;
  private readonly amberMaterial: StandardMaterial;
  private readonly whiteMaterial: StandardMaterial;
  private readonly darkMaterial: StandardMaterial;
  private readonly gates: CorridorGate[] = [];
  private readonly motionStreaks: Mesh[] = [];
  private readonly habitatParts: Mesh[] = [];
  private readonly shipRimLight: PointLight;
  private readonly destinationPlate: Mesh;
  private readonly voidVeil: Mesh;
  private enabled = false;

  public constructor(private readonly scene: Scene) {
    this.root = new TransformNode("orbital-deployment-root", scene);
    this.root.setEnabled(false);

    this.cyanMaterial = this.createMaterial("deployment-cyan", new Color3(0.16, 0.82, 1), 0.38);
    this.amberMaterial = this.createMaterial("deployment-amber", new Color3(1, 0.48, 0.1), 0.46);
    this.whiteMaterial = this.createMaterial("deployment-white", new Color3(0.78, 0.9, 1), 0.34);
    this.darkMaterial = this.createMaterial("deployment-dark", new Color3(0.035, 0.046, 0.06), 0.08);

    for (let index = 0; index < 8; index += 1) {
      this.gates.push(this.createGate(index));
    }
    for (let index = 0; index < 18; index += 1) {
      const streak = MeshBuilder.CreateBox(`deployment-motion-streak-${index}`, { size: 1 }, scene);
      streak.parent = this.root;
      streak.scaling.set(0.035, 0.035, 4.8 + (index % 4) * 1.2);
      streak.material = index % 5 === 0 ? this.whiteMaterial : this.cyanMaterial;
      streak.isPickable = false;
      this.motionStreaks.push(streak);
    }

    this.createHabitatCradle();
    this.shipRimLight = new PointLight("deployment-ship-rim-light", new Vector3(0, 10, -50), scene);
    this.shipRimLight.parent = this.root;
    this.shipRimLight.diffuse = new Color3(0.42, 0.7, 0.9);
    this.shipRimLight.range = 34;
    this.shipRimLight.intensity = 0.52;

    this.destinationPlate = MeshBuilder.CreateCylinder("deployment-lunar-target", { diameter: 28, height: 0.08, tessellation: 48 }, scene);
    this.destinationPlate.parent = this.root;
    this.destinationPlate.material = this.darkMaterial;
    this.destinationPlate.isPickable = false;

    this.voidVeil = MeshBuilder.CreateBox("deployment-orbital-shadow-veil", { size: 1 }, scene);
    this.voidVeil.parent = this.root;
    this.voidVeil.position.set(0, 9, -10);
    this.voidVeil.scaling.set(130, 0.06, 90);
    this.voidVeil.material = this.darkMaterial;
    this.voidVeil.isPickable = false;
  }

  public setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) {
      return;
    }

    this.enabled = enabled;
    this.root.setEnabled(enabled);
  }

  public update(state: OrbitalDeploymentSequenceState, landingSitePosition: Vector3): void {
    if (!state.active) {
      this.setEnabled(false);
      return;
    }

    this.setEnabled(true);
    this.root.position.copyFrom(landingSitePosition);
    const signal = state.signalInterferenceActive || state.routeReacquisitionTriggered;
    const alignmentError = Math.abs(state.alignmentOffset - state.targetOffset);
    const earlyTransit = state.phase === "dock-release" || state.phase === "clearance-burn" || state.phase === "transit-corridor";
    const approachReveal = Math.max(0, Math.min(1, (state.descentProgress - 0.42) / 0.5));
    const finalPhase = state.phase === "final-descent" || state.phase === "stabilization-window" || state.phase === "touchdown";
    const shipForward = -(1 - state.descentProgress) * 68;
    const shipAltitude = (1 - state.descentProgress) * 24;
    const shipLane = state.alignmentOffset * 5.5 * (1 - state.descentProgress);

    for (let index = 0; index < this.gates.length; index += 1) {
      const gate = this.gates[index];
      const normalized = (index / this.gates.length + state.totalProgress * 2.4) % 1;
      const forward = shipForward + 16 + normalized * (earlyTransit ? 92 : 62);
      const altitude = shipAltitude + 3.8 - normalized * (earlyTransit ? 5.5 : 8.5);
      const lane = shipLane + state.targetOffset * (5.2 - normalized * 2.2);
      gate.root.position.set(lane, altitude, forward);
      gate.root.rotation.z = state.targetOffset * 0.18 + Math.sin(state.elapsedTotal * 1.2 + index) * (signal ? 0.08 : 0.025);
      const approachFade = finalPhase
        ? Math.max(0.05, 1 - approachReveal * 0.9)
        : Math.max(0.45, 1 - approachReveal * 0.42);
      const size = (0.42 + normalized * 0.24) * approachFade;
      gate.root.scaling.set(size, size, size);

      const unstable = signal && (index + Math.floor(state.elapsedTotal * 5)) % 3 === 0;
      const material = unstable || alignmentError > 0.58 ? this.amberMaterial : index % 4 === 0 ? this.whiteMaterial : this.cyanMaterial;
      for (const rail of gate.rails) {
        rail.material = material;
        rail.isVisible = approachFade > 0.08 && (!unstable || Math.sin(state.elapsedTotal * 18 + index) > -0.25);
      }
    }

    for (let index = 0; index < this.motionStreaks.length; index += 1) {
      const streak = this.motionStreaks[index];
      const normalized = (index / this.motionStreaks.length + state.totalProgress * 4.1) % 1;
      const side = index % 2 === 0 ? -1 : 1;
      const width = 7 + (index % 5) * 2.2;
      streak.position.set(
        shipLane + side * width + Math.sin(state.elapsedTotal * 0.6 + index) * 1.2,
        shipAltitude + 0.8 + (index % 4) * 1.7,
        shipForward - 38 + normalized * 84,
      );
      streak.rotation.y = side * 0.05;
      streak.isVisible = !finalPhase && (!signal || index % 3 !== 0 || Math.sin(state.elapsedTotal * 20 + index) > -0.45);
    }

    this.shipRimLight.position.set(shipLane, shipAltitude + 4.8, shipForward - 2);
    this.shipRimLight.intensity = finalPhase ? 0.28 : earlyTransit ? 0.58 : 0.42;

    this.voidVeil.isVisible = earlyTransit || state.phase === "signal-interference" || state.phase === "route-reacquisition";
    this.voidVeil.position.y = earlyTransit ? 8.5 : 5.8;
    this.voidVeil.scaling.y = 0.04;
    this.voidVeil.scaling.x = 120 * (1 - approachReveal * 0.65);
    this.voidVeil.scaling.z = 86 * (1 - approachReveal * 0.55);

    const cradleVisibility = state.phase === "dock-release" || state.phase === "clearance-burn";
    for (const part of this.habitatParts) {
      part.isVisible = cradleVisibility;
      part.position.z = shipForward - 18 - state.phaseProgress * 10;
    }

    this.destinationPlate.position.set(0, 0.08, 0);
    this.destinationPlate.scaling.setAll(0.42 + state.descentProgress * 0.34);
    this.destinationPlate.isVisible = state.phase === "lunar-approach" ||
      state.phase === "final-descent" ||
      state.phase === "stabilization-window" ||
      state.phase === "touchdown";
  }

  public dispose(): void {
    for (const gate of this.gates) {
      for (const rail of gate.rails) {
        rail.dispose(false, true);
      }
      gate.root.dispose();
    }

    for (const part of this.habitatParts) {
      part.dispose(false, true);
    }
    for (const streak of this.motionStreaks) {
      streak.dispose(false, true);
    }

    this.shipRimLight.dispose();
    this.destinationPlate.dispose(false, true);
    this.voidVeil.dispose(false, true);
    this.cyanMaterial.dispose();
    this.amberMaterial.dispose();
    this.whiteMaterial.dispose();
    this.darkMaterial.dispose();
    this.root.dispose();
  }

  private createGate(index: number): CorridorGate {
    const root = new TransformNode(`deployment-gate-${index}`, this.scene);
    root.parent = this.root;
    const rails: Mesh[] = [];

    rails.push(this.createRail(`deployment-cue-${index}-left-beacon`, new Vector3(-4.6, 0, 0), new Vector3(0.12, 1.4, 0.12), this.cyanMaterial, root));
    rails.push(this.createRail(`deployment-cue-${index}-right-beacon`, new Vector3(4.6, 0, 0), new Vector3(0.12, 1.4, 0.12), this.cyanMaterial, root));
    rails.push(this.createRail(`deployment-cue-${index}-left-bracket`, new Vector3(-3.85, -0.75, 0), new Vector3(1.15, 0.08, 0.08), this.cyanMaterial, root));
    rails.push(this.createRail(`deployment-cue-${index}-right-bracket`, new Vector3(3.85, -0.75, 0), new Vector3(1.15, 0.08, 0.08), this.cyanMaterial, root));
    rails.push(this.createRail(`deployment-cue-${index}-center-pulse`, new Vector3(0, -1.08, 0), new Vector3(0.42, 0.06, 0.42), this.whiteMaterial, root));

    return { root, rails };
  }

  private createRail(name: string, position: Vector3, scaling: Vector3, material: StandardMaterial, parent: TransformNode): Mesh {
    const rail = MeshBuilder.CreateBox(name, { size: 1 }, this.scene);
    rail.parent = parent;
    rail.position.copyFrom(position);
    rail.scaling.copyFrom(scaling);
    rail.material = material;
    rail.isPickable = false;
    return rail;
  }

  private createHabitatCradle(): void {
    const specs: Array<[string, Vector3, Vector3]> = [
      ["deployment-cradle-spine", new Vector3(0, 17, -36), new Vector3(28, 0.6, 1.2)],
      ["deployment-cradle-left", new Vector3(-14, 10, -36), new Vector3(1.1, 14, 1.1)],
      ["deployment-cradle-right", new Vector3(14, 10, -36), new Vector3(1.1, 14, 1.1)],
      ["deployment-cradle-lane-left", new Vector3(-8, 4, -18), new Vector3(0.5, 0.5, 34)],
      ["deployment-cradle-lane-right", new Vector3(8, 4, -18), new Vector3(0.5, 0.5, 34)],
    ];

    for (const [name, position, scaling] of specs) {
      const part = MeshBuilder.CreateBox(name, { size: 1 }, this.scene);
      part.parent = this.root;
      part.position.copyFrom(position);
      part.scaling.copyFrom(scaling);
      part.material = name.includes("lane") ? this.whiteMaterial : this.darkMaterial;
      part.isPickable = false;
      this.habitatParts.push(part);
    }
  }

  private createMaterial(name: string, color: Color3, emissiveScale: number): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color.scale(0.36);
    material.emissiveColor = color.scale(emissiveScale);
    material.specularColor = color.scale(0.2);
    return material;
  }
}
