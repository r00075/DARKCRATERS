import { AbstractMesh, Scene, Vector3 } from "@babylonjs/core";
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
  private readonly difficultyLevel: number;
  private readonly healthMultiplier: number;
  private readonly pendingEncounterMessages: string[] = [];
  private hitboxDebugVisible = false;
  private losDebugVisible = false;

  public constructor(
    private readonly scene: Scene,
    private readonly playerBody: AbstractMesh,
    private readonly playerHealth: PlayerHealth,
    private readonly options: EnemyDirectorOptions,
  ) {
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
      this.pendingEncounterMessages.push("Enemy reinforcements incoming");
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

    const patrolPoints = [
      spawn.clone(),
      spawn.add(new Vector3(6, 0, 4)),
      spawn.add(new Vector3(-5, 0, -5)),
    ];

    const enemy = this.createEnemy({
      id,
      poiId: "event",
      encounterType: type === "elite" ? "elite-guard" : "reinforcement-wave",
      type,
      role: type === "charger" || type === "grunt" ? "rusher" : type === "guard" || type === "spitter" ? "support" : type === "elite" ? "flanker" : "rifleman",
      spawn,
      patrolPoints,
      minDifficultyLevel: 1,
      highValueLoot,
    });
    enemy.setHitboxDebugVisible(this.hitboxDebugVisible);
    enemy.setLosDebugVisible(this.losDebugVisible);
    this.enemies.push(enemy);
    this.pendingEncounterMessages.push(type === "elite" ? "Elite guard deployed" : "Enemy patrol reinforced");
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
