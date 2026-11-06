import {createEventQueue,isRollAdjustmentLocked,isHealingCard,linkedHpCards} from './shared-activity-card.js';
import {failureState} from './bardic-inspiration.js';
import {restoreFocusTargets} from './fanatical-focus.js';
import {createConcentrationPrompt,resolveConcentration} from './concentration-checks.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k),enabled=()=>game.settings.get(ID,'mageSlayerAutomation')===true;
const authority=()=>game.user.isGM&&game.users.activeGM?.id===game.user.id;
const owns=(actor,user)=>!!user?.active&&(user.isGM||actor?.testUserPermission?.(user,'OWNER'));
const visible=(card,user)=>card?.isContentVisible!==false&&(user?.isGM||!card?.blind&&(!card?.whisper?.length||card.whisper.some(w=>(w.id??w)===user?.id)));
const actorOf=card=>card?.getAssociatedActor?.();
const resolve=ref=>{try{return typeof ref==='string'?(globalThis.fromUuidSync?.(ref,{strict:false})??game.messages.get(ref.replace(/^ChatMessage\./,''))):ref;}catch{return null;}};
export const mageSlayerFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&((i.identifier??i.system?.identifier)==='mage-slayer'||i.name?.trim().toLowerCase()==='mage slayer'));
const remaining=item=>Math.max(0,Number(item?.system?.uses?.value??(Number(item?.system?.uses?.max)-Number(item?.system?.uses?.spent??0)))||0);
const signature=card=>JSON.stringify({rolls:card.rolls.map(r=>r.toJSON?.()??r),ability:card.system?.ability,origin:typeof card.system?.origin==='string'?card.system.origin:card.system?.origin?.id});
export function canGuardMind(card,user=game.user,{adjusting=false}={}){
 if(!enabled()||!game.users.activeGM||card?.type!=='save'||card.rolls?.length!==1||!['int','wis','cha'].includes(card.system?.ability??card.rolls[0]?.options?.ability)||!visible(card,user)||flag(card,'mageSlayerUsed')||!adjusting&&flag(card,'mageSlayerAdjusting')||flag(card,'automaticGrappleFailure')||flag(card,'carefulSpell'))return false;
 const actor=actorOf(card);return owns(actor,user)&&remaining(mageSlayerFeature(actor))>0&&failureState(card,0)==='failed'&&!isRollAdjustmentLocked(card);
}
function refresh(card){globalThis.Ugmuls55eAutomationChatRefresh?.card(card);const origin=resolve(card?.system?.origin);if(origin)globalThis.Ugmuls55eAutomationChatRefresh?.card(origin);for(const hp of linkedHpCards(card))globalThis.Ugmuls55eAutomationChatRefresh?.card(hp);}
export function useGuardMind(card,user=game.user){return enqueue(async()=>{
 if(!authority()||!canGuardMind(card,user))throw Error('Guarded Mind needs a failed Intelligence, Wisdom, or Charisma save and an available Mage Slayer use. Undo applied damage/effects first.');
 const actor=actorOf(card),feature=mageSlayerFeature(actor);let spent,charged=false,committed=false;
 await card.setFlag(ID,'mageSlayerAdjusting',true);
 try{
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  if(!canGuardMind(card,user,{adjusting:true})||mageSlayerFeature(actor)?.uuid!==feature.uuid)throw Error('The saving throw or Mage Slayer use changed.');
  const expected=signature(card);spent=Number(feature.system.uses.spent??0);
  await feature.update({'system.uses.spent':spent+1});charged=true;
  if(signature(card)!==expected||isRollAdjustmentLocked(card)||!visible(card,user)||!owns(actor,user)||mageSlayerFeature(actor)?.uuid!==feature.uuid||Number(feature.system.uses.spent)!==spent+1||failureState(card,0)!=='failed')throw Error('The saving throw changed before Guarded Mind finished.');
  // Native resisted saves already report success to usage outcomes, damage
  // multipliers and effect application while retaining the original dice/DC.
  await card.update({'system.resisted':true,['flags.'+ID+'.mageSlayerUsed']:{actor:actor.uuid,feature:feature.uuid,user:user.id}});committed=true;
 }finally{
  try{if(charged&&!committed)await feature.update({'system.uses.spent':Math.max(0,Number(feature.system.uses.spent??0)-1)});}
  finally{await card.setFlag(ID,'mageSlayerAdjusting',false);refresh(card);}
 }
 if(committed){restoreFocusTargets(card);await resolveConcentration(card);await globalThis.Ugmuls55eAutomationReactive?.completed(card);}
});}
export function mageSlayerReady(card){
 const origin=resolve(card?.system?.origin),source=card?.type==='usage'?card:origin;
 return ![card,...values(source?.getAssociatedRolls?.('save'))].some(save=>flag(save,'mageSlayerAdjusting'));
}
function requestGuard(card){const gm=game.users.activeGM;if(gm?.id!==game.user.id){game.socket.emit('module.'+ID,{action:'mageSlayerUse',card:card.id,user:game.user.id,gm:gm?.id});return;}return useGuardMind(card);}
export function renderMageSlayer(card,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const entries=[...(card.type==='save'?[{card,node:root}]:[]),...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(node=>!node.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){
  node.querySelectorAll(':scope > .rsa-mage-slayer').forEach(n=>n.remove());
  if(flag(card,'mageSlayerUsed')&&visible(card,game.user)){const note=document.createElement('div');note.className='rsa-attack-actions rsa-mage-slayer';note.textContent='Guarded Mind — Success';node.append(note);continue;}
  if(!canGuardMind(card))continue;
  const row=document.createElement('div');row.className='rsa-attack-actions rsa-mage-slayer';const button=document.createElement('button');button.type='button';button.textContent='Mage Slayer — Guarded Mind';button.dataset.tooltip='Spend your native Mage Slayer use to succeed instead. No reroll or Reaction; recovers on a Short or Long Rest.';
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();button.disabled=true;Promise.resolve(requestGuard(card)).catch(report);});row.append(button);node.append(row);
 }
}
function damageSource(options){
 for(const ref of [options?.originatingMessage,options?.origin]){const card=resolve(ref);if(card?.type==='damage'&&!isHealingCard(card))return card;}
 return null;
}
export function captureMageSlayerDamage(actor,amount,updates,options={}){
 if(!enabled()||!(amount>0)||options.rsaUndoDamage||options.dnd5e?.concentrationCheck===false||game.settings.get('dnd5e','disableConcentration')===true||!values(actor?.concentration?.effects).length)return;
 const card=damageSource(options),source=actorOf(card),feature=mageSlayerFeature(source);if(!feature||source.uuid===actor.uuid)return;
 if(!values(card.system?.targets).some(t=>t.actor===actor.uuid||resolve(t.token)?.actor?.uuid===actor.uuid))return;
 const hp=actor.system?.attributes?.hp;if(!hp)return;
 const origin=options.origin?.getFlag?options.origin:card,nativeContext=options.origin?.getFlag?.('dnd5e','context');
 if(nativeContext?.concentrationCheck===false)return;
 options.rsaMageSlayer={source:{actor:source.uuid,feature:feature.uuid,damage:card.id,target:actor.uuid},before:{hp:Number(hp.value),temp:Number(hp.temp??0)},settled:false};
 // Native applyDamage passes origin's context to updateHP, not its options.
 // Override only this application context to replace its ordinary prompt with
 // one carrying exact damage provenance. No document flags or actor debuff.
 options.origin=new Proxy(origin,{get(target,key){if(key==='getFlag')return (scope,name)=>scope==='dnd5e'&&name==='context'?{...nativeContext,concentrationCheck:false}:target.getFlag(scope,name);const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
}
export async function finishMageSlayerDamage(actor,amount,options={}){
 const meta=options.rsaMageSlayer;if(!meta||meta.settled||meta.source.target!==actor?.uuid)return;meta.settled=true;
 if(options.rsaArcaneWardSettlement&&await options.rsaArcaneWardSettlement!==true)return;
 const hp=actor.system?.attributes?.hp,damage=meta.before.hp+meta.before.temp-Number(hp?.value??0)-Number(hp?.temp??0);
 if(!(damage>0)||!values(actor.concentration?.effects).length)return;
 const dc=actor.getConcentrationDC(damage);
 return createConcentrationPrompt(actor,{dc,flags:{[ID]:{mageSlayerConcentration:meta.source}}});
}
export function mageSlayerConcentrationDefaults(config,dialog,message){
 const source=message?.data?.flags?.[ID]?.mageSlayerConcentration;
 if(!source||source.target!==(config.subject?.uuid??config.subject?.actor?.uuid)||!config.isConcentration)return;
 config.disadvantage=true;
 for(const roll of config.rolls??[]){
  roll.options??={};const o=roll.options,state=o['automated-conditions-5e'];
  const advantage=state?.modeCounts?!!state.modeCounts.advantages?.present||state.explicitModeOverride?.action==='advantage'||o.advantageMode===1:!!(o.advantage||o.advantageMode===1||config.advantage);
  o.advantage=advantage;o.disadvantage=true;o.advantageMode=advantage?0:-1;
 }
 const mode=config.rolls?.[0]?.options?.advantageMode??(config.advantage?0:-1);dialog.options??={};dialog.options.defaultButton=mode===0?'normal':'disadvantage';
}
function report(error){console.error('Mage Slayer',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'mageSlayerAutomation',{name:'Mage Slayer Assistance',hint:'Offer Guarded Mind on failed mental saves using the native Short/Long Rest use, and impose Disadvantage on concentration checks caused by this character’s recorded damage. Guarded Mind does not spend a Reaction.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationMageSlayer={canGuard:canGuardMind,ready:mageSlayerReady};
 Hooks.on('dnd5e.renderChatMessage',renderMageSlayer);Hooks.on('dnd5e.preApplyDamage',captureMageSlayerDamage);Hooks.on('dnd5e.applyDamage',(actor,amount,options)=>{finishMageSlayerDamage(actor,amount,options).catch(report);});Hooks.on('dnd5e.preRollSavingThrowV2',mageSlayerConcentrationDefaults);
 for(const event of ['createItem','updateItem','deleteItem','updateActor','createActiveEffect','updateActiveEffect','deleteActiveEffect'])Hooks.on(event,doc=>globalThis.Ugmuls55eAutomationChatRefresh?.request('mageSlayer',doc));
 game.socket.on('module.'+ID,p=>{if(p?.action==='mageSlayerError'&&p.user===game.user.id){ui.notifications.error(p.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(p.card));return;}if(p?.action!=='mageSlayerUse'||!authority()||p.gm!==game.user.id)return;const card=game.messages.get(p.card),user=game.users.get(p.user);if(card&&user?.active)useGuardMind(card,user).catch(error=>game.socket.emit('module.'+ID,{action:'mageSlayerError',user:user.id,card:card.id,error:error.message}));});
});
