import {getRegionSpellTable} from "./region-library.js";
const ID="ugmuls-5-5e-automation",waiting=new Map();
const isRegal=activity=>(activity?.item?.identifier??activity?.item?.system?.identifier)==="yolandes-regal-presence"&&getRegionSpellTable()[activity.item.name]?.enabled!==false;
export function prepareRegalAura(activity,usage){
 if(!isRegal(activity)||activity.id!=="OJHRKWz8JvLzyl9R"||!activity.target?.template?.type)return;
 usage.create??={};usage.create.measuredTemplate=true;
}
export function excludeRegalCaster(region){
 const item=region.flags?.dnd5e?.item?fromUuidSync(region.flags.dnd5e.item,{strict:false}):null;
 if((item?.identifier??item?.system?.identifier)!=="yolandes-regal-presence"||getRegionSpellTable()[item.name]?.enabled===false)return;
 if(region.flags?.dnd5e?.origin)region.updateSource({["flags."+ID+".excludedToken"]:region.flags.dnd5e.origin});
}
export async function triggerInitialRegal(activity,usage,results){
 if(!isRegal(activity)||activity.id!=="OJHRKWz8JvLzyl9R")return;
 const card=results?.message;
 if(card?.getFlag?.(ID,"targetsConfirmationCanceled"))return;
 if(card?.getFlag?.(ID,"targetsConfirmationPending")){waiting.set(card.id,{activity,usage,results});return;}
 waiting.delete(card?.id);
 // Surround Self is placement, not a save. Native initial tokenEnter attachment
 // is deferred, so explicitly hand the initial occupants to the same limiter.
 for(const region of results?.templates??[])for(const token of Array.from(region.tokens??[])){
  if(token.uuid===region.flags?.dnd5e?.origin)continue;
  await globalThis.Ugmuls55eAutomation?.handleRegionEvent({region,scene:region.parent,triggerId:"regalPresence01",event:{name:"tokenEnter",data:{token}}});
 }
}
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.preUseActivity",prepareRegalAura);
 Hooks.on("preCreateRegion",excludeRegalCaster);
 Hooks.on("deleteChatMessage",card=>waiting.delete(card.id));
 Hooks.on("ugmuls55eAutomation.targetsConfirmed",card=>{
  const pending=waiting.get(card.id);if(pending)triggerInitialRegal(pending.activity,pending.usage,pending.results).catch(error=>console.error("Regal Presence initial aura",error));
 });
 Hooks.on("dnd5e.postUseActivity",(activity,usage,results)=>{triggerInitialRegal(activity,usage,results).catch(error=>console.error("Regal Presence initial aura",error));});
});
