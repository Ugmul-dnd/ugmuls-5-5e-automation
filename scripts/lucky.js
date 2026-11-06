import {createEventQueue,isRollAdjustmentLocked,linkedHpCards} from './shared-activity-card.js';
import {updateSaveMode,saveModeLocked} from './save-roll-controls.js';
import {deflectMode} from './steel-deflect.js';
import {syncFlareDamage} from './warding-flare.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),capturing=new Map();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k),enabled=()=>game.settings.get(ID,'luckyAutomation')===true;
const authority=()=>game.user.isGM&&game.users.activeGM?.id===game.user.id;
const turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
const resolve=r=>{try{return typeof r==='string'?(globalThis.fromUuidSync?.(r,{strict:false})??game.messages.get(r.replace(/^ChatMessage\./,''))):r;}catch{return null;}};
const owns=(actor,user)=>!!user?.active&&(user.isGM||actor?.testUserPermission?.(user,'OWNER'));
const visible=(card,user)=>card?.isContentVisible!==false&&(user?.isGM||!card?.blind&&(!card?.whisper?.length||card.whisper.some(w=>(w.id??w)===user?.id)));
export const luckyFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&((i.identifier??i.system?.identifier)==='lucky'||i.name?.trim().toLowerCase()==='lucky'));
export const luckPoints=feature=>Math.max(0,Number(feature?.system?.uses?.value??(Number(feature?.system?.uses?.max)-Number(feature?.system?.uses?.spent??0)))||0);
function attackOf(card){if(card?.type==='attack')return card;const id=flag(card,'damageAttackId');if(id)return game.messages.get(id);const origin=resolve(card?.system?.origin);if(origin?.type==='attack')return origin;const attacks=values(origin?.getAssociatedRolls?.('attack'));return attacks.length===1?attacks[0]:null;}
const signature=card=>JSON.stringify(card.rolls.map(r=>r.toJSON?.()??r));
function refresh(card){globalThis.Ugmuls55eAutomationChatRefresh?.card(card);const origin=resolve(card?.system?.origin);if(origin)globalThis.Ugmuls55eAutomationChatRefresh?.card(origin);for(const hp of linkedHpCards(card))globalThis.Ugmuls55eAutomationChatRefresh?.card(hp);}
export function luckySnapshot(card){
 if(!enabled()||card?.type!=='attack'||card.rolls?.length!==1||!card.rolls[0]?._evaluated||card.system?.targets?.length!==1)return null;
 const target=resolve(card.system.targets[0].token),actor=target?.actor,feature=luckyFeature(actor);
 if(!feature)return null;
 const eligible=luckPoints(feature)>0&&card.getAssociatedActor?.()?.uuid!==actor.uuid;
 return {turn:turn(),entries:eligible?[{actor:actor.uuid,feature:feature.uuid,token:target.uuid}]:[]};
}
export function captureLucky(card){
 const attack=attackOf(card);if(!authority()||!enabled()||!attack||flag(attack,'luckySnapshot')!==undefined)return Promise.resolve();
 if(capturing.has(attack.id))return capturing.get(attack.id);
 const snapshot=luckySnapshot(attack);if(!snapshot)return Promise.resolve();
 const job=attack.setFlag(ID,'luckySnapshot',snapshot).then(()=>{if(snapshot.entries.length)refresh(attack);}).finally(()=>capturing.delete(attack.id));capturing.set(attack.id,job);return job;
}
export function luckyCandidates(card,user=game.user,{adjusting=false}={}){
 if(!enabled()||!game.users.activeGM||!user?.active||card?.type!=='attack'||!visible(card,user)||card.rolls?.length!==1||!card.rolls[0]?._evaluated||card.system?.targets?.length!==1||flag(card,'luckyUsed')||!adjusting&&flag(card,'luckyAdjusting'))return [];
 const snapshot=flag(card,'luckySnapshot');if(!snapshot||snapshot.turn!==turn()||isRollAdjustmentLocked(card)||saveModeLocked(card,0))return [];
 const currentMode=card.rolls[0].options?.advantageMode??0;if(currentMode===-1)return [];
 const mode=deflectMode(card.rolls[0]);if(mode===currentMode)return [];
 return snapshot.entries.flatMap(e=>{
  const target=resolve(e.token),actor=target?.actor,feature=luckyFeature(actor);
  return actor&&owns(actor,user)&&feature?.uuid===e.feature&&luckPoints(feature)>0&&card.system.targets[0].token===e.token&&card.getAssociatedActor?.()?.uuid!==actor.uuid?[{...e,actor,feature,target,mode}]:[];
 });
}
const downgraded=attack=>flag(attack,'luckyUsed')?.wasCritical===true&&attack.rolls?.[0]?.isCritical!==true;
export async function syncLuckyDamage(card,extra){
 const attack=attackOf(card);if(!attack||!downgraded(attack))return;
 await syncFlareDamage(attack,extra,{adjustedKey:'luckyCriticalAdjusted',criticalDowngraded:true});
}
export function luckyReady(card){
 const attack=attackOf(card);return !flag(attack,'luckyAdjusting')&&!(card?.type==='damage'&&downgraded(attack)&&!flag(card,'luckyCriticalAdjusted')&&card.rolls?.some(r=>r.options?.isCritical===true));
}
export async function prepareLucky(card){await captureLucky(card);if(card?.type==='damage')await syncLuckyDamage(card,card);}
export function useLucky(card,token,user=game.user){return enqueue(async()=>{
 if(!authority())throw Error('A connected GM is required for Lucky.');
 let e=luckyCandidates(card,user).find(e=>e.token===token);if(!e)throw Error('Lucky requires an available Luck Point on an unapplied incoming attack.');
 let spent,charged=false,committed=false;await card.setFlag(ID,'luckyAdjusting',true);
 try{
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  e=luckyCandidates(card,user,{adjusting:true}).find(e=>e.token===token);if(!e)throw Error('The attack or Luck Points changed.');
  const expected=signature(card),snapshotTurn=turn();spent=Number(e.feature.system.uses.spent??0);
  await e.feature.update({'system.uses.spent':spent+1});charged=true;
  const validate=()=>!isRollAdjustmentLocked(card)&&!saveModeLocked(card,0)&&!flag(card,'luckyUsed')&&turn()===snapshotTurn&&signature(card)===expected&&owns(e.actor,user)&&visible(card,user)&&luckyFeature(e.actor)?.uuid===e.feature.uuid&&Number(e.feature.system.uses.spent)===spent+1&&card.system.targets?.length===1&&card.system.targets[0].token===token&&resolve(token)?.actor?.uuid===e.actor.uuid&&card.getAssociatedActor?.()?.uuid!==e.actor.uuid;
  if(!validate())throw Error('The attack changed before Lucky.');
  const used={actor:e.actor.uuid,feature:e.feature.uuid,token,mode:e.mode,user:user.id,wasCritical:card.rolls[0].isCritical===true};
  const result=await updateSaveMode(card,e.mode,0,game.user,{updates:{['flags.'+ID+'.luckyUsed']:used},validate});
  if(result!==true)throw Error('The attack could not be adjusted. The Luck Point was restored.');
  committed=true;await syncLuckyDamage(card);
 }finally{
  try{if(charged&&!committed)await e.feature.update({'system.uses.spent':Math.max(0,Number(e.feature.system.uses.spent??0)-1)});}
  finally{await card.setFlag(ID,'luckyAdjusting',false);refresh(card);}
 }
 if(committed)await globalThis.Ugmuls55eAutomationReactive?.completed(card);
});}
function requestLucky(card,token){const gm=game.users.activeGM;if(gm?.id!==game.user.id){game.socket.emit('module.'+ID,{action:'luckyUse',card:card.id,token,user:game.user.id,gm:gm?.id});return;}return useLucky(card,token);}
export function renderLucky(card,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const entries=[...(card.type==='attack'?[{card,node:root}]:[]),...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(node=>!node.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){
  node.querySelectorAll(':scope > .rsa-lucky').forEach(n=>n.remove());const candidates=luckyCandidates(card);if(!candidates.length)continue;
  const row=document.createElement('div');row.className='rsa-attack-actions rsa-lucky';
  for(const e of candidates){const b=document.createElement('button');b.type='button';b.textContent='Lucky — '+(e.target.name??e.actor.name);b.dataset.tooltip='Spend 1 Luck Point to impose Disadvantage on this incoming attack. Existing Advantage cancels normally.';b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();b.disabled=true;Promise.resolve(requestLucky(card,e.token)).catch(report);});row.append(b);}node.append(row);
 }
}
function report(error){console.error('Lucky',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'luckyAutomation',{name:'Lucky: Incoming Attacks',hint:'Offer Lucky on incoming single-target attacks. Spend one native Luck Point to impose Disadvantage with normal Advantage cancellation. Own-roll Advantage remains manual; hide the control when no points remain.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationLucky={capture:prepareLucky,candidates:luckyCandidates,ready:luckyReady};
 Hooks.on('createChatMessage',card=>{prepareLucky(card).catch(report);});
 Hooks.on('updateChatMessage',(card,changes)=>{if(card.type==='damage'&&(Object.hasOwn(changes??{},'rolls')||Object.hasOwn(changes??{},'flags.'+ID+'.pendingDamage')||Object.hasOwn(changes?.flags?.[ID]??{},'pendingDamage')))syncLuckyDamage(card,card).catch(report);});
 Hooks.on('dnd5e.renderChatMessage',renderLucky);
 for(const event of ['createItem','updateItem','deleteItem','updateActor','updateCombat','deleteCombat'])Hooks.on(event,doc=>globalThis.Ugmuls55eAutomationChatRefresh?.request('lucky',doc));
 game.socket.on('module.'+ID,p=>{if(p?.action==='luckyError'&&p.user===game.user.id){ui.notifications.error(p.error);return;}if(p?.action!=='luckyUse'||!authority()||p.gm!==game.user.id)return;const card=game.messages.get(p.card),user=game.users.get(p.user);if(card&&user?.active)useLucky(card,p.token,user).catch(error=>game.socket.emit('module.'+ID,{action:'luckyError',user:user.id,error:error.message}));});
});
