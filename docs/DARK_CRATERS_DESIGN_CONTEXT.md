# DARK CRATERS Design Context

## 1. Project Identity

DARK CRATERS is a third-person browser-based lunar extraction survival game. It is built with TypeScript, Vite, Babylon.js, and a Colyseus multiplayer foundation.

A public playable build exists, but source files must not embed deployment domains, private endpoints, ngrok details, tokens, credentials, or local machine configuration.

## 2. Core Game Loop

The intended loop is:

PLAY/audio gate -> Habitat HQ preparation -> Ship Systems / Arsenal / Class Assignment / Skill Matrix / Loadout / Faction Contracts / Habitat Stash / Fabrication Bench -> Crater selection -> orbital deployment from Habitat -> controlled lunar transit and final descent -> landing quality resolution -> raid exploration, combat, loot, and objectives -> EVA Pack and ship cargo decisions -> ship repair or stabilization when needed -> personal ship extraction or fallback return -> results and progression -> Habitat HQ.

## 3. Current Implemented Systems

Confirmed in source:

- PLAY/audio gate in `src/main.ts`.
- Menu and Tycho raid music through `src/audio/darkCratersAudio.ts`.
- Ship descent/touchdown audio hooks through `src/audio/ShipAudioManager.ts`.
- Tycho music begins after deployment through `src/runtime/App.ts`, rather than at initial descent start.
- Habitat HQ cards and navigation through `src/hq/HQManager.ts` and `src/runtime/App.ts`.
- Ship Systems, Arsenal, Class Assignment, and Skill Matrix HQ panels.
- Settings screen with graphics, audio, controls, and gameplay tabs.
- Large-map navigation, tactical map overlay, POI markers, ship/cargo/launch markers, route pings, boundary feedback, and travel event hooks in the runtime/HUD/world systems.
- Existing weapon architecture: definitions, loadout, inspect, attachments, durability, jamming, repair, upgrades, and combat.
- Arsenal is a presentation/navigation path over existing weapon inspection behavior.
- Class Assignment foundation with Surveyor, Salvager, Security, and Systems Specialist.
- Skill Matrix foundation with crater navigation, Lumen signature, field recovery, suit stability, and response discipline branches.
- ShipManager/LandedShip systems for landing quality, integrity, readiness, cargo capacity, cargo transfer, cargo manifest, repair tradeoffs, heavy recovery eligibility, and ship-based extraction through the existing ExtractionController flow.
- Playable orbital Habitat-to-surface deployment foundation through `src/ship/OrbitalDeploymentSequence.ts`, with constrained transit alignment, a signal-drift/reacquisition event, final stabilization, K skip, and local presentation resources in `src/ship/OrbitalDeploymentScene.ts`.
- Tycho Scar includes a focused landing-zone visual vertical slice through `src/world/TychoScarVisualSlice.ts`, centered on the landed ship field base, immediate recovery route, and a nearby industrial mining/recovery staging area. Phase 9C tightens the deployment-to-surface handoff with restrained approach cues, cleaner camera reveal, reduced prototype marker dominance, and lightweight touchdown/contact presentation.
- Heavy cargo prototypes: Helium-3 Drill Core, Lumen Relic Mass, Reactor Spindle, Black Box Survey Crate, and Sealed Mining Cache.
- Lumen Essence item and a lightweight use notification hook.
- Colyseus multiplayer foundation with remote players, room status, server landing quality, early shared PvE enemy snapshots, server enemy damage/death events, and server enemy attack events.
- Shared World Protocol v1 covers ordinary shared caches and server-registered POI objective reward chests. Multiplayer POI reward chests unlock from server-confirmed objective completion and use the same claimant-aware container open/claim/depletion path as ordinary caches.

## 4. Ship Direction

Current implemented behavior:

- The personal ship is visible at the landing site.
- Raid start now includes a client-local orbital deployment presentation before surface handoff.
- Deployment provides limited constrained alignment control, a safe signal-drift/route-reacquisition event, and final stabilization before existing landing quality is applied.
- The current landing-zone art pass is a bounded visual slice, not complete map final art. It improves the ship field-base area, route readability, one industrial recovery POI, deployment approach readability, and touchdown contact treatment while preserving existing coordinates and interaction authority.
- Landing quality resolves as clean, rough, or damaged.
- Landing quality affects ship integrity, readiness, cargo capacity, cargo risk display, repair choices, and heavy recovery eligibility.
- EVA Pack loot can be transferred into ship cargo at the cargo bay.
- Quick Patch and Full Stabilize spend carried raid materials when available.
- Ship launch access uses the existing extraction/countdown/result flow.
- Fallback extraction routes remain available for safety and debug behavior.

Future direction, not currently implemented:

- Free-flight, orbital combat, synchronized crew descent, and shared flight authority.
- Ship damage from enemies or players.
- Ship theft, boarding, rides, shared cargo permissions, and stranded/orbital extraction.
- Server-authoritative ship ownership/cargo/repair.
- Persistent hull damage and post-raid repair economics.

Player-facing ship copy should stay understated. Prefer terms like Ship Integrity, Cargo, Heavy Recovery, Systems Require Stabilization, and Initiate Return.

## 5. Lumen Lore Rules

The alien species is player-facing as the Lumen. Do not reintroduce visible Umbra language.

Early Lumen encounters should read as reactive, drone-like, or instinctive. Later development may imply rapid adaptation, reverse-engineering of human technology, and escalating sophistication, but ordinary UI should not reveal the full arc.

Lumen exploit light in unusual ways: bright exposure can obscure certainty, while subtle bioluminescent traces can betray them in crater darkness. Lumen Essence is a recoverable material associated with trace reading, signature analysis, and future tracking.

Do not mass-rename technical IDs, save keys, or stable identifiers only for lore cleanup if doing so risks save or runtime compatibility. Legacy storage keys may remain.

## 6. Weapons / Arsenal Direction

Extend the existing combat architecture. Do not create a parallel weapon system.

Preserve:

- weapon definitions and runtime stat modifiers;
- loadout equipment;
- weapon inspection;
- attachment selection;
- durability, jamming, repair, and upgrades;
- existing shooting, ADS, reload, melee, and controller behavior.

Future class/skill effects may reference weapon handling, but should be added in isolated, testable passes.

## 7. Class / Skill Direction

Current class assignments:

- Surveyor: navigation, signal reading, and Lumen signature analysis.
- Salvager: recovery, materials, containment, and cargo decisions.
- Security: weapons, protection, and breach response.
- Systems Specialist: repair, equipment, and ship stabilization.

Current skill branches:

- Crater Navigation.
- Lumen Signatures.
- Field Recovery.
- Suit Stability.
- Response Discipline.

These systems are currently foundation/presentation/persistence only. Do not wire broad combat, ship, loot, oxygen, or multiplayer modifiers without a focused later task.

## 8. Map / Raid Direction

Tycho Scar / the current crater field is the active raid space. Preserve large-scale traversal, tactical map, POIs, active contract markers, route breadcrumbs, ship markers, cargo/launch markers, fallback extraction markers, boundary warnings, risk/distance tuning, and travel-event pacing when changing adjacent systems.

The personal ship is the primary normal return route, but fallback routes remain for safety and debug behavior.

## 9. Multiplayer Status and Roadmap

Current implemented multiplayer behavior:

- Colyseus room join/create.
- Remote player state replication and interpolation.
- Server room status, lifecycle, player count, ping, and landing quality.
- Early server-authoritative PvE enemy population with stable enemy IDs, compact snapshots, server damage/death events, and enemy attack events.
- Client network enemy rendering/interpolation separate from solo EnemyDirector.
- Solo raids keep local EnemyDirector behavior.
- Deployment flight presentation is currently local to each client. Existing server-backed landing quality, enemy, shared-world, container, and extraction-unlock authority must survive the transition and remain authoritative after surface handoff.

Phase 8 hardening target:

- Improve shared enemy lifecycle, diagnostics, interpolation correction reporting, and duplicate-local-enemy prevention.

Future deferred multiplayer work:

- Shared objective and container authority.
- Server-authoritative loot rewards and enemy drops.
- Broader server-authoritative objective, contract, and reward economy coverage beyond the current shared cache and POI reward chest container path.
- Server-authoritative ship cargo, repair, ownership, damage, theft, and boarding.
- Squad cargo permissions and disconnected player cargo handling.

## 10. Audio Rules

Audio routing rules:

- Menu music plays in HQ/menu.
- Descent-specific ship audio plays during descent.
- Tycho raid/map music starts only after touchdown/deployment, including K skip.
- Descent audio must stop/finalize before Tycho starts.
- Returning to HQ stops Tycho/ship audio and resumes menu music once.
- Settings must apply master/music/SFX/mute live without restarting or duplicating active tracks.
- PLAY/audio gate must remain intact; settings should not trigger autoplay before user input.

## 11. Deferred Systems

Do not implement without a focused task:

- ship theft, ship combat damage, boarding, rides, stranded/orbital extraction;
- active class combat/ship/network modifiers;
- active skill bonuses unless explicitly scoped;
- deep heavy-cargo expansion;
- advanced Lumen evolution gameplay;
- rival corporation/faction encounter AI;
- Obsidian Sentinel HQ/HUD/loadout GLB preview rendering;
- player-model asset cleanup or GLB deletion.

## 12. Source Control / Secret Safety

Never commit, stage, print, overwrite, or expose:

- `.env`;
- ngrok tokens or configs;
- local startup endpoint files;
- `.npm-cache`;
- `node_modules`;
- `dist`;
- logs;
- root audio working/source folders;
- private or sensitive documents;
- credentials or secrets;
- unrelated dirty/deleted/untracked GLB/model files.

## 13. Phase 10.1 Direction

Phase 10.1 preserves the dangerous Helium-3 Drill Core recovery loop instead of weakening it. The carrier remains slowed and weapon-locked; the intended co-op read is that one runner becomes vulnerable cargo transport while teammates escort and clear the return route. Pickup should communicate CORE SIGNATURE EXPOSED / LUMEN RESPONSE INBOUND, carried HUD should clearly show HEAVY CARGO CARRIER, HELIUM-3 DRILL CORE, WEAPONS LOCKED, ship distance, and X drop, and teammates should see an escort cue rather than authority/debug language.

Heavy cargo authority remains server-owned in multiplayer. The stable cargo ID is `heavy-cargo-helium-3-drill-core`, the lifecycle remains locked -> available -> carried -> dropped -> secured -> extracted, and the first-pickup pressure event should not reroll on every drop/recover. Carrier death/leave should release the core to a recoverable dropped state. Live validation still needs to confirm full two-client escort, drop/recover by teammate, secure, and extraction reward once.

The Habitat landing screen is moving from a scroll-heavy station dashboard into a full-screen command deck: persistent top navigation, central runner identity, compact left context, right deployment panel, and a secondary debug drawer. Primary navigation is PLAY, LOADOUT, ARSENAL, SHIP, CLASS, SKILLS, STASH, VENDORS, STYLE, and CONTRACTS, with Settings as a single utility entry. The command deck should avoid main-screen vertical scrolling at common desktop sizes while deeper inventory/progression screens may still scroll when content requires it.

Equipped Primary and Sidearm entries in the Habitat runner summary route directly to Inspect Weapon for the exact equipped weapon, preserving return context. Loadout keeps equipped slot management but moves large repeated actions into the selected item details panel.

Future Class Selection should build on this command-deck structure: a dark minimal cinematic screen, selected class centered, neighboring silhouettes, restrained copy, and a bottom preparation strip of CLASS -> LOADOUT -> SHIP PREP -> DEPLOY. Class gameplay balance and active modifiers remain deferred.

## 14. Phase 10.1.3 Integration Notes

Phase 10.1.3 keeps the validated multiplayer foundation intact and treats presentation/audio work as additive integration. The `landing-site-emergency-cache` regression gate is client-side: suppress duplicate `containerOpen` requests while the same cache request is pending or while that cache's loot panel is already active, without weakening server container authority, claimant-only rewards, or POI reward chest authority v2.

The Habitat Command Deck remains the preferred HQ shell: top navigation, left intel/context, central runner identity, right deployment action, and secondary debug tools. The Obsidian Sentinel GLB is scoped to an isolated Habitat preview only through `src/hq/HabitatRunnerPreview.ts`. It is not a gameplay player replacement, does not change collision, does not alter multiplayer remote-player rendering, and must keep a stable CSS fallback if the GLB fails.

Production SFX are mapped through `src/sfx/ProductionSfxRegistry.ts` and played through the existing settings-aware SFX path. New SFX hooks must respect master/SFX/mute settings, avoid autoplay before the PLAY gate, and avoid duplicate spam on repeated network events. Music routing remains separate: menu music, deployment/descent audio, and Tycho surface music lifecycle rules still apply.

The heavy-core safe-drop correction remains server-authoritative: manual drops, downed releases, and leave releases resolve to a ground-safe Y position and broadcast the approved cargo position. The heavy cargo lifecycle, first-pickup-only pressure event, release-on-downed, revive authority, secure/extract, and exactly-one heavy reward behavior remain preserved.

Future work remains focused: cinematic class selection and gameplay player-model integration are separate milestones. Do not combine them with cache authority, heavy cargo stability, or audio routing changes.

## 15. Phase 10.2 Class Selection Flow

Phase 10.2 adds a cinematic pre-deployment class confirmation step without changing multiplayer authority. Habitat `DEPLOY` and multiplayer deployment now route through a single-screen class assignment flow before the existing crater-run loading and ship-centered deployment sequence. The screen reuses the real class definitions and `ClassManager` persistence path; it does not create parallel class save data, active class modifiers, loadout restrictions, or protocol state.

The Obsidian Sentinel GLB remains preview-only. `HabitatRunnerPreview` supports separate Habitat and Class Selection framing, with the Habitat model scaled smaller, raised above the stage, and turned toward the viewer. Gameplay player scale, collision, remote-player rendering, carry/downed/revive visuals, and the original GLB file are intentionally untouched.

The Habitat-to-deployment loading transition uses `public/ui/backgrounds/Preparing-for-crater-run.png` through the existing loading-screen manager. The initial PLAY gate continues to use `DARKstart.png`, and the Play-to-Habitat transfer continues to use `Loading-into-Habitat.png`. Deployment timing, K skip, mouse orbit, wheel zoom, and Tycho music handoff remain governed by the existing deployment systems.

## 16. Phase 10.2.1 Cache and Ship Dashboard Direction

Concurrent ordinary shared-cache opening must remain claimant-only but panel-safe. Multiple clients may open the same undepleted server-owned cache before any claim; each client should bind its own local loot panel to the authoritative container state, and later claim broadcasts must refresh other open panels without clearing them into an unusable state. Stale same-item claims should reject safely and return the current authoritative contents.

The Ship Systems screen now presents the player craft as `Kestrel-9`, Prospector class, through a widescreen dashboard rather than the old tall terminal page. Runtime ship integrity, cargo capacity, cargo risk, module state, credits, and stash resources remain live-bound where available. Fuel efficiency, extraction speed, signal strength, drone capacity, and some module/effect rows are staged dashboard placeholders until a later focused ship progression pass binds them to real gameplay.

Future multiplayer ship direction is documented only, not implemented in Phase 10.2.1: multiplayer should eventually flow from Habitat into a dedicated Crew Staging / Ship Bay lobby, with each player choosing class/loadout/readiness, boarding one shared crew ship, and a crew leader authorizing deployment and final extraction departure. Leadership transfer should be server-authoritative only for disconnect, abandonment, or permanent unrevivable elimination; a merely downed but revivable leader should retain command. Player boarding states, anti-grief extraction fallbacks, crew lobby networking, party formation, launch voting, and shared mission-selection authority remain deferred.

## 17. June 1 HQ Stabilization Notes

Phase 10.2.2 modernizes Loadout and Arsenal as presentation/management screens only. Loadout now frames equipped gear as a locker dashboard with Primary, Sidearm, Melee/Tool, Utility, Armor/Suit Module, and EVA Pack readiness slots, while Arsenal becomes a Weapon Workbench for current weapon definitions, repair, upgrade, attachment, compare, and preview staging. Weapon display names may use DARK CRATERS field identities such as MK-3 Survey Pistol, PR4 Pulse Rifle, Breach-12 Scattergun, and Longline Marksman Rifle, but stable weapon IDs and save keys remain unchanged.

Weapon GLB previews are HQ/Workbench-only and must remain isolated from gameplay player weapons, collision, multiplayer replication, and combat rendering. Missing weapon GLBs should fall back to a schematic preview instead of breaking the screen.

Phase 11.0 is the proper milestone for the in-raid EVA Pack / weapon equip-swap loop: equip a weapon from EVA Pack into Primary or Sidearm, move the previous weapon into the EVA Pack if space exists, block while downed, block while carrying heavy cargo, and preserve weapon instance/durability data. Phase 10.2.2 must not implement that runtime swap loop.

The class assignment now owns the major Obsidian Sentinel suit identity in HQ presentation. `ClassDefinitions` maps Surveyor, Security, Salvager, and Systems Specialist to class-specific preview GLB candidates under `public/models/player`, with `/models/player/obsidianSentinelPlayer.glb` as the final fallback. This remains Habitat/Class preview only; gameplay player scale, collision, remote-player rendering, GLB source assets, revive/downed animation, and weapon attachment systems are not replaced by this mapping.

Cosmetics are class-scoped minor overlays instead of the primary character identity. The Style route remains a stable internal navigation key, but player-facing copy should describe suit finishes, helmet variants, visor/mask choices, EVA pack skins, weapon trim, emotes, and banners. Cosmetic choices do not affect stats, class assignment, gear capacity, multiplayer authority, or extraction rewards.

Ordinary shared-cache UI must never silently render an empty claim panel after a server-approved open response with items. While awaiting authority, the panel should show a loading state; if a server item type is unknown to the current client item definitions, the panel should render a claimable unknown-item fallback row using the server item identity for the claim request. Repeated open spam remains suppressed by the client pending/open-panel guard, but claimant-only server authority remains the source of truth.

Failed multiplayer joins should stay on a diagnostics screen instead of silently returning to Habitat. The screen should show the attempted Colyseus endpoint, derived matchmaking URL, connection status, lifecycle event, and last error, with Retry, Return to Habitat, and Copy Diagnostics actions. This is client presentation only and does not alter room authority, shared containers, heavy cargo, revive, enemy sync, or extraction.

Heavy cargo carrier-loss handling should only resolve and broadcast a drop when the affected player is the current authoritative carrier. Non-carrier leave/downed events should not produce noisy drop-resolution diagnostics or move the core. The validated release-on-downed, release-on-leave fallback, safe dropped-core height, first-pickup pressure event, secure, extraction, and exactly-one heavy reward behavior remain preserved.

The Kestrel-9 Ship Systems dashboard should be a no-scroll widescreen management view with player-facing copy that avoids saying placeholder or staged. Runtime-bound ship state should be used where available; unimplemented values can remain dashboard display values, documented here rather than labeled in normal UI. A future ship systems pass can bind fuel efficiency, signal strength, drone capacity, extraction speed, and deeper module effects to real progression.
