const ID="ugmuls-5-5e-automation";
const enabled=()=>game.settings.get(ID,"defensiveTacticsAutomation")===true;
export const tacticsFeature=actor=>Array.from(actor?.items?.values?.()??actor?.items??[]).find(i=>i.type==="feat"&&(i.identifier??i.system?.identifier)==="defensive-tactics"&&i.system?.source?.rules!=="2014");
const values=c=>Array.from(c?.values?.()??c??[]),itemKey=i=>i?.identifier??i?.system?.identifier,optionQueues=new Map(),selectorWrapped=new WeakSet();
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
export function tacticsOption(actor){
 const chosen=values(actor?.effects).find(e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&flag(e,"hunterTacticsOption"));
 if(chosen)return flag(chosen,"hunterTacticsOption").choice;
 return null;
}
export function isTacticsChoice(activity){return enabled()&&flag(activity?.item,"hunterTacticsSelector")===true;}
export function prepareTacticsSelector(item,id){
 const data=item.toObject(),use=data.system.activities[id];if(!use)throw Error("Defensive Tactics activity is missing.");
 data.flags??={};data.flags[ID]={...data.flags[ID],hunterTacticsSelector:true};data.effects=[];data.system.activities={[id]:use};
 use.type="utility";use.name="Choose Defensive Tactics";delete use.damage;use.effects=[];use.appliedEffects=[];use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.roll={prompt:false,visible:false,formula:""};use.target={override:true,prompt:false,template:{type:""},affects:{type:"self",choice:false}};
 return {data,id};
}
export function installTacticsSelector(Type){
 let proto=Type?.prototype;while(proto&&!Object.hasOwn(proto,"_createUsageMessage"))proto=Object.getPrototypeOf(proto);
 if(!proto||selectorWrapped.has(proto)||typeof proto.use!=="function")return;selectorWrapped.add(proto);const original=proto.use;
 proto.use=function(usage={},dialog={},message={}){
  if(!enabled()||itemKey(this.item)!=="defensive-tactics"||this.item.system?.source?.rules==="2014"||isTacticsChoice(this))return original.call(this,usage,dialog,message);
  const {data,id}=prepareTacticsSelector(this.item,this.id),helper=new CONFIG.Item.documentClass(data,{parent:this.actor??this.item.actor});helper.prepareFinalAttributes?.();
  return original.call(helper.system.activities.get(id),{...usage,consume:false,subsequentActions:false,create:{...usage.create,measuredTemplate:false}},{...dialog,configure:false},{...message,data:{...message.data,flags:{...message.data?.flags,[ID]:{...message.data?.flags?.[ID],activityOverrideData:data,riderTriggered:true}}}});
 };
}
export function selectTacticsOption(card,choice,user=game.user){
 const activity=card?.getAssociatedActivity?.(),actor=card?.getAssociatedActor?.()??activity?.actor;
 if(!isTacticsChoice(activity))return Promise.reject(Error("That is not a Defensive Tactics choice card."));
 return setTacticsOption(actor,choice,user,card);
}
export function setTacticsOption(actor,choice,user=game.user,card=null){
 if(!enabled()||!actor?.isOwner||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||!["escape","multiattack"].includes(choice))return Promise.reject(Error("Only the Ranger's owner or GM can choose Defensive Tactics."));
 const task=(optionQueues.get(actor.uuid)??Promise.resolve()).catch(()=>{}).then(async()=>{
  const feature=tacticsFeature(actor);if(itemKey(feature)!=="defensive-tactics")throw Error("The Ranger no longer owns Defensive Tactics.");
  const owned=values(actor.effects).filter(e=>flag(e,"hunterTacticsOption")),existing=owned[0];
  const data={name:"Defensive Tactics — "+(choice==="escape"?"Escape the Horde":"Multiattack Defense"),img:feature.img??"icons/svg/target.svg",type:"base",disabled:false,transfer:false,origin:feature.uuid,duration:{value:null,units:"seconds",expiry:null,expired:false},system:{changes:[],origin:{actor:actor.uuid,item:feature.uuid,message:card?.uuid??null}},flags:{[ID]:{hunterTacticsOption:{item:feature.uuid,choice}}}};
  if(existing){if(flag(existing,"hunterTacticsOption")?.choice!==choice||existing.disabled)await existing.update(data);}else await actor.createEmbeddedDocuments("ActiveEffect",[data]);
  if(owned.length>1)await actor.deleteEmbeddedDocuments("ActiveEffect",owned.slice(1).map(e=>e.id));
  if(card)globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return choice;
 });optionQueues.set(actor.uuid,task);return task.finally(()=>{if(optionQueues.get(actor.uuid)===task)optionQueues.delete(actor.uuid);});
}
export function renderTacticsSelector(card,html){
 const root=html?.[0]??html,activity=card?.getAssociatedActivity?.();if(!root?.querySelectorAll||!isTacticsChoice(activity))return;
 root.querySelectorAll(".rsa-tactics-selector,[data-rsa-retarget]").forEach(n=>n.remove());
 const actor=card.getAssociatedActor?.()??activity.actor;if(card.isContentVisible===false||!(game.user.isGM||actor?.isOwner))return;
 const section=document.createElement("div");section.className="rsa-tactics-selector";section.style.marginTop="8px";
 const info=document.createElement("p");info.textContent="Choose Defensive Tactics. Selecting an option replaces your previous choice. Your selected defense applies automatically when its trigger is identified.";section.append(info);
 for(const [choice,label]of [["escape","Escape the Horde"],["multiattack","Multiattack Defense"]]){
  const button=document.createElement("button");button.type="button";button.textContent=(tacticsOption(actor)===choice?"✓ ":"")+label;button.style.marginBottom="6px";
  button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await selectTacticsOption(card,choice);}catch(error){ui.notifications.error(error.message);}finally{button.disabled=false;}});section.append(button);
 }(root.querySelector(".chat-card")??root).append(section);
}

const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),stamp=()=>game.combat?.started?game.combat.id+":"+game.combat.round+":"+game.combat.turn:null,resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null,running=new Set();let bridge=false;
export function tacticsDisadvantage(attacker,target){
 const defender=target?.actor??target,source=attacker?.actor??attacker;
 if(!enabled()||!tacticsFeature(defender))return false;
 const choice=tacticsOption(defender);if(choice==="escape")return game.combat?.started===true&&game.combat.combatant?.actor?.uuid===defender.uuid;
 return choice==="multiattack"&&!!stamp()&&values(defender.effects).some(e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&flag(e,"defensiveHit")?.attacker===source?.uuid&&flag(e,"defensiveHit")?.turn===stamp());
}
function attackContext(config,message){const activity=config.subject,actor=activity?.actor??activity?.item?.actor,recorded=message?.data?.system?.targets,targets=recorded?.length?recorded:values(game.user.targets).map(t=>({token:(t.document??t).uuid}));return{actor,target:targets.length===1?resolve(targets[0].token):null};}
export function tacticsDefaults(config,dialog,message,{force=false}={}){
 if(!force&&bridge&&game.modules?.get?.("automated-conditions-5e")?.active||config.subject?.type!=="attack")return;
 const c=attackContext(config,message);
 if(!tacticsDisadvantage(c.actor,c.target))return;
 config.disadvantage=true;for(const roll of config.rolls??[]){roll.options??={};const adv=!!(config.advantage||roll.options.advantage||roll.options.advantageMode===1);Object.assign(roll.options,{disadvantage:true,advantage:adv,advantageMode:adv?0:-1});}dialog.options??={};dialog.options.defaultButton=config.advantage||config.rolls?.[0]?.options.advantage?"normal":"disadvantage";
}
export function prepareTacticsButtons(app,context){const dialog={options:{}};tacticsDefaults(app.config,dialog,app.message,{force:true});const selected=dialog.options.defaultButton;if(selected)for(const k of ["advantage","normal","disadvantage"])if(context.buttons?.[k])context.buttons[k].default=k===selected;return selected;}
export function recordDefensiveTurn(card){if(enabled()&&card.type==="attack"&&card.rolls?.length)card.updateSource({["flags."+ID+".defensiveAttackTurn"]:stamp()});}
export async function applyDefensiveHit(card){
 if(!authority()||!enabled()||card?.type!=="attack"||!card.rolls?.length||!stamp()||flag(card,"defensiveAttackTurn")!==stamp()||running.has(card.id))return;
 const attacker=card.getAssociatedActor?.();if(!attacker?.uuid)return;running.add(card.id);
 try{
 const targets=values(card.system?.evaluatedTargets),current=targets.map(t=>t.token),previous=flag(card,"defensiveHitTargets")??[];
 for(const uuid of previous.filter(uuid=>!current.includes(uuid))){const actor=resolve(uuid)?.actor,ids=values(actor?.effects).filter(e=>flag(e,"defensiveHit")?.attack===card.id).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);}
 for(const t of targets){const target=resolve(t.token),actor=target?.actor;if(!actor)continue;const old=values(actor.effects).filter(e=>flag(e,"defensiveHit")?.attack===card.id);
  if(t.isMiss!==false||tacticsOption(actor)!=="multiattack"){if(old.length)await actor.deleteEmbeddedDocuments("ActiveEffect",old.map(e=>e.id));continue;}
  if(old.length||!tacticsFeature(actor))continue;
  await actor.createEmbeddedDocuments("ActiveEffect",[{name:"Multiattack Defense — "+(attacker.name??"Attacker"),img:tacticsFeature(actor).img??"icons/svg/shield.svg",type:"base",disabled:false,transfer:false,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:null,units:"seconds",expiry:null,expired:false},system:{changes:[],origin:{actor:actor.uuid,item:tacticsFeature(actor).uuid,message:card.uuid}},flags:{dnd5e:{isTemporary:true},[ID]:{defensiveHit:{attacker:attacker.uuid,turn:stamp(),attack:card.id,combat:game.combat.id}}}}]);
 }
 if(JSON.stringify(previous)!==JSON.stringify(current))await card.setFlag(ID,"defensiveHitTargets",current);
 }finally{running.delete(card.id);}
}
export async function expireDefensiveHits(combat,changes={},ending=false){
 if(!authority()||!ending&&!("turn"in changes||"round"in changes||changes.started===false))return;
 const actors=new Map([...values(game.actors),...values(globalThis.canvas?.scene?.tokens).map(t=>t.actor),...values(combat.combatants).map(c=>c.actor)].filter(Boolean).map(a=>[a.uuid,a]));
 for(const actor of actors.values()){const ids=values(actor.effects).filter(e=>{const m=flag(e,"defensiveHit");return m?.combat===combat.id&&(ending||changes.started===false||m.turn!==stamp());}).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);}
}
export function registerTactics(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return bridge;
 try{bridge=!!api.register({key:"rsaDefensiveTactics",scope:"universal",hook:"attack",target:"subject",mode:"disadvantage",name:"Defensive Tactics",persistent:false,evaluate:s=>tacticsDisadvantage(resolve(s.actorUuid),resolve(s.opponentUuid)??resolve(s.opponentActorUuid))});}catch(error){console.warn("Defensive Tactics integration",error);bridge=false;}return bridge;
}
function report(error){console.error("Defensive Tactics",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"defensiveTacticsAutomation",{name:"Defensive Tactics Assistance",hint:"Privately choose Escape the Horde or Multiattack Defense after Short/Long Rests. Escape the Horde treats attacks against the Ranger during their own turn as Opportunity Attacks and recommends Disadvantage. Multiattack Defense affects further attacks from a creature that hit the Ranger during the same turn.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerTactics(usageRules));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationTactics={isTacticsChoice,prepareTacticsButtons};
 for(const t of Object.values(CONFIG.DND5E?.activityTypes??{}))installTacticsSelector(t.documentClass);
 registerTactics();Hooks.on("dnd5e.renderChatMessage",renderTacticsSelector);Hooks.on("dnd5e.preRollAttackV2",tacticsDefaults);Hooks.on("preCreateChatMessage",recordDefensiveTurn);
 Hooks.on("createChatMessage",c=>applyDefensiveHit(c).catch(report));Hooks.on("updateChatMessage",(c,d)=>{if("rolls"in d||"system.targets"in d||d.system?.targets)applyDefensiveHit(c).catch(report);});
 Hooks.on("updateCombat",(c,d)=>expireDefensiveHits(c,d).catch(report));Hooks.on("deleteCombat",c=>expireDefensiveHits(c,{},true).catch(report));
});
