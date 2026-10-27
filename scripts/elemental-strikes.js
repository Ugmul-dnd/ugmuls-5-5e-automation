import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),choices=new WeakMap(),values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,types=new Set(["acid","cold","fire","lightning","thunder"]);
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const enabled=()=>game.settings.get(ID,"elementalStrikesAutomation")===true;
export const elementalFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="elemental-attunement"&&i.system?.source?.rules!=="2014");
export function elementalContext(app){
 const data=app.message?.data??{},pending=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),activity=app.config?.subject,actor=activity?.actor??activity?.item?.actor,feature=elementalFeature(actor);
 const id=data.flags?.[ID]?.damageAttackId??flag(pending,"damageAttackId"),ref=data.system?.origin??pending?.system?.origin,origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 const attack=(id?game.messages.get(id):null)??(origin?.type==="attack"?origin:values(origin?.getAssociatedRolls?.("attack")).filter(a=>a.timestamp<=(pending?.timestamp??Infinity)).sort((a,b)=>b.timestamp-a.timestamp)[0]);
 const targets=data.system?.targets?.length?data.system.targets:pending?.system?.targets??[],target=targets.length===1?resolve(targets[0].token):null;
 return enabled()&&feature&&actor?.isOwner&&activity?.type==="attack"&&(activity.id==="xCHcv0MDt4mopzrp"||/^elemental strike$/i.test(activity.name??""))&&target?.actor&&attack?.system?.evaluatedTargets?.some(t=>t.token===target.uuid&&t.isMiss===false)?{actor,feature,attack,target}:null;
}
export function addElementalChoice(app){
 if(!elementalContext(app)||app.element.querySelector('[data-rsa-elemental-motion]'))return;
 const group=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"elementalMotion",label:"Elemental Push / Pull"});if(!group)return;group.dataset.rsaElementalMotion="";
 const select=document.createElement("select");select.setAttribute("aria-label","Elemental Push / Pull");
 for(const[value,label]of [["","None"],["push","Push"],["pull","Pull"]]){const option=document.createElement("option");option.value=value;option.textContent=label;select.append(option);}
 select.value=choices.get(app)??"";select.addEventListener("change",event=>{event.stopPropagation();choices.set(app,select.value);});group.querySelector("select").replaceWith(select);
 const grapple=app.element.querySelector('[data-rsa-grapple]');if(grapple?.after)grapple.after(group);
}
export function finalizeElemental(app,rolls){
 const choice=choices.get(app);if(!choice){if(app.message?.data?.flags?.[ID])app.message.data.flags[ID].elementalMotion=null;return rolls;}
 const c=elementalContext(app);if(!c||!["push","pull"].includes(choice))throw Error("Elemental Push/Pull requires a confirmed Elemental Strike hit.");
 if(!rolls.some(r=>types.has(r.options?.type)))throw Error("Choose Acid, Cold, Fire, Lightning or Thunder damage to use Elemental Push/Pull.");
 app.message.data.flags??={};app.message.data.flags[ID]??={};app.message.data.flags[ID].elementalMotion={choice,actor:c.actor.uuid,feature:c.feature.uuid,attack:c.attack.id,target:c.target.uuid};return rolls;
}
export function prepareElementalSave(feature,choice){
 const native=values(feature.system?.activities).find(a=>a.type==="save"&&(a.id==="vUWH2QBMG6gewncl"||a.name==="Elemental Save"));if(!native)throw Error("Elemental Attunement is missing its native Strength save.");
 const data=feature.toObject(),id=native.id,use=data.system.activities[id];data.name="Elemental "+(choice==="push"?"Push":"Pull");use.name=data.name;data.effects=[];data.system.activities={[id]:use};
 // Elemental Save is normally a hidden enchantment rider. This validated
 // follow-up is standalone; retaining the rider list makes canUse false.
 data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};
 if(use.flags?.dnd5e)delete use.flags.dnd5e.dependentOn;
 use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.effects=[];use.appliedEffects=[];use.damage={parts:[],onSave:"none"};use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};use.range={override:true,units:"any"};return{data,id};
}
export function resolveElemental(card){return enqueue(async()=>{
 const job=flag(card,"elementalMotion");if(!enabled()||!authority()||card?.type!=="damage"||flag(card,"pendingDamage")||flag(card,"elementalMotionResolved")||!job||!card.rolls?.some(r=>r._evaluated&&r.total>0&&types.has(r.options?.type)))return;
 if(globalThis.Ugmuls55eAutomationStunning?.stunningSaveReady(card)===false||globalThis.Ugmuls55eAutomationGrapple?.grappleSaveReady(card)===false)return;
 const stun=game.messages.get(flag(card,"stunningStrikeSave"));if(stun&&game.settings.get(ID,"autoApplySavedEffects")===true&&stun.system?.outcomes?.get(flag(stun,"stunningStrike")?.targetToken)==="failure"&&!flag(stun,"outcomeEffectsApplied"))return;
 const actor=card.getAssociatedActor?.(),feature=elementalFeature(actor),attack=game.messages.get(job.attack),target=resolve(job.target),activity=card.getAssociatedActivity?.();
 if(actor?.uuid!==job.actor||feature?.uuid!==job.feature||!["push","pull"].includes(job.choice)||!target?.actor||!card.system?.targets?.some(t=>t.token===target.uuid)||!attack?.system?.evaluatedTargets?.some(t=>t.token===target.uuid&&t.isMiss===false)||activity?.type!=="attack"||!(activity.id==="xCHcv0MDt4mopzrp"||/^elemental strike$/i.test(activity.name??"")))return;
 const {data,id}=prepareElementalSave(feature,job.choice),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
 const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false}},{configure:false},{data:{system:{targets:card.system.targets},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,elementalMotionSave:{source:card.id,choice:job.choice}}}}});
 if(!result?.message)throw Error("Elemental Push/Pull could not create its saving throw card.");await card.setFlag(ID,"elementalMotionResolved",{message:result.message.id,choice:job.choice});
});}
function report(error){console.error("Elemental Push/Pull",error);ui.notifications.error(error.message);}
export function renderElementalMotion(card,html){const choice=flag(card,"elementalMotionSave")?.choice;if(!choice)return;const root=html?.querySelector?html:html?.[0];if(!root||card.isContentVisible===false||root.querySelector('.rsa-elemental-motion-note'))return;const note=document.createElement('p');note.className='rsa-elemental-motion-note';note.textContent='Elemental '+(choice==='push'?'Push':'Pull')+': on a failed Strength save, move the target up to 10 feet '+(choice==='push'?'away from':'toward')+' the Monk. Movement is manual.';root.append(note);}
Hooks.once("init",()=>game.settings.register(ID,"elementalStrikesAutomation",{name:"Elemental Strike Push / Pull",hint:"Offer None/Push/Pull beneath Grapple in Elemental Strike damage configuration. Elemental damage prompts the native Strength save with a direction label. No extra Focus cost; movement stays manual.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationElementalMotion={addElementalChoice,finalizeElemental};
 for(const event of ['createChatMessage','updateChatMessage'])Hooks.on(event,card=>{if(flag(card,'elementalMotion'))resolveElemental(card).catch(report);const ref=card.system?.origin,origin=typeof ref==='string'?game.messages.get(ref.replace(/^ChatMessage\./,'')):ref,link=flag(card,'stunningStrike')??flag(origin,'stunningStrike')??flag(card,'grappleStrike')??flag(origin,'grappleStrike');if(link?.damageId){const source=game.messages.get(link.damageId);if(flag(source,'elementalMotion'))resolveElemental(source).catch(report);}});
 Hooks.on('dnd5e.renderChatMessage',renderElementalMotion);
});
