import {firearmContext} from './arcane-firearm.js';
import {hasPaidHealingSlot} from './blessed-healer.js';
import {createEventQueue,isRollAdjustmentLocked,resolveRegionCaster} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',selected=new WeakMap(),pending=new WeakMap(),settlements=new WeakMap(),claims=new Map(),waiting=new Map(),wrapped=new WeakSet(),prepared=new WeakSet(),regionTasks=new Map(),coverSources=new Map(),enqueue=createEventQueue();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier||i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
const enabled=()=>game.settings.get(ID,'empoweredChannelingAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),turn=()=>game.combat?.started?[game.combat.id,game.combat.round,game.combat.turn].join(':'):null;
const owns=(a,u)=>!!a&&(u?.isGM||a.testUserPermission?.(u,'OWNER')),remaining=i=>Number(i?.system?.uses?.value??Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0));
export const empoweredChannelingFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&(key(i)==='empowered-channeling'||i.name==='Empowered Channeling'||i.id==='rhwCSEmpoweredtO'||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.rhwCSEmpoweredtO'))));
export function bardSpell(item){
 if(item?.type!=='spell'||flag(item,'storedSpell')||/^(weapon|equipment|consumable|tool):/.test(item.system?.sourceItem??''))return false;
 const actor=item.actor,feature=empoweredChannelingFeature(actor),origin=item.getFlag?.('dnd5e','advancementOrigin')??item.flags?.dnd5e?.advancementOrigin;
 if(feature&&origin?.split('.')[0]===feature.id)return true;
 if(item.system?.classIdentifier)return item.system.classIdentifier==='bard';
 if(item.system?.sourceItem==='class:bard')return true;
 let source=values(actor?.items).find(i=>i.id===origin?.split('.')[0]);const seen=new Set();
 while(source&&!seen.has(source.id)){seen.add(source.id);if(source.type==='class')return key(source)==='bard';if(source.type==='subclass')return source.system?.classIdentifier==='bard';const parent=source.getFlag?.('dnd5e','advancementOrigin')??source.flags?.dnd5e?.advancementOrigin;source=values(actor.items).find(i=>i.id===parent?.split('.')[0]);}
 return false;
}
function powerFormula(actor,feature){const native=values(feature?.system?.activities).find(a=>(a.id??a._id)==='C8neLJ03r9W3V8OX'||a.name==='Power from Beyond');if(!native?.roll?.formula)throw Error('Power from Beyond is missing its native bonus formula.');return CONFIG.Dice.BasicRoll.replaceFormulaData(native.roll.formula,actor.getRollData?.()??{},{missing:0});}
export function capturePowerCast(activity,usage,message){
 const actor=activity.actor??activity.item?.actor,feature=empoweredChannelingFeature(actor);if(!enabled()||!feature||!bardSpell(activity.item)||!hasPaidHealingSlot(message.data?.system)||['regionTriggered','recurringTrigger','riderTriggered'].some(k=>message.data?.flags?.[ID]?.[k]))return;
 let formula;try{formula=powerFormula(actor,feature);}catch(error){ui.notifications.warn(error.message);return;}message.data.flags??={};message.data.flags[ID]??={};message.data.flags[ID].powerBeyondCast={actor:actor.uuid,feature:feature.uuid,formula,turn:turn()};
}
export function powerContext(app){
 const c=firearmContext(app),feature=empoweredChannelingFeature(c.actor),snapshot=flag(c.cast,'powerBeyondCast'),card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app);
 if(!enabled()||!c.actor?.isOwner||!feature||!bardSpell(c.item)||!snapshot||snapshot.actor!==c.actor.uuid||snapshot.feature!==feature.uuid||snapshot.turn!==turn()||!hasPaidHealingSlot(c.cast?.system)||flag(c.cast,'targetsConfirmationCanceled')||[c.cast,card,app.message?.data].some(d=>['regionTriggered','recurringTrigger','riderTriggered'].some(k=>flag(d,k)))||isRollAdjustmentLocked(c.cast)||card&&isRollAdjustmentLocked(card))return null;
 return {...c,feature,snapshot};
}
const powerUsed=c=>!!flag(c.cast,'powerBeyond')||!!c.snapshot.turn&&flag(c.actor,'powerBeyondTurn')?.turn===c.snapshot.turn;
const parts=(app,rolls)=>rolls.slice(0,app.config?.rolls?.length??1).map((roll,index)=>({roll,index,type:roll.options?.type})).filter(p=>p.type&&p.type!=='temphp');
export function selectPower(app,yes,index=selected.get(app)?.index){selected.set(app,{yes:yes===true,index});}
export function addPowerChoice(app){
 const c=powerContext(app);if(!c)return;const options=parts(app,app.rolls??[]);if(!options.length)return;const state=selected.get(app),used=powerUsed(c),row=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:'power-from-beyond',label:'Power from Beyond (+'+c.snapshot.formula+')',value:state?.yes!==false,used,change:yes=>selectPower(app,yes)});
 if(!row||options.length<2||row.querySelector('[data-power-beyond-part]'))return;const select=document.createElement('select');select.dataset.powerBeyondPart='';select.setAttribute('aria-label','Power from Beyond roll');select.disabled=used;
 for(const p of options){const option=document.createElement('option');option.value=String(p.index);option.textContent='Roll '+(p.index+1)+' — '+p.type;select.append(option);}select.value=String(options.find(p=>p.index===state?.index)?.index??options[0].index);select.addEventListener('change',()=>{selectPower(app,selected.get(app)?.yes!==false,Number(select.value));app.rebuild();});row.querySelector('.form-fields')?.append(select);
}
export function finalizePower(app,rolls,{preview=false}={}){
 const original=rolls.filter(r=>!r.options?.rsaPowerBeyond);if(!preview)pending.delete(app);const c=powerContext(app),state=selected.get(app);if(!c||state?.yes===false||powerUsed(c))return original;
 const options=parts(app,original),part=options.find(p=>p.index===state?.index)??options[0];if(!part)return original;
 const roll=new CONFIG.Dice.DamageRoll(c.snapshot.formula+'[Power from Beyond]',c.actor.getRollData?.()??{},{type:part.type,types:[part.type],properties:values(part.roll.options?.properties),flavor:'Power from Beyond',isCritical:false,critical:{allow:false,bonusDice:0,bonusDamage:''},rsaPowerBeyond:true});
 if(!preview)pending.set(app,{...c,type:part.type});return [...original,roll];
}
export function powerOperation(operation,payload,user=game.user){return enqueue(async()=>{
 if(!authority()||!user?.active||typeof payload?.request!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(payload.request))throw Error('Invalid Power from Beyond request.');
 if(operation==='cover'){
  const card=game.messages.get(payload.cast),meta=flag(card,'spiritGuardCover'),activity=card?.getAssociatedActivity?.({scaled:true}),actor=card?.getAssociatedActor?.(),feature=empoweredChannelingFeature(actor),paid=values(card?.system?.deltas?.item?.[feature?.id]).some(d=>d.keyPath==='system.uses.spent'&&d.delta>0);
  if(!enabled()||!meta||meta.request!==payload.request||meta.actor!==actor?.uuid||meta.feature!==feature?.uuid||!owns(actor,user)||!user.isGM&&card.author?.id!==user.id||!modifyGuardEligible(activity)||!paid||flag(card,'targetsConfirmationCanceled'))throw Error('The modified Spirit Guardians cast or resource receipt is unavailable.');
  const regions=values(payload.regions).map(resolve);if(!regions.length||regions.some(r=>!r||r.flags?.dnd5e?.item!==activity.item.uuid||flag(r,'spiritGuardCover')?.request!==meta.request))throw Error('The regions do not belong to this modified Spirit Guardians cast.');
  await attachGuardCover(activity,regions,meta);return;
 }
 if(operation==='keep'||operation==='rollback'){
  const entry=claims.get(payload.request);if(!entry||entry.user!==user.id)return;
  if(operation==='rollback'){if(flag(entry.cast,'powerBeyond')?.request===payload.request)await entry.cast.unsetFlag(ID,'powerBeyond');if(flag(entry.actor,'powerBeyondTurn')?.request===payload.request){if(entry.previous)await entry.actor.setFlag(ID,'powerBeyondTurn',entry.previous);else await entry.actor.unsetFlag(ID,'powerBeyondTurn');}}
  claims.delete(payload.request);return;
 }
 if(operation!=='claim')throw Error('Unknown Power from Beyond operation.');if(claims.has(payload.request)){if(claims.get(payload.request).user!==user.id)throw Error('This bonus is already reserved.');return;}
 const actor=resolve(payload.actor),cast=game.messages.get(payload.cast),feature=empoweredChannelingFeature(actor),snapshot=flag(cast,'powerBeyondCast'),item=cast?.getAssociatedItem?.({scaled:true});
 if(!enabled()||!owns(actor,user)||!feature||!snapshot||snapshot.actor!==actor.uuid||snapshot.feature!==feature.uuid||snapshot.turn!==turn()||cast.getAssociatedActor?.()?.uuid!==actor.uuid||!bardSpell(item)||!hasPaidHealingSlot(cast.system)||flag(cast,'powerBeyond')||snapshot.turn&&flag(actor,'powerBeyondTurn')?.turn===snapshot.turn||flag(cast,'targetsConfirmationCanceled')||['regionTriggered','recurringTrigger','riderTriggered'].some(k=>flag(cast,k))||!payload.type||payload.type==='temphp'||payload.formula!==snapshot.formula||isRollAdjustmentLocked(cast))throw Error('Power from Beyond is unavailable for this cast or turn.');
 const previous=flag(actor,'powerBeyondTurn'),record={request:payload.request,actor:actor.uuid,turn:snapshot.turn,type:payload.type,formula:snapshot.formula};let stamped=false;
 try{if(snapshot.turn){await actor.setFlag(ID,'powerBeyondTurn',record);stamped=true;}await cast.setFlag(ID,'powerBeyond',record);}catch(error){if(stamped&&flag(actor,'powerBeyondTurn')?.request===payload.request){if(previous)await actor.setFlag(ID,'powerBeyondTurn',previous);else await actor.unsetFlag(ID,'powerBeyondTurn');}throw error;}
 claims.set(payload.request,{actor,cast,previous,user:user.id});
});}
async function operate(operation,payload){const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return powerOperation(operation,payload);const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Power from Beyond.'));},15000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'powerBeyondOperation',operation,payload,request,user:game.user.id,gm:gm.id});});}
export async function commitPower(app,options){const c=pending.get(app);pending.delete(app);if(!c||!options?.dnd5e?.submitted)return;const current=powerContext(app);if(!current||current.cast.id!==c.cast.id||powerUsed(current))throw Error('Power from Beyond changed. Reopen the roll configuration.');const payload={request:foundry.utils.randomID(),actor:c.actor.uuid,cast:c.cast.id,type:c.type,formula:c.snapshot.formula};try{await operate('claim',payload);}catch(error){await operate('rollback',payload);throw error;}settlements.set(app.message,payload);}
export function installPowerRoll(Type=CONFIG.Dice.DamageRoll){
 if(!Type?.build||wrapped.has(Type))return;wrapped.add(Type);const build=Type.build,configure=Type.buildConfigure;
 if(configure)Type.buildConfigure=async function(config,dialog,message){const rolls=await configure.call(this,config,dialog,message);if(dialog.configure!==false||!rolls?.length)return rolls;const app={config,message},result=finalizePower(app,rolls);await commitPower(app,{dnd5e:{submitted:true}});return result;};
 Type.build=async function(config,dialog,message={}){let success=false;try{const result=await build.call(this,config,dialog,message);success=!!result?.length;return result;}finally{const payload=settlements.get(message);if(payload){settlements.delete(message);await operate(success?'keep':'rollback',payload);}}};
}
const spiritGuardians=item=>item?.type==='spell'&&(key(item)==='spirit-guardians'||item.name==='Spirit Guardians'||[item._stats?.compendiumSource,item._stats?.duplicateSource].some(r=>r?.endsWith('.phbsplSpiritGuar')));
export const modifyGuardEligible=activity=>enabled()&&spiritGuardians(activity?.item)&&bardSpell(activity.item)&&!!empoweredChannelingFeature(activity.actor??activity.item.actor);
export function addModifyGuardField(app){
 for(const old of app.element?.querySelectorAll?.('[data-rsa-spirit-guard-modify]')??[])old.remove();if(!modifyGuardEligible(app.activity))return;
 const feature=empoweredChannelingFeature(app.activity.actor),slot=app.element.querySelector('[name="consume.spellSlot"]'),box=slot?.closest('fieldset')??app.element.querySelector('[data-application-part="consumption"] fieldset');if(!box)return;
 const unavailable=remaining(feature)<1||app.config.consume===false;if(unavailable)app.config.rsaModifySpiritGuardians=false;
 const row=document.createElement('div'),label=document.createElement('label'),fields=document.createElement('div'),input=document.createElement(slot?.localName??'input');row.className='form-group';row.dataset.rsaSpiritGuardModify='';label.textContent='Empowered Channeling';fields.className='form-fields';if(!input.localName||input.localName==='input')input.type='checkbox';input.name='rsaModifySpiritGuardians';input.checked=!unavailable&&app.config.rsaModifySpiritGuardians===true;input.disabled=unavailable;input.title='Spend Empowered Channeling’s modification use: you and allies in this casting’s emanation gain Half Cover.';if(unavailable)row.style.opacity='0.5';input.addEventListener('change',()=>{app.config.rsaModifySpiritGuardians=input.checked;});fields.append(input);row.append(label,fields);box.append(row);
}
export function applyModifyGuard(activity,usage,message,item=activity.item){
 if(!usage.rsaModifySpiritGuardians||flag(item,'spiritGuardCover'))return;
 const actor=activity.actor??item.actor,feature=empoweredChannelingFeature(actor),profile=values(feature?.system?.activities).find(a=>(a.id??a._id)==='Sab8FZ3JA3big4Kr'||a.name==='Modify Spell'),ids=values(profile?.effects).map(e=>e._id??e.id),effect=values(feature?.effects).find(e=>ids.includes(e.id??e._id)&&values(e.statuses).includes('coverHalf'));
 if(!modifyGuardEligible(activity)||remaining(feature)<1||usage.consume===false||!profile||!effect)throw Error('Modify Spell requires an available Empowered Channeling use and its native Half Cover effect.');
 const data=item.toObject(),a=data.system.activities[activity.id],costs=values(profile.consumption?.targets).map(t=>{const cost=t.toObject?.()??foundry.utils.deepClone(t);return cost.type==='itemUses'?{...cost,target:feature.id}:cost;}),index=values(a.consumption?.targets).length;if(!costs.length)throw Error('Modify Spell is missing its native resource cost.');
 a.consumption={...a.consumption,targets:[...values(a.consumption?.targets),...costs]};data.flags??={};data.flags[ID]={...data.flags[ID],spiritGuardCover:{actor:actor.uuid,feature:feature.uuid,effect:effect.uuid,request:foundry.utils.randomID()}};
 item.updateSource(data);item.prepareFinalAttributes();const before=usage.consume;usage.consume={...(typeof before==='object'?before:{action:true,resources:true,spellSlot:true})};if(Array.isArray(before?.resources)||before?.resources===false)usage.consume.resources=[...new Set([...(Array.isArray(before.resources)?before.resources:[]),...costs.map((_c,n)=>index+n)])];else usage.consume.resources=true;
 message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],spiritGuardCover:data.flags[ID].spiritGuardCover,activityOverrideData:data};message.data.flags.dnd5e={...message.data.flags.dnd5e,item:{...message.data.flags.dnd5e?.item,data}};message.hasConsumption=true;
 globalThis.Ugmuls55eAutomationPendingCast?.rebind?.(item.system.activities.get(activity.id),message);
}
export function spiritGuardFreeCause(activity,usage){
 const ref=usage.cause?.activity;if(!ref||!modifyGuardEligible(activity))return false;
 const id=typeof ref==='string'?ref.split('.').at(-1):ref.id,linked=activity.getLinkedActivity?.(ref)??values(activity.item.system.activities).find(a=>(a.id??a._id)===id);
 // Native advancement creates a Forward activity for "Cast and Save (free
 // casting)". Resolve its actual link, including localized or renamed labels.
 return linked?.type==='forward'&&linked.activity?.id===activity.id&&(!linked.item||linked.item.uuid===activity.item.uuid);
}
export function prepareModifyGuard(activity,usage,dialog,message){
 if(!modifyGuardEligible(activity)||usage.cause?.activity&&!spiritGuardFreeCause(activity,usage)||flag(activity.item,'spiritGuardCover')||['regionTriggered','recurringTrigger','riderTriggered'].some(k=>message.data?.flags?.[ID]?.[k]))return;
 const Base=dialog.applicationClass;if(Base)dialog.applicationClass=class extends Base{_onRender(c,o){super._onRender(c,o);addModifyGuardField(this);}async _prepareSubmitData(e,f){const chosen=f?.object?.rsaModifySpiritGuardians??this.element?.querySelector('[name="rsaModifySpiritGuardians"]')?.checked??false,result=await super._prepareSubmitData(e,f);result.rsaModifySpiritGuardians=chosen===true;return result;}};
 if(prepared.has(activity))return;prepared.add(activity);const requires=activity._requiresConfigurationDialog;activity._requiresConfigurationDialog=function(config){return modifyGuardEligible(this)||requires.call(this,config);};const scale=activity._prepareUsageScaling;activity._prepareUsageScaling=async function(config,msg,item){await scale.call(this,config,msg,item);applyModifyGuard(item.system.activities.get(this.id),config,msg,item);};
}
export async function guardCoverSource(feature,native){
 const existing=values(feature.effects).find(e=>flag(e,'empoweredCoverSource'));if(existing)return existing;if(coverSources.has(feature.uuid))return coverSources.get(feature.uuid);
 // Region behavior clones source data verbatim. The book's effect is disabled
 // and transferable; use an enabled, non-transferring copy without changing it.
 const task=(async()=>{const data=native.toObject();delete data._id;delete data.start;delete data.folder;data.disabled=false;data.transfer=false;data.name='Empowered Channeling — Half Cover';data.statuses=['coverHalf'];data.duration={value:null,units:'seconds',expiry:null,expired:false};data.system={...data.system,changes:[]};delete data.system.origin;data.flags={...data.flags,[ID]:{...data.flags?.[ID],empoweredCoverSource:true}};return (await feature.createEmbeddedDocuments('ActiveEffect',[data]))[0];})();coverSources.set(feature.uuid,task);try{return await task;}finally{coverSources.delete(feature.uuid);}
}
export async function attachGuardCover(activity,regions,meta=flag(activity.item,'spiritGuardCover')){
 if(!authority()||!meta||!modifyGuardEligible(activity))return;
 const feature=empoweredChannelingFeature(activity.actor??activity.item.actor),effect=resolve(meta.effect);if(feature?.uuid!==meta.feature||effect?.parent?.uuid!==feature.uuid||!values(effect.statuses).includes('coverHalf'))throw Error('The cast’s native Half Cover source is unavailable.');
 for(const region of regions??[]){if(!region?.isOwner||regionTasks.has(region.uuid))continue;const task=(async()=>{if(values(region.behaviors).some(b=>flag(b,'spiritGuardCover')?.request===meta.request))return;const caster=await resolveRegionCaster(region,activity.item);if(caster?.actor?.uuid!==meta.actor||typeof caster.disposition!=='number')throw Error('Spirit Guardians needs its casting Bard’s token for ally targeting.');const source=await guardCoverSource(feature,effect);await region.createEmbeddedDocuments('RegionBehavior',[{name:'Spirit Guardians — Empowered Channeling: Half Cover',type:'dnd5e.applyActiveEffect',flags:{[ID]:{managedRegionEffect:true,spiritGuardCover:meta}},system:{effects:[source.uuid],dispositions:[caster.disposition],sizes:[],types:[]}}]);})();regionTasks.set(region.uuid,task);try{await task;}finally{regionTasks.delete(region.uuid);}}
}
function report(error){console.error('Empowered Channeling',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'empoweredChannelingAutomation',{name:'Spirits Bard: Empowered Channeling',hint:'Offer the native Power from Beyond die on one slot-funded Bard spell damage/healing roll per turn. Offer Modify Spell in Bard Spirit Guardians consumption to spend its separate modification use and grant native Half Cover only inside that cast’s region.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationEmpoweredChanneling={addChoice:addPowerChoice,finalize:finalizePower,commit:commitPower};installPowerRoll();Hooks.on('dnd5e.postActivityConsumption',capturePowerCast);Hooks.on('dnd5e.preUseActivity',prepareModifyGuard);
 Hooks.on('dnd5e.preRollDamageV2',(config,dialog,message)=>{if(!powerContext({config,message}))return;const configure=dialog.configure;Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog('damage',dialog)??dialog);if(configure===false)dialog.configure=false;});
 // This hook receives raw creation data: only stamp cast identity here. Region
 // behaviors require created documents and active-GM permission, not raw data.
 Hooks.on('dnd5e.createMeasuredTemplate',(activity,data)=>{const meta=flag(activity.item,'spiritGuardCover');if(!meta)return;for(const region of data??[]){region.flags??={};region.flags[ID]={...region.flags[ID],spiritGuardCover:meta};}});
 Hooks.on('dnd5e.postUseActivity',(activity,_usage,results)=>{
  const meta=flag(activity.item,'spiritGuardCover');if(!meta)return;if(!results?.message||!results.templates?.length)return;
  const task=operate('cover',{request:meta.request,cast:results.message.id,regions:results.templates.map(r=>r.uuid)});globalThis.Ugmuls55eAutomationPendingCast?.track(results.message,task);task.catch(report);
 });
 game.socket.on('module.'+ID,p=>{if(p?.action==='powerBeyondReply'&&p.user===game.user.id){const job=waiting.get(p.request);if(!job)return;waiting.delete(p.request);clearTimeout(job.timer);p.error?job.reject(Error(p.error)):job.resolve();return;}if(p?.action!=='powerBeyondOperation'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user);if(!user?.active)return;powerOperation(p.operation,p.payload,user).then(()=>game.socket.emit('module.'+ID,{action:'powerBeyondReply',request:p.request,user:user.id}),error=>game.socket.emit('module.'+ID,{action:'powerBeyondReply',request:p.request,user:user.id,error:error.message}));});
});
