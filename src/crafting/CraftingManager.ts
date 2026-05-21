import { getItemDefinition, type LootType } from "../raid/ItemDefinitions";
import type { LootStack } from "../raid/RaidInventory";

export type CraftingRecipeId =
  | "bandage"
  | "ammo-pack"
  | "armor-plate"
  | "anti-toxin"
  | "basic-medkit"
  | "basic-backpack"
  | "basic-grip"
  | "basic-red-dot"
  | "basic-suppressor"
  | "improved-armor-plate"
  | "extended-magazine"
  | "advanced-medkit"
  | "weapon-repair-kit"
  | "rare-upgrade-kit"
  | "elite-backpack"
  | "high-tier-suppressor";

export type CraftingUpgradeId =
  | "backpack-slots"
  | "max-armor"
  | "medkit-efficiency"
  | "reload-speed"
  | "weapon-durability"
  | "raid-bag-capacity-1"
  | "raid-bag-capacity-2"
  | "raid-bag-capacity-3"
  | "armor-durability-1"
  | "armor-durability-2"
  | "armor-durability-3"
  | "medkit-efficiency-1"
  | "medkit-efficiency-2"
  | "medkit-efficiency-3"
  | "sprint-stamina-1"
  | "sprint-stamina-2"
  | "sprint-stamina-3"
  | "reload-speed-1"
  | "reload-speed-2"
  | "reload-speed-3"
  | "weapon-durability-1"
  | "weapon-durability-2"
  | "weapon-durability-3"
  | "tactical-tool-battery-1"
  | "tactical-tool-battery-2"
  | "tactical-tool-battery-3"
  | "contract-reward-bonus-1"
  | "contract-reward-bonus-2"
  | "contract-reward-bonus-3"
  | "vendor-sell-bonus-1"
  | "vendor-sell-bonus-2"
  | "vendor-sell-bonus-3";

export type CraftingRecipe = Readonly<{
  id: CraftingRecipeId;
  name: string;
  outputType: LootType;
  outputQuantity: number;
  scrapCost: number;
  requiredWorkbenchLevel: number;
  description: string;
}>;

export type CraftingUpgrade = Readonly<{
  id: CraftingUpgradeId;
  name: string;
  scrapCost: number;
  description: string;
  family?: string;
  tier?: 1 | 2 | 3;
}>;

export type CraftingResult = Readonly<{
  ok: boolean;
  message: string;
}>;

export type CraftingState = Readonly<{
  crafted: Partial<Record<CraftingRecipeId, number>>;
  scrapSpent: number;
  repairs: {
    weapon: number;
    armor: number;
  };
  upgrades: Record<CraftingUpgradeId, boolean>;
  workbenchLevel: number;
  armorDurability: number;
  lastMessage: string | null;
  warning: string | null;
}>;

export const maxWorkbenchLevel = 5;

export const workbenchUpgradeCosts = {
  2: 25,
  3: 50,
  4: 100,
  5: 200,
} as Record<number, number>;

export const craftingRecipes: CraftingRecipe[] = [
  {
    id: "bandage",
    name: "Bandage",
    outputType: "bandage",
    outputQuantity: 1,
    scrapCost: 1,
    requiredWorkbenchLevel: 1,
    description: "Cheap raid prep for small mistakes.",
  },
  {
    id: "ammo-pack",
    name: "Ammo Pack",
    outputType: "ammo",
    outputQuantity: 24,
    scrapCost: 2,
    requiredWorkbenchLevel: 1,
    description: "A quick mixed-round pack for the next loadout.",
  },
  {
    id: "armor-plate",
    name: "Armor Plate",
    outputType: "armor-plate",
    outputQuantity: 1,
    scrapCost: 4,
    requiredWorkbenchLevel: 1,
    description: "Chunky vest plate for safer pushes.",
  },
  {
    id: "anti-toxin",
    name: "Anti-Toxin",
    outputType: "anti-toxin",
    outputQuantity: 1,
    scrapCost: 3,
    requiredWorkbenchLevel: 1,
    description: "Field counteragent placeholder: 2 alien chitin, 1 infected sample, and 3 Regolith Scrap once material recipes expand.",
  },
  {
    id: "basic-medkit",
    name: "Basic Medkit",
    outputType: "medkit",
    outputQuantity: 1,
    scrapCost: 5,
    requiredWorkbenchLevel: 2,
    description: "Neon root gel and patched straps.",
  },
  {
    id: "basic-backpack",
    name: "Basic Backpack",
    outputType: "backpack-upgrade",
    outputQuantity: 1,
    scrapCost: 8,
    requiredWorkbenchLevel: 2,
    description: "Clip-on pack hardware for more raid capacity.",
  },
  {
    id: "basic-grip",
    name: "Basic Grip",
    outputType: "attachment-vertical-grip",
    outputQuantity: 1,
    scrapCost: 10,
    requiredWorkbenchLevel: 2,
    description: "Starter recoil control for steadier bursts.",
  },
  {
    id: "basic-red-dot",
    name: "Basic Red Dot",
    outputType: "attachment-red-dot",
    outputQuantity: 1,
    scrapCost: 12,
    requiredWorkbenchLevel: 3,
    description: "Clean optic for better target pickup.",
  },
  {
    id: "basic-suppressor",
    name: "Basic Suppressor",
    outputType: "attachment-suppressor",
    outputQuantity: 1,
    scrapCost: 15,
    requiredWorkbenchLevel: 3,
    description: "Quieter muzzle hardware for stealth Crater Runs.",
  },
  {
    id: "improved-armor-plate",
    name: "Improved Armor Plate",
    outputType: "improved-armor-plate",
    outputQuantity: 1,
    scrapCost: 9,
    requiredWorkbenchLevel: 3,
    description: "Reinforced plate for harder objective pushes.",
  },
  {
    id: "extended-magazine",
    name: "Extended Magazine",
    outputType: "attachment-extended-mag",
    outputQuantity: 1,
    scrapCost: 18,
    requiredWorkbenchLevel: 4,
    description: "More rounds before the reload panic hits.",
  },
  {
    id: "advanced-medkit",
    name: "Advanced Medkit",
    outputType: "advanced-medkit",
    outputQuantity: 1,
    scrapCost: 20,
    requiredWorkbenchLevel: 4,
    description: "Better healing kit for deeper Crater Runs.",
  },
  {
    id: "weapon-repair-kit",
    name: "Weapon Repair Kit",
    outputType: "weapon-repair-kit",
    outputQuantity: 1,
    scrapCost: 24,
    requiredWorkbenchLevel: 4,
    description: "Portable maintenance kit for prized weapons.",
  },
  {
    id: "rare-upgrade-kit",
    name: "Rare Upgrade Kit",
    outputType: "rare-upgrade-kit",
    outputQuantity: 1,
    scrapCost: 35,
    requiredWorkbenchLevel: 5,
    description: "Late-tree upgrade kit for serious prep.",
  },
  {
    id: "elite-backpack",
    name: "Elite Backpack",
    outputType: "elite-backpack",
    outputQuantity: 1,
    scrapCost: 45,
    requiredWorkbenchLevel: 5,
    description: "High-capacity loot rig for greedy extractions.",
  },
  {
    id: "high-tier-suppressor",
    name: "High-Tier Suppressor",
    outputType: "high-tier-suppressor",
    outputQuantity: 1,
    scrapCost: 50,
    requiredWorkbenchLevel: 5,
    description: "Premium stealth hardware for low-noise Crater Runs.",
  },
];

export const craftingUpgrades: CraftingUpgrade[] = [
  {
    id: "backpack-slots",
    name: "Backpack Slot Upgrade",
    scrapCost: 20,
    description: "Permanent HQ prep upgrade for future carry tuning.",
  },
  {
    id: "max-armor",
    name: "Max Armor Upgrade",
    scrapCost: 25,
    description: "Improves future armor upgrade hooks.",
  },
  {
    id: "medkit-efficiency",
    name: "Medkit Efficiency Upgrade",
    scrapCost: 30,
    description: "Sets up stronger healing economy later.",
  },
  {
    id: "reload-speed",
    name: "Reload Speed Upgrade",
    scrapCost: 35,
    description: "Fabrication Bench tuning path for faster reload handling.",
  },
  {
    id: "weapon-durability",
    name: "Weapon Durability Upgrade",
    scrapCost: 40,
    description: "Future-proofs better weapon maintenance.",
  },
  ...([
    ["raid-bag-capacity", "EVA Pack Capacity", "Adds permanent EVA Pack prep space."],
    ["armor-durability", "Armor Durability", "Raises armor staying power for harder POI pushes."],
    ["medkit-efficiency", "Medkit Efficiency", "Improves field healing value."],
    ["sprint-stamina", "Sprint Stamina", "Future stamina tuning for longer rotations."],
    ["reload-speed", "Reload Speed", "Improves future weapon handling hooks."],
    ["weapon-durability", "Weapon Durability", "Reduces long-term weapon wear tuning."],
    ["tactical-tool-battery", "Tactical Tool Battery", "Extends flashlight and utility uptime."],
    ["contract-reward-bonus", "Faction Contract Bonus", "Improves future faction contract payouts."],
    ["vendor-sell-bonus", "Vendor Sell Bonus", "Improves future trader sell prices."],
  ] as const).flatMap(([family, label, description]) => ([1, 2, 3] as const).map((tier) => ({
    id: `${family}-${tier}` as CraftingUpgradeId,
    name: `${label} ${tier}`,
    scrapCost: tier === 1 ? 25 : tier === 2 ? 55 : 95,
    description,
    family,
    tier,
  }))),
];

const storageKey = "darc-raiders.crafting.v1";

const defaultUpgrades = Object.fromEntries(
  craftingUpgrades.map((upgrade) => [upgrade.id, false]),
) as Record<CraftingUpgradeId, boolean>;

const defaultState: CraftingState = {
  crafted: {},
  scrapSpent: 0,
  repairs: {
    weapon: 0,
    armor: 0,
  },
  upgrades: defaultUpgrades,
  workbenchLevel: 1,
  armorDurability: 100,
  lastMessage: null,
  warning: null,
};

export class CraftingManager {
  private state: CraftingState = this.load();

  public get snapshot(): CraftingState {
    return {
      ...this.state,
      crafted: { ...this.state.crafted },
      repairs: { ...this.state.repairs },
      upgrades: { ...this.state.upgrades },
    };
  }

  public get nextWorkbenchLevel(): number | null {
    return this.state.workbenchLevel >= maxWorkbenchLevel ? null : this.state.workbenchLevel + 1;
  }

  public getWorkbenchUpgradeCost(): number {
    const nextLevel = this.nextWorkbenchLevel;
    return nextLevel ? workbenchUpgradeCosts[nextLevel] ?? 0 : 0;
  }

  public getRecipe(id: CraftingRecipeId): CraftingRecipe | undefined {
    return craftingRecipes.find((recipe) => recipe.id === id);
  }

  public getUpgrade(id: CraftingUpgradeId): CraftingUpgrade | undefined {
    return craftingUpgrades.find((upgrade) => upgrade.id === id);
  }

  public getUpgradeTier(family: string): number {
    return craftingUpgrades
      .filter((upgrade) => upgrade.family === family && upgrade.tier && this.state.upgrades[upgrade.id])
      .reduce((highest, upgrade) => Math.max(highest, upgrade.tier ?? 0), 0);
  }

  public craft(
    recipeId: CraftingRecipeId,
    spendScrap: (quantity: number) => boolean,
    addToStash: (items: readonly LootStack[]) => void,
  ): CraftingResult {
    const recipe = this.getRecipe(recipeId);

    if (!recipe) {
      return this.fail("Recipe unavailable");
    }

    if (!this.isRecipeUnlocked(recipe)) {
      return this.fail(`${recipe.name} requires Fabrication Level ${recipe.requiredWorkbenchLevel}`);
    }

    if (!spendScrap(recipe.scrapCost)) {
      return this.fail(`Not enough Regolith Scrap for ${recipe.name}`);
    }

    const outputDefinition = getItemDefinition(recipe.outputType);
    addToStash([
      {
        type: recipe.outputType,
        label: outputDefinition.label,
        quantity: recipe.outputQuantity,
      },
    ]);

    this.state = {
      ...this.state,
      crafted: {
        ...this.state.crafted,
        [recipe.id]: (this.state.crafted[recipe.id] ?? 0) + 1,
      },
      scrapSpent: this.state.scrapSpent + recipe.scrapCost,
      lastMessage: `${recipe.name} crafted and added to stash`,
      warning: null,
    };
    this.save();
    return { ok: true, message: this.state.lastMessage ?? "Crafted" };
  }

  public unlockUpgrade(
    upgradeId: CraftingUpgradeId,
    spendScrap: (quantity: number) => boolean,
  ): CraftingResult {
    const upgrade = this.getUpgrade(upgradeId);

    if (!upgrade) {
      return this.fail("Upgrade unavailable");
    }

    if (this.state.upgrades[upgrade.id]) {
      return this.fail(`${upgrade.name} already unlocked`);
    }

    if (upgrade.family && upgrade.tier && upgrade.tier > 1) {
      const previousId = `${upgrade.family}-${upgrade.tier - 1}` as CraftingUpgradeId;

      if (!this.state.upgrades[previousId]) {
        return this.fail(`${upgrade.name} requires ${upgrade.family.replaceAll("-", " ")} ${upgrade.tier - 1}`);
      }
    }

    if (!spendScrap(upgrade.scrapCost)) {
      return this.fail(`Not enough Regolith Scrap for ${upgrade.name}`);
    }

    this.state = {
      ...this.state,
      upgrades: {
        ...this.state.upgrades,
        [upgrade.id]: true,
      },
      scrapSpent: this.state.scrapSpent + upgrade.scrapCost,
      lastMessage: `${upgrade.name} unlocked`,
      warning: null,
    };
    this.save();
    return { ok: true, message: this.state.lastMessage ?? "Upgrade unlocked" };
  }

  public upgradeWorkbench(spendScrap: (quantity: number) => boolean): CraftingResult {
    const nextLevel = this.nextWorkbenchLevel;
    const cost = this.getWorkbenchUpgradeCost();

    if (!nextLevel || cost <= 0) {
      return this.fail("Fabrication Bench is already max level");
    }

    if (!spendScrap(cost)) {
      return this.fail(`Need ${cost} Regolith Scrap to upgrade Fabrication Level ${nextLevel}`);
    }

    this.state = {
      ...this.state,
      workbenchLevel: nextLevel,
      scrapSpent: this.state.scrapSpent + cost,
      lastMessage: `Fabrication Bench upgraded to Level ${nextLevel}`,
      warning: null,
    };
    this.save();
    return { ok: true, message: this.state.lastMessage ?? "Fabrication Bench upgraded" };
  }

  public isRecipeUnlocked(recipe: CraftingRecipe): boolean {
    return this.state.workbenchLevel >= recipe.requiredWorkbenchLevel;
  }

  public getArmorRepairCost(): number {
    if (this.state.armorDurability >= 100) {
      return 0;
    }

    return Math.max(1, Math.ceil((100 - this.state.armorDurability) / 15));
  }

  public repairArmor(spendScrap: (quantity: number) => boolean): CraftingResult {
    const cost = this.getArmorRepairCost();

    if (cost <= 0) {
      return this.fail("Armor is already fully repaired");
    }

    if (!spendScrap(cost)) {
      return this.fail(`Need ${cost} Regolith Scrap to repair armor`);
    }

    this.state = {
      ...this.state,
      armorDurability: 100,
      repairs: {
        ...this.state.repairs,
        armor: this.state.repairs.armor + 1,
      },
      scrapSpent: this.state.scrapSpent + cost,
      lastMessage: "Armor repaired to 100%",
      warning: null,
    };
    this.save();
    return { ok: true, message: this.state.lastMessage ?? "Armor repaired" };
  }

  public recordWeaponRepair(scrapCost: number, message: string): void {
    this.state = {
      ...this.state,
      repairs: {
        ...this.state.repairs,
        weapon: this.state.repairs.weapon + 1,
      },
      scrapSpent: this.state.scrapSpent + Math.max(0, scrapCost),
      lastMessage: message,
      warning: null,
    };
    this.save();
  }

  private fail(message: string): CraftingResult {
    this.state = {
      ...this.state,
      lastMessage: message,
      warning: message,
    };
    this.save();
    return { ok: false, message };
  }

  private load(): CraftingState {
    try {
      const raw = window.localStorage.getItem(storageKey);

      if (!raw) {
        return defaultState;
      }

      return this.sanitize(JSON.parse(raw) as Partial<CraftingState>);
    } catch {
      return defaultState;
    }
  }

  private save(): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(this.state));
    } catch {
      // Crafting progress is best-effort until profile/backend persistence arrives.
    }
  }

  private sanitize(candidate: Partial<CraftingState>): CraftingState {
    return {
      crafted: { ...(candidate.crafted ?? {}) },
      scrapSpent: Math.max(0, candidate.scrapSpent ?? 0),
      repairs: {
        weapon: Math.max(0, candidate.repairs?.weapon ?? 0),
        armor: Math.max(0, candidate.repairs?.armor ?? 0),
      },
      upgrades: {
        ...defaultUpgrades,
        ...(candidate.upgrades ?? {}),
      },
      workbenchLevel: Math.min(maxWorkbenchLevel, Math.max(1, candidate.workbenchLevel ?? 1)),
      armorDurability: Math.min(100, Math.max(0, candidate.armorDurability ?? 100)),
      lastMessage: candidate.lastMessage ?? null,
      warning: candidate.warning ?? null,
    };
  }
}
