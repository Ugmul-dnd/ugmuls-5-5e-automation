const ID="ugmuls-5-5e-automation";
// Recipes only: book items and effects remain the source of spell data.
// Save-only recipes reuse book activities but never repeat initial spell damage.
const ESCAPE_DEFAULTS={
 "grasping-shot":{name:"Grasping Shot",enabled:true,attachment:"creature",sourceKind:"athleticsEscape",sourceIdentifier:"grasping-shot",sourceSpellUuid:"Compendium.dnd-arcana-unleashed.subclasses.Item.aunGraspingShot0",effectName:"Grasping Shot",effectId:"4Jp3GPgCrdWibAr0",event:"turnStart",promptMode:"manual",escapeCheck:true,checkAbility:"str",checkSkill:"ath",saveActivity:"Save",saveActivityId:"mobpmrt8tFt5gDPp",damageActivity:"",damageFormula:"",endOnSuccess:true},
  "ensnaring-strike": {
    "name": "Ensnaring Strike",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "athleticsEscape",
    "sourceIdentifier": "ensnaring-strike",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplEnsnaringS",
    "effectName": "Ensnared",
    "effectId": "tFGMG3cjQTEeAhv2",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkAbility": "str",
    "checkSkill": "ath",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageActivity": "Start of Turn Damage",
    "damageActivityId": "ZWId9mbOE9zFnP6f",
    "damageFormula": "",
    "endOnSuccess": true,
    "endConcentrationOnEscape": true
  },
  "entangle": {
    "name": "Entangle",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "athleticsEscape",
    "sourceIdentifier": "entangle",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplEntangle00",
    "effectName": "Restrained",
    "effectId": "wn7K2m4XhXhItgPT",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkAbility": "str",
    "checkSkill": "ath",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true
  },
  "evards-black-tentacles": {
    "name": "Evard's Black Tentacles",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "athleticsEscape",
    "sourceIdentifier": "evards-black-tentacles",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplEvardsBlac",
    "effectName": "Restrained",
    "effectId": "NDytclFrNmC418CS",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkAbility": "str",
    "checkSkill": "ath",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true
  },
  "web": {
    "name": "Web",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "athleticsEscape",
    "sourceIdentifier": "web",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplWeb0000000",
    "effectName": "Restrained",
    "effectId": "rsaWebRestrained",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkAbility": "str",
    "checkSkill": "ath",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "exitRegionEnds": true
  }
};
const EVENT_SAVE_DEFAULTS={
 "intimidating-presence":{name:"Intimidating Presence",enabled:true,attachment:"creature",sourceKind:"classSave",sourceIdentifier:"intimidating-presence",sourceSpellUuid:"Compendium.dnd-players-handbook.classes.Item.phbbrbIntimidati",requiredActivityIds:["ZRHT8mOlea6T8XpP"],effectName:"Intimidated",effectId:"3LofAPFLZJMQJirN",event:"turnEnd",saveActivity:"Save",saveActivityId:"ZRHT8mOlea6T8XpP",damageActivity:"",damageFormula:"",endOnSuccess:true,targetingRegionCleanup:"casterTurnEnd"},
  "dominate-beast": {
    "name": "Dominate Beast",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "dominate-beast",
    "effectName": "Dominated",
    "effectId": "PuOL8FylatY9CFzr",
    "event": "damage",
    "promptMode": "automatic",
    "onDamage": false,
    "damageSaveAdvantage": false,
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplDominateBe",
    "endOnSuccess": true
  },
  "dominate-monster": {
    "name": "Dominate Monster",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "dominate-monster",
    "effectName": "Dominated",
    "effectId": "aAbTb2vkRQiBp9Oz",
    "event": "damage",
    "promptMode": "automatic",
    "onDamage": false,
    "damageSaveAdvantage": false,
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "b1s2oESIl76fHcqA",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplDominateMo",
    "endOnSuccess": true
  },
  "dominate-person": {
    "name": "Dominate Person",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "dominate-person",
    "effectName": "Dominated",
    "effectId": "Edq07kTLIVkuDjtn",
    "event": "damage",
    "promptMode": "automatic",
    "onDamage": false,
    "damageSaveAdvantage": false,
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplDominatePe",
    "endOnSuccess": true
  },
  "ottos-irresistible-dance": {
    "name": "Otto's Irresistible Dance",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "ottos-irresistible-dance",
    "effectName": "Irresistible Dance",
    "effectId": "MpToumiJ2o3S16K7",
    "event": "turnStart",
    "promptMode": "manual",
    "onDamage": false,
    "damageSaveAdvantage": false,
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "DonYhtwZ56TnAk3B",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplOttosIrres",
    "endOnSuccess": true
  },
  "tashas-hideous-laughter": {
    "name": "Tasha's Hideous Laughter",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "tashas-hideous-laughter",
    "effectName": "Uncontrollable Laughter",
    "effectId": "5nrcjxzmy3FCLCkV",
    "event": "turnEnd",
    "promptMode": "automatic",
    "onDamage": true,
    "damageSaveAdvantage": true,
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplTashasHide",
    "endOnSuccess": true
  }
};
const REPEAT_SAVE_DEFAULTS={
 "beguiling-twist-charmed":{name:"Beguiling Twist — Charmed",enabled:true,attachment:"creature",sourceKind:"classSave",sourceIdentifier:"beguiling-twist",sourceSpellUuid:"Compendium.dnd-players-handbook.classes.Item.phbrgrBeguilingT",effectName:"Beguiling Twist — Charmed",effectId:"rsaTwistCharm001",event:"turnEnd",damageActivity:"",damageFormula:"",saveActivity:"Beguiling Twist",saveActivityId:"rRxcZhODLP7a0kHX",saveAbility:"wis",endOnSuccess:true},
 "beguiling-twist-frightened":{name:"Beguiling Twist — Frightened",enabled:true,attachment:"creature",sourceKind:"classSave",sourceIdentifier:"beguiling-twist",sourceSpellUuid:"Compendium.dnd-players-handbook.classes.Item.phbrgrBeguilingT",effectName:"Beguiling Twist — Frightened",effectId:"rsaTwistFear0001",event:"turnEnd",damageActivity:"",damageFormula:"",saveActivity:"Beguiling Twist",saveActivityId:"rRxcZhODLP7a0kHX",saveAbility:"wis",endOnSuccess:true},
 "strike-fear-terrify":{name:"Strike Fear — Terrify",enabled:true,attachment:"creature",sourceKind:"monsterSave",sourceIdentifier:"strike-fear",sourceSpellUuid:"Compendium.dnd-heroes-faerun.options.Item.hofSotStrikeFear",effectName:"Strike Fear: Terrify",effectId:"QCrtOB3YmjifFdTO",event:"turnEnd",damageActivity:"",damageFormula:"",saveActivity:"Terrify",saveActivityId:"p0Sf2KiK0hWXSc6x",saveAbility:"wis",endOnSuccess:true},
 "rend-mind":{name:"Rend Mind",enabled:true,attachment:"creature",sourceKind:"monsterSave",sourceIdentifier:"rend-mind",sourceSpellUuid:"Compendium.dnd-players-handbook.classes.Item.phbrgeRendMind00",effectName:"Rend Mind",effectId:"HoAwF2AAONF9XNKK",event:"turnEnd",damageActivity:"",damageFormula:"",saveActivity:"Rend Mind (Free)",saveActivityId:"UH1H8gC9X34sXqOI",endOnSuccess:true},
  "blinding-smite": {
    "name": "Blinding Smite",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "blinding-smite",
    "effectName": "Blinded",
    "effectId": "5FPaEGhqJ5yPP2Ln",
    "event": "turnEnd",
    "damageActivity": "",
    "saveActivity": "End of Turn Save",
    "saveActivityId": "dnd5eactivity100",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplBlindingSm",
    "endOnSuccess": true
  },
  "blindness-deafness-blindness": {
    "name": "Blindness/Deafness — Blindness",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "blindness-deafness",
    "effectName": "Blindness",
    "effectId": "MIYqFloILx3luzwc",
    "event": "turnEnd",
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplBlindnessD",
    "endOnSuccess": true
  },
  "blindness-deafness-deafness": {
    "name": "Blindness/Deafness — Deafness",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "blindness-deafness",
    "effectName": "Deafness",
    "effectId": "XY351duUwtwqIGHC",
    "event": "turnEnd",
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplBlindnessD",
    "endOnSuccess": true
  },
  "hold-monster": {
    "name": "Hold Monster",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "hold-monster",
    "effectName": "Paralyzed",
    "effectId": "vC7qgyy8cjgi3t0T",
    "event": "turnEnd",
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplHoldMonste",
    "endOnSuccess": true
  },
  "hold-person": {
    "name": "Hold Person",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "hold-person",
    "effectName": "Paralyzed",
    "effectId": "PklwZi3SKQ3JU2M2",
    "event": "turnEnd",
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplHoldPerson",
    "endOnSuccess": true
  },
  "ray-of-enfeeblement": {
    "name": "Ray of Enfeeblement",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "ray-of-enfeeblement",
    "effectName": "Enervated",
    "effectId": "uaHZaHEalgWa6eoC",
    "event": "turnEnd",
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplRayofEnfee",
    "endOnSuccess": true
  },
  "slow": {
    "name": "Slow",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "slow",
    "effectName": "Slowed",
    "effectId": "z1lkguBohjqXRSHm",
    "event": "turnEnd",
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "dnd5eactivity000",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplSlow000000",
    "endOnSuccess": true
  },
  "sunburst": {
    "name": "Sunburst",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "sunburst",
    "effectName": "Blinded",
    "effectId": "G813GhbtXMeZfUHe",
    "event": "turnEnd",
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "GunsbnehgeyBUMUX",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplSunburst00",
    "endOnSuccess": true
  },
  "synaptic-static": {
    "name": "Synaptic Static",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "synaptic-static",
    "effectName": "Muddled Thoughts",
    "effectId": "J92ctOoK4mEo5V02",
    "event": "turnEnd",
    "damageActivity": "",
    "saveActivity": "Save",
    "saveActivityId": "Um2mWH62piec6mVJ",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplSynapticSt",
    "endOnSuccess": true
  },
  "wrathful-smite": {
    "name": "Wrathful Smite",
    "enabled": true,
    "attachment": "creature",
    "sourceIdentifier": "wrathful-smite",
    "effectName": "Frightened",
    "effectId": "AGxThnIAskdh5Nqr",
    "event": "turnEnd",
    "damageActivity": "",
    "saveActivity": "Frightened Save",
    "saveActivityId": "dnd5eactivity000",
    "damageFormula": "",
    "sourceSpellUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplWrathfulSm",
    "endOnSuccess": true
  }
};
const DELAYED_DAMAGE_DEFAULTS={
 "melfs-acid-arrow":{name:"Melf's Acid Arrow",enabled:true,attachment:"creature",sourceIdentifier:"melfs-acid-arrow",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplMelfsAcidA",effectName:"Lingering Acid",effectId:"NgglkyjzTbDh5Loa",event:"turnEnd",damageActivity:"Lingering Acid Damage",damageActivityId:"uAyE5DrJp0YpElcw",damageFormula:"",saveActivity:"",oneShot:true,initialOutcome:"hit",endOnSuccess:false},
 "vitriolic-sphere":{name:"Vitriolic Sphere",enabled:true,attachment:"creature",sourceIdentifier:"vitriolic-sphere",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplVitriolicS",effectName:"Lingering Acid",effectId:"WHhf4PFHQBDkCAyb",event:"turnEnd",damageActivity:"End of Turn Damage",damageActivityId:"dnd5eactivity200",damageFormula:"",saveActivity:"",oneShot:true,initialOutcome:"failure",endOnSuccess:false}
};
const SAVE_FIRST_DEFAULTS={
 "phantasmal-killer":{name:"Phantasmal Killer",enabled:true,attachment:"creature",sourceIdentifier:"phantasmal-killer",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplPhantasmal",effectName:"Fears Manifested",effectId:"4k92Sjfpcm5bnguO",event:"turnEnd",saveActivity:"Save",saveActivityId:"dnd5eactivity000",damageActivity:"Save",damageActivityId:"dnd5eactivity000",damageFormula:"",saveFirst:true,damageFromSave:true,endOnSuccess:true,endConcentrationOnEscape:true},
 "weird":{name:"Weird",enabled:true,targetingRegionCleanup:"casterTurnEnd",attachment:"creature",sourceIdentifier:"weird",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplWeird00000",effectName:"Frightening Terrors",effectId:"6bCIQhmzYmSR5Ck1",event:"turnEnd",saveActivity:"End of Turn Save",saveActivityId:"nuStSySOEkwOUnXf",damageActivity:"End of Turn Save",damageActivityId:"nuStSySOEkwOUnXf",damageFormula:"",saveFirst:true,damageFromSave:true,endOnSuccess:true}
};
const HEALING_DEFAULTS={
 "heroism":{name:"Heroism",enabled:true,attachment:"creature",sourceKind:"recurringHealing",sourceIdentifier:"heroism",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplHeroism000",effectName:"Bravery",effectId:"zCpsdUyNz8bL3LF5",event:"turnStart",healingActivityId:"dnd5eactivity000",healingSource:"casterMod",healingType:"temphp",damageActivity:"",saveActivity:"",endOnSuccess:false},
 "regenerate":{name:"Regenerate",enabled:true,attachment:"creature",sourceKind:"recurringHealing",sourceIdentifier:"regenerate",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplRegenerate",effectName:"Regenerating",effectId:"O73gdwM6cCbr9LXn",event:"turnStart",healingActivityId:"RqNTdCQHfXDYaG41",healingSource:"fixed",healingAmount:1,healingType:"healing",damageActivity:"",saveActivity:"",endOnSuccess:false}
};
// Prompt-only final PHB batch: outcomes, counters and other spell behavior stay manual.
const PROMPT_ONLY_DEFAULTS={
 "confusion":{name:"Confusion",targetingRegionCleanup:"casterTurnEnd",sourceIdentifier:"confusion",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplConfusion0",effectName:"Confused",effectId:"VxmsgUz9OIUet6WC",saveActivityId:"dnd5eactivity000"},
 "crown-of-madness":{name:"Crown of Madness",sourceIdentifier:"crown-of-madness",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplCrownofMad",effectName:"Spectral Crown",effectId:"0zixJ8ZoYFgSJtMV",saveActivityId:"dnd5eactivity000"},
 "flesh-to-stone":{name:"Flesh to Stone",sourceIdentifier:"flesh-to-stone",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplFleshtoSto",effectName:"Turning to Stone",effectId:"Xt8AUh0PfYhGYBvY",saveActivityId:"g34TzvzMcBYBxqp4"},
 "sleep":{name:"Sleep",sourceIdentifier:"sleep",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplSleep00000",effectName:"Sleeping",effectId:"04Wa4xUzjA31kPno",saveActivityId:"dnd5eactivity000",singleSave:true},
 ...Object.fromEntries([["str","Strength","S8jxTZQbT8KKSg5V"],["dex","Dexterity","pqGQCk5wZx196HuY"],["con","Constitution","5aPQT5DlL6Igaxh4"],["int","Intelligence","EruTLG8AjsLULgHj"],["wis","Wisdom","J77AMHW5tROddZQg"],["cha","Charisma","xewLYmHBxPTEKPlU"]].map(([ability,label,effectId])=>["contagion-"+ability,{name:"Contagion ("+label+")",sourceIdentifier:"contagion",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplContagion0",effectName:"Infected ("+label+")",effectId,saveActivityId:"dnd5eactivity000"}])),
 ...Object.fromEntries([["antipathy","Frightened","aNztI08V5rN4s5mF","VlGQ41g1j0LeL8QY","Antipathy Save"],["sympathy","Charmed","pkTbvXvccMakDjyU","J6kTEeQc2cCyfppj","Sympathy Save"]].map(([key,effectName,effectId,saveActivityId,saveActivity])=>[key,{name:"Antipathy/Sympathy ("+key+")",sourceIdentifier:"antipathy-sympathy",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplAntipathyS",effectName,effectId,saveActivityId,saveActivity,promptMode:"manual",manualSaveLabel:"Confirm eligibility - Roll save",manualSaveNote:"Only roll if this creature ended its turn more than 120 feet from the spell's target. Confirm eligibility at the table; effect removal and temporary immunity remain manual."}]))
};
const MONSTER_WOUND_DEFAULTS={
  "mm-wound-bearded": {
    "name": "Bearded Devil - Infernal Wound",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "infernalWound",
    "sourceIdentifier": "infernal-glaive",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmBeardedDevil00.Item.mmInfernalGlaive",
    "effectName": "Infernal Wound",
    "event": "turnStart",
    "damageActivity": "HP loss",
    "damageActivityId": "IS4utGV80LpDrjvt",
    "saveActivity": "",
    "initialSaveId": "4qy3fKL086OAE1xR",
    "initialAttackId": "QV1oMxksn8BT14zw",
    "medicineDC": 12,
    "durationSeconds": 60,
    "endOnSuccess": false
  },
  "mm-wound-horned": {
    "name": "Horned Devil - Infernal Wound",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "infernalWound",
    "sourceIdentifier": "infernal-tail",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmHornedDevil000.Item.mmInfernalTail00",
    "effectName": "Infernal Wound",
    "event": "turnStart",
    "damageActivity": "HP loss",
    "damageActivityId": "zZfCQ0IeJZCjPLzE",
    "saveActivity": "",
    "initialSaveId": "tJYeyUk3iPYJq9xM",
    "initialAttackId": "",
    "medicineDC": 17,
    "durationSeconds": 60,
    "endOnSuccess": false
  }
};
const MONSTER_DAMAGE_DEFAULTS={
"mm-damage-smother":{
  "name": "Animated Rug of Smothering - Smother",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterDamage",
  "sourceIdentifier": "smother",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmAnimatedRugOfS.Item.mmSmother0000000",
  "effectName": "Grappled + Other Conditions",
  "effectId": "wfTA3WUcjBVzGa2H",
  "event": "turnStart",
  "damageActivity": "Grappled: Damage",
  "damageActivityId": "Y1lxdDPzkSRnAUGz",
  "damageFormula": "",
  "saveActivity": "Escape Check",
  "endOnSuccess": true,
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "saveEvent": "turnStart",
  "promptMode": "manual",
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "escapePassiveSkill": "ath",
  "damageTypesFallback": [
    "bludgeoning"
  ]
},
"mm-damage-whirlwind":{
  "name": "Djinni - Create Whirlwind",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterDamage",
  "sourceIdentifier": "create-whirlwind",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmDjinni00000000.Item.mmCreateWhirlwin",
  "effectName": "Restrained",
  "effectId": "cM3NSnDUlURCQP4q",
  "event": "turnStart",
  "damageActivity": "Damage: Start of Turn",
  "damageActivityId": "vxRsrpVaHxa02z8F",
  "damageFormula": "",
  "saveActivity": "Save",
  "endOnSuccess": true,
  "saveActivityId": "TYNKL0QDItFpbR2G",
  "saveEvent": "turnEnd",
  "exitRegionEnds": true
},
"mm-damage-gulthias":{
  "name": "Gulthias Blight - Life-Draining Root",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterDamage",
  "sourceIdentifier": "life-draining-root",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGulthiasBlight.Item.mmLifedrainingRo",
  "effectName": "Target: Grappled & Restrained",
  "effectId": "kh7KHWZhuhfocKLc",
  "event": "turnStart",
  "damageActivity": "Damage: Grappled",
  "damageActivityId": "y8c5uBc58T7dKgQf",
  "damageFormula": "",
  "saveActivity": "Escape Check",
  "endOnSuccess": true,
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "saveEvent": "turnStart",
  "promptMode": "manual",
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "escapePassiveSkill": "ath"
},
"mm-damage-swarm-stirges":{
  "name": "Swarm of Stirges - Swarm of Proboscises",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterDamage",
  "sourceIdentifier": "swarm-of-proboscises",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmSwarmOfStirges.Item.mmSwarmOfProbosc",
  "effectName": "Grappled",
  "effectId": "4bN35gRDRQf50aHf",
  "event": "turnEnd",
  "damageActivity": "Damage: Grappled",
  "damageActivityId": "n1k1Xq0kdB79VrOI",
  "damageFormula": "",
  "saveActivity": "Escape Check",
  "endOnSuccess": true,
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "saveEvent": "turnStart",
  "promptMode": "manual",
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "NniNd34SBzQTWIEk"
},
"mm-source-behir":{
  "name": "Behir - Swallow",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterDamage",
  "sourceIdentifier": "swallow",
  "sourceActorId": "mmBehir000000000",
  "sourceActorName": "Behir",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmBehir000000000.Item.mmSwallow0000000",
  "requiredActivityIds": [
    "YorssyWMumAsvzx3",
    "zrWNjO9mkbN28spL"
  ],
  "effectName": "Blinded, Restrained, and Total Cover",
  "effectId": "VOHv1LyO3hHolZXo",
  "event": "sourceTurnStart",
  "damageActivity": "Damage: Swallowed",
  "damageActivityId": "zrWNjO9mkbN28spL",
  "damageFormula": "",
  "saveActivity": "",
  "endOnSuccess": false,
  "requiresLivingSource": true
},
"mm-source-kraken":{
  "name": "Kraken - Swallow",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterDamage",
  "sourceIdentifier": "swallow",
  "sourceActorId": "mmKraken00000000",
  "sourceActorName": "Kraken",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmKraken00000000.Item.mmSwallow0000000",
  "requiredActivityIds": [
    "YorssyWMumAsvzx3",
    "zrWNjO9mkbN28spL"
  ],
  "effectName": "Restrained & Total Cover",
  "effectId": "VOHv1LyO3hHolZXo",
  "event": "turnStart",
  "damageActivity": "Damage: Swallowed",
  "damageActivityId": "zrWNjO9mkbN28spL",
  "damageFormula": "",
  "saveActivity": "",
  "endOnSuccess": false,
  "requiresLivingSource": true
},
"mm-source-purple-worm":{
  "name": "Purple Worm - Swallow",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterDamage",
  "sourceIdentifier": "swallow",
  "sourceActorId": "mmPurpleWorm0000",
  "sourceActorName": "Purple Worm",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmPurpleWorm0000.Item.mmSwallow0000000",
  "requiredActivityIds": [
    "YorssyWMumAsvzx3",
    "zrWNjO9mkbN28spL"
  ],
  "effectName": "Blinded, Restrained, and Total Cover",
  "effectId": "VOHv1LyO3hHolZXo",
  "event": "sourceTurnStart",
  "damageActivity": "Damage: Swallowed",
  "damageActivityId": "zrWNjO9mkbN28spL",
  "damageFormula": "",
  "saveActivity": "",
  "endOnSuccess": false,
  "requiresLivingSource": true
},
"mm-source-remorhaz":{
  "name": "Remorhaz - Swallow",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterDamage",
  "sourceIdentifier": "swallow",
  "sourceActorId": "mmRemorhaz000000",
  "sourceActorName": "Remorhaz",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmRemorhaz000000.Item.mmSwallow0000000",
  "requiredActivityIds": [
    "YorssyWMumAsvzx3",
    "zrWNjO9mkbN28spL"
  ],
  "effectName": "Blinded, Restrained, and Total Cover",
  "effectId": "VOHv1LyO3hHolZXo",
  "event": "sourceTurnStart",
  "damageActivity": "Damage: Swallowed",
  "damageActivityId": "zrWNjO9mkbN28spL",
  "damageFormula": "",
  "saveActivity": "",
  "endOnSuccess": false,
  "requiresLivingSource": true
},
"mm-source-tarrasque":{
  "name": "Tarrasque - Swallow",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterDamage",
  "sourceIdentifier": "swallow",
  "sourceActorId": "mmTarrasque00000",
  "sourceActorName": "Tarrasque",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmTarrasque00000.Item.mmSwallow0000000",
  "requiredActivityIds": [
    "YorssyWMumAsvzx3",
    "zrWNjO9mkbN28spL"
  ],
  "effectName": "Blinded, Restrained, and Total Cover",
  "effectId": "VOHv1LyO3hHolZXo",
  "event": "sourceTurnStart",
  "damageActivity": "Damage: Swallowed",
  "damageActivityId": "zrWNjO9mkbN28spL",
  "damageFormula": "",
  "saveActivity": "",
  "endOnSuccess": false,
  "requiresLivingSource": true
},
"mm-source-giant-toad":{
  "name": "Giant Toad - Swallow",
"requiredActivityIds":["0A0cIyRNbphDR82L"],
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterDamage",
  "sourceIdentifier": "swallow",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGiantToad00000.Item.mmSwallow0000000",
  "effectName": "Blinded, Restrained, and Total Cover",
  "effectId": "VOHv1LyO3hHolZXo",
  "event": "sourceTurnEnd",
  "damageActivity": "Damage: Swallowed",
  "damageActivityId": "zrWNjO9mkbN28spL",
  "damageFormula": "",
  "saveActivity": "",
  "endOnSuccess": false
},
"mm-source-gelatinous-cube":{
  "name": "Gelatinous Cube - Engulf",
"requiredActivityIds":["0sTemtp4b2QnaOMR"],
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterDamage",
  "sourceIdentifier": "engulf",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGelatinousCube.Item.mmEngulf00000000",
  "effectName": "Total Cover, Suffocating & Restrained",
  "effectId": "vsa7d6xWOAvWdOWM",
  "event": "sourceTurnStart",
  "damageActivity": "Save",
  "damageActivityId": "5o0Bh8PQaojx5XMx",
  "damageFormula": "",
  "saveActivity": "Escape Check",
  "endOnSuccess": true,
  "damageFromSave": true,
  "escapeCheck": true,
  "checkActivityId": "0sTemtp4b2QnaOMR",
  "checkSkills": [
    "ath"
  ],
  "saveEvent": "turnStart",
  "promptMode": "manual",
  "manualSaveLabel": "Use action — Escape engulf",
  "manualSaveNote": "Optional action: Strength (Athletics) against the cube’s recorded escape DC. Move the escaped creature at the table."
},
  "mm-damage-pit-fiend": {
    "name": "Pit Fiend - Bite",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterDamage",
    "sourceIdentifier": "bite",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmPitFiend000000.Item.mmBite0000000000",
    "effectName": "Poisoned",
    "effectId": "O1edMGJIx0MF1uze",
    "event": "turnStart",
    "damageActivity": "Add'l Poison Damage",
    "damageActivityId": "aa2GUeTEVLOdmfrB",
    "damageFormula": "",
    "saveActivity": "Repeat save",
    "saveActivityId": "fM7YmQ4hBtRXJkMe",
    "saveEvent": "turnEnd",
    "endOnSuccess": true,
    "saveAbility": "con",
    "initialAttackId": "xWlMeXFjELfSUWX9"
  },
  "mm-damage-vrock": {
    "name": "Vrock - Spores",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterDamage",
    "sourceIdentifier": "spores",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmVrock000000000.Item.mmSpores00000000",
    "effectName": "Poisoned",
    "effectId": "DeVYxc3BdGlZNeD9",
    "event": "turnStart",
    "damageActivity": "Damage While Poisoned",
    "damageActivityId": "ukZveNVmvvtwbDj0",
    "damageFormula": "",
    "saveActivity": "Save",
    "saveActivityId": "voqQeTnihpy3BTFf",
    "saveEvent": "turnEnd",
    "endOnSuccess": true
  },
  "mm-damage-vine-blight": {
    "name": "Vine Blight - Constricting Vine",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterDamage",
    "sourceIdentifier": "constricting-vine",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmVineBlight0000.Item.mmConstrictingVi",
    "effectName": "Grappled",
    "effectId": "34pNktSSN7SVVlBY",
    "event": "turnStart",
    "damageActivity": "Damage: Grappled",
    "damageActivityId": "7voODpkc7vuuouqM",
    "damageFormula": "",
    "saveActivity": "Escape Check",
"escapeCheck":true,"escapePassiveSkill":"ath","checkSkills":["acr","ath"],"promptMode":"manual","manualSaveLabel":"Use action — Escape grapple","manualSaveNote":"Optional action: choose Athletics or Acrobatics against the originating Vine Blight’s recorded escape DC.",
    "endOnSuccess": true
  },
  "mm-damage-tree-blight": {
    "name": "Tree Blight - Grasping Root",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterDamage",
    "sourceIdentifier": "grasping-root",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmTreeBlight0000.Item.mmGraspingRoot00",
    "effectName": "Grappled",
    "effectId": "PGUkhbWecRqF1RUk",
    "event": "turnStart",
    "damageActivity": "Damage: Start of Turns",
    "damageActivityId": "ZfTdvK7PuLzxKtZw",
    "damageFormula": "",
    "saveActivity": "Escape Check",
    "escapeCheck": true,
    "checkActivityId": "DlEX7Ca1nF3vxD6S",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "saveEvent": "turnStart",
    "promptMode": "manual",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Athletics or Acrobatics against the originating monster’s recorded escape DC."
  },
  "mm-damage-shambling-mound": {
    "name": "Shambling Mound - Engulf",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterDamage",
    "sourceIdentifier": "engulf",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmShamblingMound.Item.mmEngulf00000000",
    "effectName": "Grappled, Blinded & Restrained",
    "effectId": "vsa7d6xWOAvWdOWM",
    "event": "turnStart",
    "damageActivity": "Engulfed: Damage",
    "damageActivityId": "Exfa4q7O4SvXjGt7",
    "damageFormula": "",
    "saveActivity": "Escape Check",
    "escapeCheck": true,
    "checkActivityId": "Ps27Q3biyThByJeQ",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "saveEvent": "turnStart",
    "promptMode": "manual",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Athletics or Acrobatics against the originating monster’s recorded escape DC."
  },
  "mm-damage-blob-of-annihilation": {
    "name": "Blob of Annihilation - Engulf",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterDamage",
    "sourceIdentifier": "engulf",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmBlobOfAnnihila.Item.mmEngulf00000000",
    "effectName": "Total Cover, Suffocating & Restrained",
    "effectId": "vsa7d6xWOAvWdOWM",
    "event": "turnStart",
    "damageActivity": "Engulfed: Damage",
    "damageActivityId": "Exfa4q7O4SvXjGt7",
    "damageFormula": "",
    "saveActivity": "Save",
    "saveActivityId": "5o0Bh8PQaojx5XMx",
    "saveEvent": "turnEnd",
    "endOnSuccess": true
  },
  "mm-source-stirge": {
    "name": "Stirge - Proboscis",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterDamage",
    "sourceIdentifier": "proboscis",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmStirge00000000.Item.mmProboscis00000",
    "effectName": "Attached — Stirge",
    "event": "sourceTurnStart",
    "damageActivity": "Attached: Damage",
    "damageActivityId": "5xwoPMBiaRBqjFav",
    "damageFormula": "",
    "saveActivity": "",
    "endOnSuccess": false
  },
  "mm-source-invisible-stalker": {
    "name": "Invisible Stalker - Vortex",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterDamage",
    "sourceIdentifier": "vortex",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmInvisibleStalk.Item.mmVortex00000000",
    "effectName": "Grappled",
    "effectId": "fWPQye4Mr7VNbX9J",
    "event": "sourceTurnStart",
    "damageActivity": "Damage: Grappled",
    "damageActivityId": "kDz92inkRCjGrPiz",
    "damageFormula": "",
    "saveActivity": "Escape Check",
    "escapeCheck": true,
    "checkActivityId": "HtOlg4C8C2cikzCt",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "saveEvent": "turnStart",
    "promptMode": "manual",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Athletics or Acrobatics against the originating monster’s recorded escape DC."
  },
  "mm-source-water-elemental": {
    "name": "Water Elemental - Whelm",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterDamage",
    "sourceIdentifier": "whelm",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmWaterElemental.Item.mmWhelm000000000",
    "effectName": "Grappled & Restrained",
    "effectId": "rN76liiHkUoMRMJN",
    "event": "sourceTurnStart",
    "damageActivity": "Damage: Start of Turn",
    "damageActivityId": "khxVwH3AB0sx1qRG",
    "damageFormula": "",
    "saveActivity": "Escape Check",
    "escapeCheck": true,
    "checkActivityId": "aCRTymzPRSdmfVjr",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "saveEvent": "turnStart",
    "promptMode": "manual",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Athletics or Acrobatics against the originating monster’s recorded escape DC."
  },
  "mm-source-barbed-devil": {
    "name": "Barbed Devil - Barbed Hide",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterDamage",
    "sourceIdentifier": "barbed-hide",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmBarbedDevil000.Item.mmBarbedHide0000",
    "effectName": "Grappled",
    "event": "sourceTurnStart",
    "damageActivity": "Barbed Hide",
    "damageActivityId": "1O5eyc72vPW0UxYZ",
    "damageFormula": "",
    "saveActivity": "",
    "endOnSuccess": false,
    "grappleContactDamage": true
  }
};
const MONSTER_ESCAPE_DEFAULTS={
"genie-dao-crush":{name:"Elemental Smite — Dao’s Crush",enabled:true,attachment:"creature",sourceKind:"monsterEscape",sourceIdentifier:"elemental-smite",sourceSpellUuid:"Compendium.dnd-heroes-faerun.options.Item.hofOngElementalS",effectName:"Crushed (Grappled & Restrained)",effectId:"5eS5mKboaQxPHEJz",event:"turnStart",promptMode:"manual",escapeCheck:true,checkSkills:["acr","ath"],saveActivity:"Dao escape check",checkActivityId:"csOPXyBgbuK3D3wh",damageActivity:"",damageFormula:"",endOnSuccess:true,manualSaveLabel:"Use action — Escape Dao’s Crush",manualSaveNote:"Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the Paladin’s recorded spell save DC. Success ends both Grappled and Restrained."},
"mm-final-escape-1":{
  "name": "Aberrant Cultist - Tentacle Lash",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "tentacle-lash",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmAberrantCultis.Item.mmTentacleLash00",
  "effectName": "Grappled & Restrained",
  "effectId": "fwsC4LEiEsiCH93R",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "xCFHNAf6fLdFUWOQ"
},
"mm-final-escape-2":{
  "name": "Behir / Couatl / Marilith / Salamander / Yuan-ti Abomination / Yuan-ti Malison (Type 3) - Constrict",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "constrict",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmBehir000000000.Item.mmConstrict00000",
  "effectName": "Grappled and Restrained",
  "effectId": "Hd0Gy3wJtPfObERq",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "WlPyop72n5FEVubV"
},
"mm-final-escape-3":{
  "name": "Brazen Gorgon - Smelting Charge",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "smelting-charge",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmBrazenGorgon00.Item.mmSmeltingCharge",
  "effectName": "Grappled & Restrained",
  "effectId": "LWkIghqRZ7VM59yW",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "escapePassiveSkill": "ath",
  "sourceActorId": "mmBrazenGorgon00",
  "sourceActorName": "Brazen Gorgon",
  "requiredActivityIds": [
    "DnNDb8TtIrFe33aF"
  ]
},
"mm-final-escape-4":{
  "name": "Bugbear Stalker - Quick Grapple",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "quick-grapple",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmBugbearStalker.Item.mmQuickGrapple00",
  "effectName": "Grappled",
  "effectId": "5yLzwp2Gu803QgI9",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "UHSu9DkjmhXJAoWD"
},
"mm-final-escape-5":{
  "name": "Chain Devil - Chain",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "chain",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmChainDevil0000.Item.mmChain000000000",
  "effectName": "Grappled & Restrained",
  "effectId": "07IW8bZzgQ4Jk3sW",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "uH4DXArZ9I4AZCDz"
},
"mm-final-escape-6":{
  "name": "Constrictor Snake / Giant Constrictor Snake - Constrict",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "constrict",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmConstrictorSna.Item.mmConstrict00000",
  "effectName": "Grappled",
  "effectId": "Hd0Gy3wJtPfObERq",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "WlPyop72n5FEVubV"
},
"mm-final-escape-7":{
  "name": "Giant Frog - Bite",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "bite",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGiantFrog00000.Item.mmBite0000000000",
  "effectName": "Grappled",
  "effectId": "PCME8GwPLyFitNxH",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "A3wGTzBJVJwqbAs2"
},
"mm-final-escape-8":{
  "name": "Giant Toad - Bite",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "bite",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGiantToad00000.Item.mmBite0000000000",
  "effectName": "Grappled",
  "effectId": "1gX8RxYfePXlY6yf",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "escapePassiveSkill": "ath",
  "sourceActorId": "mmGiantToad00000",
  "sourceActorName": "Giant Toad",
  "requiredActivityIds": [
    "xWlMeXFjELfSUWX9"
  ]
},
"mm-final-escape-9":{
  "name": "Graveyard Revenant - Suffocate",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "suffocate",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGraveyardReven.Item.3YYshLRIcL7GvBG2",
  "effectName": "Grappled & Suffocating",
  "effectId": "KwKb78SLVT0vSVHZ",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "dAhLuKsXlyjOCphD"
},
"mm-final-escape-10":{
  "name": "Kraken - Tentacle",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "tentacle",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmKraken00000000.Item.mmTentacle000000",
  "effectName": "Grappled & Restrained",
  "effectId": "KxcWsIHohpNmagLJ",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "AXTWfIqBExpxSKly"
},
"mm-final-escape-11":{
  "name": "Kuo-toa - Sticky Net",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "sticky-net",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmKuotoa00000000.Item.BnRLQOEcoPDYB7fx",
  "effectName": "Restrained",
  "effectId": "OYESkIiMAdm4Isgz",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape net",
  "manualSaveNote": "Optional action: Strength (Athletics) to free yourself from this net. Helping another creature or destroying the net is handled at the table.",
  "checkActivityId": "PpDVRxauon5OjDoe"
},
"mm-final-escape-12":{
  "name": "Kuo-toa Whip - Pincer Staff",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "pincer-staff",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmKuotoaWhip0000.Item.mmPincerStaff000",
  "effectName": "Grappled",
  "effectId": "dtShSCAN0EU95KMo",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "NWQhunMoA2zH7YO2"
},
"mm-final-escape-13":{
  "name": "Purple Worm - Bite",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "bite",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmPurpleWorm0000.Item.mmBite0000000000",
  "effectName": "Grappled & Restrained",
  "effectId": "AvzcMcXTFpFurUhJ",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "PjcIP1DNNcF8PBNb"
},
"mm-final-escape-14":{
  "name": "Remorhaz - Bite",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "bite",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmRemorhaz000000.Item.mmBite0000000000",
  "effectName": "Grappled & Restrained",
  "effectId": "ZDI6g5ri1rsOh5EW",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "igo419qWZzXMBW7o"
},
"mm-final-escape-15":{
  "name": "Tarrasque - Bite",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "bite",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmTarrasque00000.Item.mmBite0000000000",
  "effectName": "Grappled & Restrained",
  "effectId": "wMLRjKVfS2fpTjiH",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "XI8y4UWFNo2DyrLF"
},
"mm-final-escape-16":{
  "name": "Water Weird - Surge",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterEscape",
  "sourceIdentifier": "surge",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmWaterWeird0000.Item.mmSurge000000000",
  "effectName": "Grappled & Restrained",
  "effectId": "NG1cNz0V4aKA54FP",
  "event": "turnStart",
  "promptMode": "manual",
  "escapeCheck": true,
  "checkSkills": [
    "acr",
    "ath"
  ],
  "escapeDisadvantage": false,
  "saveActivity": "Escape Check",
  "damageActivity": "",
  "damageFormula": "",
  "endOnSuccess": true,
  "manualSaveLabel": "Use action — Escape grapple",
  "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC.",
  "checkActivityId": "B7M8VFF2mXnJJyAa"
},
  "mm-escape-1": {
    "name": "Aboleth / Giant Squid / Otyugh - Tentacle",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "tentacle",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmAboleth0000000.Item.mmTentacle000000",
    "effectName": "Grappled",
    "effectId": "KxcWsIHohpNmagLJ",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "AXTWfIqBExpxSKly",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-2": {
    "name": "Ankheg - Bite",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "bite",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmAnkheg00000000.Item.mmBite0000000000",
    "effectName": "Grappled",
    "effectId": "ihvVTpfklXa7XAe2",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "A60yOG1E4jMUHpOf",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-3": {
    "name": "Barbed Devil - Claws",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "claws",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmBarbedDevil000.Item.mmClaws000000000",
    "effectName": "Grappled",
    "effectId": "MpjWPflcv7Jqd7Tu",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "5UtgpODC3lrTQd5t",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-4": {
    "name": "Bugbear Warrior - Grab",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "grab",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmBugbearWarrior.Item.mmGrab0000000000",
    "effectName": "Grappled",
    "effectId": "2N5R5UunQHBncwF3",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "KAoKjQKNTmMtuJG3",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-5": {
    "name": "Chuul / Glabrezu - Pincer",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "pincer",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmChuul000000000.Item.mmPincer00000000",
    "effectName": "Grappled",
    "effectId": "GCED8YlF6qXTgEkd",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "uVVP0skhv3PLMfnz",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-6": {
    "name": "Crocodile - Bite",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "bite",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmCrocodile00000.Item.mmBite0000000000",
    "effectName": "Grappled & Restrained",
    "effectId": "DmAM7moVZNE5wb5i",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "kPgRugxvd6oDkyKw",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-7": {
    "name": "Giant Crab - Claw",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "claw",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGiantCrab00000.Item.mmClaw0000000000",
    "effectName": "Grappled",
    "effectId": "LUQxsTZO5TCSCD5L",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "6m9rHNYKdMsKjSOj",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-8": {
    "name": "Giant Crocodile - Bite",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "bite",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGiantCrocodile.Item.mmBite0000000000",
    "effectName": "Grappled & Restrained",
    "effectId": "sBCqplORWr2DwgKU",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "3826u6DCZ7et6CJG",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-9": {
    "name": "Giant Octopus - Tentacles",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "tentacles",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGiantOctopus00.Item.mmTentacles00000",
    "effectName": "Grappled & Restrained",
    "effectId": "GyZrmzBP0NB8oRZI",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "Vo2UIgas007G3QXv",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-10": {
    "name": "Giant Scorpion - Claw",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "claw",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGiantScorpion0.Item.mmClaw0000000000",
    "effectName": "Grappled",
    "effectId": "4UopxSJg0E7WAHOk",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "6By7NkEmrZGMhJ0A",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-11": {
    "name": "Grell - Paralyzing Tentacles",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "paralyzing-tentacles",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGrell000000000.Item.PYIeX0xuuewqAlgZ",
    "effectName": "Grappled",
    "effectId": "nya2ONNV26cT8J5q",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "J3T5YZvBmAqWn4TJ",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-12": {
    "name": "Griffon - Rend",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "rend",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGriffon0000000.Item.mmRend0000000000",
    "effectName": "Grappled",
    "effectId": "FqB7QZZZTiN3trAC",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "6w1Y0JvkOG2S5XeK",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-13": {
    "name": "Mimic - Adhesive (Object Form Only)",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "adhesive",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmMimic000000000.Item.mmAdhesive000000",
    "effectName": "Grappled",
    "effectId": "PTmNYKeeD3d7EbJn",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "A8tsdGbbQVLbTmxk",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": true,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC. This escape check has Disadvantage."
  },
  "mm-escape-14": {
    "name": "Mimic - Pseudopod",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "pseudopod",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmMimic000000000.Item.mmPseudopod00000",
    "effectName": "Grappled",
    "effectId": "grTPAGPf3Hftz86s",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "tKl9pgRq1J5u0OxA",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": true,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC. This escape check has Disadvantage."
  },
  "mm-escape-15": {
    "name": "Roc - Talons",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "talons",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmRoc00000000000.Item.mmTalons00000000",
    "effectName": "Grappled & Restrained",
    "effectId": "14763NQ9RwBF1Vz8",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "GQidb2QEW4CgDtYB",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-16": {
    "name": "Tyrannosaurus Rex - Bite",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "bite",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmTyrannosaurusR.Item.mmBite0000000000",
    "effectName": "Grappled & Restrained",
    "effectId": "zlY4Bf1g2pEv81sd",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "p9WTtJg6LKu7NQxF",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-17": {
    "name": "Vampire - Grave Strike (Vampire Form Only)",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "grave-strike",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmVampire0000000.Item.mmGraveStrike000",
    "effectName": "Grappled",
    "effectId": "BCbp3JZoHEGQ3Nzu",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "eUp578Oy5y1HidZ9",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-18": {
    "name": "Vampire Spawn - Claw",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "claw",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmVampireSpawn00.Item.mmClaw0000000000",
    "effectName": "Grappled",
    "effectId": "SVSXgb9yjhotXMza",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "f3Xl0H0C7GX0jnje",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-3-1": {
    "name": "Mezzoloth - Claws",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "claws",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmBarbedDevil000.Item.mmClaws000000000",
    "effectName": "Grappled and Restrained",
    "effectId": "MpjWPflcv7Jqd7Tu",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "5UtgpODC3lrTQd5t",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-9-1": {
    "name": "Grick / Grick Ancient - Tentacles",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "tentacles",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGiantOctopus00.Item.mmTentacles00000",
    "effectName": "Grappled",
    "effectId": "GyZrmzBP0NB8oRZI",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "Vo2UIgas007G3QXv",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  },
  "mm-escape-9-2": {
    "name": "Mind Flayer - Tentacles",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterEscape",
    "sourceIdentifier": "tentacles",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGiantOctopus00.Item.mmTentacles00000",
    "effectName": "Grappled and Stunned",
    "effectId": "GyZrmzBP0NB8oRZI",
    "event": "turnStart",
    "promptMode": "manual",
    "escapeCheck": true,
    "checkActivityId": "Vo2UIgas007G3QXv",
    "checkSkills": [
      "acr",
      "ath"
    ],
    "escapeDisadvantage": false,
    "saveActivity": "Escape Check",
    "damageActivity": "",
    "damageFormula": "",
    "endOnSuccess": true,
    "manualSaveLabel": "Use action — Escape grapple",
    "manualSaveNote": "Optional action: choose Strength (Athletics) or Dexterity (Acrobatics) against the originating monster’s recorded escape DC."
  }
};
const MONSTER_SAVE_DEFAULTS={
"devious-strikes-knock-out":{name:"Devious Strikes — Knock Out",enabled:true,attachment:"creature",sourceKind:"monsterSave",sourceIdentifier:"devious-strikes",sourceSpellUuid:"Compendium.dnd-players-handbook.classes.Item.phbrgeDeviousStr",effectName:"Devious Strikes: Knocked Out",effectId:"C2IGgt4PnRMxZVey",event:"turnEnd",damageActivity:"",damageFormula:"",saveActivity:"Knock Out",saveActivityId:"3eq7lcmpkJJBU2KO",saveAbility:"con",endOnSuccess:true},
"cunning-strike-poison":{name:"Cunning Strike — Poison",enabled:true,attachment:"creature",sourceKind:"monsterSave",sourceIdentifier:"cunning-strike",sourceSpellUuid:"Compendium.dnd-players-handbook.classes.Item.phbrgeCunningStr",effectName:"Cunning Strike: Poisoned",effectId:"RazTM6biKVtNtjEW",event:"turnEnd",damageActivity:"",damageFormula:"",saveActivity:"Poison",saveActivityId:"n64fvJMT9fPUy7DH",saveAbility:"con",endOnSuccess:true},
"natures-wrath":{name:"Nature’s Wrath",enabled:true,attachment:"creature",sourceKind:"monsterSave",sourceIdentifier:"natures-wrath",sourceSpellUuid:"Compendium.dnd-players-handbook.classes.Item.phbpdnNaturesWra",effectName:"Nature's Wrath",effectId:"EeHl1k3tizvxbdLY",event:"turnEnd",damageActivity:"",damageFormula:"",saveActivity:"Save",saveActivityId:"SuusUi5JLqtcqLyj",saveAbility:"str",endOnSuccess:true},
"mm-repeat-drone":{
  "name": "Chasme - Drone",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterSave",
  "sourceIdentifier": "drone",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmChasme00000000.Item.mmDrone000000000",
  "effectName": "Unconscious",
  "effectId": "f04Z8zNXMjMn7x6U",
  "event": "turnEnd",
  "damageActivity": "",
  "damageFormula": "",
  "saveActivity": "Save",
  "saveActivityId": "zHx1Cn6jyRMmYxir",
  "endOnSuccess": true
},
"mm-repeat-euphoria-breath":{
  "name": "Faerie Dragons - Euphoria Breath",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterSave",
  "sourceIdentifier": "euphoria-breath",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmFaerieDragonAd.Item.mmEuphoriaBreath",
  "effectName": "Incapacitated",
  "effectId": "hv7my3sOURYES70U",
  "event": "turnEnd",
  "damageActivity": "",
  "damageFormula": "",
  "saveActivity": "Save",
  "saveActivityId": "Q6P0Nz8WgIKLlnNT",
  "endOnSuccess": true
},
"mm-repeat-luring-song":{
  "name": "Harpy - Luring Song",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterSave",
  "sourceIdentifier": "luring-song",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmHarpy000000000.Item.mmLuringSong0000",
  "effectName": "Charmed & Incapacitated",
  "effectId": "gJscxYD5nf7GlEo8",
  "event": "turnEnd",
  "damageActivity": "",
  "damageFormula": "",
  "saveActivity": "Save",
  "saveActivityId": "dxxqZP7Vo01te3QB",
  "endOnSuccess": true,
  "durationUntilConcentration": true
},
"mm-repeat-vengeful-glare-paralysis":{
  "name": "Revenant - Vengeful Glare",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterSave",
  "sourceIdentifier": "vengeful-glare",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmRevenant000000.Item.mmVengefulGlare0",
  "effectName": "Frightened & Paralyzed",
  "effectId": "N4LQtxqukk4oXRcf",
  "event": "turnEnd",
  "damageActivity": "",
  "damageFormula": "",
  "saveActivity": "Save",
  "saveActivityId": "r2U9soI3vKTrXhG1",
  "endOnSuccess": true,
  "saveGroup": "revenant-glare"
},
"mm-repeat-vengeful-glare-fear":{
  "name": "Revenant - Vengeful Glare",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterSave",
  "sourceIdentifier": "vengeful-glare",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmRevenant000000.Item.mmVengefulGlare0",
  "effectName": "Frightened",
  "effectId": "zXgQzZ7wN3XnGAN4",
  "event": "turnEnd",
  "damageActivity": "",
  "damageFormula": "",
  "saveActivity": "Save",
  "saveActivityId": "r2U9soI3vKTrXhG1",
  "endOnSuccess": true,
  "saveGroup": "revenant-glare"
},
"mm-repeat-roar":{
  "name": "Sphinx of Valor - Second Roar",
  "enabled": true,
  "attachment": "creature",
  "sourceKind": "monsterSave",
  "sourceIdentifier": "roar",
  "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmSphinxOfValor0.Item.mmRoar0000000000",
  "effectName": "Paralyzed",
  "effectId": "sbId6Nv8mOtH5EKR",
  "event": "turnEnd",
  "damageActivity": "",
  "damageFormula": "",
  "saveActivity": "Second Roar: Save",
  "saveActivityId": "uFTndQPvULZVHT9R",
  "endOnSuccess": true
},
  "mm-paralyzing-tentacles": {
    "name": "Carrion Crawler / Chuul - Paralyzing Tentacles",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterSave",
    "sourceIdentifier": "paralyzing-tentacles",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmCarrionCrawler.Item.mmParalyzingTent",
    "effectName": "Poisoned & Paralyzed",
    "effectId": "5ReKSrBu11ume7GP",
    "event": "turnEnd",
    "damageActivity": "",
    "damageFormula": "",
    "saveActivity": "Save",
    "saveActivityId": "p157Iqz8s0M0VilW",
    "endOnSuccess": true
  },
  "mm-grell-paralyzing-tentacles": {
    "name": "Grell - Poisoned and Paralyzed",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterSave",
    "sourceIdentifier": "paralyzing-tentacles",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGrell000000000.Item.PYIeX0xuuewqAlgZ",
    "effectName": "Poisoned & Paralyzed",
    "effectId": "gaQaH4IKga1Eg7gr",
    "event": "turnEnd",
    "damageActivity": "",
    "damageFormula": "",
    "saveActivity": "Save",
    "saveActivityId": "MEc8vUTPipCkqjyq",
    "endOnSuccess": true
  },
  "mm-unsettling-visage": {
    "name": "Doppelganger - Unsettling Visage",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterSave",
    "sourceIdentifier": "unsettling-visage",
    "targetingRegionCleanup": "casterTurnEnd",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmDoppelganger00.Item.mmUnsettlingVisa",
    "effectName": "Frightened",
    "effectId": "t3d77s2YYM0OgsvZ",
    "event": "turnEnd",
    "damageActivity": "",
    "damageFormula": "",
    "saveActivity": "Save",
    "saveActivityId": "USxIbGZPLvfPnnoI",
    "endOnSuccess": true
  },
  "mm-haunting-glare": {
    "name": "Graveyard Revenant - Haunting Glare",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterSave",
    "sourceIdentifier": "haunting-glare",
    "targetingRegionCleanup": "casterTurnEnd",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmGraveyardReven.Item.mmHauntingGlare0",
    "effectName": "Paralyzed",
    "effectId": "08YWgkXqcGlDdaDe",
    "event": "turnEnd",
    "damageActivity": "",
    "damageFormula": "",
    "saveActivity": "Save",
    "saveActivityId": "kIxd4BuhFya6117b",
    "endOnSuccess": true
  },
  "mm-pacifying-spores": {
    "name": "Myconids - Pacifying Spores",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterSave",
    "sourceIdentifier": "pacifying-spores",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmMyconidAdult00.Item.mmPacifyingSpore",
    "effectName": "Stunned",
    "effectId": "pYhpTUwNUgDPGu4J",
    "event": "turnEnd",
    "damageActivity": "",
    "damageFormula": "",
    "saveActivity": "Save",
    "saveActivityId": "6c9CieCQWV7XsKLy",
    "endOnSuccess": true
  },
  "mm-paralysis-gas": {
    "name": "Modron Pentadrone - Paralysis Gas",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterSave",
    "sourceIdentifier": "paralysis-gas",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmModronPentadro.Item.mmParalysisGas00",
    "effectName": "Paralyzed",
    "effectId": "XHzklXOxjvcl12rx",
    "event": "turnEnd",
    "damageActivity": "",
    "damageFormula": "",
    "saveActivity": "Save",
    "saveActivityId": "7A7cyFzvHi67yI5f",
    "endOnSuccess": true
  },
  "mm-scare": {
    "name": "Quasit - Scare",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterSave",
    "sourceIdentifier": "scare",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmQuasit00000000.Item.mmScare000000000",
    "effectName": "Frightened",
    "effectId": "u8Gu5Oo3a48vKYla",
    "event": "turnEnd",
    "damageActivity": "",
    "damageFormula": "",
    "saveActivity": "Save",
    "saveActivityId": "L6pjs2RafI3pF8b3",
    "endOnSuccess": true
  },
  "mm-weakening-breath": {
    "name": "Gold Dragons - Weakening Breath",
    "enabled": true,
    "attachment": "creature",
    "sourceKind": "monsterSave",
    "sourceIdentifier": "weakening-breath",
    "sourceSpellUuid": "Compendium.dnd-monster-manual.actors.Actor.mmAdultGoldDrago.Item.mmWeakeningBreat",
    "effectName": "Weakened",
    "effectId": "wpkp78XzdLs9q2C3",
    "event": "turnEnd",
    "damageActivity": "",
    "damageFormula": "",
    "saveActivity": "Save",
    "saveActivityId": "EGZ4bS4HpJkfNG9s",
    "endOnSuccess": true
  }
};
export const TRIGGER_DEFAULTS=Object.freeze({...Object.fromEntries(Object.entries(MONSTER_WOUND_DEFAULTS).map(([key,entry])=>[key,Object.freeze(entry)])),...Object.fromEntries(Object.entries(MONSTER_DAMAGE_DEFAULTS).map(([key,entry])=>[key,Object.freeze(entry)])),...Object.fromEntries(Object.entries(MONSTER_ESCAPE_DEFAULTS).map(([key,entry])=>[key,Object.freeze(entry)])),...Object.fromEntries(Object.entries(MONSTER_SAVE_DEFAULTS).map(([key,entry])=>[key,Object.freeze(entry)])),...Object.fromEntries(Object.entries(PROMPT_ONLY_DEFAULTS).map(([key,entry])=>[key,Object.freeze({enabled:true,attachment:"creature",event:"turnEnd",damageActivity:"",damageFormula:"",saveActivity:"Save",endOnSuccess:false,manualResolution:true,...entry})])),...Object.fromEntries(Object.entries(HEALING_DEFAULTS).map(([key,entry])=>[key,Object.freeze(entry)])),...Object.fromEntries(Object.entries(SAVE_FIRST_DEFAULTS).map(([key,entry])=>[key,Object.freeze(entry)])),...Object.fromEntries(Object.entries(DELAYED_DAMAGE_DEFAULTS).map(([key,entry])=>[key,Object.freeze(entry)])),"power-word-stun":Object.freeze({name:"Power Word Stun",enabled:true,attachment:"creature",sourceKind:"syntheticSave",sourceIdentifier:"power-word-stun",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplPowerWordS",effectName:"Stunned",effectId:"o7XJceFSBTiIIPFo",event:"turnEnd",damageActivity:"",saveActivity:"End of Turn Save",saveActivityId:"rsaStunEndSave01",saveAbility:"con",damageFormula:"",endOnSuccess:true}),...Object.fromEntries(Object.entries(ESCAPE_DEFAULTS).map(([key,entry])=>[key,Object.freeze(entry)])),"blink":Object.freeze({name:"Blink",enabled:true,attachment:"creature",sourceKind:"blink",effectName:"Blink — Active",event:"turnEnd",damageActivity:"",saveActivity:"",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplBlink00000"}),"grapple":Object.freeze({name:"Grapple",enabled:true,attachment:"creature",sourceKind:"grapple",effectName:"Grappled",event:"turnStart",promptMode:"manual",damageActivity:"",saveActivity:"Escape Grapple",endOnSuccess:true}),...Object.fromEntries(Object.entries(EVENT_SAVE_DEFAULTS).map(([key,entry])=>[key,Object.freeze(entry)])),...Object.fromEntries(Object.entries(REPEAT_SAVE_DEFAULTS).map(([key,entry])=>[key,Object.freeze(entry)])),"searing-smite":Object.freeze({name:"Searing Smite",enabled:true,attachment:"creature",effectName:"Seared",event:"turnStart",damageActivity:"Damage",saveActivity:"Start of Turn Save",damageFormula:"",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplSearingSmi",endOnSuccess:true}),"fear":Object.freeze({name:"Fear",enabled:true,attachment:"creature",effectName:"Fear",effectId:"ijiWLu6EJZmEJPOZ",event:"turnEnd",damageActivity:"",saveActivity:"Save",saveActivityId:"dnd5eactivity000",damageFormula:"",sourceSpellUuid:"Compendium.dnd-players-handbook.spells.Item.phbsplFear000000",saveCondition:"gmNoLineOfSight",targetingRegionCleanup:"casterTurnEnd",endOnSuccess:true})});
export function triggerKeys(){return [...new Set([...Object.keys(TRIGGER_DEFAULTS),...Object.entries(game.settings.get(ID,"triggerLibraryCustoms")??{}).filter(([,entry])=>entry?.name&&entry?.sourceSpellUuid).map(([key])=>key)])];}
export function triggerEntry(key){const custom=game.settings.get(ID,"triggerLibraryCustoms")?.[key];const base=TRIGGER_DEFAULTS[key]??custom;return base?{...base,...(TRIGGER_DEFAULTS[key]?game.settings.get(ID,"triggerLibraryOverrides")?.[key]:{}),attachment:"creature"}:null;}
export function matchesTriggerSourceActor(spell,entry){
 if(!entry.sourceActorId)return true;
 const actor=spell?.actor??spell?.parent,refs=[actor?._stats?.compendiumSource,actor?._stats?.duplicateSource,actor?._source?._stats?.compendiumSource,spell?._stats?.compendiumSource,spell?._stats?.duplicateSource,actor?.uuid,spell?.uuid].filter(ref=>typeof ref==="string");
 const bookActors=refs.map(ref=>ref.match(/Compendium\.dnd-monster-manual\.actors\.Actor\.([^.]+)/)?.[1]).filter(Boolean);
 if(bookActors.length)return bookActors.includes(entry.sourceActorId);
 return actor?.id===entry.sourceActorId||actor?.name?.trim().toLowerCase()===entry.sourceActorName?.toLowerCase();
}
export function triggerKeyForSpell(spell,effect){const identifier=spell?.identifier??spell?.system?.identifier;const keys=triggerKeys().filter(key=>{const entry=triggerEntry(key);return (!["monsterSave","monsterEscape","monsterDamage"].includes(entry.sourceKind)||["feat","weapon"].includes(spell?.type)&&Array.from(spell.system?.activities??[]).some(activity=>activity.id===(entry.sourceKind==="monsterDamage"?entry.damageActivityId:entry.sourceKind==="monsterEscape"?entry.checkActivityId:entry.saveActivityId)||entry.sourceKind==="monsterEscape"&&entry.escapePassiveSkill&&entry.requiredActivityIds?.length>0))&&matchesTriggerSourceActor(spell,entry)&&(entry.requiredActivityIds??[]).every(id=>Array.from(spell?.system?.activities??[]).some(a=>a.id===id))&&(!effect||entry.effectName===effect.name)&&(identifier===key||!!entry.sourceIdentifier&&identifier===entry.sourceIdentifier||!!entry.sourceSpellUuid&&spell?.uuid===entry.sourceSpellUuid);});return keys.find(key=>!TRIGGER_DEFAULTS[key]&&triggerEntry(key).sourceSpellUuid===spell?.uuid)??keys[0];}
export async function saveTriggerEntry(key,entry){validateTriggerEntry(entry);const setting=TRIGGER_DEFAULTS[key]?"triggerLibraryOverrides":"triggerLibraryCustoms";const entries=foundry.utils.deepClone(game.settings.get(ID,setting)??{});entries[key]=entry;await game.settings.set(ID,setting,entries);}
export function validateTriggerEntry(entry){
 if(entry.sourceKind==="blink")return entry;
 if(entry.sourceKind==="recurringHealing"){
  if(!["turnStart","turnEnd"].includes(entry.event)||!entry.effectName?.trim()||!["healing","temphp"].includes(entry.healingType)||!["casterMod","fixed"].includes(entry.healingSource))throw Error("Choose a turn trigger, applied effect and healing type/source.");
  if(entry.healingSource==="fixed"&&(!Number.isFinite(Number(entry.healingAmount))||Number(entry.healingAmount)<0))throw Error("Healing amount must be zero or greater.");return entry;
 }
 if(!["turnStart","turnEnd","damage",...(entry.sourceKind==="monsterDamage"?["sourceTurnStart","sourceTurnEnd"]:[])].includes(entry.event))throw Error("Choose a supported turn or damage trigger.");
 if((entry.event==="damage"||entry.onDamage)&&(!entry.saveActivity||entry.damageActivity))throw Error("Damage-taken triggers require a save-only activity.");
 if(!entry.effectName?.trim()||(!entry.damageActivity?.trim()&&!entry.saveActivity?.trim()))throw Error("Choose an applied effect and at least one damage or save activity.");
 if(entry.damageFormula&&!entry.damageActivity)throw Error("Custom damage requires a damage activity.");
 if(entry.damageFormula&&!Roll.validate(entry.damageFormula))throw Error("The damage formula is invalid.");
 return entry;
}
const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export class TriggerLibraryApp extends foundry.applications.api.ApplicationV2{
 static DEFAULT_OPTIONS={id:"rsa-trigger-library",window:{title:"Trigger Automation Library — Creature Effects",resizable:true},position:{width:830,height:400}};
 editors=new Map();
 searchText="";
 async _renderHTML(){
  const overrides=game.settings.get(ID,"triggerLibraryOverrides")??{};
  const rows=triggerKeys().map(key=>{const entry=triggerEntry(key);return `<tr data-trigger-search="${escape((entry.name+' '+entry.effectName).toLocaleLowerCase())}"><th scope="row">${escape(entry.name)}</th><td>${escape(entry.effectName)}</td><td>${entry.event==="damage"?"Damage taken":entry.event==="turnEnd"?"Turn end":"Turn start"}${entry.onDamage?" + damage taken":""}${entry.promptMode==="manual"?" (GM chooses)":""}</td><td>${entry.enabled?"Enabled":"Disabled"}</td><td>${!TRIGGER_DEFAULTS[key]?"Custom entry":Object.keys(overrides[key]??{}).length?"Customized":"Default"}</td><td><button type="button" data-edit-entry="${escape(key)}" aria-label="View or edit ${escape(entry.name)}"><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> View/Edit</button></td></tr>`;}).join("");
  return `<div style="padding:16px;display:grid;gap:12px"><div><button type="button" data-add-entry style="width:auto"><i class="fa-solid fa-plus" aria-hidden="true"></i> Add New Effect</button></div><h2>Creature Effect Triggers</h2><p>Choose an entry to view its trigger and settings. Existing book effects and Region settings are preserved.</p><label style="display:grid;gap:4px">Search triggers<input type="search" data-trigger-filter placeholder="Search by spell or effect name…" value="${escape(this.searchText)}"></label><p data-trigger-empty role="status" hidden>No matching triggers.</p><div style="overflow-x:auto"><table style="width:100%"><thead><tr><th scope="col">Spell / Feature</th><th scope="col">Effect</th><th scope="col">Trigger</th><th scope="col">Status</th><th scope="col">Settings</th><th scope="col">Action</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
 }
 _replaceHTML(result,content){content.style.display="block";content.style.minHeight="0";content.style.overflowY="auto";content.style.scrollbarGutter="stable";content.innerHTML=result;}
 applySearch(){const terms=this.searchText.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);let visible=0;for(const row of this.element.querySelectorAll("[data-trigger-search]")){const matches=terms.every(term=>row.dataset.triggerSearch.includes(term));row.hidden=!matches;row.style.display=matches?"":"none";if(matches)visible++;}this.element.querySelector("[data-trigger-empty]").hidden=visible>0;}
 _onRender(context,options){super._onRender(context,options);this.element.querySelector("[data-trigger-filter]").addEventListener("input",event=>{this.searchText=event.currentTarget.value;this.applySearch();});this.applySearch();this.element.querySelector("[data-add-entry]").addEventListener("click",()=>this.openCreate());for(const button of this.element.querySelectorAll('[data-edit-entry]'))button.addEventListener('click',()=>this.openEntry(button.dataset.editEntry));}
 openCreate(){new TriggerSourceApp(async item=>{const key="custom-"+foundry.utils.randomID();const draft=newTriggerFromSpell(item);const editor=new TriggerEntryApp(key,()=>{if(this.rendered)this.render({force:true});},draft);this.editors.set(key,editor);editor.render({force:true});}).render({force:true});}
 openEntry(key){
  if(!triggerEntry(key))return;
  let editor=this.editors.get(key);
  if(!editor){editor=new TriggerEntryApp(key,()=>{if(this.rendered)this.render({force:true});});this.editors.set(key,editor);}
  editor.render({force:true});editor.bringToFront?.();
 }
}
export async function resolveEntrySource(entry){
 if(entry.sourceKind==="grapple")return null;
 if(entry.sourceSpellUuid){try{const item=await fromUuid(entry.sourceSpellUuid);if(item?.type==="spell")return item;}catch{}}
 const actors=[...Array.from(game.actors??[]),...Array.from(globalThis.canvas?.tokens?.placeables??[],token=>token.actor).filter(Boolean)];
 for(const actor of actors){const item=Array.from(actor.items??[]).find(item=>item.type==="spell"&&((item.identifier??item.system?.identifier)===(entry.sourceIdentifier??"searing-smite")||item.name===entry.name));if(item)return item;}
 return null;
}
export function entrySourceOptions(item,entry){
 return {effects:Array.from(item?.effects??[]).map(effect=>({id:effect.id,name:effect.name})),damage:Array.from(item?.system?.activities??[]).filter(a=>a.type==="damage"||entry?.damageFromSave&&a.type==="save").map(a=>({id:a.id,name:a.name})),save:entry?.sourceKind==="syntheticSave"?[{id:entry.saveActivityId,name:entry.saveActivity}]:Array.from(item?.system?.activities??[]).filter(a=>a.type==="save").map(a=>({id:a.id,name:a.name||"Save"}))};
}
const HELP={
 healing:["Recurring healing","At the configured turn event, create a fixed healing card without a roll dialog. Caster modifier is captured when the native effect is applied. Temporary HP uses native replacement rules and never stacks; normal healing respects HP caps. Auto Apply Healing controls application. Removing or disabling the effect stops future benefits."],
 source:["Source spell","Use Choose Source to open a separate window where you can drop a spell or paste its UUID. This loads its effects and activities without changing the spell. Save the entry to keep changes."],
 effect:["Applied effect","Choose the book effect that carries this trigger on a creature. Its existing stat changes and duration stay intact. Removing, disabling, or expiring the effect stops future triggers."],
 trigger:["Turn trigger","Choose turn start, turn end, or damage taken. Optional action saves can show a card without opening a roll; the GM decides whether to use it. Damage taken means a positive damage application, including temporary HP, not healing or Undo. Turn progression stays unblocked."],
 damage:["Damage","Choose None for save-only effects such as Fear. Use spell damage preserves the native damage type and scaling at the original cast level. Custom damage replaces that calculation with a fixed formula, such as 3d6. It does not automatically scale with the spell slot."],
 save:["Saving throw","Choose a save activity from the spell. It runs after the recurring damage and uses the caster’s save DC recorded when the effect was applied. None skips this step. Fear requires GM confirmation that the affected creature cannot see the caster before its repeat save."],
 area:["Targeting area lifetime","Use spell duration keeps the area for its normal duration. Remove at caster turn end treats the area as a targeting aid only, like Fear’s cone. It removes only the Region, preserving concentration and creature effects. Requires the Remove Instantaneous Areas at Turn End option and active combat. Regions configured with ongoing triggers or effects are preserved."],
 cleanup:["Effect removal","Remove the tracked effect after a successful save and completed dice animations. A failed save leaves it active. Disable this option if the table handles removal manually."]
};
const info=key=>`<button type="button" data-info="${key}" aria-label="Information about ${escape(HELP[key][0])}" data-tooltip="${escape(HELP[key][1])}" style="cursor:help;flex:0 0 auto;width:26px;height:26px;padding:0;border:0;background:none"><i class="fa-solid fa-circle-info" aria-hidden="true"></i></button>`;
const dropdown=(name,choices,value,id,{none=false}={})=>{
 const options=[...choices];if(value&&!options.some(option=>option.name===value))options.unshift({name:value,id:id??""});
 const matchId=id&&options.some(option=>option.id===id);
 return `<select name="${name}">${none?`<option value="" ${!value?'selected':''}>None</option>`:""}${options.map(option=>`<option value="${escape(option.name)}" data-id="${escape(option.id)}" ${(matchId?option.id===id:option.name===value)?'selected':''}>${escape(option.name||"Unnamed activity")}</option>`).join("")}</select>`;
};
export class TriggerEntryApp extends foundry.applications.api.ApplicationV2{
 static DEFAULT_OPTIONS={window:{title:"Creature Effect Trigger",resizable:true},position:{width:760,height:850}};
 constructor(key,onChange,draft=null){
  const entry=draft??triggerEntry(key);if(!entry)throw Error("Unknown trigger library entry.");
  super({id:"rsa-trigger-entry-"+key,window:{title:entry.name+" — View/Edit Trigger"}});
  this.entryKey=key;this.onChange=onChange;this.draft=draft;this.source=null;
 }
 async _renderHTML(){
  const e=this.draft??=triggerEntry(this.entryKey);this.source??=await resolveEntrySource(e);
  if(e.sourceKind==="blink")return `<div style="padding:16px;display:grid;gap:12px"><h2>Blink</h2><label><input name="enabled" type="checkbox" ${e.enabled?"checked":""}> Enable Blink automation</label><p>The initial card stays available. Roll manually on your turn, or let turn end roll automatically; only one check is allowed per turn. On 4–6, Ethereal applies after the dice finish. At turn start, return and choose your space manually.</p><p>Token visibility and movement stay under player/GM control. Ending the tracked effect clears its Ethereal effect.</p><footer><button type="button" data-reset>Reset to Default</button><button type="button" data-save>Save</button></footer></div>`;
  if(e.sourceKind==="recurringHealing")return `<div style="padding:16px;display:grid;gap:12px;overflow-y:auto"><h2>${escape(e.name)} - Recurring healing</h2><label><input name="enabled" type="checkbox" ${e.enabled?"checked":""}> Enable recurring healing</label><p>${escape(e.effectName)} ${info("effect")}</p><label>Trigger <select name="event"><option value="turnStart" ${e.event!=="turnEnd"?"selected":""}>Start of target turn</option><option value="turnEnd" ${e.event==="turnEnd"?"selected":""}>End of target turn</option></select></label><p>${e.healingType==="temphp"?"Refresh temporary HP without stacking or reducing a higher existing amount.":"Restore HP up to the creature's maximum; initial healing is not repeated."}</p><label>Amount ${info("healing")} <select name="healingSource"><option value="casterMod" ${e.healingSource==="casterMod"?"selected":""}>Caster spellcasting modifier (recorded on application)</option><option value="fixed" ${e.healingSource==="fixed"?"selected":""}>Fixed amount</option></select></label><label>Fixed amount <input name="healingAmount" type="number" min="0" value="${Number(e.healingAmount??1)}"></label><p>Fixed turn benefits create a healing card without a roll dialog. Auto Apply Healing controls application; otherwise use Apply on the card. Existing native effect changes stay intact.</p><footer><button type="button" data-reset>Reset to Default</button><button type="button" data-save>Save</button></footer></div>`;
  if(e.sourceKind==="infernalWound")return `<div style="padding:16px;display:grid;gap:12px"><h2>${escape(e.name)}</h2><label><input name="enabled" type="checkbox" ${e.enabled?"checked":""}> Enable infernal wound automation</label><p>At target turn start, roll native HP loss. This bypasses temporary HP and damage resistance. An optional DC ${e.medicineDC} Wisdom (Medicine) action can close the wound. Spell healing that restores HP also closes it; otherwise it expires after one minute. Wounds do not stack.</p><footer><button type="button" data-reset>Reset to Default</button><button type="button" data-save>Save</button></footer></div>`;
  if(e.sourceKind==="monsterDamage")return `<div style="padding:16px;display:grid;gap:12px;overflow-y:auto"><h2>${escape(e.name)}</h2><label><input name="enabled" type="checkbox" ${e.enabled?"checked":""}> Enable recurring damage</label><p>${escape(e.effectName)} ${info("effect")}</p><p>${e.event==="sourceTurnEnd"?"At the originating monster’s turn end, prompt native damage for its tracked targets.":e.event==="sourceTurnStart"?"At the originating monster’s turn start, prompt native damage for its tracked targets.":e.event==="turnEnd"?"At the affected creature’s turn end, prompt the native recurring damage.":"At the affected creature’s turn start, prompt the native recurring damage."} ${e.escapeCheck?(e.saveEvent&&e.saveEvent!==e.event?"At the affected creature’s turn start, show an optional Athletics or Acrobatics escape action.":"Then show an optional Athletics or Acrobatics escape action."):e.saveEvent?"At turn end, request the repeat saving throw.":e.grappleContactDamage?"Damage creatures grappled by the devil and creatures grappling it. End the grapple to stop it.":"Disable or remove the tracked effect to stop the damage."}</p><p>Native damage, source DC and effect changes are preserved. Movement and special interactions remain manual.</p><footer><button type="button" data-reset>Reset to Default</button><button type="button" data-save>Save</button></footer></div>`;
  if(e.sourceKind==="monsterEscape")return `<div style="padding:16px;display:grid;gap:12px;overflow-y:auto"><h2>${escape(e.name)} — Escape grapple</h2><label><input name="enabled" type="checkbox" ${e.enabled?"checked":""}> Enable escape prompts</label><p>${escape(e.effectName)} ${info("effect")}</p><p>Show an optional action at turn start. The player chooses Athletics or Acrobatics against the originating monster’s recorded escape DC. No check rolls automatically.</p><label>Show escape card <select name="event"><option value="turnStart" ${e.event!=="turnEnd"?"selected":""}>At turn start</option><option value="turnEnd" ${e.event==="turnEnd"?"selected":""}>At turn end</option></select></label><label><input name="escapeDisadvantage" type="checkbox" ${e.escapeDisadvantage?"checked":""}> Default escape checks to Disadvantage</label><p>Success removes this tracked grapple and its linked conditions after the dice finish. Other effects remain separate.</p><footer><button type="button" data-reset>Reset to Default</button><button type="button" data-save>Save</button></footer></div>`;
  if(e.sourceKind==="athleticsEscape")return `<div style="padding:16px;display:grid;gap:12px"><h2>${escape(e.name)} — Escape</h2><label><input name="enabled" type="checkbox" ${e.enabled?"checked":""}> Enable creature escape checks</label><p>${escape(e.effectName)} ${info("effect")}</p><p>Spend an action to attempt a Strength (Athletics) check against the original caster’s recorded spell DC. The GM chooses when to open the check; it never rolls automatically.</p><label>Show escape card <select name="event"><option value="turnStart" ${e.event!=="turnEnd"?"selected":""}>At turn start</option><option value="turnEnd" ${e.event==="turnEnd"?"selected":""}>At turn end</option></select></label><p>${e.damageActivity?"Turn-start damage resolves first; the optional escape check follows. Native cast-level scaling is preserved.":"The escape check deals no damage and does not repeat the initial save."}</p><p>Success removes only this spell’s tracked restraint after dice animations. Region saves and effects remain separate.</p><footer><button type="button" data-reset>Reset to Default</button><button type="button" data-save>Save</button></footer></div>`;
  const choices=entrySourceOptions(this.source,e),custom=!!e.damageFormula;
  const section=(title,key,body)=>`<section style="display:grid;gap:6px"><div style="display:flex;align-items:center;gap:6px"><strong>${title}</strong>${info(key)}</div>${body}</section>`;
  return `<div style="padding:16px;display:grid;gap:15px;min-height:0;max-height:100%;overflow-y:auto"><div><button type="button" data-choose-source style="width:auto" ${e.sourceKind==="grapple"?"disabled":""}><i class="fa-solid fa-book-open" aria-hidden="true"></i> Choose Source</button></div><h2>${escape(e.name)}</h2><label><input name="enabled" type="checkbox" ${e.enabled?'checked':''}> Enable recurring triggers</label>
  ${section('Source spell','source',`<p>${e.sourceKind==="grapple"?'Unarmed Grapple — uses the original grappler’s recorded DC and the target’s better Strength/Dexterity save.':this.source?escape(this.source.name):'Saved recipe (source unavailable)'}</p>`)}
  ${e.manualResolution?"<p>Prompt only: save counts, effects and other outcomes are handled at the table. Use Stop repeat saves on the card when no further prompts are needed.</p>":""}
  ${e.saveFirst?"<p>Save first: only a failed save prompts recurring damage. Success ends this target effect after the dice finish.</p>":""}
  ${e.oneShot?"<p>One-time delayed damage: create one card at turn end, then remove this effect after its damage dice finish. A canceled roll stays on that same card for retry.</p>":""}
  ${section('Applied effect','effect',dropdown('effectName',choices.effects,e.effectName,e.effectId))}
  ${section('Trigger','trigger',`<select name="event"><option value="turnStart" ${e.event==='turnStart'?'selected':''}>Start of affected creature’s turn</option><option value="turnEnd" ${e.event==='turnEnd'?'selected':''}>End of affected creature’s turn</option><option value="damage" ${e.event==='damage'?'selected':''}>When the affected creature takes damage</option></select><label><input name="onDamage" type="checkbox" ${e.onDamage?'checked':''}> Also trigger on damage taken</label><label><input name="damageSaveAdvantage" type="checkbox" ${e.damageSaveAdvantage?'checked':''}> Advantage on damage-triggered saves</label><label>Roll prompt <select name="promptMode"><option value="automatic" ${e.promptMode!=="manual"?'selected':''}>Prompt normally</option><option value="manual" ${e.promptMode==="manual"?'selected':''}>Card only — GM chooses whether to roll</option></select></label>`)}
  ${section('Damage','damage',`${dropdown('damageActivity',choices.damage,e.damageActivity,e.damageActivityId,{none:true})}<select name="damageMode"><option value="native" ${!custom?'selected':''}>Use spell damage and cast-level scaling</option><option value="custom" ${custom?'selected':''}>Custom damage</option></select><label data-custom-damage ${!custom?'hidden':''}>Custom formula <input name="damageFormula" value="${escape(e.damageFormula)}" placeholder="Example: 3d6"></label>`)}
  ${section('Saving throw','save',dropdown('saveActivity',choices.save,e.saveActivity,e.saveActivityId,{none:true})+`<label>Save eligibility <select name="saveCondition"><option value="always" ${e.saveCondition!=="gmNoLineOfSight"?'selected':''}>Every matching turn</option><option value="gmNoLineOfSight" ${e.saveCondition==="gmNoLineOfSight"?'selected':''}>GM confirms no line of sight to caster</option></select></label>`)}
  ${section('Targeting area lifetime','area',`<select name="targetingRegionCleanup"><option value="native" ${e.targetingRegionCleanup!=="casterTurnEnd"?'selected':''}>Use spell duration</option><option value="casterTurnEnd" ${e.targetingRegionCleanup==="casterTurnEnd"?'selected':''}>Remove targeting area at caster turn end</option></select>`)}
  ${section('On a successful save','cleanup',`<label><input name="endOnSuccess" type="checkbox" ${e.endOnSuccess?'checked':''}> Remove the applied effect</label>`)}
  <p data-preview style="padding:10px;border-left:3px solid var(--color-border-highlight)"></p><footer style="display:flex;gap:8px"><button type="button" data-reset>${TRIGGER_DEFAULTS[this.entryKey]?"Reset to Default":"Discard Changes"}</button><button type="button" data-save>Save</button></footer></div>`;
 }
 _replaceHTML(result,content){content.style.overflowY="auto";content.style.minHeight="0";content.innerHTML=result;}
 readDraft(){
  const entry={...this.draft};
  if(entry.sourceKind==="recurringHealing")return this.draft={...entry,enabled:this.element.querySelector('[name="enabled"]').checked,event:this.element.querySelector('[name="event"]').value,healingSource:this.element.querySelector('[name="healingSource"]').value,healingAmount:Number(this.element.querySelector('[name="healingAmount"]').value)};
  if(entry.sourceKind==="infernalWound")return this.draft={...entry,enabled:this.element.querySelector('[name="enabled"]').checked};
  if(entry.sourceKind==="monsterDamage")return this.draft={...entry,enabled:this.element.querySelector('[name="enabled"]').checked};
  if(entry.sourceKind==="monsterEscape")return this.draft={...entry,enabled:this.element.querySelector('[name="enabled"]').checked,event:this.element.querySelector('[name="event"]').value,escapeDisadvantage:this.element.querySelector('[name="escapeDisadvantage"]').checked};
  if(entry.sourceKind==="athleticsEscape")return this.draft={...entry,enabled:this.element.querySelector('[name="enabled"]').checked,event:this.element.querySelector('[name="event"]').value};
  if(entry.sourceKind==="blink")return this.draft={...entry,enabled:this.element.querySelector('[name="enabled"]').checked};
  for(const key of ["enabled","effectName","event","onDamage","damageSaveAdvantage","promptMode","damageActivity","saveActivity","saveCondition","targetingRegionCleanup","endOnSuccess"]){const input=this.element.querySelector('[name="'+key+'"]');entry[key]=input.type==="checkbox"?input.checked:input.value;}
  for(const [name,key]of [["effectName","effectId"],["damageActivity","damageActivityId"],["saveActivity","saveActivityId"]])entry[key]=this.element.querySelector('[name="'+name+'"]').selectedOptions[0]?.dataset.id??"";
  entry.damageFormula=this.element.querySelector('[name="damageMode"]').value==="custom"?this.element.querySelector('[name="damageFormula"]').value.trim():"";
  return this.draft=entry;
 }
 updatePreview(){if(["blink","athleticsEscape","monsterEscape","monsterDamage","infernalWound","recurringHealing"].includes(this.draft?.sourceKind))return;const e=this.readDraft();if(e.saveFirst){this.element.querySelector('[data-custom-damage]').hidden=this.element.querySelector('[name="damageMode"]').value!=="custom";this.element.querySelector('[data-preview]').textContent="At turn end, request the save. After the dice finish, failure prompts damage; success removes this target's effect.";return;}this.element.querySelector('[data-custom-damage]').hidden=this.element.querySelector('[name="damageMode"]').value!=="custom";this.element.querySelector('[data-preview]').textContent=(e.event==='damage'?'When the creature takes damage':('At the affected creature’s '+(e.event==='turnEnd'?'turn end':'turn start')))+(e.onDamage?' and when it takes damage':'')+', '+(e.saveFirst?'request the saving throw first, then prompt damage only on failure. ' : e.damageActivity?'roll '+(e.damageFormula?'custom damage ('+e.damageFormula+')':'the spell’s damage at its original cast level')+(e.saveActivity?', then ':'. '):'')+(e.saveActivity?(e.saveCondition==='gmNoLineOfSight'?'ask the GM whether the creature has lost line of sight to the caster; if so, request its saving throw. ':(e.promptMode==='manual'?'show a save card for the GM to choose whether to roll. ':'request its saving throw. ')):'')+(e.saveActivity&&e.endOnSuccess?'Remove '+e.effectName+' on success.':'');}
 async loadDroppedSpell(item){
  validateSourceSpell(item);
  const choices=entrySourceOptions(item,this.draft);if((!choices.damage.length&&!choices.save.length)||!choices.effects.length)throw Error("Choose a spell with an applied effect and a damage or save activity.");
  const e={...this.draft,sourceSpellUuid:item.uuid,sourceIdentifier:item.identifier??item.system?.identifier};
  for(const [list,name,id]of [[choices.effects,'effectName','effectId'],[choices.damage,'damageActivity','damageActivityId'],[choices.save,'saveActivity','saveActivityId']]){const match=list.find(option=>option.name===e[name])??list[0];e[name]=match?.name??"";e[id]=match?.id??"";}
  this.source=item;this.draft=e;await this.render({force:true});
 }
 _onRender(context,options){
  super._onRender(context,options);this.updatePreview();
  for(const input of this.element.querySelectorAll('input,select'))input.addEventListener('change',()=>this.updatePreview());
  for(const button of this.element.querySelectorAll('[data-info]'))button.addEventListener('click',()=>{const [title,text]=HELP[button.dataset.info];foundry.applications.api.DialogV2.wait({window:{title},content:'<p>'+escape(text)+'</p>',rejectClose:false,buttons:[{action:'close',label:'Close',default:true}]});});
  this.element.querySelector('[data-choose-source]')?.addEventListener('click',()=>{this.readDraft();new TriggerSourceApp(item=>this.loadDroppedSpell(item)).render({force:true});});
  this.element.querySelector('[data-save]').addEventListener('click',async()=>{if(this.busy)return;this.busy=true;try{const draft=this.readDraft();if(this.element.querySelector('[name="damageMode"]')?.value==="custom"&&!draft.damageFormula)throw Error("Enter a custom damage formula, or choose Use spell damage.");await saveTriggerEntry(this.entryKey,draft);this.onChange?.();await this.close();}catch(error){ui.notifications.error(error.message);}finally{this.busy=false;}});
  this.element.querySelector('[data-reset]').addEventListener('click',async()=>{if(this.busy)return;this.busy=true;try{const overrides=foundry.utils.deepClone(game.settings.get(ID,"triggerLibraryOverrides")??{});if(TRIGGER_DEFAULTS[this.entryKey]){delete overrides[this.entryKey];await game.settings.set(ID,"triggerLibraryOverrides",overrides);}else if(!triggerEntry(this.entryKey)){await this.close();return;}this.draft=null;this.source=null;this.onChange?.();await this.render({force:true});}catch(error){ui.notifications.error(error.message);}finally{this.busy=false;}});
 }
 async close(options){this.draft=null;this.source=null;return super.close(options);}
}
Hooks.once("init",()=>{game.settings.register(ID,"triggerLibraryCustoms",{scope:"world",config:false,type:Object,default:{}});game.settings.register(ID,"triggerLibraryOverrides",{scope:"world",config:false,type:Object,default:{}});game.settings.registerMenu(ID,"triggerLibrary",{name:"Trigger Automation Library",label:"Creature Effect Triggers",hint:"Configure recurring triggers without replacing native book effects or Region settings.",icon:"fa-solid fa-clock",type:TriggerLibraryApp,restricted:true});});
let shortcutLibrary;
Hooks.on("renderCompendiumDirectory",(app,html)=>{
 if(!game.user.isGM)return;
 const root=html instanceof HTMLElement?html:html?.[0];
 if(!root||root.querySelector(".rsa-open-trigger-library"))return;
 const region=root.querySelector(".rsa-open-spell-manager"),browser=root.querySelector(".open-compendium-browser"),actions=root.querySelector(".header-actions");
 if(!region&&!browser&&!actions)return;
 const button=document.createElement("button");button.type="button";button.className="rsa-open-trigger-library";button.style.cssText="flex:0 0 100%;width:100%;";
 button.innerHTML='<i class="fa-solid fa-clock" aria-hidden="true"></i> Open Trigger Automation Library';
 button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();if(!game.user.isGM)return;shortcutLibrary??=new TriggerLibraryApp();shortcutLibrary.render({force:true});shortcutLibrary.bringToFront?.();});
 if(region)region.insertAdjacentElement("afterend",button);else if(browser)browser.insertAdjacentElement("afterend",button);else actions.append(button);
});
export function validateSourceSpell(item){
 if(item?.documentName!=="Item"||item.type!=="spell")throw Error("Please choose a spell from a sheet or compendium.");
 const choices=entrySourceOptions(item);const healingRecipe=Object.values(HEALING_DEFAULTS).find(entry=>entry.sourceIdentifier===(item.identifier??item.system?.identifier));if((!choices.damage.length&&!choices.save.length&&!healingRecipe)||!choices.effects.length)throw Error("Choose a spell with an applied effect and a damage or save activity.");return item;
}
export function newTriggerFromSpell(item){
 validateSourceSpell(item);const choices=entrySourceOptions(item);
 const recipe=Object.values(TRIGGER_DEFAULTS).find(entry=>entry.sourceSpellUuid===item.uuid||entry.name===item.name||entry.sourceIdentifier===(item.identifier??item.system?.identifier));
 if(recipe?.sourceKind==="recurringHealing")return {...recipe,sourceSpellUuid:item.uuid,effectId:choices.effects.find(effect=>effect.name===recipe.effectName)?.id??recipe.effectId};
 return {name:item.name,enabled:true,attachment:"creature",effectName:choices.effects[0].name,effectId:choices.effects[0].id,event:recipe?.event??"turnStart",saveCondition:recipe?.saveCondition??"always",targetingRegionCleanup:recipe?.targetingRegionCleanup??"native",damageActivity:choices.damage[0]?.name??"",damageActivityId:choices.damage[0]?.id??"",saveActivity:choices.save[0]?.name??"",saveActivityId:choices.save[0]?.id??"",damageFormula:"",sourceSpellUuid:item.uuid,sourceIdentifier:item.identifier??item.system?.identifier,endOnSuccess:recipe?.endOnSuccess??!!choices.save.length,...(recipe?{...(recipe.manualResolution?{manualResolution:true,singleSave:recipe.singleSave,manualSaveLabel:recipe.manualSaveLabel,manualSaveNote:recipe.manualSaveNote}:{}),...(recipe.saveFirst?{saveFirst:true,damageFromSave:recipe.damageFromSave}:{}),...(recipe.oneShot?{oneShot:true,initialOutcome:recipe.initialOutcome}:{}),...(recipe.sourceKind==="syntheticSave"?{sourceKind:recipe.sourceKind,saveAbility:recipe.saveAbility}:{}),...(recipe.escapeCheck?{sourceKind:recipe.sourceKind,escapeCheck:true,checkAbility:recipe.checkAbility,checkSkill:recipe.checkSkill,exitRegionEnds:recipe.exitRegionEnds,endConcentrationOnEscape:recipe.endConcentrationOnEscape}:{}),promptMode:recipe.promptMode??"automatic",onDamage:recipe.onDamage??false,damageSaveAdvantage:recipe.damageSaveAdvantage??false,effectName:recipe.effectName,effectId:choices.effects.find(e=>e.name===recipe.effectName)?.id??recipe.effectId,damageActivity:recipe.damageActivity,damageActivityId:recipe.damageActivity?choices.damage.find(a=>a.name===recipe.damageActivity)?.id??recipe.damageActivityId:undefined,saveActivity:recipe.saveActivity,saveActivityId:choices.save.find(a=>a.name===recipe.saveActivity||a.id===recipe.saveActivityId)?.id??recipe.saveActivityId}: {})};
}
export class TriggerSourceApp extends foundry.applications.api.ApplicationV2{
 static DEFAULT_OPTIONS={window:{title:"Choose Trigger Source",resizable:true},position:{width:570,height:350}};
 constructor(onChoose){super({id:"rsa-trigger-source-"+foundry.utils.randomID()});this.onChoose=onChoose;}
 async _renderHTML(){return `<div style="padding:16px;display:grid;gap:14px;overflow-y:auto"><p>Choose the spell whose effect needs recurring automation. Its existing effects and stats will be preserved.</p><div data-source-drop style="border:2px dashed var(--color-border-light-primary);border-radius:6px;padding:24px;text-align:center"><i class="fa-solid fa-book-open" aria-hidden="true"></i> Drop a spell from a sheet or compendium</div><label>Or paste the spell’s UUID <input name="sourceUuid" type="text" placeholder="Compendium.… or Actor.…Item.…"></label><footer style="display:flex;gap:8px"><button type="button" data-load-source>Load Spell</button><button type="button" data-cancel-source>Cancel</button></footer></div>`;}
 _replaceHTML(result,content){content.style.display="block";content.style.minHeight="0";content.style.overflowY="auto";content.style.scrollbarGutter="stable";content.innerHTML=result;}
 async chooseUuid(uuid){if(this.busy)return;this.busy=true;try{if(!uuid?.trim())throw Error("Drop a spell or enter its UUID.");const item=validateSourceSpell(await fromUuid(uuid.trim()));await this.onChoose(item);await this.close();}catch(error){ui.notifications.error(error.message);}finally{this.busy=false;}}
 _onRender(context,options){super._onRender(context,options);const drop=this.element.querySelector('[data-source-drop]');drop.addEventListener('dragover',event=>event.preventDefault());drop.addEventListener('drop',event=>{event.preventDefault();event.stopPropagation();const data=foundry.applications.ux.TextEditor.getDragEventData(event);this.chooseUuid(data?.uuid);});this.element.querySelector('[data-load-source]').addEventListener('click',()=>this.chooseUuid(this.element.querySelector('[name="sourceUuid"]').value));this.element.querySelector('[data-cancel-source]').addEventListener('click',()=>this.close());this.element.querySelector('[name="sourceUuid"]').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();this.chooseUuid(event.currentTarget.value);}});}
}
