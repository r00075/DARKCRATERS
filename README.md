# DARK CRATERS

**DARK CRATERS** is a near-future lunar extraction shooter prototype built with **Babylon.js**, **TypeScript**, **Vite**, and a growing **Colyseus multiplayer** foundation.

**The crater is listening.**

Helium-3 brought humanity to the Moon. Something beneath the regolith answered.

You play as a Crater Runner deployed into hostile lunar extraction zones where corporate pressure, failing equipment, unstable crater conditions, and the rising presence of the **Lumen** turn every run into a gamble. Loot what you can, recover mission-critical materials, manage your EVA Pack, and extract before oxygen, radiation, enemies, or operational failure overtakes the run.

## Current Prototype Features

* Third-person lunar crater raids with pointer-lock shoulder camera movement.
* EVA Pack inventory with in-raid item management and weapon equip/swap support.
* Loot containers, shared cache authority, POI reward chests, and extraction rewards.
* Heavy cargo recovery, including Helium-3 drill core handling and ship-secure flow.
* Kestrel-9 ship systems with launch, extraction readiness, cargo capacity, and module progression.
* Habitat HQ screens for Play, Loadout, Arsenal, Ship, Class, Skills, Stash, Vendors, Style, and Contracts.
* Class-bound suit identity with minor cosmetic customization.
* Weapon workbench and Arsenal inspection with GLB preview / schematic fallback.
* Multiplayer raid room foundation using Colyseus.
* Lumen hostile ecology, patrol pressure, crater threats, and faction/corporate mission framing.
* Habitat Stash persistence and between-run loadout planning where currently supported.

## Controls

* Click the canvas to capture the mouse.
* `WASD` or arrow keys move.
* Mouse moves the shoulder camera.
* Mouse wheel zooms the third-person camera.
* `Space` jumps.
* Hold `Shift` to sprint.
* Hold `C` to crouch.
* Hold right mouse button to aim down sights.
* Left mouse button fires.
* `R` reloads.
* `V` clears a weapon jam.
* Use the interaction key shown in-game to loot, extract, open containers, operate the EVA Pack, and interact with mission objects.
* Controller support is partially implemented: left stick moves, right stick looks, left stick click sprints, `X` / Square crouches, `A` / Cross jumps, `B` / Circle interacts/extracts, left trigger aims, right trigger fires, D-pad Right reloads, D-pad Left uses a medkit, and `Y` / Triangle swaps weapons or clears jams when held.
* Settings support graphics, audio, controls, and gameplay options with localStorage persistence.

## Run Locally

```bash
npm install
npm run dev
```

The browser client runs through Vite. Multiplayer/server workflows are still prototype-stage and may require the separate server setup/scripts present in the repository.

## Architecture

* `src/runtime/App.ts` owns the main Babylon engine setup, runtime loop, Habitat/HQ routing, raid state, and many current prototype systems.
* `src/input/InputController.ts` merges keyboard, pointer-lock mouse, and Gamepad API input into immutable input snapshots.
* `src/settings/SettingsManager.ts` owns saved player settings and input bindings.
* `src/world/PlayerMotor.ts` owns deterministic delta-time movement state.
* `src/world/PlayerCharacter.ts` builds the current player character/collision root.
* `src/camera/ThirdPersonCameraRig.ts` handles the shoulder camera.
* `src/weapons/WeaponController.ts` owns active weapon behavior, firing, reload, recoil, durability, and jams.
* `src/raid` contains inventory, loot, raid definitions, and extraction-loop support.
* `src/hq` contains preview renderers such as runner, weapon bench, and ship dashboard previews.
* `server/rooms/RaidRoom.ts` contains the current Colyseus raid room foundation.
* `shared` contains shared protocol/types used between client and server.

Input snapshots, movement state, weapon state, raid inventory, AI perception, and scene visuals are intentionally separated so the prototype can continue toward replicated input commands, client prediction, reconciliation, server-authoritative snapshots, and backend inventory/weapon systems without rewriting the core loop.

## Development Status

DARK CRATERS is an active prototype. Systems are evolving quickly.

Some features are fully interactive, while others are scaffolded for future passes. Current limitations include prototype-level weapon persistence, local-client weapon swap authority, ongoing UI modernization, and future work for deeper multiplayer synchronization, account systems, crafting, economy, leaderboards, and long-form progression.

Large GLB assets are included in the project and may affect repository size or build warnings.

## License

License: not yet specified.
