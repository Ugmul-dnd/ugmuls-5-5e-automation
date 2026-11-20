// Timing: outcome / attack-miss (connected).
// Timing catalog and connection status: docs/reaction-timing.md.
import {finalD20Results} from "./d20-results.js";
import {createEventQueue,isRollAdjustmentLocked} from "./shared-activity-card.js";
import {sorceryResource} from "./empowered-spell.js";
import {animateNewSaveDice} from "./save-roll-controls.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue();
export const seekingFeature=actor=>Array.from(actor?.items??[]).find(item=>item.type==="feat"&&
    (/^(?:metamagic-)?seeking-spell$/.test(item.identifier??item.system?.identifier??"")||/^(?:metamagic:\s*)?seeking spell$/i.test(item.name??"")));
const actorFor=card=>card?.getAssociatedActor?.()??card?.getAssociatedActivity?.()?.actor;
export function seekingTimingSnapshot(card){const actor=actorFor(card),ref=card?.getAssociatedToken?.(),token=(ref?.document??ref)?.uuid;return {entries:token&&card.system?.targets?.length===1&&canSeek(card,game.users.activeGM,{capture:true})?[{actor:actor.uuid,token,feature:seekingFeature(actor).uuid}]:[]};}
export function seekingCandidates(card,user=game.user){if(!canSeek(card,user))return [];const actor=actorFor(card),feature=seekingFeature(actor);return (card.getFlag?.(ID,'seekingTimingSnapshot')?.entries??[]).filter(e=>e.actor===actor.uuid&&e.feature===feature?.uuid).map(e=>({...e,actor,feature}));}
export function canSeek(card,user=game.user,{capture=false}={}) {
    const actor=actorFor(card),item=card?.getAssociatedItem?.()??card?.getAssociatedActivity?.()?.item,targets=card?.system?.evaluatedTargets??[];
    const timing=globalThis.Ugmuls55eAutomationReactionTiming,snapshot=card?.getFlag?.(ID,'seekingTimingSnapshot');
    if(card?.isContentVisible===false||isRollAdjustmentLocked(card)||!capture&&timing?.closed?.(card,'seeking'))return false;
    if(!capture&&snapshot){const entry=snapshot.entries?.find(e=>e.actor===actor?.uuid&&e.feature===seekingFeature(actor)?.uuid);if(!entry||timing?.choiceAllowed?.(card,'seeking',actor.uuid,entry.token)===false)return false;}
    return game.settings.get(ID,"seekingSpellAutomation")===true&&card?.type==="attack"&&item?.type==="spell"&&
        !card.getFlag?.(ID,"seekingSpellUsed")&&targets.length>0&&(capture||targets.every(target=>target.isMiss===true))&&
        !!seekingFeature(actor)&&(!!sorceryResource(actor,seekingFeature(actor))||!!globalThis.Ugmuls55eAutomationMetamagic?.freeMetamagic(actor))&&!!(user?.isGM||actor?.testUserPermission?.(user,"OWNER"))&&
        !!card.rolls?.[0]?.d20;
}
export function seekingSnapshot(card) {
    const resultState=result=>[result.result,result.active!==false,!!result.discarded,!!result.rerolled];
    const termState=term=>({number:term.number,faces:term.faces,operator:term.operator,total:term.total,
        modifiers:term.modifiers,results:term.results?.map(resultState),
        rolls:term.rolls?.map(roll=>({total:roll.total,terms:roll.terms?.map(termState)}))});
    return JSON.stringify({rolls:(card.rolls??[]).map(roll=>{
        const d20=roll.d20;
        return {formula:roll.formula,total:roll.total,mode:roll.options?.advantageMode??0,
            d20:d20?termState(d20):null,terms:roll.terms?.map(termState)};
    }),targets:card.system?.targets?.map(target=>target.token)});
}
export async function seekingRoll(roll) {
    const adjusted=roll.constructor.fromData(JSON.parse(JSON.stringify(roll.toJSON())));
    const die=new CONFIG.Dice.D20Die({number:1,faces:20});
    die.applyFlag?.("halflingLucky",roll.options.halflingLucky===true);
    die.applyRange?.({minimum:roll.options.minimum,maximum:roll.options.maximum});
    await die.evaluate({allowInteractive:false});
    const results=finalD20Results(die.results).filter(result=>result.active!==false);
    if(results.length!==1)throw Error("Seeking Spell did not produce one final d20 result.");
    for(const result of adjusted.d20.results){if(result.active!==false)result.rerolled=true;result.active=false;result.discarded=true;}
    const replacement={...foundry.utils.deepClone(results[0]),active:true,discarded:false};adjusted.d20.results.push(replacement);
    adjusted.options.rsaSaveDicePool=[replacement];adjusted.options.rsaSeekingSpellUsed=true;
    adjusted._total=adjusted._evaluateTotal();return {roll:adjusted,results};
}
export async function applySeeking(card,user=game.user) {
    if(!game.user.isGM||game.users.activeGM&&game.users.activeGM.id!==game.user.id)throw Error('A connected GM is required for Seeking Spell.');
    if(card.getFlag?.(ID,'seekingAdjusting'))throw Error('Seeking Spell is already resolving.');
    const staged=globalThis.Ugmuls55eAutomationReactionTiming?.held?.(card);await card.setFlag(ID,'seekingAdjusting',true);let committed=false;
    try{await applySeekingCore(card,user);committed=true;}finally{await card.setFlag(ID,'seekingAdjusting',false);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
    if(committed){await globalThis.Ugmuls55eAutomationReactionTiming?.complete(card,'seeking');if(!staged){const ref=card.system.origin,origin=typeof ref==='string'?game.messages.get(ref):ref;if(origin&&card.system.evaluatedTargets.some(t=>t.isMiss===false))await globalThis.Ugmuls55eAutomationDamage?.promptDamage?.(card.getAssociatedActivity(),origin,'attack',card);await globalThis.Ugmuls55eAutomationReactive?.completed(card);}}
}
async function applySeekingCore(card,user=game.user) {
    if(!canSeek(card,user))throw Error("Seeking Spell requires a missed spell attack and an available Sorcery Point.");
    const original=seekingSnapshot(card),result=await seekingRoll(card.rolls[0]);
    if(!canSeek(card,user)||seekingSnapshot(card)!==original)throw Error("The attack changed. Try Seeking Spell again.");
    const actor=actorFor(card),resource=sorceryResource(actor,seekingFeature(actor)),spent=Number(resource?.system.uses.spent??0);let charged=false,charge;
    try {
        if(globalThis.Ugmuls55eAutomationMetamagic)charge=await globalThis.Ugmuls55eAutomationMetamagic.chargeMetamagic(actor,card,"seeking");
        else await resource.update({"system.uses.spent":spent+1});charged=true;
        await animateNewSaveDice(card,result.results,user);
        if(isRollAdjustmentLocked(card)||card.getFlag?.(ID,"seekingSpellUsed")||!card.system.evaluatedTargets.every(target=>target.isMiss===true)||seekingSnapshot(card)!==original)throw Error("The attack changed during the reroll. The Sorcery Point was refunded.");
        await card.update({rolls:[result.roll,...card.rolls.slice(1)],["flags."+ID+".seekingSpellUsed"]:true});
    } catch(error){if(charged){if(charge)await charge.refund();else await resource.update({"system.uses.spent":spent});}throw error;}
}
function report(error){console.error("Ugmuls 5.5e Automation | Seeking Spell failed:",error);ui.notifications.error(error.message);}
export function addSeekingButton(message,html) {
    const root=html instanceof HTMLElement?html:html?.[0];if(!root)return;
    const entries=message.type==="attack"?[{card:message,root}]:[];
    for(const summary of root.querySelectorAll('.card-summary[data-message-id]')) {const card=game.messages.get(summary.dataset.messageId);if(card?.type==="attack"&&!summary.hidden)entries.push({card,root:summary});}
    for(const entry of entries) {
        const old=entry.root.querySelector('[data-rsa-seeking]');
        if(!canSeek(entry.card)||!entry.card.isContentVisible){old?.remove();continue;}if(old)continue;
        const face=entry.root.querySelector('.chat-card')??entry.root;let controls=face.querySelector('.rsa-attack-actions');
        if(!controls){controls=document.createElement("div");controls.className="rsa-attack-actions";face.append(controls);}
        const button=document.createElement("button");button.type="button";button.dataset.rsaSeeking="";button.dataset.rsaReactionItemUuid=seekingFeature(actorFor(entry.card)).uuid;
        const img=document.createElement("img");img.src=seekingFeature(actorFor(entry.card)).img??"icons/svg/d20.svg";img.alt="";button.append(img,document.createTextNode("Seeking Spell"));
        button.setAttribute("data-tooltip","Spend 1 Sorcery Point to reroll one d20. You must use the new result.");
        button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();button.disabled=true;
            const gm=game.users.activeGM;
            if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"seekingSpell",messageId:entry.card.id,userId:game.user.id,gmId:gm.id});
            else enqueue(()=>applySeeking(entry.card)).catch(report).finally(()=>{button.disabled=false;});
        });controls.append(button);
    }
}
Hooks.once("init",()=>game.settings.register(ID,"seekingSpellAutomation",{name:"Seeking Spell Attack Reroll",hint:"Offer Seeking Spell on missed spell attacks. Spend 1 Sorcery Point to reroll one d20 and use the new result, then refresh the hit and damage workflow.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
    globalThis.Ugmuls55eAutomationSeekingSpellTiming={snapshot:seekingTimingSnapshot,candidates:seekingCandidates};
    for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect','updateItem','deleteItem','updateActor','updateCombat'])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request('seeking',doc,changes));
    Hooks.on("dnd5e.renderChatMessage",addSeekingButton);
    Hooks.on("updateChatMessage",(card,changes)=>{
        if(!changes.flags?.[ID]?.seekingSpellUsed||card.author?.id!==game.user.id||!card.system.evaluatedTargets?.some(target=>target.isMiss===false))return;
        const origin=typeof card.system.origin==="string"?game.messages.get(card.system.origin):card.system.origin;
        if(origin&&!card.getFlag?.(ID,'seekingAdjusting')&&!globalThis.Ugmuls55eAutomationReactionTiming?.held?.(card))globalThis.Ugmuls55eAutomationDamage?.promptDamage(card.getAssociatedActivity(),origin,"attack",card).catch(report);
    });
    game.socket.on("module."+ID,packet=>{
        if(packet?.action==="seekingSpellError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);return;}
        if(packet?.action!=="seekingSpell"||!game.user.isGM||packet.gmId!==game.user.id||game.users.activeGM?.id!==game.user.id)return;
        const card=game.messages.get(packet.messageId),user=game.users.get(packet.userId);if(!user?.active)return;
        enqueue(()=>applySeeking(card,user)).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"seekingSpellError",userId:user.id,error:error.message});});
    });
});
