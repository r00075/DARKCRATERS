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
    screen: "craterRuns",
    label: "Crater Runs / Operation Selection",
    priority: 1,
    expectedArchetype: "operation-terminal",
    reference: "public/design-reference/ui/reference-game-sequence.png panel 4 and public/design-reference/ui/reference-map.jpg",
    intendedComposition: [
      "DARK CRATERS deployment terminal with top readiness chrome, compact Tier 1-5 route rail, central projected tactical map, right selected operation briefing, objective family strip, and stable command strip.",
      "Tier rail stays compact and shows risk level, time, loot band, threat, selected route, and selected state without paragraph-heavy mission cards.",
      "Projected map is the visual heart: insertion marker, objective marker, extraction marker, route line, hazard zones, Lumen trace, selected crater zone, and route confidence.",
      "Selected briefing presents operation name, mission family, objective flavor, win condition, risk, route, gear readiness, recommended gear, reward band, and hazards as concise rows.",
      "Objective family strip exposes Evidence/Lore, Salvage/Materials, Heavy Cargo, Signal/Relay, Containment/Specimen, and Security/Threat variety from existing mission flavor language.",
      "Review Assignment opens Deployment Assignment and Begin Descent remains only on Deployment Assignment.",
    ],
    forbiddenRegression: "Generic difficulty card shop, five paragraph-heavy cards, no visible tactical route map, no visible objective variety, hidden Review Assignment, or full-page scroll required to choose a run.",
    validationChecklist: [
      "08-crater-runs.png reads as a projected lunar deployment terminal before reading labels.",
      "Tier selection updates selected operation and selected state while Review Assignment remains a separate bridge.",
      "Central map is the dominant visual area and includes route, objective, extraction, hazard, and Lumen signal markers.",
      "Selected operation briefing is readable without repeated tier-card paragraphs.",
      "Mission family and objective flavor are visible and distinct from selected tier.",
      "Review Assignment, Loadout, Ship Systems, Campaign/Contracts, and Habitat Hub actions remain visible at 1600x900.",
      "No horizontal overflow, bottom command clipping, or five-card scroll wall.",
    ],
  },
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
    priority: 1,
    expectedArchetype: "inventory-rail",
    reference: "public/design-reference/ui/reference-player-custom.jpg",
    intendedComposition: [
      "TYCHOSTAR runner prep bay and suit locker with compact top readiness chrome, left equipment rail, central player model hero, right selected slot detail rail, readiness summary, and bottom command strip.",
      "Gear mode presents Primary, Sidearm, Melee/Tool, Armor, Backpack, Tactical Tool, Consumables, and EVA Pack / carried supplies as compact readiness slots.",
      "Cosmetics mode uses the same prep bay shell with customization category rail, central suit preview, selected style detail rail, and compact cosmetic browser.",
      "Review Assignment, Weapon Bench, Habitat Stash, Class, and Back to Habitat remain visible and do not directly begin descent.",
    ],
    forbiddenRegression: "Generic slot list around a mannequin, detached command buttons, hidden/clipped model, stale selected slot detail, whole-page scroll wall, or cosmetic mode that feels like a separate unfinished page.",
    validationChecklist: [
      "04-loadout.png shows a runner prep bay before reading labels.",
      "Player model is the focal point and is not clipped or covered by text.",
      "Equipment rail is compact, selected slot is obvious, and right detail matches the selected slot.",
      "Gear/Cosmetics toggle is clear and 04b-loadout-cosmetics.png uses the same shell when captured.",
      "Review Assignment, Weapon Bench, Habitat Stash, Class, and Back to Habitat actions remain visible.",
      "No horizontal overflow or bottom command clipping at 1600x900.",
    ],
  },
  {
    screen: "campaignCodex",
    label: "Campaign / Codex",
    priority: 1,
    expectedArchetype: "dossier",
    reference: "reference-game-sequence.png, reference-map.jpg, and reference-Lumen.jpg",
    intendedComposition: [
      "Compact top dossier chrome with act, operation, evidence, truth, suspicion, and compliance status visible.",
      "Left operation archive rail with selectable operations and reduced filter controls.",
      "Dominant center investigation board showing selected operation, official story, field conflict, unresolved lead, and evidence archive matrix.",
      "Selected evidence detail presents long public/restricted/hidden text while sealed entries stay concise elsewhere.",
      "Right rail exposes truth, suspicion, compliance, findings, next actions, and active contract summary.",
      "Bottom command strip stays visible for Crater Runs, Review Assignment, Vendors, Refresh Contracts, and Back to Habitat.",
    ],
    forbiddenRegression: "Dense contract database wall, generic cards with no investigation hierarchy, hidden or clipped dossier metrics, repeated long evidence text in every row, bottom command clipping, changed campaign/evidence IDs, changed unlock/discovery/save behavior, or broken existing data-action navigation.",
    validationChecklist: [
      "09-campaign-contracts.png reads as a campaign dossier before reading labels.",
      "Official story and hidden truth/field conflict are visually separated.",
      "Evidence archive rows are compact and selected evidence detail is the only long-form evidence panel.",
      "Truth, suspicion, and compliance metrics are visible without scrolling at 1600x900.",
      "Crater Runs, Review Assignment, Vendors, Refresh Contracts, and Back to Habitat actions remain visible and use existing actions.",
      "No horizontal overflow or bottom command clipping at 1600x900.",
    ],
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
