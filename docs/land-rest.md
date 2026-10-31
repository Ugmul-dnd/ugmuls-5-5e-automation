# Circle of the Land rest selection

The Long Rest dialog offers Arid, Polar, Temperate, or Tropical to owners of the 2024 Circle of the Land Spells feature. The last completed selection is reused. Canceling or leaving the initial choice blank changes nothing; Short Rest is unaffected.

At completion, the native feature's spell tables supply source UUIDs and Druid-level requirements. Dedicated always-prepared `subclass:land` spell copies are added or retained; obsolete managed copies are removed. Ordinary Druid and multiclass copies keep their preparation and resources. Existing native Land grants are adopted only when explicitly associated with `subclass:land` and a spell in the native tables. Repeated selections avoid duplicate grants and unchanged writes.

With Nature's Ward and Druid level 10+, enable the chosen native transferred effect and disable the other Ward land effects. Poisoned immunity remains supplied by native advancement. Other resistance sources are unaffected.

Source spells and the selected Ward effect are validated before writes. The actor owner performs the changes using the same native rest completion workflow as Fiendish Resilience. No mutations occur during rendering or preview. Local automated tests cover land tables, rest cancellation, level filtering, independent preparation, resistance selection, repeated rests, ownership, preflight failures and failed creation. Live GM/player confirmation remains pending.
