import {riderKey,riderConcentration,recordRiderTarget} from "./bonus-damage-riders.js";
import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",abilities=["str","dex","con","int","wis","cha"],enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"hexAbilityChoice")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const live=e=>e&&!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
export function hexChoiceActivity(activity){return enabled()&&activity?.type==="utility"&&activity.item?.type==="spell"&&riderKey(activity.item)==="hex";}
export function hexAbility(effect){return abilities.find(a=>values(effect?.system?.changes).some(c=>c.key==="system.abilities."+a+".check.roll.mode"&&Number(c.value)<0));}
function context(card){const activity=card?.getAssociatedActivity?.({scaled:true}),actor=card?.getAssociatedActor?.()??activity?.actor;return {activity,actor,item:activity?.item};}
function sourceEffect(item,activity,ability){return values(item?.effects).find(e=>hexAbility(e)===ability&&(!activity.effects?.length||values(activity.effects).some(r=>r._id===e.id||r.uuid===e.uuid)));}
export async function initializeHex(card){
 if(!authority()||!card?.id||flag(card,"hexChoice")||flag(card,"targetsConfirmationPending")||flag(card,"targetsConfirmationCanceled"))return;
 const {activity,actor,item}=context(card);if(!hexChoiceActivity(activity)||card.type!=="usage"||card.system?.targets?.length!==1)return;
 const concentration=riderConcentration(actor,"hex");if(!concentration||card.system.concentration&&card.system.concentration!==concentration.id)return;
 const descriptor=card.system.targets[0],token=descriptor.token?await fromUuid(descriptor.token):null,target=token?.actor??(descriptor.actor?await fromUuid(descriptor.actor):null);if(!target)return;
 const source=sourceEffect(item,activity,"str");if(!source)throw Error("Hex is missing its native Strength curse effect.");
 const tray=document.createElement("effect-application");tray.chatMessage=card;
 const undo=globalThis.Ugmuls55eAutomationEffectUndo;
 const applied=undo?await undo.apply(card,card,source,target,tray):await tray._applyEffectToActor(source,target);if(!applied?.uuid)throw Error("Hex could not apply its Strength curse.");
 const previousChoice=flag(actor,"hexActiveChoice"),native=source.toObject();
 const record={effect:applied.uuid,target:target.uuid,token:token?.uuid,caster:actor.uuid,item:item.uuid,concentration:concentration.uuid,card:card.id,ability:"str"};
 await applied.update({name:native.name,img:native.img,"system.changes":native.system.changes,statuses:native.statuses??["cursed"],["flags."+ID+".hexChoice"]:record,"flags.dnd5e.dependentOn":concentration.uuid,"system.origin.effect":concentration.uuid});
 await card.setFlag(ID,"hexChoice",record);
 // Reassigning Hex ends only this caster/concentration's earlier managed curse.
 await actor.setFlag(ID,"hexActiveChoice",record);
 if(previousChoice?.concentration===concentration.uuid&&previousChoice.effect!==applied.uuid){const old=await fromUuid(previousChoice.effect,{strict:false});if(flag(old,"hexChoice")?.caster===actor.uuid)await old.delete();}
 await recordRiderTarget(activity,card);
 globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
}
export async function selectHexAbility(card,ability,user=game.user){
 const {activity,actor,item}=context(card);if(!hexChoiceActivity(activity)||!abilities.includes(ability)||!(user?.isGM||actor?.testUserPermission?.(user,"OWNER")))throw Error("Only the caster’s owner or GM can change Hex.");
 const record=flag(card,"hexChoice"),effect=record?.effect?await fromUuid(record.effect,{strict:false}):null,concentration=riderConcentration(actor,"hex");
 if(!record||!live(effect)||concentration?.uuid!==record.concentration||flag(effect,"hexChoice")?.card!==card.id||effect.parent?.uuid!==record.target)throw Error("Effect not found, recast Hex");
 const source=sourceEffect(item,activity,ability);if(!source)throw Error("That Hex ability is not available on this card.");
 const data=source.toObject();
 // Update in place: retain concentration dependency, expiry, start and Undo identity.
 await effect.update({name:data.name,img:data.img,"system.changes":data.system.changes,statuses:data.statuses??["cursed"],["flags."+ID+".hexChoice"]:{...record,ability}});
 await card.setFlag(ID,"hexChoice",{...record,ability});globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return ability;
}
async function request(card,ability){const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"hexAbilityChoice",card:card.id,ability,user:game.user.id,gm:gm.id});else await enqueue(()=>selectHexAbility(card,ability));}
export function renderHexChoice(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll(".card-summary[data-message-id]")).map(node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){
  node.querySelectorAll(":scope > .rsa-hex-choice").forEach(e=>e.remove());if(card?.type!=="usage")continue;const {activity,actor}=context(card);if(!hexChoiceActivity(activity)||card.isContentVisible===false||!(game.user.isGM||actor?.isOwner))continue;
  for(const tray of node.querySelectorAll("effect-application"))tray.hidden=true;
  const box=document.createElement("div");box.className="rsa-attack-actions rsa-hex-choice";const info=document.createElement("p");info.textContent="Hex ability checks: choose one ability. Strength is applied automatically.";box.append(info);
  const row=document.createElement("div");row.style.cssText="display:flex;flex-wrap:wrap;gap:4px";
  const chosen=flag(card,"hexChoice")?.ability;
  for(const ability of abilities){const button=document.createElement("button");button.type="button";button.textContent=ability.toUpperCase();button.setAttribute("aria-pressed",String(chosen===ability));button.style.flex="1 1 44px";if(chosen===ability)button.style.outline="1px solid var(--dnd5e-color-gold, #c9ad6a)";button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();request(card,ability).catch(report);});row.append(button);}box.append(row);node.append(box);
 }
}
function report(error){console.error("Hex ability selection",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"hexAbilityChoice",{name:"Hex Ability Selection",hint:"Apply Strength Hex automatically on the curse card, then let the caster/GM switch abilities. Requires the existing curse and active concentration; missing effects must be recast.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationHex={hexChoiceActivity};
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{if(authority()&&card.type==="usage"&&hexChoiceActivity(card.getAssociatedActivity?.()))enqueue(()=>initializeHex(card)).catch(report);});
 Hooks.on("dnd5e.postUseActivity",(activity,usage,result)=>{if(!hexChoiceActivity(activity)||!result?.message)return;const card=result.message,gm=game.users.activeGM;if(authority())enqueue(()=>initializeHex(card)).catch(report);else if(gm)game.socket.emit("module."+ID,{action:"initializeHexChoice",card:card.id,user:game.user.id,gm:gm.id});});
 Hooks.on("dnd5e.renderChatMessage",renderHexChoice);
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="hexAbilityChoiceError"&&packet.user===game.user.id){ui.notifications.error(packet.error);return;}
  if(!["hexAbilityChoice","initializeHexChoice"].includes(packet?.action)||!authority()||packet.gm!==game.user.id)return;
  const user=game.users.get(packet.user),card=game.messages.get(packet.card),actor=card?.type==="usage"?card.getAssociatedActor?.():null;if(!user?.active||!card||!(user.isGM||actor?.testUserPermission?.(user,"OWNER")))return;
  enqueue(()=>packet.action==="initializeHexChoice"?initializeHex(card):selectHexAbility(card,packet.ability,user)).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"hexAbilityChoiceError",user:user.id,error:error.message});});
 });
});
