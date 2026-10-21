import {triggerEntry,triggerKeyForSpell} from "./trigger-library.js";
const ID="ugmuls-5-5e-automation",wrapped=new WeakSet(),cleaning=new Set();
const authority=()=>game.user?.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const get=(effect,key)=>effect?.getFlag?.(ID,key)??effect?.flags?.[ID]?.[key];
const active=effect=>effect&&!effect.disabled&&effect.active!==false&&!effect.duration?.expired;
async function resolve(ref){try{return ref?await fromUuid(ref,{strict:false}):null;}catch{return null;}}
export function prepareSwallowData(item,activity){
 const identifier=item?.identifier??item?.system?.identifier;if(!["swallow","engulf"].includes(identifier))return null;
 const cube=identifier==="engulf",key=cube?"mm-source-gelatinous-cube":triggerKeyForSpell(item),entry=triggerEntry(key);
 if(!entry?.enabled||!["feat","weapon"].includes(item?.type)||!(identifier==="swallow"&&["0A0cIyRNbphDR82L","YorssyWMumAsvzx3"].includes(activity.id)||cube&&activity.id==="5o0Bh8PQaojx5XMx"))return null;
 const data=item.toObject(),selected=data.system.activities[activity.id];if(!data.system.activities[entry.damageActivityId]||!(entry.requiredActivityIds??[]).every(id=>data.system.activities[id]))return null;
 const effect=data.effects.find(e=>e._id===entry.effectId);if(!effect)throw Error(entry.name+" needs its native swallowed/engulfed effect.");
 selected.effects=[{_id:effect._id,uuid:null,onSave:false,level:{}}];
 if(cube)selected.damage.onSave="half";
 else if(activity.type==="utility"){selected.name="Swallow";selected.target={override:true,prompt:true,affects:{type:"creature",count:"1",choice:false},template:{type:""}};selected.range={override:true,units:"any"};}
 if(!cube){const token=activity.getUsageToken?.()??item.actor?.token;effect.flags??={};effect.flags[ID]={...effect.flags[ID],swallowed:{key,spell:item.uuid,caster:item.actor?.uuid,sourceToken:(token?.document??token)?.uuid}};}
 data.flags??={};data.flags[ID]={...data.flags[ID],swallowPrepared:true};return data;
}
export function installSwallowPreparation(Type){
 let prototype=Type?.prototype;while(prototype&&!Object.hasOwn(prototype,"_createUsageMessage"))prototype=Object.getPrototypeOf(prototype);if(!prototype||wrapped.has(prototype)||typeof prototype.use!=="function")return;wrapped.add(prototype);const use=prototype.use;
 prototype.use=function(usage={},dialog={},message={}){if(this.item?.getFlag?.(ID,"swallowPrepared"))return use.call(this,usage,dialog,message);const data=prepareSwallowData(this.item,this);if(!data)return use.call(this,usage,dialog,message);const item=new CONFIG.Item.documentClass(data,{parent:this.item.actor});item.prepareFinalAttributes?.();return use.call(item.system.activities.get(this.id),usage,dialog,{...message,data:{...message.data,flags:{...message.data?.flags,[ID]:{...message.data?.flags?.[ID],activityOverrideData:data}}}});};
}
export function prepareAppliedSwallow(effect){
 const state=get(effect,"swallowed");if(!state||effect.parent?.documentName!=="Actor"||!triggerEntry(state.key)?.enabled)return;
 const start=CONFIG.ActiveEffect.documentClass.getEffectStart();effect.updateSource({start,"duration.expired":false,["flags."+ID+".recurringEffect"]:{...state,instance:foundry.utils.randomID(),level:0,dc:null,sourceCard:effect.system?.origin?.message}});
}
export async function finishAppliedSwallow(effect){
 const state=get(effect,"swallowed");let record=get(effect,"recurringEffect");if(!authority()||!state||!active(effect)||effect.parent?.documentName!=="Actor"||!triggerEntry(state.key)?.enabled||cleaning.has(effect.uuid))return;
 cleaning.add(effect.uuid);try{
  const card=await resolve(effect.system?.origin?.message),sourceToken=card?.getAssociatedToken?.();
  if(!record||record.key!==state.key||record.sourceCard!==effect.system?.origin?.message){record={...state,sourceToken:state.sourceToken??(sourceToken?.document??sourceToken)?.uuid,instance:foundry.utils.randomID(),level:0,dc:null,sourceCard:effect.system?.origin?.message};await effect.setFlag(ID,"recurringEffect",record);}
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  if(!active(effect)||!Array.from(effect.parent.effects??[]).includes(effect))return;
  const ids=[];for(const grapple of effect.parent.effects??[]){if(grapple===effect||!active(grapple)||!Array.from(grapple.statuses??[]).includes("grappled"))continue;
   const previous=get(grapple,"recurringEffect"),activity=await resolve(grapple.system?.origin?.activity),sourceCard=await resolve(grapple.system?.origin?.message),token=sourceCard?.getAssociatedToken?.();
   const actor=previous?.caster??get(grapple,"grappleCaster")??activity?.item?.actor?.uuid??activity?.actor?.uuid,sourceToken=previous?.sourceToken??(token?.document??token)?.uuid;
   if(actor===record.caster&&(!record.sourceToken||!sourceToken||sourceToken===record.sourceToken))ids.push(grapple.id);
  }
  const current=ids.filter(id=>Array.from(effect.parent.effects??[]).some(e=>e.id===id&&active(e)));if(current.length)await effect.parent.deleteEmbeddedDocuments("ActiveEffect",current);
 }finally{cleaning.delete(effect.uuid);}
}
function report(error){console.error("Swallow tracking",error);ui.notifications.error("Swallow tracking could not finish: "+error.message);}
Hooks.once("ready",()=>{for(const type of Object.values(CONFIG.DND5E.activityTypes))installSwallowPreparation(type.documentClass);Hooks.on("preCreateActiveEffect",prepareAppliedSwallow);for(const event of ["createActiveEffect","updateActiveEffect"])Hooks.on(event,effect=>finishAppliedSwallow(effect).catch(report));});
