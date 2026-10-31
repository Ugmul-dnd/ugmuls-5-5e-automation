import { describeTarget, isEligibleTarget, isEligibleHealingTarget, isHealingCard } from "./shared-activity-card.js";
const pendingCards = new WeakSet();

export function supportsRetarget(message) {
    const landPart=globalThis.Ugmuls55eAutomationLandsAid?.part?.(message);if(landPart)return ['usage','healing'].includes(landPart);
    if (!["usage","attack"].includes(message?.type)) return false;
    if(globalThis.Ugmuls55eAutomationTactics?.isTacticsChoice?.(message.getAssociatedActivity?.()))return false;
    if(globalThis.Ugmuls55eAutomationPrey?.isPreyChoice?.(message.getAssociatedActivity?.()))return false;
    if(globalThis.Ugmuls55eAutomationEpitome?.epitomeResistanceActivity?.(message.getAssociatedActivity?.()))return false;
    const item=message?.getAssociatedItem?.()??message?.getAssociatedActivity?.()?.item;
    if(item?.type==="feat"&&(["aura-of-elemental-shielding","aspect-of-the-wilds"].includes(item.identifier??item.system?.identifier)||/^aura of elemental shielding$/i.test(item.name??"")))return false;
    if (["manualCheck","check"].includes(message?.getFlag?.("ugmuls-5-5e-automation", "recurringTrigger")?.phase)) return false;
    return ["usage","attack"].includes(message?.type) && (
        ["spell","feat","weapon"].includes(item?.type) ||
        message.getAssociatedActivity?.()?.type === "attack");
}

const RETARGET_ID="ugmuls-5-5e-automation";
export function canRetargetCard(message,user=game.user){
 if(user?.isGM||message?.isOwner&&user?.id===game.user.id)return true;
 if(message?.isContentVisible===false||message?.type!=="usage"||!message.getFlag?.(RETARGET_ID,"epitomeStrideDamage"))return false;
 const actor=message.getAssociatedActor?.()??message.getAssociatedActivity?.()?.actor;
 return !!actor?.testUserPermission?.(user,"OWNER");
}
export async function receiveStrideRetarget(packet){
 if(packet?.action!=="retargetStrideCard"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;
 const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);
 if(!user?.active||!card?.getFlag?.(RETARGET_ID,"epitomeStrideDamage")||!canRetargetCard(card,user)||!Array.isArray(packet.targets))return;
 const source=card.getAssociatedToken?.(),scene=(source?.document??source)?.parent??globalThis.canvas?.scene,targets=[];
 for(const uuid of new Set(packet.targets)){
  if(typeof uuid!=="string")return;
  const token=await fromUuid(uuid);
  if(!token?.actor||token.parent?.id!==scene?.id||!user.isGM&&token.hidden)continue;
  targets.push(token);
 }
 await retargetSpellCard(card,targets);
}
export async function retargetSpellCard(message, targets = game.user.targets) {
    if (!game.settings.get("ugmuls-5-5e-automation", "retargetActivityCards")) return;
    if (!supportsRetarget(message) || !canRetargetCard(message) || pendingCards.has(message)) return;
    if(globalThis.Ugmuls55eAutomationLandsAid?.part?.(message)){pendingCards.add(message);try{return await globalThis.Ugmuls55eAutomationLandsAid.retarget(message,targets);}finally{pendingCards.delete(message);}}
    const descriptors = [...new Map(Array.from(targets).filter(isHealingCard(message)?isEligibleHealingTarget:isEligibleTarget).map(target => {
        const token = target.document ?? target;
        return [token.uuid, describeTarget(token)];
    })).values()];
    // The owning Monk can choose recipients, while the GM updates its own
    // usage card and every linked roll, including player-authored damage.
    if(!game.user.isGM&&!message.isOwner&&message.getFlag?.(RETARGET_ID,"epitomeStrideDamage")){
        const gm=game.users.activeGM;if(!gm)throw Error("A connected GM is required to retarget this aura card.");
        game.socket.emit("module."+RETARGET_ID,{action:"retargetStrideCard",messageId:message.id,userId:game.user.id,gmId:gm.id,targets:descriptors.map(t=>t.token)});
        return;
    }
    pendingCards.add(message);
    try {
        let cards;
        if (message.type === "attack") {
            const origin=message.system?.origin;
            const usage=typeof origin === "string" ? game.messages.get(origin) : origin;
            const attacks=usage?.getAssociatedRolls?.("attack") ?? [message];
            const damage=(usage?.getAssociatedRolls?.("damage") ?? message.getAssociatedRolls?.("damage") ?? []).filter(card=>{
                if(card.getFlag?.("ugmuls-5-5e-automation","masteryGrazeUndone"))return false;
                const source=card.getFlag?.("ugmuls-5-5e-automation","damageAttackId");
                if (source) return source === message.id;
                // Native/manual damage may lack our explicit attack flag.
                // Use the most recent attack preceding that damage roll.
                if (!Number.isFinite(card.timestamp) || !Number.isFinite(message.timestamp)) return attacks.length === 1;
                const preceding=[...attacks].filter(attack=>attack.timestamp <= card.timestamp)
                    .sort((a,b)=>b.timestamp-a.timestamp)[0];
                return preceding?.id === message.id;
            });
            cards=[message, ...damage];
        } else {
            cards=[message, ...(message.getAssociatedRolls?.("attack") ?? []),
                ...(message.getAssociatedRolls?.("damage") ?? []).filter(card=>!card.getFlag?.("ugmuls-5-5e-automation","masteryGrazeUndone")),
                ...(message.getAssociatedRolls?.("healing") ?? [])];
        }
        cards=[...new Set(cards)];
        let skipped = false;
        for (const card of cards) {
            if (!game.user.isGM && !card.isOwner) { skipped = true; continue; }
            if (card._targetState) {
                card._targetState.mode = "targeted";
                card._targetState.checked?.clear?.();
            }
            // Only replace target descriptors. Keep rolls, save outcomes,
            // resource use, and damage-application records intact.
            await card.update({ "system.targets": descriptors,
                "flags.ugmuls-5-5e-automation.retargeted": true }, { rsaRetarget: true });
        }
        if (skipped) ui.notifications.warn("Card retargeted. A linked roll belongs to another user; ask the GM to refresh it too.");
    } finally { pendingCards.delete(message); }
}

export function addRetargetButton(message, html) {
    hideRemovedTargetSummaries(message, html);
    if (!game.settings.get("ugmuls-5-5e-automation", "retargetActivityCards")) return;
    const container=html instanceof HTMLElement?html:html?.[0];
    if(globalThis.Ugmuls55eAutomationLandsAid?.part?.(message)==='usage'){
        for(const summary of container?.querySelectorAll?.('.card-summary[data-message-id]')??[]){const card=game.messages.get(summary.dataset.messageId);if(globalThis.Ugmuls55eAutomationLandsAid?.part?.(card)==='healing')addRetargetButton(card,summary);}
    }
    if(globalThis.Ugmuls55eAutomationLandsAid?.part?.(message)==='damage'){for(const button of container?.querySelectorAll?.('[data-rsa-retarget]')??[])button.remove?.();return;}
    if (!supportsRetarget(message) || !canRetargetCard(message)) return;
    if (message.type === "usage" && message.getAssociatedActivity?.()?.type === "attack" &&
        game.settings.get("ugmuls-5-5e-automation","simplifyAttackCards") === true) return;
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;
    // Inline healing controls belong to their own summary, not the save usage.
    const owns=node=>{const summary=node.closest?.('.card-summary[data-message-id]');return !summary||summary===root;};
    const landBranch=globalThis.Ugmuls55eAutomationLandsAid?.part?.(message);
    const ownQuery=selector=>landBranch?Array.from(root.querySelectorAll(selector)).find(owns):root.querySelector(selector);
    const existingButton=ownQuery('[data-rsa-retarget]');
    if (existingButton && message.type !== "attack") return;
    let controls;
    if (message.type === "attack") {
        controls=root.querySelector(".rsa-attack-actions");
        if (!controls) {
            const face=root.querySelector(".chat-card") ?? root.querySelector(".message-content");
            if (!face) return;
            controls=document.createElement("div");
            controls.className="rsa-attack-actions";
            face.append(controls);
        }
    } else {
        controls=root.querySelector(".chat-card > .icon-row:last-child ul") ??
            root.querySelector(".card-buttons") ?? root.querySelector(".chat-card") ?? (globalThis.Ugmuls55eAutomationLandsAid?.part?.(message)?root:null);
    }
    if (!controls) return;
    if (existingButton) {
        const oldEntry=existingButton.closest("li");
        controls.append(existingButton);
        if (oldEntry && !oldEntry.children.length) oldEntry.remove();
        return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.rsaRetarget = "";
    const landPart=globalThis.Ugmuls55eAutomationLandsAid?.part?.(message);
    button.dataset.tooltip = landPart ? "Replace only this "+landPart+" result’s targets" : "Replace targets with your current map targets and refresh attack results using current AC";
    button.innerHTML = '<i class="fa-solid fa-bullseye" aria-hidden="true"></i> Retarget';
    button.addEventListener("click", async event => {
        event.preventDefault(); event.stopPropagation();
        button.disabled = true;
        try { await retargetSpellCard(message); }
        catch (err) {
            console.error("Ugmuls 5.5e Automation | Could not retarget spell card:", err);
            ui.notifications.error("Could not retarget the spell card. Check F12 console.");
        } finally { button.disabled = false; }
    });
    if (controls.tagName === "UL") {
        const entry = document.createElement("li");
        entry.append(button);
        controls.append(entry);
    } else controls.append(button);
}

export function hideRemovedTargetSummaries(message, html) {
    if (!message.getFlag?.("ugmuls-5-5e-automation", "retargeted")) return;
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;
    const targets = new Set((message.system.targets ?? []).map(target => target.token).filter(Boolean));
    for (const summary of root.querySelectorAll(".card-summary[data-target-uuid]")) {
        // Keep the save roll associated with its original card. Only its inline
        // presentation is hidden, and retargeting it back restores the summary.
        summary.hidden = !targets.has(summary.dataset.targetUuid);
        summary.style.display = summary.hidden ? "none" : "";
    }
}

// Core renderChatMessageHTML fires before D&D5e injects its usage-card template.
// Use the system's completed-card hook so the action row exists.
Hooks.once("init", () => game.settings.register("ugmuls-5-5e-automation", "retargetActivityCards", {
    name: "Show Retarget on Spell, Feature and Attack Cards",
    hint: "Allow GMs and card owners to replace an activity card's targets with their current map targets. Attack results refresh against current AC; previous dice rolls remain unchanged.",
    scope: "world", config: true, type: Boolean, default: true,
    onChange: () => ui.chat?.render({ force: true })
}));
Hooks.once("ready", () => {
 Hooks.on("dnd5e.renderChatMessage",addRetargetButton);
 game.socket.on("module."+RETARGET_ID,packet=>{receiveStrideRetarget(packet).catch(error=>{console.error("Destructive Stride Retarget",error);ui.notifications.error(error.message);});});
});
