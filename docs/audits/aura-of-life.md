# Aura of Life - resistance only

- Native PHB phbsplAuraofLife, Create Aura dnd5eactivity000 is a heal activity with a self-origin 30-foot radius and template prompt disabled. Default template creation on initial cast, with subsequent roll actions disabled. Existing self-emanation placement attaches to the caster.
- Module recipe is placementOnly, with no turn/save/damage triggers. Native Aura of Life effect GV4hKah5zwQ3Bisx adds only system.traits.dr.value = necrotic. Reuse it through a native Region Active Effect behavior; card application excludes this Region-owned effect.
- Explicit regionEffectTargeting friendliesOnly allows an effect-only recipe to apply to caster and same-disposition allies without dummy activities. Other recipes retain their existing trigger-derived dispositions.
- Native Region effect lifecycle handles entry, exit, Region deletion and concentration cleanup, preserving independent resistance effects. Source book/actor spell stays unchanged. Healing at 0 HP, maximum-HP protection and other situational spells remain manual.
- Reload/fresh cast: attached 30-foot aura, no healing prompt, caster/friendly resistance, enemies unaffected, exit/cleanup removes only this aura's resistance, independent Necrotic resistance remains.
