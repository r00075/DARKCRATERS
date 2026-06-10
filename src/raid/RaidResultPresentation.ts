import { getItemDefinition, type LootType } from "./ItemDefinitions";
import type { HeavyCargoViewState } from "./HeavyCargoManager";
import type { MissionPresentation } from "./MissionPresentation";
import type { POIObjectiveState } from "./POIObjectiveManager";
import type { LootStack } from "./RaidInventory";
import type { RaidPressureState } from "./RaidPressure";
import type { RaidResultSummary } from "./RaidResultSummary";

export type RaidResultOutcome = "complete" | "partial" | "extracted" | "failed" | "abandoned";

export type RaidResultItem = Readonly<{
  type: LootType;
  label: string;
  quantity: number;
  notable: boolean;
}>;

export type RaidResultPresentation = Readonly<{
  missionId: string;
  missionTitle: string;
  familyName: string;
  result: RaidResultOutcome;
  resultLabel: string;
  primaryObjectiveStatus: string;
  primaryObjectiveDetail: string;
  poiCompleted: number;
  poiTotalKnown: number;
  poiLines: string[];
  rewardCachesClaimed: number;
  rewardCachesAvailable: number;
  rewardCacheLines: string[];
  heavyCargoStatus: string;
  extractionStatus: string;
  recoveredItems: RaidResultItem[];
  notableFinds: RaidResultItem[];
  craftingOpportunities: string[];
  repairOpportunities: string[];
  nextRecommendedActions: string[];
  pressureSummary: string[];
  narrativeLine: string;
  corporateAssessment: string;
}>;

export type RaidResultPresentationInput = Readonly<{
  mission: MissionPresentation;
  summary: RaidResultSummary;
  outcome: "extracted" | "lost";
  objectiveCompleted: boolean;
  poiObjectives: POIObjectiveState;
  rewardCachesClaimed: number;
  heavyCargo: HeavyCargoViewState;
  finalPressure: RaidPressureState | null;
  peakPressure: RaidPressureState | null;
}>;

const notableTypes = new Set<LootType>([
  "helium-drill-core",
  "lumen-essence",
  "scanner-battery",
  "rare-core",
  "rare-upgrade-kit",
  "weapon-parts",
  "encrypted-data",
  "target-token",
  "lumen-relic-mass",
  "reactor-spindle",
  "black-box-survey-crate",
  "sealed-mining-cache",
]);

export function buildRaidResultPresentation(input: RaidResultPresentationInput): RaidResultPresentation {
  const recoveredItems = groupResultItems([
    ...input.summary.lootExtracted,
    ...input.summary.shipCargoSecured,
  ]);
  const notableFinds = recoveredItems.filter((item) => item.notable);
  const rewardCachesAvailable = input.poiObjectives.objectives.filter((objective) => objective.chestUnlocked).length;
  const result = getResult(input);
  const pressure = input.peakPressure ?? input.finalPressure;

  return {
    missionId: input.mission.id,
    missionTitle: input.mission.title,
    familyName: input.mission.familyName,
    result,
    resultLabel: labelForResult(result),
    primaryObjectiveStatus: input.objectiveCompleted ? "Primary objective complete" : "Primary objective incomplete",
    primaryObjectiveDetail: getPrimaryObjectiveDetail(input),
    poiCompleted: input.poiObjectives.completedCount,
    poiTotalKnown: input.poiObjectives.totalCount,
    poiLines: buildPoiLines(input.poiObjectives),
    rewardCachesClaimed: input.rewardCachesClaimed,
    rewardCachesAvailable,
    rewardCacheLines: buildRewardCacheLines(input.poiObjectives, input.rewardCachesClaimed),
    heavyCargoStatus: getHeavyCargoStatus(input.heavyCargo, input.summary),
    extractionStatus: input.outcome === "extracted"
      ? "Extraction confirmed. Habitat Stash updated."
      : "Extraction not confirmed. Carried EVA Pack loot was not retained.",
    recoveredItems,
    notableFinds,
    craftingOpportunities: buildCraftingOpportunities(recoveredItems),
    repairOpportunities: buildRepairOpportunities(recoveredItems, input.summary),
    nextRecommendedActions: buildNextActions(input, recoveredItems),
    pressureSummary: buildPressureSummary(input.finalPressure, input.peakPressure),
    narrativeLine: getNarrativeLine(input.mission.familyName, result, pressure),
    corporateAssessment: getCorporateAssessment(input.mission.familyName, result, notableFinds),
  };
}

function getResult(input: RaidResultPresentationInput): RaidResultOutcome {
  if (input.summary.kind === "raid_abandoned") return "abandoned";
  if (input.outcome === "lost") return input.objectiveCompleted ? "partial" : "failed";
  return input.objectiveCompleted ? "complete" : "extracted";
}

function labelForResult(result: RaidResultOutcome): string {
  if (result === "complete") return "Complete";
  if (result === "partial") return "Partial";
  if (result === "extracted") return "Extracted";
  if (result === "abandoned") return "Abandoned";
  return "Failed";
}

function getPrimaryObjectiveDetail(input: RaidResultPresentationInput): string {
  if (input.heavyCargo.shipSecured) {
    return "Drill core secured at extraction cradle.";
  }

  if (input.heavyCargo.status === "dropped") {
    return "Cargo abandoned in field after release.";
  }

  if (input.heavyCargo.status === "available" || input.heavyCargo.status === "carried") {
    return "Cargo exposure increased patrol response.";
  }

  return input.objectiveCompleted ? input.mission.currentStep : "Primary objective unresolved.";
}

function buildPoiLines(poiObjectives: POIObjectiveState): string[] {
  if (poiObjectives.objectives.length === 0) {
    return ["No POI contracts discovered."];
  }

  return poiObjectives.objectives.map((objective) => {
    const status = objective.completed
      ? objective.chestUnlocked ? "Complete - reward cache available" : "Complete"
      : objective.progress > 0 ? "In progress" : "Unresolved";
    return `${objective.poiName} - ${objective.title}: ${status}`;
  });
}

function buildRewardCacheLines(poiObjectives: POIObjectiveState, claimed: number): string[] {
  const unlocked = poiObjectives.objectives.filter((objective) => objective.chestUnlocked);
  if (unlocked.length === 0) {
    return ["No objective reward cache unlocked."];
  }

  const remainingClaims = Math.max(0, claimed);
  return unlocked.map((objective, index) => {
    const status = index < remainingClaims ? "Claimed" : "Available in field";
    return `${objective.poiName} reward cache - ${status}`;
  });
}

function getHeavyCargoStatus(heavyCargo: HeavyCargoViewState, summary: RaidResultSummary): string {
  if (summary.lootExtracted.some((item) => item.type === "helium-drill-core")) {
    return "Heavy cargo recovered: Helium-3 Drill Core.";
  }

  if (heavyCargo.shipSecured) {
    return "Heavy cargo secured at ship cradle.";
  }

  if (heavyCargo.status === "dropped") {
    return "Heavy cargo dropped and left recoverable in field.";
  }

  if (heavyCargo.status === "available" || heavyCargo.status === "carried") {
    return "Heavy cargo released but not secured.";
  }

  return "Heavy cargo not recovered.";
}

function groupResultItems(items: readonly LootStack[]): RaidResultItem[] {
  const grouped = new Map<LootType, RaidResultItem>();

  for (const item of items) {
    const definition = getItemDefinition(item.type);
    const previous = grouped.get(item.type);
    grouped.set(item.type, {
      type: item.type,
      label: definition.label,
      quantity: (previous?.quantity ?? 0) + item.quantity,
      notable: notableTypes.has(item.type) || definition.rarity === "rare" || definition.rarity === "epic" || definition.rarity === "legendary" || definition.rarity === "core",
    });
  }

  return [...grouped.values()].sort((a, b) => Number(b.notable) - Number(a.notable) || a.label.localeCompare(b.label));
}

function buildCraftingOpportunities(items: readonly RaidResultItem[]): string[] {
  const has = (type: LootType) => items.some((item) => item.type === type && item.quantity > 0);
  const opportunities: string[] = [];
  if (has("lumen-essence")) opportunities.push("Fabricate Essence Flare from recovered Lumen Essence.");
  if (has("scanner-battery")) opportunities.push("Archive Scanner Battery as scanner utility material.");
  if (has("scrap")) opportunities.push("Spend Regolith Scrap on fabrication or field repairs.");
  if (has("weapon-parts") || has("rare-core")) opportunities.push("Review weapon upgrade options at Arsenal.");
  return opportunities.length > 0 ? opportunities.slice(0, 3) : ["Review fabrication bench before the next deployment."];
}

function buildRepairOpportunities(items: readonly RaidResultItem[], summary: RaidResultSummary): string[] {
  const hasRepairMaterial = items.some((item) => item.type === "scrap" || item.type === "weapon-parts" || item.type === "weapon-repair-kit");
  const opportunities: string[] = [];
  if (summary.shipRepairStatus !== "Stable") opportunities.push(`Inspect Kestrel-9: ${summary.shipRepairStatus}.`);
  if (hasRepairMaterial) opportunities.push("Repair or tune weapons before redeploying.");
  if (summary.scrapSpent > 0) opportunities.push(`${summary.scrapSpent} scrap spent on raid prep repairs.`);
  return opportunities.length > 0 ? opportunities.slice(0, 3) : ["Check armor and weapon condition in Habitat."];
}

function buildNextActions(input: RaidResultPresentationInput, items: readonly RaidResultItem[]): string[] {
  const actions: string[] = ["Select next contract"];
  if (input.mission.id.startsWith("evidence-")) actions.push("Review Evidence Codex");
  if (input.mission.familyName.includes("Lumen Survey")) actions.push("Continue Regolith Trace");
  if (items.some((item) => item.type === "lumen-essence" || item.type === "essence-flare")) actions.push("Fabricate Essence Flare");
  if (input.summary.scrapGained > 0 || items.some((item) => item.type === "weapon-parts")) actions.push("Repair weapon");
  if (input.mission.familyName.includes("Cargo") || input.heavyCargo.shipSecured) actions.push("Inspect Kestrel-9 cargo modules");
  actions.push("Review Loadout");
  return [...new Set(actions)].slice(0, 5);
}

function buildPressureSummary(finalPressure: RaidPressureState | null, peakPressure: RaidPressureState | null): string[] {
  const lines: string[] = [];
  if (peakPressure) lines.push(`Peak Pressure: ${peakPressure.pressureLabel} / Threat ${peakPressure.threatLevel}`);
  if (finalPressure) lines.push(`Final Field State: ${finalPressure.pressureLabel}`);
  if (peakPressure?.reason) lines.push(`Primary Risk: ${peakPressure.reason}`);
  if (finalPressure?.extractionPressure) lines.push("Extraction: Return route active");
  return lines.length > 0 ? lines : ["Field pressure telemetry unavailable."];
}

function getNarrativeLine(familyName: string, result: RaidResultOutcome, pressure: RaidPressureState | null): string {
  if (familyName.includes("Lumen Survey") && (result === "complete" || result === "partial")) {
    return "Survey material logged. TYCHOSTAR classifies residue movement as geological interference.";
  }
  if (result === "complete") return `${familyName} operation closed under TYCHOSTAR recovery protocol.`;
  if (result === "partial") return `${familyName} report filed with unresolved field exposure.`;
  if (pressure?.reasonCategory === "reveal-contact") return "Unregistered signal residue detected in recovered material. Do not distribute.";
  return "Corporate record marks Lumen signatures as geological interference.";
}

function getCorporateAssessment(familyName: string, result: RaidResultOutcome, notableFinds: readonly RaidResultItem[]): string {
  if (notableFinds.some((item) => item.type === "lumen-essence" || item.type === "lumen-relic-mass")) {
    return "TYCHOSTAR Assessment: Lumen-adjacent material secured. Crew discretion noted.";
  }

  if (result === "failed" || result === "abandoned") {
    return "TYCHOSTAR Assessment: Asset recovery incomplete. Review deployment discipline.";
  }

  return `TYCHOSTAR Assessment: ${familyName} sortie logged. Recovered assets transferred to Habitat custody.`;
}
