import {tokenDistance} from './shared-distance.js';
const ID='ugmuls-5-5e-automation',prepared=new WeakSet(),values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
export function wordsEligible(activity){
 const item=activity?.item,actor=activity?.actor??item?.actor;
 return game.settings.get(ID,'wordsCreationAutomation')===true&&item?.type==='spell'&&['power-word-heal','power-word-kill'].includes(key(item))&&values(actor?.items).some(i=>i.type==='feat'&&key(i)==='words-of-creation'&&i.system?.source?.rules!=='2014')&&!activity.target?.template?.type;
}
function resolve(ref){try{return typeof ref==='string'?globalThis.fromUuidSync?.(ref,{strict:false}):ref?.document??ref;}catch{return null;}}
export function wordsTargets(message){return values(message?.data?.system?.targets??game.user.targets).map(t=>resolve(t.token??t.document??t)).filter(Boolean);}
export function wordsWarning(activity,targets){
 if(!wordsEligible(activity))return;
 if(targets.length<1||targets.length>2)return 'Words of Creation requires one or two targets. Cast canceled; no resources consumed.';
 if(targets.length===1)return;
 const [a,b]=targets,limit=/^(m|meters?|metres?)$/i.test(String(a.parent?.grid?.units))?3.048:10;
 if(!a.actor||!b.actor||a.actor.uuid===b.actor.uuid||!a.parent||a.parent.id!==b.parent?.id||tokenDistance(a,b)>limit+1e-7)return 'Words of Creation requires two different creatures within 10 feet of each other. Cast canceled; no resources consumed.';
}
export function prepareWords(activity,usage,dialog,message){
 if(!wordsEligible(activity)||usage.cause?.activity)return;
 const warning=wordsWarning(activity,wordsTargets(message));if(warning){ui.notifications.warn(warning);return false;}
 if(prepared.has(activity))return;prepared.add(activity);
 const scale=activity._prepareUsageScaling;activity._prepareUsageScaling=async function(config,msg,item){
  await scale.call(this,config,msg,item);const scaled=item.system.activities.get(this.id);if(!wordsEligible(scaled))return;
  const targets=wordsTargets(msg);if(wordsWarning(scaled,targets))return; // The pre-consumption guard warns and aborts this cast.
  const data=item.toObject(),a=data.system.activities[this.id];
  // Override only this cast's temporary item. A one-target cast retains its native count.
  a.target={...a.target,override:true,affects:{...scaled.target.affects,count:String(targets.length)},template:{...scaled.target.template}};
  item.updateSource(data);item.prepareFinalAttributes();
  msg.data??={};msg.data.flags??={};msg.data.flags[ID]={...msg.data.flags[ID],activityOverrideData:data};msg.data.flags.dnd5e={...msg.data.flags.dnd5e,item:{...msg.data.flags.dnd5e?.item,data}};
  globalThis.Ugmuls55eAutomationPendingCast?.rebind?.(item.system.activities.get(this.id),msg);
 };
}
Hooks.once('init',()=>game.settings.register(ID,'wordsCreationAutomation',{name:'Bard: Words of Creation',hint:'Allow one or two creatures for Power Word Heal/Kill while Words of Creation is owned. Reject two targets farther than 10 feet apart before consumption.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationWordsCreation={eligible:wordsEligible,warning:wordsWarning,targets:wordsTargets};Hooks.on('dnd5e.preUseActivity',prepareWords);});
