# Target selection and correction

[Guide index](README.md) · [Shared cards](shared-activity-card.md) · [Save and damage prompting](save-and-damage-prompting.md)

This guide follows how creatures become recipients of a card: initial map selection, live area preview, final area collection, optional confirmation, and deliberate Retarget corrections. These are related operations with different responsibilities.

**Source reviewed:** 2026-11-10, `v1.0.1-dev`. This is documentation of the working source, not a new release or a runtime change.

## Start with the different kinds of target state

| State | Where it lives | Meaning |
| --- | --- | --- |
| Current map targets | `game.user.targets` | This user's current token selection. It can change while placing an area or preparing another action. |
| Preview session | Local object in `region-target-preview.js` | Original selection, current provisional Regions, scene, and queued animation frame. |
| Confirmation choices | `TargetConfirmation` instance | Original cast targets, editable selections where permitted, and cast-time feature choices. |
| Recorded recipients | Chat message `system.targets` | Descriptors identifying the tokens/actors attached to this particular card. |
| Native target tray | Message `_targetState` | Local selection/check state used by card controls. It is distinct from both recipients and application history. |
| Applied results | HP/effect history and save outcomes | What has already happened. Replacing recipients does not undo it. |

A useful question while reading is: **Is this function reading live selection, recording recipients, or acting on an existing recorded result?** Changing map targets alone does not rewrite every old card.

## Files and entry points

| File | Read these first | Responsibility |
| --- | --- | --- |
| [target-use-guard.js](../../scripts/target-use-guard.js) | `needsSelectedTarget`, `targetUseWarning`, `guardTargetStart`, `guardScaledTargets`, `guardAttackTargets` | Reject missing targets and supported single-target mistakes before consumption/attack. |
| [area-target-confirmation.js](../../scripts/area-target-confirmation.js) | `prepareAreaConfirmation`, `confirmCastTargets`, `finishConfirmedCast`, `TargetConfirmation` | Hold subsequent rolls, collect recipients, obtain required choices, then release the cast. |
| Same file | `automaticTargetMode`, `allowsAutomaticTarget`, `collectAreaTargets`, `excludesMonsterAreaSource`, `excludesIntimidatingCaster` | Shared area filters and specific caster exclusions. |
| [region-target-preview.js](../../scripts/region-target-preview.js) | `prepareRegionTargetPreview`, `installRegionTargetPreview`, `previewPlacementOptions` | Connect a scoped casting configuration to native placement callbacks. |
| Same file | `startTargetPreview`, `queueTargetPreview`, `updateTargetPreview`, `stopTargetPreview` | Coalesce live selection updates and restore the original selection on exit. |
| [retarget-card.js](../../scripts/retarget-card.js) | `supportsRetarget`, `canRetargetCard`, `retargetSpellCard`, `receiveStrideRetarget`, `addRetargetButton`, `hideRemovedTargetSummaries` | Decide who can correct which card, update linked recipients, and present the controls/results. |
| [shared-activity-card.js](../../scripts/shared-activity-card.js) | `describeTarget`, `appendSharedTarget`, `refreshSharedTargets` | Make descriptors and extend shared-card recipient lists through the existing lookup/refresh paths. |

## 1. Guard the start without guessing the final scaled count

`target-use-guard.js` registers three checks at `ready`:

| Hook | Handler | Why this point matters |
| --- | --- | --- |
| `dnd5e.preUseActivity` | `guardTargetStart` | Check that a required selection exists, before pending-card publication. |
| `dnd5e.preActivityConsumption` | `guardScaledTargets` | Check the native scaled activity before spending resources. |
| `dnd5e.preRollAttackV2` | `guardAttackTargets` | Check the attack subject before rolling. |

Native slot scaling can change target formulas. The initial check therefore passes `scaled: false`; the later checks enforce the supported single-target restriction using the prepared count. This helper is not a universal validator for every multi-target budget. Words of Creation has its own validation and two-target rule.

Template activities, self targeting, and several feature-choice activities bypass the ordinary selected-creature requirement. Automated Region/rider uses and uses caused by another activity also bypass this guard; their recipient workflow supplies the context.

Excerpt from `target-use-guard.js`:

```js
function targetCount(message) {
    const targets = message?.data?.system?.targets ?? game.user.targets ?? [];
    return new Set(Array.from(targets, target => target.token ?? target.document?.uuid ?? target.uuid ?? target)).size;
}
```

`??` uses the next value only when the earlier one is `null` or `undefined`. An explicitly supplied empty target array stays empty. `Array.from` normalizes the collection and extracts identities; `new Set(...)` removes duplicates before `.size` counts them. This prevents duplicate references from looking like two different recipients.

## 2. Preview the area while it moves

Preview is a temporary view of likely recipients. The `previewRegionTargets` setting defaults to true; its setting text requests a server restart and client refresh after changes.

`prepareRegionTargetPreview` remembers eligible spell/feature casting configurations in a `WeakMap`. Installation wraps native template placement and Region-layer placement once per object, using `WeakSet` guards. Unrelated placement configurations keep their original path.

During a matching placement, `previewPlacementOptions` preserves the existing `onChange` callback and queues the new provisional Region geometry. `queueTargetPreview` stores Regions by placement index and schedules at most one animation frame at a time. The update uses the union of those Regions and only writes map selection when membership changes. This is placement work; it does not render chat cards or write document flags.

The wrapper uses `finally` to call `stopTargetPreview` even when native placement fails. Stopping cancels a pending frame and restores surviving token IDs from the original selection. If the scene changed, it avoids applying/restoring that selection into the other scene.

**The preview's final map selection is not the cast's final recorded list.** After placement ends, the normal post-use collector handles the actual created Regions.

## 3. Collect recipients from the actual Regions

Both preview and post-placement collection reuse `automaticTargetMode`, `collectAreaTargets`, and `excludesMonsterAreaSource`. This is a useful example of shared functions already living outside a single spell implementation.

The targeting mode considers activity configuration, Region recipes, and feature-specific overrides. It can select everyone, self, everyone except self, friendlies, hostiles, non-friendlies, or undead. These names describe code rules: for example, `hostilesOnly` compares token dispositions relative to the caster, rather than consulting a full relationship system.

`collectAreaTargets` requires the relevant damage/healing eligibility helper, visibility not explicitly false, allowed disposition/source rules, and native `token.testInsideRegion(region)` for at least one Region. It delegates geometry to Foundry. The collector itself adds no separate wall, distance, or line-of-sight calculation. Monster area-source exclusion and named feature exclusions are additional policies, not a universal rule to remove every caster.

`describeTarget` makes a descriptor containing actor UUID, token UUID, name, image, and AC information. The token identity keeps two tokens representing the same actor distinguishable.

## 4. Hold rolls, then confirm only when needed

The setting `confirmAreaTargets` is displayed as **Auto Target Spell/Feature Regions**. Its name can be misleading if read as “always show a confirmation window.” Ordinary supported areas collect targets and continue automatically. `requiresTargetConfirmation` requests a chooser for Choose Targets, applicable Metamagic, Sculpt Spells, and specific feature workflows. Some of those require choices even without an area or with automatic area targeting disabled.

The conceptual sequence is:

1. `prepareAreaConfirmation` marks `targetsConfirmationPending`, remembers whether subsequent actions should resume, and sets `usage.subsequentActions = false`.
2. `confirmCastTargets` runs for the message's author. It guards duplicate handling and adds the card ID to a local pending set, including recovery when a newly created Region exists without the original marker.
3. After yielding for geometry preparation, it collects actual Region occupants or uses the appropriate current selection. Ordinary areas finish directly. Choice workflows open `TargetConfirmation` or delegate to a feature's chooser.
4. `finishConfirmedCast` resolves token identities again, filters recipients, updates `system.targets`, handles applicable Careful Spell outcomes, clears pending/canceled flags, and fires `ugmuls55eAutomation.targetsConfirmed`.
5. When appropriate, it resumes the first attack, save-activity damage prompt, direct damage/healing roll, or a feature-specific healing path. Placement-only cards stop before these subsequent rolls.

Pending checks on `dnd5e.preRollDamageV2`, `dnd5e.preRollAttackV2`, and `dnd5e.preRollSavingThrowV2` return `false` while the originating card is pending. This combines local protection before flag acknowledgment with persisted card state.

Excerpt from `area-target-confirmation.js`:

```js
    pendingCards.delete(message.id);
    Hooks.callAll("ugmuls55eAutomation.targetsConfirmed", message);
    if(message.getFlag?.(MODULE_ID,"regionPlacementOnly"))return;
```

`Hooks.callAll` announces completion to listeners; it does not directly implement every downstream action. For example, the ordinary save scheduler listens for this signal. The following `return` prevents placement-only cards from reaching the roll-resumption code in this function.

Region/rider/recurring follow-ups generally keep their existing workflow rather than reopening initial cast confirmation. There is an explicit Life Transfer Death Burst exception because it starts a new area whose occupants must be collected.

### What the confirmation window actually lets you edit

Metamagic-only configuration normally retains the original cast list. Choose Targets and certain feature modes permit map additions/removals. Twinned Spell tracks additions while preserving original targets; Enhanced Necromancy has its own selection validation. A window appearing does not mean arbitrary recipient editing is permitted.

`choose()` returns a Promise that resolves with descriptors, or `null` when closed without confirmation. Awaiting it pauses this cast's continuation while Foundry can keep handling other work. A `committing` guard protects the confirm action during feature commits. Closing unregisters the window's temporary token/status hooks.

Cancellation/render errors ask the pending-cast workflow to cancel first. If that does not handle cancellation, the fallback marks confirmation canceled and clears pending state. Do not assume that fallback alone guarantees the pending-cast workflow's refunds and cleanup. See [pending casts](pending-cast-and-damage.md) and [failure-recovery finding](../improvement-notes/IMP-003-pending-failure-recovery.md).

## 5. Correct a card deliberately with Retarget

`addRetargetButton` runs on `dnd5e.renderChatMessage`, after the system injects its card template. Clicking reads the current map targets through `retargetSpellCard`'s default argument. It disables the clicked button during the operation; the generic update path also has a local per-message `WeakSet` guard.

Two separate questions come first:

- `supportsRetarget`: is this a supported kind of activity/card? Most ordinary controls belong to usage/attack cards. Enchantments, non-target feature choices, and manual recurring checks are excluded. Cavalcade uses its allocation editor; Land's Aid has independent routing; Instinctive Charm can grant scoped access to an enemy attack.
- `canRetargetCard`: does the current user have the relevant access? Ordinary paths allow GM/card owner. Destructive Stride has a specific actor-owner exception; Charm supplies its own grant. This helper is not, by itself, a universal content-visibility check.

### Which cards change together?

| Clicked card | Generic update scope |
| --- | --- |
| Usage | That usage and associated attacks, damage, and healing; retired Graze damage is excluded. |
| Attack | That attack and its associated damage, rather than every sibling attack. |

Attack damage prefers explicit `damageAttackId`. For native/manual damage without that flag, it falls back to the latest preceding associated attack timestamp. Missing timestamps are accepted only when there is one attack. This compatibility path does not match cards by equal roll totals.

Descriptors are filtered with damage/healing eligibility and deduplicated by token UUID. Each writable card gets new `system.targets`, the `retargeted` flag, and update option `rsaRetarget: true`. The native target tray changes to targeted mode and its checked choices are cleared.

Dice, save outcomes, consumed resources, and HP/effect application history remain intact. Attack presentation can evaluate the preserved roll against the new recipient's current AC. Removed recipients' inline save summaries are hidden by `hideRemovedTargetSummaries`, not deleted; retargeting back can reveal the original result again.

In [spell-save-prompts.js](../../scripts/spell-save-prompts.js), `rsaRetarget` cancels the scheduled automatic save timer and returns. Retarget does not automatically demand fresh saves. Use the appropriate card controls for further rolls.

### Permissions and failure boundaries

A non-GM generic correction skips linked cards they do not own and warns; it does not silently obtain a general GM proxy. The dedicated Destructive Stride route sends token UUIDs to the designated active GM. `receiveStrideRetarget` validates the requester, card grant, ownership, scene, and hidden-token restrictions before invoking the update path. Charm and Land's Aid delegate to their feature handlers.

Generic linked-card updates are awaited one at a time. The local guard prevents duplicate entry for that message on this client; it is not a transaction or a cross-client reservation. This file does not call the shared HP adjustment-lock helper. Retargeting is therefore not an Undo operation and must not be described as transferring previously applied damage to a new creature. The outstanding contract/coverage questions are recorded in [IMP-015](../improvement-notes/IMP-015-target-correction-contract.md).

## A related operation: append rather than replace

`appendSharedTarget` extends a shared card with another recorded recipient. It synchronizes damage using native associations plus the exact-origin linked-card index, discovering linked cards after the usage update so newly published pending damage can be included. It preserves dice, sessions, outcomes, and history.

Unlike ordinary Retarget's tray reset, `refreshSharedTargets` preserves explicit checked/unchecked choices for earlier recipients and requests deferred card refresh through `chat-refresh.js`. These paths should not be consolidated merely because both edit `system.targets`: adding the next Region recipient and replacing a cast's recipients have different semantics.

## Evidence and scenarios to revisit

**Automated checks, 2026-11-10:** nine selected local test files passed:

```text
node tools/run-tests.mjs --filter target-use-guard --filter cast-confirmation --filter region-target-preview --filter retarget-card-guard --filter stride-retarget --filter shared-target-sync --filter spell-target-display --filter twinned-spell --filter sculpt-spells
```

These cover initial/scaled guard cases, conditional confirmation and sequencing, fixed/editable target lists, preview filtering/coalescing/cleanup, scoped Retarget access, grouped controls, GM routing, shared recipient synchronization, recorded-target display, and selected Metamagic/Sculpt connections. They are mocked checks, not evidence that every failure path or real multiplayer timing is covered. Local tests/tools are ignored and may be absent from a fresh checkout.

No runtime code changed. No full-suite run or new in-game verification was performed for this documentation pass.

Use these as learning exercises and future regression scenarios. They remain **not run in Foundry in this pass**:

- [ ] Try missing selection, explicit empty card targets, a single-target attack, and a slot-scaled multi-target spell; inspect when consumption occurs.
- [ ] Move/rotate a multi-Region area, then confirm/cancel; compare preview selection, restored selection, and final recorded recipients. Repeat after scene change.
- [ ] Compare ordinary automatic area collection, Choose Targets, and Metamagic-only confirmation; check which window actually permits editing.
- [ ] Check friendly/hostile/neutral, hidden, defeated/healing, caster, and monster-source candidates against actual Region geometry.
- [ ] Retarget one attack in a multi-attack cast, including damage without an explicit attack flag; inspect sibling recipients and unchanged dice.
- [ ] Retarget away and back after saves; inspect hidden/restored summaries and ensure no automatic duplicate save prompt.
- [ ] Check grouped Land's Aid controls, Charm grants, mixed-owner linked cards, and owner-to-GM Stride routing.
- [ ] Establish approved behavior after HP/effects have been applied or while a pending roll/dialog exists, including Undo and a failed linked-card update. Record current results before proposing changes.

For actual HP/effect restoration, continue with [Applying results and Undo](applying-results-and-undo.md).
