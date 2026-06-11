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
  | "memory-matter"
  | "resonance"
  | "classified-history"
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
  | "mineral-behavior-anomaly"
  | "structured-residue-pattern"
  | "memory-matter-trace"
  | "resonance-pattern-fragment"
  | "impact-fracture-signal"
  | "apollo-residue-anomaly"
  | "historical-signal-match"
  | "lcross-targeting-discrepancy"
  | "blc1-warning-fragment";

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
    restrictedSummary: "Sample response changes after repeated traversal near the recovery site; patterning resembles stored recall.",
    hiddenImplication: "Residue reacts to repeated routes like biological memory.",
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
    restrictedSummary: "The fragment repeats after movement, not relay timing; return path suggests terrain-borne communication.",
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
    restrictedSummary: "The sample changes after nearby movement stops, as if observing before responding.",
    hiddenImplication: "The sample changes after nearby movement stops; Lunar Tick traces may be information gathering, not predation.",
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
  {
    id: "structured-residue-pattern",
    title: "Structured Residue Pattern",
    type: "memory-matter",
    actId: "act-1",
    sourceOperationId: "regolith-trace",
    sourceOperationIds: ["regolith-trace"],
    sourceMissionFamilyIds: ["lumen-survey"],
    officialLabel: "Mineral-organic contamination.",
    officialClassification: "Mineral-organic contamination.",
    publicSummary: "Survey residue was logged as non-extractive substrate attached to field equipment.",
    restrictedSummary: "Pattern repetition survives movement, flare pulses, and equipment shutdown.",
    hiddenImplication: "The residue repeats like stored information, not random growth.",
    discoveryHint: "Complete a Lumen survey field or residue evidence contract.",
    unlockConditionText: "Archive a survey field response.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 1,
    meterEffects: { compliance: 0, truth: 1, suspicion: 1 },
    severity: "anomalous",
    tags: ["lumen", "memory", "residue", "survey"],
    relatedOperations: ["regolith-trace", "company-silence"],
    relatedNextAction: "Compare residue pattern against Memory Matter traces in the Codex.",
    unlockHint: "Complete a Lumen survey field or residue evidence contract.",
  },
  {
    id: "memory-matter-trace",
    title: "Memory Matter Trace",
    type: "memory-matter",
    actId: "act-1",
    sourceOperationId: "regolith-trace",
    sourceOperationIds: ["regolith-trace", "company-silence"],
    sourceMissionFamilyIds: ["lumen-survey", "evidence-lore-recovery"],
    officialLabel: "Biological substrate anomaly.",
    officialClassification: "Biological substrate anomaly.",
    publicSummary: "TYCHOSTAR flags the sample as a bio-risk trace with no approved cultural inference.",
    restrictedSummary: "Tissue response preserves field events after the original stimulus ends.",
    hiddenImplication: "The sample may be memory-bearing tissue, an archive rather than a hazard.",
    discoveryHint: "Complete a memory residue survey or Quiet Order evidence contact.",
    unlockConditionText: "Recover a Memory Matter trace through survey/evidence work.",
    complianceEffect: 0,
    truthEffect: 2,
    suspicionEffect: 1,
    meterEffects: { compliance: 0, truth: 2, suspicion: 1 },
    severity: "contradictory",
    tags: ["lumen", "memory", "archive", "substrate"],
    relatedOperations: ["regolith-trace", "company-silence"],
    relatedNextAction: "Search data-shack archives for pre-mining signal matches.",
    unlockHint: "Complete a memory residue survey or Quiet Order evidence contact.",
  },
  {
    id: "resonance-pattern-fragment",
    title: "Resonance Pattern Fragment",
    type: "resonance",
    actId: "act-1",
    sourceOperationId: "mare-vanta-relay",
    sourceOperationIds: ["mare-vanta-relay", "regolith-trace"],
    sourceMissionFamilyIds: ["signal-restore", "lumen-survey"],
    officialLabel: "Seismic artifact fragment.",
    officialClassification: "Seismic artifact fragment.",
    publicSummary: "Signal returns were filed as equipment reflection and local seismic noise.",
    restrictedSummary: "The response cadence arrives through terrain and repeats after no transmitter fires.",
    hiddenImplication: "The Moon may be carrying a terrain-borne transmission through rock.",
    discoveryHint: "Complete a relay/signal sortie or resonance survey field.",
    unlockConditionText: "Archive a resonance or relay contradiction.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 0,
    meterEffects: { compliance: 0, truth: 1, suspicion: 0 },
    severity: "contradictory",
    tags: ["signal", "resonance", "relay", "terrain"],
    relatedOperations: ["mare-vanta-relay", "regolith-trace"],
    relatedNextAction: "Compare resonance fragment with relay data.",
    unlockHint: "Complete a relay/signal sortie or resonance survey field.",
  },
  {
    id: "impact-fracture-signal",
    title: "Impact Fracture Signal",
    type: "resonance",
    actId: "act-1",
    sourceOperationId: "company-silence",
    sourceOperationIds: ["regolith-trace", "company-silence"],
    sourceMissionFamilyIds: ["lumen-survey", "evidence-lore-recovery"],
    officialLabel: "Unauthorized resonance in impact fracture.",
    officialClassification: "Unauthorized resonance in impact fracture.",
    publicSummary: "Field staff are instructed to classify the trace as geological noise.",
    restrictedSummary: "The signal behaves like a relay path through impact fractures.",
    hiddenImplication: "Fractures may connect to a Deep Network below the mapped crater.",
    discoveryHint: "Complete fracture signal survey or restricted evidence work.",
    unlockConditionText: "Archive an impact-fracture response.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 1,
    meterEffects: { compliance: 0, truth: 1, suspicion: 1 },
    severity: "restricted",
    tags: ["signal", "resonance", "fracture", "deep-network"],
    relatedOperations: ["regolith-trace", "company-silence"],
    relatedNextAction: "Recover sealed impact survey records.",
    unlockHint: "Complete fracture signal survey or restricted evidence work.",
  },
  {
    id: "apollo-residue-anomaly",
    title: "Apollo Residue Anomaly",
    type: "classified-history",
    actId: "act-1",
    sourceOperationId: "orbital-liability",
    sourceOperationIds: ["orbital-liability", "company-silence"],
    sourceMissionFamilyIds: ["salvage-recovery", "evidence-lore-recovery"],
    officialLabel: "Legacy program contamination note.",
    officialClassification: "Legacy program contamination note.",
    publicSummary: "A pre-mining sample-era trace was sealed as unrelated historical residue.",
    restrictedSummary: "Human biological material appears in Lumen-reactive records decades before current extraction.",
    hiddenImplication: "The first contact thread may predate TYCHOSTAR crater work.",
    discoveryHint: "Recover black box data or sealed pre-mining records.",
    unlockConditionText: "Recover legacy survey evidence.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 1,
    meterEffects: { compliance: 0, truth: 1, suspicion: 1 },
    severity: "suppressed",
    tags: ["classified", "apollo", "legacy", "first-contact"],
    relatedOperations: ["orbital-liability", "company-silence"],
    relatedNextAction: "Search data-shack archives for pre-mining biological traces.",
    unlockHint: "Recover black box data or sealed pre-mining records.",
  },
  {
    id: "historical-signal-match",
    title: "Historical Signal Match",
    type: "classified-history",
    actId: "act-1",
    sourceOperationId: "mare-vanta-relay",
    sourceOperationIds: ["mare-vanta-relay", "regolith-trace"],
    sourceMissionFamilyIds: ["signal-restore", "lumen-survey"],
    officialLabel: "Inadmissible radio correlation.",
    officialClassification: "Inadmissible radio correlation.",
    publicSummary: "TYCHOSTAR labels the old signal match as unrelated terrestrial archive noise.",
    restrictedSummary: "Current resonance returns share a greeting-like repetition with a 1977 radio record.",
    hiddenImplication: "An old signal may have been contact, not coincidence.",
    discoveryHint: "Complete relay cadence or resonance evidence work.",
    unlockConditionText: "Archive a historical signal correlation.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 1,
    meterEffects: { compliance: 0, truth: 1, suspicion: 1 },
    severity: "suppressed",
    tags: ["signal", "wow", "history", "resonance"],
    relatedOperations: ["mare-vanta-relay", "company-silence"],
    relatedNextAction: "Compare historical signal match with BLC1 warning fragments.",
    unlockHint: "Complete relay cadence or resonance evidence work.",
  },
  {
    id: "lcross-targeting-discrepancy",
    title: "LCROSS Targeting Discrepancy",
    type: "classified-history",
    actId: "act-1",
    sourceOperationId: "company-silence",
    sourceOperationIds: ["company-silence", "orbital-liability"],
    sourceMissionFamilyIds: ["evidence-lore-recovery", "salvage-recovery"],
    officialLabel: "Volatile survey redaction.",
    officialClassification: "Volatile survey redaction.",
    publicSummary: "The impact file is sanitized as water-ice research and target correction.",
    restrictedSummary: "Targeting notes mention biological activity before volatile analysis was approved.",
    hiddenImplication: "The impact may have hit a Memory Structure humans misread as a hazard.",
    discoveryHint: "Recover sealed impact survey or restricted custody records.",
    unlockConditionText: "Recover classified impact evidence.",
    complianceEffect: 0,
    truthEffect: 2,
    suspicionEffect: 2,
    meterEffects: { compliance: 0, truth: 2, suspicion: 2 },
    severity: "suppressed",
    tags: ["classified", "lcross", "awsiti", "impact", "memory"],
    relatedOperations: ["company-silence", "orbital-liability"],
    relatedNextAction: "Review Memory Matter evidence before drawing cultural conclusions.",
    unlockHint: "Recover sealed impact survey or restricted custody records.",
  },
  {
    id: "blc1-warning-fragment",
    title: "BLC1 Warning Fragment",
    type: "classified-history",
    actId: "act-1",
    sourceOperationId: "mare-vanta-relay",
    sourceOperationIds: ["mare-vanta-relay", "company-silence"],
    sourceMissionFamilyIds: ["signal-restore", "evidence-lore-recovery"],
    officialLabel: "Restricted signal correlation.",
    officialClassification: "Restricted signal correlation.",
    publicSummary: "A later radio-event match is marked as off-world false positive and sealed.",
    restrictedSummary: "The cadence is less like greeting and more like alarm after an old impact event.",
    hiddenImplication: "The Deep Network may have warned humanity after harm was done.",
    discoveryHint: "Complete relay discrepancy or restricted signal evidence work.",
    unlockConditionText: "Recover a restricted warning correlation.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 2,
    meterEffects: { compliance: 0, truth: 1, suspicion: 2 },
    severity: "suppressed",
    tags: ["signal", "blc1", "warning", "deep-network", "classified"],
    relatedOperations: ["mare-vanta-relay", "company-silence"],
    relatedNextAction: "Keep relay evidence sealed until Company Silence can be reviewed.",
    unlockHint: "Complete relay discrepancy or restricted signal evidence work.",
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
    discoveries.push({ id: "structured-residue-pattern", source: "lumen-material", reason: "Structured residue pattern archived" });
  }
  if (hasItem("scanner-battery")) {
    discoveries.push({ id: "scanner-battery-archive", source: "scanner-battery", reason: "Scanner Battery recovered" });
  }
  if (result.heavyCargoStatus.toLowerCase().includes("recovered") || result.heavyCargoStatus.toLowerCase().includes("secured")) {
    discoveries.push({ id: "he3-core-resonance", source: "heavy-cargo", reason: "Heavy cargo secured" });
    discoveries.push({ id: "resonance-pattern-fragment", source: "heavy-cargo", reason: "Cargo resonance fragment logged" });
  }
  if (result.rewardCachesClaimed >= 2) {
    discoveries.push({ id: "sealed-cache-manifest", source: "reward-cache", reason: "Multiple reward caches claimed" });
  }
  if (family.includes("signal") || title.includes("relay") || title.includes("signal")) {
    discoveries.push({ id: "mare-vanta-signal-fragment", source: "signal-operation", reason: primaryComplete ? "Signal objective completed" : "Signal sortie extracted" });
    discoveries.push({ id: "resonance-pattern-fragment", source: "signal-operation", reason: "Resonance pattern fragment archived" });
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
      discoveries.push({ id: "structured-residue-pattern", source: "survey-contract", reason: "Structured residue pattern archived" });
    }
    if (missionId.includes("evidence-mineral-behavior-trial")) {
      discoveries.push({ id: "mineral-behavior-anomaly", source: "survey-contract", reason: "Mineral behavior trial completed" });
      discoveries.push({ id: "memory-matter-trace", source: "survey-contract", reason: "Memory Matter trace archived" });
    }
    if (missionId.includes("evidence-relay-cadence-discrepancy")) {
      discoveries.push({ id: "mare-vanta-signal-fragment", source: "signal-contract", reason: "Relay cadence discrepancy archived" });
      discoveries.push({ id: "historical-signal-match", source: "signal-contract", reason: "Historical signal match sealed" });
      discoveries.push({ id: "blc1-warning-fragment", source: "signal-contract", reason: "BLC1 warning correlation sealed" });
    }
    if (missionId.includes("evidence-black-box-contradiction")) {
      discoveries.push({ id: "black-box-discrepancy", source: "evidence-contract", reason: "Black box contradiction recovered" });
      discoveries.push({ id: "apollo-residue-anomaly", source: "evidence-contract", reason: "Legacy biological trace sealed" });
    }
    if (missionId.includes("evidence-quiet-order-contact")) {
      discoveries.push({ id: "crew-memory-report", source: "quiet-order-contact", reason: "Quiet Order field memory logged" });
      discoveries.push({ id: "impact-fracture-signal", source: "quiet-order-contact", reason: "Impact fracture signal archived" });
      discoveries.push({ id: "lcross-targeting-discrepancy", source: "quiet-order-contact", reason: "Classified impact record sealed" });
    }
    if (missionId.includes("evidence-sealed-manifest-verification") && result.rewardCachesClaimed > 0) {
      discoveries.push({ id: "lcross-targeting-discrepancy", source: "sealed-cache", reason: "Volatile survey redaction recovered" });
    }
  }

  return [...new Map(discoveries.map((discovery) => [discovery.id, discovery])).values()];
}

export function isCampaignEvidenceId(id: unknown): id is CampaignEvidenceId {
  return typeof id === "string" && id in campaignEvidenceById;
}
