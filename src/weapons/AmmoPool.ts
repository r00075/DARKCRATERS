export class AmmoPool {
  private readonly startingMagazine: number;
  private readonly startingReserve: number;

  public constructor(
    private readonly magazineSize: number,
    private magazine: number,
    private reserve: number,
  ) {
    this.startingMagazine = magazine;
    this.startingReserve = reserve;
  }

  public get magazineAmmo(): number {
    return this.magazine;
  }

  public get reserveAmmo(): number {
    return this.reserve;
  }

  public get empty(): boolean {
    return this.magazine === 0;
  }

  public get full(): boolean {
    return this.magazine === this.magazineSize;
  }

  public consumeRound(): boolean {
    if (this.magazine === 0) {
      return false;
    }

    this.magazine -= 1;
    return true;
  }

  public reload(): void {
    const needed = this.magazineSize - this.magazine;
    const loaded = Math.min(needed, this.reserve);
    this.magazine += loaded;
    this.reserve -= loaded;
  }

  public addReserve(amount: number): void {
    this.reserve += amount;
  }

  public setAmmo(magazine: number, reserve: number): void {
    this.magazine = Math.min(this.magazineSize, Math.max(0, magazine));
    this.reserve = Math.max(0, reserve);
  }

  public reset(): void {
    this.magazine = this.startingMagazine;
    this.reserve = this.startingReserve;
  }

  public canReload(): boolean {
    return !this.full && this.reserve > 0;
  }
}
