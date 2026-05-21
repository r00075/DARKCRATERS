import { Vector3 } from "@babylonjs/core";

export type PlayerHealthSnapshot = Readonly<{
  current: number;
  max: number;
  alive: boolean;
  recentDamage: boolean;
  lowHealth: boolean;
  recentDamageAngle: number | null;
}>;

export class PlayerHealth {
  private currentHealth: number;
  private recentDamageTimer = 0;
  private incomingDamageMultiplier = 1;
  private recentDamageAngle: number | null = null;

  public constructor(private readonly maxHealth = 100) {
    this.currentHealth = maxHealth;
  }

  public get snapshot(): PlayerHealthSnapshot {
    return {
      current: this.currentHealth,
      max: this.maxHealth,
      alive: this.currentHealth > 0,
      recentDamage: this.recentDamageTimer > 0,
      lowHealth: this.currentHealth > 0 && this.currentHealth / this.maxHealth <= 0.3,
      recentDamageAngle: this.recentDamageTimer > 0 ? this.recentDamageAngle : null,
    };
  }

  public update(dt: number): void {
    this.recentDamageTimer = Math.max(0, this.recentDamageTimer - dt);
  }

  public applyDamage(amount: number, sourcePosition?: Vector3, playerPosition?: Vector3): void {
    if (this.currentHealth <= 0) {
      return;
    }

    this.currentHealth = Math.max(0, this.currentHealth - amount * this.incomingDamageMultiplier);
    this.recentDamageTimer = 0.16;
    this.recentDamageAngle = sourcePosition && playerPosition
      ? Math.atan2(sourcePosition.x - playerPosition.x, sourcePosition.z - playerPosition.z)
      : null;
  }

  public setIncomingDamageMultiplier(multiplier: number): void {
    this.incomingDamageMultiplier = multiplier;
  }

  public heal(amount: number): void {
    if (this.currentHealth <= 0) {
      return;
    }

    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }

  public setCurrentFromServer(amount: number): void {
    const nextHealth = Math.min(this.maxHealth, Math.max(0, amount));
    this.recentDamageTimer = nextHealth < this.currentHealth ? 0.16 : this.recentDamageTimer;
    this.recentDamageAngle = nextHealth < this.currentHealth ? null : this.recentDamageAngle;
    this.currentHealth = nextHealth;
  }

  public reset(): void {
    this.currentHealth = this.maxHealth;
    this.recentDamageTimer = 0;
    this.recentDamageAngle = null;
  }
}
