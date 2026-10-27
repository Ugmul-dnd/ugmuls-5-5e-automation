import {createEventQueue,isRollAdjustmentLocked} from "./shared-activity-card.js";
import {failureState} from "./bardic-inspiration.js";
import {rerollFocus,restoreFocusTargets} from "./fanatical-focus.js";
import {animateNewSaveDice} from "./save-roll-controls.js";
import {seekingSnapshot} from "./seeking-spell.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=c=>Array.from(c?.values?.()??c??[]);
const actorFor=card=>card?.getAssociatedActor?.()??(card?.speaker?ChatMessage.getSpeakerActor(card.speaker):null);
export const indomitableFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&i.system?.source?.rules!=="2014"&&(i.identifier??i.system?.identifier)==="indomitable");
export function fighterSaveBonus(actor){const level=Number(actor?.getRollData?.()?.classes?.fighter?.levels??values(actor?.items).find(i=>i.type==="class"&&(i.identifier??i.system?.identifier)==="fighter")?.system?.levels);return Number.isInteger(level)&&level>0?level:null;}
const remaining=i=>Number(i?.system?.uses?.value??Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0))||0;
export function canIndomitable(card,user=game.user,index=0){
 const actor=actorFor(card),roll=card?.rolls?.[index],feature=indomitableFeature(actor);
 return game.settings.get(ID,"indomitableAutomation")===true&&card?.type==="save"&&Number.isInteger(index)&&index>=0&&!!roll?.d20&&roll._evaluated&&card.isContentVisible!==false&&
 !card.getFlag?.(ID,"indomitable")?.[index]&&!card.getFlag?.(ID,"automaticGrappleFailure")&&!card.getFlag?.(ID,"carefulSpell")&&!card.system?.forceSuccess&&!card.system?.concentrationBroken&&!isRollAdjustmentLocked(card)&&
 failureState(card,index)==="failed"&&!!feature&&remaining(feature)>0&&!!fighterSaveBonus(actor)&&!!(user?.isGM||actor?.testUserPermission?.(user,"OWNER"));
}
const snapshot=card=>seekingSnapshot(card)+JSON.stringify(card.rolls.map(r=>r.options?.target));
export function queueIndomitable(task){return enqueue(task);}
export function applyIndomitable(card,index=0,user=game.user){return queueIndomitable(async()=>{
 if(!canIndomitable(card,user,index))throw Error("Indomitable needs a failed saving throw and an available feature use. Undo applied damage/effects first.");
 const actor=actorFor(card),feature=indomitableFeature(actor),bonus=fighterSaveBonus(actor),before=snapshot(card),spent=Number(feature.system.uses.spent??0),result=await rerollFocus(card.rolls[index],bonus);
 if(!canIndomitable(card,user,index)||snapshot(card)!==before||indomitableFeature(actor)!==feature||fighterSaveBonus(actor)!==bonus||Number(feature.system.uses.spent??0)!==spent)throw Error("The save or Indomitable resources changed. Try again.");
 let charged=false,committed=false;
 try{
  await feature.update({"system.uses.spent":spent+1});charged=true;
  await animateNewSaveDice(card,result.results,user);
  if(game.dice3d?.showForRoll&&game.user.isGM)await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  if(snapshot(card)!==before||isRollAdjustmentLocked(card)||indomitableFeature(actor)!==feature||fighterSaveBonus(actor)!==bonus||Number(feature.system.uses.spent??0)!==spent+1)throw Error("The save changed during Indomitable. Its use was restored; undo applied damage/effects before retrying.");
  const rolls=[...card.rolls];rolls[index]=result.roll;const record={...card.getFlag(ID,"indomitable"),[index]:{actor:actor.uuid,feature:feature.uuid,bonus}},skip=card.getFlag("dice-so-nice","skip");
  try{await card.update({rolls,["flags."+ID+".indomitable"]:record,"flags.dice-so-nice.skip":true});committed=true;}
  finally{if(skip===undefined)await card.unsetFlag("dice-so-nice","skip");else await card.setFlag("dice-so-nice","skip",skip);}
 }catch(error){if(charged&&!committed)await feature.update({"system.uses.spent":Math.max(0,Number(feature.system.uses.spent??0)-1)});throw error;}
 if(committed)restoreFocusTargets(card);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
});}
function report(error){console.error("Indomitable",error);ui.notifications.error(error.message);}
async function request(card,index,button){button.disabled=true;try{const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"indomitable",messageId:card.id,index,userId:game.user.id,gmId:gm.id});else await applyIndomitable(card,index);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}}
export function renderIndomitable(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){node.querySelectorAll(':scope > .rsa-indomitable').forEach(n=>n.remove());if(card.isContentVisible===false)continue;const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-indomitable";
 for(const [index]of (card.rolls??[]).entries()){if(!canIndomitable(card,game.user,index))continue;const button=document.createElement("button");button.type="button";button.textContent="Indomitable (+"+fighterSaveBonus(actorFor(card))+")"+(card.rolls.length>1?" — Roll "+(index+1):"");button.dataset.tooltip="Spend one Indomitable use. Reroll one d20 and add your Fighter level; keep the new result, even if lower. No Reaction required.";button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();request(card,index,button);});controls.append(button);}
 for(const record of Object.values(card.getFlag?.(ID,"indomitable")??{})){if(record.sharedResilience)continue;const label=document.createElement("span");label.textContent="Indomitable: rerolled +"+record.bonus;controls.append(label);}if(controls.childNodes.length)node.append(controls);
 }
}
Hooks.once("init",()=>game.settings.register(ID,"indomitableAutomation",{name:"Indomitable Assistance",hint:"Offer Indomitable on failed saving throws. Spend one native feature use, reroll one d20 with your Fighter-level bonus, and keep the replacement result. Require Undo before changing saves with applied damage/effects. No ability-check DC prompts.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.renderChatMessage",renderIndomitable);
 for(const event of ["createItem","updateItem","deleteItem","createActiveEffect","updateActiveEffect","deleteActiveEffect"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("indomitable",doc,changes));
 game.socket.on("module."+ID,packet=>{if(packet?.action==="indomitableError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(packet.messageId));return;}
 if(packet?.action!=="indomitable"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;
 applyIndomitable(card,packet.index,user).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"indomitableError",messageId:card.id,userId:user.id,error:error.message});});});
});
