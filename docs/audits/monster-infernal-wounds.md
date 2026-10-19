# Infernal wounds

Two Trigger Automation Library defaults cover Bearded Devil Infernal Glaive and Horned Devil Infernal Tail. Native source items are not edited.

| Feature | Initial wound gate | Turn-start HP loss | Stanch action |
| --- | --- | --- | --- |
| Infernal Glaive | Confirmed hit, then native DC 12 CON save | Native 1d10 HP loss | DC 12 Wisdom (Medicine) |
| Infernal Tail | Native DEX save and initial damage retained; failure applies wound | Native 3d6 HP loss | DC 17 Wisdom (Medicine), matching description |

Both book items lack a wound effect. Temporary save data therefore adds Infernal Wound, links it to failed saves, and persists a corrected activity snapshot so native card lookup cannot lose it by resolving the original empty source. Glaive uses a confirmed-hit, dice-delayed save-only helper without another damage roll/resource spend. Tail wraps its original Save use and preserves activation, consumption, DC and initial damage. Existing Auto Apply Saved Effects controls wound application; manual Apply also works.

Wounds do not stack, including across both devil types. Applied copies get a fresh one-minute native clock and instance. Reusing an old inactive effect refreshes its tracking; reapplication cannot extend an already-active wound. Native expiry owns timed removal, while tracking also rejects effects past their deadline.

On the wounded creature's turn start, a neutral roll card rolls the native follow-on formula and offers Apply HP loss / Undo HP loss plus an optional Stanch wound action. Auto Apply Damage also applies this loss automatically after dice; otherwise the GM clicks Apply. This is HP loss, not damage: update HP directly, leave temporary HP untouched, bypass resistance/vulnerability/immunity, and do not emit damage/concentration-trigger events. Undo refunds actual HP lost up to current maximum and does not reopen a closed wound. Turn stamps and application ledgers prevent duplicates.

Stanch asks the clicking user to choose a creature they own, preferring the wounded creature. It opens a native Wisdom (Medicine) roll at the specified DC. The active GM validates its source and removes the current wound instance after successful dice finish. No action expenditure or 5-foot distance check is automated; those remain table decisions. Disable/delete the wound manually for exceptional treatment.

A spell must actually restore HP to close the wound. Temporary HP, potions and ordinary non-spell features do not qualify. Regenerate's recurring helper retains spell provenance. Pre/post native HP application captures real HP gain, waits for animations and closes active wounds. Player-applied healing relays through the active GM with ownership/source checks. Shared closure locks prevent treatment/healing duplicate deletion. Healing Undo does not automatically reopen a wound.

Validation: both native source fixtures, effects on failure and source preservation, corrected snapshot lookup, initial hit save/duplicate guard, native Tail consumption and damage retained, no stacking, source clock and reused-effect refresh, neutral HP-loss roll/apply/Undo with temp HP unchanged, Medicine checks/failure/success/animation wait, spell versus potion/temp-HP healing, Regenerate provenance, player healing relay and one-minute expiry. All 101 regression tests pass.

In-game: fresh Infernal Glaive hit, fail CON, confirm wound. At target turn start verify HP loss and temporary HP unchanged. Test Stanch at DC 12. Repeat with Horned Devil Tail for 3d6 loss and DC 17 treatment. Cure Wounds should close either wound; potion healing should not. Multiple hits must not create multiple wounds.
