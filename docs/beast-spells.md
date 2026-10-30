# Beast Spells in Wild Shape

Extend the existing native Spells tab; no additional spell button or panel. The automation requires the owned 2024 Beast Spells feature and the native Wild Shape preset. Other transformation presets, appearance-only transformations, lower-level Moon access and disabled automation use the native workflow unchanged.

When Beast Spells is owned, transfer the character’s prepared/always-prepared spells and known cantrips. Exclude spells with a positive material cost or a consumed material component, including free consumed components. Eligibility is based on the installed spell data rather than spell names. Prepared numeric values greater than zero are retained; level-zero spells count as known cantrips.

Moon spell access is a separate permission. For a character with the Moon subclass or Circle of the Moon Spells feature, retain native Moon-list spells and subclass-sourced Moon spells regardless of the Beast Spells preparation/material filter. Use the native Moon spell-list registry for matching. Preserve independently owned Druid/Moon copies and their IDs; do not import another copy or merge their separate source metadata.

Clone transformation settings per use, retaining spellcasting and native slot synchronization on reversion. Native item activities, source identity, effects and concentration handling remain intact. Linked transforms filter their native creation payload. Unlinked transforms filter the native actor update and batch-remove excluded spells that remain inherited through ActorDelta; native previousActorData retains their restoration state. Temporary hooks are scoped to the transforming actor and removed on success or failure. No chat scans or additional rendering loops are added.

Existing transformed actors need to revert and transform again to populate the expanded list. This change does not retrofit their inventories.

## Concentration on reversion

Native reversion copies HP/slots but not concentration started on the transformed actor. The Wild Shape concentration helper transfers active concentration to the restored actor before the Beast is removed. Keep the effect ID and duration, remap caster/item/activity references and registered dependents, migrate self-targeted dependent effects, and update matching native Region sources (including Regions not registered as concentration dependents). Update dependent registry entries on connected clients through targeted document hooks, not global rescans. Only an explicit reversion visits scene Regions for its exact source spell.

The active GM performs mutations; player requests revalidate ownership and Wild Shape state. Linked forms transfer before native actor deletion. Native unlinked reversion creates a replacement token first; a scoped factory wrapper transfers into that actor and reconnects token references before old-token deletion. Restore the factory in all completion/error paths. Failed migration/reversion restores prior dependency links and concentration state. Older original concentration replaced in Beast form is disabled so it is not revived; independently newer original concentration blocks the transfer rather than being overwritten. Existing forward concentration uses the same effect identity, so it is not duplicated. Other transformation presets and Semblance reversion are excluded.

`tests/wild-shape-concentration.test.mjs` covers linked/replacement-token reversion, duration/source identity, effect and Region ownership/cleanup, self effects, registry migration, rollback, stale/newer concentration handling and the actual player/GM socket roundtrip. Live Foundry confirmation of the reverse direction remains pending.

Verification: `tests/beast-spells.test.mjs` covers linked/unlinked transfer, repeated-form diffs, prepared/cantrip eligibility, costly and consumed exclusions, independent Moon inclusion, low-level and unrelated transformation fallback, preserved native settings/effects/slots, excluded inherited-item cleanup and hook cleanup after failures. Live Foundry confirmation remains pending.
