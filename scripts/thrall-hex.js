import {riderConcentration,riderTargets} from "./bonus-damage-riders.js";
const ID="ugmuls-5-5e-automation",pending=new WeakMap(),reserved=new Map();
function thrallDamageFormula(activity){const p=Array.from(activity.damage?.parts??[])[0];if(!p)throw Error("Create Thrall is missing its native bonus damage.");return p.custom?.enabled?p.custom.formula:(p.formula??String(p.number)+"d"+p.denomination+(p.bonus?" + "+p.bonus:""));}
const identifier=item=>item?.identifier??item?.system?.identifier;
const turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
export function thrallContext(app){
 const activity=app.config?.subject,beast=activity?.actor??activity?.item?.actor;
 const origin=beast?.getFlag?.("dnd5e","summon.origin"),source=origin?globalThis.fromUuidSync?.(origin,{strict:false}):null;
 if(identifier(source)!=="summon-aberration")return null;
 const warlock=source.actor,feature=Array.from(warlock?.items?.values?.()??warlock?.items??[]).find(i=>i.type==="feat"&&identifier(i)==="create-thrall"&&i.system?.source?.rules!=="2014");
 const targets=riderTargets(app),mark=warlock?.getFlag?.(ID,"damageRiders.hex"),concentration=riderConcentration(warlock,"hex");
 if(game.settings.get(ID,"createThrallAutomation")!==true||activity?.type!=="attack"||!beast?.isOwner||!feature||targets.length!==1||!concentration||mark?.concentration!==concentration.uuid||mark.token!==targets[0].token||app.message?.data?.flags?.[ID]?.masteryGraze)return null;
 const data=app.message?.data??{},reference=data.system?.origin;
 const usage=typeof reference==="string"?game.messages?.get(reference.replace(/^ChatMessage\./,"")):reference;
 const attackId=data.flags?.[ID]?.damageAttackId;
 const attack=(attackId?game.messages?.get(attackId):null)??(usage?.type==="attack"?usage:Array.from(usage?.getAssociatedRolls?.("attack")??[]).sort((a,b)=>b.timestamp-a.timestamp)[0]);
 const results=Array.from(attack?.system?.evaluatedTargets??[]);
 if(results.length&& !results.some(t=>t.isMiss===false&&(t.token?.uuid??t.token??t.document?.uuid)===targets[0].token))return null;
 return {beast,warlock,feature,target:targets[0].token,concentration:concentration.uuid};
}
export function thrallUsed(beast,app){
 return !!(reserved.has(beast?.uuid)&&reserved.get(beast.uuid).app!==app)||!!turn()&&beast?.getFlag?.(ID,"thrallHexTurn")===turn();
}
export function finalizeThrall(app,rolls,{preview=false}={}){
 if(rolls.some(r=>r.options?.rsaThrallHex))return rolls;
 const existing=pending.get(app);if(existing)return [...rolls,existing.roll];
 const context=thrallContext(app);if(!context||thrallUsed(context.beast,app))return rolls;
 // Preserve the installed Create Thrall — Hex activity's critical policy.
 const damage=Array.from(context.feature.system?.activities?.values?.()??context.feature.system?.activities??[]).find(a=>a.type==="damage");
 if(!damage)return rolls;
 const roll=new CONFIG.Dice.DamageRoll(thrallDamageFormula(damage),context.warlock.getRollData?.()??{}, {type:"psychic",types:["psychic"],flavor:"Create Thrall — Hex",isCritical:damage?.damage?.critical?.allow===true&&rolls[0]?.options?.isCritical===true,critical:{...rolls[0]?.options?.critical,bonusDice:0,bonusDamage:""},rsaThrallHex:true});
 if(!preview){const entry={...context,roll,turn:turn(),app};pending.set(app,entry);reserved.set(context.beast.uuid,entry);}
 return [...rolls,roll];
}
export async function commitThrall(app,options){
 const entry=pending.get(app);if(!entry)return;
 try{
  if(!options?.dnd5e?.submitted)return;
  const current=thrallContext(app);
  if(entry.turn!==turn()||!current||current.warlock.uuid!==entry.warlock.uuid||current.target!==entry.target||current.concentration!==entry.concentration||thrallUsed(entry.beast,app))throw Error("Create Thrall — Hex is no longer available. Reopen the damage prompt.");
  if(entry.turn)await entry.beast.setFlag(ID,"thrallHexTurn",entry.turn);
  app.message.data.flags??={};app.message.data.flags[ID]={...app.message.data.flags[ID],thrallHex:{warlock:entry.warlock.uuid,beast:entry.beast.uuid,target:entry.target,turn:entry.turn}};
 }finally{pending.delete(app);if(reserved.get(entry.beast.uuid)===entry)reserved.delete(entry.beast.uuid);}
}
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationThrallHex={finalizeThrall,commitThrall};
 // The dialog owns reservation/commit. Keep eligible fast-forward attacks on
 // that same path so they cannot silently omit the bonus or bypass its limit.
 Hooks.on("dnd5e.preRollDamageV2",(config,dialog,message)=>{
  const app={config,message},context=thrallContext(app);
  if(!context||thrallUsed(context.beast,app))return;
  Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog("damage",dialog));
  dialog.configure=true;
 });
});
