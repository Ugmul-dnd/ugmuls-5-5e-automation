import {majestyCharmTargets} from './majesty-command-save.js';
const ID='ugmuls-5-5e-automation',EFFECT='4BYLa1sQSb3zQMY1',prepared=new WeakSet(),installed=new WeakSet(),busy=new Set();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,'mantleMajestyAutomation')===true,live=e=>!!e&&!e.disabled&&!e.isSuppressed&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
const resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
export const majestyFeature=a=>values(a?.items).find(i=>i.type==='feat'&&key(i)==='mantle-of-majesty'&&i.system?.source?.rules!=='2014');
export function majestyBuff(actor){
 const feature=majestyFeature(actor);if(!enabled()||!feature)return null;
 return values(actor.effects).find(e=>{
  if(!live(e))return false;const meta=flag(e,'mantleMajesty'),native=e.system?.origin?.item===feature.uuid||[e._stats?.duplicateSource,e._stats?.compendiumSource].some(r=>r?.endsWith('.'+EFFECT));
  const root=resolve(meta?.concentration??e.getFlag?.('dnd5e','dependentOn')??e.system?.origin?.effect);
  return (meta?.feature===feature.uuid||native)&&live(root)&&root.parent?.uuid===actor.uuid;
 });
}
export function majestyLevel(activity,usage={}){const slot=usage.spell?.slot;return slot==='pact'?Number(activity.actor?.system?.spells?.pact?.level):/^spell[1-9]$/.test(slot??'')?Number(slot.slice(5)):Number(activity.item?.system?.level??1)+Number(usage.scaling||0);}
function setSlot(usage,paid){if(usage.consume===false)return;usage.consume={...(typeof usage.consume==='object'?usage.consume:{action:true,resources:true}),spellSlot:paid};}
export function applyMajestyCast(activity,usage,message,item=activity.item){
 const initial=flag(item,'majestyActivation'),buff=majestyBuff(activity.actor);if(!initial&&!buff)return;
 const level=majestyLevel(activity,usage),free=!!initial||level===1;
 if(initial&&level!==1)throw Error('Activate Mantle of Majesty with a level-1 Command.');
 const data=item.toObject(),a=data.system.activities[activity.id];
 if(free){a.activation={type:'bonus',value:1,override:true};a.consumption={...a.consumption,spellSlot:false};setSlot(usage,false);}
 else {a.activation={type:'action',value:1,override:true};a.consumption={...a.consumption,spellSlot:true};setSlot(usage,true);}
 if(initial){
  const feature=majestyFeature(activity.actor);if(feature?.uuid!==initial.feature)throw Error('Mantle of Majesty is no longer available.');
  usage.spell={...usage.spell,slot:'spell1'};usage.scaling=false;usage.concentration={...usage.concentration,begin:true};
  if(usage.consume!==false)usage.consume.resources=true;
 }
 const targets=message.data?.system?.targets??values(game.user.targets).map(t=>({token:(t.document??t).uuid}));
 data.flags??={};data.flags[ID]={...data.flags[ID],majestyCommand:{free,buff:buff?.uuid,activation:initial?.feature,charmed:free?majestyCharmTargets(activity.actor,targets):[]}};
 item.updateSource(data);item.prepareFinalAttributes();message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],activityOverrideData:data,majestyCommand:data.flags[ID].majestyCommand};message.data.flags.dnd5e={...message.data.flags.dnd5e,item:{...message.data.flags.dnd5e?.item,data}};
 globalThis.Ugmuls55eAutomationPendingCast?.rebind?.(item.system.activities.get(activity.id),message);
}
export function renderMajestyNote(app){
 for(const old of app.element?.querySelectorAll?.('[data-majesty-note]')??[])old.remove();
 if(!flag(app.activity.item,'majestyActivation')&&!majestyBuff(app.activity.actor))return;
 const slot=app.element.querySelector('[name="consume.spellSlot"]'),box=slot?.closest('.form-group')??app.element.querySelector('[data-application-part="consumption"] fieldset');if(!box)return;
 const note=document.createElement('p');note.dataset.majestyNote='';note.className='hint';note.textContent='Mantle of Majesty active — level 1: Bonus Action, no spell slot. Higher levels: normal action and spell slot.';box.append(note);
 if(slot)slot.checked=majestyLevel(app.activity,app.config)>1;
 if(flag(app.activity.item,'majestyActivation')){const level=app.element.querySelector('[name="spell.slot"]');if(level){level.value='spell1';level.disabled=true;}}
}
export function prepareMajestyCommand(activity,usage,dialog,message){
 if(!enabled()||activity?.item?.type!=='spell'||key(activity.item)!=='command'||usage.cause?.activity||!flag(activity.item,'majestyActivation')&&!majestyBuff(activity.actor)||['regionTriggered','recurringTrigger','riderTriggered'].some(k=>message.data?.flags?.[ID]?.[k]))return;
 setSlot(usage,majestyLevel(activity,usage)>1);const Base=dialog.applicationClass;
 if(Base)dialog.applicationClass=class extends Base{
  _onRender(c,o){super._onRender(c,o);renderMajestyNote(this);}
  async _prepareSubmitData(event,form){const data=await super._prepareSubmitData(event,form),config={...this.config,...data,spell:{...this.config.spell,...data.spell}};setSlot(data,majestyLevel(this.activity,config)>1);return data;}
 };
 if(prepared.has(activity))return;prepared.add(activity);const scale=activity._prepareUsageScaling;
 activity._prepareUsageScaling=async function(config,msg,item){await scale.call(this,config,msg,item);const scaled=item.system.activities.get(this.id);if(!flag(item,'majestyActivation')&&!majestyBuff(this.actor))throw Error('Mantle of Majesty ended. Reopen Command to cast normally.');applyMajestyCast(scaled,config,msg,item);};
}
export function majestyActivationData(feature,command){
 const native=values(feature.effects).find(e=>(e.id??e._id)===EFFECT);if(!native)throw Error('The native Unearthly Appearance effect is missing.');
 const data=command.toObject(),id=values(command.system.activities).find(a=>a.type==='save')?.id;if(!id)throw Error('Command is missing its native save activity.');
 data.name='Mantle of Majesty — Command';data.system.level=1;data.system.properties=[...new Set([...values(data.system.properties),'concentration'])];data.system.duration={value:'1',units:'minute'};data.system.activation={type:'bonus',value:1};
 const a=data.system.activities[id];a.activation={type:'bonus',value:1,override:true};a.duration={value:'1',units:'minute',concentration:true,override:true};a.consumption={...a.consumption,spellSlot:false,targets:[...values(a.consumption?.targets),{type:'itemUses',target:feature.id,value:'1',scaling:{mode:''}}]};data.system.activities={[id]:a};
 data.flags??={};data.flags[ID]={...data.flags[ID],majestyActivation:{feature:feature.uuid}};return {data,id,native};
}
export async function applyMajestyBuff(actor,feature,native,root,message){
 if(!live(root)||root.parent?.uuid!==actor.uuid)throw Error('Mantle of Majesty requires its concentration effect.');
 const existing=values(actor.effects).find(e=>flag(e,'mantleMajesty')?.concentration===root.uuid);if(existing)return existing;
 const data=native.toObject?native.toObject():foundry.utils.deepClone(native);delete data._id;data.disabled=false;data.transfer=false;data.origin=feature.uuid;
 data.start=CONFIG.ActiveEffect.documentClass.getEffectStart();data.duration={value:60,units:'seconds',expiry:'turnStart',expired:false};data.system={...data.system,origin:{actor:actor.uuid,item:feature.uuid,effect:root.uuid,message:message.uuid}};
 data.flags={...data.flags,dnd5e:{...data.flags?.dnd5e,dependentOn:root.uuid},[ID]:{...data.flags?.[ID],mantleMajesty:{feature:feature.uuid,concentration:root.uuid,message:message.uuid}}};
 data._stats={...data._stats,duplicateSource:native.uuid??feature.uuid+'.ActiveEffect.'+EFFECT};return (await actor.createEmbeddedDocuments('ActiveEffect',[data]))[0];
}
export function installMajesty(Type){let p=Type?.prototype;while(p&&!Object.hasOwn(p,'use'))p=Object.getPrototypeOf(p);if(!p||installed.has(p))return;installed.add(p);const use=p.use;
 p.use=async function(usage={},dialog={},message={}){
  if(!enabled()||key(this.item)!=='mantle-of-majesty'||this.id!=='dnd5eactivity000'||this.item.system?.source?.rules==='2014')return use.call(this,usage,dialog,message);
  if(busy.has(this.actor.uuid))throw Error('Finish the pending Mantle of Majesty activation first.');busy.add(this.actor.uuid);
  try{
   const command=values(this.actor.items).find(i=>i.type==='spell'&&key(i)==='command');if(!command)throw Error('Add the granted Command spell before using Mantle of Majesty.');
   const {data,id,native}=majestyActivationData(this.item,command),helper=new CONFIG.Item.documentClass(data,{parent:this.actor});helper.prepareFinalAttributes?.();
   const result=await use.call(helper.system.activities.get(id),{...usage,spell:{...usage.spell,slot:'spell1'},scaling:false,consume:{...(typeof usage.consume==='object'?usage.consume:{}),action:true,resources:true,spellSlot:false},concentration:{...usage.concentration,begin:true}},dialog,{...message,data:{...message.data,flags:{...message.data?.flags,dnd5e:{...message.data?.flags?.dnd5e,item:{data}},[ID]:{...message.data?.flags?.[ID],activityOverrideData:data}}}});
   if(result?.message){const root=this.actor.effects.get(result.message.system.concentration),effect=await applyMajestyBuff(this.actor,this.item,native,root,result.message);if(effect)result.effects.push(effect);}
   return result;
  }finally{busy.delete(this.actor.uuid);}
 };
}
async function endMajesty(effect){const meta=flag(effect,'mantleMajesty'),actor=effect.parent;if(!meta||!game.user.isGM||game.users.activeGM&&game.users.activeGM.id!==game.user.id)return;const root=resolve(meta.concentration);if(root?.parent?.uuid===actor?.uuid&&live(root))await actor.endConcentration(root.id);}
function report(error){console.error('Mantle of Majesty',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'mantleMajestyAutomation',{name:'Glamour Bard: Mantle of Majesty',hint:'Unearthly Appearance casts level-1 Command as a free Bonus Action, spends the Mantle use and creates a concentration-linked buff. While active, level-1 Command is free/Bonus Action; upcasts use normal action and spell slots.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{installMajesty(CONFIG.DND5E.activityTypes?.utility?.documentClass);Hooks.on('dnd5e.preUseActivity',prepareMajestyCommand);Hooks.on('dnd5e.preActivityConsumption',(activity,usage,message)=>{const meta=message.data?.flags?.[ID]?.majestyCommand;if(meta?.free&&!meta.activation&&majestyBuff(activity.actor)?.uuid!==meta.buff){ui.notifications.warn('Mantle of Majesty ended. Reopen Command to cast normally.');return false;}});Hooks.on('deleteActiveEffect',effect=>endMajesty(effect).catch(report));Hooks.on('updateActiveEffect',(effect,change)=>{if(change.disabled===true||change['duration.expired']===true||change.duration?.expired===true)endMajesty(effect).catch(report);});});
