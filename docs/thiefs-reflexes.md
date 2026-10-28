# Thief’s Reflexes

Enabled by default under Rogue automation. The active GM adds an extra tracker entry for a token whose actor owns Thief’s Reflexes once its Initiative is set. It uses the same actor and token, at the original Initiative minus 10, and disappears after round one. No extra token, item charge or manual Initiative roll is required.

The entry mirrors Initiative, name, portrait, hidden and defeated state. Removing the original entry or feature removes the managed entry. Disabling the setting removes managed entries only. Reloading reconciles entries without creating duplicates. Restarting the encounter allows the feature again.

Both entries are real turns: normal start/end-turn effects, regions, resource recovery and Sneak Attack turn tracking run on each. Reaction tracking recognizes both as the actor’s own turn. Existing token-based auras remain linked to their single source token. The extra entry is removed only after native round-transition processing finishes, preserving its last turn-end effects.
