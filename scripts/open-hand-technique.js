import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",choices=new WeakMap(),enqueue=createEventQueue(),values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const options={addle:{id:"1jdSaWanuRrdkVs3",label:"Addle"},push:{id:"XoaS0RtDCGAqrQsf",label:"Push"},topple:{id:"5Qgc0K3TfuonkPIG",label:"Topple"}};
const enabled=()=>game.settings.get(ID,"openHandTechniqueAutomation")===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
export const openHandFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="open-hand-technique"&&i.system?.source?.rules!=="2014");
export function openHandContext(app){
 const data=app.message?.data??{},card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),ref=data.flags?.[ID]?.damageAttackId??flag(card,"damageAttackId"),attack=game.messages.get(ref),actor=app.config?.subject?.actor??app.config?.subject?.item?.actor,feature=openHandFeature(actor);
 const targets=data.system?.targets??card?.system?.targets??[],target=targets.length===1?resolve(targets[0].token):null,activity=app.config?.subject,item=activity?.item;
 const unarmed=activity?.type==="attack"&&(["empowered-strikes","empowered-strike","unarmed-strike"].includes(key(item))||/^(empowered|unarmed) strikes?$/i.test(item?.name??""));
 const flurry=flag(attack,"flurryOfBlows");
 return enabled()&&feature&&actor?.isOwner&&unarmed&&flurry?.actor===actor.uuid&&target?.actor&&attack.system?.evaluatedTargets?.some(t=>t.token===target.uuid&&t.isMiss===false)?{actor,feature,target,attack}:null;
}
export function addOpenHandChoice(app){
 const c=openHandContext(app);if(!c||app.element.querySelector('[data-rsa-open-hand]'))return;
 const group=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"openHand",label:"Open Hand Technique"});if(!group)return;group.dataset.rsaOpenHand="";
 const select=document.createElement("select");select.setAttribute("aria-label","Open Hand Technique");
 for(const [value,label]of [["","None"],...Object.entries(options).map(([k,v])=>[k,v.label])]){const option=document.createElement("option");option.value=value;option.textContent=label;select.append(option);}
 select.value=choices.get(app)??"";select.addEventListener("change",event=>{event.stopPropagation();choices.set(app,select.value);});group.querySelector("select").replaceWith(select);
}
export function finalizeOpenHand(app,rolls){
 const choice=choices.get(app);if(!choice){if(app.message?.data?.flags?.[ID])app.message.data.flags[ID].openHandTechnique=null;return rolls;}
 const c=openHandContext(app);if(!c||!options[choice])throw Error("Open Hand Technique requires a confirmed Flurry hit and the owned feature.");
 app.message.data.flags??={};app.message.data.flags[ID]??={};app.message.data.flags[ID].openHandTechnique={choice,actor:c.actor.uuid,feature:c.feature.uuid,target:c.target.uuid,attack:c.attack.id};return rolls;
}
export function prepareOpenHand(item,choice){
 const spec=options[choice],activity=values(item.system?.activities).find(a=>a.id===spec?.id||a.name===spec?.label);if(!activity)throw Error("Open Hand Technique is missing its native activity.");
 const data=item.toObject(),id=activity.id,use=data.system.activities[id];data.name="Open Hand Technique — "+spec.label;data.system.activities={[id]:use};
 use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};use.range={override:true,units:"any"};
 if(choice!=="addle")use.damage={...use.damage,parts:[],onSave:"none"};
 const ids=new Set(values(use.effects).map(e=>e._id));data.effects=values(data.effects).filter(e=>ids.has(e._id));
 for(const effect of data.effects){effect.disabled=false;effect.transfer=false;if(choice==="addle"){effect.duration={value:null,units:"seconds",expiry:null,expired:false};effect.flags??={};effect.flags.dnd5e={...effect.flags.dnd5e,isTemporary:true};effect.flags[ID]={...effect.flags[ID],openHandAddle:{combat:game.combat?.id,round:game.combat?.round,turn:game.combat?.turn}};}else{effect.duration={value:null,units:"seconds",expiry:null,expired:false};}}
 use.effects=values(use.effects).map(e=>({...e,onSave:false}));use.appliedEffects=data.effects.map(e=>e._id);return{data,id};
}
export function resolveOpenHand(card){return enqueue(async()=>{
 const job=flag(card,"openHandTechnique");if(!authority()||!enabled()||card?.type!=="damage"||flag(card,"pendingDamage")||!card.rolls?.length||!job||flag(card,"openHandResolved"))return;
 if(globalThis.Ugmuls55eAutomationStunning?.stunningSaveReady(card)===false||globalThis.Ugmuls55eAutomationGrapple?.grappleSaveReady(card)===false)return;
 const stun=game.messages.get(flag(card,"stunningStrikeSave"));
 if(stun&&game.settings.get(ID,"autoApplySavedEffects")===true&&stun.system?.outcomes?.get(flag(stun,"stunningStrike")?.targetToken)==="failure"&&!flag(stun,"outcomeEffectsApplied"))return;
 const actor=card.getAssociatedActor?.(),feature=openHandFeature(actor),attack=game.messages.get(job.attack),target=resolve(job.target),flurry=flag(attack,"flurryOfBlows");
 if(actor?.uuid!==job.actor||feature?.uuid!==job.feature||flurry?.actor!==actor.uuid||!target?.actor||!card.system?.targets?.some(t=>t.token===target.uuid)||!attack.system?.evaluatedTargets?.some(t=>t.token===target.uuid&&t.isMiss===false)||!options[job.choice])return;
 const {data,id}=prepareOpenHand(feature,job.choice),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
 const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false}},{configure:false},{data:{system:{targets:card.system.targets},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,openHandFollowup:{source:card.id,choice:job.choice}}}}});
 if(!result?.message)throw Error("Open Hand Technique could not create its follow-up card.");
 await card.setFlag(ID,"openHandResolved",{message:result.message.id,choice:job.choice});
 if(job.choice==="addle"){
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  const activity=helper.system.activities.get(id),effects=await activity.getApplicableEffects();const tray=document.createElement("effect-application");tray.chatMessage=result.message;
  for(const effect of effects)await globalThis.Ugmuls55eAutomationEffectUndo.apply(result.message,result.message,effect,target.actor,tray);
  await result.message.setFlag(ID,"outcomeEffectsApplied",true);
 }
});}
export async function expireOpenHand(combat,changes={},ending=false){
 if(!authority()||!ending&&!("turn"in changes||"round"in changes))return;
 const actors=ending?values(combat.combatants).map(c=>c.actor):[combat.combatant?.actor];
 for(const actor of new Set(actors.filter(Boolean))){const ids=values(actor.effects).filter(e=>{const m=flag(e,"openHandAddle");return m&&m.combat===combat.id&&(ending||m.round!==combat.round||m.turn!==combat.turn);}).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);}
}
function report(error){console.error("Open Hand Technique",error);ui.notifications.error(error.message);}
export function renderOpenHand(card,html){if(flag(card,"openHandFollowup")?.choice!=="push")return;const root=html?.querySelector?html:html?.[0];if(!root||card.isContentVisible===false||root.querySelector('.rsa-open-hand-push'))return;const note=document.createElement('p');note.className='rsa-open-hand-push';note.textContent='On a failed Strength save, move the target up to 15 feet away from the Monk. Movement is manual.';root.append(note);}
Hooks.once("init",()=>game.settings.register(ID,"openHandTechniqueAutomation",{name:"Open Hand Technique",hint:"Offer Addle, Push or Topple in Flurry unarmed damage configuration. Reuse the native saves/effects without another Focus cost. Addle ends at the target’s next turn start; Push movement stays manual.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{globalThis.Ugmuls55eAutomationOpenHand={addOpenHandChoice,finalizeOpenHand};for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{resolveOpenHand(card).catch(report);const ref=card.system?.origin,origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref,link=flag(card,"stunningStrike")??flag(origin,"stunningStrike")??flag(card,"grappleStrike")??flag(origin,"grappleStrike");if(link?.damageId){const source=game.messages.get(link.damageId);if(source)resolveOpenHand(source).catch(report);}});Hooks.on("dnd5e.renderChatMessage",renderOpenHand);Hooks.on("updateCombat",(c,d)=>expireOpenHand(c,d).catch(report));Hooks.on("deleteCombat",c=>expireOpenHand(c,{},true).catch(report));});
