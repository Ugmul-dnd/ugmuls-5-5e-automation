import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue();
const values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function smiteProtectionContext(card){
 if(!["usage","damage"].includes(card?.type)||card.getFlag?.(ID,"pendingDamage"))return null;
 const selected=card.getFlag?.(ID,"selectedSmite"),item=card.getAssociatedItem?.(),actor=card.getAssociatedActor?.()??item?.actor;
 const spell=selected?(values(actor?.items).find(i=>i.uuid===selected.spell)??globalThis.fromUuidSync?.(selected.spell,{strict:false})):item;
 if((key(spell)??selected?.identifier)!=="divine-smite"||spell?.system?.source?.rules==="2014"||selected&&card.type!=="damage"||selected&& !card.rolls?.length)return null;
 if(selected?.actor&&selected.actor!==actor?.uuid)return null;
 const feature=values(actor?.items).find(i=>i.type==="feat"&&key(i)==="smite-of-protection"&&i.system?.source?.rules!=="2014");
 const level=Number(values(actor?.items).find(i=>i.type==="class"&&key(i)==="paladin")?.system?.levels??0);
 if(!feature||level<15)return null;
 const ref=card.system?.origin,origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 const root=selected||card.type==="usage"?card:origin??card;
 return {actor,feature,root};
}
export async function activateSmiteProtection(card){
 if(!authority())return;
 const context=smiteProtectionContext(card);if(!context)return;
 return enqueue(async()=>{
  const {actor,feature,root}=context;if(root.getFlag?.(ID,"smiteProtectionActivated"))return;
  const combat=game.combat,inCombat=combat?.started&&values(combat.combatants).some(c=>c.actor?.uuid===actor.uuid);
  const data={name:"Smite of Protection — Aura Active",img:feature.img??"icons/magic/symbols/cog-shield-white-blue.webp",type:"base",disabled:false,transfer:false,
   origin:actor.uuid,system:{changes:[],origin:{actor:actor.uuid,item:feature.uuid,message:root.uuid}},statuses:[],
   start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:inCombat?null:6,units:"seconds",expiry:inCombat?"sourceStart":null,expired:false},
   flags:{[ID]:{smiteProtectionAura:{source:root.uuid,feature:feature.uuid,...(inCombat?{combat:combat.id,round:combat.round,turn:combat.turn}:{expiresAt:Number(game.time?.worldTime??0)+6})}},dnd5e:{isTemporary:true},autoanimations:{version:5,isEnabled:false,isCustomized:false,killAnim:true}}};
  const effects=values(actor.effects).filter(effect=>effect.getFlag?.(ID,"smiteProtectionAura")),existing=effects[0];
  if(existing)await existing.update(data);else await actor.createEmbeddedDocuments("ActiveEffect",[data]);
  if(effects.length>1)await actor.deleteEmbeddedDocuments("ActiveEffect",effects.slice(1).map(e=>e.id));
  await root.setFlag(ID,"smiteProtectionActivated",true);
  globalThis.Ugmuls55eAutomationPaladinAuras?.queue();
 });
}
export async function expireSmiteProtection(combat,changes={}){
 if(!authority()||!("turn" in changes||"round" in changes||changes.started===false))return;
 return enqueue(async()=>{
  const actors=new Map([...values(game.actors),...values(combat?.combatants).map(c=>c.actor),...values(globalThis.canvas?.scene?.tokens).map(t=>t.actor)].filter(Boolean).map(a=>[a.uuid,a]));
  let removed=false;
  for(const actor of actors.values()){
   const ids=values(actor.effects).filter(effect=>{
    const record=effect.getFlag?.(ID,"smiteProtectionAura");if(!record)return false;
    const sourceCombat=record.combat??effect.start?.combat?.id??effect.start?.combat;if(sourceCombat!==combat?.id)return false;
    if(changes.started===false||!combat.started)return true;
    if(combat.combatant?.actor?.uuid!==actor.uuid)return false;
    const round=record.round??effect.start?.round,turn=record.turn??effect.start?.turn;
    return round!==combat.round||turn!==combat.turn;
   }).map(e=>e.id);
   if(ids.length){await actor.deleteEmbeddedDocuments("ActiveEffect",ids);removed=true;}
  }
  if(removed){const api=globalThis.Ugmuls55eAutomationPaladinAuras;await api?.sync?.(globalThis.canvas?.scene??combat.scene);api?.queue();}
 });
}
Hooks.once("ready",()=>{
 Hooks.on("updateCombat",(combat,changes)=>expireSmiteProtection(combat,changes).catch(console.error));
 Hooks.on("deleteCombat",combat=>expireSmiteProtection(combat,{started:false}).catch(console.error));
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>activateSmiteProtection(card).catch(error=>{console.error("Smite of Protection",error);ui.notifications.error("Smite of Protection could not update: "+error.message);}));
});
