# IMP-009: Review Shield's linked refresh and derived-AC correction paths

[Findings register](README.md) · [Shield walkthrough](../guides/shield-walkthrough.md)

- **Status:** Proposed investigation; not implemented.
- **Type:** Shared lookup/presentation and correction-contract review.
- **Recorded/source reviewed:** 2026-11-09, `v1.0.1-dev`.
- **Authorization:** Record findings during documentation; no runtime cleanup authorized.

## Source observations

In [shield-reaction.js](../../scripts/shield-reaction.js), the attack-update listener supplements native damage associations with an enumeration of `game.messages`, selecting explicit `damageAttackId` or direct-origin matches, then directly updates those damage cards and the source presentation.

The module already has exact-key buckets in [chat-message-index.js](../../scripts/chat-message-index.js), shared HP links, and the deduplicating refresh queue. A future review should determine whether the Shield path can use those existing relationships without losing direct-origin/grouped/history visibility cases. This note identifies existing work, not a measured slowdown or newly introduced loop.

Shield also consumes both applied-flag updates and the buff-applied event. `refreshShieldAttack` rewrites targets and can emit settlement; it has no general per-cast recheck deduplication. Conversely, the file has no explicit effect-Undo path promising to recompute all attacks affected by an undone Shield. These are related derived-AC/update boundaries to establish before consolidation, not evidence that all these paths are broken.

## Connections to preserve

- Original attack dice and native hit/critical policy; explicit per-attack damage identity.
- Recorded recipients, Combat Inspiration's card-specific AC bonus, and correct unresolved-token fallback.
- Player/native cast versus active-GM applied-effect settlement.
- Early `shieldRechecked` versus committed `shieldReactionSettled` semantics.
- Mixed-target damage, supported miss damage, and visibility of outstanding HP/effect Undo histories.
- Defensive Duelist/Combat Inspiration imports of shared Shield helpers.

## Questions and later verification

- [ ] Inventory native associations, explicit attack links, direct origins, and index coverage before replacing the scan.
- [ ] Establish when duplicate applied signals arrive and which rewrites/renders are redundant. Do not suppress the authoritative settled signal while deduplicating presentation.
- [ ] Trace committed effect Undo and expiry separately: determine intended historical-card correction versus current AC behavior before adding hooks.
- [ ] Use deterministic work counts: unrelated cards should not force full history enumeration; overlapping requests should deduplicate; deleted cards and failures remain isolated.
- [ ] Run Shield, reactive settlement, refresh/index, shared lock/Undo, Combat Inspiration, and Defensive Duelist checks before and after any approved change, then the full local suite with checks. Tests/tools remain local and ignored.
- [ ] In Foundry, verify player casting, active-GM settlement, same/mixed-target hits, no reroll, spell pools/Reaction, outstanding Undo visibility, and effect-Undo correction behavior. Record actual results.

## Record

- **Runtime changes:** None.
- **Large-battle measurement:** Not performed; no performance gain claimed.
- **New effect-Undo reproduction:** Not performed; intended behavior remains to be established.
- **Next step:** Trace one concrete correction path and lookup contract before selecting a code change.
