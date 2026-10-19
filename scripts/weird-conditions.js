import {triggerEntry} from "./trigger-library.js";
const ID="ugmuls-5-5e-automation",bridges=new Set();
export function weirdTerrorsActive(actor){
 if(!triggerEntry("weird")?.enabled)return false;
 return Array.from(actor?.appliedEffects??actor?.effects??[]).some(effect=>{
  if(effect.disabled||effect.active===false||effect.duration?.expired||effect.system?.expired)return false;
  if(effect.getFlag?.(ID,"recurringEffect")?.key==="weird")return true;
  if(effect.name!=="Frightening Terrors")return false;
  for(const ref of [effect.system?.origin?.activity,effect.system?.origin?.item,effect._stats?.duplicateSource]){
   if(!ref)continue;const source=fromUuidSync(ref,{strict:false}),item=source?.item??(source?.type==="spell"?source:source?.parent);
   if((item?.identifier??item?.system?.identifier)==="weird")return true;
  }
  return false;
 });
}
export function registerWeirdConditions(api=globalThis.ac5e?.usageRules){
 if(!game.modules?.get("automated-conditions-5e")?.active||typeof api?.register!=="function")return false;
 for(const kind of ["attack","check"]){try{
  if(api.register({key:"rsaWeirdTerrors"+kind,scope:"universal",hook:kind,target:"subject",mode:"disadvantage",name:"Weird - Frightening Terrors",persistent:false,evaluate:sandbox=>{const doc=fromUuidSync(sandbox.actorUuid,{strict:false});return weirdTerrorsActive(doc?.actor??doc);}}))bridges.add(kind);
 }catch(error){console.warn("Weird condition integration failed",error);}}
 return bridges.size>0;
}
export function weirdDefaults(config,dialog,message,kind="attack"){
 if((kind==="attack"&&config.subject?.type!=="attack")||(bridges.has(kind)&&game.modules?.get("automated-conditions-5e")?.active))return;
 const actor=(message?.data?.speaker?ChatMessage.getSpeakerActor(message.data.speaker):null)??config.subject?.actor??config.subject?.item?.actor??config.subject;
 if(!weirdTerrorsActive(actor))return;
 config.disadvantage=true;
 for(const roll of config.rolls??[]){
  roll.options??={};const state=roll.options["automated-conditions-5e"]??config.options?.["automated-conditions-5e"]??config["automated-conditions-5e"];
  const advantage=state?.modeCounts?!!(state.modeCounts.advantages?.present||state.explicitModeOverride?.action==="advantage"):!!(config.advantage||roll.options.advantage||roll.options.advantageMode===1);
  Object.assign(roll.options,{advantage,disadvantage:true,advantageMode:advantage?0:-1});
 }
 dialog.options??={};dialog.options.defaultButton=config.rolls?.[0]?.options?.advantage?"normal":"disadvantage";
 return dialog.options.defaultButton;
}
export function prepareWeirdButtons(app,context){const choice=weirdDefaults({...app.config,rolls:app.rolls??app.config.rolls},{options:{}},app.message);if(choice)for(const [key,button]of Object.entries(context.buttons??{}))button.default=key===choice;}
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerWeirdConditions(usageRules));
Hooks.once("ready",()=>{
 registerWeirdConditions();globalThis.Ugmuls55eAutomationWeird={prepareWeirdButtons};
 Hooks.on("dnd5e.preRollAttackV2",weirdDefaults);
 Hooks.on("dnd5e.preRollAbilityCheckV2",(config,dialog,message)=>weirdDefaults(config,dialog,message,"check"));
});
