import {getRegionSpellTable} from "./region-library.js";
import {describeTarget,isEligibleTarget} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",syncing=new Set(),running=new Set();
const specs={"heat-aura":{name:"Heat Aura",id:"LDcQJj3oXyPCuCaT"},"flame-aura":{name:"Flame Aura",id:"f4cPafTT2VXHbpr7"},"fire-aura":{name:"Fire Aura",id:"15VgJKVXwYBOFSqJ"}};
const authority=()=>game.user?.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function monsterAuraActivities(token){
 return Array.from(token?.actor?.items??[]).flatMap(item=>{
  const spec=specs[item.identifier??item.system?.identifier],config=spec&&getRegionSpellTable()[spec.name];
  if(item.type!=="feat"||item.system?.type?.value!=="monster"||!spec||config?.enabled===false||!config?.monsterAura)return [];
  return Array.from(item.system.activities??[]).filter(a=>a.id===spec.id&&a.type==="damage"&&Number(a.target?.template?.size)>0).map(activity=>({item,activity,config,spec}));
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
   const data={name:spec.name+" — "+token.name,color:game.user.color,shapes:[{type:"emanation",radius:Number(activity.target.template.size)*scale,base:{type:"token",x:token.x,y:token.y,width:token.width,height:token.height,shape:token.shape,rotation:0}}],attachment:{token:token.id},...(levels.length?{levels}:{}),restriction:{enabled:true,type:"move"},visibility:config.hideRegionFromPlayers!==false?CONST.REGION_VISIBILITY.GAMEMASTER:CONST.REGION_VISIBILITY.ALWAYS,highlightMode:"coverage",flags:{[ID]:{monsterAura:{token:token.uuid,item:item.uuid,activity:activity.id}}}};
   if(existing){keep.add(existing.id);if(existing.visibility!==data.visibility||JSON.stringify(existing.shapes)!==JSON.stringify(data.shapes)||existing.attachment?.token!==token.id)await existing.update(data);}
   else {const created=await scene.createEmbeddedDocuments("Region",[data]);for(const region of created)keep.add(region.id);}
  }
  const remove=regions.filter(r=>!keep.has(r.id)).map(r=>r.id);if(remove.length)await scene.deleteEmbeddedDocuments("Region",remove);
 }finally{syncing.delete(token.uuid);}
}
export function auraSuppressed(token,item){
 const statuses=token.actor?.statuses??new Set();
 if(token.combatant?.defeated||statuses.has("dead")||Number(token.actor?.system?.attributes?.hp?.value)===0)return true;
 const conditional=/unless[\s\S]*Incapacitated/i.test(item.system.description?.value??"");
 return conditional&&["incapacitated","unconscious","stunned","paralyzed","petrified"].some(s=>statuses.has(s));
}
export function monsterAuraTargets(region,source){
 return Array.from(source.parent?.tokens??[]).filter(t=>t.uuid!==source.uuid&&isEligibleTarget(t)&&t.testInsideRegion?.(region));
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
 for(const {item,activity,config,spec}of monsterAuraActivities(token)){
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
 if(changes.started===true||!combat.previous?.combatantId){await startMonsterCombatAuras(combat);return;}
 if(!("turn" in changes||"round" in changes))return;
 const previous=combat.previous;if(!previous?.combatantId||previous.combatantId===combat.combatant?.id&&previous.round===combat.round)return;
 const token=combat.combatants.get(previous.combatantId)?.token;if(token)await triggerMonsterAura(token,combat.id+":"+previous.round+":"+previous.turn);
}
async function syncCanvas(){if(!authority())return;for(const token of globalThis.canvas?.scene?.tokens??[])await syncMonsterAuras(token);}
async function syncActor(actor){if(!authority())return;for(const token of globalThis.canvas?.scene?.tokens??[])if(token.actor?.uuid===actor?.uuid)await syncMonsterAuras(token);}
function report(error){console.error("Monster aura automation",error);ui.notifications.error("Monster aura could not finish. Check the aura card and console.");}
Hooks.once("ready",()=>{
 Hooks.on("canvasReady",()=>syncCanvas().catch(report));
 Hooks.on("createToken",token=>syncMonsterAuras(token).catch(report));
 Hooks.on("combatStart",combat=>startMonsterCombatAuras(combat).catch(report));
 Hooks.on("createCombatant",combatant=>{if(combatant.parent?.started&&combatant.token)syncMonsterAuras(combatant.token.document??combatant.token).catch(report);});
 Hooks.on("updateCombat",(combat,changes)=>processMonsterAuraTurn(combat,changes).catch(report));
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,item=>syncActor(item.actor??item.parent).catch(report));
 Hooks.on("updateActor",actor=>syncActor(actor).catch(report));
 Hooks.on("updateSetting",setting=>{if(setting.key?.startsWith(ID+".regionLibrary")||setting.key===ID+".spellTable")syncCanvas().catch(report);});
 syncCanvas().catch(report);
});
