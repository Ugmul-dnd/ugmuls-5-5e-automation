import {createEventQueue,describeTarget,isEligibleTarget} from "./shared-activity-card.js";
import {riderConcentration,hunterMarkDie} from "./bonus-damage-riders.js";
import {weaponDamageApplied} from "./psionic-strike.js";
import {redirectRangePoints} from "./deflect-attacks.js";
import {bindFuryTargets} from "./genie-elemental-smite.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
const enabled=()=>game.settings.get(ID,"superiorHunterPreyAutomation")===true,stamp=()=>game.combat?.started?game.combat.id+":"+game.combat.round+":"+game.combat.turn:null;
export const superiorPreyFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&i.system?.source?.rules!=="2014"&&(key(i)==="superior-hunters-prey"||/^superior hunter['’]s prey$/i.test(i.name??"")));
export function previousMarkRolls(card){
 const item=card?.getAssociatedActivity?.()?.item??card?.getAssociatedItem?.(),native=["hunters-mark","foe-slayer"].includes(key(item));
 return values(card?.rolls).filter(r=>r._evaluated&&Number.isFinite(r.total)&&(r.options?.rsaBonusRider==="hunters-mark"||/^hunter['’]s mark$/i.test(r.options?.flavor??"")||native&&r.options?.type==="force"));
}
export function reusedMarkRolls(card){
 return previousMarkRolls(card).map(original=>{
  const data=structuredClone(original.toJSON());data.options={...data.options,type:"force",types:["force"],rsaSuperiorPreyReused:true};
  // Deserializing an evaluated DamageRoll retains every original die/result.
  // Do not evaluate it or run the damage-roll configuration pipeline again.
  return CONFIG.Dice.DamageRoll.fromData(data);
 });
}
export function superiorPreyUsed(actor){return !!stamp()&&flag(actor,"superiorPreyTurn")?.turn===stamp();}
export function superiorPreyContext(card,user=game.user){
 if(!enabled()||card?.type!=="damage"||card.isContentVisible===false||flag(card,"pendingDamage")||flag(card,"superiorPreyDamage")||flag(card,"superiorPreyUsed")||!card.rolls?.some(r=>r._evaluated)||flag(card,"superiorPreyDamageTurn")!==stamp())return null;
 const markRolls=previousMarkRolls(card);if(!markRolls.length)return null;
 const activity=card.getAssociatedActivity?.(),actor=card.getAssociatedActor?.()??activity?.actor,feature=superiorPreyFeature(actor),concentration=riderConcentration(actor,"hunters-mark"),mark=actor?.getFlag?.(ID,"damageRiders.hunters-mark");
 if(!feature||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||superiorPreyUsed(actor)||!concentration||mark?.concentration!==concentration.uuid)return null;
 const target=resolve(mark.token),associated=card.getAssociatedToken?.()??activity?.getUsageToken?.()??actor.token,source=associated?.document??associated;
 if(!target?.actor||!source?.actor||source.actor.uuid!==actor.uuid||source.parent?.id!==target.parent?.id||!card.system?.targets?.some(t=>t.token===target.uuid)||!weaponDamageApplied(card,target))return null;
 return{actor,feature,target,source,concentration,markRolls,turn:stamp()};
}
export function superiorPreyTargets(c,user=game.user){
 if(!c?.source?.object||c.actor.statuses?.has("blinded"))return [];
 const disposition=Number(c.source.disposition);if(!Number.isFinite(disposition)||disposition===0)return [];
 const scene=c.target.parent,limit=/^(m|meters?|metres?)$/i.test(scene.grid?.units??"ft")?9.144:30;
 return values(scene.tokens).filter(t=>{
  const other=Number(t.disposition);if(!Number.isFinite(other)||other===0||Math.sign(other)===Math.sign(disposition))return false;
  if(!t.actor||["group","vehicle"].includes(t.actor.type)||t.actor.uuid===c.actor.uuid||t.actor.uuid===c.target.actor.uuid||t.hidden||!isEligibleTarget(t)||!t.object||!user.isGM&&t.object.visible===false)return false;
  const points=redirectRangePoints(c.target,t),sight=redirectRangePoints(c.source,t);if(!points||!sight)return false;
  const distance=globalThis.canvas?.grid?.measurePath(points)?.distance;
  return Number.isFinite(distance)&&distance<=limit+1e-6&&!c.source.object.checkCollision?.(sight[1],{origin:sight[0],type:"sight",mode:"any"});
 });
}
export function buildSuperiorPrey(item,actor,markRolls=null){
 const data=item.toObject(),native=values(item.system?.activities).find(a=>a.type==="damage"),id=native?.id,use=data.system.activities[id];if(!use)throw Error("Superior Hunter's Prey needs its native damage activity.");
 data.system.activities={[id]:use};data.effects=[];data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};if(use.flags?.dnd5e)delete use.flags.dnd5e.dependentOn;
 use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.effects=[];use.appliedEffects=[];use.range={override:true,units:"any"};use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};
 use.damage={critical:{allow:false},parts:[{custom:{enabled:true,formula:markRolls?String(markRolls.reduce((n,r)=>n+r.total,0)):hunterMarkDie(actor)},types:["force"],number:null,denomination:0,bonus:"",scaling:{mode:""}}]};return{data,id};
}
export function refreshSuperiorPreyBars(card){
 const link=flag(card,"superiorPreyDamage"),applied=flag(card,"superiorPreyApplied");
 if(card?.type!=="damage"||!applied||!link?.target||!card.system?.targets?.some(t=>t.token===link.target))return false;
 // Resolve the current canvas object after the HP/TokenDelta update, rather
 // than retaining a pre-damage token object from the selector.
 const token=resolve(link.target)?.object;if(!token)return false;
 if(token.renderFlags?.set)token.renderFlags.set({refreshBars:true});else token.drawBars?.();return true;
}
export async function applySuperiorPreyDamage(card,target){
 if(card.system?.targets?.length!==1||card.system.targets[0].token!==target.uuid)throw Error("The extra damage target changed. Apply its rolled damage manually from the card.");
 const holder=document.createElement("div");holder.dataset.messageId=card.id;holder.style.display="none";const tray=document.createElement("damage-application");holder.append(tray);document.body.append(holder);
 try{
  if(!tray.targetList||typeof tray._onApplyDamage!=="function")throw Error("The copied damage is ready. Apply it manually from its damage card.");
  card._targetState??={mode:"targeted",checked:new Map()};card._targetState.mode="targeted";card._targetState.checked??=new Map();card._targetState.checked.clear();card._targetState.checked.set(target.uuid,true);
  tray.open=true;tray.targetList.targetingMode="targeted";tray.visible=true;tray.targetList.suspended=false;tray.targetList.visible=true;tray.targetList.buildTargetsList();
  await tray._onApplyDamage({preventDefault(){}});
  // Publish only after native HP application and Undo recording complete.
  // Every connected client then redraws this token from its updated HP data.
  try{await card.setFlag(ID,"superiorPreyApplied",true);}catch(error){console.warn("Superior Hunter's Prey bar refresh notification",error);}
  refreshSuperiorPreyBars(card);
 }finally{holder.remove();}
}
export function useSuperiorPrey(card,targetUuid,user=game.user,{applyDamage=applySuperiorPreyDamage}={}){return enqueue(async()=>{
 const c=superiorPreyContext(card,user),selected=c&&superiorPreyTargets(c,user).find(t=>t.uuid===targetUuid);if(!c||!selected)throw Error("Superior Hunter's Prey requires applied damage to your current marked creature, a visible second creature within 30 feet and an unused turn.");
 const {actor,feature}=c,{data,id}=buildSuperiorPrey(feature,actor,c.markRolls),old=flag(actor,"superiorPreyTurn");let published=false,usage;
 try{
  await actor.setFlag(ID,"superiorPreyTurn",{turn:c.turn,source:card.id});
  const metadata={actor:actor.uuid,source:card.id,target:selected.uuid,marked:c.target.uuid,turn:c.turn,reusedTotal:c.markRolls.reduce((n,r)=>n+r.total,0)},targets=[describeTarget(selected)],flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,manualDamageWorkflow:true,activityOverrideData:data,superiorPreyDamage:metadata}};
  const helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();const activity=helper.system.activities.get(id);
  const result=await activity.use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{system:{targets},flags}});usage=result?.message;if(!usage)throw Error("Superior Hunter's Prey could not create its damage card.");
  const rolls=reusedMarkRolls(card);if(!rolls.length)throw Error("The original card has no recorded Hunter's Mark damage to reuse.");
  const damage=await CONFIG.Dice.DamageRoll.toMessage(rolls,{type:"damage",flavor:"Superior Hunter's Prey — Reused Hunter's Mark Damage",speaker:card.speaker??ChatMessage.getSpeaker({actor}),whisper:values(card.whisper).map(u=>typeof u==="string"?u:u.id),blind:card.blind??false,sound:null,system:{...activity.messageSources,origin:usage.id,targets},flags:{...flags,"dice-so-nice":{skip:true}}});
  if(!damage?.id)throw Error("Could not create the copied Hunter's Mark damage card. Its turn use was not spent.");published=true;
  await card.setFlag(ID,"superiorPreyUsed",{...metadata,message:damage.id});
  await applyDamage(damage,selected);return damage;
 }finally{
  if(!published){if(old===undefined)await actor.unsetFlag(ID,"superiorPreyTurn");else await actor.setFlag(ID,"superiorPreyTurn",old);}
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
 }
});}
export async function chooseSuperiorPrey(card){
 const c=superiorPreyContext(card),choices=superiorPreyTargets(c);if(!choices.length){ui.notifications.warn("No eligible visible enemies within 30 feet of the marked target.");return null;}
 const esc=s=>foundry.utils.escapeHTML(String(s));
 const content='<p>Choose one enemy within 30 feet of <strong>'+esc(c.target.name)+'</strong>. Select here or target it on the map. Confirm to apply the Hunter’s Mark damage already rolled.</p><div style="max-height:320px;overflow-y:auto">'+choices.map((t,i)=>'<label style="display:flex;align-items:center;gap:8px;padding:5px"><input type="radio" name="genie-target" value="'+i+'"><span>'+esc(t.name)+'</span></label>').join('')+'</div>';
 let cleanup=()=>{},selected;
 try{selected=await foundry.applications.api.DialogV2.wait({window:{title:"Superior Hunter's Prey"},position:{width:410},content,render:(_e,dialog)=>{cleanup();cleanup=bindFuryTargets(dialog.element,choices);},buttons:[{action:"use",label:"Confirm & Apply Damage",default:true,callback:(_e,button)=>{const checked=button.form.querySelector('[name="genie-target"]:checked');return checked?choices[Number(checked.value)]?.uuid:null;}},{action:"cancel",label:"Cancel",callback:()=>null}],close:()=>null,rejectClose:false});}finally{cleanup();}return selected??null;
}
async function requestSuperiorPrey(card){const target=await chooseSuperiorPrey(card);if(!target)return;const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"superiorHunterPrey",card:card.id,target,user:game.user.id,gm:gm.id});else if(game.user.isGM)await useSuperiorPrey(card,target);else throw Error("A connected GM is required to apply Superior Hunter's Prey damage.");}
export function renderSuperiorPrey(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).map(node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const{card,node}of entries){node.querySelectorAll(':scope > .rsa-superior-prey').forEach(n=>n.remove());if(!superiorPreyContext(card))continue;const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-superior-prey";const button=document.createElement("button");button.type="button";button.textContent="Superior Hunter's Prey";button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await requestSuperiorPrey(card);}catch(error){report(error);}finally{button.disabled=false;globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});controls.append(button);node.append(controls);}
}
function report(error){console.error("Superior Hunter's Prey",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"superiorHunterPreyAutomation",{name:"Superior Hunter's Prey Assistance",hint:"After dealing damage to your marked creature, select a different visible creature within 30 feet of it. Sync selection with map targeting, then confirm to reuse and apply the original Hunter's Mark damage once per turn, including its already-rolled Foe Slayer or critical damage. No extra attack or resource cost.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("updateChatMessage",(card,changes)=>{if(Object.hasOwn(changes.flags?.[ID]??{},"superiorPreyApplied")||Object.hasOwn(changes,"flags."+ID+".superiorPreyApplied"))refreshSuperiorPreyBars(card);});
 Hooks.on("preCreateChatMessage",card=>{if(enabled()&&card.type==="damage"&&superiorPreyFeature(card.getAssociatedActor?.()))card.updateSource({["flags."+ID+".superiorPreyDamageTurn"]:stamp()});});Hooks.on("dnd5e.renderChatMessage",renderSuperiorPrey);
 for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect","updateCombat","updateActor","updateItem","deleteItem"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("superiorHunterPrey",doc,changes));
 game.socket.on("module."+ID,packet=>{if(packet?.action==="superiorHunterPreyError"&&packet.user===game.user.id){ui.notifications.error(packet.error);return;}if(packet?.action!=="superiorHunterPrey"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gm!==game.user.id)return;const user=game.users.get(packet.user),card=game.messages.get(packet.card);if(user?.active&&card)useSuperiorPrey(card,packet.target,user).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"superiorHunterPreyError",user:user.id,error:error.message});});});
});
