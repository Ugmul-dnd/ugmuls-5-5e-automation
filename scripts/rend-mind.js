import {homingResource} from "./homing-strikes.js";
import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),FREE="UH1H8gC9X34sXqOI",PAID="VDSPYwhRDcSNkK4t";
const values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier;
export const rendFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="rend-mind"&&i.system?.source?.rules!=="2014");
const remaining=a=>Number(a?.uses?.value??a?.system?.uses?.value??(Number(a?.uses?.max??a?.system?.uses?.max)-Number(a?.uses?.spent??a?.system?.uses?.spent??0)))||0;
export function rendContext(card,user=game.user){
 if(game.settings.get(ID,"rendMindAutomation")!==true||card?.type!=="damage"||card.getFlag?.(ID,"pendingDamage")||!card.rolls?.some(r=>r._evaluated&&r.options?.rsaSneakAttack))return null;
 const actor=card.getAssociatedActor?.(),item=card.getAssociatedItem?.()??card.getAssociatedActivity?.()?.item,feature=rendFeature(actor),targets=card.system?.targets;
 if(!feature||item?.type!=="weapon"||!(key(item)==="psychic-blade"||/^psychic blades?$/i.test(item.name??""))||targets?.length!==1||!(user?.isGM||actor.testUserPermission?.(user,"OWNER")))return null;
 const attackId=card.getFlag?.(ID,"damageAttackId"),origin=typeof card.system?.origin==="string"?game.messages.get(card.system.origin.replace(/^ChatMessage\./,"")):card.system?.origin;
 const attack=attackId?game.messages.get(attackId):origin?.type==="attack"?origin:values(origin?.getAssociatedRolls?.("attack")).sort((a,b)=>b.timestamp-a.timestamp)[0];
 if(!attack?.system?.evaluatedTargets?.some(t=>t.token===targets[0].token&&t.isMiss===false))return null;
 const free=feature.system.activities.get(FREE),paid=feature.system.activities.get(PAID),resource=homingResource(actor),activity=remaining(free)>0?free:remaining(resource)>=3?paid:null;
 return {actor,feature,resource,activity,free:activity===free,targets,attack,used:!!attack.getFlag?.(ID,"rendMind")};
}
export function useRend(card,user=game.user){return enqueue(async()=>{
 const c=rendContext(card,user);if(!c||c.used||!c.activity)throw Error("Rend Mind needs a Psychic Blade Sneak Attack hit and its free use or three Psionic Energy Dice.");
 const {actor,feature,resource,activity,targets,attack}=c,data=feature.toObject(),use=data.system.activities[activity.id];
 if(!data.effects?.some(e=>e._id==="HoAwF2AAONF9XNKK"))throw Error("Rend Mind is missing its native Stunned effect.");
 use.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};use.activation={type:"special",override:true};use.damage={...use.damage,parts:[],onSave:"none"};use.effects=[{_id:"HoAwF2AAONF9XNKK",onSave:false}];
 use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};
 const helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
 let charged=false,committed=false,claimed=false;const spent=Number(c.free?activity.uses.spent??0:resource.system.uses.spent??0),cost=c.free?1:3;
 try{
  await attack.setFlag(ID,"rendMind",{pending:true,source:card.id});claimed=true;
  if(c.free)await feature.update({["system.activities."+activity.id+".uses.spent"]:spent+1});else await resource.update({"system.uses.spent":spent+3});charged=true;
  const result=await helper.system.activities.get(activity.id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false}},{configure:false},{data:{system:{targets},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,rendMindSource:card.id}}}});
  if(!result?.message)throw Error("Rend Mind did not create its save card.");committed=true;
  await attack.setFlag(ID,"rendMind",{message:result.message.id,source:card.id,free:c.free});return result;
 }finally{
  if(!committed){if(charged){if(c.free)await feature.update({["system.activities."+activity.id+".uses.spent"]:Math.max(0,Number(activity.uses.spent)-cost)});else await resource.update({"system.uses.spent":Math.max(0,Number(resource.system.uses.spent)-cost)});}if(claimed)await attack.unsetFlag(ID,"rendMind");}
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
 }
});}
function report(error){console.error("Rend Mind",error);ui.notifications.error(error.message);}
export function renderRend(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){node.querySelectorAll(':scope > .rsa-rend-mind').forEach(n=>n.remove());if(card.isContentVisible===false)continue;const c=rendContext(card);if(!c)continue;
  const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-rend-mind";
  if(c.used)controls.textContent="Rend Mind used for this hit.";
  else if(c.activity){const button=document.createElement("button");button.type="button";button.textContent="Rend Mind — "+(c.free?"Free use":"3 Psionic Energy Dice");button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();button.disabled=true;const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"rendMind",messageId:card.id,userId:game.user.id,gmId:gm.id});else useRend(card).catch(report).finally(()=>globalThis.Ugmuls55eAutomationChatRefresh?.card(card));});controls.append(button);}
  if(controls.childNodes.length)node.append(controls);
 }
}
Hooks.once("init",()=>game.settings.register(ID,"rendMindAutomation",{name:"Rend Mind Assistance",hint:"Offer Rend Mind on Psychic Blade Sneak Attack damage cards. Use the free use first, then three Soulknife Psionic Energy Dice. Failed Wisdom saves apply Stunned with end-turn repeat saves.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.renderChatMessage",renderRend);
 Hooks.on("updateChatMessage",(card,changes)=>{if(!changes.flags?.[ID]?.rendMind&&!changes["flags."+ID+".rendMind"])return;const source=card.getFlag?.(ID,"rendMind")?.source;if(source)globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(source));});
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("rend",doc,changes));
 Hooks.on("dnd5e.restCompleted",(actor,result)=>{if(!result.longRest||!actor.isOwner)return;const feature=rendFeature(actor),free=feature?.system.activities.get(FREE);if(free&&Number(free.uses.spent)>0)feature.update({["system.activities."+FREE+".uses.spent"]:0}).catch(report);});
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="rendMindError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(packet.messageId));return;}
  if(packet?.action!=="rendMind"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;
  const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;
  useRend(card,user).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"rendMindError",messageId:card.id,userId:user.id,error:error.message});});
 });
});
