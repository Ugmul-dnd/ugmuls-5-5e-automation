# Blink automation

Blink keeps the original cast card available. During the caster’s turn, the owner or GM can click **Roll Blink**. At turn end, the active GM rolls automatically if that combat turn has not already been claimed. A persisted turn stamp and GM queue keep manual clicks, multiple clients and repeated combat updates from producing extra checks. No new spell resources are spent by these checks.

On 4–6, the module applies its own Ethereal effect after dice animations. It clears that effect at the caster’s next turn start and displays a return-position reminder. The point where the token vanished is recorded. Players/GM move the token manually and adjudicate visibility, occupancy and plane interactions. The token is not hidden. Other sources of Ethereal are preserved.

Blink has a one-minute tracking effect. Ending, disabling or expiring that effect clears its Ethereal state. The Trigger Automation Library entry enables/disables automation for new casts; existing trackers still return the creature at turn start. An active GM and combat are required for manual/automatic turn checks. Existing spells are not backfilled; reload and cast fresh for testing.

## In-game validation

1. Cast Blink. Confirm the card appears without an immediate automatic check or Ethereal application.
2. Click Roll Blink during the caster’s turn, then advance. Confirm turn end does not roll again.
3. Skip the manual click next turn. Confirm exactly one automatic turn-end roll.
4. On 4–6, verify Ethereal appears after dice finish. At next turn start, verify it clears and a return reminder appears.
5. End Blink while Ethereal; verify only its Ethereal effect is removed. Check one-minute expiry too.
6. Test player/GM simultaneous clicks and another user’s lack of roll permissions.
