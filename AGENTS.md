# DARK CRATERS Agent Notes

- Read `docs/DARK_CRATERS_DESIGN_CONTEXT.md` before major system changes.
- Treat the local working tree as the technical source of truth; inspect actual files before editing.
- Prefer isolated modules and small integration points over broad `App.ts` rewrites.
- Preserve working solo gameplay, multiplayer connection flow, ship systems, tactical map, loadout, stash, contracts, vendors, workbench, Arsenal, Class Assignment, and Skill Matrix unless the task explicitly changes them.
- Keep player-facing ship and Lumen language understated. Avoid explaining future ship theft, stranded extraction, or late Lumen intelligence reveals in normal UI.
- Do not rename technical save keys, internal IDs, or stable content identifiers for lore-only changes if that risks compatibility.
- Preserve audio routing: HQ menu music; descent audio during descent; Tycho music only after touchdown/deployment; cleanup on K skip, extraction, loss, and HQ return.
- Preserve deployment finalization: orbital deployment/descent must hand off through the existing landing-quality path, keep Tycho after surface deployment only, and must not clear multiplayer shared-world/container/enemy authority.
- Run `npm run build` after source changes and report any manual-test limits honestly.
- Never touch, stage, print, or expose secrets/local-only files: `.env`, ngrok configs/tokens, local endpoint startup files, `.npm-cache`, `node_modules`, `dist`, logs, root audio source folders, private docs, credentials, or unrelated dirty/untracked model files.
