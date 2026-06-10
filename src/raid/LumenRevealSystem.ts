import {
  AbstractMesh,
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { EnemyDebugState } from "../ai/EnemyAgent";
import { themeConfig } from "../theme/ThemeConfig";

export type LumenRevealTarget = Readonly<{
  id: string;
  type: string;
  position: Vector3;
  distance: number;
}>;

export type RevealedTargetState = Readonly<LumenRevealTarget & {
  remainingSeconds: number;
}>;

export type LumenRevealResult = Readonly<{
  activated: boolean;
  targets: readonly LumenRevealTarget[];
  radius: number;
  durationSeconds: number;
  disruptionSeconds: number;
  reason: "activated" | "cooldown";
}>;

export type RevealedSignal = Readonly<{
  id: string;
  label: string;
  type: "lumen-signature" | "enemy" | "unknown";
  position: Vector3;
  distance: number;
  revealedAt: number;
  expiresAt: number;
  source: "essence-flare";
}>;

export type LumenRevealSignalState = Readonly<{
  active: boolean;
  source: "essence-flare" | null;
  count: number;
  signals: readonly RevealedSignal[];
  nearest: RevealedSignal | null;
  remainingSeconds: number;
  surveyorAffinity: boolean;
  lastResult: string;
}>;

export type LumenRevealDebugState = Readonly<{
  lastItem: string | null;
  lastRadius: number;
  lastDurationSeconds: number;
  lastTargetCount: number;
  lastRawTargetCount: number;
  lastGroupedTargetCount: number;
  lastClassId: string;
  activeMarkerCount: number;
  activeRevealedCount: number;
  lastDeadTargetSkips: number;
  lastDeadSignalCleanups: number;
  lastResult: string;
}>;

type ActiveMarker = {
  id: string;
  meshes: AbstractMesh[];
  timeout: number;
  observer: ReturnType<Scene["onBeforeRenderObservable"]["add"]> | null;
};

type MutableRevealTargetGroup = {
  id: string;
  type: string;
  positions: Vector3[];
  distance: number;
};

type RevealMeshMetadata = {
  entityType?: string;
  gameplayTag?: string;
  enemyId?: string;
  enemyType?: string;
  state?: string;
  health?: number;
  healthRemaining?: number;
  isDead?: boolean;
  dead?: boolean;
  defeated?: boolean;
};

const essenceFlareRadius = 30;
const essenceFlareDurationSeconds = 10;
const essenceFlareDisruptionSeconds = 3;
const activationGuardMs = 750;
const pulseLifetimeSeconds = 0.9;

export class LumenRevealSystem {
  private readonly revealMaterial: StandardMaterial;
  private readonly pulseMaterial: StandardMaterial;
  private readonly activeMarkers = new Map<string, ActiveMarker>();
  private readonly revealedUntil = new Map<string, number>();
  private readonly revealedSignals = new Map<string, RevealedSignal>();
  private readonly disruptedUntil = new Map<string, number>();
  private lastActivationMs = -Number.POSITIVE_INFINITY;
  private signalWindowExpiresAt = 0;
  private signalWindowSurveyorAffinity = false;
  private signalWindowSource: "essence-flare" | null = null;
  private debugStateInternal: LumenRevealDebugState = {
    lastItem: null,
    lastRadius: 0,
    lastDurationSeconds: 0,
    lastTargetCount: 0,
    lastRawTargetCount: 0,
    lastGroupedTargetCount: 0,
    lastClassId: "none",
    activeMarkerCount: 0,
    activeRevealedCount: 0,
    lastDeadTargetSkips: 0,
    lastDeadSignalCleanups: 0,
    lastResult: "idle",
  };

  public constructor(private readonly scene: Scene) {
    this.revealMaterial = new StandardMaterial("lumen-reveal-marker-material", scene);
    this.revealMaterial.diffuseColor = themeConfig.colors.cyan;
    this.revealMaterial.emissiveColor = new Color3(0.12, 0.72, 0.95);
    this.revealMaterial.alpha = 0.82;

    this.pulseMaterial = new StandardMaterial("lumen-reveal-pulse-material", scene);
    this.pulseMaterial.diffuseColor = themeConfig.colors.purple;
    this.pulseMaterial.emissiveColor = new Color3(0.18, 0.62, 0.95);
    this.pulseMaterial.alpha = 0.34;
    this.pulseMaterial.backFaceCulling = false;
  }

  public get debugState(): LumenRevealDebugState {
    const now = performance.now();
    return {
      ...this.debugStateInternal,
      activeMarkerCount: this.activeMarkers.size,
      activeRevealedCount: Array.from(this.revealedUntil.values()).filter((until) => until > now).length,
    };
  }

  public canActivate(now = performance.now()): boolean {
    return now - this.lastActivationMs >= activationGuardMs;
  }

  public isTargetRevealed(id: string, now = performance.now()): boolean {
    return (this.revealedUntil.get(id) ?? 0) > now;
  }

  public getRevealedTargets(now = performance.now()): readonly RevealedTargetState[] {
    this.pruneExpiredSignals(now);
    const revealed: RevealedTargetState[] = [];
    for (const marker of this.activeMarkers.values()) {
      const until = this.revealedUntil.get(marker.id) ?? 0;
      if (until <= now || marker.meshes.length === 0) {
        continue;
      }
      const root = marker.meshes[0];
      revealed.push({
        id: marker.id,
        type: "lumen-signature",
        position: root.position.clone(),
        distance: 0,
        remainingSeconds: Math.max(0, (until - now) / 1000),
      });
    }
    return revealed;
  }

  public getRevealedSignals(enemies: readonly EnemyDebugState[] = [], now = performance.now()): readonly RevealedSignal[] {
    this.pruneExpiredSignals(now, enemies);
    return Array.from(this.revealedSignals.values())
      .filter((signal) => signal.expiresAt > now)
      .sort((a, b) => a.distance - b.distance)
      .map((signal) => ({
        ...signal,
        position: signal.position.clone(),
      }));
  }

  public getSignalState(enemies: readonly EnemyDebugState[] = [], now = performance.now()): LumenRevealSignalState {
    const signals = this.getRevealedSignals(enemies, now);
    const remainingSeconds = Math.max(0, (this.signalWindowExpiresAt - now) / 1000);
    const active = remainingSeconds > 0 || signals.length > 0;
    return {
      active,
      source: active ? this.signalWindowSource : null,
      count: signals.length,
      signals,
      nearest: signals[0] ?? null,
      remainingSeconds,
      surveyorAffinity: active && this.signalWindowSurveyorAffinity,
      lastResult: active ? this.debugStateInternal.lastResult : "idle",
    };
  }

  public activateEssenceFlare(
    playerPosition: Vector3,
    enemies: readonly EnemyDebugState[],
    options: { classId?: string; radius?: number; durationSeconds?: number; surveyorAffinity?: boolean } = {},
  ): LumenRevealResult {
    const now = performance.now();
    const radius = options.radius ?? essenceFlareRadius;
    const durationSeconds = options.durationSeconds ?? essenceFlareDurationSeconds;
    const classId = options.classId ?? "none";
    if (!this.canActivate(now)) {
      this.debugStateInternal = {
        ...this.debugStateInternal,
        lastItem: "essence-flare",
        lastRadius: radius,
        lastDurationSeconds: durationSeconds,
        lastClassId: classId,
        lastDeadTargetSkips: this.debugStateInternal.lastDeadTargetSkips,
        lastDeadSignalCleanups: this.debugStateInternal.lastDeadSignalCleanups,
        lastResult: "cooldown",
      };
      return {
        activated: false,
        targets: [],
        radius,
        durationSeconds,
        disruptionSeconds: essenceFlareDisruptionSeconds,
        reason: "cooldown",
      };
    }

    this.lastActivationMs = now;
    const { targets, rawCount, groupedCount, deadSkipped, deadSampleIds } = this.collectTargets(playerPosition, enemies, radius);
    const surveyorAffinity = options.surveyorAffinity ?? classId === "surveyor";
    this.clearAllMarkers("replace");
    this.signalWindowExpiresAt = now + durationSeconds * 1000;
    this.signalWindowSurveyorAffinity = surveyorAffinity;
    this.signalWindowSource = "essence-flare";
    console.info(
      `[RevealTool] activated item=essence-flare class=${classId} radius=${radius} duration=${durationSeconds}`,
    );
    console.info(`[RevealTool] targets count=${targets.length} raw=${rawCount} grouped=${groupedCount} deadSkipped=${deadSkipped}`);
    if (deadSkipped > 0) {
      console.info(`[RevealSignal] skipped-dead-targets count=${deadSkipped} sample=${deadSampleIds.join(",") || "none"} source=essence-flare`);
    }
    if (targets.length === 0) {
      console.info(`[RevealTool] no targets radius=${radius}`);
    }

    this.createPulseVisual(playerPosition, radius);
    for (const target of targets) {
      this.revealTarget(target, now, durationSeconds);
    }
    console.info(`[RevealSignal] updated count=${targets.length} source=essence-flare`);

    this.debugStateInternal = {
      lastItem: "essence-flare",
      lastRadius: radius,
      lastDurationSeconds: durationSeconds,
      lastTargetCount: targets.length,
      lastRawTargetCount: rawCount,
      lastGroupedTargetCount: groupedCount,
      lastClassId: classId,
      activeMarkerCount: this.activeMarkers.size,
      activeRevealedCount: this.revealedUntil.size,
      lastDeadTargetSkips: deadSkipped,
      lastDeadSignalCleanups: 0,
      lastResult: targets.length > 0 ? "targets-revealed" : "no-targets",
    };

    return {
      activated: true,
      targets,
      radius,
      durationSeconds,
      disruptionSeconds: essenceFlareDisruptionSeconds,
      reason: "activated",
    };
  }

  public reset(): void {
    for (const marker of this.activeMarkers.values()) {
      window.clearTimeout(marker.timeout);
      this.disposeMarker(marker);
    }
    this.activeMarkers.clear();
    this.revealedUntil.clear();
    this.revealedSignals.clear();
    this.disruptedUntil.clear();
    this.signalWindowExpiresAt = 0;
    this.signalWindowSurveyorAffinity = false;
    this.signalWindowSource = null;
    this.debugStateInternal = {
      lastItem: null,
      lastRadius: 0,
      lastDurationSeconds: 0,
      lastTargetCount: 0,
      lastRawTargetCount: 0,
      lastGroupedTargetCount: 0,
      lastClassId: "none",
      activeMarkerCount: 0,
      activeRevealedCount: 0,
      lastDeadTargetSkips: 0,
      lastDeadSignalCleanups: 0,
      lastResult: "reset",
    };
  }

  public dispose(): void {
    this.reset();
    this.revealMaterial.dispose();
    this.pulseMaterial.dispose();
  }

  private collectTargets(
    playerPosition: Vector3,
    enemies: readonly EnemyDebugState[],
    radius: number,
  ): { targets: LumenRevealTarget[]; rawCount: number; groupedCount: number; deadSkipped: number; deadSampleIds: string[] } {
    const groups = new Map<string, MutableRevealTargetGroup>();
    const debugAliveIds = new Set<string>();
    const debugDeadIds = new Set<string>();
    const deadSampleIds: string[] = [];
    let rawCount = 0;
    let deadSkipped = 0;
    const noteDeadTarget = (id: string): void => {
      deadSkipped += 1;
      if (deadSampleIds.length < 4 && !deadSampleIds.includes(id)) {
        deadSampleIds.push(id);
      }
    };

    for (const enemy of enemies) {
      if (!this.isRevealTargetAliveFromDebug(enemy)) {
        if (enemy) {
          debugDeadIds.add(enemy.id);
          noteDeadTarget(enemy.id);
        }
        continue;
      }
      debugAliveIds.add(enemy.id);
      const position = enemy.position?.clone?.();
      if (!position) {
        continue;
      }
      const distance = Vector3.Distance(position, playerPosition);
      if (distance > radius) {
        continue;
      }
      rawCount += 1;
      this.addRevealTargetGroup(groups, enemy.id, enemy.type, position, distance);
    }

    for (const mesh of this.scene.meshes) {
      const metadata = mesh.metadata as RevealMeshMetadata | null;
      if (!metadata || (metadata.entityType !== "enemy" && metadata.gameplayTag !== "enemy-visual")) {
        continue;
      }
      const id = this.getMeshRevealGroupId(mesh, metadata);
      if (debugDeadIds.has(id)) {
        noteDeadTarget(id);
        continue;
      }
      if (debugAliveIds.has(id) && groups.has(id)) {
        continue;
      }
      if (!this.isRevealTargetAliveFromMesh(mesh, metadata)) {
        noteDeadTarget(id);
        continue;
      }
      const position = mesh.getAbsolutePosition().clone();
      const distance = Vector3.Distance(position, playerPosition);
      if (distance > radius) {
        continue;
      }
      rawCount += 1;
      this.addRevealTargetGroup(groups, id, metadata.enemyType ?? "lumen-signature", position, distance);
    }

    const targets = Array.from(groups.values())
      .map((group) => ({
        id: group.id,
        type: group.type,
        position: this.averagePositions(group.positions),
        distance: group.distance,
      }))
      .sort((a, b) => a.distance - b.distance);

    return {
      targets,
      rawCount,
      groupedCount: targets.length,
      deadSkipped,
      deadSampleIds,
    };
  }

  private addRevealTargetGroup(
    groups: Map<string, MutableRevealTargetGroup>,
    id: string,
    type: string,
    position: Vector3,
    distance: number,
  ): void {
    const existing = groups.get(id);
    if (existing) {
      existing.positions.push(position);
      existing.distance = Math.min(existing.distance, distance);
      if (existing.type === "lumen-signature" && type !== "lumen-signature") {
        existing.type = type;
      }
      return;
    }

    groups.set(id, {
      id,
      type,
      positions: [position],
      distance,
    });
  }

  private getMeshRevealGroupId(
    mesh: AbstractMesh,
    metadata: { enemyId?: string; enemyType?: string },
  ): string {
    if (metadata.enemyId) {
      return metadata.enemyId;
    }

    const parent = mesh.parent;
    const parentMetadata = parent?.metadata as { enemyId?: string } | null;
    if (parentMetadata?.enemyId) {
      return parentMetadata.enemyId;
    }

    const rawName = parent?.name || parent?.id || mesh.name || mesh.id || `mesh-${mesh.uniqueId}`;
    const stripped = rawName
      .replace(/(?:^|[-_])(head|body|torso|visual|mesh|hitbox|collider|capsule)(?:[-_]?\d+)?$/i, "")
      .replace(/[-_]?(head|body|torso|visual|mesh|hitbox|collider|capsule)[-_]?\d*$/i, "")
      .replace(/\.\d+$/i, "");
    return stripped && stripped !== rawName ? stripped : rawName;
  }

  private averagePositions(positions: readonly Vector3[]): Vector3 {
    if (positions.length === 0) {
      return Vector3.Zero();
    }
    const average = Vector3.Zero();
    for (const position of positions) {
      average.addInPlace(position);
    }
    average.scaleInPlace(1 / positions.length);
    return average;
  }

  private createPulseVisual(origin: Vector3, radius: number): void {
    try {
      const ring = MeshBuilder.CreateTorus(
        "lumen-reveal-pulse-ring",
        { diameter: 1.2, thickness: 0.035, tessellation: 96 },
        this.scene,
      );
      const echo = MeshBuilder.CreateTorus(
        "lumen-reveal-pulse-echo",
        { diameter: 1.2, thickness: 0.018, tessellation: 96 },
        this.scene,
      );
      ring.position.copyFrom(origin);
      ring.position.y += 0.08;
      ring.rotation.x = Math.PI * 0.5;
      ring.material = this.pulseMaterial;
      ring.isPickable = false;
      echo.position.copyFrom(origin);
      echo.position.y += 0.1;
      echo.rotation.x = Math.PI * 0.5;
      echo.material = this.pulseMaterial;
      echo.isPickable = false;
      const startedAt = performance.now();
      const observer = this.scene.onBeforeRenderObservable.add(() => {
        const elapsed = (performance.now() - startedAt) / 1000;
        const t = Math.min(1, elapsed / pulseLifetimeSeconds);
        const scale = Math.max(0.1, radius * t);
        ring.scaling.set(scale, scale, scale);
        const echoScale = Math.max(0.1, radius * Math.min(1, t * 0.72));
        echo.scaling.set(echoScale, echoScale, echoScale);
        this.pulseMaterial.alpha = 0.42 * (1 - t);
        if (t >= 1) {
          this.scene.onBeforeRenderObservable.remove(observer);
          ring.dispose(false, false);
          echo.dispose(false, false);
          this.pulseMaterial.alpha = 0.42;
        }
      });
    } catch (error) {
      console.warn("[RevealTool] pulse visual failed", error);
    }
  }

  private revealTarget(target: LumenRevealTarget, now: number, durationSeconds: number): void {
    this.clearMarker(target.id, "replace");
    const revealUntil = now + durationSeconds * 1000;
    const signalType = this.toSignalType(target.type);
    this.revealedUntil.set(target.id, revealUntil);
    this.revealedSignals.set(target.id, {
      id: target.id,
      label: this.formatSignalLabel(target.type),
      type: signalType,
      position: target.position.clone(),
      distance: target.distance,
      revealedAt: now,
      expiresAt: revealUntil,
      source: "essence-flare",
    });
    this.disruptedUntil.set(target.id, now + essenceFlareDisruptionSeconds * 1000);

    const markerRoot = MeshBuilder.CreateBox(`lumen-reveal-marker-${target.id}`, { size: 0.1 }, this.scene);
    markerRoot.isVisible = false;
    markerRoot.isPickable = false;
    markerRoot.position.copyFrom(target.position);

    const halo = MeshBuilder.CreateTorus(
      `lumen-reveal-halo-${target.id}`,
      { diameter: 1.45, thickness: 0.035, tessellation: 64 },
      this.scene,
    );
    halo.parent = markerRoot;
    halo.position.y = 1.85;
    halo.rotation.x = Math.PI * 0.5;
    halo.material = this.revealMaterial;
    halo.isPickable = false;

    const beacon = MeshBuilder.CreateSphere(
      `lumen-reveal-beacon-${target.id}`,
      { diameter: 0.26, segments: 16 },
      this.scene,
    );
    beacon.parent = markerRoot;
    beacon.position.y = 2.15;
    beacon.material = this.revealMaterial;
    beacon.isPickable = false;

    const column = MeshBuilder.CreateCylinder(
      `lumen-reveal-column-${target.id}`,
      { height: 2.2, diameterTop: 0.035, diameterBottom: 0.08, tessellation: 12 },
      this.scene,
    );
    column.parent = markerRoot;
    column.position.y = 1.1;
    column.material = this.revealMaterial;
    column.isPickable = false;

    const startedAt = performance.now();
    const observer = this.scene.onBeforeRenderObservable.add(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const pulse = 1 + Math.sin(elapsed * Math.PI * 2.2) * 0.08;
      halo.scaling.set(pulse, pulse, pulse);
      beacon.scaling.set(1.08 - (pulse - 1), 1.08 - (pulse - 1), 1.08 - (pulse - 1));
      column.rotation.y += 0.012;
    });

    const timeout = window.setTimeout(() => this.clearMarker(target.id, "duration-expired"), durationSeconds * 1000);
    this.activeMarkers.set(target.id, {
      id: target.id,
      meshes: [markerRoot, halo, beacon, column],
      timeout,
      observer,
    });
    console.info(
      `[RevealTool] target revealed id=${target.id} type=${target.type} distance=${target.distance.toFixed(1)}`,
    );
  }

  private clearMarker(id: string, reason: "replace" | "duration-expired" | "reset" | "target-dead"): void {
    const marker = this.activeMarkers.get(id);
    if (!marker) {
      return;
    }
    window.clearTimeout(marker.timeout);
    if (marker.observer) {
      this.scene.onBeforeRenderObservable.remove(marker.observer);
    }
    this.disposeMarker(marker);
    this.activeMarkers.delete(id);
    this.revealedUntil.delete(id);
    this.revealedSignals.delete(id);
    this.disruptedUntil.delete(id);
    console.info(`[RevealTool] cleanup target=${id} reason=${reason}`);
    if (reason === "duration-expired") {
      console.info(`[RevealSignal] expired id=${id}`);
    } else if (reason === "target-dead") {
      console.info(`[RevealSignal] cleanup id=${id} reason=target-dead`);
    }
  }

  private clearAllMarkers(reason: "replace" | "reset"): void {
    for (const id of Array.from(this.activeMarkers.keys())) {
      this.clearMarker(id, reason);
    }
    this.revealedUntil.clear();
    this.revealedSignals.clear();
    this.disruptedUntil.clear();
  }

  private pruneExpiredSignals(now: number, enemies: readonly EnemyDebugState[] = []): void {
    let deadSignalCleanups = 0;
    for (const [id, signal] of Array.from(this.revealedSignals.entries())) {
      if (signal.expiresAt <= now) {
        this.clearMarker(id, "duration-expired");
        continue;
      }
      if (this.isKnownTargetDead(id, enemies)) {
        this.clearMarker(id, "target-dead");
        deadSignalCleanups += 1;
      }
    }
    if (deadSignalCleanups > 0) {
      this.debugStateInternal = {
        ...this.debugStateInternal,
        lastDeadSignalCleanups: this.debugStateInternal.lastDeadSignalCleanups + deadSignalCleanups,
      };
    }
    if (this.signalWindowExpiresAt <= now && this.revealedSignals.size === 0) {
      this.signalWindowSource = null;
      this.signalWindowSurveyorAffinity = false;
    }
  }

  private isRevealTargetAliveFromDebug(enemy: EnemyDebugState | null | undefined): boolean {
    return !!enemy && enemy.health > 0 && enemy.state !== "dead";
  }

  private isRevealTargetAliveFromMesh(mesh: AbstractMesh, metadata: RevealMeshMetadata): boolean {
    if (typeof mesh.isDisposed === "function" && mesh.isDisposed()) {
      return false;
    }
    if (!mesh.isEnabled() || !mesh.isVisible) {
      return false;
    }

    const metadataState = this.readDeathState(metadata);
    if (metadataState !== "unknown") {
      return metadataState === "alive";
    }

    const parentMetadata = mesh.parent?.metadata as RevealMeshMetadata | null;
    const parentState = parentMetadata ? this.readDeathState(parentMetadata) : "unknown";
    return parentState === "unknown" ? true : parentState === "alive";
  }

  private readDeathState(metadata: RevealMeshMetadata): "alive" | "dead" | "unknown" {
    if (metadata.isDead === true || metadata.dead === true || metadata.defeated === true) {
      return "dead";
    }
    if (typeof metadata.health === "number") {
      return metadata.health > 0 ? "alive" : "dead";
    }
    if (typeof metadata.healthRemaining === "number") {
      return metadata.healthRemaining > 0 ? "alive" : "dead";
    }
    const state = typeof metadata.state === "string" ? metadata.state.toLowerCase() : "";
    if (state === "dead" || state === "killed" || state === "despawned") {
      return "dead";
    }
    if (state.length > 0) {
      return "alive";
    }
    return "unknown";
  }

  private isKnownTargetDead(id: string, enemies: readonly EnemyDebugState[]): boolean {
    const debug = enemies.find((enemy) => enemy.id === id);
    if (debug) {
      return !this.isRevealTargetAliveFromDebug(debug);
    }

    let sawDeadEvidence = false;
    for (const mesh of this.scene.meshes) {
      const metadata = mesh.metadata as RevealMeshMetadata | null;
      const parentMetadata = mesh.parent?.metadata as RevealMeshMetadata | null;
      if (!this.meshMatchesSignalId(mesh, metadata, parentMetadata, id)) {
        continue;
      }
      const alive = metadata ? this.isRevealTargetAliveFromMesh(mesh, metadata) : true;
      if (alive) {
        return false;
      }
      sawDeadEvidence = true;
    }
    return sawDeadEvidence;
  }

  private meshMatchesSignalId(
    mesh: AbstractMesh,
    metadata: RevealMeshMetadata | null,
    parentMetadata: RevealMeshMetadata | null,
    id: string,
  ): boolean {
    if (metadata?.enemyId === id || parentMetadata?.enemyId === id) {
      return true;
    }
    if (!metadata || (metadata.entityType !== "enemy" && metadata.gameplayTag !== "enemy-visual")) {
      return false;
    }
    return this.getMeshRevealGroupId(mesh, metadata) === id;
  }

  private toSignalType(type: string): RevealedSignal["type"] {
    if (!type) {
      return "unknown";
    }
    return type === "lumen-signature" || type.includes("lumen") || type.includes("alien") || type.includes("enemy")
      ? "lumen-signature"
      : "enemy";
  }

  private formatSignalLabel(type: string): string {
    const normalized = type
      .replace(/^net-/, "")
      .replace(/[-_]+/g, " ")
      .trim();
    return normalized.length > 0 ? normalized : "Lumen signature";
  }

  private disposeMarker(marker: ActiveMarker): void {
    for (const mesh of marker.meshes) {
      if (!mesh.isDisposed()) {
        mesh.dispose(false, false);
      }
    }
  }
}
