# Heroism and Regenerate

Both built-in recipes track native creature effects and add only turn-based healing. Sources are the installed PHB spell activities and effects; no book item changes are written.

| Spell | Native initial use | Recurring benefit |
| --- | --- | --- |
| Heroism | Native temporary-HP healing and Bravery effect. Bravery keeps its Frightened immunity change and concentration duration. Upcast recorded recipients are retained. | Target turn start grants temporary HP equal to the caster spellcasting modifier recorded on effect application, clamped at zero. Native temporary-HP replacement keeps the higher existing value and never stacks. |
| Regenerate | Native 4d8 + 15 healing and Regenerating effect with its one-hour duration. | Target turn start restores exactly 1 HP. No repetition of initial healing, scaling or body-part logic. Native HP maximum applies. |

Fixed turn benefits create a resource-free, single-target native healing usage/card without a recurring roll dialog. They respect Auto Apply Healing; with that setting off, Apply remains manual on the card. Native application supplies HP caps, temporary-HP replacement, existing modifiers, and Undo history. Buff-effect automation adds each spell's native effect only after its initial healing result is complete and dice finish. Auto Apply Buffs can be disabled for manual initial effect application. A canceled/pending initial roll cannot automatically apply its ongoing effect.

Effect records retain the original cast level, source message/concentration links and Heroism modifier. Expired, disabled or removed effects stop future triggers; disabled recipes and external turn macros are respected. Repeated turn updates cannot create multiple cards for one effect/event. Helpers carry no native effects, use no slots, replay no cast animation and never reapply themselves as buffs. Target turns progress independently of healing completion. Healing does not trigger damage-taken saves. Retained HP/temporary HP is not removed when the spell ends.

Creature Effect Triggers exposes enable/disable, target turn start/end and caster-modifier/fixed-amount controls, with reset and information tooltip. Library source creation recognizes these two native heal-only spells. Source book items, native initial healing, native stat changes, and Region configuration are unchanged. Body-part regrowth remains manual. Out-of-combat regeneration still requires manual management; this feature follows combat turns.

Fresh-cast validation: Heroism on one and multiple upcast allies; higher/lower existing temporary HP; Frightened immunity; cast cancellation before healing; turn start with no duplicate dialog/card; concentration ending; native initial Regenerate healing followed by 1 HP, HP-cap/zero-HP behavior; manual and automatic healing; disabled/expired effects; connected players and GM; effect Undo/reapplication; reset/custom amounts.
