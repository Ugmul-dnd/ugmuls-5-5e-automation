# Remaining Monster Manual recurring damage

| Feature | Damage trigger | Escape / repeat save |
| --- | --- | --- |
| Swarm of Stirges — Swarm of Proboscises | Affected creature turn end: native 2d6 Necrotic | Optional turn-start Athletics/Acrobatics action, native escape-check DC (swarm passive Acrobatics) |
| Animated Rug of Smothering — Smother | Affected creature turn start: native 2d6 + STR modifier | Optional Athletics/Acrobatics action after damage, source passive Athletics DC |
| Gulthias Blight — Life-draining Root | Affected creature turn start: native 4d6 Necrotic | Optional Athletics/Acrobatics action after damage, source passive Athletics DC |
| Djinni — Create Whirlwind | Restrained creature turn start: native 6d6 Thunder | Native STR repeat save at affected creature turn end |

Module Creature Trigger Library defaults retain local enable/disable overrides. Initial native attacks, saves and effects remain unchanged. Smother is an optional alternative to initial damage: choose/apply its native smothering effect rather than dealing the initial attack damage. Capacity, placement and moving occupants remain table-managed. Rug damage sharing/halving, Gulthias maximum-HP reduction and healing transfer remain manual. This batch automates recurring damage and escape/save prompts, not those additional damage-application rules.

Rug and Gulthias lack native escape-check activities, so their recorded DC uses the source actor's prepared passive Athletics, as the feature text specifies. Swarm reuses its native check DC, based on passive Acrobatics. The clicking user retains the full skill-choice and die-roll workflow. Checks are optional; they neither auto-roll nor force spending an action. Success removes only the tracked combined native effect after dice. Swarm's escape action is offered at turn start independently from its end-turn damage.

Rug follow-on damage parts have no damage type in the installed book activity. Temporary helpers fill the missing type with Bludgeoning from the native weapon; custom nonempty damage types remain unchanged. Formulas, source modifiers, native condition changes, initial damage and source book/world items are preserved.

Whirlwind adds a hidden-by-default Region Library recipe using the native Save activity. Place the native cylinder; placement does not add a premature damage roll. Entry prompts STR saves once per turn, excluding the originating monster under the existing monster-area rule. Native restrained effects register victim-start damage and victim-end saves independently. Success removes the restraint after dice. The existing source-region link binds exit/deletion cleanup to that specific area. Moving the area and its occupants remains manual. Native concentration dependencies remain in control.

No repeated resource spending, templates, cast animation recognition or effect application is added by recurring helpers. Disabled/deleted/expired or externally automated effects stop recurrence. Existing duplicate-turn and active-GM controls remain shared.

Validation: four full native fixtures through registration, native/helper damage comparisons, recorded native/passive DCs, actual target start/end processing, independent save/escape phases, successful cleanup, no repeated turn damage, unchanged source data, Whirlwind Region defaults and source-region exit isolation. All 104 regression files pass.

In game: reload clients and make fresh applications. Test swarm end-turn damage plus optional start-turn escape; rug start damage and escape; Gulthias start damage/escape while applying HP-max/healing adjustments manually; Djinni entry failed save, next victim start damage, victim end repeat save and Region exit cleanup.
