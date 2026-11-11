import {tokenDistance} from './shared-distance.js';
const ID='ugmuls-5-5e-automation',BOOK='rhwCSDivineRea8I',KEEPER='pUr8uamxX6DHwfFE',prepared=new WeakSet(),installed=new WeakSet();
const values=v=>Array.from(v?.values?.()??(v&&typeof v==='object'&&!Array.isArray(v)?Object.values(v):v)??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],enabled=()=>game.settings.get(ID,'divineReaperAutomation')===true;
const resolve=r=>{try{return globalThis.fromUuidSync?.(r,{strict:false});}catch{return null;}},remaining=i=>Number(i?.system?.uses?.value??(Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0)));
const native=(i,id,name)=>i?.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)===name||i.id===id||i.name?.trim().toLowerCase()===name.replaceAll('-',' ')||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.'+id)));
export const reaperFeature=a=>values(a?.items).find(i=>native(i,BOOK,'divine-reaper'));
export const reaperChannel=a=>values(a?.items).find(i=>key(i)==='channel-divinity'&&i.system?.source?.rules!=='2014');
const domainSources=['phbsplDetectEvil','phbsplFalseLife0','phbsplGentleRepo','phbsplRayofEnfee','phbsplSparetheDy','phbsplRevivify00','phbsplVampiricTo','phbsplBlight0000','phbsplDeathWard0','phbsplDispelEvil','phbsplRaiseDead0'];
const domainNames=['detect-evil-and-good','false-life','gentle-repose','ray-of-enfeeblement','spare-the-dying','revivify','vampiric-touch','blight','death-ward','dispel-evil-and-good','raise-dead'];
export function graveDomainSpell(item){
 const table=values(item?.actor?.items).find(i=>native(i,'rhwCSGraveDomaZF','grave-domain-spells')),grants=values(table?.system?.advancement).flatMap(a=>values(a.configuration?.items).map(i=>i.uuid)).filter(Boolean),refs=[item?.uuid,item?._stats?.compendiumSource,item?._stats?.duplicateSource,item?.flags?.core?.sourceId].filter(Boolean);
 return refs.some(r=>grants.includes(r)||domainSources.some(id=>r.endsWith('.'+id)))||domainSources.includes(item?.id)||domainNames.includes(key(item))||domainNames.includes(item?.name?.trim().toLowerCase().replaceAll(' ','-'));
}
function castLevel(activity,usage){const slot=usage?.spell?.slot;return slot==='pact'?Number(activity.actor?.system?.spells?.pact?.level):/^spell[1-9]$/.test(slot??'')?Number(slot.slice(5)):Number(activity.item?.system?.level)+Number(usage?.scaling??activity.item?.flags?.dnd5e?.scaling??0);}
function targetCount(activity,usage){
 const raw=activity.item?.toObject?.().system,source=raw?.activities?.[activity.id],expression=(source?.target?.override?source.target:raw?.target)?.affects?.count??activity.target?.affects?.count;
 if(Number.isFinite(Number(expression))&&String(expression).trim())return Number(expression);
 if(typeof expression!=='string'||!expression.trim())return NaN;
 const data={...activity.actor?.getRollData?.(),item:{...activity.item?.getRollData?.().item,level:castLevel(activity,usage)}},roll=new CONFIG.Dice.BasicRoll(expression,data);if(roll.isDeterministic===false)return NaN;return roll.evaluateSync().total;
}
export function enhancedEligible(activity,usage={}){
 if(!enabled()||activity?.item?.type!=='spell'||!reaperFeature(activity.actor??activity.item.actor)||['cast','forward'].includes(activity.type)||activity.target?.template?.type)return false;
 const range=activity.range?.units?activity.range:activity.item.system?.range;if(!range?.units||['self','spec'].includes(range.units))return false;
 const type=activity.target?.affects?.type;if(!['creature','creatureOrObject','willing','ally','enemy','humanoid','object'].includes(type)||targetCount(activity,usage)!==1)return false;
 return graveDomainSpell(activity.item)||type!=='object'&&activity.item.system?.school==='nec'&&castLevel(activity,usage)<=5;
}
export const enhancedTargets=a=>!!flag(a?.item,'enhancedNecromancy');
export function enhancedTarget(activity,token){
 token=token?.document??token;const source=activity.getUsageToken?.(),caster=source?.document??source,range=activity.range?.units?activity.range:activity.item.system.range;
 if(!token?.actor||token.hidden||!caster?.actor||caster.parent?.uuid!==token.parent?.uuid)return false;
 const metric=/^(m|meters?|metres?)$/i.test(caster.parent.grid?.units??'ft'),factor=metric?0.3048:1,units=range.units;
 const distance=units==='touch'?5*factor:units==='ft'?Number(range.value)*factor:units==='m'?Number(range.value)*(metric?1:1/0.3048):units==='mi'?Number(range.value)*5280*factor:units==='any'?Infinity:NaN;
 return !Number.isNaN(distance)&&tokenDistance(caster,token)<=distance+1e-7;
}
export function validateEnhancedTargets(activity,targets){
 if(!enhancedTargets(activity))return targets;const state=flag(activity.item,'enhancedNecromancy'),unique=new Map(targets.map(t=>[t.token,t]));
 if(unique.size!==2||new Set([...unique.values()].map(t=>resolve(t.token)?.actor?.uuid)).size!==2||!state.originalTargets.every(id=>unique.has(id))||![...unique.values()].every(t=>enhancedTarget(activity,resolve(t.token))))throw Error('Enhanced Necromancy requires the original target and a second distinct creature within the spell’s range.');return [...unique.values()];
}
export function addEnhancedField(app){
 for(const old of app.element?.querySelectorAll?.('[data-rsa-enhanced-necromancy]')??[])old.remove();
 if(!enhancedEligible(app.activity,app.config))return;const form=app.element?.matches?.('form')?app.element:app.element?.querySelector('form');if(!form)return;
 const unavailable=!(remaining(reaperChannel(app.activity.actor))>=1)||app.config.consume===false,row=document.createElement('div'),label=document.createElement('label'),fields=document.createElement('div'),input=document.createElement('input');row.className='form-group';row.dataset.rsaEnhancedNecromancy='';label.textContent='Enhanced Necromancy';fields.className='form-fields';input.type='checkbox';input.name='rsaEnhancedNecromancy';input.checked=!unavailable&&app.config.rsaEnhancedNecromancy===true;input.disabled=unavailable;if(unavailable)row.style.opacity='0.5';input.title=unavailable?'No Channel Divinity available':'Spend 1 Channel Divinity to add a second creature. Provide costly or consumed materials for both targets.';input.addEventListener('change',()=>app.config.rsaEnhancedNecromancy=input.checked);fields.append(input);row.append(label,fields);(app.element.querySelector('[data-application-part="consumption"]')??form).append(row);
}
export function applyEnhancedChoice(activity,usage,message,item=activity.item){
 if(!usage.rsaEnhancedNecromancy||flag(item,'enhancedNecromancy'))return;
 const actor=activity.actor,resource=reaperChannel(actor);if(!enhancedEligible(activity,usage)||!(remaining(resource)>=1)||usage.consume===false)throw Error('Enhanced Necromancy requires an eligible single-target spell and an available Channel Divinity use.');
 const data=item.toObject(),a=data.system.activities[activity.id],targets=values(a.consumption?.targets),cost=targets.length;targets.push({type:'itemUses',target:resource.id,value:'1',scaling:{mode:''}});a.consumption={...a.consumption,targets};
 a.target={override:true,prompt:false,affects:{...activity.target.affects,type:['willing','ally','enemy','humanoid'].includes(activity.target.affects.type)?activity.target.affects.type:'creature',count:'2',choice:true},template:{type:''}};
 const original=(message.data?.system?.targets??values(game.user.targets).map(t=>({token:(t.document??t).uuid}))).map(t=>t.token).filter(Boolean).slice(0,1);
 data.flags??={};data.flags[ID]={...data.flags[ID],enhancedNecromancy:{feature:reaperFeature(actor).uuid,resource:resource.uuid,originalTargets:original}};item.updateSource(data);item.prepareFinalAttributes();
 const selected=usage.consume?.resources;usage.consume={...(typeof usage.consume==='object'?usage.consume:{}),resources:Array.isArray(selected)?[...new Set([...selected,cost])]:selected===false?[cost]:true};
 message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],enhancedNecromancy:data.flags[ID].enhancedNecromancy,activityOverrideData:data,targetsConfirmationPending:true,resumeAreaDamage:usage.subsequentActions!==false};message.data.flags.dnd5e={...message.data.flags.dnd5e,item:{...message.data.flags.dnd5e?.item,data}};message.hasConsumption=true;usage.subsequentActions=false;
 globalThis.Ugmuls55eAutomationPendingCast?.rebind?.(item.system.activities.get(activity.id),message);
}
export function prepareEnhanced(activity,usage,dialog,message){
 const baseUsage={scaling:0,spell:{slot:'spell'+Number(activity.item?.system?.level)}};
 if(!enhancedEligible(activity,usage)&&!enhancedEligible(activity,baseUsage)||usage.cause?.activity||flag(activity.item,'enhancedNecromancy')||['riderTriggered','regionTriggered','recurringTrigger'].some(k=>message.data?.flags?.[ID]?.[k]))return;
 usage.rsaEnhancedNecromancy??=false;const Base=dialog.applicationClass;if(Base)dialog.applicationClass=class extends Base{_onRender(c,o){super._onRender(c,o);addEnhancedField(this)}async _prepareSubmitData(e,f){const selected=f?.object?.rsaEnhancedNecromancy??this.element?.querySelector('[name="rsaEnhancedNecromancy"]')?.checked??false,result=await super._prepareSubmitData(e,f);result.rsaEnhancedNecromancy=selected===true;return result;}};
 if(prepared.has(activity))return;prepared.add(activity);const requires=activity._requiresConfigurationDialog;activity._requiresConfigurationDialog=function(config){return enhancedEligible(this,config)||requires.call(this,config)};
 const scale=activity._prepareUsageScaling;activity._prepareUsageScaling=async function(config,msg,item){await scale.call(this,config,msg,item);applyEnhancedChoice(item.system.activities.get(this.id),config,msg,item);};
}
export function keeperData(item){
 const data=item.toObject(),a=data.system.activities[KEEPER];if(!a)return null;const targets=values(a.consumption?.targets);if(!targets.some(t=>t.type==='itemUses'&&(!t.target||[item.id,item.uuid].includes(t.target))&&Number(t.value)>0))targets.push({type:'itemUses',target:item.id,value:'1',scaling:{mode:''}});
 a.consumption={...a.consumption,spellSlot:false,targets};data.flags??={};data.flags[ID]={...data.flags[ID],keeperPrepared:true};return data;
}
export function installKeeper(Type){let p=Type?.prototype;while(p&&!Object.hasOwn(p,'use'))p=Object.getPrototypeOf(p);if(!p||installed.has(p))return;installed.add(p);const use=p.use;p.use=async function(usage={},dialog={},message={}){
 if(!enabled()||!native(this.item,BOOK,'divine-reaper')||this.id!==KEEPER||flag(this.item,'keeperPrepared'))return use.call(this,usage,dialog,message);
 const data=keeperData(this.item),helper=new CONFIG.Item.documentClass(data,{parent:this.actor});helper.prepareFinalAttributes?.();return use.call(helper.system.activities.get(KEEPER),usage,dialog,{...message,data:{...message.data,flags:{...message.data?.flags,dnd5e:{...message.data?.flags?.dnd5e,item:{...message.data?.flags?.dnd5e?.item,data}},[ID]:{...message.data?.flags?.[ID],activityOverrideData:data,riderTriggered:true}}}});
 };}
Hooks.once('init',()=>game.settings.register(ID,'divineReaperAutomation',{name:'Grave Cleric: Divine Reaper',hint:'Offer Enhanced Necromancy in eligible spell usage configuration, spend Channel Divinity and confirm a second creature in native range. Exclude Self-only spells. Link manual Keeper of Souls healing to Divine Reaper’s own use; retain native rest recovery and slot restoration.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationReaper={needsTargets:enhancedTargets,target:enhancedTarget,validateTargets:validateEnhancedTargets};Hooks.on('dnd5e.preUseActivity',prepareEnhanced);installKeeper(CONFIG.DND5E.activityTypes?.heal?.documentClass);});
