# Shared helper-card lookup optimization (0.8.1)

The 2026-10-19 damage-confirmation trace showed repeated temporary item construction/preparation beneath associated-item/activity lookups, alongside chat layout, effect-panel and dice work. This change targets that repeated preparation without altering workflow scheduling.

The existing spell-escape snapshot resolver now also recognizes module-owned rider helper cards that use native dnd5e.item.data snapshots (or the native deleted-item snapshot when present). Source and linked result cards share a prepared temporary item per source card/scaling. Explicit module corrections still override original items; generic helpers preserve live native item/activity resolution. Unrelated native cards retain the system behavior. Stored snapshot data is cloned before preparation, and linked results use the source caster rather than the defender.

Caches are weakly keyed and invalidated for chat updates/deletion and relevant actor/item/effect changes. Actor modification stamps also force a fresh preparation; different scaling values remain separate. Token actor-data changes invalidate actor state. This keeps DCs, effects, resources, corrections and updated source data fresh without serializing or reconstructing an item on every read.

Early feature guards also skip unrelated activity types/identifiers before escape and Swallow recipe lookups. No damage dialog close ordering, resource consumption, card publication, save routing, deferred grapple release, animation waiting or effect application order is changed. In particular, Stunning Strike still resolves and applies Stunned after dice before a linked grapple is released/automatically failed. Native class feature items are not globally cached.

Validation: deterministic repeated-query test performs 300 item/activity lookups with one helper construction. Tests cover source-caster identity, snapshot immutability, actor/effect/card/source replacement invalidation, scaled/unscaled isolation, live native precedence, explicit corrections and independent source cards. Existing Stunning Strike, grapple-order, Smite, Battle Master and other workflow regressions remain required.

In-game measurement still needed: repeat the same Stunning Strike + grapple sequence after reloading clients and capture another trace. This does not claim to eliminate independent tooltip, layout, effects-panel or Dice So Nice costs observed in the original recording.
