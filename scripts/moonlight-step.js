import {druidOwner} from './druid-damage.js';
const ID='ugmuls-5-5e-automation',snapshots=new WeakMap();let bridge=false;
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const enabled=()=>game.settings.get(ID,'moonlightStepAutomation')===true;
const stamp=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
const resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
export const moonlightTransport=a=>a?.type==='utility'&&a.item?.type==='feat'&&key(a.item)==='moonlight-step'&&values(a.effects).length>0;
export function moonlightEffects(actor){return values(actor?.appliedEffects??actor?.effects).filter(e=>!e.disabled&&!e.isSuppressed&&!e.duration?.expired&&(e.getFlag?.(ID,'moonlightStep')??e.flags?.[ID]?.moonlightStep)?.turn===stamp());}
export function prepareMoonlightEffect(effect){
 if(!enabled()||effect.parent?.documentName!=='Actor')return;
 const activity=resolve(effect.system?.origin?.activity),item=activity?.item??resolve(effect.system?.origin?.item??effect.origin);
 if(key(item)!=='moonlight-step'||activity&&!moonlightTransport(activity))return;
 effect.updateSource({disabled:false,transfer:false,['flags.'+ID+'.moonlightStep']:{turn:stamp(),instance:foundry.utils.randomID()},duration:{value:1,units:'turns',expiry:'turnEnd',expired:false},start:CONFIG.ActiveEffect.documentClass.getEffectStart()});
}
export function refreshMoonlightEffect(effect,changes){
 if(changes.disabled!==false||!(changes.system?.origin?.message||changes['system.origin.message']))return;
 const source={parent:effect.parent,system:changes.system??effect.system,origin:effect.origin,updateSource:data=>Object.assign(changes,data)};prepareMoonlightEffect(source);
}
export function registerMoonlight(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.('automated-conditions-5e')?.active||!api?.register)return bridge;
 bridge=!!api.register({key:'rsaMoonlightStep',scope:'universal',hook:'attack',target:'subject',mode:'advantage',name:'Moonlight Step',persistent:false,evaluate:s=>{const d=resolve(s.actorUuid);return enabled()&&moonlightEffects(d?.actor??d).length>0;}});return bridge;
}
export function moonlightAttack(config,dialog){
 if(!enabled()||config.subject?.type!=='attack')return;const actor=config.subject.actor??config.subject.item?.actor,effects=moonlightEffects(actor);if(!effects.length)return;
 snapshots.set(config,effects.map(e=>({effect:e,instance:e.getFlag?.(ID,'moonlightStep')?.instance??e.flags?.[ID]?.moonlightStep?.instance})));
 if(bridge&&game.modules?.get?.('automated-conditions-5e')?.active)return;
 config.advantage=true;for(const roll of config.rolls??[]){const o=roll.options??={},dis=!!config.disadvantage||!!o.disadvantage||o.advantageMode===-1;Object.assign(o,{advantage:true,disadvantage:dis,advantageMode:dis?0:1});}
 dialog.options??={};dialog.options.defaultButton=config.rolls?.some(r=>r.options?.disadvantage)||config.disadvantage?'normal':'advantage';
}
export async function consumeMoonlight(rolls,config){
 const entries=snapshots.get(config);snapshots.delete(config);if(!rolls?.length||!entries)return;
 // Snapshot only the buff present before this roll; a newer application survives.
 for(const {effect,instance}of entries){if(!effect.parent?.isOwner||effect.disabled||(effect.getFlag?.(ID,'moonlightStep')??effect.flags?.[ID]?.moonlightStep)?.instance!==instance)continue;await effect.update({disabled:true});}
}
export async function expireMoonlight(combat,changes){
 if(!enabled()||!game.user.isGM||game.users.activeGM?.id&&game.users.activeGM.id!==game.user.id||!['turn','round','started'].some(k=>k in changes))return;
 const previous=combat.combatants?.get(combat.previous?.combatantId);if(!previous)return;
 const actors=new Set([previous.actor,previous.token?.actor]);for(const actor of [...actors])if(actor)actors.add(druidOwner(actor));
 for(const actor of actors)for(const effect of values(actor?.effects)){const data=effect.getFlag?.(ID,'moonlightStep')??effect.flags?.[ID]?.moonlightStep;if(data?.turn&&data.turn!==stamp()&&!effect.disabled)await effect.update({disabled:true});}
}
Hooks.once('init',()=>game.settings.register(ID,'moonlightStepAutomation',{name:'Moon Druid: Moonlight Step',hint:'Apply the native transport buff to the caster, recommend next-attack Advantage through AC5E, and consume after the attack or end of turn.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.on('ac5e.usageRulesReady',({usageRules}={})=>registerMoonlight(usageRules));
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationMoonlight={transport:moonlightTransport};registerMoonlight();Hooks.on('preCreateActiveEffect',prepareMoonlightEffect);Hooks.on('preUpdateActiveEffect',refreshMoonlightEffect);Hooks.on('dnd5e.preRollAttackV2',moonlightAttack);Hooks.on('dnd5e.rollAttackV2',(rolls,config)=>consumeMoonlight(rolls,config).catch(console.error));Hooks.on('updateCombat',(c,d)=>expireMoonlight(c,d).catch(console.error));});
