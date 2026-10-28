import {createEventQueue,isRollAdjustmentLocked,isHealingCard} from "./shared-activity-card.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),wrapped=new WeakSet(),physical=new Set(["bludgeoning","piercing","slashing"]);
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"chainInvestmentAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function chainMaster(familiar){
 if(!enabled())return null;
 const ref=familiar?.getFlag?.("dnd5e","summon.origin")??familiar?.flags?.dnd5e?.summon?.origin,doc=ref?globalThis.fromUuidSync?.(ref,{strict:false}):null,source=doc?.item??doc;
 if(!source||!["find-familiar","pact-of-the-chain","investment-of-the-chain-master"].includes(key(source))&&!/^(find familiar|pact of the chain|investment of the chain master)$/i.test(source.name??""))return null;
 const actor=source.actor,feature=values(actor?.items).find(i=>i.type==="feat"&&(key(i)==="investment-of-the-chain-master"||/^investment of the chain master$/i.test(i.name??"")));
 const reaction=values(feature?.system?.activities).find(a=>String(a.activation?.type??"").startsWith("reaction"));return feature?{actor,feature,reaction,familiar,source}:null;
}
export function chainDamageTypes(process,part){
 const activity=process?.subject;if(!chainMaster(activity?.actor??activity?.item?.actor))return;
 for(const roll of part?[part]:process.rolls??[]){const options=roll.options??={};const types=values(options.types);if(!physical.has(options.type)&&!types.some(t=>physical.has(t)))continue;
  options.types=[...new Set([...types,...(options.type?[options.type]:[]),"necrotic","radiant"])];
 }
}
export function chainResistanceRecord(card,target){return values(flag(card,"chainResistance")).find(r=>r.target===target);}
export function chainResistanceCandidates(card,user=game.user){
 if(!enabled()||card?.type!=="damage"||card.isContentVisible===false||isHealingCard(card)||flag(card,"pendingDamage")||isRollAdjustmentLocked(card)||!card.rolls?.some(r=>r.total>0))return [];
 const ref=card.system?.origin,origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 return values(card.system?.targets).flatMap(t=>{
  const token=globalThis.fromUuidSync?.(t.token,{strict:false}),c=chainMaster(token?.actor);if(!c?.reaction||chainResistanceRecord(card,t.token)||!(user?.isGM||c.actor.testUserPermission?.(user,"OWNER"))||reactionUsed(c.actor)||["incapacitated","unconscious","stunned","paralyzed","petrified","dead"].some(s=>c.actor.statuses?.has(s)))return [];
  const outcome=origin?.system?.outcomes?.get(t.token);if(card.system.onSave&&(!["success","failure"].includes(outcome)||outcome==="success"&&card.system.onSave==="none"))return [];
  return [{...c,token}];
 });
}
export function grantChainResistance(card,targetUuid,user=game.user){return enqueue(async()=>{
 const c=chainResistanceCandidates(card,user).find(e=>e.token.uuid===targetUuid);if(!c)throw Error("Investment resistance needs damage to your linked familiar and an available Warlock Reaction. Undo applied damage first.");
 let marker,committed=false;
 try{
  marker=await recordReactionUse(c.reaction,{}, {message:{id:card.id}});
  const tracked=game.settings.get(ID,"reactionTracker")===true&&game.combat?.started&&values(game.combat.combatants).some(e=>e.actor?.uuid===c.actor.uuid);
  if(tracked&&marker?.getFlag?.(ID,"reactionUsage")!==card.id)throw Error("Could not reserve the Warlock’s Reaction.");
  if(isRollAdjustmentLocked(card))throw Error("Damage was already applied. Undo it before granting resistance.");
  const record={actor:c.familiar.uuid,target:c.token.uuid,warlock:c.actor.uuid,name:c.actor.name};
  await card.setFlag(ID,"chainResistance",{...flag(card,"chainResistance"),[c.token.id]:record});committed=true;
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return record;
 }catch(error){if(!committed&&marker?.getFlag?.(ID,"reactionUsage")===card.id)await marker.update({disabled:true});throw error;}
});}
export function installChainResistance(ActorType=CONFIG.Actor?.documentClass,TrayType=globalThis.customElements?.get?.("damage-application")){
 const p=TrayType?.prototype;if(p?.getMergedOptions&&!wrapped.has(p)){wrapped.add(p);const get=p.getMergedOptions;p.getMergedOptions=function(uuid){return {...get.call(this,uuid),rsaChainTarget:uuid};};}
 const a=ActorType?.prototype;if(!a?.calculateDamage||wrapped.has(a))return;wrapped.add(a);const calculate=a.calculateDamage;
 a.calculateDamage=function(damages,options={}){
  const ref=options.originatingMessage??options.origin,card=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
  const record=values(flag(card,"chainResistance")).find(r=>r.actor===this.uuid&&(!options.rsaChainTarget||options.rsaChainTarget===r.target)),resistance=this.system?.traits?.dr?.value;
  if(!record||!resistance?.add||options.rsaUndoDamage)return calculate.call(this,damages,options);
  const added=[...new Set(values(damages).map(d=>d.type).filter(t=>CONFIG.DND5E.damageTypes[t]&&!resistance.has(t)))];for(const type of added)resistance.add(type);
  try{return calculate.call(this,damages,options);}finally{for(const type of added)resistance.delete(type);}
 };
}
async function request(card,entry){const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"chainResistance",card:card.id,target:entry.token.uuid,user:game.user.id,gm:gm.id});else await grantChainResistance(card,entry.token.uuid);}
export function renderChainResistance(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll(".card-summary[data-message-id]")).map(node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){node.querySelectorAll(":scope > .rsa-chain-resistance").forEach(e=>e.remove());if(card?.type!=="damage"||card.isContentVisible===false)continue;const candidates=chainResistanceCandidates(card),records=values(flag(card,"chainResistance"));if(!candidates.length&&!records.length)continue;
  const row=document.createElement("div");row.className="rsa-attack-actions rsa-chain-resistance";
  for(const c of candidates){const b=document.createElement("button");b.type="button";b.textContent="Investment — Resist Damage ("+c.actor.name+")";b.dataset.tooltip="Spend the Warlock’s Reaction to grant their familiar Resistance against this damage only.";b.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();b.disabled=true;request(card,c).catch(report);});row.append(b);}
  for(const r of records){const text=document.createElement("span");text.textContent="Investment: familiar resists this damage — "+r.name;row.append(text);}node.append(row);
  for(const tray of node.querySelectorAll("damage-application"))tray.refreshMultiplier?.();
 }
}
function report(error){console.error("Investment of the Chain Master",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"chainInvestmentAutomation",{name:"Warlock: Investment of the Chain Master",hint:"Add Necrotic/Radiant choices to a linked familiar’s physical damage rows. Offer the Warlock’s Reaction on incoming familiar damage cards to grant resistance against only that damage. Native movement and save DC benefits remain unchanged.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 installChainResistance();Hooks.on("dnd5e.preRollDamageV2",(config,dialog)=>{if(!chainMaster(config.subject?.actor??config.subject?.item?.actor))return;chainDamageTypes(config);const configure=dialog.configure;Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("damage",dialog)??{});if(configure===false)dialog.configure=false;});
 Hooks.on("dnd5e.postBuildDamageRollConfig",chainDamageTypes);Hooks.on("dnd5e.renderChatMessage",renderChainResistance);
 for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect","updateItem","deleteItem","updateCombat"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("chainInvestment",doc,changes));
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="chainResistanceError"&&packet.user===game.user.id){ui.notifications.error(packet.error);return;}
  if(packet?.action!=="chainResistance"||!authority()||packet.gm!==game.user.id)return;const user=game.users.get(packet.user),card=game.messages.get(packet.card);if(!user?.active||!card)return;
  grantChainResistance(card,packet.target,user).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"chainResistanceError",user:user.id,error:error.message});});
 });
});
