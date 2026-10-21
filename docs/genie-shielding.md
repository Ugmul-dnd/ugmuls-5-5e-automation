# Genie Elemental Shielding

Use the owned Aura of Elemental Shielding feature from Heroes of Faerûn. On its chat card, click Cold, Acid, Fire, Lightning or Thunder Shielding. The click is the explicit choice and applies to that Paladin, regardless of selected/targeted tokens. No target is required, and current targets are preserved. The owning player can apply the choice directly, including on a GM-authored card; the connected GM handles aura propagation. The native Apply button and target picker are hidden on this card. If D&D5e omits its native player effects tray, the module supplies this chooser for the owning player/GM only, without changing global permissions. Retarget is unavailable for this feature. Other utility cards retain their normal controls.

One applied shielding choice is kept, updating the existing self-selection rather than stacking copies. Previous native transfers are disabled and old applied copies from this same feature are removed. Unrelated resistances are preserved. Reclicking the current option does not reapply the buff; clicking another switches it. The native card stays reusable. No charges, Reaction or Bonus Action are consumed by this choice.

This feature is always excluded from automatic buff application. No elemental resistance is invented before a choice. The unified Paladin aura reads the actual selected effect, propagates it through its one region, and updates existing recipients. Disabling/removing the choice removes the propagated resistance. Native source effects are not edited in the compendium. Only the Paladin's owned copies are adjusted.

## Foundry checks

- Enable automatic buffs, target another character, then use the feature. Verify no resistance is auto-applied.
- Click Fire Shielding on the card. Verify one Fire selection on the originating Paladin and Fire resistance on eligible aura recipients.
- Click Cold on the same card, then another older card. Verify only the newest shielding choice remains and allies switch resistance.
- Shift-click another option and verify it still selects only one. Confirm unrelated resistances remain.
- Disable the chosen self effect. Verify the aura loses that elemental resistance. Click the card again to restore/switch it.
- Repeat from the owning player with a connected GM. Confirm an unrelated player cannot select for the Paladin.

Automated coverage: tests/genie-shielding.test.mjs and tests/paladin-auras.test.mjs. Live Foundry verification remains required.
