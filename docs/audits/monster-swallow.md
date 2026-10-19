# Giant Toad and Gelatinous Cube

Both defaults preserve native book effects and damage parts, with local Trigger Library enable/disable overrides.

- Giant Toad: use Swallow's Expend Use utility (the resulting card is titled Swallow), target the swallowed creature, and apply the native Blinded, Restrained, and Total Cover effect. No immediate damage is added by this setup. At the end of each toad turn, prompt its native 3d6 Acid damage for its tracked swallowed target.
- Gelatinous Cube: use Engulf normally. Failed saves apply the native Total Cover, Suffocating & Restrained effect according to existing automatic/manual settings. Initial successful saves deal half damage, matching the feature text. At the start of each cube turn, prompt native 3d6 Acid damage for its engulfed targets. Affected creatures receive an optional Strength (Athletics) escape action at their own turn start, using the originating cube's prepared check DC. Successful escape uses the existing dice-completion and effect-removal workflow.

Disable/delete the tracked effect to stop damage. Initial effect application remains controlled by normal effect cards/settings. For Swallow, remove the prior grapple manually. Positioning, carrying occupants, capacity, blocked escape spaces, verbal components, regurgitation and escaping a corpse remain table-managed. Native conditions remain intact; no automatic token movement is introduced.

Source-token identity isolates different monsters. Dead/defeated sources, inactive/deleted effects, external turn automation and disabled recipes do not trigger. Persistent turn stamps prevent duplicate source-start/end prompts. Outgoing turn processing uses the previous combatant and round, including when the incoming combatant is defeated. Starting combat never invents an outgoing turn.

Native book activity IDs are shared between several Swallow/Engulf variants. These two defaults additionally require the toad's unique Expend Use activity or the cube's unique Escape Check activity. Other monsters, including Blob of Annihilation and Shambling Mound, retain their existing recipes. Prepared copies and card snapshots leave embedded/book source items unchanged.

Reload clients and make fresh applications for testing. Check toad end-turn damage, cube start-turn damage, recipient-turn Athletics prompt, and removal stopping the next damage. Regression fixtures cover native effects/dice, initial half damage, no immediate swallow damage, outgoing/incoming timing, duplicate suppression, source isolation, other Engulf variants, local overrides and stop conditions.

## Expanded swallow defaults

| Monster | Damage timing | Native recurring damage |
| --- | --- | --- |
| Behir | Monster turn start | 6d6 Acid |
| Purple Worm | Monster turn start | 5d6 Acid |
| Remorhaz | Monster turn start | 3d6 Acid + 3d6 Fire |
| Tarrasque | Monster turn start | 16d6 Acid |
| Kraken | Swallowed creature turn start | 7d6 Acid |

Use each monster's native Swallow save and apply its native failed-save effect under the existing effect settings. No extra initial roll or effect is introduced. Kraken retains its initial Piercing damage and native Restrained/Total Cover effect, without Blinded. Other swallowed conditions and source stat changes remain book-owned. Removing/disabling the tracked effect stops recurrence. Remove the preceding grapple manually, as for Giant Toad.

The five actors share Swallow activity IDs and several also share effect names. Defaults therefore require their source actor's Monster Manual identity, plus native activity signatures. Renaming imported actors preserves matching. Exact monster names are a fallback for custom actors without book provenance; explicit other-book-actor provenance is never overridden by a matching display name. Giant Toad and Giant Frog retain distinct behavior.

All damage uses native damage cards and normal application/Undo/animation handling, without resource consumption, templates or repeated effect application. Source-turn handlers exclude dead/defeated sources. Kraken's target-turn handler additionally requires its recorded source token still present in the target's scene and alive. Local library toggles remain available. No regurgitation-threshold tracking, size/capacity enforcement, token movement, corpse escape or teleport restriction is added.

Validation uses five full book fixtures and covers exact timing, native damage parts and effects, no accidental shared-ID matches, renamed source identity, duplicate guards, inactive/expired/deleted/external effects, dead/defeated sources and library toggles. Existing Giant Toad/Cube and source-turn fixtures remain covered. In-game: reload clients, apply fresh swallowed effects, test Remorhaz's two damage types on its turn and Kraken damage on each victim's own turn, then remove an effect and verify damage stops.

Swallow application fix: temporary usage copies now carry explicit swallowed source metadata. Applied effects receive recurring tracking directly (with reused-effect fallback), independent of generic origin-based registration. Once the applied swallowed effect is active and dice finish, remove active Grappled effects tied to the same source actor/token. Other grapplers remain. This supersedes the earlier manual-grapple-removal note. Source effects, native saves, initial damage and swallowed conditions remain intact.

Aura exclusion: active swallowed effects exclude their recipient from external monster aura damage and save targeting only when the recorded source token matches the aura source. Existing recurring Swallow records are supported. Disabled/expired/deleted swallowed effects restore normal aura targeting. Engulf and ordinary grapples do not count. Internal recurring damage is unchanged. Target lists are rechecked after aura target selection.
