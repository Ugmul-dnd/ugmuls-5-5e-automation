# Alchemical Eruption

Chemical Mastery adds **Alchemical Eruption — [target]** to an Artificer spell’s damage card after that target actually loses HP or temporary HP from Acid, Fire, or Poison damage. Use the button on the resolved card, including inline grouped cards. Area spells can offer several eligible targets; choosing one consumes the turn’s use.

The spell must be assigned to Artificer, the casting and damage must be current, and it must be the caster’s own combat turn. The native Alchemical Eruption activity-use pool is spent, sharing availability with manual use. Ordinary activity recovery restores it at turn start; the automation also records the turn to prevent duplicate requests. Existing old cast cards cannot become new triggers on subsequent turns.

The GM validates the caster, source card, recorded recipient and native resource. The follow-up rolls the native Force damage without critical doubling, against only the selected target. The independent native damage card keeps Force resistance/immunity and Undo normal; the original spell’s save multiplier does not halve this bonus.

Eligibility records real typed damage after native resistance, immunity, saves and other calculation rules. Immunity to the qualifying type does not qualify merely because another damage type hurt the target. Zero damage, Evasion, previews, HP Undo, non-Artificer spells and item-produced stored spells do not activate it. Canceling is simply leaving the optional button unused. Failed damage rolls refund the native use and turn marker.

Automated coverage: `tests/alchemical-eruption.test.mjs` and the Chemical Mastery cases in `tests/chat-refresh.test.mjs`. Live GM/player verification remains necessary.
