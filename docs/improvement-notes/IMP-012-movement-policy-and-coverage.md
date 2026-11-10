# IMP-012: Establish movement-counter policy, coverage, and reuse boundaries

[Findings register](README.md) · [Movement damage guide](../guides/movement-damage.md)

- **Status:** Proposed investigation; not implemented.
- **Type:** Rule/measurement contract and regression-coverage opportunity.
- **Recorded/source reviewed:** 2026-11-10, `v1.0.1-dev`.
- **Authorization:** Document/review only. No new movement behavior, source refactor, or supported spell is authorized by this note.

## Observations

[movement-damage.js](../../scripts/movement-damage.js) is configurable through Region recipes and the manager, but Spike Growth is the only reviewed built-in default enabling its increment counter. Custom saved world usage was not inspected. Conjure Animals pack movement uses a different save/trigger workflow.

The measurement helper delegates to native Region/path APIs. Counting adds policy: entry can seed a step, chain fragments accumulate before upward rounding, an outward step is exempt, already-counted steps do not decrease, and top-level distance is quantized counted units. Increment values are in scene units without automatic default feet-to-meter conversion. Out-of-combat grouping lacks a combat-turn rollover.

Player reserve/finish and GM direct-roll paths persist counted reservations before rolling. Exceptions preserve reservations because a result may already exist. HP Undo of the native result is not a movement-counter refund. These boundaries should be tested and explained before reusing the infrastructure for another feature.

A search of current local tests/tools found the placement fixture's measured-roll parameter check but no direct fixture calls of `measureInsideMovement`, `repeatDamageFormula`, or `processMovementRollRequest`. Search/inspect the complete applicable tests before declaring an exact coverage gap; the current passing related fixtures do not establish full chain/geometry/socket behavior.

## Proposed review

Separate three contracts: native path measurement, feature-specific increment counting, and reservation/result publication. Do not assume a generic distance-helper extraction can combine these with straight-line spell range checks such as IMP-001.

Consider documenting or isolating the counting policy only after establishing required semantics for each proposed use. A dedicated pure measurement/counting test surface may be useful, but preserve source/event identity, native units/scaling, actor authority, and no-duplicate-roll behavior.

## Verification plan

- [ ] Establish current and intended entry/partial/exit rounding with fixtures for full drags, native split chains, repeated signatures, diagonal paths, elevation, and teleport mixtures.
- [ ] Exercise native measurement return validation, terrain-distance versus cost, and explicit metric increments; decide whether conversion/rounding differences need a separate behavior change.
- [ ] Test simple and compound repeated formulas, positive safe-integer validation, native part types/scaling, and one-time configuration transformation.
- [ ] Test recorded-caster permissions, repeated reservation request ID, wrong-owner finish, empty-result refund, successful/exception reservations, timeout/reply loss, concurrent queued operations, and GM local path.
- [ ] Establish stale-reservation recovery after disconnect/reload without exposing a successful result to a duplicate roll. Reuse pending/history recovery findings where applicable rather than assuming automatic rollback is safe.
- [ ] Cover distinct target/Region/cast/turn keys, out-of-combat lifetime, manual count changes, and independent result HP Undo.
- [ ] For any approved shared runtime/harness change, run targeted tests first then the full suite with checks. Tests/tools remain local and Git-ignored.
- [ ] In Foundry, reproduce the scenarios in the linked guide with exact movement actions, grid settings, caster/GM clients, counter values, result dice, and applied HP. Do this before claiming another feature is supported.

## Record

- **Runtime changes:** None.
- **New measurement/reservation fixtures:** Not added or run for this proposal.
- **Current-world use/in-game reproduction:** Not inspected/performed.
- **Next step:** Establish representative native movement-chain inputs and counting expectations before choosing a refactor or new use.
