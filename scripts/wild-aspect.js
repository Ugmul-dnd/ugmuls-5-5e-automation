const ID="ugmuls-5-5e-automation",types=["owl","panther","salmon"],queues=new Map(),bound=new WeakSet();
const values=c=>Array.from(c?.values?.()??c??[]);
const key=item=>item?.identifier??item?.system?.identifier;
const flag=(doc,name)=>doc?.getFlag?.(ID,name)??doc?.flags?.[ID]?.[name];
export function aspectOfWildsActivity(activity){return activity?.item?.type==="feat"&&activity.item.system?.source?.rules!=="2014"&&(key(activity.item)==="aspect-of-the-wilds"||/^aspect of the wilds$/i.test(activity.item.name??""));}
export function aspectType(effect){const match=/^Aspect of the (Owl|Panther|Salmon)$/i.exec(effect?.name??" ");return match?.[1].toLowerCase()??null;}
export function aspectCopy(effect,item){
 if(flag(effect,"wildAspect")?.item===item.uuid)return true;
 const refs=[effect.origin,effect.system?.origin?.item,effect.system?.origin?.activity,effect._stats?.duplicateSource,effect._stats?.compendiumSource].filter(r=>typeof r==="string");
 return !!aspectType(effect)&&refs.some(ref=>ref===item.uuid||ref.startsWith(item.uuid+".")||ref.includes(".Item.phbbrbAspectOfTh."));
}
function context(card){const activity=card?.getAssociatedActivity?.({scaled:true}),actor=card?.getAssociatedActor?.()??activity?.actor;return {activity,actor,item:activity?.item};}
export function selectWildAspect(card,type,user=game.user){
 const actor=context(card).actor;if(!actor)return Promise.reject(Error("The originating Barbarian could not be found."));
 const task=(queues.get(actor.uuid)??Promise.resolve()).catch(()=>{}).then(async()=>{
  const {activity,actor,item}=context(card);
  if(!aspectOfWildsActivity(activity)||!types.includes(type)||!actor||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||!actor.isOwner)throw Error("Only the Barbarian’s owner or GM can select their Aspect of the Wilds aspect.");
  const effects=values(item.effects),source=effects.find(e=>aspectType(e)===type&&(!activity.effects?.length||values(activity.effects).some(p=>p._id===e.id||p.uuid===e.uuid)));
  if(!source)throw Error("That aspect is not available on this Aspect of the Wilds card.");
  // Resolve the real owned item: card scaling can provide a temporary copy.
  const owned=actor.items?.get?.(item.id)??values(actor.items).find(i=>i.uuid===item.uuid);
  if(!owned||key(owned)!=="aspect-of-the-wilds")throw Error("The Barbarian no longer owns Aspect of the Wilds.");
  const choices=values(actor.effects).filter(e=>aspectCopy(e,owned)),existing=choices.find(e=>flag(e,"wildAspect"))??choices.find(e=>aspectType(e)===type);
  const data=source.toObject();delete data._id;delete data.folder;delete data.start;
  // Normalize the native Owl change to the current actor schema.
  for(const change of data.system?.changes??[])if(change.key==="attributes.senses.darkvision")change.key="system.attributes.senses.darkvision";
  data.type="base";data.transfer=false;data.disabled=false;data.origin=actor.uuid;data.statuses=[];
  data.duration={value:null,units:"seconds",expiry:null,expired:false};
  data.system={...data.system,origin:{actor:actor.uuid,item:owned.uuid,activity:activity.uuid,message:card.uuid}};
  data.flags={...data.flags,[ID]:{...data.flags?.[ID],wildAspect:{item:owned.uuid,type}},autoanimations:{version:5,isEnabled:false,isCustomized:false,killAnim:true}};
  data._stats={duplicateSource:source.uuid};
  const native=values(owned.effects).filter(e=>aspectType(e)&&!e.disabled);
  if(native.length)await owned.updateEmbeddedDocuments("ActiveEffect",native.map(e=>({_id:e.id,disabled:true})));
  if(existing){
   if(aspectType(existing)!==type||existing.disabled||!flag(existing,"wildAspect"))await existing.update(data);
  }else await actor.createEmbeddedDocuments("ActiveEffect",[data]);
  const obsolete=choices.filter(e=>e!==existing).map(e=>e.id);
  // When a new effect was needed, all old copies are obsolete.
  if(obsolete.length)await actor.deleteEmbeddedDocuments("ActiveEffect",obsolete);
  if(card.isOwner!==false)await card.setFlag(ID,"wildAspectChoice",type);
  return type;
 });queues.set(actor.uuid,task);return task.finally(()=>{if(queues.get(actor.uuid)===task)queues.delete(actor.uuid);});
}
function report(error){console.error("Aspect of the Wilds selection",error);ui.notifications.error(error.message);}
export async function requestWildAspect(card,type){
 // Owners can update their own feature/effects directly. The GM observes those
 // document changes and updates the aura; no chat-message ownership is needed.
 const actor=context(card).actor;
 if(actor?.isOwner)return selectWildAspect(card,type);
 const gm=game.users.activeGM;
 if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"selectWildAspect",messageId:card.id,type,userId:game.user.id,gmId:gm.id});
 else await selectWildAspect(card,type);
}
export function decorateAspectTray(tray,card){
 const {activity,actor,item}=context(card);if(!aspectOfWildsActivity(activity)||!actor)return;
 tray.open=true;
 const current=values(actor.effects).find(e=>!e.disabled&&!e.duration?.expired&&aspectCopy(e,item));
 const chosen=values(tray.effects).find(e=>aspectType(e)===aspectType(current));
 const chosenRow=chosen?tray.querySelector('.effect[data-uuid="'+chosen.uuid+'"]'):null;
 if(chosenRow)tray._onCheckEffect?.({target:chosenRow,shiftKey:false,stopPropagation(){}});
 const apply=tray.querySelector(".apply-button");if(apply){apply.hidden=true;apply.style.display="none";}
 const targets=tray.targetList??tray.querySelector("recorded-targets");if(targets){targets.hidden=true;targets.style.display="none";}
 if(!tray.querySelector(".rsa-wild-choice-info")){const info=document.createElement("p");info.className="rsa-wild-choice-info";info.textContent="Choose one aspect for "+actor.name+". Clicking a choice replaces the previous aspect. You can change it at any time.";tray.prepend(info);}
 if(bound.has(tray))return;bound.add(tray);
 tray.addEventListener("click",event=>{
  const row=event.target.closest?.(".effect[data-uuid]");if(!row||!tray.contains(row))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!(game.user.isGM||actor.isOwner)){ui.notifications.warn("Only the Barbarian’s owner or GM can change Aspect of the Wilds.");return;}
  const effect=values(tray.effects).find(e=>e.uuid===row.dataset.uuid),type=aspectType(effect);if(!type)return;
  // Native single-selection state is retained; Shift cannot select several aspects.
  tray._onCheckEffect?.({target:event.target,shiftKey:false,stopPropagation(){}});
  requestWildAspect(card,type).catch(report);
 },true);
}
export function renderWildAspect(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const {activity,actor,item}=context(message);
 if(aspectOfWildsActivity(activity)){
  for(const button of root.querySelectorAll("[data-rsa-retarget]"))button.remove();
  // D&D5e can omit its tray for players unless global effects-tray and
  // self-target conditions are met. This owned feature has its own safe selector.
  if(!root.querySelector("effect-application")&&message.isContentVisible!==false&&(game.user.isGM||actor?.isOwner)){
   const owned=actor?.items?.get?.(item.id)??values(actor?.items).find(i=>i.uuid===item.uuid)??item;
   const options=values(owned.effects).filter(e=>aspectType(e)&&(!activity.effects?.length||values(activity.effects).some(p=>p._id===e.id||p.uuid===e.uuid)));
   if(options.length){const tray=document.createElement("effect-application");tray.effects=options;tray.chatMessage=message;tray.dataset.rsaWildOwnerTray="true";root.append(tray);}
  }
 }
 for(const tray of root.querySelectorAll("effect-application")){
  const card=tray.chatMessage??game.messages.get(tray.closest?.("[data-message-id]")?.dataset.messageId)??message;
  decorateAspectTray(tray,card);
 }
}
export function installAspectApply(Type=globalThis.customElements?.get?.("effect-application")){
 const proto=Type?.prototype;if(!proto||proto.rsaWildAspect||typeof proto._onApplyEffects!=="function")return;
 const original=proto._onApplyEffects,build=proto.buildEffectsList;
 if(typeof build==="function")proto.buildEffectsList=function(...args){const result=build.apply(this,args);decorateAspectTray(this,this.chatMessage);return result;};
 proto._onApplyEffects=function(...args){
  if(!aspectOfWildsActivity(this.chatMessage?.getAssociatedActivity?.({scaled:true})))return original.apply(this,args);
  const selected=values(this.effects).filter(e=>this.effectChecked(e.uuid));
  if(selected.length!==1){ui.notifications.warn("Choose one Aspect of the Wilds aspect.");return;}
  return requestWildAspect(this.chatMessage,aspectType(selected[0])).catch(report);
 };proto.rsaWildAspect=true;
}
Hooks.once("ready",()=>{
 installAspectApply();Hooks.on("dnd5e.renderChatMessage",renderWildAspect);
 Hooks.on("deleteItem",item=>{
  const actor=item.actor??item.parent;if(!aspectOfWildsActivity({item})||!actor?.isOwner||game.users.activeGM&&game.users.activeGM.id!==game.user.id)return;
  const ids=values(actor.effects).filter(e=>aspectCopy(e,item)).map(e=>e.id);
  if(ids.length)actor.deleteEmbeddedDocuments("ActiveEffect",ids).catch(report);
 });
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="wildAspectError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);return;}
  if(packet?.action!=="selectWildAspect"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;
  const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;
  selectWildAspect(card,packet.type,user).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"wildAspectError",userId:user.id,error:error.message});});
 });
});
