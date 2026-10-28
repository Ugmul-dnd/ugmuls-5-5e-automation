const ID="ugmuls-5-5e-automation",selected=new WeakMap(),pending=new WeakMap(),reserved=new Map();
const enabled=()=>game.settings.get(ID,"huntersPreyAutomation")===true;
export const preyFeature=actor=>Array.from(actor?.items??[]).find(item=>item.type==="feat"&&
    (["hunters-prey","colossus-slayer"].includes(item.identifier??item.system?.identifier)||/^(hunter[’']?s prey|colossus slayer)$/i.test(item.name?.trim()??"")));
const values=c=>Array.from(c?.values?.()??c??[]),itemKey=i=>i?.identifier??i?.system?.identifier,optionQueues=new Map(),selectorWrapped=new WeakSet();
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
export function preyOption(actor){
 const chosen=values(actor?.effects).find(e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&flag(e,"hunterPreyOption"));
 if(chosen)return flag(chosen,"hunterPreyOption").choice;
 return itemKey(preyFeature(actor))==="colossus-slayer"?"colossus":null;
}
export function isPreyChoice(activity){return enabled()&&flag(activity?.item,"hunterPreySelector")===true;}
export function preparePreySelector(item,id){
 const data=item.toObject(),use=data.system.activities[id];if(!use)throw Error("Hunter's Prey activity is missing.");
 data.flags??={};data.flags[ID]={...data.flags[ID],hunterPreySelector:true};data.effects=[];data.system.activities={[id]:use};
 use.type="utility";use.name="Choose Hunter's Prey";delete use.damage;use.effects=[];use.appliedEffects=[];use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.roll={prompt:false,visible:false,formula:""};use.target={override:true,prompt:false,template:{type:""},affects:{type:"self",choice:false}};
 return {data,id};
}
export function installPreySelector(Type){
 let proto=Type?.prototype;while(proto&&!Object.hasOwn(proto,"_createUsageMessage"))proto=Object.getPrototypeOf(proto);
 if(!proto||selectorWrapped.has(proto)||typeof proto.use!=="function")return;selectorWrapped.add(proto);const original=proto.use;
 proto.use=function(usage={},dialog={},message={}){
  if(!enabled()||itemKey(this.item)!=="hunters-prey"||this.item.system?.source?.rules==="2014"||isPreyChoice(this))return original.call(this,usage,dialog,message);
  const {data,id}=preparePreySelector(this.item,this.id),helper=new CONFIG.Item.documentClass(data,{parent:this.actor??this.item.actor});helper.prepareFinalAttributes?.();
  return original.call(helper.system.activities.get(id),{...usage,consume:false,subsequentActions:false,create:{...usage.create,measuredTemplate:false}},{...dialog,configure:false},{...message,data:{...message.data,flags:{...message.data?.flags,[ID]:{...message.data?.flags?.[ID],activityOverrideData:data,riderTriggered:true}}}});
 };
}
export function selectPreyOption(card,choice,user=game.user){
 const activity=card?.getAssociatedActivity?.(),actor=card?.getAssociatedActor?.()??activity?.actor;
 if(!isPreyChoice(activity))return Promise.reject(Error("That is not a Hunter's Prey choice card."));
 return setPreyOption(actor,choice,user,card);
}
export function setPreyOption(actor,choice,user=game.user,card=null){
 if(!enabled()||!actor?.isOwner||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||!["colossus","horde"].includes(choice))return Promise.reject(Error("Only the Ranger's owner or GM can choose Hunter's Prey."));
 const task=(optionQueues.get(actor.uuid)??Promise.resolve()).catch(()=>{}).then(async()=>{
  const feature=preyFeature(actor);if(itemKey(feature)!=="hunters-prey")throw Error("The Ranger no longer owns Hunter's Prey.");
  const owned=values(actor.effects).filter(e=>flag(e,"hunterPreyOption")),existing=owned[0];
  const data={name:"Hunter's Prey — "+(choice==="colossus"?"Colossus Slayer":"Horde Breaker"),img:feature.img??"icons/svg/target.svg",type:"base",disabled:false,transfer:false,origin:feature.uuid,duration:{value:null,units:"seconds",expiry:null,expired:false},system:{changes:[],origin:{actor:actor.uuid,item:feature.uuid,message:card?.uuid??null}},flags:{[ID]:{hunterPreyOption:{item:feature.uuid,choice}}}};
  if(existing){if(flag(existing,"hunterPreyOption")?.choice!==choice||existing.disabled)await existing.update(data);}else await actor.createEmbeddedDocuments("ActiveEffect",[data]);
  if(owned.length>1)await actor.deleteEmbeddedDocuments("ActiveEffect",owned.slice(1).map(e=>e.id));
  if(card)globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return choice;
 });optionQueues.set(actor.uuid,task);return task.finally(()=>{if(optionQueues.get(actor.uuid)===task)optionQueues.delete(actor.uuid);});
}
export function renderPreySelector(card,html){
 const root=html?.[0]??html,activity=card?.getAssociatedActivity?.();if(!root?.querySelectorAll||!isPreyChoice(activity))return;
 root.querySelectorAll(".rsa-prey-selector,[data-rsa-retarget]").forEach(n=>n.remove());
 const actor=card.getAssociatedActor?.()??activity.actor;if(card.isContentVisible===false||!(game.user.isGM||actor?.isOwner))return;
 const section=document.createElement("div");section.className="rsa-prey-selector";section.style.marginTop="8px";
 const info=document.createElement("p");info.textContent="Choose Hunter's Prey. Selecting an option replaces your previous choice. Horde Breaker's extra attack is handled manually.";section.append(info);
 for(const [choice,label]of [["colossus","Colossus Slayer"],["horde","Horde Breaker"]]){
  const button=document.createElement("button");button.type="button";button.textContent=(preyOption(actor)===choice?"✓ ":"")+label;button.style.marginBottom="6px";
  button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await selectPreyOption(card,choice);}catch(error){ui.notifications.error(error.message);}finally{button.disabled=false;}});section.append(button);
 }(root.querySelector(".chat-card")??root).append(section);
}
export const combatTurn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
export function preyUsed(actor) {
    const turn=combatTurn();if(!turn)return false;
    return reserved.get(actor?.uuid)===turn||Array.from(actor?.effects??[]).some(effect=>!effect.disabled&&effect.active!==false&&
        effect.getFlag?.(ID,"preyTurn")===turn);
}
function actorFor(app){return (app.message?.data?.speaker?ChatMessage.getSpeakerActor(app.message.data.speaker):null)??app.config.subject?.actor;}
function eligible(app){return enabled()&&app.config.subject?.type==="attack"&&app.config.subject.item?.type==="weapon"&&
    !app.message?.data?.flags?.[ID]?.masteryGraze&&actorFor(app)?.isOwner&&preyFeature(actorFor(app))&&preyOption(actorFor(app))==="colossus";}
export function preyDefault(app) {return actorFor(app)?.getFlag?.(ID,"huntersPreyChoice")===true;}
export function preyTarget(app) {
    const data=app.message?.data?.system,origin=data?.origin;
    const usage=typeof origin==="string"?game.messages.get(origin):origin;
    const targets=data?.targets?.length?data.targets:usage?.system?.targets??[];
    if(targets.length!==1)return null;
    const explicit=app.message?.data?.flags?.[ID]?.damageAttackId;
    const attack=explicit?game.messages.get(explicit):Array.from(usage?.getAssociatedRolls?.("attack")??[]).sort((a,b)=>b.timestamp-a.timestamp)[0];
    if(attack?.system?.evaluatedTargets?.some(target=>target.token===targets[0].token&&target.isMiss===true))return null;
    return fromUuidSync(targets[0].token,{strict:false})?.actor??null;
}
export function preyInjured(app) {
    const hp=preyTarget(app)?.system?.attributes?.hp;
    return Number.isFinite(hp?.value)&&Number.isFinite(hp?.max)&&hp.max>0&&hp.value<hp.max;
}
const rule="When you hit a creature with a weapon, the weapon deals an extra 1d8 damage to the target if it’s missing any of its Hit Points. You can deal this extra damage only once per turn.";
export function addPreyChoice(app) {
    if(!eligible(app)||app.element.querySelector("[data-rsa-prey]"))return;
    const used=preyUsed(actorFor(app)),injured=preyInjured(app);
    if(!selected.has(app))selected.set(app,preyDefault(app));
    
    const group=globalThis.Ugmuls55eAutomationDamage.addDamageChoice(app,{
        key:"prey",label:"Hunter's Prey",used,
        value:selected.get(app),disabled:used||!injured,change:yes=>{
            selected.set(app,yes);
            actorFor(app).setFlag(ID,"huntersPreyChoice",yes).catch(error=>console.warn("Ugmuls 5.5e Automation | Could not remember Hunter's Prey choice:",error));
        }
    });
    if(group) {
        group.dataset.rsaPrey="";
        const info=document.createElement("i");info.className="fa-solid fa-circle-info rsa-rider-info";
        info.tabIndex=0;info.setAttribute("role","img");info.setAttribute("aria-label",rule);
        info.setAttribute("data-tooltip",rule);info.title=rule;group.querySelector("label").append(info);
    }
}
export function finalizePrey(app,rolls,{preview=false}={}) {
    if(preview&&!selected.has(app))selected.set(app,preyDefault(app));
    if(!eligible(app)||!preyInjured(app)||selected.get(app)!==true||preyUsed(actorFor(app))||rolls.some(roll=>roll.options?.rsaHuntersPrey))return rolls;
    const actor=actorFor(app),feature=preyFeature(actor);
    const activities=Array.from(feature.system?.activities??[]);
    const activity=activities.find(activity=>/colossus slayer/i.test(activity.name??"")&&activity.damage?.parts?.length)??activities.find(activity=>activity.damage?.parts?.length);
    const source=activity?.getDamageConfig?.()?.rolls?.[0]??{parts:["1d8"],options:{}};
    if(!source?.parts?.length){if(!preview)ui.notifications.warn("Hunter's Prey needs a configured damage activity on its feature.");return rolls;}
    const base=rolls[0]?.options??{},policy={...base.critical,bonusDice:0,bonusDamage:""};
    const config={...source,options:{...source.options,type:base.type,types:base.type?[base.type]:[],flavor:"Hunter's Prey",isCritical:base.isCritical===true,
        critical:policy,rsaHuntersPrey:true}};
    const extra=CONFIG.Dice.DamageRoll.fromConfig(config,{critical:policy});
    const turn=combatTurn();if(turn&&!preview){reserved.set(actor.uuid,turn);pending.set(app,{actor,turn});}
    return [...rolls,extra];
}
export async function commitPrey(app,options) {
    const entry=pending.get(app);if(!entry)return;
    const {actor,turn}=entry;
    try {if(options?.dnd5e?.submitted)await saveUsedMarker(actor,{
        name:"Hunter's Prey - used",img:preyFeature(actor)?.img,disabled:false,transfer:false,
        system:{changes:[]},flags:{[ID]:{preyTurn:turn,preyCombat:game.combat?.id}}
    });}finally {if(reserved.get(actor.uuid)===turn)reserved.delete(actor.uuid);pending.delete(app);}
}
export async function resetPreyTurn(combat,changes) {
    if(!game.user.isGM||(game.users.activeGM&&game.users.activeGM.id!==game.user.id)||!("turn" in changes||"round" in changes||changes.started===false))return;
    const turn=combat.started?`${combat.id}:${combat.round}:${combat.turn}`:null;
    const actors=new Map(Array.from(combat.combatants??[]).filter(entry=>entry.actor).map(entry=>[entry.actor.uuid,entry.actor]));
    for(const actor of actors.values()) {
        const ids=Array.from(actor.effects??[]).filter(effect=>effect.getFlag?.(ID,"preyCombat")===combat.id&&effect.getFlag(ID,"preyTurn")!==turn).map(effect=>effect.id);
        if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
    }
}
Hooks.once("init",()=>game.settings.register(ID,"huntersPreyAutomation",{name:"Hunter's Prey Assistance",hint:"Choose Colossus Slayer or Horde Breaker from Hunter's Prey or after a Short/Long Rest. Offer Colossus Slayer on weapon damage dialogs only when selected. Adds Colossus Slayer damage against an injured single target. Remembers your Yes/No choice, starts at No, and resets use after each combat turn.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
    globalThis.Ugmuls55eAutomationPrey={isPreyChoice,addPreyChoice,finalizePrey,commitPrey};
    for(const type of Object.values(CONFIG.DND5E?.activityTypes??{}))installPreySelector(type.documentClass);
    Hooks.on("dnd5e.renderChatMessage",renderPreySelector);
    Hooks.on("updateCombat",(combat,changes)=>resetPreyTurn(combat,changes).catch(err=>console.error("Ugmuls 5.5e Automation | Hunter's Prey reset failed:",err)));
});

function saveUsedMarker(actor,data) {
    return globalThis.Ugmuls55eAutomationResources?.reuseMarker?globalThis.Ugmuls55eAutomationResources.reuseMarker(actor,data,"preyTurn"):
        actor.createEmbeddedDocuments("ActiveEffect",[data]);
}
