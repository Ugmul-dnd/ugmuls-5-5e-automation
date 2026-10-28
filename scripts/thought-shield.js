import {createEventQueue,describeTarget} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const cardFor=options=>{const ref=options.origin??options.originatingMessage;return typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;};
export function thoughtShield(actor){return values(actor?.items).find(i=>i.type==="feat"&&(i.identifier??i.system?.identifier)==="thought-shield");}
export function captureThoughtDamage(actor,damages,options){
 if(game.settings.get(ID,"thoughtShieldAutomation")!==true||!thoughtShield(actor)||options.rsaUndoDamage||flag(cardFor(options),"thoughtShieldReflection"))return;
 options.rsaThoughtPsychic=Math.max(0,Math.min(Number(damages.amount)||0,Math.trunc(values(damages).filter(d=>d.type==="psychic").reduce((n,d)=>n+Math.max(0,Number(d.value)||0),0))));
}
export function thoughtSource(card,scene){
 const activity=card?.getAssociatedActivity?.({scaled:true}),actor=activity?.actor??card?.getAssociatedActor?.();
 const ref=card?.system?.origin,usage=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref,speaker=usage?.speaker??card?.speaker;
 const token=speaker?.token&&globalThis.fromUuidSync?.("Scene."+(speaker.scene??scene?.id)+".Token."+speaker.token,{strict:false});
 if(token?.actor&&(!actor||token.actor.uuid===actor.uuid))return token;
 const candidates=values(scene?.tokens).filter(t=>t.actor?.uuid===actor?.uuid);return candidates.length===1?candidates[0]:null;
}
export function reflectThoughtDamage(actor,amount,options){return enqueue(async()=>{
 const card=cardFor(options),feature=thoughtShield(actor),value=Math.min(Number(amount)||0,Number(options.rsaThoughtPsychic)||0);
 if(game.settings.get(ID,"thoughtShieldAutomation")!==true||!actor?.isOwner||!feature||value<=0||card?.type!=="damage"||options.rsaUndoDamage||flag(card,"thoughtShieldReflection"))return;
 const key=card.id,claims=flag(actor,"thoughtShieldCards")??[];if(claims.includes(key))return;
 const defender=actor.token??values(globalThis.canvas?.scene?.tokens).find(t=>t.actor?.uuid===actor.uuid),target=thoughtSource(card,defender?.parent??globalThis.canvas?.scene);
 if(!target?.actor||target.actor.uuid===actor.uuid)return;
 const id=foundry.utils.randomID(),data={name:"Thought Shield",type:"feat",img:feature.img,system:{identifier:"thought-shield-reflection",activities:{[id]:{_id:id,type:"damage",activation:{type:"special"},duration:{units:"inst"},range:{units:"any"},target:{prompt:false,affects:{type:"creature"},template:{type:""}},consumption:{spellSlot:false,targets:[]},damage:{critical:{allow:false},parts:[{custom:{enabled:true,formula:String(value)},types:["psychic"]}]}}}},flags:{[ID]:{thoughtShieldReflection:{source:card.id,defender:actor.uuid}}}};
 const helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();const activity=helper.system.activities.get(id),targets=[describeTarget(target)],flags={[ID]:{riderTriggered:true,thoughtShieldReflection:{source:card.id,defender:actor.uuid,amount:value},activityOverrideData:data},dnd5e:{item:{data}}};
 const result=await activity.use({consume:false,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets},flags}});
 if(!result?.message)throw Error("Thought Shield could not create its damage card.");
 // Keep one reflection per incoming card even after Undo/reapply; the reflected card retains its own Undo.
 await actor.setFlag(ID,"thoughtShieldCards",[...claims.slice(-127),key]);
 await activity.rollDamage({isCritical:false},{configure:false},{data:{system:{origin:result.message.id,targets},flags}});
});}
Hooks.once("init",()=>game.settings.register(ID,"thoughtShieldAutomation",{name:"Warlock: Thought Shield",hint:"After Psychic damage is applied, create a fixed Psychic damage card for the amount taken targeting the source creature. Uses normal damage Apply/Undo settings. Reflected damage does not reflect again.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.calculateDamage",captureThoughtDamage);
 Hooks.on("dnd5e.applyDamage",(actor,amount,options)=>{reflectThoughtDamage(actor,amount,options).catch(error=>{console.error("Thought Shield",error);ui.notifications.error(error.message);});});
});
