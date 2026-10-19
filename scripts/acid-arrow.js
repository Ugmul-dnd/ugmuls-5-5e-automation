const ID="ugmuls-5-5e-automation";
export function acidArrowAttack(activity){return activity?.type==="attack"&&(activity.item?.identifier??activity.item?.system?.identifier)==="melfs-acid-arrow";}
export function acidArrowFactor(message,token){
 if(!acidArrowAttack(message?.getAssociatedActivity?.()))return null;
 const id=message.getFlag?.(ID,"damageAttackId"),ref=message.system?.origin;
 const origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 const attack=id?game.messages.get(id):origin?.type==="attack"?origin:Array.from(origin?.getAssociatedRolls?.("attack")??[]).filter(card=>card.timestamp<=message.timestamp).sort((a,b)=>b.timestamp-a.timestamp)[0];
 const target=attack?.system?.evaluatedTargets?.find(target=>target.token===token);
 return target?.isMiss===true?0.5:target?.isMiss===false?1:null;
}
export function installAcidArrowDamage(Type=customElements.get("damage-application")){
 const prototype=Type?.prototype;if(!prototype?.getMergedOptions||prototype.rsaAcidArrowDamage)return;
 const getOptions=prototype.getMergedOptions,change=prototype._onChangeMultiplier,manual=new WeakSet();
 prototype.getMergedOptions=function(uuid){
  const options=getOptions.call(this,uuid),factor=acidArrowFactor(this.chatMessage,uuid);
  // Supply a native default, preserving resistance/immunity options and explicit GM multipliers.
  if(factor!==0.5||manual.has(this)||this.getTargetOptions?.(uuid)?.multiplier!=null)return options;
  return {...options,multiplier:factor};
 };
 if(change)prototype._onChangeMultiplier=function(event){if(event.target.closest(".multiplier-button"))manual.add(this);return change.call(this,event);};
 prototype.rsaAcidArrowDamage=true;
}
Hooks.once("ready",()=>{globalThis.Ugmuls55eAutomationAcidArrow={allowsMiss:acidArrowAttack,factor:acidArrowFactor};installAcidArrowDamage();});
