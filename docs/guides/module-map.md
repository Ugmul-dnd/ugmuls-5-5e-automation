# Module map: from an action to its result

[Guide index](README.md) · [Fount of Moonlight example](fount-of-moonlight.md)

Source review: **2026-11-09**, `v1.0.1-dev`. This is an introductory map of selected shared workflows, not an inventory of all scripts.

For the first detailed shared-workflow guide, read [Shared activity cards](shared-activity-card.md).

For a section-by-section map of the long entry script and its Region engine, read [Main automation script](main-automation.md).

[Region library](region-library.md) explains where its effective recipes come from and how native sources are resolved.

Then follow the lifecycle of unfinished actions in [Pending casts and damage](pending-cast-and-damage.md).

[Finding and refreshing cards](finding-and-refreshing-cards.md) explains shared lookups and how visible controls update efficiently.

[Reactions and automation timing](reactions-and-automation-timing.md) explains resource reservation, stopping automatic application, and resuming after a committed adjustment.

[Applying results and Undo](applying-results-and-undo.md) follows HP/effect mutation, history, restoration, and manual reapplication.

[Save and damage prompting](save-and-damage-prompting.md) explains who receives each dialog, validation/retry paths, and native roll-source identity.

## 1. How the module starts

[module.json](../../module.json) lists JavaScript modules in `esmodules` and styles in `styles`. Foundry loads those modules. Their imports also load other files: [ugmuls-5-5e-automation.js](../../scripts/ugmuls-5-5e-automation.js) imports many individual features, including Fount of Moonlight.

There are therefore two places to check when asking how a script enters the application: the manifest and imports from already-loaded scripts. A feature does not need a second manifest entry if an existing entry imports it.

This actual import loads a feature for its setup work:

```js
import "./fount-of-moonlight.js";
```

There are no imported function names in this statement. Evaluating the file registers its hooks. Elsewhere, a named import makes a helper available to the importing file:

```js
import {reactionUsed,recordReactionUse} from './reaction-tracker.js';
```

In Fount, `Hooks.once('init', ...)` registers the setting. `Hooks.once('ready', ...)` installs the message listeners and socket handler. `once` runs the registration callback once; the `Hooks.on(...)` listeners installed inside it can respond repeatedly.

## 2. The documents we connect

| Term | Meaning in these workflows |
| --- | --- |
| Actor | A creature's game data, including resources, items, and effects. |
| Token | A creature's placed representation in a Scene, with position and an associated Actor. Unlinked tokens can have their own Actor data. |
| Item | A spell, weapon, or feature owned by an Actor, or another Item document such as a compendium entry. |
| Activity | A usable action on an Item: attack, save, utility, healing, and so on. One spell can contain several activities. |
| ActiveEffect | A document representing an ongoing benefit, condition, or tracker marker. |
| ChatMessage | The stored document behind a usage or roll card. Rendering turns its data into visible controls. |
| Flag | Extra document data stored under a namespace, such as `flags.ugmuls-5-5e-automation`. Flags can record snapshots, completed uses, or Undo history. |
| UUID | A document reference that includes its context. For example, `Actor.example.Item.spell` distinguishes an owned Item from one elsewhere. |

Actor and Token are different identities. Wild Shape makes that distinction especially important: the form receiving damage may use a spell retained on the original Druid. See `druidOwner` in [druid-damage.js](../../scripts/druid-damage.js).

## 3. Follow one action

For a typical attack, this is a useful conceptual sequence:

```text
Use an Item's Activity
  -> usage card and recorded targets
  -> attack roll and hit/miss result
  -> damage configuration and roll
  -> applicable reaction or adjustment decisions
  -> HP/effect application
  -> recorded history available to Undo
```

This is not one long function. Native D&D5e activities and this module's hooks cooperate across several documents and asynchronous steps. Saves, healing, Regions, and utility activities take different paths. Some reactions change a result before application; Fount's follow-up does not stop incoming damage.

Use the following files as starting points:

| Responsibility | Read first | Connection to understand |
| --- | --- | --- |
| Publish/cancel an unfinished activity use | [pending-cast.js](../../scripts/pending-cast.js) | The placeholder card, consumption deltas, tracked tasks, settlement, and cancellation refunds. |
| Finish a pending damage roll | [pending-damage.js](../../scripts/pending-damage.js) | The submitted session and user must match; rolls and flags change together on the existing card. |
| Preserve card relationships | [shared-activity-card.js](../../scripts/shared-activity-card.js) | `linkedHpCards`, `isRollAdjustmentLocked`, `describeTarget`, and target synchronization. |
| Find relevant messages | [chat-message-index.js](../../scripts/chat-message-index.js) | Shared indexes used instead of independent full-history scans in each feature. |
| Track Reaction use | [reaction-tracker.js](../../scripts/reaction-tracker.js) | Availability checks, reservation guards, and the `Reaction - used` effect. Tracking depends on settings and combat participation. |
| Decide whether automatic application should wait | [reactive-automation.js](../../scripts/reactive-automation.js) | Supported adjustment eligibility and completion; not every follow-up reaction is a blocker. |
| Apply automatic damage | [npc-damage-automation.js](../../scripts/npc-damage-automation.js) | Recorded targets, workflow prerequisites, animation coordination, and application history. |
| Apply activity effects | [effect-automation.js](../../scripts/effect-automation.js) | Native configured effects, targeting, policy holds, and Undo integration. |
| Restore recorded changes | [damage-undo.js](../../scripts/damage-undo.js) | Recorded HP changes and effect history; inspect the relevant handler before assuming an adjustment is reversible. |
| Refresh visible controls | [chat-refresh.js](../../scripts/chat-refresh.js) | Targeted requests, deduplication, bounded rendering batches, and failure isolation. |

## 4. Relationships matter more than matching numbers

Several attacks can share one usage card. `system.origin` connects a result to its originating message; the module's `damageAttackId` can identify the particular attack for damage. Recorded `system.targets` identify recipients. Equal roll totals do not establish any of these relationships.

`linkedHpCards` centralizes important relationship lookups. `isRollAdjustmentLocked` checks relevant applied state, including HP/effect history in the supported cases. A feature that changes a roll must respect those locks. A follow-up such as Fount can be allowed after HP application because it does not rewrite that damage roll.

## 5. Display and mutation are separate work

Rendering a button should not itself spend a resource or repeatedly write flags. It may run more than once, including inside a grouped `.card-summary[data-message-id]` card.

`chat-refresh.js` exposes two commonly used calls:

```js
globalThis.Ugmuls55eAutomationChatRefresh.request(featureKey, changedDocument);
globalThis.Ugmuls55eAutomationChatRefresh.card(card);
```

The first uses a registered feature rule to select affected cards. The second requests one known card. The current scheduler coalesces requests over 32 ms and renders in batches of eight, yielding between batches. These are implementation choices, not measured performance claims. The queue delays presentation; it must not delay authoritative resource spending or effect-expiry rules.

For mutations affecting other actors, read the feature's authority and socket checks. Fount, for example, routes a player's request to the active GM and validates the requesting user there. A visible or disabled browser button alone cannot enforce permissions or prevent duplicate spending.

## 6. A practical reading method

When opening an unfamiliar feature, find its imports, settings, and hook registrations first. Follow the callback named in the relevant hook. Then identify what it reads, what it writes, and which client is allowed to write it. Finally, look at cancellation, failure cleanup, and Undo separately from the successful path.

Keep a small list of the flags you encounter. Distinguish historical facts captured for a particular roll from live values, such as current resources. Rechecking the wrong one at the wrong time can change the rules of the feature.
