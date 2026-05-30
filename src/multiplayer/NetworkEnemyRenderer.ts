import {
  AbstractMesh,
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { DamageEvent, DamageResult, Damageable } from "../combat/Damageable";
import type { EnemyDebugState } from "../ai/EnemyAgent";
import { enemyTypeDefinitions, type EnemyRole, type EnemyType } from "../ai/EnemyTypes";
import type { NetworkEnemyState } from "./MultiplayerTypes";

type NetworkEnemyView = {
  root: AbstractMesh;
  body: AbstractMesh;
  head: AbstractMesh;
  headHitbox: AbstractMesh;
  torsoHitbox: AbstractMesh;
  legsHitbox: AbstractMesh;
  target: NetworkEnemyState;
  last: NetworkEnemyState;
  proxy: Damageable;
};

const snapCorrectionDistance = 8;
const interpolationSharpness = 9;

export class NetworkEnemyRenderer {
  private readonly enemies = new Map<string, NetworkEnemyView>();
  private readonly materials = new Map<EnemyType, StandardMaterial>();
  private readonly deadMaterial: StandardMaterial;
  private readonly hitboxMaterial: StandardMaterial;
  private hitboxDebugVisible = false;
  private severeCorrectionCount = 0;

  public constructor(private readonly scene: Scene) {
    this.deadMaterial = new StandardMaterial("network-enemy-dead-material", scene);
    this.deadMaterial.diffuseColor = new Color3(0.16, 0.16, 0.18);
    this.deadMaterial.emissiveColor = Color3.Black();
    this.hitboxMaterial = new StandardMaterial("network-enemy-hitbox-material", scene);
    this.hitboxMaterial.diffuseColor = new Color3(0.15, 0.95, 1);
    this.hitboxMaterial.emissiveColor = new Color3(0.04, 0.24, 0.34);
    this.hitboxMaterial.alpha = 0.025;
  }

  public update(dt: number, states: readonly NetworkEnemyState[]): void {
    const activeIds = new Set(states.map((state) => state.id));

    for (const state of states) {
      const view = this.enemies.get(state.id) ?? this.createView(state);
      view.last = view.target;
      view.target = state;
      view.root.setEnabled(state.active || state.state !== "dead");
      view.body.material = state.state === "dead" ? this.deadMaterial : this.materialFor(state.type as EnemyType);
      this.interpolateView(dt, view);
      this.updateHitboxEnabled(view, state.state !== "dead");
    }

    for (const [id, view] of this.enemies) {
      if (activeIds.has(id)) {
        continue;
      }

      view.root.dispose(false, true);
      this.enemies.delete(id);
    }
  }

  public get renderedCount(): number {
    return this.enemies.size;
  }

  public get correctionCount(): number {
    return this.severeCorrectionCount;
  }

  public get debugStates(): EnemyDebugState[] {
    return Array.from(this.enemies.values()).map((view): EnemyDebugState => ({
      id: view.target.id,
      state: view.target.state === "dead" ? "dead" : view.target.state === "alert" ? "alert" : view.target.state,
      health: view.target.health,
      position: view.root.position.clone(),
      target: null,
      coverTarget: null,
      lastKnownPlayerPosition: null,
      type: view.target.type as EnemyType,
      role: this.defaultRoleForType(view.target.type as EnemyType),
      elite: view.target.type === "elite",
      tactic: view.target.active ? "network-authority" : "network-dormant",
    }));
  }

  public setHitboxDebugVisible(visible: boolean): void {
    this.hitboxDebugVisible = visible;
    for (const view of this.enemies.values()) {
      this.updateHitboxEnabled(view, view.target.state !== "dead");
    }
  }

  public despawn(id: string): void {
    const view = this.enemies.get(id);
    if (!view) {
      return;
    }

    view.root.dispose(false, true);
    this.enemies.delete(id);
  }

  public dispose(): void {
    this.clear();
  }

  public clear(_reason = "cleared"): void {
    for (const view of this.enemies.values()) {
      view.root.dispose(false, true);
    }
    this.enemies.clear();
  }

  private createView(state: NetworkEnemyState): NetworkEnemyView {
    const type = state.type as EnemyType;
    const definition = enemyTypeDefinitions[type];
    const root = MeshBuilder.CreateBox(`network-enemy-${state.id}`, { size: 1 }, this.scene);
    root.isVisible = false;
    root.checkCollisions = false;
    root.position.set(state.x, state.y, state.z);
    root.rotation.y = state.yaw;

    const body = MeshBuilder.CreateCapsule(
      `network-enemy-${state.id}-body`,
      {
        height: definition.colliderHeight,
        radius: definition.colliderRadius,
        tessellation: 18,
        subdivisions: 8,
      },
      this.scene,
    );
    body.parent = root;
    body.position.y = definition.visualYOffset;
    body.scaling.set(definition.visualScale.x, definition.visualScale.y, definition.visualScale.z);
    body.material = this.materialFor(type);
    body.checkCollisions = false;
    body.isPickable = false;
    body.metadata = { gameplayTag: "enemy-visual", entityType: "enemy" };

    const head = MeshBuilder.CreateSphere(`network-enemy-${state.id}-head`, { diameter: 0.52, segments: 12 }, this.scene);
    head.parent = root;
    head.position.y = definition.visualYOffset + 0.72 * definition.visualScale.y;
    head.scaling.set(1.18 * definition.visualScale.head, 1.08 * definition.visualScale.head, 1.18 * definition.visualScale.head);
    head.material = this.materialFor(type);
    head.isPickable = false;
    head.metadata = { gameplayTag: "enemy-visual", entityType: "enemy" };

    const proxy = {
      applyDamage: (event: DamageEvent): DamageResult => ({
        appliedDamage: 0,
        killed: false,
        hitZone: event.hitZone,
        point: event.point,
      }),
    };
    const headHitbox = MeshBuilder.CreateSphere(`network-enemy-${state.id}-hitbox-head`, { diameter: 0.95, segments: 10 }, this.scene);
    headHitbox.parent = root;
    headHitbox.position.y = definition.visualYOffset + 0.76 * definition.visualScale.y + definition.hitboxYOffset;
    headHitbox.material = this.hitboxMaterial;
    headHitbox.isPickable = true;
    headHitbox.metadata = { gameplayTag: "damageable", hitZone: "head", target: proxy };

    const torsoHitbox = MeshBuilder.CreateBox(`network-enemy-${state.id}-hitbox-torso`, { width: 1.36, height: 1.36, depth: 1.04 }, this.scene);
    torsoHitbox.parent = root;
    torsoHitbox.position.y = definition.visualYOffset - 0.18 + definition.hitboxYOffset;
    torsoHitbox.material = this.hitboxMaterial;
    torsoHitbox.isPickable = true;
    torsoHitbox.metadata = { gameplayTag: "damageable", hitZone: "body", target: proxy };

    const legsHitbox = MeshBuilder.CreateBox(`network-enemy-${state.id}-hitbox-legs`, { width: 1.1, height: 0.72, depth: 0.92 }, this.scene);
    legsHitbox.parent = root;
    legsHitbox.position.y = definition.visualYOffset - 0.82 + definition.hitboxYOffset;
    legsHitbox.material = this.hitboxMaterial;
    legsHitbox.isPickable = true;
    legsHitbox.metadata = { gameplayTag: "damageable", hitZone: "legs", target: proxy };

    const view = { root, body, head, headHitbox, torsoHitbox, legsHitbox, target: state, last: state, proxy };
    this.enemies.set(state.id, view);
    this.updateHitboxEnabled(view, state.state !== "dead");
    return view;
  }

  private interpolateView(dt: number, view: NetworkEnemyView): void {
    const targetPosition = new Vector3(view.target.x, view.target.y, view.target.z);
    const distance = Vector3.Distance(view.root.position, targetPosition);
    if (distance > snapCorrectionDistance) {
      this.severeCorrectionCount += 1;
      view.root.position.copyFrom(targetPosition);
    } else {
      const blend = 1 - Math.exp(-interpolationSharpness * dt);
      view.root.position = Vector3.Lerp(view.root.position, targetPosition, blend);
    }
    view.root.rotation.y = this.lerpAngle(view.root.rotation.y, view.target.yaw, 1 - Math.exp(-interpolationSharpness * dt));
  }

  private lerpAngle(current: number, target: number, alpha: number): number {
    const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
    return current + delta * alpha;
  }

  private updateHitboxEnabled(view: NetworkEnemyView, alive: boolean): void {
    view.headHitbox.setEnabled(alive);
    view.torsoHitbox.setEnabled(alive);
    view.legsHitbox.setEnabled(alive);
    view.headHitbox.isVisible = this.hitboxDebugVisible;
    view.torsoHitbox.isVisible = this.hitboxDebugVisible;
    view.legsHitbox.isVisible = this.hitboxDebugVisible;
  }

  private materialFor(type: EnemyType): StandardMaterial {
    const existing = this.materials.get(type);
    if (existing) {
      return existing;
    }

    const material = new StandardMaterial(`network-enemy-${type}-material`, this.scene);
    material.diffuseColor = enemyTypeDefinitions[type].materialColor;
    material.emissiveColor = enemyTypeDefinitions[type].materialColor.scale(type === "elite" ? 0.22 : 0.1);
    material.specularColor = new Color3(0.16, 0.12, 0.18);
    this.materials.set(type, material);
    return material;
  }

  private defaultRoleForType(type: EnemyType): EnemyRole {
    if (type === "charger" || type === "grunt") return "rusher";
    if (type === "spitter" || type === "guard") return "support";
    if (type === "elite") return "flanker";
    return "rifleman";
  }
}
