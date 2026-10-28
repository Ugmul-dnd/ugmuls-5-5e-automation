import {isRollAdjustmentLocked} from "./shared-activity-card.js";
import {failureState} from "./bardic-inspiration.js";
import {rerollFocus,restoreFocusTargets} from "./fanatical-focus.js";
import {animateNewSaveDice} from "./save-roll-controls.js";
import {seekingSnapshot} from "./seeking-spell.js";
import {queueIndomitable as queueSurvivor} from "./indomitable.js";
import {focusResource} from "./stunning-strike.js";
const ID="ugmuls-5-5e-automation",values=c=>Array.from(c?.values?.()??c??[]);
const actorFor=card=>card?.getAssociatedActor?.()??(card?.speaker?ChatMessage.getSpeakerActor(card.speaker):null);
export const disciplinedSurvivorFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&i.system?.source?.rules!=="2014"&&(i.identifier??i.system?.identifier)==="disciplined-survivor");
const remaining=i=>Number(i?.system?.uses?.value??Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0))||0;
export function canDisciplinedSurvivor(card,user=game.user,index=0){
 const actor=actorFor(card),roll=card?.rolls?.[index],feature=disciplinedSurvivorFeature(actor);
 return game.settings.get(ID,"disciplinedSurvivorAutomation")===true&&card?.type==="save"&&Number.isInteger(index)&&index>=0&&!!roll?.d20&&roll._evaluated&&card.isContentVisible!==false&&
 !card.getFlag?.(ID,"disciplinedSurvivor")?.[index]&&!card.getFlag?.(ID,"automaticGrappleFailure")&&!card.getFlag?.(ID,"carefulSpell")&&!card.system?.forceSuccess&&!card.system?.concentrationBroken&&!isRollAdjustmentLocked(card)&&
 failureState(card,index)==="failed"&&!!feature&&remaining(focusResource(actor))>0&&!!(user?.isGM||actor?.testUserPermission?.(user,"OWNER"));
}
const snapshot=card=>seekingSnapshot(card)+JSON.stringify(card.rolls.map(r=>r.options?.target));
export function applyDisciplinedSurvivor(card,index=0,user=game.user){return queueSurvivor(async()=>{
 if(!canDisciplinedSurvivor(card,user,index))throw Error("Disciplined Survivor needs a failed saving throw and 1 Focus Point. Undo applied damage/effects first.");
 const actor=actorFor(card),feature=disciplinedSurvivorFeature(actor),resource=focusResource(actor),before=snapshot(card),spent=Number(resource.system.uses.spent??0),result=await rerollFocus(card.rolls[index],0);
 if(!canDisciplinedSurvivor(card,user,index)||snapshot(card)!==before||disciplinedSurvivorFeature(actor)!==feature||focusResource(actor)!==resource||Number(resource.system.uses.spent??0)!==spent)throw Error("The save or Disciplined Survivor resources changed. Try again.");
 let charged=false,committed=false;
 try{
  await resource.update({"system.uses.spent":spent+1});charged=true;
  await animateNewSaveDice(card,result.results,user);
  if(game.dice3d?.showForRoll&&game.user.isGM)await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  if(snapshot(card)!==before||isRollAdjustmentLocked(card)||disciplinedSurvivorFeature(actor)!==feature||focusResource(actor)!==resource||Number(resource.system.uses.spent??0)!==spent+1)throw Error("The save changed during Disciplined Survivor. Its Focus Point was restored; undo applied damage/effects before retrying.");
  const rolls=[...card.rolls];rolls[index]=result.roll;const record={...card.getFlag(ID,"disciplinedSurvivor"),[index]:{actor:actor.uuid,feature:feature.uuid,resource:resource.uuid}},skip=card.getFlag("dice-so-nice","skip");
  try{await card.update({rolls,["flags."+ID+".disciplinedSurvivor"]:record,"flags.dice-so-nice.skip":true});committed=true;}
  finally{if(skip===undefined)await card.unsetFlag("dice-so-nice","skip");else await card.setFlag("dice-so-nice","skip",skip);}
 }catch(error){if(charged&&!committed)await resource.update({"system.uses.spent":Math.max(0,Number(resource.system.uses.spent??0)-1)});throw error;}
 if(committed)restoreFocusTargets(card);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
});}
function report(error){console.error("Disciplined Survivor",error);ui.notifications.error(error.message);}
async function request(card,index,button){button.disabled=true;try{const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"disciplinedSurvivor",messageId:card.id,index,userId:game.user.id,gmId:gm.id});else await applyDisciplinedSurvivor(card,index);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}}
export function renderDisciplinedSurvivor(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){node.querySelectorAll(':scope > .rsa-disciplinedSurvivor').forEach(n=>n.remove());if(card.isContentVisible===false)continue;const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-disciplinedSurvivor";
 for(const [index]of (card.rolls??[]).entries()){if(!canDisciplinedSurvivor(card,game.user,index))continue;const button=document.createElement("button");button.type="button";button.textContent="Disciplined Survivor — 1 Focus Point"+(card.rolls.length>1?" — Roll "+(index+1):"");button.dataset.tooltip="Spend 1 Focus Point. Reroll one d20, keeping the original modifiers and DC. Keep the new result, even if lower. No Reaction required.";button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();request(card,index,button);});controls.append(button);}
 for(const record of Object.values(card.getFlag?.(ID,"disciplinedSurvivor")??{})){const label=document.createElement("span");label.textContent="Disciplined Survivor: rerolled";controls.append(label);}if(controls.childNodes.length)node.append(controls);
 }
}
Hooks.once("init",()=>game.settings.register(ID,"disciplinedSurvivorAutomation",{name:"Disciplined Survivor Assistance",hint:"Offer Disciplined Survivor on failed saving throws. Spend 1 Monk Focus Point, reroll one d20 without an added bonus and keep the new result. Preserve the original modifiers and DC. Require Undo before changing saves with applied damage/effects.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.renderChatMessage",renderDisciplinedSurvivor);
 for(const event of ["createItem","updateItem","deleteItem","createActiveEffect","updateActiveEffect","deleteActiveEffect"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("disciplinedSurvivor",doc,changes));
 game.socket.on("module."+ID,packet=>{if(packet?.action==="disciplinedSurvivorError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(packet.messageId));return;}
 if(packet?.action!=="disciplinedSurvivor"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;
 applyDisciplinedSurvivor(card,packet.index,user).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"disciplinedSurvivorError",messageId:card.id,userId:user.id,error:error.message});});});
});
