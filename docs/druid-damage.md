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

## Moon: Lunar Radiance

With the 2024 Improved Circle Forms feature, offer **Lunar Radiance — Radiant damage** on a confirmed attack hit while the caster is actually using the Wild Shape preset. Normal damage is the first-use default; remember subsequent Yes/No selections per user and original Druid in client settings, across attacks, forms and reloads. Capture the default for each opened dialog so another dialog’s selection does not change it. Write preferences only when the player changes the selection, never on render or preview. Selecting Yes converts the native attack damage parts to Radiant. This applies to attack rolls while Wild Shaped, including spell attacks; save-only and damage-only abilities do not qualify. Other transformations, ordinary Druid form, misses and locked/applied damage do not qualify.

Find the retained feature on the form or original Druid. Clone roll data to change only damage type/flavors, preserving formulas, die results, totals and critical state. Returning to No restores original type metadata without rerolling. Added riders retain their own damage types; Primal Strike’s chosen element is independent. Potent Spellcasting follows the converted native part’s type for a qualifying cantrip attack. There is no resource cost or once-per-turn limit on Lunar Radiance, and the native Increased Toughness effect is untouched.

The Druid damage regression covers feature/form/hit/lock gates, normal default, Radiant preview and actual submission, unchanged evaluated dice/critical state, reversible selection, nested term flavors and independent rider types. Live Foundry verification remains pending.

Verification: local `tests/druid-damage.test.mjs` covers native types/formula/scaling, critical policy, unchanged original dice, turn/ownership/lock validation, failed reservation and evaluation compensation, transformation/reversion identity, any-cantrip eligibility, mixed parts, labels, opt-out and actual preview/submission pipeline wiring. Live Foundry confirmation remains pending.

Lunar Form offers its native 2d10 Radiant activity on a confirmed single-target Wild Shape weapon/form attack hit. Defaults Yes and disables after use. Works once on any combat turn, tracking the original Druid across forms. Spell attacks are excluded. Reservations for Primal Strike and Lunar Form are independent, validated by the active GM and refunded if the roll fails.
