# Reanimator companion summoning

Enable Reanimator: Companion Modifications under Artificer settings. Both Create Companion and the native Create with Spell Slot forward activity use the picker before native resource consumption. Canceling the picker spends no use or slot. Placing another summon from an existing usage card opens the picker without spending again, following the native placement workflow.

The picker follows actual owned features: Strange Modifications grants one of Arcane Conduit/Ferocity; Macabre Modifications grants two distinct choices and unlocks Bloated/Gaunt/Moist. An already-owned Refined Reanimation grants a third choice, without automating its other abilities. Before Strange Modifications is gained, summoning proceeds without modification choices.

Selected native book items and their embedded effects are copied into the new companion's unlinked token ActorDelta. Preserve native source imports and other companions. This supplies Ferocity's die, Bloated's Large size and Death Burst bonus, Gaunt's movement/climb and save activity using the caster's DC, and Moist's swim/retaliation activity. Arcane Conduit remains its native manual feature. Automatic modification procs, Life Jolt, Life Transfer and Refined Revival are deferred.

When the summoner owns Improved Reanimation, enable the book's otherwise-disabled Death Burst Improvement effect so its existing formula rolls 4d4, retaining Bloated's Intelligence bonus. Mark that companion's damage to ignore Necrotic resistance only, both in native previews and actual application. Immunity, other damage types, save multipliers, manual overrides and Undo retain native behavior. Fill Dreadful Swipe's missing damage type with the Necrotic type specified in its rules.

Tests: tests/reanimator-summon.test.mjs uses source-book fixtures for modifications, effects, Death Burst and Dreadful Swipe. Live Foundry confirmation remains pending.
