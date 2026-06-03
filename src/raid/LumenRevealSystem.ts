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
  private readonly disruptedUntil = new Map<string, number>();
  private lastActivationMs = -Number.POSITIVE_INFINITY;
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

  public activateEssenceFlare(
    playerPosition: Vector3,
    enemies: readonly EnemyDebugState[],
    options: { classId?: string; radius?: number; durationSeconds?: number } = {},
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
    const { targets, rawCount, groupedCount } = this.collectTargets(playerPosition, enemies, radius);
    console.info(
      `[RevealTool] activated item=essence-flare class=${classId} radius=${radius} duration=${durationSeconds}`,
    );
    console.info(`[RevealTool] targets count=${targets.length} raw=${rawCount} grouped=${groupedCount}`);
    if (targets.length === 0) {
      console.info(`[RevealTool] no targets radius=${radius}`);
    }

    this.createPulseVisual(playerPosition, radius);
    for (const target of targets) {
      this.revealTarget(target, now, durationSeconds);
    }

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
    this.disruptedUntil.clear();
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
  ): { targets: LumenRevealTarget[]; rawCount: number; groupedCount: number } {
    const groups = new Map<string, MutableRevealTargetGroup>();
    let rawCount = 0;

    for (const enemy of enemies) {
      if (!enemy || enemy.health <= 0 || enemy.state === "dead") {
        continue;
      }
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
      const metadata = mesh.metadata as { entityType?: string; gameplayTag?: string; enemyId?: string; enemyType?: string } | null;
      if (!metadata || (metadata.entityType !== "enemy" && metadata.gameplayTag !== "enemy-visual")) {
        continue;
      }
      const id = this.getMeshRevealGroupId(mesh, metadata);
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
      ring.position.copyFrom(origin);
      ring.position.y += 0.08;
      ring.rotation.x = Math.PI * 0.5;
      ring.material = this.pulseMaterial;
      ring.isPickable = false;
      const startedAt = performance.now();
      const observer = this.scene.onBeforeRenderObservable.add(() => {
        const elapsed = (performance.now() - startedAt) / 1000;
        const t = Math.min(1, elapsed / pulseLifetimeSeconds);
        const scale = Math.max(0.1, radius * t);
        ring.scaling.set(scale, scale, scale);
        this.pulseMaterial.alpha = 0.34 * (1 - t);
        if (t >= 1) {
          this.scene.onBeforeRenderObservable.remove(observer);
          ring.dispose(false, false);
          this.pulseMaterial.alpha = 0.34;
          console.info("[RevealTool] pulse visual disposed");
        }
      });
    } catch (error) {
      console.warn("[RevealTool] pulse visual failed", error);
    }
  }

  private revealTarget(target: LumenRevealTarget, now: number, durationSeconds: number): void {
    this.clearMarker(target.id, "replace");
    const revealUntil = now + durationSeconds * 1000;
    this.revealedUntil.set(target.id, revealUntil);
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

  private clearMarker(id: string, reason: "replace" | "duration-expired" | "reset"): void {
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
    this.disruptedUntil.delete(id);
    console.info(`[RevealTool] cleanup target=${id} reason=${reason}`);
  }

  private disposeMarker(marker: ActiveMarker): void {
    for (const mesh of marker.meshes) {
      if (!mesh.isDisposed()) {
        mesh.dispose(false, false);
      }
    }
  }
}
