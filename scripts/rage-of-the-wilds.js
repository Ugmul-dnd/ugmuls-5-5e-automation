import {createEventQueue} from "./shared-activity-card.js";
import {isRageEffect} from "./primal-knowledge.js";
import {selectSaveUser} from "./save-prompts.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,doc=t=>t?.document??t,prompts=new Set();let bridge=false,lionBridge=false;const starting=new Set(),wrapped=new WeakSet();
const enabled=()=>game.settings.get(ID,"wildRageAutomation")===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const live=e=>e&&!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
const feature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="rage-of-the-wilds"&&i.system?.source?.rules!=="2014");
export const powerFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="power-of-the-wilds"&&i.system?.source?.rules!=="2014");
const validChoice=(actor,choice,power)=>["eagle","bear","wolf"].includes(choice)&&(!powerFeature(actor)||["falcon","lion","ram"].includes(power));
const activeRages=actor=>values(actor?.effects).filter(e=>live(e)&&isRageEffect(actor,e));
const resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
const nativeIds={bear:"5ZM8J0DQgUXj1GT5",wolf:"7G8UJy5D9CTxeEVw"};
function scenes(){return values(game.scenes??[globalThis.canvas?.scene].filter(Boolean));}
export function wildRageBenefitData(item,rage,choice,selection){
 const native=values(item.effects).find(e=>e.id===nativeIds[choice]);if(!native)throw Error("Rage of the Wilds is missing its native "+choice+" effect.");
 const data=native.toObject();delete data._id;Object.assign(data,{disabled:false,transfer:false,origin:item.uuid,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:null,units:"seconds",expiry:null,expired:false}});
 data.system={...data.system,origin:{...data.system?.origin,actor:item.actor.uuid,item:item.uuid,effect:rage.uuid}};
 data.flags??={};data.flags[ID]={...data.flags[ID],wildRageBenefit:{rage:rage.uuid,session:selection.id,choice,item:item.uuid}};data.flags.dnd5e={...data.flags.dnd5e,isTemporary:true};return data;
}
export async function syncWolfRegions(actor,rage,selection,kind="wolf"){
 const auraKey=kind+"Aura",animal=kind==="wolf"?"Wolf":"Lion";
 const wolf=enabled()&&feature(actor)&&rage&&live(rage)&&selection?.phase==="selected"&&(kind==="wolf"?selection.choice==="wolf":powerFeature(actor)&&selection.power==="lion");
 for(const scene of scenes()){
  const existing=values(scene.regions).filter(r=>flag(r,auraKey)?.actor===actor.uuid),wanted=wolf?values(scene.tokens).filter(t=>t.actor?.uuid===actor.uuid):[],keep=new Set();
  for(const token of wanted){
   const scale=Number(scene.grid.size)/Number(scene.grid.distance);if(!Number.isFinite(scale)||scale<=0)continue;
   const radius=5*(/^(m|meters?|metres?)$/i.test(String(scene.grid.units??"ft"))?0.3048:1)*scale;
   const levels=values(token.levels);if(!levels.length&&token.level)levels.push(token.level.id??token.level);if(!levels.length&&globalThis.canvas?.scene===scene&&canvas.level?.id)levels.push(canvas.level.id);
   const data={name:(kind==="wolf"?"Rage":"Power")+" of the "+animal+" — "+token.name,color:game.user.color,shapes:[{type:"emanation",gridBased:true,radius,base:{type:"token",x:token.x,y:token.y,width:token.width,height:token.height,shape:token.shape,rotation:0}}],attachment:{token:token.id},levels,restriction:{enabled:true,type:"move"},visibility:CONST.REGION_VISIBILITY.LAYER_UNLOCKED,highlightMode:"coverage",flags:{[ID]:{[auraKey]:{actor:actor.uuid,token:token.uuid,rage:rage.uuid,session:selection.id}}}};
   const region=existing.find(r=>flag(r,auraKey)?.token===token.uuid&&!keep.has(r.id));
   if(region){keep.add(region.id);const old=region.shapes?.[0];if(flag(region,auraKey).session!==selection.id||old?.gridBased!==true||old.radius!==radius||region.visibility!==data.visibility||["width","height","shape"].some(k=>old?.base?.[k]!==token[k])||JSON.stringify(values(region.levels))!==JSON.stringify(levels))await region.update(data);}
   else for(const made of await scene.createEmbeddedDocuments("Region",[data]))keep.add(made.id);
  }
  const remove=existing.filter(r=>!keep.has(r.id)).map(r=>r.id);if(remove.length)await scene.deleteEmbeddedDocuments("Region",remove);
 }
}
export function syncWildRage(actor,removed){return enqueue(async()=>{
 if(!actor||!authority()||!enabled())return;
 const item=feature(actor),rage=activeRages(actor).find(e=>e!==removed&&e.uuid!==removed?.uuid);
 const native=values(item?.effects).filter(e=>Object.values(nativeIds).includes(e.id));
 for(const effect of native)if(effect.transfer&&!effect.disabled)await effect.update({disabled:true});
 const refs=new Set(native.map(e=>e.uuid)),managed=values(actor.effects).filter(e=>flag(e,"wildRageBenefit")||refs.has(e._stats?.duplicateSource)||refs.has(e._stats?.compendiumSource));
 if(!item||!rage){if(managed.length)await actor.deleteEmbeddedDocuments("ActiveEffect",managed.map(e=>e.id));await syncWolfRegions(actor,null,null);await syncWolfRegions(actor,null,null,"lion");await syncPowerBenefit(actor,null,null);return;}
 let selection=flag(rage,"wildRage");
 if(!selection){
  const reference=rage.system?.origin?.message,card=typeof reference==="string"?game.messages?.get?.(reference.replace(/^ChatMessage\./,"")):reference;
  const selected=flag(card,"wildRageChoices");
  selection={id:foundry.utils.randomID(),phase:"pending"};
  if(selected?.actor===actor.uuid&&validChoice(actor,selected.choice,selected.power))Object.assign(selection,{phase:"selected",choice:selected.choice,power:selected.power});
  await rage.setFlag(ID,"wildRage",selection);
 }
 if(selection.phase==="selected"&&!validChoice(actor,selection.choice,selection.power)){selection={...selection,phase:"pending",prompted:false};await rage.setFlag(ID,"wildRage",selection);}
 if(selection.phase==="selected"&&["bear","wolf"].includes(selection.choice)){
  const existing=managed.find(e=>{const m=flag(e,"wildRageBenefit");return m?.rage===rage.uuid&&m.session===selection.id&&m.choice===selection.choice&&live(e);});
  const remove=managed.filter(e=>e!==existing).map(e=>e.id);if(remove.length)await actor.deleteEmbeddedDocuments("ActiveEffect",remove);
  if(!existing)await actor.createEmbeddedDocuments("ActiveEffect",[wildRageBenefitData(item,rage,selection.choice,selection)]);
 }else if(managed.length)await actor.deleteEmbeddedDocuments("ActiveEffect",managed.map(e=>e.id));
 await syncWolfRegions(actor,rage,selection);
 await syncWolfRegions(actor,rage,selection,"lion");await syncPowerBenefit(actor,rage,selection);
 if(selection.phase==="pending"&&!selection.prompted){
  selection={...selection,prompted:true};await rage.setFlag(ID,"wildRage",selection);
  const user=selectSaveUser(actor,game.users,game.users.activeGM);if(user){const packet={action:"wildRagePrompt",actor:actor.uuid,rage:rage.uuid,session:selection.id,user:user.id,source:game.user.id};if(user.id===game.user.id)showWildRageChoice(packet).catch(report);else game.socket.emit("module."+ID,packet);}
 }
});}
export async function selectWildRage(actor,rageUuid,session,choice,user=game.user,power){
 const selected=await enqueue(async()=>{
  if(!authority()||!enabled()||!validChoice(actor,choice,power)||!actor?.testUserPermission?.(user,"OWNER")||!feature(actor))return false;
  const rage=activeRages(actor).find(e=>e.uuid===rageUuid),selection=flag(rage,"wildRage");if(!rage||selection?.id!==session||selection.phase!=="pending")return false;
  await rage.setFlag(ID,"wildRage",{...selection,phase:"selected",choice,power});return true;
 });
 if(selected){await syncWildRage(actor);globalThis.Ugmuls55eAutomationChatRefresh?.request("wildRage",actor);}return selected;
}
export async function showWildRageChoice(packet){
 if(packet.user!==game.user.id||game.users.activeGM?.id!==packet.source)return;
 const actor=resolve(packet.actor),rage=resolve(packet.rage),selection=flag(rage,"wildRage");if(!actor?.isOwner||!live(rage)||!feature(actor)||selection?.id!==packet.session||selection.phase!=="pending"||prompts.has(packet.session))return;
 prompts.add(packet.session);try{
  const choice=await chooseWildRage(actor);
  if(!choice)return;
  if(authority())await selectWildRage(actor,rage.uuid,packet.session,choice.choice,game.user,choice.power);
  else game.socket.emit("module."+ID,{action:"wildRageSelect",actor:actor.uuid,rage:rage.uuid,session:packet.session,choice:choice.choice,power:choice.power,user:game.user.id,gm:game.users.activeGM?.id});
 }finally{prompts.delete(packet.session);}
}
export function wolfAdvantage(attacker,target){
 if(!enabled())return false;attacker=doc(attacker);target=doc(target);
 if(!attacker?.actor||!target?.actor||attacker.parent?.id!==target.parent?.id)return false;
 const scene=target.parent;
 return values(scene.tokens).some(source=>{
  if(!source.actor||source.actor.uuid===attacker.actor.uuid||!source.disposition||source.disposition!==attacker.disposition||!target.disposition||Math.sign(source.disposition)===Math.sign(target.disposition)||!feature(source.actor))return false;
  return activeRages(source.actor).some(rage=>{const selection=flag(rage,"wildRage");if(selection?.phase!=="selected"||selection.choice!=="wolf")return false;
   return values(scene.regions).some(region=>{const m=flag(region,"wolfAura");return m?.token===source.uuid&&m.rage===rage.uuid&&m.session===selection.id&&target.testInsideRegion?.(region);});
  });
 });
}
export function registerWolfRule(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return bridge;
 bridge=!!api.register({key:"rsaRageOfTheWolf",scope:"universal",hook:"attack",target:"subject",mode:"advantage",name:"Rage of the Wolf",persistent:false,evaluate:s=>wolfAdvantage(resolve(s.tokenUuid),resolve(s.opponentUuid))});return bridge;
}
export function wolfAttackDefaults(config,dialog,message){
 if(bridge&&game.modules?.get?.("automated-conditions-5e")?.active||config.subject?.type!=="attack")return;
 const activity=config.subject,source=doc(activity.getUsageToken?.()),recorded=message?.data?.system?.targets;
 const targets=recorded?.length?recorded.map(t=>resolve(t.token)).filter(Boolean):values(game.user.targets).map(doc);
 if(targets.length!==1||!wolfAdvantage(source,targets[0]))return;
 const dis=config.disadvantage===true||(config.rolls??[]).some(r=>r.options?.disadvantage||r.options?.advantageMode===-1);
 config.advantage=true;for(const roll of config.rolls??[]){roll.options??={};Object.assign(roll.options,{advantage:true,advantageMode:dis?0:1});}dialog.options??={};dialog.options.defaultButton=dis?"normal":"advantage";
}
export function resetWildRage(effect,changes){
 if(effect.parent?.documentName!=="Actor"||!isRageEffect(effect.parent,effect))return;
 const newOrigin=changes["system.origin.message"]??changes.system?.origin?.message;
 const revived=(changes["duration.expired"]??changes.duration?.expired)===false&&(effect.duration?.expired||effect.system?.expired);
 if((revived||changes.disabled===false&&effect.disabled||newOrigin&&newOrigin!==effect.system?.origin?.message)&&!changes["flags."+ID+".wildRage"]&&!changes.flags?.[ID]?.wildRage)changes["flags."+ID+".-=wildRage"]=null;
}
export function renderWildRage(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const{card,node}of entries){node.querySelectorAll(':scope > .rsa-wild-rage-choice').forEach(n=>n.remove());if(card.isContentVisible===false||card.type!=="usage"||key(card.getAssociatedItem?.())!=="rage")continue;
  const actor=card.getAssociatedActor?.();if(!actor?.isOwner||!feature(actor))continue;
  const rage=activeRages(actor)[0],selection=flag(rage,"wildRage");if(!selection)continue;
  const origin=rage.system?.origin?.message;if(origin&&origin!==card.id&&origin!==card.uuid)continue;
  const div=document.createElement('div');div.className='rsa-attack-actions rsa-wild-rage-choice';
  if(selection.phase==="selected"){div.textContent='Rage of the Wilds: '+selection.choice[0].toUpperCase()+selection.choice.slice(1)+(selection.power?" · Power of the Wilds: "+selection.power[0].toUpperCase()+selection.power.slice(1):"");}
  else{const button=document.createElement('button');button.type='button';button.textContent='Choose Rage of the Wilds';button.addEventListener('click',()=>{const packet={action:'wildRageRetry',actor:actor.uuid,rage:rage.uuid,session:selection.id,user:game.user.id,gm:game.users.activeGM?.id};if(authority())retryChoice(packet).catch(report);else game.socket.emit('module.'+ID,packet);});div.append(button);}node.append(div);
 }
}
async function retryChoice(packet){if(!authority()||packet.gm!==game.user.id)return;const actor=resolve(packet.actor),user=game.users.get(packet.user),rage=resolve(packet.rage),selection=flag(rage,"wildRage");if(!actor||!user?.active||!actor.testUserPermission(user,'OWNER')||rage?.parent?.uuid!==actor.uuid||selection?.id!==packet.session||selection.phase!=="pending")return;const prompt={action:'wildRagePrompt',actor:actor.uuid,rage:rage.uuid,session:packet.session,user:user.id,source:game.user.id};if(user.id===game.user.id)await showWildRageChoice(prompt);else game.socket.emit('module.'+ID,prompt);}
function report(error){console.error('Rage of the Wilds',error);ui.notifications.error(error.message);}
function allActors(){return new Map([...values(game.actors),...scenes().flatMap(s=>values(s.tokens).map(t=>t.actor))].filter(Boolean).map(a=>[a.uuid,a])).values();}
Hooks.once('init',()=>game.settings.register(ID,'wildRageAutomation',{name:'Wild Heart Rage Choices',hint:'Choose Rage of the Wilds and, when owned, Power of the Wilds before activating Rage. Bear resistance, Wolf/Lion contextual attack auras, Falcon flight and a Ram hit-card option follow the selected Rage. Falcon armor eligibility stays manual.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.on('ac5e.usageRulesReady',({usageRules}={})=>{registerWolfRule(usageRules);registerLionRule(usageRules);});
Hooks.once('ready',()=>{
 installWildRageUse(CONFIG.DND5E?.activityTypes?.utility?.documentClass);registerWolfRule();registerLionRule();Hooks.on("dnd5e.preRollAttackV2",lionAttackDefaults);Hooks.on('dnd5e.preRollAttackV2',wolfAttackDefaults);Hooks.on('preUpdateActiveEffect',resetWildRage);Hooks.on('dnd5e.renderChatMessage',renderWildRage);
 for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect'])Hooks.on(event,(effect,changes)=>{if(effect.parent?.documentName==='Actor'&&isRageEffect(effect.parent,effect))syncWildRage(effect.parent,event==='deleteActiveEffect'?effect:null).catch(report);});
 for(const event of ['createItem','updateItem','deleteItem'])Hooks.on(event,item=>{if(['rage','rage-of-the-wilds','power-of-the-wilds'].includes(key(item)))syncWildRage(item.actor).catch(report);});
 Hooks.on('createToken',token=>{if(feature(token.actor))syncWildRage(token.actor).catch(report);});
 Hooks.on('deleteToken',token=>{if(feature(token.actor))syncWildRage(token.actor).catch(report);});
 Hooks.on('updateToken',(token,changes)=>{if(['width','height','shape','level','levels','actorId','actorLink'].some(k=>k in changes)&&feature(token.actor))syncWildRage(token.actor).catch(report);});
 const synchronize=()=>{if(authority())for(const actor of allActors())if(feature(actor)||values(actor.effects).some(e=>flag(e,'wildRageBenefit')||flag(e,'wildPowerBenefit')))syncWildRage(actor).catch(report);};Hooks.on('canvasReady',synchronize);synchronize();
 game.socket.on('module.'+ID,packet=>{
  if(packet?.action==='wildRagePrompt')showWildRageChoice(packet).catch(report);
  if(packet?.action==='wildRageRetry')retryChoice(packet).catch(report);
  if(packet?.action==='wildRageSelect'&&authority()&&packet.gm===game.user.id){const actor=resolve(packet.actor),user=game.users.get(packet.user);if(actor&&user?.active)selectWildRage(actor,packet.rage,packet.session,packet.choice,user,packet.power).catch(report);}
 });
});

// Both columns are chosen locally before native use, resource consumption or Rage effects.
export async function chooseWildRage(actor){
 const power=!!powerFeature(actor),column=(name,title,options)=>`<fieldset style="flex:1;min-width:0"><legend>${title}</legend>${options.map(([value,label,description])=>`<label style="display:flex;gap:8px;align-items:start;margin:12px 0"><input type="radio" name="${name}" value="${value}" required><span><strong>${label}</strong><br><small>${description}</small></span></label>`).join("")}</fieldset>`;
 const content=`<p>Choose one benefit in each column before activating Rage.</p><div style="display:flex;gap:16px">${column("wildRageChoice","Rage of the Wilds",[["eagle","Eagle","Dash and Disengage remain manual."],["bear","Bear","Gain the native damage resistances."],["wolf","Wolf","Allies gain Advantage against enemies within 5 feet."]])}${power?column("wildPowerChoice","Power of the Wilds",[["falcon","Falcon","Fly Speed equals Speed. Armor eligibility is handled at the table."],["lion","Lion","Enemies within 5 feet have Disadvantage against other targets."],["ram","Ram","Offer Prone after a melee hit on a Large or smaller creature."]]):""}</div>`;
 return foundry.applications.api.DialogV2.wait({window:{title:power?"Rage & Power of the Wilds":"Rage of the Wilds"},position:{width:power?640:380},content,rejectClose:false,close:()=>null,
  buttons:[{action:"activate",label:"Activate Rage",default:true,callback:(_event,button,dialog)=>{const root=dialog.element,choice=root.querySelector('[name="wildRageChoice"]:checked')?.value,powerChoice=root.querySelector('[name="wildPowerChoice"]:checked')?.value;if(!validChoice(actor,choice,powerChoice))throw Error("Choose one benefit from each available column.");return{choice,power:powerChoice};}},{action:"cancel",label:"Cancel",callback:()=>null}],
  render:(_event,dialog)=>{const root=dialog.element,button=root.querySelector('[data-action="activate"]');const update=()=>{if(button)button.disabled=!validChoice(actor,root.querySelector('[name="wildRageChoice"]:checked')?.value,root.querySelector('[name="wildPowerChoice"]:checked')?.value);};root.addEventListener("change",update);update();}});
}
export function installWildRageUse(Type){
 let prototype=Type?.prototype;while(prototype&&!Object.hasOwn(prototype,"_createUsageMessage"))prototype=Object.getPrototypeOf(prototype);
 if(!prototype||wrapped.has(prototype)||typeof prototype.use!=="function")return;wrapped.add(prototype);const original=prototype.use;
 prototype.use=async function(usage={},dialog={},message={}){
  const actor=this.actor??this.item?.actor;
  // Extension activities are not a new Rage and retain the current choices.
  if(!enabled()||key(this.item)!=="rage"||!feature(actor)||!this.item?.isOwner||!this.item?.isEmbedded||!(values(this.effects).length||this.name?.toLowerCase()==="rage"))return original.call(this,usage,dialog,message);
  if(starting.has(actor.uuid))return;starting.add(actor.uuid);
  try{
   const choices=await chooseWildRage(actor);if(!choices)return;
   if(!validChoice(actor,choices.choice,choices.power))return;
   const data=message.data??{},config={...message,data:{...data,flags:{...data.flags,[ID]:{...data.flags?.[ID],wildRageChoices:{actor:actor.uuid,...choices}}}}};
   return await original.call(this,usage,dialog,config);
  }finally{starting.delete(actor.uuid);}
 };
}
export function powerBenefitData(actor,rage,selection){
 const item=powerFeature(actor),choice=selection.power;
 return {name:"Power of the Wilds — "+choice[0].toUpperCase()+choice.slice(1),img:item.img,type:"base",disabled:false,transfer:false,origin:item.uuid,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:null,units:"seconds",expiry:null,expired:false},
  system:{changes:choice==="falcon"?[{key:"system.attributes.movement.fly",value:"@attributes.movement.speed",type:"override"}]:[],origin:{actor:actor.uuid,item:item.uuid,effect:rage.uuid}},statuses:[],
  flags:{dnd5e:{isTemporary:true},[ID]:{wildPowerBenefit:{rage:rage.uuid,session:selection.id,choice,item:item.uuid}},autoanimations:{version:5,isEnabled:false,isCustomized:false,killAnim:true}}};
}
export async function syncPowerBenefit(actor,rage,selection){
 const managed=values(actor.effects).filter(e=>flag(e,"wildPowerBenefit")),wanted=enabled()&&feature(actor)&&powerFeature(actor)&&live(rage)&&selection?.phase==="selected"&&["falcon","lion","ram"].includes(selection.power);
 const existing=wanted?managed.find(e=>{const m=flag(e,"wildPowerBenefit");return live(e)&&m.rage===rage.uuid&&m.session===selection.id&&m.choice===selection.power;}):null;
 const remove=managed.filter(e=>e!==existing).map(e=>e.id);if(remove.length)await actor.deleteEmbeddedDocuments("ActiveEffect",remove);
 if(wanted&&!existing)await actor.createEmbeddedDocuments("ActiveEffect",[powerBenefitData(actor,rage,selection)]);
}
function selectedPower(actor,power){return !!powerFeature(actor)&&activeRages(actor).some(rage=>{const s=flag(rage,"wildRage");return s?.phase==="selected"&&s.power===power;});}
export function lionDisadvantage(attacker,target){
 if(!enabled())return false;attacker=doc(attacker);target=doc(target);
 if(!attacker?.actor||!target?.actor||attacker.parent?.id!==target.parent?.id)return false;
 // Every Barbarian currently using Lion is exempt, even from another Lion aura.
 if(selectedPower(target.actor,"lion"))return false;
 const scene=attacker.parent;
 return values(scene.tokens).some(source=>{
  if(!source.actor||!source.disposition||!attacker.disposition||Math.sign(source.disposition)===Math.sign(attacker.disposition)||!feature(source.actor)||!powerFeature(source.actor))return false;
  return activeRages(source.actor).some(rage=>{const s=flag(rage,"wildRage");return s?.phase==="selected"&&s.power==="lion"&&values(scene.regions).some(region=>{const m=flag(region,"lionAura");return m?.token===source.uuid&&m.rage===rage.uuid&&m.session===s.id&&attacker.testInsideRegion?.(region);});});
 });
}
export function registerLionRule(api=globalThis.ac5e?.usageRules){
 if(lionBridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return lionBridge;
 lionBridge=!!api.register({key:"rsaPowerOfTheLion",scope:"universal",hook:"attack",target:"subject",mode:"disadvantage",name:"Power of the Lion",persistent:false,evaluate:s=>lionDisadvantage(resolve(s.tokenUuid),resolve(s.opponentUuid))});return lionBridge;
}
export function lionAttackDefaults(config,dialog,message){
 if(lionBridge&&game.modules?.get?.("automated-conditions-5e")?.active||config.subject?.type!=="attack")return;
 const source=doc(config.subject.getUsageToken?.()),recorded=message?.data?.system?.targets,targets=recorded?.length?recorded.map(t=>resolve(t.token)).filter(Boolean):values(game.user.targets).map(doc);
 if(targets.length!==1||!lionDisadvantage(source,targets[0]))return;
 const adv=config.advantage===true||(config.rolls??[]).some(r=>r.options?.advantage||r.options?.advantageMode===1);
 config.disadvantage=true;for(const roll of config.rolls??[]){roll.options??={};Object.assign(roll.options,{disadvantage:true,advantageMode:adv?0:-1});}dialog.options??={};dialog.options.defaultButton=adv?"normal":"disadvantage";
}
const ramQueue=createEventQueue();
export function ramContext(card,tokenUuid,user=game.user,childId){
 const used=flag(card,"wildRam");
 if(!enabled()||card?.type!=="attack"||!card.rolls?.length||used&&used.message!==childId)return null;
 const actor=card.getAssociatedActor?.(),activity=card.getAssociatedActivity?.(),item=powerFeature(actor),ram=values(item?.system?.activities).find(a=>a.id==="e427cUPHqiGCfSoo"||a.name==="Ram");
 const mode=card.system?.mode??card.flags?.dnd5e?.roll?.attackMode??card.rolls?.[0]?.options?.attackMode;
 const melee=activity?.type==="attack"&&activity.attack?.type?.value==="melee"&&mode!=="ranged"&&!String(mode??"").includes("thrown");
 if(!selectedPower(actor,"ram")||!ram||!melee||!(user?.isGM||actor?.testUserPermission?.(user,"OWNER")))return null;
 const targets=values(card.system?.evaluatedTargets).filter(t=>t.isMiss===false&&(!tokenUuid||t.token===tokenUuid)).map(t=>resolve(t.token)).filter(t=>t?.actor&&["tiny","sm","med","lg"].includes(t.actor.system?.traits?.size)&&t.actor.uuid!==actor.uuid);
 return targets.length?{actor,item,ram,targets}:null;
}
export function useWildRam(card,tokenUuid,user=game.user){return ramQueue(async()=>{
 const c=ramContext(card,tokenUuid,user);if(!c||c.targets.length!==1)throw Error("Ram requires an active Ram Rage and a melee hit on a Large or smaller creature.");
 const {actor,item,ram}=c,target=c.targets[0],data=item.toObject(),id=ram.id,use=data.system.activities[id];data.name="Power of the Wilds — Ram";data.system.activities={[id]:use};
 use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};use.range={override:true,units:"any"};
 const helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
 const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false}},{configure:false},{data:{system:{targets:[{token:target.uuid,actor:target.actor.uuid,name:target.name,img:target.texture?.src}]},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,wildRamSource:card.id}}}});
 if(!result?.message)throw Error("Ram could not create its Prone application card.");
 await applyWildRamProne(result.message,target.actor);
 await card.setFlag(ID,"wildRam",{message:result.message.id,target:target.uuid});globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return result;
});}
export function renderWildRam(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const{card,node}of entries){node.querySelectorAll(':scope > .rsa-wild-ram').forEach(n=>n.remove());if(card.isContentVisible===false)continue;const c=ramContext(card);if(!c)continue;
  const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-wild-ram";
  for(const target of c.targets){const button=document.createElement("button");button.type="button";button.textContent=c.targets.length>1?"Ram — "+target.name:"Ram — Prone";button.addEventListener("click",async()=>{button.disabled=true;try{await useWildRam(card,target.uuid);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});controls.append(button);}node.append(controls);
 }
}
Hooks.once("ready",()=>{Hooks.on("dnd5e.renderChatMessage",renderWildRam);});

const ramApplying=new Set();
export async function applyWildRamProne(card,targetActor){
 if(!card||!targetActor||flag(card,"wildRamApplied")||ramApplying.has(card.id))return;
 // The attack's owner creates the card. The active GM applies to unowned enemies.
 if(!authority())return;
 ramApplying.add(card.id);
 try{
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  if(flag(card,"wildRamApplied"))return;
  const activity=card.getAssociatedActivity?.({scaled:true}),effect=values(await activity?.getApplicableEffects?.()).find(e=>e.id==="RwTBtRRgzn0h1AZc"||values(e.statuses).includes("prone"));
  if(!effect)throw Error("Ram's native Prone effect could not be found.");
  const tray=document.createElement("effect-application");tray.chatMessage=card;
  const undo=globalThis.Ugmuls55eAutomationEffectUndo;
  if(!undo?.apply)throw Error("Ram's effect application service is unavailable.");
  await undo.apply(card,card,effect,targetActor,tray);
  await card.setFlag(ID,"wildRamApplied",true);
  await card.setFlag(ID,"outcomeEffectsApplied",true);
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
 }finally{ramApplying.delete(card.id);}
}
Hooks.once("ready",()=>{
 Hooks.on("createChatMessage",card=>{
  if(!authority()||!enabled()||!flag(card,"wildRamSource"))return;
  const source=game.messages.get(flag(card,"wildRamSource")),token=card.system?.targets?.[0]?.token,target=resolve(token),context=ramContext(source,token,game.user,card.id);
  if(!context||!target?.actor||key(card.getAssociatedItem?.()??card.getAssociatedActivity?.()?.item)!=="power-of-the-wilds")return;
  applyWildRamProne(card,target.actor).catch(report);
 });
});
