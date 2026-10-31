# Natural Recovery

Short Rest offers slot-count dropdowns for expended level 1–5 slots when the 2024 Natural Recovery feature's Recover Spell Slots activity has a use available. The spell-level budget is half the Druid class level, rounded up. Each dropdown is limited by the budget left after all other selected slot levels. Selecting a level-5 slot from a budget of 10 leaves five levels for other choices; reducing it restores those options. Exhausted dropdowns retain a zero-only row. The native change handler updates the stored form configuration and rerenders the choices. The section title shows selected levels and the budget; form submission and pre-rest completion both validate the selection.

At `dnd5e.preRestCompleted`, selected slot restoration is merged into the native rest's actor update, and only the recovery activity's spent use is merged into its item update. The native bulk rest workflow applies these updates. Nothing is spent on field changes, an empty selection or a canceled dialog. Existing rest updates remain intact; changing or already restored slots are rejected before adding any updates. The native Long Rest recovery restores the activity use.

The free-cast activity remains manual. No spell-cast hooks, prompts or checks were added. Pact slots and slots of level 6+ are excluded. Ownership and current availability are revalidated before rest updates.

Automated tests cover budget rounding, level limits, expended slots, player ownership, independent free-cast/recovery pools, cancellation, stale state, merged native updates and duplicate processing. In-game testing remains pending.
