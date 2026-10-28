import {preyFeature,preyOption,setPreyOption} from "./hunters-prey.js";
import {tacticsFeature,tacticsOption,setTacticsOption} from "./hunter-defensive-tactics.js";
const ID="ugmuls-5-5e-automation",wrapped=new WeakSet(),completed=new WeakSet();
const key=i=>i?.identifier??i?.system?.identifier;
export function rangerRestFields(actor,config={}){
 if(!actor?.isOwner||actor.type==="group")return [];
 const fields=[],selected=config.rsaRangerOptions??{};
 const add=(name,label,choices,current)=>fields.push({name:"rsaRangerOptions."+name,field:new foundry.data.fields.StringField({label,required:false,blank:true,choices}),choices,value:Object.hasOwn(selected,name)?selected[name]:current??""});
 const prey=preyFeature(actor);
 if(game.settings.get(ID,"huntersPreyAutomation")===true&&key(prey)==="hunters-prey"&&prey.system?.source?.rules!=="2014")add("prey","Hunter's Prey",{"":"Choose an option","colossus":"Colossus Slayer","horde":"Horde Breaker"},preyOption(actor));
 if(game.settings.get(ID,"defensiveTacticsAutomation")===true&&tacticsFeature(actor))add("tactics","Defensive Tactics",{"":"Choose an option","escape":"Escape the Horde","multiattack":"Multiattack Defense"},tacticsOption(actor));
 return fields;
}
export function installRangerRestDialog(Type){
 const proto=Type?.prototype;if(!proto||wrapped.has(proto)||typeof proto._prepareContext!=="function")return;wrapped.add(proto);const prepare=proto._prepareContext;
 proto._prepareContext=async function(...args){
  const context=await prepare.apply(this,args);
  if(!["short","long"].includes(this.config?.type)||this.isPartyGroup)return context;
  const fields=rangerRestFields(this.actor,this.config);if(fields.length){context.formSections??=[];context.formSections.push({legend:"Ranger Options",fields});}
  return context;
 };
}
export async function applyRangerRestOptions(actor,result,config={}){
 if(!actor?.isOwner||!result||completed.has(result)||!["short","long"].includes(config.type??result.type))return;
 const options=config.rsaRangerOptions;if(!options)return;
 // Only process fields offered for the current actor and enabled features.
 const fields=rangerRestFields(actor,config),prey=fields.some(f=>f.name==="rsaRangerOptions.prey")&&["colossus","horde"].includes(options.prey),tactics=fields.some(f=>f.name==="rsaRangerOptions.tactics")&&["escape","multiattack"].includes(options.tactics);
 completed.add(result);
 try{if(prey)await setPreyOption(actor,options.prey);if(tactics)await setTacticsOption(actor,options.tactics);}
 catch(error){completed.delete(result);throw error;}
}
Hooks.once("ready",()=>{
 for(const type of ["short","long"])installRangerRestDialog(CONFIG.DND5E.restTypes?.[type]?.dialogClass);
 Hooks.on("dnd5e.restCompleted",(actor,result,config)=>{applyRangerRestOptions(actor,result,config).catch(error=>{console.error("Ranger rest options",error);ui.notifications.error(error.message);});});
});
