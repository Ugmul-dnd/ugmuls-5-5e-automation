# Save-first recurring damage

Phantasmal Killer and Weird are built-in turn-end creature recipes, attached to the native Fears Manifested and Frightening Terrors effects. Initial cast damage and effect application remain native. Each recurring helper targets only the tracked creature and uses the caster DC/cast level recorded at effect application.

1. At target turn end, create a save-only Wisdom card. It contains no damage or applied effects.
2. After a failed save and completed viewer dice animations, create one damage-only card. Duplicate/concurrent updates are guarded; cancellation leaves the existing damage card available for completion. Failure retains the effect for later turns.
3. A successful save removes only that effect after dice finish. Phantasmal Killer also ends its recorded concentration; Weird leaves the caster's concentration and other affected creatures intact.
4. Damage completion does not prompt another saving throw.

Phantasmal Killer converts a temporary copy of its native initial save activity into damage-only form, retaining 4d10 Psychic and +1d10 per slot above 4. Weird copies its dedicated End of Turn Save damage (5d10), never its initial 10d10. No spell slots, templates, effects or critical dice are added. Native items/effects/stat changes are preserved; the applied Fears Manifested copy fills missing native disadvantage changes for all six ability checks and all attack rolls, preserving existing custom changes. Saving throws are unaffected; source book effects are not edited. Only disposable helpers suppress animation recognition. Persistent Metamagic/transmutation choices carry forward without prompting casting selections again.

Trigger editor displays native save activities as damage sources for these recipes. Recipes remain adjustable through local overrides. Save and damage prompts keep shared owner/GM routing, NPC save settings, Pending recovery and world result visibility. Turn advancement does not wait for completion.

Fresh-cast validation: initial mixed saves; end-turn pending/failure/success; PK upcasting; Weird 5d10 on repeats; save dice finish before damage prompt; canceled damage completion; no duplicate prompts; no save after damage; successful Weird target leaves other targets/concentration; successful PK ends its own concentration; effect deletion/refresh rejects stale cards.

Weird defaults to removing its targeting-only Region at caster turn end through the existing instantaneous-area cleanup setting. Its concentration and target effects continue normally. Explicit local lifetime overrides and configured ongoing Region behaviors remain protected.

Weird applied-effect preparation ensures the native Frightened status is present on Frightening Terrors, preserving all other statuses and changes. Foundry/AC5E can use the condition normally; successful repeat saves or effect removal remove that status with the tracked effect rather than leaving a separate condition behind. The installed book template already includes Frightened; the module fills it if missing on an applied copy.

AC5E Frightened compatibility: applied Weird effects set legacy origin to the source caster actor. Native system.origin activity/message/concentration and duplicateSource metadata remain intact. AC5E can resolve the source token and use its normal visibility-based check/attack rules. Active matching world/current-scene effects are repaired once by the active GM on ready; new effects receive the same preparation. No unconditional disadvantage override is installed.

Weird now additionally registers an explicit AC5E attack/check disadvantage rule for active Frightening Terrors. The tracked Weird effect is the condition source for this recommendation; it no longer depends on resolving the caster through the generic Frightened visibility predicate. AC5E retains advantage/disadvantage reconciliation. Without an available rule bridge, native roll defaults and attack-dialog selection provide the same recommendation, preserving cancellation. Saving throws are unchanged.
