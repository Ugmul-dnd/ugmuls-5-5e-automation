# Walkthrough: Fount of Moonlight's Blinding Reaction

[Guide index](README.md) · [Module map](module-map.md) · [Feature source](../../scripts/fount-of-moonlight.js)

Source review: **2026-11-09**, `v1.0.1-dev`. Excerpts below preserve the source's expressions, with formatting expanded where helpful.

## The behavior we wanted

An incoming damage roll offers **Blinding Reaction** to the eligible defender's owner and the GM. Eligibility captures the active Fount effect and the recorded attacker within 60 feet when the finished roll is submitted. Damage automation continues. Later concentration loss or movement does not remove that captured opportunity.

Clicking uses the spell's native blinding save activity against the captured attacker. It checks permissions, source identity, and current Reaction availability, but does not repeat the concentration, effect, or range test. A successful use records completion on the damage card so the button stays removed.

This is a card button, not a separate automatic modal popup. The implementation recognizes the native **Wreathed in Light** marker, as well as its other source/name matching paths. It does not implement a separate line-of-sight test; the spell's visibility requirement should not be confused with its explicit range check.

## 1. The entry points

At the bottom of the source, the `ready` hook installs:

```js
Hooks.on('preCreateChatMessage',card=>prepareFount(card));
Hooks.on('preUpdateChatMessage',(card,changes)=>prepareFount(card,changes));
Hooks.on('dnd5e.renderChatMessage',renderFount);
```

`card => prepareFount(card)` is an **arrow function**: when the event supplies a card, pass it to `prepareFount`. The update callback receives both the current document and proposed changes. It can add the snapshot to that update before the update is committed.

The render listener builds HTML from stored state. It does not capture eligibility or write flags while rendering.

## 2. Capture the opportunity once

`prepareFount` begins with two guards:

```js
if(flag(card,'fountMoonlightSnapshot')!==undefined)return;
if(changes&&!Object.hasOwn(changes,'rolls'))return;
```

- `!==` means strictly not equal. A previously stored snapshot stops the function, even when its entries are empty.
- `return` exits this function early.
- `&&` means both conditions must be true. On an update, a change without its own `rolls` property is ignored.
- `Object.hasOwn` tests whether that property exists directly on the proposed changes.

An empty snapshot is an important decision: nobody qualified for this roll. Later acquiring the effect must not add a button to that old card.

`fountSnapshot` checks damage-card type, pending state, spell and reaction activity, active effect, recorded recipients, attack outcome when linked to an attack, scene identity, Reaction availability, and distance. It builds entries containing document references:

```js
{actor:actor.uuid,token:token.uuid,item:item.uuid,
 sourceActor:(item.actor??actor).uuid,
 activity:activity.id??activity._id,attacker:attacker.uuid}
```

These are **object properties**, written as `name: value`. We save references rather than copying entire live documents into the flag. The `actor` is the defender; `sourceActor` identifies the actor owning the source spell. They can differ in Wild Shape.

The spell lookup checks the damaged form first and falls back to `druidOwner(actor)`. Range measurement uses `tokenDistance` from [shared-distance.js](../../scripts/shared-distance.js). On 2026-11-10, that calculation was extracted unchanged from Dark One's Blessing; Fount's range and snapshot timing remain in this spell. See the [caller verification sheet](../improvement-notes/IMP-001-distance-verification.md).

## 3. Why the pending damage fix mattered

[pending-damage.js](../../scripts/pending-damage.js), in `damageOperation`, submits completed rolls and clears `pendingDamage` together. During the pre-update hook, the existing card still contains its old pending flag.

This excerpt passes the incoming data explicitly:

```js
const snapshot=fountSnapshot(card,{
  rolls:changes?.rolls??card.rolls,
  completed:!!changes?.rolls,
  system
});
```

| Syntax | Meaning here |
| --- | --- |
| `const snapshot = ...` | Declare a binding for the result. `const` prevents reassignment of that binding; it does not freeze an object. |
| `changes?.rolls` | Optional chaining: read `rolls` if `changes` exists; otherwise produce `undefined`. |
| `a ?? b` | Use `b` only when `a` is `null` or `undefined`. It preserves values such as `0` or `false`. |
| `!!value` | Convert a value to a Boolean. An array, including an empty array, is truthy; the snapshot function separately checks its length. |
| `system` | Property shorthand: equivalent to `system: system`. |

The original attempt made a temporary object's `getFlag` return `undefined` for the pending flag. But the shared local `flag` helper uses a fallback:

```js
flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k]
```

The fallback read the old pending value from `flags`, so completed pending cards never captured the opportunity. Passing `completed` explicitly fixes that distinction. The snapshot guard still prevents later corrections from capturing eligibility again.

For a new message, `updateSource` places the snapshot into the document being created. For an update, adding `flags.ugmuls-5-5e-automation.fountMoonlightSnapshot` to `changes` includes it in the pending write. These paths avoid a second render-driven document write.

## 4. Render from the saved decision

`fountEntries` reads the snapshot, filters out completed entries, and checks the viewer's ownership and card visibility. It deliberately does not recompute range or check whether the effect is still present.

`renderFount` handles both the root card and inline grouped cards. It removes its old controls before adding current ones, preventing duplicates on repeated renders. The button label is **Blinding Reaction**; the tooltip explains which spell it belongs to.

The click callback prevents the browser's default handling, stops propagation to surrounding card controls, and disables the clicked button immediately. That helps the interface respond, but the GM-side checks and serialized use workflow remain responsible for validation.

## 5. Use the native activity and record completion

`useFount` runs through the queue returned by `createEventQueue` in [shared-activity-card.js](../../scripts/shared-activity-card.js). Calls through this feature's queue run sequentially on that client. It is not a global server lock.

On a player client, the click emits a socket request naming the damage card, defender token, user, and active GM. The GM handler checks the destination, user activity, and card before calling `useFount`, which checks ownership and the saved entry again.

The use workflow then:

1. Resolves the stored actor, spell, attacker, and native activity.
2. Reserves the Reaction through `recordReactionUse`. When combat tracking applies, it verifies that this card obtained the marker.
3. Copies the source spell data with `toObject`, keeps the chosen activity, and configures that temporary copy for this triggered use. It does not edit the owned spell.
4. Uses the temporary Item's activity with the captured attacker in `system.targets`, without spending another spell slot or starting concentration.
5. After a result message exists, writes `fountMoonlightUsed` on the incoming damage card.
6. Requests a targeted card refresh. The used flag causes the button to disappear.

The temporary Item is parented to the source spell's actor. Reaction reservation uses the damaged form's actor. This preserves the distinction between the spell source and the form using the Reaction.

`async` marks a function that returns a Promise. `await` waits for a Promise to settle before continuing that function; it does not freeze Foundry's entire interface. The `finally` block runs on success or failure. If no result message was committed, it disables a Reaction marker reserved for this card, then requests the refresh.

Creating the result message is the commit boundary in this implementation. A later failure to write the used flag does not refund that already-published reaction. This guide does not imply a transaction covering every possible downstream failure or automatic Undo of the reaction.

## Verification and its limits

Local regression coverage exercises snapshot range, ownership, used-button filtering, effect loss, movement, the native marker name, original-Druid spell lookup, pending-roll completion, and preservation of the original snapshot during corrections. These are mocked checks; the local fixture does not establish complete end-to-end socket, native save/effect, or rollback behavior.

During this chat, the user confirmed that the prompt appeared after the pending-card fix. That confirms the previously missing prompt in their Foundry session. It does not separately confirm every range edge case, reaction-spending failure path, or the final Blinded effect and its expiry.

When making the next change, trace both the successful use and the failure path. Keep the captured eligibility separate from live spending checks, and keep incoming HP automation independent of this follow-up.
