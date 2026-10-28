# Superior Hunter's Defense

A 2024 Hunter owning Superior Hunter's Defense gets a button on completed, unapplied incoming damage cards. The owning player and GM can use it; the GM validates and applies player requests. This is separate from the Ranger rest-option selections.

- Spend one tracked Reaction. There is no additional feature-use cost or damage roll.
- A single incoming damage type is selected automatically; mixed damage opens a small type selector. Canceling does not spend the Reaction.
- Apply a temporary native resistance effect to the Hunter. Native damage calculations update the recipient's damage preview and application immediately. Only the selected type is resisted; the shared roll remains unchanged. Existing resistance never stacks, and save multipliers, vulnerabilities, immunity, and manual damage overrides retain native handling.
- Keep the resistance for further matching damage through the end of the current combat turn. Remove only the managed temporary effect when that turn ends. Outside combat it lasts six seconds of world time.
- Store the triggering hit's chosen resistance on the damage card so delayed application and HP Undo/reapply retain its protection even after the temporary effect expires. Replay is scoped to the recorded recipient and calculation only; it does not restore ongoing resistance to the sheet.
- Applied damage must be undone before using the button. Pending damage, no-damage successful saves, used Reactions and incapacitating conditions block it. If effect creation or recording fails, roll back the effect and newly reserved Reaction.

## In-game checks

On both clients, roll damage against the Hunter and click the button before Apply. For mixed damage, choose one type and verify only that portion is reduced. Apply damage and verify HP. A second matching hit during the same turn should see resistance automatically. Advance the turn and verify resistance disappears. Undo/reapply the original hit and verify its original reduction remains, while a new hit no longer receives it. Confirm another target sharing the damage roll is unaffected.
