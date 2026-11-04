import {createEventQueue,isRollAdjustmentLocked,linkedHpCards,describeTarget} from './shared-activity-card.js';
import {sendSavePrompt} from './save-prompts.js';
const ID='ugmuls-5-5e-automation',NATIVE='KN7yYmUNAlfO4onh',enqueue=createEventQueue(),created=new WeakSet(),capturing=new WeakMap(),creationTurns=new WeakMap();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,'unbreakableMajestyAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),live=e=>!!e&&!e.disabled&&!e.isSuppressed&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
const resolve=r=>{try{return typeof r==='string'?(globalThis.fromUuidSync?.(r,{strict:false})??game.messages.get(r.replace(/^ChatMessage\./,''))):r;}catch{return null;}};
const unable=a=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>a?.statuses?.has(s)),owns=(a,u)=>!!u?.active&&(u.isGM||a?.testUserPermission?.(u,'OWNER'));
export const unbreakableFeature=a=>values(a?.items).find(i=>i.type==='feat'&&key(i)==='unbreakable-majesty'&&i.system?.source?.rules!=='2014');
export function majesticPresence(actor){const feature=unbreakableFeature(actor);if(!feature||unable(actor))return null;return values(actor.effects).find(e=>live(e)&&([e._stats?.duplicateSource,e._stats?.compendiumSource].some(r=>r?.endsWith('.'+NATIVE))||e.system?.origin?.item===feature.uuid||resolve(e.system?.origin?.activity)?.item?.uuid===feature.uuid));}
const currentTurn=card=>game.combat?.started?[game.combat.id,game.combat.round,game.combat.turn].join(':'):'attack:'+card.id;
const stamp=card=>creationTurns.get(card)??currentTurn(card);
const actorKey=actor=>encodeURIComponent(actor.uuid).replaceAll('.','%2E');
function checked(effect,attacker,turn){const record=flag(effect,'unbreakableChecks');return record?.turn===turn&&!!record.attackers?.[actorKey(attacker)];}
function incoming(card){
 if(!enabled()||card?.type!=='attack'||card.rolls?.length!==1||!card.rolls[0]._evaluated||card.system?.targets?.length!==1||isRollAdjustmentLocked(card))return null;
 const ref=card.getAssociatedToken?.(),attacker=ref?.document??ref,target=resolve(card.system.targets[0].token),actor=target?.actor,feature=unbreakableFeature(actor),effect=majesticPresence(actor),activity=values(feature?.system?.activities).find(a=>(a.id??a._id)==='dnd5eactivity000'&&a.type==='save');
 if(!attacker?.actor||!target?.actor||!effect||!activity||!values(card.system.evaluatedTargets).some(t=>t.token===target.uuid&&t.isMiss===false)||checked(effect,attacker.actor,stamp(card)))return null;
 return {attacker,target,actor,feature,effect,activity,turn:stamp(card)};
}
function attackOf(card){if(card?.type==='attack')return card;const explicit=flag(card,'damageAttackId');if(explicit)return game.messages.get(explicit);const origin=resolve(card?.system?.origin);if(origin?.type==='attack')return origin;const attacks=values(origin?.getAssociatedRolls?.('attack'));if(attacks.length===1)return attacks[0];return attacks.find(a=>linkedHpCards(a).some(h=>h.id===card?.id))??null;}
export function unbreakableReady(card){
 const attack=attackOf(card);if(!attack)return true;const snapshot=flag(attack,'unbreakableSnapshot'),state=flag(attack,'unbreakableRecoil');
 if(state)return ['passed','failed','skipped'].includes(state.phase);
 if(snapshot?.entry)return false;
 // Only newly created cards can be waiting for capture. Never inspect history
 // to populate a newly acquired buff or newly restored feature.
 return !(created.has(attack)&&snapshot===undefined&&!!incoming(attack));
}
function refresh(card){if(!card)return;globalThis.Ugmuls55eAutomationChatRefresh?.card(card);const origin=resolve(card.system?.origin);if(origin)globalThis.Ugmuls55eAutomationChatRefresh?.card(origin);for(const hp of linkedHpCards(card))globalThis.Ugmuls55eAutomationChatRefresh?.card(hp);}
export function recoilSnapshot(card){const e=incoming(card),entry=e?{turn:e.turn,attacker:e.attacker.uuid,attackerActor:e.attacker.actor.uuid,target:e.target.uuid,actor:e.actor.uuid,feature:e.feature.uuid,effect:e.effect.uuid}:null;return {entry,entries:entry?[entry]:[]};}
async function start(card,user){
 const snapshot=flag(card,'unbreakableSnapshot')?.entry,state=flag(card,'unbreakableRecoil');if(!snapshot||state&&state.phase!=='error')return;
 const e=incoming(card);if(!e||e.turn!==snapshot.turn||e.effect.uuid!==snapshot.effect||e.target.uuid!==snapshot.target||e.attacker.uuid!==snapshot.attacker){await card.setFlag(ID,'unbreakableRecoil',{...snapshot,phase:'skipped'});refresh(card);await globalThis.Ugmuls55eAutomationReactive?.completed(card);return;}
 if(!owns(e.actor,user)&&!owns(e.attacker.actor,user))throw Error('Only the Bard, attacker or GM can request the Recoil save.');
 const previous=flag(e.effect,'unbreakableChecks'),request=foundry.utils.randomID();let reserved=false,saveCreated=false;
 await card.setFlag(ID,'unbreakableRecoil',{...snapshot,request,phase:'starting'});
 try{
  const attackers=previous?.turn===e.turn?{...previous.attackers}:{};attackers[actorKey(e.attacker.actor)]={attack:card.id,request};await e.effect.setFlag(ID,'unbreakableChecks',{turn:e.turn,attackers});reserved=true;
  const data=e.feature.toObject(),id=e.activity.id,a=data.system.activities[id];data.system.activities={[id]:a};data.effects=[];a.effects=[];a.appliedEffects=[];
  a.activation={type:'special',override:true};a.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};a.duration={units:'inst',concentration:false,override:true};a.range={units:'any',override:true};a.target={override:true,prompt:false,affects:{type:'creature',count:'1',choice:false},template:{type:''}};a.damage={parts:[],onSave:'none'};
  const helper=new CONFIG.Item.documentClass(data,{parent:e.actor});helper.prepareFinalAttributes?.();
  const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,concentration:{begin:false},create:{measuredTemplate:false}},{configure:false},{data:{system:{targets:[describeTarget(e.attacker)]},whisper:card.whisper??[],blind:card.blind??false,flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,regionTriggered:true,activityOverrideData:data,unbreakableRecoilSave:{attack:card.id,request}}}}});
  if(!result?.message)throw Error('The Recoil Save card could not be created.');saveCreated=true;
  await card.setFlag(ID,'unbreakableRecoil',{...snapshot,request,phase:'save',save:result.message.id});refresh(card);await sendSavePrompt(result.message,e.attacker,'region');return result;
 }catch(error){
  if(!saveCreated){if(reserved)await e.effect.setFlag(ID,'unbreakableChecks',previous??null);await card.setFlag(ID,'unbreakableRecoil',{...snapshot,phase:'error'});}
  throw error;
 }finally{refresh(card);}
}
export function beginRecoil(card,user=game.user){return enqueue(async()=>{if(!authority())throw Error('A connected GM is required for Unbreakable Majesty.');const s=flag(card,'unbreakableRecoil');if(s?.phase==='save'){if(!owns(resolve(s.actor),user)&&!owns(resolve(s.attackerActor),user))throw Error('You do not own this Recoil save.');const usage=game.messages.get(s.save),attacker=resolve(s.attacker);if(usage&&attacker)await sendSavePrompt(usage,attacker,'region');return;}return start(card,user);});}
export function captureRecoil(card){
 if(capturing.has(card))return capturing.get(card);const job=enqueue(async()=>{if(!authority()||card?.type!=='attack'||!created.has(card))return;if(flag(card,'unbreakableSnapshot')===undefined)await card.setFlag(ID,'unbreakableSnapshot',recoilSnapshot(card));if(flag(card,'unbreakableSnapshot')?.entry)await start(card,game.user);});capturing.set(card,job);return job;
}
function recoilUsage(message){if(flag(message,'unbreakableRecoilSave'))return message;return resolve(message?.system?.origin);}
export function resolveRecoil(message){return enqueue(async()=>{
 if(!authority())return;const usage=recoilUsage(message),link=flag(usage,'unbreakableRecoilSave'),card=game.messages.get(link?.attack),state=flag(card,'unbreakableRecoil');if(!state||state.request!==link.request||!['save','passed','failed'].includes(state.phase))return;
 const outcome=usage.system?.outcomes?.get(state.attacker);if(!['success','failure'].includes(outcome)||isRollAdjustmentLocked(card))return;const phase=outcome==='failure'?'failed':'passed';if(state.phase===phase)return;
 const attacker=resolve(state.attacker),bard=resolve(state.actor);if(!attacker?.actor||!bard||attacker.actor.uuid!==state.attackerActor||!card.system?.targets?.some(t=>t.token===state.target))return;
 const originalAC=state.originalAC??card.system.targets.find(t=>t.token===state.target)?.ac;
 const targets=card.system.targets.map(t=>t.token===state.target?{...t,ac:phase==='failed'?null:originalAC}:t);
 await card.update({'system.targets':targets,['flags.'+ID+'.unbreakableRecoil']:{...state,phase,originalAC}},{rsaRetarget:true});
 // A visible marker belongs only to this Bard's presence and this turn. The
 // source-effect ledger reserves the check before prompting, so simultaneous
 // later attacks cannot create a second save while the first is pending.
 if(!values(attacker.actor.effects).some(e=>flag(e,'unbreakableChecked')?.request===state.request))await attacker.actor.createEmbeddedDocuments('ActiveEffect',[{name:'Recoil checked — '+bard.name,img:'icons/magic/control/silhouette-hold-beam-blue.webp',type:'base',disabled:false,transfer:false,duration:{value:6,units:'seconds',expiry:'turnEnd',expired:false},system:{changes:[],origin:{actor:bard.uuid,message:usage.uuid}},flags:{[ID]:{unbreakableChecked:{request:state.request,turn:state.turn,sourceEffect:state.effect}}}}]);
 refresh(card);await globalThis.Ugmuls55eAutomationReactive?.completed(card);
});}
export function preserveRecoilMiss(card,changes){const nextState=changes['flags.'+ID+'.unbreakableRecoil']??changes.flags?.[ID]?.unbreakableRecoil;if(nextState?.phase==='passed')return;const s=flag(card,'unbreakableRecoil'),targets=changes['system.targets']??changes.system?.targets;if(s?.phase!=='failed'||!Array.isArray(targets))return;const next=targets.map(t=>t.token===s.target?{...t,ac:null}:t);if(Object.hasOwn(changes,'system.targets'))changes['system.targets']=next;else changes.system.targets=next;}
async function clearMarkers(combat,change){if(!authority()||!['turn','round'].some(k=>Object.hasOwn(change??{},k)))return;const current=[combat.id,combat.round,combat.turn].join(':'),actors=new Map(values(combat.combatants).filter(c=>c.actor).map(c=>[c.actor.uuid,c.actor]));for(const actor of actors.values()){const ids=values(actor.effects).filter(e=>flag(e,'unbreakableChecked')&&flag(e,'unbreakableChecked').turn!==current).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments('ActiveEffect',ids);}}
export function renderUnbreakable(message,html){const root=html?.[0]??html;if(!root?.querySelectorAll)return;for(const {card,node}of [{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))]){for(const old of node.querySelectorAll(':scope > .rsa-unbreakable-majesty'))old.remove();if(!card||card.isContentVisible===false)continue;const state=flag(card,'unbreakableRecoil');if(!state)continue;const row=document.createElement('div');row.className='rsa-attack-actions rsa-unbreakable-majesty';const label=document.createElement('span');label.textContent=state.phase==='failed'?'Unbreakable Majesty — attack misses.':state.phase==='passed'?'Recoil Save passed — attack proceeds.':state.phase==='skipped'?'Recoil check no longer required.':'Unbreakable Majesty — awaiting Recoil Save.';row.append(label);
 if(['save','error'].includes(state.phase)&&(owns(resolve(state.actor),game.user)||owns(resolve(state.attackerActor),game.user))){const b=document.createElement('button');b.type='button';b.textContent='Recoil Save';b.disabled=isRollAdjustmentLocked(card);b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();b.disabled=true;const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'unbreakableRecoil',card:card.id,user:game.user.id,gm:gm.id});else beginRecoil(card).catch(report);});row.append(b);}node.append(row);
 }}
function report(error){console.error('Unbreakable Majesty',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'unbreakableMajestyAutomation',{name:'Glamour Bard: Unbreakable Majesty',hint:'While Majestic Presence is active, prompt each attacker’s native Charisma Recoil Save on its first hit each turn. Hold incoming damage/effects; failure makes that attack miss. Mark checked attackers until the turn changes. No extra use or Reaction.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationUnbreakable={ready:unbreakableReady,capture:captureRecoil};
 Hooks.on('createChatMessage',card=>{if(card.type==='attack'){created.add(card);creationTurns.set(card,currentTurn(card));captureRecoil(card).catch(report);}resolveRecoil(card).catch(report);});Hooks.on('updateChatMessage',card=>resolveRecoil(card).catch(report));Hooks.on('preUpdateChatMessage',preserveRecoilMiss);Hooks.on('updateCombat',(combat,change)=>clearMarkers(combat,change).catch(report));Hooks.on('dnd5e.renderChatMessage',renderUnbreakable);
 Hooks.on('dnd5e.preApplyDamage',(actor,amount,updates,options)=>{if(options?.rsaUndoDamage)return;const card=resolve(options?.originatingMessage??options?.origin);if(card&&!unbreakableReady(card)){ui.notifications.warn('Resolve the Recoil Save before applying this attack’s damage.');return false;}});
 for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect','updateItem','deleteItem'])Hooks.on(event,(doc,change)=>globalThis.Ugmuls55eAutomationChatRefresh?.request('unbreakableMajesty',doc,change));
 game.socket.on('module.'+ID,p=>{if(p?.action==='unbreakableRecoilError'&&p.user===game.user.id){ui.notifications.error(p.error);refresh(game.messages.get(p.card));return;}if(p?.action!=='unbreakableRecoil'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user),card=game.messages.get(p.card);if(!user?.active||!card)return;beginRecoil(card,user).catch(error=>game.socket.emit('module.'+ID,{action:'unbreakableRecoilError',user:user.id,card:card.id,error:error.message}));});
});
