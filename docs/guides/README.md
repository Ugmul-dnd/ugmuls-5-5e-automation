# Understanding Ugmuls 5.5e Automation

These guides explain the module's current code and the JavaScript used to build it. Start with the game behavior, then follow the files and functions that produce it.

The guides live alongside the existing reports without replacing or reorganizing them. Documents elsewhere in `docs/` may describe earlier audits, plans, or implementations; their presence does not establish that they match today's code.

## Reading order

1. [Module map](module-map.md): startup, Foundry documents, shared workflows, and where to look when changing a feature.
2. [Main automation script](main-automation.md): navigate feature loading, queued Region events, client routing, initial shared cards, and behavior attachment.
3. [Region library](region-library.md): trace built-in recipes, saved overrides, migration/reset, native source resolution, and existing-Region update boundaries.
4. [Shared activity cards](shared-activity-card.md): understand card relationships, adjustment locks, target synchronization, effects/Region helpers, and task queues.
5. [Pending casts and damage](pending-cast-and-damage.md): follow early cards, native consumption, cancellation/refunds, session takeover, and publication of finished rolls.
6. [Finding and refreshing cards](finding-and-refreshing-cards.md): understand keyed lookups, incremental index maintenance, feature selection, and batched rendering.
7. [Reactions and automation timing](reactions-and-automation-timing.md): follow Reaction reservation/reset, terminal stops, committed adjustments, and targeted restarts.
8. [Applying results and Undo](applying-results-and-undo.md): trace native HP/effect application, history, partial results, source-aware restoration, and reapplication controls.
9. [Shield walkthrough](shield-walkthrough.md): connect native casting, Reaction/slot use, applied AC, settlement, miss visibility, and Undo boundaries.
10. [Fount of Moonlight walkthrough](fount-of-moonlight.md): follow a real feature from damage roll to reaction, including the pending-card bug and the syntax behind its fix.
11. [Movement damage](movement-damage.md): follow native path measurement, chain counting, counter cards, reservations, and independent damage dice using Spike Growth as the built-in example.
12. [Save and damage prompting](save-and-damage-prompting.md): trace owner/GM routing, requested saves and retries, exact attack context, shared dialogs, and escape-check sessions.
13. [Target selection and correction](target-selection-and-correction.md): distinguish live selection, area preview, confirmed recipients, linked-card Retarget, and application history.
14. [Post-roll controls](post-roll-controls.md): follow attack/save mode corrections, damage critical conversion, preserved dice/caches, authority, animations, and application locks.
15. [Ongoing effects](ongoing-effects.md): trace recurring application identity, turn/damage phases, Region-owned conditions, concentration/targeting cleanup, and protected inactive-effect removal.
16. [Concentration lifecycle](concentration-lifecycle.md): follow native roots, cast replacement/cancellation, requested checks, sessions/takeover, protected effects, ending, summons, and Wild Shape transfer.
17. [Presentation and animation](presentation-and-animation.md): distinguish recorded/visible results, source-card handoff, grouped pending saves, tags, scrolling, private animation waits, and client acknowledgments.
18. [Region placement and conditions](region-placement-and-conditions.md): connect manual/automatic placement, native attachment, placement-only casts, effect authority, disposition filtering, and source-owned conditions.

These guides map the core shared workflows, not every script. Additional Bardic Inspiration and individual Region/feature walkthroughs can be added where they clarify a shared connection.

## Improvements discovered while reading

Record cleanup and consolidation opportunities in [Improvement notes and ideas](../improvement-notes/README.md). Each finding connects the relevant helpers and features to a future automated and in-game verification plan. Recording an idea does not change runtime behavior or authorize its implementation.

## How to read the examples

Code blocks identified as excerpts come from the linked source, sometimes with whitespace expanded for readability. Conceptual sequences describe responsibilities; they are not runnable scripts or a promise that every feature follows exactly the same sequence.

The source links point into this repository. Follow a named function rather than relying on line numbers, which change as the module grows.

## Evidence and maintenance

The initial guides were checked against source on **2026-11-09**, on the `v1.0.1-dev` working branch. They describe that implementation, not a published v1.0.1 release.

We distinguish three kinds of evidence:

- **Source review:** what the implementation currently does.
- **Automated checks:** behavior exercised with local test fixtures and Foundry mocks. These do not establish actual multiplayer timing or measured performance.
- **User-confirmed behavior:** observations from a real Foundry session, with the scope of that confirmation stated explicitly.

When changing a documented workflow, review its guide and nearby comments in the same change. Keep explanations of intent separate from behavior verified in code. Tests and build tooling are local and Git-ignored, so their source links cannot be assumed to exist in a fresh GitHub checkout.

## Where these files go

`docs/guides/` belongs in the GitHub repository. The current local release builder packages `module.json`, `LICENSE`, the current release notes, runtime JavaScript, and styles; it excludes these guides. Comments inside runtime scripts travel with those scripts.
