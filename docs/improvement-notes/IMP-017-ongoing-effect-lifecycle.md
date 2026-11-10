# IMP-017: Establish ongoing-effect identity and recovery contracts

[Findings register](README.md) · [Ongoing effects guide](../guides/ongoing-effects.md)

- **Status:** Proposed investigation; not implemented.
- **Type:** Lifecycle identity, failure recovery, and reconciliation coverage. No production defect reproduced in this pass.
- **Recorded/source reviewed:** 2026-11-10, `v1.0.1-dev`.
- **Authorization:** Document findings only; no changes to ongoing effects, cleanup, or timing.

## Source observations

[recurring-effects.js](../../scripts/recurring-effects.js) links follow-up cards to an effect application `instance`, recorded caster/source, and event stamp. Turn receipts, one-shot links, manual groups, local running/opened guards, and bounded damage-event receipts have distinct lifetimes. Errors clear some turn receipts; those guards are not one durable transaction spanning publication, prompts, results, and effect deletion.

[concentration-cleanup.js](../../scripts/concentration-cleanup.js) instead matches Regions by the concentration effect's stored source Item UUID across scenes. [region-conditions.js](../../scripts/region-conditions.js) owns copies by Region UUID and reconciles Actor-based membership. [inactive-effect-cleanup.js](../../scripts/inactive-effect-cleanup.js) uses source/type/temporary heuristics to protect feature grants and rechecks inactive document identity before deletion.

These identities serve different jobs. Their difference alone does not establish incorrect deletion, duplication, or stale effects. The current relevant fixture selection also does not establish direct coverage of every concentration-cleanup/Region-condition hook.

## Connections to preserve

- Native effect application → Trigger Library recipe → registration/source recovery → application record → turn/damage event → native helper card → save/damage/healing continuation.
- Prompt-only/manual group pause is distinct from condition deletion; successful results remove effects only where the recipe authorizes it.
- Region conditions remove only their source-flagged copies; native managed Region behaviors preserve native operations with GM authority.
- Native concentration end → matching Region deletion → specialized exit/dependent cleanup. Targeting-only area removal does not redefine creature-effect duration.
- Inactive cleanup runs after native combat cleanup and preserves persistent grants; it is not application Undo.
- Related recovery/history investigations: [IMP-003](IMP-003-pending-failure-recovery.md), [IMP-008](IMP-008-application-history-boundaries.md), [IMP-010](IMP-010-region-configuration-lifecycle.md), and [IMP-014](IMP-014-save-request-lifecycle.md).

## Questions and future verification

- [ ] Establish repeated/rewound turn, reconnect, and GM-takeover behavior before promising exactly-once triggers. Distinguish stored receipts from client-local guards.
- [ ] Reapply/refresh an effect during an open follow-up; verify instance checks through save result, damage publication, grouped deletion, and concentration escape.
- [ ] Inject failure after card publication but before its progress marker, and after one member of a related group is deleted. Inspect actual retry state before proposing automatic recovery.
- [ ] Test positive damage reports from multiple authorized clients, repeated event IDs, distinct event IDs for one hit, and Undo exclusion. Determine native emission behavior before changing deduplication.
- [ ] Establish intended concentration cleanup scope for multiple Regions/scenes and repeated uses of the same owned Item. Do not replace Item matching with an instance scheme without mapping native dependents and source flags.
- [ ] Add direct Region-condition cases for overlapping/manual copies, same-Actor multiple tokens, synthetic Actors, behavior removal/deactivation, missing caster, and reconciliation failure.
- [ ] Review inactive-cleanup provenance heuristics against actual imported class grants and temporary feature buffs before broadening deletion eligibility.
- [ ] If boundaries are extracted, separate narrow lifecycle responsibilities while preserving specialized preparation, recipe rules, native durations, resources, permissions, and event ordering. Do not merge all expiry/cleanup handlers merely because they delete effects.
- [ ] For approved runtime changes, add regressions for established gaps, run relevant local tests then the full runner with checks, and record multiplayer/Region/Undo outcomes in Foundry. Measure comparable scenarios before claiming performance improvements.

## Record

### Region conditions follow-up, 2026-11-10

The [placement/conditions guide](../guides/region-placement-and-conditions.md) expands the source map for condition synchronization and native effect authority. Ten selected local Region/placement files passed, without new direct condition-event tests or in-game checks.

Additional cases to establish before implementation: multiple linked tokens sharing one Actor, separate unlinked Actors, overlapping Regions/manual statuses, existing disabled source-owned copies, more than one condition behavior on a Region, changed condition lists, and partial reconciliation failure. Ownership currently uses Region UUID plus condition ID, not individual behavior UUID. Document the intended behavior before changing that identity or adding a token index.

### Concentration lifecycle follow-up, 2026-11-10

The [concentration guide](../guides/concentration-lifecycle.md) adds source review of the requested-check state machine, pending-cast replacement, summon backlinks, Wild Shape transfer, HUD ending, and the installed native D&D5e 6.0.6 implementation. Nine selected concentration/feature/pending-cast test files passed in two sequential runs; this was a documentation pass with no new runtime/fault tests or in-game checks.

Additional observations/questions for the same lifecycle investigation:

- `resolveConcentration` marks the request resolved before calling native ending for captured roots. Establish recovery after a later end/dependent deletion failure; do not equate the label with complete cleanup.
- Check snapshots use Actor UUID/effect IDs, while Wild Shape transfer remaps root/dependent provenance. Establish what an open check should do during linked/unlinked reversion; explicit pending-chat migration is not part of the reviewed transfer function.
- Region concentration ending uses a fire-and-forget owner-to-GM request; Wild Shape has a request/reply wait with timeout. Establish acknowledgment-loss/partial-completion behavior separately rather than inferring one protocol from the other.
- Direct concentration-HUD/Region-cleanup regression coverage remains a question. The selected passing suites do not establish those hooks or native multiplayer deletion order.

- **Existing checks:** 15 selected recurring/Region/cleanup/concentration test files passed during guide creation. The investigations above remain unperformed.
- **Runtime changes/new lifecycle fault tests:** None.
- **In-game reproduction:** None in this pass.
- **Next step:** Select one lifecycle boundary and reproduce its current multi-instance/failure behavior before designing cleanup or recovery changes.
