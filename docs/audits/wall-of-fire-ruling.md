# Wall of Fire - table Region ruling

User-selected Foundry simplification: use the Region placed by the spell card as the entire damaging area. No automatic geometry expansion or hot-side checks. Keep the native placement dimensions; the GM may reshape/resize the Region manually, including expanding the represented wall/heat area to 10 feet.

- Initial cast: native Create Wall or Create Ring Dexterity save; native 5d8 Fire at level 4 and half damage on success.
- Later entry / target turn end: damage with no saving throw, once per target per turn. Native +1d8 per slot above 4 remains.
- Both wall/ring activities are supported. No second Region or template is created.

The event engine resolves the original cast activity, then prepares a disposable damage-only item snapshot. It removes the save, On Save mode, template, effects, concentration start and resource costs, but keeps the native damage parts/scaling. Persisting that snapshot on the new card makes later native damage actions use the correct activity type. Follow-up cast animations are disabled. Native resistance/immunity/vulnerability and automatic/manual damage application remain unchanged.

The initial save card seeds target turn allowances but is not registered as the shared follow-up damage card. New targets entering during that cast turn get a separate no-save damage card; already-affected targets are blocked by the initial turn allowance. Later follow-ups still share cards by Region/turn. Local overrides are preserved. Region Manager trigger editing retains these specialized semantics; changing an explicit activity clears stale original activity ID/shape links.

Fresh-cast validation: initial wall/ring mixed saves, initial half damage, later entry/end damage without save cards, initial-target same-turn limiter, new target entering cast turn, repeated events, upcast damage, manual Region resizing, no new spell slot/template/concentration, shared Pending recovery and resistance/Undo.

Wall of Ice remains outside automation. Wall of Thorns is not changed in this update.
