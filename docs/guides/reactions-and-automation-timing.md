# Reactions and automation timing

[Guide index](README.md) · [Card relationships](shared-activity-card.md) · [Pending actions](pending-cast-and-damage.md) · [Refresh queue](finding-and-refreshing-cards.md)

Source reviewed **2026-11-09**, `v1.0.1-dev`: [reaction-tracker.js](../../scripts/reaction-tracker.js), [reactive-automation.js](../../scripts/reactive-automation.js), and relevant connections in [turn-resources.js](../../scripts/turn-resources.js), [companion-turns.js](../../scripts/companion-turns.js), and [npc-damage-automation.js](../../scripts/npc-damage-automation.js). Excerpts preserve source expressions with expanded spacing where helpful.

## Two questions, two systems

**Reaction tracking asks:** has this creature spent its Reaction, and should this use reserve it?

**Reactive automation asks:** should automatic damage/effect application stop because an eligible adjustment could still change the result?

They cooperate, but one is not a switch for the other. The governor includes non-Reaction adjustments such as Bardic Inspiration and certain rerolls. Some follow-up reactions, such as Fount of Moonlight, do not change the incoming result and are not governor blockers.

| Setting | Role | Current registered default |
| --- | --- | --- |
| `reactionTracker` | Track/block qualifying uses in active combat using the Reaction marker. | `true` |
| `reactiveAutoApply` | Smart Damage and Effect Automation: gate enabled auto-apply workflows for supported adjustments. | `false` |
| `autoApplyCardDamage`, `autoApplySavedEffects`, `autoApplyHitEffects` | Choose which automatic application paths are enabled. | Inspect their own registrations/current world settings. The governor does not enable them. |

Mandatory spell/feature readiness checks also exist. In `stopForReactions`, Mirror Image and Unbreakable Majesty readiness are checked before the optional governor's authority/setting/healing guard. Do not interpret switching off smart automation as bypassing every mandatory interception.

## 1. Reaction tracking: identity and classification

### Find the actor's effective turn

The tracker uses a companion-aware `effectiveCombatant` helper when available, falling back to a direct combatant Actor UUID match. `offTurn` first checks an Activity's usage token against combatants, then uses effective-combatant matching if needed.

This supports eligible companions acting during their owner's turn while keeping the companion's own resource pools. It is not a rule that every summon shares its owner's turn: [companion-turns.js](../../scripts/companion-turns.js) defines the supported origin/feature/description links and preserves a creature's direct combatant when present.

### `reactionUsed` is a lookup, not spending

`reactionUsed(actor)` first recognizes the Rot integration's `menacingEffect` when present. Otherwise it requires started combat and an effective combatant, then finds an actor effect that is not disabled, inactive, or expired, with either the `reactionUsed` flag or the name `Reaction - used`.

It returns the matching effect, or no value; callers often use its truthiness. It does not check the `reactionTracker` setting itself, mark a resource, or independently reject every incapacitating status. Those checks belong to its caller or the feature's eligibility logic. Turning tracking off and calling this helper are distinct operations.

### Which activities count?

`reactionActivity` requires a combat participant, then uses this classification:

```js
return String(activity?.activation?.type??"").startsWith("reaction")
    ||(offTurn(activity)&&activity?.activation?.type!=="bonus");
```

`String(...)` normalizes an absent value to an empty string here. `.startsWith` recognizes the configured Reaction activation family. `||` means either an explicit Reaction or a qualifying non-bonus off-turn use counts. An explicit Reaction can count on the actor's own turn.

Named exclusions include supported legendary-action uses, current-rules Hill's Tumble, the helper for exploding an owned undead, and Searing Vengeance. Separate private checks exclude linked Cleave and automated Region/rider messages from normal manual-activity tracking.

This reflects the module's chosen tracking policy; it is not a universal rules engine deriving action costs from a spell's prose. Off-turn bonus-action legality is handled by the turn-resource workflow, not by converting it into a Reaction here. Ordinary saving throws are not automatically spent Reactions merely because another creature caused them.

## 2. Availability, reservation, and the marker

`allowReactionUse` is registered on `dnd5e.preUseActivity`. When tracking and classification apply, it warns and returns `false` if an actor has spent its Reaction or its UUID is in the local `creating` Set. Returning false is how this hook can veto the attempted use.

`recordReactionUse` runs on `dnd5e.postUseActivity` and is also called explicitly by feature workflows. It requires a message, applicable manual activity, owned actor, enabled tracking, and an available Reaction. It does not globally route every reservation to the active GM; feature workflows that act on another actor must arrange their own authority/socket validation.

After adding the actor UUID to `creating`, it builds a marker with this source data:

```js
const data={name:"Reaction - used",img:"icons/svg/clockwork.svg",disabled:false,transfer:false,
    duration:{rounds:1,expiry:"sourceStart"},start:CONFIG.ActiveEffect.documentClass.getEffectStart(),
    system:{changes:[],origin:{actor:actor.uuid}},
    flags:{[ID]:{reactionUsed:true,reactionUsage:message.id}}};
```

The computed key `[ID]` uses the module namespace as an object property. `reactionUsage` ties the reservation to a particular message. The source Actor and native start/expiry data support turn timing.

The function calls the shared resource `reuseMarker` when available, otherwise creates an embedded ActiveEffect. `reuseMarker` can reactivate an existing marker rather than create a new document, clears its persisted expired state, and disables extra active duplicates.

“New reservation” therefore does not always mean a newly created effect ID. The important result is the returned marker now belonging to this usage. A feature can verify its `reactionUsage` before committing its own action. The tracker does not return the already-spent marker as if a second reservation succeeded.

The local Set guard is removed in `finally`:

```js
} finally {creating.delete(actor.uuid);}
```

That cleanup runs even on a rejected document operation. The Set prevents overlapping reservations through this code on one client; it is not a server-wide atomic lock across all owners/clients. Authority and current-state revalidation in feature workflows remain important.

### Let the reserved attack finish

`allowReactionAttack` guards `dnd5e.preRollAttackV2` for off-turn attacks. It allows a roll whose originating message matches the marker's `reactionUsage`, so reserving the Reaction does not block the first attack of that same use. Unrelated off-turn attacks stay blocked. Cleave and supported legendary uses retain their exemptions.

### Cancellation and reset are connected workflows

The post-use hook registers the reservation Promise with pending cast through `track`. Pending cancellation waits for tracked tasks and disables markers matching its usage card, preventing a late marker creation from escaping its normal cancellation cleanup. This is not a universal automatic refund of every feature's direct reservation: feature failure paths must handle their own reserved marker/resource rollback.

The native marker uses `sourceStart` expiry. [turn-resources.js](../../scripts/turn-resources.js), in `resetTurnResources`, also disables applicable personal markers at the incoming effective turn under active-GM authority. A Reaction persists across other creatures' turns; it is not reset on every turn change. Bonus-action and spell-slot trackers have related but different reset policies.

At combat exit, the reset code avoids racing native deletion for expired/special-expiry effects. Companion timing integration connects eligible companions to their owner's turn without spending the owner's Reaction. For supported manual overrides, disabling/deleting the used marker makes the normal effect lookup stop finding it, except where another feature imposes its own restriction.

## 3. The governor's unit of work is a linked card scope

`reactiveScope(card)` returns `{root, tests, hp}`. This is why card identity matters before discussing timing:

- Damage/healing with an explicit `damageAttackId` resolves to that attack when available; otherwise it uses the origin or the card itself.
- Save/check messages with an origin use that origin as the root.
- An attack is its own test. A usage group gathers associated saves/checks, including the supplied save/check if not already listed.
- An attack uses `linkedHpCards` for its HP cards; other roots use associated damage/healing messages. The supplied HP card is included, IDs are deduplicated, and retired/inapplicable Graze cards are filtered.

The scope is not a search for any nearby card with the same total. A supported option on one save can stop that grouped save/damage workflow. Explicit per-attack linking keeps another attack's application separate where the scope supports it.

## 4. Ask the features whether an adjustment is available

`availableReactions` calls the existing feature eligibility functions and collects names in a `Set`, returning unique labels. It does not inspect browser buttons to decide whether an option exists.

Despite its name, this includes more than Reaction-cost actions:

| Stage | Examples of supported checks in the current source |
| --- | --- |
| Attack/test outcome | Shield, Combat Inspiration AC, Guided Strike, Lucky, Defensive Duelist, Warding Flare, Instinctive Charm, Seeking Spell, Precision Attack. |
| Individual D20 rolls | Flash of Genius, Cosmic Omen, Bardic Inspiration, Cutting Words, Countercharm, Restore Balance, Bend Luck, Indomitable, and other registered test adjustments. |
| Damage cards | Parry, Deflect Attacks, Protective Field, Bastion of Law, Beguiling Defenses, Uncanny Dodge, resistance/defense options, Empowered Spell, Weapon Feats, and other explicitly checked reductions/corrections. |

This is a representative map, not a promise that every feature or future button automatically participates. Some adapters are named imports; others are optional global integrations. Each feature retains its own resources, sight/range, ownership, lock, and timing rules.

For Shield, the local `shieldOffered` adapter requires the enabled option, an unlocked visible attack, a recorded hit, and an available Shield Activity for that defender. The governor does not itself spend Shield's slot or rewrite the attack roll.

The active GM normally asks these feature functions using the GM user context. Correct underlying feature checks are therefore important; a disabled or hidden button on a player client is not the authoritative test.

## 5. Stop the attempt; do not leave a waiting loop

`stopForReactions` returns a Boolean to its caller. Returning true tells the automatic HP/effect path to stop this attempt.

The order includes mandatory readiness gates, the optional active-GM/setting/healing guard, additional in-flight feature gates, manual-workflow checks, and existing stopped-state checks. For eligible live test messages it invokes supported idempotent snapshot capture helpers before checking availability.

If there are no adjustment reasons, `reactiveDamageRollPending` can still hold application when native damage is expected but no completed damage card exists. That prerequisite hold does not itself create the persistent “reaction available” stopped flag.

For actual available adjustment reasons, the terminal-stop branch is:

```js
stopped.add(root.id);
const write=root.setFlag(ID,'reactiveAutomationStopped',true);
stopping.set(root.id,write);
try{await write;}
finally{if(stopping.get(root.id)===write)stopping.delete(root.id);}
return true;
```

`stopped` is a local Set; `reactiveAutomationStopped` persists on the root card. `stopping` remembers the write Promise while it is in flight. Later attempts on an already-stopped root return without repeating the optional eligibility/range scan or unchanged stopped-flag write. Some mandatory/in-flight readiness checks occur before that shortcut.

There is no reaction-choice timer, polling loop, or background task waiting for the owner to respond in this file. Another workflow can have ordinary animation/save delays; those are distinct from a reaction waiting loop. The `createChatMessage` hook primes the gate early for supported new cards when relevant auto-apply options are enabled.

## 6. Completion requests a new attempt

`reactionCompleted` runs only under active-GM authority with the governor enabled. It resolves the root and coalesces concurrent completions for that root through `finishing`.

The completion task waits for any stopped-flag write already in flight, checks manual-workflow state, clears the stopped state, then calls `NpcDamage.resumeReactive(card)`. This avoids a late stop write overwriting the cleared state after completion.

The returned task represents this handoff; it does not mean HP/effects have finished applying. `resumeReactive` schedules the appropriate linked HP cards and effect workflow. They recheck current outcomes, prerequisites, settings, and eligibility. Another available adjustment can stop the next attempt again.

```text
Automatic attempt finds eligible adjustment
  -> stopped root recorded; attempt ends
  -> feature commits adjustment
  -> explicit completion / recognized settled update
  -> clear stop; schedule fresh automatic attempt
       |-- another option remains: stop again
       |-- manual workflow: no automatic takeover
       `-- prerequisites satisfied: normal application ledger handles result
```

### Recognize commitment, not merely dialog closure

Private `completedChange` recognizes selected settled-use flags, plus pending-to-finished transitions. Private `changed` handles nested/flattened flag updates and removal syntax.

For pending operations such as Deflect, Protective Field, Restore Balance, and Bend Luck, it saves a signature of the result record when the pending state begins. When pending clears, a changed result signature signals completion; unchanged results after cancellation do not restart the old stopped workflow merely because a busy flag disappeared.

Other features call the exposed completion method explicitly. Not every integration uses the same ledger pattern. The `live` WeakSet tracks newly observed messages for snapshot/roll-update probes; the governor does not install a broad movement/resource hook to restart historical stopped cards.

## 7. Shield versus Fount: two different reasons to react

| Example | How it connects |
| --- | --- |
| [Shield](../../scripts/shield-reaction.js) | Can change hit/miss, so the governor can stop incoming application. Native use handles its activity/resource path; the Shield workflow rechecks AC/targets and emits `shieldReactionSettled` after its applied-buff path. The completion detector listens for that settled identity, not merely an early `shieldRechecked` refresh. |
| [Fount of Moonlight](../../scripts/fount-of-moonlight.js) | Offers a follow-up against the recorded attacker and does not modify incoming HP/dice. It captures eligibility once, explicitly reserves the defender's Reaction when used, and invokes a triggered native save. It is not listed as a blocker in `availableReactions`. |

Fount's use still checks current Reaction availability even though concentration/range eligibility was captured earlier. “Do not recheck the snapshot facts” is not permission to spend a Reaction twice. See its [walkthrough](fount-of-moonlight.md).

For the full cast-to-settlement path through these shared systems, read the [Shield walkthrough](shield-walkthrough.md).

## 8. Manual interaction and Undo stay authoritative

The automatic-application module uses `manualDamageWorkflow` and its own cancellation state to retain manual control. The governor does not clear that decision when an adjustment completes.

`isReactiveControl(node)` recognizes supported control containers/selectors through DOM `.closest`. The automatic module's trusted interaction handler uses it, when the optional governor is enabled, to distinguish supported adjustment clicks from generic manual card interaction. There are separate exceptions for mandatory checks and retry controls.

This selector recognition is not permission validation, spending, or proof that the associated adjustment succeeded. Fount is not in that selector list; the statement that it is not a governor blocker should not be generalized to exemption from every manual-interaction handler.

When no one wants an offered adjustment, the GM can proceed using manual Apply. Manual HP/effect application and Undo retain their own records and applicable locks. A later completion signal must not silently take that workflow back over. Continue with [Applying results and Undo](applying-results-and-undo.md) for those details.

## 9. State and entry-point reference

| State / API | Purpose |
| --- | --- |
| Tracker `creating` Set | Local reservation-in-flight guard per Actor UUID. |
| Actor marker flags `reactionUsed`, `reactionUsage` | Spent status and the message reserving it. |
| `reactionUsed`, `offTurn`, `reactionActivity` | Read current marker/turn/classification state. |
| `allowReactionUse`, `allowReactionAttack`, `recordReactionUse` | Pre-use veto, linked attack allowance, and reservation. |
| Governor `stopped` / `reactiveAutomationStopped` | Local/persisted terminal-stop state for the root. |
| `stopping`, `finishing` Maps | Coordinate an in-flight stop write and coalesced completion per root. |
| `live` WeakSet, `pendingReactions` WeakMap | Identify newly observed card objects and pending result signatures. |
| `reactiveEnabled` | Read the smart-automation setting. |
| `reactiveScope`, `availableReactions`, `reactiveDamageRollPending` | Build scope, ask feature eligibility, check damage prerequisites. |
| `stopForReactions`, `reactionCompleted`, `isReactiveControl` | Gate an attempt, request restart, and classify supported UI controls. |
| Global `Ugmuls55eAutomationReactive` | Exposes `enabled`, `stop`, `completed`, and `isControl`. |

Tracker hooks: `dnd5e.preUseActivity`, `dnd5e.postUseActivity`, `dnd5e.preRollAttackV2`. Governor hooks: message create/update/delete. The tracker and governor do not each provide a universal socket listener; feature actions and automatic application supply their own mutation routing.

## 10. Verification and planned in-game checks

Reviewed local fixture sources include `reaction-tracker.test.mjs`, `turn-resources.test.mjs`, `companion-turns.test.mjs`, `reactive-automation.test.mjs`, and `reactive-npc-gate.test.mjs`. They cover off-turn/own-turn Reaction classification, exemptions, linked first attacks, marker reset/reuse, independent companion resources, terminal stops and work counts, grouped saves, completion coalescing, stop-write races, canceled-versus-committed pending adjustments, manual workflow protection, and native HP/effect gating. The governor fixture stubs many feature adapters; it does not prove all real adapters or a multi-client reservation race end to end.

The integration contract across eligibility, readiness, completion flags, and UI selectors is recorded for future review in [IMP-007](../improvement-notes/IMP-007-reactive-integration-contract.md). No runtime change is made by this guide.

On **2026-11-09**, this targeted run passed: **9 files, 0 failed**.

```text
node tools/run-tests.mjs --filter reaction-tracker --filter turn-resources --filter companion-turns --filter reactive-automation --filter reactive-npc-gate --filter shield-reaction --filter bardic-inspiration --filter parry --filter fount-of-moonlight
```

Documentation checks verified local guide/notes links, all four JavaScript excerpts against the current source ignoring whitespace, and inclusion of all 13 exported names from the tracker/governor. The full runtime suite was not rerun for this documentation-only change, and no new in-game checks were performed. Local tests/tools remain Git-ignored.

| In-game scenario for later shared changes | Expected observation | Status this pass |
| --- | --- | --- |
| Explicit Reaction on own turn; action attack off turn; ordinary action on own turn | Correct classification, one used marker, and unrelated normal actions remain available. | Not run |
| Linked first opportunity attack then unrelated off-turn attack | Original use can finish; another Reaction use is blocked. | Not run |
| Advance other turns, then the actor's effective turn; repeat with eligible companion | Reaction persists until the correct reset; companion and owner pools stay separate. | Not run |
| Shield on a hit with smart automation and relevant auto-apply enabled | Stop before application; applied AC recheck commits; fresh processing uses current hit/miss and preserves the attack dice. | Not run |
| Bardic Inspiration and Parry/Deflect, including canceled configuration | Committed change can resume; cancellation alone does not restart; original dice and correct resource refunds remain. | Not run |
| Two available adjustments, or one eligible save in a grouped spell | First completion rechecks the group and stops again if another option remains. | Not run |
| Manual Apply or Undo while a root was stopped | Later completion does not override manual control; appropriate correction locks/controls follow recorded state. | Not run |
| Fount defender loses concentration after captured incoming roll | No governor hold for Fount; button retains captured eligibility; use checks current Reaction. | Not rerun; earlier prompt appearance was user-confirmed |
| Governor off versus on, plus mandatory Mirror Image/Unbreakable handling | Optional gating follows its setting; mandatory readiness paths retain their independent checks. | Not run |

Record actors/forms, settings, GM/player roles, source cards, costs, and results. These proposed checks are not failures or new in-game verification. No performance gains or server timing claims are made.
