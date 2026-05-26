import type { LootStack } from "./RaidInventory";

export type RaidResultKind =
  | "extracted_clean"
  | "bag_fumbled"
  | "raid_abandoned"
  | "left_downed"
  | "lost_to_zone";

export type RaidResultSummary = Readonly<{
  kind: RaidResultKind;
  title: string;
  survivalStatus: string;
  raidDurationSeconds: number;
  enemiesEliminated: number;
  lootExtracted: LootStack[];
  lootLost: LootStack[];
  shipCargoSecured: LootStack[];
  shipStatus: string;
  shipCargoUsed: number;
  shipCargoCapacity: number;
  shipLandingQuality: string;
  shipCargoRisk: string;
  shipRepairStatus: string;
  evaPackItemsLeft: number;
  scrapGained: number;
  scrapSpent: number;
  creditsGained: number;
  xpGained: number;
  contractsCompleted: string[];
  contractsFailed: string[];
  contractsUnclaimed: string[];
  poiObjectivesCompleted: string[];
  poiObjectiveOutcome: string;
  vendorReputationGained: string[];
}>;

export const emptyRaidResultSummary: RaidResultSummary = {
  kind: "bag_fumbled",
  title: "BAG FUMBLED",
  survivalStatus: "Crater Run in progress",
  raidDurationSeconds: 0,
  enemiesEliminated: 0,
  lootExtracted: [],
  lootLost: [],
  shipCargoSecured: [],
  shipStatus: "No ship cargo secured",
  shipCargoUsed: 0,
  shipCargoCapacity: 0,
  shipLandingQuality: "Unknown",
  shipCargoRisk: "Unknown",
  shipRepairStatus: "Stable",
  evaPackItemsLeft: 0,
  scrapGained: 0,
  scrapSpent: 0,
  creditsGained: 0,
  xpGained: 0,
  contractsCompleted: [],
  contractsFailed: [],
  contractsUnclaimed: [],
  poiObjectivesCompleted: [],
  poiObjectiveOutcome: "No POI objective completed",
  vendorReputationGained: [],
};

export function getRaidResultTitle(kind: RaidResultKind): string {
  switch (kind) {
    case "extracted_clean":
      return "EXTRACTED CLEAN";
    case "raid_abandoned":
      return "CRATER RUN ABANDONED";
    case "left_downed":
      return "LEFT DOWNED";
    case "lost_to_zone":
      return "LOST TO THE CRATER";
    case "bag_fumbled":
    default:
      return "BAG FUMBLED";
  }
}
