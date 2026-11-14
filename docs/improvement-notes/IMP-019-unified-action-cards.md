# IMP-019: Unified action cards backed by native messages

[Findings register](README.md) · [Priorities](priorities.md) · [Presentation guide](../guides/presentation-and-animation.md)

- **Status:** Attack/damage, save/damage/effect and targeted healing implementation on `dev-card-replacement`. User confirmed the preceding attack, Elemental Attunement and Starry Archer changes on both clients and reports continued save-card testing going well. Healing cards await live verification.
- **Type:** Future presentation and workflow-management architecture, not a defect report.
- **Recorded:** 2026-11-10, `v1.0.1-dev`.
- **Authorization:** The original note recorded a deferred concept. On 2026-11-12 the user authorized implementing attack/damage first, after reviewing the compact layout.
- **Current scope:** Native single-target attack/damage content, including feature-based attacks, in one usage home, with a section per linked beam/ray and a separate usage per Flurry strike; stock target colors, thin section borders, pending/cancel behavior, target-adjacent Retarget before application, original roll menus before application/after complete Undo, compact expandable native application, and reactions/Undo at the bottom. No push or publication requested.

Feature-attack follow-up: eligibility now checks the native attack activity rather than a weapon/spell item list. Empowered Strikes, Elemental Strike, Archer and other native feature attacks use the same supported single-target layout. Flurry's original Focus declaration remains separate, but each counter strike now receives its own native usage with no extra consumption, keeping targets, damage, Flurry count and Undo independent. Multi-result workflows with associated saves/healing or ambiguous damage links retain their native fallback. Live verification of these newly included feature attacks is pending.

Elemental monk follow-up: native Attunement still consumes Focus and controls its duration/end phase. A matching visible actor buff enables prepared Empowered/Unarmed Strike reach and source-defined elemental types; no owned strike item is permanently rewritten. Existing Push/Pull saves and feature-gated Epitome dice/resistance/Stride workflows are reused. The resistance component shares the visible Attunement buff and can be removed independently. Effect changes use targeted actor/feature requests through the coalesced refresh queue. No native world/compendium content was edited.

Feature/monk verification: 45 targeted test files passed, followed by the full 377-file suite with 319 runtime scripts parsed and manifest/import checks. Local PHB source fixtures verify native strike formulas, damage types, Attunement duration and Strength-save data. Regressions cover Flurry usage isolation/cancellation, feature attack links and effects, buff non-stacking, resistance migration/replacement/component removal, native end/expiry/incapacitation, GM/player authority and unrelated-update work counts. These new feature/monk workflows still need in-game checks; earlier user-confirmed spell results remain a separate verification record.

User follow-up confirmed that the new Empowered Strike card and elemental damage choices work. Attunement shutdown needed a correction: live source templates and stale registry entries are no longer accepted as applications. End/disable/delete transitions remove the applied enchantment and its prepared strike overlay without automatic resurrection. Stride's granted native Fly/Swim changes now share the visible Attunement effect, with only the corresponding applied rider suppressed. Automated regressions include templates left enabled, native card ending, queued refreshes around disable/delete, renewed activation and resistance changes preserving Stride; the corrected live on/off display still needs user verification.

## Healing cards — 2026-11-13

User testing confirmed Cure Wounds, Preserve Life, Lay on Hands, mass healing, Chalice and Heroism. Second Wind revealed that native Self healing can omit recorded token targets, causing the intended native fallback and a second visible card. Self healing now records a validated caster token during pre-use and carries that explicit identity into its roll; it does not write targets during rendering or infer them from the current enemy selection. Retarget is unavailable for Self healing. Targeted regressions cover changing selections, recorded speaker resolution, missing caster tokens, ordinary-healing isolation, independent settings and Apply/Undo/reapply. The Second Wind fix still needs a fresh in-game cast on both clients.

The user authorized combining targeted healing declarations and roll cards into the same compact usage home. Native Heal activities now reuse the unified application renderer/controller, preserving each healing message's original origin, recipients, dice and configured effects. Green source/result borders, source-name description/map hover, pending/animation handoff, native roll/application details, follow-up controls and Undo remain together. The native Healing button is hidden once its result exists. `simplifyHealingCards` is independently configurable and enabled by default.

The active GM uses the existing combined Apply/Undo transaction. Other viewers retain any application controls actually rendered by the system, preserving native player-tray permissions rather than granting a new authority path. Native manual healing records per-token receipts through the existing HP history/socket workflow; the authority validates recorded identity and actor ownership so applying to a subset leaves other recipients available. Existing automatic-healing settings and source resource workflows are unchanged. Native options handle HP caps, healing at 0 HP, temporary HP and feature allocations. Partial retries do not heal committed recipients twice; Undo preserves later HP changes. Special Life Transfer sacrifices, mixed save/attack/healing uses and healing without recorded token identities retain native presentation/application. No current selection is substituted for recorded recipients.

Focused automated checks cover native spell/feature and multi-target healing, caps/0 HP, temporary HP, configured effects, duplicate/partial application, original dice, Undo/reapply, privacy, animation, independent settings, native player controls and fallback/restoration. In-game checks of Cure Wounds/Healing Word, a multi-target heal, temporary HP and both clients remain pending. No push or publication requested.

## Save cards — 2026-11-13

Presentation follow-up: remove native summary negative side margins so save and damage sections align with the source header; keep the effect tray on the same blue save edge. Vow of Enmity's attack-setup activation now rebuilds the original dialog in place, preserving its original native attack-to-damage continuation and pending usage identity. Focused checks cover GM/player authority, one resource charge, concurrent clicks, AC5E's installed mode calculator, suppression/cancellation, original message/targets/options and canceled dialogs. Live verification of these follow-ups remains pending.

Save-first recurring follow-up: Weird and Phantasmal Killer create a separate native damage usage after a failed repeat save. That child now records its application source; the parent embeds its native damage/setup controls using matching effect instance, turn stamp and recorded recipients. Native origins and resource/dice workflows stay intact. The shared linked-HP lookup follows this explicit relationship even with compact presentation disabled. Manual Apply/Undo stops both automatic usage sources, and corrected successful saves cannot apply stale damage. Targeted tests cover these relationships, rendering, damage prerequisites, correction locks and Undo/reapply; live GM/player presentation remains to be checked.

Damage-only follow-up: native damage activities now use the same usage home and application controller without save-outcome prerequisites. This includes Region/turn-start triggers such as Hunger of Hadar. Linked saves/attacks/healing or ambiguous attack-damage identities retain the existing fallback. Reactions outside standard action containers join the source-linked footer with the original rider handlers. Automated checks cover native recipient damage, immunity, configured effects, original dice, Apply/Undo/reapply and footer node identity; Foundry appearance on both clients remains to be checked. The reported grapple escape failure was explained by the user's confirmation that the creature was Stunned, so its save rules were left unchanged.

The user authorized extending the compact layout to spells and features that prompt native saves followed by damage and/or effects. `scripts/unified-save-card.js` keeps the native usage as the visible home, reuses permitted save summaries, and embeds full native damage/application details. Pending rows retain native retry and targeting controls. Existing automation settings remain authoritative; manual application uses one active-GM Apply and one Undo Apply. The default-enabled `simplifySaveCards` setting controls this presentation. Activities with linked attacks, healing or ambiguous attack-damage identities retain their existing presentation.

Manual Apply validates recorded recipients and completed outcomes, resolves native effect choices before changing HP, waits for existing automatic/feature work and reaction holds, then uses the native damage tray with its per-target options and existing effect-application helpers. Specialized Stunning Strike, Grapple and Battle Master status workflows remain delegated. Partial failures retain recipient receipts for safe retry. Undo waits for in-flight application, restores linked HP/effect histories, preserves newer effects and retains unresolved recipient history for recovery. Applied and in-flight cards lock corrections and Retarget. All refreshes use the existing targeted queue; save summaries are reused and compatible HP history is batched.

Verification: 52 relevant test files passed, followed by the full 378-file suite and checks of 320 runtime scripts, manifest entries and relative imports. Coverage includes mixed failed/successful saves, half damage/resistance, Evasion/immunity, effects-only actions, native effect selection/concentration, original dice, partial retry, Undo races, unavailable recipients, player/GM controls, privacy, animation identity and render/update work counts. Two local compatibility fixtures were updated for the installed native damage-option API and AC5E relative helper imports. These are automated results; mixed-outcome area damage and effects-only cards still need Foundry checks on both clients. No benchmark, push or publication was performed.

User confirmation supersedes the pending live-verification notes for the preceding Elemental Attunement shutdown/Stride and Starry Archer fixes: those are now confirmed on both clients.

## Initial implementation — 2026-11-12

Graze lifecycle follow-up: each live Graze application now receives combined Undo Apply, independently of older miss-damage records. Fully undone Graze documents remain available as history but are excluded from the active unified scope. Zero-HP automatic applications retain Undo, incomplete restoration retains its recovery control, and stale undone markers cannot hide or unlock actual reapplied HP history. Undo stops queued Graze automation and restores only that damage; original attack dice and independent on-hit effect histories remain intact. Focused tests exercise repeated mastery-generated applications, native HP history, correction back to a hit, stale-control rejection, legacy-state recovery and duplicate render-hook controls. Live verification remains pending.

`scripts/unified-attack-card.js` wraps native usage rendering for the narrow supported scope and embeds full native child content before system enrichment. Existing feature render hooks still process `.card-summary[data-message-id]` children. Final layout moves existing control elements into a common footer with their original message identities; it does not create replacement dice or mutation workflows. `simplifyAttackCards` remains the existing presentation switch.

Unsupported workflows retain the prior presentation. Existing damage-on-miss mechanics (such as Graze) and applied transactions needing Undo remain visible rather than being discarded. Retarget is also revalidated through the live shared adjustment lock.

Setup follow-up — 2026-11-13: render the native attack template before a result document exists, using the current scaled activity, native action labels, recorded neutral targets and a pending box in the dice position. Keep this face while the actual attack animates. Existing usage updates continue to drive targeting/metamagic changes; preparation creates no synthetic message, roll, resource write or refresh loop. Preserve usage controls and pending-cast cancellation, and remove the separate preparation status once the dice-area status is present. Automated preparation, animation, privacy, targeting and cancellation regressions pass; the new visual handoff still needs a live check.

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
