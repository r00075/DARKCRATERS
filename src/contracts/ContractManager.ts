import type { EnemyType } from "../ai/EnemyTypes";
import type { POIObjectiveEvent, POIObjectiveType } from "../raid/POIObjectiveManager";
import type { LootStack, LootType } from "../raid/RaidInventory";
import type { VendorId } from "../vendors/VendorManager";
import { poiDefinitions } from "../world/MapLayout";

export type ContractType =
  | "poi-objective"
  | "extraction"
  | "scavenger"
  | "combat"
  | "stealth"
  | "vendor";

export type ContractDifficulty = "easy" | "medium" | "hard";
export type ContractRisk = "Low" | "Medium" | "High" | "Critical";
export type ContractStatus = "available" | "active" | "ready-to-claim" | "completed" | "failed";
export type ContractRewardTier = "basic" | "standard" | "high-risk" | "elite";

export type ContractReward = Readonly<{
  credits: number;
  xp: number;
  scrap: number;
  weaponParts: number;
  vendorReputation: Partial<Record<VendorId, number>>;
  rareCoreChance: number;
  recipeUnlock?: string;
  tier?: ContractRewardTier;
  contractPoints?: number;
  reputationTokens?: number;
  rareCrateChance?: number;
}>;

export type ContractDefinition = Readonly<{
  id: string;
  type: ContractType;
  title: string;
  description: string;
  factionId?: "lea" | "helios" | "craterRats" | "quietOrder" | "freeOrbit";
  zoneId?: string;
  recommendedTier?: string;
  difficulty: ContractDifficulty;
  targetPoi: string;
  risk: ContractRisk;
  requiresExtraction: boolean;
  target: {
    poiObjectiveType?: POIObjectiveType;
    extractionZoneId?: string;
    lootType?: LootType;
    lootQuantity?: number;
    enemyType?: EnemyType;
    enemyQuantity?: number;
    vendorId?: VendorId;
  };
  reward: ContractReward;
}>;

export type ActiveContractState = Readonly<{
  definition: ContractDefinition;
  status: ContractStatus;
  progress: number;
  goal: number;
  extractToClaim: boolean;
  failedReason: string | null;
}>;

export type ContractState = Readonly<{
  available: ContractDefinition[];
  active: ActiveContractState | null;
  completedIds: string[];
  history: ContractHistoryEntry[];
  refreshCount: number;
  contractPoints: number;
  reputationTokens: number;
}>;

export type ContractRewardGrant = Readonly<{
  contractId: string;
  title: string;
  reward: ContractReward;
}>;

export type ContractHistoryEntry = Readonly<{
  contractId: string;
  title: string;
  tier: ContractRewardTier;
  claimedAt: number;
}>;

export type ContractEvent =
  | Readonly<{ type: "enemy-killed"; enemyType: EnemyType }>
  | Readonly<{ type: "item-looted"; lootType: LootType; quantity: number }>
  | Readonly<{ type: "poi-objective-completed"; event: POIObjectiveEvent; objectiveType?: POIObjectiveType; poiId?: string }>
  | Readonly<{ type: "extraction-started"; zoneId: string | null }>
  | Readonly<{ type: "extraction-completed"; zoneId: string | null; extractedItems: readonly LootStack[] }>
  | Readonly<{ type: "player-death" }>
  | Readonly<{ type: "alert-triggered" }>
  | Readonly<{ type: "vendor-turn-in"; vendorId: VendorId; lootType: LootType; quantity: number }>;

const storageKey = "darc-raiders.contracts.v2";

const contractPool: readonly ContractDefinition[] = [
  {
    id: "dark-cold-start",
    type: "poi-objective",
    title: "Cold Start",
    description: "Tycho Scar beacon T-19 went dark after logging movement beneath the drill bed. Restart it, recover the data, and get out before the crater answers.",
    factionId: "lea",
    zoneId: "tycho-scar",
    recommendedTier: "Survey Run",
    difficulty: "easy",
    targetPoi: "Tycho Scar",
    risk: "Low",
    requiresExtraction: true,
    target: { poiObjectiveType: "restore-power" },
    reward: {
      credits: 110,
      xp: 60,
      scrap: 6,
      weaponParts: 1,
      vendorReputation: { mechanic: 16 },
      rareCoreChance: 0.02,
      tier: "basic",
    },
  },
  {
    id: "dark-no-suit-no-body",
    type: "scavenger",
    title: "No Suit, No Body",
    description: "Free Orbit Security wants missing contractor faction tags recovered from the crater field.",
    factionId: "freeOrbit",
    zoneId: "tycho-scar",
    recommendedTier: "Survey Run",
    difficulty: "easy",
    targetPoi: "Tycho Scar",
    risk: "Medium",
    requiresExtraction: true,
    target: { lootType: "dog-tag", lootQuantity: 1 },
    reward: {
      credits: 135,
      xp: 75,
      scrap: 5,
      weaponParts: 1,
      vendorReputation: { medic: 12, broker: 8 },
      rareCoreChance: 0.03,
      tier: "standard",
    },
  },
  {
    id: "dark-dust-claim",
    type: "scavenger",
    title: "Dust Claim",
    description: "Scan and extract Helium-3 canisters from shallow lunar deposits before rival crews arrive.",
    factionId: "lea",
    zoneId: "tycho-scar",
    recommendedTier: "Survey Run",
    difficulty: "medium",
    targetPoi: "Tycho Scar",
    risk: "Medium",
    requiresExtraction: true,
    target: { lootType: "rare-core", lootQuantity: 1 },
    reward: {
      credits: 170,
      xp: 95,
      scrap: 8,
      weaponParts: 1,
      vendorReputation: { broker: 16, scrapper: 8 },
      rareCoreChance: 0.08,
      tier: "standard",
      contractPoints: 2,
    },
  },
  {
    id: "dark-signal-in-stone",
    type: "stealth",
    title: "Signal in the Stone",
    description: "The Quiet Order detected an Umbra pulse beneath Mare Vanta. Investigate without triggering a full alert.",
    factionId: "quietOrder",
    zoneId: "mare-vanta",
    recommendedTier: "Blackout Zone",
    difficulty: "hard",
    targetPoi: "Mare Vanta",
    risk: "Critical",
    requiresExtraction: true,
    target: { poiObjectiveType: "hack-signal-box" },
    reward: {
      credits: 260,
      xp: 150,
      scrap: 10,
      weaponParts: 3,
      vendorReputation: { stylist: 34, broker: 10 },
      rareCoreChance: 0.16,
      recipeUnlock: "Umbra Signal Scanner",
      tier: "elite",
      contractPoints: 4,
      reputationTokens: 1,
    },
  },
  {
    id: "dark-corporate-salvage",
    type: "scavenger",
    title: "Corporate Salvage",
    description: "Helios Dynamics wants black box data from a destroyed drill rig in Aristarchus Redline.",
    difficulty: "medium",
    targetPoi: "Aristarchus Redline",
    risk: "High",
    requiresExtraction: true,
    target: { lootType: "encrypted-data", lootQuantity: 1 },
    reward: {
      credits: 210,
      xp: 120,
      scrap: 7,
      weaponParts: 3,
      vendorReputation: { broker: 26, mechanic: 8 },
      rareCoreChance: 0.1,
      tier: "high-risk",
      contractPoints: 3,
    },
  },
  {
    id: "dark-rat-route",
    type: "poi-objective",
    title: "Rat Route",
    description: "Crater Rats hid an extraction relay in the Hollow Sea. Bring it online and get out clean.",
    difficulty: "medium",
    targetPoi: "The Hollow Sea",
    risk: "High",
    requiresExtraction: true,
    target: { poiObjectiveType: "restore-power" },
    reward: {
      credits: 190,
      xp: 115,
      scrap: 12,
      weaponParts: 2,
      vendorReputation: { scrapper: 30 },
      rareCoreChance: 0.09,
      tier: "high-risk",
      contractPoints: 3,
    },
  },
  {
    id: "dark-hollow-choir",
    type: "poi-objective",
    title: "The Hollow Choir",
    description: "Destroy alien Choir Nodes before they black out the HUD and pull the Umbra into the lava tubes.",
    difficulty: "hard",
    targetPoi: "The Hollow Sea",
    risk: "Critical",
    requiresExtraction: true,
    target: { poiObjectiveType: "clear-enemy-patrol" },
    reward: {
      credits: 340,
      xp: 190,
      scrap: 16,
      weaponParts: 5,
      vendorReputation: { stylist: 28, medic: 14 },
      rareCoreChance: 0.22,
      recipeUnlock: "Choir Dampener",
      tier: "elite",
      contractPoints: 4,
      reputationTokens: 1,
    },
  },
  {
    id: "dark-extinction-dig",
    type: "scavenger",
    title: "Extinction Dig",
    description: "Retrieve a restricted alien artifact from The Black Basin. The crater will not stay quiet.",
    difficulty: "hard",
    targetPoi: "The Black Basin",
    risk: "Critical",
    requiresExtraction: true,
    target: { lootType: "target-token", lootQuantity: 1 },
    reward: {
      credits: 420,
      xp: 240,
      scrap: 20,
      weaponParts: 6,
      vendorReputation: { broker: 26, stylist: 26 },
      rareCoreChance: 0.28,
      recipeUnlock: "Alien-Material Upgrade",
      tier: "elite",
      contractPoints: 5,
      reputationTokens: 2,
      rareCrateChance: 0.2,
    },
  },
  {
    id: "poi-cache-drop-yard",
    type: "poi-objective",
    title: "Drop Yard Lockup",
    description: "Complete a Secure Cache objective and extract to claim the Helios payout.",
    difficulty: "medium",
    targetPoi: "Tycho Scar",
    risk: "High",
    requiresExtraction: true,
    target: { poiObjectiveType: "secure-cache" },
    reward: {
      credits: 140,
      xp: 80,
      scrap: 8,
      weaponParts: 2,
      vendorReputation: { broker: 18, scrapper: 6 },
      rareCoreChance: 0.08,
    },
  },
  {
    id: "poi-power-raid-gate",
    type: "poi-objective",
    title: "Redline Reboot",
    description: "Restore power at a POI objective. Expect the noise to pull attention.",
    difficulty: "easy",
    targetPoi: "Aristarchus Redline",
    risk: "Medium",
    requiresExtraction: false,
    target: { poiObjectiveType: "restore-power" },
    reward: {
      credits: 90,
      xp: 55,
      scrap: 6,
      weaponParts: 1,
      vendorReputation: { mechanic: 10, broker: 8 },
      rareCoreChance: 0.03,
    },
  },
  {
    id: "poi-signal-shack-hack",
    type: "stealth",
    title: "Quiet Signal Spike",
    description: "Hack a Signal Box without triggering a full alert, then extract to cash out.",
    difficulty: "hard",
    targetPoi: "Mare Vanta",
    risk: "Critical",
    requiresExtraction: true,
    target: { poiObjectiveType: "hack-signal-box" },
    reward: {
      credits: 220,
      xp: 130,
      scrap: 10,
      weaponParts: 3,
      vendorReputation: { broker: 28, mechanic: 8 },
      rareCoreChance: 0.16,
      recipeUnlock: "Suppressed Intel Mod",
    },
  },
  {
    id: "poi-clear-core-pit",
    type: "poi-objective",
    title: "Black Basin Sweep",
    description: "Clear an enemy patrol at a POI objective. Better loot usually bites back.",
    difficulty: "hard",
    targetPoi: "The Black Basin",
    risk: "Critical",
    requiresExtraction: true,
    target: { poiObjectiveType: "clear-enemy-patrol" },
    reward: {
      credits: 260,
      xp: 150,
      scrap: 14,
      weaponParts: 4,
      vendorReputation: { broker: 24, mechanic: 14 },
      rareCoreChance: 0.22,
    },
  },
  {
    id: "extract-ridge-rare",
    type: "extraction",
    title: "Ridge Beam Payday",
    description: "Extract through the Ridge beam. Bonus condition: carry rare or better loot.",
    difficulty: "medium",
    targetPoi: "Ridge Extract",
    risk: "Medium",
    requiresExtraction: true,
    target: { extractionZoneId: "ridge-extract" },
    reward: {
      credits: 160,
      xp: 85,
      scrap: 6,
      weaponParts: 1,
      vendorReputation: { broker: 14, scrapper: 8 },
      rareCoreChance: 0.08,
    },
  },
  {
    id: "extract-service-road",
    type: "extraction",
    title: "Service Road Runner",
    description: "Extract through the Service Road ascender with your EVA Pack intact.",
    difficulty: "easy",
    targetPoi: "Service Road Extract",
    risk: "Low",
    requiresExtraction: true,
    target: { extractionZoneId: "service-road-extract" },
    reward: {
      credits: 105,
      xp: 60,
      scrap: 5,
      weaponParts: 0,
      vendorReputation: { scrapper: 10 },
      rareCoreChance: 0.02,
    },
  },
  {
    id: "scav-scrap-run",
    type: "scavenger",
    title: "Crater Rat Supply Run",
    description: "Extract with 12 Regolith Scrap. Junk still matters when the Fabrication Bench is hungry.",
    difficulty: "easy",
    targetPoi: "Any POI",
    risk: "Low",
    requiresExtraction: true,
    target: { lootType: "scrap", lootQuantity: 12 },
    reward: {
      credits: 85,
      xp: 50,
      scrap: 4,
      weaponParts: 0,
      vendorReputation: { scrapper: 18 },
      rareCoreChance: 0.01,
    },
  },
  {
    id: "scav-battery-signal",
    type: "scavenger",
    title: "Battery Grab",
    description: "Extract with 3 batteries for future visibility tech.",
    difficulty: "medium",
    targetPoi: "Mare Vanta",
    risk: "Medium",
    requiresExtraction: true,
    target: { lootType: "battery", lootQuantity: 3 },
    reward: {
      credits: 120,
      xp: 70,
      scrap: 4,
      weaponParts: 1,
      vendorReputation: { mechanic: 8, scrapper: 12 },
      rareCoreChance: 0.04,
    },
  },
  {
    id: "scav-electronics-shack",
    type: "scavenger",
    title: "Circuit Sweep",
    description: "Extract with 4 electronics from corrupted tech caches.",
    difficulty: "medium",
    targetPoi: "Mare Vanta",
    risk: "Medium",
    requiresExtraction: true,
    target: { lootType: "electronics", lootQuantity: 4 },
    reward: {
      credits: 150,
      xp: 85,
      scrap: 5,
      weaponParts: 2,
      vendorReputation: { mechanic: 14, broker: 8 },
      rareCoreChance: 0.06,
    },
  },
  {
    id: "scav-core-fragment",
    type: "scavenger",
    title: "Hot Core Delivery",
    description: "Extract with a Helium-3 Canister. Everyone wants it. That is the problem.",
    difficulty: "hard",
    targetPoi: "The Black Basin",
    risk: "Critical",
    requiresExtraction: true,
    target: { lootType: "rare-core", lootQuantity: 1 },
    reward: {
      credits: 300,
      xp: 175,
      scrap: 18,
      weaponParts: 5,
      vendorReputation: { broker: 34 },
      rareCoreChance: 0.18,
    },
  },
  {
    id: "combat-scraplings",
    type: "combat",
    title: "Tick Sweep",
    description: "Eliminate 3 Lunar Ticks before extracting. L.E.A. treats Lunar Infection as a field hazard, not a mystery.",
    difficulty: "easy",
    targetPoi: "Outer POIs",
    risk: "Medium",
    requiresExtraction: false,
    target: { enemyType: "grunt", enemyQuantity: 3 },
    reward: {
      credits: 95,
      xp: 65,
      scrap: 6,
      weaponParts: 1,
      vendorReputation: { mechanic: 8, scrapper: 8 },
      rareCoreChance: 0.02,
    },
  },
  {
    id: "combat-root-rotters",
    type: "combat",
    title: "Burrower Repellent",
    description: "Eliminate 2 Burrowers. They rush. You prepare.",
    difficulty: "medium",
    targetPoi: "Mid POIs",
    risk: "High",
    requiresExtraction: false,
    target: { enemyType: "charger", enemyQuantity: 2 },
    reward: {
      credits: 145,
      xp: 90,
      scrap: 7,
      weaponParts: 2,
      vendorReputation: { medic: 10, mechanic: 10 },
      rareCoreChance: 0.06,
    },
  },
  {
    id: "combat-streamsniper",
    type: "combat",
    title: "Crater Horror Breaker",
    description: "Eliminate one Crater Horror and survive the noise.",
    difficulty: "hard",
    targetPoi: "The Black Basin",
    risk: "Critical",
    requiresExtraction: true,
    target: { enemyType: "elite", enemyQuantity: 1 },
    reward: {
      credits: 280,
      xp: 160,
      scrap: 12,
      weaponParts: 4,
      vendorReputation: { broker: 24, mechanic: 16 },
      rareCoreChance: 0.2,
    },
  },
  {
    id: "vendor-broker-tags",
    type: "vendor",
    title: "Helios Wants Tags",
    description: "Extract a faction tag, then turn one in to Helios Dynamics after the Crater Run.",
    difficulty: "medium",
    targetPoi: "Faction Vendors",
    risk: "High",
    requiresExtraction: false,
    target: { vendorId: "broker", lootType: "dog-tag", lootQuantity: 1 },
    reward: {
      credits: 190,
      xp: 90,
      scrap: 0,
      weaponParts: 0,
      vendorReputation: { broker: 30 },
      rareCoreChance: 0.08,
    },
  },
  {
    id: "scav-weapon-parts-sweep",
    type: "scavenger",
    title: "Weapon Parts Sweep",
    description: "Clear armory caches and extract with 5 weapon parts for L.E.A.",
    difficulty: "medium",
    targetPoi: "Tycho Scar",
    risk: "High",
    requiresExtraction: true,
    target: { lootType: "weapon-parts", lootQuantity: 5 },
    reward: {
      credits: 165,
      xp: 95,
      scrap: 6,
      weaponParts: 3,
      vendorReputation: { mechanic: 24 },
      rareCoreChance: 0.05,
      contractPoints: 2,
    },
  },
  {
    id: "scav-armor-plate-delivery",
    type: "vendor",
    title: "Armor Plate Delivery",
    description: "Bring armor plates to Free Orbit Security. Crafted plates count once they reach Habitat Stash.",
    difficulty: "easy",
    targetPoi: "Faction Vendors",
    risk: "Low",
    requiresExtraction: false,
    target: { vendorId: "medic", lootType: "armor-plate", lootQuantity: 3 },
    reward: {
      credits: 110,
      xp: 55,
      scrap: 3,
      weaponParts: 0,
      vendorReputation: { medic: 24 },
      rareCoreChance: 0.01,
      contractPoints: 1,
    },
  },
  {
    id: "scav-flashlight-batteries",
    type: "scavenger",
    title: "Flashlight Battery Contract",
    description: "Extract with 5 Oxygen Cells during low-visibility Crater Runs for future utility upgrades.",
    difficulty: "medium",
    targetPoi: "Mare Vanta",
    risk: "Medium",
    requiresExtraction: true,
    target: { lootType: "battery", lootQuantity: 5 },
    reward: {
      credits: 155,
      xp: 88,
      scrap: 5,
      weaponParts: 1,
      vendorReputation: { mechanic: 10, scrapper: 16 },
      rareCoreChance: 0.04,
      contractPoints: 2,
    },
  },
  {
    id: "stealth-suppressor-parts",
    type: "stealth",
    title: "Suppressor Parts Contract",
    description: "Recover weapon parts from Mare Vanta without triggering full alert.",
    difficulty: "hard",
    targetPoi: "Mare Vanta",
    risk: "Critical",
    requiresExtraction: true,
    target: { poiObjectiveType: "hack-signal-box", lootType: "weapon-parts", lootQuantity: 3 },
    reward: {
      credits: 240,
      xp: 145,
      scrap: 8,
      weaponParts: 4,
      vendorReputation: { mechanic: 20, broker: 20 },
      rareCoreChance: 0.12,
      recipeUnlock: "High-Tier Suppressor",
      contractPoints: 3,
      reputationTokens: 1,
    },
  },
  {
    id: "combat-brute-hunt",
    type: "combat",
    title: "Brute Hunt",
    description: "Eliminate a Crater Horror near The Black Basin and extract the proof.",
    difficulty: "hard",
    targetPoi: "The Black Basin",
    risk: "Critical",
    requiresExtraction: true,
    target: { enemyType: "elite", enemyQuantity: 1 },
    reward: {
      credits: 340,
      xp: 190,
      scrap: 16,
      weaponParts: 5,
      vendorReputation: { broker: 28, mechanic: 18 },
      rareCoreChance: 0.24,
      contractPoints: 4,
      reputationTokens: 1,
      rareCrateChance: 0.22,
    },
  },
  {
    id: "combat-swarm-control",
    type: "combat",
    title: "Swarm Control",
    description: "Clear 6 Lunar Ticks before they overrun outer loot routes. Lunar Ticks are small enough to slip through damaged suit plating. If they do not kill you, what they leave behind might.",
    difficulty: "medium",
    targetPoi: "Outer POIs",
    risk: "Medium",
    requiresExtraction: false,
    target: { enemyType: "grunt", enemyQuantity: 6 },
    reward: {
      credits: 135,
      xp: 90,
      scrap: 10,
      weaponParts: 1,
      vendorReputation: { scrapper: 20 },
      rareCoreChance: 0.03,
      contractPoints: 2,
    },
  },
  {
    id: "poi-rooftop-relay",
    type: "poi-objective",
    title: "Rooftop Relay",
    description: "Restore rooftop signal boxes and unlock a marked reward chest.",
    difficulty: "medium",
    targetPoi: "Mare Vanta",
    risk: "High",
    requiresExtraction: true,
    target: { poiObjectiveType: "restore-power" },
    reward: {
      credits: 190,
      xp: 110,
      scrap: 8,
      weaponParts: 2,
      vendorReputation: { broker: 18, mechanic: 12 },
      rareCoreChance: 0.1,
      contractPoints: 2,
    },
  },
];

const defaultState: ContractState = {
  available: [],
  active: null,
  completedIds: [],
  history: [],
  refreshCount: 0,
  contractPoints: 0,
  reputationTokens: 0,
};

const enemyLabels: Record<EnemyType, string> = {
  grunt: "Lunar Ticks",
  charger: "Burrowers",
  spitter: "Spitters",
  guard: "Guardians",
  elite: "Crater Horrors",
};

const isContractId = (id: unknown): id is string =>
  typeof id === "string" && contractPool.some((contract) => contract.id === id);

export class ContractManager {
  private state: ContractState = this.load();
  private pendingRewards: ContractRewardGrant[] = [];
  private pendingMessages: string[] = [];
  private raidAlerted = false;
  private lastExtractionZoneId: string | null = null;

  public constructor(private readonly storage: Storage | null = window.localStorage) {
    if (this.state.available.length === 0) {
      this.refreshContracts();
    }
  }

  public get snapshot(): ContractState {
    return {
      available: [...this.state.available],
      active: this.state.active ? { ...this.state.active } : null,
      completedIds: [...this.state.completedIds],
      history: [...this.state.history],
      refreshCount: this.state.refreshCount,
      contractPoints: this.state.contractPoints,
      reputationTokens: this.state.reputationTokens,
    };
  }

  public activate(contractId: string): string {
    const contract = this.state.available.find((item) => item.id === contractId);

    if (!contract) {
      return "Contract unavailable";
    }

    this.state = {
      ...this.state,
      active: {
        definition: contract,
        status: "active",
        progress: 0,
        goal: this.goalForContract(contract),
        extractToClaim: false,
        failedReason: null,
      },
    };
    this.raidAlerted = false;
    this.lastExtractionZoneId = null;
    this.save();
    return `${contract.title} activated`;
  }

  public abandonActive(): string {
    if (!this.state.active) {
      return "No active contract";
    }

    const title = this.state.active.definition.title;
    this.state = { ...this.state, active: null };
    this.save();
    return `${title} abandoned`;
  }

  public refreshContracts(): void {
    const seed = Date.now() + this.state.refreshCount * 17;
    const darkContracts = contractPool
      .filter((contract) => contract.id.startsWith("dark-"))
      .sort((a, b) => this.scoreContract(a, seed) - this.scoreContract(b, seed));
    const legacyContracts = contractPool
      .filter((contract) => !contract.id.startsWith("dark-"))
      .sort((a, b) => this.scoreContract(a, seed) - this.scoreContract(b, seed));
    const candidates = [...darkContracts, ...legacyContracts];
    const available = candidates.slice(0, 3);

    this.state = {
      ...this.state,
      available: available.length >= 3 ? available : [...available, ...contractPool].slice(0, 3),
      refreshCount: this.state.refreshCount + 1,
    };
    this.save();
  }

  public submitActiveContract(): string {
    const active = this.state.active;

    if (!active) {
      return "No active contract";
    }

    if (active.status !== "ready-to-claim") {
      return active.status === "failed" ? "Contract failed" : "Contract is not ready to submit";
    }

    this.completeActiveContract();
    return `${active.definition.title} submitted`;
  }

  public beginRaid(): void {
    this.raidAlerted = false;
    this.lastExtractionZoneId = null;
    const active = this.state.active;

    if (!active || active.status === "completed" || active.status === "ready-to-claim") {
      return;
    }

    this.state = {
      ...this.state,
      active: {
        ...active,
        status: "active",
        failedReason: null,
        extractToClaim: false,
      },
    };
    this.save();
  }

  public record(event: ContractEvent): void {
    const active = this.state.active;

    if (!active || active.status === "completed" || active.status === "failed") {
      return;
    }

    if (event.type === "alert-triggered") {
      this.raidAlerted = true;
      if (active.definition.type === "stealth") {
        this.failActive("Full alert triggered");
      }
      return;
    }

    if (event.type === "player-death") {
      this.pendingRewards = [];
      if (active.definition.requiresExtraction || active.status === "ready-to-claim") {
        this.failActive("Lost in Crater Run");
      }
      return;
    }

    let nextProgress = active.progress;

    if (event.type === "enemy-killed" && active.definition.type === "combat") {
      if (event.enemyType === active.definition.target.enemyType) {
        nextProgress += 1;
      }
    } else if (event.type === "item-looted" && active.definition.type === "scavenger") {
      if (event.lootType === active.definition.target.lootType) {
        nextProgress += event.quantity;
      }
    } else if (event.type === "poi-objective-completed" && (active.definition.type === "poi-objective" || active.definition.type === "stealth")) {
      if (
        event.objectiveType === active.definition.target.poiObjectiveType &&
        this.matchesTargetPoi(active.definition.targetPoi, event.poiId ?? event.event.poiId) &&
        (active.definition.type !== "stealth" || !this.raidAlerted)
      ) {
        nextProgress = active.goal;
      }
    } else if (event.type === "extraction-started") {
      this.lastExtractionZoneId = event.zoneId;
      return;
    } else if (event.type === "extraction-completed") {
      this.completeExtractionContract(event.extractedItems);
      return;
    } else if (event.type === "vendor-turn-in" && active.definition.type === "vendor") {
      if (
        event.vendorId === active.definition.target.vendorId &&
        event.lootType === active.definition.target.lootType
      ) {
        nextProgress += event.quantity;
      }
    }

    this.updateProgress(Math.min(active.goal, nextProgress));
  }

  public handleExtraction(extractedItems: readonly LootStack[]): void {
    this.record({ type: "extraction-completed", zoneId: this.lastExtractionZoneId, extractedItems });
  }

  public consumeRewards(): ContractRewardGrant[] {
    return this.pendingRewards.splice(0);
  }

  public consumeMessages(): string[] {
    return this.pendingMessages.splice(0);
  }

  private updateProgress(progress: number): void {
    const active = this.state.active;

    if (!active) {
      return;
    }

    const complete = progress >= active.goal;
    const status: ContractStatus = complete ? "ready-to-claim" : active.status;

    this.state = {
      ...this.state,
      active: {
        ...active,
        progress,
        status,
        extractToClaim: complete && active.definition.requiresExtraction,
      },
    };

    if (complete) {
      this.pendingMessages.push(active.definition.requiresExtraction
        ? "Faction contract objective complete - extract to submit"
        : "Faction contract ready to submit at the board");
    }

    this.save();
  }

  private completeExtractionContract(extractedItems: readonly LootStack[]): void {
    const active = this.state.active;

    if (!active) {
      return;
    }

    if (active.definition.type === "extraction") {
      const matchingZone = !active.definition.target.extractionZoneId ||
        active.definition.target.extractionZoneId === this.lastExtractionZoneId;

      if (matchingZone) {
        this.updateProgress(active.goal);
      }
    } else if (active.definition.type === "scavenger") {
      const quantity = extractedItems
        .filter((item) => item.type === active.definition.target.lootType)
        .reduce((total, item) => total + item.quantity, 0);
      this.updateProgress(quantity);
    }

    const next = this.state.active;

    if (!next) {
      return;
    }

    if (next.status === "ready-to-claim") {
      this.pendingMessages.push("Faction contract ready to submit at the board");
    } else if (next.definition.requiresExtraction) {
      this.failActive("Extraction conditions missed");
    }
  }

  private completeActiveContract(): void {
    const active = this.state.active;

    if (!active || active.status === "completed") {
      return;
    }

    this.pendingRewards.push({
      contractId: active.definition.id,
      title: active.definition.title,
      reward: active.definition.reward,
    });
    console.info("[ContractManager] Claiming contract reward", {
      contractId: active.definition.id,
      credits: active.definition.reward.credits,
      xp: active.definition.reward.xp,
      vendorReputation: active.definition.reward.vendorReputation,
      contractPoints: this.rewardContractPoints(active.definition.reward),
      reputationTokens: this.rewardReputationTokens(active.definition.reward),
      status: "queued",
    });
    this.pendingMessages.push(`${active.definition.title} complete`);
    this.state = {
      ...this.state,
      active: null,
      completedIds: [...new Set([...this.state.completedIds, active.definition.id])],
      history: [
        {
          contractId: active.definition.id,
          title: active.definition.title,
          tier: this.rewardTierFor(active.definition),
          claimedAt: Date.now(),
        },
        ...this.state.history,
      ].slice(0, 12),
      contractPoints: this.state.contractPoints + this.rewardContractPoints(active.definition.reward),
      reputationTokens: this.state.reputationTokens + this.rewardReputationTokens(active.definition.reward),
    };
    this.refreshContracts();
    this.save();
  }

  private failActive(reason: string): void {
    const active = this.state.active;

    if (!active) {
      return;
    }

    this.pendingMessages.push(`Contract failed - ${reason}`);
    this.state = {
      ...this.state,
      active: {
        ...active,
        status: "failed",
        failedReason: reason,
      },
    };
    this.save();
  }

  private goalForContract(contract: ContractDefinition): number {
    if (contract.type === "combat") {
      return contract.target.enemyQuantity ?? 1;
    }

    if (contract.type === "scavenger" || contract.type === "vendor") {
      return contract.target.lootQuantity ?? 1;
    }

    if (contract.type === "extraction") {
      return 1;
    }

    return 1;
  }

  private scoreContract(contract: ContractDefinition, seed: number): number {
    const base = contract.id.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
    return (base + seed) % 97;
  }

  private rewardTierFor(contract: ContractDefinition): ContractRewardTier {
    if (contract.reward.tier) {
      return contract.reward.tier;
    }

    if (contract.risk === "Critical" || contract.difficulty === "hard") {
      return contract.reward.recipeUnlock ? "elite" : "high-risk";
    }

    if (contract.risk === "High" || contract.difficulty === "medium") {
      return "standard";
    }

    return "basic";
  }

  private matchesTargetPoi(targetPoi: string, poiId: string): boolean {
    if (targetPoi === "Any POI" || targetPoi === "Outer POIs" || targetPoi === "Mid POIs") {
      return true;
    }

    return poiDefinitions.some((poi) => poi.id === poiId && poi.name === targetPoi);
  }

  private rewardContractPoints(reward: ContractReward): number {
    if (Number.isFinite(reward.contractPoints)) {
      return Math.max(0, Math.floor(reward.contractPoints ?? 0));
    }

    const tier = reward.tier ?? "standard";
    return tier === "elite" ? 4 : tier === "high-risk" ? 3 : tier === "standard" ? 2 : 1;
  }

  private rewardReputationTokens(reward: ContractReward): number {
    if (Number.isFinite(reward.reputationTokens)) {
      return Math.max(0, Math.floor(reward.reputationTokens ?? 0));
    }

    const tier = reward.tier ?? "standard";
    return tier === "elite" ? 2 : tier === "high-risk" ? 1 : 0;
  }

  private load(): ContractState {
    try {
      const raw = this.storage?.getItem(storageKey);

      if (!raw) {
        return defaultState;
      }

      const parsed = JSON.parse(raw) as Partial<{
        availableIds: string[];
        activeId: string | null;
        activeProgress: number;
        activeStatus: ContractStatus;
        activeExtractToClaim: boolean;
        activeFailedReason: string | null;
        completedIds: string[];
        history: ContractHistoryEntry[];
        refreshCount: number;
        contractPoints: number;
        reputationTokens: number;
      }>;
      const available = Array.isArray(parsed.availableIds)
        ? parsed.availableIds.filter(isContractId).map((id) => contractPool.find((contract) => contract.id === id)!)
        : [];
      const activeDefinition = isContractId(parsed.activeId)
        ? contractPool.find((contract) => contract.id === parsed.activeId) ?? null
        : null;
      const status: ContractStatus = parsed.activeStatus === "ready-to-claim" ||
        parsed.activeStatus === "completed" ||
        parsed.activeStatus === "failed" ||
        parsed.activeStatus === "active"
        ? parsed.activeStatus
        : "active";

      return {
        available,
        active: activeDefinition
          ? {
            definition: activeDefinition,
            status,
            progress: Number.isFinite(parsed.activeProgress)
              ? Math.max(0, Math.floor(parsed.activeProgress ?? 0))
              : 0,
            goal: this.goalForContract(activeDefinition),
            extractToClaim: Boolean(parsed.activeExtractToClaim),
            failedReason: typeof parsed.activeFailedReason === "string" ? parsed.activeFailedReason : null,
          }
          : null,
        completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds.filter(isContractId) : [],
        history: Array.isArray(parsed.history)
          ? parsed.history
            .filter((entry) => isContractId(entry.contractId) && typeof entry.title === "string")
            .map((entry) => ({
              contractId: entry.contractId,
              title: entry.title,
              tier: this.isRewardTier(entry.tier) ? entry.tier : "standard",
              claimedAt: Number.isFinite(entry.claimedAt) ? Math.max(0, Math.floor(entry.claimedAt)) : 0,
            }))
            .slice(0, 12)
          : [],
        refreshCount: Number.isFinite(parsed.refreshCount) ? Math.max(0, Math.floor(parsed.refreshCount ?? 0)) : 0,
        contractPoints: Number.isFinite(parsed.contractPoints) ? Math.max(0, Math.floor(parsed.contractPoints ?? 0)) : 0,
        reputationTokens: Number.isFinite(parsed.reputationTokens) ? Math.max(0, Math.floor(parsed.reputationTokens ?? 0)) : 0,
      };
    } catch (error) {
      console.warn("ContractManager failed to load; using starter contracts.", error);
      return defaultState;
    }
  }

  private save(): void {
    try {
      this.storage?.setItem(storageKey, JSON.stringify({
        availableIds: this.state.available.map((contract) => contract.id),
        activeId: this.state.active?.definition.id ?? null,
        activeProgress: this.state.active?.progress ?? 0,
        activeStatus: this.state.active?.status ?? "active",
        activeExtractToClaim: this.state.active?.extractToClaim ?? false,
        activeFailedReason: this.state.active?.failedReason ?? null,
        completedIds: this.state.completedIds,
        history: this.state.history,
        refreshCount: this.state.refreshCount,
        contractPoints: this.state.contractPoints,
        reputationTokens: this.state.reputationTokens,
      }));
    } catch (error) {
      console.warn("ContractManager could not save.", error);
    }
  }

  private isRewardTier(value: unknown): value is ContractRewardTier {
    return value === "basic" || value === "standard" || value === "high-risk" || value === "elite";
  }
}

export const describeContractTarget = (contract: ContractDefinition): string => {
  if (contract.type === "combat" && contract.target.enemyType) {
    return `${contract.target.enemyQuantity ?? 1} ${enemyLabels[contract.target.enemyType]}`;
  }

  if ((contract.type === "scavenger" || contract.type === "vendor") && contract.target.lootType) {
    return `${contract.target.lootQuantity ?? 1} ${contract.target.lootType.replaceAll("-", " ")}`;
  }

  if (contract.type === "poi-objective" || contract.type === "stealth") {
    return contract.target.poiObjectiveType?.replaceAll("-", " ") ?? "POI objective";
  }

  if (contract.type === "extraction") {
    return contract.target.extractionZoneId?.replaceAll("-", " ") ?? "Any extract";
  }

  return contract.targetPoi;
};
