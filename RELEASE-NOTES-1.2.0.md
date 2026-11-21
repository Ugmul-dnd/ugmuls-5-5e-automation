# Ugmuls 5.5e Automation v1.2.0

Combat cards now give players time to use or decline eligible reactions before Smart Automation moves on to the next roll or applies damage and effects.

## Highlights

- **Reaction Triggers settings.** Configure when combat pauses for reactions and jump directly to the relevant class and feat switches.
- **Attack decisions.** Use declaration options such as Restore Balance, correct misses with features such as Precision Attack or Bardic Inspiration, and respond to hits with defenses such as Shield, Mirror Image, and Uncanny Dodge. A miss corrected to a hit checks for defenses before damage.
- **Failed saves.** Grouped save cards show each affected creature’s results and available choices, including Flash of Genius, Indomitable, Countercharm, and Guarded Mind. Players can decline their own options, and the GM can continue past all remaining choices. Shared damage and effects use the final saves.
- **Counterspell chains.** Eligible players and monsters can respond to spell declarations. Native saves resolve the chain before the original spell proceeds. An interrupted casting retains its spell slot or limited casting use while spending its action, bonus action, or Reaction as applicable.
- **Damage and Undo.** Options such as Parry, Song of Defense, and Bastion of Law appear after damage is visible and before HP application. Graze waits for miss corrections, and Vex applies and undoes with the damage card.
- **Chat and dice.** Chat follows newly opened decisions and pending damage until the user scrolls away. Resumed actions return below their reactions, and already played dice animations stay complete through card updates.

See the changelog in the repository for the full list of feature changes.

## Requirements and updating

- **Foundry VTT 14**, verified build **14.370**.
- **D&D5e 6.1.0 or later** (verified on 6.1.0).
- **Automated Conditions 5e** and **Dice So Nice!** must be installed and enabled. Keep an active GM connected for shared resource, effect, and HP operations.
- Official **Player’s Handbook (2024) 3.0.0** remains the target for PHB class automation. Updating the book leaves existing character items in place. Review owned features through your usual character-content workflow if they still use older item layouts.
- Back up your world, refresh GM and player clients after updating, and review **Reaction Triggers** and **Smart Automation** settings. Use fresh rolls when checking reaction options.

## Verification

- All 31 targeted regression files and all 398 full-suite test files passed. Syntax checks passed for 322 runtime scripts, and manifest assets and relative imports were validated.
- Installation and gameplay smoke testing of the packaged ZIP in a separate Foundry world is pending.
