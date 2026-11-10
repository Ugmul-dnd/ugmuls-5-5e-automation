# Shield: an end-to-end walkthrough

[Guide index](README.md) · [Reaction timing](reactions-and-automation-timing.md) · [Results and Undo](applying-results-and-undo.md) · [Shield source](../../scripts/shield-reaction.js)

Source reviewed **2026-11-09**, `v1.0.1-dev`. This walkthrough follows the attack-card Shield button and its connections. JavaScript excerpts match source expressions with spacing expanded where helpful. The sequence and numerical example are explanatory, not a newly performed Foundry test or a complete account of Shield's rules text.

## The sequence to keep in mind

```text
Incoming attack A records defender Token T and AC
  -> Shield renderer offers T's owner/GM a button on the hit
  -> native Shield use creates usage S, linked by shieldReactionAttack = A.id
       |-- native consumption: free use / slot as selected
       |-- Reaction tracker: marker belongs to S
       `-- buff workflow: native configured Shield effect, with Undo history
  -> early refresh may re-read A's targets but is not settlement
  -> applied-effect signal -> active GM re-reads AC and marks A settled
  -> reaction governor schedules a fresh automatic attempt
       |-- another option remains: stop again
       `-- current outcome permits application: apply to eligible recipients
```

For example, an attack total of 18 initially hits a defender recorded at AC 14. If the native Shield effect raises current AC to 19, the recheck updates the target descriptor's AC and D&D5e evaluates the outcome again. The attack's original dice are not rolled again. Native outcome handling, including its critical policy, still governs the final result.

There are at least three different documents here: attack A, Shield usage S, and any incoming damage card D. The Shield effect and Reaction marker are Actor effects. Their identities are connected, not interchangeable.

## 1. Where the button appears

`addShieldButtons` handles an attack card and visible inline `.card-summary[data-message-id]` attack groups. It removes its old buttons/rows before reconstructing controls, so repeated rendering does not keep appending copies.

It requires the `showShieldReaction` setting, visible card content, and an unlocked attack according to `isRollAdjustmentLocked`. It inspects rendered native `target-pill` elements, skips pills marked `data-miss`, reads the Token UUID from the nested option, and resolves that token's actor.

Only a GM or that actor's owner receives its button. A `Set` prevents duplicate recipient buttons. `shieldActivity(actor)` must also return an available activity. The button is on the **incoming attack result**, not the damage card or an extra reaction-result card.

This renderer's target-pill traversal is a presentation dependency on native card HTML. The governor has a separate `shieldOffered` check using recorded evaluated targets. Both should reflect the same underlying opportunity, but one is not implemented by querying the other's button.

The click guard is local to the attack/recipient pair:

```js
const key=entry.message.id+":"+uuid;
if (busy.has(key)) return;
busy.add(key);button.disabled=true;
```

`+` joins the two IDs into a string key. `busy` is a local Set, not a global transaction lock. The handler rechecks activity availability and the attack lock before casting. In `finally` it removes the key and updates button availability even after an exception.

## 2. Availability is more than having a spell named Shield

`shieldReactionAvailable` requires an actor, no spent Reaction returned by the shared tracker, and none of the listed incapacitating statuses. Outside tracked combat, the tracker does not generally block from an old combat-only used marker; a separate feature restriction can still matter.

`shieldCastPlan` scans owned Items for Shield, requires preparation when the system says it can be prepared, and requires a utility activity with exact `reaction` activation. It then chooses a usable payment path.

| Plan path | Selection in the current implementation |
| --- | --- |
| At-will | A matching Item with `method === "atwill"` can return immediately. |
| Activity free use | A matching Reaction utility activity with remaining uses takes priority over the Item's pool/slot fallback for that Item. |
| Item free use | Remaining limited uses on the spell Item. |
| Unlimited innate | Innate method without a numeric maximum use pool can be treated as at-will. |
| Slot fallback | After collecting candidates, reject slot funding if the turn-resource helper reports a prior slot-funded cast; otherwise select an available normal/Pact slot of level at least one. |

Available slots are sorted by level, preferring a normal slot over Pact at the same level. Free/at-will paths can remain available when the current-turn slot rule excludes another slot-funded cast.

These immediate free/at-will returns happen while iterating Items; this is not a separate global search that ranks every free activity on every duplicate Shield Item before selecting one. `shieldActivity` returns the activity from this plan, or `null`, and is reused by other feature checks.

## 3. Cast a temporary native clone

`castShield` obtains a fresh plan and clones the source Item without persisting those changes to the actor's sheet. It configures only the selected activity's consumption and the clone's method for the chosen path.

The native call is:

```js
return activity.use(usage,{configure:false},{data:{flags:{
  [MODULE_ID]:{shieldReactionAttack:attack.id}
}}});
```

`[MODULE_ID]` is a computed object property that places the link under the module namespace. This message flag points from Shield usage S back to incoming attack A. Native consumption receives either the configured free-use target or the selected spell slot, avoiding simultaneous exhausted-use and slot charges. Scaling reflects the selected slot level.

`configure:false` skips the usage configuration dialog for this planned action; it does not mean “do not spend resources.” The `usage.consume` object explicitly requests the appropriate native payment. No hard-coded HP healing or manual `+5` attack-total adjustment is performed here.

The ordinary [Reaction tracker](../../scripts/reaction-tracker.js) recognizes the native Reaction use and records its marker. Shield does not call `recordReactionUse` directly in this file. [Turn resources](../../scripts/turn-resources.js) handles applicable slot-turn restrictions and consumption tracking. [Pending cast](../../scripts/pending-cast.js) can coordinate the eligible owned use and its tracked cleanup; its no-roll utility settlement is distinct from the effect-application signal below.

Shield has no dedicated socket listener in this file. The actor's owner initiates native use; other connected workflows provide GM mutation routing and checks where needed. A local player may not own the incoming attack message, which affects the early refresh path.

## 4. Apply the spell's native effect

[effect-automation.js](../../scripts/effect-automation.js) recognizes eligible utility/buff activities, waits for required target confirmation, resolves configured native effects, and routes appropriate author requests to the active GM. It uses native effect preparation for duration/dependencies and the shared Undo helper when available.

After successful buff processing it writes `buffAutoApplied` and emits `ugmuls55eAutomation.buffEffectsApplied`. Shield listens both for supported applied-flag updates and that event. An `outcomeEffectsApplied` transition is also recognized by its message-update hook.

This distinction matters when automatic buff application is disabled, held, or fails. Returning a Shield usage message is not evidence that the AC effect already exists. There is no separate fallback here that blindly adds AC and declares the spell settled regardless of effect application. The applicable native/manual effect path must actually finish.

## 5. Refresh target AC, preserving the roll

`refreshShieldAttack` accepts an attack and optional `settledSource`. It permits a GM or attack owner, resolves each recorded target token, and rebuilds its descriptor with `describeTarget`. Unresolved tokens retain a copy of their old descriptor.

That re-reads the actor's current AC and related descriptor data. It also reapplies a recorded Combat Inspiration AC bonus, so refreshing for Shield does not erase that existing card-specific adjustment.

The write is:

```js
await attack.update({"system.targets":targets,
  [`flags.${MODULE_ID}.shieldRechecked`]:true,
  ...(settled?{[`flags.${MODULE_ID}.shieldReactionSettled`]:settledSource}:{})
},{rsaRetarget:true});
```

Backticks build flag paths using `${...}` substitution. `...(condition ? object : {})` adds the settled flag only when allowed. No `rolls` field appears in this update: the existing attack dice stay intact while native target evaluation responds to current AC.

The function loops all recorded recipients of that attack, not merely today's selected tokens or just the defender clicked. A mixed-target attack can remain a hit against another creature.

### Early refresh versus settled refresh

The button handler can call `refreshShieldAttack` as soon as native use returns a message. It does not pass `settledSource`. That can be too early for the applied AC effect, and it deliberately does not authorize governor restart.

The applied-effect handlers pass the Shield usage ID as `settledSource`. Only a qualifying active GM writes `shieldReactionSettled`. The [governor](../../scripts/reactive-automation.js) recognizes that flag as completion; merely setting `shieldRechecked` is insufficient.

The buff event and its persisted flag can both trigger checks. This file does not implement a general one-recheck-per-cast guard around those signals. Governor completion coalesces overlapping handoffs, and the normal application workflow must still recheck current state and prevent duplicate application.

## 6. Resume using current outcomes

With smart automation and the relevant auto-apply options enabled, the governor can stop an incoming hit while Shield is available. After settled completion, it clears the stopped state and asks the HP/effect scheduler to make a fresh attempt.

If the attack now misses, normal hit-only damage is no longer an eligible application to that recipient. If another target remains hit, or a supported miss-damage exception applies, the corresponding workflow handles that result. If another usable adjustment remains, the fresh attempt can stop again.

This is not an automatic reverse of already-applied damage. The button normally disappears when adjustment locks detect committed HP/effects; users must first use the relevant Undo/correction workflow when applicable.

Turning off the optional governor changes its waiting behavior, not Shield's native resource use or every manual-interaction rule. Do not promise that enabling the Shield button alone guarantees automatic application waits for a decision.

## 7. Hide an unused pure-miss damage card, not its history

`damageMissedAfterAttack` is more general than Shield despite its location. It resolves the linked attack, prefers explicit IDs, and returns true only for a pure miss when its exclusions permit hiding.

It keeps damage visible when HP was recorded, HP/effect Undo history remains, linked attack/source effect history remains, a target is still hit, or supported Graze/other miss-damage behavior applies. `damageMissedAfterShield` is a compatibility alias for the same function.

`hideShieldMissDamage` changes visibility for standalone and grouped cards, tagging elements it hid so they can be restored when a hit or outstanding history makes them relevant again. It does not delete the message or its dice/history.

The attack-update hook refreshes related damage and source presentation when targets/rolls change. Resource/effect/combat events request the central Shield refresh rule for visible opportunities. One attack-update path still enumerates `game.messages` to supplement native associations and performs direct targeted renders; that existing path is recorded for later review in [IMP-009](../improvement-notes/IMP-009-shield-linked-refresh.md).

## 8. What Undo restores—and what it does not

| Action | Current boundary |
| --- | --- |
| Undo incoming damage D | Reverse D's recorded HP changes under the shared restoration policy. It does not refund Shield's slot or Reaction. |
| Undo the Shield effect recorded on usage S | Restore/remove the recorded native effect if its source identity still matches; preserve a newer application from another card. |
| Recheck incoming attack A | Refresh its target AC/current native outcome without rolling another attack. This is distinct from undoing an effect. |
| Undo committed spell use as a whole | Not a single operation provided by this Shield file. Pending-cast cancellation only applies within its own uncommitted boundaries. |

There is no explicit Shield-effect-Undo listener here that promises to recheck every attack influenced by the effect. Clearing `buffAutoApplied`/`outcomeEffectsApplied` is not the same transition as setting an applied flag true. Actor/effect refresh requests can redraw controls, but redrawing is not necessarily a new stored target-AC calculation. Verify the actual correction sequence in Foundry before claiming that Undo Shield automatically reverses every derived result.

Shared adjustment locks read live remaining history. If HP/effect transactions still require Undo, corrected-miss damage stays visible. After the relevant histories are cleared, a genuinely unused pure-miss damage card can hide again.

## 9. Connection and function reference

| Responsibility | Function / connected module |
| --- | --- |
| Current Reaction/status eligibility | `shieldReactionAvailable`; shared `reactionUsed`. |
| Payment and native activity selection | `shieldCastPlan`, `shieldActivity`. |
| Native cloned spell use | `castShield`. |
| Stored target-AC refresh and settled identity | `refreshShieldAttack`. |
| Pure-miss detection / alias | `damageMissedAfterAttack`, `damageMissedAfterShield`. |
| Standalone/grouped visibility and controls | `hideShieldMissDamage`, `addShieldButtons`. |
| Marker/slot rules | Reaction tracker and turn-resource workflows. |
| Native effect, history, and applied signal | Buff automation and effect Undo. |
| Stop/restart and final HP checks | Reactive governor and automatic-application workflow. |
| Presentation work | Shared refresh scheduler plus the existing attack-update path noted above. |

The shared `shieldReactionAvailable` helper is also imported by Combat Inspiration and Defensive Duelist; Defensive Duelist also imports `refreshShieldAttack`. Changes here can therefore affect other features even though their buttons have different names.

## 10. Verification and future in-game exercise

Reviewed local fixtures include `shield-reaction.test.mjs`, `reactive-automation.test.mjs`, and the pending/Reaction/resource tests documented in earlier guides. Shield's fixture checks resources, preparation, incapacity, Reaction status, payment priority, clone configuration, hide/restore rules, live Undo-history visibility, and the distinction between early versus settled AC refresh. Its native use is mocked: it does not prove a complete player-to-GM cast, native effect application, and restart as one live sequence.

On **2026-11-09**, this targeted run passed: **10 files, 0 failed**.

```text
node tools/run-tests.mjs --filter shield-reaction --filter reactive-automation --filter pending-cast --filter reaction-tracker --filter turn-resources --filter combat-inspiration --filter defensive-duelist --filter roll-adjustment-lock --filter chat-refresh --filter chat-message-index
```

Documentation checks verified local guide/notes links, all three JavaScript excerpts against the source ignoring whitespace, and inclusion of all nine exported names in Shield's file. The full suite was not rerun for this documentation-only change. Tests/tools remain local and Git-ignored; no new in-game checks were performed.

| Scenario for a future change | Observe | Status this pass |
| --- | --- | --- |
| Ordinary hit that becomes a miss after native Shield effect | Original attack dice retained; applied AC is used before governor restart; no hit damage to that defender. | Not run |
| Attack still hits, native critical, and mixed targets | Native outcome policy and other recipients remain correct; no global damage removal. | Not run |
| Free activity use, free Item use, normal slot, Pact slot, and slot-turn restriction | Only intended pool spent; source sheet configuration unchanged. | Not run |
| Spent/reset Reaction, incapacitation, and unprepared/no-resource spell | Correct absence/restoration of controls; another Reaction cannot be spent. | Not run |
| Player owns defender but not attack card; active GM handles effect | Correct native ownership, AC refresh, and settled-source handoff. | Not run |
| Buff option off, held manual choice, or failed effect application | No false claim that a usage message alone completed the AC effect. | Not run |
| Existing HP/effect records then a corrected miss | Undo remains accessible; lock/history rules preserved; no automatic refund of unrelated resources. | Not run |
| Undo Shield effect after commitment | Record effect restoration, current Reaction/slot, attack's stored AC, and actual correction controls separately; do not assume a full rewind. | Not run |

No new in-game checks or performance measurements are claimed. The purpose is to connect the shared guides through one concrete feature without changing its behavior.
