import { Vector3 } from "@babylonjs/core";
import type { NoiseEvent } from "../stealth/NoiseSystem";
import { poiDefinitions } from "../world/MapLayout";
import type { MotorState } from "../world/PlayerMotor";
import { yawToBasis } from "../math/angles";
import type { EnemyRole, EnemyType } from "./EnemyTypes";

export type EncounterType =
  | "light-patrol"
  | "loot-guard"
  | "objective-defense"
  | "ambush"
  | "reinforcement-wave"
  | "elite-guard";

export type EnemySpawnDefinition = Readonly<{
  id: string;
  poiId: string;
  encounterType: EncounterType;
  type: EnemyType;
  role?: EnemyRole;
  spawn: Vector3;
  patrolPoints: Vector3[];
  minDifficultyLevel: number;
  optional?: boolean;
  highValueLoot?: boolean;
}>;

export type EncounterDebugState = Readonly<{
  phase: "early" | "mid" | "late";
  maxActiveEnemies: number;
  activeEnemies: number;
  lastEncounter: string;
  reinforcementCooldown: number;
  poiThreats: Array<{ poiId: string; rating: number; label: string }>;
}>;

const encounterConfig = {
  maxActiveEnemies: 8,
  initialEarlyLimit: 4,
  initialMidLimit: 6,
  reinforcementCooldownSeconds: 28,
  loudNoiseRadius: 16,
  minSpawnDistanceFromPlayer: 16,
  forwardViewSafetyDistance: 30,
  forwardViewMinDot: 0.32,
} as const;

const poiThreats: Record<string, { rating: number; label: string }> = {
  "abandoned-camp": { rating: 1, label: "Safe Route" },
  checkpoint: { rating: 2, label: "Patrol Route" },
  "data-shack": { rating: 3, label: "Tech Guarded" },
  warehouse: { rating: 4, label: "High-Value Loot" },
  "core-pit": { rating: 5, label: "Objective Danger" },
};

const spawnDefinitions: EnemySpawnDefinition[] = [
  {
    id: "camp-light-patrol",
    poiId: "abandoned-camp",
    encounterType: "light-patrol",
    type: "grunt",
    role: "rifleman",
    spawn: new Vector3(-52, 0, 36),
    patrolPoints: [new Vector3(-52, 0, 36), new Vector3(-36, 0, 24), new Vector3(-56, 0, 22)],
    minDifficultyLevel: 1,
  },
  {
    id: "checkpoint-light-patrol",
    poiId: "checkpoint",
    encounterType: "light-patrol",
    type: "grunt",
    role: "flanker",
    spawn: new Vector3(-18, 0, -44),
    patrolPoints: [new Vector3(-18, 0, -44), new Vector3(0, 0, -50), new Vector3(-26, 0, -38)],
    minDifficultyLevel: 1,
  },
  {
    id: "data-loot-guard",
    poiId: "data-shack",
    encounterType: "loot-guard",
    type: "grunt",
    role: "rifleman",
    spawn: new Vector3(28, 0, 42),
    patrolPoints: [new Vector3(28, 0, 42), new Vector3(38, 0, 34), new Vector3(22, 0, 32)],
    minDifficultyLevel: 1,
    highValueLoot: true,
  },
  {
    id: "checkpoint-ambush-charger",
    poiId: "checkpoint",
    encounterType: "ambush",
    type: "charger",
    role: "rusher",
    spawn: new Vector3(4, 0, -48),
    patrolPoints: [new Vector3(4, 0, -48), new Vector3(-8, 0, -58), new Vector3(-22, 0, -46)],
    minDifficultyLevel: 2,
    optional: true,
  },
  {
    id: "data-ambush-charger",
    poiId: "data-shack",
    encounterType: "ambush",
    type: "charger",
    role: "rusher",
    spawn: new Vector3(38, 0, 32),
    patrolPoints: [new Vector3(38, 0, 32), new Vector3(20, 0, 32), new Vector3(30, 0, 46)],
    minDifficultyLevel: 3,
    optional: true,
  },
  {
    id: "warehouse-loot-guard",
    poiId: "warehouse",
    encounterType: "loot-guard",
    type: "guard",
    role: "support",
    spawn: new Vector3(52, 0, -34),
    patrolPoints: [new Vector3(52, 0, -34), new Vector3(38, 0, -38), new Vector3(58, 0, -22)],
    minDifficultyLevel: 1,
    highValueLoot: true,
  },
  {
    id: "warehouse-objective-defense",
    poiId: "warehouse",
    encounterType: "objective-defense",
    type: "guard",
    role: "rifleman",
    spawn: new Vector3(60, 0, -25),
    patrolPoints: [new Vector3(60, 0, -25), new Vector3(46, 0, -20), new Vector3(55, 0, -42)],
    minDifficultyLevel: 4,
    optional: true,
    highValueLoot: true,
  },
  {
    id: "core-pit-objective-defense",
    poiId: "core-pit",
    encounterType: "objective-defense",
    type: "guard",
    role: "support",
    spawn: new Vector3(8, 0, 11),
    patrolPoints: [new Vector3(8, 0, 11), new Vector3(-8, 0, 11), new Vector3(0, 0, -4)],
    minDifficultyLevel: 2,
    highValueLoot: true,
  },
  {
    id: "core-pit-elite-guard",
    poiId: "core-pit",
    encounterType: "elite-guard",
    type: "elite",
    role: "flanker",
    spawn: new Vector3(-7, 0, -3),
    patrolPoints: [new Vector3(-7, 0, -3), new Vector3(8, 0, -4), new Vector3(0, 0, 12)],
    minDifficultyLevel: 5,
    optional: true,
    highValueLoot: true,
  },
  {
    id: "warehouse-elite-guard",
    poiId: "warehouse",
    encounterType: "elite-guard",
    type: "elite",
    role: "flanker",
    spawn: new Vector3(44, 0, -30),
    patrolPoints: [new Vector3(44, 0, -30), new Vector3(34, 0, -40), new Vector3(58, 0, -36)],
    minDifficultyLevel: 6,
    optional: true,
    highValueLoot: true,
  },
];

export class EncounterDirector {
  private reinforcementCooldown = 0;
  private spawnSerial = 1;
  private lastEncounter = "initializing";
  private phase: EncounterDebugState["phase"] = "early";
  private activeEnemies = 0;

  public get debugState(): EncounterDebugState {
    return {
      phase: this.phase,
      maxActiveEnemies: encounterConfig.maxActiveEnemies,
      activeEnemies: this.activeEnemies,
      lastEncounter: this.lastEncounter,
      reinforcementCooldown: this.reinforcementCooldown,
      poiThreats: Object.entries(poiThreats).map(([poiId, threat]) => ({ poiId, ...threat })),
    };
  }

  public createInitialSpawns(difficultyLevel: number, playerPosition: Vector3): EnemySpawnDefinition[] {
    const limit = difficultyLevel <= 2
      ? encounterConfig.initialEarlyLimit
      : Math.min(encounterConfig.initialMidLimit, encounterConfig.initialEarlyLimit + Math.floor(difficultyLevel / 2));
    const eligible = spawnDefinitions
      .filter((spawn) => spawn.minDifficultyLevel <= difficultyLevel)
      .filter((spawn) => Vector3.Distance(spawn.spawn, playerPosition) >= encounterConfig.minSpawnDistanceFromPlayer)
      .sort((a, b) => this.spawnScore(a, difficultyLevel) - this.spawnScore(b, difficultyLevel));
    const required = eligible.filter((spawn) => !spawn.optional);
    const optional = eligible.filter((spawn) => spawn.optional);
    const selected = required.slice(0, limit);

    for (const spawn of optional) {
      if (selected.length >= limit) {
        break;
      }

      const threat = poiThreats[spawn.poiId]?.rating ?? 1;
      const chance = Math.min(0.82, 0.22 + difficultyLevel * 0.07 + threat * 0.06);

      if (Math.random() <= chance) {
        selected.push(spawn);
      }
    }

    this.activeEnemies = selected.length;
    this.lastEncounter = `Initial ${selected.length} POI spawns`;
    return selected;
  }

  public update(
    dt: number,
    raidElapsedSeconds: number,
    playerState: MotorState,
    activeEnemyCount: number,
    noiseEvents: readonly NoiseEvent[],
  ): EnemySpawnDefinition[] {
    this.activeEnemies = activeEnemyCount;
    this.phase = raidElapsedSeconds < 180 ? "early" : raidElapsedSeconds < 600 ? "mid" : "late";
    this.reinforcementCooldown = Math.max(0, this.reinforcementCooldown - dt);

    if (activeEnemyCount >= encounterConfig.maxActiveEnemies || this.reinforcementCooldown > 0) {
      return [];
    }

    const loudNoise = noiseEvents.find((event) => event.radius >= encounterConfig.loudNoiseRadius);

    if (!loudNoise) {
      return [];
    }

    const spawn = this.createReinforcementSpawn(loudNoise, playerState, raidElapsedSeconds);

    if (!spawn) {
      return [];
    }

    this.reinforcementCooldown = encounterConfig.reinforcementCooldownSeconds;
    this.lastEncounter = `${spawn.encounterType} at ${spawn.poiId}`;
    return [spawn];
  }

  public canSpawn(activeEnemyCount: number): boolean {
    return activeEnemyCount < encounterConfig.maxActiveEnemies;
  }

  public reset(): void {
    this.reinforcementCooldown = 0;
    this.spawnSerial = 1;
    this.lastEncounter = "reset";
    this.phase = "early";
    this.activeEnemies = 0;
  }

  private createReinforcementSpawn(
    event: NoiseEvent,
    playerState: MotorState,
    raidElapsedSeconds: number,
  ): EnemySpawnDefinition | null {
    const poi = this.nearestPoi(event.position);
    const threat = poiThreats[poi.id]?.rating ?? 1;
    const lateRaid = raidElapsedSeconds >= 600;
    const type: EnemyType = lateRaid && threat >= 5
      ? "elite"
      : threat >= 4
        ? "guard"
        : threat >= 3 && Math.random() > 0.62
          ? "spitter"
          : threat >= 3 && Math.random() > 0.45
          ? "charger"
          : "grunt";
    const role: EnemyRole = type === "charger" || type === "grunt" ? "rusher" : type === "elite" ? "flanker" : threat >= 3 ? "support" : "rifleman";
    const spawn = this.findSafeSpawnNearPoi(poi.center, playerState);

    if (!spawn) {
      return null;
    }

    const id = `encounter-${this.spawnSerial}`;
    this.spawnSerial += 1;

    return {
      id,
      poiId: poi.id,
      encounterType: lateRaid && type === "elite" ? "elite-guard" : "reinforcement-wave",
      type,
      role,
      spawn,
      patrolPoints: [
        spawn.clone(),
        poi.center.add(new Vector3(5, 0, 4)),
        poi.center.add(new Vector3(-5, 0, -4)),
      ],
      minDifficultyLevel: 1,
      highValueLoot: threat >= 4,
    };
  }

  private findSafeSpawnNearPoi(center: Vector3, playerState: MotorState): Vector3 | null {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 11;
      const candidate = center.add(new Vector3(Math.sin(angle) * radius, 0, Math.cos(angle) * radius));

      if (this.isSpawnFair(candidate, playerState)) {
        return candidate;
      }
    }

    return null;
  }

  private isSpawnFair(candidate: Vector3, playerState: MotorState): boolean {
    const toSpawn = candidate.subtract(playerState.position);
    toSpawn.y = 0;
    const distance = toSpawn.length();

    if (distance < encounterConfig.minSpawnDistanceFromPlayer) {
      return false;
    }

    if (distance > encounterConfig.forwardViewSafetyDistance) {
      return true;
    }

    const forward = yawToBasis(playerState.yaw).forward;
    return Vector3.Dot(forward, toSpawn.normalize()) < encounterConfig.forwardViewMinDot;
  }

  private nearestPoi(position: Vector3) {
    return poiDefinitions.reduce((best, poi) => {
      const bestDistance = Vector3.DistanceSquared(best.center, position);
      const poiDistance = Vector3.DistanceSquared(poi.center, position);
      return poiDistance < bestDistance ? poi : best;
    }, poiDefinitions[0]);
  }

  private spawnScore(spawn: EnemySpawnDefinition, difficultyLevel: number): number {
    const threat = poiThreats[spawn.poiId]?.rating ?? 1;
    const phaseBias = difficultyLevel <= 2 ? threat : Math.abs(threat - Math.min(5, difficultyLevel));
    return phaseBias + (spawn.optional ? 0.45 : 0) + Math.random() * 0.25;
  }
}
