const reputationStorageKey = "extraction-shooter.prototype.reputation.v1";

export type ReputationEvent = "clean-extract" | "hostile-kill" | "neutral-kill";

const reputationDelta: Record<ReputationEvent, number> = {
  "clean-extract": 2,
  "hostile-kill": 8,
  "neutral-kill": -12,
};

export class Reputation {
  private score = 0;

  public constructor(private readonly storage: Storage | null = window.localStorage) {
    this.load();
  }

  public get value(): number {
    return this.score;
  }

  public apply(event: ReputationEvent): number {
    const delta = reputationDelta[event];
    this.score += delta;
    this.save();
    return delta;
  }

  private load(): void {
    if (!this.storage) {
      return;
    }

    const raw = this.storage.getItem(reputationStorageKey);
    const parsed = raw ? Number(raw) : 0;
    this.score = Number.isFinite(parsed) ? parsed : 0;
  }

  private save(): void {
    try {
      this.storage?.setItem(reputationStorageKey, String(this.score));
    } catch {
      // Local identity persistence is best-effort until backend profiles exist.
    }
  }
}
