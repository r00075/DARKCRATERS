# DARK CRATERS

DARK CRATERS is a near-future lunar extraction shooter prototype built with Babylon.js, TypeScript, and Vite.

The crater is listening.

Helium-3 brought humanity to the Moon. Something beneath the craters answered. You play a Crater Runner deploying into lunar crater zones to loot, survive, fight The Umbra, complete faction contracts, and extract before oxygen, radiation, enemies, or environmental hazards overwhelm the run.

## Controls

- Click the canvas to capture the mouse.
- `WASD` or arrow keys move.
- Mouse moves the shoulder camera.
- `Space` jumps.
- Hold `Shift` to sprint.
- Hold `C` to crouch.
- Hold right mouse button to aim down sights.
- Mouse wheel zooms the normal third-person camera.
- Left mouse button fires.
- `R` reloads.
- `V` clears a weapon jam.
- Controller: left stick moves, right stick looks, left stick click sprints, `X` / Square crouches, `A` / Cross jumps, `B` / Circle interacts/extracts, left trigger aims, right trigger fires, D-pad Right reloads, D-pad Left uses a medkit, and `Y` / Triangle swaps weapons or clears jams when held.
- Settings menu supports graphics, audio, controls, and gameplay options with localStorage persistence.

## Run

```bash
npm install
npm run dev
```

## Slice Contents

- Babylon.js scene setup with stylized lunar crater zones, POIs, cover, loot containers, and Lunar Ascender extraction zones.
- Third-person shoulder camera with pointer-lock mouse look.
- Delta-time WASD movement, sprint, jump, gravity, grounded detection, crouch, ADS, bunnyhop momentum, and smooth acceleration/deceleration.
- Combat systems with multiple weapon types, attachments, ammo, reloads, dry fire, recoil, muzzle flash, hit markers, durability, jamming, and repair.
- AI enemies, stealth/noise propagation, vision modifiers, weather/time-of-day, patrols, chases, attacks, and squad alerts.
- Crater Run loop with loot, EVA Pack inventory, extraction, death/loss outcomes, Habitat Stash persistence, loadouts, faction contracts, dynamic events, and crater-tier scaling.
- DARK CRATERS lunar terminal art direction with bold readable UI, rarity-colored loot, Helium-3 resources, The Umbra enemy lore, and clean browser-friendly visuals.

## Architecture

- `src/runtime/App.ts` owns Babylon engine setup and the frame loop.
- `src/theme/ThemeConfig.ts` centralizes brand, theme colors, rarity colors, POI names, extraction naming, and faction labels.
- `src/input/InputController.ts` merges keyboard, pointer-lock mouse, and Gamepad API input into immutable snapshots.
- `src/settings/SettingsManager.ts` owns saved player settings and input bindings.
- `src/world/PlayerMotor.ts` owns deterministic, delta-time kinematic movement state.
- `src/world/PlayerCharacter.ts` builds the placeholder stylized character and collision root.
- `src/animation/PlayerAnimationController.ts` owns procedural placeholder animation blending and combat/movement pose state.
- `src/camera/ThirdPersonCameraRig.ts` handles the shoulder camera.
- `src/world/createWorld.ts` creates the collision and POI environment.
- `src/weapons/WeaponController.ts` owns weapon runtime behavior.
- `src/stealth/NoiseSystem.ts` owns movement/combat interaction noise propagation.

Input snapshots, motor state, weapon state, AI perception, raid inventory, and scene visuals are deliberately separated so the prototype can later support replicated input commands, client prediction, reconciliation, server-authoritative snapshots, and backend inventory/weapon systems without rewriting the core loop.
