import type { DarkCratersLayoutArchetype, DarkCratersScreenTarget } from "./DarkCratersVisualContract";

export type DarkCratersScreenAuditEntry = Readonly<{
  screen: DarkCratersScreenTarget;
  label: string;
  priority: 1 | 2;
  expectedArchetype: DarkCratersLayoutArchetype;
  reference: string;
  intendedComposition?: readonly string[];
  forbiddenRegression?: string;
  validationChecklist?: readonly string[];
}>;

export const darkCratersScreenAudit: readonly DarkCratersScreenAuditEntry[] = [
  {
    screen: "habitatHub",
    label: "Habitat Hub",
    priority: 1,
    expectedArchetype: "hub-stage",
    reference: "public/design-reference/ui/reference-game-sequence.png panel 2 / Habitat Hub",
    intendedComposition: [
      "Unified environmental habitat bay with CSS-built depth, floor, wall silhouettes, and runner placed inside the space.",
      "Left operator rail, center mission console, right field-order rail, compact top chrome, and stable bottom navigation.",
      "Mission access is one center console with Review Assignment primary and Change Operation secondary.",
    ],
    forbiddenRegression: "Floating runner preview in an empty void with disconnected command feed and field-order debug cards.",
    validationChecklist: [
      "Screen reads as an orbital habitat command deck before any text is read.",
      "Right field order has no overlapping rows and no dense paragraph wall.",
      "Bottom nav labels remain Crater Runs, Loadout, Arsenal, Ship, Class, Skills, Stash, Vendors, Style, Contracts.",
      "Class opens Class Selection; Review Assignment opens Deployment Assignment; Begin Descent remains the final deploy action.",
      "Primary action and bottom nav are visible without full-page scrolling at common desktop viewports.",
    ],
  },
  {
    screen: "deploymentAssignment",
    label: "Deployment Assignment",
    priority: 1,
    expectedArchetype: "assignment-review",
    reference: "reference-game-sequence.png panels 4/5",
  },
  {
    screen: "classSelection",
    label: "Class Selection",
    priority: 1,
    expectedArchetype: "four-card-selection",
    reference: "reference-class.jpg",
  },
  {
    screen: "shipSystems",
    label: "Ship Systems",
    priority: 1,
    expectedArchetype: "ship-overview",
    reference: "public/design-reference/ui/reference-ship.jpg",
    intendedComposition: [
      "Kestrel-9 hangar hero is the emotional center of the screen, with the active ship preview large inside an industrial bay.",
      "Left identity rail summarizes KESTREL-9, Prospector Class, hull condition, landing, readiness, heavy cargo eligibility, and current module frame.",
      "Right systems rail groups Ship Statistics, Resources, and Active Effects without turning into a dense spreadsheet.",
      "Module strip sits under the hangar hero with cargo rack, extraction beacon, empty slots, and heavy cargo readiness.",
      "Bottom command strip integrates System Alerts, Next Mission, optional refit/upgrade, and Review Assignment.",
    ],
    forbiddenRegression: "Generic stat page with a tiny passive ship preview and disconnected bottom mission boxes.",
    validationChecklist: [
      "06-ship.png reads as a Kestrel-9 hangar screen before reading labels.",
      "Ship preview is the focal point and does not clip or stretch.",
      "Module slots remain readable and compact at 1600x900.",
      "Left identity rail and right systems rail support the hero without excessive scrolling.",
      "Bottom mission/readiness strip has no overlapping text and Review Assignment is visible.",
      "Ship nav state remains active and Review Assignment opens Deployment Assignment rather than launching the raid.",
    ],
  },
  {
    screen: "skillMatrix",
    label: "Skill Matrix",
    priority: 1,
    expectedArchetype: "lane-matrix",
    reference: "public/design-reference/ui/reference-skills.jpg and public/design-reference/ui/reference-Lumen.jpg",
    intendedComposition: [
      "Lumen progression matrix screen with compact top chrome, five-discipline left rail, dominant tiered node matrix, selected calibration detail rail, and bottom command strip.",
      "Matrix lanes are separated by discipline, show visible connector lines, tier markers, and node states for acquired, available, locked, and selected/focused.",
      "Selected detail rail explains the current node in DARK CRATERS field-calibration language with Lumen/survey tone rather than fantasy upgrade copy.",
      "Existing skill IDs, prerequisites, acquisition actions, and prototype no-stat-mutation behavior remain unchanged.",
    ],
    forbiddenRegression: "Generic card grid with tiny nodes, huge empty lower matrix space, no connector lines, no clear selected node detail, or fantasy skill-tree language.",
    validationChecklist: [
      "07-skills.png reads as a skill tree/progression console before reading the title.",
      "Five disciplines are visible and distinct from node tiers.",
      "Node states are visually distinguishable: acquired, available, locked, and selected/focused.",
      "Matrix has connector lines, tier columns, lane separation, and no horizontal scrollbar at 1600x900.",
      "Right detail rail shows selected node name, state, tier, requirement, field effect, and Lumen read.",
      "Bottom command strip remains visible and supports Class Assignment, Loadout, Crater Runs, Review Assignment, and Back to Habitat.",
    ],
  },
  {
    screen: "arsenal",
    label: "Arsenal / Weapon Catalog",
    priority: 1,
    expectedArchetype: "catalog-grid",
    reference: "public/design-reference/ui/reference-arsenal.jpg",
    intendedComposition: [
      "TYCHOSTAR weapon catalog and field-industrial bench screen with compact top resource chrome.",
      "Left category/manufacturer rail, center weapon catalog, right selected weapon hero panel, bottom technical bench section, and command strip.",
      "Catalog cards are compact index cards showing index, canonical weapon name, role/category, owned/equipped/prototype state, and condition without per-card model thumbnails.",
      "Selected weapon hero is the focal point with contained GLB/schematic preview, bench grid, callouts, field description, and readiness chips.",
      "Technical section separates Stats, Attachments, Upgrade, Repair, and Compare without overlapping forms or hidden action rows.",
    ],
    forbiddenRegression: "Generic inventory table, empty thumbnail/model boxes in every catalog card, tiny weapon preview, model/text overlap, attachment/upgrade overlap, or lower utility forms that feel detached from a weapon bench.",
    validationChecklist: [
      "05-arsenal.png reads as a weapon catalog and bench before reading labels.",
      "Selected weapon is visually dominant and preview remains contained.",
      "Catalog cards are readable and preserve canonical weapon names.",
      "Stats include damage, fire rate, accuracy, recoil control, magazine size, reload, ADS speed, range, durability, and handling.",
      "Attachment chips, upgrade tiers, repair state, and actions do not overlap at 1600x900.",
      "Back to Loadout, equip, repair, compare placeholder, and skin placeholder actions remain visible.",
    ],
  },
  {
    screen: "loadout",
    label: "Loadout / Cosmetics",
    priority: 2,
    expectedArchetype: "inventory-rail",
    reference: "reference-player-custom.jpg and reference-game-sequence.png panel 3",
  },
  {
    screen: "campaignCodex",
    label: "Campaign / Codex",
    priority: 2,
    expectedArchetype: "dossier",
    reference: "reference-map.jpg and reference-Lumen.jpg",
  },
  {
    screen: "stashVendors",
    label: "Stash / Vendors",
    priority: 2,
    expectedArchetype: "inventory-rail",
    reference: "shared HQ reference chrome",
  },
  {
    screen: "raidResult",
    label: "Raid Result",
    priority: 2,
    expectedArchetype: "result-summary",
    reference: "reference-game-sequence.png panel 9",
  },
] as const;
