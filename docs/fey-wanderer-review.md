# Fey Wanderer review

Status: Complete for the current automation pass; Dreadful Strikes, Beguiling Twist and Misty Wanderer tested by the user. Fey Reinforcements and shared teleport placement remain manual by choice.

2024 Player's Handbook, reviewed October 27, 2026.

- Dreadful Strikes: weapon damage configuration Yes/No, default Yes. Separate Psychic roll: 1d4, increasing to 1d6 at Ranger level 11. Native critical permission respected. Requires one recorded, confirmed weapon-hit target and ownership of the Ranger.
- Once per turn is tracked per creature for this Ranger, not once for the whole turn. Two different creatures can each take the bonus; repeated hits against the same creature cannot. Linked representations of the same actor share a use; unlinked creatures remain distinct. New combat turns reset eligibility, including off-turn attacks. Outside combat no turn cap is imposed.
- Preview, No and cancellation spend nothing. Pending dialogs reserve only their own creature. Store only the latest turn's target list on the Ranger; no additional effects or resource charges.
- Uses the corrected native Configuration fieldset lookup for AC5e compatibility and the recorded damage-card actor for player prompts.
- Beguiling Twist: trigger manually. Caster/GM selects Charmed or Frightened on the initial save card; no default condition. Only failed saves can receive the chosen one-minute effect. Automatic saved-effect application follows the world setting, with an explicit Apply button available after failure. End-turn Wisdom repeat saves reuse the recorded DC and end the effect on success. Choice locks after application and reopens after effect Undo. Repeat saves have no condition selector and spend no additional Reaction.
- Misty Wanderer: automatically add a managed native cast activity named Misty Wanderer to owned Misty Step spells. Its native itemUses consumption targets the feature, costs one use, and disables spell-slot consumption. It copies the original spell activity so Bonus Action activation, targeting, effects, chat and teleport hooks stay on Misty Step. Normal casting remains available. Synchronize existing/new actors, features and spells; remove only managed activities if the feature goes away or assistance is disabled. Native resource availability, canceled use and Long Rest recovery apply; no separate charge pool is added. Bringing another willing creature remains manual.
- Otherworldly Glamour and granted spells remain native. Fey Reinforcements remains manual by choice.
