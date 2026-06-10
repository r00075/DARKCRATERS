import {
  campaignActById,
  campaignOperations,
  type CampaignActId,
  type CampaignOperationId,
} from "./CampaignDefinitions";
import {
  campaignEvidenceById,
  campaignEvidenceDefinitions,
  discoverEvidenceFromRaid,
  isCampaignEvidenceId,
  type CampaignEvidenceDefinition,
  type CampaignEvidenceId,
} from "./CampaignEvidence";
import { missionFamilyById } from "../raid/MissionDefinitions";
import type { RaidResultPresentation } from "../raid/RaidResultPresentation";

export type OperationStatus = "locked" | "available" | "active" | "completed" | "recommended";

export type CampaignProgressState = Readonly<{
  version: 1;
  currentActId: CampaignActId;
  currentOperationId: CampaignOperationId;
  completedOperationIds: CampaignOperationId[];
  completedContractIds: string[];
  discoveredEvidenceIds: CampaignEvidenceId[];
  lastDiscoveredEvidenceIds: CampaignEvidenceId[];
  lastUnlockedOperationIds: CampaignOperationId[];
  totalRaidsExtracted: number;
  primaryObjectivesCompleted: number;
  poiContractsCompleted: number;
  rewardCachesClaimed: number;
  heavyCargoSecuredCount: number;
  lumenEvidenceRecovered: number;
  corporateCompliance: number;
  lumenTruth: number;
  corporateSuspicion: number;
  lastRaidResultSummary: string | null;
  lastAppliedResultKey: string | null;
  lastDelta: CampaignProgressDelta | null;
}>;

export type CampaignProgressDelta = Readonly<{
  compliance: number;
  truth: number;
  suspicion: number;
  operationAdvanced: CampaignOperationId;
  operationCompleted: boolean;
  nextOperationId: CampaignOperationId;
  newlyUnlockedOperationIds: CampaignOperationId[];
  discoveredEvidenceIds: CampaignEvidenceId[];
  reasons: string[];
  lines: string[];
}>;

export type CampaignMeterView = Readonly<{
  id: "compliance" | "truth" | "suspicion";
  label: string;
  value: number;
  band: string;
  lastDelta: number;
  deltaReason: string;
}>;

export type CampaignEvidenceView = Readonly<{
  discoveredCount: number;
  totalCount: number;
  latest: CampaignEvidenceDefinition | null;
  newlyDiscovered: CampaignEvidenceDefinition[];
  visibleEvidence: CampaignEvidenceDefinition[];
  codexEntries: CampaignEvidenceCodexEntry[];
  hiddenImplicationUnlocked: boolean;
  summaryLines: string[];
}>;

export type CampaignEvidenceCodexEntry = Readonly<{
  id: CampaignEvidenceId;
  title: string;
  type: string;
  severity: string;
  tags: string[];
  discovered: boolean;
  latestDiscovery: boolean;
  discoveryOrder: number | null;
  sourceOperations: string;
  sourceFamilies: string;
  officialClassification: string;
  publicSummary: string;
  restrictedSummary: string;
  hiddenImplication: string;
  hiddenImplicationVisible: boolean;
  unlockConditionText: string;
  discoveryHint: string;
  meterEffects: string;
  relatedOperations: string;
  relatedNextAction: string;
  sealedSummary: string;
}>;

export type CampaignOperationView = Readonly<{
  id: CampaignOperationId;
  title: string;
  subtitle: string;
  actLabel: string;
  status: OperationStatus;
  statusLabel: string;
  recommended: boolean;
  replayable: boolean;
  reason: string;
  families: string;
  corporateObjective: string;
  hiddenTruthHint: string;
  hiddenTruthVisible: boolean;
  unlockRequirement: string;
  progressRequirement: string;
  recommendationReason: string;
  readiness: string;
  buttonLabel: string;
  selectable: boolean;
}>;

export type CampaignPresentation = Readonly<{
  actId: CampaignActId;
  actTitle: string;
  actSubtitle: string;
  corporateFraming: string;
  hiddenTruthFraming: string;
  activeOperation: CampaignOperationView;
  recommendedOperation: CampaignOperationView;
  operations: CampaignOperationView[];
  meters: CampaignMeterView[];
  evidence: CampaignEvidenceView;
  meterLines: string[];
  recentRaidLine: string;
  commandFeedLines: string[];
  briefingLines: string[];
  resultLines: string[];
  nextActionLines: string[];
  lastDelta: CampaignProgressDelta | null;
}>;

const campaignStorageKey = "dark-craters-campaign-v1";
const maxMeterValue = 12;

const defaultCampaignState: CampaignProgressState = {
  version: 1,
  currentActId: "act-1",
  currentOperationId: "orbital-liability",
  completedOperationIds: [],
  completedContractIds: [],
  discoveredEvidenceIds: [],
  lastDiscoveredEvidenceIds: [],
  lastUnlockedOperationIds: [],
  totalRaidsExtracted: 0,
  primaryObjectivesCompleted: 0,
  poiContractsCompleted: 0,
  rewardCachesClaimed: 0,
  heavyCargoSecuredCount: 0,
  lumenEvidenceRecovered: 0,
  corporateCompliance: 0,
  lumenTruth: 0,
  corporateSuspicion: 0,
  lastRaidResultSummary: null,
  lastAppliedResultKey: null,
  lastDelta: null,
};

export class CampaignProgress {
  private state: CampaignProgressState;
  private malformedSaveLogged = false;

  public constructor(private readonly storage: Storage | null = window.localStorage) {
    this.state = this.load();
    console.info(`[Campaign] loaded act=${this.state.currentActId} operation=${this.state.currentOperationId}`);
  }

  public get snapshot(): CampaignProgressState {
    return cloneState(this.state);
  }

  public get presentation(): CampaignPresentation {
    return buildCampaignPresentation(this.state, this.state.lastDelta);
  }

  public selectOperation(operationId: string): string {
    const operation = campaignOperations.find((candidate) => candidate.id === operationId);
    if (!operation) return "Operation unavailable";

    const status = getOperationStatus(operation.id, this.state);
    if (status === "locked") return `${operation.title} locked`;

    this.state = { ...this.state, currentOperationId: operation.id };
    this.save();
    console.info(`[Campaign] selected operation=${operation.id}`);
    return `${operation.title} selected`;
  }

  public applyRaidResult(result: RaidResultPresentation, contractId: string | null): CampaignProgressDelta {
    const resultKey = [
      result.missionId,
      result.result,
      result.poiCompleted,
      result.rewardCachesClaimed,
      result.heavyCargoStatus,
      result.recoveredItems.map((item) => `${item.type}:${item.quantity}`).join(","),
    ].join(":");
    if (this.state.lastAppliedResultKey === resultKey) {
      return this.state.lastDelta ?? this.emptyDelta();
    }

    const beforeUnlocked = getUnlockedOperationIds(this.state);
    const extractedClean = result.result === "complete" || result.result === "extracted";
    const primaryComplete = result.result === "complete" || result.result === "partial";
    const heavyCargoSecured = result.heavyCargoStatus.toLowerCase().includes("recovered") || result.heavyCargoStatus.toLowerCase().includes("secured");
    const evidenceDiscoveries = discoverEvidenceFromRaid(result).filter((discovery) => !this.state.discoveredEvidenceIds.includes(discovery.id));
    const evidenceDefinitions = evidenceDiscoveries.map((discovery) => campaignEvidenceById[discovery.id]);
    const lumenEvidence = evidenceDiscoveries.filter((discovery) => {
      const type = campaignEvidenceById[discovery.id].type;
      return type === "lumen-residue" || type === "mineral-anomaly" || type === "field-memory";
    }).length;

    const reasons: string[] = [];
    if (primaryComplete) reasons.push("Primary objective complete");
    if (extractedClean) reasons.push("Extraction confirmed");
    if (heavyCargoSecured) reasons.push("Heavy cargo secured");
    if (result.rewardCachesClaimed > 0) reasons.push(`${result.rewardCachesClaimed} reward cache${result.rewardCachesClaimed === 1 ? "" : "s"} claimed`);
    for (const discovery of evidenceDiscoveries) reasons.push(discovery.reason);

    const evidenceCompliance = evidenceDefinitions.reduce((total, evidence) => total + evidence.complianceEffect, 0);
    const evidenceTruth = evidenceDefinitions.reduce((total, evidence) => total + evidence.truthEffect, 0);
    const evidenceSuspicion = evidenceDefinitions.reduce((total, evidence) => total + evidence.suspicionEffect, 0);
    const compliance =
      (primaryComplete ? 1 : 0) +
      (heavyCargoSecured ? 1 : 0) +
      (result.rewardCachesClaimed >= 2 ? 1 : 0) +
      (extractedClean ? 1 : 0) +
      evidenceCompliance;
    const truth = evidenceTruth + (result.familyName.toLowerCase().includes("signal") ? 1 : 0);
    const suspicion = evidenceSuspicion;

    const completedOperationIds = new Set(this.state.completedOperationIds);
    const operationAdvanced = this.state.currentOperationId;
    if (primaryComplete) {
      completedOperationIds.add(operationAdvanced);
    }

    const completedContractIds = new Set(this.state.completedContractIds);
    if (contractId) completedContractIds.add(contractId);

    const discoveredEvidenceIds = new Set(this.state.discoveredEvidenceIds);
    for (const discovery of evidenceDiscoveries) {
      discoveredEvidenceIds.add(discovery.id);
      console.info(`[Campaign] evidence discovered id=${discovery.id} source=${discovery.source}`);
    }

    const nextStateBase: CampaignProgressState = {
      ...this.state,
      completedOperationIds: [...completedOperationIds],
      completedContractIds: [...completedContractIds],
      discoveredEvidenceIds: [...discoveredEvidenceIds],
      lastDiscoveredEvidenceIds: evidenceDiscoveries.map((discovery) => discovery.id),
      lastUnlockedOperationIds: [],
      totalRaidsExtracted: this.state.totalRaidsExtracted + (extractedClean ? 1 : 0),
      primaryObjectivesCompleted: this.state.primaryObjectivesCompleted + (primaryComplete ? 1 : 0),
      poiContractsCompleted: this.state.poiContractsCompleted + result.poiCompleted,
      rewardCachesClaimed: this.state.rewardCachesClaimed + result.rewardCachesClaimed,
      heavyCargoSecuredCount: this.state.heavyCargoSecuredCount + (heavyCargoSecured ? 1 : 0),
      lumenEvidenceRecovered: this.state.lumenEvidenceRecovered + lumenEvidence,
      corporateCompliance: clampMeter(this.state.corporateCompliance + compliance),
      lumenTruth: clampMeter(this.state.lumenTruth + truth),
      corporateSuspicion: clampMeter(this.state.corporateSuspicion + suspicion),
      lastRaidResultSummary: `${result.resultLabel} - ${result.missionTitle}`,
      lastAppliedResultKey: resultKey,
    };
    const afterUnlocked = getUnlockedOperationIds(nextStateBase);
    const newlyUnlockedOperationIds = afterUnlocked.filter((id) => !beforeUnlocked.includes(id));
    for (const id of newlyUnlockedOperationIds) {
      console.info(`[Campaign] operation unlocked id=${id}`);
    }

    const nextOperationId = getRecommendedOperationId(nextStateBase);
    const operationCompleted = completedOperationIds.has(operationAdvanced);
    const delta: CampaignProgressDelta = {
      compliance,
      truth,
      suspicion,
      operationAdvanced,
      operationCompleted,
      nextOperationId,
      newlyUnlockedOperationIds,
      discoveredEvidenceIds: evidenceDiscoveries.map((discovery) => discovery.id),
      reasons,
      lines: buildDeltaLines(operationAdvanced, operationCompleted, nextOperationId, compliance, truth, suspicion, newlyUnlockedOperationIds, evidenceDiscoveries.map((discovery) => discovery.id), reasons),
    };

    this.state = {
      ...nextStateBase,
      currentOperationId: nextOperationId,
      lastUnlockedOperationIds: newlyUnlockedOperationIds,
      lastDelta: delta,
    };
    this.save();
    console.info(`[Campaign] last delta compliance=${compliance} truth=${truth} suspicion=${suspicion}`);
    return delta;
  }

  public resetForDebug(): void {
    this.state = { ...defaultCampaignState };
    this.save();
    console.info("[Campaign] dev reset");
  }

  public addDebugSignals(): string {
    this.state = {
      ...this.state,
      corporateCompliance: clampMeter(this.state.corporateCompliance + 2),
      lumenTruth: clampMeter(this.state.lumenTruth + 2),
      corporateSuspicion: clampMeter(this.state.corporateSuspicion + 1),
    };
    this.save();
    console.info("[Campaign] dev meters compliance=2 truth=2 suspicion=1");
    return "Campaign test signals added";
  }

  public unlockActOneForDebug(): string {
    this.state = {
      ...this.state,
      totalRaidsExtracted: Math.max(this.state.totalRaidsExtracted, 1),
      primaryObjectivesCompleted: Math.max(this.state.primaryObjectivesCompleted, 1),
      poiContractsCompleted: Math.max(this.state.poiContractsCompleted, 1),
      lumenEvidenceRecovered: Math.max(this.state.lumenEvidenceRecovered, 1),
      lumenTruth: Math.max(this.state.lumenTruth, 3),
    };
    this.save();
    console.info("[Campaign] dev unlock act=act-1");
    return "Act I operations unlocked for testing";
  }

  public discoverDebugEvidence(): string {
    const next = campaignEvidenceDefinitions.find((evidence) => !this.state.discoveredEvidenceIds.includes(evidence.id));
    if (!next) return "All campaign evidence already logged";

    this.state = {
      ...this.state,
      discoveredEvidenceIds: [...this.state.discoveredEvidenceIds, next.id],
      lastDiscoveredEvidenceIds: [next.id],
      lumenTruth: clampMeter(this.state.lumenTruth + next.meterEffects.truth),
      corporateCompliance: clampMeter(this.state.corporateCompliance + next.meterEffects.compliance),
      corporateSuspicion: clampMeter(this.state.corporateSuspicion + next.meterEffects.suspicion),
    };
    this.save();
    console.info(`[Campaign] evidence discovered id=${next.id} source=dev-tool`);
    return `Evidence logged: ${next.title}`;
  }

  public discoverAllEvidenceForDebug(): string {
    this.state = {
      ...this.state,
      discoveredEvidenceIds: campaignEvidenceDefinitions.map((evidence) => evidence.id),
      lastDiscoveredEvidenceIds: campaignEvidenceDefinitions.slice(-3).map((evidence) => evidence.id),
      lumenTruth: Math.max(this.state.lumenTruth, 6),
      corporateSuspicion: Math.max(this.state.corporateSuspicion, 3),
    };
    this.save();
    console.info("[Campaign] evidence discovered source=dev-tool count=all");
    return "All Act I evidence logged";
  }

  public resetEvidenceForDebug(): string {
    this.state = {
      ...this.state,
      discoveredEvidenceIds: [],
      lastDiscoveredEvidenceIds: [],
      lumenEvidenceRecovered: 0,
      lastDelta: this.state.lastDelta ? {
        ...this.state.lastDelta,
        discoveredEvidenceIds: [],
        lines: this.state.lastDelta.lines.filter((line) => !line.startsWith("Evidence Discovered:")),
      } : null,
    };
    this.save();
    console.info("[Campaign] evidence reset reason=dev-tool");
    return "Campaign evidence reset";
  }

  public getEvidenceDebugSummary(): string {
    return [
      `evidence=${this.state.discoveredEvidenceIds.join(",") || "none"}`,
      `latest=${this.state.lastDiscoveredEvidenceIds.join(",") || "none"}`,
      `truth=${this.state.lumenTruth}`,
      `suspicion=${this.state.corporateSuspicion}`,
    ].join(" | ");
  }

  public getDebugSummary(): string {
    return [
      `act=${this.state.currentActId}`,
      `operation=${this.state.currentOperationId}`,
      `completed=${this.state.completedOperationIds.join(",") || "none"}`,
      `evidence=${this.state.discoveredEvidenceIds.length}/${campaignEvidenceDefinitions.length}`,
      `meters=${this.state.corporateCompliance}/${this.state.lumenTruth}/${this.state.corporateSuspicion}`,
    ].join(" | ");
  }

  private emptyDelta(): CampaignProgressDelta {
    return {
      compliance: 0,
      truth: 0,
      suspicion: 0,
      operationAdvanced: this.state.currentOperationId,
      operationCompleted: false,
      nextOperationId: getRecommendedOperationId(this.state),
      newlyUnlockedOperationIds: [],
      discoveredEvidenceIds: [],
      reasons: [],
      lines: [],
    };
  }

  private load(): CampaignProgressState {
    if (!this.storage) return { ...defaultCampaignState };

    try {
      const raw = this.storage.getItem(campaignStorageKey);
      if (!raw) return { ...defaultCampaignState };
      const parsed = JSON.parse(raw) as Partial<CampaignProgressState>;
      return sanitizeCampaignState(parsed, (reason) => this.logSaveRecovered(reason));
    } catch (error) {
      this.logSaveRecovered("json-parse");
      console.warn("CampaignProgress failed to load; using default campaign.", error);
      return { ...defaultCampaignState };
    }
  }

  private logSaveRecovered(reason: string): void {
    if (this.malformedSaveLogged) return;
    this.malformedSaveLogged = true;
    console.warn(`[Campaign] save recovered reason=${reason}`);
  }

  private save(): void {
    if (!this.storage) return;

    try {
      this.storage.setItem(campaignStorageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn("CampaignProgress could not save.", error);
    }
  }
}

export function buildCampaignPresentation(state: CampaignProgressState, lastDelta: CampaignProgressDelta | null): CampaignPresentation {
  const safeState = sanitizeCampaignState(state);
  const act = campaignActById[safeState.currentActId];
  const recommendedOperationId = getRecommendedOperationId(safeState);
  const operations = campaignOperations.map((operation) => toOperationView(operation.id, safeState, operation.id === recommendedOperationId));
  const recommendedOperation = operations.find((operation) => operation.id === recommendedOperationId) ?? operations[0]!;
  const activeOperation = operations.find((operation) => operation.id === safeState.currentOperationId) ?? recommendedOperation;
  const meters = buildMeterViews(safeState, lastDelta);
  const evidence = buildEvidenceView(safeState);
  const nextActionLines = buildNextActionLines(safeState, activeOperation, recommendedOperation);

  return {
    actId: act.id,
    actTitle: act.title,
    actSubtitle: act.subtitle,
    corporateFraming: act.corporateFraming,
    hiddenTruthFraming: act.hiddenTruthFraming,
    activeOperation,
    recommendedOperation,
    operations,
    meters,
    evidence,
    meterLines: meters.map((meter) => `${meter.label}: ${meter.value} - ${meter.band}${meter.lastDelta > 0 ? ` (+${meter.lastDelta})` : ""}`),
    recentRaidLine: safeState.lastRaidResultSummary ?? "No campaign raid logged yet.",
    commandFeedLines: [
      `ACT I // ${act.title.toUpperCase()}`,
      `Operation: ${activeOperation.title}`,
      `Recommended: ${recommendedOperation.title}`,
      `Compliance: ${meters[0]!.band}`,
      `Lumen Signal: ${meters[1]!.band}`,
      `Corporate Review: ${meters[2]!.band}`,
      evidence.latest ? `Latest Evidence: ${evidence.latest.title}` : "Latest Evidence: none logged",
      lastDelta ? `Last Campaign Delta: C+${lastDelta.compliance} T+${lastDelta.truth} S+${lastDelta.suspicion}` : "Last Campaign Delta: none",
    ],
    briefingLines: [
      `Campaign: Act I - ${act.title}`,
      `Operation: ${activeOperation.title}`,
      `Campaign-aligned family: ${activeOperation.families}`,
      `Recommended next family: ${recommendedOperation.families}`,
      nextActionLines[0] ?? "Deploy discretion remains with the contractor.",
      safeState.lumenTruth > 0 ? activeOperation.hiddenTruthHint : "TYCHOSTAR classifies Lumen reports as geological interference.",
    ],
    resultLines: [
      `Act I - ${act.title}`,
      ...(lastDelta?.lines ?? [`Operation: ${activeOperation.title}`]),
      evidence.newlyDiscovered.length > 0 ? `Codex Updated: ${evidence.newlyDiscovered.map((item) => item.title).join(", ")}` : "No new evidence logged.",
      `Evidence Archive: ${evidence.discoveredCount}/${evidence.totalCount} records`,
      "Review in Contracts: Evidence Codex",
      `Next Operation: ${recommendedOperation.title}`,
    ],
    nextActionLines,
    lastDelta,
  };
}

function toOperationView(operationId: CampaignOperationId, state: CampaignProgressState, recommended = false): CampaignOperationView {
  const operation = campaignOperations.find((candidate) => candidate.id === operationId) ?? campaignOperations[0]!;
  const baseStatus = getOperationStatus(operation.id, state);
  const status: OperationStatus = recommended && baseStatus !== "active" && baseStatus !== "completed" ? "recommended" : baseStatus;
  const familyNames = operation.familyIds.map((familyId) => missionFamilyById[familyId]?.name ?? familyId).join(" / ");
  const completed = baseStatus === "completed";
  const active = baseStatus === "active";
  const locked = baseStatus === "locked";
  const statusLabel = active ? "Active" : completed ? "Complete" : status === "recommended" ? "Recommended" : locked ? "Locked" : "Available";

  return {
    id: operation.id,
    title: operation.title,
    subtitle: operation.subtitle,
    actLabel: operation.actId === "act-1" ? "Act I" : operation.actId.toUpperCase(),
    status,
    statusLabel,
    recommended: status === "recommended",
    replayable: completed,
    reason: reasonForOperation(operation.id, state),
    families: familyNames,
    corporateObjective: operation.corporateObjective,
    hiddenTruthHint: operation.hiddenTruthHint,
    hiddenTruthVisible: state.lumenTruth > 0 || !locked,
    unlockRequirement: operation.unlockHint,
    progressRequirement: progressRequirementForOperation(operation.id),
    recommendationReason: recommendationReasonForOperation(operation.id, state),
    readiness: operation.readiness,
    buttonLabel: locked ? "Locked" : active ? "Active Operation" : completed ? "Replay Operation" : "Set Active Operation",
    selectable: !locked,
  };
}

function buildMeterViews(state: CampaignProgressState, lastDelta: CampaignProgressDelta | null): CampaignMeterView[] {
  return [
    {
      id: "compliance",
      label: "Corporate Compliance",
      value: state.corporateCompliance,
      band: complianceBand(state.corporateCompliance),
      lastDelta: lastDelta?.compliance ?? 0,
      deltaReason: deltaReason(lastDelta, "compliance"),
    },
    {
      id: "truth",
      label: "Lumen Truth",
      value: state.lumenTruth,
      band: truthBand(state.lumenTruth),
      lastDelta: lastDelta?.truth ?? 0,
      deltaReason: deltaReason(lastDelta, "truth"),
    },
    {
      id: "suspicion",
      label: "Corporate Suspicion",
      value: state.corporateSuspicion,
      band: suspicionBand(state.corporateSuspicion),
      lastDelta: lastDelta?.suspicion ?? 0,
      deltaReason: deltaReason(lastDelta, "suspicion"),
    },
  ];
}

function buildEvidenceView(state: CampaignProgressState): CampaignEvidenceView {
  const visibleEvidence = state.discoveredEvidenceIds.map((id) => campaignEvidenceById[id]).filter(Boolean);
  const newlyDiscovered = state.lastDiscoveredEvidenceIds.map((id) => campaignEvidenceById[id]).filter(Boolean);
  const latest = newlyDiscovered[0] ?? visibleEvidence[visibleEvidence.length - 1] ?? null;
  const hiddenImplicationUnlocked = state.lumenTruth >= 1 || newlyDiscovered.length > 0;
  const codexEntries = buildCodexEntries(state);
  const summaryLines = [
    `Discovered: ${visibleEvidence.length} / ${campaignEvidenceDefinitions.length}`,
    latest ? `Latest: ${latest.title}` : "Latest: none logged",
    latest ? `Official Classification: ${latest.officialClassification}` : "Official Classification: no anomaly filed",
    latest && hiddenImplicationUnlocked ? `Unresolved Note: ${latest.hiddenImplication}` : "Unresolved Note: restricted pending Lumen review",
  ];

  return {
    discoveredCount: visibleEvidence.length,
    totalCount: campaignEvidenceDefinitions.length,
    latest,
    newlyDiscovered,
    visibleEvidence: visibleEvidence.slice(-4).reverse(),
    codexEntries,
    hiddenImplicationUnlocked,
    summaryLines,
  };
}

function buildCodexEntries(state: CampaignProgressState): CampaignEvidenceCodexEntry[] {
  const latestIds = new Set(state.lastDiscoveredEvidenceIds);
  return campaignEvidenceDefinitions
    .map((evidence) => {
      const discoveryOrder = state.discoveredEvidenceIds.indexOf(evidence.id);
      const discovered = discoveryOrder >= 0;
      const latestDiscovery = latestIds.has(evidence.id);
      const hiddenImplicationVisible = discovered && (state.lumenTruth >= 1 || latestDiscovery);
      const sourceOperations = evidence.sourceOperationIds
        .map((id) => campaignOperations.find((operation) => operation.id === id)?.title ?? id)
        .join(" / ");
      const sourceFamilies = evidence.sourceMissionFamilyIds
        .map((id) => missionFamilyById[id]?.name ?? id)
        .join(" / ");
      return {
        id: evidence.id,
        title: discovered ? evidence.title : "SEALED RECORD",
        type: evidence.type,
        severity: discovered ? evidence.severity : "sealed",
        tags: evidence.tags,
        discovered,
        latestDiscovery,
        discoveryOrder: discovered ? discoveryOrder + 1 : null,
        sourceOperations: discovered ? sourceOperations : "Source unknown",
        sourceFamilies: discovered ? sourceFamilies : "Family restricted",
        officialClassification: discovered ? evidence.officialClassification : "Classification pending field discovery.",
        publicSummary: discovered ? evidence.publicSummary : "Contractor-facing summary has been redacted.",
        restrictedSummary: discovered && state.lumenTruth >= 3 ? evidence.restrictedSummary : "Restricted note pending review.",
        hiddenImplication: hiddenImplicationVisible ? evidence.hiddenImplication : "Unresolved note restricted pending review.",
        hiddenImplicationVisible,
        unlockConditionText: evidence.unlockConditionText,
        discoveryHint: evidence.discoveryHint,
        meterEffects: `Compliance +${evidence.meterEffects.compliance} | Truth +${evidence.meterEffects.truth} | Suspicion +${evidence.meterEffects.suspicion}`,
        relatedOperations: evidence.relatedOperations
          .map((id) => campaignOperations.find((operation) => operation.id === id)?.title ?? id)
          .join(" / "),
        relatedNextAction: evidence.relatedNextAction,
        sealedSummary: "TYCHOSTAR access restricted.",
      };
    })
    .sort((left, right) => Number(right.discovered) - Number(left.discovered) || (left.discoveryOrder ?? 999) - (right.discoveryOrder ?? 999));
}

function buildNextActionLines(state: CampaignProgressState, activeOperation: CampaignOperationView, recommendedOperation: CampaignOperationView): string[] {
  const lines = [`Next: ${recommendedOperation.title} - ${recommendedOperation.corporateObjective}`];
  lines.push(`Recommended family: ${activeOperation.families}`);
  if (activeOperation.id === "regolith-trace" || recommendedOperation.id === "regolith-trace") {
    lines.push("Prepare: fabricate Essence Flare before Regolith Trace.");
  }
  if (activeOperation.id === "tycho-scar" || recommendedOperation.id === "tycho-scar") {
    lines.push("Ship: cargo readiness recommended for Tycho Scar.");
  }
  if (activeOperation.id === "mare-vanta-relay" || recommendedOperation.id === "mare-vanta-relay") {
    lines.push("Loadout: Systems Specialist favored for relay operation.");
  }
  if (state.corporateSuspicion >= 3) {
    lines.push("Compliance: keep optional recoveries clean; review pending.");
  }
  return lines.slice(0, 4);
}

function buildDeltaLines(
  operationAdvanced: CampaignOperationId,
  operationCompleted: boolean,
  nextOperationId: CampaignOperationId,
  compliance: number,
  truth: number,
  suspicion: number,
  newlyUnlockedOperationIds: CampaignOperationId[],
  discoveredEvidenceIds: CampaignEvidenceId[],
  reasons: string[],
): string[] {
  const operation = campaignOperations.find((candidate) => candidate.id === operationAdvanced);
  const next = campaignOperations.find((candidate) => candidate.id === nextOperationId);
  const lines = [
    `${operationCompleted ? "Operation Complete" : "Operation Advanced"}: ${operation?.title ?? operationAdvanced}`,
    compliance > 0 ? `Compliance +${compliance} - ${reasons.find((reason) => reason.includes("Primary") || reason.includes("Extraction") || reason.includes("Heavy")) ?? "assets entered custody"}` : "",
    truth > 0 ? `Truth +${truth} - ${reasons.find((reason) => reason.includes("Lumen") || reason.includes("Signal") || reason.includes("data")) ?? "anomaly logged"}` : "",
    suspicion > 0 ? `Suspicion +${suspicion} - anomaly report pending` : "",
    discoveredEvidenceIds.length > 0 ? `Evidence Discovered: ${discoveredEvidenceIds.map((id) => campaignEvidenceById[id].title).join(", ")}` : "",
    ...newlyUnlockedOperationIds.map((id) => `New Operation Available: ${campaignOperations.find((candidate) => candidate.id === id)?.title ?? id}`),
    `Next Operation: ${next?.title ?? nextOperationId}`,
  ];
  return lines.filter(Boolean);
}

function getOperationStatus(operationId: CampaignOperationId, state: CampaignProgressState): OperationStatus {
  if (state.currentOperationId === operationId) return "active";
  if (state.completedOperationIds.includes(operationId)) return "completed";
  return isOperationUnlocked(operationId, state) ? "available" : "locked";
}

function isOperationUnlocked(operationId: CampaignOperationId, state: CampaignProgressState): boolean {
  if (operationId === "orbital-liability") return true;
  if (operationId === "tycho-scar") return state.totalRaidsExtracted >= 1 || state.primaryObjectivesCompleted >= 1;
  if (operationId === "mare-vanta-relay") return state.poiContractsCompleted >= 1 || state.primaryObjectivesCompleted >= 1;
  if (operationId === "regolith-trace") return state.lumenEvidenceRecovered >= 1 || state.lumenTruth >= 1 || state.discoveredEvidenceIds.some((id) => campaignEvidenceById[id]?.sourceOperationId === "regolith-trace");
  if (operationId === "company-silence") return state.completedOperationIds.length >= 3 || state.lumenTruth >= 3;
  return false;
}

function getUnlockedOperationIds(state: CampaignProgressState): CampaignOperationId[] {
  return campaignOperations.filter((operation) => isOperationUnlocked(operation.id, state)).map((operation) => operation.id);
}

function reasonForOperation(operationId: CampaignOperationId, state: CampaignProgressState): string {
  if (state.currentOperationId === operationId) return "Selected for the next sortie.";
  if (state.completedOperationIds.includes(operationId)) return "Complete. Replay remains authorized.";
  if (isOperationUnlocked(operationId, state)) return "Available for assignment.";
  if (operationId === "tycho-scar") return "Complete one extraction or primary objective.";
  if (operationId === "mare-vanta-relay") return "Complete a POI objective or primary objective.";
  if (operationId === "regolith-trace") return "Recover Lumen material or use reveal tools successfully.";
  if (operationId === "company-silence") return "Raise Lumen Truth or complete Act I operations.";
  return "Locked by campaign order.";
}

function progressRequirementForOperation(operationId: CampaignOperationId): string {
  if (operationId === "orbital-liability") return "Recover salvage, black box data, or cache manifests.";
  if (operationId === "tycho-scar") return "Secure heavy cargo or complete a heavy cargo retrieval.";
  if (operationId === "mare-vanta-relay") return "Complete signal, relay, hack, or POI objective work.";
  if (operationId === "regolith-trace") return "Recover Lumen material, scanner data, or survey evidence.";
  return "Recover evidence that contradicts the TYCHOSTAR incident file.";
}

function recommendationReasonForOperation(operationId: CampaignOperationId, state: CampaignProgressState): string {
  if (operationId === "orbital-liability") return "Starter liability recovery keeps company property moving.";
  if (operationId === "tycho-scar") return state.heavyCargoSecuredCount === 0 ? "Cargo recovery is the fastest Act I compliance path." : "Cargo resonance evidence remains useful.";
  if (operationId === "mare-vanta-relay") return "Relay work turns POI progress into campaign signal data.";
  if (operationId === "regolith-trace") return "Lumen contact is rising; survey gear should be prepared.";
  return "Evidence custody is the final Act I pressure point.";
}

function getRecommendedOperationId(state: CampaignProgressState): CampaignOperationId {
  if (isOperationUnlocked(state.currentOperationId, state) && !state.completedOperationIds.includes(state.currentOperationId)) {
    return state.currentOperationId;
  }

  for (const operation of campaignOperations) {
    if (!state.completedOperationIds.includes(operation.id) && isOperationUnlocked(operation.id, state)) {
      return operation.id;
    }
  }
  return "company-silence";
}

function sanitizeCampaignState(parsed: Partial<CampaignProgressState>, onRecover?: (reason: string) => void): CampaignProgressState {
  const recover = (reason: string) => onRecover?.(reason);
  if (parsed.version !== 1) {
    recover("schema-version");
    return { ...defaultCampaignState };
  }

  const currentActId = isCampaignActId(parsed.currentActId) ? parsed.currentActId : defaultCampaignState.currentActId;
  const currentOperationId = isCampaignOperationId(parsed.currentOperationId) ? parsed.currentOperationId : defaultCampaignState.currentOperationId;
  if (currentActId !== parsed.currentActId) recover("current-act");
  if (currentOperationId !== parsed.currentOperationId) recover("selected-operation");

  const completedOperationIds = sanitizeOperationIds(parsed.completedOperationIds, recover);
  const discoveredEvidenceIds = sanitizeEvidenceIds(parsed.discoveredEvidenceIds, recover);
  const lastDiscoveredEvidenceIds = sanitizeEvidenceIds(parsed.lastDiscoveredEvidenceIds, recover);
  const lastUnlockedOperationIds = sanitizeOperationIds(parsed.lastUnlockedOperationIds, recover);

  return {
    ...defaultCampaignState,
    ...parsed,
    version: 1,
    currentActId,
    currentOperationId,
    completedOperationIds,
    completedContractIds: Array.isArray(parsed.completedContractIds) ? parsed.completedContractIds.filter((id): id is string => typeof id === "string") : [],
    discoveredEvidenceIds,
    lastDiscoveredEvidenceIds,
    lastUnlockedOperationIds,
    totalRaidsExtracted: finiteNumber(parsed.totalRaidsExtracted, defaultCampaignState.totalRaidsExtracted, recover, "total-raids"),
    primaryObjectivesCompleted: finiteNumber(parsed.primaryObjectivesCompleted, defaultCampaignState.primaryObjectivesCompleted, recover, "primary-objectives"),
    poiContractsCompleted: finiteNumber(parsed.poiContractsCompleted, defaultCampaignState.poiContractsCompleted, recover, "poi-contracts"),
    rewardCachesClaimed: finiteNumber(parsed.rewardCachesClaimed, defaultCampaignState.rewardCachesClaimed, recover, "reward-caches"),
    heavyCargoSecuredCount: finiteNumber(parsed.heavyCargoSecuredCount, defaultCampaignState.heavyCargoSecuredCount, recover, "heavy-cargo"),
    lumenEvidenceRecovered: finiteNumber(parsed.lumenEvidenceRecovered, defaultCampaignState.lumenEvidenceRecovered, recover, "lumen-evidence"),
    corporateCompliance: clampMeter(finiteNumber(parsed.corporateCompliance, defaultCampaignState.corporateCompliance, recover, "compliance")),
    lumenTruth: clampMeter(finiteNumber(parsed.lumenTruth, defaultCampaignState.lumenTruth, recover, "truth")),
    corporateSuspicion: clampMeter(finiteNumber(parsed.corporateSuspicion, defaultCampaignState.corporateSuspicion, recover, "suspicion")),
    lastRaidResultSummary: typeof parsed.lastRaidResultSummary === "string" ? parsed.lastRaidResultSummary : null,
    lastAppliedResultKey: typeof parsed.lastAppliedResultKey === "string" ? parsed.lastAppliedResultKey : null,
    lastDelta: sanitizeDelta(parsed.lastDelta),
  };
}

function sanitizeDelta(delta: CampaignProgressDelta | null | undefined): CampaignProgressDelta | null {
  if (!delta || !isCampaignOperationId(delta.operationAdvanced) || !isCampaignOperationId(delta.nextOperationId)) return null;
  return {
    compliance: clampMeter(Number.isFinite(delta.compliance) ? delta.compliance : 0),
    truth: clampMeter(Number.isFinite(delta.truth) ? delta.truth : 0),
    suspicion: clampMeter(Number.isFinite(delta.suspicion) ? delta.suspicion : 0),
    operationAdvanced: delta.operationAdvanced,
    operationCompleted: Boolean(delta.operationCompleted),
    nextOperationId: delta.nextOperationId,
    newlyUnlockedOperationIds: sanitizeOperationIds(delta.newlyUnlockedOperationIds),
    discoveredEvidenceIds: sanitizeEvidenceIds(delta.discoveredEvidenceIds),
    reasons: Array.isArray(delta.reasons) ? delta.reasons.filter((line): line is string => typeof line === "string").slice(0, 8) : [],
    lines: Array.isArray(delta.lines) ? delta.lines.filter((line): line is string => typeof line === "string").slice(0, 8) : [],
  };
}

function sanitizeOperationIds(ids: unknown, recover?: (reason: string) => void): CampaignOperationId[] {
  if (!Array.isArray(ids)) return [];
  const filtered = ids.filter(isCampaignOperationId);
  if (filtered.length !== ids.length) recover?.("operation-array");
  return [...new Set(filtered)];
}

function sanitizeEvidenceIds(ids: unknown, recover?: (reason: string) => void): CampaignEvidenceId[] {
  if (!Array.isArray(ids)) return [];
  const filtered = ids.filter(isCampaignEvidenceId);
  if (filtered.length !== ids.length) recover?.("evidence-array");
  return [...new Set(filtered)];
}

function isCampaignActId(id: unknown): id is CampaignActId {
  return typeof id === "string" && id in campaignActById;
}

function isCampaignOperationId(id: unknown): id is CampaignOperationId {
  return typeof id === "string" && campaignOperations.some((operation) => operation.id === id);
}

function finiteNumber(value: unknown, fallback: number, recover?: (reason: string) => void, reason = "number"): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (value !== undefined) recover?.(reason);
  return fallback;
}

function clampMeter(value: number): number {
  return Math.min(maxMeterValue, Math.max(0, Math.floor(value)));
}

function complianceBand(value: number): string {
  if (value >= 8) return "company-aligned";
  if (value >= 5) return "trusted field asset";
  if (value >= 2) return "acceptable";
  return "unproven contractor";
}

function truthBand(value: number): string {
  if (value >= 9) return "suppressed intelligence";
  if (value >= 6) return "classified contradiction";
  if (value >= 3) return "pattern emerging";
  if (value >= 1) return "trace anomalies";
  return "none logged";
}

function suspicionBand(value: number): string {
  if (value >= 9) return "internal watchlist";
  if (value >= 6) return "compliance review";
  if (value >= 3) return "behavior flagged";
  if (value >= 1) return "anomaly report pending";
  return "none";
}

function deltaReason(delta: CampaignProgressDelta | null, meter: "compliance" | "truth" | "suspicion"): string {
  if (!delta) return "No prior raid delta.";
  if (meter === "compliance" && delta.compliance > 0) return delta.reasons.find((reason) => reason.includes("Primary") || reason.includes("Extraction") || reason.includes("Heavy")) ?? "Assets entered custody.";
  if (meter === "truth" && delta.truth > 0) return delta.reasons.find((reason) => reason.includes("Lumen") || reason.includes("Signal") || reason.includes("data")) ?? "Anomaly logged.";
  if (meter === "suspicion" && delta.suspicion > 0) return "Corporate anomaly report pending.";
  return "No change last raid.";
}

function cloneState(state: CampaignProgressState): CampaignProgressState {
  return {
    ...state,
    completedOperationIds: [...state.completedOperationIds],
    completedContractIds: [...state.completedContractIds],
    discoveredEvidenceIds: [...state.discoveredEvidenceIds],
    lastDiscoveredEvidenceIds: [...state.lastDiscoveredEvidenceIds],
    lastUnlockedOperationIds: [...state.lastUnlockedOperationIds],
    lastDelta: state.lastDelta ? {
      ...state.lastDelta,
      newlyUnlockedOperationIds: [...state.lastDelta.newlyUnlockedOperationIds],
      discoveredEvidenceIds: [...state.lastDelta.discoveredEvidenceIds],
      reasons: [...state.lastDelta.reasons],
      lines: [...state.lastDelta.lines],
    } : null,
  };
}
