const ID='ugmuls-5-5e-automation';
// Share the selection/budget/bulk-update workflow; each feature retains its own native use pool.
export function createRestSlotRecovery(spec){
const wrapped=new WeakSet(),prepared=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier;
const enabled=()=>game.settings.get(ID,spec.setting)===true;
function naturalRecovery(actor){
 const feature=values(actor?.items).find(i=>i.type==='feat'&&key(i)===spec.feature&&i.system?.source?.rules!=='2014'),cls=values(actor?.items).find(i=>i.type==='class'&&key(i)===spec.classId),level=Number(cls?.system?.levels);
 // Natural Recovery uses its activity pool; Arcane Recovery uses the feature's native pool.
 const activity=values(feature?.system?.activities).find(a=>(a.id??a._id)===spec.activityId||a.name===spec.activityName),pool=spec.pool==='item'?feature?.system?.uses:activity?.uses,spent=Number(pool?.spent??0),max=Number(pool?.max);
 return {feature,activity,budget:Math.ceil(level/2),spent,available:enabled()&&actor?.isOwner&&actor.type!=='group'&&level>=spec.minimumLevel&&Number.isFinite(level)&&!!activity&&Number.isFinite(spent)&&max>spent};
}
function slots(actor,level){const slot=actor.system?.spells?.['spell'+level];return {max:Number(slot?.max??0),value:Number(slot?.value??0)};}
function validateRecovery(actor,selection={},user=game.user,config={}){
 let cost=0;const counts={};for(const [level,count]of Object.entries(selection)){const n=Number(count);if(!/^[1-5]$/.test(level)||!Number.isInteger(n)||n<0)throw Error(spec.label+' can restore only whole numbers of level 1–5 spell slots.');if(n){counts[level]=n;cost+=Number(level)*n;}}
 if(!cost&&!spec.extraSelected?.(actor,config))return null;const context=naturalRecovery(actor);if(!context.available||!(user?.isGM||actor.testUserPermission?.(user,'OWNER')))throw Error(spec.label+' is unavailable or already used since your last Long Rest.');
 if(cost>context.budget)throw Error(spec.label+' selections exceed the '+context.budget+' spell-level budget.');
 for(const [level,count]of Object.entries(counts)){const {max,value}=slots(actor,level);if(!Number.isFinite(max)||!Number.isFinite(value)||count>Math.max(0,max-value))throw Error('Not enough expended level '+level+' slots to recover.');}return {...context,counts,cost};
}
function naturalRecoveryFields(actor,config={}){
 const c=naturalRecovery(actor);if(!c.available)return [];
 const selection=config[spec.field]??{},cost=Object.entries(selection).reduce((sum,[level,n])=>sum+Number(level)*Number(n),0);
 const fields=[];for(let level=1;level<=5;level++){
  const {max,value}=slots(actor,level),expended=Math.max(0,max-value);if(!Number.isInteger(expended)||!expended||level>c.budget)continue;
  // Each dropdown can spend the budget left by the OTHER selected levels.
  // Retain a zero-only row at exhaustion so reducing a selection remains easy.
  // Native ShortRestDialog stores form changes in config and rerenders these fields.
  const ownCost=level*Number(selection[level]??0),remaining=Math.max(0,c.budget-(cost-ownCost)),limit=Math.min(expended,Math.floor(remaining/level));
 const choices=Object.fromEntries(Array.from({length:limit+1},(_,n)=>[String(n),String(n)]));fields.push({name:spec.field+'.'+level,field:new foundry.data.fields.StringField({label:'Level '+level+' slots to recover ('+(max-value)+' expended)',choices,required:true,blank:false}),choices,value:String(config[spec.field]?.[level]??0)});
 }return [...fields,...(spec.extraFields?.(actor,config)??[])];
}
function installNaturalRecoveryRest(Type){
 const p=Type?.prototype;if(!p||wrapped.has(p)||typeof p._prepareContext!=='function')return;wrapped.add(p);const prepare=p._prepareContext,process=p._processFormData;
 p._prepareContext=async function(...args){const context=await prepare.apply(this,args);if(this.config?.type!=='short'||this.isPartyGroup)return context;const fields=naturalRecoveryFields(this.actor,this.config);if(fields.length){const c=naturalRecovery(this.actor),cost=Object.entries(this.config[spec.field]??{}).reduce((sum,[l,n])=>sum+Number(l)*Number(n),0);context.formSections??=[];context.formSections.push({legend:spec.label+' — '+cost+' / '+c.budget+' spell levels',fields});}return context;};
 if(process)p._processFormData=function(...args){const data=process.apply(this,args);if(this.config?.type!=='short'||this.isPartyGroup||!naturalRecoveryFields(this.actor,this.config).length)return data;const selection={};for(const input of this.element?.querySelectorAll?.('[name^="'+spec.field+'."]')??[]){const level=input.name.split('.').at(-1);selection[level]=input.value;}data[spec.field]=selection;spec.readExtra?.(this.element,data,args[0],this.config);validateRecovery(this.actor,selection,game.user,{...this.config,...data});return data;};
}
function projected(data,path,fallback){return Object.hasOwn(data,path)?data[path]:foundry.utils.getProperty(data,path)??fallback;}
function prepareNaturalRecovery(actor,result,config={}){
 if(!result||prepared.has(result)||(config.type??result.type)!=='short'||!config[spec.field]&&!spec.extraSelected?.(actor,config))return;
 const c=validateRecovery(actor,config[spec.field]??{},game.user,config);if(!c)return;
 const actorUpdates={};for(const [level,count]of Object.entries(c.counts)){const {max,value}=slots(actor,level),path='system.spells.spell'+level+'.value',current=Number(projected(result.updateData??{},path,value));if(!Number.isFinite(current)||current+count>max)throw Error('Spell slots changed during this rest. Reopen Short Rest to choose recovery.');actorUpdates[path]=current+count;}
 const activityId=c.activity.id??c.activity._id,path=spec.pool==='item'?'system.uses.spent':'system.activities.'+activityId+'.uses.spent',existing=(result.updateItems??[]).find(i=>i._id===c.feature.id),spent=Number(projected(existing??{},path,c.spent));if(spent!==c.spent)throw Error(spec.label+' changed during this rest. Reopen Short Rest.');
 // Add both the slots and the correct native use pool to the bulk rest update.
 // No resources are spent by dialog changes, preview, or cancellation.
 result.updateData??={};Object.assign(result.updateData,actorUpdates);result.updateItems??=[];if(existing)existing[path]=spent+1;else result.updateItems.push({_id:c.feature.id,[path]:spent+1});spec.afterPrepare?.(actor,result,config,c);prepared.add(result);
}
return {context:naturalRecovery,validate:validateRecovery,fields:naturalRecoveryFields,install:installNaturalRecoveryRest,prepare:prepareNaturalRecovery};
}
const natural=createRestSlotRecovery({setting:'naturalRecoveryAutomation',feature:'natural-recovery',classId:'druid',minimumLevel:6,activityId:'u0UF6WePUutyp6e6',activityName:'Recover Spell Slots',pool:'activity',field:'rsaNaturalRecovery',label:'Natural Recovery'});
export const naturalRecovery=natural.context,validateRecovery=natural.validate,naturalRecoveryFields=natural.fields,installNaturalRecoveryRest=natural.install,prepareNaturalRecovery=natural.prepare;
Hooks.once('init',()=>game.settings.register(ID,'naturalRecoveryAutomation',{name:'Druid: Natural Recovery',hint:'Choose expended level 1–5 spell slots during Short Rest, up to half your Druid level rounded up. Spend only the native recovery activity use; free Circle Spell casting remains manual.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{installNaturalRecoveryRest(CONFIG.DND5E.restTypes?.short?.dialogClass);Hooks.on('dnd5e.preRestCompleted',(a,r,c)=>{try{return prepareNaturalRecovery(a,r,c);}catch(error){console.error('Natural Recovery',error);ui.notifications.error(error.message);return false;}});});
