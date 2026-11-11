# Ugmuls 5.5e Automation v1.0.1

This maintenance release improves Moonlight reaction and healing prompts, adds an Inspired Eclipse range guide, and separates shared helpers from individual spell scripts.

## Highlights

- **Fount of Moonlight blinding Reaction:** eligible incoming damage cards offer a compact **Blinding Reaction** button targeting the recorded attacker within 60 feet at roll time. The offer survives concentration loss from that hit, spends the defender's Reaction when used, and does not pause damage automation. Supports the native **Wreathed in Light** marker and Wild Shape, including use of the original Druid's spell when needed. Eligibility is captured once; later refreshes do not recreate the offer.
- **Blessing of Moonlight save corrections:** correcting a successful save to a failure can now offer healing for that recorded casting. Existing healing reservations and completed uses remain intact, preventing another heal from repeated corrections.
- **Inspired Eclipse range guide:** a temporary pulsing ring shows the teleport range while choosing a destination, including chat, feature, and recipient paths. It clears when placement ends; native destination validation and resource rules remain in charge.
- **Monk's Combat Details compatibility:** legendary initiative slot and anchor comparisons now invoke the libWrapper chain, preserving slot ordering without the missing-chain conflict warning.
- **Clearer shared code:** Stinking Cloud effect preparation and turn-end cleanup now live in its own spell script. Twenty distance consumers use a dedicated shared distance helper, and six startup consumers use a dedicated Actor-discovery helper. These extractions preserve existing range rules, snapshots, and setup behavior.
- **Cleaner diagnostics and documentation:** startup diagnostics report the installed module version. Developer guides explain common workflows, connections, and regression scenarios. Improvement notes track future cleanup and the deferred combined-card concept.

## Compatibility and requirements

- **Foundry VTT:** version 14; verified compatibility remains **14.370**.
- **D&D5e:** minimum **6.0.5**; verified compatibility remains **6.0.6**.
- **Required modules:** Automated Conditions 5e and Dice So Nice.
- Automations depend on matching source items, activities, effects, and native scaling. Official book content is not included.
- Keep an active GM connected for authoritative shared resource, effect, and HP operations.

## Verification

- **Automated release checks:** all 367 isolated test files passed with no failures. Syntax checks passed for 316 runtime scripts; manifest assets and relative script imports were verified. The targeted release-feature run also passed all 10 selected test files.
- **User-confirmed development checks:** Fount of Moonlight prompt behavior; Stinking Cloud casting as GM and client, start-of-turn checks, no application on cast, expiry, and concentration cleanup; the requested distance-helper feature checks; and the remaining startup-helper feature checks.
- **Still pending:** in-game confirmation of the latest Blessing of Moonlight save-correction fix and Inspired Eclipse range-ring visuals, plus installation/update and a smoke test of the final published package. Automated checks do not establish those in-game results.

## Updating

Install v1.0.1 and refresh all GM and player clients. Use fresh casts and rolls when checking prompts that capture eligibility at roll time; existing cards are not retroactively populated.

The ZIP contains the installer manifest, runtime scripts, styles, license, and these release notes. Guides and improvement notes remain in the repository. Local tests, tools, state, and Git data are excluded. Optional features remain configurable in Module Options.
