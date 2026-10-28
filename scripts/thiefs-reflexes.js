import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue();
const values=c=>Array.from(c?.values?.()??c??[]),link=c=>c?.getFlag?.(ID,"thiefsReflexes");
const authority=()=>game.user?.isGM&&game.users.activeGM?.id===game.user.id;
export const reflexesFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&(i.identifier??i.system?.identifier)==="thiefs-reflexes");
const enabled=()=>game.settings.get(ID,"thiefsReflexesAutomation")===true;
export function reflexesEntry(source){
 return {type:source.type??"base",actorId:source.actorId,tokenId:source.tokenId,sceneId:source.sceneId,name:source.name+" — Thief’s Reflexes",img:source.img,
 initiative:Number(source.initiative)-10,hidden:!!source.hidden,defeated:!!source.defeated,group:null,flags:{[ID]:{thiefsReflexes:{source:source.id}}}};
}
export function syncReflexes(combat){return enqueue(async()=>{
 if(!authority()||!combat?.combatants)return;
 const entries=values(combat.combatants),eligible=enabled()&&(!combat.started||combat.round===1),sources=eligible?entries.filter(c=>!link(c)&&c.actor&&c.tokenId&&Number.isFinite(c.initiative)&&reflexesFeature(c.actor)):[],wanted=new Map(sources.map(c=>[c.id,c]));
 const remove=[],updates=[],seen=new Set();
 for(const extra of entries.filter(link)){
  const source=wanted.get(link(extra).source);
  if(!source||seen.has(source.id)){remove.push(extra.id);continue;}
  seen.add(source.id);const desired=reflexesEntry(source),update={_id:extra.id};
  for(const key of ["actorId","tokenId","sceneId","name","img","initiative","hidden","defeated"])if(extra[key]!==desired[key])update[key]=desired[key];
  if(Object.keys(update).length>1)updates.push(update);
 }
 // Native Combatant operations preserve the active combatant and suppress turn
 // events when sorting changes. Do not fabricate next-turn updates here.
 if(remove.length)await combat.deleteEmbeddedDocuments("Combatant",remove,{turnEvents:false,rsaReflexes:true});
 if(updates.length)await combat.updateEmbeddedDocuments("Combatant",updates,{turnEvents:false,rsaReflexes:true});
 const create=sources.filter(c=>!seen.has(c.id)).map(reflexesEntry);
 if(create.length)await combat.createEmbeddedDocuments("Combatant",create,{turnEvents:false,rsaReflexes:true});
});}
export function installReflexesExit(Type=globalThis.CONFIG?.Combat?.documentClass){
 const prototype=Type?.prototype;if(!prototype?._onExit||prototype.rsaReflexesExit)return;
 const original=prototype._onExit;
 prototype._onExit=function(combatant){
  // 5e removes combat-bound effects when a combatant leaves. Removing this
  // additional turn is not the actor leaving combat while its source remains.
  if(link(combatant)&&values(this.combatants).some(c=>c.id!==combatant.id&&c.actor?.uuid===combatant.actor?.uuid&&c.tokenId===combatant.tokenId&&c.sceneId===combatant.sceneId))return;
  return original.call(this,combatant);
 };prototype.rsaReflexesExit=true;
}
function report(error){console.error("Thief’s Reflexes",error);ui.notifications.error("Thief’s Reflexes could not update the combat tracker: "+error.message);}
const sync=combat=>syncReflexes(combat).catch(report);
function featureChanged(item){if((item?.identifier??item?.system?.identifier)!=="thiefs-reflexes")return;for(const combat of values(game.combats))if(values(combat.combatants).some(c=>c.actor?.uuid===(item.actor??item.parent)?.uuid))sync(combat);}
Hooks.once("init",()=>game.settings.register(ID,"thiefsReflexesAutomation",{name:"Thief’s Reflexes Assistance",hint:"Add a second combat-tracker entry for the same token at Initiative minus 10 during round one. Remove it after round one; keep Initiative, visibility and defeated state linked to the original entry.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 installReflexesExit();
 for(const combat of values(game.combats))sync(combat);
 for(const event of ["createCombatant","updateCombatant","deleteCombatant"])Hooks.on(event,(combatant,changes,options)=>{
  // create/delete hooks pass operation options as their second argument.
  const operation=event==="updateCombatant"?options:changes;if(operation?.rsaReflexes||link(combatant))return;sync(combatant.parent);
 });
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,featureChanged);
 Hooks.on("updateCombat",(combat,changes)=>{if(!combat.started&&("round" in changes||"turn" in changes))sync(combat);});
 // This fires after native start/end-turn effects and region events have been
 // dispatched. Removing the outgoing extra before then loses its final turn.
 Hooks.on("combatTurnChange",combat=>sync(combat));
 Hooks.on("updateSetting",setting=>{if(setting.key===ID+".thiefsReflexesAutomation")for(const combat of values(game.combats))sync(combat);});
});
