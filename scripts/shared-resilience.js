import {isRollAdjustmentLocked} from "./shared-activity-card.js";
import {failureState} from "./bardic-inspiration.js";
import {queueIndomitable,indomitableFeature,fighterSaveBonus} from "./indomitable.js";
import {rerollFocus,restoreFocusTargets} from "./fanatical-focus.js";
import {animateNewSaveDice} from "./save-roll-controls.js";
import {seekingSnapshot} from "./seeking-spell.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
const ID="ugmuls-5-5e-automation",values=v=>Array.from(v?.values?.()??v??[]),doc=t=>t?.document??t;
const actorFor=card=>card?.getAssociatedActor?.()??(card?.speaker?ChatMessage.getSpeakerActor(card.speaker):null);
const inCombat=actor=>game.combat?.started&&values(game.combat.combatants).some(c=>c.actor?.uuid===actor.uuid);
const remaining=feature=>Number(feature?.system?.uses?.value??Number(feature?.system?.uses?.max)-Number(feature?.system?.uses?.spent??0))||0;
export function resilienceRange(source,target){
 source=doc(source);target=doc(target);
 if(!source?.actor||!target?.actor||source.actor.uuid===target.actor.uuid||source.parent?.id!==target.parent?.id||target.hidden||source.disposition===0||source.disposition!==target.disposition)return false;
 const a=source.object,b=target.object;if(!a?.center||!b?.center)return false;
 const units=String(source.parent?.grid?.units??canvas.scene?.grid?.units??'ft').toLowerCase(),limit=/^(m|meters?|metres?)$/.test(units)?18.288:60;
 const distance=canvas.grid.measurePath([a.center,b.center]).distance;
 return Number.isFinite(distance)&&distance<=limit&&!a.checkCollision?.(b.center,{type:'sight',mode:'any'});
}
function visible(card,user){return user?.isGM||!card.blind&&(!card.whisper?.length||card.author?.id===user?.id||card.whisper.some(id=>(id?.id??id)===user?.id));}
export function sharedResilienceCandidates(card,user=game.user,index=0,reservation=null){
 const roll=card?.rolls?.[index];
 if(game.settings.get(ID,'sharedResilienceAutomation')!==true||card?.type!=='save'||!Number.isInteger(index)||index<0||!roll?.d20||!roll._evaluated||!visible(card,user)||card.isContentVisible===false||card.getFlag?.(ID,'indomitable')?.[index]||card.getFlag?.(ID,'sharedResilience')?.[index]||card.getFlag?.(ID,'automaticGrappleFailure')||card.getFlag?.(ID,'carefulSpell')||card.system?.forceSuccess||card.system?.concentrationBroken||isRollAdjustmentLocked(card)||failureState(card,index)!=='failed')return [];
 const recipient=actorFor(card);if(!recipient)return [];
 let target=doc(card.getAssociatedToken?.());
 if(target?.actor?.uuid!==recipient.uuid)target=values(globalThis.canvas?.scene?.tokens).find(t=>t.actor?.uuid===recipient.uuid&&(!card.speaker?.token||t.id===card.speaker.token));
 if(!target)return [];
 const candidates=[],seen=new Set();
 for(const source of values(globalThis.canvas?.scene?.tokens)){
  const actor=source.actor;
  if(!actor||seen.has(actor.uuid)||!(user?.isGM||actor.testUserPermission?.(user,'OWNER'))||['incapacitated','unconscious','dead','stunned','paralyzed','petrified','blinded'].some(s=>actor.statuses?.has(s))||!resilienceRange(source,target))continue;
  const feature=values(actor.items).find(i=>i.type==='feat'&&(i.identifier??i.system?.identifier)==='shared-resilience'),resource=indomitableFeature(actor),bonus=fighterSaveBonus(actor),activity=values(feature?.system?.activities).find(a=>a.id==='odvr99wLYvE8pPWI'||String(a.activation?.type??'').startsWith('reaction'));
  const reserved=reservation?.actor===actor.uuid;
  if(!feature||!resource||!bonus||!activity||!reserved&&remaining(resource)<1||!reserved&&reactionUsed(actor))continue;
  seen.add(actor.uuid);candidates.push({actor,feature,resource,bonus,activity,source,target});
 }
 return candidates;
}
const signature=card=>seekingSnapshot(card)+JSON.stringify(card.rolls.map(roll=>roll.options?.target));
export function applySharedResilience(card,actorUuid,index=0,user=game.user){return queueIndomitable(async()=>{
 let entry=sharedResilienceCandidates(card,user,index).find(e=>e.actor.uuid===actorUuid);
 if(!entry)throw Error('Shared Resilience needs a failed ally save, a visible ally within 60 feet, an Indomitable use and an available Reaction. Undo applied damage/effects first.');
 const before=signature(card);await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 entry=sharedResilienceCandidates(card,user,index).find(e=>e.actor.uuid===actorUuid);if(!entry||signature(card)!==before)throw Error('The save or Banneret eligibility changed. Try again.');
 const {actor,resource,feature,activity,bonus}=entry,spent=Number(resource.system.uses.spent??0),result=await rerollFocus(card.rolls[index],bonus);
 if(signature(card)!==before||!sharedResilienceCandidates(card,user,index).some(e=>e.actor===actor&&e.resource===resource&&e.feature===feature&&e.bonus===bonus)||Number(resource.system.uses.spent??0)!==spent)throw Error('The save or Indomitable resource changed. Try again.');
 let charged=false,committed=false,marker;
 try{
  await resource.update({'system.uses.spent':spent+1});charged=true;
  if(reactionUsed(actor))throw Error('The Banneret Reaction was just used.');
  marker=await recordReactionUse(activity,{}, {message:{id:card.id}});
  if(game.settings.get(ID,'reactionTracker')===true&&inCombat(actor)&&marker?.getFlag?.(ID,'reactionUsage')!==card.id)throw Error('Could not reserve the Banneret Reaction.');
  await animateNewSaveDice(card,result.results,user);
  if(game.dice3d?.showForRoll&&game.user.isGM)await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  const current=sharedResilienceCandidates(card,user,index,{actor:actorUuid}).find(e=>e.actor===actor&&e.resource===resource&&e.feature===feature&&e.bonus===bonus);
  if(!current||signature(card)!==before||Number(resource.system.uses.spent??0)!==spent+1||marker&&(marker.disabled||marker.getFlag?.(ID,'reactionUsage')!==card.id))throw Error('The save or Banneret changed during the reroll. Resources were restored.');
  const rolls=[...card.rolls];rolls[index]=result.roll;
  const record={actor:actor.uuid,name:actor.name,feature:feature.uuid,resource:resource.uuid,bonus,sharedResilience:true};
  const used={...card.getFlag(ID,'sharedResilience'),[index]:record},indomitable={...card.getFlag(ID,'indomitable'),[index]:record},skip=card.getFlag('dice-so-nice','skip');
  try{await card.update({rolls,['flags.'+ID+'.sharedResilience']:used,['flags.'+ID+'.indomitable']:indomitable,'flags.dice-so-nice.skip':true});committed=true;}
  finally{if(skip===undefined)await card.unsetFlag('dice-so-nice','skip');else await card.setFlag('dice-so-nice','skip',skip);}
 }catch(error){if(!committed){if(charged)await resource.update({'system.uses.spent':Math.max(0,Number(resource.system.uses.spent??0)-1)});if(marker?.getFlag?.(ID,'reactionUsage')===card.id)await marker.update({disabled:true});}throw error;}
 if(committed)restoreFocusTargets(card);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
});}
function report(error){console.error('Shared Resilience',error);ui.notifications.error(error.message);}
async function request(card,actor,index,button){button.disabled=true;try{const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'sharedResilience',messageId:card.id,actorUuid:actor.uuid,index,userId:game.user.id,gmId:gm.id});else await applySharedResilience(card,actor.uuid,index);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}}
export function renderSharedResilience(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const{card,node}of entries){
  node.querySelectorAll(':scope > .rsa-shared-resilience').forEach(n=>n.remove());if(card.isContentVisible===false)continue;
  const controls=document.createElement('div');controls.className='rsa-attack-actions rsa-shared-resilience';
  for(const[index]of(card.rolls??[]).entries())for(const candidate of sharedResilienceCandidates(card,game.user,index)){
   const button=document.createElement('button');button.type='button';button.textContent='Shared Resilience +'+candidate.bonus+' — '+candidate.actor.name+(card.rolls.length>1?' · Roll '+(index+1):'');button.dataset.tooltip='Spend this Banneret’s Reaction and one Indomitable use. Reroll this ally’s save with the Banneret’s Fighter-level bonus; keep the new result.';
   button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();request(card,candidate.actor,index,button);});controls.append(button);
  }
  for(const record of Object.values(card.getFlag?.(ID,'sharedResilience')??{})){const label=document.createElement('span');label.textContent='Shared Resilience: rerolled +'+record.bonus+' ('+record.name+')';controls.append(label);}if(controls.childNodes.length)node.append(controls);
 }
}
Hooks.once('init',()=>game.settings.register(ID,'sharedResilienceAutomation',{name:'Shared Resilience Assistance',hint:'Offer an owned Banneret’s Shared Resilience on failed ally saves within 60 feet. Spend the Banneret’s Reaction and Indomitable use, reroll with their Fighter-level bonus, and keep the new result. Require Undo before changing applied damage/effects.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 Hooks.on('dnd5e.renderChatMessage',renderSharedResilience);
 for(const event of ['createItem','updateItem','deleteItem','createActiveEffect','updateActiveEffect','deleteActiveEffect'])Hooks.on(event,(document,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request('sharedResilience',document,changes));
 game.socket.on('module.'+ID,packet=>{
  if(packet?.action==='sharedResilienceError'&&packet.userId===game.user.id){ui.notifications.error(packet.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(packet.messageId));return;}
  if(packet?.action!=='sharedResilience'||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;
  const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;
  applySharedResilience(card,packet.actorUuid,packet.index,user).catch(error=>{report(error);game.socket.emit('module.'+ID,{action:'sharedResilienceError',messageId:card.id,userId:user.id,error:error.message});});
 });
});
