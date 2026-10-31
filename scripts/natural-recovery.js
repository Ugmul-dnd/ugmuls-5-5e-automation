const ID='ugmuls-5-5e-automation',wrapped=new WeakSet(),prepared=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier;
const enabled=()=>game.settings.get(ID,'naturalRecoveryAutomation')===true;
export function naturalRecovery(actor){
 const feature=values(actor?.items).find(i=>i.type==='feat'&&key(i)==='natural-recovery'&&i.system?.source?.rules!=='2014'),cls=values(actor?.items).find(i=>i.type==='class'&&key(i)==='druid'),level=Number(cls?.system?.levels);
 // This is the recovery activity's pool, independent of the free-cast activity.
 const activity=values(feature?.system?.activities).find(a=>(a.id??a._id)==='u0UF6WePUutyp6e6'||a.name==='Recover Spell Slots'),spent=Number(activity?.uses?.spent??0),max=Number(activity?.uses?.max);
 return {feature,activity,budget:Math.ceil(level/2),spent,available:enabled()&&actor?.isOwner&&actor.type!=='group'&&level>=6&&Number.isFinite(level)&&!!activity&&Number.isFinite(spent)&&max>spent};
}
function slots(actor,level){const slot=actor.system?.spells?.['spell'+level];return {max:Number(slot?.max??0),value:Number(slot?.value??0)};}
export function validateRecovery(actor,selection={},user=game.user){
 let cost=0;const counts={};for(const [level,count]of Object.entries(selection)){const n=Number(count);if(!/^[1-5]$/.test(level)||!Number.isInteger(n)||n<0)throw Error('Natural Recovery can restore only whole numbers of level 1–5 spell slots.');if(n){counts[level]=n;cost+=Number(level)*n;}}
 if(!cost)return null;const context=naturalRecovery(actor);if(!context.available||!(user?.isGM||actor.testUserPermission?.(user,'OWNER')))throw Error('Natural Recovery is unavailable or already used since your last Long Rest.');
 if(cost>context.budget)throw Error('Natural Recovery selections exceed the '+context.budget+' spell-level budget.');
 for(const [level,count]of Object.entries(counts)){const {max,value}=slots(actor,level);if(!Number.isFinite(max)||!Number.isFinite(value)||count>Math.max(0,max-value))throw Error('Not enough expended level '+level+' slots to recover.');}return {...context,counts,cost};
}
export function naturalRecoveryFields(actor,config={}){
 const c=naturalRecovery(actor);if(!c.available)return [];
 const selection=config.rsaNaturalRecovery??{},cost=Object.entries(selection).reduce((sum,[level,n])=>sum+Number(level)*Number(n),0);
 const fields=[];for(let level=1;level<=5;level++){
  const {max,value}=slots(actor,level),expended=Math.max(0,max-value);if(!Number.isInteger(expended)||!expended||level>c.budget)continue;
  // Each dropdown can spend the budget left by the OTHER selected levels.
  // Retain a zero-only row at exhaustion so reducing a selection remains easy.
  // Native ShortRestDialog stores form changes in config and rerenders these fields.
  const ownCost=level*Number(selection[level]??0),remaining=Math.max(0,c.budget-(cost-ownCost)),limit=Math.min(expended,Math.floor(remaining/level));
 const choices=Object.fromEntries(Array.from({length:limit+1},(_,n)=>[String(n),String(n)]));fields.push({name:'rsaNaturalRecovery.'+level,field:new foundry.data.fields.StringField({label:'Level '+level+' slots to recover ('+(max-value)+' expended)',choices,required:true,blank:false}),choices,value:String(config.rsaNaturalRecovery?.[level]??0)});
 }return fields;
}
export function installNaturalRecoveryRest(Type){
 const p=Type?.prototype;if(!p||wrapped.has(p)||typeof p._prepareContext!=='function')return;wrapped.add(p);const prepare=p._prepareContext,process=p._processFormData;
 p._prepareContext=async function(...args){const context=await prepare.apply(this,args);if(this.config?.type!=='short'||this.isPartyGroup)return context;const fields=naturalRecoveryFields(this.actor,this.config);if(fields.length){const c=naturalRecovery(this.actor),cost=Object.entries(this.config.rsaNaturalRecovery??{}).reduce((sum,[l,n])=>sum+Number(l)*Number(n),0);context.formSections??=[];context.formSections.push({legend:'Natural Recovery — '+cost+' / '+c.budget+' spell levels',fields});}return context;};
 if(process)p._processFormData=function(...args){const data=process.apply(this,args);if(this.config?.type!=='short'||this.isPartyGroup||!naturalRecoveryFields(this.actor,this.config).length)return data;const selection={};for(const input of this.element?.querySelectorAll?.('[name^="rsaNaturalRecovery."]')??[]){const level=input.name.split('.').at(-1);selection[level]=input.value;}validateRecovery(this.actor,selection);data.rsaNaturalRecovery=selection;return data;};
}
function projected(data,path,fallback){return Object.hasOwn(data,path)?data[path]:foundry.utils.getProperty(data,path)??fallback;}
export function prepareNaturalRecovery(actor,result,config={}){
 if(!result||prepared.has(result)||(config.type??result.type)!=='short'||!config.rsaNaturalRecovery)return;
 const c=validateRecovery(actor,config.rsaNaturalRecovery);if(!c)return;
 const actorUpdates={};for(const [level,count]of Object.entries(c.counts)){const {max,value}=slots(actor,level),path='system.spells.spell'+level+'.value',current=Number(projected(result.updateData??{},path,value));if(!Number.isFinite(current)||current+count>max)throw Error('Spell slots changed during this rest. Reopen Short Rest to choose recovery.');actorUpdates[path]=current+count;}
 const activityId=c.activity.id??c.activity._id,path='system.activities.'+activityId+'.uses.spent',existing=(result.updateItems??[]).find(i=>i._id===c.feature.id),spent=Number(projected(existing??{},path,c.spent));if(spent!==c.spent)throw Error('Natural Recovery changed during this rest. Reopen Short Rest.');
 // Add both the slots and this activity's use to the native bulk rest update.
 // No resources are spent by dialog changes, preview, or cancellation.
 result.updateData??={};Object.assign(result.updateData,actorUpdates);result.updateItems??=[];if(existing)existing[path]=spent+1;else result.updateItems.push({_id:c.feature.id,[path]:spent+1});prepared.add(result);
}
Hooks.once('init',()=>game.settings.register(ID,'naturalRecoveryAutomation',{name:'Druid: Natural Recovery',hint:'Choose expended level 1–5 spell slots during Short Rest, up to half your Druid level rounded up. Spend only the native recovery activity use; free Circle Spell casting remains manual.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{installNaturalRecoveryRest(CONFIG.DND5E.restTypes?.short?.dialogClass);Hooks.on('dnd5e.preRestCompleted',(a,r,c)=>{try{return prepareNaturalRecovery(a,r,c);}catch(error){console.error('Natural Recovery',error);ui.notifications.error(error.message);return false;}});});
