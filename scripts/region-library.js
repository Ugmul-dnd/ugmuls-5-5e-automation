// Portable recipes migrated from the current saved setup; no world document references.
export const REGION_DEFAULTS=deepFreeze({
"Heat Aura":{"enabled":true,"monsterAura":true,"sourceUuid":"Compendium.dnd-monster-manual.actors.Actor.mmRemorhaz000000.Item.mmHeatAura000000","hideRegionFromPlayers":true,"auraActivityId":"LDcQJj3oXyPCuCaT","triggers":[],"regionEffects":[]},
"Flame Aura":{"enabled":true,"monsterAura":true,"sourceUuid":"Compendium.dnd-monster-manual.actors.Actor.mmBrazenGorgon00.Item.mmFlameAura00000","hideRegionFromPlayers":true,"auraActivityId":"f4cPafTT2VXHbpr7","triggers":[],"regionEffects":[]},
"Fire Aura":{"enabled":true,"monsterAura":true,"sourceUuid":"Compendium.dnd-monster-manual.actors.Actor.mmAzerPyromancer.Item.mmFireAura000000","hideRegionFromPlayers":true,"auraActivityId":"15VgJKVXwYBOFSqJ","triggers":[],"regionEffects":[]},
"Aura of Life": {"enabled":true,"placementOnly":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplAuraofLife","hideRegionFromPlayers":false,"regionEffectTargeting":"friendliesOnly","triggers":[],"regionEffects":[{"id":"auraLifeResist1","name":"Necrotic Resistance","effectName":"Aura of Life"}]},
"Jallarzi's Storm of Radiance": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplJallarzisS","hideRegionFromPlayers":false,"triggers":[{"id":"jallarziStorm01","name":"Entry and end-turn storm save","activity":"Save","activityId":"dnd5eactivity000","preserveCastScaling":true,"events":["tokenEnter","tokenTurnEnd"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[{"id":"stormSenses0001","name":"Senses Overwhelmed","effectName":"Senses Overwhelmed"}]},
"Yolande's Regal Presence": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplYolandesRe","hideRegionFromPlayers":false,"triggers":[{"id":"regalPresence01","name":"Entry emanation save","activity":"Emanation Save","activityId":"dzeoGwKOPG7PHbyE","events":["tokenEnter"],"targeting":"hostilesOnly","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},
"Guarded Area": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.actors.Actor.phbsplGuardianof.Item.phbaoiLevel4Conj","hideRegionFromPlayers":false,"starterSource":"Guardian of Faith summoned guardian: native Guarded Area save and damage pool.","triggers":[{"id":"guardianFaith01","name":"Entry and start-turn guardian save","activity":"Save","activityId":"dnd5eactivity000","events":["tokenEnter","tokenTurnStart"],"targeting":"hostilesOnly","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},
"Flaming Sphere": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplFlamingSph","hideRegionFromPlayers":false,"triggers":[{"id":"flamingSphere01","name":"End-turn sphere save","activity":"Save","activityId":"dnd5eactivity100","preserveCastScaling":true,"events":["tokenTurnEnd"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},
"Sleet Storm": {"enabled":true,"placementOnly":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplSleetStorm","hideRegionFromPlayers":false,"triggers":[{"id":"sleetStormSave1","name":"Entry and start-turn save","activity":"Save","activityId":"dnd5eactivity000","events":["tokenEnter","tokenTurnStart"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},
"Stinking Cloud": {"enabled":true,"placementOnly":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplStinkingCl","hideRegionFromPlayers":false,"triggers":[{"id":"stinkingSave001","name":"Start-turn poison save","activity":"Cast and Save","activityId":"dnd5eactivity000","events":["tokenTurnStart"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},
"Conjure Woodland Beings": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplConjureWoo","hideRegionFromPlayers":false,"targetSelfEmanation":true,"triggers":[{"id":"woodlandSave001","name":"Entry and end-turn emanation save","activity":"Emanation Save","activityId":"UkXLSgFbCBI9CHMf","initialActivityIds":["dnd5eactivity000"],"preserveCastScaling":true,"events":["tokenEnter","tokenTurnEnd"],"targeting":"hostilesOnly","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},

"Wall of Thorns": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplWallofThor","hideRegionFromPlayers":false,"triggers":[{"id":"wallThornsSave1","name":"Entry and end-turn traversal save","activity":"Traversal Save","activityId":"dMiM7Qec4keU3w7B","initialActivityIds":["Az2cq7SukeQquptz","cgge2ISpX3u70Dof"],"shareInitialCard":false,"preserveCastScaling":true,"events":["tokenEnter","tokenTurnEnd"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},

"Wall of Fire": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplWallofFire","hideRegionFromPlayers":false,"triggers":[{"id":"wallFireDamage1","name":"Entry and end-turn damage (table ruling)","activity":"Create Wall","activityId":"dnd5eactivity000","useRegionActivity":true,"damageOnly":true,"shareInitialCard":false,"events":["tokenEnter","tokenTurnEnd"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},

"Cloud of Daggers": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplCloudofDag","hideRegionFromPlayers":false,"triggers":[{"id":"cloudDaggers0001","name":"Entry and end-turn damage","activity":"Damage","activityId":"dnd5eactivity000","events":["tokenEnter","tokenTurnEnd"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},
"Cloudkill": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplCloudkill0","hideRegionFromPlayers":false,"triggers":[{"id":"cloudkillSave01","name":"Entry and end-turn save","activity":"Cast and Save","activityId":"dnd5eactivity000","events":["tokenEnter","tokenTurnEnd"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},
"Insect Plague": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplInsectPlag","hideRegionFromPlayers":false,"triggers":[{"id":"insectPlague001","name":"Entry and end-turn save","activity":"Save","activityId":"dnd5eactivity000","events":["tokenEnter","tokenTurnEnd"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},
"Incendiary Cloud": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplIncendiary","hideRegionFromPlayers":false,"triggers":[{"id":"incendiarySave1","name":"Entry and end-turn save","activity":"Cast and Save","activityId":"Hhw0octbLetO5Nsi","events":["tokenEnter","tokenTurnEnd"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},
"Blade Barrier": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplBladeBarri","hideRegionFromPlayers":false,"triggers":[{"id":"bladeBarrier001","name":"Entry and end-turn save","activity":"Blade Wall","activityId":"Y0nT1EvDbg7IDovC","useRegionActivity":true,"events":["tokenEnter","tokenTurnEnd"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},

"Web": {"enabled":true,"placementOnly":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplWeb0000000","hideRegionFromPlayers":false,"triggers":[{"id":"webEntryStart001","name":"Entry and start-turn restraint save","activity":"Save","events":["tokenEnter","tokenTurnStart"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},
"Evard's Black Tentacles": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplEvardsBlac","hideRegionFromPlayers":false,"triggers":[{"id":"evardEntryEnd001","name":"Entry and end-turn damage / restraint","activity":"Save","events":["tokenEnter","tokenTurnEnd"],"targeting":"everyone","oncePerTurn":true,"shareCardPerTurn":true}],"regionEffects":[]},
"Entangle": {"enabled":true,"sourceUuid":"Compendium.dnd-players-handbook.spells.Item.phbsplEntangle00","hideRegionFromPlayers":false,"triggers":[],"regionEffects":[]},
  "Hunger of Hadar": {
    "sourceUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplHungerofHa",
    "enabled": true,
    "hideRegionFromPlayers": false,
    "starterSource": "Based on Ugmul's Foundry Player's Handbook spell setup. Review against your installed spell version.",
    "triggers": [
      {
        "name": "Start-turn damage",
        "activity": "Start of Turn Damage",
        "events": [
          "tokenTurnStart"
        ],
        "targeting": "everyone",
        "id": "XC26sN22QejOSwbz",
        "oncePerTurn": false,
        "shareCardPerTurn": false
      },
      {
        "name": "End-turn save",
        "activity": "End of Turn Save",
        "events": [
          "tokenTurnEnd"
        ],
        "targeting": "everyone",
        "id": "ignWlNd39DLKTIA7",
        "oncePerTurn": false,
        "shareCardPerTurn": false
      }
    ],
    "regionEffects": []
  },
  "Spirit Guardians": {
    "sourceUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplSpiritGuar",
    "enabled": true,
    "hideRegionFromPlayers": false,
    "starterSource": "Based on Ugmul's Foundry Player's Handbook spell setup. Review against your installed spell version.",
    "triggers": [
      {
        "name": "Entry and end-turn save",
        "activity": "Cast and Save",
        "events": [
          "tokenEnter",
          "tokenTurnEnd"
        ],
        "targeting": "hostilesOnly",
        "oncePerTurn": true,
        "shareCardPerTurn": true,
        "id": "YB9mYVP1YkHdROBe"
      }
    ],
    "regionEffects": [{"id":"sgHalfSpeed00001","name":"Half Speed","effectName":"Half Speed"}]
  },
  "Grease": {
    "sourceUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplGrease0000",
    "enabled": true,
    "hideRegionFromPlayers": false,
    "starterSource": "Based on Ugmul's Foundry Player's Handbook spell setup. Review against your installed spell version.",
    "triggers": [
      {
        "name": "Entry and end-turn save",
        "activity": "Save",
        "events": [
          "tokenEnter",
          "tokenTurnEnd"
        ],
        "targeting": "everyone",
        "id": "myDNYUYG8lsSIPo2",
        "oncePerTurn": false,
        "shareCardPerTurn": false
      }
    ],
    "regionEffects": []
  },
  "Fog Cloud": {
    "sourceUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplFogCloud00",
    "enabled": true,
    "hideRegionFromPlayers": false,
    "starterSource": "Based on Ugmul's Foundry Player's Handbook spell setup. Review against your installed spell version.",
    "triggers": [
      {
        "name": "Entry activity",
        "activity": "Use",
        "events": [
          "tokenEnter"
        ],
        "targeting": "everyone",
        "oncePerTurn": false,
        "id": "NQkSVkPYbJ4GRxoF",
        "shareCardPerTurn": false
      }
    ],
    "regionEffects": []
  },
  "Conjure Animals": {
    "sourceUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplConjureAni",
    "enabled": true,
    "hideRegionFromPlayers": false,
    "starterSource": "Based on Ugmul's Foundry Player's Handbook spell setup. Review against your installed spell version.",
    "triggers": [
      {
        "name": "Entry and end-turn save",
        "activity": "Save",
        "events": [
          "tokenEnter",
          "tokenTurnEnd"
        ],
        "targeting": "hostilesOnly",
        "oncePerTurn": true,
        "id": "HZ3qmYwsSatPGvMS",
        "shareCardPerTurn": false
      }
    ],
    "regionEffects": []
  },
  "Spike Growth": {
    "sourceUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplSpikeGrowt",
    "enabled": true,
    "hideRegionFromPlayers": false,
    "starterSource": "Based on Ugmul's Foundry Player's Handbook spell setup. Review against your installed spell version.",
    "triggers": [
      {
        "id": "SI7y1baW4F8AIV46",
        "name": "Movement damage",
        "activity": "Damage",
        "events": [
          "tokenMoveIn",
          "tokenMoveWithin",
          "tokenMoveOut",
          "tokenMoveWithin"
        ],
        "targeting": "everyone",
        "oncePerTurn": true,
        "shareCardPerTurn": false,
        "movementDamage": true,
        "movementIncrement": 5
      }
    ],
    "regionEffects": []
  },
  "Moonbeam": {
    "sourceUuid": "Compendium.dnd-players-handbook.spells.Item.phbsplMoonbeam00",
    "enabled": true,
    "hideRegionFromPlayers": false,
    "starterSource": "Based on Ugmul's Foundry Player's Handbook spell setup. Review against your installed spell version.",
    "triggers": [
      {
        "name": "Entry and end-turn save",
        "activity": "Save",
        "events": [
          "tokenEnter",
          "tokenTurnEnd"
        ],
        "targeting": "everyone",
        "oncePerTurn": true,
        "shareCardPerTurn": true,
        "id": "rk95OLtsa46fTPOg"
      }
    ],
    "regionEffects": []
  }
});

// Resolve new portable recipes by stable native activity ID; legacy/name-only overrides still work.
export function resolveRegionTriggerActivity(trigger,spell,region=null){
 const activities=Array.from(spell?.system?.activities??[]);
 if(trigger.useRegionActivity){
  const ref=region?.flags?.dnd5e?.activity,id=typeof ref==="string"?ref.split(".").at(-1):ref?.id;
  const original=id&&activities.find(activity=>activity.id===id);if(original)return original;
 }
 return (trigger.activityId?activities.find(activity=>activity.id===trigger.activityId):undefined)??activities.find(activity=>activity.name===trigger.activity);
}
export function buildRegionDamageSpellData(activity){
 if(!activity?.damage?.parts?.length)throw Error("The configured Region activity has no damage to roll.");
 const data=activity.item.toObject(),id=activity.id,selected=data.system.activities[id];
 data._id=foundry.utils.randomID();data.effects=[];data.system.activities={[id]:selected};
 selected.type="damage";delete selected.save;delete selected.damage.onSave;selected.damage.critical={allow:false};selected.effects=[];
 selected.activation={type:"special",override:true};selected.duration={units:"inst",concentration:false,override:true};
 selected.target={override:true,prompt:false,affects:{type:"creature",count:"1",choice:false},template:{type:""}};
 selected.range={override:true,units:"any"};selected.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};
 const quiet={version:5,isEnabled:false,isCustomized:false,killAnim:true};data.flags??={};data.flags.autoanimations=quiet;selected.flags??={};selected.flags.autoanimations=quiet;
 return data;
}
const ID="ugmuls-5-5e-automation";
let cache,cacheInputs;let saving=Promise.resolve();
const clone=value=>structuredClone(value);
function object(value){return value!==null&&typeof value==="object"&&!Array.isArray(value);}
function deepFreeze(value){if(object(value)||Array.isArray(value)){for(const child of Object.values(value))deepFreeze(child);Object.freeze(value);}return value;}
function merge(base,patch){const result=clone(base??{});for(const [key,value]of Object.entries(patch??{})){if(["__proto__","constructor","prototype"].includes(key))continue;result[key]=object(value)&&object(result[key])?merge(result[key],value):clone(value);}return result;}
function same(a,b){if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((v,i)=>same(v,b[i]));if(object(a)&&object(b))return Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));return a===b;}
export function regionDifference(base,value){const patch={};for(const [key,child]of Object.entries(value??{})){if(["__proto__","constructor","prototype"].includes(key)||same(base?.[key],child))continue;patch[key]=object(child)&&object(base?.[key])?regionDifference(base[key],child):clone(child);}return patch;}
export function composeRegionTable(overrides={},customs={},legacy=null){
 const result={};for(const [name,recipe]of Object.entries(REGION_DEFAULTS))result[name]=merge(recipe,overrides[name]);
 for(const [name,recipe]of Object.entries(customs??{}))if(!Object.hasOwn(REGION_DEFAULTS,name))Object.defineProperty(result,name,{value:clone(recipe),enumerable:true,writable:true,configurable:true});
 if(legacy)for(const [name,recipe]of Object.entries(legacy))Object.defineProperty(result,name,{value:clone(recipe),enumerable:true,writable:true,configurable:true});
 return result;
}
export function splitRegionTable(table){const overrides={},customs={};for(const [name,entry]of Object.entries(table??{})){
 if(Object.hasOwn(REGION_DEFAULTS,name)){const patch=regionDifference(REGION_DEFAULTS[name],entry);if(Object.keys(patch).length)overrides[name]=patch;}
 else Object.defineProperty(customs,name,{value:clone(entry),enumerable:true,writable:true,configurable:true});
 }return {overrides,customs};}
export function getRegionSpellTable(){
 const version=game.settings.get(ID,"regionLibraryVersion"),overrides=game.settings.get(ID,"regionLibraryOverrides")??{},customs=game.settings.get(ID,"regionLibraryCustoms")??{},legacy=version>=1?null:game.settings.get(ID,"spellTable")??{};
 const inputs=[version,overrides,customs,legacy];if(cacheInputs?.every((value,index)=>value===inputs[index]))return cache;
 cacheInputs=inputs;return cache=deepFreeze(composeRegionTable(overrides,customs,legacy));
}
// Region-assigned effects are continuous area effects, never card outcomes.
// Match within this spell's configuration; copied book effects can have new UUIDs.
export function regionManagesCardEffect(activity,effect){
 const item=activity?.item;if(!item||!effect)return false;
 const config=getRegionSpellTable()[item.name];if(!config||config.enabled===false)return false;
 const sources=[effect.uuid,effect._stats?.duplicateSource,effect._stats?.compendiumSource].filter(Boolean);
 const name=String(effect.name??"").trim().toLocaleLowerCase();
 return (config.regionEffects??[]).some(entry=>{
  if(entry.enabled===false)return false;
  if(entry.effectUuid&&sources.some(source=>source===entry.effectUuid||source.split(".ActiveEffect.").at(-1)===entry.effectUuid.split(".ActiveEffect.").at(-1)))return true;
  const expected=entry.effectName??entry.name;
  return !!name&&!!expected&&String(expected).trim().toLocaleLowerCase()===name;
 });
}
export function regionEntryStatus(name){if(!Object.hasOwn(REGION_DEFAULTS,name))return "Custom entry";return Object.keys(game.settings.get(ID,"regionLibraryOverrides")?.[name]??{}).length?"Customized":"Module default";}
let migration;
export function migrateRegionLibrary(){return migration??=runMigration().finally(()=>{migration=null;});}
async function runMigration(){
 if(!game.user.isGM||game.settings.get(ID,"regionLibraryVersion")>=1)return;
 const legacy=clone(game.settings.get(ID,"spellTable")??{}),existing=game.settings.get(ID,"regionLibraryLegacyBackup");
 if(!existing?.savedAt)await game.settings.set(ID,"regionLibraryLegacyBackup",{savedAt:new Date().toISOString(),table:legacy});
 const current=composeRegionTable(game.settings.get(ID,"regionLibraryOverrides")??{},game.settings.get(ID,"regionLibraryCustoms")??{},legacy);
 const {overrides,customs}=splitRegionTable(current);
 await game.settings.set(ID,"regionLibraryOverrides",overrides);await game.settings.set(ID,"regionLibraryCustoms",customs);
 // Mark complete last. Failed/partial migrations still read the original table.
 await game.settings.set(ID,"regionLibraryVersion",1);cacheInputs=null;
}
function serialize(task){const next=saving.catch(()=>{}).then(task);saving=next;return next;}
export function saveRegionSpellTable(table){const snapshot=clone(table);return serialize(async()=>{
 if(!game.user.isGM)throw Error("Only a GM can edit Region recipes.");
 await migrateRegionLibrary();
 // Missing built-ins are disabled, never removed from the shared module library.
 const current=getRegionSpellTable();for(const name of Object.keys(REGION_DEFAULTS))if(!Object.hasOwn(snapshot,name))snapshot[name]={...clone(current[name]),enabled:false};
 const {overrides,customs}=splitRegionTable(snapshot);
 await game.settings.set(ID,"regionLibraryOverrides",overrides);await game.settings.set(ID,"regionLibraryCustoms",customs);cacheInputs=null;
});}
export function resetRegionSpell(name){return serialize(async()=>{if(!game.user.isGM||!Object.hasOwn(REGION_DEFAULTS,name))return;await migrateRegionLibrary();const overrides=clone(game.settings.get(ID,"regionLibraryOverrides")??{});delete overrides[name];await game.settings.set(ID,"regionLibraryOverrides",overrides);cacheInputs=null;});}
Hooks.once("init",()=>{
 for(const [key,type,value]of [["regionLibraryOverrides",Object,{}],["regionLibraryCustoms",Object,{}],["regionLibraryLegacyBackup",Object,{}],["regionLibraryVersion",Number,0]])game.settings.register(ID,key,{scope:"world",config:false,type,default:value,onChange:()=>{cacheInputs=null;}});
});
Hooks.once("ready",()=>{if(game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id))migrateRegionLibrary().catch(error=>{console.error("Region library migration",error);ui.notifications.error("Region library migration did not finish. Your original spell table is preserved; reload to retry.");});});

// Preserve the book effect and its condition; only correct applied-copy expiry.
function isStinkingCloudEffect(effect) {
 if(effect.parent?.documentName!=="Actor"||getRegionSpellTable()["Stinking Cloud"]?.enabled===false)return;
 const refs=[effect.system?.origin?.activity,effect.system?.origin?.item,effect._stats?.duplicateSource,effect.origin].filter(Boolean);
 const nativeEffect="gFid0DG5HydORpr3";
 const sourced=refs.some(ref=>{
  const source=globalThis.fromUuidSync?.(ref,{strict:false});
  const spell=source?.item??(source?.type==="spell"?source:source?.parent);
  return (spell?.identifier??spell?.system?.identifier)==="stinking-cloud" &&
   (source?.id===nativeEffect||effect._stats?.duplicateSource?.endsWith(".ActiveEffect."+nativeEffect)||effect.name==="Stinking Poison");
 });
 return sourced;
}
export function prepareStinkingCloudEffect(effect) {
 if(!isStinkingCloudEffect(effect))return;
 effect.updateSource({"duration.value":null,"duration.expiry":"targetEnd","duration.expired":false});
}
export async function endStinkingCloudTurn(combat,changes) {
 if(!game.user?.isGM||(game.users?.activeGM&&game.users.activeGM.id!==game.user.id)||
  !(Object.hasOwn(changes,"turn")||Object.hasOwn(changes,"round"))||combat.started===false)return;
 const previous=combat.previous;
 if(!previous?.combatantId||(previous.round===combat.round&&previous.turn===combat.turn))return;
 // Native targetEnd skips the application turn. This spell explicitly ends on
 // that same turn; inspect only the outgoing combatant, never every world actor.
 const actor=combat.combatants.get(previous.combatantId)?.actor;
 for(const effect of Array.from(actor?.effects??[])){
  if(effect.duration?.expiry==="targetEnd"&&isStinkingCloudEffect(effect))await effect.delete();
 }
}
Hooks.once("ready",()=>{
 Hooks.on("preCreateActiveEffect",prepareStinkingCloudEffect);
 Hooks.on("updateCombat",(combat,changes)=>{endStinkingCloudTurn(combat,changes).catch(error=>console.error("Stinking Cloud turn-end cleanup",error));});
});
