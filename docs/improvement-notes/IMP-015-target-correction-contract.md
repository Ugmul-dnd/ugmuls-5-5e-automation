# IMP-015: Establish target correction and application-history boundaries

[Findings register](README.md) · [Target selection guide](../guides/target-selection-and-correction.md)

- **Status:** Proposed investigation; not implemented.
- **Type:** Correction semantics and coverage question; no production defect reproduced.
- **Recorded/source reviewed:** 2026-11-10, `v1.0.1-dev`.
- **Authorization:** Documentation/findings only. No runtime correction or locking changes authorized by this pass.

## Source observations

[retarget-card.js](../../scripts/retarget-card.js) replaces recipients on supported cards and linked rolls while preserving original dice, save outcomes, resources, and application records. It resets local target-tray checks and marks updates `rsaRetarget`. [spell-save-prompts.js](../../scripts/spell-save-prompts.js) treats that option as an explicit correction and stops its scheduled automatic save timer.

The generic Retarget handler does not consult `isRollAdjustmentLocked`. Linked updates are sequential, non-GMs skip linked cards they do not own, and the in-flight `WeakSet` is local to a message object/client. These facts describe current boundaries; they do not establish that an applied-history or concurrency bug occurs.

[shared-activity-card.js](../../scripts/shared-activity-card.js) has a different operation, `appendSharedTarget`, which preserves earlier explicit tray choices while synchronizing the complete recorded list to linked damage. It uses native associations and the shared exact-origin index. Generic attack Retarget also retains a timestamp fallback for damage without `damageAttackId`.

## Connections to review

- Render button → `retargetSpellCard` → associated-card selection → recipient writes → `rsaRetarget` save-scheduler behavior and native presentation.
- Feature delegation: Instinctive Charm and Land's Aid; Cavalcade deliberately uses its allocation editor.
- Actor-owner Destructive Stride selection → `receiveStrideRetarget` active-GM validation → linked updates.
- Shared recipient append → linked HP-card index → targeted refresh, compared with replacement semantics.
- HP/effect application and Undo history: [IMP-008](IMP-008-application-history-boundaries.md). Pending cancellation/recovery: [IMP-003](IMP-003-pending-failure-recovery.md). Save retries: [IMP-014](IMP-014-save-request-lifecycle.md).

## Questions and verification plan

- [ ] Decide expected correction behavior before/after HP or effects are applied. A correction must not silently transfer old mutations, discard history, or authorize double application.
- [ ] Establish current results when retargeting away and back after saves, application, and Undo. Inspect card recipients, original outcomes, tray checks, and recorded histories separately.
- [ ] Exercise a pending damage session and an open save dialog during correction; establish whether any stale completion needs additional validation.
- [ ] Inject failure during the second linked-card update; inspect partial completion, repeat-click behavior, and appropriate user recovery before choosing a transaction/retry design.
- [ ] Test two clients, mixed message ownership, and overlapping usage/attack corrections. Do not assume the local guard serializes every linked card.
- [ ] Verify timestamp fallback with multiple attacks, missing timestamps, explicit links, and retired Graze cards. Review indexed lookup reuse only if it preserves the selected attack's scope.
- [ ] Keep append and replace separate until their different history, check-state, and save-prompt contracts are explicit.
- [ ] For an approved runtime change, run relevant correction/shared-target/pending/save/Undo tests, add behavioral regressions for established gaps, then run the full local runner with checks and verify the same scenarios in Foundry.

## Record

- **Existing checks:** Nine selected targeting/confirmation/preview/Retarget/shared-target/Metamagic test files passed during the guide pass. That is not coverage of the unperformed investigations above.
- **Runtime changes/new failure tests:** None.
- **In-game reproduction:** None in this pass.
- **Next step:** Establish the desired and actual applied-card correction behavior before proposing locks, rollback, or a shared adapter.
