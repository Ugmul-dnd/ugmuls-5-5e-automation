import {createEventQueue,describeTarget,isEligibleHealingTarget,linkedHpCards} from './shared-activity-card.js';
import {withinWrathRange} from './wrath-of-the-sea.js';
import {startupActors} from './startup-actors.js';
const ID='ugmuls-5-5e-automation',FORMS=['archer','chalice','dragon'],enqueue=createEventQueue(),wrapped=new WeakSet(),dialogs=new Set(),waiting=new Map(),claims=new Map(),posting=new Map(),healing=new Set(),chaliceRunning=new Set(),ending=new Map();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
const enabled=()=>game.settings.get(ID,'starryFormAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null,live=e=>e&&!e.disabled&&!e.isSuppressed&&!e.duration?.expired&&e.active!==false;
const feature=(actor,id)=>values(actor?.items).find(i=>i.type==='feat'&&key(i)===id&&i.system?.source?.rules!=='2014'),owns=(a,u)=>!!a&&!!u?.active&&(u.isGM||a.testUserPermission?.(u,'OWNER')),incap=a=>['incapacitated','unconscious','dead','paralyzed','petrified','stunned'].some(s=>a?.statuses?.has(s)),actorOf=e=>e?.parent?.documentName==='Actor'?e.parent:e?.parent?.actor;
export const starryEffect=actor=>{
 const item=feature(actor,'starry-form'),source=starryEnchantment(actor);
 if(source){const buff=nativeStarryBuff(item,source);if(live(buff))return buff;}
 // Turn prompts follow the actual active buff, not module synchronization
 // flags or disabled source templates on the feature.
 return [...new Set([...values(actor?.appliedEffects),...values(actor?.effects)])].find(e=>live(e)&&(e.name?.trim()==='Starry Form'||flag(e,'starryForm'))&&(!source||!flag(e,'starryForm')?.enchantment||flag(e,'starryForm').enchantment===source.uuid))??null;
};
export const starryItem=i=>enabled()&&i?.type==='feat'&&key(i)==='starry-form'&&i.system?.source?.rules!=='2014';
const sourceToken=(a,ref)=>{const token=resolve(ref);return token?.actor?.uuid===a?.uuid?token:a?.token??values(globalThis.canvas?.scene?.tokens).find(t=>t.actor?.uuid===a?.uuid);};
const activity=(item,id)=>values(item?.system?.activities).find(a=>a.id===id),whisper=a=>values(game.users).filter(u=>u.isGM||a.testUserPermission?.(u,'OWNER')).map(u=>u.id);
const nativeUse=item=>values(item?.system?.activities).find(a=>a.type==='enchant'&&a.enchant?.self);
export function starryTiming(effect){
 const raw=effect.toObject?.()??effect._source??effect,start=raw.start?{...raw.start}:null;
 // V14 prepares start.combat as a live Combat document. Capture source IDs,
 // and also normalize snapshots written before this fix, before cloning.
 if(start)for(const field of ['combat','combatant'])if(start[field]&&typeof start[field]==='object'){
  const id=start[field].id??start[field]._id;if(typeof id!=='string')throw Error('Starry Form has an invalid saved combat reference.');start[field]=id;
 }
 return {duration:foundry.utils.deepClone(raw.duration),start:foundry.utils.deepClone(start)};
}
const profileForm=(item,source)=>{const use=nativeUse(item),profile=values(use?.effects).find(p=>(p._id??p.id)===(source?.flags?.dnd5e?.enchantmentProfile??source?.system?.origin?.profile)),template=values(item?.effects).find(e=>e.id===(profile?._id??profile?.id));return FORMS.find(form=>template?.name?.trim().toLowerCase()===form+' form');};
export function starryEnchantment(actor){
 const item=feature(actor,'starry-form'),use=nativeUse(item);if(!use)return null;
 return values(item.effects).find(e=>live(e)&&e.type==='enchantment'&&!!profileForm(item,e)&&(!e.system?.origin?.activity||e.system.origin.activity===use.uuid))??null;
}
const nativeStarryBuff=(item,source)=>[...values(item?.effects),...values(item?.actor?.appliedEffects),...values(item?.actor?.effects)].find(e=>e.type==='base'&&e.name==='Starry Form'&&[source?.id,source?.uuid].includes(e.flags?.dnd5e?.dependentOn));
export function starryCastingState(actor){
 if(incap(actor))return null;
 const source=starryEnchantment(actor),item=feature(actor,'starry-form');if(!item)return null;
 if(source){
  const effect=nativeStarryBuff(item,source)??starryEffect(actor);if(!live(effect))return null;
  const recorded=flag(effect,'starryForm'),token=sourceToken(actor,recorded?.token??nativeUse(item)?.getUsageToken?.()?.uuid);
  return {effect,state:{...recorded,form:profileForm(item,source),instance:source.uuid,enchantment:source.uuid,item:item.uuid,token:token?.uuid}};
 }
 const effect=starryEffect(actor);if(!effect)return null;const recorded=flag(effect,'starryForm'),token=sourceToken(actor,recorded?.token??nativeUse(item)?.getUsageToken?.()?.uuid);return {effect,state:{...recorded,form:null,enchantment:null,instance:effect.uuid,item:item.uuid,token:token?.uuid}};
}
function starryActivity(item,type){
 const source=starryEnchantment(item?.actor),dependent=source?.id;
 return values(item?.system?.activities).find(a=>a.type===type&&dependent&&a.flags?.dnd5e?.dependentOn===dependent)??(!source||type==='attack'?activity(item,type==='attack'?'p7kyVDBkGfvzMhBe':'MB5jAofmEgGSPiEb'):null);
}
export async function openStarry(item,{swap=false,card=null}={}){
 const actor=item?.actor,use=nativeUse(item);if(!starryItem(item)||!owns(actor,game.user)||!use||incap(actor))throw Error('The native Assume Form activity is unavailable.');
 if(dialogs.has(actor.uuid))return;dialogs.add(actor.uuid);
 try{
  const usage={},message={data:{flags:{[ID]:{}}}};
  if(swap){
   const c=starryContext(card);validateStarryChoice(c);
   const source=starryEnchantment(actor);if(!source||source.uuid!==c.state.enchantment)throw Error('This Starry Form has changed.');
   usage.consume=false;
   const other=values(use.effects).find(p=>(p._id??p.id)!==source.flags.dnd5e.enchantmentProfile);if(other)usage.enchantmentProfile=other._id??other.id;
   message.data.flags[ID].riderTriggered=true;
   message.data.flags[ID].starrySwap={source:source.uuid,instance:c.state.instance,card:card.id,startedTurn:c.state.startedTurn??null,...starryTiming(source),archerTurn:flag(c.effect,'starryArcherTurn')??null};
  }
  // Keep the native profile chooser and enchantment lifecycle. A swap is a
  // free feature use; only an initial assumption pays the native BA/resource.
  return await use.use(usage,{configure:true},message);
 }finally{dialogs.delete(actor.uuid);}
}
export function paidStarryUse(card){
 return values(card?.system?.deltas?.item).flatMap(values).some(d=>d.keyPath==='system.uses.spent'&&d.delta>0||d.keyPath==='system.uses.value'&&d.delta<0)||values(card?.system?.deltas?.actor).some(d=>/^system\.resources\.[^.]+\.value$/.test(d.keyPath)&&d.delta<0);
}
export async function syncStarryEnchantment(item){
 if(!enabled()||!authority()||!starryItem(item))return;
 const actor=item.actor,source=starryEnchantment(actor);if(!source)return;
 const buff=nativeStarryBuff(item,source);if(!buff||!live(buff))return;
 const form=profileForm(item,source),prior=flag(buff,'starryForm');if(prior?.enchantment===source.uuid&&prior.form===form)return;
 const card=resolve(source.system.origin.message),token=sourceToken(actor,card?.getAssociatedToken?.()?.uuid??nativeUse(item)?.getUsageToken?.()?.uuid);
 if(card&&card.getAssociatedActor?.()?.uuid!==actor.uuid||!token)return;
 const swap=flag(card,'starrySwap');
 if(swap&&swap.source!==source.uuid&&swap.duration&&swap.start)await source.update(starryTiming(swap),{rsaStarsSync:true});
 // An existing enchantment may outlive its chat message. Recover its controls
 // without manufacturing another activation shot after reload/history cleanup.
 const initial=!swap&&form==='archer'&&paidStarryUse(card)&&flag(card,'starryAssumeTurn')===turn();
 const state={form,instance:source.uuid,enchantment:source.uuid,item:item.uuid,token:token.uuid,source:source.system.origin.message,startedTurn:swap?swap.startedTurn??null:flag(card,'starryAssumeTurn')??null,initialTurn:initial?turn():null,initialAvailable:initial};
 // Tag the real native rider; light, Dragon benefits and Full of Stars remain
 // entirely native. No duplicate actor buff or copied resistance changes.
 await buff.update({['flags.'+ID+'.starryForm']:state,...(swap?{['flags.'+ID+'.starryArcherTurn']:swap.archerTurn??null,['flags.'+ID+'.starryArcherInitialUsed']:source.uuid}:{})},{rsaStarsSync:true});
 const previous=values(actor.effects).filter(e=>e!==buff&&flag(e,'starryForm')&&!flag(e,'starryForm').enchantment);if(previous.length)await actor.deleteEmbeddedDocuments('ActiveEffect',previous.map(e=>e.id),{rsaStarsSync:true});
 if(initial)await postStarryCard(buff,'initial');
 if(swap||flag(actor,'starryTurnPrompt')?.stamp===turn())await postStarryCard(buff,'actions');
 refreshStarry(buff);
}
function currentStarryEnchantment(effect){
 const item=effect?.parent,use=nativeUse(item),origin=effect?.system?.origin;
 if(!starryItem(item)||effect?.type!=='enchantment'||!use?.uuid||origin?.activity!==use.uuid||!origin.message)return null;
 return values(item.effects).find(e=>e.id===effect.id&&e.uuid===effect.uuid)??null;
}
export async function deleteStarryEnchantment(effect){
 if(!enabled()||!authority()||!currentStarryEnchantment(effect))return;
 const pending=ending.get(effect.uuid);if(pending)return pending;
 const task=(async()=>{
  // Re-check membership when the queued cleanup executes; native dependent
  // deletion may already have removed this exact source. Never target a swap's
  // replacement enchantment, and coalesce our own overlapping cleanup hooks.
  const current=currentStarryEnchantment(effect);if(current)await current.delete({rsaStarsSync:true});
 })();ending.set(effect.uuid,task);
 try{return await task;}finally{ending.delete(effect.uuid);}
}
export async function endStarryEffect(effect,options={}){
 const state=flag(effect,'starryForm'),actor=actorOf(effect);if(!enabled()||!authority()||options.rsaStarsSync||!state?.enchantment||!actor)return;
 // Native expiry/suppression owns its cleanup. Only an explicit buff removal,
 // disable or incapacitation asks us to end the linked native enchantment.
 if(!options.deleted&&!effect.disabled&&!incap(actor))return;
 const source=resolve(state.enchantment);
 if(source?.parent?.uuid===state.item&&source.system?.origin?.message===state.source)await deleteStarryEnchantment(source);
 refreshStarry(effect);
}
export async function postStarryTurn(combat){
 if(!enabled()||!authority()||!combat?.started)return;
 const actor=combat.combatant?.actor,effect=starryEffect(actor);if(!effect)return;
 return postStarryCard(effect,'actions',false,combat);
}
export async function postStarryCard(effect,kind='actions',_initial=false,combat=game.combat){
 if(!authority()||!enabled()||!live(effect))return;
 const actor=actorOf(effect),active=starryCastingState(actor),state=active?.state,token=sourceToken(actor,state?.token);if(!active||incap(actor)||!token)return;
 const initial=kind==='initial',stamp=combat?.started?combat.id+':'+combat.round+':'+combat.turn:null,canSwap=!!feature(actor,'twinkling-constellations'),archer=state.form==='archer';
 if(initial&&(!archer||!state.initialAvailable||state.initialTurn!==stamp))return;
 if(!initial&&!canSwap&&!archer)return;
 const marker=initial?'starryInitialPrompt':'starryTurnPrompt',holder=initial?effect:actor,old=flag(holder,marker),signature=initial?'initial':String(canSwap)+':'+String(archer),pendingKey=actor.uuid+':'+marker+':'+(initial?state.instance:stamp);
 const pending=posting.get(pendingKey);if(pending){pending.dirty||=pending.signature!==signature;return;}const publication={signature,dirty:false};posting.set(pendingKey,publication);
 try{
  const existing=old?.stamp===stamp&&(!initial||old.instance===state.instance)?game.messages.get(old.card):null;
  if(existing&&old.signature===signature){globalThis.Ugmuls55eAutomationChatRefresh?.card(existing);return existing;}
  const prompt={actor:actor.uuid,effect:effect.uuid,instance:state.instance,kind:initial?'archer':'actions',initial,turn:stamp,stamp},buttons=[];
  if(initial)buttons.push('<button type="button" data-stars-archer data-stars-initial>Archer Shot</button>');
  else{
   if(canSwap)buttons.push('<button type="button" data-stars-swap>Swap Form</button>');
   if(archer)buttons.push('<button type="button" data-stars-archer>BA - Archer</button>');
  }
  const content='<div class="chat-card"><h3>Starry Form Actions</h3><div class="rsa-attack-actions">'+buttons.join('')+'</div></div>';
  const card=existing?(await existing.update({content,['flags.'+ID+'.starryPrompt']:prompt}),existing):await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor,token}),whisper:whisper(actor),content,flags:{[ID]:{starryPrompt:prompt}}});
  if(card){
   const recorded={instance:state.instance,stamp,signature,card:card.id};await holder.setFlag(ID,marker,recorded);
   // Legacy references are still used for targeted presentation refreshes.
   if(!initial)await effect.setFlag(ID,'starryActionsPrompt',recorded);
   globalThis.Ugmuls55eAutomationChatRefresh?.card(card);if(old?.card&&old.card!==card.id)globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(old.card));
  }
  return card;
 }finally{posting.delete(pendingKey);if(publication.dirty)await postStarryCard(starryEffect(actor)??effect,kind,false,combat);}
}
export function starryContext(card,user=game.user){
 const prompt=flag(card,'starryPrompt'),recorded=resolve(prompt?.effect),actor=resolve(prompt?.actor)??actorOf(recorded),active=starryCastingState(actor),effect=active?.effect,state=active?.state,item=resolve(state?.item),token=sourceToken(actor,state?.token);
 if(!enabled()||!prompt||!active||!owns(actor,user)||incap(actor)||!item||!token||prompt.initial&&state.instance!==prompt.instance||!prompt.actor&&state.instance!==prompt.instance)throw Error('This Starry Form has ended or changed.');
 return{prompt,effect,actor,state,item,token};
}
export function validateStarryChoice(context){
 const {actor,prompt}=context;if(!feature(actor,'twinkling-constellations')||game.combat?.started&&(prompt.turn!==turn()||game.combat.combatant?.actor?.uuid!==actor.uuid))throw Error('Swap Form requires Twinkling Constellations on the Druid’s turn.');
}
export async function switchStarry(card){const c=starryContext(card);return openStarry(c.item,{swap:true,card});}
export function archerData(context,initial){const {item,token}=context,data=item.toObject(),native=starryActivity(item,'attack'),id=native?.id??native?._id,selected=native?.toObject?.()??foundry.utils.deepClone(data.system.activities[id]);if(!selected)throw Error('The native Archer activity is unavailable.');data._id=foundry.utils.randomID();data.system.identifier='rsa-starry-archer';data.system.activities={[id]:selected};data.effects=[];selected.effects=[];if(selected.flags?.dnd5e)delete selected.flags.dnd5e.dependentOn;data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};selected.activation={type:initial?'special':'bonus',override:true};selected.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};data.flags??={};data.flags[ID]={...data.flags[ID],starsToken:token.uuid};return{data,id};}
export async function archerClaim(card,payload,user=game.user){
 const c=starryContext(card,user),requestedInitial=payload.initial??c.prompt.initial,initial=requestedInitial&&c.prompt.turn===turn()&&c.state.initialAvailable!==false&&(!c.state.enchantment||c.state.initialTurn===turn())&&flag(c.effect,'starryArcherInitialUsed')!==c.state.instance;if(requestedInitial&&!initial)throw Error('The initial Archer attack is no longer available.');if(!['archer','actions'].includes(c.prompt.kind)||c.state.form!=='archer')throw Error('Archer constellation must be active.');if(game.combat?.started&&(!initial&&(c.prompt.turn!==turn()||game.combat.combatant?.actor?.uuid!==c.actor.uuid)||flag(c.effect,'starryArcherTurn')?.turn===turn()))throw Error('Use the current turn’s Archer card.');if(!initial&&globalThis.Ugmuls55eAutomationResources?.bonusActionUsed(c.actor))throw Error('Bonus Action already used.');
 const target=resolve(payload.target),source=starryActivity(c.item,'attack'),range=Number(source?.range?.value);if(!withinWrathRange(c.token,target,range))throw Error('Choose one visible target within Archer range.');const built=archerData(c,initial),before={turn:flag(c.effect,'starryArcherTurn'),initial:flag(c.effect,'starryArcherInitialUsed'),state:c.state};
 // Reserve the entire shot atomically: one actor preparation/broadcast instead of three.
 try{await c.effect.update({['flags.'+ID+'.starryArcherTurn']:{turn:turn()??card.id,request:payload.request},...(initial?{['flags.'+ID+'.starryArcherInitialUsed']:c.state.instance}:{}),...(turn()?{['flags.'+ID+'.starryForm']:{...c.state,windowClosed:turn()}}:{})});}
 catch(error){await c.effect.setFlag(ID,'starryArcherTurn',before.turn??null);await c.effect.setFlag(ID,'starryArcherInitialUsed',before.initial??null);await c.effect.setFlag(ID,'starryForm',before.state);throw error;}
 claims.set(payload.request,{kind:'archer',effect:c.effect,before,user:user.id,prompt:card.id,stamp:turn()});if(claims.size>128)claims.delete(claims.keys().next().value);refreshStarry(c.effect);return {...built,actor:c.actor.uuid,initial,target:describeTarget(target),speaker:ChatMessage.getSpeaker({actor:c.actor,token:c.token})};
}
export async function clickArcher(card,initial){const targets=[...new Set(values(game.user.targets).map(t=>(t.document??t).uuid))];if(targets.length!==1)throw Error('Select exactly one Archer target.');const request=foundry.utils.randomID(),receipt=await operate('archer',{request,card:card.id,target:targets[0],initial});let committed=false,usageCard;try{const actor=resolve(receipt.actor),helper=new CONFIG.Item.documentClass(receipt.data,{parent:actor});helper.prepareFinalAttributes?.();const result=await helper.system.activities.get(receipt.id).use({...(receipt.initial?{consume:false}:{}),create:{measuredTemplate:false}},{configure:false},{data:{speaker:receipt.speaker,system:{targets:[receipt.target]},flags:{dnd5e:{item:{data:receipt.data}},[ID]:{activityOverrideData:receipt.data,...(receipt.initial?{riderTriggered:true}:{}),starryArcherSource:card.id}}}});usageCard=result?.message;if(usageCard)globalThis.Ugmuls55eAutomationPendingCast?.onCancel(usageCard,()=>operate('rollback',{request}));committed=!!usageCard;}finally{await operate(committed?'keep':'rollback',{request,card:usageCard?.id});}}
export function chaliceSource(card){
 if(!enabled()||!['healing','damage'].includes(card?.type)||flag(card,'pendingDamage')||!card.rolls?.length||flag(card,'starryChaliceSource'))return null;const item=card.getAssociatedActivity?.()?.item??card.getAssociatedItem?.();if(item?.type!=='spell')return null;const root=typeof card.system?.origin==='string'?game.messages.get(card.system.origin.replace(/^ChatMessage\./,'')):card.system?.origin,actor=card.getAssociatedActor?.()??root?.getAssociatedActor?.(),active=starryCastingState(actor),effect=active?.effect,state=active?.state,cast=flag(root,'starryChaliceCast');
 if(!root||incap(actor)||state?.enchantment&&starryEnchantment(actor)?.uuid!==state.enchantment||state?.form!=='chalice'||cast?.instance!==state.instance||turn()&&cast.turn!==turn()||!values(root.system?.deltas?.actor).some(d=>/^system\.spells\.(spell[1-9]|pact)\.value$/.test(d.keyPath)&&d.delta<0)||flag(root,'starryChaliceDone'))return null;
 if(!flag(card,'hpApplicationRecorded')&&!values(flag(card,'damageUndoHistory')).length)return null;
 if(!card.rolls.some(r=>{const type=r.options?.type??values(r.options?.types)[0];return Number(r.total)>0&&(type==='healing'||card.type==='healing'&&!type);}))return null;const stamp=turn()??root.id;if(flag(actor,'starryChaliceTurn')?.turn===stamp)return null;return{card,root,actor,effect,state,stamp,item};
}
export function chaliceCandidates(context){const token=sourceToken(context.actor,context.state.token);if(!token)return[];return values(token.parent?.tokens).filter(t=>isEligibleHealingTarget(t)&&!t.hidden&&(t.uuid===token.uuid||withinWrathRange(token,t,30,{sight:false,healing:true})));}
export async function offerChalice(card){
 if(!authority())return;const c=chaliceSource(card);if(!c||healing.has(c.root.id))return;healing.add(c.root.id);
 try{
  const available={source:c.root.id,healing:card.id,instance:c.state.instance},previous=flag(c.actor,'starryChaliceAvailable');
  if(previous?.source!==available.source||previous?.healing!==available.healing||previous?.instance!==available.instance)await c.actor.setFlag(ID,'starryChaliceAvailable',available);
  if(flag(c.root,'starryChaliceOffer')?.instance!==c.state.instance)await c.root.setFlag(ID,'starryChaliceOffer',{instance:c.state.instance,healing:card.id});
  globalThis.Ugmuls55eAutomationChatRefresh?.card(c.root);
 }finally{healing.delete(c.root.id);}
}
export function renderChalice(card,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 if(flag(card,'starryChalicePrompt')){root.hidden=true;return;}
 for(const old of root.querySelectorAll('.rsa-chalice-action'))old.remove();
 const entries=['healing','damage'].includes(card.type)?[{card,node:root}]:[];
 for(const node of root.querySelectorAll('.card-summary[data-message-id]')){const child=game.messages.get(node.dataset.messageId);if(child&&['healing','damage'].includes(child.type)&&!node.hidden)entries.push({card:child,node});}
 const placed=new Set();
 for(const entry of entries){
  const c=chaliceSource(entry.card);if(!c||card.visible===false||card.isContentVisible===false||entry.card.visible===false||entry.card.isContentVisible===false||!owns(c.actor,game.user)||placed.has(c.root.id))continue;
  placed.add(c.root.id);const item=feature(c.actor,'starry-form'),group=document.createElement('div'),button=document.createElement('button');group.className='rsa-attack-actions rsa-chalice-action';button.type='button';button.dataset.starsChalice='';button.textContent='Healing Chalice';const img=starryActivity(item,'heal')?.img??item?.img;if(img)button.dataset.rsaReactionIcon=img;
  button.addEventListener('click',async event=>{
   event.preventDefault();event.stopPropagation();if(button.disabled)return;
   const targets=[...new Set(values(game.user.targets).map(t=>(t.document??t).uuid))];if(targets.length!==1||!chaliceCandidates(c).some(t=>t.uuid===targets[0])){ui.notifications.warn('Select exactly one Healing Chalice target within 30 feet.');return;}
   button.disabled=true;try{await clickChalice(c.root.id,targets[0]);}catch(error){ui.notifications.warn(error.message);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(c.root);}
  });group.append(button);entry.node.append(group);
 }
}
// Chalice is a native enchantment rider, but its use owns a new recipient and
// HP history. The triggering spell ID is accounting metadata, never its origin.
async function rollChalice(receipt,dialog,settle){
 let keep=false,usage;const flags={dnd5e:{item:{data:receipt.data}},[ID]:{riderTriggered:true,activityOverrideData:receipt.data,starryChaliceSource:receipt.source,starryChaliceRequest:receipt.request}},targets=[receipt.target],message={data:{speaker:receipt.speaker,system:{targets},flags}};
 try{
  const actor=resolve(receipt.actor),helper=new CONFIG.Item.documentClass(receipt.data,{parent:actor});helper.prepareFinalAttributes?.();const native=helper.system.activities.get(receipt.id);
  const result=await native.use({consume:false,subsequentActions:false,concentration:{begin:false},create:{measuredTemplate:false}},{configure:false},{data:{speaker:receipt.speaker,system:{targets},flags}});
  usage=result?.message;if(!usage)return;
  await settle('chaliceUsage',{request:receipt.request,card:usage.id});message.data.system.origin=usage.id;
  const rolled=await native.rollDamage({isCritical:false},dialog,message);keep=!!rolled?.length;return rolled;
 }finally{
  const pending=globalThis.Ugmuls55eAutomationPendingDamage,pendingCard=pending?.pendingCard?.({message});
  // A superseding pending-roll owner or a published result must retain the use.
  if(usage&&linkedHpCards(usage).some(card=>card.rolls?.length&&!flag(card,'pendingDamage')))keep=true;
  try{
   if(!keep&&pendingCard){if(pending.canSubmitDamage?.({message})===false)keep=true;else if(flag(pendingCard,'pendingDamage'))await pendingCard.delete();}
   if(!keep&&usage)await usage.delete();
  }finally{await settle(keep?'keep':'rollback',{request:receipt.request});}
 }
}
export async function clickChalice(source,target){
 const receipt=await operate('chalice',{card:source,target});
 return rollChalice(receipt,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog('damage',{configure:true}),operate);
}
export async function applyChalice(context,target,user=game.user,defer=false){
 const c=chaliceSource(context.card);if(!c||chaliceRunning.has(c.actor.uuid)||!owns(c.actor,user)||!chaliceCandidates(c).some(t=>t.uuid===target?.uuid))throw Error('Chalice healing is no longer available for this spell or target.');
 const previous=flag(c.actor,'starryChaliceTurn'),request=foundry.utils.randomID(),item=feature(c.actor,'starry-form'),data=item.toObject(),native=starryActivity(item,'heal'),id=native?.id??native?._id;
 if(!native)throw Error('The active Chalice enchantment healing activity is unavailable.');
 // Use the live granted activity and its native scaling, rather than the
 // disabled healing template on the unenchanted feature.
 const selected=native.toObject?.()??foundry.utils.deepClone(data.system.activities[id]);if(!selected)throw Error('The native Chalice healing activity is unavailable.');
 data._id=foundry.utils.randomID();data.system.identifier='rsa-starry-chalice';data.system.activities={[id]:selected};data.effects=[];if(selected.flags?.dnd5e)delete selected.flags.dnd5e.dependentOn;data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};selected.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};data.flags[ID]={...data.flags[ID],starsToken:sourceToken(c.actor,c.state.token).uuid};
 chaliceRunning.add(c.actor.uuid);try{
  await c.actor.setFlag(ID,'starryChaliceTurn',{turn:c.stamp,request});await c.root.setFlag(ID,'starryChaliceDone',{request,target:target.uuid,pending:true});
  claims.set(request,{kind:'chalice',actor:c.actor,root:c.root,previous,user:user.id,target:target.uuid});
  const receipt={request,data,id,actor:c.actor.uuid,source:c.root.id,target:describeTarget(target),speaker:ChatMessage.getSpeaker({actor:c.actor,token:sourceToken(c.actor,c.state.token)})};
  if(defer)return receipt;
  return await rollChalice(receipt,{configure:false},(operation,payload)=>starsOperation(operation,payload,user));
 }catch(error){
  if(claims.has(request))await starsOperation('rollback',{request},user);
  else if(flag(c.actor,'starryChaliceTurn')?.request===request&&flag(c.root,'starryChaliceDone')?.request!==request)await c.actor.setFlag(ID,'starryChaliceTurn',previous??null);
  throw error;
 }finally{chaliceRunning.delete(c.actor.uuid);}
}
function refreshStarry(effect){const current=flag(actorOf(effect),'starryTurnPrompt')?.card;if(current)globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(current));for(const marker of ['starryActionsPrompt','starryInitialPrompt','starryArcherPrompt','starrySwitchPrompt']){const id=flag(effect,marker)?.card;if(id)globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(id));}const available=flag(actorOf(effect),'starryChaliceAvailable');if(available&&available.instance===flag(effect,'starryForm')?.instance)globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(available.source));}
export async function starsOperation(operation,payload,user=game.user){
 if(!authority()||!user?.active)throw Error('A connected GM is required.');if(operation==='archer'){if(typeof payload.request!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(payload.request)||claims.has(payload.request))throw Error('Archer request is invalid or already running.');return archerClaim(game.messages.get(payload.card),payload,user);}
 if(operation==='chalice'){const root=game.messages.get(payload.card),cards=[...values(root?.getAssociatedRolls?.('healing')),...(root?linkedHpCards(root):[])];const card=cards.find(c=>chaliceSource(c));if(!card)throw Error('No eligible slot-funded healing spell is available.');return applyChalice(chaliceSource(card),resolve(payload.target),user,true);}
 const claim=claims.get(payload.request);if(!claim||claim.user!==user.id)return;
 if(claim.kind==='chalice'){
  if(operation==='chaliceUsage'){
   const usage=game.messages.get(payload.card);
   if(!usage||usage.type!=='usage'||flag(usage,'starryChaliceSource')!==claim.root.id||flag(usage,'starryChaliceRequest')!==payload.request||usage.getAssociatedActor?.()?.uuid!==claim.actor.uuid||usage.system?.targets?.length!==1||usage.system.targets[0].token!==claim.target)throw Error('The Chalice healing source or recipient changed.');
   if(claim.usage&&claim.usage!==usage.id)throw Error('This Chalice use already has a healing card.');claim.usage=usage.id;return;
  }
  const usage=game.messages.get(claim.usage),published=usage&&linkedHpCards(usage).some(card=>flag(card,'starryChaliceRequest')===payload.request&&card.rolls?.length&&!flag(card,'pendingDamage'));
  if(published)operation='keep';
  if(operation==='rollback'){if(flag(claim.actor,'starryChaliceTurn')?.request===payload.request)await claim.actor.setFlag(ID,'starryChaliceTurn',claim.previous??null);if(flag(claim.root,'starryChaliceDone')?.request===payload.request)await claim.root.setFlag(ID,'starryChaliceDone',null);}
  else if(operation==='keep'&&flag(claim.root,'starryChaliceDone')?.request===payload.request)await claim.root.setFlag(ID,'starryChaliceDone',{...flag(claim.root,'starryChaliceDone'),pending:false,usage:claim.usage});
  claims.delete(payload.request);globalThis.Ugmuls55eAutomationChatRefresh?.card(claim.root);return;
 }
 if(operation==='keep'){const usage=game.messages.get(payload.card);if(usage&&flag(usage,'pendingCast')&&flag(usage,'starryArcherSource')===claim.prompt&&usage.getAssociatedActor?.()?.uuid===actorOf(claim.effect)?.uuid){claim.usage=usage.id;return;}claims.delete(payload.request);refreshStarry(claim.effect);return;}
 const usage=claim.usage&&game.messages.get(claim.usage);if(usage&&(!flag(usage,'pendingCast')||['attack','damage'].some(type=>values(usage.getAssociatedRolls?.(type)).some(c=>c.rolls?.length)))){claims.delete(payload.request);return;}
 if(flag(claim.effect,'starryArcherTurn')?.request===payload.request){await claim.effect.setFlag(ID,'starryArcherTurn',claim.before.turn??null);await claim.effect.setFlag(ID,'starryArcherInitialUsed',claim.before.initial??null);const now=flag(claim.effect,'starryForm');if(now?.instance===claim.before.state.instance&&now.form===claim.before.state.form&&now.switchedTurn===claim.before.state.switchedTurn&&now.windowClosed===claim.stamp)await claim.effect.setFlag(ID,'starryForm',{...now,windowClosed:claim.before.state.windowClosed??null});}claims.delete(payload.request);refreshStarry(claim.effect);
}
function operate(operation,payload){const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return enqueue(()=>starsOperation(operation,payload));const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Starry Form.'));},15000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'starryOperation',operation,payload,request,user:game.user.id,gm:gm.id});});}
export function renderStarry(card,html){
 if(!flag(card,'starryPrompt')||card.isContentVisible===false)return;const root=html?.[0]??html;
 for(const button of root?.querySelectorAll?.('[data-stars-archer],[data-stars-form],[data-stars-swap],[data-stars-chalice-action]')??[]){
  if(button.dataset.starsChaliceAction!==undefined){button.hidden=true;button.disabled=true;continue;}
  let c;const swap=button.dataset.starsSwap!==undefined||button.dataset.starsForm!==undefined,chalice=button.dataset.starsChaliceAction!==undefined,initial=button.dataset.starsInitial!==undefined||flag(card,'starryPrompt')?.initial===true;
  try{
   c=starryContext(card);
   if(swap){if(initial||!feature(c.actor,'twinkling-constellations')||game.combat?.started&&(c.prompt.turn!==turn()||game.combat.combatant?.actor?.uuid!==c.actor.uuid))throw Error();}
   else if(chalice){const available=flag(c.actor,'starryChaliceAvailable'),source=game.messages.get(available?.healing);c.chalice=available?.instance===c.state.instance&&chaliceSource(source);if(!c.chalice)throw Error();}
   else if(c.prompt.actor&&c.prompt.initial&&button.dataset.starsInitial===undefined||c.state.form!=='archer'||(!initial&&c.prompt.initial)||initial&&(c.prompt.turn!==turn()||c.state.enchantment&&c.state.initialTurn!==turn()||c.state.initialAvailable===false||flag(c.effect,'starryArcherInitialUsed')===c.state.instance)||!initial&&(c.prompt.turn!==turn()||game.combat?.started&&game.combat.combatant?.actor?.uuid!==c.actor.uuid)||flag(c.effect,'starryArcherTurn')?.turn===(turn()??card.id))throw Error();
  }catch{c=null;}
  button.disabled=!!(!c||c&&!swap&&!chalice&&!initial&&globalThis.Ugmuls55eAutomationResources?.bonusActionUsed(c.actor));
  button.hidden=!c;
  if(chalice&&!c)button.dataset.tooltip='Cast a spell using a spell slot that restores Hit Points to enable Chalice.';
  if(button.dataset.starsBound)continue;button.dataset.starsBound='true';
  button.addEventListener('click',async event=>{
   event.preventDefault();event.stopPropagation();if(button.disabled)return;button.disabled=true;
   try{
    if(swap)await switchStarry(card);
    else if(chalice){const current=starryContext(card),available=flag(current.actor,'starryChaliceAvailable'),targets=values(game.user.targets).map(t=>(t.document??t).uuid);if(targets.length!==1)throw Error('Select exactly one Healing Chalice target within 30 feet.');await clickChalice(available?.source,targets[0]);}
    else await clickArcher(card,initial);
   }catch(error){ui.notifications.warn(error.message);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
  });
 }
 const buttons=Array.from(root?.querySelectorAll?.('[data-stars-archer],[data-stars-form],[data-stars-swap],[data-stars-chalice-action]')??[]);
 if(buttons.length){const empty=buttons.every(button=>button.hidden);if(root.dataset){if(empty){root.hidden=true;root.dataset.rsaStarryEmpty='true';}else{root.hidden=false;delete root.dataset.rsaStarryEmpty;}}}
}
export function installStarsToken(Type){const p=Type?.prototype;if(!p?.getUsageToken||wrapped.has(p))return;wrapped.add(p);const get=p.getUsageToken,own=Object.hasOwn(p,'getUsageToken');p.getUsageToken=function(...args){const token=resolve(flag(this.item,'starsToken'));if(token?.actor?.uuid===this.actor?.uuid)return token;return (own?get:Object.getPrototypeOf(p).getUsageToken).apply(this,args);};}
export async function syncStarryBenefits(item){if(starryItem(item))await syncStarryEnchantment(item);const effect=starryEffect(item?.actor);if(effect)refreshStarry(effect);}
function report(error){console.error('Starry Form',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'starryFormAutomation',{name:'Stars Druid: Starry Form',hint:'Use native Starry Form enchantments and benefits. At turn start, show Swap Form with Twinkling Constellations and BA - Archer with an active Archer enchantment. Paid Archer activation grants a separate free shot. Keep native manual activities and inline Chalice follow-ups. Disabling or deleting the native Starry Form buff ends its enchantment.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 // While the buff is active, preserve the native Item.use activity picker:
 // Assume Form plus the live enchantment's granted Archer/Chalice activity.
 globalThis.Ugmuls55eAutomationStars={isItem:item=>starryItem(item)&&!starryEffect(item.actor),open:openStarry};for(const type of ['attack','heal'])installStarsToken(CONFIG.DND5E.activityTypes?.[type]?.documentClass);
 const syncing=new Map();
 const sync=item=>{
  if(!enabled()||!authority()||!starryItem(item))return;
  const pending=syncing.get(item.uuid);if(pending){pending.dirty=true;return;}
  const state={dirty:false};syncing.set(item.uuid,state);
  // Native rider creation can arrive while the source's first reconciliation
  // is awaiting publication. Coalesce it without losing that later change.
  enqueue(async()=>{do{state.dirty=false;await syncStarryEnchantment(item);}while(state.dirty);}).catch(report).finally(()=>syncing.delete(item.uuid));
 };
 for(const event of ['createItem','updateItem','deleteItem'])Hooks.on(event,item=>{
  const actor=item.actor;if(!enabled()||!owns(actor,game.user)||!['starry-form','full-of-stars','twinkling-constellations','druid'].includes(key(item)))return;
  const effect=starryEffect(actor);if(effect)refreshStarry(effect);globalThis.Ugmuls55eAutomationChatRefresh?.request('starryChalice',item);sync(feature(actor,'starry-form'));
 });
 Hooks.on('dnd5e.renderChatMessage',renderStarry);Hooks.on('dnd5e.renderChatMessage',renderChalice);
 Hooks.on('dnd5e.preUseActivity',(a,u,d,m)=>{
  if(!enabled())return;const actor=a.actor??a.item?.actor,state=starryCastingState(actor)?.state;
  if(starryItem(a.item)&&a.type==='enchant'&&a.enchant?.self){m.data??={};m.data.flags??={};m.data.flags[ID]={...m.data.flags[ID],starryAssumeTurn:turn()};}
  if(m.data?.flags?.[ID]?.starrySwap){
   validateStarryChoice(starryContext(game.messages.get(m.data.flags[ID].starrySwap.card)));
   if(!starryItem(a.item)||a.type!=='enchant'||!a.enchant?.self)throw Error('Swap Form requires the native Assume Form activity.');
   u.consume=false;u.hasConsumption=false;m.hasConsumption=false;m.data.flags[ID].riderTriggered=true;
   // Native use supplies a cloned activity here. Override only this free use,
   // preserving the owned feature's Bonus Action activation for new assumptions.
   a.updateSource?.({'activation.type':'special','activation.override':true});
   Object.assign(a.activation,{type:'special',override:true});
  }
  if(a.item?.type==='spell'){m.data??={};m.data.flags??={};m.data.flags[ID]={...m.data.flags[ID],starryChaliceCast:state?.form==='chalice'?{instance:state.instance,turn:turn()}:{eligible:false}};}
 });
 Hooks.on('updateCombat',(combat,changes)=>{
  if(!enabled()||!['turn','round','started'].some(k=>k in changes))return;
  for(const actor of new Set(values(combat.combatants).map(c=>c.actor)))if(owns(actor,game.user)){const effect=starryEffect(actor);if(effect)refreshStarry(effect);}
  if(authority()&&combat.started)postStarryTurn(combat).catch(report);
 });
 // The same buff-based rule also handles settled native turn/reorder events;
 // the actor/turn key coalesces this with updateCombat without flag dependency.
 Hooks.on('combatTurnChange',combat=>{postStarryTurn(combat).catch(report);});
 const changed=(effect,options={})=>{
  if(!enabled()||options.rsaStarsSync)return;const actor=actorOf(effect);if(!owns(actor,game.user))return;
  const root=flag(effect,'starryForm')?effect:starryEffect(actor);if(root)refreshStarry(root);
  if(flag(effect,'starryForm')&&authority())enqueue(()=>endStarryEffect(effect,options)).catch(report);
  const item=effect.parent?.actor?effect.parent:feature(actor,'starry-form');if(starryItem(item))sync(item);
  // Never compare missing activity IDs: unrelated Wizard enchantments also
  // have no activity origin. Expiry is already deleted by the native system.
  if(authority()&&!options.deleted&&starryItem(item)&&effect.disabled&&!effect.duration?.expired&&!effect.system?.expired&&currentStarryEnchantment(effect))enqueue(()=>deleteStarryEnchantment(effect)).catch(report);
 };
 Hooks.on('createActiveEffect',(e,options)=>changed(e,options));Hooks.on('updateActiveEffect',(e,_changes,options)=>changed(e,options));Hooks.on('deleteActiveEffect',(e,options)=>changed(e,{...options,deleted:true}));
 Hooks.on('dnd5e.applyEnchantment',item=>sync(item));
 Hooks.on('updateActor',actor=>{if(!enabled()||!owns(actor,game.user))return;const effect=starryEffect(actor);if(effect){refreshStarry(effect);if(authority()&&incap(actor))enqueue(()=>endStarryEffect(effect)).catch(report);}});
 for(const event of ['createChatMessage','updateChatMessage'])Hooks.on(event,card=>{if(enabled()&&authority()&&['damage','healing'].includes(card.type))offerChalice(card).catch(report);});
 if(authority())for(const actor of startupActors()){const item=feature(actor,'starry-form');if(item)sync(item);}
 game.socket.on('module.'+ID,packet=>{if(packet?.action==='starryReply'&&packet.user===game.user.id){const w=waiting.get(packet.request);if(!w)return;waiting.delete(packet.request);clearTimeout(w.timer);packet.error?w.reject(Error(packet.error)):w.resolve(packet.result);return;}if(packet?.action!=='starryOperation'||!authority()||packet.gm!==game.user.id||typeof packet.request!=='string'||!['archer','chalice','chaliceUsage','keep','rollback'].includes(packet.operation))return;const user=game.users.get(packet.user);if(!user?.active)return;enqueue(()=>starsOperation(packet.operation,packet.payload,user)).then(result=>game.socket.emit('module.'+ID,{action:'starryReply',request:packet.request,user:user.id,result}),error=>game.socket.emit('module.'+ID,{action:'starryReply',request:packet.request,user:user.id,error:error.message}));});
});
