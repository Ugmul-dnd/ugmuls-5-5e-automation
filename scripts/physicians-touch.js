import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
export const physicianFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="physicians-touch"&&i.system?.source?.rules!=="2014");
export function physicianHarmContext(card){
 if(card?.type!=="damage"||flag(card,"pendingDamage")||!card.rolls?.some(r=>r._evaluated)||flag(card,"physicianPoisonProcessed"))return null;
 const activity=card.getAssociatedActivity?.({scaled:true}),item=activity?.item,actor=card.getAssociatedActor?.()??activity?.actor,physician=physicianFeature(actor);
 const harm=activity?.type==="damage"&&(key(item)==="hand-of-harm"||key(item)==="physicians-touch"&&(activity.id==="BW0d7xkRsDuv075E"||/^hand of harm$/i.test(activity.name??"")));
 return physician&&harm?{actor,physician}:null;
}
export function physicianPoisonMarker(actor){return{source:actor.uuid,applied:game.combat?.started?{combat:game.combat.id,round:game.combat.round,turn:game.combat.turn}:null};}
export function applyPhysicianHarm(card){return enqueue(async()=>{
 if(!authority())return;const context=physicianHarmContext(card);if(!context)return;
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 if(!physicianHarmContext(card))return;
 const {actor,physician}=context,native=values(physician.effects).find(e=>e.id==="dIu3zagzFThdumuj"||e.statuses?.has?.("poisoned")||values(e.statuses).includes("poisoned"));
 const data=native?.toObject?.()??{_id:"dIu3zagzFThdumuj",name:"Physician’s Touch — Poisoned",img:"systems/dnd5e/icons/svg/statuses/poisoned.svg",type:"base",system:{changes:[]},statuses:["poisoned"]};
 data.disabled=false;data.transfer=false;data.statuses=Array.from(new Set([...values(data.statuses),"poisoned"]));
 const effect=new CONFIG.ActiveEffect.documentClass(data,{parent:physician}),marker=physicianPoisonMarker(actor),tray=document.createElement("effect-application");tray.chatMessage=card;
 const prepare=tray._prepareEffectData;
 tray._prepareEffectData=async function(effect,target){
  const operation=await prepare.call(this,effect,target);operation.data.duration={value:null,units:"seconds",expiry:null,expired:false};operation.data.start=CONFIG.ActiveEffect.documentClass.getEffectStart();
  operation.data.system??={};operation.data.system.origin={...operation.data.system.origin,actor:actor.uuid,item:physician.uuid,message:card.uuid};
  operation.data.flags??={};operation.data.flags.dnd5e={...operation.data.flags.dnd5e,isTemporary:true};operation.data.flags[ID]={...operation.data.flags[ID],physicianPoison:marker};return operation;
 };
 for(const descriptor of card.system?.targets??[]){const target=resolve(descriptor.token)?.actor??resolve(descriptor.actor);if(target)await globalThis.Ugmuls55eAutomationEffectUndo.apply(card,card,effect,target,tray);}
 await card.setFlag(ID,"physicianPoisonProcessed",true);await card.setFlag(ID,"outcomeEffectsApplied",true);
 globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
});}
export async function expirePhysicianPoison(combat,changes={},ending=false){
 if(!authority()||!ending&&!("turn"in changes||"round"in changes))return;
 const previous=combat.previous,source=previous?.combatantId?combat.combatants?.get?.(previous.combatantId)?.actor:null;
 if(!ending&&(!source||previous.round===combat.round&&previous.turn===combat.turn))return;
 const actors=new Map([...values(game.actors),...values(globalThis.canvas?.scene?.tokens).map(t=>t.actor),...values(combat.combatants).map(c=>c.actor)].filter(Boolean).map(a=>[a.uuid,a]));
 for(const actor of actors.values()){
  const ids=values(actor.effects).filter(effect=>{const m=flag(effect,"physicianPoison"),a=m?.applied;if(a?.combat!==combat.id)return false;if(ending)return true;return m.source===source.uuid&&(previous.round>a.round||previous.round===a.round&&previous.turn>a.turn);}).map(e=>e.id);
  if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
 }
}
function report(error){console.error("Physician’s Touch",error);ui.notifications.error(error.message);}
Hooks.once("ready",()=>{
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{if(physicianHarmContext(card))applyPhysicianHarm(card).catch(report);});
 Hooks.on("updateCombat",(c,d)=>expirePhysicianPoison(c,d).catch(report));Hooks.on("deleteCombat",c=>expirePhysicianPoison(c,{},true).catch(report));
});

// Apply the critical preferences to native cards as well as our helper rolls.
export function postDamageCriticalDefaults(config,dialog,message){
 const activity=config.subject,item=activity?.item,id=key(item);
 const harm=activity?.type==="damage"&&(id==="hand-of-harm"||id==="physicians-touch"&&(activity.id==="BW0d7xkRsDuv075E"||/^hand of harm$/i.test(activity.name??"")));
 const psi=activity?.type==="damage"&&id==="psionic-power"&&(activity.id==="FxJXB4BPlBnJLF7q"||activity.name==="Psionic Strike");if(!harm&&!psi)return;
 const allow=game.settings.get(ID,harm?"handOfHarmCriticalDamage":"psionicStrikeCriticalDamage")===true;
 config.critical={...config.critical,allow};
 const meta=message?.data?.flags?.[ID]?.[harm?"handOfHarm":"psionicStrike"],attack=meta?.attack?game.messages.get(meta.attack):null;
 if(!allow||attack){const critical=allow&&attack?.rolls?.[0]?.isCritical===true;config.isCritical=critical;for(const roll of config.rolls??[]){roll.options??={};roll.options.isCritical=critical;}dialog.options={...dialog.options,defaultButton:critical?"critical":"normal"};}
}
Hooks.once("ready",()=>Hooks.on("dnd5e.preRollDamageV2",postDamageCriticalDefaults));
