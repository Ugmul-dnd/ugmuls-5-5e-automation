import {createEventQueue} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),wrapped=new WeakSet(),completed=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
export const LAND_CHOICES={arid:'Arid',polar:'Polar',temperate:'Temperate',tropical:'Tropical'};
const enabled=()=>game.settings.get(ID,'landRestAutomation')===true;
export const landFeature=(actor,id='circle-of-the-land-spells')=>values(actor?.items).find(i=>i.type==='feat'&&key(i)===id&&i.system?.source?.rules!=='2014');
const druidClass=actor=>values(actor?.items).find(i=>i.type==='class'&&key(i)==='druid');
const landChoice=feature=>values(feature?.system?.advancement).find(a=>a.type==='ItemChoice'&&values(a.configuration?.pool).length&&a.configuration?.choices?.['3']?.count===1);
export function currentLandSelection(actor){
 const feature=landFeature(actor),choice=landChoice(feature),origin=choice?`${feature.id}.${choice.id??choice._id}`:null;
 const owned=values(actor?.items).filter(i=>i.type==='feat'&&Object.keys(LAND_CHOICES).some(type=>key(i)===type+'-land')&&(!origin||(i.getFlag?.('dnd5e','advancementOrigin')??i.flags?.dnd5e?.advancementOrigin)===origin));
 return owned.length===1?key(owned[0]).replace(/-land$/,''):flag(actor,'landSelection')?.type??'';
}
export function landSpellTable(feature){
 const result={};const html=feature?.system?.description?.value??'';
 for(const table of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)){
  const land=Object.keys(LAND_CHOICES).find(k=>new RegExp('<caption[^>]*>\\s*'+k+' Land\\s*</caption>','i').test(table[1]));if(!land)continue;const spells=[];
  for(const row of table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){const level=Number(row[1].match(/<td[^>]*>\s*(\d+)\s*<\/td>/i)?.[1]);if(!level)continue;for(const uuid of row[1].matchAll(/@UUID\[([^\]]+)\]/g))spells.push({level,uuid:uuid[1]});}result[land]=spells;
 }return result;
}
export function landRestFields(actor,config={}){
 if(!enabled()||!actor?.isOwner||actor.type==='group'||!landFeature(actor))return [];
 const choices={'':'Choose a land',...LAND_CHOICES},value=config.rsaLand?.type??currentLandSelection(actor);
 return [{name:'rsaLand.type',field:new foundry.data.fields.StringField({label:'Land Selection',required:false,blank:true,choices}),choices,value}];
}
export function installLandRest(Type){
 const p=Type?.prototype;if(!p||wrapped.has(p)||typeof p._prepareContext!=='function')return;wrapped.add(p);const prepare=p._prepareContext,process=p._processFormData;
 p._prepareContext=async function(...args){const context=await prepare.apply(this,args);if(this.config?.type!=='long'||this.isPartyGroup)return context;const fields=landRestFields(this.actor,this.config);if(fields.length){context.formSections??=[];context.formSections.push({legend:'Circle of the Land',fields});}return context;};
 if(process)p._processFormData=function(...args){const choice=this.element?.querySelector?.('[name="rsaLand.type"]')?.value,data=process.apply(this,args);if(this.config?.type==='long'&&choice!==undefined&&landRestFields(this.actor,this.config).length)data.rsaLand={type:choice};return data;};
}
const sourceUuid=i=>flag(i,'landSpell')?.source??i._stats?.compendiumSource??i._stats?.duplicateSource;
async function setNativeLandSelection(actor,feature,choice,type,level){
 // Native advancement methods operate on a detached Actor, as in the system's
 // AdvancementManager. Preview/cancellation never changes the live character.
 const before=values(actor.items).map(i=>i.toObject()),priorSelection=flag(actor,'landSelection');
 const pool=await Promise.all(values(choice.configuration.pool).map(async entry=>({uuid:entry.uuid,item:await fromUuid(entry.uuid)})));
 const selected=pool.find(entry=>key(entry.item)===type+'-land');
 if(!selected?.item||selected.item.type!=='feat')throw Error('The native land feature is unavailable. No selection was changed.');
 const grants=values(selected.item.system?.advancement).filter(a=>a.type==='ItemGrant'&&Number(a.level)<=level);
 if(!grants.length)throw Error('The native land spell advancements are unavailable.');
 for(const grant of grants)for(const entry of values(grant.configuration?.items)){
  if((await fromUuid(entry.uuid))?.type!=='spell')throw Error('A Circle Spell is unavailable: '+entry.uuid);
 }
 const clone=actor.clone({}, {keepId:true}),clonedFeature=clone.items.get(feature.id),choiceId=choice.id??choice._id;
 const nativeChoice=clonedFeature?.advancement?.byId?.[choiceId];
 if(!nativeChoice?.apply||!nativeChoice.reverse)throw Error('Native land advancement support is unavailable.');
 const added=nativeChoice.value?.added?.[3]??{},oldLands=Object.keys(added).map(id=>clone.items.get(id)).filter(Boolean);
 const same=oldLands.length===1&&key(oldLands[0])===type+'-land';
 if(!same){
  for(const item of oldLands){
   // Reverse only grants belonging to the old land, never ordinary prepared spells.
   for(const advancement of values(item.advancement?.byId).filter(a=>a.type==='ItemGrant').reverse())await advancement.reverse(advancement.level);
  }
  await nativeChoice.reverse(3);
  await nativeChoice.apply(3,{selected:[selected.uuid]});
 }
 const land=Object.keys(nativeChoice.value?.added?.[3]??{}).map(id=>clone.items.get(id)).find(i=>key(i)===type+'-land');
 if(!land)throw Error('The native land choice could not be prepared.');
 for(const grant of grants){
  const advancement=land.advancement?.byId?.[grant.id??grant._id];
  if(!advancement?.apply)throw Error('A native land spell advancement is unavailable.');
  await advancement.apply(Number(grant.level),{}, {initial:true});
 }
 // Retire only copies explicitly created by our older selector. Native grants
 // carry the system's own advancement origin and remain managed by that system.
 for(const item of values(clone.items))if(item.type==='spell'&&flag(item,'landSpell')?.feature===feature.uuid)clone.items.delete(item.id);
 const after=values(clone.items).map(i=>i.toObject()),old=new Map(before.map(i=>[i._id,i])),next=new Map(after.map(i=>[i._id,i]));
 const create=after.filter(i=>!old.has(i._id)),remove=before.filter(i=>!next.has(i._id)),update=after.filter(i=>old.has(i._id)&&JSON.stringify(i)!==JSON.stringify(old.get(i._id)));
 const selection={type,feature:feature.uuid},changeSelection=priorSelection?.type!==type||priorSelection?.feature!==feature.uuid;
 if(!create.length&&!remove.length&&!update.length&&!changeSelection)return type;
 if(JSON.stringify(values(actor.items).map(i=>i.toObject()))!==JSON.stringify(before))throw Error('The character changed during land selection. Please retry.');
 try{
  await actor.performBulkUpdate({create,delete:remove.map(i=>i._id),item:update,...(changeSelection?{actor:{['flags.'+ID+'.landSelection']:selection}}:{})},{isAdvancement:true,updateOptions:{diff:false,recursive:false}});
 }catch(error){
  // A rejected/partial database batch must leave the previous land and grants usable.
  const ids=new Set(values(actor.items).map(i=>i.id)),touched=new Set([...remove,...update].map(i=>i._id));
  await actor.performBulkUpdate({delete:create.filter(i=>ids.has(i._id)).map(i=>i._id),create:before.filter(i=>touched.has(i._id)&&!ids.has(i._id)),item:before.filter(i=>touched.has(i._id)&&ids.has(i._id)),actor:priorSelection?{['flags.'+ID+'.landSelection']:priorSelection}:{['flags.'+ID+'.-=landSelection']:null}},{isAdvancement:true,updateOptions:{diff:false,recursive:false}});
  throw error;
 }
 return type;
}
export function setLandSelection(actor,type,user=game.user){return enqueue(async()=>{
 const feature=landFeature(actor),cls=druidClass(actor),level=Number(cls?.system?.levels);
 if(!enabled()||!actor?.isOwner||!(user?.isGM||actor.testUserPermission?.(user,'OWNER'))||!feature||!Object.hasOwn(LAND_CHOICES,type)||!Number.isFinite(level)||level<3)throw Error('Land selection requires your 2024 Circle Spells feature and Druid class.');
 const choice=landChoice(feature);if(choice)return setNativeLandSelection(actor,feature,choice,type,level);
 const table=landSpellTable(feature),entries=table[type]?.filter(e=>e.level<=level);if(!entries?.length)throw Error('The native Circle Spells table is unavailable. No selection was changed.');
 const sources=await Promise.all(entries.map(async e=>{const spell=await fromUuid(e.uuid);if(spell?.type!=='spell')throw Error('A Circle Spell is unavailable: '+e.uuid);return {spell,uuid:e.uuid};}));
 // Only dedicated subclass copies are managed. Normal Druid/multiclass copies
 // retain their preparation, activities, resources and other grants.
 const all=new Set(Object.values(table).flat().map(e=>e.uuid)),prior=values(actor.items).filter(i=>i.type==='spell'&&(flag(i,'landSpell')?.feature===feature.uuid||i.system?.sourceItem==='subclass:land'&&all.has(sourceUuid(i))));
 const wanted=new Set(entries.map(e=>e.uuid)),keep=new Set(),create=[],updates=[];
 const always=CONFIG.DND5E.spellPreparationStates.always.value,method=cls.system.spellcasting?.type??'spell';
 for(const {spell,uuid}of sources){const existing=prior.find(i=>sourceUuid(i)===uuid&&!keep.has(i.id));if(existing){keep.add(existing.id);if(existing.system.prepared!==always)updates.push({_id:existing.id,'system.prepared':always});continue;}
  const data=game.items.fromCompendium(spell);delete data._id;data.system.sourceItem='subclass:land';data.system.method=method;data.system.prepared=always;data.flags??={};data.flags[ID]={...data.flags[ID],landSpell:{feature:feature.uuid,source:uuid,land:type}};create.push(data);
 }
 const obsolete=prior.filter(i=>!keep.has(i.id)&&(!wanted.has(sourceUuid(i))||prior.some(p=>p!==i&&keep.has(p.id)&&sourceUuid(p)===sourceUuid(i))));
 const ward=level>=10?landFeature(actor,'natures-ward'):null,wardEffects=values(ward?.effects).filter(e=>e.transfer&&values(e.system?.changes).some(c=>c.key==='system.traits.dr.value'));
 const selected=wardEffects.find(e=>e.name?.trim().toLowerCase().endsWith(': '+type));if(ward&&!selected)throw Error('The native Nature’s Ward effect for this land is unavailable.');
 const wardUpdates=wardEffects.filter(e=>e.disabled!==(e!==selected)).map(e=>({_id:e.id,disabled:e!==selected}));
 // Resolve/validate all source documents before changing the actor. Roll back
 // newly created grants and native toggles if an application step fails.
 const beforeUpdates=updates.map(u=>({_id:u._id,'system.prepared':prior.find(i=>i.id===u._id).system.prepared})),beforeWard=wardUpdates.map(u=>({_id:u._id,disabled:wardEffects.find(e=>e.id===u._id).disabled}));let created=[],deleted=false;
 try{
  if(create.length)created=await actor.createEmbeddedDocuments('Item',create);
  if(updates.length)await actor.updateEmbeddedDocuments('Item',updates);
  if(wardUpdates.length)await ward.updateEmbeddedDocuments('ActiveEffect',wardUpdates);
  if(obsolete.length){await actor.deleteEmbeddedDocuments('Item',obsolete.map(i=>i.id));deleted=true;}
  if(flag(actor,'landSelection')?.type!==type)await actor.setFlag(ID,'landSelection',{type,feature:feature.uuid});
 }catch(error){
  if(created.length)await actor.deleteEmbeddedDocuments('Item',created.map(i=>i.id));
  if(beforeUpdates.length)await actor.updateEmbeddedDocuments('Item',beforeUpdates);
  if(beforeWard.length)await ward.updateEmbeddedDocuments('ActiveEffect',beforeWard);
  if(deleted)await actor.createEmbeddedDocuments('Item',obsolete.map(i=>i.toObject()),{keepId:true});throw error;
 }
 return type;
});}
export async function completedLandRest(actor,result,config={}){
 if(!result||completed.has(result)||(config.type??result.type)!=='long'||!landRestFields(actor,config).length)return;const type=config.rsaLand?.type;if(!type)return;
 completed.add(result);try{await setLandSelection(actor,type);}catch(error){completed.delete(result);throw error;}
}
Hooks.once('init',()=>game.settings.register(ID,'landRestAutomation',{name:'Druid: Circle of the Land Rest Selection',hint:'Choose a land at Long Rest. Prepare its native Circle Spells and activate the matching Nature’s Ward resistance when owned. Preserve other spell and resistance sources.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{installLandRest(CONFIG.DND5E.restTypes?.long?.dialogClass);Hooks.on('dnd5e.restCompleted',(a,r,c)=>completedLandRest(a,r,c).catch(error=>{console.error('Circle of the Land',error);ui.notifications.error(error.message);}));});
