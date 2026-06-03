import type { WeaponId } from "./WeaponDefinitions";

export type WeaponDurabilityState = Readonly<{
  weaponId: WeaponId;
  durability: number;
  jammed: boolean;
  clearingJam: boolean;
  clearProgress: number;
  jamWarning: boolean;
  accuracyMultiplier: number;
  recoilMultiplier: number;
  adsTransitionMultiplier: number;
  jamChance: number;
}>;

export type RepairResult = Readonly<{
  repaired: boolean;
  message: string;
  durability: number;
  scrapCost: number;
}>;

const storageKey = "babylon-extraction-shooter-weapon-durability-v1";

const durabilityConfig = {
  maxDurability: 100,
  warningThreshold: 45,
  jamThreshold: 55,
  clearJamSeconds: 1.5,
  deathPenalty: 4,
  repairCostScrap: 2,
  repairAmount: 24,
  repairCap: 92,
  degradationPerShot: {
    pistol: 0.055,
    "burst-pistol": 0.058,
    revolver: 0.065,
    "compact-smg": 0.04,
    smg: 0.035,
    shotgun: 0.09,
    "assault-rifle": 0.042,
    rifle: 0.075,
    knife: 0.018,
  } satisfies Record<WeaponId, number>,
  tierDegradationMultiplier: {
    pistol: 1,
    "burst-pistol": 0.98,
    revolver: 0.9,
    "compact-smg": 0.96,
    smg: 0.94,
    shotgun: 0.88,
    "assault-rifle": 0.86,
    rifle: 0.72,
    knife: 0.6,
  } satisfies Record<WeaponId, number>,
};

type StoredDurability = Record<WeaponId, number>;
type JamRuntimeState = Record<WeaponId, { jammed: boolean; clearTimer: number }>;

export class WeaponDurabilitySystem {
  private durability: StoredDurability = this.load();
  private readonly runtime: JamRuntimeState = {
    pistol: { jammed: false, clearTimer: 0 },
    "burst-pistol": { jammed: false, clearTimer: 0 },
    revolver: { jammed: false, clearTimer: 0 },
    "compact-smg": { jammed: false, clearTimer: 0 },
    smg: { jammed: false, clearTimer: 0 },
    shotgun: { jammed: false, clearTimer: 0 },
    "assault-rifle": { jammed: false, clearTimer: 0 },
    rifle: { jammed: false, clearTimer: 0 },
    knife: { jammed: false, clearTimer: 0 },
  };

  public update(dt: number, weaponId: WeaponId, clearJamHeld: boolean): WeaponDurabilityState {
    const runtime = this.runtime[weaponId];

    if (!runtime.jammed) {
      runtime.clearTimer = 0;
      return this.getState(weaponId);
    }

    if (clearJamHeld) {
      runtime.clearTimer = Math.min(durabilityConfig.clearJamSeconds, runtime.clearTimer + dt);

      if (runtime.clearTimer >= durabilityConfig.clearJamSeconds) {
        runtime.jammed = false;
        runtime.clearTimer = 0;
      }
    } else {
      runtime.clearTimer = 0;
    }

    return this.getState(weaponId);
  }

  public recordShot(weaponId: WeaponId, degradationMultiplier = 1): boolean {
    if (this.runtime[weaponId].jammed) {
      return true;
    }

    const jamChance = this.calculateJamChance(this.durability[weaponId]);

    if (jamChance > 0 && Math.random() < jamChance) {
      this.runtime[weaponId].jammed = true;
      this.runtime[weaponId].clearTimer = 0;
      return true;
    }

    this.degrade(
      weaponId,
      durabilityConfig.degradationPerShot[weaponId] *
        durabilityConfig.tierDegradationMultiplier[weaponId] *
        degradationMultiplier,
    );
    return false;
  }

  public applyDeathWear(weaponId: WeaponId): void {
    this.degrade(weaponId, durabilityConfig.deathPenalty);
  }

  public repairWithScrap(weaponId: WeaponId, spendScrap: (quantity: number) => boolean): RepairResult {
    const current = this.durability[weaponId];

    if (current >= durabilityConfig.repairCap) {
      return {
        repaired: false,
        message: `${this.formatWeapon(weaponId)} is already serviceable`,
        durability: current,
        scrapCost: 0,
      };
    }

    if (!spendScrap(durabilityConfig.repairCostScrap)) {
      return {
        repaired: false,
        message: `Need ${durabilityConfig.repairCostScrap} scrap to repair`,
        durability: current,
        scrapCost: durabilityConfig.repairCostScrap,
      };
    }

    this.durability[weaponId] = this.clamp(
      current + durabilityConfig.repairAmount,
      0,
      durabilityConfig.repairCap,
    );
    this.runtime[weaponId].jammed = false;
    this.runtime[weaponId].clearTimer = 0;
    this.save();

    return {
      repaired: true,
      message: `${this.formatWeapon(weaponId)} repaired to ${Math.round(this.durability[weaponId])}%`,
      durability: this.durability[weaponId],
      scrapCost: durabilityConfig.repairCostScrap,
    };
  }

  public getFullRepairCost(weaponId: WeaponId): number {
    const current = this.durability[weaponId];

    if (current >= durabilityConfig.maxDurability) {
      return 0;
    }

    return Math.max(1, Math.ceil((durabilityConfig.maxDurability - current) / 10));
  }

  public repairFullyWithScrap(weaponId: WeaponId, spendScrap: (quantity: number) => boolean): RepairResult {
    const current = this.durability[weaponId];
    const scrapCost = this.getFullRepairCost(weaponId);

    if (scrapCost <= 0) {
      return {
        repaired: false,
        message: `${this.formatWeapon(weaponId)} is already fully repaired`,
        durability: current,
        scrapCost,
      };
    }

    if (!spendScrap(scrapCost)) {
      return {
        repaired: false,
        message: `Need ${scrapCost} scrap to fully repair`,
        durability: current,
        scrapCost,
      };
    }

    this.durability[weaponId] = durabilityConfig.maxDurability;
    this.runtime[weaponId].jammed = false;
    this.runtime[weaponId].clearTimer = 0;
    this.save();

    return {
      repaired: true,
      message: `${this.formatWeapon(weaponId)} repaired to 100%`,
      durability: this.durability[weaponId],
      scrapCost,
    };
  }

  public repairFullyWithKit(weaponId: WeaponId): RepairResult {
    const current = this.durability[weaponId];

    if (current >= durabilityConfig.maxDurability) {
      return {
        repaired: false,
        message: `${this.formatWeapon(weaponId)} is already fully repaired`,
        durability: current,
        scrapCost: 0,
      };
    }

    this.durability[weaponId] = durabilityConfig.maxDurability;
    this.runtime[weaponId].jammed = false;
    this.runtime[weaponId].clearTimer = 0;
    this.save();

    return {
      repaired: true,
      message: `${this.formatWeapon(weaponId)} repaired to 100% with Weapon Repair Kit`,
      durability: this.durability[weaponId],
      scrapCost: 0,
    };
  }

  public getState(weaponId: WeaponId): WeaponDurabilityState {
    const durability = this.durability[weaponId];
    const wear = 1 - durability / durabilityConfig.maxDurability;
    const runtime = this.runtime[weaponId];

    return {
      weaponId,
      durability,
      jammed: runtime.jammed,
      clearingJam: runtime.jammed && runtime.clearTimer > 0,
      clearProgress: runtime.clearTimer / durabilityConfig.clearJamSeconds,
      jamWarning: durability <= durabilityConfig.warningThreshold || runtime.jammed,
      accuracyMultiplier: 1 + wear * 0.7,
      recoilMultiplier: 1 + wear * 0.45,
      adsTransitionMultiplier: 1 - wear * 0.25,
      jamChance: this.calculateJamChance(durability),
    };
  }

  private degrade(weaponId: WeaponId, amount: number): void {
    this.durability[weaponId] = this.clamp(this.durability[weaponId] - amount, 0, 100);
    this.save();
  }

  private calculateJamChance(durability: number): number {
    if (durability >= durabilityConfig.jamThreshold) {
      return 0;
    }

    const normalized = (durabilityConfig.jamThreshold - durability) / durabilityConfig.jamThreshold;
    return normalized * normalized * 0.12;
  }

  private load(): StoredDurability {
    const defaults: StoredDurability = {
      pistol: 100,
      "burst-pistol": 100,
      revolver: 100,
      "compact-smg": 100,
      smg: 100,
      shotgun: 100,
      "assault-rifle": 100,
      rifle: 100,
      knife: 100,
    };
    const stored = window.localStorage.getItem(storageKey);

    if (!stored) {
      return defaults;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<StoredDurability>;
      return {
        pistol: this.clamp(parsed.pistol ?? defaults.pistol, 0, 100),
        "burst-pistol": this.clamp(parsed["burst-pistol"] ?? defaults["burst-pistol"], 0, 100),
        revolver: this.clamp(parsed.revolver ?? defaults.revolver, 0, 100),
        "compact-smg": this.clamp(parsed["compact-smg"] ?? defaults["compact-smg"], 0, 100),
        smg: this.clamp(parsed.smg ?? defaults.smg, 0, 100),
        shotgun: this.clamp(parsed.shotgun ?? defaults.shotgun, 0, 100),
        "assault-rifle": this.clamp(parsed["assault-rifle"] ?? defaults["assault-rifle"], 0, 100),
        rifle: this.clamp(parsed.rifle ?? defaults.rifle, 0, 100),
        knife: this.clamp(parsed.knife ?? defaults.knife, 0, 100),
      };
    } catch {
      return defaults;
    }
  }

  private save(): void {
    window.localStorage.setItem(storageKey, JSON.stringify(this.durability));
  }

  private formatWeapon(weaponId: WeaponId): string {
    return weaponId.charAt(0).toUpperCase() + weaponId.slice(1);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
