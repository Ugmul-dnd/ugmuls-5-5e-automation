# IMP-019: Unified action cards backed by native messages

[Findings register](README.md) · [Priorities](priorities.md) · [Presentation guide](../guides/presentation-and-animation.md)

- **Status:** Weapon and spell attack/damage implementation on `dev-card-replacement`; spell extension in-game verification pending.
- **Type:** Future presentation and workflow-management architecture, not a defect report.
- **Recorded:** 2026-11-10, `v1.0.1-dev`.
- **Authorization:** The original note recorded a deferred concept. On 2026-11-12 the user authorized implementing attack/damage first, after reviewing the compact layout.
- **Current scope:** Native single-target weapon and spell attack/damage content in one usage home, with a section per spell beam/ray; stock target colors, thin section borders, pending/cancel behavior, target-adjacent Retarget before application, original roll menus before application/after complete Undo, compact expandable native application, and reactions/Undo at the bottom. No push or publication requested.

## Initial implementation — 2026-11-12

`scripts/unified-attack-card.js` wraps native usage rendering for the narrow supported scope and embeds full native child content before system enrichment. Existing feature render hooks still process `.card-summary[data-message-id]` children. Final layout moves existing control elements into a common footer with their original message identities; it does not create replacement dice or mutation workflows. `simplifyAttackCards` remains the existing presentation switch.

Unsupported workflows retain the prior presentation. Existing damage-on-miss mechanics (such as Graze) and applied transactions needing Undo remain visible rather than being discarded. Retarget is also revalidated through the live shared adjustment lock.

Spell extension: multiple single-target attacks under one cast retain separate native attack/damage sections and footers. Multi-attack damage requires an explicit `damageAttackId` and matching recorded target; ambiguous associations fall back to native presentation. Each beam's native damage dialog uses its own target and critical result, with the scaled cast activity and no additional item use. Eldritch Blast level scaling and Scorching Ray upcast counts retain the existing remaining-attacks workflow. Configured spell on-hit effects retain native concentration and scaling preparation but use the individual attack as their application/Undo identity, so undoing one ray leaves other rays and shared cast resources intact. Live spell checks remain pending.

Follow-up: supported single-attack/single-damage cards now couple HP Apply and configured on-hit effects, with one **Undo Apply** control. Existing histories remain separate internally for rollback and newer-effect protection. An applied card cannot replay HP; failed effects can expose **Retry Apply** without repeating damage, and explicit effect choices retain native controls. Combined Undo waits outside the HP-history queue for effect settlement to avoid deadlocks and deduplicates concurrent clicks. Warding Flare now requires a live hit for presentation and authoritative use. These changes still require in-game verification.

Icon coverage review: user-confirmed Warding Flare, Cosmic Omen and Shield icon checks are separate from automated verification. Follow-up controls outside the pre-application reaction governor now also use the shared presentation table: Superior Hunter’s Prey, Psionic Strike, Hand of Harm, Rend Mind, Lifedrinker healing, Alchemical Eruption, Elemental Smite choices, Sudden Strike, Cleave, Ram, Chilling Retribution, Fount of Moonlight and damage-triggered recovery activations. This is a presentation registration, not a new reaction hold. Decline/retry buttons, Apply/Undo controls, effect-selection workflows and informational notes retain their labels. Broader follow-up icon coverage still needs in-game checks.

Mastery follow-up: Sap now waits for actual Apply on supported unified attacks, as requested, instead of applying when the hit is first published. It shares Undo Apply/reapplication with source-specific cleanup and no separate toggle. Current hit state is revalidated at application; zero damage does not invalidate Sap on a confirmed hit. A per-damage Sap-recipient receipt permits Undo even when no HP changed. Slow retains its positive-damage requirement, and Vex/Topple/Graze retain their distinct workflows. Unsupported native layouts keep their previous Sap path.

Verification after the spell extension: 30 targeted local test files passed, followed by all 375 discovered files with syntax checks for 318 runtime scripts, manifest validation, and relative-import checks. Spell regressions cover five explicitly linked rays, equal totals/reversed timestamps, multiple recorded targets, privacy/animation presentation, grouping fallback, per-ray effect identity/concentration/scaling, independent locks and HP Undo, newer-effect protection, native scaled damage dialogs, cancellation and player ownership. Existing multi-shot tests retain level/upcast counts and consumption checks. Local tests remain Git-ignored. The user's earlier weapon/icon checks are separate from these automated results; the spell layout and multi-beam workflow still need a Foundry playthrough. No performance result is claimed.

## User's intended outcome

A normal attack can currently produce an ability/usage card, an attack-roll card, and a damage card. The desired interface presents that action as **one persistent visible card**, updated as its workflow progresses, while retaining the underlying native messages and rolls.

Foundry/D&D5e continues creating and processing native activity, attack, save, damage, and healing documents. The module streamlines their combined visual presentation and final controls. This is not a replacement of the D&D5e rules, dice, damage calculations, or native document engine.

The user expects a slow rollout, **one action type/scenario at a time**. A small family of similarly styled cards—perhaps three—would handle distinct workflows. There should not be one universal card full of exceptions, nor a permanent obligation to maintain two complete module interfaces.

## Proposed card family, not a final design

| Candidate | Responsibility |
| --- | --- |
| Attack action | Individual attacks, hit/miss, damage, reactions, adjustments, application, and history. |
| Save action | Recorded recipients, pending/completed saves, per-target outcomes, shared damage, and effects. |
| Utility/support action | Healing, buffs, placement, and other supported non-attack/save activities. This boundary may need subdivision after reviewing real scenarios. |

The number and exact division remain open. Shared visual structure and tools should support distinct workflow handlers rather than force every action into one state machine.

## Example: the first ordinary attack

```text
Action declared / recorded target
  -> attack pending
  -> attack result: hit or miss
  -> damage pending, when applicable
  -> damage rolled / adjustments resolved
  -> application recorded
  -> relevant Undo/reapplication controls and history
```

This is a conceptual sequence, not an approved implementation or a guarantee that every action is linear. Reactions, cancellation, corrections, multiple attacks, and multiple targets introduce branches. Existing automation timing must remain authoritative.

The native usage message could be the persistent visible home, with its native linked results represented inside it. That is a candidate starting point, not a settled requirement to create a new controller message or custom message type.

Only suppress a native standalone entry for a viewer once its permitted result/controls are safely represented in the combined card. Keep underlying message IDs, types, origins, attack links, roll data, pending sessions, and histories intact. Suppressed means a presentation choice, not deleting or changing the documents' visibility permissions.

## Ownership and responsibilities

| Layer | Remains responsible for |
| --- | --- |
| Native Foundry/D&D5e | Activities, evaluated dice, native calculations, typed messages, and supported application mechanisms. |
| Module workflow handlers | Eligibility, authority, resource/reaction use, adjustments, automation holds, mutation, and history. |
| Combined action-card presentation | Current permitted state, result sections, applicable controls, and a readable account of the action. |

The card should derive current state from authoritative native/module records. Avoid a second independent copy of every result that can drift from the messages it represents. Any new action identity, durable history, or state field needs an explicit purpose and lifecycle.

Features could eventually contribute controls to defined locations instead of repeatedly searching standalone and grouped DOM layouts. The card family could share target rows, status labels, action sections, history display, permission handling, and targeted refresh requests. Exact APIs/files are undecided.

## What this could simplify

- Source/result hide-and-show handoffs and duplicated standalone/grouped render paths.
- Repeated button discovery, duplicate prevention, and placement across multiple card faces.
- Presentation of pending saves/damage and per-target outcomes.
- Navigation between targets, reactions, adjustments, Apply, and separate HP/effect Undo controls.
- Refresh selection: several related message updates could coalesce into one visible action refresh through the existing queue.
- Learning and maintenance: one presentation owner for each migrated workflow, with consistent feature integration points.

These are expected architectural benefits, not established reductions in script count or measured performance. Native messages and mutations still exist; less chat clutter does not by itself mean less CPU or fewer document writes.

## One supported module interface after migration

During development, old and new presentation may temporarily coexist for comparison or unmigrated scenarios. Once a scenario is proven, its combined card becomes the module's supported interface and the redundant old presentation path can be retired.

The user explicitly accepts that disabling the combined-card interface may lose automation that depends on it. There is no requirement to duplicate every module feature on standalone native cards indefinitely. That eventual boundary must be documented, while native basic play remains a separate system capability.

Deciding whether to reduce/disable old module functions comes **after** the migrated workflow is verified. Native document generation and calculation are not the functions targeted for replacement.

## History, Undo, redo, and cleanup

The interface should document what happened, not merely replace the latest total without explanation. Existing histories may support part of that display, but they are not assumed to form a complete immutable action log already.

Keep these operations distinct:

- Undo recorded HP changes versus undo source-specific effects.
- Reapply an evaluated result versus recalculate its application using current defenses.
- Reroll an action versus reuse its existing dice.
- Hide/collapse an entry versus delete/archive its underlying records.

Reliable redo is a separate design task. A combined card does not automatically make it safe to replay resources, reactions, concentration, or effects after later game-state changes. Preserve newer effects and unrelated changes, and define the intended restoration/reapplication scope before adding a single broad Undo/Redo control.

## Existing connections to review when work resumes

The earlier feasibility review found that native D&D5e 6.0.6 already embeds associated roll summaries in usage cards and routes actions using child message identity. This provides a starting point; check the installed system version again before implementation.

| Source | Connection |
| --- | --- |
| [card-presentation.js](../../scripts/card-presentation.js) | Existing handoff, grouped summaries, pending saves, tags, and attack Damage action. |
| [shared-activity-card.js](../../scripts/shared-activity-card.js) | Card relationships, live adjustment locks, recorded recipients, shared-target synchronization. |
| [chat-message-index.js](../../scripts/chat-message-index.js), [chat-refresh.js](../../scripts/chat-refresh.js) | Existing indexed relationships and coalesced/targeted refresh; avoid new full-chat scans. |
| [pending-cast.js](../../scripts/pending-cast.js), [pending-damage.js](../../scripts/pending-damage.js) | Pending publication, cancellation, session takeover, native completion, and replay protection. |
| [save-prompts.js](../../scripts/save-prompts.js), [retarget-card.js](../../scripts/retarget-card.js) | Owner routing, outcomes, explicit correction scope, and linked-recipient updates. |
| [save-roll-controls.js](../../scripts/save-roll-controls.js), [damage-roll-controls.js](../../scripts/damage-roll-controls.js) | Original-dice preservation, cached modes, locks, and correction authority. |
| [reactive-automation.js](../../scripts/reactive-automation.js), [npc-damage-automation.js](../../scripts/npc-damage-automation.js) | Holds/readiness, manual control, application, and coordinated animation. |
| [damage-undo.js](../../scripts/damage-undo.js), [hit-effect-reapply.js](../../scripts/hit-effect-reapply.js) | Separate mutation histories, newer-source protection, and reapplication controls. |
| [animation-wait.js](../../scripts/animation-wait.js) | Foreground/inactive-client completion and original result visibility. |

Related findings: [IMP-002](IMP-002-shared-helper-boundaries.md), [IMP-006](IMP-006-refresh-contract-coverage.md), [IMP-007](IMP-007-reactive-integration-contract.md), [IMP-008](IMP-008-application-history-boundaries.md), [IMP-013](IMP-013-damage-dialog-pipeline.md), [IMP-015](IMP-015-target-correction-contract.md), [IMP-016](IMP-016-roll-cache-and-commit-contracts.md), and [IMP-018](IMP-018-presentation-animation-contracts.md). This concept may give some later consolidation a useful direction, but does not resolve those findings automatically.

## Future rollout and acceptance plan

1. **Choose one narrow scenario.** Candidate: one single-target weapon attack. Specify included/excluded reactions, adjustments, application, and history before coding; unsupported scenarios keep their existing route until migrated.
2. **Prove one visible home.** Represent the native usage, attack, and damage messages without deleting them or changing their authoritative links. Show each stage and preserve required controls.
3. **Validate the full chosen scenario.** Test cancellation, resource use, corrections, animation, Apply, HP/effect Undo, ownership, privacy, and reload reconstruction—not just the successful render.
4. **Migrate adjacent cases incrementally.** Multi-attacks, riders, reaction variants, and then other card families need explicit scope and validation.
5. **Retire covered old presentation paths.** Remove redundant controls/render handling after the new path is proven. Keep unmigrated workflows working without promising two permanent implementations of migrated ones.

Planned checks, all unperformed for this concept:

- [ ] One visible card per chosen action; original native documents/results remain addressable and correctly linked.
- [ ] Multiple attacks/targets retain individual outcomes, adjustment locks, application state, and control scope.
- [ ] Each viewer sees only permitted blind/whispered/hidden information; a shared parent does not expose a private child result.
- [ ] Player and active-GM operations retain authoritative validation, original resource/reaction timing, and no duplicate application.
- [ ] Pending/canceled/failed/partially applied actions render honestly and can use the appropriate recovery path.
- [ ] Refreshes coalesce by visible action without skipping child updates needed by native workflows or other modules; work counts remain bounded.
- [ ] Dice animate once, results hand off correctly, and inactive clients do not stall completion.
- [ ] Reload, changed ownership, deleted child records, and post-action effect changes do not invent a completed or reversible state.
- [ ] Compare the same supported scenarios before/after, run relevant regressions then the full runner with checks for runtime changes, and record actual Foundry observations. Measure separately before claiming speed gains.

## Record

- **Implementation/prototype:** Initial single-target weapon attack/damage presentation; see implementation record above.
- **New tests:** Local scope/privacy/native rendering/animation regressions; existing workflow suite passed. No benchmark or in-game verification.
- **Next step:** Foundry visual and GM/player verification before expanding scope or pushing.
