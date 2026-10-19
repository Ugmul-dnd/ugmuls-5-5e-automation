# Monster recurring damage - first batch

Six native Monster Manual features. Module defaults live in the Trigger Automation Library and retain local overrides.

| Monster | Effect | Target turn start | Target turn end |
| --- | --- | --- | --- |
| Vrock | Spores / Poisoned | Native 1d10 poison damage | Repeat CON save; success ends tracked effect |
| Pit Fiend | Bite / Poisoned | Native 6d6 poison damage | Repeat CON save; success ends tracked effect |
| Vine Blight | Constricting Vine / Grappled | Native 1d8 bludgeoning damage | None |
| Tree Blight | Grasping Root / Grappled | Native damage, then optional Athletics/Acrobatics escape | None |
| Shambling Mound | Engulf / Grappled, Blinded & Restrained | Native lightning damage, then optional Athletics/Acrobatics escape | None |
| Blob of Annihilation | Engulf / Total Cover, Suffocating & Restrained | Native force damage | Repeat STR save; success ends tracked effect |

Use the originating actor's prepared activity damage/DC. Source items and effect changes are unchanged. Helpers consume no resources, place no templates, apply no new effects, and suppress animation recognition. Native initial saves and effects remain separate. Pit Fiend reuses the confirmed-hit poison-save handoff and supplies the Constitution ability missing from its book activity on the temporary helper only.

Damage and repeat saves use independent turn events. Damage does not cause an early end-turn save. Optional escape checks follow completed damage rolls, reuse the clicking user's skill/roll sequence, and never auto-roll. Success removes only the tracked source effect after dice animations. Removing/expiring an effect stops future triggers.

Movement, grapple capacity, healing restrictions beyond the native effect, manual detachment/holy water, alternate escape methods, engulf positioning and destruction remain table decisions. Vine Blight has no native Escape Check activity, so its escape remains manual in this batch. Healing-based wound closure, HP loss rather than damage, source-turn damage, swallowing/regurgitation thresholds, and life-drain transfers are deferred.

Validation: six full native fixtures through registration, helper construction, actual start/end turn processing, duplicate-update suppression, optional escape followups and animation-delayed successful cleanup. Pit Fiend helper construction and matching are checked; the shared confirmed-hit handoff retains Grell duplicate/miss tests. In-game test fresh Vrock, Vine Blight, Shambling Mound and Pit Fiend effects after reload.
