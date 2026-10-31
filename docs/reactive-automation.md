# Reactive damage and effects

Enable **Automate Damage and Effects with Reactive Logic** under **GM NPC & Damage / Healing**. It is off by default and governs the existing Auto Apply Damage, Auto Apply Saved Effects and Auto Apply Status on Hit options. Healing keeps its existing behavior.

When a supported reaction/adjustment is usable, that workflow’s automatic damage and effects attempt ends. It stores a stopped flag; it does not poll, run a timer, display a reaction confirmation dialog, or keep a task waiting for a player.

After a committed adjustment updates the card, one coalesced check is scheduled for that exact attack or save group and its linked HP cards. If another option is usable, the new attempt ends again. If none remain, the enabled auto-apply options process the current hit/save results after the normal dice/save prerequisites. Existing pending save and damage roll dialogs are unchanged.

Supported eligibility checks currently cover Shield, Flash of Genius, Cosmic Omen, Bardic Inspiration, Cutting Words, Steel Defender Deflect Attack, Monk Deflect Attacks, Parry and Protective Field. The GM checks the underlying feature eligibility rather than browser buttons. Cosmic Omen retains its one-time range/disposition snapshots. There are no movement/resource-driven automation restart hooks or historical chat scans.

If no one wants to use a reaction, the GM can simply apply damage. With this governor enabled, damage Apply also applies the same activity’s native effects to the recipients included in that application: recorded hits for attacks; failed saves or configured On Save profiles for saves. It does not apply effects to another recipient or reuse the current token selection. Region-managed and newer equivalent effects are preserved.

Manual damage/effect application and Undo remain manual workflows. A later reaction must not silently override that decision. Reapplied effects retain separate Undo history. Effect-application failures leave applied HP intact and allow an effect retry; they do not replay damage.

Automated checks cover stop/resume boundaries, grouped saves, remaining reactions, completion versus cancellation, stop-write races, no timers/history hooks, bounded work on stopped cards, native auto-apply interception, manual hit/save profiles, partial recipients and Undo. Real multi-client combat timing and performance still require an in-game check; no before/after live-battle measurement is claimed.

## Additional card-control audit

The governor also checks these usable post-roll options:

| Area | Covered controls |
| --- | --- |
| Metamagic | Empowered Spell damage-die rerolls; Seeking Spell attack rerolls |
| Attack/save corrections | Precision Attack, Dark One’s Own Luck, Fanatical Focus, Indomitable, Disciplined Survivor, Shared Resilience, Homing Strikes, Peerless Skill |
| AC, damage reduction and resistance | Combat Inspiration AC, Uncanny Dodge, Investment of the Chain Master resistance, Superior Hunter’s Defense, Elemental Rebuke, Beguiling Defenses |

These checks use the same feature, resource, outcome, permission and lock eligibility as the controls. An already-used flag does not itself block application. Empowered Spell records its completed reroll and cast-wide limit before the next check; canceling the choice leaves the stopped card manual. The governor also lets the ordinary damage roll finish before applying effects, so damage-stage options are evaluated while still usable.

Transmuted/Careful/Heightened Spell, damage riders and choices such as Alchemical Savant are resolved before the original roll is published, so their permanent cast flags are not stop conditions. Native ongoing resistances and Evasion remain native application calculations. Post-damage triggers such as Alchemical Eruption, retaliation and follow-up actions remain after damage; blocking for them would prevent their trigger. Generic GM correction tools such as ADV/DIS or half/double are manual overrides, not permanent reasons to stop every card.

Shield completion is tied to its applied buff, not the earlier utility-use return. Automatic HP application rechecks the current target hit state at commit. A corrected miss cannot hide a card while it still has HP/effect Undo history; this keeps earlier transactions recoverable.

## On-hit effect timing

Auto Apply Status on Hit now applies the configured effects of damaging attacks after HP Apply completes, whether damage is automatic or manual and whether this reactive governor is enabled or disabled. A hit roll alone does not apply those effects. Only the recipients included in the completed damage application are eligible; misses stay excluded. Effects retain native duration/concentration and separate Undo. If an effect fails, its retry does not repeat damage. Save-based effects and genuinely non-damaging, effect-only attacks retain their existing resolution.

If an adjustment turns a Graze miss into a hit, an unapplied Graze card is retired and removed and the normal hit-damage roll is offered. Graze is checked against the current miss outcome again before HP changes. Already-applied Graze remains available for Undo before normal damage proceeds.
