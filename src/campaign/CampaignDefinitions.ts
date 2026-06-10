import type { MissionFamilyId } from "../raid/MissionDefinitions";

export type CampaignActId = "act-1" | "act-2" | "act-3" | "act-4";
export type CampaignOperationId =
  | "orbital-liability"
  | "tycho-scar"
  | "mare-vanta-relay"
  | "regolith-trace"
  | "company-silence";

export type CampaignActDefinition = Readonly<{
  id: CampaignActId;
  title: string;
  subtitle: string;
  corporateFraming: string;
  hiddenTruthFraming: string;
  availableMissionFamilies: MissionFamilyId[];
  unlockSummary: string;
  recommendedReadiness: string;
  narrativeTone: string;
  nextActTeaser: string;
}>;

export type CampaignOperationDefinition = Readonly<{
  id: CampaignOperationId;
  actId: CampaignActId;
  title: string;
  subtitle: string;
  familyIds: MissionFamilyId[];
  corporateObjective: string;
  hiddenTruthHint: string;
  unlockHint: string;
  readiness: string;
}>;

export const campaignActs: readonly CampaignActDefinition[] = [
  {
    id: "act-1",
    title: "Company Property",
    subtitle: "Disposable contractor onboarding",
    corporateFraming: "Recover industrial assets before crater instability compromises TYCHOSTAR claims.",
    hiddenTruthFraming: "Lumen residue is increasing below the regolith, but corporate reports classify it as relay noise.",
    availableMissionFamilies: ["salvage-recovery", "evidence-lore-recovery", "heavy-cargo-retrieval", "signal-restore", "lumen-survey"],
    unlockSummary: "Active. Complete recoveries, POI contracts, and clean extractions to expose later operations.",
    recommendedReadiness: "Survey kit, Essence Flare access, and one reliable primary weapon.",
    narrativeTone: "Corporate, utilitarian, quietly contradictory.",
    nextActTeaser: "Signal Contamination unlocks when field evidence stops matching company reports.",
  },
  {
    id: "act-2",
    title: "Signal Contamination",
    subtitle: "Contradictory field evidence",
    corporateFraming: "Suppress anomalous relay drift and retrieve forbidden signal logs.",
    hiddenTruthFraming: "The crater network is answering back.",
    availableMissionFamilies: ["signal-restore", "lumen-survey", "evidence-lore-recovery", "sabotage-subterfuge"],
    unlockSummary: "Future act. Requires Act I progress and Lumen Truth.",
    recommendedReadiness: "Scanner supplies, stealth tools, and stronger recovery gear.",
    narrativeTone: "Narrow orders, suspicious omissions.",
    nextActTeaser: "Breach of Orders begins when obedience and survival diverge.",
  },
  {
    id: "act-3",
    title: "Breach of Orders",
    subtitle: "Subterfuge and retaliation",
    corporateFraming: "Destroy compromised infrastructure and misdirect unauthorized field crews.",
    hiddenTruthFraming: "Lumen movement can be hidden, preserved, or betrayed.",
    availableMissionFamilies: ["sabotage-subterfuge", "defense-holdout", "extraction-crisis", "lumen-survey"],
    unlockSummary: "Future act. Requires subterfuge choices.",
    recommendedReadiness: "High-survival loadout and role-ready squad support.",
    narrativeTone: "Operational denial, quiet rebellion.",
    nextActTeaser: "The Moon Remembers is the endgame alignment break.",
  },
  {
    id: "act-4",
    title: "The Moon Remembers",
    subtitle: "Extraction operation collapse",
    corporateFraming: "Protect remaining extraction routes and erase exposure records.",
    hiddenTruthFraming: "Humanity is no longer uncontested below the lunar surface.",
    availableMissionFamilies: ["extraction-crisis", "sabotage-subterfuge", "evidence-lore-recovery", "defense-holdout"],
    unlockSummary: "Future act. Requires campaign alignment resolution.",
    recommendedReadiness: "Endgame gear and resolved faction commitments.",
    narrativeTone: "Terminal, mythic, irreversible.",
    nextActTeaser: "No further act registered.",
  },
];

export const campaignOperations: readonly CampaignOperationDefinition[] = [
  {
    id: "orbital-liability",
    actId: "act-1",
    title: "Orbital Liability",
    subtitle: "Recover black box or missing crate data.",
    familyIds: ["salvage-recovery", "evidence-lore-recovery"],
    corporateObjective: "Recover company-tagged crates and incident records.",
    hiddenTruthHint: "Black box timestamps may not match official crater telemetry.",
    unlockHint: "Starter operation.",
    readiness: "Any loadout with basic extraction discipline.",
  },
  {
    id: "tycho-scar",
    actId: "act-1",
    title: "Tycho Scar",
    subtitle: "Secure Helium-3 drill core.",
    familyIds: ["heavy-cargo-retrieval"],
    corporateObjective: "Recover He-3 industrial cargo and confirm Kestrel-9 cradle transfer.",
    hiddenTruthHint: "Cargo exposure draws patrol patterns the company does not explain.",
    unlockHint: "Complete one extraction or primary objective.",
    readiness: "Light route, clear cargo plan, avoid over-looting while carrying.",
  },
  {
    id: "mare-vanta-relay",
    actId: "act-1",
    title: "Mare Vanta Relay",
    subtitle: "Restore or hack signal infrastructure.",
    familyIds: ["signal-restore"],
    corporateObjective: "Reboot relay equipment and recover local telemetry.",
    hiddenTruthHint: "Relay noise contains impossible biological cadence.",
    unlockHint: "Complete a POI objective or primary objective.",
    readiness: "POI awareness and enough ammo for objective pressure.",
  },
  {
    id: "regolith-trace",
    actId: "act-1",
    title: "Regolith Trace",
    subtitle: "Detect signal residue.",
    familyIds: ["lumen-survey"],
    corporateObjective: "Classify Lumen residue as geological interference.",
    hiddenTruthHint: "Recovered luminous material suggests intent, not noise.",
    unlockHint: "Recover Lumen material or use reveal tools successfully.",
    readiness: "Essence Flare or Surveyor affinity recommended.",
  },
  {
    id: "company-silence",
    actId: "act-1",
    title: "Company Silence",
    subtitle: "Retrieve field evidence before reports diverge.",
    familyIds: ["evidence-lore-recovery"],
    corporateObjective: "Secure field evidence and restrict distribution.",
    hiddenTruthHint: "Corporate language is beginning to contradict recovered data.",
    unlockHint: "Reach Act I progress or Lumen Truth threshold.",
    readiness: "Balanced kit, extra storage, and a clean extraction plan.",
  },
];

export const campaignActById = Object.fromEntries(campaignActs.map((act) => [act.id, act])) as Record<CampaignActId, CampaignActDefinition>;
export const campaignOperationById = Object.fromEntries(campaignOperations.map((operation) => [operation.id, operation])) as Record<CampaignOperationId, CampaignOperationDefinition>;
