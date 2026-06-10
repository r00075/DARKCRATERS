import type { CampaignActId, CampaignOperationId } from "./CampaignDefinitions";
import type { MissionFamilyId } from "../raid/MissionDefinitions";
import type { RaidResultPresentation } from "../raid/RaidResultPresentation";

export type CampaignEvidenceType =
  | "corporate-data"
  | "lumen-residue"
  | "signal-fragment"
  | "crew-log"
  | "black-box"
  | "biological-sample"
  | "mineral-anomaly"
  | "field-memory"
  | "restricted-order";

export type CampaignEvidenceId =
  | "black-box-discrepancy"
  | "lumen-residue-sample"
  | "mare-vanta-signal-fragment"
  | "scanner-battery-archive"
  | "he3-core-resonance"
  | "sealed-cache-manifest"
  | "crew-memory-report"
  | "restricted-recovery-order"
  | "mineral-behavior-anomaly";

export type CampaignEvidenceSeverity = "routine" | "anomalous" | "restricted" | "contradictory" | "suppressed";

export type CampaignEvidenceDefinition = Readonly<{
  id: CampaignEvidenceId;
  title: string;
  type: CampaignEvidenceType;
  actId: CampaignActId;
  sourceOperationId: CampaignOperationId;
  sourceOperationIds: CampaignOperationId[];
  sourceMissionFamilyIds: MissionFamilyId[];
  officialLabel: string;
  officialClassification: string;
  publicSummary: string;
  restrictedSummary: string;
  hiddenImplication: string;
  discoveryHint: string;
  unlockConditionText: string;
  complianceEffect: number;
  truthEffect: number;
  suspicionEffect: number;
  meterEffects: {
    compliance: number;
    truth: number;
    suspicion: number;
  };
  severity: CampaignEvidenceSeverity;
  tags: string[];
  relatedOperations: CampaignOperationId[];
  relatedNextAction: string;
  unlockHint: string;
}>;

export type CampaignEvidenceDiscovery = Readonly<{
  id: CampaignEvidenceId;
  source: string;
  reason: string;
}>;

export const campaignEvidenceDefinitions: readonly CampaignEvidenceDefinition[] = [
  {
    id: "black-box-discrepancy",
    title: "Black Box Discrepancy",
    type: "black-box",
    actId: "act-1",
    sourceOperationId: "orbital-liability",
    sourceOperationIds: ["orbital-liability"],
    sourceMissionFamilyIds: ["salvage-recovery", "evidence-lore-recovery"],
    officialLabel: "Recovered industrial flight data.",
    officialClassification: "Recovered industrial flight data.",
    publicSummary: "TYCHOSTAR lists the record as salvage liability data from an equipment impact.",
    restrictedSummary: "Telemetry gap exceeds approved crash-model tolerance.",
    hiddenImplication: "Impact telemetry contains a second signal beneath the crash tone.",
    discoveryHint: "Recover a black box or encrypted data cache.",
    unlockConditionText: "Recover black box survey cargo or encrypted data.",
    complianceEffect: 1,
    truthEffect: 1,
    suspicionEffect: 0,
    meterEffects: { compliance: 1, truth: 1, suspicion: 0 },
    severity: "contradictory",
    tags: ["black-box", "telemetry", "salvage"],
    relatedOperations: ["orbital-liability", "company-silence"],
    relatedNextAction: "Review salvage and evidence contracts for missing incident records.",
    unlockHint: "Recover a black box or encrypted data cache.",
  },
  {
    id: "lumen-residue-sample",
    title: "Lumen Residue Sample",
    type: "lumen-residue",
    actId: "act-1",
    sourceOperationId: "regolith-trace",
    sourceOperationIds: ["regolith-trace"],
    sourceMissionFamilyIds: ["lumen-survey"],
    officialLabel: "Luminescent mineral contamination.",
    officialClassification: "Luminescent mineral contamination.",
    publicSummary: "Residue is filed as non-biological interference attached to field equipment.",
    restrictedSummary: "Sample response changes after repeated traversal near the recovery site.",
    hiddenImplication: "Residue reacts to repeated routes like memory.",
    discoveryHint: "Extract Lumen Essence or relic material.",
    unlockConditionText: "Recover Lumen material.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 1,
    meterEffects: { compliance: 0, truth: 1, suspicion: 1 },
    severity: "anomalous",
    tags: ["lumen", "residue", "survey"],
    relatedOperations: ["regolith-trace"],
    relatedNextAction: "Prepare Essence Flare and continue Regolith Trace survey work.",
    unlockHint: "Extract Lumen Essence or relic material.",
  },
  {
    id: "mare-vanta-signal-fragment",
    title: "Signal Fragment: Mare Vanta",
    type: "signal-fragment",
    actId: "act-1",
    sourceOperationId: "mare-vanta-relay",
    sourceOperationIds: ["mare-vanta-relay"],
    sourceMissionFamilyIds: ["signal-restore"],
    officialLabel: "Relay noise archived.",
    officialClassification: "Relay noise archived.",
    publicSummary: "A relay fragment was stored as equipment interference after field extraction.",
    restrictedSummary: "The fragment repeats after movement, not relay timing.",
    hiddenImplication: "Pattern repeats after field movement, not transmitter pulse.",
    discoveryHint: "Complete or extract from a signal restore operation.",
    unlockConditionText: "Complete signal operation.",
    complianceEffect: 1,
    truthEffect: 1,
    suspicionEffect: 0,
    meterEffects: { compliance: 1, truth: 1, suspicion: 0 },
    severity: "contradictory",
    tags: ["signal", "relay", "mare-vanta"],
    relatedOperations: ["mare-vanta-relay", "regolith-trace"],
    relatedNextAction: "Assign a signal restore contract and compare relay timing.",
    unlockHint: "Complete or extract from a signal restore operation.",
  },
  {
    id: "scanner-battery-archive",
    title: "Scanner Battery Archive",
    type: "corporate-data",
    actId: "act-1",
    sourceOperationId: "regolith-trace",
    sourceOperationIds: ["regolith-trace"],
    sourceMissionFamilyIds: ["lumen-survey", "salvage-recovery"],
    officialLabel: "Utility cell recovered for scanner service.",
    officialClassification: "Utility cell recovered for scanner service.",
    publicSummary: "Battery telemetry was added to scanner maintenance records.",
    restrictedSummary: "Charge decay includes an unassigned pulse cadence.",
    hiddenImplication: "Charge decay includes a pulse outside TYCHOSTAR calibration tables.",
    discoveryHint: "Recover a Scanner Battery.",
    unlockConditionText: "Recover scanner utility material.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 0,
    meterEffects: { compliance: 0, truth: 1, suspicion: 0 },
    severity: "routine",
    tags: ["scanner", "utility", "battery"],
    relatedOperations: ["regolith-trace"],
    relatedNextAction: "Keep scanner utility stocked before Lumen survey assignments.",
    unlockHint: "Recover a Scanner Battery.",
  },
  {
    id: "he3-core-resonance",
    title: "He-3 Core Resonance",
    type: "mineral-anomaly",
    actId: "act-1",
    sourceOperationId: "tycho-scar",
    sourceOperationIds: ["tycho-scar"],
    sourceMissionFamilyIds: ["heavy-cargo-retrieval"],
    officialLabel: "Extraction hardware secured for cradle transfer.",
    officialClassification: "Extraction hardware secured for cradle transfer.",
    publicSummary: "Helium-3 extraction equipment was secured and marked for industrial review.",
    restrictedSummary: "Core vibration carried a harmonic absent from mining equipment logs.",
    hiddenImplication: "Core resonance does not match equipment exposure logs.",
    discoveryHint: "Secure heavy cargo.",
    unlockConditionText: "Secure heavy cargo under field pressure.",
    complianceEffect: 1,
    truthEffect: 1,
    suspicionEffect: 1,
    meterEffects: { compliance: 1, truth: 1, suspicion: 1 },
    severity: "contradictory",
    tags: ["he3", "cargo", "resonance"],
    relatedOperations: ["tycho-scar", "company-silence"],
    relatedNextAction: "Inspect Kestrel-9 cargo readiness before another Tycho Scar run.",
    unlockHint: "Secure heavy cargo.",
  },
  {
    id: "sealed-cache-manifest",
    title: "Sealed Cache Manifest",
    type: "corporate-data",
    actId: "act-1",
    sourceOperationId: "orbital-liability",
    sourceOperationIds: ["orbital-liability"],
    sourceMissionFamilyIds: ["salvage-recovery", "evidence-lore-recovery"],
    officialLabel: "Reward cache manifest entered custody.",
    officialClassification: "Reward cache manifest entered custody.",
    publicSummary: "Cache contents were recorded as routine contractor compensation.",
    restrictedSummary: "Manifest date precedes the crater work order.",
    hiddenImplication: "The cache predates the crater work order.",
    discoveryHint: "Claim multiple reward caches.",
    unlockConditionText: "Claim sealed reward cache.",
    complianceEffect: 1,
    truthEffect: 0,
    suspicionEffect: 0,
    meterEffects: { compliance: 1, truth: 0, suspicion: 0 },
    severity: "anomalous",
    tags: ["cache", "manifest", "salvage"],
    relatedOperations: ["orbital-liability"],
    relatedNextAction: "Continue POI reward cache recovery for liability records.",
    unlockHint: "Claim multiple reward caches.",
  },
  {
    id: "crew-memory-report",
    title: "Crew Memory Report",
    type: "field-memory",
    actId: "act-1",
    sourceOperationId: "company-silence",
    sourceOperationIds: ["company-silence"],
    sourceMissionFamilyIds: ["evidence-lore-recovery"],
    officialLabel: "Crew testimony filed as non-admissible stress response.",
    officialClassification: "Crew testimony filed as non-admissible stress response.",
    publicSummary: "Contractor-facing testimony was archived under field safety policy.",
    restrictedSummary: "Separate crews report the same impossible return route.",
    hiddenImplication: "Multiple reports describe the same impossible route.",
    discoveryHint: "Complete evidence recovery after Lumen Truth rises.",
    unlockConditionText: "Complete evidence recovery after truth rises.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 1,
    meterEffects: { compliance: 0, truth: 1, suspicion: 1 },
    severity: "suppressed",
    tags: ["crew", "memory", "route"],
    relatedOperations: ["company-silence", "regolith-trace"],
    relatedNextAction: "Review Company Silence evidence before Act II contamination work.",
    unlockHint: "Complete evidence recovery after Lumen Truth rises.",
  },
  {
    id: "restricted-recovery-order",
    title: "Restricted Recovery Order",
    type: "restricted-order",
    actId: "act-1",
    sourceOperationId: "company-silence",
    sourceOperationIds: ["company-silence"],
    sourceMissionFamilyIds: ["evidence-lore-recovery"],
    officialLabel: "TYCHOSTAR custody directive recovered.",
    officialClassification: "TYCHOSTAR custody directive recovered.",
    publicSummary: "Recovered order confirms company custody over field evidence.",
    restrictedSummary: "The directive was issued before the incident report existed.",
    hiddenImplication: "The directive was issued before the incident report existed.",
    discoveryHint: "Complete an evidence recovery sortie.",
    unlockConditionText: "Recover restricted evidence order.",
    complianceEffect: 1,
    truthEffect: 1,
    suspicionEffect: 1,
    meterEffects: { compliance: 1, truth: 1, suspicion: 1 },
    severity: "restricted",
    tags: ["restricted", "order", "custody"],
    relatedOperations: ["company-silence"],
    relatedNextAction: "Advance Company Silence to resolve custody contradictions.",
    unlockHint: "Complete an evidence recovery sortie.",
  },
  {
    id: "mineral-behavior-anomaly",
    title: "Mineral Behavior Anomaly",
    type: "biological-sample",
    actId: "act-1",
    sourceOperationId: "regolith-trace",
    sourceOperationIds: ["regolith-trace"],
    sourceMissionFamilyIds: ["lumen-survey"],
    officialLabel: "Non-biological interference sample logged.",
    officialClassification: "Non-biological interference sample logged.",
    publicSummary: "Sample is classified as geological interference pending lab review.",
    restrictedSummary: "The sample changes after nearby movement stops.",
    hiddenImplication: "The sample changes after nearby movement stops.",
    discoveryHint: "Recover Lumen material or finish a survey sortie.",
    unlockConditionText: "Recover Lumen material or finish survey work.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 1,
    meterEffects: { compliance: 0, truth: 1, suspicion: 1 },
    severity: "anomalous",
    tags: ["sample", "lumen", "movement"],
    relatedOperations: ["regolith-trace"],
    relatedNextAction: "Continue Regolith Trace with reveal tools prepared.",
    unlockHint: "Recover Lumen material or finish a survey sortie.",
  },
];

export const campaignEvidenceById = Object.fromEntries(
  campaignEvidenceDefinitions.map((evidence) => [evidence.id, evidence]),
) as Record<CampaignEvidenceId, CampaignEvidenceDefinition>;

export function discoverEvidenceFromRaid(result: RaidResultPresentation): CampaignEvidenceDiscovery[] {
  const discoveries: CampaignEvidenceDiscovery[] = [];
  const hasItem = (type: string) => result.recoveredItems.some((item) => item.type === type && item.quantity > 0);
  const family = result.familyName.toLowerCase();
  const title = result.missionTitle.toLowerCase();
  const missionId = result.missionId.toLowerCase();
  const primaryComplete = result.result === "complete" || result.result === "partial";

  if (hasItem("black-box-survey-crate") || hasItem("encrypted-data")) {
    discoveries.push({ id: "black-box-discrepancy", source: "recovered-data", reason: "Black box or encrypted data recovered" });
  }
  if (hasItem("lumen-essence") || hasItem("lumen-relic-mass")) {
    discoveries.push({ id: "lumen-residue-sample", source: "lumen-material", reason: "Lumen material recovered" });
    discoveries.push({ id: "mineral-behavior-anomaly", source: "lumen-material", reason: "Lumen material behavior logged" });
  }
  if (hasItem("scanner-battery")) {
    discoveries.push({ id: "scanner-battery-archive", source: "scanner-battery", reason: "Scanner Battery recovered" });
  }
  if (result.heavyCargoStatus.toLowerCase().includes("recovered") || result.heavyCargoStatus.toLowerCase().includes("secured")) {
    discoveries.push({ id: "he3-core-resonance", source: "heavy-cargo", reason: "Heavy cargo secured" });
  }
  if (result.rewardCachesClaimed >= 2) {
    discoveries.push({ id: "sealed-cache-manifest", source: "reward-cache", reason: "Multiple reward caches claimed" });
  }
  if (family.includes("signal") || title.includes("relay") || title.includes("signal")) {
    discoveries.push({ id: "mare-vanta-signal-fragment", source: "signal-operation", reason: primaryComplete ? "Signal objective completed" : "Signal sortie extracted" });
  }
  if (family.includes("evidence") && primaryComplete) {
    discoveries.push({ id: "restricted-recovery-order", source: "evidence-operation", reason: "Evidence operation completed" });
    discoveries.push({ id: "crew-memory-report", source: "evidence-operation", reason: "Crew report entered custody" });
  }
  if (primaryComplete) {
    if (missionId.includes("evidence-core-harmonic-audit")) {
      discoveries.push({ id: "he3-core-resonance", source: "evidence-contract", reason: "Core harmonic audit completed" });
    }
    if (missionId.includes("evidence-sealed-manifest-verification")) {
      discoveries.push({ id: "sealed-cache-manifest", source: "evidence-contract", reason: "Sealed manifest verified" });
    }
    if (missionId.includes("evidence-residue-survey-sweep")) {
      discoveries.push({ id: "lumen-residue-sample", source: "survey-contract", reason: "Residue survey trace recorded" });
    }
    if (missionId.includes("evidence-mineral-behavior-trial")) {
      discoveries.push({ id: "mineral-behavior-anomaly", source: "survey-contract", reason: "Mineral behavior trial completed" });
    }
    if (missionId.includes("evidence-relay-cadence-discrepancy")) {
      discoveries.push({ id: "mare-vanta-signal-fragment", source: "signal-contract", reason: "Relay cadence discrepancy archived" });
    }
    if (missionId.includes("evidence-black-box-contradiction")) {
      discoveries.push({ id: "black-box-discrepancy", source: "evidence-contract", reason: "Black box contradiction recovered" });
    }
    if (missionId.includes("evidence-quiet-order-contact")) {
      discoveries.push({ id: "crew-memory-report", source: "quiet-order-contact", reason: "Quiet Order field memory logged" });
    }
  }

  return [...new Map(discoveries.map((discovery) => [discovery.id, discovery])).values()];
}

export function isCampaignEvidenceId(id: unknown): id is CampaignEvidenceId {
  return typeof id === "string" && id in campaignEvidenceById;
}
