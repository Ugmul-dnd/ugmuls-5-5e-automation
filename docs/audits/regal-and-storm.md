# Regal Presence and Storm of Radiance

## Jallarzi's Storm of Radiance
- Native PHB phbsplJallarzisS, save dnd5eactivity000: CON, half on success, Radiant and Thunder formula (@item.level - 3)d10 for each type. Preserve cast scaling for repeat saves.
- Native initial save remains. Region events tokenEnter/tokenTurnEnd, everyone, once per target per turn, shared initial/repeat cards.
- Senses Overwhelmed rzddpZZZN48oTgyo is Region-managed, not a failed-save effect: blinded/deafened/silenced while inside, including successful saves; removed on exit/deletion through existing native Region effect workflow. Preserve native changes and verbal-spell restriction status. Do not add duplicate Region Conditions or apply it from the save/damage card.

## Yolande's Regal Presence
- Native PHB phbsplYolandesRe, Surround Self utility OJHRKWz8JvLzyl9R places the self-origin 10-foot aura. Emanation Save dzeoGwKOPG7PHbyE is WIS, 4d6 Psychic, half on success. Do not use Surround Self as a repeat-save activity.
- Default template creation on initial Surround Self; the player can change it in the usage dialog. Existing self-emanation placement attaches to the caster. Exclude caster via Region source metadata.
- Initial occupants go through the same tokenEnter handler, targeting and once-per-turn limiter; repeat events entry only (table ruling), hostile-only default, shared cards. Surround Self itself does not seed an already-resolved save allowance.
- Reuse the area Prone outcome handler from Sleet Storm: after dice, failures apply native Prone/Undo, successes do nothing. Existing Auto Apply Saved Effects controls automatic outcomes; GM can manually Apply Prone. Regal never breaks concentration. Prone persists independently of the aura until standing/Undo. Optional push and sight eligibility stay table-managed.
- Zone of Truth and Conjure Elemental remain manual. No source book changes or new turn scans.

- Storm damage dialog correction: simplify only the native (@item.level - 3)d10 die-count expression in transient roll configuration; level 6 displays 3d10 for each type. Original book and actor spell data stay unchanged.
