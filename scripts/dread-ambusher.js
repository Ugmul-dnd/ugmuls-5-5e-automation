import {isRollAdjustmentLocked,createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",selected=new WeakMap(),pending=new WeakMap(),reserved=new Map(),enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
const enabled=()=>game.settings.get(ID,"dreadAmbusherAutomation")===true;
export const dreadFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&(key(i)==="dread-ambusher"||/^dread ambusher$/i.test(i.name?.trim()??""))&&i.system?.source?.rules!=="2014");
export function dreadContext(app){
 const activity=app.config?.subject,data=app.message?.data??{},card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app);
 // Player-owned pending damage can carry a reconstructed activity. Resolve
 // the recorded speaker first so feature and use lookups use the owned actor.
 const speaker=data.speaker??card?.speaker;
 const actor=(speaker?globalThis.ChatMessage?.getSpeakerActor?.(speaker):null)??card?.getAssociatedActor?.()??activity?.actor??activity?.item?.actor;
 const feature=dreadFeature(actor);
 const damage=values(feature?.system?.activities).find(a=>a.type==="damage"&&/^dreadful strike$/i.test(a.name??""));
 const reference=data.system?.origin??card?.system?.origin;
 const usage=typeof reference==="string"?game.messages.get(reference.replace(/^ChatMessage\./,"")):reference;
 const attackId=data.flags?.[ID]?.damageAttackId??card?.getFlag?.(ID,"damageAttackId");
 const attack=(attackId?game.messages.get(attackId):null)??(usage?.type==="attack"?usage:values(usage?.getAssociatedRolls?.("attack")).sort((a,b)=>b.timestamp-a.timestamp)[0]);
 return {activity,actor,feature,damage,attack};
}
export function dreadUsed(actor,app){return !!(reserved.has(actor?.uuid)&&reserved.get(actor.uuid).app!==app)||!!turn()&&actor?.getFlag?.(ID,"dreadfulStrikeTurn")===turn();}
export function dreadEligible(app){
 const {activity,actor,damage,attack}=dreadContext(app),remaining=Number(damage?.uses?.value??(Number(damage?.uses?.max)-Number(damage?.uses?.spent??0)));
 return enabled()&&actor?.isOwner&&activity?.type==="attack"&&activity.item?.type==="weapon"&&remaining>0&&!app.message?.data?.flags?.[ID]?.masteryGraze&&!isRollAdjustmentLocked(attack)&&values(attack?.system?.evaluatedTargets).filter(t=>t.isMiss===false).length===1;
}
export function selectDread(app,yes){
 selected.set(app,yes===true);
 // Native rebuild can redraw only formula rows. Update this dependent control
 // immediately instead of waiting for configuration to render again.
 globalThis.Ugmuls55eAutomationStalkersFlurry?.addFlurryChoice(app,yes===true);
}
export function addDreadChoice(app){
 const {actor,feature}=dreadContext(app);if(!feature||app.config?.subject?.type!=="attack"||app.config.subject.item?.type!=="weapon")return;
 globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"dreadful-strike",label:"Dreadful Strike",value:selected.get(app)===true,used:dreadUsed(actor,app),disabled:!dreadEligible(app),change:yes=>selectDread(app,yes)});
 globalThis.Ugmuls55eAutomationStalkersFlurry?.addFlurryChoice(app,selected.get(app)===true);
}
export function finalizeDread(app,rolls,{preview=false}={}){
 if(rolls.some(r=>r.options?.rsaDreadfulStrike))return rolls;
 const existing=pending.get(app);if(existing)return [...rolls,existing.roll];
 const {actor,feature,damage}=dreadContext(app);if(!selected.get(app)||!dreadEligible(app)||dreadUsed(actor,app))return rolls;
 const part=damage.damage?.parts?.[0];if(!part)return rolls;
 const formula=part.custom?.enabled?part.custom.formula:part.formula??`${part.number}d${part.denomination}${part.bonus?" + "+part.bonus:""}`;
 const roll=new CONFIG.Dice.DamageRoll(formula+"[Dreadful Strike]",actor.getRollData(),{type:"psychic",types:["psychic"],flavor:"Dreadful Strike",isCritical:damage.damage?.critical?.allow!==false&&rolls[0]?.options?.isCritical===true,critical:{...rolls[0]?.options?.critical,bonusDice:0,bonusDamage:""},rsaDreadfulStrike:true});
 if(!preview){const entry={actor,feature,damage,roll,turn:turn(),app};pending.set(app,entry);reserved.set(actor.uuid,entry);}
 return [...rolls,roll];
}
export async function commitDread(app,options){
 const entry=pending.get(app);if(!entry)return;let charged=false;const path=`system.activities.${entry.damage.id}.uses.spent`,spent=Number(entry.damage.uses.spent??0);
 try{
  if(!options?.dnd5e?.submitted)return;
  if(entry.turn!==turn()||!dreadEligible(app)||dreadUsed(entry.actor,app)||dreadContext(app).damage?.id!==entry.damage.id)throw Error("Dreadful Strike is no longer available. Reopen the damage prompt.");
  const flurry=globalThis.Ugmuls55eAutomationStalkersFlurry?.flurryFor(app);
  await entry.feature.update({[path]:spent+1});charged=true;
  if(entry.turn)await entry.actor.setFlag(ID,"dreadfulStrikeTurn",entry.turn);
  app.message.data.flags??={};app.message.data.flags[ID]={...app.message.data.flags[ID],dreadfulStrike:{actor:entry.actor.uuid,feature:entry.feature.uuid,turn:entry.turn,...(flurry?{flurry}:{})}};
  // Launch the save alongside the weapon dice, before pending damage waits
  // for Dice So Nice. Save effects still use their normal animation barrier.
  Promise.resolve(globalThis.Ugmuls55eAutomationStalkersFlurry?.beginFlurry(app)).catch(error=>{console.error("Mass Fear",error);ui.notifications.error(error.message);});
 }catch(error){if(charged)await entry.feature.update({[path]:spent});ui.notifications.error(error.message);throw error;}
 finally{pending.delete(app);if(reserved.get(entry.actor.uuid)===entry)reserved.delete(entry.actor.uuid);}
}
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function leapCombat(combat,changes={},ended=false){return enqueue(async()=>{
 if(!authority()||!ended&&!("turn"in changes||"round"in changes||"started"in changes))return;
 const current=!ended&&combat.started?`${combat.id}:${combat.round}:${combat.turn}`:null;
 const actors=new Map(values(combat.combatants).map(c=>c.actor).filter(Boolean).map(a=>[a.uuid,a]));
 for(const actor of actors.values()){
  const stale=values(actor.effects).filter(e=>{const f=e.getFlag?.(ID,"ambusherLeap");return f?.combat===combat.id&&f.turn!==current;});
  if(stale.length)await actor.deleteEmbeddedDocuments("ActiveEffect",stale.map(e=>e.id));
 }
 if(!current||!enabled())return;
 const actor=combat.combatant?.actor,feature=dreadFeature(actor);if(!feature)return;
 // Persist observed actors on Combat: reloading or revisiting initiative cannot
 // grant a second Leap. Seed earlier turns when first enabling mid-combat.
 const recorded=combat.getFlag(ID,"ambusherLeapSeen"),seen=new Set(recorded??(combat.round===1?values(combat.turns).slice(0,combat.turn).map(c=>c.actor?.uuid):values(combat.combatants).map(c=>c.actor?.uuid)));
 if(seen.has(actor.uuid))return;
 seen.add(actor.uuid);await combat.setFlag(ID,"ambusherLeapSeen",[...seen]);
 try{
  const existing=values(actor.effects).find(e=>!e.disabled&&e.active!==false&&e.name?.replace(/[’']/g,"").toLowerCase()==="ambushers leap");
  const data={name:"Ambusher's Leap",img:feature.img,type:"base",origin:feature.uuid,disabled:false,transfer:false,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:null,units:"seconds",expiry:null,expired:false},system:{changes:[{key:"system.attributes.movement.speed",value:"10",type:"add"}],origin:{actor:actor.uuid,item:feature.uuid}},flags:{dnd5e:{isTemporary:true},[ID]:{ambusherLeap:{combat:combat.id,turn:current}}}};
  if(existing)await existing.update(data);else await actor.createEmbeddedDocuments("ActiveEffect",[data]);
 }catch(error){seen.delete(actor.uuid);await combat.setFlag(ID,"ambusherLeapSeen",[...seen]);throw error;}
});}
export function refreshLeapMovement(effect){
 if(!effect?.getFlag?.(ID,"ambusherLeap"))return;
 const actor=effect.parent;if(!actor?.uuid)return;
 // Refresh after local effect preparation, including GM-originated changes.
 const refresh=()=>{
  const movement=globalThis.ui?.ARGON?.components?.movement;
  if(movement?.actor?.uuid!==actor.uuid||typeof movement.updateMovement!=="function")return;
  if(![".movement-spaces",".movement-current",".movement-max"].every(selector=>movement.element?.querySelector?.(selector)))return;
  try{movement.updateMovement();}catch(error){console.warn("Dread Ambusher | Could not refresh Argon movement",error);}
 };
 if(typeof globalThis.requestAnimationFrame==="function")globalThis.requestAnimationFrame(refresh);else setTimeout(refresh,0);
}
Hooks.once("init",()=>game.settings.register(ID,"dreadAmbusherAutomation",{name:"Dread Ambusher Assistance",hint:"Offer Dreadful Strike in weapon damage configuration, using native activity uses and scaling once per turn. Automatically grant Ambusher's Leap on the Ranger's first combat turn and remove it at turn end.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationDread={addDreadChoice,finalizeDread,commitDread};
 for(const hook of ["createActiveEffect","updateActiveEffect","deleteActiveEffect"])Hooks.on(hook,refreshLeapMovement);
 const report=error=>{console.error("Dread Ambusher",error);ui.notifications.error("Dread Ambusher: "+error.message);};
 Hooks.on("updateCombat",(combat,changes)=>leapCombat(combat,changes).catch(report));
 Hooks.on("deleteCombat",combat=>leapCombat(combat,{},true).catch(report));
});
