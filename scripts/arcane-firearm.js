const ID="ugmuls-5-5e-automation",choices=new WeakMap(),pending=new WeakMap(),reserved=new Map();
export const firearmFeature=actor=>Array.from(actor?.items??[]).find(i=>i.type==="feat"&&((i.identifier??i.system?.identifier)==="arcane-firearm"||/^arcane firearm$/i.test(i.name??"")));
function resolve(reference){return typeof reference==="string"?game.messages.get(reference.replace(/^ChatMessage\./,"")):reference;}
export function firearmContext(app){
 const activity=app.config?.subject,item=activity?.item,actor=activity?.actor??item?.actor,feature=firearmFeature(actor),data=app.message?.data??{},card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app);
 let current=resolve(data.system?.origin??card?.system?.origin),cast=null;const seen=new Set();
 while(current&&!seen.has(current.id)){seen.add(current.id);if(current.type==="usage")cast=current;current=resolve(current.system?.origin);}
 return {activity,item,actor,feature,cast};
}
export function firearmUsed(cast,except){return !!cast?.getFlag?.(ID,"arcaneFirearm")||!!(reserved.has(cast?.id)&&reserved.get(cast.id).app!==except);}
export function firearmEligible(app){
 const {activity,item,actor,feature,cast}=firearmContext(app),flags=app.message?.data?.flags?.[ID]??{};
 const classId=item?.system?.classIdentifier??(item?.system?.sourceItem==="class:artificer"?"artificer":"");
 return game.settings.get(ID,"arcaneFirearmAutomation")===true&&item?.type==="spell"&&classId==="artificer"&&["attack","save","damage"].includes(activity?.type)&&actor?.isOwner&&!!feature&&!!cast&&cast.isOwner!==false&&!flags.masteryGraze&&!flags.arcaneFirearm;
}
export function selectFirearm(app,value,index=choices.get(app)?.index??0){choices.set(app,{yes:value===true,index});}
export function addFirearmChoice(app){
 const {feature,cast}=firearmContext(app);if(!feature||!firearmEligible(app))return;
 const state=choices.get(app)??{yes:false,index:0},used=firearmUsed(cast,app);
 const group=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"arcane-firearm",label:"Arcane Firearm (cast through firearm)",value:state.yes,used,change:value=>selectFirearm(app,value)});
 const rolls=(app.rolls??[]).filter(r=>!r.options?.rsaArcaneFirearm);
 if(!group||rolls.length<2)return;
 const select=document.createElement("select");select.setAttribute("aria-label","Arcane Firearm damage roll");select.disabled=used;
 for(const [index,roll]of rolls.entries()){if(!roll.options?.type)continue;const option=document.createElement("option");option.value=index;option.textContent="Damage "+(index+1)+" — "+roll.options.type;select.append(option);}
 select.value=String(state.index);select.addEventListener("change",event=>{event.stopPropagation();selectFirearm(app,choices.get(app)?.yes??false,Number(select.value));app.rebuild();});group.querySelector(".form-fields")?.append(select);
}
export function finalizeFirearm(app,rolls,{preview=false}={}){
 if(rolls.some(r=>r.options?.rsaArcaneFirearm))return rolls;
 const entry=pending.get(app);if(entry)return [...rolls,entry.roll];
 const state=choices.get(app),{actor,cast}=firearmContext(app);if(!state?.yes||!firearmEligible(app)||firearmUsed(cast,app))return rolls;
 const base=rolls[state.index];if(!base?.options?.type)return rolls;
 // The feature rolls a separate d8 to establish a bonus; it is not doubled on critical hits.
 const roll=new CONFIG.Dice.DamageRoll("1d8[Arcane Firearm]",actor.getRollData?.()??{},{type:base.options.type,types:[base.options.type],flavor:"Arcane Firearm",isCritical:false,critical:{...base.options.critical,bonusDice:0,bonusDamage:""},rsaArcaneFirearm:true});
 if(!preview){const entry={app,cast,actor,roll};pending.set(app,entry);reserved.set(cast.id,entry);}
 return [...rolls,roll];
}
export async function commitFirearm(app,options){
 const entry=pending.get(app);if(!entry)return;
 try{
  if(!options?.dnd5e?.submitted)return;
  if(!firearmEligible(app)||firearmUsed(entry.cast,app))throw Error("Arcane Firearm has already been used for this cast or is no longer available.");
  const record={actor:entry.actor.uuid,type:entry.roll.options.type};
  await entry.cast.setFlag(ID,"arcaneFirearm",record);
  app.message.data.flags??={};app.message.data.flags[ID]={...app.message.data.flags[ID],arcaneFirearm:record};
 }catch(error){ui.notifications.error(error.message);throw error;}
 finally{pending.delete(app);if(reserved.get(entry.cast.id)===entry)reserved.delete(entry.cast.id);}
}
Hooks.once("init",()=>game.settings.register(ID,"arcaneFirearmAutomation",{name:"Arcane Firearm Assistance",hint:"Offer an optional 1d8 bonus on one Artificer spell damage roll per cast. Select Yes only when casting through your Arcane Firearm; choose the damage roll for mixed damage. No resource cost, no critical doubling, and no cannon or weapon attacks.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{globalThis.Ugmuls55eAutomationFirearm={addFirearmChoice,finalizeFirearm,commitFirearm};});
