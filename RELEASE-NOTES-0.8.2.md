# Ugmuls 5.5e Automation v0.8.2 — Class Features & Combat Flow

Bring more of your character into the combat workflow. This release expands Rogue, Fighter, Barbarian, Monk and Ranger support with integrated damage choices, reactions, repeat saves, linked effects and token-following auras. Enable the supported automation you want and leave situational decisions at the table.

## Rogue

- Cunning Strike and Improved Cunning Strike integrate their choices and Sneak Attack dice costs into damage configuration. Poison receives end-turn repeat saves; Trip uses a Prone icon. Devious Strikes adds Daze, Obscure and Knock Out, with next-turn expiry and damage-triggered wake-up where appropriate.
- Sneak Attack recommendations recognize an eligible ally beside the target; manually enabling Sneak Attack unlocks Cunning Strike choices.
- Uncanny Dodge appears on incoming damage cards. Evasion handles qualifying Dexterity saves with per-target zero/half damage and identifies feature holders on save summaries.
- Assassin gains Assassinate, Envenom Weapons and Death Strike assistance. Soulknife gains Homing Strikes and Rend Mind; Thief gains a linked first-round initiative entry through Thief’s Reflexes. Scion of the Three can select Terrify through Cunning Strike.

## Fighter

- Indomitable offers its native use and Fighter-level reroll bonus on failed saves. Studied Attacks tracks the missed creature and recommends Advantage on the next qualifying attack.
- Psi Warrior Psionic Strike appears after weapon damage is applied. Telekinetic Thrust choices accompany the strike, with the selected save beginning alongside its damage roll. Protective Field offers friendly-target damage reduction, visible adjusted totals/breakdowns and synchronized dice presentation.
- Champion Survivor creates Heroic Rally healing while Bloodied. Arcane Archer gains supported effect expiry, Grasping Shot escape prompts and source-correct Enfeebling reduction. Banneret gains capped map-linked ally selection, Team Tactics Advantage and Shared Resilience.

## Barbarian

- Indomitable Might replaces qualifying low Strength totals with the Strength score and labels the replacement.
- Primal Knowledge and Mindless Rage follow Rage activation and ending. Relentless Rage prompts its save when appropriate and retains the native increasing DC workflow.
- Berserker Intimidating Presence gains target/effect follow-through. Wild Heart Rage and Power choices share a selection dialog, with supported Bear/Eagle/Wolf and Falcon/Lion/Ram benefits, linked auras and direct Ram Prone application. Aspect choices remain available from their feature card.
- World Tree Vitality Surge grants its temporary HP with Rage while preserving a higher existing amount. Life-Giving Force remains manually activated.

## Monk

- Deflect Attacks/Energy offers incoming attack-damage reduction and the eligible redirect workflow. Disciplined Survivor supports its reroll while locking subsequent roll-mode changes.
- Flurry of Blows provides a two-attack counter, increasing to three with Heightened Focus, using Empowered Strikes when available. Bonus-action attacks exclude the Grappler feat’s attack-action benefit. Open Hand techniques integrate into Flurry damage configuration.
- Mercy adds Hand of Harm, Physician’s Touch, Hand of Healing substitutions and optional Flurry of Healing and Harm. Harm defaults to noncritical damage, with a setting to follow the triggering critical; Psionic Strike has a corresponding option.
- Elemental Strikes adds Push/Pull save choices alongside Grapple and Stunning Strike. Elemental Epitome gains resistance selection, linked cleanup, Destructive Stride and once-per-turn Empowered Strikes. Mystic Arts Focused Strike adds source-specific spell-save Disadvantage after Stunning Strike resolves.

## Ranger

- Base features: Relentless Hunter protects Hunter’s Mark concentration without a roll, Precise Hunter recommends marked-target Advantage, and Foe Slayer upgrades the integrated Mark die.
- Hunter: Hunter’s Prey and Defensive Tactics choices live in native rest dialogs. Superior Hunter’s Defense offers a damage-type resistance Reaction with a current-damage breakdown; Superior Hunter’s Prey reuses the original Hunter’s Mark damage on a selected enemy. Escape the Horde follows the table interpretation that attacks against the Ranger during their turn are opportunity attacks.
- Beast Master: linked Primal Companions receive supported Bestial Fury Mark damage. Companion commands and extra attacks remain manual.
- Gloom Stalker: Dreadful Strike, Ambusher’s Leap and Stalker’s Flurry support resource tracking, Mass Fear and Sudden Strike, including Argon HUD movement refresh.
- Fey Wanderer: Dreadful Strikes tracks each creature once per turn; Beguiling Twist offers Charmed/Frightened selection and repeat saves; Misty Wanderer adds a native free-cast activity to Misty Step.
- Hollow Warden: Wrath of the Wild gains an enemy-only Unnerving Aura. Hungering Might checks actual Bloodied HP for healing; Menacing Aura blocks healing/Reactions; Strangling Roots adds Sap or Slow alongside weapon mastery and remembers the user’s choice; Ancient Might adds the Wisdom damage bonus against Frightened targets while transformed. Persistent Wrath remains manual.
- Winter Walker: Polar Strikes and a managed Biting Cold resistance-bypass effect; Hunter’s Rime temporary HP on fresh Hunter’s Mark casts; Fortifying Soul Advantage against identifiable Frightened saves; Chilling Retribution on incoming damage cards, including after damage application; and an enemy-only Frozen Haunt aura dealing 2d4 Cold on adoption and Ranger turn start. Native form activation and immunities remain unchanged.

## Shared improvements and fixes

- Automated Hunter’s Rime, Hungering Might, Survivor and recurring healing now open pending Roll prompts for the source character’s active owner, with GM fallback. Enable **Automations → Common → Skip Automatic Healing Roll Prompts** to roll immediately. Automatic HP application remains a separate setting.
- Damage configuration controls stay visible with AC5e’s extra fieldsets and formula-only redraws. Critical recommendation highlighting, expanded damage reductions, player dice-animation timing and Retarget handling receive fixes.
- Prevent double-counted cover AC with AC5e/Simple Cover when effects already contribute cover to sheet AC. Preserve bypass features, stronger cover and native effects.
- Repair repeat-save sources for Smite follow-ups, stop Studied Attacks feedback loops and reuse Reckless Attack effects instead of accumulating copies.

## Updating and compatibility

- Refresh GM and player clients after installing. Keep an active GM connected for managed operations; apply fresh effects when testing changed features. Existing local automation-library overrides remain in control.
- Foundry VTT **14**; D&D5e **6.0.5 minimum**, verified configuration **6.0.6**. Matching official content is required for the features used; book content is not bundled. Imported/homebrew versions may require adjustments and are not covered by recorded content testing.
- Additional content used includes Heroes of Faerûn, Ravenloft: The Horrors Within and Arcana Unleashed, alongside the previously supported books.
- Use **Grid Shaped** emanations and match scene grid spacing/distance to the map. Recorded aura testing uses alternating **1–2–1 diagonals**. Avoid duplicate emitters from other aura modules for the same feature.
- Choice-heavy abilities, teleports/forced movement, companion commands and explicitly deferred mechanics remain table-managed. Fortifying Soul leaves unidentified fear saves manual. Chilling Retribution does not cancel the triggering hit’s damage; its stun and Speed 0 last through the end of the Ranger’s next turn.

See [CHANGELOG.md](CHANGELOG.md) for the detailed development record and docs/ for individual feature guides.

## Release validation

All **202 local regression test files passed**, and all **167 runtime JavaScript files passed syntax checks**. Release assets are built separately; tests, local tools, state and Git data are excluded from the module ZIP.
