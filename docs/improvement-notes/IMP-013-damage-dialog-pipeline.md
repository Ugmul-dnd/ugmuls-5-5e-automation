# IMP-013: Map damage-dialog preview, submission, and cleanup contracts

[Findings register](README.md) · [Prompting guide](../guides/save-and-damage-prompting.md)

- **Status:** Proposed investigation; no runtime change.
- **Type:** Shared integration/organization and coverage opportunity, not a reproduced defect.
- **Recorded/source reviewed:** 2026-11-10, `v1.0.1-dev`.
- **Authorization:** Record findings only. Do not extract or reorder feature callbacks during documentation.

## Observation

[damage-prompts.js](../../scripts/damage-prompts.js), especially `configurePromptDialog`, combines positioning/base-class wrapping with ordered feature calls for preview formulas, final submission, render controls, button preparation, and close-time commit/release. Several feature integrations appear in multiple phases with different arguments and ordering.

The native base-class cache, `_rsaPreview`, pending-damage checks, and per-feature callbacks preserve important behavior. Repetition alone is not evidence that phase lists can be replaced with one generic loop; some differences are intentional. Current tests exercise representative cases rather than a complete proof of every adapter's lifecycle.

## Proposed review and boundaries

Build a feature-to-phase/order matrix with each callback's preview side effects, roll replacement/augmentation behavior, resource reservation, successful commit, cancellation release, error cleanup, and native class dependency. Compare it with the reaction-governor and refresh contracts without merging their different responsibilities.

Determine whether clearer internal sections or a small ordered registry improves maintainability before selecting a refactor. Preserve class identity, native modes/critical policy, recorded attack/targets/speaker, original dice, typed riders, pending session checks, and explicit cancellation behavior. Do not generalize AC5E compatibility repair into forced roll decisions.

## Future verification plan

- [ ] Inventory every preview/submission/render/close adapter and justify differences before changing order.
- [ ] Exercise repeated getter/rebuild/render reads, multi-rider combinations, cancellation, blocked spending, and exceptions during cleanup with work counts and original-dice assertions.
- [ ] Preserve distinct extension classes per native/per-roll base; verify `configure:false`, position writes, and pending preparation/submission gates.
- [ ] Cross-check relevant resource/feature tests, not only generic configuration success. Run targeted checks then the full runner with checks for any approved shared/harness change. Local tests/tools remain ignored.
- [ ] In Foundry, verify native attacks/saves/heals, critical/no-critical cases, mixed riders, canceled configuration/refunds, stale pending dialogs, and different owner clients. Record actual results.

## Record

- **Implementation/new matrix tests:** None.
- **In-game reproduction:** None established.
- **Next step:** Map a few representative feature lifecycles before deciding whether structure or coverage needs changing.
