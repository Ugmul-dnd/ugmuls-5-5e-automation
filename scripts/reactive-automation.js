import {beguilingCandidates} from './beguiling-defenses.js';
import {canEmpower} from './empowered-spell.js';
import {canSeek} from './seeking-spell.js';
import {canPrecision} from './battlemaster.js';
import {canUseLuck} from './dark-ones-own-luck.js';
import {canFocus} from './fanatical-focus.js';
import {canIndomitable} from './indomitable.js';
import {canDisciplinedSurvivor} from './disciplined-survivor.js';
import {sharedResilienceCandidates} from './shared-resilience.js';
import {canHoming} from './homing-strikes.js';
import {canPeerless} from './peerless-skill.js';
import {valorDefenders} from './combat-inspiration.js';
import {uncannyCandidates} from './uncanny-dodge.js';
import {chainResistanceCandidates} from './chain-investment.js';
import {defenseCandidates} from './superior-hunters-defense.js';
import {rebukeCandidates} from './elemental-rebuke.js';
import {linkedHpCards,isRollAdjustmentLocked} from './shared-activity-card.js';
import {shieldActivity} from './shield-reaction.js';
import {flashCandidates} from './flash-of-genius.js';
import {omenCandidates,omenDisabled,captureOmen} from './cosmic-omen.js';
import {canInspire} from './bardic-inspiration.js';
import {cuttingCandidates} from './cutting-words.js';
import {parryCandidate} from './parry.js';
import {deflectCandidates} from './deflect-attacks.js';
import {fieldCandidates} from './protective-field.js';
import {deflectCandidates as steelCandidates} from './steel-deflect.js';
const ID='ugmuls-5-5e-automation',stopped=new Set(),stopping=new Map(),finishing=new Map(),live=new WeakSet(),pendingReactions=new WeakMap();
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],values=v=>Array.from(v?.values?.()??v??[]);
const origin=c=>typeof c?.system?.origin==='string'?game.messages.get(c.system.origin.replace(/^ChatMessage\./,'')):c?.system?.origin;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export const reactiveEnabled=()=>game.settings.get(ID,'reactiveAutoApply')===true;
export function reactiveScope(card){
 let root=card;if(card?.type==='damage'||card?.type==='healing'){
  const explicit=flag(card,'damageAttackId');if(explicit)root=game.messages.get(explicit)??card;else root=origin(card)??card;
 }
 if(['save','check'].includes(root?.type)&&origin(root))root=origin(root);
 const tests=root?.type==='attack'?[root]:['save','check'].includes(root?.type)?[root]:[...values(root?.getAssociatedRolls?.('save')),...values(root?.getAssociatedRolls?.('check'))];
 if(['save','check'].includes(card?.type)&&!tests.some(t=>t.id===card.id))tests.push(card);
 const hp=root?.type==='attack'?linkedHpCards(root):[...values(root?.getAssociatedRolls?.('damage')),...values(root?.getAssociatedRolls?.('healing'))];
 return {root,tests,hp:[...new Map([...hp,...(['damage','healing'].includes(card?.type)?[card]:[])].map(c=>[c.id,c])).values()].filter(c=>!flag(c,'masteryGrazeUndone')&&(!flag(c,'masteryGraze')||root?.type!=='attack'||values(root.system?.evaluatedTargets).some(t=>t.token===(flag(c,'masteryGrazeTarget')??c.system?.targets?.[0]?.token)&&t.isMiss===true)))};
}
function shieldOffered(card){
 if(game.settings.get(ID,'showShieldReaction')!==true||card.type!=='attack'||isRollAdjustmentLocked(card)||card.isContentVisible===false)return false;
 const hits=new Set(values(card.system?.evaluatedTargets).filter(t=>t.isMiss===false).map(t=>t.token));
 return values(card.system?.targets).some(t=>{if(!hits.has(t.token))return false;let token;try{token=fromUuidSync(t.token,{strict:false});}catch{return false;}return !!shieldActivity(token?.actor);});
}
export function availableReactions(card){
 const {tests,hp}=reactiveScope(card),found=new Set();
 for(const test of tests){
  if(canSeek(test,game.user))found.add('Seeking Spell');if(canPrecision(test,game.user))found.add('Precision Attack');if(valorDefenders(test,game.user).length)found.add('Combat Inspiration AC');if(uncannyCandidates(test,game.user).length)found.add('Uncanny Dodge');if(rebukeCandidates(test,game.user).length)found.add('Elemental Rebuke');
  if(shieldOffered(test))found.add('Shield');if(steelCandidates(test,game.user).length)found.add('Deflect Attack');
  for(let index=0;index<(test.rolls?.length??0);index++){
   if(canUseLuck(test,game.user,index))found.add('Dark One’s Own Luck');if(canFocus(test,game.user,index))found.add('Fanatical Focus');if(canIndomitable(test,game.user,index))found.add('Indomitable');if(canDisciplinedSurvivor(test,game.user,index))found.add('Disciplined Survivor');if(sharedResilienceCandidates(test,game.user,index).length)found.add('Shared Resilience');if(canHoming(test,game.user,index))found.add('Homing Strikes');if(canPeerless(test,game.user,index))found.add('Peerless Skill');
   if(flashCandidates(test,game.user,index).length)found.add('Flash of Genius');
   if(omenCandidates(test,index,game.user).some(e=>!omenDisabled(test,e,index)))found.add('Cosmic Omen');
   if(canInspire(test,game.user,index))found.add('Bardic Inspiration');
   if(cuttingCandidates(test,game.user,index).length)found.add('Cutting Words');
  }
 }
 for(const damage of hp){
  if(damage.type!=='damage')continue;if(beguilingCandidates(damage,game.user).length)found.add('Beguiling Defenses');if(canEmpower(damage,game.user))found.add('Empowered Spell');if(uncannyCandidates(damage,game.user).length)found.add('Uncanny Dodge');if(chainResistanceCandidates(damage,game.user).length)found.add('Investment Resistance');if(defenseCandidates(damage,game.user).length)found.add('Superior Hunter’s Defense');if(rebukeCandidates(damage,game.user).length)found.add('Elemental Rebuke');if(parryCandidate(damage,game.user))found.add('Parry');if(deflectCandidates(damage,game.user).length)found.add('Deflect Attacks');if(fieldCandidates(damage,game.user).length)found.add('Protective Field');
  for(let index=0;index<(damage.rolls?.length??0);index++)if(cuttingCandidates(damage,game.user,index).length)found.add('Cutting Words');
 }
 return [...found];
}
export function reactiveDamageRollPending(card){
 const {root,hp}=reactiveScope(card),activity=root?.getAssociatedActivity?.({scaled:true});
 const expectsDamage=(activity?.damage?.parts?.length??0)>0||activity?.damage?.includeBase&&activity.item?.system?.offersBaseDamage&&!!activity.item.system.damage.base?.formula;
 return hp.some(c=>c.type==='damage'&&(flag(c,'pendingDamage')||!c.rolls?.length))||!!expectsDamage&&!hp.some(c=>c.type==='damage');
}
export async function stopForReactions(card){
 if(!authority()||!reactiveEnabled()||card?.type==='healing')return false;const {root}=reactiveScope(card);if(!root||flag(root,'manualDamageWorkflow')||flag(origin(root),'manualDamageWorkflow'))return false;
 if(stopped.has(root.id)||flag(root,'reactiveAutomationStopped'))return true;
 for(const test of reactiveScope(card).tests)if(live.has(test))await captureOmen(test);
 const reasons=availableReactions(card);if(!reasons.length)return reactiveDamageRollPending(card);
 // A terminal stop, not a waiting task. Later ordinary renders return here
 // without more reaction/range checks. Only explicit completion can restart it.
 stopped.add(root.id);const write=root.setFlag(ID,'reactiveAutomationStopped',true);stopping.set(root.id,write);try{await write;}finally{if(stopping.get(root.id)===write)stopping.delete(root.id);}return true;
}
export function reactionCompleted(card){
 if(!authority()||!reactiveEnabled()||!card)return Promise.resolve();const {root}=reactiveScope(card);if(!root)return Promise.resolve();if(finishing.has(root.id))return finishing.get(root.id);
 const task=(async()=>{await stopping.get(root.id);if(flag(root,'manualDamageWorkflow')||flag(origin(root),'manualDamageWorkflow'))return;stopped.delete(root.id);if(flag(root,'reactiveAutomationStopped'))await root.setFlag(ID,'reactiveAutomationStopped',false);globalThis.Ugmuls55eAutomationNpcDamage?.resumeReactive?.(card);})().finally(()=>finishing.delete(root.id));finishing.set(root.id,task);return task;
}
const changed=(changes,key)=>Object.hasOwn(changes??{},'flags.'+ID+'.'+key)||Object.hasOwn(changes?.flags?.[ID]??{},key)||Object.hasOwn(changes??{},'flags.'+ID+'.-='+key)||Object.hasOwn(changes?.flags?.[ID]??{},'-='+key);
function completedChange(card,changes){
 if(changed(changes,'battleManeuver')&&flag(card,'battleManeuver')?.key==='precision')return true;
 if(card.type==='damage'&&changed(changes,'beguilingDefenses')&&Object.values(flag(card,'beguilingDefenses')??{}).some(r=>r.save&&r.taken===null))return true;
 if(card.type==='damage'&&changed(changes,'empoweredSpellSettled')&&flag(card,'empoweredSpellSettled'))return true;
 if(['shieldReactionSettled','flashOfGenius','cosmicOmenUsed','bardicUsed','cuttingWords','parry','seekingSpellUsed','darkOnesOwnLuck','fanaticalFocus','indomitable','disciplinedSurvivor','sharedResilience','homingStrikes','peerlessSkill','valorDefense','uncannyDodges','chainResistance','superiorHunterDefense','elementalRebukes'].some(k=>changed(changes,k)&&flag(card,k)))return true;
 let pending=pendingReactions.get(card);if(!pending)pendingReactions.set(card,pending=new Map());let completed=false;
 for(const [key,record]of [['steelDeflectAdjusting','steelDeflections'],['deflectPending','protectiveFields'],['protectiveFieldPending','protectiveFields']]){
  if(!changed(changes,key))continue;const signature=JSON.stringify(flag(card,record)??null);if(flag(card,key))pending.set(key,signature);else if(pending.has(key)){if(pending.get(key)!==signature)completed=true;pending.delete(key);}
 }
 return completed;
}
export function isReactiveControl(node){return !!node?.closest?.('[data-rsa-shield],.rsa-flash-actions,.rsa-cosmic-omen,.rsa-bardic-actions,.rsa-cutting-actions,[data-rsa-parry],.rsa-deflect-actions,.rsa-protective-field,.rsa-steel-deflect,.rsa-deflect,[data-rsa-empowered],[data-rsa-seeking],[data-rsa-precision],.rsa-own-luck-actions,.rsa-focus-actions,.rsa-indomitable,.rsa-disciplinedSurvivor,.rsa-shared-resilience,.rsa-homing-actions,.rsa-peerless-actions,.rsa-valor-actions,.rsa-uncanny-actions,.rsa-chain-resistance,.rsa-superior-defense,.rsa-rebuke-actions,.rsa-beguiling');}
Hooks.once('init',()=>game.settings.register(ID,'reactiveAutoApply',{name:'Automate Damage and Effects with Reactive Logic',hint:'Use the existing auto-apply options, but end that automation attempt when a supported roll/reaction adjustment is available. No polling or reaction timeout. Completing an adjustment checks that card again; otherwise the GM can apply damage and its eligible hit/save effects manually. Undo remains manual.',scope:'world',config:true,type:Boolean,default:false}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationReactive={enabled:reactiveEnabled,stop:stopForReactions,completed:reactionCompleted,isControl:isReactiveControl};
 Hooks.on('createChatMessage',card=>{if(!authority()||!reactiveEnabled())return;live.add(card);if(['autoApplyCardDamage','autoApplySavedEffects','autoApplyHitEffects'].some(k=>game.settings.get(ID,k)===true)&&['attack','save','damage'].includes(card.type)){
  // Prime a stop immediately, before the normal short auto-apply scheduling
  // window. Capture Omen once on player-created cards before checking it.
  const probe=async()=>{await captureOmen(card);await stopForReactions(card);};probe().catch(console.error);
 }});
 Hooks.on('updateChatMessage',(card,changes)=>{if(!authority()||!reactiveEnabled())return;if(completedChange(card,changes)){reactionCompleted(card).catch(console.error);return;}if(live.has(card)&&(changed(changes,'cosmicOmenSnapshot')||Object.hasOwn(changes??{},'rolls'))&&!flag(card,'pendingDamage'))stopForReactions(card).catch(console.error);});
 Hooks.on('deleteChatMessage',card=>stopped.delete(card.id));
});
