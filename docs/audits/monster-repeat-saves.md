# Monster Manual repeat saves - first batch

Eight shared recipes, 13 monster entries.

- Carrion Crawler / Chuul - Paralyzing Tentacles
- Grell - Poisoned and Paralyzed
- Doppelganger - Unsettling Visage
- Graveyard Revenant - Haunting Glare
- Myconids - Pacifying Spores
- Modron Pentadrone - Paralysis Gas
- Quasit - Scare
- Gold Dragons - Weakening Breath

- Reuse native applied effects, condition/status changes, duration and source actor activity DC. No source compendium or actor item edits.
- Recurring registration now accepts explicitly configured monster feat sources only, with source identifier, tracked effect name and native save activity ID. Shared Paralyzing Tentacles identifiers are disambiguated by activity ID so Grell uses its own save and clears only Poisoned & Paralyzed, never Grappled.
- Existing turn-end workflow provides owner/GM prompts, NPC rolls, pending cards, one processing stamp per turn and DSN wait before successful-save removal. Helpers are save-only, flat recorded DC, no damage/effects/resources/template/concentration or cast animation. Feats use zero spell scaling.
- Native condition/stat changes are preserved exactly, including any existing book limitations in Gold Dragon Weakening Breath. This change does not repair or reinterpret those stat modifiers.
- Initial attack/save/effect application still uses existing native cards and Apply/Undo settings. Monster effect creation or refresh registers tracking; disabled/removed/expired effects stop prompts. Local library overrides remain supported.
- Eye Rays, choice-based abilities, sleep/paralysis/petrification stages, counters, situational alternate break rules, recurring damage and action escape checks are not included.
- Reload and apply fresh effects. Test target turn end, success/failure, connected player and GM fallback, Grell independent grapple, different monster DCs, duplicate updates, expiry/removal and disabled recipe.

- Applied-copy timing correction: initialize start with the native current effect clock and clear inherited expired state. Read-only test-world evidence showed Chuul poison/paralysis was created with start.time=0 and expired immediately; native refresh already resets its start, but first creation needed this correction. Source book effects are untouched.
