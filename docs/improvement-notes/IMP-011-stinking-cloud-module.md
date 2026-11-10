# IMP-011: Move Stinking Cloud expiry handling out of the Region library

[Findings register](README.md) · [Region library guide](../guides/region-library.md)

- **Status:** Proposed cleanup for later; not implemented.
- **Type:** Separate spell-specific behavior from general library responsibilities.
- **Recorded/source reviewed:** 2026-11-10, `v1.0.1-dev`.
- **Authorization:** The user requested recording this for a future update. No runtime extraction is authorized by this note.

## Observation and history

[region-library.js](../../scripts/region-library.js) primarily provides built-in recipes, composition/overrides, migration, save/reset, and native source-resolution calls. Its final section also implements active Stinking Cloud effect timing through private `isStinkingCloudEffect`, exported `prepareStinkingCloudEffect` and `endStinkingCloudTurn`, and a separate ready callback registering `preCreateActiveEffect` and `updateCombat` listeners.

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

- **Runtime changes:** None.
- **New extraction tests/in-game checks:** Not performed for this note.
- **Next step:** Include this targeted move in a separately requested cleanup pass.
