import {
  AbstractMesh,
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { EnemyAgent } from "../ai/EnemyAgent";
import type { PlayerHealth } from "../combat/PlayerHealth";
import type { InputSnapshot } from "../input/InputController";
import type { MotorState } from "../world/PlayerMotor";
import type { RaidInventory } from "./RaidInventory";

export type ObjectiveType = "data-cache" | "eliminate-target" | "secure-rare-core";

export type ObjectiveState = Readonly<{
  type: ObjectiveType;
  title: string;
  description: string;
  completed: boolean;
  distance: number;
  progress: number;
  targetPosition: Vector3;
}>;

const objectiveConfig = {
  interactRange: 3,
  searchDuration: 2.25,
};

type ObjectiveDefinition = Readonly<{
  type: ObjectiveType;
  title: string;
  description: string;
  targetPosition: Vector3;
}>;

const definitions: ObjectiveDefinition[] = [
  {
    type: "data-cache",
    title: "Recover Black Box Data",
    description: "Find the marked mining cache and hold E to crack it.",
    targetPosition: new Vector3(30, 0.45, 36),
  },
  {
    type: "eliminate-target",
    title: "Tag the Crater Horror",
    description: "Track the elite Umbra threat and recover its signal shard.",
    targetPosition: new Vector3(-42, 0, 30),
  },
  {
    type: "secure-rare-core",
    title: "Extract Helium-3 Core",
    description: "Find the marked mining rig, secure the Helium-3 core, and extract before the crater goes dark.",
    targetPosition: new Vector3(48, 0.35, -30),
  },
];

export class ObjectiveDirector {
  private readonly markerMaterial: StandardMaterial;
  private readonly completedMarkerMaterial: StandardMaterial;
  private readonly objectiveMaterial: StandardMaterial;
  private marker: AbstractMesh | null = null;
  private objectiveMesh: AbstractMesh | null = null;
  private targetEnemy: EnemyAgent | null = null;
  private definition: ObjectiveDefinition = definitions[0];
  private completed = false;
  private searchProgress = 0;
  private targetKilled = false;

  public constructor(
    private readonly scene: Scene,
    private readonly playerBody: AbstractMesh,
    private readonly playerHealth: PlayerHealth,
  ) {
    this.markerMaterial = new StandardMaterial("objective-marker-material", scene);
    this.markerMaterial.diffuseColor = new Color3(0.1, 0.76, 0.98);
    this.markerMaterial.emissiveColor = new Color3(0.04, 0.28, 0.36);

    this.completedMarkerMaterial = new StandardMaterial("objective-marker-complete-material", scene);
    this.completedMarkerMaterial.diffuseColor = new Color3(0.22, 0.9, 0.38);
    this.completedMarkerMaterial.emissiveColor = new Color3(0.08, 0.32, 0.12);

    this.objectiveMaterial = new StandardMaterial("objective-item-material", scene);
    this.objectiveMaterial.diffuseColor = new Color3(0.2, 0.86, 1);
    this.objectiveMaterial.emissiveColor = new Color3(0.08, 0.34, 0.42);

    this.reset();
  }

  public get state(): ObjectiveState {
    return {
      type: this.definition.type,
      title: this.definition.title,
      description: this.completed ? "Completed - extract to keep the reward." : this.definition.description,
      completed: this.completed,
      distance: 0,
      progress: this.searchProgress / objectiveConfig.searchDuration,
      targetPosition: this.definition.targetPosition.clone(),
    };
  }

  public update(
    dt: number,
    input: InputSnapshot,
    playerState: MotorState,
    inventory: RaidInventory,
  ): ObjectiveState {
    this.targetEnemy?.update(dt, input, playerState);

    if (!this.completed) {
      this.updateObjectiveProgress(dt, input, playerState.position, inventory);
    }

    const distance = this.horizontalDistance(playerState.position, this.definition.targetPosition);
    this.updateMarker();

    return {
      ...this.state,
      distance,
    };
  }

  public reset(): void {
    this.disposeSpawned();
    this.definition = definitions[Math.floor(Math.random() * definitions.length)];
    this.completed = false;
    this.searchProgress = 0;
    this.targetKilled = false;
    this.spawnMarker(this.definition.targetPosition);

    if (this.definition.type === "data-cache") {
      this.spawnDataCache();
    } else if (this.definition.type === "eliminate-target") {
      this.spawnTargetEnemy();
    } else {
      this.spawnRareCore();
    }
  }

  public dispose(): void {
    this.disposeSpawned();
  }

  private updateObjectiveProgress(
    dt: number,
    input: InputSnapshot,
    playerPosition: Vector3,
    inventory: RaidInventory,
  ): void {
    if (this.definition.type === "eliminate-target") {
      if (this.targetKilled) {
        this.complete(inventory, "target-token", 1);
      }
      return;
    }

    const inRange = this.horizontalDistance(playerPosition, this.definition.targetPosition) <= objectiveConfig.interactRange;

    if (!inRange) {
      this.searchProgress = 0;
      return;
    }

    if (this.definition.type === "data-cache") {
      if (!input.interactHeld) {
        this.searchProgress = 0;
        return;
      }

      this.searchProgress = Math.min(objectiveConfig.searchDuration, this.searchProgress + dt);

      if (this.searchProgress >= objectiveConfig.searchDuration) {
        this.complete(inventory, "encrypted-data", 1);
      }
      return;
    }

    if (this.definition.type === "secure-rare-core" && input.interactPressed) {
      this.complete(inventory, "rare-core", 1);
    }
  }

  private complete(
    inventory: RaidInventory,
    type: "encrypted-data" | "target-token" | "rare-core",
    quantity: number,
  ): void {
    const event = inventory.add(type, quantity);

    if (!event) {
      return;
    }

    this.completed = true;
    this.searchProgress = objectiveConfig.searchDuration;
    this.objectiveMesh?.setEnabled(false);
  }

  private spawnMarker(position: Vector3): void {
    this.marker = MeshBuilder.CreateCylinder(
      "objective-marker",
      { height: 0.08, diameter: 4.2, tessellation: 48 },
      this.scene,
    );
    this.marker.position.copyFrom(position.add(new Vector3(0, 0.05, 0)));
    this.marker.material = this.markerMaterial;
    this.marker.checkCollisions = false;
  }

  private spawnDataCache(): void {
    this.objectiveMesh = MeshBuilder.CreateBox(
      "objective-data-cache",
      { width: 1.2, height: 0.7, depth: 0.9 },
      this.scene,
    );
    this.objectiveMesh.position.copyFrom(this.definition.targetPosition);
    this.objectiveMesh.material = this.objectiveMaterial;
    this.objectiveMesh.checkCollisions = true;
  }

  private spawnRareCore(): void {
    this.objectiveMesh = MeshBuilder.CreateSphere(
      "objective-rare-core",
      { diameter: 0.58, segments: 18 },
      this.scene,
    );
    this.objectiveMesh.position.copyFrom(this.definition.targetPosition.add(new Vector3(0, 0.4, 0)));
    this.objectiveMesh.material = this.objectiveMaterial;
    this.objectiveMesh.checkCollisions = false;
  }

  private spawnTargetEnemy(): void {
    this.targetEnemy = new EnemyAgent(
      this.scene,
      {
        id: "objective-target",
        type: "elite",
        spawn: this.definition.targetPosition,
        maxHealth: 175,
        materialColor: new Color3(0.85, 0.18, 0.08),
        patrolPoints: [
          this.definition.targetPosition,
          this.definition.targetPosition.add(new Vector3(-8, 0, -4)),
          this.definition.targetPosition.add(new Vector3(5, 0, 7)),
        ],
        onKilled: () => {
          this.targetKilled = true;
        },
      },
      this.playerBody,
      this.playerHealth,
    );
  }

  private updateMarker(): void {
    if (!this.marker) {
      return;
    }

    this.marker.material = this.completed ? this.completedMarkerMaterial : this.markerMaterial;
  }

  private disposeSpawned(): void {
    this.marker?.dispose();
    this.objectiveMesh?.dispose();
    this.targetEnemy?.dispose();
    this.marker = null;
    this.objectiveMesh = null;
    this.targetEnemy = null;
  }

  private horizontalDistance(a: Vector3, b: Vector3): number {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
}
