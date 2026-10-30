import {createEventQueue,describeTarget} from "./shared-activity-card.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
import {effectiveCombatant} from "./companion-turns.js";
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),wrapped=new WeakSet(),busy=new Set(),waiting=new Map(),placements=new Map();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],key=i=>i?.identifier??i?.system?.identifier;
const resolve=r=>{if(typeof r!=='string')return r;try{return globalThis.fromUuidSync?.(r,{strict:false})??game.messages.get(r.replace(/^ChatMessage\./,''));}catch{return game.messages.get(r.replace(/^ChatMessage\./,''));}};
const unable=actor=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(status=>actor?.statuses?.has(status));
const enabled=()=>game.settings.get(ID,'lifeTransferAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),owns=(a,u)=>!!a&&!!u?.active&&(u.isGM||a.testUserPermission?.(u,'OWNER'));
export function lifeTransferActivity(a){return a?.type==='heal'&&(a.id==='3fVJGkeXgS9gxcO1'||a.name?.trim().toLowerCase()==='life transfer')&&(a.item?.name?.trim().toLowerCase()==='refined reanimation'||[a.item?._stats?.compendiumSource,a.item?._stats?.duplicateSource].some(s=>s?.endsWith('.rhwRERefinedRebY')));}
function ownerOf(actor){const source=resolve(actor?.getFlag?.('dnd5e','summon.origin')),item=source?.item??source;return item?.name?.trim().toLowerCase()==='reanimated companion'||[item?._stats?.compendiumSource,item?._stats?.duplicateSource].some(s=>s?.endsWith('.rhwRECompanionqV'))?item.actor:null;}
export function transferCompanions(actor,scene=globalThis.canvas?.scene){return values(scene?.tokens).filter(t=>t.actor&&t.actor.uuid!==actor?.uuid&&ownerOf(t.actor)?.uuid===actor?.uuid&&Number(t.actor.system?.attributes?.hp?.value)>0&&!t.actor.statuses?.has('dead'));}
export function transferAmount(caster,companion){const hp=caster.system.attributes.hp,amount=Number(companion.system.attributes.hp.value),before=Number(hp.value),max=Number(hp.effectiveMax??Number(hp.max)+Number(hp.tempmax??0));if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(before)||!Number.isFinite(max))throw Error('Life Transfer requires a living linked companion and valid caster HP.');return {amount,before,after:Math.min(max,before+amount),healed:Math.max(0,Math.min(max,before+amount)-before)};}
function deathBurst(actor){return values(actor.items).flatMap(i=>key(i)==='death-burst'||i.name?.trim().toLowerCase()==='death burst'?values(i.system?.activities):[]).find(a=>a.type==='save');}
function ownedTransferActivity(actor,payload){
 const direct=resolve(payload.activity);if(lifeTransferActivity(direct)&&direct.actor?.uuid===actor?.uuid)return direct;
 return values(actor?.items).flatMap(i=>values(i.system?.activities)).find(a=>lifeTransferActivity(a)&&(!payload.activityId||a.id===payload.activityId));
}
export function beginLifeTransfer(payload,user=game.user){
 if(!authority()||!enabled()||!user?.active)throw Error('A connected GM is required for Life Transfer.');
 const actor=resolve(payload.actor),activity=ownedTransferActivity(actor,payload),scene=game.scenes?.get?.(payload.scene)??(globalThis.canvas?.scene?.id===payload.scene?canvas.scene:null);
 if(!owns(actor,user)||!activity||!scene||!user.isGM&&user.viewedScene&&user.viewedScene!==scene.id)throw Error('Life Transfer requires your own caster and current scene.');
 if(unable(actor))throw Error('You cannot take a Reaction in your current condition.');const used=reactionUsed(actor);if(used&&used.getFlag?.(ID,'reactionUsage')!==payload.card)throw Error('Your Reaction is already used.');
 const card=payload.card?game.messages.get(payload.card):null;if(card&&flag(card,'lifeTransferResolved'))throw Error('Life Transfer on this card has already resolved.');
 return {candidates:transferCompanions(actor,scene).map(t=>({token:t.uuid,name:t.name??t.actor.name}))};
}
export function lifeTransferBurstData(actor,token,burst,receipt){
 // Players may own the caster without owning or being able to read its NPC.
 // Bake the native prepared companion values before parenting this temporary
 // activity to the caster; native use() can then clone it without an ownership failure.
 const data=burst.item.toObject(),id=burst.id,activity=data.system.activities[id],rollData=token.actor.getRollData();data.effects=[];data.system.activities={[id]:activity};
 activity.activation={type:'special',override:true};activity.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};activity.effects=[];activity.appliedEffects=[];
 for(const part of activity.damage?.parts??[]){if(part.custom?.enabled)part.custom.formula=CONFIG.Dice.BasicRoll.replaceFormulaData(part.custom.formula,rollData,{missing:0});if(part.bonus)part.bonus=CONFIG.Dice.BasicRoll.replaceFormulaData(part.bonus,rollData,{missing:0});}
 const dc=Number(burst.save?.dc?.value??actor.system?.attributes?.spell?.dc);if(!Number.isFinite(dc)||dc<=0)throw Error('Death Burst requires a valid native save DC.');activity.save.dc={calculation:'',formula:String(dc)};
 data.flags??={};data.flags[ID]={...data.flags[ID],lifeTransferBurstSource:{token:token.uuid,actor:token.actor.uuid,request:receipt.request,transfer:receipt.card,improved:flag(token.actor,'reanimatedCompanion')?.improved===true}};
 data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};return data;
}
export async function resolveLifeTransfer(payload,user=game.user){
 if(!authority()||!enabled()||!user?.active)throw Error('A connected GM is required for Life Transfer.');
 const actor=resolve(payload.actor),activity=ownedTransferActivity(actor,payload),token=resolve(payload.token),companion=token?.actor;
 if(!owns(actor,user)||!lifeTransferActivity(activity)||activity.actor?.uuid!==actor.uuid||ownerOf(companion)?.uuid!==actor.uuid||typeof payload.request!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(payload.request))throw Error('Life Transfer requires your own feature and linked Reanimated Companion.');
 const prior=flag(actor,'lifeTransferReceipts')?.[payload.request],sacrifice=flag(companion,'lifeTransferSacrifice');
 if(prior){if(prior.companion!==token.uuid)throw Error('Life Transfer receipt does not match this companion.');if(prior.complete||sacrifice?.request===payload.request&&sacrifice.state==='complete'){const result={...prior,complete:true};if(!user.isGM)result.burstData=lifeTransferBurstData(actor,token,deathBurst(companion),result);return result;}throw Error('Life Transfer is partially recorded. Check its existing card before retrying.');}
 if(sacrifice?.state==='reserved')throw Error('This companion already has a Life Transfer in progress.');
 let card=payload.card?game.messages.get(payload.card):null;
 if(card&&(card.getAssociatedActor?.()?.uuid!==actor.uuid||!lifeTransferActivity(card.getAssociatedActivity?.())))throw Error('That card is not this caster’s Life Transfer.');
 if(card&&flag(card,'lifeTransferResolved'))throw Error('Life Transfer on this card has already resolved.');
 if(unable(actor))throw Error('You cannot take a Reaction in your current condition.');
 const existingReaction=reactionUsed(actor);if(existingReaction&&existingReaction.getFlag?.(ID,'reactionUsage')!==card?.id)throw Error('Your Reaction is already used.');
 if(!transferCompanions(actor,token?.parent).some(t=>t.uuid===token.uuid))throw Error('The linked companion is no longer alive.');
 const burst=deathBurst(companion);if(!burst)throw Error('The companion has no native Death Burst save activity.');
 let health=transferAmount(actor,companion);const oldCompanionFlag=flag(companion,'lifeTransferSacrifice');let marker,newReaction=false,healed=false,committed=false;
 const casterToken=values(token.parent?.tokens).find(t=>t.actor?.uuid===actor.uuid);
 if(!card)card=await activity._createUsageMessage({data:{system:{targets:casterToken?[describeTarget(casterToken)]:[],buttons:[]},flags:{[ID]:{lifeTransferRequest:payload.request}}}});
 if(!card?.id)throw Error('Life Transfer could not create its native activity card.');
 try{
  marker=existingReaction??await recordReactionUse(activity,{}, {message:card});newReaction=!existingReaction&&!!marker;
  if(game.settings.get(ID,'reactionTracker')===true&&effectiveCombatant(actor)&&marker?.getFlag?.(ID,'reactionUsage')!==card.id)throw Error('Could not reserve your Reaction.');
  // Reserve this companion before either HP change; all mutation requests run on
  // the active GM queue. Receipts make repeated socket requests idempotent.
  health=transferAmount(actor,companion);
  await companion.setFlag(ID,'lifeTransferSacrifice',{request:payload.request,actor:actor.uuid,amount:health.amount,state:'reserved'});
  const receipt={request:payload.request,actor:actor.uuid,companion:token.uuid,amount:health.amount,healed:health.healed,casterName:actor.name??'Caster',companionName:token.name??companion.name??'Reanimated Companion',before:health.before,after:health.after,card:card.id,burst:burst.uuid,complete:false};
  receipt.improved=flag(companion,'reanimatedCompanion')?.improved===true;const burstData=!user.isGM?lifeTransferBurstData(actor,token,burst,receipt):null;
  await actor.update({'system.attributes.hp.value':health.after,[`flags.${ID}.lifeTransferReceipts.${payload.request}`]:receipt});healed=true;
  await companion.update({'system.attributes.hp.value':0,[`flags.${ID}.lifeTransferSacrifice`]:{request:payload.request,actor:actor.uuid,amount:health.amount,state:'complete'}});committed=true;
  receipt.complete=true;
  // Healing and sacrifice have committed. A chat/status write failure must not
  // prevent the native Death Burst prompt from opening.
  for(const task of [()=>actor.setFlag(ID,'lifeTransferReceipts.'+payload.request,receipt),()=>card.update({[`flags.${ID}.lifeTransferResolved`]:receipt,'system.buttons':[],'system.description':(card.system?.description??'')+'<p><strong>Life Transfer:</strong> '+health.healed+' HP restored. The Reanimated Companion is sacrificed.</p>'}),()=>companion.toggleStatusEffect?.('dead',{active:true})])try{await task();}catch(error){console.error('Life Transfer completion metadata',error);}
  return burstData?{...receipt,burstData}:receipt;
 }catch(error){
  if(!committed){
   let restored=!healed;if(healed&&Number(actor.system.attributes.hp.value)===health.after){await actor.update({'system.attributes.hp.value':health.before,[`flags.${ID}.lifeTransferReceipts.-=${payload.request}`]:null});restored=true;}
   if(restored){await companion.setFlag(ID,'lifeTransferSacrifice',oldCompanionFlag??null);if(newReaction&&marker?.getFlag?.(ID,'reactionUsage')===card.id)await marker.update({disabled:true});}
  }
  throw error;
 }
}
function operate(payload,begin=false){const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return enqueue(()=>begin?beginLifeTransfer(payload):resolveLifeTransfer(payload));return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(payload.request);reject(Error('The GM did not answer Life Transfer. Check the card before retrying.'));},20000);waiting.set(payload.request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:begin?'lifeTransferBegin':'lifeTransfer',payload,user:game.user.id,gm:gm.id});});}
export async function promptLifeTransfer(activity,sourceCard=null){
 const actor=sourceCard?.getAssociatedActor?.()??resolve(activity.actor?.uuid)??activity.actor;if(!actor?.isOwner)throw Error('Only the caster’s owner can use Life Transfer.');if(sourceCard&&flag(sourceCard,'lifeTransferResolved'))throw Error('Life Transfer on this card has already resolved.');if(busy.has(actor.uuid))return;busy.add(actor.uuid);
 try{
  const request=foundry.utils.randomID(),base={request,actor:actor.uuid,activity:activity.uuid,activityId:activity.id,scene:canvas.scene?.id,card:sourceCard?.id};
  const info=await operate(base,true),targets=new Set(values(game.user.targets).map(t=>(t.document??t).uuid)),targeted=info.candidates.filter(t=>targets.has(t.token)),candidates=targeted.length===1?targeted:info.candidates;
  if(candidates.length!==1)throw Error(candidates.length?'Target exactly one linked Reanimated Companion on this scene.':'No living linked Reanimated Companion on this scene.');
  const yes=await foundry.applications.api.DialogV2.wait({window:{title:'Life Transfer'},content:'<p>Are you sure, this can not be undone</p>',rejectClose:false,buttons:[{action:'yes',label:'Yes',callback:()=>true},{action:'no',label:'No',default:true,callback:()=>false}]});
  if(yes!==true)return;
  const receipt=await operate({...base,token:candidates[0].token});
  // The committed transfer has no HP Undo card. Death Burst itself keeps its
  // normal native save/damage workflow, centered on the sacrificed companion.
  const helper=receipt.burstData?new CONFIG.Item.documentClass(receipt.burstData,{parent:actor}):null;helper?.prepareFinalAttributes?.();
  const burst=helper?values(helper.system.activities)[0]:resolve(receipt.burst);if(!burst)throw Error('Life Transfer resolved, but Death Burst is unavailable. Use the companion’s Death Burst manually.');
  if(!sourceCard||!flag(sourceCard,'lifeTransferBurstStarted')){
   // Scope automatic placement to this exact native use, including its cloned
   // activity. Other Death Burst uses and concurrent actors keep their workflow.
   const placementKey=burst.actor.uuid+':'+burst.id;placements.set(placementKey,receipt.companion);let result;
   try{result=await burst.use({consume:false,concentration:{begin:false},create:{measuredTemplate:true}},{configure:false},{data:{flags:{...(receipt.burstData?{dnd5e:{item:{data:receipt.burstData}}}:{}),[ID]:{riderTriggered:true,...(receipt.burstData?{activityOverrideData:receipt.burstData}:{}),lifeTransferBurst:{request:receipt.request,companion:receipt.companion,transfer:receipt.card}}}}});}finally{placements.delete(placementKey);}
   if(result?.message){if(authority())await recordTransferBurst(receipt.card,result.message.id,game.user);else game.socket.emit('module.'+ID,{action:'lifeTransferBurstStarted',transfer:receipt.card,burst:result.message.id,user:game.user.id,gm:game.users.activeGM?.id});}
  }
  return {message:game.messages.get(receipt.card),lifeTransfer:receipt};
 }finally{busy.delete(actor.uuid);}
}
export async function recordTransferBurst(transferId,burstId,user=game.user){
 if(!authority())return;const card=game.messages.get(transferId),burst=game.messages.get(burstId),receipt=flag(card,'lifeTransferResolved'),link=flag(burst,'lifeTransferBurst');
 if(!receipt||!owns(resolve(receipt.actor),user)||link?.request!==receipt.request||link.transfer!==transferId||![receipt.actor,resolve(receipt.companion)?.actor?.uuid].includes(burst?.getAssociatedActor?.()?.uuid))return;
 if(!flag(card,'lifeTransferBurstStarted'))await card.setFlag(ID,'lifeTransferBurstStarted',burst.id);
}
export function prepareTransferPlacement(activity,config){
 const token=placements.get(activity.actor?.uuid+':'+activity.id);if(token)config.rsaLifeTransferToken=token;
}
export function installTransferPlacement(Placement){
 if(!Placement||wrapped.has(Placement))return;wrapped.add(Placement);const place=Placement.place;
 Placement.place=function(config){
  if(!config.rsaLifeTransferToken)return place.call(this,config);
  const token=resolve(config.rsaLifeTransferToken),grid=token?.parent?.grid;
  if(!token||token.parent?.id!==canvas.scene?.id||!grid?.size||!grid.distance)throw Error('Life Transfer companion position is unavailable.');
  // Native shapes already use scene distance units. Return placements to the
  // system so normal Region creation, origin links and target collection run.
  return Promise.resolve(config.shapes.map(shape=>({type:'circle',x:token.x+token.width*grid.size/2,y:token.y+token.height*grid.size/2,radius:Number(shape.size)*grid.size/grid.distance})));
 };
}
export function transferSummary(receipt){
 return `${receipt.companionName??'Reanimated Companion'} sacrificed: ${receipt.amount} HP transferred to ${receipt.casterName??'caster'}. ${receipt.healed} HP restored${Number.isFinite(receipt.before)&&Number.isFinite(receipt.after)?` (${receipt.before} → ${receipt.after} HP)`:''}.`;
}
export function renderLifeTransfer(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){node.querySelectorAll(':scope > .rsa-life-transfer').forEach(n=>n.remove());const receipt=flag(card,'lifeTransferResolved');if(card?.isContentVisible===false||node.hidden||!receipt?.complete)continue;const p=document.createElement('p');p.className='card-flavor rsa-life-transfer';p.textContent=transferSummary(receipt);node.append(p);}
}
export function installTransferBurstSource(Type){
 // Native use() clones activities, so preserve the exploding token on the
 // prototype rather than an instance override that would be lost during use.
 const p=Type?.prototype;if(!p?.getUsageToken||wrapped.has(p))return;wrapped.add(p);const get=p.getUsageToken,own=Object.hasOwn(p,'getUsageToken');
 p.getUsageToken=function(...args){const source=flag(this.item,'lifeTransferBurstSource');if(source){const card=game.messages.get(source.transfer),receipt=flag(card,'lifeTransferResolved');if(receipt?.request===source.request&&receipt.companion===source.token&&this.actor?.uuid===receipt.actor)return resolve(source.token);}return (own?get:Object.getPrototypeOf(p).getUsageToken).apply(this,args);};
}
export function transferSourceCard(config,message){
 const id=message?.data?.system?.origin??config?.event?.currentTarget?.closest?.('[data-message-id]')?.dataset?.messageId??config?.event?.target?.closest?.('[data-message-id]')?.dataset?.messageId;
 const card=resolve(id);return card?.type==='usage'?card:null;
}
export function installLifeTransfer(Type){const p=Type?.prototype;if(!p?.use||!p.rollDamage||wrapped.has(p))return;wrapped.add(p);const use=p.use,roll=p.rollDamage,ownUse=Object.hasOwn(p,'use'),ownRoll=Object.hasOwn(p,'rollDamage');
 p.use=async function(...args){if(!enabled()||!lifeTransferActivity(this))return (ownUse?use:Object.getPrototypeOf(p).use).apply(this,args);try{return await promptLifeTransfer(this);}catch(error){report(error);}};
 p.rollDamage=async function(config={},dialog={},message={}){if(!enabled()||!lifeTransferActivity(this))return (ownRoll?roll:Object.getPrototypeOf(p).rollDamage).call(this,config,dialog,message);try{const source=transferSourceCard(config,message);await promptLifeTransfer(this,source);return [];}catch(error){report(error);return [];}};
}
function report(error){console.error('Life Transfer',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'lifeTransferAutomation',{name:'Reanimator: Life Transfer',hint:'Confirm once, restore caster HP from the linked companion’s current HP, sacrifice it without an HP Undo control, and open native Death Burst area placement. Route actor mutations through the active GM.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 installLifeTransfer(CONFIG.DND5E?.activityTypes?.heal?.documentClass);installTransferBurstSource(CONFIG.DND5E?.activityTypes?.save?.documentClass);
 installTransferPlacement(globalThis.dnd5e?.canvas?.TemplatePlacement);Hooks.on('dnd5e.preCreateMeasuredTemplate',prepareTransferPlacement);Hooks.on('dnd5e.renderChatMessage',renderLifeTransfer);
 game.socket.on('module.'+ID,packet=>{if(packet?.action==='lifeTransferReply'&&packet.user===game.user.id){const e=waiting.get(packet.request);if(!e)return;waiting.delete(packet.request);clearTimeout(e.timer);packet.error?e.reject(Error(packet.error)):e.resolve(packet.receipt);return;}
  if(packet?.action==='lifeTransferBurstStarted'&&authority()&&packet.gm===game.user.id){const user=game.users.get(packet.user);if(user?.active)enqueue(()=>recordTransferBurst(packet.transfer,packet.burst,user)).catch(report);return;}
  if(!['lifeTransfer','lifeTransferBegin'].includes(packet?.action)||!authority()||packet.gm!==game.user.id)return;const user=game.users.get(packet.user);if(!user?.active)return;enqueue(()=>packet.action==='lifeTransferBegin'?beginLifeTransfer(packet.payload,user):resolveLifeTransfer(packet.payload,user)).then(receipt=>game.socket.emit('module.'+ID,{action:'lifeTransferReply',request:packet.payload.request,user:user.id,receipt}),error=>game.socket.emit('module.'+ID,{action:'lifeTransferReply',request:packet.payload.request,user:user.id,error:error.message}));
 });
});
