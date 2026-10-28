import {dreadContext,dreadEligible,dreadUsed} from "./dread-ambusher.js";
import {createEventQueue,describeTarget} from "./shared-activity-card.js";
import {redirectRangePoints} from "./deflect-attacks.js";
const ID="ugmuls-5-5e-automation",channel="module."+ID,choices=new WeakMap(),enqueue=createEventQueue(),operations=createEventQueue(),waiting=new Map(),busy=new Set();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
const stamp=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const enabled=()=>game.settings.get(ID,"stalkersFlurryAutomation")===true;
const owns=(actor,user)=>!!actor&&!!user&&(user.isGM||actor.testUserPermission?.(user,"OWNER"));
export const flurryFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&i.system?.source?.rules!=="2014"&&(key(i)==="stalkers-flurry"||/^stalker[’']s flurry$/i.test(i.name?.trim()??"")));
export function selectMassFear(app,yes){choices.set(app,yes===true);}
export function addFlurryChoice(app,dreadSelected){
 const root=app.element,configuration=root?.querySelector?.('fieldset[data-application-part="configuration"]')??root;
 const dread=configuration?.querySelector?.('[data-rsa-choice="dreadful-strike"]');
 const rows=Array.from(root?.querySelectorAll?.('[data-rsa-choice="mass-fear"]')??[]);
 const {actor}=dreadContext(app),parentSelect=dread?.querySelector("select");
 // The mounted parent control owns visibility. Rechecking the changing roll
 // context during a formula-only refresh can hide a valid dependent choice.
 // Dreadful Strike still validates eligibility and resources on submission.
 const show=enabled()&&!!flurryFeature(actor)&&!!dread&&(parentSelect?parentSelect.value==="yes"&&!parentSelect.disabled:dreadSelected);
 if(!show){for(const row of rows)row.remove();if(!dreadSelected)choices.delete(app);return;}
 let row=rows[0];for(const duplicate of rows.slice(1))duplicate.remove();
 if(!row){
  row=document.createElement("div");row.className="form-group rsa-damage-choice";row.dataset.rsaChoice="mass-fear";
  const label=document.createElement("label");label.textContent="Mass Fear";
  const fields=document.createElement("div");fields.className="form-fields";
  const select=document.createElement("select");select.setAttribute("aria-label","Mass Fear");
  for(const [value,text]of [["yes","Yes"],["no","No"]]){const option=document.createElement("option");option.value=value;option.textContent=text;select.append(option);}
  select.addEventListener("change",event=>{event.stopPropagation();selectMassFear(app,select.value==="yes");});
  fields.append(select);row.append(label,fields);
 }
 const select=row.querySelector("select");select.disabled=false;select.value=choices.get(app)===true?"yes":"no";
 row.classList.remove("rsa-savage-used");
 // Insert directly beside the real parent. Do not create through the generic
 // helper's fallback fieldset, then move between separately rendered parts.
 dread.after(row);
}
export function flurryFor(app){
 const c=dreadContext(app),feature=flurryFeature(c.actor);if(!enabled()||!feature)return null;
 const hits=values(c.attack?.system?.evaluatedTargets).filter(t=>t.isMiss===false);if(hits.length!==1||!hits[0].token)throw Error("Stalker's Flurry requires one confirmed Dreadful Strike target.");
 return {feature:feature.uuid,choice:choices.get(app)===true?"fear":"sudden",attack:c.attack.id,target:hits[0].token};
}
export function withinFlurryRange(source,target,feet){
 if(!source?.actor||!target?.actor||source.parent?.id!==target.parent?.id)return false;
 if(source.uuid===target.uuid)return true;
 const points=redirectRangePoints(source,target);if(!points)return false;
 const distance=globalThis.canvas?.grid?.measurePath(points)?.distance,units=String(source.parent?.grid?.units??"ft");
 return Number.isFinite(distance)&&distance<=feet*(/^(m|meters?|metres?)$/i.test(units)?0.3048:1);
}
export function fearTargets(target){
 return values(target?.parent?.tokens).filter(t=>t.actor&&!['group','vehicle'].includes(t.actor.type)&&withinFlurryRange(target,t,10)).map(describeTarget);
}
export function prepareMassFear(feature,actor,job){
 const native=values(feature.system?.activities).find(a=>a.type==="save"&&/^mass fear$/i.test(a.name??""));if(!native)throw Error("Stalker's Flurry is missing its native Mass Fear save.");
 const data=feature.toObject(),id=native.id,use=data.system.activities[id];data.name="Stalker's Flurry — Mass Fear";data.system.activities={[id]:use};
 data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};if(use.flags?.dnd5e)delete use.flags.dnd5e.dependentOn;
 const eid="rsaMassFear00001",effect={_id:eid,name:"Mass Fear — Frightened",img:"systems/dnd5e/icons/svg/statuses/frightened.svg",type:"base",disabled:false,transfer:false,origin:feature.uuid,statuses:["frightened"],start:null,duration:{value:null,units:"seconds",expiry:"sourceStart",expired:false},system:{changes:[],origin:{actor:actor.uuid,item:feature.uuid}},flags:{dnd5e:{isTemporary:true},[ID]:{stalkerMassFear:{source:actor.uuid,applied:job.applied}}}};
 data.effects=[effect];use.name="Mass Fear";use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.damage={parts:[],onSave:"none"};
 use.range={override:true,units:"any"};use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"",choice:false}};
 use.effects=[{_id:eid,onSave:false}];use.appliedEffects=[eid];return{data,id};
}
export function flurryContext(card,user=game.user,{allowSubmitted=false}={}){
 const submitted=allowSubmitted?flag(card,"stalkerMassFearSubmitted"):null;
 const meta=flag(card,"dreadfulStrike")??submitted,job=meta?.flurry;
 if(!enabled()||card?.type!=="damage"||!job||(!submitted&&(flag(card,"pendingDamage")||!card.rolls?.some(r=>r._evaluated&&r.options?.rsaDreadfulStrike))))return null;
 const actor=card.getAssociatedActor?.(),feature=flurryFeature(actor),attack=game.messages.get(job.attack),target=resolve(job.target);
 if(!actor||meta.actor!==actor.uuid||feature?.uuid!==job.feature||!owns(actor,user)||!target?.actor||!card.system?.targets?.some(t=>t.token===job.target)||!attack?.system?.evaluatedTargets?.some(t=>t.token===job.target&&t.isMiss===false))return null;
 return{actor,feature,attack,target,meta,job};
}
export function resolveMassFear(card){return enqueue(async()=>{
 if(!authority()||flag(card,"stalkerFlurryResolved"))return;
 const c=flurryContext(card,game.user,{allowSubmitted:true});if(!c||c.job.choice!=="fear")return;
 const targets=fearTargets(c.target);if(!targets.length)throw Error("Mass Fear could not find its affected creatures.");
 const combat=game.combat,job={...c.job,applied:combat?.started?{combat:combat.id,round:combat.round,turn:combat.turn}:null};
 const {data,id}=prepareMassFear(c.feature,c.actor,job),helper=new CONFIG.Item.documentClass(data,{parent:c.actor});helper.prepareFinalAttributes?.();
 // Start saves as soon as rolled damage is published. Do not wait for HP
 // application or the weapon damage's animation; save outcome effects keep
 // their existing save/animation order through the shared save workflow.
 const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false}},{configure:false},{data:{system:{targets},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,stalkerMassFearSave:{source:card.id,target:c.target.uuid}}}}});
 if(!result?.message)throw Error("Mass Fear could not create its saving throw card.");
 await card.setFlag(ID,"stalkerFlurryResolved",{choice:"fear",message:result.message.id});return result;
});}
export async function submitMassFear(card,meta,user=game.user){
 if(!authority()||!enabled()||meta?.flurry?.choice!=="fear"||meta.turn!==stamp()||!flag(card,"pendingDamage"))return;
 const actor=card.getAssociatedActor?.(),feature=flurryFeature(actor),attack=game.messages.get(meta.flurry.attack);
 if(!owns(actor,user)||actor.uuid!==meta.actor||feature?.uuid!==meta.flurry.feature||dreadContext({config:{subject:attack?.getAssociatedActivity?.()}}).feature?.uuid!==meta.feature||!attack?.system?.evaluatedTargets?.some(t=>t.token===meta.flurry.target&&t.isMiss===false)||!card.system?.targets?.some(t=>t.token===meta.flurry.target)||meta.turn&&flag(actor,"dreadfulStrikeTurn")!==meta.turn)throw Error("Mass Fear's submitted Dreadful Strike could not be verified.");
 if(flag(card,"stalkerMassFearSubmitted")||flag(card,"stalkerFlurryResolved"))return;
 await card.setFlag(ID,"stalkerMassFearSubmitted",meta);
 return resolveMassFear(card);
}
export function beginFlurry(app){
 const meta=app.message?.data?.flags?.[ID]?.dreadfulStrike,card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app);
 if(!card||meta?.flurry?.choice!=="fear")return;
 const gm=game.users.activeGM;
 if(!gm||gm.id===game.user.id)return submitMassFear(card,meta);
 game.socket.emit(channel,{action:"stalkerMassFearStart",sourceId:card.id,meta,userId:game.user.id,gmId:gm.id});
}
export function suddenContext(card,user=game.user){
 const c=flurryContext(card,user);return c&&c.job.choice==="sudden"&&!flag(card,"stalkerSuddenResult")&&c.meta.turn===stamp()?c:null;
}
export function validateSuddenTarget(c,target){
 if(!target?.actor||target.uuid===c.target.uuid||target.actor.uuid===c.target.actor.uuid||!withinFlurryRange(c.target,target,5))throw Error("Sudden Strike needs a different creature within 5 feet of the original target, and within your weapon's range.");
 const activity=c.attack.getAssociatedActivity?.(),sourceRef=c.attack.getAssociatedToken?.()??activity?.getUsageToken?.()??c.actor.token,source=sourceRef?.document??sourceRef;
 const range=activity?.range??activity?.item?.system?.range,mode=c.attack.system?.mode??activity?.attack?.type?.value;
 const ranged=mode==="ranged"||mode?.includes("thrown"),amount=Number(ranged?(range?.long??range?.value):range?.reach??(range?.units==="touch"?5:null));
 const feet=amount*(/^(m|meters?|metres?)$/i.test(range?.units??"ft")?1/0.3048:1);
 if(source&&Number.isFinite(feet)&&feet>0&&!withinFlurryRange(source,target,feet))throw Error("The selected creature is outside the original weapon's range.");
 return target;
}
export async function suddenOperation(action,card,payload,user){
 const c=suddenContext(card,user);if(!c)throw Error("Sudden Strike is no longer available for this Dreadful Strike.");
 const reservation=flag(card,"stalkerSuddenReservation");
 if(action==="claim"){
  if(reservation&&game.users.get(reservation.userId)?.active)throw Error("A Sudden Strike attack is already being prepared.");
  const target=validateSuddenTarget(c,resolve(payload.target));
  const next={userId:user.id,target:target.uuid,session:foundry.utils.randomID()};await card.setFlag(ID,"stalkerSuddenReservation",next);return next;
 }
 if(!reservation||reservation.userId!==user.id||reservation.session!==payload.session)throw Error("This Sudden Strike request was replaced.");
 if(action==="commit"){
  const result=game.messages.get(payload.resultId),ref=result?.system?.origin,usage=typeof ref==="string"?game.messages.get(ref):ref;
  if(result?.type!=="attack"||!result.rolls?.length||result.author?.id!==user.id||flag(result,"stalkerSuddenSource")!==card.id||flag(result,"stalkerSuddenSession")!==reservation.session||flag(usage,"stalkerSuddenSession")!==reservation.session||result.getAssociatedActor?.()?.uuid!==c.actor.uuid||result.getAssociatedActivity?.()?.uuid!==c.attack.getAssociatedActivity?.()?.uuid||result.system?.targets?.length!==1||result.system.targets[0].token!==reservation.target)throw Error("The Sudden Strike result could not be verified.");
  await card.setFlag(ID,"stalkerSuddenResult",result.id);
 }
 if(action==="commit"||action==="release")await card.unsetFlag(ID,"stalkerSuddenReservation");
}
function operate(operation,card,payload={}){
 const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return operations(()=>suddenOperation(operation,card,payload,game.user));
 const requestId=foundry.utils.randomID();return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{waiting.delete(requestId);reject(Error("The GM did not answer the Sudden Strike request."));},10000);waiting.set(requestId,{resolve,reject,timer});
  game.socket.emit(channel,{action:"stalkerSuddenOperation",operation,sourceId:card.id,payload,userId:game.user.id,gmId:gm.id,requestId});
 });
}
export async function useSuddenStrike(card){
 const c=suddenContext(card);if(!c||busy.has(card.id))return;
 const selected=values(game.user.targets);if(selected.length!==1)throw Error("Select one different creature within 5 feet of the original target before using Sudden Strike.");
 const target=validateSuddenTarget(c,selected[0].document??selected[0]),activity=c.attack.getAssociatedActivity?.();if(!activity?.item?.isOwner)throw Error("The original Sudden Strike weapon is unavailable.");
 busy.add(card.id);let claim,usage;
 try{
  claim=await operate("claim",card,{target:target.uuid});
  const descriptor=describeTarget(target),flags={[ID]:{riderTriggered:true,stalkerSuddenSource:card.id,stalkerSuddenSession:claim.session}};
  const result=await activity.use({consume:false,subsequentActions:false,create:{measuredTemplate:false}},{configure:false},{data:{system:{targets:[descriptor]},flags}});usage=result?.message;if(!usage)return;
  await activity.rollAttack({attackMode:c.attack.system.mode,mastery:c.attack.system.mastery,target:descriptor.ac},{},{data:{system:{origin:usage.id,targets:[descriptor]},flags}});
 }finally{
  try{const result=values(usage?.getAssociatedRolls?.("attack")).find(r=>r.rolls?.length);if(claim)await operate(result?"commit":"release",card,{session:claim.session,resultId:result?.id});if(usage&&!result)await usage.delete();}
  finally{busy.delete(card.id);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
 }
}
export function renderFlurry(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){node.querySelectorAll(':scope > .rsa-stalkers-flurry').forEach(n=>n.remove());if(card.isContentVisible===false)continue;
  const c=flurryContext(card);if(!c)continue;const section=document.createElement("div");section.className="rsa-attack-actions rsa-stalkers-flurry";
  if(c.job.choice==="fear"){const note=document.createElement("p");note.textContent="Mass Fear — Wisdom saves for the target and creatures within 10 feet. Frightened on failure until the start of the Ranger's next turn.";section.append(note);}
  else if(flag(card,"stalkerSuddenResult"))section.textContent="Sudden Strike used.";
  else if(suddenContext(card)){const button=document.createElement("button");button.type="button";button.textContent="Sudden Strike";button.dataset.tooltip="Select a different creature within 5 feet of the original target and within your weapon's range. Make one attack with the same weapon.";button.disabled=!!flag(card,"stalkerSuddenReservation");button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await useSuddenStrike(card);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});section.append(button);}
  if(section.childNodes.length)node.append(section);
 }
}
export async function expireMassFear(combat,changes={}){
 if(!authority()||!combat.started||!("turn"in changes||"round"in changes))return;
 const source=combat.combatant?.actor;if(!source)return;
 const actors=new Map([...values(game.actors),...values(globalThis.canvas?.scene?.tokens).map(t=>t.actor),...values(combat.combatants).map(c=>c.actor)].filter(Boolean).map(a=>[a.uuid,a]));
 for(const actor of actors.values()){
  const ids=values(actor.effects).filter(e=>{const marker=flag(e,"stalkerMassFear"),a=marker?.applied;return marker?.source===source.uuid&&a?.combat===combat.id&&(combat.round>a.round||combat.round===a.round&&combat.turn>a.turn);}).map(e=>e.id);
  if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
 }
}
function report(error){console.error("Stalker's Flurry",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"stalkersFlurryAutomation",{name:"Stalker's Flurry Assistance",hint:"Choose Mass Fear (default No) beneath Dreadful Strike. Yes prompts Wisdom saves within 10 feet of the struck creature and applies temporary Frightened; No offers a Sudden Strike attack on the completed damage card.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationStalkersFlurry={addFlurryChoice,flurryFor,beginFlurry};
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{if(flag(card,"dreadfulStrike")?.flurry?.choice==="fear"||flag(card,"stalkerMassFearSubmitted"))resolveMassFear(card).catch(report);});
 Hooks.on("dnd5e.renderChatMessage",renderFlurry);
 Hooks.on("updateCombat",(c,d)=>{expireMassFear(c,d).catch(report);globalThis.Ugmuls55eAutomationChatRefresh?.request("stalkersFlurry",c,d);});
 game.socket.on(channel,packet=>{
  if(packet?.action==="stalkerMassFearStart"&&authority()&&packet.gmId===game.user.id){const user=game.users.get(packet.userId);if(user?.active)operations(()=>submitMassFear(game.messages.get(packet.sourceId),packet.meta,user)).catch(report);return;}
  if(packet?.action==="stalkerSuddenReply"&&packet.userId===game.user.id){const entry=waiting.get(packet.requestId);if(!entry)return;clearTimeout(entry.timer);waiting.delete(packet.requestId);packet.error?entry.reject(Error(packet.error)):entry.resolve(packet.result);return;}
  if(packet?.action!=="stalkerSuddenOperation"||!authority()||packet.gmId!==game.user.id)return;const user=game.users.get(packet.userId);if(!user?.active)return;
  operations(()=>suddenOperation(packet.operation,game.messages.get(packet.sourceId),packet.payload??{},user)).then(result=>game.socket.emit(channel,{action:"stalkerSuddenReply",requestId:packet.requestId,userId:user.id,result}),error=>game.socket.emit(channel,{action:"stalkerSuddenReply",requestId:packet.requestId,userId:user.id,error:error.message}));
 });
});
