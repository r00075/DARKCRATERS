import { Ray, Scene, Vector3 } from "@babylonjs/core";
import type { InputSnapshot } from "../input/InputController";
import type { MotorState } from "../world/PlayerMotor";

export type PeekDirection = -1 | 0 | 1;

export type CoverState = Readonly<{
  available: boolean;
  inCover: boolean;
  lowCover: boolean;
  peek: PeekDirection;
  prompt: string;
}>;

type CoverHit = Readonly<{
  normal: Vector3;
  lowCover: boolean;
}>;

const coverConfig = {
  detectionRadius: 1.55,
  detectionHeight: 1.05,
  minCoverHeight: 0.75,
  lowCoverHeight: 1.55,
  maxCoverHeight: 4.25,
  directionSamples: 16,
  exitAwayThreshold: 0.45,
};

const emptyCoverState: CoverState = {
  available: false,
  inCover: false,
  lowCover: false,
  peek: 0,
  prompt: "",
};

export class CoverController {
  private coverNormal: Vector3 | null = null;
  private coverLow = false;
  private currentlyInCover = false;
  private interactionConsumed = false;
  private currentState: CoverState = emptyCoverState;

  public constructor(private readonly scene: Scene) {}

  public get state(): CoverState {
    return this.currentState;
  }

  public reset(): void {
    this.coverNormal = null;
    this.coverLow = false;
    this.currentlyInCover = false;
    this.interactionConsumed = false;
    this.currentState = emptyCoverState;
  }

  public update(input: InputSnapshot, motor: MotorState): CoverState {
    this.interactionConsumed = false;
    const hit = this.findCover(motor.position);

    if (this.currentlyInCover) {
      if (input.sprintHeld || input.jumpPressed || input.moveZ > coverConfig.exitAwayThreshold || !hit) {
        this.currentlyInCover = false;
        this.coverNormal = null;
        this.coverLow = false;
      } else {
        this.coverNormal = hit.normal;
        this.coverLow = hit.lowCover;
      }
    } else if (hit && (input.coverPressed || input.interactPressed)) {
      this.currentlyInCover = true;
      this.coverNormal = hit.normal;
      this.coverLow = hit.lowCover;
      this.interactionConsumed = true;
    }

    const peek = this.currentlyInCover
      ? input.peekLeftHeld
        ? -1
        : input.peekRightHeld
          ? 1
          : 0
      : 0;

    this.currentState = {
      available: Boolean(hit) && !this.currentlyInCover,
      inCover: this.currentlyInCover,
      lowCover: this.currentlyInCover && this.coverLow,
      peek,
      prompt: this.currentlyInCover
        ? `${this.coverLow ? "Low cover" : "Cover"} | A/D slide | Q/E peek | W/Shift/Space exit`
        : hit
          ? "Cover available | F or B"
          : "",
    };

    return this.currentState;
  }

  public getAdjustedInput(input: InputSnapshot): InputSnapshot {
    if (!this.currentlyInCover) {
      return this.interactionConsumed
        ? { ...input, interactPressed: false, interactHeld: false, coverPressed: false }
        : input;
    }

    return {
      ...input,
      moveZ: 0,
      sprintHeld: false,
      crouchHeld: input.crouchHeld || this.coverLow,
      interactPressed: false,
      interactHeld: false,
      coverPressed: false,
    };
  }

  public getMovementYaw(defaultYaw: number): number {
    if (!this.currentlyInCover || !this.coverNormal) {
      return defaultYaw;
    }

    return Math.atan2(this.coverNormal.x, this.coverNormal.z);
  }

  private findCover(position: Vector3): CoverHit | null {
    const origin = position.add(new Vector3(0, coverConfig.detectionHeight, 0));
    let bestHit: CoverHit | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < coverConfig.directionSamples; i += 1) {
      const angle = (i / coverConfig.directionSamples) * Math.PI * 2;
      const direction = new Vector3(Math.sin(angle), 0, Math.cos(angle));
      const ray = new Ray(origin, direction, coverConfig.detectionRadius);
      const pick = this.scene.pickWithRay(ray, (mesh) => this.isCoverMesh(mesh));

      if (!pick?.hit || !pick.pickedMesh || pick.distance >= bestDistance) {
        continue;
      }

      const bounds = pick.pickedMesh.getBoundingInfo().boundingBox;
      const height = bounds.maximumWorld.y - bounds.minimumWorld.y;
      const top = bounds.maximumWorld.y;
      const bottom = bounds.minimumWorld.y;

      if (
        height < coverConfig.minCoverHeight ||
        height > coverConfig.maxCoverHeight ||
        top < coverConfig.minCoverHeight ||
        bottom > position.y + 1.35
      ) {
        continue;
      }

      bestDistance = pick.distance;
      bestHit = {
        normal: direction.scale(-1).normalize(),
        lowCover: height <= coverConfig.lowCoverHeight,
      };
    }

    return bestHit;
  }

  private isCoverMesh(mesh: unknown): boolean {
    const candidate = mesh as { checkCollisions?: boolean; metadata?: { gameplayTag?: string } };
    const tag = candidate.metadata?.gameplayTag;
    return candidate.checkCollisions === true &&
      (tag === "cover" || tag === "poi-wall" || tag === "arena-boundary");
  }
}
