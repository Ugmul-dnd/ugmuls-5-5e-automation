# Monster Manual damage auras

Three module Region Library defaults cover ten native monsters. All attached Regions default to GM-only visibility. The library's Hide Region from Players checkbox and enabled setting remain local overrides.

| Aura | Monsters | Timing | Targets |
| --- | --- | --- | --- |
| Heat Aura | Remorhaz, Young Remorhaz | End of originating monster's turn | All eligible creatures in emanation except source |
| Flame Aura | Brazen Gorgon | End of originating monster's turn | All eligible creatures in emanation except source |
| Fire Aura | Azer Pyromancer, Azer Sentinel, Balor, Fire Elemental, Salamander, Salamander Fire Snake, Salamander Inferno Master | End of originating monster's turn | GM chooses affected creatures from those inside |

The active GM creates a native token-attached emanation on scene load and token creation. Radius and damage come from each actual actor's native activity; Large/Huge tokens use their token footprint as the base. Native attachment follows movement and handles token-deletion cleanup. No concentration or instantaneous spell duration is attached to the passive Region. Disabling the library default or removing the feature removes its Regions when synchronized. Visibility changes synchronize on settings updates and scene load.

Turn processing looks only at the outgoing combatant's token, not every aura on every creature's turn. The active GM stamps each Region once per completed turn. It gathers current Region occupants, excludes the source/dead/ineligible targets, and asks the GM to choose targets for choice-based auras. Cancel skips the turn. After choice, targets, source state and library enabled status are checked again. Azer traits explicitly stop while Incapacitated, including Stunned/Paralyzed/Unconscious/Petrified; other aura features retain their own rules. Dead/defeated sources do not trigger.

One disposable native damage activity creates a card and opens the GM damage dialog. It consumes no resources, places no extra template, applies no invented effects, and suppresses animation recognition. Recorded targets remain on the usage/damage cards, which default to Target display. Existing damage automation and Dice So Nice timing handle application. Burning creatures/objects from Fire Elemental remain manual; no new burning or immunity tracker is added.

Validation: ten native fixture entries, source radius/damage preservation, token attachment/level data, GM-only default, opt-in visibility, same-disposition and enemy targets, self exclusion, choice/cancel, Azer suppression, disable/remove cleanup, duplicate hooks, source-end timing, active-GM guard and card target display. In-game checks: Remorhaz at its turn end; Balor target picker; Azer while Stunned; move/delete token; player cannot see Region; library checkbox can reveal it.
