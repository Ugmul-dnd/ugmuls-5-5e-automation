# Reaction timing development

[Working reaction mapping and testing checklist](reaction-mapping-checklist.md)

Development branch: adv-combat-automation-dev. The prepared 1.1.0 release package is unchanged.

## Decision stages

| Stage | Visible information | Decision | Continue |
| --- | --- | --- | --- |
| Declaring Spell | Spell and caster, before native resource consumption and template placement | Counterspell, including chained responses | Players decline their own options with Decline Reaction; GM Decline Reaction continues all. |
| Declaring Attack | Attacker, activity and recorded target; no roll numbers, dice animation or hit/miss | Warding Flare, Lucky, Restore Balance and Steel Defender’s Deflect Attack | Decline Reaction advances to the outcome stage if another eligible defense remains; otherwise reveals normally. |
| Outcome: Attack Hit/Miss or Save Pass/Fail | After declaration choices finish, play the evaluated attack dice animation. During hit defenses the card shows Hit/Miss/Critical only; totals and dice details remain concealed until resolution. Saves show their normal dice, total and pass/fail result. Show Critical Hit explicitly. | Shield, Defensive Duelist, Parry, Deflect, Uncanny Dodge, Illusory Self and Instinctive Charm share the attack-hit decision. Flash of Genius and Indomitable share a per-target NPC-to-player failed-save decision. | Attacks: Decline Reaction (a miss only reveals). Saves: the GM’s Decline Reaction continues the entire group after optional adjustments. |
| Outcome: Damage Rolled | Damage dice and totals are visible; HP remains unapplied | Song of Defense, Bastion of Law and Cutting Words damage reduction | Use the ability, or Apply damage to continue without it. |
| Follow-up Actions / Riders | The resolved triggering action | Optional riders, redirects and follow-up attacks | Keep existing grouped controls; no extra mandatory pause by default. |

No timer or decline dialog. No eligible connected feature means no extra stop. Reaction availability is shared: choosing one defense removes other options using the same creature’s Reaction. Current attack pilots retain their single-target restriction; multiple-defender attack support remains planned. Save damage waits for every recorded target and pending animation, including area saves.

## Connected behavior

- Bastion of Law follows the same visible-damage timing as Song of Defense: hold automatic HP application, show the recipient and damage in the dice picker, then spend the chosen number of existing ward dice. The recipient can spend further batches on the same card while ward dice and unreduced damage remain; preserve each roll receipt and show a cumulative reduction. Cancellation spends nothing, and spending ward dice does not require a Reaction. Concealed/pending damage cannot offer or apply the reduction. Preserve native ward creation, exact-instance validation, per-recipient mitigation and Undo.

- Song of Defense is offered after damage is rolled and visible, before HP application. The Wizard sees the damage before choosing a native spell slot; cancellation spends nothing. Confirmation spends the slot and Reaction, then uses recipient-only native mitigation. The existing reactive governor holds automatic HP application while the choice is available. Previously published reservations remain finishable.

- Arcane Ward remains automatic after native mitigation, without a Reaction stop. Slot-funded Abjuration spells offer ward creation or recharge. Projected Ward reserves the helper’s Reaction at the hit decision and commits protection to the exact linked recipient; spend the shared ward pool during HP application, preserving overflow, source rest epoch and cross-actor Undo. Save-only damage retains its existing handling.

- Damage-reduction choices require a confirmed hit. Different helpers can reserve distinct reductions on the same single-target attack; each helper spends only one Reaction. Shield and reserved defenses recheck remaining captured participants before continuing. Resolve all reservations on the exact linked damage card, showing the original damage dice once.

- Protective Field uses the shared hit-stage reservation on single-target attacks, including criticals. Capture eligible Psi Warriors and the exact friendly recipient at attack creation; reserve the helper’s Reaction, then use its native Psionic Energy Die + Intelligence formula on the linked damage card. Keep the reduction recipient-specific, preserve original dice and Undo, and animate damage/reduction dice together. Save-only damage retains its existing workflow.

- Cutting Words reduces attack rolls at the hit decision, excluding criticals. Its damage option is offered after damage is rolled and visible, before HP application, using the existing reactive hold. Keep the native Inspiration use and helper Reaction, original dice, tooltip breakdown and Undo. Previously published pre-damage reservations remain finishable.

- Bardic Inspiration shares failed-attack and failed-save decisions using the recipient’s recorded grant, with no Reaction cost. An attack corrected to a hit proceeds through eligible defender choices. Combat Inspiration’s defensive AC choice spends that Valor-granted die without a Reaction on noncritical hits; its damage option stays in the initial damage configuration. Other Inspiration add-ons are unchanged.

- Attack dice animate once after declaration choices and before hit-stage defenses. A hit-stage-only pause animates on attack creation. Preserve roll privacy and any pre-existing animation skip setting; final card reveal does not replay the attack. Damage and save animations retain their existing timing.

- Spell Declared now connects Counterspell before native costs and template placement. An observable spell in active combat pauses only when an opposing combatant (friendly versus hostile token disposition) can see its caster, is within the native Counterspell range (normally 60 feet), and has a Reaction and valid casting resource. The native 2024 Constitution save determines whether casting stops or continues. Counterspell itself enters this declaration gate, allowing chains that resolve from the innermost response outward. A reserved Reaction cannot join another response while its casting decision is pending.
- NPC saves against players can pause independently on confirmed failures if Flash of Genius or Indomitable is available. Keep normal save results, totals and dice visible; hold only damage and effects until Decline Reaction or the final adjustment. Shared damage waits until all recorded targets have finished saving and any decisions/animations are complete. Decisions appear in the footer after all save rows. The GM/cast controller has one Decline Reaction control to decline the remaining group opportunities at once; individual defenders retain their own controls and permissions. After a feature is used, the active GM rechecks only that usage’s save windows: decisions whose resources or Reactions are exhausted close automatically; genuinely available options stay open. Flash preserves the dice; Indomitable uses its native reroll and Fighter-level bonus. If failure remains and another eligible option exists, keep the same decision open. Successful saves and failures without help bypass the decision. Damage resumes through the existing prompt guard on the source author; success with no damage on save skips the damage prompt.


- Warding Flare preserves the original attack dice and normal Advantage/Disadvantage cancellation. Its final result can proceed to the common Hit decision without animating early. Improved Flare temporary HP still finishes before damage.
- Shield and Defensive Duelist reuse native casting, resources and AC effects. Eligibility does not reveal whether the AC bonus will prevent the hit. AC-only choices skip criticals; eligible Parry and Deflect can still offer a Critical Hit decision.
- Parry and Deflect are chosen at Hit, before damage is rolled or displayed. The active GM reserves the native Reaction. The selected feature resolves automatically when the exact linked damage card is populated: no second damage decision. Parry spends its native Superiority Die at that point; Deflect retains its per-target reduction and optional Focus redirect.
- Closing the current unsubmitted damage dialog releases the reservation without spending a Superiority Die. Replacing a stale dialog does not release the new session’s reservation. Zero damage releases the reservation. If reduction fails, damage remains concealed; the GM can cancel the defense and reveal rather than silently apply full damage.
- Existing published windows remain finishable after reload. Whisper/blind recipients and original dice are retained. Presentation concealment uses ordinary Foundry documents; it does not replace private rolls.
- Source identities, target records, pending sessions, Apply and Undo remain authoritative. A declined window stays closed for that attack, including after Undo.

## Feature connection table

The machine-readable table is FEATURE_TIMINGS in scripts/reaction-timing.js. REACTION_TIMINGS defines connected window behavior. Corresponding feature scripts carry a Timing comment. **Planned means classified only:** its existing controls and legacy Smart Automation behavior remain active; it has no new staged pause yet. Trigger names are planning labels and still require native-rule review when connecting each feature.

| Feature | Stage | Trigger | Script | Connection |
| --- | --- | --- | --- | --- |
| Counterspell | declaring-spell | spell-declared | counterspell.js | connected: native 2024 CON save, PC/NPC, chains |
| Warding Flare | declaring-attack | attack-declared | warding-flare.js | connected |
| Shield | outcome | attack-hit | shield-reaction.js | connected |
| Defensive Duelist | outcome | attack-hit | defensive-duelist.js | connected |
| Parry | outcome | damage-visible | parry.js | connected: visible melee damage before Apply; legacy reservations supported |
| Deflect Attacks / Energy | outcome | attack-hit | deflect-attacks.js | connected |
| Illusory Self | outcome | attack-hit | illusory-self.js | connected |
| Instinctive Charm | outcome | attack-hit | instinctive-charm.js | connected |
| Unbreakable Majesty | outcome | first attack-hit per attacker/turn; mandatory before optional defenses | unbreakable-majesty.js | connected |
| Uncanny Dodge | outcome | attack-hit; select before damage reveal | uncanny-dodge.js | connected |
| Steel Defender: Deflect Attack | declaring-attack | attack-declared | steel-deflect.js | connected |
| Combat Inspiration | outcome | attack-hit AC; native damage rider unchanged | combat-inspiration.js | connected |
| Protective Field | outcome | reserve at hit before damage reveal; save-only damage retains legacy handling | protective-field.js | connected (attack path) |
| Projected Ward | outcome | reserve at hit before attack damage; save-only damage keeps existing handling | projected-ward.js | connected (attack path) |
| Song of Defense | outcome | visible damage / before HP application, attacks and saves | song-of-defense.js | connected |
| Bastion of Law | outcome | visible damage / before HP application, attacks and saves | bastion-of-law.js | connected |
| Beguiling Defenses | outcome | attack-hit | beguiling-defenses.js | connected: half damage, native WIS save and actual-damage retaliation |
| Investment Resistance | outcome | damage-visible | chain-investment.js | connected: Warlock Reaction, linked familiar only; before application |
| Superior Hunter’s Defense | outcome | damage-visible | superior-hunters-defense.js | connected: choose incoming damage type, Ranger Reaction; before application |
| Sentinel at Death’s Door | outcome | attack-hit | sentinel-at-deaths-door.js | connected: Bloodied friendly target within 60 feet; reserve Reaction before damage |
| Precision Attack | outcome | attack-miss | battlemaster.js | connected: native Superiority Die / Relentless; hit correction opens defender choices |
| Seeking Spell | outcome | attack-miss | seeking-spell.js | connected: spell attacks only; native reroll/cost, hit-stage handoff |
| Guided Strike | outcome | attack-miss | guided-strike.js | connected: Channel Divinity +10; allied use spends Reaction, hit opens defenses |
| Homing Strikes | outcome | attack-miss | homing-strikes.js | planned |
| Lucky | declaring-attack | attack-declared | lucky.js | connected |
| Flash of Genius | outcome | save-fail (checks retain native behavior) | flash-of-genius.js | connected: per-target NPC save |
| Fanatical Focus | outcome | save-fail | fanatical-focus.js | connected: once per active Rage, replacement d20 + Rage Damage bonus; no Reaction |
| Indomitable | outcome | save-fail | indomitable.js | connected: per-target NPC save |
| Disciplined Survivor | outcome | save-fail | disciplined-survivor.js | connected: visible failed save, 1 Focus Point, single-d20 reroll; no Reaction |
| Shared Resilience | outcome | save-fail | shared-resilience.js | connected: helper Reaction + Indomitable, visible ally within 60 feet; reroll + helper Fighter level |
| Countercharm | outcome | save-fail | countercharm.js | connected: configured charm/fear save, Bard Reaction, Advantage reroll for self/ally within 30 feet |
| Guarded Mind | outcome | save-fail | mage-slayer.js | connected: failed INT/WIS/CHA save becomes success; native Mage Slayer use, no reroll/Reaction |
| Dark One’s Own Luck | outcome | save-fail | dark-ones-own-luck.js | connected: failed saves only, native bonus/use, no reroll or Reaction; checks retain existing handling |
| Peerless Skill | outcome | attack-miss / check-fail | peerless-skill.js | planned |
| Bardic Inspiration | outcome | attack-miss / save-fail; checks retain existing handling | bardic-inspiration.js | connected |
| Cutting Words | outcome | attack-hit for attack reduction / visible damage before HP application for damage reduction | cutting-words.js | connected |
| Restore Balance | declaring-attack | attack-declared; save adjustment remains legacy | restore-balance.js | connected (attack only) |
| Bend Luck | outcome | attack-roll / save-roll | bend-luck.js | connected: player failure +die / enemy success −die; checks retain legacy handling |
| Cosmic Omen | outcome | attack-roll / save-roll | cosmic-omen.js | connected: Weal friendly failures / Woe hostile successes; checks and initiative retain existing handling |
| Empowered Spell | follow-up | damage-roll | empowered-spell.js | planned |
| Hand of Harm | follow-up | damage-rider | hand-of-harm.js | planned |
| Psionic Strike | follow-up | damage-rider | psionic-strike.js | planned |
| Rend Mind | follow-up | damage-rider | rend-mind.js | planned |
| Stalker’s Flurry | follow-up | attack-follow-up | stalkers-flurry.js | planned |
| Superior Hunter’s Prey | follow-up | damage-follow-up | superior-hunters-prey.js | planned |
| Elemental Rebuke | follow-up | damage-received | elemental-rebuke.js | planned |
| Brutal Strike effects | follow-up | hit-rider | brutal-strike.js | planned |
| Deflect Redirect | follow-up | zero-damage-deflect | deflect-attacks.js | planned |

## Monster reaction spells

Shield uses `reaction-spell-resources.js` for shared availability. Generated spells resolve their native linked Cast activity before any free/slotless fallback. They use that granting activity unchanged, so source consumption (including shared Protective Magic item uses or activity uses), scaling and cancellation stay native; exhausted or dangling grants never become unlimited child casts. NPCs with no configured spell-slot pool can use an unrestricted owned Shield spell without PC preparation or slots; the native cast uses a temporary innate clone. Configured item/activity uses remain finite, and legacy NPC slot pools still require available slots. An unsupported linked resource target is never silently discarded to grant unlimited casts. Character casting retains normal preparation, slot and free-use checks. Counterspell uses the same availability and casting helper, including linked source pools. Legacy 2014 Counterspell is excluded: this connection requires a native Constitution-save activity.

## Player declines and GM continuation

Players see Decline Reaction when they own a currently offered choice, including helping another creature with Warding Flare or Flash of Genius. Declining records the owned actor IDs on the current window, removes those actors’ controls, and spends no resource or Reaction. AOE save declines cover that player’s choices across the same recorded usage. Other players’ options remain pending; the last decline resumes the existing automation. The GM continuation closes the whole current window or save group regardless of remaining choices. A declaration-stage decline does not spend a Reaction or pre-decline a later Hit-stage choice.

The active GM validates actor ownership, exact message/window identity, visibility and in-flight adjustments. Player socket requests cannot invoke the GM’s full-window continuation. Decline presentation and resource validation use the same recorded actors as the feature workflows; no historical-message scan is added.

## Completed-card refresh policy

Completed pilot windows stay closed when slots, feature uses or Reactions return. Resource/turn presentation requests skip their matching completed feature controls. Pre-application feature refreshes also check applied receipts on the linked usage/HP cards before rebuilding the grouped host, so another legacy reaction cannot refresh the same settled spell through its damage child. This per-batch check uses the shared linked-HP index and re-evaluates after Undo; post-damage riders retain normal refreshes; explicit Apply, Undo and correction refreshes remain supported. Save continuation hooks ignore unrelated flag changes and skip animation/prompt work when linked damage already exists. A synthetic reset with 50 completed saves and one live decision reduced automatic redraws from 51 to one; this measures work counts, not live client/server CPU timing.

## Adding a feature

1. Confirm its native trigger and assign a stage and specific trigger in FEATURE_TIMINGS. Update the script’s Timing comment and this table together.
2. Connect a bounded, target-specific eligibility snapshot to the shared window; preserve native activity formulas, resource pools and cancellation. Do not create another recent-message scan.
3. Reuse the feature’s active-GM/socket workflow. Revalidate the recorded source, defender, resource and Reaction before committing. Keep follow-ups separate from paid Reactions.
4. Use the shared chat-refresh queue for feature changes. Render hooks only present controls; they never reserve, spend or apply.
5. Test no-eligible bypass, criticals, skips, competing Reactions, cancellation/refunds, original dice, exact links, GM/player ownership, animation privacy and Apply/Undo. Mark connected only after its staged implementation exists.

## Verification

The user confirmed the earlier Flare/Parry pilot and Shield/Duelist in Foundry, including skips, unavailable resources, GM/player views and Undo. The save completion gate and multi-target failed-save decisions still need an in-game check. Automated checks are reported separately.

Test a Battle Master hit with Parry and Shield available, a Monk hit with Deflect and another defense, critical hits, canceled damage dialogs, zero damage, missing resources, concurrent clicks and a reduction that reaches zero and offers Redirect. Confirm one attack animation, one damage roll, one Reaction, no separate damage decision, and unchanged Apply/Undo. With no eligible defense, confirm immediate normal flow.

## Counterspell continuation

The original usage card holds the declaration; responses and saves use native grouped cards. Outcome checks are deferred until native save caches refresh and repeated on dice-animation completion; a result published while dice are animating cannot strand its parent declarations. Players can decline their own Counterspell opportunities with Decline Reaction; the GM’s Decline Reaction continues past all remaining opportunities. A successful Counterspell save continues the original cast; failure stops it before templates, concentration, effects or subsequent rolls. A countered spell retains its slot and limited casting uses, including linked monster source pools. Only its action, bonus action or Reaction is consumed; templates, concentration and effects do not begin. Canceling the Counterspell usage returns to the pending declaration without spending its resource. Completed declarations never reopen when turns or resources change.

The casting client must remain connected while its native use is suspended. Reloading that client loses the live continuation; do not treat an orphaned declaration as a fresh cast. Current world documents are not rewritten to replay a lost call. Test multi-client chains before relying on this development feature in play.

Reaction spells do not create the Consumed Spell Slot turn marker and remain available when an ordinary action or bonus-action spell has already created it. Native slot/source-resource consumption and Reaction availability still apply. This lets the original caster respond within a Counterspell chain without using up the original action spell’s turn allowance.

## Resumed action visibility

When a Counterspell declaration finishes or a staged reaction window resolves, the existing visible action group moves below its reaction cards in the current chat view. Native in-place updates retain this location; Apply, Undo, unrelated resource updates and repeated completion flags do not promote it again. Grouped save decisions wait until the other decisions are resolved. This is client presentation only: message timestamps, origin links, targets and Undo identities remain unchanged. Reloading the full log restores chronological document order.

Area save completion resumes existing shared damage through the active GM even when a player authored the spell card. It retains recorded targets and per-target HP receipts; it does not reroll damage or replay previously applied damage. Spirit Guardians’ region-managed Half Speed is not a pending card effect, so a fully applied trigger shows Undo Apply without a redundant Apply.

## Reaction settings and first attack expansion

Game Settings → Ugmuls Options → Reaction Triggers holds Attack and Save Reaction Pauses, Counterspell, Shield and the existing additional reaction handling option. Shortcuts open the class and feat settings. Each feature retains its original switch; disabling it removes its offers and prevents new feature-driven pauses. Turning off reaction pauses prevents new staged windows; already-published windows remain finishable with Decline Reaction. Counterspell has its own switch.

Lucky and Steel Defender Deflect Attack now share the concealed declaration decision with Warding Flare. Illusory Self and Instinctive Charm share the visible Hit/Critical Hit decision before totals and damage. Existing native resource, effect, save, Retarget and Undo handlers remain authoritative. Instinctive Charm waits for its save and explicit Retarget on a failure; the redirected defender is checked for hit-stage defenses without rerolling the attack. Completing one response retains another actor’s eligible choices. No new actor/turn history scans or per-feature Foundry hooks are added for these connections.

The remaining planned table rows—including other damage reducers and attack correction/follow-up features—are not connected by this pass. They keep their existing feature automation until their specific timing workflow is reviewed.

Instinctive Charm’s failed attacker save promotes the original action immediately while redirect is still pending. The GM and defending wizard see a Redirect Attack box; the initiating user receives one target-selection popup. Other viewers see the success/waiting status only. The normal Retarget control remains available. Closing the picker leaves the decision pending without another resource charge. The authority validates current targets and can finish the attack as a miss only when no alternate creature is in range.

Post-damage reductions offer **Decline Reaction**. A player clears only their own actor’s options on that damage card; other helpers remain pending. The GM can decline all remaining options. Smart Automation rechecks eligibility before applying damage. Passing spends no resource or Reaction.

Mirror Image shares the optional on-hit decision with other defenses. Click its icon to roll one d6 per remaining native duplicate; any 3+ removes one image and makes the attack miss. No Reaction is spent. A prior defense can avoid the hit without consuming an image; declining the remaining choice continues the attack.
