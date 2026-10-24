import {createEventQueue,isRollAdjustmentLocked,describeTarget} from "./shared-activity-card.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
const ID="ugmuls-5-5e-automation",types=["acid","cold","fire","lightning","thunder"],enqueue=createEventQueue();
const values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier;
export function rebukeAttack(card){
 if(card?.type==="attack")return card;
 const id=card?.getFlag?.(ID,"damageAttackId"),ref=card?.system?.origin,origin=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 return id?game.messages.get(id):origin?.type==="attack"?origin:values(origin?.getAssociatedRolls?.("attack")).filter(a=>(a.timestamp??0)<=(card.timestamp??Infinity)).sort((a,b)=>b.timestamp-a.timestamp)[0];
}
export function rebukeRecord(card,uuid){
 const records=rebukeAttack(card)?.getFlag?.(ID,"elementalRebukes");if(!records||!uuid)return null;
 // Flag updates expand dotted keys. New records use a plain token ID; read
 // both older literal UUID keys and UUIDs expanded into nested objects.
 return records[uuid.split(".").at(-1)]??records[uuid]??uuid.split(".").reduce((value,key)=>value?.[key],records)??null;
}
export function refreshRebukeDamage(attack){
 if(attack?.type!=="attack")return;
 const cards=new Map(values(attack.getAssociatedRolls?.("damage")).map(card=>[card.id,card]));
 for(const card of values(game.messages).slice(-100))if(card.type==="damage"&&rebukeAttack(card)?.id===attack.id)cards.set(card.id,card);
 for(const card of cards.values())globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
}
export function rebukeCandidates(card,user=game.user){
 if(game.settings.get(ID,"elementalRebukeAutomation")!==true||!["attack","damage"].includes(card?.type)||isRollAdjustmentLocked(card))return [];
 const attack=rebukeAttack(card);if(!attack||isRollAdjustmentLocked(attack))return [];
 const source=attack.getAssociatedToken?.(),attacker=source?.document??source;
 if(!attacker?.actor)return [];
 return values(attack.system?.evaluatedTargets).filter(t=>t.isMiss===false).flatMap(target=>{
  if(rebukeRecord(attack,target.token))return [];
  const token=globalThis.fromUuidSync?.(target.token,{strict:false}),actor=token?.actor;
  if(!actor||actor.uuid===attacker.actor.uuid||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||reactionUsed(actor)||["incapacitated","unconscious","dead","stunned","paralyzed","petrified"].some(s=>actor.statuses?.has(s)))return [];
  const feature=values(actor.items).find(i=>i.type==="feat"&&key(i)==="elemental-rebuke"&&i.system?.source?.rules!=="2014"),activity=values(feature?.system?.activities).find(a=>a.type==="save"&&String(a.activation?.type).startsWith("reaction"));
  const available=Number(feature?.system?.uses?.value??Number(feature?.system?.uses?.max)-Number(feature?.system?.uses?.spent??0));
  return feature&&activity&&available>0?[{actor,token,feature,activity,attack,attacker}]:[];
 });
}
export function buildRebuke(feature,activity,type){
 if(!types.includes(type))throw Error("Choose an Elemental Rebuke damage type.");
 const data=feature.toObject(),id=activity.id,save=data.system.activities[id];if(!save?.damage?.parts?.length)throw Error("Elemental Rebuke needs its native save and damage activity.");
 data._id=foundry.utils.randomID();data.system.activities={[id]:save};data.effects=[];
 save.activation={type:"special",override:true};save.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};
 save.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};save.range={override:true,units:"any"};save.effects=[];
 save.damage.parts=save.damage.parts.map(part=>({...part,types:[type]}));save.damage.onSave="half";
 return {data,id};
}
export async function applyElementalRebuke(card,actorUuid,type,user=game.user){
 const entry=rebukeCandidates(card,user).find(e=>e.actor.uuid===actorUuid);if(!entry||!types.includes(type))throw Error("Elemental Rebuke needs a confirmed incoming hit, an available Reaction and feature use. Undo applied damage first.");
 const {actor,feature,activity,attack,attacker,token}=entry,{data,id}=buildRebuke(feature,activity,type),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
 const spent=Number(feature.system.uses.spent??0);let charged=false,committed=false,marker;
 try{
  await feature.update({"system.uses.spent":spent+1});charged=true;
  if(reactionUsed(actor))throw Error("The Paladin’s Reaction was just used.");
  await recordReactionUse(activity,{}, {message:attack});marker=reactionUsed(actor);
  const tracked=game.settings.get(ID,"reactionTracker")===true&&game.combat?.started&&values(game.combat.combatants).some(c=>c.actor?.uuid===actorUuid);
  if(tracked&&marker?.getFlag?.(ID,"reactionUsage")!==attack.id)throw Error("Could not reserve the Paladin’s Reaction.");
  if(isRollAdjustmentLocked(attack))throw Error("Damage has already been applied. Undo it before using Elemental Rebuke.");
  const record={actor:actorUuid,name:actor.name,type,feature:feature.uuid,token:token.uuid};
  await attack.setFlag(ID,"elementalRebukes",{...attack.getFlag(ID,"elementalRebukes"),[token.id??token.uuid.split(".").at(-1)]:record});committed=true;
  const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{system:{targets:[describeTarget(attacker)]},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,elementalRebukeSave:{attack:attack.id,defender:token.uuid,type,userId:user.id}}}}});
  if(!result?.message)throw Error("The damage reduction is recorded, but the Rebuke save card could not be created. Use the feature’s native save manually without spending another use.");
  globalThis.Ugmuls55eAutomationChatRefresh?.card(attack);
  refreshRebukeDamage(attack);
  return result;
 }catch(error){if(charged&&!committed){await feature.update({"system.uses.spent":spent});if(marker?.getFlag?.(ID,"reactionUsage")===attack.id)await marker.update({disabled:true});}throw error;}
}
export function installRebukeDamage(Type=customElements.get("damage-application")){
 const p=Type?.prototype;if(!p?.getMergedOptions||p.rsaElementalRebuke)return;
 const get=p.getMergedOptions,change=p._onChangeMultiplier,seeded=new WeakMap();
 p.getMergedOptions=function(uuid){
  const record=rebukeRecord(this.chatMessage,uuid);
  if(record){let targets=seeded.get(this);if(!targets)seeded.set(this,targets=new Set());if(!targets.has(uuid)){const options=this.getTargetOptions?.(uuid);if(options)options.multiplier=0.5;targets.add(uuid);}}
  const options=get.call(this,uuid);return record&&!this.getTargetOptions?{...options,multiplier:0.5}:options;
 };
 if(change)p._onChangeMultiplier=function(event){const button=event.target.closest(".multiplier-button");if(button)for(const uuid of seeded.get(this)??[])this.getTargetOptions(uuid).multiplier=Number(button.value);return change.call(this,event);};
 p.rsaElementalRebuke=true;
}
export async function chooseRebukeElement(){
 return foundry.applications.api.DialogV2.wait({window:{title:"Elemental Rebuke"},position:{width:340},content:'<p>Spend a Reaction and one feature use to halve incoming damage and rebuke the attacker.</p><div class="form-group"><label>Damage Type</label><div class="form-fields"><select name="rebuke-element">'+types.map(type=>'<option value="'+type+'">'+type[0].toUpperCase()+type.slice(1)+'</option>').join('')+'</select></div></div>',buttons:[{action:"use",label:"Use Rebuke",default:true,callback:(_event,_button,dialog)=>dialog.element.querySelector('[name="rebuke-element"]').value},{action:"cancel",label:"Cancel",callback:()=>null}],close:()=>null,rejectClose:false});
}
async function request(card,entry){
 const type=await chooseRebukeElement();if(!type)return;
 const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"elementalRebuke",card:card.id,actor:entry.actor.uuid,type,user:game.user.id,gm:gm.id});else await enqueue(()=>applyElementalRebuke(card,entry.actor.uuid,type));
}
export function renderElementalRebuke(message,html){
 const root=html instanceof HTMLElement?html:html?.[0];if(!root)return;
 const entries=[{card:message,root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),root:node})).filter(e=>e.card&&!e.root.hidden)];
 for(const {card,root:node}of entries){if(rebukeAttack(card)?.getFlag?.(ID,"elementalRebukes"))for(const tray of node.querySelectorAll("damage-application"))tray.refreshMultiplier?.();node.querySelectorAll(':scope > .rsa-rebuke-actions').forEach(n=>n.remove());if(card.isContentVisible===false)continue;
  const candidates=rebukeCandidates(card),records=values(rebukeAttack(card)?.system?.evaluatedTargets).map(target=>rebukeRecord(card,target.token)).filter(Boolean);if(!candidates.length&&!records.length)continue;
  const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-rebuke-actions";
  for(const entry of candidates){const button=document.createElement("button");button.type="button";button.textContent="Elemental Rebuke — "+entry.actor.name;button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await request(card,entry);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});controls.append(button);}
  for(const record of Object.values(records??{})){const label=document.createElement("span");label.textContent="Elemental Rebuke: half damage to "+record.name+" · "+record.type;controls.append(label);}node.append(controls);
 }
}
function report(error){console.error("Elemental Rebuke",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"elementalRebukeAutomation",{name:"Elemental Rebuke Assistance",hint:"Offer the Genie Paladin’s Elemental Rebuke on confirmed incoming hits. Spend a Reaction and feature use, halve only that Paladin’s damage, and prompt the attacker’s native Dexterity save and selected elemental damage. Use before damage is applied.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{installRebukeDamage();Hooks.on("dnd5e.renderChatMessage",renderElementalRebuke);Hooks.on("updateChatMessage",(card,changes)=>{if(changes.flags?.[ID]?.elementalRebukes||Object.keys(changes).some(key=>key.startsWith("flags."+ID+".elementalRebukes")))refreshRebukeDamage(card);});for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect","updateCombat","updateItem"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("rebuke",doc,changes));game.socket.on("module."+ID,packet=>{if(packet?.action!=="elementalRebuke"||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gm!==game.user.id)return;const user=game.users.get(packet.user),card=game.messages.get(packet.card);if(!user?.active||!card)return;enqueue(()=>applyElementalRebuke(card,packet.actor,packet.type,user)).catch(report);});});
