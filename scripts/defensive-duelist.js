import {createEventQueue,isRollAdjustmentLocked,linkedHpCards} from './shared-activity-card.js';
import {reactionUsed,recordReactionUse} from './reaction-tracker.js';
import {shieldReactionAvailable,refreshShieldAttack} from './shield-reaction.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),capturing=new Map(),opened=new Set();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k),key=i=>i?.identifier??i?.system?.identifier;
const enabled=()=>game.settings.get(ID,'defensiveDuelistAutomation')===true;
const authority=()=>game.user.isGM&&game.users.activeGM?.id===game.user.id;
const turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
const resolve=ref=>{try{return typeof ref==='string'?(globalThis.fromUuidSync?.(ref,{strict:false})??game.messages.get(ref.replace(/^ChatMessage\./,''))):ref;}catch{return null;}};
const owns=(actor,user)=>!!user?.active&&(user.isGM||actor?.testUserPermission?.(user,'OWNER'));
const visible=(card,user)=>card?.isContentVisible!==false&&(user?.isGM||!card?.blind&&(!card?.whisper?.length||card.whisper.some(w=>(w.id??w)===user?.id)));
export const duelistFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)==='defensive-duelist'||i.name?.trim().toLowerCase()==='defensive duelist'));
const reaction=feature=>values(feature?.system?.activities).find(a=>a.type==='utility'&&a.activation?.type==='reaction');
export const finesseWeapon=actor=>values(actor?.items).find(i=>i.type==='weapon'&&i.system?.equipped===true&&Number(i.system.quantity??1)>0&&values(i.system.properties).includes('fin'));
export function meleeAttack(card){
 if(card?.type!=='attack')return false;
 const activity=card.getAssociatedActivity?.(),roll=card.rolls?.[0],mode=card.system?.mode??roll?.options?.attackMode??roll?.options?.attack?.mode;
 if(/thrown|ranged/i.test(String(mode??'')))return false;
 return (activity?.attack?.type?.value??card.getAssociatedItem?.()?.system?.attackType)==='melee';
}
const activeEffect=actor=>values(actor?.effects).find(e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&e.system?.expired!==true&&flag(e,'defensiveDuelist'));
export const duelistBonus=actor=>Number(flag(activeEffect(actor),'defensiveDuelist')?.bonus)||0;
function attackOf(card){if(card?.type==='attack')return card;const id=flag(card,'damageAttackId');if(id)return game.messages.get(id);const origin=resolve(card?.system?.origin);if(origin?.type==='attack')return origin;const attacks=values(origin?.getAssociatedRolls?.('attack'));return attacks.length===1?attacks[0]:null;}
function refresh(card){globalThis.Ugmuls55eAutomationChatRefresh?.card(card);const origin=resolve(card?.system?.origin);if(origin)globalThis.Ugmuls55eAutomationChatRefresh?.card(origin);for(const hp of linkedHpCards(card))globalThis.Ugmuls55eAutomationChatRefresh?.card(hp);}
export function duelistSnapshot(card){
 if(!enabled()||!meleeAttack(card)||card.rolls?.length!==1||!card.rolls[0]?._evaluated)return null;
 if(!values(card.system?.targets).some(t=>duelistFeature(resolve(t.token)?.actor)))return null;
 const entries=[];
 for(const hit of values(card.system?.evaluatedTargets)){
  if(hit.isMiss!==false)continue;
  const target=resolve(hit.token),actor=target?.actor,feature=duelistFeature(actor),weapon=finesseWeapon(actor);
  if(!feature||!reaction(feature)||!weapon||!shieldReactionAvailable(actor)||activeEffect(actor)||card.getAssociatedActor?.()?.uuid===actor.uuid)continue;
  entries.push({actor:actor.uuid,token:target.uuid,feature:feature.uuid,weapon:weapon.uuid});
 }
 return {turn:turn(),entries};
}
export function captureDuelist(card){
 const attack=attackOf(card);if(!authority()||!enabled()||!attack||flag(attack,'duelistSnapshot')!==undefined)return Promise.resolve();
 if(capturing.has(attack.id))return capturing.get(attack.id);
 const snapshot=duelistSnapshot(attack);if(!snapshot)return Promise.resolve();
 // Store eligibility once, including an empty snapshot: later equipment or
 // Reaction resets must not manufacture opportunities on historical hits.
 const job=attack.setFlag(ID,'duelistSnapshot',snapshot).then(()=>{if(snapshot.entries.length)refresh(attack);}).finally(()=>capturing.delete(attack.id));capturing.set(attack.id,job);return job;
}
export function duelistCandidates(card,user=game.user){
 if(!enabled()||!game.users.activeGM||!user?.active||!meleeAttack(card)||!visible(card,user)||flag(card,'duelistAdjusting'))return [];
 const snapshot=flag(card,'duelistSnapshot');if(!snapshot||snapshot.turn!==turn()||isRollAdjustmentLocked(card))return [];
 return snapshot.entries.flatMap(e=>{
  const target=resolve(e.token),actor=target?.actor,feature=duelistFeature(actor),weapon=values(actor?.items).find(i=>i.uuid===e.weapon);
  if(card.getAssociatedActor?.()?.uuid===actor?.uuid)return [];
  if(!actor||!owns(actor,user)||feature?.uuid!==e.feature||!reaction(feature)||!weapon||weapon.type!=='weapon'||!weapon.system?.equipped||!values(weapon.system.properties).includes('fin')||Number(weapon.system.quantity??1)<=0||!shieldReactionAvailable(actor)||activeEffect(actor)||flag(card,'duelistUsed')?.[e.token]||!card.system?.targets?.some(t=>t.token===e.token)||!values(card.system?.evaluatedTargets).some(t=>t.token===e.token&&t.isMiss===false))return [];
  return [{...e,actor,feature,activity:reaction(feature),target}];
 });
}
// Native AC effects include this bonus in all target descriptors. Remove only
// this benefit from ranged/thrown attacks; melee cards use native AC unchanged.
export function adjustDuelistTargets(card,targets){
 if(card?.type!=='attack'||meleeAttack(card))return targets;
 return targets.map(t=>{const bonus=duelistBonus(resolve(t.token)?.actor);return bonus&&Number.isFinite(t.ac)?{...t,ac:t.ac-bonus}:t;});
}
export function prepareDuelistTargets(card,data,options={}){
 if((data?.type??card.type)!=='attack')return;
 const targets=data['system.targets']??data.system?.targets;
 if(!Array.isArray(targets)||options.rsaDuelistPrepared)return;
 // Valor adjusts an already recorded AC, rather than rebuilding from the actor.
 if(data['flags.'+ID+'.valorDefense']||data.flags?.[ID]?.valorDefense)return;
 const next=adjustDuelistTargets(card,targets);
 if(Object.hasOwn(data,'system.targets'))data['system.targets']=next;else data.system.targets=next;
}
async function applyDuelistEffect(card,e,bonus){
 const native=values(e.feature.effects).find(effect=>values(effect.system?.changes).some(change=>change.key==='system.attributes.ac.bonus'))??values(e.feature.effects)[0];
 if(!native)throw Error('The native Defensive Duelist effect is missing.');
 const tray=document.createElement('effect-application');tray.chatMessage=card;const prepare=tray._prepareEffectData;
 tray._prepareEffectData=async function(source,actor){
  const operation=await prepare.call(this,source,actor);operation.data.duration={rounds:null,turns:null,seconds:null,value:null,expired:false,expiry:'sourceStart'};operation.data.start=CONFIG.ActiveEffect.documentClass.getEffectStart();
  operation.data.disabled=false;operation.data.transfer=false;operation.data.system??={};operation.data.system.origin={actor:e.actor.uuid,item:e.feature.uuid,message:card.uuid};
  // Evaluate the feat's native proficiency bonus for the defender, not the
  // attacker whose card hosts this effect tray.
  operation.data.system.changes=values(native.system?.changes).map(change=>({...change,value:change.key==='system.attributes.ac.bonus'?String(bonus):change.value}));
  operation.data.flags??={};operation.data.flags[ID]={...operation.data.flags[ID],defensiveDuelist:{bonus,attack:card.id,token:e.token}};
  // The attack tray may belong to a concentrating spellcaster. This defensive
  // feat expires on its defender's turn, independently of that concentration.
  operation.data.flags.dnd5e={...operation.data.flags.dnd5e,isTemporary:false,dependentOn:null};return operation;
 };
 const undo=globalThis.Ugmuls55eAutomationEffectUndo;if(!undo)throw Error('Effect Undo support is unavailable.');
 const effect=await undo.apply(card,card,native,e.actor,tray);if(!effect)throw Error('Defensive Duelist could not apply its effect.');return effect;
}
export function useDuelist(card,token,user=game.user){return enqueue(async()=>{
 if(!authority())throw Error('A connected GM is required for Defensive Duelist.');
 let e=duelistCandidates(card,user).find(e=>e.token===token);if(!e)throw Error('Defensive Duelist needs an equipped Finesse weapon and an available Reaction on an unapplied melee hit.');
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 e=duelistCandidates(card,user).find(e=>e.token===token);if(!e)throw Error('The attack or defender changed.');
 const bonus=Number(e.actor.system?.attributes?.prof);if(!Number.isFinite(bonus)||bonus<=0)throw Error('The defender’s Proficiency Bonus is unavailable.');
 const oldHistory=values(flag(card,'effectUndoHistory')),oldUsed=flag(card,'duelistUsed'),beforeEffects=new Map(values(e.actor.effects).map(effect=>[effect.uuid,effect.toObject()])),expected=JSON.stringify(card.rolls.map(r=>r.toJSON?.()??r));let marker,effect,committed=false;
 await card.setFlag(ID,'duelistAdjusting',true);
 try{
  marker=await recordReactionUse(e.activity,{}, {message:card});
  if(game.settings.get(ID,'reactionTracker')===true&&game.combat?.started&&values(game.combat.combatants).some(c=>c.actor?.uuid===e.actor.uuid)&&marker?.getFlag?.(ID,'reactionUsage')!==card.id)throw Error('Could not reserve the defender’s Reaction.');
  if(reactionUsed(e.actor)&&reactionUsed(e.actor)!==marker)throw Error('The defender’s Reaction is no longer available.');
  const snapshot=flag(card,'duelistSnapshot');
  if(snapshot?.turn!==turn()||isRollAdjustmentLocked(card)||!weaponStillEquipped(e)||!values(card.system.evaluatedTargets).some(t=>t.token===token&&t.isMiss===false)||!visible(card,user)||!owns(e.actor,user)||duelistFeature(e.actor)?.uuid!==e.feature.uuid)throw Error('The attack or defender changed before Parry.');
  effect=await applyDuelistEffect(card,e,bonus);
  if(isRollAdjustmentLocked(card)||snapshot.turn!==turn()||!meleeAttack(card)||!weaponStillEquipped(e)||JSON.stringify(card.rolls.map(r=>r.toJSON?.()??r))!==expected)throw Error('The card or turn changed before Parry finished.');
  await card.setFlag(ID,'duelistUsed',{...flag(card,'duelistUsed'),[token]:{actor:e.actor.uuid,feature:e.feature.uuid,bonus,user:user.id}});
  await refreshShieldAttack(card);committed=true;
 }finally{
  try{if(!committed){
   effect??=values(e.actor.effects).find(effect=>flag(effect,'defensiveDuelist')?.attack===card.id&&effect.system?.origin?.message===card.uuid);
   try{if(effect&&effect.system?.origin?.message===card.uuid){
    const receipt=values(flag(card,'effectUndoHistory')).find(r=>r.effectUuid===effect.uuid&&r.sourceMessage===card.uuid&&!oldHistory.some(old=>old.id===r.id));
    const before=receipt?.before??beforeEffects.get(effect.uuid);
    if(before)await effect.update(before,{diff:false,recursive:false,rsaDuelistRollback:true});else await effect.delete({rsaDuelistRollback:true});
   }if(effect)await card.setFlag(ID,'effectUndoHistory',oldHistory);
   await card.setFlag(ID,'duelistUsed',oldUsed??null);
   }finally{if(marker?.getFlag?.(ID,'reactionUsage')===card.id)await marker.update({disabled:true});}
  }}finally{await card.setFlag(ID,'duelistAdjusting',false);refresh(card);}
 }
 if(committed)await globalThis.Ugmuls55eAutomationReactive?.completed(card);
});}
function weaponStillEquipped(e){const weapon=values(e.actor.items).find(i=>i.uuid===e.weapon);return weapon?.type==='weapon'&&weapon.system?.equipped===true&&Number(weapon.system.quantity??1)>0&&values(weapon.system.properties).includes('fin')&&shieldReactionAvailableIgnoringReservation(e.actor);}
function shieldReactionAvailableIgnoringReservation(actor){return !['incapacitated','dead','unconscious','stunned','paralyzed','petrified'].some(s=>actor.statuses?.has(s));}
export async function chooseDuelist(card,token){
 const id=card.id+':'+token;if(opened.has(id))return;
 const e=duelistCandidates(card).find(e=>e.token===token);if(!e)return;opened.add(id);
 try{const bonus=Number(e.actor.system?.attributes?.prof)||0;
  const confirmed=await foundry.applications.api.DialogV2.confirm({window:{title:'Defensive Duelist'},content:'<p>Use your Reaction to gain +'+bonus+' AC against melee attacks until the start of your next turn?</p>',rejectClose:false,defaultYes:false});
  if(!confirmed)return;const gm=game.users.activeGM;
  if(gm?.id!==game.user.id)game.socket.emit('module.'+ID,{action:'duelistUse',card:card.id,token,user:game.user.id,gm:gm?.id});else await useDuelist(card,token);
 }finally{opened.delete(id);}
}
export function renderDuelist(card,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const entries=[...(card.type==='attack'?[{card,node:root}]:[]),...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(node=>!node.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){
  node.querySelectorAll(':scope > .rsa-defensive-duelist').forEach(n=>n.remove());if(!card||!visible(card,game.user))continue;
  const candidates=duelistCandidates(card);if(!candidates.length)continue;
  const row=document.createElement('div');row.className='rsa-attack-actions rsa-defensive-duelist';
  for(const e of candidates){const b=document.createElement('button');b.type='button';b.textContent='Defensive Duelist — '+(e.target.name??e.actor.name);b.dataset.tooltip='Use your Reaction: +'+e.actor.system.attributes.prof+' AC against melee attacks until your next turn.';b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();chooseDuelist(card,e.token).catch(report);});row.append(b);}node.append(row);
 }
}
function report(error){console.error('Defensive Duelist',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'defensiveDuelistAutomation',{name:'Defensive Duelist Assistance',hint:'Offer Parry on melee hits against an equipped Finesse weapon wielder with an available Reaction. Apply native proficiency-bonus AC until next turn start, exclude ranged attacks, and recheck the original hit.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationDuelist={capture:captureDuelist,candidates:duelistCandidates,ready:card=>!flag(attackOf(card),'duelistAdjusting')};
 Hooks.on('preCreateChatMessage',(card,data)=>{if((data.type??card.type)!=='attack'||!data.system?.targets)return;const update={system:{targets:data.system.targets}};prepareDuelistTargets(card,update);if(update.system.targets!==data.system.targets)card.updateSource({'system.targets':update.system.targets});});
 Hooks.on('preUpdateChatMessage',(card,changes,options)=>{if(options?.rsaRetarget)prepareDuelistTargets(card,changes,options);});
 Hooks.on('createChatMessage',card=>{captureDuelist(card).catch(report);});Hooks.on('dnd5e.renderChatMessage',renderDuelist);
 for(const event of ['createItem','updateItem','deleteItem','createActiveEffect','updateActiveEffect','deleteActiveEffect','updateActor','updateCombat','deleteCombat'])Hooks.on(event,doc=>globalThis.Ugmuls55eAutomationChatRefresh?.request('defensiveDuelist',doc));
 Hooks.on('updateChatMessage',(card,changes)=>{if(authority()&&card.type==='attack'&&flag(card,'duelistUsed')&&!flag(card,'duelistAdjusting')&&!isRollAdjustmentLocked(card)&&(Object.hasOwn(changes??{},'flags.'+ID+'.effectUndoHistory')||Object.hasOwn(changes?.flags?.[ID]??{},'effectUndoHistory')))refreshShieldAttack(card).catch(report);});
 game.socket.on('module.'+ID,p=>{if(p?.action==='duelistError'&&p.user===game.user.id){ui.notifications.error(p.error);return;}if(p?.action!=='duelistUse'||!authority()||p.gm!==game.user.id)return;const card=game.messages.get(p.card),user=game.users.get(p.user);if(card&&user?.active)useDuelist(card,p.token,user).catch(error=>game.socket.emit('module.'+ID,{action:'duelistError',user:user.id,error:error.message}));});
});
