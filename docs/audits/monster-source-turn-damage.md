# Monster source-turn recurring damage

Four first-batch defaults use the originating monster's turn start:

| Monster / feature | Tracked relationship | Native follow-on damage |
| --- | --- | --- |
| Stirge / Proboscis | Attached Stirge | Native Attached: Damage activity (2d4 Necrotic in supplied book) |
| Invisible Stalker / Vortex | Its Grappled effect | Native grappled Thunder damage |
| Water Elemental / Whelm | Its Grappled & Restrained effect | Native start-turn Bludgeoning damage |
| Barbed Devil / Barbed Hide | Creatures grappled by it OR creatures grappling it | Native Barbed Hide Piercing damage |

Vortex and Whelm register native applied effects using their existing source item, prepared escape-check DC and source token. On the affected creature's turn, the existing workflow shows an optional Athletics/Acrobatics escape action; it does not deal source-turn damage there. Escaping removes the tracked native effect and its linked conditions after dice. At the monster's turn start, a separate handler gathers only its active tracked targets in the scene and prompts the native damage.

Stirge has no book attachment effect. A confirmed Proboscis hit therefore creates Attached — Stirge after attack dice finish. This effect has no Grappled status or invented stat changes. It tracks the source token and target. Disable/delete it when detached to stop recurring damage. Initial attack damage stays native. Detachment actions, movement and attack restrictions are table-managed. Persistent attack ledgers and local guards prevent repeat attachment creation across hit/damage refreshes.

Barbed Hide reads active Grappled relationships, including the existing creature/grapple escape records and unarmed grapple caster metadata. It includes both directions, resolves original source-card tokens when available and deduplicates each creature. Unrelated grapples do not count. This adds no new distance, capacity or movement checks.

Source processing is active-GM only and only inspects supported features on the incoming combatant. Target searches stay within its scene. Disabled, expired, removed and externally automated effects are excluded. Source actor/token identity keeps separate grapplers independent. Dead/defeated sources do not trigger. Per-token recipe/turn stamps prevent duplicate prompts.

Native damage helpers consume no resources, create no templates, apply no new effects and suppress cast-animation recognition. Usage/damage cards retain recorded recipients and default to Target display. Existing damage application settings, Undo and Dice So Nice timing remain in control. Trigger Library View/Edit can enable/disable each recipe and accurately describes source versus target timing.

Validation: all four native fixture sets, prepared registration/source-token capture, no recipient-turn damage, optional target escape, source-turn native damage parts, no consumption/template/effect reapplication, wrong linked-source exclusion, Barbed Hide both directions, Stirge hit-only animation wait and persisted duplicate guard, disabled/deleted/external/dead/settings/GM guards, library validation and card target display.

In-game: fresh Vortex/Whelm cast and failed save; affected creature's turn should offer escape, monster's turn should prompt damage. Stirge hit should add Attached — Stirge; its next turn should prompt damage, disabling the attachment should stop it. For Barbed Devil, test a creature held in Claws and a creature grappling the devil; each should receive Barbed Hide damage at the devil's turn start.
