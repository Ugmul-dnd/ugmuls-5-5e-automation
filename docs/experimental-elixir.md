# Experimental Elixirs

Use the native **Elixirs on Long Rest** action on the rest card or the Experimental Elixir feature. It opens a creation/distribution window instead of only reporting the elixir count. This manages the free Long Rest batch; the separate spell-slot-funded **Create Additional Elixir** action keeps its native workflow.

The GM evaluates the feature’s native count formula and rolls the native Experimental Elixir table once for each bottle. The window displays each die result, the resulting elixir, and a **Target PC** dropdown. A result of 6 offers a choice among the five native elixir effects. Recipients include the Alchemist and party characters on the requesting player’s current map, even when that player does not own their inventories.

**Create & Distribute** creates native one-use consumable elixirs in the selected inventories. Native healing/effect activities handle drinking and administration. Generated copies keep only the appropriate level-scaled healing activity or buff effect; healing records the creator’s Intelligence modifier. Source compendium items are unchanged.

Closing the window preserves the dice without creating items. Reopening resumes that batch without rerolling. Successful distribution is recorded once, so repeated clicks cannot duplicate the bottles. Failed inventory creation rolls back earlier recipients’ new bottles, permitting another attempt with the same results.

At the creator’s next completed Long Rest, unused generated elixirs disappear from party inventories and a fresh batch becomes available. Other creators’ elixirs, ordinary potions and already-applied buffs are preserved. Active GM authority is required for rolling/validation and changes to other party inventories.

Automated coverage is in `tests/experimental-elixir.test.mjs`; live GM/player rest-card creation, dice animation, distribution and consumption still require Foundry verification.
