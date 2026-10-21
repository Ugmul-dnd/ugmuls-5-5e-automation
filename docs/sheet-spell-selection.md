# Add Spell multi-selection (0.8.1 development)

With Open Compendium Browser from Add Item enabled, native and Tidy character sheet spell Add/New controls open the D&D5e compendium's existing selection mode. The current class spell lists are preselected, with editable filters and spell-only content locked. The native selection panel supports multiple checked spells and one confirmation; no drag/drop is required.

Full-list preparation classes retain the Browse Compendium / Load Unprepared Spells chooser when enabled. Browse now uses the multi-selector. Inventory Add Item continues to open the ordinary physical-item browser. Normal sheet selection has no character-creator exact-count quota or spell-slot-level restriction; tables retain their normal authority over learned/available spells.

Only the matching browser's native confirmation hook commits its selection. Closing the window without confirming imports nothing, even with checked spells. Picker state is isolated per actor/browser, hooks are removed on close and duplicate Add clicks reuse the actor's open picker.

Imports revalidate ownership, resolve the entire selection before creating anything, skip owned identifiers/name fallbacks and duplicate source-book copies, and serialize per actor to prevent concurrent duplicate additions. Native compendium data conversion preserves embedded effects and source metadata. Native spell onDropCreate processing determines casting method; a unique matching class can also supply class association and its method, including Pact. Leveled additions start unprepared and cantrips prepared. Existing owned spell preparation is unchanged.

Tests cover confirmation/cancellation, class/multiclass filters, batch import, effects/source immutability, preparation, duplicate guards, unavailable sources, permission changes, independent browsers, existing standard/Tidy controls and full-list loader behavior. In game: reload, Add Spell, check two spells, confirm, inspect class/method/preparation; repeat with an owned spell and close a checked picker without confirming.
