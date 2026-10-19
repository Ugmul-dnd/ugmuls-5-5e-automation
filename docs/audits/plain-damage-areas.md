# PHB plain damage-area batch

Five enabled portable defaults are included automatically in the module Region library. Existing world entries/overrides remain intact; Reset to Default opts a customized spell into the included recipe. Fresh casts install behaviors. No native book activities or effects are rewritten.

| Spell | Native activity | Damage at base slot | Save |
| --- | --- | --- | --- |
| Cloud of Daggers | Damage, dnd5eactivity000 | 4d4 Slashing, +2d4 per slot above 2 | None |
| Cloudkill | Cast and Save, dnd5eactivity000 | 5d8 Poison, +1d8 per slot above 5 | Constitution; half on success |
| Insect Plague | Save, dnd5eactivity000 | 4d10 Piercing, +1d10 per slot above 5 | Constitution; half on success |
| Incendiary Cloud | Cast and Save, Hhw0octbLetO5Nsi | 10d8 Fire | Dexterity; half on success |
| Blade Barrier | Blade Wall Y0nT1EvDbg7IDovC / Blade Ring SRwETzebAYXEJKux | 6d10 Force | Dexterity; half on success |

All five keep native initial placement damage. Region entry and target turn-end events use one trigger per spell with everyone targeting, oncePerTurn and shareCardPerTurn enabled. Initial cast cards and target allowances are seeded using stable native activity identity, including ring casts. Entries and end-turn events share the same turn allowance. Grouped cards, native pending saves/damage, owner/GM routing, resistances and automatic/manual application remain in the common workflow. Entry of a repositioned Region is supplied by Foundry's native membership updates; no additional scene polling or movement hook is installed.

Blade Barrier follows the activity recorded on its Region, falling back to the configured native wall activity only if the original activity is unavailable. Other new recipes prefer stable activity IDs and fall back to activity names. Legacy/name-only custom recipes remain supported. Editing a trigger to a custom activity should use that chosen activity; the manager's normal explicit activity configuration remains available.

Cloudkill/Incendiary drift and Cloud of Daggers teleport actions remain manual repositioning. Wind dispersal, native area geometry, Blade Barrier cover/difficult terrain, and other terrain/obscurity interactions remain GM-managed. These recipes add damage triggers only; no artificial Blinded/cover conditions are added to tokens and no new terrain rules are imposed.

Fresh-cast validation:

1. Place each spell over mixed targets; test initial damage/saves, including successful half damage and immunity/resistance.
2. Enter an area, then end the same combat turn inside: only one event can affect that target on that turn. On a different turn, eligibility resets. Multiple targets share the appropriate card.
3. Reposition Cloud of Daggers/Cloudkill/Incendiary Cloud over new tokens; test entry, overlap and per-turn limits. Native movement handles membership; test actual scene behavior in-game.
4. Test upcast Daggers, Cloudkill and Insect Plague against native formulas.
5. Cast Blade Wall and Blade Ring separately; ensure the same cast's activity is reused, the initial card is shared, and no immediate duplicate save occurs. Native shape placement determines affected space; verify wall thickness/ring placement at the table.
6. Test empty initial area, later entry, pending/canceled roll recovery, player-owned caster and GM fallback, concentration cleanup and local recipe overrides.

Automated focused checks cover the five defaults, portable sources, original activity identity, renamed activity resolution, both Blade Barrier forms, initial shared-card registration/turn allowance, native name overrides, Region library migration/reset and shared pending routing. In-game confirmation remains necessary.
