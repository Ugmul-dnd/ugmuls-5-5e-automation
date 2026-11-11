import {startupActors} from "./startup-actors.js";
import {createEventQueue,describeTarget} from "./shared-activity-card.js";
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),enabled=()=>game.settings.get(ID,'hillsTumbleAutomation')===true;
const authority=()=>game.user.isGM&&game.users.activeGM?.id===game.user.id;
export const hillsTumbleItem=item=>item?.type==='feat'&&item.system?.source?.rules!=='2014'&&((item.identifier??item.system?.identifier)==='hills-tumble'||/^hill['’]s tumble$/i.test(item.name?.trim()??''));
export const hillsTumbleActivity=activity=>enabled()&&activity?.type==='utility'&&hillsTumbleItem(activity.item);
export const hillsTumbleTarget=actor=>['tiny','sm','med','lg'].includes(actor?.system?.traits?.size);
export async function syncHillsTumble(item){
 if(!authority()||!enabled()||!hillsTumbleItem(item)||!item.actor)return;
 const activities=values(item.system?.activities).filter(a=>a.type==='utility');if(!activities.length)return;
 let effect=values(item.effects).find(e=>values(e.statuses).includes('prone'));
 if(!effect){
  const native=await foundry.documents.ActiveEffect.fromStatusEffect('prone',{parent:item}),data=native.toObject();delete data._id;
  data.name='Prone';data.transfer=false;data.disabled=false;data.duration={rounds:null,turns:null,seconds:null,value:null,expired:false,expiry:null};
  data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,isTemporary:true};data.flags[ID]={...data.flags[ID],hillsTumbleProne:true};
  [effect]=await item.createEmbeddedDocuments('ActiveEffect',[data]);
 }
 if(!effect)throw Error('Hill’s Tumble could not add its native Prone effect.');
 const changes={};
 for(const activity of activities)if(!values(activity.effects).some(e=>(e._id??e.id)===effect.id||e.uuid===effect.uuid))changes['system.activities.'+activity.id+'.effects']=[...values(activity.effects).map(e=>e.toObject?.()??e),{_id:effect.id}];
 if(Object.keys(changes).length)await item.update(changes);
}
export function guardHillsTumble(activity,usage,dialog,message){
 if(!hillsTumbleActivity(activity))return;
 const recorded=message?.data?.system?.targets;
 const targets=recorded??values(game.user.targets).map(t=>({token:(t.document??t).uuid}));
 if(targets.length!==1){ui.notifications.warn('Hill’s Tumble requires one targeted Large or smaller creature.');return false;}
 const token=globalThis.fromUuidSync?.(targets[0].token,{strict:false});
 if(!token?.actor||!hillsTumbleTarget(token.actor)){ui.notifications.warn('Hill’s Tumble can only knock a Large or smaller creature Prone.');return false;}
 // Record the user's selection before consumption. A GM handling the effect
 // must use this target, never the GM's currently selected tokens.
 message.data??={};message.data.system??={};message.data.system.targets=[describeTarget(token)];
}
function synchronize(item){if(authority()&&hillsTumbleItem(item))enqueue(()=>syncHillsTumble(item)).catch(report);}
function report(error){console.error('Hill’s Tumble',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'hillsTumbleAutomation',{name:'Goliath: Hill’s Tumble',hint:'Add native Prone to Hill’s Tumble and automatically apply it to its single recorded Large-or-smaller target on use. Native uses and shared Effect Undo remain in control; no extra Reaction is spent.',scope:'world',config:true,type:Boolean,default:true,onChange:()=>{if(enabled())for(const actor of startupActors())for(const item of values(actor.items))synchronize(item);}}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationHillsTumble={activity:hillsTumbleActivity,target:hillsTumbleTarget};
 for(const actor of startupActors())for(const item of values(actor.items))synchronize(item);
 for(const event of ['createItem','updateItem'])Hooks.on(event,synchronize);
 Hooks.on('createActor',actor=>{for(const item of values(actor.items))synchronize(item);});
 Hooks.on('createToken',token=>{for(const item of values(token.actor?.items))synchronize(item);});
 Hooks.on('dnd5e.preUseActivity',guardHillsTumble);
});
