# IMP-007: Map the governor's feature integration contract

[Findings register](README.md) · [Reaction/timing guide](../guides/reactions-and-automation-timing.md)

- **Status:** Proposed investigation; not implemented.
- **Type:** Cross-feature consistency/coverage opportunity, not a reproduced defect.
- **Recorded/source reviewed:** 2026-11-09, `v1.0.1-dev`.
- **Authorization:** Record findings only; no governor/feature refactor authorized.

## Evidence and connections

[reactive-automation.js](../../scripts/reactive-automation.js) integrates supported features in several places: imports/optional globals, `availableReactions`, readiness and snapshot capture, `completedChange` flags/transitions, and `isReactiveControl` selectors. Features can also call `completed` explicitly. [npc-damage-automation.js](../../scripts/npc-damage-automation.js) uses the governor for HP/effect gating, resume scheduling, and manual-interaction distinctions.

These pieces form a contract but are not represented by one uniform adapter interface. They should not necessarily be merged: features have distinct completion boundaries, authority, and timing. A maintained connection matrix could expose omissions before any generalization is attempted.

This is different from IMP-006's presentation-refresh rule matrix. Here the concern is whether application may proceed and what constitutes commitment, not which cards should redraw.

## Suggested matrix and review boundaries

For each supported adjustment, record its source/HP stage, candidate helper, readiness gate, snapshot capture point, cost/authority workflow, successful completion signal, canceled/failed outcome, selector exemption, root identity, and regression/in-game scenarios.

Distinguish genuinely optional adjustments, mandatory interception/readiness, and post-damage follow-ups. Fount is a useful example of an intentionally non-blocking follow-up; absence from the governor is not automatically a missing integration. Shield demonstrates why an early display recheck is not the same as applied-effect settlement.

Do not replace distinct spending/refund workflows with one generic success case, add broad movement/resource-driven restarts, or introduce timer-based reaction waiting as part of this review.

## Future verification plan

- [ ] Inventory existing adapters, explicit completion callers, and selectors before reporting a missing connection.
- [ ] Cross-check real feature eligibility and pending/settled flags against governor mocks. Preserve exact origin/attack links and live lock checks.
- [ ] Cover successful commit, cancellation, failed adjustment/rollback, stop-write race, concurrent completion, another remaining option, and manual Apply/Undo where affected.
- [ ] Review simultaneous Reaction reservations on different clients separately from a local `creating` guard. No universal server-wide lock is claimed by current documentation.
- [ ] Include Reaction resets, companions, explicit own-turn Reactions, and automatic Region/rider exemptions in shared regression checks.
- [ ] If implementation is authorized, run targeted tests first and the full local runner with checks after shared changes. Tests/tools are local and ignored.
- [ ] In Foundry, run Shield, Bardic Inspiration, Parry/Deflect, grouped saves, pending adjustment cancellation, manual Apply/Undo, and a deliberately non-blocking follow-up under relevant settings. Record clients, resources, dice, and results.

## Record

- **Runtime changes:** None.
- **New adapter-matrix or multi-client race checks:** Not run for this proposal.
- **In-game findings:** Not run.
- **Next step:** Build the matrix for a few representative features before deciding whether documentation, targeted tests, or a code change is needed.
