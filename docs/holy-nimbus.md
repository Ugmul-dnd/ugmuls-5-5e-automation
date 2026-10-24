# Holy Nimbus

Enable **Holy Nimbus Assistance** in Paladin settings and use the native PHB feature. The activation applies a temporary self effect for ten minutes, consuming the native use and tracking the Bonus Action normally. The native Regain Use activity is unchanged. No activation damage is rolled.

Enemies starting their turns within the existing active Aura of Protection take the native fixed Radiant damage: Charisma modifier + Proficiency Bonus. No save, extra resource or additional aura is created. Automatic HP application follows the world setting. Allies, the caster and creatures outside the aura are excluded.

Holy Ward supplies save Advantage only when the originating save activity is from a Fiend or Undead. AC5e’s usage-rule API handles source-aware Advantage when available; native save prompts have a fallback. Saves without an identified source require manual adjudication.

The bearer emits bright light matching the aura radius, and the managed light records that it is sunlight. Native Foundry has no generic sunlight flag consumed by every module: sunlight-specific monster interactions remain manual unless another integration handles them. Shared lighting management preserves Sacred Weapon’s light while it is active and restores the original light when both effects end.

Disable/delete the Holy Nimbus effect to end its damage, Holy Ward and lighting. Re-enable within its remaining duration to restore them. Source expiry removes the benefits. The unified aura remains Regions-layer-only and retains its other benefits.
