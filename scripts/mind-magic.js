const ID='ugmuls-5-5e-automation',prepared=new WeakSet(),prior=new WeakMap();
const values=v=>Array.from(v?.values?.()??(v&&typeof v==='object'&&!Array.isArray(v)?Object.values(v):v)??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],enabled=()=>game.settings.get(ID,'mindMagicAutomation')===true;
const native=(i,id,identifier)=>i?.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)===identifier||i.id===id||i.name?.trim().toLowerCase()===identifier.replaceAll('-',' ')||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.'+id)));
export const mindFeature=a=>values(a?.items).find(i=>native(i,'hofKdoMindMagic0','mind-magic'));
export const mindChannel=a=>values(a?.items).find(i=>key(i)==='channel-divinity'&&i.system?.source?.rules!=='2014');
const remaining=i=>Number(i?.system?.uses?.value??(Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0)));
const sources=['phbsplComprehend','phbsplDetectMagi','phbsplDetectThou','phbsplIdentify00','phbsplMindSpike0','phbsplTongues000','phbsplArcaneEye0','phbsplLegendLore','phbsplScrying000'],names=['comprehend-languages','detect-magic','detect-thoughts','identify','mind-spike','tongues','arcane-eye','legend-lore','scrying'];
export function mindEligible(activity){
 const item=activity?.item,actor=activity?.actor??item?.actor;
 if(!enabled()||item?.type!=='spell'||item.system?.school!=='div'||!mindFeature(actor)||['cast','forward'].includes(activity.type)||item.system.prepared===0||item.system.prepared===false||item.system.prepared===undefined&&item.system.preparation?.mode==='prepared'&&item.system.preparation.prepared===false)return false;
 const table=values(actor.items).find(i=>native(i,'hofKdoSpellsKnow','knowledge-domain-spells')),grants=values(table?.system?.advancement).flatMap(a=>values(a.configuration?.items).map(i=>i.uuid)).filter(Boolean),refs=[item.uuid,item._stats?.compendiumSource,item._stats?.duplicateSource,item.flags?.core?.sourceId].filter(Boolean);
 return refs.some(r=>grants.includes(r)||sources.some(id=>r.endsWith('.'+id)))||sources.includes(item.id)||names.includes(key(item))||names.includes(item.name?.trim().toLowerCase().replaceAll(' ','-'));
}
function slotFree(config,activity){config.consume={...(typeof config.consume==='object'?config.consume:{action:true,resources:true}),spellSlot:false};config.scaling=false;config.spell={...config.spell,slot:'spell'+Number(activity.item.system.level)};}
export function selectMindMagic(app,yes){
 const slot=app.element.querySelector('[name="consume.spellSlot"]'),level=app.element.querySelector('[name="spell.slot"]');let before=prior.get(app);
 app.config.rsaManifestKnowledge=yes===true;
 if(yes){if(!before){before={consume:app.config.consume,spell:app.config.spell,scaling:app.config.scaling,slotDisabled:slot?.disabled,levelDisabled:level?.disabled,slotChecked:slot?.checked,levelValue:level?.value};prior.set(app,before);}slotFree(app.config,app.activity);}
 else if(before){Object.assign(app.config,{consume:before.consume,spell:before.spell,scaling:before.scaling});prior.delete(app);}
 if(slot){slot.checked=app.config.consume===undefined?before?.slotChecked??slot.checked:app.config.consume===true||app.config.consume?.spellSlot===true;slot.disabled=yes===true||before?.slotDisabled===true;}
 if(level){level.value=app.config.spell?.slot??before?.levelValue??level.value;level.disabled=yes===true||before?.levelDisabled===true;}
}
export function addMindField(app){
 for(const old of app.element?.querySelectorAll?.('[data-rsa-mind-magic]')??[])old.remove();if(!mindEligible(app.activity)){if(app.config.rsaManifestKnowledge)selectMindMagic(app,false);return;}
 const form=app.element?.matches?.('form')?app.element:app.element?.querySelector('form');if(!form)return;
 const unavailable=!(remaining(mindChannel(app.activity.actor))>=1)||app.config.consume===false;if(unavailable&&app.config.rsaManifestKnowledge)selectMindMagic(app,false);
 const nativeControl=app.element.querySelector('[name="consume.spellSlot"]');
 // Match the system's form-associated checkbox, including its sizing and zero-margin alignment.
 const row=document.createElement('div'),label=document.createElement('label'),fields=document.createElement('div'),input=document.createElement(nativeControl?.localName??'input');row.className='form-group';row.dataset.rsaMindMagic='';label.textContent='Manifest Magical Knowledge';fields.className='form-fields';if(!input.localName||input.localName==='input')input.type='checkbox';input.name='rsaManifestKnowledge';input.checked=!unavailable&&app.config.rsaManifestKnowledge===true;input.disabled=unavailable;if(unavailable)row.style.opacity='0.5';input.title=unavailable?'No Channel Divinity available':'Spend 1 Channel Divinity instead of a spell slot; cast at the spell’s normal level without Material components.';input.addEventListener('change',event=>{event.stopPropagation();selectMindMagic(app,input.checked);});fields.append(input);row.append(label,fields);const slotRow=app.element.querySelector('[name="consume.spellSlot"]')?.closest?.('.form-group'),box=slotRow?.closest('fieldset')??app.element.querySelector('[data-application-part="consumption"] fieldset');if(slotRow&&box)slotRow.after(row);else (box??form).append(row);
 if(input.checked)selectMindMagic(app,true);
}
export function applyMindChoice(activity,usage,message,item=activity.item){
 if(!usage.rsaManifestKnowledge||flag(item,'mindMagicCast'))return;
 const resource=mindChannel(activity.actor);if(!mindEligible(activity)||!(remaining(resource)>=1)||usage.consume===false)throw Error('Manifest Magical Knowledge requires a prepared Knowledge Domain Divination spell and an available Channel Divinity use.');
 slotFree(usage,activity);const data=item.toObject(),a=data.system.activities[activity.id],targets=values(a.consumption?.targets),index=targets.length;targets.push({type:'itemUses',target:resource.id,value:'1',scaling:{mode:''}});a.consumption={...a.consumption,spellSlot:false,targets};
 const manifest=values(mindFeature(activity.actor).system.activities).find(a=>a.id==='Ts5TP2YdViveWsE5'||a._id==='Ts5TP2YdViveWsE5');if(manifest)a.activation={...manifest.activation,override:true};
 // Mind Magic waives Material components on this cast, including costly/consumed components.
 data.system.properties=values(data.system.properties).filter(p=>p!=='material');data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,scaling:0};data.flags[ID]={...data.flags[ID],mindMagicCast:{feature:mindFeature(activity.actor).uuid,resource:resource.uuid}};
 item.updateSource(data);item.prepareFinalAttributes();const selected=usage.consume.resources;usage.consume.resources=Array.isArray(selected)?[...new Set([...selected,index])]:selected===false?[index]:true;
 message.data??={};message.data.system={...message.data.system,scaling:0};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],mindMagicCast:data.flags[ID].mindMagicCast,activityOverrideData:data};message.data.flags.dnd5e={...message.data.flags.dnd5e,item:{...message.data.flags.dnd5e?.item,data}};message.hasConsumption=true;
 globalThis.Ugmuls55eAutomationPendingCast?.rebind?.(item.system.activities.get(activity.id),message);
}
export function prepareMindMagic(activity,usage,dialog,message){
 if(!mindEligible(activity)||usage.cause?.activity||flag(activity.item,'mindMagicCast')||['riderTriggered','regionTriggered','recurringTrigger'].some(k=>message.data?.flags?.[ID]?.[k]))return;
 usage.rsaManifestKnowledge??=false;const Base=dialog.applicationClass;if(Base)dialog.applicationClass=class extends Base{_onRender(c,o){super._onRender(c,o);addMindField(this)}async _prepareSubmitData(e,f){const selected=f?.object?.rsaManifestKnowledge??this.element?.querySelector('[name="rsaManifestKnowledge"]')?.checked??false,result=await super._prepareSubmitData(e,f);result.rsaManifestKnowledge=selected===true;if(result.rsaManifestKnowledge)slotFree(result,this.activity);return result;}};
 if(prepared.has(activity))return;prepared.add(activity);const requires=activity._requiresConfigurationDialog;activity._requiresConfigurationDialog=function(config){return mindEligible(this)||requires.call(this,config)};const scale=activity._prepareUsageScaling;activity._prepareUsageScaling=async function(config,msg,item){await scale.call(this,config,msg,item);applyMindChoice(item.system.activities.get(this.id),config,msg,item);};
}
Hooks.once('init',()=>game.settings.register(ID,'mindMagicAutomation',{name:'Knowledge Cleric: Mind Magic',hint:'Offer Manifest Magical Knowledge only for prepared Knowledge Domain Divination spells. Spend one Channel Divinity instead of a spell slot and waive Material components on that cast. Cast at the normal spell level; preserve native pending-cast cancellation/refunds.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>Hooks.on('dnd5e.preUseActivity',prepareMindMagic));
