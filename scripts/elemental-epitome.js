import {stunningTarget} from "./stunning-strike.js";
const ID="ugmuls-5-5e-automation",choices=new WeakMap(),pending=new WeakMap(),reserved=new Map();
export const values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier;
export const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
export const epitomeEnabled=()=>game.settings.get(ID,"elementalEpitomeAutomation")===true;
export const epitomeFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="elemental-epitome"&&i.system?.source?.rules!=="2014");
const live=e=>e&&!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
export function epitomeActive(actor,excludedEffect=null){
 if(!epitomeEnabled()||!epitomeFeature(actor)||["incapacitated","unconscious","stunned","paralyzed","petrified"].some(s=>actor?.statuses?.has(s)))return false;
 const feature=values(actor?.items).find(i=>key(i)==="elemental-attunement"),use=values(feature?.system?.activities).find(a=>a.type==="enchant");
 if(!feature||!use)return false;
 // Native self-enchantments live on the enchanted item, not necessarily actor.effects.
 const applicable=e=>e!==excludedEffect&&(!excludedEffect?.uuid||e.uuid!==excludedEffect.uuid)&&live(e);
 const applied=values(use.appliedEnchantments);if(applied.some(applicable))return true;
 return values(feature.effects).some(e=>["nYxy4BAjf1emFqtQ","hbh7eQTy6duUJuBw"].includes(e.id)&&applicable(e));
}
export function epitomeResistanceActivity(a){return epitomeEnabled()&&a?.item?.type==="feat"&&key(a.item)==="elemental-epitome"&&(a.id==="qE2UY5XJjYB5wZ1t"||a.name==="Damage Resistance");}
export const epitomeStamp=()=>game.combat?.started?game.combat.id+":"+game.combat.round+":"+game.combat.turn:null;
export function empoweredContext(app){
 const activity=app.config?.subject,actor=activity?.actor??activity?.item?.actor,feature=epitomeFeature(actor),name=activity?.name??activity?.item?.name??"";
 const unarmed=activity?.attack?.type?.classification==="unarmed"||activity?.item?.system?.type?.value==="unarmed"||/^(unarmed|empowered|elemental) strikes?$/i.test(name)||["unarmed-strike","empowered-strikes"].includes(key(activity?.item));
 if(!actor?.isOwner||!epitomeActive(actor)||activity?.type!=="attack"||!unarmed||!stunningTarget(app)||app.message?.data?.flags?.[ID]?.masteryGraze)return null;
 if(game.combat?.started&&game.combat.combatant?.actor?.uuid!==actor.uuid)return null;
 return {actor,feature,stamp:epitomeStamp()};
}
export function empoweredUsed(c,app){return !!c?.stamp&&(flag(c.actor,"epitomeEmpoweredTurn")===c.stamp||reserved.has(c.actor.uuid)&&reserved.get(c.actor.uuid).app!==app);}
export function selectEmpowered(app,yes){choices.set(app,yes===true);}
export function addEmpoweredChoice(app){const c=empoweredContext(app);if(!c)return;globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"epitomeEmpowered",label:"Empowered Strikes (Elemental Epitome)",value:choices.get(app)===true,used:empoweredUsed(c,app),change:yes=>selectEmpowered(app,yes)});}
export function finalizeEmpowered(app,rolls,{preview=false}={}){
 if(rolls.some(r=>r.options?.rsaEpitomeEmpowered))return rolls;
 const entry=pending.get(app);if(entry)return [...rolls,entry.roll];
 const c=empoweredContext(app),base=rolls[0];if(!choices.get(app)||!c||empoweredUsed(c,app)||!base?.options?.type)return rolls;
 const native=values(c.feature.system?.activities).find(a=>a.id==="a5WGe405dvalmJKa"||a.name==="Empowered Strike"),formula=native?.damage?.parts?.[0]?.custom?.formula;
 if(!formula)throw Error("Elemental Epitome needs its native Empowered Strike damage formula.");
 const roll=new CONFIG.Dice.DamageRoll(formula+"[Elemental Epitome]",c.actor.getRollData?.()??{},{type:base.options.type,types:[base.options.type],flavor:"Empowered Strikes — Elemental Epitome",isCritical:false,critical:{...base.options.critical,bonusDice:0,bonusDamage:""},rsaEpitomeEmpowered:true});
 if(!preview){const entry={...c,app,roll};pending.set(app,entry);reserved.set(c.actor.uuid,entry);}return [...rolls,roll];
}
export async function commitEmpowered(app,options){
 const entry=pending.get(app);if(!entry)return;
 try{if(!options?.dnd5e?.submitted)return;const c=empoweredContext(app);if(!c||c.stamp!==entry.stamp||empoweredUsed(c,app))throw Error("Elemental Epitome is no longer available on this turn.");
  if(c.stamp)await c.actor.setFlag(ID,"epitomeEmpoweredTurn",c.stamp);
  app.message.data.flags??={};app.message.data.flags[ID]={...app.message.data.flags[ID],epitomeEmpowered:{actor:c.actor.uuid,turn:c.stamp}};
 }finally{pending.delete(app);if(reserved.get(entry.actor.uuid)===entry)reserved.delete(entry.actor.uuid);}
}
Hooks.once("init",()=>game.settings.register(ID,"elementalEpitomeAutomation",{name:"Elemental Epitome Assistance",hint:"While Elemental Attunement is active, choose one resistance, create a turn-long Destructive Stride aura with Step of the Wind, and offer a once-on-your-turn Empowered Strikes damage die.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{globalThis.Ugmuls55eAutomationEpitome={epitomeResistanceActivity,addEmpoweredChoice,finalizeEmpowered,commitEmpowered};});
