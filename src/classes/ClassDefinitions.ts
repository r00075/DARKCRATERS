export type ClassId = "surveyor" | "salvager" | "security" | "systems-specialist";

export type ClassDefinition = Readonly<{
  id: ClassId;
  displayName: string;
  roleLabel: string;
  shortDescription: string;
  startingTendency: string;
  futureSkillBranches: readonly string[];
  unlocked: boolean;
}>;

export const classDefinitions: readonly ClassDefinition[] = [
  {
    id: "surveyor",
    displayName: "Surveyor",
    roleLabel: "Navigation / Signal Reading",
    shortDescription: "Reads crater routes, low-light signatures, and unstable survey returns.",
    startingTendency: "Detection, navigation, and Lumen signature analysis.",
    futureSkillBranches: ["crater-navigation", "lumen-signatures"],
    unlocked: true,
  },
  {
    id: "salvager",
    displayName: "Salvager",
    roleLabel: "Recovery / Materials",
    shortDescription: "Built around careful recovery, field containment, and cargo decisions.",
    startingTendency: "Materials, recovery efficiency, and oversized return planning.",
    futureSkillBranches: ["field-recovery", "suit-stability"],
    unlocked: true,
  },
  {
    id: "security",
    displayName: "Security",
    roleLabel: "Weapons / Breach Response",
    shortDescription: "Keeps a run moving when mining zones stop being quiet.",
    startingTendency: "Weapon handling, protection, and contact discipline.",
    futureSkillBranches: ["response-discipline", "suit-stability"],
    unlocked: true,
  },
  {
    id: "systems-specialist",
    displayName: "Systems Specialist",
    roleLabel: "Repair / Field Systems",
    shortDescription: "Stabilizes battered gear, damaged ship systems, and failing suit links.",
    startingTendency: "Ship stabilization, equipment upkeep, and emergency operation.",
    futureSkillBranches: ["field-recovery", "crater-navigation"],
    unlocked: true,
  },
] as const;

export const defaultClassId: ClassId = "surveyor";
