import {createEventQueue} from "./shared-activity-card.js";
import {isRageEffect} from "./primal-knowledge.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const enabled=()=>game.settings.get(ID,"vitalitySurgeAutomation")===true;
const live=e=>!!e&&!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired&&!e.system?.expired;
const marker=e=>e.getFlag?.(ID,"vitalitySurgeGranted")??e.flags?.[ID]?.vitalitySurgeGranted;
export function vitalitySurgeContext(effect){
 const actor=effect?.parent;if(actor?.documentName!=="Actor"||!live(effect)||!isRageEffect(actor,effect))return null;
 const feature=values(actor.items).find(i=>i.type==="feat"&&key(i)==="vitality-of-the-tree"&&i.system?.source?.rules!=="2014");
 const level=Number(values(actor.items).find(i=>i.type==="class"&&key(i)==="barbarian")?.system?.levels);
 return feature&&Number.isFinite(level)&&level>0?{actor,feature,level}:null;
}
export function prepareVitalityActivation(effect,changes,options={}){
 if(!enabled()||effect.parent?.documentName!=="Actor"||!isRageEffect(effect.parent,effect))return;
 const message=changes["system.origin.message"]??changes.system?.origin?.message;
 const revived=(changes["duration.expired"]??changes.duration?.expired)===false&&(effect.duration?.expired||effect.system?.expired);
 // Extending an existing Rage or updating linked-benefit flags is not a new activation.
 const activation=changes.disabled===false&&effect.disabled||revived||message&&message!==effect.system?.origin?.message;
 if(!activation)return;
 // Preserve an explicit restored marker (for example native effect Undo).
 if(changes["flags."+ID+".vitalitySurgeGranted"]||changes.flags?.[ID]?.vitalitySurgeGranted)return;
 changes["flags."+ID+".-=vitalitySurgeGranted"]=null;
 options.rsaVitalitySurgeActivation=true;
}
export function grantVitalitySurge(effect){return enqueue(async()=>{
 if(!authority()||!enabled()||marker(effect))return false;
 const context=vitalitySurgeContext(effect);if(!context)return false;
 const {actor,feature,level}=context,previous=Number(actor.system?.attributes?.hp?.temp??0),amount=Math.max(Number.isFinite(previous)?previous:0,level);
 // Claim the activation even if higher temporary HP already wins. Later damage
 // or unrelated Rage updates must not refill that activation's temporary HP.
 await effect.setFlag(ID,"vitalitySurgeGranted",{feature:feature.uuid,level});
 try{if(amount>previous||!Number.isFinite(previous))await actor.update({"system.attributes.hp.temp":amount});}
 catch(error){await effect.unsetFlag(ID,"vitalitySurgeGranted");throw error;}
 return true;
});}
function report(error){console.error("Vitality Surge",error);ui.notifications.error("Could not grant Vitality Surge temporary HP: "+error.message);}
Hooks.once("init",()=>game.settings.register(ID,"vitalitySurgeAutomation",{name:"Vitality Surge with Rage",hint:"When a World Tree Barbarian activates Rage, immediately grant temporary HP equal to Barbarian level, preserving a higher existing amount. No extra cards or Apply clicks. Life-Giving Force remains manual.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("preUpdateActiveEffect",prepareVitalityActivation);
 Hooks.on("createActiveEffect",effect=>{if(vitalitySurgeContext(effect))grantVitalitySurge(effect).catch(report);});
 Hooks.on("updateActiveEffect",(effect,changes,options)=>{if(options?.rsaVitalitySurgeActivation)grantVitalitySurge(effect).catch(report);});
});
