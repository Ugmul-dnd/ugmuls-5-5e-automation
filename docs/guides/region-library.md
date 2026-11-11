# Region library: recipes, overrides, and native sources

[Guide index](README.md) · [Main Region engine](main-automation.md) · [Results and Undo](applying-results-and-undo.md) · [Source](../../scripts/region-library.js)

Source reviewed **2026-11-10**, `v1.0.1-dev`. This guide explains the library and its immediate consumers, not every recipe's game rules. Excerpts reproduce current source expressions with formatting expanded where helpful. Configuration examples are illustrative.

## Recipes tell the engine what to do

The main automation script executes Region events. The library supplies the configuration that decides which events, native Activities, and native effects it should use.

```text
REGION_DEFAULTS + saved overrides + custom entries
  -> getRegionSpellTable: frozen effective configuration
       |-- spell-manager: display/edit a cloned configuration
       |-- main engine: resolve trigger and execute native Activity
       |-- attachment: install Region behaviors/effect references
       `-- card-effect policy: avoid applying continuous Region effects twice

Edited full table -> saveRegionSpellTable
  -> split built-in differences from custom entries -> world settings
```

Recipes contain references and automation policy. They do not replace the actual owned spell's dice, Activity implementation, or effect data with a copy of book rules. Source identity and native scaling remain important.

## 1. Read one built-in entry

`REGION_DEFAULTS` is a recursively frozen object keyed by Item/spell names. The entries include spells, class features, and monster auras, despite some function names calling everything a “spell.” The reviewed defaults contain 34 entries; that is an observation of this revision, not a fixed expected count for future releases.

| Field | Responsibility and consumer |
| --- | --- |
| Entry name | Lookup key used by many consumers through `table[item.name]`. It is not a lookup by identifier/UUID everywhere. |
| `enabled` | Whether the configured entry is active when the consumer checks it. |
| `sourceUuid` | Portable source reference used by configuration workflows; runtime execution resolves the actual Item recorded on the Region. |
| `placementOnly`, `targetSelfEmanation`, `monsterAura`, and specialized fields | Direct supported placement/feature consumers. They are not all interpreted by one generic library function. |
| `hideRegionFromPlayers` | Overlay visibility policy; not equivalent to disabling Region behaviors. |
| `triggers` | Event-to-Activity instructions: ID/name, activity ID/name, event list, targeting, limiter/sharing, and optional scaling/damage policies. |
| `regionEffects` | References or names for native continuous area effects. |
| `regionEffectTargeting`, `regionConditions`, and related fields | Disposition/condition configuration consumed by shared helpers and Region condition workflows. |

For example, Flaming Sphere's current entry selects its native save Activity, end-turn events, preserved cast scaling, per-target turn limiting, and shared cards. Wall of Fire uses an explicitly labeled table-ruling recipe whose later follow-up is damage-only and does not share the initial save card. Documenting those recipes is not asserting that all entries implement one identical official timing rule.

Spike Growth is the built-in increment-counter example described in [Movement damage](movement-damage.md), which also distinguishes its measurement policy from other Region events.

The defaults use portable compendium references rather than one world's Actor/Scene UUIDs. Customized and migrated entries can legitimately contain local world references; portability of defaults does not guarantee portability of every saved override.

## 2. Store differences instead of rewriting defaults

The library registers hidden world settings:

| Setting | Contents |
| --- | --- |
| `regionLibraryOverrides` | Differences for built-in entries. |
| `regionLibraryCustoms` | Complete entries whose names are not built-ins. |
| `regionLibraryLegacyBackup` | Saved pre-migration table and timestamp. |
| `regionLibraryVersion` | Migration/schema marker; version 1 selects the newer storage path. This is not the module release version. |
| Older `spellTable` | Legacy full table, registered by the main file and preserved by migration. |

Private `merge`, `same`, `clone`, and `deepFreeze` support the public operations. `structuredClone` makes independent data copies; recursive freezing prevents consumers from editing the effective configuration in place. `merge` and `regionDifference` skip special prototype-related property names rather than treating them as recipe fields.

### Arrays are replacement values

`merge` recursively merges plain objects, but replaces arrays with cloned arrays. `same` compares arrays in order; `regionDifference` includes an array as a whole when it differs. It does not compute a trigger-ID-by-trigger-ID patch.

Consider this conceptual override:

```json
{"enabled": false}
```

Changing only enablement can leave the built-in triggers free to inherit future module updates. Changing a single trigger's event list can store the entire `triggers` array in the override, pinning the other trigger fields in that array too. That is the current contract, not necessarily a defect.

`regionDifference` walks keys present in the supplied value. Omitting a nested property is not a general deletion instruction that removes the inherited default. Use explicit supported values such as an empty array or a false option where the consumer defines them. A later merge-by-ID or deletion design would be a semantic change requiring migration and tests.

### Compose and split

`composeRegionTable` builds the runtime table in order:

1. Clone each built-in and merge its override.
2. Add custom entries whose names do not collide with built-ins.
3. When a legacy table is supplied, overlay its entries as complete values.

`splitRegionTable` performs the storage separation: built-in names become patches through `regionDifference`; other names become complete custom entries. A custom entry cannot independently occupy the same name as a built-in in the effective modern table.

## 3. Cache the effective table without letting callers mutate it

`getRegionSpellTable` reads the migration version and current setting objects. Before migration, the legacy full table is an additional authoritative overlay. After version 1, it is not part of composition.

The cache compares input references:

```js
const inputs=[version,overrides,customs,legacy];
if(cacheInputs?.every((value,index)=>value===inputs[index]))return cache;
cacheInputs=inputs;
return cache=deepFreeze(composeRegionTable(overrides,customs,legacy));
```

`.every` requires every input to match. For objects, `===` compares identity, not a recursive comparison of all fields. Setting `onChange` handlers clear `cacheInputs`; saving/reset/migration also invalidate it. Directly mutating a settings object without the normal setting write/invalidation is not a supported way to edit the library.

The result is frozen. The manager and other editors clone it before editing, then pass the edited full table to the save API. Read-only reuse is a different contract from a mutable draft.

`regionEntryStatus` gives a UI label: a non-built-in is “Custom entry”; a built-in with stored override keys is “Customized”; otherwise “Module default.” That label summarizes stored name/override status, not validation that an installed source Item exists or that every Activity matches.

## 4. Migrate legacy settings without deleting the original table

`migrateRegionLibrary` coalesces concurrent migration calls on the same client using a shared Promise. Private `runMigration` requires a GM and a version below 1. The ready hook initiates it on the active GM, or an available GM when no active GM is identified.

The migration:

1. Clones legacy `spellTable` and saves a timestamped backup if one is not already present.
2. Composes defaults/current settings with the legacy overlay.
3. Splits that result into built-in overrides and custom entries.
4. Writes both modern settings.
5. Writes the migration version last and invalidates the cache.

The source's completion boundary is:

```js
await game.settings.set(ID,"regionLibraryOverrides",overrides);
await game.settings.set(ID,"regionLibraryCustoms",customs);
// Mark complete last. Failed/partial migrations still read the original table.
await game.settings.set(ID,"regionLibraryVersion",1);cacheInputs=null;
```

This ordering preserves legacy lookup when migration fails before completion. It does not turn several setting writes into an atomic transaction. The original `spellTable` is not overwritten or erased by this path, and a saved backup is not routinely replaced on later calls. Failed startup migration reports that reload can retry.

## 5. Save, disable, reset, and remove are different operations

`saveRegionSpellTable(table)` snapshots the caller's draft before entering a local serialized write chain. It checks GM permission, migrates if needed, and restores any missing built-ins as **disabled** entries before splitting and writing the modern settings.

Removing a custom entry from the supplied full table removes that custom entry when saved. Removing a built-in does not delete its code recipe: it persists an enabled-false version. `resetRegionSpell(name)` removes one built-in's override so current defaults apply again; it is not custom-entry deletion or restoration of a previous edit history.

The queue uses this familiar Promise pattern:

```js
function serialize(task){
  const next=saving.catch(()=>{}).then(task);saving=next;return next;
}
```

The recovered chain allows later tasks after failure, while returning `next` lets the original caller observe that task's error. This orders writes on one client. It does not resolve stale drafts in different windows or simultaneous edits by different GMs. Saving a full-table snapshot can replace another intervening edit; do not assume optimistic merge/version conflict detection exists here.

## 6. Resolve the actual native Activity

`resolveRegionTriggerActivity` reads Activities from the supplied spell/Item. It tries:

1. If `useRegionActivity`, resolve the Region's recorded native Activity ID and use it if present on that Item.
2. The configured `activityId`, then exact Activity name as a legacy/name-only fallback.
3. A specialized attached Conjure Animals fallback matching the recorded exact save Activity UUID.
4. Return `undefined` when none match.

The configured selection is:

```js
const configured=(trigger.activityId
  ?activities.find(activity=>activity.id===trigger.activityId):undefined)
  ??activities.find(activity=>activity.name===trigger.activity);
if(configured)return configured;
```

The ternary attempts ID selection only when configured. `??` tries the name if the ID did not resolve. `.find` returns the first match, not all matches. A stable native ID can survive an Activity rename; if that ID is unavailable, name-based fallback has its own limits.

`useRegionActivity` matters for multiple native shape Activities such as wall/ring casts. It is intentionally different from always using the default Activity ID. It does not authorize an arbitrary Activity on an unrelated Item.

## 7. Build a damage-only copy without rewriting the source spell

`buildRegionDamageSpellData` requires native damage parts and returns Item data, not a persisted Item document. It clones the source through `toObject`, assigns a temporary ID, keeps the selected Activity, and removes Item effects.

Its selected Activity becomes damage-only: save/on-save handling is removed, critical damage is disabled, activity effects are cleared, and it gets special instantaneous activation, a recorded-creature target configuration, no new template, unrestricted range, and no additional consumption/concentration. AutoAnimations data is made quiet for this triggered copy.

The original native damage parts/scaling data remain the source; this helper does not invent a fixed die formula. The main engine constructs a temporary Item from the returned data and supplies the appropriate cast scaling for the supported trigger policy. Stripping the new template avoids placing another wall/ring for every later Region event.

This conversion must only be used where the recipe intentionally calls for later damage without repeating the initial save. The current Wall of Fire recipe explicitly labels its table ruling, so conversion is not a generic declaration that every repeated spell event should lose its save.

## 8. Continuous Region effects versus card outcomes

`regionManagesCardEffect(activity,effect)` checks the current enabled recipe for that Item name. It compares configured Region-effect entries with the effect's UUID, duplicate/compendium source references, trailing ActiveEffect ID, or normalized effect name. Disabled entries do not claim ownership.

This policy tells [buff/outcome/manual-Apply workflows](applying-results-and-undo.md) to skip effects assigned to continuous Region behavior, avoiding duplicate card application. It does not itself create/delete an effect or prove that every Region was successfully attached. It is scoped to this recipe, not an unrestricted global match of same-named conditions.

The actual attachment uses `resolveRegionEffect` from [starter-spells.js](../../scripts/starter-spells.js): `effectName` resolves by exact name on the actual caster Item; otherwise `effectUuid` is resolved. That resolver and the card-exclusion comparison have different matching purposes. The older starter recipe collection in that file is also distinct from `REGION_DEFAULTS`; do not treat its presence as a second effective runtime table overriding this library.

## 9. Does saving change an existing Region immediately?

There are several stages, not one universal live-update operation:

| Change | What current reviewed paths establish |
| --- | --- |
| Save a recipe | Setting writes invalidate the composed-table cache. The manager can redraw its configuration. This API itself does not iterate Scenes and rewrite Region behaviors. |
| Next execution of an installed activity trigger | The main engine reads current config and finds its trigger ID again, checking enabled state, event, targeting, and other runtime rules. A removed/missing trigger cannot be assumed to execute just because its old script still exists. |
| Add/change an attached event or native effect behavior | Behavior subscriptions and effect references live on RegionBehavior documents. The main attachment code runs for new Regions and revisits the viewed Scene on `canvasReady`, but is only partial reconciliation. |
| Disable or reset config | It changes effective configuration; do not infer that all already-running native behaviors/effects are deleted or restored on every Scene immediately. |
| New cast/Region | Consumers read current recipes when preparing and attaching it. Actual source Activity/effect availability still matters. |

The [main guide](main-automation.md) details name/type duplicate checks, delayed `tokenEnter` attachment, and disposition updates. Existing matching activity behaviors can be skipped rather than rebuilt, and obsolete behaviors are not universally removed by that attachment function. Specialized modules may add their own handling; verify the relevant consumer before promising a specific live update.

The saved-to-attached configuration contract, array overrides, and editing concurrency are recorded for later investigation in [IMP-010](../improvement-notes/IMP-010-region-configuration-lifecycle.md). No reconciliation or storage behavior was changed for this guide.

## 10. Stinking Cloud consumes the library from its own spell module

The Stinking Cloud recipe remains in this library. Its spell-specific recognition and expiry handlers moved to [stinking-cloud.js](../../scripts/stinking-cloud.js) on 2026-11-10. That module imports `getRegionSpellTable` to respect current enablement and is manifest-loaded immediately after the library, preserving the prior setup order without a circular import.

`prepareStinkingCloudEffect`, attached to `preCreateActiveEffect`, changes only the applied copy's duration fields to an unexpired `targetEnd` policy; it does not edit the book effect or invent a different condition.

`endStinkingCloudTurn`, called on `updateCombat`, runs on the active GM for real turn/round transitions. It inspects the outgoing combatant's actor and deletes matching target-end Stinking Cloud effects, covering same-application-turn expiry that the native special duration can skip. It does not enumerate all world actors for that cleanup.

Disabling the configured entry affects recognition. This is another reason not to describe editing a recipe as merely changing labels; behavior consumers can read it during timing-sensitive work. The extraction preserved the existing handlers and hook timing; library settings/migration hooks stay here.

The implementation and verification record is in [IMP-011](../improvement-notes/IMP-011-stinking-cloud-module.md). On 2026-11-10, the user confirmed GM/client casting, the start-turn check with no application on cast, working turn/expiry behavior, and cleanup when concentration breaks. Additional detailed regression scenarios remain listed in the finding.

## 11. Public reference and connections

| Export | Purpose |
| --- | --- |
| `REGION_DEFAULTS` | Frozen portable built-ins. |
| `regionDifference`, `composeRegionTable`, `splitRegionTable` | Compare, compose, and separate storage layers. |
| `getRegionSpellTable`, `regionEntryStatus` | Cached effective view and manager status label. |
| `migrateRegionLibrary`, `saveRegionSpellTable`, `resetRegionSpell` | GM migration and locally serialized edit/reset paths. |
| `resolveRegionTriggerActivity`, `buildRegionDamageSpellData` | Native Activity selection and deliberate temporary damage-only copy. |
| `regionManagesCardEffect` | Keep configured continuous Region effects out of card outcomes. |

Representative consumers include [spell-manager.js](../../scripts/spell-manager.js) for editing, the [main script](../../scripts/ugmuls-5-5e-automation.js) for execution/attachment, [region-conditions.js](../../scripts/region-conditions.js) for configured condition membership, [region-effect-authority.js](../../scripts/region-effect-authority.js) for managed native-effect authority, and card application/Undo policy. This is a connection map rather than a full importer inventory.

## 12. Verification and future in-game checks

Reviewed local fixtures include `region-library.test.mjs`, `damage-area-regions.test.mjs`, `region-card-effects.test.mjs`, and `stinking-cloud.test.mjs`. They cover portable defaults, legacy backup/migration and interrupted retry, overrides/reset/custom removal, frozen views, manager integration, stable-ID/shape resolution, native damage/scaling preservation, Region/card effect exclusion, and specialized expiry. They use mocked settings/native documents and some extracted code; they do not establish complete live behavior reconciliation or multi-GM conflict handling.

On **2026-11-10**, this targeted run passed: **9 files, 0 failed**.

```text
node tools/run-tests.mjs --filter region-library --filter damage-area-regions --filter region-card-effects --filter stinking-cloud --filter region-effect-authority --filter conjure-animals-sharing --filter flaming-sphere --filter aura-of-life --filter natures-sanctuary
```

Documentation checks verified local guide/notes links, all four JavaScript excerpts against the current source ignoring whitespace, and inclusion of all 14 exported names in the library. The full runtime suite was not rerun for this documentation-only pass, and no new in-game checks were performed.

| Scenario for later shared changes | Observe | Status this documentation pass |
| --- | --- | --- |
| Fresh world and migrated customized world | Defaults available without manual import; customized triggers/IDs and custom entries retained; original legacy data/backup preserved. | Not run |
| Toggle one built-in; edit its trigger; reset it | Different storage consequences for scalar and array changes; default restoration without deleting custom entries. | Not run |
| Rename an Activity, use wall/ring forms, and upcast a supported damage-only trigger | Correct native Activity and cast scaling; no duplicate save, slot, template, concentration, or effects. | Not run |
| Change a recipe with existing Regions on current and other Scenes | Record which behavior is immediately current, only changes on a later event/cast, or requires explicit reconciliation. Do not assume universal live replacement. | Not run |
| Continuous Region effect plus manual/automatic card Apply | Native area effect stays authoritative; remaining card effects still work with Undo. | Not run |
| Stinking Cloud applied during its target's turn | Correct native condition, expiry at the intended outgoing turn, and unrelated effects preserved. | Not run |
| Multiple editor drafts or GMs | Establish actual save/conflict outcome before treating a local queue as global edit locking. | Not run |

No runtime changes, new in-game verification, or performance measurements are claimed by this guide. Tests/tools referenced by name are local and Git-ignored.
