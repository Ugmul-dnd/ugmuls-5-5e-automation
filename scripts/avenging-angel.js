import {createEventQueue,describeTarget,isEligibleTarget} from "./shared-activity-card.js";
import {auraProfile,syncPaladinScene} from "./paladin-auras.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),running=new Set();let bridge=false;
const values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"avengingAngelAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),live=e=>e&&!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
const feature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="avenging-angel"&&i.system?.source?.rules!=="2014");
export const angelEffect=actor=>values(actor?.effects).find(e=>live(e)&&flag(e,"avengingAngel"));
export function angelActivation(card){
 if(card?.type!=="usage")return null;const activity=card.getAssociatedActivity?.(),item=activity?.item;if(key(item)!=="avenging-angel"||item.system?.source?.rules==="2014"||activity.id!=="PUWfXLPucizXR8p0")return null;
 const actor=card.getAssociatedActor?.()??activity.actor,native=feature(actor);return native?{actor,feature:native}:null;
}
export async function activateAngel(card){
 if(!authority()||!enabled())return;const context=angelActivation(card);if(!context)return;
 return enqueue(async()=>{
  if(flag(card,"avengingAngelActivated"))return;const {actor,feature:item}=context,native=values(item.effects).find(e=>e.id==="r3Dvi3peq1i23QVP");if(!native)throw Error("Avenging Angel needs its native flight effect.");
  const data=native.toObject();delete data._id;Object.assign(data,{disabled:false,transfer:false,origin:actor.uuid,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:600,units:"seconds",expiry:"turnStart",expired:false}});
  data.system={...data.system,origin:{actor:actor.uuid,item:item.uuid,message:card.uuid}};data.flags??={};data.flags[ID]={...data.flags[ID],avengingAngel:{feature:item.uuid,source:card.uuid}};data.flags.dnd5e={...data.flags.dnd5e,isTemporary:true};
  const old=values(actor.effects).filter(e=>flag(e,"avengingAngel"));if(old[0])await old[0].update(data);else await actor.createEmbeddedDocuments("ActiveEffect",[data]);if(old.length>1)await actor.deleteEmbeddedDocuments("ActiveEffect",old.slice(1).map(e=>e.id));await card.setFlag(ID,"avengingAngelActivated",true);globalThis.Ugmuls55eAutomationPaladinAuras?.queue();
 });
}
export function buildAngelSave(item,source,stamp){
 const data=item.toObject(),id="UV3wzKmXpqDjWDAy",save=data.system.activities[id];if(!save)throw Error("Avenging Angel is missing its native Wisdom save.");
 const effect=data.effects.find(e=>e._id==="ucmM8P37dhbuz8eK");if(!effect)throw Error("Avenging Angel is missing its native Frightened effect.");
 data._id=foundry.utils.randomID();data.name="Avenging Angel — Frightful Aura";data.system.activities={[id]:save};data.effects=[effect];
 Object.assign(effect,{name:"Avenging Angel — Frightened",disabled:false,transfer:false,duration:{value:60,units:"seconds",expiry:"turnStart",expired:false}});delete effect.start;effect.statuses=[...new Set([...(effect.statuses??[]),"frightened"])];effect.flags??={};effect.flags[ID]={...effect.flags[ID],avengingAngelFear:{source:source.uuid,actor:source.actor.uuid,stamp}};effect.flags.dnd5e={...effect.flags.dnd5e,isTemporary:true};
 save.effects=[{_id:effect._id,onSave:false}];save.appliedEffects=[effect._id];save.save.ability=["wis"];save.damage={parts:[],onSave:"none"};save.activation={type:"special",override:true};save.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};save.duration={units:"inst",override:true,concentration:false};save.range={units:"any",override:true};save.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};
 const quiet={version:5,isEnabled:false,isCustomized:false,killAnim:true};data.flags??={};data.flags.autoanimations=quiet;save.flags??={};save.flags.autoanimations=quiet;return {data,id};
}
export async function triggerAngel(combat,changes){
 if(!authority()||!enabled()||!combat.started||!("turn" in changes||"round" in changes||changes.started===true))return;
 const target=combat.combatant?.token,scene=target?.parent;if(!target?.actor||!isEligibleTarget(target)||scene!==(game.scenes?.active??globalThis.canvas?.scene))return;
 await syncPaladinScene(scene);const stamp=combat.id+":"+combat.round+":"+combat.turn+":"+target.uuid;
 for(const source of values(scene.tokens)){
  const effect=angelEffect(source.actor),profile=effect&&auraProfile(source),item=feature(source.actor);
  if(!profile?.active||!item||source.actor.uuid===target.actor.uuid||!source.disposition||!target.disposition||Math.sign(source.disposition)===Math.sign(target.disposition))continue;
  const region=values(scene.regions).find(r=>flag(r,"paladinAura")?.token===source.uuid);if(!region||target.testInsideRegion?.(region)!==true||flag(effect,"avengingAngelLastTurn")===stamp||running.has(effect.uuid))continue;
  running.add(effect.uuid);try{
   await effect.setFlag(ID,"avengingAngelLastTurn",stamp);const {data,id}=buildAngelSave(item,source,stamp),helper=new CONFIG.Item.documentClass(data,{parent:source.actor});helper.prepareFinalAttributes?.();
   const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{system:{targets:[describeTarget(target)]},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,avengingAngelSave:{source:source.uuid,target:target.uuid,stamp}}}}});if(!result?.message)throw Error("Avenging Angel save card could not be created.");
  }catch(error){await effect.unsetFlag?.(ID,"avengingAngelLastTurn");throw error;}finally{running.delete(effect.uuid);}
 }
}
export function angelFrightened(actor){return !!actor?.statuses?.has("frightened")&&values(actor.effects).some(e=>live(e)&&flag(e,"avengingAngelFear"));}
export async function endAngelFear(actor,amount,options={}){
 if(!Number.isFinite(amount)||amount<=0||options.rsaUndoDamage)return;
 const effects=values(actor?.effects).filter(e=>live(e)&&flag(e,"avengingAngelFear"));if(!effects.length)return;
 const ref=options.origin??options.originatingMessage,origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 if(!authority()){if(game.users.activeGM&&actor.isOwner)game.socket.emit("module."+ID,{action:"angelDamageTaken",actor:actor.uuid,effects:effects.map(e=>e.id),amount,source:origin?.id,user:game.user.id,gm:game.users.activeGM.id});return;}
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(origin);
 const ids=effects.filter(e=>live(e)&&values(actor.effects).includes(e)).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
}
export function angelAttackDefaults(config,dialog,message){
 if(!enabled()||bridge||config.subject?.type!=="attack")return;
 const recorded=message?.data?.system?.targets,targets=recorded?.length?recorded.map(t=>globalThis.fromUuidSync?.(t.token,{strict:false})?.actor):values(game.user.targets).map(t=>(t.document??t).actor);
 if(targets.length!==1||!angelFrightened(targets[0]))return;
 const dis=config.disadvantage===true||(config.rolls??[]).some(r=>r.options?.disadvantage===true||r.options?.advantageMode===-1);config.advantage=true;for(const r of config.rolls??[]){r.options??={};r.options.advantage=true;r.options.advantageMode=dis?0:1;}dialog.options??={};dialog.options.defaultButton=dis?"normal":"advantage";
}
export function registerAngelRule(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return bridge;
 bridge=!!api.register({key:"rsaAvengingAngelFear",scope:"universal",hook:"attack",target:"subject",mode:"advantage",name:"Avenging Angel — Frightened target",persistent:false,evaluate:s=>enabled()&&angelFrightened(globalThis.fromUuidSync?.(s.opponentActorUuid,{strict:false}))});return bridge;
}
function report(error){console.error("Avenging Angel",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"avengingAngelAutomation",{name:"Avenging Angel Assistance",hint:"Use the native Vengeance flight activation and existing Paladin aura. Prompt enemy turn-start Wisdom saves, apply Frightened on failure for one minute or until damage, and grant Advantage on attacks against affected creatures. Native feature and restore-use costs remain unchanged.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerAngelRule(usageRules));
Hooks.once("ready",()=>{
 registerAngelRule();for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>activateAngel(card).catch(report));
 Hooks.on("preCreateActiveEffect",effect=>{if(flag(effect,"avengingAngelFear")&&effect.parent?.documentName==="Actor")effect.updateSource({start:CONFIG.ActiveEffect.documentClass.getEffectStart(),"duration.expired":false});});
 Hooks.on("updateCombat",(combat,changes)=>triggerAngel(combat,changes).catch(report));Hooks.on("dnd5e.preRollAttackV2",angelAttackDefaults);Hooks.on("dnd5e.applyDamage",(actor,amount,options)=>endAngelFear(actor,amount,options).catch(report));
 game.socket.on("module."+ID,packet=>{if(packet?.action!=="angelDamageTaken"||!authority()||packet.gm!==game.user.id||!Number.isFinite(packet.amount)||packet.amount<=0)return;const user=game.users.get(packet.user),actor=globalThis.fromUuidSync?.(packet.actor,{strict:false});if(!user?.active||!actor||!(user.isGM||actor.testUserPermission?.(user,"OWNER")))return;const allowed=new Set(packet.effects??[]),effects=values(actor.effects).filter(e=>allowed.has(e.id)&&live(e)&&flag(e,"avengingAngelFear"));enqueue(async()=>{await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(game.messages.get(packet.source));const ids=effects.filter(e=>live(e)&&values(actor.effects).includes(e)).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);}).catch(report);});
});
