# Sleet Storm

- Native PHB source phbsplSleetStorm, save dnd5eactivity000, Dexterity/caster spell DC, no damage or configured effects.
- Initial cast only places its native cylinder. Entry/start-turn triggers target everyone, once per target per turn, with shared cards and normal owner/GM save routing. No placement save or end-turn save.
- Failed outcomes apply native Prone via the shared condition Undo ledger, then end the target's existing concentration after all relevant dice animations finish. No additional concentration save. Already-Prone creatures still lose concentration.
- Auto Apply Saved Effects governs automatic outcomes. With automation off or handed back to manual, an active-GM card button applies unresolved failures. Pending/success targets are excluded; a persisted per-target ledger prevents refreshes from dropping later concentration or reapplying after standing.
- Undo Effect can undo newly applied Prone. Lost concentration and its dependent effects are not restored by Undo and require manual correction. Prone is independent of the storm and does not end on leaving the Region or losing the caster's concentration.
- No world-wide actor/message scan or turn pause. Native source spell remains unchanged; local Region overrides and disabled recipes are respected.
- Terrain, heavy obscurity, flame extinguishing, standing, and placement dimensions remain native/table-managed.
- Fresh-cast checks: no initial save; enter/start-turn DEX prompt; success does nothing; failure after dice applies Prone and ends only the target's existing concentration; same-turn re-entry does not repeat; following turn can repeat; manual setting/button and Undo work.
