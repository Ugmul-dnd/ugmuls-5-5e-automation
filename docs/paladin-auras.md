# Unified Paladin auras

The module creates one attached emanation per Paladin token in the active scene, combining supported passive class and oath benefits. It requires the 2024 Aura of Protection feature and Paladin level 6. The prepared native aura scale is respected; otherwise the radius is 10 feet, increasing to 30 feet at Paladin level 18. Owned feature items determine which additional benefits are available.

## Setup

Reload GM/player clients. **Unified Paladin Auras** is enabled by default under Automations → Unique Classes → Paladin. A connected active GM maintains regions and recipient effects. No compendium edits, effect conversion or region placement is required.

Disable old Paladin emitters configured in Aura Effects before testing. The module detects active matching Aura Effects emitters, warns the GM, and declines to create a replacement for that Paladin to prevent duplicate bonuses. It does not uninstall Aura Effects, disable it globally, or delete its effects/regions. Unrelated auras can continue to use it.

The region outline is visible only on the Regions layer, uses Grid Shaped emanation coverage, and creates no visual animation. Existing module-owned emanations are updated once after the GM reloads, using the scene grid’s distance rules. The actor-window **Paladin aura** menu is available on standard and Tidy sheets. It lets an owner enable/disable this source, view Genie resistance, or choose a preferred overlapping Protection source. Source disable stops the replacement; native self effects return to their original behavior.

## Recommended scene grid setup

Recommend Grid Shaped emanations for auras. Set the scene grid size/spacing and distance per square to match the map so aura ranges and affected squares are measured correctly. Current testing uses alternating 1–2–1 diagonal movement; other diagonal-distance rules have not yet been verified.

Include this setup recommendation in the website’s aura documentation and the next release update.

## Passive benefits

| Feature | Managed benefit |
| --- | --- |
| Aura of Protection | Source Paladin's Charisma modifier, minimum +1, to saves. One Protection bonus, never a sum. Highest available is the default; a recipient may choose another available Paladin in the menu. |
| Aura of Courage, level 10 | Frightened immunity while covered. Existing effects are preserved; native condition immunity suppresses their condition benefits while in range. |
| Aura of Devotion, level 7 | Charmed immunity/suppression while covered, preserving existing effects. |
| Aura of Warding, level 7 | Necrotic, Psychic and Radiant resistance. |
| Aura of Alacrity, level 7 | Preserve the Paladin's native permanent +10 Speed. Allies gain +10 on first entry per turn or their turn start, lasting through the end of their next turn even after leaving. |
| Aura of Elemental Shielding, level 7 | One selected Acid, Cold, Fire, Lightning or Thunder resistance. Use the native feature card and click one resistance to apply its self-selection and update the aura. It always requires a manual choice; no Cold default is added. Existing native choices and old saved menu choices remain supported until the card takes control. |

The Paladin and matching non-neutral-disposition allies receive benefits. Neutral tokens are not automatically assumed to be allies. Native scene geometry and levels determine membership. Incapacitated, Unconscious, Stunned, Paralyzed, Petrified or Dead source statuses pause the ongoing aura. Glory's already-granted speed lasts until its recorded expiry; its native permanent self speed remains intact.

One combined recipient effect carries all ongoing passive benefits. Glory speed has its own timed effect because it can continue outside the region. The original transferred Protection and Genie self effects are suppressed in derived data only while this module manages their source; their saved configuration is not changed. Other effects are left intact. Condition effects are not deleted or disabled on entry, and may still expire or be cured normally. Custom effects with independent changes beyond their condition may need table adjudication.

## Genie card selection

Aura of Elemental Shielding is excluded from automatic buff application even if that world option is enabled. On its native card, click a resistance directly; no second Apply click or target selection is required. The choice always belongs to the originating Paladin. Reusing an old card is allowed. Shift does not select several options. Only the current shielding choice is retained; unrelated resistances and other features are preserved.

The applied self-selection supplies the aura choice. While the unified aura manages that Paladin, the native resistance on the selection effect is suppressed so it cannot bypass aura incapacitation; the combined aura buff supplies the actual resistance. Disabling/removing the selection removes that elemental benefit from the aura. The actor menu reports the choice instead of offering a second selector. Timing of changes remains a table decision.

## Movement and cleanup

Only the active scene contributes to linked actors, avoiding inactive-scene tokens granting global bonuses. Token document updates are batched; per-frame token rendering is not used. Region attachment handles ordinary source movement. Recipient effects are created, changed or removed when their actual benefits change; unchanged membership/benefits do not cause repeated writes. Existing source metadata is refreshed when a mechanical benefit changes.

Out of combat, Alacrity uses a 12-second world-time expiry; it does not force time to advance. During combat it tracks recipient turn ends. Regions/ongoing buffs are removed when their source is removed, loses its feature, is disabled or becomes ineligible. Turning off the automation removes its ongoing buffs and restores native self-effect behavior. Original conditions and unrelated effects/regions are preserved.

Temporary oath powers such as Holy Nimbus, Avenging Angel, Elder Champion and Smite of Protection are not activated by this passive-aura pass. Channel Divinity automation is a later task. No new book content is distributed.

## Foundry verification

1. Disable the old Aura Effects Paladin emitters. Reload both clients. Place a level 6 Paladin and friendly ally: confirm exactly one attached region, correct +Charisma saving bonus for both, and no doubled self bonus.
2. Move the ally across the boundary and move the Paladin past several allies. Confirm the save bonus follows coverage and remains stable while inside.
3. Check class level 18 for expansion, and try Incapacitated on the source. Confirm ongoing benefits pause and return without deleting conditions or adding extra regions.
4. Test Warding and Genie resistances with damage. Change Genie element by clicking its feature-card resistance and confirm only the chosen elemental resistance applies.
5. Test Frightened/Charmed before entering Courage/Devotion. Check the condition no longer affects rolls inside and returns outside if still active. Also confirm immunity to a new condition while inside follows the native system.
6. Overlap two Paladins. Confirm only one Protection bonus, independent oath benefits, and preferred-source selection. Move either source away.
7. With Glory, enter before and during the recipient's turn, then leave. Confirm the speed bonus lasts through the correct next turn end, does not stack, and refreshes at turn start while covered.
8. Remove a source token/feature or disable automation. Confirm owned buffs clean up while unrelated effects and native feature settings remain intact. Test as a connected player as well as GM.

Automated checks: tests/paladin-auras.test.mjs. The checks validate rules, concurrency, native-effect preservation and zero writes for movement with unchanged benefits. Live Foundry validation and any performance trace remain necessary.
