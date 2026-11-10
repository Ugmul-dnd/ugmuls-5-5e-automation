# Presentation and animation

[Guide index](README.md) · [Post-roll controls](post-roll-controls.md) · [Finding/refreshing cards](finding-and-refreshing-cards.md)

These scripts decide how existing cards are presented and when the next visible step can proceed. A stored roll, its rendered HTML, its dice animation, and applied HP are distinct states. Keeping those distinctions prevents disappearing controls, duplicate prompts, and results appearing before the viewer's dice finish.

**Source reviewed:** 2026-11-10, `v1.0.1-dev`. Documentation only; no runtime changes or new measured performance claims.

## 1. Responsibility map

| Source | Responsibility |
| --- | --- |
| [card-presentation.js](../../scripts/card-presentation.js) | Card classes, recorded-target display defaults, source/result handoff, pending saves, tags, attack Damage action, and scrolling helpers. |
| [animation-wait.js](../../scripts/animation-wait.js) | Visibility/focus-aware local waits, client animation acknowledgments, and the current user's Dice So Nice inactive-tab preference. |
| [negative-damage-display.js](../../scripts/negative-damage-display.js) | Add subtraction signs to safely mapped tooltip dice without changing rolls. |
| [critical-button-highlight.js](../../scripts/critical-button-highlight.js) | Fill an unpainted native Critical recommendation using AC5E's configured colors. |
| [npc-damage-automation.js](../../scripts/npc-damage-automation.js) | Coordinate relevant roll-animation completion across clients before supported workflow mutations. |
| [damage-prompts.js](../../scripts/damage-prompts.js), [pending-damage.js](../../scripts/pending-damage.js), [save-roll-controls.js](../../scripts/save-roll-controls.js) | Native animation observation, pending-result publication/replay prevention, and added-d20 tracking. |
| [card-presentation.css](../../styles/card-presentation.css), [save-roll-controls.css](../../styles/save-roll-controls.css) | Colors, action layout, borders, hidden source state, tooltip details, and expanding menus. |

Card presentation and animation wait are manifest-loaded. The main script imports the negative-damage and Critical-highlight modules. The support workflows above have their own guides; this one follows their presentation connections rather than every mutation/resource path.

Most render work changes DOM or local state. The Damage button is a user action that can start a native roll, and inactive-tab setup can write a user preference. Calling the whole file “display only” would hide those distinctions.

## 2. Recorded does not mean visible

`attackCardProgress` returns four facts for an attack usage: whether associated attack/damage cards exist, and whether any of those cards count as visibly presented. It uses `rollCardVisible` for the latter.

That helper checks connected DOM nodes bearing the message ID, Dice So Nice hiding, and explicit hidden/display/visibility state on ancestors. It deliberately does not measure geometry during render. It respects Dice So Nice's immediate-chat-display setting when evaluating an animating result.

Excerpt from `card-presentation.js`:

```js
    if(message?._dice3danimating&&game.settings.get("dice-so-nice","immediatelyDisplayChatMessages")!==true)return false;
```

`?.` safely reads the property when the object exists. `&&` requires both conditions. `!== true` treats only explicit true as enabling this exception. The helper is inspecting presentation state; it does not evaluate dice or apply damage.

There is also an important exception for this module's own processed-source markers: its earlier hiding must not make the next visibility check reverse a completed handoff. External hidden ancestors still matter. This is a targeted DOM-state test, not a universal browser visibility/occlusion calculation.

## 3. Simplify attack cards while preserving their documents

`styleActivityCard` runs on `dnd5e.renderChatMessage`, after the system supplies the card template. It first inspects progress, then applies target defaults, retired-Graze visibility, tags, pending saves, and action/roll CSS classes. It also styles inline `.card-summary[data-message-id]` entries.

With `simplifyAttackCards` enabled, the attack usage handoff works as follows:

1. Restore only hiding previously marked as this module's own work.
2. Hide the base Attack/Damage action once the corresponding associated result is recorded, preventing another roll from that old source control.
3. If an attack exists but is not presented yet, keep the source face and show “Pending — waiting for the attack result.”
4. Once the attack is visible, hide the redundant base face when inline summaries are present; otherwise hide the outer usage card.
5. Preserve message documents, origin links, targets, dice, and application history. Deleting a result can restore the source controls on a subsequent render.

This module enhances native grouping; it does not replace the system's grouping engine. Hiding an outer message indiscriminately would also hide any grouped results inside it, which is why base-face versus outer-card handling matters.

`hideUndoneGraze` separately hides retired damage entries flagged `masteryGrazeUndone`. It does not delete their stored roll.

### Refresh the origin after insertion or animation

The private `refreshOrigin` responds to render, message create/update/delete, and Dice So Nice completion. Native render hooks can run before DOM insertion, so it defers to a frame before reevaluating presentation. Dice So Nice completion also uses a deferred callback because its animation flag is cleared after listeners are notified.

It guards same-message work in flight and compares a signature containing message existence, visible state, animation state, modification time, and totals. A stable rerender does not keep requesting its origin forever. Grouped saves still trigger completion refresh even when they have no standalone visible message node.

Known-card requests go through `Ugmuls55eAutomationChatRefresh.card`. Damage presentation also requests associated attack refreshes. This reuses the shared bounded queue, rather than adding a recent-chat scan. A separate Seeking Spell flag path directly refreshes linked damage tags; it is not a general resource/effect refresh loop.

## 4. Recorded targets and pending save rows

`defaultSpellTargetDisplay` initializes supported cards with actual recorded recipients to native targeted mode. Its `WeakSet` tracks initialization per message object, allowing later manual tray-mode changes. Spell and named feature/monster-area cases are supported; this is not a blanket rule for every weapon card.

It changes local `_targetState` and connected `recorded-targets` elements through their native setter. It does not replace persisted `system.targets` with the user's current map selection. Empty lists remain uninitialized until recipients arrive. See [Target selection and correction](target-selection-and-correction.md).

`showPendingSaves` rebuilds pending rows on save-usage cards from `requestedSaveTargets`, recorded targets, associated saves, and current outcomes. It uses recorded target order/names, not a new map selection.

An outcome can be known before its dice finish. While that target's save is animating, the helper retains a pending placeholder, replacing premature inline result markup for this render. A matching completed summary can then occupy that position.

The pending row's button calls the existing `Ugmuls55eAutomationRepromptSave` workflow. It is disabled during animation and gated in presentation by GM/source author/target ownership. Authoritative retry validation remains in the save-prompt handler; the presence of a button is not sufficient permission to submit a result.

## 5. Explain the roll without changing it

`metamagicDeclarationTags` reads supported cast-time declarations from usage cards. `metamagicDamageTags` walks the recorded origin chain with a cycle guard to distinguish inherited casting choices from result-specific changes.

Examples include cast-wide Transmuted/Quickened/Careful data versus this damage roll's selected Smite/Empowered state. Seeking Spell/maneuver tags consult the linked attack, preferring `damageAttackId` and retaining the supported preceding-attack fallback. A sibling damage roll should not claim another roll's spent Smite.

`addMetamagicTags` removes its prior pills, checks content visibility, and recreates labels/tooltips in the existing native property list. These labels describe recorded choices; they do not spend Sorcery Points or apply the named effect.

`damageDiceSigns` maps tooltip dice in native reverse term order and identifies supported additive/subtractive signs. `renderNegativeDamage` / `renderDamageSigns` add a minus sign and explanation only when the tooltip structure maps safely, including supported aggregate display. They avoid duplicate marks and hidden content; ambiguous complex/pool layouts remain native rather than labeling an unrelated die. The stored total and roll terms stay unchanged.

`highlightCriticalButton` runs after the native damage configuration dialog renders. It checks current native/AC5E recommendation and coloring settings, leaves AC5E-owned painted controls alone, and restores its previous inline styles when its own fallback no longer applies. It changes no critical policy, roll mode, or keyboard focus.

## 6. The attack Damage button starts the existing workflow

`linkedAttackDamage` finds associated non-retired damage for the specific attack, preferring explicit `damageAttackId` and otherwise using associated attack timestamps. Equal totals are not identity.

The private `addAttackDamageButton` adds one control where the actor/card access, content, native damage configuration, and absence of linked damage permit it. `rollAttackCardDamage` independently checks its usage/activity access and existing damage.

On click, it installs a temporary `dnd5e.preRollDamageV2` hook scoped to the activity UUID. That hook supplies the usage origin, this attack's recorded recipients, and explicit attack link, then uses the shared damage-dialog configuration. It invokes the native chat action and unregisters the temporary hook in `finally` even when rolling fails/cancels.

This is a concrete example of presentation connecting to an authoritative workflow. The renderer does not roll dice simply because Foundry asks it to render again.

## 7. Scroll helpers follow a specific interaction

| Helper | Behavior and boundary |
| --- | --- |
| `followRollMenuExpansion` | On hover/focus near the chat bottom, observe menu growth and follow positive growth. Stop on wheel input, disconnection detection, or the short observation timeout. |
| `followChatCardChanges` | Near the bottom, follow the current chat scroller across card replacement. One follower per scroller; wheel, pointer, or keyboard interaction stops it. |
| `scrollOnChatTab` | When the Chat tab opens and its client setting is enabled, wait two frames and use native `scrollBottom({waitImages:true})`. A newer tab-change request invalidates the older one. |

Menu expansion uses `ResizeObserver`; the initial visibility detector does not. Reading geometry during a specific bounded menu interaction serves a different purpose from forcing layout on every card-render eligibility check.

`followChatCardChanges` returns a finishing callback rather than stopping immediately: calling it shortens the remaining follow window to include the tray's CSS expansion. The initial safety window is 10 seconds; the finish window is 800 ms. The menu observer uses 700 ms, and the helpers only begin when within 40 pixels of the bottom. These are current UI implementation choices, not performance benchmarks.

The global aliases `Ugmuls55eAutomationFollowRollMenu` and `Ugmuls55eAutomationFollowChatChanges` connect these functions to roll-mode menus, Undo controls, and pending-damage retry. They do not globally wrap chat scrolling or force a reader back to the bottom after deliberate interaction.

## 8. Local animation waits release on focus loss

`waitForVisibleAnimation` awaits an animation while the window is active. It returns promptly when already hidden/unfocused, or when visibility/focus changes while waiting. Its `finally` removes temporary listeners.

Excerpt from `animation-wait.js`:

```js
 try{visibility();await Promise.race([pending,background]);}
 finally{doc?.removeEventListener?.("visibilitychange",visibility);win?.removeEventListener?.("blur",blur);}
```

`Promise.race` finishes when the first competing promise settles. Here that means animation completion/error or the background-release signal. Returning from the wait does not cancel the original dice computation, reroll it, or guarantee that a renderer's internal work was canceled.

`waitForClientRollAnimations` includes the 100 ms Dice So Nice setup delay inside that visibility-aware wait. Already inactive clients bypass the delay, because background tabs may throttle timers. It resolves only existing, visible/content-permitted message IDs before invoking the supplied per-roll waiter.

`configureInactiveDice` has a separate job: when `backgroundAnimationSafety` is enabled and Dice So Nice is active, it sets **the current user's** `settings.skipAnimationOnInactiveTab` preference to true. It coalesces concurrent setup and avoids unchanged writes. Ready, Dice So Nice readiness, and relevant current-user updates can request setup.

Disabling that world setting stops preference enforcement; it does not restore the old per-user preference. The visibility-aware helper globals are still installed. Treat preference enforcement and the waiting mechanism as separate controls.

## 9. Coordinate clients before supported mutations

`waitForDamageAnimation` in the HP workflow combines added animation promises, tracked roll animations, and the existing `waitForAttackAnimation` observer. `save-roll-controls.js` exposes tracked Dice So Nice pipeline promises as `Ugmuls55eAutomationRollVisualWait`; `damage-prompts.js` observes native animation completion and cleans up its temporary hook.

`waitForWorkflowAnimations` collects relevant message/associated damage, healing, save, check, and selected rider-save IDs. It deduplicates remote IDs and sends a request to other active users while waiting locally.

The receiving animation handler validates the requesting active GM identity and request structure. It uses `Ugmuls55eAutomationClientRollWait` to filter permitted cards and acknowledge visible completion or inactive release. The coordinator tracks pending user IDs; disconnected users are removed. A connected client that fails to acknowledge within the current 30-second limit causes rejection rather than permission to apply early. Callers decide the resulting manual/failure recovery; see [Applying results and Undo](applying-results-and-undo.md).

Animation acknowledgment is not a reaction-choice timeout, resource reservation, or proof of completed HP/effect application. Roll/session/resource validation still belongs in the mutation workflow after asynchronous waits where required.

### Pending damage should not play twice

The pending-damage publication wrapper evaluates native result data without creating another result card, shows weapon/rider dice in one supported evaluated pool, then completes the existing pending card after its wait and fresh session checks.

`damageAnimationSignature` records formula/total/term/result state. `skipPendingDamageReplay` suppresses Dice So Nice preprocessing only when the stored handled signature matches the current rolls. This distinguishes the already displayed throw from a later changed roll. See [Pending casts and damage](pending-cast-and-damage.md) for takeover/publication identity.

The [Post-roll controls](post-roll-controls.md) guide documents another important boundary: added-d20 changes animate before their write, while critical damage corrections write before their extra animation. There is no single universal visual/commit order across every feature.

## Function reading checklist

For a quick source tour, follow the exported presentation functions in this order:

1. `rollCardVisible` → `attackCardProgress` → `styleActivityCard`.
2. `defaultSpellTargetDisplay` → `showPendingSaves` → `hideUndoneGraze`.
3. `metamagicDeclarationTags` → `metamagicDamageTags` → `addMetamagicTags`.
4. `linkedAttackDamage` → `rollAttackCardDamage`.
5. `followRollMenuExpansion` → `followChatCardChanges` → `scrollOnChatTab`.
6. `waitForVisibleAnimation` → `waitForClientRollAnimations` → `configureInactiveDice`.
7. `damageDiceSigns` → `renderNegativeDamage` → `renderDamageSigns`, then `highlightCriticalButton`.

At each step, identify whether the function reads document data, updates local/DOM state, registers a temporary callback, writes a preference, or starts a user-authorized workflow. That distinction is more useful than assuming every function in a presentation file does the same kind of work.

## Evidence and future checks

**Automated checks, 2026-11-10:** 12 selected local test files passed:

```text
node tools/run-tests.mjs --filter card-visibility-handoff --filter grouped-save-handoff --filter spell-target-display --filter metamagic-tags --filter metamagic-declarations --filter negative-damage-display --filter critical-button-highlight --filter animation-wait --filter background-animation-safety --filter pending-damage --filter wild-d100-animation
```

These cover stored/visible handoff, no layout measurement in the visibility detector, stable grouped-save completion, targeted-mode defaults, tag scope, negative dice/sign idempotency, AC5E highlight ownership, focus-aware wait cleanup, inactive acknowledgments/preference setup, pending publication, and selected animation integrations. Filename substring selection includes the escape-animation wait suite.

These are mocked/fixture checks, not screenshots, measured performance, exhaustive scrolling coverage, or proof of real multi-client timing. No new direct scrolling/unresponsive-client fault tests, full suite, or Foundry verification ran. Tests/tools remain local and ignored.

Future questions are recorded in [IMP-018](../improvement-notes/IMP-018-presentation-animation-contracts.md). These in-game scenarios remain unperformed in this pass:

- [ ] Compare grouped and standalone attacks/saves/damage with immediate chat display enabled/disabled. Source controls should hand off only when the appropriate presentation is ready.
- [ ] Complete two grouped saves, cancel/retry a pending save, then retarget away/back; inspect recorded recipients, placeholders, tags, and preserved original results.
- [ ] Check hover/focus menus, long cards, image loading, Undo/retry expansion, and opening/leaving Chat. Wheel/pointer/keyboard interaction should stop interaction-specific following.
- [ ] Inspect blind/whispered/hidden content on owner, observer, and GM clients; acknowledgments must not reveal roll contents.
- [ ] Alt-tab/minimize before and during setup/animation; verify visible clients finish while inactive clients do not stall the workflow or replay skipped dice later.
- [ ] Disconnect a client, then separately leave one connected but unresponsive; establish actual coordinator/manual recovery and pending request cleanup.
- [ ] Reopen/retry pending damage and perform supported post-roll corrections; check animation count, signatures, native dice, resource timing, and source links.
- [ ] Exercise aggregate damage reductions, complex tooltip pools, AC5E Critical coloring, and older/deleted result cards; inspect safe fallbacks and unchanged rolls.

For later performance work, compare the same large-battle scenario before and after. Source-level avoidance of a layout read or a passing mocked counter does not establish an observed speed improvement.
