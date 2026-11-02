# Ugmuls 5.5e Automation v0.8.4 — Sorcerers, Wizard Casting & Region Preview

This release adds Sorcerer casting and subclass workflows, Wizard recovery and free-cast support, and a live target preview while placing Regions. Existing chat-card corrections, manual Apply and Undo remain available.

## Sorcerer casting

- **Select Metamagic** keeps target confirmation and shows compact option dropdowns, available Sorcery Points and the total cost. Quickened uses the shared Bonus Action tracker; Twinned lets the player add its extra target on the map. Subtle, Distant and Extended record their use and spend points, while their remaining range/duration/component handling stays manual.
- **Font of Magic** opens a conversion picker with shared spending limits. **Sorcerous Restoration** appears as an optional Short Rest recovery.
- Reaction spells such as Shield skip the casting Metamagic confirmation.

## Sorcerer subclasses

- **Draconic:** select Elemental Affinity and receive its matching resistance and spell-damage bonus.
- **Aberrant:** condition-save assistance, Psionic Sorcery payment, Revelation in Flesh benefit choices, and Warping Implosion payment/area/teleport support.
- **Clockwork:** Restore Balance on eligible roll cards; Bastion ward dice and damage reduction; Trance of Order roll benefits; and Clockwork Cavalcade healing allocation across recipients.
- **Shadow:** Strength of the Grave recovery prompts, Beasts of Ill Omen save aura, and optional Umbral Form with Innate Sorcery. Shadow Walk remains manual.
- **Spellfire:** optional Crown of Spellfire with Innate Sorcery, Burning Life Force damage reduction and Spell Avoidance save outcomes.
- **Wild Magic:** Tides of Chaos on D20 rolls; surge-check and guaranteed-surge buttons; Bend Luck roll adjustments; two-result Controlled Chaos selection; and a Tamed Surge result picker. Dice So Nice finishes before surge results appear. Results offer targeted effects or visible rules reminders, including a recurring turn-start surge buff.

## Wizard

- **Arcane Recovery:** select expended slots in Short Rest with a live recovery budget and the native once-per-Long-Rest counter.
- **Spell Mastery:** a spell with an active Mastered enchantment defaults to no slot at base level and slot consumption when upcast. Native manual checkbox overrides remain available.
- **Signature Spells:** keep Make Signature. Each marked spell receives one Short/Long Rest charge and a separate **Signature Cast/Use** activity. That activity casts at base level and spends its own charge. Use the original activity for normal casting and upcasting, including after the Signature charge is gone.
- Item-enchantment cards no longer show map Retarget.

## Live Region targeting

Eligible targets update as the player moves or rotates a Region preview. Enemy, ally, all-creature and other supported casting filters reuse the existing target rules. The normal target collection and confirmation after placement are unchanged.

Find the option under **Targeting → Preview Targets While Placing Regions**. Changing it displays a persistent GM reminder to restart Foundry and refresh connected clients.

## Updating and testing

- Install the update, restart the Foundry server, and refresh all GM/player clients. Existing Signature enchantments receive the per-spell activity and counter configuration; spent charges are preserved.
- Keep an active GM connected for shared operations and inventory/effect setup. Use fresh casts and effects when checking changed behavior.
- Foundry VTT **14**; D&D5e **6.0.5 minimum**, verified configuration **6.0.6**. Required modules remain **Automated Conditions 5e** and **Dice So Nice**; no new animation dependency is added.
- Matching official source content is required for the features used. The module does not bundle book content. Custom/imported items may require adjustments.
- Complex surge outcomes remain manual where the applied effect is labeled **Reminder**. Spectral Shield adds AC automatically; its Magic Missile immunity remains in the effect text for manual handling.
- Declaration-only Metamagic and deferred subclass mechanics remain manual as described above. See [CHANGELOG.md](CHANGELOG.md) for the full release changes.

## Release validation

All **289 local regression test files passed**, and all **242 runtime JavaScript files passed syntax checks**. Manifest files and relative imports were verified. The local ZIP is verified against source hashes, includes these release notes, and excludes tests, tools, Git data and local state. Assets are packaged locally and have not been published. This preparation did not perform a new Foundry play-through; user-confirmed in-game checks during development are separate from automated regression checks.
