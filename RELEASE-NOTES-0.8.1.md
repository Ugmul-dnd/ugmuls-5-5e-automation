# Ugmuls 5.5e Automation v0.8.1 — Artificer & Paladin Automation

Bring more class features into the same spell, attack and damage workflow. This update adds Artificer assistance, a unified Paladin aura and tested oath powers, alongside easier spell selection and fewer unnecessary chat updates.

## Paladin auras and oath powers

- One attached aura combines supported Protection, Courage and oath benefits, grows with Paladin level, avoids overlapping Protection stacking and identifies the granting Paladin. Configure the source and preferred Protection provider from the actor window. Outlines appear only on the Regions layer.
- Genie: choose one Elemental Shielding resistance from its card and replace it at any time. Divine Smite damage cards offer Elemental Smite choices, with Channel Divinity spending, secondary-target selection and escape/save handling. Elemental Rebuke offers a compact element chooser, tracked Reaction, visible half-damage selection and a return save/damage workflow routed to the clicking player or GM.
- Ancients: Nature’s Wrath prompts its end-of-turn Strength save and removes the originating restraint on success, without spending another action or use.
- Devotion: activate Sacred Weapon in melee attack configuration, with native enchantment and reversible token lighting. Smite of Protection grants half cover through the existing aura until the caster’s next turn starts. Holy Nimbus adds enemy turn-start Radiant damage, source-aware Holy Ward and bright illumination.
- Vengeance: activate Vow of Enmity from weapon/unarmed attack configuration, apply target-specific Advantage and transfer freely after the mark reaches 0 HP while preserving duration. Avenging Angel retains native flight and adds enemy turn-start fear saves, source-specific attack Advantage and damage-triggered fear cleanup.
- Sacred Weapon and Vow activations/transfers announce the change to the table. Temporary effects provide controls for ending the supported powers.

## Artificer assistance

- Flash of Genius buttons on failed checks/saves add the Intelligence bonus, consume a feature use and track a combat Reaction, with ownership and range checks.
- Optional destructive Arcane Jolt appears in damage configuration. The Artificer and natively linked Steel Defender share the Artificer’s uses and once-per-turn limit.
- Optional Arcane Firearm adds its typed 1d8 to one eligible Artificer spell damage roll per cast, including a type chooser for mixed damage.

## Faster setup and combat flow

- Add Spell supports class-filtered multi-selection and batch adding without drag/drop, on standard and Tidy sheets.
- Smite spells and cast levels have separate selectors. The level is blank/disabled until a spell is chosen, then defaults to Free or the lowest qualifying slot, with upcasting available.
- Shared helper preparation and fewer movement-driven reaction-card redraws reduce repeated work while preserving explicit save, damage, effect and animation order.
- Fix confirmed-critical damage recommendations, monster area Targeted displays, missing Revenant Vengeful Glare fear, and false prepared-spell alerts from Smite slot spending under Monk’s Combat Details.

## Setup and integrations

- Restart Foundry and refresh GM/player clients. Apply fresh effects or recast changed features when testing; local library overrides are preserved. Keep an active GM connected for managed operations.
- Disable old Aura Effects Paladin emitters before using the unified replacement to avoid duplicate buffs.
- Generated aura emanations default to **Grid Shaped**; existing module-owned emanations migrate once while preserving attachment, radius and position. Match scene grid size/spacing and distance per square to the map. Tested with alternating **1–2–1 diagonal movement**; other diagonal rules remain unverified.
- Smite of Protection uses native half-cover status with Simple Cover 5e/AC5e handling cover and bypass features such as Sharpshooter. The module does not calculate cover geometry itself.
- Compatibility remains Foundry VTT 14 and D&D5e 6.0.5 minimum, with recorded testing on 6.0.6. Features require matching installed content: Player’s Handbook/Monster Manual, Eberron for the Artificer features, and Heroes of Faerûn for the Genie oath. Official book content is not bundled.

## Table-managed rules

Arcane Jolt healing, Steel Defender reactions, Genie teleports/forced movement, Noble Scion/Minor Wish, Elder Champion, Soul of Vengeance/Relentless Avenger, Inspiring Smite allocation and Living Legend remain manual. Holy Nimbus provides illumination and sunlight metadata; specialized creature sunlight interactions may still need table handling. Automatic damage and effect application remain optional.

See [CHANGELOG.md](CHANGELOG.md) for detailed changes and the feature guides in docs/ for setup.

Validation: all 127 local regression test files passed; all runtime JavaScript syntax checks passed. The release archive was checked for version 0.8.1, complete runtime scripts and feature guides, and exclusion of tests/tools/Git data.
