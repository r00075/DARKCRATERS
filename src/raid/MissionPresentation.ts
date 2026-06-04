import type { ActiveContractState, ContractDefinition } from "../contracts/ContractManager";
import type { HeavyCargoViewState } from "./HeavyCargoManager";
import type { ObjectiveState } from "./ObjectiveDirector";
import type { POIObjectiveState, POIObjectiveType, POIObjectiveView } from "./POIObjectiveManager";
import type { RaidResultSummary } from "./RaidResultSummary";
import { missionFamilyById, type MissionFamilyId } from "./MissionDefinitions";

export type MissionPresentationStatus =
  | "briefing"
  | "active"
  | "updated"
  | "complete"
  | "extracted"
  | "failed";

export type MissionPresentation = Readonly<{
  id: string;
  title: string;
  familyId: MissionFamilyId;
  familyName: string;
  briefing: string;
  primaryObjective: string;
  currentStep: string;
  optionalObjective: string;
  extraction: string;
  risk: string;
  rewardStatus: string;
  routeTargetLabel: string | null;
  routeContext: string;
  status: MissionPresentationStatus;
  soloSquad: string;
  recommendedRoute: string;
  operationOrder: string;
  result: string;
  poiContracts: string;
  nextAction: string;
}>;

export type MissionPresentationInput = Readonly<{
  activeContract: ActiveContractState | null;
  objective: ObjectiveState;
  poiObjectives: POIObjectiveState;
  heavyCargo: HeavyCargoViewState;
  objectiveCompleted: boolean;
  extractionAvailable: boolean;
  routeTargetLabel: string | null;
  routeTargetType: "objective" | "poi" | "extraction" | "cache" | "reveal-signal" | null;
  outcome: "active" | "extracted" | "lost";
  resultSummary: RaidResultSummary;
}>;

const poiTypeFamily: Record<POIObjectiveType, MissionFamilyId> = {
  "secure-cache": "salvage-recovery",
  "restore-power": "signal-restore",
  "hack-signal-box": "signal-restore",
  "clear-enemy-patrol": "defense-holdout",
  "retrieve-core-fragment": "lumen-survey",
};

export function getMissionFamilyForContract(contract: ContractDefinition | null): MissionFamilyId {
  if (!contract) {
    return "heavy-cargo-retrieval";
  }

  if (contract.type === "extraction") return "extraction-crisis";
  if (contract.type === "combat") return "defense-holdout";
  if (contract.type === "stealth") return "sabotage-subterfuge";
  if (contract.type === "scavenger") return "salvage-recovery";
  if (contract.type === "vendor") return "evidence-lore-recovery";

  const objectiveType = contract.target.poiObjectiveType;
  return objectiveType ? poiTypeFamily[objectiveType] : "salvage-recovery";
}

export function describePoiContractStep(objective: POIObjectiveView): string {
  if (objective.completed && objective.chestUnlocked) {
    return "Reward available";
  }

  if (objective.completed) {
    return "Objective complete";
  }

  if (objective.progress > 0) {
    return "Interact with objective device/cache";
  }

  return objective.distance <= 18 ? "Approach and interact" : "Approach POI";
}

export function describePoiRewardStatus(objective: POIObjectiveView | null): string {
  if (!objective) {
    return "POI reward cache status unknown";
  }

  if (objective.chestUnlocked) {
    return `Reward Cache Unlocked: ${objective.poiName} ${objective.title}`;
  }

  return `Reward locked behind ${objective.poiName} ${objective.title}`;
}

export function buildMissionPresentation(input: MissionPresentationInput): MissionPresentation {
  const activeContract = input.activeContract?.definition ?? null;
  const familyId = activeContract
    ? getMissionFamilyForContract(activeContract)
    : input.objective.type === "secure-rare-core" ? "heavy-cargo-retrieval" : "salvage-recovery";
  const family = missionFamilyById[familyId];
  const nearestPoi = input.poiObjectives.nearest;
  const completedPoiCount = input.poiObjectives.completedCount;
  const totalPoiCount = input.poiObjectives.totalCount;
  const objectiveComplete = input.objectiveCompleted || input.objective.completed;
  const heavyActive = input.objective.type === "secure-rare-core";
  const title = activeContract ? activeContract.title : input.objective.title;
  const primaryObjective = activeContract
    ? activeContract.description
    : heavyActive
      ? "Recover the Helium-3 drill core and secure it at the Kestrel-9."
      : input.objective.description;
  const currentStep = getCurrentStep(input, nearestPoi);
  const status = getStatus(input, objectiveComplete);
  const rewardStatus = nearestPoi
    ? describePoiRewardStatus(nearestPoi)
    : completedPoiCount > 0
      ? `${completedPoiCount} POI reward cache${completedPoiCount === 1 ? "" : "s"} unlocked`
      : "Reward caches unlock from completed POI contracts";
  const routeContext = input.routeTargetLabel
    ? input.routeTargetType === "reveal-signal"
      ? `Tracked tactical context: ${input.routeTargetLabel}`
      : input.routeTargetType === "extraction"
        ? `Extraction route tracked: ${input.routeTargetLabel}`
        : input.routeTargetType === "poi"
          ? `POI route tracked: ${input.routeTargetLabel}`
          : `Mission route tracked: ${input.routeTargetLabel}`
    : "No route tracked. Use the tactical map to track the objective.";

  return {
    id: activeContract?.id ?? input.objective.type,
    title,
    familyId,
    familyName: family.name,
    briefing: activeContract?.description ?? "TYCHOSTAR FIELD ORDER: recover industrial assets before crater instability rises. Unauthorized Lumen signal residue may be present. Log only if ordered.",
    primaryObjective,
    currentStep,
    optionalObjective: nearestPoi
      ? `${nearestPoi.title} at ${nearestPoi.poiName}: ${describePoiContractStep(nearestPoi)}`
      : "Search nearby POIs for reward caches, signal residue, or salvage.",
    extraction: input.extractionAvailable
      ? "Extraction available. Secure rewards at the ship or fallback beam."
      : heavyActive
        ? "Extraction unlocks after the Helium-3 core is secured at the ship."
        : "Extraction opens when the active objective or timer condition allows it.",
    risk: getRisk(input, activeContract),
    rewardStatus,
    routeTargetLabel: input.routeTargetLabel,
    routeContext,
    status,
    soloSquad: family.squadHint,
    recommendedRoute: input.routeTargetLabel
      ? "Current route is active on the tactical map."
      : "Open tactical map and track the objective marker before leaving the ship.",
    operationOrder: family.rhythm,
    result: getResultLabel(input, objectiveComplete),
    poiContracts: totalPoiCount > 0
      ? `${completedPoiCount}/${totalPoiCount} POI contract${totalPoiCount === 1 ? "" : "s"} completed`
      : "No POI contracts staged",
    nextAction: getNextAction(input),
  };
}

function getCurrentStep(input: MissionPresentationInput, nearestPoi: POIObjectiveView | null): string {
  if (input.outcome === "extracted") {
    return "Debrief complete. Review rewards and prepare the next run.";
  }

  if (input.outcome === "lost") {
    return "Mission ended before clean extraction.";
  }

  if (input.heavyCargo.shipSecured) {
    return "Primary cargo secured. Extract when ready.";
  }

  if (input.heavyCargo.carriedByLocalPlayer) {
    return "Carry the Helium-3 core to the Kestrel-9 cargo bay.";
  }

  if (input.heavyCargo.status === "carried") {
    return "Escort the core carrier to the ship.";
  }

  if (input.heavyCargo.status === "dropped") {
    return "Recover the dropped Helium-3 core.";
  }

  if (input.objective.completed || input.objectiveCompleted) {
    return "Primary objective complete. Extract when ready.";
  }

  if (nearestPoi?.contractLinked) {
    return `Contract POI: ${nearestPoi.title} - ${describePoiContractStep(nearestPoi)}`;
  }

  return input.objective.description;
}

function getStatus(input: MissionPresentationInput, objectiveComplete: boolean): MissionPresentationStatus {
  if (input.outcome === "extracted") return "extracted";
  if (input.outcome === "lost") return "failed";
  if (objectiveComplete) return input.extractionAvailable ? "complete" : "updated";
  return input.routeTargetLabel ? "updated" : "active";
}

function getRisk(input: MissionPresentationInput, contract: ContractDefinition | null): string {
  if (input.heavyCargo.carriedByLocalPlayer) {
    return "Heavy cargo blocks weapons, sprint, and EVA Pack access.";
  }

  if (contract) {
    return `Risk ${contract.risk}. ${contract.requiresExtraction ? "Extraction required for payout." : "Field completion can satisfy the contract."}`;
  }

  return "Crater instability rises with time. Carrying heavy cargo blocks EVA Pack access.";
}

function getResultLabel(input: MissionPresentationInput, objectiveComplete: boolean): string {
  if (input.outcome === "extracted") {
    return objectiveComplete ? "Completed" : "Extracted";
  }

  if (input.outcome === "lost") {
    return objectiveComplete ? "Partial" : "Failed";
  }

  return objectiveComplete ? "Complete" : "Active";
}

function getNextAction(input: MissionPresentationInput): string {
  if (input.outcome === "active") {
    return input.extractionAvailable ? "Extract or sweep one more POI contract." : "Track objective and keep the route short.";
  }

  if (input.resultSummary.scrapGained > 0) {
    return "Fabricate utility or repair gear before the next contract.";
  }

  if (input.resultSummary.lootExtracted.length > 0 || input.resultSummary.shipCargoSecured.length > 0) {
    return "Review Loadout, repair weapons, then track the next contract.";
  }

  return "Review Loadout and consider a lower-risk contract.";
}
