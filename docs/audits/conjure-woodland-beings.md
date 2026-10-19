# Conjure Woodland Beings

Built-in enabled Region recipe uses the installed PHB 10-foot self-origin Emanation, original Cast activity dnd5eactivity000 and repeat Emanation Save UkXLSgFbCBI9CHMf. It adds no separate creature effect or movement penalty.

- Entry (including new overlap when the attached aura moves) and target turn end use the existing Region-event workflow.
- Native Wisdom saves deal 5d8 Force at slot level 4, half on success, +1d8 per slot above 4.
- Hostile-only targeting matches the current Spirit Guardians setup. Local trigger targeting remains editable and also controls initial target collection.
- Initial Cast and repeat Emanation Save share a compatible card and target turn allowance. Once-per-turn and per-Region grouped cards prevent duplicate entry/end-turn charges.
- Self identifies the Emanation's origin, not a creature to roll against. This recipe explicitly opts initial area collection into the trigger's configured targeting. Ordinary self spells and the separate no-template Disengage activity retain self targeting.

Native Emanation placement/attachment and geometry stay unchanged. Automatic attachment follows the existing Automatically Attach Self Emanations setting; the target collection uses the existing area-confirmation workflow. No new canvas polling or geometry checks are introduced. Native damage/application, pending rolls, owner/GM routing, concentration cleanup and original-level scaling remain shared. Visibility/eligibility decisions beyond current Region behavior remain table-managed.

Bonus Action Disengage remains the native manual activity. Conjure Celestial was explicitly excluded by the user and has no new default.

Fresh-cast validation: aura attaches to caster; initial foes receive saves rather than caster/allies; moving aura over a foe triggers; foe enters/ends turn inside only once that turn; several foes share card; empty initial aura works when a foe arrives; upcast damage; manual Disengage; concentration cleanup; player-caster/GM fallback and Pending retry. Existing local spell overrides remain authoritative; Reset to Default opts into the new recipe.
