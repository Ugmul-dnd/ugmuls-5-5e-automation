# Flash of Genius

Enable **Flash of Genius Assistance** under the Artificer automation settings. It is enabled by default and uses the actor's native Flash of Genius feature and remaining uses.

A failed ability check or saving throw offers an owned, eligible Artificer's Flash of Genius button. The Artificer can aid themself or a visible creature within 30 feet. The button adds the Intelligence modifier (minimum +1) to the existing roll without rerolling its dice. One feature use is spent even when the adjusted result still fails. A roll can receive Flash of Genius once.

During combat, the existing Reaction Tracker reserves the Artificer's Reaction. Keep Reaction Tracker enabled to enforce that cost. Outside combat, no Reaction marker is created. Players can use their own Artificer to aid another actor through the connected GM. Hidden/blind cards retain their visibility restrictions.

Where no DC is recorded, confirm that the roll failed before spending. Applied damage or effects must first be undone using the existing Undo controls. Initiative, attacks, damage rolls and automatic grapple failures are excluded.

## Foundry verification

Reload GM and player clients, then use fresh cards:

- Fail a save and an ability check. Verify the bonus changes the total and outcome while preserving the original d20, advantage/disadvantage and other bonuses.
- Try a failure too low for the bonus to rescue. Verify one use is still spent.
- In combat, verify a Reaction marker is spent and another Flash is unavailable until the Reaction refreshes. Outside combat, verify only the feature use is spent.
- With another player connected, aid their failed save from an Artificer within 30 feet. Verify the owning Artificer can click, the GM updates the result, and resources are spent once.
- Move out of range or behind a sight-blocking wall, exhaust uses, or incapacitate the Artificer. Verify the option disappears.
- Apply damage/effects, verify the adjustment is unavailable, then Undo and check again. A Flash already used on that roll remains recorded.

Automated coverage: tests/flash-of-genius.test.mjs exercises original-dice preservation, use and Reaction costs, eligibility, visibility, rollback, concurrent clicks and animation waits. Live Foundry verification remains necessary.
