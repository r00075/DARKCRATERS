export type RaidTimerState = Readonly<{
  elapsed: number;
  timeRemaining: number;
  totalDuration: number;
  extractionUnlocked: boolean;
  finalWarning: boolean;
  expired: boolean;
}>;

export const raidTimerConfig = {
  durationSeconds: 12 * 60,
  extractionUnlockSeconds: 2 * 60,
  finalWarningSeconds: 2 * 60,
} as const;

export class RaidTimer {
  private elapsedSeconds = 0;
  private durationSeconds = raidTimerConfig.durationSeconds;
  private extractionUnlockSeconds = raidTimerConfig.extractionUnlockSeconds;
  private finalWarningSeconds = raidTimerConfig.finalWarningSeconds;

  public get state(): RaidTimerState {
    return this.createState();
  }

  public update(dt: number): RaidTimerState {
    this.elapsedSeconds = Math.min(
      this.durationSeconds,
      this.elapsedSeconds + dt,
    );

    return this.createState();
  }

  public reset(durationSeconds = raidTimerConfig.durationSeconds): void {
    this.durationSeconds = durationSeconds;
    this.extractionUnlockSeconds = Math.min(raidTimerConfig.extractionUnlockSeconds, Math.max(60, durationSeconds * 0.22));
    this.finalWarningSeconds = Math.min(raidTimerConfig.finalWarningSeconds, Math.max(60, durationSeconds * 0.18));
    this.elapsedSeconds = 0;
  }

  private createState(): RaidTimerState {
    const timeRemaining = Math.max(0, this.durationSeconds - this.elapsedSeconds);

    return {
      elapsed: this.elapsedSeconds,
      timeRemaining,
      totalDuration: this.durationSeconds,
      extractionUnlocked: this.elapsedSeconds >= this.extractionUnlockSeconds,
      finalWarning: timeRemaining <= this.finalWarningSeconds,
      expired: timeRemaining <= 0,
    };
  }
}
