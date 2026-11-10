# IMP-014: Establish ordinary save retry/guard lifecycle guarantees

[Findings register](README.md) · [Prompting guide](../guides/save-and-damage-prompting.md)

- **Status:** Proposed investigation; not implemented.
- **Type:** Request identity, retry, and cleanup coverage question; no production incident reproduced.
- **Recorded/source reviewed:** 2026-11-10, `v1.0.1-dev`.
- **Authorization:** Record findings only; do not rewrite save routing/session semantics in this pass.

## Source observations

[spell-save-prompts.js](../../scripts/spell-save-prompts.js) adds a token to local `sentTargets` before awaiting shared save dispatch. [save-prompts.js](../../scripts/save-prompts.js) persists `requestedSaveTargets` before sending, then protects local receiver dialogs with a per-message/token Symbol. Empty results/errors release the current guard; successful entries stay in its `prompted` Map, which has no general message-delete hook in that file.

Retries validate requested target, source/owner, and current outcome, close matching deterministic dialog IDs, broadcast cancellation, and allow the clicking owner/GM to receive the retry. Ordinary results do not carry the explicit persisted request/session nonce used by escape checks or pending damage.

Those protocols serve different purposes. The difference alone does not establish a stale-save bug. Native outcome processing and dialog-close behavior must be traced before claiming an old result can affect a new state or that successful guard retention is harmful.

## Questions and verification plan

- [ ] Establish what delivery failures after `sentTargets` registration should permit: automatic resend, manual pending retry, or explicit user recovery. Do not add background polling by default.
- [ ] Reproduce owner/GM takeover while an old dialog is open/submitting; inspect result origin, token, outcome, and native duplicate handling.
- [ ] Test requested-target pruning/Retarget and actor/token replacement alongside existing-outcome checks.
- [ ] Inspect long-session guard retention and message deletion/recreation before proposing cleanup or bounded state.
- [ ] Verify two active owners, caster/target ownership distinctions, source author/GM checks, offline fallback, and save-mode cancellation/AC5E behavior.
- [ ] If a request-session change is proposed, preserve explicit manual takeover and existing origins/outcomes; do not flatten save, escape action, and pending damage protocols without evidence.
- [ ] Run relevant routing/takeover/weapon/recurring/card-presentation tests first and full verification for any approved shared/harness change. Tests/tools remain local and ignored.
- [ ] In Foundry, record both client roles, old/new dialog IDs, published result count and actual outcome during cancellation/takeover before claiming stronger guarantees.

## Record

- **Runtime changes/new race tests:** None.
- **In-game reproduction:** None established.
- **Next step:** Select one failed-dispatch or in-flight-takeover sequence and establish its current result before designing a fix.
