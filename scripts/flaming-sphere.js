import {getRegionSpellTable} from "./region-library.js";
const ID="ugmuls-5-5e-automation",pending=new Set();
const authority=()=>game.user?.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const identifier=item=>item?.identifier??item?.system?.identifier;
export function prepareFlamingSphere(activity,profile,data){
 if(activity?.type!=="summon"||identifier(activity.item)!=="flaming-sphere"||getRegionSpellTable()[activity.item.name]?.enabled===false)return;
 const effects=Array.from(activity.actor?.concentration?.effects??[]);
 const concentration=effects.find(effect=>{const item=effect.getFlag?.("dnd5e","item");return item?.uuid===activity.item.uuid||item?.id===activity.item.id;});
 const level=Number(activity.getRollData?.().item?.level??activity.item.system.level);
 data.flags??={};data.flags[ID]??={};
 data.flags[ID].flamingSphere={item:activity.item.uuid,activity:activity.uuid,level,origin:activity.getUsageToken?.()?.uuid,concentration:concentration?.uuid};
}
export async function createFlamingSphereRegion(token,options={},userId){
 const link=token.flags?.[ID]?.flamingSphere,scene=token.parent;
 if(!authority()||!link?.item||!scene||pending.has(token.uuid))return;
 if(Array.from(scene.regions??[]).some(region=>region.flags?.[ID]?.flamingSphereToken===token.uuid))return;
 pending.add(token.uuid);
 try{
  const spell=await fromUuid(link.item),creator=game.users.get(userId);
  if(identifier(spell)!=="flaming-sphere"||getRegionSpellTable()[spell.name]?.enabled===false||!creator?.active||
   !creator.isGM&&!spell.actor?.testUserPermission(creator,"OWNER"))return;
  if(scene.tokens.get(token.id)!==token)return;
  if(link.concentration&&!await fromUuid(link.concentration))return;
  const save=Array.from(spell.system.activities??[]).find(activity=>activity.id==="dnd5eactivity100"&&activity.type==="save");
  if(!save)throw Error("Flaming Sphere needs its native save activity.");
  const scale=scene.grid.size/scene.grid.distance;
  if(!Number.isFinite(scale)||scale<=0)throw Error("Flaming Sphere needs a scene grid distance.");
  const levels=Array.from(token.levels??[]);if(!levels.length&&canvas.scene===scene&&canvas.level?.id)levels.push(canvas.level.id);
  await scene.createEmbeddedDocuments("Region",[{
   name:spell.name+" - Emanation",color:creator.color,
   shapes:[{type:"emanation",gridBased:true,radius:5*scale,base:{type:"token",x:token.x,y:token.y,width:token.width,height:token.height,shape:token.shape,rotation:0}}],
   attachment:{token:token.id},...(levels.length?{levels}:{}),restriction:{enabled:true,type:"move"},
   visibility:CONST.REGION_VISIBILITY.ALWAYS,highlightMode:"coverage",
   flags:{dnd5e:{item:spell.uuid,activity:save.uuid,origin:link.origin,spellLevel:Number(link.level)||spell.system.level},
    [ID]:{flamingSphereToken:token.uuid,excludedToken:token.uuid,casterUserId:creator.id}}
  }]);
 }finally{pending.delete(token.uuid);}
}
export async function deleteFlamingSphereRegion(token){
 if(!authority())return;
 const scene=token.parent,ids=Array.from(scene?.regions??[]).filter(region=>region.flags?.[ID]?.flamingSphereToken===token.uuid&&region.attachment?.token!==token.id).map(region=>region.id);
 if(ids.length)await scene.deleteEmbeddedDocuments("Region",ids);
}
function report(error){console.error("Flaming Sphere Emanation",error);ui.notifications.error("Flaming Sphere's Emanation could not be configured. Check the console.");}
Hooks.once("ready",()=>{
 // The casting client stamps native summon token data; the active GM receives
 // token creation even for player summons and owns Region/behavior creation.
 Hooks.on("dnd5e.summonToken",prepareFlamingSphere);
 Hooks.on("createToken",(token,options,userId)=>{createFlamingSphereRegion(token,options,userId).catch(report);});
 // Native token attachment cleanup exclusively deletes attached Regions.
});
