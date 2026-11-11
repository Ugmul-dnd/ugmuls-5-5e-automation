import {tokenDistance} from './shared-distance.js';
const ID='ugmuls-5-5e-automation';let bridge=false;
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,enabled=()=>game.settings.get(ID,'invokeDuplicityAutomation')===true;
const resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
function token(ref){const d=resolve(ref);if(d?.actor)return d.document??d;const a=d?.token?.document??d?.token;if(a)return a;const matches=values(globalThis.canvas?.scene?.tokens).filter(t=>t.actor?.uuid===d?.uuid);return matches.length===1?matches[0]:null;}
export const duplicityFeature=(actor,id)=>values(actor?.items).find(i=>i.type==='feat'&&key(i)===id&&i.system?.source?.rules!=='2014');
function incapacitated(actor){return ['incapacitated','unconscious','stunned','paralyzed','petrified','dead'].some(s=>actor?.statuses?.has(s));}
export function duplicitySource(illusion){
 const summon=illusion?.actor?.flags?.dnd5e?.summon,item=resolve(summon?.origin),actor=item?.actor;
 if(summon?.activity!=='dnd5eactivity000'||key(item)!=='invoke-duplicity'||item.system?.source?.rules==='2014'||!duplicityFeature(actor,'invoke-duplicity')||incapacitated(actor))return null;
 return actor;
}
function near(a,b){const metric=a.parent?.grid?.units;const five=['m','meter','meters','metre','metres'].includes(String(metric).toLowerCase())?1.5:5;return tokenDistance(a,b)<=five;}
export function duplicityAdvantage(attacker,target){
 if(!enabled())return false;attacker=attacker?.document??attacker;target=target?.document??target;
 if(!attacker?.actor||!target?.actor||!attacker.parent||attacker.parent.id!==target.parent?.id)return false;
 return values(target.parent.tokens).some(illusion=>{
  const caster=duplicitySource(illusion);if(!caster||illusion.uuid===target.uuid||!near(illusion,target))return false;
  const own=attacker.actor.uuid===caster.uuid;
  if(duplicityFeature(caster,'improved-duplicity')){
   return own||!!attacker.disposition&&values(target.parent.tokens).some(t=>t.actor?.uuid===caster.uuid&&t.disposition===attacker.disposition);
  }
  if(!own||!near(attacker,target)||target.actor.statuses?.has('blinded')||illusion.hidden||illusion.actor?.statuses?.has('invisible'))return false;
  if(!target.object?.center||!illusion.object?.center)return false;
  return !target.object.checkCollision?.(illusion.object.center,{type:'sight',mode:'any'});
 });
}
export function registerDuplicity(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.('automated-conditions-5e')?.active||!api?.register)return bridge;
 try{bridge=!!api.register({key:'rsaInvokeDuplicity',scope:'universal',hook:'attack',target:'subject',mode:'advantage',name:'Invoke Duplicity',persistent:false,evaluate:s=>duplicityAdvantage(token(s.tokenUuid??s.actorUuid),token(s.opponentTokenUuid??s.opponentUuid??s.opponentActorUuid))});}catch(error){console.warn('Invoke Duplicity AC5E integration',error);}return bridge;
}
export function duplicityDefaults(config,dialog,message){
 if(config.subject?.type!=='attack'||bridge&&game.modules?.get?.('automated-conditions-5e')?.active)return;
 const targets=message?.data?.system?.targets??values(game.user.targets).map(t=>({token:(t.document??t).uuid}));if(targets.length!==1)return;
 const speaker=message?.data?.speaker,attacker=speaker?.scene&&speaker?.token?token('Scene.'+speaker.scene+'.Token.'+speaker.token):config.subject.getUsageToken?.();
 if(!duplicityAdvantage(attacker,token(targets[0].token??targets[0].actor)))return;
 config.advantage=true;
 for(const roll of config.rolls??[]){roll.options??={};const o=roll.options,state=o['automated-conditions-5e']??config.options?.['automated-conditions-5e'],dis=state?.modeCounts?!!(state.modeCounts.disadvantages?.present||state.modeCounts.noAdvantages?.present):!!config.disadvantage||!!o.disadvantage||o.advantageMode===-1;Object.assign(o,{advantage:true,disadvantage:dis,advantageMode:dis?0:1});}
 dialog.options??={};dialog.options.defaultButton=config.rolls?.[0]?.options?.disadvantage?'normal':'advantage';return dialog.options.defaultButton;
}
export function prepareDuplicityButtons(app,context){const choice=duplicityDefaults({...app.config,rolls:app.rolls??app.config.rolls},{options:{}},app.message);if(choice)for(const [key,b]of Object.entries(context.buttons??{}))b.default=key===choice;}
Hooks.once('init',()=>game.settings.register(ID,'invokeDuplicityAutomation',{name:'Trickery Cleric: Invoke Duplicity Advantage',hint:'Check native Duplicate summons at attack time. Distract requires the Cleric and illusion within 5 feet of a target that can see the illusion. Improved Duplicity grants allied attackers Advantage against targets within 5 feet of the illusion. Preserve advantage/disadvantage cancellation.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.on('ac5e.usageRulesReady',({usageRules}={})=>registerDuplicity(usageRules));
Hooks.once('ready',()=>{registerDuplicity();globalThis.Ugmuls55eAutomationDuplicity={prepareDuplicityButtons};Hooks.on('dnd5e.preRollAttackV2',duplicityDefaults);});
