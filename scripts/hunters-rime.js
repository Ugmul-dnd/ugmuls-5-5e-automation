import {riderKey} from "./bonus-damage-riders.js";
import {createEventQueue,describeTarget} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",HEAL="rP3N0Wu7QGMsQk4P",CAST="vxr2JKuQ3jyMDTwb",enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]);
export const rimeFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&((i.identifier??i.system?.identifier)==="hunters-rime"||/^hunter[’']s rime$/i.test(i.name?.trim()??"")||[i._stats?.compendiumSource,i._stats?.duplicateSource,i.flags?.core?.sourceId].some(r=>r?.endsWith(".hofWiwHuntersRim"))));
export function rimeCast(activity,results){
 const card=results?.message,actor=activity?.actor??activity?.item?.actor;
 if(game.settings.get(ID,"huntersRimeAutomation")!==true||!actor?.isOwner||!card||riderKey(activity?.item)!=="hunters-mark"||!rimeFeature(actor))return null;
 if(card.getFlag?.(ID,"riderTriggered")||card.getFlag?.(ID,"huntersRimeHealing"))return null;
 // Moving a mark and rolling its damage are not fresh spell casts. The
 // native cast can spend Favored Enemy uses instead of a spell slot.
 if(activity.id!==CAST&&!(activity.type==="utility"&&activity.activation?.override!==true&&activity.consumption?.spellSlot===true))return null;
 return {actor,card,feature:rimeFeature(actor)};
}
export function buildRimeHealing(feature){
 const data=feature.toObject(),use=data.system?.activities?.[HEAL];if(use?.type!=="heal")throw Error("Hunter’s Rime is missing its native temporary HP activity.");
 data.name="Hunter’s Rime";data.effects=[];data.system.activities={[HEAL]:use};data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};
 use.name="Temporary Hit Points";use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.effects=[];use.appliedEffects=[];use.duration={units:"inst",override:true,concentration:false};use.range={units:"self",override:true};use.target={override:true,prompt:false,template:{type:""},affects:{type:"self",choice:false}};
 use.flags??={};if(use.flags.dnd5e)delete use.flags.dnd5e.dependentOn;
 return {data,id:HEAL};
}
export function grantRime(activity,usage,results){return enqueue(async()=>{
 const c=rimeCast(activity,results);if(!c||c.card.getFlag?.(ID,"huntersRimeGranted"))return;
 const {actor,card,feature}=c,{data,id}=buildRimeHealing(feature);
 const helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();const heal=helper.system.activities.get(id);
 const ref=card.getAssociatedToken?.()??actor.token,token=ref?.document??ref;
 const targets=[token?.actor?.uuid===actor.uuid?describeTarget(token):{actor:actor.uuid,name:actor.name,img:actor.img}];
 const flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,huntersRimeHealing:{cast:card.id,actor:actor.uuid}}};
 const visibility={speaker:card.speaker,whisper:values(card.whisper).map(u=>typeof u==="string"?u:u.id),blind:card.blind??false};
 const result=await heal.use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{...visibility,system:{targets},flags}});
 if(!result?.message)throw Error("Hunter’s Rime could not create its temporary HP card.");
 await card.setFlag(ID,"huntersRimeGranted",{message:result.message.id});
 const healingData={...visibility,system:{origin:result.message.id,targets},flags};
 if(globalThis.Ugmuls55eAutomationHealing)await globalThis.Ugmuls55eAutomationHealing.roll(heal,result.message,healingData);
 else await heal.rollDamage({isCritical:false},{configure:false},{data:healingData});
 return result.message;
});}
Hooks.once("init",()=>game.settings.register(ID,"huntersRimeAutomation",{name:"Winter Walker: Hunter’s Rime",hint:"On a fresh Hunter’s Mark cast, automatically roll 1d10 + Ranger level temporary HP for the caster using normal healing application settings. Moving the mark grants no additional temporary HP. Disengage restrictions remain manual.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>Hooks.on("dnd5e.postUseActivity",(a,u,r)=>grantRime(a,u,r).catch(error=>{console.error("Hunter’s Rime",error);ui.notifications.error(error.message);} )));
