import {isRollAdjustmentLocked} from './shared-activity-card.js';
import {addRetargetButton} from './retarget-card.js';
import {damageMissedAfterAttack} from './shield-reaction.js';
import {shotCount} from './multi-shot-attacks.js';

const ID='ugmuls-5-5e-automation';
const applicationTrayStates=new WeakMap(),boundApplicationTrays=new WeakSet();
const origin=card=>typeof card?.system?.origin==='string'?game.messages.get(card.system.origin.replace(/^ChatMessage\./,'')):card?.system?.origin;
const rolls=(card,type)=>Array.from(card.getAssociatedRolls?.(type)??[]);
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
    const activity=card.getAssociatedActivity?.(),attacks=rolls(card,'attack'),damage=rolls(card,'damage');
    const spell=activity?.item?.type==='spell';
    if(activity?.type!=='attack'||!['weapon','spell'].includes(activity.item?.type)||rolls(card,'save').length||rolls(card,'healing').length)return null;
    if(!spell&&(card.system?.targets?.length!==1||attacks.length>1))return null;
    if(!attacks.length&&(damage.length||(card.system?.targets?.length??0)>1))return null;
    if(attacks.some(attack=>attack.system?.targets?.length!==1))return null;
    const groups=attacks.map(attack=>({attack,damage:[]}));
    for(const result of damage){
        const explicit=result.getFlag?.(ID,'damageAttackId');
        // Multiple attacks require explicit links, never matching totals,
        // timestamps or the viewer's current target selection.
        const group=explicit?groups.find(g=>g.attack.id===explicit):groups.length===1?groups[0]:null;
        if(!group)return null;
        if(spell&&(result.system?.targets?.length!==1||result.system.targets[0].token!==group.attack.system.targets[0].token))return null;
        group.damage.push(result);
    }
    return {attack:attacks[0],damage,groups,spell};
}

export async function renderUnifiedAttack(wrapped,options={}){
    const html=await wrapped(options),card=this.parent,scope=unifiedAttackScope(card);
    if(!scope||options.summary)return html;
    const container=document.createElement('div');container.innerHTML=html;
    container.querySelectorAll('.card-summary[data-message-id]').forEach(node=>node.remove());
    container.classList.add('rsa-unified-attack');
    const activity=card.getAssociatedActivity?.(),total=shotCount(activity,card);
    for(const [index,group]of scope.groups.entries()){
        const instance=document.createElement('section');instance.className='rsa-attack-instance';instance.dataset.rsaAttackId=group.attack.id;
        if(total>1||scope.groups.length>1){
            const label=document.createElement('div');label.className='rsa-attack-label';
            label.textContent=total>1?`${activity.item.name??activity.name??'Spell'} Attack ${index+1} of ${total}`:'Attack '+(index+1);instance.append(label);
        }
        for(const child of [group.attack,...group.damage]){
            if(child.visible===false||child.isContentVisible===false)continue;
            const row=document.createElement('div');row.className=`card-summary rsa-roll-${child.type}`;row.dataset.messageId=child.id;
            if(child._dice3danimating&&game.settings.get('dice-so-nice','immediatelyDisplayChatMessages')!==true){
                const pending=document.createElement('p');pending.className='rsa-unified-pending';pending.textContent=`Pending — rolling ${child.type}`;row.append(pending);
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
    if(damage?.type!=='damage'||damage.getFlag?.(ID,'masteryGraze'))return false;
    const scope=unifiedAttackScope(origin(damage));
    return !!scope?.groups.some(group=>group.damage.length===1&&group.damage[0].id===damage.id);
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
    let state=applicationTrayStates.get(card);
    if(!state||state.applied!==applied){
        state={applied,open:applied?false:card.getFlag?.(ID,'damageApplyReopened')?true:tray.open};
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
        const hp=damage.getFlag?.(ID,'hpApplicationRecorded')||(damage.getFlag?.(ID,'damageUndoHistory')??[]).length>0;
        const effects=[damage,scope.attack,...(card.getAssociatedActivity?.()?.item?.type==='spell'?[]:[card])].some(source=>(source.getFlag?.(ID,'effectUndoHistory')??[]).length>0);
        summary.classList.toggle('rsa-unified-applied',!!hp);
        home.querySelectorAll('[data-rsa-undo-damage],[data-rsa-undo-effect]').forEach(button=>button.remove());
        for(const button of home.querySelectorAll('[data-rsa-reapply-hit-effects]')){
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
function finishUnifiedAttack(card,root){
    const home=root.querySelector('.rsa-unified-attack');
    if(!home){restoreStandaloneChildren(card);return;}
    if(home.dataset.rsaUnifiedFinished)return;
    const scope=unifiedAttackScope(card);if(!scope)return;
    home.dataset.rsaUnifiedFinished='true';
    root.classList.add('rsa-unified-action');
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
            hideLockedReactionControls(child,summary);
            const group=document.createElement('div');group.dataset.messageId=child.id;group.className='rsa-unified-control-group';
            // Move existing controls rather than recreate their handlers. The
            // source identity survives outside its result summary.
            for(const button of summary.querySelectorAll('button')){
                if(!button.closest('.rsa-attack-actions')&&!globalThis.Ugmuls55eAutomationReactive?.isControl?.(button))continue;
                if(button.matches('[data-rsa-retarget]')||button.closest('[data-rsa-save-modes],[data-rsa-damage-modes],damage-application'))continue;
                let control=button.closest('.rsa-attack-actions');
                if(!control){
                    control=button;
                    while(control.parentElement!==summary&&globalThis.Ugmuls55eAutomationReactive?.isControl?.(control.parentElement))control=control.parentElement;
                }
                if(control===summary||control===summary.querySelector('.chat-card'))group.append(button);
                else if(!group.contains(control))group.append(control);
            }
            if(group.children.length)footer.append(group);
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
    });
});
