import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const stamp=()=>game.combat?.started?game.combat.id+":"+game.combat.round+":"+game.combat.turn:null;
export const mercyFlurryFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="flurry-of-healing-and-harm"&&i.system?.source?.rules!=="2014");
const available=item=>{const uses=item?.system?.uses;return Math.max(0,Number(uses?.value??(Number(uses?.max)-Number(uses?.spent??0)))||0);};
export function mercyFlurryEnabled(message,actor){
 const record=message?.getFlag?.(ID,"mercyFlurry"),feature=mercyFlurryFeature(actor);if(!record?.enabled||!feature||record.actor!==actor?.uuid||record.feature!==feature.uuid||record.turn!==stamp())return false;
 const source=message.getAssociatedActor?.()??message.getAssociatedActivity?.()?.actor??message.getAssociatedActivity?.()?.item?.actor;
 return source?.uuid===actor.uuid;
}
export function freeFlurryHarm(attack,actor){
 const flurry=attack?.getFlag?.(ID,"flurryOfBlows");if(flurry?.actor!==actor?.uuid||!flurry.source)return false;
 const origin=attack.system?.origin,id=typeof origin==="string"?origin.replace(/^ChatMessage\./,""):origin?.id;
 return id===flurry.source&&mercyFlurryEnabled(game.messages.get(flurry.source),actor);
}
export async function activateMercyFlurry(state,actor){
 if(state.busy||state.firstPending||state.remaining<1||state.attacksCompleted>0||state.message.getFlag?.(ID,"flurryAttackStarted"))return false;
 state.busy=true;state.window?.render({force:true});
 try{return await enqueue(async()=>{
  const message=game.messages.get(state.message.id),feature=mercyFlurryFeature(actor);
  if(state.attacksCompleted>0||message?.getFlag?.(ID,"flurryAttackStarted"))return false;
  if(!message||message!==state.message||message.author?.id!==game.user.id||!actor?.isOwner||!feature||mercyFlurryEnabled(message,actor))return false;
  if(available(feature)<1)throw Error("No uses of Flurry of Healing and Harm remain.");
  const spent=Number(feature.system.uses.spent??0);await feature.update({"system.uses.spent":spent+1});
  try{await message.setFlag(ID,"mercyFlurry",{enabled:true,actor:actor.uuid,feature:feature.uuid,turn:stamp()});}
  catch(error){await feature.update({"system.uses.spent":Math.max(0,Number(feature.system.uses.spent??0)-1)});throw error;}
  await mercyFlurryNotice(actor,message);
  globalThis.Ugmuls55eAutomationChatRefresh?.request("handOfHarm",actor);return true;
 });}finally{state.busy=false;state.window?.render({force:true});}
}
export function mercyFlurryActions(state,actor){
 const feature=mercyFlurryFeature(actor);if(!feature)return[];const active=mercyFlurryEnabled(state.message,actor),left=available(feature);
 if(!active&&(state.attacksCompleted>0||state.message.getFlag?.(ID,"flurryAttackStarted")))return[];
 return[{key:"mercy-flurry",placement:"beforeCount",label:"Flurry of Healing and Harm",disabled:active||left<1,run:()=>activateMercyFlurry(state,actor)}];
}

export async function mercyFlurryNotice(actor,message){
 const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 try{return await ChatMessage.create({user:game.user.id,speaker:ChatMessage.getSpeaker({actor}),content:'<p>'+escape(actor.name??"Monk")+' activated <strong>Flurry of Healing and Harm</strong>. Spent 1 use.</p>',flags:{[ID]:{mercyFlurryNotice:{actor:actor.uuid,source:message.id}}}});}
 catch(error){console.warn("Flurry of Healing and Harm announcement could not be posted",error);return null;}
}
