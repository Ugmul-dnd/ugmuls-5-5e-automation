import {getRegionSpellTable,resolveRegionTriggerActivity} from './region-library.js';
import {isEligibleTarget} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',last=new Map();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.('dnd5e',k)??d?.flags?.dnd5e?.[k],key=i=>i?.identifier??i?.system?.identifier;
export function isConjuredPack(token){return !!token?.flags?.[ID]?.conjuredAnimals||!!flag(token?.actor,'summon')?.origin&&values(token.actor?.items).some(i=>key(i)==='pack-damage');}
function legs(token,movement){
 let from=movement?.origin;if(!from)return [];const result=[];
 for(const point of movement.passed?.waypoints??[]){const to={...from,...point},action=to.action??token.movementAction??CONFIG.Token.movement.defaultAction;
  if(!CONFIG.Token.movement.actions[action]?.teleport&&['x','y','elevation'].some(k=>Number(to[k]??0)!==Number(from[k]??0)))result.push({from,to,action});from=to;
 }return result;
}
export function conjuredPackPathTargets(token,region,movement){
 const path=legs(token,movement);if(!path.length)return [];
 const scene=token.parent,end=token._source??token,data=region.toObject();delete data._id;data.flags={};data.behaviors=[];data.attachment={token:null};
 // Freeze the native Emanation at the pack's final document position. Express
 // a stationary creature's path as the inverse of pack movement, allowing core
 // token/Region geometry to test the whole sweep without sampling or writes.
 data.shapes=data.shapes.map(shape=>shape.type==='emanation'?{...shape,base:{...shape.base,x:end.x,y:end.y,width:end.width,height:end.height,shape:end.shape}}:shape);
 const area=new CONFIG.Region.documentClass(data,{parent:scene}),targets=[];
 // Native wall-restricted Regions carry cached constraints at their previous
 // position. Refresh only the ephemeral document, never persist a second area.
 if(data.restriction?.enabled)area.updateSource({_shapeConstraints:area._computeShapeConstraints()});
 for(const target of values(scene.tokens)){
  if(target.uuid===token.uuid||!isEligibleTarget(target))continue;const position=target._source??target;
  const intersects=path.some(({from,to,action})=>{
   const inverse=p=>({x:position.x+end.x-p.x,y:position.y+end.y-p.y,elevation:Number(position.elevation??0)+Number(end.elevation??0)-Number(p.elevation??0),action});
   const a=inverse(from),b=inverse(to);
   return target.testInsideRegion(area,a)||target.testInsideRegion(area,b)||target.segmentizeRegionMovementPath(area,[a,b]).some(s=>s.type===CONST.REGION_MOVEMENT_SEGMENTS.MOVE);
  });if(intersects)targets.push(target);
 }return targets;
}
export async function triggerConjuredPackMovement(token,movement){
 if(!isConjuredPack(token)||!legs(token,movement).length)return;
 // Core prepares attachment.token into a TokenDocument; its persisted source
 // remains an ID. Accept both representations without requiring a canvas object.
 const scene=token.parent,region=values(scene?.regions).find(r=>r.flags?.[ID]?.conjuredAnimalsToken===token.uuid&&(r._source?.attachment?.token??r.attachment?.token?.id??r.attachment?.token)===token.id);if(!region)return;
 const combat=game.combat,stamp={combat,round:combat?.round,turn:combat?.turn},spell=await fromUuid(region.flags?.dnd5e?.item);
 if(key(spell)!=='conjure-animals'||spell.system?.source?.rules==='2014')return;
 const config=getRegionSpellTable()[spell.name];if(!config||config.enabled===false)return;
 const caster=game.users.get(region.flags[ID].casterUserId),executor=caster?.active&&spell.actor?.testUserPermission(caster,'OWNER')?caster:game.users.activeGM;
 if(executor?.id!==game.user.id)return;
 const root=flag(region,'dependentOn');if(root){const effect=await fromUuid(root);if(!effect||effect.disabled||effect.active===false||effect.duration?.expired)return;}
 if(scene.tokens.get(token.id)!==token)return;
 const trigger=(config.triggers??[]).find(t=>t.events?.length&&resolveRegionTriggerActivity(t,spell,region)?.type==='save');if(!trigger)return;
 const signature=JSON.stringify([stamp.combat?.id,stamp.round,stamp.turn,movement.id,movement.origin,movement.passed?.waypoints]);if(last.get(token.uuid)===signature)return;
 last.set(token.uuid,signature);if(last.size>128)last.delete(last.keys().next().value);
 try{
  const targets=conjuredPackPathTargets(token,region,movement);
  for(const target of targets)await globalThis.Ugmuls55eAutomation.handleRegionEvent({region,scene,triggerId:trigger.id,event:{name:'conjuredAnimalsMove',data:{...stamp,token:target,pack:token.uuid,movement}}});
 }catch(error){if(last.get(token.uuid)===signature)last.delete(token.uuid);throw error;}
}
export function captureConjuredPackUpdate(token,changes,options){
 if(!isConjuredPack(token)||!['x','y','elevation'].some(k=>Object.hasOwn(changes,k)))return;
 options.rsaConjuredPackOrigins??={};const s=token._source??token;options.rsaConjuredPackOrigins[token.id]={x:s.x,y:s.y,elevation:s.elevation};
}
function report(error){console.error('Conjure Animals movement',error);ui.notifications.error('Conjure Animals could not finish its movement trigger. Check the console.');}
Hooks.once('ready',()=>{
 // Foundry 14 reports actual passed waypoints here; ordinary updateToken hooks
 // do not reliably describe movement. Keep a fallback for direct coordinate updates.
 Hooks.on('moveToken',(token,movement)=>triggerConjuredPackMovement(token,movement).catch(report));
 Hooks.on('preUpdateToken',captureConjuredPackUpdate);
 Hooks.on('updateToken',(token,changes,options)=>{const origin=options?.rsaConjuredPackOrigins?.[token.id];if(!origin||options?._movement?.[token.id])return;triggerConjuredPackMovement(token,{origin,passed:{waypoints:[{x:token.x,y:token.y,elevation:token.elevation,action:token.movementAction}]}}).catch(report);});
 Hooks.on('deleteToken',token=>last.delete(token.uuid));
});
