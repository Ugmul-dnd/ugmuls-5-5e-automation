import {updateSpellSlot} from "./turn-resources.js";
const ID="ugmuls-5-5e-automation",values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"psionicSorceryAutomation")===true;
export function psionicEligible(activity){
 const item=activity?.item,actor=activity?.actor??item?.actor;// Reaction spells bypass the cast-time choice window and keep native slot consumption.
 if(String(activity?.activation?.type??item?.system?.activation?.type??"").startsWith("reaction"))return false;
 if(!enabled()||item?.type!=="spell"||(!Number.isInteger(Number(item.system?.level))||Number(item.system?.level)<1)||!actor?.isOwner)return false;
 const items=values(actor.items);if(!items.some(i=>i.type==="feat"&&key(i)==="psionic-sorcery"&&i.system?.source?.rules!=="2014"))return false;
 if(item.system.sourceItem==="subclass:aberrant")return true;
 const feature=items.find(i=>i.type==="feat"&&key(i)==="psionic-spells"),subclass=items.find(i=>i.type==="subclass"&&key(i)==="aberrant"),grants=values(subclass?.system?.advancement).filter(a=>a.type==="ItemGrant"&&a.title==="Psionic Spells"),sources=new Set(grants.flatMap(a=>values(a.configuration?.items).map(i=>i.uuid)));
 for(const match of String(feature?.system?.description?.value??"").matchAll(/@UUID\[(Compendium\.[^\]]+\.spells\.Item\.[^\]]+)\]/g))sources.add(match[1]);
 const origin=item.flags?.dnd5e?.advancementOrigin;
 return [item._stats?.compendiumSource,item._stats?.duplicateSource].some(s=>sources.has(s))||!!subclass&&grants.some(a=>origin===subclass.id+"."+(a.id??a._id));
}
function followup(usage,message){const flags=message?.data?.flags?.[ID]??{};return flags.regionTriggered||flags.riderTriggered||flags.recurringTrigger||usage?.cause?.activity;}
export function deferPsionicPayment(activity,usage,dialog,message){
 if(!psionicEligible(activity)||followup(usage,message))return;
 message.data??={};message.data.flags??={};message.data.flags[ID]??={};message.data.flags[ID].psionicPayment={actor:activity.actor.uuid,item:activity.item.uuid,chargeSlot:usage.consume===true||usage.consume?.spellSlot===true};
 if(usage.consume===true)usage.consume={action:true,resources:true,spellSlot:false};else if(usage.consume&&typeof usage.consume==="object")usage.consume.spellSlot=false;
 const Base=dialog.applicationClass;if(Base)dialog.applicationClass=class extends Base{_shouldDisplay(section){return section==="consume.spellSlot"?false:super._shouldDisplay(section);}};
}
export function preparePsionicPayment(activity,usage,message){
 const state=message?.data?.flags?.[ID]?.psionicPayment;if(!state||followup(usage,message))return;
 if(!psionicEligible(activity))return false;
 const slot=usage.spell?.slot,level=Number(activity.actor.system?.spells?.[slot]?.level??(Number(activity.item.system.level)+Number(usage.scaling??0)));
 Object.assign(state,{slot,level});if(usage.consume===true)usage.consume={action:true,resources:true,spellSlot:false};else if(usage.consume&&typeof usage.consume==="object")usage.consume.spellSlot=false;
}
export const psionicCost=selection=>selection?.psionicPoints===true?Number(selection.psionicPayment?.level)||0:0;
function slotProblem(actor,payment){
 if(!payment?.chargeSlot)return "";
 if(!/^spell[1-9]$|^pact$/.test(payment.slot??"")||Number(actor.system?.spells?.[payment.slot]?.value??0)<1)return "No spell slot is available at the selected level. Use Sorcery Points or cancel.";
 if(globalThis.Ugmuls55eAutomationResources?.hasCastWithSlot(actor))return "A spell slot has already been used to cast a spell this turn. Use Sorcery Points or cancel.";
 return "";
}
export function validatePsionic(activity,selection){
 const state=selection.psionicPayment;if(!state&&!selection.psionicPoints)return;
 if(!state||!psionicEligible(activity)||state.actor!==activity.actor.uuid||state.item!==activity.item.uuid||!Number.isInteger(state.level)||state.level<1||state.level>9)throw Error("Psionic Sorcery is no longer eligible for this casting.");
 if(!selection.psionicPoints){const problem=slotProblem(activity.actor,state);if(problem)throw Error(problem);}
}
export function initialPsionic(message,actor){const payment=flag(message,"psionicPayment");return {psionicPayment:payment?structuredClone(payment):undefined,psionicPoints:!!payment&&!!slotProblem(actor,payment)};}
export function psionicMarkup(activity,selection){
 const p=selection.psionicPayment;if(!p||!psionicEligible(activity))return "";
 return '<fieldset class="rsa-psionic-payment"><legend>Spell Payment</legend><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" data-psionic-points '+(selection.psionicPoints?'checked':'')+'> Use Sorcery Points — Psionic Sorcery ('+p.level+' SP)</label><p>Metamagic costs are added separately. This choice does not use a Metamagic option.</p></fieldset>';
}
export async function payPsionicSlot(activity,message,selection){
 validatePsionic(activity,selection);const payment=selection.psionicPayment;
 if(!payment)return {refund:async()=>{},updates:{}};
 const recorded=flag(message,"psionicPayment");if(!recorded||recorded.actor!==payment.actor||recorded.item!==payment.item||recorded.slot!==payment.slot||recorded.level!==payment.level||recorded.chargeSlot!==payment.chargeSlot)throw Error("Psionic Sorcery payment changed. Reopen the casting.");
 const updates={["flags."+ID+".psionicSorcery"]:{points:selection.psionicPoints===true,level:payment.level,slot:payment.slot}};
 if(selection.psionicPoints){
  const data=activity.item.toObject(),materials=data.system.materials??{};data.system.properties=values(data.system.properties).filter(p=>!["vocal","somatic"].includes(p)&&(p!=="material"||materials.consumed||Number(materials.cost)>0));
  updates["flags."+ID+".activityOverrideData"]=data;return {refund:async()=>{},updates};
 }
 if(!payment.chargeSlot)return {refund:async()=>{},updates};
 const actor=activity.actor,path="system.spells."+payment.slot+".value",usage=flag(message,"castSession")??message.id,before=Number(actor.system.spells[payment.slot].value);let marker,paid=false;
 const refund=async()=>{if(!paid)return;paid=false;await updateSpellSlot(actor,path,Number(actor.system.spells[payment.slot].value)+1);if(marker&&!marker.disabled&&marker.getFlag?.(ID,"resourceUsage")===usage)await marker.update({disabled:true});};
 try{await updateSpellSlot(actor,path,before-1);paid=true;marker=await globalThis.Ugmuls55eAutomationResources?.markSpellCast(actor,{usage});if(marker&&marker.getFlag?.(ID,"resourceUsage")!==usage)throw Error("A spell slot has already been used this turn.");}catch(error){await refund();throw error;}
 return {refund,updates};
}
Hooks.once("init",()=>game.settings.register(ID,"psionicSorceryAutomation",{name:"Aberrant: Psionic Sorcery",hint:"Choose spell slots or Sorcery Points for eligible Psionic Spells in Select Metamagic. Track the selected casting level, Metamagic costs and cancellation refunds together.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{globalThis.Ugmuls55eAutomationPsionic={eligible:psionicEligible,cost:psionicCost,validate:validatePsionic,initial:initialPsionic,markup:psionicMarkup,paySlot:payPsionicSlot};Hooks.on("dnd5e.preUseActivity",deferPsionicPayment);Hooks.on("dnd5e.preActivityConsumption",preparePsionicPayment);});
