import {createEventQueue,isRollAdjustmentLocked} from "./shared-activity-card.js";
import {inspiredRoll} from "./bardic-inspiration.js";
import {seekingSnapshot} from "./seeking-spell.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue();
const actorFor=card=>card?.getAssociatedActor?.()??card?.getAssociatedActivity?.()?.actor;
const identifier=item=>item?.identifier??item?.system?.identifier;
const activities=item=>Array.from(item?.system?.activities??[]);
export const homingFeature=actor=>Array.from(actor?.items??[]).find(item=>item.type==="feat"&&identifier(item)==="soul-blades"&&activities(item).some(a=>a.id==="V4igVC3iuQ9uHASF"||/^homing strikes$/i.test(a.name??"")));
const homingActivity=actor=>activities(homingFeature(actor)).find(a=>a.id==="V4igVC3iuQ9uHASF"||/^homing strikes$/i.test(a.name??""));
export function homingResource(actor){return Array.from(actor?.items??[]).find(item=>identifier(item)==="psionic-power"&&(String(item._source?.system?.uses?.max??item.system?.uses?.max).includes("soulknife")||activities(item).some(a=>a.id==="lPsbFldwEL8ElBGY"||String(a.roll?.formula??"").includes("soulknife"))));}
export function homingFormula(actor){const raw=homingActivity(actor)?.roll?.formula;if(!raw)return null;const value=CONFIG.Dice.BasicRoll.replaceFormulaData(raw,actor.getRollData?.()??{},{missing:""}).trim();return /^(?:1)?d[1-9][0-9]*$/i.test(value)?value.replace(/^d/i,"1d"):null;}
const remaining=item=>Number(item?.system?.uses?.value??(Number(item?.system?.uses?.max)-Number(item?.system?.uses?.spent??0)))||0;
export function homingDC(card){const targets=Array.from(card?.system?.evaluatedTargets??[]);return targets.length===1&&targets[0].ac!=null&&Number(targets[0].ac)>0&&Number.isFinite(Number(targets[0].ac))?Number(targets[0].ac):null;}
export function canHoming(card,user=game.user,index=0){
 const actor=actorFor(card),activity=card?.getAssociatedActivity?.(),weapon=activity?.item,roll=card?.rolls?.[0];
 return game.settings.get(ID,"homingStrikesAutomation")===true&&card?.type==="attack"&&index===0&&card.rolls?.length===1&&!!roll?.d20&&roll._evaluated&&
 weapon?.type==="weapon"&&(identifier(weapon)==="psychic-blade"||/^psychic blades?$/i.test(weapon.name??""))&&
 homingDC(card)!==null&&card.system.evaluatedTargets[0].isMiss===true&&!card.getFlag?.(ID,"homingStrikes")?.[0]&&!isRollAdjustmentLocked(card)&&
 !!homingFeature(actor)&&remaining(homingResource(actor))>0&&!!homingFormula(actor)&&!!(user?.isGM||actor?.testUserPermission?.(user,"OWNER"));
}
const snapshot=card=>seekingSnapshot(card)+JSON.stringify({targets:card.system?.targets,dc:homingDC(card),miss:card.system?.evaluatedTargets?.[0]?.isMiss});
export function applyHoming(card,index=0,user=game.user){return enqueue(()=>performHoming(card,index,user));}
async function performHoming(card,index=0,user=game.user){
    if(!canHoming(card,user,index))throw Error("Homing Strikes needs your missed Psychic Blade attack and an available Psionic Energy use. Undo applied damage first.");
    const dc=homingDC(card);
    if(dc===null)throw Error("Enter the GM-provided DC before rolling Homing Strikes so its resource cost can be determined.");
    const original=card.rolls[index];if(original.total>=dc&&!(card.type==="attack"&&original.isFumble))throw Error("This roll already succeeds against that DC.");
    const actor=actorFor(card),resource=homingResource(actor),formula=homingFormula(actor),before=snapshot(card),spent=Number(resource.system.uses.spent??0);
    const bonus=await new CONFIG.Dice.BasicRoll(formula,actor.getRollData?.()??{}).evaluate(),adjusted=await inspiredRoll(original,bonus);
    if(!canHoming(card,user,index)||snapshot(card)!==before||Number(resource.system.uses.spent??0)!==spent)throw Error("The roll or Psionic Energy pool changed. Try again.");
    const success=adjusted.total>=dc&&!(card.type==="attack"&&adjusted.isFumble);
    
    let charged=false,committed=false;
    try{
        if(success){await resource.update({"system.uses.spent":spent+1});charged=true;}
        if(game.dice3d?.showForRoll){try{const animation=Promise.resolve(game.dice3d.showForRoll(bonus,user,true,card.whisper?.length?card.whisper:null,card.blind??false,card.id,card.speaker));if(globalThis.Ugmuls55eAutomationWaitForAnimation)await globalThis.Ugmuls55eAutomationWaitForAnimation(animation);else if(globalThis.document?.hidden)animation.catch(console.warn);else await animation;}catch(error){console.warn("Homing Strikes animation failed",error);}}
        if(snapshot(card)!==before||isRollAdjustmentLocked(card)||Number(resource.system.uses.spent??0)!==spent+(charged?1:0))throw Error("The roll changed during Homing Strikes. Any spent use was restored.");
        const rolls=[...card.rolls];rolls[index]=adjusted;
        const record={...(card.getFlag(ID,"homingStrikes")??{}),[index]:{formula,total:bonus.total,spent:success}};
        const skip=card.getFlag("dice-so-nice","skip");
        try{await card.update({rolls,["flags."+ID+".homingStrikes"]:record,"flags.dice-so-nice.skip":true});committed=true;}
        finally{if(skip===undefined)await card.unsetFlag("dice-so-nice","skip");else await card.setFlag("dice-so-nice","skip",skip);}
    }catch(error){if(charged&&!committed)await resource.update({"system.uses.spent":Math.max(0,Number(resource.system.uses.spent??0)-1)});throw error;}
}
function report(error){console.error("Ugmuls 5.5e Automation | Homing Strikes",error);ui.notifications.error(error.message);}
async function request(card,index,button){
    button.disabled=true;
    try{
        const gm=game.users.activeGM;
        if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"homingStrikes",messageId:card.id,index,userId:game.user.id,gmId:gm.id});
        else await applyHoming(card,index,game.user);
    }catch(error){report(error);}finally{button.disabled=!canHoming(card,game.user,index);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
}
export function renderHoming(message,html){
    const root=html instanceof HTMLElement?html:html?.[0];if(!root)return;
    const entries=[{card:message,root}];for(const summary of root.querySelectorAll('.card-summary[data-message-id]')){const card=game.messages.get(summary.dataset.messageId);if(card&&!summary.hidden)entries.push({card,root:summary});}
    for(const entry of entries){
        entry.root.querySelectorAll(':scope > .rsa-homing-actions').forEach(node=>node.remove());if(entry.card.isContentVisible===false)continue;
        const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-homing-actions";
        for(const[index,roll]of (entry.card.rolls??[]).entries()){
            if(!canHoming(entry.card,game.user,index))continue;
            const actor=actorFor(entry.card),formula=homingFormula(actor);
            const button=document.createElement("button");button.type="button";
            
            button.append(document.createTextNode("Homing Strikes ("+formula.replace(/^1/,"")+")"+(entry.card.rolls.length>1?" — Roll "+(index+1):"")));
            button.dataset.tooltip="Add your Psionic Energy Die to this missed Psychic Blade attack. Spend the use only if it turns the failure into success. One attempt per attack. Natural ones remain misses. No reaction is required.";
            button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();request(entry.card,index,button);});controls.append(button);
        }
        for(const record of Object.values(entry.card.getFlag?.(ID,"homingStrikes")??{})){const label=document.createElement("span");label.textContent="Homing Strikes: +"+record.total+" — "+(record.spent?"use spent":"use retained");controls.append(label);}
        if(controls.childNodes.length)entry.root.append(controls);
    }
}
function refresh(document,changes){globalThis.Ugmuls55eAutomationChatRefresh?.request("homing",document,changes);}
Hooks.once("init",()=>game.settings.register(ID,"homingStrikesAutomation",{name:"Homing Strikes Assistance",hint:"Offer Homing Strikes on the Soulknife’s missed Psychic Blade attacks. Preserve existing rolls and spend Psionic Energy only if the result becomes a success. One attempt per attack; natural ones remain misses.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
    Hooks.on("dnd5e.renderChatMessage",renderHoming);Hooks.on("updateItem",refresh);Hooks.on("createItem",refresh);Hooks.on("deleteItem",refresh);
    Hooks.on("updateChatMessage",(card,changes)=>{
        if(!changes.flags?.[ID]?.homingStrikes&&!changes["flags."+ID+".homingStrikes"])return;
        if(card.type!=="attack"||card.author?.id!==game.user.id||!card.system.evaluatedTargets?.some(target=>target.isMiss===false))return;
        const origin=typeof card.system.origin==="string"?game.messages.get(card.system.origin):card.system.origin;
        if(origin)globalThis.Ugmuls55eAutomationDamage?.promptDamage(card.getAssociatedActivity(),origin,"attack",card).catch(report);
    });
    game.socket.on("module."+ID,packet=>{
        if(packet?.action==="homingStrikesError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(packet.messageId));return;}
        if(packet?.action!=="homingStrikes"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;
        const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;
        applyHoming(card,packet.index,user).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"homingStrikesError",userId:user.id,messageId:card.id,error:error.message});});
    });
});
