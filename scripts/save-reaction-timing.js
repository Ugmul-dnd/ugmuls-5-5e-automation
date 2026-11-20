// Timing: outcome / save-fail. Each recorded player save versus an NPC.
// Presentation is staged; native feature scripts own spending and roll changes.
import {flashCandidates} from './flash-of-genius.js';
import {canIndomitable} from './indomitable.js';
import {failureState} from './bardic-inspiration.js';
const ID='ugmuls-5-5e-automation',declarations=new Map(),prompting=new Set(),adjustments=new Map(),settlingSources=new Map(),settleAgain=new Set(),groupResolutions=new Map(),newSaves=new WeakSet(),creationTasks=new WeakMap(),creationSettled=new WeakSet();
const flag=(c,k)=>c?.getFlag?.(ID,k);
export const saveSource=card=>card?.type==='usage'?card:typeof card?.system?.origin==='string'?game.messages.get(card.system.origin.replace(/^ChatMessage\./,'')):card?.system?.origin;
const held=card=>['pending','revealing'].includes(flag(card,'reactionTimingWindow')?.status);
export const SPELL_DECLARATION_STAGE=Object.freeze({stage:'declaring-spell',trigger:'spell-declared',get mapped(){return declarations.size>0;},templateBoundary:'before-native-placement'});
export function mapSpellDeclaration(key,handler){if(typeof handler!=='function')throw Error('A declaration handler is required.');declarations.set(key,handler);return ()=>declarations.delete(key);}
export async function declareSpell(activity,usage,dialog,message){
 if(activity?.item?.type!=='spell'||!declarations.size)return true;
 // This gate runs before native use/consumption/template placement. Adapters
 // receive the actual activity and configuration; no target/template guessing.
 for(const handler of declarations.values())if(await handler({stage:SPELL_DECLARATION_STAGE,activity,usage,dialog,message})===false)return false;
 return true;
}
export function saveWorkflowSource(source){
 return game.settings.get(ID,'reactionTimingPilot')===true&&!!game.users.activeGM&&source?.type==='usage'&&source.isContentVisible!==false&&source.getAssociatedActivity?.()?.type==='save'&&!flag(source,'regionPlacementOnly')&&!flag(source,'movementRegionPlacement');
}
export function savePilotSource(source){
 if(!saveWorkflowSource(source))return false;
 const caster=source.getAssociatedActor?.()??source.getAssociatedActivity?.()?.actor;
 return caster?.type==='npc'&&(source.system?.targets??[]).some(t=>{const target=globalThis.fromUuidSync?.(t.token,{strict:false})?.actor;return target&&(target.type==='character'||target.hasPlayerOwner===true);});
}
export function failedSaveChoices(card,user=game.users.activeGM){
 if(card?.type!=='save'||card.rolls?.length!==1||!saveWorkflowSource(saveSource(card)))return [];
 const source=saveSource(card);
 const actor=card.getAssociatedActor?.(),token=card.getAssociatedToken?.();
 if(!actor)return [];
 const target=source.system.targets.find(t=>token?(token.document??token).uuid===t.token:globalThis.fromUuidSync?.(t.token,{strict:false})?.actor?.uuid===actor.uuid);
 if(!target||actor.uuid!==globalThis.fromUuidSync?.(target.token,{strict:false})?.actor?.uuid)return [];
 const failedPilot=failureState(card,0)==='failed'&&savePilotSource(source)&&(actor.type==='character'||actor.hasPlayerOwner===true);
 const entries=(failedPilot?flashCandidates(card,user,0):[]).map(e=>({feature:'flashOfGenius',actor:e.actor.uuid,index:0}));
 if(failedPilot&&globalThis.Ugmuls55eAutomationBardic?.canInspire(card,user,0))entries.push({feature:'bardic',actor:actor.uuid,index:0});
 if(failedPilot&&canIndomitable(card,user,0))entries.push({feature:'indomitable',actor:actor.uuid,index:0});
 for(const e of globalThis.Ugmuls55eAutomationBendLuck?.candidates?.(card,0,user)??[])if(!globalThis.Ugmuls55eAutomationBendLuck.disabled?.(card))entries.push({feature:'bendLuck',actor:e.actor.uuid,index:0});
 for(const e of globalThis.Ugmuls55eAutomationCosmicOmenTiming?.candidates?.(card,0,user)??[])if(!globalThis.Ugmuls55eAutomationCosmicOmenTiming.disabled?.(card,e,0))entries.push({feature:'cosmicOmen',actor:e.actor.uuid,index:0});
 if(failureState(card,0)==='failed'&&globalThis.Ugmuls55eAutomationFanaticalFocus?.canFocus?.(card,user,0))entries.push({feature:'fanaticalFocus',actor:actor.uuid,index:0});
 if(failureState(card,0)==='failed'&&globalThis.Ugmuls55eAutomationDisciplinedSurvivor?.canUse?.(card,user,0))entries.push({feature:'disciplinedSurvivor',actor:actor.uuid,index:0});
 if(failureState(card,0)==='failed')for(const e of globalThis.Ugmuls55eAutomationSharedResilience?.candidates?.(card,user,0)??[])entries.push({feature:'sharedResilience',actor:e.actor.uuid,index:0});
 if(failureState(card,0)==='failed')for(const e of globalThis.Ugmuls55eAutomationCountercharm?.candidates?.(card,user,0)??[])entries.push({feature:'countercharm',actor:e.actor.uuid,index:0});
 if(failureState(card,0)==='failed'&&globalThis.Ugmuls55eAutomationMageSlayer?.canGuard?.(card,user))entries.push({feature:'mageSlayer',actor:actor.uuid,index:0});
 if(failureState(card,0)==='failed'&&globalThis.Ugmuls55eAutomationOwnLuck?.canUse?.(card,user,0))entries.push({feature:'ownLuck',actor:actor.uuid,index:0});
 return entries.filter(e=>!globalThis.Ugmuls55eAutomationReactionTiming?.declined?.(card,e.actor));
}
// New saves are revalidated once by the active GM after creation. The rolling
// client may not yet have resolved the actor/source during preCreate.
export function captureCreatedSaveTiming(card){
 if(card?.type!=='save'||!newSaves.has(card)||!game.user?.isGM||game.users.activeGM?.id!==game.user.id)return Promise.resolve();
 if(creationTasks.has(card))return creationTasks.get(card);
 const job=Promise.resolve().then(async()=>{
  if(flag(card,'reactionTimingWindow'))return;
  const choices=failedSaveChoices(card);if(!choices.length)return;
  await card.setFlag(ID,'reactionTimingWindow',saveWindow(card,choices));
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
 }).then(()=>{creationSettled.add(card);});creationTasks.set(card,job);return job;
}
function saveWindow(card,choices){return {id:foundry.utils.randomID(),feature:'failedSave',stage:'outcome',window:'after-save-fail-before-resolution',status:'pending',actors:[...new Set(choices.map(c=>c.actor))],choices,skip:card.getFlag?.('dice-so-nice','skip')===true};}
export function prepareSaveTiming(card){
 const choices=failedSaveChoices(card);if(!choices.length)return;
 card.updateSource({['flags.'+ID+'.reactionTimingWindow']:saveWindow(card,choices)});
}
export function saveDamageBlocked(source){
 if(!saveWorkflowSource(source))return false;
 if(flag(source,'targetsConfirmationPending')||flag(source,'targetsConfirmationCanceled'))return true;
 const targets=source.system?.targets??[];if(!targets.length)return false;
 const saves=Array.from(source.getAssociatedRolls?.('save')??[]);
 return !saves.length||saves.some(c=>creationTasks.has(c)&&!creationSettled.has(c)||held(c)||flag(c,'saveTimingAdjusting')||c._dice3danimating===true||!c.rolls?.length||c.rolls.some(r=>r._evaluated!==true))||!targets.every(t=>['success','failure'].includes(source.system.outcomes?.get(t.token)));
}
export function saveDamageSkipped(source){
 if(!saveWorkflowSource(source))return false;
 const activity=source.getAssociatedActivity?.({scaled:true});
 return source.system.targets.length>0&&activity?.damage?.onSave==='none'&&!globalThis.Ugmuls55eAutomationPotentCantrip?.eligible(activity)&&source.system.targets.every(t=>source.system.outcomes?.get(t.token)==='success');
}
export async function continueSaveDamage(card){
 const source=saveSource(card);if(source)await Promise.all([...new Set([card,...Array.from(source.getAssociatedRolls?.('save')??[])])].map(c=>creationTasks.get(c)).filter(Boolean));if(!saveWorkflowSource(source)||saveDamageBlocked(source)||saveDamageSkipped(source)||prompting.has(source.id))return;
 if(Array.from(source.getAssociatedRolls?.('damage')??[]).some(c=>c.rolls?.length)){
  // Region/shared cards may roll damage before the last save's animation.
  // Resume this usage on the active GM, retaining its per-target HP receipts.
  if(game.user.isGM&&game.users.activeGM?.id===game.user.id)globalThis.Ugmuls55eAutomationNpcDamage?.resumeReactive?.(source);
  return;
 }
 if(source.author?.id!==game.user.id)return;
 prompting.add(source.id);
 try{
  for(const save of source.getAssociatedRolls?.('save')??[]){
   await globalThis.Ugmuls55eAutomationDamage?.waitForAttackAnimation?.(save);
   if(game.user.isGM)await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(save);
  }
  if(saveDamageBlocked(source)||saveDamageSkipped(source))return;
  await globalThis.Ugmuls55eAutomationDamage?.promptDamage(source.getAssociatedActivity?.({scaled:true}),source);
 }
 finally{prompting.delete(source.id);}
}
export async function finishSaveReaction(card){
 if(flag(card,'reactionTimingWindow')?.feature!=='failedSave')return;
 if(!game.user?.isGM||game.users.activeGM?.id!==game.user.id)return;
 const source=saveSource(card);if(!source)return;
 if(settlingSources.has(source.id)){settleAgain.add(source.id);return settlingSources.get(source.id);}
 // Spending one Artificer's Reaction can remove Flash from several AOE saves.
 // Revalidate only this usage's recorded saves, closing exhausted opportunities
 // while retaining genuine choices (including another creature's Reaction).
 const task=(async()=>{
  do{
  settleAgain.delete(source.id);
  for(const save of source.getAssociatedRolls?.('save')??[]){
   if(flag(save,'reactionTimingWindow')?.feature!=='failedSave'||!held(save)||flag(save,'saveTimingAdjusting'))continue;
   if(failedSaveChoices(save).length){globalThis.Ugmuls55eAutomationChatRefresh?.card(save);continue;}
   await globalThis.Ugmuls55eAutomationReactionTiming?.revealSave(save);
  }
  }while(settleAgain.has(source.id));
  globalThis.Ugmuls55eAutomationChatRefresh?.card(source);
 })();settlingSources.set(source.id,task);
 try{await task;}finally{settlingSources.delete(source.id);settleAgain.delete(source.id);}
}
export async function runSaveReaction(card,feature,operation){
 if(flag(card,'reactionTimingWindow')?.feature!=='failedSave')return operation();
 if(!game.user?.isGM||game.users.activeGM?.id!==game.user.id||!held(card)||flag(card,'reactionTimingWindow')?.status!=='pending')throw Error('This saving throw decision is closed.');
 if(adjustments.has(card.id))throw Error('Another saving throw adjustment is resolving.');
 if(groupResolutions.has(saveSource(card)?.id))throw Error('The saving throw group is already continuing.');
 const job=(async()=>{
  await card.setFlag(ID,'saveTimingAdjusting',feature);
  try{return await operation();}
  finally{await card.setFlag(ID,'saveTimingAdjusting',false);}
 })();adjustments.set(card.id,job);
 try{const result=await job;await finishSaveReaction(card);return result;}
 finally{adjustments.delete(card.id);}
}
export function canResolveSaveGroup(source,user=game.user){
 return !!source&&user?.active===true&&source.isContentVisible!==false&&!!(user.isGM||source.author?.id===user.id||source.getAssociatedActor?.()?.testUserPermission?.(user,'OWNER'));
}
export async function resolveSaveGroup(card,user=game.user){
 const source=saveSource(card);
 if(!game.user?.isGM||game.users.activeGM?.id!==game.user.id||!canResolveSaveGroup(source,user))throw Error('This saving throw group is not yours to continue.');
 if(groupResolutions.has(source.id))return groupResolutions.get(source.id);
 const saves=Array.from(source.getAssociatedRolls?.('save')??[]);
 if(!source.system?.targets?.length||!source.system.targets.every(t=>['success','failure'].includes(source.system.outcomes?.get(t.token)))||saves.some(c=>c._dice3danimating||!c.rolls?.length||c.rolls.some(r=>!r._evaluated)))throw Error('Wait for all saving throws to finish.');
 if(saves.some(c=>flag(c,'saveTimingAdjusting')||adjustments.has(c.id)))throw Error('Wait for the saving throw adjustment to finish.');
 const task=(async()=>{
  for(const save of saves)if(flag(save,'reactionTimingWindow')?.feature==='failedSave'&&held(save))await globalThis.Ugmuls55eAutomationReactionTiming.revealSave(save,user);
 })();groupResolutions.set(source.id,task);
 try{await task;}finally{groupResolutions.delete(source.id);}
}
export function saveContinuationChanged(changes){
 if(!changes)return false;
 if(['rolls','system.origin','system.targets','system.forceSuccess','system.resisted'].some(k=>Object.hasOwn(changes,k)))return true;
 if(['origin','targets','forceSuccess','resisted'].some(k=>Object.hasOwn(changes.system??{},k)))return true;
 return ['reactionTimingWindow','saveTimingAdjusting','targetsConfirmationPending','targetsConfirmationCanceled','pendingCast'].some(k=>Object.hasOwn(changes,'flags.'+ID+'.'+k)||Object.hasOwn(changes.flags?.[ID]??{},k));
}
function scheduleSaveContinuation(card){
 if(!['usage','save'].includes(card.type))return;
 if(card.type==='save'&&newSaves.has(card))captureCreatedSaveTiming(card).catch(console.error);
 const source=saveSource(card);if(!saveWorkflowSource(source)||source?.author?.id!==game.user.id&&(!game.user.isGM||game.users.activeGM?.id!==game.user.id))return;
 setTimeout(()=>continueSaveDamage(card).catch(console.error),0);
}
Hooks.once('ready',()=>{
 Hooks.on('diceSoNiceRollComplete',id=>{
  const card=game.messages.get(id);if(card?.type!=='save')return;
  const source=saveSource(card);if(!saveWorkflowSource(source))return;
  globalThis.Ugmuls55eAutomationChatRefresh?.card(source);
  setTimeout(()=>continueSaveDamage(card).catch(console.error),0);
 });
 Hooks.on('createChatMessage',card=>{if(card.type==='save')newSaves.add(card);scheduleSaveContinuation(card);});
 // Flag-only history updates must not restart animation waits and prompts.
 Hooks.on('updateChatMessage',(card,changes)=>{if(saveContinuationChanged(changes))scheduleSaveContinuation(card);});
});
