import {firearmContext} from './arcane-firearm.js';
import {installMortalityDice} from './circle-of-mortality.js';
const ID='ugmuls-5-5e-automation',wrapped=new WeakSet();
export const supremeFeature=actor=>Array.from(actor?.items?.values?.()??actor?.items??[]).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&((i.identifier??i.system?.identifier)==='supreme-healing'||i.id==='phbclcSupremeHea'||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.phbclcSupremeHea'))||i.name?.trim().toLowerCase()==='supreme healing'));
export function finalizeSupremeHealing(app,rolls,{preview=false}={}){
 if(game.settings.get(ID,'supremeHealingAutomation')!==true)return rolls;
 const {actor,item}=firearmContext(app);
 if(!actor?.isOwner||!supremeFeature(actor)||!(item?.type==='spell'||(item?.identifier??item?.system?.identifier)==='channel-divinity'||item?.system?.type?.subtype==='channelDivinity'))return rolls;
 return rolls.map(roll=>{
  if(roll._evaluated||roll.options?.type!=='healing'||roll.options?.rsaSupremeHealing)return roll;
  const result=preview?new roll.constructor(roll.formula,roll.data??{},foundry.utils.deepClone(roll.options)):roll;
  // Reuse the existing per-die maximum evaluator; flat bonuses retain their normal values.
  for(const die of result.dice??[]){die.options??={};die.options.rsaMortalityHealing=true;}
  result.options.flavor=[result.options.flavor,'Supreme Healing'].filter(Boolean).join(' · ');
  result.options.rsaSupremeHealing=true;return result;
 });
}
export function installSupremeRoll(Type=CONFIG.Dice.DamageRoll){
 if(!Type?.buildConfigure||wrapped.has(Type))return;wrapped.add(Type);const configure=Type.buildConfigure;
 Type.buildConfigure=async function(config,dialog,message){const rolls=await configure.call(this,config,dialog,message);return dialog?.configure===false&&rolls?.length?finalizeSupremeHealing({config,message},rolls):rolls;};
}
Hooks.once('init',()=>game.settings.register(ID,'supremeHealingAutomation',{name:'Life Cleric: Supreme Healing',hint:'Automatically maximize healing dice from spells and Channel Divinity. No additional resource cost.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationSupremeHealing={finalize:finalizeSupremeHealing};installMortalityDice();installSupremeRoll();});
