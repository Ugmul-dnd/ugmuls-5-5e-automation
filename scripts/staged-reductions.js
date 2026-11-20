// Timing: outcome / attack-hit. Reserve a choice before damage exists, then
// reuse the feature's authoritative reduction workflow on its exact HP card.
import {parryCandidate,applyParry} from './parry.js';
import {deflectCandidates,applyDeflect} from './deflect-attacks.js';
import {reactionUsed,recordReactionUse} from './reaction-tracker.js';
import {createEventQueue,isRollAdjustmentLocked} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',queue=createEventQueue(),jobs=new Map();
const flag=(c,k)=>c?.getFlag?.(ID,k);
const active=()=>game.user?.isGM&&game.users.activeGM?.id===game.user.id;
export function reductionAttack(card){
 if(card?.type==='attack')return card;
 const explicit=flag(card,'damageAttackId');if(explicit)return game.messages.get(explicit);
 const ref=card?.system?.origin,source=typeof ref==='string'?game.messages.get(ref.replace(/^ChatMessage\./,'')):ref;
 if(source?.type==='attack')return source;
 const attacks=Array.from(source?.getAssociatedRolls?.('attack')??[]);return attacks.length===1?attacks[0]:null;
}
export function reductionSelections(card){const attack=reductionAttack(card);return [flag(attack,'selectedReduction'),...(flag(attack,'additionalReductions')??[])].filter(Boolean);}
export function reductionSelection(card,feature,actor){return reductionSelections(card).find(c=>(!feature||c.feature===feature)&&(!actor||c.actor===(actor.uuid??actor))&&c.status==='reserved')??null;}
async function updateSelection(attack,choice,changes){const primary=flag(attack,'selectedReduction');if(primary?.actor===choice.actor&&primary.feature===choice.feature)await attack.setFlag(ID,'selectedReduction',{...primary,...changes});else await attack.setFlag(ID,'additionalReductions',(flag(attack,'additionalReductions')??[]).map(c=>c.actor===choice.actor&&c.feature===choice.feature?{...c,...changes}:c));}
export function reservedMarker(card,actor){
 if(!actor)return null;
 const attack=reductionAttack(card),choice=reductionSelection(card,null,actor),marker=reactionUsed(actor);
 return choice?.status==='reserved'&&choice.actor===actor.uuid&&marker?.getFlag?.(ID,'reactionUsage')===attack.id?marker:null;
}
// Eligibility-only preview: no dice are evaluated or shown. Damage types come
// from the native scaled activity; unknown types do not offer Deflect Attacks.
export function reductionChoices(attack,user=game.users.activeGM){
 if(attack?.type!=='attack'||attack.system?.targets?.length!==1||!attack.system?.evaluatedTargets?.some(t=>t.isMiss===false)||isRollAdjustmentLocked(attack))return [];
 const activity=attack.getAssociatedActivity?.({scaled:true}),parts=Array.from(activity?.damage?.parts??[]);
 if(activity?.damage?.includeBase&&activity.item?.system?.damage?.base)parts.push(activity.item.system.damage.base);
 if(!parts.length)return [];
 const types=[...new Set(parts.flatMap(p=>Array.from(p.types??[])))];
 const preview={rsaReductionPreview:true,type:'damage',system:{origin:attack,targets:attack.system.targets},rolls:(types.length?types:['']).map(type=>({_evaluated:true,total:1,options:{type}})),getAssociatedActivity:()=>activity,getAssociatedToken:()=>attack.getAssociatedToken?.(),getFlag:(scope,key)=>scope===ID&&key==='damageAttackId'?attack.id:undefined};
 const choices=[];
 for(const c of deflectCandidates(preview,user))choices.push({feature:'deflect',actor:c.actor.uuid,token:c.token.uuid,activity:c.reduce,label:c.energy?'Deflect Energy':'Deflect Attacks'});
 for(const c of globalThis.Ugmuls55eAutomationProtectiveField?.candidates?.(preview,user)??[])choices.push({feature:'protectiveField',actor:c.actor.uuid,token:c.token.uuid,target:c.target.uuid,activity:c.reaction,itemUuid:c.resource.uuid,label:'Protective Field — '+c.actor.name+' → '+(c.target.name??c.target.actor?.name??'Target'),description:'Use your Reaction and one Psionic Energy Die to reduce damage to '+(c.target.name??c.target.actor?.name??'this target')+' by the die plus Intelligence'});
 for(const c of globalThis.Ugmuls55eAutomationProjectedWard?.candidates?.(preview,user)??[])choices.push({feature:'projectedWard',actor:c.actor.uuid,token:c.token.uuid,target:c.target.uuid,activity:c.activity,itemUuid:c.item.uuid,label:'Projected Ward — '+c.actor.name+' → '+(c.target.name??c.target.actor?.name??'Target'),description:'Use your Reaction to protect '+(c.target.name??c.target.actor?.name??'this target')+' with your Arcane Ward'});
 for(const c of globalThis.Ugmuls55eAutomationSentinel?.candidates?.(preview,user)??[])choices.push({feature:'sentinelDeath',actor:c.actor.uuid,token:c.token,target:c.target,activity:c.activity,itemUuid:c.feature.uuid,label:"Sentinel at Death's Door — "+c.actor.name,description:'Use your Reaction and one feature use to halve damage to '+(fromUuidSync(c.target,{strict:false})?.name??'the Bloodied target')+' before Resistance.'});
 const selected=reductionSelections(attack);return choices.filter(c=>!selected.some(s=>s.status==='reserved'&&(s.actor===c.actor||s.feature===c.feature)));
}
export function reserveReduction(attack,feature,token,user){return queue(async()=>{
 const timing=globalThis.Ugmuls55eAutomationReactionTiming;
 if(!active()||!user?.active||!timing?.defenseWindow(attack)||!timing.defenseAllowed(attack,feature,token))throw Error('This defense opportunity is closed.');
 const choice=reductionChoices(attack,user).find(c=>c.feature===feature&&c.token===token);
 if(!choice)throw Error('The defense or Reaction is no longer available.');
 if(flag(attack,'shieldTimingPending')||flag(attack,'duelistAdjusting'))throw Error('Another defense is resolving.');
 const window=timing.defenseWindow(attack)&&flag(attack,'reactionTimingWindow')?.id;
 await attack.setFlag(ID,'shieldTimingPending',{reduction:true,window});
 let marker;
 try{
 if(flag(attack,'reactionTimingWindow')?.id!==window||!timing.defenseWindow(attack)||flag(attack,'duelistAdjusting'))throw Error('The defense window changed.');
 marker=await recordReactionUse(choice.activity,{}, {message:attack});
 const actor=fromUuidSync(choice.actor,{strict:false});
 const tracked=game.settings.get(ID,'reactionTracker')===true&&game.combat?.started&&Array.from(game.combat.combatants??[]).some(c=>c.actor?.uuid===actor?.uuid);
 if(tracked&&marker?.getFlag?.(ID,'reactionUsage')!==attack.id)throw Error('Could not reserve this Reaction.');
 try{const selection={feature,token,actor:choice.actor,status:'reserved',marker:marker?.uuid??null,...(choice.target?{target:choice.target}:{})};if(!flag(attack,'selectedReduction'))await attack.setFlag(ID,'selectedReduction',selection);else await attack.setFlag(ID,'additionalReductions',[...(flag(attack,'additionalReductions')??[]),selection]);}
 catch(error){if(marker)await marker.update({disabled:true});throw error;}
 }finally{await attack.setFlag(ID,'shieldTimingPending',null);}
 await timing.complete(attack,feature);
});}
export async function settleReduction(card){
 if(!active()||card?.type!=='damage'||flag(card,'pendingDamage')||!card.rolls?.length)return;
 const attack=reductionAttack(card),choice=reductionSelection(card);
 if(choice?.status!=='reserved'||!globalThis.Ugmuls55eAutomationReactionTiming?.held(card))return;
 if(jobs.has(attack.id))return jobs.get(attack.id);
 if(card.rolls.every(r=>Number(r.total)<=0)){await cancelReduction(card,game.user);await globalThis.Ugmuls55eAutomationReactionTiming.complete(card,choice.feature);return;}
 const job=(async()=>{
  try{
   for(const choice of reductionSelections(card).filter(c=>c.status==='reserved')){
   if(card.rolls.every(r=>Number(r.total)<=0)){const actor=fromUuidSync(choice.actor,{strict:false}),marker=reservedMarker(card,actor);if(marker)await marker.update({disabled:true});await updateSelection(attack,choice,{status:'canceled'});continue;}
   // Compatibility: finish Song reservations created before its post-damage move.
   if(choice.feature==='sentinelDeath')await globalThis.Ugmuls55eAutomationSentinel.apply(card,choice.actor,game.user);
   else if(choice.feature==='songDefense')await globalThis.Ugmuls55eAutomationSongDefense.apply(card,{target:choice.target,slot:choice.slot},game.user);
   else if(choice.feature==='projectedWard')await globalThis.Ugmuls55eAutomationProjectedWard.apply(card,{actor:choice.actor,target:choice.target},game.user);
   else if(choice.feature==='protectiveField')await globalThis.Ugmuls55eAutomationProtectiveField.apply(card,choice.actor,choice.target,game.user);
   else if(choice.feature==='cuttingDamage')await globalThis.Ugmuls55eAutomationCutting.apply(card,choice.actor,0,game.user);
   else if(choice.feature==='parry')await applyParry(card,choice.actor,game.user);
   else await applyDeflect(card,choice.token,game.user);
   await updateSelection(attack,choice,{status:'committed',damage:card.id});
   }
   await globalThis.Ugmuls55eAutomationReactionTiming.complete(card,choice.feature);
  }catch(error){
   // Keep the result concealed on failure. Never silently apply full damage
   // after a chosen defense failed. The GM can cancel the reservation to retry.
   ui.notifications.error(error.message);throw error;
  }
 })();jobs.set(attack.id,job);try{return await job;}finally{jobs.delete(attack.id);}
}
export function cancelReduction(card,user){return queue(async()=>{
 const attack=reductionAttack(card),choice=reductionSelection(card);
 if(!active()||!user?.active||choice?.status!=='reserved')return;
 const actor=fromUuidSync(choice.actor,{strict:false});
 if(!user.isGM&&attack.author?.id!==user.id&&!attack.getAssociatedActor?.()?.testUserPermission?.(user,'OWNER'))throw Error('This damage request is not yours.');
 if(jobs.has(attack.id))throw Error('Wait for the reduction to finish.');
 for(const pending of reductionSelections(card).filter(c=>c.status==='reserved')){const actor=fromUuidSync(pending.actor,{strict:false}),marker=reservedMarker(card,actor);if(marker)await marker.update({disabled:true});await updateSelection(attack,pending,{status:'canceled'});}
 await attack.setFlag(ID,'selectedReduction',null);await attack.setFlag(ID,'additionalReductions',null);
});}
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationStagedReductions={reserve:reserveReduction,choices:reductionChoices,selections:reductionSelections,selection:reductionSelection,ownsReservation:(c,a)=>!!reservedMarker(c,a),marker:reservedMarker,settle:settleReduction,cancel:card=>{
  if(active())return cancelReduction(card,game.user);
  game.socket.emit('module.'+ID,{action:'cancelReduction',card:card.id,user:game.user.id,gm:game.users.activeGM?.id});
 }};
 Hooks.on('createChatMessage',card=>settleReduction(card).catch(console.error));
 Hooks.on('updateChatMessage',(card,changes)=>{
  // Only publication changes can start a reduction; ordinary flag/render
  // updates do not run feature eligibility again.
  if(changes&&!Object.hasOwn(changes,'rolls')&&!Object.hasOwn(changes.flags?.[ID]??{},'pendingDamage')&&!Object.hasOwn(changes,'flags.'+ID+'.pendingDamage'))return;
  settleReduction(card).catch(console.error);
 });
 Hooks.on('deleteChatMessage',card=>{if(card.type==='attack')cancelReduction(card,game.user).catch(console.error);});
 game.socket.on('module.'+ID,packet=>{
  if(!active()||packet?.gm!==game.user.id||!['reserveReduction','cancelReduction'].includes(packet.action))return;
  const card=game.messages.get(packet.card),user=game.users.get(packet.user);if(!card||!user?.active)return;
  const task=packet.action==='reserveReduction'?reserveReduction(card,packet.feature,packet.token,user):cancelReduction(card,user);
  task.catch(error=>game.socket.emit('module.'+ID,{action:'reactionTimingError',card:card.id,user:user.id,error:error.message}));
 });
});
