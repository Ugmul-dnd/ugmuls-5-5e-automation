import {triggerEntry,triggerKeyForSpell} from "./trigger-library.js";
import {selectSaveUser,sendSavePrompt} from "./save-prompts.js";
const ID="ugmuls-5-5e-automation",running=new Set(),opened=new Set();
const damageEvents=new Set(),damageQueues=new Map();
const savePhase=entry=>entry.escapeCheck?"manualCheck":entry.promptMode==="manual"?"manual":entry.saveCondition==="gmNoLineOfSight"?"condition":"save";
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const active=effect=>effect&&!effect.disabled&&effect.active!==false&&!effect.duration?.expired&&effect.system?.expired!==true;
const originOf=card=>typeof card?.system?.origin==="string"?game.messages.get(card.system.origin):card?.system?.origin;
const report=error=>{console.error("Ugmuls 5.5e Automation | Recurring effect",error);ui.notifications.error("Recurring effect could not finish: "+error.message);};
export function hasExternalTurnAutomation(effect){return Array.from(effect?.changes??effect?.system?.changes??[]).some(change=>/OverTime|macro\.(execute|itemMacro)|onTurn/i.test(change.key??""));}
export async function registerRecurringEffect(effect,{spell,level,sourceCard}={}){
 if(!authority()||!effect||hasExternalTurnAutomation(effect))return;
 const previous=effect.getFlag?.(ID,"recurringEffect");if(previous&&(!sourceCard||previous.sourceCard===sourceCard.uuid))return;
 const key=triggerKeyForSpell(spell,effect),entry=triggerEntry(key);
 if(!entry?.enabled||effect.name!==entry.effectName)return;
 if(entry.oneShot&&sourceCard&&!delayedTargetQualifies(sourceCard,effect.parent,entry))return;
 const save=Array.from(spell.system.activities??[]).find(a=>a.type==="save"&&(a.id===entry.saveActivityId||a.name===entry.saveActivity));
 const dc=entry.saveActivity?Number(entry.sourceKind==="syntheticSave"?spell.actor?.system?.attributes?.spell?.dc:save?.save?.dc?.value):null;if(entry.saveActivity&&(!Number.isFinite(dc)||dc<=0))throw Error(entry.name+" needs a configured save DC.");
 await effect.setFlag(ID,"recurringEffect",{instance:foundry.utils.randomID(),key,spell:spell.uuid,caster:spell.actor?.uuid??spell.parent?.uuid,level:Number(level??spell.system.level),dc,sourceCard:sourceCard?.uuid??effect.system?.origin?.message,region:sourceCard?.getFlag?.(ID,"sourceRegion"),concentration:effect.system?.origin?.effect});
 if(entry.oneShot&&previous)await effect.unsetFlag(ID,"recurringOneShotCard");
 if(entry.oneShot&&effect.duration?.value!=null)await effect.update({duration:{value:null,units:"seconds",expiry:null,expired:false}});
 if(entry.exitRegionEnds&&sourceCard?.getFlag?.(ID,"sourceRegion")){const region=await fromUuid(sourceCard.getFlag(ID,"sourceRegion"));if(!region||!Array.from(region.tokens??[]).some(token=>token.actor?.uuid===effect.parent?.uuid))await effect.delete();}
}
export function delayedTargetQualifies(card,actor,entry){
 const targets=(card.system?.targets??[]).filter(target=>target.actor===actor?.uuid);
 if(entry.initialOutcome==="failure")return targets.some(target=>card.system.outcomes?.get(target.token)==="failure");
 const attacks=card.type==="attack"?[card]:Array.from(card.getAssociatedRolls?.("attack")??[]);
 return attacks.some(attack=>(attack.system.evaluatedTargets??[]).some(target=>target.isMiss===false&&targets.some(t=>t.token===target.token)));
}
export function prepareDelayedEffect(effect){
 const activity=effect.system?.origin?.activity?globalThis.fromUuidSync?.(effect.system.origin.activity,{strict:false}):null;
 const source=effect._stats?.duplicateSource?globalThis.fromUuidSync?.(effect._stats.duplicateSource,{strict:false}):null;
 const spell=activity?.item??source?.parent,entry=triggerEntry(triggerKeyForSpell(spell,effect));
 if(entry?.enabled&&entry.oneShot&&!hasExternalTurnAutomation(effect))effect.updateSource({duration:{value:null,units:"seconds",expiry:null,expired:false}});
}
export async function registerGrappleEscape(effect){
 if(!authority()||!effect||effect.getFlag?.(ID,"recurringEffect")||hasExternalTurnAutomation(effect)||effect.getFlag?.(ID,"grappleMode")!=="grapple"||!triggerEntry("grapple")?.enabled)return;
 const casterRef=effect.getFlag(ID,"grappleCaster"),caster=casterRef?await fromUuid(casterRef):null;if(!caster)return;
 const dc=Number(effect.getFlag(ID,"grappleEscapeDC")??globalThis.Ugmuls55eAutomationGrapple?.grappleDC?.(caster));if(!Number.isFinite(dc)||dc<=0)return;
 await effect.setFlag(ID,"recurringEffect",{instance:foundry.utils.randomID(),key:"grapple",caster:caster.uuid,level:0,dc,sourceCard:effect.system?.origin?.message});
}
async function registerNativeEffect(effect){
 if(!authority())return;
 const originRef=effect.system?.origin?.message,old=effect.getFlag?.(ID,"recurringEffect");if(old&&old.sourceCard===originRef)return;
 if(effect.getFlag?.(ID,"grappleMode")==="grapple")return registerGrappleEscape(effect);
 const activity=effect.system?.origin?.activity?await fromUuid(effect.system.origin.activity):null;
 const source=effect._stats?.duplicateSource?await fromUuid(effect._stats.duplicateSource):null;
 const spell=activity?.item??source?.parent;if(spell?.type!=="spell")return;
 const sourceCard=originRef?await fromUuid(originRef):null;
 await registerRecurringEffect(effect,{spell,level:effect.getFlag?.("dnd5e","spellLevel")??sourceCard?.system?.level,sourceCard});
}
export function buildRecurringItem(spell,entry,record,phase){
 if(entry.sourceKind==="syntheticSave"&&phase!=="damage")return buildSyntheticSaveItem(spell,entry,record);
 const source=Array.from(spell.system.activities??[]).find(a=>a.type===(phase==="damage"?"damage":"save")&&(a.id===(phase==="damage"?entry.damageActivityId:entry.saveActivityId)||a.name===(phase==="damage"?entry.damageActivity:entry.saveActivity)));
 if(!source)throw Error("Missing "+phase+" activity for "+entry.name+". Check the Trigger Automation Library.");
 const data=spell.toObject(),id=source.id;data._id=foundry.utils.randomID();data.name=entry.name+" — "+(phase==="damage"?"Recurring damage":"End effect save");
 const selected=data.system.activities[id];data.system.activities={[id]:selected};selected.effects=[];
 selected.activation={type:"special",override:true};selected.duration={units:"inst",concentration:false,override:true};selected.target={override:true,prompt:false,affects:{type:"creature",count:"1",choice:false},template:{type:""}};selected.range={override:true,units:"any"};
 if(phase!=="damage"){
  selected.damage.parts=[];selected.save.dc={calculation:"",formula:String(record.dc)};
  // AA recognizes the spell name on postUseActivity, including save-only
  // helpers. Disable animation recognition only on these disposable clones.
  const quietAnimation=flags=>({version:Math.max(5,Number(flags?.version)||0),isEnabled:false,isCustomized:false,killAnim:true});
  data.flags??={};data.flags.autoanimations=quietAnimation(data.flags.autoanimations);
  selected.flags??={};selected.flags.autoanimations=quietAnimation(selected.flags.autoanimations);
 }
 else if(entry.damageFormula){selected.damage.parts=[{custom:{enabled:true,formula:entry.damageFormula},types:selected.damage.parts[0]?.types??["fire"],scaling:{mode:""}}];}
 return {data,id};
}
export function buildSyntheticSaveItem(spell,entry,record){
 const id=entry.saveActivityId,quiet={version:5,isEnabled:false,isCustomized:false,killAnim:true};
 return {id,data:{_id:foundry.utils.randomID(),name:entry.name+" � End effect save",type:"feat",img:spell.img,effects:[],flags:{autoanimations:quiet},system:{activities:{[id]:{_id:id,name:entry.saveActivity,type:"save",activation:{type:"special",override:true},duration:{units:"inst",override:true,concentration:false},target:{override:true,prompt:false,affects:{type:"creature",count:"1",choice:false},template:{type:""}},range:{override:true,units:"any"},consumption:{spellSlot:false,targets:[]},effects:[],damage:{onSave:"none",parts:[]},save:{ability:[entry.saveAbility],dc:{calculation:"",formula:String(record.dc)}},flags:{autoanimations:quiet}}}}}};
}
export function buildGrappleEscapeItem(target,record){
 const bonus=key=>Number(target?.system?.abilities?.[key]?.save?.value??target?.system?.abilities?.[key]?.mod??0);
 const ability=bonus("dex")>bonus("str")?"dex":"str",id=foundry.utils.randomID();
 const data={_id:foundry.utils.randomID(),name:"Grapple — Escape",type:"feat",img:"icons/svg/net.svg",flags:{autoanimations:{version:5,isEnabled:false,isCustomized:false,killAnim:true}},effects:[],system:{identifier:"rsa-grapple-escape",activities:{[id]:{_id:id,name:"Escape Grapple",type:"save",activation:{type:"special",override:true},duration:{units:"inst",concentration:false,override:true},target:{override:true,prompt:false,affects:{type:"creature",count:"1",choice:false},template:{type:""}},range:{override:true,units:"any"},consumption:{spellSlot:false,targets:[]},effects:[],damage:{onSave:"none",parts:[]},save:{ability:[ability],dc:{calculation:"",formula:String(record.dc)}},flags:{autoanimations:{version:5,isEnabled:false,isCustomized:false,killAnim:true}}}}}};
 return {data,id};
}
export function buildEscapeCheckItem(spell,entry,record){
 const id=foundry.utils.randomID(),quiet={version:5,isEnabled:false,isCustomized:false,killAnim:true};
 return {id,data:{_id:foundry.utils.randomID(),name:entry.name+" — Escape",type:"feat",img:spell.img,effects:[],flags:{autoanimations:quiet},system:{activities:{[id]:{_id:id,name:"Escape — Athletics",type:"check",activation:{type:"special",override:true},duration:{units:"inst",override:true,concentration:false},target:{override:true,prompt:false,affects:{type:"creature",count:"1",choice:false},template:{type:""}},range:{override:true,units:"any"},consumption:{spellSlot:false,targets:[]},effects:[],check:{ability:"str",associated:["ath"],bonus:"",dc:{calculation:"",formula:String(record.dc)},visible:true},flags:{autoanimations:quiet}}}}}};
}
async function createRecurringCard(effect,token,record,stamp,phase){
 const entry=triggerEntry(record.key);if(!entry?.enabled||!active(effect))return;
 const spell=entry.sourceKind==="grapple"?{actor:await fromUuid(record.caster),system:{level:0}}:await fromUuid(record.spell);if(!spell?.actor)throw Error("The recurring effect’s source caster or spell is unavailable.");
 const {data,id}=entry.sourceKind==="grapple"?buildGrappleEscapeItem(token.actor,record):entry.escapeCheck&&phase!=="damage"?buildEscapeCheckItem(spell,entry,record):buildRecurringItem(spell,entry,record,phase),item=new CONFIG.Item.documentClass(data,{parent:spell.actor});
 const descriptor={token:token.uuid,actor:token.actor.uuid,name:token.name,img:token.texture?.src??token.actor.img};
 const link={effect:effect.uuid,instance:record.instance,stamp,phase,key:record.key,...(stamp.startsWith("damage:")&&entry.damageSaveAdvantage?{advantage:true}:{})};
 const sourceRef=record.sourceCard??effect.system?.origin?.message;
 const source=sourceRef?await fromUuid(sourceRef):null;
 const originalMeta=source?.getFlag?.(ID,"metamagic"),conversion=source?.getFlag?.(ID,"transmutedSpell");
 // Reuse persistent casting choices. Careful Spell's initial-save protection
 // must not turn into automatic success on later repeat saves.
 const inherited={...(originalMeta?{metamagic:{...originalMeta,careful:[]}}:{}),...(conversion?{transmutedSpell:conversion}:{})};
 const result=await item.system.activities.get(id).use({consume:false,scaling:Math.max(0,record.level-Number(spell.system.level)),concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:[descriptor]},flags:{dnd5e:{item:{data}},[ID]:{...inherited,riderTriggered:true,recurringTrigger:link}}}});
 if(!result?.message)throw Error("Recurring "+phase+" card was not created.");
 return result.message;
}
export async function processRecurringTurn(combat,changes){
 if(!authority()||!combat.started||!combat.combatant||!("turn" in changes||"round" in changes||changes.started===true))return;
 const incoming=combat.combatant,prior=combat.previous;
 const subjects=[{combatant:incoming,event:"turnStart",round:combat.round,turn:combat.turn}];
 if(changes.started!==true&&prior?.combatantId&&(prior.combatantId!==incoming.id||prior.round!==combat.round)){const outgoing=combat.combatants.get(prior.combatantId);if(outgoing)subjects.unshift({combatant:outgoing,event:"turnEnd",round:prior.round,turn:prior.turn});}
 for(const subject of subjects){const actor=subject.combatant.actor,token=subject.combatant.token;if(!actor||!token)continue;
 for(const effect of actor.effects??[]){const record=effect.getFlag?.(ID,"recurringEffect"),entry=record&&triggerEntry(record.key);if(!entry?.enabled||entry.event!==subject.event||!active(effect)||hasExternalTurnAutomation(effect))continue;
 const stamp=combat.id+":"+subject.round+":"+subject.turn+":"+subject.event;
 if((entry.oneShot&&effect.getFlag(ID,"recurringOneShotCard"))||effect.getFlag(ID,"recurringLastTrigger")===stamp||running.has(effect.uuid))continue;
 running.add(effect.uuid);try{await effect.setFlag(ID,"recurringLastTrigger",stamp);const card=await createRecurringCard(effect,token,record,stamp,entry.damageActivity?"damage":savePhase(entry));if(card&&entry.oneShot)await effect.setFlag(ID,"recurringOneShotCard",card.uuid??("ChatMessage."+card.id));else if(!card)await effect.unsetFlag(ID,"recurringLastTrigger");}catch(error){await effect.unsetFlag(ID,"recurringLastTrigger");report(error);}finally{running.delete(effect.uuid);}
 }}
}

function damageSubjects(actor){return Array.from(actor?.effects??[]).filter(effect=>{const record=effect.getFlag?.(ID,"recurringEffect"),entry=record&&triggerEntry(record.key);return active(effect)&&entry?.enabled&&(entry.event==="damage"||entry.onDamage)&&!hasExternalTurnAutomation(effect);});}
function tokenFor(actor){const own=actor.token?.document??actor.token;if(own?.actor&&own.uuid)return own;return Array.from(actor.getActiveTokens?.(false,true)??[]).map(token=>token.document??token).find(token=>token.actor&&token.uuid);}
export async function processRecurringDamage(actor,amount,{eventId=foundry.utils.randomID(),sourceCard=null}={}){
 if(!authority()||!Number.isFinite(amount)||amount<=0)return;
 const subjects=damageSubjects(actor).map(effect=>({effect,instance:effect.getFlag(ID,"recurringEffect").instance}));if(!subjects.length)return;
 const key=actor.uuid+":"+eventId;if(damageEvents.has(key))return;damageEvents.add(key);if(damageEvents.size>500)damageEvents.delete(damageEvents.values().next().value);
 const task=(damageQueues.get(actor.uuid)??Promise.resolve()).catch(()=>{}).then(async()=>{
  if(sourceCard)await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(sourceCard);
  if(!authority())return;
  const token=tokenFor(actor);if(!token){ui.notifications.warn("Damage-triggered save needs an active token for "+actor.name+".");return;}
  for(const {effect,instance}of subjects){const record=effect.getFlag(ID,"recurringEffect"),entry=record&&triggerEntry(record.key);if(!active(effect)||record?.instance!==instance||!entry?.enabled||hasExternalTurnAutomation(effect))continue;
   await createRecurringCard(effect,token,record,"damage:"+eventId,savePhase(entry));
  }
 });damageQueues.set(actor.uuid,task);try{await task;}finally{if(damageQueues.get(actor.uuid)===task)damageQueues.delete(actor.uuid);}
}
export async function onRecurringDamageApplied(actor,amount,options={}){
 if(!Number.isFinite(amount)||amount<=0||options.rsaUndoDamage||!damageSubjects(actor).length)return;
 const origin=options.origin??options.originatingMessage;
 const sourceCard=typeof origin==="string"?game.messages.get(origin.replace(/^ChatMessage\./,"")):origin;
 const eventId=foundry.utils.randomID();
 if(authority())return processRecurringDamage(actor,amount,{eventId,sourceCard});
 if(game.users.activeGM&&actor.isOwner)game.socket.emit("module."+ID,{action:"recurringDamageTaken",actorUuid:actor.uuid,amount,eventId,sourceCard:sourceCard?.uuid,userId:game.user.id,gmId:game.users.activeGM.id});
}
export async function receiveRecurringDamage(packet){
 if(!authority()||packet?.action!=="recurringDamageTaken"||packet.gmId!==game.user.id||typeof packet.eventId!=="string"||!packet.eventId||!Number.isFinite(packet.amount)||packet.amount<=0)return;
 const user=game.users.get(packet.userId),actor=await fromUuid(packet.actorUuid);if(!user?.active||!actor||(!user.isGM&&!actor.testUserPermission(user,"OWNER")))return;
 const sourceCard=packet.sourceCard?await fromUuid(packet.sourceCard):null;
 return processRecurringDamage(actor,packet.amount,{eventId:packet.eventId,sourceCard});
}
export function canUseRecurringAction(card,user=game.user){
 if(user?.isGM)return true;
 const token=globalThis.fromUuidSync?.(card?.system.targets?.[0]?.token,{strict:false});
 return Boolean(token?.actor?.testUserPermission?.(user,"OWNER"));
}
export async function receiveRecurringAction(packet){
 if(!authority()||packet.gmId!==game.user.id)return;
 const user=game.users.get(packet.userId),card=game.messages.get(packet.card);
 if(!user?.active||!card)return;
 const token=await fromUuid(card.system.targets?.[0]?.token);
 if(!user.isGM&&!token?.actor?.testUserPermission?.(user,"OWNER"))return;
 await releaseManualRecurringSave(card);
}
export async function releaseManualRecurringSave(card){
 if(!authority()){
  if(!canUseRecurringAction(card)||!game.users.activeGM)return;
  game.socket.emit("module."+ID,{action:"recurringActionRequest",card:card.id,userId:game.user.id,gmId:game.users.activeGM.id});return;
 }
 if(running.has(card?.id))return;
 const link=card?.getFlag?.(ID,"recurringTrigger");if(["manualCheck","check"].includes(link?.phase))return globalThis.Ugmuls55eAutomationEscapeChecks?.prompt(card);if(link?.phase!=="manual")return;
 running.add(card.id);try{
  const effect=await fromUuid(link.effect),entry=triggerEntry(link.key);if(!active(effect)||!entry?.enabled||effect.getFlag(ID,"recurringEffect")?.instance!==link.instance||card.system.outcomes?.has(card.system.targets?.[0]?.token))return;
  await card.setFlag(ID,"recurringTrigger",{...link,phase:"save"});await ui.chat?.updateMessage?.(card);
  const token=await fromUuid(card.system.targets?.[0]?.token);if(token?.actor)await sendSavePrompt(card,token,"spell");
 }finally{running.delete(card.id);}
}

export async function promptRecurringDamage(card){
 const link=card?.getFlag?.(ID,"recurringTrigger");if(card?.type!=="usage"||link?.phase!=="damage"||opened.has(card.id))return;
 const activity=card.getAssociatedActivity?.({scaled:true});if(!activity)return;
 const recipient=selectSaveUser(activity.actor??activity.item?.actor,game.users,game.users.activeGM);if(recipient?.id!==game.user.id)return;
 const effect=await fromUuid(link.effect);if(!active(effect)||!triggerEntry(link.key)?.enabled)return;
 opened.add(card.id);
 // Native damage-only chat actions omit system.origin. Keep the usage link
 // explicit so pending-card completion can advance to the saving throw.
 const dialog=globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("damage",{configure:true})??{configure:true};
 try{await activity.rollDamage({isCritical:false},dialog,{data:{system:{origin:card.id,targets:card.system.targets},flags:{[ID]:{riderTriggered:true,recurringTrigger:link}}}});}catch(error){opened.delete(card.id);throw error;}
}
export async function advanceRecurringCard(card){
 if(!authority())return;
 const usage=card?.type==="usage"?card:originOf(card),link=usage?.getFlag?.(ID,"recurringTrigger");
 if(!link||running.has(usage.id))return;
 const effect=await fromUuid(link.effect);if(!active(effect)||!triggerEntry(link.key)?.enabled)return;
 const record=effect.getFlag(ID,"recurringEffect");if(!record||record.instance!==link.instance)return;
 if(link.phase==="damage"){
  if(card.type!=="damage"||!card.rolls?.length||card.getFlag(ID,"pendingDamage")||usage.getFlag(ID,"recurringSaveCard"))return;
  running.add(usage.id);try{
   await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
   if(!active(effect)||effect.getFlag(ID,"recurringEffect")?.instance!==link.instance)return;
   if(!triggerEntry(record.key)?.saveActivity){
    await usage.setFlag(ID,"recurringSaveCard","none");
    if(triggerEntry(record.key)?.oneShot&&active(effect)&&effect.getFlag(ID,"recurringEffect")?.instance===link.instance)await effect.delete();
    return;
   }
   const token=await fromUuid(usage.system.targets?.[0]?.token);if(!token?.actor)return;
   const save=await createRecurringCard(effect,token,record,link.stamp,savePhase(triggerEntry(record.key)));if(save)await usage.setFlag(ID,"recurringSaveCard",save.id);
  }finally{running.delete(usage.id);}
 }else if(["save","manual","manualCheck","check"].includes(link.phase)&&usage.system.outcomes?.get(usage.system.targets?.[0]?.token)==="success"&&triggerEntry(record.key)?.endOnSuccess){
  running.add(usage.id);try{await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(usage);if(active(effect)&&effect.getFlag(ID,"recurringEffect")?.instance===link.instance){const entry=triggerEntry(record.key);await effect.delete();if(entry?.endConcentrationOnEscape&&record.concentration){const concentration=await fromUuid(record.concentration);if(concentration?.parent?.uuid===record.caster)await concentration.parent.endConcentration(concentration);}}}finally{running.delete(usage.id);}
 }
}
export async function resolveRecurringCondition(card,eligible){
 if(!authority()||running.has(card?.id))return;
 const link=card?.getFlag?.(ID,"recurringTrigger");if(link?.phase!=="condition")return;
 running.add(card.id);try{
  const effect=await fromUuid(link.effect);if(!active(effect)||effect.getFlag(ID,"recurringEffect")?.instance!==link.instance)return;
  await card.setFlag(ID,"recurringTrigger",{...link,phase:eligible?"save":"skipped"});
  await ui.chat?.updateMessage?.(card);
  if(eligible){const token=await fromUuid(card.system.targets?.[0]?.token);if(token?.actor)await sendSavePrompt(card,token,"spell");}
 }finally{running.delete(card.id);}
}
export function renderRecurringCondition(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const entries=[{card:message,root}];
 for(const summary of root.querySelectorAll('.card-summary[data-message-id]')){const card=game.messages.get(summary.dataset.messageId);if(card)entries.push({card,root:summary});}
 for(const entry of entries){
  entry.root.querySelectorAll('[data-rsa-recurring-condition]').forEach(node=>node.remove());
  const link=entry.card.getFlag?.(ID,"recurringTrigger");if(!["condition","skipped","manual","manualCheck","check"].includes(link?.phase)||entry.card.isContentVisible===false||entry.card.system.outcomes?.has(entry.card.system.targets?.[0]?.token))continue;
  const box=document.createElement("div");box.dataset.rsaRecurringCondition="";box.style.cssText="padding:8px;display:grid;gap:6px;";
  if(link.phase==="manualCheck")entry.root.querySelectorAll('[data-action="rollCheck"],[data-forward-action="rollCheck"]').forEach(button=>button.hidden=true);
  const text=document.createElement("p");text.textContent=["manualCheck","check"].includes(link.phase)?"Optional action: attempt a Strength (Athletics) check against the caster’s recorded spell DC. Choose whether to spend the action and roll.":link.phase==="manual"?"Optional action: spend the creature’s action to attempt this saving throw. Choose whether to spend the action and roll.":link.phase==="skipped"?"Repeat save skipped: creature can still see the caster.":"Repeat save pending: the GM must confirm that this creature no longer has line of sight to the caster.";box.append(text);
  if(["manual","manualCheck","check"].includes(link.phase)&&canUseRecurringAction(entry.card)){const button=document.createElement("button");button.type="button";button.textContent=["manualCheck","check"].includes(link.phase)?"Use action — Athletics check":"Use action — Roll save";button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await releaseManualRecurringSave(entry.card);}catch(error){report(error);}finally{button.disabled=false;}});box.append(button);}
  if(link.phase==="condition"&&authority())for(const [label,eligible]of [["No line of sight — Roll save",true],["Can see caster — Skip save",false]]){
   const button=document.createElement("button");button.type="button";button.textContent=label;button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await resolveRecurringCondition(entry.card,eligible);}catch(error){report(error);}finally{button.disabled=false;}});box.append(button);
  }
  (entry.root.querySelector('.chat-card')??entry.root).append(box);
 }
}
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationRecurring={registerRecurringEffect};
 Hooks.on("dnd5e.renderChatMessage",renderRecurringCondition);
 Hooks.on("dnd5e.applyDamage",(actor,amount,options)=>{onRecurringDamageApplied(actor,amount,options).catch(report);});
 game.socket?.on("module."+ID,packet=>{if(packet?.action==="recurringDamageTaken")receiveRecurringDamage(packet).catch(report);if(packet?.action==="recurringActionRequest")receiveRecurringAction(packet).catch(report);});
 Hooks.on("preCreateActiveEffect",prepareDelayedEffect);
 Hooks.on("createActiveEffect",effect=>registerNativeEffect(effect).catch(report));
 Hooks.on("updateActiveEffect",effect=>registerNativeEffect(effect).catch(report));
 Hooks.on("updateCombat",(combat,changes)=>{processRecurringTurn(combat,changes).catch(report);});
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{if(card.type==="usage"&&card.getFlag?.(ID,"recurringTrigger")?.phase==="damage")setTimeout(()=>promptRecurringDamage(card).catch(report),0);advanceRecurringCard(card).catch(report);});
});
