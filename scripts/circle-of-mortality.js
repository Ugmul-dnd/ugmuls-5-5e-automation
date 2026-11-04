import {firearmContext} from './arcane-firearm.js';
const ID='ugmuls-5-5e-automation';
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
export const mortalityFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)==='circle-of-mortality'||i.id==='rhwCSCircleofMOG'||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.rhwCSCircleofMOG'))||i.name?.trim().toLowerCase()==='circle of mortality'));
function targetActor(t){try{return globalThis.fromUuidSync?.(t.token??t.actor,{strict:false})?.actor??globalThis.fromUuidSync?.(t.actor,{strict:false});}catch{return null;}}
export function mortalityValid(c){
 const target=c.targets?.length===1?c.targets[0]:null,hp=targetActor(target??{})?.system?.attributes?.hp;
 if(!c.mortality||!target||!Number.isFinite(hp?.value)||!Number.isFinite(hp?.max)||hp.max<=0||hp.value>=hp.max)return false;
 if(c.activity?.type==='attack')return values(c.attack?.system?.evaluatedTargets).some(t=>t.token===target.token&&t.isMiss===false);
 if(c.activity?.type==='save'&&c.activity.damage?.onSave==='none'){
  const saves=values(c.mortalitySource?.getAssociatedRolls?.('save')).filter(s=>s.getAssociatedActor?.()?.uuid===targetActor(target)?.uuid);
  if(!saves.some(s=>s.rolls?.some(r=>r._evaluated&&Number.isFinite(r.options?.target)&&Number(r.total)<r.options.target)))return false;
 }
 return c.item?.type==='spell'&&['save','damage'].includes(c.activity?.type);
}
export function finalizeMortalityHealing(app,rolls,{preview=false}={}){
 if(game.settings.get(ID,'circleMortalityAutomation')!==true)return rolls;
 const c=firearmContext(app),data=app.message?.data,card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),targets=card?.system?.targets??data?.system?.targets??c.cast?.system?.targets??[];
 if(!c.actor?.isOwner||!mortalityFeature(c.actor)||!targets.length||!targets.every(t=>targetActor(t)?.system?.attributes?.hp?.value===0))return rolls;
 const channel=key(c.item)==='channel-divinity'||c.item?.system?.type?.subtype==='channelDivinity';
 if(c.item?.type!=='spell'&&!channel)return rolls;
 return rolls.map(roll=>{
  if(roll.options?.type!=='healing'||roll._evaluated||roll.options?.rsaMortalityHealing)return roll;
  const result=preview?new roll.constructor(roll.formula,roll.data??{},foundry.utils.deepClone(roll.options)):roll;
  for(const die of result.dice??[]){die.options??={};die.options.rsaMortalityHealing=true;}
  result.options.rsaMortalityHealing=true;return result;
 });
}
export function installMortalityDice(Type=CONFIG.Dice.DamageRoll){
 const p=Type?.prototype;if(!p?.evaluate||Object.hasOwn(p,'rsaMortalityEvaluation'))return;
 const evaluate=p.evaluate;p.rsaMortalityEvaluation=true;p.evaluate=function(options={}){
  for(const die of this.dice??[]){if(!die.options?.rsaMortalityHealing||die.rsaMortalityEvaluation)continue;
   const evaluateDie=die.evaluate;die.rsaMortalityEvaluation=true;die.evaluate=function(config={}){return evaluateDie.call(this,{...config,maximize:true,minimize:false});};
  }return evaluate.call(this,options);
 };
}
Hooks.once('ready',()=>installMortalityDice());
