# Inactive effect cleanup

Two entry points share the same eligibility rules:

- After End Combat, the active GM clears inactive applied effects from participants. Cleanup runs after D&D5e finishes its native combat-exit expiry/dependency work. Removing a combatant during an ongoing combat does not trigger it. The world setting Clear Inactive Effects after Combat enables/disables automatic cleanup and defaults on.
- Actor window menu: Clear inactive effects. The shared ApplicationV2 header hook supports the installed default and Tidy actor sheets. A legacy actor-sheet header action is also supplied. Only owners see the action. Manual cleanup previews the eligible effect names and requires confirmation.

Inactive means disabled, inactive, duration-expired or system-expired. Only actor-owned effects are considered. Preserve item-embedded effects, transfer effects, enchantments and class/item features originating from that actor's own non-spell items. Preserve passive imported stat features without a usable source link when they have no temporary duration/status/application marker. Applied spell effects, conditions, tracked recurring buffs and aura immunity effects are eligible only when inactive. Active Grappled, Regenerating, buffs and immunity effects remain.

Source metadata is resolved rather than relying on effect names, so a disabled Unarmored Defense remains even when ordinary applied buffs are removed. Sources which no longer exist do not prevent cleaning up recognizably transient effects. Unknown permanent stat effects are retained conservatively.

Cleanup operations are serialized per actor. Manual deletion is limited to the previewed IDs and re-evaluates current inactivity/source protection; newly added or reactivated effects survive. Combat-exit handling preserves the native return value and executes only once per actor in the ended encounter. The module is imported by the existing core script so a client reload loads it without a server manifest refresh.

Validation covers disabled class/item preservation, inactive Grappled and Regenerating/old spell buffs, active buffs/immunities retained, missing source links, preview/cancel/reactivation/new-effect races, ownership, concurrent cleanup, shared default/Tidy header registration, native-first combat cleanup, ongoing combat exclusion, setting and GM guards. All 99 regression tests pass.

In-game check: reload, open a PC's window menu, choose Clear inactive effects and inspect the preview. Verify disabled Unarmored Defense is absent from removal, then confirm. End a test combat containing inactive applied effects and verify automatic cleanup while active effects and passive features remain.
