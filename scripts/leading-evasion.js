import {tokenDistance} from './shared-distance.js';
const ID='ugmuls-5-5e-automation',values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const enabled=()=>game.settings.get(ID,'leadingEvasionAutomation')===true,unable=a=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>a?.statuses?.has(s));
const resolve=r=>{try{return globalThis.fromUuidSync?.(r,{strict:false});}catch{return null;}};
export const leadingFeature=a=>values(a?.items).find(i=>i.type==='feat'&&key(i)==='leading-evasion'&&i.system?.source?.rules!=='2014');
function ability(activity,usage,token){const abilities=typeof activity?.save?.ability==='string'?[activity.save.ability]:values(activity?.save?.ability);if(abilities.length===1)return abilities[0];return values(usage?.getAssociatedRolls?.('save')).filter(c=>(c.getAssociatedToken?.()?.document??c.getAssociatedToken?.())?.uuid===token.uuid).sort((a,b)=>(b.timestamp??0)-(a.timestamp??0))[0]?.rolls?.[0]?.options?.ability;}
export function leadingSaveLabel(activity,usage,target){
 target=target?.document??target;if(!enabled()||!target?.actor||activity?.type!=='save'||activity.damage?.onSave!=='half'||ability(activity,usage,target)!=='dex')return null;
 const targets=values(usage?.system?.targets);if(!targets.some(t=>t.token===target.uuid))return null;
 const own=leadingFeature(target.actor);if(own&&!unable(target.actor))return {name:'Leading Evasion',inactive:false,source:target};
 for(const ref of targets){const source=resolve(ref.token);if(!source?.actor||source.uuid===target.uuid||!leadingFeature(source.actor)||unable(source.actor)||source.parent?.id!==target.parent?.id||ability(activity,usage,source)!=='dex')continue;
  const limit=/^(m|meters?|metres?)$/i.test(String(source.parent?.grid?.units))?1.524:5;
  if(tokenDistance(source,target)<=limit)return {name:'Leading Evasion',inactive:false,source};
 }
 return own?{name:'Leading Evasion',inactive:true,source:target}:null;
}
export function leadingContext(card,uuid){
 if(!enabled()||card?.type!=='damage'||card.getFlag?.(ID,'pendingDamage'))return null;
 const origin=card.system?.origin,usage=typeof origin==='string'?game.messages.get(origin.replace(/^ChatMessage\./,'')):origin,activity=card.getAssociatedActivity?.({scaled:true})??usage?.getAssociatedActivity?.({scaled:true}),target=resolve(uuid);
 if((card.system?.onSave??activity?.damage?.onSave)!=='half'||!values(card.system?.targets?.length?card.system.targets:usage?.system?.targets).some(t=>t.token===uuid))return null;
 const label=leadingSaveLabel(activity,usage,target),outcome=usage?.system?.outcomes?.get(uuid);if(!label||label.inactive||!['success','failure'].includes(outcome))return null;
 return {actor:target.actor,token:target,outcome,multiplier:outcome==='success'?0:0.5,label:label.name};
}
Hooks.once('init',()=>game.settings.register(ID,'leadingEvasionAutomation',{name:'Dance Bard: Leading Evasion',hint:'Apply Evasion to the Bard and creatures within 5 feet making the same Dexterity half-damage save. No damage on success, half on failure. Incapacitated Bards cannot grant the benefit.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationLeadingEvasion={context:leadingContext,saveLabel:leadingSaveLabel};for(const event of ['createItem','updateItem','deleteItem','createActiveEffect','updateActiveEffect','deleteActiveEffect'])Hooks.on(event,(doc,change)=>globalThis.Ugmuls55eAutomationChatRefresh?.request('leadingEvasion',doc,change));});
