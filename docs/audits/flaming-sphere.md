# Flaming Sphere

- Native PHB phbsplFlamingSph: summon dnd5eactivity000; save dnd5eactivity100, Dexterity caster DC, 2d6 Fire/half, +1d6 per slot above 2.
- The summoning client's dnd5e.summonToken hook stamps the source item, cast level, origin token and concentration where available onto token data. No source compendium, actor, or summon profile edits.
- Active GM handles createToken, validates source spell and creator ownership, and creates one native Region per summon. Native 5-foot Emanation geometry is attached by attachment.token, with native token-shaped base. No movement polling or manual distance checks.
- Region dnd5e.item/activity/origin/spellLevel point to the caster spell/save and original cast level. Existing createRegion handling installs behaviors; everyone except the sphere can trigger tokenTurnEnd, once per target per turn, with shared cards and standard save/damage/DSN handling.
- No entry or movement damage. Ramming remains a manual use of the native spell/summon save card.
- Token deletion removes only its marked Region. Existing concentration cleanup removes Regions by the exact caster-owned item UUID. No full-message or actor scans are added to turn processing.
- New summons only; existing placed spheres require resummoning after reload. A connected active GM is required for automatic Region creation.
- Test fresh level-2 and upcast summons as GM and player: one attached Region, 5-foot reach around token, follows movement, no immediate/entry save, end-turn DEX with correct caster DC and scaled damage, sphere excluded, token/concentration cleanup, manual ram unaffected.

- Cleanup ownership correction: native token deletion exclusively removes attached Regions. No module deleteToken hook competes with that deletion; unchanged post-exhaustion pool refreshes return before resolving the deleted source. Undo uses non-strict lookups for expected missing guardians.
