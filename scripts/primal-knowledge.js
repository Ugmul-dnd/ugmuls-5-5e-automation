import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const live=e=>!!e&&!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired&&!e.system?.expired;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const marker=e=>e.getFlag?.(ID,"primalKnowledgeRage")??e.flags?.[ID]?.primalKnowledgeRage;
export function isRageEffect(actor,effect){
 const rage=values(actor?.items).find(item=>item.type==="feat"&&key(item)==="rage");if(!rage||!effect)return false;
 const refs=new Set(values(rage.effects).map(effect=>effect.uuid));
 const activity=effect.system?.origin?.activity?globalThis.fromUuidSync?.(effect.system.origin.activity,{strict:false}):null;
 return effect.system?.origin?.item===rage.uuid||activity?.item?.uuid===rage.uuid||refs.has(effect._stats?.duplicateSource)||refs.has(effect._stats?.compendiumSource)||/^(rage|raging)$/i.test(effect.name?.trim()??"");
}
export function primalKnowledgeContext(actor){
 const feature=values(actor?.items).find(item=>item.type==="feat"&&key(item)==="primal-knowledge"&&item.system?.source?.rules!=="2014");
 const native=values(feature?.effects).find(effect=>effect.id==="ufbJRsGGW3REMmJm"||effect.name==="Primal Knowledge");
 const rage=values(actor?.effects).find(effect=>live(effect)&&isRageEffect(actor,effect));
 return feature&&native&&rage?{feature,native,rage}:null;
}
function sourcedFrom(effect,feature,native){return effect.system?.origin?.item===feature.uuid||effect.origin===feature.uuid||[effect._stats?.duplicateSource,effect._stats?.compendiumSource].some(ref=>ref&&[native.uuid,native._stats?.compendiumSource].includes(ref));}
export function synchronizePrimalKnowledge(actor,removed){return enqueue(async()=>{
 if(!actor||!authority()||game.settings.get(ID,"primalKnowledgeAutomation")!==true)return;
 const effects=values(actor.effects).filter(effect=>effect!==removed&&effect.uuid!==removed?.uuid),context=primalKnowledgeContext({...actor,items:actor.items,effects});
 const managed=effects.filter(effect=>marker(effect));
 if(!context){if(managed.length)await actor.deleteEmbeddedDocuments("ActiveEffect",managed.map(e=>e.id));return;}
 const {feature,native,rage}=context;
 const existing=managed[0]??effects.find(effect=>effect.name===native.name&&sourcedFrom(effect,feature,native));
 const link={rage:rage.uuid,feature:feature.uuid};
 if(existing){
  const previous=marker(existing);
  if(previous?.rage!==link.rage||previous?.feature!==link.feature||!live(existing))await existing.update({disabled:false,"duration.expired":false,"flags.dnd5e.isTemporary":true,["flags."+ID+".primalKnowledgeRage"]:link});
 }else{
  const data=native.toObject();delete data._id;
  Object.assign(data,{disabled:false,transfer:false,origin:feature.uuid,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:null,units:"seconds",expiry:null,expired:false}});
  data.system={...data.system,origin:{...data.system?.origin,actor:actor.uuid,item:feature.uuid,effect:rage.uuid}};
  data.flags??={};data.flags[ID]={...data.flags[ID],primalKnowledgeRage:link};data.flags.dnd5e={...data.flags.dnd5e,isTemporary:true};
  await actor.createEmbeddedDocuments("ActiveEffect",[data]);
 }
 const duplicates=managed.filter(effect=>effect!==existing);if(duplicates.length)await actor.deleteEmbeddedDocuments("ActiveEffect",duplicates.map(e=>e.id));
});}
function report(error){console.error("Primal Knowledge Rage link",error);ui.notifications.error("Could not synchronize Primal Knowledge with Rage: "+error.message);}
function actors(){return new Map([...values(game.actors),...values(globalThis.canvas?.scene?.tokens).map(token=>token.actor)].filter(Boolean).map(actor=>[actor.uuid,actor])).values();}
function relevantEffect(effect,removed){const actor=effect.parent?.documentName==="Actor"?effect.parent:null;if(actor&&isRageEffect(actor,effect))synchronizePrimalKnowledge(actor,removed).catch(report);}
Hooks.once("init",()=>game.settings.register(ID,"primalKnowledgeAutomation",{name:"Primal Knowledge with Rage",hint:"Apply the owned native Primal Knowledge effect when Rage becomes active. Remove the linked copy when Rage is disabled, expires or is deleted. Preserve the book's skill formulas and avoid duplicate copies.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 for(const event of ["createActiveEffect","updateActiveEffect"])Hooks.on(event,effect=>relevantEffect(effect));
 Hooks.on("deleteActiveEffect",effect=>relevantEffect(effect,effect));
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,item=>{if(["rage","primal-knowledge"].includes(key(item)))synchronizePrimalKnowledge(item.actor).catch(report);});
 const sync=()=>{if(authority())for(const actor of actors())if(values(actor.items).some(item=>key(item)==="primal-knowledge")||values(actor.effects).some(marker))synchronizePrimalKnowledge(actor).catch(report);};
 Hooks.on("canvasReady",sync);sync();
});
