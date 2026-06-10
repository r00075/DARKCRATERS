import {
  AbstractMesh,
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { EnemyDebugState } from "../ai/EnemyAgent";
import type { EnemyType } from "../ai/EnemyTypes";
import type { InputSnapshot } from "../input/InputController";
import { themeConfig, type LootRarity } from "../theme/ThemeConfig";
import { poiDefinitions, type PoiDefinition } from "../world/MapLayout";
import type { MotorState } from "../world/PlayerMotor";
import type { LootDrop } from "./LootDirector";
import { LootDirector } from "./LootDirector";

export type POIObjectiveType =
  | "secure-cache"
  | "restore-power"
  | "hack-signal-box"
  | "clear-enemy-patrol"
  | "retrieve-core-fragment"
  | "survey-residue-field";

export type POIObjectiveState = Readonly<{
  active: boolean;
  objectives: POIObjectiveView[];
  nearest: POIObjectiveView | null;
  completedCount: number;
  totalCount: number;
}>;

export type POIObjectiveView = Readonly<{
  id: string;
  poiId: string;
  poiName: string;
  type: POIObjectiveType;
  title: string;
  description: string;
  completed: boolean;
  chestUnlocked: boolean;
  progress: number;
  distance: number;
  rewardRarity: LootRarity;
  threatRating: number;
  markerPosition: Vector3;
  contractLinked: boolean;
}>;

export type POIObjectiveSpawnRequest = Readonly<{
  id: string;
  type: EnemyType;
  spawn: Vector3;
  highValueLoot: boolean;
}>;

export type ContractPOIObjectiveTarget = Readonly<{
  poiName: string;
  objectiveType: POIObjectiveType;
}>;

export type POIObjectiveEvent = Readonly<{
  type: "completed" | "chest-unlocked";
  message: string;
  objectiveId: string;
  objectiveType: POIObjectiveType;
  poiId: string;
}>;

type POIObjectiveDefinition = Readonly<{
  id: string;
  poiId: string;
  type: POIObjectiveType;
  title: string;
  description: string;
  position: Vector3;
  threatRating: number;
  duration: number;
  rewardRarity: LootRarity;
  rewardTable: LootDrop[];
  enemyAttraction: number;
  contractLinked: boolean;
}>;

type RuntimePOIObjective = {
  definition: POIObjectiveDefinition;
  marker: AbstractMesh;
  prop: AbstractMesh;
  surveyRing: AbstractMesh | null;
  surveyProgress: AbstractMesh | null;
  lockedChest: AbstractMesh;
  completed: boolean;
  chestUnlocked: boolean;
  progressSeconds: number;
  playerVisited: boolean;
};

const poiObjectiveConfig = {
  minPerRaid: 2,
  maxPerRaid: 4,
  interactRange: 3.4,
  clearPatrolRadius: 24,
  spawnOffset: 8,
} as const;

const poiThreatRatings: Record<string, number> = {
  "abandoned-camp": 1,
  checkpoint: 2,
  "data-shack": 3,
  warehouse: 4,
  "core-pit": 5,
};

const objectiveTypeCopy: Record<POIObjectiveType, { title: string; description: string; duration: number }> = {
  "secure-cache": {
    title: "Secure Cache",
    description: "Hold interact to crack the cache and unlock the reward chest.",
    duration: 2.2,
  },
  "restore-power": {
    title: "Restore Power",
    description: "Hold interact at the fuse box. The lights may call attention.",
    duration: 3,
  },
  "hack-signal-box": {
    title: "Hack Signal Box",
    description: "Hold interact to spike the signal and reveal the chest.",
    duration: 3.4,
  },
  "clear-enemy-patrol": {
    title: "Clear Enemy Patrol",
    description: "Clear hostiles around the POI to unlock the chest.",
    duration: 0,
  },
  "retrieve-core-fragment": {
    title: "Retrieve Core Fragment",
    description: "Grab the unstable fragment and unlock the high-value chest.",
    duration: 1.6,
  },
  "survey-residue-field": {
    title: "Record Signal Trace",
    description: "Enter the residue field and hold scan until the signal trace is recorded.",
    duration: 4.2,
  },
};

export class POIObjectiveManager {
  private readonly markerMaterial: StandardMaterial;
  private readonly completeMaterial: StandardMaterial;
  private readonly propMaterial: StandardMaterial;
  private readonly surveyFieldMaterial: StandardMaterial;
  private readonly surveyProgressMaterial: StandardMaterial;
  private readonly lockedChestMaterials: Record<LootRarity, StandardMaterial>;
  private readonly objectives: RuntimePOIObjective[] = [];
  private readonly pendingSpawnRequests: POIObjectiveSpawnRequest[] = [];
  private readonly pendingEvents: POIObjectiveEvent[] = [];

  public constructor(
    private readonly scene: Scene,
    private readonly lootDirector: LootDirector,
  ) {
    this.markerMaterial = new StandardMaterial("poi-objective-marker-material", scene);
    this.markerMaterial.diffuseColor = themeConfig.colors.cyan;
    this.markerMaterial.emissiveColor = themeConfig.colors.cyan.scale(0.34);

    this.completeMaterial = new StandardMaterial("poi-objective-complete-material", scene);
    this.completeMaterial.diffuseColor = themeConfig.colors.rootGreen;
    this.completeMaterial.emissiveColor = themeConfig.colors.rootGreen.scale(0.38);

    this.propMaterial = new StandardMaterial("poi-objective-prop-material", scene);
    this.propMaterial.diffuseColor = new Color3(0.12, 0.14, 0.22);
    this.propMaterial.emissiveColor = themeConfig.colors.purple.scale(0.22);

    this.surveyFieldMaterial = new StandardMaterial("poi-objective-survey-field-material", scene);
    this.surveyFieldMaterial.diffuseColor = new Color3(0.035, 0.22, 0.2);
    this.surveyFieldMaterial.emissiveColor = themeConfig.colors.rootGreen.scale(0.34).add(themeConfig.colors.cyan.scale(0.12));
    this.surveyFieldMaterial.alpha = 0.54;

    this.surveyProgressMaterial = new StandardMaterial("poi-objective-survey-progress-material", scene);
    this.surveyProgressMaterial.diffuseColor = new Color3(0.04, 0.34, 0.36);
    this.surveyProgressMaterial.emissiveColor = themeConfig.colors.cyan.scale(0.48);
    this.surveyProgressMaterial.alpha = 0.72;

    this.lockedChestMaterials = {
      common: this.createChestMaterial("poi-chest-common-material", "common"),
      uncommon: this.createChestMaterial("poi-chest-uncommon-material", "uncommon"),
      rare: this.createChestMaterial("poi-chest-rare-material", "rare"),
      epic: this.createChestMaterial("poi-chest-epic-material", "epic"),
      legendary: this.createChestMaterial("poi-chest-legendary-material", "legendary"),
      core: this.createChestMaterial("poi-chest-core-material", "core"),
    };
  }

  public get state(): POIObjectiveState {
    const objectives = this.objectives.map((objective) => this.toView(objective, Vector3.Zero()));

    return {
      active: objectives.length > 0,
      objectives,
      nearest: null,
      completedCount: objectives.filter((objective) => objective.completed).length,
      totalCount: objectives.length,
    };
  }

  public reset(contractTarget?: ContractPOIObjectiveTarget | null, deterministic = false): void {
    this.disposeRuntimeObjectives();
    this.pendingSpawnRequests.length = 0;
    this.pendingEvents.length = 0;

    const definitions = this.createRaidDefinitions(contractTarget, deterministic);

    for (const definition of definitions) {
      this.objectives.push(this.createRuntimeObjective(definition));

      if (definition.enemyAttraction > 0) {
        this.queueEnemyAttraction(definition);
      }
    }
  }

  public update(
    dt: number,
    input: InputSnapshot,
    playerState: MotorState,
    enemies: readonly EnemyDebugState[],
  ): POIObjectiveState {
    for (const objective of this.objectives) {
      this.updateObjective(dt, input, playerState.position, enemies, objective);
      this.updateVisuals(objective);
    }

    const views = this.objectives.map((objective) => this.toView(objective, playerState.position));
    const nearest = views
      .filter((objective) => !objective.completed)
      .sort((a, b) => a.distance - b.distance)[0] ?? null;

    return {
      active: views.length > 0,
      objectives: views,
      nearest,
      completedCount: views.filter((objective) => objective.completed).length,
      totalCount: views.length,
    };
  }

  public hasInteractTarget(playerPosition: Vector3): boolean {
    return this.objectives.some((objective) => {
      if (objective.completed || objective.definition.type === "clear-enemy-patrol") {
        return false;
      }

      return this.horizontalDistance(playerPosition, objective.definition.position) <= poiObjectiveConfig.interactRange;
    });
  }

  public consumeSpawnRequests(): POIObjectiveSpawnRequest[] {
    return this.pendingSpawnRequests.splice(0);
  }

  public consumeEvents(): POIObjectiveEvent[] {
    return this.pendingEvents.splice(0);
  }

  public completeNearestForDebug(playerPosition: Vector3): boolean {
    const objective = [...this.objectives]
      .filter((item) => !item.completed)
      .sort((a, b) =>
        this.horizontalDistance(playerPosition, a.definition.position) -
        this.horizontalDistance(playerPosition, b.definition.position),
      )[0];

    if (!objective) {
      return false;
    }

    this.completeObjective(objective);
    return true;
  }

  public completeNearestSurveyFromReveal(playerPosition: Vector3, radius: number): boolean {
    const objective = [...this.objectives]
      .filter((item) => !item.completed && item.definition.type === "survey-residue-field")
      .filter((item) => this.horizontalDistance(playerPosition, item.definition.position) <= radius)
      .sort((a, b) =>
        this.horizontalDistance(playerPosition, a.definition.position) -
        this.horizontalDistance(playerPosition, b.definition.position),
      )[0];

    if (!objective) {
      return false;
    }

    this.createSurveyRevealPulse(objective.definition.position, Math.min(radius, 18));
    this.completeObjective(objective);
    return true;
  }

  public completeFromNetwork(objectiveId: string): boolean {
    const objective = this.objectives.find((item) => item.definition.id === objectiveId);

    if (!objective || objective.completed) {
      return false;
    }

    this.completeObjective(objective);
    return true;
  }

  public dispose(): void {
    this.disposeRuntimeObjectives();
  }

  private updateObjective(
    dt: number,
    input: InputSnapshot,
    playerPosition: Vector3,
    enemies: readonly EnemyDebugState[],
    objective: RuntimePOIObjective,
  ): void {
    if (objective.completed) {
      return;
    }

    const distance = this.horizontalDistance(playerPosition, objective.definition.position);

    if (distance <= poiObjectiveConfig.interactRange) {
      objective.playerVisited = true;
    }

    if (objective.definition.type === "clear-enemy-patrol") {
      const aliveNearby = enemies.some((enemy) => {
        return enemy.state !== "dead" &&
          this.horizontalDistance(enemy.position, objective.definition.position) <= poiObjectiveConfig.clearPatrolRadius;
      });

      if (objective.playerVisited && !aliveNearby) {
        this.completeObjective(objective);
      }
      return;
    }

    if (distance > poiObjectiveConfig.interactRange || !input.interactHeld) {
      objective.progressSeconds = Math.max(0, objective.progressSeconds - dt * 1.75);
      return;
    }

    objective.progressSeconds = Math.min(objective.definition.duration, objective.progressSeconds + dt);

    if (objective.progressSeconds >= objective.definition.duration) {
      this.completeObjective(objective);
    }
  }

  private completeObjective(objective: RuntimePOIObjective): void {
    objective.completed = true;
    objective.chestUnlocked = true;
    objective.progressSeconds = objective.definition.duration;
    objective.lockedChest.setEnabled(false);
    this.lootDirector.spawnEventContainer(
      `${objective.definition.id}-reward-chest`,
      objective.definition.position.add(new Vector3(1.6, 0.45, 0.2)),
      objective.definition.rewardTable,
    );
    this.pendingEvents.push({
      type: "completed",
      objectiveId: objective.definition.id,
      objectiveType: objective.definition.type,
      poiId: objective.definition.poiId,
      message: `${objective.definition.title} complete at ${objective.definition.poiId.replaceAll("-", " ")}`,
    });
    this.pendingEvents.push({
      type: "chest-unlocked",
      objectiveId: objective.definition.id,
      objectiveType: objective.definition.type,
      poiId: objective.definition.poiId,
      message: "Reward chest unlocked",
    });

    if (objective.definition.enemyAttraction >= 4) {
      this.queueEnemyAttraction(objective.definition);
    }
  }

  private createRaidDefinitions(contractTarget?: ContractPOIObjectiveTarget | null, deterministic = false): POIObjectiveDefinition[] {
    const count = deterministic
      ? poiObjectiveConfig.maxPerRaid
      : poiObjectiveConfig.minPerRaid + Math.floor(Math.random() * (poiObjectiveConfig.maxPerRaid - poiObjectiveConfig.minPerRaid + 1));
    const forcedPoi = contractTarget
      ? poiDefinitions.find((poi) => poi.name === contractTarget.poiName || poi.id === contractTarget.poiName)
      : null;
    const orderedPois = [...poiDefinitions]
      .filter((poi) => poi.id !== forcedPoi?.id)
      .sort((a, b) => deterministic ? a.id.localeCompare(b.id) : Math.random() - 0.5);
    const selected = forcedPoi
      ? [forcedPoi, ...orderedPois.slice(0, Math.max(0, count - 1))]
      : orderedPois.slice(0, count);

    return selected.map((poi, index) => {
      const threatRating = poiThreatRatings[poi.id] ?? 1;
      const contractLinked = Boolean(forcedPoi && forcedPoi.id === poi.id && contractTarget);
      const type = contractLinked && contractTarget ? contractTarget.objectiveType : this.pickObjectiveType(poi, index, deterministic);
      const copy = objectiveTypeCopy[type];
      const rewardThreat = contractLinked ? Math.min(5, threatRating + 1) : threatRating;
      const rewardRarity = this.rewardRarityForThreat(rewardThreat);

      return {
        id: `poi-objective-${poi.id}-${type}`,
        poiId: poi.id,
        type,
        title: copy.title,
        description: copy.description,
        position: this.objectivePositionForPoi(poi, index),
        threatRating,
        duration: copy.duration,
        rewardRarity,
        rewardTable: this.rewardTableForThreat(rewardThreat, type),
        enemyAttraction: type === "clear-enemy-patrol" ? threatRating : Math.max(0, threatRating - 2),
        contractLinked,
      };
    });
  }

  private createRuntimeObjective(definition: POIObjectiveDefinition): RuntimePOIObjective {
    const marker = MeshBuilder.CreateCylinder(
      `${definition.id}-marker`,
      { height: 0.08, diameter: 3.2 + definition.threatRating * 0.22, tessellation: 36 },
      this.scene,
    );
    marker.position.copyFrom(definition.position.add(new Vector3(0, 0.06, 0)));
    marker.material = this.markerMaterial;
    marker.checkCollisions = false;
    marker.metadata = { gameplayTag: "poi-objective-marker", objectiveType: definition.type };

    const prop = this.createObjectiveProp(definition);
    const surveyVisuals = this.createSurveyVisuals(definition);
    const lockedChest = MeshBuilder.CreateBox(
      `${definition.id}-locked-chest`,
      { width: 1.35, height: 0.78, depth: 1 },
      this.scene,
    );
    lockedChest.position.copyFrom(definition.position.add(new Vector3(1.6, 0.43, 0.2)));
    lockedChest.material = this.lockedChestMaterials[definition.rewardRarity];
    lockedChest.checkCollisions = true;
    lockedChest.metadata = {
      gameplayTag: "poi-reward-chest-locked",
      rarity: definition.rewardRarity,
      objectiveId: definition.id,
    };

    return {
      definition,
      marker,
      prop,
      surveyRing: surveyVisuals.ring,
      surveyProgress: surveyVisuals.progress,
      lockedChest,
      completed: false,
      chestUnlocked: false,
      progressSeconds: 0,
      playerVisited: false,
    };
  }

  private createObjectiveProp(definition: POIObjectiveDefinition): AbstractMesh {
    const prop = definition.type === "retrieve-core-fragment" || definition.type === "survey-residue-field"
      ? MeshBuilder.CreateSphere(`${definition.id}-prop`, { diameter: 0.62, segments: 16 }, this.scene)
      : MeshBuilder.CreateBox(`${definition.id}-prop`, { width: 0.86, height: 0.94, depth: 0.46 }, this.scene);

    prop.position.copyFrom(definition.position.add(new Vector3(0, definition.type === "retrieve-core-fragment" || definition.type === "survey-residue-field" ? 0.72 : 0.48, 0)));
    prop.material = this.propMaterial;
    prop.checkCollisions = definition.type !== "retrieve-core-fragment";
    prop.metadata = { gameplayTag: "poi-objective-prop", objectiveType: definition.type };
    return prop;
  }

  private createSurveyVisuals(definition: POIObjectiveDefinition): { ring: AbstractMesh | null; progress: AbstractMesh | null } {
    if (definition.type !== "survey-residue-field") {
      return { ring: null, progress: null };
    }

    const ring = MeshBuilder.CreateTorus(
      `${definition.id}-survey-field-ring`,
      { diameter: 6.2, thickness: 0.045, tessellation: 64 },
      this.scene,
    );
    ring.position.copyFrom(definition.position.add(new Vector3(0, 0.09, 0)));
    ring.rotation.x = Math.PI * 0.5;
    ring.material = this.surveyFieldMaterial;
    ring.checkCollisions = false;
    ring.isPickable = false;
    ring.metadata = { gameplayTag: "survey-residue-field", objectiveType: definition.type };

    const progress = MeshBuilder.CreateTorus(
      `${definition.id}-survey-progress-ring`,
      { diameter: 3.1, thickness: 0.05, tessellation: 48 },
      this.scene,
    );
    progress.position.copyFrom(definition.position.add(new Vector3(0, 0.13, 0)));
    progress.rotation.x = Math.PI * 0.5;
    progress.material = this.surveyProgressMaterial;
    progress.checkCollisions = false;
    progress.isPickable = false;
    progress.metadata = { gameplayTag: "survey-residue-progress", objectiveType: definition.type };

    return { ring, progress };
  }

  private queueEnemyAttraction(definition: POIObjectiveDefinition): void {
    const spawnCount = definition.threatRating >= 4 ? 2 : 1;

    for (let index = 0; index < spawnCount; index += 1) {
      const offset = new Vector3(
        (index === 0 ? -1 : 1) * poiObjectiveConfig.spawnOffset,
        0,
        index === 0 ? 4 : -5,
      );
      const type: EnemyType = definition.threatRating >= 5
        ? "elite"
        : definition.threatRating >= 4
          ? "guard"
          : definition.type === "retrieve-core-fragment"
            ? "spitter"
          : definition.type === "clear-enemy-patrol"
            ? "charger"
            : "grunt";

      this.pendingSpawnRequests.push({
        id: `${definition.id}-guard-${index + 1}`,
        type,
        spawn: definition.position.add(offset),
        highValueLoot: definition.threatRating >= 4,
      });
    }
  }

  private updateVisuals(objective: RuntimePOIObjective): void {
    objective.marker.material = objective.completed ? this.completeMaterial : this.markerMaterial;
    objective.prop.setEnabled(!objective.completed);
    objective.marker.rotation.y += 0.018;
    objective.lockedChest.rotation.y = Math.sin(performance.now() * 0.0018) * 0.05;
    if (objective.surveyRing) {
      const progress = objective.definition.duration > 0 ? objective.progressSeconds / objective.definition.duration : Number(objective.completed);
      const pulse = 1 + Math.sin(performance.now() * 0.0032) * 0.035;
      const stable = objective.completed ? 0.78 : 1;
      objective.surveyRing.setEnabled(true);
      objective.surveyRing.rotation.z += objective.completed ? 0.003 : 0.008;
      objective.surveyRing.scaling.set(stable * pulse, stable * pulse, stable * pulse);
      objective.surveyRing.material = objective.completed ? this.completeMaterial : this.surveyFieldMaterial;
      if (objective.surveyProgress) {
        objective.surveyProgress.setEnabled(!objective.completed && progress > 0);
        const scale = Math.max(0.24, progress);
        objective.surveyProgress.scaling.set(scale, scale, scale);
        objective.surveyProgress.rotation.z -= 0.014;
      }
    }
  }

  private createSurveyRevealPulse(position: Vector3, radius: number): void {
    const pulse = MeshBuilder.CreateTorus(
      "survey-residue-flare-response",
      { diameter: 1.3, thickness: 0.035, tessellation: 64 },
      this.scene,
    );
    pulse.position.copyFrom(position.add(new Vector3(0, 0.18, 0)));
    pulse.rotation.x = Math.PI * 0.5;
    pulse.material = this.surveyProgressMaterial;
    pulse.checkCollisions = false;
    pulse.isPickable = false;
    const startedAt = performance.now();
    const observer = this.scene.onBeforeRenderObservable.add(() => {
      const t = Math.min(1, (performance.now() - startedAt) / 850);
      const scale = Math.max(0.1, radius * t);
      pulse.scaling.set(scale, scale, scale);
      if (t >= 1) {
        this.scene.onBeforeRenderObservable.remove(observer);
        pulse.dispose(false, false);
      }
    });
  }

  private toView(objective: RuntimePOIObjective, playerPosition: Vector3): POIObjectiveView {
    const definition = objective.definition;
    const poi = poiDefinitions.find((item) => item.id === definition.poiId);

    return {
      id: definition.id,
      poiId: definition.poiId,
      poiName: poi?.name ?? definition.poiId,
      type: definition.type,
      title: definition.title,
      description: objective.completed
        ? `${definition.poiId.replaceAll("-", " ")} chest unlocked.`
        : definition.description,
      completed: objective.completed,
      chestUnlocked: objective.chestUnlocked,
      progress: definition.duration > 0 ? objective.progressSeconds / definition.duration : objective.completed ? 1 : 0,
      distance: this.horizontalDistance(playerPosition, definition.position),
      rewardRarity: definition.rewardRarity,
      threatRating: definition.threatRating,
      markerPosition: definition.position.clone(),
      contractLinked: definition.contractLinked,
    };
  }

  private pickObjectiveType(poi: PoiDefinition, index: number, deterministic = false): POIObjectiveType {
    if (poi.id === "core-pit") {
      return "retrieve-core-fragment";
    }

    if (poi.id === "data-shack") {
      return "hack-signal-box";
    }

    const types: POIObjectiveType[] = [
      "secure-cache",
      "restore-power",
      "clear-enemy-patrol",
      "hack-signal-box",
      "survey-residue-field",
    ];
    return types[(index + (deterministic ? 0 : Math.floor(Math.random() * types.length))) % types.length];
  }

  private objectivePositionForPoi(poi: PoiDefinition, index: number): Vector3 {
    const angle = index * 1.8 + (poiThreatRatings[poi.id] ?? 1) * 0.45;
    const radius = Math.min(9, poi.radius * 0.32);
    return poi.center.add(new Vector3(Math.sin(angle) * radius, 0.45, Math.cos(angle) * radius));
  }

  private rewardRarityForThreat(threatRating: number): LootRarity {
    if (threatRating >= 5) {
      return "core";
    }

    if (threatRating >= 4) {
      return "legendary";
    }

    if (threatRating >= 3) {
      return "epic";
    }

    if (threatRating >= 2) {
      return "rare";
    }

    return "uncommon";
  }

  private rewardTableForThreat(threatRating: number, type: POIObjectiveType): LootDrop[] {
    const table: LootDrop[] = [
      { type: "credits", quantity: 8 + threatRating * 12, chance: 0.78 },
      { type: "scrap", quantity: 3 + threatRating * 2, chance: 1 },
      { type: "ammo", quantity: 8 + threatRating * 4, chance: 0.78 },
      { type: "electronics", quantity: Math.max(1, threatRating - 1), chance: 0.24 + threatRating * 0.08 },
      { type: "weapon-parts", quantity: Math.max(1, threatRating - 1), chance: 0.42 + threatRating * 0.07 },
      { type: "battery", quantity: 1, chance: type === "restore-power" || type === "hack-signal-box" ? 0.72 : 0.38 },
    ];

    if (threatRating >= 2) {
      table.push({ type: "attachment-red-dot", quantity: 1, chance: 0.14 + threatRating * 0.025 });
      table.push({ type: "armor-plate", quantity: 1, chance: 0.32 });
    }

    if (threatRating >= 3) {
      table.push({ type: "attachment-vertical-grip", quantity: 1, chance: 0.16 });
      table.push({ type: "attachment-extended-mag", quantity: 1, chance: 0.14 });
    }

    if (threatRating >= 4) {
      table.push({ type: "weapon-smg", quantity: 1, chance: 0.16 });
      table.push({ type: "weapon-assault-rifle", quantity: 1, chance: 0.14 });
      table.push({ type: "weapon-rifle", quantity: 1, chance: 0.06 });
      table.push({ type: "attachment-suppressor", quantity: 1, chance: 0.16 });
      table.push({ type: "dog-tag", quantity: 1, chance: 0.2 });
    }

    if (type === "survey-residue-field") {
      table.push({ type: "scanner-battery", quantity: 1, chance: 0.32 });
      table.push({ type: "lumen-essence", quantity: 1, chance: 0.18 });
    }

    if (threatRating >= 5 || type === "retrieve-core-fragment") {
      table.push({ type: "rare-core", quantity: 1, chance: 0.55 });
      table.push({ type: "attachment-thermal-optic", quantity: 1, chance: 0.12 });
    }

    return table;
  }

  private createChestMaterial(name: string, rarity: LootRarity): StandardMaterial {
    const color = themeConfig.rarityColors[rarity];
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color.scale(rarity === "common" ? 0.58 : 0.74);
    material.emissiveColor = color.scale(rarity === "core" ? 0.74 : 0.42);
    material.specularColor = Color3.White().scale(0.35);
    return material;
  }

  private horizontalDistance(a: Vector3, b: Vector3): number {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }

  private disposeRuntimeObjectives(): void {
    for (const objective of this.objectives) {
      objective.marker.dispose();
      objective.prop.dispose();
      objective.surveyRing?.dispose();
      objective.surveyProgress?.dispose();
      objective.lockedChest.dispose();
    }

    this.objectives.length = 0;
  }
}
