import {getRegionSpellTable} from "./region-library.js";
import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",pending=new Set(),enqueue=createEventQueue();
const authority=()=>game.user?.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const identifier=item=>item?.identifier??item?.system?.identifier;
const enabled=()=>getRegionSpellTable()["Guarded Area"]?.enabled!==false;
export function prepareGuardian(activity,profile,data){
 if(activity?.type!=="summon"||identifier(activity.item)!=="guardian-of-faith"||!enabled())return;
 data.flags??={};data.flags[ID]??={};data.flags[ID].guardian={spell:activity.item.uuid,userId:game.user.id};
}
export function guardianFeature(token){return Array.from(token?.actor?.items??[]).find(item=>identifier(item)==="guarded-area");}
export async function createGuardianRegion(token,options={},userId){
 const link=token.flags?.[ID]?.guardian,scene=token.parent;
 if(!authority()||!link?.spell||!scene||!enabled()||pending.has(token.uuid))return;
 if(Array.from(scene.regions??[]).some(region=>region.flags?.[ID]?.guardianToken===token.uuid))return;
 pending.add(token.uuid);
 try{
  const spell=await fromUuid(link.spell),creator=game.users.get(userId),feature=guardianFeature(token);
  if(identifier(spell)!=="guardian-of-faith"||!creator?.active||!creator.isGM&&!spell.actor?.testUserPermission(creator,"OWNER"))return;
  if(scene.tokens.get(token.id)!==token||!feature)return;
  const save=Array.from(feature.system.activities??[]).find(a=>a.type==="save");
  if(!save)throw Error("Guarded Area needs its native save activity.");
  const scale=scene.grid.size/scene.grid.distance;if(!Number.isFinite(scale)||scale<=0)throw Error("Guardian needs a scene grid distance.");
  const levels=Array.from(token.levels??[]);if(!levels.length&&canvas.scene===scene&&canvas.level?.id)levels.push(canvas.level.id);
  await scene.createEmbeddedDocuments("Region",[{
   name:"Guardian of Faith - Emanation",color:creator.color,
   shapes:[{type:"emanation",gridBased:true,radius:10*scale,base:{type:"token",x:token.x,y:token.y,width:token.width,height:token.height,shape:token.shape,rotation:0}}],
   attachment:{token:token.id},...(levels.length?{levels}:{}),restriction:{enabled:true,type:"move"},visibility:CONST.REGION_VISIBILITY.ALWAYS,highlightMode:"coverage",
   flags:{dnd5e:{item:feature.uuid,activity:save.uuid,origin:token.uuid,spellLevel:Number(spell.system?.level)||4},[ID]:{guardianToken:token.uuid,excludedToken:token.uuid,casterUserId:link.userId??creator.id}}
  }]);
 }finally{pending.delete(token.uuid);}
}
export async function deleteGuardianRegion(token){
 if(!authority())return;
 const scene=token.parent,ids=Array.from(scene?.regions??[]).filter(region=>region.flags?.[ID]?.guardianToken===token.uuid&&region.attachment?.token!==token.id).map(region=>region.id);
 if(ids.length)await scene.deleteEmbeddedDocuments("Region",ids);
}
export function appliedGuardianDamage(card){
 return Array.from(card.getFlag(ID,"damageUndoHistory")??[]).reduce((total,record)=>total+(Number.isFinite(record.guardianDamageAmount)?Math.max(0,record.guardianDamageAmount):Array.from(record.changes??[])
  .filter(change=>["value","temp"].includes(change.key)).reduce((sum,change)=>sum+Math.max(0,Number(change.before)-Number(change.after)),0)),0);
}
export async function syncGuardianPool(card){
 if(!authority()||!enabled()||card?.type!=="damage")return;
 let state=card.getFlag(ID,"guardianBudget");
 const charged=appliedGuardianDamage(card);
 if(state&&charged===state.charged)return;
 let token=state?.token?await fromUuid(state.token,{strict:false}):null;
 if(!state){
  const feature=card.getAssociatedItem?.();token=feature?.actor?.token;
  if(identifier(feature)!=="guarded-area"||!token?.flags?.[ID]?.guardian)return;
  state={token:token.uuid,scene:token.parent.uuid,itemId:feature.id,charged:0};
 }
 const difference=charged-state.charged;
 if(!Number.isFinite(difference)||difference===0)return;
 // A depleted guardian can be restored by Undo, but a manually deleted token is
 // never recreated. Scene metadata lets Undo on any contributing card restore it.
 if(!token&&difference<0){
  const scene=await fromUuid(state.scene,{strict:false}),id=state.token.split(".").at(-1);
  const snapshot=scene?.getFlag(ID,"guardianExhausted."+id)??state.snapshot;
  if(!scene||!snapshot||scene.tokens.get(snapshot._id))return;
  [token]=await scene.createEmbeddedDocuments("Token",[structuredClone(snapshot)],{keepId:true});
  await scene.unsetFlag(ID,"guardianExhausted."+id);
  await createGuardianRegion(token,{},game.user.id);
 }
 const feature=guardianFeature(token);if(!feature)return;
 const max=Number(feature.system.uses.max)||60;
 const spent=Math.max(0,Number(feature.system.uses.spent??0)+difference);
 await feature.update({"system.uses.spent":spent});
 const updated={...state,charged};
 if(spent>=max){updated.snapshot=token.toObject();await token.parent.setFlag(ID,"guardianExhausted."+token.id,updated.snapshot);}
 await card.setFlag(ID,"guardianBudget",updated);
 if(spent>=max)await token.delete();
}
function report(error){console.error("Guardian of Faith automation",error);ui.notifications.error("Guardian automation could not finish. Check the pool and card before retrying.");}
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.summonToken",prepareGuardian);
 Hooks.on("createToken",(token,options,userId)=>{createGuardianRegion(token,options,userId).catch(report);});
 // Native token attachment cleanup exclusively deletes attached Regions.
 Hooks.on("updateChatMessage",(card,changes)=>{
  if(card.type!=="damage"||!Object.keys(changes).some(key=>key==="flags"||key.startsWith("flags.")))return;
  enqueue(()=>syncGuardianPool(card)).catch(report);
 });
});
