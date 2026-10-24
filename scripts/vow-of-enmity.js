import {paladinFeatureNotice} from "./paladin-feature-notice.js";
import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),requests=new Map();let bridge=false;
const values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k);
const enabled=()=>game.settings.get(ID,"vowOfEnmityAutomation")===true;
export const vowEffect=actor=>values(actor?.effects).find(e=>flag(e,"vowOfEnmity")&&!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired);
const feature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="vow-of-enmity"&&i.system?.source?.rules!=="2014");
const resource=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="channel-divinity");
const available=i=>Number(i?.system?.uses?.value??Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0))>0;
const resolve=uuid=>uuid?globalThis.fromUuidSync?.(uuid,{strict:false}):null;
export function vowedActor(actor){const mark=flag(vowEffect(actor),"vowOfEnmity");return mark?(resolve(mark.targetActor)??resolve(mark.targetToken)?.actor):null;}
export function vowMatches(actor,target){const mark=flag(vowEffect(actor),"vowOfEnmity");return enabled()&&!!mark&&!!target?.uuid&&mark.targetActor===target.uuid;}
export function canTransferVow(actor){const target=vowedActor(actor),hp=target?.system?.attributes?.hp?.value;return !!vowEffect(actor)&&hp!==null&&hp!==undefined&&Number.isFinite(Number(hp))&&Number(hp)<=0;}
export function vowInRange(actor,source,target){
 if(!source?.actor||source.actor.uuid!==actor?.uuid||!target?.actor||target.actor.uuid===actor.uuid||source.parent?.id!==target.parent?.id||target.hidden||target.object?.visible===false)return false;
 const a=source.object,b=target.object;if(!a?.center||!b?.center)return false;
 const units=source.parent.grid?.units,range=/^(m|meters?|metres?)$/i.test(units??"")?9.144:30;
 const distance=canvas.grid.measurePath([a.center,b.center]).distance;
 return Number.isFinite(distance)&&distance<=range&&!a.checkCollision?.(b.center,{type:"sight",mode:"any"});
}
function ownTurn(actor){return !game.combat?.started||!values(game.combat.combatants).some(c=>c.actor?.uuid===actor.uuid)||game.combat.combatant?.actor?.uuid===actor.uuid;}
export async function setVow(actor,source,target,{transfer=false,user=game.user}={}){
 return enqueue(async()=>{
  const native=feature(actor),charge=resource(actor),current=vowEffect(actor);
  if(!enabled()||!native||!actor.isOwner||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||!vowInRange(actor,source,target))throw Error("Vow of Enmity needs your feature and a different visible creature within 30 feet.");
  if(["incapacitated","unconscious","dead","stunned","paralyzed","petrified"].some(s=>actor.statuses?.has(s)))throw Error("The Paladin cannot activate or transfer Vow while incapacitated.");
  const hp=target.actor.system?.attributes?.hp?.value;if(hp!=null&&Number(hp)<=0)throw Error("Choose a creature above 0 Hit Points.");
  if(flag(current,"vowOfEnmity")?.targetActor===target.actor.uuid)return current;
  const record={targetActor:target.actor.uuid,targetToken:target.uuid,sourceToken:source.uuid,feature:native.uuid};
  if(transfer){if(!canTransferVow(actor))throw Error("Free transfer requires the current marked creature to be at 0 Hit Points.");await current.update({name:"Vow of Enmity — "+target.name,["flags."+ID+".vowOfEnmity"]:record});await paladinFeatureNotice(actor,{feature:"vow-of-enmity",target:target.name,transfer:true,source,user});return current;}
  if(!ownTurn(actor)||!available(charge))throw Error("A new Vow requires the Attack action on your turn and an available Channel Divinity use.");
  const spent=Number(charge.system.uses.spent??0);let paid=false;
  try{
   await charge.update({"system.uses.spent":spent+1});paid=true;
   const data={name:"Vow of Enmity — "+target.name,img:native.img??"icons/magic/unholy/silhouette-robe-evil-glow.webp",type:"base",disabled:false,transfer:false,origin:actor.uuid,system:{changes:[],origin:{actor:actor.uuid,item:native.uuid}},statuses:[],start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:60,units:"seconds",expiry:"turnStart",expired:false},flags:{[ID]:{vowOfEnmity:record},dnd5e:{isTemporary:true},autoanimations:{version:5,isEnabled:false,isCustomized:false,killAnim:true}}};
   const stored=current??values(actor.effects).find(e=>flag(e,"vowOfEnmity"));if(stored){await stored.update(data);await paladinFeatureNotice(actor,{feature:"vow-of-enmity",target:target.name,source,user});return stored;}
   const [effect]=await actor.createEmbeddedDocuments("ActiveEffect",[data]);await paladinFeatureNotice(actor,{feature:"vow-of-enmity",target:target.name,source,user});return effect;
  }catch(error){if(paid)await charge.update({"system.uses.spent":spent});throw error;}
 });
}
export function vowAttackContext(config,message){
 const activity=config?.subject,actor=activity?.actor??activity?.item?.actor;
 const data=message?.data??{},speaker=config?.speaker??data.speaker;
 let source=speaker?.scene&&speaker?.token?resolve("Scene."+speaker.scene+".Token."+speaker.token):null;
 if(source?.actor?.uuid!==actor?.uuid)source=null;
 if(!source){const usage=activity?.getUsageToken?.();source=usage?.document??usage;}
 if(!source){const tokens=values(actor?.getActiveTokens?.(false,true)).map(t=>t.document??t);if(tokens.length===1)source=tokens[0];}
 const recorded=data.system?.targets,targets=recorded?.length?recorded.map(t=>resolve(t.token)).filter(Boolean):values(game.user?.targets).map(t=>t.document??t);
 return {activity,actor,source,target:targets.length===1?targets[0]:null};
}
export function vowDefaults(config,dialog,message){
 if(!enabled()||config.subject?.type!=="attack")return;
 const {actor,target}=vowAttackContext(config,message),effect=vowEffect(actor),matches=vowMatches(actor,target?.actor);
 if(matches)config.rsaVowSnapshot={effect:effect.uuid,targetActor:target.actor.uuid};
 if(!matches||bridge)return;
 const dis=config.disadvantage===true||(config.rolls??[]).some(r=>r.options?.disadvantage===true||r.options?.advantageMode===-1);
 config.advantage=true;for(const roll of config.rolls??[]){roll.options??={};roll.options.advantage=true;roll.options.advantageMode=dis?0:1;}
 dialog.options??={};dialog.options.defaultButton=dis?"normal":"advantage";
}
export function validateVowAttack(app){
 const snapshot=app.config?.rsaVowSnapshot;if(!snapshot)return;
 const {actor,target}=vowAttackContext(app.config,app.message),current=vowEffect(actor);
 if(!enabled()||current?.uuid!==snapshot.effect||!vowMatches(actor,target?.actor)||flag(current,"vowOfEnmity")?.targetActor!==snapshot.targetActor)throw Error("Vow of Enmity changed or expired. Reopen this attack to refresh its modifiers.");
}
export function registerVowRule(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return bridge;
 bridge=!!api.register({key:"rsaVowOfEnmity",scope:"universal",hook:"attack",target:"subject",mode:"advantage",name:"Vow of Enmity",persistent:false,evaluate:s=>vowMatches(resolve(s.actorUuid),resolve(s.opponentActorUuid))});return bridge;
}
async function requestVow(context,transfer){
 const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return setVow(context.actor,context.source,context.target,{transfer});
 const id=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{requests.delete(id);reject(Error("The GM did not answer the Vow request."));},15000);requests.set(id,{resolve,reject,timer});game.socket.emit("module."+ID,{action:"vowActivate",id,actor:context.actor.uuid,source:context.source?.uuid,target:context.target?.uuid,transfer,user:game.user.id,gm:gm.id});});
}
export async function useVowForAttack(app,transfer=false){
 const context=vowAttackContext(app.config,app.message);await requestVow(context,transfer);
 const activity=values(context.actor.items).find(i=>i.id===context.activity.item.id)?.system?.activities?.get(context.activity.id)??context.activity;
 const config={};for(const k of ["ability","attackMode","ammunition","mastery"])if(app.config[k]!==undefined)config[k]=app.config[k];
 const data=foundry.utils.deepClone(app.message?.data??{});delete data._id;delete data.rolls;
 await app.close();const dialog=globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("attack",{configure:true})??{configure:true};return activity.rollAttack(config,dialog,{data});
}
export function addVowButton(app){
 if(!enabled()||app.config?.subject?.type!=="attack")return;
 const context=vowAttackContext(app.config,app.message),{actor,activity,target,source}=context;
 if(!feature(actor)||!actor.isOwner||app.element.querySelector('[data-rsa-vow]'))return;
 const attackAction=activity.item?.type==="weapon"||activity.attack?.type?.classification==="unarmed";if(!attackAction)return;
 const section=app.element.querySelector('[data-application-part="configuration"] fieldset')??app.element.querySelector('fieldset');if(!section)return;
 const button=document.createElement("button");button.type="button";button.dataset.rsaVow="";
 const same=vowMatches(actor,target?.actor),transfer=!same&&canTransferVow(actor),current=vowEffect(actor);
 button.textContent=same?"Vow of Enmity — Marked Target":transfer?"Transfer Vow of Enmity — Free":current?"New Vow — Spend Channel Divinity":"Activate Vow of Enmity";
 button.disabled=same||!vowInRange(actor,source,target)||!transfer&&(!available(resource(actor))||!ownTurn(actor));
 button.dataset.tooltip=transfer?"Transfer the existing Vow to this target without spending a use or resetting its remaining duration.":"Mark the current attack target for one minute. Spend one Channel Divinity use. Advantage applies only against that creature and still combines normally with Disadvantage.";
 button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await useVowForAttack(app,transfer);}catch(error){report(error);button.disabled=false;}});section.append(button);
}
function report(error){console.error("Vow of Enmity",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"vowOfEnmityAutomation",{name:"Vow of Enmity Assistance",hint:"Activate Vow against the current attack target, spend Channel Divinity and grant source-specific Advantage. Transfer for free if the mark is at 0 HP without resetting its duration. Checks run only during attack setup/use, with no movement refreshes.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerVowRule(usageRules));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationVow={addVowButton,validateVowAttack};registerVowRule();Hooks.on("dnd5e.preRollAttackV2",vowDefaults);
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="vowResult"&&packet.user===game.user.id){const p=requests.get(packet.id);if(!p)return;requests.delete(packet.id);clearTimeout(p.timer);packet.error?p.reject(Error(packet.error)):p.resolve(true);return;}
  if(packet?.action!=="vowActivate"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gm!==game.user.id)return;
  const user=game.users.get(packet.user),actor=resolve(packet.actor);if(!user?.active||!actor)return;
  setVow(actor,resolve(packet.source),resolve(packet.target),{transfer:packet.transfer===true,user}).then(()=>game.socket.emit("module."+ID,{action:"vowResult",id:packet.id,user:user.id}),error=>game.socket.emit("module."+ID,{action:"vowResult",id:packet.id,user:user.id,error:error.message}));
 });
});
