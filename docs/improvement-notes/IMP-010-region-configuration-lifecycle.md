# IMP-010: Clarify Region configuration edits, overrides, and live reconciliation

[Findings register](README.md) · [Region library guide](../guides/region-library.md)

- **Status:** Proposed investigation; no runtime change.
- **Type:** Configuration lifecycle and coverage opportunity, not a reproduced production defect.
- **Recorded/source reviewed:** 2026-11-10, `v1.0.1-dev`.
- **Authorization:** Record documentation-review findings only; no storage migration or live-update rewrite authorized.

## Source observations

[region-library.js](../../scripts/region-library.js) composes frozen defaults with persisted patches/custom entries. Arrays are replaced as values: editing one trigger can pin a full trigger array against future default updates. Omitting a nested object property is not a general deletion patch. Name keys determine whether entries are built-ins or custom.

Saving updates settings and invalidates cached configuration, but does not itself enumerate existing Regions. The [main engine](../../scripts/ugmuls-5-5e-automation.js) reads current recipe values during event execution, while installed RegionBehavior event subscriptions/effect references remain document state. Creation and canvas-ready attachment perform only partial reconciliation; duplicate-name/type checks can preserve existing behaviors and obsolete ones are not universally removed.

The save API snapshots a complete draft before entering a local Promise queue. That serializes writes on that client, without detecting stale drafts or concurrent GM changes. These are current contracts to establish, not proof that every user edit is lost or every old Region is wrong.

## Questions to resolve before design

- Which edits are intended to affect existing Regions immediately, on the next event, on Scene revisit, or only on a new cast?
- How should trigger-ID changes, removal, event-list changes, disabled entries, native effects, and specialized auras/conditions reconcile?
- Is whole-array override behavior appropriate, and how should users understand inherited versus pinned fields? Would merge-by-ID be worth the migration/identity complexity?
- What are the supported property-removal semantics and custom/built-in name collision rules?
- Is stale-draft detection needed for multiple editors/GMs? A local serialization queue is not an edit lease.
- Could a clear editor explanation and documented apply/rebuild action be safer than automatic global reconciliation?

## Connections and preservation requirements

Review `composeRegionTable`, `regionDifference`, migration/save/reset, [spell-manager.js](../../scripts/spell-manager.js), native Activity/effect resolvers, initial shared-card registration, persisted behavior trigger IDs, managed effect source identity, and specialized consumers such as Stinking Cloud.

Preserve world customizations/backup, native scaling and Activity identity, active-GM authority, per-target allowance semantics, source/Region effect ownership, and existing HP/effect Undo. Do not implement live rebuild by deleting unrelated behavior/effect data or silently discarding saved custom recipes.

## Future verification plan

- [ ] Establish the documented edit contract before choosing a storage or reconciliation change.
- [ ] Add representative scalar/array/property-removal and old-default-to-new-default fixtures where coverage is missing.
- [ ] Exercise recipe edits against current/other-Scene Regions and distinguish dynamic event validation from installed event subscriptions.
- [ ] Simulate stale editor snapshots and concurrent save/migration failures; record exact settings/behavior state rather than assuming atomic writes.
- [ ] Run relevant library, manager, Region/card policy, scaling, sharing, and expiry regressions first; run the full local suite with checks for approved shared changes. Tests/tools remain local and ignored.
- [ ] In Foundry, check fresh/migrated worlds, reset/custom removal, already-attached behaviors, new casts, player-created Regions, effect/condition cleanup, and the chosen edit-application policy. Record actual results.

## Record

### Placement and attachment follow-up, 2026-11-10

The [placement/conditions guide](../guides/region-placement-and-conditions.md) maps the casting layer wrapper, wheel/callback controls, self-emanation geometry, live target preview, placement-only flags, and native D&D5e 6.0.6 creation/attachment. Ten selected local Region/placement test files passed; no runtime or new direct callback tests were added.

- Establish composition/installation order across template placement, layer placement, preview callbacks, and self-emanation bypass before extracting wrappers.
- Add direct cone/wheel cases for original callback vetoes, board-only capture, zoom/rotation modifiers, cancel/failure restoration, disabled setting, and non-casting placement. Existing emanation/preview fixtures do not establish all of these.
- Preserve native `target.stationary`: token-origin geometry can intentionally remain at departure rather than follow the token.
- Compare `regionEffectDispositions` with initial `allowsAutomaticTarget` policy before merging them. Current ongoing `hostilesOnly`/`excludeFriendlies` compares different dispositions and can include neutrals; `[]` and `null` have different meanings. This is a documented policy difference, not a newly reproduced defect.

See [IMP-017](IMP-017-ongoing-effect-lifecycle.md) for source-owned condition copies, Actor-based membership, and direct reconciliation coverage questions.

- **Implementation:** None.
- **New reconciliation/conflict scenarios:** Not run for this proposal.
- **In-game finding:** No incident established.
- **Next step:** Select one edit type and trace its intended versus actual lifecycle before proposing a fix.
