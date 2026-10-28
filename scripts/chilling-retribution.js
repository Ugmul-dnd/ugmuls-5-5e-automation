import {createEventQueue,describeTarget,isHealingCard} from "./shared-activity-card.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
import {rebukeAttack,refreshRebukeDamage} from "./elemental-rebuke.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),BOOK="hofWiwChillingRe";
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const stamp=()=>game.combat?.started?{combat:game.combat.id,round:game.combat.round,turn:game.combat.turn}:null;
export const chillingFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&((i.identifier??i.system?.identifier)==="chilling-retribution"||/^chilling retribution$/i.test(i.name?.trim()??"")||[i._stats?.compendiumSource,i.flags?.core?.sourceId].some(r=>r?.endsWith("."+BOOK))));
export function chillingCandidates(card,user=game.user){
 if(game.settings.get(ID,"chillingRetributionAutomation")!==true||card?.type!=="damage"||flag(card,"pendingDamage")||isHealingCard(card)||!card.rolls?.length)return [];
 const attack=rebukeAttack(card);if(!attack)return [];
 const ref=attack.getAssociatedToken?.(),attacker=ref?.document??ref;if(!attacker?.actor||card.getAssociatedActivity?.()?.type!=="attack")return [];
 return values(attack.system?.evaluatedTargets).filter(t=>t.isMiss===false&&values(card.system?.targets).some(d=>d.token===t.token)).flatMap(t=>{
  const token=globalThis.fromUuidSync?.(t.token,{strict:false}),actor=token?.actor;
  if(!actor||actor.uuid===attacker.actor.uuid||flag(attack,"chillingRetributions")?.[token.id]||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||reactionUsed(actor)||["incapacitated","unconscious","stunned","paralyzed","petrified","dead"].some(s=>actor.statuses?.has(s)))return [];
  const feature=chillingFeature(actor),activity=values(feature?.system?.activities).find(a=>a.type==="save"&&String(a.activation?.type).startsWith("reaction"));
  const remaining=Number(feature?.system?.uses?.value??Number(feature?.system?.uses?.max)-Number(feature?.system?.uses?.spent??0));
  return feature&&activity&&remaining>0?[{actor,token,feature,activity,attack,attacker}]:[];
 });
}
export function buildChilling(feature,activity,actor,applied=stamp()){
 const data=feature.toObject(),id=activity.id,use=data.system.activities[id];if(!use)throw Error("Chilling Retribution is missing its native saving throw.");
 const effect=(data.effects??[]).find(e=>e._id==="U3V3MzH7eQlECOab")??(data.effects??[]).find(e=>values(e.statuses).includes("stunned"));if(!effect)throw Error("Chilling Retribution is missing its Stunned effect.");
 Object.assign(effect,{name:"Chilling Retribution — Stunned",disabled:false,transfer:false,origin:actor.uuid,start:null,statuses:[...new Set([...values(effect.statuses),"stunned"])],duration:{value:applied?null:6,units:"seconds",expiry:null,expired:false}});
 effect.system={...effect.system,changes:[...(effect.system?.changes??[]).filter(c=>!c.key?.startsWith("system.attributes.movement.")),...["walk","fly","swim","climb","burrow"].map(mode=>({key:"system.attributes.movement."+mode,type:"override",value:"0"}))],origin:{actor:actor.uuid,item:feature.uuid}};
 effect.flags={...effect.flags,dnd5e:{...effect.flags?.dnd5e,isTemporary:true},[ID]:{...effect.flags?.[ID],chillingStun:{caster:actor.uuid,applied}}};
 data.effects=[effect];data.system.activities={[id]:use};data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};
 use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.duration={units:"inst",override:true,concentration:false};use.range={units:"any",override:true};use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};use.damage={parts:[],onSave:"none"};use.effects=[{_id:effect._id,onSave:false}];use.appliedEffects=[effect._id];
 return {data,id};
}
export async function applyChilling(card,tokenUuid,user=game.user){
 const c=chillingCandidates(card,user).find(e=>e.token.uuid===tokenUuid);if(!c)throw Error("Chilling Retribution requires a confirmed hit, an available Reaction and feature use.");
 const {actor,token,feature,activity,attack,attacker}=c,{data,id}=buildChilling(feature,activity,actor),spent=Number(feature.system.uses.spent??0);let marker,charged=false,published=false;
 try{
  marker=await recordReactionUse(activity,{}, {message:{id:card.id}});
  const tracked=game.settings.get(ID,"reactionTracker")===true&&game.combat?.started&&values(game.combat.combatants).some(e=>e.actor?.uuid===actor.uuid);
  if(tracked&&marker?.getFlag?.(ID,"reactionUsage")!==card.id)throw Error("Could not reserve the Ranger’s Reaction.");
  await feature.update({"system.uses.spent":spent+1});charged=true;
  const helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
  const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{system:{targets:[describeTarget(attacker)]},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,chillingRetribution:{attack:attack.id,defender:token.uuid,user:user.id}}}}});
  if(!result?.message)throw Error("Chilling Retribution could not create its save card.");published=true;
  await attack.setFlag(ID,"chillingRetributions",{...flag(attack,"chillingRetributions"),[token.id]:{actor:actor.uuid,name:actor.name,message:result.message.id}});
  refreshRebukeDamage(attack);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return result;
 }catch(error){if(!published){if(charged)await feature.update({"system.uses.spent":spent});if(marker?.getFlag?.(ID,"reactionUsage")===card.id)await marker.update({disabled:true});}throw error;}
}
export async function expireChilling(combat,changes={},ending=false){
 if(!authority()||!ending&&!("turn"in changes||"round"in changes||changes.started===false))return;
 const prior=combat.previous,source=prior?.combatantId?combat.combatants.get(prior.combatantId)?.actor:null;
 const actors=new Map([...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor))].filter(Boolean).map(a=>[a.uuid,a]));
 for(const actor of actors.values()){
  const ids=values(actor.effects).filter(e=>{const m=flag(e,"chillingStun"),a=m?.applied;if(!a||a.combat!==combat.id)return false;if(ending||combat.started===false)return true;return source?.uuid===m.caster&&(prior.round>a.round||prior.round===a.round&&prior.turn>a.turn);}).map(e=>e.id);
  if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
 }
}
async function requestChilling(card,entry){const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"chillingRetribution",card:card.id,token:entry.token.uuid,user:game.user.id,gm:gm.id});else await enqueue(()=>applyChilling(card,entry.token.uuid));}
export function renderChilling(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll(".card-summary[data-message-id]")).map(node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node} of entries){node.querySelectorAll(":scope > .rsa-chilling-actions").forEach(e=>e.remove());if(card.isContentVisible===false)continue;
  const candidates=chillingCandidates(card);if(!candidates.length)continue;const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-chilling-actions";
  for(const entry of candidates){const button=document.createElement("button");button.type="button";button.textContent="Chilling Retribution — "+entry.actor.name;button.dataset.tooltip="Spend a Reaction and one use. Attacker makes a Wisdom save; failure causes Stunned and Speed 0 until the end of your next turn. Incoming damage is unchanged.";button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();button.disabled=true;requestChilling(card,entry).catch(report);});controls.append(button);}node.append(controls);
 }
}
function report(error){console.error("Chilling Retribution",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"chillingRetributionAutomation",{name:"Winter Walker: Chilling Retribution",hint:"Offer a Reaction on incoming attack damage cards. Spend one feature use and prompt the attacker’s Wisdom save; failed saves apply Stunned and Speed 0 until the end of the Ranger’s next turn. The triggering damage is unchanged.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.renderChatMessage",renderChilling);
 for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect","updateItem","deleteItem","updateCombat"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("chilling",doc,changes));
 Hooks.on("updateCombat",(c,d)=>expireChilling(c,d).catch(report));Hooks.on("deleteCombat",c=>expireChilling(c,{},true).catch(report));
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="chillingRetributionError"&&packet.user===game.user.id){ui.notifications.error(packet.error);return;}
  if(packet?.action!=="chillingRetribution"||!authority()||packet.gm!==game.user.id)return;
  const user=game.users.get(packet.user),card=game.messages.get(packet.card);if(!user?.active||!card)return;
  enqueue(()=>applyChilling(card,packet.token,user)).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"chillingRetributionError",user:user.id,error:error.message});});
 });
});
