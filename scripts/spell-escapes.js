import {triggerEntry} from "./trigger-library.js";
const ID="ugmuls-5-5e-automation",wrapped=new WeakSet(),snapshots=new WeakMap(),actorRevisions=new WeakMap();
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
export function invalidateHelperCard(card){if(card)snapshots.delete(card);}
export function invalidateHelperActor(doc){const actor=doc?.documentName==="Actor"?doc:doc?.actor??(doc?.parent?.documentName==="Actor"?doc.parent:null);if(actor)actorRevisions.set(actor,(actorRevisions.get(actor)??0)+1);}
export function installEscapeCardSnapshots(Type=CONFIG.ChatMessage?.documentClass??ChatMessage.implementation){
 const prototype=Type?.prototype;if(!prototype||prototype.rsaEscapeSnapshots)return;
 const getItem=prototype.getAssociatedItem,getActivity=prototype.getAssociatedActivity;
 if(!getItem||!getActivity)return;
 const snapshot=card=>card?.getFlag?.(ID,"escapeSpellData")??card?.getFlag?.(ID,"monsterPoisonData")??card?.getFlag?.(ID,"activityOverrideData");
 const origin=card=>{const ref=card?.system?.origin;return typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;};
 const live=uuid=>uuid&&globalThis.fromUuidSync?.(uuid,{strict:false});
 const context=card=>{
  const parent=origin(card),explicit=snapshot(card)?card:snapshot(parent)?parent:null;if(explicit)return {source:explicit,data:snapshot(explicit),override:true};
  // Real actor items retain the system's native resolution and cloning behavior.
  if(live(card.system?.item?.uuid??card.getFlag?.("dnd5e","item.uuid")))return null;
  for(const source of [card,parent]){if(!source?.getFlag?.(ID,"riderTriggered"))continue;const id=source.system?.item?.id??source.getFlag("dnd5e","item.id"),data=source.system?.deltas?.deleted?.find(item=>item._id===id)??source.getFlag("dnd5e","item.data");if(data)return {source,data,override:false};}
  return null;
 };
 const cached=(card,info,options)=>{
  const {source,data}=info,actor=source.getAssociatedActor?.();if(!actor)return;
  const scaling=options.scaled?card.system.scaling??0:0,revision=actorRevisions.get(actor)??0,stamp=actor._stats?.modifiedTime;
  let cache=snapshots.get(source);if(!cache||cache.data!==data||cache.actor!==actor||cache.revision!==revision||cache.stamp!==stamp){cache={data,actor,revision,stamp,items:new Map()};snapshots.set(source,cache);}
  if(!cache.items.has(scaling)){
   // Clone before preparation so callers cannot mutate the persisted card snapshot.
   const item=preparedItem(foundry.utils.deepClone?foundry.utils.deepClone(data):structuredClone(data),actor);cache.items.set(scaling,scaling?item.scaledClone(scaling):item);
  }
  return cache.items.get(scaling);
 };
 prototype.getAssociatedItem=function(options={}){const info=context(this);return info?cached(this,info,options):getItem.call(this,options);};
 prototype.getAssociatedActivity=function(options={}){
  const info=context(this);if(!info||!info.override&&live(this.system.activity?.uuid??this.getFlag?.("dnd5e","activity.uuid")))return getActivity.call(this,options);
  const id=this.system.activity?.id??this.getFlag("dnd5e","activity.id");return cached(this,info,options)?.system.activities.get(id);
 };
 prototype.rsaEscapeSnapshots=true;
}
export function initialEnsnaringAdvantage(message,actor){return identifier(message?.getAssociatedItem?.())==="ensnaring-strike"&&["lg","huge","grg"].includes(actor?.system?.traits?.size);}
export async function clearWebRestraints(region,actor){
 if(!authority()||!actor)return;
 for(const effect of Array.from(actor.effects??[])){const state=effect.getFlag?.(ID,"recurringEffect");if(["web","mm-damage-whirlwind"].includes(state?.key)&&state.region===region.uuid)await effect.delete();}
}
async function attachWebExit(region){
 if(!authority())return;
 const item=region.flags?.dnd5e?.item?await fromUuid(region.flags.dnd5e.item):null;const kind=identifier(item);if(!["web","create-whirlwind"].includes(kind)||!triggerEntry(kind==="web"?"web":"mm-damage-whirlwind")?.enabled)return;
 if(Array.from(region.behaviors??[]).some(b=>b.getFlag?.(ID,"webEscapeExit")))return;
 await region.createEmbeddedDocuments("RegionBehavior",[{name:(kind==="web"?"Web":"Whirlwind")+" — end restraint on exit",type:"executeScript",flags:{[ID]:{webEscapeExit:true}},system:{events:["tokenExit"],source:'await globalThis.Ugmuls55eAutomationSpellEscapes.webExit(region, event.data.token?.actor);'}}]);
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
 for(const event of ["updateChatMessage","deleteChatMessage"])Hooks.on(event,invalidateHelperCard);
 for(const type of ["Actor","Item","ActiveEffect"])for(const event of ["create","update","delete"])Hooks.on(event+type,invalidateHelperActor);
 Hooks.on("updateToken",(token,changes)=>{if(changes.delta||changes.actorData||changes.actorId)invalidateHelperActor(token.actor);});
 Hooks.on("createRegion",region=>attachWebExit(region).catch(report));
 Hooks.on("updateChatMessage",card=>finishSuccessfulEnsnaringCast(card).catch(report));
 Hooks.on("deleteRegion",region=>{if(!authority())return;const actors=new Map([...Array.from(game.actors??[]),...Array.from(region.parent?.tokens??[],t=>t.actor).filter(Boolean)].map(a=>[a.uuid,a]));for(const actor of actors.values())clearWebRestraints(region,actor).catch(report);});
});
