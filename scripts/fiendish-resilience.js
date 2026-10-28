import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),wrapped=new WeakSet(),completed=new WeakSet();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"fiendishResilienceAutomation")===true;
export const fiendishFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&(i.identifier??i.system?.identifier)==="fiendish-resilience"&&i.system?.source?.rules!=="2014");
export function fiendishChoices(){return Object.fromEntries(Object.entries(CONFIG.DND5E.damageTypes??{}).filter(([key])=>key!=="force").map(([key,data])=>[key,game.i18n.localize(typeof data==="string"?data:data.label)]));}
function resistanceType(effect){return values(effect?.system?.changes??effect?.changes).find(c=>["system.traits.dr.value","system.traits.dr"].includes(c.key))?.value;}
function ownEffect(effect,feature){return !!flag(effect,"fiendishResilience")||!!feature&&(effect.system?.origin?.item===feature.uuid||effect.origin===feature.uuid)&&!!resistanceType(effect);}
export function fiendishSelection(actor){const feature=fiendishFeature(actor),effect=values(actor?.effects).find(e=>ownEffect(e,feature)&&!e.disabled);return flag(effect,"fiendishResilience")?.type??resistanceType(effect)??"";}
export function fiendishRestFields(actor,config={}){
 if(!enabled()||!actor?.isOwner||actor.type==="group"||!fiendishFeature(actor))return [];
 const choices={"":"Choose a resistance",...fiendishChoices()},value=config.rsaFiendishResilience?.type??fiendishSelection(actor);
 return [{name:"rsaFiendishResilience.type",field:new foundry.data.fields.StringField({label:"Resistance Selection",required:false,blank:true,choices}),choices,value}];
}
export function installFiendishRest(Type){
 const p=Type?.prototype;if(!p||wrapped.has(p)||typeof p._prepareContext!=="function")return;wrapped.add(p);const prepare=p._prepareContext,process=p._processFormData;
 p._prepareContext=async function(...args){const context=await prepare.apply(this,args);if(!["short","long"].includes(this.config?.type)||this.isPartyGroup)return context;
  const fields=fiendishRestFields(this.actor,this.config);if(fields.length){context.formSections??=[];context.formSections.push({legend:"Fiendish Resilience",fields});}return context;};
 if(process)p._processFormData=function(...args){
  // Capture the submitted dropdown before native rest processing can rerender.
  const input=this.element?.querySelector?.('[name="rsaFiendishResilience.type"]'),choice=input?.value,data=process.apply(this,args);
  if(choice!==undefined&&fiendishRestFields(this.actor,this.config).length)data.rsaFiendishResilience={type:choice};return data;
 };
}
export function setFiendishResistance(actor,type,user=game.user){return enqueue(async()=>{
 const feature=fiendishFeature(actor);
 if(!enabled()||!feature||!actor?.isOwner||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||!Object.hasOwn(fiendishChoices(),type))throw Error("Fiendish Resilience requires an owned 2024 feature and a damage type other than Force.");
 const source=values(feature.effects).find(e=>resistanceType(e)===type),data=source?.toObject?.()??{};delete data._id;delete data.folder;delete data.start;
 data.name="Fiendish Resilience — "+fiendishChoices()[type];data.img=source?.img??feature.img??"icons/svg/shield.svg";data.type="base";data.disabled=false;data.transfer=false;data.origin=feature.uuid;
 data.duration={value:null,units:"seconds",expiry:null,expired:false};
 data.system={...data.system,changes:source?values(data.system?.changes??data.changes).map(c=>["system.traits.dr","system.traits.dr.value"].includes(c.key)?{...c,key:"system.traits.dr.value",value:type}:c):[{key:"system.traits.dr.value",type:"add",value:type}],origin:{actor:actor.uuid,item:feature.uuid}};delete data.changes;
 data.flags={...data.flags,[ID]:{...data.flags?.[ID],fiendishResilience:{item:feature.uuid,type}}};if(source?.uuid)data._stats={duplicateSource:source.uuid};
 const prior=values(actor.effects).filter(e=>ownEffect(e,feature)),existing=prior.find(e=>flag(e,"fiendishResilience"))??prior[0];
 if(existing){if(resistanceType(existing)!==type||existing.disabled||!flag(existing,"fiendishResilience"))await existing.update(data);}else await actor.createEmbeddedDocuments("ActiveEffect",[data]);
 // Only replace this feature's effects. Other sources of resistance remain intact.
 const obsolete=prior.filter(e=>e!==existing).map(e=>e.id);if(obsolete.length)await actor.deleteEmbeddedDocuments("ActiveEffect",obsolete);
 const transferred=values(feature.effects).filter(e=>e.transfer&&!e.disabled&&resistanceType(e));if(transferred.length)await feature.updateEmbeddedDocuments("ActiveEffect",transferred.map(e=>({_id:e.id,disabled:true})));
 return type;
});}
export async function completedFiendishRest(actor,result,config={}){
 if(!result||completed.has(result)||!["short","long"].includes(config.type??result.type)||!fiendishRestFields(actor,config).length)return;
 const type=config.rsaFiendishResilience?.type;if(!type)return;
 completed.add(result);try{await setFiendishResistance(actor,type);}catch(error){completed.delete(result);throw error;}
}
Hooks.once("init",()=>game.settings.register(ID,"fiendishResilienceAutomation",{name:"Fiend: Fiendish Resilience",hint:"Choose a resistance other than Force in Short/Long Rest dialogs. Apply it when the rest completes, replacing only the previous Fiendish Resilience selection. Requires the 2024 feature.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 for(const type of ["short","long"])installFiendishRest(CONFIG.DND5E.restTypes?.[type]?.dialogClass);
 Hooks.on("dnd5e.restCompleted",(actor,result,config)=>completedFiendishRest(actor,result,config).catch(error=>{console.error("Fiendish Resilience",error);ui.notifications.error(error.message);}));
});

