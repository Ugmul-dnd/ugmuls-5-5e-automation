import {hollowWrathState} from "./hollow-wrath-aura.js";
import {reactionActivity,offTurn} from "./reaction-tracker.js";
const ID="ugmuls-5-5e-automation",choices=new WeakMap();
let rememberedRoots;
export function rootsDefault(){const value=rememberedRoots??game.settings.get(ID,"lastStranglingRoots");return ["","sap","slow"].includes(value)?value:"sap";}
const enabled=()=>game.settings.get(ID,"rotAndViolenceAutomation")===true;
export function hasRot(actor){return enabled()&&Array.from(actor?.items??[]).some(i=>i.type==="feat"&&([i._stats?.compendiumSource,i.flags?.core?.sourceId].some(r=>r?.endsWith(".rhwHWRotandVioEY"))||i.name==="Rot and Violence"||i.system?.identifier==="rot-and-violence"));}
export function menacingEffect(actor){return Array.from(actor?.effects??[]).find(e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired&&(e.getFlag?.(ID,"hollowWrathFear")??e.flags?.[ID]?.hollowWrathFear)?.menacing);}
function rootsActor(app){const a=app.config?.subject;return a?.type==="attack"&&a.item?.type==="weapon"?a.actor:null;}
export function addRootsChoice(app){
 const actor=rootsActor(app);if(!hasRot(actor)||!hollowWrathState(actor,null,{ignoreAuraSetting:true}))return;
 const field=app.element?.querySelector('fieldset[data-application-part="configuration"]')??app.element?.querySelector('[data-application-part="configuration"] fieldset');if(!field||field.querySelector('[data-roots-choice]'))return;
 const row=document.createElement("div");row.className="form-group";row.dataset.rootsChoice="true";
 const label=document.createElement("label");label.textContent="Strangling Roots";
 const fields=document.createElement("div");fields.className="form-fields";
 const select=document.createElement("select");select.name="rsaStranglingRoots";
 for(const [value,text] of [["","None"],["sap","Sap"],["slow","Slow"]]){const option=document.createElement("option");option.value=value;option.textContent=text;select.append(option);}
 const refresh=()=>{const base=app.element.querySelector('[name="mastery"]')?.value??app.config?.mastery;for(const option of select.options)option.disabled=!!option.value&&option.value===base;if(select.selectedOptions[0]?.disabled){select.value="";choices.set(app,"");}};
 select.value=choices.get(app)??rootsDefault();choices.set(app,select.value);refresh();app.element.querySelector('[name="mastery"]')?.addEventListener("change",refresh);select.addEventListener("change",()=>choices.set(app,select.value));fields.append(select);row.append(label,fields);field.append(row);
}
export function finalizeRoots(app,rolls){
 const actor=rootsActor(app),choice=choices.get(app)??rootsDefault();
 if(!hasRot(actor)||!hollowWrathState(actor,null,{ignoreAuraSetting:true}))return;
 const base=rolls?.[0]?.options?.mastery??app.config?.mastery;
 if(!rolls?.length||choice===base)return;
 if(["","sap","slow"].includes(choice)){
  rememberedRoots=choice;
  Promise.resolve(game.settings.set(ID,"lastStranglingRoots",choice)).catch(error=>console.warn("Ugmuls 5.5e Automation | Could not remember Strangling Roots:",error));
 }
 if(!["sap","slow"].includes(choice))return;
 app.message??={};app.message.data??={};app.message.data.flags??={};app.message.data.flags[ID]??={};app.message.data.flags[ID].stranglingRoots=choice;
 for(const roll of rolls??[]){roll.options??={};roll.options.stranglingRoots=choice;}
}
export function additionalRoots(attack){
 const choice=attack?.getFlag?.(ID,"stranglingRoots")??attack?.rolls?.[0]?.options?.stranglingRoots;
 const base=attack?.system?.mastery??attack?.rolls?.[0]?.options?.mastery;
 return enabled()&&attack?.getAssociatedItem?.()?.type==="weapon"&&["sap","slow"].includes(choice)&&choice!==base?choice:null;
}
export function blockHealing(actor,damages,options={}){
 if(options.rsaUndoDamage||!menacingEffect(actor))return;
 for(const d of damages)if(d.type==="healing"&&d.value>0){d.value=0;d.active??={};d.active.menacingAura=true;}
}
export function blockHpGain(actor,updates,options={}){
 if(options.rsaUndoDamage||!menacingEffect(actor))return;
 const value=updates["system.attributes.hp.value"]??updates.system?.attributes?.hp?.value,current=actor.system.attributes.hp.value;
 if(Number(value)>current){if("system.attributes.hp.value" in updates)updates["system.attributes.hp.value"]=current;else updates.system.attributes.hp.value=current;}
}
function forbidReaction(actor){if(!menacingEffect(actor))return;ui.notifications.warn("Menacing Aura prevents Reactions.");return false;}
Hooks.once("init",()=>game.settings.register(ID,"lastStranglingRoots",{scope:"client",config:false,type:String,default:"sap"}));
Hooks.once("init",()=>game.settings.register(ID,"rotAndViolenceAutomation",{name:"Hollow Warden: Rot and Violence",hint:"Menacing Aura prevents healing and Reactions; Strangling Roots adds Sap or Slow alongside weapon mastery while transformed.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationRot={hasRot,menacingEffect,addRootsChoice,finalizeRoots,additionalRoots};
 Hooks.on("dnd5e.preCalculateDamage",blockHealing);
 Hooks.on("preUpdateActor",blockHpGain);
 Hooks.on("dnd5e.preApplyDamage",(actor,amount,updates,options)=>blockHpGain(actor,updates,options));
 Hooks.on("dnd5e.preUseActivity",(activity,usage,dialog,message)=>{const flags=message?.data?.flags?.[ID];if(flags?.riderTriggered||flags?.regionTriggered)return;if(String(activity.activation?.type??"").startsWith("reaction")||reactionActivity(activity))return forbidReaction(activity.actor??activity.item?.actor);});
 Hooks.on("dnd5e.preRollAttackV2",config=>{if(offTurn(config.subject))return forbidReaction(config.subject?.actor);});
});
