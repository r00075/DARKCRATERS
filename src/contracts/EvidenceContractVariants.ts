import type { CampaignEvidenceId } from "../campaign/CampaignEvidence";
import type { CampaignOperationId } from "../campaign/CampaignDefinitions";
import type { ContractDefinition } from "./ContractManager";
import type { MissionFamilyId } from "../raid/MissionDefinitions";

export type EvidenceContractVariantMeta = Readonly<{
  familyId: MissionFamilyId;
  operationAffinity: CampaignOperationId[];
  requiredEvidenceIds: CampaignEvidenceId[];
  optionalEvidenceIds: CampaignEvidenceId[];
  unavailableReason: string;
  corporateCopy: string;
  hiddenCopy: string;
  rewardFlavor: string;
  codexHook: string;
  campaignMeterHint: string;
  recommendedLoadoutHint: string;
}>;

export type EvidenceContractDefinition = ContractDefinition & Readonly<{
  evidenceVariant: EvidenceContractVariantMeta;
}>;

export type EvidenceContractContext = Readonly<{
  currentOperationId: CampaignOperationId;
  discoveredEvidenceIds: readonly CampaignEvidenceId[];
  lumenTruth: number;
}>;

export const evidenceContractVariants: readonly EvidenceContractDefinition[] = [
  {
    id: "evidence-core-harmonic-audit",
    type: "poi-objective",
    title: "Core Harmonic Audit",
    description: "TYCHOSTAR requests a second cradle transfer. Core vibration must be logged as equipment strain.",
    factionId: "helios",
    zoneId: "tycho-scar",
    recommendedTier: "Survey Run",
    difficulty: "medium",
    targetPoi: "Tycho Scar",
    risk: "High",
    requiresExtraction: true,
    target: { poiObjectiveType: "retrieve-core-fragment" },
    reward: {
      credits: 220,
      xp: 125,
      scrap: 8,
      weaponParts: 2,
      vendorReputation: { broker: 18, mechanic: 14 },
      rareCoreChance: 0.14,
      tier: "high-risk",
      contractPoints: 3,
    },
    evidenceVariant: {
      familyId: "heavy-cargo-retrieval",
      operationAffinity: ["tycho-scar", "company-silence"],
      requiredEvidenceIds: ["he3-core-resonance"],
      optionalEvidenceIds: [],
      unavailableReason: "He-3 Core Resonance not logged.",
      corporateCopy: "Core vibration must be logged as equipment strain.",
      hiddenCopy: "The harmonic repeats below the cargo bay floor after extraction.",
      rewardFlavor: "He-3 audit payout with moderate core chance.",
      codexHook: "He-3 Core Resonance",
      campaignMeterHint: "Compliance and truth pressure may rise if recovered cleanly.",
      recommendedLoadoutHint: "Ship cargo readiness and short return route recommended.",
    },
  },
  {
    id: "evidence-sealed-manifest-verification",
    type: "poi-objective",
    title: "Sealed Manifest Verification",
    description: "Verify cache contents against pre-collapse contractor manifests.",
    factionId: "lea",
    zoneId: "tycho-scar",
    recommendedTier: "Survey Run",
    difficulty: "easy",
    targetPoi: "Tycho Scar",
    risk: "Medium",
    requiresExtraction: true,
    target: { poiObjectiveType: "secure-cache" },
    reward: {
      credits: 150,
      xp: 85,
      scrap: 8,
      weaponParts: 1,
      vendorReputation: { broker: 14, scrapper: 8 },
      rareCoreChance: 0.06,
      tier: "standard",
      contractPoints: 2,
    },
    evidenceVariant: {
      familyId: "salvage-recovery",
      operationAffinity: ["orbital-liability", "company-silence"],
      requiredEvidenceIds: ["sealed-cache-manifest"],
      optionalEvidenceIds: ["black-box-discrepancy"],
      unavailableReason: "Sealed Cache Manifest not logged.",
      corporateCopy: "Verify manifest before cache contents enter public incident records.",
      hiddenCopy: "Cache contents predate the crater work order.",
      rewardFlavor: "Manifest verification payout and cache-focused materials.",
      codexHook: "Sealed Cache Manifest",
      campaignMeterHint: "Compliance rises through custody; truth may remain suppressed.",
      recommendedLoadoutHint: "Bring spare pack capacity for cache recovery.",
    },
  },
  {
    id: "evidence-residue-survey-sweep",
    type: "poi-objective",
    title: "Residue Survey Sweep",
    description: "Classify luminescent material as geological interference.",
    factionId: "lea",
    zoneId: "mare-vanta",
    recommendedTier: "Survey Run",
    difficulty: "medium",
    targetPoi: "Mare Vanta",
    risk: "Medium",
    requiresExtraction: true,
    target: { poiObjectiveType: "survey-residue-field" },
    reward: {
      credits: 155,
      xp: 105,
      scrap: 6,
      weaponParts: 1,
      vendorReputation: { mechanic: 10, broker: 12 },
      rareCoreChance: 0.06,
      tier: "standard",
      contractPoints: 2,
    },
    evidenceVariant: {
      familyId: "lumen-survey",
      operationAffinity: ["regolith-trace"],
      requiredEvidenceIds: ["lumen-residue-sample"],
      optionalEvidenceIds: ["scanner-battery-archive"],
      unavailableReason: "Lumen Residue Sample not logged.",
      corporateCopy: "Classify residue as geological interference.",
      hiddenCopy: "Residue reacts to repeated routes like memory.",
      rewardFlavor: "Survey payout with scanner material chance.",
      codexHook: "Lumen Residue Sample",
      campaignMeterHint: "Truth and suspicion may rise if survey material returns.",
      recommendedLoadoutHint: "Essence Flare or Surveyor assignment recommended.",
    },
  },
  {
    id: "evidence-mineral-behavior-trial",
    type: "poi-objective",
    title: "Mineral Behavior Trial",
    description: "Repeat scanner sweep near known residue clusters.",
    factionId: "quietOrder",
    zoneId: "mare-vanta",
    recommendedTier: "Blackout Zone",
    difficulty: "hard",
    targetPoi: "Mare Vanta",
    risk: "High",
    requiresExtraction: true,
    target: { poiObjectiveType: "survey-residue-field" },
    reward: {
      credits: 210,
      xp: 135,
      scrap: 8,
      weaponParts: 2,
      vendorReputation: { stylist: 22, broker: 8 },
      rareCoreChance: 0.12,
      tier: "high-risk",
      contractPoints: 3,
      reputationTokens: 1,
    },
    evidenceVariant: {
      familyId: "lumen-survey",
      operationAffinity: ["regolith-trace", "company-silence"],
      requiredEvidenceIds: ["mineral-behavior-anomaly"],
      optionalEvidenceIds: ["lumen-residue-sample"],
      unavailableReason: "Mineral Behavior Anomaly not logged.",
      corporateCopy: "Repeat scanner sweep near known residue clusters.",
      hiddenCopy: "The sample changes after nearby movement stops.",
      rewardFlavor: "Quiet survey payout with higher rep token chance.",
      codexHook: "Mineral Behavior Anomaly",
      campaignMeterHint: "Truth rises; corporate review may follow.",
      recommendedLoadoutHint: "Surveyor affinity shortens field exposure.",
    },
  },
  {
    id: "evidence-relay-cadence-discrepancy",
    type: "stealth",
    title: "Relay Cadence Discrepancy",
    description: "Reboot local telemetry and archive signal noise.",
    factionId: "helios",
    zoneId: "mare-vanta",
    recommendedTier: "Blackout Zone",
    difficulty: "hard",
    targetPoi: "Mare Vanta",
    risk: "High",
    requiresExtraction: true,
    target: { poiObjectiveType: "hack-signal-box" },
    reward: {
      credits: 230,
      xp: 140,
      scrap: 8,
      weaponParts: 3,
      vendorReputation: { broker: 24, mechanic: 10 },
      rareCoreChance: 0.14,
      tier: "high-risk",
      contractPoints: 3,
    },
    evidenceVariant: {
      familyId: "signal-restore",
      operationAffinity: ["mare-vanta-relay", "regolith-trace"],
      requiredEvidenceIds: ["mare-vanta-signal-fragment"],
      optionalEvidenceIds: [],
      unavailableReason: "Signal Fragment not logged.",
      corporateCopy: "Archive signal noise without crew speculation.",
      hiddenCopy: "Cadence repeats outside relay timing.",
      rewardFlavor: "Signal archive payout with broker reputation.",
      codexHook: "Signal Fragment: Mare Vanta",
      campaignMeterHint: "Signal work supports truth without forcing branch choice.",
      recommendedLoadoutHint: "Systems Specialist favored for relay operation.",
    },
  },
  {
    id: "evidence-black-box-contradiction",
    type: "scavenger",
    title: "Black Box Contradiction",
    description: "Recover missing crate or flight data before crater instability deletes evidence.",
    factionId: "lea",
    zoneId: "aristarchus",
    recommendedTier: "Survey Run",
    difficulty: "medium",
    targetPoi: "Aristarchus Redline",
    risk: "High",
    requiresExtraction: true,
    target: { lootType: "encrypted-data", lootQuantity: 1 },
    reward: {
      credits: 205,
      xp: 118,
      scrap: 7,
      weaponParts: 2,
      vendorReputation: { broker: 24, mechanic: 8 },
      rareCoreChance: 0.1,
      tier: "high-risk",
      contractPoints: 3,
    },
    evidenceVariant: {
      familyId: "evidence-lore-recovery",
      operationAffinity: ["orbital-liability", "company-silence"],
      requiredEvidenceIds: ["black-box-discrepancy"],
      optionalEvidenceIds: ["sealed-cache-manifest"],
      unavailableReason: "Black Box Discrepancy not logged.",
      corporateCopy: "Recover flight data before crater instability deletes evidence.",
      hiddenCopy: "Black box timestamps do not match official crater telemetry.",
      rewardFlavor: "Evidence custody payout and broker reputation.",
      codexHook: "Black Box Discrepancy",
      campaignMeterHint: "Evidence custody supports Company Silence pressure.",
      recommendedLoadoutHint: "Balanced kit and extraction discipline recommended.",
    },
  },
  {
    id: "evidence-quiet-order-contact",
    type: "stealth",
    title: "Quiet Order Contact",
    description: "Investigate anomaly without triggering full alert.",
    factionId: "quietOrder",
    zoneId: "mare-vanta",
    recommendedTier: "Blackout Zone",
    difficulty: "hard",
    targetPoi: "Mare Vanta",
    risk: "Critical",
    requiresExtraction: true,
    target: { poiObjectiveType: "survey-residue-field" },
    reward: {
      credits: 250,
      xp: 155,
      scrap: 9,
      weaponParts: 3,
      vendorReputation: { stylist: 30, broker: 12 },
      rareCoreChance: 0.16,
      tier: "elite",
      contractPoints: 4,
      reputationTokens: 1,
    },
    evidenceVariant: {
      familyId: "lumen-survey",
      operationAffinity: ["regolith-trace", "company-silence"],
      requiredEvidenceIds: [],
      optionalEvidenceIds: ["crew-memory-report", "mare-vanta-signal-fragment", "lumen-residue-sample"],
      unavailableReason: "Requires stronger Lumen Truth or field-memory evidence.",
      corporateCopy: "Investigate anomaly without triggering full alert.",
      hiddenCopy: "The Moon remembers impact.",
      rewardFlavor: "Quiet Order reputation and high-risk survey payout.",
      codexHook: "Crew Memory Report",
      campaignMeterHint: "Truth and suspicion may rise together.",
      recommendedLoadoutHint: "Quiet route, Essence Flare, and Surveyor support recommended.",
    },
  },
];

export function getAvailableEvidenceContractVariants(context: EvidenceContractContext): EvidenceContractDefinition[] {
  const discovered = new Set(context.discoveredEvidenceIds);
  return evidenceContractVariants.filter((variant) => {
    const requiredMet = variant.evidenceVariant.requiredEvidenceIds.every((id) => discovered.has(id));
    const optionalMet = variant.evidenceVariant.optionalEvidenceIds.length === 0 ||
      variant.evidenceVariant.optionalEvidenceIds.some((id) => discovered.has(id));
    const quietOrderUnlocked = variant.id !== "evidence-quiet-order-contact" || context.lumenTruth >= 3 || optionalMet;
    return requiredMet && quietOrderUnlocked;
  });
}

export function isEvidenceContractVariant(contract: ContractDefinition): contract is EvidenceContractDefinition {
  return "evidenceVariant" in contract;
}
