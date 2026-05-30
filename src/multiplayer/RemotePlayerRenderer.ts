import {
  AbstractMesh,
  Color3,
  Matrix,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { NetworkPlayerState } from "./MultiplayerTypes";

type RemotePlayerView = {
  root: AbstractMesh;
  body: AbstractMesh;
  label: HTMLDivElement;
  target: NetworkPlayerState;
};

export class RemotePlayerRenderer {
  private readonly players = new Map<string, RemotePlayerView>();
  private readonly material: StandardMaterial;
  private readonly downedMaterial: StandardMaterial;
  private readonly deadMaterial: StandardMaterial;

  public constructor(private readonly scene: Scene) {
    this.material = new StandardMaterial("remote-player-material", scene);
    this.material.diffuseColor = new Color3(0.24, 0.72, 0.92);
    this.downedMaterial = new StandardMaterial("remote-player-downed-material", scene);
    this.downedMaterial.diffuseColor = new Color3(0.95, 0.5, 0.12);
    this.downedMaterial.emissiveColor = new Color3(0.28, 0.12, 0.02);
    this.deadMaterial = new StandardMaterial("remote-player-dead-material", scene);
    this.deadMaterial.diffuseColor = new Color3(0.18, 0.18, 0.2);
  }

  public update(dt: number, states: readonly NetworkPlayerState[]): void {
    const activeIds = new Set(states.map((state) => state.id));

    for (const state of states) {
      const view = this.players.get(state.id) ?? this.createView(state);
      view.target = state;
      view.root.setEnabled(state.status === "active" || state.status === "downed");
      view.body.material = state.status === "downed" ? this.downedMaterial : state.status === "dead" ? this.deadMaterial : this.material;
      this.interpolateView(dt, view);
      this.updateLabel(view);
    }

    for (const [id, view] of this.players) {
      if (activeIds.has(id)) {
        continue;
      }

      view.root.dispose(false, true);
      view.label.remove();
      this.players.delete(id);
    }
  }

  public dispose(): void {
    this.clear();
  }

  public clear(): void {
    for (const view of this.players.values()) {
      view.root.dispose(false, true);
      view.label.remove();
    }

    this.players.clear();
  }

  private createView(state: NetworkPlayerState): RemotePlayerView {
    const root = MeshBuilder.CreateBox(`remote-player-${state.id}`, { size: 1 }, this.scene);
    root.isVisible = false;
    root.checkCollisions = false;

    const body = MeshBuilder.CreateCapsule(
      `remote-player-${state.id}-body`,
      { height: 1.95, radius: 0.38, subdivisions: 8, tessellation: 16 },
      this.scene,
    );
    body.parent = root;
    body.position.y = 0.98;
    body.material = this.material;
    body.checkCollisions = false;

    const label = document.createElement("div");
    label.className = "remote-player-label";
    document.body.append(label);

    const view = { root, body, label, target: state };
    this.players.set(state.id, view);
    return view;
  }

  private interpolateView(dt: number, view: RemotePlayerView): void {
    const blend = 1 - Math.exp(-14 * dt);
    const targetPosition = new Vector3(view.target.x, view.target.y, view.target.z);
    view.root.position = Vector3.Lerp(view.root.position, targetPosition, blend);
    view.root.rotation.y += (view.target.yaw - view.root.rotation.y) * blend;
    view.body.scaling.y = view.target.status === "downed" ? 0.32 : 1 - view.target.crouch * 0.38;
    view.body.position.y = view.target.status === "downed" ? 0.32 : 0.98;
  }

  private updateLabel(view: RemotePlayerView): void {
    const camera = this.scene.activeCamera;

    if (!camera) {
      return;
    }

    const position = Vector3.Project(
      view.root.position.add(new Vector3(0, 2.35, 0)),
      Matrix.Identity(),
      this.scene.getTransformMatrix(),
      camera.viewport.toGlobal(
        this.scene.getEngine().getRenderWidth(),
        this.scene.getEngine().getRenderHeight(),
      ),
    );
    const marker = view.target.pvpState === "hostile" ? "HOSTILE " : "";
    const status = view.target.status === "active" ? "" : ` ${view.target.status.toUpperCase()}`;
    view.label.textContent = `${marker}${view.target.name} ${Math.ceil(view.target.health)}hp ${view.target.currentWeapon}${status}`;
    view.label.style.transform = `translate(${position.x}px, ${position.y}px)`;
    view.label.classList.toggle("hidden", view.target.status !== "active" && view.target.status !== "downed");
  }
}
