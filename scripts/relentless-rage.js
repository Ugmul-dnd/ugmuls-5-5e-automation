import {isRageEffect} from "./primal-knowledge.js";
import {selectSaveUser} from "./save-prompts.js";
const ID="ugmuls-5-5e-automation",values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,running=new Set(),prompting=new Set(),damageContexts=new Map();
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const enabled=()=>game.settings.get(ID,"relentlessRageAutomation")===true;
const state=actor=>actor?.getFlag?.(ID,"relentlessRage");
const live=e=>e&&!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
const rages=actor=>values(actor?.effects).filter(e=>live(e)&&isRageEffect(actor,e));
const feature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="relentless-rage"&&i.system?.source?.rules!=="2014");
const hp=actor=>Number(actor?.system?.attributes?.hp?.value);
const resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
const pending=s=>s&&["opening","awaiting","resolving","healing"].includes(s.phase);
const dead=actor=>actor.statuses?.has("dead")||Number(actor.system?.attributes?.death?.failure)>=3;
export function relentlessContext(actor){
 const item=feature(actor),rage=rages(actor)[0],drop=actor.getFlag?.(ID,"rageDownedContext");if(!item||!rage||dead(actor)||drop?.instantDeath||drop?.undo)return null;
 const save=values(item.system?.activities).find(a=>a.id==="dnd5eactivity100"&&a.type==="save"),healing=values(item.system?.activities).find(a=>a.id==="Y2xWUsWmpklWLtVT"&&a.type==="heal");
 const dc=Number(save?.save?.dc?.value);
 return save&&healing&&Number.isFinite(dc)&&dc>0?{item,rage,save,healing,dc}:null;
}
function tokenFor(actor){return actor.token?.document??actor.token??values(globalThis.canvas?.scene?.tokens).find(t=>t.actor?.uuid===actor.uuid);}
async function endRage(actor){const ids=rages(actor).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);}
async function downed(actor){await actor.updateDowned?.({rsaRelentlessResolved:true});}
export function captureRageHP(actor,changes,options={}){
 const next=changes['system.attributes.hp.value']??changes.system?.attributes?.hp?.value;
 if(next===undefined||(!rages(actor).length&&!pending(state(actor))&&!actor.getFlag?.(ID,"rageDownedContext")))return;
 options.rsaRageBeforeHP=hp(actor);
 const damage=damageContexts.get(actor.uuid);damageContexts.delete(actor.uuid);
 if(Number(next)===0&&hp(actor)>0){
  const context={instantDeath:damage?.instantDeath===true,undo:damage?.undo===true};
  options.rsaRageInstantDeath=context.instantDeath;options.rsaUndoDamage=context.undo;
  changes["flags."+ID+".rageDownedContext"]=context;
 }else if(Number(next)>0&&actor.getFlag?.(ID,"rageDownedContext"))changes["flags."+ID+".-=rageDownedContext"]=null;
}
export function captureRageDamage(actor,amount,updates,options={}){
 const points=actor.system?.attributes?.hp;
 if(points&&(rages(actor).length||pending(state(actor)))){const instantDeath=amount>0&&amount>=Number(points.value)+Number(points.temp??0)+Number(points.effectiveMax??points.max);options.rsaRageInstantDeath=instantDeath;damageContexts.set(actor.uuid,{instantDeath,undo:options.rsaUndoDamage===true});}
}
export function deferRageUnconscious(effect){
 if(!enabled()||(!game.users.activeGM&&!game.user.isGM)||effect.parent?.documentName!=="Actor")return;
 const actor=effect.parent;
 if(effect.system?.type!=="unconscious"||hp(actor)!==0||!relentlessContext(actor))return;
 const packet={action:"relentlessRageTrigger",actor:actor.uuid,user:game.user.id,gm:game.users.activeGM?.id};
 if(authority())beginRelentless(actor).catch(report);else game.socket.emit("module."+ID,packet);
 return false;
}
export async function beginRelentless(actor){
 if(!enabled()||!authority()||hp(actor)!==0||pending(state(actor))||running.has(actor.uuid))return;
 const context=relentlessContext(actor);if(!context)return;
 const token=tokenFor(actor);if(!token){await endRage(actor);await downed(actor);throw Error("Relentless Rage needs the Barbarian's scene token.");}
 running.add(actor.uuid);const session={id:foundry.utils.randomID(),phase:"opening",feature:context.item.uuid,rage:context.rage.uuid,token:token.uuid,dc:context.dc,spent:Number(context.item.system.uses.spent??0)};
 try{
  await actor.setFlag(ID,"relentlessRage",session);
  const descriptor={token:token.uuid,actor:actor.uuid,name:token.name??actor.name,img:token.texture?.src??actor.img};
  const result=await context.save.use({consume:false,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:[descriptor]},flags:{[ID]:{riderTriggered:true,manualDamageWorkflow:true,relentlessRage:{actor:actor.uuid,session:session.id}}}}});
  if(!result?.message)throw Error("Relentless Rage could not create its save card.");
  const next={...session,phase:"awaiting",card:result.message.id};await actor.setFlag(ID,"relentlessRage",next);
  const user=selectSaveUser(actor,game.users,game.users.activeGM);
  if(user)dispatchPrompt(actor,user).catch(report);
 }catch(error){await actor.setFlag(ID,"relentlessRage",{...session,phase:"error"});await endRage(actor);await downed(actor);throw error;}
 finally{running.delete(actor.uuid);}
}
async function dispatchPrompt(actor,user){const s=state(actor);if(!s||s.phase!=="awaiting")return;const packet={action:"relentlessRagePrompt",actor:actor.uuid,session:s.id,user:user.id,source:game.user.id};if(user.id===game.user.id)await promptRelentless(packet);else game.socket.emit("module."+ID,packet);}
export async function promptRelentless(packet){
 if(packet.user!==game.user.id||game.users.activeGM?.id!==packet.source)return;
 const actor=resolve(packet.actor),s=state(actor);if(!actor||!actor.isOwner||s?.id!==packet.session||s.phase!=="awaiting"||prompting.has(s.id)||hp(actor)!==0)return;
 const token=resolve(s.token),item=values(actor.items).find(i=>i.uuid===s.feature),save=values(item?.system?.activities).find(a=>a.id==="dnd5eactivity100");if(!save||!token)return;
 prompting.add(s.id);try{
  const dialog=globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("save",{configure:true})??{configure:true};
  await actor.rollSavingThrow({ability:"con",target:s.dc},dialog,{data:{speaker:ChatMessage.getSpeaker({actor,token,scene:token.parent}),system:{...save.messageSources,origin:s.card},flags:{[ID]:{relentlessRage:{actor:actor.uuid,session:s.id},riderTriggered:true}}}});
 }finally{prompting.delete(s.id);}
}
export async function finishRelentless(card){
 if(!enabled()||!authority()||card?.type!=="save"||!card.rolls?.[0]?._evaluated)return;
 const origin=typeof card.system?.origin==="string"?game.messages.get(card.system.origin.replace(/^ChatMessage\./,"")):card.system?.origin;
 const link=card.getFlag?.(ID,"relentlessRage")??origin?.getFlag?.(ID,"relentlessRage"),actor=resolve(link?.actor),s=state(actor);
 if(!actor||!s||s.id!==link.session||s.phase!=="awaiting"||running.has(actor.uuid))return;
 const roll=card.rolls[0];if(Number(roll.options?.target)!==s.dc)return;
 running.add(actor.uuid);
 try{
  await actor.setFlag(ID,"relentlessRage",{...s,phase:"resolving",save:card.id});
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  if(hp(actor)!==0||dead(actor)||!rages(actor).some(e=>e.uuid===s.rage)){await actor.setFlag(ID,"relentlessRage",{...s,phase:"canceled"});if(hp(actor)===0)await endRage(actor);return;}
  const context=relentlessContext(actor);if(!context||context.item.uuid!==s.feature||Number(context.item.system.uses.spent??0)!==s.spent)throw Error("Relentless Rage's tracker changed while its save was pending. Resolve this card manually.");
  // Increment the native item tracker once per completed attempt. Its own DC
  // formula and rest recovery supply the next DC; no separate DC counter.
  await context.item.update({"system.uses.spent":s.spent+1});
  if(roll.total>=s.dc){
   await actor.setFlag(ID,"relentlessRage",{...s,phase:"healing",save:card.id});
   const target={token:s.token,actor:actor.uuid,name:actor.name};
   const result=await context.healing.rollDamage({isCritical:false},{configure:false},{data:{system:{origin:s.card,targets:[target]},flags:{[ID]:{riderTriggered:true,manualDamageWorkflow:true,relentlessRageHealing:s.id}}}});
   const healingCard=result?.message??(result?.[0]?.parent?.documentName==="ChatMessage"?result[0].parent:null)??values(game.messages).filter(m=>m.getFlag?.(ID,"relentlessRageHealing")===s.id).at(-1);
   if(!healingCard?.rolls?.length)throw Error("Relentless Rage could not create its healing roll.");
   await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(healingCard);
   const amount=healingCard.rolls.reduce((sum,r)=>sum+Math.max(0,Number(r.total)||0),0);
   if(hp(actor)===0&&!dead(actor))await actor.applyDamage(-amount,{origin:healingCard,rsaRelentlessHealing:true});
   await actor.setFlag(ID,"relentlessRage",{...s,phase:"success",save:card.id,healing:healingCard.id});
   await downed(actor);
  }else{
   await endRage(actor);await actor.setFlag(ID,"relentlessRage",{...s,phase:"failed",save:card.id});await downed(actor);
  }
  globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(s.card));
 }catch(error){await actor.setFlag(ID,"relentlessRage",{...s,phase:"error",save:card.id});await endRage(actor);await downed(actor);throw error;}
 finally{running.delete(actor.uuid);}
}
export async function handleRageKO(actor,changes={},options={}){
 if(!enabled()||!authority())return;
 if(!rages(actor).length){const current=state(actor);if(pending(current)&&!running.has(actor.uuid)){await actor.setFlag(ID,"relentlessRage",{...current,phase:"canceled"});if(hp(actor)===0)await downed(actor);}return;}
 if(dead(actor)||actor.getFlag?.(ID,"rageDownedContext")?.instantDeath||actor.getFlag?.(ID,"rageDownedContext")?.undo){await endRage(actor);return;}
 const s=state(actor);if(pending(s))return;
 const drop=options.rsaRageBeforeHP>0&&hp(actor)===0&&(changes['system.attributes.hp.value']!==undefined||changes.system?.attributes?.hp?.value!==undefined);
 if(drop&&!options.rsaUndoDamage){if(!options.rsaRageInstantDeath&&relentlessContext(actor))await beginRelentless(actor);else await endRage(actor);return;}
 const persistent=values(actor.items).some(i=>key(i)==="persistent-rage");
 if(actor.statuses?.has("unconscious")||!persistent&&actor.statuses?.has("incapacitated")){
  if(hp(actor)===0&&!options.rsaRageInstantDeath&&relentlessContext(actor))await beginRelentless(actor);else await endRage(actor);
 }
}
export function renderRelentless(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const cards=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const{card,node}of cards){node.querySelectorAll(':scope > .rsa-relentless-rage').forEach(n=>n.remove());if(card.type!=="usage"||card.isContentVisible===false)continue;
  const link=card.getFlag?.(ID,"relentlessRage"),actor=resolve(link?.actor),s=state(actor);if(!actor||s?.id!==link.session||s.phase!=="awaiting"||!actor.isOwner)continue;
  const div=document.createElement('div');div.className='rsa-attack-actions rsa-relentless-rage';
  for(const[action,label]of [['roll','Roll Relentless Rage'],['decline','Decline — End Rage']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>{button.disabled=true;const packet={action:'relentlessRageRequest',actor:actor.uuid,session:s.id,user:game.user.id,choice:action,gm:game.users.activeGM?.id};if(authority())requestRelentless(packet).catch(report);else game.socket.emit('module.'+ID,packet);});div.append(button);}node.append(div);
 }
}
async function requestRelentless(packet){
 if(!authority()||packet.gm!==game.user.id)return;
 const actor=resolve(packet.actor),s=state(actor),user=game.users.get(packet.user);if(!actor||!user?.active||!actor.testUserPermission(user,'OWNER')||s?.id!==packet.session||s.phase!=="awaiting")return;
 if(packet.choice==='decline'){await endRage(actor);await actor.setFlag(ID,'relentlessRage',{...s,phase:'declined'});await downed(actor);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(s.card));}
 else if(packet.choice==='roll')await dispatchPrompt(actor,user);
}
function report(error){console.error('Relentless Rage',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'relentlessRageAutomation',{name:'Rage KO and Relentless Rage',hint:'End Rage on Unconscious (or Incapacitated without Persistent Rage). At 0 HP while raging, offer Relentless Rage’s native save to the owner, track its increasing DC on the item, and automatically apply native healing on success. Keep Rage pending the save; failure or decline ends it.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 Hooks.on('preUpdateActor',captureRageHP);Hooks.on('dnd5e.preApplyDamage',captureRageDamage);Hooks.on('preCreateActiveEffect',deferRageUnconscious);
 Hooks.on('updateActor',(actor,changes,options)=>handleRageKO(actor,changes,options).catch(report));
 for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect'])Hooks.on(event,effect=>{if(effect.parent?.documentName==='Actor')handleRageKO(effect.parent).catch(report);});
 for(const event of ['createChatMessage','updateChatMessage'])Hooks.on(event,card=>finishRelentless(card).catch(report));
 Hooks.on('dnd5e.renderChatMessage',renderRelentless);
 game.socket.on('module.'+ID,packet=>{
  if(packet?.action==='relentlessRagePrompt')promptRelentless(packet).catch(report);
  if(packet?.action==='relentlessRageRequest')requestRelentless(packet).catch(report);
  if(packet?.action==='relentlessRageTrigger'&&authority()&&packet.gm===game.user.id){const actor=resolve(packet.actor),user=game.users.get(packet.user);if(actor&&user?.active&&actor.testUserPermission(user,'OWNER'))beginRelentless(actor).catch(report);}
 });
});
