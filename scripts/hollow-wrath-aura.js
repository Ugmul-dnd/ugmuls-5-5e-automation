import {createEventQueue,describeTarget,isEligibleTarget} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",SAVE="Lz2jHFS3S8PB3Yyy",TRANSFORM="iBiE3QCn3Sj1fxKs",PROFILE="pyD3mq2KQFWJ6Uoo",FEAR="z4A4zzK9PGYbkxvC",BOOK="rhwHWWrathofth3C",enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"hollowWrathAuraAutomation")===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const live=e=>e&&!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
const stamp=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:"outside-combat";
const actorOf=doc=>doc?.documentName==="Actor"?doc:doc?.actor??(doc?.parent?.documentName==="Actor"?doc.parent:doc?.parent?.actor);
export function isHollowWrath(item){
 if(item?.type!=="feat")return false;
 const refs=[item._stats?.compendiumSource,item._stats?.duplicateSource,item.flags?.core?.sourceId].filter(Boolean);
 const activities=values(item.system?.activities);
 return refs.some(ref=>ref.endsWith("."+BOOK))||activities.some(a=>a.id===SAVE)&&activities.some(a=>a.id===TRANSFORM);
}
export const hollowWrathFeature=actor=>values(actor?.items).find(isHollowWrath);
export function hollowWrathState(actor,excluded=null,{ignoreAuraSetting=false}={}){
 const item=hollowWrathFeature(actor);if(!ignoreAuraSetting&&!enabled()||!item||["incapacitated","unconscious","stunned","paralyzed","petrified","dead"].some(s=>actor?.statuses?.has(s)))return null;
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
 return token.parent===(globalThis.canvas?.scene??game.scenes?.active)||values(token.parent?.regions).some(r=>flag(r,"hollowWrathAura")?.token===token.uuid&&flag(r,"hollowWrathAura")?.enchantment===state.enchantment.uuid);
}
export function wrathEnemy(source,target){
 return !!source?.actor&&!!target?.actor&&source.uuid!==target.uuid&&source.actor.uuid!==target.actor.uuid&&isEligibleTarget(target)&&typeof source.disposition==="number"&&typeof target.disposition==="number"&&source.disposition*target.disposition<0;
}
export async function ensureWrathRegion(token,state){
 const scene=token.parent,scale=Number(scene.grid?.size)/Number(scene.grid?.distance);if(!(scale>0))throw Error("Unnerving Aura needs a scene grid distance.");
 const regions=values(scene.regions).filter(r=>flag(r,"hollowWrathAura")?.token===token.uuid),region=regions[0];
 const levels=values(token.levels);if(!levels.length&&token.level)levels.push(token.level.id??token.level);if(!levels.length&&globalThis.canvas?.scene===scene&&canvas.level?.id)levels.push(canvas.level.id);
 const feet=/^(m|meters?|metres?)$/i.test(String(scene.grid.units??"ft"))?10*0.3048:10;
 const link={token:token.uuid,actor:state.actor.uuid,item:state.item.uuid,enchantment:state.enchantment.uuid};
 const data={name:"Unnerving Aura — "+token.name,color:game.user.color,shapes:[{type:"emanation",gridBased:true,radius:feet*scale,base:{type:"token",x:token.x,y:token.y,width:token.width,height:token.height,shape:token.shape,rotation:0}}],attachment:{token:token.id},levels,restriction:{enabled:true,type:"move"},visibility:CONST.REGION_VISIBILITY.LAYER_UNLOCKED,highlightMode:"coverage",flags:{[ID]:{hollowWrathAura:link}}};
 if(regions.length>1)await scene.deleteEmbeddedDocuments("Region",regions.slice(1).map(r=>r.id));
 if(!region)return (await scene.createEmbeddedDocuments("Region",[data]))[0];
 const old=values(region.shapes)[0],next=data.shapes[0];
 // Token attachment owns position. Never rebuild the aura on each step.
 const changed=region.name!==data.name||region.visibility!==data.visibility||(region.attachment?.token?.id??region.attachment?.token)!==token.id||old?.type!=="emanation"||old.gridBased!==true||Number(old.radius)!==next.radius||["width","height","shape"].some(k=>old.base?.[k]!==next.base[k])||JSON.stringify(values(region.levels).sort())!==JSON.stringify([...levels].sort())||flag(region,"hollowWrathAura")?.enchantment!==link.enchantment;
 if(changed)await region.update(data);return region;
}
export function wrathTargets(region,source){
 const levels=values(source.levels);
 return values(source.parent?.tokens).filter(t=>wrathEnemy(source,t)&&(!levels.length||!values(t.levels).length||values(t.levels).some(l=>levels.includes(l)))&&t.testInsideRegion?.(region)===true);
}
export function buildWrathSave(item,source,enchantment,turnStamp){
 const data=item.toObject(),use=data.system.activities[SAVE];if(!use)throw Error("Wrath of the Wild is missing its native Unnerving Aura save.");
 const native=(data.effects??[]).find(e=>e._id===FEAR)??{_id:FEAR,img:"systems/dnd5e/icons/svg/statuses/frightened.svg",type:"base",system:{changes:[]}};
 const combat=game.combat,applied=combat?.started?{combat:combat.id,round:combat.round,turn:combat.turn}:null;
 Object.assign(native,{name:"Unnerving Aura — Frightened",disabled:false,transfer:false,origin:source.actor.uuid,start:null,statuses:["frightened"],duration:{value:applied?null:6,units:"seconds",expiry:"sourceStart",expired:false}});
 native.system={...native.system,changes:[],origin:{actor:source.actor.uuid,item:item.uuid}};
 native.flags={...native.flags,dnd5e:{...native.flags?.dnd5e,isTemporary:true},[ID]:{...native.flags?.[ID],hollowWrathFear:{source:source.actor.uuid,token:source.uuid,enchantment:enchantment.uuid,stamp:turnStamp,applied}}};
 data.name="Unnerving Aura";data.effects=[native];data.system.activities={[SAVE]:use};data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};
 if(globalThis.Ugmuls55eAutomationRot?.hasRot(source.actor)){native.name="Menacing Aura — Frightened";native.flags[ID].hollowWrathFear.menacing=true;}
 use.name="Unnerving Aura";use.effects=[{_id:FEAR,onSave:false}];use.appliedEffects=[FEAR];use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.duration={units:"inst",override:true,concentration:false};use.damage={parts:[],onSave:"none"};use.save={...use.save,ability:["wis"]};use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"",choice:false}};use.range={units:"any",override:true};
 use.flags??={};if(use.flags.dnd5e)delete use.flags.dnd5e.dependentOn;
 const quiet={version:5,isEnabled:false,isCustomized:false,killAnim:true};data.flags.autoanimations=quiet;use.flags.autoanimations=quiet;
 return {data,id:SAVE};
}
async function pulseWrath(token,state,region){
 const previous=flag(state.enchantment,"hollowWrathPulse"),turnStamp=stamp()+":"+token.uuid;
 if(previous?.stamp===turnStamp)return;
 const targets=wrathTargets(region,token);await state.enchantment.setFlag(ID,"hollowWrathPulse",{stamp:turnStamp});
 try{
  if(!targets.length)return;
  const {data,id}=buildWrathSave(state.item,token,state.enchantment,turnStamp),helper=new CONFIG.Item.documentClass(data,{parent:state.actor});helper.prepareFinalAttributes?.();
  const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{system:{targets:targets.map(describeTarget)},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,hollowWrathSave:{source:token.uuid,actor:state.actor.uuid,enchantment:state.enchantment.uuid,stamp:turnStamp}}}}});
  if(!result?.message)throw Error("Unnerving Aura could not create its saving throw card.");
 }catch(error){if(previous)await state.enchantment.setFlag(ID,"hollowWrathPulse",previous);else await state.enchantment.unsetFlag(ID,"hollowWrathPulse");throw error;}
}
async function synchronizeScene(scene,{excluded=null,turnActor=null}={}){
 if(!authority()||!scene)return;
 const keep=new Set();
 for(const token of values(scene.tokens)){
  const state=hollowWrathState(token.actor,excluded);if(!state||!sourceMatches(token,state))continue;
  const region=await ensureWrathRegion(token,state);if(!region)continue;keep.add(region.id);
  const activated=flag(state.enchantment,"hollowWrathAuraActivated")??[];
  if(!activated.includes(token.uuid)||turnActor===state.actor.uuid){
   await pulseWrath(token,state,region);
   if(!activated.includes(token.uuid))await state.enchantment.setFlag(ID,"hollowWrathAuraActivated",[...activated,token.uuid]);
  }
 }
 const stale=values(scene.regions).filter(r=>flag(r,"hollowWrathAura")&&!keep.has(r.id)).map(r=>r.id);if(stale.length)await scene.deleteEmbeddedDocuments("Region",stale);
}
export function syncWrathScene(scene,options={}){return enqueue(()=>synchronizeScene(scene,options));}
export async function expireWrathFear(combat){
 const source=combat.combatant?.actor;if(!source)return;
 const actors=new Map([...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor)),...values(combat.combatants).map(c=>c.actor)].filter(Boolean).map(a=>[a.uuid,a]));
 for(const actor of actors.values()){
  const ids=values(actor.effects).filter(e=>{const marker=flag(e,"hollowWrathFear"),a=marker?.applied;return marker?.source===source.uuid&&(!a||a.combat!==combat.id||combat.round>a.round||combat.round===a.round&&combat.turn>a.turn);}).map(e=>e.id);
  if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
 }
}
export function processWrathTurn(combat,changes={}){return enqueue(async()=>{
 if(!authority()||!combat?.started||!("turn"in changes||"round"in changes||changes.started===true))return;
 // Previous fear expires even if the Ranger ended their transformation.
 await expireWrathFear(combat);
 const actor=combat.combatant?.actor;if(!hollowWrathFeature(actor))return;
 for(const scene of values(game.scenes))if(values(scene.tokens).some(t=>t.actor?.uuid===actor.uuid))await synchronizeScene(scene,{turnActor:actor.uuid});
});}
export function endWrathCombat(combat){return enqueue(async()=>{
 if(!authority())return;
 const actors=new Map([...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor))].filter(Boolean).map(a=>[a.uuid,a]));
 for(const actor of actors.values()){
  const ids=values(actor.effects).filter(e=>flag(e,"hollowWrathFear")?.applied?.combat===combat.id).map(e=>e.id);
  if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
 }
});}
function syncActor(actor,excluded=null){
 if(!actor||!authority()||!hollowWrathFeature(actor)&&!values(game.scenes).some(s=>values(s.regions).some(r=>flag(r,"hollowWrathAura")?.actor===actor.uuid)))return Promise.resolve();
 return enqueue(async()=>{for(const scene of values(game.scenes))if(values(scene.tokens).some(t=>t.actor?.uuid===actor.uuid)||values(scene.regions).some(r=>flag(r,"hollowWrathAura")?.actor===actor.uuid))await synchronizeScene(scene,{excluded});});
}
function syncAll(){return enqueue(async()=>{if(authority())for(const scene of values(game.scenes))await synchronizeScene(scene);});}
function report(error){console.error("Hollow Warden Unnerving Aura",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"hollowWrathAuraAutomation",{name:"Hollow Warden: Unnerving Aura",hint:"Link a grid-shaped 10-foot emanation to Wrath of the Wild. Automatically prompt enemies' Wisdom saves on transformation and at the Ranger's turn start; Frightened lasts until the Ranger's next turn. Other Wrath benefits remain native/manual.",scope:"world",config:true,type:Boolean,default:true,onChange:()=>syncAll().catch(report)}));
Hooks.once("ready",()=>{
 syncAll().catch(report);Hooks.on("canvasReady",()=>syncAll().catch(report));
 Hooks.on("updateCombat",(combat,changes)=>(changes.started===false?endWrathCombat(combat):processWrathTurn(combat,changes)).catch(report));
 Hooks.on("deleteCombat",combat=>endWrathCombat(combat).catch(report));
 Hooks.on("updateWorldTime",()=>{if(values(game.scenes).some(s=>values(s.regions).some(r=>flag(r,"hollowWrathAura"))))syncAll().catch(report);});
 Hooks.on("dnd5e.applyEnchantment",item=>{if(isHollowWrath(item))syncActor(actorOf(item)).catch(report);});
 for(const event of ["createActiveEffect","deleteActiveEffect"])Hooks.on(event,effect=>syncActor(actorOf(effect),event==="deleteActiveEffect"?effect.uuid:null).catch(report));
 Hooks.on("updateActiveEffect",(effect,changes)=>{if(["disabled","duration","system","start"].some(k=>k in changes)||Object.keys(changes).some(k=>k.startsWith("duration.")||k.startsWith("system.")))syncActor(actorOf(effect)).catch(report);});
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,item=>{if(isHollowWrath(item))syncActor(actorOf(item)).catch(report);});
 Hooks.on("updateActor",actor=>syncActor(actor).catch(report));
 Hooks.on("createToken",token=>syncWrathScene(token.parent).catch(report));Hooks.on("deleteToken",token=>syncWrathScene(token.parent).catch(report));
 Hooks.on("updateToken",(token,changes)=>{if(["width","height","shape","levels","level","actorId","delta","actorData"].some(k=>k in changes))syncActor(token.actor).catch(report);});
});
