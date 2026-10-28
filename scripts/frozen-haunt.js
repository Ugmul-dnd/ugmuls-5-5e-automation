import {createEventQueue,describeTarget,isEligibleTarget} from "./shared-activity-card.js";
import {selectSaveUser} from "./save-prompts.js";
const ID="ugmuls-5-5e-automation",SAVE="fmd3RftvhB8jMgI3",TRANSFORM="DSD6panmxvWFqSRp",PROFILE="PBjRN6COrgnkf6Of",BOOK="hofWiwFrozenHaun",enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"frozenHauntAuraAutomation")===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const live=e=>e&&!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
const stamp=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:"outside-combat";
const actorOf=doc=>doc?.documentName==="Actor"?doc:doc?.actor??(doc?.parent?.documentName==="Actor"?doc.parent:doc?.parent?.actor);
export function isFrozenHaunt(item){
 if(item?.type!=="feat")return false;
 const refs=[item._stats?.compendiumSource,item._stats?.duplicateSource,item.flags?.core?.sourceId].filter(Boolean);
 const activities=values(item.system?.activities);
 return refs.some(ref=>ref.endsWith("."+BOOK))||activities.some(a=>a.id===SAVE)&&activities.some(a=>a.id===TRANSFORM);
}
export const frozenHauntFeature=actor=>values(actor?.items).find(isFrozenHaunt);
export function frozenHauntState(actor,excluded=null,{ignoreAuraSetting=false}={}){
 const item=frozenHauntFeature(actor);if(!ignoreAuraSetting&&!enabled()||!item)return null;
 // Read the applied enchantment on the real owned item. Its registry can lag
 // create/delete hooks; the original disabled book profile is not activation.
 const enchantment=values(item.effects).find(e=>e.type==="enchantment"&&e.uuid!==excluded&&live(e)&&(e.getFlag?.("dnd5e","enchantmentProfile")??e.flags?.dnd5e?.enchantmentProfile)===PROFILE);
 return enchantment?{actor,item,enchantment}:null;
}
function originalToken(state){
 const ref=state.enchantment.system?.origin?.message;
 const card=ref?(globalThis.fromUuidSync?.(ref,{strict:false})??game.messages?.get(ref.replace(/^ChatMessage\./,""))):null;
 const token=card?.getAssociatedToken?.();return token?.document??token;
}
function sourceMatches(token,state){
 const source=originalToken(state);if(source?.actor?.uuid===state.actor.uuid)return source.uuid===token.uuid;
 const own=state.actor.token?.document??state.actor.token;if(own?.uuid)return own.uuid===token.uuid;
 return token.parent===(globalThis.canvas?.scene??game.scenes?.active)||values(token.parent?.regions).some(r=>flag(r,"frozenHauntAura")?.token===token.uuid&&flag(r,"frozenHauntAura")?.enchantment===state.enchantment.uuid);
}
export function frozenTarget(source,target){
 return !!source?.actor&&!!target?.actor&&source.uuid!==target.uuid&&source.actor.uuid!==target.actor.uuid&&isEligibleTarget(target)&&typeof source.disposition==="number"&&typeof target.disposition==="number"&&source.disposition*target.disposition<0;
}
export async function ensureFrozenRegion(token,state){
 const scene=token.parent,scale=Number(scene.grid?.size)/Number(scene.grid?.distance);if(!(scale>0))throw Error("Frozen Soul needs a scene grid distance.");
 const regions=values(scene.regions).filter(r=>flag(r,"frozenHauntAura")?.token===token.uuid),region=regions[0];
 const levels=values(token.levels);if(!levels.length&&token.level)levels.push(token.level.id??token.level);if(!levels.length&&globalThis.canvas?.scene===scene&&canvas.level?.id)levels.push(canvas.level.id);
 const feet=/^(m|meters?|metres?)$/i.test(String(scene.grid.units??"ft"))?15*0.3048:15;
 const link={token:token.uuid,actor:state.actor.uuid,item:state.item.uuid,enchantment:state.enchantment.uuid};
 const data={name:"Frozen Soul — "+token.name,color:game.user.color,shapes:[{type:"emanation",gridBased:true,radius:feet*scale,base:{type:"token",x:token.x,y:token.y,width:token.width,height:token.height,shape:token.shape,rotation:0}}],attachment:{token:token.id},levels,restriction:{enabled:true,type:"move"},visibility:CONST.REGION_VISIBILITY.LAYER_UNLOCKED,highlightMode:"coverage",flags:{[ID]:{frozenHauntAura:link}}};
 if(regions.length>1)await scene.deleteEmbeddedDocuments("Region",regions.slice(1).map(r=>r.id));
 if(!region)return (await scene.createEmbeddedDocuments("Region",[data]))[0];
 const old=values(region.shapes)[0],next=data.shapes[0];
 // Token attachment owns position. Never rebuild the aura on each step.
 const changed=region.name!==data.name||region.visibility!==data.visibility||(region.attachment?.token?.id??region.attachment?.token)!==token.id||old?.type!=="emanation"||old.gridBased!==true||Number(old.radius)!==next.radius||["width","height","shape"].some(k=>old.base?.[k]!==next.base[k])||JSON.stringify(values(region.levels).sort())!==JSON.stringify([...levels].sort())||flag(region,"frozenHauntAura")?.enchantment!==link.enchantment;
 if(changed)await region.update(data);return region;
}
export function frozenTargets(region,source){
 const levels=values(source.levels);
 return values(source.parent?.tokens).filter(t=>frozenTarget(source,t)&&(!levels.length||!values(t.levels).length||values(t.levels).some(l=>levels.includes(l)))&&t.testInsideRegion?.(region)===true);
}
export function buildFrozenDamage(item){
 const data=item.toObject(),use=data.system.activities[SAVE];if(use?.type!=="damage")throw Error("Frozen Haunt is missing its native Frozen Soul damage activity.");
 data.name="Frozen Soul";data.effects=[];data.system.activities={[SAVE]:use};data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};
 use.name="Frozen Soul";use.effects=[];use.appliedEffects=[];use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.duration={units:"inst",override:true,concentration:false};use.range={units:"any",override:true};use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",choice:false}};
 use.damage={critical:{allow:false},parts:[{number:2,denomination:4,bonus:"",types:["cold"],custom:{enabled:false}}]};
 use.flags??={};if(use.flags.dnd5e)delete use.flags.dnd5e.dependentOn;
 const quiet={version:5,isEnabled:false,isCustomized:false,killAnim:true};data.flags.autoanimations=quiet;use.flags.autoanimations=quiet;
 return {data,id:SAVE};
}
const opened=new Set();
export async function promptFrozenDamage(card,localActivity=null){
 const request=flag(card,"frozenSoulRoll");if(!request||request.user!==game.user.id||opened.has(card.id))return;
 const activity=localActivity??card.getAssociatedActivity?.({scaled:true});if(activity?.type!=="damage"||!activity.actor?.isOwner||activity.actor.uuid!==request.actor)return;
 if(values(card.getAssociatedRolls?.("damage")).some(c=>c.rolls?.length))return;
 opened.add(card.id);
 try{const dialog=globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("damage",{configure:true})??{configure:true};await activity.rollDamage({isCritical:false},dialog,{data:{speaker:card.speaker,system:{origin:card.id,targets:card.system.targets},flags:{[ID]:{riderTriggered:true,frozenSoulDamage:true}}}});}
 catch(error){opened.delete(card.id);throw error;}
}
async function pulseFrozen(token,state,region){
 const previous=flag(state.enchantment,"frozenSoulPulse"),turnStamp=stamp()+":"+token.uuid;if(previous?.stamp===turnStamp)return;
 const targets=frozenTargets(region,token);await state.enchantment.setFlag(ID,"frozenSoulPulse",{stamp:turnStamp});let published=false;
 try{
  if(!targets.length)return;
  const {data,id}=buildFrozenDamage(state.item),helper=new CONFIG.Item.documentClass(data,{parent:state.actor});helper.prepareFinalAttributes?.();
  const activity=helper.system.activities.get(id),user=selectSaveUser(state.actor,game.users,game.users.activeGM)??game.user;
  const result=await activity.use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{system:{targets:targets.map(describeTarget)},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,frozenSoulDamage:true}}}});
  if(!result?.message)throw Error("Frozen Soul could not create its damage card.");published=true;
  await result.message.setFlag(ID,"frozenSoulRoll",{user:user.id,actor:state.actor.uuid});
  if(user.id===game.user.id)promptFrozenDamage(result.message,activity).catch(report);
 }catch(error){if(!published){if(previous)await state.enchantment.setFlag(ID,"frozenSoulPulse",previous);else await state.enchantment.unsetFlag(ID,"frozenSoulPulse");}throw error;}
}
async function synchronizeScene(scene,{excluded=null,turnActor=null}={}){
 if(!authority()||!scene)return;const keep=new Set();
 for(const token of values(scene.tokens)){
  const state=frozenHauntState(token.actor,excluded);if(!state||!sourceMatches(token,state))continue;
  const region=await ensureFrozenRegion(token,state);if(!region)continue;keep.add(region.id);
  const activated=flag(state.enchantment,"frozenHauntActivated")??[];
  if(!activated.includes(token.uuid)||turnActor===state.actor.uuid){await pulseFrozen(token,state,region);if(!activated.includes(token.uuid))await state.enchantment.setFlag(ID,"frozenHauntActivated",[...activated,token.uuid]);}
 }
 const stale=values(scene.regions).filter(r=>flag(r,"frozenHauntAura")&&!keep.has(r.id)).map(r=>r.id);if(stale.length)await scene.deleteEmbeddedDocuments("Region",stale);
}
export function syncFrozenScene(scene,options={}){return enqueue(()=>synchronizeScene(scene,options));}
export function processFrozenTurn(combat,changes={}){return enqueue(async()=>{
 if(!authority()||!combat?.started||!("turn"in changes||"round"in changes||changes.started===true))return;
 const actor=combat.combatant?.actor;if(!frozenHauntFeature(actor))return;
 for(const scene of values(game.scenes))if(values(scene.tokens).some(t=>t.actor?.uuid===actor.uuid))await synchronizeScene(scene,{turnActor:actor.uuid});
});}
function syncActor(actor,excluded=null){
 if(!actor||!authority()||!frozenHauntFeature(actor)&&!values(game.scenes).some(s=>values(s.regions).some(r=>flag(r,"frozenHauntAura")?.actor===actor.uuid)))return Promise.resolve();
 return enqueue(async()=>{for(const scene of values(game.scenes))if(values(scene.tokens).some(t=>t.actor?.uuid===actor.uuid)||values(scene.regions).some(r=>flag(r,"frozenHauntAura")?.actor===actor.uuid))await synchronizeScene(scene,{excluded});});
}
function syncAll(){return enqueue(async()=>{if(authority())for(const scene of values(game.scenes))await synchronizeScene(scene);});}
function report(error){console.error("Frozen Haunt aura",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"frozenHauntAuraAutomation",{name:"Winter Walker: Frozen Haunt Aura",hint:"Link a grid-shaped 15-foot emanation to the manually activated form. Prompt 2d4 Cold damage against enemies in the area on adoption and at Ranger turn start. No entry/movement damage. Activation and immunities remain native.",scope:"world",config:true,type:Boolean,default:true,onChange:()=>syncAll().catch(report)}));
Hooks.once("ready",()=>{
 syncAll().catch(report);Hooks.on("canvasReady",()=>syncAll().catch(report));
 Hooks.on("updateCombat",(c,d)=>processFrozenTurn(c,d).catch(report));
 Hooks.on("updateWorldTime",()=>{if(values(game.scenes).some(s=>values(s.regions).some(r=>flag(r,"frozenHauntAura"))))syncAll().catch(report);});
 Hooks.on("dnd5e.applyEnchantment",item=>{if(isFrozenHaunt(item))syncActor(actorOf(item)).catch(report);});
 for(const event of ["createActiveEffect","deleteActiveEffect"])Hooks.on(event,e=>syncActor(actorOf(e),event==="deleteActiveEffect"?e.uuid:null).catch(report));
 Hooks.on("updateActiveEffect",(e,d)=>{if(["disabled","duration","system","start"].some(k=>k in d)||Object.keys(d).some(k=>k.startsWith("duration.")||k.startsWith("system.")))syncActor(actorOf(e)).catch(report);});
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,item=>{if(isFrozenHaunt(item))syncActor(actorOf(item)).catch(report);});
 Hooks.on("updateActor",actor=>syncActor(actor).catch(report));
 Hooks.on("createToken",token=>syncFrozenScene(token.parent).catch(report));Hooks.on("deleteToken",token=>syncFrozenScene(token.parent).catch(report));
 Hooks.on("updateToken",(t,d)=>{if(["width","height","shape","levels","level","actorId","delta","actorData"].some(k=>k in d))syncActor(t.actor).catch(report);});
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{if(flag(card,"frozenSoulRoll"))promptFrozenDamage(card).catch(report);});
 Hooks.on("deleteChatMessage",card=>opened.delete(card.id));
});
