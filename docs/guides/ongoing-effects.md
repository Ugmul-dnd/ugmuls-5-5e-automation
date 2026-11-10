# Ongoing effects

[Guide index](README.md) · [Results and Undo](applying-results-and-undo.md) · [Save/damage prompting](save-and-damage-prompting.md)

An ongoing effect has more than one possible lifetime: its native duration, a repeat-save/damage workflow, its relationship to a Region or concentration, and eventual cleanup of inactive copies. Those responsibilities live in different scripts.

**Source reviewed:** 2026-11-10, `v1.0.1-dev`. This guide documents shared connections; it does not rewrite runtime code or cover every individual spell's expiry handler.

## 1. Separate the lifecycles first

| Thing being tracked | Main source | What ends or changes it |
| --- | --- | --- |
| Creature-attached repeat save/damage/healing | [recurring-effects.js](../../scripts/recurring-effects.js) with recipes from [trigger-library.js](../../scripts/trigger-library.js) | Recipe event/outcome, active-effect state, and matching application identity. |
| Conditions maintained inside a Region | [region-conditions.js](../../scripts/region-conditions.js) | Membership, behavior activation, or deletion; remove only that Region's flagged copies. |
| Native apply-effect Region behavior | [region-effect-authority.js](../../scripts/region-effect-authority.js) | Native behavior manages application/removal; the adapter chooses the writing client. |
| Regions tied to concentration | [concentration-cleanup.js](../../scripts/concentration-cleanup.js) | Native concentration ending, routed to the active GM when required. |
| Targeting-only area | [instant-region-cleanup.js](../../scripts/instant-region-cleanup.js) | Eligible caster turn end, without changing the creature effect's duration. |
| Inactive applied-effect leftovers | [inactive-effect-cleanup.js](../../scripts/inactive-effect-cleanup.js) | Owner's cleanup command or native-first post-combat cleanup. |

The first five files are manifest-loaded. Inactive cleanup is imported by the [main automation script](../../scripts/ugmuls-5-5e-automation.js).

**Deleting a targeting Region, ending a creature's condition, stopping repeat prompts, and ending concentration are separate actions.** A recipe can connect them, but their names alone do not make them equivalent.

## 2. Register an applied effect against a recipe

The creature workflow begins with a native applied `ActiveEffect`. At `ready`, `recurring-effects.js` listens to effect creation/update and calls `registerNativeEffect`. Certain feature handlers also explicitly call the exposed `Ugmuls55eAutomationRecurring.registerRecurringEffect`, including Smite and Beguiling integrations.

`triggerKeyForSpell` identifies a matching recipe using source identity, effect name, and applicable activity/source restrictions. `triggerEntry` combines built-in defaults with overrides, or reads a custom entry. This is the creature-attached Trigger Library, distinct from the Region recipes described in [Region library](region-library.md).

`registerRecurringEffect` requires the enabled recipe and expected effect name, records the configured DC where relevant, and prefers an owned source Item. `hasExternalTurnAutomation` avoids taking over effects whose changes advertise OverTime, supported macro keys, or on-turn automation. That is a specific key-pattern check, not comprehensive detection of every other module.

### The application record is the connection

| Stored state | Meaning |
| --- | --- |
| Effect flag `recurringEffect` | Recipe key, random application `instance`, source spell/caster/token, cast level, recorded DC, source card, Region/concentration references, and optional healing/escape data. |
| Effect flag `recurringLastTrigger` | Combat/round/turn/event receipt used to avoid repeating that turn's trigger. |
| Effect flags `recurringOneShotCard`, `recurringPaused` | One-shot/single-save publication and deliberate stopping of repeat prompts. |
| Card flag `recurringTrigger` | Effect UUID, application instance, event stamp, phase, and recipe key for this follow-up. |
| Card flags `recurringSaveCard`, `recurringDamageCard` | Link/progress marker for the next phase, including an explicit no-follow-up marker where applicable. |
| Local `running`, `opened`, damage queues/receipts | In-flight/publication guards on the executing client, separate from persisted flags. |

The instance matters when an effect is refreshed or reapplied. A result from an older application must not delete or advance a newer one simply because the effect UUID/name matches.

Excerpt from `recurring-effects.js`, in `advanceRecurringCard`:

```js
 const record=effect.getFlag(ID,"recurringEffect");if(!record||record.instance!==link.instance||running.has(usage.id))return;
```

`!==` means strictly different. `||` means any listed reason is enough to stop. Here, a missing record, different application instance, or already-running usage prevents continuation.

### Recovering a source without borrowing another caster's Item

`resolveRecurringSource` first resolves the recorded Item. Recovery can consult the originating card, selected Smite references, owned items, or a unique matching recipe on the recorded caster. It rejects cross-caster and ambiguous duplicate matches. A safe recorded snapshot can remain a fallback when the owned source is gone.

When recovery finds a stable owned Item, it repairs the source reference on the effect while retaining the application information. Deleting old chat is therefore not identical to losing every recurring source, but recovery is not guaranteed for an ambiguous or unavailable source.

### Fresh copies and specialized preparation

The pre-create helpers affect the newly applied copy:

- `prepareMonsterRepeatEffect` resets the supported copy's clock/expired flag; recipes can explicitly keep it until concentration ends.
- `prepareDelayedEffect` removes a one-shot copy's ordinary duration deadline so its delayed workflow can finish.
- `preparePhantasmalEffect`, `weirdEffectUpdates`, and `prepareWeirdEffect` handle specific native change/status/source requirements. They are specialized code living alongside the shared engine, rather than universal condition rules.
- `registerGrappleEscape` records the original grappler/DC for supported Grappled effects. `delayedTargetQualifies` checks the required original hit or failed-save outcome for one-shot registration.

The normal effect update hook registers/reconciles provenance; it is not a general instruction to revive expired effects. Startup recovery is also selective: the current ready pass repairs supported Weird data and registers named Beguiling effects, rather than registering every historical effect indiscriminately.

## 3. Trigger once for the relevant event

`processRecurringTurn` runs on the authoritative GM for started combat updates involving turn/round/start. It considers the incoming combatant's turn start and, when applicable, the previous combatant's turn end.

Enabled custom source-turn recipes add a source-based path. The processor first checks whether the source combatant has a matching item/recipe before inspecting other combatants' effects; it then filters by recorded caster and source token. This is different from an independent world scan on every feature hook. Other specialized source-turn systems can live elsewhere, such as [monster-source-turn-damage.js](../../scripts/monster-source-turn-damage.js).

For each matching active effect, the processor checks recipe event, pause/one-shot state, group receipts, the stored turn stamp, and local `running`. It records the stamp before creating the card. Missing-card/error paths clear that stamp; `finally` releases the local guard. Grouping can give one save per cast/source/turn across multiple related effects.

These checks suppress repeated handling of the same recorded event; they are not a general combat rewind policy or an exactly-once transaction across all clients and server restarts.

Damage-triggered saves use another entry path:

1. `onRecurringDamageApplied` responds to positive finite native applied damage and ignores `rsaUndoDamage`.
2. It executes locally on the authority or sends an owner request to the active GM. `receiveRecurringDamage` checks destination, requester, ownership, amount, and event ID.
3. `processRecurringDamage` captures eligible effect instances, deduplicates actor/event pairs, queues by Actor, waits for applicable workflow animations, then rechecks activity and instance before creating cards.

The damage-event receipt set is local and bounded to 500 entries. It is not a permanent history proving that every report from different clients represents a unique hit. This path reacts to damage application, not merely a visible damage total.

## 4. Build a follow-up through native activities

`createRecurringCard` is the private bridge from the applied effect to native activity use. It resolves the source, prepares a disposable helper Item, creates a recorded target descriptor, and attaches the application link. Some recipes additionally require the recorded source token to remain alive in the same scene.

| Builder/helper | Purpose |
| --- | --- |
| `buildRecurringItem` | Select the configured source damage/save Activity and adapt its copy for this follow-up. |
| `buildSyntheticSaveItem` | Supply a configured synthetic save when the native source lacks that particular activity. |
| `buildGrappleEscapeItem`, `buildEscapeCheckItem` | Build supported save/check escape variants with recorded DC and skills. |
| `recurringHealingAmount`, `buildRecurringHealingItem` | Record a fixed/caster-modifier amount and create the corresponding native healing/temporary-HP activity. |

The helper use passes `consume: false`, does not begin another concentration effect or template, and disables automatic subsequent actions for explicit sequencing. Relevant builders strip effects/consumption from follow-up copies so they do not reapply the original condition or spend source resources. Original source Items remain intact.

Native damage and cast scaling remain the default; explicit recipe damage formulas/type fallbacks are supported exceptions. Persistent casting choices can carry forward, but the inherited Metamagic data clears Careful Spell's initial-save targets so they do not become automatic successes on every repeat save. Save-only/selected damage clones silence AutoAnimations recognition where configured.

Recurring healing uses a recorded amount and the existing healing workflow. It does not invent a second HP calculator; native application handles maximum HP and temporary-HP replacement behavior.

## 5. Advance phases, rather than rerunning the original cast

Creation/update chat hooks call `advanceRecurringCard`. They schedule `promptRecurringDamage` for recurring damage usages; this chooses the responsible source Actor's user and opens the existing damage-dialog workflow with explicit origin/targets. Its local `opened` guard prevents reopening from every update.

| Recipe/path | Current continuation |
| --- | --- |
| Damage first | Wait for evaluated, non-pending damage and workflow animations, then create the supported follow-up save or mark that none is required. |
| Save first | A recorded failure can create the linked damage phase after animation and fresh instance/outcome checks. |
| End on success | After the successful outcome/animations, remove the matching active effect, or configured related save-group effects. |
| One-shot damage | The applicable completed damage-roll path can remove the effect without a repeat save. |
| Concentration-ending escape | Only the recipe's explicit option ends the recorded concentration, after verifying its parent caster. |

“Damage first” here advances from the **finished damage roll**, not proof of HP application. HP automation and Undo remain separate workflows. A recorded save result is likewise distinct from table-managed consequences.

### Manual, conditional, and prompt-only recipes

`renderRecurringCondition` renders controls on standalone and grouped entries, removing its previous markup before rebuilding. It does not create the repeat result merely because a card renders.

`canUseRecurringAction` allows the GM or target Actor's owner. `releaseManualRecurringSave` routes owner requests to the GM; `receiveRecurringAction` validates requester/target ownership. Supported action saves move from `manual` to `save`; check phases delegate to the [escape-check prompting workflow](save-and-damage-prompting.md). A label saying “Use action” is not a generic resource-spending implementation in this file.

For a GM line-of-sight condition, `resolveRecurringCondition` moves the phase to `save` or `skipped` and dispatches only when eligible. The GM makes that decision; the label does not promise automatic sight calculation.

Prompt-only recipes retain table-managed outcomes. `pauseRecurringSaves` marks the matching manual group paused; **it stops future prompts without disabling or deleting the condition**. Single-save recipes and shared save groups have their own receipts. A successful save does not imply automatic removal when `endOnSuccess` is false.

## 6. Region conditions own their copies

`syncRegionConditions` serializes requests per Region and runs on the active GM. It builds an actor set from world Actors plus that scene's token Actors, computes eligible/disposition-filtered membership, and finds effects carrying this exact `conditionRegion` UUID.

Wanted status IDs are created from native status effects. Their fixed source ID is removed so the Region gets its own applied copy, flagged with `conditionRegion` and `conditionId`. Obsolete copies are deleted in a batch per Actor. Another Region's copy or an unrelated manually applied condition is outside that deletion scope.

Membership is Actor-based: multiple tokens of the same linked Actor can keep that Actor inside while any eligible token remains. Synthetic/unlinked Actors are included through the scene tokens. This is an intentional identity boundary to understand before proposing token-based consolidation.

Enter/exit and behavior activation/deactivation call synchronization. Creation attaches configured behavior; canvas readiness reconciles existing behaviors; Region/behavior deletion removes its owned copies. The current reconciliation inspects the actor set for the Region; it is not an indexed per-token-only mutation path or a measured performance guarantee.

`managedRegionEffect` / `installRegionEffectAuthority` address another Region path: native `dnd5e.applyActiveEffect` behaviors recognized by a managed flag or recipe/name match. The adapter permits managed event/update mutations only on the authority and invokes native events with the GM as `event.user`, satisfying native self-user checks. Unmanaged behaviors keep their native handler. It changes writing authority, not native effect contents.

## 7. Concentration, area cleanup, and inactive cleanup

### Concentration ending

`concentration-cleanup.js` listens to native concentration hooks. For a non-GM ending concentration associated with Regions, it requests an active-GM operation and cancels the local attempt. Without an active GM it warns rather than attempting unauthorized Region deletion.

The receiver validates the active user, Actor ownership, actual concentration effect, and matching Regions before calling native `actor.endConcentration(effect)`. The end hook then batches matching Region IDs per scene for deletion. **Matching uses the concentration effect's stored source Item UUID**, not the recurring application instance. This is a separate cleanup identity; multi-instance behavior should be established before changing it.

[concentration-checks.js](../../scripts/concentration-checks.js), [wild-shape-concentration.js](../../scripts/wild-shape-concentration.js), and [summon-concentration.js](../../scripts/summon-concentration.js) handle additional checks/form/dependency concerns. This guide does not replace a full walkthrough of those protocols or native dependent-document deletion.

### Targeting-only Regions

`shouldCleanInstantRegion`, `trackInstantRegion`, and `cleanupInstantRegions` distinguish targeting guides from ongoing areas. Configured triggers, Region effects, or Region conditions protect ongoing Regions. Certain recipes explicitly permit caster-turn-end targeting cleanup without changing the spell's native duration or concentration.

Tracking records combat/caster/item/activity identity. Cleanup requires an actual forward turn transition, checks the ended caster token and current configuration again, and batches Region deletions. Without a matching combat turn there is no automatic deadline. The `cleanupTargetingRegions` setting defaults to true. Specialized exceptions remain in their own handlers.

### Inactive leftovers

`inactiveEffect` recognizes disabled, inactive, and native expired states. `protectedFeatureEffect` protects Item effects, transferred grants, enchantments, supported owned feature sources, and certain persistent source-less stat effects. A temporary Starry Form application has an explicit exception so an inactive applied buff can be cleared without deleting its native grant.

`inactiveCleanupCandidates` resolves provenance and filters candidates. `promptClearInactiveEffects` shows an owner's preview. `clearInactiveEffects` serializes by Actor, optionally limits deletion to previewed IDs, and checks that each candidate is still the same current inactive document before deleting. A canceled preview does nothing; a reactivated effect or an effect added after the preview is preserved by this path.

`addInactiveEffectMenu` and `addLegacyInactiveEffectMenu` attach the command to supported owner sheets. `installCombatEffectCleanup` wraps native Combat `_onExit`, waits for native expiry/dependency cleanup, and then clears remaining eligible inactive applications once per Actor on the active GM. Removing a combatant while that Combat still exists does not trigger this end-of-combat cleanup. `cleanupInactiveCombatEffects` defaults to true.

Clearing leftover documents is not Undo: it does not reverse HP, refund a slot, or reconstruct an earlier effect application.

## Evidence and future checks

**Automated checks, 2026-11-10:** 15 selected local test files passed:

```text
node tools/run-tests.mjs --filter recurring --filter prompt-only-spells --filter region-effect-authority --filter inactive-effect-cleanup --filter targeting-region-cleanup --filter region-card-effects --filter trigger-library-editor --filter concentration-checks --filter wild-shape-concentration --filter summon-concentration --filter monster-source-turn-damage
```

These cover representative recurring registration/source recovery, turn/damage/healing phases, native monster fixtures, custom source-turn recipes, prompt-only/group behavior, Region authority, targeting-only cleanup, inactive cleanup protections, and adjacent concentration/form/summon paths. They use local mocks/fixtures; the filter names and passing adjacent concentration tests do not establish direct coverage of every hook in `concentration-cleanup.js` or `region-conditions.js`.

No new direct reconciliation/failure tests, full-suite run, or in-game checks were performed. Tests/tools remain local and ignored. Future lifecycle questions are recorded in [IMP-017](../improvement-notes/IMP-017-ongoing-effect-lifecycle.md).

These Foundry scenarios remain **not run in this pass**:

- [ ] Apply native effects with repeat saves, damage-first, save-first, and recurring healing; verify recorded source/DC/level and no repeated slot/resource/effect application.
- [ ] Deliver repeated turn updates, advance rounds, rewind, reload, and switch active GM; inspect receipts and publication counts separately.
- [ ] Reapply an effect while its old save/damage dialog is open; verify old results cannot remove/advance the newer application.
- [ ] Compare damage-taken saves with damage rolls, temporary HP, Undo, and multiple client reports.
- [ ] Compare automatic saves, optional action checks, GM sight decisions, one-shot saves, and “Stop repeat saves”; inspect the condition separately from prompt state.
- [ ] Overlap two Regions plus a manual condition; enter/exit/deactivate/delete each and inspect only its owned copies, including linked and unlinked tokens.
- [ ] End concentration as owner/GM with and without an active GM; check multiple scenes, source Item identity, Region dependents, Wild Shape, and summons.
- [ ] Remove targeting-only areas while repeat-save effects persist; confirm configured ongoing Regions survive.
- [ ] Preview/cancel cleanup, reactivate an effect during the dialog, end combat, and remove a combatant mid-combat; inspect persistent grants and active buffs.
- [ ] Inject source-resolution, publication, and deletion failures; establish recoverable current state before changing receipt or retry behavior.

Keep source review, mocked checks, and observed game results separate when recording any later cleanup.
