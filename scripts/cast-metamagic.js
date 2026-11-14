import {sorceryResource} from "./empowered-spell.js";
import {innateSorceryActive} from "./shared-sorcerer.js";
const ID="ugmuls-5-5e-automation";
export const elements=["acid","cold","fire","lightning","poison","thunder"];
const costs={transmuted:1,heightened:2,careful:1,empowered:1,seeking:1,quickened:2,subtle:1,distant:1,extended:1,twinned:1};
const names={transmuted:"Transmuted Spell",heightened:"Heightened Spell",careful:"Careful Spell",quickened:"Quickened Spell",subtle:"Subtle Spell",distant:"Distant Spell",extended:"Extended Spell",twinned:"Twinned Spell"};
export const metamagicFeature=(actor,key)=>Array.from(actor?.items??[]).find(item=>item.type==="feat"&&
    ((item.identifier??item.system?.identifier??"").replace(/^metamagic-/,"")===key+"-spell"||
    (item.name??"").trim().replace(/^metamagic:\s*/i,"").toLowerCase()===key+" spell"));
const hasFeature=(actor,key)=>Array.from(actor?.items??[]).some(item=>
    (item.identifier??item.system?.identifier)===key||(item.name??"").toLowerCase().replace(/\s+/g,"-")===key);
export function metamagicLimit(actor){return hasFeature(actor,"sorcery-incarnate")&&innateSorceryActive(actor)?2:1;}
const ownTurn=actor=>game.combat?.started&&game.combat.combatant?.actor?.uuid===actor?.uuid?
    `${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
export function freeMetamagic(actor){const turn=ownTurn(actor);return !!turn&&hasFeature(actor,"arcane-apotheosis")&&innateSorceryActive(actor)&&actor.getFlag?.(ID,"freeMetamagicTurn")!==turn;}
const remaining=resource=>Math.max(0,Number(resource?.system?.uses?.value??(Number(resource?.system?.uses?.max??0)-Number(resource?.system?.uses?.spent??0)))||0);
export function dialogTitle(activity){
    if(!needsMetamagic(activity))return "Confirm Targets";
    const points=remaining(sorceryResource(activity.actor,metamagicFeature(activity.actor,castOptions(activity)[0])));
    return `Select Metamagic (${points} points available)`;
}
export function castingOrigin(message){
    let card=message;const seen=new Set();
    while(card&&!seen.has(card.id)){seen.add(card.id);const origin=card.system?.origin;const parent=typeof origin==="string"?game.messages.get(origin):origin;if(!parent)break;card=parent;}
    return card;
}
export const castingChoices=message=>castingOrigin(message)?.getFlag?.(ID,"metamagic");
export function quickenedUnavailable(activity){
    const actor=activity.actor,combat=game.combat;
    if(globalThis.Ugmuls55eAutomationResources?.bonusActionUsed(actor))return "Bonus Action already used.";
    const combatant=globalThis.Ugmuls55eAutomationCompanions?.effectiveCombatant(actor,combat)??Array.from(combat?.combatants??[]).find(c=>c.actor?.uuid===actor?.uuid)??(combat?.combatant?.actor?.uuid===actor?.uuid?combat.combatant:null);
    if(combat?.started&&combatant&&combatant.id!==combat.combatant?.id)return "Quickened Spell requires your own turn.";
    return "";
}
const twinnedCache=new WeakMap();
export function twinnedContext(activity){
    const item=activity?.item,affects=activity?.target?.affects;
    if(item?.type!=="spell"||Number(item.system?.level)<1||activity.target?.template?.type||!["creature","humanoid","enemy","ally"].includes(affects?.type)||typeof item.scaledClone!=="function")return null;
    const scaling=Number(item.flags?.dnd5e?.scaling??item.getFlag?.("dnd5e","scaling")??0),count=Number(affects.count);
    if(!Number.isFinite(scaling)||!Number.isInteger(count)||count<1)return null;
    const signature=JSON.stringify([scaling,count,item.system.level,item._stats?.modifiedTime,activity.actor?._stats?.modifiedTime,activity.id,affects.type,activity.target?.template?.type]);
    const cached=twinnedCache.get(activity);if(cached?.signature===signature)return cached.value;
    let value=null;
    try{const next=item.scaledClone(scaling+1).system.activities.get(activity.id),max=Number(next?.target?.affects?.count);if(Number.isInteger(max)&&max>count)value={scaling,count,max,extra:max-count};}catch{}
    twinnedCache.set(activity,{signature,value});return value;
}
const committingActors=new Set();
export const reactionSpellCast=activity=>activity?.item?.type==="spell"&&String(activity.activation?.type??activity.item.system?.activation?.type??"").startsWith("reaction");
export function castOptions(activity){
    if(activity?.item?.type!=="spell"||!activity.actor?.isOwner||reactionSpellCast(activity))return [];
    const options=[];
    if(game.settings.get(ID,"transmutedSpellAutomation")===true&&metamagicFeature(activity.actor,"transmuted")&&
        Array.from(activity.damage?.parts??[]).some(part=>Array.from(part.types??[]).some(type=>elements.includes(type))))options.push("transmuted");
    if(activity.type==="save")for(const key of ["heightened","careful"])
        if(game.settings.get(ID,key+"SpellAutomation")===true&&metamagicFeature(activity.actor,key))options.push(key);
    if(game.settings.get(ID,"quickenedSpellAutomation")===true&&metamagicFeature(activity.actor,"quickened")&&activity.activation?.type==="action")options.push("quickened");
    if(game.settings.get(ID,"twinnedSpellAutomation")===true&&metamagicFeature(activity.actor,"twinned")&&twinnedContext(activity))options.push("twinned");
    // Declaration-only options: record use and cost; range, duration and components stay table-managed.
    for(const key of ["subtle","distant","extended"])if(game.settings.get(ID,key+"SpellAutomation")===true&&metamagicFeature(activity.actor,key))options.push(key);
    return options;
}
export function needsMetamagic(activity){return !reactionSpellCast(activity)&&(castOptions(activity).length>0||globalThis.Ugmuls55eAutomationPsionic?.eligible(activity)===true);}
export function selectionSummary(actor,selection){
    const keys=Array.isArray(selection.slots)?selection.slots.filter(Boolean):Object.keys(names).filter(key=>key==="careful"?selection.careful?.length:!!selection[key]);
    const free=freeMetamagic(actor)?keys.reduce((best,key)=>!best||costs[key]>costs[best]?key:best,null):null;
    const metamagicCost=keys.reduce((sum,key)=>sum+(key===free?0:costs[key]),0),psionicCost=globalThis.Ugmuls55eAutomationPsionic?.cost(selection)??0;
    return {keys,free,cost:metamagicCost+psionicCost,metamagicCost,psionicCost,limit:metamagicLimit(actor)};
}
export function validateSelection(activity,selection,targets,{details=true}={}){
    const actor=activity.actor,available=castOptions(activity),summary=selectionSummary(actor,selection),ids=new Set(targets.map(t=>t.token));
    globalThis.Ugmuls55eAutomationPsionic?.validate(activity,selection);
    if(new Set(summary.keys).size!==summary.keys.length)throw Error("Choose a different Metamagic option in each dropdown.");
    if(summary.keys.some(key=>!available.includes(key)))throw Error("That Metamagic option is not available for this spell.");
    if(summary.keys.length>summary.limit)throw Error(`Only ${summary.limit} Metamagic option${summary.limit===1?"":"s"} can be used on this casting.`);
    if(summary.keys.includes("twinned")){
        const twin=twinnedContext(activity),base=selection.twinnedBaseTargets;
        if(!twin||targets.length>Math.min(twin.max,(base?.length??twin.count)+twin.extra))throw Error("Too many targets for Twinned Spell.");
        if(details&&(!Array.isArray(base)||!base.length||base.some(id=>!ids.has(id))||targets.length<=base.length||ids.size!==targets.length))throw Error("Keep the original targets and select an additional creature on the map for Twinned Spell.");
    }
    const quickenedBlock=summary.keys.includes("quickened")?quickenedUnavailable(activity):"";
    if(quickenedBlock)throw Error(quickenedBlock);
    if((selection.transmuted||details&&summary.keys.includes("transmuted"))&&!elements.includes(selection.transmuted))throw Error("Choose a valid elemental damage type.");
    if((selection.heightened||details&&summary.keys.includes("heightened"))&&!ids.has(selection.heightened))throw Error("The Heightened target is no longer targeted.");
    if(details&&summary.keys.includes("careful")&&!selection.careful?.length)throw Error("Choose at least one creature for Careful Spell.");
    if((selection.careful?.length??0)>Math.max(1,Number(actor.system?.abilities?.cha?.mod)||0)||new Set(selection.careful??[]).size!==(selection.careful?.length??0))throw Error("Too many Careful Spell targets.");
    if(selection.careful?.some(id=>!ids.has(id)))throw Error("A protected creature is no longer targeted.");
    if(remaining(sorceryResource(actor,metamagicFeature(actor,summary.keys[0])))<summary.cost)throw Error("Not enough Sorcery Points for this selection.");
    return summary;
}
function clearMetamagic(selection,key){if(!key)return;selection[key]=key==="careful"?[]:["transmuted","heightened"].includes(key)?"":false;}
export function chooseMetamagic(activity,selection,index,key){
    const limit=metamagicLimit(activity.actor);
    if(!Number.isInteger(index)||index<0||index>=limit||key&&!castOptions(activity).includes(key))throw Error("That Metamagic option is unavailable.");
    selection.slots??=selectionSummary(activity.actor,selection).keys;
    if(key&&selection.slots.some((other,i)=>i!==index&&other===key))throw Error("Choose a different Metamagic option in each dropdown.");
    const previous=selection.slots[index];if(previous===key)return selection;
    clearMetamagic(selection,previous);selection.slots[index]=key;
    if(key){clearMetamagic(selection,key);if(!["transmuted","heightened","careful"].includes(key))selection[key]=true;}
    return selection;
}
export function canChooseMetamagic(activity,selection,index,key,targets){
    try{const next=structuredClone(selection);chooseMetamagic(activity,next,index,key);validateSelection(activity,next,targets,{details:false});return true;}catch{return false;}
}
export function metamagicMarkup(activity,selection,targets){
    const available=castOptions(activity);if(!available.length&&globalThis.Ugmuls55eAutomationPsionic?.eligible(activity)!==true)return "";
    const targetIds=new Set(targets.map(t=>t.token));selection.careful=(selection.careful??[]).filter(id=>targetIds.has(id));if(selection.heightened&&!targetIds.has(selection.heightened))selection.heightened="";
    selection.slots??=selectionSummary(activity.actor,selection).keys;
    const limit=metamagicLimit(activity.actor);
    // Presentation-only cleanup keeps lost grants/Bonus Actions from trapping an open dialog.
    for(let i=0;i<selection.slots.length;i++)if(i>=limit||!available.includes(selection.slots[i])||selection.slots[i]==="quickened"&&quickenedUnavailable(activity)){clearMetamagic(selection,selection.slots[i]);selection.slots[i]="";}
    selection.slots=selection.slots.slice(0,limit);while(selection.slots.length<limit)selection.slots.push("");
    const escape=foundry.utils.escapeHTML,summary=selectionSummary(activity.actor,selection),option=(value,label,selected)=>`<option value="${escape(value)}" ${selected===value?"selected":""}>${escape(label)}</option>`;
    const pointsAvailable=remaining(sorceryResource(activity.actor,metamagicFeature(activity.actor,available[0])));
    const details=key=>key==="twinned"?`<div class="rsa-metamagic-details"><p>Target an additional creature on the map. Original targets stay selected for this spell. Up to ${Math.min(twinnedContext(activity).max,(selection.twinnedBaseTargets?.length??twinnedContext(activity).count)+twinnedContext(activity).extra)} targets total.</p></div>`:key==="transmuted"?`<div class="rsa-metamagic-details"><label>Damage type <select data-rsa-meta="transmuted">${option("","Choose damage type",selection.transmuted)}${elements.map(type=>option(type,type[0].toUpperCase()+type.slice(1),selection.transmuted)).join("")}</select></label></div>`:key==="heightened"?`<div class="rsa-metamagic-details"><label>Target <select data-rsa-meta="heightened">${option("","Choose target",selection.heightened)}${targets.map(t=>option(t.token,t.name,selection.heightened)).join("")}</select></label></div>`:key==="careful"?`<fieldset class="rsa-careful-group"><legend>Careful Spell targets</legend><p>Protect up to ${Math.max(1,Number(activity.actor.system?.abilities?.cha?.mod)||0)} creatures:</p><div class="rsa-careful-target-list ${targets.length>4?"rsa-two-columns":""}">${targets.map(t=>`<label><input type="checkbox" data-rsa-careful="${escape(t.token)}" ${selection.careful.includes(t.token)?"checked":""}> ${escape(t.name)}</label>`).join("")}</div></fieldset>`:"";
    return `<fieldset class="rsa-cast-metamagic"><legend>Metamagic Configuration</legend><p>Select up to ${limit} option${limit===1?"":"s"}.</p><p><strong>Current Sorcery Points available: ${pointsAvailable}</strong></p>
    ${(available.length?selection.slots:[]).map((selected,index)=>`<div class="rsa-metamagic-choice"><label>Metamagic${limit>1?" "+(index+1):""} <select data-rsa-meta-slot="${index}">${option("","None",selected)}${available.map(key=>`<option value="${key}" ${selected===key?"selected":""} ${canChooseMetamagic(activity,selection,index,key,targets)?"":"disabled"}>${names[key]} (${costs[key]} SP)</option>`).join("")}</select></label>${details(selected)}</div>`).join("")}
    ${summary.free?`<p>${names[summary.free]} free (Arcane Apotheosis)</p>`:""}<p class="rsa-metamagic-points">Selected cost: <strong>${summary.cost} SP</strong> · Remaining after cast: <strong>${Math.max(0,pointsAvailable-summary.cost)} SP</strong></p></fieldset>`;
}
export async function chargeMetamagic(actor,message,key,cost=costs[key]){
    const free=freeMetamagic(actor),resource=sorceryResource(actor,metamagicFeature(actor,key));
    if(!free&&remaining(resource)<cost)throw Error("Not enough Sorcery Points.");
    const spent=Number(resource?.system?.uses?.spent??0),previous=actor.getFlag?.(ID,"freeMetamagicTurn");
    if(free)await actor.setFlag(ID,"freeMetamagicTurn",ownTurn(actor));else await resource.update({"system.uses.spent":spent+cost});
    return {async refund(){if(free){if(previous===undefined)await actor.unsetFlag(ID,"freeMetamagicTurn");else await actor.setFlag(ID,"freeMetamagicTurn",previous);}else await resource.update({"system.uses.spent":Number(resource.system.uses.spent)-cost});}};
}
export async function commitCastMetamagic(activity,message,selection,targets,regions=[]){
    if(message.getFlag(ID,"metamagic"))return;
    const actor=activity.actor,key=actor.uuid;
    if(committingActors.has(key))throw Error("Metamagic is already being confirmed for this character.");
    committingActors.add(key);
    try {
    const summary=validateSelection(activity,selection,targets);
    if(summary.keys.includes("twinned")&&Array.isArray(message.system?.targets)){
        const original=message.system.targets.map(t=>t.token),base=selection.twinnedBaseTargets??[];
        if(original.length!==base.length||original.some(id=>!base.includes(id)))throw Error("The original spell targets changed. Reopen Metamagic.");
    }
    const record={...selection,careful:[...(selection.careful??[])],options:summary.keys,cost:summary.cost,free:summary.free};
    const resource=sorceryResource(actor,metamagicFeature(actor,summary.keys[0])),spent=Number(resource?.system?.uses?.spent??0),oldFree=actor.getFlag?.(ID,"freeMetamagicTurn");
    let charged=false,usedFree=false,bonusMarker=null,payment={refund:async()=>{},updates:{}};
    const usage=message.getFlag?.(ID,"castSession")??message.id;
    const refundBonus=async()=>{if(bonusMarker&&!bonusMarker.disabled&&bonusMarker.getFlag?.(ID,"resourceUsage")===usage)await bonusMarker.update({disabled:true});};
    try {
        if(summary.keys.includes("quickened")){
            bonusMarker=await globalThis.Ugmuls55eAutomationResources?.markBonusAction(actor,{usage});
            if(bonusMarker&&bonusMarker.getFlag?.(ID,"resourceUsage")!==usage)throw Error("Bonus Action already used.");
        }
        payment=await globalThis.Ugmuls55eAutomationPsionic?.paySlot(activity,message,selection)??payment;
        if(summary.cost){await resource.update({"system.uses.spent":spent+summary.cost});charged=true;}
        if(summary.free){await actor.setFlag(ID,"freeMetamagicTurn",ownTurn(actor));usedFree=true;}
        const update={...payment.updates,[`flags.${ID}.metamagic`]:record};
        if(summary.keys.includes("twinned"))update["system.scaling"]=twinnedContext(activity).scaling+1;
        if(selection.transmuted)update[`flags.${ID}.transmutedSpell`]=Object.fromEntries(elements.map(type=>[type,selection.transmuted]));
        await message.update(update);
    }catch(error){await payment.refund();await refundBonus();if(charged)await resource.update({"system.uses.spent":Number(resource.system.uses.spent)-summary.cost});if(usedFree){if(oldFree===undefined)await actor.unsetFlag(ID,"freeMetamagicTurn");else await actor.setFlag(ID,"freeMetamagicTurn",oldFree);}throw error;}
    globalThis.Ugmuls55eAutomationPendingCast?.onCancel(message,async()=>{
        await payment.refund();await refundBonus();
        if(charged)await resource.update({"system.uses.spent":Math.max(0,Number(resource.system.uses.spent)-summary.cost)});
        if(usedFree&&actor.getFlag?.(ID,"freeMetamagicTurn")===ownTurn(actor)){if(oldFree===undefined)await actor.unsetFlag(ID,"freeMetamagicTurn");else await actor.setFlag(ID,"freeMetamagicTurn",oldFree);}
    });
    // Region follow-ups retain Heightened and Transmuted from the original casting.
    for(const region of regions){
        if(region.isOwner)await region.setFlag(ID,"metamagicOrigin",message.id);
        else game.socket.emit("module."+ID,{action:"metamagicRegion",regionUuid:region.uuid,messageId:message.id,userId:game.user.id});
    }
    }finally{committingActors.delete(key);}
}
export function heightenedTarget(origin,actor,tokenUuid){
    const target=castingChoices(origin)?.heightened;if(!target)return false;
    if(tokenUuid)return target===tokenUuid;
    const matches=(origin?.system?.targets??[]).filter(t=>t.actor===actor?.uuid);
    return matches.length===1&&matches[0].token===target;
}
let heightenedBridge=false;
export function registerHeightenedBridge(api=globalThis.ac5e?.usageRules){
    if(!game.modules?.get("automated-conditions-5e")?.active||typeof api?.register!=="function")return false;
    try { heightenedBridge=!!api.register({key:"rsaHeightenedSpell",scope:"universal",hook:"save",target:"subject",mode:"disadvantage",name:"Heightened Spell",persistent:false,
        evaluate:sandbox=>heightenedTarget(game.messages.get(sandbox.options?.originatingMessageId),fromUuidSync(sandbox.actorUuid,{strict:false}),sandbox.tokenUuid)});
    }catch(error){heightenedBridge=false;console.warn("Ugmuls 5.5e Automation | Heightened condition integration failed:",error);}
    return heightenedBridge;
}
export function heightenedDefaults(config,dialog,message){
    if(heightenedBridge&&game.modules?.get("automated-conditions-5e")?.active)return;
    const origin=typeof message?.data?.system?.origin==="string"?game.messages.get(message.data.system.origin):message?.data?.system?.origin;
    const speaker=message?.data?.speaker,tokenUuid=speaker?.scene&&speaker.token?`Scene.${speaker.scene}.Token.${speaker.token}`:null;
    if(!heightenedTarget(origin,config.subject,tokenUuid))return;
    config.disadvantage=true;
    for(const roll of config.rolls??[]){roll.options??={};const adv=!!(config.advantage||roll.options.advantage||roll.options.advantageMode===1);roll.options.disadvantage=true;roll.options.advantage=adv;roll.options.advantageMode=adv?0:-1;}
    dialog.options??={};dialog.options.defaultButton=config.rolls?.[0]?.options.advantage?"normal":"disadvantage";
}
export async function carefulSave(message,token){
    if(!castingChoices(message)?.careful?.includes(token.uuid)||message.getFlag?.(ID,"regionTriggered"))return false;
    if(message.system.outcomes?.has(token.uuid))return true;
    const activity=message.getAssociatedActivity(),ability=Array.from(activity.save.ability)[0],dc=Number(activity.save.dc.value);
    if(!ability||!Number.isFinite(dc))throw Error("Careful Spell cannot resolve a save without its DC and ability.");
    const roll=await new CONFIG.Dice.D20Roll(String(dc),{},{target:dc}).evaluate();
    const result=await ChatMessage.create({type:"save",speaker:ChatMessage.getSpeaker({actor:token.actor,scene:token.parent,token}),
        flavor:"Careful Spell — Automatic Success",rolls:[roll],system:{...activity.messageSources,origin:message.id,ability},flags:{[ID]:{carefulSpell:true}}});
    await message.system.onDescendentRefresh?.(result);
    return true;
}
export function carefulDamage(actor,damages,options){
    const message=options.originatingMessage??options.origin;
    if(message?.type!=="damage"||message.system?.onSave!=="half")return;
    const origin=castingOrigin(message),selected=castingChoices(origin)?.careful??[];
    if((origin?.system?.targets??[]).some(t=>selected.includes(t.token)&&t.actor===actor.uuid))
        for(const damage of damages)if(!["healing","temphp"].includes(damage.type))damage.value=0;
}
Hooks.once("init",()=>{for(const key of ["heightened","careful","quickened","subtle","distant","extended","twinned"])game.settings.register(ID,key+"SpellAutomation",{name:names[key],hint:"Choose Metamagic and targets before rolling. Respects Sorcery Point costs and casting limits.",scope:"world",config:true,type:Boolean,default:true});});
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerHeightenedBridge(usageRules));
Hooks.once("ready",()=>{
    globalThis.Ugmuls55eAutomationMetamagic= {dialogTitle,validateSelection,needsMetamagic,metamagicMarkup,selectionSummary,chooseMetamagic,canChooseMetamagic,twinnedContext,commitCastMetamagic,carefulSave,castingChoices,chargeMetamagic,freeMetamagic};
    game.socket.on("module."+ID,async packet=>{
        if(packet?.action!=="metamagicRegion"||!game.user.isGM||game.users.activeGM?.id!==game.user.id)return;
        try {
            const message=game.messages.get(packet.messageId),region=await fromUuid(packet.regionUuid),actor=message?.getAssociatedActor?.();
            if(message?.author?.id!==packet.userId||!message.getFlag(ID,"metamagic")||!actor||
                region?.flags?.dnd5e?.item!==message.getAssociatedItem?.()?.uuid||
                (await fromUuid(region.flags.dnd5e.origin))?.actor?.uuid!==actor.uuid)return;
            await region.setFlag(ID,"metamagicOrigin",message.id);
        }catch(error){console.error("Ugmuls 5.5e Automation | Could not link Region Metamagic:",error);}
    });
    Hooks.on("dnd5e.renderChatMessage",(message,html)=>{
        const root=html?.[0]??html;if(!root?.querySelectorAll)return;
        const entries=[{message,root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({message:game.messages.get(node.dataset.messageId),root:node}))];
        for(const entry of entries)if(entry.message?.getFlag?.(ID,"carefulSpell")){
            const total=entry.root.querySelector('.dice-total');if(total)total.textContent="Careful — Success";
        }
    });
    registerHeightenedBridge();Hooks.on("dnd5e.preRollSavingThrowV2",heightenedDefaults);Hooks.on("dnd5e.preCalculateDamage",carefulDamage);
});
