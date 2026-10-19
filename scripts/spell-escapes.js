import {triggerEntry} from "./trigger-library.js";
const ID="ugmuls-5-5e-automation",wrapped=new WeakSet(),snapshots=new WeakMap();
const identifiers=new Set(["web","entangle","evards-black-tentacles","ensnaring-strike"]);
const identifier=item=>item?.identifier??item?.system?.identifier;
// Actor-owned temporary items need the final preparation normally run by their actor.
function preparedItem(data,actor){const item=new CONFIG.Item.documentClass(data,{parent:actor});item.prepareFinalAttributes?.();return item;}
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function prepareEscapeSpellData(spell){
 const data=spell.toObject(),key=identifier(spell);data.flags??={};data.flags[ID]={...data.flags[ID],escapePrepared:true};
 const recipe=triggerEntry(key),activities=Object.values(data.system.activities??{});
 const primary=activities.find(a=>a.type==="save"&&(a._id===recipe?.saveActivityId||a.name===recipe?.saveActivity))??activities.find(a=>a.type==="save");
 for(const activity of primary?[primary]:[]){
  if(key==="web"||key==="ensnaring-strike")activity.damage={...activity.damage,parts:[],onSave:"none"};
  if(key==="evards-black-tentacles")activity.damage={...activity.damage,onSave:"none"};
  if(key==="web"){
   const id="rsaWebRestrained";data.effects??=[];
   if(!data.effects.some(effect=>effect._id===id))data.effects.push({_id:id,name:"Restrained",img:"systems/dnd5e/icons/svg/statuses/restrained.svg",disabled:false,transfer:false,statuses:["restrained"],duration:{value:3600,units:"seconds",expiry:"turnStart",expired:false},system:{changes:[]}});
   activity.effects=[...(activity.effects??[]).filter(effect=>effect._id!==id),{_id:id,onSave:false}];
  }
 }
 return data;
}
export function installEscapePreparation(Type){
 let prototype=Type?.prototype;while(prototype&&!Object.hasOwn(prototype,"_createUsageMessage"))prototype=Object.getPrototypeOf(prototype);
 if(!prototype||wrapped.has(prototype)||typeof prototype.use!=="function")return;wrapped.add(prototype);
 const use=prototype.use;
 prototype.use=function(usage={},dialog={},message={}){
  const key=identifier(this.item);
  const recipe=triggerEntry(key);
  if(this.type!=="save"||!identifiers.has(key)||!recipe?.enabled||this.item.getFlag?.(ID,"escapePrepared"))return use.call(this,usage,dialog,message);
  const saves=Array.from(this.item.system.activities??[]),primary=saves.find(a=>a.type==="save"&&(a.id===recipe.saveActivityId||a.name===recipe.saveActivity))??saves.find(a=>a.type==="save");
  if(primary&&this.id!==primary.id)return use.call(this,usage,dialog,message);
  const data=prepareEscapeSpellData(this.item),item=preparedItem(data,this.actor??this.item.actor);
  const flags=foundry.utils.mergeObject(message.data?.flags??{},{[ID]:{escapeSpellData:data}},{inplace:false});
  const concentration=Array.from(this.actor?.concentration?.effects??[]).find(effect=>{const ref=effect.getFlag?.("dnd5e","item");return ref?.uuid===this.item.uuid||ref?.id===this.item.id||ref?.data?._id===this.item.id;});
  return use.call(item.system.activities.get(this.id),usage,dialog,{...message,data:{...message.data,system:{...message.data?.system,...(concentration?{concentration:concentration.id}:{})},flags}});
 };
}
export function installEscapeCardSnapshots(Type=CONFIG.ChatMessage?.documentClass??ChatMessage.implementation){
 const prototype=Type?.prototype;if(!prototype||prototype.rsaEscapeSnapshots)return;
 const getItem=prototype.getAssociatedItem,getActivity=prototype.getAssociatedActivity;
 const snapshot=card=>card?.getFlag?.(ID,"escapeSpellData")??card?.getFlag?.(ID,"monsterPoisonData");
 const context=card=>{if(snapshot(card))return card;const ref=card.system?.origin;const origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;return snapshot(origin)?origin:null;};
 if(!getItem||!getActivity)return;
 prototype.getAssociatedItem=function(options={}){
  const source=context(this),data=snapshot(source);if(!data)return getItem.call(this,options);
  const actor=source.getAssociatedActor(),scaling=options.scaled?this.system.scaling??0:0;
  let cache=snapshots.get(this);if(!cache||cache.data!==data||cache.actor!==actor){cache={data,actor,items:new Map()};snapshots.set(this,cache);}
  if(!cache.items.has(scaling)){const item=preparedItem(data,actor);cache.items.set(scaling,scaling?item.scaledClone(scaling):item);}
  return cache.items.get(scaling);
 };
 prototype.getAssociatedActivity=function(options={}){
  if(!context(this))return getActivity.call(this,options);
  const id=this.system.activity?.id??this.getFlag("dnd5e","activity.id");return this.getAssociatedItem(options)?.system.activities.get(id);
 };
 prototype.rsaEscapeSnapshots=true;
}
export function initialEnsnaringAdvantage(message,actor){return identifier(message?.getAssociatedItem?.())==="ensnaring-strike"&&["lg","huge","grg"].includes(actor?.system?.traits?.size);}
export async function clearWebRestraints(region,actor){
 if(!authority()||!actor)return;
 for(const effect of Array.from(actor.effects??[])){const state=effect.getFlag?.(ID,"recurringEffect");if(state?.key==="web"&&state.region===region.uuid)await effect.delete();}
}
async function attachWebExit(region){
 if(!authority()||!triggerEntry("web")?.enabled)return;
 const item=region.flags?.dnd5e?.item?await fromUuid(region.flags.dnd5e.item):null;if(identifier(item)!=="web")return;
 if(Array.from(region.behaviors??[]).some(b=>b.getFlag?.(ID,"webEscapeExit")))return;
 await region.createEmbeddedDocuments("RegionBehavior",[{name:"Web — end restraint on exit",type:"executeScript",flags:{[ID]:{webEscapeExit:true}},system:{events:["tokenExit"],source:'await globalThis.Ugmuls55eAutomationSpellEscapes.webExit(region, event.data.token?.actor);'}}]);
}
const ending=new Set();
export async function finishSuccessfulEnsnaringCast(card){
 if(!authority()||ending.has(card?.id)||!card?.getFlag?.(ID,"escapeSpellData")||card.getFlag(ID,"recurringTrigger")||identifier(card.getAssociatedItem?.())!=="ensnaring-strike")return;
 const targets=card.system.targets??[];if(!targets.length||targets.some(target=>card.system.outcomes?.get(target.token)!=="success"))return;
 const actor=card.getAssociatedActor?.(),concentration=actor?.effects?.get?.(card.system.concentration);if(!concentration)return;
 ending.add(card.id);try{await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);if(actor.effects.get(concentration.id)===concentration)await actor.endConcentration(concentration);}finally{ending.delete(card.id);}
}
function report(error){console.error("Spell escape setup",error);ui.notifications.error(error.message);}
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationSpellEscapes={initialSaveAdvantage:initialEnsnaringAdvantage,webExit:clearWebRestraints};
 for(const type of Object.values(CONFIG.DND5E.activityTypes))installEscapePreparation(type.documentClass);
 installEscapeCardSnapshots();
 Hooks.on("createRegion",region=>attachWebExit(region).catch(report));
 Hooks.on("updateChatMessage",card=>finishSuccessfulEnsnaringCast(card).catch(report));
 Hooks.on("deleteRegion",region=>{if(!authority())return;const actors=new Map([...Array.from(game.actors??[]),...Array.from(region.parent?.tokens??[],t=>t.actor).filter(Boolean)].map(a=>[a.uuid,a]));for(const actor of actors.values())clearWebRestraints(region,actor).catch(report);});
});
