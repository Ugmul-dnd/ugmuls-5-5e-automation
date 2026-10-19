# Stinking Cloud

- PHB source: phbsplStinkingCl; native save dnd5eactivity000 (Constitution, caster spell DC, no damage).
- Placement-only initial cast: no immediate or entry save. Everyone inside saves at turn start, once per target per turn, using existing shared cards and owner/GM routing.
- Native failed-save effect gFid0DG5HydORpr3, Stinking Poison, retains Poisoned, its description, changes, and concentration links. Applied actor copies use targetEnd expiry plus outgoing-combatant cleanup (native targetEnd skips the application turn), without modifying the book or owned spell.
- Auto Apply Saved Effects governs automatic application; manual Apply/Undo remains available. Existing Dice So Nice waits precede application.
- The spell's action/bonus-action prohibition is described by its native effect; no new action blocking is introduced. Obscurity and wind dispersal remain table-managed.
- Region library overrides remain authoritative. Disabling this recipe also disables its applied-copy expiry correction.
- Reload and test a fresh cast: placement causes no save; start turn prompts CON; failure applies Poisoned after dice; success has no effect; poison expires at affected turn end. Entry alone does not roll.
