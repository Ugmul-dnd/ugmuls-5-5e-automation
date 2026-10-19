# Player’s Handbook spell-trigger audit

2026-10-18 · Installed pack 2.2.0 · 391 spells scanned

Read-only review of installed spell descriptions, activities and native effects. No runtime automation, world settings or installed pack changed. Companion JSON contains identifiers and metadata, not importable configurations or book descriptions.

73 spells are shortlisted for review or verification of existing support. The remaining 318 have no automatic turn-trigger entry proposed in this pass. This is a spell-item audit, not exhaustive testing of summoned actor activities or native expiry behavior.

## Repeat-save implementation

The nine repeat-save candidates now have built-in recipes (ten entries, with Blindness and Deafness separate). New casts register their applied native effect; existing active effects are not backfilled. Recipes are enabled by default and can be disabled or customized in the Trigger Automation Library. Existing world overrides remain intact.

Automated checks cover all ten condition mappings, turn-end timing, failed-save retention, successful-save removal after animations, no resource consumption, and suppression of initial damage. In-game validation remains required.

For a quick test, cast Hold Person, apply Paralyzed after a failed initial save, and advance past the target’s turn. Verify that a failed repeat save keeps the effect and a successful repeat save removes it after the dice finish. Then check both Blindness/Deafness choices and confirm Synaptic Static and Sunburst repeat only their saves.

## Recommended first batch

Start with **Hold Person, Hold Monster, Blinding Smite, Wrathful Smite and Slow**, one at a time. All use repeat saves without introducing new damage sequencing. Validate initial outcomes, repeat failures/successes, concentration cleanup, connected-owner/GM prompts, pending cards, and animation timing before enabling defaults.

## Implementation boundaries

- Preserve native conditions, stat changes, concentration, duration and slot scaling. Add only missing triggers.
- Distinguish save-only, damage-then-save, save-then-damage, one-time delayed damage, healing and counters.
- Preserve optional actions and GM choices. Avoid duplicate native or third-party triggers.
- Reuse pending cards, owner/GM routing, dice completion and grouped refresh.
- Keep new defaults disabled until reviewed and tested. Protect current region recipes, especially movement-based Spike Growth.

## Repeat-save candidates (9)

| Spell | Review |
| --- | --- |
| Hold Person | Repeat Wisdom save at target turn end; remove Paralyzed on success. |
| Hold Monster | Repeat Wisdom save at target turn end; remove Paralyzed on success. |
| Blinding Smite | Repeat Constitution save at target turn end; remove Blinded on success. |
| Wrathful Smite | Repeat Wisdom save at target turn end; keep initial smite save separate. |
| Slow | Repeat Wisdom save at target turn end; preserve native stat changes. |
| Blindness/Deafness | Preserve the chosen condition when registering and removing the effect. |
| Ray of Enfeeblement | Only the persistent failed-save effect gets repeat saves; preserve native changes. |
| Synaptic Static | Repeat Intelligence save only; never repeat initial damage. |
| Sunburst | Repeat Constitution save only; never repeat initial damage. |

## Existing creature triggers (2)

| Spell | Review |
| --- | --- |
| Searing Smite | Verify existing support; do not duplicate. |
| Fear | Verify existing support; do not duplicate. |

## Additional creature-trigger behavior (25)

| Spell | Review |
| --- | --- |
| Ensnaring Strike | Start-of-turn damage; escape uses an action/check, not an automatic repeat save. |
| Melf's Acid Arrow | One delayed damage event after a hit, then stop. |
| Vitriolic Sphere | One delayed damage event after an initial failed save, then stop. |
| Phantasmal Killer | Save first; recurring damage only on failure. Success ends the effect. |
| Weird | Save first; repeat damage differs from initial damage. |
| Heroism | Refresh temporary HP at turn start; needs healing support and no stacking. |
| Regenerate | Turn-start healing must be separate from initial healing. |
| Power Word Stun | No native save activity: requires a dedicated repeat-save helper. |
| Contagion | Track three successes/failures and preserve chosen ability penalty. |
| Flesh to Stone | Track counters and transition to Petrified. |
| Sleep | One repeat save, then change Incapacitated to Unconscious on failure; waking/damage can end it. |
| Confusion | Repeat save plus a separate start-of-turn behavior roll. |
| Crown of Madness | Caster upkeep and forced action choices remain decisions. |
| Bestow Curse | Only the action-denial option needs a turn-start save; success does not end the curse. |
| Blink | Random check plus return/positioning phases. |
| Compulsion | Repeat save follows compelled movement. |
| Dominate Beast | Repeat save when damaged. |
| Dominate Person | Repeat save when damaged. |
| Dominate Monster | Repeat save when damaged. |
| Compelled Duel | Conditional ending events need dedicated checks. |
| Otto's Irresistible Dance | Repeat save costs the target an action. |
| Eyebite | Requires outcome-specific review. |
| Antipathy/Sympathy | Requires outcome-specific review. |
| Befuddlement | Long-interval save, outside combat-turn timing. |
| Phantasmal Force | Conditional damage needs GM judgment. |

## Region or aura review (30)

| Spell | Review |
| --- | --- |
| Blade Barrier | Review activity mapping, area timing, targets and limits through existing region setup. |
| Cloud of Daggers | Review activity mapping, area timing, targets and limits through existing region setup. |
| Cloudkill | Review activity mapping, area timing, targets and limits through existing region setup. |
| Conjure Celestial | Review activity mapping, area timing, targets and limits through existing region setup. |
| Conjure Woodland Beings | Review activity mapping, area timing, targets and limits through existing region setup. |
| Control Water | Review activity mapping, area timing, targets and limits through existing region setup. |
| Cordon of Arrows | Review activity mapping, area timing, targets and limits through existing region setup. |
| Evard's Black Tentacles | Review activity mapping, area timing, targets and limits through existing region setup. |
| Flaming Sphere | Review activity mapping, area timing, targets and limits through existing region setup. |
| Forbiddance | Review activity mapping, area timing, targets and limits through existing region setup. |
| Guardian of Faith | Review activity mapping, area timing, targets and limits through existing region setup. |
| Incendiary Cloud | Review activity mapping, area timing, targets and limits through existing region setup. |
| Insect Plague | Review activity mapping, area timing, targets and limits through existing region setup. |
| Jallarzi's Storm of Radiance | Review activity mapping, area timing, targets and limits through existing region setup. |
| Stinking Cloud | Review activity mapping, area timing, targets and limits through existing region setup. |
| Wall of Thorns | Review activity mapping, area timing, targets and limits through existing region setup. |
| Yolande's Regal Presence | Review activity mapping, area timing, targets and limits through existing region setup. |
| Zone of Truth | Review activity mapping, area timing, targets and limits through existing region setup. |
| Web | Do not confuse restraint saves with burning-web damage. |
| Wall of Fire | One-sided wall geometry; recurring damage has no save. |
| Wall of Ice | Traversal damage applies to the frigid air remaining after a section breaks. |
| Sleet Storm | Entry/start-of-turn save can cause Prone and loss of concentration. |
| Gust of Wind | Turn-end save and forced movement; direction can change. |
| Aura of Life | Turn-start healing only for eligible allies at zero HP. |
| Aura of Vitality | Caster-turn healing requires choosing a creature. |
| Conjure Elemental | Inspect summoned actor activities, not only the spell item. |
| Prismatic Wall | Layer-specific conditions and counters. |
| Storm of Vengeance | Round-dependent phases and target selection. |
| Tsunami | Changing area and damage across turns. |
| Earthquake | Terrain events and GM choices. |

## Existing region starters (7)

| Spell | Review |
| --- | --- |
| Hunger of Hadar | Verify existing support; do not duplicate. |
| Spirit Guardians | Verify existing support; do not duplicate. |
| Moonbeam | Verify existing support; do not duplicate. |
| Grease | Verify existing support; do not duplicate. |
| Spike Growth | Verify existing support; do not duplicate. |
| Conjure Animals | Verify existing support; do not duplicate. |
| Fog Cloud | Verify existing support; do not duplicate. |

## Exclusions and limits

Expiry text alone does not establish a missing trigger: Shield, Guiding Bolt, Chill Touch and Mind Sliver are examples. Heat Metal, Witch Bolt, Spiritual Weapon and Vampiric Touch use chosen actions; do not grant free automatic uses. Summon initiative text also does not establish a missing trigger. Region entries still need individual checks for timing, frequency, targeting and native activity behavior. No candidate is production-ready solely because it appears here.

## Remaining book order

Dungeon Master’s Guide → Monster Manual (monster cards) → Ravenloft → Heroes of Faerûn → Eberron → Arcana Unleashed. Confirm installed pack names and avoid duplicate reprints on each pass.
