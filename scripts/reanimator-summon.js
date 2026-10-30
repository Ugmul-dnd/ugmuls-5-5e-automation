const ID='ugmuls-5-5e-automation',PACK='Compendium.dnd-ravenloft-horrors-within.options.Item.',wrapped=new WeakSet();
const MODS={arcane:{id:'rhwSMArcaneConVv',name:'Arcane Conduit'},ferocity:{id:'rhwSMFerocityuzY',name:'Ferocity'},bloated:{id:'rhwSMBloated8heS',name:'Bloated'},gaunt:{id:'rhwSMGauntb5vfDl',name:'Gaunt'},moist:{id:'rhwSMMoistFP81Qo',name:'Moist'}};
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],enabled=()=>game.settings.get(ID,'reanimatorSummonAutomation')===true;
const refs=i=>[i?._stats?.compendiumSource,i?._stats?.duplicateSource,i?.uuid],named=(i,name,id)=>i?.name?.trim().toLowerCase()===name.toLowerCase()||refs(i).some(r=>r?.endsWith('.'+id));
const feature=(actor,name,id)=>values(actor?.items).find(i=>i.type==='feat'&&named(i,name,id));
export const reanimatedSummon=activity=>activity?.type==='summon'&&named(activity.item,'Reanimated Companion','rhwRECompanionqV');
export function modificationPlan(actor){
 const strange=feature(actor,'Strange Modifications','rhwREStrangeMok1'),macabre=feature(actor,'Macabre Modifications','rhwREMacabreMo23'),refined=feature(actor,'Refined Reanimation','rhwRERefinedRebY');
 return {count:refined?3:macabre?2:strange?1:0,options:macabre||refined?Object.keys(MODS):strange?['arcane','ferocity']:[],improved:!!feature(actor,'Improved Reanimation','rhwREImprovedRlq')};
}
export function validateModifications(actor,choices){const plan=modificationPlan(actor);if(!Array.isArray(choices)||choices.length!==plan.count||new Set(choices).size!==choices.length||choices.some(k=>!plan.options.includes(k)))throw Error('Choose '+plan.count+' different available Reanimated Companion modifications.');return plan;}
async function modificationDocuments(choices){return Promise.all(choices.map(async key=>{const item=await fromUuid(PACK+MODS[key].id);if(item?.type!=='feat')throw Error('The native '+MODS[key].name+' modification is unavailable.');return {key,item};}));}
export async function chooseModifications(actor){
 const plan=modificationPlan(actor);if(!plan.count)return [];
 const items=await modificationDocuments(plan.options),escape=foundry.utils.escapeHTML;
 const content='<p>Choose '+plan.count+' different modifications for this companion.</p><div style="display:grid;gap:10px;max-height:60vh;overflow:auto">'+items.map(({key,item})=>'<label><input type="checkbox" name="reanimationMod" value="'+key+'"> <strong>'+escape(item.name)+'</strong><div>'+item.system.description.value+'</div></label>').join('')+'</div>';
 for(;;){const choices=await foundry.applications.api.DialogV2.wait({window:{title:'Reanimated Companion: Modifications'},content,rejectClose:false,buttons:[{action:'summon',label:'Continue to Summon',default:true,callback:(event,button,dialog)=>Array.from(dialog.element.querySelectorAll('[name="reanimationMod"]:checked'),input=>input.value)},{action:'cancel',label:'Cancel',callback:()=>null}]});if(choices==null||choices===false)return null;try{validateModifications(actor,choices);return choices;}catch(error){ui.notifications.warn(error.message);}}
}
export function buildReanimationChanges(activity,base,choices,documents){
 const plan=validateModifications(activity.actor,choices);if(documents.length!==choices.length||documents.some(d=>!choices.includes(d.key)))throw Error('Missing companion modification data.');const result=foundry.utils.deepClone(base),updates=result.actorUpdates;updates.items??=[];updates.effects??=[];
 // Keep each companion's modifications in its own ActorDelta; never mutate the
 // cached import or another companion that uses the same world actor.
 result.tokenUpdates??={};result.tokenUpdates.actorLink=false;
 updates['flags.'+ID+'.reanimatedCompanion']={source:activity.item.uuid,owner:activity.actor.uuid,modifications:[...choices],improved:plan.improved};
 const rollData=activity.getRollData?.()??{},ability=activity.ability??activity.match?.ability;
 const dc=Number(activity.flat?.save??rollData.abilities?.[ability]?.dc??rollData.attributes?.spell?.dc??activity.actor.system?.attributes?.spell?.dc);
 for(const {key,item}of documents){
  if(!choices.includes(key))throw Error('Unexpected companion modification.');const data=item.toObject();data.folder=null;data.flags??={};data.flags[ID]={...data.flags[ID],reanimatorModification:key};data._stats??={};data._stats.compendiumSource=PACK+MODS[key].id;
  if(key==='gaunt')for(const a of Object.values(data.system.activities??{}))if(a.type==='save'){if(!Number.isFinite(dc)||dc<=0)throw Error('The Artificer needs a valid spell save DC for Gaunt.');a.save.dc={calculation:'',formula:String(dc)};}
  const existing=updates.items.findIndex(i=>i._id===data._id);if(existing>=0)updates.items[existing]=data;else updates.items.push(data);
 }
 // The source book already drives Death Burst with this flag and an upgrade
 // effect. Enable it from the actual feature grant, preserving Bloated's bonus.
 let improvement=updates.effects.find(e=>e._id==='wruWhd88xvkdHMoB');
 if(plan.improved){if(!improvement){improvement={_id:'wruWhd88xvkdHMoB',name:'Death Burst Improvement',type:'base',disabled:false,transfer:false,origin:activity.item.uuid,system:{changes:[{key:'flags.world.dbDice',value:4,type:'upgrade',priority:null}]}};updates.effects.push(improvement);}improvement.disabled=false;}
 else if(improvement)improvement.disabled=true;
 // The native swipe's type is empty even though its rules specify Necrotic.
 // Filling only an empty type is necessary for resistance handling to work.
 if(choices.includes('bloated')){result.tokenUpdates.width=2;result.tokenUpdates.height=2;}
 return result;
}
export function reanimationDamageOptions(card,options={}){
 if(!enabled()||options.rsaUndoDamage||options.ignore===true||options.ignore?.resistance===true)return options;
 const actor=card?.getAssociatedActor?.()??card?.getAssociatedActivity?.()?.actor;let improved=flag(actor,'reanimatedCompanion')?.improved===true;
 const item=card?.getAssociatedItem?.()??card?.getAssociatedActivity?.()?.item,source=flag(item,'lifeTransferBurstSource');if(source){const receipt=flag(game.messages.get(source.transfer),'lifeTransferResolved');if(receipt?.request===source.request&&receipt.companion===source.token&&receipt.actor===actor?.uuid)improved=receipt.improved===true;}
 if(!improved)return options;
 const resistance=new Set(values(options.ignore?.resistance));resistance.add('necrotic');return {...options,ignore:{...options.ignore,resistance}};
}
function damageCard(ref){if(typeof ref!=='string')return ref;try{return fromUuidSync(ref,{strict:false})??game.messages.get(ref.replace(/^ChatMessage\./,''));}catch{return game.messages.get(ref.replace(/^ChatMessage\./,''));}}
export function installReanimation(SummonType,ActorType=CONFIG.Actor?.documentClass,TrayType=globalThis.customElements?.get?.('damage-application')){
 const p=SummonType?.prototype;if(p?.use&&p.getChanges&&p.placeSummons&&!wrapped.has(p)){
  wrapped.add(p);const use=p.use,place=p.placeSummons,changes=p.getChanges;
  p.use=async function(usage={},...args){if(!enabled()||!reanimatedSummon(this)||usage.create===false||usage.create?.summons===false)return use.call(this,usage,...args);
   const choices=await chooseModifications(this.actor);if(choices===null)return;return use.call(this,{...usage,summons:{...usage.summons,rsaReanimationMods:choices}},...args);
  };
  p.placeSummons=async function(options={}){if(!enabled()||!reanimatedSummon(this))return place.call(this,options);let choices=options.rsaReanimationMods;if(!Array.isArray(choices)){choices=await chooseModifications(this.actor);if(choices===null)return;}validateModifications(this.actor,choices);return place.call(this,{...options,rsaReanimationMods:choices});};
  p.getChanges=async function(actor,profile,options={}){const result=await changes.call(this,actor,profile,options);if(!enabled()||!reanimatedSummon(this))return result;
   const choices=options.rsaReanimationMods;validateModifications(this.actor,choices);const documents=await modificationDocuments(choices);
   // The source actor is read only; pass its weapon metadata separately from the
   // cloned native update payload to avoid cloning live DataModels.
   const output=buildReanimationChanges(this,result,choices,documents);
   for(const weapon of values(actor.items))if(weapon.type==='weapon'&&(weapon.identifier??weapon.system?.identifier)==='dreadful-swipe'&&!values(weapon.system.damage?.base?.types).length){let update=output.actorUpdates.items.find(i=>i._id===weapon.id);if(!update){update={_id:weapon.id};output.actorUpdates.items.push(update);}update['system.damage.base.types']=['necrotic'];}
   return output;
  };
 }
 const ap=ActorType?.prototype;if(ap?.calculateDamage&&!wrapped.has(ap)){wrapped.add(ap);const calculate=ap.calculateDamage;ap.calculateDamage=function(damages,options={}){return calculate.call(this,damages,reanimationDamageOptions(damageCard(options.originatingMessage??options.origin),options));};}
 const tp=TrayType?.prototype;if(tp?.getMergedOptions&&!wrapped.has(tp)){wrapped.add(tp);const get=tp.getMergedOptions;tp.getMergedOptions=function(uuid){return reanimationDamageOptions(this.chatMessage,get.call(this,uuid));};}
}
Hooks.once('init',()=>game.settings.register(ID,'reanimatorSummonAutomation',{name:'Reanimator: Companion Modifications',hint:'Choose native modifications when summoning the Reanimated Companion. Honor Strange/Macabre/Superior choice counts, native scaling and effects; Improved Reanimation upgrades Death Burst and bypasses only Necrotic resistance.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>installReanimation(CONFIG.DND5E?.activityTypes?.summon?.documentClass));
