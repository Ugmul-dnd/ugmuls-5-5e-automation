# Power Word Stun

Built-in creature trigger follows the PHB native Stunned effect. At the affected creature’s turn end, create a temporary Constitution save using the caster’s spell DC recorded on effect application. Route via existing connected-owner / GM fallback and NPC automatic-save settings. Failure retains the effect; success removes only that effect after local and connected-client dice animations. Turns remain unblocked.

The installed spell has a utility activity and two native effects, with no save activity. The module supplies a disposable save-only helper; it spends no slot, repeats no spell cast or animation, deals no damage and applies no new effects. Existing native status, duration and stat changes are preserved. No Movement (the above-150-HP outcome) is deliberately not tracked. Initial effect choice and the HP threshold remain the native/manual workflow; this addition automates the later save, not initial effect selection.

Validate on fresh casts: apply Stunned, advance that creature’s turn, test failure/success and dice timing, player-owner / disconnected-owner routing and NPC automatic rolls. Apply No Movement separately and confirm no repeat save. Disabling or removing Stunned stops later prompts. World Challenge Visibility controls displayed DC/results.
