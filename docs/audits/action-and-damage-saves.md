# Action and damage-triggered saves

## Included recipes

- Otto’s Irresistible Dance: show an optional save card at the affected creature’s turn start. The GM can click **Use action — Roll save** when the creature chooses to spend its action. No automatic save prompt or NPC roll occurs beforehand. Short Dance does not receive repeat saves. Action expenditure remains the GM’s decision.
- Dominate Beast, Dominate Person, Dominate Monster: repeat Wisdom saves when damage is applied.
- Tasha’s Hideous Laughter: repeat Wisdom saves at turn end and on applied damage. Damage-triggered saves have advantage; turn-end saves do not gain this extra advantage.

All recipes preserve native spell effects. Success removes the tracked effect after dice animations. Connected owners receive ordinary prompts, with GM fallback and the existing NPC-save setting.

## Damage handling

Use the native damage application event, rather than a damage roll or arbitrary HP edit. A positive application triggers even when temporary HP absorb it; zero damage, healing and Undo do not. Each application gets a separate save, including multiple hits while earlier saves are pending. Duplicate notifications for the same event are ignored. Player-applied damage is forwarded to the active GM after ownership validation. Only the damaged actor’s effects are inspected. A visible token and the original caster’s spell are required.

## Library controls

Choose start of turn, end of turn, or damage taken. **Also trigger on damage taken** supports combined timing. **Advantage on damage-triggered saves** applies only to damage events. **Card only — GM chooses whether to roll** suppresses automatic prompting. Damage-taken entries must be save-only, preventing damage/save recursion. Existing world overrides are preserved.

## In-game checks

1. Cast Otto’s and apply its lasting effect. At the target’s turn start, confirm the card appears without a roll or popup—even with NPC auto-saves enabled. Click the action button and resolve a save.
2. Cast a Dominate spell and apply its effect. Apply two separate damage instances and confirm two saves. Test temporary HP, zero damage, healing, and Undo.
3. Cast Hideous Laughter and compare a damage-triggered save with a turn-end save. Only the former should gain this extra advantage.
4. Repeat damage application from a connected owner’s client. Confirm one GM-coordinated save per application, with normal owner routing.
5. Check failure retains the effect, success removes it after dice, and removed/expired effects stop triggering. Reload and use fresh casts; existing effects are not automatically backfilled.

Entangle, Web, Evard’s Black Tentacles and Ensnaring Strike require Athletics checks for escape. They are not converted into saving throws by these recipes.

## Grapple escape

New Grappled effects created by the module’s unarmed Grapple workflow snapshot the original grappler’s DC. The Grapple library entry shows an optional start-of-turn escape save card, using the target’s better Strength/Dexterity save (Strength on ties). The GM decides whether to spend the action and roll. Success removes only the tracked grapple after animations; failure retains it. The original temporary grapple item is not needed. Prone and manually applied Grappled effects with no known source/DC are excluded. Reload and use a fresh grapple for testing.
