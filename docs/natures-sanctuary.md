# Nature’s Sanctuary

The default Region recipe applies to tokens matching the caster’s disposition. Placement resolves one native Sanctuary effect combining the `coverHalf` status with the caster’s currently enabled Nature’s Ward resistance. The remembered land choice supplies a fallback when the owned Ward exists but has no enabled effect. Without an applicable Ward, a reusable Half Cover-only source effect is created on the owned Sanctuary feature. No flat AC adjustment is added.

The standard managed `dnd5e.applyActiveEffect` Region behavior applies/removes the effect on entry/exit and Region movement/deletion, with active-GM authority for player placements. Native Sanctuary variants are treated as Region effects rather than separately applied from the chat card. Other features and resistance sources are left alone.

Simple Cover recognizes the non-system embedded Half Cover status. Existing Simple Cover/AC5E compatibility removes cover already included in sheet AC before applying the resolved cover once. Tests exercise the installed Simple Cover status lookup and AC5E finalizer in library and standalone modes, including repeated finalization and attack target AC. Stronger cover and ignore-cover handling stay with Simple Cover. No additional AC5E advantage or flat AC rule is registered.

Automated tests cover selection, fallback, duplicate source creation, friendly targeting, native card exclusion and cover compatibility. Live Foundry confirmation remains pending.
