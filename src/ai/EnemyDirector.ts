import { AbstractMesh, Color3, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import type { PlayerHealth } from "../combat/PlayerHealth";
import type { EnvironmentGameplayModifiers } from "../environment/EnvironmentManager";
import type { InputSnapshot } from "../input/InputController";
import { lootLabels } from "../raid/ItemDefinitions";
import type { LootEvent, LootType } from "../raid/RaidInventory";
import type { NoiseEvent } from "../stealth/NoiseSystem";
import type { WeaponState } from "../weapons/WeaponController";
import type { MotorState } from "../world/PlayerMotor";
import { EncounterDirector, type EncounterDebugState, type EnemySpawnDefinition } from "./EncounterDirector";
import { EnemyAgent, type EnemyDebugState } from "./EnemyAgent";
import { enemyTypeDefinitions, type EnemyLootDrop, type EnemyType } from "./EnemyTypes";

export type EnemyDirectorOptions = Readonly<{
  difficultyLevel: number;
  disabled?: boolean;
  onLootDropped: (event: LootEvent) => void;
  onPlayerHit?: (enemyType: EnemyType) => void;
  onEnemyKilled?: (enemyType: EnemyType) => void;
}>;

export class EnemyDirector {
  private readonly enemies: EnemyAgent[];
  private readonly encounterDirector = new EncounterDirector();
  private readonly contactPingMaterial: StandardMaterial;
  private readonly difficultyLevel: number;
  private readonly healthMultiplier: number;
  private readonly pendingEncounterMessages: string[] = [];
  private readonly transientEffects: Array<{ mesh: AbstractMesh; ttl: number }> = [];
  private hitboxDebugVisible = false;
  private losDebugVisible = false;

  public constructor(
    private readonly scene: Scene,
    private readonly playerBody: AbstractMesh,
    private readonly playerHealth: PlayerHealth,
    private readonly options: EnemyDirectorOptions,
  ) {
    this.contactPingMaterial = new StandardMaterial("encounter-contact-ping-material", scene);
    this.contactPingMaterial.diffuseColor = new Color3(0.08, 0.16, 0.18);
    this.contactPingMaterial.emissiveColor = new Color3(0.18, 0.62, 0.74);
    this.contactPingMaterial.specularColor = Color3.Black();
    this.contactPingMaterial.disableLighting = true;
    this.difficultyLevel = Math.max(1, options.difficultyLevel);
    this.healthMultiplier = 1 + Math.min(0.45, (this.difficultyLevel - 1) * 0.055);
    this.enemies = options.disabled
      ? []
      : this.encounterDirector
        .createInitialSpawns(this.difficultyLevel, this.playerBody.position)
        .map((definition) => this.createEnemy(definition));
  }

  public get debugStates(): EnemyDebugState[] {
    return this.enemies.map((enemy) => enemy.debugState);
  }

  public get encounterDebug(): EncounterDebugState {
    return this.encounterDirector.debugState;
  }

  public get activeEnemyCount(): number {
    return this.enemies.filter((enemy) => enemy.alive).length;
  }

  public setHitboxDebugVisible(visible: boolean): void {
    this.hitboxDebugVisible = visible;
    for (const enemy of this.enemies) {
      enemy.setHitboxDebugVisible(visible);
    }
  }

  public setLosDebugVisible(visible: boolean): void {
    this.losDebugVisible = visible;
    for (const enemy of this.enemies) {
      enemy.setLosDebugVisible(visible);
    }
  }

  public update(
    dt: number,
    input: InputSnapshot,
    playerState: MotorState,
    weaponState?: WeaponState,
    environment: EnvironmentGameplayModifiers = {
      enemyVisionMultiplier: 1,
      rareLootChanceMultiplier: 1,
      alertPropagationMultiplier: 1,
      flashlightDetectionMultiplier: 1,
    },
    noiseEvents: readonly NoiseEvent[] = [],
    raidElapsedSeconds = 0,
  ): void {
    if (this.options.disabled) {
      return;
    }

    this.updateTransientEffects(dt);

    this.applyNoiseEvents(noiseEvents);
    const reinforcementSpawns = this.encounterDirector.update(
      dt,
      raidElapsedSeconds,
      playerState,
      this.activeEnemyCount,
      noiseEvents,
    );

    for (const spawn of reinforcementSpawns) {
      const enemy = this.createEnemy(spawn);
      enemy.setHitboxDebugVisible(this.hitboxDebugVisible);
      enemy.setLosDebugVisible(this.losDebugVisible);
      this.enemies.push(enemy);
      this.createContactPing(spawn.spawn, spawn.encounterType === "reinforcement-wave" ? 7.5 : 9);
      this.pendingEncounterMessages.push(this.formatEncounterMessage(spawn));
    }

    for (const enemy of this.enemies) {
      enemy.update(dt, input, playerState, environment.enemyVisionMultiplier);
    }

    this.shareSquadAlerts((weaponState?.noiseDetectionMultiplier ?? 1) * environment.alertPropagationMultiplier);
  }

  private applyNoiseEvents(noiseEvents: readonly NoiseEvent[]): void {
    for (const event of noiseEvents) {
      for (const enemy of this.enemies) {
        enemy.receiveNoise(event);
      }
    }
  }

  public dispose(): void {
    for (const enemy of this.enemies) {
      enemy.dispose();
    }
    for (const effect of this.transientEffects) {
      effect.mesh.dispose();
    }
    this.contactPingMaterial.dispose();
  }

  public spawnEventEnemy(
    id: string,
    type: EnemyType,
    spawn: Vector3,
    highValueLoot: boolean,
  ): void {
    if (this.options.disabled) {
      this.pendingEncounterMessages.push("Local PvE spawn suppressed in multiplayer");
      return;
    }

    if (!this.encounterDirector.canSpawn(this.activeEnemyCount)) {
      this.pendingEncounterMessages.push("Enemy pressure capped");
      return;
    }

    const safeSpawn = this.resolveEventSpawnPosition(spawn);
    const patrolPoints = this.createEventPatrolPoints(safeSpawn);

    const enemy = this.createEnemy({
      id,
      poiId: "event",
      encounterType: type === "elite" ? "elite-guard" : "reinforcement-wave",
      type,
      role: type === "charger" || type === "grunt" ? "rusher" : type === "guard" || type === "spitter" ? "support" : type === "elite" ? "flanker" : "rifleman",
      spawn: safeSpawn,
      patrolPoints,
      minDifficultyLevel: 1,
      highValueLoot,
    });
    enemy.setHitboxDebugVisible(this.hitboxDebugVisible);
    enemy.setLosDebugVisible(this.losDebugVisible);
    this.enemies.push(enemy);
    this.createContactPing(safeSpawn, type === "elite" ? 10 : 7);
    this.pendingEncounterMessages.push(type === "elite" ? "Elite guard deployed at contact lane" : "Enemy patrol reinforced from contact lane");
  }

  public consumeEncounterMessages(): string[] {
    return this.pendingEncounterMessages.splice(0);
  }

  private shareSquadAlerts(weaponNoiseMultiplier: number): void {
    for (const source of this.enemies) {
      const alertPosition = source.alertPosition;

      if (!source.alive || !alertPosition) {
        continue;
      }

      for (const target of this.enemies) {
        const distance = Vector3.Distance(source.debugState.position, target.debugState.position);

        if (distance <= source.alertRadius) {
          target.receiveSquadAlert(alertPosition, source.debugState.id, weaponNoiseMultiplier);
        }
      }
    }
  }

  private createEnemy(definition: EnemySpawnDefinition): EnemyAgent {
    return new EnemyAgent(this.scene, {
      id: definition.id,
      type: definition.type,
      role: definition.role,
      spawn: definition.spawn,
      patrolPoints: definition.patrolPoints,
      difficultyHealthMultiplier: this.healthMultiplier,
      onPlayerHit: this.options.onPlayerHit,
      onKilled: () => {
        this.options.onEnemyKilled?.(definition.type);
        this.rollLoot(definition.type, definition.highValueLoot ?? false, this.options.onLootDropped);
      },
    }, this.playerBody, this.playerHealth);
  }

  private resolveEventSpawnPosition(spawn: Vector3): Vector3 {
    const playerPosition = this.playerBody.position;
    const away = spawn.subtract(playerPosition);
    away.y = 0;
    const distance = away.length();

    if (distance >= 30) {
      return spawn.clone();
    }

    const direction = distance > 0.01 ? away.normalize() : new Vector3(1, 0, 0);
    return playerPosition.add(direction.scale(32));
  }

  private createEventPatrolPoints(spawn: Vector3): Vector3[] {
    const toPlayer = this.playerBody.position.subtract(spawn);
    toPlayer.y = 0;
    const direction = toPlayer.lengthSquared() > 0.01 ? toPlayer.normalize() : new Vector3(1, 0, 0);
    const side = new Vector3(direction.z, 0, -direction.x);

    return [
      spawn.clone(),
      spawn.add(direction.scale(7)).addInPlace(side.scale(5)),
      spawn.add(direction.scale(12)).addInPlace(side.scale(-5)),
    ];
  }

  private formatEncounterMessage(spawn: EnemySpawnDefinition): string {
    if (spawn.encounterType === "objective-defense" || spawn.encounterType === "loot-guard") {
      return "Objective guard contact on POI perimeter";
    }

    if (spawn.encounterType === "elite-guard") {
      return "Elite contact moving through perimeter";
    }

    if (spawn.encounterType === "reinforcement-wave") {
      return "Return-route contact lane active";
    }

    return "Local patrol contact lane active";
  }

  private createContactPing(position: Vector3, diameter: number): void {
    const ring = MeshBuilder.CreateTorus(
      "encounter-contact-ping",
      { diameter, thickness: 0.06, tessellation: 36 },
      this.scene,
    );
    ring.position.copyFrom(position.add(new Vector3(0, 0.08, 0)));
    ring.rotation.x = Math.PI / 2;
    ring.material = this.contactPingMaterial;
    ring.checkCollisions = false;
    ring.isPickable = false;
    ring.metadata = { gameplayTag: "encounter-contact-ping", phase: "13.2" };
    this.transientEffects.push({ mesh: ring, ttl: 2.2 });
  }

  private updateTransientEffects(dt: number): void {
    for (let index = this.transientEffects.length - 1; index >= 0; index -= 1) {
      const effect = this.transientEffects[index];
      const ttl = effect.ttl - dt;

      if (ttl > 0) {
        this.transientEffects[index] = { ...effect, ttl };
        continue;
      }

      effect.mesh.dispose();
      this.transientEffects.splice(index, 1);
    }
  }

  private rollLoot(
    enemyType: EnemyType,
    highValueLoot: boolean,
    onLootDropped: (event: LootEvent) => void,
  ): void {
    const table = this.scaledLootTable(enemyType, highValueLoot);

    for (const drop of table) {
      if (Math.random() > drop.chance) {
        continue;
      }

      onLootDropped({
        type: drop.type,
        label: this.labelForLoot(drop.type),
        quantity: drop.quantity,
      });
    }
  }

  private scaledLootTable(enemyType: EnemyType, highValueLoot: boolean): EnemyLootDrop[] {
    const baseTable = enemyTypeDefinitions[enemyType].lootTable;
    const difficultyBonus = Math.min(0.18, (this.difficultyLevel - 1) * 0.025);

    return baseTable.map((drop) => ({
      ...drop,
      chance: Math.min(0.95, drop.chance + difficultyBonus + (highValueLoot ? 0.08 : 0)),
    }));
  }

  private labelForLoot(type: LootType): string {
    return lootLabels[type];
  }
}
