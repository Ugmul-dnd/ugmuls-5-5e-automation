# Smite of Protection

The native level-15 Devotion feature is integrated with Unified Paladin Auras. Casting Divine Smite activates a temporary source marker, including Divine Smite selected in weapon damage configuration. No additional action, Channel Divinity use or spell slot is spent. Other Smite spells do not activate it.

The existing aura applies the native **coverHalf** status to the Paladin and allies inside it. Leaving removes the aura contribution; re-entering restores it while the source marker is active. The marker expires at the start of the casting Paladin’s next turn. Out of combat it lasts six seconds of world time. A subsequent Divine Smite refreshes the marker without creating another aura.

This module adds no AC bonus, Dexterity-save bonus, geometric cover calculation or cover-bypass logic. Simple Cover 5e and AC5e consume the effect-granted cover as configured in the world. Their rules handle Sharpshooter, Spell Sniper and stronger cover.

Turning off Unified Paladin Auras also disables recipient coverage. Native source items and unrelated cover effects remain unchanged.
