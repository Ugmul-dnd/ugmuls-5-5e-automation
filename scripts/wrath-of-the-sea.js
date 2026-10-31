import {createEventQueue,describeTarget,isEligibleTarget,isEligibleHealingTarget} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',wrapped=new WeakSet(),enqueue=createEventQueue(),activating=new Set(),finished=new Set();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,'wrathSeaAutomation')===true,live=e=>e&&!e.disabled&&!e.isSuppressed&&!e.duration?.expired&&e.active!==false;
const resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
export const wrathActivity=a=>enabled()&&a?.type==='save'&&a.item?.type==='feat'&&key(a.item)==='wrath-of-the-sea'&&a.item.system?.source?.rules!=='2014'&&['nNTYj4vqURV4Dhjt','9U9AoJYvcrCQtIMm'].includes(a.id);
export const wrathInitial=a=>wrathActivity(a)&&a.id==='nNTYj4vqURV4Dhjt';
export const wrathEffect=actor=>values(actor?.effects).find(e=>live(e)&&flag(e,'wrathSea'));
const incapacitated=a=>['incapacitated','unconscious','dead','paralyzed','petrified','stunned'].some(s=>a?.statuses?.has(s));
export function wrathRange(activity){
 const raw=activity._source?.target?.template?.size??activity._rsaWrathRange??activity.target?.template?.size??activity.range?.value,data=activity.getRollData?.()??activity.actor?.getRollData?.()??activity.item?.actor?.getRollData?.()??{};
 const value=Number(CONFIG.Dice.BasicRoll.replaceFormulaData(String(raw??''),data,{missing:0}));if(!Number.isFinite(value)||value<=0)throw Error('Wrath of the Sea’s native range scale is unavailable.');return value;
}
export function prepareWrathActivity(activity){
 if(!wrathActivity(activity))return;const range=wrathRange(activity);activity._rsaWrathRange=range;
 // Prepared activity data only: retain native save, dice, Wild Shape pool and
 // Bonus Action activation. The emanation is a target range, not an area hit.
 activity.target.prompt=false;Object.assign(activity.target.template,{type:''});Object.assign(activity.target.affects,{type:'creature',count:'1',choice:false});
 Object.assign(activity.range,{override:true,units:'ft',value:range});activity.effects=[];activity.appliedEffects=[];
}
export function withinWrathRange(source,target,feet,{sight=true,healing=false}={}){
 source=source?.document??source;target=target?.document??target;if(!source?.actor||!target?.actor||source.uuid===target.uuid||source.parent?.id!==target.parent?.id||!(healing?isEligibleHealingTarget(target):isEligibleTarget(target))||sight&&(target.object?.isVisible===false||source.actor.statuses?.has('blinded')))return false;
 const grid=source.parent?.grid,size=Number(grid?.size);if(!Number.isFinite(size)||!source.object?.center||!target.object?.center)return false;
 const a=source.object.center,b=target.object.center,clamp=(v,c,w)=>Math.max(c-Math.max(0,w-1)*size/2,Math.min(v,c+Math.max(0,w-1)*size/2));
 const first={x:clamp(b.x,a.x,source.width??1),y:clamp(b.y,a.y,source.height??1)},last={x:clamp(first.x,b.x,target.width??1),y:clamp(first.y,b.y,target.height??1)};
 const distance=canvas.grid.measurePath([first,last]).distance,convert=globalThis.dnd5e?.utils?.convertLength,limit=convert?convert(feet,'ft',grid.units,{strict:false}):feet*(/^(m|meters?|metres?)$/i.test(grid.units??'ft')?0.3048:1);
 return Number.isFinite(distance)&&distance<=limit&&(!sight||!source.object.checkCollision?.(b,{type:'sight',mode:'any'}));
}
export function validateWrathTargets(activity,targets,{initial=wrathInitial(activity)}={}){
 const actor=activity.actor??activity.item.actor;if(incapacitated(actor))throw Error('Wrath of the Sea ends while Incapacitated.');if(!initial&&!wrathEffect(actor))throw Error('Manifest Wrath of the Sea before using its Bonus Action save.');
 const selected=[...new Map(values(targets).map(t=>t.token?resolve(t.token):t.document??t).filter(Boolean).map(t=>[t.uuid,t])).values()];
 if(selected.length>1||!initial&&!selected.length)throw Error('Choose one target for Wrath of the Sea.');
 const source=activity.getUsageToken?.();if(selected.some(t=>!withinWrathRange(source,t,wrathRange(activity))))throw Error('Choose another visible creature within '+wrathRange(activity)+' feet.');return selected.map(describeTarget);
}
export function prepareWrathUse(activity,usage,dialog,message){
 if(!wrathActivity(activity))return;prepareWrathActivity(activity);
 try{const targets=validateWrathTargets(activity,message.data?.system?.targets??game.user.targets);usage.create??={};usage.create.measuredTemplate=false;usage.subsequentActions=false;
  message.data??={};message.data.system={...message.data.system,targets};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],wrathSeaActivation:wrathInitial(activity),wrathSeaUse:true};
 }catch(error){ui.notifications.warn(error.message);return false;}
}
export function guardWrathConsumption(activity,usage,message){if(!wrathActivity(activity))return;try{validateWrathTargets(activity,message.data?.system?.targets??game.user.targets);}catch(error){ui.notifications.warn(error.message);return false;}}
export function wrathBuffData(activity,card,bearer=activity.actor??activity.item.actor){
 const actor=activity.actor??activity.item.actor,native=values(activity.item.effects).find(e=>e.id==='mFMQIrMCCZdgYPMk'||e.name==='Manifesting Ocean Spray');if(!native)throw Error('Wrath of the Sea is missing its native duration effect.');
 const storm=values(actor.items).find(i=>i.type==='feat'&&key(i)==='stormborn'&&i.system?.source?.rules!=='2014'),bonus=values(storm?.effects).find(e=>e.name==='Stormborn'),data=native.toObject();delete data._id;delete data.folder;
 Object.assign(data,{disabled:false,transfer:false,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),origin:activity.item.uuid});data.system={...data.system,changes:[...values(data.system?.changes),...values(bonus?.system?.changes)].map(c=>({...c})),origin:{actor:actor.uuid,item:activity.item.uuid,message:card.uuid}};
 data.flags={...data.flags,dnd5e:{...data.flags?.dnd5e,isTemporary:true},[ID]:{...data.flags?.[ID],wrathSea:{caster:actor.uuid,bearer:bearer.uuid,source:card.uuid,range:wrathRange(activity),stormborn:!!bonus}}};return data;
}
export async function finishWrathUse(activity,usage,results){
 const card=results?.message,actor=activity.actor??activity.item.actor;if(!wrathActivity(activity)||!card?.id||card.author?.id!==game.user.id||!actor.isOwner||activating.has(card.id)||finished.has(card.id))return;
 activating.add(card.id);try{
  if(wrathInitial(activity))await enqueue(async()=>{
   const prior=values(actor.effects).filter(e=>flag(e,'wrathSea')),previous=prior[0],before=previous?.toObject(),extras=prior.slice(1).filter(live).map(e=>({_id:e.id,disabled:e.disabled})),data=wrathBuffData(activity,card);let effect;
   if(previous){await previous.update(data);effect=previous;}else [effect]=await actor.createEmbeddedDocuments('ActiveEffect',[data]);
   if(extras.length)await actor.updateEmbeddedDocuments('ActiveEffect',extras.map(e=>({_id:e._id,disabled:true})));
   globalThis.Ugmuls55eAutomationPendingCast?.onCancel(card,async()=>{if(flag(effect,'wrathSea')?.source!==card.uuid)return;if(before)await effect.update(before);else await effect.delete();if(extras.length)await actor.updateEmbeddedDocuments('ActiveEffect',extras);});
  });
  if(card.system.targets?.length)await globalThis.Ugmuls55eAutomationDamage?.promptDamage(activity,card);
  else if(wrathInitial(activity))await globalThis.Ugmuls55eAutomationPendingCast?.commit?.(card);
  finished.add(card.id);if(finished.size>256)finished.delete(finished.values().next().value);
 }finally{activating.delete(card.id);}
}
export async function clearIncapacitatedWrath(actor){
 if(!enabled()||!game.user.isGM||game.users.activeGM?.id&&game.users.activeGM.id!==game.user.id||!incapacitated(actor))return;
 const effects=values(actor.effects).filter(e=>live(e)&&flag(e,'wrathSea'));if(effects.length)await actor.updateEmbeddedDocuments('ActiveEffect',effects.map(e=>({_id:e.id,disabled:true})));
}
export function installWrathActivity(Type){const p=Type?.prototype;if(!p||wrapped.has(p))return;wrapped.add(p);const prepare=p.prepareFinalData,own=Object.hasOwn(p,'prepareFinalData');if(prepare)p.prepareFinalData=function(...args){const result=(own?prepare:Object.getPrototypeOf(p).prepareFinalData).apply(this,args);prepareWrathActivity(this);return result;};}
Hooks.once('init',()=>game.settings.register(ID,'wrathSeaAutomation',{name:'Sea Druid: Wrath of the Sea',hint:'Use one visible creature within the native 5/10-foot range, without placing an aura. Track the native duration on the caster, include owned Stormborn bonuses, and require activation for later Bonus Action saves. Push movement remains manual.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationWrathSea={isActivity:wrathActivity,isInitial:wrathInitial};installWrathActivity(CONFIG.DND5E.activityTypes?.save?.documentClass);
 Hooks.on('dnd5e.preUseActivity',prepareWrathUse);Hooks.on('dnd5e.preActivityConsumption',guardWrathConsumption);
 Hooks.on('dnd5e.postUseActivity',(a,u,r)=>{if(!wrathActivity(a))return;const task=finishWrathUse(a,u,r);globalThis.Ugmuls55eAutomationPendingCast?.track(r?.message,task);task.catch(e=>{console.error('Wrath of the Sea',e);ui.notifications.error(e.message);});});
 const cleanup=actor=>{if(enabled()&&game.user.isGM&&incapacitated(actor)&&wrathEffect(actor))enqueue(()=>clearIncapacitatedWrath(actor)).catch(console.error);};
 Hooks.on('updateActor',cleanup);for(const event of ['createActiveEffect','updateActiveEffect'])Hooks.on(event,effect=>{if(effect.parent?.documentName==='Actor')cleanup(effect.parent);});
});
