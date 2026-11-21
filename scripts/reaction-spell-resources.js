// Shared reaction-spell availability. Shield uses this now; Counterspell can
// reuse it when its Spell Declared timing adapter is mapped.
import {reactionUsed} from './reaction-tracker.js';
const values=v=>Array.from(v?.values?.()??v??[]);
const remaining=uses=>Math.max(0,Number(uses?.value??(Number(uses?.max)-Number(uses?.spent??0)))||0);
const limited=uses=>uses?.max!==undefined&&uses.max!==null&&uses.max!==''&&String(uses.max)!=='0';
const slotKey=key=>/^spell[1-9]$/.test(key)||key==='pact';
export function reactionSpellAvailable(actor){return !!actor&&!reactionUsed(actor)&&!['incapacitated','dead','unconscious','stunned','paralyzed','petrified'].some(s=>actor.statuses?.has(s));}
export function hasConfiguredSpellSlots(actor){return Object.entries(actor?.system?.spells??{}).some(([key,s])=>slotKey(key)&&(Number(s.max)>0||Number(s.value)>0));}
function linkedSource(item,activity){return item.system?.linkedActivity??activity?.getLinkedActivity?.()??null;}
function sourceCostsAvailable(source,actor){
 if(source.canUse===false||source.item?.system?.magicAvailable===false)return false;
 for(const target of values(source.consumption?.targets)){
  if(target.combatOnly&&!actor.inCombat)continue;
  if(target.hasZeroCost?.({scaling:0})===true)continue;
  // Native labels resolve configured formula/scaling without spending uses.
  // Authoritative native use still validates the cost again before committing.
  if(typeof target.getConsumptionLabels==='function'){
   try{if(target.getConsumptionLabels({scaling:0},{consumed:true})?.warn)return false;}
   catch{return false;}
  }
  const cost=Number(target.value??1),minimum=Number.isFinite(cost)?Math.max(0,cost):1;
  if(target.type==='itemUses'){
   const pool=target.target?(actor.items?.get?.(target.target)??values(actor.items).find(i=>i.id===target.target)):source.item;
   if(!pool||remaining(pool.system?.uses)<minimum)return false;
  }else if(target.type==='activityUses'){
   if(remaining(source.uses??source.system?.uses)<minimum)return false;
  }else if(typeof target.getConsumptionLabels!=='function')return false;
 }
 return true;
}
export function reactionSpellSource(item,activity,actor){
 let source=linkedSource(item,activity);if(!source)return null;
 const entry=source,seen=new Set();
 while(source){
  if(seen.has(source)||source.actor&&source.actor!==actor&&source.actor.uuid!==actor.uuid||!sourceCostsAvailable(source,actor))return null;
  seen.add(source);source=linkedSource(source.item??{},null);
 }
 return entry;
}
export function reactionSpellCastPlan(actor,identifier,{activityType=null}={}){
 if(!reactionSpellAvailable(actor))return null;
 const slotlessNpc=actor.type==='npc'&&!hasConfiguredSpellSlots(actor),candidates=[];
 for(const item of values(actor.items)){
  if(item.type!=='spell'||(item.identifier??item.system?.identifier??item.name?.toLowerCase())!==identifier)continue;
  const activities=values(item.system.activities).filter(a=>String(a.activation?.type??'').startsWith('reaction')&&(!activityType||a.type===activityType)&&a.isHidden!==true&&a.canUse!==false);
  const activity=activities[0];if(!activity)continue;
  const base={item,activity};
  const linked=linkedSource(item,activity),cachedFor=item.getFlag?.('dnd5e','cachedFor');
  if(linked||cachedFor){
   const sourceActivity=reactionSpellSource(item,activity,actor);
   // A granted spell cannot fall through to unlimited NPC casting or use a
   // different slot pool when its granting source is depleted or missing.
   if(sourceActivity)return {...base,kind:'linked',sourceActivity,sourceItem:sourceActivity.item};
   continue;
  }
  if(!slotlessNpc&&item.system.canPrepare&&!item.system.prepared)continue;
  const free=activities.find(a=>remaining(a.uses??a.system?.uses)>0);
  if(free)return {...base,activity:free,kind:'free',target:{type:'activityUses',target:'',value:'1'}};
  if(remaining(item.system.uses)>0)return {...base,kind:'free',target:{type:'itemUses',target:'',value:'1'}};
  const bounded=limited(item.system.uses)||activities.some(a=>limited(a.uses??a.system?.uses)||values(a.consumption?.targets).length>0);
  // Exhausted pools must never turn into unlimited NPC casts. Normal slot
  // casters may still use their configured slots after a free pool is depleted.
  if(!bounded&&['atwill','innate'].includes(item.system.method))return {...base,kind:'atwill'};
  if(slotlessNpc){if(!bounded)return {...base,kind:'npc'};continue;}
  candidates.push(base);
 }
 // These activities are native reactions: the casting-turn marker must not
 // conceal Shield or break a Counterspell chain after another spell.
 if(!candidates.length)return null;
 const slots=Object.entries(actor.system?.spells??{}).filter(([key,s])=>slotKey(key)&&Number(s.value)>0).map(([key,s])=>({slot:key,level:key==='pact'?Number(s.level):Number(key.slice(5))})).sort((a,b)=>a.level-b.level||Number(a.slot==='pact')-Number(b.slot==='pact'));
 for(const slot of slots){const base=candidates.find(c=>slot.level>=Math.max(1,Number(c.item.system.level)||1));if(base)return {...base,kind:'slot',...slot};}
 return null;
}

// Keep native linked consumption, scaling and refunds on the granting activity.
export async function useReactionSpellPlan(plan,{usage:extra={},message={}}={}){
 if(plan.kind==='linked')return plan.sourceActivity.use(extra,{configure:false},message);
 const item=plan.item.clone({}, {keepId:true}),activityId=plan.activity.id??plan.activity._id,path='system.activities.'+activityId;
 item.updateSource({'system.method':plan.kind==='slot'?'spell':plan.kind==='npc'||plan.item.actor?.type==='npc'&&plan.kind==='free'?'innate':plan.item.system.method,
  [path+'.consumption.spellSlot']:plan.kind==='slot',[path+'.consumption.targets']:plan.kind==='free'?[plan.target]:[]});
 const usage={consume:{resources:plan.kind==='free'?[0]:[],spellSlot:plan.kind==='slot'},scaling:plan.kind==='slot'?Math.max(0,plan.level-Number(item.system.level??1)):0,...extra};
 if(plan.kind==='slot')usage.spell={slot:plan.slot};
 return item.system.activities.get(activityId).use(usage,{configure:false},message);
}
