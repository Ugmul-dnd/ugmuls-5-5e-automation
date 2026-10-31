import {createEventQueue,describeTarget} from './shared-activity-card.js';
import {wrathBuffData,wrathRange,withinWrathRange} from './wrath-of-the-sea.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),wrapped=new WeakSet(),waiting=new Map(),claims=new Map(),activationReceipts=new Map(),initialClaims=new Map(),posting=new Set(),dialogs=new Set();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
const enabled=()=>game.settings.get(ID,'wrathSeaAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),stamp=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:'outside';
const live=e=>e&&!e.disabled&&!e.isSuppressed&&!e.duration?.expired&&e.active!==false,incap=a=>['incapacitated','unconscious','dead','paralyzed','petrified','stunned'].some(s=>a?.statuses?.has(s)),owns=(a,u)=>!!a&&!!u?.active&&(u.isGM||a.testUserPermission?.(u,'OWNER'));
const feature=(a,id)=>values(a?.items).find(i=>i.type==='feat'&&key(i)===id&&i.system?.source?.rules!=='2014'),effects=a=>values(a?.appliedEffects??a?.effects),actorOf=e=>e?.parent?.documentName==='Actor'?e.parent:e?.parent?.actor;
export function activationActivity(a){return enabled()&&a?.type==='save'&&a.item?.system?.source?.rules!=='2014'&&(key(a.item)==='oceanic-gift'||key(a.item)==='stormborn'||key(a.item)==='wrath-of-the-sea'&&a.id==='nNTYj4vqURV4Dhjt');}
export function wildShapePool(actor){const item=feature(actor,'wild-shape'),spent=Number(item?.system?.uses?.spent??0),max=Number(item?.system?.uses?.max);return {item,available:Number.isFinite(max)&&Number.isFinite(spent)?Math.max(0,max-spent):0};}
function actorToken(actor,ref){const token=resolve(ref);if(token?.actor?.uuid===actor?.uuid)return token;return actor?.token??values(globalThis.canvas?.scene?.tokens).find(t=>t.actor?.uuid===actor?.uuid);}
export function activationCandidates(actor,source,user=game.user){return values(source?.parent?.tokens).filter(t=>t.actor&&(t.uuid===source.uuid||t.actor.uuid!==actor.uuid)&&!incap(t.actor)&&t.disposition===source.disposition&&(user.isGM||!t.hidden)&&(t.uuid===source.uuid||withinWrathRange(source,t,60,{sight:false})));}
export function activationPlan(actor,payload,user=game.user){
 const source=resolve(payload.source),target=resolve(payload.target),gift=feature(actor,'oceanic-gift'),wrath=feature(actor,'wrath-of-the-sea'),pool=wildShapePool(actor);
 if(!enabled()||!owns(actor,user)||incap(actor)||!wrath||!source||source.actor?.uuid!==actor.uuid||user.viewedScene&&source.parent?.id!==user.viewedScene)throw Error('Your Sea Druid must be available on your current map.');
 if(!target||!activationCandidates(actor,source,user).some(t=>t.uuid===target.uuid)||!gift&&target.uuid!==source.uuid)throw Error('Choose a friendly willing creature within 60 feet.');
 const both=!!payload.self&&target.uuid!==source.uuid;if(both&&!gift)throw Error('Oceanic Gift is required to grant a second emanation.');const cost=both?2:1;if(pool.available<cost)throw Error('Not enough Wild Shape uses remain.');
 return {source,target,gift,wrath,pool,cost,recipients:both?[target,source]:[target]};
}
export function activationData(plan){
 const item=plan.gift??plan.wrath,id=plan.gift?(plan.cost===2?'LHQqJAKTruxBN27B':'HfSSFuPEcVqQLurp'):'nNTYj4vqURV4Dhjt',data=item.toObject(),native=data.system.activities[id];if(!native)throw Error('The native manifestation activity is unavailable.');
 data._id=foundry.utils.randomID();data.effects=[];data.system.identifier='rsa-wrath-sea-activation';data.system.activities={[id]:native};native.type='utility';delete native.save;delete native.damage;native.effects=[];native.appliedEffects=[];native.roll={prompt:false,formula:''};native.target={override:true,prompt:false,template:{type:''},affects:{type:'self',count:'1',choice:false}};native.range={override:true,units:'self'};
 native.consumption={...native.consumption,spellSlot:false,targets:[{type:'itemUses',target:plan.pool.item.id??plan.pool.item.uuid,value:String(plan.cost)}],scaling:{allowed:false}};
 return {data,id};
}
export async function activateOcean(actor,payload,user=game.user){
 if(!authority())throw Error('A connected GM is required.');const plan=activationPlan(actor,payload,user),{data,id}=activationData(plan),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();const activity=helper.system.activities.get(id);
 const result=await activity.use({create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{speaker:ChatMessage.getSpeaker({actor,token:plan.source}),system:{targets:[]},flags:{dnd5e:{item:{data}},[ID]:{activityOverrideData:data,wrathOceanActivation:{caster:actor.uuid,source:plan.source.uuid,cost:plan.cost}}}}});
 const card=result?.message;if(!card)throw Error('Manifestation was canceled or its Bonus Action/resource is unavailable.');
 const base=values(plan.wrath.system.activities).find(a=>a.id==='nNTYj4vqURV4Dhjt'),all=new Map(values(plan.source.parent.tokens).filter(t=>t.actor).map(t=>[t.actor.uuid,t.actor]));all.set(actor.uuid,actor);const priorRecipients=flag(actor,'wrathOceanRecipients');for(const ref of priorRecipients??[]){const prior=resolve(ref),bearer=actorOf(prior);if(bearer)all.set(bearer.uuid,bearer);}const changed=[],created=[];
 try{
  // Revalidate the chosen bearer after native consumption; do not charge twice.
  if(!activationCandidates(actor,plan.source,user).some(t=>t.uuid===plan.target.uuid))throw Error('The selected recipient moved or became unavailable.');
  for(const bearer of all.values())for(const effect of values(bearer.effects)){const state=flag(effect,'wrathSea');if(state?.caster===actor.uuid&&live(effect)){changed.push({effect,before:effect.toObject()});await effect.update({disabled:true});}}
  const instance=foundry.utils.randomID();
  for(const token of plan.recipients){const effectData=wrathBuffData(base,card,token.actor);effectData.flags[ID].wrathSea={...effectData.flags[ID].wrathSea,instance,sourceItem:plan.wrath.uuid,sourceToken:plan.source.uuid,bearerToken:token.uuid,initialTurn:stamp(),initialGrouped:true};const [effect]=await token.actor.createEmbeddedDocuments('ActiveEffect',[effectData]);created.push(effect);}
  await actor.setFlag(ID,'wrathOceanRecipients',created.map(e=>e.uuid));await card.setFlag(ID,'wrathOceanInitial',{caster:actor.uuid,source:plan.source.uuid,instance,effects:created.map(e=>e.uuid),turn:stamp(),used:false});return {card:card.id,sections:initialSections(card,user)};
 }catch(error){for(const effect of created)await effect.delete();for(const {effect,before}of changed)await effect.update(before);if(flag(actor,'wrathOceanRecipients')!==priorRecipients)await actor.setFlag(ID,'wrathOceanRecipients',priorRecipients??[]);if(card.system?.deltas)await activity.refund(card.system.deltas);await card.delete();throw error;}
}
export async function oceanDialog(actor,source){
 if(dialogs.has(actor.uuid))return;dialogs.add(actor.uuid);try{
  const gift=feature(actor,'oceanic-gift'),pool=wildShapePool(actor),targets=gift?activationCandidates(actor,source):[source],escape=foundry.utils.escapeHTML;if(!source||!targets.length)throw Error('Place the Sea Druid on the map first.');
  const content=gift?'<label>Select Targets for Ocean Gift</label><select name="oceanTarget">'+targets.map(t=>'<option value="'+escape(t.uuid)+'" '+(t.uuid===source.uuid?'selected':'')+'>'+escape(t.name)+'</option>').join('')+'</select><label style="display:flex;gap:8px;margin-top:12px"><input type="checkbox" name="oceanSelf" disabled>Apply to self too</label>':'<p>Self Target: <strong>'+escape(source.name)+'</strong></p>';
  const choice=await foundry.applications.api.DialogV2.wait({window:{title:gift?'Select Targets for Ocean Gift':'Wrath of the Sea'},position:{width:360},content,rejectClose:false,buttons:[{action:'confirm',label:'Confirm',default:true,disabled:pool.available<1,callback:(_event,_button,dialog)=>({target:dialog.element.querySelector('[name="oceanTarget"]')?.value??source.uuid,self:dialog.element.querySelector('[name="oceanSelf"]')?.checked===true})},{action:'cancel',label:'Cancel',callback:()=>null}],render:(_event,dialog)=>{const select=dialog.element.querySelector('[name="oceanTarget"]'),check=dialog.element.querySelector('[name="oceanSelf"]');if(!check)return;const update=()=>{check.disabled=wildShapePool(actor).available<2||select.value===source.uuid;if(check.disabled)check.checked=false;};select.addEventListener('change',update);update();}});
  if(!choice)return;const result=await operate('activate',{request:foundry.utils.randomID(),actor:actor.uuid,source:source.uuid,...choice});await initialOceanDialog(result);return result;
 }finally{dialogs.delete(actor.uuid);}
}
export function initialCandidates(effect,user=game.user){
 const state=oceanState(effect),bearer=actorOf(effect),token=actorToken(bearer,state?.bearerToken),item=resolve(state?.sourceItem),activity=values(item?.system?.activities).find(a=>a.id==='9U9AoJYvcrCQtIMm');if(!live(effect)||!state||incap(bearer)||!token||!activity)return [];
 const hostile=CONST.TOKEN_DISPOSITIONS.HOSTILE,friendly=CONST.TOKEN_DISPOSITIONS.FRIENDLY,enemy=token.disposition===hostile?friendly:hostile;
 return values(token.parent?.tokens).filter(t=>t.disposition===enemy&&(user.isGM||!t.hidden)&&withinWrathRange(token,t,wrathRange(activity)));
}
export function initialSections(card,user=game.user){
 const activation=flag(card,'wrathOceanInitial');if(!activation)return [];
 return activation.effects.map(ref=>{const effect=resolve(ref),state=effect&&oceanState(effect),token=effect&&actorToken(actorOf(effect),state?.bearerToken);if(!state||!token||!live(effect)||state.instance!==activation.instance)return null;return {effect:ref,bearer:token.uuid,name:token.name,range:state.range,candidates:initialCandidates(effect,user).map(t=>({uuid:t.uuid,name:t.name}))};}).filter(Boolean);
}
export async function initialOperation(operation,payload,user=game.user){
 if(!authority()||!user?.active)throw Error('A connected GM is required.');
 if(operation!=='initialClaim'){
  const claim=initialClaims.get(payload.request);if(!claim||claim.user!==user.id)return;
  if(operation==='initialRollback'&&flag(claim.card,'wrathOceanInitial')?.request===payload.request){await claim.card.setFlag(ID,'wrathOceanInitial',claim.before);for(const e of claim.effects)if(oceanState(e.effect)?.instance===claim.before.instance&&flag(e.effect,'wrathSeaInitialUsed')===claim.before.instance)await e.effect.setFlag(ID,'wrathSeaInitialUsed',e.previous??null);}
  initialClaims.delete(payload.request);return;
 }
 if(typeof payload.request!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(payload.request)||initialClaims.has(payload.request))throw Error('This manifestation target request is invalid or already running.');
 const card=game.messages.get(payload.card),activation=flag(card,'wrathOceanInitial'),caster=resolve(activation?.caster);if(!activation||!owns(caster,user)||activation.used||activation.turn!==stamp())throw Error('The initial manifestation opportunity is no longer available.');
 const sections=initialSections(card,user),rows=payload.rows??[];if(!Array.isArray(rows)||rows.length>activation.effects.length||new Set(rows.map(r=>r.effect)).size!==rows.length||rows.some(r=>!activation.effects.includes(r.effect)))throw Error('Choose up to one target for each emanation.');
 const targets=[],selectedEffects=[];
 for(const ref of activation.effects){const effect=resolve(ref),state=effect&&oceanState(effect),section=sections.find(s=>s.effect===ref),row=rows.find(r=>r.effect===ref);if(!live(effect)||!section||state.instance!==activation.instance)throw Error('A manifestation ended or changed before confirmation.');
  if(row?.target){const target=initialCandidates(effect,user).find(t=>t.uuid===row.target);if(!target)throw Error('An initial target moved out of range or is no longer eligible.');targets.push(describeTarget(target));}selectedEffects.push({effect,previous:flag(effect,'wrathSeaInitialUsed')});
 }
 const unique=[...new Map(targets.map(t=>[t.token,t])).values()],first=resolve(activation.effects[0]),state=oceanState(first),item=resolve(state.sourceItem),activity=values(item?.system.activities).find(a=>a.id==='9U9AoJYvcrCQtIMm');let built;
 if(unique.length){const context={item,activity,caster,bearer:caster,token:resolve(activation.source),initial:true};built=strikeData(context);built.data.name='Wrath of the Sea — Initial manifestation';built.data.system.identifier='rsa-wrath-sea-initial';built.data.system.activities[built.id].target.affects.count=String(unique.length);}
 try{await card.setFlag(ID,'wrathOceanInitial',{...activation,used:true,request:payload.request});for(const e of selectedEffects)await e.effect.setFlag(ID,'wrathSeaInitialUsed',activation.instance);}catch(error){await card.setFlag(ID,'wrathOceanInitial',activation);for(const e of selectedEffects)if(flag(e.effect,'wrathSeaInitialUsed')===activation.instance)await e.effect.setFlag(ID,'wrathSeaInitialUsed',e.previous??null);throw error;}
 initialClaims.set(payload.request,{card,before:activation,effects:selectedEffects,user:user.id});if(initialClaims.size>128)initialClaims.delete(initialClaims.keys().next().value);return {...built,actor:caster.uuid,targets:unique};
}
export async function initialOceanDialog(activation){
 const sections=activation?.sections??[];if(!sections.length)return;const escape=foundry.utils.escapeHTML;
 const content='<p>Choose up to one enemy for each emanation. A shared target is included once.</p><div style="display:grid;grid-template-columns:repeat('+sections.length+',minmax(0,1fr));gap:16px">'+sections.map((section,i)=>'<section><h3>'+escape(section.name)+'</h3><select name="oceanInitial'+i+'" aria-label="Initial target for '+escape(section.name)+'"><option value="">No target</option>'+section.candidates.map(t=>'<option value="'+escape(t.uuid)+'" '+(section.candidates.length===1?'selected':'')+'>'+escape(t.name)+'</option>').join('')+'</select></section>').join('')+'</div>';
 const rows=await foundry.applications.api.DialogV2.wait({window:{title:'Confirm Initial Wrath of the Sea Targets'},position:{width:sections.length>1?620:380},content,rejectClose:false,buttons:[{action:'confirm',label:'Confirm',default:true,callback:(_event,_button,dialog)=>sections.map((section,i)=>({effect:section.effect,target:dialog.element.querySelector('[name="oceanInitial'+i+'"]')?.value??''}))},{action:'cancel',label:'Skip Initial Damage',callback:()=>[]}]});
 const request=foundry.utils.randomID(),receipt=await operate('initialClaim',{request,card:activation.card,rows:rows??[]});let committed=false;
 try{if(!receipt.targets.length){committed=true;return;}const actor=resolve(receipt.actor),helper=new CONFIG.Item.documentClass(receipt.data,{parent:actor});helper.prepareFinalAttributes?.();const activity=helper.system.activities.get(receipt.id),result=await activity.use({consume:false,create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:receipt.targets},flags:{dnd5e:{item:{data:receipt.data}},[ID]:{activityOverrideData:receipt.data,riderTriggered:true,wrathSeaInitialSource:activation.card}}}});if(!result?.message)return;committed=true;await globalThis.Ugmuls55eAutomationDamage?.promptDamage(activity,result.message);
 }finally{await operate(committed?'initialKeep':'initialRollback',{request});}
}
export function oceanState(effect){
 const bearer=actorOf(effect),state=flag(effect,'wrathSea');if(state)return {...state,instance:state.instance??state.source??effect.uuid,bearer:bearer?.uuid,sourceItem:state.sourceItem??effect.system?.origin?.item};
 if(effect?.name!=='Manifesting Ocean Spray')return null;const item=resolve(effect.system?.origin?.item??effect.origin),caster=item?.actor??bearer,wrath=feature(caster,'wrath-of-the-sea');if(!wrath)return null;
 return {caster:caster.uuid,bearer:bearer.uuid,sourceItem:wrath.uuid,instance:effect.uuid,range:wrathRange(values(wrath.system.activities).find(a=>a.id==='9U9AoJYvcrCQtIMm'))};
}
export function promptUsers(actor){return values(game.users).filter(u=>u.isGM||actor?.testUserPermission?.(u,'OWNER')).map(u=>u.id);}
export async function postOceanPrompt(effect,initial=false,tokenOverride){
 if(initial||!authority()||!enabled()||!live(effect))return;const state=oceanState(effect),actor=actorOf(effect);if(!state||incap(actor))return;const token=tokenOverride??actorToken(actor,state.bearerToken);if(!token)return;
 const turn=stamp();if(state.initialGrouped&&state.initialTurn===turn)return;const previous=flag(effect,'wrathSeaPrompt'),pendingKey=effect.uuid+':'+state.instance+':'+turn;if(posting.has(pendingKey)||previous?.instance===state.instance&&previous.stamp===turn&&previous.token===token.uuid&&game.messages.get(previous.card))return;
 posting.add(pendingKey);try{const prompt={effect:effect.uuid,instance:state.instance,token:token.uuid,stamp:turn,initial};const card=await ChatMessage.create({speaker:ChatMessage.getSpeaker({actor,token}),whisper:promptUsers(actor),content:'<div class="chat-card"><button type="button" data-wrath-sea-ba>BA - Wrath of the Sea</button></div>',flags:{[ID]:{wrathSeaPrompt:prompt}}});if(!card)return;
  await effect.setFlag(ID,'wrathSeaPrompt',{...prompt,card:card.id});if(previous?.card)globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(previous.card));
 }finally{posting.delete(pendingKey);}
}
export function strikeContext(card,user=game.user,targetRef){
 const prompt=flag(card,'wrathSeaPrompt'),effect=resolve(prompt?.effect),state=effect&&oceanState(effect),bearer=effect&&actorOf(effect),token=resolve(prompt?.token),item=resolve(state?.sourceItem),caster=item?.actor;
 if(!enabled()||!prompt||!live(effect)||!state||state.instance!==prompt.instance||!owns(bearer,user)||!token||token.actor?.uuid!==bearer.uuid||incap(bearer)||key(item)!=='wrath-of-the-sea')throw Error('This Wrath of the Sea manifestation is no longer available.');
 const initial=prompt.initial&&prompt.stamp===stamp()&&flag(effect,'wrathSeaInitialUsed')!==state.instance;
 if(game.combat?.started){const acting=game.combat.combatant?.actor?.uuid;if(!initial&&(prompt.stamp!==stamp()||acting!==bearer.uuid))throw Error('Use the current turn’s Wrath of the Sea card.');if(flag(effect,'wrathSeaStrike')?.stamp===stamp()&&flag(effect,'wrathSeaStrike')?.instance===state.instance)throw Error('Wrath of the Sea was already used this turn.');}
 if(!initial&&globalThis.Ugmuls55eAutomationResources?.bonusActionUsed(bearer))throw Error('Bonus Action already used.');
 const activity=values(item.system.activities).find(a=>a.id==='9U9AoJYvcrCQtIMm');if(!activity)throw Error('The original Druid’s Bonus Action Save is unavailable.');
 const range=wrathRange(activity),target=targetRef?resolve(targetRef):null;if(targetRef&&!withinWrathRange(token,target,range))throw Error('Choose one visible target within '+range+' feet of the bearer.');return {prompt,effect,state,bearer,token,item,caster,activity,initial,target,range};
}
export function strikeData(context){
 const {item,activity,caster,bearer,token,initial}=context,data=item.toObject(),id=activity.id,selected=data.system.activities[id],rollData=activity.getRollData?.()??caster.getRollData(),dc=Number(activity.save?.dc?.value);if(!selected||!Number.isFinite(dc)||dc<=0)throw Error('The original Druid’s save DC is unavailable.');
 data._id=foundry.utils.randomID();data.name='Wrath of the Sea';data.system.identifier='rsa-wrath-sea-strike';data.system.activities={[id]:selected};data.effects=[];selected.effects=[];selected.appliedEffects=[];selected.activation={type:initial?'special':'bonus',override:true};selected.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};selected.duration={units:'inst',concentration:false,override:true};selected.target={override:true,prompt:false,template:{type:''},affects:{type:'creature',count:'1',choice:false}};selected.range={override:true,units:'any'};selected.save={...selected.save,dc:{calculation:'',formula:String(dc)}};
 for(const part of selected.damage.parts){const native=part.custom?.enabled?part.custom.formula:part.formula??`${part.number}d${part.denomination}${part.bonus?' + '+part.bonus:''}`;part.custom={enabled:true,formula:CONFIG.Dice.BasicRoll.replaceFormulaData(native,rollData,{missing:0})};part.scaling={mode:''};}selected.damage.onSave='none';
 data.flags??={};data.flags[ID]={...data.flags[ID],wrathStrikeToken:token.uuid};return {data,id};
}
export async function oceanOperation(operation,payload,user=game.user){
 if(!authority()||!user?.active)throw Error('A connected GM is required.');if(operation.startsWith('initial'))return initialOperation(operation,payload,user);if(operation==='activate'){if(typeof payload.request!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(payload.request))throw Error('Invalid manifestation request.');const cacheKey=user.id+':'+payload.request;if(activationReceipts.has(cacheKey))return activationReceipts.get(cacheKey);const actor=resolve(payload.actor),result=await activateOcean(actor,payload,user);activationReceipts.set(cacheKey,result);if(activationReceipts.size>128)activationReceipts.delete(activationReceipts.keys().next().value);return result;}
 if(operation!=='claim'){
  const claim=claims.get(payload.request);if(!claim||claim.user!==user.id)return;
  if(operation==='keep'){const usage=game.messages.get(payload.card);if(usage&&flag(usage,'wrathSeaStrikeSource')===claim.prompt&&usage.getAssociatedActor?.()?.uuid===actorOf(claim.effect)?.uuid&&flag(usage,'pendingCast')){claim.usage=usage.id;return;}claims.delete(payload.request);return;}
  const usage=claim.usage&&game.messages.get(claim.usage);if(usage&&(!flag(usage,'pendingCast')||['save','damage'].some(type=>values(usage.getAssociatedRolls?.(type)).some(c=>c.rolls?.length)))){claims.delete(payload.request);return;}
  if(flag(claim.effect,'wrathSeaStrike')?.request===payload.request){await claim.effect.setFlag(ID,'wrathSeaStrike',claim.previous??null);if(claim.initial)await claim.effect.setFlag(ID,'wrathSeaInitialUsed',claim.previousInitial??null);}claims.delete(payload.request);return;
 }
 if(typeof payload.request!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(payload.request))throw Error('Invalid Wrath request.');if(claims.has(payload.request))throw Error('This Wrath request was already claimed.');
 const card=game.messages.get(payload.card),context=strikeContext(card,user,payload.target);if(!context.target)throw Error('Select one target.');const built=strikeData(context),previous=flag(context.effect,'wrathSeaStrike'),previousInitial=flag(context.effect,'wrathSeaInitialUsed');
 await context.effect.setFlag(ID,'wrathSeaStrike',{request:payload.request,instance:context.state.instance,stamp:stamp()});try{if(context.initial)await context.effect.setFlag(ID,'wrathSeaInitialUsed',context.state.instance);}catch(error){await context.effect.setFlag(ID,'wrathSeaStrike',previous??null);throw error;}
 claims.set(payload.request,{effect:context.effect,previous,previousInitial,initial:context.initial,user:user.id,prompt:card.id});if(claims.size>256)claims.delete(claims.keys().next().value);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return {...built,bearer:context.bearer.uuid,initial:context.initial,target:describeTarget(context.target)};
}
function operate(operation,payload){const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return enqueue(()=>oceanOperation(operation,payload));const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Wrath of the Sea.'));},15000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'wrathOceanOperation',operation,payload,request,user:game.user.id,gm:gm.id});});}
export async function clickOceanStrike(card){
 const selected=[...new Set(values(game.user.targets).map(t=>(t.document??t).uuid))];if(selected.length!==1)throw Error('Select exactly one target for Wrath of the Sea.');strikeContext(card,game.user,selected[0]);const request=foundry.utils.randomID(),receipt=await operate('claim',{request,card:card.id,target:selected[0]});let committed=false,usageCard;
 try{const actor=resolve(receipt.bearer),helper=new CONFIG.Item.documentClass(receipt.data,{parent:actor});helper.prepareFinalAttributes?.();const activity=helper.system.activities.get(receipt.id),result=await activity.use({...(receipt.initial?{consume:false}:{}),create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:[receipt.target]},flags:{dnd5e:{item:{data:receipt.data}},[ID]:{activityOverrideData:receipt.data,...(receipt.initial?{riderTriggered:true}:{}),wrathSeaStrikeSource:card.id}}}});
  if(!result?.message)return;usageCard=result.message;globalThis.Ugmuls55eAutomationPendingCast?.onCancel(usageCard,()=>operate('rollback',{request}));committed=true;await globalThis.Ugmuls55eAutomationDamage?.promptDamage(activity,result.message);
 }finally{await operate(committed?'keep':'rollback',{request,card:usageCard?.id});globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
}
export function renderOceanPrompt(card,html){if(!flag(card,'wrathSeaPrompt')||card.isContentVisible===false)return;const root=html?.[0]??html;for(const button of root?.querySelectorAll?.('[data-wrath-sea-ba]')??[]){let allowed=true;try{strikeContext(card);}catch{allowed=false;}button.disabled=!allowed;if(button.dataset.rsaBound)continue;button.dataset.rsaBound='true';button.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await clickOceanStrike(card);}catch(error){ui.notifications.warn(error.message);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});}}
export function installOceanUse(Type){const p=Type?.prototype;if(!p?.use||wrapped.has(p))return;wrapped.add(p);const use=p.use,own=Object.hasOwn(p,'use');p.use=function(...args){if(!activationActivity(this))return (own?use:Object.getPrototypeOf(p).use).apply(this,args);return oceanDialog(this.actor??this.item.actor,this.getUsageToken?.()).catch(report);};const token=p.getUsageToken,ownToken=Object.hasOwn(p,'getUsageToken');if(token)p.getUsageToken=function(...args){const ref=flag(this.item,'wrathStrikeToken');if(ref){const doc=resolve(ref);if(doc?.actor?.uuid===this.actor?.uuid)return doc;}return (ownToken?token:Object.getPrototypeOf(p).getUsageToken).apply(this,args);};}
export function oceanItemUse(next,...args){
 if(globalThis.Ugmuls55eAutomationStars?.isItem?.(this))return globalThis.Ugmuls55eAutomationStars.open(this);
 if(enabled()&&this.actor&&this.type==='feat'&&['wrath-of-the-sea','oceanic-gift','stormborn'].includes(key(this))&&this.system?.source?.rules!=='2014'){
  const activity=values(this.system.activities).find(activationActivity);if(activity)return oceanDialog(this.actor,activity.getUsageToken?.()).catch(report);
 }
 return next(...args);
}
export function installOceanItem(Type){
 const p=Type?.prototype;if(!p?.use||wrapped.has(p))return;
 if(globalThis.libWrapper?.register&&Type===CONFIG.Item.documentClass){
  // MIXED intentionally handles Sea activation itself; all other uses continue
  // through the registered chain, including Monk's spell-casting bookkeeping.
  libWrapper.register(ID,'CONFIG.Item.documentClass.prototype.use',oceanItemUse,'MIXED');
 }else{const use=p.use;p.use=function(...args){return oceanItemUse.call(this,use.bind(this),...args);};}
 wrapped.add(p);
}
function report(error){console.error('Oceanic Gift / Wrath of the Sea',error);ui.notifications.error(error.message);}
Hooks.once('ready',()=>{
 installOceanUse(CONFIG.DND5E.activityTypes?.save?.documentClass);installOceanItem(CONFIG.Item.documentClass);
 Hooks.on('dnd5e.renderChatMessage',renderOceanPrompt);
 for(const event of ['createActiveEffect','updateActiveEffect'])Hooks.on(event,(effect,changes={})=>{if(!authority()||!enabled())return;const state=oceanState(effect);if(!state){if(flag(effect,'bonusActionUsed')||effect.name==='Bonus Action - used')for(const active of effects(actorOf(effect))){const prompt=flag(active,'wrathSeaPrompt');if(live(active)&&prompt?.card)globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(prompt.card));}return;}const previous=flag(effect,'wrathSeaPrompt');if(previous?.card)globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(previous.card));if(event==='createActiveEffect'||changes.disabled===false||changes.flags?.[ID]?.wrathSea||changes['flags.'+ID+'.wrathSea'])postOceanPrompt(effect,true).catch(report);});
 Hooks.on('deleteActiveEffect',effect=>{const prompt=flag(effect,'wrathSeaPrompt');if(prompt?.card)globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(prompt.card));});
 Hooks.on('updateCombat',(combat,changes)=>{if(!authority()||!enabled()||!combat.started||!['turn','round','started'].some(k=>k in changes))return;const token=combat.combatant?.token;if(!token?.actor)return;for(const effect of effects(token.actor))if(live(effect)&&oceanState(effect))postOceanPrompt(effect,false,token).catch(report);});
 const recover=()=>{if(!authority()||!enabled()||!game.combat?.started)return;const token=game.combat.combatant?.token;if(token?.actor)for(const effect of effects(token.actor))if(live(effect)&&oceanState(effect))postOceanPrompt(effect,false,token).catch(report);};Hooks.on('canvasReady',recover);recover();
 game.socket.on('module.'+ID,packet=>{if(packet?.action==='wrathOceanReply'&&packet.user===game.user.id){const pending=waiting.get(packet.request);if(!pending)return;waiting.delete(packet.request);clearTimeout(pending.timer);packet.error?pending.reject(Error(packet.error)):pending.resolve(packet.result);return;}if(packet?.action!=='wrathOceanOperation'||!authority()||packet.gm!==game.user.id||!['activate','claim','keep','rollback','initialClaim','initialKeep','initialRollback'].includes(packet.operation))return;const user=game.users.get(packet.user);if(!user?.active)return;enqueue(()=>oceanOperation(packet.operation,packet.payload,user)).then(result=>game.socket.emit('module.'+ID,{action:'wrathOceanReply',request:packet.request,user:user.id,result}),error=>game.socket.emit('module.'+ID,{action:'wrathOceanReply',request:packet.request,user:user.id,error:error.message}));});
});
