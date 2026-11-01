import {firearmContext} from "./arcane-firearm.js";
import {createEventQueue,isRollAdjustmentLocked} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",allowed=new Set(["acid","cold","fire","lightning","poison"]),selected=new WeakMap(),pending=new WeakMap(),settlements=new WeakMap(),requests=new Map(),waiting=new Map(),enqueue=createEventQueue(),wrapped=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=ref=>typeof ref==="string"?globalThis.fromUuidSync?.(ref,{strict:false}):ref;
const enabled=()=>game.settings.get(ID,"elementalAffinityDamageAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export const affinityFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&i.system?.source?.rules!=="2014"&&((i.identifier??i.system?.identifier)==="elemental-affinity"||i.name?.trim().toLowerCase()==="elemental affinity"));
export function affinityEffect(actor){return values(actor?.effects).find(e=>flag(e,"elementalAffinity")&&!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired&&!e.system?.expired);}
export const affinityType=actor=>flag(affinityEffect(actor),"elementalAffinity")?.type;
export function affinityContext(app){const activity=app.config?.subject,card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),speaker=app.message?.data?.speaker??card?.speaker,actor=(speaker?globalThis.ChatMessage?.getSpeakerActor?.(speaker):null)??card?.getAssociatedActor?.()??activity?.actor??activity?.item?.actor,feature=affinityFeature(actor);if(!feature)return {activity,actor,item:activity?.item,feature,cast:null};return {...firearmContext(app),actor,feature};}
export function affinityEligible(app){
 if(!enabled())return false;const c=affinityContext(app),card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app);
 return enabled()&&c.actor?.isOwner&&!!c.feature&&allowed.has(affinityType(c.actor))&&c.item?.type==="spell"&&["attack","save","damage"].includes(c.activity?.type)&&!!c.cast&&(!card||!isRollAdjustmentLocked(card));
}
export function affinityParts(app,rolls){const count=app.config?.rolls?.length??1;return rolls.slice(0,count).map((roll,index)=>({roll,index,type:roll.options?.type})).filter(r=>r.type===affinityType(affinityContext(app).actor));}
export function affinityBonus(actor,feature,type){
 const activity=values(feature.system?.activities).find(a=>a.type==="damage"&&values(values(a.damage?.parts)[0]?.types).includes(type)),formula=values(activity?.damage?.parts)[0]?.bonus;
 if(!formula)throw Error("Elemental Affinity is missing its native Charisma bonus.");const roll=new CONFIG.Dice.BasicRoll(formula,actor.getRollData?.()??{});if(roll.isDeterministic===false)throw Error("Elemental Affinity requires a flat bonus.");const bonus=Number(roll.evaluateSync().total);if(!Number.isFinite(bonus))throw Error("Elemental Affinity’s bonus could not be resolved.");return bonus;
}
export function selectAffinity(app,yes,index=selected.get(app)?.index){selected.set(app,{yes:yes===true,index});}
export function addAffinityChoice(app){
 if(!affinityEligible(app)){app.element?.querySelector?.('[data-rsa-choice="elemental-affinity"]')?.remove();return;}const c=affinityContext(app),state=selected.get(app),used=!!flag(c.cast,"elementalAffinityDamage"),parts=affinityParts(app,app.rolls??[]);
 if(!parts.length)return;const row=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"elemental-affinity",label:"Elemental Affinity ("+affinityType(c.actor)+")",value:state?.yes!==false,used,change:yes=>selectAffinity(app,yes)});
 const select=row?.querySelector?.("select");if(select){select.disabled=used;select.value=!used&&state?.yes!==false?"yes":"no";}
 for(const old of values(row?.querySelectorAll?.("[data-affinity-part]")))old.remove();if(!row||parts.length<2)return;
 const chooser=document.createElement("select");chooser.dataset.affinityPart="true";chooser.setAttribute("aria-label","Elemental Affinity roll");chooser.disabled=used;
 for(const p of parts){const option=document.createElement("option");option.value=String(p.index);option.textContent="Roll "+(p.index+1)+" — "+p.type;chooser.append(option);}chooser.value=String(parts.find(p=>p.index===state?.index)?.index??parts[0].index);chooser.addEventListener("change",()=>{selectAffinity(app,selected.get(app)?.yes!==false,Number(chooser.value));app.rebuild();});row.querySelector(".form-fields")?.append(chooser);
}
export function finalizeAffinity(app,rolls,{preview=false}={}){
 if(!preview)pending.delete(app);if(!affinityEligible(app))return rolls;const c=affinityContext(app),state=selected.get(app);if(state?.yes===false||flag(c.cast,"elementalAffinityDamage"))return rolls;
 const original=rolls.filter(r=>!r.options?.rsaElementalAffinity),parts=affinityParts(app,original),part=parts.find(p=>p.index===state?.index)??parts[0];if(!part)return original;
 const bonus=affinityBonus(c.actor,c.feature,part.type),roll=new CONFIG.Dice.DamageRoll(String(bonus)+"[Elemental Affinity]",{}, {type:part.type,types:[part.type],properties:values(part.roll.options?.properties),flavor:"Elemental Affinity",isCritical:false,critical:{...part.roll.options?.critical,bonusDice:0,bonusDamage:""},rsaElementalAffinity:true});
 if(!preview)pending.set(app,{...c,bonus,type:part.type});return [...original,roll];
}
export async function affinityOperation(operation,payload,user=game.user){
 if(!authority()||!user?.active)throw Error("A connected GM is required for Elemental Affinity.");
 if(operation!=="claim"){const entry=requests.get(payload.request);if(!entry||entry.user!==user.id)return;if(operation==="rollback"&&flag(entry.cast,"elementalAffinityDamage")?.request===payload.request)await entry.cast.unsetFlag(ID,"elementalAffinityDamage");requests.delete(payload.request);return;}
 if(requests.has(payload.request))return;const actor=resolve(payload.actor),cast=game.messages.get(payload.cast),feature=affinityFeature(actor),item=cast?.getAssociatedItem?.();
 if(!enabled()||!actor||!(user.isGM||actor.testUserPermission?.(user,"OWNER"))||!feature||cast?.getAssociatedActor?.()?.uuid!==actor.uuid||item?.type!=="spell"||(!allowed.has(payload.type)||affinityType(actor)!==payload.type)||payload.bonus!==affinityBonus(actor,feature,payload.type)||typeof payload.request!=="string"||flag(cast,"elementalAffinityDamage"))throw Error("Elemental Affinity is already used for this casting or is no longer eligible.");
 await cast.setFlag(ID,"elementalAffinityDamage",{request:payload.request,actor:actor.uuid,type:payload.type,bonus:payload.bonus});requests.set(payload.request,{cast,user:user.id});if(requests.size>256)requests.delete(requests.keys().next().value);
}
function operate(operation,payload){
 const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return enqueue(()=>affinityOperation(operation,payload));const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error("The GM did not answer the Elemental Affinity request."));},10000);waiting.set(request,{resolve,reject,timer});game.socket.emit("module."+ID,{action:"affinityOperation",operation,payload,request,user:game.user.id,gm:gm.id});});
}
export async function commitAffinity(app,options){
 const entry=pending.get(app);pending.delete(app);if(!entry||!options?.dnd5e?.submitted)return;
 if(!affinityEligible(app)||affinityContext(app).cast?.id!==entry.cast.id||affinityBonus(entry.actor,entry.feature,entry.type)!==entry.bonus)throw Error("Elemental Affinity changed. Reopen the roll configuration.");
 const payload={request:foundry.utils.randomID(),actor:entry.actor.uuid,cast:entry.cast.id,type:entry.type,bonus:entry.bonus};await operate("claim",payload);settlements.set(app.message,payload);
}
export function installAffinityRoll(Type=CONFIG.Dice.DamageRoll){
 if(!Type?.build||wrapped.has(Type))return;wrapped.add(Type);const build=Type.build,configure=Type.buildConfigure;
 if(configure)Type.buildConfigure=async function(config,dialog,message){const rolls=await configure.call(this,config,dialog,message);if(dialog.configure!==false||!rolls?.length)return rolls;const app={config,message};const result=finalizeAffinity(app,rolls);await commitAffinity(app,{dnd5e:{submitted:true}});return result;};
 Type.build=async function(config,dialog,message={}){let success=false;try{const result=await build.call(this,config,dialog,message);success=!!result?.length;return result;}finally{const payload=settlements.get(message);if(payload){settlements.delete(message);try{await operate(success?"keep":"rollback",payload);}catch(error){report(error);}}}};
}
export const affinityItem=item=>enabled()&&item?.type==="feat"&&(item.identifier??item.system?.identifier)==="elemental-affinity"&&item.system?.source?.rules!=="2014";
export async function setAffinity(actor,type,user=game.user){return enqueue(async()=>{
 const feature=affinityFeature(actor);if(!enabled()||!feature||!actor?.isOwner||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||!allowed.has(type))throw Error("Choose an element for an owned Elemental Affinity feature.");
 const prior=values(actor.effects).filter(e=>flag(e,"elementalAffinity")),existing=prior[0],label=type[0].toUpperCase()+type.slice(1);
 const data={name:"Elemental Affinity — "+label,img:feature.img,type:"base",disabled:false,transfer:false,origin:feature.uuid,duration:{value:null,units:"seconds",expiry:null,expired:false},system:{changes:[{key:"system.traits.dr.value",type:"add",value:type}],origin:{actor:actor.uuid,item:feature.uuid}},flags:{[ID]:{elementalAffinity:{item:feature.uuid,type}}}};
 const rollback=await updateNativeAffinity(actor,type);
 try{
 if(existing){if(flag(existing,"elementalAffinity")?.type!==type||existing.disabled)await existing.update(data);}else await actor.createEmbeddedDocuments("ActiveEffect",[data]);
 if(prior.length>1)await actor.deleteEmbeddedDocuments("ActiveEffect",prior.slice(1).map(e=>e.id));return type;
 }catch(error){await rollback();throw error;}
});}
function nativeAffinityTrait(actor){
 const subclass=values(actor?.items).find(i=>i.type==="subclass"&&(i.identifier??i.system?.identifier)==="draconic-sorcery");
 const trait=values(subclass?.system?.advancement).find(a=>a.type==="Trait"&&(a.id??a._id)==="8UnvG3X4TR3MpCGe");return {subclass,trait};
}
export function nativeAffinitySelection(actor){return values(nativeAffinityTrait(actor).trait?.value?.chosen).map(v=>String(v).replace(/^dr:/,"")).find(type=>allowed.has(type));}
async function updateNativeAffinity(actor,type){
 const {subclass,trait}=nativeAffinityTrait(actor),before=actor._source?.system?.traits?.dr?.value;
 if(!trait||!subclass.updateAdvancement||!Array.isArray(before))return async()=>{};
 const chosen=values(trait.value?.chosen),next=["dr:"+type],old=chosen.filter(v=>String(v).startsWith("dr:")).map(v=>String(v).slice(3)),resistance=new Set(before);
 for(const previous of old){const otherSource=values(actor.items).some(item=>values(item.system?.advancement).some(a=>a!==trait&&[...values(a.value?.chosen),...values(a.configuration?.grants)].includes("dr:"+previous)));if(!otherSource)resistance.delete(previous);}
 resistance.add(type);const after=[...resistance],id=trait.id??trait._id;
 const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());let actorChanged=false,traitChanged=false;
 const rollback=async()=>{if(traitChanged&&same(values(nativeAffinityTrait(actor).trait?.value?.chosen),next))await subclass.updateAdvancement(id,{"value.chosen":chosen});if(actorChanged&&same(actor._source.system.traits.dr.value,after))await actor.update({"system.traits.dr.value":before});};
 try{if(!same(before,after)){await actor.update({"system.traits.dr.value":after});actorChanged=true;}if(!same(chosen,next)){await subclass.updateAdvancement(id,{"value.chosen":next});traitChanged=true;}}catch(error){await rollback();throw error;}
 return rollback;
}
const dialogs=new Set();
export async function openAffinity(item){
 const actor=item?.actor;if(!affinityItem(item)||!actor?.isOwner||dialogs.has(actor.uuid))return;dialogs.add(actor.uuid);
 try{const selected=affinityType(actor)??nativeAffinitySelection(actor),escape=foundry.utils.escapeHTML,type=await foundry.applications.api.DialogV2.wait({window:{title:"Elemental Affinity"},rejectClose:false,content:'<p>Choose your draconic element. Gain its resistance and add your Charisma modifier to one matching damage roll per spell.</p><select name="elementalAffinity">'+[...allowed].map(t=>'<option value="'+t+'" '+(t===selected?'selected':'')+'>'+escape(t[0].toUpperCase()+t.slice(1))+'</option>').join('')+'</select>',buttons:[{action:"confirm",label:"Confirm",callback:(_event,button)=>button.form.querySelector('[name="elementalAffinity"]').value},{action:"cancel",label:"Cancel",callback:()=>null}]});if(type)await setAffinity(actor,type);return type;}finally{dialogs.delete(actor.uuid);}
}
function report(error){console.error("Elemental Affinity",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"elementalAffinityDamageAutomation",{name:"Draconic: Elemental Affinity",hint:"Choose the affinity element from the feature. Apply its resistance and offer the native Charisma bonus to one matching damage roll per spell.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("deleteItem",item=>{const actor=item.actor;if((item.identifier??item.system?.identifier)!=="elemental-affinity"||!actor||affinityFeature(actor)||!(authority()||!game.users.activeGM&&actor.isOwner))return;enqueue(async()=>{const ids=values(actor.effects).filter(e=>flag(e,"elementalAffinity")).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);}).catch(report);});
 globalThis.Ugmuls55eAutomationAffinity={addAffinityChoice,finalizeAffinity,commitAffinity,isItem:affinityItem,open:openAffinity};installAffinityRoll();
 Hooks.on("dnd5e.preRollDamageV2",(config,dialog,message)=>{const app={config,message};if(!affinityEligible(app))return;const configure=dialog.configure;Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog("damage",dialog));if(configure===false)dialog.configure=false;});
 // The native buildConfigure wrapper also handles skipped damage
 // dialogs with the same default-Yes policy, before any dice are evaluated.
 game.socket.on("module."+ID,packet=>{if(packet?.action==="affinityReply"&&packet.user===game.user.id){const entry=waiting.get(packet.request);if(!entry)return;waiting.delete(packet.request);clearTimeout(entry.timer);packet.error?entry.reject(Error(packet.error)):entry.resolve();return;}
  if(packet?.action!=="affinityOperation"||!authority()||packet.gm!==game.user.id||!["claim","keep","rollback"].includes(packet.operation))return;const user=game.users.get(packet.user);if(!user?.active)return;
  enqueue(()=>affinityOperation(packet.operation,packet.payload,user)).then(()=>game.socket.emit("module."+ID,{action:"affinityReply",request:packet.request,user:user.id}),error=>game.socket.emit("module."+ID,{action:"affinityReply",request:packet.request,user:user.id,error:error.message}));
 });
});
