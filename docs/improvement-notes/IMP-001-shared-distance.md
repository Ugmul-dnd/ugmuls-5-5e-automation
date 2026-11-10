# IMP-001: Give the shared distance helper a neutral home

[Findings register](README.md) · [Fount walkthrough](../guides/fount-of-moonlight.md)

## Summary

- **Status:** Proposed; not implemented.
- **Type:** Consolidation and dependency-clarity opportunity, not a confirmed distance defect.
- **Recorded and source checked:** 2026-11-09, `v1.0.1-dev` working tree.
- **Authorization:** The user requested recording the idea for later work. No runtime refactor is authorized by this note.
- **Observation:** `blessingDistance` is a general measurement helper exported from [dark-ones-blessing.js](../../scripts/dark-ones-blessing.js). Nineteen other scripts import it. Its location makes unrelated features depend on a feature-specific module.

The calculation is already reused. The initial opportunity is to clarify ownership and dependencies, not to claim that nineteen separate copies need replacing.

## Current tool and behavior

The helper accepts two token-like documents, `a` and `b`, and uses the first token's scene grid. It chooses points based on token position and footprint, asks the scene grid (or the matching active canvas grid) to measure a path between them, and returns the larger of that distance and the absolute elevation difference. Missing measurement produces `Infinity`.

Those details matter. This is not simply center-to-center distance or a Euclidean three-dimensional calculation. It does not itself enforce matching scenes, line of sight, hidden-token rules, reaction availability, or unit conversion of a spell's range. Callers supply their own eligibility conditions and range limits.

Importing the helper also evaluates its containing module's top-level code, including its hook registrations. That is an architectural connection, not evidence of duplicate registrations on every import: normal JavaScript module imports reuse a module's evaluation.

## Known connections

This list came from searching runtime scripts for imports of `blessingDistance`, then inspecting the calls. It covers nineteen direct importing files plus its defining feature as of the review date. It is not a full behavioral audit of those features or a complete inventory of all distance implementations in the module.

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

## Proposed change for later review

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

No tests were run for this documentation-only proposal, and no performance improvement is claimed.

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

- **Runtime changes:** None.
- **Implementation commit:** None.
- **Next decision:** Review and agree on extraction scope after the code review has mapped enough shared tools and callers.
