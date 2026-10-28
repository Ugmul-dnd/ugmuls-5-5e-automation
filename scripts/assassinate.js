import {sneakAttackContext} from "./sneak-attack.js";
const ID='ugmuls-5-5e-automation',seenTurns=new WeakMap();let bridge=false;
const values=x=>Array.from(x?.values?.()??x??[]),resolve=uuid=>uuid?globalThis.fromUuidSync?.(uuid,{strict:false}):null,key=i=>i?.identifier??i?.system?.identifier;
const enabled=()=>game.settings.get(ID,'assassinateAutomation')===true;
export const assassinateFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)==='assassinate'||/^assassinate$/i.test(i.name?.trim()??'')));
const firstRound=combat=>!!combat?.started&&combat.round===1&&Number.isInteger(combat.turn)&&combat.turn>=0;
function participant(actor,combat=game.combat){return values(combat?.combatants).some(c=>c.actor?.uuid===actor?.uuid);}
function turnHistory(combat){
 let seen=seenTurns.get(combat);if(seen)return seen;
 // On reload, initialize from the current initiative order. Later reordering
 // preserves the turns observed in this client session, without document writes.
 seen=new Set((combat.turns??[]).slice(0,combat.turn+1).map(c=>c.id));seenTurns.set(combat,seen);return seen;
}
export function rememberAssassinateTurn(combat,changes={}){
 if(!('turn' in changes||'round' in changes||'started' in changes))return;
 if(!firstRound(combat)){seenTurns.delete(combat);return;}
 const seen=seenTurns.get(combat);if(seen&&combat.combatant?.id)seen.add(combat.combatant.id);
}
export function assassinateAdvantage(actor,target){
 const combat=game.combat;if(!enabled()||!firstRound(combat)||!assassinateFeature(actor)||!participant(actor,combat)||!target)return false;
 const token=target.document??target;
 const matches=(combat.turns??[]).filter(c=>!c.getFlag?.(ID,"thiefsReflexes")).filter(c=>token.actor?c.token?.uuid===token.uuid:c.actor?.uuid===token.uuid);
 if(matches.length!==1)return false;
 const victim=matches[0],seen=turnHistory(combat);if(combat.combatant?.id)seen.add(combat.combatant.id);
 return !seen.has(victim.id);
}
export function registerAssassinateRule(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.('automated-conditions-5e')?.active||!api?.register)return bridge;
 bridge=!!api.register({key:'rsaAssassinate',scope:'universal',hook:'attack',target:'subject',mode:'advantage',name:'Assassinate',persistent:false,evaluate:s=>{const subject=resolve(s.actorUuid),actor=subject?.actor??subject,target=resolve(s.opponentUuid)??resolve(s.opponentActorUuid);return assassinateAdvantage(actor,target);}});return bridge;
}
export function assassinateDefaults(config,dialog,message){
 if(bridge&&game.modules?.get?.('automated-conditions-5e')?.active||config.subject?.type!=='attack')return;
 const actor=config.subject.actor??config.subject.item?.actor,recorded=message?.data?.system?.targets,targets=recorded?.length?recorded.map(t=>resolve(t.token)).filter(Boolean):values(game.user?.targets).map(t=>t.document??t);
 if(targets.length!==1||!assassinateAdvantage(actor,targets[0]))return;
 const dis=config.disadvantage===true||(config.rolls??[]).some(r=>r.options?.disadvantage===true||r.options?.advantageMode===-1);
 config.advantage=true;for(const roll of config.rolls??[]){roll.options??={};Object.assign(roll.options,{advantage:true,advantageMode:dis?0:1});}
 dialog.options??={};dialog.options.defaultButton=dis?'normal':'advantage';
}
export function recordAssassinateAttack(card){
 if(!enabled()||card.type!=='attack'||!card.rolls?.length||!firstRound(game.combat))return;
 const actor=card.getAssociatedActor?.();if(!actor||!assassinateFeature(actor)||!participant(actor))return;
 card.updateSource({['flags.'+ID+'.assassinateAttack']:{combat:game.combat.id,round:1,actor:actor.uuid}});
}
export function finalizeAssassinateDamage(app,rolls){
 if(!enabled()||app.config?.subject?.type!=='attack'||app.config.subject.item?.type!=='weapon'||app.message?.data?.flags?.[ID]?.masteryGraze||!rolls.some(r=>r.options?.rsaSneakAttack)||rolls.some(r=>r.options?.rsaAssassinate))return rolls;
 const {attack,targets}=sneakAttackContext(app),actor=app.config.subject.actor??app.config.subject.item?.actor,feature=assassinateFeature(actor);
 if(!feature||!attack||targets.length!==1||!attack.system?.evaluatedTargets?.some(t=>t.token===targets[0].token&&t.isMiss===false))return rolls;
 const record=attack.getFlag?.(ID,'assassinateAttack');
 if(record?record.round!==1||record.actor!==actor.uuid:!firstRound(game.combat)||!participant(actor))return rolls;
 const activity=values(feature.system?.activities).find(a=>a.type==='damage'),source=activity?.getDamageConfig?.()?.rolls?.[0];if(!source?.parts?.length)return rolls;
 const base=rolls[0]?.options??{},critical={...base.critical,bonusDice:0,bonusDamage:''};
 const bonus=CONFIG.Dice.DamageRoll.fromConfig({...source,options:{...source.options,type:base.type,types:base.type?[base.type]:[],flavor:'Assassinate — Surprising Strikes',isCritical:false,critical,rsaAssassinate:{feature:feature.uuid,attack:attack.id}}},{critical});
 return [...rolls,bonus];
}
Hooks.once('init',()=>game.settings.register(ID,'assassinateAutomation',{name:'Assassinate Assistance',hint:'During round one, recommend Advantage against creatures that have not taken a turn and add native Rogue-level Surprising Strikes damage when Sneak Attack hits. Preserve native Initiative Advantage and critical rules.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.on('ac5e.usageRulesReady',({usageRules}={})=>registerAssassinateRule(usageRules));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationAssassinate={finalizeAssassinateDamage};registerAssassinateRule();
 Hooks.on('dnd5e.preRollAttackV2',assassinateDefaults);Hooks.on('preCreateChatMessage',recordAssassinateAttack);Hooks.on('updateCombat',rememberAssassinateTurn);
});
