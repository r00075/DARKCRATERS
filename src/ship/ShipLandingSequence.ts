import type { InputSnapshot } from "../input/InputController";
import type { LandingQuality } from "./ShipManager";

export type ShipLandingPhase =
  | "inactive"
  | "approach"
  | "final-descent"
  | "stabilization-window"
  | "touchdown"
  | "deploying"
  | "complete";

export type ShipLandingSequenceState = Readonly<{
  active: boolean;
  phase: ShipLandingPhase;
  phaseElapsed: number;
  phaseProgress: number;
  totalProgress: number;
  descentProgress: number;
  stabilizationScore: number;
  approachStability: number;
  resolvedLandingQuality: LandingQuality | null;
  prompt: string;
  inputLocked: boolean;
  touchdownApplied: boolean;
}>;

const sequenceConfig = {
  approachSeconds: 4.6,
  finalDescentSeconds: 4.8,
  stabilizationSeconds: 7.4,
  touchdownSeconds: 2.9,
  deployingSeconds: 2.2,
  cleanThreshold: 0.74,
  roughThreshold: 0.36,
  holdGainPerSecond: 0.46,
  confirmPulseGain: 0.13,
  passiveDriftPerSecond: -0.05,
  approachInstability: 0.1,
} as const;

const phaseOrder: ShipLandingPhase[] = [
  "approach",
  "final-descent",
  "stabilization-window",
  "touchdown",
  "deploying",
];

export class ShipLandingSequence {
  private currentPhase: ShipLandingPhase = "inactive";
  private elapsedInPhase = 0;
  private elapsedTotal = 0;
  private score = 0.18;
  private stability = 0.82;
  private quality: LandingQuality | null = null;
  private applied = false;

  public get state(): ShipLandingSequenceState {
    return this.createState();
  }

  public start(forcedQuality: LandingQuality | null = null): ShipLandingSequenceState {
    this.currentPhase = "approach";
    this.elapsedInPhase = 0;
    this.elapsedTotal = 0;
    this.score = 0.18;
    this.stability = 0.82;
    this.quality = forcedQuality;
    this.applied = false;
    return this.state;
  }

  public update(dt: number, input: InputSnapshot): ShipLandingSequenceState {
    if (!this.state.active) {
      return this.state;
    }

    this.elapsedInPhase += dt;
    this.elapsedTotal += dt;

    if (this.currentPhase === "final-descent") {
      this.stability = Math.max(0, this.stability - sequenceConfig.approachInstability * dt);
    }

    if (this.currentPhase === "stabilization-window") {
      const held = input.interactHeld || input.uiConfirmPressed || input.fireHeld;
      const pulse = input.interactPressed || input.uiConfirmPressed || input.firePressed;
      this.score = Math.max(
        0,
        Math.min(
          1,
          this.score +
            (held ? sequenceConfig.holdGainPerSecond * dt : sequenceConfig.passiveDriftPerSecond * dt) +
            (pulse ? sequenceConfig.confirmPulseGain : 0),
        ),
      );
      this.stability = Math.min(1, 0.55 + this.score * 0.45);
    }

    if (this.elapsedInPhase >= this.phaseDuration(this.currentPhase)) {
      this.advancePhase();
    }

    return this.state;
  }

  public markTouchdownApplied(): ShipLandingSequenceState {
    this.applied = true;
    return this.state;
  }

  public forceQuality(quality: LandingQuality): ShipLandingSequenceState {
    this.quality = quality;
    this.score = quality === "clean" ? 0.92 : quality === "rough" ? 0.56 : 0.18;
    this.currentPhase = "touchdown";
    this.elapsedInPhase = 0;
    this.elapsedTotal = this.durationBeforePhase("touchdown");
    return this.state;
  }

  public skipToComplete(): ShipLandingSequenceState {
    if (!this.quality) {
      this.resolveLandingQuality();
    }
    this.currentPhase = "complete";
    this.elapsedInPhase = 0;
    this.elapsedTotal = this.totalDuration;
    return this.state;
  }

  public reset(): ShipLandingSequenceState {
    this.currentPhase = "inactive";
    this.elapsedInPhase = 0;
    this.elapsedTotal = 0;
    this.score = 0;
    this.stability = 1;
    this.quality = null;
    this.applied = false;
    return this.state;
  }

  private advancePhase(): void {
    if (this.currentPhase === "stabilization-window") {
      this.resolveLandingQuality();
    }

    const currentIndex = phaseOrder.indexOf(this.currentPhase);
    const next = phaseOrder[currentIndex + 1] ?? "complete";
    this.currentPhase = next;
    this.elapsedInPhase = 0;

    if (next === "complete" && !this.quality) {
      this.resolveLandingQuality();
    }
  }

  private resolveLandingQuality(): void {
    if (this.quality) {
      return;
    }

    const noise = (Math.random() - 0.5) * 0.08;
    const finalScore = Math.max(0, Math.min(1, this.score + noise));
    this.quality = finalScore >= sequenceConfig.cleanThreshold
      ? "clean"
      : finalScore >= sequenceConfig.roughThreshold
        ? "rough"
        : "damaged";
  }

  private createState(): ShipLandingSequenceState {
    const phaseDuration = this.phaseDuration(this.currentPhase);
    const phaseProgress = phaseDuration > 0 ? Math.min(1, this.elapsedInPhase / phaseDuration) : 0;
    const active = this.currentPhase !== "inactive" && this.currentPhase !== "complete";
    const totalProgress = this.currentPhase === "complete"
      ? 1
      : Math.min(1, this.elapsedTotal / this.totalDuration);
    const descentProgress = this.currentPhase === "touchdown" || this.currentPhase === "deploying" || this.currentPhase === "complete"
      ? 1
      : Math.min(0.96, totalProgress / 0.75);

    return {
      active,
      phase: this.currentPhase,
      phaseElapsed: this.elapsedInPhase,
      phaseProgress,
      totalProgress,
      descentProgress,
      stabilizationScore: this.score,
      approachStability: this.stability,
      resolvedLandingQuality: this.quality,
      prompt: this.promptForPhase(this.currentPhase),
      inputLocked: active,
      touchdownApplied: this.applied,
    };
  }

  private promptForPhase(phase: ShipLandingPhase): string {
    if (phase === "approach") return "DESCENT BURN ACTIVE";
    if (phase === "final-descent") return "DUST FIELD RISING";
    if (phase === "stabilization-window") return "HOLD E / A TO STABILIZE";
    if (phase === "touchdown") return "TOUCHDOWN";
    if (phase === "deploying") return "SUIT LINK RESTORED";
    return "";
  }

  private get totalDuration(): number {
    return phaseOrder.reduce((total, phase) => total + this.phaseDuration(phase), 0);
  }

  private durationBeforePhase(phase: ShipLandingPhase): number {
    let total = 0;
    for (const item of phaseOrder) {
      if (item === phase) {
        return total;
      }
      total += this.phaseDuration(item);
    }
    return total;
  }

  private phaseDuration(phase: ShipLandingPhase): number {
    if (phase === "approach") return sequenceConfig.approachSeconds;
    if (phase === "final-descent") return sequenceConfig.finalDescentSeconds;
    if (phase === "stabilization-window") return sequenceConfig.stabilizationSeconds;
    if (phase === "touchdown") return sequenceConfig.touchdownSeconds;
    if (phase === "deploying") return sequenceConfig.deployingSeconds;
    return 0;
  }
}
