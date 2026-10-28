import {selectSaveUser} from "./save-prompts.js";
const ID="ugmuls-5-5e-automation",opened=new Set(),local=new Map();
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
export function healingRecipient(actor,card){
 const users=Array.from(game.users??[]),whisper=Array.from(card.whisper??[],u=>typeof u==="string"?u:u.id);
 const allowed=users.filter(u=>!whisper.length||u.isGM||whisper.includes(u.id));
 return selectSaveUser(actor,allowed,game.users.activeGM)??game.user;
}
export async function receiveAutomaticHealing(card){
 const request=flag(card,"automaticHealingPrompt");if(!request||request.user!==game.user.id||opened.has(card.id))return;
 const activity=local.get(card.id)??card.getAssociatedActivity?.({scaled:true});
 const actor=activity?.actor??activity?.item?.actor;
 if(activity?.type!=="heal"||!actor?.isOwner||actor.uuid!==request.actor)return;
 if(Array.from(card.getAssociatedRolls?.("healing")??[]).some(c=>c.rolls?.length))return;
 opened.add(card.id);
 try{
  const data=request.data??{},dialog=globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("damage",{configure:true})??{configure:true};
  await activity.rollDamage({isCritical:false},dialog,{data:{...data,system:{...data.system,origin:card.id,targets:card.system?.targets??data.system?.targets}}});
 }catch(error){opened.delete(card.id);throw error;}
 finally{local.delete(card.id);}
}
export async function rollAutomaticHealing(activity,card,data){
 if(game.settings.get(ID,"skipAutomaticHealingPrompts")===true)return activity.rollDamage({isCritical:false},{configure:false},{data});
 const actor=activity.actor??activity.item?.actor,user=healingRecipient(actor,card);
 local.set(card.id,activity);
 await card.setFlag(ID,"automaticHealingPrompt",{actor:actor.uuid,user:user.id,data});
 // Do not hold the GM's turn/action queue open while a player considers Roll.
 if(user.id===game.user.id)receiveAutomaticHealing(card).catch(report);else local.delete(card.id);
 return {pending:true};
}
function report(error){console.error("Automatic healing prompt",error);ui.notifications.error("Could not open the healing roll. Use the healing card to retry: "+error.message);}
Hooks.once("init",()=>game.settings.register(ID,"skipAutomaticHealingPrompts",{name:"Skip Automatic Healing Roll Prompts",hint:"Roll automated healing and temporary HP immediately instead of asking the owning player to click Roll. Applies to Hunter’s Rime, Hungering Might, Survivor and recurring healing. Healing application settings remain separate.",scope:"world",config:true,type:Boolean,default:false}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationHealing={roll:rollAutomaticHealing};
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{if(flag(card,"automaticHealingPrompt"))receiveAutomaticHealing(card).catch(report);});
 Hooks.on("deleteChatMessage",card=>{opened.delete(card.id);local.delete(card.id);});
});
