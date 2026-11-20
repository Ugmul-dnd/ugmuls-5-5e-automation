import {prepareSaveTiming,failedSaveChoices,saveDamageBlocked,saveDamageSkipped,saveSource,finishSaveReaction,runSaveReaction,declareSpell,mapSpellDeclaration,canResolveSaveGroup,resolveSaveGroup} from './save-reaction-timing.js';
import {presentReactionButtons} from './reaction-button-presentation.js';
import {reductionChoices,reserveReduction,reductionAttack} from './staged-reductions.js';
import {createEventQueue,isRollAdjustmentLocked,linkedHpCards} from './shared-activity-card.js';
import {flareSnapshot,flareReady,flareCandidates} from './warding-flare.js';
import {parryCandidate} from './parry.js';
import {renderAttackSetup} from './unified-attack-card.js';
import {damageAnimationSignature} from './pending-damage.js';
import {shieldCastPlan,castShield,refreshShieldAttack} from './shield-reaction.js';
import {duelistSnapshot,duelistCandidates} from './defensive-duelist.js';

const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),revealing=new Map(),continuing=new Set(),shieldJobs=new Map(),shieldSettling=new Map(),attackAnimations=new Map();
const flag=(card,key)=>card?.getFlag?.(ID,key)??card?.flags?.[ID]?.[key];
const origin=card=>typeof card?.system?.origin==='string'?game.messages.get(card.system.origin.replace(/^ChatMessage\./,'')):card?.system?.origin;
const authority=()=>game.user?.isGM&&game.users.activeGM?.id===game.user.id;
// Canonical stages: declaring-attack, outcome (attack-hit/save-result), follow-up.
// Window IDs remain stable so recorded development cards survive reloads.
export const TIMING_STAGES=Object.freeze({declare:'declaring-attack',spell:'declaring-spell',outcome:'outcome',followUp:'follow-up'});
export const REACTION_TIMINGS=Object.freeze([
 Object.freeze({key:'counterspell',stage:TIMING_STAGES.spell,trigger:'spell-declared',feature:'Counterspell',card:'usage',window:'before-native-placement',continue:'cast-spell'}),
 Object.freeze({key:'failedSave',stage:TIMING_STAGES.outcome,trigger:'save-fail',feature:'Flash of Genius / Indomitable / Bardic Inspiration',card:'save',window:'after-save-fail-before-resolution',continue:'reveal-resolve-save'}),
 Object.freeze({key:'wardingFlare',stage:TIMING_STAGES.declare,trigger:'attack-declared',feature:'Warding Flare / Lucky / Deflect Attack / Restore Balance',card:'attack',window:'before-attack-reveal',continue:'reveal-or-roll-damage'}),
 Object.freeze({key:'unbreakableMajesty',stage:TIMING_STAGES.outcome,trigger:'attack-hit',feature:'Unbreakable Majesty',card:'attack',window:'mandatory-recoil-before-defenses',continue:'automatic'}),
 Object.freeze({key:'attackDefense',stage:TIMING_STAGES.outcome,trigger:'attack-hit-or-miss',feature:'Shield / Defensive Duelist / Combat Inspiration / Bardic Inspiration / Cutting Words / Parry / Deflect / Uncanny Dodge / Illusory Self / Instinctive Charm',card:'attack',window:'after-hit-before-dice-reveal',continue:'reveal-or-roll-damage'}),
 Object.freeze({key:'parry',stage:TIMING_STAGES.outcome,trigger:'attack-hit',feature:'Parry',card:'attack',window:'after-hit-before-dice-reveal',continue:'reserve-then-roll-damage'}),
 Object.freeze({key:'deflect',stage:TIMING_STAGES.outcome,trigger:'attack-hit',feature:'Deflect Attacks / Energy',card:'attack',window:'after-hit-before-dice-reveal',continue:'reserve-then-roll-damage'}),
 Object.freeze({key:'deferredReduction',stage:TIMING_STAGES.outcome,trigger:'selected-reduction',feature:'Reserved reduction',card:'damage',window:'resolving-selected-reduction',continue:'automatic'})
]);
// Planning catalog: only connected entries participate in staged windows.
// A planned row does not change its feature’s existing automation behavior.
export const FEATURE_TIMINGS=Object.freeze([
 {"key":"mirrorImage","feature":"Mirror Image","stage":"outcome","trigger":"attack-hit","script":"mirror-image.js","status":"connected"},
 {key:'counterspell',feature:'Counterspell',stage:'declaring-spell',trigger:'spell-declared',script:'counterspell.js',status:'connected'},
 {
  "key": "wardingFlare",
  "feature": "Warding Flare",
  "stage": "declaring-attack",
  "trigger": "attack-declared",
  "script": "warding-flare.js",
  "status": "connected"
 },
 {
  "key": "shield",
  "feature": "Shield",
  "stage": "outcome",
  "trigger": "attack-hit",
  "script": "shield-reaction.js",
  "status": "connected"
 },
 {
  "key": "defensiveDuelist",
  "feature": "Defensive Duelist",
  "stage": "outcome",
  "trigger": "attack-hit",
  "script": "defensive-duelist.js",
  "status": "connected"
 },
 {
  "key": "parry",
  "feature": "Parry",
  "stage": "outcome",
  "trigger": "damage-visible",
  "script": "parry.js",
  "status": "connected"
 },
 {
  "key": "deflect",
  "feature": "Deflect Attacks / Energy",
  "stage": "outcome",
  "trigger": "attack-hit",
  "script": "deflect-attacks.js",
  "status": "connected"
 },
 {
  "key": "illusorySelf",
  "feature": "Illusory Self",
  "stage": "outcome",
  "trigger": "attack-hit",
  "script": "illusory-self.js",
  "status": "connected"
 },
 {
  "key": "instinctiveCharm",
  "feature": "Instinctive Charm",
  "stage": "outcome",
  "trigger": "attack-hit",
  "script": "instinctive-charm.js",
  "status": "connected"
 },
 {
  "key": "unbreakableMajesty",
  "feature": "Unbreakable Majesty",
  "stage": "outcome",
  "trigger": "attack-hit",
  "script": "unbreakable-majesty.js",
  "status": "connected"
 },
 {
  "key": "uncanny",
  "feature": "Uncanny Dodge",
  "stage": "outcome",
  "trigger": "attack-hit",
  "script": "uncanny-dodge.js",
  "status": "connected"
 },
 {
  "key": "steelDeflect",
  "feature": "Steel Defender: Deflect Attack",
  "stage": "declaring-attack",
  "trigger": "attack-declared",
  "script": "steel-deflect.js",
  "status": "connected"
 },
 {
  "key": "valor",
  "feature": "Combat Inspiration",
  "stage": "outcome",
  "trigger": "attack-hit / damage-rider",
  "script": "combat-inspiration.js",
  "status": "connected"
 },
 {
  "key": "protectiveField",
  "feature": "Protective Field",
  "stage": "outcome",
  "trigger": "attack-hit",
  "script": "protective-field.js",
  "status": "connected"
 },
 {
  "key": "projectedWard",
  "feature": "Projected Ward",
  "stage": "outcome",
  "trigger": "attack-hit / save-damage",
  "script": "projected-ward.js",
  "status": "connected"
 },
 {
  "key": "songDefense",
  "feature": "Song of Defense",
  "stage": "outcome",
  "trigger": "damage-revealed-before-application",
  "script": "song-of-defense.js",
  "status": "connected"
 },
 {
  "key": "bastion",
  "feature": "Bastion of Law",
  "stage": "outcome",
  "trigger": "damage-revealed-before-application",
  "script": "bastion-of-law.js",
  "status": "connected"
 },
 {
  "key": "beguilingDefenses",
  "feature": "Beguiling Defenses",
  "stage": "outcome",
  "trigger": "attack-hit",
  "script": "beguiling-defenses.js",
  "status": "connected"
 },
 {
  "key": "chainInvestment",
  "feature": "Investment Resistance",
  "stage": "outcome",
  "trigger": "damage-visible",
  "script": "chain-investment.js",
  "status": "connected"
 },
 {
  "key": "superiorHunterDefense",
  "feature": "Superior Hunter’s Defense",
  "stage": "outcome",
  "trigger": "damage-visible",
  "script": "superior-hunters-defense.js",
  "status": "connected"
 },
 {
  "key": "sentinel",
  "feature": "Sentinel at Death’s Door",
  "stage": "outcome",
  "trigger": "attack-hit",
  "script": "sentinel-at-deaths-door.js",
  "status": "connected"
 },
 {
  "key": "precision",
  "feature": "Precision Attack",
  "stage": "outcome",
  "trigger": "attack-miss",
  "script": "battlemaster.js",
  "status": "connected"
 },
 {
  "key": "seeking",
  "feature": "Seeking Spell",
  "stage": "outcome",
  "trigger": "attack-miss",
  "script": "seeking-spell.js",
  "status": "connected"
 },
 {
  "key": "guidedStrike",
  "feature": "Guided Strike",
  "stage": "outcome",
  "trigger": "attack-miss",
  "script": "guided-strike.js",
  "status": "connected"
 },
 {
  "key": "homing",
  "feature": "Homing Strikes",
  "stage": "outcome",
  "trigger": "attack-miss",
  "script": "homing-strikes.js",
  "status": "planned"
 },
 {
  "key": "lucky",
  "feature": "Lucky",
  "stage": "declaring-attack",
  "trigger": "attack-declared",
  "script": "lucky.js",
  "status": "connected"
 },
 {
  "key": "flash",
  "feature": "Flash of Genius",
  "stage": "outcome",
  "trigger": "save-fail / check-fail",
  "script": "flash-of-genius.js",
  "status": "connected"
 },
 {
  "key": "focus",
  "feature": "Fanatical Focus",
  "stage": "outcome",
  "trigger": "save-fail",
  "script": "fanatical-focus.js",
  "status": "connected"
 },
 {
  "key": "indomitable",
  "feature": "Indomitable",
  "stage": "outcome",
  "trigger": "save-fail",
  "script": "indomitable.js",
  "status": "connected"
 },
 {
  "key": "disciplined",
  "feature": "Disciplined Survivor",
  "stage": "outcome",
  "trigger": "save-fail",
  "script": "disciplined-survivor.js",
  "status": "connected"
 },
 {
  "key": "sharedResilience",
  "feature": "Shared Resilience",
  "stage": "outcome",
  "trigger": "save-fail",
  "script": "shared-resilience.js",
  "status": "connected"
 },
 {
  "key": "countercharm",
  "feature": "Countercharm",
  "stage": "outcome",
  "trigger": "save-fail",
  "script": "countercharm.js",
  "status": "connected"
 },
 {
  "key": "mageSlayer",
  "feature": "Guarded Mind",
  "stage": "outcome",
  "trigger": "save-fail",
  "script": "mage-slayer.js",
  "status": "connected"
 },
 {
  "key": "ownLuck",
  "feature": "Dark One’s Own Luck",
  "stage": "outcome",
  "trigger": "save-fail / check-result",
  "script": "dark-ones-own-luck.js",
  "status": "connected"
 },
 {
  "key": "peerless",
  "feature": "Peerless Skill",
  "stage": "outcome",
  "trigger": "attack-miss / check-fail",
  "script": "peerless-skill.js",
  "status": "planned"
 },
 {
  "key": "bardic",
  "feature": "Bardic Inspiration",
  "stage": "outcome",
  "trigger": "attack-result / save-result / check-result",
  "script": "bardic-inspiration.js",
  "status": "connected"
 },
 {
  "key": "cutting",
  "feature": "Cutting Words",
  "stage": "outcome",
  "trigger": "attack-hit / damage-revealed-before-application",
  "script": "cutting-words.js",
  "status": "connected"
 },
 {
  "key": "balance",
  "feature": "Restore Balance",
  "stage": "declaring-attack",
  "trigger": "attack-declared / save-roll (legacy)",
  "script": "restore-balance.js",
  "status": "connected"
 },
 {
  "key": "bendLuck",
  "feature": "Bend Luck",
  "stage": "outcome",
  "trigger": "attack-roll / save-roll / check-roll",
  "script": "bend-luck.js",
  "status": "connected"
 },
 {
  "key": "omen",
  "feature": "Cosmic Omen",
  "stage": "outcome",
  "trigger": "attack-roll / save-roll / check-roll",
  "script": "cosmic-omen.js",
  "status": "connected"
 },
 {
  "key": "empowered",
  "feature": "Empowered Spell",
  "stage": "follow-up",
  "trigger": "damage-roll",
  "script": "empowered-spell.js",
  "status": "planned"
 },
 {
  "key": "handOfHarm",
  "feature": "Hand of Harm",
  "stage": "follow-up",
  "trigger": "damage-rider",
  "script": "hand-of-harm.js",
  "status": "planned"
 },
 {
  "key": "psiStrike",
  "feature": "Psionic Strike",
  "stage": "follow-up",
  "trigger": "damage-rider",
  "script": "psionic-strike.js",
  "status": "planned"
 },
 {
  "key": "rend",
  "feature": "Rend Mind",
  "stage": "follow-up",
  "trigger": "damage-rider",
  "script": "rend-mind.js",
  "status": "planned"
 },
 {
  "key": "stalker",
  "feature": "Stalker’s Flurry",
  "stage": "follow-up",
  "trigger": "attack-follow-up",
  "script": "stalkers-flurry.js",
  "status": "planned"
 },
 {
  "key": "hunterPrey",
  "feature": "Superior Hunter’s Prey",
  "stage": "follow-up",
  "trigger": "damage-follow-up",
  "script": "superior-hunters-prey.js",
  "status": "planned"
 },
 {
  "key": "rebuke",
  "feature": "Elemental Rebuke",
  "stage": "follow-up",
  "trigger": "damage-received",
  "script": "elemental-rebuke.js",
  "status": "planned"
 },
 {
  "key": "brutal",
  "feature": "Brutal Strike effects",
  "stage": "follow-up",
  "trigger": "hit-rider",
  "script": "brutal-strike.js",
  "status": "planned"
 },
 {
  "key": "deflectRedirect",
  "feature": "Deflect Redirect",
  "stage": "follow-up",
  "trigger": "zero-damage-deflect",
  "script": "deflect-attacks.js",
  "status": "planned"
 }
].map(Object.freeze));
export const timingEnabled=()=>game.settings.get(ID,'reactionTimingPilot')===true;
export const timingState=card=>flag(card,'reactionTimingWindow');
// Recorded windows survive reloads and setting changes until explicitly resolved.
export const timingHeld=card=>['pending','revealing'].includes(timingState(card)?.status);
export function timingDeclined(card,actor){
 const state=timingState(card)??timingState(reductionAttack(card));
 return state?.declinedActors?.includes(typeof actor==='string'?actor:actor?.uuid)===true;
}
function decisionActors(card){
 const state=timingState(card);if(state?.status!=='pending')return [];
 let actors=[];
 if(state.feature==='wardingFlare')actors=declarationChoices(card).map(e=>e.actor);
 else if(state.feature==='attackDefense')actors=defenseSnapshot(card).filter(e=>state.defenses?.some(s=>s.actor===e.actor&&s.feature===e.feature&&s.token===e.token)).map(e=>e.actor);
 else if(state.feature==='failedSave')actors=failedSaveChoices(card).map(e=>e.actor);
 else if(state.feature==='parry'){const c=parryCandidate(card,game.users.activeGM);if(c)actors=[c.actor];}
 const resolved=actors.map(a=>typeof a==='string'?globalThis.fromUuidSync?.(a,{strict:false}):a).filter(a=>a?.uuid&&!timingDeclined(card,a));
 return [...new Map(resolved.map(a=>[a.uuid,a])).values()];
}
function declineCards(card){return card.type==='save'?Array.from(saveSource(card)?.getAssociatedRolls?.('save')??[]):[card];}
function decisionVisible(card,user){return user?.active&&card.isContentVisible!==false&&(user.isGM||!card.blind&&(!card.whisper?.length||card.author?.id===user.id||card.whisper.some(w=>(w.id??w)===user.id)));}
export function attackReactionBusy(card){return !!(flag(card,'cuttingAdjusting')||flag(card,'mirrorImageAdjusting')||flag(card,'cosmicOmenAdjusting')||flag(card,'bendLuckAdjusting')||flag(card,'guidedStrikeAdjusting')||flag(card,'seekingAdjusting')||flag(card,'precisionAdjusting')||flag(card,'bardicAdjusting')||flag(card,'valorAdjusting')||flag(card,'beguilingAdjusting')||flag(card,'uncannyAdjusting')||flag(card,'restoreBalanceAdjusting')||flag(card,'steelDeflectAdjusting')||flag(card,'luckyAdjusting')||flag(card,'illusorySelfAdjusting')||['starting','save','retarget','retargeting'].includes(flag(card,'instinctiveCharm')?.phase));}
export function canDeclineTiming(card,user=game.user){
 if(!decisionVisible(card,user))return false;
 return declineCards(card).some(c=>decisionVisible(c,user)&&decisionActors(c).some(a=>user.isGM||a.testUserPermission?.(user,'OWNER')));
}
export async function declineTiming(card,user=game.user){
 if(!authority()||!canDeclineTiming(card,user))throw Error('There are no pending reactions owned by this player.');
 const changed=await enqueue(async()=>{
  if(!canDeclineTiming(card,user)||game.messages.get(card.id)!==card)throw Error('This reaction decision has changed.');
  const cards=declineCards(card);
  if(cards.some(c=>flag(c,'saveTimingAdjusting')||flag(c,'cuttingAdjusting')||flag(c,'mirrorImageAdjusting')||flag(c,'cosmicOmenAdjusting')||flag(c,'bendLuckAdjusting')||flag(c,'guidedStrikeAdjusting')||flag(c,'seekingAdjusting')||flag(c,'precisionAdjusting')||flag(c,'bardicAdjusting')||flag(c,'valorAdjusting')||flag(c,'beguilingAdjusting')||flag(c,'uncannyAdjusting')||flag(c,'restoreBalanceAdjusting')||flag(c,'steelDeflectAdjusting')||flag(c,'luckyAdjusting')||flag(c,'illusorySelfAdjusting')||['starting','save','retarget','retargeting'].includes(flag(c,'instinctiveCharm')?.phase)||flag(c,'wardingFlareAdjusting')||flag(c,'duelistAdjusting')||flag(c,'shieldTimingPending')||flag(c,'parryAdjusting')))throw Error('Wait for the reaction to finish.');
  const changed=[];
  for(const c of cards){
   if(!decisionVisible(c,user)||isRollAdjustmentLocked(c))continue;
   const actors=decisionActors(c).filter(a=>user.isGM||a.testUserPermission?.(user,'OWNER')).map(a=>a.uuid);if(!actors.length)continue;
   const state=timingState(c);await c.setFlag(ID,'reactionTimingWindow',{...state,declinedActors:[...new Set([...(state.declinedActors??[]),...actors])]});changed.push(c);
  }
  return changed;
 });
 for(const c of changed)refreshing(c);
 // Leave other creatures' choices available. Only the last decline advances;
 // advancing never spends a resource or marks the creature's Reaction used.
 if(card.type==='save')await finishSaveReaction(card);
 else if(timingState(card)?.status==='pending'&&!decisionActors(card).length)await revealTiming(card,game.user);
}
export function timingClosed(card,feature){
 const state=timingState(card);if(!state){const attack=reductionAttack(card);const choice=flag(attack,'selectedReduction');return !!(attack&&attack!==card&&timingClosed(attack,feature)&&!(choice?.status==='reserved'&&choice.feature===feature));}
 if(state.closedFeatures?.includes(feature))return true;
 // Final continuation closes the entire attack opportunity, including defenses
 // that were unavailable at the time. Later turn/resource resets cannot add one.
 if(['revealing','revealed'].includes(state.status)&&card.type==='attack'&&['wardingFlare','lucky','steelDeflect','restoreBalance','illusorySelf','instinctiveCharm','sentinelDeath','projectedWard','protectiveField','cutting','mirrorImage','cosmicOmen','bendLuck','guidedStrike','seeking','precision','bardic','valor','uncanny','beguilingDefenses','shield','defensiveDuelist','parry','deflect'].includes(feature))return true;
 if(['revealing','revealed'].includes(state.status)&&state.feature==='deferredReduction'&&['parry','deflect'].includes(feature))return true;
 const matches=state.feature===feature||state.feature==='failedSave'&&['flashOfGenius','indomitable','bardic','bendLuck','cosmicOmen','fanaticalFocus','disciplinedSurvivor','sharedResilience','countercharm','mageSlayer','ownLuck'].includes(feature)||state.feature==='attackDefense'&&['shield','defensiveDuelist','parry','deflect','illusorySelf','instinctiveCharm','uncanny','beguilingDefenses','mirrorImage','cosmicOmen','bendLuck','guidedStrike','seeking','precision','bardic','valor','cutting','protectiveField','projectedWard','sentinelDeath'].includes(feature);
 return matches&&['revealing','revealed'].includes(state.status);
}
export function defenseWindow(card){return timingHeld(card)&&['attackDefense','unbreakableMajesty'].includes(timingState(card)?.feature);}
export function defenseAllowed(card,feature,token){
 if(timingClosed(card,feature))return false;
 if(!timingHeld(card))return true;
 return defenseWindow(card)&&timingState(card)?.status==='pending'&&timingState(card).defenses?.some(e=>e.feature===feature&&e.token===token&&!timingDeclined(card,e.actor))===true;
}
// Script-owned adapters reuse feature eligibility/spending; this is not an
// editable reaction rules engine. Snapshots are captured only on new attacks.
const mappedAttacks=[
 {key:'songDefense',stage:'capture-only',api:'Ugmuls55eAutomationSongDefense',snapshot:'songDefenseSnapshot'},
 {key:'sentinelDeath',stage:'capture-only',api:'Ugmuls55eAutomationSentinel',snapshot:'sentinelSnapshot'},
 {key:'projectedWard',stage:'capture-only',api:'Ugmuls55eAutomationProjectedWard',snapshot:'projectedWardSnapshot'},
 {key:'protectiveField',stage:'capture-only',api:'Ugmuls55eAutomationProtectiveField',snapshot:'protectiveFieldSnapshot'},
 {key:'cutting',stage:'outcome',api:'Ugmuls55eAutomationCutting',snapshot:'cuttingSnapshot'},
 {key:'mirrorImage',stage:'outcome',api:'Ugmuls55eAutomationMirrorImage',snapshot:'mirrorImageSnapshot'},
 {key:'cosmicOmen',stage:'outcome',api:'Ugmuls55eAutomationCosmicOmenTiming',snapshot:'cosmicOmenSnapshot',candidateMethod:'attackCandidates'},
 {key:'bendLuck',stage:'outcome',api:'Ugmuls55eAutomationBendLuck',snapshot:'bendLuckSnapshot',candidateMethod:'attackCandidates'},
 {key:'guidedStrike',stage:'outcome',api:'Ugmuls55eAutomationGuidedStrike',snapshot:'guidedStrikeSnapshot'},
 {key:'seeking',stage:'outcome',api:'Ugmuls55eAutomationSeekingSpellTiming',snapshot:'seekingTimingSnapshot'},
 {key:'precision',stage:'outcome',api:'Ugmuls55eAutomationBattleMasterPrecision',snapshot:'precisionSnapshot'},
 {key:'bardic',stage:'outcome',api:'Ugmuls55eAutomationBardic',snapshot:'bardicTimingSnapshot'},
 {key:'valor',stage:'outcome',api:'Ugmuls55eAutomationValor',snapshot:'valorTimingSnapshot'},
 {key:'beguilingDefenses',stage:'outcome',api:'Ugmuls55eAutomationBeguilingDefenses',snapshot:'beguilingSnapshot'},
 {key:'uncanny',stage:'outcome',api:'Ugmuls55eAutomationUncanny',snapshot:'uncannySnapshot'},
 {key:'restoreBalance',stage:'declaring-attack',api:'Ugmuls55eAutomationBalance',snapshot:'restoreBalanceSnapshot'},
 {key:'lucky',stage:'declaring-attack',api:'Ugmuls55eAutomationLucky',snapshot:'luckySnapshot'},
 {key:'steelDeflect',stage:'declaring-attack',api:'Ugmuls55eAutomationSteelDeflect',snapshot:'steelDeflectTiming'},
 {key:'illusorySelf',stage:'outcome',api:'Ugmuls55eAutomationIllusorySelf',snapshot:'illusorySelfSnapshot'},
 {key:'instinctiveCharm',stage:'outcome',api:'Ugmuls55eAutomationInstinctiveCharm',snapshot:'instinctiveCharmSnapshot'}
];
export function mappedAttackChoices(card,stage,{prepare=false}={}){
 const choices=[];
 for(const adapter of mappedAttacks){
  if(adapter.stage!==stage&&!(prepare&&stage==='outcome'&&adapter.stage==='capture-only'))continue;const api=globalThis[adapter.api];if(!api?.candidates||!api.snapshot)continue;
  let snapshot=flag(card,adapter.snapshot);
  if(snapshot===undefined&&prepare){snapshot=api.snapshot(card);if(snapshot)card.updateSource({['flags.'+ID+'.'+adapter.snapshot]:snapshot});}
  if(!snapshot?.entries?.length)continue;
  if(adapter.stage==='capture-only')continue;
  for(const entry of (api[adapter.candidateMethod??'candidates'])(card,game.users.activeGM)){
   const actor=entry.actor?.uuid,token=typeof entry.token==='string'?entry.token:entry.token?.uuid;
   if(actor&&token&&snapshot.entries.some(e=>e.actor===actor&&e.token===token&&(!e.feature||e.feature===entry.feature?.uuid)))choices.push({feature:adapter.key,actor,token});
  }
 }
 return choices;
}
export function declarationChoices(card){
 return [...flareCandidates(card,game.users.activeGM).map(e=>({feature:'wardingFlare',actor:e.actor.uuid,token:e.token})),...mappedAttackChoices(card,'declaring-attack')];
}
export function attackChoiceAllowed(card,feature,actor,token){
 if(timingClosed(card,feature))return false;if(!timingHeld(card))return true;
 const state=timingState(card);if(state.status!=='pending'||timingDeclined(card,actor))return false;
 const choices=state.feature==='wardingFlare'?state.declarations:state.feature==='attackDefense'?state.defenses:null;
 return choices?.some(e=>e.feature===feature&&e.actor===actor&&e.token===token)===true;
}
export function defenseSnapshot(card){
 if(globalThis.Ugmuls55eAutomationMirrorImage?.intercepted?.(card))return [];
 if(card?.type!=='attack'||card.rolls?.length!==1||!card.rolls[0]?._evaluated||card.system?.targets?.length!==1||!card.system.evaluatedTargets?.length)return [];
 const hasHit=card.system.evaluatedTargets.some(t=>t.isMiss===false),entries=[],target=card.system.targets[0],token=fromUuidSync(target.token,{strict:false}),actor=token?.actor;
 if(hasHit&&card.rolls[0].isCritical!==true&&actor&&game.settings.get(ID,'showShieldReaction')===true&&shieldCastPlan(actor))entries.push({feature:'shield',actor:actor.uuid,token:target.token});
 // Eligibility is independent of how much AC would be needed to turn the hit
 // into a miss. Never use that comparison to decide whether the window exists.
 const snapshot=flag(card,'duelistSnapshot')??duelistSnapshot(card);
 if(hasHit&&card.rolls[0].isCritical!==true&&snapshot?.entries)for(const entry of snapshot.entries){
  const preview=Object.create(card);Object.defineProperty(preview,'getFlag',{value:(scope,key)=>scope===ID&&key==='duelistSnapshot'?snapshot:card.getFlag?.(scope,key)});
  if(duelistCandidates(preview,game.users.activeGM).some(e=>e.token===entry.token))entries.push({feature:'defensiveDuelist',actor:entry.actor,token:entry.token});
 }
 entries.push(...mappedAttackChoices(card,'outcome'));
 entries.push(...reductionChoices(card).map(({feature,actor,token})=>({feature,actor,token})));
 return entries;
}
export function timingDamageBlocked(data){
 const explicit=data?.flags?.[ID]?.damageAttackId;
 if(explicit)return timingHeld(game.messages.get(explicit));
 const source=typeof data?.system?.origin==='string'?game.messages.get(data.system.origin.replace(/^ChatMessage\./,'')):data?.system?.origin;
 if(saveDamageBlocked(source))return true;
 if(source?.type==='attack')return timingHeld(source);
 const attacks=Array.from(source?.getAssociatedRolls?.('attack')??[]);
 return attacks.length===1&&timingHeld(attacks[0]);
}
export function timingBlocked(card){
 if(timingHeld(card))return true;
 const source=card?.type==='usage'?card:origin(card);
 if(source&&saveDamageBlocked(source))return true;
 if(source&&Array.from(source.getAssociatedRolls?.('save')??[]).some(timingHeld))return true;
 if(card?.type==='attack'&&linkedHpCards(card).some(timingHeld))return true;
 if(card?.type==='usage')return [...(card.getAssociatedRolls?.('attack')??[]),...(card.getAssociatedRolls?.('damage')??[])].some(timingHeld);
 const attack=game.messages.get(flag(card,'damageAttackId'))??origin(card);
 return timingHeld(attack);
}
function stateFor(card,feature,actors){return {id:foundry.utils.randomID(),feature,stage:REACTION_TIMINGS.find(entry=>entry.key===feature)?.stage,window:REACTION_TIMINGS.find(entry=>entry.key===feature)?.window,status:'pending',actors,skip:card.getFlag?.('dice-so-nice','skip')===true};}
// Mandatory first-hit interception precedes optional Reaction spending. Only
// new attacks or an already-held declaration window call this snapshot helper.
function prepareMajesty(card){
 const api=globalThis.Ugmuls55eAutomationUnbreakable;if(!api?.snapshot)return false;
 if(flag(card,'unbreakableSnapshot')===undefined){const snapshot=api.snapshot(card);if(snapshot)card.updateSource({['flags.'+ID+'.unbreakableSnapshot']:snapshot});}
 return !!flag(card,'unbreakableSnapshot')?.entry&&!['passed','failed','skipped'].includes(flag(card,'unbreakableRecoil')?.phase);
}
export function prepareTiming(card){
 if(!timingEnabled()||!game.users.activeGM||timingState(card)||card.isContentVisible===false)return;
 if(card.type==='save'){prepareSaveTiming(card);return;}
 if(card.type==='attack'){
  mappedAttackChoices(card,'declaring-attack',{prepare:true});mappedAttackChoices(card,'outcome',{prepare:true});
  const snapshot=flareSnapshot(card),duelist=duelistSnapshot(card);
  if(duelist)card.updateSource({['flags.'+ID+'.duelistSnapshot']:duelist});
  if(snapshot)card.updateSource({['flags.'+ID+'.wardingFlareSnapshot']:snapshot});
  const declarations=[...(snapshot?.entries??[]).map(e=>({feature:'wardingFlare',actor:e.actor,token:e.token})),...mappedAttackChoices(card,'declaring-attack')];
  if(declarations.length){card.updateSource({['flags.'+ID+'.reactionTimingWindow']:{...stateFor(card,'wardingFlare',declarations.map(e=>e.actor)),declarations},'flags.dice-so-nice.skip':true});return;}
  if(prepareMajesty(card)){card.updateSource({['flags.'+ID+'.reactionTimingWindow']:stateFor(card,'unbreakableMajesty',[]),'flags.dice-so-nice.skip':true});return;}
  const defenses=defenseSnapshot(card);if(!defenses.length)return;
  card.updateSource({['flags.'+ID+'.reactionTimingWindow']:{...stateFor(card,'attackDefense',defenses.map(e=>e.actor)),defenses},'flags.dice-so-nice.skip':true});
 }else if(card.type==='damage'){
  const choice=flag(reductionAttack(card),'selectedReduction');if(choice?.status!=='reserved')return;
  card.updateSource({['flags.'+ID+'.reactionTimingWindow']:stateFor(card,'deferredReduction',[choice.actor]),'flags.dice-so-nice.skip':true});
 }
}
// Pending damage evaluates and animates before updating its placeholder. Decide
// on concealment at that publication boundary, not after the animation escapes.
export function prepareTimingDamage(card,data){
 if(!timingEnabled()||!game.users.activeGM||card?.type!=='damage')return false;
 const choice=flag(reductionAttack(card),'selectedReduction');
 data.flags??={};data.flags[ID]??={};
 if(choice?.status!=='reserved'){delete data.flags[ID].reactionTimingWindow;return false;}
 // Preserve the placeholder's original DsN preference. Its current skip flag
 // is an internal publication/concealment guard, not a user animation setting.
 const previous=flag(card,'reactionTimingWindow');
 data.flags[ID].reactionTimingWindow=previous?.feature==='deferredReduction'&&previous.status==='pending'?previous:stateFor(card,'deferredReduction',[choice.actor]);
 return true;
}
export function suppressTimingDice(id,decision){
 const card=game.messages.get(id);
 if(timingHeld(card)&&card?.type!=='save'||flag(card,'reactionTimingAnimation')===damageAnimationSignature(card?.rolls))decision.willTrigger3DRoll=false;
}
// Broadcast evaluated attack dice after declaration choices, while keeping
// card totals concealed through hit defenses. Persist the attempt before
// broadcasting so completion/reload cannot play the same attack twice.
export async function animateTimingAttack(card,{declarationComplete=false}={}){
 if(!authority()||card?.type!=='attack'||!timingHeld(card)||timingState(card)?.feature==='wardingFlare'&&!declarationComplete)return;
 if(attackAnimations.has(card.id))return attackAnimations.get(card.id);
 if(flag(card,'reactionTimingAttackAnimated'))return;
 const job=(async()=>{
  await card.setFlag(ID,'reactionTimingAttackAnimated',true);
  const state=timingState(card);if(state?.skip||!game.dice3d?.showForRoll)return;
  try{
   const rolls=card.rolls??[],pool=rolls.length===1?rolls[0]:Roll.fromTerms([foundry.dice.terms.PoolTerm.fromRolls(rolls)]);
   const animation=game.dice3d.showForRoll(pool,card.author??game.user,true,card.whisper?.length?card.whisper:null,card.blind??false,card.id,card.speaker);
   await (globalThis.Ugmuls55eAutomationWaitForAnimation?.(animation)??animation);
   await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  }catch(error){console.warn('Attack dice animation failed; continuing with the evaluated roll.',error);}
 })();attackAnimations.set(card.id,job);try{return await job;}finally{attackAnimations.delete(card.id);refreshing(card);}
}
function refreshing(card){
 globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
 const parent=origin(card);if(parent)globalThis.Ugmuls55eAutomationChatRefresh?.card(parent);
}
function owns(card,user){return user?.active&&(user.isGM||card.author?.id===user.id||card.getAssociatedActor?.()?.testUserPermission?.(user,'OWNER'));}
export function canContinueTiming(card,user=game.user){return !!game.users.activeGM&&!!timingState(card)&&(owns(card,user)||card.type==='save'&&canResolveSaveGroup(saveSource(card),user))&&card.isContentVisible!==false;}
export async function revealTiming(card,user=game.user,{continueDamage=false,resolvedDefense=null}={}){
 if(!authority()||!canContinueTiming(card,user))throw Error('Only the active GM can resolve an authorized reaction window.');
 if(revealing.has(card.id))return revealing.get(card.id);
 const task=enqueue(async()=>{
  const state=timingState(card);if(state?.status==='revealed')return false;
  if(state?.feature==='deferredReduction'&&flag(reductionAttack(card),'selectedReduction')?.status==='reserved'&&!flag(card,'sentinelUsed')&&!flag(card,'parry')&&!flag(card,'cuttingWords')&&!flag(card,'protectiveFields')?.length&&!flag(card,'projectedWards')?.length&&!flag(card,'protectiveFields')?.some(r=>r.kind==='deflect'))throw Error('Wait for the selected reduction, or cancel the defense first.');
  const defenseApplied=resolvedDefense==='defensiveDuelist'&&state?.feature==='attackDefense'&&Object.keys(flag(card,'duelistUsed')??{}).length>0&&!linkedHpCards(card).some(c=>flag(c,'hpApplicationRecorded')||flag(c,'damageUndoHistory')?.length);
  if(!state||!['pending','revealing'].includes(state.status)||game.messages.get(card.id)!==card||isRollAdjustmentLocked(card)&&!defenseApplied)throw Error('This reaction window is no longer available.');
  if(flag(card,'saveTimingAdjusting'))throw Error('Wait for the saving throw adjustment to finish.');
  if(flag(card,'cuttingAdjusting')||flag(card,'cosmicOmenAdjusting')||flag(card,'bendLuckAdjusting')||flag(card,'guidedStrikeAdjusting')||flag(card,'seekingAdjusting')||flag(card,'precisionAdjusting')||flag(card,'bardicAdjusting')||flag(card,'valorAdjusting')||flag(card,'beguilingAdjusting')||flag(card,'uncannyAdjusting')||flag(card,'restoreBalanceAdjusting')||flag(card,'steelDeflectAdjusting')||flag(card,'luckyAdjusting')||flag(card,'illusorySelfAdjusting')||['starting','save','retarget','retargeting'].includes(flag(card,'instinctiveCharm')?.phase)||flag(card,'wardingFlareAdjusting')||flag(card,'parryAdjusting')||flag(card,'duelistAdjusting')||flag(card,'shieldTimingPending'))throw Error('Wait for the reaction to finish.');
  // Raised AC can create the attacker's first failed-roll opportunity. Reuse
  // only the captured grant, never Inspiration acquired after this attack.
  if(state.feature==='attackDefense'&&['shield','valor','defensiveDuelist','cutting','bendLuck','cosmicOmen'].includes(resolvedDefense)&&card.system?.evaluatedTargets?.every(t=>t.isMiss===true)&&card.system?.targets?.every(t=>Number.isFinite(t.ac))){
   const preview=Object.create(card);Object.defineProperties(preview,{flags:{value:{...card.flags,[ID]:{...card.flags?.[ID],reactionTimingWindow:undefined}}},getFlag:{value:(scope,key)=>scope===ID&&key==='reactionTimingWindow'?undefined:card.getFlag?.(scope,key)}});
   const choices=mappedAttackChoices(preview,'outcome').filter(e=>['bardic','precision','seeking','guidedStrike','bendLuck','cosmicOmen'].includes(e.feature)&&!timingDeclined(card,e.actor));
   if(choices.length){await card.setFlag(ID,'reactionTimingWindow',{...state,id:foundry.utils.randomID(),defenses:choices,actors:choices.map(e=>e.actor),status:'pending'});refreshing(card);return true;}
  }
  if((['bardic','precision','seeking','guidedStrike','bendLuck','cosmicOmen'].includes(resolvedDefense)||resolvedDefense==='instinctiveCharm'&&flag(card,'instinctiveCharm')?.phase==='done')&&state.feature==='attackDefense'){
   // Redirecting changes the defender. Re-capture only this live attack's
   // hit-stage eligibility, retaining the original dice and source identity.
   const preview=Object.create(card);Object.defineProperties(preview,{flags:{value:{...card.flags,[ID]:{...card.flags?.[ID],reactionTimingWindow:undefined}}},getFlag:{value:(scope,key)=>scope===ID&&key==='reactionTimingWindow'?undefined:card.getFlag?.(scope,key)}});
   const updates={['flags.'+ID+'.duelistSnapshot']:duelistSnapshot(preview)};for(const adapter of mappedAttacks.filter(a=>a.stage==='outcome'||a.stage==='capture-only')){const snapshot=globalThis[adapter.api]?.snapshot?.(preview);if(snapshot)updates['flags.'+ID+'.'+adapter.snapshot]=snapshot;}
   if(Object.keys(updates).length)await card.update(updates);
   if(['bardic','precision','seeking','guidedStrike','bendLuck','cosmicOmen'].includes(resolvedDefense)&&card.system.evaluatedTargets?.some(t=>t.isMiss===false)){const snapshot=globalThis.Ugmuls55eAutomationUnbreakable?.snapshot?.(card);if(snapshot)await card.setFlag(ID,'unbreakableSnapshot',snapshot);if(prepareMajesty(card)){await card.setFlag(ID,'reactionTimingWindow',{...state,id:foundry.utils.randomID(),feature:'unbreakableMajesty',actors:[],defenses:[],status:'pending'});globalThis.Ugmuls55eAutomationUnbreakable.begin(card).catch(report);refreshing(card);return true;}}
   const defenses=defenseSnapshot(preview);
   if(defenses.length){await card.setFlag(ID,'reactionTimingWindow',{...state,id:foundry.utils.randomID(),defenses,actors:defenses.map(e=>e.actor),declinedActors:[],status:'pending'});refreshing(card);return true;}
  }
  if(state.feature==='unbreakableMajesty'&&globalThis.Ugmuls55eAutomationUnbreakable?.ready(card)===false)throw Error('Resolve Unbreakable Majesty’s Recoil Save first.');
  if(card.type==='attack'&&state.status!=='revealing')await animateTimingAttack(card,{declarationComplete:state.feature==='wardingFlare'});
  if(state.feature==='wardingFlare'&&prepareMajesty(card)){
   await card.setFlag(ID,'reactionTimingWindow',{...state,id:foundry.utils.randomID(),feature:'unbreakableMajesty',stage:TIMING_STAGES.outcome,window:'mandatory-recoil-before-defenses',actors:[],status:'pending',closedFeatures:[...(state.closedFeatures??[]),'wardingFlare','lucky','steelDeflect','restoreBalance']});
   refreshing(card);globalThis.Ugmuls55eAutomationUnbreakable.capture(card).catch(report);return true;
  }
  if(['wardingFlare','unbreakableMajesty'].includes(state.feature)){
   // Recheck live resources after Flare. A Cleric who spent their Reaction
   // cannot also defend with it; a different defender may still have Shield.
   // The preceding window is temporarily omitted only from eligibility reads.
   const preview=Object.create(card);Object.defineProperties(preview,{flags:{value:{...card.flags,[ID]:{...card.flags?.[ID],reactionTimingWindow:undefined}}},getFlag:{value:(scope,key)=>scope===ID&&key==='reactionTimingWindow'?undefined:card.getFlag?.(scope,key)}});
   const defenses=defenseSnapshot(preview);
   if(defenses.length){await card.setFlag(ID,'reactionTimingWindow',{...state,id:foundry.utils.randomID(),feature:'attackDefense',stage:TIMING_STAGES.outcome,window:'after-hit-before-dice-reveal',defenses,actors:defenses.map(e=>e.actor),declinedActors:[],closedFeatures:[...(state.closedFeatures??[]),'wardingFlare','lucky','steelDeflect','restoreBalance'],status:'pending'});refreshing(card);return true;}
  }
  await card.setFlag(ID,'reactionTimingWindow',{...state,status:'revealing'});
  try{
   // Show the final evaluated pool once. Existing roll privacy is unchanged;
   // hidden/background clients use the shared animation acknowledgement path.
   if(card.type!=='save'&&flag(card,'reactionTimingReductionAnimated')!==state.id&&!flag(card,'reactionTimingAttackAnimated')&&state.status!=='revealing'&&!state.skip&&game.dice3d?.showForRoll){
    const rolls=card.rolls??[],pool=rolls.length===1?rolls[0]:Roll.fromTerms([foundry.dice.terms.PoolTerm.fromRolls(rolls)]);
    const animation=game.dice3d.showForRoll(pool,card.author??user,true,card.whisper?.length?card.whisper:null,card.blind??false,card.id,card.speaker);
    await (globalThis.Ugmuls55eAutomationWaitForAnimation?.(animation)??animation);
    await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
   }
  }catch(error){console.warn('Reaction timing dice animation failed; revealing the evaluated result.',error);}
  // An animation failure never rolls again or charges another reaction.
  await card.update({['flags.'+ID+'.reactionTimingWindow']:{...state,status:'revealed',continueUser:card.type==='attack'?(continueDamage?user.id:card.author?.id):null,continueMode:continueDamage?'manual':'automatic'},['flags.'+ID+'.reactionTimingAnimation']:damageAnimationSignature(card.rolls),'flags.dice-so-nice.skip':state.skip});
  refreshing(card);
  if(card.type==='damage'||flareReady(card))await globalThis.Ugmuls55eAutomationReactive?.completed(card);
  return true;
 });revealing.set(card.id,task);try{return await task;}finally{revealing.delete(card.id);}
}
export async function requestTiming(card,{continueDamage=false}={}){
 if(!game.user.isGM){
  if(!canDeclineTiming(card))throw Error('There are no pending reactions owned by you.');
  game.socket.emit('module.'+ID,{action:'reactionTimingDecline',card:card.id,window:timingState(card).id,user:game.user.id,gm:game.users.activeGM?.id});return;
 }
 if(!canContinueTiming(card))throw Error('This reaction window is not yours to continue.');
 if(authority())return card.type==='save'&&canResolveSaveGroup(saveSource(card))?resolveSaveGroup(card,game.user):revealTiming(card,game.user,{continueDamage});
 game.socket.emit('module.'+ID,{action:'reactionTimingReveal',card:card.id,window:timingState(card).id,continueDamage,saveGroup:card.type==='save'&&canResolveSaveGroup(saveSource(card)),user:game.user.id,gm:game.users.activeGM.id});
}
export async function useTimingShield(card,token,user=game.user){
 if(!authority()||!user?.active||!defenseAllowed(card,'shield',token)||!defenseWindow(card))throw Error('This Shield opportunity is no longer available.');
 if(shieldJobs.has(card.id))return shieldJobs.get(card.id);
 const task=(async()=>{
  const state=timingState(card),target=fromUuidSync(token,{strict:false}),actor=target?.actor;
  if(!actor||!state.defenses?.some(e=>e.feature==='shield'&&e.token===token&&e.actor===actor.uuid)||!ownsActor(actor,user)||!shieldCastPlan(actor)||isRollAdjustmentLocked(card)||!card.system.evaluatedTargets?.some(t=>t.token===token&&t.isMiss===false)||flag(card,'shieldTimingPending')||flag(card,'duelistAdjusting')||revealing.has(card.id))throw Error('Shield needs an eligible defender, Reaction and spell resources.');
  await card.setFlag(ID,'shieldTimingPending',{actor:actor.uuid,token,window:state.id});
  let cast;
  try{
   if(flag(card,'duelistAdjusting')||timingState(card)?.id!==state.id||timingState(card)?.status!=='pending')throw Error('Another defense is already resolving.');
   const result=await castShield(actor,card,{timingWindow:state.id});cast=result?.message;
   if(cast&&(flag(cast,'buffAutoApplied')||flag(cast,'outcomeEffectsApplied')))await refreshShieldAttack(card,{settledSource:cast.id});
  }finally{
   if(!cast){await card.setFlag(ID,'shieldTimingPending',null);refreshing(card);}
  }
 })();shieldJobs.set(card.id,task);try{return await task;}finally{shieldJobs.delete(card.id);}
}
function ownsActor(actor,user){return user?.active&&(user.isGM||actor.testUserPermission?.(user,'OWNER'));}
export async function settleTimingShield(card,sourceId){
 if(!authority()||!defenseWindow(card))return;
 if(shieldSettling.has(card.id))return shieldSettling.get(card.id);
 const task=(async()=>{
  const pending=flag(card,'shieldTimingPending'),source=game.messages.get(sourceId),state=timingState(card);
  if(!pending||pending.window!==state.id||flag(source,'reactionTimingShieldWindow')!==state.id||flag(source,'shieldReactionAttack')!==card.id||source.getAssociatedActor?.()?.uuid!==pending.actor||!flag(source,'buffAutoApplied')&&!flag(source,'outcomeEffectsApplied'))return;
  await card.setFlag(ID,'shieldTimingPending',null);
  await completeTimingFeature(card,'shield');
 })();shieldSettling.set(card.id,task);try{return await task;}finally{shieldSettling.delete(card.id);}
}
export async function requestTimingShield(card,token){
 if(authority())return useTimingShield(card,token,game.user);
 const actor=fromUuidSync(token,{strict:false})?.actor;
 if(!actor||!ownsActor(actor,game.user)||!defenseAllowed(card,'shield',token))throw Error('This Shield opportunity is not yours.');
 game.socket.emit('module.'+ID,{action:'reactionTimingShield',card:card.id,window:timingState(card).id,token,user:game.user.id,gm:game.users.activeGM?.id});
}
export async function continueTimingDamage(card){
 const state=timingState(card);if(card.type!=='attack'||state?.status!=='revealed'||state.continueUser!==game.user.id||continuing.has(state.id)||!owns(card,game.user)||!flareReady(card))return;
 if(globalThis.Ugmuls55eAutomationMirrorImage?.intercepted?.(card)||!card.system?.evaluatedTargets?.some(t=>t.isMiss===false))return;
 const parent=origin(card);if(!parent||linkedHpCards(card).some(c=>c.type==='damage'&&c.rolls?.length))return;
 continuing.add(state.id);
 try{
  if(state.continueMode==='automatic')await globalThis.Ugmuls55eAutomationDamage?.promptDamage(card.getAssociatedActivity?.(),parent,'attack',card,{timingContinuation:true});
  else await globalThis.Ugmuls55eAutomationDamage?.rollSpellAttackDamage(parent.getAssociatedActivity?.({scaled:true}),parent,card);
 }catch(error){continuing.delete(state.id);throw error;}
}
export async function renderTimingRoll(wrapped,options={}){
 const card=this.parent;if(card?.type==='save'||!timingHeld(card))return wrapped(options);
 if(card.isContentVisible===false)return wrapped(options);
 if(card.type==='attack'){
  try{
   const resultLabel=defenseWindow(card)?(card.system?.evaluatedTargets?.every(t=>t.isMiss===true)?'Miss':card.rolls?.[0]?.isCritical===true?'Critical Hit':'Hit'):null;
   return await renderAttackSetup(origin(card)??card,card.getAssociatedActivity?.({scaled:true}),{targets:card.system?.targets??[],rolling:true,resultLabel});
  }
  catch(error){console.warn('Concealed attack setup unavailable; retaining a neutral placeholder.',error);}
 }
 const row=document.createElement('div');row.className='chat-card rsa-timing-damage';
 const label=document.createElement('p');label.className='rsa-unified-pending';label.textContent=card.type==='attack'?'Attack rolled — reaction decision':'Damage rolled — reaction decision';if(card.type==='save'){const token=card.getAssociatedToken?.();label.textContent=((token?.document??token)?.name??card.getAssociatedActor?.()?.name??'Target')+' — Failed Save';}
 row.append(label);return row.outerHTML;
}
export function attackTimingFooter(host,node){
 // A pending attack may have no earlier controls, so the unified renderer
 // has not created a footer yet. Give staged abilities the same bottom row.
 let footer=host.querySelector('.rsa-unified-controls');
 if(!footer){footer=document.createElement('div');footer.className='rsa-unified-controls';host.append(footer);}
 return footer;
}
export function placeSaveTimingControls(host,node,controls){
 let footer=host.querySelector('.rsa-save-controls');
 if(!footer&&host.dataset?.rsaSaveSourceId){footer=document.createElement('div');footer.className='rsa-unified-controls rsa-save-controls';host.append(footer);}
 (footer??node).append(controls);
}
export function renderTimingControls(message,root){
 root=root?.[0]??root;if(!root?.querySelectorAll)return;
 root.querySelectorAll('.rsa-timing-controls[data-rsa-save-resolve-group]').forEach(control=>control.remove());
 const declinePermissions=new Map();
 const playerCanDecline=card=>{const key=card.type==='save'?saveSource(card)?.id??card.id:card.id;if(!declinePermissions.has(key))declinePermissions.set(key,canDeclineTiming(card));return declinePermissions.get(key);};
 const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){
  if(!card||!timingHeld(card)||card.isContentVisible===false)continue;
  // Repeated render hooks on the same DOM must not duplicate defender-only
  // controls (those clients have no attacker continuation button).
  node.querySelectorAll(':scope > .rsa-timing-controls,:scope > .rsa-timing-reductions').forEach(control=>control.remove());
  const host=node.closest?.('[data-rsa-attack-id],[data-rsa-save-source-id]')??node;
  for(const old of host.querySelectorAll('.rsa-timing-controls'))if(old.dataset.rsaTimingCard===card.id)old.remove();
  for(const old of host.querySelectorAll('.rsa-timing-reductions'))if(old.dataset.messageId===card.id)old.remove();
  // Hide other adjustment controls until this earlier decision is resolved.
  // Footer placement may already have moved them outside the child summary.
  const area=host;
  const allowed=timingState(card)?.feature==='unbreakableMajesty'?'.rsa-unbreakable-majesty':card.type==='save'?'.rsa-focus-actions,.rsa-own-luck-actions,.rsa-mage-slayer,.rsa-countercharm,.rsa-shared-resilience,.rsa-disciplinedSurvivor,.rsa-focus-actions,.rsa-flash-actions,.rsa-indomitable,.rsa-bardic-actions,.rsa-bend-luck,.rsa-cosmic-omen,.rsa-guided-strike,[data-rsa-precision],[data-rsa-seeking],.rsa-timing-controls':defenseWindow(card)?'.rsa-shield-actions,.rsa-defensive-duelist,.rsa-timing-reductions,.rsa-cutting-actions,.rsa-bardic-actions,.rsa-bend-luck,.rsa-cosmic-omen,.rsa-guided-strike,[data-rsa-precision],[data-rsa-seeking],.rsa-valor-actions,.rsa-uncanny-actions,.rsa-beguiling,.rsa-mirror-image,.rsa-illusory-self,.rsa-instinctive-charm,.rsa-instinctive-charm-redirect':'.rsa-warding-flare,.rsa-parry-actions,.rsa-restore-balance,.rsa-lucky,.rsa-steel-deflect';
  for(const group of area.querySelectorAll('.rsa-attack-actions'))if(!group.matches(allowed)&&!group.querySelector(allowed))group.hidden=true;
  for(const control of area.querySelectorAll('damage-application,effect-application,[data-action="rollDamage"],[data-forward-action="rollDamage"],[data-rsa-attack-damage],[data-rsa-save-mode],[data-rsa-damage-mode],[data-rsa-save-apply]'))control.hidden=true;
  const groupedSave=card.type==='save'&&!!host.dataset?.rsaSaveSourceId&&(game.user.isGM?canResolveSaveGroup(saveSource(card)):playerCanDecline(card));
  if(groupedSave&&host.querySelector('[data-rsa-save-resolve-group]'))continue;
  if(node.querySelector('[data-rsa-timing-continue]'))continue;
  if(defenseWindow(card)){
   const choices=reductionChoices(card,game.user).filter(c=>defenseAllowed(card,c.feature,c.token));
   const group=document.createElement('div');group.className='rsa-attack-actions rsa-timing-reductions';group.dataset.messageId=card.id;
   for(const choice of choices){const b=document.createElement('button');b.type='button';b.textContent=choice.label;b.dataset[choice.feature==='parry'?'rsaParry':choice.feature==='protectiveField'?'rsaStagedField':choice.feature==='sentinelDeath'?'rsaStagedSentinel':choice.feature==='projectedWard'?'rsaStagedWard':'rsaStagedDeflect']='';
    // Parry uses the exact owned feature's base artwork, not its activity icon
    // or an identifier/name lookup that could select another actor's feature.
    if(['parry','protectiveField','projectedWard','sentinelDeath'].includes(choice.feature)){if(choice.itemUuid)b.dataset.rsaReactionItemUuid=choice.itemUuid;}
    else {const icon=choice.activity?.img??choice.activity?.item?.img;if(icon)b.dataset.rsaReactionIcon=icon;}
    b.dataset.tooltip=choice.description??'Use your Reaction now; apply the reduction when damage is rolled.';if(choice.description)b.dataset.rsaReactionDescription=choice.description;
    b.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();b.disabled=true;try{if(authority())await reserveReduction(card,choice.feature,choice.token,game.user);else game.socket.emit('module.'+ID,{action:'reserveReduction',card:card.id,feature:choice.feature,token:choice.token,user:game.user.id,gm:game.users.activeGM?.id});}catch(error){report(error);}finally{refreshing(card);}});group.append(b);
   }if(choices.length){attackTimingFooter(host,node).append(group);presentReactionButtons(group);}
  }
  const controls=document.createElement('div');controls.className='rsa-attack-actions rsa-timing-controls';controls.dataset.rsaTimingCard=card.id;if(groupedSave)controls.dataset.rsaSaveResolveGroup=saveSource(card).id;
  const note=document.createElement('p');note.textContent=timingState(card)?.feature==='unbreakableMajesty'?'Unbreakable Majesty — awaiting Recoil Save':defenseWindow(card)?(card.rolls?.[0]?.isCritical===true?'Critical Hit — defense decision':card.system?.evaluatedTargets?.every(t=>t.isMiss===true)?'Miss — attack decision':'Hit — defense decision'):card.type==='attack'?'Attack pending — reaction decision':card.type==='save'?'Save — reaction decision':'Damage pending — reaction decision';controls.append(note);
  if((game.user.isGM?canContinueTiming(card):playerCanDecline(card))&&!['deferredReduction','unbreakableMajesty'].includes(timingState(card)?.feature)){
   const button=document.createElement('button');button.type='button';button.dataset.rsaTimingContinue=card.id;
   button.textContent='Decline Reaction';
   button.dataset.tooltip=game.user.isGM?'Decline all remaining reactions and continue this action.':'Decline your reaction choices for this action. Other players can still react.';
   button.disabled=attackReactionBusy(card)||timingState(card).status==='revealing'&&(!authority()||revealing.has(card.id))||!!flag(card,'wardingFlareAdjusting')||!!flag(card,'parryAdjusting')||!!flag(card,'duelistAdjusting')||!!flag(card,'shieldTimingPending')||!!flag(card,'saveTimingAdjusting');
   button.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await requestTiming(card,{continueDamage:card.type==='attack'});}catch(error){report(error);}finally{button.disabled=false;}});controls.append(button);
  }
  if(timingState(card)?.feature==='deferredReduction'&&authority()){const b=document.createElement('button');b.textContent='Cancel Defense / Reveal Damage';b.addEventListener('click',async()=>{b.disabled=true;try{await globalThis.Ugmuls55eAutomationStagedReductions.cancel(card);await revealTiming(card,game.user);}catch(error){report(error);}finally{b.disabled=false;}});controls.append(b);}
  if(card.type==='save'){
   const recipient=card.getAssociatedToken?.();const name=(recipient?.document??recipient)?.name??card.getAssociatedActor?.()?.name;
   if(groupedSave)note.textContent=game.user.isGM?'Saves — reaction decision':'Your save reactions — decision';else if(name)note.textContent='Save — '+name+' — reaction decision';
   placeSaveTimingControls(host,node,controls);
  }else attackTimingFooter(host,node).append(controls);
 }
}
export async function completeTimingFeature(card,feature){
 if(card?.type==='save')return finishSaveReaction(card);
 if(!timingHeld(card))return;
 if(!authority())throw Error('Only the active GM can complete this reaction.');
 // One actor's response must not silently decline another actor's remaining
 // opportunity. Recompute only this captured window's eligible choices.
 if(timingState(card)?.status==='pending'&&decisionActors(card).length){refreshing(card);return;}
 return revealTiming(card,game.user,{resolvedDefense:feature});
}
function report(error){console.error('Reaction timing',error);ui.notifications.warn(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'reactionTimingPilot',{name:'Attack and Save Reaction Pauses',hint:'Pause at connected attack and failed-save decisions. Only eligible enabled features create a pause. Individual features can be disabled in their class, feat or spell settings; existing decisions remain finishable.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationReactionTiming={animateAttack:animateTimingAttack,choiceAllowed:attackChoiceAllowed,declined:timingDeclined,declareSpell,mapSpellDeclaration,saveDamageBlocked,saveDamageSkipped,saveAdjustment:runSaveReaction,revealSave:(card,user=game.user)=>revealTiming(card,user),held:timingHeld,blocked:timingBlocked,damageBlocked:timingDamageBlocked,closed:timingClosed,defenseWindow,defenseAllowed,shield:requestTimingShield,shieldSettled:settleTimingShield,prepareDamage:prepareTimingDamage,complete:completeTimingFeature,isControl:node=>timingEnabled()&&(!!node?.closest?.('.rsa-timing-controls,.rsa-unbreakable-majesty,.rsa-restore-balance,.rsa-lucky,.rsa-steel-deflect,.rsa-cutting-actions,.rsa-bardic-actions,.rsa-bend-luck,.rsa-cosmic-omen,.rsa-guided-strike,[data-rsa-precision],[data-rsa-seeking],.rsa-valor-actions,.rsa-uncanny-actions,.rsa-beguiling,.rsa-mirror-image,.rsa-illusory-self,.rsa-instinctive-charm,.rsa-instinctive-charm-redirect,.rsa-warding-flare,.rsa-parry-actions,.rsa-shield-actions,.rsa-defensive-duelist,.rsa-timing-reductions,.rsa-own-luck-actions,.rsa-mage-slayer,.rsa-countercharm,.rsa-shared-resilience,.rsa-disciplinedSurvivor,.rsa-focus-actions,.rsa-flash-actions,.rsa-indomitable')||!!(node?.closest?.('[data-rsa-retarget]')&&flag(game.messages.get(node.closest('[data-message-id]')?.dataset.messageId),'instinctiveCharm')?.phase==='retarget'))};
 for(const type of ['attack','damage','save']){const prototype=CONFIG.ChatMessage.dataModels[type]?.prototype;if(!prototype?.render)continue;const render=prototype.render;prototype.render=function(options){return renderTimingRoll.call(this,render.bind(this),options);};}
 Hooks.on('preCreateChatMessage',prepareTiming);
 Hooks.on('createChatMessage',card=>animateTimingAttack(card).catch(report));
 Hooks.on('diceSoNiceMessagePreProcess',suppressTimingDice);
 Hooks.on('dnd5e.renderChatMessage',renderTimingControls);
 Hooks.on('updateChatMessage',(card,changes)=>{
  if(Object.hasOwn(changes,'flags.'+ID+'.reactionTimingWindow')||Object.hasOwn(changes.flags?.[ID]??{},'reactionTimingWindow')||Object.hasOwn(changes,'flags.'+ID+'.wardingFlareHealingPending')||Object.hasOwn(changes.flags?.[ID]??{},'wardingFlareHealingPending'))continueTimingDamage(card).catch(report);
 });
 Hooks.on('deleteChatMessage',card=>{const state=timingState(card);if(state)continuing.delete(state.id);});
 Hooks.on('dnd5e.preRollDamageV2',(config,_dialog,message)=>{
  const ref=message?.data?.system?.origin,source=typeof ref==='string'?game.messages.get(ref.replace(/^ChatMessage\./,'')):ref;
  if(saveDamageBlocked(source)){ui.notifications.warn('Resolve the saving throw decision before rolling damage.');return false;}
  if(timingDamageBlocked(message?.data)){ui.notifications.warn('Resolve or reveal the attack before rolling damage.');return false;}
 });
 game.socket.on('module.'+ID,packet=>{
  if(packet?.action==='reactionTimingError'&&packet.user===game.user.id){ui.notifications.warn(packet.error);refreshing(game.messages.get(packet.card));return;}
  if(packet?.action==='reactionTimingShield'){
   if(!authority()||packet.gm!==game.user.id)return;
   const card=game.messages.get(packet.card),user=game.users.get(packet.user);
   if(!card||!user?.active||timingState(card)?.id!==packet.window)return;
   return useTimingShield(card,packet.token,user).catch(error=>game.socket.emit('module.'+ID,{action:'reactionTimingError',user:user.id,card:card.id,error:error.message}));
  }
  if(packet?.action==='reactionTimingDecline'){
   if(!authority()||packet.gm!==game.user.id)return;
   const card=game.messages.get(packet.card),user=game.users.get(packet.user);
   if(!card||!user?.active||timingState(card)?.id!==packet.window)return;
   return declineTiming(card,user).catch(error=>game.socket.emit('module.'+ID,{action:'reactionTimingError',card:card.id,user:user.id,error:error.message}));
  }
  if(packet?.action!=='reactionTimingReveal'||!authority()||packet.gm!==game.user.id)return;
  const card=game.messages.get(packet.card),user=game.users.get(packet.user);
  if(!user?.active||!user.isGM||timingState(card)?.id!==packet.window||!canContinueTiming(card,user))return;
  if(packet.saveGroup===true&&card.type==='save')return resolveSaveGroup(card,user).catch(report);
  return revealTiming(card,user,{continueDamage:packet.continueDamage===true}).catch(report);
 });
});
