import {getRegionSpellTable} from "./region-library.js";
const ID="ugmuls-5-5e-automation",running=new Set();
const authority=()=>game.user?.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
function usageOf(card){
 if(card?.type==="usage")return card;
 const ref=card?.system?.origin;return typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
}
export function isSleetStormSave(card){
 if(card?.type!=="usage")return false;
 const activity=card?.getAssociatedActivity?.();
 const key=activity?.item?.identifier??activity?.item?.system?.identifier;
 const name=key==="sleet-storm"?"Sleet Storm":key==="yolandes-regal-presence"?"Yolande's Regal Presence":null;
 return activity?.type==="save"&&!!name&&getRegionSpellTable()[name]?.enabled!==false&&!card.getFlag?.(ID,"regionPlacementOnly")&&
  !card.getFlag?.(ID,"targetsConfirmationPending")&&!card.getFlag?.(ID,"targetsConfirmationCanceled");
}
export async function applySleetStorm(card,{manual=false}={}){
 const usage=usageOf(card);
 if(!authority()||!isSleetStormSave(usage)||running.has(usage.id))return;
 if(!manual&&(game.settings.get(ID,"autoApplySavedEffects")!==true||usage.getFlag(ID,"manualDamageWorkflow")))return;
 const done=new Set(usage.getFlag(ID,"sleetStormResolvedTargets")??[]);
 const breaksConcentration=(usage.getAssociatedActivity?.()?.item?.identifier??usage.getAssociatedActivity?.()?.item?.system?.identifier)==="sleet-storm";
 const failed=Array.from(usage.system.targets??[]).filter(target=>usage.system.outcomes?.get(target.token)==="failure"&&!done.has(target.token));
 if(!failed.length)return;
 if(!manual&&!breaksConcentration&&game.settings.get(ID,"autoApplyCardDamage")===true){
  const damages=Array.from(usage.getAssociatedRolls?.("damage")??[]);
  if(!damages.length||damages.some(damage=>failed.some(target=>damage.system.targets?.some(t=>t.token===target.token)&&!(damage.getFlag(ID,"automaticDamageTargets")??[]).includes(target.token))))return;
 }
 running.add(usage.id);
 try{
  // Capture concentration before awaiting dice, so a later cast cannot be lost.
  const recipients=await Promise.all(failed.map(async target=>{
   const token=await fromUuid(target.token),actor=token?.actor;
   return {target,actor,concentrations:breaksConcentration?Array.from(actor?.concentration?.effects??[]):[]};
  }));
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(usage);
  if(!isSleetStormSave(usage)||!manual&&(game.settings.get(ID,"autoApplySavedEffects")!==true||usage.getFlag(ID,"manualDamageWorkflow")))return;
  for(const {target,actor,concentrations} of recipients){
   if(!actor||!usage.system.targets?.some(t=>t.token===target.token)||usage.system.outcomes?.get(target.token)!=="failure")continue;
   if(!actor.statuses?.has("prone")){
    const undo=globalThis.Ugmuls55eAutomationEffectUndo;
    if(!undo?.applyConditionWithUndo)throw Error("Condition application is unavailable.");
    await undo.applyConditionWithUndo(usage,actor,"prone");
   }
   // Prone persists until the creature stands; it is not a concentration-dependent
   // spell effect and must survive leaving the Region or ending the storm.
   for(const concentration of concentrations)if(actor.effects.get(concentration.id)===concentration)await actor.endConcentration(concentration);
   done.add(target.token);await usage.setFlag(ID,"sleetStormResolvedTargets",[...done]);
   if(!usage.getFlag(ID,"outcomeEffectsApplied"))await usage.setFlag(ID,"outcomeEffectsApplied",true);
  }
 }finally{running.delete(usage.id);}
}
export function renderSleetStorm(message,html){
 if(!authority())return;
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const entries=[{card:message,root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),root:node}))];
 for(const entry of entries){
  entry.root.querySelectorAll('[data-rsa-sleet-apply]').forEach(node=>node.remove());
  if(!isSleetStormSave(entry.card)||entry.card.isContentVisible===false)continue;
  const done=new Set(entry.card.getFlag(ID,"sleetStormResolvedTargets")??[]);
  if(!Array.from(entry.card.system.targets??[]).some(target=>entry.card.system.outcomes?.get(target.token)==="failure"&&!done.has(target.token)))continue;
  const button=document.createElement("button");button.type="button";button.dataset.rsaSleetApply="";button.textContent=(entry.card.getAssociatedActivity?.()?.item?.identifier??entry.card.getAssociatedActivity?.()?.item?.system?.identifier)==="sleet-storm"?"Apply Prone and end concentration":"Apply Prone";
  button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await applySleetStorm(entry.card,{manual:true});await ui.chat?.updateMessage?.(entry.card);}catch(error){report(error);}finally{button.disabled=false;}});
  (entry.root.querySelector('.chat-card')??entry.root).append(button);
 }
}
function report(error){console.error("Area save effects",error);ui.notifications.error("Area save effects could not finish. Use the card to retry.");}
Hooks.once("ready",()=>{
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{applySleetStorm(card).catch(report);});
 Hooks.on("dnd5e.renderChatMessage",renderSleetStorm);
});
