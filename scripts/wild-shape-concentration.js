import {createEventQueue} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',wrapped=new WeakSet(),busy=new Set(),waiting=new Map(),enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.('dnd5e',k)??d?.flags?.dnd5e?.[k],resolve=r=>globalThis.fromUuidSync?.(r,{strict:false});
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function wildShapeConcentration(actor){return game.settings.get(ID,'beastSpellsAutomation')===true&&actor?.isPolymorphed&&actor.isOwner&&flag(actor,'transformOptions')?.preset==='wildshape';}
export function remapWildShape(value,from,to){
 if(typeof value==='string')return value===from||value.startsWith(from+'.')?to+value.slice(from.length):value;
 if(Array.isArray(value))return value.map(v=>remapWildShape(v,from,to));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,remapWildShape(v,from,to)]));return value;
}
export function reindexWildConcentration(doc,changes,options){
 const link=options?.rsaWildShapeConcentration;if(!link)return;const registry=globalThis.dnd5e?.registry?.dependents;
 registry?.untrack?.(link.from,doc);if(flag(doc,'dependentOn')===link.to)registry?.track?.(link.to,doc);
}
export async function restoreOffSceneWildTokens(source,target){
 const undo=[];
 try{
  for(const scene of values(game.scenes)){
   if(scene.id===globalThis.canvas?.scene?.id)continue;
   const tokens=values(scene.tokens).filter(t=>t.actorId===source.id&&t.actorLink!==false);if(!tokens.length)continue;
   const prototype=(await target.getTokenDocument()).toObject(),before=tokens.map(t=>t.toObject()),updates=tokens.map(token=>{
    const data=foundry.utils.mergeObject(structuredClone(prototype),flag(token,'previousTokenData')??{});data._id=token.id;
    for(const field of ['x','y','elevation','hidden','rotation','level'])delete data[field];return data;
   });
   await scene.updateEmbeddedDocuments('Token',updates,{diff:false,recursive:false});undo.push(()=>scene.updateEmbeddedDocuments('Token',before,{diff:false,recursive:false}));
  }
  return async()=>{for(const task of undo.reverse())await task();};
 }catch(error){for(const task of undo.reverse())await task();throw error;}
}
export async function transferWildConcentration(source,target,{tokenFrom,tokenTo}={}){
 if(source.uuid===target?.uuid)return async()=>{};
 const roots=values(source.concentration?.effects);if(!roots.length)return async()=>{};
 if(!target?.isOwner)throw Error('The restored Druid is unavailable for concentration transfer.');
 const undo=[],remap=v=>{let data=remapWildShape(v,source.uuid,target.uuid);if(tokenFrom&&tokenTo)data=remapWildShape(data,tokenFrom,tokenTo);return data;};
 const rollback=async()=>{for(const task of undo.reverse())await task();};
 try{
  // Do not overwrite independently newer concentration on the original actor.
  const ids=new Set(roots.map(e=>e.id)),old=values(target.concentration?.effects).filter(e=>!ids.has(e.id));
  for(const effect of old){if(Number(effect._stats?.createdTime)>Number(source._stats?.createdTime??0))throw Error('The original Druid has newer concentration; resolve it before reverting.');}
  for(const effect of old){await effect.update({disabled:true});undo.push(()=>effect.update({disabled:false}));}
  for(const effect of roots){
   const data=remap(effect.toObject()),existing=target.effects.get(effect.id),previous=existing?.toObject();let restored;
   if(existing){await existing.update(data);restored=existing;undo.push(()=>existing.update(previous));}
   else{[restored]=await target.createEmbeddedDocuments('ActiveEffect',[data],{keepId:true});undo.push(()=>target.deleteEmbeddedDocuments('ActiveEffect',[restored.id]));}
   const item=flag(effect,'item')?.uuid;
   // Native spell Regions are keyed by source item, not always registered as
   // concentration dependents. Visit Regions only for this explicit reversion.
   const regions=item?values(game.scenes).flatMap(s=>values(s.regions).filter(r=>flag(r,'item')===item)):[];
   const dependents=[...new Map([...values(effect.getDependents?.()),...regions].map(d=>[d.uuid,d])).values()];
   for(const dependent of dependents){
    // Self-targeted spell effects must move too: their old actor is deleted.
    if(dependent.parent?.uuid===source.uuid&&dependent.documentName==='ActiveEffect'){
     const copy=remap(dependent.toObject()),prior=target.effects.get(dependent.id)?.toObject();
     if(prior){await target.effects.get(dependent.id).update(copy);undo.push(()=>target.effects.get(dependent.id).update(prior));}
     else{await target.createEmbeddedDocuments('ActiveEffect',[copy],{keepId:true});undo.push(()=>target.deleteEmbeddedDocuments('ActiveEffect',[dependent.id]));}
     globalThis.dnd5e?.registry?.dependents?.untrack?.(effect.uuid,dependent);
     undo.push(()=>globalThis.dnd5e?.registry?.dependents?.track?.(effect.uuid,dependent));continue;
    }
    const before={origin:dependent.origin,flags:{dnd5e:structuredClone(dependent.flags?.dnd5e??{}),...(dependent.flags?.[ID]?{[ID]:structuredClone(dependent.flags[ID])}:{})},...(dependent.system?.origin?{system:{origin:structuredClone(dependent.system.origin)}}:{})};
    if(dependent.documentName==='Region'&&dependent.behaviors?.size)before.behaviors=values(dependent.behaviors).map(b=>b.toObject());
    if(before.origin===undefined)delete before.origin;const after=remap(before),options={rsaWildShapeConcentration:{from:effect.uuid,to:restored.uuid}};
    if(JSON.stringify(before)!==JSON.stringify(after)){
     await dependent.update(after,options);reindexWildConcentration(dependent,after,options);
     undo.push(async()=>{const inverse={rsaWildShapeConcentration:{from:restored.uuid,to:effect.uuid}};await dependent.update(before,inverse);reindexWildConcentration(dependent,before,inverse);});
    }
   }
   // Legacy dependency lists are not necessarily registry-backed. Their
   // references were copied onto the restored root, so clear the doomed copy.
   const legacy=flag(effect,'dependents');if(legacy?.length){await effect.setFlag('dnd5e','dependents',[]);undo.push(()=>effect.setFlag('dnd5e','dependents',legacy));}
  }
  return rollback;
 }catch(error){await rollback();throw error;}
}
export async function revertWildConcentration(actor,options,native){
 if(!authority())throw Error('A connected GM is required to preserve Wild Shape concentration.');
 if(busy.has(actor.uuid))throw Error('This Wild Shape is already reverting.');busy.add(actor.uuid);let rollback=async()=>{},tokenCreate,TokenType;
 try{
  if(actor.isToken){
   // Native unlinked reversion creates a replacement token before deleting
   // the Beast token. Migrate into that replacement before native cleanup.
   TokenType=CONFIG.Token.documentClass;tokenCreate=TokenType.create;const token=actor.token;
   TokenType.create=async function(data,config){
    const created=await tokenCreate.call(this,data,config);
    if(data._id===token.id&&config?.parent?.uuid===token.parent.uuid){
     try{rollback=await transferWildConcentration(actor,created.actor,{tokenFrom:token.uuid,tokenTo:created.uuid});}
     catch(error){await created.delete();throw error;}
    }return created;
   };
  }else{
   const target=game.actors.get(flag(actor,'originalActor')),restoreEffects=await transferWildConcentration(actor,target);rollback=restoreEffects;
   // Native linked reversion only relinks tokens on the executing canvas.
   // A player's scene can differ from the GM's, so restore the other linked
   // tokens before native deletion of the temporary actor.
   const restoreTokens=await restoreOffSceneWildTokens(actor,target);rollback=async()=>{await restoreTokens();await restoreEffects();};
  }
  const result=await native.call(actor,options);if(!result){await rollback();return result;}return result;
 }catch(error){await rollback();throw error;}
 finally{if(tokenCreate)TokenType.create=tokenCreate;busy.delete(actor.uuid);}
}
export function installWildConcentration(Type){
 const p=Type?.prototype;if(!p?.revertOriginalForm||wrapped.has(p))return;wrapped.add(p);const revert=p.revertOriginalForm;
 p.revertOriginalForm=async function(options={}){
  if(!wildShapeConcentration(this)||!values(this.concentration?.effects).length)return revert.call(this,options);
  if(authority())return enqueue(()=>revertWildConcentration(this,options,revert));
  const gm=game.users.activeGM;if(!gm)throw Error('A connected GM is required to preserve Wild Shape concentration.');const request=foundry.utils.randomID(),render=options.renderSheet??this.sheet?.rendered;
  const uuid=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Wild Shape reversion.'));},20000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'wildConcentrationRevert',request,actor:this.uuid,user:game.user.id,gm:gm.id});});
  const result=resolve(uuid);if(render)(result?.actor??result)?.sheet?.render(true);return result;
 };
}
Hooks.once('ready',()=>{
 installWildConcentration(CONFIG.Actor.documentClass);
 for(const type of ['ActiveEffect','Region','Item','Actor'])Hooks.on('update'+type,reindexWildConcentration);
 game.socket.on('module.'+ID,packet=>{
  if(packet?.action==='wildConcentrationReply'&&packet.user===game.user.id){const e=waiting.get(packet.request);if(!e)return;waiting.delete(packet.request);clearTimeout(e.timer);packet.error?e.reject(Error(packet.error)):e.resolve(packet.result);return;}
  if(packet?.action!=='wildConcentrationRevert'||!authority()||packet.gm!==game.user.id)return;const user=game.users.get(packet.user),actor=resolve(packet.actor);
  const original=game.actors.get(flag(actor,'originalActor'));
  if(!user?.active||!actor?.testUserPermission(user,'OWNER')||!original?.testUserPermission(user,'OWNER')||!wildShapeConcentration(actor)){
   if(user?.active)game.socket.emit('module.'+ID,{action:'wildConcentrationReply',request:packet.request,user:user.id,error:'You must own both the Wild Shape and its original Druid to revert.'});return;
  }
  actor.revertOriginalForm({renderSheet:false}).then(result=>game.socket.emit('module.'+ID,{action:'wildConcentrationReply',request:packet.request,user:user.id,result:result?.uuid}),error=>game.socket.emit('module.'+ID,{action:'wildConcentrationReply',request:packet.request,user:user.id,error:error.message}));
 });
});
