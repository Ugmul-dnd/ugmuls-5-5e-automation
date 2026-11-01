import {conditionSaveSource} from "./fortifying-soul.js";
const ID="ugmuls-5-5e-automation";let bridge=false;
const values=v=>Array.from(v?.values?.()??v??[]);
export function psychicDefenses(actor){return values(actor?.items).some(item=>item.type==="feat"&&item.system?.source?.rules!=="2014"&&((item.identifier??item.system?.identifier)==="psychic-defenses"||item.name?.trim().toLowerCase()==="psychic defenses"));}
export function psychicDefenseSave(actor,origin){return game.settings.get(ID,"psychicDefensesAutomation")===true&&psychicDefenses(actor)&&conditionSaveSource(actor,origin,["charmed","frightened"]);}
export function psychicDefenseDefaults(config,dialog,message){
 if(bridge&&game.modules?.get?.("automated-conditions-5e")?.active)return;
 const actor=config.subject?.actor??config.subject;if(!psychicDefenseSave(actor,message?.data?.system?.origin))return;
 config.advantage=true;
 for(const roll of config.rolls??[]){roll.options??={};const dis=!!(config.disadvantage||roll.options.disadvantage||roll.options.advantageMode===-1);Object.assign(roll.options,{advantage:true,disadvantage:dis,advantageMode:dis?0:1});}
 dialog.options??={};dialog.options.defaultButton=config.disadvantage||config.rolls?.[0]?.options?.disadvantage?"normal":"advantage";
}
export function registerPsychicDefenses(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return bridge;
 try{bridge=!!api.register({key:"rsaPsychicDefenses",scope:"universal",hook:"save",target:"subject",mode:"advantage",name:"Psychic Defenses",persistent:false,evaluate:s=>psychicDefenseSave(globalThis.fromUuidSync?.(s.actorUuid,{strict:false}),s.options?.originatingMessageId)});}catch(error){console.warn("Psychic Defenses integration",error);bridge=false;}return bridge;
}
Hooks.once("init",()=>game.settings.register(ID,"psychicDefensesAutomation",{name:"Aberrant: Psychic Defenses",hint:"Recommend Advantage on identified saves to avoid or end Charmed or Frightened, with normal cancellation. Psychic resistance remains native; unidentified sheet saves remain manual.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerPsychicDefenses(usageRules));
Hooks.once("ready",()=>{registerPsychicDefenses();Hooks.on("dnd5e.preRollSavingThrowV2",psychicDefenseDefaults);});
