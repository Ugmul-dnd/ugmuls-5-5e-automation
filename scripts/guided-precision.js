import {createEventQueue,isRollAdjustmentLocked} from "./shared-activity-card.js";
import {firearmContext} from "./arcane-firearm.js";
const ID='ugmuls-5-5e-automation',selected=new WeakMap(),pending=new WeakMap(),settlements=new WeakMap(),requests=new Map(),waiting=new Map(),enqueue=createEventQueue(),wrapped=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=r=>{if(typeof r!=='string')return r;if(!r)return null;try{return globalThis.fromUuidSync?.(r,{strict:false});}catch{return null;}},key=i=>i?.identifier??i?.system?.identifier;
const enabled=()=>game.settings.get(ID,'guidedPrecisionAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),turn=()=>game.combat?.started?[game.combat.id,game.combat.round,game.combat.turn].join(':'):null;
const live=e=>e&&!e.disabled&&e.active!==false&&!e.duration?.expired&&e.system?.expired!==true;
export const precisionFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&key(i)==='guided-precision'&&i.system?.source?.rules!=='2014');
function message(ref){return resolve(ref)??game.messages.get(String(ref??'').replace(/^ChatMessage\./,''));}
export function faerieSource(effect){
 if(!live(effect))return null;
 const card=message(effect.system?.origin?.message),refs=[effect.system?.origin?.activity,effect.system?.origin?.item,effect.getFlag?.('dnd5e','item')?.uuid,effect.origin,effect._stats?.duplicateSource,card?.system?.activity?.uuid,card?.system?.item?.uuid];
 const sources=refs.map(resolve).filter(Boolean),items=sources.map(s=>s.item??(s.type==='spell'?s:s.parent)).filter(i=>i?.type==='spell');
 const recorded=card?.getAssociatedItem?.();if(recorded)items.push(recorded);
 const spell=items.find(i=>key(i)==='faerie-fire');if(!spell)return null;
 const source=resolve(effect.system?.origin?.actor)??card?.getAssociatedActor?.()??spell.actor??effect.getSourceActor?.();
 return {spell,actor:source?.documentName==='Actor'?source:source?.actor??source};
}
export function outlinedEffect(effect){return effect?.name?.trim().toLowerCase()==='outlined'||effect?.system?.origin?.profile==='Y2i0OvwOixxag0ed'||String(effect?._stats?.duplicateSource??'').endsWith('.Y2i0OvwOixxag0ed');}
export function ownFaerieFire(effect,caster){if(!outlinedEffect(effect))return false;const source=faerieSource(effect);return !!source&&!!caster&&source.actor?.uuid===caster.uuid&&(!source.spell.actor||source.spell.actor.uuid===caster.uuid);}
export function precisionContext(app){
 const c=firearmContext(app),card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),data=app.message?.data??{},speaker=data.speaker??card?.speaker;
 const attackId=data.flags?.[ID]?.damageAttackId??flag(card,'damageAttackId'),attack=attackId?game.messages.get(attackId):null;
 let cast=c.cast;if(!cast&&attack){let current=message(attack.system?.origin),seen=new Set();while(current&&!seen.has(current.id)){seen.add(current.id);if(current.type==='usage')cast=current;current=message(current.system?.origin);}}
 const actor=(speaker?globalThis.ChatMessage?.getSpeakerActor?.(speaker):null)??card?.getAssociatedActor?.()??cast?.getAssociatedActor?.()??c.actor;
 // Empty dialog target arrays must not mask the exact pending/attack/cast targets.
 const targets=[card?.system?.targets,attack?.system?.targets,data.system?.targets,cast?.system?.targets].find(t=>t?.length)??[];
 return {...c,cast,actor,feature:precisionFeature(actor),card,targets};
}
export function precisionEligible(app){
 const c=precisionContext(app);if(!enabled()||!c.actor?.isOwner||!c.feature||!c.cast||!['attack','save','damage'].includes(c.activity?.type)||c.targets.length!==1||c.card&&isRollAdjustmentLocked(c.card)||app.message?.data?.flags?.[ID]?.masteryGraze)return false;
 const target=resolve(c.targets[0].token)?.actor??resolve(c.targets[0].actor);
 return values(target?.effects).some(e=>ownFaerieFire(e,c.actor));
}
export function precisionBonus(actor,feature){const part=values(values(feature.system?.activities).find(a=>a.type==='damage')?.damage?.parts)[0];if(!part?.bonus)throw Error('Guided Precision is missing its native Intelligence formula.');const roll=new CONFIG.Dice.BasicRoll(part.bonus,actor.getRollData());if(roll.isDeterministic===false)throw Error('Guided Precision requires a flat Intelligence bonus.');const bonus=Number(roll.evaluateSync().total);if(!Number.isFinite(bonus))throw Error('Guided Precision bonus could not be resolved.');return bonus;}
export function precisionUsed(c){return Number(c.feature?.system?.uses?.value??Number(c.feature?.system?.uses?.max)-Number(c.feature?.system?.uses?.spent??0))<=0||!!turn()&&flag(c.actor,'guidedPrecisionTurn')?.turn===turn();}
export function selectPrecision(app,yes,index=selected.get(app)?.index??0){selected.set(app,{yes:yes===true,index});}
export function addPrecisionChoice(app){
 if(!precisionEligible(app)){app.element?.querySelector?.('[data-rsa-choice="guided-precision"]')?.remove();return;}
 const c=precisionContext(app),state=selected.get(app),parts=(app.rolls??[]).slice(0,app.config?.rolls?.length??1).map((r,index)=>({index,type:r.options?.type??values(r.options?.types)[0]})).filter(p=>p.type&&p.type!=='healing'&&p.type!=='temphp');if(!parts.length)return;
 const used=precisionUsed(c),row=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:'guided-precision',label:'Guided Precision',value:state?.yes!==false,used,change:yes=>selectPrecision(app,yes)});
 row?.querySelector?.('[data-precision-part]')?.remove();if(!row||parts.length<2)return;
 const select=document.createElement('select');select.dataset.precisionPart='true';select.disabled=used;for(const p of parts){const option=document.createElement('option');option.value=p.index;option.textContent='Roll '+(p.index+1)+' — '+p.type;select.append(option);}select.value=parts.find(p=>p.index===state?.index)?.index??parts[0].index;select.addEventListener('change',()=>{selectPrecision(app,selected.get(app)?.yes!==false,Number(select.value));app.rebuild();});row.querySelector('.form-fields')?.append(select);
}
export function finalizePrecision(app,rolls,{preview=false}={}){
 if(!preview)pending.delete(app);if(!precisionEligible(app)||selected.get(app)?.yes===false)return rolls;
 const c=precisionContext(app);if(precisionUsed(c))return rolls;
 const original=rolls.filter(r=>!r.options?.rsaGuidedPrecision),parts=original.slice(0,app.config?.rolls?.length??1),index=selected.get(app)?.index??0,base=parts[index]??parts[0],type=base?.options?.type??values(base?.options?.types)[0];if(!type||['healing','temphp'].includes(type))return rolls;
 const bonus=precisionBonus(c.actor,c.feature),roll=new CONFIG.Dice.DamageRoll(String(bonus)+'[Guided Precision]',{}, {type,types:[type],properties:values(base.options?.properties),flavor:'Guided Precision',isCritical:false,critical:{...base.options?.critical,bonusDice:0,bonusDamage:''},rsaGuidedPrecision:true});
 if(!preview)pending.set(app,{...c,bonus,type,turn:turn()});return [...original,roll];
}
export async function precisionOperation(operation,payload,user=game.user){
 if(!authority()||!user?.active)throw Error('A connected GM is required for Guided Precision.');
 if(operation!=='claim'){const e=requests.get(payload.request);if(!e||e.user!==user.id)return;if(operation==='rollback'){
  if(flag(e.actor,'guidedPrecisionTurn')?.request===payload.request)await e.actor.setFlag(ID,'guidedPrecisionTurn',e.previous??null);
  if(e.turn===turn())await e.feature.update({'system.uses.spent':Math.max(0,Number(e.feature.system.uses.spent??0)-1)});
 }requests.delete(payload.request);return;}
 if(requests.has(payload.request))return;
 const actor=resolve(payload.actor),cast=game.messages.get(payload.cast),feature=precisionFeature(actor),target=resolve(payload.target),c={actor,feature};
 if(!enabled()||!actor||!(user.isGM||actor.testUserPermission?.(user,'OWNER'))||!feature||cast?.getAssociatedActor?.()?.uuid!==actor.uuid||cast.system?.targets?.length!==1||cast.system.targets[0].token!==payload.target||!values(target?.actor?.effects).some(e=>ownFaerieFire(e,actor))||payload.turn!==turn()||precisionUsed(c)||payload.bonus!==precisionBonus(actor,feature)||typeof payload.request!=='string'||!Object.hasOwn(CONFIG.DND5E.damageTypes,payload.type))throw Error('Guided Precision is already used this turn or its target is no longer affected by your Faerie Fire.');
 const previous=flag(actor,'guidedPrecisionTurn');await feature.update({'system.uses.spent':Number(feature.system.uses.spent??0)+1});
 try{if(turn())await actor.setFlag(ID,'guidedPrecisionTurn',{turn:turn(),request:payload.request});}catch(error){await feature.update({'system.uses.spent':Math.max(0,Number(feature.system.uses.spent??0)-1)});throw error;}
 requests.set(payload.request,{actor,feature,previous,turn:payload.turn,user:user.id});if(requests.size>256)requests.delete(requests.keys().next().value);
}
function operate(operation,payload){const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return enqueue(()=>precisionOperation(operation,payload));const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Guided Precision.'));},10000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'precisionOperation',operation,payload,request,user:game.user.id,gm:gm.id});});}
export async function commitPrecision(app,options){
 const e=pending.get(app);pending.delete(app);if(!e||!options?.dnd5e?.submitted)return;
 if(!precisionEligible(app)||e.turn!==turn())throw Error('Guided Precision changed. Reopen damage configuration.');
 const payload={request:foundry.utils.randomID(),actor:e.actor.uuid,cast:e.cast.id,target:e.targets[0].token,turn:e.turn,type:e.type,bonus:e.bonus};await operate('claim',payload);settlements.set(app.message,payload);
}
export function protectedFaerieConcentration(actor){
 if(!enabled()||!precisionFeature(actor))return false;const effects=values(actor.concentration?.effects).filter(live);return effects.length>0&&effects.every(e=>{const source=faerieSource(e);return source?.actor?.uuid===actor.uuid;});
}
export function installPrecision(Type=CONFIG.Dice.DamageRoll,ActorType=CONFIG.Actor.documentClass){
 if(Type?.build&&!wrapped.has(Type)){wrapped.add(Type);const build=Type.build;Type.build=async function(config,dialog,message={}){let success=false;try{const result=await build.call(this,config,dialog,message);success=!!result?.length;return result;}finally{const payload=settlements.get(message);if(payload){settlements.delete(message);await operate(success?'keep':'rollback',payload);}}};}
 const p=ActorType?.prototype;if(p?.challengeConcentration&&!wrapped.has(p)){wrapped.add(p);const challenge=p.challengeConcentration;p.challengeConcentration=function(...args){if(protectedFaerieConcentration(this))return Promise.resolve(null);return challenge.apply(this,args);};}
}
function report(error){console.error('Guided Precision',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'guidedPrecisionAutomation',{name:'Cartographer: Guided Precision',hint:'Offer native Intelligence bonus once per turn against a single recorded target affected by your Faerie Fire. Suppress damage concentration prompts only while Guided Precision protects Faerie Fire.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationPrecision={addPrecisionChoice,finalizePrecision,commitPrecision};installPrecision();
 Hooks.on('dnd5e.preRollDamageV2',(config,dialog,message)=>{const app={config,message};// Attack links/pending targets are populated by later hooks. Install the
 // dialog for the feature holder now; validate target eligibility when rendered.
 if(dialog.configure!==false&&precisionContext(app).feature)Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog('damage',dialog));});
 game.socket.on('module.'+ID,packet=>{if(packet?.action==='precisionReply'&&packet.user===game.user.id){const e=waiting.get(packet.request);if(!e)return;waiting.delete(packet.request);clearTimeout(e.timer);packet.error?e.reject(Error(packet.error)):e.resolve();return;}
  if(packet?.action!=='precisionOperation'||!authority()||packet.gm!==game.user.id||!['claim','keep','rollback'].includes(packet.operation))return;const user=game.users.get(packet.user);if(!user?.active)return;
  enqueue(()=>precisionOperation(packet.operation,packet.payload,user)).then(()=>game.socket.emit('module.'+ID,{action:'precisionReply',request:packet.request,user:user.id}),error=>game.socket.emit('module.'+ID,{action:'precisionReply',request:packet.request,user:user.id,error:error.message}));
 });
});
