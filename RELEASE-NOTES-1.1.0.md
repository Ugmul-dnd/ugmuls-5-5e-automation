# Ugmuls 5.5e Automation v1.1.0

This release combines attacks, saving throws, damage and healing into clearer grouped cards, and updates class automation for Player’s Handbook 3.0.0.

## Requirements

- **D&D5e 6.1.0 only.** Minimum, verified and maximum system versions are all 6.1.0. Previous system versions are incompatible with this release.
- **Foundry VTT 14**, verified build **14.370**.
- **Automated Conditions 5e** and **Dice So Nice!** must be installed and enabled.
- PHB class compatibility targets the official **Player’s Handbook (2024) version 3.0.0**. Other books are needed only for their corresponding features; official content is not included.
- Keep an active GM connected for shared resource, effect and HP operations.

## Highlights

- **Grouped combat cards:** keep recorded attacks or saves, damage, effects and Apply/Undo controls together. Spell attacks retain separate beam/target identities; Flurry attacks retain their numbering.
- **Grouped healing:** keep healing and temporary HP with their recorded recipients and application history. Self healing stays on the caster, and Chalice and Improved Potent Spellcasting follow-ups have compact controls.
- **Compact reaction controls:** feature icons stay together near application controls. Hover for their purpose; Flash of Genius identifies the creature whose failed save or check it adjusts.
- **PHB 3.0.0 class connections:** reconnect moved activities, native formulas and level-gated upgrades for Overchannel, Starry Form, Warding Flare, Channel Divinity/Sear Undead, Divine/Primal Strike, Deflect Attacks/Energy, Monk/Mercy features, Ranger damage riders, and Wrath of the Sea.
- **Native feature ownership:** retire overlapping Font of Inspiration and Warding Flare recovery patches, Potent Spellcasting damage bonuses, Disciple of Life, Elemental Affinity, Innate Sorcery outgoing Advantage, Trance of Order’s minimum-roll helper, and Reckless Attack’s outgoing Advantage override. Native item data supplies those benefits; module workflow assistance remains where applicable.
- **Circle of the Land:** choose land in our Long Rest dropdown. Updated native land features provide their prepared spell grants and level-gated Nature’s Ward resistance.
- **Brutal Strike:** apply effects from their updated native parent and show the selected blows as tags with short hover descriptions.
- **Clearer options:** all 209 class options have brief descriptions focused on what the automation does.

## Updating

1. Back up your world and confirm D&D5e is **6.1.0** before installing this release.
2. Update the official PHB to **3.0.0** when using its class features. Updating the book does not automatically replace older items already owned by characters.
3. Review and update owned features through your usual character-content workflow. This release does not perform a general character migration. Some older layouts remain supported, but retired helper behavior requires the updated native items.
4. Refresh every GM and player client. Use fresh casts and rolls when testing controls whose eligibility is recorded at roll time.
5. Review the grouped attack/save/healing options and your existing automatic-application settings in Module Options.

## Verification

- **Automated:** all **385 isolated test files** passed with no failures. Syntax checks passed for **317 runtime scripts**; manifest assets and relative imports were validated. The targeted release-feature checks also passed.
- **User-confirmed gameplay:** the Long Rest land selector and Brutal Strike changes worked in-game. The user confirmed the earlier class/card checklist was complete and confirmed the revised Flash of Genius tooltips.
- These results do not establish exhaustive in-game coverage of every class, actor layout or third-party module. No before/after performance measurement is claimed.
- Installation/update and smoke testing of the final release ZIP in a separate world remain pending.

## Package

The runtime ZIP contains the manifest, scripts, styles, license and these release notes. Tests, tools, guides, changelog, repository instructions and Git data are excluded. This release is prepared locally; publication is a separate step.
