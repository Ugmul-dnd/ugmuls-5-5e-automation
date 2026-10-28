import {dreadContext} from "./dread-ambusher.js";
import {isRollAdjustmentLocked,createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",selected=new WeakMap(),pending=new WeakMap(),reserved=new Map(),commitQueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
const enabled=()=>game.settings.get(ID,"feyDreadfulStrikesAutomation")===true;
export const feyStrikesFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&(key(i)==="dreadful-strikes"||/^dreadful strikes$/i.test(i.name?.trim()??"")));
export function feyStrikeDie(actor){
 const ranger=values(actor?.items).find(i=>i.type==="class"&&key(i)==="ranger");
 const level=Number(ranger?.system?.levels??actor?.classes?.ranger?.system?.levels??0);
 return level>=11?"1d6":"1d4";
}
export function feyStrikesContext(app){
 const {activity,actor,attack}=dreadContext(app),feature=feyStrikesFeature(actor),data=app.message?.data??{},card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app);
 const targets=data.system?.targets?.length?data.system.targets:card?.system?.targets?.length?card.system.targets:attack?.system?.targets??[];
 const descriptor=targets.length===1?targets[0]:null,target=descriptor?.token?globalThis.fromUuidSync?.(descriptor.token,{strict:false}):null;
 const hit=!!target?.actor&&values(attack?.system?.evaluatedTargets).some(t=>t.token===target.uuid&&t.isMiss===false);
 const damage=values(feature?.system?.activities).find(a=>a.type==="damage"&&a.damage?.parts?.length);
 return {activity,actor,attack,feature,damage,target,hit};
}
const reservationKey=c=>JSON.stringify([c.actor?.uuid,c.target?.actor?.uuid,turn()]);
export function feyStrikesUsed(c,app){
 if(!c.actor||!c.target?.actor)return false;
 const reservation=reserved.get(reservationKey(c));if(reservation&&reservation.app!==app)return true;
 const prior=c.actor.getFlag?.(ID,"feyDreadfulStrikesTurn");
 return !!turn()&&prior?.turn===turn()&&(prior.targets??[]).includes(c.target.actor.uuid);
}
export function feyStrikesEligible(app){
 const c=feyStrikesContext(app);
 return enabled()&&c.actor?.isOwner&&!!c.feature&&!!c.damage&&c.activity?.type==="attack"&&c.activity.item?.type==="weapon"&&c.hit&&!app.message?.data?.flags?.[ID]?.masteryGraze&&!isRollAdjustmentLocked(c.attack);
}
export function selectFeyStrikes(app,yes){selected.set(app,yes===true);}
export function addFeyStrikesChoice(app){
 const c=feyStrikesContext(app);if(!enabled()||!c.feature||c.activity?.type!=="attack"||c.activity.item?.type!=="weapon")return;
 const used=feyStrikesUsed(c,app),eligible=feyStrikesEligible(app);
 const row=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"fey-dreadful-strikes",label:"Dreadful Strikes",value:selected.get(app)!==false,disabled:!eligible,used,change:yes=>selectFeyStrikes(app,yes)});
 const select=row?.querySelector?.("select");if(select){select.disabled=!eligible||used;select.value=eligible&&!used&&selected.get(app)!==false?"yes":"no";}
 row?.classList?.toggle("rsa-savage-used",!eligible||used);
}
export function finalizeFeyStrikes(app,rolls,{preview=false}={}){
 if(rolls.some(r=>r.options?.rsaFeyDreadfulStrikes))return rolls;
 const entry=pending.get(app);if(entry)return [...rolls,entry.roll];
 if(selected.get(app)===false||!feyStrikesEligible(app))return rolls;
 const c=feyStrikesContext(app);if(feyStrikesUsed(c,app))return rolls;
 const roll=new CONFIG.Dice.DamageRoll(`${feyStrikeDie(c.actor)}[Dreadful Strikes]`,{}, {type:"psychic",types:["psychic"],flavor:"Dreadful Strikes",isCritical:c.damage.damage?.critical?.allow!==false&&rolls[0]?.options?.isCritical===true,critical:{...rolls[0]?.options?.critical,bonusDice:0,bonusDamage:""},rsaFeyDreadfulStrikes:true});
 if(!preview){const entry={...c,app,roll,turn:turn(),reservation:reservationKey(c)};pending.set(app,entry);reserved.set(entry.reservation,entry);}
 return [...rolls,roll];
}
export function commitFeyStrikes(app,options){return commitQueue(async()=>{
 const entry=pending.get(app);if(!entry)return;
 try{
  if(!options?.dnd5e?.submitted)return;
  const c=feyStrikesContext(app);
  if(entry.turn!==turn()||!feyStrikesEligible(app)||c.actor.uuid!==entry.actor.uuid||c.feature.uuid!==entry.feature.uuid||c.target.uuid!==entry.target.uuid||feyStrikesUsed(c,app))throw Error("Dreadful Strikes is no longer available for this target. Reopen the damage prompt.");
  if(entry.turn){
   const prior=c.actor.getFlag?.(ID,"feyDreadfulStrikesTurn"),targets=prior?.turn===entry.turn?prior.targets??[]:[];
   await c.actor.setFlag(ID,"feyDreadfulStrikesTurn",{turn:entry.turn,targets:[...new Set([...targets,c.target.actor.uuid])]});
  }
  app.message.data.flags??={};app.message.data.flags[ID]={...app.message.data.flags[ID],feyDreadfulStrikes:{actor:c.actor.uuid,feature:c.feature.uuid,target:c.target.uuid,creature:c.target.actor.uuid,turn:entry.turn}};
 }catch(error){ui.notifications.error(error.message);throw error;}
 finally{pending.delete(app);if(reserved.get(entry.reservation)===entry)reserved.delete(entry.reservation);}
});}
Hooks.once("init",()=>game.settings.register(ID,"feyDreadfulStrikesAutomation",{name:"Fey Wanderer: Dreadful Strikes",hint:"Offer optional Psychic damage in weapon damage configuration (default Yes). Each creature can receive it once per turn from this Ranger; different creatures remain eligible. Increase 1d4 to 1d6 at Ranger level 11 and support critical hits.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{globalThis.Ugmuls55eAutomationFeyStrikes={addFeyStrikesChoice,finalizeFeyStrikes,commitFeyStrikes};});
