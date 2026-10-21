const ID="ugmuls-5-5e-automation",types=["acid","cold","fire","lightning","thunder"],queues=new Map(),bound=new WeakSet();
const values=c=>Array.from(c?.values?.()??c??[]);
const key=item=>item?.identifier??item?.system?.identifier;
const flag=(doc,name)=>doc?.getFlag?.(ID,name)??doc?.flags?.[ID]?.[name];
export function elementalShieldingActivity(activity){return activity?.item?.type==="feat"&&activity.item.system?.source?.rules!=="2014"&&(key(activity.item)==="aura-of-elemental-shielding"||/^aura of elemental shielding$/i.test(activity.item.name??""));}
export function shieldingType(effect){const matches=values(effect?.system?.changes).filter(c=>c.key==="system.traits.dr.value"&&types.includes(c.value));return matches.length===1?matches[0].value:null;}
export function shieldingCopy(effect,item){
 if(flag(effect,"genieShielding")?.item===item.uuid)return true;
 const refs=[effect.origin,effect.system?.origin?.item,effect.system?.origin?.activity,effect._stats?.duplicateSource,effect._stats?.compendiumSource].filter(r=>typeof r==="string");
 return !!shieldingType(effect)&&refs.some(ref=>ref===item.uuid||ref.startsWith(item.uuid+".")||ref.includes(".Item.hofOngAuraofElem."));
}
function context(card){const activity=card?.getAssociatedActivity?.({scaled:true}),actor=card?.getAssociatedActor?.()??activity?.actor;return {activity,actor,item:activity?.item};}
export function selectElementalShielding(card,type,user=game.user){
 const actor=context(card).actor;if(!actor)return Promise.reject(Error("The originating Paladin could not be found."));
 const task=(queues.get(actor.uuid)??Promise.resolve()).catch(()=>{}).then(async()=>{
  const {activity,actor,item}=context(card);
  if(!elementalShieldingActivity(activity)||!types.includes(type)||!actor||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||!actor.isOwner)throw Error("Only the Paladin’s owner or GM can select their Elemental Shielding resistance.");
  const effects=values(item.effects),source=effects.find(e=>shieldingType(e)===type&&(!activity.effects?.length||values(activity.effects).some(p=>p._id===e.id||p.uuid===e.uuid)));
  if(!source)throw Error("That resistance is not available on this Elemental Shielding card.");
  // Resolve the real owned item: card scaling can provide a temporary copy.
  const owned=actor.items?.get?.(item.id)??values(actor.items).find(i=>i.uuid===item.uuid);
  if(!owned||key(owned)!=="aura-of-elemental-shielding")throw Error("The Paladin no longer owns Aura of Elemental Shielding.");
  const choices=values(actor.effects).filter(e=>shieldingCopy(e,owned)),existing=choices.find(e=>flag(e,"genieShielding"))??choices.find(e=>shieldingType(e)===type);
  const data=source.toObject();delete data._id;delete data.folder;delete data.start;
  data.type="base";data.transfer=false;data.disabled=false;data.origin=actor.uuid;data.statuses=[];
  data.duration={value:null,units:"seconds",expiry:null,expired:false};
  data.system={...data.system,origin:{actor:actor.uuid,item:owned.uuid,activity:activity.uuid,message:card.uuid}};
  data.flags={...data.flags,[ID]:{...data.flags?.[ID],genieShielding:{item:owned.uuid,type}},autoanimations:{version:5,isEnabled:false,isCustomized:false,killAnim:true}};
  data._stats={duplicateSource:source.uuid};
  const native=values(owned.effects).filter(e=>shieldingType(e)&&!e.disabled);
  if(native.length)await owned.updateEmbeddedDocuments("ActiveEffect",native.map(e=>({_id:e.id,disabled:true})));
  if(existing){
   if(shieldingType(existing)!==type||existing.disabled||!flag(existing,"genieShielding"))await existing.update(data);
  }else await actor.createEmbeddedDocuments("ActiveEffect",[data]);
  const obsolete=choices.filter(e=>e!==existing).map(e=>e.id);
  // When a new effect was needed, all old copies are obsolete.
  if(obsolete.length)await actor.deleteEmbeddedDocuments("ActiveEffect",obsolete);
  if(flag(actor,"paladinAuraElement")!==type||flag(actor,"paladinAuraElementManaged")!==true)await actor.update({["flags."+ID+".paladinAuraElement"]:type,["flags."+ID+".paladinAuraElementManaged"]:true});
  if(card.isOwner!==false)await card.setFlag(ID,"genieShieldingChoice",type);
  globalThis.Ugmuls55eAutomationPaladinAuras?.queue?.();
  return type;
 });queues.set(actor.uuid,task);return task.finally(()=>{if(queues.get(actor.uuid)===task)queues.delete(actor.uuid);});
}
function report(error){console.error("Elemental Shielding selection",error);ui.notifications.error(error.message);}
export async function requestElementalShielding(card,type){
 // Owners can update their own feature/effects directly. The GM observes those
 // document changes and updates the aura; no chat-message ownership is needed.
 const actor=context(card).actor;
 if(actor?.isOwner)return selectElementalShielding(card,type);
 const gm=game.users.activeGM;
 if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"selectGenieShielding",messageId:card.id,type,userId:game.user.id,gmId:gm.id});
 else await selectElementalShielding(card,type);
}
export function decorateShieldingTray(tray,card){
 const {activity,actor,item}=context(card);if(!elementalShieldingActivity(activity)||!actor)return;
 tray.open=true;
 const current=values(actor.effects).find(e=>!e.disabled&&!e.duration?.expired&&shieldingCopy(e,item));
 const chosen=values(tray.effects).find(e=>shieldingType(e)===shieldingType(current));
 const chosenRow=chosen?tray.querySelector('.effect[data-uuid="'+chosen.uuid+'"]'):null;
 if(chosenRow)tray._onCheckEffect?.({target:chosenRow,shiftKey:false,stopPropagation(){}});
 const apply=tray.querySelector(".apply-button");if(apply){apply.hidden=true;apply.style.display="none";}
 const targets=tray.targetList??tray.querySelector("recorded-targets");if(targets){targets.hidden=true;targets.style.display="none";}
 if(!tray.querySelector(".rsa-genie-choice-info")){const info=document.createElement("p");info.className="rsa-genie-choice-info";info.textContent="Choose one resistance for "+actor.name+". Clicking a choice replaces the previous shielding resistance.";tray.prepend(info);}
 if(bound.has(tray))return;bound.add(tray);
 tray.addEventListener("click",event=>{
  const row=event.target.closest?.(".effect[data-uuid]");if(!row||!tray.contains(row))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!(game.user.isGM||actor.isOwner)){ui.notifications.warn("Only the Paladin’s owner or GM can change Elemental Shielding.");return;}
  const effect=values(tray.effects).find(e=>e.uuid===row.dataset.uuid),type=shieldingType(effect);if(!type)return;
  // Native single-selection state is retained; Shift cannot select several resistances.
  tray._onCheckEffect?.({target:event.target,shiftKey:false,stopPropagation(){}});
  requestElementalShielding(card,type).catch(report);
 },true);
}
export function renderElementalShielding(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const {activity,actor,item}=context(message);
 if(elementalShieldingActivity(activity)){
  for(const button of root.querySelectorAll("[data-rsa-retarget]"))button.remove();
  // D&D5e can omit its tray for players unless global effects-tray and
  // self-target conditions are met. This owned feature has its own safe selector.
  if(!root.querySelector("effect-application")&&message.isContentVisible!==false&&(game.user.isGM||actor?.isOwner)){
   const owned=actor?.items?.get?.(item.id)??values(actor?.items).find(i=>i.uuid===item.uuid)??item;
   const options=values(owned.effects).filter(e=>shieldingType(e)&&(!activity.effects?.length||values(activity.effects).some(p=>p._id===e.id||p.uuid===e.uuid)));
   if(options.length){const tray=document.createElement("effect-application");tray.effects=options;tray.chatMessage=message;tray.dataset.rsaGenieOwnerTray="true";root.append(tray);}
  }
 }
 for(const tray of root.querySelectorAll("effect-application")){
  const card=tray.chatMessage??game.messages.get(tray.closest?.("[data-message-id]")?.dataset.messageId)??message;
  decorateShieldingTray(tray,card);
 }
}
export function installShieldingApply(Type=globalThis.customElements?.get?.("effect-application")){
 const proto=Type?.prototype;if(!proto||proto.rsaGenieShielding||typeof proto._onApplyEffects!=="function")return;
 const original=proto._onApplyEffects,build=proto.buildEffectsList;
 if(typeof build==="function")proto.buildEffectsList=function(...args){const result=build.apply(this,args);decorateShieldingTray(this,this.chatMessage);return result;};
 proto._onApplyEffects=function(...args){
  if(!elementalShieldingActivity(this.chatMessage?.getAssociatedActivity?.({scaled:true})))return original.apply(this,args);
  const selected=values(this.effects).filter(e=>this.effectChecked(e.uuid));
  if(selected.length!==1){ui.notifications.warn("Choose one Elemental Shielding resistance.");return;}
  return requestElementalShielding(this.chatMessage,shieldingType(selected[0])).catch(report);
 };proto.rsaGenieShielding=true;
}
Hooks.once("ready",()=>{
 installShieldingApply();Hooks.on("dnd5e.renderChatMessage",renderElementalShielding);
 Hooks.on("deleteItem",item=>{
  const actor=item.actor??item.parent;if(!elementalShieldingActivity({item})||!actor?.isOwner||game.users.activeGM&&game.users.activeGM.id!==game.user.id)return;
  const ids=values(actor.effects).filter(e=>shieldingCopy(e,item)).map(e=>e.id);
  if(ids.length)actor.deleteEmbeddedDocuments("ActiveEffect",ids).then(()=>globalThis.Ugmuls55eAutomationPaladinAuras?.queue?.()).catch(report);
 });
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="genieShieldingError"&&packet.userId===game.user.id){ui.notifications.error(packet.error);return;}
  if(packet?.action!=="selectGenieShielding"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gmId!==game.user.id)return;
  const user=game.users.get(packet.userId),card=game.messages.get(packet.messageId);if(!user?.active||!card)return;
  selectElementalShielding(card,packet.type,user).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"genieShieldingError",userId:user.id,error:error.message});});
 });
});
