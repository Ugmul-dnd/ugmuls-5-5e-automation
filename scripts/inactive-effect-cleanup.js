const ID="ugmuls-5-5e-automation",queues=new Map(),wrapped=new WeakSet();
const authority=()=>game.user?.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const flag=(effect,key)=>effect.getFlag?.(ID,key)??effect.flags?.[ID]?.[key];
const dndFlag=(effect,key)=>effect.getFlag?.("dnd5e",key)??effect.flags?.dnd5e?.[key];
export function inactiveEffect(effect){return effect?.disabled===true||effect?.active===false||effect?.duration?.expired===true||effect?.system?.expired===true;}
function temporary(effect){return effect.isTemporary===true||dndFlag(effect,"isTemporary")===true||Number(effect.duration?.value)>0||Number(effect.duration?.seconds)>0||Number(effect.duration?.rounds)>0||Number(effect.duration?.turns)>0;}
export function protectedFeatureEffect(effect,actor,sourceItem){
 if(effect.parent?.documentName==="Item"||effect.transfer===true||effect.type==="enchantment"||effect.isAppliedEnchantment)return true;
 const statuses=Array.from(effect.statuses??[]),changes=effect.system?.changes??effect.changes??[];
 const applied=flag(effect,"recurringEffect")||flag(effect,"monsterFearFrightened")||flag(effect,"monsterFearImmunity")||effect.type==="condition"||statuses.length>0;
 if(sourceItem?.type==="spell")return false;
 if(sourceItem&&["feat","class","subclass","race","background","equipment","weapon","tool","container","consumable"].includes(sourceItem.type)){
  const owner=sourceItem.actor??sourceItem.parent;
  if(owner?.uuid===actor.uuid)return true;
  if(!owner?.uuid&&!temporary(effect)&&!applied)return true;
 }
 // Retain persistent stat features even when an older import lost its source link.
 if(!sourceItem&&!temporary(effect)&&!applied&&(changes.length>0||dndFlag(effect,"isTemporary")===false))return true;
 return false;
}
async function sourceItemFor(effect){
 const refs=[flag(effect,"recurringEffect")?.spell,effect.system?.origin?.activity,effect.system?.origin?.item,effect.origin,effect._stats?.duplicateSource,effect._stats?.compendiumSource,dndFlag(effect,"item")?.uuid];
 for(const ref of new Set(refs.filter(ref=>typeof ref==="string"&&ref))){
  let document;try{document=await fromUuid(ref,{strict:false});}catch{continue;}
  if(document?.documentName==="Item")return document;
  if(document?.item?.documentName==="Item")return document.item;
  if(document?.parent?.documentName==="Item")return document.parent;
 }
 return null;
}
export async function inactiveCleanupCandidates(actor){
 const effects=Array.from(actor?.effects??[]).filter(inactiveEffect),resolved=await Promise.all(effects.map(async effect=>({effect,source:await sourceItemFor(effect)})));
 return resolved.filter(({effect,source})=>!protectedFeatureEffect(effect,actor,source)).map(({effect})=>effect);
}
export async function clearInactiveEffects(actor,{ids=null}={}){
 if(!actor?.isOwner)throw Error("You must own this actor to clear its effects.");
 const previous=queues.get(actor.uuid)??Promise.resolve(),task=previous.catch(()=>{}).then(async()=>{
  const allowed=ids?new Set(ids):null,candidates=await inactiveCleanupCandidates(actor);
  // Resolve again immediately before deletion; a preview or another cleanup can be stale.
  const current=new Map(Array.from(actor.effects??[]).map(effect=>[effect.id,effect]));
  const remove=candidates.filter(effect=>(!allowed||allowed.has(effect.id))&&current.get(effect.id)===effect&&inactiveEffect(effect)).map(effect=>effect.id);
  if(!remove.length)return 0;
  const deleted=await actor.deleteEmbeddedDocuments("ActiveEffect",remove);return deleted.length;
 });queues.set(actor.uuid,task);
 try{return await task;}finally{if(queues.get(actor.uuid)===task)queues.delete(actor.uuid);}
}
export async function promptClearInactiveEffects(actor){
 if(!actor?.isOwner)return;
 const candidates=await inactiveCleanupCandidates(actor);
 if(!candidates.length){ui.notifications.info("No inactive applied effects to clear. Class and item features are preserved.");return;}
 const escape=foundry.utils.escapeHTML,confirmed=await foundry.applications.api.DialogV2.wait({window:{title:"Clear inactive effects — "+actor.name},position:{width:440},rejectClose:false,content:'<p>Remove these inactive conditions and applied buffs? Class and item features are preserved.</p><ul style="max-height:300px;overflow-y:auto">'+candidates.map(effect=>'<li>'+escape(effect.name)+'</li>').join("")+'</ul>',buttons:[{action:"clear",label:"Remove "+candidates.length+" effects",callback:()=>true},{action:"cancel",label:"Cancel",callback:()=>false}]});
 if(confirmed!==true)return;
 const count=await clearInactiveEffects(actor,{ids:candidates.map(effect=>effect.id)});ui.notifications.info("Removed "+count+" inactive effect"+(count===1?".":"s."));
}
function sheetActor(app){const actor=app?.actor??app?.document??app?.object;return actor?.documentName==="Actor"&&actor.isOwner?actor:null;}
export function addInactiveEffectMenu(app,controls){
 const actor=sheetActor(app);if(!actor||controls.some(control=>control.action==="rsaClearInactiveEffects"))return;
 controls.push({action:"rsaClearInactiveEffects",label:"Clear inactive effects",icon:"fa-solid fa-broom",ownership:"OWNER",onClick:()=>promptClearInactiveEffects(actor).catch(report)});
}
export function addLegacyInactiveEffectMenu(app,buttons){
 const actor=sheetActor(app);if(!actor||buttons.some(button=>button.class==="rsa-clear-inactive-effects"))return;
 buttons.push({label:"Clear inactive effects",class:"rsa-clear-inactive-effects",icon:"fa-solid fa-broom",onclick:()=>promptClearInactiveEffects(actor).catch(report)});
}
export function installCombatEffectCleanup(Type=globalThis.CONFIG?.Combat?.documentClass){
 const prototype=Type?.prototype;if(!prototype||wrapped.has(prototype)||typeof prototype._onExit!=="function")return false;
 wrapped.add(prototype);const exit=prototype._onExit,completed=new WeakMap();
 prototype._onExit=async function(combatant,...args){
  const result=await exit.call(this,combatant,...args);
  // The system has finished its own expiry/dependency deletion before we inspect survivors.
  if(!authority()||game.settings.get(ID,"cleanupInactiveCombatEffects")===false||game.combats?.get(this.id)===this)return result;
  const actor=combatant?.actor;if(!actor?.isOwner)return result;
  let actors=completed.get(this);if(!actors)completed.set(this,actors=new Set());if(actors.has(actor.uuid))return result;actors.add(actor.uuid);
  try{await clearInactiveEffects(actor);}catch(error){report(error);}return result;
 };return true;
}
function report(error){console.error("Inactive effect cleanup",error);ui.notifications.error("Inactive effect cleanup could not finish: "+error.message);}
Hooks.once("init",()=>{game.settings.register(ID,"cleanupInactiveCombatEffects",{name:"Clear Inactive Effects after Combat",hint:"Remove inactive conditions and applied buffs from combat participants after combat ends. Preserve class/item features and active effects.",scope:"world",config:true,type:Boolean,default:true});});
Hooks.once("ready",()=>{
 Hooks.on("getHeaderControlsApplicationV2",addInactiveEffectMenu);
 Hooks.on("getActorSheetHeaderButtons",addLegacyInactiveEffectMenu);
 installCombatEffectCleanup();
});
