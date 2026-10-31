import {createEventQueue} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),wrapped=new WeakSet(),completed=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
export const LAND_CHOICES={arid:'Arid',polar:'Polar',temperate:'Temperate',tropical:'Tropical'};
const enabled=()=>game.settings.get(ID,'landRestAutomation')===true;
export const landFeature=(actor,id='circle-of-the-land-spells')=>values(actor?.items).find(i=>i.type==='feat'&&key(i)===id&&i.system?.source?.rules!=='2014');
const druidClass=actor=>values(actor?.items).find(i=>i.type==='class'&&key(i)==='druid');
export function landSpellTable(feature){
 const result={};const html=feature?.system?.description?.value??'';
 for(const table of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)){
  const land=Object.keys(LAND_CHOICES).find(k=>new RegExp('<caption[^>]*>\\s*'+k+' Land\\s*</caption>','i').test(table[1]));if(!land)continue;const spells=[];
  for(const row of table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){const level=Number(row[1].match(/<td[^>]*>\s*(\d+)\s*<\/td>/i)?.[1]);if(!level)continue;for(const uuid of row[1].matchAll(/@UUID\[([^\]]+)\]/g))spells.push({level,uuid:uuid[1]});}result[land]=spells;
 }return result;
}
export function landRestFields(actor,config={}){
 if(!enabled()||!actor?.isOwner||actor.type==='group'||!landFeature(actor))return [];
 const choices={'':'Choose a land',...LAND_CHOICES},value=config.rsaLand?.type??flag(actor,'landSelection')?.type??'';
 return [{name:'rsaLand.type',field:new foundry.data.fields.StringField({label:'Land Selection',required:false,blank:true,choices}),choices,value}];
}
export function installLandRest(Type){
 const p=Type?.prototype;if(!p||wrapped.has(p)||typeof p._prepareContext!=='function')return;wrapped.add(p);const prepare=p._prepareContext,process=p._processFormData;
 p._prepareContext=async function(...args){const context=await prepare.apply(this,args);if(this.config?.type!=='long'||this.isPartyGroup)return context;const fields=landRestFields(this.actor,this.config);if(fields.length){context.formSections??=[];context.formSections.push({legend:'Circle of the Land',fields});}return context;};
 if(process)p._processFormData=function(...args){const choice=this.element?.querySelector?.('[name="rsaLand.type"]')?.value,data=process.apply(this,args);if(this.config?.type==='long'&&choice!==undefined&&landRestFields(this.actor,this.config).length)data.rsaLand={type:choice};return data;};
}
const sourceUuid=i=>flag(i,'landSpell')?.source??i._stats?.compendiumSource??i._stats?.duplicateSource;
export function setLandSelection(actor,type,user=game.user){return enqueue(async()=>{
 const feature=landFeature(actor),cls=druidClass(actor),level=Number(cls?.system?.levels);
 if(!enabled()||!actor?.isOwner||!(user?.isGM||actor.testUserPermission?.(user,'OWNER'))||!feature||!Object.hasOwn(LAND_CHOICES,type)||!Number.isFinite(level)||level<3)throw Error('Land selection requires your 2024 Circle Spells feature and Druid class.');
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
