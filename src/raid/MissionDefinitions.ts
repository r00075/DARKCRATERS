export type MissionFamilyId =
  | "heavy-cargo-retrieval"
  | "signal-restore"
  | "lumen-survey"
  | "salvage-recovery"
  | "defense-holdout"
  | "sabotage-subterfuge"
  | "evidence-lore-recovery"
  | "extraction-crisis";

export type MissionFamilyDefinition = Readonly<{
  id: MissionFamilyId;
  name: string;
  description: string;
  rhythm: string;
  primaryStyle: string;
  optionalStyle: string;
  classHint: string;
  squadHint: string;
}>;

export const missionFamilies: readonly MissionFamilyDefinition[] = [
  {
    id: "heavy-cargo-retrieval",
    name: "Heavy Cargo Retrieval",
    description: "Recover industrial assets too large or unstable for the EVA Pack.",
    rhythm: "Locate cargo, release it, escort the carrier, secure at the ship.",
    primaryStyle: "Recover and secure heavy cargo",
    optionalStyle: "Sweep nearby POIs for Lumen residue or salvage",
    classHint: "Guard and Runner classes help carry pressure through the return route.",
    squadHint: "Solo viable. Squad recommended when the cargo exposes the carrier.",
  },
  {
    id: "signal-restore",
    name: "Signal Restore / Hack",
    description: "Restore or compromise a lunar relay, signal box, or power node.",
    rhythm: "Reach POI, operate the device, hold perimeter, extract with data.",
    primaryStyle: "Hack / restore objective",
    optionalStyle: "Recover signal residue or encrypted logs",
    classHint: "Systems Specialist gains stronger route and device utility later.",
    squadHint: "One runner can operate the device while others secure the perimeter.",
  },
  {
    id: "lumen-survey",
    name: "Lumen Survey / Reveal",
    description: "Locate unstable Lumen signatures without committing to a full study.",
    rhythm: "Scan, confirm signal, decide whether to chase or extract.",
    primaryStyle: "Survey and mark Lumen activity",
    optionalStyle: "Preserve residue samples for later analysis",
    classHint: "Surveyor tools extend reveal windows and route confidence.",
    squadHint: "Solo viable. Squad routes can split scan and security roles later.",
  },
  {
    id: "salvage-recovery",
    name: "Salvage Recovery",
    description: "Recover corporate equipment, field caches, and lost crew materials.",
    rhythm: "Search POIs, secure cache access, extract with recoverable value.",
    primaryStyle: "Recover marked salvage",
    optionalStyle: "Open reward caches or recover extra utility parts",
    classHint: "Scavenger-leaning loadouts benefit from larger EVA Pack planning.",
    squadHint: "Solo viable. Squads can sweep multiple POIs faster later.",
  },
  {
    id: "defense-holdout",
    name: "Defense / Holdout",
    description: "Keep a field position stable while lunar pressure rises.",
    rhythm: "Reach the objective, hold the area, claim the reward window.",
    primaryStyle: "Defend a local objective",
    optionalStyle: "Recover high-risk drops after the hold",
    classHint: "Combat classes help manage pressure around fixed devices.",
    squadHint: "Squad recommended when the hold attracts hostile attention.",
  },
  {
    id: "sabotage-subterfuge",
    name: "Sabotage / Subterfuge",
    description: "Disable rival or corporate systems without declaring the whole story.",
    rhythm: "Infiltrate, interfere with the device, avoid escalation, extract.",
    primaryStyle: "Sabotage device or patrol infrastructure",
    optionalStyle: "Falsify report data or recover classified fragments",
    classHint: "Quiet or systems-focused runners fit the future stealth branch.",
    squadHint: "Solo viable. Squads can split overwatch and operation later.",
  },
  {
    id: "evidence-lore-recovery",
    name: "Evidence / Lore Recovery",
    description: "Recover field evidence that hints at the crater's deeper behavior.",
    rhythm: "Find evidence, preserve it, extract before the site is scrubbed.",
    primaryStyle: "Recover evidence or forbidden signal data",
    optionalStyle: "Log Lumen residue without overexposing the runner",
    classHint: "Surveyor and Broker-adjacent builds may matter later.",
    squadHint: "Solo narrative friendly. Shared operations can compare evidence later.",
  },
  {
    id: "extraction-crisis",
    name: "Extraction Crisis",
    description: "Survive when the return route becomes the mission.",
    rhythm: "Stabilize route, reach extraction, leave before conditions collapse.",
    primaryStyle: "Reach or restore extraction",
    optionalStyle: "Recover stranded cargo only if the route remains stable",
    classHint: "Mobility and repair readiness reduce extraction pressure.",
    squadHint: "Squad recommended when route roles split between repair and cover.",
  },
];

export const missionFamilyById = Object.fromEntries(
  missionFamilies.map((family) => [family.id, family]),
) as Record<MissionFamilyId, MissionFamilyDefinition>;
