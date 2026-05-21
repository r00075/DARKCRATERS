export class FireRateGate {
  private cooldown = 0;

  public constructor(private readonly roundsPerMinute: number) {}

  public get ready(): boolean {
    return this.cooldown === 0;
  }

  public update(dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
  }

  public trigger(): void {
    this.cooldown = 60 / this.roundsPerMinute;
  }
}
