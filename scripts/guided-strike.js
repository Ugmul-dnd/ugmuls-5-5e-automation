import {createEventQueue,isRollAdjustmentLocked} from './shared-activity-card.js';
import {inspiredRoll} from './bardic-inspiration.js';
import {reactionUsed,recordReactionUse} from './reaction-tracker.js';
import {flashFriendly} from './flash-of-genius.js';
import {tokenDistance} from './shared-distance.js';
import {seekingSnapshot} from './seeking-spell.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),captured=new WeakSet();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,'guidedStrikeAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),resolve=r=>{try{return globalThis.fromUuidSync?.(r,{strict:false});}catch{return null;}};
const unable=a=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>a?.statuses?.has(s)),remaining=i=>Number(i?.system?.uses?.value??Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0));
export const guidedFeature=a=>values(a?.items).find(i=>i.type==='feat'&&key(i)==='guided-strike'&&i.system?.source?.rules!=='2014');
function visible(c,u){return !!c&&c.isContentVisible!==false&&(u?.isGM||!c.blind&&(!c.whisper?.length||c.author?.id===u?.id||c.whisper.some(w=>(w.id??w)===u?.id)));}
function context(card){
 if(!enabled()||card?.type!=='attack'||card.system?.targets?.length!==1||card.rolls?.length!==1||!card.rolls[0]._evaluated||!card.rolls[0].d20||flag(card,'guidedStrikeUsed')||isRollAdjustmentLocked(card))return null;
 const target=resolve(card.system.targets[0].token),outcome=values(card.system?.evaluatedTargets).find(t=>t.token===target?.uuid);
 if(!target?.actor||outcome?.isMiss!==true)return null;
 const associated=card.getAssociatedToken?.(),attacker=associated?.document??associated;
 if(!attacker?.actor||attacker.parent?.id!==target.parent?.id)return null;
 return {target,attacker};
}
function candidate(card,source,{reserved=false}={}){
 const c=context(card),actor=source?.actor,feature=guidedFeature(actor),self=actor?.uuid===c?.attacker.actor.uuid,activity=values(feature?.system?.activities).find(a=>(a.id??a._id)===(self?'dnd5eactivity000':'cbPOFxxAeQuYIJpn'));
 const resource=values(actor?.items).find(i=>key(i)==='channel-divinity'&&i.system?.source?.rules!=='2014');
 if(!c||!actor||!feature||!resource||!reserved&&remaining(resource)<1||!activity||unable(actor)||!self&&(!reserved&&reactionUsed(actor)||!flashFriendly(source,c.attacker))||source.parent?.id!==c.target.parent?.id)return null;
 const limit=/^(m|meters?|metres?)$/i.test(String(source.parent.grid?.units))?9.144:30;
 if(tokenDistance(source,c.target)>limit)return null;
 return {...c,actor,feature,resource,activity,source,self};
}
export function guidedSnapshot(card){
 const c=context(card);if(!c)return {entries:[]};const entries=[],seen=new Set();
 for(const source of values(c.target.parent.tokens)){const e=candidate(card,source);if(!e||seen.has(e.actor.uuid))continue;seen.add(e.actor.uuid);entries.push({actor:e.actor.uuid,feature:e.feature.uuid,resource:e.resource.uuid,source:source.uuid,target:c.target.uuid,attacker:c.attacker.uuid});}
 return {entries};
}
export function guidedCandidates(card,user=game.user){
 if(!visible(card,user))return [];
 return (flag(card,'guidedStrikeSnapshot')?.entries??[]).map(s=>{
  const e=candidate(card,resolve(s.source));if(!e||!(user?.isGM||e.actor.testUserPermission?.(user,'OWNER'))||e.actor.uuid!==s.actor||e.feature.uuid!==s.feature||e.resource.uuid!==s.resource||e.target.uuid!==s.target||e.attacker.uuid!==s.attacker)return null;return e;
 }).filter(Boolean);
}
export async function captureGuided(card){
 if(!authority()||captured.has(card)||card.type!=='attack')return;captured.add(card);
 // Creation only: later resource/position changes never add new offers to history.
 if(card.author?.isGM&&flag(card,'guidedStrikeSnapshot')!==undefined)return;
 await card.setFlag(ID,'guidedStrikeSnapshot',guidedSnapshot(card));globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
}
export function applyGuidedStrike(card,actorUuid,user=game.user){return enqueue(async()=>{
 if(!authority()||!user?.active)throw Error('A connected GM is required for Guided Strike.');
 let e=guidedCandidates(card,user).find(e=>e.actor.uuid===actorUuid);if(!e)throw Error('Guided Strike requires a missed attack, Channel Divinity and a Cleric within 30 feet of its target. Undo applied damage/effects first.');
 const before=seekingSnapshot(card);await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 e=guidedCandidates(card,user).find(e=>e.actor.uuid===actorUuid);if(!e||seekingSnapshot(card)!==before)throw Error('The attack or Cleric changed.');
 const bonus=await new CONFIG.Dice.BasicRoll('10').evaluate(),adjusted=await inspiredRoll(card.rolls[0],bonus);let charged=false,committed=false,marker;
 try{
  if(!guidedCandidates(card,user).some(c=>c.actor.uuid===actorUuid)||seekingSnapshot(card)!==before)throw Error('The attack or resources changed.');
  await e.resource.update({'system.uses.spent':Number(e.resource.system.uses.spent??0)+1});charged=true;
  if(!e.self){
   if(reactionUsed(e.actor))throw Error('The Cleric’s Reaction was just used.');
   await recordReactionUse(e.activity,{}, {message:{id:card.id}});marker=reactionUsed(e.actor);
   if(game.settings.get(ID,'reactionTracker')===true&&game.combat?.started&&values(game.combat.combatants).some(c=>c.actor?.uuid===actorUuid)&&marker?.getFlag?.(ID,'reactionUsage')!==card.id)throw Error('Could not reserve the Cleric’s Reaction.');
  }
  const current=candidate(card,e.source,{reserved:true});
  if(seekingSnapshot(card)!==before||!current||current.feature.uuid!==e.feature.uuid||current.resource.uuid!==e.resource.uuid||!user.active||!(user.isGM||e.actor.testUserPermission?.(user,'OWNER')))throw Error('The attack or Cleric changed before Guided Strike applied.');
  const skip=card.getFlag?.('dice-so-nice','skip');
  try{await card.update({rolls:[adjusted],['flags.'+ID+'.guidedStrikeUsed']:{actor:actorUuid,name:e.actor.name,feature:e.feature.uuid,total:10,reaction:!e.self},'flags.dice-so-nice.skip':true});committed=true;}
  finally{if(skip===undefined)await card.unsetFlag('dice-so-nice','skip');else await card.setFlag('dice-so-nice','skip',skip);}
 }catch(error){if(charged&&!committed){await e.resource.update({'system.uses.spent':Math.max(0,Number(e.resource.system.uses.spent??0)-1)});if(marker?.getFlag?.(ID,'reactionUsage')===card.id)await marker.update({disabled:true});}throw error;}
 finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
});}
function report(error){console.error('Guided Strike',error);ui.notifications.error(error.message);}
async function request(card,e,button){button.disabled=true;try{const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'guidedStrike',message:card.id,actor:e.actor.uuid,user:game.user.id,gm:gm.id});else await applyGuidedStrike(card,e.actor.uuid);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}}
export function renderGuidedStrike(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){for(const old of node.querySelectorAll(':scope > .rsa-guided-strike'))old.remove();if(!visible(card,game.user))continue;
  const row=document.createElement('div');row.className='rsa-attack-actions rsa-guided-strike';
  for(const e of guidedCandidates(card)){const b=document.createElement('button');b.type='button';b.textContent='Guided Strike';b.title=e.actor.name+' · +10'+(e.self?'':' · Reaction');b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();request(card,e,b);});row.append(b);}
  const used=flag(card,'guidedStrikeUsed');if(used){const label=document.createElement('span');label.textContent='Guided Strike: +10 ('+used.name+')';row.append(label);}if(row.childNodes.length)node.append(row);
 }
}
function refresh(doc,changes){globalThis.Ugmuls55eAutomationChatRefresh?.request('guidedStrike',doc,changes);}
Hooks.once('init',()=>game.settings.register(ID,'guidedStrikeAutomation',{name:'War Cleric: Guided Strike',hint:'Offer +10 on a missed self/allied attack when the Cleric is within 30 feet of its target. Spend Channel Divinity; allied attacks also consume a Reaction. Snapshot offers on creation and preserve original attack dice.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationGuidedStrike={candidates:guidedCandidates,capture:captureGuided};
 Hooks.on('preCreateChatMessage',card=>{if(card.type==='attack'&&game.user.isGM)card.updateSource({['flags.'+ID+'.guidedStrikeSnapshot']:guidedSnapshot(card)});});
 Hooks.on('createChatMessage',card=>captureGuided(card).catch(report));Hooks.on('dnd5e.renderChatMessage',renderGuidedStrike);
 for(const event of ['createItem','updateItem','deleteItem','createActiveEffect','updateActiveEffect','deleteActiveEffect','updateActor','updateCombat'])Hooks.on(event,refresh);
 game.socket.on('module.'+ID,packet=>{if(packet?.action==='guidedStrikeError'&&packet.user===game.user.id){ui.notifications.error(packet.error);const card=game.messages.get(packet.message);if(card)globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return;}if(packet?.action!=='guidedStrike'||!authority()||packet.gm!==game.user.id)return;const user=game.users.get(packet.user),card=game.messages.get(packet.message);if(!user?.active||!card)return;applyGuidedStrike(card,packet.actor,user).catch(error=>{report(error);game.socket.emit('module.'+ID,{action:'guidedStrikeError',user:user.id,message:card.id,error:error.message});});});
});
