import {riderConcentration,riderTargets,hunterMarkDie} from "./bonus-damage-riders.js";
const ID="ugmuls-5-5e-automation",pending=new WeakMap(),reserved=new Map();
const identifier=item=>item?.identifier??item?.system?.identifier;
const turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
export function furyContext(app){
 const activity=app.config?.subject,beast=activity?.actor??activity?.item?.actor;
 const origin=beast?.getFlag?.("dnd5e","summon.origin"),source=origin?globalThis.fromUuidSync?.(origin,{strict:false}):null;
 if(identifier(source)!=="primal-companion")return null;
 const ranger=source.actor,feature=Array.from(ranger?.items?.values?.()??ranger?.items??[]).find(i=>i.type==="feat"&&identifier(i)==="bestial-fury"&&i.system?.source?.rules!=="2014");
 const targets=riderTargets(app),mark=ranger?.getFlag?.(ID,"damageRiders.hunters-mark"),concentration=riderConcentration(ranger,"hunters-mark");
 if(game.settings.get(ID,"bestialFuryAutomation")===false||activity?.type!=="attack"||!beast?.isOwner||!feature||targets.length!==1||!concentration||mark?.concentration!==concentration.uuid||mark.token!==targets[0].token||app.message?.data?.flags?.[ID]?.masteryGraze)return null;
 const data=app.message?.data??{},reference=data.system?.origin;
 const usage=typeof reference==="string"?game.messages?.get(reference.replace(/^ChatMessage\./,"")):reference;
 const attackId=data.flags?.[ID]?.damageAttackId;
 const attack=(attackId?game.messages?.get(attackId):null)??(usage?.type==="attack"?usage:Array.from(usage?.getAssociatedRolls?.("attack")??[]).sort((a,b)=>b.timestamp-a.timestamp)[0]);
 const results=Array.from(attack?.system?.evaluatedTargets??[]);
 if(results.length&& !results.some(t=>t.isMiss===false&&(t.token?.uuid??t.token??t.document?.uuid)===targets[0].token))return null;
 return {beast,ranger,feature,target:targets[0].token,concentration:concentration.uuid};
}
export function furyUsed(beast,app){
 return !!(reserved.has(beast?.uuid)&&reserved.get(beast.uuid).app!==app)||!!turn()&&beast?.getFlag?.(ID,"bestialFuryTurn")===turn();
}
export function finalizeFury(app,rolls,{preview=false}={}){
 if(rolls.some(r=>r.options?.rsaBestialFury))return rolls;
 const existing=pending.get(app);if(existing)return [...rolls,existing.roll];
 const context=furyContext(app);if(!context||furyUsed(context.beast,app))return rolls;
 // Preserve the installed Bestial Fury activity's critical policy.
 const damage=Array.from(context.feature.system?.activities?.values?.()??context.feature.system?.activities??[]).find(a=>a.type==="damage");
 const roll=new CONFIG.Dice.DamageRoll(`${hunterMarkDie(context.ranger)}[Bestial Fury]`,{}, {type:"force",types:["force"],flavor:"Bestial Fury",isCritical:damage?.damage?.critical?.allow===true&&rolls[0]?.options?.isCritical===true,critical:{...rolls[0]?.options?.critical,bonusDice:0,bonusDamage:""},rsaBestialFury:true});
 if(!preview){const entry={...context,roll,turn:turn(),app};pending.set(app,entry);reserved.set(context.beast.uuid,entry);}
 return [...rolls,roll];
}
export async function commitFury(app,options){
 const entry=pending.get(app);if(!entry)return;
 try{
  if(!options?.dnd5e?.submitted)return;
  const current=furyContext(app);
  if(entry.turn!==turn()||!current||current.ranger.uuid!==entry.ranger.uuid||current.target!==entry.target||current.concentration!==entry.concentration||furyUsed(entry.beast,app))throw Error("Bestial Fury is no longer available. Reopen the damage prompt.");
  if(entry.turn)await entry.beast.setFlag(ID,"bestialFuryTurn",entry.turn);
  app.message.data.flags??={};app.message.data.flags[ID]={...app.message.data.flags[ID],bestialFury:{ranger:entry.ranger.uuid,beast:entry.beast.uuid,target:entry.target,turn:entry.turn}};
 }finally{pending.delete(app);if(reserved.get(entry.beast.uuid)===entry)reserved.delete(entry.beast.uuid);}
}
Hooks.once("init",()=>game.settings.register(ID,"bestialFuryAutomation",{name:"Bestial Fury Assistance",hint:"Automatically add the linked Primal Companion's first-hit bonus against its Ranger's active Hunter's Mark target. Track the companion separately once per combat turn; commands and attacks remain manual.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationBestialFury={finalizeFury,commitFury};
 // The dialog owns reservation/commit. Keep eligible fast-forward attacks on
 // that same path so they cannot silently omit the bonus or bypass its limit.
 Hooks.on("dnd5e.preRollDamageV2",(config,dialog,message)=>{
  const app={config,message},context=furyContext(app);
  if(!context||furyUsed(context.beast,app))return;
  Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog("damage",dialog));
  dialog.configure=true;
 });
});
