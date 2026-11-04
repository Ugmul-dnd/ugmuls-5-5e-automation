import {createEventQueue,isRollAdjustmentLocked,linkedHpCards,isHealingCard} from './shared-activity-card.js';
import {blessingDistance} from './dark-ones-blessing.js';
const ID='ugmuls-5-5e-automation',DUPLICATES=new Set(['VUqQIaiZoIzxUdf1','XcTQl9DhT9lC3bxI','uMsGEsbEZ2hckOKW']),enqueue=createEventQueue(),fresh=new WeakSet(),captures=new WeakMap(),snapshots=new WeakMap(),byActor=new Map(),pending=new Map();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],live=e=>!!e&&!e.disabled&&!e.isSuppressed&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
const enabled=()=>game.settings.get(ID,'mirrorImageAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),owns=(a,u)=>!!u?.active&&(u.isGM||a?.testUserPermission?.(u,'OWNER'));
const visible=(card,user)=>!!card&&card.isContentVisible!==false&&(user?.isGM||!card.blind&&(!card.whisper?.length||card.author?.id===user?.id||card.whisper.some(w=>(w.id??w)===user?.id)));
const resolve=r=>{try{return typeof r==='string'?(globalThis.fromUuidSync?.(r,{strict:false})??game.messages.get(r.replace(/^ChatMessage\./,''))):r;}catch{return null;}};
const session=e=>JSON.stringify([e._stats?.duplicateSource??e._stats?.compendiumSource,e.system?.origin?.message??null,e.start?.time??null,e.start?.round??null,e.start?.turn??null,e.start?.combat?.id??(typeof e.start?.combat==='string'?e.start.combat:null)]);
export function mirrorDuplicates(actor){const seen=new Set();return values(actor?.appliedEffects??actor?.effects).filter(e=>{
 if(!live(e))return false;const refs=[e._stats?.duplicateSource,e._stats?.compendiumSource,e.uuid],native=refs.map(r=>r?.split('.').at(-1)).find(id=>DUPLICATES.has(id));
 if(!native||seen.has(native)||!values(e.system?.changes??e.changes).some(c=>c.key==='flags.dnd-players-handbook.mirrorImages'&&Number(c.value)===1))return false;seen.add(native);return true;
 }).slice(0,3);}
export function mirrorBypassed(attacker,target){
 if(attacker.actor?.statuses?.has('blinded'))return true;const senses=attacker.actor?.system?.attributes?.senses??{};if(!['blindsight','truesight'].some(k=>Number(senses[k])>0))return false;const distance=blessingDistance(attacker,target),metric=/^(m|meters?|metres?)$/i.test(String(attacker.parent?.grid?.units)),senseMetric=/^(m|meters?|metres?)$/i.test(String(senses.units??'ft'));
 const factor=metric===senseMetric?1:metric?0.3048:1/0.3048;return ['blindsight','truesight'].some(k=>Number(senses[k])>0&&distance<=Number(senses[k])*factor);
}
function attackOf(card){if(card?.type==='attack')return card;if(isHealingCard(card))return null;const explicit=flag(card,'damageAttackId');if(explicit)return game.messages.get(explicit);const origin=card?.type==='usage'?card:resolve(card?.system?.origin);if(origin?.type==='attack')return origin;const attacks=values(origin?.getAssociatedRolls?.('attack'));return attacks.length===1?attacks[0]:attacks.find(a=>linkedHpCards(a).some(h=>h.id===card?.id))??null;}
function targetContext(card){
 if(card?.type!=='attack'||card.rolls?.length!==1||!card.rolls[0]._evaluated||card.system?.targets?.length!==1)return null;
 const ref=card.getAssociatedToken?.(),attacker=ref?.document??ref,target=resolve(card.system.targets[0].token);if(!attacker?.actor||!target?.actor||attacker.parent?.id!==target.parent?.id)return null;
 return {attacker,target,actor:target.actor};
}
const isHit=(card,token)=>values(card.system?.evaluatedTargets).some(t=>t.token===token&&t.isMiss===false);
function locked(card){const origin=resolve(card?.system?.origin);return isRollAdjustmentLocked(card)||[card,origin].some(c=>flag(c,'outcomeEffectsApplied')||values(flag(c,'effectUndoHistory')).length);}
export function mirrorSnapshot(card){const c=targetContext(card);if(!enabled()||!c)return {entries:[]};const effects=mirrorDuplicates(c.actor).map(e=>({uuid:e.uuid,session:session(e)}));return {entries:effects.length&&!mirrorBypassed(c.attacker,c.target)?[{actor:c.actor.uuid,target:c.target.uuid,attacker:c.attacker.uuid,effects}]:[]};}
function context(card){
 if(!enabled()||flag(card,'mirrorImageResult'))return null;const snapshot=(flag(card,'mirrorImageSnapshot')??snapshots.get(card))?.entries?.[0],c=targetContext(card);
 if(!snapshot||!c||c.target.uuid!==snapshot.target||c.attacker.uuid!==snapshot.attacker||!isHit(card,c.target.uuid)||mirrorBypassed(c.attacker,c.target))return null;
 const effects=mirrorDuplicates(c.actor).filter(e=>snapshot.effects.some(s=>s.uuid===e.uuid&&s.session===session(e)));return effects.length?{...c,effects,snapshot}:null;
}
export function mirrorReady(card){const attack=attackOf(card);if(!attack||!enabled())return true;if(flag(attack,'mirrorImageAdjusting'))return false;if(flag(attack,'mirrorImageResult'))return true;return !context(attack);}
export function mirrorIntercepted(card){return flag(attackOf(card),'mirrorImageResult')?.intercepted===true;}
function forget(id){const actor=pending.get(id);pending.delete(id);const set=byActor.get(actor);set?.delete(id);if(!set?.size)byActor.delete(actor);}
function track(card){const actor=flag(card,'mirrorImageSnapshot')?.entries?.[0]?.actor;if(!actor)return;pending.set(card.id,actor);if(!byActor.has(actor))byActor.set(actor,new Set());byActor.get(actor).add(card.id);while(pending.size>256)forget(pending.keys().next().value);}
function refresh(card){if(!card)return;globalThis.Ugmuls55eAutomationChatRefresh?.card(card);const origin=resolve(card.system?.origin);if(origin)globalThis.Ugmuls55eAutomationChatRefresh?.card(origin);for(const hp of linkedHpCards(card))globalThis.Ugmuls55eAutomationChatRefresh?.card(hp);}
export function captureMirror(card){if(captures.has(card))return captures.get(card);const job=enqueue(async()=>{if(!authority()||card?.type!=='attack'||!fresh.has(card))return;const snapshot=snapshots.get(card);if(!snapshot?.entries?.length)return;if(flag(card,'mirrorImageSnapshot')===undefined)await card.setFlag(ID,'mirrorImageSnapshot',snapshot);track(card);refresh(card);});captures.set(card,job);return job;}
async function removeDamage(card){
 if(!mirrorIntercepted(card))return;const attack=attackOf(card);if(!attack||locked(attack))throw Error('Undo applied damage/effects before removing this intercepted attack’s damage.');
 for(const hp of linkedHpCards(attack)){if(hp.type!=='damage'||isHealingCard(hp)||hp.system?.targets?.some(t=>t.token!==attack.system.targets[0].token))continue;await hp.delete();}
}
export function useMirror(card,user=game.user){return enqueue(async()=>{
 card=attackOf(card);if(!authority())throw Error('A connected GM is required for Mirror Image.');let c=context(card);
 if(!c||!owns(c.actor,user)||!visible(card,user)||locked(card)||flag(card,'mirrorImageAdjusting'))throw Error('Mirror Image requires an unresolved hit and active duplicates. Undo applied damage/effects first.');
 if(globalThis.Ugmuls55eAutomationUnbreakable?.ready(card)===false)throw Error('Resolve Unbreakable Majesty’s Recoil Save first.');
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);c=context(card);if(!c||locked(card))throw Error('The attack or duplicates changed.');
 const effect=c.effects.at(-1),effectSession=session(effect),count=c.effects.length,signature=JSON.stringify(card.rolls.map(r=>r.toJSON?.()??r)),request=foundry.utils.randomID();let consumed=false,committed=false;
 await card.setFlag(ID,'mirrorImageAdjusting',true);
 try{
  const roll=await new CONFIG.Dice.BasicRoll(count+'d6').evaluate(),results=values(roll.dice).flatMap(d=>values(d.results)).filter(r=>r.active!==false&&!r.discarded&&!r.rerolled),intercepted=results.some(r=>Number(r.result)>=3);
  if(results.length!==count)throw Error('Mirror Image did not roll the expected number of duplicate dice.');
  if(game.dice3d?.showForRoll){const animation=game.dice3d.showForRoll(roll,user,true,card.whisper?.length?card.whisper:null,card.blind??false,card.id,card.speaker);await(globalThis.Ugmuls55eAutomationWaitForAnimation?.(animation)??animation);}
  const current=context(card);if(!current||!owns(current.actor,user)||locked(card)||JSON.stringify(card.rolls.map(r=>r.toJSON?.()??r))!==signature||current.effects.length!==count||!current.effects.some(e=>e.uuid===effect.uuid&&session(e)===effectSession))throw Error('The hit or duplicates changed while Mirror Image rolled. Try again.');
  if(intercepted){await effect.update({disabled:true,['flags.'+ID+'.mirrorConsumed']:{attack:card.id,request}});consumed=true;}
  if(locked(card)||targetContext(card)?.target.uuid!==c.target.uuid||!isHit(card,c.target.uuid)||JSON.stringify(card.rolls.map(r=>r.toJSON?.()??r))!==signature)throw Error('The attack changed before Mirror Image could apply.');
  const record={intercepted,count,results:results.map(r=>r.result),roll:roll.toJSON(),target:c.target.uuid,actor:c.actor.uuid,effect:intercepted?effect.uuid:null,request};
  const update={['flags.'+ID+'.mirrorImageResult']:record};if(intercepted)update['system.targets']=card.system.targets.map(t=>({...t,ac:null}));
  await card.update(update,{rsaRetarget:true});committed=true;forget(card.id);if(intercepted)await removeDamage(card);
 }catch(error){if(consumed&&!committed&&effect.disabled&&session(effect)===effectSession&&flag(effect,'mirrorConsumed')?.request===request)await effect.update({disabled:false,['flags.'+ID+'.-=mirrorConsumed']:null});throw error;}
 finally{await card.setFlag(ID,'mirrorImageAdjusting',false);refresh(card);if(committed)await globalThis.Ugmuls55eAutomationReactive?.completed(card);}
});}
export function preserveMirrorMiss(card,changes){if(!flag(card,'mirrorImageResult')?.intercepted)return;const targets=changes['system.targets']??changes.system?.targets;if(!Array.isArray(targets))return;const target=flag(card,'mirrorImageResult').target,next=targets.map(t=>t.token===target?{...t,ac:null}:t);if(Object.hasOwn(changes,'system.targets'))changes['system.targets']=next;else changes.system.targets=next;}
async function settleMissing(actor){if(!authority())return;for(const id of [...(byActor.get(actor?.uuid)??[])]){const card=game.messages.get(id);if(!card){forget(id);continue;}const entry=flag(card,'mirrorImageSnapshot')?.entries?.[0];if(!entry||flag(card,'mirrorImageResult')){forget(id);continue;}
 const stillActive=mirrorDuplicates(actor).some(e=>entry.effects.some(s=>s.uuid===e.uuid&&s.session===session(e)));if(stillActive){refresh(card);continue;}
 await card.setFlag(ID,'mirrorImageResult',{intercepted:false,skipped:true,count:0,target:entry.target});forget(id);refresh(card);await globalThis.Ugmuls55eAutomationReactive?.completed(card);
 }}
export function renderMirror(message,html){const root=html?.[0]??html;if(!root?.querySelectorAll)return;for(const {card,node}of [{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))]){
 for(const old of node.querySelectorAll(':scope > .rsa-mirror-image'))old.remove();if(!card||card.isContentVisible===false||card.blind&&!game.user.isGM)continue;const attack=attackOf(card);if(!attack)continue;const c=context(attack),result=flag(attack,'mirrorImageResult');if(!c&&!result)return;
 const row=document.createElement('div');row.className='rsa-attack-actions rsa-mirror-image';
 if(c&&owns(c.actor,game.user)){const b=document.createElement('button');b.type='button';b.textContent='Mirror Image ('+c.effects.length+'d6)';b.disabled=locked(attack)||flag(attack,'mirrorImageAdjusting')===true||globalThis.Ugmuls55eAutomationUnbreakable?.ready(attack)===false;b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();b.disabled=true;const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'mirrorImageUse',card:attack.id,user:game.user.id,gm:gm.id});else useMirror(attack).catch(report);});row.append(b);}
 if(result){const label=document.createElement('span');label.textContent=result.skipped?'Mirror Image — no duplicates remain.':result.intercepted?'Mirror Image — duplicate destroyed; attack misses.':'Mirror Image — attack hits.';label.title=result.results?.join(', ')??'';row.append(label);}if(row.childNodes.length)node.append(row);
 }}
function report(error){console.error('Mirror Image',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'mirrorImageAutomation',{name:'Mirror Image: Duplicate Interception',hint:'On an incoming hit, offer one d6 per active native duplicate and hold damage/effect automation. Any 3+ consumes one duplicate, makes the attack miss and deletes its unapplied damage cards. Respect Blinded, Blindsight and Truesight, snapshots and Undo locks.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationMirrorImage={ready:mirrorReady,intercepted:mirrorIntercepted,capture:captureMirror};
 Hooks.on('createChatMessage',card=>{if(card.type==='attack'){fresh.add(card);snapshots.set(card,mirrorSnapshot(card));captureMirror(card).catch(report);}if(card.type==='damage'&&mirrorIntercepted(card))enqueue(()=>removeDamage(card)).catch(report);});
 Hooks.on('preUpdateChatMessage',preserveMirrorMiss);Hooks.on('deleteChatMessage',card=>forget(card.id));Hooks.on('dnd5e.renderChatMessage',renderMirror);
 for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect'])Hooks.on(event,effect=>{const actor=effect.parent?.documentName==='Actor'?effect.parent:effect.parent?.actor;if(actor&&byActor.has(actor.uuid))enqueue(()=>settleMissing(actor)).catch(report);});
 Hooks.on('dnd5e.preApplyDamage',(actor,amount,updates,options)=>{if(options?.rsaUndoDamage)return;const card=resolve(options?.originatingMessage??options?.origin);if(card&&(!mirrorReady(card)||mirrorIntercepted(card))){ui.notifications.warn(mirrorIntercepted(card)?'Mirror Image intercepted this attack.':'Resolve Mirror Image before applying damage.');return false;}});
 Hooks.on('dnd5e.preRollDamageV2',(config,dialog,message)=>{const card=resolve(message.data?.system?.origin),attack=flag(message.data,'damageAttackId')?game.messages.get(flag(message.data,'damageAttackId')):attackOf(card);if(attack&&mirrorIntercepted(attack)){ui.notifications.warn('Mirror Image intercepted this attack.');return false;}});
 game.socket.on('module.'+ID,p=>{if(p?.action==='mirrorImageError'&&p.user===game.user.id){ui.notifications.error(p.error);refresh(game.messages.get(p.card));return;}if(p?.action!=='mirrorImageUse'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user),card=game.messages.get(p.card);if(!user?.active||!card)return;useMirror(card,user).catch(error=>game.socket.emit('module.'+ID,{action:'mirrorImageError',user:user.id,card:card.id,error:error.message}));});
});
