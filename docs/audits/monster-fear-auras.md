# Monster Manual fear auras

The straightforward persistent fear aura in the installed Monster Manual is Pit Fiend's Fear Aura. Animal Lord's Lordly Presence offers different chosen effects and remains manual. Dragon Frightful Presence entries cast the existing Fear spell rather than a persistent aura.

Fear Aura is a module Region Library default with local enabled/visibility overrides. It uses the existing automatic monster aura setup, including combat start. Its native 20-foot token-attached emanation is hidden from players by default and follows token movement. No action or Place Template is required.

At an enemy's turn start, the active GM checks current Region occupancy, normal hostile/friendly targeting, the source's Incapacitated/dead/defeated state, target eligibility and existing immunity. It prompts only that target's Wisdom save using the originating Pit Fiend's prepared DC through the existing connected-owner save router. No damage, resource consumption, concentration, additional template or cast animation occurs. Turn stamps prevent repeated save cards from duplicate updates.

The disposable helper retains the native Frightened effect and its changes, or creates a standard Frightened effect when the actual source item has none. Local effect links work without relying on legacy ID/UUID profiles. Existing Auto Apply Saved Effects settings control failure application. Tracked Frightened expires at the start of the affected creature's next turn, including after it has left the aura. Unrelated fear effects remain intact; shared effect equivalence distinguishes different aura sources.

After a successful save and Dice So Nice completion, a temporary 24-hour Fear Aura Immunity effect is created on the target. It records that exact source token and world-time expiry, without granting global Frightened immunity. Another Pit Fiend can still affect the creature. Duplicate updates cannot add duplicate immunity effects. Correcting the save removes only the immunity associated with that card; deleting immunity manually also releases its protection.

Validation: native/fallback effect construction, unmodified book data, prepared DC snapshot, hidden radius, enemy-only incoming-turn saves, duplicate suppression, expiry outside aura, separate fear sources, animation-delayed immunity, corrected/expired immunity, disabled settings, Incapacitated sources and condition-immune targets. Shared damage aura, library, card and save tests also pass.

In-game test: start combat with a Pit Fiend and an enemy inside 20 feet. On the enemy's turn, fail the Wisdom save and confirm Frightened. On its next turn the prior effect should clear and a new save appear if still inside. On success, confirm a temporary source-specific immunity effect and no more prompts from that Pit Fiend. A second Pit Fiend should still prompt. Stun the source to suppress new saves.
