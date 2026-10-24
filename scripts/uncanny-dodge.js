import {createEventQueue,isRollAdjustmentLocked,isHealingCard} from "./shared-activity-card.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
import {rebukeAttack as dodgeAttack,refreshRebukeDamage as refreshDodgeDamage} from "./elemental-rebuke.js";
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),reservations=new Set();
const values=x=>Array.from(x?.values?.()??x??[]),key=x=>x?.identifier??x?.system?.identifier;
export const uncannyFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&(key(i)==='uncanny-dodge'||/^uncanny dodge$/i.test(i.name?.trim()??'')));
export function dodgeRecord(card,uuid){return dodgeAttack(card)?.getFlag?.(ID,'uncannyDodges')?.[uuid?.split('.').at(-1)]??null;}
export function uncannyCandidates(card,user=game.user){
 if(game.settings.get(ID,'uncannyDodgeAutomation')!==true||!['attack','damage'].includes(card?.type)||card.getFlag?.(ID,'pendingDamage')||isHealingCard(card)||isRollAdjustmentLocked(card))return [];
 const attack=dodgeAttack(card);if(!attack||isRollAdjustmentLocked(attack))return [];
 const source=attack.getAssociatedToken?.(),attacker=source?.document??source;if(!attacker?.actor)return [];
 const activity=card.type==='damage'?card.getAssociatedActivity?.():null;if(activity&&activity.type!=='attack')return [];
 return values(attack.system?.evaluatedTargets).filter(t=>t.isMiss===false).flatMap(hit=>{
  if(dodgeRecord(attack,hit.token)||card.type==='damage'&&!(card.system?.targets??[]).some(t=>t.token===hit.token))return [];
  const token=globalThis.fromUuidSync?.(hit.token,{strict:false}),actor=token?.actor;
  if(!actor||actor.uuid===attacker.actor.uuid||!(user?.isGM||actor.testUserPermission?.(user,'OWNER'))||reactionUsed(actor)||['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>actor.statuses?.has(s)))return [];
  const feature=uncannyFeature(actor),reaction=values(feature?.system?.activities).find(a=>String(a.activation?.type??'').startsWith('reaction'));
  return feature&&reaction?[{actor,token,feature,reaction,attack}]:[];
 });
}
const stamp=()=>game.combat?.started?[game.combat.id,game.combat.round,game.combat.turn].join(':'):null;
export async function applyUncannyDodge(card,tokenUuid,user=game.user){
 const entry=uncannyCandidates(card,user).find(e=>e.token.uuid===tokenUuid);if(!entry)throw Error('Uncanny Dodge needs a confirmed incoming hit and an available Reaction. Undo applied damage first.');
 const {actor,token,feature,reaction,attack}=entry,turn=stamp();if(reservations.has(actor.uuid))throw Error('Another Reaction is being completed for this Rogue.');reservations.add(actor.uuid);let marker,committed=false;
 try{
  if(reactionUsed(actor))throw Error('Your Reaction was just used.');
  marker=await recordReactionUse(reaction,{}, {message:attack});
  const tracked=game.settings.get(ID,'reactionTracker')===true&&game.combat?.started&&values(game.combat.combatants).some(c=>c.actor?.uuid===actor.uuid);
  if(tracked&&(!marker||marker.getFlag?.(ID,'reactionUsage')!==attack.id))throw Error('Could not reserve the Rogue’s Reaction.');
  if(turn!==stamp()||isRollAdjustmentLocked(card)||isRollAdjustmentLocked(attack)||dodgeRecord(attack,token.uuid)||uncannyFeature(actor)!==feature)throw Error('The attack or Reaction changed. Reopen the card after undoing any applied damage.');
  const record={actor:actor.uuid,token:token.uuid,name:actor.name,feature:feature.uuid,user:user.id};
  await attack.setFlag(ID,'uncannyDodges',{...attack.getFlag(ID,'uncannyDodges'),[token.id??token.uuid.split('.').at(-1)]:record});committed=true;
  globalThis.Ugmuls55eAutomationChatRefresh?.card(attack);
  // Reuse the existing action-driven linked-damage refresh, including its bounded fallback.
  refreshDodgeDamage(attack);if(card.type==='damage')globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
  return record;
 }catch(error){if(!committed&&marker?.getFlag?.(ID,'reactionUsage')===attack.id)await marker.update({disabled:true});throw error;}finally{reservations.delete(actor.uuid);}
}
export function installUncannyDamage(Type=customElements.get('damage-application')){
 const p=Type?.prototype;if(!p?.getMergedOptions||p.rsaUncannyDodge)return;
 const get=p.getMergedOptions,change=p._onChangeMultiplier,seeded=new WeakMap();
 p.getMergedOptions=function(uuid){
  const record=dodgeRecord(this.chatMessage,uuid);
  if(record){let targets=seeded.get(this);if(!targets)seeded.set(this,targets=new Set());if(!targets.has(uuid)){const options=this.getTargetOptions?.(uuid);if(options)options.multiplier=0.5;targets.add(uuid);}}
  const options=get.call(this,uuid);return record&&!this.getTargetOptions?{...options,multiplier:0.5}:options;
 };
 if(change)p._onChangeMultiplier=function(event){const button=event.target.closest('.multiplier-button');if(button)for(const uuid of seeded.get(this)??[])this.getTargetOptions(uuid).multiplier=Number(button.value);return change.call(this,event);};
 p.rsaUncannyDodge=true;
}
async function requestDodge(card,entry){const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'uncannyDodge',card:card.id,token:entry.token.uuid,user:game.user.id,gm:gm.id});else await enqueue(()=>applyUncannyDodge(card,entry.token.uuid));}
export function renderUncannyDodge(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),root:node})).filter(e=>e.card&&!e.root.hidden)];
 for(const {card,root:node} of entries){
  node.querySelectorAll(':scope > .rsa-uncanny-actions').forEach(el=>el.remove());if(card.isContentVisible===false||card.type!=='damage')continue;
  const attack=dodgeAttack(card),records=values(attack?.system?.evaluatedTargets).map(t=>dodgeRecord(attack,t.token)).filter(Boolean),candidates=uncannyCandidates(card);
  if(records.length)for(const tray of node.querySelectorAll('damage-application'))tray.refreshMultiplier?.();
  if(!candidates.length&&!records.length||!['attack','damage'].includes(card.type))continue;
  const controls=document.createElement('div');controls.className='rsa-attack-actions rsa-uncanny-actions';
  for(const entry of candidates){const button=document.createElement('button');button.type='button';button.textContent='Uncanny Dodge — '+entry.actor.name;button.dataset.tooltip='Use a Reaction to halve this attack’s damage against you. Click only if you can see the attacker. Use before applying damage.';
   button.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await requestDodge(card,entry);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});controls.append(button);}
  for(const record of records){const label=document.createElement('span');label.textContent='Uncanny Dodge: half damage to '+record.name;controls.append(label);}node.append(controls);
 }
}
function report(error){console.error('Uncanny Dodge',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'uncannyDodgeAutomation',{name:'Uncanny Dodge Assistance',hint:'Offer Uncanny Dodge on confirmed incoming damage cards. Spend the tracked Reaction and set only that Rogue’s damage selector to half. Clicking confirms the Rogue can see the attacker. Undo applied damage first.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 installUncannyDamage();Hooks.on('dnd5e.renderChatMessage',renderUncannyDodge);
 Hooks.on('updateChatMessage',(card,changes)=>{if(changes.flags?.[ID]?.uncannyDodges||Object.keys(changes).some(k=>k.startsWith('flags.'+ID+'.uncannyDodges'))){globalThis.Ugmuls55eAutomationChatRefresh?.card(card);refreshDodgeDamage(card);}});
 for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect','updateCombat','updateItem','deleteItem'])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request('uncanny',doc,changes));
 game.socket.on('module.'+ID,packet=>{
  if(packet?.action==='uncannyDodgeError'&&packet.user===game.user.id){ui.notifications.error(packet.error);return;}
  if(packet?.action!=='uncannyDodge'||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gm!==game.user.id)return;
  const user=game.users.get(packet.user),card=game.messages.get(packet.card);if(!user?.active||!card)return;
  enqueue(()=>applyUncannyDodge(card,packet.token,user)).catch(error=>{report(error);game.socket.emit('module.'+ID,{action:'uncannyDodgeError',user:user.id,error:error.message});});
 });
});
