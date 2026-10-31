import {createEventQueue,isRollAdjustmentLocked} from './shared-activity-card.js';
import {inspiredRoll} from './bardic-inspiration.js';
import {subtractCuttingWords} from './cutting-words.js';
import {reactionUsed,recordReactionUse} from './reaction-tracker.js';
import {flashRange} from './flash-of-genius.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),rests=new WeakSet(),wrapped=new WeakSet(),captured=new WeakSet(),captureJobs=new WeakMap();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,'cosmicOmenAutomation')===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const resolve=id=>{try{return globalThis.fromUuidSync?.(id,{strict:false});}catch{return null;}};
const owns=(actor,user)=>!!user?.active&&(user.isGM||actor?.testUserPermission?.(user,'OWNER'));
export const omenFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(i.identifier??i.system?.identifier)==='cosmic-omen');
export const omenBuff=actor=>values(actor?.effects).find(e=>!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired&&['weal','woe'].includes(flag(e,'cosmicOmen')?.mode));
const remaining=item=>Number(item?.system?.uses?.value??(Number(item?.system?.uses?.max)-Number(item?.system?.uses?.spent??0)))||0;
const incapable=actor=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>actor?.statuses?.has(s));
const activityFor=(item,mode)=>values(item?.system?.activities).find(a=>a.id===(mode==='weal'?'nu3AqVu9lyqeFwr3':'RUVw6UxNL4FIdDrJ'));
const visible=(card,user)=>card.isContentVisible!==false&&(user?.isGM||!card.blind&&(!card.whisper?.length||card.author?.id===user?.id||card.whisper.some(u=>(u.id??u)===user.id)));
function rollToken(card){const ref=card.getAssociatedToken?.(),actor=card.getAssociatedActor?.();return ref?.document??ref??actor?.token??values(globalThis.canvas?.scene?.tokens).find(t=>t.actor?.uuid===actor?.uuid);}
// Compare evaluated results, not derived formula strings or empty/default term
// metadata that native initiative hydration and dice animations can normalize.
export function omenRollSnapshot(card){
 const term=t=>({number:Number.isFinite(t.number)?t.number:null,faces:Number.isFinite(t.faces)?t.faces:null,operator:t.operator??null,total:Number.isFinite(t.total)?t.total:null,results:(t.results??[]).map(r=>[r.result,r.active!==false,!!r.discarded,!!r.rerolled]),rolls:(t.rolls??[]).map(roll),roll:t.roll?roll(t.roll):null});
 const roll=r=>{void r.d20;return {total:r.total,mode:r.options?.advantageMode??0,terms:(r.terms??[]).map(term)};};
 return JSON.stringify((card.rolls??[]).map(roll));
}
function initiativeLink(card){
 if(card.type!=='check'||card.system?.type!=='initiative')return null;const combat=game.combat,token=rollToken(card),actor=card.getAssociatedActor?.();if(!combat||!actor)return null;
 let matches=values(combat.combatants).filter(c=>token?.uuid&&c.token?.uuid===token.uuid);if(!matches.length){const byActor=values(combat.combatants).filter(c=>c.actor?.uuid===actor.uuid);if(byActor.length===1)matches=byActor;}
 return matches.length?{combat:combat.id,combatants:matches.map(c=>c.id)}:null;
}
function linkedInitiative(card){const link=flag(card,'cosmicOmenSnapshot')?.initiative,combat=game.combats?.get?.(link?.combat)??(game.combat?.id===link?.combat?game.combat:null);return link&&combat?{combat,combatants:link.combatants.map(id=>combat.combatants.get?.(id)??values(combat.combatants).find(c=>c.id===id)).filter(Boolean)}:null;}
export async function bindOmenInitiative(card){
 if(!authority()||card.type!=='check'||card.system?.type!=='initiative')return;const linked=linkedInitiative(card);if(!linked)return;const updates=linked.combatants.filter(c=>flag(c,'cosmicOmenInitiativeSource')!==card.id).map(c=>({_id:c.id,['flags.'+ID+'.cosmicOmenInitiativeSource']:card.id}));if(updates.length)await linked.combat.updateEmbeddedDocuments('Combatant',updates);
}
function initiativeAdjustment(card,index){
 const linked=linkedInitiative(card);if(card.system?.type!=='initiative')return null;if(!linked||index!==0||!linked.combatants.length)throw Error('This initiative roll is no longer linked to its combatant.');
 if(linked.combatants.some(c=>flag(c,'cosmicOmenInitiativeSource')!==card.id||!Number.isFinite(c.initiative)||c.initiative!==card.rolls[index].total))throw Error('Initiative has changed since this card was rolled. Use the latest initiative card.');return linked;
}
export function omenRelation(source,target){
 if(source?.actor?.uuid===target?.actor?.uuid)return 'friendly';
 const a=Number(source?.disposition),b=Number(target?.disposition);
 if(!Number.isFinite(a)||!Number.isFinite(b)||a===0||b===0)return 'neutral';
 return a===b?'friendly':'hostile';
}
export function omenSnapshot(card){
 if(!enabled()||!['attack','save','check'].includes(card.type))return null;
 const target=rollToken(card);if(!target)return {entries:[]};const entries=[],seen=new Set();
 // Deliberately only called during message creation. No movement/resource hook
 // may add a new candidate to an already published card.
 for(const token of values(target.parent?.tokens??globalThis.canvas?.scene?.tokens)){
  const actor=token.actor,buff=omenBuff(actor),feature=omenFeature(actor);if(!actor||seen.has(actor.uuid)||!buff||!feature||incapable(actor)||reactionUsed(actor)||remaining(feature)<1||!flashRange(token,target))continue;
  const mode=flag(buff,'cosmicOmen').mode,activity=activityFor(feature,mode);if(!activity?.roll?.formula)continue;
  seen.add(actor.uuid);entries.push({actor:actor.uuid,feature:feature.uuid,effect:buff.uuid,mode,relation:omenRelation(token,target),token:token.uuid,target:target.uuid,name:actor.name,img:feature.img});
 }
 return {entries,...(initiativeLink(card)?{initiative:initiativeLink(card)}:{})};
}
export function captureOmen(card){
 if(captureJobs.has(card))return captureJobs.get(card);const job=(async()=>{
 if(!authority()||captured.has(card))return;captured.add(card);if(card.author?.isGM&&flag(card,'cosmicOmenSnapshot')!==undefined)return;const snapshot=omenSnapshot(card);if(!snapshot||!snapshot.entries.length&&!snapshot.initiative&&flag(card,'cosmicOmenSnapshot')===undefined)return;
 await card.setFlag(ID,'cosmicOmenSnapshot',snapshot);
 // The snapshot is added after a player's message arrives on the GM. Refresh
 // only that exact card so its owner sees the newly authorized controls.
 globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
})();captureJobs.set(card,job);return job;
}
export function omenTestEligible(card,index=0,mode='weal'){
 const roll=card.rolls?.[index],dc=roll?.options?.target;
 if(card.type==='attack'){
  const kept=(roll?.d20?.results??[]).filter(r=>r.active!==false&&!r.discarded&&!r.rerolled);
  if(kept.some(r=>Number(r.result)===1||Number(r.result)===20))return false;
  const outcomes=values(card.system?.evaluatedTargets).filter(t=>typeof t.isMiss==='boolean');
  if(outcomes.length)return outcomes.some(t=>mode==='weal'?t.isMiss:!t.isMiss);
 }
 // With no known outcome/DC, the Druid decides whether to spend the reaction.
 if(dc===null||dc===undefined||typeof dc==='string'&&dc.trim()===''||!Number.isFinite(Number(dc)))return true;
 const failed=typeof roll.isFailure==='boolean'?roll.isFailure:Number(roll.total)<Number(dc);
 return mode==='weal'?failed:!failed;
}
export function omenCandidates(card,index=0,user=game.user){
 if(!enabled()||!visible(card,user)||!['attack','save','check'].includes(card.type)||!Number.isInteger(index)||index<0||!card.rolls?.[index]?.d20||!card.rolls[index]._evaluated)return [];
 return (flag(card,'cosmicOmenSnapshot')?.entries??[]).map(snapshot=>{
  if(snapshot.relation==='friendly'&&snapshot.mode!=='weal'||snapshot.relation==='hostile'&&snapshot.mode!=='woe'||!omenTestEligible(card,index,snapshot.mode))return null;
  const actor=resolve(snapshot.actor),feature=resolve(snapshot.feature),buff=resolve(snapshot.effect);
  if(!actor||!owns(actor,user)||omenFeature(actor)?.uuid!==feature?.uuid||omenBuff(actor)?.uuid!==buff?.uuid||flag(buff,'cosmicOmen')?.mode!==snapshot.mode)return null;
  const activity=activityFor(feature,snapshot.mode);return activity?{...snapshot,actor,feature,buff,activity}:null;
 }).filter(Boolean);
}
const omenActorKey=uuid=>encodeURIComponent(uuid).replaceAll('.','%2E');
export function omenRecords(card,index){
 const records=new Map(),root=flag(card,'cosmicOmenUsed')?.[index];
 const walk=(node,path=[])=>{if(!node||typeof node!=='object')return;if(['weal','woe'].includes(node.mode)&&Number.isFinite(node.total)){let actor=node.actor;try{actor??=decodeURIComponent(path.join('.'));}catch{actor??=path.join('.');}if(actor)records.set(actor,{...node,actor});return;}for(const [key,value]of Object.entries(node))walk(value,[...path,key]);};
 // Older flags used dotted Actor UUID keys, which Foundry expands into nested
 // objects. Read those records as well as the new dot-free keys.
 walk(root);return [...records.values()];
}
export function omenDisabled(card,entry,index){
 if(isRollAdjustmentLocked(card)||omenEffectLocked(card))return 'Effect/Damage already processed, ask GM to undo for effect';
 if(omenRecords(card,index).some(r=>r.actor===entry.actor.uuid))return 'Cosmic Omen already used on this roll';
 if(incapable(entry.actor))return 'Druid is incapacitated';
 if(reactionUsed(entry.actor))return 'Reaction already used';
 if(remaining(entry.feature)<1)return 'No Cosmic Omen charges remaining';
 return null;
}
function omenEffectLocked(card){
 const origin=typeof card.system?.origin==='string'?game.messages.get(card.system.origin.replace(/^ChatMessage\./,'')):card.system?.origin;
 return [card,origin].some(c=>flag(c,'outcomeEffectsApplied')===true||(flag(c,'effectUndoHistory')?.length??0)>0);
}
export function applyOmen(card,actorUuid,index,user=game.user){return enqueue(async()=>{
 if(!authority())throw Error('A connected GM is required.');let entry=omenCandidates(card,index,user).find(e=>e.actor.uuid===actorUuid);
 if(!entry)throw Error('Cosmic Omen is not available on this roll.');let reason=omenDisabled(card,entry,index);if(reason)throw Error(reason);
 const before=omenRollSnapshot(card);await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 entry=omenCandidates(card,index,user).find(e=>e.actor.uuid===actorUuid);if(!entry)throw Error('The Cosmic Omen buff or ownership changed. Try again.');if(omenRollSnapshot(card)!==before)throw Error('The D20 Test changed while its dice were finishing. Try again.');reason=omenDisabled(card,entry,index);if(reason)throw Error(reason);
 const bonus=await new CONFIG.Dice.BasicRoll(entry.activity.roll.formula,entry.actor.getRollData?.()??{}).evaluate();
 const adjusted=entry.mode==='weal'?await inspiredRoll(card.rolls[index],bonus):await subtractCuttingWords(card.rolls[index],bonus,{flavor:'Cosmic Omen — Woe'});
 let charged=false,committed=false,marker,initiativeWritten=false;const initiative=initiativeAdjustment(card,index),initiativeBefore=initiative?.combatants.map(c=>({_id:c.id,initiative:c.initiative}));const spent=Number(entry.feature.system.uses.spent??0);
 try{
  if(omenRollSnapshot(card)!==before||omenDisabled(card,entry,index))throw Error('The roll or resources changed. Try again.');
  await entry.feature.update({'system.uses.spent':spent+1});charged=true;
  if(reactionUsed(entry.actor))throw Error('Reaction already used');
  marker=await recordReactionUse(entry.activity,{}, {message:card});
  const tracked=game.settings.get(ID,'reactionTracker')===true&&game.combat?.started&&values(game.combat.combatants).some(c=>c.actor?.uuid===actorUuid);
  if(tracked&&marker?.getFlag?.(ID,'reactionUsage')!==card.id)throw Error('Could not reserve the Druid’s reaction.');
  if(game.dice3d?.showForRoll){const animation=game.dice3d.showForRoll(bonus,user,true,card.whisper?.length?card.whisper:null,card.blind??false,card.id,card.speaker);if(globalThis.Ugmuls55eAutomationWaitForAnimation)await globalThis.Ugmuls55eAutomationWaitForAnimation(animation);else await animation;}
  if(omenRollSnapshot(card)!==before||isRollAdjustmentLocked(card)||omenEffectLocked(card))throw Error('Effect/Damage already processed, ask GM to undo for effect');
  if(!omenCandidates(card,index,user).some(e=>e.actor.uuid===actorUuid)||incapable(entry.actor))throw Error('The Druid or Cosmic Omen changed. The use was restored.');
  if(initiative){initiativeAdjustment(card,index);await initiative.combat.updateEmbeddedDocuments('Combatant',initiative.combatants.map(c=>({_id:c.id,initiative:adjusted.total})));initiativeWritten=true;}
  const rolls=[...card.rolls];rolls[index]=adjusted;const used=structuredClone(flag(card,'cosmicOmenUsed')??{});used[index]??={};used[index][omenActorKey(actorUuid)]={actor:actorUuid,mode:entry.mode,total:Number(bonus.total),name:entry.actor.name};
  const skip=card.getFlag?.('dice-so-nice','skip');try{await card.update({rolls,['flags.'+ID+'.cosmicOmenUsed']:used,'flags.dice-so-nice.skip':true});committed=true;}finally{if(skip===undefined)await card.unsetFlag('dice-so-nice','skip');else await card.setFlag('dice-so-nice','skip',skip);}
 }catch(error){if(initiativeWritten&&!committed){const restore=initiativeBefore.filter(u=>{const c=initiative.combatants.find(c=>c.id===u._id);return flag(c,'cosmicOmenInitiativeSource')===card.id&&c.initiative===adjusted.total;});if(restore.length)await initiative.combat.updateEmbeddedDocuments('Combatant',restore);}if(charged&&!committed){await entry.feature.update({'system.uses.spent':Math.max(0,Number(entry.feature.system.uses.spent??0)-1)});if(marker?.getFlag?.(ID,'reactionUsage')===card.id)await marker.update({disabled:true});}throw error;}
});}
function requestOmen(card,entry,index){const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id){game.socket.emit('module.'+ID,{action:'cosmicOmen',gm:gm.id,user:game.user.id,card:card.id,actor:entry.actor.uuid,index});return Promise.resolve();}return applyOmen(card,entry.actor.uuid,index,game.user);}
export function renderOmen(message,html){
 if(!enabled())return;const root=html?.[0]??html;if(!root?.querySelectorAll)return;const entries=[{card:message,root}];for(const node of root.querySelectorAll('.card-summary[data-message-id]')){const card=game.messages.get(node.dataset.messageId);if(card&&!node.hidden)entries.push({card,root:node});}
 for(const {card,root}of entries){if(!visible(card,game.user))continue;for(const old of root.querySelectorAll(':scope > .rsa-cosmic-omen'))old.remove();const candidates=(card.rolls??[]).flatMap((_r,index)=>omenCandidates(card,index).filter(entry=>!reactionUsed(entry.actor)&&remaining(entry.feature)>0&&!incapable(entry.actor)&&!omenRecords(card,index).some(r=>r.actor===entry.actor.uuid)).map(entry=>({entry,index})));if(!candidates.length&&!Object.keys(flag(card,'cosmicOmenUsed')??{}).length)continue;
  const controls=document.createElement('div');controls.className='rsa-attack-actions rsa-cosmic-omen';
  for(const {entry,index}of candidates){const button=document.createElement('button'),image=document.createElement('img'),reason=omenDisabled(card,entry,index),mode=entry.mode==='weal'?'Weal':'Woe';button.type='button';button.style.flex='0 0 auto';button.style.width='30px';button.style.padding='2px';image.src=entry.img??'icons/svg/d20.svg';image.alt=mode;image.style.width='22px';image.style.height='22px';button.append(image);button.disabled=!!reason;button.dataset.tooltip='Cosmic Omen — '+mode+' · '+entry.name+(card.rolls.length>1?' · Roll '+(index+1):'')+(reason?' — '+reason:'');button.setAttribute('aria-label',button.dataset.tooltip);button.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await requestOmen(card,entry,index);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});controls.append(button);}
  for(const index of Object.keys(flag(card,'cosmicOmenUsed')??{}))for(const record of omenRecords(card,index)){const label=document.createElement('span');label.textContent='Cosmic Omen — '+(record.mode==='weal'?'Weal: +':'Woe: −')+record.total+' ('+(record.name??resolve(record.actor)?.name??'Druid')+')'+(card.rolls.length>1?' · Roll '+(Number(index)+1):'');controls.append(label);}root.append(controls);
 }
}
export function installOmenRest(Type){const p=Type?.prototype;if(!p?._prepareContext||wrapped.has(p))return;wrapped.add(p);const prepare=p._prepareContext;p._prepareContext=async function(...args){const context=await prepare.apply(this,args);if(enabled()&&this.config?.type==='long'&&!this.isPartyGroup&&this.actor?.isOwner&&omenFeature(this.actor)){context.formSections??=[];context.formSections.push({legend:'Note: Cosmic Omen Roll will follow Long Rest.',fields:[{fields:[{}],group:{hint:'When applicable, a Weal/Woe icon appears on chat roll cards. Hover to see the omen; click to help a friendly failed test (Weal) or hinder a hostile successful test (Woe). Using it spends one Cosmic Omen charge and your combat Reaction.'}}]});}return context;};}
export async function completedOmenRest(actor,result,config={}){
 if(!enabled()||!actor?.isOwner||!result||rests.has(result)||(config.type??result.type)!=='long'||!omenFeature(actor))return;rests.add(result);
 try{const feature=omenFeature(actor),roll=await new CONFIG.Dice.BasicRoll('1d2',actor.getRollData?.()??{}).evaluate(),mode=Number(roll.total)%2===0?'weal':'woe',label=mode==='weal'?'Weal':'Woe';
 await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:'Cosmic Omen — '+label+(mode==='weal'?' (Even)':' (Odd)')});
 const old=values(actor.effects).filter(e=>flag(e,'cosmicOmen'));const data={name:'Cosmic Omen — '+label,img:feature.img,disabled:false,transfer:false,duration:{value:null,units:'seconds',expiry:null,expired:false},system:{changes:[],origin:{actor:actor.uuid,item:feature.uuid}},flags:{[ID]:{cosmicOmen:{mode,feature:feature.uuid}}}};
 const [created]=await actor.createEmbeddedDocuments('ActiveEffect',[data]);try{if(old.length)await actor.deleteEmbeddedDocuments('ActiveEffect',old.map(e=>e.id));}catch(error){await created.delete();throw error;}
 }catch(error){rests.delete(result);throw error;}
}
function report(error){console.error('Cosmic Omen',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'cosmicOmenAutomation',{name:'Stars Druid: Cosmic Omen',hint:'After a Long Rest, roll an omen: even grants Weal; odd grants Woe. In the chatlog, the Druid’s owner and GM see a small Cosmic Omen icon on eligible attack, saving throw and ability check cards. Weal helps friendly failed tests; Woe penalizes hostile successful tests. Unknown DCs remain a manual choice. Attacks with a kept natural 1 or 20 get neither option. Disposition and range are captured when the card appears. Hover to see Weal/Woe and availability; click to roll the native bonus die and add it (Weal) or subtract it (Woe), spending one charge and your combat Reaction. No target selection is needed: the icon adjusts the test on that card. Range and sight are checked once when the card appears; moving does not add icons to old cards. Applied damage/effects disable the icon until the GM undoes them. No icon is added when charges or the Reaction are already spent, or the Druid is incapacitated.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 installOmenRest(CONFIG.DND5E.restTypes?.long?.dialogClass);Hooks.on('dnd5e.restCompleted',(a,r,c)=>completedOmenRest(a,r,c).catch(report));
 Hooks.on('preCreateChatMessage',card=>{if(!authority())return;const snapshot=omenSnapshot(card);if(snapshot)card.updateSource({['flags.'+ID+'.cosmicOmenSnapshot']:snapshot});});
 Hooks.on('createChatMessage',card=>captureOmen(card).then(()=>bindOmenInitiative(card)).catch(report));Hooks.on('dnd5e.renderChatMessage',renderOmen);
 // No movement, actor, item, effect or combat hooks refresh old Omen cards.
 game.socket.on('module.'+ID,packet=>{if(packet?.action==='cosmicOmenError'&&packet.user===game.user.id){ui.notifications.error(packet.error);const card=game.messages.get(packet.card);if(card)globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return;}if(packet?.action!=='cosmicOmen'||!authority()||packet.gm!==game.user.id)return;const user=game.users.get(packet.user),card=game.messages.get(packet.card);if(!user?.active||!card)return;applyOmen(card,packet.actor,packet.index,user).catch(error=>{game.socket.emit('module.'+ID,{action:'cosmicOmenError',user:user.id,card:card.id,error:error.message});});});
});
