import {createEventQueue,isRollAdjustmentLocked} from "./shared-activity-card.js";
import {failureState,inspiredRoll} from "./bardic-inspiration.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
import {seekingSnapshot} from "./seeking-spell.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue();
const actorFor=card=>card?.getAssociatedActor?.();
const featureFor=actor=>Array.from(actor?.items??[]).find(item=>item.type==="feat"&&((item.identifier??item.system?.identifier)==="flash-of-genius"||/^flash of genius$/i.test(item.name??"")));
const remaining=item=>Number(item?.system?.uses?.value??(Number(item?.system?.uses?.max)-Number(item?.system?.uses?.spent??0)))||0;
const combatant=actor=>game.combat?.started&&Array.from(game.combat.combatants??[]).some(c=>c.actor?.uuid===actor.uuid);
function visible(card,user){if(user?.isGM)return true;if(card.blind)return false;return !card.whisper?.length||card.author?.id===user?.id||card.whisper.some(entry=>(entry?.id??entry)===user?.id);}
export function flashEligible(card,index=0,user=game.user){
 return game.settings.get(ID,"flashOfGeniusAutomation")===true&&["save","check"].includes(card?.type)&&!(card.type==="check"&&card.system?.type==="initiative")&&Number.isInteger(index)&&index>=0&&visible(card,user)&&card.isContentVisible!==false&&!(card.getFlag?.(ID,"flashOfGenius")??{})[index]&&!card.getFlag?.(ID,"automaticGrappleFailure")&&!isRollAdjustmentLocked(card)&&failureState(card,index)!=="ineligible";
}
export function flashRange(source,target){
 if(!source?.actor||!target?.actor)return false;if(source.actor.uuid===target.actor.uuid)return true;
 if(source.parent?.id!==target.parent?.id||target.hidden)return false;const a=source.object,b=target.object;if(!a?.center||!b?.center)return false;
 const distance=canvas.grid.measurePath([a.center,b.center]).distance,units=String(source.parent?.grid?.units??canvas.scene?.grid?.units??"ft").toLowerCase(),limit=/^(m|meters?|metres?)$/.test(units)?9.144:30;
 return Number.isFinite(distance)&&distance<=limit&&!a.checkCollision?.(b.center,{type:"sight",mode:"any"});
}
export function flashCandidates(card,user=game.user,index=0){
 if(!flashEligible(card,index,user))return [];
 const recipient=actorFor(card),associated=card.getAssociatedToken?.(),target=(associated?.document??associated)??recipient?.token??Array.from(canvas.scene?.tokens??[]).find(t=>t.actor?.uuid===recipient?.uuid),tokens=Array.from(canvas.scene?.tokens??[]),seen=new Set(),entries=[];
 // Self-use also works without a placed token outside combat.
 if(recipient&&!tokens.some(t=>t.actor?.uuid===recipient.uuid))tokens.push({actor:recipient});
 for(const token of tokens){const actor=token.actor;if(!actor||seen.has(actor.uuid)||!(user?.isGM||actor.testUserPermission?.(user,"OWNER")))continue;
  if(reactionUsed(actor)||["incapacitated","unconscious","dead","stunned","paralyzed","petrified"].some(s=>actor.statuses?.has(s)))continue;
  const feature=featureFor(actor),bonus=Math.max(1,Number(actor.system?.abilities?.int?.mod)||0),activity=Array.from(feature?.system?.activities?.values?.()??feature?.system?.activities??[]).find(a=>String(a.activation?.type??"").startsWith("reaction"));
  if(!feature||!activity||remaining(feature)<1||actor.uuid!==recipient?.uuid&&!flashRange(token,target))continue;
  seen.add(actor.uuid);entries.push({actor,token,feature,activity,bonus});
 }
 return entries;
}
const signature=card=>seekingSnapshot(card)+JSON.stringify((card.rolls??[]).map(r=>r.options?.target));
export function applyFlashOfGenius(card,actorUuid,index=0,user=game.user,confirmedFailure=false){return enqueue(async()=>{
 let entry=flashCandidates(card,user,index).find(e=>e.actor.uuid===actorUuid);if(!entry)throw Error("Flash of Genius needs an available feature use, a failed check/save, and an eligible Artificer within 30 feet. Undo applied damage or effects first.");
 if(failureState(card,index)==="unknown"&&!confirmedFailure)throw Error("Confirm that this check or saving throw failed before using Flash of Genius.");
 if(!game.users.activeGM&&!user.isGM&&card.isOwner===false)throw Error("A connected GM is required to adjust another user’s roll.");
 const before=signature(card);await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 entry=flashCandidates(card,user,index).find(e=>e.actor.uuid===actorUuid);if(!entry||signature(card)!==before)throw Error("The roll or Artificer’s eligibility changed. Try again.");
 const spent=Number(entry.feature.system.uses.spent??0),bonus=await new CONFIG.Dice.BasicRoll(String(entry.bonus)).evaluate(),adjusted=await inspiredRoll(card.rolls[index],bonus);let charged=false,committed=false,marker;
 try{
  if(signature(card)!==before||!flashCandidates(card,user,index).some(e=>e.actor.uuid===actorUuid))throw Error("The roll or resources changed. Try again.");
  await entry.feature.update({"system.uses.spent":spent+1});charged=true;
  if(reactionUsed(entry.actor))throw Error("The Artificer’s Reaction was just used.");
  // This reaction belongs to Flash, even when the recipient roll is a rider helper.
  await recordReactionUse(entry.activity,{}, {message:{id:card.id}});marker=reactionUsed(entry.actor);
  if(game.settings.get(ID,"reactionTracker")===true&&combatant(entry.actor)&&marker?.getFlag?.(ID,"reactionUsage")!==card.id)throw Error("Could not reserve the Artificer’s Reaction.");
  if(signature(card)!==before||isRollAdjustmentLocked(card))throw Error("The roll changed before Flash of Genius could apply.");
  const rolls=[...card.rolls];rolls[index]=adjusted;const record={...(card.getFlag(ID,"flashOfGenius")??{}),[index]:{actor:actorUuid,name:entry.actor.name,feature:entry.feature.uuid,total:entry.bonus,reaction:!!marker}},skip=card.getFlag("dice-so-nice","skip");
  try{await card.update({rolls,["flags."+ID+".flashOfGenius"]:record,"flags.dice-so-nice.skip":true});committed=true;}
  finally{if(skip===undefined)await card.unsetFlag("dice-so-nice","skip");else await card.setFlag("dice-so-nice","skip",skip);}
 }catch(error){if(charged&&!committed){await entry.feature.update({"system.uses.spent":Math.max(0,Number(entry.feature.system.uses.spent??0)-1)});if(marker?.getFlag?.(ID,"reactionUsage")===card.id)await marker.update({disabled:true});}throw error;}
 });}
function report(error){console.error("Flash of Genius",error);ui.notifications.error(error.message);}
async function request(card,actor,index,button){button.disabled=true;try{
 let confirmed=false;if(failureState(card,index)==="unknown"){confirmed=await foundry.applications.api.DialogV2.confirm({window:{title:"Use Flash of Genius?"},content:"<p>This roll has no recorded DC. Confirm that the ability check or saving throw failed. Spend a Flash of Genius use and your available combat Reaction?</p>",rejectClose:false});if(!confirmed)return;}
 const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"flashOfGenius",messageId:card.id,actorUuid:actor.uuid,index,confirmedFailure:confirmed,userId:game.user.id,gmId:gm.id});else await applyFlashOfGenius(card,actor.uuid,index,game.user,confirmed);
 }catch(error){report(error);}finally{button.disabled=!flashCandidates(card,game.user,index).some(e=>e.actor.uuid===actor.uuid);}}
export function renderFlashOfGenius(message,html){
 const root=html instanceof HTMLElement?html:html?.[0];if(!root)return;const entries=[{card:message,root}];for(const node of root.querySelectorAll('.card-summary[data-message-id]')){const card=game.messages.get(node.dataset.messageId);if(card&&!node.hidden)entries.push({card,root:node});}
 for(const entry of entries){

  const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-flash-actions";
  for(const [index]of(entry.card.rolls??[]).entries())for(const candidate of flashCandidates(entry.card,game.user,index)){
   const button=document.createElement("button");button.type="button";const image=document.createElement("img");image.src=candidate.feature.img??"icons/svg/d20.svg";image.alt="";button.append(image,document.createTextNode("Flash of Genius +"+candidate.bonus+" — "+candidate.actor.name+(entry.card.rolls.length>1?" · Roll "+(index+1):"")));button.dataset.tooltip="Add Intelligence (minimum +1) to this failed check/save without rerolling. Spend one feature use and, during tracked combat, your Reaction. Confirm visibility to the recipient.";button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();request(entry.card,candidate.actor,index,button);});controls.append(button);
  }
  for(const record of Object.values(entry.card.getFlag?.(ID,"flashOfGenius")??{})){const label=document.createElement("span");label.textContent="Flash of Genius: +"+record.total+" ("+record.name+")";controls.append(label);}if(controls.childNodes.length)entry.root.append(controls);
 }
}
function refresh(doc,changes){globalThis.Ugmuls55eAutomationChatRefresh?.request("flash",doc,changes);}
Hooks.once("init",()=>game.settings.register(ID,"flashOfGeniusAutomation",{name:"Flash of Genius Assistance",hint:"Offer an owned Artificer’s Flash of Genius on failed ability checks and saving throws for self or visible creatures within 30 feet. Add Intelligence (minimum +1), spend one native feature use and track the Reaction in combat. Unknown DCs require failure confirmation; applied damage/effects must be undone first.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.renderChatMessage",renderFlashOfGenius);for(const event of ["createItem","updateItem","deleteItem","createActiveEffect","updateActiveEffect","deleteActiveEffect","updateCombat","updateToken"])Hooks.on(event,refresh);
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="flashOfGeniusError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);refresh();return;}
  if(packet?.action!=="flashOfGenius"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;
  const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;
  applyFlashOfGenius(card,packet.actorUuid,packet.index,user,packet.confirmedFailure===true).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"flashOfGeniusError",userId:user.id,error:error.message});});
 });
});
