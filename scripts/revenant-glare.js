import {triggerEntry} from "./trigger-library.js";
const ID="ugmuls-5-5e-automation",SAVE="r2U9soI3vKTrXhG1",KEY="mm-repeat-vengeful-glare-fear",wrapped=new WeakSet();
export function prepareRevenantGlareData(item,activity){
 if(!["feat","weapon"].includes(item?.type)||(item.identifier??item.system?.identifier)!=="vengeful-glare"||activity?.id!==SAVE||activity.type!=="save")return null;
 const entry=triggerEntry(KEY);if(!entry?.enabled)return null;
 const data=item.toObject(),save=data.system.activities?.[SAVE];if(!save)return null;
 data.effects??=[];
 let frightened=data.effects.find(e=>(e._id===entry.effectId||e.name===entry.effectName)&&!e.statuses?.includes("paralyzed"));
 if(!frightened){frightened={_id:entry.effectId,name:entry.effectName,type:"base",img:"systems/dnd5e/icons/svg/statuses/frightened.svg",disabled:false,transfer:false,origin:item.actor?.uuid,statuses:["frightened"],duration:{value:60,units:"seconds",expiry:"turnStart",expired:false},system:{changes:[]},flags:{dnd5e:{isTemporary:true}}};data.effects.push(frightened);}
 save.effects??=[];
 const linked=save.effects.find(profile=>(profile._id??profile.uuid?.split(".").at(-1))===frightened._id);
 if(linked){linked._id=frightened._id;linked.uuid=null;linked.onSave=false;}
 else save.effects.push({_id:frightened._id,uuid:null,onSave:false,level:{}});
 data.flags??={};data.flags[ID]={...data.flags[ID],revenantGlarePrepared:true};return data;
}
export function installRevenantGlarePreparation(Type){
 let prototype=Type?.prototype;while(prototype&&!Object.hasOwn(prototype,"_createUsageMessage"))prototype=Object.getPrototypeOf(prototype);if(!prototype||wrapped.has(prototype)||typeof prototype.use!=="function")return;wrapped.add(prototype);const use=prototype.use;
 prototype.use=function(usage={},dialog={},message={}){
  if(this.item?.getFlag?.(ID,"revenantGlarePrepared")||message.data?.flags?.[ID]?.riderTriggered||message.data?.flags?.[ID]?.recurringTrigger)return use.call(this,usage,dialog,message);
  const data=prepareRevenantGlareData(this.item,this);if(!data)return use.call(this,usage,dialog,message);
  const item=new CONFIG.Item.documentClass(data,{parent:this.item.actor});item.prepareFinalAttributes?.();
  return use.call(item.system.activities.get(this.id),usage,dialog,{...message,data:{...message.data,flags:{...message.data?.flags,[ID]:{...message.data?.flags?.[ID],activityOverrideData:data}}}});
 };
}
Hooks.once("ready",()=>{for(const type of Object.values(CONFIG.DND5E.activityTypes))installRevenantGlarePreparation(type.documentClass);});
