import {createEventQueue} from "./shared-activity-card.js";
import {invalidateHelperCard} from "./spell-escapes.js";
const ID="ugmuls-5-5e-automation",channel="module."+ID,enqueue=createEventQueue(),wrapped=new WeakSet(),waiting=new Map();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"beguilingTwistAutomation")===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const owns=(actor,user)=>!!actor&&!!user&&(user.isGM||actor.testUserPermission?.(user,"OWNER"));
const conditions={charmed:{id:"rsaTwistCharm001",label:"Charmed"},frightened:{id:"rsaTwistFear0001",label:"Frightened"}};
export const twistFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&(key(i)==="beguiling-twist"||/^beguiling twist$/i.test(i.name?.trim()??"")));
export function prepareTwist(feature,id,choice=null){
 const data=feature.toObject(),use=data.system.activities[id];if(!use||use.type!=="save")throw Error("Beguiling Twist needs its native Wisdom save activity.");
 data.flags??={};data.flags[ID]={...data.flags[ID],beguilingTwistPrepared:true};data.system.activities={[id]:use};data.effects=[];
 use.name="Beguiling Twist";use.effects=[];use.appliedEffects=[];use.damage={parts:[],onSave:"none"};
 if(choice){
  const option=conditions[choice];if(!option)throw Error("Choose Charmed or Frightened.");
  data.effects=[{_id:option.id,name:"Beguiling Twist — "+option.label,img:"systems/dnd5e/icons/svg/statuses/"+choice+".svg",type:"base",disabled:false,transfer:false,origin:feature.uuid,statuses:[choice],start:null,duration:{value:60,units:"seconds",expiry:"turnStart",expired:false},system:{changes:[],origin:{actor:feature.actor?.uuid,item:feature.uuid}},flags:{dnd5e:{isTemporary:true},[ID]:{beguilingTwistCondition:choice}}}];
  use.effects=[{_id:option.id,onSave:false}];use.appliedEffects=[option.id];
 }
 return data;
}
export function installTwistPreparation(Type){
 let proto=Type?.prototype;while(proto&&!Object.hasOwn(proto,"_createUsageMessage"))proto=Object.getPrototypeOf(proto);
 if(!proto||wrapped.has(proto)||typeof proto.use!=="function")return;wrapped.add(proto);const original=proto.use;
 proto.use=function(usage={},dialog={},message={}){
  if(!enabled()||this.type!=="save"||key(this.item)!=="beguiling-twist"||flag(this.item,"beguilingTwistPrepared")||message.data?.flags?.[ID]?.recurringTrigger)return original.call(this,usage,dialog,message);
  const data=prepareTwist(this.item,this.id),helper=new CONFIG.Item.documentClass(data,{parent:this.actor??this.item.actor});helper.prepareFinalAttributes?.();
  // Preserve the native manual Reaction, target confirmation and resource flow.
  return original.call(helper.system.activities.get(this.id),usage,dialog,{...message,data:{...message.data,flags:{...message.data?.flags,[ID]:{...message.data?.flags?.[ID],beguilingTwistInitial:{feature:this.item.uuid,activity:this.id},beguilingTwistChoice:null,activityOverrideData:data}}}});
 };
}
export function twistContext(card,user=game.user){
 if(!enabled()||card?.type!=="usage"||!flag(card,"beguilingTwistInitial")||flag(card,"recurringTrigger"))return null;
 const actor=card.getAssociatedActor?.(),feature=twistFeature(actor),record=flag(card,"beguilingTwistInitial");
 if(!feature||feature.uuid!==record.feature||!owns(actor,user))return null;
 const choice=flag(card,"beguilingTwistChoice"),targets=card.system?.targets??[],failed=targets.filter(t=>card.system?.outcomes?.get(t.token)==="failure");
 const locked=flag(card,"outcomeEffectsApplied")===true||(flag(card,"effectUndoHistory")?.length??0)>0;
 return {actor,feature,record,choice,targets,failed,locked};
}
export function chooseTwist(card,choice,user=game.user){return enqueue(async()=>{
 const c=twistContext(card,user);if(!c||!conditions[choice])throw Error("Only the caster's owner or GM can choose Charmed or Frightened for this Beguiling Twist.");
 if(c.locked)throw Error("Undo the applied Beguiling Twist effect before changing its condition.");
 const data=prepareTwist(c.feature,c.record.activity,choice);
 await card.update({["flags."+ID+".beguilingTwistChoice"]:choice,["flags."+ID+".activityOverrideData"]:data});invalidateHelperCard(card);
 return choice;
});}
export function applyTwist(card,user=game.user,{automatic=false}={}){return enqueue(async()=>{
 if(!authority())return false;
 let c=twistContext(card,user);if(!c||c.locked||!conditions[c.choice]||c.targets.length!==1||c.failed.length!==1)return false;
 if(automatic&&game.settings.get(ID,"autoApplySavedEffects")!==true)return false;
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 c=twistContext(card,user);if(!c||c.locked||!conditions[c.choice]||c.targets.length!==1||c.failed.length!==1)return false;
 const target=await fromUuid(c.failed[0].token);if(!target?.actor)return false;
 const effects=await card.getAssociatedActivity?.({scaled:true})?.getApplicableEffects?.()??[],effect=effects.find(e=>values(e.statuses).includes(c.choice));
 if(!effect)throw Error("The selected Beguiling Twist effect is unavailable. Choose its condition again.");
 const tray=document.createElement("effect-application");tray.chatMessage=card;
 const undo=globalThis.Ugmuls55eAutomationEffectUndo;
 if(!undo?.apply)throw Error("Beguiling Twist needs the module's native effect/Undo support.");
 const applied=await undo.apply(card,card,effect,target.actor,tray);
 if(!applied)throw Error("Beguiling Twist could not apply its selected effect.");
 await globalThis.Ugmuls55eAutomationRecurring?.registerRecurringEffect(applied,{spell:c.feature,level:0,sourceCard:card});
 await card.setFlag(ID,"outcomeEffectsApplied",true);
 globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return true;
});}
export function autoApplyTwist(card){return applyTwist(card,game.user,{automatic:true});}
function operate(operation,card,choice){
 const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return operation==="choose"?chooseTwist(card,choice):applyTwist(card);
 const requestId=foundry.utils.randomID();return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{waiting.delete(requestId);reject(Error("The GM did not answer the Beguiling Twist request."));},45000);waiting.set(requestId,{resolve,reject,timer});
  game.socket.emit(channel,{action:"beguilingTwistOperation",operation,sourceId:card.id,choice,userId:game.user.id,gmId:gm.id,requestId});
 });
}
export function renderTwist(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){
  node.querySelectorAll(':scope > .rsa-beguiling-choice').forEach(n=>n.remove());if(card.isContentVisible===false)continue;
  const c=twistContext(card);if(!c)continue;
  const section=document.createElement("div");section.className="rsa-beguiling-choice";section.dataset.rsaBeguilingChoice="true";section.style.cssText="padding:8px;display:grid;gap:6px;";
  const label=document.createElement("label");label.textContent="Beguiling Twist effect";
  const select=document.createElement("select");select.setAttribute("aria-label","Beguiling Twist effect");select.disabled=c.locked;
  for(const[value,text]of [["","Choose effect…"],["charmed","Charmed"],["frightened","Frightened"]]){const option=document.createElement("option");option.value=value;option.textContent=text;option.disabled=!value;select.append(option);}
  select.value=conditions[c.choice]?c.choice:"";
  select.addEventListener("change",async event=>{event.stopPropagation();select.disabled=true;try{await operate("choose",card,select.value);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});
  label.append(select);section.append(label);
  const note=document.createElement("p");note.textContent=c.locked?"Effect applied. Undo it before changing the condition.":"On a failed Wisdom save, apply the chosen condition for up to 1 minute. Repeat the save at the end of each turn; success ends the effect.";section.append(note);
  if(!c.locked&&conditions[c.choice]&&c.targets.length===1&&c.failed.length===1){const button=document.createElement("button");button.type="button";button.textContent="Apply "+conditions[c.choice].label;button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await operate("apply",card);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});section.append(button);}
  node.append(section);
 }
}
function report(error){console.error("Beguiling Twist",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"beguilingTwistAutomation",{name:"Beguiling Twist Condition Choice",hint:"Keep activation manual. The caster/GM chooses Charmed or Frightened on the save card. Failed saves apply only that condition with one-minute duration and end-turn repeat saves; normal saved-effect application settings apply.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationBeguiling={isCard:card=>!!(enabled()&&flag(card,"beguilingTwistInitial")&&!flag(card,"recurringTrigger")),applySavedChoice:autoApplyTwist};
 for(const type of Object.values(CONFIG.DND5E.activityTypes))installTwistPreparation(type.documentClass);
 Hooks.on("dnd5e.renderChatMessage",renderTwist);
 game.socket.on(channel,packet=>{
  if(packet?.action==="beguilingTwistReply"&&packet.userId===game.user.id){const entry=waiting.get(packet.requestId);if(!entry)return;clearTimeout(entry.timer);waiting.delete(packet.requestId);packet.error?entry.reject(Error(packet.error)):entry.resolve(packet.result);return;}
  if(packet?.action!=="beguilingTwistOperation"||!authority()||packet.gmId!==game.user.id)return;
  const user=game.users.get(packet.userId),card=game.messages.get(packet.sourceId);if(!user?.active||!card||!["choose","apply"].includes(packet.operation))return;
  Promise.resolve(packet.operation==="choose"?chooseTwist(card,packet.choice,user):applyTwist(card,user)).then(result=>game.socket.emit(channel,{action:"beguilingTwistReply",requestId:packet.requestId,userId:user.id,result}),error=>game.socket.emit(channel,{action:"beguilingTwistReply",requestId:packet.requestId,userId:user.id,error:error.message}));
 });
});
