# Movement damage: measuring, counting, reserving, and rolling

[Guide index](README.md) · [Region library](region-library.md) · [Main engine](main-automation.md) · [Source](../../scripts/movement-damage.js)

Source reviewed **2026-11-10**, `v1.0.1-dev`, including [movement-placement.js](../../scripts/movement-placement.js). Excerpts preserve source expressions with formatting expanded where helpful. Examples explain current counting policy; they are not new in-game observations or a general interpretation of every movement-damage rule.

## Is this used beyond Spike Growth?

**Spike Growth is the only built-in `REGION_DEFAULTS` entry with a `movementDamage:true` trigger in the reviewed source.** The older starter recipes also configure Spike Growth. The Region manager exposes the option for custom configuration, so it is reusable infrastructure rather than a function that only recognizes the spell name.

This review did not inspect saved world configurations or establish which custom features have been used in play. Conjure Animals pack movement is a different workflow: the main engine explicitly avoids treating its save-based spell as this increment counter, including ignoring a legacy movement-damage option for its supported current-rules path.

## 1. A counter card is not a completed damage roll

```text
Place movement-only area
  -> no immediate damage roll
Token traverses Region
  -> main event handler validates target/source/routing
  -> active GM measures in-area movement and updates counter card C
Roll Pending Damage
  -> reserve counted increments
  -> native Activity.rollDamage creates result D using independent dice
  -> finish/retain reservation according to result
  -> native/module HP Apply and Undo handle D separately
```

The counter card stores distance accounting and a recorded target. It is not itself the native damage result. Its `movementDamage` flag and a result's `movementDamageRoll:true` flag have different purposes. It is also different from the empty `pendingDamage` placeholder described in the [pending guide](pending-cast-and-damage.md).

## 2. Placement should not deal the movement damage immediately

`movementOnlyPlacement` checks an enabled configured spell/feat with a native template and at least one enabled trigger, all of which use movement damage. Mixed-trigger configurations are not classified this way.

`prepareMovementPlacement` disables subsequent actions for supported placement uses, records `movementRegionPlacement`, and sets `resumeAreaDamage:false`. Its related placement-only branch supports other configured area recipes too. Automated Region/rider uses are excluded from this placement interception.

`guardMovementPlacementDamage` prevents the initial generic damage roll while allowing explicit measured rolls via `movementDamageSteps`, `movementDamageRoll`, and supported triggered paths. `renderMovementPlacement` hides inappropriate native roll buttons and adds a placement note after pending cast/target confirmation finishes.

The normal initial cast still has its own cost/concentration/placement workflow. Later measured damage calls `Activity.rollDamage`; they do not cast the area spell again for every square. [Pending cast](pending-cast-and-damage.md) has a supported placement-completion path so the original use can settle without requiring immediate damage.

## 3. Which events reach the counter?

`MOVEMENT_EVENTS` contains `tokenMoveIn`, `tokenMoveWithin`, and `tokenMoveOut`. The main engine installs those events for movement-damage triggers, validates the recipe/target/Activity, and calls `recordMovementDamage` under active-GM routing. It passes the same event queue used for Region processing into `registerMovementDamageHooks`.

The normal entry/turn once-per-target limiter and shared save-card path are bypassed for this movement accounting branch. Instead, a counter key includes Region UUID, spell UUID, trigger ID, Token UUID, and captured combat/round/turn. Movement during one grouping accumulates; a new combat turn changes the key.

Outside combat, undefined timing values serialize as `null` array entries in that key; there is no automatic turn rollover to split the counter. Do not infer an out-of-combat time reset from the label.

`recordMovementDamage` itself requires a Damage Activity with `rollDamage` and a usable movement origin/waypoint path. Its normal main-engine caller supplies target/authority validation; invoking the exported function directly is not a replacement for that context.

## 4. Measure the traveled path inside the area

`measureInsideMovement` delegates geometry to native token APIs. It segmentizes the movement path against the Region, then measures only segments matching the supplied movement type and not marked as teleport actions:

```js
if (segment.type !== moveType || actions[segment.action]?.teleport) continue;
const result = token.measureMovementPath([
    { ...segment.from, action: segment.action },
    { ...segment.to, action: segment.action }
]);
```

`continue` skips the current segment. The object spread copies native position data, retaining the action associated with the segment. Nonfinite or negative measured distance is rejected.

The helper adds `result.distance`, not terrain/speed cost. Difficult terrain consuming more movement does not by itself double the traveled-distance amount used here. This is path length, not simply the straight-line distance between the drag's endpoints or a call to `tokenDistance` in [shared-distance.js](../../scripts/shared-distance.js).

Teleport segments are skipped by this measurement. The later counting path also considers whether entry included a non-teleport waypoint. Mixed walking/teleport paths should be tested before making broader claims about every combination of native movement actions.

## 5. Deduplicate events and round the movement chain

The engine finds the latest owned counter for its exact key through `latestIndexedMessage("movementDamage", ...)`. It does not write a new full-chat scan here.

Private `movementSignature` combines the movement ID and origin/waypoint coordinates, elevation, action, and index. If the counter has already recorded that signature, the event is ignored.

The chain identity uses `movement.chain?.[0]`, then movement ID, then the signature. Per-chain `movementTotals` hold raw measured distance and counted steps, so an entry fragment and continued movement from the same drag are combined before calculating additional increments.

The current policy is explicit in this excerpt:

```js
const roundedSteps = Math.max(1, Math.ceil((measuredDistance - 1e-7) / increment));
const steps = Math.max(previous.steps, roundedSteps - (exitsArea ? 1 : 0));
movementTotals[movementKey] = { distance: measuredDistance, steps };
distance = Math.max(0, steps - previous.steps) * increment;
```

`Math.ceil` rounds upward; `Math.max` prevents the counter from going backward. The small epsilon reduces floating-point boundary errors. `exitsArea ? 1 : 0` subtracts one counted step for the final outward step, while preserving earlier steps already recorded. Entry can seed a step even when the measured in-area distance is zero if it qualifies as walking entry.

Consequently, the counter's top-level `distance` is **counted increments expressed in scene units**, not an unmodified log of exact traveled distance. Raw chain distance is retained inside `movementTotals`. Rounding, entry seeding, and exit exemption are behavior to preserve or deliberately review—not neutral arithmetic that automatically matches every prospective feature's rules.

For illustration, with increment 5 and no earlier steps, measured chain distance 10 counts two steps when staying inside. An exit calculation from that same starting state would subtract the final step. If two steps were already counted, the `Math.max(previous.steps, ...)` guard prevents a later exit event from removing them.

The increment is read as a positive number from configuration, defaulting to 5. The code labels it with scene grid units; it does not itself convert a default “5 feet” into meters. Metric/grid assumptions belong in a future rule-specific review.

## 6. What the counter persists

| Field in `movementDamage` | Purpose |
| --- | --- |
| `key` | Exact Region/spell/trigger/target/turn grouping. |
| `distance`, `increment` | Counted amount and unit size. |
| `rolledSteps` | Increments rolled **or reserved**, not proof of HP application. |
| `movements` | Signatures already accounted for. |
| `movementTotals` | Per-chain raw distance and monotonically counted steps. |
| `spellUuid`, `activityId`, `castLevel` | Native source and stored cast scaling context for later rolls. |
| `casterUserId`, `target`, `units` | Authorized caster identity, recorded target descriptor, and displayed units. |
| `rollReservations` | GM-mediated player reservations, keyed by request ID with user and step count. |

`pendingSteps` derives the available count:

```js
return Math.max(0, Math.floor((data.distance + 1e-7) / data.increment) - data.rolledSteps);
```

`Math.floor` counts complete configured units from the stored counter amount, then subtracts reserved/rolled increments. This expression should not be confused with the earlier raw-path `ceil` policy.

Private `cardContent` escapes display values and builds the counter's HTML with plus/minus and Roll Pending Damage controls. This is explicit counter presentation, separate from the native result's damage/HP controls.

## 7. GM corrections change pending counts, not old dice

`adjustPendingMovementDamage` requires a GM who owns the card and accepts only `+1` or `-1`. Decrement is ignored when no pending steps remain.

It adjusts the top-level counted distance without rewriting movement signatures, chain history, or previous result rolls. It cannot reduce the counter below already reserved/rolled increments. A minus click is therefore not Undo Damage or cancellation of a successful prior roll.

The rendering hook hides these adjustment controls from non-GMs. It does not rely solely on hiding them: the operation checks again when called.

## 8. Reserve before rolling

`canRollMovementDamage` allows a GM or the recorded caster user who also owns the source actor. The target being damaged is not automatically the user permitted to roll the spell's movement damage.

### GM/local path

The click handler queues `rollPendingMovementDamage`. For a GM-owned counter, the function resolves its native Damage Activity, computes pending steps, increments `rolledSteps`, and persists the reservation **before** rolling. It invokes native damage with critical disabled, stored cast-level scaling, the recorded target, and `movementDamageSteps`.

A successful roll leaves those steps counted. A normal empty result refunds them. An exception preserves the reservation and warns the GM to check chat: the error could have occurred after a damage message was created, so automatically refunding could enable a duplicate roll.

### Recorded caster/player path

The authorized player first asks the active GM to reserve increments. `processMovementRollRequest` validates active-GM execution, active user, counter/source, and caster ownership. A reservation increments `rolledSteps` and records request/user/steps on the counter; repeating that same reserve request ID can return the existing reservation.

The player rolls the native Activity, then asks the GM to finish that reservation. A reported canceled/empty result subtracts its steps; success keeps them and removes the reservation record. Ownership is checked again when finishing. An exception leaves the reservation rather than silently assuming no result exists.

Private `requestGM` correlates replies through `pendingRequests`, stored GM ID, and request ID, with a 15-second reply timer. The socket handler uses the supplied queue for reserve/finish operations. A timeout or exception is a reason to inspect the live card/result, not proof that the GM mutated nothing.

The direct GM roll path is queued by the normal UI caller and checks GM/card ownership. It is not the same as the socket's explicit active-GM guard. No local queue is a universal server-wide lock against arbitrary calls from every client.

## 9. Independent dice, not one roll multiplied by distance

`registerMovementDamageHooks` installs `dnd5e.postBuildDamageRollConfig`. When a positive step count is present and the roll has not been processed, it repeats each formula part through `repeatDamageFormula` and marks `rsaMovementScaled` to avoid repeating that transformation on the same roll object.

The formula helper uses:

```js
return dice ? `${Number(dice[1]) * steps}d${dice[2]}`
    : Array.from({ length: steps }, () => `(${formula})`).join(" + ");
```

An exact simple dice expression such as `2d4` becomes `6d4` for three increments. A more complex formula is repeated as separate parenthesized terms, including its per-increment bonuses. Neither path means “roll 2d4 once and multiply that one result by three.” It validates a positive safe integer step count first.

The source Activity's native roll configuration remains responsible for damage types and initial scaling. The resulting native damage card enters the usual [application/Undo](applying-results-and-undo.md) workflows according to settings and manual interaction. This counter file does not itself change the recipient's HP.

Undoing that result's HP does not, in this file, decrement `rolledSteps`, undo the historical movement signatures, or create new pending steps. Result Undo and movement-counter correction are separate operations.

## 10. Registration and connection reference

This file has no `Hooks.once("ready")` of its own. Its exported `registerMovementDamageHooks(enqueue)` is called by the main script during ready, supplying the shared Region queue. It installs socket handlers, the roll-configuration listener, and `renderChatMessageHTML` button listeners.

Rendering binds callbacks and gates their visibility; it does not measure movement or roll dice on every render. A normal click disables its control, queues the operation, and updates button availability in `finally`.

| Export | Responsibility |
| --- | --- |
| `MOVEMENT_EVENTS` | Native movement event names used by the main engine. |
| `measureInsideMovement` | Native in-Region path measurement excluding teleport segments. |
| `recordMovementDamage` | Account/deduplicate chains, find/update/create counter, and persist source/target data. |
| `pendingSteps` | Derive unreserved increments. |
| `adjustPendingMovementDamage` | GM correction of pending counts. |
| `canRollMovementDamage` | GM or recorded-caster ownership eligibility. |
| `processMovementRollRequest` | GM-side reserve/finish validation and updates. |
| `rollPendingMovementDamage` | Native rolling using the relevant local/reservation path. |
| `repeatDamageFormula` | Produce independent per-increment formulas. |
| `registerMovementDamageHooks` | Install listeners using the caller-provided queue. |

Other connections: [spell-manager.js](../../scripts/spell-manager.js) exposes configuration; [save-prompts.js](../../scripts/save-prompts.js) excludes movement triggers from save prompting; [chat-message-index.js](../../scripts/chat-message-index.js) provides the exact-key counter lookup; the main engine chooses authority and validates eligible targets before accounting.

## 11. Verification limits and future scenarios

The reviewed local `movement-placement.test.mjs` covers placement suppression, explicit movement-roll exemptions, mixed/disabled/template cases, and a GM roll carrying the expected step count and marker. `chat-message-index.test.mjs` covers keyed lookup behavior. Related main/pending fixtures establish some connections, not the complete counter workflow.

A text search of the current local tests/tools did not find direct fixture calls exercising `measureInsideMovement`, `repeatDamageFormula`, or `processMovementRollRequest`; it found the placement fixture's step/rolling check. That is a coverage lead, not proof that every possible indirect scenario is absent. Native chain rounding, reservations, and geometry need explicit review before generalizing this tool. [IMP-012](../improvement-notes/IMP-012-movement-policy-and-coverage.md) records that work.

On **2026-11-10**, the following targeted run passed: **6 files, 0 failed**. These are related regression checks, not comprehensive measurement/reservation coverage.

```text
node tools/run-tests.mjs --filter movement --filter region-library --filter pending-cast --filter chat-message-index --filter region-damage-routing
```

Documentation checks verified local guide/notes links, all four JavaScript excerpts against the current source ignoring whitespace, and inclusion of all ten exported names. A read-only enumeration of `REGION_DEFAULTS` confirmed Spike Growth as its only movement-damage recipe. The full runtime suite was not rerun for this documentation-only pass. Local tests/tools remain Git-ignored, and no new in-game checks were performed.

| Future scenario | Expected observation to establish/preserve | Status this pass |
| --- | --- | --- |
| Place Spike Growth with/without other selected tokens | No immediate generic damage; normal cast cost/concentration settles after supported placement/confirmation. | Not run |
| Walk in, continue within, then exit; repeat one long drag versus a split chain | Current entry/rounding/outward-step policy; no duplicate charge for repeated native fragments/signatures. | Not run |
| Diagonal, difficult terrain, elevation, different token sizes/grid types | Measured traveled path versus cost; record exact native geometry and counted steps. | Not run |
| Pure teleport and mixed walk/teleport path | Teleport segments excluded; establish entry/chain behavior before claiming universal support. | Not run |
| Feet and meter scenes with explicit increments | Confirm configured-unit behavior; do not assume automatic five-foot conversion. | Not run |
| Two targets/Regions/casts and a new turn; also outside combat | Separate intended counters and correct grouping lifetime. | Not run |
| GM +/- before and after a successful result | Pending count adjusts without editing old dice/history or refunding reserved rolls. | Not run |
| Player caster requests roll, simultaneous attempt, empty result, exception, timeout/disconnect | Correct reservation owner and nonduplication; inspect surviving reservations/results before retry. | Not run |
| Several increments of simple/complex native formulas | Independent dice and per-increment modifiers; recorded target and cast scaling retained. | Not run |
| Apply and Undo resulting HP | Normal native mitigation/history; counter's already-rolled count does not silently reset. | Not run |

No current-world custom-use inventory, new in-game observations, or performance measurements are claimed. Documentation work does not change the current counting policy or authorize new supported movement rules.
