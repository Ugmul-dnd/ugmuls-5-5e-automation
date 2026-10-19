# Player’s Handbook trigger progress

Cross-checked against current trigger defaults, Blink handler, region starter recipes, changelog and user feedback on 2026-10-18. No runtime code or world settings changed by this review.

## Counts and scope

- 391 spell items were scanned originally.
- Original review shortlist: 73 spells. Tasha’s Hideous Laughter was added during implementation, bringing the tracked review set to 74.
- 24 distinct spells have creature-trigger handling or included region starter recipes: 17 creature-trigger spells and 7 region starters.
- 50 items from the original shortlist still need implementation or further design review: 20 creature effects and 30 region/aura candidates. These are review candidates, not all necessarily missing automation.
- Grapple is implemented separately and excluded from spell counts.
- This is a follow-up-trigger checklist, not a count of all supported spells or a claim that every spell item requires automation. Other existing spell helpers are listed below.

## Implemented creature-trigger spells (17)

- Blink
- Dominate Beast
- Dominate Monster
- Dominate Person
- Otto's Irresistible Dance
- Tasha's Hideous Laughter
- Blinding Smite
- Blindness/Deafness
- Hold Monster
- Hold Person
- Ray of Enfeeblement
- Slow
- Sunburst
- Synaptic Static
- Wrathful Smite
- Searing Smite
- Fear

Blindness/Deafness has two effect entries. Repeat saves preserve native effects and initial damage is not repeated. Damage events, optional action cards and Blink use their respective specialized handling.

## Included region starter recipes (7)

- Hunger of Hadar
- Spirit Guardians
- Moonbeam
- Grease
- Spike Growth
- Fog Cloud
- Conjure Animals

Starter presence does not establish that a world has enabled or configured the recipe. New starters are disabled until reviewed. Existing world customizations are not overwritten. Recipe activity names and all trigger details still need validation against the installed spell.

## Validation status

User explicitly confirmed Searing Smite’s recurring damage/save sequence, Fear’s initial outcomes and repeat saves/area cleanup, Moonbeam, and Spirit Guardians’ delayed-first-damage flow. The new Grapple escape proc was also confirmed, outside the spell count. Blink has received in-game feedback on its Ethereal categorization, but its complete timing/expiry checklist has not been explicitly signed off.

The nine new repeat-save spells, Dominate damage saves, Otto’s optional action save and Hideous Laughter have automated regression coverage; comprehensive in-game confirmation has not been recorded for each. Latest full suite: 72 test files passed before the final temporary-effect display change; Blink’s focused checks and syntax check passed after that change. No live world settings were inspected in this review.

## Remaining creature-effect review (20)

| Spell | Missing behavior / review |
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
| Compulsion | Repeat save follows compelled movement. |
| Compelled Duel | Conditional ending events need dedicated checks. |
| Eyebite | Requires outcome-specific review. |
| Antipathy/Sympathy | Requires outcome-specific review. |
| Befuddlement | Long-interval save, outside combat-turn timing. |
| Phantasmal Force | Conditional damage needs GM judgment. |

## Remaining region/aura review (30)

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

## Existing helpers outside this trigger count

Shield reactions; Hex and Hunter’s Mark damage riders; Conjure Minor Elementals damage rider; Eldritch Blast and Scorching Ray remaining-attack tracking; prepared Smite selection, combined weapon damage, initial saves/effects. Shared concentration checks, target validation, pending cards, corrections and Dice So Nice handling serve many additional spells. These helpers are not evidence that every follow-up of every supported spell is automated.

## Suggested order

1. Finish in-game checks for the new repeat saves and damage/action cases.
2. Power Word Stun: a dedicated repeat-save helper; no damage or counters.
3. Melf’s Acid Arrow and Vitriolic Sphere: reusable one-shot delayed-damage handling.
4. Phantasmal Killer and Weird: save first, then damage on failure.
5. Escape checks: Ensnaring Strike, Entangle, Web and Evard’s Black Tentacles. Entangle was outside the original shortlist; add it to the next review pass. Use Athletics checks rather than silently substituting saving throws.
6. Healing/temporary HP, counters and multi-phase spells; then grouped region batches with individual rule checks.

Crown of Madness can be split into a repeat-save entry plus manual upkeep; Confusion can separate repeat saves from its behavior roll. Their full workflows remain in review.
