# Ugmuls 5.5e Automation v0.8.5 — Wizard, Cleric & Bard Features

This release expands class and subclass automation through native activities, roll configuration, chat cards, and source-tracked effects. It also adds an optional Carousel initiative prompt, Monk Uncanny Metabolism, and shared lookup improvements.

## Cleric

- **Base class and Light:** Channel Divinity targeting and Sear Undead, Divine Strike/Potent Spellcasting damage options, Improved Blessed Strikes temporary HP, Warding Flare attack corrections, and Corona of Light's attached area and lighting.
- **Arcana:** Fortifying Spell and Tenacious Spell controls use cast-time eligibility snapshots. Fortifying requires a recorded friendly spell target; Tenacious subtracts its native die from a successful enemy save while preserving the original dice.
- **Grave:** Pull of Death damage configuration, maximum spell healing for targets at 0 HP, Path to the Grave's curse and independent damage rider, and Sentinel at Death's Door before damage applies. Enhanced Necromancy adds a second target to eligible spells, and Keeper of Souls is linked to its native charge. Self-only spells retain their native range.
- **Knowledge:** Manifest Magical Knowledge appears inside consumption for eligible domain Divination spells, replacing spell-slot consumption with Channel Divinity.
- **Life:** Blessed Healer self-healing, Disciple of Life and Supreme Healing roll integration, and Preserve Life healing allocation across friendly area targets.
- **Trickery and War:** Invoke Duplicity attack advantage with the improved allied benefit, plus Guided Strike on qualifying missed attacks. Guided Strike preserves the original roll, spends Channel Divinity, and uses a Reaction when assisting another creature.

## Bard

- **Base class:** Font of Inspiration enables native Short Rest recovery; Countercharm assists eligible friendly failed Charm/Fear saves; Superior Inspiration restores Inspiration on initiative; Words of Creation validates its two-target casting option before spending resources.
- **Dance:** Tandem Footwork is available in initiative configuration, sharing one native Inspiration roll with eligible nearby allies. Leading Evasion extends the supported save/damage benefit to nearby recipients.
- **Glamour:** Beguiling Magic repeat saves, concentration-linked Mantle of Majesty and free Bonus Action Command, Commanded reminders that expire at target-turn end, automatic failure for qualifying targets Charmed by that Bard, and Unbreakable Majesty's first-attack Recoil save.
- **Lore:** Peerless Skill assists confirmed failed checks and attacks with a recorded DC/AC; a result that still fails retains the Inspiration die.
- **Spirits:** Giving Bardic Inspiration can gather spirits as individual effects, including duplicate copies. Spirits from Beyond offers Unleash Spirit and Controlled Channeling; Mystical Connection rolls its two dice together. Empowered Channeling adds native damage/healing configuration and a distinct modified Spirit Guardians half-cover area, including native free casting.
- **Moon:** Inspired Eclipse offers native invisibility and click-to-place teleportation without spending movement. Eventide extends the option to the Inspiration recipient. Lunar Vitality offers Yes / No / Free, with native Inspiration spending or Eventide's free d6, one selected healing recipient, and the Speed buff. Blessing of Moonlight modifies a specific Moonbeam casting, adds the Bard's dim-light buff, and offers independent healing for each failed save, including initial placement. Its healing supports Lunar Vitality and automatic HP application.

## Wizard

- **Evoker and Abjurer:** Sculpt Spells protection, Potent Cantrip miss/save damage, Empowered Evocation, Overchannel and backlash, Arcane Ward/Projected Ward with HP Undo, and Spell Resistance.
- **Bladesinger and Conjurer:** active-Bladesong weapon benefits and Song of Defense; Durable Summons, Focused Conjuration, Splintered Summons, and concentration-linked summon cleanup.
- **Diviner, Enchanter and Illusionist:** Portent reminders and Third Eye rest cleanup; Hypnotic Presence expiry, Instinctive Charm, recharging and Split Enchantment; and Illusory Self on eligible attacks.
- **Necromancer and Transmuter:** Undead Vitality, Grave Power, Extinguish Undead, summon compatibility, Transmuter's Stone choices, Empowered Transmutation scaling, and supported Master Transmuter actions.

## Initiative, spells, and shared workflows

- **Override initiative prompt** is enabled by default under **Rolls & Damage / Healing**. Carousel's combatant dice open native initiative configuration, preserving advantage/disadvantage, modifiers, roll visibility, and feature choices. Disable it to restore Carousel's fast roll. Carousel's files are not modified.
- **Uncanny Metabolism** appears in Monk initiative configuration when the feature is owned. Checking it activates the native feature card after initiative, restores Focus, spends its Long Rest use, and automatically rolls/applies native self-healing. Canceling initiative spends nothing.
- **Mirror Image** gains native duplicate application and a duplicate-check control that holds attack damage until resolved. A successful duplicate interception consumes one duplicate and changes the attack to a miss.
- Shared message indexes replace repeated history searches for affected movement, region, initiative, and damage-card workflows. Attack prompts use the exact published attack card rather than matching totals. Four startup recovery/setup consumers share actor/token discovery.
- Existing 32 ms chat-refresh coalescing, eight-card batches, native advantage/disadvantage cancellation, recorded targets, and Apply/Undo workflows remain in place.

## Updating and manual limits

- Restart Foundry and refresh **all GM and player clients** after installing. Use fresh casts/initiative rolls to test the new options; past cards do not gain new cast-time eligibility.
- Keep an active GM connected for shared resource, effect, and HP operations.
- Compatibility remains **Foundry VTT 14**, **D&D5e 6.0.5 minimum**, verified with **6.0.6**. Required modules remain **Automated Conditions 5e** and **Dice So Nice**. Carousel is optional.
- Matching official source items, activities, effects, and scaling are required. The module does not bundle book content; imported/custom items may need configuration.
- Features outside the described workflows remain native or manual. Examples include Command's actual instruction, Grave Return to Life cantrip handling, costly material components per Enhanced Necromancy recipient, Trickery summon movement/Healing Illusion, and narrative Master Transmuter outcomes. These additions do not claim every class rule is automated.

## Release validation

All **354 local regression test files passed**. All **304 runtime JavaScript files passed syntax checks**, with manifest files and relative imports verified. The release ZIP is checked against source hashes, includes these notes, and excludes local tests, tools, Git data, and state.

Assets are **packaged locally, not published**. User-confirmed development checks are separate from automated tests; this preparation does not constitute a new complete Foundry play-through. Lookup/startup improvements have synthetic work-count coverage, with no claim of measured in-game frame-rate or server timing gains. See [CHANGELOG.md](CHANGELOG.md) for detailed changes.
