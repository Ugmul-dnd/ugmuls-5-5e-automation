import {createEventQueue,describeTarget} from './shared-activity-card.js';
import {blessingDistance} from './dark-ones-blessing.js';
import {installTransferPlacement} from './life-transfer.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),waiting=new Map(),dialogs=new Set(),wrapped=new WeakSet(),processing=new Set(),opened=new Set();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const key=i=>i?.identifier||i?.system?.identifier,enabled=()=>game.settings.get(ID,'spiritsBeyondAutomation')===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),owns=(a,u)=>!!a&&(u?.isGM||a.testUserPermission?.(u,'OWNER'));
const resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
const escape=s=>foundry.utils.escapeHTML(String(s??'')),remaining=r=>Math.max(0,Number(r?.system?.uses?.value??Number(r?.system?.uses?.max)-Number(r?.system?.uses?.spent??0)));
function named(item,name,id){return item?.type==='feat'&&(key(item)===name.toLowerCase().replaceAll(' ','-')||item.name===name||item.id===id||item._stats?.compendiumSource?.endsWith('.'+id));}
export const spiritsItem=item=>enabled()&&named(item,'Spirits from Beyond','rhwCSSpiritsfrlf')&&!flag(item,'spiritHelper');
export const spiritsFeature=actor=>values(actor?.items).find(spiritsItem);
const pool=actor=>values(actor?.items).find(i=>i.type==='feat'&&key(i)==='bardic-inspiration');
export function spiritTable(item){
 return [...String(item?.system?.description?.value??'').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].flatMap(([,row])=>{
  const n=row.match(/<td\b[^>]*>\s*(?:<p\b[^>]*>)?\s*(\d+)/i),link=row.match(/@UUID\[([^\]]+)\]\{([^}]+)\}/);return n&&link?[{number:Number(n[1]),uuid:link[1],name:link[2]}]:[];
 });
}
export const gatheredSpirits=actor=>values(actor?.effects).filter(e=>flag(e,'gatheredSpirit')&&!e.disabled&&!e.isSuppressed&&!e.duration?.expired);
function context(actor,user=game.user){const feature=spiritsFeature(actor),resource=pool(actor);if(!enabled()||!owns(actor,user)||!feature||!resource)throw Error('Spirits from Beyond is unavailable.');return {actor,feature,resource,table:spiritTable(feature)};}
function snapshot(actor,feature){
 const data=actor.getRollData(),activity=values(feature.system.activities).find(a=>a.name==='Passive Channeling'),formula=CONFIG.Dice.BasicRoll.replaceFormulaData(activity?.roll?.formula??'',data,{missing:0}),faces=Number(data.scale?.bard?.inspiration?.faces);
 if(!formula||!Number.isInteger(faces)||faces<1)throw Error('The native Bardic Inspiration scale is unavailable.');
 return {feature:feature.uuid,resource:pool(actor).id,formula,faces,rest:flag(actor,'spiritsRest')??null,mystical:values(actor.items).some(i=>named(i,'Mystical Connection','rhwCSMysticalCK7'))};
}
export function paidInspiration(card,id){return values(card?.system?.deltas?.item?.[id]).some(d=>d.keyPath==='system.uses.spent'&&Number(d.delta)>0);}
export function captureSpiritGathering(activity,usage,message){
 const actor=activity.actor??activity.item?.actor,feature=spiritsFeature(actor),controlled=flag(activity.item,'spiritControlled');if(!feature||!message?.data)return;
 const giving=key(activity.item)==='bardic-inspiration'&&activity.activation?.type==='bonus';if(!controlled&&!giving)return;
 if(!paidInspiration(message.data,pool(actor)?.id))return;
 let state;try{state=snapshot(actor,feature);}catch(error){ui.notifications.warn(error.message);return;}
 message.data.flags??={};message.data.flags[ID]??={};message.data.flags[ID].spiritGather={...state,actor:actor.uuid,entries:[{actor:actor.uuid}],mode:controlled?'controlled':'passive',...(controlled?{number:controlled.number}:{}),request:foundry.utils.randomID()};
}
function sourceContext(card,user){
 const state=flag(card,'spiritGather'),actor=resolve(state?.actor),c=context(actor,user);
 if(!state||card.type!=='usage'||flag(card,'pendingCast')||flag(card,'targetsConfirmationPending')||state.feature!==c.feature.uuid||state.rest!==(flag(actor,'spiritsRest')??null)||!paidInspiration(card,state.resource)||!user.isGM&&card.author?.id!==user.id)throw Error('This channeling has not completed or has expired after a rest.');
 if(state.mode==='passive'&&!values(card.system?.targets).some(t=>{const token=resolve(t.token);return token?.actor&&token.actor.uuid!==actor.uuid;}))throw Error('Give Bardic Inspiration to another creature to gather a spirit.');
 const activity=card.getAssociatedActivity?.({scaled:true});if(card.getAssociatedActor?.()?.uuid!==actor.uuid||activity?.actor?.uuid!==actor.uuid||state.mode==='passive'&&(key(activity.item)!=='bardic-inspiration'||activity.activation?.type!=='bonus')||state.mode==='controlled'&&flag(activity.item,'spiritControlled')?.number!==state.number)throw Error('The native channeling source does not match.');
 return {...c,state};
}
async function grant(card,c,number){
 const previous=flag(card,'spiritGranted');if(previous)return previous;
 const row=c.table.find(r=>r.number===number);if(!row)throw Error('The spirit is missing from the native table.');
 // The source-card receipt remains after a spirit is spent, so old cards never refill inventory.
 const existing=values(c.actor.effects).find(e=>flag(e,'gatheredSpirit')?.card===card.uuid);
 const effect=existing??(await c.actor.createEmbeddedDocuments('ActiveEffect',[{name:'Channeled Spirit — '+row.name,img:c.feature.img,origin:c.feature.uuid,disabled:false,transfer:false,duration:{value:null,units:'seconds',expiry:'shortRest'},system:{changes:[],origin:{actor:c.actor.uuid,item:c.feature.uuid,message:card.uuid}},flags:{[ID]:{gatheredSpirit:{...row,feature:c.feature.uuid,card:card.uuid,request:c.state.request}}}}]))[0];
 if(!effect)throw Error('The channeled spirit could not be recorded.');
 const receipt={number:row.number,name:row.name,effect:effect.uuid};try{await card.setFlag(ID,'spiritGranted',receipt);}catch(error){if(!existing)await effect.delete();throw error;}globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return receipt;
}
export function unleashTarget(actor,sourceRef,targetRef,user=game.user){
 const source=resolve(sourceRef),target=resolve(targetRef),limit=/^(m|meters?|metres?)$/i.test(source?.parent?.grid?.units??'ft')?9.144:30;
 if(source?.actor?.uuid!==actor?.uuid||!target?.actor||source.parent?.uuid!==target.parent?.uuid||user.viewedScene&&source.parent.id!==user.viewedScene||!user.isGM&&target.hidden||target.object?.isVisible===false||actor.statuses?.has('blinded')||blessingDistance(source,target)>limit+1e-7||source.uuid!==target.uuid&&source.object?.checkCollision?.(target.object?.center,{type:'sight',mode:'any'}))throw Error('Choose one visible creature within 30 feet of the Bard.');
 return target;
}
function reservation(payload,user,{rollback=false}={}){
 const effect=resolve(payload.effect),actor=effect?.parent,c=rollback?{actor}:context(actor,user),state=flag(effect,'spiritReservation');
 if(!owns(actor,user)||!flag(effect,'gatheredSpirit')||!state||state.request!==payload.request||state.user!==user.id)throw Error('This spirit reservation is unavailable.');return {...c,effect,state};
}
export function spiritOperation(operation,payload,user=game.user){return enqueue(async()=>{
 if(!authority()||!user?.active||typeof payload?.request!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(payload.request))throw Error('Invalid spirit request.');
 if(operation==='gather'||operation==='choose'){
  const card=game.messages.get(payload.card),c=sourceContext(card,user);if(flag(card,'spiritGranted'))return flag(card,'spiritGranted');
  if(c.state.mode==='controlled'){if(!Number.isInteger(c.state.number)||c.state.number>c.state.faces)throw Error('This spirit exceeds the Bardic Inspiration die.');return grant(card,c,c.state.number);}
  let draw=flag(card,'spiritDraw');if(!draw){
   const rolls=[];for(let i=0;i<(c.state.mystical?2:1);i++){const roll=await new CONFIG.Dice.BasicRoll(c.state.formula).evaluate();if(!Number.isInteger(roll.total)||!c.table.some(r=>r.number===roll.total)||roll.total>c.state.faces)throw Error('The native spirit roll could not be resolved.');rolls.push(roll);}
   const numbers=rolls.map(r=>r.total),allowed=c.state.mystical&&numbers[0]===numbers[1]?c.table.map(r=>r.number):[...new Set(numbers)];draw={numbers,allowed,rolls:rolls.map(r=>r.toJSON())};await card.setFlag(ID,'spiritDraw',draw);
   if(game.dice3d?.showForRoll){
    // One visual pool throws both Mystical Connection dice together, while the
    // saved rolls retain their individual results for choosing the spirit.
    const visual=rolls.length>1?Roll.fromTerms([foundry.dice.terms.PoolTerm.fromRolls(rolls)]):rolls[0];
    const animation=game.dice3d.showForRoll(visual,user,true,card.whisper?.length?card.whisper:null,card.blind??false,card.id,card.speaker);
    await(globalThis.Ugmuls55eAutomationWaitForAnimation?.(animation)??animation);
   }
  }
  if(draw.allowed.length===1)return grant(card,c,draw.allowed[0]);
  if(operation==='choose'){if(!draw.allowed.includes(Number(payload.number)))throw Error('Choose one of the rolled spirits.');return grant(card,c,Number(payload.number));}
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return {choose:draw.allowed,numbers:draw.numbers};
 }
 if(operation==='reserve'){
  const effect=resolve(payload.effect),actor=effect?.parent,c=context(actor,user),stored=flag(effect,'gatheredSpirit');
  if(!gatheredSpirits(actor).includes(effect)||flag(effect,'spiritReservation')||stored.feature!==c.feature.uuid||!c.table.some(r=>r.number===stored.number&&r.uuid===stored.uuid))throw Error('Choose an available channeled spirit.');
  unleashTarget(actor,payload.source,payload.target,user);await effect.update({disabled:true,['flags.'+ID+'.spiritReservation']:{request:payload.request,user:user.id,source:payload.source,target:payload.target}});return stored;
 }
 if(operation==='validate'){const c=reservation(payload,user);unleashTarget(c.actor,c.state.source,c.state.target,user);return true;}
 if(operation==='finish'||operation==='rollback'){
  // A rest may already have removed the reserved copy. Never recreate it.
  if(!resolve(payload.effect))return {};
  const current=resolve(payload.effect);if(operation==='rollback'&&owns(current.parent,user)&&!flag(current,'spiritReservation'))return {};
  const c=reservation(payload,user,{rollback:true}),card=game.messages.get(payload.card??c.state.card),meta=flag(card,'spiritUnleash');
  if(card&&meta?.request===payload.request&&meta.effect===c.effect.uuid){
   const activity=card.getAssociatedActivity?.({scaled:true});if(card.getAssociatedActor?.()?.uuid!==c.actor.uuid||flag(activity?.item,'spiritUnleash')?.request!==payload.request)throw Error('The native Unleash activity does not match.');
   if(!flag(card,'pendingCast')&&!flag(card,'targetsConfirmationPending')){await c.effect.delete();return {};}
   if(operation==='finish'){await c.effect.setFlag(ID,'spiritReservation',{...c.state,card:card.id});return {};}
  }
  if(operation==='finish')throw Error('The native spirit activity has not completed.');
  await c.effect.update({disabled:false,['flags.'+ID+'.-=spiritReservation']:null});return {};
 }
 if(operation==='rest'){
  const actor=resolve(payload.actor);if(!owns(actor,user))throw Error('You cannot clear these spirits.');await actor.setFlag(ID,'spiritsRest',payload.request);const ids=values(actor.effects).filter(e=>flag(e,'gatheredSpirit')).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments('ActiveEffect',ids);return {};
 }
 throw Error('Unknown spirit operation.');
});}
async function operate(operation,payload){
 const gm=game.users.activeGM;if(!gm)throw Error('A connected GM is required for Spirits from Beyond.');payload={request:foundry.utils.randomID(),...payload};if(gm.id===game.user.id)return spiritOperation(operation,payload);
 const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Spirits from Beyond.'));},15000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'spiritOperation',operation,payload,request,user:game.user.id,gm:gm.id});});
}
export function controlledSpiritData(feature,number){
 const c=context(feature.actor),state=snapshot(c.actor,feature),row=c.table.find(r=>r.number===number);if(!row||number>state.faces||remaining(c.resource)<1)throw Error('That spirit or Bardic Inspiration use is unavailable.');
 const data=feature.toObject(),activity=values(data.system.activities).find(a=>a.name==='Controlled Channeling');if(!activity)throw Error('The native Controlled Channeling activity is missing.');
 activity.roll={...activity.roll,formula:''};activity.consumption={...activity.consumption,spellSlot:false,targets:[{type:'itemUses',target:c.resource.id,value:'1'}]};
 // A distinct temporary UUID makes native chat resolution use this snapshot,
 // rather than resolving the owned feature and losing the chosen spirit.
 data._id=foundry.utils.randomID();data.system.activities={[activity._id]:activity};data.effects=[];data.flags??={};data.flags[ID]={...data.flags[ID],spiritHelper:true,spiritControlled:{number}};return {data,id:activity._id};
}
export function unleashSpiritData(native,actor,meta){
 const data=native.toObject(),activity=values(data.system.activities).find(a=>a.name==='Unleash')??values(data.system.activities)[0];if(!activity)throw Error('The spirit has no native Unleash activity.');
 // The book stores spirits as expendable trinkets. A temporary feat keeps their
 // native activities/effects while using our normal pending-cast and Undo flow;
 // the reserved inventory effect replaces trinket quantity/use consumption.
 const nativeSystem=data.system,base=spiritsFeature(actor)?.toObject().system;if(!base)throw Error('Spirits from Beyond is unavailable.');
 data.type='feat';data.system={...base,description:nativeSystem.description,activities:nativeSystem.activities,identifier:'rsa-spirit-unleash',source:nativeSystem.source,properties:nativeSystem.properties,uses:{spent:0,max:'',recovery:[]}};
 data._id=foundry.utils.randomID();
 for(const a of values(data.system.activities)){a.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};a.uses={spent:0,max:'',recovery:[]};}
 // Avenger's damage is retaliation, not damage to its recipient on activation.
 if(native.name==='Avenger Spirit'){activity.type='utility';activity.roll={formula:'',prompt:false};delete activity.damage;}
 data.flags??={};data.flags[ID]={...data.flags[ID],spiritHelper:true,spiritUnleash:{...meta,activity:activity._id}};return {data,id:activity._id};
}
async function useHelper(actor,built,meta={}){
 const helper=new CONFIG.Item.documentClass(built.data,{parent:actor});helper.prepareFinalAttributes?.();const activity=helper.system.activities.get(built.id);
 return activity.use({}, {configure:true},{data:{...(meta.target?{system:{targets:[describeTarget(resolve(meta.target))]}}:{}),flags:{dnd5e:{item:{data:built.data}},[ID]:{activityOverrideData:built.data,...(meta.effect?{spiritUnleash:flag(helper,'spiritUnleash')}:{})}}}});
}
async function chooseDraw(card,result){
 if(!result?.choose?.length)return;const actor=resolve(flag(card,'spiritGather')?.actor),rows=spiritTable(spiritsFeature(actor)).filter(r=>result.choose.includes(r.number));
 const number=await foundry.applications.api.DialogV2.wait({window:{title:'Mystical Connection — Choose Spirit'},content:'<p>Spirit rolls: '+result.numbers.map(escape).join(', ')+'</p><select name="spirit">'+rows.map(r=>'<option value="'+r.number+'">'+r.number+' — '+escape(r.name)+'</option>').join('')+'</select>',rejectClose:false,buttons:[{action:'choose',label:'Channel Spirit',callback:(_e,_b,d)=>Number(d.element.querySelector('[name="spirit"]').value)},{action:'cancel',label:'Choose Later',callback:()=>null}]});
 if(number!=null)await operate('choose',{card:card.id,number});
}
export async function processSpiritCard(card){
 if(!enabled()||!flag(card,'spiritGather')||flag(card,'spiritGranted')||flag(card,'pendingCast')||flag(card,'targetsConfirmationPending')||card.author?.id!==game.user.id||processing.has(card.id))return;
 const passive=flag(card,'spiritGather').mode==='passive';if(passive&&opened.has(card.id))return;
 processing.add(card.id);try{
  const c=sourceContext(card,game.user);if(passive){opened.add(card.id);if(opened.size>512)opened.delete(opened.keys().next().value);
   if(!flag(card,'spiritDraw')){const confirmed=await foundry.applications.api.DialogV2.wait({window:{title:'Gather Spirit'},position:{width:300},classes:['rsa-spirit-gather-dialog'],content:'<p>Roll '+escape(c.state.formula)+(c.state.mystical?' twice (Mystical Connection)':'')+'. No extra Bardic Inspiration use.</p>',rejectClose:false,buttons:[{action:'roll',label:'Roll Spirit',default:true,callback:()=>true},{action:'cancel',label:'Skip',callback:()=>false}]});if(!confirmed)return;}
  }
  await chooseDraw(card,await operate('gather',{card:card.id}));
 }finally{processing.delete(card.id);}
}
export async function openSpirits(item){
 if(!spiritsItem(item)||!item.actor?.isOwner||dialogs.has(item.actor.uuid))return;const c=context(item.actor);dialogs.add(c.actor.uuid);
 try{
  const mode=await foundry.applications.api.DialogV2.wait({window:{title:'Spirits from Beyond'},position:{width:300},classes:['rsa-spirit-gather-dialog'],content:'<p>Bardic Inspiration: '+remaining(c.resource)+' / '+escape(c.resource.system.uses.max)+'</p>',rejectClose:false,buttons:[{action:'unleash',label:'Unleash',disabled:!gatheredSpirits(c.actor).length,callback:()=> 'unleash'},{action:'channel',label:'Controlled',disabled:remaining(c.resource)<1,callback:()=> 'controlled'},{action:'cancel',label:'Cancel',callback:()=>null}]});
  if(!mode)return;
  const controlled=mode==='controlled',stored=gatheredSpirits(c.actor),max=snapshot(c.actor,item).faces,rows=c.table.filter(r=>r.number<=max);
  const selection=controlled?'<label>Spirit <select name="channel">'+rows.map(r=>'<option value="'+r.number+'">'+r.number+' — '+escape(r.name)+'</option>').join('')+'</select></label>':'<label>Spirit <select name="unleash">'+stored.map((e,n)=>'<option value="'+escape(e.uuid)+'">'+escape(flag(e,'gatheredSpirit').name)+' (copy '+(n+1)+')</option>').join('')+'</select></label>';
  const choice=await foundry.applications.api.DialogV2.wait({window:{title:controlled?'Controlled Channeling':'Unleash Spirit'},position:{width:360},content:selection+'<p>'+(controlled?'Bonus Action · 1 Bardic Inspiration':'Magic action · 1 gathered spirit. Select a visible creature within 30 feet.')+'</p>',rejectClose:false,buttons:[{action:'confirm',label:'Confirm',default:true,disabled:controlled?remaining(c.resource)<1:!stored.length,callback:(_e,_b,d)=>controlled?{mode,number:Number(d.element.querySelector('[name="channel"]').value)}:{mode,effect:d.element.querySelector('[name="unleash"]').value}},{action:'cancel',label:'Cancel',callback:()=>null}]});
  if(!choice)return;
  if(choice.mode==='controlled'){const result=await useHelper(c.actor,controlledSpiritData(item,choice.number));if(result?.message)await processSpiritCard(result.message);return result;}
  const selected=values(game.user.targets).map(t=>t.document??t);if(selected.length!==1)throw Error('Select one creature before unleashing a spirit.');
  const source=values(item.system.activities)[0]?.getUsageToken?.()??c.actor.token;if(!source)throw Error('Place the Bard on the map first.');
  const meta={effect:choice.effect,request:foundry.utils.randomID(),source:(source.document??source).uuid,target:selected[0].uuid};let card,held=false;
  try{
   held=true;const stored=await operate('reserve',meta);const native=await fromUuid(stored.uuid);if(!native)throw Error('The native spirit feature could not be loaded.');
   const result=await useHelper(c.actor,unleashSpiritData(native,c.actor,meta),meta);card=result?.message;if(!card)return;
   globalThis.Ugmuls55eAutomationPendingCast?.onCancel(card,()=>operate('rollback',{...meta,card:card.id}));await operate('finish',{...meta,card:card.id});held=false;return result;
  }finally{if(held)await operate('rollback',{...meta,card:card?.id});}
 }finally{dialogs.delete(c.actor.uuid);}
}
export function prepareSpiritUse(activity,usage,dialog,message){
 const meta=flag(activity.item,'spiritUnleash');if(!meta||meta.activity&&meta.activity!==(activity.id??activity._id))return;
 // Await the authoritative reservation at native consumption, including scaled clones.
 const wire=a=>{if(a._rsaSpiritWired)return;a._rsaSpiritWired=true;const consume=a.consume;a.consume=async function(...args){await operate('validate',meta);return consume.apply(this,args);};};
 wire(activity);const scaling=activity._prepareUsageScaling;activity._prepareUsageScaling=async function(...args){const result=await scaling.apply(this,args),rebuilt=args.at(-1)?.system?.activities?.get?.(this.id);if(rebuilt)wire(rebuilt);return result;};
}
export function prepareSpiritPlacement(activity,config){
 const meta=flag(activity.item,'spiritUnleash');if(meta&&(!meta.activity||meta.activity===(activity.id??activity._id))&&activity.target?.template?.type&&resolve(meta.target))config.rsaLifeTransferToken=meta.target;
}
export function renderSpirits(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){for(const old of node.querySelectorAll(':scope > .rsa-spirit-channel'))old.remove();if(card?.isContentVisible===false||!enabled())continue;const receipt=flag(card,'spiritGranted'),draw=flag(card,'spiritDraw');if(!receipt){try{sourceContext(card,game.user);}catch{continue;}}
  const row=document.createElement('div');row.className='rsa-spirit-channel';if(receipt)row.textContent='Channeled Spirit — '+receipt.name;else if(card.author?.id===game.user.id||game.user.isGM){const button=document.createElement('button');button.type='button';button.textContent=draw?'Choose Channeled Spirit':'Gather Spirit';button.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();button.disabled=true;try{await chooseDraw(card,await operate('gather',{card:card.id}));}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});row.append(button);}if(row.childNodes.length)node.append(row);
 }
}
export function installSpirits(Type){const p=Type?.prototype;if(!p?.use||wrapped.has(p))return;wrapped.add(p);const original=p.use,own=Object.hasOwn(p,'use');p.use=function(...args){if(spiritsItem(this.item))return openSpirits(this.item).catch(report);return (own?original:Object.getPrototypeOf(p).use).apply(this,args);};}
function report(error){console.error('Spirits from Beyond',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'spiritsBeyondAutomation',{name:'Spirits Bard: Spirits from Beyond',hint:'Track gathered spirits until a rest, gather when giving Bardic Inspiration, and choose Controlled Channeling or native Unleash activities.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationSpirits={isItem:spiritsItem,open:item=>openSpirits(item).catch(report)};installSpirits(CONFIG.DND5E.activityTypes?.utility?.documentClass);
 installTransferPlacement(globalThis.dnd5e?.canvas?.TemplatePlacement);Hooks.on('dnd5e.preCreateMeasuredTemplate',prepareSpiritPlacement);
 Hooks.on('dnd5e.postActivityConsumption',captureSpiritGathering);Hooks.on('dnd5e.preUseActivity',prepareSpiritUse);Hooks.on('dnd5e.renderChatMessage',renderSpirits);
 const completed=card=>{processSpiritCard(card).catch(report);if(!authority()||flag(card,'pendingCast')||flag(card,'targetsConfirmationPending'))return;const meta=flag(card,'spiritUnleash'),effect=resolve(meta?.effect),state=flag(effect,'spiritReservation');if(meta&&state?.request===meta.request)spiritOperation('finish',{...meta,card:card.id},game.users.get(state.user)).catch(report);};
 Hooks.on('dnd5e.postUseActivity',(_a,_u,r)=>{if(r?.message)completed(r.message);});Hooks.on('updateChatMessage',completed);
 Hooks.on('dnd5e.restCompleted',(actor,result)=>{if(result&&actor.isOwner&&(spiritsFeature(actor)||values(actor.effects).some(e=>flag(e,'gatheredSpirit'))))operate('rest',{actor:actor.uuid}).catch(report);});
 Hooks.on('updateActor',(actor,changes)=>{if(changes?.['flags.'+ID+'.spiritsRest']!==undefined||changes?.flags?.[ID]?.spiritsRest!==undefined)globalThis.Ugmuls55eAutomationChatRefresh?.request('spiritsBeyond',actor);});
 for(const event of ['updateItem','deleteItem'])Hooks.on(event,item=>{if(spiritsItem(item))globalThis.Ugmuls55eAutomationChatRefresh?.request('spiritsBeyond',item);});
 game.socket.on('module.'+ID,p=>{if(p?.action==='spiritReply'&&p.user===game.user.id){const job=waiting.get(p.request);if(!job)return;waiting.delete(p.request);clearTimeout(job.timer);p.error?job.reject(Error(p.error)):job.resolve(p.result);return;}if(p?.action!=='spiritOperation'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user);if(!user?.active)return;spiritOperation(p.operation,p.payload,user).then(result=>game.socket.emit('module.'+ID,{action:'spiritReply',request:p.request,user:user.id,result}),error=>game.socket.emit('module.'+ID,{action:'spiritReply',request:p.request,user:user.id,error:error.message}));});
});
