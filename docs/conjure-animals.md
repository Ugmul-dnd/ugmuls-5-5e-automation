# Conjure Animals attached Region

The installed spell summons its Conjured Animals pack but neither the casting activity nor the pack’s Pack Damage activity has a template. The existing Region recipe therefore had nothing to attach its behaviors to.

Stamp the native summon token data with the spell, activity, cast level, source token, concentration effect and casting user. On token creation, the active GM validates the native summon origin, source spell, creator ownership, live concentration and current scene token before creating one native attached Emanation. Use the pack’s native save range for its radius (10 feet in the installed book), converted into scene units, with the full Large token as the Emanation base. Region attachment owns movement and token-deletion cleanup; concentration dependency and the existing spell cleanup own concentration-ending deletion. Do not add a second template-placement prompt.

The Region references the original caster’s spell/save activity and cast level, not a new damage helper. Existing entry/end-turn triggers, targeting settings, once-per-turn gating, save prompts and damage application/Undo continue through the shared Region engine. Preserve the configured save activity when resolvable; older saved recipes with obsolete labels can fall back to the exact save UUID recorded on an attached Conjure Animals Region. Cast-level scaling is explicit for the updated built-in recipe and for attached legacy recipes unless they explicitly disable it. Preserve casting-player routing when the GM creates the Region. The pack itself is excluded from its Region triggers.

Respect the Region library’s enabled and visibility settings. Duplicate async hooks and existing attached areas do not create duplicates. Scene-load recovery can create a missing Region for an existing natively linked pack with active concentration. Unlinked unrelated actors and expired concentration are ignored. Recheck the root identity after creation and clean up only newly created surviving Regions if concentration or the token vanished in flight. No per-turn actor/chat scan is added.

The integration preserves configured targeting and the native save/damage activity. A subsequent rules correction overrides that activity’s erroneous half damage on success as described below. The separate Strength-save advantage benefit is not added.

Verification: `tests/conjure-animals.test.mjs` covers player summon stamping and GM creation, native Large-pack geometry/attachment, exact source/save/cast/concentration links, recovery, duplicate/permission/stale guards, in-flight cleanup, older recipe resolution, actual shared-engine upcast invocation and player routing. Flaming Sphere and Guardian of Faith focused regressions also pass. Live Foundry verification remains pending.

## Shared damage on each combat turn

The earlier recipe enabled the per-creature turn limit but explicitly disabled card sharing. These are separate controls: once-per-turn stopped the same creature triggering twice, while non-sharing caused each new creature to get a new damage roll.

The built-in/starter Conjure Animals recipes now share cards. Attached pack Regions with once-per-turn enabled also share when an older saved recipe retains `shareCardPerTurn: false`. This compatibility rule is limited to Conjure Animals attached packs; unrelated spell and manual Region settings retain their behavior. Reuse the existing shared-key and target-append workflow: new entrants/end-turn targets join the original usage and damage cards, receive their own save, and use the existing damage dice. Preserve prior save outcomes and HP application/Undo records. A new combat turn gets a new shared key and roll, and different packs retain distinct sharing keys. No new message scan, rerender loop or damage adjustment is added.

`tests/conjure-animals-sharing.test.mjs` exercises the actual Region handler with concurrent targets, entry/end-turn events, repeat-target gating, unchanged original dice/outcomes/Undo, persisted-key recovery, new-turn rollover and unrelated/independent Region isolation.

## Moving the pack near stationary creatures

Core Region events describe affected-token entry/movement, which does not cover a creature remaining inside while the attached pack moves nearby. Listen to Foundry 14’s `moveToken` hook for actual passed waypoints on Conjure Animals packs. A scoped coordinate-update fallback handles direct API position changes and skips the native movement operation so it does not run twice.

Construct one non-persisted native Region at the pack’s document position, without attachment/dependency/behavior side effects. Refresh that temporary Region’s native shape constraints. Invert the pack’s traveled path for each eligible stationary creature and use core `testInsideRegion`/`segmentizeRegionMovementPath` to find overlap. This handles residents and creatures swept past even when the move ends outside their range. Teleport legs and position-less updates do not count as swept movement. Ordinary tokens and unrelated summons do not construct Regions or scan target geometry.

Only the designated spell executor processes the source movement, after checking the recipe, linked Region, concentration and current token. Dispatch `conjuredAnimalsMove` with the exact attached pack identity through the existing Region handler. That narrowly accepted event is independent of the user’s core Region event checkboxes, which do not represent this source-movement condition. Existing targeting policy, per-creature once-per-turn protection, shared dice/card, save prompts and damage/Undo remain shared across all three conditions. Movement events snapshot their combat turn and duplicate deliveries are suppressed. No automatic damage application or separate result card is added.

`tests/conjure-animals-movement.test.mjs` covers residents, swept paths, native geometry delegation/work counts, executor and concentration gates, teleports, unrelated movement and coordinate fallback. The sharing regression also verifies pack movement followed by entry/end-turn reuses the same damage card and rejects a mismatched source identity. Live Foundry verification of pack movement remains pending.

## Movement distinction and successful saves

Reject `tokenMoveWithin` and `tokenMoveOut` for 2024 Conjure Animals before consuming any turn allowance. Walking around inside, or leaving, is not the source-movement condition. Actual `tokenEnter`/`tokenMoveIn` entry, `tokenTurnEnd`, and the pack-only `conjuredAnimalsMove` remain valid, subject to the configured recipe and the shared turn limiter. Treat a legacy movement-damage checkbox as false for this spell; its save is not movement-distance damage. The source-movement helper can still identify the configured save when that old checkbox remains checked.

The installed spell save has `damage.onSave: half`, while its text and the native Pack Damage trait require no damage on success. Correct prepared Save activities for this enabled 2024 spell at preparation/use time, and force `system.onSave: none` in native damage-roll output, including stale explicit half values. Keep the original native save DC, damage dice, cast scaling, resource options, source message, targets and flags. Do not write to owned source items or paid compendiums. Unrelated spells, 2014 entries and disabled recipes retain native behavior. This applies to new rolls/cards and does not retroactively alter prior applied HP.

The sharing regression covers rejecting interior/exit movement without spending an allowance, retaining true entry, and sharing pack-movement results despite legacy options. `tests/conjure-animals-save.test.mjs` uses the installed native SaveActivity to verify prepared and damage-card output, preserved dice/origin/targets/flags, no source write and unrelated/legacy/disabled behavior.

## Late targets on the damage card

Shared-target append first updates the usage/save card, then discovers linked damage cards through native associations and the existing exact-origin HP-card index. This includes a pending damage card created while the save update was awaited. Merge the full recorded shared list into each linked damage card, so earlier missed recipients also catch up. Never infer linkage from totals or use the current map selection. Native/index duplicates update once; unrelated casts and healing cards are excluded.

Target-only updates switch shared cards back to their recorded-target display and request coalesced source/damage refreshes through `chat-refresh.js`, including grouped summaries. Preserve existing unchecked recipients, dice, outcomes, HP/Undo history and pending sessions. During pending roll publication, use the latest exact shared source’s target list instead of a stale dialog/placeholder list.

The link index remains invalidated on message creation/deletion and type/origin updates. Target and HP/flag updates do not change linkage, so they retain the index; HP/Undo lock checks still read live document state. `tests/shared-target-sync.test.mjs` checks exact links, late creation, full-list recovery, display state, duplicate updates, refresh batching and scan counts. The pending-damage regression also checks source-target changes during publication. Verification is automated; no live large-battle profiling or new in-game confirmation is claimed for this sync change.
