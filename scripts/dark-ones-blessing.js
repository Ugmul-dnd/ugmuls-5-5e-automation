import {createEventQueue,describeTarget} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),contexts=new Map(),wrapped=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"darkOnesBlessingAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),resolve=ref=>typeof ref==="string"?(globalThis.fromUuidSync?.(ref,{strict:false})??game.messages.get(ref.replace(/^ChatMessage\./,""))):ref;
const dropFrom=changes=>changes['flags.'+ID+'.darkBlessingDrop']??changes.flags?.[ID]?.darkBlessingDrop;
export const blessingFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&(i.identifier??i.system?.identifier)==="dark-ones-blessing"&&i.system?.source?.rules!=="2014");
function damageCard(options){return resolve(options.origin??options.originatingMessage);}
function victimToken(actor,context){
 const chosen=resolve(context?.token);if(chosen?.actor?.uuid===actor.uuid)return chosen;
 const own=actor.token?.document??actor.token;if(own?.actor?.uuid===actor.uuid)return own;
 const card=resolve(context?.source),targets=values(card?.system?.targets).map(t=>resolve(t.token)).filter(t=>t?.actor?.uuid===actor.uuid);if(targets.length===1)return targets[0];
 const scene=globalThis.canvas?.scene,matches=values(scene?.tokens).filter(t=>t.actor?.uuid===actor.uuid);return matches.length===1?matches[0]:null;
}
export function installBlessingContext(ActorType=CONFIG.Actor?.documentClass,TrayType=globalThis.customElements?.get?.("damage-application")){
 const p=TrayType?.prototype;if(p?.getMergedOptions&&!wrapped.has(p)){wrapped.add(p);const get=p.getMergedOptions;p.getMergedOptions=function(uuid){return {...get.call(this,uuid),rsaBlessingTarget:uuid};};}
 const a=ActorType?.prototype;if(!a?.applyDamage||wrapped.has(a))return;wrapped.add(a);const apply=a.applyDamage;
 a.applyDamage=async function(damage,options={}){
  if(!enabled())return apply.call(this,damage,options);
  const previous=contexts.get(this.uuid),card=damageCard(options),context={source:card?.type==="damage"?card.id:null,token:options.rsaBlessingTarget??options.rsaAutoDamageToken,undo:options.rsaUndoDamage===true};contexts.set(this.uuid,context);
  try{return await apply.call(this,damage,options);}finally{if(contexts.get(this.uuid)===context){if(previous)contexts.set(this.uuid,previous);else contexts.delete(this.uuid);}}
 };
}
export function captureBlessingDrop(actor,changes,options={}){
 const next=changes['system.attributes.hp.value']??changes.system?.attributes?.hp?.value;
 if(!enabled()||next===undefined||Number(next)!==0||!(Number(actor.system?.attributes?.hp?.value)>0)||options.rsaUndoDamage||contexts.get(actor.uuid)?.undo)return;
 const context=contexts.get(actor.uuid),token=victimToken(actor,context);if(!token)return;
 changes['flags.'+ID+'.darkBlessingDrop']={key:foundry.utils.randomID(),token:token.uuid,source:context?.source??null};
}
export function blessingDistance(a,b){
 const size=a.parent.grid.size,point=t=>({x:t.x+size/2,y:t.y+size/2,w:Math.max(1,t.width??1),h:Math.max(1,t.height??1)}),s=point(a),t=point(b);
 const x=Math.max(s.x,Math.min(t.x,s.x+(s.w-1)*size)),y=Math.max(s.y,Math.min(t.y,s.y+(s.h-1)*size)),tx=Math.max(t.x,Math.min(x,t.x+(t.w-1)*size)),ty=Math.max(t.y,Math.min(y,t.y+(t.h-1)*size));
 // Use the victim's scene grid: the active canvas can be on another scene (or
 // unavailable on the GM processing a player's kill).
 const grid=a.parent.grid,activeGrid=globalThis.canvas?.scene?.id===a.parent.id?globalThis.canvas?.grid:null;
 const distance=(grid.measurePath?grid:activeGrid)?.measurePath?.([{x,y},{x:tx,y:ty}])?.distance;return Math.max(distance??Infinity,Math.abs(Number(a.elevation??0)-Number(b.elevation??0)));
}
export function blessingRecipients(victim,sourceActor,sourceToken=null){
 if(!victim?.parent)return [];
 const recipients=new Map(),near=/^(m|meters?|metres?)$/i.test(victim.parent.grid.units??"ft")?10*0.3048:10;
 for(const token of values(victim.parent.tokens)){
  const actor=token.actor,feature=blessingFeature(actor);if(!feature||actor.statuses?.has("dead")||token.uuid===victim.uuid||token.disposition===0||victim.disposition!==(token.disposition===1?-1:1))continue;
  const own=actor.uuid===sourceActor?.uuid;if(own&&sourceToken?.uuid&&token.uuid!==sourceToken.uuid)continue;
  const levels=values(token.levels),other=values(victim.levels);if(!own&&levels.length&&other.length&&!levels.some(l=>other.includes(l)))continue;
  if(actor.uuid===sourceActor?.uuid||blessingDistance(token,victim)<=near)recipients.set(actor.uuid,{actor,token,feature});
 }
 return [...recipients.values()];
}
export function buildBlessingHeal(feature){
 const data=feature.toObject(),activity=values(data.system?.activities).find(a=>a.type==="heal"&&values(a.healing?.types).includes("temphp"));if(!activity)throw Error("Dark One’s Blessing needs its native temporary HP activity.");const id=activity._id;
 data._id=foundry.utils.randomID();data.system.activities={[id]:activity};data.effects=[];data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};
 activity.activation={type:"special",override:true};activity.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};activity.effects=[];activity.range={units:"self",override:true};activity.target={override:true,prompt:false,affects:{type:"self"},template:{type:""}};return {data,id};
}
function fixedBlessingAmount(actor,feature){
 const part=values(feature.system?.activities).find(a=>a.type==="heal"&&values(a.healing?.types).includes("temphp"))?.healing,formula=part?.custom?.enabled?part.custom.formula:part?.bonus;if(!formula)return null;
 const roll=new CONFIG.Dice.BasicRoll(formula,actor.getRollData?.()??{});return roll.isDeterministic===false?null:Number(roll.evaluateSync().total);
}
export async function processBlessingDrop(actor,changes,options={}){
 if(!authority()||!enabled()||options.rsaUndoDamage)return;
 // The pre-update marker already proves a positive-to-zero transition. A
 // synthetic actor's final delta need not repeat hp.value (it can instead
 // remove an override), so do not require that field a second time.
 const changedDrop=dropFrom(changes);if(!changedDrop?.key||Number(actor.system?.attributes?.hp?.value)!==0)return;
 // Repeat kills often change only the event key. Foundry omits unchanged
 // token/source fields from the update diff; recover them from this same event.
 const storedDrop=flag(actor,"darkBlessingDrop"),drop=storedDrop?.key===changedDrop.key?{...storedDrop,...changedDrop}:changedDrop;
 const victim=resolve(drop.token);if(victim?.actor?.uuid!==actor.uuid)return;const sourceCard=resolve(drop.source),sourceActor=sourceCard?.getAssociatedActor?.()??sourceCard?.getAssociatedItem?.()?.actor;
 const rawSource=sourceCard?.getAssociatedToken?.(),sourceToken=rawSource?.document??rawSource;
 for(const c of blessingRecipients(victim,sourceActor,sourceToken)){
  const prior=flag(c.actor,"darkBlessingEvents")??[];if(prior.includes(drop.key))continue;
  await c.actor.setFlag(ID,"darkBlessingEvents",[...prior.slice(-63),drop.key]);
  const amount=fixedBlessingAmount(c.actor,c.feature);if(Number.isFinite(amount)&&Number(c.actor.system?.attributes?.hp?.temp??0)>=amount)continue;
  const {data,id}=buildBlessingHeal(c.feature),helper=new CONFIG.Item.documentClass(data,{parent:c.actor});helper.prepareFinalAttributes?.();const activity=helper.system.activities.get(id),targets=[describeTarget(c.token)],flags={[ID]:{riderTriggered:true,activityOverrideData:data,darkBlessingHeal:{drop:drop.key,victim:victim.uuid,source:drop.source}},dnd5e:{item:{data}}};
  const result=await activity.use({consume:false,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets},flags}});
  if(!result?.message)throw Error("Dark One’s Blessing could not create its temporary HP card.");
  // The native formula is fixed HP, so resolve it without a Roll dialog while
  // retaining the native healing card, application settings and Undo workflow.
  await activity.rollDamage({isCritical:false},{configure:false},{data:{system:{origin:result.message.id,targets},flags}});
 }
}
function report(error){console.error("Dark One’s Blessing",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"darkOnesBlessingAutomation",{name:"Fiend: Dark One’s Blessing",hint:"When an enemy drops from positive HP to 0, create the Fiend Warlock’s native temporary HP card if they dealt the finishing damage, or if the enemy fell within 10 feet of them. Uses automatic healing prompt/application settings, preserves higher temporary HP, ignores Undo and prevents duplicate triggers.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 installBlessingContext();Hooks.on("preUpdateActor",captureBlessingDrop);Hooks.on("updateActor",(actor,changes,options)=>{if(dropFrom(changes)?.key)enqueue(()=>processBlessingDrop(actor,changes,options)).catch(report);});
});
