import {createEventQueue,isRollAdjustmentLocked,isHealingCard} from "./shared-activity-card.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=c=>Array.from(c?.values?.()??c??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],wrapped=new WeakSet();
const enabled=()=>game.settings.get(ID,"superiorHunterDefenseAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),stamp=()=>game.combat?.started?game.combat.id+":"+game.combat.round+":"+game.combat.turn:null;
const damageTypes=new Set(["acid","bludgeoning","cold","fire","force","lightning","necrotic","piercing","poison","psychic","radiant","slashing","thunder"]),label=t=>t[0].toUpperCase()+t.slice(1);
export const defenseFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&i.system?.source?.rules!=="2014"&&((i.identifier??i.system?.identifier)==="superior-hunters-defense"||/^superior hunter['’]s defense$/i.test(i.name??"")));
export function defenseRecord(card,uuid){return values(flag(card,"superiorHunterDefense")).find(r=>r.target===uuid);}
export function incomingTypes(card){return [...new Set(values(card?.rolls).filter(r=>r.total>0).map(r=>r.options?.type).filter(t=>damageTypes.has(t)))];}
export function defenseCandidates(card,user=game.user){
 if(!enabled()||card?.type!=="damage"||card.isContentVisible===false||isHealingCard(card)||flag(card,"pendingDamage")||flag(card,"protectiveFieldPending")||flag(card,"deflectPending")||isRollAdjustmentLocked(card)||!card.rolls?.length||card.rolls.some(r=>!r._evaluated)||!incomingTypes(card).length)return [];
 const ref=card.system?.origin,origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 return values(card.system?.targets).flatMap(t=>{
  const token=globalThis.fromUuidSync?.(t.token,{strict:false}),actor=token?.actor,feature=defenseFeature(actor);
  if(!feature||defenseRecord(card,t.token)||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||reactionUsed(actor)||["incapacitated","unconscious","dead","stunned","paralyzed","petrified"].some(s=>actor.statuses?.has(s)))return [];
  const onSave=card.system?.onSave,outcome=origin?.system?.outcomes?.get(t.token);if(onSave&&(!["success","failure"].includes(outcome)||outcome==="success"&&onSave==="none"))return [];
  const reaction=values(feature.system?.activities).find(a=>String(a.activation?.type??"").startsWith("reaction"));return reaction?[{actor,token,feature,reaction,types:incomingTypes(card)}]:[];
 });
}
export function defenseEffect(feature,actor,token,card,type){
 const native=values(feature.effects).find(e=>values(e.system?.changes).some(c=>["system.traits.dr.value","system.traits.dr"].includes(c.key)&&c.value===type)),data=native?.toObject?.()??{};delete data._id;delete data.folder;
 const turn=stamp();Object.assign(data,{name:"Superior Hunter's Defense — "+label(type),type:"base",img:feature.img??"icons/svg/shield.svg",disabled:false,transfer:false,origin:actor.uuid,statuses:[],start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:turn?null:6,units:"seconds",expiry:null,expired:false}});
 data.system={...data.system,changes:[{key:"system.traits.dr.value",value:type,type:"add"}],origin:{actor:actor.uuid,item:feature.uuid,message:card.uuid}};
 data.flags={...data.flags,dnd5e:{...data.flags?.dnd5e,isTemporary:true},[ID]:{...data.flags?.[ID],superiorHunterResistance:{actor:actor.uuid,target:token.uuid,type,turn,combat:game.combat?.started?game.combat.id:null,expires:Number(game.time?.worldTime??0)+6}},autoanimations:{version:5,isEnabled:false,isCustomized:false,killAnim:true}};return data;
}
export function useSuperiorDefense(card,targetUuid,type,user=game.user){return enqueue(async()=>{
 let entry=defenseCandidates(card,user).find(c=>c.token.uuid===targetUuid);if(!entry||!entry.types.includes(type))throw Error("Superior Hunter's Defense needs incoming unapplied damage and an available Reaction. Undo applied damage first.");
 const {actor,token,feature,reaction}=entry,turn=stamp();let marker,effect,committed=false;
 try{
  marker=await recordReactionUse(reaction,{}, {message:{id:card.id}});
  const tracked=game.settings.get(ID,"reactionTracker")===true&&game.combat?.started&&values(game.combat.combatants).some(c=>c.actor?.uuid===actor.uuid);if(tracked&&marker?.getFlag?.(ID,"reactionUsage")!==card.id)throw Error("Could not reserve the Ranger's Reaction.");
  if(turn!==stamp()||isRollAdjustmentLocked(card)||defenseRecord(card,targetUuid)||!card.system?.targets?.some(t=>t.token===targetUuid)||!incomingTypes(card).includes(type))throw Error("The damage or turn changed before Superior Hunter's Defense could apply.");
  [effect]=await actor.createEmbeddedDocuments("ActiveEffect",[defenseEffect(feature,actor,token,card,type)]);if(!effect)throw Error("Could not apply the Ranger's resistance.");
  const record={actor:actor.uuid,target:token.uuid,name:actor.name,type,feature:feature.uuid,turn};await card.setFlag(ID,"superiorHunterDefense",[...values(flag(card,"superiorHunterDefense")),record]);committed=true;
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return record;
 }catch(error){if(!committed){if(effect&&values(actor.effects).some(e=>e.id===effect.id))await actor.deleteEmbeddedDocuments("ActiveEffect",[effect.id]);if(marker?.getFlag?.(ID,"reactionUsage")===card.id)await marker.update({disabled:true});}throw error;}
});}
export function installDefenseDamage(ActorType=CONFIG.Actor?.documentClass,TrayType=globalThis.customElements?.get?.("damage-application")){
 const p=TrayType?.prototype;if(p?.getMergedOptions&&!wrapped.has(p)){wrapped.add(p);const get=p.getMergedOptions;p.getMergedOptions=function(uuid){return {...get.call(this,uuid),rsaSuperiorDefenseTarget:uuid};};}
 const a=ActorType?.prototype;if(!a?.calculateDamage||wrapped.has(a))return;wrapped.add(a);const calculate=a.calculateDamage;
 a.calculateDamage=function(damages,options={}){
  const ref=options.originatingMessage??options.origin,card=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref,record=values(flag(card,"superiorHunterDefense")).find(r=>r.actor===this.uuid&&(!options.rsaSuperiorDefenseTarget||r.target===options.rsaSuperiorDefenseTarget));
  const resistance=this.system?.traits?.dr?.value;
  if(!record||!damageTypes.has(record.type)||!resistance?.add||resistance.has(record.type)||options.rsaUndoDamage)return calculate.call(this,damages,options);
  // Replay this hit's recorded resistance inside native calculation. This is
  // synchronous: restore the prepared trait even if another hook throws.
  resistance.add(record.type);try{return calculate.call(this,damages,options);}finally{resistance.delete(record.type);}
 };
}
export async function expireSuperiorDefense(combat=null,ending=false){
 if(!authority())return;
 const actors=new Map([...values(game.actors),...values(globalThis.canvas?.scene?.tokens).map(t=>t.actor),...values(combat?.combatants).map(c=>c.actor)].filter(Boolean).map(a=>[a.uuid,a]));
 for(const actor of actors.values()){const ids=values(actor.effects).filter(e=>{const m=flag(e,"superiorHunterResistance");if(!m)return false;return m.turn?m.combat===combat?.id&&(ending||combat.started===false||m.turn!==stamp()):Number(game.time?.worldTime??0)>=m.expires;}).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);}
}
export function defenseDamageBreakdown(card,entry,tray=null){
 let damages=null,adjusted=false;
 // Read the same per-recipient calculation used by the Apply tray, including
 // save multipliers, existing resistances and other damage-card adjustments.
 if(tray?.chatMessage?.id===card?.id&&tray.damages&&entry?.actor?.calculateDamage){
  try{const options=tray.getMergedOptions?.(entry.token.uuid)??{},result=entry.actor.calculateDamage(tray.damages,options);if(result){damages=values(result);adjusted=true;}}
  catch(error){console.warn("Superior Hunter's Defense damage preview",error);}
 }
 if(!damages)damages=values(card?.rolls).map(r=>({type:r.options?.type,value:r.total}));
 const amounts=new Map();for(const damage of damages){if(!damageTypes.has(damage.type))continue;const amount=Math.max(0,Number(damage.value)||0);amounts.set(damage.type,(amounts.get(damage.type)??0)+amount);}
 const rows=[...amounts].map(([type,amount])=>({type,amount}));return{rows,total:rows.reduce((n,row)=>n+row.amount,0),adjusted};
}
function damagePreviewHTML(breakdown){
 if(!breakdown?.rows?.length)return "";
 return '<section class="rsa-hunter-defense-preview"><strong>'+(breakdown.adjusted?'Current damage':'Rolled damage (before adjustments)')+'</strong><table><tbody>'+breakdown.rows.map(row=>'<tr><td>'+label(row.type)+'</td><td style="text-align:right">'+row.amount+'</td></tr>').join('')+'<tr><th>Total</th><th style="text-align:right">'+breakdown.total+'</th></tr></tbody></table></section>';
}
export function recommendedDefenseType(types,breakdown){
 const amounts=new Map((breakdown?.rows??[]).map(row=>[row.type,Number(row.amount)||0]));
 return types.reduce((best,type)=>best===undefined||(amounts.get(type)??0)>(amounts.get(best)??0)?type:best,undefined);
}
export async function chooseDefenseType(types,breakdown=null){if(types.length===1)return types[0];const recommended=recommendedDefenseType(types,breakdown);return foundry.applications.api.DialogV2.wait({window:{title:"Superior Hunter's Defense"},position:{width:340},content:damagePreviewHTML(breakdown)+'<p>Spend your Reaction. Resist one incoming damage type until the end of the current turn.</p><div class="form-group"><label>Resistance</label><div class="form-fields"><select name="hunter-defense-type">'+types.map(t=>'<option value="'+t+'"'+(t===recommended?' selected':'')+'>'+label(t)+'</option>').join('')+'</select></div></div>',buttons:[{action:"use",label:"Use Defense",default:true,callback:(_e,_b,d)=>d.element.querySelector('[name="hunter-defense-type"]').value},{action:"cancel",label:"Cancel",callback:()=>null}],close:()=>null,rejectClose:false});}
async function requestDefense(card,entry,node){const tray=values(node?.querySelectorAll?.("damage-application")).find(t=>t.chatMessage?.id===card.id);const type=await chooseDefenseType(entry.types,defenseDamageBreakdown(card,entry,tray));if(!type)return;const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"superiorHunterDefense",card:card.id,target:entry.token.uuid,type,user:game.user.id,gm:gm.id});else await useSuperiorDefense(card,entry.token.uuid,type);}
export function renderSuperiorDefense(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).map(node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const{card,node}of entries){node.querySelectorAll(':scope > .rsa-superior-defense').forEach(n=>n.remove());if(card.type!=="damage"||card.isContentVisible===false)continue;const candidates=defenseCandidates(card),records=values(flag(card,"superiorHunterDefense"));if(!candidates.length&&!records.length)continue;
  const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-superior-defense";
  for(const entry of candidates){const button=document.createElement("button");button.type="button";button.textContent="Superior Hunter's Defense"+(candidates.length>1?" — "+entry.actor.name:"");button.dataset.tooltip="Spend your Reaction to resist the selected damage type for this hit and the rest of the current turn.";button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await requestDefense(card,entry,node);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});controls.append(button);}
  for(const record of records){const info=document.createElement("span");info.textContent="Superior Hunter's Defense: "+record.name+" · "+label(record.type)+" resistance";controls.append(info);}node.append(controls);
 }
}
function report(error){console.error("Superior Hunter's Defense",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"superiorHunterDefenseAutomation",{name:"Superior Hunter's Defense Assistance",hint:"Offer the Hunter or GM a damage-card Reaction to resist the selected incoming damage type for this hit and until the end of the current turn. Recalculate through native resistance, preserve dice/Undo and remove the temporary resistance at turn end.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 installDefenseDamage();Hooks.on("canvasReady",()=>enqueue(()=>expireSuperiorDefense(game.combat)).catch(report));Hooks.on("dnd5e.renderChatMessage",renderSuperiorDefense);
 for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect","updateCombat","updateItem","deleteItem"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("superiorHunterDefense",doc,changes));
 Hooks.on("updateCombat",(c,d)=>{if("turn"in d||"round"in d||d.started===false)enqueue(()=>expireSuperiorDefense(c)).catch(report);});Hooks.on("deleteCombat",c=>enqueue(()=>expireSuperiorDefense(c,true)).catch(report));Hooks.on("updateWorldTime",()=>enqueue(()=>expireSuperiorDefense()).catch(report));
 game.socket.on("module."+ID,packet=>{if(packet?.action==="superiorHunterDefenseError"&&packet.user===game.user.id){ui.notifications.error(packet.error);return;}if(packet?.action!=="superiorHunterDefense"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gm!==game.user.id)return;const user=game.users.get(packet.user),card=game.messages.get(packet.card);if(user?.active&&card)useSuperiorDefense(card,packet.target,packet.type,user).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"superiorHunterDefenseError",user:user.id,error:error.message});});});
});
