# Ugmuls 5.5e Automation

Configurable spell regions and combat assistance for D&D5e in Foundry Virtual Tabletop. Automate routine steps while keeping chat-card controls available for manual decisions and corrections.

**[Visit the module website for information and features](https://ugmul-dnd.com/foundry).**

## Supported content

Automations are developed and tested using the official Foundry **[Player's Handbook (2024)](https://foundryvtt.com/packages/dnd-players-handbook)** and **Monster Manual** content. Additional class features use matching official Eberron, Heroes of Faerûn, Ravenloft: The Horrors Within, and Arcana Unleashed content. Only the features you use require their associated books.

Most features rely on the spells, class features, activities, chat cards, names, identifiers, and associated Active Effects supplied by that content. Having the expected name alone may not be enough if the item's activities or effects are configured differently.

Some features may work with content from **D&D Beyond Importer**, but imported content has **not been tested**. Imported or homebrew items may need their names, activities, damage formulas, or effects adjusted to match the expected setup. This module does not include the official book content.

## Version 0.8.3

Expanded Warlock, Artificer and Druid support brings transformations, rest choices, companion actions and subclass features into native chat cards. Optional reactive automation pauses damage and effects when usable roll adjustments are available, while preserving manual Apply and Undo. See [0.8.3 release notes](RELEASE-NOTES-0.8.3.md) for highlights and updating instructions.

## Main features

- **Pending casts and safe cancellation:** show spell/feature preparation immediately, keep attack cards visible through dice animation, and refund pre-roll canceled casts. Target checks respect native upcasting and partial multi-target groups.
- **Concentration assistance:** prompt connected owners or the GM for damage-triggered concentration saves, with independent prompt and automatic-break settings. Failed checks end recorded concentration after dice animations finish.

- **Creature effects and monster features:** built-in trigger recipes with local overrides, repeat saves, optional escape actions, recurring damage, wounds, swallowing and source-specific conditions. Monster auras start automatically and are hidden from players by default. Complex choices and documented special cases remain table-managed.
- **Inactive-effect cleanup:** clear inactive applied effects after combat or from the actor window menu while preserving disabled class/item features and active effects.
- **Spell and feature regions:** configure entry, movement, and turn triggers; target filters; region conditions and effects; self-attached emanations; and concentration cleanup.
- **Targeting and saving throws:** confirm area targets, retarget attack cards, prompt token owners for saves, and let a GM take over a pending save. Optional automatic saves for GM-run NPCs leave player-owned NPCs manual.
- **Damage, healing, and effects:** optional roll prompts and automatic application, with GM Undo Damage, Undo Healing, and Undo Effect controls. Applied damage locks retroactive roll adjustments until it is undone.
- **Attack assistance:** retroactive Advantage/Normal/Disadvantage and Normal/Critical controls, Shield assistance, Reckless Attack, Savage Attacker, Sneak Attack, and combat reaction, bonus-action, and spell-slot tracking.
- **Bard assistance:** source-tracked Bardic Inspiration, Cutting Words, Peerless Skill, and Valor Combat Inspiration for initial damage and reaction defense.
- **Unified Paladin auras:** one attached region combines supported passive class/oath benefits, grows with Paladin level, and applies only changed buffs. Includes Genie resistance selection, overlapping Protection choice and Glory’s lingering speed benefit. Disable old Aura Effects Paladin emitters before enabling this replacement. See [Paladin aura setup](docs/paladin-auras.md).
- **Paladin oath features:** Genie Elemental Smite and Rebuke; Ancients Nature’s Wrath repeat saves; Devotion Sacred Weapon, Smite of Protection and Holy Nimbus; Vengeance Vow of Enmity and Avenging Angel. See the [release notes](RELEASE-NOTES-0.8.1.md) for controls and manual-rule limits.
- **Artificer assistance:** Flash of Genius on failed checks/saves, destructive Arcane Jolt using the Artificer’s resources for a linked Steel Defender, and optional Arcane Firearm spell damage.
- **Barbarian assistance:** Zealot Divine Fury, Fanatical Focus, Zealous Presence, and Brutal Strike with improved effect choices, native effects, Sundered attack bonuses, and Staggered save disadvantage.
- **Unarmed combat:** Stunning Strike with native saves and Undo support; Grapple / Prone options on action-based unarmed hits, independent saving throws using the target’s better save, and Grappler’s once-per-turn damage benefit and source-specific attack advantage.
- **Select several spells from the sheet:** Add Spell opens the native compendium with the character’s class lists preselected and a selection panel. Check spells and confirm once to add them without dragging; existing spells are skipped and new leveled spells start unprepared.
- **Load class spells from the sheet:** Spell New/Add buttons offer full-list preparation casters a source-filtered missing-spell loader. Only currently supported spell levels are added, unprepared; existing spells remain unchanged.
- **Guided PC creation:** Create Player in Actors walks through level-one setup, Standard Array / point buy, native source-filtered class/background/species advancement, starting equipment or gold, class cantrips/spells and preparation, and review. Close and resume from Create Player or the PC’s Actors right-click menu; token artwork stays manual.
- **Great Weapon feats:** Great Weapon Fighting applies a minimum of 3 to qualifying two-handed melee attack damage dice. Great Weapon Master offers proficiency-bonus damage on Heavy-weapon Attack-action hits on your turn; Hew remains manual.
- **Battle Master maneuvers:** Precision Attack adds the current Superiority Die to missed attacks; Trip Attack, Distracting Strike, Menacing Attack, Goading Attack, Maneuvering Attack, and Pushing Attack join damage Configuration with shared resource spending, one maneuver per attack, saves/effects, and Undo support. Relentless offers a free d8 once per active combat turn, shared with Precision Attack. Parry reduces incoming single-target melee damage from its card, spending a Reaction and the current Superiority Die.
- **Bonus damage riders:** Hex, Hunter's Mark, and Conjure Minor Elementals add eligible bonus damage to the existing damage card. Class riders include Divine Smite, Eldritch Smite, Hunter's Prey, and Frenzy. The Smite selector also offers prepared 2024 Smite spells: the selected spell adds its own damage to the weapon roll. Only Smites requiring a save create a separate save card; effects apply on failure, or directly when no save is needed. Target-dependent riders currently support single-target damage cards.
- **Sorcerer assistance:** Innate Sorcery attack advantage, cast-time Transmuted/Heightened/Careful Spell, and Empowered/Seeking reroll actions with Sorcery Point consumption and Metamagic card tags.
- **Multiple spell attacks:** Eldritch Blast and Scorching Ray offer a remaining-attacks window so users can choose targets between shots without casting or spending a slot again.
- **Weapon masteries:** assistance for Graze, Sap, Slow, Topple, Vex, and Cleave, with individual enable/disable options. Cleave offers a separate chat-card attack once per active combat turn; choose one different target manually. It shares its use across Cleave weapons and removes only a positive ability modifier from damage. Distance/reach decisions and Undo after later corrections to the original hit remain manual. Push and Nick are not automated.
- **Interface conveniences:** compact chat cards, remembered roll-popup positions, chat scrolling improvements, and character-sheet Add Item buttons that open the matching compendium browser tab.

Use the module's tabbed options interface to enable the features that suit your table. The Automations section groups options into Unique Classes, Weapon Masteries, Feats, Common, and Spells. Automatic damage and effect application are optional; manual card controls remain available.

Aura emanations default to **Grid Shaped**. Match scene grid spacing and distance per square to the map. Testing uses alternating **1–2–1 diagonals**; other diagonal rules are unverified. Paladin aura outlines appear only on the Regions layer.

## Compatibility

| Component | Support |
| --- | --- |
| Foundry Virtual Tabletop | v14; tested on build 369 |
| Dungeons & Dragons Fifth Edition system | 6.0.5 minimum; tested with 6.0.6 |
| Official Player's Handbook (2024) and Monster Manual | Content used to develop and test the corresponding automations |
| D&D Beyond Importer content | May work, but has not been tested |

An **active GM must be connected** for GM-managed region effects, NPC automation, and other operations affecting actors a player does not own.

### Required modules

- **Dice So Nice!** — roll prompts and automatic application coordinate with dice animations.
- **Automated Conditions 5e** — integrates recommended advantage/disadvantage for supported features and preserves cancellation.
Both modules must be installed and enabled alongside Ugmuls 5.5e Automation. Foundry’s dependency checks list them as required.

### Optional module integrations

- **Tidy 5e Sheets** — supported Add Item controls open the compendium browser, alongside the standard D&D5e character sheet.

See [Module Compatibility and Test Setup](COMPATIBLE-MODULES.md) for the recorded testing environment. Modules listed there as enabled are not all individually certified compatible.

## Installation and updates

Install through Foundry's module browser, or paste this manifest URL into **Install Module → Manifest URL**:

```text
https://github.com/Ugmul-dnd/ugmuls-5-5e-automation/releases/latest/download/module.json
```

Install and enable **Automated Conditions 5e** and **Dice So Nice!**, then enable **Ugmuls 5.5e Automation** in your D&D5e world's **Manage Modules**, then configure its options in Module Settings.

After updating, **restart Foundry and hard-refresh connected browsers** to load the current scripts.

## Help and release history

- [Module information and features](https://ugmul-dnd.com/foundry)
- [Report a bug](https://github.com/Ugmul-dnd/ugmuls-5-5e-automation/issues)
- [Changelog](CHANGELOG.md)
- [Region spell library](STARTER-SPELLS.md)

### Creature effect triggers

The **Trigger Automation Library** includes supported spell and monster recipes, including Searing Smite. Its Seared effect keeps the native book data and gains the missing turn-start damage/save sequence. Damage uses the original cast level, followed by a Constitution save at the recorded DC; success removes Seared after animations. The connected caster owner receives the damage prompt, with active-GM fallback. Monster saves use the existing NPC save setting. Damage application follows existing automatic/manual damage settings. Removing, disabling, or expiring Seared stops future triggers.

Open **Module Options → Automations → Spells → Creature Effect Trigger Library**, or the module’s Trigger Automation Library settings menu. The library lists entries in a table. Choose **View/Edit** to open an entry in its own window. Use **Add New Effect** to create a world entry from a dropped spell or spell UUID. In View/Edit, **Choose Source** opens the same separate source picker to populate effect/activity dropdowns. Information buttons explain each section, and a preview summarizes the sequence. Native cast-level damage is the default; Custom damage reveals an optional fixed-formula override. Choose None to skip the saving throw. The GM can enable/disable the entry, choose turn start/end, match customized effect/activity names, override the damage formula, and restore defaults. World overrides survive module updates. Region recipes now use a module-owned library with local overrides; movement processing is preserved. Newly applied supported effects are registered; cast Searing Smite again to test effects created before this update.

**Fear:** The built-in entry adds its conditional end-of-turn Wisdom save without damage. The active GM confirms loss of line of sight on the repeat-save card before a roll is requested; if the creature can still see the caster, skip that save. Successful saves remove that creature’s native Fear effect after animations. The caster’s concentration and other affected creatures are preserved. Dropping held objects, taking Dash, and choosing the safest route remain table decisions. Apply a fresh Fear effect after refreshing clients to register its triggers.

**Targeting area lifetime:** Fear’s library entry defaults to **Remove targeting area at caster turn end**. Its cone is only a targeting aid; concentration, native duration, and creature effects continue. This uses the existing **Remove Instantaneous Areas at Turn End** option in active combat. Choose **Use spell duration** in View/Edit to disable the override. Regions configured with ongoing triggers or effects remain protected. The override is tracked when a new Region is created.

### Region spell library

Built-in Region recipes are included automatically. Local changes are saved as world overrides, and custom entries remain separate. The manager shows each entry’s source and offers Reset to Default for built-ins. Existing tables migrate on the next GM load with their original settings and a backup preserved. See [Region spell library](STARTER-SPELLS.md) for coverage and migration details.
