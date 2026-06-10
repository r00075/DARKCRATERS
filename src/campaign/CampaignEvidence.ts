import type { CampaignOperationId } from "./CampaignDefinitions";
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

export type CampaignEvidenceDefinition = Readonly<{
  id: CampaignEvidenceId;
  title: string;
  type: CampaignEvidenceType;
  sourceOperationId: CampaignOperationId;
  officialLabel: string;
  hiddenImplication: string;
  complianceEffect: number;
  truthEffect: number;
  suspicionEffect: number;
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
    sourceOperationId: "orbital-liability",
    officialLabel: "Recovered industrial flight data.",
    hiddenImplication: "Impact telemetry contains a second signal beneath the crash tone.",
    complianceEffect: 1,
    truthEffect: 1,
    suspicionEffect: 0,
    unlockHint: "Recover a black box or encrypted data cache.",
  },
  {
    id: "lumen-residue-sample",
    title: "Lumen Residue Sample",
    type: "lumen-residue",
    sourceOperationId: "regolith-trace",
    officialLabel: "Luminescent mineral contamination.",
    hiddenImplication: "Residue reacts to repeated routes like memory.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 1,
    unlockHint: "Extract Lumen Essence or relic material.",
  },
  {
    id: "mare-vanta-signal-fragment",
    title: "Signal Fragment: Mare Vanta",
    type: "signal-fragment",
    sourceOperationId: "mare-vanta-relay",
    officialLabel: "Relay noise archived.",
    hiddenImplication: "Pattern repeats after field movement, not transmitter pulse.",
    complianceEffect: 1,
    truthEffect: 1,
    suspicionEffect: 0,
    unlockHint: "Complete or extract from a signal restore operation.",
  },
  {
    id: "scanner-battery-archive",
    title: "Scanner Battery Archive",
    type: "corporate-data",
    sourceOperationId: "regolith-trace",
    officialLabel: "Utility cell recovered for scanner service.",
    hiddenImplication: "Charge decay includes a pulse outside TYCHOSTAR calibration tables.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 0,
    unlockHint: "Recover a Scanner Battery.",
  },
  {
    id: "he3-core-resonance",
    title: "He-3 Core Resonance",
    type: "mineral-anomaly",
    sourceOperationId: "tycho-scar",
    officialLabel: "Extraction hardware secured for cradle transfer.",
    hiddenImplication: "Core resonance does not match equipment exposure logs.",
    complianceEffect: 1,
    truthEffect: 1,
    suspicionEffect: 1,
    unlockHint: "Secure heavy cargo.",
  },
  {
    id: "sealed-cache-manifest",
    title: "Sealed Cache Manifest",
    type: "corporate-data",
    sourceOperationId: "orbital-liability",
    officialLabel: "Reward cache manifest entered custody.",
    hiddenImplication: "The cache predates the crater work order.",
    complianceEffect: 1,
    truthEffect: 0,
    suspicionEffect: 0,
    unlockHint: "Claim multiple reward caches.",
  },
  {
    id: "crew-memory-report",
    title: "Crew Memory Report",
    type: "field-memory",
    sourceOperationId: "company-silence",
    officialLabel: "Crew testimony filed as non-admissible stress response.",
    hiddenImplication: "Multiple reports describe the same impossible route.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 1,
    unlockHint: "Complete evidence recovery after Lumen Truth rises.",
  },
  {
    id: "restricted-recovery-order",
    title: "Restricted Recovery Order",
    type: "restricted-order",
    sourceOperationId: "company-silence",
    officialLabel: "TYCHOSTAR custody directive recovered.",
    hiddenImplication: "The directive was issued before the incident report existed.",
    complianceEffect: 1,
    truthEffect: 1,
    suspicionEffect: 1,
    unlockHint: "Complete an evidence recovery sortie.",
  },
  {
    id: "mineral-behavior-anomaly",
    title: "Mineral Behavior Anomaly",
    type: "biological-sample",
    sourceOperationId: "regolith-trace",
    officialLabel: "Non-biological interference sample logged.",
    hiddenImplication: "The sample changes after nearby movement stops.",
    complianceEffect: 0,
    truthEffect: 1,
    suspicionEffect: 1,
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

  return [...new Map(discoveries.map((discovery) => [discovery.id, discovery])).values()];
}

export function isCampaignEvidenceId(id: unknown): id is CampaignEvidenceId {
  return typeof id === "string" && id in campaignEvidenceById;
}
