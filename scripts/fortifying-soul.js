const ID="ugmuls-5-5e-automation",BOOK="hofWiwFortifying",EFFECT="yOsSorHfe1rU5lnT";let bridge=false;
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const live=e=>e&&!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired&&!e.system?.expired;
const resolve=ref=>typeof ref==="string"?(game.messages?.get(ref.replace(/^ChatMessage\./,""))??globalThis.fromUuidSync?.(ref,{strict:false})):ref;
const fear=e=>values(e?.statuses).includes("frightened")||e?.system?.type==="frightened";
export function fortifyingWard(actor){return values(actor?.effects).find(e=>live(e)&&(flag(e,"fortifyingSoul")||e.id===EFFECT||e.name==="Fortifying Soul"||[e.origin,e.system?.origin?.item,e._stats?.compendiumSource].some(r=>r?.includes("."+BOOK))));}
export function fearSaveSource(actor,origin){
 const card=resolve(origin);if(!card)return false;
 const recurring=flag(card,"recurringTrigger");
 if(recurring?.effect&&!["damage","healing","condition","check","manualCheck"].includes(recurring.phase)){
  const effect=resolve(recurring.effect);if(effect&&live(effect)&&(effect.parent?.uuid===actor?.uuid||effect.actor?.uuid===actor?.uuid)&&fear(effect))return true;
 }
 const activity=card.getAssociatedActivity?.({scaled:true});if(activity?.type!=="save")return false;
 const item=activity.item??card.getAssociatedItem?.();
 // Inspect only effects linked to this save, not every effect on the item.
 const refs=[...values(activity.effects).filter(r=>r.onSave!==true),...values(activity.appliedEffects)];
 return refs.some(ref=>{const id=typeof ref==="string"?ref:ref._id??ref.id;const e=typeof ref==="object"&&ref.statuses?ref:values(item?.effects).find(e=>(e.id??e._id)===id);return fear(e);});
}
export function fortifyingSave(actor,origin){return game.settings.get(ID,"fortifyingSoulAutomation")===true&&!!fortifyingWard(actor)&&fearSaveSource(actor,origin);}
export function fortifyingDefaults(config,dialog,message){
 if(bridge&&game.modules?.get?.("automated-conditions-5e")?.active)return;
 const actor=config.subject?.actor??config.subject;if(!fortifyingSave(actor,message?.data?.system?.origin))return;
 config.advantage=true;
 for(const roll of config.rolls??[]){roll.options??={};const dis=!!(config.disadvantage||roll.options.disadvantage||roll.options.advantageMode===-1);Object.assign(roll.options,{advantage:true,disadvantage:dis,advantageMode:dis?0:1});}
 dialog.options??={};dialog.options.defaultButton=config.disadvantage||config.rolls?.[0]?.options?.disadvantage?"normal":"advantage";
}
export function registerFortifyingSoul(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return bridge;
 try{bridge=!!api.register({key:"rsaFortifyingSoul",scope:"universal",hook:"save",target:"subject",mode:"advantage",name:"Fortifying Soul",persistent:false,evaluate:s=>fortifyingSave(globalThis.fromUuidSync?.(s.actorUuid,{strict:false}),s.options?.originatingMessageId)});}catch(error){console.warn("Fortifying Soul integration",error);bridge=false;}return bridge;
}
export function prepareFortifyingEffect(effect){
 if(effect.name!=="Fortifying Soul"&&!String(effect.origin??"").includes("."+BOOK))return;
 effect.updateSource({["flags."+ID+".fortifyingSoul"]:true});
}
Hooks.once("init",()=>game.settings.register(ID,"fortifyingSoulAutomation",{name:"Winter Walker: Fortifying Soul",hint:"While the native one-hour Fortifying Soul effect is active, default to Advantage on saves whose linked effect applies Frightened or whose repeat save ends Frightened. Unidentified and sheet-only saves remain manual.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerFortifyingSoul(usageRules));
Hooks.once("ready",()=>{registerFortifyingSoul();Hooks.on("preCreateActiveEffect",prepareFortifyingEffect);Hooks.on("dnd5e.preRollSavingThrowV2",fortifyingDefaults);});
