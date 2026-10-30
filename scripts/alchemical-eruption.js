import {createEventQueue,describeTarget} from "./shared-activity-card.js";
import {weaponDamageApplied} from "./psionic-strike.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),wrapped=new WeakSet(),contexts=new WeakMap(),types=new Set(["acid","fire","poison"]);
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const resolve=ref=>typeof ref==="string"?(globalThis.fromUuidSync?.(ref,{strict:false})??game.messages.get(ref.replace(/^ChatMessage\./,""))):ref;
const enabled=()=>game.settings.get(ID,"chemicalMasteryAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),stamp=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
const isFeature=i=>i?.type==="feat"&&i.system?.source?.rules!=="2014"&&((i.identifier??i.system?.identifier)==="chemical-mastery"||i.name?.trim().toLowerCase()==="chemical mastery");
export const chemicalFeature=actor=>values(actor?.items).find(isFeature);
const eruption=feature=>values(feature?.system?.activities).find(a=>a.type==="damage"&&a.name?.trim().toLowerCase()==="alchemical eruption");
const artificerSpell=item=>item?.type==="spell"&&(item.system?.classIdentifier==="artificer"||item.system?.sourceItem==="class:artificer"||(item.class?.identifier??item.class?.system?.identifier)==="artificer");
// Foundry expands dots in update keys; token UUIDs must not be stored as literal keys.
const targetKey=target=>target.replaceAll(".","_");
const damageRecord=(card,target)=>{const records=flag(card,"eruptionDamage");return records?.[targetKey(target)]??records?.[target]??target.split(".").reduce((value,key)=>value?.[key],records);};
const ownTurn=actor=>!game.combat?.started||game.combat.combatant?.actor?.uuid===actor.uuid;
function sourceContext(card){
 if(!enabled()||card?.type!=="damage"||flag(card,"pendingDamage")||flag(card,"alchemicalEruption")||!card.rolls?.length)return null;
 const actor=card.getAssociatedActor?.(),feature=chemicalFeature(actor);if(!feature)return null;const activity=card.getAssociatedActivity?.(),item=activity?.item??card.getAssociatedItem?.();
 if(!artificerSpell(item)||flag(item,"storedSpell"))return null;let cast=resolve(card.system?.origin);if(cast?.type==="attack")cast=resolve(cast.system?.origin);if(cast?.type!=="usage")return null;
 return {card,actor,feature,activity,cast,damage:eruption(feature)};
}
export function stampEruption(activity,usage,dialog,message){if(!enabled()||!chemicalFeature(activity?.actor)||!artificerSpell(activity.item))return;message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],chemicalCast:{actor:activity.actor.uuid,turn:stamp()}};}
function targetRef(card,actor,options){const ref=options.rsaEruptionTarget??options.rsaBlessingTarget;if(ref&&resolve(ref)?.actor?.uuid===actor.uuid)return ref;const matches=values(card.system?.targets).filter(t=>resolve(t.token)?.actor?.uuid===actor.uuid);return matches.length===1?matches[0].token:null;}
export async function recordEruptionDamage(card,target,actorUuid,damageTypes,user=game.user){
 if(!authority()||!user?.active)return;const c=sourceContext(card),token=resolve(target),victim=token?.actor;
 if(!c||victim?.uuid!==actorUuid||!(user.isGM||victim.testUserPermission?.(user,"OWNER"))||!card.system?.targets?.some(t=>t.token===target)||!damageTypes?.length||damageTypes.some(t=>!types.has(t)))return;
 const record={actor:actorUuid,types:[...new Set(damageTypes)],cast:c.cast.id,turn:stamp()};await card.setFlag(ID,"eruptionDamage",{...flag(card,"eruptionDamage"),[targetKey(target)]:record});globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
}
export function installEruptionDamage(ActorType=CONFIG.Actor?.documentClass,TrayType=globalThis.customElements?.get?.("damage-application")){
 const p=TrayType?.prototype;if(p?.getMergedOptions&&!wrapped.has(p)){wrapped.add(p);const get=p.getMergedOptions;p.getMergedOptions=function(uuid){return {...get.call(this,uuid),rsaEruptionTarget:uuid};};}
 const a=ActorType?.prototype;if(!a?.applyDamage||!a.calculateDamage||wrapped.has(a))return;wrapped.add(a);const apply=a.applyDamage,calculate=a.calculateDamage;
 a.calculateDamage=function(...args){const result=calculate.apply(this,args),context=contexts.get(this);if(context)context.types=values(result).filter(d=>types.has(d.type)&&Number(d.value)>0).map(d=>d.type);return result;};
 a.applyDamage=async function(damages,options={}){
  const card=resolve(options.originatingMessage??options.origin),c=!options.rsaUndoDamage&&sourceContext(card);if(!c)return apply.call(this,damages,options);
  // Capture only a real application, after native saves/resistance/immunity.
  // Preview calculations never write card flags or enable the follow-up.
  const prior=contexts.get(this),context={types:[]},hp=this.system?.attributes?.hp,before=Number(hp?.value??0)+Number(hp?.temp??0);contexts.set(this,context);let result;
  try{result=await apply.call(this,damages,options);}finally{if(prior)contexts.set(this,prior);else contexts.delete(this);}
  const after=this.system.attributes.hp,target=targetRef(card,this,options);if(target&&context.types.length&&Number(after.value??0)+Number(after.temp??0)<before){
   if(authority())await enqueue(()=>recordEruptionDamage(card,target,this.uuid,context.types));else if(game.users.activeGM)game.socket.emit("module."+ID,{action:"eruptionRecord",card:card.id,target,actor:this.uuid,types:context.types,user:game.user.id,gm:game.users.activeGM.id});
  }
  return result;
 };
}
export function eruptionContext(card,user=game.user){
 const c=sourceContext(card);if(!c||!c.damage||!user?.active||!(user.isGM||c.actor.testUserPermission?.(user,"OWNER"))||!ownTurn(c.actor)||flag(card,"eruptionUsed"))return null;
 const cast=flag(c.cast,"chemicalCast");if(!cast||cast.actor!==c.actor.uuid||cast.turn!==stamp())return null;
 const uses=c.damage.uses,remaining=Number(uses?.value??(Number(uses?.max)-Number(uses?.spent??0)));if(!(remaining>0)||stamp()&&flag(c.actor,"chemicalEruptionTurn")===stamp())return null;
 const candidates=values(card.system.targets).flatMap(d=>{const token=resolve(d.token),record=damageRecord(card,d.token);return token?.actor&&record?.actor===token.actor.uuid&&record.cast===c.cast.id&&record.turn===stamp()&&record.types?.some(t=>types.has(t))&&weaponDamageApplied(card,token)?[token]:[];});return candidates.length?{...c,candidates}:null;
}
export function useEruption(card,targetUuid,user=game.user){return enqueue(async()=>{
 if(!authority())throw Error("A connected GM is required for Alchemical Eruption.");let c=eruptionContext(card,user);if(!c||!c.candidates.some(t=>t.uuid===targetUuid))throw Error("Alchemical Eruption requires applied Acid/Fire/Poison damage from an Artificer spell and an unused own turn.");
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);c=eruptionContext(card,user);if(!c||!c.candidates.some(t=>t.uuid===targetUuid))throw Error("Alchemical Eruption changed before use.");
 const {actor,feature,damage}=c,data=feature.toObject(),id=damage.id,use=data.system.activities[id],target=resolve(targetUuid),targets=[describeTarget(target)],turn=stamp(),spent=Number(damage.uses.spent??0),previous=flag(actor,"chemicalEruptionTurn");
 data.name="Alchemical Eruption";data.system.activities={[id]:use};data.effects=[];data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};
 use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.effects=[];use.appliedEffects=[];use.damage.critical={...use.damage.critical,allow:false};use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};use.range={override:true,units:"any"};
 const helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();let charged=false,committed=false,usage;
 try{
  await feature.update({[`system.activities.${id}.uses.spent`]:spent+1});charged=true;if(turn)await actor.setFlag(ID,"chemicalEruptionTurn",turn);
  const flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,alchemicalEruption:{source:card.id,actor:actor.uuid,target:targetUuid,turn}}};
  const activity=helper.system.activities.get(id),result=await activity.use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{speaker:card.speaker,system:{targets},flags}});usage=result?.message;if(!usage)throw Error("Alchemical Eruption could not create its native damage card.");
  const rolls=await activity.rollDamage({isCritical:false},{configure:false},{data:{speaker:card.speaker,system:{origin:usage.id,targets},flags}});if(!rolls?.length)throw Error("Alchemical Eruption did not roll damage.");committed=true;await card.setFlag(ID,"eruptionUsed",{message:usage.id,target:targetUuid,turn});return rolls;
 }finally{
  if(!committed){if(charged)await feature.update({[`system.activities.${id}.uses.spent`]:Math.max(0,Number(damage.uses.spent??0)-1)});if(turn&&flag(actor,"chemicalEruptionTurn")===turn)await actor.setFlag(ID,"chemicalEruptionTurn",previous??null);if(usage)await usage.setFlag(ID,"manualDamageWorkflow",true);}
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
 }
});}
function request(card,target){const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"eruptionUse",card:card.id,target,user:game.user.id,gm:gm.id});else useEruption(card,target).catch(error=>{report(error);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);});}
export function renderEruption(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;const entries=[{card:message,node:root},...values(root.querySelectorAll(".card-summary[data-message-id]")).map(node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){node.querySelectorAll(":scope > .rsa-alchemical-eruption").forEach(n=>n.remove());if(card?.isContentVisible===false)continue;const c=eruptionContext(card);if(!c)continue;const row=document.createElement("div");row.className="rsa-attack-actions rsa-alchemical-eruption";
  for(const target of c.candidates){const button=document.createElement("button");button.type="button";button.textContent="Alchemical Eruption — "+target.name;button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();button.disabled=true;request(card,target.uuid);});row.append(button);}node.append(row);
 }
}
function report(error){console.error("Alchemical Eruption",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"chemicalMasteryAutomation",{name:"Alchemist: Alchemical Eruption",hint:"After an Artificer spell deals Acid/Fire/Poison damage, offer native Force damage to one affected target, once on each of the caster’s own turns. Preserve the original save/damage and use normal Force damage application/Undo.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 installEruptionDamage();Hooks.on("dnd5e.preUseActivity",stampEruption);Hooks.on("dnd5e.renderChatMessage",renderEruption);
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,(item,changes)=>{if(isFeature(item))globalThis.Ugmuls55eAutomationChatRefresh?.request("chemicalEruption",item,changes);});
 Hooks.on("updateActor",(actor,changes)=>{if(changes.flags?.[ID]?.chemicalEruptionTurn!==undefined||Object.hasOwn(changes,`flags.${ID}.chemicalEruptionTurn`))globalThis.Ugmuls55eAutomationChatRefresh?.request("chemicalEruption",actor,changes);});Hooks.on("updateCombat",(combat,changes)=>{if("turn"in changes||"round"in changes||"started"in changes)globalThis.Ugmuls55eAutomationChatRefresh?.request("chemicalEruption",combat,changes);});
 game.socket.on("module."+ID,packet=>{if(packet?.action==="eruptionError"&&packet.user===game.user.id){ui.notifications.error(packet.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(packet.card));return;}
  if(!["eruptionRecord","eruptionUse"].includes(packet?.action)||!authority()||packet.gm!==game.user.id)return;const user=game.users.get(packet.user),card=game.messages.get(packet.card);if(!user?.active||!card)return;
  const task=packet.action==="eruptionRecord"?enqueue(()=>recordEruptionDamage(card,packet.target,packet.actor,packet.types,user)):useEruption(card,packet.target,user);task.catch(error=>{report(error);game.socket.emit("module."+ID,{action:"eruptionError",card:card.id,user:user.id,error:error.message});});
 });
});
