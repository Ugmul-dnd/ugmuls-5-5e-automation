import {firearmContext} from "./arcane-firearm.js";
import {createEventQueue,isRollAdjustmentLocked} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",allowed=new Set(["healing","acid","fire","poison"]),selected=new WeakMap(),pending=new WeakMap(),settlements=new WeakMap(),requests=new Map(),waiting=new Map(),enqueue=createEventQueue(),wrapped=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=ref=>typeof ref==="string"?globalThis.fromUuidSync?.(ref,{strict:false}):ref;
const enabled=()=>game.settings.get(ID,"alchemicalSavantAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export const savantFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&i.system?.source?.rules!=="2014"&&((i.identifier??i.system?.identifier)==="alchemical-savant"||i.name?.trim().toLowerCase()==="alchemical savant"));
export function nativeSavant(item,feature){
 const ids=new Set(values(feature?.effects).map(e=>e.id??e._id).filter(Boolean)),origins=new Set(values(feature?.system?.activities).filter(a=>a.type==="enchant").map(a=>a.uuid).filter(Boolean));
 return values(item?.effects).some(e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&(ids.has(e.getFlag?.("dnd5e","enchantmentProfile"))||origins.has(e.system?.origin?.activity)||[e._stats?.duplicateSource,e._stats?.compendiumSource].some(r=>r&&[...ids].some(id=>r.endsWith("."+id))))&&(e.system?.changes??e.changes??[]).some(c=>c.key==="system.damage.bonus"));
}
export function savantContext(app){const activity=app.config?.subject,card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),speaker=app.message?.data?.speaker??card?.speaker,actor=(speaker?globalThis.ChatMessage?.getSpeakerActor?.(speaker):null)??card?.getAssociatedActor?.()??activity?.actor??activity?.item?.actor,feature=savantFeature(actor);if(!feature)return {activity,actor,item:activity?.item,feature,cast:null};return {...firearmContext(app),actor,feature};}
export function savantEligible(app){
 if(!enabled())return false;const c=savantContext(app),card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app);
 return enabled()&&c.actor?.isOwner&&!!c.feature&&c.item?.type==="spell"&&["attack","save","damage","heal"].includes(c.activity?.type)&&!!c.cast&&!flag(c.item,"storedSpell")&&!/^(weapon|equipment|consumable|tool):/.test(c.item.system?.sourceItem??"")&&!nativeSavant(c.item,c.feature)&&(!card||!isRollAdjustmentLocked(card));
}
export function savantParts(app,rolls){const count=app.config?.rolls?.length??1;return rolls.slice(0,count).map((roll,index)=>({roll,index,type:roll.options?.type})).filter(r=>allowed.has(r.type));}
export function savantBonus(actor,feature,type){
 const activity=values(feature.system?.activities).find(a=>a.type===(type==="healing"?"heal":"damage")),formula=type==="healing"?activity?.healing?.bonus:values(activity?.damage?.parts)[0]?.bonus;
 if(!formula)throw Error("Alchemical Savant is missing its native bonus formula.");const roll=new CONFIG.Dice.BasicRoll(formula,actor.getRollData?.()??{});if(roll.isDeterministic===false)throw Error("Alchemical Savant requires a deterministic Intelligence bonus.");const bonus=Number(roll.evaluateSync().total);if(!Number.isFinite(bonus))throw Error("Alchemical Savant’s Intelligence bonus could not be resolved.");return Math.max(1,bonus);
}
export function selectSavant(app,yes,index=selected.get(app)?.index){selected.set(app,{yes:yes===true,index});}
export function addSavantChoice(app){
 if(!savantEligible(app)){app.element?.querySelector?.('[data-rsa-choice="alchemical-savant"]')?.remove();return;}const c=savantContext(app),state=selected.get(app),used=!!flag(c.cast,"alchemicalSavant"),parts=savantParts(app,app.rolls??[]);
 if(!parts.length)return;const row=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"alchemical-savant",label:"Alchemical Savant (Alchemist’s Supplies)",value:state?.yes!==false,used,change:yes=>selectSavant(app,yes)});
 const select=row?.querySelector?.("select");if(select){select.disabled=used;select.value=!used&&state?.yes!==false?"yes":"no";}
 for(const old of values(row?.querySelectorAll?.("[data-savant-part]")))old.remove();if(!row||parts.length<2)return;
 const chooser=document.createElement("select");chooser.dataset.savantPart="true";chooser.setAttribute("aria-label","Alchemical Savant roll");chooser.disabled=used;
 for(const p of parts){const option=document.createElement("option");option.value=String(p.index);option.textContent="Roll "+(p.index+1)+" — "+p.type;chooser.append(option);}chooser.value=String(parts.find(p=>p.index===state?.index)?.index??parts[0].index);chooser.addEventListener("change",()=>{selectSavant(app,selected.get(app)?.yes!==false,Number(chooser.value));app.rebuild();});row.querySelector(".form-fields")?.append(chooser);
}
export function finalizeSavant(app,rolls,{preview=false}={}){
 if(!preview)pending.delete(app);if(!savantEligible(app))return rolls;const c=savantContext(app),state=selected.get(app);if(state?.yes===false||flag(c.cast,"alchemicalSavant"))return rolls;
 const original=rolls.filter(r=>!r.options?.rsaAlchemicalSavant),parts=savantParts(app,original),part=parts.find(p=>p.index===state?.index)??parts[0];if(!part)return original;
 const bonus=savantBonus(c.actor,c.feature,part.type),roll=new CONFIG.Dice.DamageRoll(String(bonus)+"[Alchemical Savant]",{}, {type:part.type,types:[part.type],properties:values(part.roll.options?.properties),flavor:"Alchemical Savant",isCritical:false,critical:{...part.roll.options?.critical,bonusDice:0,bonusDamage:""},rsaAlchemicalSavant:true});
 if(!preview)pending.set(app,{...c,bonus,type:part.type});return [...original,roll];
}
export async function savantOperation(operation,payload,user=game.user){
 if(!authority()||!user?.active)throw Error("A connected GM is required for Alchemical Savant.");
 if(operation!=="claim"){const entry=requests.get(payload.request);if(!entry||entry.user!==user.id)return;if(operation==="rollback"&&flag(entry.cast,"alchemicalSavant")?.request===payload.request)await entry.cast.unsetFlag(ID,"alchemicalSavant");requests.delete(payload.request);return;}
 if(requests.has(payload.request))return;const actor=resolve(payload.actor),cast=game.messages.get(payload.cast),feature=savantFeature(actor),item=cast?.getAssociatedItem?.();
 if(!enabled()||!actor||!(user.isGM||actor.testUserPermission?.(user,"OWNER"))||!feature||cast?.getAssociatedActor?.()?.uuid!==actor.uuid||item?.type!=="spell"||nativeSavant(item,feature)||flag(item,"storedSpell")||/^(weapon|equipment|consumable|tool):/.test(item.system?.sourceItem??"")||!allowed.has(payload.type)||payload.bonus!==savantBonus(actor,feature,payload.type)||typeof payload.request!=="string"||flag(cast,"alchemicalSavant"))throw Error("Alchemical Savant is already used for this casting or is no longer eligible.");
 await cast.setFlag(ID,"alchemicalSavant",{request:payload.request,actor:actor.uuid,type:payload.type,bonus:payload.bonus});requests.set(payload.request,{cast,user:user.id});if(requests.size>256)requests.delete(requests.keys().next().value);
}
function operate(operation,payload){
 const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return enqueue(()=>savantOperation(operation,payload));const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error("The GM did not answer the Alchemical Savant request."));},10000);waiting.set(request,{resolve,reject,timer});game.socket.emit("module."+ID,{action:"savantOperation",operation,payload,request,user:game.user.id,gm:gm.id});});
}
export async function commitSavant(app,options){
 const entry=pending.get(app);pending.delete(app);if(!entry||!options?.dnd5e?.submitted)return;
 if(!savantEligible(app)||savantContext(app).cast?.id!==entry.cast.id||savantBonus(entry.actor,entry.feature,entry.type)!==entry.bonus)throw Error("Alchemical Savant changed. Reopen the roll configuration.");
 const payload={request:foundry.utils.randomID(),actor:entry.actor.uuid,cast:entry.cast.id,type:entry.type,bonus:entry.bonus};await operate("claim",payload);settlements.set(app.message,payload);
}
export function installSavantRoll(Type=CONFIG.Dice.DamageRoll){
 if(!Type?.build||wrapped.has(Type))return;wrapped.add(Type);const build=Type.build,configure=Type.buildConfigure;
 if(configure)Type.buildConfigure=async function(config,dialog,message){const rolls=await configure.call(this,config,dialog,message);if(dialog.configure!==false||!rolls?.length)return rolls;const app={config,message};const result=finalizeSavant(app,rolls);await commitSavant(app,{dnd5e:{submitted:true}});return result;};
 Type.build=async function(config,dialog,message={}){let success=false;try{const result=await build.call(this,config,dialog,message);success=!!result?.length;return result;}finally{const payload=settlements.get(message);if(payload){settlements.delete(message);try{await operate(success?"keep":"rollback",payload);}catch(error){report(error);}}}};
}
function report(error){console.error("Alchemical Savant",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"alchemicalSavantAutomation",{name:"Alchemist: Alchemical Savant",hint:"Offer the native Intelligence bonus (minimum +1) to one spell healing or Acid/Fire/Poison damage roll per casting when using Alchemist’s Supplies. Defaults Yes; choose No for another focus. Preserve native Savant enchantments without adding twice.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationSavant={addSavantChoice,finalizeSavant,commitSavant};installSavantRoll();
 Hooks.on("dnd5e.preRollDamageV2",(config,dialog,message)=>{const app={config,message};if(!savantEligible(app))return;const configure=dialog.configure;Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog("damage",dialog));if(configure===false)dialog.configure=false;});
 // The native buildConfigure wrapper also handles skipped healing/damage
 // dialogs with the same default-Yes policy, before any dice are evaluated.
 game.socket.on("module."+ID,packet=>{if(packet?.action==="savantReply"&&packet.user===game.user.id){const entry=waiting.get(packet.request);if(!entry)return;waiting.delete(packet.request);clearTimeout(entry.timer);packet.error?entry.reject(Error(packet.error)):entry.resolve();return;}
  if(packet?.action!=="savantOperation"||!authority()||packet.gm!==game.user.id||!["claim","keep","rollback"].includes(packet.operation))return;const user=game.users.get(packet.user);if(!user?.active)return;
  enqueue(()=>savantOperation(packet.operation,packet.payload,user)).then(()=>game.socket.emit("module."+ID,{action:"savantReply",request:packet.request,user:user.id}),error=>game.socket.emit("module."+ID,{action:"savantReply",request:packet.request,user:user.id,error:error.message}));
 });
});
