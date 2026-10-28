import {hollowWrathState,isHollowWrath} from "./hollow-wrath-aura.js";
import {createEventQueue,describeTarget} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",HEAL="zQ4ZfXrhQTeXSoS9",BOOK="rhwHWHungeringoi",enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"hungeringMightAutomation")===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
export const hungeringFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&([i._stats?.compendiumSource,i._stats?.duplicateSource,i.flags?.core?.sourceId].some(ref=>typeof ref==="string"&&ref.endsWith("."+BOOK))||(i.identifier??i.system?.identifier)==="hungering-might"||/^hungering might$/i.test(i.name?.trim()??"")));
export function hungeringBloodied(actor){
 const hp=actor?.system?.attributes?.hp,max=hp?.effectiveMax??(Number(hp?.max)+Number(hp?.tempmax??0));
 return Number.isFinite(hp?.value)&&Number.isFinite(max)&&max>0&&hp.value>0&&hp.value<=max/2;
}
export function recordHungeringAttack(card){
 if(!enabled()||card.type!=="attack"||!card.rolls?.length)return;
 const actor=card.getAssociatedActor?.();if(!hungeringFeature(actor))return;
 const state=hollowWrathState(actor,null,{ignoreAuraSetting:true});
 card.updateSource({["flags."+ID+".hungeringAttack"]:{actor:actor.uuid,turn:turn(),bloodied:hungeringBloodied(actor),transformation:state?.enchantment.uuid??null}});
}
export function hungeringContext(card){
 if(!enabled()||card?.type!=="attack"||!card.rolls?.length||flag(card,"hungeringHealing"))return null;
 const meta=flag(card,"hungeringAttack"),actor=card.getAssociatedActor?.();
 if(!meta||meta.actor!==actor?.uuid||meta.turn!==turn()||!meta.bloodied||!hungeringFeature(actor)||!hungeringBloodied(actor))return null;
 const state=hollowWrathState(actor,null,{ignoreAuraSetting:true}),activity=values(state?.item.system?.activities).find(a=>a.id===HEAL&&a.type==="heal");
 if(!state||meta.transformation!==state.enchantment.uuid||!activity||!values(card.system?.evaluatedTargets).some(t=>t.isMiss===false))return null;
 const ref=card.getAssociatedToken?.()??actor.token,token=ref?.document??ref;if(!token?.uuid||token.actor?.uuid!==actor.uuid)return null;
 return {...state,activity,token,turn:turn(),used:!!turn()&&flag(actor,"hungeringMightTurn")?.turn===turn()};
}
export function buildHungeringHeal(item){
 const data=item.toObject(),use=data.system.activities[HEAL];if(use?.type!=="heal")throw Error("Wrath of the Wild is missing its native Hungering Might healing activity.");
 data.name="Hungering Might";data.effects=[];data.system.activities={[HEAL]:use};data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};
 use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.effects=[];use.appliedEffects=[];use.duration={units:"inst",concentration:false,override:true};use.target={override:true,prompt:false,template:{type:""},affects:{type:"self",choice:false}};use.range={override:true,units:"self"};
 // Eligibility was checked from actual HP at the hit. The book's status
 // multiplier can otherwise zero healing when a Bloodied icon is not enabled.
 if(use.healing?.custom?.enabled)use.healing.custom.formula=use.healing.custom.formula.replace(/\*\s*@statuses\.bloodied\b/g,"");
 use.flags??={};if(use.flags.dnd5e)delete use.flags.dnd5e.dependentOn;
 const quiet={version:5,isEnabled:false,isCustomized:false,killAnim:true};data.flags.autoanimations=quiet;use.flags.autoanimations=quiet;
 return {data,id:HEAL};
}
export function triggerHungeringHeal(card){return enqueue(async()=>{
 if(!authority())return;
 let c=hungeringContext(card);if(!c||c.used)return;
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
 c=hungeringContext(card);if(!c||c.used)return;
 const previous=flag(c.actor,"hungeringMightTurn");let published=false;
 try{
  if(c.turn)await c.actor.setFlag(ID,"hungeringMightTurn",{turn:c.turn,attack:card.id});
  const {data,id}=buildHungeringHeal(c.item),helper=new CONFIG.Item.documentClass(data,{parent:c.actor});helper.prepareFinalAttributes?.();const activity=helper.system.activities.get(id);
  const targets=[describeTarget(c.token)],flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,hungeringMightHealing:{actor:c.actor.uuid,attack:card.id,turn:c.turn}}};
  const visibility={speaker:card.speaker,whisper:values(card.whisper).map(u=>typeof u==="string"?u:u.id),blind:card.blind??false};
  const result=await activity.use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{...visibility,system:{targets},flags}});
  if(!result?.message)throw Error("Hungering Might could not create its healing card.");published=true;
  await card.setFlag(ID,"hungeringHealing",{message:result.message.id,turn:c.turn});
  const healingData={...visibility,system:{origin:result.message.id,targets},flags};
  const rolls=globalThis.Ugmuls55eAutomationHealing?await globalThis.Ugmuls55eAutomationHealing.roll(activity,result.message,healingData):await activity.rollDamage({isCritical:false},{configure:false},{data:healingData});
  if(!rolls?.pending&&!rolls?.length)throw Error("Hungering Might's healing card is ready; use its Healing button to retry the roll.");
  return result.message;
 }finally{
  if(!published&&c.turn){if(previous===undefined)await c.actor.unsetFlag(ID,"hungeringMightTurn");else await c.actor.setFlag(ID,"hungeringMightTurn",previous);}
 }
});}
export function guardManualHungering(activity,usage,dialog,message){
 if(!enabled()||activity?.id!==HEAL||!isHollowWrath(activity.item)||message?.data?.flags?.[ID]?.riderTriggered)return;
 const actor=activity.actor??activity.item.actor;if(turn()&&flag(actor,"hungeringMightTurn")?.turn===turn()){ui.notifications.warn("Hungering Might has already been used this turn.");return false;}
}
export async function recordManualHungering(activity,usage,results){
 if(!enabled()||activity?.id!==HEAL||!isHollowWrath(activity.item)||!results?.message||flag(results.message,"riderTriggered")||!activity.actor?.isOwner||!turn())return;
 await activity.actor.setFlag(ID,"hungeringMightTurn",{turn:turn(),message:results.message.id});
}
function report(error){console.error("Hungering Might",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"hungeringMightAutomation",{name:"Hollow Warden: Hungering Might",hint:"While transformed and Bloodied, automatically roll Hungering Might's native healing after a confirmed attack hit, once per combat turn. Use normal healing application/Undo settings. No additional transformation cost.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("preCreateChatMessage",recordHungeringAttack);
 Hooks.on("createChatMessage",card=>{if(card.type==="attack")triggerHungeringHeal(card).catch(report);});
 Hooks.on("updateChatMessage",(card,changes)=>{if(card.type==="attack"&&(changes.rolls||changes.system?.targets||Object.keys(changes).some(k=>k.startsWith("system.targets"))))triggerHungeringHeal(card).catch(report);});
 Hooks.on("dnd5e.preUseActivity",guardManualHungering);
 Hooks.on("dnd5e.postUseActivity",(a,u,r)=>recordManualHungering(a,u,r).catch(report));
});
