# Conjure Elemental

Initial capture stays manual: use the summoned spirit’s Initial Save activity and resolve its native save/damage/effect. The Fire variant’s missing Restrained effect association is supplied in prepared activity data without changing the PHB or owned source item.

Four Trigger Automation Library recipes identify the native Air, Earth, Fire and Water features by identifier and activity IDs. Applying their Restrained effect uses the existing active-GM recurring registration. At the target’s turn start, repeat the native Dexterity save first. On failure, offer the separate native Save while Restrained activity’s damage; on success, remove this restraint and deal no recurring damage. The original spell and other restraint sources are preserved. No automatic entry, movement or initial-save triggers are added.

Recurring helpers retain the summoned actor’s native damage type, scaling and save DC. They reuse the 4d8 repeat activity rather than the 8d8 initial activity, with no new summon, resource cost or concentration. The condition’s native concentration dependency points to the exact original caster’s Conjure Elemental concentration effect, when available. Its duration is concentration-managed, avoiding a premature turn expiry.

Automated tests inspect all four installed native summon features, effect association, repeat activity data, exact DC/type, independent concentration identity and existing recurring workflow regressions. Live GM/player verification remains pending.
