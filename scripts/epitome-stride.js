import {epitomeActive,epitomeEnabled,epitomeFeature,epitomeStamp,values,key,flag} from "./elemental-epitome.js";
import {appendSharedTarget,createEventQueue,describeTarget,isEligibleTarget} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),prompted=new Set();
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const STRIDE="dgweOd8lDt6TRI0e";
export function strideStep(activity){return activity?.type==="utility"&&key(activity.item)==="monks-focus"&&(activity.id==="0MuRZ0Ur95xQTKFq"||activity.name==="Step of the Wind");}
export function buildStrideDamage(item){
 const data=item.toObject(),native=values(item.system?.activities).find(a=>a.id===STRIDE||a.name==="Destructive Stride"),id=native?.id,use=data.system.activities[id];if(!use?.damage?.parts?.length)throw Error("Elemental Epitome needs its native Destructive Stride damage activity.");
 data._id=foundry.utils.randomID();data.name="Destructive Stride";data.effects=[];data.system.activities={[id]:use};
 data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};if(use.flags?.dnd5e)delete use.flags.dnd5e.dependentOn;
 use.activation={type:"special",override:true};use.effects=[];use.appliedEffects=[];use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.duration={units:"inst",concentration:false,override:true};use.range={override:true,units:"any"};use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"",choice:false}};use.damage.critical={allow:false};
 data.system.description={value:"<p>Destructive Stride: choose Acid, Cold, Fire, Lightning or Thunder damage. Eligible enemies encountered by the aura share this turn’s roll, once per creature. Remove any recipients you do not wish to damage.</p>",chat:""};
 return {data,id};
}
export function strideEnemy(source,target){return source?.actor&&target?.actor&&source.uuid!==target.uuid&&source.actor.uuid!==target.actor.uuid&&isEligibleTarget(target)&&typeof source.disposition==="number"&&typeof target.disposition==="number"&&source.disposition*target.disposition<0;}
export async function startStride(activity,usage,results){
 const card=results?.message;if(!authority()||!strideStep(activity)||!card?.id||!epitomeActive(activity.actor??activity.item.actor))return;
 return enqueue(async()=>{
  if(flag(card,"epitomeStrideStarted"))return;
  const actor=activity.actor??activity.item.actor,feature=epitomeFeature(actor),used=card.getAssociatedToken?.()??activity.getUsageToken?.(),token=used?.document??used,scene=token?.parent;
  if(!token?.actor||token.actor.uuid!==actor.uuid||!scene||!epitomeActive(actor))return;
  const stamp=epitomeStamp(),old=values(scene.regions).find(r=>flag(r,"epitomeStride")?.token===token.uuid&&flag(r,"epitomeStride")?.stamp===stamp);
  if(old){await card.setFlag(ID,"epitomeStrideStarted",old.uuid);return;}
  const scale=scene.grid.size/scene.grid.distance;if(!Number.isFinite(scale)||scale<=0)throw Error("Destructive Stride needs a scene grid distance.");
  const levels=values(token.levels);if(!levels.length&&globalThis.canvas?.scene===scene&&canvas.level?.id)levels.push(canvas.level.id);
  const link={actor:actor.uuid,item:feature.uuid,token:token.uuid,usage:card.id,stamp,expires:Number(game.time?.worldTime??0)+6};
  const [region]=await scene.createEmbeddedDocuments("Region",[{name:actor.name+" — Destructive Stride",color:card.author?.color??game.user.color,shapes:[{type:"emanation",gridBased:true,radius:5*scale,base:{type:"token",x:token.x,y:token.y,width:token.width,height:token.height,shape:token.shape,rotation:0}}],attachment:{token:token.id},...(levels.length?{levels}:{}),restriction:{enabled:true,type:"move"},visibility:CONST.REGION_VISIBILITY.LAYER_UNLOCKED,highlightMode:"coverage",flags:{[ID]:{epitomeStride:link}}}]);
  if(!region)throw Error("Destructive Stride could not create its aura.");
  try{
   // As with spell regions, attach entry events after creation. Merely creating
   // the aura does not deal damage to creatures already standing beside the Monk.
   const [behavior]=await region.createEmbeddedDocuments("RegionBehavior",[{name:"Destructive Stride entry",type:"executeScript",system:{events:[],source:"await globalThis.Ugmuls55eAutomationStride.handle({event,region});"}}]);
   await region.updateEmbeddedDocuments("RegionBehavior",[{_id:behavior.id,"system.events":["tokenEnter"]}]);
   const data={name:"Destructive Stride — Speed",img:feature.img,type:"base",disabled:false,transfer:false,origin:actor.uuid,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:null,units:"seconds",expiry:null,expired:false},system:{changes:[{key:"system.attributes.movement.speed",value:"20",type:"add"}],origin:{actor:actor.uuid,item:feature.uuid,message:card.uuid}},flags:{dnd5e:{isTemporary:true},[ID]:{epitomeStrideSpeed:region.uuid}}};
   await actor.createEmbeddedDocuments("ActiveEffect",[data]);await card.setFlag(ID,"epitomeStrideStarted",region.uuid);
  }catch(error){await region.delete();throw error;}
 });
}
export function handleStride({event,region}){return enqueue(async()=>{
 if(!authority()||!epitomeEnabled()||event?.name!=="tokenEnter")return;
 const link=flag(region,"epitomeStride"),source=link&&await fromUuid(link.token),target=event.data?.token;
 if(!source||!epitomeActive(source.actor)||link.stamp!==epitomeStamp()||!strideEnemy(source,target))return;
 if(!values(region.parent?.regions).some(r=>r.id===region.id))return;
 const seen=flag(region,"epitomeStrideTargets")??[];if(seen.includes(target.uuid))return;
 const existing=game.messages.get(flag(region,"epitomeStrideCard"));
 if(existing){await appendSharedTarget(existing,describeTarget(target));}
 else{
  const feature=epitomeFeature(source.actor),{data,id}=buildStrideDamage(feature),helper=new CONFIG.Item.documentClass(data,{parent:source.actor});helper.prepareFinalAttributes?.();
  const flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,regionTriggered:true,sharedCardPerTurn:true,activityOverrideData:data,epitomeStrideDamage:region.uuid}};
  const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,concentration:{begin:false},create:{measuredTemplate:false}},{configure:false},{data:{system:{targets:[describeTarget(target)]},flags}});
  if(!result?.message)throw Error("Destructive Stride could not create its damage card.");await region.setFlag(ID,"epitomeStrideCard",result.message.id);
 }
 await region.setFlag(ID,"epitomeStrideTargets",[...seen,target.uuid]);
});}
export async function promptStrideDamage(card){
 if(card?.type!=="usage"||!flag(card,"epitomeStrideDamage")||prompted.has(card.id))return;
 const activity=card.getAssociatedActivity?.({scaled:true});if(!activity)return;
 // The shared prompt service routes the dialogue to a connected actor owner,
 // even though the GM owns RegionBehavior scripts and the usage card.
 await globalThis.Ugmuls55eAutomationDamage?.promptDamage(activity,card,"damage");
 // The service owns its duplicate guard; retain manual Damage after cancellation.
 prompted.add(card.id);
}
export function strideTargetNames(card){
 if(card?.type!=="usage"||!flag(card,"epitomeStrideDamage")||card.isContentVisible===false)return null;
 const seen=new Set(),names=[];
 for(const target of card.system?.targets??[]){
  const ref=target.token??target.actor;if(!ref||seen.has(ref))continue;seen.add(ref);
  const token=target.token?globalThis.fromUuidSync?.(target.token,{strict:false}):null;
  if(!game.user.isGM&&token?.hidden===true)continue;
  names.push(target.name??token?.name??"Target");
 }return names;
}
export function renderStrideTargets(card,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 root.querySelectorAll(".rsa-stride-targets").forEach(node=>node.remove());
 const names=strideTargetNames(card);if(names===null)return;
 const section=document.createElement("section");section.className="rsa-stride-targets";section.style.marginTop="8px";
 const title=document.createElement("strong");title.textContent="Targets";section.append(title);
 const list=document.createElement("ul");list.className="pills unlist";
 for(const name of names){const pill=document.createElement("li");pill.className="pill target transparent";pill.textContent=name;list.append(pill);}
 if(!names.length){const empty=document.createElement("span");empty.textContent="No visible targets selected.";section.append(empty);}else section.append(list);
 (root.querySelector(".chat-card")??root).append(section);
}
async function clearSpeed(actor,region){const ids=values(actor?.effects).filter(e=>flag(e,"epitomeStrideSpeed")===region).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);}
export async function cleanupEpitome(actor=null,force=false){
 if(!authority())return;
 const actors=new Map();if(actor?.uuid)actors.set(actor.uuid,actor);
 if(!actor)for(const caster of [...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor))])if(caster&&values(caster.effects).some(e=>flag(e,"epitomeStrideSpeed")||flag(e,"epitomeResistance")))actors.set(caster.uuid,caster);
 for(const scene of values(game.scenes))for(const region of values(scene.regions)){
  const link=flag(region,"epitomeStride");if(!link||actor&&link.actor!==actor.uuid)continue;
  const source=await fromUuid(link.token),caster=source?.actor;if(caster)actors.set(caster.uuid,caster);
  const expired=force||!source||!epitomeActive(caster)||link.stamp!==epitomeStamp()||!link.stamp&&Number(game.time?.worldTime??0)>=link.expires;
  if(expired){if(values(scene.regions).some(r=>r.id===region.id))await region.delete();await clearSpeed(caster,region.uuid);}
 }
 for(const caster of actors.values()){
  const ids=values(caster.effects).filter(e=>flag(e,"epitomeStrideSpeed")&&!values(game.scenes).some(s=>values(s.regions).some(r=>r.uuid===flag(e,"epitomeStrideSpeed")))||flag(e,"epitomeResistance")&&!epitomeActive(caster)).map(e=>e.id);
  if(ids.length)await caster.deleteEmbeddedDocuments("ActiveEffect",ids);
 }
}
function effectActor(doc){const parent=doc?.parent;return doc?.actor??(parent?.documentName==="Actor"?parent:parent?.actor);}
function report(error){console.error("Elemental Epitome",error);ui.notifications.error(error.message);}
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationStride={handle:handleStride};
 Hooks.on("dnd5e.renderChatMessage",renderStrideTargets);
 Hooks.on("dnd5e.postUseActivity",(a,u,r)=>{startStride(a,u,r).catch(report);});
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{
  if(event==="createChatMessage"&&card.type==="usage"&&authority()){const activity=card.getAssociatedActivity?.();if(strideStep(activity))startStride(activity,{}, {message:card}).catch(report);}
  promptStrideDamage(card).catch(report);
 });
 for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect","updateItem","deleteItem","updateActor"])Hooks.on(event,doc=>{const actor=effectActor(doc)??(doc?.documentName==="Actor"?doc:null);if(actor&&(epitomeFeature(actor)||values(actor.effects).some(e=>flag(e,"epitomeResistance")||flag(e,"epitomeStrideSpeed"))))enqueue(()=>cleanupEpitome(actor)).catch(report);});
 Hooks.on("updateCombat",(c,d)=>{if("turn"in d||"round"in d||d.started===false)enqueue(()=>cleanupEpitome()).catch(report);});
 Hooks.on("deleteCombat",()=>enqueue(()=>cleanupEpitome(null,true)).catch(report));
 Hooks.on("updateWorldTime",()=>enqueue(()=>cleanupEpitome()).catch(report));
 Hooks.on("deleteRegion",r=>{if(authority()&&flag(r,"epitomeStride"))enqueue(async()=>{const actor=await fromUuid(flag(r,"epitomeStride").actor);await clearSpeed(actor,r.uuid);}).catch(report);});
 Hooks.on("canvasReady",()=>enqueue(()=>cleanupEpitome()).catch(report));
});
