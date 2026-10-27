import {epitomeActive,epitomeResistanceActivity,epitomeFeature} from "./elemental-epitome.js";
const ID="ugmuls-5-5e-automation",types=["acid","cold","fire","lightning","thunder"],queues=new Map(),bound=new WeakSet();
const values=c=>Array.from(c?.values?.()??c??[]);
const key=item=>item?.identifier??item?.system?.identifier;
const flag=(doc,name)=>doc?.getFlag?.(ID,name)??doc?.flags?.[ID]?.[name];
export function resistanceType(effect){const matches=values(effect?.system?.changes).filter(c=>["system.traits.dr.value","system.traits.dr"].includes(c.key)&&types.includes(c.value));return matches.length===1?matches[0].value:null;}
export function resistanceCopy(effect,item){
 if(flag(effect,"epitomeResistance")?.item===item.uuid)return true;
 const refs=[effect.origin,effect.system?.origin?.item,effect.system?.origin?.activity,effect._stats?.duplicateSource,effect._stats?.compendiumSource].filter(r=>typeof r==="string");
 return !!resistanceType(effect)&&refs.some(ref=>ref===item.uuid||ref.startsWith(item.uuid+".")||ref.includes(".Item.phbmnkElementalE."));
}
function context(card){const activity=card?.getAssociatedActivity?.({scaled:true}),actor=card?.getAssociatedActor?.()??activity?.actor;return {activity,actor,item:activity?.item};}
export function selectEpitomeResistance(card,type,user=game.user){
 const actor=context(card).actor;if(!actor)return Promise.reject(Error("The originating Monk could not be found."));
 const task=(queues.get(actor.uuid)??Promise.resolve()).catch(()=>{}).then(async()=>{
  const {activity,actor,item}=context(card);
  if(!epitomeActive(actor))throw Error("Elemental Attunement must be active to choose an Elemental Epitome resistance.");
  if(!epitomeResistanceActivity(activity)||!types.includes(type)||!actor||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||!actor.isOwner)throw Error("Only the Monk’s owner or GM can select their Elemental Epitome resistance.");
  const effects=values(item.effects),source=effects.find(e=>resistanceType(e)===type&&(!activity.effects?.length||values(activity.effects).some(p=>p._id===e.id||p.uuid===e.uuid)));
  if(!source)throw Error("That resistance is not available on this Elemental Epitome card.");
  // Resolve the real owned item: card scaling can provide a temporary copy.
  const owned=actor.items?.get?.(item.id)??values(actor.items).find(i=>i.uuid===item.uuid);
  if(!owned||key(owned)!=="elemental-epitome")throw Error("The Monk no longer owns Elemental Epitome.");
  const choices=values(actor.effects).filter(e=>resistanceCopy(e,owned)),existing=choices.find(e=>flag(e,"epitomeResistance"))??choices.find(e=>resistanceType(e)===type);
  const data=source.toObject();delete data._id;delete data.folder;delete data.start;
  for(const change of data.system?.changes??[])if(change.key==="system.traits.dr")change.key="system.traits.dr.value";
  data.type="base";data.transfer=false;data.disabled=false;data.origin=actor.uuid;data.statuses=[];
  data.duration={value:null,units:"seconds",expiry:null,expired:false};
  data.system={...data.system,origin:{actor:actor.uuid,item:owned.uuid,activity:activity.uuid,message:card.uuid}};
  data.flags={...data.flags,dnd5e:{...data.flags?.dnd5e,isTemporary:true},[ID]:{...data.flags?.[ID],epitomeResistance:{item:owned.uuid,type}},autoanimations:{version:5,isEnabled:false,isCustomized:false,killAnim:true}};
  data._stats={duplicateSource:source.uuid};
  const native=values(owned.effects).filter(e=>resistanceType(e)&&!e.disabled);
  if(native.length)await owned.updateEmbeddedDocuments("ActiveEffect",native.map(e=>({_id:e.id,disabled:true})));
  if(existing){
   if(resistanceType(existing)!==type||existing.disabled||!flag(existing,"epitomeResistance"))await existing.update(data);
  }else await actor.createEmbeddedDocuments("ActiveEffect",[data]);
  const obsolete=choices.filter(e=>e!==existing).map(e=>e.id);
  // When a new effect was needed, all old copies are obsolete.
  if(obsolete.length)await actor.deleteEmbeddedDocuments("ActiveEffect",obsolete);
  if(card.isOwner!==false)await card.setFlag(ID,"epitomeResistanceChoice",type);
  return type;
 });queues.set(actor.uuid,task);return task.finally(()=>{if(queues.get(actor.uuid)===task)queues.delete(actor.uuid);});
}
async function deleteResistanceCopies(actor){
 const feature=epitomeFeature(actor);
 const ids=values(actor.effects).filter(e=>flag(e,"epitomeResistance")||feature&&resistanceCopy(e,feature)).map(e=>e.id);
 if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
}
export function removeEndedResistance(actor){
 if(!actor?.isOwner)return Promise.resolve();
 const task=(queues.get(actor.uuid)??Promise.resolve()).catch(()=>{}).then(()=>deleteResistanceCopies(actor));
 queues.set(actor.uuid,task);return task.finally(()=>{if(queues.get(actor.uuid)===task)queues.delete(actor.uuid);});
}
const endWrapped=new WeakSet();
export function installAttunementEnd(Type){
 const proto=Type?.prototype;if(!proto||endWrapped.has(proto)||typeof proto._triggerSubsequentActions!=="function")return;
 endWrapped.add(proto);const original=proto._triggerSubsequentActions;
 proto._triggerSubsequentActions=async function(config,results){
  if(key(this.item)!=="elemental-attunement"||!this.enchant?.self)return original.call(this,config,results);
  const existing=this.existingEnchantment,ending=!!existing&&existing.flags?.dnd5e?.enchantmentProfile===config.enchantmentProfile;
  // Native use works with a temporary item copy. Capture the actual owner,
  // then await the native end operation before removing its managed resistance.
  const actor=this.actor??this.item.actor;
  const result=await original.call(this,config,results);
  if(ending)await removeEndedResistance(actor);
  return result;
 };
}
export function clearEndedAttunementResistance(effect,{deleted=false}={}){
 const item=effect?.parent,actor=item?.actor??item?.parent;
 if(key(item)!=="elemental-attunement"||effect?.type!=="enchantment"||!actor?.isOwner)return Promise.resolve();
 const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)return Promise.resolve();
 const task=(queues.get(actor.uuid)??Promise.resolve()).catch(()=>{}).then(async()=>{
  // Ignore the just-deleted document even if the native enchantment registry
  // has not finished removing it when deleteActiveEffect fires.
  if(epitomeActive(actor,deleted?effect:null))return;
  await deleteResistanceCopies(actor);
 });queues.set(actor.uuid,task);return task.finally(()=>{if(queues.get(actor.uuid)===task)queues.delete(actor.uuid);});
}
const activationPending=new Set();
export async function openAttunementResistance(item,effect,{activity,chatMessage}={}){
 const actor=activity?.actor??activity?.item?.actor??item?.actor;
 // This hook runs after the native enchantment exists. A post-use hook would
 // run before self-enchantment and could also mistake End Attunement for activation.
 if(key(activity?.item)!=="elemental-attunement"||activity?.type!=="enchant"||!chatMessage?.id||chatMessage.author?.id!==game.user.id||!actor?.isOwner||!epitomeActive(actor)||effect?.disabled||effect?.duration?.expired||effect?.active===false||flag(chatMessage,"epitomeResistanceOpened")||activationPending.has(chatMessage.id))return;
 const resistance=values(epitomeFeature(actor)?.system?.activities).find(epitomeResistanceActivity);
 if(!resistance)throw Error("Elemental Epitome is missing its Damage Resistance activity.");
 activationPending.add(chatMessage.id);
 try{
  const result=await resistance.use({consume:false,subsequentActions:false,concentration:{begin:false},create:{measuredTemplate:false}},{configure:false},{data:{system:{targets:[]},flags:{[ID]:{riderTriggered:true,epitomeAttunementOrigin:chatMessage.id}}}});
  if(!result?.message?.id)throw Error("Elemental Epitome could not open its resistance choice card.");
  await chatMessage.setFlag(ID,"epitomeResistanceOpened",result.message.id);
  return result.message;
 }finally{activationPending.delete(chatMessage.id);}
}
function report(error){console.error("Elemental Epitome selection",error);ui.notifications.error(error.message);}
export async function requestEpitomeResistance(card,type){
 // Owners can update their own resistance directly, even on a GM-authored card.
 const actor=context(card).actor;
 if(actor?.isOwner)return selectEpitomeResistance(card,type);
 const gm=game.users.activeGM;
 if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"selectEpitomeResistance",messageId:card.id,type,userId:game.user.id,gmId:gm.id});
 else await selectEpitomeResistance(card,type);
}
export function decorateEpitomeTray(tray,card){
 const {activity,actor,item}=context(card);if(!epitomeResistanceActivity(activity)||!actor)return;
 tray.open=true;
 const current=values(actor.effects).find(e=>!e.disabled&&!e.duration?.expired&&resistanceCopy(e,item));
 const chosen=values(tray.effects).find(e=>resistanceType(e)===resistanceType(current));
 const chosenRow=chosen?tray.querySelector('.effect[data-uuid="'+chosen.uuid+'"]'):null;
 if(chosenRow)tray._onCheckEffect?.({target:chosenRow,shiftKey:false,stopPropagation(){}});
 const apply=tray.querySelector(".apply-button");if(apply){apply.hidden=true;apply.style.display="none";}
 const targets=tray.targetList??tray.querySelector("recorded-targets");if(targets){targets.hidden=true;targets.style.display="none";}
 if(!tray.querySelector(".rsa-epitome-choice-info")){const info=document.createElement("p");info.className="rsa-epitome-choice-info";info.textContent="Choose one resistance for "+actor.name+". Clicking a choice replaces the previous Epitome resistance.";tray.prepend(info);}
 if(bound.has(tray))return;bound.add(tray);
 tray.addEventListener("click",event=>{
  const row=event.target.closest?.(".effect[data-uuid]");if(!row||!tray.contains(row))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!(game.user.isGM||actor.isOwner)){ui.notifications.warn("Only the Monk’s owner or GM can change Elemental Epitome.");return;}
  const effect=values(tray.effects).find(e=>e.uuid===row.dataset.uuid),type=resistanceType(effect);if(!type)return;
  // Native single-selection state is retained; Shift cannot select several resistances.
  tray._onCheckEffect?.({target:event.target,shiftKey:false,stopPropagation(){}});
  requestEpitomeResistance(card,type).catch(report);
 },true);
}
export function renderEpitomeResistance(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const {activity,actor,item}=context(message);
 if(epitomeResistanceActivity(activity)){
  for(const button of root.querySelectorAll("[data-rsa-retarget]"))button.remove();
  // D&D5e can omit its tray for players unless global effects-tray and
  // self-target conditions are met. This owned feature has its own safe selector.
  if(!root.querySelector("effect-application")&&message.isContentVisible!==false&&(game.user.isGM||actor?.isOwner)){
   const owned=actor?.items?.get?.(item.id)??values(actor?.items).find(i=>i.uuid===item.uuid)??item;
   const options=values(owned.effects).filter(e=>resistanceType(e)&&(!activity.effects?.length||values(activity.effects).some(p=>p._id===e.id||p.uuid===e.uuid)));
   if(options.length){const tray=document.createElement("effect-application");tray.effects=options;tray.chatMessage=message;tray.dataset.rsaEpitomeOwnerTray="true";root.append(tray);}
  }
 }
 for(const tray of root.querySelectorAll("effect-application")){
  const card=tray.chatMessage??game.messages.get(tray.closest?.("[data-message-id]")?.dataset.messageId)??message;
  decorateEpitomeTray(tray,card);
 }
}
export function installEpitomeApply(Type=globalThis.customElements?.get?.("effect-application")){
 const proto=Type?.prototype;if(!proto||proto.rsaEpitomeResistance||typeof proto._onApplyEffects!=="function")return;
 const original=proto._onApplyEffects,build=proto.buildEffectsList;
 if(typeof build==="function")proto.buildEffectsList=function(...args){const result=build.apply(this,args);decorateEpitomeTray(this,this.chatMessage);return result;};
 proto._onApplyEffects=function(...args){
  if(!epitomeResistanceActivity(this.chatMessage?.getAssociatedActivity?.({scaled:true})))return original.apply(this,args);
  const selected=values(this.effects).filter(e=>this.effectChecked(e.uuid));
  if(selected.length!==1){ui.notifications.warn("Choose one Elemental Epitome resistance.");return;}
  return requestEpitomeResistance(this.chatMessage,resistanceType(selected[0])).catch(report);
 };proto.rsaEpitomeResistance=true;
}
Hooks.once("ready",()=>{
 installEpitomeApply();installAttunementEnd(CONFIG.DND5E?.activityTypes?.enchant?.documentClass);Hooks.on("dnd5e.renderChatMessage",renderEpitomeResistance);
 Hooks.on("deleteActiveEffect",effect=>{clearEndedAttunementResistance(effect,{deleted:true}).catch(report);});
 Hooks.on("updateActiveEffect",effect=>{clearEndedAttunementResistance(effect).catch(report);});
 Hooks.on("dnd5e.applyEnchantment",(item,effect,options)=>{openAttunementResistance(item,effect,options).catch(report);});
 Hooks.on("deleteItem",item=>{
  const actor=item.actor??item.parent;if(key(item)!=="elemental-epitome"||!actor?.isOwner||game.users.activeGM&&game.users.activeGM.id!==game.user.id)return;
  const ids=values(actor.effects).filter(e=>resistanceCopy(e,item)).map(e=>e.id);
  if(ids.length)actor.deleteEmbeddedDocuments("ActiveEffect",ids).catch(report);
 });
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="epitomeResistanceError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);return;}
  if(packet?.action!=="selectEpitomeResistance"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;
  const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;
  selectEpitomeResistance(card,packet.type,user).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"epitomeResistanceError",userId:user.id,error:error.message});});
 });
});
