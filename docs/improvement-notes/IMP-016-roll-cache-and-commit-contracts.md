# IMP-016: Map roll cache and correction commit contracts

[Findings register](README.md) · [Post-roll controls guide](../guides/post-roll-controls.md)

- **Status:** Proposed investigation/consolidation opportunity; not implemented.
- **Type:** Shared-helper ownership, cache freshness, and interaction coverage. No new production defect reproduced.
- **Recorded/source reviewed:** 2026-11-10, `v1.0.1-dev`.
- **Authorization:** Document current connections and future work; no runtime refactor in this pass.

## Source observations

[save-roll-controls.js](../../scripts/save-roll-controls.js) serves both attack and save corrections. It combines pure roll conversion, eligibility, message updates, animation tracking, socket routing, and rendering. [damage-roll-controls.js](../../scripts/damage-roll-controls.js) has similar layers with different conversion and animation order. The d20 update animates before commit; critical damage writes before animating extra dice.

The d20 `rsaSaveDicePool` preserves reusable finalized candidates; `rsaDamageModes` preserves serialized complete normal/critical snapshots. These are different cache contracts. [d20-results.js](../../scripts/d20-results.js) already extracts a narrow shared interpretation of native finalized/effective results.

Cutting Words, Combat Inspiration, and Empowered Spell explicitly clear damage-mode snapshots after their changes. Feature-specific d20 rerolls can replace candidate pools. This proves cache maintenance is part of caller behavior; it does not establish that another caller currently leaves a stale cache.

Generic hover settings and socket checks are outside `updateSaveMode`; feature callers have their own settings, resources, Reaction validation, final validators, and rollback. Similar function signatures do not make those workflows interchangeable. Each module's `createEventQueue` instance also serializes only its own consumers.

## Direct connections

- `updateSaveMode`: Lucky, Restore Balance, Steel Deflect, Warding Flare.
- `animateNewSaveDice`: Countercharm, Disciplined Survivor, Fanatical Focus, Indomitable, Seeking Spell, Shared Resilience.
- `changeDamageCritical` / `isAttackDamage`: Warding Flare; its critical-sync helper is reused by Lucky.
- `rsaDamageModes` invalidation: [cutting-words.js](../../scripts/cutting-words.js), [combat-inspiration.js](../../scripts/combat-inspiration.js), [empowered-spell.js](../../scripts/empowered-spell.js).
- Presentation: [card-presentation.js](../../scripts/card-presentation.js), [save-roll-controls.css](../../styles/save-roll-controls.css), grouped/native card rendering.
- Mutation boundaries: shared adjustment locks, HP/effect Undo, reaction governor, optional Dice So Nice coordination. See [IMP-007](IMP-007-reactive-integration-contract.md) and [IMP-008](IMP-008-application-history-boundaries.md).

The linked guide contains the source links for the feature importers. Treat this as a reviewed direct-import map; indirect/global consumers require their own inventory before extraction.

## Questions and future verification

- [ ] Make a caller table stating whether each operation preserves, replaces, extends, or invalidates each cache, and why. Audit all current references before declaring a missing invalidation.
- [ ] Run combinations: mode change → bonus/reduction/reroll → mode change back. Inspect dice/results, flags, flavor, totals, source links, and Undo history.
- [ ] Establish the expected generic attack-mode correction behavior when linked damage already exists. Keep it separate from explicit feature-specific critical downgrade synchronization.
- [ ] Compare commit and animation failures in each path. Determine the intended recovery if an update succeeds but presentation fails, or animation finishes but final eligibility changes.
- [ ] Exercise overlapping generic/feature requests and application/Undo changes during an await. A local queue or final eligibility check is not proof of a global transaction.
- [ ] If clearer boundaries are useful, first consider documenting/renaming the attack-and-save responsibility, then separating conversion from presentation/animation without changing module evaluation order or caller APIs unnecessarily.
- [ ] Preserve native critical policies, finalized minimum/reroll interpretation, original bonus dice, exact cached results, feature locks, permissions, resource refunds, and private animation context.
- [ ] For approved runtime changes, add interaction/failure regressions for established gaps, run relevant tests then the full runner with checks, and perform recorded multiplayer/Undo scenarios in Foundry. Significant performance claims need comparable large-battle captures.

## Record

- **Existing checks:** 16 selected local files passed during guide creation, covering representative conversion, feature, locking, cache, and animation cases. This is not proof of every interaction above.
- **Runtime changes/new interaction tests:** None.
- **In-game reproduction:** None in this pass.
- **Next step:** Audit one cache-changing interaction end to end before proposing a common invalidation API or reorganizing scripts.
