import {createEventQueue,isRollAdjustmentLocked,linkedHpCards} from './shared-activity-card.js';
import {updateSaveMode,saveModeLocked} from './save-roll-controls.js';
import {reactionUsed,recordReactionUse} from './reaction-tracker.js';
import {withinWrathRange} from './wrath-of-the-sea.js';
import {omenRollSnapshot} from './cosmic-omen.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),jobs=new WeakMap();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],enabled=()=>game.settings.get(ID,'restoreBalanceAutomation')===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),resolve=id=>{try{return globalThis.fromUuidSync?.(id,{strict:false});}catch{return null;}};
const owns=(a,u)=>!!u?.active&&(u.isGM||a?.testUserPermission?.(u,'OWNER')),unable=a=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>a?.statuses?.has(s));
export const balanceFeature=a=>values(a?.items).find(i=>i.type==='feat'&&(i.identifier??i.system?.identifier)==='restore-balance'&&i.system?.source?.rules!=='2014');
const remaining=i=>Math.max(0,Number(i?.system?.uses?.value??(Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0)))||0),activityFor=i=>values(i?.system?.activities).find(a=>String(a.activation?.type).startsWith('reaction'));
const visible=(c,u)=>c?.isContentVisible!==false&&(u?.isGM||!c.blind&&(!c.whisper?.length||c.author?.id===u?.id||c.whisper.some(w=>(w.id??w)===u?.id)));
const origin=c=>typeof c?.system?.origin==='string'?game.messages.get(c.system.origin.replace(/^ChatMessage\./,'')):c?.system?.origin;
export function balanceSnapshot(card){
 if(!enabled()||!['attack','save'].includes(card?.type))return null;const ref=card.getAssociatedToken?.(),actor=card.getAssociatedActor?.(),target=ref?.document??ref??actor?.token;if(!target)return {entries:[]};
 const entries=[],seen=new Set();for(const token of values(target.parent?.tokens)){
 const a=token.actor,feature=balanceFeature(a);if(!a||seen.has(a.uuid)||!feature||!activityFor(feature)||unable(a)||reactionUsed(a)||remaining(feature)<1||a.statuses?.has('blinded')||token.uuid!==target.uuid&&(target.hidden||!withinWrathRange(token,target,60)))continue;
 seen.add(a.uuid);entries.push({actor:a.uuid,feature:feature.uuid,token:token.uuid,target:target.uuid,name:a.name,img:feature.img});
 }return {entries};
}
export function captureBalance(card){
 if(jobs.has(card))return jobs.get(card);const job=(async()=>{if(!authority()||card.author?.isGM&&flag(card,'restoreBalanceSnapshot')!==undefined)return;const snapshot=balanceSnapshot(card);if(!snapshot)return;if(snapshot.entries.length||flag(card,'restoreBalanceSnapshot')!==undefined)await card.setFlag(ID,'restoreBalanceSnapshot',snapshot);if(snapshot.entries.length)globalThis.Ugmuls55eAutomationChatRefresh?.card(card);})();jobs.set(card,job);return job;
}
export function balanceCandidates(card,index=0,user=game.user){
 const roll=card?.rolls?.[index];if(!enabled()||!visible(card,user)||!['attack','save'].includes(card?.type)||!Number.isInteger(index)||index<0||!roll?._evaluated||!roll.d20||![1,-1].includes(roll.options?.advantageMode)||saveModeLocked(card,index)||flag(card,'carefulSpell')||flag(card,'automaticGrappleFailure'))return [];
 // Only consult the creation-time snapshot: no token, distance, or sight lookup during renders/clicks.
 return (flag(card,'restoreBalanceSnapshot')?.entries??[]).flatMap(s=>{const actor=resolve(s.actor),feature=resolve(s.feature),activity=activityFor(feature);return actor&&owns(actor,user)&&balanceFeature(actor)?.uuid===feature?.uuid&&activity&&!unable(actor)&&!reactionUsed(actor)&&remaining(feature)>0?[{...s,actor,feature,activity}]:[];});
}
export function balanceDisabled(card){return isRollAdjustmentLocked(card)||[card,origin(card)].some(c=>flag(c,'outcomeEffectsApplied')===true||(flag(c,'effectUndoHistory')?.length??0)>0)?'Effect/Damage already processed; ask GM to Undo first':null;}
export function balanceReady(card){
 const parent=origin(card),attack=game.messages.get(flag(card,'damageAttackId')),root=attack??parent??card;return ![card,root,...values(root?.getAssociatedRolls?.('save'))].some(c=>flag(c,'restoreBalanceAdjusting'));
}
export function applyBalance(card,actorUuid,index=0,user=game.user){return enqueue(async()=>{
 if(!authority())throw Error('A connected GM is required for Restore Balance.');let entry=balanceCandidates(card,index,user).find(e=>e.actor.uuid===actorUuid);if(!entry)throw Error('Restore Balance is unavailable for this roll.');let reason=balanceDisabled(card);if(reason)throw Error(reason);
 const before=omenRollSnapshot(card);await card.setFlag(ID,'restoreBalanceAdjusting',true);let charged=false,committed=false,marker;
 try{await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);entry=balanceCandidates(card,index,user).find(e=>e.actor.uuid===actorUuid);if(!entry||omenRollSnapshot(card)!==before)throw Error('The roll or Restore Balance changed. Try again.');reason=balanceDisabled(card);if(reason)throw Error(reason);
 await entry.feature.update({'system.uses.spent':Number(entry.feature.system.uses.spent??0)+1});charged=true;if(reactionUsed(entry.actor))throw Error('Reaction already used.');marker=await recordReactionUse(entry.activity,{}, {message:card});
 const participant=globalThis.Ugmuls55eAutomationCompanions?.effectiveCombatant(entry.actor,game.combat)??values(game.combat?.combatants).find(c=>c.actor?.uuid===actorUuid);if(game.settings.get(ID,'reactionTracker')===true&&game.combat?.started&&participant&&marker?.getFlag?.(ID,'reactionUsage')!==card.id)throw Error('Could not reserve the Sorcerer’s Reaction.');
 if(omenRollSnapshot(card)!==before||balanceDisabled(card)||unable(entry.actor)||!owns(entry.actor,user)||balanceFeature(entry.actor)?.uuid!==entry.feature.uuid)throw Error('The roll or Sorcerer changed. The use was restored.');
 const records=structuredClone(flag(card,'restoreBalanceUsed')??{});records[index]={actor:actorUuid,name:entry.actor.name};const result=await updateSaveMode(card,0,index,game.user,{updates:{['flags.'+ID+'.restoreBalanceUsed']:records},validate:()=>omenRollSnapshot(card)===before&&!balanceDisabled(card)&&!unable(entry.actor)&&owns(entry.actor,user)});if(!result)throw Error('The roll could not be adjusted. The use was restored.');committed=true;
 }catch(error){if(charged&&!committed){await entry.feature.update({'system.uses.spent':Math.max(0,Number(entry.feature.system.uses.spent??0)-1)});if(marker?.getFlag?.(ID,'reactionUsage')===card.id)await marker.update({disabled:true});}throw error;}
 finally{await card.setFlag(ID,'restoreBalanceAdjusting',false);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);for(const hp of linkedHpCards(card))globalThis.Ugmuls55eAutomationChatRefresh?.card(hp);}
});}
function requestBalance(card,entry,index){const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id){game.socket.emit('module.'+ID,{action:'restoreBalance',gm:gm.id,user:game.user.id,card:card.id,actor:entry.actor.uuid,index});return Promise.resolve();}return applyBalance(card,entry.actor.uuid,index);}
export function renderBalance(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;const cards=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of cards){for(const old of node.querySelectorAll(':scope > .rsa-restore-balance'))old.remove();if(!enabled()||!visible(card,game.user))continue;const row=document.createElement('div');row.className='rsa-attack-actions rsa-restore-balance';for(let index=0;index<(card.rolls?.length??0);index++){
 for(const entry of balanceCandidates(card,index)){const button=document.createElement('button'),reason=balanceDisabled(card);button.type='button';button.textContent='Restore Balance — '+entry.name+(card.rolls.length>1?' · Roll '+(index+1):'');button.disabled=!!reason||!!flag(card,'restoreBalanceAdjusting');button.dataset.tooltip=reason??'Spend one use and your combat Reaction. Force Normal using the first original d20.';button.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await requestBalance(card,entry,index);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});row.append(button);}
 const used=flag(card,'restoreBalanceUsed')?.[index];if(used){const label=document.createElement('span');label.textContent='Restore Balance — '+used.name+': Normal'+(card.rolls.length>1?' · Roll '+(index+1):'');row.append(label);}
 }if(row.childNodes.length)node.append(row);}
}
function report(error){console.error('Restore Balance',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'restoreBalanceAutomation',{name:'Clockwork: Restore Balance',hint:'Snapshot eligible Sorcerers within 60 feet when an attack or save card is created. Offer a Reaction button to spend a use and force Normal using the first original d20. Applied damage/effects lock the control until Undo; movement never adds candidates to old cards.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationBalance={ready:balanceReady};Hooks.on('preCreateChatMessage',card=>{if(!authority())return;const s=balanceSnapshot(card);if(s){jobs.set(card,Promise.resolve());if(s.entries.length)card.updateSource({['flags.'+ID+'.restoreBalanceSnapshot']:s});}});Hooks.on('createChatMessage',card=>captureBalance(card).catch(report));Hooks.on('dnd5e.renderChatMessage',renderBalance);game.socket.on('module.'+ID,p=>{if(p?.action==='restoreBalanceError'&&p.user===game.user.id){ui.notifications.error(p.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(p.card));return;}if(p?.action!=='restoreBalance'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user),card=game.messages.get(p.card);if(user?.active&&card)applyBalance(card,p.actor,p.index,user).catch(error=>game.socket.emit('module.'+ID,{action:'restoreBalanceError',user:user.id,card:card.id,error:error.message}));});});
