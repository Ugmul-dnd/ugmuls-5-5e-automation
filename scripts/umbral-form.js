import {sorceryResource} from './empowered-spell.js';
const ID='ugmuls-5-5e-automation',BOOK='rhwSSUmbralForQw',EFFECT='vAfLEL8A1fNW5JWb',running=new Set();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,'umbralFormAutomation')===true;
export const umbralFeature=a=>values(a?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)==='umbral-form'||i.name?.trim().toLowerCase()==='umbral form'||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.'+BOOK))));
export const innateActivation=(a,{ignoreSetting=false}={})=>(ignoreSetting||enabled())&&a?.type==='utility'&&a.item?.type==='feat'&&a.item.system?.source?.rules!=='2014'&&(key(a.item)==='innate-sorcery'||a.item.name?.trim().toLowerCase()==='innate sorcery')&&values(a.effects).length>0;
const umbralSpec={feature:umbralFeature,cost:6,restore:'HvJYCPOsA0a5AbLs',effect:EFFECT,label:'Umbral Form',field:'rsaUmbralForm',flag:'umbralForm',name:null,changes:c=>c.key==='system.traits.dr.value'};
const remaining=i=>Math.max(0,Number(i?.system?.uses?.value??(Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0)))||0);
export function umbralContext(actor,spec=umbralSpec){const feature=spec.feature(actor),restore=values(feature?.system?.activities).find(a=>(a.id??a._id)===spec.restore),resource=sorceryResource(actor,restore?{system:{activities:[restore]}}:undefined);return {feature,resource,free:remaining(feature),points:remaining(resource)};}
export function umbralChoices(actor,spec=umbralSpec){const c=umbralContext(actor,spec);return [{value:'no',label:'No'},...(c.feature&&c.free>0?[{value:'free',label:'Yes - Free'}]:[]),...(c.feature&&c.points>=spec.cost?[{value:'points',label:'Yes - '+spec.cost+' Sorc Points'}]:[])];}
export function applyUmbralChoice(activity,usage,message,spec=umbralSpec){
 const choice=usage[spec.field]??'no',c=umbralContext(activity.actor,spec);if(!c.feature||!umbralChoices(activity.actor,spec).some(o=>o.value===choice))throw Error('The selected '+spec.label+' option is no longer available.');
 const item=activity.item,base=values(activity.effects).map(e=>e._id??e.id).map(id=>values(item.effects).find(e=>(e.id??e._id)===id)).find(Boolean);if(!base)throw Error('Innate Sorcery is missing its native effect.');
 const effect=base.toObject(),native=values(c.feature.effects).find(e=>(e.id??e._id)===spec.effect);if(choice!=='no'&&!native)throw Error(spec.label+' is missing its native benefit effect.');
 // Keep one native Innate Sorcery effect and lifetime. Each form supplies only
 // its native benefit changes, so the shared spell DC increase is never doubled.
 if(choice!=='no'){effect.name=spec.name??native.name;effect.img=native.img;effect.system??={};effect.system.changes=[...values(effect.system.changes),...values(native.system?.changes).filter(spec.changes)];effect.description=native.description;effect.statuses=values(native.statuses);}
 effect.flags??={};effect.flags[ID]={...effect.flags[ID],umbralForm:null,crownForm:null,[spec.flag]:choice!=='no'?{feature:c.feature.uuid,choice}:null};
 const data=item.toObject(),index=data.effects.findIndex(e=>e._id===effect._id);data.effects[index]=effect;data.flags??={};data.flags[ID]={...data.flags[ID],umbralInnateActivation:true};
 const a=data.system.activities[activity.id],targets=[...values(a.consumption?.targets)];if(choice!=='no')targets.push({type:'itemUses',target:choice==='free'?c.feature.id:c.resource.id,value:choice==='free'?'1':String(spec.cost),scaling:{mode:''}});
 a.consumption={...a.consumption,spellSlot:false,targets};item.updateSource(data);item.prepareFinalAttributes?.();
 if(choice!=='no')usage.consume={...(typeof usage.consume==='object'?usage.consume:{}),resources:true,spellSlot:false};
 message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],umbralInnateActivation:true,umbralChoice:choice,activityOverrideData:data};message.data.flags.dnd5e={...message.data.flags.dnd5e,item:{...message.data.flags.dnd5e?.item,data}};
 return data;
}
export function addUmbralChoice(app,spec=umbralSpec){
 if(app.element?.querySelector('[data-umbral-form]'))return;const form=app.element?.matches?.('form')?app.element:app.element?.querySelector('form');if(!form)return;
 const field=document.createElement('fieldset');field.dataset.umbralForm='true';const legend=document.createElement('legend');legend.textContent=spec.label;const select=document.createElement('select');select.name=spec.field;
 for(const choice of umbralChoices(app.activity.actor,spec)){const option=document.createElement('option');option.value=choice.value;option.textContent=choice.label;select.append(option);}select.value=app.config[spec.field]??'no';if(!select.value)select.value='no';select.addEventListener('change',e=>{e.stopPropagation();app.config[spec.field]=select.value;});field.append(legend,select);form.prepend(field);
}
export function prepareUmbralInnate(activity,usage,dialog,message,spec=umbralSpec){
 if((spec===umbralSpec&&!enabled())||!innateActivation(activity,{ignoreSetting:spec!==umbralSpec})||!spec.feature(activity.actor)||flag(activity.item,'umbralInnateActivation')||usage?.cause?.activity)return;
 usage[spec.field]??='no';const Base=dialog.applicationClass;if(Base)dialog.applicationClass=class extends Base{
 _onRender(context,options){super._onRender(context,options);addUmbralChoice(this,spec);}
 async _prepareSubmitData(event,formData){const choice=formData?.object?.[spec.field]??this.element?.querySelector('[name="'+spec.field+'"]')?.value??this.config[spec.field]??'no';const data=await super._prepareSubmitData(event,formData);data[spec.field]=choice;this.config[spec.field]=choice;return data;}
 };
 const needs=activity._requiresConfigurationDialog;activity._requiresConfigurationDialog=function(config){return !!spec.feature(this.actor)||needs.call(this,config);};
 const scaling=activity._prepareUsageScaling;activity._prepareUsageScaling=async function(config,msg,item){await scaling.call(this,config,msg,item);applyUmbralChoice(item?.system?.activities?.get?.(this.id)??this,config,msg,spec);};
}
export async function applyUmbralInnate(activity,usage,result){
 const card=result?.message;if(!card||!flag(card,'umbralInnateActivation')||flag(card,'buffAutoApplied')||running.has(card.id)||!activity.actor?.isOwner)return;
 running.add(card.id);const actor=activity.actor,prior=new Map(values(actor.effects).map(e=>[e.id,e.toObject()]));
 try{const tray=document.createElement('effect-application');tray.chatMessage=card;const prepare=tray._prepareEffectData;
  // Native refresh normally only reenables an existing effect. Here the same
  // source can switch base/Umbral/Crown, so include its selected content in the native
  // preparation result; Effect Undo still records the full before/after state.
  tray._prepareEffectData=async function(effect,target){const output=await prepare.call(this,effect,target);if(target.uuid===actor.uuid){const data=effect.toObject();output.data.name=data.name;output.data.img=data.img;output.data.description=data.description;output.data.statuses=data.statuses;output.data.system??={};output.data.system.changes=await CONFIG.ActiveEffect.documentClass.forApplication(data.system.changes,activity,target);output.data.flags??={};output.data.flags[ID]={...output.data.flags[ID],umbralForm:data.flags?.[ID]?.umbralForm??null,crownForm:data.flags?.[ID]?.crownForm??null};}return output;};
  for(const effect of await activity.getApplicableEffects()){const undo=globalThis.Ugmuls55eAutomationEffectUndo;if(undo)await undo.apply(card,card,effect,actor,tray);else await tray._applyEffectToActor(effect,actor);}await card.setFlag(ID,'buffAutoApplied',true);
 }catch(error){const added=values(actor.effects).filter(e=>!prior.has(e.id)&&e.system?.origin?.message===card.uuid).map(e=>e.id);if(added.length)await actor.deleteEmbeddedDocuments('ActiveEffect',added);const changed=values(actor.effects).filter(e=>prior.has(e.id)&&e.system?.origin?.message===card.uuid&&JSON.stringify(e.toObject())!==JSON.stringify(prior.get(e.id))).map(e=>prior.get(e.id));if(changed.length)await actor.updateEmbeddedDocuments('ActiveEffect',changed);if(card.system?.deltas)await activity.refund(card.system.deltas);const marker=globalThis.Ugmuls55eAutomationResources?.resourceEffect?.(actor,'bonus'),stamp=flag(card,'castSession')??card.id;if(flag(marker,'resourceUsage')===stamp)await marker.update({disabled:true});await card.delete();throw error;
 }finally{running.delete(card.id);}
}
Hooks.once('init',()=>game.settings.register(ID,'umbralFormAutomation',{name:'Shadow: Umbral Form with Innate Sorcery',hint:'Choose No, an available free Umbral Form use, or 6 Sorcery Points when activating Innate Sorcery. Apply a single native buff with shared duration and Effect Undo.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationUmbral={isActivation:a=>flag(a?.item,'umbralInnateActivation')===true};Hooks.on('dnd5e.preUseActivity',prepareUmbralInnate);Hooks.on('dnd5e.postUseActivity',(a,u,r)=>applyUmbralInnate(a,u,r).catch(e=>{console.error('Umbral Form',e);ui.notifications.error(e.message);}));});
