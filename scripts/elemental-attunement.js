import {createEventQueue} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),prepared=new WeakMap(),wrapped=new WeakSet(),endingSources=new Map();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,'elementalStrikesAutomation')===true;
const live=e=>e&&!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
const incapacitated=actor=>['incapacitated','unconscious','stunned','paralyzed','petrified'].some(s=>actor?.statuses?.has(s));
export const attunementFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&key(i)==='elemental-attunement'&&i.system?.source?.rules!=='2014');
export const attunementBuff=actor=>values(actor?.effects).find(e=>flag(e,'elementalAttunement'));
const sourceIdentity=e=>JSON.stringify([e?.uuid,e?.system?.origin?.message??null]);
function appliedSources(actor){
    const feature=attunementFeature(actor),use=values(feature?.system?.activities).find(a=>a.type==='enchant');if(!feature||!use)return [];
    const effects=values(feature.effects);
    // Enabled profile templates are not active enchantments. A real application
    // has native activity/message provenance and is still embedded on this item.
    return [...new Set([...values(use.appliedEnchantments),...effects])].filter(e=>live(e)&&e.type==='enchantment'&&
        typeof e.flags?.dnd5e?.enchantmentProfile==='string'&&typeof e.system?.origin?.message==='string'&&
        (e.system?.origin?.activity===use.uuid||e.system?.origin?.activity?.startsWith(feature.uuid+'.Activity.'))&&
        effects.some(current=>current===e||current.uuid===e.uuid));
}
export function attunementSource(actor,excluded=null){
    const ended=flag(actor,'elementalAttunementEnded'),blocked=endingSources.get(actor?.uuid);
    return appliedSources(actor).find(e=>e!==excluded&&(!excluded?.uuid||e.uuid!==excluded.uuid)&&sourceIdentity(e)!==ended&&sourceIdentity(e)!==blocked)??null;
}
const strideKeys=new Set(['system.attributes.movement.fly','system.attributes.movement.swim']);
function strideComponents(feature,source){
    const use=values(feature.system?.activities).find(a=>a.type==='enchant'),profile=values(use?.effects).find(p=>(p._id??p.id)===source.flags?.dnd5e?.enchantmentProfile);
    const templates=values(feature.effects).filter(e=>values(profile?.riders?.effect).includes(e.id));
    const copies=values(feature.effects).filter(e=>e!==source&&[source.id,source.uuid].includes(e.flags?.dnd5e?.dependentOn)&&values(e.system?.changes).some(c=>strideKeys.has(c.key)));
    const changes=values((copies[0]??templates.find(e=>values(e.system?.changes).some(c=>strideKeys.has(c.key))))?.system?.changes).filter(c=>strideKeys.has(c.key));
    return {copies,changes};
}
export function attunementActive(actor){
    if(incapacitated(actor)||!attunementSource(actor))return false;
    const buff=attunementBuff(actor);return !buff||live(buff);
}
export function attunedUnarmed(activity){
    if(activity?.type!=='attack')return false;
    return activity.attack?.type?.classification==='unarmed'||activity.item?.system?.type?.value==='unarmed'||['empowered-strikes','empowered-strike','unarmed-strike'].includes(key(activity.item));
}
export function prepareAttunedStrike(activity){
    if(!attunedUnarmed(activity)||key(activity.item)==='elemental-attunement')return; // Native Elemental Strike already has these benefits.
    const prior=prepared.get(activity);
    if(prior){
        for(const entry of prior.types)if(entry.part.types===entry.applied)entry.part.types=entry.original;
        if(activity.range===prior.range&&String(activity.range?.value)===String(prior.value))Object.assign(activity.range,prior.originalRange);
        prepared.delete(activity);
    }
    const actor=activity.actor??activity.item?.actor;if(!enabled()||!attunementActive(actor))return;
    const feature=attunementFeature(actor),native=values(feature.system?.activities).find(a=>a.type==='attack'&&(a.id==='xCHcv0MDt4mopzrp'||/^elemental strike$/i.test(a.name??'')));
    if(!native)return;
    const allowed=new Set(values(native.damage?.parts?.[0]?.types));if(!allowed.size)return;
    const record={types:[],range:activity.range,originalRange:{value:activity.range?.value,units:activity.range?.units,override:activity.range?.override}};
    const parts=values(activity.damage?.parts);
    if(activity.damage?.includeBase&&activity.item.system?.damage?.base)parts.push(activity.item.system.damage.base);
    for(const part of parts){
        const original=part.types,applied=new Set([...values(original),...allowed]);part.types=applied;record.types.push({part,original,applied});
    }
    if(activity.range){
        const base=Number(activity.range.units==='ft'?activity.range.value:activity.item.system?.range?.reach),nativeReach=Number(native.range?.value);
        if(base>0||nativeReach>0){record.value=String(base>0?base+10:nativeReach);Object.assign(activity.range,{value:record.value,units:'ft',override:true});}
    }
    prepared.set(activity,record);
}
export function syncAttunementBuff(actor,{excluded=null,chatMessage=null}={}){return enqueue(async()=>{
    if(!manager(actor)||!attunementFeature(actor))return;
    const native=attunementSource(actor,excluded),buff=attunementBuff(actor),stopped=incapacitated(actor);
    if(stopped&&native){endingSources.set(actor.uuid,sourceIdentity(native));await actor.setFlag(ID,'elementalAttunementEnded',sourceIdentity(native));await native.delete({rsaAttunementSync:true});}
    const source=stopped?null:native;
    if(!source){if(buff){await actor.deleteEmbeddedDocuments('ActiveEffect',[buff.id],{rsaAttunementSync:true});globalThis.Ugmuls55eAutomationChatRefresh?.request('elementalAttunement',actor);}return;}
    if(!enabled())return;
    const feature=attunementFeature(actor),identity=source.uuid;
    const stride=strideComponents(feature,source);
    const legacy=values(actor.effects).filter(e=>e!==buff&&flag(e,'epitomeResistance'));
    const currentStride=values(buff?.system?.changes).filter(c=>strideKeys.has(c.key));
    const matching=JSON.stringify(currentStride)===JSON.stringify(stride.changes);
    if(buff&&flag(buff,'elementalAttunement')?.source===identity&&flag(buff,'elementalAttunement')?.sourceMessage===source.system.origin.message&&live(buff)&&!legacy.length&&matching){
        for(const copy of stride.copies)if(!copy.disabled)await copy.update({disabled:true,['flags.'+ID+'.elementalAttunementStride']:identity},{rsaAttunementSync:true});
        return;
    }
    const raw=source.toObject?.()??source;
    const data={name:'Elemental Attunement',img:feature.img??source.img,type:'base',transfer:false,disabled:false,showIcon:1,
        duration:foundry.utils.deepClone(raw.duration),start:foundry.utils.deepClone(raw.start??CONFIG.ActiveEffect.documentClass.getEffectStart()),
        system:{changes:foundry.utils.deepClone(stride.changes),origin:{actor:actor.uuid,item:feature.uuid,effect:identity,message:chatMessage?.uuid??source.system?.origin?.message??null}},
        flags:{dnd5e:{isTemporary:true},[ID]:{elementalAttunement:{item:feature.uuid,source:identity,sourceMessage:source.system.origin.message}}}};
    const resistance=buff&&flag(buff,'epitomeResistance')?buff:legacy.find(e=>live(e)&&values(actor.items).some(i=>i.uuid===flag(e,'epitomeResistance')?.item));
    if(resistance){data.system.changes.push(...values(resistance.system?.changes).filter(c=>['system.traits.dr','system.traits.dr.value'].includes(c.key)));data.flags[ID].epitomeResistance=flag(resistance,'epitomeResistance');}
    if(buff)await buff.update(data,{rsaAttunementSync:true});else await actor.createEmbeddedDocuments('ActiveEffect',[data],{rsaAttunementSync:true});
    for(const copy of stride.copies)if(!copy.disabled)await copy.update({disabled:true,['flags.'+ID+'.elementalAttunementStride']:identity},{rsaAttunementSync:true});
    if(legacy.length)await actor.deleteEmbeddedDocuments('ActiveEffect',legacy.map(e=>e.id),{rsaAttunementSync:true});
    globalThis.Ugmuls55eAutomationChatRefresh?.request('elementalAttunement',actor);
});}
function manager(actor){const gm=game.users.activeGM;return actor?.isOwner&&(!gm||gm.id===game.user.id);}
async function endBuff(effect,options={}){
    if(options.rsaAttunementSync||!flag(effect,'elementalAttunement'))return;
    const actor=effect.parent;
    if(!options.deleted&&live(effect)){if(manager(actor)&&!attunementSource(actor))await syncAttunementBuff(actor);return;}
    const meta=flag(effect,'elementalAttunement'),recorded=JSON.stringify([meta.source,meta.sourceMessage??effect.system?.origin?.message??null]);
    const legacySource=!meta.sourceMessage?appliedSources(actor)[0]:null,receipt=legacySource?sourceIdentity(legacySource):recorded;
    // Block synchronously, before any already-queued synchronization can
    // recreate this buff while native End Attunement is still being written.
    endingSources.set(actor.uuid,receipt);
    if(!manager(actor))return; // Owning clients stop presentation immediately; only the authority writes documents.
    await enqueue(async()=>{
        await actor.setFlag(ID,'elementalAttunementEnded',receipt);
        const source=appliedSources(actor).find(e=>sourceIdentity(e)===receipt);
        if(source)await source.delete({rsaAttunementSync:true});
    });
    await syncAttunementBuff(actor);
}
async function changedEffect(effect,options={}){
    const item=effect.parent,actor=item?.actor??(item?.documentName==='Actor'?item:null);
    if(flag(effect,'elementalAttunement'))return endBuff(effect,options);
    if(!actor||!manager(actor)||options.rsaAttunementSync)return;
    if(key(item)==='elemental-attunement')await syncAttunementBuff(actor,{excluded:options.deleted?effect:null});
    else if(flag(effect,'epitomeResistance')&&attunementFeature(actor))await syncAttunementBuff(actor);
    else if(incapacitated(actor)&&attunementFeature(actor)){
        await syncAttunementBuff(actor);
    }
}
export function installAttunedAttack(Type){
    const proto=Type?.prototype;if(!proto||wrapped.has(proto))return;wrapped.add(proto);
    for(const name of ['prepareFinalData','use','rollAttack','rollDamage']){
        const original=proto[name],own=Object.hasOwn(proto,name);if(typeof original!=='function')continue;
        proto[name]=function(...args){if(name!=='prepareFinalData')prepareAttunedStrike(this);const result=(own?original:Object.getPrototypeOf(proto)[name]).apply(this,args);if(name==='prepareFinalData')prepareAttunedStrike(this);return result;};
    }
}
const endWrapped=new WeakSet();
export function installAttunementBuffEnd(Type){
    const proto=Type?.prototype;if(!proto||endWrapped.has(proto)||typeof proto._triggerSubsequentActions!=='function')return;endWrapped.add(proto);
    const original=proto._triggerSubsequentActions;
    proto._triggerSubsequentActions=async function(config,results){
        const source=this.existingEnchantment,ending=key(this.item)==='elemental-attunement'&&this.enchant?.self&&source&&source.flags?.dnd5e?.enchantmentProfile===config.enchantmentProfile;
        const result=await original.call(this,config,results);
        if(ending)await syncAttunementBuff(this.actor??this.item.actor,{excluded:source});return result;
    };
}
function report(error){console.error('Elemental Attunement',error);ui.notifications.error(error.message);}
Hooks.once('ready',()=>{
    globalThis.Ugmuls55eAutomationAttunement={active:attunementActive,buff:attunementBuff,prepare:prepareAttunedStrike,unarmed:attunedUnarmed};
    installAttunedAttack(CONFIG.DND5E.activityTypes.attack.documentClass);installAttunementBuffEnd(CONFIG.DND5E.activityTypes.enchant?.documentClass);
    Hooks.on('dnd5e.applyEnchantment',(item,effect,{activity,chatMessage}={})=>{
        const actor=activity?.actor??item?.actor;
        if(key(item)!=='elemental-attunement'||chatMessage?.author?.id!==game.user.id||!actor?.isOwner)return;
        const gm=game.users.activeGM;
        if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'syncElementalAttunement',actorUuid:actor.uuid,cardId:chatMessage.id,userId:game.user.id,gmId:gm.id});
        else syncAttunementBuff(actor,{chatMessage}).catch(report);
    });
    game.socket.on('module.'+ID,packet=>{
        if(packet?.action!=='syncElementalAttunement'||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;
        if(typeof packet.actorUuid!=='string'||typeof packet.cardId!=='string'||typeof packet.userId!=='string')return;
        let actor;try{actor=globalThis.fromUuidSync?.(packet.actorUuid,{strict:false});}catch{return;}
        const user=game.users.get(packet.userId),card=game.messages.get(packet.cardId),activity=card?.getAssociatedActivity?.();
        if(!user?.active||!actor||!user.isGM&&!actor.testUserPermission?.(user,'OWNER')||card?.author?.id!==user.id||card.getAssociatedActor?.()?.uuid!==actor.uuid||key(activity?.item)!=='elemental-attunement'||activity?.type!=='enchant')return;
        syncAttunementBuff(actor,{chatMessage:card}).catch(report);
    });
    Hooks.on('createActiveEffect',(effect,options)=>changedEffect(effect,options).catch(report));
    Hooks.on('updateActiveEffect',(effect,_changes,options)=>changedEffect(effect,options).catch(report));
    Hooks.on('deleteActiveEffect',(effect,options)=>changedEffect(effect,{...options,deleted:true}).catch(report));
    for(const event of ['updateActor','updateItem','deleteItem'])Hooks.on(event,(doc,changes)=>{
        if(doc.documentName==='Actor'&&!Object.keys(changes??{}).some(k=>k==='effects'||k==='statuses'||k.startsWith('effects.')||k.startsWith('statuses.')))return;
        if(doc.documentName!=='Actor'&&!['elemental-attunement','elemental-epitome','empowered-strikes','empowered-strike','unarmed-strike'].includes(key(doc)))return;
        const actor=doc.documentName==='Actor'?doc:doc.actor??doc.parent;if(!manager(actor)||!attunementFeature(actor)&&!attunementBuff(actor))return;
        if(!attunementFeature(actor)){const buff=attunementBuff(actor);if(buff)actor.deleteEmbeddedDocuments('ActiveEffect',[buff.id],{rsaAttunementSync:true}).catch(report);return;}
        syncAttunementBuff(actor).catch(report);globalThis.Ugmuls55eAutomationChatRefresh?.request('elementalAttunement',doc);
    });
    // One startup reconciliation for already-active native self-enchantments.
    for(const actor of values(game.actors))if(manager(actor)&&attunementFeature(actor))syncAttunementBuff(actor).catch(report);
});
