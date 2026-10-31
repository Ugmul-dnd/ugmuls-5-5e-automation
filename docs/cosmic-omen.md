# Cosmic Omen

The Stars Druid world setting enables the Long Rest note: “Cosmic Omen Roll will follow Long Rest.” After a completed Long Rest, roll 1d2 and replace the old omen buff. Even grants Weal; odd grants Woe. The native feature restores its Wisdom-based charges through the normal Long Rest workflow.

When an attack, saving throw, or ability check card is created, record which Druids have an active omen and can see the rolling creature within 30 feet. Self is eligible. This is a one-time snapshot: no token movement, resource change, or combat-turn hook adds Cosmic Omen to old cards. Cards created before enabling the feature or receiving an omen are not backfilled.

To use Cosmic Omen in the chatlog:

1. Find the small Cosmic Omen icon on the attack, save or ability check card you want to adjust. The Druid’s owner and GM can use it, including when the roll is inside a grouped card.
2. Hover over the icon to see Weal or Woe, the Druid’s name and any reason it is unavailable.
3. Click the icon to roll the bonus die for that test. Weal adds the result; Woe subtracts it. This spends one Cosmic Omen charge and, in combat, the Druid’s Reaction. You do not need to select a target: the action adjusts the roll on that card.
4. Use it before damage or effects are processed. If the icon is disabled for that reason, ask the GM to undo the relevant application first. If the Reaction or charges are already spent, no icon is added to a new card. Restoring them does not add icons to older cards. Incapacitation also prevents use.

Moving into range afterward does not add an icon to an older card. Only cards eligible when they first appear receive it.

Owners and GMs see a small Cosmic Omen icon on eligible standalone or grouped cards. Hover for Weal/Woe, Druid name, and availability. Clicking rolls the native activity’s die, adds or subtracts it from the existing test, consumes one native charge and tracks the Druid’s combat Reaction. It preserves original dice, critical/advantage state and targets. GM authority revalidates ownership, the original buff, charge, reaction and adjustment locks; it does not check range again.

An already processed HP/effect result disables the icon and displays: “Effect/Damage already processed, ask GM to undo for effect”. Shared Undo lock handling restores the original snapshot’s controls when the relevant processing is undone. A failed adjustment refunds its charge and reaction marker.

Automated tests cover range/sight work counts, snapshot persistence, standalone/grouped rendering, original dice preservation, parity, permissions, GM dispatch, native resources/reactions, rollback, concurrency and Undo locks. In-game GM/player confirmation remains necessary.

A successful adjustment displays its actual signed result, for example “Cosmic Omen — Weal: +4 (Druid)”. For a newly rolled initiative card, the adjustment also updates the explicitly linked combatant in the tracker. A superseded initiative card cannot change the newer initiative roll.

Disposition is recorded relative to the Druid when the card appears. Friendly tests offer Weal on failure; hostile tests offer Woe on success. Opposite-side options are hidden. Neutral creatures have no side restriction: Weal is useful on failures and Woe on successes. When no DC or attack outcome is known, the appropriate option remains a manual choice. Each roll is checked separately. Attacks use their recorded hit/miss outcomes, including mixed target outcomes. A kept natural 1 or 20 hides both options; discarded advantage/disadvantage dice do not count. Changing disposition or moving later does not change the saved relationship or range.
