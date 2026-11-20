// Timing: outcome / attack-hit.
import {describeTarget,isRollAdjustmentLocked,linkedHpCards} from "./shared-activity-card.js";
import {reactionSpellAvailable,reactionSpellCastPlan,useReactionSpellPlan} from "./reaction-spell-resources.js";
const MODULE_ID="ugmuls-5-5e-automation";
const busy=new Set();

export function shieldReactionAvailable(actor) {
    return reactionSpellAvailable(actor);
}

export function shieldCastPlan(actor) {
    return reactionSpellCastPlan(actor,'shield',{activityType:'utility'});
}
export function shieldActivity(actor){return shieldCastPlan(actor)?.activity??null;}
export async function castShield(actor,attack,{timingWindow=null}={}) {
    // Shield cannot change a critical hit. Enforce this on stale buttons too.
    if(attack?.rolls?.some(roll=>roll.isCritical===true))return;
    const plan=shieldCastPlan(actor);if(!plan)return;
    const message={data:{flags:{[MODULE_ID]:{shieldReactionAttack:attack.id,...(timingWindow?{reactionTimingShieldWindow:timingWindow}:{})}}}};
    return useReactionSpellPlan(plan,{message});
}

// Reaction Shield is a self buff. Native copied/granted effects can retain an
// explicit origin.actor or a generic turnStart expiry from their base effect.
// Normalize only a fresh application from this reaction's exact usage card;
// expiry/Undo updates and existing world effects are never rewritten.
export function shieldExpiryChanges(effect,data){
    const reference=data?.['system.origin.message']??data?.system?.origin?.message;
    if(typeof reference!=='string')return null;
    const cast=game.messages.get(reference.replace(/^ChatMessage\./,''));
    if(!cast?.getFlag?.(MODULE_ID,'shieldReactionAttack'))return null;
    const caster=cast.getAssociatedActor?.(),recipient=effect.actor??effect.parent;
    if(!caster?.uuid||recipient?.uuid!==caster.uuid)return null;
    return {'duration.expiry':'sourceStart','system.origin.actor':caster.uuid};
}
export function prepareShieldExpiry(effect,data){
    const updates=shieldExpiryChanges(effect,data);if(updates)effect.updateSource(updates);
}
export function refreshShieldExpiry(effect,changes){
    const updates=shieldExpiryChanges(effect,changes);if(!updates)return;
    Object.assign(changes,updates);
    if(changes.duration)changes.duration.expiry=updates['duration.expiry'];
    if(changes.system?.origin)changes.system.origin.actor=updates['system.origin.actor'];
}

export async function refreshShieldAttack(attack,{settledSource=null}={}) {
    if (!attack || attack.type !== "attack" || (!game.user.isGM && !attack.isOwner)) return;
    const targets=[];
    for (const descriptor of attack.system.targets ?? []) {
        const token=descriptor.token ? await fromUuid(descriptor.token) : null;
        const target=token?.actor?describeTarget(token):{...descriptor};
        const records=attack.getFlag?.(MODULE_ID,"valorDefense");
        const valor=globalThis.Ugmuls55eAutomationValor?.defenseRecord?.(attack,target.token)??records?.[target.token?.split('.').at(-1)]??records?.[target.token]??target.token?.split('.').reduce((node,key)=>node?.[key],records);
        if(valor&&Number.isFinite(target.ac))target.ac+=Number(valor.bonus)||0;
        targets.push(target);
    }
    const settled=settledSource&&game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
    await attack.update({"system.targets":targets, [`flags.${MODULE_ID}.shieldRechecked`]:true,...(settled?{[`flags.${MODULE_ID}.shieldReactionSettled`]:settledSource}:{})},{rsaRetarget:true});
    if(settled)await globalThis.Ugmuls55eAutomationReactionTiming?.shieldSettled(attack,settledSource);
}

export function damageMissedAfterAttack(damage) {
    if (damage?.type !== "damage") return false;
    // A later miss must never conceal an HP/effect transaction that still
    // needs Undo. These flags are live, so Undo can hide the empty card again.
    if(damage.getFlag?.(MODULE_ID,"hpApplicationRecorded")||damage.getFlag?.(MODULE_ID,"damageUndoHistory")?.length||damage.getFlag?.(MODULE_ID,"effectUndoHistory")?.length)return false;
    if(damage.getFlag?.(MODULE_ID,"masteryGraze")||(globalThis.Ugmuls55eAutomationAcidArrow?.allowsMiss(damage.getAssociatedActivity?.())||globalThis.Ugmuls55eAutomationPotentCantrip?.allowsMiss(damage.getAssociatedActivity?.())))return false;
    const origin=damage.system?.origin;
    const card=typeof origin === "string" ? game.messages.get(origin) : origin;
    if (!card&&!damage.getFlag?.(MODULE_ID,"damageAttackId")) return false;
    const explicit=damage.getFlag?.(MODULE_ID,"damageAttackId");
    const attacks=card?.type === "attack" ? [card] : card?.getAssociatedRolls?.("attack") ?? [];
    const attack=explicit ? game.messages.get(explicit) : [...attacks]
        .filter(attack=>attack.timestamp <= damage.timestamp)
        .sort((a,b)=>b.timestamp-a.timestamp)[0];
    if(attack?.type!=="attack")return false;
    if(attack.getFlag?.(MODULE_ID,"effectUndoHistory")?.length||card?.getFlag?.(MODULE_ID,"effectUndoHistory")?.length)return false;
    const targets=attack.system.evaluatedTargets ?? [];
    return targets.length>0 && targets.every(target=>target.isMiss === true);
}

export const damageMissedAfterShield=damageMissedAfterAttack;

export function hideShieldMissDamage(message, html) {
    const root=html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;
    if (message.type === "damage") {
        const hide=damageMissedAfterAttack(message);
        if (hide) {root.hidden=true;root.classList.add("rsa-missed-attack-damage");root.dataset.rsaShieldHidden="true";}
        else if (root.dataset.rsaShieldHidden) {root.hidden=false;root.classList.remove("rsa-missed-attack-damage");delete root.dataset.rsaShieldHidden;}
    }
    for (const summary of root.querySelectorAll(".card-summary[data-message-id]")) {
        const damage=game.messages.get(summary.dataset.messageId);
        if (damage?.type !== "damage") continue;
        if (damageMissedAfterAttack(damage)) {
            summary.hidden=true;summary.classList.add("rsa-missed-attack-damage");summary.dataset.rsaShieldHidden="true";
        } else if (summary.dataset.rsaShieldHidden) {
            summary.hidden=false;summary.classList.remove("rsa-missed-attack-damage");summary.style.display="";delete summary.dataset.rsaShieldHidden;
        }
    }
}
export function addShieldButtons(message, html) {
    if (game.settings.get(MODULE_ID,"showShieldReaction") !== true) return;
    const root=html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;
    const entries=message.type === "attack" ? [{message,root}] : [];
    for (const summary of root.querySelectorAll(".card-summary[data-message-id]")) {
        const attack=game.messages.get(summary.dataset.messageId);
        if (attack?.type === "attack" && !summary.hidden) entries.push({message:attack,root:summary});
    }
    for (const entry of entries) {
        entry.root.querySelectorAll('[data-rsa-shield]').forEach(button=>button.remove());
        entry.root.querySelectorAll(':scope > .rsa-shield-actions').forEach(controls=>controls.remove());
        if (!entry.message.isContentVisible || isRollAdjustmentLocked(entry.message)||entry.message.rolls?.some(roll=>roll.isCritical===true)) continue;
        const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-shield-actions";
        const recipients=new Set();
        for (const pill of entry.root.querySelectorAll("target-pill")) {
            if (pill.hasAttribute("data-miss")) continue;
            const uuid=pill.querySelector("datalist option")?.value;
            if(!uuid||recipients.has(uuid))continue;
            if(globalThis.Ugmuls55eAutomationReactionTiming?.defenseAllowed?.(entry.message,'shield',uuid)===false)continue;
            const token=fromUuidSync(uuid,{strict:false}),actor=token?.actor;
            if (!actor || (!game.user.isGM && !actor.isOwner)) continue;
            const activity=shieldActivity(actor);
            if (!activity) continue;
            recipients.add(uuid);
            const button=document.createElement("button");
            button.type="button";button.dataset.rsaShield=uuid;
            button.dataset.tooltip="Cast Shield using your reaction, then refresh this attack";
            const image=document.createElement("img");image.src=activity.item?.img??"icons/svg/shield.svg";image.alt="";
            button.append(image,document.createTextNode("Shield — "+(token.name??actor.name??"Target")));
            button.addEventListener("click",async event=>{
                event.preventDefault();event.stopPropagation();
                const key=entry.message.id+":"+uuid;
                if (busy.has(key)) return;
                busy.add(key);button.disabled=true;
                try {
                    if(globalThis.Ugmuls55eAutomationReactionTiming?.defenseWindow(entry.message)){await globalThis.Ugmuls55eAutomationReactionTiming.shield(entry.message,uuid);return;}
                    const current=shieldActivity(actor);
                    if (!current || isRollAdjustmentLocked(entry.message)) return;
                    const results=await castShield(actor,entry.message);
                    if (results?.message) await refreshShieldAttack(entry.message);
                } catch(err) {
                    console.error("Ugmuls 5.5e Automation | Shield reaction failed:",err);
                    ui.notifications.error("Could not cast Shield. Use the actor's spell sheet.");
                } finally {busy.delete(key);button.disabled=!shieldActivity(actor);}
            });
            controls.append(button);
        }
        if(recipients.size)entry.root.append(controls);
    }
}
Hooks.once("init",()=>game.settings.register(MODULE_ID,"showShieldReaction",{
    name:"Effect Automation: Show Shield Reaction",
    hint:"Show a Shield casting button on hit results for owned actors with an available reaction and spell resources. Native casting handles consumption.",
    scope:"world",config:true,type:Boolean,default:true
}));
Hooks.once("ready",()=>{
    Hooks.on("preCreateActiveEffect",prepareShieldExpiry);
    Hooks.on("preUpdateActiveEffect",refreshShieldExpiry);
    Hooks.on("dnd5e.renderChatMessage",(message,html)=>{
        hideShieldMissDamage(message,html);
        try {addShieldButtons(message,html);} catch(err) {console.error("Ugmuls 5.5e Automation | Shield controls failed:",err);}
    });
    Hooks.on("updateChatMessage",(message,changes)=>{
        const shieldSource=message.getFlag?.(MODULE_ID,"shieldReactionAttack");
        if(shieldSource&&((message.getFlag(MODULE_ID,"buffAutoApplied")&&(changes.flags?.[MODULE_ID]?.buffAutoApplied===true||changes[`flags.${MODULE_ID}.buffAutoApplied`]===true))||(message.getFlag(MODULE_ID,"outcomeEffectsApplied")&&(changes.flags?.[MODULE_ID]?.outcomeEffectsApplied===true||changes[`flags.${MODULE_ID}.outcomeEffectsApplied`]===true)))){refreshShieldAttack(game.messages.get(shieldSource),{settledSource:message.id}).catch(console.error);return;}
        if (message.type !== "attack") return;
        if (!Object.hasOwn(changes,"system.targets") && !changes.system?.targets && !changes.rolls) return;
        const origin=message.system.origin;
        const card=typeof origin === "string" ? game.messages.get(origin) : origin;
        for (const damage of linkedHpCards(message)) globalThis.Ugmuls55eAutomationChatRefresh?.card(damage);
        if (card) globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
    });
    const refreshReactions=document=>globalThis.Ugmuls55eAutomationChatRefresh?.request("shield",document);
    for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect","updateCombat","deleteCombat","updateActor","createItem","updateItem","deleteItem"])Hooks.on(event,refreshReactions);
    Hooks.on("ugmuls55eAutomation.buffEffectsApplied",(cast)=>{
        const id=cast.getFlag(MODULE_ID,"shieldReactionAttack");
        if (id) refreshShieldAttack(game.messages.get(id),{settledSource:cast.id}).catch(console.error);
    });
});
