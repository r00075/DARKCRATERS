import type { LootStack } from "../raid/RaidInventory";
import type { LootType } from "../raid/ItemDefinitions";

export type ShipModuleSlotId = "cargo" | "hull" | "engine" | "scanner" | "utility";

export type ShipModuleDefinition = Readonly<{
  id: string;
  slot: ShipModuleSlotId;
  name: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  tier: number;
  description: string;
  effect: string;
  cargoCapacityBonus?: number;
  heavyCargoEnabled?: boolean;
  roughRiskReduction?: boolean;
  sealedCargo?: boolean;
  installCost?: Partial<Record<LootType, number>>;
}>;

export type ShipModuleSlotState = Readonly<{
  slot: ShipModuleSlotId;
  installedModuleId: string | null;
  upgradeLevel: number;
}>;

export type ShipModuleState = Readonly<{
  slots: Record<ShipModuleSlotId, ShipModuleSlotState>;
}>;

export type CargoUpgradeResult = Readonly<{
  ok: boolean;
  message: string;
  spent: LootStack[];
}>;

const storageKey = "dark-craters.ship-modules.v1";

export const cargoModuleDefinitions: readonly ShipModuleDefinition[] = [
  {
    id: "basic-cargo-rack",
    slot: "cargo",
    name: "Basic Cargo Rack",
    rarity: "common",
    tier: 1,
    description: "Standard field rack fitted for ordinary return cargo.",
    effect: "Current base cargo capacity.",
    cargoCapacityBonus: 0,
  },
  {
    id: "reinforced-cargo-rack",
    slot: "cargo",
    name: "Reinforced Cargo Rack",
    rarity: "uncommon",
    tier: 2,
    description: "Braced rails that keep routine cargo from shifting after a bad set-down.",
    effect: "+5 cargo capacity. Rough landing risk reads lower.",
    cargoCapacityBonus: 5,
    roughRiskReduction: true,
    installCost: { scrap: 25, "weapon-parts": 2 },
  },
  {
    id: "expanded-cargo-sled",
    slot: "cargo",
    name: "Expanded Cargo Sled",
    rarity: "rare",
    tier: 3,
    description: "A reinforced sled frame for oversized mining returns.",
    effect: "+10 cargo capacity. Heavy cargo transfer enabled.",
    cargoCapacityBonus: 10,
    heavyCargoEnabled: true,
    installCost: { scrap: 50, "weapon-parts": 4, electronics: 1 },
  },
  {
    id: "sealed-cargo-vault",
    slot: "cargo",
    name: "Sealed Cargo Vault",
    rarity: "epic",
    tier: 4,
    description: "Pressure-sealed cargo cells for sensitive cores and survey crates.",
    effect: "+15 cargo capacity. Heavy cargo reads safer after rough or damaged landings.",
    cargoCapacityBonus: 15,
    heavyCargoEnabled: true,
    sealedCargo: true,
    installCost: { scrap: 90, "weapon-parts": 6, electronics: 2, "rare-core": 1 },
  },
  {
    id: "helium-lined-cargo-core",
    slot: "cargo",
    name: "Helium-Lined Cargo Core",
    rarity: "legendary",
    tier: 5,
    description: "Shielded return storage for rare core samples and future protected cargo.",
    effect: "+20 cargo capacity. Future-ready for rare cargo protection.",
    cargoCapacityBonus: 20,
    heavyCargoEnabled: true,
    sealedCargo: true,
    installCost: { scrap: 150, "weapon-parts": 8, electronics: 3, "rare-core": 2 },
  },
] as const;

export const defaultShipModules: readonly ShipModuleDefinition[] = [
  cargoModuleDefinitions[0],
  {
    id: "patchwork-hull-plating",
    slot: "hull",
    name: "Patchwork Hull Plating",
    rarity: "common",
    tier: 1,
    description: "Field-repaired hull panels with basic impact tolerance.",
    effect: "Damage-state UI foundation.",
  },
  {
    id: "standard-launch-thrusters",
    slot: "engine",
    name: "Standard Launch Thrusters",
    rarity: "common",
    tier: 1,
    description: "Factory thrusters with conservative launch timing.",
    effect: "Current launch preparation timing.",
  },
  {
    id: "basic-beacon-receiver",
    slot: "scanner",
    name: "Basic Beacon Receiver",
    rarity: "common",
    tier: 1,
    description: "Keeps the ship and return markers visible on local navigation.",
    effect: "Normal ship marker behavior.",
  },
  {
    id: "empty-utility",
    slot: "utility",
    name: "No Utility Installed",
    rarity: "common",
    tier: 0,
    description: "Open utility slot for a later field module.",
    effect: "No active effect.",
  },
] as const;

export const allShipModuleDefinitions: readonly ShipModuleDefinition[] = [
  ...defaultShipModules.filter((module) => module.slot !== "cargo"),
  ...cargoModuleDefinitions,
] as const;

const slotIds: readonly ShipModuleSlotId[] = ["cargo", "hull", "engine", "scanner", "utility"];

const defaultState = (): ShipModuleState => ({
  slots: {
    cargo: { slot: "cargo", installedModuleId: "basic-cargo-rack", upgradeLevel: 1 },
    hull: { slot: "hull", installedModuleId: "patchwork-hull-plating", upgradeLevel: 1 },
    engine: { slot: "engine", installedModuleId: "standard-launch-thrusters", upgradeLevel: 1 },
    scanner: { slot: "scanner", installedModuleId: "basic-beacon-receiver", upgradeLevel: 1 },
    utility: { slot: "utility", installedModuleId: "empty-utility", upgradeLevel: 0 },
  },
});

export class ShipModuleManager {
  private state: ShipModuleState = this.load();

  public get snapshot(): ShipModuleState {
    return {
      slots: {
        cargo: { ...this.state.slots.cargo },
        hull: { ...this.state.slots.hull },
        engine: { ...this.state.slots.engine },
        scanner: { ...this.state.slots.scanner },
        utility: { ...this.state.slots.utility },
      },
    };
  }

  public get installedModules(): ShipModuleDefinition[] {
    return slotIds.map((slot) => this.getInstalledModule(slot));
  }

  public get cargoModule(): ShipModuleDefinition {
    return this.getInstalledModule("cargo");
  }

  public get cargoTier(): number {
    return this.cargoModule.tier;
  }

  public get cargoCapacityBonus(): number {
    return this.cargoModule.cargoCapacityBonus ?? 0;
  }

  public get heavyCargoEnabled(): boolean {
    return this.cargoTier >= 3 || Boolean(this.cargoModule.heavyCargoEnabled);
  }

  public get nextCargoModule(): ShipModuleDefinition | null {
    return cargoModuleDefinitions.find((module) => module.tier === this.cargoTier + 1) ?? null;
  }

  public upgradeCargoModule(
    spendMaterials: (cost: Partial<Record<LootType, number>>) => boolean,
  ): CargoUpgradeResult {
    const next = this.nextCargoModule;

    if (!next) {
      return { ok: false, message: "Cargo module already at max tier", spent: [] };
    }

    const cost = next.installCost ?? {};
    if (!spendMaterials(cost)) {
      return { ok: false, message: "Missing module materials", spent: [] };
    }

    this.state = {
      slots: {
        ...this.state.slots,
        cargo: {
          slot: "cargo",
          installedModuleId: next.id,
          upgradeLevel: next.tier,
        },
      },
    };
    this.save();

    return {
      ok: true,
      message: `${next.name} installed`,
      spent: Object.entries(cost).map(([type, quantity]) => ({
        type: type as LootType,
        label: type,
        quantity: quantity ?? 0,
      })),
    };
  }

  public resetToDefaults(): void {
    this.state = defaultState();
    this.save();
  }

  public getInstalledModule(slot: ShipModuleSlotId): ShipModuleDefinition {
    const installedId = this.state.slots[slot]?.installedModuleId;
    return allShipModuleDefinitions.find((module) => module.id === installedId && module.slot === slot)
      ?? defaultShipModules.find((module) => module.slot === slot)
      ?? defaultShipModules[0];
  }

  private load(): ShipModuleState {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return defaultState();
      }

      return this.sanitize(JSON.parse(raw) as Partial<ShipModuleState>);
    } catch (error) {
      console.warn("Ship module state failed to load; using defaults.", error);
      return defaultState();
    }
  }

  private sanitize(candidate: Partial<ShipModuleState>): ShipModuleState {
    const fallback = defaultState();
    const slots = { ...fallback.slots };

    for (const slot of slotIds) {
      const incoming = candidate.slots?.[slot];
      const module = allShipModuleDefinitions.find((definition) => definition.id === incoming?.installedModuleId && definition.slot === slot);
      slots[slot] = {
        slot,
        installedModuleId: module?.id ?? fallback.slots[slot].installedModuleId,
        upgradeLevel: module?.tier ?? fallback.slots[slot].upgradeLevel,
      };
    }

    return { slots };
  }

  private save(): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn("Ship module state could not be saved.", error);
    }
  }
}
