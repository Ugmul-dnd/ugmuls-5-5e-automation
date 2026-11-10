# Pending casts and damage: from unfinished action to committed result

[Guide index](README.md) · [Module map](module-map.md) · [Shared activity cards](shared-activity-card.md)

Source reviewed **2026-11-09**, `v1.0.1-dev`: [pending-cast.js](../../scripts/pending-cast.js) and [pending-damage.js](../../scripts/pending-damage.js). JavaScript excerpts reproduce source expressions with formatting expanded where helpful. The sequences are conceptual maps of cooperating hooks and methods, not one synchronous function.

## Why there are two workflows

A usage can exist before its targets, template, or first roll are finalized. Its damage/healing roll can also have a card before any dice have been submitted. These are different unfinished documents with different recovery rules.

| Question | Pending cast | Pending damage |
| --- | --- | --- |
| What is unfinished? | An owned spell/feature Activity use. | A particular damage/healing roll configuration. |
| Visible document | Early usage card, updated with native usage data. | Empty damage/healing card, later populated with native roll data. |
| Identity | `castSession` flag points to a local session state. | `pendingDamage` stores current session, user, and activity metadata on the roll card. |
| Typical cancellation | Before commitment, refund recorded costs and remove the early card. | No submitted rolls leaves the placeholder available to retry; a pending cast may separately be canceled. |
| Completion | Settle the usage and stop allowing its pending-cast refund. | Publish the completed rolls onto the same card and clear its pending state. |

Neither workflow applies HP merely because a card completes. HP application belongs to other workflows. Likewise, settling the cast does not mean that every later reaction, saving throw, or effect application is finished.

## 1. Follow the two cards

```text
Owned spell/feature use
  -> allocate local cast session
  -> publish usage U before native configuration/spending proceeds
  -> native consumption + target/template/roll preparation
     |-- cancel before a result: refund eligible recorded work, remove U
     `-- first completed result or supported no-roll completion: settle U

Damage/healing configuration linked to U
  -> publish or reuse empty roll card D
  -> user owns current session for D
     |-- no submitted rolls: D can remain pending for retry
     |-- another claim: old session cannot publish
     `-- valid completed roll: animate, update D, clear pendingDamage
                                  -> cast hook can settle U
```

A result can also be created directly without a pending damage card. Pending cast listens to both creation and update of result messages so either publication path can settle its origin.

For the preceding recipient/dialog decisions, see [Save and damage prompting](save-and-damage-prompting.md).

## 2. State: what persists and what stays in memory

Both files use the module namespace `ugmuls-5-5e-automation` for flags.

| Location | Important state | Purpose |
| --- | --- | --- |
| Usage-card flags | `castSession`, `pendingCast`, `targetsConfirmationPending` | Identify the cast and expose pending presentation/confirmation state. |
| Cast module's `sessions` Map | Activity, card, readiness Promise, tasks/refunds, consumption deltas, initial effects, previous concentration, committed/canceling state | Coordinate one pending use on the executing client. These are not all serialized into the card. |
| Roll-card flag `pendingDamage` | `session`, `userId`, `activityUuid`, ability, mode, ammunition UUID, critical state | Identify the current roll attempt and preserve configuration for retry. |
| Retry message data | `pendingDamageCard`, `pendingDamageSession` | Tell the next roll configuration to reuse the placeholder/session. These helper fields are removed from completed publication data. |
| Roll-card flags | `damageAttackId`, `pendingDamageAnimation` | Preserve the particular source attack and recognize already-handled animation data. |
| Damage module's `contexts` WeakMap | Message configuration object -> context containing card ID, session, dialog ID, readiness Promise | Associate a local dialog/publication with its attempt. Object identity is the key. |
| Damage module's `waiting` Map | Request ID -> Promise callbacks and timer | Match socket replies to outstanding requests. |
| Damage module's `serial` Promise | Previous operation's recovered chain | Serialize operations processed by that module instance. |

A `Map` can be explicitly enumerated and cleared by key. A `WeakMap` uses object keys without keeping those keys alive solely because they are in the map. A `WeakSet` tracks object identity without storing a value for each object. The cast module uses WeakSets to avoid wrapping the same prototype/activity repeatedly.

The cast's flags do not reconstruct its full local session after a browser reload. This source has no startup recovery pass rebuilding `sessions`. Damage retry is designed to read persisted placeholder metadata and create a new local context. Do not assume those recovery capabilities are interchangeable.

## 3. Pending cast: wrap the native use, preserve its work

### Installation and scope

`installPendingCast` walks up each configured Activity class's prototype chain to find the usage-message implementation. It remembers wrapped prototypes and replaces `use` with a wrapper that retains the original method.

The wrapper applies to owned, embedded spell/feat Items and the listed activity types: attack, save, damage, heal, check, and utility. It bypasses unsupported types, non-owned/non-embedded items, `message.create === false`, and module Region/rider-triggered messages. It does not intercept every weapon use merely because the module supports weapon automation elsewhere.

The actual scope guard is an early return to `original.call(...)`, not deletion of native behavior. `.call(this, ...)` runs the saved function with the current Activity as its `this` value.

### Publish before configuration and consumption

`preparePendingCast` finds the new session from message flags, remembers initial actor-effect IDs, and starts `publishPendingCast`. That function obtains native card data, sets pending flags, applies the roll mode, and creates one early card.

The native usage dialog is subclassed so it waits for publication:

```js
if(Dialog){dialog.applicationClass=class extends Dialog{
  static async create(...args){await state.ready;return super.create(...args);}
};}
```

`class extends Dialog` creates a subclass. `static` means the method is called on the class, `...args` collects/forwards its arguments, and `super.create` retains the parent's implementation. `await state.ready` orders this operation after publication without freezing the whole interface.

Private `wirePendingActivity` also wraps preparation, consumption, finalization, and message creation on the Activity instance. Scaling or a feature can rebuild the Activity; `rebindPendingActivity` and the scaling wrapper attach the same state to the replacement instance.

The native usage-message builder runs with creation disabled, and its data updates the early card instead of publishing another usage card. Recorded consumption deltas are retained for native refunds.

### Delay replacing old concentration until commitment

The consumption wrapper first lets native consumption validate its configuration. Only after that succeeds does it defer ending selected old concentration:

```js
if(result!==false&&config.concentration?.begin!==false&&config.concentration?.end){
  state.previousConcentration=config.concentration.end;
  config.concentration.end=false;
}
```

`!== false` is narrower than a truthiness test. Optional chaining allows `concentration` to be absent. The selected replacement is available during native validation, but ending it is postponed so canceling the new cast can preserve the old concentration.

### Settlement is a specific boundary

`settlePendingCast` marks the session committed, ends deferred previous concentration if any, clears `pendingCast`, and deletes the local session. It does not consume a second spell slot.

The `ready` listeners arrange settlement when:

- A created/updated message has rolls and is no longer `pendingDamage`, and its origin has a local cast session.
- A supported utility has no initial roll, or a supported placement-only Region use has templates, and required target confirmation is complete.
- The custom target-confirmed event completes such a no-initial-roll use.
- Another workflow invokes the exposed `commit` entry point. That entry point declines to settle a session already canceling.

An empty roll card is insufficient. A card with dice but a still-present pending-damage flag is also insufficient. This prevents placeholder publication from prematurely consuming the opportunity to cancel.

### Cancellation before commitment

`cancelPendingCast` returns false for a missing/committed session and shares the existing cancellation Promise when already canceling. After readiness, it checks associated attack/save/damage/healing/check messages for actual rolls. If a result exists, it settles instead of refunding.

Otherwise it:

1. Waits for registered tasks using `Promise.allSettled`.
2. Runs registered refund callbacks and refunds native consumption deltas.
3. Disables only markers belonging to this cast session or its usage card.
4. Deletes owned result templates and owned actor effects created by this use, preserving effect IDs present before the cast.
5. Deletes the early usage card and removes the session.

`Promise.allSettled` waits for both successful and rejected tasks; a rejected tracked task does not itself reject that waiting step. It does not automatically refund those tasks. Extensions must register appropriate refund work.

These operations are sequential cleanup, not an atomic database transaction. This function does not enumerate and delete every linked pending roll card, so do not read usage-card deletion as a blanket guarantee about all related placeholders. See the failure-recovery investigation linked below.

`pendingRollDialog` subclasses supported initial-roll dialogs: closing without `options.dnd5e.submitted` can cancel the still-uncommitted cast. Target-confirmation code can also request cancellation. The originating usage state therefore determines more than merely closing a damage dialog.

## 4. Pending damage: a card plus a replaceable session

### Start, reuse, or bypass

`startPendingDamage` is attached to `dnd5e.preRollDamageV2`. It skips fast-forward/unconfigured dialogs, disabled message creation, unevaluated previews (`config.evaluate === false`), missing Item subjects, and message objects with an existing context.

Its asynchronous `context.ready` either:

- Reuses the explicitly supplied retry card/session, checking they are current.
- Finds a compatible pending card under the origin, matching message type, Activity UUID, and attack link; claims it and closes stale dialogs.
- Creates an empty card with configuration metadata and a session/user assignment.

When no explicit attack ID is supplied, the implementation has a latest-associated-attack timestamp fallback while building the pending request. Preserve explicit `damageAttackId` links; the fallback is not a universal proof of source identity in every overlapping attack sequence.

Dialog preparation waits for `context.ready`. [damage-prompts.js](../../scripts/damage-prompts.js) calls `prepareDamageDialog` and checks `canSubmitDamage` before finalizing rolls. `pendingDamageCurrent` checks the live card's session and user against the local context/current user.

### Claiming makes an older dialog stale

The core branch in `damageOperation` is:

```js
if(action==="claim"){
    const next={...state,session:nonce(),userId:user.id};
    await card.setFlag(ID,"pendingDamage",next);return next;
}
if(action!=="finish"||state.session!==payload.session||state.userId!==user.id)
    throw Error("This damage prompt was replaced. Use the current pending card.");
```

The object spread preserves configuration fields while replacing session and user. A claim is a new attempt on the same card, not a second damage result. In the finish guard, `||` means any mismatch rejects the submission. The user must also pass `canRetryDamage`: GM or owner of the associated actor, with a still-pending card.

`retryPendingDamage` claims first, cancels stale dialogs locally and by socket notification, resolves the correct native Activity, and calls `rollDamage` again with the saved ability, ammunition, attack mode, and critical state. Claiming is not itself roll evaluation or HP application.

There are explicit source-activity branches for Chalice and Land's Aid healing. A grouped healing card can belong to a different Activity from its source spell's primary save/damage Activity; retry must preserve that distinction and its recorded recipient.

### Authority, serialization, and replies

Private `operate` handles a local request if there is no active GM or this user is the active GM, subject to its document-owner/GM gate and `damageOperation` permissions. Otherwise it emits `pendingDamageOperation` to the active GM.

The GM socket handler checks the action, destination and active-GM identity, requesting user's active state, then queues `damageOperation`. That operation checks permissions and the current session, message type/origin, and supplied rolls. It is validation of an authorized publication workflow, not a server-side independent recalculation of every submitted die.

A request ID correlates `pendingDamageReply` with callbacks in `waiting`. The current reply timers are 10 seconds for a claim and 45 seconds for finish. These are timeout/error handling, not polling or performance measurements. A timeout means the reply was not received in time; by itself it does not prove that no mutation occurred.

The recovered `serial` chain allows later queued operations after a rejected one, like the queue discussed in the shared-card guide. Direct exported `damageOperation` calls do not automatically enter that queue; its normal `operate`/socket callers provide the ordering.

## 5. Publish existing dice once, onto the existing card

`installPendingDamagePublication` wraps `DamageRoll.buildPost` once per installed class. Without a pending context it calls the original builder normally.

With a context, it waits for readiness and ignores empty rolls. It checks the session before preparation, invokes native message building with creation temporarily disabled, animates the evaluated dice if Dice So Nice is available, and checks the session again afterward. A session can change while animation is in progress.

Multiple evaluated damage rolls are pooled for one visual throw, while their typed results remain separate in the card data. This does not reroll them. The shared animation-wait helper is used when available; fallback handling differs for visible/hidden documents.

For a current attempt it requests `finish`. `damageOperation` coordinates workflow animations on the active GM, preserves the latest targets from the live placeholder or exact shared origin, and combines the incoming roll data with flags. Its relevant source line is:

```js
update.flags[ID]??={};
update.flags[ID].pendingDamageAnimation=damageAnimationSignature(data.rolls);
update.flags[ID].pendingDamage=null;
delete update.flags[ID].pendingDamageCard;
delete update.flags[ID].pendingDamageSession;
```

`??=` initializes the namespace only if nullish. `delete` removes temporary properties; setting `pendingDamage` to `null` explicitly clears pending status in the completed update.

The finished rolls and clearing flag travel together. Before that write commits, pre-update listeners still see the old card state. This is the boundary behind the [Fount pending-card fix](fount-of-moonlight.md): inspecting only the old flag would incorrectly treat the incoming result as unfinished.

During the write, `dice-so-nice.skip` prevents a second animation from the empty-to-populated card update. A `finally` restores its prior value. `damageAnimationSignature` and `skipPendingDamageReplay` also recognize an already-handled roll on receiving clients. The signature includes formula, total, terms, and relevant die-result state; appearance metadata alone does not define a new throw.

After successful finish, the publication wrapper assigns the existing card to `message.document` and the rolls' `parent`. Stale or failed attempts clear the outgoing rolls array with `splice(0)` so downstream code does not receive them as a successfully published result. This is different from deleting the already-persisted rolls of another attempt.

## 6. Rendering does not perform the operation

`renderPendingCast` hides native card buttons while pending and adds its preparation label once. `renderPendingDamage` handles standalone and inline grouped placeholders, keeps the native item header/properties, removes premature result/application controls, and adds a retry button gated by `canRetryDamage`.

Clicking that retry button starts the claim/roll workflow. Re-rendering the card alone does not claim a session, spend a resource, or evaluate dice.

`followResolvedPendingDamage` listens for the completion update: a clearing pending flag plus nonempty rolls. It invokes the chat-layout following helper for matching pending buttons on receiving clients. Claims or unrelated bookkeeping updates do not satisfy that completion test.

## 7. API and connection reference

| Cast export / exposed entry point | Responsibility |
| --- | --- |
| `castState` | Resolve a card's local cast state. |
| `publishPendingCast`, `preparePendingCast` | Publish and prepare the early usage card and native wrappers. |
| `rebindPendingActivity` | Attach a rebuilt Activity to the same state. |
| `trackCastTask` | Register asynchronous work to await during cancellation. |
| `settlePendingCast`, `cancelPendingCast` | Commit or attempt scoped cancellation/refund. |
| `installPendingCast` | Install eligible Activity-use wrappers. |
| `pendingRollDialog`, `renderPendingCast` | Initial-roll cancellation handling and pending presentation. |
| Global `Ugmuls55eAutomationPendingCast` | Exposes `cancel`, `rebind`, `commit`, `track`, and callback registration through `onCancel`. |

| Damage export / exposed entry point | Responsibility |
| --- | --- |
| `damageAnimationSignature`, `skipPendingDamageReplay` | Identify evaluated dice already animated. |
| `canRetryDamage`, `pendingDamageCurrent` | Permission/pending check and current-attempt identity check. |
| `damageOperation` | Validate and execute a claim or finish. |
| `startPendingDamage` | Prepare/reuse a placeholder and local context. |
| `prepareDamageDialog`, `canSubmitDamage` | Wait for preparation and reject stale submissions. |
| `cancelDamageDialog`, `retryPendingDamage` | Close stale dialogs and reopen the correct Activity. |
| `installPendingDamagePublication` | Wrap native roll publication while preserving the same card. |
| `renderPendingDamage`, `followResolvedPendingDamage` | Retry-button presentation and resolved-card layout following. |
| Global `Ugmuls55eAutomationPendingDamage` | Exposes dialog preparation, submission check, and `pendingCard(app)` lookup. |

Important callers include [area-target-confirmation.js](../../scripts/area-target-confirmation.js) for cast cancellation/commit, [reaction-tracker.js](../../scripts/reaction-tracker.js) for tracked reservation tasks, [damage-prompts.js](../../scripts/damage-prompts.js) for dialog integration, and [divine-reaper.js](../../scripts/divine-reaper.js) for rebuilt-Activity rebinding. Many damage features use `pendingCard` to find the correct card while their configuration dialog is open. This is a representative map, not a complete caller audit.

## 8. Verification and practical checks

Local sources reviewed: `pending-cast.test.mjs`, `pending-damage.test.mjs`, plus the Fount snapshot and shared-target fixtures discussed in earlier guides. They use Foundry mocks and some simplified native methods.

| Area | Behavior exercised in the reviewed local fixtures |
| --- | --- |
| Cast | Early publication, same-card reuse, dialog/template/first-roll cancellation, scoped markers/refunds, prior concentration validation/preservation, rebuilt activities, no-roll utilities and placement/confirmation, completed damage/healing update settlement. |
| Damage | Empty-card creation, retained retry opportunity, owner checks, claim takeover/stale rejection, same-card completion, animation sequencing/signatures, pooled animation with typed results, native Damage-button reuse, live shared recipients, Land's Aid/Chalice healing source preservation, resolved-card following. |

The fixtures do not constitute a real two-client socket round trip or a comprehensive fault-injection test of every awaited document operation. Error/recovery coverage questions are recorded in [IMP-003](../improvement-notes/IMP-003-pending-failure-recovery.md).

On **2026-11-09**, this targeted run passed: **4 files, 0 failed**.

```text
node tools/run-tests.mjs --filter pending-cast --filter pending-damage --filter shared-target-sync --filter fount-of-moonlight
```

Documentation checks verified all local Markdown links in the guide/notes folders, all four JavaScript excerpts against the source ignoring whitespace, and coverage of all 23 exported function names across the two files. This was a documentation-only change; the full runtime suite was not rerun, and no new in-game verification was performed.

Planned in-game checks for future changes:

| Scenario | What to observe | Status for this documentation pass |
| --- | --- | --- |
| Cancel initial use, placement, and first-roll configuration separately | Eligible costs are restored, unrelated markers/effects remain, and old concentration survives where the cast stayed uncommitted. Note which pending placeholders remain. | Not run |
| Finish the first roll; then close a later dialog | Committed usage is not refunded as an unused cast. | Not run |
| Player opens damage; GM/authorized owner takes over before submission and during animation | One placeholder is reused; stale attempts do not publish another result. | Not run |
| Add shared Region recipients while the damage dialog is open | The latest recorded recipients survive finish; dice and session relationships remain correct. | Not run |
| Retry critical damage with ammunition and multiple typed parts | Correct saved configuration, one visual throw where supported, separate typed results, no duplicate card. | Not run |
| Retry Land's Aid and Chalice healing | Correct healing Activity and recipient, not the origin's primary save/damage Activity. | Not run |
| Finish damage while an eligible Fount defender loses concentration from the hit | The captured offer survives and incoming HP automation continues. | Not run in this pass; earlier prompt appearance was user-confirmed |

Record settings, client roles, actual costs/effects, and the observed result. Visual dice timing is not a measurement of server CPU time. Guide creation does not imply a runtime change or newly verified in-game behavior.
