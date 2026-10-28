import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),tracked=new Map();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"searingVengeanceAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const resolve=ref=>typeof ref==="string"?(globalThis.fromUuidSync?.(ref,{strict:false})??game.messages?.get(ref.replace(/^ChatMessage\./,""))):ref;
const isSearing=item=>item?.type==="feat"&&(item.identifier??item.system?.identifier)==="searing-vengeance";
const stamp=()=>game.combat?.started?{combat:game.combat.id,round:game.combat.round,turn:game.combat.turn,combatant:game.combat.combatant?.id}:null;
export function recordSearingCast(activity,usage,dialog,message){if(!enabled()||!isSearing(activity.item))return;message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],searingVengeanceCast:stamp()};}
function effectSource(effect){
 for(const ref of [effect.system?.origin?.activity,effect.system?.origin?.item,effect.origin,effect._stats?.duplicateSource,effect._stats?.compendiumSource]){const doc=resolve(ref),item=doc?.item??(doc?.parent?.type==="feat"?doc.parent:doc);if(isSearing(item))return item;}
 let card=resolve(effect.system?.origin?.message);for(let n=0;card&&n<4;n++){const item=card.getAssociatedItem?.();if(isSearing(item))return item;card=resolve(card.system?.origin);}return null;
}
function castStamp(effect){let card=resolve(effect.system?.origin?.message);for(let n=0;card&&n<4;n++){const record=flag(card,"searingVengeanceCast");if(record)return record;card=resolve(card.system?.origin);}return null;}
export function searingTurnEnded(combat,record){
 if(!record||combat?.id!==record.combat)return false;
 if(combat.round===record.round&&combat.combatant?.id===record.combatant)return false;
 return combat.round>record.round||combat.round===record.round&&Number.isInteger(combat.turn)&&combat.turn>record.turn||combat.previous?.combatantId===record.combatant&&combat.previous.round===record.round&&combat.previous.turn===record.turn&&combat.combatant?.id!==record.combatant;
}
export function prepareSearingBlind(effect){
 if(!enabled()||effect.parent?.documentName!=="Actor"||!values(effect.statuses).includes("blinded"))return;
 const source=effectSource(effect);if(!source)return;const applied=castStamp(effect)??stamp();
 if(applied&&searingTurnEnded(game.combat,applied)){ui.notifications.warn("Searing Vengeance’s Blinded duration ended with the activation turn.");return false;}
 effect.updateSource({start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:applied?null:6,units:"seconds",expiry:null,expired:false},"flags.dnd5e.isTemporary":true,["flags."+ID+".searingVengeanceBlind"]:{caster:source.actor?.uuid,applied}});
}
function index(effect){if(flag(effect,"searingVengeanceBlind"))tracked.set(effect.uuid,effect);else tracked.delete(effect.uuid);}
function rebuild(){tracked.clear();const actors=new Map([...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor))].filter(Boolean).map(a=>[a.uuid,a]));for(const actor of actors.values())for(const effect of values(actor.effects))index(effect);}
export function expireSearingBlind(combat,changes={},ending=false){return enqueue(async()=>{
 if(!enabled()||!authority()||!ending&&!("turn"in changes||"round"in changes))return;
 for(const [uuid,stored]of tracked){const effect=resolve(uuid)??stored,record=flag(effect,"searingVengeanceBlind")?.applied;if(!record||record.combat!==combat.id||!ending&&!searingTurnEnded(combat,record))continue;
  // Recheck the parent collection: native expiry or another handler may already have removed it.
  const current=effect.parent?.effects?.get?.(effect.id)??values(effect.parent?.effects).find(e=>e.id===effect.id);if(current)await current.delete();tracked.delete(uuid);
 }
});}
function report(error){console.error("Searing Vengeance expiry",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"searingVengeanceAutomation",{name:"Searing Vengeance",hint:"Require one allied target at 0 HP within 60 feet. Automatically heal half its maximum HP and center the enemy-only burst on it, keeping native damage rolls and manual activation. Blinded ends with the activation turn.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 rebuild();Hooks.on("canvasReady",rebuild);Hooks.on("dnd5e.preUseActivity",recordSearingCast);Hooks.on("preCreateActiveEffect",prepareSearingBlind);
 for(const event of ["createActiveEffect","updateActiveEffect"])Hooks.on(event,index);Hooks.on("deleteActiveEffect",e=>tracked.delete(e.uuid));
 Hooks.on("updateCombat",(combat,changes)=>expireSearingBlind(combat,changes).catch(report));Hooks.on("deleteCombat",combat=>expireSearingBlind(combat,{},true).catch(report));
});
