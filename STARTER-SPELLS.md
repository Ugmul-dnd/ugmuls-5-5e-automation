# Region Spell Library

The seven saved Region recipes now ship as module defaults. Open **Manage Spells and Regions**; no starter-list import is required. New module defaults match the current saved enabled states. Review activity names against your installed items before using the recipes in a new world.

| Spell | Saved activity triggers | Targeting / behavior |
| --- | --- | --- |
| Hunger of Hadar | Start of Turn Damage; End of Turn Save | Everyone |
| Spirit Guardians | Cast and Save on entry / turn end | Hostiles Only; once per turn; shared card; native Half Speed Region effect |
| Grease | Save on entry / turn end | Everyone |
| Fog Cloud | Use on entry | Everyone; scene vision setup remains separate |
| Conjure Animals | Save on entry / turn end | Hostiles Only; once per turn |
| Spike Growth | Damage on movement in / within / out | Everyone; movement accumulation in 5 scene-unit increments |
| Moonbeam | Save on entry / turn end | Everyone; once per turn; shared card |

## Defaults and local changes

The module owns the base recipes. World changes are saved as overrides; custom spells/features are stored separately. **Reset to Default** removes a built-in entry's local overrides. **Disable** keeps its configuration while stopping it from running. Bulk removal disables module entries and deletes custom entries. Changed trigger/effect arrays override those arrays as a whole; unchanged fields can inherit future module updates.

Defaults contain configuration only, with portable PHB source references. They do not create, change, or distribute spell text, activities, artwork, or compendiums. Existing spell activities and Region creation are still required. Names must match your items; some recipes came from customized activities. Spirit Guardians includes its native Half Speed effect by name, resolved from the actual caster’s spell. The other six defaults have no preloaded Region Effects. Existing native book effects remain available for local configuration.

## Existing worlds

On the next load with an active GM, the current module's saved spell table migrates into overrides and custom entries. The original table remains untouched and a separate backup is retained. Local enablement, trigger IDs, movement increments, targeting, shared cards, source/effect UUIDs and Region conditions are preserved. The migration-complete marker is written last; partial failures retain the legacy table as the runtime fallback and can retry on reload.

The older table under the former region-spell-automation module namespace is not imported or reactivated. Existing Regions are not rewritten or recreated. No world database was edited directly during development; migration runs through Foundry settings on load.

## Validation

After refreshing all clients, confirm the manager lists all seven defaults and preserves your existing changes. Check Spike Growth movement accumulation, Moonbeam/Spirit Guardians shared cards, Hunger of Hadar's two activities, and any local effects/conditions. Test Disable and Reset on an expendable configuration before changing a customized entry you want to keep.

## Region effects and chat cards

Effects assigned under a spell’s **Region Effects** are owned by the Region. They apply according to Region membership and targeting, independently of the spell’s damage save, and are excluded from that spell’s automatic save/hit/buff effects and manual chat-card Apply Effect controls. Other effects on the spell keep their ordinary card behavior. For example, assigning Spirit Guardians’ speed reduction to its Region prevents the damage/save card from applying a separate lasting copy. Native book items are not edited. Removing the Region assignment or disabling the Region configuration restores ordinary card eligibility. Existing duplicate effects are not automatically removed; test a fresh cast and verify that leaving the area removes its Region-managed effect.

## Movement-only casting

Spike Growth’s placement does not roll damage. The initial cast completes after successful Region placement and any target/Metamagic confirmation, including its concentration handoff. Its cast card describes the placed area; damage comes from the existing movement counter and Roll Pending Damage control. The initial Damage button is hidden and guarded. Canceling placement still refunds the pending cast. This behavior is determined by enabled movement-only Region triggers rather than a special spell-name check; mixed trigger configurations retain their initial-roll behavior.
