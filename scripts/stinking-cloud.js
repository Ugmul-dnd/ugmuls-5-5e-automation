import {getRegionSpellTable} from "./region-library.js";

// Preserve the book effect and its condition; only correct applied-copy expiry.
function isStinkingCloudEffect(effect) {
 if(effect.parent?.documentName!=="Actor"||getRegionSpellTable()["Stinking Cloud"]?.enabled===false)return;
 const refs=[effect.system?.origin?.activity,effect.system?.origin?.item,effect._stats?.duplicateSource,effect.origin].filter(Boolean);
 const nativeEffect="gFid0DG5HydORpr3";
 const sourced=refs.some(ref=>{
  const source=globalThis.fromUuidSync?.(ref,{strict:false});
  const spell=source?.item??(source?.type==="spell"?source:source?.parent);
  return (spell?.identifier??spell?.system?.identifier)==="stinking-cloud" &&
   (source?.id===nativeEffect||effect._stats?.duplicateSource?.endsWith(".ActiveEffect."+nativeEffect)||effect.name==="Stinking Poison");
 });
 return sourced;
}
export function prepareStinkingCloudEffect(effect) {
 if(!isStinkingCloudEffect(effect))return;
 effect.updateSource({"duration.value":null,"duration.expiry":"targetEnd","duration.expired":false});
}
export async function endStinkingCloudTurn(combat,changes) {
 if(!game.user?.isGM||(game.users?.activeGM&&game.users.activeGM.id!==game.user.id)||
  !(Object.hasOwn(changes,"turn")||Object.hasOwn(changes,"round"))||combat.started===false)return;
 const previous=combat.previous;
 if(!previous?.combatantId||(previous.round===combat.round&&previous.turn===combat.turn))return;
 // Native targetEnd skips the application turn. This spell explicitly ends on
 // that same turn; inspect only the outgoing combatant, never every world actor.
 const actor=combat.combatants.get(previous.combatantId)?.actor;
 for(const effect of Array.from(actor?.effects??[])){
  if(effect.duration?.expiry==="targetEnd"&&isStinkingCloudEffect(effect))await effect.delete();
 }
}
Hooks.once("ready",()=>{
 Hooks.on("preCreateActiveEffect",prepareStinkingCloudEffect);
 Hooks.on("updateCombat",(combat,changes)=>{endStinkingCloudTurn(combat,changes).catch(error=>console.error("Stinking Cloud turn-end cleanup",error));});
});
