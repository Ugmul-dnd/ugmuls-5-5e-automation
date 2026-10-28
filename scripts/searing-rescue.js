import {searingTurnEnded} from "./searing-vengeance.js";
import {createEventQueue,describeTarget,isEligibleTarget,hasEquivalentActiveEffect} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),areas=new Map(),regions=new Map();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
const enabled=()=>game.settings.get(ID,"searingVengeanceAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export const searingActivity=a=>enabled()&&a?.type==="damage"&&a.item?.type==="feat"&&(a.item.identifier??a.item.system?.identifier)==="searing-vengeance";
function distance(a,b){const size=a.parent.grid.size,scale=/^(m|meters?|metres?)$/i.test(a.parent.grid.units??"ft")?0.3048:1;const d=globalThis.canvas?.grid?.measurePath?.([{x:a.x+a.width*size/2,y:a.y+a.height*size/2},{x:b.x+b.width*size/2,y:b.y+b.height*size/2}])?.distance;return {distance:d,scale};}
export function validSearingRescue(source,target){
 if(!source?.actor||!target?.actor||source.parent?.id!==target.parent?.id||Number(target.actor.system?.attributes?.hp?.value)!==0||target.actor.statuses?.has("dead"))return false;
 if(target.actor.uuid!==source.actor.uuid&&(target.disposition!==source.disposition||source.disposition===0))return false;
 const measured=distance(source,target);return Number.isFinite(measured.distance)&&measured.distance<=60*measured.scale;
}
export function prepareSearingRescue(activity,usage,dialog,message){
 if(!searingActivity(activity))return;const chosen=values(game.user.targets).map(t=>t.document??t),origin=activity.getUsageToken?.(),source=origin?.document??origin;
 if(chosen.length!==1||!validSearingRescue(source,chosen[0])){ui.notifications.warn("Searing Vengeance: target exactly one ally (or yourself) at 0 HP within 60 feet before using the feature.");return false;}
 const target=chosen[0],record={token:target.uuid,caster:activity.actor.uuid,source:source.uuid};usage.create={...usage.create,measuredTemplate:true};dialog.options??={};dialog.options.display={...dialog.options.display,creation:false};
 message.data??={};message.data.system={...message.data.system,targets:[describeTarget(target)]};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],searingRescue:record};activity.item.updateSource({["flags."+ID+".searingRescue"]:record});
 const scale=activity._prepareUsageScaling;activity._prepareUsageScaling=async function(config,...args){if(!validSearingRescue(resolve(record.source),resolve(record.token)))throw Error("Searing Vengeance’s chosen ally must still be at 0 HP within 60 feet.");config.create={...config.create,measuredTemplate:true};return scale.call(this,config,...args);};
}
export function prepareSearingPlacement(activity,config){if(!searingActivity(activity))return;const record=flag(activity.item,"searingRescue");if(record)config.rsaSearingTarget=record.token;}
export function installSearingPlacement(Placement){
 if(!Placement||Placement.rsaSearingPlacement)return;Placement.rsaSearingPlacement=true;const place=Placement.place;
 Placement.place=function(config){
  if(!config.rsaSearingTarget)return place.call(this,config);const token=resolve(config.rsaSearingTarget);if(!token)throw Error("Searing Vengeance’s rescue token is unavailable.");const size=token.parent.grid.size,scale=size/token.parent.grid.distance;
  return Promise.resolve(config.shapes.map(shape=>({type:"circle",x:token.x+token.width*size/2,y:token.y+token.height*size/2,radius:Number(shape.size)*scale})));
 };
}
export function markSearingAreas(activity,data){
 if(!searingActivity(activity))return;const record=flag(activity.item,"searingRescue");if(!record)return;const combat=game.combat,applied=combat?.started?{combat:combat.id,round:combat.round,turn:combat.turn,combatant:combat.combatant?.id}:null;
 for(const region of data){region.flags??={};region.flags[ID]={...region.flags[ID],searingVengeanceArea:{...record,applied}};}
}
export function validateSearingEnemies(activity,message,targets){
 const record=flag(message,"searingRescue")??flag(activity.item,"searingRescue"),source=resolve(record?.source),rescue=resolve(record?.token);if(!source||!rescue)return [];
 const placed=areas.get(message.id)??values(regions).filter(r=>flag(r,"searingVengeanceArea")?.token===record.token&&flag(r,"searingVengeanceArea")?.caster===record.caster),enemy=source.disposition===1?-1:1;
 return targets.filter(t=>{const token=resolve(t.token);if(!token||!isEligibleTarget(token)||token.disposition!==enemy||token.uuid===record.token)return false;
  return placed.length?placed.some(r=>token.testInsideRegion?.(r)):distance(rescue,token).distance<=30*distance(rescue,token).scale;
 });
}
export async function healSearingRescue(card,user=game.user){
 if(!authority()||!enabled()||!card||flag(card,"searingRescueHealed")||flag(card,"targetsConfirmationPending")||flag(card,"targetsConfirmationCanceled"))return;
 const record=flag(card,"searingRescue"),caster=resolve(record?.caster),target=resolve(record?.token),source=resolve(record?.source),feature=card.getAssociatedItem?.();
 if(!caster||!target?.actor||!user?.active||!user.isGM&&!caster.testUserPermission(user,"OWNER")||(feature?.identifier??feature?.system?.identifier)!=="searing-vengeance"||feature.actor?.uuid!==caster.uuid)return;
 if(!validSearingRescue(source,target))throw Error("Searing Vengeance healing needs the recorded ally still at 0 HP within 60 feet.");
 const hp=target.actor.system.attributes.hp,max=Number(hp.effectiveMax??Number(hp.max)+Number(hp.tempmax??0)),amount=Math.floor(max/2);if(!Number.isFinite(amount)||amount<0)throw Error("The rescued creature has no valid maximum HP.");
 await card.setFlag(ID,"searingRescueHealed",{token:target.uuid,amount});
 const id=foundry.utils.randomID(),data={name:"Searing Vengeance — Rescue",type:"feat",img:feature.img,system:{identifier:"searing-vengeance-rescue",activities:{[id]:{_id:id,type:"heal",activation:{type:"special"},consumption:{spellSlot:false,targets:[]},range:{units:"any"},target:{prompt:false,affects:{type:"creature",count:"1"},template:{type:""}},healing:{types:["healing"],custom:{enabled:true,formula:String(amount)}}}}}};
 const helper=new CONFIG.Item.documentClass(data,{parent:caster});helper.prepareFinalAttributes?.();const flags={[ID]:{riderTriggered:true,manualDamageWorkflow:true,activityOverrideData:data,searingRescueHeal:{source:card.id,target:target.uuid}},dnd5e:{item:{data}}};let healing;
 const capture=result=>{const origin=result.system?.origin,originId=typeof origin==="string"?origin.replace(/^ChatMessage\./,""):origin?.id;if(["healing","damage"].includes(result.type)&&originId===card.id&&flag(result,"searingRescueHeal")&&result.rolls?.length&&!flag(result,"pendingDamage"))healing=result;};
 const hooks=["createChatMessage","updateChatMessage"].map(event=>[event,Hooks.on(event,capture)]);
 try{await helper.system.activities.get(id).rollDamage({isCritical:false},{configure:false},{data:{system:{origin:card.id,targets:[describeTarget(target)]},flags}});}finally{for(const[event,hook]of hooks)Hooks.off(event,hook);}
 if(!healing)throw Error("Searing Vengeance’s rescue healing card is in chat; apply it manually.");
 await target.actor.applyDamage([{type:"healing",value:amount}],{origin:healing,originatingMessage:healing,rsaSearingRescueGrant:true});await healing.setFlag(ID,"hpApplicationRecorded",true);globalThis.Ugmuls55eAutomationChatRefresh?.card(healing);
}

export async function applySearingBlind(card){
 if(!authority()||!enabled()||game.settings.get(ID,"autoApplyHitEffects")!==true||card?.type!=="damage"||!card.rolls?.length||flag(card,"pendingDamage")||flag(card,"searingRescueHeal"))return;
 const ref=card.system?.origin,usage=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 if(flag(usage,"manualDamageWorkflow")&&flag(usage,"effectApplyReopened"))return;
 if(!flag(usage,"searingRescue")||flag(usage,"targetsConfirmationPending")||flag(usage,"targetsConfirmationCanceled"))return;
 const activity=usage.getAssociatedActivity?.({scaled:true});if(!searingActivity(activity))return;
 const applied=flag(usage,"searingVengeanceCast");if(applied&&(game.combat?.id!==applied.combat||searingTurnEnded(game.combat,applied)))return;
 const effects=values(await activity.getApplicableEffects?.()).filter(e=>values(e.statuses).includes("blinded"));if(!effects.length)return;
 const targets=validateSearingEnemies(activity,usage,card.system?.targets??[]),prior=new Set(flag(card,"searingBlindApplications")??[]);
 if(!targets.length||targets.every(t=>effects.every(e=>prior.has(t.token+"|"+e.uuid))))return;
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 if(game.settings.get(ID,"autoApplyHitEffects")!==true||applied&&(game.combat?.id!==applied.combat||searingTurnEnded(game.combat,applied)))return;
 const tray=document.createElement("effect-application");tray.chatMessage=usage;
 for(const target of validateSearingEnemies(activity,usage,card.system?.targets??[])){
  const actor=resolve(target.token)?.actor;if(!actor)continue;
  for(const effect of effects){const key=target.token+"|"+effect.uuid;if(prior.has(key))continue;
   if(!hasEquivalentActiveEffect(actor,effect)){const result=await globalThis.Ugmuls55eAutomationEffectUndo.apply(card,usage,effect,actor,tray);if(!result)continue;}
   prior.add(key);await card.setFlag(ID,"searingBlindApplications",[...prior]);
  }
 }
 if(targets.every(t=>effects.every(e=>prior.has(t.token+"|"+e.uuid)))){await card.setFlag(ID,"outcomeEffectsApplied",true);await usage.setFlag(ID,"outcomeEffectsApplied",true);}
 globalThis.Ugmuls55eAutomationChatRefresh?.card(card);globalThis.Ugmuls55eAutomationChatRefresh?.card(usage);
}

function requestHeal(card){
 if(!flag(card,"searingRescue")||card.author?.id!==game.user.id)return;
 const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"searingRescueHeal",card:card.id,user:game.user.id,gm:gm.id});else enqueue(()=>healSearingRescue(card)).catch(report);
}
async function cleanupAreas(combat,changes={},ending=false){
 if(!authority()||!ending&&!("turn"in changes||"round"in changes))return;
 for(const [uuid,region]of regions){const mark=flag(region,"searingVengeanceArea")?.applied;if(mark?.combat!==combat.id)continue;const passed=combat.round>mark.round||combat.round===mark.round&&combat.combatant?.id!==mark.combatant&&(combat.turn>mark.turn||combat.previous?.combatantId===mark.combatant);if(ending||passed){if(region.parent?.regions?.get?.(region.id))await region.delete();regions.delete(uuid);}}
}
function report(error){console.error("Searing Vengeance rescue",error);ui.notifications.error(error.message);}
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationSearing={isActivity:searingActivity,validateTargets:validateSearingEnemies};installSearingPlacement(globalThis.dnd5e?.canvas?.TemplatePlacement);
 Hooks.on("dnd5e.preUseActivity",prepareSearingRescue);Hooks.on("dnd5e.preCreateMeasuredTemplate",prepareSearingPlacement);Hooks.on("dnd5e.createMeasuredTemplate",markSearingAreas);
 Hooks.on("dnd5e.postUseActivity",(activity,usage,result)=>{if(searingActivity(activity)&&result?.message)areas.set(result.message.id,result.templates??[]);});
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{const ref=card.system?.origin,usage=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;if(card.type==="damage"&&flag(usage,"searingRescue"))enqueue(()=>applySearingBlind(card)).catch(report);});
 Hooks.on("ugmuls55eAutomation.targetsConfirmed",requestHeal);Hooks.on("deleteChatMessage",card=>areas.delete(card.id));
 for(const scene of values(game.scenes))for(const region of values(scene.regions))if(flag(region,"searingVengeanceArea"))regions.set(region.uuid,region);
 Hooks.on("createRegion",region=>{if(flag(region,"searingVengeanceArea"))regions.set(region.uuid,region);});Hooks.on("deleteRegion",region=>regions.delete(region.uuid));
 Hooks.on("updateCombat",(combat,changes)=>enqueue(()=>cleanupAreas(combat,changes)).catch(report));Hooks.on("deleteCombat",combat=>enqueue(()=>cleanupAreas(combat,{},true)).catch(report));
 game.socket.on("module."+ID,packet=>{if(packet?.action!=="searingRescueHeal"||!authority()||packet.gm!==game.user.id)return;const card=game.messages.get(packet.card),user=game.users.get(packet.user);if(card&&user?.active)enqueue(()=>healSearingRescue(card,user)).catch(report);});
});
