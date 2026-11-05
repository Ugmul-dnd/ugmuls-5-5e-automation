import {createEventQueue,describeTarget,startupActors} from './shared-activity-card.js';
import {failureState} from './bardic-inspiration.js';
import {blessingDistance} from './dark-ones-blessing.js';
import {eclipseSeesDestination} from './inspired-eclipse.js';
import {syncPaladinLights} from './paladin-lighting.js';

const ID='ugmuls-5-5e-automation',prepared=new WeakSet(),waiting=new Map(),initialSaves=new Map(),enqueue=createEventQueue();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{});
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const resolve=r=>{try{return typeof r==='string'?(globalThis.fromUuidSync?.(r,{strict:false})??game.messages.get(r.replace(/^ChatMessage\./,''))):r;}catch{return null;}};
const enabled=()=>game.settings.get(ID,'blessingMoonlightAutomation')===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const live=e=>!!e&&!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired&&!e.system?.expired;
const owns=(actor,user)=>!!actor&&(user?.isGM||actor.testUserPermission?.(user,'OWNER'));
const visible=(card,user)=>card?.isContentVisible!==false&&(user?.isGM||!card.blind&&(!card.whisper?.length||card.author?.id===user.id||card.whisper.includes(user.id)));
const remaining=i=>Number(i?.system?.uses?.value??Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0));
const isMoonlightFeature=i=>i?.type==='feat'&&((i.identifier??i.system?.identifier)==='blessing-of-moonlight'||i.name==='Blessing of Moonlight'||i.id==='hofComBlessingof'||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.hofComBlessingof')));
export const moonlightFeature=actor=>values(actor?.items).find(isMoonlightFeature);
const moonbeam=item=>item?.type==='spell'&&((item.identifier??item.system?.identifier)==='moonbeam'||item.name==='Moonbeam'||[item._stats?.compendiumSource,item._stats?.duplicateSource].some(r=>r?.endsWith('.phbsplMoonbeam00')));
export const moonlightEligible=activity=>enabled()&&moonbeam(activity?.item)&&!!moonlightFeature(activity.actor??activity.item.actor);
export async function syncMoonlightRecovery(feature){
 if(!authority()||!enabled()||!feature?.actor||moonlightFeature(feature.actor)?.uuid!==feature.uuid||values(feature.system.uses?.recovery).length)return;
 // The source item has a one-use pool but omits its stated Long Rest recovery.
 await feature.update({'system.uses.recovery':[{period:'lr',type:'recoverAll'}]});
}
const profile=feature=>values(feature?.system?.activities).find(a=>a.type==='heal'&&a.name==='Moonlight Healing');

export function addMoonlightField(app){
 for(const old of app.element?.querySelectorAll?.('[data-rsa-blessing-moonlight]')??[])old.remove();
 if(!moonlightEligible(app.activity))return;
 const slot=app.element.querySelector('[name="consume.spellSlot"]'),box=slot?.closest('fieldset')??app.element.querySelector('[data-application-part="consumption"] fieldset');if(!box)return;
 const unavailable=remaining(moonlightFeature(app.activity.actor))<1||app.config.consume===false;
 if(unavailable)app.config.rsaBlessingMoonlight=false;
 const row=document.createElement('div'),label=document.createElement('label'),fields=document.createElement('div'),input=document.createElement(slot?.localName??'input');
 row.className='form-group';row.dataset.rsaBlessingMoonlight='';label.textContent='Blessing of Moonlight';fields.className='form-fields';
 if(!input.localName||input.localName==='input')input.type='checkbox';input.name='rsaBlessingMoonlight';input.checked=!unavailable&&app.config.rsaBlessingMoonlight===true;input.disabled=unavailable;
 input.title='Spend Blessing of Moonlight: shed 5-foot dim light and offer Moonlight Healing for each failed save against this casting.';
 if(unavailable)row.style.opacity='0.5';input.addEventListener('change',()=>{app.config.rsaBlessingMoonlight=input.checked;});fields.append(input);row.append(label,fields);box.append(row);
}
export function applyMoonlightCast(activity,usage,message,item=activity.item){
 if(!usage.rsaBlessingMoonlight||flag(item,'blessingMoonlightCast'))return;
 const actor=activity.actor??item.actor,feature=moonlightFeature(actor),token=activity.getUsageToken?.()??actor.token,source=token?.document??token;
 if(!moonlightEligible(activity)||remaining(feature)<1||usage.consume===false||!source||source.actor?.uuid!==actor.uuid)throw Error('Blessing of Moonlight needs its available use and the casting Bard’s token.');
 const data=item.toObject(),a=data.system.activities[activity.id],index=values(a.consumption?.targets).length;
 // The book's Modify Moonbeam has no cost configured. Add its owned native
 // feature pool to this cast's native consumption so cancellation/refund works.
 a.consumption={...a.consumption,targets:[...values(a.consumption?.targets),{type:'itemUses',target:feature.id,value:'1',scaling:{mode:''}}]};
 const meta={request:foundry.utils.randomID(),actor:actor.uuid,feature:feature.uuid,token:source.uuid,item:item.uuid};
 data.flags??={};data.flags[ID]={...data.flags[ID],blessingMoonlightCast:meta};item.updateSource(data);item.prepareFinalAttributes?.();
 const before=usage.consume;usage.consume={...(typeof before==='object'?before:{action:true,resources:true,spellSlot:true})};
 if(Array.isArray(before?.resources)||before?.resources===false)usage.consume.resources=[...new Set([...(Array.isArray(before.resources)?before.resources:[]),index])];else usage.consume.resources=true;
 message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],blessingMoonlightCast:meta,activityOverrideData:data};message.data.flags.dnd5e={...message.data.flags.dnd5e,item:{...message.data.flags.dnd5e?.item,data}};message.hasConsumption=true;
 globalThis.Ugmuls55eAutomationPendingCast?.rebind?.(item.system.activities.get(activity.id),message);
}
export function prepareMoonlight(activity,usage,dialog,message){
 if(!moonlightEligible(activity)||flag(activity.item,'blessingMoonlightCast')||['regionTriggered','recurringTrigger','riderTriggered'].some(k=>flag(message.data,k)))return;
 const cause=usage.cause?.activity,linked=cause&&(activity.getLinkedActivity?.(cause)??values(activity.item.system.activities).find(a=>a.id===String(cause).split('.').at(-1)));
 if(cause&&!(linked?.type==='forward'&&linked.activity?.id===activity.id))return;
 const Base=dialog.applicationClass;if(Base)dialog.applicationClass=class extends Base{
  _onRender(c,o){super._onRender(c,o);addMoonlightField(this);}
  async _prepareSubmitData(e,f){const chosen=f?.object?.rsaBlessingMoonlight??this.element?.querySelector('[name="rsaBlessingMoonlight"]')?.checked??false,result=await super._prepareSubmitData(e,f);result.rsaBlessingMoonlight=chosen===true;return result;}
 };
 if(prepared.has(activity))return;prepared.add(activity);const requires=activity._requiresConfigurationDialog,scale=activity._prepareUsageScaling;
 activity._requiresConfigurationDialog=function(config){return moonlightEligible(this)||requires.call(this,config);};
 activity._prepareUsageScaling=async function(config,msg,item){await scale.call(this,config,msg,item);applyMoonlightCast(item.system.activities.get(this.id),config,msg,item);};
}
function paid(cast,feature){return values(cast?.system?.deltas?.item?.[feature?.id]).some(d=>d.keyPath==='system.uses.spent'&&d.delta>0);}
export function moonlightBuff(actor,request){
 if(!enabled()||!moonlightFeature(actor))return null;
 return values(actor.effects).find(e=>{const meta=flag(e,'blessingMoonlight'),root=resolve(meta?.concentration);return live(e)&&meta&&(!request||meta.request===request)&&meta.feature===moonlightFeature(actor)?.uuid&&live(root)&&root.parent?.uuid===actor.uuid;});
}
function retryInitialSaves(cast){
 const saves=initialSaves.get(cast.id);initialSaves.delete(cast.id);
 // Initial saves can finish during target confirmation, before post-use has
 // installed the buff. Retry only those exact cards after this cast activates.
 for(const id of saves??[]){const card=game.messages.get(id);if(card)captureMoonlightSave(card).catch(report);}
}
export async function activateMoonlight(cast,user=game.user){
 const meta=flag(cast,'blessingMoonlightCast'),actor=resolve(meta?.actor),feature=moonlightFeature(actor),token=resolve(meta?.token),root=actor?.effects?.get?.(cast?.system?.concentration)??resolve(cast?.system?.concentration);
 if(!enabled()||!meta||!owns(actor,user)||cast.getAssociatedActor?.()?.uuid!==actor.uuid||!moonbeam(cast.getAssociatedItem?.())||feature?.uuid!==meta.feature||token?.actor?.uuid!==actor.uuid||!paid(cast,feature)||flag(cast,'pendingCast')||flag(cast,'targetsConfirmationPending')||flag(cast,'targetsConfirmationCanceled')||!live(root)||root.parent?.uuid!==actor.uuid)return;
 const existing=moonlightBuff(actor,meta.request);if(existing){retryInitialSaves(cast);return existing;}
 if(flag(cast,'blessingMoonlightActivated'))return;
 const native=values(feature.effects).find(e=>e.name==='Blessed by Moonlight');if(!native)throw Error('Blessing of Moonlight is missing its native Blessed by Moonlight effect.');
 const data=native.toObject();delete data._id;delete data.start;data.disabled=false;data.transfer=false;data.start=CONFIG.ActiveEffect.documentClass.getEffectStart();
 data.duration={value:null,units:'seconds',expiry:null,expired:false};data.system={...data.system,origin:{actor:actor.uuid,item:feature.uuid,activity:cast.getAssociatedActivity?.()?.uuid,effect:root.uuid,message:cast.uuid}};
 data.flags={...data.flags,dnd5e:{...data.flags?.dnd5e,dependentOn:root.uuid},[ID]:{...data.flags?.[ID],blessingMoonlight:{...meta,cast:cast.id,concentration:root.uuid,dim:5}}};
 const effect=(await actor.createEmbeddedDocuments('ActiveEffect',[data]))[0];if(!effect)throw Error('Blessed by Moonlight could not be applied.');
 try{await cast.update({['flags.'+ID+'.blessingMoonlightActivated']:effect.uuid,['flags.'+ID+'.effectUndoHistory']:[...values(flag(cast,'effectUndoHistory')),{id:foundry.utils.randomID(),effectUuid:effect.uuid,sourceMessage:cast.uuid,before:null}]});}catch(error){await effect.delete();throw error;}
 await syncPaladinLights(actor);retryInitialSaves(cast);return effect;
}
function saveSource(card,{inactive=false}={}){
 const seen=new Set();for(let c=resolve(card?.system?.origin);c&&!seen.has(c)&&seen.size<32;c=resolve(c.system?.origin)){
  seen.add(c);const activity=c.getAssociatedActivity?.({scaled:true}),actor=c.getAssociatedActor?.()??activity?.actor;
  if(!moonbeam(activity?.item??c.getAssociatedItem?.()))continue;
  const region=resolve(flag(c,'sourceRegion')),meta=flag(region,'blessingMoonlightCast')??flag(c,'blessingMoonlightCast');
  if(!meta||actor?.uuid!==meta.actor)continue;
  const buff=moonlightBuff(actor,meta.request),grant=flag(buff,'blessingMoonlight'),cast=game.messages.get(grant?.cast);
  if(!buff&&inactive&&flag(c,'blessingMoonlightCast')?.request===meta.request&&paid(c,moonlightFeature(actor)))return {actor,cast:c,feature:moonlightFeature(actor),token:resolve(meta.token)};
  if(buff&&cast&&paid(cast,moonlightFeature(actor))&&flag(cast,'blessingMoonlightCast')?.request===meta.request)return {actor,buff,cast,feature:moonlightFeature(actor),token:resolve(grant.token)};
 }return null;
}
export function captureMoonlightSave(card){return enqueue(async()=>{
 if(!authority()||!enabled()||card?.type!=='save'||!card.rolls?.length||!values(card.rolls).every(r=>r._evaluated)||flag(card,'blessingMoonlightSave')!==undefined)return;
 let c=saveSource(card);
 if(!c){const initial=saveSource(card,{inactive:true});if(initial){
  if(flag(initial.cast,'targetsConfirmationCanceled'))return;
  const saves=initialSaves.get(initial.cast.id)??new Set();saves.add(card.id);initialSaves.set(initial.cast.id,saves);
  // A published initial save commits the native pending cast. Activate before
  // snapshotting it, even if the post-use/commit hooks are still settling.
  await globalThis.Ugmuls55eAutomationPendingCast?.commit?.(initial.cast);await activateMoonlight(initial.cast);c=saveSource(card);
 }}if(!c)return;
 const saved=initialSaves.get(c.cast.id);saved?.delete(card.id);if(saved&&!saved.size)initialSaves.delete(c.cast.id);
 // Freeze the eligible failures and the exact casting/buff when dice publish.
 // Later feature/resource changes cannot create new healing entitlements.
 const indices=values(card.rolls).flatMap((_r,i)=>failureState(card,i)==='failed'?[i]:[]);
 await card.setFlag(ID,'blessingMoonlightSave',{actor:c.actor.uuid,feature:c.feature.uuid,cast:c.cast.id,buff:c.buff.uuid,token:c.token?.uuid,failed:card.getAssociatedActor?.()?.uuid,indices,entries:[{actor:c.actor.uuid}]});
 globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
});}
export function moonlightSaveContext(card,index,user=game.user){
 const s=flag(card,'blessingMoonlightSave'),actor=resolve(s?.actor),buff=resolve(s?.buff),cast=game.messages.get(s?.cast),source=saveSource(card);
 if(!enabled()||card?.type!=='save'||!visible(card,user)||!owns(actor,user)||!s?.indices?.includes(index)||s.failed!==card.getAssociatedActor?.()?.uuid||failureState(card,index)!=='failed'||flag(card,'blessingMoonlightHealing')?.[index]||source?.buff?.uuid!==buff?.uuid||source?.cast?.id!==cast?.id||!live(buff)||s.feature!==moonlightFeature(actor)?.uuid)return null;
 return {...source,card,index,s};
}
export function moonlightHealingTarget(c,target){
 const failed=c.card.getAssociatedActor?.(),limit=/^(m|meters?|metres?)$/i.test(c.token?.parent?.grid?.units??'ft')?60*0.3048:60;
 if(!target?.actor||!c.token?.actor||target.actor.uuid===failed?.uuid||target.parent?.id!==c.token.parent?.id||target.hidden||target.level!==c.token.level||c.actor.statuses?.has('blinded')||blessingDistance(c.token,target)>limit)throw Error('Select another visible creature within 60 feet of the Bard for Moonlight Healing.');
 if(target.actor.uuid!==c.actor.uuid&&(!target.object?.center||!eclipseSeesDestination(c.token,{...target.object.center,elevation:target.elevation??0})))throw Error('The Bard must be able to see the Moonlight Healing recipient.');return target;
}
// Blessing is an explicitly permitted feature-healing source for Lunar Vitality.
// Validate the reserved failed-save use, rather than treating all feat heals as spells.
export function moonlightLunarSource(meta,user=game.user){
 const save=game.messages.get(meta?.save),s=flag(save,'blessingMoonlightSave'),use=flag(save,'blessingMoonlightHealing')?.[meta?.index];
 if(!meta||!use?.pending||use.request!==meta.request||use.target!==meta.target||meta.cast!==s?.cast)return null;
 const c=saveSource(save);return c&&owns(c.actor,user)&&s.indices?.includes(meta.index)&&failureState(save,meta.index)==='failed'&&c.cast.id===meta.cast&&c.buff.uuid===s.buff?c:null;
}
async function finishMoonlightHealing(card,index,request,healing,user){
 const s=flag(card,'blessingMoonlightSave'),use=flag(card,'blessingMoonlightHealing')?.[index],actor=resolve(s?.actor),meta=flag(healing,'moonlightHealing'),target=resolve(use?.target),ref=healing?.system?.origin,origin=typeof ref==='string'?ref.replace(/^ChatMessage\./,''):ref?.id;
 if(!owns(actor,user)||!use||use.request!==request||use.card&&use.card!==healing?.id||meta?.request!==request||meta.save!==card.id||meta.index!==index||meta.cast!==s.cast||meta.target!==use.target||origin!==card.id||healing?.type!=='healing'||flag(healing,'pendingDamage')||!target?.actor||!values(healing.system?.targets).some(t=>t.token===target.uuid)||healing.getAssociatedActor?.()?.uuid!==actor.uuid)throw Error('The Moonlight Healing result does not match its reserved failed save.');
 const set=value=>card.setFlag(ID,'blessingMoonlightHealing',{...flag(card,'blessingMoonlightHealing'),[index]:value});
 await set({request,card:healing.id,target:target.uuid});
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(healing);
 const applied=()=>flag(healing,'hpApplicationRecorded')===true||values(flag(healing,'damageUndoHistory')).some(r=>r.actorUuid===target.actor.uuid);
 if(!applied()){
  const total=values(healing.rolls).filter(r=>r.options?.type==='healing').reduce((n,r)=>n+Math.max(0,Number(r.total)||0),0);
  if(!(total>0))throw Error('Review Moonlight Healing’s existing card before applying its healing.');
  await target.actor.applyDamage([{type:'healing',value:total}],{origin:healing,originatingMessage:healing,rsaAutoDamageToken:target.uuid,rsaMoonlightHealing:true});
  if(flag(healing,'hpApplicationRecorded')!==true)await healing.setFlag(ID,'hpApplicationRecorded',true);
 }
 globalThis.Ugmuls55eAutomationChatRefresh?.card(healing);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return {card:healing.id};
}
export function moonlightOperation(operation,payload,user=game.user){return enqueue(async()=>{
 if(!authority()||!user?.active)throw Error('A connected GM is required for Blessing of Moonlight.');
 if(operation==='activate')return activateMoonlight(game.messages.get(payload.card),user).then(e=>({effect:e?.uuid}));
 if(operation==='finish')return finishMoonlightHealing(game.messages.get(payload.card),payload.index,payload.request,game.messages.get(payload.healing),user);
 if(operation==='release'){
  const card=game.messages.get(payload.card),use=flag(card,'blessingMoonlightHealing')?.[payload.index],actor=resolve(flag(card,'blessingMoonlightSave')?.actor);
  if(!owns(actor,user)||!use||use.request!==payload.request)return;
  const existing=values(card.getAssociatedRolls?.('healing')).find(h=>flag(h,'moonlightHealing')?.request===payload.request&&h.rolls?.length&&!flag(h,'pendingDamage'));
  if(existing){await card.setFlag(ID,'blessingMoonlightHealing',{...flag(card,'blessingMoonlightHealing'),[payload.index]:{...use,pending:false,card:existing.id}});return;}
  if(use.card)return;const uses={...flag(card,'blessingMoonlightHealing')};delete uses[payload.index];await card.setFlag(ID,'blessingMoonlightHealing',uses);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return;
 }
 if(!['heal','reserve'].includes(operation))throw Error('Unknown Blessing of Moonlight operation.');
 const card=game.messages.get(payload.card),c=moonlightSaveContext(card,payload.index,user);if(!c)throw Error('Moonlight Healing is no longer available for this failed save.');
 const target=moonlightHealingTarget(c,resolve(payload.target)),native=profile(c.feature);if(!native)throw Error('The native Moonlight Healing activity is missing.');
 const data=c.feature.toObject(),id=native.id??native._id,a=data.system.activities[id];data.system.activities={[id]:a};data.effects=[];
 a.activation={type:'special',override:true};a.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};a.effects=[];a.target={override:true,prompt:false,affects:{type:'creature',count:'1'},template:{type:''}};
 const request=foundry.utils.randomID(),meta={save:card.id,index:c.index,cast:c.cast.id,request,target:target.uuid};
 const set=value=>card.setFlag(ID,'blessingMoonlightHealing',{...flag(card,'blessingMoonlightHealing'),[c.index]:value});
 let healing;const capture=result=>{
  const ref=result?.system?.origin,origin=typeof ref==='string'?ref.replace(/^ChatMessage\./,''):ref?.id;
  // Native origin fields may already resolve to a ChatMessage document during
  // publication. Never stringify that document to compare its source identity.
  if(result?.type==='healing'&&origin===card.id&&flag(result,'moonlightHealing')?.request===request&&result.rolls?.length&&!flag(result,'pendingDamage'))healing=result;
 };
 await set({request,pending:true,target:target.uuid});
 if(operation==='reserve')return {data,id,actor:c.actor.uuid,meta,targets:[describeTarget(target)],whisper:card.whisper??[],blind:card.blind??false};
 const helper=new CONFIG.Item.documentClass(data,{parent:c.actor});helper.prepareFinalAttributes?.();const listeners=['createChatMessage','updateChatMessage'].map(event=>[event,Hooks.on(event,capture)]);
 try{
  const rolls=await helper.system.activities.get(id).rollDamage({isCritical:false},{configure:false},{data:{system:{origin:card.id,targets:[describeTarget(target)]},whisper:card.whisper??[],blind:card.blind??false,flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,manualDamageWorkflow:true,activityOverrideData:data,moonlightHealing:meta}}}});
  // Native roll publication sets parent after create/update hooks finish. This
  // also identifies the exact result when a pending healing card was populated.
  for(const roll of rolls??[])if(roll.parent)capture(roll.parent);
  if(!healing)throw Error('Moonlight Healing did not produce its healing roll.');
  return await finishMoonlightHealing(card,c.index,request,healing,user);
 }catch(error){if(healing)await set({request,card:healing.id,target:target.uuid});else{const uses={...flag(card,'blessingMoonlightHealing')};delete uses[c.index];await card.setFlag(ID,'blessingMoonlightHealing',uses);}throw error;}
 finally{for(const[event,listener]of listeners)Hooks.off(event,listener);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
});}
async function operate(operation,payload){
 const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return moonlightOperation(operation,payload);
 const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Blessing of Moonlight.'));},15000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'blessingMoonlightOperation',operation,payload,request,user:game.user.id,gm:gm.id});});
}
export async function useMoonlightHealing(card,index,target){
 const reservation=await operate('reserve',{card:card.id,index,target}),{data,id,meta}=reservation,actor=resolve(reservation.actor);
 let healing;const capture=result=>{const ref=result?.system?.origin,origin=typeof ref==='string'?ref.replace(/^ChatMessage\./,''):ref?.id;if(result?.type==='healing'&&origin===card.id&&flag(result,'moonlightHealing')?.request===meta.request&&result.rolls?.length&&!flag(result,'pendingDamage'))healing=result;};
 const listeners=['createChatMessage','updateChatMessage'].map(event=>[event,Hooks.on(event,capture)]);
 try{
  const helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
  const rolls=await helper.system.activities.get(id).rollDamage({isCritical:false},globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog('damage',{configure:true})??{configure:true},{data:{system:{origin:card.id,targets:reservation.targets},whisper:reservation.whisper,blind:reservation.blind,flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,manualDamageWorkflow:true,activityOverrideData:data,moonlightHealing:meta}}}});
  for(const roll of rolls??[])if(roll.parent)capture(roll.parent);
  if(!healing){await operate('release',{card:card.id,index,request:meta.request});if(rolls?.length)throw Error('Moonlight Healing’s result could not be identified.');return;}
  return await operate('finish',{card:card.id,index,request:meta.request,healing:healing.id});
 }catch(error){if(!healing)await operate('release',{card:card.id,index,request:meta.request});throw error;}
 finally{for(const[event,listener]of listeners)Hooks.off(event,listener);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
}
export function renderMoonlight(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){for(const old of node.querySelectorAll(':scope > .rsa-blessing-moonlight'))old.remove();
  for(const index of flag(card,'blessingMoonlightSave')?.indices??[]){if(!moonlightSaveContext(card,index))continue;
   const row=document.createElement('div'),button=document.createElement('button');row.className='rsa-blessing-moonlight rsa-attack-actions';button.type='button';button.textContent='Blessing of Moonlight — Heal';
   button.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{const targets=values(game.user.targets).map(t=>t.document??t);if(targets.length!==1)throw Error('Select one creature to receive Moonlight Healing, then click Heal.');await useMoonlightHealing(card,index,targets[0].uuid);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});row.append(button);node.append(row);
  }
 }
}
function report(error){console.error('Blessing of Moonlight',error);ui.notifications.error(error.message);}
function syncEffect(effect){const actor=effect?.parent;if(!authority()||!actor)return;const meta=flag(effect,'blessingMoonlight');if(meta){enqueue(()=>syncPaladinLights(actor)).catch(report);globalThis.Ugmuls55eAutomationChatRefresh?.request('blessingMoonlight',actor);}else if(values(actor.effects).some(e=>flag(e,'blessingMoonlight')?.concentration===effect.uuid)){enqueue(()=>syncPaladinLights(actor)).catch(report);globalThis.Ugmuls55eAutomationChatRefresh?.request('blessingMoonlight',actor);}}
Hooks.once('init',()=>game.settings.register(ID,'blessingMoonlightAutomation',{name:'Moon Bard: Blessing of Moonlight',hint:'Offer Blessing of Moonlight while configuring Moonbeam. Spend the native feature use, link the Bard’s 5-foot dim-light buff to that casting’s concentration, and offer native Moonlight Healing once per failed save against that casting.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationBlessingMoonlight={lunarSource:moonlightLunarSource,lightRadius(actor,token){const buff=moonlightBuff(actor);return buff&&flag(buff,'blessingMoonlight').token===token.uuid?{dim:5}:null;}};
 if(authority())for(const actor of startupActors()){const feature=moonlightFeature(actor);if(feature)enqueue(()=>syncMoonlightRecovery(feature)).catch(report);}
 Hooks.on('dnd5e.preUseActivity',prepareMoonlight);
 Hooks.on('dnd5e.createMeasuredTemplate',(activity,regions)=>{const meta=flag(activity.item,'blessingMoonlightCast');if(meta)for(const region of regions??[]){region.flags??={};region.flags[ID]={...region.flags[ID],blessingMoonlightCast:meta};}});
 Hooks.on('dnd5e.postUseActivity',(_a,_u,result)=>{if(flag(result?.message,'blessingMoonlightCast')){const task=operate('activate',{card:result.message.id});globalThis.Ugmuls55eAutomationPendingCast?.track(result.message,task);task.catch(report);}});
 Hooks.on('updateChatMessage',(card,changes={})=>{
  if(!authority()||!flag(card,'blessingMoonlightCast'))return;
  if(flag(card,'targetsConfirmationCanceled')){initialSaves.delete(card.id);return;}
  if(changes['flags.'+ID+'.pendingCast']===false||changes.flags?.[ID]?.pendingCast===false||changes['flags.'+ID+'.targetsConfirmationPending']===false||changes.flags?.[ID]?.targetsConfirmationPending===false)moonlightOperation('activate',{card:card.id}).catch(report);
 });
 Hooks.on('deleteChatMessage',card=>{initialSaves.delete(card.id);});
 for(const event of ['createChatMessage','updateChatMessage'])Hooks.on(event,(card,changes={})=>{if(card.type==='save'&&(event==='createChatMessage'||changes.rolls||changes.system))captureMoonlightSave(card).catch(report);});
 for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect'])Hooks.on(event,(effect,options={})=>{syncEffect(effect);if(event==='deleteActiveEffect'&&authority()&&options.rsaUndoEffect&&flag(effect,'blessingMoonlight')){const card=game.messages.get(flag(effect,'blessingMoonlight').cast);if(flag(card,'blessingMoonlightActivated')===effect.uuid)card.unsetFlag(ID,'blessingMoonlightActivated').catch(report);}});
 for(const event of ['createItem','updateItem','deleteItem'])Hooks.on(event,item=>{if(!isMoonlightFeature(item))return;if(item.actor&&authority())enqueue(async()=>{await syncMoonlightRecovery(item);await syncPaladinLights(item.actor);}).catch(report);globalThis.Ugmuls55eAutomationChatRefresh?.request('blessingMoonlight',item);});
 Hooks.on('createToken',token=>{if(authority()&&moonlightBuff(token.actor))enqueue(()=>syncPaladinLights(token.actor)).catch(report);});
 Hooks.on('canvasReady',()=>{if(authority())for(const actor of new Set(values(canvas.scene?.tokens).map(t=>t.actor).filter(Boolean)))if(moonlightFeature(actor)||values(actor.effects).some(e=>flag(e,'blessingMoonlight')))enqueue(()=>syncPaladinLights(actor)).catch(report);});
 Hooks.on('dnd5e.renderChatMessage',renderMoonlight);
 game.socket.on('module.'+ID,p=>{if(p?.action==='blessingMoonlightReply'&&p.user===game.user.id){const job=waiting.get(p.request);if(!job)return;waiting.delete(p.request);clearTimeout(job.timer);p.error?job.reject(Error(p.error)):job.resolve(p.result);return;}if(p?.action!=='blessingMoonlightOperation'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user);if(!user?.active)return;moonlightOperation(p.operation,p.payload,user).then(result=>game.socket.emit('module.'+ID,{action:'blessingMoonlightReply',request:p.request,user:user.id,result}),error=>game.socket.emit('module.'+ID,{action:'blessingMoonlightReply',request:p.request,user:user.id,error:error.message}));});
});
