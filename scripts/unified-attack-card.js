import {isRollAdjustmentLocked} from './shared-activity-card.js';
import {addRetargetButton} from './retarget-card.js';
import {damageMissedAfterAttack} from './shield-reaction.js';
import {shotCount} from './multi-shot-attacks.js';

const ID='ugmuls-5-5e-automation';
const applicationTrayStates=new WeakMap(),boundApplicationTrays=new WeakSet();
const boundCasterNames=new WeakSet();
const rollDetailStates=new WeakMap(),boundRollDetails=new WeakSet();
const origin=card=>typeof card?.system?.origin==='string'?game.messages.get(card.system.origin.replace(/^ChatMessage\./,'')):card?.system?.origin;
const rolls=(card,type)=>Array.from(card.getAssociatedRolls?.(type)??[]);
export function restoreRollDetails(card,summary){
    if(card?.isContentVisible===false||summary.hidden)return;
    let states=rollDetailStates.get(card);if(!states){states=[];rollDetailStates.set(card,states);}
    for(const [index,button]of Array.from(summary.querySelectorAll('button.dice-roll')).entries()){
        const popover=button.nextElementSibling?.matches?.('.roll-breakdown[popover]')?button.nextElementSibling:null;
        const state=states[index]??={};
        if(state.expanded!==undefined)button.classList.toggle('expanded',state.expanded);
        if(!boundRollDetails.has(button)){
            boundRollDetails.add(button);
            // Keep native click/default popover handling. Only remember this
            // viewer's choice; a queued unified render must not discard it.
            button.addEventListener('click',()=>queueMicrotask(()=>{
                if(button.isConnected!==false)state.expanded=button.classList.contains('expanded');
            }));
            popover?.addEventListener('beforetoggle',event=>{
                if(popover.isConnected!==false)state.open=event.newState==='open';
            });
        }
        if(!popover||state.open!==true)continue;
        // Native showPopover requires a connected element. Rendering is still
        // detached here; restore once after insertion without another render.
        (globalThis.requestAnimationFrame??(callback=>setTimeout(callback,0)))(()=>{
            if(popover.isConnected!==true||summary.hidden||state.open!==true||popover.matches(':popover-open'))return;
            popover.showPopover({source:button});
        });
    }
}
export function moveUnifiedControls(summary,child,footer){
    const group=document.createElement('div');group.dataset.messageId=child.id;group.className='rsa-unified-control-group';
    // Move native nodes with their handlers and recorded source identity.
    // Attack, save and healing layouts must use the same exclusions.
    for(const button of summary.querySelectorAll('button')){
        if(!button.closest('.rsa-attack-actions')&&!globalThis.Ugmuls55eAutomationReactive?.isControl?.(button))continue;
        if(button.matches('[data-rsa-retarget]')||button.closest('[data-rsa-save-modes],[data-rsa-damage-modes],damage-application'))continue;
        let controls=button.closest('.rsa-attack-actions');
        if(!controls){controls=button;while(controls.parentElement!==summary&&globalThis.Ugmuls55eAutomationReactive?.isControl?.(controls.parentElement))controls=controls.parentElement;}
        if(controls===summary||controls===summary.querySelector('.chat-card'))group.append(button);
        else if(!group.contains(controls))group.append(controls);
    }
    if(group.children.length)footer.append(group);
}
export function mergeAttackTags(usageFace,attackFace){
    const properties=face=>face?.querySelector('.icon-row .fa-tag')?.closest('.icon-row')?.querySelector('ul.pills');
    const source=properties(usageFace),destination=properties(attackFace);
    if(!source||!destination)return;
    const label=pill=>(pill.querySelector('.label')?.textContent??pill.textContent).trim();
    const localize=value=>game.i18n?.localize?.(value)??value;
    // Match native localized labels, not weapon names or item flags. Preserve
    // all other properties, including range, proficiency and custom riders.
    const redundant=new Set(['Weapon','Martial','Ranged',
        localize(CONFIG.Item?.typeLabels?.weapon??'TYPES.Item.weapon'),
        localize(CONFIG.DND5E?.weaponProficiencies?.mar??'DND5E.WeaponMartialProficiency'),
        localize(CONFIG.DND5E?.attackTypes?.ranged?.label??'DND5E.AttackRanged')]);
    const seen=new Set();
    for(const pill of [...destination.children,...source.children]){
        if(!pill.matches('li.pill')||pill.querySelector('button,[data-action],[data-forward-action]'))continue;
        const text=label(pill);
        if(redundant.has(text)||seen.has(text)){pill.remove();continue;}
        seen.add(text);destination.append(pill);
    }
}
export function unifiedAttackScope(card){
    if(game.settings.get(ID,'simplifyAttackCards')!==true||card?.type!=='usage'||card.isContentVisible===false)return null;
    const activity=card.getAssociatedActivity?.(),attacks=rolls(card,'attack'),damage=rolls(card,'damage').filter(result=>
        !(result.getFlag?.(ID,'masteryGraze')&&result.getFlag?.(ID,'masteryGrazeUndone')&&!result.getFlag?.(ID,'hpApplicationRecorded')&&
            !result.getFlag?.(ID,'damageUndoHistory')?.length&&!result.getFlag?.(ID,'effectUndoHistory')?.length));
    const spell=activity?.item?.type==='spell';
    if(activity?.type!=='attack'||!activity.item||rolls(card,'save').length||rolls(card,'healing').length)return null;
    if(activity.item.type==='weapon'&&(attacks.length>1||attacks.length&&card.system?.targets?.length!==1))return null;
    if(!attacks.length&&damage.length)return null;
    if(attacks.some(attack=>attack.system?.targets?.length!==1))return null;
    const groups=attacks.map(attack=>({attack,damage:[]}));
    for(const result of damage){
        const explicit=result.getFlag?.(ID,'damageAttackId');
        // Multiple attacks require explicit links, never matching totals,
        // timestamps or the viewer's current target selection.
        const group=explicit?groups.find(g=>g.attack.id===explicit):groups.length===1?groups[0]:null;
        if(!group)return null;
        if(activity.item.type!=='weapon'&&(result.system?.targets?.length!==1||result.system.targets[0].token!==group.attack.system.targets[0].token))return null;
        group.damage.push(result);
    }
    return {attack:attacks[0],damage,groups,spell};
}

export async function renderAttackSetup(card,activity,{targets=card.system?.targets??[],rolling=false}={}){
    const item=activity.item,modes=item.system?.attackModes??[],saved=item.getFlag?.('dnd5e',`last.${activity.id}.attackMode`);
    const mode=modes.find(m=>m.value===saved)?.value??modes[0]?.value;
    const masteryKey=item.getFlag?.('dnd5e',`last.${activity.id}.mastery`),mastery=CONFIG.DND5E?.weaponMasteries?.[masteryKey];
    // Native markup and live cast data, without creating an attack document,
    // evaluating dice or guessing hit/miss before a result actually exists.
    const context={header:{item,activity,subtitle:activity.name},
        rows:{properties:{entries:(activity.getActionLabel?.(mode)??[]).map(label=>({label})),icon:'fa-solid fa-tag',label:'DND5E.CHATMESSAGE.Row.Properties'}},
        targets:targets.map(target=>({...target,showAC:false,showResult:false})),rolls:[],
        ...(mastery?{mastery:{label:mastery.label,reference:mastery.reference}}:{})};
    const row=document.createElement('div');row.className='icon-row rsa-attack-setup-roll';
    const icon=document.createElement('i');icon.className='fa-fw fa-solid fa-dice';icon.setAttribute('aria-hidden','true');
    const label=document.createElement('div');label.className='rsa-unified-pending rsa-attack-setup-dice';label.setAttribute('role','status');
    label.setAttribute('aria-label',rolling?'Pending — rolling attack':'Pending — roll setup');
    label.textContent='---PENDING---';row.append(icon,label);
    const template=CONFIG.ChatMessage?.dataModels?.attack?.metadata?.template??'systems/dnd5e/templates/chat/attack-card.hbs';
    return await foundry.applications.handlebars.renderTemplate(template,context)+row.outerHTML;
}

export async function renderUnifiedAttack(wrapped,options={}){
    const html=await wrapped(options),card=this.parent,scope=unifiedAttackScope(card);
    if(!scope||options.summary)return html;
    const container=document.createElement('div');container.innerHTML=html;
    container.querySelectorAll('.card-summary[data-message-id]').forEach(node=>node.remove());
    container.classList.add('rsa-unified-attack');
    const activity=card.getAssociatedActivity?.(),total=shotCount(activity,card);
    if(!scope.groups.length){
        const preparation=document.createElement('div');preparation.className='card-summary rsa-roll-attack rsa-attack-preparation';
        try{preparation.innerHTML=await renderAttackSetup(card,card.getAssociatedActivity?.({scaled:true})??activity);}
        catch(error){console.error('Ugmuls 5.5e Automation | Attack setup render failed; retaining native card.',error);return html;}
        container.append(preparation);
    }
    for(const [index,group]of scope.groups.entries()){
        const instance=document.createElement('section');instance.className='rsa-attack-instance';instance.dataset.rsaAttackId=group.attack.id;
        if(total>1||scope.groups.length>1){
            const label=document.createElement('div');label.className='rsa-attack-label';
            label.textContent=total>1?`${activity.item.name??activity.name??'Spell'} Attack ${index+1} of ${total}`:'Attack '+(index+1);instance.append(label);
        }
        for(const child of [group.attack,...group.damage]){
            if(child.visible===false||child.isContentVisible===false)continue;
            const animating=child._dice3danimating&&game.settings.get('dice-so-nice','immediatelyDisplayChatMessages')!==true;
            const row=document.createElement('div');row.className=`card-summary rsa-roll-${child.type}`;
            // DsN hides nested [data-message-id] results while animating. This
            // attack face contains only neutral setup, not a revealed result;
            // leave it outside that selector until the actual result is shown.
            if(animating&&child.type==='attack')row.dataset.rsaPendingAttackId=child.id;
            else row.dataset.messageId=child.id;
            if(animating){
                if(child.type==='attack'){
                    try{row.innerHTML=await renderAttackSetup(card,child.getAssociatedActivity?.({scaled:true})??activity,{targets:child.system.targets,rolling:true});}
                    catch(error){console.error('Ugmuls 5.5e Automation | Attack animation setup render failed; retaining native card.',error);return html;}
                }else{const pending=document.createElement('p');pending.className='rsa-unified-pending';pending.textContent=`Pending — rolling ${child.type}`;row.append(pending);}
            }else {
                try {row.innerHTML=await child.system.render({summary:false});}
                catch(error){console.error('Ugmuls 5.5e Automation | Unified attack render failed; retaining native cards.',error);return html;}
            }
            instance.append(row);
        }
        container.append(instance);
    }
    return container.outerHTML;
}

export function supportsUnifiedApplication(damage){
    if(damage?.type!=='damage')return false;
    const scope=unifiedAttackScope(origin(damage));
    return !!scope?.groups.some(group=>(group.damage.length===1||damage.getFlag?.(ID,'masteryGraze'))&&group.damage.some(result=>result.id===damage.id));
}
export function supportsUnifiedAttack(attack){
    if(attack?.type!=='attack')return false;
    const scope=unifiedAttackScope(origin(attack));
    return !!scope?.groups.some(group=>group.attack.id===attack.id&&group.damage.length<=1);
}

export function hideLockedReactionControls(card,root){
    if(!isRollAdjustmentLocked(card))return;
    const emptyGroups=new Set();
    for(const button of root.querySelectorAll('button')){
        // Keep history and reactions that can legitimately follow application.
        // Only unavailable reaction buttons disappear from a committed result.
        if(!button.disabled||!globalThis.Ugmuls55eAutomationReactive?.isControl?.(button))continue;
        const group=button.closest('.rsa-attack-actions');
        button.remove();if(group)emptyGroups.add(group);
    }
    for(const group of emptyGroups)if(!group.children.length&&!group.textContent.trim())group.remove();
}

export function restoreApplicationTray(card,tray){
    // Viewer-local presentation only. Recompute application state from live
    // histories; never use this memory as an authority/adjustment-lock cache.
    const applied=!!card.getFlag?.(ID,'hpApplicationRecorded')||(card.getFlag?.(ID,'damageUndoHistory')??[]).length>0;
    const reopened=card.getFlag?.(ID,'damageApplyReopened')??null;
    let state=applicationTrayStates.get(card);
    // Undo's history writes can render before its final reopen receipt. Consume
    // each receipt once, even if applied already became false in that gap.
    if(!state||state.applied!==applied||!applied&&reopened&&state.reopened!==reopened){
        state={applied,reopened,open:applied?false:reopened?true:tray.open};
        applicationTrayStates.set(card,state);
    }
    tray.open=state.open;
    if(boundApplicationTrays.has(tray))return;
    boundApplicationTrays.add(tray);
    tray.addEventListener('toggle',()=>{
        // A replaced card must not overwrite the state of its successor.
        if(tray.isConnected===false)return;
        const current=applicationTrayStates.get(card);if(current)current.open=tray.open;
    });
}

export function combineApplicationControls(card,home,scope){
    // Before the damage roll there is no separate effect Apply step. Keep the
    // native tray mounted for system state, but make damage Apply the entry.
    if(scope.damage.length<=1&&!card.getFlag?.(ID,'manualEffectDecision'))for(const tray of home.querySelectorAll('effect-application')){
        tray.hidden=true;tray.dataset.rsaUnifiedEffects='true';
    }
    for(const summary of home.querySelectorAll('.card-summary[data-message-id]')){
        const damage=game.messages.get(summary.dataset.messageId);if(!supportsUnifiedApplication(damage))continue;
        const graze=damage.getFlag?.(ID,'masteryGraze');
        const hp=damage.getFlag?.(ID,'hpApplicationRecorded')||(damage.getFlag?.(ID,'damageUndoHistory')??[]).length>0||
            graze&&!damage.getFlag?.(ID,'masteryGrazeUndone')&&(damage.getFlag?.(ID,'automaticDamageTargets')??[]).length>0;
        const effects=!graze&&[damage,scope.attack,...(card.getAssociatedActivity?.()?.item?.type==='weapon'?[card]:[])].some(source=>(source.getFlag?.(ID,'effectUndoHistory')??[]).length>0);
        summary.classList.toggle('rsa-unified-applied',!!hp);
        const undoRoot=graze?summary:home;
        for(const button of undoRoot.querySelectorAll?.(graze?'[data-rsa-undo-damage]':'[data-rsa-undo-damage],[data-rsa-undo-effect]')??[])button.remove();
        for(const button of graze?[]:home.querySelectorAll('[data-rsa-reapply-hit-effects]')){
            if(!hp)button.remove();
            else {button.textContent='Retry Apply';button.dataset.tooltip='Retry remaining effects without applying damage again.';}
        }
        if(!(hp||effects)||!game.user.isGM||damage.isContentVisible===false)continue;
        let controls=summary.querySelector('.rsa-damage-actions');
        if(!controls){controls=document.createElement('div');controls.className='rsa-attack-actions rsa-damage-actions';summary.append(controls);}
        const button=document.createElement('button');button.type='button';button.dataset.rsaUndoApply='';
        button.innerHTML='<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Undo Apply';
        button.dataset.tooltip='Undo this attack’s damage and applied effects.';
        button.addEventListener('click',async event=>{
            event.preventDefault();event.stopPropagation();if(button.disabled)return;button.disabled=true;
            const finish=globalThis.Ugmuls55eAutomationFollowChatChanges?.(button)??(()=>{});
            try{
                const gm=game.users.activeGM;
                if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'undoAttackApplication',messageId:damage.id,userId:game.user.id,gmId:gm.id});
                else await globalThis.Ugmuls55eAutomationUndoAttackApplication?.(damage);
            }catch(error){console.error('Ugmuls 5.5e Automation | Undo Apply failed',error);ui.notifications.error('Could not complete Undo Apply. Remaining changes can be retried.');}
            finally{finish();button.disabled=false;globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
        });controls.append(button);
    }
}

export function restoreStandaloneChildren(card){
    for(const child of [...rolls(card,'attack'),...rolls(card,'damage')]){
        for(const node of globalThis.document?.querySelectorAll?.('.chat-message[data-message-id="'+child.id+'"]')??[]){
            if(!node.dataset.rsaUnifiedChild)continue;
            delete node.dataset.rsaUnifiedChild;
            // Native grouping still owns its own hiding. Restore only the
            // standalone presentation that this module previously suppressed.
            node.hidden=game.settings.get('dnd5e','chatCardSummary')===true;
        }
    }
}
export function canViewAttackDescription(card,user=game.user){
    if(card?.isContentVisible===false)return false;
    if(user?.isGM)return true;
    const actor=card?.getAssociatedActor?.(),token=card?.getAssociatedToken?.();
    return !!actor&&(actor.hasPlayerOwner===true||token?.disposition===(globalThis.CONST?.TOKEN_DISPOSITIONS?.FRIENDLY??1));
}
export function presentUnifiedNames(card,root,home){
    // Reuse only the viewer-enriched text already rendered in this usage card.
    // Never fetch item/GM descriptions or enrich secrets independently here.
    const description=home.querySelector(':scope > .chat-card .card-description .wrapper');
    const allowed=canViewAttackDescription(card),text=description?.innerHTML?.trim();
    for(const name of home.querySelectorAll('.rsa-roll-attack > .chat-card .card-header .name-stacked > .title')){
        if(allowed&&text){name.dataset.tooltip=text;name.dataset.tooltipClass='dnd5e2 rsa-attack-description-tooltip';name.dataset.rsaAttackDescription='true';}
        else if(name.dataset.rsaAttackDescription){delete name.dataset.tooltip;delete name.dataset.tooltipClass;delete name.dataset.rsaAttackDescription;}
    }
    const sender=root.querySelector('.message-sender'),name=sender?.querySelector('.name-stacked')??sender;
    // Native usage headers attach hover to the avatar; compact styling hides
    // that avatar. Bind the visible name to the same native token handlers.
    // Headers already bound on the sender continue using their native listener.
    if(!name||sender?.dataset.tokenUuid||boundCasterNames.has(name)||card.isContentVisible===false)return;
    const actor=card.getAssociatedActor?.(),token=card.getAssociatedToken?.();
    if(!token||typeof card._onTargetHoverIn!=='function'||typeof card._onTargetHoverOut!=='function')return;
    if(actor)name.dataset.actorUuid=actor.uuid;name.dataset.tokenUuid=token.uuid;
    name.addEventListener('pointerover',card._onTargetHoverIn.bind(card));
    name.addEventListener('pointerout',card._onTargetHoverOut.bind(card));
    boundCasterNames.add(name);
}
export function renderFlurryLabels(card,root){
    if(!root?.querySelectorAll||!['attack','usage'].includes(card?.type))return;
    const entries=[{card,node:root}];
    for(const node of root.querySelectorAll('.card-summary[data-message-id],.card-summary[data-rsa-pending-attack-id]')){
        const attack=game.messages.get(node.dataset.messageId??node.dataset.rsaPendingAttackId);if(attack)entries.push({card:attack,node});
    }
    for(const {card:attack,node}of entries){
        if(attack?.type!=='attack'||attack.isContentVisible===false)continue;
        const meta=attack.getFlag?.(ID,'flurryOfBlows'),number=meta?.attackNumber,total=meta?.attackTotal;
        if(!Number.isInteger(number)||!Number.isInteger(total)||number<1||number>total)continue;
        if(node.querySelector('[data-rsa-flurry-label]'))continue;
        const label=document.createElement('div');label.className='rsa-attack-label';label.dataset.rsaFlurryLabel='true';label.textContent=`Flurry ${number} of ${total}`;
        (node.querySelector('.chat-card')??node).prepend(label);
    }
}
function finishUnifiedAttack(card,root){
    const home=root.querySelector('.rsa-unified-attack');
    if(!home){restoreStandaloneChildren(card);return;}
    if(home.dataset.rsaUnifiedFinished)return;
    const scope=unifiedAttackScope(card);if(!scope)return;
    home.dataset.rsaUnifiedFinished='true';
    root.classList.add('rsa-unified-action');
    presentUnifiedNames(card,root,home);
    const face=home.querySelector(':scope > .chat-card');
    // Native child results own their native header and target pills. Keep the
    // usage face while preparing; after publication use the attack face once.
    const attackFace=home.querySelector('.rsa-roll-attack > .chat-card');
    if(face&&attackFace){
        mergeAttackTags(face,attackFace);
        attackFace.classList.add('rsa-unified-primary-face');
        face.hidden=true;
        face.dataset.rsaUnifiedUsage='true';
    }
    home.querySelectorAll('.rsa-pending-cast,.rsa-attack-awaiting-result').forEach(node=>node.remove());
    const preparation=home.querySelector('.rsa-attack-preparation');
    if(preparation){
        // These remain real usage-card controls with their original handlers.
        // Pending-cast owns hiding/cancellation; no synthetic result controls.
        for(const controls of face?.querySelectorAll('.card-buttons,.rsa-attack-actions')??[])preparation.append(controls);
        addRetargetButton(card,preparation);
        const retarget=preparation.querySelector('[data-rsa-retarget]');
        if(retarget)preparation.querySelector('ul.targets')?.closest('.icon-row')?.append(retarget);
    }
    if(scope.groups.every(group=>group.damage.length<=1)&&!card.getFlag?.(ID,'manualEffectDecision'))for(const tray of home.querySelectorAll('effect-application')){tray.hidden=true;tray.dataset.rsaUnifiedEffects='true';}
    for(const groupScope of scope.groups){
        const instance=home.querySelector('[data-rsa-attack-id="'+groupScope.attack.id+'"]');if(!instance)continue;
        combineApplicationControls(card,instance,groupScope);
        const footer=document.createElement('div');footer.className='rsa-unified-controls';
        for(const summary of instance.querySelectorAll('.card-summary[data-message-id]')){
            const child=game.messages.get(summary.dataset.messageId);if(!child)continue;
            if(child.type==='attack'){
                // Sap and Slow follow this action's Apply/Undo transaction.
                summary.querySelectorAll('[data-rsa-mastery="slow"],[data-rsa-mastery="sap"]').forEach(button=>button.remove());
                addRetargetButton(child,summary);
                const retarget=summary.querySelector('[data-rsa-retarget]');
                if(isRollAdjustmentLocked(child))retarget?.remove();
                else if(retarget)summary.querySelector('ul.targets')?.closest('.icon-row')?.append(retarget);
            }
            if(child.type==='damage'){
                summary.hidden=damageMissedAfterAttack(child);
                if(summary.hidden)continue;
                for(const tray of summary.querySelectorAll('damage-application'))restoreApplicationTray(child,tray);
            }
            restoreRollDetails(child,summary);
            hideLockedReactionControls(child,summary);
            moveUnifiedControls(summary,child,footer);
        }
        if(footer.children.length)instance.append(footer);
    }
    // Suppress only children actually represented for this viewer. Documents,
    // permissions, native rolls and application histories are untouched.
    for(const summary of home.querySelectorAll('.card-summary[data-message-id]')){
        for(const standalone of document.querySelectorAll(`.chat-message[data-message-id="${summary.dataset.messageId}"]`)){
            standalone.hidden=true;standalone.dataset.rsaUnifiedChild='true';
        }
    }
}

Hooks.once('ready',()=>{
    globalThis.Ugmuls55eAutomationUnifiedAttack={supports:supportsUnifiedApplication,supportsAttack:supportsUnifiedAttack};
    const prototype=CONFIG.ChatMessage.dataModels.usage.prototype,render=prototype.render;
    prototype.render=function(options){return renderUnifiedAttack.call(this,render.bind(this),options);};
    // Foundry's base HTML hook precedes D&D5e system.getHTML. Register the
    // final layout on the system hook, after the feature render hooks.
    Hooks.on('dnd5e.renderChatMessage',(card,root)=>{
        if(card.type==='usage')finishUnifiedAttack(card,root);
        else if(['attack','damage'].includes(card.type)){
            const parent=origin(card);
            const represented=unifiedAttackScope(parent)&&document.querySelector(`.rsa-unified-attack .card-summary[data-message-id="${card.id}"]`);
            if(represented){root.hidden=true;root.dataset.rsaUnifiedChild='true';}
        }
        renderFlurryLabels(card,root);
    });
});
