# Shared activity cards: relationships, targets, and reusable helpers

[Guide index](README.md) · [Module map](module-map.md) · [Source](../../scripts/shared-activity-card.js)

Source reviewed **2026-11-09**, on `v1.0.1-dev`. This guide describes the current implementation. Code excerpts preserve the source's expressions, with spacing expanded where helpful. Diagrams and worked examples are conceptual.

## What this file contributes

A single action can produce several messages: a usage card, multiple attacks, saves, and damage or healing cards. Features need to agree about which messages belong together, who was targeted, and whether a result can still be corrected.

`shared-activity-card.js` provides those shared decisions. It also contains several supporting tools used beyond chat cards. It does not have one master function that runs the entire action.

| Responsibility | Exported functions |
| --- | --- |
| Discover startup actors | `startupActors` |
| Connect HP cards to a roll | `linkedHpCards`, `invalidateLinkedHpIndex` |
| Decide whether a roll adjustment is locked | `isRollAdjustmentLocked` |
| Classify cards | `isDamageOrHealingCard`, `isHealingCard` |
| Decide target eligibility | `isEligibleTarget`, `isEligibleHealingTarget` |
| Compare effects | `equivalentEffect`, `hasEquivalentActiveEffect` |
| Interpret Region effects and caster identity | `regionOwnsEffect`, `regionEffectDispositions`, `resolveRegionCaster` |
| Group and extend shared cards | `getSharedCardKey`, `describeTarget`, `mergeTargets`, `appendSharedTarget`, `refreshSharedTargets` |
| Serialize tasks for a caller | `createEventQueue` |

`export` lets another module import a function. Private helpers such as `cardOrigin`, `indexedHpCards`, and `effectSources` support the exports inside this file.

## 1. Think of the cards as connected documents

```text
Usage U
  |-- Attack A ---- Damage D1 (damageAttackId = A)
  |-- Attack B ---- Damage D2 (damageAttackId = B)
  `-- Save S

The roll cards can share system.origin = U.
An explicit damageAttackId identifies a particular attack within that group.
```

The display can group these cards, but the individual messages retain their own IDs and state. Matching totals, nearby placement in chat, and the player's current token selection do not establish a relationship.

The private `cardOrigin` accepts either a message object or a string reference from `system.origin`. It strips a leading `ChatMessage.` when resolving a string through `game.messages`.

### `linkedHpCards`: find the relevant HP results

The function follows this order:

1. If given a damage or healing card, return that card in an array.
2. Otherwise use the usage card itself, or resolve the roll's origin. Without an origin, return an empty array.
3. Check the supported rider metadata for a direct `damageId`: Stunning Strike, Grapple Strike, maneuvers, Cunning Strike saves, and Death Strike saves. If its message exists, return it directly.
4. Retrieve the origin's damage/healing cards from the local index.
5. For an attack, narrow that list to its damage relationship.

The attack-specific selection is this source excerpt:

```js
const explicit=card.getFlag?.("ugmuls-5-5e-automation","damageAttackId");
if(explicit)return explicit===roll.id;
const preceding=attacks.filter(attack=>attack.timestamp<=card.timestamp)
  .sort((a,b)=>b.timestamp-a.timestamp)[0];
return preceding?.id===roll.id;
```

An explicit link wins. When it is absent, the current fallback chooses the latest attack under the same origin whose timestamp is no later than the HP card's timestamp. This is a chronological fallback, not proof that it can disambiguate every unusual publication order. Do not copy it into new feature-specific scans or replace stronger recorded links with it.

`filter` creates the candidate list. `sort((a,b)=>b.timestamp-a.timestamp)` orders it newest first; `[0]` selects the first element. `?.id` safely handles an empty result. `===` compares the IDs without converting their types.

### The HP-card index avoids repeating the same history scan

`indexedHpCards` builds a `Map` from origin IDs to arrays of HP cards. The first lookup enumerates `game.messages`; subsequent lookups reuse that grouping until invalidated. This private index is separate from [chat-message-index.js](../../scripts/chat-message-index.js).

It rebuilds when the collection identity or size changes, or when `invalidateLinkedHpIndex` clears it. The `ready` listeners invalidate on message creation/deletion and on updates that change type or origin, including supported flattened and nested update forms.

Target changes and HP-history flags do not alter which origin owns a card, so they do not by themselves rebuild this index. The arrays contain live document references: current flags can be read without rebuilding the relationship map.

That distinction is central: **cache the relationships, not a permanent answer about whether Undo has unlocked a roll.**

## 2. `isRollAdjustmentLocked`: ask whether an outcome is already committed

A lock protects an applied result from a correction that would make its HP/effects disagree with the roll. The helper returns a Boolean; it does not Undo anything or prevent edits by itself. Callers must use its answer in their own eligibility and authoritative action checks.

| Case | Current lock behavior |
| --- | --- |
| Save or its origin has `outcomeEffectsApplied` or nonempty `effectUndoHistory` | Locked. This also covers ordinary effect-only saves without a damage card. |
| Supported independent rider save: Stunning Strike, Grapple Strike, maneuver, or Cunning Strike | After the direct save/origin check, return its origin's effect-applied/history state rather than locking merely because weapon HP remains applied. |
| Related HP card has `hpApplicationRecorded` or nonempty `damageUndoHistory` | Locked, except cards marked `masteryGrazeUndone` are skipped by this final check. |
| Ordinary save with effects recorded on a related HP card | Locked. |
| Attack with a related HP card whose effect history includes `weaponFeat` | Locked. This branch specifically recognizes that marker; it is not a blanket lock for every effect on every attack origin. |

Partial Undo can leave a history entry and therefore retain the lock. Complete restoration can clear the relevant state and unlock it; reapplication can lock it again. The rules differ for independent rider saves, so inspect the branch before extending it to another feature.

The `ready` hooks also request deferred refreshes of associated attacks/saves and their source when relevant module flags change. That updates button presentation through [chat-refresh.js](../../scripts/chat-refresh.js); the refresh request is not the authority check.

### Representative callers

```text
Shield -------------------- isRollAdjustmentLocked + describeTarget
Bardic Inspiration -------- isRollAdjustmentLocked + createEventQueue
Fount of Moonlight --------- describeTarget + createEventQueue + isHealingCard
Region event workflow ----- getSharedCardKey + appendSharedTarget
Effect automation --------- hasEquivalentActiveEffect + regionOwnsEffect
```

See [Shield](../../scripts/shield-reaction.js), [Bardic Inspiration](../../scripts/bardic-inspiration.js), [Fount](../../scripts/fount-of-moonlight.js), the [main Region workflow](../../scripts/ugmuls-5-5e-automation.js), and [effect automation](../../scripts/effect-automation.js). These are examples, not the complete caller list.

Fount does not use the adjustment lock for its follow-up: it does not change the incoming damage roll. Its [walkthrough](fount-of-moonlight.md) explains that distinction.

## 3. Classify the card and choose the right eligibility rule

`isDamageOrHealingCard` checks the message type. `isHealingCard` additionally recognizes a healing system flag, a heal activity, or a damage-typed card whose listed roll types are all `healing`/`temphp`. A damage-typed card with no listed types is not classified as healing by that final branch. These checks help damage reactions avoid healing rolls.

The target helpers deliberately differ:

- `isEligibleHealingTarget` requires an actor and a token that is not explicitly hidden. It does not reject a creature just because HP is zero.
- `isEligibleTarget` also rejects numeric HP at or below zero, `dead`/`defeated` statuses, and defeated combatants. It checks token/combatant information and searches the available combats for the matching token.

Both normalize a canvas Token to its document when supplied. Neither is a universal permission, range, or line-of-sight check. The caller adds the rules appropriate to its feature.

## 4. Shared cards: one recorded roll, additional recipients

`getSharedCardKey` returns a JSON string containing combat ID, round, turn, spell UUID, Region UUID, and trigger ID. The event's combat/round/turn data can override the passed current combat values.

No valid grouping key is returned without the required combat identity and timing or an enabled sharing policy. A compatibility branch also preserves attached Conjure Animals pack sharing when `oncePerTurn` is enabled, even for the older saved configuration described in the source comment.

The key identifies a group; this helper does not find a card or enforce the once-per-creature trigger limit itself. The main Region workflow uses that key to find an existing card and then calls `appendSharedTarget`.

### A descriptor stores identity and presentation

`describeTarget` requires Actor and Token UUIDs and produces the stored descriptor:

```js
return {
    actor: actor.uuid,
    token: token.uuid,
    name: token.name,
    img: token.texture?.src,
    ac: actor.statuses?.has("coverTotal") ? null : actor.system?.attributes?.ac?.value ?? null
};
```

This stores references and display data, not the whole actor. `condition ? first : second` is a **ternary expression**: total cover gives `null` AC; otherwise it reads AC with a `null` fallback.

`mergeTargets` shallow-copies existing descriptors and adds a new descriptor only when its Token UUID is absent:

```js
const merged = Array.from(targets ?? [], target => ({ ...target }));
if (!merged.some(target => target.token === descriptor.token)) merged.push(descriptor);
return merged;
```

`Array.from` creates an array, `...target` copies its properties into a new object, `some` asks whether any entry matches, and `push` appends. This is a shallow copy: nested objects would still be shared. An existing token's descriptor is not replaced with the new one.

### `appendSharedTarget` synchronizes without rerolling

The function updates the supplied message first. Its local `updateTarget` resolves existing recipients and removes a resolved exact token when it fails `isEligibleTarget`. Unresolved recipients, or resolutions with a different UUID, are retained by the current condition. Incoming additions are merged; this helper does not independently validate every new addition, so the caller's validation matters.

It writes `system.targets` and the module's `retargeted` flag only if the token list/order changes. It does not compare every presentation field in the descriptor when deciding whether to write.

After awaiting the initial update, it discovers related damage cards using both the native registry and `linkedHpCards`. Discovery happens afterward because updating the source can publish a pending damage card. It deduplicates by message ID and gives each damage card the source's full recorded recipient list.

It does not edit original dice, save outcomes, HP-application history, or the pending-damage session. It synchronizes damage cards here, not associated healing cards. A recipient newly eligible to save is prompted by the calling Region workflow, not by `mergeTargets`.

`refreshSharedTargets` acts only when the origin has `sharedCardPerTurn === true`. It sets the native tray's mode to `targeted`, preserving its existing `checked` Map so explicitly unchecked recipients stay unchecked. It requests refreshes for the card and, when different, its origin. It does not select today's targeted tokens as substitutes for the recorded list.

## 5. Effects and Regions: avoid overlapping application

| Helper | What it checks—and what it does not do |
| --- | --- |
| `equivalentEffect` | Rejects mismatched monster-fear source metadata first. Otherwise, shared effect/source UUIDs establish equivalence, or normalized names and JSON-serialized change arrays match. This is the module's specific comparison rule, not complete semantic equality of all effect fields. |
| `hasEquivalentActiveEffect` | Searches the actor's effects for an equivalent one that is not disabled, inactive, or expired. It does not create, remove, or replace effects. |
| `regionOwnsEffect` | Looks for the exact token's membership in a Region with an enabled native apply-effect behavior, matching disposition and effect-source reference. It does not infer Region membership merely from distance. |
| `regionEffectDispositions` | Converts configured targeting modes into disposition filters. An empty array means unrestricted here; `null` means a restricted filter could not be resolved because caster disposition is unavailable. These meanings are different. |
| `resolveRegionCaster` | Resolves the Region origin, returning a token-like result directly or finding a unique matching actor token in that Region's scene. It returns `null` when that token choice is ambiguous. |

For effect-source matching, `effectSources` constructs a `Set` from UUID, duplicate-source, and compendium-source references, dropping falsy entries. A `Set` keeps unique values; `.has(value)` checks membership.

These helpers help [effect automation](../../scripts/effect-automation.js) and [Region conditions](../../scripts/region-conditions.js) make decisions. The mutations and authority rules remain in those workflows. Effect comparison is also a potential source of assumptions when extending a feature: read exactly which identity and change fields it compares before relying on it.

## 6. `startupActors`: discover once, then forget the snapshot

Startup features can each need the world actors plus synthetic actors on scene tokens. This helper gathers both, deduplicates by Actor UUID using a `Map`, and returns an array frozen with `Object.freeze`.

The freeze protects the list from edits; it does not clone or freeze Actor documents. A cached snapshot is reused while its collection identities match, then cleared by `queueMicrotask`. Calls after that boundary discover actors again. Replacing a collection also forces a new snapshot.

This is a short-lived startup optimization, not a persistent actor registry. Do not assume that creating a token halfway through the cached window invalidates the list immediately; the later discovery pass is what picks it up.

## 7. `createEventQueue`: run one caller's tasks in order

The complete helper is small enough to read:

```js
export function createEventQueue() {
    let pending = Promise.resolve();
    return task => {
        const result = pending.then(task);
        // A failed event must not prevent subsequent events from executing.
        pending = result.catch(() => {});
        return result;
    };
}
```

Calling it creates a **closure**: the returned function keeps access to that particular `pending` variable. A feature commonly stores the result as `enqueue`.

`Promise.resolve()` starts an already-resolved chain. `.then(task)` schedules the next task after the previous chain settles. The recovered `pending` chain allows later tasks to continue after a failure, but `return result` still lets the original caller observe that task's rejection and report it.

Every call to `createEventQueue()` creates a separate queue. It does not serialize all features, all browser clients, or a server. It also does not check authority, reserve resources, refund a failed mutation, or schedule chat rendering. Those remain the responsibility of the task and its surrounding workflow.

## What this file changes

Most exports only read documents or build values. The important exceptions and local state are:

- `appendSharedTarget` updates message target lists and `retargeted` flags.
- `refreshSharedTargets` updates the local native tray state and requests deferred renders.
- The registered message hooks invalidate the private link cache and request related-card refreshes.
- Startup discovery, the HP-link index, and each returned task queue keep local in-memory state.

There is no broad socket authority gate around all these exports. Do not treat importing a helper as permission to mutate someone else's document. Callers must arrange appropriate authority and validation.

## Verification and in-game reading exercise

Local test sources reviewed for this guide include `roll-adjustment-lock.test.mjs`, `shared-target-sync.test.mjs`, `startup-actor-discovery.test.mjs`, and `conjure-animals-sharing.test.mjs`. They cover relationships/explicit links and fallback, partial/complete Undo locks, effect-only saves, index work counts/invalidation, target synchronization, late pending-card discovery, preserved dice/history/session, actor discovery, and shared Region grouping. Tests and tooling remain local and Git-ignored.

Those fixtures do not prove every export is fully covered. In particular, reviewing the named files does not establish complete effect-equivalence, Region-caster ambiguity, or cross-client queue coverage. Consult the local runner and actual assertions before claiming coverage for a future change.

On **2026-11-09**, the following targeted run passed: **4 test files, 0 failed**.

```text
node tools/run-tests.mjs --filter roll-adjustment-lock --filter shared-target-sync --filter startup-actor-discovery --filter conjure-animals-sharing
```

Local documentation checks also verified the Markdown file links, all four JavaScript excerpts against the current source (ignoring whitespace), and inclusion of every exported function name. This was a documentation-only change; the full suite was not rerun for it, and no new in-game verification was performed.

For an in-game learning session, these are planned observations, not newly performed checks:

| Exercise | What to watch |
| --- | --- |
| Make two attacks under one usage, then apply damage for one | Its correction controls lock without incorrectly locking the other attack. |
| Undo applied damage, including a partial-history case if supported by that workflow | Controls follow the remaining recorded state; complete Undo restores appropriate corrections. |
| Apply and Undo a save-only effect | Save corrections respond even when there is no HP card. |
| Add recipients to a supported shared Region card after its damage roll exists | New recipients join the same recorded roll; old dice/history remain; previously unchecked recipients remain unchecked. |
| Use an independent rider save after weapon damage is applied | Its own effect history governs the supported save adjustment path. |

Record the feature, settings, GM/player role, and observed results. Do not infer server timing or performance gains from the guide or a passing local fixture.

## Review findings and next reading

The mix of card, actor-discovery, effect, Region, and queue helpers is recorded as [IMP-002: review shared-helper responsibilities](../improvement-notes/IMP-002-shared-helper-boundaries.md). This is a future organizational proposal, not a change made by this guide.

Next, read [Pending casts and damage](pending-cast-and-damage.md) with these relationships in mind: which message already exists, what its session identifies, and what changes together when an unfinished action completes.
