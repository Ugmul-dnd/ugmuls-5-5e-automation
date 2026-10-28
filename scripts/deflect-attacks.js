import {createEventQueue,isRollAdjustmentLocked,isHealingCard,describeTarget} from "./shared-activity-card.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
import {seekingSnapshot} from "./seeking-spell.js";
import {fieldReduction} from "./protective-field.js";
import {focusResource} from "./stunning-strike.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,doc=t=>t?.document??t;
const enabled=()=>game.settings.get(ID,"deflectAttacksAutomation")===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
const unable=actor=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>actor?.statuses?.has(s));
const owns=(actor,user)=>!!actor&&(user?.isGM||actor.testUserPermission?.(user,"OWNER"));
const flags=(card,k)=>card?.getFlag?.(ID,k)??card?.flags?.[ID]?.[k];
const records=card=>values(flags(card,"protectiveFields")).filter(r=>r.kind==="deflect");
export function deflectFeature(actor){
 const feats=values(actor?.items).filter(i=>i.type==="feat"&&i.system?.source?.rules!=="2014");
 return feats.find(i=>key(i)==="deflect-energy")??feats.find(i=>key(i)==="deflect-attacks");
}
export function deflectAttack(card){
 const explicit=flags(card,"damageAttackId");if(explicit)return game.messages.get(explicit);
 const ref=card?.system?.origin,origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 return origin?.type==="attack"?origin:values(origin?.getAssociatedRolls?.("attack")).filter(a=>a.timestamp<=(card.timestamp??Infinity)).sort((a,b)=>b.timestamp-a.timestamp)[0];
}
export function incomingDamageTypes(card){return [...new Set(values(card?.rolls).filter(r=>Number(r.total)>0).map(r=>r.options?.type).filter(t=>typeof t==="string"&&!['healing','temphp','maximum'].includes(t)))];}
const attackState=card=>JSON.stringify({roll:seekingSnapshot(card),mode:card?.system?.mode,hits:values(card?.system?.evaluatedTargets).map(t=>({token:t.token,isMiss:t.isMiss}))});
const rawDamage=card=>values(card?.rolls).reduce((n,r)=>['healing','temphp','maximum'].includes(r.options?.type)?n:n+Math.max(0,Number(r.total)||0),0);
export function deflectFormula(activity){
 const healing=activity?.healing;if(healing?.custom?.enabled)return healing.custom.formula;
 const number=Number(healing?.number),faces=Number(healing?.denomination);
 return number>0&&faces>0?`${number}d${faces}${healing.bonus?" + ("+healing.bonus+")":""}`:null;
}
export function deflectCandidates(card,user=game.user){
 if(!enabled()||card?.type!=="damage"||isHealingCard(card)||flags(card,"pendingDamage")||flags(card,"deflectPending")||flags(card,"protectiveFieldPending")||flags(card,"masteryGraze")||isRollAdjustmentLocked(card)||!card.rolls?.length||card.rolls.some(r=>!r._evaluated)||rawDamage(card)<=0)return [];
 const attack=deflectAttack(card),activity=attack?.getAssociatedActivity?.()??card.getAssociatedActivity?.();if(attack?.type!=="attack"||activity?.type!=="attack"||!attack.rolls?.length)return [];
 const hit=new Set(values(attack.system?.evaluatedTargets).filter(t=>t.isMiss===false).map(t=>t.token)),types=incomingDamageTypes(card),seen=new Set();
 return values(card.system?.targets).flatMap(t=>{
  const token=resolve(t.token),actor=token?.actor,item=deflectFeature(actor),energy=key(item)==="deflect-energy";
  const reduce=values(item?.system?.activities).find(a=>a.name==="Reduce"&&a.type==="heal"),formula=deflectFormula(reduce);
  if(!actor||!item||!formula||!hit.has(token.uuid)||seen.has(actor.uuid)||!owns(actor,user)||unable(actor)||reactionUsed(actor)||records(card).some(r=>r.target===token.uuid)||!types.length||!energy&&!types.some(t=>['bludgeoning','piercing','slashing'].includes(t))||rawDamage(card)-fieldReduction(card,actor,token.uuid)<=0)return [];
  seen.add(actor.uuid);return[{actor,token,item,reduce,formula,energy,attack,types}];
 });
}
export function applyDeflect(card,targetUuid,user=game.user){return enqueue(async()=>{
 if(!authority())throw Error("A connected GM is required for Deflect Attacks.");
 let c=deflectCandidates(card,user).find(c=>c.token.uuid===targetUuid);if(!c)throw Error("Deflect needs an unapplied confirmed attack hit, eligible damage and an available Reaction.");
 const snapshot=seekingSnapshot(card),attackSnapshot=attackState(c.attack);let marker,committed=false;
 try{
  await card.setFlag(ID,"deflectPending",{actor:c.actor.uuid,target:targetUuid});
  const roll=await new CONFIG.Dice.BasicRoll(c.formula,c.actor.getRollData?.()??{}).evaluate();
  if(snapshot!==seekingSnapshot(card)||attackSnapshot!==attackState(c.attack)||isRollAdjustmentLocked(card)||reactionUsed(c.actor)||unable(c.actor))throw Error("The attack or Monk’s Reaction changed before Deflect completed.");
  marker=await recordReactionUse(c.reduce,{}, {message:{id:card.id}});
  const tracked=game.settings.get(ID,"reactionTracker")===true&&game.combat?.started&&values(game.combat.combatants).some(x=>x.actor?.uuid===c.actor.uuid);
  if(tracked&&marker?.getFlag?.(ID,"reactionUsage")!==card.id)throw Error("Could not reserve the Monk’s Reaction.");
  if(game.dice3d?.showForRoll){const animation=game.dice3d.showForRoll(roll,user,true,card.whisper?.length?card.whisper:null,card.blind??false,card.id,card.speaker);await(globalThis.Ugmuls55eAutomationWaitForAnimation?.(animation)??animation);await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);}
  if(snapshot!==seekingSnapshot(card)||attackSnapshot!==attackState(c.attack)||isRollAdjustmentLocked(card)||unable(c.actor)||deflectFeature(c.actor)?.uuid!==c.item.uuid)throw Error("The damage or Monk’s eligibility changed during Deflect.");
  const total=Math.max(0,Number(roll.total)||0),before=Math.max(0,rawDamage(card)-fieldReduction(card,c.actor,targetUuid));
  const record={kind:"deflect",label:c.energy?"Deflect Energy":"Deflect Attacks",actor:c.actor.uuid,name:c.actor.name,target:targetUuid,targetActor:c.actor.uuid,targetName:c.token.name,total,formula:roll.formula??c.formula,attack:c.attack.id,feature:c.item.uuid,snapshot,attackSnapshot,before,zero:total>=before,types:c.types};
  await card.setFlag(ID,"protectiveFields",[...values(flags(card,"protectiveFields")),record]);committed=true;return record;
 }catch(error){if(!committed&&marker?.getFlag?.(ID,"reactionUsage")===card.id)await marker.update({disabled:true});throw error;}
 finally{await card.unsetFlag(ID,"deflectPending");globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
});}
export function redirectContext(card,targetUuid,user=game.user){
 if(!enabled()||flags(card,"deflectPending"))return null;
 const record=records(card).find(r=>r.target===targetUuid),token=resolve(targetUuid),actor=token?.actor,item=deflectFeature(actor),attack=deflectAttack(card);
 const redirect=values(item?.system?.activities).find(a=>a.name==="Redirect"&&a.type==="save"),resource=focusResource(actor),uses=resource?.system?.uses;
 const remaining=Number(uses?.value??(Number(uses?.max??0)-Number(uses?.spent??0)));
 if(!record?.zero||record.redirect||record.snapshot!==seekingSnapshot(card)||record.attack!==attack?.id||record.attackSnapshot!==attackState(attack)||!owns(actor,user)||unable(actor)||actor.statuses?.has("blinded")||!redirect||remaining<1||!Number.isFinite(remaining))return null;
 const activity=attack.getAssociatedActivity?.(),mode=attack.system?.mode,ranged=mode==="ranged"||String(mode??"").includes("thrown")||activity?.attack?.type?.value==="ranged";
 return{actor,token,item,redirect,resource,record,range:ranged?60:5,types:incomingDamageTypes(card).filter(t=>record.types.includes(t))};
}
export function redirectRangePoints(source,target){
 const grid=source.parent?.grid,size=Number(grid?.size??globalThis.canvas?.dimensions?.size);
 const center=t=>t.getCenterPoint?.()??t.object?.center;
 const a=center(source),b=center(target);if(!a||!b)return null;
 if(!Number.isFinite(size)||size<=0||![source.x,source.y,target.x,target.y].every(Number.isFinite))return[a,b];
 // Match the existing Sneak Attack adjacency check: measure nearest occupied
 // grid-space centers rather than token centers, including Large+ creatures.
 const near=(token,towards)=>{
  const width=Number(token.width??1),height=Number(token.height??1);
  if(grid.type===0)return{x:Math.max(token.x,Math.min(token.x+width*size,towards.x)),y:Math.max(token.y,Math.min(token.y+height*size,towards.y))};
  return{x:token.x+size*(0.5+Math.max(0,Math.min(Math.ceil(width)-1,Math.round((towards.x-token.x)/size-0.5)))),y:token.y+size*(0.5+Math.max(0,Math.min(Math.ceil(height)-1,Math.round((towards.y-token.y)/size-0.5))))};
 };
 return[near(source,b),near(target,a)];
}
export function redirectTargets(context,user=game.user){
 const {token:source,range}=context;
 if(!source?.object)return [];
 const limit=range*(/^(m|meters?|metres?)$/i.test(String(source.parent?.grid?.units??"ft"))?0.3048:1);
 return values(source.parent?.tokens).filter(t=>{
  if(!t.actor||t.actor.uuid===context.actor.uuid||t.hidden&&!user?.isGM||t.object?.visible===false)return false;
  const points=redirectRangePoints(source,t);if(!points)return false;
  const distance=globalThis.canvas?.grid?.measurePath(points)?.distance;
  return Number.isFinite(distance)&&distance<=limit+1e-6&&!source.object.checkCollision?.(points[1],{origin:points[0],type:"sight",mode:"any"});
 });
}
export function buildDeflectRedirect(item,activity,type){
 const data=item.toObject(),id=activity.id,use=data.system.activities[id];if(!use?.damage?.parts?.length)throw Error("Deflect is missing its native Redirect damage.");
 data.name="Deflect — Redirect";data.system.activities={[id]:use};data.effects=[];
 use.activation={type:"special",override:true};use.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};use.effects=[];
 use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};use.range={override:true,units:"any"};
 use.damage.onSave="none";use.damage.parts=use.damage.parts.map(p=>({...p,types:[type]}));return{data,id};
}
export function applyDeflectRedirect(card,monkUuid,targetUuid,type,user=game.user){return enqueue(async()=>{
 if(!authority())throw Error("A connected GM is required to redirect an attack.");
 const c=redirectContext(card,monkUuid,user),target=c&&redirectTargets(c,user).find(t=>t.uuid===targetUuid);
 if(!c||!target||!c.types.includes(type))throw Error("Redirect needs damage reduced to zero, a Focus Point and a visible creature within range.");
 const {data,id}=buildDeflectRedirect(c.item,c.redirect,type),helper=new CONFIG.Item.documentClass(data,{parent:c.actor});helper.prepareFinalAttributes?.();
 const spent=Number(c.resource.system.uses.spent??0);let charged=false,created=false;
 try{
  await c.resource.update({"system.uses.spent":spent+1});charged=true;
  const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{system:{targets:[describeTarget(target)]},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,deflectRedirectSave:{source:card.id,monk:monkUuid,type,userId:user.id}}}}});
  if(!result?.message)throw Error("Redirect could not create its saving throw card.");created=true;
  await card.setFlag(ID,"protectiveFields",values(flags(card,"protectiveFields")).map(r=>r.kind==="deflect"&&r.target===monkUuid?{...r,redirect:{message:result.message.id,target:targetUuid,type}}:r));
  return result;
 }catch(error){if(charged&&!created)await c.resource.update({"system.uses.spent":Math.max(0,Number(c.resource.system.uses.spent??0)-1)});throw error;}
 finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
});}
async function request(action,card,data){
 const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action,card:card.id,...data,user:game.user.id,gm:gm.id});
 else if(action==="deflectAttack")await applyDeflect(card,data.target);else await applyDeflectRedirect(card,data.monk,data.target,data.type);
}
export async function chooseDeflectRedirect(card,monkUuid){
 const context=redirectContext(card,monkUuid);if(!context)return;
 const targets=redirectTargets(context);if(!targets.length){ui.notifications.info("No visible creatures are within Redirect range.");return;}
 const escape=foundry.utils.escapeHTML;
 const choice=await foundry.applications.api.DialogV2.wait({window:{title:"Redirect Attack"},position:{width:380},content:`<p>Spend 1 Focus Point. Choose a visible creature within ${context.range} feet.</p><div class="form-group"><label>Target</label><select name="redirect-target">${targets.map(t=>`<option value="${escape(t.uuid)}">${escape(t.name)}</option>`).join("")}</select></div><div class="form-group"><label>Damage Type</label><select name="redirect-type">${context.types.map(t=>`<option value="${escape(t)}">${escape(CONFIG.DND5E.damageTypes?.[t]?.label??t)}</option>`).join("")}</select></div>`,buttons:[{action:"redirect",label:"Redirect — 1 Focus Point",default:true,callback:(_event,_button,dialog)=>({target:dialog.element.querySelector('[name="redirect-target"]').value,type:dialog.element.querySelector('[name="redirect-type"]').value})},{action:"cancel",label:"Cancel",callback:()=>null}],close:()=>null,rejectClose:false});
 if(choice)await request("deflectRedirect",card,{monk:monkUuid,...choice});
}
export function renderDeflect(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).map(node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){node.querySelectorAll(':scope > .rsa-deflect').forEach(n=>n.remove());if(card.isContentVisible===false||card.type!=="damage")continue;
  const candidates=deflectCandidates(card),applied=records(card);if(!candidates.length&&!applied.length)continue;
  const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-deflect";
  const button=(label,callback)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();b.disabled=true;try{await callback();}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});controls.append(b);};
  for(const c of candidates)button((c.energy?"Deflect Energy":"Deflect Attacks")+(candidates.length>1?" — "+c.actor.name:""),()=>request("deflectAttack",card,{target:c.token.uuid}));
  for(const r of applied){const note=document.createElement("span");note.textContent=r.label+": −"+r.total+" to "+r.targetName;controls.append(note);if(redirectContext(card,r.target))button("Redirect — 1 Focus Point",()=>chooseDeflectRedirect(card,r.target));}
  node.append(controls);
 }
}
function report(error){console.error("Deflect Attacks",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"deflectAttacksAutomation",{name:"Deflect Attacks & Energy",hint:"Offer Deflect on completed attack damage before HP application. Spend a Reaction and reduce damage directly using the native formula, without healing. Deflect Attacks requires Bludgeoning/Piercing/Slashing; Deflect Energy permits any attack damage. At zero, offer a 1-Focus Redirect with the native Dexterity save and damage.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.renderChatMessage",renderDeflect);
 for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect","updateItem","deleteItem","updateCombat"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("deflect",doc,changes));
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="deflectError"&&packet.user===game.user.id){ui.notifications.error(packet.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(packet.card));return;}
  if(!["deflectAttack","deflectRedirect"].includes(packet?.action)||!authority()||packet.gm!==game.user.id)return;
  const card=game.messages.get(packet.card),user=game.users.get(packet.user);if(!card||!user?.active)return;
  const task=packet.action==="deflectAttack"?applyDeflect(card,packet.target,user):applyDeflectRedirect(card,packet.monk,packet.target,packet.type,user);
  task.catch(error=>{report(error);game.socket.emit("module."+ID,{action:"deflectError",card:card.id,user:user.id,error:error.message});});
 });
});
