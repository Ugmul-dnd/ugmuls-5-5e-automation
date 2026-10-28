import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue();let bridge=false;
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"clairvoyantCombatantAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const live=e=>e&&!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired&&!e.system?.expired;
const resolve=ref=>typeof ref==="string"?(globalThis.fromUuidSync?.(ref,{strict:false})??game.messages?.get(ref.replace(/^ChatMessage\./,""))):ref;
const actorOf=d=>d?.actor??d;
function source(effect){
 if(flag(effect,"clairvoyantLink"))return null;
 const origin=effect.system?.origin??{},doc=resolve(origin.activity??origin.item),item=doc?.item??doc,card=resolve(origin.message);
 const feature=item??card?.getAssociatedItem?.(),key=feature?.identifier??feature?.system?.identifier;
 if(key!=="clairvoyant-combatant"&&!/^clairvoyant combatant$/i.test(feature?.name??""))return null;
 const actor=feature.actor??card?.getAssociatedActor?.();return actor?{actor,feature}:null;
}
export function clairvoyantSource(effect){return flag(effect,"clairvoyantCombatant")?.caster??source(effect)?.actor.uuid;}
export function prepareClairvoyantEffect(effect){
 if(!enabled()||effect.parent?.documentName!=="Actor")return;const c=source(effect);if(!c)return;
 const level=Number(c.actor.classes?.warlock?.system?.levels??values(c.actor.items).find(i=>i.type==="class"&&(i.identifier??i.system?.identifier)==="warlock")?.system?.levels);if(!(level>0))return;
 effect.updateSource({origin:c.actor.uuid,duration:{value:level*60,units:"seconds",expiry:null,expired:false},["flags."+ID+".clairvoyantCombatant"]:{caster:c.actor.uuid,item:c.feature.uuid},"flags.dnd5e.isTemporary":true});
}
function pairActive(effect,caster){const paired=values(caster?.effects).find(e=>flag(e,"clairvoyantLink")?.targetEffect===effect.uuid);return !paired||live(paired);}
export function clairvoyantModes(actor,target){
 if(!enabled()||!actor?.uuid||!target?.uuid||actor.uuid===target.uuid)return {advantage:false,disadvantage:false};
 const advantage=values(target.effects).some(e=>live(e)&&clairvoyantSource(e)===actor.uuid&&pairActive(e,actor));
 const disadvantage=values(actor.effects).some(e=>live(e)&&clairvoyantSource(e)===target.uuid&&pairActive(e,target));
 return {advantage,disadvantage};
}
export function clairvoyantDefaults(config,dialog,message){
 if(bridge&&game.modules?.get?.("automated-conditions-5e")?.active||config.subject?.type!=="attack")return;
 const actor=config.subject.actor??config.subject.item?.actor,recorded=message?.data?.system?.targets;
 const targets=recorded?.length?recorded.map(t=>actorOf(resolve(t.token??t.actor))).filter(Boolean):values(game.user.targets).map(t=>(t.document??t).actor);
 if(targets.length!==1)return;const mode=clairvoyantModes(actor,targets[0]);if(!mode.advantage&&!mode.disadvantage)return;
 config.advantage ||= mode.advantage;config.disadvantage ||= mode.disadvantage;
 for(const roll of config.rolls??[]){roll.options??={};const adv=!!(config.advantage||roll.options.advantage||roll.options.advantageMode===1),dis=!!(config.disadvantage||roll.options.disadvantage||roll.options.advantageMode===-1);Object.assign(roll.options,{advantage:adv,disadvantage:dis,advantageMode:adv===dis?0:adv?1:-1});}
 dialog.options??={};dialog.options.defaultButton=config.advantage===config.disadvantage?"normal":config.advantage?"advantage":"disadvantage";
 if(config.rolls?.[0]?.options?.advantageMode===0)dialog.options.defaultButton="normal";
}
export function registerClairvoyant(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return bridge;
 try{const results=["advantage","disadvantage"].map(mode=>api.register({key:"rsaClairvoyant"+mode,scope:"universal",hook:"attack",target:"subject",mode,name:"Clairvoyant Combatant",persistent:false,evaluate:s=>clairvoyantModes(actorOf(resolve(s.actorUuid)),actorOf(resolve(s.opponentActorUuid??s.opponentUuid)))[mode]}));bridge=results.every(Boolean);}catch(error){console.warn("Clairvoyant Combatant integration",error);}return bridge;
}
export async function syncClairvoyantPair(effect,removed=false){
 if(!authority())return;
 const link=flag(effect,"clairvoyantLink");if(link){if(removed){const target=await fromUuid(link.targetEffect,{strict:false});if(target)await target.delete();}return;}
 const caster=resolve(clairvoyantSource(effect));if(!caster)return;
 const existing=values(caster.effects).filter(e=>flag(e,"clairvoyantLink")?.targetEffect===effect.uuid);
 if(removed||!enabled()){if(existing.length)await caster.deleteEmbeddedDocuments("ActiveEffect",existing.map(e=>e.id));return;}
 const sourceData=effect.toObject(),target=effect.parent;
 const data={name:"Clairvoyant Combatant — "+target.name,img:effect.img,type:"base",transfer:false,disabled:effect.disabled||effect.active===false,start:sourceData.start,duration:sourceData.duration,system:{changes:[],origin:{actor:caster.uuid}},flags:{dnd5e:{isTemporary:true},[ID]:{clairvoyantLink:{targetEffect:effect.uuid,target:target.uuid}}}};
 if(existing[0]){const current=existing[0].toObject();if(current.disabled!==data.disabled||JSON.stringify(current.duration)!==JSON.stringify(data.duration)||JSON.stringify(current.start)!==JSON.stringify(data.start))await existing[0].update(data);}else await caster.createEmbeddedDocuments("ActiveEffect",[data]);
 if(existing.length>1)await caster.deleteEmbeddedDocuments("ActiveEffect",existing.slice(1).map(e=>e.id));
}
export async function updateAwakenedBond(card){
 if(!authority()||!enabled()||card?.type!=="usage"||flag(card,"clairvoyantBondHandled")||flag(card,"targetsConfirmationPending")||flag(card,"targetsConfirmationCanceled"))return;
 const activity=card.getAssociatedActivity?.(),item=activity?.item;if((item?.identifier??item?.system?.identifier)!=="awakened-mind"||activity.type!=="utility"||card.system?.targets?.length!==1)return;
 const caster=card.getAssociatedActor?.()??activity.actor,ref=card.system.targets[0],target=actorOf(resolve(ref.token??ref.actor));if(!target)return;
 for(const effect of values(caster.effects)){const link=flag(effect,"clairvoyantLink");if(!link||link.target===target.uuid)continue;const old=await fromUuid(link.targetEffect,{strict:false});if(old)await old.delete();else await effect.delete();}
 await card.setFlag(ID,"clairvoyantBondHandled",true);
}
function report(error){console.error("Clairvoyant Combatant",error);}
Hooks.once("init",()=>game.settings.register(ID,"clairvoyantCombatantAutomation",{name:"Great Old One: Clairvoyant Combatant",hint:"Native failed-save effect grants the caster Advantage against that creature and its attacks Disadvantage against the caster. Track the Warlock-level duration and clear when Awakened Mind connects to someone else. Activation and resource use remain native.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerClairvoyant(usageRules));
Hooks.once("ready",()=>{
 registerClairvoyant();Hooks.on("preCreateActiveEffect",prepareClairvoyantEffect);
 for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect"])Hooks.on(event,effect=>{if(clairvoyantSource(effect)||flag(effect,"clairvoyantLink"))enqueue(()=>syncClairvoyantPair(effect,event==="deleteActiveEffect")).catch(report);});
 Hooks.on("dnd5e.preRollAttackV2",clairvoyantDefaults);
 Hooks.on("dnd5e.postBuildAttackRollConfig",(config,roll,index,{app,formData}={})=>{if(!formData)clairvoyantDefaults({...config,rolls:[roll]},{options:{}},app?.message);});
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{if(card.type==="usage")enqueue(()=>updateAwakenedBond(card)).catch(report);});
});
