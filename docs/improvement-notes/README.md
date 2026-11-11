# Improvement notes and ideas

This folder records findings and possible improvements discovered while reviewing and documenting the module. It connects shared tools to the features that depend on them, so later changes have a useful test plan.

An entry is a record for review, not authorization to change runtime code. Keep documentation work separate from implementation unless the user requests both. Existing reports elsewhere in `docs/` remain in place and are not assumed current.

Read [Priorities and expected effects](priorities.md) for the proposed investigation ranking, first implementation packages, relative effort/risk, and likely gameplay versus maintenance benefits. Priorities do not change a finding's evidence or implementation status.

## Findings register

| ID | Finding or idea | Status | Evidence | Next step |
| --- | --- | --- | --- | --- |
| IMP-001 | [Extract the shared distance helper from Dark One's Blessing](IMP-001-shared-distance.md) | Implemented; six features user-confirmed | Twenty consumers migrated; full automated checks passed; six-feature game shortlist reported working, 2026-11-10 | Remaining consumers and cross-cutting checks are in the [distance verification checklist](IMP-001-distance-verification.md). |
| IMP-002 | [Review shared-helper responsibilities](IMP-002-shared-helper-boundaries.md) | Startup discovery extracted; other moves deferred | Six consumers migrated; full automated checks passed, 2026-11-10 | Focused startup checks are in the [review/caller sheet](IMP-002-helper-review-and-startup-checks.md); no broad shared-card split. |
| IMP-003 | [Investigate pending-workflow failure recovery](IMP-003-pending-failure-recovery.md) | Proposed investigation; no reproduced incident | Pending cast/damage source order and local fixture review, 2026-11-09 | Select partial-failure and reply-loss scenarios, establish current behavior, then decide whether changes are warranted. |
| IMP-004 | [Review main-script boundaries and diagnostics](IMP-004-main-script-boundaries.md) | Diagnostics implemented; structural review deferred | Outdated main/manager labels removed; Ready reads installed module version, 2026-11-10 | Check startup console; any future engine extraction remains a separate task. |
| IMP-005 | [Establish Region allowance scope](IMP-005-region-allowance-scope.md) | Proposed investigation; no reproduced incident | Once-per-turn key compared with shared-card identity, 2026-11-09 | Establish per-recipe rules and reproduce multiple-instance cases before changing limiter identity. |
| IMP-006 | [Audit refresh contracts and scheduling coverage](IMP-006-refresh-contract-coverage.md) | Proposed investigation; not implemented | Index/refresh source and local regression review, 2026-11-09 | Map rules/callers to tests and establish any specific scheduling or diagnostic gap before changing the shared path. |
| IMP-007 | [Map the reactive integration contract](IMP-007-reactive-integration-contract.md) | Proposed investigation; not implemented | Tracker/governor and application/resource connections reviewed, 2026-11-09 | Map eligibility, readiness, commitment, cancellation, and UI exemptions before considering a common adapter. |
| IMP-008 | [Audit application/history boundaries](IMP-008-application-history-boundaries.md) | Proposed investigation; no reproduced incident | HP/effect mutation, history, and reapplication source review, 2026-11-09 | Establish partial-write/retry behavior before changing durability or restoration contracts. |
| IMP-009 | [Review Shield linked refresh and AC correction](IMP-009-shield-linked-refresh.md) | Proposed investigation; not implemented | Shield source and shared lookup/settlement connections reviewed, 2026-11-09 | Establish indexed lookup coverage, duplicate signals, and effect-Undo correction expectations before changing the path. |
| IMP-010 | [Clarify Region configuration lifecycle](IMP-010-region-configuration-lifecycle.md) | Proposed investigation; not implemented | Recipe storage, resolver, editor and attachment boundaries reviewed, 2026-11-10 | Establish edit/inheritance/reconciliation expectations before changing arrays, live behaviors, or conflict handling. |
| IMP-011 | [Separate Stinking Cloud from the Region library](IMP-011-stinking-cloud-module.md) | Implemented; core gameplay user-confirmed | Automated checks passed; GM/client casting, start-turn check, no cast application, expiry and concentration cleanup confirmed, 2026-11-10 | Retain detailed regression scenarios for future changes; recipe/settings stay in the library. |
| IMP-012 | [Establish movement policy and coverage](IMP-012-movement-policy-and-coverage.md) | Proposed investigation; not implemented | Counter/placement source, recipe usage, and local fixture search reviewed, 2026-11-10 | Establish chain-counting and reservation scenarios before generalizing beyond the built-in Spike Growth use. |
| IMP-013 | [Map damage-dialog integration phases](IMP-013-damage-dialog-pipeline.md) | Proposed investigation; not implemented | Prompt wrapper and representative local fixtures reviewed, 2026-11-10 | Document adapter phase/order, preview side effects, and cleanup before considering a shared registry. |
| IMP-014 | [Establish save request lifecycle guarantees](IMP-014-save-request-lifecycle.md) | Proposed investigation; no reproduced incident | Save scheduling/dispatch/receiver guards compared with escape sessions, 2026-11-10 | Reproduce failed-dispatch or in-flight takeover behavior before changing identity/retry/cleanup. |
| IMP-015 | [Establish target correction/history boundaries](IMP-015-target-correction-contract.md) | Proposed investigation; no reproduced incident | Retarget, shared append, save-scheduler, and permission boundaries reviewed, 2026-11-10 | Establish applied-card, pending-dialog, and partial-update behavior before proposing correction/locking changes. |
| IMP-016 | [Map roll cache and commit contracts](IMP-016-roll-cache-and-commit-contracts.md) | Proposed investigation; no reproduced incident | Post-roll conversion, feature importers, cache invalidation, and animation/lock boundaries reviewed, 2026-11-10 | Audit cache-changing interactions and failure order before proposing shared APIs or file extraction. |
| IMP-017 | [Establish ongoing-effect lifecycle contracts](IMP-017-ongoing-effect-lifecycle.md) | Proposed investigation; no reproduced incident | Recurring instance/receipt, Region ownership, concentration matching, and inactive cleanup reviewed, 2026-11-10 | Establish multi-instance/failure and direct reconciliation coverage before changing cleanup or recovery. |
| IMP-018 | [Map presentation and animation contracts](IMP-018-presentation-animation-contracts.md) | Proposed investigation; no reproduced incident | Card handoff, local state, scrolling, animation preferences/waits, and acknowledgments reviewed, 2026-11-10 | Establish retention/scroll/client-timeout behavior before extracting helpers or changing completion policy. |
| IMP-019 | [Unified action cards backed by native messages](IMP-019-unified-action-cards.md) | Deferred concept; not scheduled | User discussion and native/module feasibility review, 2026-11-10 | Revisit when requested; select one action scenario, then prove one visible card before retiring its old module presentation. |

## Adding findings during the review

Use a stable ID such as `IMP-002`, a descriptive filename, and the [finding template](finding-template.md). Add a row above. Reference the finding from a guide when it helps explain a current connection.

For each finding, record:

- The behavior or dependency observed, with source links and a review date.
- Whether it is a confirmed defect, a consolidation opportunity, or an unverified idea.
- The shared helper and every known direct caller, plus important downstream connections.
- What must remain unchanged and what still needs investigation.
- Relevant local automated checks and concrete in-game scenarios.
- Implementation and verification status separately, including failures and remaining gaps.

Keep findings grouped by shared concern rather than creating duplicate entries for every affected feature. Expand an existing finding when another caller is discovered. Do not merge helpers merely because their names or short implementations look similar.

## Status and evidence

Suggested statuses are **Proposed**, **Investigating**, **Ready for decision**, **Approved for implementation**, **Implemented; verification incomplete**, **Verified**, and **Deferred**. Record user authorization explicitly before treating a proposal as approved. These labels organize future cleanup; they do not add new approval gates to work the user has already requested.

Source review, automated tests, and in-game observations are different evidence. A passing mocked test does not establish multiplayer behavior or performance. A checked in-game scenario should record the date, who observed it, relevant settings, actor/form, and result. Leave planned checks unchecked until performed.

When implementation happens, record the commit/branch, update the caller map and guides, and retain the original reason for the change. A documented proposal is not a release-note claim that an improvement shipped.

## Related documentation

- [Learning guides](../guides/README.md)
- [Module map](../guides/module-map.md)
- [Repository working rules](../../AGENTS.md)

These notes belong in GitHub alongside the guides. They are documentation and are excluded from the current runtime release ZIP.
