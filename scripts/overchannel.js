import {firearmContext} from './arcane-firearm.js';
import {createEventQueue,isRollAdjustmentLocked,describeTarget} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',selected=new WeakMap(),pending=new WeakMap(),settlements=new WeakMap(),requests=new Map(),waiting=new Map(),enqueue=createEventQueue(),wrapped=new WeakSet(),counterRevisions=new WeakMap();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],enabled=()=>game.settings.get(ID,'overchannelAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export const overchannelFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&(i.identifier??i.system?.identifier)==='overchannel'&&i.system?.source?.rules!=='2014');
const backlashActivity=feature=>values(feature?.system?.activities).find(a=>a.type==='damage'&&values(a.damage?.parts).some(p=>values(p.types).includes('necrotic')));
const turn=()=>game.combat?.started?{combat:game.combat.id,round:game.combat.round,turn:game.combat.turn}:null;
const sameTurn=(a,b)=>!a&&!b||a?.combat===b?.combat&&a?.round===b?.round&&a?.turn===b?.turn;
export function overchannelLevel(c){return Number(c.item?.system?.level)+Math.max(0,Number(c.cast?.system?.scaling??c.item?.flags?.dnd5e?.scaling??0));}
export function overchannelCounter(feature){
 const uses=feature?.system?.uses,spent=Number(uses?.spent),max=Number(uses?.max),activity=backlashActivity(feature);
 const consumption=values(activity?.consumption?.targets).find(t=>t.type==='itemUses'&&!t.target),amount=Number(consumption?.value),forward=values(uses?.recovery).some(r=>r.period==='lr'&&r.type==='loseAll');
 if(!Number.isInteger(spent)||spent<0||forward&&(!Number.isInteger(max)||max<=0||!Number.isInteger(amount)||amount>=0))return null;
 // Updated PHB Overchannel counts available uses (negative consumption and
 // loseAll recovery). Legacy features counted spent uses with recoverAll.
 // Native sheets clamp overspent values to zero available. An old module
 // write can leave spent above max; advance from the displayed count on claim,
 // while retaining the exact raw spent value for a canceled-use refund.
 const step=forward?-amount:Number.isInteger(amount)&&amount>0?amount:1,count=forward?Math.max(0,max-spent):spent,nextSpent=forward?max-count-step:spent+step;
 return {mode:forward?'available':'spent',spent,max:Number.isFinite(max)?max:null,step,count,nextSpent,canAdvance:!forward||nextSpent>=0};
}
export const overchannelCount=feature=>overchannelCounter(feature)?.count;
const counterMatches=(a,b)=>!!a&&!!b&&['mode','spent','max','step'].every(k=>a[k]===b[k]);
function counterUnchanged(feature,before,spent){const current=overchannelCounter(feature);return counterMatches(current,{...before,spent});}
export function overchannelBacklash(count,level,feature,counter=overchannelCounter(feature)){
 if(count===0)return null;
 if(counter?.mode!=='available')return ((count+1)*level)+'d12';
 const part=values(backlashActivity(feature)?.damage?.parts).find(p=>values(p.types).includes('necrotic')),formula=part?.custom?.enabled&&part.custom.formula;
 if(!formula)throw Error('Overchannel is missing its native backlash formula.');
 const data=feature.getRollData?.()??{},snapshot={...data,scaling:level,item:{...data.item,uses:{...data.item?.uses,max:counter.max,spent:counter.nextSpent,value:count+counter.step}}},Roll=CONFIG.Dice.BasicRoll;
 const resolved=Roll.replaceFormulaData(formula,snapshot),pool=/^(\(.+\))d(\d+)$/.exec(resolved);
 // Simplify the native dice-count expression without rolling any dice. The
 // snapshot keeps later casts/rests from changing this cast's recorded backlash.
 if(pool&&Roll.safeEval){const number=Roll.safeEval(pool[1]);if(Number.isInteger(number)&&number>=0)return number+'d'+pool[2];}
 return resolved;
}
const bumpCounter=feature=>{const revision=(counterRevisions.get(feature)??0)+1;counterRevisions.set(feature,revision);return revision;};
export function noteOverchannelCounterUpdate(item,changes={}){if(counterRevisions.has(item)&&(changes.system?.uses||Object.keys(changes).some(k=>k==='system.uses'||k.startsWith('system.uses.'))))bumpCounter(item);}
export function overchannelContext(app){const c=firearmContext(app);return {...c,feature:overchannelFeature(c.actor)};}
function validSpell(c){const level=overchannelLevel(c);return c.item?.type==='spell'&&(c.item.system.classIdentifier==='wizard'||c.item.system.sourceItem==='class:wizard')&&level>=1&&level<=5&&['attack','save','damage'].includes(c.activity?.type)&&!!c.activity?.damage?.parts?.length;}
export function overchannelEligible(app){if(!enabled())return false;const c=overchannelContext(app),card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),stamp=flag(c.cast,'overchannelTurn')??flag(c.cast,'overchannel')?.turn,counter=overchannelCounter(c.feature);return !!(c.actor?.isOwner&&c.feature&&c.cast&&counter&&(flag(c.cast,'overchannel')||counter.canAdvance)&&validSpell(c)&&(!card||!isRollAdjustmentLocked(card))&&(!stamp||sameTurn(stamp,turn()))&&![c.cast,card,app.message?.data].some(d=>['regionTriggered','recurringTrigger','riderTriggered','overchannelBacklash'].some(k=>flag(d,k))));}
export function selectOverchannel(app,yes){selected.set(app,yes===true);}
export function addOverchannelChoice(app){if(!overchannelEligible(app))return;const c=overchannelContext(app),active=!!flag(c.cast,'overchannel'),formula=active?null:overchannelBacklash(overchannelCount(c.feature),overchannelLevel(c),c.feature);const row=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:'overchannel',label:active?'Overchannel — active for this spell':'Overchannel — '+(formula?formula+' Necrotic backlash':'Free'),value:active||selected.get(app)===true,used:false,change:yes=>selectOverchannel(app,yes)});const input=row?.querySelector?.('select');if(active&&input){input.disabled=true;input.value='yes';}}
// Only the first native formula in each spell part belongs to the spell.
// Actor/item bonuses and feature riders are separate formulas/rolls and stay random.
export function maximizeSpellDice(roll,config,{preview=false}={}){if(roll.options?.rsaOverchannel)return roll;const result=preview?new roll.constructor(roll.formula,roll.data??{},foundry.utils.deepClone(roll.options)):roll,base=new CONFIG.Dice.DamageRoll(config.parts[0],config.data??{},result.options);const count=base.dice.length;for(const die of result.dice.slice(0,count)){die.options??={};die.options.rsaOverchannelSpellDie=true;}result.options.rsaOverchannel=true;result.resetFormula?.();return result;}
export function finalizeOverchannel(app,rolls,{preview=false}={}){if(!preview)pending.delete(app);if(!overchannelEligible(app))return rolls;const c=overchannelContext(app),active=flag(c.cast,'overchannel');if(!active&&selected.get(app)!==true)return rolls;const configs=app.config?.rolls??[],count=Math.min(c.activity.damage.parts.length,configs.length),result=rolls.map((r,i)=>i<count&&configs[i]?.parts?.[0]?maximizeSpellDice(r,configs[i],{preview}):r);if(!preview&&!active)pending.set(app,{...c,count:overchannelCount(c.feature),counter:overchannelCounter(c.feature),level:overchannelLevel(c)});return result;}
export async function overchannelOperation(operation,payload,user=game.user){
 if(!authority()||!user?.active)throw Error('A connected GM is required for Overchannel.');
 if(operation!=='claim'){
  const entry=requests.get(payload.request);if(!entry||entry.user!==user.id)return;
  if(operation==='rollback'&&flag(entry.cast,'overchannel')?.request===payload.request){
   await entry.cast.unsetFlag(ID,'overchannel');
   if(counterRevisions.get(entry.feature)===entry.revision&&counterUnchanged(entry.feature,entry.counter,entry.counter.nextSpent)){await entry.feature.update({'system.uses.spent':entry.counter.spent});bumpCounter(entry.feature);}
  }
  requests.delete(payload.request);return;
 }
 const existing=requests.get(payload.request);if(existing){if(existing.user!==user.id||existing.cast.id!==payload.cast)throw Error('Overchannel request belongs to another casting.');return;}
 const actor=globalThis.fromUuidSync?.(payload.actor,{strict:false}),cast=game.messages.get(payload.cast),activity=cast?.getAssociatedActivity?.(),feature=overchannelFeature(actor),counter=overchannelCounter(feature),c={actor,cast,activity,item:activity?.item};
 if(!enabled()||!feature||!counter?.canAdvance||!(user.isGM||actor.testUserPermission?.(user,'OWNER'))||cast?.getAssociatedActor?.()?.uuid!==actor.uuid||!validSpell(c)||overchannelLevel(c)!==payload.level||counter.count!==payload.count||payload.counter&&!counterMatches(counter,payload.counter)||typeof payload.request!=='string'||flag(cast,'overchannel')||['regionTriggered','recurringTrigger','riderTriggered'].some(k=>flag(cast,k))||flag(cast,'overchannelTurn')&&!sameTurn(flag(cast,'overchannelTurn'),turn()))throw Error('Overchannel changed or its native counter is full. Reopen the damage configuration.');
 await feature.update({'system.uses.spent':counter.nextSpent});const revision=bumpCounter(feature);
 try{await cast.setFlag(ID,'overchannel',{request:payload.request,count:counter.count,level:payload.level,turn:turn(),counter});}
 catch(error){if(counterRevisions.get(feature)===revision&&counterUnchanged(feature,counter,counter.nextSpent)){await feature.update({'system.uses.spent':counter.spent});bumpCounter(feature);}throw error;}
 requests.set(payload.request,{cast,feature,counter,revision,user:user.id});
}
function operate(operation,payload){const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return enqueue(()=>overchannelOperation(operation,payload));const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Overchannel.'));},10000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'overchannelOperation',operation,payload,request,user:game.user.id,gm:gm.id});});}
export async function commitOverchannel(app,options){const entry=pending.get(app);pending.delete(app);if(!entry||!options?.dnd5e?.submitted)return;const current=overchannelContext(app);if(!overchannelEligible(app)||current.cast?.id!==entry.cast.id||current.feature?.uuid!==entry.feature.uuid)throw Error('Overchannel is no longer available for this casting.');const payload={request:foundry.utils.randomID(),actor:entry.actor.uuid,cast:entry.cast.id,count:entry.count,counter:entry.counter,level:entry.level};await operate('claim',payload);settlements.set(app.message,{payload,entry});}
export async function rollOverchannelBacklash(entry,payload){
 const formula=overchannelBacklash(entry.count,entry.level,entry.feature,entry.counter);if(!formula)return;
 const source=backlashActivity(entry.feature);if(!source)throw Error('Overchannel backlash activity is missing.');
 const native=source.toObject?.()??source,parts=values(native.damage?.parts).map(part=>values(part.types).includes('necrotic')?{...part,custom:{...part.custom,enabled:true,formula},number:null,denomination:null,bonus:''}:part);
 const helper=entry.feature.clone({['system.activities.'+source.id+'.damage.parts']:parts}),activity=helper.system.activities.get(source.id),token=entry.cast.getAssociatedToken?.()??entry.actor.getActiveTokens?.()[0]?.document,targets=token?[describeTarget(token.document??token)]:[{actor:entry.actor.uuid,name:entry.actor.name}],data=helper.toObject();
 await activity.rollDamage({isCritical:false},{configure:true},{data:{system:{targets},flags:{dnd5e:{item:{data}},[ID]:{activityOverrideData:data,riderTriggered:true,overchannelBacklash:{cast:entry.cast.id,request:payload.request}}}}});
}
export function installOverchannelDice(Type=CONFIG.Dice.DamageRoll){const p=Type?.prototype;if(!p?.evaluate||Object.hasOwn(p,'rsaOverchannelEvaluation'))return;const evaluate=p.evaluate;p.rsaOverchannelEvaluation=true;p.evaluate=function(options={}){for(const die of this.dice??[]){if(!die.options?.rsaOverchannelSpellDie||die.rsaOverchannelEvaluation)continue;const evaluateDie=die.evaluate;die.rsaOverchannelEvaluation=true;die.evaluate=function(config={}){return evaluateDie.call(this,{...config,maximize:true,minimize:false});};}return evaluate.call(this,options);};}
export function installOverchannelRoll(Type=CONFIG.Dice.DamageRoll){installOverchannelDice(Type);if(!Type?.build||wrapped.has(Type))return;wrapped.add(Type);const build=Type.build,configure=Type.buildConfigure;if(configure)Type.buildConfigure=async function(config,dialog,message){const rolls=await configure.call(this,config,dialog,message);if(dialog.configure!==false||!rolls?.length)return rolls;const app={config,message};const result=finalizeOverchannel(app,rolls);await commitOverchannel(app,{dnd5e:{submitted:true}});return result;};Type.build=async function(config,dialog,message={}){let success=false;try{const result=await build.call(this,config,dialog,message);success=!!result?.length;return result;}finally{const record=settlements.get(message);if(record){settlements.delete(message);await operate(success?'keep':'rollback',record.payload);if(success)try{await rollOverchannelBacklash(record.entry,record.payload);}catch(error){report(error);}}}};}
export function overchannelDamageOptions(card,options){if(typeof card==='string')card=game.messages.get(card.replace(/^ChatMessage\./,''));if(!flag(card,'overchannelBacklash')||options.rsaUndoDamage||options.ignore===true)return options;const ignore={...options.ignore};for(const key of ['resistance','immunity']){if(ignore[key]===true)continue;ignore[key]=new Set(ignore[key]??[]);ignore[key].add('necrotic');}return {...options,ignore};}
function installBacklash(Type=globalThis.customElements?.get('damage-application')){const p=Type?.prototype;if(!p?.getMergedOptions||p.rsaOverchannel)return;const get=p.getMergedOptions;p.getMergedOptions=function(uuid){return overchannelDamageOptions(this.chatMessage,get.call(this,uuid));};p.rsaOverchannel=true;}
function report(error){console.error('Overchannel',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'overchannelAutomation',{name:'Evoker: Overchannel',hint:'Select Overchannel in spell damage configuration. First use is free; subsequent uses roll escalating Necrotic backlash. Maximize spell dice on all rays of this cast, preserving added rider dice. Track the native Overchannel counter, including the updated count-up layout, with its own Long Rest recovery.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationOverchannel={addOverchannelChoice,finalizeOverchannel,commitOverchannel};installOverchannelRoll();installBacklash();
 Hooks.on('updateItem',noteOverchannelCounterUpdate);
 Hooks.on('preCreateChatMessage',card=>{const activity=card.getAssociatedActivity?.();if(enabled()&&card.type==='usage'&&overchannelFeature(activity?.actor)&&activity.item?.type==='spell'&&turn())card.updateSource({['flags.'+ID+'.overchannelTurn']:turn()});});
 Hooks.on('dnd5e.preUseActivity',activity=>{if(enabled()&&overchannelFeature(activity.actor)?.uuid===activity.item?.uuid){ui.notifications.info('Select Overchannel in the spell’s damage configuration.');return false;}});
 Hooks.on('dnd5e.preRollDamageV2',(config,dialog,message)=>{const app={config,message};if(!overchannelEligible(app))return;const configure=dialog.configure;Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog('damage',dialog));if(configure===false)dialog.configure=false;});
 Hooks.on('dnd5e.preCalculateDamage',(actor,damages,options)=>{const next=overchannelDamageOptions(options.origin??options.originatingMessage,options);if(next!==options)options.ignore=next.ignore;});
 game.socket.on('module.'+ID,packet=>{if(packet?.action==='overchannelReply'&&packet.user===game.user.id){const entry=waiting.get(packet.request);if(!entry)return;waiting.delete(packet.request);clearTimeout(entry.timer);packet.error?entry.reject(Error(packet.error)):entry.resolve();return;}if(packet?.action!=='overchannelOperation'||!authority()||packet.gm!==game.user.id||!['claim','keep','rollback'].includes(packet.operation))return;const user=game.users.get(packet.user);if(!user?.active)return;enqueue(()=>overchannelOperation(packet.operation,packet.payload,user)).then(()=>game.socket.emit('module.'+ID,{action:'overchannelReply',request:packet.request,user:user.id}),error=>game.socket.emit('module.'+ID,{action:'overchannelReply',request:packet.request,user:user.id,error:error.message}));});
});
