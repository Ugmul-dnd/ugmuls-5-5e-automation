import {getRegionSpellTable} from "./region-library.js";
const ID="ugmuls-5-5e-automation";
export function movementOnlyPlacement(activity){
 if(!["spell","feat"].includes(activity?.item?.type)||!activity.target?.template?.type)return false;
 const config=getRegionSpellTable()[activity.item.name];if(!config||config.enabled===false)return false;
 const triggers=(config.triggers??[]).filter(trigger=>trigger.enabled!==false);
 return triggers.length>0&&triggers.every(trigger=>trigger.movementDamage===true);
}
export function prepareMovementPlacement(activity,usage,dialog,message){
 const flags=message.data?.flags?.[ID]??{};
 if(flags.regionTriggered||flags.riderTriggered||!(movementOnlyPlacement(activity)||activity.target?.template?.type&&getRegionSpellTable()[activity.item?.name]?.enabled!==false&&getRegionSpellTable()[activity.item?.name]?.placementOnly))return;
 usage.subsequentActions=false;
 message.data??={};message.data.flags??={};message.data.flags[ID]??={};if(movementOnlyPlacement(activity))message.data.flags[ID].movementRegionPlacement=true;
 else message.data.flags[ID].regionPlacementOnly=true;
 // Area confirmation can still collect targets/Metamagic, but must not resume damage.
 message.data.flags[ID].resumeAreaDamage=false;
}
export function guardMovementPlacementDamage(config,dialog,message){
 const flags=message?.data?.flags?.[ID]??{};
 if(config.movementDamageSteps>0||flags.movementDamageRoll||flags.regionTriggered||flags.riderTriggered)return;
 const reference=message?.data?.system?.origin,origin=typeof reference==="string"?game.messages.get(reference.replace(/^ChatMessage\./,"")):reference;
 if(origin?.getFlag?.(ID,"movementRegionPlacement")||origin?.getFlag?.(ID,"regionPlacementOnly")||movementOnlyPlacement(config.subject))return false;
}
export function renderMovementPlacement(card,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const entries=[{card,root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),root:node}))];
 for(const entry of entries){if(entry.card?.isContentVisible===false||!entry.card?.getFlag?.(ID,"movementRegionPlacement")&&!entry.card?.getFlag?.(ID,"regionPlacementOnly"))continue;
  entry.root.dataset.rsaRegionPlacement='true';
  entry.root.querySelectorAll('[data-action="rollDamage"],[data-forward-action="rollDamage"],[data-action="rollSave"],[data-forward-action="rollSave"]').forEach(button=>button.hidden=true);
  entry.root.querySelectorAll('effect-application').forEach(tray=>tray.hidden=true);
  entry.root.querySelectorAll('[data-rsa-retarget],.rsa-save-pending,.rsa-save-setup').forEach(node=>node.remove());
  if(entry.card.getFlag(ID,"pendingCast")||entry.card.getFlag(ID,"targetsConfirmationPending")||entry.root.querySelector('[data-rsa-movement-placement]'))continue;
  const activity=entry.card.getAssociatedActivity?.(),cloud=(activity?.item?.identifier??activity?.item?.system?.identifier)==='stinking-cloud'||activity?.item?.name==='Stinking Cloud';
  const subtitle=entry.root.querySelector('.card-header .subtitle');if(subtitle)subtitle.textContent='Cast — Place Area';
  const note=document.createElement("p");note.dataset.rsaMovementPlacement="";note.textContent=cloud?"Stinking Cloud cast — template placed. Creatures save at the start of their turns.":entry.card.getFlag(ID,"regionPlacementOnly")?"Area placed — the Region prompts saves when its configured events occur.":"Area placed — damage is rolled only when a creature moves through it.";(entry.root.querySelector('.chat-card')??entry.root).append(note);
 }
}
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.preUseActivity",prepareMovementPlacement);
 Hooks.on("dnd5e.preRollDamageV2",guardMovementPlacementDamage);
 Hooks.on("dnd5e.renderChatMessage",renderMovementPlacement);
});
