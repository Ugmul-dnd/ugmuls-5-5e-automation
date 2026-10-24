# Avenging Angel

Enable **Avenging Angel Assistance** under Paladin settings. Use the native Vengeance feature’s **Avenging Angel** activity. Its normal feature use and Bonus Action handling are unchanged, and Restore Use remains native. One temporary self effect grants the native 60-foot Fly Speed and hover for ten minutes and enables the existing Aura of Protection’s Frightful Aura automation.

At the start of each enemy’s turn within that aura, prompt the native Wisdom save against the Paladin’s spell DC. Failed saves apply **Avenging Angel — Frightened** for one minute or until damage. No additional feature use, action, damage roll, repeat end-of-turn save or successful-save immunity is added. Success does not remove fear remaining from an earlier failed save. Leaving the aura does not end an existing fear effect.

Attacks against a creature affected by this fear receive Advantage through AC5e’s usage-rule API, with a native single-target fallback. Disadvantage cancels normally; condition immunity/suppression prevents the extra Advantage. Damage removes only this automation’s Frightened effects after workflow animations, preserving fear from other sources. A player-owned damage application routes cleanup to the active GM. Healing, zero damage and Undo do not trigger removal.

Disabling/deleting/expiring the self effect stops flight and new aura saves. Existing victims keep their own one-minute/until-damage duration. The aura remains the same Regions-layer-only region. Soul of Vengeance and Relentless Avenger remain manual.
