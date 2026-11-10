# IMP-NNN: Short descriptive title

Copy this template to a new finding file; replace the placeholders and add it to the [register](README.md).

## Summary

- **Status:** Proposed.
- **Type:** Consolidation opportunity / confirmed defect / unverified idea.
- **Recorded:** YYYY-MM-DD.
- **Last source review:** YYYY-MM-DD; branch or commit.
- **Authorization:** Proposal only; implementation not yet requested.
- **Question or problem:** What did we observe, and why might changing it help?

## Evidence and current behavior

Link the actual source and name the relevant functions, hooks, flags, and settings. Separate observations from assumptions. Explain when the behavior happens and which client can change documents.

## Connections and affected features

| Shared tool or caller | Current responsibility | What could be affected | Review status |
| --- | --- | --- | --- |
| Add source link | Describe the call | Describe behavior to preserve | Not reviewed |

State whether the list is complete, how it was found, and what indirect dependencies still need checking.

## Proposed change and boundaries

Describe the smallest useful improvement, alternatives, and behavior that must remain unchanged. Record unresolved questions rather than inventing a shared rule. Distinguish a pure helper from feature eligibility, document mutation, and rendering.

## Automated verification plan

- [ ] Identify existing regression cases and the local runner filters that select them.
- [ ] Add meaningful coverage for newly identified failure cases if implementation needs it.
- [ ] Run relevant checks first, then the full suite with checks when required by the repository instructions.
- [ ] Record exact commands, results, and verification limits after running them.

Local tests and tooling are Git-ignored. Do not imply they exist in a fresh checkout or link to them as publicly available files.

## In-game verification plan

| Scenario and setup | Expected behavior | Status | Observed result, date, and observer |
| --- | --- | --- | --- |
| Specify feature, setting, actors, and trigger | State a visible result | Not run | Pending |

Include the relevant GM/player, targeting, cancellation, resources, roll preservation, effect timing, and Undo scenarios. Select cases based on the actual change rather than treating every possible scenario as mandatory.

## Implementation and follow-up

- **Implementation commit:** None.
- **Automated results:** Not run for this proposal.
- **In-game results:** Not run for this proposal.
- **Documentation updated:** List the affected guides after implementation.
- **Remaining gaps or decision:** Record what still needs resolution.
