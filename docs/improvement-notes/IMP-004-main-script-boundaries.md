# IMP-004: Review main-script boundaries and historical diagnostics

[Findings register](README.md) · [Main script guide](../guides/main-automation.md)

- **Status:** Diagnostic cleanup implemented; broader structural review remains proposed.
- **Type:** Organization/documentation maintenance opportunity.
- **Recorded/source reviewed:** 2026-11-09, `v1.0.1-dev`.
- **Authorization:** User authorized cleanup of misleading diagnostics on 2026-11-10. A broader engine extraction is not part of that task.

## Evidence and connections

[ugmuls-5-5e-automation.js](../../scripts/ugmuls-5-5e-automation.js) combines a large feature-import list with Region event execution, initial shared-card registration, and Region behavior attachment. The guide maps those current boundaries. Before cleanup, its header and three diagnostic messages identified v0.8.4 although the manifest and branch had moved on. A separate [Spell Manager](../../scripts/spell-manager.js) header/startup message similarly identified v0.7.0.

Possible future boundaries are a feature-loading entry point, queued Region execution, initial-card/allowance registration, and GM-side attachment. No final filenames or extraction design are selected. Clearer section comments may be sufficient before any split.

Preserve the global `handleRegionEvent` bridge used by stored Region scripts and Conjure Animals movement; the single local event queue; the histories and captured event timing; synchronous initial-card seeding before queued updates; delegated movement/save hooks; and the distinct caster/active-GM authority paths. Avoid duplicate hook installation or circular imports.

## Future work and verification

- [ ] Inventory entry points, indirect callers, imported side effects, and fixture loaders before choosing an extraction.
- [x] Remove fixed-version startup labels and derive the main Ready version from installed module metadata in a separate small maintenance change.
- [ ] Run relevant Region/sharing/scaling/routing regressions before and after any move. Source-fragment test loaders may need deliberate updates; preserve their behavioral assertions.
- [ ] Run the full local suite with checks for a shared runtime change. Tests/tools remain Git-ignored.
- [ ] In Foundry, check player-created Regions, active-GM attachment, caster execution, shared initial/later cards, target restoration, movement accounting, tokenEnter attachment, and native Region effects. Use the linked guide's scenario table and record results.

## Diagnostic implementation record — 2026-11-10

- Main script startup/Region-hook messages now identify their stage without a fixed version. The Ready message reads Foundry's installed module metadata, falling back to `unknown` if unavailable.
- Removed Spell Manager's fixed-version header/startup label. It retains its registration message; the main Ready line supplies installed-version information.
- The manifest remains unchanged by this diagnostic task: it currently reports `1.0.0`. The branch and unreleased v1.0.1 changelog describe development work separately; no release version was invented for the console.
- No feature loading, hook registration, card/workflow logic, or engine boundaries were changed. No performance improvement is claimed.
- Five relevant Region/library/card/target-sync test files passed before and after the diagnostic changes. `node tools/run-tests.mjs --checks` passed: 366 discovered test files, zero failures; syntax checked for 315 runtime scripts, manifest files and relative imports verified. A direct evaluation check confirmed actual-version output, changed-version output, and the missing-metadata fallback.
- In-game console verification has not been performed. On refresh, check the main Ready version against the installed manifest and the unversioned Spell Manager/Region registration messages.
- Changes remain local and uncommitted by this task. The broader extraction proposal remains deferred.
