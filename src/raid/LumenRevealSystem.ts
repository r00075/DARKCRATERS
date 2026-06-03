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
  activeMarkerCount: number;
  activeRevealedCount: number;
  lastResult: string;
}>;

type ActiveMarker = {
  id: string;
  meshes: AbstractMesh[];
  timeout: number;
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
    activeMarkerCount: 0,
    activeRevealedCount: 0,
    lastResult: "idle",
  };

  public constructor(private readonly scene: Scene) {
    this.revealMaterial = new StandardMaterial("lumen-reveal-marker-material", scene);
    this.revealMaterial.diffuseColor = themeConfig.colors.cyan;
    this.revealMaterial.emissiveColor = new Color3(0.12, 0.72, 0.95);
    this.revealMaterial.alpha = 0.78;

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

  public activateEssenceFlare(playerPosition: Vector3, enemies: readonly EnemyDebugState[]): LumenRevealResult {
    const now = performance.now();
    if (!this.canActivate(now)) {
      this.debugStateInternal = {
        ...this.debugStateInternal,
        lastItem: "essence-flare",
        lastResult: "cooldown",
      };
      return {
        activated: false,
        targets: [],
        radius: essenceFlareRadius,
        durationSeconds: essenceFlareDurationSeconds,
        disruptionSeconds: essenceFlareDisruptionSeconds,
        reason: "cooldown",
      };
    }

    this.lastActivationMs = now;
    const targets = this.collectTargets(playerPosition, enemies, essenceFlareRadius);
    console.info(
      `[RevealTool] activated item=essence-flare radius=${essenceFlareRadius} duration=${essenceFlareDurationSeconds}`,
    );
    console.info(`[RevealTool] targets count=${targets.length}`);
    if (targets.length === 0) {
      console.info(`[RevealTool] no targets radius=${essenceFlareRadius}`);
    }

    this.createPulseVisual(playerPosition, essenceFlareRadius);
    for (const target of targets) {
      this.revealTarget(target, now);
    }

    this.debugStateInternal = {
      lastItem: "essence-flare",
      lastRadius: essenceFlareRadius,
      lastDurationSeconds: essenceFlareDurationSeconds,
      lastTargetCount: targets.length,
      activeMarkerCount: this.activeMarkers.size,
      activeRevealedCount: this.revealedUntil.size,
      lastResult: targets.length > 0 ? "targets-revealed" : "no-targets",
    };

    return {
      activated: true,
      targets,
      radius: essenceFlareRadius,
      durationSeconds: essenceFlareDurationSeconds,
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
  ): LumenRevealTarget[] {
    const targets = new Map<string, LumenRevealTarget>();

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
      targets.set(enemy.id, {
        id: enemy.id,
        type: enemy.type,
        position,
        distance,
      });
    }

    for (const mesh of this.scene.meshes) {
      const metadata = mesh.metadata as { entityType?: string; gameplayTag?: string; enemyId?: string; enemyType?: string } | null;
      if (!metadata || (metadata.entityType !== "enemy" && metadata.gameplayTag !== "enemy-visual")) {
        continue;
      }
      const id = metadata.enemyId ?? mesh.id ?? mesh.name ?? `mesh-${mesh.uniqueId}`;
      if (targets.has(id)) {
        continue;
      }
      const position = mesh.getAbsolutePosition().clone();
      const distance = Vector3.Distance(position, playerPosition);
      if (distance > radius) {
        continue;
      }
      targets.set(id, {
        id,
        type: metadata.enemyType ?? "lumen-signature",
        position,
        distance,
      });
    }

    return Array.from(targets.values()).sort((a, b) => a.distance - b.distance);
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

  private revealTarget(target: LumenRevealTarget, now: number): void {
    this.clearMarker(target.id, "replace");
    const revealUntil = now + essenceFlareDurationSeconds * 1000;
    this.revealedUntil.set(target.id, revealUntil);
    this.disruptedUntil.set(target.id, now + essenceFlareDisruptionSeconds * 1000);

    const markerRoot = MeshBuilder.CreateBox(`lumen-reveal-marker-${target.id}`, { size: 0.1 }, this.scene);
    markerRoot.isVisible = false;
    markerRoot.isPickable = false;
    markerRoot.position.copyFrom(target.position);

    const halo = MeshBuilder.CreateTorus(
      `lumen-reveal-halo-${target.id}`,
      { diameter: 1.25, thickness: 0.035, tessellation: 48 },
      this.scene,
    );
    halo.parent = markerRoot;
    halo.position.y = 1.85;
    halo.rotation.x = Math.PI * 0.5;
    halo.material = this.revealMaterial;
    halo.isPickable = false;

    const beacon = MeshBuilder.CreateSphere(
      `lumen-reveal-beacon-${target.id}`,
      { diameter: 0.22, segments: 12 },
      this.scene,
    );
    beacon.parent = markerRoot;
    beacon.position.y = 2.15;
    beacon.material = this.revealMaterial;
    beacon.isPickable = false;

    const timeout = window.setTimeout(() => this.clearMarker(target.id, "duration-expired"), essenceFlareDurationSeconds * 1000);
    this.activeMarkers.set(target.id, {
      id: target.id,
      meshes: [markerRoot, halo, beacon],
      timeout,
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
