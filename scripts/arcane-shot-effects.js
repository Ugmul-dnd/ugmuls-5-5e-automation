const ID="ugmuls-5-5e-automation",values=value=>Array.from(value?.values?.()??value??[]),pending=new Set();
const definitions={"banishing-shot":"GapxhFx9rRDVJx6N","shadow-shot":"sCVI6TttohLcAngc","enfeebling-shot":"pTMUeFzrvQANbp3t","grasping-shot":"mobpmrt8tFt5gDPp"};
const enabled=()=>game.settings.get(ID,"arcaneShotEffectsAutomation")===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
export function shotKind(item){const key=item?.identifier??item?.system?.identifier;return item?.type==="feat"&&definitions[key]&&values(item.system?.activities).some(a=>a.id===definitions[key])?key:null;}
export function shotSource(effect){
 const activity=resolve(effect.system?.origin?.activity),item=activity?.item??resolve(effect.system?.origin?.item)??resolve(effect._stats?.duplicateSource)?.parent??resolve(effect.origin);
 return shotKind(item)?item:null;
}
export function prepareShotEffect(effect){
 if(!enabled()||effect.parent?.documentName!=="Actor")return;
 const item=shotSource(effect),kind=shotKind(item);if(!kind)return;
 const updates={start:CONFIG.ActiveEffect.documentClass.getEffectStart(),"duration.expired":false,"flags.dnd5e.isTemporary":true,["flags."+ID+".arcaneShot"]:{kind,source:item.uuid,caster:item.actor?.uuid,...(game.combat?.started?{applied:{combat:game.combat.id,round:game.combat.round,turn:game.combat.turn}}:{})}};
 if(kind!=="grasping-shot")updates.duration={value:null,units:"seconds",expiry:"targetEnd",expired:false};
 // Keep native conditions, movement restriction and damage reduction. Select
 // the reduction die from the originating Fighter, never the victim's level.
 if(kind==="enfeebling-shot"){
  const fighter=values(item.actor?.items).find(i=>i.type==="class"&&(i.identifier??i.system?.identifier)==="fighter"),level=Number(fighter?.system?.levels??item.actor?.getRollData?.()?.classes?.fighter?.levels);
  if(Number.isInteger(level)&&level>=3){const die=level>=18?12:level>=15?10:level>=10?8:6;updates["system.changes"]=values(effect.system?.changes).map(change=>/^system\.rolls\.damage\.(mwak|rwak|msak|rsak)\.bonus$/.test(change.key)?{...change,value:"-1d"+die}:change);}
 }
 effect.updateSource(updates);
}
const ending=new Set(),timedShots=new Set(["banishing-shot","shadow-shot","enfeebling-shot"]);
export async function expireShotTurn(combat,changes={}){
 if(!enabled()||!authority()||combat.started===false||!(Object.hasOwn(changes,"turn")||Object.hasOwn(changes,"round")))return;
 const previous=combat.previous;
 if(!previous?.combatantId||previous.round===combat.round&&previous.turn===combat.turn)return;
 const actor=combat.combatants.get(previous.combatantId)?.actor;
 if(!actor||ending.has(actor.uuid))return;
 const ids=[];
 // Inspect only the outgoing target. Native expiry may already have removed
 // an effect; only still-present documents are sent to the deletion call.
 for(const effect of values(actor.effects)){
  const marker=effect.getFlag?.(ID,"arcaneShot"),kind=marker?.kind??shotKind(shotSource(effect));
  if(!timedShots.has(kind))continue;
  const start=effect.start,created=marker?.applied??(start?{combat:start.combat?.id??start.combat??start.combatId,round:start.round,turn:start.turn}:null);
  if(created?.combat!==combat.id||!Number.isInteger(created.round)||!Number.isInteger(created.turn))continue;
  // An effect applied during this target's current turn lasts through its
  // NEXT turn, rather than expiring on the turn it was applied.
  if(previous.round>created.round||previous.round===created.round&&previous.turn>created.turn)ids.push(effect.id);
 }
 if(!ids.length)return;
 ending.add(actor.uuid);
 try{const existing=ids.filter(id=>values(actor.effects).some(effect=>effect.id===id));if(existing.length)await actor.deleteEmbeddedDocuments("ActiveEffect",existing);}finally{ending.delete(actor.uuid);}
}
function actors(){const found=new Map(values(game.actors).map(actor=>[actor.uuid,actor]));for(const token of values(globalThis.canvas?.scene?.tokens))if(token.actor)found.set(token.actor.uuid,token.actor);return found.values();}
export async function clearOldGrasping(card){
 if(!enabled()||!authority()||card?.type!=="usage"||card.getFlag?.(ID,"recurringTrigger")||card.getFlag?.(ID,"graspingReplaced")||pending.has(card.id))return;
 const item=card.getAssociatedItem?.()??card.getAssociatedActivity?.()?.item;
 if(shotKind(item)!=="grasping-shot"||!item.actor)return;
 pending.add(card.id);
 try{
  for(const actor of actors()){
   const ids=values(actor.effects).filter(effect=>{
    if(effect.system?.origin?.message===card.uuid||effect.system?.origin?.message===card.id)return false;
    const marker=effect.getFlag?.(ID,"arcaneShot"),source=shotSource(effect);
    return marker?.kind==="grasping-shot"&&marker.caster===item.actor.uuid||shotKind(source)==="grasping-shot"&&source.actor?.uuid===item.actor.uuid;
   }).map(effect=>effect.id);
   if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
  }
  await card.setFlag(ID,"graspingReplaced",true);
 }finally{pending.delete(card.id);}
}
Hooks.once("init",()=>game.settings.register(ID,"arcaneShotEffectsAutomation",{name:"Arcane Shot Effect Follow-through",hint:"Keep Arcane Shot activation manual. Start Banishing, Shadow and Enfeebling effects with fresh target-turn expiry; use the originating Fighter's Enfeebling die and clear previous Grasping brambles when reused. Grasping's optional escape prompt is configured in the Trigger Automation Library.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("preCreateActiveEffect",prepareShotEffect);
 Hooks.on("updateCombat",(combat,changes)=>expireShotTurn(combat,changes).catch(error=>{console.error("Arcane Shot expiry",error);ui.notifications.error(error.message);}));
 Hooks.on("createChatMessage",card=>clearOldGrasping(card).catch(error=>{console.error("Arcane Shot effects",error);ui.notifications.error(error.message);}));
});
