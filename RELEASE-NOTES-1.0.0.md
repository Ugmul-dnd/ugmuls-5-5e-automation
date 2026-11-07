# Ugmuls 5.5e Automation v1.0.0

The official v1.0.0 release combines native D&D5e combat assistance, configurable Regions, lingering-effect automation, and guided character creation. Automate routine steps while keeping the GM's decisions, roll corrections, and Apply/Undo controls available.

## Highlights

- **Find options quickly.** Search Module Options by setting name, description, class, or category. Nonmatching settings and empty selectors disappear while unsaved changes are retained. Feats, classes, common trackers, spells, and other settings are organized within the module menu.
- **Clearer management windows.** Region Effect Management and Automated Effects have fixed toolbars, searchable lists, compact rows, direct enable/disable controls, bulk selection, and reset controls for included defaults. Edit opens the supported details of prebuilt recipes.
- **Automatic legendary-action reminders.** Hidden, actorless slots provide an opportunity after player turns without starting a legendary monster's own turn. Only the current/upcoming reminder is shown to the GM. Empty slots are skipped and reminders resume after native recharge. Internal slots stay anchored during combat to preserve once-per-turn identifiers. Ordinary legendary-monster uses in the slot bypass the module's Reaction, Bonus Action, and spell-casting markers; explicit reactions and native resource costs remain intact. libWrapper integration composes with Monk's Combat Details when available.
- **Configure lingering effects.** Add automation from a creature, item, spell, or its chat card, then select an existing effect. General custom recipes support affected/source turn start/end and damage-taken saves. Configure the effects and activities on the source item first; this editor saves automation rules without creating source components. Native durations, scaling, source identities, and effect removal remain part of the existing workflow.
- **Expanded feat assistance.** Tavern Brawler rerolls base unarmed damage dice showing 1 once, including native Monk scaling. Elemental Adept supports selected elemental benefits. Mage Slayer, Lucky, Defensive Duelist, Crusher, Slasher, and Piercer integrate with the supported native rolls, resource pools, reactions, and corrections. Goliath Hill's Tumble is available under Common. See the changelog for each feature's supported scope.
- **Cleaner equipment choices.** Character-builder Choose buttons preselect matching tool, instrument, gaming-set, weapon, armor, and focus filters. Only validated equipment candidates appear, including the allowed Holy Focus choices, instead of unrelated red-locked entries.
- **Correct Legendary Resistance decisions.** Failed saving throws retain the GM decision safeguard. Attack riders such as Starry Wisp's Illuminated are no longer incorrectly held against legendary targets. Successful-save and single utility effects are likewise not treated as failed saves.
- **Preserved shared workflows.** Native dice, advantage/disadvantage cancellation, recorded targets, resource validation, reaction reservations, grouped cards, damage corrections, and HP/Effect Undo remain central. Shared chat-refresh batching is retained; no new measured performance improvement is claimed for this release.

## Compatibility and requirements

- **Foundry VTT:** version 14, verified with **14.370**.
- **D&D5e:** minimum **6.0.5**, verified with **6.0.6**.
- **Required modules:** Automated Conditions 5e and Dice So Nice.
- Matching official source items, activities, effects, and scaling are required for the automations that use them. The module does not include official book content. Imported or custom content may require configuration.
- Keep an active GM connected for authoritative shared resource, effect, and HP operations.

## Verification

- **Automated release checks:** 364 isolated test files passed with no failures. Syntax checks passed for 312 runtime scripts; manifest assets and relative script imports were verified.
- **User-confirmed in-game checks:** automatic legendary-action reminders, Starry Wisp against a legendary target, and equipment downselection. The user also reports successful combat testing across multiple computers and sessions, plus some testing in a second world.
- **Still pending:** installation/update of the packaged v1.0.0 release from GitHub and a fresh smoke test in the second world. Earlier second-world checks do not establish verification of the final uploaded package.

The downloadable module ZIP contains only the manifest, runtime scripts, styles, and license. Documentation and release history are available separately through the project website and repository.

## Updating

Install v1.0.0 and refresh all GM and player clients before testing. Use fresh activities, attacks, and casts for changes that depend on application-time context; older cards can retain their existing manual-decision holds.

For Automated Effects, use the source item's configured activity to apply its effect. Directly dragging an effect can copy its stored start timestamp through Foundry's native drop workflow; this release does not replace that behavior.

Optional features remain configurable in Module Options. Movement, narrative choices, unsupported feature variants, and other outcomes outside the documented workflows remain manual or native. Full technical changes and feature limitations are recorded in [CHANGELOG.md](CHANGELOG.md).
