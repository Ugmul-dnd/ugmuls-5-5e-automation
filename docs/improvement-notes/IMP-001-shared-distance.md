# IMP-001: Give the shared distance helper a neutral home

[Findings register](README.md) · [Fount walkthrough](../guides/fount-of-moonlight.md)

## Summary

- **Status:** Implemented; six caller features user-confirmed, remaining in-game checks pending.
- **Type:** Consolidation and dependency-clarity opportunity, not a confirmed distance defect.
- **Recorded and source checked:** 2026-11-09, `v1.0.1-dev` working tree.
- **Authorization:** Initially recorded for later; the user authorized extracting the helper and documenting each affected connection on 2026-11-10.
- **Original observation:** `blessingDistance` was a general measurement helper exported from [dark-ones-blessing.js](../../scripts/dark-ones-blessing.js), imported by nineteen other scripts. It now lives in [shared-distance.js](../../scripts/shared-distance.js) as `tokenDistance`, imported directly by all twenty consumers including Dark One's Blessing.

**Current caller map and check-off sheet:** [Shared distance verification](IMP-001-distance-verification.md). Use that file to record the user's checks for every migrated feature.

The calculation is already reused. The initial opportunity is to clarify ownership and dependencies, not to claim that nineteen separate copies need replacing.

## Current tool and behavior

The helper accepts two token-like documents, `a` and `b`, and uses the first token's scene grid. It chooses points based on token position and footprint, asks the scene grid (or the matching active canvas grid) to measure a path between them, and returns the larger of that distance and the absolute elevation difference. Missing measurement produces `Infinity`.

Those details matter. This is not simply center-to-center distance or a Euclidean three-dimensional calculation. It does not itself enforce matching scenes, line of sight, hidden-token rules, reaction availability, or unit conversion of a spell's range. Callers supply their own eligibility conditions and range limits.

Before extraction, importing the helper also evaluated its containing feature module, including hook registrations. Normal module imports reused that evaluation. The neutral helper now has no hooks/feature imports; the main module still explicitly loads Dark One's Blessing for its own setup.

## Known connections

This original list came from searching runtime scripts for imports of `blessingDistance`, then inspecting the calls. All nineteen importers plus the defining feature were migrated to `tokenDistance` on 2026-11-10. It is not a complete inventory of other distance implementations in the module; the linked verification sheet records the migrated branch for each feature.

| Caller | Measurement connection to preserve |
| --- | --- |
| [Dark One's Blessing](../../scripts/dark-ones-blessing.js) | Nearby recipient selection in `blessingRecipients`. |
| [Blessing of Moonlight](../../scripts/blessing-of-moonlight.js) | Moonlight Healing recipient range. |
| [Channel Divinity](../../scripts/channel-divinity.js) | Range and target eligibility for the supported activities. |
| [Cleric Potent Vitality](../../scripts/cleric-potent-vitality.js) | Recipient range validation. |
| [Corona of Light](../../scripts/corona-of-light.js) | Aura-range fallback when testing whether a token is inside. |
| [Countercharm](../../scripts/countercharm.js) | Bard-to-recipient distance. |
| [Divine Reaper](../../scripts/divine-reaper.js) | Caster-to-target range. |
| [Fount of Moonlight](../../scripts/fount-of-moonlight.js) | Defender-to-attacker range captured for the reaction offer. |
| [Guided Strike](../../scripts/guided-strike.js) | Source-to-target range in eligibility. |
| [Hypnotic Presence](../../scripts/hypnotic-presence.js) | Movement-driven separation checks that can end linked effects. |
| [Instinctive Charm](../../scripts/instinctive-charm.js) | Replacement target validation against the attacker's activity range. |
| [Invoke Duplicity](../../scripts/invoke-duplicity.js) | Proximity checks through its local `near` helper. |
| [Leading Evasion](../../scripts/leading-evasion.js) | Source-to-recipient proximity. |
| [Mirror Image](../../scripts/mirror-image.js) | Distance comparison with special senses, including sense/scene units. |
| [Sentinel at Death's Door](../../scripts/sentinel-at-deaths-door.js) | Range check alongside a separate sight-collision check. |
| [Spirits from Beyond](../../scripts/spirits-from-beyond.js) | Recipient range alongside ownership, scene, and visibility checks. |
| [Tandem Footwork](../../scripts/tandem-footwork.js) | Source-to-target range. |
| [Undead Vitality](../../scripts/undead-vitality.js) | Range alongside undead-target and visibility checks. |
| [Warding Flare](../../scripts/warding-flare.js) | Source-to-attacker distance when capturing eligible entries. |
| [Words of Creation](../../scripts/words-of-creation.js) | Distance between two different recipients before allowing the cast. |

## Original extraction proposal

Consider extracting the existing calculation into a small neutral module, such as `shared-distance.js`, with a name and documented contract that describe what it measures. Update consumers to import from that module. Decide whether an interim re-export is useful before removing the old export.

Keep the first implementation behavior-preserving. Do not simultaneously standardize all range limits, unit conversions, visibility rules, or snapshot timing. Any desired behavior change should have its own evidence and tests.

Before implementation, investigate:

- What grid APIs and scene/grid configurations the current callers rely on.
- Whether caller mocks depend on the existing import or exported name.
- Whether other distance helpers have genuinely equivalent behavior.
- Which callers accept token-like position snapshots rather than live Token documents.
- Whether any caller relies on the source module's setup occurring through that import.
- Whether cross-scene handling, elevation rules, fractional sizes, or metric rounding need separate findings. Do not silently change those policies during extraction.

Other possible shared helpers discussed during brainstorming include UUID resolution, collection conversion, authority/ownership checks, and transformed-actor lookup. These are investigation leads, not findings that they can safely be merged. Create separate entries only after inspecting their actual differences.

## Automated verification plan

The original documentation-only proposal ran no extraction tests. Implementation results are recorded below and in the verification sheet; no performance improvement is claimed.

- [ ] Inspect existing local coverage for the source feature and every direct caller. Record gaps rather than assuming a feature-named test exercises distance.
- [ ] Before extraction, establish fixtures for token footprints, elevation, grid measurement fallback, and unavailable measurement.
- [ ] After extraction, run relevant local regressions first. Available filename filters include `dark-ones-blessing`, `fount`, `blessing-of-moonlight`, `channel-divinity`, `cleric-potent-vitality`, `corona-of-light`, `divine-reaper`, `undead-vitality`, `warding-flare`, and `words-of-creation`. This is a starting list, not the complete caller coverage plan.
- [ ] Check that the neutral helper has no feature hooks or document writes and that unrelated feature setup is preserved.
- [ ] Run `node tools/run-tests.mjs --checks` after the shared change; record discovered suite results, syntax, imports, and manifest validation.

Tests/tools are local and Git-ignored. If absent, restore the user's local tooling backup and report the verification limit.

## In-game verification plan

These are planned scenarios for a future extraction. None is marked completed by this note. Compare the same scenario before and after the change; record exact settings and actual behavior. Correcting a discovered rules discrepancy is separate work.

| Scenario | Expected preservation | Status |
| --- | --- | --- |
| Fount: attacker just inside, exactly at, and just outside 60 feet; repeat in normal and Wild Shape forms | Same offer eligibility. Concentration loss/movement after capture does not rebuild it. Incoming HP automation continues; use still targets the recorded attacker. | Not run for refactor |
| Large/Huge token and ordinary-sized token near a range boundary, on supported grid settings | Same footprint-based measurement and boundary decisions. | Not run |
| Tokens at different elevations, with feet and meter scenes | Same distance/elevation comparison and caller-specific conversion behavior. | Not run |
| GM processes a player's supported action while viewing another scene | Same source-scene measurement; never silently measure using the unrelated viewed scene. | Not run |
| Warding Flare, Countercharm, and Sentinel range boundaries | Same eligibility, original roll handling, Reaction spending, and applicable Undo behavior. | Not run |
| Blessing of Moonlight, Potent Vitality, and Words of Creation choose recipients | Same valid/invalid targets; canceled or rejected choices retain their existing resource behavior. | Not run |
| Hypnotic Presence movement and Corona aura fallback | Same effect continuation/expiry and inside/outside decisions, including size/elevation changes where supported. | Not run |
| Mirror Image with relevant special senses and Instinctive Charm replacement targets | Same bypass and retarget decisions; no replacement of recorded targets with current selection. | Not run |
| Remaining callers in the connection table | Exercise the helper-dependent branch for each; record specific setups before implementation is considered verified. | Not run |

Fount's prompt appearance was user-confirmed before this proposal. That observation does not validate a future helper extraction or all of the scenarios above.

## Implementation record

- **Runtime changes, 2026-11-10:** Moved the existing calculation to `shared-distance.js`, renamed it `tokenDistance`, and switched all twenty runtime consumers. Feature policies and measurement logic remain unchanged; no other distance implementations were merged.
- **Loading:** Helper is import-loaded without a manifest entry. Dark One's Blessing keeps its explicit main-module setup import. No compatibility re-export remains; custom external imports of the former helper would require updating.
- **Automated checks:** 21 caller files passed before extraction; 22 selected files passed afterward with actual-helper fixtures. Full runner with checks passed: 366 files, zero failures; syntax, manifest files, and relative imports verified.
- **Implementation commit:** None from this task; local working-tree changes only.
- **In-game verification, 2026-11-10:** User confirmed no issues with Fount of Moonlight, Dark One's Blessing, Warding Flare, Hypnotic Presence, Words of Creation, and Mirror Image after the recommended shortlist. Detailed variations were not separately specified. Six rows are checked in the [20-feature checklist](IMP-001-distance-verification.md); remaining consumers and cross-cutting scenarios stay pending.
- **Next step:** Record feature-by-feature game checks; keep any newly discovered range-policy discrepancy separate from this organizational extraction.
