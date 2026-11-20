import {mapSpellDeclaration,saveSource,saveDamageBlocked,saveContinuationChanged} from './save-reaction-timing.js';
import {reactionSpellCastPlan,useReactionSpellPlan} from './reaction-spell-resources.js';
import {recordReactionUse} from './reaction-tracker.js';
import {describeTarget} from './shared-activity-card.js';
import {bendSees} from './bend-luck.js';
import {tokenDistance} from './shared-distance.js';
import {sendSavePrompt} from './save-prompts.js';
import {presentReactionButtons} from './reaction-button-presentation.js';
// Timing: declaring-spell / spell-declared, before native costs and templates.
// Every Counterspell enters this gate too. Do not bypass it for response casts.
const ID='ugmuls-5-5e-automation',reservations=new Map(),jobs=new Map(),waiting=new Map(),rpc=new Map(),settling=new Set(),responseDeclarations=new Map(),resultsQueued=new Map(),settleAgain=new Set();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(c,k)=>c?.getFlag?.(ID,k),doc=t=>t?.document??t;
const resolve=uuid=>{try{return uuid?fromUuidSync(uuid,{strict:false}):null;}catch{return null;}};
const authority=()=>game.user?.isGM&&game.users.activeGM?.id===game.user.id;
const enabled=()=>game.settings.get(ID,'counterspellAutomation')===true;
const owns=(actor,user)=>!!actor&&!!user&&(user.isGM||actor.testUserPermission(user,'OWNER'));
export const counterspellState=card=>flag(card,'counterspellWindow');
export const counterspellPending=card=>['pending','casting','save'].includes(counterspellState(card)?.phase);
export function counterspellPlan(actor){
 const plan=reactionSpellCastPlan(actor,'counterspell',{activityType:'save'});
 return plan&&plan.item.system.source?.rules!=='2014'&&values(plan.activity.save?.ability).includes('con')?plan:null;
}
export function spellObservable(activity){
 const properties=activity?.item?.system?.properties;
 return ['vocal','verbal','somatic','material','v','s','m'].some(p=>properties?.has?.(p)||Array.isArray(properties)&&properties.includes(p));
}
export function spellCasterToken(activity){
 const token=doc(activity.getUsageToken?.())??doc(activity.actor?.token);
 if(token?.actor?.uuid===activity.actor?.uuid)return token;
 const matches=values(game.combat?.combatants).map(c=>c.token).filter(t=>t?.actor?.uuid===activity.actor?.uuid);
 return matches.length===1?matches[0]:null;
}
export function counterspellEnemies(a,b){return Number(a?.disposition)*Number(b?.disposition)<0;}
export function counterspellCandidates(caster,activity,{declined=[],user=null}={}){
 if(!enabled()||!game.combat?.started||!caster?.actor||!spellObservable(activity))return [];
 const entries=[],seen=new Set();
 for(const combatant of values(game.combat.combatants)){
  const token=combatant.token,actor=token?.actor;
  if(!actor||seen.has(actor.uuid)||actor.uuid===caster.actor.uuid||declined.includes(actor.uuid)||reservations.has(actor.uuid)||user&&!owns(actor,user))continue;
  seen.add(actor.uuid);
  if(!counterspellEnemies(token,caster))continue;
  const plan=counterspellPlan(actor);if(!plan||!bendSees(token,caster))continue;
  const range=plan.activity.range??plan.item.system.range,raw=Number(range?.value)||60;
  const meters=/^(m|meters?|metres?)$/i.test(caster.parent?.grid?.units??'ft');
  const nativeMeters=/^(m|meters?|metres?)$/i.test(range?.units??'ft');
  const limit=meters===nativeMeters?raw:meters?raw*0.3048:raw/0.3048;
  if(tokenDistance(token,caster)>limit+1e-7)continue;
  entries.push({actor,token,plan});
 }
 return entries;
}
const entriesFor=(card,user=null)=>{const s=counterspellState(card);return s?counterspellCandidates(resolve(s.caster),resolve(s.activity),{declined:s.declinedActors,user}):[];};
function wake(card){
 const s=counterspellState(card),listener=waiting.get(card.id);
 if(listener&&['continued','countered','canceled'].includes(s?.phase)){waiting.delete(card.id);s.phase==='canceled'?listener.reject(Error('Spell declaration canceled.')):listener.resolve(s.phase!=='countered');}
}
async function setState(card,s){await card.setFlag(ID,'counterspellWindow',s);wake(card);}
function waitForDecision(card,opened){
 const state=counterspellState(card)??opened;
 if(!['pending','casting','save'].includes(state?.phase))return Promise.resolve(state?.phase!=='countered');
 return new Promise((resolve,reject)=>waiting.set(card.id,{resolve,reject}));
}
function request(action,payload){
 if(authority())return handle(action,payload,game.user);
 const gm=game.users.activeGM;if(!gm)throw Error('A connected GM is required for Counterspell.');
 const id=foundry.utils.randomID();
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{rpc.delete(id);reject(Error('The GM did not receive the Counterspell request.'));},15000);
  rpc.set(id,{resolve,reject,timer,gm:gm.id});
  game.socket.emit('module.'+ID,{action:'counterspellRequest',operation:action,...payload,user:game.user.id,gm:gm.id,request:id});
 });
}
export async function declareCounterspell({activity,message}){
 if(!enabled()||!game.combat?.started||!game.users.activeGM||!spellObservable(activity))return true;
 const caster=spellCasterToken(activity);if(!caster)return true;
 // Ask the authority first: a player may not know an NPC's spell resources.
 const eligible=await request('probe',{activity:activity.uuid,caster:caster.uuid});if(!eligible)return true;
 // Capture the native starting targets once. Response casts supply an exact
 // caster target and must never inherit another user's current selection.
 message.data??={};message.data.system??={};
 message.data.system.targets??=values(game.user.targets).map(t=>describeTarget(doc(t)));
 const card=await globalThis.Ugmuls55eAutomationPendingCast.declare(activity,message);
 const opened=await request('open',{card:card.id,activity:activity.uuid,caster:caster.uuid});
 return waitForDecision(card,opened);
}
export async function openCounterspell(card,activity,caster,user){
 if(!card||card.author?.id!==user.id||!owns(activity?.actor,user)||activity?.item?.type!=='spell'||!flag(card,'pendingCast')||!flag(card,'castSession')||caster?.actor?.uuid!==activity.actor.uuid||card.getAssociatedActivity?.()?.uuid!==activity.uuid)throw Error('Invalid spell declaration.');
 if(counterspellState(card))return counterspellState(card);
 const entries=counterspellCandidates(caster,activity);
 if(!entries.length)return;
 const snapshot=entries.map(e=>({actor:e.actor.uuid,token:e.token.uuid,item:e.plan.item.uuid}));
 await card.update({['flags.'+ID+'.counterspellSnapshot']:{entries:snapshot},['flags.'+ID+'.counterspellWindow']:{id:foundry.utils.randomID(),stage:'declaring-spell',phase:'pending',caster:caster.uuid,activity:activity.uuid,declinedActors:[]}});
 return counterspellState(card);
}
export async function resolveCounterspell(card,user){
 const s=counterspellState(card);if(s?.phase!=='pending')return;
 if(user.isGM){await setState(card,{...s,phase:'continued'});return;}
 const actors=entriesFor(card,user).map(e=>e.actor.uuid);if(!actors.length)throw Error('No owned Counterspell choices remain.');
 const next={...s,declinedActors:[...new Set([...s.declinedActors,...actors])]};
 if(!counterspellCandidates(resolve(s.caster),resolve(s.activity),{declined:next.declinedActors}).length)next.phase='continued';
 await setState(card,next);
}
export function ownsCounterspellReservation(activity,message){
 const actor=activity?.actor??activity?.item?.actor,response=message?.data?.flags?.[ID]?.counterspellResponse;
 return !!response&&reservations.get(actor?.uuid)?.request===response.request;
}
export async function spendInterruptedReaction(activity,card,message){
 // A countered Counterspell wastes its Reaction while retaining its slot.
 await recordReactionUse(activity,{}, {message:card});
}
export async function useCounterspell(card,tokenUuid,user){
 const s=counterspellState(card);if(s?.phase!=='pending'||jobs.has(card.id))throw Error('This spell decision has already changed.');
 const candidate=entriesFor(card,user).find(e=>e.token.uuid===tokenUuid);if(!candidate)throw Error('Counterspell requires a visible caster in range, a Reaction and available casting resources.');
 const requestId=foundry.utils.randomID(),reservation={request:requestId,card:card.id};let committed=false;
 reservations.set(candidate.actor.uuid,reservation);jobs.set(card.id,requestId);
 try{
  await setState(card,{...s,phase:'casting',request:requestId,responder:candidate.actor.uuid});
  const response={declaration:card.id,window:s.id,request:requestId,actor:candidate.actor.uuid};
  const result=await useReactionSpellPlan(candidate.plan,{usage:{subsequentActions:false,create:{measuredTemplate:false}},message:{data:{system:{targets:[describeTarget(resolve(s.caster))]},flags:{[ID]:{counterspellResponse:response}}}}});
  // Counterspelled responses return no native result. Their own declaration
  // already spent the wasted Reaction, without charging the spell slot.
  if(!result?.message){const responseCard=responseDeclarations.get(requestId);await setState(card,{...s,phase:counterspellState(responseCard)?.phase==='countered'?'continued':'pending'});return;}
  committed=true;
  await setState(card,{...s,phase:'save',request:requestId,responder:candidate.actor.uuid,response:result.message.id});
  await result.message.setFlag(ID,'counterspellReady',true);
  await sendSavePrompt(result.message,resolve(s.caster),'spell');
  await finishCounterspell(result.message);
 }catch(error){
  // Native cancellation/failed consumption keeps this decision available.
  if(!committed&&counterspellState(card)?.request===requestId)await setState(card,{...s,phase:'pending'});
  throw error;
 }finally{
  jobs.delete(card.id);responseDeclarations.delete(requestId);
  if(counterspellState(card)?.phase!=='save'&&reservations.get(candidate.actor.uuid)===reservation)reservations.delete(candidate.actor.uuid);
 }
}
// Native outcome caches are invalidated after document hooks, and Dice So Nice
// may still be animating at publication. Defer this exact source's evaluation;
// roll completion and adjustment changes retry it without scanning history.
export function scheduleCounterspellResult(card){
 if(!authority()||!['usage','save'].includes(card?.type))return;
 const source=saveSource(card);
 if(!flag(source,'counterspellReady')||!flag(source,'counterspellResponse')||resultsQueued.has(source.id))return;
 resultsQueued.set(source.id,setTimeout(()=>{
  resultsQueued.delete(source.id);
  const current=game.messages.get(source.id);if(current)finishCounterspell(current).catch(report);
 },0));
}
export async function finishCounterspell(response){
 if(!authority()||!flag(response,'counterspellReady'))return;
 if(settling.has(response.id)){settleAgain.add(response.id);return;}
 const link=flag(response,'counterspellResponse'),card=game.messages.get(link?.declaration),s=counterspellState(card);
 if(s?.phase!=='save'||s.response!==response.id||s.id!==link.window||s.request!==link.request)return;
 if(saveDamageBlocked(response))return;
 const outcome=response.system.outcomes?.get(s.caster);if(!['success','failure'].includes(outcome))return;
 settling.add(response.id);
 try{
  for(const save of response.getAssociatedRolls?.('save')??[]){
   if(flag(save,'saveTimingAdjusting')||['pending','revealing'].includes(flag(save,'reactionTimingWindow')?.status))return;
   await globalThis.Ugmuls55eAutomationDamage?.waitForAttackAnimation?.(save);
   await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(save);
  }
  if(counterspellState(card)?.request!==link.request||counterspellState(card)?.phase!=='save')return;
  const current=response.system.outcomes?.get(s.caster);
  if(['success','failure'].includes(current)){
   await setState(card,{...s,phase:current==='failure'?'countered':'continued'});
   if(reservations.get(s.responder)?.request===link.request)reservations.delete(s.responder);
  }
 }finally{settling.delete(response.id);if(settleAgain.delete(response.id))scheduleCounterspellResult(response);}
}
async function handle(action,payload,user){
 if(!authority()||!user?.active)return;
 if(action==='probe'){
  const activity=resolve(payload.activity),caster=resolve(payload.caster);
  if(!owns(activity?.actor,user)||activity?.item?.type!=='spell'||caster?.actor?.uuid!==activity.actor.uuid)return false;
  return counterspellCandidates(caster,activity).length>0;
 }
 const card=game.messages.get(payload.card);
 if(action==='open')return openCounterspell(card,resolve(payload.activity),resolve(payload.caster),user);
 if(!card||counterspellState(card)?.id!==payload.window)throw Error('This spell decision has already changed.');
 if(action==='resolve')return resolveCounterspell(card,user);
 if(action==='cast'){
  // A response may itself wait on another declaration. Acknowledge the click
  // immediately; its entire chain must not be subject to a transport timeout.
  if(counterspellState(card)?.phase!=='pending'||jobs.has(card.id)||!entriesFor(card,user).some(e=>e.token.uuid===payload.token))throw Error('This Counterspell choice is no longer available.');
  useCounterspell(card,payload.token,user).catch(report);return;
 }
}
function report(error){console.error('Counterspell',error);ui.notifications.error(error.message??'Could not resolve Counterspell.');}
export function renderCounterspell(message,html){
 const root=html?.querySelector?html:html?.[0];if(!root)return;
 const entries=[{card:message,root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),root:node}))];
 for(const entry of entries){
  entry.root.querySelectorAll(':scope > .rsa-counterspell').forEach(n=>n.remove());
  const s=counterspellState(entry.card);if(!s||entry.card.isContentVisible===false)continue;
  const box=document.createElement('div');box.className='rsa-counterspell rsa-attack-actions';
  if(counterspellPending(entry.card)){
   entry.root.querySelectorAll('.card-buttons,.rsa-pending-cast').forEach(n=>n.hidden=true);
   const label=document.createElement('p');label.textContent=s.phase==='save'?'Counterspell — waiting for the caster’s save':s.phase==='casting'?'Counterspell — resolving the response':'Spell declared — reaction decision';box.append(label);
   if(s.phase==='pending'){
    const choices=entriesFor(entry.card,game.user);
    for(const c of choices){
     const button=document.createElement('button');button.type='button';button.dataset.rsaCounterspell=c.token.uuid;button.dataset.rsaReactionItemUuid=c.plan.item.uuid;
     button.textContent='Counterspell — '+(c.token.name??c.actor.name);
     button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();button.disabled=true;request('cast',{card:entry.card.id,window:s.id,token:c.token.uuid}).catch(report);});box.append(button);
    }
    if(game.user.isGM||choices.length){const button=document.createElement('button');button.type='button';button.textContent='Decline Reaction';button.title=game.user.isGM?'Decline all remaining Counterspell reactions and continue this spell.':'Decline your Counterspell choices. Other players can still react.';button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();button.disabled=true;request('resolve',{card:entry.card.id,window:s.id}).catch(report);});box.append(button);}
   }
  }else if(s.phase==='countered'){box.textContent='Counterspelled — spell stopped';entry.root.querySelectorAll('.card-buttons,.rsa-pending-cast').forEach(n=>n.hidden=true);}
  if(box.childNodes.length){entry.root.append(box);presentReactionButtons(box);}
 }
}
Hooks.once('init',()=>game.settings.register(ID,'counterspellAutomation',{name:'Counterspell',hint:'Pause observable spell declarations in combat for eligible opposing Counterspells within range. Uses native Constitution saves, casting resources and Reactions; supports Counterspell chains.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationCounterspell={reservation:actor=>reservations.get(actor?.uuid),ownsReservation:ownsCounterspellReservation,spendInterruptedReaction,pending:counterspellPending};
 mapSpellDeclaration('counterspell',declareCounterspell);
 game.socket.on('module.'+ID,packet=>{
  if(packet?.action==='counterspellReply'){
   const pending=rpc.get(packet.request);if(!pending||packet.gm!==pending.gm||packet.user!==game.user.id)return;
   clearTimeout(pending.timer);rpc.delete(packet.request);packet.error?pending.reject(Error(packet.error)):pending.resolve(packet.result);return;
  }
  if(packet?.action!=='counterspellRequest'||!authority()||packet.gm!==game.user.id)return;
  const user=game.users.get(packet.user);if(!user?.active)return;
  Promise.resolve(handle(packet.operation,packet,user)).then(result=>game.socket.emit('module.'+ID,{action:'counterspellReply',request:packet.request,gm:game.user.id,user:user.id,result}),error=>game.socket.emit('module.'+ID,{action:'counterspellReply',request:packet.request,gm:game.user.id,user:user.id,error:error.message}));
 });
 Hooks.on('dnd5e.renderChatMessage',renderCounterspell);
 // Only the changed source or its indexed origin is inspected. No history scan.
 const changed=(card,changes)=>{
  const response=flag(card,'counterspellResponse');
  if(response&&jobs.get(response.declaration)===response.request)responseDeclarations.set(response.request,card);
  wake(card);
  if(!changes||saveContinuationChanged(changes)||Object.hasOwn(changes,'flags.'+ID+'.counterspellReady')||Object.hasOwn(changes.flags?.[ID]??{},'counterspellReady'))scheduleCounterspellResult(card);
 };
 Hooks.on('createChatMessage',card=>changed(card));
 Hooks.on('updateChatMessage',changed);
 Hooks.on('diceSoNiceRollComplete',id=>scheduleCounterspellResult(game.messages.get(id)));
 Hooks.on('deleteChatMessage',card=>{for(const [actor,reservation]of reservations)if(reservation.card===card.id)reservations.delete(actor);const pending=waiting.get(card.id);if(pending){waiting.delete(card.id);pending.reject(Error('Spell declaration deleted.'));}});
 const refresh=document=>globalThis.Ugmuls55eAutomationChatRefresh?.request('counterspell',document);
 for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect','updateActor','createItem','updateItem','deleteItem','updateCombat','deleteCombat'])Hooks.on(event,refresh);
});
