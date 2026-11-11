# IMP-011: Move Stinking Cloud expiry handling out of the Region library

[Findings register](README.md) · [Region library guide](../guides/region-library.md)

- **Status:** Implemented; core casting, turn, expiry, and concentration behavior user-confirmed.
- **Type:** Separate spell-specific behavior from general library responsibilities.
- **Recorded/source reviewed:** 2026-11-10, `v1.0.1-dev`.
- **Authorization:** Initially recorded for later; the user explicitly requested the Stinking Cloud extraction on 2026-11-10.

## Observation and history

[region-library.js](../../scripts/region-library.js) provides built-in recipes, composition/overrides, migration, save/reset, and native source-resolution calls. Before this extraction, its final section also implemented Stinking Cloud effect timing through private `isStinkingCloudEffect`, exported `prepareStinkingCloudEffect` and `endStinkingCloudTurn`, and spell hook registration. Those handlers now live in [stinking-cloud.js](../../scripts/stinking-cloud.js).

Git blame identifies that section as added in commit `36653a1` ("Lots of spell and region updates") on 2026-10-18, separately from the earlier library settings/migration hooks. It remains active functionality, not established obsolete code. The history does not explain why that file was chosen.

The user identified the mismatch during the guide review: a single spell's runtime effect handlers do not belong naturally beside reusable library data/calls.

## Proposed boundary

Consider a dedicated `scripts/stinking-cloud.js`, importing `getRegionSpellTable` from the library for the enablement check. Move the recognition, applied-copy preparation, outgoing-turn cleanup, and their hook registration together. Keep the Stinking Cloud recipe in `REGION_DEFAULTS`; library settings and migration hooks should also stay in the library.

Load the new feature module through one existing entry point or manifest route. Check dependencies before choosing it: having the library import the feature while the feature imports the library would introduce a cycle. Check callers/tests before removing the current exports or deciding whether a transitional re-export is worthwhile.

The intended first change is organizational only. Do not change the spell's condition, native source data, expiry semantics, settings, or recipe timing as part of moving files.

## Behavior and connections to preserve

- Recognize actor-applied copies using the supported native effect ID/name and source references; ignore unrelated effects.
- Respect the current Stinking Cloud recipe's enabled state through `getRegionSpellTable`.
- Prepare only applied copies with the current duration fields; preserve the book effect and native condition.
- On real combat turn/round changes, use active-GM authority and inspect only the outgoing combatant's actor.
- Preserve same-application-turn end cleanup, while keeping other actors' and unrelated effects intact.
- Register each listener once; preserve application ordering and the normal Region/save/card workflows.

## Verification plan for future implementation

- [ ] Inventory imports, exports, manifest order, and local test loaders before moving the functions.
- [ ] Run existing `stinking-cloud` regressions first, then update fixture loading deliberately while preserving the named scenarios/assertions.
- [ ] Verify recognition, enabled/disabled behavior, same-turn expiry, no deletion on irrelevant combat changes, non-authority clients, and native source/condition preservation. Add meaningful missing coverage if required.
- [ ] Run relevant Region-library/expiry/application checks, then `node tools/run-tests.mjs --checks` after the runtime move. Confirm relative imports and any manifest entry. Local tests/tools remain ignored.
- [ ] In Foundry, apply the native condition during the target's turn and confirm its outgoing-turn removal; repeat with another actor/unrelated effect, GM/player clients, and the option disabled. Record actual outcomes.

## Record

- **Implementation:** 2026-11-10, `v1.0.1-dev` working tree; not committed or published by this task.
- **Runtime changes:** Moved recognition, applied-copy preparation, outgoing-turn cleanup, and their hooks unchanged into `stinking-cloud.js`. Added one manifest entry immediately after the Region library. Kept recipe/settings/migration in the library; no runtime importers of the removed spell exports were found, so no compatibility re-export/cycle was introduced.
- **Tests:** Updated the existing ignored local Stinking Cloud fixture to load the dedicated module while preserving its recipe, placement, native-source, disabled/unrelated, same-turn/round, and authority assertions. Added a hook-boundary case using the shared hook-bus helper: no spell listeners from the library, one listener per event from the spell, working applied-copy preparation, and one ordered manifest entry.
- **Targeted verification:** Four selected Stinking Cloud/library/card-effect/placement files passed before and after extraction.
- **Full verification:** `node tools/run-tests.mjs --checks` passed: 365 discovered test files, zero failures; syntax checked for 314 runtime scripts, manifest files and relative imports verified.
- **User-confirmed in-game checks, 2026-11-10:** Casting works from both GM and client. The user additionally confirmed working turn handling and expiry, the check occurring at the start of the turn, no application on cast, and working cleanup when concentration breaks. The report does not establish that every scenario was repeated on both clients; exact round-rollover, disabled-option, and unrelated-effect scenarios were not separately specified.
- **Next step:** Core extraction is implemented and its reported gameplay path is confirmed. Retain the remaining detailed scenarios as regression checks for future changes; no further spell behavior changes are proposed.
