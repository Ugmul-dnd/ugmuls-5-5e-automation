# IMP-003: Investigate recovery after partial pending-workflow failures

[Findings register](README.md) · [Pending workflow guide](../guides/pending-cast-and-damage.md)

## Summary

- **Status:** Proposed investigation; no runtime change.
- **Type:** Failure-path coverage and recovery question. No reported production failure is reproduced by this note.
- **Recorded/source reviewed:** 2026-11-09, `v1.0.1-dev`.
- **Authorization:** Record review findings only. Fixes require a separately authorized implementation task.

The pending workflows have multiple awaited mutations and explicit commit/session boundaries. Their normal-path fixtures cover many cancellation and takeover cases. A future review should establish what happens when an intermediate document update, cleanup, or acknowledgment fails after earlier work succeeds.

## Observed source order and open questions

| Source connection | Observed behavior | Question to test, not an established incident |
| --- | --- | --- |
| [pending-cast.js](../../scripts/pending-cast.js), `settlePendingCast` | Sets `state.committed = true` before awaiting old-concentration removal and the card update; session removal happens afterward. | If either await rejects, can the user recover the display/session safely without refunding a committed action or repeating concentration mutations? |
| Same file, `cancelPendingCast` | Stores a cancellation Promise and performs task waiting, callbacks, native refund, marker/effect/template cleanup, card deletion, and session removal in order. | If cleanup rejects halfway through, which steps succeeded, what remains, and can retry recover without duplicate refunds? |
| Same file, session state | Full cast state is in a local Map; only identifying/presentation flags are persisted. | What recovery is expected after reload/disconnection during a pending use? Avoid assuming automatic refund reconstruction exists. |
| [pending-damage.js](../../scripts/pending-damage.js), `damageOperation` | Publishes completed data, then restores the prior Dice So Nice skip flag in `finally`. | If restoration fails after the completed update, can callers distinguish successful publication from subsequent cleanup failure? |
| Same file, `operate` | Rejects a socket request when no matching reply arrives before the timer. | Can a delayed/lost reply occur after a successful mutation, and how should the user reconcile the live card instead of assuming no change? |
| Cast cancellation and linked roll cards | Cancellation explicitly deletes the usage card and selected result objects, without enumerating every pending roll card. | Which target/roll cancellation paths leave retry placeholders, and which are expected to clean them elsewhere? Trace actual hook/dialog ordering. |

## Affected tools and features

Direct subjects are pending cast and pending damage. Representative connected workflows are target confirmation, native consumption/refunds, concentration replacement, Reaction/resource tracking, damage configuration/publication, Dice So Nice coordination, and shared-card target synchronization.

Important downstream examples are spell-slot uses, Divine Reaper's additional consumption/refund, rebuilt Activities, placement-only Regions, and Land's Aid/Chalice healing retries. This is a review scope, not a complete importer inventory or evidence that every example fails.

## Proposed investigation boundaries

First reproduce selected failures in isolated local fixtures and document the actual outcomes. If code changes are warranted, propose explicit completion/cleanup states and safe retry behavior before implementation. Preserve native validation, committed-use protection, source identity, resources, original dice, and normal cancellation semantics.

Do not promise general atomic rollback, add background polling, or turn this into an unrelated resource/authority rewrite. Any persisted recovery design needs its own permission and data-lifetime review.

## Verification plan

- [ ] Inspect existing pending-cast/damage tests and related extension callbacks for fault coverage.
- [ ] Inject one failure at a time around concentration ending, refunds, marker updates, effect/template deletion, usage-card updates/deletion, and skip-flag restoration. Record before/after state and callback counts.
- [ ] Simulate delayed/lost replies separately from failed operations; check the live card and session before retry.
- [ ] Verify both original error reporting and continued operation where recovery is intended. Never hide a failed cleanup just to obtain passing tests.
- [ ] If runtime work is approved, run relevant regressions first, then `node tools/run-tests.mjs --checks` for the shared change. Tests/tools remain local and Git-ignored.
- [ ] Perform controlled Foundry checks for target/first-roll cancellation, concentration replacement, GM/player takeover, and the selected retry paths. Record exact settings and which resources/cards remain.

## Implementation record

- **Changes:** Documentation only.
- **Fault-injection results:** Not run; questions remain open.
- **In-game results for this investigation:** Not run.
- **Next step:** Select and reproduce a failure scenario before proposing a fix.
