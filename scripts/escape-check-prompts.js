import {selectSaveUser} from "./save-prompts.js";
const ID="ugmuls-5-5e-automation",opened=new Set();
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export async function promptEscapeCheck(card){
 if(!authority())return;
 const link=card.getFlag(ID,"recurringTrigger");if(!["manualCheck","check"].includes(link?.phase))return;
 const effect=await fromUuid(link.effect),state=effect?.getFlag?.(ID,"recurringEffect");if(!effect||effect.disabled||state?.instance!==link.instance||card.system.outcomes?.has(card.system.targets?.[0]?.token))return;
 const token=await fromUuid(card.system.targets?.[0]?.token),user=token?.actor&&selectSaveUser(token.actor,game.users,game.users.activeGM);if(!user)return;
 const session={id:foundry.utils.randomID(),user:user.id,source:game.user.id};
 await card.setFlag(ID,"escapeCheckSession",session);await card.setFlag(ID,"recurringTrigger",{...link,phase:"check"});
 const packet={action:"promptEscapeCheck",card:card.id,session:session.id,user:user.id,source:game.user.id};
 if(user.id===game.user.id)receiveEscapeCheck(packet).catch(report);else game.socket.emit("module."+ID,packet);
}
export async function receiveEscapeCheck(packet){
 if(packet.user!==game.user.id)return;
 const card=game.messages.get(packet.card),session=card?.getFlag?.(ID,"escapeCheckSession"),link=card?.getFlag?.(ID,"recurringTrigger");
 if(!session||session.id!==packet.session||session.user!==game.user.id||session.source!==packet.source||game.users.activeGM?.id!==packet.source||opened.has(packet.session)||link?.phase!=="check")return;
 const effect=await fromUuid(link.effect),state=effect?.getFlag?.(ID,"recurringEffect"),token=await fromUuid(card.system.targets?.[0]?.token),actor=token?.actor;
 if(!actor?.isOwner||!effect||effect.disabled||state?.instance!==link.instance||card.system.outcomes?.has(token.uuid))return;
 opened.add(packet.session);
 try{
  const dialogId="rsa-escape-check-"+card.id;
  const apps=foundry.applications.instances?Array.from(foundry.applications.instances.values()):Object.values(ui.windows??{});
  for(const app of apps)if(app.id===dialogId||app.options?.id===dialogId)await app.close();
  const activity=card.getAssociatedActivity(),dialog={configure:true,options:{id:dialogId}};
  const positioned=globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("save",dialog)??dialog;
  await actor.rollSkill({skill:"ath",ability:"str",target:state.dc},positioned,{data:{speaker:ChatMessage.getSpeaker({actor,token,scene:token.parent}),system:{...activity.messageSources,origin:card.id},flags:{[ID]:{escapeCheckResult:{card:card.id,session:packet.session}}}}});
 }finally{opened.delete(packet.session);}
}
export function validateEscapeCheckResult(card){const link=card.getFlag?.(ID,"escapeCheckResult");if(!link)return;const session=game.messages.get(link.card)?.getFlag?.(ID,"escapeCheckSession");if(session?.id!==link.session||session.user!==game.user.id)return false;}
function report(error){console.error("Escape check prompt",error);ui.notifications.error(error.message);}
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationEscapeChecks={prompt:promptEscapeCheck};
 Hooks.on("preCreateChatMessage",validateEscapeCheckResult);
 game.socket.on("module."+ID,packet=>{if(packet?.action==="promptEscapeCheck")receiveEscapeCheck(packet).catch(report);});
});
