# Improvement priorities and expected effects

[Findings register](README.md) · [Learning guides](../guides/README.md)

**Planning review:** 2026-11-10, `v1.0.1-dev`. Reviewed all 18 current findings. This is a proposed order of work, not authorization to implement the findings. Their original evidence/status remains unchanged.

The notes contain organizational opportunities and unverified failure/policy questions. They are not a list of 18 confirmed bugs. Existing guide-pass checks support selected current behavior; they do not establish that the proposed investigations or future refactors are complete.

## Recommendation

Use two related priorities:

- **Investigate game-state reliability first:** HP/Undo history, pending recovery, corrections, multi-instance effects, and Region allowances. Establish behavior before deciding which fixes are necessary.
- **Bounded cleanup progress:** the distance helper extraction and Stinking Cloud move are implemented as of 2026-11-10. Stinking Cloud's core gameplay and six distance-helper caller features are user-confirmed; remaining consumers/variations are in the [20-consumer checklist](IMP-001-distance-verification.md). Both aim to preserve gameplay while clarifying ownership.

A reproduced game-state defect takes precedence over those cleanups. Neither cleanup is a prerequisite for investigating the higher-consequence questions.

Do not start by splitting every large file or building a universal adapter. The new guides already improve navigation. Further structural work should solve a demonstrated maintenance problem and preserve the distinct timing/targeting contracts we documented.

## How to read the ranking

**P1 — establish correctness:** investigate before changing the affected workflow. High potential consequence does not mean high probability or a confirmed defect.

**P2 — targeted reliability, performance, and configuration:** improve a measured/established path once its contract is known.

**P3 — maintainability or optional architecture:** useful cleanup, but no demonstrated user-facing failure requires it. A small P3 change can be the best first implementation while P1 questions remain investigations.

Effort is relative to the **first bounded step in the table**, not the entire finding: **Small** = one narrow move/audit; **Medium** = several callers or meaningful interaction fixtures; **Large** = multiple mutation stages/clients or state recovery. These are planning judgments, not elapsed-time commitments. In-game checks add separate time and depend on the available clients/setup.

Change risk refers to the affected runtime scope if implemented, not the danger of reading code or adding a test. A low-risk investigation can uncover a high-risk repair.

## Ranked findings

| Priority / finding | First bounded step | Expected effect if action is warranted | Effort / change risk |
| --- | --- | --- | --- |
| **P1 · [008: Application and Undo history](IMP-008-application-history-boundaries.md)** | Inject one history-write failure after successful HP/effect mutation; inspect retry/Undo state. | Could prevent repeated damage, missing restoration records, or unsafe retries after a partial failure. Highest consequence if confirmed. | Medium investigation; high repair risk. |
| **P1 · [003: Pending failure recovery](IMP-003-pending-failure-recovery.md)** | Trace one cancellation/refund failure and one successful operation with a lost reply. | Could make interrupted casts/rolls recoverable without duplicate refunds, duplicate results, or abandoned pending cards. | Medium investigation; high repair risk. |
| **P1 · [015: Target correction/history](IMP-015-target-correction-contract.md)** | Define and reproduce Retarget after application and while a roll is pending. | Clarifies which corrections are allowed; could prevent recipient/history mismatch or repeat application. | Medium; high risk for locking/history changes. |
| **P1 · [016: Roll caches and commits](IMP-016-roll-cache-and-commit-contracts.md)** | Test mode change → one bonus/reduction/reroll → switch back. | Could prevent an old cached mode restoring an obsolete roll or losing an adjustment. Preserves the existing dice. | Medium; medium–high risk across feature callers. |
| **P1 · [017: Ongoing/concentration lifecycle](IMP-017-ongoing-effect-lifecycle.md)** | Test an open concentration check through Wild Shape reversion, then source-owned Region cleanup directly. | Could protect newer effects, preserve form-transition checks, and make failed cleanup diagnosable/recoverable. | Medium per scenario; high risk for recovery/identity changes. |
| **P1 · [005: Region allowance scope](IMP-005-region-allowance-scope.md)** | Run two matching recipe instances on the same executor and compare intended per-cast/shared limits. | Could stop independent effects suppressing each other's triggers, while preserving intentionally shared limits. | Medium; high risk if limiter identity changes. |
| **P2 · [006: Refresh contract coverage](IMP-006-refresh-contract-coverage.md)** | Map representative rules to callers/tests; exercise overlapping requests and batches beyond eight. | Protects responsiveness and button correctness as features change; may improve failed-render diagnostics. | Medium; medium risk. No speed gain established. |
| **P2 · [009: Shield refresh/AC correction](IMP-009-shield-linked-refresh.md)** | Establish index coverage for its current scan and count duplicate renders/signals. | Could remove repeated full-history work from Shield while preserving settlement, hit/miss, and Undo visibility. | Medium; medium–high risk. Performance candidate needing measurement. |
| **P2 · [014: Ordinary save lifecycle](IMP-014-save-request-lifecycle.md)** | Reproduce dispatch failure or owner/GM takeover with an older dialog still open. | Could improve retry reliability and prevent duplicate/stale save handling if a gap exists. | Medium; medium–high risk for routing/session changes. |
| **P2 · [018: Presentation/animation](IMP-018-presentation-animation-contracts.md)** | Exercise actual client acknowledgments and add one deterministic scroll/cleanup case. | Could reduce stuck/manual workflows and UI surprises; retained-state changes require evidence first. | Medium; medium risk, higher for completion policy. |
| **P2 · [010: Region configuration lifecycle](IMP-010-region-configuration-lifecycle.md)** | Agree whether edits affect new casts, current Regions, or an explicit rebuild; test one edit type. | Makes configuration effects predictable and could prevent stale behaviors or lost customizations. | Small policy decision, medium investigation; high risk for migrations/live rebuilds. |
| **P2 · [012: Movement policy/coverage](IMP-012-movement-policy-and-coverage.md)** | Establish Spike Growth entry/partial/exit counts and one reservation failure case. | Could prevent wrong movement counts or repeat/missing rolls; establishes whether reuse for another feature is safe. | Medium; high risk for counting/reservation changes. Promote before adding another movement feature. |
| **P3 · [001: Neutral distance helper](IMP-001-shared-distance.md)** | Implemented 2026-11-10; six features user-confirmed in the [20-consumer checklist](IMP-001-distance-verification.md). | Neutral `tokenDistance` ownership, with measurement and caller policy preserved. | Full automated checks passed; remaining consumers/variations pending. |
| **P3 · [011: Separate Stinking Cloud](IMP-011-stinking-cloud-module.md)** | Implemented 2026-11-10; core gameplay user-confirmed. | Clearer library responsibilities and easier spell maintenance. Handlers moved unchanged. | Bounded extraction complete; retain detailed regression scenarios. |
| **P3 · [004: Main script boundaries](IMP-004-main-script-boundaries.md)** | Diagnostic cleanup implemented 2026-11-10; broader engine split remains deferred. | Ready reports installed version; main/manager setup messages no longer carry stale version labels. | Diagnostic-only change; future split remains large/high risk. |
| **P3 · [002: Shared helper boundaries](IMP-002-shared-helper-boundaries.md)** | Startup discovery extracted 2026-11-10; six consumers mapped in its [check sheet](IMP-002-helper-review-and-startup-checks.md). Other families remain in place. | Neutral discovery tool without card dependencies; no broad split or timing/policy redesign. | Full automated checks passed; focused game checks pending. Further extraction is separately scoped. |
| **P3 · [007: Reactive integration contract](IMP-007-reactive-integration-contract.md)** | Map Shield, one reduction, and a non-blocking follow-up across eligibility/readiness/commit/cancel. | Makes future reaction integration less error-prone; may reveal a specific missing connection. | Medium matrix; large/high-risk universal adapter. Promote the matrix when adding a new reactive feature. |
| **P3 · [013: Damage-dialog phases](IMP-013-damage-dialog-pipeline.md)** | Map preview, submission, and cleanup for a few representative riders. | Makes future rider additions easier and reduces accidental ordering/spending mistakes. | Medium matrix; large/high-risk registry refactor. Promote before adding complicated riders. |

Rows within each priority group give a suggested reading/investigation order, not a commitment to fix every item before proceeding. The expected effects are conditional benefits, not claims that these failures occur today.

## Suggested first work packages

| Order | Package | Concrete completion point | What to check in Foundry |
| --- | --- | --- | --- |
| **1 · Implemented** | **Neutral distance helper — IMP-001** | Extracted `tokenDistance` into `shared-distance.js`; all twenty consumers migrated; no helper hooks; explicit source-feature load retained. | Use the complete [caller checklist](IMP-001-distance-verification.md), including Fount normal/Wild Shape, range boundaries, footprint/elevation/units, and source scene. |
| **2 · Implemented** | **Stinking Cloud boundary — IMP-011** | Dedicated feature module loaded once; library recipe/settings intact; core gameplay user-confirmed. | Confirmed: GM/client casting, start-turn check, no cast application, turn/expiry and concentration cleanup. Exact round-rollover, disabled-option and unrelated-effect scenarios remain future regression checks. |
| **3** | **First recovery investigation — IMP-008 + IMP-003** | Reproducible before/after-state records for one mutation/history failure and one interrupted pending operation; propose a bounded repair only if warranted. | HP/effect Apply/Undo, canceled spell/first roll, old concentration replacement, owner/GM retry. |
| **4** | **Correction and lifecycle investigation — IMP-015/016/017, plus IMP-005** | Pick separate scenarios: applied Retarget; adjustment/cache return; check across form reversion; independent Region allowances. Record actual behavior and desired rules. | Original dice, current recipients/history, protected newer effects, overlapping Regions/casters, remaining resources. |
| **5** | **Shield/refresh work — IMP-006 + IMP-009** | Establish lookup/refresh counts before replacing the scan; preserve committed settlement separately from redraw deduplication. | Shield, Bardic Inspiration, Parry, reaction resets, grouped cards, mixed targets, HP/effect Undo; comparable large-battle capture for performance claims. |
| **Later, as needed** | **Remaining targeted coverage and architecture** | Select an actual editor/save/movement/UI issue or a new-feature dependency; take one slice from its finding. | Use that finding's scenario list; do not treat one generic success case as coverage of all features. |

The small diagnostic correction from IMP-004 was implemented separately on 2026-11-10. It removes stale main/Spell Manager labels and reports installed metadata at Ready; no engine extraction was included.

## What each kind of improvement buys us

| Goal | Best candidates | Limit on the claim |
| --- | --- | --- |
| **Safer game state and recovery** | 008, 003, 015, 016, 017, 005; then 014/012 | Investigations may confirm the current behavior and require only tests/docs. A source-order question alone is not a bug. |
| **Combat responsiveness** | 006 and Shield's lookup slice of 009; selected 018 cases | Measure comparable scenarios. File moves and fewer import lines do not prove less CPU or fewer renders. |
| **Easier future changes and learning** | 001, 011, narrow 004/002; integration maps in 007/013 | Primarily maintenance benefits, with expected behavior preservation. Shared-looking functions may intentionally have different policies. |
| **More predictable setup/UI** | 010, 018, and direct condition/placement cases in 017/010 | Agree on edit/rebuild, recipient, and completion behavior before automatically changing existing documents. |

For example, the distance calculation is already shared. Moving it does not eliminate 19 duplicate calculations or repeated module evaluation. Likewise, splitting the main file does not by itself make combat faster.

## Keep the work small and reviewable

For a selected package, record its exact scope in the finding before editing. Keep behavior-preserving moves separate from rule changes and recovery redesign. Retain named regressions, source identities, native scaling/dice, reaction/resource timing, and Undo.

For authorized shared runtime/harness changes, run the relevant local regressions first, then `node tools/run-tests.mjs --checks`. Complete the applicable in-game checks when available and label unperformed checks honestly. Tests/tools remain local and Git-ignored; this roadmap does not add them to the release or repository.

An investigation is complete when the observed behavior, desired contract, and evidence support a decision: **no change**, **add coverage/documentation**, or **propose a specific fix**. Do not build generalized recovery, locking, or adapter infrastructure merely to close a note.

## Planning status

**Deferred future direction:** [IMP-019: Unified action cards](IMP-019-unified-action-cards.md) was recorded after this ranking. It proposes a gradual, action-by-action presentation rollout over native messages, with one supported module interface for migrated workflows. The user does not intend to begin in the coming week or so. It is not added to the immediate work packages or ranked as a current fix; reconsider related presentation/adapter extractions when that project is requested.

- All IMP-001 through IMP-018 are represented above; related work is grouped without replacing or renumbering the original findings.
- No runtime implementation, new investigation tests, benchmark, full-suite run, or in-game verification was performed for this prioritization task.
- The user requested prioritization and expected effects. Runtime implementation remains a separate next task.
