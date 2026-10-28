import {mercyFlurryActions} from "./mercy-flurry.js";
import {flurryHealingActions} from "./hand-of-healing.js";
import {openAttackCounter} from "./multi-shot-attacks.js";
const ID="ugmuls-5-5e-automation",values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
export function flurryActivity(activity){
 const item=activity?.item;
 return item?.type==="feat"&&item.system?.source?.rules!=="2014"&&["monks-focus","heightened-focus"].includes(key(item))&&
  (["2ghJTBhilLrFn9xT","XLma1NEOJNEBD6mH"].includes(activity.id)||/^flurry of blows$/i.test(activity.name??""));
}
export function flurryAttackCount(actor){return values(actor?.items).some(i=>i.type==="feat"&&key(i)==="heightened-focus"&&i.system?.source?.rules!=="2014")?3:2;}
export function flurryStrike(actor){
 const items=values(actor?.items),find=(identifier,name)=>{
  const candidates=items.filter(i=>i.system?.source?.rules!=="2014"&&(key(i)===identifier||name.test(i.name??"")));
  for(const item of candidates){const activity=values(item.system?.activities).find(a=>a.type==="attack");if(activity)return activity;}
 };
 return find("empowered-strikes",/^empowered strikes?$/i)??find("unarmed-strike",/^unarmed strike$/i);
}
export function startFlurryCounter(activity,usage,results){
 const message=results?.message,actor=activity?.actor??activity?.item?.actor;
 if(game.settings.get(ID,"flurryOfBlowsAutomation")!==true||!flurryActivity(activity)||!message||message.author?.id!==game.user.id||!activity.item?.isOwner)return;
 const strike=flurryStrike(actor);if(!strike){ui.notifications.warn("Flurry of Blows needs an owned Empowered Strike or Unarmed Strike attack activity.");return;}
 return openAttackCounter({activity:strike,message,total:flurryAttackCount(actor),label:"Flurry of Blows",title:"Flurry of Blows — Remaining Attacks",resolveActivity:()=>flurryStrike(actor),getActions:state=>[...mercyFlurryActions(state,actor),...flurryHealingActions(state,actor)],attackFlags:{[ID]:{flurryOfBlows:{source:message.id,actor:actor.uuid}}}});
}
Hooks.once("init",()=>game.settings.register(ID,"flurryOfBlowsAutomation",{name:"Flurry of Blows Attack Counter",hint:"After using Flurry of Blows from Monk’s Focus or Heightened Focus, open an attack counter for the clicking user. Two attacks normally, three with Heightened Focus. Prefer Empowered Strike, otherwise Unarmed Strike. Pick a target before each attack; completed rolls count down without further Focus or action consumption. Mercy can replace one remaining attack with Hand of Healing at no extra Focus cost. Enable Flurry of Healing and Harm on its counter to spend one native daily use, unlock further healing replacements and make that Flurry’s Hand of Harm free.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>Hooks.on("dnd5e.postUseActivity",startFlurryCounter));
