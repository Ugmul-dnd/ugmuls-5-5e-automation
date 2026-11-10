# Save and damage prompting: send the right dialog to the right user

[Guide index](README.md) · [Pending cards](pending-cast-and-damage.md) · [Region execution](main-automation.md) · [Application and Undo](applying-results-and-undo.md)

Source reviewed **2026-11-10**, `v1.0.1-dev`: [save-prompts.js](../../scripts/save-prompts.js), [spell-save-prompts.js](../../scripts/spell-save-prompts.js), [damage-prompts.js](../../scripts/damage-prompts.js), and [escape-check-prompts.js](../../scripts/escape-check-prompts.js). Excerpts match source expressions with whitespace expanded where helpful. Diagrams describe cooperating callbacks, not one synchronous procedure.

## Prompting is not applying a result

These files decide who should configure/roll, construct native roll inputs, and keep source/target identity intact. They do not generally subtract HP or resolve every resulting condition themselves.

There are three distinct routes:

| Request | Normal recipient | Result |
| --- | --- | --- |
| Save against a spell/feature/Region | An active non-GM owner of the affected actor, otherwise an appropriate GM | Native saving-throw card linked to the source usage. |
| Damage from an attack/save Activity | Normally the usage author; Region/shared damage favors the casting actor's active owner, with GM fallback and explicit feature exceptions | Native damage configuration/result with recorded targets and attack link. |
| Escape action check | The authorized user explicitly selected by the GM-side recurring workflow | Native skill check tied to an escape session; not an automatically rolled NPC save. |

A generic save-activity damage prompt can open after targets are confirmed, before all saves finish. HP application still waits for its required outcomes. Specialized redirected/poison damage paths have additional completed-save/failure gates. Do not read the option label “damage after save” as one universal requirement to wait for every save before opening any damage dialog.

## 1. Entry points: ordinary uses and Region events

```text
Ordinary Save Activity use
  -> spell-save-prompts schedules after a quiet target-update window
  -> promptCastSaves resolves recorded targets
  -> sendSavePrompt records request and routes it
  -> receiveSavePrompt validates -> actor.rollSavingThrow

Region trigger
  -> main engine calls promptTargetSave
  -> same shared send/receive save path

Published attack / supported save use
  -> damage-prompts checks recipient, state, and existing results
  -> native Damage action/configuration
  -> pending-damage publication when applicable

Recurring escape action
  -> active GM issues escape session
  -> receiveEscapeCheck -> optional skill choice -> actor.rollSkill
```

`spell-save-prompts.js` installs its own ready hooks. `save-prompts.js` instead exports `registerSavePromptHooks`, called by the main script during ready. That function installs the socket receiver, Magic Resistance integration, and global pending-save retry bridge. `damage-prompts.js` and `escape-check-prompts.js` install their own ready hooks and global bridges.

## 2. Select a save owner deterministically

`selectSaveUser` prefers active non-GM owners of the actor. A user whose assigned character matches the actor sorts first; remaining ties use user ID. A connected GM who initiated the prompt can be the GM fallback, otherwise use the active GM.

Its ordering excerpt is:

```js
owners.sort((a, b) => Number(b.character?.id === actor.id)
    - Number(a.character?.id === actor.id) || a.id.localeCompare(b.id));
return owners[0] ?? gm ?? null;
```

`Number(true)` is 1 and `Number(false)` is 0. The subtraction places matching characters first. `||` falls through to the ID comparison when that difference is zero. `??` falls back only when an entry is nullish.

A player-owned NPC can therefore route to its player rather than automatically to the GM. Several owners do not mean several identical prompts. This choice is different from automatically rolling the save: `shouldAutoRollNpc` in the application module has its own setting and owner checks.

## 3. Wait for ordinary cast targets, not for the user's entire dialog

`scheduleCastSaves` accepts Save Activities on spells, feats, or weapons whose usage message belongs to this author client and is not Region-triggered. It stores an Activity/message pair in `casts`, cancels an older timer, and schedules a 300 ms quiet window so asynchronous target updates can finish.

Target changes reschedule a known cast. The custom targets-confirmed event can schedule even without cached cast state, resolving the Activity from the message. An update tagged `rsaRetarget` clears a scheduled timer without requesting another automatic save: Retarget edits the record rather than silently rerolling it. Message deletion removes this module's timer/cast/sent-target state.

`promptCastSaves` checks its setting, target confirmation/cancellation, supported Activity and author, and specialized recurring/placement exclusions. A configured turn-only feat aura can skip initial saves because its Region events own those prompts. That aura check uses matching Activity names in the reviewed path, not the full stable-ID resolver used by the Region engine.

It resolves each recorded target Token UUID, with supported actor-token/unique-active-token fallbacks. Ambiguous or unavailable token identities are logged/skipped rather than borrowing current token selection. Ineligible resolved targets are removed from the recorded target list with a prune marker.

`sentTargets` tracks Token UUIDs already dispatched for that usage. The code adds a token before awaiting the shared sender. This prevents repeated scheduling from issuing duplicates; it is not a durable confirmation that the remote dialog was displayed or a save completed.

## 4. Record and send a save request

`promptTargetSave` is the Region-facing adapter. It skips pending confirmation, disabled prompting, movement-damage triggers, and non-Save Activities, then calls `sendSavePrompt`.

The shared sender excludes placement-only and selected recurring manual/check phases, rejects ineligible targets, and delegates specialized grapple/Majesty/Careful handling where configured. It selects the recipient and serializes adding the Token UUID to `requestedSaveTargets` before dispatch.

That flag means a save was **requested**, not that its outcome is failure. [card-presentation.js](../../scripts/card-presentation.js), in `showPendingSaves`, uses the requested list and outcomes/animation state to show a pending row and retry control.

The dispatch branch is:

```js
if (user.id === game.user.id) {
    // Do not block other Region events while the user decides how to roll.
    receiveSavePrompt(packet).catch(reportError);
} else game.socket.emit(`module.${MODULE_ID}`, packet);
```

The local receive call is intentionally not awaited here. The sender finishes after arranging the request rather than keeping the Region event queue occupied while someone decides how to roll. `.catch(reportError)` still reports a rejected local task.

Socket packets include source user, intended recipient, message ID, Token UUID, and prompt kind. No remote dialog should open solely because arbitrary text names a token: the receiver checks the documents and request context again.

## 5. Receive, validate, and build the native save

`receiveSavePrompt` validates setting and intended client, an active source, source GM/authorship or the supported requested-target owner retry, no existing outcome, eligible recorded recipient, local actor ownership, and the selected recipient/takeover identity. It excludes inappropriate placement/recurring phases and requires a native Save Activity with a usable ability and finite DC.

The ordinary path can defer to dedicated grapple/Majesty handling. Spell-prompt packets do not become a second Region prompt. Actor/source/token checks are part of the workflow; the browser's visible pending button alone is not authorization.

It resolves the Activity's save bonus with native formula data/parts and calls `actor.rollSavingThrow`, preserving the Activity's message sources and usage origin:

```js
const rolls=await actor.rollSavingThrow(config, positioned, { data: {
    speaker: ChatMessage.getSpeaker({ actor, scene: token.parent, token }),
    system: { ...activity.messageSources, origin: message.id }
} });
```

The speaker is the defender's recorded token, while origin links its result to the source usage. That lets native outcomes and the shared application workflow find the correct recipient. It does not associate saves by matching totals.

A per-message/token `prompted` Map uses a local `Symbol` identity to guard duplicate dialogs. Empty returned rolls or an exception release that attempt's guard only if it is still the current local symbol. A successful request remains guarded in this Map; this module does not install a general message-delete cleanup for `prompted`.

For automatic NPC saves, non-takeover requests can set `rsaAutoNpcSave` and skip configuration when the application helper permits it. Explicit pending-button takeover remains manual, even if the creature is an NPC.

## 6. Pending-save retry and cancellation

`repromptTargetSave` requires an eligible requested token, no outcome, and a GM or owner initiating it. It targets the clicking user, closes matching local dialogs through `cancelPendingSavePrompt`, broadcasts scoped cancellation, and receives the new retry locally.

`cancelPendingSavePrompt` validates the active source, requested token, unfinished outcome, and source ownership/GM status. It finds the deterministic dialog ID, closes matching applications, and removes the local duplicate guard. It does not undo a completed save.

Ordinary save retry uses requested-target/source/owner validation plus local dialog guards. It does not use the same persisted claim/finish nonce as pending damage or the explicit escape-result session below. Do not assume all three protocols have identical stale-result guarantees. Later lifecycle review is recorded in [IMP-014](../improvement-notes/IMP-014-save-request-lifecycle.md).

## 7. Magic Resistance recommends a mode without erasing disadvantage

`hasMagicResistance` recognizes the supported native identifier/name on a feat; `magicalSaveSource` recognizes spells or a magical Item property.

`registerMagicResistanceBridge` registers a universal save rule with Automated Conditions 5e when available. It checks the world option, magical/spell context, and the resolved subject actor. Successful active integration suppresses this module's fallback so two paths do not compete over the same default.

`magicResistanceSaveDefaults`, attached to `dnd5e.preRollSavingThrowV2`, is the fallback. It adds the advantage recommendation for a matching magical save while retaining existing disadvantage flags and setting normal mode when they cancel. It does not globally force advantage over another source of disadvantage. Preserve those relationships if reorganizing the prompt code.

## 8. Who rolls damage—and when?

`damagePromptRecipient` usually returns the usage author. For Region/shared-card paths, it uses the casting actor's owner/GM selection instead: a GM executing the Region Activity does not automatically mean the GM should see its damage configuration. Poison/redirect/rebuke paths have explicit routing exceptions for their source actor or recorded requesting user.

`promptDamage` checks the relevant hit/save prompt option, native damage parts, message existence, recipient client and Item ownership, confirmation state, and supported Activity rules. Empty shared areas return before consuming the opened guard, so their first real recorded recipient can later prompt damage.

For attacks it waits for the exact attack's animation and requires at least one eligible current hit or supported miss-damage exception. Specialized redirect/poison paths can wait for completed saves and at least one failure. Ordinary save-activity damage need not wait for all outcomes merely to open the configuration; native HP application later uses those outcomes.

After the wait it rechecks settings/message existence and existing completed damage. This prevents a second automatic prompt if someone already rolled while animation was playing. The current existing-damage test includes timestamp and Graze exceptions; it is not interchangeable with a pure exact-attack lookup for every unusual publication order.

`queued` prevents overlapping attempts while checking/waiting. `opened` records that automatic prompting began. `finally` releases `queued`; canceling a damage dialog does not universally erase `opened` for another automatic prompt. Native Damage/pending retry controls provide recovery as documented in the pending guide.

## 9. Preserve exact attack, target, speaker, and critical context

`attackCardForRolls` reads the published attack from the original roll's parent, checks author and Activity UUID, and returns that exact card. Equal totals from several attacks must not select a different attack.

`recordedAttackForDamage` prefers explicit `damageAttackId`, then a direct attack origin, then the latest associated attack matching the Activity UUID. The last option is a timestamp/order fallback, not the same strong identity as an explicit parent/link. `linkDamageAttack` records the chosen ID and that attack's targets before native damage configuration.

`preserveRollSpeaker` resolves a suitable token for the Activity's actor on the active Scene, preferring recorded/configured speaker, usage token, actor token, then a unique active-token fallback. It does not borrow an unrelated currently controlled token when identity is ambiguous.

`recommendAttackCritical` seeds the automatic prompt from a confirmed native critical unless criticals are disallowed. It also supplies the relevant AC5E base-critical state; downstream native/dialog conditions can still change critical handling. `prepareDamageCompatibility` only initializes missing nested options on existing active AC5E state and does not independently change roll modes/critical decisions.

`promptPublishedAttack` supplies the create/update publication path, and the post-roll hook supplies the original published-roll path. Both reach the same prompt guards. `turnOnlyAura` keeps the supported turn-event-only feat activation from prompting initial damage.

## 10. Use the native Damage action and a temporary listener

When available, `promptDamage` calls the Activity's native `onChatAction` for `rollDamage`, preserving usage consumption/scaling context. It installs a temporary `dnd5e.preRollDamageV2` hook scoped to the Activity UUID to configure the dialog and record source/targets/explicit attack link. It removes that hook on a matching use and again in `finally`:

```js
try {
    await activity.onChatAction(null, {dataset:{action:"rollDamage"},disabled:false}, message);
} finally {Hooks.off("dnd5e.preRollDamageV2",hook);}
```

`Hooks.on` returns the listener's handle; `Hooks.off` unregisters it. The `finally` prevents a leftover listener from configuring an unrelated later roll when the native action exits without reaching the expected event.

The fallback invokes `activity.rollDamage` with recorded ability/ammunition/mode/critical context and source/targets. General link hooks and native preparation still matter. Pending-damage handling can then publish/reuse its own placeholder and reject stale configuration.

Healing reuses its existing native dialog instead of opening a second one. The pre-damage hook can copy recorded usage recipients or build a self-target descriptor, while preserving dedicated independent-recipient exceptions such as Chalice. Prompt positioning can be enabled separately from automatic HP application.

## 11. The dialog wrapper is also a feature-integration pipeline

`configurePromptDialog` does much more than positioning. It chooses the supplied native/per-roll base class or a default D20/Damage class, then caches a subclass per kind/base using a `WeakMap`. A wrapper created for one transient base is not blindly reused for another actor's special class.

The subclass:

- Waits for pending-damage preparation and rejects stale damage submission.
- Exposes preview formulas and runs ordered feature finalizers on preview/submission.
- Calls feature controls/button preparations during render.
- Runs feature-specific commit/release callbacks during close, with explicit error-cleanup calls for supported resources.
- Remembers clamped dialog positions in a client setting through a serialized write chain.

`addDamageChoice` is the shared helper for inserting keyed choices, labeling/locking used resources, invoking the feature's change callback, and rebuilding the dialog. It does not itself authorize or spend that feature's resource.

The `rolls` getter can be read repeatedly for preview. `_rsaPreview` distinguishes formula rendering from final submission, and feature finalizers must avoid duplicate riders or preview spending. The preview getter and submission/close paths are not identical lists; some differences are intentional. This guide does not claim the wrapper automatically guarantees every feature's rollback/idempotency.

The returned configuration defaults to `configure:true`. Call sites that intend fast-forward behavior must preserve/restore their original `configure:false` as applicable; several hooks explicitly do so. The ordered feature pipeline and lifecycle coverage are recorded in [IMP-013](../improvement-notes/IMP-013-damage-dialog-pipeline.md) before any generic adapter cleanup.

`waitForAttackAnimation` waits for supported Dice So Nice completion, uses the shared background-safe helper when available, and removes its temporary completion listener in `finally`. This wait is not a timer waiting for someone to decide whether to use a Reaction.

## 12. Escape checks: an explicit action/session path

`promptEscapeCheck` runs on the active GM for a supported recurring `manualCheck`/`check` phase. It validates the current effect instance, target, requested user ownership, and absence of an outcome, then writes `escapeCheckSession` and changes the phase to `check`.

`receiveEscapeCheck` requires the intended client, matching persisted session/user/source, active-GM source, current effect instance/phase, and local actor ownership. It closes an older same-card dialog, optionally asks the user to choose an allowed skill, and rechecks relevant state after that choice.

It calls `actor.rollSkill` using the recorded DC, supported Athletics/Acrobatics ability mapping, optional disadvantage, and source card identity. It does not let the NPC auto-save option skip this action check. The result includes `escapeCheckResult:{card,session}`.

`validateEscapeCheckResult`, installed at `preCreateChatMessage`, rejects a marked result when its session/user no longer matches. Effect-instance and outcome checks also belong to the receiving/recurring workflows; this validator is not all possible escape validation by itself. `opened` holds sessions currently being handled and is released in `finally`.

[recurring-effects.js](../../scripts/recurring-effects.js) invokes the exposed escape prompt for appropriate recurring actions and owns later effect-resolution progression. Prompting alone does not delete the restrained/grappled effect.

## 13. Public function map

| Area | Exports |
| --- | --- |
| Save source/mode | `hasMagicResistance`, `magicalSaveSource`, `registerMagicResistanceBridge`, `magicResistanceSaveDefaults`; re-exported `isEligibleTarget` from shared helpers. |
| Save owner/send/receive | `selectSaveUser`, `sendSavePrompt`, `receiveSavePrompt`, `promptTargetSave`, `registerSavePromptHooks`. |
| Save lifecycle | `cancelPendingSavePrompt`, `repromptTargetSave`, `promptCastSaves`, `scheduleCastSaves`. |
| Dialog integration | `prepareDamageCompatibility`, `addDamageChoice`, `configurePromptDialog`, `waitForAttackAnimation`. |
| Damage identity/routing | `attackCardForRolls`, `recordedAttackForDamage`, `linkDamageAttack`, `preserveRollSpeaker`, `recommendAttackCritical`, `damagePromptRecipient`, `turnOnlyAura`, `promptPublishedAttack`, `promptDamage`. |
| Escape action | `promptEscapeCheck`, `receiveEscapeCheck`, `validateEscapeCheckResult`. |

Global bridges are `Ugmuls55eAutomationRepromptSave`, `Ugmuls55eAutomationDamage` (prompt/dialog/wait/choice helpers), and `Ugmuls55eAutomationEscapeChecks.prompt`. See each source's ready/registration block for hook and socket action names. There is no single universal “open any roll” protocol with identical authority/session semantics.

## 14. Verification and future in-game checks

Reviewed local fixture sources include `save-takeover.test.mjs`, `weapon-save-flow.test.mjs`, `fear-save-gate.test.mjs`, `region-damage-routing.test.mjs`, `escape-check-prompts.test.mjs`, `damage-configuration.test.mjs`, `damage-dialog-compatibility.test.mjs`, and `critical-damage-prompt.test.mjs`. They cover representative routing, pending registration, recurring-phase exclusions, retries, native source links, preview/choices, critical seeding, and escape session checks with mocks. They do not establish every Magic Resistance combination, feature finalizer, source fallback, or full two-client dialog race.

On **2026-11-10**, this targeted run passed: **12 files, 0 failed**.

```text
node tools/run-tests.mjs --filter save-takeover --filter weapon-save-flow --filter fear-save-gate --filter region-damage-routing --filter escape-check-prompts --filter damage-configuration --filter damage-dialog-compatibility --filter critical-damage-prompt --filter roll-speaker --filter pending-cast --filter pending-damage --filter automatic-healing
```

Documentation checks verified local guide/notes links, all four JavaScript excerpts against the source ignoring whitespace, all 29 exported function names across the four primary files, and the shared `isEligibleTarget` re-export. The full runtime suite was not rerun for this documentation-only change. Tests/tools remain local and ignored, and no new in-game checks were performed.

| Scenario for future shared changes | Observe | Status this pass |
| --- | --- | --- |
| Player-owned creature, multiple owners, NPC, and disconnected owner | One intended recipient; assigned-character preference and correct GM fallback. | Not run |
| Delayed target confirmation, new shared recipient, intentional Retarget | Prompt only when appropriate; no stale current-selection borrowing or automatic repeat after correction. | Not run |
| Cancel save, click pending as GM/owner, then attempt old result | Correct retry ownership, existing-outcome handling, and documented stale-result boundaries. | Not run |
| Magic Resistance with disadvantage, AC5E active/inactive | Normal cancellation preserved; no competing forced mode. | Not run |
| Repeated equal-total attacks, native critical/prohibited critical, ammunition and several tokens for one actor | Correct original attack/targets/speaker; native critical policy and no duplicate damage prompt. | Not run |
| Empty shared area gains its first target, then a pending damage dialog is retried | One correct owner dialog; same recorded recipients; existing result is not rolled again automatically. | Not run |
| Preview several riders, change choices, cancel, then submit | No preview spending/duplicate riders; correct feature-specific commit/refund and preserved base class. | Not run |
| Healing/self heal and independently selected Chalice recipient | Native dialog reused; correct recipient rather than source spell's default target. | Not run |
| Escape skill selection, cancel, stale session, changed effect instance | Manual check only for the current action/owner; no stale result resolving a newer effect. | Not run |

No new in-game verification, performance measurements, or runtime changes are claimed. Tests/tools are local and Git-ignored. For the next shared topic, target selection/confirmation/retargeting connects directly to these prompt gates.
