# Changelog

## Unreleased — unified action card development

- Reconnect Sea Druid to updated Wrath of the Sea: native Self/Another manifestations are Utility activities on Wrath, with Oceanic Gift and Stormborn now descriptive. Keep the existing bearer dialog, one/two Wild Shape and Bonus Action handling, initial optional saves and next-turn bearer prompts. Read live 5/10-foot range from the native manifestation formula; use its duration for base tracking and its level-10 Stormborn effect for flight/resistances. Gate other-bearer manifestation at native level 14, revalidate native sources/eligibility after consumption and refund failed activation. Preserve legacy layouts, original-Druid DC/Wisdom damage, targeting, incapacitation cleanup, unified cards, animation and Apply/Undo workflows. Aquatic Affinity remains native.

- Include native Hand of Harm activity uses, as well as module follow-ups, in the shared damage/effect auto-apply handoff. Retain the common animation barrier before HP, then apply native Poisoned once with Undo history. Add integrated regressions for animation order, source-end duration, duplicate scheduling, manual takeover during dice, and damage/effect automation settings; no separate animation or poison scheduler is introduced.

- Complete upgraded Hand of Harm’s native Poisoned effect after automatic damage application. Treat the recorded Harm damage activity as a coupled after-damage workflow, requiring committed HP and preserving native effect policy, targets, expiry and Undo history. Completed cards show only Undo Apply; combined Undo/reapply restores damage and Poisoned together without replaying HP or duplicating effects. Keep ordinary damage-only activities and existing attack/save handling unchanged.

- Restore free Hand of Harm for unified Flurry attacks that now originate from independent strike usage cards. Validate the explicit counter, actor, strike number and current-turn Mercy activation before granting the free use; retain older direct-counter links. Do not grant free Harm to unrelated attacks. Add regressions for the real free-use resolver with exhausted Focus, ordinary paid Unarmed Strike, and actors without Hand of Harm.

- Reconnect Mercy Hand of Harm and Hand of Healing to the visible base/level-6 activities on their individual features. Share native Monk visibility selection and retain Martial Arts/Wisdom scaling. Preserve upgraded Harm’s configured Poisoned effect and source-end duration for standard unified Apply/Undo; keep legacy Physician’s Touch handling while preventing duplicate or premature poison on native cards. Preserve paid Focus and free Mercy Flurry Harm, once-per-turn markers, the separate critical preference, healing touch/targets, cancellation, and healing replacements in normal/enhanced Flurry. Native Healing’s condition-removal description is retained; that choice remains manual.

- Reconnect Fey Wanderer Dreadful Strikes and Gloom Stalker Dread Ambusher to their native level-gated damage activities, selecting the eligible level-11 upgrade. Use native formulas, scaling data and critical policy instead of fixed Fey dice. Spend Dread Ambusher’s shared parent-item charges in the updated layout while retaining legacy activity charges, cancellation and failure refunds. Revalidate the selected activity/damage before committing. Resolve moved Mass Fear from Dread Ambusher with its native save/level gate and no extra charge; retain Stalker’s Flurry targeting, source-turn Frightened expiry and Sudden Strike. Both riders remain Psychic with their existing per-creature/per-turn limits and original weapon dice.

- Reconnect Druid Primal Strike to the updated Elemental Fury parent. Prefer visible Improved Primal Strike, otherwise use the eligible base activity, respecting native level-14/15 gates and the original Druid’s level during Wild Shape. Reuse Divine Strike’s native activity/type-memory workflow; remember Cold/Fire/Lightning/Thunder per player and original Druid across forms, turns and reloads. Preserve native dice, critical policy, hit/own-turn gates, original rolls, authority validation, one shared turn use and rollback.

- Remember Divine Strike’s last selected damage type per player and Cleric across attacks, turns and reloads. Use the same preference in the damage selector and actual rider for both base and Improved Divine Strike; fall back to an available native type if the saved option is removed. Preserve roll opt-out, native scaling, once-per-turn claims and rollback; previews do not write settings.

- Reconnect the weapon-hit Divine Strike rider to updated Blessed Strikes: Divine Strike. Prefer its visible Improved Divine Strike activity when eligible, otherwise use Divine Strike; keep legacy feature support. Read native dice, Necrotic/Radiant choices and critical policy, and reselect on the GM before committing. Preserve original attack/damage dice, weapon-hit/own-turn gates, adjustment locks, one shared turn use, player routing, cancellation and failed-roll refunds.

- Bind Improved Potent Spellcasting’s targeted temporary-HP follow-up to the native Heal activity on Potent Spellcasting. Respect native visibility and Cleric level, record the selected activity on its source offer, and revalidate it on the GM before use. Keep the inline icon beside Apply/Undo, independent healing targets and history, native formula, cancellation retry and legacy feature support; a hidden current activity cannot fall back to an obsolete upgrade.

- Reconnect Cleric Channel Divinity to its updated parent and moved Sear Undead activity. Keep Turn Undead and Sear Undead separate: Turn no longer automatically borrows Sear damage. Give both the same caster-centered, 30-foot undead targeting while preserving selected native damage, saving throws, level visibility, consumption, source-linked Turned cleanup and the own-Sear-damage exception. Retain older activities and leave Paladin Channel Divinity untouched.

- Default Flurry of Blows to the current owned Unarmed Strike, preserving its native Empowered enhancements; use an older Empowered attack only when no Unarmed Strike attack exists. Recognize the updated Flurry of Blows (Heightened) activity on Monk’s Focus, including copied activities by name, and retain its three-attack counter. Preserve per-strike numbering, live targets, cancellation and no additional Focus/action consumption. Elemental Attunement/strike automation is unchanged.

- Reconnect Deflect Attacks/Energy to updated PHB activities while retaining the full module workflow. Use the parent’s native reduction and level-appropriate Redirect/Redirect (Any Damage), with the descriptive Energy feature extending eligible attack damage. Respect Monk level/visibility gates and revalidate feature changes during reduction. Preserve original and per-defender damage, mixed types, Reaction/Focus reservations/refunds, zero-only Redirect, native save/Martial Arts scaling, target range/visibility, player routing and recorded legacy source identity. Share the native class/visibility lookup with Improved Warding Flare instead of duplicating it.

- Redirect Improved Warding Flare temporary HP to the level-gated Heal activity on Warding Flare in the updated PHB. Resolve by healing type rather than the shared Flare name, preserve native dice/Wisdom scaling and older feature layouts, and respect Cleric level/visibility gates. Keep the original protected recipient, cast-time Improved feature snapshot, one use/Reaction, player follow-up roll and damage-automation pause until temporary HP is applied or declined. Native recovery remains untouched.

- Retire the Disciple of Life script and setting after user verification of native enchanted-spell healing. Remove its cast snapshot, healing configuration note, extra 2 + spell-slot-level HP roll and skipped-dialog wrapper. Preserve the native healing bonus, original dice, unified application/Undo and the separate Blessed Healer and Supreme Healing workflows.

- Restrict Starry Form enchantment cleanup to the native Assume Form activity on an actual Starry Form feature. Missing activity IDs on unrelated Wizard enchantments no longer qualify for deletion. Leave native expiry to the system, revalidate exact source membership before queued deletion, and coalesce overlapping manual buff-end cleanup; preserve newer enchantments and report genuine deletion failures.

- Keep Overchannel available when an earlier reversed-counter write left raw spent above the native maximum (for example 21 spent with a 0/20 sheet display). Match the native zero-available clamp, advance from that displayed count only on a committed use, and restore the exact prior raw value on cancellation/failure. No render-time actor repair or counter reset is performed.

- Reconnect Overchannel to the updated PHB available-use counter: a fresh 0/20 feature is unused, and each use reduces spent rather than increasing it. Detect native recovery/consumption capabilities, retain legacy spent-counter support, and preserve free first use plus escalating slot-level backlash. Resolve the configured native backlash formula from a per-cast snapshot; keep one use across rays, spell-only maximization, original/random rider dice, caster targeting, resistance/immunity bypass and critical policy. Validate native counter snapshots on the GM, refund canceled/failed rolls in the correct direction, and preserve newer claims or manual/rest counter changes.

- Retire Reckless Attack’s module-owned outgoing Advantage default and Barbarian AC5E advantage rule. Keep the first-attack Reckless activation button, reading the system’s current native roll rules after activation for its explicit submission; never grant outgoing Advantage when native rules do not supply it. Preserve other sources and normal disadvantage cancellation, incoming Advantage/AC5E handling, first-attack tracking, original dice, effect reuse and source-turn expiry.

- Retire only Trance of Order’s module-enforced minimum-10 D20 adjustment after user verification of the native rule. Remove its floor helper, roll marker and configuration hook; preserve native/stronger floors, incoming-Advantage suppression and AC5E integration, activation/payment controls and recovery.

- Make Twinkling Constellations Swap Form a free use: no Bonus Action or resource consumption, including when the Bonus Action is already spent. Keep the native profile dialog and shared duration, and override activation only on the prepared swap use. Initial Assume Form retains native Bonus Action/resource costs; BA - Archer retains its Bonus Action cost, and swapping grants no extra activation shot.

- Retire the Elemental Affinity script and setting after user verification of native behavior. Remove its feature-picker override, resistance/selection synchronization, damage-dialog choice, extra Charisma damage roll, resource claims and sockets. Native chosen features own Elemental Affinity; preserve the surrounding damage modifiers and native rolls.

- Rebuild Starry Form turn cards from the active Starry Form buff: include Swap Form only with Twinkling Constellations and BA - Archer only with the Archer enchantment; create no card if neither applies. Track one turn card on the actor independently of buff synchronization and update it after profile changes. Keep BA - Archer visible but disabled when its Bonus Action is spent. A resource-consuming Archer assumption grants a separate, once-only Archer Shot without Bonus Action consumption; free assumptions and swaps grant no free shot. While the buff is active, clicking Starry Form preserves the native Assume Form/Archer/Chalice activity chooser. Preserve automatic Archer, Chalice healing follow-ups, native scaling, targeting and Apply/Undo.



- Retire the module’s Innate Sorcery attack-advantage override, AC5E bridge, dialog adjustment and setting after user verification of native behavior. Preserve read-only native effect/class lookups for Metamagic and Wild Magic in a shared helper; keep Umbral Form and Crown of Spellfire integration.


- Give Healing Chalice its own unified healing card, recorded recipient and Apply/Undo history. Use the active native Chalice enchantment’s granted healing activity and scaling; retain the triggering spell only as follow-up accounting metadata. Canceling an unused roll removes its empty card and refunds the follow-up reservation. Update shared range conversion for D&D5e 6.1 while retaining 6.0 compatibility.

- Place Improved Potent Spellcasting and Healing Chalice follow-up icons in their source roll's action footer beside Apply/Undo Apply. Stop creating separate reminder cards and hide older reminder displays without deleting history. Keep original targets, native follow-up healing, authoritative ownership/range checks, one-use reservations and canceled-use refunds. Refresh feature removal through the shared bounded queue, with Druid-only Potent Spellcasting excluded from Cleric refreshes.
- Recognize native Chalice directly when snapshotting a healing spell, including before module buff metadata has synchronized. Unlock its inline follow-up after slot-funded HP healing is applied; exclude temporary HP-only grants and casts made in another form. Remove Chalice from the Starry Form turn-start card.
- Retire the Cleric Potent Spellcasting cantrip damage bonus, its configuration choice and setting. Native rules own that bonus. Preserve the Improved Potent Spellcasting temporary HP follow-up and the shared Divine Strike, Primal Strike, Lunar and Circle of Mortality workflows.

- Show only currently applicable Starry Form actions: the free Archer Shot on its activation turn, then Bonus Action Archer and eligible swaps on later turns; hide unavailable/used controls and empty action cards. Serialize native effect timing from source data, storing Combat/Combatant IDs instead of prepared documents, and normalize older swap snapshots when restoring duration. This fixes the v14 ForeignDocumentField error on swaps and subsequent healing-triggered reconciliation.

- Restore the Improved Potent Spellcasting post-damage follow-up for updated PHB Clerics. Resolve its level-14 temporary HP activity on Potent Spellcasting instead of requiring the removed activity on Improved Blessed Strikes. Keep native formulas, actual applied-cantrip-damage gating, one offer/use per cast, current self/creature targeting within 60 feet, owner/GM validation and native healing Apply/Undo. Present the follow-up as a small feature icon with a descriptive tooltip; legacy feature layout remains supported.

- Reconnect Starry Form to the updated PHB self-enchantment and native rider effects/activities. Keep the stock Assume Form/profile dialog and native light, Dragon and Full of Stars benefits. Offer one private Starry Form Actions card on activation and each Druid turn, with the free activation Archer Shot, BA - Archer, eligible Chalice and Twinkling Swap Form controls. Swaps are free, consume no item use and preserve the original duration. Disabling/deleting the linked native Starry Form buff ends only its exact enchantment; stale effects cannot end newer forms. Preserve native attack/healing cards, selected targets, GM/player reservations, cancellation refunds and grouped Apply/Undo.

- Remove the Druid Potent Spellcasting bonus, damage-dialog choice and module setting after user verification of the updated native feature. Native conditional damage rules own the Wisdom bonus, preventing an additional module bonus. Keep the shared Primal Strike, Lunar Form/Radiance, Cleric and Circle of Mortality workflows; no legacy feature migration is included.

- Fix the initial Regeneration healing roll launched from a turn reminder remaining Pending. Preserve the pending roll's explicit usage origin during native publication instead of replacing it with the reminder's click-event source. Keep original dice, recorded recipients, session validation and normal healing application/Undo.

- Remove Warding Flare's recovery patch, startup pass and recovery-only item hooks. Updated PHB feature data owns rest recovery. Retain cast-time reaction snapshots, use spending/refunds, attack/critical corrections and Improved Flare temporary HP sequencing; no existing character recovery data is migrated.

- Remove the Font of Inspiration recovery helper and its module setting. Updated Player's Handbook Bardic Inspiration provides native level-based Short Rest recovery, confirmed on an updated test Bard. Font's native spell-slot recharge and the module's Bardic Inspiration roll/reaction integrations remain in place. Legacy feature recovery is no longer patched; existing character items are not migrated.

- Preserve opened native dice breakdowns across unified-card redraws, including the first expansion after an attack or damage roll. Keep the native click handling and anchor, remember explicit closes, and avoid reopening detached or hidden results. The same presentation helper covers save and healing results.

- Route feature/resource refreshes for grouped results to their visible unified card, deduplicating overlapping requests without changing cast-time reaction snapshots, resource validation or the bounded refresh queue. Share reaction/follow-up footer placement across attack, save, damage and healing layouts.

- Keep Undo Apply available for every Graze application, including repeated Undo/reapply cycles and zero-HP automatic applications. Exclude fully undone Graze history cards from the active unified layout, preserve live/incomplete HP histories, suppress duplicate Undo Damage controls and prevent stale retired/miss controls from applying again. Existing Graze cards with a stale undone marker plus real reapplied HP history can recover through Undo Apply; corrections remain locked until that HP is restored. Graze Undo preserves separate on-hit effects and original attack dice.

- Keep Second Wind and other native Self healing in the unified card by recording the caster's own token during usage preparation and preserving that identity in the healing roll. Never use the current enemy selection as its recipient. Remove Retarget for Self healing, abort if its recorded caster token is unavailable, and preserve native formulas, resource consumption and Apply/Undo behavior.

- Add compact unified targeted healing cards for native spell/feature Heal activities, including temporary HP. Keep the original usage, full native healing roll, green section borders, recorded recipients, follow-up controls and expandable application details together. Reuse the combined active-GM Apply/Undo workflow, native HP caps and temporary-HP rules, safe partial retry and source-specific effect history. Preserve system-rendered player application controls and the separate automatic-healing preference. Add the default-enabled Reduce Healing Card Clutter setting; mixed roll workflows, Life Transfer sacrifice receipts and healing without recorded token identities retain their native route.

- Use the main Avenging Angel feature artwork for its actor buff, Frightful Aura save activity and failed-save Frightened effects. On reload, the active GM refreshes existing managed effect icons without changing their duration or other data; native source templates remain unchanged.

- Fix Vow activation throwing when refreshing the default roll button on Foundry's immutable application options. Set the highlight through the shared dialog's mutable button-render context instead, preserving the original attack continuation, live cancellation/suppression results and the marked-target button state.

- Activate/transfer Vow of Enmity inside the original attack dialog instead of closing it and starting an independent attack. Preserve the original usage, pending session, recorded targets and subsequent damage continuation. Add Vow as an ordinary AC5E Advantage source before native rebuild, retaining cancellation, suppression and explicit choices; keep resource mutations on the existing authority path and deduplicate concurrent activation clicks.
- Align unified save, effect and damage borders by removing native summary side offsets and placing the effect tray on the same blue save edge.

- Keep placement-only casts such as Stinking Cloud out of unified save/application pending state. Present the initial card as casting and placing the area, with no initial DC/target list, effect tray, save/damage action or Retarget. Stinking Cloud states that creatures save at turn start; actual Region trigger cards retain their normal save/effect application workflow.

- Mark D&D5e 6.1.0 as verified in module.json; retain minimum 6.0.5. The 378-file regression suite passes against the installed system, including native damage-option merging/calculation checks for Elemental Adept resistance bypass, immunity preservation, save multipliers and other features' bypass defaults.

- Scope unified save cards' blue border to the save setup/results, leaving the linked damage section red and the common footer uncolored, matching the attack/damage section layout.

- Show subtraction signs for negative dice such as Synaptic Static in native attack, save and check breakdowns, including each penalty face and its subtotal. Preserve original dice, totals, modes, privacy and grouped-message identity. Restore the boxed total and raw d20 face on module-styled save/escape summaries as well as unified attacks.

- Keep save-first recurring spells such as Weird and Phantasmal Killer in one application home. Link the failed-save damage usage explicitly to its recorded save/effect/turn/recipient, embed the native damage result and footer controls under that save, and suppress the extra declaration. Require the follow-up damage before Apply, retain correction locks across the native child usage, and stop both automatic sources during manual Apply/Undo. A corrected successful save hides unused damage and cannot apply it.

- Extend the unified save/application home to native damage-only activities, including Region and turn-start damage such as Hunger of Hadar. Apply recorded-target damage and configured effects without requiring save outcomes, preserve native damage options and automatic workflows, and share the combined Apply/Undo controls. Collect reaction buttons outside standard action containers into the source-linked footer alongside riders.

- Label save-based grapple escape prompts “Use action — Escape grapple” and withhold the unified pending-roll box until the optional action starts. Keep recurring effect recipients fixed by removing Retarget throughout their prompts and rolls.

- Hide the combined save Apply control after completion and restore it after Undo Apply. Prevent later render hooks from recreating separate Undo Damage/Effect buttons inside unified save cards.

- Extend compact unified cards to native saving-throw activities from spells and features. Keep recorded saves, shared damage and effect choices in one usage card, with one active-GM Apply and Undo Apply. Preserve native save multipliers, resistance/immunity, Evasion, effect eligibility, concentration, reaction holds, roll correction and existing automation settings. Recover partial applications without replaying committed HP; Undo waits for pending work and preserves newer effects. Reuse native save summaries and batch compatible HP-history writes through targeted refreshes. Add the default-enabled Reduce Save Card Clutter setting.

- Fix Elemental Attunement remaining active after native End Attunement or after disabling/deleting its actor buff. Require actual applied enchantment provenance and item membership instead of treating enabled source templates or stale registry entries as activation. Block the stopped application before queued refreshes run, and use native enchantment deletion for the off transition. A new activation card can grant the buff again normally.
- Include Stride of the Elements' native Fly/Swim changes directly in the Elemental Attunement buff. Suppress only the matching applied Stride rider to avoid a second active effect; leave the source template unchanged and preserve the movement component when changing Epitome resistance.

- Extend unified cards to native attack activities regardless of source item type, including feature-based Empowered Strikes, Elemental Strike and Archer. Give each Flurry strike its own native attack usage without additional Focus/action consumption, retaining the Focus card as its counter source and preserving Flurry numbering, cancellation cleanup, recorded targets and independent Apply/Undo.
- Show a single actor buff named Elemental Attunement alongside its native self-enchantment. While active, Empowered/Unarmed Strikes gain the source activity's elemental damage choices and extended reach without changing their Martial Arts formula, attack ability or critical handling. Reuse the existing optional Push/Pull Strength save and Elemental Epitome's feature-gated once-per-own-turn bonus. Merge the managed Epitome resistance into the same buff; changing/removing that component preserves ongoing Attunement. Native End Attunement, expiry and incapacitation end the benefits; active-GM validation and the shared refresh queue handle actor changes.

- Label attacks rolled from the Flurry of Blows counter “Flurry N of total,” preserving the original two/three-attack total on each attack. Keep numbering stable after cancellation and render it on standalone cards, inline attacks and animation setup without changing Focus consumption or roll results.

- Add formatted description tooltips to unified spell/attack names, using only the card's viewer-rendered text. GMs may see all visible descriptions; players may see player-owned actors and friendly tokens, while other monster descriptions remain GM-only. Restore native recorded-speaker token highlighting on the visible caster/attacker name when compact layout hides its avatar.

- Keep the neutral unified attack face visible throughout Dice So Nice animation by separating its presentation identity from the hidden native result until completion. Style the dice-area status as a dark boxed “---PENDING---”; preserve native result hiding, permissions and completed beam identities.

- Reopen the damage Apply tray reliably after Undo on unified weapon and spell attacks. Handle intermediate HP/history renders before the final Undo marker, and consume each reopen marker once so later manual expansion/collapse remains respected.

- Show weapon and spell attacks in their compact native attack layout from initial setup, with neutral recorded targets, merged properties and a pending dice box. Keep that face during attack animation, refresh it from current cast/activity data as setup changes, and preserve existing cancellation and usage controls without publishing a synthetic attack result.

- Label unified Eldritch Blast beams and Scorching Ray sections with the spell name and “Attack N of total,” including the first attack before later rolls arrive. Reuse the existing level/upcast attack-count calculation.

- Fix Lifedrinker healing submission rejecting with “no longer available for this turn” after spending its Hit Die when a follow-up dialog is configured again by pending-damage setup. Reuse the existing dialog wrapper, including subclasses, so resource commits run once. Preserve cancellation and once-per-turn validation for later attempts.

- Extend compact unified cards to spell attacks, including each Eldritch Blast beam and Scorching Ray. Keep each recorded attack/target/damage pair and its reaction, Apply and Undo controls together within the cast. Damage prompts use that beam's critical result and the native scaled cast activity without spending another slot. Isolate spell on-hit effect histories per attack, preserve concentration/scaling and newer applications, and restore native child presentation when a cast cannot be safely grouped.

- Use the main Hand of Harm feature artwork for its follow-up button, preferring it over the damage activity icon.

- Fix Stars Druid BA Archer prompts staying disabled on owning player clients after a new-turn Bonus Action reset. Refresh only the owner’s referenced Starry prompts through the existing coalesced queue on resource/effect, turn and feature changes; keep posting, reservations and effect mutations on the active GM. Preserve the initial free shot, current-turn/Bonus Action checks and nonowner restrictions.

- Add Disarming Attack/Disarming Strike to the Battle Master damage maneuver chooser when loaded on the character. Include the current native Superiority Die in the initial damage roll, preserve critical handling and Relentless, spend through the shared maneuver reservation, and link the source feature’s Strength save to the damage card. Show save outcomes without inventing Prone/Frightened effects; dropping the chosen held object remains manual.

- Defer Sap on supported unified attacks until actual damage Apply, remove its separate mastery toggle, and couple source-specific removal/restoration to Undo Apply/reapplication. Recheck the confirmed hit at application so a defensive reaction can prevent Sap. Keep Sap’s hit-based eligibility when damage is zero and record its actual recipient for reliable zero-HP-change Undo. Preserve newer Sap applications, next-attack consumption, Slow behavior and independent Vex benefits.

- Extend icon-and-tooltip presentation to follow-up abilities outside the reaction governor: Superior Hunter’s Prey, Psionic Strike, Hand of Harm, Rend Mind, Lifedrinker healing, Alchemical Eruption, all four Elemental Smite choices, Sudden Strike, Cleave, Ram, Chilling Retribution, Fount of Moonlight, Relentless Rage activation, and Strength of the Grave activation. Use native feature/activity artwork where available; preserve Decline, Retry Recovery and Apply/Undo labels. Superior Hunter’s Prey explains reuse of already-rolled Hunter’s Mark damage without adding dice or changing its applied-damage requirement.

- Present reaction/adjustment buttons as 30 px icon buttons with 22 px artwork and accessible hover descriptions. Preserve native/source feature icons, button handlers and disabled states; keep Apply, Undo Apply, Retarget and roll-mode controls labeled. Cosmic Omen describes the native Weal/Woe adjustment instead of an Undo/GM instruction.
- Synchronize the attack roll’s hit/miss marks with its visible native target pill after reactions and corrections, preserving original dice and viewer permissions.
- Collapse unified damage details once per application cycle; preserve subsequent user expansion/collapse across delayed refreshes so the first inspection click stays open. Undo reopens application controls and the next Apply begins collapsed.

- Hide disabled reaction buttons on committed unified attack/damage results, including Cosmic Omen and Warding Flare. Preserve used-reaction history, available post-application reactions, Undo/recovery controls, and normal eligibility rendering after Undo Apply.

- Give supported single-attack/single-damage unified cards one damage Apply entry and one Undo Apply control for HP and configured on-hit effects. Keep native application details expandable, preserve separate histories internally, wait for in-flight effects before Undo, and retain recovery for partial failures without replaying HP. Effect options requiring a GM decision retain their native choice controls.
- Require a current recorded hit for Warding Flare presentation and authoritative use. Corrections to a miss remove eligibility without rebuilding the original range/feature snapshot; used-reaction history remains visible.

- Place the Normal/Critical damage adjustment menu immediately below its roll row in grouped cards, above the native damage application tray.

- Couple this attack's Slow mastery to damage Undo/reapplication and remove the separate Slow toggle from unified cards. Undo removes only the matching source's Slow for successfully restored HP recipients; positive damage reapplication can restore Slow without replacing a newer card's non-stacking effect or repeating other mastery benefits.

- Merge usage properties into the visible attack's native tag row before hiding the usage face. Retain range, action, proficiency, mastery and attack properties; deduplicate tags and omit redundant Weapon/Martial/Ranged labels.

- Restore full native boxed roll results and the right-side d20 face inside unified cards, overriding the stock summary-only simplification. Run final layout on the D&D5e render hook after native content and feature controls exist, so the duplicate header is hidden and controls reach the common footer.

- Begin the IMP-019 attack/damage presentation on `dev-card-replacement`: single-target weapon attacks share one visible usage card, using native attack/damage content and original message identities. Preserve stock target hit/miss colors, roll adjustment menus, expandable damage application, and separate Undo controls; collect reactions and adjustments at the bottom and place Retarget beside the target while corrections remain unlocked.
- Extend the existing pending-use/cancellation workflow to weapon attacks when Reduce Attack Card Clutter is enabled. Keep unsupported multi-attack, multi-target, save, healing, and non-weapon workflows on their existing presentation. Missed attacks retain the existing damage-on-miss exceptions and never conceal a committed transaction requiring Undo.
- Local automated checks passed; visual layout, native application expansion, and GM/player playthroughs still require Foundry verification. No release package or publication.

## v1.0.1 — Maintenance Release (2026-11-11)

- Show a temporary pulsing range ring while choosing Inspired Eclipse teleport destinations, including chat, feature Teleport, and recipient paths. Use the recorded range and scene units, clear the guide on placement exit, and retain native destination/resource validation.

- Offer Blessing of Moonlight healing when a save from the same recorded casting is corrected from success to failure. Preserve the captured caster/buff and existing healing reservations or completed uses; repeated corrections do not grant another heal for an already used save.

- Move the short-lived startup Actor discovery helper into `startup-actors.js` and update its six consumers, preserving shared-cache behavior, synthetic Actor discovery, and feature setup.

- Remove outdated fixed-version labels from main automation and Spell Manager diagnostics; report the installed module version from Foundry's module metadata at Ready.

- Extract token-footprint distance measurement from Dark One's Blessing into `shared-distance.js` and migrate all twenty consumers to `tokenDistance`, preserving measurement, feature range rules, and snapshot timing.

- Move Stinking Cloud's applied-effect preparation and turn-end cleanup into a dedicated spell script. Keep its Region recipe, enablement, native condition, and expiry timing unchanged.

- Shorten the Fount of Moonlight card button to “Blinding Reaction,” keeping the spell name and explanation in its tooltip so the control fits the chat log.

- Fix Fount of Moonlight prompts on completed pending damage cards: capture eligibility from the incoming roll before the placeholder flag clears, without rescanning or repopulating later.

- Recognize Fount of Moonlight’s native Wreathed in Light marker in Wild Shape, using the original Druid’s spell when the form does not retain it and spending the form’s Reaction.

- Offer Fount of Moonlight’s native blinding Reaction on incoming damage cards, targeting the recorded attacker within 60 feet at roll time. Preserve the offer after concentration loss, consume the Reaction once, and leave incoming damage automation uninterrupted.

- Finish legendary initiative sorting compatibility with Monk’s Combat Details: invoke the libWrapper chain for slot/anchor comparisons as well as ordinary comparisons, preserving anchored slot order without the missing-chain conflict warning.

## v1.0.0 — Official Release (2026-11-07)

- Limit the Legendary Resistance effect-automation hold to failed saving throws. Native attack riders such as Starry Wisp’s Illuminated now apply to legendary targets through the normal hit/damage and Effect Undo workflow; successful-save and single utility effects are not incorrectly held. Preserve failed-save decisions, misses, source targeting, and resistance resources.

- Restrict character-builder equipment browser results to validated candidate UUIDs, so Holy Focus and other choices hide ineligible items instead of displaying red prerequisite locks. Preserve Focus/category filters, enabled sources, and final selection validation.

- Preselect matching native Compendium Browser filters for character-builder equipment choices, including Artisan’s Tools, Musical Instruments, Gaming Sets, weapon/armor categories, and spellcasting focuses. Derive specific-tool/focus categories from allowed source items, preserve editable browser filters and existing source/choice validation, and avoid restrictive guesses for incomplete imported metadata.

- Register legendary-slot initiative sorting and Next Turn integration through libWrapper when available, preserving Monk’s Combat Details and other registered wrappers. Retain standalone fallback behavior when libWrapper is absent.

- Add Legendary Action under Common with automatically placed hidden, actorless slots after player turns. Show only the current/upcoming GM reminder, preserve intervening NPC turns and tied initiatives, adopt an existing manual slot, and skip/hide reminders as legendary points run out. Keep internal slots anchored during combat so once-per-turn identifiers do not change, then remove them on combat end/reset. Native combatant operations preserve the active actor without extra turn events. Ordinary uses by living, non-incapacitated legendary NPCs in that slot bypass Reaction, Bonus Action, and spell-casting tracker gates/markers while preserving native resource spending and existing markers. Explicit reactions and other participants remain tracked. Skip empty slots before the combat update commits when no eligible legendary NPC has points; preserve normal turn direction and round boundaries.

- Add global search above the Module Options category buttons. Match setting titles, descriptions, and class/category names; hide nonmatching settings and empty categories/class choices, and find manager shortcuts too. Preserve unsaved preferences, GM/client permissions, mastery parent locks, and search focus while typing. Clearing restores normal navigation.

- Clarify the Automated Effects introduction and use compact toolbar buttons matching Region Effect Management. Rename the Region list heading to Configured Regions.

- Align Automated Effects with Region Effect Management: enlarge the default window, use compact source/effect rows with direct enable/disable, Edit, and reset controls, and add selection, bulk enable/disable, and enabled/disabled search filters. Batch preference writes and preserve recipe customizations. Keep both managers’ top controls fixed while their configured lists scroll.

- Rename the Region manager interface to Region Effect Management. Keep Search Effects visible above the independently scrolling Automated Effects list. Expose source/effect, trigger, damage, save/escape, removal, and separate-save timing controls on prebuilt recurring-damage and escape recipes; preserve specialized workflow metadata and reset defaults. Show fixed Blink/wound timing and expose wound activity, Medicine DC, and duration options.

- Initialize fresh application clocks for custom Automated Effects recipes, including creature eye rays, so applied copies do not inherit expired source timestamps. Preserve native durations, conditions, stat changes, source templates, and external automation; existing expired effects are not revived.

- Rename the trigger-library interface to Automated Effects. Add creature/item/spell/chat-card source selection and effect inspection, reuse existing recipes, and configure only existing source effects and activities. Keep manual creation on the source item’s normal sheet, preserve native application/resource settings, and reject overlapping source saves. General custom recipes support affected/source turn start/end and damage-taken saves through the existing authoritative recurring workflow, with source-token filtering and duplicate-trigger guards.

- Simplify Chat & Sheets option wording, including Reduce Attack Card Clutter, latest-message scrolling, sheet compendium browsing, and adding missing class spells.

- Clarify GM/NPC damage and healing option titles and descriptions, including Smart Damage and Effect Automation, NPC saving throws, HP application, and save/on-hit effects. Setting behavior and saved preferences are unchanged.

- Move the remaining seven base settings into Module Options: Preserve Life, Supreme Healing, Invoke Duplicity, and Guided Strike under Cleric; Command and Mirror Image under Spells; inactive combat effect cleanup under Common. Preserve existing saved values and permissions.

- Add Tavern Brawler under Feats: reroll base unarmed strike damage dice showing 1 once, including native Monk scaling and critical dice. Preserve modifiers, separate riders, preview rolls, and cached critical corrections.

- Add Goliath Hill’s Tumble automation under Common. Attach native Prone to the owned feature’s utility activity and apply it to one recorded Large-or-smaller target when used. Preserve native use consumption, existing Prone, and shared Effect Undo; off-turn use does not spend an additional Reaction.

- Add Elemental Adept under Feats. The active GM creates one disabled actor effect for each native elemental choice (Acid, Cold, Fire, Lightning, Thunder), preserving player enable/disable choices, repeatable feat selections, and unrelated effects. Batch compatible effect creation/source rebinds, avoid unchanged writes, and remove managed effects when the last feat is removed. Enabled types merge spell-only resistance bypass into native damage preview/application options without bypassing immunity. Apply native min2 modifiers to matching spell dice before evaluation, including mixed typed parts, nested dice, critical dice, and skipped/automatic damage dialogs; preserve stronger minima, other modifiers, original evaluated rolls, and critical-mode caches. Use the shared targeted refresh queue for changed elemental effects.

- Add Mage Slayer under Feats. Guarded Mind offers a failed mental-save control on standalone/grouped single-roll save cards, spends/refunds the native Short/Long Rest pool on the active GM, and uses native resisted-save success without changing original dice or DC. Preserve applied HP/effect locks, resource refreshes, owner checks, and reactive continuation; no Reaction is spent. Concentration Breaker carries exact source/defender/damage-card identities through a single native-format concentration prompt after actual HP/temp-HP loss, with no persistent actor debuff or recent-message lookup. Preserve protected concentration, pending/retry/takeover sessions, and normal Advantage/Disadvantage cancellation; fully absorbed or failed ward damage does not prompt. Native forced success also preserves concentration on an eligible mental concentration save.

- Add Lucky assistance for incoming single-target attacks only. Spend one native Luck Point from the defender’s feat, impose Disadvantage through the shared roll-mode workflow with normal Advantage cancellation, and hide the button when points are exhausted or Disadvantage is already applied. Preserve original d20 results/cached pools and typed damage; reuse the critical-damage correction workflow for existing, pending, and later cards if a critical is downgraded. Validate the source card, target, owner, current points, and adjustment locks on the active GM; refund failed adjustments without undoing concurrent point spending. Use grouped-card controls, targeted chat refreshes, and the shared reactive pause/resume workflow. Lucky does not spend a Reaction; self-roll Advantage remains manual.

- Add Defensive Duelist under Feats. Snapshot eligible melee-hit defenders with an equipped Finesse weapon and an available Reaction; show a confirmation on standalone/grouped attack cards. Validate the owner, source hit, weapon, turn, and Reaction on the active GM, reserve the shared Reaction, apply the native proficiency-bonus AC effect with defender source-start expiry, and reuse Shield’s hit/miss refresh without rerolling or negating native critical hits. Exclude this AC benefit from ranged/thrown target descriptors while preserving Shield/Valor bonuses. Coordinate reactive damage/effect pauses and continuation, refund failures including partially created effects, reuse Effect Undo, and route state refreshes through the shared targeted queue.

- Automate Slasher without a selection button: the first qualifying slashing hit each combat turn applies Hamstring, and critical hits also apply the enhanced critical attack-disadvantage effect. A later critical still gets its critical effect after Hamstring has been spent. Serialize simultaneous cards to enforce the shared once-per-turn limit, restore the use after failed Hamstring applications, and coordinate automatic effects before HP application. Keep source-start expiry, native non-stacking effects, and Effect Undo; persistent component receipts prevent automatically reversing Undo.

- Restrict Piercer rerolls to the weapon’s own damage dice, including its critical dice and kept Savage Attacker weapon set. Exclude extra riders even when they share the weapon’s die size or damage type, and validate the same restriction on the active GM.

- Simplify Crusher: remove its damage-card button, movement prompt, and movement-use tracking. Automatically apply the working critical-hit advantage debuff on qualifying recorded bludgeoning critical damage, using the active GM, existing native effect/Undo workflow, source-turn expiry, and an in-flight guard. Coordinate automatic HP application with the same pending effect operation. Repeated updates and renders do not duplicate applications, and Effect Undo remains manual.

- Add Crusher, Slasher, and Piercer assistance under Feats. Reuse Empowered Spell's die selection and reroll machinery for Piercer: choose one active damage die, retain the other dice and modifiers, and use the new result even when lower. Track each optional benefit once per active combat turn, including off-turn attacks; reject historical cards after the turn changes, validate on the active GM, and restore use markers after failed commits. Outside combat, usage is tracked per card.
- Include Piercer's additional critical die in the initial damage roll, with standard/maximized critical policies, Savage Attacker pools, and cached Normal/Critical corrections. Crusher automatically applies its critical-hit advantage effect; Slasher automatically applies its once-per-turn non-stacking speed reduction and critical-hit attack disadvantage. Critical benefits do not spend the optional turn use. Reuse native source effects, source-start expiry, AC5E cancellation, shared Effect Undo, and targeted batched chat refreshes. Automatic effect receipts survive Undo so later updates do not silently reapply removed effects. Crusher/Slasher currently require a single recorded hit target; token movement remains manual.

## v0.8.5 — Wizard, Cleric & Bard Features (2026-11-05)

- Uncanny Metabolism’s initiative checkbox now activates the native feature card directly, restoring Focus and spending its native Long Rest use once, then automatically rolls its native self-healing and applies it with HP caps and shared Undo. Replace the separate healing-shortcut flow. Fix completed initiative receipts remaining hidden because Foundry merges object flags: explicitly clear pending on completed activations and healing. Roll back native consumption if activation fails before commit, and retain published healing/native feature cards for manual recovery after healing or HP errors.

- Add Override initiative prompt under Rolls & Damage / Healing, enabled by default. Intercept only owned combatant dice clicks inside Carousel Combat Tracker and open the native D&D5e initiative configuration, retaining native advantage/disadvantage, roll visibility, modifiers and initiative feature hooks. Preserve cancellation, prevent duplicate pending dialogs, refresh Carousel order afterward, and leave its original fast roll when disabled without modifying Carousel’s files.

- Reduce repeated chat-history traversal with a shared, incrementally maintained message index for recent-card refreshes, movement damage, shared region cards, Relentless Rage healing, initiative-card initialization, and explicit attack/origin damage links. Preserve insertion order and update/delete/recreate invalidation; automatic attack damage prompts now use the exact card attached to native returned rolls instead of matching activity and totals. Preserve the existing 32 ms chat-refresh coalescing and eight-card batches.

- Share one same-turn actor/token discovery snapshot across Font of Inspiration, Inspired Eclipse, Blessing of Moonlight, and Warding Flare startup recovery. Deduplicate linked actors by UUID, retain synthetic actors, and release the snapshot after the current turn of the event loop so later discovery sees current documents. Synthetic work-count checks cover 20,000-message refreshes and repeated startup traversal; no in-game frame-rate or server timing gains are claimed.

- Fix paid Lunar Vitality on tester/player clients when the active GM has no target or unrelated targets selected. Pass the validated, recorded healing recipient and rider-automation context to native resource consumption instead of allowing the manual target guard to consult the GM’s live selection. Preserve owner checks, one-use spending, native refunds, and the GM’s selection.

- Fix paid Lunar Vitality rejecting Bardic Inspiration consumption. Resolve the book activity’s symbolic bardic-inspiration target to the caster’s owned item ID on a temporary native item copy before direct consumption. Preserve the native cost, source feature, exact delta validation, rollback/refunds, and Eventide’s free option.

- Link Blessing of Moonlight’s native 2d4 healing to Lunar Vitality’s existing Yes / No / Free healing configuration. Validate the exact reserved failure and modified Moonbeam casting, preserve cast-time eligibility and the shared once-per-turn limit, spend/refund the native Inspiration use for Yes or use Eventide’s free d6, and apply the combined healing plus native Speed buff to the chosen healing recipient. Keep the native configuration on the clicking player’s client, with active-GM reservation, resource validation and HP application; cancellation releases the unused failure without spending a die.

- Fix Moonlight Healing reporting a missing roll when native publication resolves its origin to a ChatMessage document. Recognize both native origin forms and exact returned roll-parent cards, retain the consumed failure once a result exists, and automatically apply that result to its recorded recipient after dice animations through native HP handling and shared Undo. Preserve existing applied results and keep published rolls available for manual Apply if an HP update fails.

- Fix Blessing of Moonlight healing controls missing from initial Moonbeam failures while target confirmation is still pending. Retain only those exact initial save cards and retry after their casting’s buff activates; support each failed creature independently, clear canceled/deleted cast requests, and preserve later-turn behavior without scanning chat history.

- Moon Bard: Add Blessing of Moonlight to Moonbeam’s casting consumption options. Spend its native feature pool through the cast, apply Blessed by Moonlight to the Bard for that exact casting’s concentration, and add 5-foot dim light through the shared light workflow without replacing stronger light. Offer native 2d4 Moonlight Healing on each snapshotted failed save against that modified Moonbeam, independently for every failed creature and without an extra action, slot or Inspiration cost. Validate caster ownership, exact region/cast, current buff, another visible recipient within 60 feet, and one use per failure; retain native healing Apply/Undo, cancellation/retry and active-GM authority.

- Moon Bard: Eventide’s Splendor adds independently owned Inspired Eclipse controls for the recorded Bardic Inspiration recipient alongside the Bard’s control. Use native invisibility until the recipient’s next turn starts and a Reaction for their optional, zero-movement-cost teleport; preserve separate activation/teleport state, cancellation, failed-move Reaction rollback, effect Undo, and cast-time eligibility. Support Eventide replacing Moon’s Inspiration.

- Lunar Vitality now offers Yes / No / Free when Eventide’s Splendor was present at casting. Free uses the native Vibrance of the Full Moon d6 instead of spending Bardic Inspiration, retaining the same recipient, once-per-turn limit and +10-foot Speed effect. Explain Free beneath the selector and disable only paid Yes when Inspiration is exhausted.

- Moon Bard: Add an optional Lunar Vitality Yes/No choice to spell-healing configuration, using the native scaled Bardic Inspiration healing die and native consumption/refund workflow once per turn. Choose one recorded recipient for multi-target healing; preserve base dice and exclude the bonus from other recipients. Apply the native +10-foot Speed effect only after that creature actually regains HP, refresh it without stacking, expire it at the end of their next turn, and retain shared effect Undo and newer-source protection. Previewing/canceling does not spend a die; failed rolls refund it.

- Fix Inspired Eclipse teleport visibility for player accounts: use the Bard’s native sight and light-perception modes instead of the limited sight-radius polygon, allowing visible illuminated destinations beyond darkvision range. Keep wall, blindness, level, occupancy and range checks, and avoid borrowing another token’s vision.

- Inspired Eclipse teleport now uses a dedicated native zero-cost, unmeasured teleport action, preserving movement history, Undo and region events without consuming the Bard’s movement for the turn. Leave ordinary walking and other teleport actions unchanged.

- Fix Inspired Eclipse integration when a recipient already has Bardic Inspiration: refresh their single native grant with the new Bard, die, and source message instead of skipping it; Undo restores the previous grant and source identity. Recognize native/manual Inspired Eclipse invisibility for the Teleport action, including already-applied manual effects. Fix Foundry 14 teleport measurement by giving both grid points matching elevation, so nearby destinations no longer fail with an invalid distance.

- Moon Bard: Offer Inspired Eclipse on the native Bardic Inspiration usage card after the recorded recipient receives Inspiration. Apply a separate native Invisible effect to the Bard, with normal next-turn expiry and early removal after an attack, actual damage, or a committed spell cast. Add a Teleport activity to Moon’s Inspiration and use native click-to-place token preview plus teleport movement for one visible, unoccupied destination within the native range. Preserve cast-time eligibility, original targets, native movement triggers, overlapping invisibility sources, effect Undo, cancellation/retry, and active-GM validation without another Inspiration or action cost.

- Fix Empowered Channeling half-cover attachment to run on the active GM after native RegionDocuments are created; the earlier hook provided raw data and could not create the cover behavior. Stamp each modified region with its cast identity and validate the casting card, modification-use receipt, actor ownership and exact region before adding cover. Track the request with pending-cast cancellation and keep duplicate requests idempotent.

- Recognize Spirit Guardians’ native Cast and Save (free casting) forward activity for the Empowered Channeling cast option, preserving its free-cast resource and separate modification cost. Label the consumption checkbox Empowered Channeling.

- Spirits Bard: Add the native Power from Beyond die to one initial slot-funded Bard spell damage/healing roll per turn through the shared configuration, with mixed-roll selection, no critical doubling, and authoritative claim/rollback handling. Add Modify Spell beside consumption in Bard Spirit Guardians casting configuration, spending Empowered Channeling’s separate native modification use. Apply native Half Cover to the Bard and allies through a distinct behavior on that casting’s region; preserve normal Spirit Guardians damage/slowing, concentration, free-cast uses, spell levels, and unmodified/non-Bard casts.

- Split Spirits from Beyond into an initial Controlled / Unleash / Cancel menu, followed by a dedicated spirit selector and Confirm for the chosen action.

- Mystical Connection now throws both spirit dice together in one animation, preserving the individual results and spirit choices.

- Make the Gather Spirit prompt compact, with Roll Spirit above Skip.

- Spirits Bard: Spirits from Beyond now offers Controlled Channeling and Unleash Spirit. Giving Bardic Inspiration prompts a native-die spirit roll; track each gathered copy separately until unleashed or a Short/Long Rest, including duplicate spirits and Mystical Connection choices. Controlled Channeling uses the native Bonus Action and Bardic Inspiration cost. Unleash uses the linked native spirit activity against a visible creature within 30 feet, centers area spirits on that creature, and consumes only the selected gathered copy when the cast commits. Preserve canceled casts, native damage/healing/save formulas and effects, and prevent old cards from gathering again after a rest.

- Lore Bard: Peerless Skill now appears only on confirmed failed attacks with recorded target AC or ability checks with a recorded DC. Remove manual-DC prompting and reject supplied-DC bypasses; plain ability checks remain manual. Preserve original dice, native Bardic Inspiration scaling, success-only use consumption, failed-result use retention and resource rollback if committing the adjustment fails.

- Mirror Image: Add a native-duplicate snapshot control to incoming single-target attack and linked damage cards, holding damage/hit-effect automation until resolved. Roll one d6 per remaining duplicate; any 3+ consumes exactly one duplicate, turns the attack into a native miss and removes only its unapplied linked damage cards (including late arrivals from open dialogs). If all dice are below 3, resume the hit. Preserve original dice/critical mode, per-cast duplicate identities, Blinded/Blindsight/Truesight exceptions, privacy, active-GM ownership checks and adjustment locks; restore a consumed duplicate if the attack update fails. No resource/effect changes or chat scans occur during rendering.

- Glamour Bard: While native Majestic Presence is active, automatically prompt an attacker’s native Charisma Recoil Save on its first hit against the Bard each turn. Reserve checks per attacker/presence/turn before prompting, hold linked automatic damage and hit effects until resolved, and turn a failed check’s attack into a native miss without rerolling (including critical hits). Add a visible Recoil checked marker, clear old markers on turn changes, and allow later attacks that turn normally. Preserve snapshot eligibility, single-target safeguards, source identities, adjustment locks, save corrections and native activation costs; consume no extra use or Reaction for Recoil.

- Mirror Image: Allow the native utility activity’s hidden duplicate-check formula through buff automation and apply its three native Duplicate effects together. Keep unrelated rolling utilities and multiple-effect choices manual, and retain native effect application/Undo and duplicate counter changes.

- Commanded now uses native target-turn-end expiry rather than a six-second timer. Normalize new applied copies and existing module-created active markers without resetting their original application time.

- Mantle of Majesty: Free Bonus Action Command casts automatically fail saves for recorded targets already Charmed by the casting Bard. Snapshot the exact Charm source when casting, validate it on the active GM, and create a labeled fixed-failure native save without rolling dice. Exclude normal action/upcast Commands and another caster’s Charm; retain target identity, roll privacy, duplicate guards and native failed-save effect application.

- Countercharm now only offers assistance to the Bard or friendly creatures. Filter hostile/neutral recipients at save-card creation and revalidate disposition on use so an enemy’s failed Charm/Fear save cannot trigger the control.

- Glamour Bard: Unearthly Appearance activates through a level-1 Bonus Action Command cast, consuming the native Mantle of Majesty use without a spell slot. Create the native self-buff with a dependency on that cast’s one-minute concentration; ending concentration removes the buff, and dismissing/expiring the managed buff ends its linked concentration. While active, Command defaults to free Bonus Action casting at level 1; upcasts restore normal action/slot costs. Show the active Mantle note in spell-slot consumption and retain native targeting, pending-cast refunds and owned spell data.
- Command: Add a basic Commanded reminder effect to failed saves through native effect application. Preserve existing spell effects, avoid duplicate markers, keep command execution manual and use native timed expiry and Apply/Undo.

- Glamour Bard: Register native Beguiling Charm and Beguiling Fear with the shared recurring-effect workflow. Prompt a Wisdom save at the affected creature’s turn end using the recorded Bard DC; success removes only that effect, failure retains it. Repeat-save helpers consume no resources and do not reapply conditions. Recover existing active effects on reload while retaining native one-minute expiry and external automation exclusions.

- Dance Bard: Leading Evasion uses the shared Evasion save labels and per-target damage multiplier. Apply no damage on success and half on failure for Dexterity half-damage saves to the Bard and any creature within 5 feet subject to the same save, without requiring friendly disposition. An Incapacitated Bard cannot grant it. Preserve native resistance, original damage dice, damage locks and Undo; add targeted source-feature refreshes without chat scans.

- Dance Bard: Tandem Footwork adds an optional checkbox to the initiative roll dialog. Spend one Bardic Inspiration and roll the native scaling die once; add the same result to the Bard and allied encounter participants within 30 feet who can see or hear the Bard. Preserve existing initiative dice when adjusting rolled allies and their tracker totals; store the bonus on encounter combatants who have yet to roll. Retain roll-mode privacy, cancellation refunds, active-GM validation and duplicate-request protection. Show the applied bonus on initiative cards.

- Bard: Words of Creation allows one or two selected creatures for Power Word Heal/Kill. Override the target count only on the temporary cast item, and validate distinct targets within 10 feet of each other (including elevation and metric scenes) at cast start and before consumption. Warn and abort invalid casts without spending resources; retain native single-target guards for characters without the feature.

- Bard: Superior Inspiration restores expended Bardic Inspiration to two available uses when a native Initiative roll card is created. Preserve higher balances and native use maximums; process each initiative once through the active GM (or owner without a connected GM). Card updates, rerenders and roll adjustments do not trigger another recovery.

- Bard: Font of Inspiration automatically adds native Short Rest recovery to Bardic Inspiration when the feature is owned, including existing characters. Preserve prior recovery rules, avoid unchanged writes, and restore the prior configuration when Font is removed or automation disabled.
- Bard: Countercharm adds a snapshot Reaction control to failed saves against a source activity’s configured Charmed/Frightened effects, for self or creatures within 30 feet. Reroll with Advantage while preserving existing modifiers and normal disadvantage cancellation, keep the replacement result, animate only replacement dice, and refund the Reaction if the adjustment fails. Use active-GM validation, grouped save cards, shared refresh/governor workflows and damage/effect adjustment locks.

- War Cleric: Guided Strike offers a +10 adjustment on an unresolved missed self/allied attack. Snapshot eligible Clerics at card creation, check 30 feet from the Cleric to the recorded defender as requested, spend one native Channel Divinity, and reserve a Reaction only for assisting another creature. Preserve original dice and roll mode, re-evaluate the native attack result, respect damage/effect locks and restore resources if adjustment fails. Support grouped cards, active-GM player requests and targeted shared refreshes; retain single-target attack eligibility.

- Trickery Cleric: Invoke Duplicity checks the native illusion summon at attack time. Distract grants the Cleric advantage when both are within 5 feet of a target that can see the illusion; Improved Duplicity extends advantage to allied attackers against targets within 5 feet of the illusion. Use AC5E conditional sources with native advantage/disadvantage cancellation and live position checks; leave summoning, movement and Healing Illusion native.

- Life Cleric: Disciple of Life adds a labeled, non-critical flat healing bonus to the existing spell healing roll and a locked applied-Yes note in its configuration. Use the native feature formula and slot level recorded when the spell is paid for, including upcasts/Pact slots; limit the bonus to the turn of casting. Preserve original healing dice, multi-target application, existing modifiers and native Apply/Undo, and deduplicate configuration rebuilds. Also support skipped dialogs; exclude temporary HP, slotless/refunded casts and feature healing such as Blessed Healer.

- Life Cleric: Blessed Healer creates a native “Blessed Healer - X HP” healing card after a slot-funded spell actually restores HP to another creature. Use the feature’s native formula and the recorded slot level, auto-apply the self-healing independently of general auto-healing settings, and retain native HP caps and Undo. Deduplicate across recipients and subsequent Apply/Undo; exclude temporary HP, self-only healing, slotless casts and recurring ticks. Keep the original spell’s automatic workflow running and avoid changing its targets or rolls.

- Place Manifest Magical Knowledge inside the spell dialog’s Consumption box, directly below Consume Spell Slot, using the same row layout so the checkboxes align.

- Knowledge Cleric: Mind Magic adds “Manifest Magical Knowledge” to the spell-confirmation dialog only for prepared Divination spells on the Knowledge Domain list. Checking it unchecks spell-slot consumption and spends one Channel Divinity through native resource consumption; unchecking restores the prior slot choice. Grey out the option without Channel Divinity, revalidate on confirmation, retain pending-cast cancellation/refunds, and use the native Magic-action/base-level/material-free casting rules without changing the owned spell.

- Grave Cleric: Divine Reaper adds an optional Enhanced Necromancy checkbox to eligible spell usage configuration. Allow Grave Domain table spells and single-creature Necromancy spells of level 5 or lower; respect selected spell level, exclude native Self-only/area spells, and grey out the option when Channel Divinity is unavailable. Spend one Channel Divinity through native consumption, preserve the original target, and require a second distinct creature within native range in the shared confirmation before continuing. Preserve pending-cast refunds, spell slots, grouped rolls and effects, including dead/0-HP recipients for resurrection spells. Costly/consumed material components remain manual for each target. Link manual Keeper of Souls to Divine Reaper’s own charge through a temporary activity override, retaining native rest recovery and level-6+ slot restoration without spending a Reaction.

- Grave Cleric: Sentinel at Death’s Door snapshots a damage-card Reaction for a friendly Bloodied attack target within 60 feet. Capture pending/player-created cards once on the active GM before automation can apply HP; never repopulate historical cards after feature, HP, resource, reaction or position changes. Recheck current sight/range on review and use. Spend one native feature use and the shared Reaction, halve existing raw damage with combined typed-part rounding down, and retain the original dice and critical roll metadata. Native resistance and Apply/Undo run afterward (50 → 25 → 12 with resistance). Use the shared reactive stop/resume workflow, validate the exact attack/target on the GM, refund failed adjustments, and keep single-target restrictions.

- Simplify the Path to the Grave attack-card button to “Path to the Grave.” Open the native damage configuration for the clicking player/GM, keep Radiant and Necrotic selectable there, and remember the last submitted type per user/Cleric. Canceling preserves the curse and previous choice; revalidate the captured hit/curse before submission. The independent rider still leaves primary damage automation running.

- Grave Cleric: Path to the Grave recognizes the native curse and supplies attack/save Disadvantage through AC5E, with normal cancellation and a native fallback. Snapshot the original curse on self/allied attack cards; on a hit, the Cleric’s owner/GM can roll the native Cleric-level Necrotic or Radiant damage separately and consume only that curse. Preserve newer applications, prevent duplicate damage, and allow a failed curse-removal retry without another roll. Leave source-turn expiry intact and keep original attack damage automation running. Auto Apply Buffs now supports the native single-target Curse activity through the existing effect/Undo workflow.

- Grave Cleric: Circle of Mortality adds the native Pull of Death Necrotic die to damage configuration for a single wounded spell/attack target, using native scaling (d4, d6 at Cleric 11), critical policy and the shared once-per-turn authority/rollback workflow. Maximize HP-restoring dice from spells or Channel Divinity when every recorded recipient is at 0 HP, preserving modifiers, native cards and Apply/Undo. Keep temporary HP and unrelated feature healing normal; use separate rolls for mixed 0-HP/conscious recipients. Return to Life remains manual.

- Snapshot Modify Magic eligibility at spell creation and first-save creation. Later Channel Divinity corrections, feature/stat changes, token movement and disposition changes cannot introduce offers on historical cards. Keep existing offers stable across resource changes, revalidate live resources on use, and stop scheduling character-driven Modify Magic history refreshes. Cards predating the snapshot remain inactive.

- Restrict Modify Magic’s Fortifying Spell button and use validation to spells with a recorded friendly creature target (including the caster). Enemy-only and neutral-only targets do not qualify.

- Arcana Cleric: Modify Magic adds Fortifying Spell to native spell usage cards and Tenacious Spell to successful enemy first-save cards. Require an available Channel Divinity use and one option per cast; Fortifying requires one recorded spell target and uses the native temporary-HP roll/Apply/Undo. Tenacious preserves the original save dice, subtracts the native d6 and respects applied damage/effect locks. Validate player requests on the active GM, refund failed actions and refresh through the shared queue.

- Harden Corona’s initial application against attached-Region geometry not reporting occupants immediately: use the source token’s grid distance and level as a fallback for its 60-foot emanation. Upgrade the one-time initialization marker so existing areas retry the corrected pass, and use the same fallback when checking qualifying saves before the first movement.

- Fix Corona of Light requiring movement before enemies already inside received its effect. Initialize eligible current occupants once on the active GM through the native Region entry handler, checking existing behavior-owned effects to avoid duplicates. Recover uninitialized existing areas and leave subsequent entry/exit movement handling native.

- Light Cleric: Corona of Light activates its native one-minute self effect and use consumption without placing the visible book template. Create a hidden, token-attached 60-foot grid emanation with native enemy-only Corona effect entry/exit handling. AC5E (or the native fallback) adds Disadvantage against the source Cleric’s Radiance of the Dawn and any Fire/Radiant damage spell, honoring actual/Transmuted damage types and Advantage cancellation. Add 60-foot bright/90-foot total light through the shared lighting manager, preserving other divine lights, stronger/manual lighting and safe restoration. Remove the area and its source-owned enemy effects on expiry/dismissal; coalesce synchronization and check time/turn expiry only for indexed emitters.

- Fix Warding Flare leaving linked damage critical after the attack becomes a normal hit. Reuse the existing critical-mode converter to preserve normal dice, modifiers and non-critical bonuses, update pending-roll critical defaults without replacing their sessions, and align newly published damage before automatic application. Limit the correction to the linked attack’s unapplied damage and retain subsequent manual critical controls.

- Light Cleric: Warding Flare offers a single-target attack-card Reaction for a visible attacker within 30 feet attacking the Cleric or a friendly creature. Snapshot eligibility once when the attack card is created; movement, stat/charge changes and reaction resets never repopulate historical offers. Validate live resources/permissions on click, spend the native use and Reaction, and reuse Deflect’s original-dice-preserving Disadvantage correction, linked hit/miss damage guards and failure refunds. Improved Warding Flare enables native Short Rest recovery and opens its native 2d6 + Wisdom temporary-HP roll for the clicking player/GM, targeting the attacked creature. Resolve/apply those temporary HP before incoming damage automation resumes, or decline the optional roll to continue. Preserve native Apply/Undo and grouped/standalone controls.

- Cleric: Improved Blessed Strikes plus Potent Spellcasting offers the owner/GM a temporary-HP reminder after a Cleric cantrip actually deals HP or temporary-HP damage. Deduplicate across targets by the source cast. Target yourself or one current creature within 60 feet and click to run the native twice-Wisdom temporary-HP action, preserving separate healing targets/origins and native Apply/Undo. Validate requests on the active GM, prevent duplicate use and allow retry after canceled creation; no reminder for unapplied, zero, immune or fully undone damage.

- Cleric: Channel Divinity retains native Divine Spark healing/save damage, scaling, consumption and rest recovery; require one other creature within 30 feet. Turn Undead automatically centers its 30-foot area on the Cleric and confirms eligible Undead, including friendly Undead if selected. Add native Sear Undead Radiant damage to Turn Undead when the feature is owned, with minimum 1d8 and no damage on a successful save. Preserve the Turned conditions against that same casting’s Sear damage; end them on subsequent damage or caster incapacitation/death, with source-indexed cleanup and player-to-GM routing.

- Cleric: Divine Strike and Potent Spellcasting integrate with the existing damage configuration. Divine Strike offers native Necrotic/Radiant damage and 1d8/2d8 scaling on a weapon hit once on the Cleric’s own turn, including criticals, authoritative claims and failed-roll refunds. Potent Spellcasting adds a labeled Wisdom modifier to a selected Cleric cantrip damage part without doubling on criticals. Both default Yes, preserve original dice and have separate Cleric settings; Druid riders retain their existing behavior.

- Fix Master Transmuter rolling back the Stone after publishing Panacea healing: native rollDamage returns dice rolls, so resolve the actual healing message through the usage card’s native linked-roll index. Complete healing/condition cleanup against that card, leaving a consumed Stone disabled and a slot-preserved Stone active. Add full action-flow regression coverage for both costs.

- Fix Master Transmuter rejecting native healing cards whose target UUID field resolves to a Token document. Accept resolved token references as well as stored UUID strings, allowing healing/condition cleanup to complete and the consumed Stone to remain disabled; preserve the Stone when a level 7+ slot is used.

- Transmuter: Master Transmuter uses the active Stone effect for Panacea, Restore Life and Restore Youth. Consume/disable the Stone or spend an available level 7+ slot to preserve it. Panacea heals half the target’s maximum HP and clears Poisoned/Petrified; Restore Youth clears Exhaustion; Restore Life uses native Raise Dead healing and resurrection penalties, recovering one penalty per Long Rest. Add the missing Restore Youth action, validate player requests on the active GM and refund canceled actions. Major Transformation, age changes and cursed items remain manual.

- Fix Empowered Transmutation with Magic Weapon: native enchantment availability uses effective casting level while item.system.level remains the base spell level. Preserve the native filtered choices instead of rejecting them with a second base-level filter. Effective level 3 selects +2; effective level 6 selects +3, preserving selected slot cost.

- Transmuter: Empowered Transmutation appears in eligible spell casting dialogs. Spend one native feature use and the selected level 1–8 slot while applying the next level’s native scaling. Fly opens editable target confirmation with the enhanced limit; Magic Weapon switches to the correct higher-level enchantment profile. Preserve normal slot/resource selections, concentration and canceled-cast refunds, including rebuilt Activity instances in the shared pending-cast workflow.

- Transmuter: completing Long Rest prompts for Transmuter’s Stone benefits and creates one indefinite actor effect representing possession of the stone. Include native Constitution save proficiency plus one benefit, or up to two distinct benefits with Potent Stone, including different resistances. Reuse native changes, replace prior stone benefits, preserve cancellation and unequip native inventory stones to prevent duplicate transfer bonuses. Deleting the effect removes the stone and its benefits for later Master Transmuter integration.

- Fix Extinguish Undead damage scaling being one Hit Die too high. The lookup/display were correct, but native @scaling adds one to the usage increase. Convert remaining HD to that native increase so 12 HD rolls 6d6 and 2 HD rolls 1d6, preserving odd-HD rounding and the minimum die.

- Necromancer: Undead reduced to 0 HP offer Owned- Extinguish or Other - Extinguish actions. Owned triggers use no Reaction or slot; Other requires an available Reaction and a selected level 5+ ordinary/Pact slot, consumed through native casting. Snapshot remaining Hit Dice, preserve the native rounded-up half-HD damage formula/minimum, center the save/damage area on the dead token and mark failed-save Extinguished effects as blocking Reactions until target turn start. Guard repeated deaths, revival, Undo and duplicate corpse use; support player/GM casting, native cancellation/refunds and targeted resource refreshes.

- Animate Dead now places one Skeleton/Zombie per casting placement or later Summon click, as requested for table-managed corpses and control. Preserve spell targeting, resource consumption, summon stats and native upcast/control capacity; other summoning spells are unchanged.

- Compatibility: repair the malformed native Undead Thralls (Animate Dead) summon-profile override on the temporary casting copy. Preserve the official Skeleton/Zombie profile IDs, counts and HP/damage bonuses, and synchronize the summon dialog’s profile choices so placement does not fail with “Cannot find summoning profile.” Saved spells and installed content are unchanged.

- Necromancer: Grave Power creates an Overwhelming Necrosis effect that lets Wizard spell/feature damage ignore Necrotic Resistance while preserving immunity and other damage types. Respect effect disabling and feature removal. Arcane Recovery’s Short Rest section notes Grave Resilience and reduces Exhaustion by 1 in the same native bulk recovery update; no selection/cancellation spends or recovers anything.

- Necromancer: slot-funded Necromancy casts offer an Undead Vitality action to the owner/GM. Require exactly one currently targeted visible Undead within 60 feet, warning before invalid use. Run the native Wizard-level plus spent-slot-level healing with separate usage/target links and normal Apply/Undo; preserve original spell targets, prevent duplicate use, and validate player requests on the active GM.

- Illusionist: Illusory Self appears on incoming hit cards for the wizard/GM while a charge and Reaction are available. Spend both to make that wizard’s target result automatically miss, including critical hits, preserving original dice and other targets. Keep the miss through AC refreshes and integrate reactive automation, grouped cards, GM validation, locks, shared refreshes and failure refunds. As requested, automatically recharge a spent use after any completed spell cast using a level 2+ slot, with an Illusory Self Recharged note on the cast card.

- Enchanter: Split Enchantment automatically adds one creature to qualifying Enchantment spells that gain targets when upcast. Stack the extra target with normal spell-slot scaling, without spending a feature charge or a higher/additional slot. Modify only the temporary cast’s target formula; preserve concentration, damage scaling and source spell data.

- Enchanter: a completed, slot-funded Enchantment spell restores spent Instinctive Charm and adds “Instinctive Charm Recharged” to that cast card. Ignore free, pending and recurring casts; handle ordinary/Pact slots once per cast, avoid retroactive recharge from old cards and leave the wizard’s Reaction spent.

- Fix Instinctive Charm Retarget presentation for player clients viewing enemy attacks as grouped inline summaries. Render the existing scoped Retarget control on the correct attack face and refresh that attack/parent when the authoritative save state changes. Unrelated players retain no Retarget permission.

- Enchanter: Instinctive Charm appears on qualifying single-target hit cards for the wizard/GM when a charge and Reaction are available. Spend both, prompt the attacker’s native Wisdom save and, on failure, mark the original target missed and grant the wizard scoped Retarget access. Choose one other creature within the attack’s range; preserve original attack dice and linked-card targeting. Snapshot eligibility on creation, respect damage/effect locks and integrate reactive auto-apply stops/resumption, shared refresh batching, GM validation and failure refunds.

- Fix Hypnotic Presence range expiry after player movement. Check native movement completion as well as coordinate updates, measure saved token positions instead of animated coordinates, and route owned player movement to the active GM for authoritative range validation and cleanup.

- Enchanter: Hypnotic Presence ends when the target takes damage or movement puts the caster and target more than 10 feet apart. Track the source/target tokens, recover existing native effects and use a targeted movement index with active-GM expiration. Preserve unrelated effects, native saves/duration and manual visibility/hearing decisions.

- Fix Third Eye rest cleanup for native activity-origin and copied-effect UUIDs. Recognize Darkvision, Greater Comprehension and See Invisibility applied from Third Eye, including existing buffs, and preserve Short/Long Rest expiry when reapplying them.

- Diviner: applied Third Eye benefits expire on Short or Long Rest, including previously applied buffs. Preserve manual Bonus Action activation, source-item effect templates and unrelated See Invisibility spells.

- Diviner: Long Rest clears previous Portent reminders and posts a private Roll Portent button for the owner and GM. Click to roll two d20s, or three with Greater Portent, then record each result as a separate Portent effect after dice animation. Disable/delete results when used at the table; no automatic D20 Test changes. Reject stale prompts and prevent duplicate rolls/effects.

- All native concentration-based summons now link their placed tokens to the cast’s concentration, across classes and both immediate/later Summon placement. Ending or disabling concentration removes only that cast’s summons, with active-GM cleanup and per-scene deletion batches. Preserve non-concentration summons and existing Splintered Summons handling; reject stale Summon buttons after concentration ends. New placements only; no retroactive scene/chat scans.

- Fix Splintered Summons interrupting the cast with a concentration error. Reprepare the temporary spell item after adding feature consumption so native inherited concentration remains available.

- Conjurer: Splintered Summons adds a checkbox to eligible summon casting dialogs. Spend one native feature use with the spell slot, place two matching spirits, halve their scaled current/max HP and remove both when concentration ends. Keep Durable Summons temporary HP at full strength; canceled or incomplete placement refunds the cast and removes partial summons.

- Conjurer: Focused Conjuration suppresses damage concentration prompts for the character’s Conjuration spells. In mixed concentration checks, keep other schools eligible and exclude protected spells from automatic failure cleanup. Use the concentration effect’s native spell/source links; preserve manual concentration rolls and ordinary concentration ending.

- Conjurer: Durable Summons automatically grants its native temporary HP and conditional resistance effect to creatures placed by slot-funded Conjuration spells. Apply per-token ActorDelta changes during summoning, preserving higher temporary HP, existing scaling/effects, source actors and concentration links. Support both immediate placement and later Summon chat actions with isolated source-card context; exclude slot-free casts and spell-area markers.

- Bladesong compatibility: keep the native actor buff and all its bonuses, but prevent the redundant Heroes of Faerûn weapon-enchantment loop when this module handles Intelligence weapons. This avoids its deprecated numeric-effect API call and repeated weapon-effect scrolling text. Silently remove only old generated Bladework enchantments on the affected actor; preserve custom enchantments and normalize legacy buff reactivation/Undo without editing the official module.

- Song of Defense now records eligible recipients, active Bladesong, available slots/Reaction and the combat turn when the damage card is created. Empty snapshots and older cards remain ineligible after later buff activations or reaction resets. Revalidate current resources and active Bladesong on use, retain existing reductions/Undo, and restrict resource-driven refreshes to snapshot candidates.

- Bladesong eligibility now requires an active actor-applied buff. An enabled effect template on the feature can no longer enable Intelligence weapon overrides or Song of Defense while the actor’s Bladesong is inactive. Recheck the same condition on the GM before spending a spell slot or Reaction.

- Bladesinger: Song of Defense appears as an incoming damage-card Reaction during Bladesong. Its spell-slot dropdown shows level, remaining slots and native damage reduction, including Pact slots. Confirm spends one slot and Reaction, then uses the existing recipient-specific reduction breakdown without rerolling shared damage. Integrate reactive automation, HP Undo, cancellation, stale-state validation, duplicate-click protection and failure refunds.

- Bladesinger: active Bladesong uses Intelligence for proficient weapon attacks and damage, including cached Strength/Dexterity attack selections, without editing weapon source data or adding enchantments. Arcane Recovery includes Restore Bladesong Yes/No inside its Short Rest section. Default to Yes when selecting spell slots, preserve an explicit No, and allow recovering only one Bladesong use when no slots need recovery. Either selection consumes the same native Arcane Recovery use; keep bulk updates, cancellation, full-pool and repeated-preparation safeguards.

- Abjurer: Spell Resistance recommends Advantage against spells through AC5E or the native save configuration with normal cancellation. Apply native resistance to spell damage per recipient, stacking with a successful half-damage save for quarter damage without doubling existing resistance. Label qualifying save rows and damage cards, preserve immunity/vulnerability/rounding/Undo, and exclude magical abilities that are not spells.

- Automatic effects now stop for GM resolution when an affected NPC has Legendary Resistance remaining or multiple applicable effects require a choice. Failed-save Legendary Resistance decisions also stop linked automatic damage before HP changes. Keep native manual Apply/Undo controls, leave effect-choice buffs and damage-linked effects manual, and show a GM reminder without polling or automatically resuming when resources change.

- Abjurer: Projected Ward adds an incoming damage-card Reaction for a visible friendly creature within 30 feet. Use compact Project Ward buttons with ward HP; hover for caster and recipient names. Reuse the caster’s Arcane Ward after the recipient’s mitigation; only overflow reaches their temporary/normal HP. Keep shared rolls and other recipients unchanged, preserve both wards when the recipient has their own, route foreign ward spending through the GM, and restore ward resources with damage Undo. Integrate with reactive auto-apply and the shared chat-refresh queue.

- Abjurer: Arcane Ward uses the native HP tracker and Create Ward activity. A completed, slot-funded Abjuration cast offers a clickable creation reminder while the daily use remains; later casts restore twice the slot level and report actual ward HP restored. Applied damage drains ward HP after mitigation and before temporary/normal HP. Damage Undo restores the ward and HP together, including fully absorbed hits; previews and canceled casts spend nothing. Keep existing manual ward activities and protect later Long Rest resets from stale reminders/Undo.

- Evoker: Overchannel moves into spell damage configuration, showing the free first use or escalating Necrotic backlash formula. A single activation maximizes the spell’s own dice across all rays on the casting turn, without maximizing Hex, Minor Elementals, other riders or extra bonus formulas. Track total activations with the native uses-spent counter and Long Rest recovery; preserve canceled/failed-roll rollback. Backlash uses a self-targeted native damage card, ignores Necrotic Resistance/Immunity and retains Apply/Undo.

- Evoker: Empowered Evocation adds Intelligence to one chosen initial damage roll per Wizard Evocation spell cast, with a default-Yes damage configuration choice. Later rays and recurring region/effect damage receive no second bonus. Preserve original dice, damage type, critical handling and rollback on canceled/failed rolls.

- Evoker: Potent Cantrip prompts damage even when a cantrip attack misses, applying full damage on hits and half on misses. Damaging cantrip saves deal full damage on failure and half on success. Successful saves and missed attacks do not apply additional effects; reaction corrections, native resistance handling, manual multipliers and Undo remain available.

- Evoker: Sculpt Spells adds friendly protection choices to target confirmation for qualifying Evocation save areas. Select up to 1 + casting level visible friendly creatures other than the caster; confirmed protected creatures are excluded from that cast’s saves, damage and effects. Keep other targets and existing Metamagic/confirmation workflows, reject stale or oversized selections, and complete casts with no remaining targets without leaving a pending card.

## v0.8.4 — Sorcerers, Wizard Casting & Region Preview (2026-11-02)

### Sorcerer

- Compact Select Metamagic uses one or two option dropdowns with details only for chosen options, current Sorcery Points and confirmation costs. Quickened tracks the Bonus Action; Subtle, Distant and Extended record declarations and spend points. Range/duration/component changes for these declarations remain manual. Reaction spells skip the cast-time Metamagic window.
- Twinned Spell lets the player add an eligible second target on the map, then carries both targets through the existing save/damage workflow without spending a higher-level slot. Existing option limits, Arcane Apotheosis, cancellation and refunds remain in use.
- Font of Magic provides budget-aware slot/point conversions. Sorcerous Restoration appears during Short Rest when available.
- Draconic Elemental Affinity selects its element/resistance and adds the native Charisma bonus to matching spell damage.
- Aberrant Psychic Defenses integrates condition-save Advantage; Psionic Sorcery offers point payment for eligible spells; Revelation in Flesh selects native benefits and their cost. Warping Implosion uses its free-use/point choice, caster-centered burst and supported 120-foot teleport animation.
- Clockwork Restore Balance offers a creation-time roll-card action while preserving original dice. Bastion of Law tracks ward dice and per-recipient damage reduction. Trance of Order integrates incoming no-Advantage and minimum d20 results. Clockwork Cavalcade allocates its native healing pool across selected targets.
- Shadow Strength of the Grave offers recovery from recorded damage-card knockouts. Beasts of Ill Omen attaches its caster-specific save aura to native beasts. Umbral Form is an optional additional Innate Sorcery benefit/payment.
- Spellfire Crown is an optional Innate Sorcery benefit; Burning Life Force uses native Hit Point Dice for per-defender damage reduction, and Spell Avoidance uses the existing save/damage outcome handling.
- Wild Magic adds Tides of Chaos to D20 configuration with normal Advantage cancellation. A waiting marker triggers a user-clicked surge prompt after a qualifying slot-funded cast; a setting controls whether the same spell can trigger it. Separate surge checks remain available for qualifying casts, including misses.
- Wild Magic d100 results wait for synchronized Dice So Nice playback. Controlled Chaos presents two results, then keeps the selected card and removes the other. Deferred refreshes cannot restore deleted cards; saved rolls support retries without rerolling.
- Bend Luck offers its native die on eligible failed player tests or successful enemy tests, with resource/reaction validation, original-dice preservation and reactive automation support.
- Tamed Surge opens a table selector with previews and publishes the chosen result. The final table row is excluded. Passive feature entries and blank native result names are supported.
- Wild Magic result cards offer targeted Apply Effect and Undo controls. Native conditions, AC/resistance/vulnerability bonuses are applied directly; complex results retain their rules as labeled reminders. Recurring surges offer turn-start roll prompts for one minute and ignore another recurrence result. Keep unresolved portions, including Magic Missile immunity on Spectral Shield, table-managed.

### Wizard

- Arcane Recovery appears during Short Rest when available, with shared live budget controls for expended level 1–5 slots. Slot recovery and the native feature use are committed together; Wizard and Natural Recovery counters remain independent.
- Spells with a live Mastered enchantment default slot consumption off at base level and on when upcast, retaining native manual overrides.
- Make Signature configures each marked level-3 spell with one use recovered on Short/Long Rest and a separate Signature Cast/Use activity. The duplicate casts at base level using that spell’s charge; original activities retain normal slot casting/upcasting after exhaustion. Existing enchantments migrate without recharging spent uses. Removing the enchantment removes only the generated activity.
- Item-enchantment cards no longer offer map Retarget; native inventory selection handles their recipients.

### Targeting and corrections

- Live Region target preview follows manual movement and rotation using existing casting filters and native geometry. Movement is coalesced per frame; unchanged target sets are skipped. Preview cleanup restores the previous selection and does not change post-placement targeting or confirmation.
- A Targeting setting controls the preview and displays a persistent GM restart/refresh reminder when changed.
- Slow clears its targeting-only Region at caster-turn end while preserving active effects, concentration and repeat saves. Arms of Hadar excludes the caster from automatic area targeting.
- Infernal Wounds uses current Foundry message-mode settings without reading deprecated core.rollMode.

### Local verification

- A four-process runner, shared test helpers and named consolidated suites preserve regression cases while reducing repeated setup. Local tests/tools remain Git-ignored and excluded from the runtime ZIP.
- Release packaging is local only. See RELEASE-NOTES-0.8.4.md for validation and updating guidance.

## v0.8.3 — Warlocks, Artificers, Druids & Reactive Combat (2026-10-31)

- Graze correction: when a miss becomes a hit, retire and delete its unapplied Graze card, clear that target’s handled marker, and allow the normal hit-damage prompt immediately. Graze readiness and final HP application now require a current miss; retired/obsolete Graze cannot trigger hit effects or block the normal prompt. Preserve already-applied Graze transactions until Undo.

- Guiding Bolt: bridge its native marked effect into AC5E next-attack Advantage, with normal disadvantage cancellation and a native fallback. Snapshot the target application during roll configuration and consume it only after an attack is actually rolled (hit or miss), using active-GM validation. Canceling preserves the effect; newer applications and unrelated marked effects are protected.

- Move Auto Apply Status on Hit for damaging attacks to the actual HP Apply step, for automatic and manual damage independently of the reactive governor. Rolling a hit alone no longer applies those effects. Use only recipients whose damage was processed, retain current hit filtering, native durations/concentration and separate Undo, and preserve save-based/effect-only workflows. Failed effects remain retryable without repeating damage.

- Fix reactive Shield timing: an early utility-use refresh no longer resumes damage while the AC buff is still being applied. Resume only from the applied Shield cast, then revalidate recorded hits after the final async boundary and immediately before automatic HP changes. Keep damage cards with HP/effect Undo history visible even when a later correction makes the attack miss.

- Expand the reactive governor to Empowered/Seeking Spell, Precision Attack, Dark One’s Own Luck, Fanatical Focus, Indomitable, Disciplined Survivor, Shared Resilience, Homing Strikes, Peerless Skill, Combat Inspiration AC, Uncanny Dodge, Investment resistance, Superior Hunter’s Defense, Elemental Rebuke and Beguiling Defenses. Check actual usable controls/resources, not already-consumed flags. Empowered Spell settles the cast-wide reroll limit before requesting a fresh check, while preserving explicit manual/Undo decisions.
- Under reactive logic, defer effects until the ordinary damage roll exists/is evaluated, so damage-stage adjustments can be offered before Apply. This uses existing roll events without polling or a persistent reaction stop for an unrolled damage card.

- Add the opt-in Automate Damage and Effects with Reactive Logic governor above the existing auto-apply options. Usable Shield, Flash of Genius, Cosmic Omen and supported inspiration/deflection/reduction controls terminate that card’s automatic attempt with no polling or reaction timeout. Committed adjustments request one coalesced recheck of only the linked workflow; remaining reactions stop it again. Keep manual Apply and Undo authoritative.
- With the reactive governor enabled, manual damage Apply also handles the same activity’s native hit/save effects, including first applications. Respect recorded hits, failed saves and On Save profiles, partial recipients, player ownership, Region-managed effects, newer equivalent effects and separate effect Undo. Preserve the previous attack-only reapply behavior when the governor is off.

- Damage Apply now also restores undone effects tied directly to that same attack’s recorded hits. Reuse native effect/Undo tracking after HP application is recorded, restrict player requests to owned damage recipients, preserve partial-target application, and leave save/healing effects separate. Effect failure does not repeat or roll back already applied damage.

- Auto Apply Status on Hit: after Undo Effect, offer a manual Apply Effects control on the affected attack/damage card, including grouped cards. Reuse recorded hit targets and native effect/Undo application; preserve Region-managed and newer equivalent effects, allow Undo again after reapplication, and keep the automatic workflow stopped. Normalize the setting label from Autoapply to Auto Apply.

- Starry Form: delete superseded applied forms when activating/changing constellations instead of retaining inactive copies. Keep the current form temporary and allow inactive applied Starry Forms through end-of-combat cleanup even when their source is an owned feat; preserve native grants and active forms. Restore prior effects if replacement fails.

- Cosmic Omen: snapshot relative disposition with range. Offer Weal for friendly failed tests and Woe for hostile successful tests; no known DC/outcome remains a manual choice for the appropriate side. Neutral creatures have no side restriction. Use recorded hit/miss outcomes for attacks, and exclude kept natural 1s/20s without treating discarded advantage/disadvantage dice as the result. No movement/disposition-driven history refreshes.

- Cosmic Omen: offer Weal/Woe only on failed D20 Tests when a numeric target DC is recorded. Hide successful tests, keep no-DC tests available for manual use, and enforce the same eligibility on the GM.

- Cosmic Omen: store adjustment results with dot-free keys so Foundry does not expand Actor UUIDs into malformed result labels. Read older expanded records and show the signed Weal/Woe die result. Omit new icons when the Druid has no charge or available Reaction; resource recovery does not backfill older cards.
- Cosmic Omen initiative: compare evaluated roll state rather than derived formula/default metadata, retain actual concurrent-roll checks, and link new initiative cards to their exact combatants. Update the chat total and tracker together, reject superseded initiative cards, and roll back tracker/resource changes on failure.

- Stars Druid: Cosmic Omen adds a Long Rest note, rolls 1d2 after completion, and replaces the prior omen with Weal (even) or Woe (odd). Snapshot visible creatures within 30 feet when attack/save/check cards are created; show an owned Druid/GM icon using the native omen activity and charges. Preserve original dice/modes, spend a combat Reaction, roll back failed adjustments, and disable processed HP/effect cards until undone. No movement, resource, or turn-driven refresh of historical Omen cards.

- Healing Chalice: open the native healing dice dialog on the clicking client and show a Pending roll chat card through the shared pending-damage workflow. Validate/reserve through the GM, refund canceled rolls, and preserve the Chalice activity/target when retrying a pending card.

- Healing Chalice performance: display its available chat action without an additional all-client dice-animation handshake. Skip existing prompt offers before further work; preserve animation waits for actual healing application.

- Reduce Starry Form/Archer preparation overhead: reject unrelated activities before Conjure Elemental trigger-library scans, and reserve Archer turn/initial-shot/window flags in one effect update instead of three. Preserve native effects, resource validation and rollback.

- Healing Chalice: preserve the recipient selected when clicking its action instead of replacing it with the original healing spell’s recorded target.

- Starry Chalice: after a slot-funded healing spell, post a private Healing Chalice chat action for owners and GMs. Require one selected creature within 30 feet; roll the native scaled bonus healing for that creature, retaining once-per-turn validation and grouping with the source spell.

- Elemental Fury: Potent Spellcasting also recognizes the short Potent Spellcasting feature name/identifier. Offer its labeled Wisdom damage bonus, default Yes, on damaging cantrips regardless of spell class; retain native dice and damage type.

- Stars Druid: choose Starry Form on activation with native Wild Shape consumption. Include owned Full of Stars resistances in all constellations; use native Dragon/Twinkling benefits and scaling. Offer a free initial Archer attack and private turn-start BA actions, slot-funded Chalice bonus healing once per turn, and a once-per-turn Twinkling constellation selector that preserves the original duration. Route player requests through the active GM and preserve native grouped rolls and resource cancellation.

- Wrath/Oceanic Gift initial damage: after manifestation, confirm one optional enemy per bearer’s native range in one popup. Combine selected targets into a single native save group and shared damage roll/card, using the original Druid’s DC/Wisdom without another Bonus Action or Wild Shape cost. Suppress application-time BA prompt cards; retain private bearer turn-start cards. Keep recorded targets visible on Wrath save/damage summaries.

- Register the Sea main-item activation interception with libWrapper as MIXED when available, preserving Monk’s Combat Details’ Item.use chain and avoiding its direct-wrapper conflict warning. Retain the fallback for installations without libWrapper.

- Oceanic Gift / Wrath of the Sea: unify main-card and activity activation into a small recipient popup. Before Oceanic Gift, confirm Self Target; afterward choose a friendly creature within 60 feet and optionally include self for two native Wild Shape uses. Route grants through the active GM, share the original Druid’s DC/Wisdom/range and native Stormborn benefits, and replace prior manifestations.
- Post a private BA - Wrath of the Sea chat action for the bearer’s owners and GMs when the buff is applied and at the bearer’s turn start. Validate one visible target in the native range, deduplicate prompt/use requests, preserve the manifestation’s initial damage opportunity without charging another Bonus Action, and use the bearer’s normal Bonus Action on later turns.

- Wrath of the Sea: use a single visible target within the native scaled range, without an aura/Region. Preserve native save, Cold dice and Wild Shape cost; later Bonus Action saves require the active buff and cost no additional Wild Shape use. Apply the 10-minute tracking buff to the caster, include owned Stormborn benefits, replace prior manifestations, and clear on Incapacitated.

- Land’s Aid: restore Retarget to the save usage card and propagate only to its exact linked damage results. Keep healing’s Retarget and targets independent, including when healing has already been applied. Scope grouped control lookup so healing’s button never replaces the save card’s button.

- Land’s Aid: restrict healing selection to friendlies; show recorded targets on its usage/damage/healing cards so save results follow the confirmed recipients. Move Retarget from the shared usage to separate damage/healing results, preserving sibling targets, dice and save outcomes. Retry pending healing with its recorded native healing activity.

- Conjure Elemental: register restrained targets from all four native summon variants for turn-start repeat Dexterity saves, native recurring damage only on failure, and restraint removal on success. Keep initial saves manual, correct Fire’s missing restraint link in prepared activity data, and connect restraints to the original spell’s concentration.

- Land’s Aid: confirm enemies for saves/damage on the left and choose one healing recipient from the same area on the right. Follow native damage with the native scaled healing roll under the same usage origin, without a second Wild Shape use or area placement.

- Nature’s Sanctuary: add a friendly-only Region recipe using one native Half Cover effect with the caster’s selected Nature’s Ward resistance, or Half Cover alone if no Ward applies. Reuse native Region entry/exit cleanup and the existing Simple Cover/AC5E duplicate-cover correction.

- Natural Recovery: recalculate each Short Rest slot dropdown from the remaining shared spell-level budget. Retain selected quantities, show zero-only choices when exhausted, and restore options when another selection is reduced.

- Natural Recovery: select expended level 1–5 spell slots in Short Rest, within half the Druid level rounded up. Add slot restoration and spending of the native recovery activity use to the same rest update. Free Circle Spell casting remains manual and independent.

- Circle of the Land: add a Long Rest land selection, automatically prepare level-appropriate native Circle Spells, replace only dedicated subclass grants, and enable the matching native Nature’s Ward resistance. Remember the last land and preserve ordinary spell preparation and other resistances.

- Moonlight Step: apply the native transport buff to the caster, integrate next-attack Advantage with AC5E, and consume after a completed attack or expire at turn end.

- Moon Druid: Lunar Form adds native 2d10 Radiant damage to Wild Shape attack configuration, default Yes, disabled after once-per-turn use. Preserves critical hits and refunds failed rolls.

- Remember Lunar Radiance’s last Yes/No selection per user and original Druid in client settings. Reuse it for later attacks, across Wild Shape forms and reloads, while keeping each open dialog’s choice stable. Preference writes occur only on selection changes, not preview/render; the first use still defaults to normal damage.

- Moon Druid Lunar Radiance: add an optional Radiant-damage toggle to initial attack damage configuration when Improved Circle Forms is owned and the character is Wild Shaped. Default to normal damage; convert native attack parts on confirmed hits while preserving dice, critical state and independently typed riders such as Primal Strike. Support preview and submitted rolls, including returning the toggle to normal, without spending a resource or changing the native toughness effect.

- Complete shared Region target synchronization: after updating the save card, discover exact linked damage cards through native links plus the shared HP-card index and carry the complete recorded target list into existing or newly published pending damage. Refresh recorded-target presentation through the shared queue while retaining prior unchecked recipients, dice, save outcomes, pending sessions and HP/Undo records. Pending publication reads the latest shared source targets. Reindex only when message type/origin changes, or on creation/deletion, rather than rescanning history for each appended target.

- Correct Conjure Animals’ trigger distinction: creature movement within/out of the Region does not trigger damage, even with those legacy behavior options checked. True entry, end-of-turn and the pack’s own movement remain valid and share the existing turn allowance/card. Ignore a stale movement-damage mode for this save-based spell. Override the installed spell’s erroneous half-on-save behavior in prepared activities and native damage-card output: successful saves deal no damage, preserving failed-save damage, dice, scaling and targets without editing source items or compendiums.

- Conjure Animals now triggers when its pack moves within range of stationary creatures, including creatures passed along the movement path rather than only those inside at the endpoint. Use Foundry 14’s actual movement hook and native Region geometry, with a direct-coordinate fallback. Route pack movement through the same save, per-creature turn limiter and shared damage card as entry/end-turn events; avoid duplicate client execution and leave ordinary token movement untouched.

- Conjure Animals now shares one save/damage card across new targets on the same combat turn, rather than rerolling damage for each entrant. Enable sharing in its built-in/starter recipes and support attached packs retaining the older non-sharing recipe. Preserve original dice, prior saves and HP/Undo records while appending new targets; keep repeat-target gating and start a fresh card on the next turn.

- Restore Conjure Animals’ automatic Region placement: create a native 10-foot emanation attached to the summoned pack through the active GM, retaining the caster’s save activity, cast level, player routing and concentration cleanup. Reuse existing Region triggers and settings, exclude the pack itself, recover missing areas for linked summons on scene load, and prevent duplicate/stale creation. Support upgraded save labels with an exact activity fallback and preserve upcast scaling for older saved recipes.

- Wild Shape and Circle Forms now transform their caster immediately after native compendium selection, without a second chat-card click. Finish the native use/resource flow first, reuse the finalized transformation settings and existing spell/concentration integration, and remove the completed card’s manual Transform action. Preserve cancellation/manual retry, ownership restrictions and unrelated transformation workflows; prevent repeated/concurrent use of the same completed action.

- Preserve concentration begun in Wild Shape when reverting, including Moon spells. Move the current concentration effect, duration and source links to the restored actor before native Beast cleanup; reconnect target/self effects and spell Regions so concentration checks, HUD controls and ending concentration remain usable. Route player reversion through the active GM, handle native replacement tokens, restore links if reversion fails, and protect independently newer concentration on the original actor.

- Beast Spells now expands the native Wild Shape Spells tab with prepared/always-prepared spells and known cantrips, excluding costly or consumed material spells. Preserve Circle of the Moon’s spell access independently of those filters, including at lower levels. Retain native item IDs, casting activities, concentration effects and spell-slot reversion handling; support linked and unlinked forms without adding another spell panel or duplicate imports.

- Druid Primal Strike: add a default-Yes choice and native elemental damage selector to confirmed weapon/Wild Shape Beast hit damage configuration. Use native scaling and critical policy; enforce once on the Druid’s own combat turn through the active GM. Keep the turn ledger on the original actor across transformations, preserve attack identity and original dice, and refund failed evaluations. Potent Spellcasting adds a labeled Wisdom bonus to any damaging cantrip as requested, with a mixed-damage part selector and no critical doubling. Both use the initial native roll and shared damage card, including skipped-dialog builds; healing and leveled spells are excluded from Potent Spellcasting. Add Druid settings without changing transformation rules or cantrip range.

- Automatically center Life Transfer’s native Death Burst area on the sacrificed companion for GM and player clients. Preserve native Region creation and target confirmation without the placement cursor. Show a visible summary on the existing Life Transfer card with companion HP transferred, actual caster healing and before/after HP, including capped healing.

- Fix player-client Life Transfer when the companion is not player-owned: ask the active GM to find and validate linked companions, then return a caster-owned native Death Burst snapshot with the companion’s prepared damage and save DC. Preserve the companion as the area origin, Improved Reanimation’s resistance bypass, the single confirmation, and GM-authoritative HP/Reaction/completion updates.

- Restrict Flash of Genius to self or friendly token recipients. Enemy and neutral failed checks/saves no longer show the action; the same friendship check is revalidated on the authority side before any use or Reaction is spent.

- Fix Life Transfer’s Death Burst inheriting a single prior target: treat its newly placed area as an initial region-target collection while retaining the rider flag that prevents a second Reaction. Collect all eligible region occupants before save/damage, excluding the exploding companion and outside tokens. Other follow-up casts remain excluded from repeated area confirmation.

- Reanimator Life Transfer now runs from its native feature/card action with one explicit Yes/No irreversible-action confirmation. The active GM validates the caster, linked living companion and Reaction, restores HP equal to the companion’s current HP (capped at the caster’s maximum, excluding temporary HP), sacrifices the companion, and returns native Death Burst area placement to the acting client. Reuse the source activity card without a healing roll or HP Undo control; include idempotent receipts, pre-commit failure compensation, and GM-routed completion metadata. Life Jolt and other Refined procs remain deferred.

- Reanimator summons now prompt for distinct native modifications before resource consumption, using owned Strange/Macabre/Superior grants for choice counts and unlocks. Copy native traits and transfer effects into each unlinked companion’s ActorDelta while preserving summon scaling, ownership and resource handling; set Gaunt’s save DC and Bloated’s token size. Improved Reanimation enables the native 4d4 Death Burst upgrade and bypasses only Necrotic resistance, preserving immunity. Fill the native Dreadful Swipe’s otherwise empty Necrotic type. Refined Revival/Life Transfer, Life Jolt and automatic modification procs remain for later work.

- Default eligible Guided Precision damage rolls to Yes, preserving explicit No, once-per-turn limits, and cancellation behavior.

- Fix Guided Precision’s native damage-dialog hook order: install for the feature holder before later hooks populate attack links, then resolve exact recorded pending/attack/cast targets rather than allowing empty dialog metadata to mask them. Accept native types-only damage options and distinguish Outlined from the caster’s concentration effect. Add Faerie Fire’s missing visible-target attack advantage through AC5E usage rules with a native fallback, preserving disadvantage cancellation and source-effect expiry.

- Cartographer Guided Precision: offer optional native Intelligence bonus in initial single-target damage configuration when the recorded recipient has active Faerie Fire from that caster. Share the native once-per-turn pool across damage rolls, preserve damage type and original dice, prevent critical doubling, validate/spend through the active GM, and refund failed evaluations. Suppress native damage concentration prompts only when Guided Precision protects that caster’s Faerie Fire; leave other spells, explicit manual rolls and concentration-ending prompts unchanged.

- Match Deflect Attack visibility to Shield: applied attack effects no longer hide the action. Keep the shared linked-HP lock so applying damage hides it and HP Undo restores it.

- Fix Deflect Attack treating stale AC5E advantage/disadvantage booleans as a real advantage source. Use its recorded source counts so a normal attack gains Disadvantage and rolls a missing d20, while real advantage still cancels normally. Also capture the options Save button before asynchronous work so its completion does not access a cleared event.currentTarget.

- Steel Defender Deflect Attack: provide an attack-card action for the owning player and GM when a visible attacker within 5 feet attacks another creature. No automatic reaction popup or response wait. Reserve the Defender’s Reaction, preserve original attack dice/cached modes, apply normal advantage/disadvantage cancellation, refresh linked hit/damage results, and guard HP only while a clicked adjustment is running. New misses default to zero damage while preserving Acid Arrow splash and explicit GM multipliers. At Artificer level 15+, prompt the actual Defender’s native Improved Deflection damage against the attacker without spending a second Reaction. Restrict adjustments to single-target attacks before HP application; include authority validation, failed-adjustment refunds and targeted refreshes.

- Linked same-turn companions without their own combatant now follow their owner for native turn-start/end item recovery, effect expiry, and independent reaction/bonus-action resets. Support Steel Defender, Vestige (including Semblance transformations), and explicitly documented same-turn companions through native summon links. Preserve separate resources and pets with their own initiative; GM-only native recovery is deduplicated without adding combatants or chat scans.

- Resolve Arcane Jolt eligibility from the recorded speaker/pending-card actor when damage activities carry incomplete temporary actor copies. Initialize existing AC5E damage-dialog nested options before render to avoid its critical-state assignment error, preserving critical and advantage/disadvantage decisions.

- Fix Thunder Pulse expiry: keep D&D5e native expiry tracking enabled by clearing its tracking-only isTemporary flag. Repair active marked effects on the GM’s loaded actors/tokens at startup, retaining source-start expiry and the recorded Armorer.

- Guardian Thunder Pulse: link the native Thunderous Disadvantage effect on all attack tiers through normal hit-effect Apply/Undo. Record the Armorer as source, expire at their next turn start, and apply disadvantage only against other creatures through the existing AC5E/native cancellation workflow.

- Restore the retained Improved Arsenal +1 attack/damage bonus omitted by the native Perfected Force Demolisher. Correct derived activity data before native label/roll preparation, preserving explicit custom bonuses.

- Fix Armorer Improved/Perfected armor weapon damage omitting Intelligence when native activities replace base damage. Include the native modifier once for Force Demolisher, Thunder Pulse, and Lightning Launcher; preserve base attacks, dice, attack bonuses, and existing explicit modifiers.

- Recognize the current native Acid Arrow identifier as well as Melf’s Acid Arrow. Register Lingering Acid for its target’s turn-end damage prompt, prevent premature native expiry, and retain missed-attack splash handling.

- Fix Alchemical Eruption missing after damage application: store target records with keys that Foundry cannot expand as dotted update paths, and read previously expanded records. Add regression coverage for persisted Ray of Sickness target records.

- Alchemist: add Chemical Mastery’s Alchemical Eruption to resolved Artificer spell damage cards after actual Acid/Fire/Poison damage. Offer one recorded recipient, spend the native activity use once on the caster’s own turn, and roll its noncritical Force damage separately so the spell’s save multiplier cannot halve it. Preserve the original dice, normal Force damage/Undo, typed immunity and zero-damage rules, GM/player validation, failed-roll refunds and targeted shared card refreshes.

- Fixed Alchemical Savant appearing in damage/healing previews but dropping out on Roll submission. Add its finalizer to the submitted-roll pipeline so the flat bonus reaches native evaluation and the chat card. Regression tests now exercise the real configured dialog’s preview, finalization and casting-use commit for healing and Acid/Fire/Poison damage.

- Alchemist: add Alchemical Savant to initial spell healing and Acid/Fire/Poison damage configuration. Use the native Intelligence bonus (minimum +1), choose one eligible mixed-damage part, and share a GM-validated once-per-casting allowance across healing/damage. Defaults Yes for Alchemist’s Supplies, with an opt-out for other foci; preserve original dice, prevent critical doubling and native-enchantment duplication, and restore eligibility if rolling fails. Skipped healing/damage dialogs use the same default bonus.

- Alchemist: the native Long Rest elixir action now opens a rolled batch/distribution table. Roll the native table per bottle, choose any native elixir on 6, and assign each to the Alchemist or a party PC through the GM. Create level-scaled, one-use native consumables with the creator’s healing modifier; preserve rolls on cancellation, prevent duplicate batches, roll back partial distribution failures, and remove only that creator’s unused generated bottles at the next Long Rest. The separate spell-slot-funded additional-elixir activity remains native.

- Fix Spell-Storing Item recipient discovery excluding GM-controlled party characters. The caster can choose on-map party characters and friendly NPCs without owning their inventory; the active GM supplies eligible item choices and applies storage. Retain hidden/hostile exclusions and verify the complete socket round trip in separate GM/player runtimes with no client access to the target inventory.

- Open the Spell-Storing Item preparation wizard from the native Store Spell activity as well as Long Rest completion. Limit recipients to party characters with tokens on the requesting user’s current scene, deduplicate linked tokens, and revalidate scene/token presence before applying storage. Preserve unrelated enchantment activity wrappers.

- Artificer: add Long Rest Spell-Storing Item preparation with a three-step character, weapon/focus, and eligible spell selector. Configure native Cast activities on other party members’ items through the active GM, set Intelligence-based charges and Artificer spellcasting values, preserve holder concentration, and enforce the holder’s next-turn activation limit. Cancel/Back preserves current storage; successful preparation replaces only the same Artificer’s managed storage, with staged rollback, stale-activity guards, and serialized GM validation.

- Undead: add a persistent Grave Touched effect when the revised feature is present. Arcane Necrosis bypasses Necrotic resistance for attacks and Warlock spells/features while preserving immunity, and offers optional once-per-turn Necrotic spell conversion retained across that casting’s damage rolls. Dreaded Necrosis offers one native Necrotic damage die on confirmed Form of Dread hits, with critical handling, optional die/target selection, and target-specific application. Validate separate turn uses on the active GM, roll back failed configuration/evaluation, preserve original dice and normal Undo, and leave Undead Endurance unchanged.

- Fixed repeated Frightful Avatar expiry racing native effect updates. The targeted fallback now disables and expires the effect in place instead of deleting its embedded ID, preserving native queued updates and subsequent refreshes on unlinked tokens.

- Fixed Frightful Avatar fear expiry on native effect refreshes: set the attacker origin, start, and source-end duration on the final application operation. Track only this feature’s applied effects for next-source-turn-end cleanup, with recovery of older effects through their exact source message and preservation of unrelated Frightened effects. Test the installed native effect create/refresh operations as well as turn progression.

- Undead: link the native Form of Superior Dread effect to active Form of Dread / Necrotic Husk forms, disabling it when the base form ends. Add optional Frightful Avatar to confirmed weapon and spell attack damage configuration, with a recorded-hit target choice, once-per-turn validation by the active GM, native Wisdom saves, and failed-save Frightened expiry at the end of the attacker’s next turn. Preserve original damage dice and use the shared save/effect/Undo workflow.

- Fixed Semblance reversion losing original Vestige features due to unlinked ActorDelta item tombstones. Explicitly recreate missing form items with their original IDs after native transformation, including repeated uses and damage Undo, while preserving current Divine Power usage.

- Fixed Semblance Multiattack reading the original Vestige summon level retained by native Transform. Apply the capped spirit spell level to the transformed actor, restore the original summon level on reversion, retain it through damage Undo, and repair existing active forms on reload.

- Fixed Semblance reversion still rejecting saved token tints when a prepared Foundry Color object loses its prototype during appearance cloning. Normalize object and numeric tint values to valid color strings before constructing transformation actors; regression now rejects malformed object tints as well as blank strings.

- Fixed Semblance spirit AC retaining the companion’s native summon AC effect. Prepare and bake the spirit’s effective AC, replace only the companion summon AC bonus, and restore it on reversion or failed transformation. Explicitly set summon spell level to half Warlock level (maximum 9). Normalize blank saved token tints so existing stuck forms can revert; cover Defender AC 22 at Warlock level 20 and damage Undo.

- Fixed Semblance of Life failing with Cannot redefine property: walk. Temporary native Actors are already prepared by their constructor; avoid preparing them a second time during transformation, reversion, and damage Undo.

- Semblance of Life transforms the linked Vestige within 90 feet using the native feature’s scaled spirit profiles. Retains actual HP, Hit Dice and Divine Power; grants spirit HP as temporary HP; restores the original form at 0 temporary HP or after one hour. Uses native Transform with stable token/actor references, current Divine Power/Hit Dice state, damage Undo restoration, cancellation/duplicate/permission guards and failed-transform refunds. No spare summon token or manual sidebar drag required.

- Background animation safety enables Dice So Nice’s own skip-inactive-tab preference per connected user through a new Common setting. Hidden/unfocused clients acknowledge shared animation waits without waiting for throttled setup timers; foreground clients retain dice-before-result ordering. Preserves other dice settings and uses no third-party source patches.

- Fixed Steps of the Fey starting GM-only animation waits on every attack/client. Only the active GM waits when the attacker has an active Disappearing Step effect, preserving effects applied while dice finish. Fixed D&D5e 6 chat render errors from native private item lookup on untyped origin messages; safely resolve stored source data without incompatible receivers.

- Fiendish Resilience adds a Resistance Selection dropdown to Short/Long Rest dialogs for the 2024 feature. On completion, apply the selected damage resistance (excluding Force), default future rests to the current choice, reuse configured native effects when available, and replace only this feature’s prior resistance.

- Dark One’s Own Luck waits for the shared client dice-animation completion barrier before publishing its adjusted total. A background GM no longer allows results to appear before the player’s bonus dice finish; failed waits refund the reserved use.

- Dark One’s Own Luck adds a button to the owning character’s ability-check and saving-throw cards, including grouped rolls. Rolls the native bonus, preserves existing dice and roll modes, spends one native use, and limits use to once per roll. Includes GM/player validation, failed-adjustment refunds, applied damage/effect locks, and targeted resource/grant refreshes.

- Fixed Dark One’s Blessing failing after healing and defeating the same token again. Recover unchanged token/source fields from the matching stored event when Foundry sends only the new event key; preserve duplicate protection.

- Fixed Dark One’s Blessing discarding captured defeats when synthetic token actor updates omit the final HP value. Process the captured transition marker, recheck current 0 HP, and retain duplicate/Undo protection.

- Dark One’s Blessing resolves its fixed native temporary HP without a Roll dialog, preserving healing Apply/Undo. Nearby enemy defeats measure range using the defeated token’s scene grid, including when the authority GM views another scene.

- Dark One’s Blessing detects enemies dropping from positive HP to 0. Grants native temporary HP through the existing healing workflow for the Warlock’s own finishing damage at any range, or any nearby enemy defeat within 10 feet. Tracks the actual damaged token/source card, ignores Undo and repeated 0-HP updates, preserves higher temp HP, and defaults its healing cards to Targets.

- Searing Vengeance automatically applies its native Blinded effect to confirmed enemy damage targets after dice animations when status auto-application is enabled, preserving effect Undo, collapsed applied state and current-turn expiry. Explicitly exempted this no-action feature from off-turn reaction checks and Reaction Used tracking.

- Searing Vengeance requires exactly one targeted ally (or self) at 0 HP within 60 feet before spending its native use. Automatically centers its burst on that creature, restricts the area picker to enemies, heals half the rescued creature’s maximum HP with native Undo, and defaults cards to Targets. Burst and Blinded cleanup follow the activation turn.

- Searing Vengeance keeps manual activation and native damage/targeting, while Blinded now expires at the end of its activation turn (the rescued creature’s turn), rather than the Warlock’s or affected enemy’s turn. Records activation timing, prevents late application from extending the effect, and cleans up at combat end.

- Celestial Resilience now initially checks the first five eligible allies while preserving player changes. Fixed temporary HP application when native healing cards resolve their source as a message document instead of an ID. Guarded Evasion multiplier refreshes until grouped/collapsed damage trays have initialized their target list.

- Celestial Resilience adds up-to-five visible ally checkboxes to Short/Long Rest and Magical Cunning dialogs. On completion, automatically grants the native full temporary HP amount to the Warlock and the native smaller amount to selected allies, excluding the caster from the five. Uses native healing cards/Apply damage handling for higher-temp-HP preservation and Undo, with active-GM validation and duplicate protection.

- Celestial Radiant Soul gains a managed on/off effect that automatically adds its native Charisma bonus to the first Fire/Radiant spell damage roll each turn, labeled Radiant Soul. Area spells select one bonus recipient; other targets retain normal damage. Includes noncritical flat bonus, per-turn reservations and canceled-roll protection.

- Beguiling Defenses adds a Reaction on incoming attack damage cards: spend the feature use, halve that Warlock’s damage and prompt the attacker’s Wisdom save. On failure, return Psychic damage equal to actual damage applied, regardless of save/application order. Includes optional Pact Magic slot restoration, GM/player routing, duplicate protection and normal damage Undo controls.

- Simplified Dreadful Step into one post-teleport target picker with separate Departure and Arrival groups. Select one area, confirm its targets and hover creatures for map highlighting. Removed the casting-location dropdown and replaced the two chat location buttons with a single Choose Targets fallback. Taunting Step continues to target departure only.

- Dreadful Step now provides explicit Resolve at Arrival and Resolve at Departure controls on pending cast cards. Arrival is now the default for new casts. Each control updates the selected area before resolving, including older casts saved as Departure.

- Fixed Dreadful Step’s location being reset to Departure during asynchronous casting-form updates. Capture submitted location before rerendering, display Arrival/Departure on the cast card, and leave empty-area casts available for Confirm Arrival retries.

- Fixed Fey Step destination selection to read the submitted casting control directly. Dreadful/Taunting area targeting no longer excludes creatures based on token visibility, which can lag behind teleport arrival; Refreshing Step retains its visibility requirement.

- Fixed Disappearing Step’s applied-effect section remaining open. Added authoritative caster-turn cleanup for Disappearing and Taunting Step so their effects end at the caster’s next turn start even when native helper-effect expiry does not resolve.

- Archfey Misty Step gains an optional Fey Step casting selector. Recorded departure and settled token movement drive Refreshing/Taunting Step, with Disappearing/Dreadful Step unlocked by Misty Escape. Provides Confirm Arrival/Cancel Extras fallback controls, native healing/save cards, source-turn effect expiry, Taunting attack disadvantage and Disappearing invisibility cleanup. Dreadful Step uses no damage on a successful save, correcting the native activity. Native teleport animation, casting resources and reaction casting remain unchanged.

- Thought Shield creates a fixed Psychic damage card after Psychic damage is applied to its owner, reflecting the post-resistance Psychic amount to the source creature. Preserves normal Apply/Undo, prevents duplicate cards on reapplication and blocks reflection loops.

- Extended automatic combat placement (caster initiative − 0.01) to Animate Objects, Giant Insect, Summon Beast/Celestial/Construct/Dragon/Elemental/Fey/Fiend/Undead, Summon Dinosaur, Summon Plant, Homunculus Servant, Staff of the Python and Domestic Wonder. Covers all summon profiles; keeps familiar, mount and action-controlled spell tokens outside this automation. Added a Common automation toggle.

- Creatures with a straightforward Regeneration feature now use their native healing activity at turn start when injured with at least 1 HP, including summoned Slaad spirits. Respects healing prompt/application options, disabled passive effects and once-per-turn protection. Conditional damage/environmental suppression variants remain manual.

- Mind Flayer summons automatically gain a grid-shaped Whispering Aura: start-of-spirit-turn Wisdom saves and native Psychic damage within 5 feet, excluding the summoner and suppressed while incapacitated.

- Fixed Summon Aberration combat enrollment for global combats without a linked scene; resolve the caster by exact token or an unambiguous same-scene combatant.

- Summon Aberration automatically joins active combat at its caster’s initiative minus 0.01, including normal and Create Thrall casts.

- Summon Aberration offers a Create Thrall Yes/No casting choice. Yes preserves slot consumption while disabling new concentration, using a one-minute temporary casting and granting the native Warlock-level/Charisma temporary HP (repairing the source formula typo). Timed Thrall tokens expire independently of existing Hex concentration. Linked Aberrations gain the native once-per-turn Psychic bonus against their owner’s active Hex target.

- Hex (Powerful) from Eldritch Hex now uses the standard caster/GM ability selector and damage rider. Strength applies automatically; switching replaces both check and save Disadvantage. Repair the missing native Intelligence save penalty, preserve concentration/expiry, and retain missing-effect/recast guards. Ordinary Hex also gains the save penalty when its caster owns Eldritch Hex.

- Clairvoyant Combatant’s native failed-save effect now supplies reciprocal caster-specific attack Advantage/Disadvantage, with AC5e cancellation, a linked caster effect, Warlock-level duration and cleanup when Awakened Mind changes targets. Native activation/save/resource use remains unchanged.

- Psychic Spells remembers each client’s last rolled damage type per owned spell/activity/damage row. Later rolls default to that type without overriding live edits or saving canceled prompts.

- Great Old One Psychic Spells automatically gains a managed passive effect that offers Psychic on native Warlock spell damage-type selectors. Disabling the effect pauses the choice; other classes’ spells, original formulas and component handling remain unchanged.

- Investment of the Chain Master expands linked familiar physical damage rows with Necrotic/Radiant choices. Incoming familiar damage cards offer the Warlock’s tracked Reaction to resist only that damage, retaining native calculation and Undo without a lingering resistance effect.

- Lifedrinker adds optional typed d6 damage to pact-weapon damage configuration once per turn. Its completed damage card offers optional self-healing using an available Hit Die, with the die spent only on Roll submission and a separate once-per-turn healing limit.
- Hex curse cards automatically apply Strength and offer caster/GM ability selectors. Switching updates the existing curse without resetting concentration or duration; missing/expired curses cannot be recreated from an old card.

## v0.8.2 — Class Features & Combat Flow (2026-10-28)

- Frozen Haunt gains a token-linked, grid-shaped 15-foot aura. On manual form adoption and Ranger turn start, prompt 2d4 Cold damage against enemies in the area. No movement/entry trigger; activation, resistance and immunities remain native.

- Chilling Retribution remains available after the triggering damage is applied, without undoing or reapplying that damage. Reaction, feature-use, and duplicate-use checks still apply.

- Chilling Retribution appears on incoming attack damage cards for the Ranger/GM, consumes Reaction and feature use, and prompts the attacker’s Wisdom save. Failure applies Stunned and Speed 0 until the end of the Ranger’s next turn; triggering damage is unchanged.

- Automated Hunter’s Rime, Hungering Might, Survivor and recurring healing rolls now prompt the source character’s active owner with a pending healing roll, falling back to the GM. Enable Skip Automatic Healing Roll Prompts under Common automations to roll immediately; healing application remains a separate setting.

- Fortifying Soul’s native one-hour effect defaults to Advantage against saves with linked Frightened effects and repeat saves to end Frightened, with AC5e integration. Unidentified saves remain manual.

- Hunter’s Rime automatically rolls its caster-only temporary HP when Hunter’s Mark is cast, including free casts. Moving the mark does not grant more temporary HP; Disengage restrictions remain manual.

- Winter Walker Frigid Explorer: Polar Strikes adds optional Cold damage to weapon damage configuration, scaling from 1d4 to 1d6 at Ranger level 11 with a per-creature turn limit. A managed Biting Cold effect bypasses Cold resistance for weapon attacks and Ranger spells/features while preserving immunity.

- Strangling Roots uses the standard dropdown layout, starts with Sap selected, and remembers each user’s last used choice.

- Ancient Might automatically adds the Hollow Warden’s Wisdom modifier to attack damage against Frightened targets while Wrath of the Wild is active. Persistent Wrath remains manual.

- Hollow Warden Rot and Violence: Menacing Aura blocks HP recovery and Reactions until the Ranger’s next turn; Strangling Roots adds a None/Sap/Slow attack choice alongside the weapon’s usual mastery while transformed.

- Automatically roll Hollow Warden Hungering Might healing after a confirmed attack hit while transformed and Bloodied, once per turn. Use the native 1d10 + Wisdom formula with real HP eligibility rather than requiring a Bloodied status icon. Preserve normal healing application, dice animation and Undo; share the turn limit with manual feature use and avoid retroactive triggers from old attack cards.

- Add Hollow Warden Unnerving Aura to native Wrath of the Wild transformations: a token-attached, grid-shaped 10-foot emanation visible on the Region layer. Automatically prompt enemy Wisdom saves on transformation and the Ranger's turn start, apply Frightened on failure until the Ranger's next turn, and remove the aura when the transformation ends. No movement/entry saves or repeated transformation costs; native AC and other Wrath benefits remain unchanged.

- Fix Wrathful Smite and other saved Smite follow-ups recording disposable spell UUIDs for repeat saves. Keep the owned spell identity with a save-only card snapshot, store stable recurring sources, and recover existing broken references from the original caster's recorded Smite card while preserving the saved DC and cast level.

- Automatically add a native Misty Wanderer casting activity to owned Misty Step spells when the character owns the feature. The new activity consumes one Misty Wanderer item use and no spell slot, retaining the spell's normal casting/teleport hooks and Bonus Action. Keep regular casting unchanged; remove only module-managed activities when the feature is removed or the setting disabled. Shared teleport placement remains manual.

- Add a caster/GM Charmed-or-Frightened selector to manually activated Beguiling Twist save cards. Apply only the chosen condition on a failed Wisdom save, respecting automatic saved-effect settings and native effect Undo. Add one-minute effects with end-turn Wisdom repeat saves that end on success; recurring saves do not spend another Reaction or reopen the choice.

- Add Fey Wanderer's Dreadful Strikes to weapon damage configuration (default Yes): 1d4 Psychic, increasing to 1d6 at Ranger level 11, with critical support. Track each struck creature separately once per turn, so different targets remain eligible. Preview, No and canceled prompts do not spend a target's use; Gloom Stalker Dreadful Strike tracking stays separate.

- Fix damage-choice placement when AC5e inserts hidden optional-bonus fieldsets ahead of the native Configuration fieldset. Target the Configuration fieldset itself so dependent Mass Fear controls stay visible and repeated renders do not create hidden duplicate options.

- Render Mass Fear directly beside its mounted Dreadful Strike control, retaining a single selectable row through formula-only dialog refreshes. Changing Mass Fear no longer rebuilds the damage formulas.

- Show Mass Fear only when Dreadful Strike is selected and available. Reuse its existing row across the whole damage dialog and remove duplicate rows from partial renders; no disabled placeholder is shown.

- Immediately unlock/relock the Mass Fear selector when Dreadful Strike changes, including native damage-dialog rebuilds that refresh only formulas. Clear disabled styling on the existing control.

- Add Stalker's Flurry selection below Dreadful Strike: Mass Fear defaults to No. Yes prompts the native Wisdom save for the struck creature and creatures within 10 feet as damage is published, with Frightened expiring at the start of the Ranger's next turn; No offers a same-weapon Sudden Strike button on the completed damage card. Follow-ups share the original Dreadful Strike use, with owner/GM access and duplicate/canceled-attack protection.

- Resolve Dreadful Strike features and uses from the recorded damage-card Ranger on player-owned prompts, including reconstructed activities and imported feature names.

- Refresh Argon HUD's movement counter on each client when Ambusher's Leap is applied, changed or removed. Update only the displayed Ranger's movement counter, preserving movement already spent.

- Add Dreadful Strike as an optional weapon-hit damage configuration rider, spending the native activity use once per turn, respecting critical hits and native 2d6/2d8 scaling. Automatically apply Ambusher's Leap (+10 speed) on the Ranger's first combat turn and remove it when that turn ends; persist first-turn tracking through client reloads.

- Add Bestial Fury bonus Force damage to linked Primal Companion attacks against the owning Ranger's active Hunter's Mark target. Respect Foe Slayer, the native noncritical bonus, independent once-per-turn tracking, and canceled damage prompts; commands and the companion's two attacks remain manual.

- Restrict Superior Hunter's Prey selection to enemies of the Ranger, excluding friendly and neutral tokens. Recheck disposition when confirming before spending its turn use or applying damage.

- Reuse the original evaluated Hunter's Mark damage for Superior Hunter's Prey instead of rolling again. Copy only Mark dice/results, including already-rolled critical or Foe Slayer damage, suppress duplicate dice animation, and apply the second creature's native resistance normally. Require an identifiable Mark damage roll on the source card.

- Refresh the affected token's health bar on connected clients after Superior Hunter's Prey damage and Undo recording complete. Resolve the current token object after its HP/TokenDelta update; perform a visual-only refresh without reapplying damage.

- Add Superior Hunter's Prey after applied damage to the Ranger's current Hunter's Mark target. Select a different visible creature within 30 feet of that target using a map-synced, hover-highlighted picker; confirmation rolls and applies noncritical Hunter's Mark Force damage with native resistance and Undo. Respect Foe Slayer, once-per-turn use, source-turn freshness, and canceled/failed-use rollback.

- Preselect the largest current incoming damage type in Superior Hunter's Defense, while allowing the Ranger to choose another type.

- Show current incoming damage by type and total in the Superior Hunter's Defense resistance popup, using the Hunter's native damage-tray calculation when available, including existing resistances and save multipliers. Clearly label the rolled-damage fallback.

- Add Superior Hunter's Defense on completed incoming damage cards for the Hunter and GM. Spend a Reaction, select an incoming damage type when mixed, apply native resistance immediately and through the current turn, and expire the temporary effect at turn end. Recalculate recipient damage without changing shared dice or halving unrelated types; retain the triggering hit's resistance for Undo/reapply.

- Move Hunter's Prey and Defensive Tactics rest selection into a native Ranger Options section in both Short and Long Rest dialogs. Preselect the current effects, retain edits through Hit Dice rerenders, and apply choices only after successful rest completion. Stop automatically posting rest choice cards; manual feature selectors remain available.

- Add private Short/Long Rest Defensive Tactics selection with one persistent Escape the Horde or Multiattack Defense effect. Multiattack Defense automatically gives the triggering attacker Disadvantage on subsequent attacks against that Ranger for the rest of the current turn; correct changed misses and expire only the temporary hit markers. Escape the Horde follows the table rule that any attack against the Ranger during their own turn counts as an Opportunity Attack and recommends Disadvantage automatically, without a selector. Integrate AC5e/native cancellation.

- Whisper Hunter's Prey Short/Long Rest choice cards only to the Ranger's owners and GMs; other players no longer see the selection card.

- Post the Hunter's Prey selector after completed Short and Long Rests. Preserve the current choice until the Ranger switches it; the same choice card remains available through the feature, with no rest-time action/resource cost.

- Use Hunter's Prey to post an owner-visible Colossus Slayer/Horde Breaker choice card. Maintain one persistent choice effect; offer the existing damage configuration only with active Colossus Slayer. Horde Breaker remains a manual attack. Changing choices costs no action/resource and does not reset the turn-use limiter.

- Add Ranger Relentless Hunter automatic concentration protection for Hunter's Mark without rolls/prompts; keep other concentration checks and ending causes intact. Add Precise Hunter source-specific marked-target attack Advantage with AC5e/native cancellation, and upgrade the integrated Mark rider to d10 with Foe Slayer while retaining critical scaling and Hex's d6.

- Add Mystic Arts Focused Strike: after Stunning Strike succeeds or fails, apply a temporary, caster-specific spell-save Disadvantage effect through the start of the Monk's next turn. Integrate AC5e recommendations with a native fallback, prevent duplicate applications, and preserve existing Stunning Strike resources and save flow.

- Allow the owning Monk to Retarget GM-created Destructive Stride cards. Validate ownership and map targets on the GM, then update the usage card and linked damage recipients together without changing rolls or application history.

- Show recorded target names on the first Destructive Stride card for players and GMs. Update the list when the aura adds creatures or Retarget changes recipients; respect hidden tokens and hidden chat content.

- Tie Epitome resistance cleanup directly to the successful native End Attunement operation, including player-owned activation with a connected GM and temporary source-item state. Keep deletion/expiry cleanup as a fallback; preserve resistance if ending fails or an enchantment profile is being replaced.

- Explicitly clear Epitome resistance when Elemental Attunement ends or is disabled, including during native enchantment-registry cleanup and owner-only sessions. Preserve unrelated resistance and a live replacement Attunement.

- Automatically post the Elemental Epitome resistance choice card after successfully activating Elemental Attunement. Use the native resistance activity without extra Focus or action consumption; prevent duplicate cards and do not prompt when ending Attunement.

- Add Elemental Epitome assistance during Elemental Attunement: an owner-visible, exclusive resistance selector; a grid-shaped, token-attached Destructive Stride aura and +20 Speed on Step of the Wind, ending with the current turn; and a default-No Empowered Strikes option using the native Martial Arts die, matching the strike damage type and limited to once on the Monk's own turn. Stride shares one damage-only roll among enemies encountered, once per creature, without a save or extra Focus. Preserve explicit rider save order and remove linked resistance when Attunement ends.

- Fix Elemental Push/Pull follow-up saves being rejected as unavailable: remove hidden-enchantment-rider flags from the standalone save copy while preserving the owned Attunement feature.

- Add default-None Elemental Push/Pull beneath Grapple in Elemental Strike damage configuration. When Acid/Cold/Fire/Lightning/Thunder damage is rolled, prompt the owned native Strength save with the chosen direction in the card title and movement instructions. Preserve damage and existing Stunning/Grapple save order; no extra Focus charge. Movement remains manual.

- Post a simple chat announcement naming the Monk when Flurry of Healing and Harm activates and spends one use. Duplicate clicks and failed activation do not post announcements.

- Improve Flurry counter spacing and shorten its activation button to “Flurry of Healing and Harm.” If not already enabled, hide and reject activation after the first completed attack (including misses); canceled rolls do not lock it out. Prevent retroactive free-Harm activation.

- Add a Flurry of Healing and Harm activation button above the Flurry counter. Spend one use from the native Wisdom-based daily pool for that Flurry, unlock further Hand of Healing replacements and offer Hand of Harm — Free only on attacks linked to that enabled Flurry. Preserve remaining attack counts, prior healing replacements, Physician’s Touch and the shared paid/free Harm once-per-turn limit. Do not refund earlier paid Harm. Prevent duplicate activation and restore the daily use if activation fails.

- Apply Physician’s Touch Poisoned after Hand of Harm when the Monk owns the feature, including native and automated Harm activities. Use native effect application/Undo and expire Poisoned at the end of the Monk’s next turn. Default Hand of Harm and Psionic Strike to normal damage; add separate opt-in critical settings that follow the original attack result.

- Add Hand of Healing to Mercy’s Flurry counter: replace one remaining attack with native healing for a selected creature in touch range, with no extra Focus or action cost. Limit healing to once per Flurry, preserve the attack on unsuccessful rolls, and retain native healing application/Undo. Higher-level Flurry of Healing and Harm benefits are not automated.

- Add Mercy Hand of Harm to damage cards after an Unarmed Strike or Empowered Strike actually deals HP/temporary-HP damage. Spend 1 Monk Focus Point, once per turn, and roll the native Martial Arts die + Wisdom Necrotic damage separately, preserving the source attack’s critical status. Support player/GM clicks, turn-use reuse, duplicate protection and failed-roll refunds; leave healing and higher-level Mercy upgrades for later passes.

- Add Open Hand Technique choices (None/Addle/Push/Topple) to damage configuration for confirmed Flurry Empowered/Unarmed hits. Apply native Addle automatically with target-next-turn-start expiry; prompt native Strength/Dexterity saves for Push/Topple without extra Focus consumption. Topple uses native Prone effect automation; Push movement remains manual.

- Treat Flurry of Blows as Bonus Action attacks for Grappler: allow ordinary Grapple/Prone in place of damage, but never retain damage through Grappler or consume its once-per-turn damage-plus-grapple benefit.

- Add a Flurry of Blows attack counter after using Monk’s Focus or Heightened Focus. Open it on the clicking user’s client with two attacks, or three when Heightened Focus is owned. Prefer Empowered Strike and fall back to Unarmed Strike; use live targets between attacks, retain canceled attacks and avoid repeated Focus/Bonus Action consumption. Tag the resulting attack/damage cards as Flurry for follow-up feature support.

- Disable Advantage/Normal/Disadvantage adjustments after Disciplined Survivor replaces a save, enforcing the mandatory new roll in both the card controls and GM-authorized adjustment requests.

- Add Disciplined Survivor to failed Monk saving throws: spend 1 Focus Point to reroll one d20 and keep the new result, preserving the existing modifiers and DC with no added bonus or Reaction cost. Support player/GM use, dice-animation sequencing, duplicate-click protection and resource rollback; require Undo before adjusting saves with applied damage/effects.

- Coordinate automatic Dead/Unconscious updates per actor across D&D5e HP handling and combat-tracker status toggles. Prevent duplicate fixed-ID status creation on NPC death while preserving overlays, native healing cleanup, important-NPC rules and Relentless Rage.

- Measure Deflect Redirect range between nearest occupied token spaces instead of token centers, so adjacent Large and larger creatures qualify correctly for the 5-foot melee redirect. Use those same points for the wall check; retain native scene distance rules and the target/type selection popup.

- Add Monk Deflect Attacks/Energy to completed, unapplied attack damage cards. Use the native reduction formula and a Reaction to reduce only the Monk’s incoming damage directly, with updated totals and tooltip breakdowns, without calling the healing activity. Base Deflect requires an attack containing Bludgeoning/Piercing/Slashing; Energy supports any attack damage type. At zero, offer optional Redirect for 1 Focus Point with visible-target/range checks, the native Dexterity save and Martial Arts damage, original incoming damage-type selection and clicker-owned damage prompts. Preserve dice-animation timing, normal resistances and HP Undo/reapply.

- Clear pending feature/cast status when an existing damage or healing prompt receives its completed roll. Fixes Life-Giving Force leaving the usage card marked Pending after its healing roll, without triggering extra healing or changing manual application.

- Automatically grant World Tree Vitality Surge temporary HP equal to Barbarian level when Rage activates, preserving higher existing temporary HP. No additional card, roll or Apply click. Prevent refills from Rage extensions, linked-effect updates or client reloads; Life-Giving Force remains manual.

- Clicking Ram after a qualifying melee hit now automatically applies its native Prone effect through the GM with effect Undo support, instead of requiring a second Apply click. Ram remains an optional attack-card button.

- Combine Wild Heart Rage of the Wilds and Power of the Wilds into a two-column selector before native Rage activation or consumption. Require one choice per owned feature; cancellation spends nothing. Add Rage-linked Falcon flight (armor eligibility stays manual), a separate attached grid-based Lion aura with contextual enemy attack Disadvantage and active-Lion target exemptions, and a Ram Prone application-card option after a qualifying melee hit on a Large or smaller creature. Keep Wolf and Lion regions independent, remove benefits/regions when Rage ends, and avoid movement-driven chat refreshes.

- Add a player/GM choice card for Wild Heart Aspect of the Wilds: select Owl, Panther or Salmon to apply its native benefit and replace the previous aspect. Keep choice effects manual, hide Retarget, and allow switching freely without a daily restriction.

- Reuse expired or disabled actor Reckless Attack effects on activation instead of creating a new copy each turn. Refresh the application clock and native next-turn-start expiry, restore the feature’s prepared changes and remove duplicate actor copies without touching the item template or unrelated effects.

- Add Wild Heart Rage of the Wilds selection on Rage activation, routed to the owning player with GM fallback. Eagle movement remains manual; Bear uses native resistance changes; Wolf creates a grid-based, token-attached, Region-layer-only 5-foot aura and grants allies contextual attack Advantage against enemies inside it. Tie choice benefits/aura to Rage, avoid duplicate prompts/copies and evaluate Advantage at attack time without movement-driven chat refreshes.

- Exclude the Berserker from Intimidating Presence’s automatic area targets, editable target confirmation and final saved target list.

- Link Berserker Mindless Rage immunity to active Rage, end existing Charmed/Frightened conditions on entry and remove the temporary immunity when Rage ends. Add Intimidating Presence’s end-of-turn Wisdom repeat save using the original DC, remove its Frightened effect on success after dice animations, correct the native effect to one minute, and clear the targeting region at caster turn end. Repeat saves do not consume feature/Rage uses or reapply effects.

- Add Rage KO cleanup and Relentless Rage: offer the native Constitution save at 0 HP while raging, preserve Rage until the player rolls, use the feature’s native DC/tracker and rest recovery, and automatically apply its healing on success. Failure/decline ends Rage and permits normal downed conditions; Persistent Rage survives Incapacitated but not Unconscious.

- Link the owned native Primal Knowledge effect to Barbarian Rage: apply once when Rage activates, adopt an existing source-matched copy without stacking, and remove the linked copy when Rage is disabled, expires or is deleted. Reconcile active Rages on load and preserve the book’s skill formulas.

- Automatically apply 2024 Barbarian Indomitable Might: Strength checks (including skills/tools actually rolled with Strength) and Strength saves use the Strength score when the completed total is lower. Preserve the rolled dice/modifiers and DC, resolve the corrected save outcome immediately, and mark replaced totals beside the character name. No button or resource consumption.

- Add Banneret Shared Resilience on failed ally saving throws within 60 feet: spend the Banneret’s Reaction and native Indomitable use, replace one d20 and add the Banneret’s Fighter level, keeping the replacement. Preserve save bonuses/DC, respect ownership/visibility/Undo locks, wait for dice animations and restore resources on failure. Share the Indomitable action queue to prevent competing resource use.

- Always route manual Group Recovery and Team Tactics through the capped Banneret ally selector, including when native Choose Targets is disabled. Remove both targeting Regions at the end of the Banneret’s turn using the existing targeting-area cleanup setting; Team Tactics buffs keep their independent next-turn-start expiry.

- Add manual Banneret Group Recovery/Team Tactics ally selection with map/list synchronization, caster exclusion and a Charisma modifier cap (minimum one), respecting 30/60-foot range. Team Tactics grants complete D20 Test Advantage, applies after healing rolls using existing buff settings, and expires at the start of the originating Banneret’s next turn.

- Show minus signs on subtractive dice in expanded native damage breakdowns, including Enfeebling Shot’s reduction. Keep all rolled values, totals and damage application unchanged; support grouped chat cards and aggregated damage types.

- Explicitly expire Banishing, Shadow and Enfeebling Shot at the end of the affected creature’s next turn when native special-duration cleanup leaves them behind. Track the application turn, preserve effects through the application turn, and inspect only the outgoing combatant.

- Add Arcana Unleashed shot follow-through while leaving shot activation manual: Grasping Shot gets optional turn-start Athletics escape prompts using the recorded archer DC and clears that archer’s old brambles on reuse, including a successful new save. Refresh applied Banishing/Shadow/Enfeebling target-turn expiry clocks and keep Enfeebling’s native damage reduction aligned with the originating Fighter’s die.

- Add Champion Survivor’s Heroic Rally: create the native healing card at turn start while Bloodied with at least 1 HP, using 5 + Constitution modifier and existing healing application settings. Prevent duplicate turn triggers; disabling the native Survivor effect pauses the feature. Heroic Warrior and death-save changes remain manual.

- Prevent AC5e with Simple Cover in standalone or Library Mode from adding cover twice when native effects already include it in sheet AC (including Bulwark of Force). Preserve cover effects, Dexterity saves, stronger/total cover, ignore-cover features and other attack AC modifiers.

- Limit Protective Field prompts to self or allied tokens sharing the Fighter’s non-neutral disposition. Exclude enemies/neutral recipients and recheck allegiance before committing the reduction.

- Stop Studied Attacks feedback loops by processing only new attack cards, changed rolls and explicit target changes. Ignore effect/flag/render updates and use recorded targets for orphan cleanup rather than transient evaluated-target lists.

- Add Fighter Studied Attacks: misses grant target-specific Advantage on the next attack against that creature. Consume on a committed attack, retain on cancellation/unrelated targets, refresh after another miss, and expire at the end of the Fighter’s next turn. Integrate AC5e cancellation without changing Vex or consuming resources.

- Add 2024 Fighter Indomitable on failed-save cards. Spend one native feature use, reroll one d20 with the Fighter-level bonus and keep the replacement result. Preserve other bonuses, save DC/targets and native outcome updates; wait for player dice animations and require Undo before changing applied damage/effects. Support grouped saves, GM/player ownership, per-roll duplicate guards and resource rollback.

- Fix Retarget rendering errors from native ChatMessage private-method lookups: skip unsupported message types before item resolution, resolve string origin IDs to real source messages, and safely handle deleted origins without changing native live-item or snapshot precedence.

- Wait for connected clients’ tracked Dice So Nice animations before publishing Protective Field’s reduction and adjusted total or releasing HP application. The GM’s local animation completion alone no longer reveals the result early to players.

- Restore AC5e’s configured button colors for native critical-damage recommendations when AC5e leaves the button unpainted. Keep the fallback presentation-only, respect disabled coloring/no-critical rules and preserve AC5e-owned highlights.

- Add Psi Warrior Protective Field on unapplied damage cards. Spend one Fighter Energy Die and Reaction to reduce damage to self or a visible creature within 30 feet. Preserve shared dice and other targets, apply native resistances afterward, pause HP application while the reduction rolls, and keep the reduction for HP Undo/reapply.

- Start the selected Telekinetic Thrust save alongside the Psionic Strike Force damage roll, without waiting for HP application or the Force animation. Preserve native save-outcome/effect animation ordering and duplicate-save protection.

- Combine Telekinetic Thrust with Psionic Strike’s activation: Telekinetic Adept owners choose Damage Only, Prone or Push from a vertical popup. Carry the choice through the GM workflow and automatically prompt the selected save after Force damage is applied; remove the separate Thrust button.

- Add Telekinetic Thrust after applied Psionic Strike damage. Choose Prone or manual push, prompt the native Strength save, and apply Prone only on failure. Preserve source targets, one follow-up per Psionic Strike, GM/player ownership and zero additional resource cost.

- Move Psionic Strike out of damage configuration and onto applied weapon-damage cards. Let the player decide after seeing weapon damage, then spend one Energy Die and roll a separate noncritical Force damage card. Require actual HP/temporary-HP damage, preserve own-turn/range/resource limits, and keep the original weapon roll and Undo unchanged.

- Add Psi Warrior Psionic Strike to applied weapon-damage cards within 30 feet. Roll separate native-scaled Force damage without critical doubling, consume one Fighter Psionic Energy Die through the active GM, and enforce once on the Fighter’s own turn. Preserve Soulknife pool separation, duplicate-use protection and native damage application.

- Make generated Terrify save cards carry an explicit enabled Frightened effect and failed-save profile, repairing missing or stale owned-item effect links on the temporary copy. Preserve caster identity, repeat-save registration and the original book item.

- Add Scion of the Three’s Terrify to Cunning Strike damage configuration when Strike Fear is owned. Deduct one Sneak Attack die before critical scaling, prompt the native Wisdom save after damage, apply Frightened with end-turn repeat saves, and grant attack Advantage only to the originating Rogue while the effect is active. Preserve Improved Cunning Strike combinations and normal Advantage/Disadvantage cancellation. Recognize native Sneak Attack die modifiers when calculating and deducting Cunning Strike costs, preserving Dread Incarnate’s minimum-3 dice.

- Add Thief’s Reflexes: create a second combat-tracker entry linked to the same token at Initiative minus 10 for round one, then remove it after native turn-end processing. Mirror the original entry’s Initiative, name, visibility and defeated state, prevent duplicate entries, and recognize the extra turn in reaction tracking and Assassinate targeting.

- Fix Rend Mind Stunned effects missing end-turn saves: register its class-feature effect through the existing feature-save path and strip resource consumption from repeat-save helpers.

- Add Soulknife Rend Mind on Psychic Blade Sneak Attack damage cards. Prefer its free use, then spend three Soulknife Psionic Energy Dice; prompt the native Wisdom save and apply Stunned on failure with end-turn repeat saves. Restore the free use on Long Rest and prevent duplicate activation for the same hit.

- Add Soulknife Homing Strikes to missed Psychic Blade attack cards. Add the native Psionic Energy Die to the original attack, spend it only when the miss becomes a hit, and resume the existing damage workflow. Support player/GM use, one attempt per attack, multiclass resource isolation, animation ordering and Apply/Undo locks.

- Add Death Strike to first-round Sneak Attack hits. Prompt the native Constitution save without its duplicate Sneak Attack damage, block automatic/manual HP application until the outcome and animations resolve, and seed double damage on failure. Preserve original dice, criticals, Assassinate damage, reactive halving and Apply/Undo.

- Fix player Envenom prompts waiting for GM-only animation acknowledgements. Await player-local save dice while GM application retains cross-client synchronization, and explicitly link automatic/manual Envenom damage to its Poison save and recorded targets. Preserve helper snapshots, resistance bypass and pending-card completion.

- Add Assassin Envenom Weapons to initial and end-turn Cunning Strike Poison saves. Failed saves prompt the native extra Poison damage on the same save workflow; successful saves do not prompt damage and repeat-save success still clears Poison. Ignore only Poison resistance, preserve immunity and native Apply/Undo, and correct the known book activity’s 2d8 default to the stated 2d6 on generated copies. Preserve customized damage formulas and the existing Poison die cost.

- Add 2024 Assassinate: target-specific first-round Advantage against combatants that have not taken a turn, with AC5e cancellation; add native Rogue-level Surprising Strikes damage to confirmed Sneak Attack hits in round one. Preserve weapon damage type, native Initiative Advantage and fixed bonus critical policy, without extra resource use or movement/chat scans.

- Label Evasion holders beside their names in qualifying pending and rolled save summaries, including grouped cards. Indicate when Incapacitated makes Evasion inactive without exposing save outcomes.

- Show Uncanny Dodge controls and its applied summary only on damage cards, including grouped damage cards; omit them from attack cards.

- Add Evasion for any actor owning the feature: qualifying Dexterity saves that normally deal half on success force per-target native multipliers of zero on success and half on failure. Preserve damage dice, native resistance/immunity handling, pending saves and Apply/Undo; exclude Incapacitated actors, other saves and non-half-on-success effects. Available under Common automation options.

- Add Uncanny Dodge on confirmed incoming attack/damage cards. Consume the native feature’s tracked Reaction without item charges, set only the Rogue’s native damage multiplier to half, and preserve original dice, resistance handling, explicit multiplier overrides and Apply/Undo. Support GM/player ownership, grouped cards, duplicate-use guards and targeted shared refreshes; seeing the attacker is confirmed by the click.

- Explicitly remove Devious Strikes Daze/Obscure at the end of the target’s next turn. Stamp each new/reapplied effect, repair expiry on native effect reuse, and recognize recorded save-card sources when older effects lack tracking flags. Preserve application-turn effects, Knock Out and unrelated conditions. Damage wake-up also recognizes older card-linked Knock Out effects without tracking flags.

- Add owned Devious Strikes options to Cunning Strike configuration: Daze (2 Sneak Attack dice), Obscure (3) and Knock Out (6), with combined Improved Cunning Strike costs before critical scaling. Use native saves/effects after damage; Daze/Obscure end at target-next-turn end, and Knock Out repeats its Constitution save at turn end and ends on positive damage. Daze action choices remain table-managed.

- Use the Prone icon on generated Cunning Strike Trip cards and their linked effect, distinguishing Trip from Poison without modifying the owned book feature.

- Preserve the owned Cunning Strike source on temporary save helpers and recover Poison tracking from recorded save cards when older helper UUIDs cannot resolve. Repeat Constitution saves at target turn end use the original Rogue DC and remove Poison on success.

- Refresh Cunning Strike selectors immediately when Sneak Attack is toggled manually. Default Sneak Attack on eligible finesse/ranged attacks when a conscious allied creature is within 5 feet of the recorded target and the attack has no effective Disadvantage. Use recorded source/target tokens, scene units/grid distance and large-token edges; keep manual choices and avoid movement hooks.

- Add base Cunning Strike choices to Sneak Attack damage configuration for all Rogue subclasses: native dice costs before critical scaling, Poison/Trip saves after applied damage, Poison end-turn repeat saves and manual Withdraw movement. Support two distinct choices with Improved Cunning Strike, kit/size eligibility and duplicate guards. Devious Strikes and subclass extensions remain manual.

## v0.8.1 — Artificer & Paladin Automation (2026-10-24)

### Release highlights

- Unified Paladin auras combine supported class and oath benefits in one attached, level-scaled Region, with local controls and source-specific cleanup.
- New Paladin assistance covers Genie Elemental Smite/Rebuke and shielding choices, Ancients Nature’s Wrath repeat saves, Devotion Sacred Weapon/Smite of Protection/Holy Nimbus, and Vengeance Vow of Enmity/Avenging Angel.
- Artificer Flash of Genius, destructive Arcane Jolt (including linked Steel Defenders), and Arcane Firearm join the native chat and roll workflow.
- Add several class-filtered spells at once; choose Smite spells and cast levels in separate configuration rows.
- Reduce redundant helper-card preparation and movement-driven reaction-card redraws; repair critical recommendations, target displays and Smite resource notifications.

Restart Foundry and refresh all clients after updating. Disable old Aura Effects Paladin emitters before using the unified aura replacement. Aura emanations default to Grid Shaped; match scene grid spacing and distance to the map. Current testing uses alternating 1–2–1 diagonals. Local library overrides remain in control; apply fresh effects or recast features when testing changed tracking.

### Detailed changes

- Add Avenging Angel’s Frightful Aura to the unified Paladin aura. Preserve native ten-minute flight/hover, feature use, Bonus Action and Restore Use. Prompt enemy turn-start Wisdom saves; failed saves grant source-tagged Frightened for one minute or until damage and incoming attack Advantage through AC5e. Preserve unrelated fear, normal Disadvantage cancellation and GM/player damage cleanup.

- Post a brief public notice before refreshed attacks when Sacred Weapon or Vow of Enmity is activated, naming the weapon/target and spent Channel Divinity use. Free Vow transfers announce the new target and preserved duration. Notices are posted once by the client handling the successful activation.

- Add Vow of Enmity activation to weapon/unarmed attack configuration. Track one marked creature for one minute, integrate target-specific Advantage with AC5e, and preserve normal Disadvantage cancellation. Offer free transfer after the current mark reaches 0 HP without resetting duration, or spend another Channel Divinity use for a new Vow. Validate range, visibility, ownership, resources and stale attack prompts without movement-driven lookups.

- Add Holy Nimbus as a temporary self activation using the existing Paladin aura. Preserve native feature/slot-restoration and Bonus Action handling; automate enemy turn-start Radiant damage, Holy Ward save Advantage against Fiend/Undead sources, and aura-radius bright sunlight illumination. Share reversible light ownership with Sacred Weapon so overlapping effects clean up correctly.

- Add Sacred Weapon activation to equipped melee weapon attack configuration. Spend one Channel Divinity use, apply the native Devotion enchantment, and reopen native attack configuration with the bonus. A temporary actor effect controls the enchantment and 20/40-foot token light; disable/delete/expiry or unequipping removes the benefits, while restoring prior lighting without overwriting unrelated changes.

- Explicitly expire Smite of Protection at the casting Paladin’s next turn start and resynchronize aura recipients immediately. Keep the benefit through other creatures’ turns and clear it when combat ends, rather than relying solely on native effect expiry.

- Add Devotion’s Smite of Protection to the unified Paladin aura after Divine Smite, including the weapon-damage selector. Grant only the native coverHalf status to the Paladin and allies in range until the caster’s next turn starts; preserve other aura benefits and stronger cover. Simple Cover/AC5e own the cover calculations and bypass rules. No extra aura or flat AC/save bonus is added.

- Add Nature’s Wrath end-of-turn Strength save automation to its native Restrained effect. Repeat saves use the recorded Paladin DC, consume no action or Channel Divinity, and remove the originating effect on success. Preserve the native initial save, duration and condition; add no extra action/turn restrictions.

- Prevent Monk’s Combat Details from mistaking Smite slot spending/refunds for prepared-spell changes. Scope its existing casting marker to Divine/Eldritch Smite slot resource updates, restore prior marker state on success or failure, and retain genuine preparation-change enforcement.

- Route Elemental Rebuke’s damage dialog to the connected owner/GM who clicked the reaction, even when the save card is created by the active GM. Wait for the attacker’s save outcome, open only on the designated client, and fall back to the active GM if that user disconnects.

- Fix Elemental Rebuke reduction lookup after Foundry expands dotted token UUID flag keys. Store records under plain token IDs, support both legacy UUID formats, and refresh linked incoming damage cards on all clients when protection is recorded.

- Show Elemental Rebuke’s reduction as the native target’s ½ damage selector, with explicit multiplier overrides and no double-halving when ½ is clicked. Replace the five element buttons with a compact damage-type dropdown and Use/Cancel popup.

- Add Genie Elemental Rebuke assistance on confirmed incoming hit/damage cards. Choose an element, spend a native feature use and tracked combat Reaction, halve only the Paladin’s incoming damage through native application, and prompt the attacker’s native Dexterity save and elemental damage. Validate ownership and prevent duplicate use; preserve damage Undo/reapply and avoid movement refreshes.

- Exclude the casting Paladin, including other tokens linked to that actor, from Fury and Surge additional-target choices and final selection validation.

- Mark Dao’s Crush with the shared applied-effect completion state so its Effects section collapses after automatic application. Preserve Undo reopening the tray and manual reapplication collapsing it again, without automatically reapplying an undone effect.

- Split weapon damage’s Smite configuration into one spell selector and a separate Smite Level row. Leave the level blank and disabled with no spell selected; default to a free use or the lowest available qualifying slot, with higher slots available for upcasting. Preserve resource spending, critical damage and follow-up saves/effects.

- Sync Efreeti’s Fury’s enemy-only secondary-target picker with map targets. Hover highlights the token; selecting in the picker or targeting an eligible enemy on the map updates the other view. Remove dialog hooks/highlights on close. If no other visible enemy is within 30 feet, skip the picker and roll damage against the original target.

- Open Efreeti’s Fury damage configuration automatically after its Channel Divinity choice, retain both targets and temporary activity data in the pending-card workflow, and offer Normal/Critical with the original hit’s critical state recommended.

- Fix Dao’s Crush failing Foundry document validation because its temporary application activity ID exceeded 16 characters. Validate helper Item/Activity ID lengths in regression coverage; preserve the original escape-check activity.

- Preserve verified source-token speaker context in attack and damage roll configuration. Avoid AC5e’s tokenless-Actor fallback treating an Activity as an Actor; keep legitimate tokenless rolls unchanged and never substitute another creature’s selected token.

- Preserve confirmed critical hits when automatically opening weapon/spell attack damage configuration. Seed the exact attack’s critical state and AC5e damage baseline so the dialog recommends Critical Hit instead of Normal; retain manual Normal selection and no-critical condition handling.

- Add Oath of the Noble Genies Elemental Smite choices to Divine Smite damage cards. Spend one Channel Divinity use per cast; apply Dao’s Crush immediately with optional Athletics/Acrobatics escape prompts, use native Djinni defenses through the end of the Paladin’s next turn, select Efreeti’s second target, and select Marid’s additional targets for native Strength saves. Teleports and forced movement remain manual.

- Stop token movement, visibility and region membership changes from scanning or redrawing historical reaction cards. Evaluate reaction options when cards render for an action and validate eligibility again when clicked. Preserve resource, effect, turn, result and Undo refreshes, synthetic actor updates and existing save/damage order.

- Show Paladin aura outlines only while the Regions layer is active. Update existing attached auras on synchronization and remove the old always-visible toggle; mechanical coverage remains active during normal play.

- Aura setup guidance: Recommend Grid Shaped emanations for auras. Set the scene grid size/spacing and distance per square to match the map so aura ranges and affected squares are measured correctly. Current testing uses alternating 1–2–1 diagonal movement; other diagonal-distance rules have not yet been verified.

- Default all generated Paladin, monster, Flaming Sphere, Guardian of Faith and self-attached spell emanations to Grid Shaped so their footprint follows the scene grid’s distance rules. Migrate existing module-owned emanations once while preserving position, radius and attachment. Leave circles, cones and unrelated regions unchanged.

- Restore the Genie shielding chooser for an owning player when D&D5e omits its native effects tray under player-effect/target visibility rules. Add only this owned feature’s choices without changing world permissions. Remove Retarget from Elemental Shielding cards and reject retarget operations for the choice-only feature.

- Let an owning player change Elemental Shielding directly, including from a GM-authored card, without depending on a GM socket request. Exempt the choice-only feature from target-use guards; preserve current user targets while the GM updates aura recipients.

- Make Genie Aura of Elemental Shielding a manual self-selection card. Clicking one native resistance replaces earlier choices, disables old transferred options and updates the unified aura from the actual applied selection. Exclude the feature from automatic buff application, prevent Shift/multi-effect application, preserve unrelated resistances, and remove the automatic Cold default.

- Fix unified Paladin aura movement repeatedly rewriting its attached region. Compare the prepared attachment TokenDocument by ID, preserving native region animation and avoiding redundant updates when crossing allies.

- Show the granting Paladin as the source of unified aura buffs and lingering Alacrity. Repair existing owned buffs during synchronization, and update the source when the chosen Protection provider changes.

- Add unified passive Paladin auras: one attached, Regions-layer-only emanation follows native/level-based range and combines Protection, Courage, Devotion, Warding, Glory Alacrity and Genie Elemental Shielding. Use the source Paladin’s Charisma (minimum +1), avoid overlapping Protection stacking, pause while Incapacitated, and preserve native self effects and existing conditions. Add actor-window controls for source enable and preferred Protection source, with Genie resistance chosen from its native card. Batch committed movement checks, avoid writes when benefits remain unchanged, and decline duplicate Aura Effects emitters. Temporary oath powers and Channel Divinity remain separate.

- Add optional Arcane Firearm to Artificer spell damage configuration. Confirm casting through the firearm, add a typed 1d8 bonus to one damage roll, and persist one use per cast across linked attacks/damage cards. Choose a damage type for mixed-damage spells; spend no charges and do not double the separately rolled bonus on critical hits. Exclude cannon/weapon attacks and other classes’ spells.

- Add opt-in destructive Arcane Jolt to confirmed-hit damage configuration. Use native Force damage scaling and critical policy; spend one Artificer feature use and share one use per turn across the Artificer and their natively linked Steel Defender. Require a magic weapon for the Artificer, preserve existing save/effect ordering, and leave restorative energy manual.

- Default recorded-target displays to Targeted for monster area features such as Hell Hound Fire Breath, including their save and damage cards. Preserve later manual mode changes and recorded recipients.

- Add Artificer Flash of Genius buttons to failed ability checks and saving throws. Add Intelligence (minimum +1) to the original roll, spend a native feature use even when the result still fails, and reserve the Reaction during tracked combat. Support self-use and visible recipients within 30 feet, player-to-GM routing, unknown-DC failure confirmation, and existing Apply/Undo locks.

- Repair Revenant Vengeful Glare copies missing their Frightened effect/profile. Initial save usage supplies a one-minute failed-save Frightened fallback on a temporary copy and persists the corrected card snapshot, enabling the existing repeat save. Preserve existing native effects and resources; do not invent unconditional curse paralysis or reapply effects on repeat-save helpers.

- Reduce repeated temporary-item reconstruction across module-owned save/effect helper cards, including linked roll results. Share prepared helpers per source card and scaling, invalidate on card and relevant actor/item/effect updates, and preserve native live-item and explicit corrected-snapshot precedence. Skip unrelated activities before escape/Swallow recipe lookups. Keep resource spending, damage confirmation, save ordering, animation waits and effect application flows unchanged.

- Add native multi-select to the class-filtered Add Spell compendium browser on standard and Tidy character sheets. Select several spells and confirm once to add them without drag/drop. Preserve editable class filters, source effects and native casting-method handling; skip already-owned spells and duplicate book copies. New leveled spells start unprepared. Cancel/close adds nothing, and concurrent confirmation cannot create duplicates. Full-list class spell loading and inventory browsing retain their existing behavior.

## v0.8.0 — Spell & Monster Effect Automation

### Release highlights

- Built-in creature-effect and Region libraries with editable local overrides, expanded Player’s Handbook spell support and Monster Manual effects.
- Monster repeat saves, optional grapple/escape actions, hidden auras, recurring damage, infernal wounds and swallowing with source-specific cleanup.
- Cleave chat-card attacks and prepared Smite selection integrated into weapon damage.
- Inactive-effect cleanup, safer save/damage corrections, animation timing and turn-processing improvements.

Restart the Foundry server and reload GM/player clients after updating. Apply fresh effects or recast areas to use changed tracking and Region behaviors. Existing local library overrides remain in control. Special choices, staged effects and the documented table-managed rules remain manual.

### Detailed changes

- Complete the straightforward Monster Manual escape pass with 16 shared recipes across 22 missing feature variants: Constrict families, Tentacle Lash, Quick Grapple, Chain, Frog/Toad, Graveyard Revenant Suffocate, Kraken, Pincer Staff, Worm/Remorhaz/Tarrasque Bites, Water Weird and Kuo-toa net. Preserve native checks, add source-passive DC tracking for Toad/Brazen grapple gaps, and offer Vine Blight escape after damage. Keep Sticky Shield, Cataclysm choices and Brazen alternate non-grapple outcomes manual.

- Add end-turn repeat saves for Harpy Luring Song, Chasme Drone, both Faerie Dragon Euphoria Breaths, Revenant Vengeful Glare and Sphinx of Valor’s Second Roar. Preserve native conditions/DCs and suppress repeat templates/damage/effect application. Share one Revenant save across its linked effects and clear only that cast after dice; make applied Harpy charm follow native concentration rather than the imported one-round expiry. Situational breaks, immunity tracking and curse eligibility remain manual.

- Add recurring damage for Swarm of Stirges (victim turn end), Animated Rug of Smothering, Gulthias Blight roots and Djinni Whirlwind (victim turn start). Provide optional escape actions using native Swarm check DC or originating Rug/Blight passive Athletics DC. Add Whirlwind entry Region saves, independent end-turn repeat saves and linked restraint cleanup on exit. Preserve native damage/effects, supply missing Rug Bludgeoning damage type on helpers, and leave damage sharing and life-drain HP transfers manual.

- Exclude creatures actively swallowed by a monster from that same token’s external damage/save auras. Preserve internal Swallow damage and other monsters’ aura eligibility; removing or disabling Swallow restores normal aura targeting. Support existing tracked Swallow effects.

- Fix native Swallow applications missing recurring-damage tracking by carrying source-token metadata on usage copies and registering the applied effect directly, including reused effects. After dice finish, replace only the originating monster’s grapple with the native swallowed conditions; preserve other grapplers.

- Add swallowed recurring damage for Behir, Purple Worm, Remorhaz and Tarrasque at monster turn start, and Kraken at the swallowed creature’s turn start. Preserve native saves, initial damage, effects and multi-type damage. Match book actor identity to distinguish shared Swallow activity IDs; retain local toggles, source-token tracking and manual regurgitation/positioning.

- Fix Giant Toad and other monster Bites incorrectly starting Pit Fiend poison saves when they share the native Bite attack ID. Require the Pit Fiend’s save and recurring-damage activity signatures; also require Grell’s native poison save for its hit handoff. Verify all 109 book Bite/Paralyzing Tentacles variants.

- Add Giant Toad swallowed damage at the toad’s turn end and Gelatinous Cube engulfed damage at the cube’s turn start. Preserve native effects/damage, provide the cube’s optional target-turn Athletics escape, and correct initial Engulf successful-save damage to half on temporary usage copies. Keep capacity/movement and other Swallow/Engulf variants unchanged.

- Add Bearded Devil and Horned Devil infernal wounds: failed native saves apply a non-stacking one-minute wound, target-turn rolls cause direct HP loss with Apply/Undo, and optional DC 12/DC 17 Medicine treatment closes it after dice. Actual spell healing, including Regenerate and player-applied healing, also closes wounds. Preserve initial Tail damage and native resources; follow-on HP loss bypasses temporary HP/resistance and damage-trigger checks.

- Add source-turn recurring damage for Stirge attachment, Invisible Stalker Vortex, Water Elemental Whelm and Barbed Devil Barbed Hide. Retain optional target-turn escapes for Vortex/Whelm. Track Stirge attachment after confirmed hits, support both directions of Barbed Hide grapple contact, preserve native damage and isolate source tokens. Disable/remove tracked effects to stop damage; movement/capacity and special interactions remain manual.

- Add inactive-effect cleanup after combat and a Clear inactive effects actor-window menu action for default/Tidy sheets. Preserve disabled class/item features, passive imported stat features and active effects. Manual cleanup previews and revalidates removals; automatic cleanup waits for native combat-exit handling to finish. Add a world toggle for automatic cleanup.

- Fix save-aura timing races: serialize target-turn cleanup and give new aura conditions one expiry owner, leaving older native-turn effects to native expiry. Evaluate the latest save outcome after dice complete and start immunity at the current world time so successful Stench saves reliably suppress later rolls.

- Add hidden automatic Stench auras for Ghast, Ghast Gravecaller, Hezrou and Troglodyte, plus Swarm of Dretches Fetid Aura. Prompt native Constitution saves at target turn start and preserve/fallback Poisoned until the next target turn. Successful Stench saves grant one-hour monster-kind immunity; Fetid Aura grants none. Preserve own-kind exclusions, renamed compendium identity, native changes and local visibility overrides. Fetid action/reaction restrictions remain manual.

- Add hidden, automatically attached Pit Fiend Fear Aura Regions. Enemies save at turn start using the source DC; failed saves offer/apply native or fallback Frightened until the target’s next turn. Successful saves grant temporary 24-hour immunity only to that source after dice finish. Respect Incapacitated sources, condition immunity and local visibility settings; preserve unrelated fear effects.

- Add automatic token-attached Heat Aura, Flame Aura and Fire Aura Regions for ten Monster Manual creatures. Regions default to hidden from players and retain the Region Library visibility override. Use each monster’s native radius/damage at its own turn end, exclude the source, offer GM target choice where specified and pause Azer auras while Incapacitated. Damage cards default to their recorded targets.

- Add native recurring damage for Vrock, Pit Fiend, Vine Blight, Tree Blight, Shambling Mound and Blob of Annihilation. Keep start-turn damage separate from end-turn repeat saves; show optional native escape actions for Tree Blight and Shambling Mound after damage. Add Pit Fiend confirmed-hit poison saving throws, supplying its missing Constitution ability on temporary helpers only. Preserve source damage, DCs, effects and local library overrides.

- Add the first Monster Manual grapple-escape batch: native grapple effects from 24 monsters now show optional action escape cards at the affected creature's turn start. Record the originating monster's native Escape Check DC, offer Athletics/Acrobatics where allowed, and default Mimic escapes to Disadvantage. Success removes only the tracked grapple and its combined native conditions after dice; separate poison/paralysis remains. No forced action spending, movement checks, grapple-capacity counters, or swallowed/ongoing-damage mechanics are added.

- Remove Unsettling Visage and Haunting Glare targeting Regions at the originating monster's turn end, preserving applied creature effects and their repeat saves.

- Exclude Graveyard Revenant from its own Haunting Glare automatic area targets, matching the Unsettling Visage self-exclusion while preserving other eligible creatures.

- Exclude Doppelganger from its own Unsettling Visage automatic area targets. Preserve all other eligible creatures, including creatures sharing its disposition; other areas retain their existing targeting.

- Fix tracked Monster Manual effects appearing not to apply: newly applied copies now receive a fresh native effect start timestamp and clear inherited expired state, instead of retaining an imported start time of zero. Preserve source book effects, native duration/status/stat changes and external turn automation.

- Prevent repeated Grell poison-save cards across hit/damage updates: store target UUIDs as values in a persistent handoff array instead of dotted flag keys, and retain a completed-handoff guard during local update races. Pending saves are reused rather than recreated.

- Fix monster natural-weapon saves being excluded from save prompts and repeat-effect registration. Accept Save activities on weapon items alongside spells/features, and allow explicitly configured Monster Manual repeat recipes to resolve weapon sources. Correct Grell coverage to use its actual weapon type; remove attack-only description links and unrelated grapple effects from its temporary poison-save card.

- Fix Grell's initial poison-save handoff: after a confirmed Paralyzing Tentacles hit and dice animation, create a separate native Constitution-save card for that recorded target, with prepared DC and persisted item data. Preserve the on-hit grapple, avoid repeat damage/resources/templates, and prevent duplicate follow-up cards. Failed saves use the existing poison/paralysis effect and repeat-save tracking.

- Add the first Monster Manual repeat-save batch: eight shared Trigger Library recipes covering Carrion Crawler, Chuul, Grell poison/paralysis, Doppelganger, Graveyard Revenant, Myconid Adult/Sovereign, Modron Pentadrone, Quasit and all four Gold Dragon ages. Native effects register source-specific end-turn saves with recorded DCs; success removes only the tracked effect after dice animations. Preserve stat changes, durations and separate grapples. Choice-based abilities, staged/counter effects, recurring damage and grapple escape prompts remain outside this batch.

- Add Aura of Life's resistance-only Region: default the native 30-foot self Emanation to place on cast and apply its native Necrotic resistance effect to the caster and matching-disposition allies while inside. Suppress the built-in 1-HP roll; healing and maximum-HP protection remain manual. Allow effect-only Region recipes to specify their targeting without dummy activity triggers.

- Apply Storm of Radiance die-count simplification at the final native damage-roll configuration step as well as pre-roll, including dialog rebuilds and imported spell copies.

- Simplify Storm of Radiance's native damage-count expression in the roll dialog: for example, display 3d10 Radiant and 3d10 Thunder at level 6 instead of (6 - 3)d10. Preserve native cast-level damage, bonuses and damage types without editing book spells.

- Change Yolande's Regal Presence to entry-only Region saves per table preference; remove end-turn triggers while preserving initial aura contact and once-per-turn limits.

- Add Jallarzi's Storm of Radiance: native initial/entry/end-turn Constitution saves, once per target per turn, preserving Radiant/Thunder damage and upcast scaling. Region-managed Senses Overwhelmed applies Blinded, Deafened and Silenced while inside regardless of saves; it is excluded from card-based effect application.
- Add Yolande's Regal Presence: default Surround Self to place its attached aura, link Region events to Emanation Save, and process initial occupants through the same once-per-turn entry/end-turn workflow. Exclude the caster; default to hostile targets. Failed saves apply Prone after dice using existing Auto Apply Saved Effects/GM manual controls and Undo. The optional push stays manual. Zone of Truth remains outside automation.

- Fix player-cast Guardian of Faith Regions failing to trigger: run the summoned guardian's GM-only Region behavior on the active GM instead of assigning execution to the player caster. Existing owner save/damage prompt routing remains in use; ordinary spell execution routing is unchanged.

- Fix the missing embedded-document warning when Guardian of Faith exhausts its pool: let native token attachment cleanup own attached-aura deletion, reserving module cleanup for detached remnants. Apply the same ownership rule to Flaming Sphere. Skip unchanged queued pool updates and safely resolve already-deleted guardians during Undo.

- Add Guardian of Faith: attach a native 10-foot Emanation to the summoned guardian and use its Guarded Area save on enemy entry/start of turn, once per target per turn. Deduct applied damage after saves, resistances and reductions (including temporary HP and overkill) from the feature's existing 60-point pool; Undo refunds it. Exhaustion deletes only that guardian and aura; Undo of the exhausting damage restores them. No concentration handling or Consume Damage Pool activity is used.

- Add Flaming Sphere automation: create a native 5-foot Emanation attached to each newly summoned sphere, with GM setup for player summons. End-turn saves use the caster's native Dexterity save, Fire damage/half on success and original slot scaling. Exclude the sphere itself; remove the Region with its token or normal concentration cleanup. Movement and ramming remain manual; no entry damage.

- Add Sleet Storm Region automation: placement without an immediate save, then entry/start-turn Dexterity saves once per target per turn. Failed saves apply native Prone with Undo support and end existing concentration after Dice So Nice finishes. Respect Auto Apply Saved Effects; provide a GM card control for manual application. Standing, terrain, obscurity and extinguishing flames remain table-managed.

- Fix Stinking Poison persisting for an extra turn: remove its applied effect when the affected creature finishes the application turn, bypassing the native target-end expiry grace turn. Cleanup runs only for the outgoing combatant under active GM authority.

- Add Stinking Cloud Region defaults: placement without an initial save, then Constitution saves at each creature's turn start. Preserve the native failed-save Poisoned effect and correct applied copies to expire at the affected creature's turn end. Existing owner/GM save routing, effect application settings, pending cards and Dice So Nice waits remain in use.

- Add Conjure Woodland Beings Region defaults using the Spirit Guardians-style entry/end-turn workflow: native 10-foot Emanation, WIS saves for 5d8 Force/half, +1d8 per slot above 4, hostile-only default targeting, one save per target per turn and shared cards. Link the native Cast and Emanation Save activities for initial card/limiter registration. Correct this self-origin aura's initial target collection to use the configured Region targeting rather than the caster. Native Disengage remains manual; Conjure Celestial remains outside automation.

- Add Wall of Thorns Region defaults: native wall/circle placement deals Piercing damage; entry/end-turn events use the native Traversal Save for Slashing damage, DEX save for half, once per target per turn. Preserve original slot scaling and grouped traversal cards without reusing placement damage rolls. Native dimensions remain unchanged; movement costs and sight blocking remain table-managed.

- Add the table's Wall of Fire Region ruling: initial native DEX save/half damage, then entry/end-turn Fire damage without saves, once per target per turn. Use the spell card's placed Region unchanged; no automatic width expansion or hot-side geometry. Follow-ups preserve native slot scaling, grouped damage, resistance/application handling and wall/ring selection through temporary damage-only snapshots.
- Keep Wall of Fire's initial save card separate from later no-save damage cards while recording initial target turn allowances. Preserve specialized trigger properties when editing Region recipes; explicit activity changes release stale activity-ID/shape links.

- Add built-in damage-area Region recipes for Cloud of Daggers, Cloudkill, Insect Plague, Incendiary Cloud and Blade Barrier: native placement damage, entry/end-turn triggers, everyone targeting, once-per-turn limits and grouped cards. Preserve native damage types, saves, resistance handling and slot scaling. Existing local overrides remain authoritative.
- Resolve new Region recipes by native activity ID and follow Blade Barrier's original wall/ring activity. Initial card-sharing and turn-limit seeding use the same resolution, avoiding an extra save after a ring cast. Name-only custom recipes remain supported. Cloud repositioning, terrain, cover and obscurity remain GM-managed.

- Clear Confusion's targeting-only Region at caster turn end, preserving its creature effects, concentration and end-turn save prompts. Existing ongoing Region protections and local lifetime overrides still apply.

- Add prompt-only end-turn saves for Confusion, Crown of Madness, all six Contagion native ability effects, Flesh to Stone, and Sleep. Sleep creates only its single follow-up save. Keep outcomes, save counts, condition changes, damage/waking/upkeep interactions and effect removal manual. GM Stop repeat saves pauses prompts without removing conditions; shared Contagion variants produce one save per cast/target/turn.
- Add Antipathy/Sympathy end-turn cards with manual eligibility confirmation for the greater-than-120-foot condition. No automatic distance checks, effect removal or immunity tracking. Leave spells with action-, movement-, start-turn-, or long-interval checks manual rather than inventing turn-end saves.

- Add Heroism and Regenerate creature triggers. Bravery refreshes temporary HP from the caster modifier recorded on application; Regenerating restores 1 HP at target turn start, separate from the native initial 4d8 + 15. Fixed benefits create native typed healing cards without repeated dialogs and follow Auto Apply Healing / manual Apply, preserving temporary-HP replacement and HP caps. Native immunity/stat changes and effect durations remain intact.
- Extend buff-effect automation specifically to Heroism and Regenerate after their initial healing roll completes and dice finish. Recorded upcast recipients receive native effects through existing Undo/application handling; canceled or pending initial rolls do not leave ongoing buffs behind. Trigger Library entries support enable/disable, turn timing and caster-modifier/fixed amount overrides.

- Register Weird Frightening Terrors as an explicit AC5E disadvantage source for attack rolls and ability checks while the tracked effect is active, with normal advantage cancellation. Supply native attack/check defaults and attack-dialog button selection when the rule bridge is unavailable. No saving-throw penalty is added.

- Fix Weird Frightened roll recommendations with AC5E: link the applied effect's legacy origin to the actual caster while preserving native activity, message, concentration and source-effect metadata. AC5E can then enforce visible-source disadvantage normally. Reload also repairs active matching effects on world/current-scene actors.

- Ensure Weird's applied Frightening Terrors effect includes the native Frightened status, retaining other statuses and changes. The condition follows the same tracked effect and ends with it; no duplicate standalone condition is created.

- Default Weird's targeting-only Region to cleanup at the end of the caster's turn, like Fear. Preserve concentration, creature effects and recurring saves/damage; honor ongoing Region configurations and local lifetime overrides.

- Complete Phantasmal Killer's applied Fears Manifested effect with native disadvantage defaults for all ability checks and attack rolls. Preserve existing/custom changes, avoid duplicate entries, and leave book source effects and saving throws unchanged.

- Add save-first turn-end triggers for Phantasmal Killer and Weird. Failed Wisdom saves prompt recurring Psychic damage only after save dice finish: native slot-scaled Phantasmal Killer dice, or Weird's separate 5d10 repeat damage. Successful saves remove the tracked target effect after animations; Phantasmal Killer also ends its own concentration. Temporary helpers spend no resources, repeat no initial effects/Metamagic selections, and suppress cast-animation replay. Existing damage-then-save triggers remain supported.

- Fix Melf's Acid Arrow initial misses: prompt damage on either outcome and keep splash damage visible after a miss or Shield. Native damage application defaults to full damage on a hit and half on a miss, retaining resistance/immunity calculations and explicit GM multipliers. Delayed acid remains hit-only.

- Add one-shot Lingering Acid triggers for Melf's Acid Arrow (hits only) and Vitriolic Sphere (failed saves only). Create one delayed-damage card at the target's turn end, preserve Arrow slot scaling and Sphere's fixed 5d4, and remove only the spent effect after dice finish. Pending/canceled rolls retain that card without producing later-turn duplicates. Prevent the native turn-start expiry from deleting the delayed effect prematurely; book source items remain unchanged.

- Add Power Word Stun to the Creature Effect Trigger Library: the native Stunned effect prompts a Constitution save at turn end using the caster DC recorded on application. Successful saves remove only that stun after dice animations; the separate No Movement effect does not prompt saves. The book spell remains unchanged.

- Show optional escape action buttons to the affected token�s owners as well as GMs. Player requests are validated and released by the active GM before routing the roll prompt.

- Wait for action-based escape check dice animations on connected clients before removing the restraint or ending its concentration.

- Prepare final actor-dependent attributes on temporary escape-spell cast/card copies so initial saves and Pending retries retain a calculated save DC, including Entangle.

- Add action-based Strength (Athletics) escape checks for Ensnaring Strike, Web, Evard’s Black Tentacles and Entangle, using the original caster DC. The GM chooses the action; connected owners receive a manual check dialog with GM fallback, including for NPCs. Successful checks remove only the tracked restraint after animations.
- Add separate Region recipes for Web (entry/start-turn restraint saves), Evard’s (entry/end-turn damage and restraint saves, once per turn), and Entangle’s initial-cast area. Restrained stays a failed-save target effect, not a continuous membership effect. Web ends only its own restraint on exit/deletion; spell concentration dependencies are retained on Region-triggered applications.
- Use temporary cast snapshots instead of modifying native items: omit burning-web damage from Web’s ordinary saves, defer Ensnaring damage to the native scaled start-turn activity, and make Evard’s damage failure-only. Web placement completes without an initial save/damage roll. Ensnaring’s successful initial save or successful escape ends its own concentration.

- Treat Spike Growth and other enabled movement-only Region casts as placement without initial damage. Suppress native/confirmation damage on placement, hide the initial card’s Damage action, and commit the pending cast after successful Region placement and target/Metamagic confirmation. Concentration handoff completes without requiring a damage roll; canceled placement still refunds and cleans up.
- Mark genuine movement-counter damage rolls separately so placement safeguards do not block them. Preserve accumulated movement, increments, targeting, and existing movement damage processing.

- Include the caster’s native Half Speed effect in Spirit Guardians’ default Region recipe. Region membership controls the speed reduction independently of saves; the Region/card ownership rule prevents duplicate card application. Existing world effect overrides remain intact.

- Treat effects assigned in a spell’s Region configuration as continuous Region-owned effects. Exclude those effects from automatic save/hit/buff application and manual chat-card Apply Effect controls, while preserving other effects and normal save outcomes. Match copied book effects without editing their source data. Region membership continues to control application/removal independently of damage saves; Region-only effects no longer mark a card as having applied an outcome effect.

- Move the seven currently saved Region recipes into a module-owned Region library: Hunger of Hadar, Spirit Guardians, Grease, Fog Cloud, Conjure Animals, Spike Growth, and Moonbeam. Resolve module defaults with world overrides/custom entries across Region placement, conditions, targeting, save/damage prompts, and cleanup. Preserve current trigger IDs, timing, targeting, shared cards and movement behavior; portable source references point to PHB items.
- Automatically migrate the current module’s legacy spell table on the next GM load, retaining the original table and a backup. Keep local enablement, activity/effect references, trigger IDs, conditions and custom entries; retry interrupted migrations without discarding the original configuration. The former module namespace is not reactivated.
- Remove Add Starting Spell List from the manager: defaults are available automatically. Show Module default / Customized / Custom entry and Reset to Default for built-ins. Disable built-ins rather than delete them; custom entries remain locally editable and removable.

- Add Blink automation with its original chat card available for manual checks during the caster’s turn. The active GM rolls automatically at turn end only if that turn has not already been rolled. Persist a shared turn claim to prevent duplicate player/GM clicks or turn updates from rerolling.
- On a Blink result of 4–6, apply a source-specific Ethereal effect after dice animations. Clear it at the caster’s next turn start or when Blink ends, preserving other effects. Keep the token visible and show a reminder to choose the return space manually. A one-minute tracking effect and Trigger Automation Library toggle control the workflow without repeated spell costs.

- Disable the unarmed damage dialog’s Grapple choice when that target is already actively grappled by the same attacker. Keep Prone available and clear stale duplicate selections before damage replacement or submission, avoiding wasted damage or Grappler usage.

- Fix concentration replacement being rejected after selecting Break Current Concentration. Keep the chosen old effect available through native consumption validation, then defer its removal until the pending cast commits. Canceled casts preserve the old concentration and refund resources; disabling new concentration does not end the previous spell.

- Add Grapple to the Trigger Automation Library. New module-created Grappled effects record their grappler’s DC and show an optional escape save card at turn start. The GM chooses whether to use the action; the target uses its better Strength/Dexterity save, with Strength on ties. Success removes only the tracked grapple after dice animations, without requiring the original temporary grapple item. Prone is excluded.

- Add optional action-save cards at turn start for Otto’s Irresistible Dance. Cards wait for the GM’s choice and do not automatically prompt or roll, including for GM-run NPCs. The brief successful-save dance effect is not registered.
- Add damage-triggered repeat saves for Dominate Beast, Dominate Person, Dominate Monster, and Tasha’s Hideous Laughter. Each positive native damage application, including damage absorbed by temporary HP, creates its own save; healing and Undo do not. Hideous Laughter also repeats at turn end and receives advantage only on its damage-triggered saves.
- Expose damage-taken triggers, additional damage saves, damage-save advantage, and card-only prompting in the Trigger Automation Library. Coordinate player-applied damage through the active GM without duplicating socket events; preserve native effects, resources, pending routing, and animation-aware success cleanup.

- Add end-of-turn repeat-save recipes for Hold Person, Hold Monster, Blinding Smite, Wrathful Smite, Slow, Blindness/Deafness, Ray of Enfeeblement, Synaptic Static, and Sunburst. Preserve native conditions and stat changes, track Blindness and Deafness separately, and exclude Brief Enfeeblement. Follow-up cards use save-only activities without repeating initial damage, spending spell resources, or replaying casting animations. Successful saves remove only their tracked effect after dice animations; library overrides remain available.

- Default spell card recipient displays to Target once recorded recipients are available, including area spells, attacks, and damage cards. Correct the Selected fallback from initially empty targeting while preserving later manual mode choices and the actual recipient data.

- Remove layout-forcing geometry measurements from chat result visibility checks. Determine handoff from DOM/animation state before styling cards, preserving pending-card visibility through Dice So Nice.
- Limit feature-driven chat refreshes to mounted messages and grouped summaries. Explicit result, correction, and Undo refreshes remain available for unmounted cards.

- Add Moonbeam to Region starter recipes: native Save activity on entry and turn end, once per creature per combat turn, with a shared damage card. Existing world configurations are preserved.

- Disable Automated Animations recognition on temporary recurring save/eligibility helpers so Fear repeat saves do not replay casting or area animations. Original spell, effect, recurring-damage, and dice animation settings remain intact.

- Add a Targeting area lifetime override to creature-trigger entries. Fear defaults to removing its targeting cone at the caster’s turn end without changing concentration, spell duration, or creature effects. Ongoing manager-configured Regions remain protected.

- Hide and block retroactive save mode adjustments while effects from that workflow are applied, including save-only spells such as Fear. Undo Effect restores the controls once recorded applications are cleared.

- Prevent recurring effect and rider save cards from reopening cast-time targeting/Metamagic confirmation. Repeat cards reuse persistent original-cast Metamagic without spending resources again; Careful Spell’s initial-save protection is not repeated.

- Make manual Apply Effect respect each recorded target’s save outcome, including Fear. Failed saves receive failure-only effects; successful or pending saves are skipped. Explicit effects configured to apply on a successful save remain supported, with Undo preserved.

- Add Fear to the built-in creature-trigger library using the installed book’s native Fear effect and Wisdom save. Repeat saves occur at the affected creature’s turn end only after GM confirmation that it cannot see the caster; success removes only that effect after animations.
- Support save-only entries with no damage activity. Fear’s concentration, duration, and Frightened condition remain native; dropping items, Dash, and safest-route movement remain manual.

- Add custom creature-trigger entries through Add New Effect, using a separate spell drag/drop or UUID picker. Keep custom entries in world storage alongside built-in recipes.
- Enlarge View/Edit with vertical scrolling and replace its drop zone with a Choose Source button.

- Add a GM-only Trigger Automation Library shortcut to the Compendium sidebar alongside the Spell and Region Manager.

- Add spell drag/drop to the creature-trigger editor, with dropdowns for native effects, damage activities, and save activities. Saving throws can be omitted.
- Default to native cast-level damage; show a custom formula only when Custom damage is selected. Add section information popups and a live workflow preview.

- Display the Trigger Automation Library as a spell/effect table with status and customization indicators. View/Edit opens a separate entry window; saving or restoring defaults refreshes the list.

- Preserve the recurring damage card’s source link when rolling Searing Smite damage, allowing its Constitution save to follow the completed damage roll.

- Add a creature-effect Trigger Automation Library with a built-in Searing Smite entry and persistent world overrides. Existing Region configuration and native effect changes/durations remain intact.
- Seared now schedules native, cast-level-scaled damage at the affected creature’s turn start, routes the roll to a connected caster owner with GM fallback, then prompts the Constitution save. Success removes the recorded Seared effect after dice animations; failure retains it. Turn progression remains unblocked.
- Guard against duplicate turn updates and stale cards resolving a refreshed effect. Explicit external turn-automation changes are skipped.

- Fix initial saves for Smite spells whose save and damage are separate activities, including Wrathful Smite. Keep recurring Searing/Blinding saves out of the initial hit.
- Show the selected Smite spell as a tag on its weapon damage card, including Divine Smite.

- Expand damage Configuration to a single Smite spell/resource choice drawn from prepared 2024 Smite spells. All selected Smites add their initial damage to the weapon card. Save-based Smites create a separate save-only card; effects apply on failure, or directly for no-save Smites. Slot and bonus-action costs are spent once.
- Carry a weapon critical into the selected Smite’s initial damage without copying weapon-only critical bonus dice or making ongoing Smite damage critical. Unprepared spells, undersized/exhausted slots, and unavailable bonus actions are excluded or rechecked before casting.

- Apply Cleave’s positive ability-modifier subtraction to the final constructed weapon roll, including the displayed preview and submitted result. This survives AC5E’s saved-formula restoration during dialog rebuilds and preserves weapon magic bonuses, Rage damage, and critical dice.

- Fix Cleave damage opened from native card actions: apply the ability-modifier adjustment after the source link is established. Remove the positive ability contribution from the base formula while preserving weapon magic bonuses, Rage damage, and ability context for feature checks.
- Recheck Cleave’s different-target requirement before the attack dialog, before dice evaluation, and at publication. Native card actions inherit their Cleave source/session so they cannot bypass the check.

- Add Cleave to successful melee attack chat cards when the weapon’s Cleave mastery is unlocked. Select one different creature and roll a separate linked attack and damage workflow. Target distance and reach remain table decisions.
- Share one Cleave use across weapons for each active combat turn. Canceling the prompt preserves the use; a rolled attack spends it even on a miss. Cleave cannot trigger itself or consume an additional Reaction.
- Cleave damage excludes a positive ability modifier and retains a negative one; fresh damage choices use the second target and existing feature/resource rules. Corrections to the first attack never automatically undo the completed Cleave.


## v0.7.5 — Pending Cards, Concentration & Targeting

- Declare Automated Conditions 5e and Dice So Nice! as required module dependencies, with installation manifests. Both must be installed and enabled; no-Dice-So-Nice damage-card updates are not a supported configuration.

- Initially empty shared spell Regions wait for their first recorded target before prompting damage. The original cast card routes that prompt to the connected caster owner, with GM fallback; later targets reuse the roll.
- The regular Damage action reuses an unresolved Pending damage card instead of leaving a separate placeholder behind. Stale dialogs are invalidated, and targets added while a damage dialog is open are retained when the roll is published.

- Recognize native Willing Creature targets in automatic Utility buff effects. Upcast Fly and similar buffs apply to each recorded willing recipient, rather than only passing the caster through the self check. Uses native scaled effect preparation and existing Undo tracking.

- Automatic buffs fall back to the usage token or recorded caster target when the chat speaker token is missing or belongs to another actor. Character casters without a scene token can still buff explicitly friendly recipients, including additional upcast Fly targets. Native effect application and hostile-target filtering remain in place.

- Refresh grouped saving-throw cards when Dice So Nice finishes, even when the save has no standalone chat element. This clears stale Pending rows for multi-target casts without rerolling or scanning the chat log.

- Require a selected target for direct attacks and targeted spells/features, including healing and marks. Validate single-target limits after native upcast scaling and before resource consumption; multi-target spells accept partial groups. Self and area/template activities retain their normal targeting flow.

- Concentration checks keep their pending status until Dice So Nice animations finish on active clients, then show the outcome and end concentration on failure. Background clients retain the animation bypass; GM takeover remains available during the wait.

- Add concentration challenge popups using native damage-triggered prompt cards and native concentration saves. Route to an active owning player, otherwise the GM; GM-run NPCs follow the existing automatic NPC-save setting. Pending checks support retry and GM takeover, including owner disconnects.
- Add separate Prompt Concentration Checks and End Concentration on Failed Checks settings under Rolls & Damage / Healing. Failures end only the concentration effects recorded for the check, preserving newer spells and using native Region cleanup.

- **Dice So Nice integration — background GM and player windows:** switching tabs, minimizing, or losing window focus during an animation no longer leaves this module’s evaluated roll workflow waiting for that client to reactivate. Animation waits release even when focus changes mid-animation; active clients continue waiting normally. This fix ships with Ugmuls 5.5e Automation and runs on connected clients after updating and refreshing. It does not modify Dice So Nice itself or change the dice results.

- Keep initial attack usage cards visible until the linked result is displayed, including Dice So Nice animation delays. Show a waiting status and prevent duplicate attack clicks during the handoff. Refresh only linked cards through the shared queue, and restore the source if its result is removed.

- Publish a native Pending usage card before a player configures a spell/feature cast, then reuse it through targeting, Metamagic, template placement and the first roll. Preserve whisper/blind roll modes and native source grouping.
- Canceling a pre-roll usage, target, template or roll dialog removes its pending usage card and refunds native consumption and cast-time Metamagic. Cast-owned bonus/spell/reaction markers are cleared without changing unrelated uses.
- Preserve previous concentration until the new cast commits; remove newly created cast effects and templates on cancellation. Actual roll results commit the cast and prevent later refunds.

## v0.7.4 — Performance & Parry

- Coalesce reaction and feature card refreshes through a shared queue. Actor changes skip features they do not have, own-roll and defender actions target related cards, and overlapping requests refresh each card once per batch. Rendering yields between batches of eight cards.
- Index damage/healing cards by source usage for repeated roll-lock checks. Message creation, updates, and deletion invalidate the index; HP/Undo flags remain live.
- Keep combat resource writes, effect expiry, and roll evaluation outside the deferred presentation queue.

- Add Battle Master Parry on incoming single-target melee damage cards. Spend a Reaction and current Superiority Die, reduce existing damage by the die plus the higher Strength/Dexterity modifier, and preserve original dice. Includes resource rollback and player-to-GM handling.

## v0.7.3 — Character Creation, Bards & Barbarians

This release adds guided player-character creation and expands Bard and Barbarian automation through the existing attack, save, damage, and effect card workflows.

### Guided character creation

- Create Player in the Actors directory walks through name and ownership, default PC token setup, Standard Array or 27-point buy, class, background, species, equipment or starting gold, class spells, preparation, and review.
- Native advancement and spell pickers respect enabled Compendium Sources. Token artwork remains manual.
- Ability scores start unassigned. Standard Array choices share a remaining-value pool; point buy shows remaining points and affordable choices. Reset clears the selections.
- Continue Character Creator Wizard on an owned PC checks the current sheet and saved progress so setup can resume without duplicating starting equipment.
- Standard and Tidy spell Add buttons offer eligible full-list preparation classes a missing-spell loader. It adds only currently castable leveled spells from enabled sources, unprepared, preserving existing and always-prepared spells. Paladins use the compendium browser.

### Bard automation

- Bardic Inspiration automatically applies the native Inspired effect and tracks its source Bard and granted die. Failed attacks, saves, and checks can add that die while preserving the original d20. The die is consumed when rolled.
- Cutting Words offers eligible enemy attack and damage adjustments within 60 feet, using the Bard's Reaction and Inspiration resource while preserving existing dice.
- Peerless Skill adjusts the Bard's own failed attacks and ability checks, spending Inspiration only when the adjusted test succeeds.
- Valor Combat Inspiration adds its damage die in the initial damage configuration, including critical damage. Defense uses the recipient's Reaction to add AC against an incoming attack and combines with Shield.
- Unknown-DC adjustments request the information needed to determine the result.

### Barbarian automation

- Zealot Divine Fury adds its scaled Radiant or Necrotic damage to the first eligible hit on the raging Barbarian's turn.
- Fanatical Focus offers a single replacement d20 plus Rage Damage bonus on a failed save, once per Rage. Previous advantage/disadvantage is not reused, and recorded targeting is restored afterward.
- Zealous Presence grants advantage on attacks and saves until the source Barbarian's next turn, combining normally with disadvantage and AC5E.
- Brutal Strike sits above Normal in the attack prompt; Reckless sits above Advantage. Brutal can activate Reckless on the first attack, or reuse it later, and requires a Strength attack without disadvantage on the Barbarian's turn.
- Brutal damage rolls with the weapon damage and supports native scaling and criticals. Damage configuration selects Forceful or Hamstring Blow; Improved Brutal Strike adds Staggering and Sundering, and Improved Brutal Strike (2) permits two different effects.
- Selected native Hamstrung, Staggered, and Sundered effects apply to hit targets with source-turn expiry, manual Apply, and Undo support. Movement remains manual.
- Sundered adds one +5 bonus to the next single-target attack by another creature, then consumes qualifying effects after the roll, hit or miss. Canceling the prompt preserves the effect.
- Staggered supplies disadvantage on the next save through AC5E or the standalone flow. It cancels Magic Resistance advantage to Normal. The effect remains until expiry for its Opportunity Attack restriction after the save benefit is spent.

### Workflow improvements

- Shield spends an available limited/free use first, then the lowest available eligible spell slot, including upcasting and Pact slots.
- Automatic damage and healing application have separate settings.
- Damage cards hide when a later attack adjustment makes every target a miss, and return if the attack becomes a hit again.
- Save-card borders include the initial card; Bardic prompts use constrained icons and chat scrolls after Inspiration application.
- Published attack cards provide a second hit-to-damage prompt check; manual damage retains its originating attack for rider eligibility.

### Fixes and validation

- Restore Sundering Blow's +5 after the native attack dialog rebuilds its formula. Sundered is consumed only when the completed attack includes the bonus.
- Preserve Staggered's ongoing effect after spending its next-save disadvantage, and reset that allowance when the effect is reapplied.
- All 54 local regression test files pass.
- Hard-refresh GM and player clients after updating.

## v0.7.2 — Battle Master Update

## Battle Master

- Precision Attack adds the current Superiority Die to an existing missed attack, preserving the original d20. Undo applied damage before adjusting the attack.
- Trip Attack adds damage and prompts a Strength save for Large or smaller targets. Failure uses the native Prone condition, recognized by standard condition controls and Automated Conditions 5e.
- Distracting Strike adds damage and grants advantage to the next attacker other than the Fighter, then clears its effect.
- Menacing Attack adds damage and prompts a Wisdom save. Failure applies native Frightened linked to the Fighter until the end of their next turn.
- Goading Attack adds damage and prompts a Wisdom save. Failure causes disadvantage against creatures other than the Fighter until the end of the Fighter’s next turn. Advantage and disadvantage cancel normally.
- Maneuvering Attack adds damage and a reminder tag. Ally selection, reaction use, and movement remain manual.
- Pushing Attack adds damage and prompts a Strength save for Large or smaller targets. A reminder tag leaves movement to the GM.
- Maneuvers use the configured current Superiority Die, including d10/d12 progression, support critical damage, and share a one-maneuver-per-attack limit.
- Relentless adds a Superiority Die dropdown beneath Maneuver. Spend the current die by default, or choose a free d8 once per active combat turn. An empty normal pool defaults to the free d8 when available. Precision Attack shares the same free-use limit; canceling does not consume it.
- Fighter automation settings allow individual maneuvers and Relentless to be enabled or disabled. Applicable effects retain Apply/Undo controls.

## Great Weapon feats

- Great Weapon Fighting treats damage dice of 1 or 2 as 3 on qualifying two-handed melee weapon attacks, including attached riders and Savage Attacker pools.
- Great Weapon Master offers proficiency-bonus damage on Heavy-weapon hits made with the Attack action on your turn. Bonus-action and reaction attacks are excluded; Hew remains manual.
- Both settings are under Automations → Feats.

## Fixes and presentation

- Weapon and rider damage dice animate together in one Dice So Nice throw when resolving pending damage.
- Damage cards show Goading, Maneuvering, Pushing, and Relentless tags with reminder tooltips.
- Goading effects participate in native turn-end expiry tracking; existing effects are repaired when the active GM reloads.
- Great Weapon Fighting previews handle native die methods and nested dice pools correctly, and retain their minimum through critical-hit adjustments.
- The Relentless die selector can be changed before selecting a maneuver.

Hard-refresh GM and player clients after updating.

## v0.7.1

### Added

- **Stunning Strike:** a default-No damage Configuration option for confirmed Monk weapon and Unarmed Strike hits. Spends 1 Focus Point once per combat turn and creates a native Constitution save card. Failure applies Stunned; success halves Speed and grants advantage on the next attack. Effects expire at the Monk's next turn start and support Undo Effect.
- **Grapple / Prone:** qualifying action-based Unarmed, Empowered and Elemental Strike hits offer No, Grapple, or Prone for any creature. Attempts replace damage and create independent save cards, without modifying existing item activities. Saves use the target's higher Strength/Dexterity save modifier, choosing Strength on ties; Martial Arts can use Dexterity for the DC.
- **Grappler:** a separate feat automation preserves damage plus Grapple once on the attacker's turn and recommends advantage against creatures grappled by that attacker. Later attempts replace damage. Grappled is a Temporary effect for token HUD visibility, without a timed expiry.
- **Combined Stunning Strike and Grapple:** Stunning Strike resolves first, including animation and automatic effects. Stunned targets automatically fail the subsequent Grapple/Prone save; other targets receive their normal prompt.
- **Divine Smite:** melee weapon hit damage offers the configured free cast or an available spell slot, consumes the appropriate resource and bonus action, and automatically adds the Fiend/Undead bonus. A golden glow and info tooltip identify the bonus. Critical damage follows the weapon roll.
- **Eldritch Smite:** a default-No pact-weapon damage rider consumes a Pact Magic slot, scales Force damage with its level, and is limited to once per combat turn without spending a bonus action.
- **Hunter's Prey / Colossus Slayer:** a remembered Yes/No rider, initially No, adds the feature damage against an injured single target once per combat turn. Damage matches the weapon and supports criticals.
- **Frenzy:** the first qualifying Strength-based weapon hit on the Barbarian's turn while Rage and Reckless Attack are active automatically adds the feature damage. Matches the weapon damage type, supports criticals, and locks after use that turn.
- **Innate Sorcery:** active Innate Sorcery recommends advantage on Sorcerer spell attacks, with Automated Conditions integration and normal disadvantage cancellation.
- **Empowered Spell:** a feature-icon action on spell damage cards lets users select active damage dice up to their Charisma modifier (minimum one), spend 1 Sorcery Point, and replace the selected results. Supports critical dice and animation timing. Opening the picker stops automatic application; applied damage must be undone before adjustment.
- **Seeking Spell:** a missed-spell-attack action spends 1 Sorcery Point to reroll one d20 and use the new result, refreshing hit/critical outcomes and prompting damage when appropriate.
- **Cast-time Metamagic:** Transmuted, Heightened and Careful Spell choices support single-target and area casts. Resource costs and combination limits respect Sorcery Incarnate with active Innate Sorcery and Arcane Apotheosis. Empowered and Seeking remain available on result cards.
- **Metamagic card tags:** spell damage cards show the applied options beside Spell/Magical, with element or target details in tooltips. Result-time reroll tags stay with the relevant attack or damage card.
- **Pending damage and healing:** prompts create a clickable ---pending--- card before rolling. A GM or owner can reopen the prompt for themselves; older prompts are invalidated. Results fill the same card after animations, retaining Apply and Undo controls.
- **Combat resource trackers:** Bonus Action and Reaction tracking cover all active combat participants and reset at their next turn start. Consumed Spell Slot tracks character actors only and resets at the current turn's end. Cantrips, free casts and non-spell slot expenditures do not count toward that spell-casting limit. Trackers do not run out of combat.

### Changed

- **Automation settings:** Module Options opens to Automations, with Unique Classes, Weapon Masteries, Feats, Common and Spells submenus. Unique Classes has an All/class filter covering all twelve core classes. Navigation stays above the scrolling settings, and the window has a bottom-right resize handle.
- Disabling the main Weapon Mastery Effect Automation switch greys out its child options while preserving their selections. Grappler Feat Automation is separate from the Common Unarmed Grapple / Prone Prompts setting.
- Damage Configuration uses Yes/No selectors and live dice previews. Savage Attacker defaults to Yes, Sneak Attack matches the weapon damage type, and once-per-turn lockouts display No - Already Used in the selector.
- Conjure Minor Elementals uses its remembered elemental selector in the damage row, with extra spacing below Situational Bonus and no duplicate Configuration selector.
- Ordinary area casts proceed after collecting targets unless Choose Targets is enabled or applicable cast-time Metamagic requires confirmation. Metamagic-only confirmation keeps the target list fixed; Careful selects protection without removing targets. Retarget remains available for corrections.
- Reckless Attack can be activated only on the first attack roll of the attacker's own turn. Its advantage persists until the start of the attacker's next turn, including qualifying reaction attacks.
- Divine Smite uses the shared bonus-action and spell-slot trackers instead of a separate per-turn marker. Spent markers are reused and become inactive when reset; Eldritch Smite retains its own once-per-turn limit.

### Fixed

- Pending-damage retries made by players now publish their results through the GM correctly. Original rolls and retries suppress duplicate Dice So Nice animation when the card is populated.
- Chat follows pending-damage card expansion to the bottom, while respecting users who have scrolled up.
- Linked rider save updates resume the original damage card, so automatic Stunned failures continue through damage and Grapple effect application without a manual click or duplicate application.
- Stunning Strike hides Apply Effects after application. Undo Effect restores it and unlocks save advantage/normal/disadvantage independently of weapon damage; reapplication locks the save again.
- Renewing Savage Attacker and other spent markers clears stored expiry state, restoring once-per-turn limits after reset.
- Combat-end tracker cleanup avoids conflicts with native effect expiry/deletion.
- Seeking Spell ignores animation and rendering-only metadata changes during rerolls, while genuine attack edits still cancel and refund the point.

## v0.7.0

Renamed to **Ugmuls 5.5e Automation**, with repository, module ID, installation folder and release ZIP named `ugmuls-5-5e-automation`. This is a clean installation identity; settings and stored world references from the previous ID are not migrated. Starter spells can be added through the manager.

## v0.6.1

Release prepared from the three development commits on `v0.6.1dev` since v0.6.0.

### Added

- Eldritch Blast and Scorching Ray open a remaining-attacks window after casting, with character-level or slot-level counts. The Attack button reuses the scaled cast and current single target without another spell-slot spend, retaining normal attack/damage controls. Canceled rolls do not consume a shot. Additional spell damage uses each attack's target. Toggle under Bonus Damage Riders.

- Conjure Minor Elementals adds a checked attack-damage rider when the target is inside that caster's active concentrated spell Region. Uses the spell's Bonus Attack Damage activity and Region cast level, with Acid/Cold/Fire/Lightning choice, critical support and existing Apply/Undo Damage. No custom marker effect required. Single-target cards only; setting under Bonus Damage Riders.

- Sneak Attack adds a damage popup checkbox for owned attackers with the feature: checked by default for Advantage, manually selectable otherwise. Uses the feature's configured damage activity for scaling and the weapon damage type, supports criticals and Apply/Undo Damage. Once per combat turn, resetting on turn transition for later reaction attacks. Canceling does not consume it. Setting under Bonus Damage Riders.

- Off-turn Reaction Tracker marks manual spell, weapon and feature uses with Reaction - used, blocking further off-turn uses until disabled/deleted or expired at next turn start. Saves, linked damage rolls and automated Region triggers remain available. Toggle under Effects.

- Hex and 2024 Hunter's Mark damage riders track each caster's concentration and marked token. Attack damage popups offer checked Hex/Hunter's Mark options, adding labeled 1d6 Necrotic/Force components to the same damage card, with standard/maximized criticals and existing damage undo/application. Changing targets on the mark's usage card updates the association. Single-target cards only; separate enable settings in Bonus Damage Riders.

- Pending save buttons open a manual saving throw prompt for the clicking GM or token owner. Taking over closes the previous module save popup on connected clients, allowing a GM to handle an AFK player's pending save.

- Applied damage locks retroactive ADV/Normal/DIS and Normal/Critical controls on the damage card and linked attack/save rolls. Undo Damage unlocks adjustments; manual or automatic reapplication locks them again. Outstanding linked applications must all be reversed first.

- Savage Attacker adds an optional weapon damage popup toggle. Roll the weapon dice as two complete sets and keep the higher set with native roll details. A Savage Used effect prevents reuse until next turn start; canceling does not consume it. Includes a setting under Weapon Mastery & Attack Properties. After Undo Damage, Normal/Critical controls convert each weapon dice set, recalculate the winner, and preserve cached rolls, supporting standard and maximized criticals.

- Reckless Attack assistance adds a split Adv/Reckless control to owned attackers with the feature. Reckless applies the configured feature effect (or a marker for text-only imports), submits the native Strength attack, expires at the source's next turn start, and recommends advantage for subsequent Strength attacks and attacks against the Reckless creature. Automated Conditions integration preserves disadvantage cancellation. Includes an independent Attack Properties setting.

### Fixed

- Manual damage/attack interaction stops only that attack's damage automation, allowing later Scorching Ray/Eldritch Blast shots to continue independently. Explicit cast-level manual handoffs remain respected. The remaining-attacks window closes at zero.

- Bonus riders resolve missing damage-popup targets through the linked cast card. Conjure Minor Elementals checks native Region containment rather than relying on a client's reverse token membership cache.

- Hunter's Mark's configured Utility effect can auto-apply to its single hostile marked target through existing GM effect automation. Hex retains manual effect selection.

- Managed native Region effects add/remove through the active GM, including player-triggered aura exits and deletion. Players ending concentration on Region auras delegate cleanup to a GM after ownership validation, preventing permission errors on NPC effects.

- Recurring Region damage dialogs select a connected player who owns the caster before falling back to a GM, including Regions initially placed by a GM for a player character. Region activity execution retains its original authority so routing a popup does not change effect processing.

- Retroactive Normal/Critical damage controls also recognize damage activities with the native Allow Critical setting, including Divine Smite. Save spells, healing and Graze remain excluded.

- Preserve the first Reckless attack's selected advantage through post-dialog condition processing. Use Automated Conditions' actual source counts instead of its Normal-mode boolean flags, retaining cancellation when real disadvantage is present.

## v0.6.0

### Added

- Character Inventory/Spells Add Item buttons open the native compendium browser on Items/Spells. Spell browsing preselects matching class spell lists, including multiclass characters, with editable filters. The Chat & Sheets tab includes an independent option.

- Healing and temporary HP cards share Auto Apply Damage and Healing, with client dice-animation waits, native healing caps and temporary-HP replacement, unconscious-target support, and a GM Undo Healing action. Native healing prompts reuse recorded/self targets and remembered damage/healing dialog positions; healing areas resume their roll after confirmation.

- Module compatibility reference records the Fragment of the Fallen test world's enabled modules and installed versions, distinguishing confirmed integrations from modules merely present during testing.

- The first manual Apply Effect also records Undo Effect history, including effects applied after a retroactive save correction with no previous undo.

- Manually reapplying effects after Undo Effect records a fresh application and restores the Undo Effect button, supporting repeated undo/apply cycles.

- Region effects take priority over automatic card effects. Existing matching active effects are left unchanged, and card automation defers to applicable native region effects without adding Undo ownership. Region effects and conditions inherit trigger targeting relative to the caster; hostile-only regions exclude friendlies. Existing managed region filters refresh when a scene loads.

- GM-only Undo Effect beside Undo Damage for automatically applied activity effects. Removes newly created effects, restores previously refreshed effects, preserves applications superseded by another cast, and reopens manual effect controls. Effects-only activities retain Undo Effect on their source card.

- Magic Resistance feature detection for saves against spells and features marked Magical, with an independent setting and Automated Conditions integration that preserves advantage/disadvantage cancellation.

- Independent Auto Apply Damage, Auto Apply Saved Effects, and Autoapply Status on Hit options. Save effects wait for all outcomes and client dice animations, respect each effect's On Save setting, and follow automatic damage when enabled. Attack effects apply only to hit targets through native effect application, with duplicate protection and collapsed completed trays.

- Requested saving throws display a named `---pending---` button until the local dice animation finishes. Owners and the GM can click it to reopen a canceled save prompt without stopping automatic damage.

- Automatic damage waits for visible damage and saving throw dice animations on connected clients, including players, while allowing the GM window to remain in the background.

- **GM NPC & Damage:** optional native autorolls for prompted GM-run NPC saves (player-owned NPCs stay manual), and automatic damage application for all casters after every required save resolves. Non-save attacks apply only to hit targets. Manual card interaction or application stops automation; native calculations and Undo Damage remain available.

- GM-only Undo Damage actions record actual HP and temporary HP changes from damage cards, reverse those applications, and reopen the Apply tray without rerolling.

- Separate Graze, Sap, Slow, Topple, and Vex enable/disable options beneath the overall Weapon Mastery toggle.

- **Weapon Mastery automation:** unlocked weapon masteries add attack-card actions. Sap applies on hit; Vex waits for damage dealt and tracks the exact target. Both default the next eligible attack mode and are consumed on attack. Graze creates miss-only ability-modifier damage; Slow is a non-stacking post-damage toggle; Topple prompts a Constitution save and applies a source-tracked Prone effect on failure. Push, Nick and Cleave are excluded.

- Self-origin spell/feature emanations can automatically attach to the casting token, skipping manual placement. The Regions options tab includes an independent toggle.

- Dedicated Module Options window with Regions, Targeting, Rolls & Damage, Effects, Weapon Mastery & Attack Properties, GM NPC & Damage, and Chat tabs. Existing settings are preserved; drafts save on confirmation, with GM-only world edits and per-client options.

- Spell/feature placement controls: cone origins snap to square-grid intersections; scroll rotates 15 degrees, Shift-scroll rotates 5 degrees, and Ctrl-scroll zooms. Square rotation is allowed during casting previews.

- Damage Normal/Critical toggles also support powerful critical: rolled damage dice plus their maximized bonus, preserving modifiers without rerolling.

- Normal/Critical damage hover controls with an independent setting. Standard damage dice retain original results and bonuses; added critical dice roll once and are cached. Applied damage is not reversed.

- **Shield reaction cue:** optional manual casting icon on successful attack results for owned targets with a configured Shield reaction. Native casting handles resources; applying its buff refreshes that attack against current AC.

- Retarget supports weapon and attack cards and refreshes linked attack results using current target AC, allowing reassessment after reactions such as Shield without rerolling.

- **Effect Automation:** optional automatic application of configured buffs from non-rolling Utility spells and features to Self, Allies, or friendly targeted creatures. Native effect application preserves duration, concentration, and scaling; existing matching active effects are left unchanged. Attack and Save effects use their independent automation options, while healing rolls remain manual and region effects keep their region lifecycle.

- Spell and Region Management accepts monster abilities and player features,
  including auras, alongside spells.
- Independent settings to automatically open the caster's damage dialog for
  Save activities and the attacker's damage dialog after a confirmed hit.
- Attack damage prompts wait for Dice So Nice animations to finish. Native
  critical-hit, weapon-mode, consumption, and scaling options are preserved.
- Separate remembered positions for prompted attack, save, and damage dialogs
  on each user's client.
- Retroactive ADV / NORMAL / DISADV controls for attack rolls on spell, weapon,
  and feature cards, with an independent enable/disable setting.

### Changed

- Graze automatically creates its damage card on a confirmed miss and uses the existing Auto Apply Damage setting. Undo Damage restores HP, hides the Graze card, and resets the linked attack's Damage/Graze actions; canceled cards cannot be applied again.

- Slow automatically applies after damage is dealt, like Vex; its apply/remove button remains available for corrections.

- Topple immediately posts a native saving-throw request card, which populates with the defender result when the save is processed.

- Vex defaults only the next attack against the affected target to Advantage and is consumed by that matching attack. Attacks against other creatures preserve it; target matching also works through Automated Conditions.

- Attack actions and roll borders are green, damage red, and saves blue. Optional processed-attack cleanup hides used base-card buttons and removes the base face after the attack roll exists, with a native Damage button beside Retarget on the attack result, retaining all underlying messages and result controls.

- Damage cards linked to Shield-refreshed attacks are hidden when every target is now a miss. Rolls and application history are retained; cards stay visible if any target is still hit.

- Advantage adjustment buttons for attacks and saves use 75% of the standard
  button height.
- Configured turn-only feature auras defer initial save and damage prompts to
  their Region turn events.

### Fixed

- Manual damage/healing applications always restore their Undo action, including retargeted mass healing after an undo. Native Apply records the actual recipients, refreshes linked cards, resets stale button state, and retains a harmless Undo/reopen action when HP caps prevent any change.

- Undo Damage, Undo Healing, and Undo Effect preserve the chat bottom while cards rerender and their trays expand. Reading older messages is preserved, and manual scrolling cancels the following behavior.

- Attack/save Advantage and Disadvantage corrections retain the old total until newly added dice finish animating, including player clients and Dice So Nice's immediate-chat mode. Cached dice switches stay immediate.

- Vex/Sap integrate with Automated Conditions 5e through its public runtime-rule API, preserving condition-based advantage/disadvantage and cancellation.

- Automatic damage dialogs no longer receive invalid mouse-based positions.

### Direction for the next revision

- Keep one configurable module, organized into Region management, targeting,
  and roll-control components.
- Retain independent settings for optional features. Disabled features should
  stop their gameplay behavior as well as hide their controls.
- Consider separate modules only if a component needs independent publication,
  broader system support, or separate maintenance.
- A broader module name remains a future consideration; no rename is scheduled.

Version 0.6.0 is the previous release baseline.

## v0.5.7

See [v0.5.7 release notes](RELEASE-NOTES-0.5.7.md) for the documented release changes.

## 0.5.6

### Added

- Optional Shared Activity Card Per Turn: newly affected creatures join one activity card and its existing damage cards without another damage roll. The initial cast is included when it uses the trigger's configured activity.
- Accumulated movement damage for spells such as Spike Growth. Whole movement steps add independent damage dice, with a pending card per creature and a Roll Pending Damage button.
- GM-only +/− controls for pending movement damage. Casting players can roll their pending damage through a GM-coordinated reservation; GMs can also roll.
- Token HUD concentration control: end concentration from the caster's right-click controls using D&D5e's normal workflow.
- Optional starting configurations for Hunger of Hadar, Spirit Guardians, Grease, Spike Growth, Fog Cloud, and Conjure Animals, based on Ugmul's Foundry Player's Handbook setup. Existing configurations are preserved, and new recipes start disabled for review.
- Compendium sidebar shortcut to the Region Spell Manager.
- Spell selection, Select all/Deselect all, confirmed bulk deletion, and bulk Enable/Disable controls.
- Show Enabled/Show Disabled filters that combine with spell-name search.

### Changed and fixed

- Region behaviors are attached by the active GM, allowing player casts without granting GM permissions.
- Normal Region-triggered activities run on the connected caster's client when they own the actor, with active-GM fallback. Movement tracking runs only on the active GM to avoid duplicate cards.
- Shared-card registration is stored on chat messages for initial-cast reuse across clients.
- Movement entry and continuation are counted together, preventing duplicate first-step increments. The final outward step adds no damage; earlier internal steps remain counted.
- Disabled spells display (Disabled) after their names. Selection checkboxes are independent of automation state.
- Spell search, state filters, selection, and scroll position persist through manager updates.
- The spell drop area is now a popup opened by Add New Spell Region.
- Trigger explanations use Foundry hover tooltips, with a scrollable trigger editor and no duplicate browser tooltip.
- D&D5e 6.0.6 is marked verified. The minimum remains 6.0.5; Foundry v14 remains required.

### Updating

- Restart the Foundry server after updating, then reload GM and player clients. This release enables a module socket for player movement-damage rolls.
- Keep an active GM connected for Region setup and movement tracking.
- Recast areas when changing trigger events or movement mode; existing Regions retain attached behaviors.
- Configure optional shared-card/movement modes in the manager. Existing spell configurations are not automatically rewritten.
- Starter recipes include configuration only. Users must supply matching spell activities and effects on their own items; no Player's Handbook content is bundled.

Validated with automated regression checks and user testing on Foundry v14 with D&D5e 6.0.6. Other module combinations may alter native workflows.

## 0.5.5

- Initial public package release.
- Configurable Region activity triggers, targeting, Once Per Turn, native Region Active Effects, and concentration cleanup.
- End-turn activity triggers skip tokens at 0 HP, with the dead status, or marked defeated.
