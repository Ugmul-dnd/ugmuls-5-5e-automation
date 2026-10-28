import {createEventQueue} from "./shared-activity-card.js";
import {psiWarriorResource} from "./psionic-strike.js";
const ID="ugmuls-5-5e-automation",SAVE="huc5SywaDq7bpKXL",enqueue=createEventQueue(),values=c=>Array.from(c?.values?.()??c??[]);
const stamp=()=>game.combat?.started?game.combat.id+":"+game.combat.round+":"+game.combat.turn:null;
export const adeptFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&(i.identifier??i.system?.identifier)==="telekinetic-adept"&&i.system?.source?.rules!=="2014");
const origin=card=>typeof card?.system?.origin==="string"?game.messages.get(card.system.origin.replace(/^ChatMessage\./,"")):card?.system?.origin;
export function thrustContext(card,user=game.user){
 if(game.settings.get(ID,"telekineticThrustAutomation")!==true||card?.type!=="damage"||card.getFlag?.(ID,"pendingDamage")||!card.rolls?.some(r=>r._evaluated))return null;
 const usage=origin(card),meta=card.getFlag?.(ID,"psionicStrike")??usage?.getFlag?.(ID,"psionicStrike"),actor=card.getAssociatedActor?.(),feature=adeptFeature(actor),resource=psiWarriorResource(actor),targets=card.system?.targets??[];
 const activity=values(feature?.system?.activities).find(a=>a.type==="save"&&(a.id===SAVE||a.name==="Telekinetic Thrust")),target=targets.length===1?globalThis.fromUuidSync?.(targets[0].token,{strict:false}):null;
 if(!meta||!usage||!activity||meta.actor!==actor?.uuid||meta.feature!==resource?.uuid||meta.turn!==stamp()||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||!target)return null;
 const source=game.messages.get(meta.source);if(source?.getAssociatedActor?.()?.uuid!==actor.uuid||!source.system?.targets?.some(t=>t.token===target.uuid))return null;
 return {actor,feature,activity,target,targets,usage,used:usage.getFlag?.(ID,"telekineticThrust")};
}
export function prepareThrust(feature,activity,choice){
 const data=feature.toObject(),id=activity.id,use=data.system.activities[id];data.system.activities={[id]:use};
 use.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};use.activation={type:"special",override:true};use.damage={...use.damage,parts:[],onSave:"none"};
 use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};
 if(choice==="push"){data.effects=[];use.effects=[];}else{
  data.effects??=[];let effect=data.effects.find(e=>e._id==="ZPKFHdfky1q3rsHm"||(e.statuses??[]).includes("prone"));
  if(!effect){effect={_id:"ZPKFHdfky1q3rsHm",name:"Prone",img:"systems/dnd5e/icons/svg/statuses/prone.svg",type:"base",system:{changes:[]},statuses:["prone"]};data.effects.push(effect);}
  effect.disabled=false;effect.transfer=false;effect.duration={value:null,units:"seconds",expiry:null,expired:false};use.effects=[{_id:effect._id,onSave:false}];use.appliedEffects=[effect._id];
 }
 data.name="Telekinetic Thrust — "+(choice==="push"?"Push":"Prone");return {data,id};
}
export function useThrust(card,choice,user=game.user){return enqueue(async()=>{
 let c=thrustContext(card,user);if(!c||c.used||!["prone","push"].includes(choice))throw Error("Telekinetic Thrust needs this turn’s rolled Psionic Strike damage and the Fighter’s ownership.");
 // Save creation runs alongside the Force roll. Native outcome application
 // still waits for the save result and its dice animations.
 const {data,id}=prepareThrust(c.feature,c.activity,choice),helper=new CONFIG.Item.documentClass(data,{parent:c.actor});helper.prepareFinalAttributes?.();
 const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false}},{configure:false},{data:{system:{targets:c.targets},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,telekineticThrustSave:{source:card.id,choice}}}}});
 if(!result?.message)throw Error("Telekinetic Thrust did not create a save card.");await c.usage.setFlag(ID,"telekineticThrust",{message:result.message.id,source:card.id,choice});globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return result;
});}
function report(error){console.error("Telekinetic Thrust",error);ui.notifications.error(error.message);}
export function thrustAvailable(actor){return game.settings.get(ID,"telekineticThrustAutomation")===true&&!!adeptFeature(actor)&&values(adeptFeature(actor).system?.activities).some(a=>a.type==="save"&&(a.id===SAVE||a.name==="Telekinetic Thrust"));}
export async function chooseStrikeMode(actor){
 if(!thrustAvailable(actor))return "damage";
 return foundry.applications.api.DialogV2.wait({window:{title:"Psionic Strike"},content:"",rejectClose:false,
  render:(_event,dialog)=>{const footer=dialog.element.querySelector('.form-footer');if(footer)Object.assign(footer.style,{flexDirection:"column",alignItems:"stretch"});},
  buttons:[{action:"damage",label:"Damage Only",default:true,callback:()=>"damage"},{action:"prone",label:"Prone",callback:()=>"prone"},{action:"push",label:"Push",callback:()=>"push"}]});
}
const autoRunning=new Set();
export async function resolveSelectedThrust(card){
 if(!game.user.isGM||game.users.activeGM?.id!==game.user.id||autoRunning.has(card?.id))return;
 const meta=card?.getFlag?.(ID,"psionicStrike")??origin(card)?.getFlag?.(ID,"psionicStrike");if(!["prone","push"].includes(meta?.thrust))return;
 const c=thrustContext(card);if(!c||c.used)return;autoRunning.add(card.id);
 try{return await useThrust(card,meta.thrust);}finally{autoRunning.delete(card.id);}
}
export function renderThrust(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){node.querySelectorAll(':scope > .rsa-telekinetic-thrust').forEach(n=>n.remove());if(card.isContentVisible===false)continue;
  const c=thrustContext(card),push=card.getFlag?.(ID,"telekineticThrustSave")?.choice==="push";if(!c&&!push)continue;
  const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-telekinetic-thrust";
  if(push)controls.textContent="On a failed save, move the target up to 10 feet horizontally. Movement is manual.";
  else if(c.used)controls.textContent="Telekinetic Thrust: "+(c.used.choice==="push"?"Push":"Prone");else if(["prone","push"].includes((card.getFlag?.(ID,"psionicStrike")??origin(card)?.getFlag?.(ID,"psionicStrike"))?.thrust))controls.textContent="Telekinetic Thrust: waiting for the Strength save.";
  if(controls.childNodes.length)node.append(controls);
 }
}
Hooks.once("init",()=>game.settings.register(ID,"telekineticThrustAutomation",{name:"Telekinetic Thrust Assistance",hint:"Choose Damage Only, Prone or Push when using Psionic Strike. Alongside the Force damage roll, automatically prompt the selected native Strength save without another button or Energy Die.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationThrust={available:thrustAvailable,chooseStrikeMode};
 Hooks.on("dnd5e.renderChatMessage",renderThrust);
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{if(card?.type==="damage")resolveSelectedThrust(card).catch(report);});
});
