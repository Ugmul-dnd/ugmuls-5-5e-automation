# Druid damage bonuses

Primal Strike and Potent Spellcasting use the shared initial damage configuration. Both default to Yes and can be declined for that roll. Their labeled rolls are included in the submitted damage card, not only its preview. Existing dice, origin, targets, application and Undo remain in the native grouped workflow. No new result card or automatic feature popup is added.

## Primal Strike

- Requires the owned 2024 Elemental Fury: Primal Strike feature and a confirmed single-target hit from a weapon attack or a Wild Shape Beast attack. Excludes spell attacks, misses, Graze and locked/applied damage. Explicit attack identity is used; ambiguous multiattack usages do not guess the latest attack.
- Select Cold, Fire, Lightning or Thunder using the native feature’s damage types. Resolve the native damage formula and scaling from the original Druid’s roll data, including Improved Elemental Fury. Respect the native critical policy and original roll’s critical state without repeating unrelated critical bonuses.
- During combat, available once on the Druid’s own turn. Outside combat, no turn limit applies, but the same attack cannot consume the benefit twice.
- Wild Shape’s retained feature can be found on the form or original actor. The original actor owns the turn ledger, so transforming, changing form or reverting does not refresh the use. The active combatant may be either the original or transformed actor.
- The active GM revalidates actor ownership, source attack, confirmed target, turn, feature, formula, damage type and adjustment lock before reserving the use. Canceled previews do not reserve it. A failed roll evaluation releases its matching attack and turn reservation without clearing a newer use.

## Potent Spellcasting

- Requires the owned 2024 Elemental Fury: Potent Spellcasting feature. As explicitly requested, applies to **any damaging cantrip** cast by that character, including a cantrip from another class.
- Adds the caster’s current Wisdom modifier as a separate labeled flat bonus of the selected original damage part’s type. Does not double on critical hits. Mixed damage rolls offer a part selector; add the bonus once, not once per part.
- Excludes leveled spells, weapon damage, healing and temporary HP. There is no per-turn limit on this feature. The feature does not grant permission to cast while transformed; normal spellcasting availability still applies.
- Improved Potent Spellcasting’s range increase is outside this change.

World settings are grouped under Druid. Shared configured dialogs and skipped-dialog builds both retain the bonuses before native roll evaluation and animation handling. No chat scan, global refresh loop or new turn-update hook is required.

Verification: local `tests/druid-damage.test.mjs` covers native types/formula/scaling, critical policy, unchanged original dice, turn/ownership/lock validation, failed reservation and evaluation compensation, transformation/reversion identity, any-cantrip eligibility, mixed parts, labels, opt-out and actual preview/submission pipeline wiring. Live Foundry confirmation remains pending.
