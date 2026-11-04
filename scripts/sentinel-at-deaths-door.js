import {createEventQueue,isRollAdjustmentLocked,isHealingCard,linkedHpCards} from './shared-activity-card.js';
import {reactionUsed,recordReactionUse} from './reaction-tracker.js';
import {blessingDistance} from './dark-ones-blessing.js';
import {fieldFriendly} from './protective-field.js';
import {subtractCuttingWords} from './cutting-words.js';
import {omenRollSnapshot} from './cosmic-omen.js';
const ID='ugmuls-5-5e-automation',BOOK='rhwCSSentinelaOa',enqueue=createEventQueue(),liveCards=new WeakSet(),capturing=new WeakMap();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,'sentinelDeathAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),owns=(a,u)=>!!u?.active&&(u.isGM||a?.testUserPermission?.(u,'OWNER'));
const resolve=r=>{try{return typeof r==='string'?(globalThis.fromUuidSync?.(r,{strict:false})??game.messages.get(r.replace(/^ChatMessage\./,''))):r;}catch{return null;}},unable=a=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>a?.statuses?.has(s));
const visible=(c,u)=>c?.isContentVisible!==false&&(u?.isGM||!c.blind&&(!c.whisper?.length||c.author?.id===u?.id||c.whisper.some(w=>(w.id??w)===u?.id))),turn=()=>game.combat?.started?[game.combat.id,game.combat.round,game.combat.turn].join(':'):null;
const remaining=i=>Number(i?.system?.uses?.value??(Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0))),reaction=i=>values(i?.system?.activities).find(a=>String(a.activation?.type).startsWith('reaction'));
const damage=r=>!['healing','temphp','maximum'].includes(r.options?.type)&&Number(r.total)>0;
export const sentinelFeature=a=>values(a?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)==='sentinel-at-deaths-door'||i.id===BOOK||/^sentinel at death['’]s door$/i.test(i.name?.trim()??'')||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.'+BOOK))));
export function sentinelAttack(card){const explicit=flag(card,'damageAttackId');if(explicit)return game.messages.get(explicit);const origin=resolve(card?.system?.origin);if(origin?.type==='attack')return origin;const attacks=values(origin?.getAssociatedRolls?.('attack'));return attacks.length===1?attacks[0]:null;}
export function sentinelRange(source,target){
 if(!source?.actor||!target?.actor||source.parent?.uuid!==target.parent?.uuid)return false;if(source.actor.uuid===target.actor.uuid)return true;
 if(source.actor.statuses?.has('blinded')||target.hidden||target.object?.isVisible===false||!source.object?.center||!target.object?.center)return false;
 const a=values(source.levels),b=values(target.levels);if(a.length&&b.length&&!a.some(l=>b.includes(l)))return false;
 const limit=/^(m|meters?|metres?)$/i.test(source.parent?.grid?.units??'ft')?18.288:60;
 return blessingDistance(source,target)<=limit+1e-7&&!source.object.checkCollision?.(target.object.center,{type:'sight',mode:'any'});
}
export function sentinelSnapshot(card){
 const empty={turn:turn(),entries:[]};if(!enabled()||card?.type!=='damage'||isHealingCard(card)||flag(card,'masteryGraze')||card.system?.targets?.length!==1)return empty;
 const attack=sentinelAttack(card),descriptor=card.system.targets[0],target=resolve(descriptor.token),hp=target?.actor?.system?.attributes?.hp,max=Number(hp?.effectiveMax??hp?.max);
 if(attack?.type!=='attack'||!attack.rolls?.some(r=>r.d20&&r._evaluated)||!values(attack.system?.evaluatedTargets).some(t=>t.token===descriptor.token&&t.isMiss===false)||!Number.isFinite(hp?.value)||!(max>0)||hp.value>max/2)return empty;
 const seen=new Set();for(const token of values(target.parent?.tokens)){
  const actor=token.actor,feature=sentinelFeature(actor);if(!feature||!reaction(feature)||seen.has(actor.uuid)||unable(actor)||reactionUsed(actor)||!(remaining(feature)>=1)||!fieldFriendly(token,target)||!sentinelRange(token,target))continue;
  seen.add(actor.uuid);empty.entries.push({actor:actor.uuid,feature:feature.uuid,token:token.uuid,target:target.uuid,subject:target.actor.uuid,attack:attack.id,name:actor.name});
 }return empty;
}
export function captureSentinel(card){
 if(capturing.has(card))return capturing.get(card);
 if(!authority()||!liveCards.has(card)||flag(card,'sentinelSnapshot')!==undefined)return Promise.resolve();
 const snapshot=sentinelSnapshot(card),job=(async()=>{await card.setFlag(ID,'sentinelSnapshot',snapshot);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);globalThis.Ugmuls55eAutomationNpcDamage?.resumeReactive?.(card);})();capturing.set(card,job);return job;
}
export function sentinelCandidates(card,user=game.user,{pending=false,spentActor=null}={}){
 const snapshot=flag(card,'sentinelSnapshot');if(!enabled()||!snapshot?.entries?.length||card?.type!=='damage'||!visible(card,user)||isHealingCard(card)||flag(card,'pendingDamage')||!pending&&flag(card,'sentinelPending')||flag(card,'sentinelUsed')||isRollAdjustmentLocked(card)||!card.rolls?.length||card.rolls.some(r=>!r._evaluated)||!card.rolls.some(damage)||snapshot?.turn!==turn()||card.system?.targets?.length!==1)return [];
 const attack=sentinelAttack(card);if(!attack||isRollAdjustmentLocked(attack))return [];
 return values(snapshot.entries).flatMap(e=>{
  const actor=resolve(e.actor),token=resolve(e.token),target=resolve(e.target),feature=sentinelFeature(actor);
  if(!owns(actor,user)||unable(actor)||feature?.uuid!==e.feature||!reaction(feature)||e.attack!==attack.id||target?.actor?.uuid!==e.subject||token?.actor?.uuid!==e.actor||card.system.targets[0].token!==e.target||!values(attack.system?.evaluatedTargets).some(t=>t.token===e.target&&t.isMiss===false)||!fieldFriendly(token,target)||!sentinelRange(token,target)||spentActor!==e.actor&&(reactionUsed(actor)||!(remaining(feature)>=1)))return [];
  return [{...e,actor,feature,activity:reaction(feature)}];
 });
}
export async function halveSentinelRolls(rolls){
 let before=0,after=0;const result=[];
 for(const roll of rolls){if(!damage(roll)){result.push(roll);continue;}
  before+=Number(roll.total);const next=Math.floor(before/2),amount=Number(roll.total)-(next-after);after=next;
  // Carry fractional halves across typed parts so the combined damage rounds down once.
  result.push(await subtractCuttingWords(roll,{total:amount},{damage:true,flavor:"Sentinel at Death's Door"}));
 }return result;
}
function state(card){const attack=sentinelAttack(card);return JSON.stringify({roll:omenRollSnapshot(card),targets:card.system?.targets,attack:attack?.id,hits:attack?.system?.evaluatedTargets,attackRoll:attack?omenRollSnapshot(attack):null});}
export function useSentinel(card,actorUuid,user=game.user){return enqueue(async()=>{
 if(!authority())throw Error("A connected GM is required for Sentinel at Death's Door.");
 let e=sentinelCandidates(card,user).find(e=>e.actor.uuid===actorUuid);if(!e)throw Error("Sentinel needs an unapplied attack hit, its original Bloodied ally, an available use and Reaction, and visibility within 60 feet.");
 const before=state(card),stamp=turn();let charged=false,committed=false,marker,spent;
 try{
  await card.setFlag(ID,'sentinelPending',true);await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  const current=sentinelCandidates(card,user,{pending:true}).find(c=>c.actor.uuid===actorUuid);if(!current||state(card)!==before||stamp!==turn())throw Error('The hit, range or Cleric changed.');e=current;
  const rolls=await halveSentinelRolls(card.rolls);
  if(state(card)!==before||!sentinelCandidates(card,user,{pending:true}).some(c=>c.actor.uuid===actorUuid))throw Error('The damage or Cleric changed.');
  spent=Number(e.feature.system.uses.spent??0);await e.feature.update({'system.uses.spent':spent+1});charged=true;
  if(reactionUsed(e.actor))throw Error('Reaction already used.');marker=await recordReactionUse(e.activity,{}, {message:{id:card.id}});
  const participant=globalThis.Ugmuls55eAutomationCompanions?.effectiveCombatant(e.actor,game.combat)??values(game.combat?.combatants).find(c=>c.actor?.uuid===actorUuid);
  if(game.settings.get(ID,'reactionTracker')===true&&game.combat?.started&&participant&&marker?.getFlag?.(ID,'reactionUsage')!==card.id)throw Error('Could not reserve the Cleric’s Reaction.');
  if(state(card)!==before||stamp!==turn()||Number(e.feature.system.uses.spent)!==spent+1||!sentinelCandidates(card,user,{pending:true,spentActor:actorUuid}).some(c=>c.actor.uuid===actorUuid))throw Error('The damage, range or Cleric changed.');
  const record={actor:actorUuid,feature:e.feature.uuid,target:e.target,attack:e.attack,before:card.rolls.filter(damage).reduce((n,r)=>n+Number(r.total),0),after:rolls.filter(damage).reduce((n,r)=>n+Number(r.total),0)};
  const skip=card.getFlag?.('dice-so-nice','skip');try{await card.update({rolls,['flags.'+ID+'.sentinelUsed']:record,'flags.dice-so-nice.skip':true});committed=true;}finally{if(skip===undefined)await card.unsetFlag('dice-so-nice','skip');else await card.setFlag('dice-so-nice','skip',skip);}
 }catch(error){if(charged&&!committed)await e.feature.update({'system.uses.spent':Math.max(0,Number(e.feature.system.uses.spent??0)-1)});if(!committed&&marker?.getFlag?.(ID,'reactionUsage')===card.id)await marker.update({disabled:true});throw error;}
 finally{await card.unsetFlag(ID,'sentinelPending');globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
});}
export function sentinelReady(card){const pending=c=>flag(c,'sentinelPending')||liveCards.has(c)&&flag(c,'sentinelSnapshot')===undefined;if(pending(card))return false;return !['usage','attack'].includes(card?.type)||!linkedHpCards(card).some(pending);}
export function renderSentinel(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 for(const {card,node}of [{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))]){
  for(const old of node.querySelectorAll(':scope > .rsa-sentinel-death'))old.remove();if(!card||!visible(card,game.user)||!enabled()||card.type!=='damage')continue;
  const row=document.createElement('div');row.className='rsa-attack-actions rsa-sentinel-death';const candidates=sentinelCandidates(card);
  for(const e of values(flag(card,'sentinelSnapshot')?.entries)){
   if(flag(card,'sentinelUsed')||!owns(resolve(e.actor),game.user))continue;
   const b=document.createElement('button');b.type='button';b.textContent="Sentinel at Death's Door";b.disabled=!candidates.some(c=>c.actor.uuid===e.actor);b.dataset.tooltip='Spend one use and your Reaction to halve this damage before resistance. Requires the original target within 60 feet.';
   b.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();b.disabled=true;try{const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'sentinelDeath',gm:gm.id,user:game.user.id,card:card.id,actor:e.actor});else await useSentinel(card,e.actor);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});row.append(b);
  }
  const used=flag(card,'sentinelUsed');if(used){const note=document.createElement('span');note.textContent="Sentinel at Death's Door: "+used.before+' → '+used.after;row.append(note);}if(row.childNodes.length)node.append(row);
 }
}
function report(error){console.error("Sentinel at Death's Door",error);ui.notifications.warn(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'sentinelDeathAutomation',{name:"Grave Cleric: Sentinel at Death's Door",hint:'Snapshot a damage-card Reaction for a friendly Bloodied attack target within 60 feet. Spend one native use and Reaction to halve the existing raw damage (round down), before native resistance. Single-target cards only; use reactive automation to pause automatic application.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationSentinel={candidates:sentinelCandidates,ready:sentinelReady,capture:captureSentinel};
 Hooks.on('preCreateChatMessage',card=>{if(authority()&&card.type==='damage')card.updateSource({['flags.'+ID+'.sentinelSnapshot']:sentinelSnapshot(card)});});
 // Capture player-created cards once on the active GM. Automation awaits this same job.
 Hooks.on('createChatMessage',card=>{if(card.type!=='damage')return;liveCards.add(card);captureSentinel(card).catch(report);});
 Hooks.on('dnd5e.renderChatMessage',renderSentinel);
 game.socket.on('module.'+ID,p=>{if(p?.action==='sentinelDeathError'&&p.user===game.user.id){ui.notifications.warn(p.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(p.card));return;}if(p?.action!=='sentinelDeath'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user),card=game.messages.get(p.card);if(user?.active&&card)useSentinel(card,p.actor,user).catch(error=>game.socket.emit('module.'+ID,{action:'sentinelDeathError',user:user.id,card:card.id,error:error.message}));});
});
