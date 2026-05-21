export type MentalStabilityState = "stable" | "uneasy" | "unstable" | "lunatic" | "breakdown";

export type PlayerStatusSnapshot = Readonly<{
  mentalStability: number;
  mentalState: MentalStabilityState;
  lunarInfection: boolean;
}>;

const infectionDrainPerSecond = 1 / 5;

export class PlayerStatus {
  private mentalStability = 100;
  private lunarInfection = false;
  private previousState: MentalStabilityState = "stable";

  public get snapshot(): PlayerStatusSnapshot {
    return {
      mentalStability: this.mentalStability,
      mentalState: this.getMentalState(this.mentalStability),
      lunarInfection: this.lunarInfection,
    };
  }

  public update(dt: number): string[] {
    const messages: string[] = [];

    if (this.lunarInfection) {
      this.mentalStability = Math.max(0, this.mentalStability - infectionDrainPerSecond * dt);
    }

    const state = this.getMentalState(this.mentalStability);
    if (state !== this.previousState) {
      this.previousState = state;
      messages.push(this.formatMentalWarning(state));
    }

    return messages.filter((message) => message.length > 0);
  }

  public resetForRun(): void {
    this.mentalStability = 100;
    this.lunarInfection = false;
    this.previousState = "stable";
  }

  public tryApplyLunarInfection(chance = 0.2): boolean {
    if (this.lunarInfection || Math.random() > chance) {
      return false;
    }

    this.lunarInfection = true;
    return true;
  }

  public administerAntiToxin(): void {
    this.lunarInfection = false;
    this.mentalStability = Math.min(100, this.mentalStability + 20);
    this.previousState = this.getMentalState(this.mentalStability);
  }

  private getMentalState(value: number): MentalStabilityState {
    if (value <= 0) return "breakdown";
    if (value <= 25) return "lunatic";
    if (value <= 50) return "unstable";
    if (value <= 75) return "uneasy";
    return "stable";
  }

  private formatMentalWarning(state: MentalStabilityState): string {
    if (state === "uneasy") return "Mental stability declining.";
    if (state === "unstable") return "Cognitive interference detected.";
    if (state === "lunatic") return "Lunacy threshold breached.";
    if (state === "breakdown") return "Mental stability broken.";
    return "";
  }
}
