import {createEventQueue,describeTarget,isHealingCard} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],enabled=()=>game.settings.get(ID,'blessedHealerAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const resolve=r=>{try{return typeof r==='string'?(globalThis.fromUuidSync?.(r,{strict:false})??game.messages.get(r.replace(/^ChatMessage\./,''))):r;}catch{return null;}},doc=t=>t?.document??t;
export const blessedFeature=a=>values(a?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&((i.identifier??i.system?.identifier)==='blessed-healer'||i.id==='phbclcBlessedHea'||i.name?.trim().toLowerCase()==='blessed healer'||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.phbclcBlessedHea'))));
const slotDelta=system=>values(system?.deltas?.actor).find(d=>/^system\.spells\.(spell[1-9]|pact)\.value$/.test(d.keyPath)&&d.delta<0);
export const hasPaidHealingSlot=system=>!!slotDelta(system);
export function paidHealingSlotLevel(actor,system){const slot=slotDelta(system)?.keyPath.split('.')[2],level=slot==='pact'?Number(actor?.system?.spells?.pact?.level):slot?Number(slot.slice(5)):0;return Number.isInteger(level)&&level>=1&&level<=9?level:0;}
export function captureBlessedCast(activity,usage,message){
 if(!enabled()||activity?.item?.type!=='spell')return;
 const actor=activity.actor??activity.item.actor,feature=blessedFeature(actor),level=paidHealingSlotLevel(actor,message.data?.system);
 message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],blessedHealerCast:feature&&level>=1&&level<=9?{actor:actor.uuid,feature:feature.uuid,level}:{eligible:false}};
}
export function blessedSource(card){
 if(!enabled()||!isHealingCard(card)||flag(card,'pendingDamage')||flag(card,'blessedHealerHeal')||['regionTriggered','recurringTrigger'].some(k=>flag(card,k)))return null;
 let cast=card;const seen=new Set();while(cast&&cast.type!=='usage'&&!seen.has(cast.id)){seen.add(cast.id);cast=resolve(cast.system?.origin);}if(cast?.type!=='usage'||flag(cast,'blessedHealerGrant')||flag(cast,'targetsConfirmationCanceled')||!slotDelta(cast.system))return null;
 const snapshot=flag(cast,'blessedHealerCast'),activity=cast.getAssociatedActivity?.(),actor=cast.getAssociatedActor?.()??activity?.actor,feature=blessedFeature(actor);
 if(!snapshot?.level||activity?.item?.type!=='spell'||snapshot.actor!==actor?.uuid||snapshot.feature!==feature?.uuid)return null;
 // Require actual HP restoration to another recipient, never temporary HP, preview or full-HP healing.
 if(!values(flag(card,'damageUndoHistory')).some(r=>r.actorUuid!==actor.uuid&&values(r.changes).some(c=>c.key==='value'&&Number(c.after)>Number(c.before))))return null;
 return {card,cast,actor,feature,level:snapshot.level};
}
export function grantBlessedHealer(card){return enqueue(async()=>{
 if(!authority())return;const c=blessedSource(card);if(!c)return;
 const source=values(c.feature.system.activities).find(a=>a.type==='heal'),data=c.feature.toObject(),id=source?.id??source?._id,a=data.system.activities[id];if(!a)throw Error('Blessed Healer is missing its native healing activity.');
 const formula=source.healing?.custom?.enabled?source.healing.custom.formula:source.healing?.formula;
 if(!formula)throw Error('Blessed Healer is missing its native healing formula.');
 const fixed=String(formula).replace(/@scaling\b/g,String(c.level)),preview=new CONFIG.Dice.BasicRoll(fixed,c.actor.getRollData?.()??{});if(preview.isDeterministic===false)throw Error('Blessed Healer requires its native fixed healing formula.');
 const amount=Number(preview.evaluateSync().total);if(!Number.isFinite(amount)||amount<=0)throw Error('Blessed Healer healing could not be calculated.');
 data.name='Blessed Healer - '+amount+' HP';data.system.activities={[id]:a};data.effects=[];a.activation={type:'special',override:true};a.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};a.target={override:true,prompt:false,affects:{type:'self',count:'1'},template:{type:''}};a.healing={...a.healing,custom:{enabled:true,formula:fixed}};
 data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,scaling:0};const helper=new CONFIG.Item.documentClass(data,{parent:c.actor});helper.prepareFinalAttributes?.();
 const token=doc(c.cast.getAssociatedToken?.())??doc(c.actor.token),targets=token?.actor?.uuid===c.actor.uuid?[describeTarget(token)]:[{actor:c.actor.uuid,name:c.actor.name}],meta={source:c.cast.id,healing:card.id,actor:c.actor.uuid,level:c.level},flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,manualDamageWorkflow:true,activityOverrideData:data,blessedHealerHeal:meta}};
 let healing;const capture=result=>{const origin=typeof result.system?.origin==='string'?result.system.origin.replace(/^ChatMessage\./,''):result.system?.origin?.id;if(isHealingCard(result)&&origin===c.cast.id&&flag(result,'blessedHealerHeal')?.source===c.cast.id&&result.rolls?.length&&!flag(result,'pendingDamage'))healing=result;};
 await c.cast.setFlag(ID,'blessedHealerGrant',{pending:true});const listeners=['createChatMessage','updateChatMessage'].map(event=>[event,Hooks.on(event,capture)]);
 try{
  await helper.system.activities.get(id).rollDamage({isCritical:false},{configure:false},{data:{system:{origin:c.cast.id,targets},flags}});
  if(!healing)throw Error('Blessed Healer’s healing card could not be created.');
  // Claim the exact result before applying HP; later recipients/Undo cannot create another grant.
  await c.cast.setFlag(ID,'blessedHealerGrant',{card:healing.id,amount,level:c.level});
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(healing);
  const total=healing.rolls.filter(r=>r.options?.type==='healing').reduce((n,r)=>n+Math.max(0,Number(r.total)||0),0);if(!total)throw Error('Blessed Healer did not produce HP-restoring healing.');
  await c.actor.applyDamage([{type:'healing',value:total}],{origin:healing,originatingMessage:healing,rsaBlessedHealerGrant:true});
  if(flag(healing,'hpApplicationRecorded')!==true)await healing.setFlag(ID,'hpApplicationRecorded',true);globalThis.Ugmuls55eAutomationChatRefresh?.card(healing);
 }catch(error){if(!healing)await c.cast.unsetFlag(ID,'blessedHealerGrant');throw error;}
 finally{for(const[event,listener]of listeners)Hooks.off(event,listener);}
});}
function report(error){console.error('Blessed Healer',error);ui.notifications.warn(error.message+' If its card is already in chat, use that card to Apply healing.');}
Hooks.once('init',()=>game.settings.register(ID,'blessedHealerAutomation',{name:'Life Cleric: Blessed Healer',hint:'After a slot-funded spell actually restores HP to another creature, create and automatically apply the native 2 + spell-slot-level self-healing card once per cast. Keep native HP caps and Undo; no trigger for self-only healing, temporary HP, free casts or recurring ticks.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 Hooks.on('dnd5e.postActivityConsumption',captureBlessedCast);
 for(const event of ['createChatMessage','updateChatMessage'])Hooks.on(event,(card,change={})=>{
  if(!authority()||!isHealingCard(card)||flag(card,'blessedHealerHeal'))return;
  if(event==='updateChatMessage'&&!Object.hasOwn(change,'flags.'+ID+'.damageUndoHistory')&&!Object.hasOwn(change.flags?.[ID]??{},'damageUndoHistory'))return;
  if(blessedSource(card))grantBlessedHealer(card).catch(report);
 });
});
