// The system's HP automation and combat-tracker modules can both create the
// same fixed-ID condition. Share a per-actor queue across their public paths.
const queues=new Map(),installed=new WeakSet(),statuses=new Set(["dead","unconscious"]);
const values=v=>Array.from(v?.values?.()??v??[]);
function enqueue(actor,task){
 const key=actor.uuid??actor,previous=queues.get(key)??Promise.resolve();
 const next=previous.catch(()=>{}).then(task);queues.set(key,next);
 return next.finally(()=>{if(queues.get(key)===next)queues.delete(key);});
}
export function existingDownedEffect(actor,status){
 return values(actor.effects).find(effect=>effect.system?.type===status||effect.statuses?.has?.(status)||Array.isArray(effect.statuses)&&effect.statuses.includes(status));
}
export function installDownedStatusCompatibility(Type=CONFIG.Actor?.documentClass){
 const prototype=Type?.prototype;if(!prototype||installed.has(prototype)||typeof prototype.updateDowned!=="function"||typeof prototype.toggleStatusEffect!=="function")return;
 installed.add(prototype);const downed=prototype.updateDowned,toggle=prototype.toggleStatusEffect;
 prototype.updateDowned=function(...args){return enqueue(this,()=>{
  // Preserve native healing cleanup and all settings/important-NPC decisions.
  // A pre-existing Dead effect, including a legacy status effect, is terminal.
  if(Number(this.system?.attributes?.hp?.value)===0&&existingDownedEffect(this,"dead"))return;
  return downed.apply(this,args);
 });};
 prototype.toggleStatusEffect=function(status,options={},...args){
  if(!statuses.has(status))return toggle.call(this,status,options,...args);
  return enqueue(this,async()=>{
   const existing=existingDownedEffect(this,status);
   if(options.active===true&&existing){
    if(existing.disabled)await existing.update({disabled:false});
    // Tracker modules may additionally request an overlay on the existing status.
    if(options.overlay!==undefined&&existing.getFlag?.("core","overlay")!==options.overlay)return Promise.resolve(existing.setFlag("core","overlay",options.overlay)).then(()=>existing);
    return existing;
   }
   if(options.active===false&&!existing)return;
   return toggle.call(this,status,options,...args);
  });
 };
}
Hooks.once("ready",()=>installDownedStatusCompatibility());
