// Timing: outcome / damage-visible. Legacy hit-stage reservations remain finishable.
import {createEventQueue,isRollAdjustmentLocked,isHealingCard} from "./shared-activity-card.js";
import {superiorityResource,superiorityRemaining,superiorityFormula} from "./battlemaster.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
import {subtractCuttingWords} from "./cutting-words.js";
import {seekingSnapshot} from "./seeking-spell.js";
import {meleeAttack} from "./defensive-duelist.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue();
export const parryFeature=actor=>Array.from(actor?.items??[]).find(item=>item.type==="feat"&&((item.identifier??item.system?.identifier)==="parry"||/^parry$/i.test(item.name?.trim()??"")));
function attackFor(card){const origin=typeof card.system?.origin==="string"?game.messages.get(card.system.origin):card.system?.origin;const explicit=card.getFlag?.(ID,"damageAttackId");return explicit?game.messages.get(explicit):origin?.type==="attack"?origin:Array.from(origin?.getAssociatedRolls?.("attack")??[]).filter(attack=>attack.timestamp<=card.timestamp).sort((a,b)=>b.timestamp-a.timestamp)[0];}
// A pass applies only to this actor on this exact damage card; eligibility is rechecked by authority.
export function parryCandidate(...args){const result=parryCandidateCore(...args);return result&&globalThis.Ugmuls55eAutomationReactive?.damageAllowed?.(args[0],result.actor)===false?null:result;}
function parryCandidateCore(card,user=game.user){
    const reserved=globalThis.Ugmuls55eAutomationStagedReductions?.selection?.(card,'parry');
    if(card?.rsaReductionPreview||globalThis.Ugmuls55eAutomationReactionTiming?.held?.(card)&&!reserved)return null;
    if(card?.isContentVisible===false||!user?.isGM&&(card?.blind||card?.whisper?.length&&!card.whisper.some(u=>(u.id??u)===user?.id)&&card.author?.id!==user?.id))return null;
    if(game.settings.get(ID,"parryAutomation")!==true||card?.type!=="damage"||isHealingCard(card)||card.getFlag?.(ID,"pendingDamage")||card.getFlag?.(ID,"parry")||isRollAdjustmentLocked(card)||!card.rolls?.length||card.rolls.some(roll=>!roll._evaluated))return null;
    const attack=attackFor(card);
    // Check the actual recorded attack mode as well as its activity. A melee
    // weapon can make a ranged/thrown attack, which cannot trigger Parry.
    if(!meleeAttack(attack))return null;
    const targets=attack.system?.evaluatedTargets??[];if(targets.length!==1||targets[0].isMiss!==false)return null;
    const token=fromUuidSync(targets[0].token,{strict:false}),actor=token?.actor;
    if(!actor||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||(reactionUsed(actor)&&!globalThis.Ugmuls55eAutomationStagedReductions?.ownsReservation(card,actor))||["incapacitated","unconscious","dead","stunned","paralyzed","petrified"].some(status=>actor.statuses?.has(status)))return null;
    if((card.system?.targets??[]).length!==1||card.system.targets[0].token!==targets[0].token)return null;
    const feature=parryFeature(actor),resource=superiorityResource(actor),formula=superiorityFormula(actor,"precision")??superiorityFormula(actor,"trip")??superiorityFormula(actor,"parry");
    const reaction=Array.from(feature?.system?.activities?.values?.()??feature?.system?.activities??[]).find(activity=>String(activity.activation?.type??"").startsWith("reaction"));
    if(!feature||!resource||!formula||superiorityRemaining(actor)<1||!reaction||!card.rolls.some(roll=>Number(roll.total)>0))return null;
    const str=Number(actor.system?.abilities?.str?.mod??0),dex=Number(actor.system?.abilities?.dex?.mod??0);
    return {actor,feature,resource,formula,reaction,modifier:Math.max(str,dex),ability:str>=dex?"Strength":"Dexterity"};
}
export async function applyParry(card,actorUuid,user=game.user){
    if(!game.user.isGM||game.users.activeGM?.id!==game.user.id)throw Error("A connected GM is required for Parry.");
    let entry=parryCandidate(card,user);if(entry?.actor.uuid!==actorUuid)throw Error("Parry requires incoming melee damage, an available Reaction and a Superiority Die. Undo applied damage first.");
    if(card.getFlag?.(ID,"parryAdjusting"))throw Error("Parry is already resolving.");
    await card.setFlag(ID,"parryAdjusting",true);
    try{return await resolveParry(card,actorUuid,user,entry);}finally{await card.setFlag(ID,"parryAdjusting",false);if(card.getFlag?.(ID,"parry")){await globalThis.Ugmuls55eAutomationReactionTiming?.complete(card);await globalThis.Ugmuls55eAutomationReactive?.completed(card);}globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
}
async function resolveParry(card,actorUuid,user,entry){
    const before=seekingSnapshot(card),spent=Number(entry.resource.system.uses.spent??0);
    const bonus=await new CONFIG.Dice.BasicRoll(entry.formula+" + "+entry.modifier,entry.actor.getRollData?.()??{}).evaluate();
    if(seekingSnapshot(card)!==before||parryCandidate(card,user)?.actor.uuid!==actorUuid)throw Error("The damage or Parry resources changed. Try again.");
    let charged=false,committed=false,marker;
    try{
        await entry.resource.update({"system.uses.spent":spent+1});charged=true;
        if(reactionUsed(entry.actor)&&!globalThis.Ugmuls55eAutomationStagedReductions?.ownsReservation(card,entry.actor))throw Error("The fighter’s Reaction was just used.");
        marker=globalThis.Ugmuls55eAutomationStagedReductions?.marker(card,entry.actor);if(!marker){await recordReactionUse(entry.reaction,{}, {message:{id:card.id}});marker=reactionUsed(entry.actor);}
        const tracked=game.settings.get(ID,"reactionTracker")===true&&game.combat?.started&&Array.from(game.combat.combatants??[]).some(c=>c.actor?.uuid===actorUuid);
        if(tracked&&marker?.getFlag?.(ID,"reactionUsage")!==card.id&&!globalThis.Ugmuls55eAutomationStagedReductions?.ownsReservation(card,entry.actor))throw Error("Could not reserve the fighter’s Reaction.");
        if(game.dice3d?.showForRoll){const animation=game.dice3d.showForRoll(bonus,user,true,card.whisper?.length?card.whisper:null,card.blind??false,card.id,card.speaker);await (globalThis.Ugmuls55eAutomationWaitForAnimation?.(animation)??animation);}
        if(seekingSnapshot(card)!==before||isRollAdjustmentLocked(card))throw Error("The damage changed during Parry. Resources were restored.");
        let remaining=Math.max(0,bonus.total);const rolls=[];
        for(const original of card.rolls){const reduction=Math.min(Math.max(0,original.total),remaining);remaining-=reduction;rolls.push(reduction?await subtractCuttingWords(original,{total:reduction},{damage:true,flavor:"Parry"}):original);}
        const skip=card.getFlag("dice-so-nice","skip");
        try{await card.update({rolls,["flags."+ID+".parry"]:{actor:actorUuid,name:entry.actor.name,formula:bonus.formula??entry.formula,ability:entry.ability,total:bonus.total,reduction:Math.max(0,bonus.total)-remaining},"flags.dice-so-nice.skip":true});committed=true;}
        finally{if(skip===undefined)await card.unsetFlag("dice-so-nice","skip");else await card.setFlag("dice-so-nice","skip",skip);}
    }catch(error){if(charged&&!committed){await entry.resource.update({"system.uses.spent":spent});if(marker?.getFlag?.(ID,"reactionUsage")===card.id)await marker.update({disabled:true});}throw error;}
}
function report(error){console.error("Parry",error);ui.notifications.error(error.message);}
function refresh(document,changes){globalThis.Ugmuls55eAutomationChatRefresh?.request("parry",document,changes);}
export function renderParry(message,html){
    const root=html?.querySelector?html:html?.[0];if(!root)return;
    const entries=[{card:message,root}];for(const node of root.querySelectorAll('.card-summary[data-message-id]')){const card=game.messages.get(node.dataset.messageId);if(card&&!node.hidden)entries.push({card,root:node});}
    for(const {card,root:node}of entries){
        node.querySelectorAll(':scope > .rsa-parry-actions').forEach(el=>el.remove());if(card.isContentVisible===false)continue;
        const entry=parryCandidate(card),used=card.getFlag?.(ID,"parry");if(!entry&&!used)continue;
        const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-cutting-actions rsa-parry-actions";
        if(entry){const button=document.createElement("button");button.type="button";button.dataset.rsaReactionItemUuid=entry.feature.uuid;const image=document.createElement("img");image.src=entry.feature.img??"icons/svg/shield.svg";image.alt="";
            button.append(image,document.createTextNode("Parry ("+entry.formula.replace(/^1/,"")+" + "+entry.modifier+") — "+entry.actor.name));
            button.dataset.tooltip="Use a Reaction and one Superiority Die. Reduce this melee damage by the die plus your higher Strength/Dexterity modifier, to a minimum of zero.";
            button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"parry",messageId:card.id,actorUuid:entry.actor.uuid,userId:game.user.id,gmId:gm.id});else await enqueue(()=>applyParry(card,entry.actor.uuid));}catch(error){report(error);}finally{button.disabled=!parryCandidate(card);}});controls.append(button);
        }
        if(used){const label=document.createElement("span");label.className="rsa-cutting-result";label.textContent="Parry: −"+used.reduction+" ("+used.name+")";controls.append(label);}node.append(controls);
    }
}
Hooks.once("init",()=>game.settings.register(ID,"parryAutomation",{name:"Parry Assistance",hint:"Offer Parry on single-target incoming melee damage. Spend a Reaction and current Superiority Die; subtract the die plus the higher Strength/Dexterity modifier while preserving existing damage dice. Undo applied damage first.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
    Hooks.on("dnd5e.renderChatMessage",renderParry);for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect","updateCombat","updateItem"])Hooks.on(event,refresh);
    game.socket.on("module."+ID,packet=>{if(packet?.action==="parryError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);refresh();return;}if(packet?.action!=="parry"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;enqueue(()=>applyParry(card,packet.actorUuid,user)).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"parryError",userId:user.id,error:error.message});});});
});
