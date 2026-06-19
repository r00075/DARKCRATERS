export type DarkCratersScreenTarget =
  | "initialPlayGate"
  | "habitatHub"
  | "craterRuns"
  | "deploymentAssignment"
  | "descentSequence"
  | "loadout"
  | "arsenal"
  | "shipSystems"
  | "classSelection"
  | "skillMatrix"
  | "campaignCodex"
  | "stashVendors"
  | "raidResult";

export type DarkCratersLayoutArchetype =
  | "play-gate"
  | "hub-stage"
  | "operation-terminal"
  | "assignment-review"
  | "descent-bridge"
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
    "play-gate": "Cinematic lunar exterior title gate with Play primary, sparse secondary/status copy, and audio/init behavior preserved.",
    "hub-stage": "Atmospheric habitat bay with command rail, dominant runner/stage, and field-order rail.",
    "operation-terminal": "Deployment terminal with compact tier rail, projected tactical route map, selected operation briefing, objective family strip, and command strip.",
    "assignment-review": "Mission confirmation with mission summary, runner readiness, loadout readiness, and one final descent action.",
    "descent-bridge": "Third-person Kestrel-9 descent bridge with visible ship, game-rendered HUD/telemetry, and a fake lunar approach layer behind the ship.",
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
    initialPlayGate: [
      "Reference: public/design-reference/ui/reference-game-sequence.png panel 1 / PLAY / AUDIO GATE.",
      "Required asset: /ui/backgrounds/start-screen-background.png.",
      "When the selected background asset already contains the DARK CRATERS title and quarantine signage, the Play Gate is image-first: app UI adds Play/action affordances only.",
      "Do not duplicate baked title text, baked warning signage, or a separate tagline if the selected background does not include it.",
      "Must read as the DARK CRATERS front door: cinematic lunar exterior, obvious Play primary, visible lunar base/signage art, and sparse access/status atmosphere.",
      "00-start-screen.png is the acceptance artifact and Play must remain the dominant action.",
      "Preserve the existing Play/audio initialization behavior; this screen is an audio gate, not a direct raid or Habitat route.",
      "Forbidden regressions: second DARK CRATERS title over baked title, second tagline over baked art, second warning card over baked warning sign, heavy overlay burying the background, large opaque menu card fighting the composition, hidden or weak Play button, or skipping audio gate behavior.",
    ],
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
      "Must be a unified orbital habitat command deck, not a floating character preview with detached debug cards or a flat grid showroom.",
      "First-impression priority: it must be proportionally aligned with rebuilt HQ screens, not accepted only because it has no clipping.",
      "Must fit practical browser viewports, not only the 1600x900 capture canvas; right field-order rail, resource/status strip, and bottom nav stay inside the shell.",
      "Optional asset: /ui/backgrounds/habitat-hub-background.png may be used only as a darkened background plate behind the center bay.",
      "Required zones: compact top command chrome, left operator rail, dominant environmental bay with runner placed inside it, one center mission console, right field-order rail, and stable bottom nav.",
      "Center bay needs visible industrial depth: ceiling rig, side service racks, rear wall/window plane, floor perspective, runner plinth, and console lighting tied to the scene.",
      "Left operator rail and right field-order rail should read as docked command terminals attached to the habitat bay, not generic floating cards.",
      "If image-backed, the background must not hide the runner, mission console, field order, or bottom navigation.",
      "Forbidden regressions: dead black margin imbalance, buried background plate, mission console floating, right field-order terminal clipped in live browser, resource/status strip forcing horizontal overflow, bottom nav off-shell, or visually weak Review Assignment.",
      "Mission console has Review Assignment primary and Change Operation secondary; Begin Descent appears only on deployment assignment.",
      "Field-order rail shows title plus concise Family, Objective, Risk, Route, Gear, Contract, and Signal rows without overlap.",
    ],
    deploymentAssignment: [
      "Reference: projected gameplay sequence panels 4 and 5 bridge.",
      "Must read as launch authorization and descent bridge, not a generic ready-check database layout.",
      "Required zones: compact assignment chrome, left TYCHOSTAR field-order rail, central runner deployment bay, right descent readiness rail, and bottom launch command strip.",
      "Begin Descent must be visible, strongest, and reserved for this screen; Habitat Hub only reaches this screen through Review Assignment.",
      "Class/model stage must read as a deployment bay, suit lock, or launch cradle, not a mannequin on a flat grid.",
      "Future descent direction: third-person Kestrel-9 cinematic over a faked lunar approach video layer, using the flying/in-flight Kestrel-9 GLB as the visible ship asset when available.",
      "Forbidden regressions: class selection cards reappearing, Begin Descent hidden, side rails clipped, repeated mission data walls, model floating on a flat grid, or direct raid bypass from Habitat Hub.",
    ],
    descentSequence: [
      "Reference: public/design-reference/ui/reference-game-sequence.png panel 5 / DESCENT + LANDING.",
      "Locked direction: Drift-Wave-like third-person exterior chase framing with the Kestrel-9 trailing below center, readable in rear three-quarter silhouette, and visibly banking into the approach corridor.",
      "Phase 13.8R-A uses /models/ships/kestrel-9-inflight.glb as the visible descent ship; do not use the landed/gear-down variant while this flying asset exists.",
      "The imported ship subtree, runtime hull material, light, and presentation nodes are descent-only; no ship material fix may sweep or mutate world, map structure, or proxy materials.",
      "The procedural LandedShip remains the missing/failed-GLB fallback and resumes at touchdown so raid entry cannot be blocked by presentation loading.",
      "Large-scale orbital-to-surface motion is faked with a background MP4, WebM, poster, CSS, or image-sequence layer behind/around the ship.",
      "The fake background layer is not the whole experience: ship, HUD, telemetry, quality feedback, and final transition remain rendered and controlled by the game.",
      "Final intended descent is not a procedural ground-only view, cockpit POV, first-person-only landing footage, a camera underneath the lander, a side-on static beauty render, a head-on blob, or hidden-ship moon-only footage.",
      "Forbidden isolation regressions: map/proxy structures become invisible after ship import, scene-wide material/light sweeps, or direct structure GLBs being re-enabled.",
      "Sequence bridges Deployment Assignment / Begin Descent into active raid gameplay without changing mission selection, landing quality authority, or raid launch behavior.",
      "Future video paths remain documentation targets until ship isolation and chase framing are accepted and missing-safe fallback is implemented: public/video/descent/lunar-descent-approach.mp4, public/video/descent/lunar-descent-approach.webm, public/video/descent/lunar-descent-poster.png.",
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
      "Reference: public/design-reference/ui/reference-game-sequence.png, public/design-reference/ui/reference-map.jpg, and public/design-reference/ui/reference-Lumen.jpg.",
      "Must read as a sealed lunar investigation dossier, not a dense contract database or generic card wall.",
      "Required zones: compact top dossier chrome, left operation archive rail, selected operation dossier with official story versus hidden truth, evidence archive matrix, selected evidence detail, truth/suspicion/compliance rail, and bottom command strip.",
      "Preserve campaign IDs, evidence IDs, act/operation unlock logic, save keys, discovery state, and all existing data-action paths.",
      "No overlapping rows, hidden metrics, bottom command clipping, or repeated long evidence text outside the selected detail.",
    ],
    stashVendors: [
      "Reference: public/design-reference/ui/reference-player-custom.jpg, public/design-reference/ui/reference-arsenal.jpg, and public/design-reference/ui/reference-game-sequence.png.",
      "Stash must read as a Habitat storage terminal with top chrome, category rail, center cargo grid, selected cargo detail, and bottom command strip.",
      "Vendors must read as a Habitat requisition terminal with top chrome, vendor/faction rail, goods/services catalog, supplier detail rail, and bottom command strip.",
      "Utility screens share resource chips, selected states, compact cards, contained internal scrolling, and stable command strips without becoming identical copies.",
      "Utility item grids must keep item and vendor names readable at 1600x900, preferring fewer columns over clipped fragments.",
      "Preserve stash item IDs, vendor IDs, prices, persistence, equipment behavior, buy/sell/repair actions, and existing data-action paths.",
      "No generic admin panels, giant empty catalogs, detached command buttons, overlapping item cards, illegible dashed/clipped names, vertical detail-value wrapping, page-length scroll walls, or broken selected states.",
    ],
    raidResult: [
      "Reference: projected gameplay sequence panel 9.",
      "Compact result summary with rewards, status, and one return path.",
    ],
  },
} as const;
