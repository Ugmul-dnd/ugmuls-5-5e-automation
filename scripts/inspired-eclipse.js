import {createEventQueue,startupActors} from './shared-activity-card.js';
import {reactionUsed,recordReactionUse} from './reaction-tracker.js';
import {inspirationData} from './bardic-inspiration.js';
const ID='ugmuls-5-5e-automation',TELEPORT='rsaEclipsePort01',MOVE='rsaInspiredEclipse',enqueue=createEventQueue(),waiting=new Map(),placing=new Set(),wrapped=new WeakSet(),attacks=new WeakMap();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],key=i=>i?.identifier||i?.system?.identifier;
const enabled=()=>game.settings.get(ID,'inspiredEclipseAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),owns=(a,u)=>!!a&&(u?.isGM||a.testUserPermission?.(u,'OWNER')),turn=()=>game.combat?.started?[game.combat.id,game.combat.round,game.combat.turn].join(':'):null;
const resolve=r=>{try{return typeof r==='string'?(globalThis.fromUuidSync?.(r,{strict:false})??game.messages.get(r.replace(/^ChatMessage\./,''))):r;}catch{return null;}},live=e=>!!e&&!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired&&!e.system?.expired;
export const eventideFeature=a=>values(a?.items).find(i=>i.type==='feat'&&(i.name==="Eventide's Splendor"||i.id==='hofComEventidesS'||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.hofComEventidesS'))));
export const eclipseFeature=a=>values(a?.items).find(i=>i.type==='feat'&&(key(i)==='moons-inspiration'||i.name==="Moon's Inspiration"||i.id==='hofComMoonsInspi'||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.hofComMoonsInspi'))))??eventideFeature(a);
export function registerEclipseMovement(){
 const actions=CONFIG.Token?.movement?.actions;if(!actions?.blink)return;
 // Ignoring movement limits does not zero its recorded cost. Use a dedicated
 // native teleport action so history/Undo and region events remain intact,
 // without counting this jump against distance or cost for the turn.
 actions[MOVE]={...actions.blink,label:'Inspired Eclipse',teleport:true,measure:false,canSelect:()=>false,getCostFunction:()=>()=>0};
}
const native=f=>values(f?.system?.activities).find(a=>(a.id??a._id)==='BDvndpGS01CsGOUP'||a.name==='Inspired Eclipse'||a.name==='Shadow of the New Moon');
const inspired=activity=>activity?.type==='utility'&&activity.activation?.type==='bonus'&&(key(activity.item)==='bardic-inspiration'||activity.item?.name==='Bardic Inspiration');
const paid=(card,id)=>values(card?.system?.deltas?.item?.[id]).some(d=>d.keyPath==='system.uses.spent'&&d.delta>0);
const eclipseEffects=actor=>values(actor?.effects).filter(e=>live(e)&&flag(e,'inspiredEclipse'));
function tokenFor(activity){const t=activity.getUsageToken?.()??activity.actor?.token;return t?.document??t;}
export function captureEclipse(activity,usage,message){
 const actor=activity.actor??activity.item?.actor,feature=eclipseFeature(actor);if(!enabled()||!message?.data)return;
 if(usage.rsaEclipseBefore?.length){message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],eclipseSpellBefore:{actor:actor.uuid,effects:usage.rsaEclipseBefore}};}
 if(!feature||!inspired(activity)||!paid(message.data,activity.item.id))return;const source=tokenFor(activity),range=native(feature)?.range;if(!source||!range?.value)return;
 message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],eclipseSnapshot:{actor:actor.uuid,feature:feature.uuid,token:source.uuid,resource:activity.item.id,range:{value:range.value,units:range.units},turn:turn(),request:foundry.utils.randomID(),entries:[{actor:actor.uuid}],...(eventideFeature(actor)?{eventide:eventideFeature(actor).uuid,recipients:values(message.data.system?.targets).flatMap(t=>{const token=resolve(t.token);return token?.actor&&token.actor.uuid!==actor.uuid?[{actor:token.actor.uuid,token:token.uuid}]:[];})}:{})}};
}
function recipientGift(card,s,actor){return values(card.system?.targets).some(t=>(resolve(t.token)?.actor??resolve(t.actor))?.uuid===actor.uuid)&&values(actor.effects).some(e=>live(e)&&inspirationData(e)?.sourceActor===s.actor&&(e.system?.origin?.message===card.uuid||e.system?.origin?.message===card.id));}
function gift(card,s){return values(card.system?.targets).some(t=>{const target=resolve(t.token)?.actor??resolve(t.actor);return target&&target.uuid!==s.actor&&values(target.effects).some(e=>live(e)&&inspirationData(e)?.sourceActor===s.actor&&(e.system?.origin?.message===card.uuid||e.system?.origin?.message===card.id));});}
export function eclipseContext(card,user=game.user,{teleport=false,recipient}={}){
 const snapshot=flag(card,'eclipseSnapshot'),sourceActor=resolve(snapshot?.actor),entry=recipient&&recipient!==snapshot?.actor?snapshot?.recipients?.find(e=>e.actor===recipient):null,s=entry?{...snapshot,token:entry.token}:snapshot,actor=entry?resolve(entry.actor):sourceActor,feature=eclipseFeature(sourceActor),token=resolve(s?.token),used=entry?flag(card,'eclipseRecipientUses')?.[actor?.id??actor?.uuid]:flag(card,'eclipseUsed');
 if(recipient&&recipient!==snapshot?.actor&&!entry||entry&&(snapshot.eventide!==eventideFeature(sourceActor)?.uuid))return null;
 const activity=card?.getAssociatedActivity?.({scaled:true}),sourceValid=s?.manual?activity?.id===(native(feature)?.id??native(feature)?._id)&&activity?.item?.uuid===feature?.uuid:paid(card,s?.resource)&&inspired(activity);
 if(!enabled()||!s||!sourceValid||!owns(actor,user)||feature?.uuid!==s.feature||token?.actor?.uuid!==actor.uuid||card.type!=='usage'||card.isContentVisible===false||card.whisper?.length&&!user.isGM&&card.author?.id!==user.id&&!card.whisper.includes(user.id)||flag(card,'pendingCast')||flag(card,'targetsConfirmationPending')||flag(card,'targetsConfirmationCanceled')||s.turn!==turn()||flag(actor,'eclipseGrant')?.request!==s.request)return null;
 if(teleport){const effect=resolve(used?.effect);if(!used||used.teleport||entry&&reactionUsed(actor)||!live(effect)||effect.parent?.uuid!==actor.uuid||flag(effect,'inspiredEclipse')?.request!==s.request)return null;}
 else if(s.manual||used||!flag(card,'eclipseReady')||!gift(card,s)||entry&&!recipientGift(card,s,actor))return null;
 return {card,s,actor,sourceActor,feature,token,used,recipient:entry?.actor};
}
export function recordEclipseGift(card){return enqueue(async()=>{
 if(!authority())return;const s=flag(card,'eclipseSnapshot'),actor=resolve(s?.actor);if(!s||s.manual||!enabled()||eclipseFeature(actor)?.uuid!==s.feature||!paid(card,s.resource)||!gift(card,s)||s.turn!==turn())return;
 if(!flag(card,'eclipseReady')){if(s.eventide){s.recipients=values(card.system?.targets).flatMap(t=>{const token=resolve(t.token);return token?.actor&&token.actor.uuid!==s.actor&&recipientGift(card,s,token.actor)?[{actor:token.actor.uuid,token:token.uuid}]:[];});s.entries=[{actor:s.actor},...s.recipients.map(e=>({actor:e.actor}))];await card.setFlag(ID,'eclipseSnapshot',s);}await card.setFlag(ID,'eclipseReady',true);}
 for(const entry of s.recipients??[]){const recipient=resolve(entry.actor);if(recipient&&gift(card,s)&&flag(recipient,'eclipseGrant')?.request!==s.request)await recipient.setFlag(ID,'eclipseGrant',{card:card.id,request:s.request,timestamp:Number(card.timestamp??0)});}
 const prior=flag(actor,'eclipseGrant');if(prior?.request!==s.request){if(prior?.timestamp>Number(card.timestamp??0))return;await actor.setFlag(ID,'eclipseGrant',{card:card.id,request:s.request,timestamp:Number(card.timestamp??0)});}
 globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
});}
export async function syncEclipseTeleport(item){
 const found=values(item?.system?.activities).find(a=>(a.id??a._id)===TELEPORT&&flag(a,'eclipseTeleport'));
 if(!enabled()){if(found)await item.update({['system.activities.-='+TELEPORT]:null});return;}
 const activity=native(item);if(!activity||found)return;
 await item.update({['system.activities.'+TELEPORT]:{_id:TELEPORT,name:'Teleport',type:'utility',activation:{type:'special',override:true,condition:'As part of Inspired Eclipse'},consumption:{spellSlot:false,targets:[]},range:{...activity.range,override:true},target:{override:true,prompt:false,template:{type:''},affects:{type:'self',count:'1'}},effects:[],roll:{formula:'',prompt:false},flags:{[ID]:{eclipseTeleport:true}}}});
}
export function eclipseSeesDestination(token,point){
 const object=token.object,origin=token.getVisionOrigin?.()??{...object.center,elevation:token.elevation??0},destination={...point,elevation:origin.elevation??point.elevation};
 if(object.checkCollision?.(destination,{origin,type:'sight',mode:'any'}))return false;
 if(token.parent?.tokenVision===false)return true;
 const source=object.vision,modes=CONFIG.Canvas?.detectionModes,level=token.parent?.levels?.get?.(token.level)??globalThis.canvas?.level;
 if(source?.los&&modes&&level){
  // FOV shape only covers the token's own sight radius. Light perception can
  // see illuminated space beyond it. Test this Bard's modes, not another
  // controlled token's vision, and test a point rather than the invisible Bard.
  const config={object:null,level,tests:[{point:destination,level,los:new Map()}]};let tested=false;
  for(const id of ['basicSight','lightPerception']){const mode=token.detectionModes?.[id],implementation=modes[id];if(!mode?.enabled||!implementation?.testVisibility)continue;tested=true;if(implementation.testVisibility(source,mode,config))return true;}
  if(tested)return false;
 }
 // A GM can have token vision disabled/inactive while processing a player's
 // request. Keep the authoritative wall/level test without using stale FOV.
 return true;
}
export function eclipseDestination(token,position,range){
 const scene=token?.parent,grid=scene?.grid,size=Number(grid?.size),x=Number(position?.x),y=Number(position?.y),elevation=Number(token?.elevation??0);
 if(!token?.actor||!Number.isFinite(x)||!Number.isFinite(y)||!(size>0)||Number(position.elevation??elevation)!==elevation||token.actor.statuses?.has('blinded'))throw Error('Choose a visible destination on the Bard’s current level.');
 // Foundry 14 token centers are 3D. Mixing that origin with a 2D destination
 // makes grid distance NaN, so even nearby destinations would be rejected.
 const a={...(token.getCenterPoint?.()??{x:token.x+token.width*size/2,y:token.y+token.height*size/2}),elevation},b={x:x+token.width*size/2,y:y+token.height*size/2,elevation};
 const metric=/^(m|meters?|metres?)$/i.test(grid.units??'ft'),feet=range.units==='m'?Number(range.value)/0.3048:Number(range.value),limit=metric?feet*0.3048:feet,distance=grid.measurePath?.([a,b])?.distance;
 if(!['ft','m'].includes(range.units)||!Number.isFinite(limit)||!(limit>0)||!Number.isFinite(distance)||distance>limit+1e-7)throw Error('Choose a destination within '+range.value+' '+range.units+'.');
 const rect=scene.dimensions?.sceneRect;if(rect&&(!rect.contains(x,y)||!rect.contains(x+token.width*size-0.01,y+token.height*size-0.01)))throw Error('The destination must fit inside the scene.');
 const object=token.object;if(!object?.center||scene.id!==globalThis.canvas?.scene?.id)throw Error('The Bard’s scene must be open for teleport placement.');
 if(!eclipseSeesDestination(token,b))throw Error('The Bard must be able to see the destination.');
 for(const other of values(scene.tokens)){if(other.uuid===token.uuid||!other.actor||other.level!==token.level||Math.abs(Number(other.elevation??0)-elevation)>1e-7)continue;const ox=Number(other.x),oy=Number(other.y);if(x<ox+Number(other.width)*size-0.01&&x+Number(token.width)*size>ox+0.01&&y<oy+Number(other.height)*size-0.01&&y+Number(token.height)*size>oy+0.01)throw Error('Choose an unoccupied space.');}
 return {x,y,elevation};
}
export function eclipseOperation(operation,payload,user=game.user){return enqueue(async()=>{
 if(!authority()||!user?.active)throw Error('A connected GM is required for Inspired Eclipse.');
 if(operation==='manual'){
  const effect=resolve(payload.effect),actor=effect?.parent,feature=eclipseFeature(actor),card=resolve(effect?.system?.origin?.message),activity=card?.getAssociatedActivity?.({scaled:true}),profile=native(feature);
  if(!enabled()||!owns(actor,user)||!live(effect)||!values(effect.statuses).includes('invisible')||activity?.item?.uuid!==feature?.uuid||activity?.id!==(profile?.id??profile?._id)||card?.getAssociatedActor?.()?.uuid!==actor?.uuid)throw Error('Activate the native Inspired Eclipse feature before teleporting.');
  const existing=flag(card,'eclipseSnapshot');if(existing){if(!existing.manual||existing.turn!==turn())throw Error('This Inspired Eclipse activation is no longer available.');if(!flag(card,'eclipseUsed')){await effect.setFlag(ID,'inspiredEclipse',{card:card.id,request:existing.request,token:existing.token});await card.setFlag(ID,'eclipseUsed',{effect:effect.uuid,request:existing.request});}if(flag(actor,'eclipseGrant')?.request!==existing.request)await actor.setFlag(ID,'eclipseGrant',{card:card.id,request:existing.request,timestamp:Number(card.timestamp??0)});return {card:card.id};}
  const recorded=resolve(card.getAssociatedToken?.()),token=recorded?.actor?.uuid===actor.uuid?recorded:tokenFor(activity),start=effect.start,stamp=start?.combat&&Number.isInteger(start.round)&&Number.isInteger(start.turn)?[start.combat,start.round,start.turn].join(':'):turn();if(!token||token.actor?.uuid!==actor.uuid||stamp!==turn())throw Error('This Inspired Eclipse activation is no longer available.');
  const request=foundry.utils.randomID(),s={manual:true,actor:actor.uuid,feature:feature.uuid,token:token.uuid,range:{value:profile.range.value,units:profile.range.units},turn:stamp,request,entries:[{actor:actor.uuid}]};
  const before=flag(effect,'inspiredEclipse');await effect.setFlag(ID,'inspiredEclipse',{card:card.id,request,token:token.uuid});try{await card.update({['flags.'+ID+'.eclipseSnapshot']:s,['flags.'+ID+'.eclipseUsed']:{effect:effect.uuid,request}});}catch(error){if(before)await effect.setFlag(ID,'inspiredEclipse',before);else await effect.unsetFlag(ID,'inspiredEclipse');throw error;}await actor.setFlag(ID,'eclipseGrant',{card:card.id,request,timestamp:Number(card.timestamp??0)});globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return {card:card.id};
 }
 if(operation==='expire'){
  const actor=resolve(payload.actor);if(!owns(actor,user))throw Error('You cannot change these effects.');const ids=values(payload.effects).map(resolve).filter(e=>e?.parent?.uuid===actor.uuid&&flag(e,'inspiredEclipse')).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments('ActiveEffect',ids);return {};
 }
 const card=game.messages.get(payload.card),c=eclipseContext(card,user,{teleport:operation==='teleport',recipient:payload.recipient});if(!c||!['activate','teleport'].includes(operation))throw Error('Inspired Eclipse is no longer available for this Bardic Inspiration.');
 if(operation==='activate'){
  const profile=native(c.feature),source=values(c.feature.effects).find(e=>values(e.statuses).includes('invisible')&&values(profile.effects).some(p=>(p._id??p.id)===(e.id??e._id)));if(!source)throw Error('Inspired Eclipse is missing its native Invisible effect.');
  const data=source.toObject();delete data._id;delete data.start;data.name='Inspired Eclipse';data.disabled=false;data.transfer=false;data.origin=c.feature.uuid;data.start=CONFIG.ActiveEffect.documentClass.getEffectStart();data.system={...data.system,origin:{actor:c.sourceActor.uuid,item:c.feature.uuid,activity:profile.uuid,message:card.uuid}};if(c.recipient)data.duration={value:null,units:'seconds',expiry:'targetStart',expired:false};data.flags={...data.flags,[ID]:{...data.flags?.[ID],inspiredEclipse:{card:card.id,request:c.s.request,token:c.token.uuid}}};
  const effect=(await c.actor.createEmbeddedDocuments('ActiveEffect',[data]))[0];if(!effect)throw Error('Inspired Eclipse invisibility could not be applied.');
  try{await card.update({...useUpdate(c,{effect:effect.uuid,request:c.s.request}),['flags.'+ID+'.effectUndoHistory']:[...values(flag(card,'effectUndoHistory')),{id:foundry.utils.randomID(),effectUuid:effect.uuid,sourceMessage:card.uuid,before:null}]});}catch(error){await effect.delete();throw error;}
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return {card:card.id};
 }
 const from={x:c.token.x,y:c.token.y,elevation:c.token.elevation??0};if(['x','y','elevation'].some(k=>Number(payload.from?.[k])!==Number(from[k])))throw Error('The Bard moved during placement. Choose the destination again.');
 const point=eclipseDestination(c.token,payload.destination,c.s.range);if(point.x===from.x&&point.y===from.y)return {moved:false};
 let marker;try{if(c.recipient){marker=await recordReactionUse({actor:c.actor,item:c.feature,type:'utility',activation:{type:'reaction'},getUsageToken:()=>c.token},{},{message:card});if(game.settings.get(ID,'reactionTracker')===true&&game.combat?.started&&values(game.combat.combatants).some(e=>e.actor?.uuid===c.actor.uuid)&&!marker)throw Error('Could not reserve the recipient’s Reaction.');}await card.update(useUpdate(c,{...c.used,teleport:{pending:true,from,destination:point}}));}catch(error){if(marker)await marker.update({disabled:true});throw error;}
 try{const complete=await c.token.move({...point,action:MOVE},{autoRotate:false,showRuler:false,constrainOptions:{ignoreWalls:true,ignoreCost:true}}),moved=['x','y','elevation'].some(k=>Number(c.token[k]??0)!==Number(from[k]));await card.update(useUpdate(c,{...c.used,...(moved?{teleport:{from,destination:point,complete}}:{})}));if(!moved&&marker)await marker.update({disabled:true});return {moved};}
 catch(error){if(['x','y','elevation'].every(k=>Number(c.token[k]??0)===Number(from[k]))){await card.update(useUpdate(c,c.used));if(marker)await marker.update({disabled:true});}throw error;}
 finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
});}
async function operate(operation,payload){const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return eclipseOperation(operation,payload);const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Inspired Eclipse.'));},20000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'eclipseOperation',operation,payload,request,user:game.user.id,gm:gm.id});});}
function useUpdate(c,value){return c.recipient?{['flags.'+ID+'.eclipseRecipientUses']:{...flag(c.card,'eclipseRecipientUses'),[c.actor.id??c.actor.uuid]:value}}:{['flags.'+ID+'.eclipseUsed']:value};}
export async function placeEclipseTeleport(card,recipient){
 const c=eclipseContext(card,game.user,{teleport:true,recipient});if(!c)throw Error('Activate Inspired Eclipse before teleporting.');if(placing.has(c.actor.uuid))return;placing.add(c.actor.uuid);
 try{const from={x:c.token.x,y:c.token.y,elevation:c.token.elevation??0},data=c.token.toObject();delete data._id;ui.notifications.info('Inspired Eclipse: click a destination within '+c.s.range.value+' '+c.s.range.units+'. Esc cancels.');
  const placed=await canvas.tokens.placeTokens([data],{create:false,allowRotation:false,preConfirm:({document})=>{try{eclipseDestination(c.token,document,c.s.range);return true;}catch(error){ui.notifications.warn(error.message);return false;}}});
  if(!placed?.length)return;return await operate('teleport',{card:card.id,recipient,from,destination:{x:placed[0].x,y:placed[0].y,elevation:placed[0].elevation}});
 }finally{placing.delete(c.actor.uuid);}
}
export async function activateEclipse(card,recipient){await operate('activate',{card:card.id,recipient});return placeEclipseTeleport(card,recipient);}
export function renderEclipse(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){for(const old of node.querySelectorAll(':scope > .rsa-inspired-eclipse'))old.remove();if(card?.isContentVisible===false)continue;for(const recipient of [undefined,...(flag(card,'eclipseSnapshot')?.recipients??[]).map(e=>e.actor)]){const active=eclipseContext(card,game.user,{recipient}),teleport=eclipseContext(card,game.user,{teleport:true,recipient});if(!active&&!teleport)continue;
  const row=document.createElement('div'),button=document.createElement('button');row.className='rsa-inspired-eclipse rsa-attack-actions';button.type='button';button.textContent=(active?'Inspired Eclipse':'Inspired Eclipse — Teleport')+(recipient?' — '+(active??teleport).actor.name:'');button.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();button.disabled=true;try{await(active?activateEclipse(card,recipient):placeEclipseTeleport(card,recipient));}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});row.append(button);node.append(row); }
 }
}
export async function useEclipseTeleport(actor){
 let card=game.messages.get(flag(actor,'eclipseGrant')?.card);if(!eclipseContext(card,game.user,{teleport:true,recipient:actor.uuid})){
  const feature=eclipseFeature(actor),candidate=values(actor?.effects).find(e=>live(e)&&(!flag(e,'inspiredEclipse')||flag(resolve(e.system?.origin?.message),'eclipseSnapshot')?.manual)&&values(e.statuses).includes('invisible')&&resolve(e.system?.origin?.activity)?.item?.uuid===feature?.uuid&&resolve(e.system?.origin?.activity)?.id===(native(feature)?.id??native(feature)?._id));
  if(candidate){const result=await operate('manual',{effect:candidate.uuid});card=game.messages.get(result.card);}
 }
 return placeEclipseTeleport(card,actor.uuid);
}
export function installEclipseTeleport(Type){const p=Type?.prototype;if(!p?.use||wrapped.has(p))return;wrapped.add(p);const original=p.use,own=Object.hasOwn(p,'use');p.use=function(...args){if(enabled()&&flag(this,'eclipseTeleport'))return useEclipseTeleport(this.actor??this.item.actor).catch(report);return (own?original:Object.getPrototypeOf(p).use).apply(this,args);};}
function expire(actor,ids){if(ids?.length&&(game.user.isGM||actor?.isOwner))operate('expire',{actor:actor.uuid,effects:ids}).catch(report);}
const effectIds=actor=>eclipseEffects(actor).map(e=>e.uuid);
function report(error){console.error('Inspired Eclipse',error);ui.notifications.error(error.message);}
function refresh(doc){globalThis.Ugmuls55eAutomationChatRefresh?.request('inspiredEclipse',doc);}
function giftChanged(effect){const ref=effect.system?.origin?.message,card=resolve(ref);if(flag(card,'eclipseSnapshot')){recordEclipseGift(card).catch(report);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}if(flag(effect,'inspiredEclipse'))refresh(effect);else if(authority()&&effect.parent?.documentName==='Actor'&&live(effect)){const activity=resolve(effect.system?.origin?.activity),feature=eclipseFeature(effect.parent);if(feature&&activity?.item?.uuid===feature.uuid&&activity.id===(native(feature)?.id??native(feature)?._id))eclipseOperation('manual',{effect:effect.uuid}).catch(report);}}
Hooks.once('init',()=>{registerEclipseMovement();game.settings.register(ID,'inspiredEclipseAutomation',{name:'Moon Bard: Inspired Eclipse',hint:'After Bardic Inspiration applies, offer Inspired Eclipse on that usage card. Apply the native invisibility and select one visible, unoccupied teleport destination using native token placement and free teleport movement. Add a Teleport activity to Moon’s Inspiration.',scope:'world',config:true,type:Boolean,default:true});});
Hooks.once('ready',()=>{
 installEclipseTeleport(CONFIG.DND5E.activityTypes?.utility?.documentClass);
 const sync=item=>{if(item?.actor&&eclipseFeature(item.actor)?.uuid===item.uuid&&(authority()||!game.users.activeGM&&item.isOwner))syncEclipseTeleport(item).catch(report);};
 for(const actor of startupActors()){const f=eclipseFeature(actor);if(f)sync(f);}
 for(const event of ['createItem','updateItem'])Hooks.on(event,item=>{sync(item);if(item?.actor&&eclipseFeature(item.actor)?.uuid===item.uuid)refresh(item);});Hooks.on('deleteItem',item=>{if(item.name==="Moon's Inspiration"||item.id==='hofComMoonsInspi'||item.name==="Eventide's Splendor"||item.id==='hofComEventidesS')refresh(item);});
 Hooks.on('dnd5e.postActivityConsumption',captureEclipse);Hooks.on('ugmuls55eAutomation.buffEffectsApplied',card=>recordEclipseGift(card).catch(report));
 for(const event of ['createActiveEffect','updateActiveEffect'])Hooks.on(event,giftChanged);
 Hooks.on('deleteActiveEffect',(effect,options={})=>{giftChanged(effect);if(flag(effect,'inspiredEclipse')){const card=game.messages.get(flag(effect,'inspiredEclipse').card);if(authority()&&options.rsaUndoEffect){if(flag(card,'eclipseUsed')?.effect===effect.uuid)card.unsetFlag(ID,'eclipseUsed').catch(report);const uses=flag(card,'eclipseRecipientUses');if(uses&&Object.values(uses).some(u=>u.effect===effect.uuid))card.setFlag(ID,'eclipseRecipientUses',Object.fromEntries(Object.entries(uses).filter(([,u])=>u.effect!==effect.uuid))).catch(report);}}});
 Hooks.on('updateActor',(actor,changes)=>{if(changes['flags.'+ID+'.eclipseGrant']||changes.flags?.[ID]?.eclipseGrant)refresh(actor);});
 Hooks.on('updateCombat',(combat,changes={})=>{if(!['turn','round','started'].some(k=>k in changes))return;refresh(combat);});Hooks.on('dnd5e.renderChatMessage',renderEclipse);
 Hooks.on('dnd5e.preRollAttackV2',config=>{const actor=config.subject?.actor??config.subject?.item?.actor;attacks.set(config,{actor,ids:effectIds(actor)});});Hooks.on('dnd5e.rollAttackV2',(rolls,config)=>{const before=attacks.get(config);attacks.delete(config);if(rolls?.length)expire(before?.actor,before?.ids);});
 Hooks.on('dnd5e.preUseActivity',(activity,usage,_dialog,message)=>{if(activity.item?.type==='spell'&&!['regionTriggered','recurringTrigger','riderTriggered'].some(k=>message.data?.flags?.[ID]?.[k]))usage.rsaEclipseBefore=effectIds(activity.actor??activity.item.actor);});
 const spellComplete=card=>{const before=flag(card,'eclipseSpellBefore');if(before&&!flag(card,'pendingCast')&&!flag(card,'targetsConfirmationPending')&&!flag(card,'targetsConfirmationCanceled'))expire(resolve(before.actor),before.effects);};
 Hooks.on('dnd5e.postUseActivity',(_a,_u,r)=>{if(r?.message)spellComplete(r.message);});Hooks.on('updateChatMessage',(card,changes)=>{if(changes['flags.'+ID+'.pendingCast']===false||changes.flags?.[ID]?.pendingCast===false)spellComplete(card);});
 Hooks.on('preUpdateChatMessage',(card,changes,options)=>{const next=changes['flags.'+ID+'.damageUndoHistory']??changes.flags?.[ID]?.damageUndoHistory;if(!next||card.type!=='damage')return;const old=new Set(values(flag(card,'damageUndoHistory')).map(r=>r.id));if(values(next).some(r=>!old.has(r.id)&&values(r.changes).some(c=>['value','temp'].includes(c.key)&&Number(c.after)<Number(c.before)))){const actor=card.getAssociatedActor?.();options.rsaEclipseDamage={actor:actor?.uuid,effects:effectIds(actor)};}});
 Hooks.on('updateChatMessage',(_card,_changes,options={})=>{if(authority()&&options.rsaEclipseDamage)expire(resolve(options.rsaEclipseDamage.actor),options.rsaEclipseDamage.effects);});
 game.socket.on('module.'+ID,p=>{if(p?.action==='eclipseReply'&&p.user===game.user.id){const job=waiting.get(p.request);if(!job)return;waiting.delete(p.request);clearTimeout(job.timer);p.error?job.reject(Error(p.error)):job.resolve(p.result);return;}if(p?.action!=='eclipseOperation'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user);if(!user?.active)return;eclipseOperation(p.operation,p.payload,user).then(result=>game.socket.emit('module.'+ID,{action:'eclipseReply',request:p.request,user:user.id,result}),error=>game.socket.emit('module.'+ID,{action:'eclipseReply',request:p.request,user:user.id,error:error.message}));});
});
