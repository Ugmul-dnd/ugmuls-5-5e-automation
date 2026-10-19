import {triggerEntry} from "./trigger-library.js";
const ID="ugmuls-5-5e-automation",queues=new Map(),tracked=new Set();
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const stateOf=effect=>effect?.getFlag?.(ID,"blink");
const active=effect=>effect&&!effect.disabled&&effect.active!==false&&!effect.duration?.expired&&effect.system?.expired!==true&&!(Number.isFinite(effect.start?.time)&&Number.isFinite(game.time?.worldTime)&&game.time.worldTime>=effect.start.time+60);
const enabled=()=>triggerEntry("blink")?.enabled===true;
const isBlink=activity=>activity?.type==="utility"&&activity.item?.type==="spell"&&(activity.item.identifier??activity.item.system?.identifier)==="blink";
const trackerFor=actor=>Array.from(actor?.effects??[]).find(effect=>stateOf(effect)&&active(effect));
const tokenFor=actor=>actor?.token?.document??actor?.token??Array.from(actor?.getActiveTokens?.(false,true)??[]).map(t=>t.document??t)[0];
const stamp=(combat,turn=combat)=>combat?.started&&turn?combat.id+":"+turn.round+":"+turn.turn:null;
function serial(effect,fn){const next=(queues.get(effect.uuid)??Promise.resolve()).catch(()=>{}).then(fn);queues.set(effect.uuid,next);return next.finally(()=>{if(queues.get(effect.uuid)===next)queues.delete(effect.uuid);});}
function report(error){console.error("Ugmuls 5.5e Automation | Blink",error);ui.notifications.error("Blink could not finish: "+error.message);}
async function refresh(state){const card=game.messages.get(state?.card);if(card)await ui.chat?.updateMessage?.(card);}
export function prepareBlink(activity,usage,dialog,message){
 if(!enabled()||!isBlink(activity)||message.data?.flags?.[ID]?.riderTriggered)return;
 usage.subsequentActions=false;
 message.data??={};message.data.flags??={};message.data.flags[ID]??={};message.data.flags[ID].blinkCast={actor:activity.actor.uuid};
}
export async function registerBlinkCast(card){
 if(!authority()||!enabled()||card?.type!=="usage"||!card.getFlag?.(ID,"blinkCast")||card.getFlag(ID,"pendingCast")||card.getFlag(ID,"targetsConfirmationPending")||card.getFlag(ID,"blinkTracker"))return;
 const activity=card.getAssociatedActivity?.();if(!isBlink(activity))return;
 const actor=activity.actor??activity.item.actor;
 const lock={uuid:actor.uuid};return serial(lock,async()=>{
  if(card.getFlag(ID,"blinkTracker"))return;
  const old=trackerFor(actor);if(old){await returnFromBlink(old,{ending:true});await old.delete();}
  const instance=foundry.utils.randomID();
  const effect=(await actor.createEmbeddedDocuments("ActiveEffect",[{name:"Blink — Active",img:activity.item.img,disabled:false,transfer:false,
   duration:{value:60,units:"seconds",expiry:"turnEnd",expired:false},start:CONFIG.ActiveEffect.documentClass.getEffectStart(),system:{changes:[]},
   flags:{[ID]:{blink:{instance,card:card.id,actor:actor.uuid,rolledTurns:[]}}}}]))?.[0];
  if(!effect)throw Error("Could not track Blink.");tracked.add(effect.uuid);await card.setFlag(ID,"blinkTracker",effect.uuid);await refresh(stateOf(effect));
 });
}
export async function returnFromBlink(effect,{ending=false}={}){
 const state=stateOf(effect);if(!state||!authority())return;
 const actor=effect.parent;
 for(const ethereal of Array.from(actor?.effects??[]))if(ethereal.getFlag?.(ID,"blinkEthereal")===state.instance)await ethereal.delete();
 if(state.vanished){
  const card=game.messages.get(state.card);if(card)await card.setFlag(ID,"blinkReturn",{token:state.vanished.token,x:state.vanished.x,y:state.vanished.y,ending});
  if(Array.from(actor?.effects??[]).some(current=>current.uuid===effect.uuid))await effect.setFlag(ID,"blink",{...state,vanished:null});
 }
 await refresh(state);
}
export async function rollBlink(effect,turnStamp,token=tokenFor(effect?.parent)){
 if(!authority()||!enabled()||!turnStamp)return;
 return serial(effect,async()=>{
  const state=stateOf(effect);if(!active(effect)||!state||state.rolledTurns?.includes(turnStamp))return;
  const actor=effect.parent;if(!token?.uuid)throw Error("Blink needs an active token.");
  // Persist before rolling so manual clicks, turn-end hooks and duplicate
  // socket deliveries all claim the same turn exactly once.
  await effect.setFlag(ID,"blink",{...state,rolledTurns:[...(state.rolledTurns??[]),turnStamp].slice(-30),rolling:true});
  const roll=await new CONFIG.Dice.BasicRoll("1d6",actor.getRollData?.()??{}).evaluate();
  const card=await roll.toMessage({type:"generic",speaker:ChatMessage.getSpeaker({actor,token,scene:token.parent}),flavor:"Blink — End-of-turn check",system:{origin:state.card},flags:{[ID]:{blinkRoll:{effect:effect.uuid,instance:state.instance,turn:turnStamp}}}});
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  const current=stateOf(effect);if(!active(effect)||current?.instance!==state.instance)return;
  const vanished=Number(roll.total)>=4;
  let position=null;
  if(vanished){
   position={token:token.uuid,x:token.x,y:token.y};
   const native=foundry.utils.deepClone(CONFIG.statusEffects?.ethereal??{});delete native.id;delete native._id;
   await actor.createEmbeddedDocuments("ActiveEffect",[{...native,name:"Blink — Ethereal",img:native.img??"systems/dnd5e/icons/svg/statuses/ethereal.svg",disabled:false,transfer:false,statuses:["ethereal"],system:{...native.system,changes:native.system?.changes??[]},duration:{value:null,units:"seconds",expiry:null,expired:false},flags:{...native.flags,dnd5e:{...native.flags?.dnd5e,isTemporary:true},[ID]:{blinkEthereal:state.instance}}}]);
  }
  await effect.setFlag(ID,"blink",{...current,rolling:false,lastResult:Number(roll.total),vanished:position});
  const cast=game.messages.get(state.card);if(cast)await cast.setFlag(ID,"blinkReturn",null);await refresh(current);
 });
}
export async function requestBlinkRoll(card,user=game.user){
 if(!authority()||!user?.active)return;
 const ref=card?.getFlag?.(ID,"blinkTracker"),effect=ref?await fromUuid(ref):null,actor=effect?.parent;
 if(!active(effect)||!actor||(!user.isGM&&!actor.testUserPermission(user,"OWNER")))return;
 const combat=game.combat;if(!combat?.started||combat.combatant?.actor?.uuid!==actor.uuid)return;
 await rollBlink(effect,stamp(combat),combat.combatant.token);
}
export async function processBlinkTurn(combat,changes){
 if(!authority()||!combat.started||!("turn" in changes||"round" in changes||changes.started===true))return;
 const incoming=combat.combatant,prior=combat.previous;
 if(enabled()&&changes.started!==true&&prior?.combatantId&&(prior.combatantId!==incoming?.id||prior.round!==combat.round)){
  const outgoing=combat.combatants.get(prior.combatantId),effect=trackerFor(outgoing?.actor);if(effect)await rollBlink(effect,stamp(combat,prior),outgoing.token);
 }
 const effect=trackerFor(incoming?.actor);if(effect)await serial(effect,()=>returnFromBlink(effect));
}
export async function cleanupBlinkEffect(effect){
 if(!authority()||!stateOf(effect))return;
 if(active(effect))return;
 tracked.delete(effect.uuid);await serial(effect,()=>returnFromBlink(effect,{ending:true}));
}
export function renderBlink(card,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const entries=[{card,root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),root:node}))];
 for(const entry of entries){const message=entry.card;if(!message?.getFlag?.(ID,"blinkCast")||message.isContentVisible===false)continue;
  entry.root.querySelectorAll('[data-rsa-blink]').forEach(node=>node.remove());
  entry.root.querySelectorAll('[data-action="rollFormula"],[data-forward-action="rollFormula"],effect-application').forEach(node=>node.hidden=true);
  const ref=message.getFlag(ID,"blinkTracker"),effect=ref?fromUuidSync(ref,{strict:false}):null,state=stateOf(effect),actor=effect?.parent;
  const box=document.createElement("div");box.dataset.rsaBlink="";box.style.cssText="padding:8px;display:grid;gap:6px";
  const text=document.createElement("p"),returned=message.getFlag(ID,"blinkReturn");
  text.textContent=!active(effect)?"Blink ended.":state?.rolling?"Blink — rolling…":state?.vanished?"Ethereal until your next turn. Your token remains visible for tracking.":state?.lastResult?"Blink: "+state.lastResult+" — remained on this plane.":"Blink ready — roll before ending your turn, or let turn end roll automatically.";
  if(!effect)text.textContent=ref?"Blink ended.":"Preparing Blink…";box.append(text);
  if(returned){const note=document.createElement("p");note.textContent="Return from Blink: choose an unoccupied space you can see within 10 feet of where you vanished (nearest available space if none). Move the token manually.";box.append(note);}
  if(active(effect)&&(game.user.isGM||actor?.isOwner)){
   const button=document.createElement("button");button.type="button";button.textContent="Roll Blink";
   button.disabled=!game.combat?.started||game.combat.combatant?.actor?.uuid!==actor.uuid||state.rolling||state.rolledTurns?.includes(stamp(game.combat));
   button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{if(authority())await requestBlinkRoll(message);else game.socket.emit("module."+ID,{action:"requestBlinkRoll",card:message.id,user:game.user.id,gm:game.users.activeGM?.id});}catch(error){report(error);}});box.append(button);
  }
  (entry.root.querySelector('.chat-card')??entry.root).append(box);
 }
}
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.preUseActivity",prepareBlink);
 for(const name of ["createChatMessage","updateChatMessage"])Hooks.on(name,card=>{registerBlinkCast(card).catch(report);});
 Hooks.on("updateCombat",(combat,changes)=>{processBlinkTurn(combat,changes).then(()=>{for(const subject of [combat.combatant,combat.combatants.get(combat.previous?.combatantId)]){const effect=trackerFor(subject?.actor);if(effect)refresh(stateOf(effect)).catch(report);}}).catch(report);});
 Hooks.on("dnd5e.renderChatMessage",renderBlink);
 Hooks.on("createActiveEffect",effect=>{if(stateOf(effect)){tracked.add(effect.uuid);refresh(stateOf(effect)).catch(report);}});
 Hooks.on("updateActiveEffect",effect=>{if(stateOf(effect)){tracked.add(effect.uuid);cleanupBlinkEffect(effect).catch(report);refresh(stateOf(effect)).catch(report);}});
 Hooks.on("deleteActiveEffect",effect=>{if(stateOf(effect)&&authority()){tracked.delete(effect.uuid);serial(effect,()=>returnFromBlink(effect,{ending:true})).catch(report);}});
 const actors=new Map([...Array.from(game.actors??[]),...Array.from(globalThis.canvas?.tokens?.placeables??[],t=>t.actor).filter(Boolean)].map(a=>[a.uuid,a]));
 for(const actor of actors.values())for(const effect of actor.effects??[])if(stateOf(effect))tracked.add(effect.uuid);
 Hooks.on("updateWorldTime",()=>{if(!authority())return;for(const uuid of tracked){const effect=fromUuidSync(uuid,{strict:false});if(!effect){tracked.delete(uuid);continue;}if(!active(effect))cleanupBlinkEffect(effect).catch(report);}});
 game.socket.on("module."+ID,packet=>{if(packet?.action==="requestBlinkRoll"&&authority()&&packet.gm===game.user.id){const user=game.users.get(packet.user),card=game.messages.get(packet.card);if(card)requestBlinkRoll(card,user).catch(report);}});
});
