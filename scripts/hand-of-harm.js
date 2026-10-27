import {freeFlurryHarm} from "./mercy-flurry.js";
import {createEventQueue} from "./shared-activity-card.js";
import {focusResource} from "./stunning-strike.js";
import {weaponDamageApplied} from "./psionic-strike.js";
const ID="ugmuls-5-5e-automation",STRIKE="3LBCmLni9BQUpgcv",enqueue=createEventQueue();
const values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier;
const stamp=()=>game.combat?.started?game.combat.id+":"+game.combat.round+":"+game.combat.turn:null;
const enabled=()=>game.settings.get(ID,"handOfHarmAutomation")===true;
export function harmFeature(actor){return values(actor?.items).find(i=>i.type==="feat"&&key(i)==="hand-of-harm"&&i.system?.source?.rules!=="2014");}
export function harmUnarmed(activity){return activity?.type==="attack"&&(activity.attack?.type?.classification==="unarmed"||activity.item?.system?.type?.value==="unarmed"||["unarmed-strike","empowered-strike","empowered-strikes"].includes(key(activity.item))||/^(unarmed|empowered) strikes?$/i.test(activity.item?.name??""));}
const remaining=i=>Number(i?.system?.uses?.value??Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0))||0;
export function strikeUsed(actor){return !!stamp()&&values(actor?.effects).some(e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&e.getFlag?.(ID,"handOfHarmTurn")===stamp());}
export function strikeContext(card,user=game.user){
 if(!enabled()||card?.type!=="damage"||card.getFlag?.(ID,"pendingDamage")||card.getFlag?.(ID,"masteryGraze")||card.getFlag?.(ID,"handOfHarm")||!card.rolls?.some(r=>r._evaluated))return null;
 const activity=card.getAssociatedActivity?.(),actor=card.getAssociatedActor?.()??activity?.actor,resource=focusResource(actor),feature=harmFeature(actor),damage=values(feature?.system?.activities).find(a=>a.type==="damage"&&(a.id===STRIKE||a.name==="Hand of Harm"));
 const targets=card.system?.targets??[],target=targets.length===1?globalThis.fromUuidSync?.(targets[0].token,{strict:false}):null;
 const id=card.getFlag?.(ID,"damageAttackId"),ref=card.system?.origin,origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 const attack=(id?game.messages.get(id):null)??(origin?.type==="attack"?origin:values(origin?.getAssociatedRolls?.("attack")).filter(a=>a.timestamp<=card.timestamp).sort((a,b)=>b.timestamp-a.timestamp)[0]);
 const associated=attack?.getAssociatedToken?.()??activity?.getUsageToken?.()??actor?.token,source=associated?.document??associated,record=attack?.getFlag?.(ID,"handOfHarmAttack");
 if(!harmUnarmed(activity)||!damage||!(user?.isGM||actor?.testUserPermission?.(user,"OWNER"))||!target||!weaponDamageApplied(card,target)||record&&record.turn!==stamp()||!attack?.system?.evaluatedTargets?.some(t=>t.token===target.uuid&&t.isMiss===false))return null;
 const free=freeFlurryHarm(attack,actor);
 return {actor,resource,feature,damage,attack,target,targets,source,used:!!attack.getFlag?.(ID,"handOfHarmUsed"),free,available:(free||remaining(resource)>0)&&!strikeUsed(actor)};
}
export function useStrike(card,user=game.user){return enqueue(async()=>{
 let c=strikeContext(card,user);if(!c||c.used||!c.available)throw Error("Hand of Harm needs applied Unarmed/Empowered Strike damage, an unused turn and either 1 Focus Point or enabled Flurry of Healing and Harm.");
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 c=strikeContext(card,user);if(!c||c.used||!c.available)throw Error("Hand of Harm changed before it could be used.");
 const {actor,resource,feature,damage,attack,targets,free}=c,data=feature.toObject(),id=damage.id,use=data.system.activities[id];
 data.system.activities={[id]:use};data.effects=[];data.name="Hand of Harm";
 use.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};use.activation={type:"special",override:true};use.effects=[];use.damage.critical={...use.damage.critical,allow:game.settings.get(ID,"handOfHarmCriticalDamage")===true};
 use.range={override:true,units:"any"};use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};
 const helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
 const turn=stamp(),spent=Number(resource?.system?.uses?.spent??0);let charged=false,marker,committed=false,usage;
 try{
  if(!free){await resource.update({"system.uses.spent":spent+1});charged=true;}
  if(turn){const effect={name:"Hand of Harm - used",img:feature.img,disabled:false,transfer:false,system:{changes:[]},flags:{[ID]:{handOfHarmTurn:turn,handOfHarmCombat:game.combat.id}}};marker=globalThis.Ugmuls55eAutomationResources?.reuseMarker?await globalThis.Ugmuls55eAutomationResources.reuseMarker(actor,effect,"handOfHarmTurn"):(await actor.createEmbeddedDocuments("ActiveEffect",[effect]))?.[0];if(!marker)throw Error("Could not record Hand of Harm’s turn use.");}
  const metadata={actor:actor.uuid,feature:feature.uuid,resource:resource?.uuid,attack:attack.id,source:card.id,turn,free};
  const flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,handOfHarm:metadata}};
  const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false}},{configure:false},{data:{system:{targets},flags}});usage=result?.message;
  if(!usage)throw Error("Could not create the Hand of Harm card.");
  const rolls=await helper.system.activities.get(id).rollDamage({isCritical:game.settings.get(ID,"handOfHarmCriticalDamage")===true&&attack.rolls?.[0]?.isCritical===true},{configure:false},{data:{system:{origin:usage.id,targets},flags}});
  if(!rolls?.length)throw Error("Hand of Harm did not roll damage. No Focus Point was spent.");committed=true;
  await attack.setFlag(ID,"handOfHarmUsed",{...metadata,message:usage.id});return rolls;
 }finally{
  if(!committed){if(charged)await resource.update({"system.uses.spent":Math.max(0,Number(resource.system.uses.spent??0)-1)});if(marker)await marker.update({disabled:true});if(usage)await usage.setFlag(ID,"manualDamageWorkflow",true);}
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
 }
});}
function report(error){console.error("Hand of Harm",error);ui.notifications.error(error.message);}
export async function requestStrike(card,button){
 button.disabled=true;try{
  const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"handOfHarmUse",messageId:card.id,userId:game.user.id,gmId:gm.id});else if(game.user.isGM)await useStrike(card,game.user);else throw Error("A connected GM is required for Hand of Harm.");
 }catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
}
export function renderStrike(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){node.querySelectorAll(':scope > .rsa-hand-of-harm').forEach(n=>n.remove());if(card.isContentVisible===false)continue;const c=strikeContext(card);if(!c)continue;
  const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-hand-of-harm";
  if(c.used)controls.textContent="Hand of Harm used for this hit.";
  else if(c.available){const button=document.createElement("button");button.type="button";button.textContent=c.free?"Hand of Harm — Free":"Hand of Harm — 1 Focus Point";button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();requestStrike(card,button);});controls.append(button);}
  if(controls.childNodes.length)node.append(controls);
 }
}
export async function resetStrike(combat,changes={}){
 if(!game.user.isGM||game.users.activeGM?.id!==game.user.id||!("turn"in changes||"round"in changes||changes.started===false))return;
 const current=changes.started===false?null:stamp(),actors=new Map(values(combat.combatants).filter(c=>c.actor).map(c=>[c.actor.uuid,c.actor]));
 for(const actor of actors.values()){const updates=values(actor.effects).filter(e=>!e.disabled&&e.getFlag?.(ID,"handOfHarmCombat")===combat.id&&e.getFlag(ID,"handOfHarmTurn")!==current).map(e=>({_id:e.id,disabled:true}));if(updates.length)await actor.updateEmbeddedDocuments("ActiveEffect",updates);}
}

Hooks.once("init",()=>game.settings.register(ID,"handOfHarmAutomation",{name:"Hand of Harm Assistance",hint:"Offer Hand of Harm after an Unarmed or Empowered Strike deals damage. Spend 1 Focus Point (free for an enabled Flurry of Healing and Harm), once per turn, and roll native Necrotic damage with critical damage disabled unless its separate critical option is enabled.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.renderChatMessage",renderStrike);
 Hooks.on("preCreateChatMessage",card=>{if(!enabled()||card.type!=="attack"||!harmFeature(card.getAssociatedActor?.()))return;card.updateSource({["flags."+ID+".handOfHarmAttack"]:{turn:stamp()}});});
 Hooks.on("updateChatMessage",(card,changes)=>{const used=changes.flags?.[ID]?.handOfHarmUsed??changes["flags."+ID+".handOfHarmUsed"];if(used?.source)globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(used.source));});
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("handOfHarm",doc,changes));
 Hooks.on("updateCombat",(c,d)=>{resetStrike(c,d).catch(report);globalThis.Ugmuls55eAutomationChatRefresh?.request("handOfHarm",c,d);});Hooks.on("deleteCombat",c=>resetStrike(c,{started:false}).catch(report));
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="handOfHarmError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(packet.messageId));return;}
  if(packet?.action!=="handOfHarmUse"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;
  useStrike(card,user).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"handOfHarmError",messageId:card.id,userId:user.id,error:error.message});});
 });
});

Hooks.once("init",()=>game.settings.register(ID,"handOfHarmCriticalDamage",{name:"Hand of Harm: Allow Critical Damage",hint:"Default off: this post-damage ability rolls normal damage. Enable to follow the original attack’s critical result.",scope:"world",config:true,type:Boolean,default:false}));
