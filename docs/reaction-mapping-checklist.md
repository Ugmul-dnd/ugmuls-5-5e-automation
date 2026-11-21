# Reaction automation mapping checklist

Updated: **2026-11-16** · Development branch: `adv-combat-automation-dev`.

Working checklist for reviewing existing scripts and connecting them to the proven timing stages. The runtime catalog is [FEATURE_TIMINGS in reaction-timing.js](../scripts/reaction-timing.js); [reaction-timing.md](reaction-timing.md) explains the shared workflow. This document is a review/test tracker, not executable configuration. Attack animations play after declaration choices finish; hit-stage cards hold totals and dice details until defenses finish, without replaying the animation.

**Catalog: 49 entries — 38 connected, 11 planned.** Related scripts missing from that catalog are listed separately below. Several entries are roll adjustments, passive protections or follow-ups rather than actions that spend a Reaction.

- **Connected** means wired into the new staged flow, not automatically in-game verified.
- **To connect** means the feature’s existing automation remains implemented; its new timing connection still needs work. Proposed triggers must be checked against the native activity before implementation.
- **Review only / follow-up** may need no new mandatory pause. Avoid adding stops that cannot change the incoming result.
- User-confirmed observations below are separate from automated regressions. The last complete automated run passed 398 test files; that does not replace live GM/player testing.

## How the pieces link

| Shared component | Responsibility | Links to |
| --- | --- | --- |
| [pending-cast.js](../scripts/pending-cast.js) | Native usage card and cast lifecycle; stops before templates/resources when interrupted | Spell declaration → Counterspell → native casting or stopped receipt |
| [reaction-timing.js](../scripts/reaction-timing.js) | Declaration/hit stages, captured choices, concealment, player declines and GM continuation | Feature eligibility → existing feature handler → next stage |
| [save-reaction-timing.js](../scripts/save-reaction-timing.js) | Visible save results, failed-save choices, area-save completion and damage resume | Save bonus/reroll → updated outcome → existing HP workflow |
| [staged-reductions.js](../scripts/staged-reductions.js) | Reserve Parry/Deflect before damage is revealed | Exact attack → selected defender → exact linked damage → reduction |
| [reaction-tracker.js](../scripts/reaction-tracker.js) | Authoritative Reaction availability and markers | Feature spending → caster/defender Reaction → source-turn reset |
| [reaction-spell-resources.js](../scripts/reaction-spell-resources.js) | Native slots, limited uses and linked monster source pools | Shield/Counterspell → native spell or granting Cast activity |
| [shared-activity-card.js](../scripts/shared-activity-card.js) | Recorded targets, linked HP index and adjustment locks | Original usage/attack/save → damage receipts → corrections and Undo |
| [npc-damage-automation.js](../scripts/npc-damage-automation.js) | HP/effect application after readiness and dice animations | Save/reaction completion → current unapplied recipients only |
| [reactive-automation.js](../scripts/reactive-automation.js) | Existing additional reaction/roll-adjustment governor | Staged gates take precedence; legacy feature behavior stays available |
| [chat-refresh.js](../scripts/chat-refresh.js) | Targeted, coalesced presentation updates | Changed actor/item/effect → relevant live cards; no per-feature history loop |
| [card-presentation.js](../scripts/card-presentation.js) | Reaction scrolling and resumed-action placement | Reaction cards → resumed original group at the bottom of the current view |
| [module-settings.js](../scripts/module-settings.js) | Reaction Triggers page; class/feat/spell switches | Stored game settings → existing script eligibility |

## Connected — verify and keep stable

| Feature / source | When it appears | How it links up | Feature switch | Live test status |
| --- | --- | --- | --- | --- |
| **Counterspell** · [counterspell.js](../scripts/counterspell.js) | Spell declaration; before costs/templates | Native Counterspell → caster CON save → continue/stop parent; chains resolve inside out. Opposing token sides only. | `counterspellAutomation` | User-confirmed chains and Flash of Genius handoff; limited-use preservation still needs a recorded live check. |
| **Warding Flare** · [warding-flare.js](../scripts/warding-flare.js) | Attack declaration; dice and result concealed | Native roll-mode adjustment → optional Improved Flare temporary HP → hit-stage defenses. | `wardingFlareAutomation` | User-confirmed GM/player flow; footer placement changed since initial test. |
| **Unbreakable Majesty** · [unbreakable-majesty.js](../scripts/unbreakable-majesty.js) | First hit by each attacker on a turn; before optional hit defenses, including criticals | Active Majestic Presence → mandatory native Charisma Recoil save. Failure makes this attack miss; success continues to eligible defenses. No extra use or Reaction; declaration choices resolve first. | `unbreakableMajestyAutomation` | User-confirmed automatic save and mandatory hold; no extra action or Reaction. Targeted regressions and full 398-file suite passed. |
| **Shield** · [shield-reaction.js](../scripts/shield-reaction.js) | Hit; criticals excluded, totals/dice held | Native spell/source consumption → Shield effect → AC recheck → reveal/damage; caster-turn expiry. | `showShieldReaction` | User-confirmed casting/resources; expiry fix needs an explicit fresh result recorded. |
| **Defensive Duelist** · [defensive-duelist.js](../scripts/defensive-duelist.js) | Melee hit; criticals excluded, totals/dice held | Equipped finesse weapon + Reaction → native AC effect → recheck hit. | `defensiveDuelistAutomation` | User-confirmed working on GM/player clients. |
| **Uncanny Dodge** · [uncanny-dodge.js](../scripts/uncanny-dodge.js) | Hit, including criticals; before damage reveal | Native Reaction → defender-only half-damage setting → linked damage Apply/Undo. Clicking confirms the defender can see the attacker; no item charge or new dice. | `uncannyDodgeAutomation` | Targeted regressions and full 398-file suite passed; live GM/player test needed. |
| **Combat Inspiration** · [combat-inspiration.js](../scripts/combat-inspiration.js) | Hit for defensive AC; criticals excluded | Recipient spends its exact Valor-granted Inspired die; no Reaction → AC recheck. Damage option stays in the initial damage configuration, without a Reaction or extra stop. | `combatInspirationAutomation` | Targeted regressions and full 398-file suite passed; live GM/player test needed. |
| **Bardic Inspiration** · [bardic-inspiration.js](../scripts/bardic-inspiration.js) | Failed attack / failed save | Spend the exact granted Inspired die without a Reaction; preserve original dice. Miss→hit opens eligible defenses; AC-induced misses can offer the attacker’s captured grant. NPC-to-player saves share the visible failed-save decision. Checks retain existing handling. | `bardicInspirationAutomation` | Targeted regressions and full 398-file suite passed; live GM/player test needed. |
| **Cutting Words** · [cutting-words.js](../scripts/cutting-words.js) | Attack reduction at Hit Decision; damage reduction after visible damage, before HP application | Native Bardic Inspiration use + helper Reaction. Attack reduction excludes criticals. Damage choice sees the rolled amount; preserve original dice, separate tooltip breakdown, resource rollback and Apply/Undo. Existing pre-damage reservations remain finishable. | `cuttingWordsAutomation` | Targeted regressions and full 398-file suite passed; live GM/player test needed. |
| **Protective Field** · [protective-field.js](../scripts/protective-field.js) | Hit decision; reserve before damage reveal, including criticals | Capture eligible Psi Warrior helpers and the exact recipient. Reserve helper Reaction → linked single-target damage → native Energy Die + Intelligence reduction before resistances. Combined damage/reduction animation; original rolls and recipient-only Apply/Undo remain intact. Save-only damage retains existing handling. | `protectiveFieldAutomation` | Targeted regressions and full 398-file suite passed; live GM/player test needed. |
| **Projected Ward** · [projected-ward.js](../scripts/projected-ward.js) | Hit decision; reserve before damage reveal, including criticals | Capture an eligible Abjurer’s existing ward and exact ally. Reserve Reaction → linked single-target damage → spend ward HP after recipient mitigation, then overflow. Keep the ward’s rest epoch, native pool, cross-actor authority and Undo. Save-only damage retains existing handling. | `projectedWardAutomation` | Targeted regressions and full 398-file suite passed; live GM/player test needed. |
| **Song of Defense** · [song-of-defense.js](../scripts/song-of-defense.js) | After damage is rolled and visible; before HP application, for attacks and saves | Active Bladesong + native slot picker. Cancel spends nothing; confirm spends one slot and Reaction. Existing reactive governor holds automatic HP application while choices remain; preserve original dice, recipient-only mitigation and Apply/Undo. | `songDefenseAutomation` | Targeted regressions and full 398-file suite passed; live GM/player test needed. |
| **Bastion of Law** · [bastion-of-law.js](../scripts/bastion-of-law.js) | After damage is rolled and visible; before HP application, for attacks and saves | Warded recipient sees damage and chooses how many native ward dice to spend. Further batches remain available while dice and damage remain; add reductions to one target-specific running total. Cancel spends nothing; no Reaction cost. Existing reactive hold, exact ward instance, per-recipient reduction, source creation resources and Undo remain intact. | `bastionLawAutomation` | Targeted regressions and full 398-file suite passed; live GM/player test needed. |
| **Parry** · [parry.js](../scripts/parry.js) | After visible melee damage; before Apply; criticals allowed | Reaction + native Superiority Die → reduce the rolled damage → recheck remaining choices → HP Apply/Undo. Old hit-stage reservations remain finishable. | `parryAutomation` | Earlier flow user-confirmed; post-damage timing awaiting retest. |
| **Deflect Attacks / Energy** · [deflect-attacks.js](../scripts/deflect-attacks.js) | Hit; before damage; criticals allowed | Reserve Reaction → linked damage reduction → optional native Redirect if reduced to zero. | `deflectAttacksAutomation` | Connected; separate Deflect Attacks/Energy result not recorded. |
| **Illusory Self** · [illusory-self.js](../scripts/illusory-self.js) | Hit / critical hit; before totals/damage reveal | Feature use + Reaction → native automatic miss → reveal; native slot-funded recharge remains separate. | `illusorySelfAutomation` | User-confirmed working in the first attack batch. |
| **Instinctive Charm** · [instinctive-charm.js](../scripts/instinctive-charm.js) | Hit / critical hit; before totals/damage reveal | Feature use + Reaction → attacker WIS save → explicit Retarget on failure → check redirected defender’s hit-stage defenses. | `instinctiveCharmAutomation` | User-confirmed mechanics; clearer redirect popup/box added, awaiting UI retest. |
| **Steel Defender: Deflect Attack** · [steel-deflect.js](../scripts/steel-deflect.js) | Attack declaration; before reveal | Steel Defender Reaction → original attack-mode adjustment → native Improved Deflection follow-up → hit stage. | `steelDeflectAutomation` | User-confirmed working after the footprint range fix. |
| **Lucky** · [lucky.js](../scripts/lucky.js) | Attack declaration; before reveal | Native Luck Point → normal Disadvantage/Advantage cancellation → hit-stage defenses. Does not spend a Reaction. | `luckyAutomation` | User-confirmed working in the first attack batch. |
| **Restore Balance** · [restore-balance.js](../scripts/restore-balance.js) | Attack declaration; qualifying Advantage/Disadvantage only | Native use + helper Reaction → Normal using the first original d20 → remaining declaration choices / hit defenses. Save handling retains its existing adjustment workflow. | `restoreBalanceAutomation` | User-confirmed working; targeted regressions and full 398-file suite passed. |
| **Flash of Genius** · [flash-of-genius.js](../scripts/flash-of-genius.js) | Failed save; normal save result remains visible | Native bonus changes existing save → recheck failure/sibling opportunities → resume existing or pending damage. Ability checks retain existing handling. | `flashOfGeniusAutomation` | User-confirmed Counterspell save rescued by Flash, then original spell continued. |
| **Indomitable** · [indomitable.js](../scripts/indomitable.js) | Failed save; normal save result remains visible | Native reroll + Fighter-level bonus → recheck remaining choices → resume damage. | `indomitableAutomation` | Connected; separate feature-specific in-game result not recorded. |

| **Beguiling Defenses** · [beguiling-defenses.js](../scripts/beguiling-defenses.js) | Hit decision, including critical hits | Native feature use + Reaction → defender-only half damage → attacker WIS save → failed save returns actual damage taken. Pact restoration keeps its native pool. | `beguilingDefensesAutomation` | User-confirmed working after separating its API from Beguiling Twist. |

| **Investment Resistance** · [chain-investment.js](../scripts/chain-investment.js) | After visible damage; before application | Warlock Reaction → Resistance for the linked familiar against this damage only. Works with attack/save damage and shared Decline Reaction. | `chainInvestmentAutomation` | User-confirmed working. |

| **Superior Hunter’s Defense** · [superior-hunters-defense.js](../scripts/superior-hunters-defense.js) | After visible damage; before application | Ranger Reaction → choose an incoming damage type → native Resistance through the end of the current turn. Shared Decline Reaction; preserve the triggering card’s protection for delayed Apply/Undo. | `superiorHunterDefenseAutomation` | User-confirmed working. |

| **Sentinel at Death’s Door** · [sentinel-at-deaths-door.js](../scripts/sentinel-at-deaths-door.js) | Hit; before damage; criticals allowed | Snapshot a friendly Bloodied target within 60 feet → reserve Cleric Reaction → spend native use and halve the exact linked damage before Resistance. | `sentinelDeathAutomation` | User-confirmed working after the preCreate ID fix. |

| **Precision Attack** · [battlemaster.js](../scripts/battlemaster.js) | Miss decision; before damage | Native Superiority Die or available Relentless d8 → add to original attack → recheck hit-stage defenses if it hits. No Reaction; shared decline support. | `precisionAttackAutomation` | User-confirmed working after separating the Guided Precision API. |

| **Seeking Spell** · [seeking-spell.js](../scripts/seeking-spell.js) | Spell attack miss; before damage | Native Metamagic charge → reroll one d20, accepting the new result → recheck hit-stage defenses on a hit. No Reaction; shared decline support. | `seekingSpellAutomation` | User-confirmed working. |

| **Guided Strike** · [guided-strike.js](../scripts/guided-strike.js) | Miss decision; before damage | Channel Divinity → +10 to the original attack → defender options on a hit. Self-use has no Reaction cost; helping an ally uses the Cleric’s Reaction. | `guidedStrikeAutomation` | User-confirmed working. |

| **Bend Luck** · [bend-luck.js](../scripts/bend-luck.js) | Attack result / save result; checks retain existing handling | Sorcerer Reaction + native Sorcery Point cost → add to another player-controlled creature’s failure or subtract from enemy success → recheck remaining choices and continue. Natural attack 1/20 excluded; original dice retained. | `bendLuckAutomation` | User-confirmed working. |

| **Cosmic Omen (Weal / Woe)** · [cosmic-omen.js](../scripts/cosmic-omen.js) | Attack and save result; checks/initiative retain existing handling | Native omen use + Druid Reaction → Weal helps friendly failures / Woe hinders hostile successes → recheck remaining choices. Preserve native die, long-rest omen and original roll. | `cosmicOmenAutomation` | Connected; awaiting GM/player confirmation. |

| **Fanatical Focus** · [fanatical-focus.js](../scripts/fanatical-focus.js) | Failed save while Raging | Native replacement d20 + Rage Damage bonus → recheck save choices → continue. No Reaction; one use per Rage, even if reroll fails. Extending Rage does not refresh it. | `fanaticalFocusAutomation` | User-confirmed working, including once-per-Rage enforcement. |

| **Mirror Image** · [mirror-image.js](../scripts/mirror-image.js) | Hit decision, including criticals | Optional shared hit control → native d6 per active duplicate → any 3+ removes exactly one duplicate and makes the attack miss. Other defenses may resolve first; no Reaction cost and no roll until clicked. | `mirrorImageAutomation` | User-confirmed working, including failed interception → Shield and Counterspell-decline continuation. |

| **Disciplined Survivor** · [disciplined-survivor.js](../scripts/disciplined-survivor.js) | Failed save; visible result before damage/effect application | Spend 1 Focus Point → native single-d20 reroll, keeping original modifiers/DC and the new result → recheck other choices. No Reaction cost. | `disciplinedSurvivorAutomation` | User-confirmed working. |

| **Shared Resilience** · [shared-resilience.js](../scripts/shared-resilience.js) | Ally’s failed save; result remains visible | Banneret Reaction + Indomitable use → reroll with the Banneret’s Fighter-level bonus → recheck remaining choices. Native 60-foot friendly/visibility requirements; helper-specific decline. | `sharedResilienceAutomation` | User-confirmed working. |

| **Countercharm** · [countercharm.js](../scripts/countercharm.js) | Failed save against configured Charmed/Frightened effects | Bard Reaction → self/friendly creature within 30 feet rerolls with Advantage → recheck remaining choices. Preserve normal Disadvantage cancellation, modifiers and the mandatory new result. | `countercharmAutomation` | User-confirmed working. |

| **Guarded Mind** · [mage-slayer.js](../scripts/mage-slayer.js) | Failed INT/WIS/CHA save; visible result | Spend native Mage Slayer use → native resisted/success state → recheck save choices. No reroll or Reaction; original dice/DC preserved. | `mageSlayerAutomation` | Connected; awaiting GM/player confirmation. |

| **Dark One’s Own Luck** · [dark-ones-own-luck.js](../scripts/dark-ones-own-luck.js) | Failed save; checks retain existing handling | Native feature bonus/use → add to the failed save without rerolling → recheck remaining choices. No Reaction cost; once per roll. Successful saves do not offer the action. | `darkOnesOwnLuckAutomation` | User-confirmed working with failed-save-only eligibility. |

## Remaining attack and damage decisions — current priority

These are still **To connect**. Their existing scripts remain usable. Attack corrections need a visible result; damage reducers need a decision before damage reveal. Do not merge those timings simply because both precede HP Apply.

| Status | Feature / source | Proposed trigger | Links / work remaining | Feature switch |
| --- | --- | --- | --- | --- |
| [x] Working (existing automation) | **Homing Strikes** · [homing-strikes.js](../scripts/homing-strikes.js) | Missed Psychic Blade attack | User-confirmed working. Native Psionic die correction, spent only on success; uses the owned Soul Blades item icon. Staged timing integration remains separate. | `homingStrikesAutomation` |
| [x] Working (existing automation) | **Peerless Skill** · [peerless-skill.js](../scripts/peerless-skill.js) | Attack miss / failed ability check; excludes saving throws | User-confirmed working. Native Bardic die correction, spent only on success. Staged timing integration remains separate. | `peerlessSkillAutomation` |

## Remaining save decisions

Mixed attack/save/check features are listed once in the preceding table; their save/check branches are not considered connected just because an attack branch is eventually connected. Flash of Genius and Indomitable are already in the connected table.

| Status | Feature / source | Proposed trigger | Links / work remaining | Feature switch |
| --- | --- | --- | --- | --- |

## Riders and follow-ups — review before adding a stop

These catalog entries are marked planned for timing integration. Their underlying automation can already work. They are not all Reaction-cost features and should not receive a mandatory pause by default.

| Status | Feature / source | Existing / proposed handoff | Links / work remaining | Feature switch |
| --- | --- | --- | --- | --- |
| [ ] Timing review | **Empowered Spell** · [empowered-spell.js](../scripts/empowered-spell.js) | Damage roll; before application | Native Sorcery Point/die selection; no extra stop unless an eligible optional adjustment exists. Not a Reaction. User confirmed the pending/used icon and continuation fixes work. | `empoweredSpellAutomation` |
| [ ] Timing review | **Hand of Harm** · [hand-of-harm.js](../scripts/hand-of-harm.js) | Damage rider / follow-up | Retain native Focus cost and initial damage-roll integration; do not introduce an unnecessary mandatory pause. | `handOfHarmAutomation` |
| [ ] Timing review | **Psionic Strike** · [psionic-strike.js](../scripts/psionic-strike.js) | Damage rider / follow-up | Retain native Energy Die and initial critical/scaling rules; classify as rider, not a defensive Reaction. | `psionicStrikeAutomation` |
| [ ] Timing review | **Rend Mind** · [rend-mind.js](../scripts/rend-mind.js) | Psionic damage rider / follow-up | Exact Psionic Blade/Sneak Attack link → native save/effect; keep the triggering HP and rider identities separate. | `rendMindAutomation` |
| [ ] Timing review | **Stalker’s Flurry** · [stalkers-flurry.js](../scripts/stalkers-flurry.js) | Attack follow-up | Native extra attack and target restrictions; continue through normal attack reaction gates on the new attack. | `stalkersFlurryAutomation` |
| [ ] Timing review | **Superior Hunter’s Prey** · [superior-hunters-prey.js](../scripts/superior-hunters-prey.js) | Damage follow-up | Native secondary target choice using existing marked damage; preserve original roll and recipient-only application. | `superiorHunterPreyAutomation` |
| [ ] Timing review | **Elemental Rebuke** · [elemental-rebuke.js](../scripts/elemental-rebuke.js) | Damage received; follow-up | Native Reaction retaliation after the triggering hit; review resistance timing separately from retaliation. | `elementalRebukeAutomation` |
| [ ] Timing review | **Brutal Strike effects** · [brutal-strike.js](../scripts/brutal-strike.js) | Hit rider; selected during attack setup | Existing native Brutal Strike dice and configured effects already work. Review follow-up placement only; no duplicate Reaction cost. | `brutalStrikeAutomation` |
| [ ] Timing review | **Deflect Redirect** · [deflect-attacks.js](../scripts/deflect-attacks.js) | After Deflect reduces damage to zero | Existing native Focus redirect belongs to deflect-attacks.js. Verify handoff from the connected reservation, not a second reduction stop. | `deflectAttacksAutomation` |

## Related scripts outside the timing catalog

These need explicit classification, not an automatic “missing pause” assumption. No runtime catalog entries were added by this documentation pass.

| Status | Feature / source | Current relationship | Review / intended link | Feature switch |
| --- | --- | --- | --- | --- |
| [ ] Follow-up review | **Fount of Moonlight** · [fount-of-moonlight.js](../scripts/fount-of-moonlight.js) | Existing damage-card Reaction and native attacker save | Retaliation does not change incoming damage; normally keep it non-blocking | `fountMoonlightAutomation` |
| [ ] Follow-up review | **Chilling Retribution** · [chilling-retribution.js](../scripts/chilling-retribution.js) | Existing confirmed-hit damage-card Reaction → attacker WIS save → Stunned/Speed 0 | Triggering damage stays unchanged; review follow-up placement and native expiry | `chillingRetributionAutomation` |
| [ ] Follow-up review | **Inspired Eclipse** · [inspired-eclipse.js](../scripts/inspired-eclipse.js) | Bardic Inspiration application → invisibility/teleport choices; recipient teleport can spend a Reaction | Keep source Bard and recipient ownership; do not block the action which granted Inspiration unnecessarily | `inspiredEclipseAutomation` |
| [ ] Special-workflow review | **Life Transfer** · [life-transfer.js](../scripts/life-transfer.js) | Native Reaction → companion sacrifice/healing → Death Burst placement | Dedicated workflow with confirmation and authority; preserve its explicit no-HP-Undo sacrifice behavior | `lifeTransferAutomation` |
| [ ] Adjustment review | **Modify Magic** · [modify-magic.js](../scripts/modify-magic.js) | Fortifying/Tenacious choices around spell outcomes | Review the native option’s cost/trigger and existing readiness before choosing a shared stop | `modifyMagicAutomation` |
| Existing automatic protection | **Arcane Ward** · [arcane-ward.js](../scripts/arcane-ward.js) | Slot-funded Abjuration casts offer creation or recharge; damage absorption is automatic | No Reaction pause for the Wizard’s own ward. Absorb after mitigation, retain overflow, native HP pool, once-per-rest creation and Undo. | `arcaneWardAutomation` | Existing creation/recharge, mitigation, overflow and Undo regression coverage retained. |
| Passive; no optional pause expected | **Spell Resistance** · [spell-resistance.js](../scripts/spell-resistance.js) | Save/damage benefits | Keep native passive adjustment; do not offer a paid Reaction without a native source | `spellResistanceAutomation` |
| Passive; no optional pause expected | **Leading Evasion** · [leading-evasion.js](../scripts/leading-evasion.js) | Shared Dexterity-save protection | Preserve party/recipient mitigation; review effect lifetime, not a new Reaction button | `leadingEvasionAutomation` |
| Free follow-up; no Reaction cost | **Extinguish Undead** · [extinguish-undead.js](../scripts/extinguish-undead.js) | Wizard’s undead follow-up | Tracker explicitly exempts this activity from spending a Reaction; preserve that behavior | `extinguishUndeadAutomation` |

## Test notes to record for each connection

| Check | Pass / fail / notes |
| --- | --- |
| Right actor, target, range, visibility and native trigger; no offer for an unrelated actor | — |
| Correct stage: declaration hidden; hit shows Hit/Critical; saves show their actual results | — |
| Player declines only owned choices; GM declines the remaining window; last choice resumes once | — |
| Correct native resource/Reaction cost; no double-spend; cancellation and failed changes roll back | — |
| Original dice, source/attack/target identities and critical policy preserved | — |
| Remaining actors’ choices stay available; next timing stage opens only when needed | — |
| Apply and Undo stay paired; reductions affect only the recorded recipient; newer effects survive Undo | — |
| GM and player clients agree; dice finish before application; no duplicate Apply or result card | — |
| Feature toggle prevents new offers/stops; existing pending decisions remain finishable | — |
| End-turn/resource resets do not revive finished windows or cause broad chat refreshes | — |

## Settings reference

Open **Game Settings → Ugmuls Options → Reaction Triggers** for `reactionTimingPilot` (Attack and Save Reaction Pauses), `counterspellAutomation`, `showShieldReaction`, and `reactiveAutoApply` (the existing additional governor). Class and feat shortcuts lead to each feature’s existing switch. Reaction/resource trackers remain separate from enabling a pause. Disabling the pause setting does not erase a published pending window or rewrite completed cards.

Maintain this checklist alongside the runtime catalog when the next feature is connected. Mark in-game confirmation only after the specific GM/player scenario is reported or observed.
