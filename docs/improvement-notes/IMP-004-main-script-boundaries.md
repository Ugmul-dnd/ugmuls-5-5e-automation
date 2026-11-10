# IMP-004: Review main-script boundaries and historical diagnostics

[Findings register](README.md) · [Main script guide](../guides/main-automation.md)

- **Status:** Proposed; no runtime changes.
- **Type:** Organization/documentation maintenance opportunity.
- **Recorded/source reviewed:** 2026-11-09, `v1.0.1-dev`.
- **Authorization:** Record findings during review; no extraction authorized.

## Evidence and connections

[ugmuls-5-5e-automation.js](../../scripts/ugmuls-5-5e-automation.js) combines a large feature-import list with Region event execution, initial shared-card registration, and Region behavior attachment. The guide maps those current boundaries. Its header and three diagnostic messages still identify v0.8.4, although the manifest and branch have moved on. Those strings can mislead diagnosis and should not be treated as installed-version evidence.

Possible future boundaries are a feature-loading entry point, queued Region execution, initial-card/allowance registration, and GM-side attachment. No final filenames or extraction design are selected. Clearer section comments may be sufficient before any split.

Preserve the global `handleRegionEvent` bridge used by stored Region scripts and Conjure Animals movement; the single local event queue; the histories and captured event timing; synchronous initial-card seeding before queued updates; delegated movement/save hooks; and the distinct caster/active-GM authority paths. Avoid duplicate hook installation or circular imports.

## Future work and verification

- [ ] Inventory entry points, indirect callers, imported side effects, and fixture loaders before choosing an extraction.
- [ ] Decide whether to remove hard-coded version diagnostics or derive them from the installed module metadata in a separate small maintenance change.
- [ ] Run relevant Region/sharing/scaling/routing regressions before and after any move. Source-fragment test loaders may need deliberate updates; preserve their behavioral assertions.
- [ ] Run the full local suite with checks for a shared runtime change. Tests/tools remain Git-ignored.
- [ ] In Foundry, check player-created Regions, active-GM attachment, caster execution, shared initial/later cards, target restoration, movement accounting, tokenEnter attachment, and native Region effects. Use the linked guide's scenario table and record results.

No extraction, diagnostic change, performance gain, or new in-game verification is claimed by this proposal.
