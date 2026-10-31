import {createEventQueue,hasEquivalentActiveEffect,regionOwnsEffect} from './shared-activity-card.js';
import {effectUndoSources,applyEffectWithUndo} from './damage-undo.js';
import {regionManagesCardEffect} from './region-library.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue();
const flag=(card,key)=>card?.getFlag?.(ID,key)??card?.flags?.[ID]?.[key];
const origin=card=>typeof card?.system?.origin==='string'?game.messages.get(card.system.origin.replace(/^ChatMessage\./,'')):card?.system?.origin;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function hitEffectSources(card){
 if(!card||!['attack','damage','healing'].includes(card.type))return [];
 return effectUndoSources(card).filter(source=>source.type==='attack'&&(flag(source,'automaticEffectApplications')?.length??0)>0).map(attack=>({attack,usage:origin(attack)})).filter(({attack,usage})=>usage&&flag(usage,'effectApplyReopened')&&!flag(usage,'outcomeEffectsApplied')&&!flag(usage,'buffAutoApplied')&&attack.getAssociatedActivity?.({scaled:true})?.type==='attack');
}
function refresh(card,sources){const cards=new Map([card,...sources.flatMap(s=>[s.attack,s.usage])].filter(Boolean).map(c=>[c.id,c]));for(const c of cards.values())globalThis.Ugmuls55eAutomationChatRefresh?.card(c);}
export function reapplyHitEffects(card,user=game.user,{actorUuids=null}={}){return enqueue(async()=>{
 if(!authority()||!user?.active||!user.isGM)throw Error('Only the active GM can reapply hit effects.');
 let sources=hitEffectSources(card);if(!sources.length)throw Error('No undone hit effects are available on this card.');
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 sources=hitEffectSources(card);if(!sources.length)throw Error('The effect application changed. Use the current card.');
 const usages=new Map(),allowed=actorUuids?new Set(actorUuids):null;let applied=0;
 try{for(const {attack,usage}of sources){
  let remaining=false;const activity=attack.getAssociatedActivity({scaled:true}),effects=(await activity.getApplicableEffects?.()??[]).filter(e=>!regionManagesCardEffect(activity,e)),ledger=new Set(flag(attack,'automaticEffectApplications')??[]),hits=new Set((attack.system?.evaluatedTargets??[]).filter(t=>t.isMiss===false).map(t=>t.token));
  const tray=document.createElement('effect-application');tray.chatMessage=usage;if(typeof tray._applyEffectToActor!=='function')throw Error('Native effect application is unavailable.');
  for(const target of attack.system?.targets??[]){
   if(!hits.has(target.token))continue;const token=await fromUuid(target.token,{strict:false}),actor=token?.actor;if(!actor||target.actor&&target.actor!==actor.uuid)continue;
   for(const effect of effects){
    if(!ledger.has(JSON.stringify([target.token,effect.uuid])))continue;
    // Do not overwrite an equivalent effect refreshed by another card since Undo.
    if(hasEquivalentActiveEffect(actor,effect)||regionOwnsEffect(token,effect))continue;
    if(allowed&&!allowed.has(actor.uuid)){remaining=true;continue;}
    await applyEffectWithUndo(attack,usage,effect,actor,tray);applied++;
   }
  }
  const prior=usages.get(usage.id);usages.set(usage.id,{usage,remaining:remaining||prior?.remaining});
 }
 for(const {usage,remaining}of usages.values())if(!remaining)await usage.update({['flags.'+ID+'.outcomeEffectsApplied']:true,['flags.'+ID+'.effectApplyReopened']:null});
 return applied;
 }finally{refresh(card,sources);}
});}
export async function reapplyHitEffectsAfterDamage(card,actorUuids,user=game.user){
 if(!authority()||!user?.active||card?.type!=='damage'||!flag(card,'hpApplicationRecorded')||!hitEffectSources(card).length)return 0;
 const allowed=[];for(const uuid of new Set(Array.isArray(actorUuids)?actorUuids:[])){const actor=await fromUuid(uuid,{strict:false});if(actor?.system?.attributes?.hp&&(user.isGM||actor.testUserPermission?.(user,'OWNER')))allowed.push(uuid);}
 if(!allowed.length)return 0;
 // This runs after the shared HP/Undo queue has committed. Calling the effect
 // helper from inside that queue would deadlock its own Undo-record writes.
 try{return await reapplyHitEffects(card,game.user,{actorUuids:allowed});}catch(error){console.error('Damage applied; hit-effect reapplication failed',error);ui.notifications.error('Damage was applied, but its hit effects could not be restored. Use Apply Effects to retry.');return 0;}
}
export function renderHitEffectReapply(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll||!game.user.isGM)return;const entries=[{card:message,root}];for(const node of root.querySelectorAll('.card-summary[data-message-id]')){const card=game.messages.get(node.dataset.messageId);if(card&&!node.hidden)entries.push({card,root:node});}
 for(const {card,root}of entries){const old=root.querySelector('[data-rsa-reapply-hit-effects]');if(card.isContentVisible===false||!hitEffectSources(card).length){old?.remove();continue;}
  // Put the control beside HP/Undo when that attack already has a damage card.
  if(card.type==='attack'&&(origin(card)?.getAssociatedRolls?.('damage')??[]).some(hp=>effectUndoSources(hp).includes(card))){old?.remove();continue;}
  if(old)continue;const face=root.querySelector('.chat-card')??root;let controls=face.querySelector('.rsa-damage-actions');if(!controls){controls=document.createElement('div');controls.className='rsa-attack-actions rsa-damage-actions';face.append(controls);}
  const button=document.createElement('button');button.type='button';button.dataset.rsaReapplyHitEffects='';button.textContent='Apply Effects';button.dataset.tooltip='Reapply the undone attack effects to this card’s recorded hit targets.';button.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(button.disabled)return;button.disabled=true;try{const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'reapplyHitEffects',gm:gm.id,user:game.user.id,card:card.id});else await reapplyHitEffects(card);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});controls.append(button);
 }
}
function report(error){console.error('Reapply hit effects',error);ui.notifications.error(error.message);}
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationHitEffects={afterDamage:reapplyHitEffectsAfterDamage};Hooks.on('dnd5e.renderChatMessage',renderHitEffectReapply);game.socket.on('module.'+ID,packet=>{if(packet?.action!=='reapplyHitEffects'||!authority()||packet.gm!==game.user.id)return;const user=game.users.get(packet.user),card=game.messages.get(packet.card);if(!user?.active||!user.isGM||!card)return;reapplyHitEffects(card,user).catch(report);});});
