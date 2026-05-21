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
      cancelReason: null,
    };
    }

    const insideZone = this.isInsideZone(playerPosition);
    const extracting = insideZone && input.interactHeld && !tookDamage;

    if (extracting) {
      this.progressSeconds = Math.min(extractionConfig.duration, this.progressSeconds + dt);
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

    this.completed = this.progressSeconds >= extractionConfig.duration;

    return {
      insideZone,
      extracting,
      progress: this.progressSeconds / extractionConfig.duration,
      secondsRemaining: Math.max(0, extractionConfig.duration - this.progressSeconds),
      completed: this.completed,
      activeZoneIds: this.activeZoneIds,
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

  private isInsideZone(playerPosition: Vector3): boolean {
    for (const zone of this.activeZones) {
      const distance = Math.hypot(playerPosition.x - zone.center.x, playerPosition.z - zone.center.z);

      if (distance <= zone.radius) {
        return true;
      }
    }

    return false;
  }

  private chooseActiveZones(): ExtractionZoneDefinition[] {
    if (Math.random() > 0.65) {
      return [...permanentExtractionZoneDefinitions];
    }

    const index = Math.floor(Math.random() * permanentExtractionZoneDefinitions.length);
    return [permanentExtractionZoneDefinitions[index]];
  }
}
