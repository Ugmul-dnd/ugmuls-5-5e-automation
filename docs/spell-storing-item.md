# Spell-Storing Item

The revised Artificer feature adds **Prepare a spell-storing item after this rest** to the Long Rest dialog. It is checked by default. After successful rest completion, follow three steps. You can also open the same wizard manually using the feature’s **Store Spell** activity:

1. Choose the Artificer, another party character, or a friendly NPC with a token on your current map. Duplicate linked tokens appear once. The GM resolves the requesting player’s scene and supplies eligible inventory entries even when the player does not own or have access to that character. GM-controlled party characters are eligible. Off-map, hostile and player-hidden tokens are excluded from the player’s list.
2. Choose a Simple/Martial weapon or a focus usable by the Artificer in that character’s inventory.
3. Choose an eligible Artificer spell and select **Store Spell**.

Back and Cancel do not change the current stored spell. The native Artificer spell list supplies unprepared spells as well as owned Artificer spells. Only levels 1–3, action casting times, and spells without consumed material components are offered.

Setup creates **Stored Spell — [spell name]** on the selected item using the native Cast activity, with twice the Artificer’s Intelligence modifier uses (minimum two). It consumes its own activity charges, not the weapon’s other uses or the holder’s spell slots. Attack/save overrides and scoped roll data use the Artificer’s values recorded during setup. The holder remains the spell actor and handles concentration.

The holder uses the spell through the item. The native cached spell is kept out of the spellbook so activation cannot bypass the item’s use guard. During combat, a holder must wait until their next turn starts before activating the same stored spell again. The GM validates and reserves activations; cancellation releases the reservation.

Completing setup retires only that Artificer’s previous managed activity, cosmetic enchantment and cached spell. It leaves the underlying weapon/focus and unrelated enchantments intact. Creating a new assignment is staged before removing the old one; failed setup restores the prior assignment. An active GM is required for access to other party inventories and mutations.

Verification: `tests/spell-storing-item.test.mjs` covers eligibility, party inventory selection, cancellation/Back navigation, native Cast configuration, scoped roll data, charges, replacement and rollback, request validation, and holder-turn/concurrent-use guards. Live GM/player casting and concentration still require in-game verification.
