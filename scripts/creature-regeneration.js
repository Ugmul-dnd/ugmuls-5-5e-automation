const ID="ugmuls-5-5e-automation",running=new Set();
const values=value=>Array.from(value?.values?.()??value??[]);
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function creatureRegeneration(actor){
 const hp=actor?.system?.attributes?.hp,max=hp?.effectiveMax??(Number(hp?.max)+Number(hp?.tempmax??0));
 if(!Number.isFinite(hp?.value)||hp.value<1||Number.isFinite(max)&&hp.value>=max||actor.statuses?.has("dead"))return null;
 for(const feature of values(actor.items)){
  if(feature.type!=="feat"||!((feature.identifier??feature.system?.identifier)==="regeneration"||/^regeneration$/i.test(feature.name??"")))continue;
  // Conditional damage/sunlight suppression requires its own tracking; don't silently heal past those clauses.
  const text=(feature.system?.description?.value??"").replace(/<[^>]*>/g," ");
  if(/doesn[’']t function|does not function|doesn[’']t regenerate|does not regenerate|sunlight|running water/i.test(text))continue;
  const effects=values(feature.effects).filter(e=>e.transfer!==false);
  if(effects.length&&effects.every(e=>e.disabled||e.isSuppressed||e.active===false))continue;
  const activity=values(feature.system?.activities).find(a=>a.type==="heal"&&(a.target?.affects?.type==="self"||a.range?.units==="self")&&(a.activation?.type==="turnStart"||/start.{0,30}turn/i.test(a.activation?.condition||text)));
  if(activity)return {feature,activity};
 }
 return null;
}
export async function triggerRegeneration(combat,changes={}){
 if(!authority()||game.settings.get(ID,"regenerationAutomation")!==true||!combat?.started||!combat.combatant||!("round"in changes||"turn"in changes||changes.started===true))return;
 const current=combat.combatant,actor=current.actor,token=current.token;
 if(!actor||!token||current.defeated)return;
 const stamp=[combat.id,combat.round,combat.turn,current.id].join(":"),lock=actor.uuid;
 if(running.has(lock)||actor.getFlag(ID,"regenerationTurn")===stamp)return;
 const rally=creatureRegeneration(actor);if(!rally)return;
 running.add(lock);let created=false;
 try{
  await actor.setFlag(ID,"regenerationTurn",stamp);
  const descriptor={token:token.uuid,actor:actor.uuid,name:token.name??actor.name,img:token.texture?.src??actor.img};
  const flags={[ID]:{riderTriggered:true,regenerationHealing:{actor:actor.uuid,stamp}}};
  const result=await rally.activity.use({consume:false,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:[descriptor]},flags}});
  if(!result?.message)throw Error("Regeneration could not create its healing card.");
  created=true;
  const healingData={system:{origin:result.message.id,targets:[descriptor]},flags};
  if(globalThis.Ugmuls55eAutomationHealing)await globalThis.Ugmuls55eAutomationHealing.roll(rally.activity,result.message,healingData);
  else await rally.activity.rollDamage({isCritical:false},{configure:false},{data:healingData});
 }catch(error){
  // Keep the turn claimed after card creation; a failed roll can be retried
  // from that card without producing a second automatic healing benefit.
  if(!created&&actor.getFlag(ID,"regenerationTurn")===stamp)await actor.unsetFlag(ID,"regenerationTurn");
  throw error;
 }finally{running.delete(lock);}
}
Hooks.once("init",()=>game.settings.register(ID,"regenerationAutomation",{name:"Creature Regeneration",hint:"At turn start, use the creature’s native Regeneration healing activity when injured with at least 1 HP. Uses normal healing prompts and application settings. Traits with damage or environmental suppression remain manual.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>Hooks.on("updateCombat",(combat,changes)=>{triggerRegeneration(combat,changes).catch(error=>{console.error("Creature Regeneration",error);ui.notifications.error(error.message);});}));
