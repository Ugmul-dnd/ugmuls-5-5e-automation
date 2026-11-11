import {startupActors} from "./startup-actors.js";
import {createEventQueue} from "./shared-activity-card.js";
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export async function syncFontRecovery(actor){
 if(!authority()||!actor)return;
 const font=values(actor.items).some(i=>i.type==='feat'&&key(i)==='font-of-inspiration'&&i.system?.source?.rules!=='2014');
 const updates=[];for(const item of values(actor.items).filter(i=>i.type==='feat'&&key(i)==='bardic-inspiration'&&i.system?.source?.rules!=='2014')){
  const recovery=values(item.system.uses?.recovery),saved=item.getFlag?.(ID,'fontRecovery');
  if(game.settings.get(ID,'fontInspirationAutomation')===true&&font){
   if(recovery.some(r=>r.period==='sr'&&r.type==='recoverAll'))continue;
   updates.push({_id:item.id,'system.uses.recovery':[...recovery.filter(r=>r.period!=='sr'),{period:'sr',type:'recoverAll'}],['flags.'+ID+'.fontRecovery']:{before:saved?.before??foundry.utils.deepClone(recovery)}});
  }else if(saved)updates.push({_id:item.id,'system.uses.recovery':saved.before,['flags.'+ID+'.-=fontRecovery']:null});
 }
 if(updates.length)await actor.updateEmbeddedDocuments('Item',updates);
}
function report(error){console.error('Font of Inspiration',error);}
async function recover(){for(const actor of startupActors())await enqueue(()=>syncFontRecovery(actor));}
Hooks.once('init',()=>game.settings.register(ID,'fontInspirationAutomation',{name:'Bard: Font of Inspiration Recovery',hint:'Automatically enable native Short Rest recovery for Bardic Inspiration while Font of Inspiration is owned. Preserve existing recovery rules and restore the prior configuration if the feature is removed.',scope:'world',config:true,type:Boolean,default:true,onChange:()=>recover().catch(report)}));
Hooks.once('ready',()=>{recover().catch(report);for(const event of ['createItem','updateItem','deleteItem'])Hooks.on(event,item=>{if(['font-of-inspiration','bardic-inspiration'].includes(key(item)))enqueue(()=>syncFontRecovery(item.actor??item.parent)).catch(report);});Hooks.on('createActor',actor=>enqueue(()=>syncFontRecovery(actor)).catch(report));Hooks.on('createToken',token=>enqueue(()=>syncFontRecovery(token.actor)).catch(report));});
