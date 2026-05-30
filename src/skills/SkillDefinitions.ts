import type { ClassId } from "../classes/ClassDefinitions";

export type SkillBranchId =
  | "crater-navigation"
  | "lumen-signatures"
  | "field-recovery"
  | "suit-stability"
  | "response-discipline";

export type SkillNodeId =
  | "shadow-route-reading"
  | "beacon-triangulation"
  | "essence-trace"
  | "low-light-confirmation"
  | "sealed-recovery"
  | "containment-habit"
  | "emergency-seal"
  | "cognitive-check"
  | "breach-ready"
  | "controlled-burst";

export type SkillBranchDefinition = Readonly<{
  id: SkillBranchId;
  label: string;
  description: string;
  accent: "cyan" | "green" | "orange" | "purple" | "red";
}>;

export type SkillNodeDefinition = Readonly<{
  id: SkillNodeId;
  branchId: SkillBranchId;
  label: string;
  description: string;
  tier: number;
  prerequisites: readonly SkillNodeId[];
  classAffinity?: ClassId;
}>;

export const skillBranches: readonly SkillBranchDefinition[] = [
  {
    id: "crater-navigation",
    label: "Crater Navigation",
    description: "Route discipline, low-light travel, and return-marker reliability.",
    accent: "cyan",
  },
  {
    id: "lumen-signatures",
    label: "Lumen Signatures",
    description: "Trace reading, shadow confirmation, and Essence reaction handling.",
    accent: "purple",
  },
  {
    id: "field-recovery",
    label: "Field Recovery",
    description: "Containment, cargo judgment, and material salvage habits.",
    accent: "green",
  },
  {
    id: "suit-stability",
    label: "Suit Stability",
    description: "Emergency operation, oxygen discipline, and mental stability checks.",
    accent: "orange",
  },
  {
    id: "response-discipline",
    label: "Response Discipline",
    description: "Weapon handling, breach posture, and controlled return fire.",
    accent: "red",
  },
] as const;

export const skillNodes: readonly SkillNodeDefinition[] = [
  {
    id: "shadow-route-reading",
    branchId: "crater-navigation",
    label: "Shadow Route Reading",
    description: "Mark safer ridge breaks before crater darkness closes in.",
    tier: 1,
    prerequisites: [],
    classAffinity: "surveyor",
  },
  {
    id: "beacon-triangulation",
    branchId: "crater-navigation",
    label: "Beacon Triangulation",
    description: "Improve field confidence around weak ship and fallback return pings.",
    tier: 2,
    prerequisites: ["shadow-route-reading"],
    classAffinity: "systems-specialist",
  },
  {
    id: "essence-trace",
    branchId: "lumen-signatures",
    label: "Essence Trace",
    description: "Lumen Essence reacts faintly to movement below the shadow line.",
    tier: 1,
    prerequisites: [],
    classAffinity: "surveyor",
  },
  {
    id: "low-light-confirmation",
    branchId: "lumen-signatures",
    label: "Low-Light Confirmation",
    description: "Bright exposure weakens certainty. Shadow scans read cleaner.",
    tier: 2,
    prerequisites: ["essence-trace"],
    classAffinity: "surveyor",
  },
  {
    id: "sealed-recovery",
    branchId: "field-recovery",
    label: "Sealed Recovery",
    description: "Contain sensitive cores and survey crates without rushing the transfer.",
    tier: 1,
    prerequisites: [],
    classAffinity: "salvager",
  },
  {
    id: "containment-habit",
    branchId: "field-recovery",
    label: "Containment Habit",
    description: "Treat unfamiliar fabrication drift as a handling problem first.",
    tier: 2,
    prerequisites: ["sealed-recovery"],
    classAffinity: "salvager",
  },
  {
    id: "emergency-seal",
    branchId: "suit-stability",
    label: "Emergency Seal",
    description: "Keep the suit useful when crater grit finds weak seams.",
    tier: 1,
    prerequisites: [],
    classAffinity: "systems-specialist",
  },
  {
    id: "cognitive-check",
    branchId: "suit-stability",
    label: "Cognitive Check",
    description: "Run quick sanity loops when the signal pattern stops matching prior data.",
    tier: 2,
    prerequisites: ["emergency-seal"],
    classAffinity: "security",
  },
  {
    id: "breach-ready",
    branchId: "response-discipline",
    label: "Breach Ready",
    description: "Hold fire until contact becomes a clean problem.",
    tier: 1,
    prerequisites: [],
    classAffinity: "security",
  },
  {
    id: "controlled-burst",
    branchId: "response-discipline",
    label: "Controlled Burst",
    description: "Response pacing for moving targets around broken rigs.",
    tier: 2,
    prerequisites: ["breach-ready"],
    classAffinity: "security",
  },
] as const;
