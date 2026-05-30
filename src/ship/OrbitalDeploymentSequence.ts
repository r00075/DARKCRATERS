import type { InputSnapshot } from "../input/InputController";
import type { LandingQuality } from "./ShipManager";

export type DeploymentStationId = "captain" | "navigation" | "systems" | "defense" | "recovery";
export type DeploymentEventCategory = "route" | "systems" | "interference" | "hazard" | "recovery-readiness";

export type OrbitalDeploymentPhase =
  | "inactive"
  | "dock-release"
  | "clearance-burn"
  | "transit-corridor"
  | "signal-interference"
  | "route-reacquisition"
  | "lunar-approach"
  | "final-descent"
  | "stabilization-window"
  | "touchdown"
  | "deploying"
  | "complete";

export type DeploymentFinalizationReason = "none" | "completed" | "K skip" | "aborted" | "fallback";
export type LandingQualityAuthoritySource = "local" | "server" | "fallback";

export type OrbitalDeploymentSequenceState = Readonly<{
  active: boolean;
  phase: OrbitalDeploymentPhase;
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
  elapsedTotal: number;
  baselineDuration: number;
  extensionTime: number;
  maxDuration: number;
  alignmentOffset: number;
  targetOffset: number;
  alignmentVelocity: number;
  stabilityScore: number;
  signalInterferenceActive: boolean;
  routeReacquisitionTriggered: boolean;
  predictedLandingQuality: LandingQuality;
  finalAppliedLandingQuality: LandingQuality | null;
  landingQualityAuthority: LandingQualityAuthoritySource;
  resourcesActive: boolean;
  lastFinalizationReason: DeploymentFinalizationReason;
  audioPhase: string;
  stationFocus: DeploymentStationId;
  eventCategory: DeploymentEventCategory;
  hudPhaseLabel: string;
}>;

const deploymentConfig = {
  dockReleaseSeconds: 4,
  clearanceBurnSeconds: 5,
  transitCorridorSeconds: 14,
  signalInterferenceSeconds: 8,
  routeReacquisitionSeconds: 10,
  lunarApproachSeconds: 7,
  finalDescentSeconds: 6,
  stabilizationSeconds: 6,
  touchdownSeconds: 2.5,
  deployingSeconds: 2,
  maxAlignmentOffset: 1,
  lateralAcceleration: 1.9,
  lateralDamping: 5.8,
  targetDriftAmplitude: 0.52,
  signalTargetAmplitude: 0.82,
  alignmentGoodTolerance: 0.22,
  alignmentWarningTolerance: 0.48,
  stabilityGainPerSecond: 0.018,
  stabilityLossPerSecond: 0.052,
  signalLossPerSecond: 0.068,
  reacquisitionPenalty: 0.1,
  finalHoldGainPerSecond: 0.44,
  finalConfirmPulseGain: 0.12,
  finalPassiveDriftPerSecond: -0.048,
  cleanThreshold: 0.74,
  roughThreshold: 0.38,
} as const;

const phaseOrder: OrbitalDeploymentPhase[] = [
  "dock-release",
  "clearance-burn",
  "transit-corridor",
  "signal-interference",
  "route-reacquisition",
  "lunar-approach",
  "final-descent",
  "stabilization-window",
  "touchdown",
  "deploying",
];

const basePhaseOrder = phaseOrder.filter((phase) => phase !== "route-reacquisition");

export class OrbitalDeploymentSequence {
  private currentPhase: OrbitalDeploymentPhase = "inactive";
  private elapsedInPhase = 0;
  private elapsedTotal = 0;
  private finalScore = 0.2;
  private stability = 0.76;
  private quality: LandingQuality | null = null;
  private forcedQuality: LandingQuality | null = null;
  private applied = false;
  private alignmentOffset = 0;
  private alignmentVelocity = 0;
  private targetOffset = 0;
  private routeReacquisitionTriggered = false;
  private extensionTime = 0;
  private landingQualityAuthority: LandingQualityAuthoritySource = "local";
  private lastFinalizationReason: DeploymentFinalizationReason = "none";

  public get state(): OrbitalDeploymentSequenceState {
    return this.createState();
  }

  public start(
    forcedQuality: LandingQuality | null = null,
    authority: LandingQualityAuthoritySource = forcedQuality ? "server" : "local",
  ): OrbitalDeploymentSequenceState {
    this.currentPhase = "dock-release";
    this.elapsedInPhase = 0;
    this.elapsedTotal = 0;
    this.finalScore = 0.2;
    this.stability = 0.76;
    this.quality = forcedQuality;
    this.forcedQuality = forcedQuality;
    this.applied = false;
    this.alignmentOffset = 0;
    this.alignmentVelocity = 0;
    this.targetOffset = 0;
    this.routeReacquisitionTriggered = false;
    this.extensionTime = 0;
    this.landingQualityAuthority = authority;
    this.lastFinalizationReason = "none";
    return this.state;
  }

  public update(dt: number, input: InputSnapshot): OrbitalDeploymentSequenceState {
    if (!this.state.active) {
      return this.state;
    }

    this.elapsedInPhase += dt;
    this.elapsedTotal += dt;
    this.updateTransitControl(dt, input);

    if (this.currentPhase === "stabilization-window") {
      this.updateFinalStabilization(dt, input);
    }

    if (this.elapsedInPhase >= this.phaseDuration(this.currentPhase)) {
      this.advancePhase();
    }

    return this.state;
  }

  public markTouchdownApplied(): OrbitalDeploymentSequenceState {
    this.applied = true;
    return this.state;
  }

  public forceQuality(quality: LandingQuality): OrbitalDeploymentSequenceState {
    this.quality = quality;
    this.forcedQuality = quality;
    this.landingQualityAuthority = "local";
    this.finalScore = quality === "clean" ? 0.92 : quality === "rough" ? 0.56 : 0.18;
    this.stability = quality === "clean" ? 0.92 : quality === "rough" ? 0.62 : 0.28;
    this.currentPhase = "touchdown";
    this.elapsedInPhase = 0;
    this.elapsedTotal = this.durationBeforePhase("touchdown");
    this.lastFinalizationReason = "fallback";
    return this.state;
  }

  public skipToComplete(reason: DeploymentFinalizationReason = "K skip"): OrbitalDeploymentSequenceState {
    if (!this.quality) {
      this.resolveLandingQuality();
    }
    this.currentPhase = "complete";
    this.elapsedInPhase = 0;
    this.elapsedTotal = this.totalDuration;
    this.lastFinalizationReason = reason;
    return this.state;
  }

  public reset(): OrbitalDeploymentSequenceState {
    this.currentPhase = "inactive";
    this.elapsedInPhase = 0;
    this.elapsedTotal = 0;
    this.finalScore = 0;
    this.stability = 1;
    this.quality = null;
    this.forcedQuality = null;
    this.applied = false;
    this.alignmentOffset = 0;
    this.alignmentVelocity = 0;
    this.targetOffset = 0;
    this.routeReacquisitionTriggered = false;
    this.extensionTime = 0;
    this.landingQualityAuthority = "local";
    this.lastFinalizationReason = "none";
    return this.state;
  }

  private updateTransitControl(dt: number, input: InputSnapshot): void {
    if (!this.isTransitControlPhase(this.currentPhase)) {
      if (this.currentPhase === "dock-release") {
        this.targetOffset = 0;
      }
      return;
    }

    const phaseWeight = this.currentPhase === "signal-interference" ? 1.7 : this.currentPhase === "lunar-approach" ? 1.25 : 1;
    const driftTime = this.elapsedTotal * (this.currentPhase === "signal-interference" ? 1.35 : 0.72);
    const amplitude = this.currentPhase === "signal-interference"
      ? deploymentConfig.signalTargetAmplitude
      : deploymentConfig.targetDriftAmplitude;
    this.targetOffset = Math.sin(driftTime) * amplitude + Math.sin(driftTime * 0.43 + 1.7) * amplitude * 0.24;
    this.targetOffset = this.clamp(this.targetOffset, -0.92, 0.92);

    const targetVelocity = this.clamp(input.moveX, -1, 1) * deploymentConfig.lateralAcceleration;
    const velocityBlend = Math.min(1, dt * deploymentConfig.lateralDamping);
    this.alignmentVelocity += (targetVelocity - this.alignmentVelocity) * velocityBlend;
    this.alignmentOffset = this.clamp(
      this.alignmentOffset + this.alignmentVelocity * dt,
      -deploymentConfig.maxAlignmentOffset,
      deploymentConfig.maxAlignmentOffset,
    );

    const error = Math.abs(this.alignmentOffset - this.targetOffset);
    const lateWeight = this.currentPhase === "lunar-approach" || this.currentPhase === "final-descent" ? 1.35 : 1;
    if (error <= deploymentConfig.alignmentGoodTolerance) {
      this.stability = this.clamp(this.stability + deploymentConfig.stabilityGainPerSecond * dt, 0, 1);
    } else {
      const loss = error > deploymentConfig.alignmentWarningTolerance
        ? deploymentConfig.stabilityLossPerSecond * phaseWeight * lateWeight
        : deploymentConfig.stabilityLossPerSecond * 0.45 * lateWeight;
      this.stability = this.clamp(this.stability - loss * dt, 0, 1);
    }

    if (this.currentPhase === "signal-interference" && error > deploymentConfig.alignmentWarningTolerance) {
      this.stability = this.clamp(this.stability - deploymentConfig.signalLossPerSecond * dt, 0, 1);
    }
  }

  private updateFinalStabilization(dt: number, input: InputSnapshot): void {
    const held = input.interactHeld || input.uiConfirmPressed || input.fireHeld;
    const pulse = input.interactPressed || input.uiConfirmPressed || input.firePressed;
    this.finalScore = this.clamp(
      this.finalScore +
        (held ? deploymentConfig.finalHoldGainPerSecond * dt : deploymentConfig.finalPassiveDriftPerSecond * dt) +
        (pulse ? deploymentConfig.finalConfirmPulseGain : 0),
      0,
      1,
    );
    this.stability = this.clamp(this.stability * 0.92 + (0.48 + this.finalScore * 0.52) * 0.08, 0, 1);
  }

  private advancePhase(): void {
    if (this.currentPhase === "signal-interference") {
      const signalError = Math.abs(this.alignmentOffset - this.targetOffset);
      this.routeReacquisitionTriggered = signalError > deploymentConfig.alignmentWarningTolerance || this.stability < 0.54;
      if (this.routeReacquisitionTriggered) {
        this.extensionTime = deploymentConfig.routeReacquisitionSeconds;
        this.stability = this.clamp(this.stability - deploymentConfig.reacquisitionPenalty, 0, 1);
      }
    }

    if (this.currentPhase === "stabilization-window") {
      this.resolveLandingQuality();
    }

    let next = this.nextPhase(this.currentPhase);
    if (next === "route-reacquisition" && !this.routeReacquisitionTriggered) {
      next = "lunar-approach";
    }

    this.currentPhase = next;
    this.elapsedInPhase = 0;

    if (next === "complete") {
      if (!this.quality) {
        this.resolveLandingQuality();
      }
      this.lastFinalizationReason = this.lastFinalizationReason === "none" ? "completed" : this.lastFinalizationReason;
    }
  }

  private resolveLandingQuality(): void {
    if (this.forcedQuality) {
      this.quality = this.forcedQuality;
      return;
    }

    const transitContribution = this.stability * 0.42;
    const finalContribution = this.finalScore * 0.58;
    const routePenalty = this.routeReacquisitionTriggered ? 0.06 : 0;
    const noise = (Math.random() - 0.5) * 0.045;
    const finalScore = this.clamp(transitContribution + finalContribution - routePenalty + noise, 0, 1);
    this.quality = this.qualityForScore(finalScore);
  }

  private createState(): OrbitalDeploymentSequenceState {
    const phaseDuration = this.phaseDuration(this.currentPhase);
    const phaseProgress = phaseDuration > 0 ? Math.min(1, this.elapsedInPhase / phaseDuration) : 0;
    const active = this.currentPhase !== "inactive" && this.currentPhase !== "complete";
    const totalProgress = this.currentPhase === "complete"
      ? 1
      : Math.min(1, this.elapsedTotal / this.totalDuration);
    const descentProgress = this.currentPhase === "touchdown" || this.currentPhase === "deploying" || this.currentPhase === "complete"
      ? 1
      : this.currentPhase === "final-descent" || this.currentPhase === "stabilization-window"
        ? Math.min(0.97, 0.72 + this.durationAwarePhaseProgress() * 0.24)
        : Math.min(0.7, totalProgress * 0.82);
    const predictedScore = this.clamp(this.stability * 0.42 + this.finalScore * 0.58 - (this.routeReacquisitionTriggered ? 0.06 : 0), 0, 1);
    const predictedLandingQuality = this.qualityForScore(predictedScore);

    return {
      active,
      phase: this.currentPhase,
      phaseElapsed: this.elapsedInPhase,
      phaseProgress,
      totalProgress,
      descentProgress,
      stabilizationScore: this.finalScore,
      approachStability: this.stability,
      resolvedLandingQuality: this.quality,
      prompt: this.promptForPhase(this.currentPhase),
      inputLocked: active,
      touchdownApplied: this.applied,
      elapsedTotal: this.elapsedTotal,
      baselineDuration: this.baselineDuration,
      extensionTime: this.extensionTime,
      maxDuration: this.baselineDuration + deploymentConfig.routeReacquisitionSeconds,
      alignmentOffset: this.alignmentOffset,
      targetOffset: this.targetOffset,
      alignmentVelocity: this.alignmentVelocity,
      stabilityScore: this.stability,
      signalInterferenceActive: this.currentPhase === "signal-interference",
      routeReacquisitionTriggered: this.routeReacquisitionTriggered,
      predictedLandingQuality,
      finalAppliedLandingQuality: this.applied ? this.quality : null,
      landingQualityAuthority: this.landingQualityAuthority,
      resourcesActive: active,
      lastFinalizationReason: this.lastFinalizationReason,
      audioPhase: this.audioPhaseForPhase(this.currentPhase),
      stationFocus: this.stationForPhase(this.currentPhase),
      eventCategory: this.eventCategoryForPhase(this.currentPhase),
      hudPhaseLabel: this.hudLabelForPhase(this.currentPhase),
    };
  }

  private durationAwarePhaseProgress(): number {
    const finalStart = this.durationBeforePhase("final-descent");
    const finalSpan =
      this.phaseDuration("final-descent") +
      this.phaseDuration("stabilization-window") +
      this.phaseDuration("touchdown");
    return this.clamp((this.elapsedTotal - finalStart) / finalSpan, 0, 1);
  }

  private nextPhase(phase: OrbitalDeploymentPhase): OrbitalDeploymentPhase {
    const currentIndex = phaseOrder.indexOf(phase);
    return phaseOrder[currentIndex + 1] ?? "complete";
  }

  private isTransitControlPhase(phase: OrbitalDeploymentPhase): boolean {
    return phase === "transit-corridor" ||
      phase === "signal-interference" ||
      phase === "route-reacquisition" ||
      phase === "lunar-approach" ||
      phase === "final-descent";
  }

  private promptForPhase(phase: OrbitalDeploymentPhase): string {
    if (phase === "dock-release") return "DEPLOYMENT CLEARANCE";
    if (phase === "clearance-burn") return "DOCK RELEASE";
    if (phase === "transit-corridor") return "APPROACH CORRIDOR";
    if (phase === "signal-interference") return "SIGNAL DRIFT";
    if (phase === "route-reacquisition") return "REACQUIRING CORRIDOR";
    if (phase === "lunar-approach") return "LUNAR APPROACH";
    if (phase === "final-descent") return "FINAL DESCENT";
    if (phase === "stabilization-window") return "HOLD E / A TO STABILIZE";
    if (phase === "touchdown") return "TOUCHDOWN";
    if (phase === "deploying") return "SUIT LINK RESTORED";
    return "";
  }

  private hudLabelForPhase(phase: OrbitalDeploymentPhase): string {
    if (phase === "dock-release") return "DOCK RELEASE";
    if (phase === "clearance-burn") return "CLEARANCE BURN";
    if (phase === "transit-corridor") return "TRANSIT CORRIDOR";
    if (phase === "signal-interference") return "SIGNAL DRIFT";
    if (phase === "route-reacquisition") return "REACQUIRING CORRIDOR";
    if (phase === "lunar-approach") return "LUNAR APPROACH";
    if (phase === "final-descent") return "FINAL DESCENT";
    if (phase === "stabilization-window") return "STABILIZE";
    if (phase === "touchdown") return "TOUCHDOWN";
    if (phase === "deploying") return "DEPLOYING";
    return "INACTIVE";
  }

  private stationForPhase(phase: OrbitalDeploymentPhase): DeploymentStationId {
    if (phase === "signal-interference" || phase === "route-reacquisition" || phase === "transit-corridor") return "navigation";
    if (phase === "stabilization-window" || phase === "final-descent") return "systems";
    if (phase === "deploying") return "recovery";
    return "captain";
  }

  private eventCategoryForPhase(phase: OrbitalDeploymentPhase): DeploymentEventCategory {
    if (phase === "signal-interference") return "interference";
    if (phase === "route-reacquisition" || phase === "transit-corridor" || phase === "lunar-approach") return "route";
    if (phase === "final-descent" || phase === "stabilization-window") return "systems";
    return "recovery-readiness";
  }

  private audioPhaseForPhase(phase: OrbitalDeploymentPhase): string {
    if (phase === "dock-release") return "ship_dock_release";
    if (phase === "clearance-burn") return "ship_clearance_burn";
    if (phase === "transit-corridor") return "ship_transit_corridor";
    if (phase === "signal-interference") return "ship_signal_interference";
    if (phase === "route-reacquisition") return "ship_route_reacquisition";
    if (phase === "lunar-approach") return "ship_lunar_approach";
    if (phase === "final-descent") return "ship_final_approach";
    if (phase === "stabilization-window") return "ship_impact_build";
    if (phase === "touchdown") return "ship_touchdown";
    if (phase === "deploying") return "ship_deploying";
    return "none";
  }

  private qualityForScore(score: number): LandingQuality {
    if (score >= deploymentConfig.cleanThreshold) return "clean";
    if (score >= deploymentConfig.roughThreshold) return "rough";
    return "damaged";
  }

  private get baselineDuration(): number {
    return basePhaseOrder.reduce((total, phase) => total + this.phaseDuration(phase), 0);
  }

  private get totalDuration(): number {
    return this.baselineDuration + this.extensionTime;
  }

  private durationBeforePhase(phase: OrbitalDeploymentPhase): number {
    let total = 0;
    for (const item of phaseOrder) {
      if (item === phase) {
        return total;
      }
      if (item === "route-reacquisition" && !this.routeReacquisitionTriggered) {
        continue;
      }
      total += this.phaseDuration(item);
    }
    return total;
  }

  private phaseDuration(phase: OrbitalDeploymentPhase): number {
    if (phase === "dock-release") return deploymentConfig.dockReleaseSeconds;
    if (phase === "clearance-burn") return deploymentConfig.clearanceBurnSeconds;
    if (phase === "transit-corridor") return deploymentConfig.transitCorridorSeconds;
    if (phase === "signal-interference") return deploymentConfig.signalInterferenceSeconds;
    if (phase === "route-reacquisition") return this.routeReacquisitionTriggered ? deploymentConfig.routeReacquisitionSeconds : 0;
    if (phase === "lunar-approach") return deploymentConfig.lunarApproachSeconds;
    if (phase === "final-descent") return deploymentConfig.finalDescentSeconds;
    if (phase === "stabilization-window") return deploymentConfig.stabilizationSeconds;
    if (phase === "touchdown") return deploymentConfig.touchdownSeconds;
    if (phase === "deploying") return deploymentConfig.deployingSeconds;
    return 0;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
