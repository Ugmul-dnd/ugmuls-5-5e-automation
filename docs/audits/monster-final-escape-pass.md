# Final Monster Manual escape pass

Added 16 shared recipes covering 22 previously unmatched native monster feature variants:

| Monsters | Feature |
| --- | --- |
| Aberrant Cultist | Tentacle Lash |
| Behir, Couatl, Marilith, Salamander, Yuan-ti Abomination, Yuan-ti Malison (Type 3) | Constrict |
| Brazen Gorgon | Smelting Charge |
| Bugbear Stalker | Quick Grapple |
| Chain Devil | Chain |
| Constrictor Snake, Giant Constrictor Snake | Constrict |
| Giant Frog | Bite |
| Giant Toad | Bite |
| Graveyard Revenant | Suffocate |
| Kraken | Tentacle |
| Kuo-toa | Sticky Net |
| Kuo-toa Whip | Pincer Staff |
| Purple Worm | Bite |
| Remorhaz | Bite |
| Tarrasque | Bite |
| Water Weird | Surge |

Also extend the existing Vine Blight Constricting Vine recurring-damage recipe with an optional escape action after the damage roll. This avoids conflicting damage and escape recipes on the same effect.

Target-turn-start cards offer an optional action without automatic rolls or forced action spending. Use native Athletics/Acrobatics choices and prepared native escape DCs. Kuo-toa Sticky Net is Athletics-only DC 10; helping someone else and destroying the net remain table-managed. Giant Toad Bite and Brazen Gorgon grapple lack native check activities, so their records use the originating actor's passive Athletics, matching the feature text. Their source actor identity plus native activity signature prevents other Bites or Smelting Charge outcomes from being mistaken for those rules.

Initial attacks/saves/conditions remain native. Success clears only the tracked native effect after Dice So Nice, including linked Restrained/Blinded/Suffocating conditions contained in it. Source book and actor items, initial damage, movement, range, size/capacity and attack restrictions remain unchanged. Clicking-user skill/roll routing, Retarget hiding, application/Undo eligibility, duplicate-turn and external-automation guards use existing shared workflows.

Deliberately manual:

- Kuo-toa Sticky Shield: weapon release, weapon usability and freeing the weapon are conditional alternatives. No automatic removal or forced weapon choice.
- Elemental Cataclysm: random multi-outcome card, including buried escape. Leave its selection/outcome workflow manual as agreed.
- Brazen Gorgon: choose the correct initial grapple versus alternate prone outcome manually. Only its actual Grappled & Restrained effect gets escape tracking; no escape is invented for the imported alternate Prone & Restrained effect.

The audit compares native effect names and activity IDs, not just feature names. Full native fixtures cover shared Constrict names with different native effect names, 109 Bite/Tentacles signatures remain protected by earlier poison regressions, and unrelated same-name attacks without the required native activities cannot match. Tests exercise registration, prepared and passive DCs, optional cards, turn-start timing, failure/success cleanup, duplicate suppression and ended effects. Earlier 25 grapple variants and all recurring-damage recipes remain in the regression suite.

Reload clients and apply fresh effects. Representative in-game checks: Constrictor Snake versus Behir (different linked conditions), Tarrasque Bite then Swallow, Kuo-toa Sticky Net (Athletics only), and Giant Toad or Brazen Gorgon (passive DC fallback). There is no need to test every shared variant.
