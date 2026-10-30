import {getRegionSpellTable,resolveRegionTriggerActivity} from './region-library.js';
const ID='ugmuls-5-5e-automation',pending=new Set(),wrapped=new WeakSet();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.('dnd5e',k)??d?.flags?.dnd5e?.[k];
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),enabled=spell=>key(spell)==='conjure-animals'&&spell.system?.source?.rules!=='2014'&&getRegionSpellTable()[spell.name]?.enabled!==false;
function concentration(spell){return values(spell.actor?.concentration?.effects).find(e=>e.active!==false&&!e.disabled&&!e.duration?.expired&&(flag(e,'item')?.uuid===spell.uuid||flag(e,'item')?.id===spell.id));}
export function correctConjuredAnimalsSave(activity){
 if(activity?.type==='save'&&enabled(activity.item)&&activity.damage)activity.damage.onSave='none';
}
export function installConjuredAnimalsSave(Type){
 const p=Type?.prototype;if(!p||wrapped.has(p))return;wrapped.add(p);
 // Correct prepared activity data without modifying the owned item or PHB.
 // This applies to native/scaled clones and card-associated reconstructed items.
 for(const name of ['prepareFinalData','use']){
  const original=p[name],own=Object.hasOwn(p,name);if(!original)continue;
  p[name]=function(...args){
   if(name==='use')correctConjuredAnimalsSave(this);
   const result=(own?original:Object.getPrototypeOf(p)[name]).apply(this,args);
   if(name==='prepareFinalData')correctConjuredAnimalsSave(this);return result;
  };
 }
 const roll=p.rollDamage,ownRoll=Object.hasOwn(p,'rollDamage');if(!roll)return;
 p.rollDamage=function(config={},dialog={},message={}){
  if(this.type==='save'&&enabled(this.item)){
   correctConjuredAnimalsSave(this);
   // Native SaveActivity forwards onSave to the damage card. Override explicit
   // stale "half" data too, keeping origin, targets, scaling and flags intact.
   message={...message,data:{...message.data,system:{...message.data?.system,onSave:'none'}}};
  }return (ownRoll?roll:Object.getPrototypeOf(p).rollDamage).call(this,config,dialog,message);
 };
}
export function prepareConjuredAnimals(activity,profile,data){
 if(activity?.type!=='summon'||!enabled(activity.item))return;const spell=activity.item;
 data.flags??={};data.flags[ID]??={};data.flags[ID].conjuredAnimals={item:spell.uuid,activity:activity.uuid,level:Number(activity.getRollData?.().item?.level??spell.system.level),origin:activity.getUsageToken?.()?.uuid,concentration:concentration(spell)?.uuid,userId:game.user.id};
}
export async function createConjuredAnimalsRegion(token,options={},userId=game.user.id){
 const scene=token?.parent;if(!authority()||!scene||!token.actor||pending.has(token.uuid))return;
 const stamped=token.flags?.[ID]?.conjuredAnimals,native=flag(token.actor,'summon'),origin=native?.origin;if(!stamped&&!origin)return;
 if(values(scene.regions).some(r=>r.flags?.[ID]?.conjuredAnimalsToken===token.uuid))return;
 pending.add(token.uuid);
 try{
  const source=await fromUuid(origin??stamped.item),spell=source?.item??source;if(!spell||!enabled(spell)||stamped&&stamped.item!==spell.uuid)return;
  const creator=game.users.get(userId);if(!creator?.active||!creator.isGM&&!spell.actor?.testUserPermission(creator,'OWNER'))return;
  if(scene.tokens.get(token.id)!==token)return;
  const root=concentration(spell);if(!root||stamped?.concentration&&stamped.concentration!==root.uuid)return;
  const config=getRegionSpellTable()[spell.name],save=(config?.triggers??[]).map(t=>resolveRegionTriggerActivity(t,spell)).find(a=>a?.type==='save')??values(spell.system.activities).find(a=>a.type==='save');
  if(!save)throw Error('Conjure Animals needs its native save activity.');
  const pack=values(token.actor.items).find(i=>key(i)==='pack-damage'),packSave=values(pack?.system?.activities).find(a=>a.type==='save');
  // Newer PHB pack data expresses the area as a save range instead of a
  // template. Use that native radius; the legacy spell description uses 10 ft.
  let radius=Number(packSave?.range?.value??packSave?.target?.template?.size??10),units=packSave?.range?.units??'ft';
  const convert=globalThis.dnd5e?.utils?.convertLength;if(convert)radius=convert(radius,units,scene.grid.units,{strict:false});
  const scale=scene.grid.size/scene.grid.distance;if(!Number.isFinite(scale)||scale<=0||!Number.isFinite(radius)||radius<=0)throw Error('Conjure Animals needs valid scene distance units.');
  const levels=values(token.levels);if(!levels.length&&globalThis.canvas?.scene===scene&&canvas.level?.id)levels.push(canvas.level.id);
  const caster=stamped?.origin??values(scene.tokens).find(t=>t.actor?.uuid===spell.actor?.uuid)?.uuid??spell.actor.uuid;
  const level=Number(stamped?.level??native?.level??spell.system.level),casterUserId=stamped?.userId??userId;
  if(scene.tokens.get(token.id)!==token||concentration(spell)?.uuid!==root.uuid)return;
  const created=await scene.createEmbeddedDocuments('Region',[{
   name:spell.name+' - Emanation',color:creator.color,
   shapes:[{type:'emanation',gridBased:true,radius:radius*scale,base:{type:'token',x:token.x,y:token.y,width:token.width,height:token.height,shape:token.shape,rotation:0}}],
   attachment:{token:token.id},...(levels.length?{levels}:{}),restriction:{enabled:true,type:'move'},visibility:config?.hideRegionFromPlayers===true?CONST.REGION_VISIBILITY.GAMEMASTER:CONST.REGION_VISIBILITY.ALWAYS,highlightMode:'coverage',
   flags:{dnd5e:{item:spell.uuid,activity:save.uuid,origin:caster,spellLevel:level,dependentOn:root.uuid},[ID]:{conjuredAnimalsToken:token.uuid,excludedToken:token.uuid,casterUserId}}
  }]);
  // Concentration/token deletion can complete while Region creation is in
  // flight. Remove only our newly created surviving documents in that race.
  if(scene.tokens.get(token.id)!==token||concentration(spell)?.uuid!==root.uuid){const live=new Set(values(scene.regions).map(r=>r.id)),ids=created.filter(r=>live.has(r.id)).map(r=>r.id);if(ids.length)await scene.deleteEmbeddedDocuments('Region',ids);}
 }finally{pending.delete(token.uuid);}
}
async function recoverAnimals(){
 if(!authority())return;
 // Recovery only inspects the current scene at load; no per-turn actor/chat scans.
 for(const token of globalThis.canvas?.scene?.tokens??[])if(token.flags?.[ID]?.conjuredAnimals||flag(token.actor,'summon')?.origin)await createConjuredAnimalsRegion(token);
}
function report(error){console.error('Conjure Animals Emanation',error);ui.notifications.error('Conjure Animals could not place its Emanation. Check the console.');}
Hooks.once('ready',()=>{
 installConjuredAnimalsSave(CONFIG.DND5E?.activityTypes?.save?.documentClass);
 Hooks.on('dnd5e.summonToken',prepareConjuredAnimals);
 Hooks.on('createToken',(token,options,userId)=>createConjuredAnimalsRegion(token,options,userId).catch(report));
 Hooks.on('canvasReady',()=>recoverAnimals().catch(report));recoverAnimals().catch(report);
 // Native token attachment and concentration dependency cleanup own deletion.
});
