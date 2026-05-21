import {
  AbstractMesh,
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type { DamageEvent, DamageResult, Damageable } from "./Damageable";

export class TargetDummy implements Damageable {
  private readonly root: TransformNode;
  private readonly body: AbstractMesh;
  private readonly head: AbstractMesh;
  private readonly headHitbox: AbstractMesh;
  private readonly torsoHitbox: AbstractMesh;
  private readonly legsHitbox: AbstractMesh;
  private readonly liveMaterial: StandardMaterial;
  private readonly hitMaterial: StandardMaterial;
  private readonly hitboxMaterial: StandardMaterial;
  private health = 100;
  private hitFlashTimer = 0;
  private dead = false;

  public constructor(scene: Scene, position: Vector3) {
    this.root = new TransformNode("target-dummy-root", scene);
    this.root.position.copyFrom(position);

    this.liveMaterial = new StandardMaterial("target-dummy-live-material", scene);
    this.liveMaterial.diffuseColor = new Color3(0.72, 0.24, 0.2);
    this.liveMaterial.specularColor = new Color3(0.08, 0.04, 0.03);

    this.hitMaterial = new StandardMaterial("target-dummy-hit-material", scene);
    this.hitMaterial.diffuseColor = new Color3(1, 0.82, 0.35);
    this.hitMaterial.emissiveColor = new Color3(0.42, 0.22, 0.04);

    this.hitboxMaterial = new StandardMaterial("target-dummy-hitbox-material", scene);
    this.hitboxMaterial.diffuseColor = new Color3(0.08, 0.9, 1);
    this.hitboxMaterial.emissiveColor = new Color3(0.04, 0.24, 0.32);
    this.hitboxMaterial.alpha = 0.04;

    this.body = MeshBuilder.CreateCapsule(
      "target-dummy-body",
      { height: 1.7, radius: 0.42, tessellation: 18, subdivisions: 8 },
      scene,
    );
    this.body.parent = this.root;
    this.body.position.y = 0.85;
    this.body.material = this.liveMaterial;
    this.body.checkCollisions = true;
    this.body.isPickable = false;
    this.body.metadata = { gameplayTag: "target-dummy-visual" };

    this.head = MeshBuilder.CreateSphere(
      "target-dummy-head",
      { diameter: 0.58, segments: 18 },
      scene,
    );
    this.head.parent = this.root;
    this.head.position.y = 1.92;
    this.head.material = this.liveMaterial;
    this.head.checkCollisions = false;
    this.head.isPickable = false;
    this.head.metadata = { gameplayTag: "target-dummy-visual" };

    this.headHitbox = MeshBuilder.CreateSphere("target-dummy-hitbox-head", { diameter: 0.94, segments: 12 }, scene);
    this.headHitbox.parent = this.root;
    this.headHitbox.position.y = 1.92;
    this.headHitbox.material = this.hitboxMaterial;
    this.headHitbox.checkCollisions = false;
    this.headHitbox.metadata = { gameplayTag: "damageable", hitZone: "head", target: this };

    this.torsoHitbox = MeshBuilder.CreateBox("target-dummy-hitbox-torso", { width: 1.18, height: 1.34, depth: 0.88 }, scene);
    this.torsoHitbox.parent = this.root;
    this.torsoHitbox.position.y = 0.98;
    this.torsoHitbox.material = this.hitboxMaterial;
    this.torsoHitbox.checkCollisions = false;
    this.torsoHitbox.metadata = { gameplayTag: "damageable", hitZone: "body", target: this };

    this.legsHitbox = MeshBuilder.CreateBox("target-dummy-hitbox-legs", { width: 0.98, height: 0.74, depth: 0.76 }, scene);
    this.legsHitbox.parent = this.root;
    this.legsHitbox.position.y = 0.28;
    this.legsHitbox.material = this.hitboxMaterial;
    this.legsHitbox.checkCollisions = false;
    this.legsHitbox.metadata = { gameplayTag: "damageable", hitZone: "legs", target: this };
  }

  public update(dt: number): void {
    if (this.dead) {
      return;
    }

    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    const material = this.hitFlashTimer > 0 ? this.hitMaterial : this.liveMaterial;
    this.body.material = material;
    this.head.material = material;
  }

  public applyDamage(event: DamageEvent): DamageResult {
    if (this.dead) {
      return {
        appliedDamage: 0,
        killed: true,
        hitZone: event.hitZone,
        point: event.point.clone(),
      };
    }

    this.health = Math.max(0, this.health - event.amount);
    this.hitFlashTimer = 0.08;

    if (this.health === 0) {
      this.die();
    }

    return {
      appliedDamage: event.amount,
      killed: this.dead,
      hitZone: event.hitZone,
      point: event.point.clone(),
    };
  }

  public dispose(): void {
    this.root.dispose(false, true);
  }

  public reset(position?: Vector3): void {
    this.health = 100;
    this.hitFlashTimer = 0;
    this.dead = false;
    this.root.setEnabled(true);
    this.root.rotation.set(0, 0, 0);
    if (position) {
      this.root.position.copyFrom(position);
    } else {
      this.root.position.y = 0;
    }
    this.body.checkCollisions = true;
    this.head.checkCollisions = false;
    this.headHitbox.setEnabled(true);
    this.torsoHitbox.setEnabled(true);
    this.legsHitbox.setEnabled(true);
    this.body.material = this.liveMaterial;
    this.head.material = this.liveMaterial;
  }

  private die(): void {
    this.dead = true;
    this.body.checkCollisions = false;
    this.head.checkCollisions = false;
    this.headHitbox.setEnabled(false);
    this.torsoHitbox.setEnabled(false);
    this.legsHitbox.setEnabled(false);
    this.root.rotation.z = Math.PI / 2;
    this.root.position.y = 0.18;
    setTimeout(() => {
      this.root.setEnabled(false);
    }, 900);
  }
}
