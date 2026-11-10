# Region placement and conditions

[Guide index](README.md) · [Region library](region-library.md) · [Main engine](main-automation.md)

This final guide in the shared-workflow reading pass connects native area placement to placement controls, self emanations, placement-only casts, and Region-maintained conditions. The shape preview, persisted Region, attached behaviors, and applied creature effects are separate objects.

**Source reviewed:** 2026-11-10, `v1.0.1-dev`. Native creation/attachment was also checked in the installed D&D5e **6.0.6** `dnd5e.mjs`, outside this repository. No runtime changes in this documentation pass.

## 1. The route from activity to conditions

```text
Activity template configuration
  -> native preCreateMeasuredTemplate hook
  -> manual placement or supplied self-emanation geometry
  -> native Region creation, source flags, and optional token attachment
  -> active-GM behavior setup
  -> Region membership/activation events
  -> native effect behavior or Region-owned condition synchronization
  -> exit/deactivation/deletion removes the applicable owned copies
```

Target collection/confirmation and pending-cast settlement also take part, but do not own all these steps. A preview does not itself prove the Region document or a creature effect was created.

| Read first | Functions/responsibility |
| --- | --- |
| [region-placement-controls.js](../../scripts/region-placement-controls.js) | `placementOptions`, `handlePlacementWheel`, `installPlacementControls`: casting-specific movement/rotation controls. |
| Same file | `prepareSelfEmanation`, `installSelfEmanationPlacement`: supply token-origin geometry without manual placement. |
| [movement-placement.js](../../scripts/movement-placement.js) | `movementOnlyPlacement`, `prepareMovementPlacement`, `guardMovementPlacementDamage`, `renderMovementPlacement`: place an area without an immediate damage/save sequence. |
| [region-target-preview.js](../../scripts/region-target-preview.js) | Temporary live map targets while placing; documented in [Target selection](target-selection-and-correction.md). |
| [region-conditions.js](../../scripts/region-conditions.js) | `syncRegionConditions` and the custom Region Conditions behavior. |
| [region-effect-authority.js](../../scripts/region-effect-authority.js) | `managedRegionEffect`, `installRegionEffectAuthority`: authority adapter for supported native effect behaviors. |
| [aura-grid.js](../../scripts/aura-grid.js) | `migrateAuraGrid`: one-time grid-based emanation migration for recognized module Regions. |

The main sources above are manifest-loaded except `aura-grid.js`, which is imported by the main script. Existing guides cover the [movement counter](movement-damage.md), [ongoing effects](ongoing-effects.md), and [concentration cleanup](concentration-lifecycle.md).

## 2. Native placement owns final Region creation

In the reviewed system version, activity template data is converted to scene units before `dnd5e.preCreateMeasuredTemplate`. `TemplatePlacement.place(config)` returns shape placements; native code then creates Region documents.

The system adds source activity/Item/token and cast-level flags, builds shapes, and chooses attachment based on the returned token and native `target.stationary`. A returned token-origin emanation is not necessarily a moving aura: stationary activities remain at their original position.

Native creation has its own pre/post hooks. This module's active-GM `createRegion` handler in [ugmuls-5-5e-automation.js](../../scripts/ugmuls-5-5e-automation.js) records caster-user information, applies configured player visibility, and attaches supported behaviors. Core document creation reaches the GM even when the casting player cannot create GM-only RegionBehavior documents through a local post-template hook.

The [main guide](main-automation.md) describes that attachment engine. Existing Regions are revisited on canvas readiness, but that is partial reconciliation, not a promise that every later recipe edit rewrites/removes all old behaviors.

## 3. Casting-specific movement and rotation

`installPlacementControls` wraps a Region layer once using a `WeakSet`. It activates only when placement data carries the native MeasuredTemplate marker and `regionPlacementControls` is true. Other Region placements retain the original method.

During the wrapped placement it remembers `activePlacement`, supplies `placementOptions`, and restores the prior active placement in `finally`. This lets a wheel listener distinguish casting preview from ordinary canvas activity, including failure/cancel exit.

`placementOptions` copies the original options and replaces selected callbacks:

- Movement first respects an original callback's explicit `false`. A cone on a square grid then snaps its origin to a vertex and returns false to suppress competing default movement.
- Cone/rectangle rotation is allowed through the override; other shapes delegate to the supplied rotation callback. This specifically permits rectangle rotation despite the native grid-aligned-square veto during preview.

`handlePlacementWheel` acts only for the active placement/context, enabled setting, and events on the board or its children. It prevents the competing wheel handler, routes Ctrl/Meta-wheel to canvas zoom, and otherwise reverses the native Shift modifier for rotation. The setting advertises 15-degree ordinary and 5-degree Shift precision; the wrapper delegates the actual rotation to the native layer instead of implementing an independent angle calculator.

These controls change the preview interaction, not the source activity's range, damage, duration, or configured target rules. Square-grid cone snapping does not establish identical behavior on hex/gridless scenes; those need their own checks.

## 4. Automatically place self emanations on the actual caster

`prepareSelfEmanation` runs on `dnd5e.preCreateMeasuredTemplate`. With `autoAttachSelfEmanations` enabled, it requires a supported spell/feature, emanation shapes, and self origin/range, with a specific Warping Implosion integration that converts its preview shapes.

It obtains the activity's usage token and verifies that token in the current scene belongs to the activity Actor. It never substitutes a different controlled token or guesses among multiple Actor copies. On success it adds `rsaSelfEmanationToken` to the placement config.

`installSelfEmanationPlacement` wraps native template placement once. A valid marked config returns grid-based emanation shape data directly; unmarked/disabled cases use the original placement.

Excerpt from `region-placement-controls.js`:

```js
        const scale=canvas.scene.grid.size/canvas.scene.grid.distance;
        return Promise.resolve(config.shapes.map(shape=>({
            type:"emanation",gridBased:true,radius:shape.size*scale,token:token.id,
            base:{type:"token",x:token.x,y:token.y,width:token.width,height:token.height,shape:token.shape,rotation:0}
        })));
```

`map` converts each configured shape into output data. The division calculates pixels per scene distance unit, so the configured size becomes a pixel radius. `Promise.resolve` supplies the asynchronous return shape expected by placement. This function supplies geometry; native activity code still creates the Region and decides whether token attachment is stationary or moving.

`migrateAuraGrid` addresses recognized existing module Regions: on the active GM, it sets emanation shapes to `gridBased: true` while preserving radius/base geometry and unrelated shapes. A version flag and local pending guard prevent repeated rewrites. Recognized ownership includes specific aura/summon flags or `casterUserId`; it is not a migration of every Region in the world.

## 5. Placement-only is different from rolling damage immediately

`movementOnlyPlacement` reads the effective Region recipe for a templated spell/feature. It requires at least one enabled trigger and all enabled triggers to be movement damage. A mixed trigger recipe keeps its other initial behavior.

`prepareMovementPlacement` also supports explicit recipe `placementOnly`. For initial uses, it turns off subsequent actions, sets `movementRegionPlacement` or `regionPlacementOnly`, and records `resumeAreaDamage: false`. Region/rider follow-up uses are excluded.

`guardMovementPlacementDamage` blocks an inappropriate initial/manual damage attempt from those placement contexts. Actual measured movement steps, explicit movement-damage rolls, and Region/rider-triggered rolls are exempt so the later event can still deal damage.

`renderMovementPlacement` hides initial Save/Damage controls and, after pending cast/target confirmation clears, adds a placement explanation once. Rendering does not start the later damage event. Post-placement confirmation and pending settlement retain their existing responsibilities; see [Pending casts](pending-cast-and-damage.md).

Live target preview is another separate path. It temporarily follows provisional geometry and restores prior selection on placement exit; final collection uses actual Regions. Placement, preview, and self-emanation wrappers compose around native APIs, so installation order/callback forwarding must remain part of any future extraction review.

## 6. Two ways to maintain effects inside Regions

| Region recipe field | Applied mechanism | Removal/ownership |
| --- | --- | --- |
| `regionEffects` | Main engine resolves a source ActiveEffect and attaches native `dnd5e.applyActiveEffect` behavior. | Native behavior handles effects; module authority adapter selects the writer. |
| `regionConditions` | A custom Region Conditions behavior calls `syncRegionConditions` for native status IDs. | Applied copies carry exact Region/status ownership flags. |

They are related mechanisms, not aliases. Card-effect policy also excludes effects assigned to a Region from ordinary card application, preventing those paths from reapplying the same configured benefit. Disabled/removed recipe assignments and actual existing Region behavior state are distinct; see [Region library](region-library.md) and [IMP-010](../improvement-notes/IMP-010-region-configuration-lifecycle.md).

### Native effect behavior authority

The main attachment engine resolves configured source effects, checks existing name/type matches, flags managed behavior, and supplies disposition filters. It can update an existing disposition list, disable an ambiguous-caster behavior, or avoid creating one when a caster cannot be identified. This is not a full migration of every installed effect reference.

`managedRegionEffect` recognizes the explicit managed flag or compatible recipe/name pattern. `installRegionEffectAuthority` wraps the native behavior type's event handlers and update callback once. Managed mutations execute only on the active GM, passing the GM as `event.user` for native self-user checks. Unmanaged native behavior uses its original handler.

The adapter preserves native effect contents; it does not implement a second set of condition mechanics.

## 7. Disposition filtering has its own contract

`resolveRegionCaster` in [shared-activity-card.js](../../scripts/shared-activity-card.js) prefers the recorded origin token. Otherwise it accepts a unique matching caster token in the Region's scene. Ambiguous copies return null.

`regionEffectDispositions` uses an explicit `regionEffectTargeting`, or targeting modes from enabled recipe triggers. Its return values have three different meanings:

| Return | Meaning |
| --- | --- |
| `[]` | Everyone/default unrestricted disposition. |
| Array of disposition values | Only those dispositions are allowed. |
| `null` | Cannot safely determine the required caster-relative targeting. |

For this helper, friendlies share the caster's disposition; `hostilesOnly` and `excludeFriendlies` select dispositions different from the caster. That can include neutral tokens. This differs from `allowsAutomaticTarget`'s initial area-targeting hostile rule. Preserve the distinction until its desired rules are explicitly reviewed.

The condition synchronizer checks `dispositions !== null` separately from `.length`. Replacing that with a generic truthiness or “empty means none” check would change recipients. The helper can return an empty list for other configurations too, so its exact current contract matters more than a label alone.

## 8. Conditions belong to their Region, not just their name

At `init`, `region-conditions.js` registers the custom behavior type and its set of condition IDs. Token enter/exit and behavior activation/deactivation call `syncRegionConditions`.

That synchronizer:

1. Requires active-GM authority and queues work per Region UUID. A failed prior task does not poison the next task.
2. Builds a deduplicated Actor set from world Actors plus the Region scene's token Actors, including synthetic/unlinked Actors.
3. Reads current membership from `region.tokens`, applies ordinary target eligibility and Region-effect dispositions, and records inside Actor UUIDs.
4. Finds only effects whose `conditionRegion` equals this Region UUID.
5. Deletes obsolete owned copies in a batch per Actor and creates missing wanted status copies through native `ActiveEffect.fromStatusEffect`.

Excerpt from `region-conditions.js`:

```js
                delete data._id; // Do not reuse the standard condition's fixed ID.
                data.origin = region.uuid;
                data.flags ??= {};
                data.flags[MODULE_ID] = {...data.flags[MODULE_ID], conditionRegion: region.uuid, conditionId: id};
```

`delete` removes a property from this new copy. `??=` creates the flag object only if it is null/undefined. The spread preserves existing module flags while adding source Region and status identity. A different Region can therefore own another copy of the same named condition without one exit deleting both sources.

Membership is **Actor-based**, not one effect per token. If two linked tokens represent the same Actor, an eligible remaining token inside can keep the Actor's condition active. An existing unflagged manual condition is not adopted or removed merely because its name/status matches. Existing source-owned copies are matched by status flag; this function does not automatically rebuild/re-enable every existing copy on each sync.

At `ready`, Region creation attaches configured condition behavior and synchronizes it. Canvas readiness synchronizes an existing matching behavior. Region deletion or behavior deletion requests source cleanup with `removed: true`; deactivation also treats membership as empty. This removes only copies carrying the matching source Region flag.

The queue is local/per Region, not an atomic transaction across all Actors or all behavior types. Reconciliation currently inspects the Actor set rather than maintaining a new per-token index. No runtime indexing or performance change is introduced here.

## Evidence and checks to revisit

**Automated checks, 2026-11-10:** 10 selected local test files passed:

```text
node tools/run-tests.mjs --filter movement-placement --filter region-target-preview --filter aura-grid --filter warping-implosion --filter region-effect-authority --filter region-card-effects --filter damage-area-regions --filter region-damage-routing --filter targeting-region-cleanup --filter region-library
```

They cover representative placement-only guards, target-preview composition/cleanup, generated/migrated emanations, a stationary departure burst, native effect authority, Region/card exclusion, routing, recipes, and targeting-only cleanup. These passing fixtures do not establish direct coverage of cone/wheel callbacks or all `syncRegionConditions` events, real geometry on every grid, or multiplayer timing.

No new tests, full-suite run, in-game checks, or runtime edits occurred. Local tests/tools are ignored and may be absent from a fresh checkout. Native 6.0.6 source review is separate evidence from those fixtures.

Follow-up details extend existing [configuration/placement finding IMP-010](../improvement-notes/IMP-010-region-configuration-lifecycle.md) and [condition lifecycle finding IMP-017](../improvement-notes/IMP-017-ongoing-effect-lifecycle.md); they do not authorize implementation.

These planned Foundry checks remain unperformed in this pass:

- [ ] Place/cancel cones and rectangles on square, hex, and gridless scenes. Check original callback vetoes, wheel/Shift precision, Ctrl/Meta zoom, and unchanged unrelated Region placement.
- [ ] Cast self emanations with one/multiple caster tokens and linked/unlinked Actors; inspect radius, native attachment, stationary behavior, cancellation, and disabled settings.
- [ ] Combine manual placement, preview, and auto-emanation paths; verify callback order, restored selection, actual Region creation, and no duplicate placement.
- [ ] Compare movement-only, mixed-trigger, and explicit placement-only recipes; confirm no initial damage and that later configured events still work.
- [ ] Test friendly/hostile/neutral recipients and missing/ambiguous caster tokens, comparing initial targeting with ongoing effect filtering.
- [ ] Overlap two Regions and a manual same-status condition; enter/exit/deactivate/delete one source and inspect retained copies from the others.
- [ ] Use multiple linked tokens of one Actor and multiple unlinked Actors. Check membership, hidden/defeated eligibility, scene revisit, and removal cleanup.
- [ ] Test changed conditions/effect recipes, duplicate behaviors, disabled owned copies, and a partial Actor-update failure; establish intended reconciliation before consolidation.
- [ ] End concentration or delete a Region as owner/GM; inspect both native effect and custom condition cleanup, including off-scene/synthetic Actors.

This completes the current shared-workflow guide set. The improvement notes preserve proposed cleanup and testing questions; the runtime remains unchanged.
