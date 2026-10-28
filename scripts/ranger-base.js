import {riderConcentration} from "./bonus-damage-riders.js";
const ID="ugmuls-5-5e-automation",values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier,wrapped=new WeakSet();let bridge=false;
const enabled=k=>game.settings.get(ID,k)===true;
export const rangerFeature=(actor,name)=>values(actor?.items).find(i=>i.type==="feat"&&key(i)===name&&i.system?.source?.rules!=="2014");
export function relentlessProtected(actor,effect){return enabled("relentlessHunterAutomation")&&!!rangerFeature(actor,"relentless-hunter")&&!!effect?.uuid&&riderConcentration(actor,"hunters-mark")?.uuid===effect.uuid;}
export function installRelentlessHunter(Type){
 const proto=Type?.prototype;if(!proto||wrapped.has(proto)||typeof proto.challengeConcentration!=="function")return;wrapped.add(proto);const original=proto.challengeConcentration;
 proto.challengeConcentration=function(...args){const effects=values(this.concentration?.effects);if(effects.length&&effects.every(e=>relentlessProtected(this,e)))return Promise.resolve(null);return original.apply(this,args);};
}
export function preciseMatches(actor,target){
 if(!enabled("preciseHunterAutomation")||!rangerFeature(actor,"precise-hunter")||!target)return false;
 const mark=actor.getFlag?.(ID,"damageRiders.hunters-mark"),concentration=riderConcentration(actor,"hunters-mark");
 if(!concentration||!mark?.token||mark.concentration!==concentration.uuid)return false;
 const doc=target.document??target;if(doc.uuid===mark.token)return true;
 // Actor-only rule contexts still resolve the actual currently marked token.
 return doc.documentName==="Actor"&&globalThis.fromUuidSync?.(mark.token,{strict:false})?.actor?.uuid===doc.uuid;
}
export function preciseDefaults(config,dialog,message){
 if(bridge&&game.modules?.get?.("automated-conditions-5e")?.active||config.subject?.type!=="attack")return;
 const actor=config.subject.actor??config.subject.item?.actor,targets=message?.data?.system?.targets??values(game.user.targets).map(t=>({token:(t.document??t).uuid}));
 if(targets.length!==1||!preciseMatches(actor,globalThis.fromUuidSync?.(targets[0].token,{strict:false})))return;
 config.advantage=true;
 for(const roll of config.rolls??[]){roll.options??={};const dis=!!(config.disadvantage||roll.options.disadvantage||roll.options.advantageMode===-1);Object.assign(roll.options,{advantage:true,disadvantage:dis,advantageMode:dis?0:1});}
 dialog.options??={};dialog.options.defaultButton=config.disadvantage||config.rolls?.[0]?.options.disadvantage?"normal":"advantage";
}
export function registerPreciseHunter(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return bridge;
 try{bridge=!!api.register({key:"rsaPreciseHunter",scope:"universal",hook:"attack",target:"subject",mode:"advantage",name:"Precise Hunter",persistent:false,evaluate:s=>preciseMatches(globalThis.fromUuidSync?.(s.actorUuid,{strict:false}),globalThis.fromUuidSync?.(s.opponentUuid??s.opponentActorUuid,{strict:false}))});}catch(error){console.warn("Precise Hunter integration",error);bridge=false;}return bridge;
}
Hooks.once("init",()=>{
 for(const[k,name,hint]of [["relentlessHunterAutomation","Relentless Hunter Assistance","Automatically maintain Hunter's Mark through damage-triggered concentration checks without a roll or prompt. Other concentration-ending causes remain unchanged."],["preciseHunterAutomation","Precise Hunter Assistance","Recommend Advantage on attacks against this Ranger's currently marked creature while Hunter's Mark concentration is active."],["foeSlayerAutomation","Foe Slayer Assistance","Upgrade the integrated Hunter's Mark damage rider to d10 when the 2024 Foe Slayer feature is owned, retaining critical scaling."]])game.settings.register(ID,k,{name,hint,scope:"world",config:true,type:Boolean,default:true});
});
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerPreciseHunter(usageRules));
Hooks.once("ready",()=>{globalThis.Ugmuls55eAutomationRanger={relentlessProtected};installRelentlessHunter(CONFIG.Actor?.documentClass);registerPreciseHunter();Hooks.on("dnd5e.preRollAttackV2",preciseDefaults);});
