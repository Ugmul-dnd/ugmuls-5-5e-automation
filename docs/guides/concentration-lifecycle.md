# Concentration lifecycle

[Guide index](README.md) · [Ongoing effects](ongoing-effects.md) · [Pending casts](pending-cast-and-damage.md)

Concentration has a native root effect on the caster, documents that depend on it, and sometimes a pending check deciding whether it survives. This module adds cast-cancellation protection, check routing/session validation, Region and summon cleanup, and preservation during supported Wild Shape reversion.

**Source reviewed:** 2026-11-10, `v1.0.1-dev`. Native behavior was also checked in the locally installed **D&D5e 6.0.6** `dnd5e.mjs`. That system file is outside this repository; these native observations describe the installed version, not every future system release. No runtime code changes in this pass.

## 1. The pieces and their identities

| Piece | Where to look | Identity to preserve |
| --- | --- | --- |
| Native concentration root | Caster `concentration.effects`; native `beginConcentrating` / `endConcentration` | ActiveEffect ID/UUID and native source/dependency data. |
| Cast waiting to finish | [pending-cast.js](../../scripts/pending-cast.js) | Cast session, original effects, new results, selected previous concentration. |
| Requested check | [concentration-checks.js](../../scripts/concentration-checks.js) | Prompt card, Actor UUID, captured effect IDs, current roll session/user. |
| Roll result | Same file | `concentrationRequest` links back to that exact request/session. |
| Region cleanup | [concentration-cleanup.js](../../scripts/concentration-cleanup.js) | Concentration root's stored source Item UUID matched against Regions. |
| Summon cleanup | [summon-concentration.js](../../scripts/summon-concentration.js) | Root UUID, root's token UUID list, and token's matching root backlink. |
| Wild Shape reversion | [wild-shape-concentration.js](../../scripts/wild-shape-concentration.js) | Source/restored Actor and token UUIDs, retained effect IDs, rewritten dependencies. |
| Manual token control | [concentration-hud.js](../../scripts/concentration-hud.js) | Current token Actor and native concentration collection. |

The check, HUD, Region-cleanup, and summon-concentration scripts are manifest-loaded. Wild Shape concentration is imported by the main automation script. [durable-summons.js](../../scripts/durable-summons.js) has a related summon-placement integration. Loading and a setting being enabled are separate matters.

## 2. Start concentration through native casting

In the reviewed native activity flow, configuration/scaling and consumption precede concentration creation. If configured, the system calls `actor.beginConcentrating(activity, ...)`, records the created root in `results.effects`, and puts its ID in the usage message's `system.concentration`. Native `beginConcentrating` creates an ActiveEffect with the standard pre/post hooks.

The system can then end the chosen previous concentration. This module's pending-cast wrapper changes **when that previous effect is removed** for supported pending spell/feature activities:

1. Record the caster's initial effect IDs before use proceeds.
2. Await native consumption/validation.
3. If a replacement was selected and concentration begins, remember `config.concentration.end` and set it false for the immediate native path.
4. On settlement, `settlePendingCast` ends that remembered previous concentration and completes the pending usage.
5. On eligible cancellation, `cancelPendingCast` refunds the recorded consumption and removes owned newly created result effects/Regions, preserving initial effects.

An actual evaluated attack/save/damage/healing/check prevents treating that cast as a refundable preview. Utility/placement-only flows have their own settlement conditions. See the [pending guide](pending-cast-and-damage.md) for those boundaries and failure limitations.

This is staged behavior across documents. During preparation there can be a new concentration root while the previous root has not yet been ended; do not describe that intermediate state as a committed permission to maintain arbitrary spells.

## 3. Damage creates a native concentration prompt

The module does not calculate every damage-triggered DC itself. In installed D&D5e 6.0.6, the HP-update path can call `challengeConcentration` after qualifying actual HP/temporary-HP loss, unless concentration checks are disabled or that update's context suppresses them. The system's `getConcentrationDC` uses half the damage rounded down, a minimum of 10, and a modern-rules maximum of 30.

Native `challengeConcentration` creates a `prompt` chat message with a concentration button and owner recipients. This module's `prepareConcentrationPrompt` intercepts that prompt before creation to add its request state. The exported `createConcentrationPrompt` supplies the same kind of native prompt for integrations needing explicit provenance, such as Mage Slayer.

These are **applied-damage/check entry points**. A visible damage-roll total alone is not proof of the eventual HP loss, correct DC, or concentration result.

### Protection and special sources

`currentEffects` filters protected concentration before recording a check. It consults the Ranger Relentless Hunter integration and Focused Conjuration. Their wrappers can also suppress automatic damage-check creation when all relevant concentration is protected. Mixed concentration can still require a check for the unprotected roots.

[focused-conjuration.js](../../scripts/focused-conjuration.js) identifies the owned feature and a live, source-matched Conjuration spell. [ranger-base.js](../../scripts/ranger-base.js) identifies the supported protected Hunter's Mark. Their protection does not turn manual rolls or deliberate native concentration ending into forbidden actions.

[mage-slayer.js](../../scripts/mage-slayer.js) captures exact damage provenance, suppresses the ordinary prompt for that application context, and creates a replacement prompt after actual loss is known. Its linked check can receive Disadvantage; this is contextual roll configuration, not a permanent Actor debuff. Guarded Mind can hold a failed mental concentration result open for an available forced-success choice.

These are integration examples. Their resources, rules, and settings remain in their feature handlers.

## 4. Snapshot the requested effects, then select the roller

`prepareConcentrationPrompt` recognizes native concentration buttons when prompt automation, automatic breaking, or the supported Mage Slayer integration applies. It records only eligible concentration present at that moment.

| `concentrationCheck` field | Purpose |
| --- | --- |
| `actor` | Actor UUID for the request. |
| `dc`, `ability` | Requested target and optional alternative ability. |
| `effects` | Snapshot of concentration effect IDs this request can affect. |
| `userId` | Selected recipient of the current attempt. |
| `session` | Random identity replaced for each dispatched attempt/takeover. |
| `status` | `pending`, `rolling`, `resolved`, or `obsolete`. |
| `failed`, `resultId` | Resolution outcome/reference, added on completion. |

The prompt preserves existing whispers and adds the chosen roller and GMs. `selectSaveUser`, from [save-prompts.js](../../scripts/save-prompts.js), prefers connected non-GM owners, prioritizes a user's assigned character, and uses stable user-ID ordering before GM fallback.

The **coordinator** is a different role: active GM first, otherwise active card author, otherwise the shared recipient selector. The roller can be a player while the GM coordinates state and resolution.

`dispatchConcentration` serializes work per request card, verifies requester access, checks remaining captured effects, chooses a recipient, changes the session, and writes `rolling` before delivery. If none of the captured eligible effects remain, dispatch marks the request `obsolete`.

## 5. Roll, cancel, retry, or take over

`receiveConcentration` checks recipient, stored session/user, coordinator identity, Actor ownership, captured current effects, and the local `rolling` guard. It then calls native `actor.rollConcentration` with the DC, optional ability, original speaker/visibility context, and `concentrationRequest` provenance.

Player owners normally get configuration. A GM-run Actor follows the existing automatic NPC-save policy when applicable. The deterministic dialog ID includes the request card ID.

If no rolls are returned or rolling throws, the receiver sends a closure packet. `releaseConcentration` returns a matching current rolling request to `pending`. It requires the current session and assigned user, so closing an older attempt cannot release a newer attempt.

The prompt's render function, `renderConcentrationPrompt`, replaces its custom markup, hides the native roll button, and presents the current status. It does not dispatch a roll simply because the card renders. The button supports a pending retry; a GM can take over another user's rolling attempt. The UI disables same-user duplicate attempts.

A disconnect hook finds unresolved requests assigned to the disconnected user and asks the coordinator to redispatch manually. This is a deliberate recovery scan, not a per-render feature refresh loop. It is not a general startup replay of all historical requests.

Conceptually:

```text
pending -> dispatch/new session -> rolling
   ^                              |-- close/cancel -> pending
   |                              |-- valid result -> resolved
   `-- retry                      `-- takeover -> rolling with a new session

dispatch with no captured eligible effects -> obsolete
```

The statuses describe this request, not a universal Actor lock. New concentration roots and other request cards have their own identities.

## 6. Validate the result and end only the captured roots

Before a linked result is created, `validateConcentrationResult` rejects a missing/mismatched request session, wrong Actor link, or request that is no longer rolling.

`resolveConcentration` requires rolls, the current coordinator, matching session/state, and the assigned author's result. It waits for coordinated animations **outside** the request queue. This lets a takeover proceed during animation. After waiting, it checks request identity/coordinator again, enters the serialized path, and revalidates state, Actor, author, and finite evaluated total.

Forced success or `resisted` overrides the raw failure. Otherwise the helper uses native `isFailure` when available, falling back to total versus recorded DC. A supported Guarded Mind choice can leave a failed mental result unresolved until the choice or native Break path is handled. Updates to the result's supported outcome/resisted fields can call resolution again.

Excerpt from `concentration-checks.js`:

```js
  await request.setFlag(ID,"concentrationCheck",{...state,status:"resolved",failed,resultId:card.id});
  if(failed&&game.settings.get(ID,"autoBreakConcentration")===true){
   for(const effect of currentEffects(actor))if(state.effects.includes(effect.id))await actor.endConcentration(effect);
  }
```

`...state` copies the existing request fields into the replacement record. `&&` requires both failure and the enabled setting. `.includes(effect.id)` limits ending to the original snapshot. A newer spell with a different root ID is preserved.

Notice the order: the request is marked resolved **before** ending the matching roots. Resolution and dependent cleanup are not one atomic transaction. An ending/deletion failure needs investigation; a resolved status alone is not proof that every dependent document was removed.

An older check also remains attached to its recorded Actor UUID. Wild Shape transfers root/dependency provenance, but its transfer function does not explicitly migrate every pending chat request. Reversion with a check open is therefore a scenario to establish, not a guaranteed cross-form handoff.

### Independent settings

`promptConcentrationChecks` and `autoBreakConcentration` both default to true. Turning off automatic prompting does not necessarily disable request annotation or a manual pending-card workflow when automatic breaking remains enabled. Turning off automatic breaking can still resolve/report failure without this helper ending concentration. With both options off, ordinary prompts retain native behavior; explicit feature integrations have their own conditions.

A manual native concentration roll without `concentrationRequest` is outside this request/session resolver. Do not assume every concentration roll in chat will be automatically tied to a pending request.

## 7. Deliberate ending runs the native end workflow

`canEndConcentration` checks ownership, current roots, and the native method. `addConcentrationControl` adds the token-HUD button once. `endTokenConcentration` uses a local per-Actor in-flight guard and calls `actor.endConcentration()` without a target.

In the reviewed native implementation, no target means ending all currently maintained roots by calling the targeted path for each. The targeted path identifies the concentration effect, fires `dnd5e.preEndConcentration`, deletes the root if not canceled, then fires `dnd5e.endConcentration`. The HUD therefore preserves native hooks/dependency behavior instead of deleting a status icon directly.

`showConcentrationHud` defaults to true. Targeted ActiveEffect hooks refresh the displayed HUD for its Actor. This is HUD presentation rather than a request to scan or rerender historical chat cards.

### Regions

For a non-GM ending a root with matching Regions, `concentration-cleanup.js` cancels the local native end attempt and sends an active-GM request. It warns when no GM is connected. The receiver checks active requester, Actor ownership, actual concentration membership, and matching Regions before invoking native ending.

The native end hook then selects Regions by the root's stored `flags.dnd5e.item.uuid` across scenes and deletes matching IDs in per-scene batches. This Item-based identity differs from a check session or recurring-effect instance. Related condition/dependent cleanup follows its own handlers; see [Ongoing effects](ongoing-effects.md).

The request does not use the Wild Shape request/reply protocol. The canceled player call returning is not acknowledgment that GM-side Region deletion has completed.

### Summons

`summonConcentrationSource` requires a summon activity and matching source card, caster, Item, and concentration root; flagged Splintered Summons use their separate path. `summonConcentrationChanges` puts the root/caster/source backlink on the token data without mutating shared base data.

`installSummonConcentration` preserves source-card context through initial finalization and later Place Summons actions. Private clones keep simultaneous casts of the same Item from sharing mutable context.

`linkConcentrationSummons` serializes registration for a root, adds new token UUIDs to its `summonedTokens`, and checks whether concentration survived the asynchronous write. Missing roots or failed registration remove the newly created tokens where that handler applies.

`clearConcentrationSummons` runs on the active GM after deletion or supported disabling of a tracked root. It resolves recorded token UUIDs and requires each token's concentration backlink to equal that root before deleting in per-scene batches. It does not scan all scene tokens or remove every summon by the caster. Missing tokens and unrelated/non-concentration summons are preserved/skipped appropriately.

## 8. Wild Shape reversion preserves the root and its links

`wildShapeConcentration` gates this path by `beastSpellsAutomation`, Wild Shape transformation preset, ownership, and polymorphed state. `installWildConcentration` wraps `revertOriginalForm`; actors without qualifying concentration keep the native path.

The authoritative `revertWildConcentration` calls `transferWildConcentration` before native deletion of the Beast Actor/token can remove its roots and dependents.

| Helper | Responsibility |
| --- | --- |
| `remapWildShape` | Recursively rewrite exact Actor/token UUIDs and their document-path descendants, preserving prefix boundaries. |
| `transferWildConcentration` | Copy/update roots with retained IDs, remap dependents/self effects/Region data, and return rollback work. |
| `reindexWildConcentration` | Untrack/track native dependent registry links when the transfer's update option requests it. |
| `restoreOffSceneWildTokens` | Restore linked tokens outside the executing canvas while preserving placement fields, with rollback data. |
| `revertWildConcentration` | Coordinate linked/unlinked transfer, native reversion, guards, rollback, and temporary hook restoration. |

The transfer rejects independently newer concentration on the original Druid instead of overwriting it. Older conflicting roots can be disabled. Native Region references are explicitly included by source Item because they are not always registered dependents. Self-target effects must move as well because their old parent is about to disappear. Duration data is copied, not restarted.

For linked Actors, transfer targets the original Druid and restores off-scene linked tokens before native reversion. For an unlinked Beast, native reversion creates a replacement token; a temporary Token factory wrapper transfers to its Actor before the old token cleanup. That wrapper is restored in `finally`.

A player's request goes to the active GM, which validates ownership of both form and original Druid. Replies use a request ID; the player wait has a 20-second timeout. A timeout reports missing acknowledgment, not proof that nothing changed on the GM. Transfer includes rollback for supported failed/canceled steps, but it is not a blanket transaction undoing arbitrary native side effects.

## Evidence and future checks

**Automated checks, 2026-11-10:** nine selected local test files passed in two sequential runs:

```text
node tools/run-tests.mjs --filter concentration --filter ranger-base --filter mage-slayer --filter pending-cast --filter durable-summons --filter beast-spells
node tools/run-tests.mjs --filter focused-conjuration
```

Coverage includes owner/GM routing, cancellation/retry, source-scoped failure, independent settings, stale sessions and takeover during animations, protected roots/forced success, linked/unlinked Wild Shape transfer and rollback, off-scene restoration, summon cast isolation and placement-race cleanup, plus pending-cast/resource connections. These are local mocked/fixture checks. Source review of native 6.0.6 is separate evidence.

No new tests, full-suite run, or in-game verification occurred in this documentation pass. Direct HUD/Region-cleanup hooks and all combinations below are not established by those adjacent passing suites. Local tests/tools are ignored and may be absent from a fresh checkout.

Future questions extend [IMP-017](../improvement-notes/IMP-017-ongoing-effect-lifecycle.md). Planned Foundry scenarios remain unperformed:

- [ ] Cast a replacement spell, cancel before/after placement, then finish a cast; inspect old/new roots, refunds, and dependents separately.
- [ ] Take damage to HP and temporary HP; compare actual loss, native DC, prompt recipient, visibility, and configured roll behavior.
- [ ] Cancel/retry, disconnect the owner, and take over during animation; verify only the current session can resolve.
- [ ] Start a newer spell before resolving an older check; confirm only recorded eligible roots can end.
- [ ] Test each prompt/auto-break setting combination, protected Hunter's Mark/Conjuration mixed with other concentration, and Mage Slayer/Guarded Mind outcomes.
- [ ] End through the HUD/native controls as player and GM, including no active GM, multiple scenes, Regions, and summons. Inspect completed cleanup rather than relying only on a resolved label.
- [ ] Revert linked/unlinked Wild Shape with self/other-target effects, Regions, summons, off-scene tokens, and an open concentration check. Verify duration and future cleanup after restoration.
- [ ] Exercise source/root deletion during summon placement, transfer failure, lost reply, and a dependent deletion failure; record partial state before designing retries.

Use [Results and Undo](applying-results-and-undo.md) for HP/effect history. Undoing damage does not promise to recreate concentration or all consequences already caused by its ending.
