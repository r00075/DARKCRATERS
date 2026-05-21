import {
  Color3,
  Color4,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
  type AbstractMesh,
} from "@babylonjs/core";
import type { EnemyDirector } from "../ai/EnemyDirector";
import type { EnemyType } from "../ai/EnemyTypes";
import {
  poiDefinitions,
  temporaryExtractionZoneDefinitions,
} from "../world/MapLayout";
import type { LootDrop } from "./LootDirector";
import { LootDirector } from "./LootDirector";
import type { RaidTimerState } from "./RaidTimer";

export type DynamicRaidEventType =
  | "loot-drop"
  | "reinforcement"
  | "temporary-extract"
  | "high-value-target"
  | "power-outage";

export type DynamicEventState = Readonly<{
  announcement: string | null;
  activeType: DynamicRaidEventType | null;
  markerDistance: number | null;
  temporaryExtractionZoneIds: string[];
  powerOutageActive: boolean;
}>;

type DynamicEventPlan = {
  type: DynamicRaidEventType;
  triggerTime: number;
  triggered: boolean;
  position: Vector3;
};

const dynamicEventConfig = {
  minEventsPerRaid: 1,
  maxEventsPerRaid: 2,
  firstEventAfterSeconds: 150,
  lastEventBeforeSeconds: 620,
  announcementSeconds: 7,
  temporaryExtractSeconds: 160,
  powerOutageSeconds: 90,
} as const;

const highValueLootTable: LootDrop[] = [
  { type: "scrap", quantity: 8, chance: 1 },
  { type: "ammo", quantity: 24, chance: 0.9 },
  { type: "rare-core", quantity: 1, chance: 0.6 },
  { type: "weapon-assault-rifle", quantity: 1, chance: 0.18 },
  { type: "weapon-rifle", quantity: 1, chance: 0.08 },
  { type: "attachment-red-dot", quantity: 1, chance: 0.2 },
  { type: "attachment-suppressor", quantity: 1, chance: 0.14 },
];

export class DynamicEventDirector {
  private plans: DynamicEventPlan[] = [];
  private announcement: string | null = null;
  private announcementTimer = 0;
  private marker: AbstractMesh | null = null;
  private markerPosition: Vector3 | null = null;
  private activeType: DynamicRaidEventType | null = null;
  private temporaryExtractionZoneId: string | null = null;
  private temporaryExtractionTimer = 0;
  private powerOutageTimer = 0;
  private readonly originalClearColor: Color4;

  public constructor(
    private readonly scene: Scene,
    private readonly lootDirector: LootDirector,
  ) {
    this.originalClearColor = scene.clearColor.clone();
  }

  public get state(): DynamicEventState {
    return this.createState(null);
  }

  public get activeTemporaryExtractionZoneIds(): string[] {
    return this.temporaryExtractionZoneId ? [this.temporaryExtractionZoneId] : [];
  }

  public reset(): void {
    this.plans = this.createPlans();
    this.announcement = null;
    this.announcementTimer = 0;
    this.activeType = null;
    this.temporaryExtractionZoneId = null;
    this.temporaryExtractionTimer = 0;
    this.restoreVisibility();
    this.powerOutageTimer = 0;
    this.clearMarker();
  }

  public update(
    dt: number,
    timer: RaidTimerState,
    playerPosition: Vector3,
    enemyDirector: EnemyDirector,
  ): DynamicEventState {
    this.announcementTimer = Math.max(0, this.announcementTimer - dt);
    this.temporaryExtractionTimer = Math.max(0, this.temporaryExtractionTimer - dt);
    this.powerOutageTimer = Math.max(0, this.powerOutageTimer - dt);

    if (this.temporaryExtractionTimer <= 0) {
      this.temporaryExtractionZoneId = null;
    }

    if (this.powerOutageTimer <= 0) {
      this.restoreVisibility();
    }

    for (const plan of this.plans) {
      if (!plan.triggered && timer.elapsed >= plan.triggerTime) {
        plan.triggered = true;
        this.triggerEvent(plan, enemyDirector);
      }
    }

    return this.createState(playerPosition);
  }

  public dispose(): void {
    this.clearMarker();
    this.restoreVisibility();
  }

  private triggerEvent(plan: DynamicEventPlan, enemyDirector: EnemyDirector): void {
    this.activeType = plan.type;
    this.markerPosition = plan.position.clone();
    this.createMarker(plan.position, plan.type);

    if (plan.type === "loot-drop") {
      this.lootDirector.spawnEventContainer(
        `event-crate-${Math.round(plan.triggerTime)}`,
        plan.position.add(new Vector3(0, 0.45, 0)),
        highValueLootTable,
      );
      this.announce("Supply crate dropped");
      return;
    }

    if (plan.type === "reinforcement") {
      enemyDirector.spawnEventEnemy(
        `reinforcement-${Math.round(plan.triggerTime)}`,
        this.randomEnemyType(["grunt", "charger", "spitter", "guard"]),
        plan.position,
        false,
      );
      this.announce("Enemy patrol reinforced");
      return;
    }

    if (plan.type === "temporary-extract") {
      const zone = this.nearestTemporaryExtract(plan.position);
      this.temporaryExtractionZoneId = zone.id;
      this.temporaryExtractionTimer = dynamicEventConfig.temporaryExtractSeconds;
      this.markerPosition = zone.center.clone();
      this.createMarker(zone.center, plan.type);
      this.announce("Temporary extraction opened");
      return;
    }

    if (plan.type === "high-value-target") {
      enemyDirector.spawnEventEnemy(
        `high-value-target-${Math.round(plan.triggerTime)}`,
        "elite",
        plan.position,
        true,
      );
      this.announce("High-value target sighted");
      return;
    }

    this.powerOutageTimer = dynamicEventConfig.powerOutageSeconds;
    this.scene.clearColor = new Color4(0.04, 0.055, 0.075, 1);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.012;
    this.announce("Power outage - visibility reduced");
  }

  private createPlans(): DynamicEventPlan[] {
    const eventCount = dynamicEventConfig.minEventsPerRaid
      + Math.floor(Math.random() * (dynamicEventConfig.maxEventsPerRaid - dynamicEventConfig.minEventsPerRaid + 1));
    const types: DynamicRaidEventType[] = [
      "loot-drop",
      "reinforcement",
      "temporary-extract",
      "high-value-target",
      "power-outage",
    ];
    const plans: DynamicEventPlan[] = [];

    for (let index = 0; index < eventCount; index += 1) {
      const type = this.pick(types);
      const triggerMin = dynamicEventConfig.firstEventAfterSeconds + index * 90;
      const triggerMax = Math.max(triggerMin + 10, dynamicEventConfig.lastEventBeforeSeconds - index * 45);

      plans.push({
        type,
        triggerTime: this.randomRange(triggerMin, triggerMax),
        triggered: false,
        position: this.randomEventPosition(),
      });
    }

    return plans.sort((a, b) => a.triggerTime - b.triggerTime);
  }

  private randomEventPosition(): Vector3 {
    const poi = this.pick(poiDefinitions);
    return poi.center.add(new Vector3(
      this.randomRange(-poi.radius * 0.35, poi.radius * 0.35),
      0,
      this.randomRange(-poi.radius * 0.35, poi.radius * 0.35),
    ));
  }

  private nearestTemporaryExtract(position: Vector3) {
    return temporaryExtractionZoneDefinitions.reduce((best, zone) => {
      const bestDistance = Vector3.DistanceSquared(best.center, position);
      const zoneDistance = Vector3.DistanceSquared(zone.center, position);
      return zoneDistance < bestDistance ? zone : best;
    }, temporaryExtractionZoneDefinitions[0]);
  }

  private randomEnemyType(types: EnemyType[]): EnemyType {
    return this.pick(types);
  }

  private pick<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private announce(message: string): void {
    this.announcement = message;
    this.announcementTimer = dynamicEventConfig.announcementSeconds;
  }

  private createMarker(position: Vector3, type: DynamicRaidEventType): void {
    this.clearMarker();
    const material = new StandardMaterial(`${type}-event-marker-material`, this.scene);
    material.diffuseColor = type === "temporary-extract"
      ? new Color3(0.3, 1, 0.65)
      : new Color3(1, 0.78, 0.18);
    material.emissiveColor = material.diffuseColor.scale(0.35);
    material.alpha = 0.72;

    this.marker = MeshBuilder.CreateCylinder(
      `${type}-event-marker`,
      { height: 0.06, diameter: 3.6, tessellation: 40 },
      this.scene,
    );
    this.marker.position.copyFrom(position.add(new Vector3(0, 0.08, 0)));
    this.marker.material = material;
    this.marker.checkCollisions = false;
  }

  private clearMarker(): void {
    this.marker?.material?.dispose();
    this.marker?.dispose();
    this.marker = null;
    this.markerPosition = null;
  }

  private restoreVisibility(): void {
    this.scene.clearColor.copyFrom(this.originalClearColor);
    this.scene.fogMode = Scene.FOGMODE_NONE;
    this.scene.fogDensity = 0;
  }

  private createState(playerPosition: Vector3 | null): DynamicEventState {
    const markerDistance = this.markerPosition && playerPosition
      ? Vector3.Distance(this.markerPosition, playerPosition)
      : null;

    return {
      announcement: this.announcementTimer > 0 ? this.announcement : null,
      activeType: this.activeType,
      markerDistance,
      temporaryExtractionZoneIds: this.activeTemporaryExtractionZoneIds,
      powerOutageActive: this.powerOutageTimer > 0,
    };
  }
}
