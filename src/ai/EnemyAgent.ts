import {
  AbstractMesh,
  Color3,
  MeshBuilder,
  PointLight,
  Ray,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { DamageEvent, DamageResult, Damageable } from "../combat/Damageable";
import type { PlayerHealth } from "../combat/PlayerHealth";
import type { InputSnapshot } from "../input/InputController";
import { wrapAngle, yawToBasis } from "../math/angles";
import type { NoiseEvent } from "../stealth/NoiseSystem";
import type { MotorState } from "../world/PlayerMotor";
import {
  enemyRoleDefinitions,
  enemyTypeDefinitions,
  type EnemyRole,
  type EnemyType,
} from "./EnemyTypes";

export type EnemyAiState = "idle" | "patrol" | "alert" | "search" | "chase" | "attack" | "dead";

export type EnemyDebugState = Readonly<{
  id: string;
  state: EnemyAiState;
  health: number;
  position: Vector3;
  target: Vector3 | null;
  coverTarget: Vector3 | null;
  lastKnownPlayerPosition: Vector3 | null;
  type: EnemyType;
  role: EnemyRole;
  elite: boolean;
  tactic: string;
}>;

export type EnemyAgentConfig = Readonly<{
  id: string;
  type?: EnemyType;
  role?: EnemyRole;
  spawn: Vector3;
  patrolPoints: Vector3[];
  maxHealth?: number;
  materialColor?: Color3;
  difficultyHealthMultiplier?: number;
  onPlayerHit?: (enemyType: EnemyType) => void;
  onKilled?: () => void;
}>;

type EnemyTuning = Readonly<{
  maxHealth: number;
  visionRange: number;
  visionHalfAngleDegrees: number;
  attackRange: number;
  combatDistance: number;
  patrolSpeed: number;
  chaseSpeed: number;
  acceleration: number;
  turnSharpness: number;
  gravity: number;
  groundedProbeDistance: number;
  reactionDelayMin: number;
  reactionDelayMax: number;
  searchDuration: number;
  attackCooldown: number;
  attackDamage: number;
  muzzleFlashDuration: number;
}>;

const tuning: EnemyTuning = {
  maxHealth: 100,
  visionRange: 25,
  visionHalfAngleDegrees: 58,
  attackRange: 18,
  combatDistance: 12,
  patrolSpeed: 1.8,
  chaseSpeed: 7.2,
  acceleration: 18,
  turnSharpness: 9,
  gravity: 24,
  groundedProbeDistance: 0.08,
  reactionDelayMin: 0.2,
  reactionDelayMax: 0.4,
  searchDuration: 3.2,
  attackCooldown: 0.95,
  attackDamage: 10,
  muzzleFlashDuration: 0.055,
};

export class EnemyAgent implements Damageable {
  private readonly body: AbstractMesh;
  private readonly head: AbstractMesh;
  private readonly headHitbox: AbstractMesh;
  private readonly torsoHitbox: AbstractMesh;
  private readonly legsHitbox: AbstractMesh;
  private readonly weapon: AbstractMesh;
  private readonly muzzleFlash: AbstractMesh;
  private readonly healthBarRoot: AbstractMesh;
  private readonly healthBarFill: AbstractMesh;
  private readonly feetDebug: AbstractMesh;
  private readonly losOriginDebug: AbstractMesh;
  private readonly muzzleLight: PointLight;
  private readonly liveMaterial: StandardMaterial;
  private readonly hitMaterial: StandardMaterial;
  private readonly deadMaterial: StandardMaterial;
  private readonly hitboxMaterial: StandardMaterial;
  private readonly tracerMaterial: StandardMaterial;
  private readonly debugLineMaterial: StandardMaterial;
  private readonly localTuning: EnemyTuning;
  private readonly enemyType: EnemyType;
  private readonly enemyRole: EnemyRole;
  private readonly armorDamageReduction: number;
  private readonly visionLines: AbstractMesh[] = [];
  private readonly transientEffects: Array<{ mesh: AbstractMesh; ttl: number }> = [];
  private hitboxDebugVisible = false;
  private losDebugVisible = false;
  private state: EnemyAiState = "patrol";
  private health: number;
  private velocity = Vector3.Zero();
  private yaw = 0;
  private patrolIndex = 0;
  private reactionTimer = 0;
  private searchTimer = 0;
  private attackTimer = 0;
  private burstShotsRemaining = 0;
  private burstTimer = 0;
  private shotsUntilReload = 0;
  private reloadTimer = 0;
  private combatTimer = 0;
  private repositionTimer = 0;
  private muzzleFlashTimer = 0;
  private hitFlashTimer = 0;
  private staggerTimer = 0;
  private healthBarTimer = 0;
  private lastKnownPlayerPosition: Vector3 | null = null;
  private currentMoveTarget: Vector3 | null = null;
  private coverTarget: Vector3 | null = null;
  private retreatTarget: Vector3 | null = null;
  private flankSign: -1 | 1 = Math.random() > 0.5 ? 1 : -1;
  private coverPeekTimer = 0;
  private currentTactic = "patrol";
  private sawPlayerThisFrame = false;

  public constructor(
    private readonly scene: Scene,
    private readonly config: EnemyAgentConfig,
    private readonly playerBody: AbstractMesh,
    private readonly playerHealth: PlayerHealth,
    private readonly debugEnabled = true,
  ) {
    this.enemyType = config.type ?? "grunt";
    this.enemyRole = config.role ?? this.defaultRoleForType(this.enemyType);
    const typeDefinition = enemyTypeDefinitions[this.enemyType];
    const roleDefinition = enemyRoleDefinitions[this.enemyRole];
    this.localTuning = {
      ...tuning,
      maxHealth: (config.maxHealth ?? typeDefinition.maxHealth) * (config.difficultyHealthMultiplier ?? 1),
      visionRange: typeDefinition.visionRange,
      attackRange: typeDefinition.attackRange,
      combatDistance: typeDefinition.combatDistance,
      patrolSpeed: typeDefinition.patrolSpeed,
      chaseSpeed: typeDefinition.chaseSpeed,
      attackCooldown: typeDefinition.attackCooldown,
      attackDamage: typeDefinition.attackDamage,
      reactionDelayMin: tuning.reactionDelayMin * roleDefinition.reactionMultiplier,
      reactionDelayMax: tuning.reactionDelayMax * roleDefinition.reactionMultiplier,
    };
    this.armorDamageReduction = typeDefinition.armorDamageReduction;
    this.health = this.localTuning.maxHealth;
    this.shotsUntilReload = roleDefinition.reloadAfterShots;
    this.liveMaterial = new StandardMaterial(`${config.id}-material`, scene);
    this.liveMaterial.diffuseColor = config.materialColor ?? typeDefinition.materialColor;
    this.liveMaterial.emissiveColor = this.liveMaterial.diffuseColor.scale(this.enemyType === "elite" ? 0.22 : 0.08);
    this.liveMaterial.specularColor = new Color3(0.16, 0.12, 0.18);

    this.hitMaterial = new StandardMaterial(`${config.id}-hit-material`, scene);
    this.hitMaterial.diffuseColor = new Color3(1, 0.62, 0.24);
    this.hitMaterial.emissiveColor = new Color3(0.35, 0.12, 0.02);

    this.deadMaterial = new StandardMaterial(`${config.id}-dead-material`, scene);
    this.deadMaterial.diffuseColor = new Color3(0.18, 0.18, 0.18);

    this.hitboxMaterial = new StandardMaterial(`${config.id}-hitbox-material`, scene);
    this.hitboxMaterial.diffuseColor = new Color3(0.15, 0.95, 1);
    this.hitboxMaterial.emissiveColor = new Color3(0.04, 0.28, 0.34);
    this.hitboxMaterial.alpha = 0.025;

    const weaponMaterial = new StandardMaterial(`${config.id}-weapon-material`, scene);
    weaponMaterial.diffuseColor = new Color3(0.08, 0.08, 0.09);

    const flashMaterial = new StandardMaterial(`${config.id}-muzzle-flash-material`, scene);
    flashMaterial.diffuseColor = new Color3(1, 0.65, 0.18);
    flashMaterial.emissiveColor = new Color3(1, 0.42, 0.06);

    this.tracerMaterial = new StandardMaterial(`${config.id}-tracer-material`, scene);
    this.tracerMaterial.emissiveColor = new Color3(1, 0.38, 0.22);
    this.tracerMaterial.disableLighting = true;

    this.debugLineMaterial = new StandardMaterial(`${config.id}-debug-line-material`, scene);
    this.debugLineMaterial.emissiveColor = new Color3(1, 0.18, 0.18);
    this.debugLineMaterial.disableLighting = true;

    this.body = MeshBuilder.CreateCapsule(
      `${config.id}-body`,
      {
        height: typeDefinition.colliderHeight,
        radius: typeDefinition.colliderRadius,
        tessellation: 18,
        subdivisions: 8,
      },
      scene,
    );
    this.body.position.copyFrom(this.snapSpawnToGround(config.spawn, typeDefinition.visualYOffset, typeDefinition.feetGroundOffset));
    this.body.scaling.set(typeDefinition.visualScale.x, typeDefinition.visualScale.y, typeDefinition.visualScale.z);
    this.body.ellipsoid = new Vector3(typeDefinition.colliderRadius, typeDefinition.colliderHeight * 0.5, typeDefinition.colliderRadius);
    this.body.ellipsoidOffset = new Vector3(0, typeDefinition.colliderHeight * 0.5 + typeDefinition.colliderYOffset, 0);
    this.body.checkCollisions = true;
    this.body.isPickable = false;
    this.body.material = this.liveMaterial;
    this.body.metadata = { gameplayTag: "enemy-visual", entityType: "enemy" };

    this.head = MeshBuilder.CreateSphere(
      `${config.id}-head`,
      { diameter: 0.52, segments: 16 },
      scene,
    );
    this.head.parent = this.body;
    this.head.position.y = 1.1 * typeDefinition.visualScale.y;
    this.head.scaling.set(1.18 * typeDefinition.visualScale.head, 1.08 * typeDefinition.visualScale.head, 1.18 * typeDefinition.visualScale.head);
    this.head.material = this.liveMaterial;
    this.head.isPickable = false;
    this.head.metadata = { gameplayTag: "enemy-visual", entityType: "enemy" };

    this.headHitbox = MeshBuilder.CreateSphere(
      `${config.id}-hitbox-head`,
      { diameter: 0.92, segments: 12 },
      scene,
    );
    this.headHitbox.parent = this.body;
    this.headHitbox.position.y = 1.12 * typeDefinition.visualScale.y + typeDefinition.hitboxYOffset;
    this.headHitbox.scaling.set(1.14 * typeDefinition.visualScale.head, 1.04 * typeDefinition.visualScale.head, 1.14 * typeDefinition.visualScale.head);
    this.headHitbox.material = this.hitboxMaterial;
    this.headHitbox.checkCollisions = false;
    this.headHitbox.isPickable = true;
    this.headHitbox.metadata = { gameplayTag: "damageable", hitZone: "head", target: this };

    this.torsoHitbox = MeshBuilder.CreateBox(
      `${config.id}-hitbox-torso`,
      { width: 1.24, height: 1.36, depth: 0.94 },
      scene,
    );
    this.torsoHitbox.parent = this.body;
    this.torsoHitbox.position.y = 0.26 * typeDefinition.visualScale.y + typeDefinition.hitboxYOffset;
    this.torsoHitbox.material = this.hitboxMaterial;
    this.torsoHitbox.checkCollisions = false;
    this.torsoHitbox.isPickable = true;
    this.torsoHitbox.metadata = { gameplayTag: "damageable", hitZone: "body", target: this };

    this.legsHitbox = MeshBuilder.CreateBox(
      `${config.id}-hitbox-legs`,
      { width: 1.06, height: 0.78, depth: 0.82 },
      scene,
    );
    this.legsHitbox.parent = this.body;
    this.legsHitbox.position.y = -0.36 * typeDefinition.visualScale.y + typeDefinition.hitboxYOffset;
    this.legsHitbox.material = this.hitboxMaterial;
    this.legsHitbox.checkCollisions = false;
    this.legsHitbox.isPickable = true;
    this.legsHitbox.metadata = { gameplayTag: "damageable", hitZone: "legs", target: this };

    this.weapon = MeshBuilder.CreateBox(
      `${config.id}-weapon`,
      { width: 0.14, height: 0.14, depth: 0.7 },
      scene,
    );
    this.weapon.parent = this.body;
    this.weapon.position.set(0.36, 0.56, 0.42);
    this.weapon.material = weaponMaterial;
    this.weapon.isPickable = false;

    this.muzzleFlash = MeshBuilder.CreateSphere(
      `${config.id}-muzzle-flash`,
      { diameter: 0.22, segments: 8 },
      scene,
    );
    this.muzzleFlash.parent = this.weapon;
    this.muzzleFlash.position.z = 0.44;
    this.muzzleFlash.material = flashMaterial;
    this.muzzleFlash.isPickable = false;
    this.muzzleFlash.setEnabled(false);

    const healthBackMaterial = new StandardMaterial(`${config.id}-health-back-material`, scene);
    healthBackMaterial.diffuseColor = new Color3(0.05, 0.06, 0.09);
    healthBackMaterial.emissiveColor = new Color3(0.02, 0.03, 0.04);
    const healthFillMaterial = new StandardMaterial(`${config.id}-health-fill-material`, scene);
    healthFillMaterial.diffuseColor = this.enemyType === "elite" ? new Color3(0.98, 0.72, 0.18) : new Color3(0.2, 0.92, 0.55);
    healthFillMaterial.emissiveColor = healthFillMaterial.diffuseColor.scale(0.38);

    this.healthBarRoot = MeshBuilder.CreateBox(`${config.id}-health-bar`, { width: 1.15, height: 0.08, depth: 0.04 }, scene);
    this.healthBarRoot.parent = this.body;
    this.healthBarRoot.position.y = 1.65 * typeDefinition.visualScale.y;
    this.healthBarRoot.material = healthBackMaterial;
    this.healthBarRoot.isPickable = false;
    this.healthBarRoot.setEnabled(false);
    this.healthBarFill = MeshBuilder.CreateBox(`${config.id}-health-bar-fill`, { width: 1.08, height: 0.052, depth: 0.05 }, scene);
    this.healthBarFill.parent = this.healthBarRoot;
    this.healthBarFill.isPickable = false;
    this.healthBarFill.position.z = -0.012;
    this.healthBarFill.material = healthFillMaterial;

    this.feetDebug = MeshBuilder.CreateSphere(`${config.id}-feet-debug`, { diameter: 0.16, segments: 8 }, scene);
    this.feetDebug.parent = this.body;
    this.feetDebug.position.y = -typeDefinition.visualYOffset;
    this.feetDebug.material = this.debugLineMaterial;
    this.feetDebug.isPickable = false;
    this.feetDebug.setEnabled(false);

    this.losOriginDebug = MeshBuilder.CreateSphere(`${config.id}-los-origin-debug`, { diameter: 0.16, segments: 8 }, scene);
    this.losOriginDebug.parent = this.body;
    this.losOriginDebug.position.y = typeDefinition.losOriginYOffset;
    this.losOriginDebug.material = this.debugLineMaterial;
    this.losOriginDebug.isPickable = false;
    this.losOriginDebug.setEnabled(false);

    this.muzzleLight = new PointLight(`${config.id}-muzzle-light`, Vector3.Zero(), scene);
    this.muzzleLight.parent = this.weapon;
    this.muzzleLight.position.z = 0.48;
    this.muzzleLight.diffuse = new Color3(1, 0.45, 0.22);
    this.muzzleLight.intensity = 0;
    this.muzzleLight.range = 4;

    this.createDebugVision();
  }

  public get debugState(): EnemyDebugState {
    return {
      id: this.config.id,
      state: this.state,
      health: this.health,
      position: this.body.position.clone(),
      target: this.currentMoveTarget?.clone() ?? null,
      coverTarget: this.coverTarget?.clone() ?? null,
      lastKnownPlayerPosition: this.lastKnownPlayerPosition?.clone() ?? null,
      type: this.enemyType,
      role: this.enemyRole,
      elite: this.enemyType === "elite",
      tactic: this.currentTactic,
    };
  }

  public get alive(): boolean {
    return this.state !== "dead";
  }

  public get alertPosition(): Vector3 | null {
    if (this.state !== "alert" && this.state !== "search" && this.state !== "chase" && this.state !== "attack") {
      return null;
    }

    return this.lastKnownPlayerPosition?.clone() ?? null;
  }

  public get alertRadius(): number {
    return (this.sawPlayerThisFrame ? 13 : 8) * (this.enemyRole === "support" ? 1.2 : 1);
  }

  public setHitboxDebugVisible(visible: boolean): void {
    this.hitboxDebugVisible = visible;
    this.hitboxMaterial.alpha = visible ? 0.3 : 0.025;
    this.headHitbox.visibility = visible ? 1 : 0.18;
    this.torsoHitbox.visibility = visible ? 1 : 0.18;
    this.legsHitbox.visibility = visible ? 1 : 0.18;
    this.feetDebug.setEnabled(visible);
    this.losOriginDebug.setEnabled(visible || this.losDebugVisible);
  }

  public setLosDebugVisible(visible: boolean): void {
    this.losDebugVisible = visible;
    this.losOriginDebug.setEnabled(visible || this.hitboxDebugVisible);
    for (const line of this.visionLines) {
      line.setEnabled(visible);
    }
  }

  public receiveSquadAlert(position: Vector3, sourceId: string, weaponNoiseMultiplier = 1): void {
    if (!this.alive || sourceId === this.config.id) {
      return;
    }

    const alertRange = 18 * weaponNoiseMultiplier;

    if (Vector3.Distance(this.body.position, position) > alertRange) {
      return;
    }

    if (this.state === "attack" || this.state === "chase") {
      return;
    }

    this.lastKnownPlayerPosition = position.clone();
    this.state = "alert";
    this.reactionTimer = this.randomRange(this.localTuning.reactionDelayMin, this.localTuning.reactionDelayMax);
    this.currentTactic = "squad alert";
  }

  public receiveNoise(event: NoiseEvent): void {
    if (!this.alive || this.state === "attack" || this.state === "chase") {
      return;
    }

    const distance = Vector3.Distance(this.body.position, event.position);

    if (distance > event.radius) {
      return;
    }

    const urgency = 1 - distance / event.radius;
    const reactionScale = Math.max(0.45, 1 - urgency * 0.4);
    this.lastKnownPlayerPosition = event.position.clone();
    this.state = "alert";
    this.reactionTimer = this.randomRange(
      this.localTuning.reactionDelayMin * reactionScale,
      this.localTuning.reactionDelayMax * reactionScale,
    );
    this.searchTimer = this.localTuning.searchDuration;
    this.currentTactic = `heard ${event.type}`;
  }

  public update(
    dt: number,
    input: InputSnapshot,
    playerState: MotorState,
    visionMultiplier = 1,
  ): void {
    this.updateEffects(dt);

    if (this.state === "dead") {
      return;
    }

    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    this.staggerTimer = Math.max(0, this.staggerTimer - dt);
    this.healthBarTimer = Math.max(0, this.healthBarTimer - dt);
    this.healthBarRoot.setEnabled(this.healthBarTimer > 0 || this.enemyType === "elite");
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.burstTimer = Math.max(0, this.burstTimer - dt);
    this.reloadTimer = Math.max(0, this.reloadTimer - dt);
    this.repositionTimer = Math.max(0, this.repositionTimer - dt);
    this.updateMaterial();

    const detection = this.detectPlayer(input, playerState, visionMultiplier);
    this.sawPlayerThisFrame = detection.visible;
    this.updateState(dt, detection.visible, playerState.position);
    this.updateMovement(dt, playerState.position);
    this.updateCombat(playerState.position);
    this.updateDebugVision();
  }

  public applyDamage(event: DamageEvent): DamageResult {
    if (this.state === "dead") {
      return {
        appliedDamage: 0,
        killed: true,
        hitZone: event.hitZone,
        point: event.point.clone(),
      };
    }

    const appliedDamage = Math.max(1, Math.round(event.amount * (1 - this.armorDamageReduction)));
    this.health = Math.max(0, this.health - appliedDamage);
    this.hitFlashTimer = 0.1;
    this.healthBarTimer = 2.6;
    this.lastKnownPlayerPosition = event.point.clone();
    this.updateHealthBar();

    if (appliedDamage >= 38 || event.hitZone === "head") {
      this.staggerTimer = 0.22;
      this.velocity.scaleInPlace(0.35);
      this.spawnHitBurst(event.point, event.hitZone === "head");
    }

    const killed = this.health === 0;

    if (killed) {
      this.die();
    } else if (this.state !== "attack" && this.state !== "chase") {
      this.state = "alert";
      this.reactionTimer = this.localTuning.reactionDelayMin;
    }

    this.retreatTarget = this.pickRetreatTarget();
    this.currentTactic = "hit reaction";

    return {
      appliedDamage,
      killed,
      hitZone: event.hitZone,
      point: event.point.clone(),
    };
  }

  public dispose(): void {
    for (const effect of this.transientEffects) {
      effect.mesh.dispose();
    }

    for (const line of this.visionLines) {
      line.dispose();
    }

    this.muzzleLight.dispose();
    this.feetDebug.dispose();
    this.losOriginDebug.dispose();
    this.body.dispose(false, true);
  }

  private updateState(dt: number, playerVisible: boolean, playerPosition: Vector3): void {
    if (playerVisible) {
      this.lastKnownPlayerPosition = playerPosition.clone();

      if (this.state === "patrol" || this.state === "idle" || this.state === "search") {
        this.state = "alert";
        this.reactionTimer = this.randomRange(this.localTuning.reactionDelayMin, this.localTuning.reactionDelayMax);
      }
    }

    switch (this.state) {
      case "idle":
        this.state = "patrol";
        break;
      case "patrol":
        this.currentTactic = "patrol";
        this.updatePatrolTarget();
        break;
      case "alert":
        this.currentTactic = "alert";
        this.reactionTimer = Math.max(0, this.reactionTimer - dt);
        this.currentMoveTarget = null;
        if (this.reactionTimer === 0) {
          this.state = playerVisible ? "chase" : "search";
          this.searchTimer = this.localTuning.searchDuration;
        }
        break;
      case "search":
        this.currentTactic = "investigate";
        this.searchTimer = Math.max(0, this.searchTimer - dt);
        this.currentMoveTarget = this.lastKnownPlayerPosition?.clone() ?? null;
        if (playerVisible) {
          this.state = "chase";
        } else if (this.searchTimer === 0) {
          this.state = "patrol";
          this.lastKnownPlayerPosition = null;
        }
        break;
      case "chase":
      case "attack": {
        const distance = Vector3.Distance(this.body.position, playerPosition);
        const role = enemyRoleDefinitions[this.enemyRole];
        const injured = this.health / this.localTuning.maxHealth <= role.retreatHealthRatio;
        if (!playerVisible) {
          this.state = "search";
          this.searchTimer = this.localTuning.searchDuration;
          break;
        }

        if (injured && this.enemyRole !== "rusher") {
          this.retreatTarget = this.retreatTarget ?? this.pickRetreatTarget(playerPosition);
          this.currentTactic = "retreat";
          this.state = "chase";
          break;
        }

        this.combatTimer += dt;
        if (this.combatTimer >= role.repositionInterval) {
          this.combatTimer = 0;
          this.repositionTimer = 1.8;
          this.flankSign = this.flankSign === 1 ? -1 : 1;
        }

        this.state = distance <= this.localTuning.attackRange ? "attack" : "chase";
        break;
      }
      case "dead":
        break;
    }
  }

  private updateMovement(dt: number, playerPosition: Vector3): void {
    if (this.state === "patrol") {
      this.moveToward(dt, this.currentMoveTarget, this.localTuning.patrolSpeed);
    } else if (this.state === "search") {
      this.moveToward(dt, this.currentMoveTarget, this.localTuning.patrolSpeed * 1.15);
    } else if (this.state === "chase") {
      this.currentMoveTarget = this.selectCombatMoveTarget(playerPosition, true);
      this.moveToward(dt, this.currentMoveTarget, this.localTuning.chaseSpeed);
    } else if (this.state === "attack") {
      const distance = Vector3.Distance(this.body.position, playerPosition);
      this.currentMoveTarget = distance > this.localTuning.combatDistance
        ? this.selectCombatMoveTarget(playerPosition, false)
        : this.selectHoldCoverTarget(playerPosition);
      this.moveToward(dt, this.currentMoveTarget, this.localTuning.patrolSpeed);
      this.turnToward(dt, playerPosition);
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    this.velocity.y -= this.localTuning.gravity * dt;
    this.body.moveWithCollisions(this.velocity.scale(dt));
    this.resolveGrounded();
  }

  private moveToward(dt: number, target: Vector3 | null, speed: number): void {
    if (!target) {
      this.velocity.x = this.moveScalarToward(this.velocity.x, 0, this.localTuning.acceleration * dt);
      this.velocity.z = this.moveScalarToward(this.velocity.z, 0, this.localTuning.acceleration * dt);
      return;
    }

    const toTarget = target.subtract(this.body.position);
    toTarget.y = 0;

    if (toTarget.lengthSquared() < 0.8) {
      this.velocity.x = this.moveScalarToward(this.velocity.x, 0, this.localTuning.acceleration * dt);
      this.velocity.z = this.moveScalarToward(this.velocity.z, 0, this.localTuning.acceleration * dt);
      return;
    }

    const desiredDirection = this.getSteeredDirection(toTarget.normalize());
    const desiredVelocity = desiredDirection.scale(speed);
    this.velocity.x = this.moveScalarToward(this.velocity.x, desiredVelocity.x, this.localTuning.acceleration * dt);
    this.velocity.z = this.moveScalarToward(this.velocity.z, desiredVelocity.z, this.localTuning.acceleration * dt);
    this.turnToward(dt, this.body.position.add(desiredDirection));
  }

  private getSteeredDirection(direction: Vector3): Vector3 {
    const origin = this.eyePosition;
    const obstacleRay = new Ray(origin, direction, 2.4);
    const hit = this.scene.pickWithRay(obstacleRay, (mesh) => {
      return mesh.checkCollisions && mesh !== this.body && mesh !== this.playerBody;
    });

    if (!hit?.hit) {
      return direction;
    }

    const left = new Vector3(-direction.z, 0, direction.x);
    const right = new Vector3(direction.z, 0, -direction.x);
    const leftClear = !this.scene.pickWithRay(new Ray(origin, left, 2.1), (mesh) => mesh.checkCollisions && mesh !== this.body)?.hit;

    return leftClear ? left : right;
  }

  private updateCombat(playerPosition: Vector3): void {
    if (this.state !== "attack" || this.attackTimer > 0 || !this.playerHealth.snapshot.alive) {
      return;
    }

    if (this.reloadTimer > 0) {
      this.currentTactic = "reload";
      return;
    }

    const role = enemyRoleDefinitions[this.enemyRole];
    const distanceToPlayer = Vector3.Distance(this.body.position, playerPosition);
    const meleeAlien = this.enemyType === "grunt" || this.enemyType === "charger" || this.enemyType === "guard";

    if (meleeAlien && distanceToPlayer <= this.localTuning.attackRange) {
      this.attackTimer = this.localTuning.attackCooldown;
      this.currentTactic = this.enemyType === "grunt"
        ? "swarm leap"
        : this.enemyType === "charger"
          ? "burrow ambush"
          : "guardian slam";
      this.turnToward(0.08, playerPosition);
      this.playerHealth.applyDamage(this.localTuning.attackDamage, this.body.position, this.playerBody.position);
      this.config.onPlayerHit?.(this.enemyType);
      this.spawnHitBurst(playerPosition.add(new Vector3(0, 1, 0)), this.enemyType === "guard");
      return;
    }

    const inCover = this.coverTarget !== null && Vector3.Distance(this.body.position, this.coverTarget) < 1.5;

    if (inCover && this.coverPeekTimer <= 0 && this.burstShotsRemaining === 0) {
      this.coverPeekTimer = this.randomRange(0.16, 0.34);
      this.currentTactic = "peek";
      return;
    }

    this.coverPeekTimer = Math.max(0, this.coverPeekTimer - 0.016);

    if (this.burstShotsRemaining === 0) {
      this.burstShotsRemaining = role.burstShots;
    }

    if (this.burstTimer > 0) {
      return;
    }

    this.burstShotsRemaining -= 1;
    this.shotsUntilReload -= 1;
    this.burstTimer = role.burstInterval;
    this.attackTimer = this.burstShotsRemaining > 0
      ? role.burstInterval
      : this.localTuning.attackCooldown * (1 - role.suppression * 0.25);
    this.currentTactic = this.enemyType === "spitter"
      ? "acid spit"
      : this.enemyType === "elite"
        ? "lunacy pressure"
        : role.suppression > 0.5 ? "suppress" : inCover ? "peek fire" : "fire";

    if (this.shotsUntilReload <= 0) {
      this.reloadTimer = role.reloadTime;
      this.shotsUntilReload = role.reloadAfterShots;
      this.burstShotsRemaining = 0;
    }

    this.showMuzzleFlash();

    const start = this.weapon.getAbsolutePosition().add(new Vector3(0, 0.02, 0.32));
    const aimPoint = playerPosition
      .add(new Vector3(0, 1.15, 0))
      .addInPlace(this.randomAimOffset(role.accuracy));
    const direction = aimPoint.subtract(start).normalize();
    const ray = new Ray(start, direction, this.localTuning.attackRange + 4);
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      const metadata = mesh.metadata as { gameplayTag?: string } | null | undefined;
      return mesh.isEnabled() &&
        mesh !== this.body &&
        mesh !== this.head &&
        mesh !== this.weapon &&
        metadata?.gameplayTag !== "damageable";
    });
    const end = hit?.hit && hit.pickedPoint
      ? hit.pickedPoint
      : start.add(direction.scale(this.localTuning.attackRange));

    this.spawnTracer(start, end, this.enemyType === "spitter" ? new Color3(0.38, 1, 0.48) : this.enemyType === "elite" ? new Color3(0.52, 0.24, 1) : undefined);

    if (hit?.pickedMesh && this.isPlayerMesh(hit.pickedMesh)) {
      this.playerHealth.applyDamage(this.localTuning.attackDamage, this.body.position, this.playerBody.position);
      this.config.onPlayerHit?.(this.enemyType);
    }
  }

  private detectPlayer(
    input: InputSnapshot,
    playerState: MotorState,
    visionMultiplier = 1,
  ): { visible: boolean } {
    if (!this.playerHealth.snapshot.alive) {
      return { visible: false };
    }

    const playerPosition = playerState.position.add(new Vector3(0, 1.1, 0));
    const toPlayer = playerPosition.subtract(this.eyePosition);
    const distance = toPlayer.length();
    const sprintBonus = input.sprintHeld && input.moveZ > 0 ? 1.35 : 1;
    const crouchPenalty = playerState.crouched ? 0.62 : 1;
    const effectiveRange = this.localTuning.visionRange * sprintBonus * crouchPenalty * visionMultiplier;

    if (distance > effectiveRange) {
      return { visible: false };
    }

    const forward = yawToBasis(this.yaw).forward;
    const direction = toPlayer.normalize();
    const minDot = Math.cos((this.localTuning.visionHalfAngleDegrees * Math.PI) / 180);
    const closeRangeGrace = distance < 5.5;

    if (!closeRangeGrace && Vector3.Dot(forward, direction) < minDot) {
      return { visible: false };
    }

    return { visible: this.hasLineOfSight(playerPosition, distance) };
  }

  private hasLineOfSight(playerPosition: Vector3, playerDistance: number): boolean {
    const direction = playerPosition.subtract(this.eyePosition).normalize();
    const ray = new Ray(this.eyePosition, direction, playerDistance + 0.4);
    const hit = this.scene.pickWithRay(ray, (mesh) => this.canBlockLineOfSight(mesh));

    if (!hit?.hit || !hit.pickedMesh || !hit.pickedPoint) {
      return true;
    }

    if (this.isPlayerMesh(hit.pickedMesh)) {
      return true;
    }

    return Vector3.Distance(this.eyePosition, hit.pickedPoint) >= playerDistance - 0.35;
  }

  private updatePatrolTarget(): void {
    if (this.config.patrolPoints.length === 0) {
      this.currentMoveTarget = null;
      return;
    }

    const target = this.config.patrolPoints[this.patrolIndex];
    this.currentMoveTarget = target.clone();

    if (Vector3.Distance(this.body.position, target) < 1.2) {
      this.patrolIndex = (this.patrolIndex + 1) % this.config.patrolPoints.length;
    }
  }

  private selectCombatMoveTarget(playerPosition: Vector3, chasing: boolean): Vector3 {
    const role = enemyRoleDefinitions[this.enemyRole];

    if (this.retreatTarget) {
      this.currentTactic = "retreat";
      if (Vector3.Distance(this.body.position, this.retreatTarget) < 1.6) {
        this.retreatTarget = null;
      } else {
        return this.retreatTarget.clone();
      }
    }

    if (this.enemyRole === "flanker" || this.repositionTimer > 0) {
      this.currentTactic = "flank";
      return this.getFlankTarget(playerPosition, role.flankBias);
    }

    if (this.enemyRole !== "rusher") {
      const cover = this.findCoverTarget(playerPosition, role.preferredCoverDistance);

      if (cover) {
        this.coverTarget = cover;
        this.currentTactic = chasing ? "move to cover" : "hold cover";
        return cover.clone();
      }
    }

    this.coverTarget = null;
    this.currentTactic = this.enemyRole === "rusher" ? "rush" : "advance";
    return playerPosition.clone();
  }

  private selectHoldCoverTarget(playerPosition: Vector3): Vector3 | null {
    if (this.enemyRole === "rusher") {
      this.currentTactic = "pressure";
      return null;
    }

    const role = enemyRoleDefinitions[this.enemyRole];
    const cover = this.coverTarget ?? this.findCoverTarget(playerPosition, role.preferredCoverDistance);
    this.coverTarget = cover;

    if (cover && Vector3.Distance(this.body.position, cover) > 1.4) {
      this.currentTactic = "adjust cover";
      return cover.clone();
    }

    this.currentTactic = cover ? "hold cover" : "hold angle";
    return null;
  }

  private findCoverTarget(playerPosition: Vector3, maxDistance: number): Vector3 | null {
    let best: Vector3 | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const mesh of this.scene.meshes) {
      const tag = (mesh.metadata as { gameplayTag?: string } | null | undefined)?.gameplayTag;

      if (!mesh.isEnabled() || !mesh.checkCollisions || (tag !== "cover" && tag !== "poi-wall")) {
        continue;
      }

      const bounds = mesh.getBoundingInfo().boundingBox;
      const height = bounds.maximumWorld.y - bounds.minimumWorld.y;

      if (height < 0.75 || height > 4.25) {
        continue;
      }

      const center = mesh.getAbsolutePosition();
      const enemyDistance = Vector3.Distance(this.body.position, center);

      if (enemyDistance > maxDistance) {
        continue;
      }

      const awayFromPlayer = center.subtract(playerPosition);
      awayFromPlayer.y = 0;

      if (awayFromPlayer.lengthSquared() < 0.01) {
        continue;
      }

      const target = center.add(awayFromPlayer.normalize().scale(1.35));
      target.y = this.body.position.y;
      const playerDistance = Vector3.Distance(target, playerPosition);
      const score = enemyDistance + Math.abs(playerDistance - this.localTuning.combatDistance) * 0.35;

      if (score < bestScore) {
        bestScore = score;
        best = target;
      }
    }

    return best;
  }

  private getFlankTarget(playerPosition: Vector3, strength: number): Vector3 {
    const toPlayer = playerPosition.subtract(this.body.position);
    toPlayer.y = 0;

    if (toPlayer.lengthSquared() < 0.001) {
      return playerPosition.clone();
    }

    const direction = toPlayer.normalize();
    const side = new Vector3(direction.z * this.flankSign, 0, -direction.x * this.flankSign);
    const target = playerPosition
      .subtract(direction.scale(this.localTuning.combatDistance * 0.65))
      .addInPlace(side.scale((this.enemyRole === "flanker" ? 9 : 5) * strength));
    target.y = this.body.position.y;
    return target;
  }

  private pickRetreatTarget(playerPosition = this.lastKnownPlayerPosition ?? this.body.position): Vector3 {
    const away = this.body.position.subtract(playerPosition);
    away.y = 0;

    if (away.lengthSquared() < 0.01) {
      away.copyFrom(new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5));
    }

    return this.body.position.add(away.normalize().scale(8));
  }

  private randomAimOffset(accuracy: number): Vector3 {
    const miss = (1 - accuracy) * 1.15;
    return new Vector3(
      (Math.random() - 0.5) * miss,
      (Math.random() - 0.5) * miss * 0.7,
      (Math.random() - 0.5) * miss,
    );
  }

  private resolveGrounded(): void {
    const yBefore = this.body.position.y;
    this.body.moveWithCollisions(new Vector3(0, -this.localTuning.groundedProbeDistance, 0));
    const yAfter = this.body.position.y;
    const grounded = Math.abs(yBefore - yAfter) < 0.0001 && this.velocity.y <= 0;

    if (grounded && this.velocity.y < 0) {
      this.velocity.y = -0.5;
    } else if (!grounded) {
      this.body.position.y = yBefore;
    }
  }

  private turnToward(dt: number, target: Vector3): void {
    const toTarget = target.subtract(this.body.position);
    toTarget.y = 0;

    if (toTarget.lengthSquared() < 0.0001) {
      return;
    }

    const desiredYaw = Math.atan2(toTarget.x, toTarget.z);
    const delta = wrapAngle(desiredYaw - this.yaw);
    const blend = 1 - Math.exp(-this.localTuning.turnSharpness * dt);
    this.yaw = wrapAngle(this.yaw + delta * blend);
    this.body.rotation.y = this.yaw;
    this.body.rotation.x = this.staggerTimer > 0 ? -0.12 : 0;
  }

  private updateMaterial(): void {
    const material = this.hitFlashTimer > 0 ? this.hitMaterial : this.liveMaterial;
    this.body.material = material;
    this.head.material = material;
  }

  private die(): void {
    this.state = "dead";
    this.body.checkCollisions = false;
    this.head.checkCollisions = false;
    this.headHitbox.setEnabled(false);
    this.torsoHitbox.setEnabled(false);
    this.legsHitbox.setEnabled(false);
    this.body.material = this.deadMaterial;
    this.head.material = this.deadMaterial;
    this.body.rotation.z = Math.PI / 2;
    this.body.position.y = 0.35;
    this.healthBarRoot.setEnabled(false);
    this.currentMoveTarget = null;
    this.muzzleFlash.setEnabled(false);
    this.muzzleLight.intensity = 0;
    this.spawnDeathEffect();
    this.config.onKilled?.();
  }

  private showMuzzleFlash(): void {
    this.muzzleFlashTimer = this.localTuning.muzzleFlashDuration;
    this.muzzleFlash.setEnabled(true);
    this.muzzleLight.intensity = 2;
  }

  private updateEffects(dt: number): void {
    this.muzzleFlashTimer = Math.max(0, this.muzzleFlashTimer - dt);
    this.muzzleFlash.setEnabled(this.muzzleFlashTimer > 0);
    this.muzzleLight.intensity = this.muzzleFlashTimer > 0 ? 2 : 0;

    for (let i = this.transientEffects.length - 1; i >= 0; i -= 1) {
      const effect = this.transientEffects[i];
      const ttl = effect.ttl - dt;

      if (ttl > 0) {
        this.transientEffects[i] = { ...effect, ttl };
      } else {
        effect.mesh.dispose();
        this.transientEffects.splice(i, 1);
      }
    }
  }

  private spawnTracer(start: Vector3, end: Vector3, color = new Color3(1, 0.34, 0.22)): void {
    const tracer = MeshBuilder.CreateLines(
      `${this.config.id}-tracer`,
      { points: [start, end] },
      this.scene,
    );
    tracer.color = color;
    tracer.material = this.tracerMaterial;
    this.transientEffects.push({ mesh: tracer, ttl: 0.06 });
  }

  private updateHealthBar(): void {
    const fraction = Math.max(0.04, this.health / this.localTuning.maxHealth);
    this.healthBarFill.scaling.x = fraction;
    this.healthBarFill.position.x = -(1 - fraction) * 0.27;
  }

  private spawnHitBurst(position: Vector3, headshot: boolean): void {
    const burst = MeshBuilder.CreateSphere(
      `${this.config.id}-hit-burst`,
      { diameter: headshot ? 0.38 : 0.26, segments: 8 },
      this.scene,
    );
    burst.position.copyFrom(position);
    const material = new StandardMaterial(`${this.config.id}-hit-burst-material`, this.scene);
    material.diffuseColor = headshot ? new Color3(1, 0.82, 0.16) : new Color3(1, 0.45, 0.18);
    material.emissiveColor = material.diffuseColor.scale(0.55);
    burst.material = material;
    this.transientEffects.push({ mesh: burst, ttl: 0.16 });
  }

  private spawnDeathEffect(): void {
    for (let i = 0; i < 5; i += 1) {
      const shard = MeshBuilder.CreateBox(
        `${this.config.id}-death-shard-${i}`,
        { size: 0.18 + Math.random() * 0.12 },
        this.scene,
      );
      shard.position.copyFrom(this.body.position.add(new Vector3((Math.random() - 0.5) * 0.7, 0.8 + Math.random() * 0.5, (Math.random() - 0.5) * 0.7)));
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      shard.material = this.deadMaterial;
      this.transientEffects.push({ mesh: shard, ttl: 0.65 });
    }
  }

  private createDebugVision(): void {
    if (!this.debugEnabled) {
      return;
    }

    for (let i = 0; i < 3; i += 1) {
      const line = MeshBuilder.CreateLines(
        `${this.config.id}-vision-debug-${i}`,
        { points: [Vector3.Zero(), Vector3.Forward()] },
        this.scene,
      );
      line.color = new Color3(1, 0.14, 0.14);
      line.material = this.debugLineMaterial;
      line.setEnabled(this.losDebugVisible);
      this.visionLines.push(line);
    }
  }

  private updateDebugVision(): void {
    if (!this.debugEnabled || this.visionLines.length === 0) {
      return;
    }

    const origin = this.eyePosition;
    const forward = yawToBasis(this.yaw).forward;
    const left = this.rotateYaw(forward, (this.localTuning.visionHalfAngleDegrees * Math.PI) / 180);
    const right = this.rotateYaw(forward, (-this.localTuning.visionHalfAngleDegrees * Math.PI) / 180);
    const lines = [forward, left, right];

    for (let i = 0; i < this.visionLines.length; i += 1) {
      this.visionLines[i].dispose();
      const line = MeshBuilder.CreateLines(
        `${this.config.id}-vision-debug-${i}`,
        { points: [origin, origin.add(lines[i].scale(this.localTuning.visionRange))] },
        this.scene,
      );
      line.color = this.state === "attack" || this.state === "chase"
        ? new Color3(1, 0.1, 0.08)
        : new Color3(1, 0.75, 0.18);
      line.setEnabled(this.losDebugVisible);
      this.visionLines[i] = line;
    }
  }

  private defaultRoleForType(type: EnemyType): EnemyRole {
    if (type === "charger" || type === "grunt") {
      return "rusher";
    }

    if (type === "spitter" || type === "guard") {
      return Math.random() > 0.5 ? "support" : "rifleman";
    }

    if (type === "elite") {
      return "flanker";
    }

    return Math.random() > 0.35 ? "rifleman" : "flanker";
  }

  private rotateYaw(vector: Vector3, radians: number): Vector3 {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return new Vector3(
      vector.x * cos + vector.z * sin,
      0,
      -vector.x * sin + vector.z * cos,
    );
  }

  private moveScalarToward(current: number, target: number, maxDelta: number): number {
    const delta = target - current;

    if (Math.abs(delta) <= maxDelta) {
      return target;
    }

    return current + Math.sign(delta) * maxDelta;
  }

  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private isPlayerMesh(mesh: AbstractMesh): boolean {
    const metadata = mesh.metadata as { entityType?: string } | null | undefined;
    return mesh === this.playerBody || metadata?.entityType === "player";
  }

  private canBlockLineOfSight(mesh: AbstractMesh): boolean {
    const metadata = mesh.metadata as { gameplayTag?: string; entityType?: string } | null | undefined;
    const tag = metadata?.gameplayTag;

    if (
      !mesh.isEnabled() ||
      mesh === this.body ||
      mesh === this.head ||
      mesh === this.headHitbox ||
      mesh === this.torsoHitbox ||
      mesh === this.legsHitbox
    ) {
      return false;
    }

    if (
      metadata?.entityType === "enemy" ||
      tag === "damageable" ||
      tag === "loot-container" ||
      tag === "loot-rarity-marker" ||
      tag === "extraction-zone" ||
      tag === "extraction-beam" ||
      tag === "objective-marker" ||
      tag === "traversal-prompt" ||
      tag?.includes("debug")
    ) {
      return false;
    }

    return this.isPlayerMesh(mesh) || mesh.checkCollisions;
  }

  private snapSpawnToGround(spawn: Vector3, visualYOffset: number, feetGroundOffset: number): Vector3 {
    const ray = new Ray(spawn.add(new Vector3(0, 12, 0)), Vector3.Down(), 32);
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      const tag = (mesh.metadata as { gameplayTag?: string } | null | undefined)?.gameplayTag;
      return mesh.isEnabled() && mesh.checkCollisions && tag !== "enemy-visual" && tag !== "damageable";
    });
    const grounded = spawn.clone();
    grounded.y = hit?.hit && hit.pickedPoint
      ? hit.pickedPoint.y + visualYOffset + feetGroundOffset
      : visualYOffset + feetGroundOffset;
    return grounded;
  }

  private get eyePosition(): Vector3 {
    return this.body.position.add(new Vector3(0, enemyTypeDefinitions[this.enemyType].losOriginYOffset, 0));
  }
}
