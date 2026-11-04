import {createEventQueue,isRollAdjustmentLocked} from './shared-activity-card.js';
import {failureState} from './bardic-inspiration.js';
import {reactionUsed,recordReactionUse} from './reaction-tracker.js';
import {blessingDistance} from './dark-ones-blessing.js';
import {flashFriendly} from './flash-of-genius.js';
import {finalD20Results,d20ResultValue} from './d20-results.js';
import {animateNewSaveDice} from './save-roll-controls.js';
import {restoreFocusTargets} from './fanatical-focus.js';
import {seekingSnapshot} from './seeking-spell.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),captured=new WeakSet(),jobs=new WeakMap();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],key=i=>i?.identifier??i?.system?.identifier;
const enabled=()=>game.settings.get(ID,'countercharmAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
const unable=a=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>a?.statuses?.has(s));
const visible=(c,u)=>!!c&&c.isContentVisible!==false&&(u?.isGM||!c.blind&&(!c.whisper?.length||c.author?.id===u?.id||c.whisper.some(w=>(w.id??w)===u?.id)));
export const countercharmFeature=a=>values(a?.items).find(i=>i.type==='feat'&&key(i)==='countercharm'&&i.system?.source?.rules!=='2014');
function origin(card){const r=card?.system?.origin;return typeof r==='string'?game.messages.get(r.replace(/^ChatMessage\./,'')):r;}
export function countercharmCondition(card){
 const seen=new Set();let current=card;
 while(current&&!seen.has(current.id)){seen.add(current.id);const activity=current.getAssociatedActivity?.({scaled:true}),item=activity?.item;
  const refs=new Set([...values(activity?.effects).map(e=>e._id??e.id??e.effect?.id),...values(activity?.appliedEffects).map(e=>typeof e==='string'?e:e._id??e.id)]);
  if(values(item?.effects).some(e=>refs.has(e.id??e._id)&&values(e.statuses).some(s=>['charmed','frightened'].includes(s))))return true;
  current=origin(current);
 }return false;
}
function eligible(card,index){return enabled()&&card?.type==='save'&&Number.isInteger(index)&&index>=0&&card.rolls?.[index]?._evaluated&&!!card.rolls[index].d20&&!flag(card,'countercharmUsed')?.[index]&&!flag(card,'automaticGrappleFailure')&&!flag(card,'carefulSpell')&&!card.system?.forceSuccess&&!card.system?.concentrationBroken&&!isRollAdjustmentLocked(card)&&failureState(card,index)==='failed'&&countercharmCondition(card);}
function targetOf(card){const t=card.getAssociatedToken?.();return t?.document??t;}
function entry(card,source,{reserved=false}={}){
 const target=targetOf(card),actor=source?.actor,feature=countercharmFeature(actor),activity=values(feature?.system?.activities).find(a=>(a.id??a._id)==='dnd5eactivity000');
 if(!target?.actor||!actor||!feature||!activity||unable(actor)||!reserved&&reactionUsed(actor)||source.parent?.id!==target.parent?.id||!flashFriendly(source,target))return null;
 const limit=/^(m|meters?|metres?)$/i.test(String(source.parent.grid?.units))?9.144:30;
 if(source.actor.uuid!==target.actor.uuid&&blessingDistance(source,target)>limit)return null;
 return {actor,feature,activity,source,target};
}
export function countercharmSnapshot(card){
 if(!enabled()||card.type!=='save'||!countercharmCondition(card))return {entries:[]};const target=targetOf(card);if(!target)return {entries:[]};
 const entries=[],seen=new Set();for(const source of values(target.parent?.tokens)){const e=entry(card,source);if(!e||seen.has(e.actor.uuid))continue;seen.add(e.actor.uuid);entries.push({actor:e.actor.uuid,feature:e.feature.uuid,source:source.uuid,target:target.uuid});}return {entries};
}
export function countercharmCandidates(card,user=game.user,index=0,{reserved=false}={}){
 if(!visible(card,user)||!eligible(card,index))return [];
 return (flag(card,'countercharmSnapshot')?.entries??[]).map(s=>{
  const e=entry(card,resolve(s.source),{reserved});return e&&(user?.isGM||e.actor.testUserPermission?.(user,'OWNER'))&&e.actor.uuid===s.actor&&e.feature.uuid===s.feature&&e.target.uuid===s.target?e:null;
 }).filter(Boolean);
}
export function captureCountercharm(card){
 if(jobs.has(card))return jobs.get(card);const job=(async()=>{
  if(!authority()||card?.type!=='save'||captured.has(card))return;captured.add(card);
  if(card.author?.isGM&&flag(card,'countercharmSnapshot')!==undefined)return;
  await card.setFlag(ID,'countercharmSnapshot',countercharmSnapshot(card));globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
 })();jobs.set(card,job);return job;
}
export async function rerollCountercharm(original){
 const adjusted=original.constructor.fromData(foundry.utils.deepClone(original.toJSON())),o=original.options??{},state=o['automated-conditions-5e'];
 const dis=state?.modeCounts?!!(state.modeCounts.disadvantages?.present||state.modeCounts.noAdvantages?.present||state.explicitModeOverride?.action==='disadvantage'):!!o.disadvantage||o.advantageMode===-1,mode=dis?0:1;
 const die=new CONFIG.Dice.D20Die({number:1,faces:20});die.applyAdvantage?.(mode);die.applyFlag?.('halflingLucky',o.halflingLucky===true);die.applyRange?.({minimum:o.minimum,maximum:o.maximum});await die.evaluate({allowInteractive:false});
 const results=foundry.utils.deepClone(finalD20Results(die.results));if(results.length!==(mode===1?2:1))throw Error('Countercharm did not produce the expected replacement dice.');
 Object.assign(adjusted.options,{advantage:true,disadvantage:dis,advantageMode:mode});adjusted.d20.applyAdvantage?.(mode);adjusted.d20.number=mode===1?2:1;
 const winner=Math.max(...results.map(d20ResultValue)),index=results.findIndex(r=>d20ResultValue(r)===winner);
 for(const r of adjusted.d20.results){r.active=false;r.discarded=true;r.rerolled=true;}
 adjusted.d20.results.push(...results.map((r,i)=>({...r,active:i===index,discarded:i!==index})));adjusted.options.rsaSaveDicePool=results;adjusted.resetFormula();adjusted._total=adjusted._evaluateTotal();return {roll:adjusted,results};
}
const signature=c=>seekingSnapshot(c)+JSON.stringify(c.rolls.map(r=>r.options?.target));
export function applyCountercharm(card,actorUuid,index=0,user=game.user){return enqueue(async()=>{
 if(!authority()||!user?.active)throw Error('A connected GM is required for Countercharm.');
 let e=countercharmCandidates(card,user,index).find(e=>e.actor.uuid===actorUuid);if(!e)throw Error('Countercharm requires a failed Charmed/Frightened save, an available Reaction and a Bard within 30 feet. Undo applied damage/effects first.');
 const before=signature(card);await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 e=countercharmCandidates(card,user,index).find(e=>e.actor.uuid===actorUuid);if(!e||signature(card)!==before)throw Error('The save or Bard changed.');let marker,committed=false;
 try{
  marker=await recordReactionUse(e.activity,{}, {message:{id:card.id}});
  if(game.settings.get(ID,'reactionTracker')===true&&game.combat?.started&&values(game.combat.combatants).some(c=>c.actor?.uuid===actorUuid)&&marker?.getFlag?.(ID,'reactionUsage')!==card.id)throw Error('Could not reserve the Bard’s Reaction.');
  const result=await rerollCountercharm(card.rolls[index]);await animateNewSaveDice(card,result.results,user);
  const current=countercharmCandidates(card,user,index,{reserved:true}).find(c=>c.actor.uuid===actorUuid&&c.feature.uuid===e.feature.uuid);
  if(!current||signature(card)!==before||marker&&(marker.disabled||marker.getFlag?.(ID,'reactionUsage')!==card.id))throw Error('The save or Bard changed during Countercharm.');
  const rolls=[...card.rolls];rolls[index]=result.roll;const used={...flag(card,'countercharmUsed'),[index]:{actor:actorUuid,name:e.actor.name,feature:e.feature.uuid}},skip=card.getFlag?.('dice-so-nice','skip');
  try{await card.update({rolls,['flags.'+ID+'.countercharmUsed']:used,'flags.dice-so-nice.skip':true});committed=true;}
  finally{if(skip===undefined)await card.unsetFlag('dice-so-nice','skip');else await card.setFlag('dice-so-nice','skip',skip);}
 }catch(error){if(!committed&&marker?.getFlag?.(ID,'reactionUsage')===card.id)await marker.update({disabled:true});throw error;}
 finally{if(committed)restoreFocusTargets(card);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
});}
function report(error){console.error('Countercharm',error);ui.notifications.error(error.message);}
async function request(card,e,index,b){b.disabled=true;try{const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'countercharm',card:card.id,actor:e.actor.uuid,index,user:game.user.id,gm:gm.id});else await applyCountercharm(card,e.actor.uuid,index);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}}
export function renderCountercharm(message,html){const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 for(const {card,node}of [{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))]){
  for(const old of node.querySelectorAll(':scope > .rsa-countercharm'))old.remove();if(!visible(card,game.user))continue;const row=document.createElement('div');row.className='rsa-attack-actions rsa-countercharm';
  for(const [index]of(card.rolls??[]).entries())for(const e of countercharmCandidates(card,game.user,index)){const b=document.createElement('button');b.type='button';b.textContent='Countercharm';b.title=e.actor.name+' · Reaction · reroll with Advantage';b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();request(card,e,index,b);});row.append(b);}
  for(const e of Object.values(flag(card,'countercharmUsed')??{})){const label=document.createElement('span');label.textContent='Countercharm ('+e.name+')';row.append(label);}if(row.childNodes.length)node.append(row);
 }
}
Hooks.once('init',()=>game.settings.register(ID,'countercharmAutomation',{name:'Bard: Countercharm',hint:'Offer a Reaction on failed saves against configured Charmed/Frightened effects for self or a friendly creature within 30 feet. Reroll with Advantage, retain other modifiers and normal disadvantage cancellation, and keep the new result.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationCountercharm={candidates:countercharmCandidates,capture:captureCountercharm};
 Hooks.on('preCreateChatMessage',card=>{if(card.type==='save'&&game.user.isGM)card.updateSource({['flags.'+ID+'.countercharmSnapshot']:countercharmSnapshot(card)});});Hooks.on('createChatMessage',card=>captureCountercharm(card).catch(report));Hooks.on('dnd5e.renderChatMessage',renderCountercharm);
 for(const event of ['createItem','updateItem','deleteItem','createActiveEffect','updateActiveEffect','deleteActiveEffect','updateActor','updateCombat'])Hooks.on(event,(doc,change)=>globalThis.Ugmuls55eAutomationChatRefresh?.request('countercharm',doc,change));
 game.socket.on('module.'+ID,p=>{if(p?.action==='countercharmError'&&p.user===game.user.id){ui.notifications.error(p.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(p.card));return;}if(p?.action!=='countercharm'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user),card=game.messages.get(p.card);if(!user?.active||!card)return;applyCountercharm(card,p.actor,p.index,user).catch(error=>{report(error);game.socket.emit('module.'+ID,{action:'countercharmError',user:user.id,card:card.id,error:error.message});});});
});
