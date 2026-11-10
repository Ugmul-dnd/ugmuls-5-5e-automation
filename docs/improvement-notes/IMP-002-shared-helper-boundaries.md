# IMP-002: Review the responsibilities inside shared-activity-card.js

[Findings register](README.md) · [Shared activity card guide](../guides/shared-activity-card.md)

## Summary and evidence

- **Status:** Proposed; not implemented.
- **Type:** Organization and discoverability opportunity, not a confirmed defect.
- **Recorded/source reviewed:** 2026-11-09, `v1.0.1-dev` working tree.
- **Authorization:** Recording findings during documentation is authorized. Runtime extraction is not part of this task.

[shared-activity-card.js](../../scripts/shared-activity-card.js) contains several distinct families of helpers. Some callers need card relationships, while others import it for an event queue, actor discovery, effect matching, or Region targeting. A later review could make those boundaries clearer while preserving the existing shared workflows.

## Connections to map before proposing an extraction

| Current family | Functions | Representative connections |
| --- | --- | --- |
| Card relationships and locks | `linkedHpCards`, `invalidateLinkedHpIndex`, `isRollAdjustmentLocked` | Shield and Bardic Inspiration eligibility; message-update hooks; HP/effect Undo state. |
| Card classification and recipients | `isDamageOrHealingCard`, `isHealingCard`, `isEligibleTarget`, `isEligibleHealingTarget`, `describeTarget`, `mergeTargets` | Fount, damage/Undo workflows, Region recipients. Different target policies must stay distinct. |
| Shared-card grouping/sync | `getSharedCardKey`, `appendSharedTarget`, `refreshSharedTargets` | Main Region handler, Conjure Animals sharing, pending damage, native tray state. |
| Effect and Region helpers | `equivalentEffect`, `hasEquivalentActiveEffect`, `regionOwnsEffect`, `regionEffectDispositions`, `resolveRegionCaster` | Effect automation and Region conditions. Source identity, dispositions, and ambiguity handling matter. |
| Startup discovery | `startupActors` | Startup consumers share an ephemeral actor list; synthetic actors and microtask expiry must be preserved. |
| Task ordering | `createEventQueue` | Many independent feature queues, including Fount and damage Undo. It is not a cross-client lock or the chat-refresh scheduler. |

These are responsibility groups and examples, not a complete import audit. No new filenames or final split are selected yet. Keeping the file together may remain preferable if extraction adds more complexity than clarity.

## Boundaries and questions

- Would clearer section comments and API documentation provide enough benefit without moving exports?
- If extraction is worthwhile, which modules can remain pure and which need hook registration?
- How would the HP index remain one shared instance with reliable create/update/delete invalidation?
- Would re-exports preserve current callers and local test loaders during a staged move?
- Could moving functions introduce circular dependencies, change module evaluation order, or accidentally duplicate startup hooks?
- Which helpers are similar only in appearance? Preserve the difference between healing and living-target eligibility, and between relationship caches and live lock checks.

Do not combine this organization task with changes to roll linkage, the timestamp fallback, effect equivalence, target pruning, range policies, or permissions. Investigate behavioral issues separately if evidence appears.

## Future verification plan

No runtime change has been made or tested as a refactor.

- [ ] Inventory all importers and any indirect/global entry points before choosing a split.
- [ ] Read the relevant local fixtures, then run targeted checks for locks, target sync, startup discovery, Region sharing, Shield, Bardic Inspiration, and Undo.
- [ ] Check queue failure propagation and continued processing after rejection; add meaningful coverage if the existing fixtures do not establish it.
- [ ] Preserve index work counts and invalidation, live lock decisions, immutable list/native Actor identity, original dice, pending sessions, target checks, and effect source distinctions.
- [ ] Run the full local suite with `node tools/run-tests.mjs --checks` for any shared runtime change.
- [ ] In Foundry, check per-attack locking, partial/complete Undo, effect-only saves, independent rider saves, shared-card recipient additions, and GM/player operation. Use the scenarios in the linked guide and record actual results.

Tests/tools remain Git-ignored; the plan is not a claim that a fresh checkout contains them. Actual implementation approval, commit, commands/results, and in-game observations should be recorded here when that work is undertaken.
