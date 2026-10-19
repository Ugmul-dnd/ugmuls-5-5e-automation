# Ugmuls 5.5e Automation v0.8.0 — Spell & Monster Effect Automation

A major expansion of spell and monster automation: recurring effects, escape actions and auras now work through the familiar Foundry chat-card workflow, with manual controls and source-specific cleanup.

## Spell and effect libraries

- Built-in Creature Effect Triggers and Region recipes ship with the module. Edit local overrides, restore defaults, search the libraries and create new creature triggers with source selection or drag/drop.
- Expanded Player’s Handbook support includes recurring damage/healing, delayed damage, repeat saves, optional action escapes, Blink and targeting-only area cleanup.
- More spell Regions cover damage areas, walls, clouds and emanations. Flaming Sphere and Guardian of Faith use token-attached areas; Guardian tracks its damage pool.
- Native item effects and stat changes remain intact. Libraries provide configuration and tracking; matching official content must be installed separately.

## Monster Manual automation

- End-of-turn repeat saves for supported poison, paralysis, fear, charm, incapacitation and unconsciousness effects.
- Optional escape actions using the originating monster’s DC, native skill choices and special Disadvantage where applicable. The person clicking handles both skill selection and rolling.
- Automatic monster auras, hidden from players by default, with supported save-immunity tracking and local visibility controls.
- Recurring damage on the correct monster or victim turn, including attachments, grapples, smothering, whirlwind and swallowed creatures.
- Infernal wounds with direct HP loss, Apply/Undo, Medicine treatment and closure from spell healing.
- Swallow replaces the same monster’s grapple, retains native swallowed conditions and excludes the victim from its captor’s external aura.

## Combat and usability

- Cleave attacks launch from the original hit’s chat card, require a different target and preserve weapon/Rage bonuses while omitting a positive ability modifier from damage.
- Prepared Smite spells appear in weapon damage Configuration. Their initial damage joins the weapon roll; save-based Smites create the necessary save card and effects follow the outcome.
- Clear inactive effects from the actor window menu or automatically after combat, preserving disabled class/item features and active effects.
- Improved turn performance, concentration replacement, target displays, save/effect application, duplicate-card guards and Dice So Nice timing.

## Table-managed rules

This release does not automate every sentence of every feature. Movement, distance/capacity decisions, regurgitation thresholds, random/choice-based outcomes, staged effects and counters remain manual. Rug damage sharing, Gulthias maximum-HP/healing transfers and the extra break/immunity rules for the final Harpy/Chasme repeat-save batch also remain manual. Automatic damage and effect application are optional.

## Updating

- Restart Foundry after installing, then reload GM and player clients.
- Use fresh effect applications and recast areas when testing changed triggers. Existing local library overrides and existing attached Region behaviors are preserved.
- Keep an active GM connected for GM-managed operations.
- Tested on Foundry VTT v14 build 369 and D&D5e 6.0.6; D&D5e minimum remains 6.0.5.
- Developed/tested with official Foundry Player’s Handbook (2024) and Monster Manual content. Imported/homebrew content may need matching activities and effects.

Validation: 106 automated regression test files pass, with user-confirmed in-game tests across the spell and monster batches. See CHANGELOG.md for detailed changes.
