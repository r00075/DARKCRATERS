import { Vector3 } from "@babylonjs/core";
import type { InputSnapshot } from "../input/InputController";
import {
  extractionZoneDefinitions,
  permanentExtractionZoneDefinitions,
  type ExtractionZoneDefinition,
} from "../world/MapLayout";

export type ExtractionState = Readonly<{
  insideZone: boolean;
  extracting: boolean;
  progress: number;
  secondsRemaining: number;
  completed: boolean;
  activeZoneIds: string[];
  currentZoneId: string | null;
  currentZoneName: string | null;
  currentZonePrompt: string | null;
  cancelReason: "moved-away" | "took-damage" | "released" | null;
}>;

const extractionConfig = {
  duration: 5,
};

export class ExtractionController {
  private progressSeconds = 0;
  private completed = false;
  private activeZones: ExtractionZoneDefinition[] = [permanentExtractionZoneDefinitions[0]];
  private cancelReason: ExtractionState["cancelReason"] = null;

  public get state(): ExtractionState {
    return {
      insideZone: false,
      extracting: false,
      progress: 0,
      secondsRemaining: extractionConfig.duration,
      completed: this.completed,
      activeZoneIds: this.activeZoneIds,
      currentZoneId: null,
      currentZoneName: null,
      currentZonePrompt: null,
      cancelReason: this.cancelReason,
    };
  }

  public get activeZoneIds(): string[] {
    return this.activeZones.map((zone) => zone.id);
  }

  public update(
    dt: number,
    input: InputSnapshot,
    playerPosition: Vector3,
    tookDamage: boolean,
    enabled = true,
  ): ExtractionState {
    if (!enabled) {
      this.progressSeconds = 0;
      return this.state;
    }

    if (this.completed) {
      return {
        insideZone: true,
      extracting: false,
      progress: 1,
      secondsRemaining: 0,
      completed: true,
      activeZoneIds: this.activeZoneIds,
      currentZoneId: null,
      currentZoneName: null,
      currentZonePrompt: null,
      cancelReason: null,
    };
  }

    const activeZone = this.getInsideZone(playerPosition);
    const insideZone = activeZone !== null;
    const extracting = insideZone && input.interactHeld && !tookDamage;

    const duration = activeZone?.durationSeconds ?? extractionConfig.duration;
    if (extracting) {
      this.progressSeconds = Math.min(duration, this.progressSeconds + dt);
      this.cancelReason = null;
    } else {
      if (this.progressSeconds > 0) {
        this.cancelReason = !insideZone
          ? "moved-away"
          : tookDamage
            ? "took-damage"
            : "released";
      } else if (!insideZone) {
        this.cancelReason = null;
      }
      this.progressSeconds = 0;
    }

    this.completed = this.progressSeconds >= duration;

    return {
      insideZone,
      extracting,
      progress: this.progressSeconds / duration,
      secondsRemaining: Math.max(0, duration - this.progressSeconds),
      completed: this.completed,
      activeZoneIds: this.activeZoneIds,
      currentZoneId: activeZone?.id ?? null,
      currentZoneName: activeZone?.name ?? null,
      currentZonePrompt: activeZone?.id === "personal-ship-return"
        ? "Hold E to Initiate Return"
        : null,
      cancelReason: this.cancelReason,
    };
  }

  public reset(): void {
    this.progressSeconds = 0;
    this.completed = false;
    this.cancelReason = null;
    this.activeZones = this.chooseActiveZones();
  }

  public setActiveZoneIds(ids: readonly string[]): void {
    const zones = ids
      .map((id) => extractionZoneDefinitions.find((zone) => zone.id === id))
      .filter((zone): zone is ExtractionZoneDefinition => zone !== undefined);

    this.activeZones = zones.length > 0 ? zones : [];
  }

  public setActiveZones(zones: readonly ExtractionZoneDefinition[]): void {
    this.activeZones = zones.map((zone) => ({ ...zone, center: zone.center.clone() }));
  }

  private getInsideZone(playerPosition: Vector3): ExtractionZoneDefinition | null {
    for (const zone of this.activeZones) {
      const distance = Math.hypot(playerPosition.x - zone.center.x, playerPosition.z - zone.center.z);

      if (distance <= zone.radius) {
        return zone;
      }
    }

    return null;
  }

  private chooseActiveZones(): ExtractionZoneDefinition[] {
    if (Math.random() > 0.65) {
      return [...permanentExtractionZoneDefinitions];
    }

    const index = Math.floor(Math.random() * permanentExtractionZoneDefinitions.length);
    return [permanentExtractionZoneDefinitions[index]];
  }
}
