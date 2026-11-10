# IMP-005: Establish the intended scope of Region once-per-turn allowances

[Findings register](README.md) · [Main script guide](../guides/main-automation.md)

- **Status:** Proposed investigation; no reproduced in-game incident.
- **Type:** Identity/coverage question, not a confirmed rules defect.
- **Recorded/source reviewed:** 2026-11-09, `v1.0.1-dev`.
- **Authorization:** Document the question only. Do not change limiter semantics during guide work.

## Evidence

In [ugmuls-5-5e-automation.js](../../scripts/ugmuls-5-5e-automation.js), `getOncePerTurnKey` joins combat ID, round, turn, target token ID, and trigger ID. It does not include spell, Region, caster, or Scene UUID. A single module-level `oncePerTurnHistory` Set uses those keys on the executing client.

In contrast, `getSharedCardKey` in [shared-activity-card.js](../../scripts/shared-activity-card.js) includes spell and Region UUIDs when choosing a shared result card. Independent shared-card grouping therefore does not alone establish independent per-target allowance scope.

If two event contexts processed on the same client have identical key fields, they produce the same allowance identity. That follows from the construction; whether the relevant contexts can occur in supported recipes and should be independent under the feature's rules still needs investigation. Different executor clients have separate in-memory histories, adding another context to check.

## Questions before proposing a change

- Which recipes reuse trigger IDs across owned copies or separate Regions?
- Should each supported spell limit by cast, caster, Region, pack, or spell effect? Verify the actual rule for each rather than choosing a universal UUID addition.
- Do multiple Regions intentionally belong to one casting and need one shared allowance?
- Are token IDs sufficient for the Scenes supported by the combat/event path?
- What behavior is expected after reload, executor disconnect, or active-GM change, given the local history?

## Future verification plan

- [ ] Inspect recipe IDs and build explicit two-instance fixtures around the actual handler, not only key-string comparisons.
- [ ] Cover two casters, two casts by the same caster where supported, multiple Regions of one cast, separate attached packs, entry/turn events, next-turn rollover, and canceled/failed use.
- [ ] Compare initial-card registration, confirmed-target registration, and later Region events: all use this limiter and must agree.
- [ ] In a controlled Foundry scene, record executor client and intended/actual outcomes for independent and intentionally shared instances. No production reproduction is asserted yet.
- [ ] If a semantic change is authorized, preserve native dice, targets, resources, scaling, and sharing; run relevant regressions then the full local suite with checks. Tests/tools remain local and ignored.

## Record

- **Runtime change:** None.
- **New instance-scope/failover tests:** Not run for this proposal.
- **In-game result:** Not run.
- **Next step:** Establish a specific recipe's expected scope before choosing a new key.
