import {createEventQueue,isRollAdjustmentLocked,linkedHpCards,describeTarget} from "./shared-activity-card.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
import {updateSaveMode} from "./save-roll-controls.js";
import {effectiveCombatant,companionOwner} from "./companion-turns.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),opened=new Set();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=r=>typeof r==="string"?globalThis.fromUuidSync?.(r,{strict:false}):r;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),enabled=()=>game.settings.get(ID,"steelDeflectAutomation")===true;
const key=i=>i?.identifier??i?.system?.identifier,unable=a=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>a.statuses?.has(s));
export function deflectMode(roll){
 const o=roll?.options??{},state=o['automated-conditions-5e'];
 // AC5E can leave both booleans true on a normal roll with no mode sources.
 // Its source counts are authoritative; stale booleans must not cancel Deflect.
 const advantage=state?.modeCounts
  ? !!state.modeCounts.advantages?.present||state.explicitModeOverride?.action==='advantage'||o.advantageMode===1
  : !!o.advantage||o.advantageMode===1;
 return advantage?0:-1;
}
export function deflectRange(defender,attacker){
 if(!defender?.actor||!attacker?.actor||defender.parent?.id!==attacker.parent?.id||attacker.hidden)return false;
 const a=defender.object,b=attacker.object;if(!a?.center||!b?.center)return false;
 const units=String(defender.parent?.grid?.units??'ft').toLowerCase(),limit=/^(m|meters?|metres?)$/.test(units)?1.524:5;
 const distance=canvas.grid.measurePath([a.center,b.center]).distance;
 return Number.isFinite(distance)&&distance<=limit&&!a.checkCollision?.(b.center,{type:'sight',mode:'any'});
}
export function deflectCandidates(card,user=game.user){
 if(!enabled()||!game.users.activeGM||!user?.active||card?.type!=='attack'||card.isContentVisible===false||!card.rolls?.[0]?._evaluated||card.rolls.length!==1||card.system?.targets?.length!==1||!game.combat?.started||isRollAdjustmentLocked(card))return [];
 const source=card.getAssociatedToken?.(),attacker=source?.document??source;if(!attacker?.actor)return [];
 const seen=new Set(),used=flag(card,'steelDeflections')??{};
 return values(attacker.parent?.tokens).flatMap(token=>{
  const actor=token.actor,owner=companionOwner(actor);if(!actor||!owner||seen.has(actor.uuid)||actor.uuid===attacker.actor.uuid||card.system.targets[0].actor===actor.uuid||resolve(card.system.targets[0].token)?.actor?.uuid===actor.uuid||used[token.id]||!(user.isGM||actor.testUserPermission?.(user,'OWNER'))||unable(actor)||reactionUsed(actor)||!effectiveCombatant(actor)||!deflectRange(token,attacker))return [];
  const feature=values(actor.items).find(i=>i.type==='feat'&&(key(i)==='deflect-attack'||i.name?.trim().toLowerCase()==='deflect attack'));
  const activity=values(feature?.system?.activities).find(a=>String(a.activation?.type).startsWith('reaction'));
  if(!activity)return [];seen.add(actor.uuid);return [{actor,owner,token,feature,activity,attacker}];
 });
}
function attackOf(card){if(card?.type==='attack')return card;const id=flag(card,'damageAttackId');if(id)return game.messages.get(id);const origin=resolve(card?.system?.origin)??game.messages.get(card?.system?.origin);return origin?.type==='attack'?origin:values(origin?.getAssociatedRolls?.('attack')).filter(a=>a.timestamp<=card.timestamp).sort((a,b)=>b.timestamp-a.timestamp)[0];}
export function deflectReady(card){return flag(attackOf(card),'steelDeflectAdjusting')!==true;}
function refresh(card){globalThis.Ugmuls55eAutomationChatRefresh?.card(card);for(const hp of linkedHpCards(card))globalThis.Ugmuls55eAutomationChatRefresh?.card(hp);}
export function useSteelDeflect(card,tokenId,user=game.user){return enqueue(async()=>{
 if(!authority())throw Error('A connected GM is required for Deflect Attack.');
 let entry=deflectCandidates(card,user).find(e=>e.token.id===tokenId);if(!entry)throw Error('Deflect Attack needs an available Reaction, an attacker you can see within 5 feet, and an unapplied single-target attack. Undo applied damage first.');
 let marker,committed=false;await card.setFlag(ID,'steelDeflectAdjusting',true);
 try{
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  entry=deflectCandidates(card,user).find(e=>e.token.id===tokenId);if(!entry)throw Error('The attack or Defender changed before Deflect Attack.');
  marker=await recordReactionUse(entry.activity,{}, {message:card});
  if(game.settings.get(ID,'reactionTracker')===true&&marker?.getFlag?.(ID,'reactionUsage')!==card.id)throw Error('Could not reserve the Defender’s Reaction.');
  const mode=deflectMode(card.rolls[0]);await updateSaveMode(card,mode,0,game.user);
  if(isRollAdjustmentLocked(card)||(card.rolls[0].options?.advantageMode??0)!==mode)throw Error('The attack changed during Deflect Attack. Undo applied damage first.');
  committed=true;
  await card.setFlag(ID,'steelDeflections',{...flag(card,'steelDeflections'),[tokenId]:{actor:entry.actor.uuid,mode,user:user.id}});
  await promptImprovedDeflection(card,entry,user);
 }finally{try{if(!committed&&marker?.getFlag?.(ID,'reactionUsage')===card.id)await marker.update({disabled:true});}finally{await card.setFlag(ID,'steelDeflectAdjusting',false);refresh(card);}}
});}
export function improvedDeflection(entry){
 const level=Number(entry.owner.classes?.artificer?.system?.levels??values(entry.owner.items).find(i=>i.type==='class'&&key(i)==='artificer')?.system?.levels??0);
 return level>=15&&entry.activity.type==='damage'&&entry.activity.damage?.parts?.length>0?entry.activity:null;
}
async function promptImprovedDeflection(card,entry,user){
 const native=improvedDeflection(entry);if(!native)return;
 const data=entry.feature.toObject(),id=native.id,activity=data.system.activities[id];data.name='Improved Deflection';data.system.activities={[id]:activity};data.effects=[];
 activity.activation={type:'special',override:true};activity.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};activity.effects=[];activity.appliedEffects=[];activity.target={override:true,prompt:false,affects:{type:'creature',count:'1',choice:false},template:{type:''}};activity.damage.critical={...activity.damage.critical,allow:false};
 const helper=new CONFIG.Item.documentClass(data,{parent:entry.actor});helper.prepareFinalAttributes?.();
 const targets=[describeTarget(entry.attacker)],flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,steelImprovedDeflection:{attack:card.id,actor:entry.actor.uuid,user:user.id}}};
 const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,concentration:{begin:false},create:{measuredTemplate:false}},{configure:false},{data:{system:{targets},flags}});
 if(!result?.message)throw Error('Deflect Attack succeeded, but Improved Deflection could not create its damage prompt.');
 const usage=result.message;await card.setFlag(ID,'steelDeflectionDamage',{...flag(card,'steelDeflectionDamage'),[entry.token.id]:usage.id});
}
async function showImprovedDamage(card){
 const damage=flag(card,'steelImprovedDeflection');if(card.type==='usage'&&damage?.user===game.user.id&&!opened.has(card.id+'damage')){
  opened.add(card.id+'damage');const activity=card.getAssociatedActivity?.();if(activity)await activity.rollDamage({isCritical:false},{configure:true},{data:{system:{origin:card.id,targets:card.system.targets},flags:{[ID]:{riderTriggered:true}}}});
 }
}
function requestDeflect(card,id){const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'steelDeflectUse',card:card.id,token:id,user:game.user.id,gm:gm.id});else useSteelDeflect(card,id,game.user).catch(report);}
function report(error){console.error('Steel Defender',error);ui.notifications.error(error.message);}
export function renderSteelDeflect(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){node.querySelectorAll(':scope > .rsa-steel-deflect').forEach(n=>n.remove());if(!card||card.isContentVisible===false||flag(card,'steelDeflectAdjusting'))continue;
  const candidates=deflectCandidates(card);if(!candidates.length)continue;
  const row=document.createElement('div');row.className='rsa-attack-actions rsa-steel-deflect';for(const entry of candidates){const b=document.createElement('button');b.type='button';b.textContent='Deflect Attack'+(candidates.length>1?' — '+entry.actor.name:'');b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();b.disabled=true;requestDeflect(card,entry.token.id);});row.append(b);}node.append(row);
 }
}
export function installDeflectDamage(Type){
 const p=Type?.prototype;if(!p?.getMergedOptions||p.rsaSteelDeflect)return;const get=p.getMergedOptions,apply=p._onApplyDamage,change=p._onChangeMultiplier,manual=new WeakSet();
 p.getMergedOptions=function(uuid){const options=get.call(this,uuid),card=this.chatMessage,attack=attackOf(card);
  const miss=attack?.system?.evaluatedTargets?.some(t=>t.token===uuid&&t.isMiss===true);
  const splash=globalThis.Ugmuls55eAutomationAcidArrow?.factor(card,uuid)===0.5;
  if(miss&&Object.keys(flag(attack,'steelDeflections')??{}).length&&!splash&&!flag(card,'masteryGraze')&&!manual.has(this)&&this.getTargetOptions?.(uuid)?.multiplier==null)return {...options,multiplier:0};return options;};
 if(change)p._onChangeMultiplier=function(event){if(event.target.closest('.multiplier-button'))manual.add(this);return change.call(this,event);};
 if(apply)p._onApplyDamage=function(event){if(!deflectReady(this.chatMessage)){ui.notifications.warn('Wait for the Deflect Attack adjustment to finish.');return;}return apply.call(this,event);};p.rsaSteelDeflect=true;
}
Hooks.once('init',()=>game.settings.register(ID,'steelDeflectAutomation',{name:'Steel Defender: Deflect Attack',hint:'Offer the Defender’s Reaction on a nearby visible attacker, preserve existing attack dice while applying Disadvantage, and prompt native Improved Deflection damage at level 15. Single-target attacks only; Undo applied HP before adjusting.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationSteelDeflect={ready:deflectReady};
 installDeflectDamage(globalThis.customElements?.get?.('damage-application'));
 for(const event of ['createChatMessage','updateChatMessage'])Hooks.on(event,card=>{showImprovedDamage(card).catch(report);});
 Hooks.on('dnd5e.renderChatMessage',renderSteelDeflect);
 for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect','createItem','updateItem','deleteItem','updateCombat'])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request('steelDeflect',doc,changes));
 game.socket.on('module.'+ID,packet=>{if(packet?.action==='steelDeflectError'&&packet.user===game.user.id){ui.notifications.error(packet.error);return;}if(packet?.action!=='steelDeflectUse'||!authority()||packet.gm!==game.user.id)return;const user=game.users.get(packet.user),card=game.messages.get(packet.card);if(user?.active&&card)useSteelDeflect(card,packet.token,user).catch(error=>{report(error);game.socket.emit('module.'+ID,{action:'steelDeflectError',user:user.id,error:error.message});});});
});
