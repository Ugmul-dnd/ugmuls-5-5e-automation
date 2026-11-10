# Applying results and Undo

[Guide index](README.md) · [Card relationships](shared-activity-card.md) · [Reaction timing](reactions-and-automation-timing.md)

Source reviewed **2026-11-09**, `v1.0.1-dev`: [npc-damage-automation.js](../../scripts/npc-damage-automation.js), [effect-automation.js](../../scripts/effect-automation.js), and [damage-undo.js](../../scripts/damage-undo.js). Important connections include [hit-effect-reapply.js](../../scripts/hit-effect-reapply.js) and [effect-automation-policy.js](../../scripts/effect-automation-policy.js). Excerpts preserve source expressions with spacing expanded where helpful.

## A roll, an application, and an Undo are different events

A damage total is not the same as the HP actually lost. Saves, resistance, immunity, temporary HP, caps, and other native calculations can change the result of applying it. An effect can likewise be skipped, refreshed, held for a decision, or owned by a Region.

The module therefore records application history. Undo uses that history rather than rerolling the action or assuming the original total is the amount to reverse.

```text
Recorded card + evaluated roll + target outcomes
  -> check readiness, settings, authority, reactions, and manual decisions
  -> native damage/effect application
  -> record completed recipients and before/after history
       |-- later correction: relevant locks protect applied state
       |-- Undo HP: reverse recorded HP changes
       `-- Undo effect: restore/remove only the applicable recorded instance
              -> manual Apply / Apply Effects can use the corrected outcome
```

These are cooperating workflows, not one atomic transaction. HP and effects have separate histories and retry paths. Undo Damage does not automatically mean Undo Effect, refund a spell slot, restore every reaction marker, or rewind all events caused by the hit.

## 1. Which file owns which part?

| File | Responsibility |
| --- | --- |
| `npc-damage-automation.js` | Schedule automatic HP/healing and save/effect-only-hit applications; check prerequisites, coordinate animations, and respect manual takeover. Its filename does not limit automatic application to NPC recipients. |
| `effect-automation.js` | Apply supported utility/buff effects and certain healing-associated buffs using native effect preparation. |
| `damage-undo.js` | Capture/store HP changes and effect snapshots, wrap manual native trays, expose Undo controls, and validate related recording requests. |
| `hit-effect-reapply.js` | Couple damaging attacks' effects to actual HP recipients and allow appropriate effect-only retry/reapplication without repeating HP. |
| `effect-automation-policy.js` | Hold automatic decisions such as available Legendary Resistance on a failed save or multiple effect choices. |

Settings remain separate: automatic damage, automatic healing, saved effects, hit effects, and buffs each have their own option. The readiness/governor/policy paths can stop an enabled option; enabling one does not imply every result is safe to apply immediately.

## 2. Automatic HP: find eligible recorded recipients

`readyDamageTargets` checks feature-specific in-flight gates, pending-roll state, the [reaction governor](reactions-and-automation-timing.md), rider-save prerequisites, manual workflow state, and target confirmation. It resolves the card's recorded Token UUIDs and uses the appropriate damage/healing eligibility helper.

It then excludes token UUIDs already in `automaticDamageTargets` and selects according to current outcomes:

- Save-based results require known `success`/`failure` outcomes for the eligible targets. An unknown save is pending, not an assumed failure. The native tray determines the damage amount for the completed outcome.
- Normal attacks select recorded hits, with explicit supported miss-damage exceptions.
- Graze has its own current-miss path and a retired-card exclusion.
- Healing uses its separate target eligibility, allowing zero-HP recipients where the ordinary living-target helper would reject them.

`attackForDamage` prefers `damageAttackId`, then uses the originating usage's preceding-attack timestamp fallback. Preserve explicit source links; matching totals and current token selection are not source identity.

`manualKey` chooses the activity/attack group whose manual decision controls the result. `isManual` checks both local canceled state and relevant `manualDamageWorkflow` flags. It is possible to have an evaluated result with no automatic recipients ready yet.

## 3. Apply through the native tray, then record what actually happened

`applyAutomaticDamage` requires active-GM authority, the appropriate HP option, and no current per-card run. It checks targets, effect policy, and animations, applies supported automatic weapon-feat effects before HP locks the result, then checks readiness again.

The implementation creates a hidden holder containing a native `damage-application` element. It configures targeted mode, filters the native target list to the recorded eligible tokens, and sets automatic-application options. This retains native save, damage-type, resistance, immunity, vulnerability, Evasion, and other calculation paths rather than implementing a second HP calculator here.

Before native application it writes `automaticDamageDone`, rechecks the governor/policy/target list, and calls the tray. That flag is an early claim, not proof that every intended actor has already lost HP. Actual `dnd5e.applyDamage` hooks populate local sets of completed Token/Actor UUIDs, and those tokens are merged into `automaticDamageTargets` afterward.

The `dnd5e.preApplyDamage` listener provides a final automatic hit/manual/setting guard. A target that became a miss must not receive ordinary hit damage just because it qualified earlier. This is why there are checks both before and near the mutation.

After completed damage, eligible hit effects run for the actors actually reached. A partial application stops further automatic processing and asks for manual handling of remaining amounts. The exception path likewise marks the workflow manual; it does not rewind HP already applied to earlier recipients. `finally` removes the hidden holder and clears local running/application sets.

The normal scheduler coalesces a card into a 100 ms delayed attempt and serializes scheduled application through a queue. That timer is not a reaction-choice timeout or a measured performance claim.

## 4. Wait for dice without making a background client a permanent blocker

`waitForDamageAnimation` uses the shared animation helper when available and has visible/hidden-document fallback handling. `waitForWorkflowAnimations` gathers relevant damage/healing, save/check, and supported rider-save cards, waits locally, and requests acknowledgments from other active users.

In this implementation, a disconnected user is removed from the pending acknowledgment set. A connected client that fails to acknowledge within 30 seconds causes an error so the workflow can stop rather than apply early. The acknowledgment path filters visible content in its fallback and delegates to the shared client-roll helper when available.

These waits are separate from the reaction governor's terminal stop. They coordinate visual completion; a browser animation capture does not measure server CPU time.

`shouldAutoRollNpc` is another related export: it permits the NPC-save shortcut only when enabled, this client is a GM, the actor is an NPC, and no non-GM user has OWNER permission. It does not make player-owned NPC saves automatic simply because their actor type is `npc`.

## 5. HP history: capture changes, not displayed totals

`captureDamageUndo` runs before native damage application. It finds a damage/healing source from `origin` or `originatingMessage`, accepting a message reference or normalized string, and stores numeric `value`, `temp`, and `tempmax` values in the operation options.

After application, `damageUndoRecord` computes changed fields:

```js
const changes=hpKeys.map(key=>({
  key,before:options.rsaUndoBefore[key],
  after:Number(actor.system.attributes.hp[key]??0)
})).filter(change=>Number.isFinite(change.before)
  &&Number.isFinite(change.after)&&change.before!==change.after);
```

`map` builds one candidate record for each HP field; `filter` keeps actual finite changes. Object shorthand `key` means `key: key`. `?? 0` supplies a default for absent fields; it does not replace a valid zero.

A record has an ID, Actor UUID, and changes. Feature metadata can also connect absorbed Arcane Ward damage, Strength of the Grave evidence, or Guardian damage accounting. A fully absorbed hit can therefore need history even without ordinary HP loss.

### Manual application also needs history

`applyManualHpWithUndo` wraps the native manual tray. It uses a per-tray in-flight guard and local session, intercepts merged options to tag manual applications, and gathers hook records. Where a participating actor has no hook record, it compares the saved before-state with current HP as a fallback.

The wrapper restores the original tray method and clears local session/guard state in `finally`. It records successful partial changes even if the native apply reported an error, then rethrows the error. It does not pretend the entire application either happened or did nothing.

`storeManualHpApplication` resolves recipient actors, validates the active user's GM/ownership permission, stores acceptable records through private `storeRecord`, and marks `hpApplicationRecorded` even if caps produced no numerical change. That zero-change application can still need Undo to reopen controls.

`storeRecord` restricts keys to the three HP fields, requires finite before/after values, deduplicates record IDs, and checks supported Ward metadata. These are validation rules for submitted application history, not an independent recomputation of the submitted amounts from dice.

Players route recording requests to the active GM; without a suitable GM the recording paths are not a general cross-client persistence guarantee. The socket handler checks destination/active-GM identity, user activity, message type, and the action's permissions. Actual Undo requests require a GM requester.

## 6. Undo HP preserves later changes as far as its arithmetic allows

`undoCardDamage` is GM-only, skips retired Graze, clears `hpApplicationRecorded`, and processes a copy of the history newest-first. A missing actor warns and retains that record. Supported Ward state is restored through its own helper before HP updates.

The core calculation is:

```js
const current=Number(actor.system.attributes.hp[change.key]??0);
let restored=Math.max(0,current+change.before-change.after);
if(change.key === "temp" && current>change.after)
  restored=Math.max(current,change.before);
const maximum=actor.system.attributes.hp.effectiveMax??actor.system.attributes.hp.max;
if(change.key === "value" && Number.isFinite(maximum))
  restored=Math.min(maximum,restored);
updates[`system.attributes.hp.${change.key}`]=restored;
```

For example, this card took HP from 40 to 30. Later healing raised it to 35. Undo adds the recorded loss of 10 to the current 35, subject to today's maximum. It does not blindly set HP back to 40 and erase the later healing.

`Math.max`/`Math.min` enforce bounds. Temporary HP has a distinct preservation branch when the current pool exceeds the recorded post-application pool; it is not simply additive healing. This arithmetic is a practical restoration policy, not complete provenance for every later HP/temp-HP event or cap interaction.

Actor updates carry `rsaUndoDamage:true` so cooperating triggers can distinguish restoration from a new damaging hit. Each successful record is removed and the shorter history persisted. A failure can leave partial history; live correction-lock checks must inspect what remains.

Normal completion writes `damageApplyReopened`. Fully undone Graze instead retires the Graze card and clears its related mastery action for that target. No part of this function rerolls original dice.

HP Undo does not itself explicitly set `manualDamageWorkflow` in this function. The broader manual-interaction/application paths govern automatic takeover. By contrast, effect Undo explicitly marks its usage manual. Keep those source details distinct when investigating an unusual direct/API call.

## 7. Effects: apply native data, remember the prior instance

`applyEffectWithUndo` runs through the shared Undo module's local queue. It skips Region-managed card effects, identifies an existing source/replacement effect when applicable, snapshots its data, invokes native `_applyEffectToActor`, and records the returned instance.

```js
const record={id:foundry.utils.randomID(),effectUuid:applied.uuid,
  sourceMessage:usage.uuid,before,...(replace?{replacement:true}:{})};
await card.setFlag(MODULE_ID,"effectUndoHistory",[...effectHistory(card),record]);
```

`before` is the previous data or `null` for a new application. The conditional spread adds replacement metadata only when supplied. The recorded message identity lets Undo tell this application from a later refresh by another card.

`applyConditionWithUndo` uses native status toggling, leaves an already-present status alone, identifies the resulting effect, stamps its message origin, and records prior data if that native effect ID already existed. It does not turn a pre-existing Prone status off just to apply Prone again.

### Save/attack outcomes and automatic ledgers

`applyOutcomeEffects` handles supported saves and effect-only attacks, with active-GM/in-flight/manual/governor checks and completed recorded outcomes. Native effect profiles determine whether a successful save permits the effect; special feature workflows are delegated rather than flattened into this generic loop.

Damaging attacks defer effects to the HP-linked path. Save effects with automatic damaging parts can wait for the relevant HP recipients to complete. Region-managed effects are filtered out, and existing equivalent/Region-owned effects are respected.

`automaticEffectApplications` stores per-token/effect keys. The loop persists progress after each processed effect so a later attempt can skip completed entries. A ledger entry can also mean an equivalent effect already existed; it is not always evidence that this card created an effect or has an Undo record for it.

The usage's `outcomeEffectsApplied` reflects processed state and participates in correction locks. Manual-effect decision policy can hold the work instead: failed-save Legendary Resistance or multiple applicable choices require appropriate resolution. That policy does not generally veto attack-hit effects merely because the target has Legendary Resistance.

### Utility and healing-associated buffs

`applyBuffEffects` uses its own local `pending`/`completed` sets and the buff option (with a dedicated Hill's Tumble exception). It rejects manual decisions and pending/canceled target confirmation, resolves eligible recipients, and reuses the native effect tray plus Undo helper.

The classification helpers are `isHuntersMarkActivity`, `isBardicInspireActivity`, `isMirrorImageActivity`, `teamTacticsActivity`, `healingBuffActivity`, `manualBuffChoice`, and `eligibleBuffActivity`. These encode specific exceptions; do not replace them with “any utility effect is a friendly buff.” Some actions need a manual choice or dedicated offensive workflow.

Special paths include single-target Hunter's Mark/Path to the Grave, Bardic grant handling, self effects, and healing-associated effects after a completed initial healing roll. Requests normally originate from the message author and route to the active GM, whose handler checks authorship and source-actor ownership. Local player application rejects unowned recipients.

On success it records `buffAutoApplied` and emits `ugmuls55eAutomation.buffEffectsApplied`; Shield uses this kind of applied-effect boundary. `collapseAppliedBuffTray` adjusts presentation and reopens an explicitly undone effect tray when the reopening flags permit it. Rendering alone does not reapply the buff.

## 8. Undo effects without deleting a newer application

`effectUndoSources` groups the clicked HP card, its usage, and the particular attack when available. Non-HP cards use themselves. Explicit attack links take priority; the existing fallback uses source attacks preceding the HP card. That scope locates effect records, not unrelated matching names elsewhere in chat.

`undoCardEffects` marks the usage as manual and processes each source's history in reverse order. Before changing an effect, it checks this exact identity:

```js
if(effect.system?.origin?.message!==record.sourceMessage) {
    ui.notifications.warn("An effect was refreshed by another card; its newer application was kept.");
} else if(record.before) {
```

If the current effect belongs to another message, it is preserved. If it still belongs to this application and a prior snapshot exists, the snapshot is restored with controlled update options; otherwise the new effect is deleted. Missing effects also have their completed history entries removed. The record is consumed even when a newer application was preserved: Undo is not repeatedly trying to delete that newer effect.

After processing, the usage's applied flags are cleared and `effectApplyReopened` is set; there is additional handling for supported searing-blind records. Effect Undo does not restore HP, erase another card's later effect, or reverse every feature-specific resource use.

### Manual effect Apply is recorded too

`manualSaveEffectAllowed` filters Region-managed effects and, for saves, limits application to recorded recipients with a qualifying completed outcome. Multiple linked tokens for one Actor can supply a qualifying outcome. It rejects pending/unsuitable saves and unrecorded recipients.

`applyManualEffectsWithUndo` temporarily intercepts native effect preparation to validate each operation and capture prior snapshots. After native application, it identifies resulting effects and submits records. Its `finally` restores the tray's original preparation method/effect array.

`storeReappliedEffectUndo` validates active user, current effect/message origin, parent ownership for players, and matching prior snapshot ID before accepting records. Reapplication sets the applied flag again, so it can lock corrections until another appropriate Undo.

## 9. Apply effects again without replaying damage

The [hit-effect helper](../../scripts/hit-effect-reapply.js) connects actual HP recipients to the native attack/save effects. It validates recorded hits/outcomes, policy, actor ownership, and existing equivalent/Region-owned effects, then records new Undo history.

`reapplyHitEffectsAfterDamage` is called after the shared HP-history queue has committed. Its source comment explains why: calling effect-history writes while holding the same queue could wait on itself. Ordering asynchronous work is therefore part of correctness, not only performance.

For damaging attacks, intended effect recipients can be recorded before application so a failed effect can be retried separately. The manual **Apply Effects** control and supported post-damage path can restore eligible effects while keeping HP unchanged. Partial recipient application must not grant effects to another recipient whose HP was not applied in that operation.

If the follow-up effect phase fails, its handler reopens effect application, marks manual state, and reports that damage was already applied. It does not rerun HP to recover an effect. This is an important boundary for both testing and user expectations.

## 10. History flags, controls, and authority

| State | Meaning to preserve |
| --- | --- |
| `damageUndoHistory` | Per-application Actor/HP changes and supported feature metadata. |
| `hpApplicationRecorded` | HP application occurred, even if a cap caused no numerical change. |
| `automaticDamageDone` / `automaticDamageTargets` | Early automatic claim versus actually completed Token UUIDs. They are not interchangeable. |
| `effectUndoHistory` | Applied effect UUID, source message, prior snapshot, and optional replacement metadata. |
| `automaticEffectApplications` | Token/effect processing keys used for idempotency and supported reapplication. |
| `outcomeEffectsApplied`, `buffAutoApplied` | Processed effect state relevant to controls/locks. |
| `damageApplyReopened`, `effectApplyReopened` | Presentation/workflow signals for explicit Apply after Undo. |
| `manualDamageWorkflow`, `manualEffectDecision` | Do not silently resume generic automatic handling. |

`addDamageUndoButton` and `addEffectUndoButton` provide visible GM controls for supported standalone/grouped cards, avoid duplicate buttons, and prefer the appropriate damage-card location where available. The effect button's current type gate is usage/attack/damage/healing; its nearby comment should not be read as generic support for every standalone save-card type.

`refreshHpUndoCard` and `refreshEffectActions` currently perform direct targeted chat updates. This guide describes that existing implementation; it does not convert those calls into deferred refreshes. The shared-card update hooks additionally refresh related correction controls. Never cache a permanent lock answer while history is changing.

Actual Undo functions check GM status; their socket handlers route to the active GM and require a GM requesting user. Local queues serialize cooperating tasks per module instance, not arbitrary Actor edits by every client. The proposed review in [IMP-008](../improvement-notes/IMP-008-application-history-boundaries.md) records durability and recovery questions without claiming transaction guarantees.

## 11. Function reference

| Module | Public helpers and entry points |
| --- | --- |
| Automatic application | `autoApplyHpEnabled`, `shouldAutoRollNpc`, `manualKey`, `readyDamageTargets`, `automaticHitStillValid`, `applyAutomaticDamage`, `waitForDamageAnimation`, `waitForWorkflowAnimations`, `applyOutcomeEffects`, `stopAutomaticDamage`. |
| Buffs | Classification functions listed above; `applyBuffEffects`, `collapseAppliedBuffTray`. |
| Effect history | `applyEffectWithUndo`, `applyConditionWithUndo`, `effectUndoSources`, `undoCardEffects`, `addEffectUndoButton`, `storeReappliedEffectUndo`, `manualSaveEffectAllowed`, `applyManualEffectsWithUndo`. |
| HP history | `captureDamageUndo`, `damageUndoRecord`, `captureAppliedHpUndo`, `storeManualHpApplication`, `applyManualHpWithUndo`, `undoCardDamage`, `addDamageUndoButton`. |
| Global bridges | `Ugmuls55eAutomationNpcDamage` exposes NPC eligibility, animation waits, and reactive resume; `Ugmuls55eAutomationEffectUndo` exposes native effect/condition application with history; `Ugmuls55eAutomationHitEffects.afterDamage` links HP recipients to effects. |

Useful hook landmarks are message create/update/render scheduling, `dnd5e.preApplyDamage` for guards/before-state, `dnd5e.applyDamage` for actual recipient/after-state, and native tray wrappers installed at `ready`. Mutation workflows have authority/idempotency checks; do not write/apply state merely because a renderer was called.

## 12. Verification and planned in-game checks

Reviewed local fixture sources include `arcane-ward.test.mjs`, `manual-save-effects.test.mjs`, `native-condition-undo.test.mjs`, `hit-effect-damage-timing.test.mjs`, `hit-effect-reapply.test.mjs`, and `reactive-npc-gate.test.mjs`. They exercise real source functions with native operations/permissions partly mocked. They do not establish every application/history failure boundary or live multiplayer timing.

On **2026-11-09**, this targeted run passed: **16 files, 0 failed**. Filters select filename substrings, including related animation-wait fixtures.

```text
node tools/run-tests.mjs --filter arcane-ward --filter manual-save-effects --filter native-condition-undo --filter hit-effect-damage-timing --filter hit-effect-reapply --filter reactive-npc-gate --filter effect-automation-policy --filter region-card-effects --filter per-attack-damage-automation --filter multi-target-buff --filter healing-buff-effect --filter separate-auto-healing --filter roll-adjustment-lock --filter bardic-grant-replacement --filter animation-wait
```

Documentation checks verified local guide/notes links, all four JavaScript excerpts against the current source ignoring whitespace, and inclusion of all 34 exported names across the three primary files. The full runtime suite was not rerun for this documentation-only pass. Local tests/tools remain Git-ignored; no new in-game checks were performed.

For future shared changes, plan these checks:

| Scenario | Expected preservation | Status this pass |
| --- | --- | --- |
| Resistant/immune target, mixed damage types, successful/failed/pending saves | Native calculations and outcomes; no assumed failed save; only recorded eligible recipients. | Not run |
| Damage into temp HP, later healing/temp HP, then Undo; repeat with capped healing | Recorded delta restoration with current caps/temp-HP policy; no original-dice reroll. | Not run |
| Two attacks under one usage; partial application and partial/complete Undo | Correct attack/recipient scope; remaining history keeps relevant locks. | Not run |
| Apply effect, refresh from another card, Undo the older application | Newer effect is kept; no unrelated Actor effect is deleted. | Not run |
| Apply/Undo/reapply a native condition and a save-only effect | Correct snapshot, record, source identity, reopened controls, and relocking after reapplication. | Not run |
| Apply HP successfully, then fail its hit effect; retry Apply Effects | HP remains applied once; effect retry gets its own Undo history. | Not run |
| One recipient reapplies while another remains pending | No unrelated target gets an effect; the remaining opportunity is preserved. | Not run |
| Region-managed effect overlaps a card effect; manual effect choice/Legendary Resistance | No duplicate application or false generic takeover; native effect choice/profile preserved. | Not run |
| Player manually applies to an owned actor; GM records and Undoes | Correct permissions, history, and manual-workflow protection across clients. | Not run |
| Hidden/unfocused GM or a disconnected/unresponsive animation participant | Supported background/disconnection behavior; failures leave remaining work manual, not silently applied early. | Not run |

Record actual settings, source/recipient identity, before/after resources, remaining history, and client roles. These are regression plans, not newly observed failures. No new in-game verification or performance measurements are claimed.
