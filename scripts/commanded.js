const ID='ugmuls-5-5e-automation',prepared=new WeakSet(),values=v=>Array.from(v?.values?.()??v??[]);
export function addCommandedMarker(item,id){
 const data=item.toObject(),activity=data.system.activities[id];if(activity?.type!=='save')return;
 data.effects??=[];let marker=data.effects.find(e=>e.name==='Commanded');
 if(!marker){marker={_id:'rsaCommanded0001',name:'Commanded',img:item.img,type:'base',disabled:false,transfer:false,system:{changes:[]},duration:{value:null,units:'seconds',expiry:'targetEnd',expired:false},description:'Carry out the word chosen for Command on your next turn.',flags:{dnd5e:{isTemporary:true},[ID]:{commanded:true}}};data.effects.push(marker);}
 const effects=values(activity.effects);if(!effects.some(e=>(e._id??e.id)===marker._id))effects.push({_id:marker._id,onSave:false});activity.effects=effects;
 item.updateSource(data);item.prepareFinalAttributes();return data;
}
export function prepareCommanded(activity){
 if(game.settings.get(ID,'commandedMarkerAutomation')!==true||activity?.item?.type!=='spell'||(activity.item.identifier??activity.item.system?.identifier)!=='command'||activity.type!=='save'||prepared.has(activity))return;
 prepared.add(activity);const scale=activity._prepareUsageScaling;
 activity._prepareUsageScaling=async function(config,message,item){await scale.call(this,config,message,item);const data=addCommandedMarker(item,this.id);if(!data)return;message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],activityOverrideData:data};message.data.flags.dnd5e={...message.data.flags.dnd5e,item:{...message.data.flags.dnd5e?.item,data}};globalThis.Ugmuls55eAutomationPendingCast?.rebind?.(item.system.activities.get(this.id),message);};
}
Hooks.once('init',()=>game.settings.register(ID,'commandedMarkerAutomation',{name:'Command: Commanded Reminder',hint:'Add a Commanded reminder effect to failed Command saves. Retain native Apply/Undo and timed effect expiry; carry out the chosen command manually.',scope:'world',config:true,type:Boolean,default:true}));
export function prepareCommandedExpiry(effect){if(effect.getFlag?.(ID,'commanded')??effect.flags?.[ID]?.commanded)effect.updateSource({'duration.value':null,'duration.expiry':'targetEnd'});}
async function recoverCommandedExpiry(){
 if(game.users.activeGM?game.users.activeGM.id!==game.user.id:!game.user.isGM)return;
 const actors=new Map(values(game.actors).map(a=>[a.uuid,a]));for(const scene of values(game.scenes))for(const token of values(scene.tokens))if(token.actor)actors.set(token.actor.uuid,token.actor);
 for(const actor of actors.values()){const updates=values(actor.effects).filter(e=>(e.getFlag?.(ID,'commanded')??e.flags?.[ID]?.commanded)&&!e.disabled&&!e.duration?.expired&&(e.duration?.expiry!=='targetEnd'||e.duration?.value!=null)).map(e=>({_id:e.id,'duration.value':null,'duration.expiry':'targetEnd'}));if(updates.length)await actor.updateEmbeddedDocuments('ActiveEffect',updates);}
}
Hooks.once('ready',()=>{Hooks.on('dnd5e.preUseActivity',prepareCommanded);Hooks.on('preCreateActiveEffect',prepareCommandedExpiry);recoverCommandedExpiry().catch(error=>console.error('Commanded expiry',error));});
