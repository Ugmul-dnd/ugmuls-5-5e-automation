import {createEventQueue,describeTarget,isHealingCard} from './shared-activity-card.js';
import {reactionUsed,recordReactionUse} from './reaction-tracker.js';
import {druidOwner} from './druid-damage.js';
import {blessingDistance} from './dark-ones-blessing.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=r=>{try{return typeof r==='string'?fromUuidSync(r,{strict:false}):r;}catch{return null;}},doc=t=>t?.document??t;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),enabled=()=>game.settings.get(ID,'fountMoonlightAutomation')===true;
const owns=(a,u)=>!!u?.active&&(u.isGM||a?.testUserPermission?.(u,'OWNER')),visible=(c,u)=>c?.isContentVisible!==false&&(u.isGM||!c.blind&&(!c.whisper?.length||c.whisper.some(w=>(w.id??w)===u.id)));
const spell=i=>i?.type==='spell'&&((i.identifier??i.system?.identifier)==='fount-of-moonlight'||i.name==='Fount of Moonlight');
const live=e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
export function fountSnapshot(card,{rolls=card?.rolls,completed=false,system=card?.system}={}){
 if(!enabled()||card?.type!=='damage'||isHealingCard(card)||(!completed&&flag(card,'pendingDamage'))||!rolls?.length)return null;
 const origin=typeof system?.origin==='string'?game.messages.get(system.origin.replace(/^ChatMessage\./,'')):system?.origin;
 const explicit=flag(card,'damageAttackId'),attacks=values(origin?.getAssociatedRolls?.('attack'));
 const source=explicit?game.messages.get(explicit):origin?.type==='attack'?origin:attacks.length===1?attacks[0]:card;
 const attacker=doc(source?.getAssociatedToken?.());const entries=[];
 if(attacker?.actor)for(const t of values(system?.targets)){
  const token=resolve(t.token),actor=token?.actor;if(!actor||actor.uuid===attacker.actor.uuid||token.parent?.id!==attacker.parent?.id||reactionUsed(actor))continue;
  if(source?.type==='attack'&&!values(source.system?.evaluatedTargets).some(e=>e.token===token.uuid&&e.isMiss===false))continue;
  const owner=druidOwner(actor),item=values(actor.items).find(spell)??values(owner?.items).find(spell),activity=values(item?.system?.activities).find(a=>a.type==='save'&&String(a.activation?.type).startsWith('reaction'));
  const buff=values(actor.appliedEffects??actor.effects).some(e=>live(e)&&(['Fount of Moonlight','Wreathed in Light'].includes(e.name?.trim())||resolve(e.origin)?.uuid===item?.uuid||resolve(e.system?.origin?.item)?.uuid===item?.uuid));
  const limit=/^(m|meters?|metres?)$/i.test(token.parent.grid.units??'ft')?60*0.3048:60;
  if(item&&activity&&buff&&blessingDistance(token,attacker)<=limit)entries.push({actor:actor.uuid,token:token.uuid,item:item.uuid,sourceActor:(item.actor??actor).uuid,activity:activity.id??activity._id,attacker:attacker.uuid});
 }
 return {entries};
}
// Snapshot before creation/roll updates commit: HP automation may immediately
// remove concentration. Empty snapshots also prevent later repopulation.
export function prepareFount(card,changes){
 if(flag(card,'fountMoonlightSnapshot')!==undefined)return;
 if(changes&&!Object.hasOwn(changes,'rolls'))return;
 // Pending cards retain their live placeholder flag until this update commits.
 // Pass completion explicitly; an undefined getFlag result falls back to flags.
 const system=changes?.system?{...(card.system?.toObject?.()??card.system),...changes.system}:card.system;
 const snapshot=fountSnapshot(card,{rolls:changes?.rolls??card.rolls,completed:!!changes?.rolls,system});
 if(!snapshot)return;
 if(changes)changes['flags.'+ID+'.fountMoonlightSnapshot']=snapshot;else card.updateSource({['flags.'+ID+'.fountMoonlightSnapshot']:snapshot});
}
export function fountEntries(card,user=game.user){
 if(!enabled()||!user?.active||!visible(card,user))return [];
 return (flag(card,'fountMoonlightSnapshot')?.entries??[]).filter(e=>!flag(card,'fountMoonlightUsed')?.[e.token.split('.').at(-1)]&&owns(resolve(e.actor),user));
}
export function useFount(card,token,user=game.user){return enqueue(async()=>{
 if(!authority())throw Error('A connected GM is required.');
 const e=fountEntries(card,user).find(e=>e.token===token),actor=resolve(e?.actor),item=resolve(e?.item),attacker=resolve(e?.attacker),activity=item?.system?.activities?.get(e?.activity);
 if(!e||!actor||item?.actor?.uuid!==(e.sourceActor??actor.uuid)||!activity||!attacker?.actor||reactionUsed(actor))throw Error('Fount of Moonlight needs an available Reaction.');
 // Effect, range and concentration deliberately use the triggering snapshot.
 let marker,committed=false;
 try{
  // The original Druid may retain the spell while the form owns the Reaction.
  marker=await recordReactionUse({actor,item:activity.item??item,activation:activity.activation,getUsageToken:()=>resolve(e.token)}, {}, {message:card});
  if(game.settings.get(ID,'reactionTracker')===true&&game.combat?.started&&values(game.combat.combatants).some(c=>c.actor?.uuid===actor.uuid)&&marker?.getFlag?.(ID,'reactionUsage')!==card.id)throw Error('Could not reserve the Reaction.');
  const data=item.toObject(),native=data.system.activities[e.activity];
  data.system.activities={[e.activity]:native};native.activation={type:'special',override:true};native.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};native.target={override:true,prompt:false,template:{type:''},affects:{type:'creature',count:'1'}};native.duration={units:'inst',override:true,concentration:false};
  const helper=new CONFIG.Item.documentClass(data,{parent:item.actor??actor});helper.prepareFinalAttributes?.();
  const result=await helper.system.activities.get(e.activity).use({consume:false,subsequentActions:false,concentration:{begin:false},create:{measuredTemplate:false}},{configure:false},{data:{system:{targets:[describeTarget(attacker)]},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data}}}});
  if(!result?.message)throw Error('The blinding reaction could not create its card.');committed=true;
  await card.setFlag(ID,'fountMoonlightUsed',{...flag(card,'fountMoonlightUsed'),[token.split('.').at(-1)]:result.message.id});
 }finally{if(!committed&&marker?.getFlag?.(ID,'reactionUsage')===card.id)await marker.update({disabled:true});globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
 });}
export function renderFount(message,html){const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 for(const {card,node}of [{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).map(node=>({card:game.messages.get(node.dataset.messageId),node}))]){
  for(const old of node.querySelectorAll(':scope > .rsa-fount-moonlight'))old.remove();if(!card||node.hidden)continue;
  const entries=fountEntries(card);if(!entries.length)continue;const row=document.createElement('div');row.className='rsa-attack-actions rsa-fount-moonlight';
  for(const e of entries){const b=document.createElement('button');b.type='button';b.textContent='Blinding Reaction';b.dataset.tooltip='Fount of Moonlight: spend your Reaction to force the attacker to save against Blindness.';b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();b.disabled=true;const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'fountMoonlightUse',card:card.id,token:e.token,user:game.user.id,gm:gm.id});else useFount(card,e.token).catch(report);});row.append(b);}node.append(row);
 }
}
function report(error){console.error('Fount of Moonlight',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'fountMoonlightAutomation',{name:'Fount of Moonlight: Blinding Reaction',hint:'Offer the native blinding Reaction on incoming damage cards. Capture the active effect and attacker within 60 feet when the roll appears; concentration loss does not remove the offer. Damage continues normally.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 Hooks.on('preCreateChatMessage',card=>prepareFount(card));Hooks.on('preUpdateChatMessage',(card,changes)=>prepareFount(card,changes));Hooks.on('dnd5e.renderChatMessage',renderFount);
 game.socket.on('module.'+ID,p=>{if(p?.action==='fountMoonlightError'&&p.user===game.user.id){ui.notifications.error(p.error);return;}if(p?.action!=='fountMoonlightUse'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user),card=game.messages.get(p.card);if(!user?.active||!card)return;useFount(card,p.token,user).catch(error=>{report(error);game.socket.emit('module.'+ID,{action:'fountMoonlightError',user:user.id,error:error.message});});});
});
