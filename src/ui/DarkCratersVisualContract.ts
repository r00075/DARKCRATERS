export type DarkCratersScreenTarget =
  | "habitatHub"
  | "craterRuns"
  | "deploymentAssignment"
  | "loadout"
  | "arsenal"
  | "shipSystems"
  | "classSelection"
  | "skillMatrix"
  | "campaignCodex"
  | "stashVendors"
  | "raidResult";

export type DarkCratersLayoutArchetype =
  | "hub-stage"
  | "operation-terminal"
  | "assignment-review"
  | "four-card-selection"
  | "catalog-grid"
  | "ship-overview"
  | "lane-matrix"
  | "dossier"
  | "inventory-rail"
  | "result-summary";

export type DarkCratersVisualContract = Readonly<{
  screenChrome: readonly string[];
  navigation: readonly string[];
  panelHierarchy: readonly string[];
  colorRoles: Readonly<Record<"cyan" | "amber" | "green" | "purple" | "red", string>>;
  typographyScale: readonly string[];
  layoutArchetypes: Readonly<Record<DarkCratersLayoutArchetype, string>>;
  actionLanguage: readonly string[];
  density: readonly string[];
  scrollbars: readonly string[];
  screenTargets: Readonly<Record<DarkCratersScreenTarget, readonly string[]>>;
}>;

export const darkCratersVisualContract: DarkCratersVisualContract = {
  screenChrome: [
    "Compact top navigation and status strip remains visible on primary HQ screens.",
    "Left rail carries navigation, category, or context. Center carries the dominant visual or dossier. Right rail carries selected detail and actions.",
    "Bottom command strip is consistent, compact, and does not compete with the primary mission action.",
  ],
  navigation: [
    "Use one nav family: Crater Runs, Loadout, Arsenal, Ship, Class, Skills, Stash, Vendors, Style, Contracts.",
    "Review Assignment opens the assignment review path. Begin Descent starts deployment. Change Operation opens operation selection.",
    "Back buttons are for sub-screens and should not replace primary HQ navigation.",
  ],
  panelHierarchy: [
    "Panels are dark industrial surfaces with thin borders, low glow, and low-radius corners.",
    "Selected cards are bordered or accented, not filled with bright solid cyan.",
    "Avoid nested card stacks, giant empty panels, and equal-weight card walls.",
  ],
  colorRoles: {
    cyan: "Technical UI lines, labels, nav outlines, and quiet selection structure.",
    amber: "Selected state, primary confirmation, mission action, and industrial warning.",
    green: "Ready, safe, success, completed, and serviceable states only.",
    purple: "Lumen, resonance, anomaly, and evidence/codex signals only.",
    red: "Danger, failure, infection, and destructive warnings only.",
  },
  typographyScale: [
    "Screen titles are compact and uppercase, not hero-sized inside tool panels.",
    "Eyebrows are small uppercase labels with restrained tracking.",
    "Main screen paragraphs are clamped to two short lines; long lore belongs in detail panels.",
  ],
  layoutArchetypes: {
    "hub-stage": "Atmospheric habitat bay with command rail, dominant runner/stage, and field-order rail.",
    "operation-terminal": "Deployment terminal with compact tier rail, projected tactical route map, selected operation briefing, objective family strip, and command strip.",
    "assignment-review": "Mission confirmation with mission summary, runner readiness, loadout readiness, and one final descent action.",
    "four-card-selection": "Four large class cards with bottom overview, stat bars, loadout hints, confirm/back actions.",
    "catalog-grid": "Left category/manufacturer rail, central compact weapon index cards, selected hero inspection panel, technical bench section, and compact command strip.",
    "ship-overview": "Kestrel-9 hangar hero with large active ship preview, left identity rail, right systems rail, module/cargo strip, and bottom mission readiness command strip.",
    "lane-matrix": "Five-discipline skill tree console with top progress chrome, left discipline rail, dominant tiered node matrix, connector lines, selected node detail rail, and bottom command strip.",
    dossier: "Left operation/filter rail, center evidence or operation dossier, right progress/action rail.",
    "inventory-rail": "Left categories, center item/wares grid, right selected item or vendor detail.",
    "result-summary": "Compact summary, rewards/losses, ship/campaign status, and one return action.",
  },
  actionLanguage: [
    "One primary action per screen region.",
    "Begin Descent is reserved for the actual deployment start.",
    "Review Assignment is the mission-ready path, not a direct launch label.",
    "Deploy Multiplayer stays secondary until multiplayer readiness is explicit.",
  ],
  density: [
    "No repeated mission objective/step/risk fields on the same screen.",
    "Main cards show identity, status, and action only.",
    "Dedicated detail panels may scroll; primary screens should not become reports.",
  ],
  scrollbars: [
    "Primary nav and primary action remain visible at desktop and constrained devtools widths.",
    "Internal rails, catalogs, inventories, evidence lists, and detail panels may scroll.",
    "Avoid horizontal clipping and hidden right-side action rails.",
  ],
  screenTargets: {
    craterRuns: [
      "Reference: public/design-reference/ui/reference-game-sequence.png panel 4 plus public/design-reference/ui/reference-map.jpg.",
      "Must read as a lunar deployment terminal and route planning screen, not a generic difficulty card shop.",
      "Required zones: compact top deployment chrome, left tier/route rail, central projected tactical map, right selected operation briefing, objective family strip, and bottom command strip.",
      "Tier rail shows Tier 1-5 with risk, time, loot band, threat, route, selected state, and no paragraph-heavy cards.",
      "Projected map shows insertion, objective, extraction, hazard zones, Lumen trace, route line, selected zone, tier label, and route confidence/signal clarity.",
      "Selected briefing shows operation, family, objective flavor, win condition, risk, route, gear readiness, recommended gear, reward band, and hazards without repeated card copy.",
      "Objective family strip exposes Evidence, Salvage, Heavy Cargo, Signal, Containment, and Security variety using existing mission flavor language.",
      "Review Assignment remains the bridge to Deployment Assignment; Begin Descent remains reserved for Deployment Assignment.",
      "No whole-page scroll wall, hidden primary action, or five tall difficulty cards at 1600x900.",
    ],
    habitatHub: [
      "Reference: public/design-reference/ui/reference-game-sequence.png panel 2 / Habitat Hub.",
      "Must be a unified orbital habitat command deck, not a floating character preview with detached debug cards.",
      "Required zones: compact top command chrome, left operator rail, dominant environmental bay with runner placed inside it, one center mission console, right field-order rail, and stable bottom nav.",
      "Mission console has Review Assignment primary and Change Operation secondary; Begin Descent appears only on deployment assignment.",
      "Field-order rail shows title plus concise Family, Objective, Risk, Route, Gear, Contract, and Signal rows without overlap.",
    ],
    deploymentAssignment: [
      "Reference: projected gameplay sequence panels 4 and 5 bridge.",
      "Ready check with final Begin Descent action, not full class selection.",
    ],
    loadout: [
      "Reference: public/design-reference/ui/reference-player-custom.jpg plus projected gameplay sequence panel 3.",
      "Must read as a TYCHOSTAR runner prep bay / suit locker, not gear slots around a mannequin.",
      "Required zones: compact top readiness chrome, left equipment or customization rail, central player model hero in a suit locker bay, right selected slot/style detail rail, readiness summary, and bottom command strip.",
      "Gear mode must show compact readiness slots for weapons, armor, backpack, tactical tool, consumables, and EVA Pack / carried supplies.",
      "Cosmetics mode must reuse the same shell with customization categories, selected style detail, and existing apply/reset/randomize behavior.",
      "Selected slot detail must match the selected rail card; no stale compatibility item detail outside the compatibility modal.",
      "Review Assignment, Weapon Bench, Habitat Stash, Class, and Back to Habitat remain visible; Begin Descent only belongs on Deployment Assignment.",
      "No model clipping, horizontal overflow, detached command buttons, or whole-page scroll wall at 1600x900.",
    ],
    arsenal: [
      "Reference: public/design-reference/ui/reference-arsenal.jpg.",
      "Must read as a TYCHOSTAR field-industrial weapon catalog and bench, not a generic RPG inventory page.",
      "Required zones: top resource chrome, left category/manufacturer rail, center weapon catalog, right selected weapon hero/inspection panel, bottom Stats/Attachments/Upgrade/Repair technical section, and command strip.",
      "Selected weapon preview must be the visual focal point, contained inside a bench frame with schematic grid, glow, shadow, and small callouts.",
      "Catalog cards preserve canonical weapon names and show index, role/category, owned/equipped/prototype state, and condition as compact index rows without empty per-card model frames.",
      "The selected weapon hero panel is the only full weapon preview/model area on the screen.",
      "Attachments are compact chips, upgrade tiers do not overlap attachments, repair is visible, and existing equip/repair/upgrade/attachment actions remain wired.",
      "No horizontal overflow, model overlap, lower panel overlap, or bottom action clipping at 1600x900.",
    ],
    shipSystems: [
      "Reference: public/design-reference/ui/reference-ship.jpg.",
      "Must read as a Kestrel-9 hangar management screen, not a generic stat page.",
      "Required zones: compact top chrome, concise left identity rail, dominant center hangar hero, module/cargo strip, readable right systems rail, and bottom mission readiness command strip.",
      "Ship preview must be visually dominant, contained, and supported by hangar depth, floor perspective, bay framing, and service-light accents.",
      "Review Assignment remains the mission-ready path; Begin Descent remains reserved for Deployment Assignment.",
    ],
    classSelection: [
      "Reference: class selection screen.",
      "Four large class cards plus bottom overview and confirm strip.",
    ],
    skillMatrix: [
      "Reference: public/design-reference/ui/reference-skills.jpg plus Lumen tone from public/design-reference/ui/reference-Lumen.jpg.",
      "Must read as a Lumen progression matrix, not a generic card wall or empty grid.",
      "Required zones: compact top progress header, five-discipline left rail, dominant center tier matrix with connectors and lane separation, right selected calibration rail, and bottom command strip.",
      "Required states: acquired, available, locked, and selected/focused nodes are visually distinct without mutating existing skill IDs, effects, save keys, or prerequisites.",
      "Skill language stays lunar, field-calibration, survey, suit, containment, and Lumen analysis oriented rather than fantasy upgrade terminology.",
      "No horizontal scrollbar or nested double-scroll at 1600x900; command actions remain visible.",
    ],
    campaignCodex: [
      "Reference: projected map and Lumen dossier.",
      "Dossier zones with compact list entries and long text only in selected details.",
    ],
    stashVendors: [
      "Reference: shared HQ tool chrome.",
      "Inventory/vendor screens use the same left rail, center grid, right detail contract.",
    ],
    raidResult: [
      "Reference: projected gameplay sequence panel 9.",
      "Compact result summary with rewards, status, and one return path.",
    ],
  },
} as const;
