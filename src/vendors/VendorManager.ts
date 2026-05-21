import { getItemDefinition, itemDefinitions, type LootType } from "../raid/ItemDefinitions";
import type { LootStack } from "../raid/RaidInventory";

export type VendorId = "mechanic" | "medic" | "broker" | "scrapper" | "stylist";
export type VendorTab = "buy" | "sell" | "repair";

export type VendorDefinition = Readonly<{
  id: VendorId;
  name: string;
  tagline: string;
  specialty: string;
  faction: string;
  accentPrimary: string;
  accentSecondary: string;
  buys: readonly LootType[];
  inventory: readonly VendorInventoryItem[];
}>;

export type VendorInventoryItem = Readonly<{
  type: LootType;
  price: number;
  minReputationLevel: number;
}>;

export type VendorState = Readonly<{
  credits: number;
  selectedVendorId: VendorId;
  selectedTab: VendorTab;
  reputation: Record<VendorId, number>;
  contractsCompleted: Record<VendorId, number>;
  purchases: Partial<Record<LootType, number>>;
  sold: Partial<Record<LootType, number>>;
}>;

export type VendorTransactionResult = Readonly<{
  ok: boolean;
  message: string;
}>;

const storageKey = "darc-raiders.vendor-economy.v1";
const defaultCredits = 120;
const reputationPerLevel = 100;

export const vendorDefinitions: Record<VendorId, VendorDefinition> = {
  mechanic: {
    id: "mechanic",
    name: "L.E.A.",
    tagline: "Earth depends on output.",
    specialty: "Official starter contracts, oxygen supplies, mining objectives, basic weapons, and Authority repairs.",
    faction: "Lunar Extraction Authority",
    accentPrimary: "#2F8CFF",
    accentSecondary: "#DDEBFF",
    buys: [
      "weapon-pistol",
      "weapon-burst-pistol",
      "weapon-revolver",
      "weapon-compact-smg",
      "weapon-smg",
      "weapon-shotgun",
      "weapon-assault-rifle",
      "weapon-rifle",
      "attachment-red-dot",
      "attachment-compensator",
      "attachment-suppressor",
      "attachment-extended-mag",
      "attachment-vertical-grip",
      "attachment-angled-grip",
      "attachment-thermal-optic",
      "weapon-parts",
      "scrap",
    ],
    inventory: [
      { type: "weapon-pistol", price: 95, minReputationLevel: 1 },
      { type: "weapon-burst-pistol", price: 150, minReputationLevel: 1 },
      { type: "weapon-revolver", price: 175, minReputationLevel: 2 },
      { type: "battery", price: 26, minReputationLevel: 1 },
      { type: "anti-toxin", price: 85, minReputationLevel: 1 },
      { type: "ammo", price: 18, minReputationLevel: 1 },
      { type: "armor-light", price: 115, minReputationLevel: 1 },
      { type: "weapon-parts", price: 24, minReputationLevel: 1 },
      { type: "attachment-red-dot", price: 110, minReputationLevel: 2 },
      { type: "attachment-compensator", price: 130, minReputationLevel: 2 },
      { type: "weapon-smg", price: 260, minReputationLevel: 3 },
      { type: "weapon-compact-smg", price: 310, minReputationLevel: 3 },
      { type: "weapon-assault-rifle", price: 360, minReputationLevel: 3 },
      { type: "weapon-rifle", price: 620, minReputationLevel: 4 },
    ],
  },
  medic: {
    id: "medic",
    name: "Free Orbit Security",
    tagline: "No atmosphere. No witnesses.",
    specialty: "Heavy weapons, tactical armor, combat contracts, trauma supplies, and security-grade plates.",
    faction: "Free Orbit Security",
    accentPrimary: "#7F8A96",
    accentSecondary: "#FF3347",
    buys: ["cloth", "alien-chitin", "infected-sample", "medkit", "bandage", "armor-plate", "improved-armor-plate", "anti-toxin"],
    inventory: [
      { type: "bandage", price: 18, minReputationLevel: 1 },
      { type: "medkit", price: 55, minReputationLevel: 1 },
      { type: "anti-toxin", price: 95, minReputationLevel: 1 },
      { type: "armor-plate", price: 70, minReputationLevel: 2 },
      { type: "improved-armor-plate", price: 118, minReputationLevel: 3 },
      { type: "weapon-shotgun", price: 290, minReputationLevel: 3 },
      { type: "cloth", price: 12, minReputationLevel: 2 },
    ],
  },
  broker: {
    id: "broker",
    name: "Helios Dynamics",
    tagline: "Powering tomorrow, whatever it costs.",
    specialty: "Advanced weapons, energy gear, black box data, Helium-3 rights, and morally gray mining tech.",
    faction: "Helios Dynamics",
    accentPrimary: "#FFB02E",
    accentSecondary: "#FFE0A3",
    buys: ["rare-core", "horror-core", "dog-tag", "encrypted-data", "target-token", "electronics"],
    inventory: [
      { type: "weapon-assault-rifle", price: 420, minReputationLevel: 2 },
      { type: "electronics", price: 88, minReputationLevel: 2 },
      { type: "encrypted-data", price: 180, minReputationLevel: 2 },
      { type: "target-token", price: 220, minReputationLevel: 3 },
      { type: "rare-core", price: 520, minReputationLevel: 5 },
    ],
  },
  scrapper: {
    id: "scrapper",
    name: "Crater Rats",
    tagline: "If it ain't bolted down, it's oxygen money.",
    specialty: "Black market goods, EVA pack upgrades, hidden extraction tools, survival items, and salvage conversion.",
    faction: "Crater Rats",
    accentPrimary: "#D66A2A",
    accentSecondary: "#B8A078",
    buys: ["scrap", "cloth", "alien-chitin", "ammo", "battery", "weapon-parts"],
    inventory: [
      { type: "scrap", price: 8, minReputationLevel: 1 },
      { type: "cloth", price: 10, minReputationLevel: 1 },
      { type: "ammo", price: 16, minReputationLevel: 1 },
      { type: "battery", price: 22, minReputationLevel: 2 },
      { type: "anti-toxin", price: 72, minReputationLevel: 2 },
      { type: "backpack-upgrade", price: 180, minReputationLevel: 2 },
      { type: "weapon-parts", price: 42, minReputationLevel: 3 },
    ],
  },
  stylist: {
    id: "stylist",
    name: "The Quiet Order",
    tagline: "The Moon remembers impact.",
    specialty: "Alien artifact research, scanner upgrades, signal shards, alien-material upgrades, and lore-heavy unlocks.",
    faction: "The Quiet Order",
    accentPrimary: "#7A4DFF",
    accentSecondary: "#72FF9D",
    buys: ["elite-backpack", "rare-upgrade-kit", "rare-core", "horror-core", "acid-gland", "crater-tissue", "infected-sample", "dog-tag", "scrap", "cloth", "target-token"],
    inventory: [
      { type: "elite-backpack", price: 520, minReputationLevel: 3 },
      { type: "anti-toxin", price: 130, minReputationLevel: 2 },
      { type: "rare-upgrade-kit", price: 420, minReputationLevel: 3 },
      { type: "attachment-thermal-optic", price: 680, minReputationLevel: 4 },
      { type: "rare-core", price: 900, minReputationLevel: 5 },
    ],
  },
};

const defaultState: VendorState = {
  credits: defaultCredits,
  selectedVendorId: "mechanic",
  selectedTab: "buy",
  reputation: {
    mechanic: 0,
    medic: 0,
    broker: 0,
    scrapper: 0,
    stylist: 0,
  },
  contractsCompleted: {
    mechanic: 0,
    medic: 0,
    broker: 0,
    scrapper: 0,
    stylist: 0,
  },
  purchases: {},
  sold: {},
};

const isLootType = (type: unknown): type is LootType =>
  typeof type === "string" && type in itemDefinitions;
const isVendorId = (id: unknown): id is VendorId =>
  typeof id === "string" && id in vendorDefinitions;
const isVendorTab = (tab: unknown): tab is VendorTab =>
  tab === "buy" || tab === "sell" || tab === "repair";

export class VendorManager {
  private state: VendorState = this.load();

  public get snapshot(): VendorState {
    return {
      ...this.state,
      reputation: { ...this.state.reputation },
      contractsCompleted: { ...this.state.contractsCompleted },
      purchases: { ...this.state.purchases },
      sold: { ...this.state.sold },
    };
  }

  public get selectedVendor(): VendorDefinition {
    return vendorDefinitions[this.state.selectedVendorId];
  }

  public setVendor(vendorId: VendorId): void {
    this.state = { ...this.state, selectedVendorId: vendorId };
    this.save();
  }

  public setTab(tab: VendorTab): void {
    this.state = { ...this.state, selectedTab: tab };
    this.save();
  }

  public reputationLevel(vendorId: VendorId): number {
    return Math.max(1, 1 + Math.floor(this.state.reputation[vendorId] / reputationPerLevel));
  }

  public reputationProgress(vendorId: VendorId): number {
    return (this.state.reputation[vendorId] % reputationPerLevel) / reputationPerLevel;
  }

  public availableInventory(vendorId = this.state.selectedVendorId): VendorInventoryItem[] {
    const level = this.reputationLevel(vendorId);
    return vendorDefinitions[vendorId].inventory.filter((item) => item.minReputationLevel <= level);
  }

  public lockedInventory(vendorId = this.state.selectedVendorId): VendorInventoryItem[] {
    const level = this.reputationLevel(vendorId);
    return vendorDefinitions[vendorId].inventory.filter((item) => item.minReputationLevel > level);
  }

  public buy(type: LootType, addToStash: (items: readonly LootStack[]) => void): VendorTransactionResult {
    const vendor = this.selectedVendor;
    const listing = this.availableInventory(vendor.id).find((item) => item.type === type);

    if (!listing) {
      return { ok: false, message: "Item is not available yet" };
    }

    if (this.state.credits < listing.price) {
      return { ok: false, message: "Not enough credits" };
    }

    this.state = {
      ...this.state,
      credits: this.state.credits - listing.price,
      purchases: {
        ...this.state.purchases,
        [type]: (this.state.purchases[type] ?? 0) + 1,
      },
    };
    this.addReputation(vendor.id, Math.max(4, Math.round(listing.price * 0.06)));
    addToStash([{ type, label: getItemDefinition(type).label, quantity: 1 }]);
    this.save();
    return { ok: true, message: `Bought ${getItemDefinition(type).label}` };
  }

  public sell(type: LootType, removeFromStash: (type: LootType, quantity: number) => boolean): VendorTransactionResult {
    const vendor = this.selectedVendor;

    if (!vendor.buys.includes(type)) {
      return { ok: false, message: `${vendor.name} does not buy that` };
    }

    if (!removeFromStash(type, 1)) {
      return { ok: false, message: "Nothing to sell" };
    }

    const value = this.sellValue(type);
    this.state = {
      ...this.state,
      credits: this.state.credits + value,
      sold: {
        ...this.state.sold,
        [type]: (this.state.sold[type] ?? 0) + 1,
      },
    };
    this.addReputation(vendor.id, Math.max(3, Math.round(value * 0.18)));
    this.save();
    return { ok: true, message: `Sold ${getItemDefinition(type).label} for ${value} credits` };
  }

  public spendCredits(quantity: number): boolean {
    if (this.state.credits < quantity) {
      return false;
    }

    this.state = {
      ...this.state,
      credits: this.state.credits - quantity,
    };
    this.addReputation("mechanic", Math.max(3, Math.round(quantity * 0.15)));
    this.save();
    return true;
  }

  public awardCredits(quantity: number): void {
    const amount = Math.max(0, Math.floor(quantity));

    if (amount <= 0) {
      return;
    }

    this.state = {
      ...this.state,
      credits: this.state.credits + amount,
    };
    this.save();
  }

  public awardReputation(vendorId: VendorId, quantity: number): void {
    const amount = Math.max(0, Math.floor(quantity));

    if (amount <= 0) {
      return;
    }

    this.addReputation(vendorId, amount);
    this.save();
  }

  public recordContractClaim(contractId: string, vendorId: VendorId): void {
    const previous = this.state.contractsCompleted[vendorId] ?? 0;
    const next = previous + 1;
    this.state = {
      ...this.state,
      contractsCompleted: {
        ...this.state.contractsCompleted,
        [vendorId]: next,
      },
    };
    console.info("[VendorManager] Contract counter incremented", {
      contractId,
      faction: vendorId,
      previousCount: previous,
      newCount: next,
      claimed: true,
    });
    this.save();
  }

  public convertCommonToScrap(
    stashItems: readonly LootStack[],
    removeFromStash: (type: LootType, quantity: number) => boolean,
    addToStash: (items: readonly LootStack[]) => void,
  ): VendorTransactionResult {
    const candidate = stashItems.find((item) => item.quantity > 0 && ["cloth", "ammo", "battery"].includes(item.type));

    if (!candidate) {
      return { ok: false, message: "No common material to convert" };
    }

    if (!removeFromStash(candidate.type, 1)) {
      return { ok: false, message: "Conversion failed" };
    }

    addToStash([{ type: "scrap", label: getItemDefinition("scrap").label, quantity: 2 }]);
    this.addReputation("scrapper", 6);
    this.save();
    return { ok: true, message: `Converted ${candidate.label} into scrap` };
  }

  public recordExtraction(completedObjective: boolean): void {
    this.addReputation("scrapper", 4);
    this.addReputation("medic", 2);

    if (completedObjective) {
      this.addReputation("broker", 16);
      this.addReputation("mechanic", 4);
    }

    this.save();
  }

  public repairCost(currentDurability: number): number {
    if (currentDurability >= 92) {
      return 0;
    }

    const discount = Math.min(0.3, (this.reputationLevel("mechanic") - 1) * 0.06);
    return Math.max(18, Math.round((110 - currentDurability) * 0.9 * (1 - discount)));
  }

  public sellValue(type: LootType): number {
    const definition = getItemDefinition(type);
    const rarityBaseValue = {
      common: 10,
      uncommon: 25,
      rare: 75,
      epic: 150,
      legendary: 300,
      core: 550,
    }[definition.rarity];
    const itemValue = Math.round(definition.value * rarityBaseValue);
    return Math.max(rarityBaseValue, itemValue);
  }

  private addReputation(vendorId: VendorId, amount: number): void {
    this.state = {
      ...this.state,
      reputation: {
        ...this.state.reputation,
        [vendorId]: this.state.reputation[vendorId] + amount,
      },
    };
  }

  private load(): VendorState {
    try {
      const raw = window.localStorage.getItem(storageKey);

      if (!raw) {
        return defaultState;
      }

      return this.sanitizeState(JSON.parse(raw) as Partial<VendorState>);
    } catch (error) {
      console.warn("Vendor economy failed to load; using starter economy.", error);
      return defaultState;
    }
  }

  private sanitizeState(candidate: Partial<VendorState>): VendorState {
    const purchases: Partial<Record<LootType, number>> = {};
    const sold: Partial<Record<LootType, number>> = {};

    for (const [type, quantity] of Object.entries(candidate.purchases ?? {})) {
      if (isLootType(type) && Number.isFinite(quantity) && quantity > 0) {
        purchases[type] = Math.floor(quantity);
      }
    }

    for (const [type, quantity] of Object.entries(candidate.sold ?? {})) {
      if (isLootType(type) && Number.isFinite(quantity) && quantity > 0) {
        sold[type] = Math.floor(quantity);
      }
    }

    return {
      credits: Number.isFinite(candidate.credits) ? Math.max(0, Math.floor(candidate.credits ?? defaultCredits)) : defaultCredits,
      selectedVendorId: isVendorId(candidate.selectedVendorId) ? candidate.selectedVendorId : defaultState.selectedVendorId,
      selectedTab: isVendorTab(candidate.selectedTab) ? candidate.selectedTab : defaultState.selectedTab,
      reputation: {
        mechanic: this.safeReputation(candidate.reputation?.mechanic),
        medic: this.safeReputation(candidate.reputation?.medic),
        broker: this.safeReputation(candidate.reputation?.broker),
        scrapper: this.safeReputation(candidate.reputation?.scrapper),
        stylist: this.safeReputation(candidate.reputation?.stylist),
      },
      contractsCompleted: {
        mechanic: this.safeReputation(candidate.contractsCompleted?.mechanic),
        medic: this.safeReputation(candidate.contractsCompleted?.medic),
        broker: this.safeReputation(candidate.contractsCompleted?.broker),
        scrapper: this.safeReputation(candidate.contractsCompleted?.scrapper),
        stylist: this.safeReputation(candidate.contractsCompleted?.stylist),
      },
      purchases,
      sold,
    };
  }

  private safeReputation(value: unknown): number {
    return Number.isFinite(value) ? Math.max(0, Math.floor(value as number)) : 0;
  }

  private save(): void {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn("Vendor economy could not be saved.", error);
    }
  }
}
