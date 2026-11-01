import {sorceryResource} from "./empowered-spell.js";
const ID='ugmuls-5-5e-automation',started=new Set();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier;
export const warpingActivity=activity=>game.settings.get(ID,'warpingImplosionAutomation')===true&&activity?.type==='save'&&key(activity.item)==='warping-implosion'&&activity.item?.system?.source?.rules!=='2014';
export const warpingItem=item=>game.settings.get(ID,'warpingImplosionAutomation')===true&&item?.type==='feat'&&key(item)==='warping-implosion'&&item.system?.source?.rules!=='2014';
const syncing=new Map();
// The tracker/payment helpers also serve Trance of Order; defaults preserve Warping’s native workflow.
export async function syncWarpingTracker(item,eligible=warpingItem){
 const actor=item?.actor;if(!eligible(item)||!actor||!(game.users?.activeGM?game.users.activeGM.id===game.user.id:actor.isOwner))return;
 if(syncing.has(item.uuid))return syncing.get(item.uuid);
 const task=(async()=>{const updates={};if(!String(item.system?.uses?.max??'').trim())updates['system.uses.max']='1';if(!values(item.system?.uses?.recovery).some(r=>r.period==='lr'&&r.type==='recoverAll'))updates['system.uses.recovery']=[...values(item.system?.uses?.recovery),{period:'lr',type:'recoverAll'}];if(Object.keys(updates).length)await item.update(updates,{rsaWarpingTracker:true});})();syncing.set(item.uuid,task);try{await task;}finally{syncing.delete(item.uuid);}
}
export function warpingPaymentContext(activity){
 const actor=activity.actor,item=actor?.items?.get?.(activity.item.id)??values(actor?.items).find(i=>i.id===activity.item.id)??activity.item,resource=sorceryResource(actor,item),spent=Number(item.system?.uses?.spent??0),max=Number(item.system?.uses?.max||1),free=Math.max(0,max-spent),points=Math.max(0,Number(resource?.system?.uses?.value??(Number(resource?.system?.uses?.max)-Number(resource?.system?.uses?.spent??0)))||0);
 return {actor,item,resource,free,points};
}
const paymentSpec=options=>({field:'rsaWarpingPayment',flagKey:'warpingPayment',label:'Warping Implosion',marker:'warpingPayment',cost:5,...options});
export function applyWarpingPayment(activity,config,message,options={}){
 const spec=paymentSpec(options),c=warpingPaymentContext(activity),choice=config[spec.field]??(c.free>0?'free':'points');if(!['free','points'].includes(choice))throw Error('Choose a '+spec.label+' payment.');if(choice==='free'&&c.free<1)throw Error(spec.label+' has already been used since your last Long Rest.');if(choice==='points'&&(!c.resource||c.points<spec.cost))throw Error(spec.label+' requires '+spec.cost+' Sorcery Points.');
 activity.updateSource({'consumption.spellSlot':false,'consumption.scaling':{allowed:false},'consumption.targets':[{type:'itemUses',target:choice==='free'?(c.item.id??c.item.uuid):(c.resource.id??c.resource.uuid),value:choice==='free'?'1':String(spec.cost),scaling:{mode:''}}]});
 config.consume={...(typeof config.consume==='object'?config.consume:{}),resources:true,spellSlot:false};config[spec.field]=choice;message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],[spec.flagKey]:{choice,cost:choice==='free'?1:spec.cost},activityOverrideData:activity.item.toObject()};message.hasConsumption=true;
}
export function addWarpingPaymentFields(app,options={}){
 const spec=paymentSpec(options),marker=spec.marker.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());if(app.element?.querySelector('[data-'+marker+']'))return;const form=app.element?.matches?.('form')?app.element:app.element?.querySelector('form');if(!form)return;const c=warpingPaymentContext(app.activity),choice=app.config[spec.field]??(c.free>0?'free':'points'),field=document.createElement('fieldset');field.dataset[spec.marker]='true';field.innerHTML='<legend>'+spec.label+' — Confirm Payment</legend><p>Sorcery Points available: <strong>'+c.points+'</strong></p><label>Use <select name="'+spec.field+'"><option value="free" '+(choice==='free'?'selected':'')+' '+(c.free<1?'disabled':'')+'>Once per Long Rest ('+c.free+' available)</option><option value="points" '+(choice==='points'?'selected':'')+' '+(c.points<spec.cost?'disabled':'')+'>Spend '+spec.cost+' Sorcery Points</option></select></label>';field.querySelector('select').addEventListener('change',e=>{e.stopPropagation();app.config[spec.field]=e.target.value;});form.prepend(field);
}
export function prepareWarpingPayment(activity,usage,dialog,message,options={}){
 const spec=paymentSpec(options),c=warpingPaymentContext(activity);usage[spec.field]??=c.free>0?'free':'points';usage.hasConsumption=true;dialog.options??={};dialog.options.display={...dialog.options.display,'consume.resources':false};
 const Base=dialog.applicationClass;if(Base)dialog.applicationClass=class extends Base{
 _shouldDisplay(section){return section==='consume.resources'?false:super._shouldDisplay(section);}
 _onRender(context,options){super._onRender(context,options);addWarpingPaymentFields(this,spec);}
 async _prepareSubmitData(event,formData){const choice=formData?.object?.[spec.field]??this.element?.querySelector('[name="'+spec.field+'"]')?.value??this.config[spec.field];const data=await super._prepareSubmitData(event,formData);data[spec.field]=choice;this.config[spec.field]=choice;return data;}
 };
 const scaling=activity._prepareUsageScaling;activity._prepareUsageScaling=async function(config,messageConfig,item){await scaling.call(this,config,messageConfig,item);applyWarpingPayment(item?.system?.activities?.get?.(this.id)??this,config,messageConfig,spec);};
}
export function warpingAnimation(activity){
 if(!game.modules?.get?.('autoanimations')?.active)return null;
 const api=globalThis.AutomatedAnimations,entries=api?.AutorecManager?.getAutorecEntries?.();if(!entries)return null;
 // Respect an explicit Warping Implosion animation or disabled/customized item configuration.
 const configured=activity.item.flags?.autoanimations;if(configured&&(configured.isCustomized||configured.isEnabled===false||configured.killAnim))return null;
 if(values(entries.preset).some(e=>e.label?.trim().toLowerCase()==='warping implosion'))return null;
 const misty=values(activity.actor?.items).find(i=>i.type==='spell'&&key(i)==='misty-step'),custom=misty?.flags?.autoanimations;
 const preset=custom?.isCustomized&&custom.isEnabled!==false&&custom.presetType==='teleportation'?custom:values(entries.preset).find(e=>e.label?.trim().toLowerCase()==='misty step'&&e.presetType==='teleportation');if(!preset)return null;
 const data=structuredClone(preset);data.label='Warping Implosion';data.version=entries.version;data.isCustomized=true;data.isEnabled=true;data.killAnim=false;data.data??={};data.data.options={...data.data.options,range:120};return data;
}
export function prepareWarping(activity,usage,dialog,message){
 if(!warpingActivity(activity)||usage?.cause?.activity||message?.data?.flags?.[ID]?.regionTriggered)return;
 prepareWarpingPayment(activity,usage,dialog,message);
 // Only the native per-use clone is changed. The departure burst remains stationary after teleportation.
 activity.updateSource({'target.template.stationary':true});
 const animation=warpingAnimation(activity),token=activity.getUsageToken?.();if(animation&&token){const data=activity.item.toObject();data.flags??={};data.flags.autoanimations=animation;message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],warpingTeleport:{token:(token.document??token).uuid,item:data}};}
}
export async function teleportWarping(card){
 const state=card?.getFlag?.(ID,'warpingTeleport');if(!state||started.has(card.id)||card.getFlag(ID,'warpingTeleportStarted')||card.getFlag(ID,'targetsConfirmationCanceled')||card.getFlag(ID,'targetsConfirmationPending'))return;
 const author=typeof card.author==='string'?card.author:card.author?.id;if(author!==game.user.id)return;
 const token=globalThis.fromUuidSync?.(state.token,{strict:false}),actor=card.getAssociatedActor?.();if(!token?.isOwner||token.actor?.uuid!==actor?.uuid||token.parent?.id!==canvas.scene?.id||!globalThis.AutomatedAnimations?.playAnimation)return;
 started.add(card.id);try{await card.setFlag(ID,'warpingTeleportStarted',true);const helper=new CONFIG.Item.documentClass(state.item,{parent:actor});await AutomatedAnimations.playAnimation(token.object??token,helper,{targets:[]});}catch(error){console.error('Warping Implosion teleport',error);ui.notifications.warn('Warping Implosion teleport could not start. Move the caster manually.');}
}
Hooks.once('init',()=>game.settings.register(ID,'warpingImplosionAutomation',{name:'Aberrant: Warping Implosion',hint:'Center the departure burst on the caster and exclude them from targeting. Reuse an available Misty Step teleport preset at 120 feet for this casting only, unless Warping Implosion already has its own animation.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationWarping={isActivity:warpingActivity};
 const sync=item=>syncWarpingTracker(item).catch(error=>console.error('Warping Implosion tracker',error));const actors=new Map([...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor))].filter(Boolean).map(a=>[a.uuid,a]));for(const actor of actors.values())for(const item of values(actor.items))if(warpingItem(item))sync(item);Hooks.on('createItem',item=>{if(warpingItem(item))sync(item);});Hooks.on('createToken',token=>{for(const item of values(token.actor?.items))if(warpingItem(item))sync(item);});Hooks.on('createActor',actor=>{for(const item of values(actor.items))if(warpingItem(item))sync(item);});Hooks.on('dnd5e.preUseActivity',prepareWarping);Hooks.on('ugmuls55eAutomation.targetsConfirmed',card=>teleportWarping(card));Hooks.on('dnd5e.postUseActivity',(_a,_u,result)=>teleportWarping(result?.message));});
