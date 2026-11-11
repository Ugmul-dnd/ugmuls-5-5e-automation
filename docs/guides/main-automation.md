# Main automation script: loading features and coordinating Regions

[Guide index](README.md) · [Module map](module-map.md) · [Source](../../scripts/ugmuls-5-5e-automation.js)

Source reviewed **2026-11-09**, `v1.0.1-dev`. This guide maps the current file's responsibilities, not every imported feature's internals. JavaScript excerpts match the source with formatting expanded where helpful. Diagrams and worked sequences are conceptual.

## Start with the two roles

The filename suggests the whole module lives here. In practice, this file both **loads many separate feature modules** and **implements the main configured Region activity/attachment workflow**. Other manifest entries and imported scripts provide additional automation.

A Region is a Scene document describing an area and its attached behaviors. Here, a behavior can call an Item's Activity when a token enters or reaches a configured turn event, or use native D&D5e Region effects while a creature is inside.

Read the file in these sections rather than starting at the top and treating every import as another step in a combat action:

| Source landmark | Responsibility |
| --- | --- |
| Opening imports | Load feature modules and shared library functions. |
| `MODULE_ID`, `SETTING_KEY`, histories, and `enqueueRegionEvent` | Namespace, configuration key, local runtime state, and event ordering. |
| `Hooks.once("init", ...)` | Register the Region save-prompt option and hidden spell-table setting. |
| `getOncePerTurnKey` | Build a target/trigger allowance identity for a combat turn. |
| `passesTargeting` | Evaluate the trigger's disposition policy. |
| `handleRegionEvent` | Capture event timing and queue execution. |
| `executeRegionEvent` | Validate, route, reuse/create activity cards, and restore temporary targets. |
| `globalThis.Ugmuls55eAutomation` | Expose `handleRegionEvent` to Region script behaviors and other modules. |
| Opening of `Hooks.once("ready", ...)` | Register movement/save helpers, visibility, initial shared cards, confirmed targets, combat cleanup, and damage-target merging. |
| Local `attachSpellRegions` inside `ready` | Build/update configured activity and native effect behaviors on Regions. |
| `canvasReady` and `createRegion` listeners | Run GM-side attachment for existing/new Regions. |

Use these names and section comments as search landmarks; line numbers move as features are added.

## 1. Imports are connections, not an execution checklist

For example:

```js
import "./fount-of-moonlight.js";
```

This evaluates a feature module so its top-level registrations are installed. It does not cast Fount or run its reaction immediately. JavaScript normally reuses the same module evaluation when other files import it too.

Named imports supply reusable functions. The Region engine imports card/queue helpers, movement accounting, effect resolution, native save prompting, and [region-library.js](../../scripts/region-library.js), which supplies current recipes and Activity resolution.

The `init` hook registers `promptForSaveOnRegionTriggers` and the hidden `spellTable` object. Runtime code calls `getRegionSpellTable()` rather than assuming that one raw stored setting is the complete effective recipe library.

The [Region library guide](region-library.md) follows those defaults, overrides, migration, and resolution rules in detail.

As of the 2026-11-10 diagnostic cleanup, fixed **v0.8.4** labels have been removed from the main header/startup messages. The Ready message reads the installed version from `game.modules.get(MODULE_ID).version`, with an `unknown` fallback. Spell Manager's old **v0.7.0** startup label was also removed. Check [module.json](../../module.json) for the manifest version and the working branch/changelog for development context: the installed manifest version does not identify every uncommitted development edit. The cleanup changed diagnostics only, not the engine structure.

## 2. The state this file owns

| State | Contents and lifetime |
| --- | --- |
| `sharedCardHistory` (`Map`) | Shared grouping key -> message ID, cached on this client. Lookup can fall back to the shared message index. |
| `pendingCastAllowances` (`Map`) | Usage message ID -> trigger registrations and captured combat event awaiting target confirmation. This is not the pending-cast module's session Map. |
| `oncePerTurnHistory` (`Set`) | Target/trigger/combat-turn keys already reserved or consumed on this client. |
| `enqueueRegionEvent` | Queue created by `createEventQueue`, shared here with movement hook registration. Serializes this client's queued work, not all clients or the server. |

The `deleteCombat` listener clears all three histories. This file does not implement a general persistence/reconstruction scheme for the per-target history, nor does it prune these entries at every turn change. New turn keys differ, making earlier entries no longer match that turn.

There are also persisted flags: Regions record source Item/caster references and caster user; shared messages record grouping keys; effect behaviors carry `managedRegionEffect`. Keep those persisted facts distinct from the local Maps/Sets.

## 3. How a Region calls back into the module

```text
createRegion / canvasReady (active GM)
  -> attachSpellRegions
  -> create executeScript Region behaviors
  -> Foundry emits a configured Region event
  -> behavior's script calls Ugmuls55eAutomation.handleRegionEvent
  -> queue -> executeRegionEvent
       |-- movement damage accounting
       |-- append recipient to shared card
       `-- use resolved native/temporary Activity -> prompt native save
```

The bridge exposed by this file is small:

```js
globalThis.Ugmuls55eAutomation = {
    handleRegionEvent
};
```

The object uses property shorthand: `handleRegionEvent` means `handleRegionEvent: handleRegionEvent`. `globalThis` makes it available outside the module's private scope. Being globally accessible is not itself permission to mutate documents; execution still checks its context and client role.

[conjure-animals-movement.js](../../scripts/conjure-animals-movement.js) also calls this entry point with its specific `conjuredAnimalsMove` event. The event API is therefore a connection point for both attached behaviors and a specialized movement producer.

## 4. Capture timing before waiting in the queue

`handleRegionEvent` captures combat, round, and turn from event data, falling back to current combat. It copies those values into the queued context:

```js
return enqueueRegionEvent(() => executeRegionEvent({ ...context, event }));
```

`...context` copies the context properties; the following `event` property replaces its old event. The arrow function delays calling `executeRegionEvent` until the queue reaches this task.

This matters if the turn advances while a preceding event is still awaiting an Activity or dialog. The queued event should retain its captured round/turn. The combat document itself remains an object reference; this is not a deep clone of all combat state.

The source comment gives two reasons for serialization: Activity use temporarily changes the executing user's targets, and two events must not independently create the same intended shared card on that client. A queue is not a substitute for client routing or persistent identity.

## 5. `executeRegionEvent`: the decision path

### Resolve target, source, recipe, and trigger

The event must provide a TokenDocument in `event.data.token`. A token explicitly excluded by Region flags is ignored. The current implementation requires its canvas Token object and applies `isEligibleTarget`, rejecting hidden/dead/defeated/zero-HP recipients under that helper's rules.

The source Item comes from `region.flags.dnd5e.item`. After resolving it, the engine reads its recipe from `getRegionSpellTable()[spell.name]`, requires enabled configuration, and finds a trigger with the supplied `triggerId`.

The Activity is resolved later through `resolveRegionTriggerActivity`, retaining configured/native source identity rather than inventing a new damage formula.

### Select the executing client

Normal non-movement Activity execution prefers the Region's recorded caster user when that user is active and owns the spell's actor. Otherwise it selects the active GM. Guardian Regions select the active GM because their behaviors contain GM-only script data. Movement accounting also has an explicit active-GM check before `recordMovementDamage`.

The current selection excerpt is:

```js
const executor = region.flags?.[MODULE_ID]?.guardianToken ? game.users?.activeGM
    : !trigger.movementDamage && casterCanUse ? casterUser : game.users?.activeGM;
if (executor ? executor.id !== game.user.id : !game.user.isGM) return;
```

This uses nested ternary expressions. Read it as: guardian -> active GM; otherwise ordinary trigger with an eligible caster -> caster; otherwise -> active GM. If an executor exists, other clients return. If none exists, this guard allows a GM client rather than an ordinary player.

GM-only Region setup is separate from who uses the Activity. Do not summarize the whole file as either “always runs on the GM” or “always runs on the caster.”

### Check event type and targeting

Movement-damage triggers use `MOVEMENT_EVENTS`. Other triggers use their configured event list, with a specific attached Conjure Animals movement exception.

For current-rules Conjure Animals, interior walking/leaving events are rejected, and a legacy movement-damage option is ignored for this save-based spell. The special pack movement path verifies the Region's attached pack reference against event data.

`passesTargeting` compares Token dispositions, not full player relationships or rules about hostility:

| Mode | Behavior |
| --- | --- |
| `everyone` | Accept. |
| `excludeFriendlies` | Without a resolved caster Token, accept. With one, reject self and matching disposition. |
| `friendliesOnly` | Require a caster Token and matching disposition; this comparison can include the caster. |
| `hostilesOnly` | Require a caster Token, reject self, and accept differing disposition, including neutral where it differs. |
| Unknown mode | Warn and reject. |

Here the caster is resolved from `region.flags.dnd5e.origin`, then its canvas `.object` is used. This is not the same resolution path as `resolveRegionCaster`, which is used during native effect setup. Missing or non-token origins can therefore affect these targeting modes differently.

### Apply the per-target turn limiter

`getOncePerTurnKey` uses event combat/round/turn with current-combat fallbacks. It returns `null` without combat or usable turn timing. The identity fields are:

```js
return [
    combat.id,
    round,
    turn,
    targetToken.id,
    trigger.id
].join("|");
```

`join("|")` creates one string for Set membership. The key does not include event name, so entry and a turn event can share the same allowance. It also does not include spell/Region UUIDs; whether that scope is appropriate across multiple instances is an open review question in [IMP-005](../improvement-notes/IMP-005-region-allowance-scope.md).

This limiter is separate from the shared-card key, which does include spell and Region identity. One limits a target's trigger; the other chooses a reusable result card. Movement-damage accounting takes its own path and is not gated by this branch.

### Branch A: movement accounting

For a movement-damage trigger, the selected active GM calls `recordMovementDamage({ trigger, spell, region, event, activity })` and returns. Details of movement increments and application live in [movement-damage.js](../../scripts/movement-damage.js), not in this function's later Activity-use branch.

The [Movement damage guide](movement-damage.md) traces that counter and its reservation/rolling workflow separately from entry/turn-based saves.

### Branch B: reuse this turn's card

The shared-card lookup first tries the local message-ID cache and then the common index:

```js
const sharedKey = getSharedCardKey(trigger, spell, region, event, game.combat);
const sharedMessage = sharedKey
    ? game.messages.get(sharedCardHistory.get(sharedKey)) ??
        latestIndexedMessage("sharedCardKeys",sharedKey)
    : null;
```

`??` falls back only when the first result is nullish, including when a cached message no longer exists. This can find a message carrying the recorded key without a recent-history scan written into this feature.

If a message exists, the engine checks whether this recipient is new, calls `appendSharedTarget`, prompts a save only for a newly recorded recipient, records the turn allowance, and returns. The shared helper synchronizes related damage recipients without rerolling existing dice. See [Shared activity cards](shared-activity-card.md).

### Branch C: create a triggered Activity result

Without a reusable card, the engine remembers `game.user.targets`, temporarily targets the event token, and reserves the turn key before awaiting Activity use.

Cast level comes from the Region's `dnd5e.spellLevel`, falling back to the source spell's level. A `damageOnly` trigger uses `buildRegionDamageSpellData` to build a temporary Item/Activity copy. Otherwise it uses the resolved Activity. Scaling is supplied for the configured preservation cases, including the attached-pack policy in the source.

The Activity is used with `consume:false`, concentration beginning disabled, no new measured template, usage configuration disabled, and subsequent actions enabled. Message data explicitly records the target, `regionTriggered`, `sourceRegion`, applicable shared-card keys, and supported originating metamagic data. The copied metamagic data clears its `careful` list in this path. Do not infer that every initial-cast choice is blindly repeated on subsequent triggers.

If a result message exists, the native save-prompt helper is called. A shared result is recorded in `sharedCardHistory`. For a shared use producing no message, its reserved turn key is removed to permit retry. An exception also removes the reservation and reports the error. The no-message retry cleanup shown here is conditional on a shared key; it is not a general promise for every prevented nonshared Activity use.

The `finally` block deselects the temporary event target and reselects the saved targets. This restores the executing user's prior selection; it does not replace the card's recorded recipients with that selection. Code before the `try` is not covered by that particular `finally`, so this is not a blanket transaction around the entire handler.

## 6. Initial casts join the same shared-card system

The `dnd5e.postUseActivity` listener handles ordinary casts that created Regions before any later Region trigger. It matches configured shared triggers to the used Activity or its allowed initial IDs, builds grouping keys, and can register the original usage card for reuse.

The local shared-card mapping is written synchronously in the hook, before queued metadata work. Later Region events can therefore find the initial card while its flag/allowance updates are still waiting in the same queue.

`shareInitialCard:false` skips using that initial card as the later shared result, while still permitting initial recipients' once-per-turn allowances to be registered. This is useful where the initial save differs from later damage-only behavior, such as the Wall of Fire configuration exercised by the local fixtures.

If `targetsConfirmationPending` is set, allowance registration is saved in `pendingCastAllowances`. The custom `ugmuls55eAutomation.targetsConfirmed` listener then processes the confirmed recorded recipients with the captured event. This prevents treating an unconfirmed target selection as the final allowance list.

This Map is distinct from [pending-cast.js](../../scripts/pending-cast.js): it records Region limiter work awaiting confirmation, not native resource refund state. See [Pending casts and damage](pending-cast-and-damage.md).

The `preCreateChatMessage` listener also merges a shared origin's recorded targets into a new damage message using `mergeTargets`. In that listener the source is accessed as `message.system.origin` with a `getFlag` method; it relies on the prepared origin document there rather than resolving every string form itself. Later target additions and pending damage completion have their own synchronization paths in the previously documented helpers.

## 7. `attachSpellRegions`: configure what happens inside the area

This async function is declared inside the `ready` callback. It reads the Item's current recipe, optional Sanctuary-provided Region-effect adjustments, and the supplied Regions. It returns for disabled/missing recipes, no triggers/effects, or invalid Region lists.

For each Region, it resolves caster/disposition filters, then handles two behavior families:

| Family | Construction and duplicate handling |
| --- | --- |
| Activity triggers (`executeScript`) | Require trigger ID/name and configured events. Check type plus generated behavior name to avoid duplicates. Collect compatible creations into a single embedded-document create call per Region. |
| Native effects (`dnd5e.applyActiveEffect`) | Resolve configured native effects, check type plus generated behavior name, mark existing/new behaviors as managed, update disposition filters when changed, or create a behavior referencing the effect UUID. |

The generated activity script calls the global event handler with its trigger ID. A template literal constructs the script text, and `JSON.stringify(trigger.id)` encodes that ID as a JavaScript literal rather than inserting raw unquoted text.

### Why `tokenEnter` is attached in two stages

The existing workaround creates activity behaviors with all configured events except `tokenEnter`. After creation it batches updates to restore the full event list for those that need it. The source labels this a delayed-attachment workaround. This guide records the current sequence; it does not establish that the same workaround is necessary in every future Foundry version.

The created behavior array and parallel metadata array are paired by index when preparing those updates. A future extraction must preserve that relationship and the error reporting around each stage.

### Native effects and authority

Native effect behaviors use `regionEffectDispositions` and the resolved source effect UUID. Empty disposition filters mean unrestricted in this workflow; `null` means the restricted target filter could not be resolved. For `null`, existing effect behaviors are disabled or new ones are skipped. With a resolved filter, this branch updates dispositions when needed; it does not explicitly re-enable a previously disabled behavior merely because the filter now resolves.

This is attachment and partial reconciliation, not a universal remove/reset/rebuild operation for every obsolete configured behavior. The duplicate checks are name/type based; do not assume complete repair of every changed event/source field.

[region-effect-authority.js](../../scripts/region-effect-authority.js) separately gates managed native Region-effect execution to the active GM. [region-conditions.js](../../scripts/region-conditions.js) provides another related policy layer. The main file does not itself replace every native effect handler or apply every resulting Actor effect directly.

## 8. Hook and authority reference

| Hook / entry point | Responsibility and routing |
| --- | --- |
| `init` | Register this file's settings. |
| `ready` | Install listeners and delegate movement/save hook registration. |
| `preCreateRegion` | On the creating client, set GM-only Region visibility when configured. Overlay visibility is separate from enabled behaviors. |
| `createRegion` | Active GM resolves the Item, records `casterUserId`, applies configured visibility, and attaches behaviors. Special summoned/attached Regions retain their recorded caster routing where supplied. |
| `canvasReady` | Active GM revisits Item-linked Regions on the viewed Scene and calls attachment. This is not a global scan of all Scenes. |
| `dnd5e.postUseActivity` | Seed initial shared cards and queue metadata/turn-allowance registration. |
| `ugmuls55eAutomation.targetsConfirmed` | Finish deferred allowance registration. |
| `preCreateChatMessage` | Merge recipients for supported shared-origin damage publication. |
| `deleteCombat` | Clear local turn, shared-card, and pending-allowance histories. |
| `Ugmuls55eAutomation.handleRegionEvent` | Queue and execute Region activity/accounting under the client-routing rules above. |

This file has no socket listener of its own. Other imported components have their own socket/authority mechanisms. A globally exposed event function and local queue should not be described as a server-authenticated transaction.

## 9. What the file can change

- Register settings and feature hooks through imports.
- Create/update RegionBehavior documents and update Region routing/visibility.
- Add flags and recipients to shared messages.
- Temporarily change user token targeting, then restore it in the supported Activity-use path.
- Use the resolved native or temporary triggered Activity and request native saves.
- Update its local histories and delegate movement accounting.

It is not the central implementation of damage HP application, all resource tracking, all reactions, or general Undo. Those remain in their own workflows. A triggered Activity result may enter those workflows afterward.

## 10. Verification and planned in-game checks

Local fixture sources reviewed include `conjure-animals-sharing.test.mjs`, `damage-area-regions.test.mjs`, `flaming-sphere.test.mjs`, `guardian-of-faith.test.mjs`, and `region-library.test.mjs`. Examples exercise queued Region execution/sharing, native Activity IDs and scaling, initial allowances, separate initial/later Wall of Fire behavior, and caster/GM routing. Several tests extract selected source functions or fragments and inject mocks; they do not run the entire Foundry client or prove every listener together.

On **2026-11-09**, the following targeted run passed: **11 test files, 0 failed**. The runner selects filename substrings, so these filters include related matching files as well as the specifically reviewed fixtures.

```text
node tools/run-tests.mjs --filter conjure-animals --filter damage-area-regions --filter flaming-sphere --filter guardian-of-faith --filter inactive-effect-cleanup --filter monster-auras --filter region-library --filter shared-target-sync
```

Documentation checks verified local guide/notes links, all six JavaScript excerpts against the source ignoring whitespace, and coverage of the five named local functions and seven `Hooks.on` registrations in this file. Tests/tools remain local and Git-ignored. This documentation-only pass did not rerun the full runtime suite or perform new in-game checks.

For future changes, record the exact recipe/settings, Scene, actors, event, and client roles when running these scenarios:

| Scenario | Expected preservation | Status in this documentation pass |
| --- | --- | --- |
| Player casts a configured area | GM attaches behaviors; normal activity execution uses the intended caster/GM route; visibility does not disable the underlying automation. | Not run |
| Entry and turn event for the same target, then a new turn | Same configured allowance behavior; fresh turn permits the next intended result. | Not run |
| Multiple recipients enter a shared Region | One appropriate result card/roll per shared group; new saves for new recipients; no changes to existing dice, HP history, or pending session. | Not run |
| Initial cast waits for target confirmation | Confirmed recipients govern allowance registration; later Region events do not prematurely create overlapping initial results. | Not run |
| Damage-only follow-up and upcast | Correct native damage/scaling; no extra slot, concentration restart, or duplicate template; correct distinction from an initial save. | Not run |
| Conjure Animals pack movement versus interior creature movement | Correct event eligibility and shared per-target allowance; source token exclusion remains. | Not run |
| Guardian and movement-damage Region | Correct active-GM routing, native owner save prompts, and delegated movement accounting. | Not run |
| Revisit Scene or repeat attachment | No duplicate named behaviors; tokenEnter and native effect dispositions remain appropriate. | Not run |
| Hidden/defeated/zero-HP target, missing caster, neutral disposition | Preserve the actual target policy above; compare observed behavior rather than assuming a broader rules interpretation. | Not run |
| Two independent Regions/casters with similar triggers | Establish intended versus actual allowance scope as proposed in IMP-005 before changing key identity. | Not run |

No new in-game observations or performance measurements are claimed. Proposed extraction and key-scope review are recorded separately in [IMP-004](../improvement-notes/IMP-004-main-script-boundaries.md) and [IMP-005](../improvement-notes/IMP-005-region-allowance-scope.md).

Next, read [Finding and refreshing cards](finding-and-refreshing-cards.md) for the lookup/refresh machinery used by these connections.
