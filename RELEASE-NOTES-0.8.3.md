# Ugmuls 5.5e Automation v0.8.3 — Warlocks, Artificers, Druids & Reactive Combat

This release expands class support and makes automatic damage and effects cooperate with reactions and roll corrections. Native chat cards retain manual Apply, correction and Undo controls.

## Reactive damage and effects

- New opt-in **Automate Damage and Effects with Reactive Logic** checks usable reactions and adjustments such as Shield, Flash of Genius, Cosmic Omen, Precision Attack and Empowered Spell. An available option ends that automatic attempt without polling or a reaction timer. A completed adjustment checks the linked workflow again; the GM can also apply damage manually.
- Damaging attacks apply their configured on-hit effects when damage is applied, rather than immediately after the attack roll. Manual damage Apply can restore undone attack effects; reactive workflows also handle native save effects according to recorded outcomes.
- Shield corrections revalidate hits before HP changes. Cards with applied damage remain available for Undo. A miss corrected to a hit clears unapplied Graze damage and opens normal hit damage instead.
- Guiding Bolt and Faerie Fire integrate next-attack/outlined Advantage with AC5E and normal disadvantage cancellation. Flash of Genius excludes hostile and neutral recipients.

## Warlock

- Expanded pact and patron support includes Lifedrinker damage and Hit Die healing, familiar damage choices and reaction resistance, Psychic Spells choices, Eldritch Hex, Create Thrall and linked summon support.
- Archfey teleport follow-ups gain departure/arrival targeting and native healing/save actions. Celestial features gain damage bonuses, rest temporary HP choices and Searing Vengeance targeting. Thought Shield and Beguiling Defenses gain recorded damage follow-through.
- Fiend features include Dark One’s Blessing triggers, Dark One’s Own Luck roll adjustments and rest-based Fiendish Resilience selection.
- Vestige Semblance of Life uses the scaled summon form and restores the original actor when it ends. Undead support links Superior Dread, adds Frightful Avatar with source-turn expiry, and integrates Grave Touched damage choices and resistance bypass.

## Artificer

- Spell-Storing Item gains a Long Rest/manual preparation wizard: select an on-map recipient, eligible item and spell. The active GM handles storage on another party member’s inventory.
- Experimental Elixir gains native batch rolls, choice on a 6 and party distribution, with unused generated bottles cleared at the next Long Rest. Alchemical Savant integrates into damage/healing rolls; Alchemical Eruption offers its native follow-up damage.
- Armorer attacks retain Intelligence damage and Improved Arsenal bonuses; Guardian Thunder Pulse gains linked effects and expiry.
- Steel Defender Deflect Attack appears on the attack card, adjusts disadvantage and hit results, and offers eligible Improved Deflection damage. Linked same-turn companions without separate initiative recover resources and expire effects with their owner.
- Cartographer Guided Precision integrates into qualifying Faerie Fire damage. Reanimator summons offer modification choices and Improved Reanimation damage; Life Transfer handles player requests, centered Death Burst targeting and an HP-transfer summary.

## Druid

- Primal Strike and Potent Spellcasting integrate labeled bonuses into damage configuration. Wild Shape confirms directly after beast selection; Beast Spells preserves prepared spell access independently of Moon spells, and concentration begun while transformed survives reversion.
- Moon gains remembered Lunar Radiance choices, Lunar Form damage and Moonlight Step next-attack Advantage.
- Land gains Long Rest land/spell/resistance selection, budgeted Natural Recovery slot choices, friendly Nature’s Sanctuary and separate Land’s Aid save/damage and healing targets.
- Sea gains recipient selection for Wrath of the Sea/Oceanic Gift, shared initial target confirmation and owner/GM turn-start bonus-action cards, with native Stormborn benefits.
- Stars gains Starry Form selection, Archer actions, targeted Healing Chalice rolls, Twinkling changes and Full of Stars support. Cosmic Omen rolls after Long Rest and offers applicable Weal/Woe actions using card-time range/disposition snapshots, available resources and reactions. Superseded forms are deleted rather than accumulating inactive copies.

## Spells and shared workflow

- Conjure Animals places an attached Region and shares recorded saves/damage across eligible targets in a turn. Pack movement, entry and end-turn triggers preserve existing dice; successful saves deal no damage.
- Conjure Elemental tracks restrained targets for repeat saves and damage. Acid Arrow follow-up damage recognizes current native content.
- Broader summon combat enrollment, native regeneration handling, targeted card refreshes and animation completion handling support the expanded workflows. Stars/Chalice and Conjure Elemental hot paths received focused improvements.

## Updating and compatibility

- Refresh GM and player clients after installation. Keep an active GM connected for managed operations; use fresh casts/effects when checking changed workflows.
- Foundry VTT **14**; D&D5e **6.0.5 minimum**, verified configuration **6.0.6**. Required modules remain **Automated Conditions 5e** and **Dice So Nice**. This release adds no required animation module.
- Features use matching official source activities/effects; book content is not bundled. Imported/homebrew versions may need adjustments. Existing local automation-library overrides remain in control.
- Use Grid Shaped emanations and scene grid distances that match the map. Choice-heavy mechanics and deferred features remain manual; Reanimator Life Jolt and other unimplemented modification procs are not included.

See [CHANGELOG.md](CHANGELOG.md) and the feature guides in docs/ for details.

## Release validation

All **266 local regression test files passed**, and all **218 runtime JavaScript files passed syntax checks**. Manifest assets and relative imports were verified. The ZIP is checked against source file hashes and excludes tests, tools, local state and Git data. Assets are prepared locally; publishing is a separate step. In-game checks reported during development were user-confirmed; this release preparation did not perform a new Foundry play-through.
