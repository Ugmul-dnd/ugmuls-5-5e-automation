# Arcane Firearm

Arcane Firearm Assistance is enabled by default under Artificer settings. For an Artificer spell, choose **Arcane Firearm (cast through firearm): Yes** in damage configuration. This confirms that the firearm was used as the focus; the book does not record that choice. The option starts at No.

The same damage card gains a 1d8 bonus with the selected spell damage type. Mixed-damage spells offer a damage-row selector. The separately rolled bonus die does not double on critical hits. No feature uses or other charges are consumed.

The originating cast records its use, preventing another bonus on later attack or damage cards from that cast. A fresh cast allows a fresh bonus. Cancelling or previewing a prompt records nothing. Undoing damage does not restore the cast's bonus. Shared area damage includes the bonus in the shared roll, following the normal saves and damage application.

The spell must be assigned to Artificer through the native spell class/source field. Spells belonging to other classes, unassigned spells, weapon attacks and Eldritch Cannon activities are excluded. Damage without an identifiable originating cast is excluded so it cannot accidentally receive unlimited bonuses.

## Foundry verification

- Reload clients. Cast an Artificer damaging cantrip or save spell through the firearm, select Yes and verify one typed d8 on the damage card.
- Check a critical spell attack: its normal dice follow critical rules, while the firearm adds one d8.
- Check a mixed-damage spell and choose the intended damage row.
- Roll more damage from the same cast and verify the bonus cannot repeat. Cast again and verify it returns.
- Cancel a damage prompt, then reopen it and verify the cast remains unused.
- Verify other-class spells and cannon attacks do not offer the feature.

Automated coverage: tests/arcane-firearm.test.mjs. Live Foundry verification remains necessary.
