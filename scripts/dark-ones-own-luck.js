import {createEventQueue,isRollAdjustmentLocked} from "./shared-activity-card.js";
import {inspiredRoll} from "./bardic-inspiration.js";
import {seekingSnapshot} from "./seeking-spell.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),actorFor=card=>card?.getAssociatedActor?.()??card?.getAssociatedActivity?.()?.actor;
export const luckFeature=actor=>values(actor?.items).find(item=>item.type==="feat"&&(item.identifier??item.system?.identifier)==="dark-ones-own-luck");
export function luckFormula(actor){
 const activity=values(luckFeature(actor)?.system?.activities).find(a=>a.type==="utility"&&a.roll?.formula);
 return activity?.roll?.formula??null;
}
const remaining=item=>Number(item?.system?.uses?.value??(Number(item?.system?.uses?.max)-Number(item?.system?.uses?.spent??0)))||0;
function visible(card,user){return !!user&&(user.isGM||!card.blind&&(!card.whisper?.length||card.author?.id===user.id||card.whisper.some(u=>(u.id??u)===user.id)));}
export function canUseLuck(card,user=game.user,index=0){
 const actor=actorFor(card),roll=card?.rolls?.[index];
 return game.settings.get(ID,"darkOnesOwnLuckAutomation")===true&&["check","save"].includes(card?.type)&&Number.isInteger(index)&&index>=0&&!!roll?.d20&&roll._evaluated===true&&
 visible(card,user)&&card.isContentVisible!==false&&!!(user?.isGM||actor?.testUserPermission?.(user,"OWNER"))&&
 !card.system?.concentrationBroken&&!card.getFlag?.(ID,"automaticGrappleFailure")&&!card.getFlag?.(ID,"darkOnesOwnLuck")?.[index]&&!isRollAdjustmentLocked(card)&&remaining(luckFeature(actor))>0&&!!luckFormula(actor);
}
const snapshot=card=>seekingSnapshot(card)+JSON.stringify(card.rolls.map(r=>r.options?.target));
export function applyOwnLuck(card,index=0,user=game.user){return enqueue(async()=>{
 if(!canUseLuck(card,user,index))throw Error("Dark One’s Own Luck needs your unresolved ability check or saving throw and an available feature use. Undo applied damage/effects first.");
 if(!game.users.activeGM&&!game.user.isGM&&card.isOwner===false)throw Error("A connected GM is required to adjust this roll.");
 const actor=actorFor(card),feature=luckFeature(actor),formula=luckFormula(actor),spent=Number(feature.system.uses.spent??0),before=snapshot(card);
 const unchanged=()=>canUseLuck(card,user,index)&&luckFeature(actor)===feature&&luckFormula(actor)===formula&&snapshot(card)===before;
 const bonus=await new CONFIG.Dice.BasicRoll(formula,actor.getRollData?.()??{}).evaluate(),adjusted=await inspiredRoll(card.rolls[index],bonus);
 if(!unchanged()||Number(feature.system.uses.spent??0)!==spent)throw Error("The roll or feature uses changed. Try again.");
 let charged=false,committed=false;
 try{
  await feature.update({"system.uses.spent":spent+1});charged=true;
  if(game.dice3d?.showForRoll){try{
   const animation=Promise.resolve(game.dice3d.showForRoll(bonus,user,true,card.whisper?.length?card.whisper:null,card.blind??false,card.id,card.speaker));
   if(globalThis.Ugmuls55eAutomationWaitForAnimation)await globalThis.Ugmuls55eAutomationWaitForAnimation(animation);else if(globalThis.document?.hidden)animation.catch(console.warn);else await animation;
  }catch(error){console.warn("Dark One’s Own Luck animation failed",error);}}
  // showForRoll only waits for this client's dice. The GM may be in the
  // background while the player's bonus is still rolling; use the shared
  // client completion barrier before publishing the adjusted total.
  if(game.dice3d?.showForRoll&&game.user.isGM)await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  // The last use has already been reserved, so revalidate without requiring a
  // remaining use. All eligibility and permissions were checked before spending.
  if(snapshot(card)!==before||isRollAdjustmentLocked(card)||card.system?.concentrationBroken||luckFeature(actor)!==feature||luckFormula(actor)!==formula||card.getFlag?.(ID,"darkOnesOwnLuck")?.[index]||Number(feature.system.uses.spent??0)!==spent+1||game.settings.get(ID,"darkOnesOwnLuckAutomation")!==true||!(user?.isGM||actor.testUserPermission?.(user,"OWNER")))throw Error("The roll or feature changed during Dark One’s Own Luck. The use was restored.");
  const rolls=[...card.rolls];rolls[index]=adjusted;
  const record={...(card.getFlag(ID,"darkOnesOwnLuck")??{}),[index]:{formula,total:bonus.total,feature:feature.uuid}},skip=card.getFlag("dice-so-nice","skip");
  try{await card.update({rolls,["flags."+ID+".darkOnesOwnLuck"]:record,"flags.dice-so-nice.skip":true});committed=true;}
  finally{if(skip===undefined)await card.unsetFlag("dice-so-nice","skip");else await card.setFlag("dice-so-nice","skip",skip);}
 }catch(error){if(charged&&!committed)await feature.update({"system.uses.spent":Math.max(0,Number(feature.system.uses.spent??0)-1)});throw error;}
});}
function report(error){console.error("Dark One’s Own Luck",error);ui.notifications.error(error.message);}
async function request(card,index,button){button.disabled=true;try{
 const gm=game.users.activeGM;
 if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"darkOnesOwnLuck",messageId:card.id,index,userId:game.user.id,gmId:gm.id});
 else await applyOwnLuck(card,index,game.user);
 }catch(error){report(error);}finally{button.disabled=!canUseLuck(card,game.user,index);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}}
export function renderOwnLuck(message,html){
 const root=html instanceof HTMLElement?html:html?.[0];if(!root)return;
 const entries=[{card:message,root}];for(const node of root.querySelectorAll('.card-summary[data-message-id]')){const card=game.messages.get(node.dataset.messageId);if(card&&!node.hidden)entries.push({card,root:node});}
 for(const entry of entries){
  entry.root.querySelectorAll(':scope > .rsa-own-luck-actions').forEach(node=>node.remove());if(entry.card.isContentVisible===false||!visible(entry.card,game.user))continue;
  const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-own-luck-actions";
  for(const [index]of(entry.card.rolls??[]).entries())if(canUseLuck(entry.card,game.user,index)){
   const button=document.createElement("button");button.type="button";button.textContent="Dark One’s Own Luck ("+luckFormula(actorFor(entry.card))+")"+(entry.card.rolls.length>1?" — Roll "+(index+1):"");
   button.dataset.tooltip="Roll and add the native bonus to this check/save without rerolling its dice. Spend one feature use. Once per roll; no Reaction required.";
   button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();request(entry.card,index,button);});controls.append(button);
  }
  for(const [index,record]of Object.entries(entry.card.getFlag?.(ID,"darkOnesOwnLuck")??{})){const label=document.createElement("span");label.textContent="Dark One’s Own Luck: +"+record.total+(entry.card.rolls.length>1?" — Roll "+(Number(index)+1):"");controls.append(label);}
  if(controls.childNodes.length)entry.root.append(controls);
 }
}
function refresh(doc,changes){if(doc)globalThis.Ugmuls55eAutomationChatRefresh?.request("ownLuck",doc,changes);}
Hooks.once("init",()=>game.settings.register(ID,"darkOnesOwnLuckAutomation",{name:"Fiend: Dark One’s Own Luck",hint:"Add a button to the Warlock’s ability-check and saving-throw cards. Roll the native bonus, add it without rerolling, and spend one native feature use. Once per roll, before damage/effects are applied; no Reaction required.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.renderChatMessage",renderOwnLuck);for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,refresh);
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="darkOnesOwnLuckError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(packet.messageId));return;}
  if(packet?.action!=="darkOnesOwnLuck"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;
  const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;
  applyOwnLuck(card,packet.index,user).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"darkOnesOwnLuckError",userId:user.id,messageId:card.id,error:error.message});});
 });
});
