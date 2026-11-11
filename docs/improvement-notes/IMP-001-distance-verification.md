# Shared distance: connection map and in-game checklist

[Finding IMP-001](IMP-001-shared-distance.md) · [Findings register](README.md)

**Extraction:** 2026-11-10, `v1.0.1-dev`. **In-game status:** Six feature checks user-confirmed after extraction; remaining consumers and cross-cutting checks are pending. Checked feature rows record reported success, not proof that every suggested variation in the row was performed.

## What moved and what connects now

The former `blessingDistance(a, b)` calculation was removed from [dark-ones-blessing.js](../../scripts/dark-ones-blessing.js) and moved to **[shared-distance.js](../../scripts/shared-distance.js)** as `tokenDistance(a, b)`.

Nineteen other importing scripts and Dark One's Blessing itself now import that function directly from the neutral script. That is **20 runtime consumers**, listed individually below. Their local calls were renamed; their ranges, comparisons, eligibility, timing, resources, and effects were not rewritten.

```text
Before: 19 feature scripts -> dark-ones-blessing.js -> blessingDistance
        Dark One's Blessing also calls its local helper

Now:    all 20 feature scripts -> shared-distance.js -> tokenDistance
        main module -> dark-ones-blessing.js for its own feature setup
```

The helper has no feature hooks, settings, document writes, or feature imports. It is loaded through its consumers' imports and needs no manifest entry. Dark One's Blessing retains its explicit import in the main module; other features no longer load it merely to obtain measurement. Removing incidental imports changes that dependency's evaluation path; no claim is made that every feature's hook-registration order is byte-for-byte identical. The full regression pass checks the supported resulting integration.

No compatibility re-export remains in the spell file. Repository runtime callers were audited and switched; an external custom macro importing the old function/path would need to use the new import. External world macros were not audited.

## Measurement contract preserved

- Inputs are token documents or token-position snapshots with a source `parent.grid`, coordinates, footprint, and optional elevation. The helper does not normalize a Token placeable itself.
- The first input's scene grid measures between the existing footprint points. Small footprints retain the existing minimum-one-square behavior.
- A matching active canvas grid is used only when the source grid has no measurement method. An unrelated viewed scene is not used.
- Output is the maximum of native horizontal distance and absolute elevation difference, in the existing scene-unit convention. It is not Euclidean 3D distance.
- Missing measurement returns `Infinity`. Input validation, same-scene requirements, sight, disposition, range-unit conversion, reaction timing, and spell rules remain with callers.

This extraction does not consolidate movement-path counting or other distance implementations. Boundary tolerances and metric constants remain as written in each feature; compare behavior before proposing standardization.

## Every consumer to check

For each row, test a valid case and a case outside the relevant limit. Include a case exactly at the boundary where practical. All other feature prerequisites must be satisfied so the distance-dependent branch actually runs.

| Done | Feature/source | Area now calling `tokenDistance` | Concrete game check |
| --- | --- | --- | --- |
| [x] | [Dark One's Blessing](../../scripts/dark-ones-blessing.js) | `blessingRecipients`: nearby enemy-drop recipient. | Let another creature drop an enemy within/outside 10 feet of the Warlock; verify the nearby temporary-HP benefit. Separately confirm the Warlock's own distant killing blow still qualifies through its existing branch. |
| [ ] | [Blessing of Moonlight](../../scripts/blessing-of-moonlight.js) | Moonlight Healing's selected recipient validation. | After a qualifying event, select another valid creature inside/outside 60 feet of the Bard; verify acceptance/rejection and no duplicate healing. |
| [ ] | [Channel Divinity](../../scripts/channel-divinity.js) | `channelTarget`: supported activity recipients. | Test a supported 30-foot Channel Divinity activity with appropriate creatures inside/outside range; include Turn Undead's type and self-filtering. |
| [ ] | [Cleric Potent Vitality](../../scripts/cleric-potent-vitality.js) | `potentVitalityTarget`: recipient range. | Choose an otherwise valid recipient inside/outside 60 feet of the recorded Cleric token; inspect healing target and rejected-use spending. |
| [ ] | [Corona of Light](../../scripts/corona-of-light.js) | `insideCorona`: distance fallback after native Region membership does not return true. | Exercise an aura case using the distance fallback around 60 feet; verify the expected aura benefit. A native-inside success alone does not test this helper. |
| [ ] | [Countercharm](../../scripts/countercharm.js) | Bard-to-saving-creature candidate range. | Produce a qualifying failed charm/fear save with another creature within/outside 30 feet of the Bard; verify offer, Reaction, and corrected save. |
| [ ] | [Divine Reaper](../../scripts/divine-reaper.js) | `enhancedTarget`: extra target within the source activity's configured range. | Use an eligible Enhanced Necromancy spell and select a second creature just inside/outside its actual range; preserve original target and native consumption. |
| [x] | [Fount of Moonlight](../../scripts/fount-of-moonlight.js) | `fountSnapshot`: defender-to-attacker range when the offer is captured. | Damage an active Wreathed in Light caster from inside/exactly/outside 60 feet; repeat in human and Wild Shape forms. Inside-range offer survives concentration loss without rebuilding and targets the recorded attacker. |
| [ ] | [Guided Strike](../../scripts/guided-strike.js) | Candidate source-to-attack-target range. | On a qualifying attack, place the feature source within/outside 30 feet of the attack's target. Check the appropriate self/allied branch and current resource/Reaction behavior. |
| [x] | [Hypnotic Presence](../../scripts/hypnotic-presence.js) | `movedPresence`: caster/target position snapshots after movement. | Move each creature separately from within to beyond 10 feet; only its linked effect should end. Rotation/unrelated token movement should not trigger range work. |
| [ ] | [Instinctive Charm](../../scripts/instinctive-charm.js) | `retargetCharm`: replacement target within the attacker's native range. | Obtain a valid redirect and select a replacement inside/outside the attack's configured range. Confirm recorded recipients and original attack dice remain correct. |
| [ ] | [Invoke Duplicity](../../scripts/invoke-duplicity.js) | Local `near` helper used by duplicate proximity logic. | Move the illusion across the relevant five-foot proximity boundary while satisfying the feature's other conditions; inspect granted advantage and normal cancellation. |
| [ ] | [Leading Evasion](../../scripts/leading-evasion.js) | Nearby feature source among recorded Dexterity-save recipients. | Use a qualifying half-damage Dexterity save affecting both creatures; move the feature source within/outside five feet of the other recipient. Check benefit and damage outcome. |
| [x] | [Mirror Image](../../scripts/mirror-image.js) | `mirrorBypassed`: attacker-to-target comparison against special-sense ranges. | Attack duplicates with blindsight/truesight inside/outside its configured sense range; verify bypass versus interception. Also retain ordinary attacks as a comparison. |
| [ ] | [Sentinel at Death's Door](../../scripts/sentinel-at-deaths-door.js) | `sentinelRange`: visible recipient range. | Generate a qualifying critical event with a valid other recipient within/outside 60 feet of the source; verify offer, critical correction, and preserved original dice. |
| [ ] | [Spirits from Beyond](../../scripts/spirits-from-beyond.js) | Selected recipient range alongside scene/sight/ownership checks. | Choose a valid visible recipient within/outside 30 feet of the Bard; verify accepted target and rejected selections without unintended spending. |
| [ ] | [Tandem Footwork](../../scripts/tandem-footwork.js) | Source-to-recipient eligibility. | Exercise a valid feature opportunity within/outside 30 feet, retaining the existing sight/hearing and resource prerequisites. |
| [ ] | [Undead Vitality](../../scripts/undead-vitality.js) | `vitalityTarget`: selected Undead recipient range. | After a qualifying spell, choose a visible Undead within/outside 60 feet. Confirm healing uses that recipient and a living recipient remains invalid. |
| [x] | [Warding Flare](../../scripts/warding-flare.js) | `flareSnapshot`: feature-source-to-attacker range. | Have a visible attacker attack a friendly creature while within/outside 30 feet of the Cleric. Verify captured offer, use/Reaction spending, and resulting attack handling. |
| [x] | [Words of Creation](../../scripts/words-of-creation.js) | `wordsWarning`: distance between the two chosen recipients. | Choose two different valid creatures within/outside 10 feet of each other; verify accepted cast versus warning/cancellation and no rejected-cast resource loss. |

## Cross-cutting checks

- [ ] Repeat representative short/long ranges using Large/Huge tokens; preserve footprint-based boundary decisions.
- [ ] Repeat with elevation below/above the horizontal distance.
- [ ] Repeat representative checks in meter scenes, retaining the caller's existing conversion and tolerance.
- [ ] Have the GM view another scene while processing a player's supported action; use the token's scene measurement.
- [ ] For reaction/snapshot features, change movement/concentration after capture and verify existing timing policy rather than expecting this helper to recheck everything.
- [ ] Inspect resources, native dice, recipients, and applicable Undo—not just whether the button appeared.

Record a result by checking its row and adding date, GM/player role, scene units/grid, actor/form, valid/invalid setup, and observed outcome below. A passing mocked test does not check these boxes.

## Verification record

- **Before extraction:** 21 selected caller regression files passed.
- **After extraction:** 22 selected files passed, including the new local shared-distance fixture. Existing feature mock names/import adapters were updated without removing their assertions.
- **Dedicated helper checks:** No feature-hook registration; native footprint points, large/overlapping/fractional footprints, position snapshots, unchanged inputs, elevation, source-scene priority, same-scene canvas fallback, missing measurement, and metric output.
- **Full verification:** `node tools/run-tests.mjs --checks` passed: 366 discovered test files, zero failures; syntax checked for 315 runtime scripts, manifest files and relative imports verified.
- **Limits:** Many feature fixtures mock measurement; the dedicated helper fixture exercises the actual extracted helper. Together they do not establish real scene geometry, every feature prerequisite, or multiplayer timing.
- **User-confirmed in-game results after extraction, 2026-11-10:** Following the recommended test shortlist, the user reported that Fount of Moonlight, Dark One’s Blessing, Warding Flare, Hypnotic Presence, Words of Creation, and Mirror Image worked without issues. Exact range points, Wild Shape repetition, client roles, and scene settings were not separately detailed. The six checked rows reflect feature-level confirmation; other consumers and the cross-cutting size/elevation/metric/source-scene scenarios remain unchecked.

Tests/tools remain local and Git-ignored. No release package or publication is part of this change.
