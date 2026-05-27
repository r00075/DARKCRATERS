import type {
  NetworkEnemyAiState,
  NetworkEnemyAttackEvent,
  NetworkEnemyDespawnEvent,
  NetworkEnemyEvent,
  NetworkEnemySnapshot,
  NetworkEnemyState,
  NetworkEnemyType,
  NetworkVec3,
} from "../../shared/MultiplayerProtocol";

export type ServerEnemyPlayer = Readonly<{
  id: string;
  x: number;
  y: number;
  z: number;
  health: number;
  status: string;
}>;

type ServerEnemy = {
  id: string;
  type: NetworkEnemyType;
  x: number;
  y: number;
  z: number;
  yaw: number;
  health: number;
  maxHealth: number;
  state: NetworkEnemyAiState;
  targetPlayerId: string | null;
  active: boolean;
  patrolIndex: number;
  patrolPoints: NetworkVec3[];
  attackCooldown: number;
  recentlyDamagedTimer: number;
  dormantTimer: number;
  deadTimer: number;
};

type EnemyDefinition = Readonly<{
  maxHealth: number;
  radius: number;
  speed: number;
  chaseSpeed: number;
  attackRange: number;
  visionRange: number;
  attackDamage: number;
  attackCooldown: number;
}>;

type EnemySpawn = Readonly<{
  id: string;
  type: NetworkEnemyType;
  position: NetworkVec3;
  patrolPoints: NetworkVec3[];
}>;

const serverEnemyTickRate = 12;
const enemySnapshotRate = 10;
const activeRelevanceDistance = 62;
const wakeDistance = 72;
const dormantUpdateInterval = 2.4;
const recentCombatAwakeSeconds = 6;
const targetRetentionDistance = 82;
const deadDespawnSeconds = 4;

const enemyDefinitions: Record<NetworkEnemyType, EnemyDefinition> = {
  grunt: { maxHealth: 46, radius: 0.72, speed: 2.4, chaseSpeed: 4.8, attackRange: 2.2, visionRange: 28, attackDamage: 5, attackCooldown: 0.72 },
  charger: { maxHealth: 120, radius: 0.92, speed: 2.8, chaseSpeed: 5.6, attackRange: 2.7, visionRange: 30, attackDamage: 12, attackCooldown: 0.95 },
  spitter: { maxHealth: 95, radius: 0.82, speed: 1.8, chaseSpeed: 3.1, attackRange: 14, visionRange: 34, attackDamage: 9, attackCooldown: 1.35 },
  guard: { maxHealth: 190, radius: 1.05, speed: 1.55, chaseSpeed: 3.2, attackRange: 3.1, visionRange: 32, attackDamage: 18, attackCooldown: 1.15 },
  elite: { maxHealth: 240, radius: 1.18, speed: 2.15, chaseSpeed: 4.2, attackRange: 12, visionRange: 38, attackDamage: 14, attackCooldown: 0.95 },
};

const initialEnemySpawns: EnemySpawn[] = [
  { id: "net-camp-light-patrol", type: "grunt", position: { x: 88, y: 0, z: 42 }, patrolPoints: [{ x: 88, y: 0, z: 42 }, { x: 102, y: 0, z: 28 }, { x: 78, y: 0, z: 26 }] },
  { id: "net-checkpoint-light-patrol", type: "grunt", position: { x: 58, y: 0, z: -92 }, patrolPoints: [{ x: 58, y: 0, z: -92 }, { x: 76, y: 0, z: -100 }, { x: 48, y: 0, z: -82 }] },
  { id: "net-data-loot-guard", type: "grunt", position: { x: -76, y: 0, z: 86 }, patrolPoints: [{ x: -76, y: 0, z: 86 }, { x: -62, y: 0, z: 78 }, { x: -88, y: 0, z: 72 }] },
  { id: "net-warehouse-loot-guard", type: "guard", position: { x: -86, y: 0, z: -26 }, patrolPoints: [{ x: -86, y: 0, z: -26 }, { x: -100, y: 0, z: -30 }, { x: -78, y: 0, z: -12 }] },
  { id: "net-core-pit-objective-defense", type: "guard", position: { x: 14, y: 0, z: 12 }, patrolPoints: [{ x: 14, y: 0, z: 12 }, { x: -10, y: 0, z: 12 }, { x: 4, y: 0, z: -12 }] },
  { id: "net-alien-growth-spitter-watch", type: "spitter", position: { x: 108, y: 0, z: 78 }, patrolPoints: [{ x: 108, y: 0, z: 78 }, { x: 122, y: 0, z: 88 }, { x: 96, y: 0, z: 68 }] },
  { id: "net-alien-growth-horror-pressure", type: "elite", position: { x: 118, y: 0, z: 84 }, patrolPoints: [{ x: 118, y: 0, z: 84 }, { x: 102, y: 0, z: 74 }, { x: 126, y: 0, z: 62 }] },
];

export class NetworkEnemyManager {
  private readonly enemies = new Map<string, ServerEnemy>();
  private snapshotTimer = 0;
  private snapshotId = 0;
  private pendingDespawnEvents: NetworkEnemyDespawnEvent[] = [];
  private lastSnapshot: NetworkEnemySnapshot = {
    enemies: [],
    activeCount: 0,
    dormantCount: 0,
    serverTickRate: serverEnemyTickRate,
    snapshotRate: enemySnapshotRate,
    snapshotId: 0,
    serverTime: Date.now(),
  };

  public constructor() {
    this.reset();
  }

  public reset(): void {
    this.enemies.clear();
    this.pendingDespawnEvents = [];
    this.snapshotId = 0;
    for (const spawn of initialEnemySpawns) {
      const definition = enemyDefinitions[spawn.type];
      this.enemies.set(spawn.id, {
        id: spawn.id,
        type: spawn.type,
        x: spawn.position.x,
        y: spawn.position.y,
        z: spawn.position.z,
        yaw: 0,
        health: definition.maxHealth,
        maxHealth: definition.maxHealth,
        state: "patrol",
        targetPlayerId: null,
        active: false,
        patrolIndex: 0,
        patrolPoints: spawn.patrolPoints,
        attackCooldown: 0,
        recentlyDamagedTimer: 0,
        dormantTimer: 0,
        deadTimer: 0,
      });
    }
    this.lastSnapshot = this.createSnapshot();
  }

  public update(dt: number, players: readonly ServerEnemyPlayer[]): NetworkEnemyAttackEvent[] {
    const attacks: NetworkEnemyAttackEvent[] = [];
    const livingPlayers = players.filter((player) => player.status === "active" && player.health > 0);

    for (const enemy of this.enemies.values()) {
      if (enemy.state === "dead") {
        enemy.active = false;
        enemy.deadTimer += dt;
        if (enemy.deadTimer >= deadDespawnSeconds) {
          this.pendingDespawnEvents.push({ id: enemy.id, reason: "dead" });
          this.enemies.delete(enemy.id);
        }
        continue;
      }

      enemy.recentlyDamagedTimer = Math.max(0, enemy.recentlyDamagedTimer - dt);
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      const nearest = this.findNearestPlayer(enemy, livingPlayers);
      const nearestDistance = nearest ? this.distance(enemy, nearest.player) : Number.POSITIVE_INFINITY;
      const shouldWake = enemy.recentlyDamagedTimer > 0 ||
        Boolean(enemy.targetPlayerId) ||
        nearestDistance <= wakeDistance ||
        enemy.state === "attack" ||
        enemy.state === "chase";

      enemy.active = shouldWake && livingPlayers.length > 0;

      if (!enemy.active) {
        enemy.dormantTimer += dt;
        if (enemy.dormantTimer < dormantUpdateInterval) {
          continue;
        }
        enemy.dormantTimer = 0;
        enemy.state = "idle";
        continue;
      }

      enemy.dormantTimer = 0;
      const target = this.selectTarget(enemy, livingPlayers, nearest?.player ?? null);

      if (!target) {
        enemy.targetPlayerId = null;
        this.updatePatrol(enemy, dt);
        continue;
      }

      const definition = enemyDefinitions[enemy.type];
      const targetDistance = this.distance(enemy, target);
      enemy.targetPlayerId = target.id;

      if (targetDistance <= definition.attackRange) {
        enemy.state = "attack";
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = definition.attackCooldown;
          attacks.push({
            enemyId: enemy.id,
            enemyType: enemy.type,
            targetPlayerId: target.id,
            damage: definition.attackDamage,
            healthRemaining: 0,
          });
        }
      } else if (targetDistance <= definition.visionRange || enemy.recentlyDamagedTimer > 0) {
        enemy.state = "chase";
        this.moveToward(enemy, target, definition.chaseSpeed, dt);
      } else {
        enemy.targetPlayerId = null;
        this.updatePatrol(enemy, dt);
      }
    }

    return attacks;
  }

  public shouldBroadcastSnapshot(dt: number): boolean {
    this.snapshotTimer += dt;
    if (this.snapshotTimer < 1 / enemySnapshotRate) {
      return false;
    }

    this.snapshotTimer = 0;
    this.lastSnapshot = this.createSnapshot();
    return true;
  }

  public get snapshot(): NetworkEnemySnapshot {
    return this.lastSnapshot;
  }

  public consumeDespawnEvents(): NetworkEnemyDespawnEvent[] {
    const events = [...this.pendingDespawnEvents];
    this.pendingDespawnEvents = [];
    if (events.length > 0) {
      this.lastSnapshot = this.createSnapshot();
    }
    return events;
  }

  public applyShot(
    attackerId: string,
    origin: NetworkVec3,
    direction: NetworkVec3,
    range: number,
    damage: number,
  ): NetworkEnemyEvent | null {
    let bestHit: { enemy: ServerEnemy; distance: number; hitZone: "body" | "head" | "legs" } | null = null;

    for (const enemy of this.enemies.values()) {
      if (enemy.state === "dead" || enemy.health <= 0) {
        continue;
      }

      const definition = enemyDefinitions[enemy.type];
      const bodyDistance = this.raySphereDistance(origin, direction, { x: enemy.x, y: enemy.y + 0.95, z: enemy.z }, definition.radius);
      const headDistance = this.raySphereDistance(origin, direction, { x: enemy.x, y: enemy.y + 1.55, z: enemy.z }, definition.radius * 0.58);
      const legsDistance = this.raySphereDistance(origin, direction, { x: enemy.x, y: enemy.y + 0.35, z: enemy.z }, definition.radius * 0.72);
      const candidates = [
        { distance: headDistance, hitZone: "head" as const },
        { distance: bodyDistance, hitZone: "body" as const },
        { distance: legsDistance, hitZone: "legs" as const },
      ].filter((candidate): candidate is { distance: number; hitZone: "body" | "head" | "legs" } => {
        return candidate.distance !== null && candidate.distance <= range;
      });

      for (const candidate of candidates) {
        if (!bestHit || candidate.distance < bestHit.distance) {
          bestHit = { enemy, distance: candidate.distance, hitZone: candidate.hitZone };
        }
      }
    }

    if (!bestHit) {
      return null;
    }

    const multiplier = bestHit.hitZone === "head" ? 2 : bestHit.hitZone === "legs" ? 0.75 : 1;
    const appliedDamage = Math.max(1, Math.round(damage * multiplier));
    bestHit.enemy.health = Math.max(0, bestHit.enemy.health - appliedDamage);
    bestHit.enemy.recentlyDamagedTimer = recentCombatAwakeSeconds;
    bestHit.enemy.active = true;
    bestHit.enemy.targetPlayerId = attackerId;
    if (bestHit.enemy.health <= 0) {
      bestHit.enemy.state = "dead";
      bestHit.enemy.active = false;
      bestHit.enemy.deadTimer = 0;
    } else {
      bestHit.enemy.state = "alert";
    }
    this.lastSnapshot = this.createSnapshot();

    return {
      id: bestHit.enemy.id,
      type: bestHit.enemy.type,
      attackerId,
      damage: appliedDamage,
      healthRemaining: Math.round(bestHit.enemy.health),
      maxHealth: bestHit.enemy.maxHealth,
      hitZone: bestHit.hitZone,
      killed: bestHit.enemy.state === "dead",
    };
  }

  private createSnapshot(): NetworkEnemySnapshot {
    this.snapshotId += 1;
    const enemies = Array.from(this.enemies.values()).map((enemy): NetworkEnemyState => ({
      id: enemy.id,
      type: enemy.type,
      x: enemy.x,
      y: enemy.y,
      z: enemy.z,
      yaw: enemy.yaw,
      health: Math.round(enemy.health),
      maxHealth: enemy.maxHealth,
      state: enemy.state,
      targetPlayerId: enemy.targetPlayerId,
      active: enemy.active,
    }));

    return {
      enemies,
      activeCount: enemies.filter((enemy) => enemy.active && enemy.state !== "dead").length,
      dormantCount: enemies.filter((enemy) => !enemy.active && enemy.state !== "dead").length,
      serverTickRate: serverEnemyTickRate,
      snapshotRate: enemySnapshotRate,
      snapshotId: this.snapshotId,
      serverTime: Date.now(),
    };
  }

  private selectTarget(enemy: ServerEnemy, players: readonly ServerEnemyPlayer[], nearest: ServerEnemyPlayer | null): ServerEnemyPlayer | null {
    const retained = enemy.targetPlayerId ? players.find((player) => player.id === enemy.targetPlayerId) ?? null : null;
    if (retained && this.distance(enemy, retained) <= targetRetentionDistance) {
      return retained;
    }

    if (nearest && this.distance(enemy, nearest) <= activeRelevanceDistance) {
      return nearest;
    }

    return enemy.recentlyDamagedTimer > 0 ? nearest : null;
  }

  private findNearestPlayer(enemy: ServerEnemy, players: readonly ServerEnemyPlayer[]): { player: ServerEnemyPlayer; distance: number } | null {
    let best: { player: ServerEnemyPlayer; distance: number } | null = null;
    for (const player of players) {
      const distance = this.distance(enemy, player);
      if (!best || distance < best.distance) {
        best = { player, distance };
      }
    }
    return best;
  }

  private updatePatrol(enemy: ServerEnemy, dt: number): void {
    enemy.state = "patrol";
    const target = enemy.patrolPoints[enemy.patrolIndex] ?? enemy.patrolPoints[0];
    const definition = enemyDefinitions[enemy.type];
    if (this.distance(enemy, target) <= 1.2) {
      enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrolPoints.length;
      return;
    }
    this.moveToward(enemy, target, definition.speed, dt);
  }

  private moveToward(enemy: ServerEnemy, target: NetworkVec3, speed: number, dt: number): void {
    const dx = target.x - enemy.x;
    const dz = target.z - enemy.z;
    const length = Math.hypot(dx, dz);
    if (length < 0.001) {
      return;
    }
    const step = Math.min(length, speed * dt);
    enemy.x += (dx / length) * step;
    enemy.z += (dz / length) * step;
    enemy.y = target.y;
    enemy.yaw = Math.atan2(dx, dz);
  }

  private distance(a: NetworkVec3, b: NetworkVec3): number {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }

  private raySphereDistance(origin: NetworkVec3, direction: NetworkVec3, center: NetworkVec3, radius: number): number | null {
    const ox = origin.x - center.x;
    const oy = origin.y - center.y;
    const oz = origin.z - center.z;
    const b = ox * direction.x + oy * direction.y + oz * direction.z;
    const c = ox * ox + oy * oy + oz * oz - radius * radius;
    const discriminant = b * b - c;

    if (discriminant < 0) {
      return null;
    }

    const distance = -b - Math.sqrt(discriminant);
    return distance >= 0 ? distance : null;
  }
}
