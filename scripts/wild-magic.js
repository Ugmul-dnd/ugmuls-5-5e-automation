import {createEventQueue} from './shared-activity-card.js';
import {isSorcererSpell} from './shared-sorcerer.js';
const ID='ugmuls-5-5e-automation',TABLE='Compendium.dnd-players-handbook.tables.RollTable.phbWildMagicSurg',queues=new Map(),waiting=new Map(),receipts=new Map(),wired=new WeakSet();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],enabled=()=>game.settings.get(ID,'wildMagicAutomation')===true;
const resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}},authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),owns=(a,u)=>!!a&&!!u?.active&&(u.isGM||a.testUserPermission?.(u,'OWNER'));
const live=e=>e&&!e.disabled&&!e.isSuppressed&&e.active!==false&&!e.duration?.expired&&!e.system?.expired,turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
const remaining=i=>Math.max(0,Number(i?.system?.uses?.value??(Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0)))||0);
export const tidesFeature=a=>values(a?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)==='tides-of-chaos'||i.name?.trim().toLowerCase()==='tides of chaos'));
export const surgeFeature=a=>values(a?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)==='wild-magic-surge'||i.name?.trim().toLowerCase()==='wild magic surge'));
export const tidesBuff=a=>values(a?.effects).find(e=>live(e)&&flag(e,'tidesOfChaos'));
const actorFor=config=>config?.subject?.actor??config?.subject?.item?.actor??config?.subject;
function rollCastOrigin(config,message){return wildCastOrigin(message?.data?.system?.origin??message?.data?.['system.origin']??config.event?.target?.closest?.('[data-message-id]')?.dataset?.messageId);}
function origin(ref){return typeof ref==='string'?game.messages.get(ref.replace(/^ChatMessage\./,''))??resolve(ref):ref;}
export function wildCastOrigin(ref){let card=origin(ref);const seen=new Set();while(card&&!seen.has(card.id)){seen.add(card.id);if(flag(card,'wildMagicCast'))return card;card=origin(card.system?.origin);}return null;}
const queue=(actor,job)=>{let q=queues.get(actor);if(!q)queues.set(actor,q=createEventQueue());return q(job);};
const refresh=card=>globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
export function tidesAvailable(actor,user=game.user){return enabled()&&owns(actor,user)&&!!surgeFeature(actor)&&remaining(tidesFeature(actor))>0&&!tidesBuff(actor);}
export function tidesRecommendedMode(roll,config={}){
 const o=roll?.options??{},state=o['automated-conditions-5e']??config.options?.['automated-conditions-5e']??config['automated-conditions-5e'],counts=state?.modeCounts;
 const original=config.rolls?.[0]?.options;
 const dis=counts?!!(counts.disadvantages?.present||counts.noAdvantages?.present||state.explicitModeOverride?.action==='disadvantage'):!!(config.disadvantage||o.disadvantage||o.advantageMode===-1||original?.disadvantage||original?.advantageMode===-1);
 return dis?0:1;
}
export function applyTidesMode(roll,config={}){
 const o=roll.options??={},state=o["automated-conditions-5e"]??config.options?.["automated-conditions-5e"]??config["automated-conditions-5e"],dis=tidesRecommendedMode(roll,config)===0;
 o.advantage=true;o.disadvantage=dis;o.advantageMode=dis?0:1;
 if(state){const action=dis?'normal':'advantage';state.explicitModeOverride={action,source:'dialog',family:'d20',proposedAction:state.proposedButton??state.calculatedDefaultButton??'normal',replacesCalculatedMode:true};state.explicitRollDialogAction=action;state.explicitRollDialogOverride=true;state.advantageMode=o.advantageMode;state.defaultButton=action;}
 roll.configureModifiers?.();return o.advantageMode;
}
export function addTidesConfig(app){
 const actor=actorFor(app.config);if(!tidesAvailable(actor))return;if(app.element?.querySelector('[data-tides-of-chaos]'))return;const form=app.element?.matches?.('form')?app.element:app.element?.querySelector('form');if(!form)return;
 const field=document.createElement('fieldset');field.dataset.tidesOfChaos='true';const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=app.config.rsaTidesOfChaos===true;label.append(input,document.createTextNode(' Tides of Chaos — use Advantage'+((app.config.rolls?.length??1)>1?' on the first test':'')));field.append(label);input.addEventListener('change',event=>{event.stopPropagation();app.config.rsaTidesOfChaos=input.checked;});form.append(field);
}
export function prepareTidesDialog(config,dialog,Base){
 if(!tidesAvailable(actorFor(config))||dialog.configure===false)return;
 const Parent=dialog.applicationClass??Base;if(!Parent)return;dialog.applicationClass=class extends Parent{
 _onRender(context,options){super._onRender(context,options);addTidesConfig(this);}
 _finalizeConfig(process,action){super._finalizeConfig(process,action);if(this.config.rsaTidesOfChaos===true&&process.rolls?.[0]){process.rolls[0].options??={};process.rolls[0].options.rsaTidesSelected=true;}}
 };
}
export async function spendTides(actor,payload,user=game.user){
 if(!authority()||!tidesAvailable(actor,user))throw Error('Tides of Chaos is no longer available.');const feature=tidesFeature(actor),cast=wildCastOrigin(payload.cast),before=Number(feature.system.uses.spent??0);if(payload.cast&&(!cast||cast.getAssociatedActor?.()?.uuid!==actor.uuid))throw Error('The source casting changed.');let spent=false,effect;
 try{await feature.update({'system.uses.spent':before+1});spent=true;[effect]=await actor.createEmbeddedDocuments('ActiveEffect',[{name:'Tides of Chaos',img:feature.img,disabled:false,transfer:false,origin:feature.uuid,system:{changes:[],origin:{actor:actor.uuid,item:feature.uuid}},flags:{[ID]:{tidesOfChaos:{request:payload.request,feature:feature.uuid,sinceCast:cast?.id??null,rollMessage:null}}}}]);if(!effect)throw Error('Tides of Chaos could not be applied.');return {actor:actor.uuid,feature:feature.uuid,effect:effect.uuid,request:payload.request,cast:cast?.id??null};}
 catch(error){if(effect)await effect.delete();if(spent)await feature.update({'system.uses.spent':Math.max(0,Number(feature.system.uses.spent??0)-1)});throw error;}
}
export async function refundTides(actor,record,user=game.user){
 if(!authority()||!owns(actor,user))throw Error('You cannot refund these Tides.');const effect=resolve(record.effect),meta=flag(effect,'tidesOfChaos'),feature=tidesFeature(actor);if(effect?.parent?.uuid!==actor.uuid||meta?.request!==record.request||meta.rollMessage||feature?.uuid!==record.feature)return;
 await feature.update({'system.uses.spent':Math.max(0,Number(feature.system.uses.spent??0)-1)});await effect.delete();
}
export function prepareWildCast(activity,usage,dialog,message){
 const actor=activity.actor;if(!enabled()||!surgeFeature(actor)||!isSorcererSpell(activity.item)||usage?.cause?.activity||['regionTriggered','riderTriggered','recurringTrigger','wildMagicGenerated'].some(k=>message?.data?.flags?.[ID]?.[k]))return;
 message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],wildMagicCast:{actor:actor.uuid,item:activity.item.uuid,activity:activity.id,slot:false,tidesAtStart:tidesBuff(actor)?.uuid??null,sameSpell:game.settings.get(ID,'tidesSurgeSameSpell')===true,turn:turn()}};
}
export function recordWildSlot(activity,usage,message){const record=message?.data?.flags?.[ID]?.wildMagicCast;if(!record)return;if((message.data.system?.deltas?.actor??[]).some(d=>/^system\.spells\.(spell[1-9]|pact)\.value$/.test(d.keyPath)&&d.delta<0))record.slot=true;}
export function readyWildCast(card){const record=flag(card,'wildMagicCast'),actor=card?.getAssociatedActor?.(),authorRef=card?.author,author=typeof authorRef==='string'?game.users.get(authorRef):authorRef,activity=card?.getAssociatedActivity?.({scaled:true});if(author&&!(author.isGM||actor?.testUserPermission?.(author,'OWNER')))return null;if(activity&&(!isSorcererSpell(activity.item)||activity.actor?.uuid!==actor?.uuid||activity.id!==record?.activity))return null;return enabled()&&record?.slot===true&&actor?.uuid===record.actor&&!!surgeFeature(actor)&&!flag(card,'pendingCast')&&!flag(card,'targetsConfirmationPending')&&!flag(card,'targetsConfirmationCanceled')?{actor,record}:null;}
export function forcedTides(card){const c=readyWildCast(card),effect=tidesBuff(c?.actor),meta=flag(effect,'tidesOfChaos');if(!c||!effect)return null;const reserved=flag(effect,'tidesSurgeCast');if(reserved&&reserved!==card.id)return null;const prior=flag(card,'wildSurges')?.tides;if(prior&&prior.request!==meta?.request)return null;if(c.record.tidesAtStart===effect.uuid||c.record.sameSpell&&meta?.sinceCast===card.id&&meta.rollMessage)return {...c,effect,meta};return null;}
function messageMode(card){return card.blind?'blind':card.whisper?.length?'gm':'public';}
function visibility(card){return {speaker:card.speaker,whisper:[...(card.whisper??[])],blind:card.blind??false};}
const d100Playback=new Map(),d100Waiting=new Map();
export async function playLocalWildD100(card,state){
 if(!game.dice3d?.showForRoll||globalThis.document?.hidden===true||globalThis.document?.hasFocus?.()===false)return;
 const author=typeof card.author==='string'?game.users.get(card.author):card.author,user=author?.active?author:game.user,roll=CONFIG.Dice.BasicRoll.fromData(state.roll);
 let stopped=false,timeout;const playback=(async()=>{
  await game.dice3d.showForRoll(roll,user,false,card.whisper?.length?card.whisper:null,card.blind??false,state.message,card.speaker);
  const queue=game.dice3d.queue;
  // DSN's immediatelyDisplayChatMessages setting can resolve showForRoll before
  // landing. Wait for this throw to leave the simultaneous-roll accumulator,
  // then use DSN's own queue completion promise. Never patch its queue/settings.
  while(!stopped&&queue?.nextAnimation?._items?.some(entry=>entry.params?.messageId===state.message)){await new Promise(resolve=>setTimeout(resolve,20));}
  if(!stopped)await queue?.idle?.();
 })();
 try{await Promise.race([globalThis.Ugmuls55eAutomationWaitForAnimation?.(playback)??playback,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Wild Magic dice did not finish. The table result has not been displayed.')),30000);})]);}finally{stopped=true;clearTimeout(timeout);}
}
export async function playWildD100(card,state,kind){
 const audience=new Map([...values(game.users),game.user].filter(u=>u?.active&&(!card.blind||u.isGM)&&(!card.whisper?.length||u.isGM||card.whisper.some(w=>(w.id??w)===u.id))).map(u=>[u.id,u])),remote=[...audience.keys()].filter(id=>id!==game.user.id);
 const local=audience.has(game.user.id)?playLocalWildD100(card,state):Promise.resolve();if(!remote.length)return local;
 const waiting=new Promise((resolve,reject)=>{const pending=new Set(remote),cleanup=()=>{clearTimeout(timeout);clearInterval(disconnects);d100Waiting.delete(state.message);},finish=()=>{if(!pending.size){cleanup();resolve();}};
  const timeout=setTimeout(()=>{cleanup();reject(Error('A client did not confirm the Wild Magic dice finished. The table result has not been displayed.'));},30000),disconnects=setInterval(()=>{for(const id of pending)if(!game.users.get(id)?.active)pending.delete(id);finish();},500);
  d100Waiting.set(state.message,{pending,finish,cancel:cleanup,fail:error=>{cleanup();reject(Error(error));}});
  game.socket.emit('module.'+ID,{action:'wildMagicD100',gm:game.user.id,cast:card.id,kind,result:state.message,users:remote});
 });try{await Promise.all([local,waiting]);}finally{d100Waiting.get(state.message)?.cancel();}
}
export function waitWildD100State(packet){
 const inactive=()=>globalThis.document?.hidden===true||globalThis.document?.hasFocus?.()===false;if(inactive())return Promise.resolve({skip:true});
 const read=()=>{const card=game.messages.get(packet.cast),group=flag(card,'wildSurges')?.[packet.kind],state=group?.controlled?values(group.choices).find(c=>c.message===packet.result):group;return state?.message===packet.result?{card,state}:null;};
 const current=read();if(current)return Promise.resolve(current);
 // Socket playback and document updates use separate deliveries. Wait for the
 // authoritative stored roll to arrive instead of rejecting a valid new choice.
 return new Promise((resolve,reject)=>{let timeout;const listeners=[];const visibility=()=>{if(inactive()){cleanup();resolve({skip:true});}},blur=()=>{cleanup();resolve({skip:true});};const cleanup=()=>{clearTimeout(timeout);for(const[event,id]of listeners)Hooks.off(event,id);globalThis.document?.removeEventListener?.('visibilitychange',visibility);globalThis.window?.removeEventListener?.('blur',blur);};const check=card=>{if(card?.id!==packet.cast)return;const found=read();if(found){cleanup();resolve(found);}};
  for(const event of ['createChatMessage','updateChatMessage'])listeners.push([event,Hooks.on(event,check)]);
  globalThis.document?.addEventListener?.('visibilitychange',visibility);globalThis.window?.addEventListener?.('blur',blur);
  timeout=setTimeout(()=>{cleanup();reject(Error('The Wild Magic dice data did not arrive. Refresh clients and retry the saved surge.'));},5000);check(game.messages.get(packet.cast));
 });
}
function receiveWildD100(packet){
 if(packet?.action==='wildMagicD100Done'){if(!authority()||packet.gm!==game.user.id)return;const pending=d100Waiting.get(packet.result);if(!pending?.pending.has(packet.user))return;if(packet.error){pending.fail(packet.error);return;}pending.pending.delete(packet.user);pending.finish();return;}
 if(packet?.action!=='wildMagicD100'||packet.gm!==game.users.activeGM?.id||!packet.users?.includes(game.user.id))return;
 let playback=d100Playback.get(packet.result);if(!playback){playback=Promise.resolve().then(async()=>{const found=await waitWildD100State(packet);if(found.skip)return;const {card,state}=found;if(card.visible===false||card.isContentVisible===false)return;return playLocalWildD100(card,state);});d100Playback.set(packet.result,playback);playback.catch(()=>{if(d100Playback.get(packet.result)===playback)d100Playback.delete(packet.result);});if(d100Playback.size>256)d100Playback.delete(d100Playback.keys().next().value);}
 playback.then(()=>game.socket.emit('module.'+ID,{action:'wildMagicD100Done',gm:packet.gm,result:packet.result,user:game.user.id}),error=>game.socket.emit('module.'+ID,{action:'wildMagicD100Done',gm:packet.gm,result:packet.result,user:game.user.id,error:error.message}));
}
export const controlledChaosFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)==='controlled-chaos'||i.name?.trim().toLowerCase()==='controlled chaos'));
async function controlledTableSurge(card,kind,request,table,state){
 state=state?.controlled?state:{request,controlled:true,session:foundry.utils.randomID(),choices:[],ready:false,selected:null,done:false};
 const save=async()=>{await card.setFlag(ID,'wildSurges',{...flag(card,'wildSurges'),[kind]:state});refreshWildFooter(card);};
 while(state.choices.length<2){const draw=await table.roll();if(!draw.roll||!draw.results?.length)throw Error('The Wild Magic table returned no result.');state={...state,choices:[...state.choices,{roll:draw.roll.toJSON(),results:draw.results.map(r=>r.id),message:foundry.utils.randomID(),animated:false}]};await save();}
 for(let index=0;index<2;index++){const choice=state.choices[index];if(!choice.animated){await playWildD100(card,choice,kind);state={...state,choices:state.choices.map((c,i)=>i===index?{...c,animated:true}:c)};await save();}}
 for(let index=0;index<2;index++){const choice=state.choices[index];if(game.messages.get(choice.message))continue;const results=choice.results.map(id=>table.results.get(id)).filter(Boolean);if(results.length!==choice.results.length)throw Error('A saved Wild Magic table result changed.');const result=await table.toMessage(results,{roll:CONFIG.Dice.BasicRoll.fromData(choice.roll),messageData:{_id:choice.message,...visibility(card),flags:{[ID]:{wildMagicTable:{cast:card.id,kind},wildMagicGenerated:true,wildMagicResults:choice.results,wildMagicIgnored:kind==='repeat'&&results.some(r=>Number(r.range?.[0])===1),wildMagicChoice:{cast:card.id,kind,index,session:state.session}},'dice-so-nice':{skip:true}}},messageOptions:{keepId:true,messageMode:messageMode(card)}});if(!result)throw Error('A Controlled Chaos result could not be published.');}
 state={...state,ready:true};await save();return state;
}
export async function selectControlledChaos(card,kind,index,user=game.user){
 if(!authority()||!owns(card?.getAssociatedActor?.(),user)||!['tides','check','repeat'].includes(kind)||!Number.isInteger(index)||index<0||index>1)throw Error('You cannot select this Controlled Chaos result.');let state=flag(card,'wildSurges')?.[kind];if(!state?.controlled||!state.ready||state.choices?.length!==2)throw Error('The Controlled Chaos choices are not ready.');if(state.selected!==null&&state.selected!==index)throw Error('A different Controlled Chaos result has already been selected.');if(state.done)return state;
 const winner=game.messages.get(state.choices[index].message),link=flag(winner,'wildMagicChoice');if(!winner||link?.cast!==card.id||link.kind!==kind||link.index!==index||link.session!==state.session)throw Error('The selected surge card changed.');
 state={...state,selected:index};await card.setFlag(ID,'wildSurges',{...flag(card,'wildSurges'),[kind]:state});const loser=game.messages.get(state.choices[1-index].message),other=flag(loser,'wildMagicChoice');if(loser){if(other?.cast!==card.id||other.kind!==kind||other.session!==state.session||other.index!==1-index)throw Error('The other surge card changed.');await loser.delete();if(game.messages.get(loser.id))throw Error('The unselected surge card could not be removed. Select again to finish.');}
 state={...state,done:true};await card.setFlag(ID,'wildSurges',{...flag(card,'wildSurges'),[kind]:state});refreshWildFooter(card);if(kind==='tides')await resolveTidesSurge(card);return state;
}
export function renderControlledChoice(message,html){const root=html?.[0]??html;if(!root?.querySelectorAll)return;for(const old of root.querySelectorAll('.rsa-controlled-chaos'))old.remove();const link=flag(message,'wildMagicChoice'),cast=game.messages.get(link?.cast),state=flag(cast,'wildSurges')?.[link?.kind],actor=cast?.getAssociatedActor?.();if(!link||!state?.controlled||!state.ready||state.done||state.session!==link.session||state.choices?.[link.index]?.message!==message.id||state.selected!==null&&state.selected!==link.index||!owns(actor,game.user)||message.isContentVisible===false)return;
 const row=document.createElement('div');row.className='rsa-attack-actions rsa-controlled-chaos';const button=document.createElement('button');button.type='button';button.textContent='Select';button.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await operate('select',{actor:actor.uuid,card:cast.id,kind:link.kind,index:link.index});}catch(error){report(error);}finally{refresh(message);}});row.append(button);(root.querySelector?.('.message-content')??root).append(row);
}
async function tableSurge(card,kind,request=null){
 let state=flag(card,'wildSurges')?.[kind];if(state?.done)return state;const table=await fromUuid(TABLE);if(!table?.roll||!table?.toMessage)throw Error('The native Wild Magic Surge table is unavailable.');if(state?.controlled||!state?.roll&&controlledChaosFeature(card.getAssociatedActor?.()))return controlledTableSurge(card,kind,request,table,state);
 if(!state?.roll){const draw=await table.roll();if(!draw.results?.length||!draw.roll)throw Error('The Wild Magic table returned no result.');state={request,roll:draw.roll.toJSON(),results:draw.results.map(r=>r.id),message:foundry.utils.randomID(),done:false};await card.setFlag(ID,'wildSurges',{...flag(card,'wildSurges'),[kind]:state});refreshWildFooter(card);}
 let result=game.messages.get(state.message);if(!result){const roll=CONFIG.Dice.BasicRoll.fromData(state.roll),results=state.results.map(id=>table.results.get(id)).filter(Boolean);if(results.length!==state.results.length)throw Error('The saved Wild Magic table result changed.');
 if(!state.animated){await playWildD100(card,state,kind);state={...state,animated:true};await card.setFlag(ID,'wildSurges',{...flag(card,'wildSurges'),[kind]:state});}
 result=await table.toMessage(results,{roll,messageData:{_id:state.message,...visibility(card),flags:{[ID]:{wildMagicTable:{cast:card.id,kind},wildMagicGenerated:true,wildMagicResults:state.results,wildMagicIgnored:kind==='repeat'&&results.some(r=>Number(r.range?.[0])===1)},...(state.animated?{'dice-so-nice':{skip:true}}:{})}},messageOptions:{keepId:true,messageMode:messageMode(card)}});if(!result)throw Error('The Wild Magic result could not be published.');}
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(result);state={...state,done:true};await card.setFlag(ID,'wildSurges',{...flag(card,'wildSurges'),[kind]:state});return state;
}
export function wildResultsPending(card){
 const activity=card?.getAssociatedActivity?.({scaled:true});if(!['attack','save','damage'].includes(activity?.type)||!values(activity.damage?.parts).length)return false;
 const related=values(card.getAssociatedRolls?.());if(related.some(c=>['damage','healing'].includes(c.type)&&!flag(c,'pendingDamage')&&c.rolls?.some(r=>r._evaluated)))return false;
 if(activity.type==='attack'){const attacks=related.filter(c=>c.type==='attack');if(attacks.length&&attacks.every(c=>values(c.system?.evaluatedTargets).length&&values(c.system.evaluatedTargets).every(t=>t.isMiss===true)))return false;}
 if(activity.type==='save'&&activity.damage.onSave==='none'&&values(card.system?.targets).length&&values(card.system.targets).every(t=>card.system.outcomes?.get(t.token)==='success'))return false;
 return true;
}
export async function offerTidesSurge(card){
 if(!authority()||wildResultsPending(card))return;const c=forcedTides(card);if(!c)return;const state=flag(card,'wildSurges')?.tides;
 if(!flag(c.effect,'tidesSurgeCast'))await c.effect.setFlag(ID,'tidesSurgeCast',card.id);if(state?.request===c.meta.request){if(state.done)await resolveTidesSurge(card);return;}
 await card.setFlag(ID,'wildSurges',{...flag(card,'wildSurges'),tides:{request:c.meta.request,pending:true,done:false}});refreshWildFooter(card);
}
export function surgePromptKind(card){
 if(!readyWildCast(card))return null;const states=flag(card,'wildSurges');if(states?.tides&&!states.tides.done&&!states.tides.ready&&forcedTides(card))return 'tides';if(states?.check&&!states.check.done&&!states.check.ready&&flag(card,'wildSurgeCheck')?.total===20)return 'check';return null;
}
export async function rollPromptedSurge(card,user=game.user){
 if(flag(card,'wildRecurringSurge')){if(!authority()||!owns(card.getAssociatedActor?.(),user)||!globalThis.Ugmuls55eAutomationSurgeEffects?.canRepeat?.(card))throw Error('This recurring surge is no longer available.');const result=await tableSurge(card,'repeat');refreshWildFooter(card);return result;}

 if(!authority()||!owns(card?.getAssociatedActor?.(),user))throw Error('You cannot roll this Wild Magic Surge.');const kind=surgePromptKind(card);if(kind==='tides'){await resolveTidesSurge(card);return flag(card,'wildSurges')?.tides;}if(kind==='check'){await tableSurge(card,'check');refreshWildFooter(card);return flag(card,'wildSurges')?.check;}throw Error('No Wild Magic Surge is waiting to be rolled.');
}
export async function resolveTidesSurge(card){
 if(!authority()||wildResultsPending(card))return;let c=forcedTides(card);if(!c)return;await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(origin(c.meta?.rollMessage)??card);c=forcedTides(card);if(!c)return;
 const surge=await tableSurge(card,'tides',c.meta.request);if(!surge?.done)return;const current=tidesBuff(c.actor);if(current?.uuid!==c.effect.uuid||flag(current,'tidesOfChaos')?.request!==c.meta?.request)return;const feature=tidesFeature(c.actor);if(feature?.uuid!==c.meta.feature)throw Error('The Tides feature changed before recovery.');
 // The marker remains until the table result and its dice have completed.
 // Restoration is recorded on that marker so a failed deletion cannot refund twice.
 if(!flag(current,'tidesRecovered')){await feature.update({'system.uses.spent':Math.max(0,Number(feature.system.uses.spent??0)-1)});await current.setFlag(ID,'tidesRecovered',true);}await current.delete();refreshWildFooter(card);
}
export function tidesTriggeredCast(card){return !!flag(card,'wildSurges')?.tides||!!forcedTides(card);}
export function surgeCheckAvailable(card,user=game.user){if(tidesTriggeredCast(card))return false;const c=readyWildCast(card);if(!c||!owns(c.actor,user)||card.isContentVisible===false)return false;const state=flag(card,'wildSurgeCheck');if(state)return !state.done;if(c.record.turn&&c.record.turn!==turn())return false;const used=flag(c.actor,'wildSurgeCheckTurn');return !turn()||used?.turn!==turn();}
export async function checkSurge(card,user=game.user){
 if(!authority()||!surgeCheckAvailable(card,user))throw Error('The once-per-turn Wild Magic Surge check is unavailable.');const {actor}=readyWildCast(card);let state=flag(card,'wildSurgeCheck');
 if(!state){const roll=await new CONFIG.Dice.BasicRoll('1d20').evaluate();state={roll:roll.toJSON(),total:Number(roll.total),turn:turn(),message:foundry.utils.randomID(),done:false};await card.setFlag(ID,'wildSurgeCheck',state);if(state.turn)await actor.setFlag(ID,'wildSurgeCheckTurn',{turn:state.turn,cast:card.id});}
 let result=game.messages.get(state.message);if(!result){const data=await CONFIG.Dice.BasicRoll.fromData(state.roll).toMessage({_id:state.message,...visibility(card),flavor:'Wild Magic Surge Check',flags:{[ID]:{wildMagicCheck:{cast:card.id}}}},{create:false,messageMode:messageMode(card)});result=await ChatMessage.create(data,{keepId:true});if(!result)throw Error('The Wild Magic check could not be published.');}
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(result);if(state.total===20&&!flag(card,'wildSurges')?.check)await card.setFlag(ID,'wildSurges',{...flag(card,'wildSurges'),check:{pending:true,done:false}});state={...state,done:true};await card.setFlag(ID,'wildSurgeCheck',state);refreshWildFooter(card);return state;
}
async function commitTidesRoll(actor,payload,user){
 if(!owns(actor,user))throw Error('You cannot commit these Tides.');const effect=resolve(payload.effect),meta=flag(effect,'tidesOfChaos'),card=game.messages.get(payload.card);if(effect?.parent?.uuid!==actor.uuid||meta?.request!==payload.tidesRequest||card?.getAssociatedActor?.()?.uuid!==actor.uuid||!card.rolls?.some(r=>r._evaluated&&r.options?.rsaTides?.request===payload.tidesRequest))throw Error('The Tides roll changed.');await effect.setFlag(ID,'tidesOfChaos',{...meta,rollMessage:card.id});const cast=wildCastOrigin(card);if(cast)queue(actor.uuid,()=>offerTidesSurge(cast)).catch(report);return {};
}
export function wildOperation(action,payload,user=game.user){const actor=resolve(payload?.actor);return queue(actor?.uuid??'invalid',async()=>{if(!authority()||!owns(actor,user)||typeof payload?.request!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(payload.request))throw Error('Invalid Wild Magic request.');const id=user.id+':'+action+':'+payload.request;if(receipts.has(id))return receipts.get(id);let result;
 if(action==='spend')result=await spendTides(actor,payload,user);else if(action==='refund'){await refundTides(actor,payload.record,user);result={};}else if(action==='commit')result=await commitTidesRoll(actor,payload,user);else{const card=game.messages.get(payload.card);if(card?.getAssociatedActor?.()?.uuid!==actor.uuid)throw Error('The source casting changed.');if(action==='check')result=await checkSurge(card,user);else if(action==='surge')result=await rollPromptedSurge(card,user);else if(action==='select')result=await selectControlledChaos(card,payload.kind,payload.index,user);else throw Error('Unknown Wild Magic operation.');}receipts.set(id,result);if(receipts.size>512)receipts.delete(receipts.keys().next().value);return result;
 });}
async function operate(action,payload){const gm=game.users.activeGM;if(!gm)throw Error('A connected GM is required for Wild Magic.');payload={...payload,request:payload.request??foundry.utils.randomID()};if(gm.id===game.user.id)return wildOperation(action,payload);const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Wild Magic.'));},30000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'wildMagicOperation',operation:action,payload,request,user:game.user.id,gm:gm.id});});}
export function installWildD20(Type){if(!Type||wired.has(Type)||!Type.buildConfigure||!Type.buildEvaluate||!Type.buildPost)return;wired.add(Type);const configure=Type.buildConfigure,evaluate=Type.buildEvaluate,post=Type.buildPost;
 Type.buildConfigure=async function(config={},dialog={},message={}){prepareTidesDialog(config,dialog,this.DefaultConfigurationDialog);const rolls=await configure.call(this,config,dialog,message);if(rolls?.[0]?.options?.rsaTidesSelected)applyTidesMode(rolls[0],config);return rolls;};
 Type.buildEvaluate=async function(rolls,config={},message={}){const first=rolls?.[0],actor=actorFor(config);let record;
 try{if(config.evaluate!==false&&first?.options?.rsaTidesSelected&&!first._evaluated){record=await operate('spend',{actor:actor.uuid,cast:rollCastOrigin(config,message)?.id??null});first.options.rsaTides=record;applyTidesMode(first,config);}const evaluated=await evaluate.call(this,rolls,config,message);if(record&&!first._evaluated){await operate('refund',{actor:record.actor,record});delete first.options.rsaTides;}return evaluated;}
 catch(error){if(record)await operate('refund',{actor:record.actor,record});throw error;}};
 Type.buildPost=async function(rolls,config={},message={}){const record=rolls?.[0]?.options?.rsaTides;let result;try{result=await post.call(this,rolls,config,message);}catch(error){if(record)await operate('refund',{actor:record.actor,record});throw error;}
 const card=message.document??result;if(record&&card?.id)operate('commit',{actor:record.actor,effect:record.effect,tidesRequest:record.request,card:card.id}).catch(report);return result;};
}
const footerHosts=new Map();
function latestWildResult(cast){return values(cast.getAssociatedRolls?.()).filter(c=>['attack','save','damage','healing'].includes(c.type)&&c.isContentVisible!==false&&!flag(c,'pendingDamage')&&c.rolls?.some(r=>r._evaluated)).sort((a,b)=>(a.timestamp??0)-(b.timestamp??0)).at(-1);}
function refreshWildFooter(card){const cast=wildCastOrigin(card)??card;refresh(cast);for(const state of Object.values(flag(cast,'wildSurges')??{}))if(state?.controlled)for(const choice of state.choices??[]){const result=game.messages.get(choice.message);if(result)refresh(result);}const host=footerHosts.get(cast.id),latest=latestWildResult(cast);if(host&&host.id!==cast.id)refresh(host);if(latest&&latest.id!==cast.id&&latest.id!==host?.id)refresh(latest);}
export function wildMagicFooters(message,root){
 if(root.hidden===true)return [];
 const summaries=values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden),casts=new Map();
 for(const card of [message,...summaries.map(n=>game.messages.get(n.dataset.messageId))]){const cast=wildCastOrigin(card);if(!cast||casts.has(cast.id))continue;
  if(!summaries.length){const latest=latestWildResult(cast);if(latest&&latest.id!==message.id)continue;}
  casts.set(cast.id,{card:cast,node:root.querySelector?.('.message-content')??root});
 }
 return [...casts.values()];
}
export function renderWildMagic(message,html){const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 // One footer outside the individual summaries: native grouping can add attack,
 // save and damage sections without stranding these controls on the source face.
 for(const old of root.querySelectorAll('.rsa-wild-magic'))old.remove();
 for(const {card,node}of wildMagicFooters(message,root)){const c=readyWildCast(card);if(!c||tidesTriggeredCast(card)&&!surgePromptKind(card)||!owns(c.actor,game.user)||card.isContentVisible===false)continue;const previous=footerHosts.get(card.id);if(previous?.id!==message.id){footerHosts.set(card.id,message);if(previous)refresh(previous);if(footerHosts.size>256)footerHosts.delete(footerHosts.keys().next().value);}const row=document.createElement('div');row.className='rsa-attack-actions rsa-wild-magic';
 const add=(label,action)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await operate(action,{actor:c.actor.uuid,card:card.id});}catch(error){report(error);}finally{refresh(card);}});row.append(button);};
 const surge=surgePromptKind(card);if(surge)add(surge==='tides'?'Roll Wild Magic Surge — Tides of Chaos':'Roll Wild Magic Surge — d100','surge');else if(surgeCheckAvailable(card))add(flag(card,'wildSurgeCheck')?'Finish Surge Check':'Wild Magic — Roll Surge Check','check');else if(!tidesTriggeredCast(card)&&flag(card,'wildSurgeCheck')?.done){const label=document.createElement('span');label.textContent='Wild Magic Check: '+flag(card,'wildSurgeCheck').total;row.append(label);}
 if(row.childNodes.length)node.append(row);
 }}
function observeWild(card,changes=null){if(!enabled()||!card)return;const changed=key=>Object.hasOwn(changes??{},'flags.'+ID+'.'+key)||Object.hasOwn(changes?.flags?.[ID]??{},key);
 if(changes&&!Object.hasOwn(changes,'rolls')&&!['wildSurges','wildSurgeCheck','pendingCast','pendingDamage','targetsConfirmationPending'].some(changed))return;
 if(flag(card,'wildRecurringSurge')){refreshWildFooter(card);return;}
 const cast=wildCastOrigin(card);if(!cast)return;refreshWildFooter(cast);if(authority()&&readyWildCast(cast))queue(flag(cast,'wildMagicCast').actor,()=>offerTidesSurge(cast)).catch(report);
}
function report(error){console.error('Wild Magic',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>{game.settings.register(ID,'wildMagicAutomation',{name:'Wild Magic: Tides and Surge Checks',hint:'Offer Tides of Chaos on D20 Test configuration, preserve Advantage cancellation, and track its waiting buff. Qualifying casts offer a user-clicked d100 surge prompt for Tides; a natural 20 on the once-per-turn surge check offers the same prompt. Restore Tides after its surge finishes. With Controlled Chaos, roll twice and select one result. Table cards offer targeted effects/reminders and Undo; recurring surges offer a turn-start roll prompt.',scope:'world',config:true,type:Boolean,default:true});game.settings.register(ID,'tidesSurgeSameSpell',{name:'Allow Surge on the Same Spell That Uses Tides of Chaos',hint:'When enabled, using Tides on a slot-funded spell attack offers its guaranteed surge prompt after that spell. When disabled, the buff waits for the next slot-funded Sorcerer spell casting.',scope:'world',config:true,type:Boolean,default:true});});
Hooks.once('ready',()=>{game.socket.on('module.'+ID,receiveWildD100);installWildD20(CONFIG.Dice.D20Roll);Hooks.on('dnd5e.preUseActivity',prepareWildCast);Hooks.on('dnd5e.postActivityConsumption',recordWildSlot);Hooks.on('dnd5e.postUseActivity',(_a,_u,r)=>observeWild(r?.message));Hooks.on('createChatMessage',card=>observeWild(card));Hooks.on('updateChatMessage',observeWild);Hooks.on('dnd5e.renderChatMessage',renderWildMagic);Hooks.on('dnd5e.renderChatMessage',renderControlledChoice);Hooks.on('dnd5e.renderChatMessage',renderRecurringSurge);
 for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect','updateItem','deleteItem','updateActor'])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request('wildMagic',doc,changes));Hooks.on('updateCombat',combat=>{for(const c of values(combat.combatants))if(surgeFeature(c.actor))globalThis.Ugmuls55eAutomationChatRefresh?.request('wildMagic',c.actor);});
 Hooks.on('dnd5e.restCompleted',(actor,result,config={})=>{if(!authority()||!result||(config.type??result.type)!=='long')return;queue(actor.uuid,async()=>{const ids=values(actor.effects).filter(e=>flag(e,'tidesOfChaos')).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments('ActiveEffect',ids);}).catch(report);});
 game.socket.on('module.'+ID,p=>{if(p?.action==='wildMagicReply'&&p.user===game.user.id){const job=waiting.get(p.request);if(!job)return;waiting.delete(p.request);clearTimeout(job.timer);p.error?job.reject(Error(p.error)):job.resolve(p.result);return;}if(p?.action!=='wildMagicOperation'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user);if(!user?.active)return;wildOperation(p.operation,p.payload,user).then(result=>game.socket.emit('module.'+ID,{action:'wildMagicReply',request:p.request,user:user.id,result}),error=>game.socket.emit('module.'+ID,{action:'wildMagicReply',request:p.request,user:user.id,error:error.message}));});
});

export function renderRecurringSurge(card,html){const root=html?.[0]??html;if(!root?.querySelectorAll||!flag(card,'wildRecurringSurge'))return;for(const old of root.querySelectorAll('.rsa-recurring-surge'))old.remove();if(card.isContentVisible===false||!owns(card.getAssociatedActor?.(),game.user)||flag(card,'wildSurges')?.repeat?.ready||flag(card,'wildSurges')?.repeat?.done||!globalThis.Ugmuls55eAutomationSurgeEffects?.canRepeat?.(card))return;const row=document.createElement('div');row.className='rsa-attack-actions rsa-recurring-surge';const button=document.createElement('button');button.type='button';button.textContent='Roll Wild Magic Surge';button.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{await operate('surge',{actor:card.getAssociatedActor().uuid,card:card.id});}catch(error){report(error);}finally{refresh(card);}});row.append(button);(root.querySelector('.message-content')??root).append(row);}
