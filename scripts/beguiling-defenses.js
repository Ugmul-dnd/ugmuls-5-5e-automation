import {createEventQueue,isRollAdjustmentLocked,isHealingCard,describeTarget} from "./shared-activity-card.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
import {rebukeAttack} from "./elemental-rebuke.js";
import {sendSavePrompt} from "./save-prompts.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),seeded=new WeakMap();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
const enabled=()=>game.settings.get(ID,"beguilingDefensesAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const turn=()=>game.combat?.started?[game.combat.id,game.combat.round,game.combat.turn].join(":"):null;
const uses=f=>Number(f?.system?.uses?.value??Number(f?.system?.uses?.max??0)-Number(f?.system?.uses?.spent??0));
export const beguilingFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&(i.identifier??i.system?.identifier)==="beguiling-defenses");
export function beguilingRecord(card,uuid){return flag(card,"beguilingDefenses")?.[uuid?.split(".").at(-1)]??null;}
export function beguilingCandidates(card,user=game.user){
 if(!enabled()||card?.type!=="damage"||card.isContentVisible===false||isHealingCard(card)||flag(card,"pendingDamage")||isRollAdjustmentLocked(card)||!card.rolls?.some(r=>r.total>0))return [];
 const attack=rebukeAttack(card);if(!attack||isRollAdjustmentLocked(attack))return [];
 const doc=attack.getAssociatedToken?.(),attacker=doc?.document??doc;if(!attacker?.actor)return [];
 const activity=card.getAssociatedActivity?.();if(activity&&activity.type!=="attack")return [];
 return values(attack.system?.evaluatedTargets).filter(t=>t.isMiss===false).flatMap(hit=>{
  if(!(card.system?.targets??[]).some(t=>t.token===hit.token)||beguilingRecord(card,hit.token))return [];
  const token=resolve(hit.token),actor=token?.actor,feature=beguilingFeature(actor),reaction=values(feature?.system?.activities).find(a=>a.type==="save"&&String(a.activation?.type??"").startsWith("reaction"));
  if(!actor||actor.uuid===attacker.actor.uuid||!reaction||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||reactionUsed(actor)||["incapacitated","unconscious","stunned","paralyzed","petrified","dead"].some(s=>actor.statuses?.has(s)))return [];
  const pact=Number(actor.system?.spells?.pact?.value??0);return uses(feature)>0||pact>0?[{actor,token,feature,reaction,attack,attacker,restore:uses(feature)<=0}]:[];
 });
}
export function buildBeguiling(feature,reaction,amount=null){
 const data=feature.toObject(),id=reaction.id,activity=data.system?.activities?.[id];if(activity?.type!=="save")throw Error("Beguiling Defenses needs its native Wisdom save activity.");
 data._id=foundry.utils.randomID();data.system.activities={[id]:activity};data.system.uses={max:"",spent:0,recovery:[]};data.effects=[];data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};
 activity.activation={type:"special",override:true};activity.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};activity.range={units:"any",override:true};activity.target={override:true,prompt:false,affects:{type:"creature",count:"1",choice:false},template:{type:""}};activity.effects=[];
 activity.damage={onSave:"none",critical:{allow:false},parts:amount===null?[]:[{custom:{enabled:true,formula:String(amount)},types:["psychic"]}]};return {data,id};
}
async function store(card,token,record){await card.setFlag(ID,"beguilingDefenses",{...flag(card,"beguilingDefenses"),[token.split(".").at(-1)]:record});globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
export async function activateBeguiling(card,targetUuid,restore=false,user=game.user){
 if(!authority())throw Error("A connected GM is required for Beguiling Defenses.");
 const e=beguilingCandidates(card,user).find(e=>e.token.uuid===targetUuid);if(!e)throw Error("Beguiling Defenses needs an incoming hit and an available Reaction. Undo applied damage first.");
 if(e.restore&&!restore)throw Error("Restore Beguiling Defenses with a Pact Magic slot first.");
 const stamp=turn(),spent=Number(e.feature.system.uses.spent??0),pact=Number(e.actor.system.spells?.pact?.value??0);let marker,charged=false,slot=false,committed=false;
 try{
  if(e.restore){await e.actor.update({"system.spells.pact.value":pact-1});slot=true;}
  await e.feature.update({"system.uses.spent":e.restore?1:spent+1});charged=true;
  if(reactionUsed(e.actor))throw Error("Your Reaction was just used.");
  marker=await recordReactionUse(e.reaction,{}, {message:e.attack});
  const tracked=game.settings.get(ID,"reactionTracker")===true&&game.combat?.started&&values(game.combat.combatants).some(c=>c.actor?.uuid===e.actor.uuid);
  if(tracked&&marker?.getFlag?.(ID,"reactionUsage")!==e.attack.id)throw Error("Could not reserve the Warlock’s Reaction.");
  if(stamp!==turn()||isRollAdjustmentLocked(card)||isRollAdjustmentLocked(e.attack)||beguilingRecord(card,targetUuid))throw Error("The attack changed. Undo damage before reacting.");
  const {data,id}=buildBeguiling(e.feature,e.reaction),helper=new CONFIG.Item.documentClass(data,{parent:e.actor});helper.prepareFinalAttributes?.();
  const record={actor:e.actor.uuid,token:targetUuid,attacker:e.attacker.uuid,feature:e.feature.uuid,activity:id,user:user.id,name:e.actor.name,taken:null,save:null};
  await store(card,targetUuid,record);committed=true;
  const flags={[ID]:{riderTriggered:true,regionTriggered:true,activityOverrideData:data,beguilingSave:{card:card.id,target:targetUuid}},dnd5e:{item:{data}}};
  const result=await helper.system.activities.get(id).use({consume:false,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:[describeTarget(e.attacker)]},flags}});
  if(!result?.message)throw Error("Half damage is recorded, but the Beguiling save could not be created. Use the native save without spending again.");
  await store(card,targetUuid,{...beguilingRecord(card,targetUuid),save:result.message.id});await sendSavePrompt(result.message,e.attacker,"region");return result;
 }catch(error){if(!committed){if(charged)await e.feature.update({"system.uses.spent":spent});if(slot)await e.actor.update({"system.spells.pact.value":pact});if(marker?.getFlag?.(ID,"reactionUsage")===e.attack.id)await marker.update({disabled:true});}throw error;}
}
export function installBeguilingDamage(Type=globalThis.customElements?.get?.("damage-application")){
 const p=Type?.prototype;if(!p?.getMergedOptions||p.rsaBeguiling)return;
 const get=p.getMergedOptions,change=p._onChangeMultiplier;
 p.getMergedOptions=function(uuid){
  if(beguilingRecord(this.chatMessage,uuid)){let targets=seeded.get(this);if(!targets)seeded.set(this,targets=new Set());if(!targets.has(uuid)){const options=this.getTargetOptions?.(uuid);if(options)options.multiplier=0.5;targets.add(uuid);}}
  const options=get.call(this,uuid);return beguilingRecord(this.chatMessage,uuid)&&!this.getTargetOptions?{...options,multiplier:0.5}:options;
 };
 if(change)p._onChangeMultiplier=function(event){const button=event.target.closest(".multiplier-button");if(button)for(const uuid of seeded.get(this)??[])this.getTargetOptions(uuid).multiplier=Number(button.value);return change.call(this,event);};p.rsaBeguiling=true;
}
export async function reconcileBeguiling(card,targetUuid){
 if(!authority()||!enabled())return;const record=beguilingRecord(card,targetUuid);if(!record||record.reflected||!(record.taken>0)||!record.save)return;
 const save=game.messages.get(record.save);if(save?.system?.outcomes?.get(record.attacker)!=="failure")return;
 const actor=resolve(record.actor),attacker=resolve(record.attacker),feature=beguilingFeature(actor),reaction=values(feature?.system?.activities).find(a=>a.id===record.activity);if(!actor||!attacker?.actor||!reaction)return;
 const {data,id}=buildBeguiling(feature,reaction,record.taken),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
 await store(card,targetUuid,{...record,reflected:true});
 const flags={[ID]:{riderTriggered:true,activityOverrideData:data,beguilingReflection:{card:card.id,target:targetUuid,amount:record.taken}},dnd5e:{item:{data}}};
 await helper.system.activities.get(id).rollDamage({isCritical:false},{configure:false},{data:{system:{origin:save.id,targets:[describeTarget(attacker)]},flags}});
}
export async function recordBeguilingDamage(card,actorUuid,amount,user=game.user){
 if(!authority()||!enabled()||!card||!user?.active||!(amount>0))return;
 const record=values(flag(card,"beguilingDefenses")).find(r=>r.actor===actorUuid);if(!record||record.taken!==null)return;
 const actor=resolve(record.actor);if(!actor||!user.isGM&&!actor.testUserPermission(user,"OWNER"))return;
 const raw=values(card.rolls).reduce((n,r)=>n+Math.max(0,Number(r.total)||0),0);if(amount>raw)return;
 await store(card,record.token,{...record,taken:amount});await reconcileBeguiling(card,record.token);
}
export function beguilingSaveLink(card){
 const ref=card?.system?.origin,origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;return flag(card,"beguilingSave")??flag(origin,"beguilingSave");
}
function appliedBeguiling(actor,amount,options){
 const ref=options.origin??options.originatingMessage,card=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 if(!enabled()||options.rsaUndoDamage||!(amount>0)||!values(flag(card,"beguilingDefenses")).some(r=>r.actor===actor.uuid))return;
 if(authority())enqueue(()=>recordBeguilingDamage(card,actor.uuid,amount)).catch(report);
 else if(actor.isOwner&&game.users.activeGM)game.socket.emit("module."+ID,{action:"beguilingTaken",card:card.id,actor:actor.uuid,amount,user:game.user.id,gm:game.users.activeGM.id});
}
async function request(card,entry){
 let restore=false;if(entry.restore){restore=await foundry.applications.api.DialogV2.confirm({window:{title:"Restore Beguiling Defenses"},content:"<p>Spend one Pact Magic spell slot to restore Beguiling Defenses, then use your Reaction?</p>"});if(!restore)return;}
 const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"beguilingUse",card:card.id,target:entry.token.uuid,restore,user:game.user.id,gm:gm.id});else await enqueue(()=>activateBeguiling(card,entry.token.uuid,restore));
}
export function renderBeguiling(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).map(node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){node.querySelectorAll(':scope > .rsa-beguiling').forEach(n=>n.remove());if(card?.type!=="damage"||card.isContentVisible===false)continue;
  const records=values(flag(card,"beguilingDefenses"));if(records.length)for(const tray of node.querySelectorAll("damage-application"))tray.refreshMultiplier?.();const candidates=beguilingCandidates(card);if(!records.length&&!candidates.length)continue;
  const row=document.createElement("div");row.className="rsa-attack-actions rsa-beguiling";
  for(const e of candidates){const b=document.createElement("button");b.type="button";b.textContent="Beguiling Defenses — "+e.actor.name;b.dataset.tooltip="Use a Reaction to halve this hit and force a Wisdom save. Only use if you can see the attacker. Failed save returns Psychic damage equal to damage taken.";b.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();b.disabled=true;request(card,e).catch(report).finally(()=>globalThis.Ugmuls55eAutomationChatRefresh?.card(card));});row.append(b);}
  for(const r of records){const label=document.createElement("span");label.textContent="Beguiling Defenses: half damage to "+r.name;row.append(label);}node.append(row);
 }
}
function report(error){console.error("Beguiling Defenses",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"beguilingDefensesAutomation",{name:"Archfey: Beguiling Defenses",hint:"On incoming attack damage, offer a Reaction to halve damage, spend a feature use and prompt the attacker’s native Wisdom save. A failed save returns Psychic damage equal to damage actually applied. Offer Pact Magic slot restoration when the free use is spent.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 installBeguilingDamage();Hooks.on("dnd5e.renderChatMessage",renderBeguiling);Hooks.on("dnd5e.applyDamage",appliedBeguiling);
 for(const event of ["createChatMessage","updateChatMessage","renderChatMessageHTML"])Hooks.on(event,card=>{const link=beguilingSaveLink(card);if(link&&authority())enqueue(()=>reconcileBeguiling(game.messages.get(link.card),link.target)).catch(report);});
 for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect","updateItem","deleteItem","updateActor","updateCombat"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("beguilingDefenses",doc,changes));
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="beguilingError"&&packet.user===game.user.id){ui.notifications.error(packet.error);return;}
  if(!["beguilingUse","beguilingTaken"].includes(packet?.action)||!authority()||packet.gm!==game.user.id)return;
  const card=game.messages.get(packet.card),user=game.users.get(packet.user);if(!card||!user?.active)return;
  enqueue(()=>packet.action==="beguilingUse"?activateBeguiling(card,packet.target,packet.restore===true,user):recordBeguilingDamage(card,packet.actor,Number(packet.amount),user)).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"beguilingError",user:user.id,error:error.message});});
 });
});
