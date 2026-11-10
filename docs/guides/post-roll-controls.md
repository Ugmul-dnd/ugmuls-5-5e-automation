# Post-roll controls

[Guide index](README.md) · [Target correction](target-selection-and-correction.md) · [Results and Undo](applying-results-and-undo.md)

These controls correct an already evaluated roll on its existing card. They preserve existing dice and add only the missing dice needed for a supported mode. They do not reverse HP, refund resources, or stand in for a feature's Reaction workflow.

**Source reviewed:** 2026-11-10, `v1.0.1-dev`. This documentation pass changes no runtime code.

## Start with two shared paths

| Visible controls | Main source | What changes |
| --- | --- | --- |
| ADV / NORMAL / DISADV on attacks and saves | [save-roll-controls.js](../../scripts/save-roll-controls.js) | Which cached d20 candidates are considered and which one counts. Despite its filename, this file handles attacks too. |
| NORMAL / CRITICAL on eligible damage | [damage-roll-controls.js](../../scripts/damage-roll-controls.js) | Native damage terms under the roll's critical policy, with exact previous modes cached. |

Both are manifest-loaded modules in [module.json](../../module.json). Both register settings at `init`, then rendering/socket listeners at `ready`. Their menus share [save-roll-controls.css](../../styles/save-roll-controls.css) and the optional scroll helper in [card-presentation.js](../../scripts/card-presentation.js).

The useful conceptual sequence is:

```text
Completed card renders
  -> check setting, visible content, permissions, supported roll, and locks
  -> create controls for that card or its inline summary
Click
  -> route to active GM when present, otherwise local handler
  -> serialize this module's requests
  -> copy/convert the evaluated roll
  -> recheck eligibility before writing
  -> update the existing card and relevant presentation
```

The two modules have separate queues. This is not a universal queue for every feature or client.

## Function map

| File | Functions | Responsibility |
| --- | --- | --- |
| Save controls | `saveModeLocked`, `canAdjustSave` | Feature-specific restrictions, shared application lock, card kind, and user access. |
| Save controls | `changeSaveMode` | Transform a completed native d20 roll without writing a message. |
| Save controls | `updateSaveMode` | Replace one indexed roll, update mode flavor, coordinate animation, and validate before commit. |
| Save controls | `trackRollAnimations`, `waitForTrackedRollAnimation`, `animateNewSaveDice` | Track Dice So Nice promises and show newly required d20s. |
| Save controls | `addSaveControls`, `refreshSaveSummary` | Render standalone/grouped menus and refresh an origin after a rolls-only update. |
| Damage controls | `isAttackDamage`, `canAdjustDamage` | Native critical eligibility, permissions, and application/critical-effect locks. |
| Damage controls | `changeDamageCritical` | Convert or restore an evaluated damage roll without writing a message. |
| Damage controls | `updateDamageCritical`, `addDamageModeControls` | Commit supported damage-roll corrections, animate additional dice, and render controls. |
| [d20-results.js](../../scripts/d20-results.js) | `finalD20Results`, `d20ResultValue` | Separate finalized candidates from reroll history and use effective clamped values. |
| [shared-activity-card.js](../../scripts/shared-activity-card.js) | `createEventQueue`, `linkedHpCards`, `isRollAdjustmentLocked` | Serialize each consumer's work and check current application state through shared card relationships. |

The distinction between `change...` and `update...` is important: a feature can reuse the roll transformation while retaining responsibility for its own validation, resources, and document update.

## 1. What permits or blocks a correction?

Ordinary access allows the GM, message author, or an owner of the associated Actor. Rendering additionally requires visible content. The setting and socket receiver checks are separate from the exported helpers; calling a helper is not permission to bypass the surrounding workflow.

`canAdjustSave` accepts attack/save cards and checks `isRollAdjustmentLocked`. It also excludes Careful Spell and automatic grapple failure, and consults per-roll `disciplinedSurvivor` / `restoreBalanceUsed` flags through `saveModeLocked`. A GM does not bypass those feature locks. The generic menu uses the first native d20 roll; programmatic callers can supply another index.

`canAdjustDamage` accepts attack damage and native damage activities with `damage.critical.allow === true`, such as a configured Divine Smite activity. Save damage, healing cards, Graze, and grapple-no-damage results are excluded by this eligibility path. It also blocks when recorded Crusher/Slasher critical effects must be undone first.

The shared application lock follows relevant linked HP/effect state. Recorded HP application or remaining HP Undo history locks linked corrections. Save effects can lock a save even without a damage card. Supported rider saves have a separate effect-history boundary, so undoing their effects can reopen the save while the weapon's HP remains applied. Exact links keep one attack's damage from unnecessarily locking a sibling attack.

Undo therefore reopens controls only when the relevant state permits it. A partial Undo can leave the lock in place; reapplication can lock it again. See [Results and Undo](applying-results-and-undo.md) for actual restoration.

## 2. d20 correction: reuse candidates instead of rerolling the action

`changeSaveMode` requires a completed native `D20Roll` and accepts mode `1` (Advantage), `0` (Normal), or `-1` (Disadvantage). An unchanged mode returns the existing roll.

For a change, it deserializes a deep copy. That preserves fixed modifiers and already evaluated bonus dice without mutating the message's current object before a successful update.

It then obtains the existing `rsaSaveDicePool`, or builds one from finalized d20 results. This pool includes candidates that can be reused across later switches; it is not simply the currently winning die.

Excerpt from `save-roll-controls.js`:

```js
    const count = mode === 0 ? 1 : mode === 1 && roll.options.elvenAccuracy ? 3 : 2;
```

The conditional operator `condition ? valueIfTrue : valueIfFalse` chooses a value. Here, Normal needs one candidate, Elven Accuracy Advantage needs three, and the other supported advantage/disadvantage modes need two.

If the pool is too small, the helper evaluates only the missing d20s. New dice receive supported Halfling Lucky and minimum/maximum rules, including Reliable Talent's minimum. It does not reroll the original bonus dice.

Normal uses the **first** candidate. Advantage uses the highest effective value; Disadvantage uses the lowest. Ties retain the first matching candidate. It updates native advantage options, active/discarded flags, formula, and total, then stores the pool for subsequent corrections.

For example, start with a Normal d20 of 8 and a fixed +5. Switching to Advantage adds one d20; if it is 17, the total becomes 22. Switching to Disadvantage uses the same 8 and 17, producing 13. Returning to Normal uses the first 8, also producing 13. None of those changes rerolls the +5 or creates another candidate once the required pool exists. This is a conceptual example, not a captured game roll.

### Why the tiny d20-results library matters

Foundry can mark minimum-adjusted results as `rerolled` while retaining an effective `count`. Treating every `rerolled` entry as obsolete would incorrectly drop some finalized dice.

`finalD20Results` handles that distinction. `d20ResultValue` uses a finite effective `count` when present, otherwise the visible face `result`. A face of 2 clamped to 10 must compare as 10 when choosing a winner. Genuine obsolete reroll history must still be excluded.

This helper is also imported by several feature-specific rerolls/bonuses. The small shared rule prevents each caller from inventing a different interpretation of native result flags.

## 3. Commit the indexed d20 and refresh its parent

`updateSaveMode` checks eligibility, transforms the selected roll, replaces that entry in a copied rolls array, and rewrites the Advantage/Disadvantage suffix in flavor. It animates newly added dice before the final write and can wait for coordinated workflow animation.

Immediately before committing, it checks eligibility again and invokes an optional caller-supplied validator:

```js
    if(!canAdjustSave(message,user,index)||!validate())return;
    await message.update({ ...updates, rolls, flavor });
    return true;
```

`||` means either failed condition is enough to return. `!` negates a value. `...updates` spreads additional fields supplied by a feature into the update object; `rolls` and `flavor` then provide the final values for those keys. `await` waits for this document update before returning success.

A feature can therefore include its used-marker in the same message write and supply a final snapshot/resource validator. Resource spending, Reaction reservation, failure refunds, and automation completion remain in that feature's handler. The shared helper does not perform them for every caller. It also does not require the generic hover-menu setting itself; the UI/socket path checks that setting, while a feature has its own authorization/settings.

`refreshSaveSummary` listens for attack/save updates containing `rolls` without a `system` field. Native system changes normally refresh descendants; rolls-only changes also need the origin's cached summary/outcomes invalidated. This handler invokes the origin's descendant-refresh method and updates that known origin card. It is a targeted correction refresh, separate from resource/effect-driven refresh selection.

## 4. Critical correction: preserve terms and cache complete modes

`changeDamageCritical` requires an evaluated native `DamageRoll`. It checks the roll's stored critical policy rather than assuming every activity doubles a hard-coded die size.

Before converting, it caches the current mode as a serialized snapshot. Snapshots omit `rsaDamageModes` itself to avoid recursively nesting the cache. If the requested mode already exists, it restores that exact snapshot.

Excerpt from `damage-roll-controls.js`:

```js
    if (cache[mode]) {
        const restored=roll.constructor.fromData(foundry.utils.deepClone(cache[mode]));restored.options.rsaDamageModes=cache;return restored;
    }
```

`cache[mode]` uses a variable as a property name, such as `cache["critical"]`. The restored roll gets the cache attached again, so future switches can continue to reuse both modes.

| Policy/path | Conversion behavior |
| --- | --- |
| Standard critical | Preserve existing dice and append only needed critical results. On a first downgrade, retain the required original result prefix, accounting for discarded reroll history. |
| Powerful critical | Add/remove the identifiable maximized numeric contribution while preserving ordinary rolled dice. |
| Multiply numeric | Follow the native policy, excluding identified Cutting Words/Parry numeric reductions from multiplication. |
| Savage Attacker | Convert both weapon-dice branches, recompute which branch wins, and preserve the non-weapon remainder. |
| Supported special dice | Preserve recognized Great Weapon Fighting/Elemental Adept minimums and Tavern Brawler reroll modifiers; account for Piercer's additional critical die. |

Unsupported critical bonus formulas, unsafe die counts, unrecognized complex modifiers, or ambiguous powerful-critical structures throw an error rather than guessing. Support for several explicit patterns is not support for arbitrary third-party roll expressions.

`updateDamageCritical` converts every native damage roll on that message, keeps other roll objects, rechecks eligibility, and writes the existing message's `rolls`. It then animates additional dice and refreshes the known origin. Unlike the d20 path, this path writes the corrected rolls **before** its extra-dice animation. Do not assume both paths have identical visual/commit order.

Changing damage mode does not change the attack's d20. Changing attack advantage through the generic controls does not, by itself, provide a universal synchronization of every previously rolled damage card. Feature workflows such as Warding Flare/Lucky explicitly handle their critical-downgrade connections.

## 5. Menus, socket authority, and animation

The settings `adjustSavingThrowAdvantage`, `adjustAttackRollAdvantage`, and `adjustDamageCritical` default to true. Changing them requests a chat rerender. Menus expand on hover or keyboard focus; reduced-motion CSS disables the transition.

The renderers inspect both standalone cards and visible `.card-summary[data-message-id]` entries. They avoid duplicate menus and remove existing menus when the shared adjustment lock applies. Save controls also avoid duplicating Tweaks' `.nd5t-retro-advantage` controls and disable mounted controls for the supported per-roll feature locks.

`followRollMenuExpansion`, exposed as `Ugmuls55eAutomationFollowRollMenu`, observes menu growth near the chat bottom and adjusts scrolling. It stops on wheel input or after its short observation window. That helper handles presentation, not roll eligibility or chat-history scanning.

Clicking disables the local menu and sends a request to the designated active GM when another client holds that role. Receivers validate destination/active GM, active requesting user, relevant setting, permission/lock, and mode/index or critical Boolean before enqueueing. Otherwise the local path uses the module's queue. The update helpers revalidate near the write, but the queues do not create a transaction across resources, cards, and unrelated feature modules.

`trackRollAnimations` wraps the Dice So Nice pipeline's enqueue method once and records its returned promises by message ID. `waitForTrackedRollAnimation` waits for the currently tracked set. At `ready`, it is exposed as `Ugmuls55eAutomationRollVisualWait` for other workflow coordination.

`animateNewSaveDice` shows only the new d20 candidates, retaining author, whisper, blind, message, and speaker context. Hidden clients avoid an indefinitely deferred local animation; supported workflow helpers coordinate visible clients. Optional d20 animation errors are logged without generating replacement dice or automatically repeating the adjustment. Real multiplayer animation timing still needs Foundry verification.

## 6. Who reuses these shared functions?

These are direct import connections found in source, not a claim that every caller has the same rules:

| Imported helper | Direct callers |
| --- | --- |
| `updateSaveMode` | [Lucky](../../scripts/lucky.js), [Restore Balance](../../scripts/restore-balance.js), [Steel Deflect](../../scripts/steel-deflect.js), [Warding Flare](../../scripts/warding-flare.js). Lucky/Restore Balance also import `saveModeLocked`; Warding Flare also imports `canAdjustSave`. |
| `animateNewSaveDice` | [Countercharm](../../scripts/countercharm.js), [Disciplined Survivor](../../scripts/disciplined-survivor.js), [Fanatical Focus](../../scripts/fanatical-focus.js), [Indomitable](../../scripts/indomitable.js), [Seeking Spell](../../scripts/seeking-spell.js), [Shared Resilience](../../scripts/shared-resilience.js). These feature rerolls retain their own transformation/resource rules. |
| `changeDamageCritical`, `isAttackDamage` | Warding Flare; its damage-sync helper is also reused by Lucky for critical downgrades. |

The caches create another connection worth recording: [Cutting Words](../../scripts/cutting-words.js), [Combat Inspiration](../../scripts/combat-inspiration.js), and [Empowered Spell](../../scripts/empowered-spell.js) explicitly remove `rsaDamageModes` when their adjustments would make an older damage snapshot stale. Feature-specific true d20 rerolls can replace the candidate pool instead of preserving the original alternatives.

Do not move all of this into a generic “reroll” helper just because it touches dice. Mode selection, an actual reroll, a numeric reduction, and critical conversion have different preservation rules. The future cache/caller audit is recorded in [IMP-016](../improvement-notes/IMP-016-roll-cache-and-commit-contracts.md).

## Evidence and future regression scenarios

**Automated checks, 2026-11-10:** 16 selected local test files passed in two sequential runs:

```text
node tools/run-tests.mjs --filter d20-minimum-adjustments --filter damage-critical-eligibility --filter disciplined-survivor-modes --filter savage-critical --filter steel-deflect --filter warding-flare --filter restore-balance --filter lucky --filter animation-wait --filter empowered-spell --filter cutting-words
node tools/run-tests.mjs --filter roll-adjustment-lock --filter combat-inspiration --filter parry --filter weapon-feats
```

The first selection discovered 12 files; the second discovered four. Filters use filename substrings, so `animation-wait` includes the escape-animation check. Coverage includes candidate/minimum handling, original bonuses/dice, exact cached critical restoration, supported critical policies, representative feature restrictions/resources, linked application locks, Undo reopening, and selected animation behavior. This does not establish exhaustive socket/render/cache-interaction coverage.

The local minimum-result test also reads Foundry's installed die implementation; it is more specific than a standalone invented minimum mock. Other scenarios use local fixtures/mocks. Tests/tools are ignored and may be absent from a fresh checkout.

No full suite or new in-game checks ran for this documentation-only pass. These planned Foundry checks remain unperformed:

- [ ] Switch Normal → Advantage → Disadvantage → Normal on attacks and saves; inspect first-die identity, bonus dice, candidate counts, totals, and no extra dice on return switches.
- [ ] Repeat with Elven Accuracy, Reliable Talent/minimums, Halfling Lucky, and AC5E cancellation. Check generic manual correction separately from rules-driven feature behavior.
- [ ] Switch normal/critical repeatedly with multiple damage types, powerful criticals, Savage Attacker, Piercer, and supported minimum modifiers; compare exact original and cached results.
- [ ] Verify graceful refusal for unsupported formulas without changing stored rolls or spending feature resources.
- [ ] Check standalone/grouped cards, hidden/blind/whispered results, Tweaks controls, hover/focus, and chat-bottom behavior.
- [ ] Apply HP/effects, partially Undo, fully Undo, and reapply; inspect which source and sibling controls lock/reopen.
- [ ] Test Lucky/Restore Balance/Warding Flare through their actual resource/Reaction workflows, including cancellation/failure and damage-critical synchronization.
- [ ] Apply a supported bonus/reduction/reroll between mode changes and verify no cache restores an obsolete result.
- [ ] Compare active GM/player, no active GM, two rapid requests, and focus loss during animations. Record actual client/role order before claiming timing guarantees.

For automation holds and resumption after an actual feature adjustment, read [Reactions and automation timing](reactions-and-automation-timing.md).
