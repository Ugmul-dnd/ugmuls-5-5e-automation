import {triggerEntry} from "./trigger-library.js";
import {createEventQueue} from "./shared-activity-card.js";
import {isRageEffect} from "./primal-knowledge.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const live=e=>e&&!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
const marked=e=>e.getFlag?.(ID,"mindlessRage")??e.flags?.[ID]?.mindlessRage;
export function mindlessConditions(actor){return values(actor.effects).filter(e=>!e.disabled&&!e.duration?.expired&&!e.system?.expired&&(e.system?.type==="charmed"||e.system?.type==="frightened"||values(e.statuses).some(s=>s==="charmed"||s==="frightened")));}
export async function clearMindlessConditions(actor,effects){
 const existing=new Set(values(actor.effects).map(e=>e.id)),remove=[];
 for(const effect of effects){if(!existing.has(effect.id))continue;
  const statuses=values(effect.statuses).filter(s=>s!=="charmed"&&s!=="frightened");
  if(!statuses.length||["charmed","frightened"].includes(effect.system?.type))remove.push(effect.id);
  else await effect.update({statuses});
 }
 if(remove.length)await actor.deleteEmbeddedDocuments("ActiveEffect",remove);
}
export function syncMindlessRage(actor,removed){return enqueue(async()=>{
 if(!actor||!authority()||game.settings.get(ID,"mindlessRageAutomation")!==true)return;
 const effects=values(actor.effects).filter(e=>e!==removed&&e.uuid!==removed?.uuid),managed=effects.filter(marked);
 const feature=values(actor.items).find(i=>i.type==="feat"&&key(i)==="mindless-rage"&&i.system?.source?.rules!=="2014"),native=values(feature?.effects).find(e=>e.id==="Y9LOXK6Q4vot2cxi"||e.name==="Mindless Rage");
 // The book effect transfers when manually enabled. Keep it as the template
 // and manage one temporary actor copy, so immunity cannot outlive Rage.
 if(native?.transfer&&!native.disabled)await native.update({disabled:true});
 const rage=effects.find(e=>live(e)&&isRageEffect(actor,e));
 if(!feature||!native||!rage){if(managed.length)await actor.deleteEmbeddedDocuments("ActiveEffect",managed.map(e=>e.id));return;}
 const sources=new Set([native.uuid,native._stats?.compendiumSource].filter(Boolean));
 const existing=managed[0]??effects.find(e=>e.name===native.name&&(e.system?.origin?.item===feature.uuid||e.origin===feature.uuid||[e._stats?.duplicateSource,e._stats?.compendiumSource].some(ref=>sources.has(ref))));
 const previous=existing&&marked(existing),entering=!existing||previous?.rage!==rage.uuid||!live(existing),conditions=entering?mindlessConditions(actor):[];
 const link={rage:rage.uuid,feature:feature.uuid};
 if(existing){if(entering||previous?.feature!==feature.uuid)await existing.update({disabled:false,"duration.expired":false,"flags.dnd5e.isTemporary":true,["flags."+ID+".mindlessRage"]:link});}
 else{
  const data=native.toObject();delete data._id;Object.assign(data,{disabled:false,transfer:false,origin:feature.uuid,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:null,units:"seconds",expiry:null,expired:false}});
  data.system={...data.system,origin:{...data.system?.origin,actor:actor.uuid,item:feature.uuid,effect:rage.uuid}};
  data.flags??={};data.flags[ID]={...data.flags[ID],mindlessRage:link};data.flags.dnd5e={...data.flags.dnd5e,isTemporary:true};
  await actor.createEmbeddedDocuments("ActiveEffect",[data]);
 }
 if(conditions.length)await clearMindlessConditions(actor,conditions);
 const duplicate=managed.filter(e=>e!==existing);if(duplicate.length)await actor.deleteEmbeddedDocuments("ActiveEffect",duplicate.map(e=>e.id));
});}
export function prepareIntimidatingEffect(effect){
 if(effect.parent?.documentName!=="Actor")return;
 const activity=effect.system?.origin?.activity?globalThis.fromUuidSync?.(effect.system.origin.activity,{strict:false}):null,source=effect._stats?.duplicateSource?globalThis.fromUuidSync?.(effect._stats.duplicateSource,{strict:false}):null,item=activity?.item??source?.parent;
 if(key(item)!=="intimidating-presence"||effect.name!=="Intimidated")return;
 const entry=triggerEntry("intimidating-presence");if(entry?.enabled===false)return;
 effect.updateSource({start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:60,units:"seconds",expiry:"turnStart",expired:false},"flags.dnd5e.isTemporary":true});
}
function report(error){console.error("Berserker effects",error);ui.notifications.error(error.message);}
function effectEvent(effect,removed){const actor=effect.parent?.documentName==="Actor"?effect.parent:null;if(actor&&isRageEffect(actor,effect))syncMindlessRage(actor,removed).catch(report);}
function allActors(){return new Map([...values(game.actors),...values(globalThis.canvas?.scene?.tokens).map(t=>t.actor)].filter(Boolean).map(a=>[a.uuid,a])).values();}
Hooks.once("init",()=>game.settings.register(ID,"mindlessRageAutomation",{name:"Mindless Rage with Rage",hint:"Apply native Charmed/Frightened immunity with Rage, end existing Charmed/Frightened conditions on entry, and remove the linked immunity when Rage ends. Manage a temporary copy while leaving the native transfer template disabled.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 for(const event of ["createActiveEffect","updateActiveEffect"])Hooks.on(event,e=>effectEvent(e));Hooks.on("deleteActiveEffect",e=>effectEvent(e,e));
 Hooks.on("preCreateActiveEffect",prepareIntimidatingEffect);
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,item=>{if(["rage","mindless-rage"].includes(key(item)))syncMindlessRage(item.actor).catch(report);});
 const synchronize=()=>{if(authority())for(const actor of allActors())if(values(actor.items).some(i=>key(i)==="mindless-rage")||values(actor.effects).some(marked))syncMindlessRage(actor).catch(report);};Hooks.on("canvasReady",synchronize);synchronize();
});
