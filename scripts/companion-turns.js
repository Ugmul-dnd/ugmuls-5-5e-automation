const ID="ugmuls-5-5e-automation",installed=new WeakSet(),recovered=new WeakMap();
const values=v=>Array.from(v?.values?.()??v??[]),resolve=ref=>typeof ref==="string"?globalThis.fromUuidSync?.(ref,{strict:false}):ref;
const key=i=>i?.identifier??i?.system?.identifier;
export function companionOwner(actor){
 const ref=actor?.getFlag?.(ID,"semblanceForm")?.companionOrigin??actor?.getFlag?.("dnd5e","summon.origin");
 const source=resolve(ref),item=source?.item??source;
 if(!item?.actor||item.actor.uuid===actor?.uuid)return null;
 const description=(item.system?.description?.value??"").replace(/<[^>]*>/g," ").replace(/\s+/g," ");
 if(!["steel-defender","vestige-companion"].includes(key(item))&&!/\b(?:acts|takes its turn) during your turn\b/i.test(description))return null;
 return item.actor;
}
export function effectiveCombatant(actor,combat=game.combat){
 if(!actor||!combat?.started)return null;
 const combatants=values(combat.combatants),direct=combatants.find(c=>c.actor?.uuid===actor.uuid);if(direct)return direct;
 const owner=companionOwner(actor);if(!owner)return null;
 const sceneId=typeof combat.scene==="string"?combat.scene:combat.scene?.id;
 if(sceneId&&actor.token?.parent?.id&&actor.token.parent.id!==sceneId)return null;
 return combatants.find(c=>c.actor?.uuid===owner.uuid)??null;
}
export function sharedTurnCompanions(combat,owner){
 const scene=typeof combat.scene==="string"?game.scenes.get(combat.scene):combat.scene;
 const actors=new Map();
 for(const token of scene?.tokens??[]){const actor=token.actor;if(!actor||actors.has(actor.uuid)||values(combat.combatants).some(c=>c.actor?.uuid===actor.uuid))continue;
  if(companionOwner(actor)?.uuid===owner?.uuid)actors.set(actor.uuid,{actor,token});
 }
 return values(actors);
}
export function turnActors(combat){
 const actors=new Map(values(combat.combatants).filter(c=>c.actor).map(c=>[c.actor.uuid,c.actor]));
 const owners=new Set(actors.keys()),scene=typeof combat.scene==="string"?game.scenes.get(combat.scene):combat.scene;
 for(const token of scene?.tokens??[]){const actor=token.actor;if(actor&&!actors.has(actor.uuid)&&owners.has(companionOwner(actor)?.uuid))actors.set(actor.uuid,actor);}return values(actors);
}
export async function recoverCompanionTurn(combat,combatant,event){
 if(!game.user.isGM||game.users.activeGM&&game.users.activeGM.id!==game.user.id||!combat.started||!combatant?.actor||combatant.isDefeated)return;
 let stamps=recovered.get(combat);if(!stamps)recovered.set(combat,stamps=new Set());
 const edge=[combat.round,combat.turn,combatant.id,event].join(":");
 for(const {actor,token}of sharedTurnCompanions(combat,combatant.actor)){
  if(Number(actor.system?.attributes?.hp?.value)<=0)continue;
  const stamp=edge+":"+actor.uuid;if(stamps.has(stamp))continue;stamps.add(stamp);if(stamps.size>256)stamps.delete(stamps.values().next().value);
  // A disposable native Combatant runs system recovery without inserting a pet
  // into initiative or sharing the owner's resource pools.
  try{
   const proxy=new CONFIG.Combatant.documentClass({tokenId:token.id,sceneId:token.parent.id},{parent:combat});
   await proxy.recoverCombatUses(event==="turnStart"?["turn","turnStart"]:["turnEnd"]);
  }catch(error){console.error("Companion turn recovery",actor.uuid,error);}
  // A failed pet recovery must not stop other pets or native effect expiry.
 }
}
export function companionExpiry(effect,event,context={}){
 const expiry=effect.duration?.expiry,special=["sourceStart","sourceEnd","targetStart","targetEnd"].includes(expiry);
 if(!special&&!["turnStart","turnEnd"].includes(expiry))return null;
 const actor=special&&expiry.startsWith("source")?effect.getSourceActor?.():effect.actor;
 const combat=context.combat??game.combat;
 if(event==="updateWorldTime"&&companionOwner(effect.actor)&&effectiveCombatant(effect.actor,combat))return false;
 const owner=companionOwner(actor),edge=owner&&effectiveCombatant(actor,combat);
 if(!edge||edge.actor?.uuid===actor?.uuid)return null;
 if(event==="updateWorldTime")return false;
 const start=effect.start?.combat,combatId=typeof start==="string"?start:start?.id;
 if(combatId&&combatId!==combat.id)return false;
 const expected=special?(expiry.endsWith("Start")?"turnStart":"turnEnd"):expiry;if(event!==expected)return false;
 const matching=event==="turnStart"?combat.combatant?.id===edge.id:combat.previous?.combatantId===edge.id;
 if(!matching)return false;
 return !special||effect.start?.round!==context.round||effect.start?.turn!==context.turn;
}
export function installCompanionTiming(CombatType,EffectType){
 const cp=CombatType?.prototype;if(cp&&!installed.has(cp)){installed.add(cp);for(const [method,event]of [["_onStartTurn","turnStart"],["_onEndTurn","turnEnd"]]){const prior=cp[method];if(!prior)continue;cp[method]=async function(combatant,...args){const result=await prior.call(this,combatant,...args);await recoverCompanionTurn(this,combatant,event);return result;};}}
 const ep=EffectType?.prototype;if(ep?.isExpiryEvent&&!installed.has(ep)){installed.add(ep);const prior=ep.isExpiryEvent;ep.isExpiryEvent=function(event,context){return companionExpiry(this,event,context)??prior.call(this,event,context);};}
}
Hooks.once("init",()=>installCompanionTiming(CONFIG.Combat?.documentClass,CONFIG.ActiveEffect?.documentClass));

globalThis.Ugmuls55eAutomationCompanions={effectiveCombatant,companionOwner,turnActors};
