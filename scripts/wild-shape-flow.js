const ID='ugmuls-5-5e-automation',wrapped=new WeakSet(),busy=new Set(),finalized=new WeakMap(),completed=new WeakSet();
const key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
export function immediateWildShape(activity){
 return game.settings.get(ID,'immediateWildShapeAutomation')===true&&activity?.type==='transform'&&activity.transform?.mode==='cr'&&activity.transform?.preset==='wildshape'&&activity.item?.system?.source?.rules!=='2014'&&['wild-shape','circle-forms'].includes(key(activity.item));
}
export async function completeWildShape(activity,results){
 const card=results?.message,uuid=card?.getFlag?.('dnd5e','transform.uuid')??card?.flags?.dnd5e?.transform?.uuid,actor=activity.actor;
 // Use the caster recorded by the native activity, never a newly controlled or
 // targeted token. Finalize runs after the native browser stores its selection.
 if(!immediateWildShape(activity)||!uuid||!card?.id||!actor?.isOwner||!activity.canTransform||flag(card,'wildShapeAutoTransformed')||completed.has(card)||busy.has(actor.uuid))return;
 busy.add(actor.uuid);
 try{
  const source=await fromUuid(uuid);if(!source)throw Error('The selected Wild Shape creature is unavailable.');
  const result=await actor.transformInto(source,activity.settings);if(result==null)return;
  completed.add(card);
  // This exact card completed its transform. Remove its manual action so a
  // later click cannot transform again from the same resource expenditure.
  await card.update({[`flags.${ID}.wildShapeAutoTransformed`]:{actor:actor.uuid,source:uuid},'system.buttons':(card.system?.buttons??[]).filter(b=>b.action!=='transformActor')});
  return result;
 }finally{busy.delete(actor.uuid);}
}
export function installWildShapeFlow(Type){
 const p=Type?.prototype;if(!p?._finalizeUsage||!p.use||wrapped.has(p))return;wrapped.add(p);const finalize=p._finalizeUsage,use=p.use,ownUse=Object.hasOwn(p,'use');
 p._finalizeUsage=async function(config,results){
  const result=await finalize.call(this,config,results);if(immediateWildShape(this))finalized.set(results,this);return result;
 };
 p.use=async function(...args){
  const results=await (ownUse?use:Object.getPrototypeOf(p).use).apply(this,args),activity=results&&finalized.get(results);if(!activity)return results;finalized.delete(results);
  // Finish native consumption and post-use hooks before copying the caster's
  // state into the form. Use the finalized clone's exact transformation settings.
  try{await completeWildShape(activity,results);}catch(error){console.error('Wild Shape transformation',error);ui.notifications.error(error.message);}return results;
 };
 const actions=Type.metadata?.usage?.actions,manual=actions?.transformActor;
 if(manual)actions.transformActor=function(event,target,card){if(immediateWildShape(this)&&(flag(card,'wildShapeAutoTransformed')||completed.has(card)||busy.has(this.actor?.uuid)))return;return manual.call(this,event,target,card);};
}
Hooks.once('init',()=>game.settings.register(ID,'immediateWildShapeAutomation',{name:'Druid: Immediate Wild Shape',hint:'After confirming a Beast in the native Wild Shape or Circle Forms browser, transform the feature’s caster immediately without a second chat-card click.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>installWildShapeFlow(CONFIG.DND5E.activityTypes.transform.documentClass));
