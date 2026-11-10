# IMP-018: Map presentation state and animation completion contracts

[Findings register](README.md) · [Presentation/animation guide](../guides/presentation-and-animation.md)

- **Status:** Proposed investigation; not implemented.
- **Type:** Lifecycle/coverage and possible consolidation opportunity; no new production defect reproduced.
- **Recorded/source reviewed:** 2026-11-10, `v1.0.1-dev`.
- **Authorization:** Documentation/findings only; no changes to rendering, animation timing, preference enforcement, or scrolling.

## Source observations

[card-presentation.js](../../scripts/card-presentation.js) combines DOM visibility/handoff, target-tray initialization, tags/pending rows, an actionable native damage entry, and scrolling helpers. Local state includes `WeakSet` initialization, in-flight handoff guards, message-ID signatures, and per-scroller followers. These lifetimes differ and should be mapped before extracting a presentation library.

[animation-wait.js](../../scripts/animation-wait.js) separates visibility-aware waiting from enforcing the current user's Dice So Nice inactive-tab preference. [npc-damage-automation.js](../../scripts/npc-damage-automation.js) adds request/acknowledgment tracking across clients. [pending-damage.js](../../scripts/pending-damage.js) separately records replay signatures; [save-roll-controls.js](../../scripts/save-roll-controls.js) tracks pipeline promises for new dice.

The current handoff signature Map has no general message-delete cleanup in the reviewed file. Scrolling and client requests have explicit stop/timeout paths, while the underlying animation can continue after the visibility-aware wait releases. These observations identify different cleanup contracts, not a demonstrated memory leak, race, or timing defect.

## Questions and future verification

- [ ] Map document state, per-message-object initialization, message-ID signatures, DOM markers, and active interaction state; establish intended retention/recovery after delete, rerender, reconnect, and setting changes.
- [ ] Inspect long-session handoff-state retention before proposing bounded state or deletion cleanup. Preserve stable signatures that prevent refresh loops.
- [ ] Add deterministic scrolling cases for one follower per scroller, replaced card DOM, user interaction, image/layout changes, and stop/finish cleanup. Avoid brittle elapsed-time assertions.
- [ ] Exercise remote foreground/inactive/disconnected/unresponsive clients through the actual coordinator, including timeout/caller recovery and stale acknowledgment handling. Passing a local wait helper does not prove the complete multiplayer contract.
- [ ] Test pending animation signatures and later corrections together; a signature must suppress replay only for the already handled result.
- [ ] Preserve visibility/whisper filtering, original dice, recorded recipients, exact origin/attack identity, resource timing, reaction decisions, and Undo controls while changing presentation.
- [ ] If extraction is useful, distinguish narrow display helpers from user actions and persistent preference changes. Do not turn DOM rendering into mutation or add independent recent-chat scans.
- [ ] For approved runtime changes, run relevant regressions then the full runner with checks and record Foundry outcomes. Significant performance work needs comparable battle captures, not a claim based only on removed source operations.

## Connections and record

- Refresh scheduling: [IMP-006](IMP-006-refresh-contract-coverage.md).
- Native roll/cache/commit order: [IMP-016](IMP-016-roll-cache-and-commit-contracts.md).
- Pending recovery and application boundaries: [IMP-003](IMP-003-pending-failure-recovery.md), [IMP-008](IMP-008-application-history-boundaries.md).
- **Existing checks:** 12 selected local presentation/animation/pending test files passed during guide creation; the investigations above remain unperformed.
- **Runtime changes/new scrolling or remote-timeout tests:** None.
- **In-game reproduction:** None in this pass.
- **Next step:** Establish one specific retention, scroll, or acknowledgment scenario before proposing changes to the shared paths.
