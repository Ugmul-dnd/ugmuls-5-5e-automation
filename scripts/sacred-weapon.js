import {paladinFeatureNotice} from "./paladin-feature-notice.js";
import {syncPaladinLights} from "./paladin-lighting.js";
import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),requests=new Map();
const values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier;
const flag=(doc,k)=>doc?.getFlag?.(ID,k),authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function sacredContext(actor,weapon){
 const feature=values(actor?.items).find(i=>i.type==="feat"&&key(i)==="sacred-weapon"&&i.system?.source?.rules!=="2014"),activity=values(feature?.system?.activities).find(a=>a.type==="enchant"),resource=values(actor?.items).find(i=>i.type==="feat"&&key(i)==="channel-divinity");
 const melee=["simpleM","martialM"].includes(weapon?.system?.type?.value)||values(weapon?.system?.activities).some(a=>a.type==="attack"&&a.attack?.type?.value==="melee");
 const available=Number(resource?.system?.uses?.value??Number(resource?.system?.uses?.max)-Number(resource?.system?.uses?.spent??0));
 return feature&&activity&&weapon?.type==="weapon"&&weapon.actor?.uuid===actor.uuid&&melee?{actor,weapon,feature,activity,resource,available:available>0}:null;
}
function controls(actor){return values(actor?.effects).filter(e=>flag(e,"sacredWeapon"));}
function active(effect){return effect&&!effect.disabled&&!effect.duration?.expired&&!effect.system?.expired;}
export async function synchronizeSacredWeapon(actor,removed){
 if(!actor?.isOwner)return;
 const current=controls(actor),all=removed?[removed,...current]:current,legacy=current.map(e=>{const state=flag(e,"sacredWeapon");return {getFlag:()=>state};});
 for(const control of all){
  const state=flag(control,"sacredWeapon"),weapon=values(actor.items).find(i=>i.uuid===state.weapon),context=sacredContext(actor,weapon);
  const live=current.includes(control)&&active(control)&&context&&weapon.system?.equipped===true&&game.settings.get(ID,"sacredWeaponAutomation")===true;
  const enchantments=values(weapon?.effects).filter(e=>flag(e,"sacredWeaponControl")===control.uuid);
  if(!live){
   for(const effect of enchantments){if(!current.includes(control))await effect.delete();else if(!effect.disabled)await effect.update({disabled:true});}
   if(current.includes(control)&&state.lights?.length)await control.setFlag(ID,"sacredWeapon",{...state,lights:[]});
   if(current.includes(control)&&active(control)&&(!context||weapon.system?.equipped!==true))await control.update({disabled:true});
   continue;
  }
  let enchantment=enchantments[0];
  if(!enchantment){enchantment=await context.activity.applyEnchantment("sEWDFOuWn47L5860",weapon);if(!enchantment)throw Error("The native Sacred Weapon enchantment could not be applied.");await enchantment.setFlag(ID,"sacredWeaponControl",control.uuid);}
  if(enchantment.disabled||enchantment.duration?.expired)await enchantment.update({disabled:false,start:control.start,duration:{value:600,units:"seconds",expiry:"turnStart",expired:false}});

 }
 const records=await syncPaladinLights(actor,{removed:[...legacy,...(removed?[removed]:[])]});
 for(const control of current){const state=flag(control,"sacredWeapon");if(active(control)&&JSON.stringify(state.lights??[])!==JSON.stringify(records))await control.setFlag(ID,"sacredWeapon",{...state,lights:records});}
}
export async function activateSacredWeapon(actor,weapon,user=game.user){
 return enqueue(async()=>{
  const context=sacredContext(actor,weapon);if(!context||!actor.isOwner||!(user.isGM||actor.testUserPermission?.(user,"OWNER"))||weapon.system?.equipped!==true)throw Error("Sacred Weapon requires your equipped melee weapon and native Devotion feature.");
  const current=controls(actor).find(e=>active(e)&&flag(e,"sacredWeapon").weapon===weapon.uuid);if(current)return current;
  if(!context.available)throw Error("No Channel Divinity uses remain.");
  const weaponName=weapon.name,spent=Number(context.resource.system.uses.spent??0);let charged=false,control,enchantment,committed=false;
  try{
   await context.resource.update({"system.uses.spent":spent+1});charged=true;
   enchantment=await context.activity.applyEnchantment("sEWDFOuWn47L5860",weapon);if(!enchantment)throw Error("The native Sacred Weapon enchantment could not be applied.");
   [control]=await actor.createEmbeddedDocuments("ActiveEffect",[{name:"Sacred Weapon — "+weapon.name,img:context.feature.img,type:"base",disabled:false,transfer:false,origin:actor.uuid,system:{changes:[],origin:{actor:actor.uuid,item:context.feature.uuid}},statuses:[],start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:600,units:"seconds",expiry:"turnStart",expired:false},flags:{[ID]:{sacredWeapon:{weapon:weapon.uuid,feature:context.feature.uuid,lights:[]}},dnd5e:{isTemporary:true},autoanimations:{version:5,isEnabled:false,isCustomized:false,killAnim:true}}}]);
   await enchantment.setFlag(ID,"sacredWeaponControl",control.uuid);
   for(const old of controls(actor).filter(e=>e!==control)){await old.delete();await synchronizeSacredWeapon(actor,old);}
   await synchronizeSacredWeapon(actor);
   committed=true;await paladinFeatureNotice(actor,{feature:"sacred-weapon",weapon:weaponName,user});return control;
  }finally{if(!committed){if(control){await control.delete();await syncPaladinLights(actor,{removed:[control]});}if(enchantment)await enchantment.delete();if(charged)await context.resource.update({"system.uses.spent":spent});}}
 });
}
async function activateRequest(actor,weapon){
 const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return activateSacredWeapon(actor,weapon);
 const id=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{requests.delete(id);reject(Error("The GM did not answer the Sacred Weapon request."));},15000);requests.set(id,{resolve,reject,timer});game.socket.emit("module."+ID,{action:"sacredWeaponActivate",id,actor:actor.uuid,weapon:weapon.uuid,user:game.user.id,gm:gm.id});});
}
export async function activateForAttack(app){
 const activity=app.config.subject,actor=activity.actor??activity.item?.actor,weapon=values(actor.items).find(i=>i.id===activity.item.id);
 await activateRequest(actor,weapon);
 // Reopen through native attack configuration so AC5e and all modifiers see
 // the actual enchantment, rather than patching a cached attack formula.
 const fresh=weapon.system.activities.get(activity.id);if(!fresh)throw Error("The enchanted attack activity could not be found.");
 const config={};for(const k of ["ability","attackMode","ammunition","mastery"])if(app.config[k]!==undefined)config[k]=app.config[k];
 const data=foundry.utils.deepClone(app.message?.data??{});delete data._id;delete data.rolls;
 await app.close();const dialog=globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("attack",{configure:true})??{configure:true};return fresh.rollAttack(config,dialog,{data});
}
export function addSacredWeaponButton(app){
 if(game.settings.get(ID,"sacredWeaponAutomation")!==true||app.config?.subject?.type!=="attack")return;
 const activity=app.config.subject,actor=activity.actor??activity.item?.actor,weapon=values(actor?.items).find(i=>i.id===activity.item?.id),context=sacredContext(actor,weapon);
 if(!context||!actor.isOwner||app.element.querySelector('[data-rsa-sacred-weapon]'))return;
 const section=app.element.querySelector('[data-application-part="configuration"] fieldset')??app.element.querySelector('fieldset');if(!section)return;
 const button=document.createElement("button");button.type="button";button.dataset.rsaSacredWeapon="";const existing=controls(actor).some(e=>active(e)&&flag(e,"sacredWeapon").weapon===weapon.uuid);
 button.textContent=existing?"Sacred Weapon — Active":"Activate Sacred Weapon";button.disabled=existing||!context.available||weapon.system.equipped!==true;
 button.dataset.tooltip="Spend one Channel Divinity use to imbue this weapon for 10 minutes. The attack prompt refreshes with its native bonus. Disable Sacred Weapon in your temporary effects to stop the enchantment and light.";
 button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await activateForAttack(app);}catch(error){report(error);button.disabled=false;}});section.append(button);
}
function report(error){console.error("Sacred Weapon",error);ui.notifications.error(error.message);}
function sync(actor,removed){if(authority()&&actor)enqueue(()=>synchronizeSacredWeapon(actor,removed)).catch(report);}
Hooks.once("init",()=>game.settings.register(ID,"sacredWeaponAutomation",{name:"Sacred Weapon Assistance",hint:"Activate the native Devotion enchantment from melee weapon attack configuration. Spend one Channel Divinity use and manage a temporary actor effect that controls the weapon enchantment and token light. Disable/delete it or unequip the weapon to end the benefits.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationSacredWeapon={addSacredWeaponButton};
 for(const event of ["createActiveEffect","updateActiveEffect"])Hooks.on(event,e=>{if(flag(e,"sacredWeapon")||flag(e,"sacredWeaponControl"))sync(e.actor??e.parent?.actor??e.parent);});
 Hooks.on("deleteActiveEffect",e=>{if(flag(e,"sacredWeapon"))sync(e.actor??e.parent,e);});
 Hooks.on("updateItem",item=>{if(item.type==="weapon"&&controls(item.actor).length)sync(item.actor);});
 Hooks.on("deleteItem",item=>{if(item.actor&&controls(item.actor).length)sync(item.actor);});
 const expiryActors=()=>new Set([...values(game.actors),...values(globalThis.canvas?.scene?.tokens).map(t=>t.actor)].filter(a=>a&&controls(a).length));
 Hooks.on("updateWorldTime",()=>{for(const actor of expiryActors())sync(actor);});
 Hooks.on("updateCombat",()=>{for(const actor of expiryActors())sync(actor);});
 Hooks.on("createToken",token=>sync(token.actor));Hooks.on("canvasReady",()=>{for(const actor of new Set(values(canvas.scene?.tokens).map(t=>t.actor).filter(Boolean)))sync(actor);});
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="sacredWeaponResult"&&packet.user===game.user.id){const p=requests.get(packet.id);if(!p)return;requests.delete(packet.id);clearTimeout(p.timer);packet.error?p.reject(Error(packet.error)):p.resolve(true);return;}
  if(packet?.action!=="sacredWeaponActivate"||!authority()||packet.gm!==game.user.id)return;
  const user=game.users.get(packet.user),actor=globalThis.fromUuidSync?.(packet.actor,{strict:false}),weapon=values(actor?.items).find(i=>i.uuid===packet.weapon);if(!user?.active||!actor||!weapon)return;
  activateSacredWeapon(actor,weapon,user).then(()=>game.socket.emit("module."+ID,{action:"sacredWeaponResult",id:packet.id,user:user.id}),error=>game.socket.emit("module."+ID,{action:"sacredWeaponResult",id:packet.id,user:user.id,error:error.message}));
 });
});
