# Circle of the Land rest selection

The Long Rest dialog offers Arid, Polar, Temperate, or Tropical to owners of the 2024 Circle of the Land Spells feature. For updated PHB items, the current native land choice is shown, including the choice made at level-up. Older items reuse the last completed selection. Canceling or leaving the initial choice blank changes nothing; Short Rest is unaffected.

For updated PHB items, completion resolves the selected native land feature from Circle Spells’ choice pool. On a detached actor, it reverses the old land’s spell grants and choice, applies the new choice and its eligible spell advancements, then commits only the changed items and selection flag through the system’s bulk-update API. Native advancement identities and grant records are retained, so later leveling and manual advancement changes can follow them. Ordinary spells are preserved; old spell copies explicitly tagged by this module are removed. Repeating the same selection avoids unchanged writes. Missing sources fail before live updates; a failed batch restores affected items and the earlier selection.

The chosen land feature supplies its own level-10 resistance effect; Nature’s Ward still supplies Poisoned immunity. No duplicate resistance effect is created.

For older owned feature layouts, the native feature's spell tables supply source UUIDs and Druid-level requirements. Dedicated always-prepared `subclass:land` spell copies are added or retained; obsolete managed copies are removed. Ordinary Druid and multiclass copies keep their preparation and resources. Existing native Land grants are adopted only when explicitly associated with `subclass:land` and a spell in the native tables. Repeated selections avoid duplicate grants and unchanged writes.

With the older Nature's Ward layout and Druid level 10+, enable the chosen native transferred effect and disable the other Ward land effects. Poisoned immunity remains supplied by native advancement. Other resistance sources are unaffected.

Source spells and the selected Ward effect are validated before writes. The actor owner performs the changes using the same native rest completion workflow as Fiendish Resilience. No mutations occur during rendering or preview. Local automated tests cover land tables, rest cancellation, level filtering, independent preparation, resistance selection, repeated rests, ownership, preflight failures and failed creation. Live GM/player confirmation remains pending.
