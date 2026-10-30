import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",channel="module."+ID,enqueue=createEventQueue(),wrapped=new WeakSet(),completed=new WeakSet(),busy=new Set(),tickets=new Map(),waiting=new Map(),inFlight=new Map(),sources=new Map();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],key=i=>i?.identifier??i?.system?.identifier;
const enabled=()=>game.settings.get(ID,"spellStoringItemAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),resolve=ref=>typeof ref==="string"?globalThis.fromUuidSync?.(ref,{strict:false}):ref;
export const storingFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&i.system?.source?.rules!=="2014"&&(key(i)==="spell-storing-item"||i.name?.trim().toLowerCase()==="spell-storing item"));
const owns=(actor,user)=>!!user?.active&&!!actor&&(user.isGM||actor.testUserPermission?.(user,"OWNER"));
export function storageItemEligible(item){
 if(item?.type==="weapon")return ["simpleM","simpleR","martialM","martialR"].includes(item.system?.type?.value);
 return ["equipment","tool"].includes(item?.type)&&(item.system?.type?.value==="focus"||values(item.system?.properties).includes("foc")||item.type==="tool"&&item.system?.type?.value==="artisan");
}
export function storageSpellEligible(spell){return spell?.type==="spell"&&[1,2,3].includes(Number(spell.system?.level))&&spell.system?.activation?.type==="action"&&!spell.system?.materials?.consumed;}
function storageScene(user,sceneId=user.viewedScene??globalThis.canvas?.scene?.id){
 if(!sceneId||user.viewedScene&&user.viewedScene!==sceneId)throw Error("Reopen Spell-Storing Item on your current map.");
 const scene=game.scenes?.get?.(sceneId)??(globalThis.canvas?.scene?.id===sceneId?canvas.scene:null);if(!scene)throw Error("Open a map before preparing a spell-storing item.");return scene;
}
function people(actor,scene,user){
 const friendly=globalThis.CONST?.TOKEN_DISPOSITIONS?.FRIENDLY??1,hostile=globalThis.CONST?.TOKEN_DISPOSITIONS?.HOSTILE??-1;
 // Recipient ownership is irrelevant: the active GM reads the inventory and
 // applies storage. Include GM-controlled party characters and friendly NPCs.
 return [...new Map(values(scene.tokens).filter(t=>(user.isGM||!t.hidden)&&t.actor&&(t.actor.uuid===actor.uuid||t.disposition!==hostile&&(t.actor.type==="character"||t.actor.type==="npc"&&t.disposition===friendly))).map(t=>[t.actor.uuid,t.actor])).values()];
}
export function storageRecipients(actor,user=game.user,sceneId){return people(actor,storageScene(user,sceneId),user);}
export async function storageSpells(actor){
 const list=globalThis.dnd5e?.registry?.spellLists?.forType?.("class:artificer"),candidates=new Map();
 for(const index of values(list?.indexes))if(index.uuid)candidates.set(index.uuid,index);
 for(const item of values(actor.items))if(item.type==="spell"&&(item.system?.classIdentifier==="artificer"||item.system?.sourceItem==="class:artificer"))candidates.set(item.uuid,item);
 const spells=[];const all=[...candidates.entries()];
 for(let n=0;n<all.length;n+=8){const batch=await Promise.all(all.slice(n,n+8).map(async([uuid,index])=>{if(index.system?.level!==undefined&&!([1,2,3].includes(Number(index.system.level))))return null;const spell=index.documentName==="Item"?index:await fromUuid(uuid);return storageSpellEligible(spell)?spell:null;}));spells.push(...batch.filter(Boolean));}
 return spells.filter((s,i,a)=>a.findIndex(t=>(key(t)||t.name)===(key(s)||s.name))===i).sort((a,b)=>a.system.level-b.system.level||a.name.localeCompare(b.name));
}
function artificerStats(actor){const mod=Number(actor.system?.abilities?.int?.mod),prof=Number(actor.system?.attributes?.prof);if(!Number.isFinite(mod)||!Number.isFinite(prof))throw Error("The Artificer’s Intelligence modifier or proficiency bonus is unavailable.");return {mod,prof,attack:mod+prof,save:8+mod+prof,uses:Math.max(2,2*mod)};}
export async function storageCatalog(actor,user=game.user,sceneId){
 if(!authority()||!enabled()||!storingFeature(actor)||!owns(actor,user))throw Error("Spell-Storing Item requires your Artificer and a connected GM.");
 const scene=storageScene(user,sceneId),spells=await storageSpells(actor),persons=people(actor,scene,user).map(a=>({uuid:a.uuid,name:a.name,items:values(a.items).filter(storageItemEligible).map(i=>({uuid:i.uuid,name:i.name}))})).filter(a=>a.items.length);
 if(!persons.length)throw Error("No party token on this map has an eligible weapon or spellcasting focus.");if(!spells.length)throw Error("No eligible action spell of levels 1–3 was found on the Artificer spell list.");
 const ticket=foundry.utils.randomID();tickets.set(ticket,{actor:actor.uuid,user:user.id,scene:scene.id,expires:Date.now()+900000,items:new Set(persons.flatMap(p=>p.items.map(i=>i.uuid))),spells:new Set(spells.map(s=>s.uuid))});if(tickets.size>128)tickets.delete(tickets.keys().next().value);
 return {ticket,persons,spells:spells.map(s=>({uuid:s.uuid,name:s.name,level:s.system.level})),uses:artificerStats(actor).uses};
}
export function buildStorageActivity(actor,feature,spell,id,request){
 const template=values(feature.system?.activities).find(a=>a.type==="cast"),data=template?.toObject?.()??(template?foundry.utils.deepClone(template):null);if(!data)throw Error("Spell-Storing Item is missing its native Cast activity.");
 const stats=artificerStats(actor),meta={caster:actor.uuid,feature:feature.uuid,request,spell:spell.uuid,...stats};
 data._id=id;data.name="Stored Spell — "+spell.name;data.type="cast";data.activation={type:"action",override:true};data.consumption={spellSlot:false,scaling:{allowed:false},targets:[{type:"activityUses",value:"1"}]};data.uses={spent:0,max:String(stats.uses),recovery:[]};
 data.spell={...data.spell,uuid:spell.uuid,level:Number(spell.system.level),ability:"int",spellbook:false,properties:["vocal","somatic","material","ritual"],challenge:{override:true,attack:stats.attack,save:stats.save}};
 data.flags??={};data.flags[ID]={...data.flags[ID],storedSpell:meta};if(data.flags.dnd5e)delete data.flags.dnd5e.dependentOn;
 return {data,meta};
}
async function removeStorage(item,request){
 if(!item)return;const activities=values(item.system?.activities).filter(a=>flag(a,"storedSpell")?.request===request),effects=values(item.effects).filter(e=>flag(e,"storedSpell")?.request===request);
 const changes={};for(const a of activities)changes[`system.activities.-=${a.id??a._id}`]=null;if(Object.keys(changes).length)await item.update(changes);
 if(effects.length)await item.deleteEmbeddedDocuments("ActiveEffect",effects.map(e=>e.id));
 const cached=values(item.actor?.items).filter(i=>flag(i,"storedSpell")?.request===request&&i.getFlag?.("dnd5e","cachedFor"));if(cached.length)await item.actor.deleteEmbeddedDocuments("Item",cached.map(i=>i.id));
}
export async function prepareStorage(actor,payload,user=game.user){
 const ticket=tickets.get(payload?.ticket),feature=storingFeature(actor),item=resolve(payload?.item),spell=await fromUuid(payload?.spell);
 if(!authority()||!enabled()||!owns(actor,user)||!feature||!ticket||ticket.actor!==actor.uuid||ticket.user!==user.id||ticket.expires<Date.now()||!ticket.items.has(payload.item)||!ticket.spells.has(payload.spell)||!people(actor,storageScene(user,ticket.scene),user).some(a=>a.uuid===item?.actor?.uuid)||!storageItemEligible(item)||!storageSpellEligible(spell))throw Error("The selected character, item or spell is no longer eligible. Reopen Spell-Storing Item.");
 const fresh=await storageSpells(actor);if(!fresh.some(s=>s.uuid===spell.uuid))throw Error("That spell is no longer on this Artificer’s spell list.");
 const id=foundry.utils.randomID(),request=foundry.utils.randomID(),{data,meta}=buildStorageActivity(actor,feature,spell,id,request),prior=flag(actor,"spellStorage");let committed=false;
 try{
  await item.update({[`system.activities.${id}`]:data});
  const template=values(feature.effects).find(e=>e.type==="enchantment");if(template){const effect=template.toObject();delete effect._id;effect.disabled=false;effect.transfer=true;effect.system??={};effect.system.origin={item:feature.uuid};effect.flags??={};effect.flags[ID]={...effect.flags[ID],storedSpell:meta};await item.createEmbeddedDocuments("ActiveEffect",[effect]);}
  await actor.setFlag(ID,"spellStorage",{item:item.uuid,activity:id,request});committed=true;sources.set(actor.uuid,actor);tickets.delete(payload.ticket);
 }catch(error){if(!committed)await removeStorage(item,request);throw error;}
 // The new assignment is authoritative before retiring the old one. Its use
 // guard rejects stale activities even if a cleanup fails or another sheet is open.
 if(prior){inFlight.delete(prior.item);try{await removeStorage(resolve(prior.item),prior.request);}catch(error){report(error);}}
 return {person:item.actor.name,item:item.name,spell:spell.name,uses:meta.uses};
}
export async function storageUse(operation,payload,user=game.user){
 const item=resolve(payload.item),activity=values(item?.system?.activities).find(a=>(a.id??a._id)===payload.activity),meta=stored(activity),caster=resolve(meta?.caster),current=flag(caster,"spellStorage");
 if(!authority()||!enabled()||!owns(item?.actor,user)||!meta||!storingFeature(caster)||current?.request!==meta.request||current.item!==item.uuid)throw Error("This stored spell is no longer available to this character.");
 let reserved=inFlight.get(item.uuid);const combat=game.combat;if(reserved&&game.users.get(reserved.user)?.active===false){inFlight.delete(item.uuid);reserved=null;}
 if(operation==="useClaim"){
  if(reserved||combat?.started&&flag(item,"storedSpellTurns")?.[item.actor.uuid]?.combat===combat.id)throw Error("This character must wait until the start of their next turn to use the stored spell again.");
  const reservation={request:payload.request,user:user.id,combat:combat?.started?combat.id:null,actor:item.actor.uuid};inFlight.set(item.uuid,reservation);
  return reservation;
 }
 if(!reserved||reserved.request!==payload.request||reserved.user!==user.id)throw Error("The stored-spell activation was replaced.");
 try{if(payload.message&&reserved.combat&&!reserved.reset){const card=game.messages.get(payload.message);if(card?.getAssociatedActor?.()?.uuid!==item.actor.uuid||flag(card.getAssociatedItem?.(),"storedSpell")?.request!==meta.request)throw Error("The stored-spell result could not be verified.");await item.setFlag(ID,"storedSpellTurns",{...flag(item,"storedSpellTurns"),[item.actor.uuid]:{combat:reserved.combat}});}}finally{inFlight.delete(item.uuid);}
}
const dispatch=(operation,actor,payload,user=game.user)=>operation==="catalog"?storageCatalog(actor,user,payload.scene):operation==="prepare"?prepareStorage(actor,payload,user):storageUse(operation,payload,user);
function operate(operation,actor,payload={}){
 const gm=game.users.activeGM;if(!gm&&!game.user.isGM)return Promise.reject(Error("A connected GM is required to prepare items in party inventories."));if(!gm||gm.id===game.user.id)return enqueue(()=>dispatch(operation,actor,payload));
 const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error("The GM did not answer the Spell-Storing Item request."));},45000);waiting.set(request,{resolve,reject,timer});game.socket.emit(channel,{action:"spellStorage",operation,actor:actor.uuid,payload,request,user:game.user.id,gm:gm.id});});
}
async function selectStep(title,label,entries,summary="",back=false){
 const escape=foundry.utils.escapeHTML;return foundry.applications.api.DialogV2.wait({window:{title},rejectClose:false,content:summary+'<div class="form-group"><label>'+escape(label)+'</label><div class="form-fields"><select name="selection">'+entries.map(([id,name])=>'<option value="'+escape(id)+'">'+escape(name)+'</option>').join("")+'</select></div></div>',buttons:[{action:"next",label:title.startsWith("3")?"Store Spell":"Next",default:true,callback:(_e,b)=>b.form.elements.selection.value},...(back?[{action:"back",label:"Back",callback:()=>"back"}]:[]),{action:"cancel",label:"Cancel",callback:()=>null}]});
}
export async function storageWizard(actor){
 if(busy.has(actor.uuid))return;busy.add(actor.uuid);
 try{
  const catalog=await operate("catalog",actor,{scene:globalThis.canvas?.scene?.id});let step=1,person,item;
  while(true){
   if(step===1){const choice=await selectStep("1 / 3 — Spell-Storing Item","Choose character",catalog.persons.map(p=>[p.uuid,p.name]));if(!choice)return;person=catalog.persons.find(p=>p.uuid===choice);if(!person)return;step=2;}
   if(step===2){const choice=await selectStep("2 / 3 — Spell-Storing Item","Choose weapon or focus",person.items.map(i=>[i.uuid,i.name]),'<p>Select an item your Artificer can use as a spellcasting focus, or a Simple or Martial weapon.</p>',true);if(!choice)return;if(choice==="back"){step=1;continue;}item=person.items.find(i=>i.uuid===choice);if(!item)return;step=3;}
   const escape=foundry.utils.escapeHTML,choice=await selectStep("3 / 3 — Spell-Storing Item","Choose stored spell",catalog.spells.map(s=>[s.uuid,`Level ${s.level} — ${s.name}`]),`<p>${escape(person.name)} — ${escape(item.name)}</p><p>${catalog.uses} uses. Uses your Artificer’s spellcasting values; the holder handles concentration. Completing setup replaces your previous stored spell.</p>`,true);
   if(!choice)return;if(choice==="back"){step=2;continue;}const result=await operate("prepare",actor,{ticket:catalog.ticket,item:item.uuid,spell:choice});ui.notifications.info(`Stored ${result.spell} in ${result.person}’s ${result.item} (${result.uses} uses).`);return result;
  }
 }finally{busy.delete(actor.uuid);}
}
export function installStorageRest(Type){
 const p=Type?.prototype;if(!p?._prepareContext||wrapped.has(p))return;wrapped.add(p);const prepare=p._prepareContext,process=p._processFormData;
 p._prepareContext=async function(...args){const context=await prepare.apply(this,args);if(enabled()&&this.config?.type==="long"&&!this.isPartyGroup&&this.actor?.isOwner&&storingFeature(this.actor)){context.formSections??=[];context.formSections.push({legend:"Spell-Storing Item",fields:[{name:"rsaSpellStorage",field:new foundry.data.fields.BooleanField({label:"Prepare a spell-storing item after this rest"}),value:this.config.rsaSpellStorage!==false}]});}return context;};
 if(process)p._processFormData=function(...args){const selected=this.element?.querySelector?.('[name="rsaSpellStorage"]')?.checked,result=process.apply(this,args);if(selected!==undefined)result.rsaSpellStorage=selected;return result;};
}
export async function completedStorageRest(actor,result,config={}){if(!enabled()||!result||completed.has(result)||(config.type??result.type)!=="long"||config.rsaSpellStorage===false||!actor?.isOwner||!storingFeature(actor))return;completed.add(result);return storageWizard(actor);}
export function installStorageManual(Type=CONFIG.DND5E.activityTypes.enchant?.documentClass){
 const p=Type?.prototype;if(!p?.use||wrapped.has(p))return;wrapped.add(p);const own=Object.hasOwn(p,"use"),use=p.use;
 p.use=async function(...args){
  if(!enabled()||this.type!=="enchant"||this.item!==storingFeature(this.actor))return (own?use:Object.getPrototypeOf(p).use).apply(this,args);
  if(!owns(this.actor,game.user))throw Error("Only the Artificer’s owner can prepare their Spell-Storing Item.");
  return storageWizard(this.actor);
 };
}
function stored(activity){return flag(activity,"storedSpell")??flag(activity?.item,"storedSpell");}
export function installStoredCasting(Type=CONFIG.DND5E.activityTypes.cast?.documentClass){
 const p=Type?.prototype;if(!p?.use||wrapped.has(p))return;wrapped.add(p);const use=p.use,cache=p.getCachedSpellData;
 p.getCachedSpellData=async function(...args){const data=await cache.apply(this,args),meta=stored(this);if(data&&meta){data.flags??={};data.flags[ID]={...data.flags[ID],storedSpell:meta};}return data;};
 p.use=async function(...args){
  const meta=stored(this);if(!meta)return use.apply(this,args);const caster=resolve(meta.caster),current=flag(caster,"spellStorage"),actor=this.actor,ref=this.item.uuid,combat=game.combat;
  if(!enabled()||!storingFeature(caster)||current?.request!==meta.request||current.item!==ref||!actor?.isOwner)throw Error("This stored spell has been replaced or is no longer available.");
  const payload={item:ref,activity:this.id,request:foundry.utils.randomID()};await operate("useClaim",actor,payload);let result;
  try{result=await use.apply(this,args);return result;}finally{await operate("useFinish",actor,{...payload,message:result?.message?.id});}
 };
}
export function installStoredRollData(Type){
 let p=Type?.prototype;while(p&&!Object.hasOwn(p,"getRollData"))p=Object.getPrototypeOf(p);if(!p||wrapped.has(p))return;wrapped.add(p);const get=p.getRollData;
 p.getRollData=function(...args){const data=get.apply(this,args),meta=stored(this);if(!meta)return data;const copy=foundry.utils.deepClone(data);copy.mod=meta.mod;copy.prof=meta.prof;if(copy.abilities?.int)copy.abilities.int.mod=meta.mod;return copy;};
}
export function resetStorageTurns(combat,changes={},ending=false){return enqueue(async()=>{
 if(!authority()||!ending&&!("round"in changes||"turn"in changes||changes.started===false))return;
 const incoming=combat.combatant?.actor?.uuid;
 for(const reservation of inFlight.values())if(reservation.combat===combat.id&&(ending||combat.started===false||reservation.actor===incoming))reservation.reset=true;
 for(const caster of sources.values()){const state=flag(caster,"spellStorage"),item=resolve(state?.item),turns=flag(item,"storedSpellTurns");if(!turns)continue;const next={...turns};for(const [actor,data]of Object.entries(next))if(data.combat===combat.id&&(ending||combat.started===false||actor===incoming))delete next[actor];if(Object.keys(next).length!==Object.keys(turns).length)await item.setFlag(ID,"storedSpellTurns",next);}
});}
function report(error){console.error("Spell-Storing Item",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"spellStoringItemAutomation",{name:"Artificer: Spell-Storing Item",hint:"After a Long Rest, choose a party character, their weapon/focus and an eligible Artificer spell. Configure native item casting, charges and Artificer spellcasting values while the holder concentrates.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 installStorageRest(CONFIG.DND5E.restTypes?.long?.dialogClass);installStorageManual();installStoredCasting();for(const type of Object.values(CONFIG.DND5E.activityTypes))installStoredRollData(type.documentClass);
 const index=actor=>{if(flag(actor,"spellStorage"))sources.set(actor.uuid,actor);else sources.delete(actor.uuid);};
 for(const actor of [...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor))].filter(Boolean))index(actor);Hooks.on("updateActor",(actor,changes)=>{if(changes.flags?.[ID]?.spellStorage!==undefined||Object.hasOwn(changes,`flags.${ID}.spellStorage`))index(actor);});Hooks.on("deleteActor",actor=>sources.delete(actor.uuid));
 Hooks.on("dnd5e.restCompleted",(a,r,c)=>completedStorageRest(a,r,c).catch(report));Hooks.on("updateCombat",(c,d)=>resetStorageTurns(c,d).catch(report));Hooks.on("deleteCombat",c=>resetStorageTurns(c,{},true).catch(report));
 game.socket.on(channel,packet=>{if(packet?.action==="spellStorageReply"&&packet.user===game.user.id){const entry=waiting.get(packet.request);if(!entry)return;waiting.delete(packet.request);clearTimeout(entry.timer);packet.error?entry.reject(Error(packet.error)):entry.resolve(packet.result);return;}
  if(packet?.action!=="spellStorage"||!authority()||packet.gm!==game.user.id||!["catalog","prepare","useClaim","useFinish"].includes(packet.operation))return;const actor=resolve(packet.actor),user=game.users.get(packet.user);if(!owns(actor,user))return;
  enqueue(()=>dispatch(packet.operation,actor,packet.payload,user)).then(result=>game.socket.emit(channel,{action:"spellStorageReply",request:packet.request,user:user.id,result}),error=>game.socket.emit(channel,{action:"spellStorageReply",request:packet.request,user:user.id,error:error.message}));
 });
});
