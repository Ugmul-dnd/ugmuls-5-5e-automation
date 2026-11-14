import {hasEquivalentActiveEffect,regionOwnsEffect,isRollAdjustmentLocked,isHealingCard,describeTarget,linkedRecurringDamageUsage as recurringDamageUsage} from './shared-activity-card.js';
import {applyEffectWithUndo,manualSaveEffectAllowed,undoSaveApplication} from './damage-undo.js';
import {regionManagesCardEffect} from './region-library.js';
import {restoreApplicationTray,restoreRollDetails,hideLockedReactionControls,canViewAttackDescription,presentUnifiedNames,moveUnifiedControls} from './unified-attack-card.js';
const ID='ugmuls-5-5e-automation',operations=new Map(),boundResistButtons=new WeakSet();
const flag=(card,key)=>card?.getFlag?.(ID,key);
const origin=card=>typeof card?.system?.origin==='string'?game.messages.get(card.system.origin.replace(/^ChatMessage\./,'')):card?.system?.origin;
const rolls=(card,type)=>Array.from(card.getAssociatedRolls?.(type)??[]);
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const selfHealing=activity=>activity?.type==='heal'&&activity.target?.affects?.type==='self'&&game.settings.get(ID,'simplifyHealingCards')===true;
function healingSourceToken(activity,message,source){
    const actor=activity.actor??activity.item?.actor,speaker=message?.data?.speaker;
    const spoken=speaker?.scene&&speaker?.token?globalThis.fromUuidSync?.('Scene.'+speaker.scene+'.Token.'+speaker.token,{strict:false}):null;
    for(const candidate of [spoken,source?.getAssociatedToken?.(),activity.getUsageToken?.()]){
        const token=candidate?.document??candidate;if(token?.uuid&&token.actor?.uuid===actor?.uuid)return token;
    }
    return null;
}
export function prepareSelfHealingUsage(activity,_usage,_dialog,message){
    if(!selfHealing(activity))return;
    const token=healingSourceToken(activity,message);if(!token)return;
    // Record the explicit Self rule during usage preparation, never during
    // render or by treating currently selected enemies as healing recipients.
    message.data??={};message.data.system??={};message.data.system.targets=[describeTarget(token)];
    message.data.flags??={};message.data.flags[ID]??={};message.data.flags[ID].unifiedSelfHealing={actor:token.actor.uuid,target:token.uuid};
}
export function prepareSelfHealingRoll(config,_dialog,message){
    const activity=config?.subject;if(!selfHealing(activity))return;
    const source=origin({system:message?.data?.system}),record=flag(source,'unifiedSelfHealing');
    if(source&&!record)return; // Older/unrecorded uses retain their native fallback.
    const token=record?globalThis.fromUuidSync?.(record.target,{strict:false}):healingSourceToken(activity,message);
    const actor=activity.actor??activity.item?.actor;
    if(!token?.actor||token.actor.uuid!==actor?.uuid||record&&record.actor!==actor.uuid){ui.notifications.warn('The recorded self-healing token is unavailable.');return false;}
    message.data??={};message.data.system??={};message.data.system.targets=[describeTarget(token)];
}
export function unifiedSaveScope(card){
    if(card?.type!=='usage'||card.isContentVisible===false)return null;
    if(flag(card,'regionPlacementOnly')||flag(card,'movementRegionPlacement'))return null;
    if(flag(card,'lifeTransferRequest')||flag(card,'lifeTransferResolved'))return null; // Its explicit sacrifice/HP receipt is not a rolled healing application.
    const activity=card.getAssociatedActivity?.({scaled:true}),healing=activity?.type==='heal';
    if(game.settings.get(ID,healing?'simplifyHealingCards':'simplifySaveCards')!==true)return null;
    const parent=game.messages.get(flag(card,'recurringApplicationSource'));
    if(parent&&recurringDamageUsage(parent)===card&&parent.isContentVisible!==false)return null;
    // Damage-only activities (including recurring/Region triggers) have the
    // same recorded-recipient application, without a saving-throw prerequisite.
    if(!['save','damage','heal'].includes(activity?.type)||rolls(card,'attack').length||!healing&&rolls(card,'healing').length)return null;
    if(activity.type==='damage'&&rolls(card,'save').length)return null;
    if(healing&&rolls(card,'save').length)return null;
    const companion=activity.type==='save'?recurringDamageUsage(card):null;
    const damage=[...rolls(card,'damage'),...(healing?rolls(card,'healing'):[]),...(companion?rolls(companion,'damage'):[])];
    if(damage.some(c=>flag(c,'damageAttackId')||healing&&!isHealingCard(c)))return null;
    // Selected-token/actor-only healing without recorded token identities must
    // retain its native application route. Preparation may still show pending
    // while its original usage is collecting those identities.
    if(healing&&(!card.system?.targets?.length||card.system.targets.some(t=>!t.token))&&(!flag(card,'pendingCast')||damage.length))return null;
    return {activity,damage,saves:rolls(card,'save'),companion,healing};
}
export const saveApplicationSource=card=>{
    const usage=card?.type==='usage'?card:origin(card),parent=game.messages.get(flag(usage,'recurringApplicationSource'));
    return parent&&recurringDamageUsage(parent)===usage?parent:usage;
};
export const saveApplicationPending=card=>{const source=saveApplicationSource(card);return operations.has(source?.id)||globalThis.Ugmuls55eAutomationUndoSaveApplication?.pending(source)===true;};
export const settleSaveApplication=card=>operations.get(saveApplicationSource(card)?.id)??Promise.resolve();
export function saveOutcomesReady(card){
    return !flag(card,'targetsConfirmationPending')&&!flag(card,'targetsConfirmationCanceled')&&card.system?.targets?.length>0&&
        (['damage','heal'].includes(card.getAssociatedActivity?.()?.type)||card.system.targets.every(t=>['success','failure'].includes(card.system.outcomes?.get(t.token))));
}
export function saveNeedsDamage(card,scope=unifiedSaveScope(card)){
    if(scope?.healing)return true; // Native Heal activities always prepare a healing/temp-HP roll.
    if(flag(card,'recurringDamageRequired'))return saveOutcomesReady(card)&&card.system.targets.some(t=>card.system.outcomes?.get(t.token)==='failure');
    const activity=scope?.activity,configured=(activity?.damage?.parts?.length??0)>0||activity?.damage?.includeBase&&activity.item?.system?.offersBaseDamage&&activity.item.system.damage.base?.formula;
    if(!configured)return false;
    // Match the native prompt: a successful save with no damage does not
    // require rolling unused damage. Potent Cantrip retains its own override.
    return !(saveOutcomesReady(card)&&activity.damage.onSave==='none'&&!globalThis.Ugmuls55eAutomationPotentCantrip?.eligible(activity)&&card.system.targets.every(t=>card.system.outcomes.get(t.token)==='success'));
}
export function saveApplicationSignature(card,scope=unifiedSaveScope(card)){
    return JSON.stringify([(card.system?.targets??[]).map(t=>[t.token,t.actor,card.system.outcomes?.get(t.token)]),scope?.damage.map(c=>c.id)]);
}
export function saveDamageReceipts(damage){
    const manual=flag(damage,'unifiedSaveDamageTargets');
    const automatic=flag(damage,'automaticDamageTargets')??[];
    // Older manual applications have no token receipt. Never replay their HP;
    // Undo is required before changing an ambiguous historical application.
    if(!Array.isArray(manual)&&!automatic.length&&(flag(damage,'hpApplicationRecorded')||flag(damage,'damageUndoHistory')?.length))return new Set((damage.system?.targets??[]).map(t=>t.token));
    return new Set([...(manual??[]),...automatic]);
}
export async function renderUnifiedSave(wrapped,options={}){
    const html=await wrapped(options),card=this.parent,scope=unifiedSaveScope(card);if(!scope||options.summary)return html;
    const home=document.createElement('div');home.innerHTML=html;home.className='rsa-unified-save'+(scope.healing?' rsa-unified-healing':'');home.dataset.rsaSaveSourceId=card.id;
    // Native usage rendering already prepares compact saves when grouping is
    // enabled. Reuse that markup instead of rendering every AOE save twice.
    const nativeSummaries=new Map();for(const node of home.querySelectorAll('.card-summary[data-message-id]')){nativeSummaries.set(node.dataset.messageId,node.innerHTML);node.remove();}
    for(const child of [...scope.saves,...(!scope.damage.length&&scope.companion?[scope.companion]:[]),...scope.damage]){
        if(child.visible===false||child.isContentVisible===false)continue;
        const row=document.createElement('div');row.className='card-summary rsa-roll-'+child.type;
        if(child.type==='save')row.dataset.targetUuid=child.getAssociatedToken?.()?.uuid??'';
        if(child._dice3danimating&&game.settings.get('dice-so-nice','immediatelyDisplayChatMessages')!==true){
            row.dataset.rsaPendingSaveId=child.id;
            const pending=document.createElement('p');pending.className='rsa-unified-pending rsa-save-rolling';pending.textContent='---PENDING---';row.append(pending);
        }else{
            row.dataset.messageId=child.id;
            try{row.innerHTML=child.type==='save'&&nativeSummaries.has(child.id)?nativeSummaries.get(child.id):await child.system.render({summary:child.type==='save'});}
            catch(error){console.error('Unified save render failed; keeping native cards',error);return html;}
        }
        home.append(row);
    }
    const awaitingAction=['manual','manualCheck','check','condition','skipped'].includes(flag(card,'recurringTrigger')?.phase);
    if(!awaitingAction&&!scope.saves.length&&(!saveOutcomesReady(card)||['damage','heal'].includes(scope.activity.type)&&!scope.damage.length)){
        const pending=document.createElement('p');pending.className='rsa-unified-pending rsa-save-setup';pending.textContent='---PENDING---';home.append(pending);
    }
    return home.outerHTML;
}
async function recipients(source){
    if(!saveOutcomesReady(source))throw Error('Complete targeting and any recorded saving throws before applying this card.');
    const entries=[];
    for(const target of source.system.targets){
        const token=await fromUuid(target.token,{strict:false});
        if(!token?.actor||target.actor&&target.actor!==token.actor.uuid)throw Error('A recorded application target is unavailable or changed.');
        entries.push({target,token,actor:token.actor});
    }
    return entries;
}
function chooseEffects(scope,tray){
    const effects=Array.from(tray?.effects??[]).filter(e=>!regionManagesCardEffect(scope.activity,e));
    if(effects.length<=1)return effects;
    const selected=effects.filter(e=>tray.effectChecked?.(e.uuid));
    if(!selected.length)throw Error('Choose the effect to apply before pressing Apply.');
    return selected;
}
const specialized=source=>['stunningStrike','grappleStrike','maneuverStrike'].some(k=>flag(source,k));
async function selectedSaveEffects(scope,tray){
    const available=Array.from(await scope.activity.getApplicableEffects?.()??tray?.effects??[]).filter(e=>!regionManagesCardEffect(scope.activity,e));
    const selected=tray?chooseEffects(scope,tray):available.length<=1?available:null;
    if(!selected)throw Error('Choose the effect to apply before pressing Apply.');
    return selected.map(e=>{const current=available.find(candidate=>candidate.uuid===e.uuid);if(!current)throw Error('The available effects changed. Use the current card.');return current;});
}
async function applySaveEffects(source,scope,entries,tray){
    // These features have specialized authoritative duration/status workflows.
    if(flag(source,'stunningStrike')){await globalThis.Ugmuls55eAutomationStunning?.settle?.(source);return globalThis.Ugmuls55eAutomationStunning?.applyStunningOutcome(source,{manual:true});}
    if(flag(source,'grappleStrike')){await globalThis.Ugmuls55eAutomationGrapple?.settle?.(source);return globalThis.Ugmuls55eAutomationGrapple?.applyGrappleOutcome(source,{manual:true});}
    if(flag(source,'maneuverStrike')){await globalThis.Ugmuls55eAutomationBattleMaster?.settle?.(source);return globalThis.Ugmuls55eAutomationBattleMaster?.applyTripOutcome(source,{manual:true});}
    const effects=await selectedSaveEffects(scope,tray);if(!effects.length)return;
    const native=tray??document.createElement('effect-application');native.chatMessage=source;
    if(typeof native._applyEffectToActor!=='function')throw Error('Native effect application is unavailable.');
    let eligible=false;for(const {token,actor} of entries)for(const effect of effects){
        const allowed=await manualSaveEffectAllowed(source,effect,actor);if(!allowed.allowed)continue;
        eligible=true;
        if(hasEquivalentActiveEffect(actor,effect)||regionOwnsEffect(token,effect))continue;
        const applied=await applyEffectWithUndo(source,source,effect,actor,native);
        if(!applied?.uuid&&!hasEquivalentActiveEffect(actor,effect))throw Error('An effect could not be applied. Retry the remaining application.');
    }
    if(eligible)await source.update({['flags.'+ID+'.outcomeEffectsApplied']:true,['flags.'+ID+'.effectApplyReopened']:null});
}
export async function applySaveDamageTargets(source,damage,tray,entries){
    const receipts=saveDamageReceipts(damage),remaining=entries.filter(e=>!receipts.has(e.target.token));if(!remaining.length)return;
    if(remaining.some(entry=>!damage.system?.targets?.some(t=>t.token===entry.target.token&&(!t.actor||t.actor===entry.actor.uuid))))throw Error('Damage is not linked to this recorded save target.');
    if(!tray?.targetList||typeof tray._onApplyDamage!=='function')throw Error('Native damage application is unavailable.');
    const build=tray.targetList.onBuildTargetListEntry;if(typeof build!=='function')throw Error('Native damage target filtering is unavailable.');
    const oldRecords=new Set((flag(damage,'damageUndoHistory')??[]).map(r=>r.id));
    if(!Array.isArray(flag(damage,'unifiedSaveDamageTargets')))await damage.setFlag(ID,'unifiedSaveDamageTargets',[...receipts]);
    const selected=new Set(remaining.map(e=>e.target.token)),confirmed=new Set(),getOptions=tray.getMergedOptions;
    damage._targetState??={};damage._targetState.mode='targeted';damage._targetState.checked=new Map((damage.system.targets??[]).map(t=>[t.token,selected.has(t.token)]));
    tray.targetList.onBuildTargetListEntry=(list,target)=>selected.has(target.uuid)?build(list,target):null;
    tray.getMergedOptions=function(uuid){return {...getOptions.call(this,uuid),rsaUnifiedSaveToken:uuid};};
    const hook=Hooks.on('dnd5e.applyDamage',(_actor,_amount,options)=>{if((options.origin?.id??options.origin)===damage.id&&selected.has(options.rsaUnifiedSaveToken))confirmed.add(options.rsaUnifiedSaveToken);});
    try{
        tray.targetList.targetingMode='targeted';tray.visible=true;tray.targetList.suspended=false;tray.targetList.visible=true;tray.targetList.buildTargetsList();
        const listed=new Set(Array.from(tray.targetList.querySelectorAll('option'),option=>option.value));
        if(remaining.some(e=>!listed.has(e.target.token)))throw Error('A recorded save target could not be built in the native damage tray.');
        await tray._onApplyDamage({preventDefault(){}});
        for(const uuid of selected)receipts.add(uuid);await damage.setFlag(ID,'unifiedSaveDamageTargets',[...receipts]);
    }catch(error){
        // If HP committed before a later hook failed, retain that recipient's
        // receipt. Retry must not replay a successful HP delta.
        const committedActors=new Set((flag(damage,'damageUndoHistory')??[]).filter(r=>!oldRecords.has(r.id)).map(r=>r.actorUuid));
        for(const entry of remaining)if(confirmed.has(entry.target.token)||committedActors.has(entry.actor.uuid))receipts.add(entry.target.token);
        await damage.setFlag(ID,'unifiedSaveDamageTargets',[...receipts]);
        throw error;
    }finally{
        tray.targetList.onBuildTargetListEntry=build;
        tray.getMergedOptions=getOptions;Hooks.off('dnd5e.applyDamage',hook);
        damage._targetState.checked=new Map((damage.system.targets??[]).map(t=>[t.token,true]));
        tray.targetList.buildTargetsList();
    }
}
export function applyUnifiedSave(source,{damageTrays=new Map(),effectTray=null}={}){
    if(operations.has(source?.id))return operations.get(source.id);
    if(saveApplicationPending(source))return Promise.reject(Error('This save application is still being undone.'));
    if(!authority()||!unifiedSaveScope(source))return Promise.reject(Error('Only the active GM can apply this save card.'));
    const task=(async()=>{
        if(game.messages.get(source.id)!==source)throw Error('This save card is no longer available.');
        const initial=unifiedSaveScope(source),signature=saveApplicationSignature(source,initial);
        await recipients(source);
        if(initial.activity.type==='save'&&flag(source,'recurringDamageRequired')&&!saveNeedsDamage(source,initial))throw Error('This recurring save succeeded; no damage applies.');
        if(!specialized(source))await selectedSaveEffects(initial,effectTray); // Resolve choices before any HP is changed.
        await source.setFlag(ID,'manualDamageWorkflow',true);
        if(initial.companion)await initial.companion.setFlag(ID,'manualDamageWorkflow',true);
        await globalThis.Ugmuls55eAutomationNpcDamage?.settle?.();
        await globalThis.Ugmuls55eAutomationHitEffects?.settle?.();
        await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(source);
        if(await globalThis.Ugmuls55eAutomationReactive?.stop(source))throw Error('Resolve pending reactions before applying this card.');
        const scope=unifiedSaveScope(source),entries=await recipients(source);
        if(!scope||signature!==saveApplicationSignature(source,scope))throw Error('Saving throw targets or outcomes changed. Use the current card.');
        const hasDamage=saveNeedsDamage(source,scope);
        if(hasDamage&&!scope.damage.length)throw Error(scope.healing?'Roll the healing before applying this card.':'Roll the damage before applying this card.');
        if(scope.damage.some(c=>flag(c,'pendingDamage')||!c.rolls?.length))throw Error('Complete the '+(scope.healing?'healing':'damage')+' roll before applying this card.');
        if(!specialized(source))await selectedSaveEffects(scope,effectTray);
        if(scope.damage.some(c=>(c.system?.targets??[]).some(t=>!entries.some(e=>e.target.token===t.token&&(!t.actor||e.actor.uuid===t.actor)))))throw Error('Damage targets no longer match the recorded saving throws.');
        for(const damage of scope.damage){
            const tray=damageTrays.get(damage.id);
            if(signature!==saveApplicationSignature(source))throw Error('The save outcomes changed during application. Use the current card.');
            await applySaveDamageTargets(source,damage,tray,entries.filter(entry=>damage.system.targets?.some(t=>t.token===entry.target.token)&&
                (!flag(source,'recurringDamageRequired')||source.system.outcomes?.get(entry.target.token)==='failure')));
        }
        if(signature!==saveApplicationSignature(source))throw Error('The save outcomes changed during application. Use the current card.');
        await applySaveEffects(source,scope,entries,effectTray);
        await source.update({['flags.'+ID+'.unifiedSaveApplied']:saveApplicationSignature(source,scope),['flags.'+ID+'.unifiedSaveApplyFailed']:false});
    })().catch(async error=>{if(game.messages.get(source.id)===source)await source.setFlag(ID,'unifiedSaveApplyFailed',true);throw error;}).finally(()=>{
        operations.delete(source.id);globalThis.Ugmuls55eAutomationChatRefresh?.card(source);
    });operations.set(source.id,task);return task;
}
function restoreSaveChildren(card){
    const companion=recurringDamageUsage(card);
    for(const child of [...rolls(card,'save'),...rolls(card,'damage'),...rolls(card,'healing'),...(companion?[companion,...rolls(companion,'damage')]:[])])for(const node of document.querySelectorAll('.chat-message[data-message-id="'+child.id+'"]')){
        if(!node.dataset.rsaUnifiedSaveChild)continue;delete node.dataset.rsaUnifiedSaveChild;node.hidden=game.settings.get('dnd5e','chatCardSummary')===true;
    }
}
export function finishUnifiedSave(card,root){
    const home=root.querySelector('.rsa-unified-save');if(!home){restoreSaveChildren(card);return;}
    const scope=unifiedSaveScope(card);if(!scope||home.dataset.rsaSaveFinished)return;home.dataset.rsaSaveFinished='true';root.classList.add('rsa-unified-action','rsa-unified-save-action');
    if(scope.healing)root.classList.add('rsa-unified-healing-action');
    // Keep native player-tray permissions and handlers. The active GM uses
    // the combined controller; other viewers retain any controls the system
    // actually rendered for them, without gaining a new mutation authority.
    if(scope.healing&&!authority())home.dataset.rsaNativeHealingControls='true';
    presentUnifiedNames(card,root,home);
    const sourceFace=home.querySelector(':scope > .chat-card'),description=sourceFace?.querySelector('.card-description .wrapper');
    if(description&&canViewAttackDescription(card))for(const name of sourceFace.querySelectorAll('.card-header .title')){name.dataset.tooltip=description.innerHTML;name.dataset.tooltipClass='dnd5e2 rsa-attack-description-tooltip';}
    sourceFace?.querySelector('.card-description')?.setAttribute('hidden','');
    const header=sourceFace?.querySelector('.card-header');if(header?.dataset.action==='toggleDescription')delete header.dataset.action;
    home.querySelectorAll('.rsa-pending-cast').forEach(n=>n.remove());
    if(home.querySelector('.rsa-save-pending'))home.querySelectorAll('.rsa-save-setup').forEach(n=>n.remove());
    if(scope.damage.length)for(const button of sourceFace?.querySelectorAll('[data-action="rollDamage"],[data-forward-action="rollDamage"],[data-action="rollHealing"],[data-forward-action="rollHealing"]')??[])button.hidden=true;
    const footer=document.createElement('div');footer.className='rsa-unified-controls rsa-save-controls';
    const unusedRecurringDamage=scope.activity.type==='save'&&flag(card,'recurringDamageRequired')&&saveOutcomesReady(card)&&!saveNeedsDamage(card,scope)&&
        !scope.damage.some(c=>flag(c,'hpApplicationRecorded')||flag(c,'damageUndoHistory')?.length);
    for(const summary of home.querySelectorAll('.card-summary[data-message-id]')){
        const child=game.messages.get(summary.dataset.messageId);if(!child)continue;
        if(unusedRecurringDamage&&(child.type==='damage'||child===scope.companion)){summary.hidden=true;continue;}
        if(['damage','healing'].includes(child.type))for(const tray of summary.querySelectorAll('damage-application'))restoreApplicationTray(child,tray);
        restoreRollDetails(child,summary);
        if(child.type==='save')for(const button of summary.querySelectorAll('[data-action="resistSave"],[data-forward-action="resistSave"]')){
            if(isRollAdjustmentLocked(child)){button.disabled=true;button.dataset.tooltip='Undo Apply before changing this saving throw.';}
            if(!boundResistButtons.has(button)){
                button.addEventListener('click',event=>{
                    const current=game.messages.get(child.id);if(current&&!isRollAdjustmentLocked(current))return;
                    event.preventDefault();event.stopImmediatePropagation();ui.notifications.warn('Undo Apply before changing this saving throw.');
                },{capture:true});boundResistButtons.add(button);
            }
        }
        hideLockedReactionControls(child,summary);
        moveUnifiedControls(summary,child,footer);
    }
    home.querySelectorAll('[data-rsa-undo-damage],[data-rsa-undo-effect],[data-rsa-reapply-hit-effects],[data-rsa-stunning-effects],[data-rsa-grapple-effects],[data-rsa-trip-apply]').forEach(n=>n.remove());
    const effectTray=home.querySelector('effect-application');
    if(effectTray){effectTray.dataset.rsaUnifiedSaveEffects='true';for(const targets of effectTray.querySelectorAll('recorded-targets'))targets.hidden=true;}
    const damageTrays=new Map();for(const summary of home.querySelectorAll('.card-summary[data-message-id]')){
        const tray=summary.querySelector('damage-application');if(tray)damageTrays.set(summary.dataset.messageId,tray);
    }
    const hasEffects=(scope.activity.effects?.length??0)>0||!!effectTray||['stunningStrike','grappleStrike','maneuverStrike'].some(k=>flag(card,k));
    const requiresDamage=saveNeedsDamage(card,scope);
    const hpDone=scope.damage.length>0&&scope.damage.every(c=>(c.system.targets??[]).every(t=>saveDamageReceipts(c).has(t.token)));
    if(scope.healing&&hpDone)home.dataset.rsaHealingHpApplied='true';
    const done=flag(card,'unifiedSaveApplied')===saveApplicationSignature(card,scope)||(hpDone&&(!hasEffects||flag(card,'outcomeEffectsApplied')===true))||(!scope.damage.length&&hasEffects&&flag(card,'outcomeEffectsApplied')===true);
    const committed=scope.damage.some(c=>flag(c,'hpApplicationRecorded')||flag(c,'damageUndoHistory')?.length)||flag(card,'effectUndoHistory')?.length||flag(card,'outcomeEffectsApplied');
    if(committed||saveApplicationPending(card))home.querySelectorAll('[data-rsa-retarget]').forEach(button=>button.remove());
    if(authority()&&!unusedRecurringDamage&&(scope.damage.length||requiresDamage||hasEffects)){
        if(!done){
        const apply=document.createElement('button');apply.type='button';apply.dataset.rsaSaveApply='';apply.textContent=flag(card,'unifiedSaveApplyFailed')?'Retry Apply':'Apply';
        apply.disabled=saveApplicationPending(card)||done||!saveOutcomesReady(card)||requiresDamage&&!scope.damage.length||scope.damage.some(c=>flag(c,'pendingDamage')||!c.rolls?.length);
        apply.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();if(apply.disabled)return;apply.disabled=true;try{await applyUnifiedSave(card,{damageTrays,effectTray});}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});footer.append(apply);
        }
        if(committed){const undo=document.createElement('button');undo.type='button';undo.dataset.rsaSaveUndo='';undo.textContent='Undo Apply';undo.disabled=saveApplicationPending(card);undo.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();if(undo.disabled)return;undo.disabled=true;try{await undoSaveApplication(card);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});footer.append(undo);}
    }
    if(footer.children.length)home.append(footer);
    const represented=[...home.querySelectorAll('.card-summary[data-message-id]')].map(s=>s.dataset.messageId);
    if(scope.companion?.isContentVisible!==false&&scope.companion?.visible!==false&&scope.companion)represented.push(scope.companion.id);
    for(const id of represented)for(const standalone of document.querySelectorAll('.chat-message[data-message-id="'+id+'"]')){standalone.hidden=true;standalone.dataset.rsaUnifiedSaveChild='true';}
}
function report(error){console.error('Unified save application',error);ui.notifications.error(error.message??'Save application could not finish.');}
Hooks.once('init',()=>game.settings.register(ID,'simplifySaveCards',{name:'Reduce Save and Damage Card Clutter',hint:'Keep saving throws or damage-only triggers, reactions and effect application together on one native spell or feature card.',scope:'world',config:true,type:Boolean,default:true,onChange:()=>ui.chat?.render?.({force:true})}));
Hooks.once('init',()=>game.settings.register(ID,'simplifyHealingCards',{name:'Reduce Healing Card Clutter',hint:'Keep targeted spell/feature healing or temporary HP rolls, application and Undo together on one native usage card.',scope:'world',config:true,type:Boolean,default:true,onChange:()=>ui.chat?.render?.({force:true})}));
Hooks.once('ready',()=>{
    Hooks.on('dnd5e.preUseActivity',prepareSelfHealingUsage);
    Hooks.on('dnd5e.preRollDamageV2',prepareSelfHealingRoll);
    globalThis.Ugmuls55eAutomationUnifiedSave={scope:unifiedSaveScope,source:saveApplicationSource,supports:card=>!!unifiedSaveScope(saveApplicationSource(card)),pending:saveApplicationPending,settle:settleSaveApplication};
    const proto=CONFIG.ChatMessage.dataModels.usage.prototype,render=proto.render;proto.render=function(options){return renderUnifiedSave.call(this,render.bind(this),options);};
    Hooks.on('dnd5e.renderChatMessage',(card,html)=>{
        const root=html?.[0]??html;if(!root?.querySelectorAll)return;
        const source=saveApplicationSource(card);
        if(card.type==='usage'){
            finishUnifiedSave(card,root);
            if(source!==card&&source?.isContentVisible!==false&&unifiedSaveScope(source)&&document.querySelector('.rsa-unified-save[data-rsa-save-source-id="'+source.id+'"]')){root.hidden=true;root.dataset.rsaUnifiedSaveChild='true';}
        }
        else if(['save','damage','healing'].includes(card.type)&&unifiedSaveScope(source)&&document.querySelector('.rsa-unified-save .card-summary[data-message-id="'+card.id+'"]')){root.hidden=true;root.dataset.rsaUnifiedSaveChild='true';}
    });
});
