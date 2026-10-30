const weapons=new Set(["dreadnaught-force-demolisher","thunder-pulse","lightning-launcher"]);
const installed=new WeakSet();
const ID="ugmuls-5-5e-automation";
const thunder=item=>item?.type==="weapon"&&(item.identifier??item.system?.identifier)==="thunder-pulse";
export function prepareThunderPulse(activity){
 if(!thunder(activity.item)||activity.type!=="attack")return;
 const effect=Array.from(activity.item.effects??[]).find(e=>e.id==="HzXl6XoPn0VqbCC7"||e.name==="Thunderous Disadvantage");
 if(!effect||activity.effects?.some(e=>e._id===effect.id||e.uuid===effect.uuid))return;
 // Match native AppliedEffectField's derived profile, including usage-card UUID.
 activity.effects??=[];activity.effects.push({_id:effect.id,level:{min:null,max:null},relativeUUID:'.ActiveEffect.'+effect.id,getEffect:()=>effect});
}
export function installThunderPulseEffects(Type){
 const p=Type?.prototype;if(!p?._prepareEffectData||installed.has(p))return;installed.add(p);const prepare=p._prepareEffectData;
 p._prepareEffectData=async function(source,...args){
  const operation=await prepare.call(this,source,...args),item=source?.parent;
  if(!thunder(item)||!item.actor||!["HzXl6XoPn0VqbCC7"].includes(source.id)&&source.name!=="Thunderous Disadvantage")return operation;
  operation.data.duration={value:null,units:"seconds",expiry:"sourceStart",expired:false};
  operation.data.start=CONFIG.ActiveEffect.documentClass.getEffectStart();
  operation.data.system??={};operation.data.system.origin={...operation.data.system.origin,actor:item.actor.uuid};
  operation.data.flags??={};operation.data.flags.dnd5e={...operation.data.flags.dnd5e,isTemporary:false};
  operation.data.flags[ID]={...operation.data.flags[ID],thunderPulseSource:item.actor.uuid};
  // Target-dependent disadvantage is evaluated by the shared goading rule.
  const changes=operation.data.system.changes??operation.data.changes;
  if(changes)operation.data.system.changes=changes.filter(c=>!["system.rolls.attack.mode","system.rolls.attack.roll.mode"].includes(c.key));
  return operation;
 };
}
export function installArmorerDamage(Type){
 const prototype=Type?.prototype;if(!prototype?._processDamagePart||installed.has(prototype))return;
 installed.add(prototype);const process=prototype._processDamagePart;
 const prepare=prototype.prepareFinalData;
 if(prepare)prototype.prepareFinalData=function(...args){
  prepareThunderPulse(this);
  // The native Perfected Force Demolisher omits Improved Arsenal's retained +1.
  // Correct derived data before native labels/rolls; preserve configured bonuses.
  if(this.item?.type==="weapon"&&(this.item.identifier??this.item.system?.identifier)==="dreadnaught-force-demolisher"
   &&this.id==="Fb0MvPjUG3B3BK8I"){
   if(!String(this.attack?.bonus??"").trim())this.attack.bonus="1";
   const part=this.damage?.parts?.[0];if(part&&!String(part.bonus??"").trim())part.bonus="1";
  }
  return prepare.apply(this,args);
 };
 prototype._processDamagePart=function(damage,config,data,index=0,options={}){
  const roll=process.call(this,damage,config,data,index,options);
  // Improved/Perfected book activities replace base damage. Native weapon @mod
  // insertion only handles base parts, so these otherwise lose Intelligence.
  if(roll&&index===0&&!damage.base&&this.damage?.includeBase===false&&this.item?.type==="weapon"
   &&weapons.has(this.item.identifier??this.item.system?.identifier)&&this.attack?.ability==="int"
   &&!roll.parts.some(part=>/@(?:mod\b|abilities\.int\.mod\b)/.test(part))){
   roll.parts.push("@mod");
  }
  return roll;
 };
}
Hooks.once("init",()=>installArmorerDamage(CONFIG.DND5E?.activityTypes?.attack?.documentClass));
export function thunderPulseExpiryRepair(effect){
const source=effect.getFlag?.(ID,"thunderPulseSource");
if(!source||effect.disabled||effect.duration?.expired||effect.getFlag?.("dnd5e","isTemporary")!==true)return null;
return {_id:effect.id,"flags.dnd5e.isTemporary":false,"duration.expiry":"sourceStart","system.origin.actor":source};
}
Hooks.once("ready",()=>{
installThunderPulseEffects(globalThis.customElements?.get?.("effect-application"));
if(!game.user.isGM||game.users.activeGM&&game.users.activeGM.id!==game.user.id)return;
const actors=new Map(Array.from(game.actors??[],actor=>[actor.uuid,actor]));
for(const token of globalThis.canvas?.scene?.tokens??[])if(token.actor)actors.set(token.actor.uuid,token.actor);
for(const actor of actors.values()){
 const updates=Array.from(actor.effects??[],thunderPulseExpiryRepair).filter(Boolean);
 if(updates.length)actor.updateEmbeddedDocuments("ActiveEffect",updates).catch(error=>console.error("Thunder Pulse expiry repair",error));
}
});
