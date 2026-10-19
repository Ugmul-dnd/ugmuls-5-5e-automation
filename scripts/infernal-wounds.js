import {triggerEntry} from "./trigger-library.js";
const ID="ugmuls-5-5e-automation",locks=new Set(),wrapped=new WeakSet(),actorQueues=new Map(),completed=new Map();
const keys={"infernal-glaive":"mm-wound-bearded","infernal-tail":"mm-wound-horned"};
const authority=()=>game.user?.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const get=(doc,key)=>doc?.getFlag?.(ID,key)??doc?.flags?.[ID]?.[key];
const now=()=>Number(game.time?.worldTime??0);
const live=effect=>effect&&!effect.disabled&&effect.active!==false&&!effect.duration?.expired&&get(effect,"infernalWound")?.until>now();
async function closeWound(effect){const key="close:"+effect?.uuid;if(!live(effect)||locks.has(key)||effect.parent?.effects&&!Array.from(effect.parent.effects).includes(effect))return;locks.add(key);try{await effect.delete();}finally{locks.delete(key);}}
async function resolve(ref){try{return ref?await fromUuid(ref,{strict:false}):null;}catch{return null;}}
export function infernalWounds(actor){return Array.from(actor?.effects??[]).filter(live);}
function recipe(item){const key=keys[item?.identifier??item?.system?.identifier],entry=key&&triggerEntry(key);return entry?.enabled?{key,entry}:null;}
export function woundLossFormula(activity){
 const parts=Array.from(activity?.damage?.parts??[]).map(part=>part.custom?.enabled?part.custom.formula:[Number(part.number)>0&&Number(part.denomination)>0?part.number+"d"+part.denomination:"",part.bonus].filter(Boolean).join(" + "));
 const formula=parts.filter(Boolean).join(" + ");if(!formula)throw Error("Infernal wound needs its native HP-loss formula.");return globalThis.CONFIG?.Dice?.BasicRoll?.replaceFormulaData?.(formula,activity.getRollData?.()??{},{missing:0})??formula;
}
export function prepareInfernalData(item,{saveOnly=false}={}){
 const match=recipe(item);if(!match)throw Error("Infernal wound automation is disabled.");const {key,entry}=match,data=item.toObject(),save=data.system.activities[entry.initialSaveId],loss=Array.from(item.system.activities??[]).find(a=>a.id===entry.damageActivityId);
 if(!save||!loss)throw Error("Infernal wound is missing its native save or HP-loss activity.");
 const effectId="rsaInfernalWound",state={key,instance:foundry.utils.randomID(),item:item.uuid,formula:woundLossFormula(loss),dc:entry.medicineDC,seconds:entry.durationSeconds};
 data.effects=[{_id:effectId,name:"Infernal Wound",type:"base",img:"icons/skills/wounds/blood-spurt-spray-red.webp",disabled:false,transfer:false,statuses:[],duration:{value:entry.durationSeconds,units:"seconds",expiry:"turnStart",expired:false},system:{changes:[]},flags:{dnd5e:{isTemporary:true},[ID]:{infernalWound:state}},description:"At turn start, lose HP. A spell restoring HP or a successful Wisdom (Medicine) action closes this wound. It also closes after one minute."}];
 save.effects=[{_id:effectId,uuid:null,onSave:false,level:{}}];
 if(saveOnly){data.system.activities={[entry.initialSaveId]:save};save.damage={parts:[],onSave:"none"};save.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};save.activation={type:"special",override:true};save.target={override:true,prompt:false,affects:{type:"creature",count:"1",choice:false},template:{type:""}};data.system.description={value:"<p>Constitution save. Failure: an infernal wound.</p>",chat:""};}
 const quiet={version:5,isEnabled:false,isCustomized:false,killAnim:true};data.flags??={};data.flags.autoanimations=quiet;save.flags??={};save.flags.autoanimations=quiet;data.flags[ID]={...data.flags[ID],infernalPrepared:true};return {data,id:entry.initialSaveId};
}
export function prepareAppliedWound(effect){
 if(effect.parent?.documentName!=="Actor"||!get(effect,"infernalWound"))return;
 if(infernalWounds(effect.parent).some(existing=>existing!==effect))return false;
 const state=get(effect,"infernalWound"),start=CONFIG.ActiveEffect.documentClass.getEffectStart();effect.updateSource({start,"duration.expired":false,["flags."+ID+".infernalWound"]:{...state,instance:foundry.utils.randomID(),since:now(),until:now()+state.seconds}});
}
export function prepareReappliedWound(effect,changes){
 const state=get(effect,"infernalWound");if(effect.parent?.documentName!=="Actor"||!state||changes.disabled!==false||!("start" in changes||"start.time" in changes))return;
 if(infernalWounds(effect.parent).length)return false;
 changes["flags."+ID+".infernalWound"]={...state,instance:foundry.utils.randomID(),since:now(),until:now()+state.seconds};changes["duration.expired"]=false;
}
export function installInfernalPreparation(Type){
 let prototype=Type?.prototype;while(prototype&&!Object.hasOwn(prototype,"_createUsageMessage"))prototype=Object.getPrototypeOf(prototype);if(!prototype||wrapped.has(prototype)||typeof prototype.use!=="function")return;wrapped.add(prototype);const use=prototype.use;
 prototype.use=function(usage={},dialog={},message={}){const match=recipe(this.item);if(!match||match.key!=="mm-wound-horned"||this.type!=="save"||this.id!==match.entry.initialSaveId||get(this.item,"infernalPrepared"))return use.call(this,usage,dialog,message);const {data,id}=prepareInfernalData(this.item),item=new CONFIG.Item.documentClass(data,{parent:this.item.actor});item.prepareFinalAttributes?.();return use.call(item.system.activities.get(id),usage,dialog,{...message,data:{...message.data,flags:{...message.data?.flags,[ID]:{...message.data?.flags?.[ID],activityOverrideData:data}}}});};
}
export async function triggerInfernalSave(card){
 if(!authority()||card?.type!=="attack"||locks.has(card.id))return;const activity=card.getAssociatedActivity?.(),item=activity?.item,match=recipe(item);if(match?.key!=="mm-wound-bearded"||activity.id!==match.entry.initialAttackId)return;
 const sent=new Set([...(card.getFlag?.(ID,"infernalSaveTargets")??[]),...(completed.get(card.id)??[])]),hits=Array.from(card.system.evaluatedTargets??[]).filter(t=>t.isMiss===false&&!sent.has(t.token));if(!hits.length)return;locks.add(card.id);
 try{await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);for(const hit of hits){if(!Array.from(card.system.evaluatedTargets??[]).some(t=>t.token===hit.token&&t.isMiss===false))continue;const target=await resolve(hit.token);if(!target?.actor||infernalWounds(target.actor).length)continue;const {data,id}=prepareInfernalData(item,{saveOnly:true}),helper=new CONFIG.Item.documentClass(data,{parent:item.actor});helper.prepareFinalAttributes?.();const descriptor={token:target.uuid,actor:target.actor.uuid,name:target.name,img:target.texture?.src};await helper.system.activities.get(id).use({consume:false,scaling:0,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:[descriptor]},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data}}}});sent.add(target.uuid);completed.set(card.id,new Set(sent));await card.setFlag(ID,"infernalSaveTargets",[...sent]);}}finally{locks.delete(card.id);}
}
async function serial(actor,fn){const task=(actorQueues.get(actor.uuid)??Promise.resolve()).catch(()=>{}).then(fn);actorQueues.set(actor.uuid,task);try{return await task;}finally{if(actorQueues.get(actor.uuid)===task)actorQueues.delete(actor.uuid);}}
export async function applyInfernalLoss(card,{undo=false}={}){
 if(!authority())return;const link=get(card,"infernalLoss"),target=await resolve(link?.target);if(!target?.actor||locks.has("loss:"+card.id))return;locks.add("loss:"+card.id);
 try{await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);return await serial(target.actor,async()=>{const actor=target.actor,history=get(card,"infernalLossApplied"),hp=Number(actor.system.attributes.hp.value);if(undo){if(!history||history.undone)return;const after=Math.min(Number(actor.system.attributes.hp.max??Infinity),hp+history.amount);await actor.update({"system.attributes.hp.value":after},{rsaInfernalHpLoss:true});await card.setFlag(ID,"infernalLossApplied",{...history,undone:true});return;}
 if(history&&!history.undone)return;const effect=await resolve(link.effect);if(!live(effect)||get(effect,"infernalWound").instance!==link.instance)return;const amount=Math.max(0,Number(card.rolls?.[0]?.total??0));if(!Number.isFinite(amount))return;const after=Math.max(0,hp-amount);await actor.update({"system.attributes.hp.value":after},{rsaInfernalHpLoss:true});await card.setFlag(ID,"infernalLossApplied",{before:hp,after,amount:hp-after,undone:false});});}finally{locks.delete("loss:"+card.id);}
}
export async function processInfernalTurn(combat,changes){
 if(!authority()||!combat.started||!combat.combatant?.token||!("turn" in changes||"round" in changes||changes.started===true))return;const target=combat.combatant.token,stamp=combat.id+":"+combat.round+":"+combat.turn;
 for(const effect of infernalWounds(target.actor)){const state=get(effect,"infernalWound");if(triggerEntry(state.key)?.enabled===false||get(effect,"infernalLastTurn")===stamp||locks.has(effect.uuid))continue;locks.add(effect.uuid);try{await effect.setFlag(ID,"infernalLastTurn",stamp);const roll=await new Roll(state.formula).evaluate(),data={type:"base",speaker:ChatMessage.getSpeaker({actor:target.actor,token:target,scene:target.parent}),content:'<div class="rsa-infernal-loss"><h3>Infernal Wound — HP loss</h3><p>This reduces HP directly; temporary HP and damage resistance do not apply.</p>'+await roll.render()+'</div>',rolls:[roll],flags:{[ID]:{infernalLoss:{target:target.uuid,effect:effect.uuid,instance:state.instance,dc:state.dc}}}};ChatMessage.applyMode?.(data,game.settings.get("core","rollMode"));const card=await ChatMessage.create(data);if(game.settings.get(ID,"autoApplyCardDamage")===true)await applyInfernalLoss(card);}finally{locks.delete(effect.uuid);}}
}
export async function stanchInfernalWound(card){
 const link=get(card,"infernalLoss"),effect=await resolve(link?.effect),target=await resolve(link?.target);if(!live(effect)||get(effect,"infernalWound").instance!==link.instance||!target?.actor)return;
 const tokens=Array.from(target.parent?.tokens??[]).filter(t=>t.actor?.isOwner).sort((a,b)=>Number(b.uuid===target.uuid)-Number(a.uuid===target.uuid)),escape=foundry.utils.escapeHTML;if(!tokens.length)return;
 const selected=await foundry.applications.api.DialogV2.wait({window:{title:"Stanch infernal wound"},rejectClose:false,content:'<p>Choose the treating creature. This uses an action; check the 5-foot reach at the table.</p><select name="treatingActor">'+tokens.map(t=>'<option value="'+escape(t.uuid)+'">'+escape(t.name)+'</option>').join("")+'</select>',buttons:[{action:"treat",label:"Wisdom (Medicine)",callback:(_event,button)=>button.form.querySelector('[name="treatingActor"]').value},{action:"cancel",label:"Cancel",callback:()=>null}]});const healer=tokens.find(t=>t.uuid===selected);if(!healer||!live(effect))return;const state=get(effect,"infernalWound");await healer.actor.rollSkill({skill:"med",ability:"wis",target:state.dc},{configure:true},{data:{speaker:ChatMessage.getSpeaker({actor:healer.actor,token:healer,scene:healer.parent}),flags:{[ID]:{infernalTreatment:{effect:effect.uuid,instance:state.instance,healer:healer.uuid}}}}});
}
export async function resolveInfernalTreatment(card){
 if(!authority())return;const link=get(card,"infernalTreatment");if(!link||locks.has(card.id)||!card.rolls?.length)return;const effect=await resolve(link.effect),healer=await resolve(link.healer);if(!live(effect)||get(effect,"infernalWound").instance!==link.instance||!healer?.actor||card.author&&!card.author.isGM&&!healer.actor.testUserPermission(card.author,"OWNER"))return;locks.add(card.id);try{await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);if(live(effect)&&Number(card.rolls[0].total)>=get(effect,"infernalWound").dc)await closeWound(effect);}finally{locks.delete(card.id);}
}
function healingCard(options){return options.origin??options.originatingMessage;}
function spellHealing(card){return card?.getAssociatedActivity?.()?.item?.type==="spell"||triggerEntry(get(card,"recurringTrigger")?.key)?.sourceKind==="recurringHealing";}
export function captureInfernalHealing(actor,amount,updates,options={}){
 delete options.rsaInfernalSpellHeal;
 if(!infernalWounds(actor).length||options.rsaUndoDamage)return;const card=healingCard(options);if(spellHealing(typeof card==="object"?card:null)&&Number(updates["system.attributes.hp.value"])>Number(actor.system.attributes.hp.value))options.rsaInfernalSpellHeal={before:Number(actor.system.attributes.hp.value)};
}
export async function closeHealedInfernalWounds(actor,amount,options={}){
 if(!options.rsaInfernalSpellHeal||Number(actor.system.attributes.hp.value)<=options.rsaInfernalSpellHeal.before||options.rsaUndoDamage)return;const card=healingCard(options);if(!authority()){if(actor.isOwner&&game.users.activeGM)game.socket.emit("module."+ID,{action:"infernalSpellHealed",actor:actor.uuid,card:card?.uuid,user:game.user.id,gm:game.users.activeGM.id,before:options.rsaInfernalSpellHeal.before});return;}
 const message=typeof card==="string"?await resolve(card):card;if(!spellHealing(message))return;await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(message);for(const effect of infernalWounds(actor))await closeWound(effect);
}
export async function receiveInfernalHealing(packet){if(!authority()||packet.gm!==game.user.id)return;const actor=await resolve(packet.actor),user=game.users.get(packet.user);if(!actor||!user?.active||!user.isGM&&!actor.testUserPermission(user,"OWNER"))return;await closeHealedInfernalWounds(actor,-1,{origin:packet.card,rsaInfernalSpellHeal:{before:Number(packet.before)}});}
export function renderInfernalLoss(card,html){const link=get(card,"infernalLoss"),root=html?.[0]??html;if(!link||!root||root.querySelector('[data-rsa-infernal-controls]'))return;const box=document.createElement("div");box.dataset.rsaInfernalControls="";const history=get(card,"infernalLossApplied");const add=(label,fn)=>{const button=document.createElement("button");button.type="button";button.textContent=label;button.addEventListener("click",async event=>{event.preventDefault();button.disabled=true;try{await fn();await ui.chat?.updateMessage?.(card);}catch(error){report(error);}finally{button.disabled=false;}});box.append(button);};if(game.user.isGM)add(history&&!history.undone?"Undo HP loss":"Apply HP loss",()=>applyInfernalLoss(card,{undo:Boolean(history&&!history.undone)}));add("Use action — Stanch wound (Medicine DC "+link.dc+")",()=>stanchInfernalWound(card));(root.querySelector(".message-content")??root).append(box);}
function report(error){console.error("Infernal wounds",error);ui.notifications.error("Infernal wound could not finish: "+error.message);}
Hooks.once("ready",()=>{
 for(const type of Object.values(CONFIG.DND5E.activityTypes))installInfernalPreparation(type.documentClass);
 Hooks.on("preCreateActiveEffect",prepareAppliedWound);Hooks.on("preUpdateActiveEffect",prepareReappliedWound);
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{triggerInfernalSave(card).catch(report);resolveInfernalTreatment(card).catch(report);});
 Hooks.on("updateCombat",(combat,changes)=>processInfernalTurn(combat,changes).catch(report));
 Hooks.on("dnd5e.preApplyDamage",captureInfernalHealing);Hooks.on("dnd5e.applyDamage",(actor,amount,options)=>closeHealedInfernalWounds(actor,amount,options).catch(report));
 for(const event of ["renderChatMessageHTML","dnd5e.renderChatMessage"])Hooks.on(event,renderInfernalLoss);
 Hooks.on("deleteChatMessage",card=>completed.delete(card.id));game.socket.on("module."+ID,packet=>{if(packet?.action==="infernalSpellHealed")receiveInfernalHealing(packet).catch(report);});
});
