# IMP-008: Audit application/history durability and partial Undo recovery

[Findings register](README.md) · [Results and Undo guide](../guides/applying-results-and-undo.md)

- **Status:** Proposed investigation; no reproduced production incident.
- **Type:** Failure-boundary and history-contract review.
- **Recorded/source reviewed:** 2026-11-09, `v1.0.1-dev`.
- **Authorization:** Document findings only; no application/Undo refactor is authorized by this note.

## Evidence and connections

[damage-undo.js](../../scripts/damage-undo.js) captures native HP changes and effect snapshots, then writes history to chat documents. [npc-damage-automation.js](../../scripts/npc-damage-automation.js) has an early claim plus per-target completion records. [effect-automation.js](../../scripts/effect-automation.js) uses local pending/completed guards and persisted applied flags. [hit-effect-reapply.js](../../scripts/hit-effect-reapply.js) deliberately runs follow-up effects after the HP-history queue commits, allowing effect retry without replaying HP.

Those operations are ordered, but they span several document writes and sometimes clients. Existing normal/partial/Undo fixtures do not by themselves establish atomic mutation-plus-history persistence. IMP-003 covers unfinished actions; this entry focuses on applied results and their recovery records.

## Questions to investigate

| Boundary observed in source | Specific question |
| --- | --- |
| Native effect mutation precedes `effectUndoHistory` write | What recovery/diagnostic path exists if the effect succeeds but recording rejects? Avoid applying the effect twice just to reconstruct a record. |
| Actor HP changes can be followed by a player-to-GM recording request | What happens on disconnect, lost request, or history-write failure after HP already changed? The current permission/number checks are not a second dice calculation. |
| HP Undo clears an applied flag then removes history after each restored actor | Do failures retain enough state for a safe retry, especially when an Actor update succeeded but record removal failed? |
| Effect Undo checks source identity, restores/deletes, then consumes the record | Can a retry distinguish a completed effect restoration from a failed history write without overwriting a newer application? |
| Buff application tracks local completion and writes a persisted applied flag | What happens if publication of that flag fails or the client reloads after partial work? |
| Automatic HP claim and target completion are distinct | Are controls/retries correct when the claim exists but no/all/some recipients completed? |
| Direct targeted renders exist beside the shared refresh queue | Which calls require immediate workflow feedback, and which could safely be queued later without changing lock/Apply timing? This is a separate decision from durability fixes. |

These are investigation leads derived from write order, not reports that every boundary is failing. Do not assume one general transaction wrapper will fit native statuses, temporary HP, Ward metadata, and refreshed effects.

## Future verification plan

- [ ] Inventory records, source identities, authority checks, and actual failure coverage before proposing changes.
- [ ] Inject one rejection at a time around Actor/effect mutation, history persistence/removal, completion flags, and recording requests. Capture exact successful work and remaining records.
- [ ] Verify retries do not duplicate HP, refunds, or effects; retain newer effect sources and unrelated later HP changes.
- [ ] Cover missing actors/effects, capped/zero-change applications, partial recipients, Arcane Ward metadata, and independent HP-versus-effect Undo.
- [ ] Preserve queue ordering: do not call an awaited effect-history task from inside the same occupied history queue.
- [ ] If implementation is requested, run relevant regressions first then the full suite with checks. Tests/tools remain local and Git-ignored.
- [ ] In controlled Foundry sessions, verify GM/player recording, manual Apply/Undo, refreshed-effect preservation, and effect retry after HP application. Record results before claiming durability or recovery improvements.

## Record

- **Runtime changes:** None.
- **New fault-injection checks:** Not run for this proposal.
- **In-game reproduction:** None established.
- **Next step:** Select a specific history-persistence boundary and reproduce its outcome before designing a fix.
