const ID="ugmuls-5-5e-automation",queues=new Map();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"mistyWandererAutomation")===true;
const actorFor=item=>item?.actor??(item?.parent?.documentName==="Actor"?item.parent:null);
const authority=actor=>game.users.activeGM?game.user.id===game.users.activeGM.id:actor?.isOwner===true;
export const mistyWandererFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&(key(i)==="misty-wanderer"||/^misty wanderer$/i.test(i.name?.trim()??"")));
export const isMistyStep=item=>item?.type==="spell"&&(key(item)==="misty-step"||/^misty step$/i.test(item.name?.trim()??""));
export function buildWandererCast(spell,feature){
 const activities=values(spell.system?.activities),native=activities.find(a=>!flag(a,"mistyWandererCast")&&a.type==="utility"&&!a.isRider);
 if(!native)return null;
 const used=new Set(activities.map(a=>a.id));let id="rsaMistyWanderer";if(used.has(id))do{id=foundry.utils.randomID();}while(used.has(id));
 const data=native.toObject?native.toObject():structuredClone(native);data._id=id;data.name="Misty Wanderer";
 // Keep the spell's native activation, targeting, effects and teleport workflow.
 data.consumption={spellSlot:false,targets:[{type:"itemUses",target:feature.id,value:"1",scaling:{mode:""}}],scaling:{allowed:false}};
 data.uses={spent:0,max:"",recovery:[]};data.flags??={};
 if(data.flags.dnd5e)delete data.flags.dnd5e.dependentOn;
 data.flags[ID]={...data.flags[ID],mistyWandererCast:{feature:feature.uuid,source:native.id,revision:1}};
 data.sort=Math.max(0,...activities.map(a=>Number(a.sort)||0))+100000;
 return data;
}
export function syncMistyWanderer(actor){
 if(!actor?.uuid||!authority(actor))return Promise.resolve();
 const task=(queues.get(actor.uuid)??Promise.resolve()).catch(()=>{}).then(async()=>{
  if(!authority(actor))return;
  const feature=enabled()?mistyWandererFeature(actor):null;
  for(const spell of values(actor.items).filter(i=>isMistyStep(i)||values(i.system?.activities).some(a=>flag(a,"mistyWandererCast")))){
   const managed=values(spell.system?.activities).filter(a=>flag(a,"mistyWandererCast")),updates={};
   if(!feature||!isMistyStep(spell)){for(const activity of managed)updates[`system.activities.-=${activity.id}`]=null;}
   else if(!managed.length){const data=buildWandererCast(spell,feature);if(data)updates[`system.activities.${data._id}`]=data;}
   else{
    const activity=managed[0],record=flag(activity,"mistyWandererCast"),targets=values(activity.consumption?.targets);
    const linked=activity.consumption?.spellSlot===false&&targets.length===1&&targets[0].type==="itemUses"&&targets[0].target===feature.id&&String(targets[0].value)==="1";
    if(!linked)updates[`system.activities.${activity.id}.consumption`]={spellSlot:false,targets:[{type:"itemUses",target:feature.id,value:"1",scaling:{mode:""}}],scaling:{allowed:false}};
    if(record.feature!==feature.uuid)updates[`system.activities.${activity.id}.flags.${ID}.mistyWandererCast`]={...record,feature:feature.uuid};
    for(const duplicate of managed.slice(1))updates[`system.activities.-=${duplicate.id}`]=null;
   }
   if(Object.keys(updates).length)await spell.update(updates,{rsaMistyWandererSync:true});
  }
 });queues.set(actor.uuid,task);return task.finally(()=>{if(queues.get(actor.uuid)===task)queues.delete(actor.uuid);});
}
export async function syncAllMistyWanderers(){
 const actors=new Map([...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor))].filter(Boolean).map(a=>[a.uuid,a]));
 for(const actor of actors.values())if(mistyWandererFeature(actor)||values(actor.items).some(i=>isMistyStep(i)&&values(i.system?.activities).some(a=>flag(a,"mistyWandererCast"))))await syncMistyWanderer(actor);
}
export function guardWandererCast(activity,usage={},dialog={}){
 const record=flag(activity,"mistyWandererCast");if(!record)return;
 const actor=activity.actor??activity.item?.actor,feature=mistyWandererFeature(actor);
 if(!enabled()||!isMistyStep(activity.item)||!feature||record.feature!==feature.uuid){ui.notifications.warn("Misty Wanderer's free cast is no longer linked. Use Misty Step's normal cast or reopen the spell after its link updates.");return false;}
 // A free Misty Step remains a level-2 spell, but must not show or consume
 // an upcast slot. Keep the resource and Bonus Action controls native.
 usage.scaling=false;
 if(usage.consume!==false)usage.consume={...(usage.consume??{}),spellSlot:false};
 dialog.options??={};dialog.options.display={...dialog.options.display,scaling:false};
 // Availability and spending are native itemUses consumption. This preserves
 // cancellation, long-rest recovery, GM/player parity and spell automation.
}
function report(error){console.error("Misty Wanderer",error);ui.notifications.error("Could not link Misty Wanderer to Misty Step: "+error.message);}
Hooks.once("init",()=>game.settings.register(ID,"mistyWandererAutomation",{name:"Misty Wanderer: Misty Step Free Cast",hint:"When a character owns Misty Wanderer and Misty Step, add a native Misty Wanderer cast activity to the spell. Spend one feature use, no spell slot; retain normal casting and leave companion teleporting manual.",scope:"world",config:true,type:Boolean,default:true,onChange:()=>syncAllMistyWanderers().catch(report)}));
Hooks.once("ready",()=>{
 syncAllMistyWanderers().catch(report);
 for(const event of ["createItem","deleteItem"])Hooks.on(event,item=>{if(isMistyStep(item)||key(item)==="misty-wanderer"||/^misty wanderer$/i.test(item.name?.trim()??""))syncMistyWanderer(actorFor(item)).catch(report);});
 Hooks.on("updateItem",(item,changes,options)=>{
  if(options?.rsaMistyWandererSync||!(isMistyStep(item)||key(item)==="misty-wanderer"||values(item.system?.activities).some(a=>flag(a,"mistyWandererCast"))))return;
  const relevant=changes.name!==undefined||changes.system?.identifier!==undefined||changes.system?.activities!==undefined||Object.keys(changes).some(k=>k==="system.identifier"||k.startsWith("system.activities."));
  if(relevant)syncMistyWanderer(actorFor(item)).catch(report);
 });
 Hooks.on("createActor",actor=>syncMistyWanderer(actor).catch(report));
 Hooks.on("createToken",token=>syncMistyWanderer(token.actor).catch(report));
 Hooks.on("dnd5e.preUseActivity",guardWandererCast);
});
