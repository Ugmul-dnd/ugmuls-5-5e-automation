const ID="ugmuls-5-5e-automation",running=new Set();
const values=value=>Array.from(value?.values?.()??value??[]);
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function survivorRally(actor){
 const hp=actor?.system?.attributes?.hp,max=hp?.effectiveMax??(Number(hp?.max)+Number(hp?.tempmax??0));
 if(!Number.isFinite(hp?.value)||!Number.isFinite(max)||max<=0||hp.value<1||hp.value>max/2||actor.statuses?.has("dead"))return null;
 const feature=values(actor.items).find(item=>item.type==="feat"&&(item.identifier??item.system?.identifier)==="survivor"&&!["2014","legacy"].includes(item.system?.source?.rules));
 if(!feature)return null;
 // The native Survivor passive effect remains the player's on/off control.
 const effects=values(feature.effects).filter(effect=>effect.transfer!==false);
 if(effects.length&&effects.every(effect=>effect.disabled||effect.isSuppressed||effect.active===false))return null;
 const activity=values(feature.system?.activities).find(activity=>activity.type==="heal"&&(activity.id==="5Fo0QwzexIPyLP3W"||activity.name==="Heroic Rally"));
 return activity?{feature,activity}:null;
}
export async function triggerSurvivor(combat,changes={}){
 if(!authority()||game.settings.get(ID,"survivorAutomation")!==true||!combat?.started||!combat.combatant||!("round"in changes||"turn"in changes||changes.started===true))return;
 const current=combat.combatant,actor=current.actor,token=current.token;
 if(!actor||!token||current.defeated)return;
 const stamp=[combat.id,combat.round,combat.turn,current.id].join(":"),lock=actor.uuid;
 if(running.has(lock)||actor.getFlag(ID,"survivorTurn")===stamp)return;
 const rally=survivorRally(actor);if(!rally)return;
 running.add(lock);let created=false;
 try{
  await actor.setFlag(ID,"survivorTurn",stamp);
  const descriptor={token:token.uuid,actor:actor.uuid,name:token.name??actor.name,img:token.texture?.src??actor.img};
  const flags={[ID]:{riderTriggered:true,survivorRally:{actor:actor.uuid,stamp}}};
  const result=await rally.activity.use({consume:false,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:[descriptor]},flags}});
  if(!result?.message)throw Error("Heroic Rally could not create its healing card.");
  created=true;
  const healingData={system:{origin:result.message.id,targets:[descriptor]},flags};
  if(globalThis.Ugmuls55eAutomationHealing)await globalThis.Ugmuls55eAutomationHealing.roll(rally.activity,result.message,healingData);
  else await rally.activity.rollDamage({isCritical:false},{configure:false},{data:healingData});
 }catch(error){
  // Keep the turn claimed after card creation; a failed roll can be retried
  // from that card without producing a second automatic healing benefit.
  if(!created&&actor.getFlag(ID,"survivorTurn")===stamp)await actor.unsetFlag(ID,"survivorTurn");
  throw error;
 }finally{running.delete(lock);}
}
Hooks.once("init",()=>game.settings.register(ID,"survivorAutomation",{name:"Survivor — Heroic Rally",hint:"At turn start, create Survivor's native healing card when Bloodied with at least 1 HP. Restore 5 + Constitution modifier using the normal healing application settings. Disable the native Survivor effect to pause. Does not automate Heroic Warrior or change death saves.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>Hooks.on("updateCombat",(combat,changes)=>{triggerSurvivor(combat,changes).catch(error=>{console.error("Survivor — Heroic Rally",error);ui.notifications.error(error.message);});}));
