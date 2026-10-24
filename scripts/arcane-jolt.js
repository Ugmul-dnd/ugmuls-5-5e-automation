import {isRollAdjustmentLocked} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",selected=new WeakMap(),pending=new WeakMap(),reserved=new Map();
const identifier=item=>item?.identifier??item?.system?.identifier;
const turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
export const joltFeature=actor=>Array.from(actor?.items??[]).find(i=>i.type==="feat"&&(identifier(i)==="arcane-jolt"||/^arcane jolt$/i.test(i.name??"")));
const remaining=item=>Number(item?.system?.uses?.value??(Number(item?.system?.uses?.max)-Number(item?.system?.uses?.spent??0)))||0;
export function joltContext(app){
 const activity=app.config?.subject,attacker=activity?.actor??activity?.item?.actor;
 let actor=attacker,defender=false;
 const origin=attacker?.getFlag?.("dnd5e","summon.origin"),source=origin?globalThis.fromUuidSync?.(origin,{strict:false}):null;
 if(source&&identifier(source)==="steel-defender"){actor=source.actor;defender=true;}
 const feature=joltFeature(actor),damage=Array.from(feature?.system?.activities?.values?.()??feature?.system?.activities??[]).find(a=>a.type==="damage");
 const data=app.message?.data??{},card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),reference=data.system?.origin??card?.system?.origin;
 const usage=typeof reference==="string"?game.messages.get(reference.replace(/^ChatMessage\./,"")):reference;
 const attackId=data.flags?.[ID]?.damageAttackId??card?.getFlag?.(ID,"damageAttackId");
 const attack=(attackId?game.messages.get(attackId):null)??(usage?.type==="attack"?usage:Array.from(usage?.getAssociatedRolls?.("attack")??[]).sort((a,b)=>b.timestamp-a.timestamp)[0]);
 return {activity,attacker,actor,defender,feature,damage,attack};
}
export function joltUsed(actor,except){return !!(reserved.has(actor?.uuid)&&reserved.get(actor.uuid).app!==except)||!!turn()&&Array.from(actor?.effects??[]).some(e=>!e.disabled&&e.active!==false&&e.getFlag?.(ID,"arcaneJoltTurn")===turn());}
export function joltEligible(app){
 const {activity,actor,attacker,defender,feature,damage,attack}=joltContext(app),item=activity?.item;
 const magical=item?.system?.properties?.has?.("mgc")||Array.from(item?.system?.properties??[]).includes("mgc")||Number(item?.system?.magicalBonus)>0;
 return game.settings.get(ID,"arcaneJoltAutomation")===true&&activity?.type==="attack"&&actor?.isOwner&&attacker?.isOwner&&!!feature&&!!damage&&remaining(feature)>0&&(defender||item?.type==="weapon"&&magical)&&!app.message?.data?.flags?.[ID]?.masteryGraze&&!isRollAdjustmentLocked(attack)&&(attack?.system?.evaluatedTargets??[]).filter(t=>t.isMiss===false).length===1;
}
export function selectJolt(app,value){selected.set(app,value===true);}
export function addJoltChoice(app){const {feature,actor}=joltContext(app);if(!feature)return;globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"arcane-jolt",label:"Arcane Jolt — Destructive Energy",value:selected.get(app)===true,used:joltUsed(actor,app),disabled:!joltEligible(app),change:value=>selectJolt(app,value)});}
export function finalizeJolt(app,rolls,{preview=false}={}){
 if(rolls.some(r=>r.options?.rsaArcaneJolt))return rolls;
 const entry=pending.get(app);if(entry)return [...rolls,entry.roll];
 const {actor,feature,damage}=joltContext(app);if(!selected.get(app)||!joltEligible(app)||joltUsed(actor,app))return rolls;
 const part=damage.damage?.parts?.[0];if(!part)return rolls;
 const formula=part.custom?.enabled?part.custom.formula:part.formula??`${part.number}d${part.denomination}${part.bonus?" + "+part.bonus:""}`;
 const roll=new CONFIG.Dice.DamageRoll(formula+"[Arcane Jolt]",actor.getRollData(),{type:"force",types:["force"],flavor:"Arcane Jolt",isCritical:damage.damage?.critical?.allow!==false&&rolls[0]?.options?.isCritical===true,critical:{...rolls[0]?.options?.critical,bonusDice:0,bonusDamage:""},rsaArcaneJolt:true});
 if(!preview){const entry={actor,feature,roll,turn:turn(),app};pending.set(app,entry);reserved.set(actor.uuid,entry);}
 return [...rolls,roll];
}
export async function commitJolt(app,options){
 const entry=pending.get(app);if(!entry)return;let charged=false;
 try{
  if(!options?.dnd5e?.submitted)return;
  if(entry.turn!==turn()||!joltEligible(app)||joltUsed(entry.actor,app))throw Error("Arcane Jolt is no longer available. Reopen the damage prompt.");
  await entry.feature.update({"system.uses.spent":Number(entry.feature.system.uses.spent??0)+1});charged=true;
  if(entry.turn){const data={name:"Arcane Jolt - used",img:entry.feature.img,disabled:false,transfer:false,system:{changes:[]},flags:{[ID]:{arcaneJoltTurn:entry.turn,arcaneJoltCombat:game.combat.id}}};const resources=globalThis.Ugmuls55eAutomationResources;resources?.reuseMarker?await resources.reuseMarker(entry.actor,data,"arcaneJoltTurn"):await entry.actor.createEmbeddedDocuments("ActiveEffect",[data]);}
  app.message.data.flags??={};app.message.data.flags[ID]={...app.message.data.flags[ID],arcaneJolt:{actor:entry.actor.uuid,feature:entry.feature.uuid,turn:entry.turn}};
 }catch(error){if(charged)await entry.feature.update({"system.uses.spent":Math.max(0,Number(entry.feature.system.uses.spent??0)-1)});ui.notifications.error(error.message);throw error;}
 finally{pending.delete(app);if(reserved.get(entry.actor.uuid)===entry)reserved.delete(entry.actor.uuid);}
}
export async function resetJolt(combat,changes={}){
 if(!game.user.isGM||(game.users.activeGM&&game.users.activeGM.id!==game.user.id)||!("turn"in changes||"round"in changes||changes.started===false))return;
 const current=changes.started===false?null:turn(),actors=new Map([...Array.from(game.actors??[]),...Array.from(combat.combatants??[],c=>c.actor)].filter(Boolean).map(a=>[a.uuid,a]));
 for(const actor of actors.values()){const updates=Array.from(actor.effects??[]).filter(e=>!e.disabled&&e.getFlag?.(ID,"arcaneJoltCombat")===combat.id&&e.getFlag?.(ID,"arcaneJoltTurn")!==current).map(e=>({_id:e.id,disabled:true}));if(updates.length)await actor.updateEmbeddedDocuments("ActiveEffect",updates);}
}
Hooks.once("init",()=>game.settings.register(ID,"arcaneJoltAutomation",{name:"Arcane Jolt Assistance",hint:"Offer destructive Arcane Jolt in damage configuration after a magic-weapon hit or a linked Steel Defender hit. Spend the Artificer's native feature use and share one use per combat turn. Healing remains manual.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{globalThis.Ugmuls55eAutomationJolt={addJoltChoice,finalizeJolt,commitJolt};Hooks.on("updateCombat",(c,d)=>resetJolt(c,d).catch(console.error));Hooks.on("deleteCombat",c=>resetJolt(c,{started:false}).catch(console.error));});
