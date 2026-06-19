# DARK CRATERS Descent Sequence Plan

Phase 13.8R locks the descent direction without implementing final video assets or changing raid launch behavior. Phase 13.8R-A begins the visible ship integration.

## Locked Direction

- The descent is a third-person exterior cinematic bridge from Deployment Assignment into active crater gameplay.
- The Kestrel-9 remains visible; the ship is not hidden behind moon-only footage.
- The visible ship asset for the intended sequence is the flying/in-flight Kestrel-9 GLB.
- Do not use the landed or gear-down Kestrel-9 version unless no flying version exists.
- Flying ship GLB integration belongs in Phase 13.8R-A unless a safe existing hook already exists.
- The lunar orbital-to-surface scale is faked with a background video layer, poster layer, CSS fallback, or image-sequence layer behind/around the ship.
- The background layer is not the whole experience. Ship, HUD, telemetry, landing quality, skip/debug affordance, and final handoff remain game-rendered and game-controlled.
- The intended final direction is not cockpit POV, not first-person-only landing footage, not a camera under the lander, and not hidden-ship moon footage.
- The camera target is a Drift-Wave-like rear three-quarter chase: behind and above the ship, with forward lead, smooth lag, readable hull length, and subtle banking. Side-on static presentation and head-on blob framing are not accepted.
- The inflight GLB is isolated under descent-only roots. Its neutral runtime material, dedicated light, imported nodes, and imported effects must never mutate world, map structure, or proxy materials or visibility.
- `ENABLE_STRUCTURE_GLBS` remains false; the descent pass does not re-enable direct structure GLB rendering.

## Existing Flow To Preserve

- Deployment Assignment `Begin Descent` uses the existing `class-deploy-solo` action.
- Multiplayer deployment uses `class-deploy-multiplayer`.
- `class-deploy-solo` calls `startRaid(false)`.
- `startRaid()` calls `resetRaid()`, which starts `OrbitalDeploymentSequence`, enables the ship presentation, and enters the current raid/deployment state.
- `OrbitalDeploymentSequence` currently runs dock release, clearance burn, transit corridor, signal interference, optional route reacquisition, lunar approach, final descent, stabilization, touchdown, deploying, and complete.
- K skip and debug landing quality keys remain preserved.
- `completeShipLandingDeployment()` remains the handoff into active gameplay and Tycho raid music.

## Future Asset Paths

These are planned locations only. Do not require them at runtime until real assets exist and missing-safe fallback behavior is implemented.

- `public/video/descent/lunar-descent-approach.mp4`
- `public/video/descent/lunar-descent-approach.webm`
- `public/video/descent/lunar-descent-poster.png`
- `public/video/descent/frames/descent-0001.png`
- `public/video/descent/frames/descent-0002.png`

The selected flying asset is `public/models/ships/kestrel-9-inflight.glb`, exposed at `/models/ships/kestrel-9-inflight.glb`. The landed variant is not used for descent while this asset exists. If loading fails, the existing procedural `LandedShip` remains visible and the deployment flow continues.

## Implementation Phases

### Phase 13.8R-A - Descent Placeholder / Third-Person Ship Framing Cleanup

- Integrated `/models/ships/kestrel-9-inflight.glb` as the visible descent ship.
- Kept the procedural `LandedShip` as missing/failed-model fallback and touchdown handoff.
- Tightened trailing three-quarter exterior framing without changing sequence duration.
- Added a CSS lunar-approach fallback plate and reserved future media-layer classes behind the ship/HUD.
- Added `12-descent-bridge.png` capture with K-skip handoff verification.
- No video is required or loaded in this phase.

### Phase 13.8R-A2 - GLB Isolation / Chase Framing Acceptance

- Own every imported top-level ship node beneath a descent-only model pivot.
- Stop and dispose imported animation, particle, sprite, and light side effects; retain only the dedicated descent key light.
- Apply the neutral hull material only to imported renderable ship meshes.
- Use a damped rear-quarter chase camera and sequence-driven yaw, pitch, and bank presentation.
- Capture active raid world state after K skip to guard against map/proxy visibility regression.
- Video remains deferred until isolation and framing are accepted.

### Phase 13.8R-B - Video-Backed Lunar Approach Layer

- Begin only after Phase 13.8R-A2 isolation and camera framing are accepted.
- Integrate MP4/WebM only if assets exist.
- Place the approach layer behind/around the ship.
- Fall back to poster, image, CSS, or current procedural presentation if video is missing.
- Do not hard-crash on missing media.

### Phase 13.8R-C - Landing Transition / Surface Entry Polish

- Connect descent end to raid map entry polish.
- Tune timing and fade/impact beats.
- Preserve landing quality resolution and existing raid start.

### Phase 13.8R-D - Skip / Debug / Accessibility Controls

- Add or refine optional skip controls.
- Expose debug timing safely.
- Add reduced-motion fallback.
