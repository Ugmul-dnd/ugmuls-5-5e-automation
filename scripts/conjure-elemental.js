import {triggerEntry,triggerKeyForSpell} from './trigger-library.js';
const ID='ugmuls-5-5e-automation',wrapped=new WeakSet(),values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier;
const resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
export function elementalEntry(item){const recipe=triggerKeyForSpell(item),entry=triggerEntry(recipe);return recipe?.startsWith('conjure-elemental-')&&entry?.enabled&&entry.sourceIdentifier?.endsWith('-element')&&entry.sourceSpellUuid?.includes('phb')&&entry.saveFirst&&item?.system?.source?.rules!=='2014'?entry:null;}
export function prepareElementalActivity(activity){
 // Preparation runs for every activity, including chat-card clones. Reject
 // unrelated activities before the trigger-library lookup.
 if(activity?.type!=='save'||activity.name!=='Initial Save')return;
 const item=activity.item,entry=elementalEntry(item);if(!entry)return;
 const effect=values(item.effects).find(e=>e.id===entry.effectId||e.name==='Restrained'&&values(e.statuses).includes('restrained'));if(!effect)return;
 if(!values(activity.effects).some(e=>(e._id??e.id)===effect.id))activity.effects=[...values(activity.effects),{_id:effect.id,onSave:false}];
}
export function elementalConcentration(item){
 const actor=item?.actor,ref=actor?.getFlag?.('dnd5e','summon.origin')??actor?.flags?.dnd5e?.summon?.origin,source=resolve(ref),spell=source?.item??source;
 if(key(spell)!=='conjure-elemental'||spell.system?.source?.rules==='2014')return null;
 return values(spell.actor?.concentration?.effects).find(e=>!e.disabled&&!e.duration?.expired&&((e.getFlag?.('dnd5e','item')??e.flags?.dnd5e?.item)?.uuid===spell.uuid))??null;
}
export function prepareElementalRestraint(effect){
 if(effect.parent?.documentName!=='Actor'||effect.name!=='Restrained')return;
 const activity=resolve(effect.system?.origin?.activity),source=resolve(effect._stats?.duplicateSource??effect._stats?.compendiumSource),item=activity?.item??source?.parent;if(!elementalEntry(item))return;
 const root=elementalConcentration(item);if(!root)return;
 // A summon has no concentration of its own. Link its target condition to the
 // original caster's exact spell instance using native dependent tracking.
 effect.updateSource({'system.origin.effect':root.uuid,'flags.dnd5e.dependentOn':root.uuid,'flags.dnd5e.isTemporary':true,duration:{value:null,units:'seconds',expiry:null,expired:false}});
}
export function refreshElementalRestraint(effect,changes){if(changes.disabled!==false||!changes.system?.origin?.message)return;prepareElementalRestraint({parent:effect.parent,name:effect.name,system:changes.system,_stats:effect._stats,updateSource:data=>Object.assign(changes,data)});}
export function installElementalActivity(Type){
 const p=Type?.prototype;if(!p||wrapped.has(p))return;wrapped.add(p);for(const name of ['prepareFinalData','use']){const original=p[name],own=Object.hasOwn(p,name);if(!original)continue;p[name]=function(...args){if(name==='use')prepareElementalActivity(this);const result=(own?original:Object.getPrototypeOf(p)[name]).apply(this,args);if(name==='prepareFinalData')prepareElementalActivity(this);return result;};}
}
Hooks.once('ready',()=>{installElementalActivity(CONFIG.DND5E.activityTypes?.save?.documentClass);Hooks.on('preCreateActiveEffect',prepareElementalRestraint);Hooks.on('preUpdateActiveEffect',refreshElementalRestraint);});
