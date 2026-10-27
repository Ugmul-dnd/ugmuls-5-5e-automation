# Studied Attacks

Enabled under Fighter automation for actors owning the 2024 feature. An attack miss against a creature places a target-specific temporary marker on the Fighter. The next attack against that creature receives Advantage, combining normally with Disadvantage and other sources such as Vex. It consumes the marker when the new attack card is created, whether the attack hits or misses; cancelling the dialog or attacking someone else does not consume it. Another miss grants a new marker.

Markers expire at the end of the Fighter’s next turn, preserving a miss made during the current turn through its end. Each creature is tracked separately; multiple misses against one creature refresh a single benefit. Correcting a miss to a hit removes that attack’s unconsumed marker. Repeated card updates do not regenerate consumed/expired benefits. Encounter-end cleanup removes the module’s markers only. No resources, actions, movement hooks or Vex markers are changed.
