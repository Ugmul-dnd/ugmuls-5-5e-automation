import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",STRIKE="FxJXB4BPlBnJLF7q",enqueue=createEventQueue();
const values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier;
const stamp=()=>game.combat?.started?game.combat.id+":"+game.combat.round+":"+game.combat.turn:null;
const enabled=()=>game.settings.get(ID,"psionicStrikeAutomation")===true;
export function psiWarriorResource(actor){return values(actor?.items).find(i=>i.type==="feat"&&key(i)==="psionic-power"&&i.system?.source?.rules!=="2014"&&values(i.system?.activities).some(a=>a.type==="damage"&&(a.id===STRIKE||a.name==="Psionic Strike"))&&(String(i._source?.system?.uses?.max??i.system?.uses?.max).includes("psi-warrior")||values(i.system.activities).some(a=>a.id===STRIKE)));}
const remaining=i=>Number(i?.system?.uses?.value??Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0))||0;
export function strikeRange(source,target){
 if(!source?.actor||!target?.actor||source.parent?.id!==target.parent?.id||!source.object?.center||!target.object?.center)return false;
 const distance=globalThis.canvas?.grid?.measurePath([source.object.center,target.object.center])?.distance,units=String(source.parent?.grid?.units??"ft"),limit=/^(m|meters?|metres?)$/i.test(units)?9.144:30;
 return Number.isFinite(distance)&&distance<=limit;
}
function ownTurn(actor,source){
 if(!game.combat?.started)return true;const current=game.combat.combatant;
 return current?.actor?.uuid===actor?.uuid&&(!source?.uuid||current.token?.uuid===source.uuid);
}

export function strikeUsed(actor){return !!stamp()&&values(actor?.effects).some(e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&e.getFlag?.(ID,"psionicStrikeTurn")===stamp());}
export function weaponDamageApplied(card,target){
 if(card?.getFlag?.(ID,"hpApplicationRecorded")!==true)return false;
 return values(card.getFlag(ID,"damageUndoHistory")).some(record=>record.actorUuid===target?.actor?.uuid&&record.changes?.some(c=>["value","temp"].includes(c.key)&&Number(c.before)>Number(c.after)));
}
export function strikeContext(card,user=game.user){
 if(!enabled()||card?.type!=="damage"||card.getFlag?.(ID,"pendingDamage")||card.getFlag?.(ID,"masteryGraze")||card.getFlag?.(ID,"psionicStrike")||!card.rolls?.some(r=>r._evaluated))return null;
 const activity=card.getAssociatedActivity?.(),actor=card.getAssociatedActor?.()??activity?.actor,resource=psiWarriorResource(actor),damage=values(resource?.system?.activities).find(a=>a.type==="damage"&&(a.id===STRIKE||a.name==="Psionic Strike"));
 const targets=card.system?.targets??[],target=targets.length===1?globalThis.fromUuidSync?.(targets[0].token,{strict:false}):null;
 const id=card.getFlag?.(ID,"damageAttackId"),ref=card.system?.origin,origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 const attack=(id?game.messages.get(id):null)??(origin?.type==="attack"?origin:values(origin?.getAssociatedRolls?.("attack")).filter(a=>a.timestamp<=card.timestamp).sort((a,b)=>b.timestamp-a.timestamp)[0]);
 const associated=attack?.getAssociatedToken?.()??activity?.getUsageToken?.()??actor?.token,source=associated?.document??associated,record=attack?.getFlag?.(ID,"psionicStrikeAttack");
 if(activity?.type!=="attack"||activity.item?.type!=="weapon"||!damage||!(user?.isGM||actor?.testUserPermission?.(user,"OWNER"))||!target||!weaponDamageApplied(card,target)||!ownTurn(actor,source)||record&&record.turn!==stamp()||!strikeRange(source,target)||!attack?.system?.evaluatedTargets?.some(t=>t.token===target.uuid&&t.isMiss===false))return null;
 return {actor,resource,damage,attack,target,targets,source,used:!!attack.getFlag?.(ID,"psionicStrikeUsed"),available:remaining(resource)>0&&!strikeUsed(actor)};
}
export function useStrike(card,user=game.user,thrust="damage"){return enqueue(async()=>{
 if(!["damage","prone","push"].includes(thrust)||thrust!=="damage"&&!globalThis.Ugmuls55eAutomationThrust?.available?.(card.getAssociatedActor?.()))throw Error("The selected Psionic Strike option is unavailable.");
 let c=strikeContext(card,user);if(!c||c.used||!c.available)throw Error("Psionic Strike needs applied weapon damage, an unused own-turn hit within 30 feet and a Psi Warrior Energy Die.");
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 c=strikeContext(card,user);if(!c||c.used||!c.available)throw Error("Psionic Strike changed before it could be used.");
 const {actor,resource,damage,attack,targets}=c,data=resource.toObject(),id=damage.id,use=data.system.activities[id];
 data.system.activities={[id]:use};data.effects=[];data.name="Psionic Strike";
 use.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};use.activation={type:"special",override:true};use.effects=[];use.damage.critical={...use.damage.critical,allow:game.settings.get(ID,"psionicStrikeCriticalDamage")===true};
 use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};
 const helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
 const turn=stamp(),spent=Number(resource.system.uses.spent??0);let charged=false,marker,committed=false,usage;
 try{
  await resource.update({"system.uses.spent":spent+1});charged=true;
  if(turn){const effect={name:"Psionic Strike - used",img:resource.img,disabled:false,transfer:false,system:{changes:[]},flags:{[ID]:{psionicStrikeTurn:turn,psionicStrikeCombat:game.combat.id}}};marker=globalThis.Ugmuls55eAutomationResources?.reuseMarker?await globalThis.Ugmuls55eAutomationResources.reuseMarker(actor,effect,"psionicStrikeTurn"):(await actor.createEmbeddedDocuments("ActiveEffect",[effect]))?.[0];if(!marker)throw Error("Could not record Psionic Strike’s turn use.");}
  const metadata={actor:actor.uuid,feature:resource.uuid,attack:attack.id,source:card.id,turn,thrust};
  const flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,psionicStrike:metadata}};
  const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false}},{configure:false},{data:{system:{targets},flags}});usage=result?.message;
  if(!usage)throw Error("Could not create the Psionic Strike card.");
  const rolls=await helper.system.activities.get(id).rollDamage({isCritical:game.settings.get(ID,"psionicStrikeCriticalDamage")===true&&attack.rolls?.[0]?.isCritical===true},{configure:false},{data:{system:{origin:usage.id,targets},flags}});
  if(!rolls?.length)throw Error("Psionic Strike did not roll damage. No Energy Die was spent.");committed=true;
  await attack.setFlag(ID,"psionicStrikeUsed",{...metadata,message:usage.id});return rolls;
 }finally{
  if(!committed){if(charged)await resource.update({"system.uses.spent":Math.max(0,Number(resource.system.uses.spent??0)-1)});if(marker)await marker.update({disabled:true});if(usage)await usage.setFlag(ID,"manualDamageWorkflow",true);}
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
 }
});}
function report(error){console.error("Psionic Strike",error);ui.notifications.error(error.message);}
export async function requestStrike(card,button){
 button.disabled=true;try{
  const thrust=await (globalThis.Ugmuls55eAutomationThrust?.chooseStrikeMode?.(card.getAssociatedActor?.())??Promise.resolve("damage"));if(!thrust)return;
  const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"psionicStrikeUse",messageId:card.id,thrust,userId:game.user.id,gmId:gm.id});else if(game.user.isGM)await useStrike(card,game.user,thrust);else throw Error("A connected GM is required for Psionic Strike.");
 }catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
}
export function renderStrike(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){node.querySelectorAll(':scope > .rsa-psionic-strike').forEach(n=>n.remove());if(card.isContentVisible===false)continue;const c=strikeContext(card);if(!c)continue;
  const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-psionic-strike";
  if(c.used)controls.textContent="Psionic Strike used for this hit.";
  else if(c.available){const button=document.createElement("button");button.type="button";button.textContent="Psionic Strike — Spend 1 Energy Die";button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();requestStrike(card,button);});controls.append(button);}
  if(controls.childNodes.length)node.append(controls);
 }
}
export async function resetStrike(combat,changes={}){
 if(!game.user.isGM||game.users.activeGM?.id!==game.user.id||!("turn"in changes||"round"in changes||changes.started===false))return;
 const current=changes.started===false?null:stamp(),actors=new Map(values(combat.combatants).filter(c=>c.actor).map(c=>[c.actor.uuid,c.actor]));
 for(const actor of actors.values()){const updates=values(actor.effects).filter(e=>!e.disabled&&e.getFlag?.(ID,"psionicStrikeCombat")===combat.id&&e.getFlag(ID,"psionicStrikeTurn")!==current).map(e=>({_id:e.id,disabled:true}));if(updates.length)await actor.updateEmbeddedDocuments("ActiveEffect",updates);}
}

Hooks.once("init",()=>game.settings.register(ID,"psionicStrikeAutomation",{name:"Psionic Strike Assistance",hint:"Offer Psionic Strike on weapon damage cards after damage is applied within 30 feet. Spend one Psi Warrior Energy Die, once on your own turn; roll separate Force damage. Critical damage is disabled unless its separate critical option is enabled.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.renderChatMessage",renderStrike);
 Hooks.on("preCreateChatMessage",card=>{if(!enabled()||card.type!=="attack"||!psiWarriorResource(card.getAssociatedActor?.()))return;card.updateSource({["flags."+ID+".psionicStrikeAttack"]:{turn:stamp()}});});
 Hooks.on("updateChatMessage",(card,changes)=>{const used=changes.flags?.[ID]?.psionicStrikeUsed??changes["flags."+ID+".psionicStrikeUsed"];if(used?.source)globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(used.source));});
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("psiStrike",doc,changes));
 Hooks.on("updateCombat",(c,d)=>{resetStrike(c,d).catch(report);globalThis.Ugmuls55eAutomationChatRefresh?.request("psiStrike",c,d);});Hooks.on("deleteCombat",c=>resetStrike(c,{started:false}).catch(report));
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="psionicStrikeError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(packet.messageId));return;}
  if(packet?.action!=="psionicStrikeUse"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;
  useStrike(card,user,packet.thrust??"damage").catch(error=>{report(error);game.socket.emit("module."+ID,{action:"psionicStrikeError",messageId:card.id,userId:user.id,error:error.message});});
 });
});

Hooks.once("init",()=>game.settings.register(ID,"psionicStrikeCriticalDamage",{name:"Psionic Strike: Allow Critical Damage",hint:"Default off: this post-damage ability rolls normal damage. Enable to follow the original attack’s critical result.",scope:"world",config:true,type:Boolean,default:false}));
