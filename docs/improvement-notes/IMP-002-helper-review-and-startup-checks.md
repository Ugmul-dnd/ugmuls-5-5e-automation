# Narrow shared-helper review and startup discovery connections

[Finding IMP-002](IMP-002-shared-helper-boundaries.md) · [Shared-card guide](../guides/shared-activity-card.md)

**Reviewed/implemented:** 2026-11-10, `v1.0.1-dev`. This pass extracts only startup Actor discovery. It does not split the shared card/workflow engine.

## Review decisions

| Helper family | Decision in this pass | Reason |
| --- | --- | --- |
| `startupActors` | Move to [startup-actors.js](../../scripts/startup-actors.js); six direct consumers import it there. | No hooks, imports, or card dependencies; a small, well-defined discovery/cache contract useful to future workflows too. |
| `createEventQueue` | Keep in `shared-activity-card.js` for now. | Independent implementation, but 139 direct importing runtime files in this review. Moving that many imports is a broader pass; no queue redesign is justified here. |
| Effect equivalence/activity | Keep together with current callers. | Six direct importing files use `hasEquivalentActiveEffect`; private source identity logic also supports Region ownership. A source/effect policy split needs its own boundary review. |
| HP-card relationships, index, adjustment locks | Keep together. | Share index lifecycle, live application/history decisions, and update hooks; future cards still need these native relationships. |
| Target eligibility, descriptors, grouping/synchronization | Keep together. | Closely tied to recipients, native tray state, linking, and refresh. Presentation migration may help define later boundaries. |
| Region source/disposition helpers | Keep together. | Policies are not interchangeable with every other target/range helper. Do not silently standardize their behavior during organization work. |

Counts describe direct named imports from the reviewed shared file, not every global/indirect use or an estimate of affected gameplay scenarios. The extraction does not claim a measured speed improvement or remove the need for shared card helpers.

## What moved

The existing private `actorDiscovery` snapshot and exported `startupActors()` function moved unchanged from [shared-activity-card.js](../../scripts/shared-activity-card.js) to [startup-actors.js](../../scripts/startup-actors.js). Each of its six consumers now imports directly from the new file. Their other shared-card imports and feature logic remain in place.

There is one native ES module instance of the new helper, so all direct consumers share the same snapshot. There is no new manifest entry, hook registration, world setting, permanent registry, or background scan.

No old-path re-export remains. Runtime consumers in this repository are migrated; external custom scripts importing `startupActors` from the old file would need to change their path. External world macros were not inspected.

## Contract preserved

`startupActors()` gathers world Actors and token Actors from scenes, deduplicates them by UUID, and returns a frozen array containing the actual Actor objects. This includes synthetic/unlinked token Actors. The array is frozen; the native documents are not cloned or frozen.

Calls share a snapshot only while the world Actor/Scene collection identities match and before the scheduled microtask clears it. A later call discovers again. A new token created inside the existing short cache window does not immediately invalidate the snapshot; that existing behavior was retained.

Consumers decide when to call the helper, whether they have authority, and what setup/synchronization to perform. Discovery itself does not modify Actors, features, or chat cards.

## All six connections and optional game checks

The automated tests exercise the actual helper's discovery/cache behavior. The user subsequently confirmed the remaining feature tests worked, including Inspired Eclipse range rejection/acceptance. Checked rows record feature-level confirmation; exact reload, option-toggle, and unlinked-Actor variations were not separately specified. The Moonlight correction-fix retest remains unconfirmed.

| Done | Consumer | Connection to the helper | Focused check |
| --- | --- | --- | --- |
| [ ] | [Blessing of Moonlight](../../scripts/blessing-of-moonlight.js) | Authoritative ready-time discovery before `syncMoonlightRecovery`. | Reload with an existing eligible Bard; inspect feature recovery setup and perform the normal qualifying Moonlight workflow. |
| [x] | [Elemental Adept](../../scripts/elemental-adept.js) | Ready-time and option-change discovery before feature synchronization/refresh. | Reload with an existing eligible Actor; check its selected damage-type setup and a matching damage roll. If testing option changes, restore the intended setting afterward. |
| [x] | [Font of Inspiration](../../scripts/font-of-inspiration.js) | Recovery setup pass calls discovery before queued `syncFontRecovery`. | Reload with an eligible Bard and inspect the expected feature recovery configuration; verify the normal recovery path. |
| [x] | [Hills Tumble](../../scripts/hills-tumble.js) | Ready-time and enabled-option-change discovery before owned-item synchronization. | Reload with the eligible feature already owned; inspect its setup and run a normal qualifying use. Check an unlinked token Actor where practical. |
| [x] | [Inspired Eclipse](../../scripts/inspired-eclipse.js) | Ready-time discovery before synchronizing matching owned features. | Reload with an eligible feature already present; inspect its normal controls and run a qualifying workflow. |
| [x] | [Warding Flare](../../scripts/warding-flare.js) | Ready-time discovery before queued `syncFlareRecovery` on matching Clerics. | Reload with an eligible Cleric, including Improved Flare if available; inspect recovery setup and a normal qualifying reaction. |

For a representative feature, include an unlinked/synthetic Actor and a later explicit recovery/setting pass. Discovery includes all scenes, so the current canvas alone must not determine which Actors exist in the snapshot. Do not change feature authority or settings just to force every ready handler to run on every client.

## Automated verification and limits

- Eight selected startup/caller/shared-target/lock files passed before and after extraction.
- The existing local startup fixture still checks four consumers sharing one immutable snapshot, 400 world Actors plus synthetic token discovery, enumeration work counts, UUID deduplication, native document identity, microtask expiry, later additions/removals, and collection replacement. It now loads the neutral source and checks that importing it installs no ready hook.
- The local `startupActorsSource` fixture helper reads the new file directly rather than extracting the prefix of the shared-card file. Existing feature fixtures retain their assertions.
- `node tools/run-tests.mjs --checks` passed: 366 discovered test files, zero failures; syntax checked for 316 runtime scripts, manifest files and relative imports verified.
- No real Foundry startup/multiplayer verification or performance measurement was performed for this extraction. Feature fixtures use mocks; many inject the actual helper source through the local fixture adapter.
- Tests/helpers/tools remain local and Git-ignored. Runtime changes remain local and uncommitted by this task; no packaging/publication.

**Next step:** Treat this bounded extraction as complete in code, record any focused game checks, and revisit a different helper only when its own maintenance benefit justifies the scope. No broad shared-card split or future-card implementation is included.

## Separate issue found during game checks: Moonlight save correction

On 2026-11-10, the user reported that an initially successful Moonbeam save corrected to a failure using Disadvantage did not offer Blessing of Moonlight healing. Source review found that the feature already listened for roll updates, but `captureMoonlightSave` returned whenever its first snapshot existed. An initial success stored an empty failure-index list that could never grow. This is a feature snapshot policy issue, separate from the startup-discovery extraction.

The focused fix permits a corrected failure to extend only the original captured caster/feature/cast/buff/token/defender binding while that source remains valid. It does not replace the snapshot with a newer source or reset reserved/completed healing. Current-success checks still hide the action if corrected back to success. New indices request one targeted refresh through the shared queue; unchanged snapshots are not rewritten.

The local Moonlight regression now covers the real roll-update listener, success-to-failure eligibility, original identity preservation, one write/refresh, repeated-update no-op, return-to-success hiding, consumed-heal preservation, inactive source rejection, and a different-casting rejection. Four selected Moonlight/Lunar/d20/lock files passed. Full runner with checks passed: 366 files, zero failures; 316 runtime scripts syntax checked plus manifest/import validation. In-game confirmation of the fix is pending.

Focused retest: with an active modified Moonbeam, begin with a passed save, correct it to Disadvantage so it fails, and confirm the Heal action appears. Correct back to success to check it disappears. After using the heal, changing modes again must not grant a second heal for that same save.

## User observation: Hill's Tumble activation

On 2026-11-10, the user reported that Hill's Tumble works when manually activated. No reload/option-toggle or unlinked-Actor variation was explicitly specified, so the complete startup-check row remains unchecked. Current source provides native feature-use targeting and Prone setup/application, not an attack/damage-card offer or a damage-configuration toggle. Adding such a prompt would be a separate feature change.

## Inspired Eclipse range guide — 2026-11-10

The user confirmed that the remaining features worked and that Eclipse teleport placement rejected destinations outside range and accepted those within range. They requested a visible 30-foot guide similar to the Misty Step preview.

`showEclipseRange` in `inspired-eclipse.js` now adds a temporary, non-interactive local canvas ring during the shared native teleport-placement path. It covers the chat action, the feature Teleport activity/manual Eclipse adoption, and recipient placement. It uses the recorded native range and scene units rather than a hard-coded 30 feet, centers on the moving token, pulses gently, and stays static for reduced motion. It creates no persistent template/Region or new animation-module dependency. It is a distance guide; native grid range, sight, occupancy, level, authority, and resource checks remain authoritative.

The ring/ticker are cleared on confirmation, cancellation, failure, or detected scene change. A missing rendering API leaves placement functional. Local regression checks cover placement cancellation/confirmation/failure and repeated attempts, configured ranges, center, metric conversion, reduced motion, scene cleanup, missing canvas support, and invalid range. Four selected Eclipse/Moonlight/startup files passed. Full runner with checks passed: 367 files, zero failures; 316 runtime scripts syntax checked plus manifest/import validation. Actual ring appearance is not yet user-confirmed in Foundry.

Retest: open Inspired Eclipse from the chat card and from the feature Teleport activity; verify the pulsing range guide appears, rejects the same invalid destinations as before, and disappears after choosing or pressing Esc. Repeat for the recipient if available. No additional movement, Reaction, or resource cost should be introduced by the visual.
