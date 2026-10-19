import {triggerEntry,triggerKeyForSpell} from "./trigger-library.js";
import {buildRecurringItem,hasExternalTurnAutomation} from "./recurring-effects.js";
import {describeTarget,isEligibleTarget} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",running=new Set(),attachmentCompleted=new Map();
const specs={proboscis:{key:"mm-source-stirge",attack:"6MZpHY61F2goMSDV"},vortex:{key:"mm-source-invisible-stalker"},whelm:{key:"mm-source-water-elemental"},"barbed-hide":{key:"mm-source-barbed-devil"},swallow:{key:"mm-source-giant-toad"},engulf:{key:"mm-source-gelatinous-cube"}};
const authority=()=>game.user?.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const get=(effect,key)=>effect?.getFlag?.(ID,key)??effect?.flags?.[ID]?.[key];
const active=effect=>effect&&!effect.disabled&&effect.active!==false&&!effect.duration?.expired&&effect.system?.expired!==true;
const liveSource=token=>token?.actor&&!token.combatant?.defeated&&!token.actor.statuses?.has("dead")&&!(Number.isFinite(token.actor.system?.attributes?.hp?.value)&&token.actor.system.attributes.hp.value<=0);
export function sourceTurnActivities(token){return Array.from(token?.actor?.items??[]).flatMap(item=>{const identifier=item.identifier??item.system?.identifier,spec=specs[identifier],key=identifier==="swallow"?triggerKeyForSpell(item):spec?.key,entry=key&&triggerEntry(key);if(!entry?.enabled||!["sourceTurnStart","sourceTurnEnd"].includes(entry.event)||!["feat","weapon"].includes(item.type)||!(entry.requiredActivityIds??[]).every(id=>Array.from(item.system.activities??[]).some(a=>a.id===id)))return [];const activity=Array.from(item.system.activities??[]).find(a=>a.id===entry.damageActivityId&&a.type===(entry.damageFromSave?"save":"damage"));return activity?[{item,activity,entry,key}]:[];});}
async function resolve(ref){if(!ref)return null;try{return await fromUuid(ref,{strict:false});}catch{return null;}}
async function grapplerIdentity(effect){
 const record=get(effect,"recurringEffect");let actor=record?.caster??get(effect,"grappleCaster"),token=record?.sourceToken;
 if(!token&&effect.system?.origin?.message){const card=await resolve(effect.system.origin.message),origin=card?.getAssociatedToken?.();token=(origin?.document??origin)?.uuid;}
 if(!actor){const activity=await resolve(effect.system?.origin?.activity);actor=activity?.item?.actor?.uuid??activity?.actor?.uuid;}
 return {actor,token};
}
function fromSource(identity,source){return identity.actor===source.actor.uuid&&(!identity.token||identity.token===source.uuid);}
export async function sourceTurnTargets(source,entry,key){
 const tokens=Array.from(source.parent?.tokens??[]),targets=new Map();
 if(entry.grappleContactDamage){
  for(const target of tokens){if(target.uuid===source.uuid||!isEligibleTarget(target))continue;for(const effect of target.actor.effects??[]){if(!active(effect)||hasExternalTurnAutomation(effect)||!Array.from(effect.statuses??[]).includes("grappled"))continue;if(fromSource(await grapplerIdentity(effect),source)){targets.set(target.uuid,target);break;}}}
  for(const effect of source.actor.effects??[]){if(!active(effect)||hasExternalTurnAutomation(effect)||!Array.from(effect.statuses??[]).includes("grappled"))continue;const identity=await grapplerIdentity(effect);for(const target of tokens)if(target.uuid!==source.uuid&&isEligibleTarget(target)&&fromSource(identity,target))targets.set(target.uuid,target);}
 }else{
  for(const target of tokens){if(target.uuid===source.uuid||!isEligibleTarget(target))continue;for(const effect of target.actor.effects??[]){const record=get(effect,"recurringEffect");if(active(effect)&&!hasExternalTurnAutomation(effect)&&record?.key===key&&fromSource({actor:record.caster,token:record.sourceToken},source)){targets.set(target.uuid,target);break;}}}
 }
 return [...targets.values()];
}
export function buildStirgeAttachment(item,source,target,card){
 return {name:"Attached — Stirge",type:"base",img:item.img??"icons/creatures/invertebrates/mosquito-tan.webp",disabled:false,transfer:false,statuses:[],duration:{value:null,units:"seconds",expiry:null,expired:false},system:{changes:[],origin:{activity:item.uuid+".Activity.6MZpHY61F2goMSDV",message:card.uuid??("ChatMessage."+card.id)}},flags:{dnd5e:{isTemporary:true},[ID]:{sourceTurnAttachment:{source:source.uuid,target:target.uuid},recurringEffect:{instance:foundry.utils.randomID(),key:"mm-source-stirge",spell:item.uuid,caster:item.actor.uuid,sourceToken:source.uuid,level:0,dc:null,sourceCard:card.uuid??("ChatMessage."+card.id)}}},description:"Attached Stirge. Its native attached damage is prompted at the start of the Stirge’s turn. Disable or delete this effect when it detaches; detachment actions and movement are handled at the table."};
}
export async function attachStirgeOnHit(card){
 if(!authority()||card?.type!=="attack"||running.has(card.id)||triggerEntry("mm-source-stirge")?.enabled!==true)return;
 const activity=card.getAssociatedActivity?.(),item=activity?.item;if(activity?.id!==specs.proboscis.attack||(item?.identifier??item?.system?.identifier)!=="proboscis")return;
 const stored=card.getFlag?.(ID,"stirgeAttachments")??[],sent=new Map(stored.map(row=>[row.target,row.effect]));for(const [target,effect]of attachmentCompleted.get(card.id)??[])sent.set(target,effect);
 const hits=Array.from(card.system.evaluatedTargets??[]).filter(target=>target.isMiss===false&&!sent.has(target.token));if(!hits.length)return;
 running.add(card.id);
 try{
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  const origin=card.getAssociatedToken?.()??item.actor?.token,source=origin?.document??origin;if(!source?.uuid||!liveSource(source))throw Error("Stirge attachment needs its originating token.");
  for(const hit of hits){
   if(!Array.from(card.system.evaluatedTargets??[]).some(target=>target.token===hit.token&&target.isMiss===false))continue;
   const target=await resolve(hit.token);if(!isEligibleTarget(target)||target.uuid===source.uuid)continue;
   const existing=Array.from(target.actor.effects??[]).find(effect=>active(effect)&&get(effect,"sourceTurnAttachment")?.source===source.uuid);
   const effect=existing??(await target.actor.createEmbeddedDocuments("ActiveEffect",[buildStirgeAttachment(item,source,target,card)]))[0];if(!effect)throw Error("Stirge attachment could not be created.");
   sent.set(target.uuid,effect.uuid??effect.id);attachmentCompleted.set(card.id,new Map(sent));await card.setFlag(ID,"stirgeAttachments",[...sent].map(([target,effect])=>({target,effect})));
  }
 }finally{running.delete(card.id);}
}
export async function triggerSourceTurnDamage(source,stamp,event="sourceTurnStart"){
 if(!authority()||!liveSource(source))return;
 const lock="source-turn:"+source.uuid;if(running.has(lock))return;running.add(lock);
 try{
  for(const {item,activity,entry,key}of sourceTurnActivities(source)){
   if(entry.event!==event)continue;
   const previous=source.getFlag?.(ID,"sourceTurnDamageLastTurns")??[];if(previous.some(row=>row.key===key&&row.stamp===stamp))continue;
   const targets=await sourceTurnTargets(source,entry,key);if(!targets.length)continue;
   await source.setFlag(ID,"sourceTurnDamageLastTurns",[...previous.filter(row=>row.key!==key),{key,stamp}]);
   const {data,id}=buildRecurringItem(item,entry,{level:0},"damage"),helper=new CONFIG.Item.documentClass(data,{parent:item.actor});helper.prepareFinalAttributes?.();
   const current=new Set((await sourceTurnTargets(source,entry,key)).map(target=>target.uuid));const descriptors=targets.filter(target=>current.has(target.uuid)).map(describeTarget);if(!liveSource(source)||!descriptors.length||triggerEntry(key)?.enabled!==true)continue;
   const flags={[ID]:{riderTriggered:true,sourceTurnDamage:{source:source.uuid,key,stamp}},dnd5e:{item:{data}}};
   const result=await helper.system.activities.get(id).use({consume:false,scaling:0,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:descriptors},flags}});if(!result?.message)throw Error("Monster recurring damage card was not created.");
   const dialog=globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("damage",{configure:true})??{configure:true};await helper.system.activities.get(id).rollDamage({isCritical:false},dialog,{data:{system:{origin:result.message.id,targets:descriptors},flags:{[ID]:flags[ID]}}});
  }
 }finally{running.delete(lock);}
}
export async function processSourceTurnDamage(combat,changes){
 if(!authority()||!combat.started||!combat.combatant||!("turn" in changes||"round" in changes||changes.started===true))return;
 const prior=combat.previous;if(changes.started!==true&&prior?.combatantId&&(prior.combatantId!==combat.combatant.id||prior.round!==combat.round)){const outgoing=combat.combatants?.get(prior.combatantId);if(outgoing?.token&&!outgoing.defeated)await triggerSourceTurnDamage(outgoing.token,combat.id+":"+prior.round+":"+prior.turn+":end","sourceTurnEnd");}
 const token=combat.combatant.token;if(token&&!combat.combatant.defeated)await triggerSourceTurnDamage(token,combat.id+":"+combat.round+":"+combat.turn);
}
function report(error){console.error("Monster source-turn damage",error);ui.notifications.error("Monster recurring damage could not finish: "+error.message);}
Hooks.once("ready",()=>{
 Hooks.on("updateCombat",(combat,changes)=>processSourceTurnDamage(combat,changes).catch(report));
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>attachStirgeOnHit(card).catch(report));
 Hooks.on("deleteChatMessage",card=>attachmentCompleted.delete(card.id));
});
