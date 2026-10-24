import {getRegionSpellTable} from "./region-library.js";
import {describeTarget,isEligibleTarget} from "./shared-activity-card.js";
import {sendSavePrompt} from "./save-prompts.js";
const ID="ugmuls-5-5e-automation",syncing=new Set(),running=new Set();
const specs={"stench":{name:"Stench",id:"mJbwhj3beOIB3Jgj",type:"save",condition:"poisoned",ability:"con",immunitySeconds:3600,speciesImmunity:true,effectId:"rHL9lpchOon81CN1"},"fetid-aura":{name:"Fetid Aura",id:"viDmXaiaC23yBh98",type:"save",condition:"poisoned",ability:"con",immunitySeconds:0,effectId:"osCPSzW0IxYlG7t0"},"fear-aura":{name:"Fear Aura",id:"oT8238p9jXwVy76c",type:"save",condition:"frightened",ability:"wis",immunitySeconds:86400,enemiesOnly:true},"heat-aura":{name:"Heat Aura",id:"LDcQJj3oXyPCuCaT"},"flame-aura":{name:"Flame Aura",id:"f4cPafTT2VXHbpr7"},"fire-aura":{name:"Fire Aura",id:"15VgJKVXwYBOFSqJ"}};
const authority=()=>game.user?.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function monsterAuraActivities(token){
 return Array.from(token?.actor?.items??[]).flatMap(item=>{
  const spec=specs[item.identifier??item.system?.identifier],config=spec&&getRegionSpellTable()[spec.name];
  if(item.type!=="feat"||item.system?.type?.value!=="monster"||!spec||config?.enabled===false||!config?.monsterAura)return [];
  return Array.from(item.system.activities??[]).filter(a=>a.id===spec.id&&a.type===(spec.type??"damage")&&Number(a.target?.template?.size)>0).map(activity=>({item,activity,config,spec}));
 });
}
export async function syncMonsterAuras(token){
 if(!authority()||!token?.actor||!token.parent||syncing.has(token.uuid))return;
 syncing.add(token.uuid);
 try{
  const scene=token.parent;if(scene.tokens?.get&&scene.tokens.get(token.id)!==token)return;const wanted=monsterAuraActivities(token),regions=Array.from(scene.regions??[]).filter(r=>r.flags?.[ID]?.monsterAura?.token===token.uuid),keep=new Set();
  for(const {item,activity,config,spec}of wanted){
   const existing=regions.find(r=>r.flags[ID].monsterAura.item===item.uuid&&!keep.has(r.id)),scale=scene.grid.size/scene.grid.distance;
   if(!Number.isFinite(scale)||scale<=0)continue;
   const levels=Array.from(token.levels??[]);if(!levels.length&&globalThis.canvas?.scene===scene&&canvas.level?.id)levels.push(canvas.level.id);
   const data={name:spec.name+" — "+token.name,color:game.user.color,shapes:[{type:"emanation",gridBased:true,radius:Number(activity.target.template.size)*scale,base:{type:"token",x:token.x,y:token.y,width:token.width,height:token.height,shape:token.shape,rotation:0}}],attachment:{token:token.id},...(levels.length?{levels}:{}),restriction:{enabled:true,type:"move"},visibility:config.hideRegionFromPlayers!==false?CONST.REGION_VISIBILITY.GAMEMASTER:CONST.REGION_VISIBILITY.ALWAYS,highlightMode:"coverage",flags:{[ID]:{monsterAura:{token:token.uuid,item:item.uuid,activity:activity.id}}}};
   if(existing){keep.add(existing.id);if(existing.visibility!==data.visibility||JSON.stringify(existing.shapes)!==JSON.stringify(data.shapes)||existing.attachment?.token!==token.id)await existing.update(data);}
   else {const created=await scene.createEmbeddedDocuments("Region",[data]);for(const region of created)keep.add(region.id);}
  }
  const remove=regions.filter(r=>!keep.has(r.id)).map(r=>r.id);if(remove.length)await scene.deleteEmbeddedDocuments("Region",remove);
 }finally{syncing.delete(token.uuid);}
}
export function auraSuppressed(token,item){
 const statuses=token.actor?.statuses??new Set();
 if(token.combatant?.defeated||statuses.has("dead")||Number(token.actor?.system?.attributes?.hp?.value)===0)return true;
 const conditional=/(?:unless|while)[\s\S]*Incapacitated/i.test(item.system.description?.value??"");
 return conditional&&["incapacitated","unconscious","stunned","paralyzed","petrified"].some(s=>statuses.has(s));
}
export function swallowedByAuraSource(target,source){
 const swallowKeys=new Set(["mm-source-giant-toad","mm-source-behir","mm-source-purple-worm","mm-source-remorhaz","mm-source-tarrasque","mm-source-kraken"]);
 return Array.from(target?.actor?.effects??[]).some(effect=>{
  if(effect.disabled||effect.active===false||effect.duration?.expired||effect.system?.expired===true)return false;
  const flags=effect.flags?.[ID],record=effect.getFlag?.(ID,"swallowed")??flags?.swallowed??effect.getFlag?.(ID,"recurringEffect")??flags?.recurringEffect;
  if(!swallowKeys.has(record?.key))return false;
  return record.sourceToken?record.sourceToken===source.uuid:!!record.caster&&record.caster===source.actor?.uuid;
 });
}
export function monsterAuraTargets(region,source){
 return Array.from(source.parent?.tokens??[]).filter(t=>t.uuid!==source.uuid&&isEligibleTarget(t)&&!swallowedByAuraSource(t,source)&&t.testInsideRegion?.(region));
}
export async function chooseAuraTargets(item,targets){
 const escape=foundry.utils.escapeHTML;
 const selected=await foundry.applications.api.DialogV2.wait({window:{title:item.name+" — Choose targets"},position:{width:420},content:'<p>Choose creatures affected this turn.</p><div style="max-height:360px;overflow-y:auto">'+targets.map((token,index)=>'<label style="display:flex;gap:8px"><input type="checkbox" name="auraTarget" value="'+index+'" checked>'+escape(token.name)+'</label>').join("")+'</div>',rejectClose:false,buttons:[{action:"apply",label:"Confirm targets",callback:(_event,button)=>Array.from(button.form.querySelectorAll('[name="auraTarget"]:checked'),input=>Number(input.value))},{action:"cancel",label:"Skip this turn",callback:()=>null}]});
 return Array.isArray(selected)?targets.filter((_,index)=>selected.includes(index)):[];
}
export function buildMonsterAuraDamage(item,activity){
 const data=item.toObject(),id=activity.id,selected=data.system.activities[id];
 data._id=foundry.utils.randomID();data.name=item.name;data.effects=[];data.system.description={value:"<p>Damage from the monster’s aura at the end of its turn.</p>",chat:""};data.system.activities={[id]:selected};
 selected.effects=[];selected.activation={type:"special",override:true};selected.duration={units:"inst",concentration:false,override:true};selected.range={override:true,units:"any"};selected.target={override:true,prompt:false,affects:{type:"creature",choice:false},template:{type:""}};selected.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};
 const quiet={version:5,isEnabled:false,isCustomized:false,killAnim:true};data.flags??={};data.flags.autoanimations=quiet;selected.flags??={};selected.flags.autoanimations=quiet;
 return {data,id};
}
export async function triggerMonsterAura(token,stamp){
 if(!authority()||!token?.actor)return;
 await syncMonsterAuras(token);
 for(const {item,activity,config,spec}of monsterAuraActivities(token).filter(entry=>entry.activity.type==="damage")){
  const region=Array.from(token.parent.regions??[]).find(r=>r.flags?.[ID]?.monsterAura?.token===token.uuid&&r.flags[ID].monsterAura.item===item.uuid);
  if(!region||config.enabled===false||auraSuppressed(token,item)||running.has(region.uuid)||region.getFlag(ID,"monsterAuraLastTurn")===stamp)continue;
  running.add(region.uuid);
  try{
   await region.setFlag(ID,"monsterAuraLastTurn",stamp);
   let targets=monsterAuraTargets(region,token);if(!targets.length)continue;
   if(activity.target.affects.choice)targets=await chooseAuraTargets(item,targets);
   const enabled=getRegionSpellTable()[spec.name]?.enabled!==false;
   if(!enabled||!authority()||auraSuppressed(token,item)||!Array.from(token.parent.tokens??[]).some(t=>t.uuid===token.uuid))continue;
   const stillInside=new Set(monsterAuraTargets(region,token).map(t=>t.uuid));targets=targets.filter(t=>stillInside.has(t.uuid));if(!targets.length)continue;
   const {data,id}=buildMonsterAuraDamage(item,activity),helper=new CONFIG.Item.documentClass(data,{parent:item.actor});helper.prepareFinalAttributes?.();
   const descriptors=targets.map(describeTarget),flags={[ID]:{riderTriggered:true,monsterAuraDamage:{region:region.uuid,source:token.uuid,stamp}},dnd5e:{item:{data}}};
   const result=await helper.system.activities.get(id).use({consume:false,scaling:0,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:descriptors},flags}});
   if(!result?.message)throw Error("Aura damage card was not created.");
   const dialog=globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("damage",{configure:true})??{configure:true};
   await helper.system.activities.get(id).rollDamage({isCritical:false},dialog,{data:{system:{origin:result.message.id,targets:descriptors},flags:{[ID]:flags[ID]}}});
  }finally{running.delete(region.uuid);}
 }
}
export async function startMonsterCombatAuras(combat){
 if(!authority()||!combat?.started)return;
 for(const combatant of combat.combatants??[]){const token=combatant.token;if(token)await syncMonsterAuras(token.document??token);}
}
export async function processMonsterAuraTurn(combat,changes){
 if(!authority()||!combat.started)return;
 if(changes.started===true||!combat.previous?.combatantId){await startMonsterCombatAuras(combat);await triggerMonsterFearTurn(combat);return;}
 if(!("turn" in changes||"round" in changes))return;
 const previous=combat.previous;if(!previous?.combatantId||previous.combatantId===combat.combatant?.id&&previous.round===combat.round)return;
 const token=combat.combatants.get(previous.combatantId)?.token;if(token)await triggerMonsterAura(token,combat.id+":"+previous.round+":"+previous.turn);
 await triggerMonsterFearTurn(combat);
}
async function syncCanvas(){if(!authority())return;for(const token of globalThis.canvas?.scene?.tokens??[])await syncMonsterAuras(token);}
async function syncActor(actor){if(!authority())return;for(const token of globalThis.canvas?.scene?.tokens??[])if(token.actor?.uuid===actor?.uuid)await syncMonsterAuras(token);}
function report(error){console.error("Monster aura automation",error);ui.notifications.error("Monster aura could not finish. Check the aura card and console.");}
Hooks.once("ready",()=>{
 Hooks.on("canvasReady",()=>syncCanvas().catch(report));
 Hooks.on("createToken",token=>syncMonsterAuras(token).catch(report));
 Hooks.on("combatStart",combat=>startMonsterCombatAuras(combat).catch(report));
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>resolveMonsterFearSave(card).catch(report));
 Hooks.on("createCombatant",combatant=>{if(combatant.parent?.started&&combatant.token)syncMonsterAuras(combatant.token.document??combatant.token).catch(report);});
 Hooks.on("updateCombat",(combat,changes)=>processMonsterAuraTurn(combat,changes).catch(report));
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,item=>syncActor(item.actor??item.parent).catch(report));
 Hooks.on("updateActor",actor=>syncActor(actor).catch(report));
 Hooks.on("updateSetting",setting=>{if(setting.key?.startsWith(ID+".regionLibrary")||setting.key===ID+".spellTable")syncCanvas().catch(report);});
 syncCanvas().catch(report);
});
const fearLive=effect=>effect&&!effect.disabled&&effect.active!==false&&effect.duration?.expired!==true;
export function monsterStenchKind(actor){
 const refs=[actor?._stats?.compendiumSource,actor?._stats?.duplicateSource,actor?.flags?.core?.sourceId].filter(Boolean).join(" ");
 for(const [id,kind]of [["mmGhastGravecall","ghast"],["mmGhast000000000","ghast"],["mmHezrou00000000","hezrou"],["mmTroglodyte0000","troglodyte"]])if(refs.includes(id))return kind;
 const name=String(actor?.name??"").toLowerCase();return /^ghast(?:\b|$)/.test(name)?"ghast":/^hezrou(?:\b|$)/.test(name)?"hezrou":/^troglodyte(?:\b|$)/.test(name)?"troglodyte":null;
}
function auraImmunityScope(spec,source){return spec.speciesImmunity?"stench:"+(monsterStenchKind(source.actor)??source.actor.uuid):source.uuid;}
export function monsterSaveAuraImmune(actor,source,spec){
 const condition=spec.condition??"frightened";if(Array.from(actor?.system?.traits?.ci?.value??[]).includes(condition))return true;
 const now=Number(game.time?.worldTime??0),scope=typeof source==="string"?source:auraImmunityScope(spec,source);
 return Array.from(actor?.effects??[]).some(effect=>{const link=effect.getFlag?.(ID,"monsterFearImmunity")??effect.flags?.[ID]?.monsterFearImmunity;return fearLive(effect)&&(link?.scope??link?.source)===scope&&Number(link.until)>now;});
}
export function monsterFearImmune(actor,source){return monsterSaveAuraImmune(actor,source,specs["fear-aura"]);}
export function buildMonsterFearSave(item,activity,source,target,stamp){
 const spec=specs[item.identifier??item.system?.identifier]??specs["fear-aura"],condition=spec.condition,label=condition==="poisoned"?"Poisoned":"Frightened";
 const dc=Number(activity.save?.dc?.value);if(!Number.isFinite(dc)||dc<=0)throw Error(spec.name+" needs a prepared saving throw DC.");
 const data=item.toObject(),id=activity.id,selected=data.system.activities[id];data._id=foundry.utils.randomID();data.name=item.name;
 const effect=(data.effects??[]).find(e=>(e.statuses??[]).includes(condition)||e.name===label)??{_id:spec.effectId??"Sb7G5OyhGbjLUoWo",name:label,type:"base",img:"systems/dnd5e/icons/svg/statuses/"+condition+".svg",transfer:false,statuses:[condition],system:{changes:[]}};
 effect.disabled=false;effect.transfer=false;effect.statuses=[...new Set([...(effect.statuses??[]),condition])];effect.duration={value:null,units:"seconds",expiry:null,expired:false};delete effect.start;effect.flags??={};effect.flags.dnd5e={...effect.flags.dnd5e,isTemporary:true};effect.flags[ID]={...effect.flags[ID],monsterFearFrightened:{source:source.uuid,target:target.uuid,stamp,aura:spec.name,condition}};data.effects=[effect];
 selected.effects=[{_id:effect._id,uuid:null,onSave:false,level:{}}];selected.save={...selected.save,ability:[spec.ability],dc:{calculation:"",formula:String(dc)}};selected.damage={parts:[],onSave:"none"};selected.activation={type:"special",override:true};selected.duration={units:"inst",concentration:false,override:true};selected.range={override:true,units:"any"};selected.target={override:true,prompt:false,affects:{type:"creature",count:"1",choice:false},template:{type:""}};selected.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};data.system.activities={[id]:selected};data.system.description={value:"<p>"+(spec.ability==="con"?"Constitution":"Wisdom")+" save. Failure: "+label+" until the start of your next turn."+(spec.immunitySeconds?" Success: immune to "+(spec.speciesImmunity?"this monster kind’s Stench for 1 hour.":"this creature’s Fear Aura for 24 hours."):"")+"</p>",chat:""};
 const quiet={version:5,isEnabled:false,isCustomized:false,killAnim:true};data.flags??={};data.flags.autoanimations=quiet;selected.flags??={};selected.flags.autoanimations=quiet;return {data,id};
}
export async function triggerMonsterFearTurn(combat){
 if(!authority()||!combat?.started)return;
 const target=combat.combatant?.token;if(!target?.actor)return;
 const stamp=combat.id+":"+combat.round+":"+combat.turn;
 const turnKey="save-aura-turn:"+target.uuid;if(running.has(turnKey))return;running.add(turnKey);
 try{
 // Clear only this automation's previous-turn Frightened effects, even outside the aura.
 for(const effect of Array.from(target.actor.effects??[])){const link=effect.getFlag?.(ID,"monsterFearFrightened")??effect.flags?.[ID]?.monsterFearFrightened;if(link?.target===target.uuid&&link.stamp!==stamp&&effect.duration?.expiry!=="turnStart")await effect.delete();}
 if(!isEligibleTarget(target))return;
 for(const region of target.parent?.regions??[]){
  const link=region.flags?.[ID]?.monsterAura;if(!link)continue;
  const source=Array.from(target.parent.tokens??[]).find(t=>t.uuid===link.token);if(!source||source.uuid===target.uuid||swallowedByAuraSource(target,source))continue;
  const match=monsterAuraActivities(source).find(entry=>entry.activity.type==="save"&&entry.item.uuid===link.item);if(!match||auraSuppressed(source,match.item)||monsterSaveAuraImmune(target.actor,source,match.spec)||!target.testInsideRegion?.(region))continue;
  if(match.spec.enemiesOnly){const enemy=source.disposition===CONST.TOKEN_DISPOSITIONS.HOSTILE?CONST.TOKEN_DISPOSITIONS.FRIENDLY:CONST.TOKEN_DISPOSITIONS.HOSTILE;if(target.disposition!==enemy)continue;}
  if(match.spec.speciesImmunity&&monsterStenchKind(source.actor)&&monsterStenchKind(source.actor)===monsterStenchKind(target.actor))continue;
  const key=region.uuid+":"+target.uuid;if(running.has(key))continue;
  const previous=region.getFlag(ID,"monsterFearLastTurns")??[];if(previous.some(row=>row.target===target.uuid&&row.stamp===stamp))continue;
  running.add(key);
  try{
   await region.setFlag(ID,"monsterFearLastTurns",[...previous.filter(row=>row.target!==target.uuid),{target:target.uuid,stamp}]);
   const {data,id}=buildMonsterFearSave(match.item,match.activity,source,target,stamp),helper=new CONFIG.Item.documentClass(data,{parent:match.item.actor});helper.prepareFinalAttributes?.();
   const result=await helper.system.activities.get(id).use({consume:false,scaling:0,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:[describeTarget(target)]},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,regionTriggered:true,monsterFearSave:{source:source.uuid,target:target.uuid,stamp,name:source.name,aura:match.spec.name,condition:match.spec.condition,immunitySeconds:match.spec.immunitySeconds,scope:auraImmunityScope(match.spec,source)}}}}});
   if(!result?.message)throw Error("Fear Aura save card was not created.");await sendSavePrompt(result.message,target,"region");
  }finally{running.delete(key);}
 }
 }finally{running.delete(turnKey);}
}
export async function resolveMonsterFearSave(card){
 if(!authority())return;
 const result=card;
 if(card?.type!=="usage"){const origin=card?.system?.origin;card=typeof origin==="string"?game.messages.get(origin.replace(/^ChatMessage\./,"")):origin;}
 if(card?.type!=="usage")return;
 const link=card.getFlag?.(ID,"monsterFearSave");if(!link||running.has(card.id))return;
 const target=await fromUuid(link.target);if(!target?.actor||running.has(card.id))return;
 running.add(card.id);let processedOutcome,processed=false;
 try{
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(result);
  const current=card.system.outcomes?.get(link.target),effects=Array.from(target.actor.effects??[]),owned=effects.filter(e=>(e.getFlag?.(ID,"monsterFearImmunity")??e.flags?.[ID]?.monsterFearImmunity)?.card===card.id);
  processedOutcome=current;processed=true;
  const seconds=link.immunitySeconds??86400,scope=link.scope??link.source;
  if(current!=="success"||!seconds){for(const effect of owned)await effect.delete();return;}
  if(owned.some(fearLive)||monsterSaveAuraImmune(target.actor,scope,{condition:link.condition??"frightened"}))return;
  const now=Number(game.time?.worldTime??0),start=globalThis.CONFIG?.ActiveEffect?.documentClass?.getEffectStart?.()??{time:now};
  await target.actor.createEmbeddedDocuments("ActiveEffect",[{name:(link.aura??"Fear Aura")+" Immunity — "+(scope.startsWith("stench:")?scope.slice(7):link.name),type:"base",img:"icons/svg/shield.svg",disabled:false,transfer:false,start,duration:{value:seconds,units:"seconds",expiry:null,expired:false},statuses:[],system:{changes:[]},flags:{dnd5e:{isTemporary:true},[ID]:{monsterFearImmunity:{source:link.source,scope,card:card.id,until:now+seconds,aura:link.aura??"Fear Aura"}}},description:scope.startsWith("stench:")?"Immune to the Stench of this monster kind for 1 hour. Other kinds still apply.":"Immune to this creature’s Fear Aura for 24 hours. Other sources of fear still apply."}]);
 }finally{running.delete(card.id);if(processed&&card.system.outcomes?.get(link.target)!==processedOutcome)resolveMonsterFearSave(card).catch(report);}
}
