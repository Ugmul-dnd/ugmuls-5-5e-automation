# IMP-006: Make refresh-rule and scheduling coverage easier to audit

[Findings register](README.md) · [Index/refresh guide](../guides/finding-and-refreshing-cards.md)

- **Status:** Proposed investigation; no runtime change.
- **Type:** Test/documentation coverage opportunity, not a reproduced performance defect.
- **Recorded/source reviewed:** 2026-11-09, `v1.0.1-dev`.
- **Authorization:** Record findings during the documentation review. Runtime/test-harness changes are not part of this pass.

## Evidence and current connections

[chat-refresh.js](../../scripts/chat-refresh.js) centralizes feature rules, while feature modules register the document hooks that request work. The rule's setting, feature/grant/effect gate, allowed message types, actor relationships, and snapshot flag must agree with those callers and renderers.

The local refresh fixture contains many explicit feature cases, but the reviewed source does not establish comprehensive coverage of every rule, true player-client selection, batches larger than eight, new requests during an awaited render, or individual render-error reporting. The current `Promise.allSettled` isolates failed cards but does not inspect rejected results for diagnostics. These are questions to audit, not claims that all those cases lack tests anywhere in the suite.

The generic [chat-message-index.js](../../scripts/chat-message-index.js) and the private HP index in [shared-activity-card.js](../../scripts/shared-activity-card.js) also have different maintenance contracts. Both should remain documented and tested if a later consolidation is considered; similar names do not establish interchangeable behavior.

## Proposed review

Consider a maintained rule-to-caller-to-test matrix before changing the implementation. It could identify missing coverage and stale rule names without flattening feature-specific actor/socket/Undo scenarios into one generic test.

Possible matrix fields: rule key, setting, triggering hooks/documents, removal evidence, message types, own/incoming/snapshot scope, renderer, existing regressions, and planned in-game scenario. Determine whether manual documentation or lightweight validation is most useful before building tooling.

## Future verification plan

- [ ] Inventory current rules and representative callers, including actual changed-document forwarding and unknown/removed-rule behavior.
- [ ] Search all local tests before declaring a coverage gap. Tests/tools are ignored and may require the local backup in a fresh checkout.
- [ ] Exercise more than eight queued cards with deterministic counters/controlled Promises: verify batch size, yielding, deduplication per pass, and new requests during rendering. Avoid brittle elapsed-time thresholds.
- [ ] Verify player-side ownership, disabled settings, removed grants, mounted/grouped windows, direct unmounted requests, and deletion before rendering.
- [ ] Decide whether rejected renders need contextual diagnostics; preserve isolation and avoid retry loops/render-driven flag writes.
- [ ] Preserve original dice, source/target links, Reaction/resource timing, and Undo. The queue remains presentation-only.
- [ ] For any shared runtime or harness change, run relevant regressions then the full runner with checks. Record results and limits.
- [ ] In Foundry, check Bardic Inspiration, Shield, Parry, reaction resets, grouped cards, private visibility, and Apply/Undo after overlapping resource/effect changes. A significant performance change also needs a comparable large-battle capture.

## Record

- **Implementation:** None.
- **New scheduling/fault-injection scenarios:** Not run for this proposal.
- **In-game results:** Not run.
- **Next step:** Establish a specific missing contract/check before proposing consolidation or new instrumentation.
