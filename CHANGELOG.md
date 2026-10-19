# Changelog

## Unreleased

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
