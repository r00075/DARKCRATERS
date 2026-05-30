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
import { yawToBasis } from "../math/angles";
import type { NetworkHeavyCargoPressureState, NetworkHeavyCargoState, NetworkHeavyCargoStatus } from "../multiplayer/MultiplayerTypes";
import type { MotorState } from "../world/PlayerMotor";

export const heliumDrillCoreHeavyCargoId = "heavy-cargo-helium-3-drill-core";
export const heliumDrillCoreObjectiveId = "heavy-objective-core-pit-extract-helium-3-drill-core";

export type HeavyCargoAuthority = "LOCAL" | "SERVER" | "DISCONNECTED";

export type HeavyCargoViewState = Readonly<{
  id: string;
  itemType: "helium-drill-core";
  label: "Helium-3 Drill Core";
  objectiveId: string;
  status: NetworkHeavyCargoStatus;
  authority: HeavyCargoAuthority;
  carrierPlayerId: string | null;
  carriedByLocalPlayer: boolean;
  shipSecured: boolean;
  position: Vector3;
  distanceToPlayer: number;
  distanceToShipCargo: number;
  pressure: NetworkHeavyCargoPressureState;
  pressureTrigger: NetworkHeavyCargoState["pressureTrigger"];
  lastEvent: string;
  movementMultiplier: number;
  weaponBlocked: boolean;
}>;

const heavyCargoConfig = {
  interactRange: 3.2,
  shipSecureRange: 4,
  movementMultiplier: 0.46,
} as const;

export class HeavyCargoManager {
  private readonly root: TransformNode;
  private readonly sourceCore: AbstractMesh;
  private readonly carriedCore: AbstractMesh;
  private readonly securedCore: AbstractMesh;
  private readonly cradleParts: AbstractMesh[] = [];
  private readonly locator: AbstractMesh;
  private readonly coreLight: PointLight;
  private status: NetworkHeavyCargoStatus = "locked";
  private authority: HeavyCargoAuthority = "LOCAL";
  private carrierPlayerId: string | null = null;
  private carriedByLocalPlayer = false;
  private shipSecured = false;
  private position: Vector3;
  private pressure: NetworkHeavyCargoPressureState = "inactive";
  private pressureTrigger: NetworkHeavyCargoState["pressureTrigger"] = "none";
  private lastEvent = "initialized at core pit";

  public constructor(
    private readonly scene: Scene,
    private readonly sourcePosition: Vector3,
  ) {
    this.root = new TransformNode("heavy-cargo-helium-3-root", this.scene);
    this.position = sourcePosition.clone();
    const body = this.material("heavy-core-body-material", new Color3(0.075, 0.085, 0.09), new Color3(0.015, 0.028, 0.03));
    const band = this.material("heavy-core-band-material", new Color3(0.03, 0.26, 0.28), new Color3(0.02, 0.48, 0.52));
    const amber = this.material("heavy-core-amber-material", new Color3(0.33, 0.16, 0.04), new Color3(0.78, 0.34, 0.05));

    this.sourceCore = this.createCoreMesh("heavy-core-source", body, band, amber);
    this.carriedCore = this.createCoreMesh("heavy-core-carried", body, band, amber);
    this.securedCore = this.createCoreMesh("heavy-core-secured", body, band, amber);

    const railMaterial = this.material("heavy-core-cradle-material", new Color3(0.16, 0.14, 0.12), new Color3(0.12, 0.06, 0.015));
    this.cradleParts.push(this.box("heavy-core-cradle-left", new Vector3(-1.25, 0.28, 0), new Vector3(0.18, 0.56, 2.6), railMaterial));
    this.cradleParts.push(this.box("heavy-core-cradle-right", new Vector3(1.25, 0.28, 0), new Vector3(0.18, 0.56, 2.6), railMaterial));
    this.cradleParts.push(this.box("heavy-core-release-clamp-a", new Vector3(0, 1.32, -1), new Vector3(2.8, 0.18, 0.24), amber));
    this.cradleParts.push(this.box("heavy-core-release-clamp-b", new Vector3(0, 1.32, 1), new Vector3(2.8, 0.18, 0.24), amber));

    const locatorMaterial = this.material("heavy-core-locator-material", new Color3(0.04, 0.22, 0.24), new Color3(0.04, 0.46, 0.5));
    this.locator = MeshBuilder.CreateTorus("heavy-core-interaction-locator", { diameter: 4.2, thickness: 0.035, tessellation: 48 }, scene);
    this.locator.material = locatorMaterial;
    this.locator.rotation.x = Math.PI / 2;
    this.locator.checkCollisions = false;
    this.locator.metadata = { gameplayTag: "heavy-cargo-locator" };

    this.coreLight = new PointLight("heavy-core-local-glow", sourcePosition.add(new Vector3(0, 2.2, 0)), scene);
    this.coreLight.diffuse = new Color3(0.12, 0.72, 0.82);
    this.coreLight.intensity = 0.65;
    this.coreLight.range = 9;
    this.reset();
  }

  public get state(): HeavyCargoViewState {
    return this.createState(Vector3.Zero(), Vector3.Zero());
  }

  public get visibleCorePosition(): Vector3 {
    if (this.status === "carried" && this.carriedByLocalPlayer) {
      return this.carriedCore.getAbsolutePosition();
    }
    if (this.shipSecured) {
      return this.securedCore.getAbsolutePosition();
    }
    return this.sourceCore.getAbsolutePosition();
  }

  public reset(): void {
    this.status = "locked";
    this.authority = "LOCAL";
    this.carrierPlayerId = null;
    this.carriedByLocalPlayer = false;
    this.shipSecured = false;
    this.position = this.sourcePosition.clone();
    this.pressure = "inactive";
    this.pressureTrigger = "none";
    this.lastEvent = "initialized at core pit";
    this.updateVisuals(Vector3.Zero(), 0, Vector3.Zero());
  }

  public update(player: MotorState, shipCargoPosition: Vector3): HeavyCargoViewState {
    this.updateVisuals(player.position, player.yaw, shipCargoPosition);
    return this.createState(player.position, shipCargoPosition);
  }

  public canInteract(playerPosition: Vector3, shipCargoPosition: Vector3): boolean {
    const state = this.createState(playerPosition, shipCargoPosition);
    return state.distanceToPlayer <= heavyCargoConfig.interactRange ||
      (state.carriedByLocalPlayer && state.distanceToShipCargo <= heavyCargoConfig.shipSecureRange);
  }

  public tryLocalPickup(playerPosition: Vector3): boolean {
    if (!this.canPickup(playerPosition)) {
      return false;
    }
    this.status = "carried";
    this.carrierPlayerId = "local-player";
    this.carriedByLocalPlayer = true;
    this.pressure = this.pressure === "inactive" ? "triggered" : "active";
    this.pressureTrigger = "core released";
    this.lastEvent = "picked up locally";
    return true;
  }

  public tryLocalRelease(playerPosition: Vector3): boolean {
    if (!this.canRelease(playerPosition)) {
      return false;
    }
    this.status = "available";
    this.position = this.sourcePosition.clone();
    this.lastEvent = "released locally";
    return true;
  }

  public tryLocalDrop(playerPosition: Vector3): boolean {
    if (!this.carriedByLocalPlayer || this.status !== "carried") {
      return false;
    }
    this.status = "dropped";
    this.carrierPlayerId = null;
    this.carriedByLocalPlayer = false;
    this.position = playerPosition.clone();
    this.pressure = this.pressure === "resolved" ? "resolved" : "active";
    this.pressureTrigger = this.pressure === "resolved" ? "core secured" : "core carried";
    this.lastEvent = "dropped locally";
    return true;
  }

  public tryLocalSecure(shipCargoPosition: Vector3): boolean {
    if (!this.carriedByLocalPlayer || this.status !== "carried") {
      return false;
    }
    this.status = "secured";
    this.carrierPlayerId = null;
    this.carriedByLocalPlayer = false;
    this.shipSecured = true;
    this.position = shipCargoPosition.clone();
    this.pressure = "resolved";
    this.pressureTrigger = "core secured";
    this.lastEvent = "secured locally";
    return true;
  }

  public markExtracted(): void {
    if (!this.shipSecured) {
      return;
    }
    this.status = "extracted";
    this.pressure = "resolved";
    this.pressureTrigger = "core secured";
    this.lastEvent = "extracted";
  }

  public applyNetworkState(state: NetworkHeavyCargoState, localPlayerId: string | null): void {
    if (state.id !== heliumDrillCoreHeavyCargoId) {
      return;
    }
    this.authority = "SERVER";
    this.status = state.status;
    this.carrierPlayerId = state.carrierPlayerId;
    this.carriedByLocalPlayer = Boolean(localPlayerId && state.carrierPlayerId === localPlayerId && state.status === "carried");
    this.shipSecured = state.shipSecured;
    this.position = new Vector3(state.position.x, state.position.y, state.position.z);
    this.pressure = state.pressure;
    this.pressureTrigger = state.pressureTrigger;
    this.lastEvent = state.lastEvent;
  }

  public setDisconnected(): void {
    this.authority = "DISCONNECTED";
  }

  public canPickup(playerPosition: Vector3): boolean {
    return (this.status === "available" || this.status === "dropped") &&
      Vector3.Distance(playerPosition, this.position) <= heavyCargoConfig.interactRange;
  }

  public canRelease(playerPosition: Vector3): boolean {
    return this.status === "locked" &&
      Vector3.Distance(playerPosition, this.position) <= heavyCargoConfig.interactRange;
  }

  public dispose(): void {
    this.root.dispose(false, true);
    this.coreLight.dispose();
  }

  private createState(playerPosition: Vector3, shipCargoPosition: Vector3): HeavyCargoViewState {
    const distanceToPlayer = Vector3.Distance(playerPosition, this.position);
    return {
      id: heliumDrillCoreHeavyCargoId,
      itemType: "helium-drill-core",
      label: "Helium-3 Drill Core",
      objectiveId: heliumDrillCoreObjectiveId,
      status: this.status,
      authority: this.authority,
      carrierPlayerId: this.carrierPlayerId,
      carriedByLocalPlayer: this.carriedByLocalPlayer,
      shipSecured: this.shipSecured,
      position: this.position.clone(),
      distanceToPlayer,
      distanceToShipCargo: Vector3.Distance(playerPosition, shipCargoPosition),
      pressure: this.pressure,
      pressureTrigger: this.pressureTrigger,
      lastEvent: this.lastEvent,
      movementMultiplier: this.carriedByLocalPlayer ? heavyCargoConfig.movementMultiplier : 1,
      weaponBlocked: this.carriedByLocalPlayer,
    };
  }

  private updateVisuals(playerPosition: Vector3, playerYaw: number, shipCargoPosition: Vector3): void {
    this.root.position.copyFrom(this.sourcePosition);
    const { forward, right } = yawToBasis(playerYaw);
    const carriedPosition = playerPosition
      .add(right.scale(0.7))
      .addInPlace(forward.scale(-0.82))
      .addInPlace(new Vector3(0, 1.05, 0));
    const securedPosition = shipCargoPosition.add(new Vector3(0, 0.72, 0));
    const worldPosition = this.status === "dropped" ? this.position : this.sourcePosition;

    this.sourceCore.position.copyFrom(worldPosition.add(new Vector3(0, 0.92, 0)).subtract(this.root.position));
    this.sourceCore.rotation.z = Math.PI / 2;
    this.carriedCore.position.copyFrom(carriedPosition.subtract(this.root.position));
    this.carriedCore.rotation.set(0.18, playerYaw + Math.PI / 2, 0.12);
    this.securedCore.position.copyFrom(securedPosition.subtract(this.root.position));
    this.securedCore.rotation.set(0, Math.PI / 2, Math.PI / 2);

    const showWorld = this.status === "locked" || this.status === "available" || this.status === "dropped";
    this.sourceCore.setEnabled(showWorld);
    for (const part of this.cradleParts) {
      part.setEnabled(this.status === "locked" || this.status === "available");
      part.position.y = Math.max(part.position.y, 0);
      part.parent = this.root;
    }
    this.carriedCore.setEnabled(this.status === "carried" && this.carriedByLocalPlayer);
    this.securedCore.setEnabled(this.shipSecured);
    this.locator.setEnabled(showWorld);
    this.locator.position.copyFrom(worldPosition.add(new Vector3(0, 0.07, 0)));
    this.coreLight.position.copyFrom(showWorld ? worldPosition.add(new Vector3(0, 2.1, 0)) : this.shipSecured ? securedPosition.add(new Vector3(0, 1.2, 0)) : carriedPosition);
    this.coreLight.intensity = this.shipSecured ? 0.42 : showWorld ? 0.68 : 0.34;
    if (this.status === "dropped") {
      this.position.y = 0.35;
    }
  }

  private createCoreMesh(name: string, body: StandardMaterial, band: StandardMaterial, amber: StandardMaterial): AbstractMesh {
    const coreRoot = new TransformNode(`${name}-root`, this.scene);
    coreRoot.parent = this.root;
    const barrel = MeshBuilder.CreateCylinder(`${name}-barrel`, { height: 2.25, diameter: 0.62, tessellation: 24 }, this.scene);
    barrel.parent = coreRoot;
    barrel.material = body;
    barrel.rotation.z = Math.PI / 2;
    const bandA = this.box(`${name}-band-a`, new Vector3(-0.72, 0, 0), new Vector3(0.12, 0.78, 0.78), band);
    const bandB = this.box(`${name}-band-b`, new Vector3(0.72, 0, 0), new Vector3(0.12, 0.78, 0.78), band);
    const clamp = this.box(`${name}-hazard-clamp`, new Vector3(0, 0.38, 0), new Vector3(1.75, 0.1, 0.18), amber);
    bandA.parent = coreRoot;
    bandB.parent = coreRoot;
    clamp.parent = coreRoot;
    coreRoot.metadata = { gameplayTag: "heavy-cargo-core", heavyCargoId: heliumDrillCoreHeavyCargoId };
    return coreRoot as unknown as AbstractMesh;
  }

  private box(name: string, position: Vector3, scaling: Vector3, material: StandardMaterial): AbstractMesh {
    const mesh = MeshBuilder.CreateBox(name, { size: 1 }, this.scene);
    mesh.position.copyFrom(position);
    mesh.scaling.copyFrom(scaling);
    mesh.material = material;
    mesh.checkCollisions = false;
    mesh.metadata = { gameplayTag: "heavy-cargo-visual", heavyCargoId: heliumDrillCoreHeavyCargoId };
    return mesh;
  }

  private material(name: string, diffuse: Color3, emissive: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = diffuse;
    material.emissiveColor = emissive;
    material.specularColor = new Color3(0.24, 0.3, 0.34);
    return material;
  }
}
