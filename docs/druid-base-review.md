# Base Druid review

Reviewed October 29, 2026 against the installed 2024 Player’s Handbook class items and D&D5e 6.0.6 source. This is a review only; no runtime changes.

## Best fits for this module

- **Elemental Fury: Primal Strike (7).** Add an optional damage configuration choice on a confirmed weapon or Wild Shape Beast hit, with Cold/Fire/Lightning/Thunder selection. Use the native `@scale.druid.elemental-fury` formula and critical policy. Enforce once on the Druid’s own turn, rather than once on every combatant’s turn. The native item currently offers a separate damage activity but no use pool or turn enforcement. Preserve the chosen source attack, original targets and damage grouping. Improved Elemental Fury already scales the native formula to 2d8 at 15. Confirm the feature and shared turn state survive native transformation/reversion.
- **Elemental Fury: Potent Spellcasting (7).** Add Wisdom to damage from Druid cantrips in their original damage roll. The native feature explicitly says this bonus is not automated. Scope to Druid cantrips, respecting multiclass spell identity. Do not apply it to healing, leveled spells or all cantrips indiscriminately. Improved Elemental Fury (15) also needs its +300-foot range increase for Druid cantrips whose range is at least 10 feet; preserve Self/Touch and shorter ranges.
- **Archdruid: Evergreen Wild Shape (20).** On an initiative roll, recover one native Wild Shape use only when none remain. Use active-GM authority, deduplicate the initiative event and preserve resources across transformations. The item supplies a manual recharge activity but explicitly does not automate the trigger. Nature Magician already has native resource-conversion and long-rest use tracking.
- **Wild Resurgence (5), optional guard improvements.** Native activities already exchange a spell slot for Wild Shape and a Wild Shape use for a level-1 slot. Add eligibility/turn enforcement around those activities if desired: restoring Wild Shape requires no uses remaining and is once on each of the Druid’s turns. Preserve native selection/consumption and the separate long-rest limit on restoring a spell slot; cancellation must spend nothing.
- **Wild Companion (2), optional cleanup.** Native summon activities already let the player spend a spell slot or Wild Shape use and set the familiar’s creature type to Fey. The item explicitly says it does not disappear automatically at Long Rest. Cleanup could follow the exact summon origin so unrelated familiars/pets are unaffected.

## Existing coverage

- Druidic language, Speak with Animals and class preparation/proficiency choices are supplied through advancement.
- Primal Order: Magician includes a native effect for the extra cantrip and Arcana/Nature bonus. Warden supplies its proficiency choices through advancement. No duplicate bonus implementation is needed.
- Wild Shape already has native transformation, temporary HP, duration configuration, class/mental-stat retention and short/long-rest use recovery. Keep this workflow. Duration/condition-triggered automatic reversion would require a separate lifecycle review; a configured duration alone is not evidence that reversion is automated.
- Beast Spells and equipment practicality mostly require rule handling or player/GM judgment. Avoid broad spell-blocking changes while reviewing the base class, particularly before reviewing Circle of the Moon exceptions.

## Installed content issue to verify separately

The base Wild Shape text allows CR 1/2 at Druid level 4, but its installed transform profiles offer CR 1/4 through level 5 and CR 1/2 only at levels 6–7. D&D5e filters available profiles by their level bounds. This is a source-content discrepancy, independent of the intentional attack proficiency adjustment. Circle of the Moon may replace those profiles; inspect the actor’s actual granted activity before applying a module-side correction. Do not modify the PHB module or compendium directly.

## Suggested order

Implement Primal Strike first for immediate use in Moon Druid Beast attacks, then Potent Spellcasting and its improved range, then Evergreen Wild Shape. Leave the already usable conversion activities and optional familiar cleanup for later unless testing reveals a problem.

Sources inspected locally: `dnd-players-handbook` classes pack (`phbdrdDruid00000` and its granted feature/choice items), D&D5e `Actor5e.transformInto` and transform activity profile filtering. No live Foundry tests were performed for this review.
