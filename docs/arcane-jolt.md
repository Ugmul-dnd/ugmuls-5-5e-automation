# Arcane Jolt

Enable Arcane Jolt Assistance under Artificer settings (enabled by default). After a confirmed magic-weapon hit, choose **Arcane Jolt — Destructive Energy: Yes** in damage configuration. The Force rider appears on the same damage card. It starts at No. The native feature supplies the damage formula and Artificer scaling, including Improved Defender, and its critical-hit policy.

A Steel Defender summoned using the native Steel Defender feature resolves its owner through the system summon-origin link. Its attacks spend the originating Artificer's Arcane Jolt uses, without requiring a feature copy on the defender. The acting user needs ownership of both actors. Unlinked or manually created defenders are not guessed from their names or player permissions; summon through the native feature to establish the link.

One submitted damage roll spends one feature use. Preview and cancellation spend nothing. During combat the Artificer and defender share one use per turn, including attacks on other creatures' turns. Outside combat a use is spent without creating a turn marker. Healing remains available through the native feature and is not automated here.

## In-game checks

- Confirm a magic-weapon hit, select the rider and check Force damage and one use spent. Cancel another prompt and verify no additional spending.
- In the same combat turn, confirm another hit with the Artificer or defender: the option should show Already Used. Advance the turn and check it returns.
- Use a natively summoned defender as its owning player. Verify the rider uses the Artificer's damage scaling and charges, rather than the defender's resources.
- Check level 9 and level 15 Artificers (2d6 and 4d6 in the default book), a critical hit, depleted uses and a nonmagical weapon.

Focused automated coverage is in tests/arcane-jolt.test.mjs. Live Foundry validation is still required.
