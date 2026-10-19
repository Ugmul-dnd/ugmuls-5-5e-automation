# Guardian of Faith

- PHB summon phbsplGuardianof creates an unlinked Large guardian. Its native Guarded Area item phbaoiLevel4Conj has a Dexterity save, 20 Radiant/half on success, and system.uses max 60/spent 0. Native summoning matches its save DC to the caster.
- New Guardian of Faith summons receive a native attached 10-foot Emanation. Region item/activity reference that particular summon's Guarded Area save, not the original caster's spell. The Region library entry is named Guarded Area accordingly.
- Hostile-only entry/start-turn saves, once per target per turn, shared cards. No immediate placement save. The guardian excludes itself. Caster user routing survives GM creation for player summons.
- Reuse native save, damage, target selection, resistance/reduction, HP Apply and Undo. The separate Consume Damage Pool utility is not called.
- Guardian-specific damage metadata in the existing HP Undo ledger records the final native damage amount, after save/multiplier/resistance but before HP capping; temporary HP and overkill count. No damage is spent until actual application. Older ledgers fall back to HP/temp reductions.
- Active GM serializes pool adjustments, applying only each card's changed ledger total to Guarded Area system.uses.spent. Multiple guardians/cards keep separate pools. Undo refunds that card's damage; healing does not spend/refund the pool.
- At 60 or more spent, preserve an exhausted token snapshot and delete that token and its aura. No concentration is touched. Undo on any contributing card can recreate that exhausted guardian with its prior token ID and aura, then refund damage. Manual token deletion is never reversed by this feature.
- Exhausted snapshots live in module scene metadata (one per exhausted guardian); final cards also retain a snapshot. No chat-history search is added to turns. Ordinary token deletion removes only its own marked Region.
- Reload and summon fresh. Test enemy entry/start, success/failure amounts, immunity/resistance, temp HP/low HP, manual/auto Apply, Undo/reapply, pool exhaustion/removal and Undo restoration, two guardians, player summoning and token deletion. Terrain/visibility and native summon permissions remain unchanged.

- Cleanup ownership correction: native token deletion exclusively removes attached Regions. No module deleteToken hook competes with that deletion; unchanged post-exhaustion pool refreshes return before resolving the deleted source. Undo uses non-strict lookups for expected missing guardians.

- Player-cast routing correction: guardian Region activity execution stays on the active GM because Execute Script behavior source is GM-only. Owner-facing prompts keep their normal routing; ordinary caster Regions retain owner execution.
