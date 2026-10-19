# Monster Manual poison save auras

Adds five straightforward passive aura sources to the shared hidden monster-aura workflow:

| Feature | Monsters | Native radius | Save | Successful-save immunity |
| --- | --- | --- | --- | --- |
| Stench | Ghast, Ghast Gravecaller | 5 feet | Constitution; source activity DC | 1 hour against Ghast-kind Stench |
| Stench | Hezrou | 10 feet | Constitution; source activity DC | 1 hour against Hezrou Stench |
| Stench | Troglodyte | 5 feet | Constitution; source activity DC | 1 hour against Troglodyte Stench |
| Fetid Aura | Swarm of Dretches | 10 feet | Constitution; source activity DC | None |

Both Region Library defaults attach automatically, including combat start, and remain hidden from players by default. Local enabled/visibility overrides persist. The actual actor activity supplies radius and prepared DC. These auras prompt at the affected creature's turn start, including creatures sharing the source's disposition. Stench excludes its own monster kind; Fetid Aura has no such exception. The source token is always excluded.

Failure offers/applies the source's native Poisoned effect through Auto Apply Saved Effects. Missing source effects receive a standard Poisoned fallback. Local effect links avoid original actor lookup or migrated UUID issues. The native effect changes are preserved; the supplied book Fetid Aura effect contains no action/reaction changes, so its action-versus-Bonus-Action choice and reaction restriction remain table-managed. No damage, consumption, concentration or new cast template occurs.

Tracked aura Poisoned expires at the next target turn start, including after leaving the aura. Source-specific flags prevent replacing or deleting unrelated poison/fear. Existing Pit Fiend Fear Aura behavior remains unchanged.

After successful Stench saves and dice animation completion, a temporary one-hour immunity effect is added. Its scope is the monster kind, rather than the individual source: another Ghast/Gravecaller shares Ghast immunity, while Hezrou and Troglodyte remain independent. Monster compendium identity is used so renamed copies retain their kind; recognizable original names provide a fallback. Unknown custom Stench sources use the source actor identity. Native poison condition immunity skips the saves. Save corrections remove only immunity granted by that card. World time and native effect expiry end immunity; deleting the immunity effect manually also releases protection.

No temporary immunity is granted for Fetid Aura. These native descriptions have no Incapacitated exception; they retain that rule rather than inheriting the Pit Fiend/Azer suppression. Dead/defeated sources remain suppressed by the general aura handler.

Excluded for separate handling: Chasme Drone is an activated Bonus Action, Flumph Stench Spray is a targeted spray that transfers an aura, Animal Lord has chosen effects, and Aboleth Mucus Cloud requires underwater state plus a persistent curse with ten-minute damage/moisture conditions.

Validation: five native fixtures, normal/missing Poisoned effects, source changes/DC/radius, hidden defaults, duplicate guards, all-disposition targeting, own-kind exclusions independent of success immunity, Ghast/Gravecaller shared immunity including renamed copies, other-kind independence, one-hour expiry, no Fetid immunity and next-turn cleanup outside the aura. All 98 regression tests pass.

In-game: test Ghast for start-turn CON and failed-save Poisoned; succeed and enter another Ghast's aura to confirm shared immunity. Test Hezrou to confirm its Stench still prompts. Test Swarm of Dretches to confirm success does not suppress next-turn saves.
