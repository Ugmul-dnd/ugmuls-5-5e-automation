import {createEventQueue,describeTarget,isEligibleTarget} from "./shared-activity-card.js";
import {auraProfile,syncPaladinScene} from "./paladin-auras.js";
import {syncPaladinLights} from "./paladin-lighting.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),wrapped=new WeakSet(),running=new Set();let bridge=false;
const values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),enabled=()=>game.settings.get(ID,"holyNimbusAutomation")===true;
export function nimbusEffect(actor){return values(actor?.effects).find(e=>flag(e,"holyNimbus")&&!e.disabled&&!e.duration?.expired&&!e.system?.expired);}
function feature(actor){return values(actor?.items).find(i=>i.type==="feat"&&key(i)==="holy-nimbus"&&i.system?.source?.rules!=="2014");}
export function prepareHolyNimbus(item){
 const data=item.toObject(),id="k6gGbWQBoLTgqbSG",activity=data.system.activities[id];if(!activity)throw Error("Holy Nimbus is missing its native activity.");
 data.flags??={};data.flags[ID]={...data.flags[ID],holyNimbusPrepared:true};
 activity.type="utility";delete activity.damage;activity.roll={prompt:false,visible:false,formula:""};activity.target={override:true,prompt:false,affects:{type:"self",choice:false},template:{type:""}};
 activity.consumption.targets=activity.consumption.targets.map(t=>t.type==="itemUses"&&!t.target?{...t,target:item.id}:t);
 // The authoritative handler applies the controlling effect exactly once.
 activity.effects=[];activity.appliedEffects=[];
 return {data,id};
}
export function installHolyNimbusPreparation(Type){
 let p=Type?.prototype;while(p&&!Object.hasOwn(p,"_createUsageMessage"))p=Object.getPrototypeOf(p);if(!p||wrapped.has(p)||typeof p.use!=="function")return;wrapped.add(p);
 const use=p.use;p.use=function(usage={},dialog={},message={}){
  if(!enabled()||key(this.item)!=="holy-nimbus"||this.id!=="k6gGbWQBoLTgqbSG"||flag(this.item,"holyNimbusPrepared")||flag(this.item,"holyNimbusDamage"))return use.call(this,usage,dialog,message);
  const {data,id}=prepareHolyNimbus(this.item),helper=new CONFIG.Item.documentClass(data,{parent:this.actor??this.item.actor});helper.prepareFinalAttributes?.();
  const flags=foundry.utils.mergeObject(message.data?.flags??{},{[ID]:{activityOverrideData:data,holyNimbusActivation:{feature:this.item.uuid}}},{inplace:false});
  return use.call(helper.system.activities.get(id),usage,dialog,{...message,data:{...message.data,flags}});
 };
}
export async function activateHolyNimbus(card){
 if(!authority()||!enabled()||card?.type!=="usage"||!flag(card,"holyNimbusActivation"))return;
 return enqueue(async()=>{
  if(flag(card,"holyNimbusActivated"))return;
  const actor=card.getAssociatedActor?.(),item=feature(actor);if(!item)return;
  const native=values(item.effects).find(e=>e.id==="aWH0EeuCWFgttRma");if(!native)throw Error("Holy Nimbus is missing its native effect.");
  const data=native.toObject();delete data._id;Object.assign(data,{disabled:false,transfer:false,origin:actor.uuid,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:600,units:"seconds",expiry:"turnStart",expired:false}});
  data.system={...data.system,changes:[],origin:{actor:actor.uuid,item:item.uuid,message:card.uuid}};data.flags??={};data.flags[ID]={...data.flags[ID],holyNimbus:{feature:item.uuid,source:card.uuid}};data.flags.dnd5e={...data.flags.dnd5e,isTemporary:true};
  const old=values(actor.effects).filter(e=>flag(e,"holyNimbus"));if(old[0])await old[0].update(data);else await actor.createEmbeddedDocuments("ActiveEffect",[data]);if(old.length>1)await actor.deleteEmbeddedDocuments("ActiveEffect",old.slice(1).map(e=>e.id));
  await card.setFlag(ID,"holyNimbusActivated",true);await syncPaladinLights(actor);globalThis.Ugmuls55eAutomationPaladinAuras?.queue();
 });
}
export function buildNimbusDamage(item){
 const data=item.toObject(),id="k6gGbWQBoLTgqbSG",activity=data.system.activities[id];if(!activity?.damage?.parts?.length)throw Error("Holy Nimbus needs its native Radiant damage activity.");
 data._id=foundry.utils.randomID();data.flags??={};data.flags[ID]={...data.flags[ID],holyNimbusDamage:true};data.effects=[];data.system.activities={[id]:activity};
 activity.effects=[];activity.appliedEffects=[];activity.activation={type:"special",override:true};activity.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};activity.duration={units:"inst",concentration:false,override:true};activity.range={units:"any",override:true};activity.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};activity.damage.critical={allow:false};
 return {data,id};
}
export async function triggerHolyNimbus(combat,changes){
 if(!authority()||!enabled()||!combat.started||!("turn" in changes||"round" in changes||changes.started===true))return;
 const target=combat.combatant?.token,scene=target?.parent;if(!target?.actor||!isEligibleTarget(target)||scene!==(game.scenes?.active??globalThis.canvas?.scene))return;
 await syncPaladinScene(scene);
 const stamp=combat.id+":"+combat.round+":"+combat.turn+":"+target.uuid;
 for(const source of values(scene.tokens)){
  const effect=nimbusEffect(source.actor),profile=effect&&auraProfile(source),item=feature(source.actor);
  if(!profile?.active||!item||source.actor.uuid===target.actor.uuid||!source.disposition||!target.disposition||Math.sign(source.disposition)===Math.sign(target.disposition))continue;
  const region=values(scene.regions).find(r=>flag(r,"paladinAura")?.token===source.uuid);if(!region||target.testInsideRegion?.(region)!==true||flag(effect,"holyNimbusLastTurn")===stamp||running.has(effect.uuid))continue;
  running.add(effect.uuid);try{
   await effect.setFlag(ID,"holyNimbusLastTurn",stamp);
   const {data,id}=buildNimbusDamage(item),helper=new CONFIG.Item.documentClass(data,{parent:source.actor});helper.prepareFinalAttributes?.();const targets=[describeTarget(target)],flags={[ID]:{riderTriggered:true,activityOverrideData:data,holyNimbusDamage:{source:source.uuid,stamp}},dnd5e:{item:{data}}};
   const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{system:{targets},flags}});if(!result?.message)throw Error("Holy Nimbus damage card could not be created.");
   await helper.system.activities.get(id).rollDamage({isCritical:false},{configure:false},{data:{system:{origin:result.message.id,targets},flags}});
  }catch(error){await effect.unsetFlag?.(ID,"holyNimbusLastTurn");throw error;}finally{running.delete(effect.uuid);}
 }
}
function enemyType(actor){const type=actor?.system?.details?.type;return String(typeof type==="string"?type:type?.value??"").toLowerCase();}
export function holyWard(actor,source){return !!nimbusEffect(actor)&&["fiend","undead"].includes(enemyType(source));}
export function holyWardSave(config,dialog,message){
 if(!enabled()||bridge)return;const actor=config.subject?.documentName==="Actor"?config.subject:config.subject?.actor??config.subject;
 const ref=message?.data?.system?.origin,origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref,source=origin?.getAssociatedActor?.();if(!holyWard(actor,source))return;
 config.advantage=true;for(const roll of config.rolls??[]){roll.options??={};roll.options.advantage=true;}dialog.options??={};dialog.options.defaultButton=config.disadvantage?"normal":"advantage";
}
export function registerHolyWard(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return bridge;
 bridge=!!api.register({key:"rsaHolyNimbusWard",scope:"universal",hook:"save",target:"subject",mode:"advantage",name:"Holy Nimbus — Holy Ward",persistent:false,evaluate:s=>enabled()&&holyWard(globalThis.fromUuidSync?.(s.actorUuid,{strict:false}),globalThis.fromUuidSync?.(s.opponentActorUuid,{strict:false}))});return bridge;
}
function sync(actor){if(authority()&&actor)enqueue(()=>syncPaladinLights(actor)).catch(report);}
function report(error){console.error("Holy Nimbus",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"holyNimbusAutomation",{name:"Holy Nimbus Assistance",hint:"Activate Holy Nimbus as a temporary self effect. Use the unified aura for enemy turn-start Radiant damage and bright sunlight, and recommend save Advantage against Fiend/Undead sources. Native feature and slot restoration consumption remain intact.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerHolyWard(usageRules));
Hooks.once("ready",()=>{
 installHolyNimbusPreparation(CONFIG.DND5E?.activityTypes?.damage?.documentClass);registerHolyWard();
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>activateHolyNimbus(card).catch(report));
 for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect"])Hooks.on(event,e=>{if(flag(e,"holyNimbus")||flag(e,"sacredWeapon"))sync(e.actor??e.parent);});
 Hooks.on("updateCombat",(c,d)=>{triggerHolyNimbus(c,d).catch(report);for(const a of new Set(values(c.combatants).map(c=>c.actor).filter(Boolean)))if(values(a.effects).some(e=>flag(e,"holyNimbus")))sync(a);});
 Hooks.on("updateWorldTime",()=>{for(const actor of values(game.actors))if(values(actor.effects).some(e=>flag(e,"holyNimbus")))sync(actor);});
 Hooks.on("createToken",t=>sync(t.actor));Hooks.on("canvasReady",()=>{for(const actor of new Set(values(canvas.scene?.tokens).map(t=>t.actor).filter(Boolean)))sync(actor);});
 Hooks.on("dnd5e.preRollSavingThrowV2",holyWardSave);
});
