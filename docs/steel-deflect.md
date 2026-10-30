# Steel Defender: Deflect Attack

Enable Steel Defender: Deflect Attack under Artificer settings. A natively linked defender can react to a visible attacker within 5 feet attacking another creature. Single-target attacks in active combat are supported. The defender may share its owner's turn or have its own combatant entry.

The attack card offers a Deflect Attack button to the owning player and GM, like Shield. There is no automatic confirmation popup and no response wait. Clicking spends the defender's own Reaction. Damage and effects proceed normally; only a clicked adjustment briefly guards HP while its dice finish. Old popup-offer flags do not block the workflow.

The existing roll-mode adjustment preserves original d20/bonus results and cached alternate dice, rolls only missing d20s, waits for their animations, and observes normal advantage/disadvantage cancellation including AC5E state. Linked damage cards refresh after the attack changes. Newly missed ordinary damage defaults to zero, preserving Acid Arrow splash and explicit manual GM multipliers. Applied attack effects do not hide Deflect. Applied HP requires Undo before adjustment, matching Shield.

At Artificer level 15 or higher, a defender that actually has the native Improved Deflection damage activity creates its normal damage card and opens damage configuration for the reacting user. Preserve its native Force formula and summon modifier, target the original attacker, and disable critical damage. This follow-up costs no additional Reaction. Canceling its damage configuration leaves the native card available for a manual retry.

Verification: tests/steel-deflect.test.mjs, tests/chat-refresh.test.mjs, existing d20 adjustment and companion-turn tests, plus the full local regression suite. Live GM/player confirmation remains pending.
