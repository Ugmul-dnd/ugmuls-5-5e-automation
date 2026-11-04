import {createEventQueue,describeTarget} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',BOOK='rhwCSPathtotheCb',CURSE='ZExOfIsAqbDCMYDk',DAMAGE='0ifHQtUbayx09tX0',EFFECT='mQRlujPiGJbczcyZ',enqueue=createEventQueue(),bridges=new Set(),spent=new Set(),waitingRolls=new Map(),opening=new Set();let preferenceWrites=Promise.resolve();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],doc=t=>t?.document??t;
const enabled=()=>game.settings.get(ID,'pathGraveAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),owns=(a,u)=>!!u?.active&&(u.isGM||a?.testUserPermission?.(u,'OWNER'));
const resolve=r=>{try{return typeof r==='string'?(globalThis.fromUuidSync?.(r,{strict:false})??game.messages.get(r.replace(/^ChatMessage\./,''))):r;}catch{return null;}},live=e=>e&&!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired&&!e.system?.expired;
const visible=(c,u)=>c?.isContentVisible!==false&&(u?.isGM||!c.blind&&(!c.whisper?.length||c.author?.id===u?.id||c.whisper.some(w=>(w.id??w)===u?.id))),unable=a=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>a?.statuses?.has(s));
export const pathFeatureItem=i=>i?.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)==='path-to-the-grave'||i.id===BOOK||i.name?.trim().toLowerCase()==='path to the grave'||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.'+BOOK)));
export const pathFeature=a=>values(a?.items).find(pathFeatureItem);
export const pathCurseActivity=a=>enabled()&&a?.type==='utility'&&pathFeatureItem(a.item)&&(a.id??a._id)===CURSE;
export function pathEffect(e){return live(e)&&(e.id===EFFECT||e.name?.trim().toLowerCase()==='cursed (path to the grave)'||[e.origin,e.system?.origin?.item,e._stats?.compendiumSource,e._stats?.duplicateSource].some(r=>r?.includes('.'+BOOK)||r?.endsWith('.'+EFFECT))||pathFeatureItem(resolve(e.system?.origin?.item)??resolve(e.origin)));}
export const pathEffects=a=>values(a?.appliedEffects??a?.effects).filter(pathEffect);
function casterFor(e){const message=resolve(e.system?.origin?.message),item=resolve(e.system?.origin?.item)??resolve(e.origin);return resolve(e.system?.origin?.actor)??item?.actor??(item?.parent?.documentName==='Actor'?item.parent:null)??message?.getAssociatedActor?.();}
const stamp=e=>JSON.stringify({origin:e.origin??null,source:e.system?.origin??null,start:e.start??null,modified:e._stats?.modifiedTime??null});
const instance=e=>e.uuid+'|'+stamp(e);
function casterToken(e,actor,attacker){const card=resolve(e.system?.origin?.message),token=doc(card?.getAssociatedToken?.())??doc(actor?.token);if(token?.parent?.uuid===attacker?.parent?.uuid)return token;return values(attacker?.parent?.tokens).find(t=>t.actor?.uuid===actor?.uuid);}
function sees(source,target){if(!source?.actor||!target?.actor||source.parent?.uuid!==target.parent?.uuid||target.hidden||target.object?.isVisible===false||source.actor.statuses?.has('blinded')||!source.object?.center||!target.object?.center)return false;const a=values(source.levels),b=values(target.levels);return !(a.length&&b.length&&!a.some(l=>b.includes(l)))&&!source.object.checkCollision?.(target.object.center,{type:'sight',mode:'any'});}
export function pathSnapshot(card){
 if(!enabled()||card?.type!=='attack')return {entries:[]};const attacker=doc(card.getAssociatedToken?.()),entries=[];
 if(!attacker?.actor)return {entries};
 for(const t of values(card.system?.targets)){
  const target=resolve(t.token);if(!target?.actor)continue;
  for(const effect of pathEffects(target.actor)){
   const actor=casterFor(effect),feature=pathFeature(actor),source=casterToken(effect,actor,attacker);
   if(!actor||!feature||unable(actor)||flag(effect,'pathGraveSpent')||spent.has(instance(effect)))continue;
   if(actor.uuid!==attacker.actor.uuid&&(!source||!Number.isFinite(source.disposition)||source.disposition===0||source.disposition!==attacker.disposition||!sees(source,attacker)))continue;
   entries.push({actor:actor.uuid,feature:feature.uuid,effect:effect.uuid,stamp:stamp(effect),target:target.uuid,subject:target.actor.uuid,attacker:attacker.actor.uuid,name:actor.name,targetName:target.name??target.actor.name});
  }
 }return {entries};
}
const records=card=>values(flag(card,'pathGraveUsed'));
export function pathCandidates(card,user=game.user,{pending=false}={}){
 if(!enabled()||card?.type!=='attack'||!visible(card,user)||!card.rolls?.some(r=>r._evaluated&&r.d20)||!pending&&flag(card,'pathGravePending'))return [];
 return values(flag(card,'pathGraveSnapshot')?.entries).flatMap(e=>{
  const actor=resolve(e.actor),effect=resolve(e.effect),feature=pathFeature(actor);
  if(!owns(actor,user)||unable(actor)||feature?.uuid!==e.feature||card.getAssociatedActor?.()?.uuid!==e.attacker||!values(card.system?.targets).some(t=>t.token===e.target)||!values(card.system?.evaluatedTargets).some(t=>t.token===e.target&&t.isMiss===false)||records(card).some(r=>r.effect===e.effect&&r.stamp===e.stamp)||!pathEffect(effect)||flag(effect,'pathGraveSpent')||stamp(effect)!==e.stamp||spent.has(instance(effect))||effect.parent?.uuid!==e.subject)return [];
  return [{...e,actor,feature,effect}];
 });
}
async function removeConsumed(entry){const effect=resolve(entry.effect);if(!effect||!pathEffect(effect)||stamp(effect)!==(entry.removalStamp??entry.stamp))return true;await effect.delete();return true;}
export function preparePathDamage(config,dialog,message){
 if(!message?.data?.flags?.[ID]?.pathGraveRider)return;
 const actor=config.subject?.actor,preferences=game.settings.get(ID,'pathGraveDamageTypes'),type=preferences?.[game.user.id+':'+actor?.uuid];
 if(['necrotic','radiant'].includes(type))for(const roll of config.rolls??[]){roll.options??={};roll.options.type=type;}
 dialog.configure=true;
}
async function configuredDamage(native,message){
 const dialog=globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog('damage',{configure:true})??{configure:true},Base=dialog.applicationClass??CONFIG.Dice?.DamageRoll?.DefaultConfigurationDialog;
 if(Base)dialog.applicationClass=class extends Base{_finalizeRolls(action){const meta=message.data.flags[ID].pathGraveRider,card=game.messages.get(meta.attack);if(!pathCandidates(card,game.user,{pending:true}).some(e=>e.effect.uuid===meta.effect))throw Error('The hit or original curse changed.');return super._finalizeRolls(action);}};
 const rolls=await native.rollDamage({isCritical:false},dialog,message);
 if(rolls?.length){const type=rolls[0].options?.type;if(['necrotic','radiant'].includes(type)){
  const key=game.user.id+':'+native.actor.uuid;
  preferenceWrites=preferenceWrites.then(async()=>{const stored=game.settings.get(ID,'pathGraveDamageTypes'),preferences=stored&&typeof stored==='object'?stored:{};if(preferences[key]!==type)await game.settings.set(ID,'pathGraveDamageTypes',{...preferences,[key]:type});}).catch(error=>console.warn('Path to the Grave preference',error));await preferenceWrites;
 }}else{
  const pending=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.({message});
  if(pending&&!pending.rolls?.length&&flag(pending,'pendingDamage')?.userId===game.user.id)await pending.delete();
 }return rolls;
}
export async function showPathDamage(packet){
 if(packet.user!==game.user.id||packet.gm!==game.users.activeGM?.id||opening.has(packet.request))return;
 const usage=game.messages.get(packet.usage),meta=flag(usage,'pathGraveRider'),actor=resolve(meta?.source),card=game.messages.get(meta?.attack),pending=flag(card,'pathGravePending');
 if(meta?.request!==packet.request||pending?.request!==packet.request||pending.user!==game.user.id||pending.usage!==usage?.id)return;
 if(!owns(actor,game.user)){game.socket.emit('module.'+ID,{action:'pathGraveRollCanceled',request:packet.request,user:game.user.id,gm:packet.gm});return;}
 opening.add(packet.request);
 try{const data=flag(usage,'activityOverrideData'),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();const rolls=await configuredDamage(helper.system.activities.get(DAMAGE),{data:{system:{origin:usage.id,targets:usage.system.targets},flags:{dnd5e:{item:{data}},[ID]:{activityOverrideData:data,riderTriggered:true,pathGraveRider:meta}}}});
  if(!rolls?.length)game.socket.emit('module.'+ID,{action:'pathGraveRollCanceled',request:packet.request,user:game.user.id,gm:packet.gm});
 }catch(error){game.socket.emit('module.'+ID,{action:'pathGraveRollCanceled',request:packet.request,user:game.user.id,gm:packet.gm});report(error);}finally{opening.delete(packet.request);}
}
export function receivePathDamage(card){
 if(!authority()||card?.type!=='damage'||flag(card,'pendingDamage')||!card.rolls?.length||!card.rolls.every(r=>r._evaluated))return;
 const meta=flag(card,'pathGraveRider'),wait=waitingRolls.get(meta?.request),origin=typeof card.system?.origin==='string'?card.system.origin.replace(/^ChatMessage\./,''):card.system?.origin?.id;
 if(!wait||origin!==wait.usage||card.author?.id!==wait.user||meta.user!==wait.user||meta.effect!==wait.effect||meta.source!==wait.actor||card.getAssociatedActor?.()?.uuid!==wait.actor||card.system?.targets?.length!==1||card.system.targets[0].token!==wait.target||!card.rolls.every(r=>['necrotic','radiant'].includes(r.options?.type)))return;
 waitingRolls.delete(meta.request);wait.resolve(card.rolls);
}
export function usePathGrave(card,effectUuid,type=null,user=game.user){return enqueue(async()=>{
 if(!authority())throw Error('A connected GM is required for Path to the Grave.');
 const previous=records(card).find(r=>r.effect===effectUuid);
 if(previous){if(!owns(resolve(previous.actor),user)||!visible(card,user))throw Error('Only the Cleric’s owner or GM can end this curse.');if(previous.removed)throw Error('This curse was already consumed.');await removeConsumed(previous);await card.setFlag(ID,'pathGraveUsed',records(card).map(r=>r===previous?{...r,removed:true}:r));globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return;}
 let e=pathCandidates(card,user).find(e=>e.effect.uuid===effectUuid);if(!e||type!==null&&!['necrotic','radiant'].includes(type))throw Error('Path to the Grave requires a recorded allied hit and its original active curse.');
 const data=e.feature.toObject(),a=data.system.activities[DAMAGE];if(!a)throw Error('The native End Curse Early damage activity is missing.');
 data.system.activities={[DAMAGE]:a};data.effects=[];a.activation={type:'special',override:true};a.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};a.target={override:true,prompt:false,affects:{type:'creature',count:'1'},template:{type:''}};a.damage.critical={...a.damage.critical,allow:false};
 for(const part of a.damage.parts??[])part.types=type?[type,...['necrotic','radiant'].filter(t=>t!==type)]:['necrotic','radiant'];
 const helper=new CONFIG.Item.documentClass(data,{parent:e.actor});helper.prepareFinalAttributes?.();const native=helper.system.activities.get(DAMAGE),target=resolve(e.target);if(target?.actor?.uuid!==e.subject)throw Error('The cursed target changed.');
 const targets=[describeTarget(target)],meta={attack:card.id,effect:e.effect.uuid,source:e.actor.uuid,request:foundry.utils.randomID(),user:user.id},flags={dnd5e:{item:{data}},[ID]:{activityOverrideData:data,riderTriggered:true,pathGraveRider:meta}};
 const effectKey=instance(e.effect);let committed=false,usage=null;
 try{
  await card.setFlag(ID,'pathGravePending',{effect:effectUuid,stamp:e.stamp});
  // This independent native damage usage deliberately has its own origin and targets.
  // Never link it as the attack's primary damage or pause the original HP workflow.
  const result=await native.use({consume:false,subsequentActions:false,concentration:{begin:false},create:{measuredTemplate:false}},{configure:false},{data:{system:{targets},flags}});
  usage=result?.message;if(!usage)throw Error('End Curse Early was canceled.');
  const current=pathCandidates(card,user,{pending:true}).find(candidate=>candidate.effect.uuid===effectUuid);
  if(!current)throw Error('The hit, original curse or Cleric changed.');
  let rolls;try{
   if(user.id===game.user.id)rolls=await configuredDamage(native,{data:{system:{origin:usage.id,targets},flags}});
   else{
    await card.setFlag(ID,'pathGravePending',{effect:effectUuid,stamp:e.stamp,request:meta.request,user:user.id,usage:usage.id});
    rolls=await new Promise(resolve=>{waitingRolls.set(meta.request,{resolve,user:user.id,actor:e.actor.uuid,usage:usage.id,target:e.target,effect:effectUuid});game.socket.emit('module.'+ID,{action:'pathGraveRoll',request:meta.request,user:user.id,gm:game.user.id,usage:usage.id});});
   }
  }catch(error){rolls=values(usage.getAssociatedRolls?.('damage')).flatMap(c=>c.rolls??[]);if(!rolls.length)throw error;}
  if(!rolls?.length)throw Error('The extra damage roll was canceled.');committed=true;spent.add(effectKey);if(spent.size>512)spent.delete(spent.values().next().value);
  type=rolls[0].options?.type;if(!['necrotic','radiant'].includes(type))throw Error('Path to the Grave requires Necrotic or Radiant damage.');
  const record={effect:effectUuid,stamp:e.stamp,actor:e.actor.uuid,target:e.target,type,usage:usage.id,removed:false};
  await card.setFlag(ID,'pathGraveUsed',[...records(card),record]);
  await removeConsumed(record);await card.setFlag(ID,'pathGraveUsed',records(card).map(r=>r.effect===effectUuid?{...r,removed:true}:r));
 }finally{
  // Keep a durable block if damage exists but document recording/removal failed.
  // Recasts with a newer instance stamp must never be removed or blocked here.
  try{
   if(committed&&resolve(e.effect.uuid)===e.effect&&pathEffect(e.effect)&&stamp(e.effect)===e.stamp){
    await e.effect.setFlag(ID,'pathGraveSpent',true);
    await card.setFlag(ID,'pathGraveUsed',records(card).map(r=>r.effect===effectUuid?{...r,removalStamp:stamp(e.effect)}:r));
   }
   if(!committed&&usage&&!values(usage.getAssociatedRolls?.('damage')).length)await usage.delete?.();
  }finally{waitingRolls.delete(meta.request);await card.unsetFlag(ID,'pathGravePending');globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
 }
});}
function request(card,effect){const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id){game.socket.emit('module.'+ID,{action:'pathGraveUse',gm:gm.id,user:game.user.id,card:card.id,effect});return;}return usePathGrave(card,effect);}
export function renderPathGrave(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 for(const {card,node}of [{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))]){
  for(const old of node.querySelectorAll(':scope > .rsa-path-grave'))old.remove();if(!card||!visible(card,game.user)||!enabled())continue;
  const row=document.createElement('div');row.className='rsa-attack-actions rsa-path-grave';
  const add=(label,effect)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();b.disabled=true;try{await request(card,effect);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});row.append(b);};
  for(const e of pathCandidates(card))add('Path to the Grave',e.effect.uuid);
  for(const record of records(card)){if(!record.removed&&owns(resolve(record.actor),game.user))add('Path to the Grave — Retry curse removal',record.effect,record.type);else{const note=document.createElement('span');note.textContent='Path to the Grave: '+record.type+' damage rolled; curse ended.';row.append(note);}}
  if(row.childNodes.length)node.append(row);
 }
}
export function registerPathGrave(api=globalThis.ac5e?.usageRules){
 if(!game.modules?.get?.('automated-conditions-5e')?.active||!api?.register)return;
 for(const hook of ['attack','save'])if(!bridges.has(hook))try{if(api.register({key:'rsaPathGrave'+hook,scope:'universal',hook,target:'subject',mode:'disadvantage',name:'Path to the Grave',persistent:false,evaluate:s=>enabled()&&pathEffects(resolve(s.actorUuid)).length>0}))bridges.add(hook);}catch(error){console.warn('Path to the Grave AC5E',error);}
}
export function pathDefaults(config,dialog,hook){
 if(!enabled()||bridges.has(hook)&&game.modules?.get?.('automated-conditions-5e')?.active)return;
 const actor=config.subject?.actor??config.subject;if(!pathEffects(actor).length)return;
 config.disadvantage=true;let advantage=!!config.advantage;
 for(const roll of config.rolls??[]){const o=roll.options??={},adv=!!config.advantage||!!o.advantage||o.advantageMode===1;advantage||=adv;Object.assign(o,{advantage:adv,disadvantage:true,advantageMode:adv?0:-1});}
 dialog.options??={};dialog.options.defaultButton=advantage?'normal':'disadvantage';
}
function report(error){console.error('Path to the Grave',error);ui.notifications.warn(error.message);}
Hooks.once('init',()=>{game.settings.register(ID,'pathGraveDamageTypes',{scope:'client',config:false,type:Object,default:{}});game.settings.register(ID,'pathGraveAutomation',{name:'Grave Cleric: Path to the Grave',hint:'Native curse gives attack/save Disadvantage through AC5E. Offer a separate native Cleric-level Necrotic/Radiant roll on a recorded allied hit, consuming only that curse. Remember the last damage type for each user/Cleric. Does not pause attack damage automation. Auto Apply Buffs also supports the Curse activity.',scope:'world',config:true,type:Boolean,default:true});});
Hooks.on('ac5e.usageRulesReady',({usageRules}={})=>registerPathGrave(usageRules));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationPathGrave={curseActivity:pathCurseActivity};registerPathGrave();
 Hooks.on('dnd5e.preRollAttackV2',(c,d)=>pathDefaults(c,d,'attack'));Hooks.on('dnd5e.preRollSavingThrowV2',(c,d)=>pathDefaults(c,d,'save'));
 Hooks.on('preCreateChatMessage',card=>{if(card.type==='attack')card.updateSource({['flags.'+ID+'.pathGraveSnapshot']:pathSnapshot(card)});});
 Hooks.on('dnd5e.renderChatMessage',renderPathGrave);
 Hooks.on('dnd5e.preRollDamageV2',preparePathDamage);
 for(const event of ['createChatMessage','updateChatMessage'])Hooks.on(event,receivePathDamage);
 Hooks.on('userConnected',(user,connected)=>{if(!authority()||connected)return;for(const [id,wait]of waitingRolls)if(wait.user===user.id){waitingRolls.delete(id);wait.resolve([]);}});
 Hooks.on('deleteChatMessage',card=>{if(!authority())return;for(const [id,wait]of waitingRolls)if(wait.usage===card.id){waitingRolls.delete(id);wait.resolve([]);}});
 // Native reapplication can refresh the same effect document. Its new curse is independent.
 Hooks.on('preUpdateActiveEffect',(effect,changes)=>{if(flag(effect,'pathGraveSpent')&&['start','duration','system.origin'].some(k=>Object.hasOwn(changes,k)||Object.keys(changes).some(p=>p.startsWith(k+'.'))||k==='system.origin'&&changes.system?.origin))changes['flags.'+ID+'.-=pathGraveSpent']=null;});
 game.socket.on('module.'+ID,p=>{
  if(p?.action==='pathGraveRoll'){showPathDamage(p).catch(report);return;}
  if(p?.action==='pathGraveRollCanceled'&&authority()&&p.gm===game.user.id){const wait=waitingRolls.get(p.request);if(wait?.user===p.user){waitingRolls.delete(p.request);wait.resolve([]);}return;}
  if(p?.action==='pathGraveError'&&p.user===game.user.id){ui.notifications.warn(p.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(p.card));return;}
  if(p?.action!=='pathGraveUse'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user),card=game.messages.get(p.card);if(user?.active&&card)usePathGrave(card,p.effect,null,user).catch(error=>game.socket.emit('module.'+ID,{action:'pathGraveError',user:user.id,card:card.id,error:error.message}));
 });
});
