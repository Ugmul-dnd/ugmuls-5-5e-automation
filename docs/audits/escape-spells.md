# Spell escape checks and Regions

| Spell | Area / initial use | Target effect and escape |
| --- | --- | --- |
| Ensnaring Strike | Initial Strength save, no immediate vine damage. Large or larger targets get advantage in the module prompt. | Ensnared takes native cast-level-scaled damage at turn start, followed by an optional action Athletics check. Success ends this restraint and its concentration. |
| Web | Placement only; Dexterity saves on entry / turn start, once per turn. No routine fire damage. | Failed saves apply Restrained. Optional action Athletics check at turn start; success removes that restraint. Leaving its Web Region or deleting that Region also removes it. |
| Evard’s Black Tentacles | Initial save plus entry / turn-end Strength saves, once per turn. Failed saves deal native damage and apply Restrained; successful saves take none. | Optional action Athletics check at turn start removes its restraint on success. The area remains and can restrain again on a later trigger. |
| Entangle | Initial Strength saves for creatures other than the caster; the terrain remains. | Failed saves apply native Restrained. Optional action Athletics check removes that target’s restraint without ending the whole area. |

Checks use the recorded caster DC, never a repeat saving throw. The GM clicks the action button, then the connected affected owner receives a manual Athletics dialog, with GM fallback. NPC automatic-save settings do not roll escape checks automatically. Native spell data is preserved; temporary cast/card snapshots supply only the missing behavior and damage corrections. Source-specific effect flags prevent an escape from removing another spell or caster’s restraint. The source concentration dependency is retained when a Region creates later target effects.

The four creature entries are in Creature Effect Triggers. Web, Evard’s and Entangle are also in Manage Spells and Regions. Existing overrides are preserved. Do not assign their failed-save Restrained effect as a continuous Region Effect: that would intentionally move ownership to the Region under the general ownership rule.

Burning webs, Web anchoring/collapse, terrain/vision presentation and adjudicating assistance/range remain manual. The action card prompts the affected creature’s check; assisting creatures can roll from their sheets and the GM can remove the appropriate restraint on success.

## In-game validation

1. Reload all clients and use fresh casts/effects. Check initial outcomes and concentration dependency first.
2. Web: place over a token with no immediate save/fire damage; start its turn or enter to save. Failure restrains. Test an action check, leaving the Web, re-entry and concentration ending.
3. Evard’s: test initial and later saves with mixed successes/failures, damage only on failures, one save per turn and optional Athletics escape.
4. Entangle: caster excluded, failed-save restraint, optional check, other targets and area remain after one target escapes.
5. Ensnaring Strike: no initial vine damage; start-turn damage scales with cast level. Check success/failure, original save success, and concentration cleanup.
6. Test connected owners, disconnected owner fallback, canceled check retry and refreshed effects with old pending cards.
