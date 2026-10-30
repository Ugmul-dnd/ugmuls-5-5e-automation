# Alchemical Savant

When the revised feature is owned, spell damage/healing configuration offers **Alchemical Savant (Alchemist’s Supplies)**, defaulting to Yes. Choose No when using another spellcasting focus. Eligible rolls restore actual HP or deal Acid, Fire, or Poison damage; temporary HP and other damage types do not qualify.

The bonus uses the native feature’s Intelligence formula, minimum +1. Mixed spells offer a choice among eligible native spell damage parts. The flat bonus joins the original damage/healing card, retains its selected type and does not double on a critical hit. Shared area rolls follow normal target/save application.

One use is recorded on the originating casting. Later beams, ongoing damage, and healing from the same casting cannot add it again. Previewing, selecting No and canceling do not claim it. Failed configuration/evaluation releases the claim; ordinary HP Undo/reapply preserves the existing roll and does not grant another use. A connected GM serializes player requests.

A live native Savant enchantment on the spell prevents adding a second bonus. Non-spell activities, item-produced spell effects, and the managed Spell-Storing Item workflow are excluded. Skipped damage/healing dialogs follow the same default-Yes policy.

Automated coverage: `tests/alchemical-savant.test.mjs`. Live GM/player healing and damage remain to be verified in Foundry.
