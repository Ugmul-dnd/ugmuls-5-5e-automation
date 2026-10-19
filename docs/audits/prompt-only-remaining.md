# Remaining PHB creature spells - prompt-only scope

User direction: provide explicit end-of-turn saving throws; handle save counts, unusual conditions/interactions and all outcomes at the table. This batch does not add counters, condition transitions or automatic effect removal.

| Spell | Prompt |
| --- | --- |
| Confusion | Wisdom at target turn end; behavior roll and all action restrictions remain native/manual. |
| Crown of Madness | Wisdom at target turn end; upkeep, forced attacks and creature eligibility remain manual. |
| Contagion | Constitution at target turn end for each native Infected ability option. No repeat initial 11d8 damage. Counts and seven-day transition remain manual. Multiple native ability effects from one cast produce one prompt per target/turn. |
| Flesh to Stone | Constitution at target turn end while Turning to Stone is tracked. The successful-initial-save Unable to Move effect never gets this trigger. Counters, Petrified transition and concentration duration decisions remain manual. |
| Sleep | One Wisdom follow-up at the affected target's next turn end. No further prompts for that effect instance. Transition to Unconscious, success cleanup, waking/damage and exceptions remain manual. Native duration is not extended. |
| Antipathy/Sympathy | A target turn-end save card. It does not automatically open/roll a save: GM/owner confirms the creature ended more than 120 feet from the spell target and uses Confirm eligibility - Roll save. Eligibility, damage interactions, effect removal and temporary immunity remain manual. The source-object Antipathy/Sympathy effects are not the triggered creature effects. |

Each helper strips initial damage and applied effects, preserves the original cast/DC and native changes, spends no resources and uses existing owner routing, GM fallback, NPC save settings, Pending and result visibility. Native source items are unchanged. Completed outcomes do not automatically remove these effects.

GM Stop repeat saves on a prompt-only card pauses future prompts for that target/cast without deleting or disabling the effect. This is useful once Contagion/Flesh to Stone counts are resolved. Refreshing from a new cast resets the paused state. Sleep's single follow-up consumes its trigger on card creation; use the same Pending card if a save dialog was canceled. Removing or disabling an effect, disabling its recipe, or external turn automation prevents future automatic prompts.

No turn-end save was added for Bestow Curse (start-turn option), Compulsion (after compelled movement), Compelled Duel (conditional ending), Eyebite (outcome-specific ending), Befuddlement (30-day save), or Phantasmal Force (Study action/check). Handle these at the table.

Validation: fresh casts and each native Contagion option; target end-turn card; canceled/pending saves; no initial damage replay; pass/fail leaves conditions untouched; Sleep only once; GM pause with condition still active; two Contagion variants same cast do not duplicate; Antipathy eligibility remains manual; ordinary spell workflows continue unchanged.
