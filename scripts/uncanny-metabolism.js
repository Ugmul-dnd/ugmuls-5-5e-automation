import {createEventQueue,describeTarget} from './shared-activity-card.js';
import {focusResource} from './stunning-strike.js';
const ID='ugmuls-5-5e-automation',installed=new WeakSet(),enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,'uncannyMetabolismAutomation')===true;
const remaining=i=>Number(i?.system?.uses?.value??Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0));
export const metabolismFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&((i.identifier??i.system?.identifier)==='uncanny-metabolism'||i.name==='Uncanny Metabolism'||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.phbmnkUncannyMet'))));
function context(actor){const feature=metabolismFeature(actor),focus=focusResource(actor),activity=values(feature?.system?.activities).find(a=>a.type==='heal');return enabled()&&actor?.isOwner&&feature&&focus&&activity?{actor,feature,focus,activity}:null;}
export function addMetabolismField(app,config){
 for(const old of app.element.querySelectorAll('[data-uncanny-metabolism]'))old.remove();
 const c=context(config.subject);if(!c)return;
 const mode=app.element.querySelector('[name="rollMode"]'),box=mode?.closest('fieldset')??app.element.querySelector('[data-application-part="configuration"] fieldset');if(!box)return;
 const row=document.createElement('div'),label=document.createElement('label'),fields=document.createElement('div'),input=document.createElement(globalThis.customElements?.get?.('dnd5e-checkbox')?'dnd5e-checkbox':'input');
 row.className='form-group';row.dataset.uncannyMetabolism='';label.textContent='Uncanny Metabolism';fields.className='form-fields';fields.style.justifyContent='flex-end';if(input.localName==='input')input.type='checkbox';input.style.flex='0 0 auto';input.style.margin='0';
 input.disabled=remaining(c.feature)<1;if(input.disabled)config.rsaUncannyMetabolism=false;input.checked=!input.disabled&&config.rsaUncannyMetabolism===true;input.setAttribute('aria-label','Uncanny Metabolism');
 input.title=input.disabled?'Uncanny Metabolism is expended until your next Long Rest.':'Spend Uncanny Metabolism to restore expended Focus Points when this initiative roll completes.';
 input.addEventListener('change',()=>{config.rsaUncannyMetabolism=input.checked;});fields.append(input);row.append(label,fields);box.append(row);
}
export function prepareMetabolism(config,dialog){
 if(config.evaluate!==false||!config.hookNames?.includes('initiativeDialog')||!context(config.subject))return;
 const Base=dialog.applicationClass??CONFIG.Dice.D20Roll.DefaultConfigurationDialog;
 dialog.applicationClass=class extends Base{_onRender(c,o){super._onRender(c,o);addMetabolismField(this,config);}};
}
export function installMetabolismRoll(Type=CONFIG.Dice.D20Roll){
 if(!Type?.buildConfigure||installed.has(Type))return;installed.add(Type);const configure=Type.buildConfigure;
 Type.buildConfigure=async function(config,dialog,message){
  const rolls=await configure.call(this,config,dialog,message);
  if(!rolls?.length||!config.rsaUncannyMetabolism||config.evaluate!==false||!config.hookNames?.includes('initiativeDialog'))return rolls;
  const c=context(config.subject);if(!c||remaining(c.feature)<1)throw Error('Uncanny Metabolism is no longer available. Reopen initiative to roll without it.');
  rolls[0].options.rsaUncannyMetabolism={actor:c.actor.uuid,feature:c.feature.uuid,focus:c.focus.uuid,request:foundry.utils.randomID()};return rolls;
 };
}
export function restoreMetabolism(card){return enqueue(async()=>{
 if(!enabled()||card?.type!=='check'||card.system?.type!=='initiative'||flag(card,'uncannyMetabolism')||!card.rolls?.some(r=>r._evaluated&&r.d20))return;
 const meta=card.rolls[0]?.options?.rsaUncannyMetabolism,actor=card.getAssociatedActor?.(),gm=game.users.activeGM;
 if(!meta||!actor||(gm?game.user.id!==gm.id:!actor.isOwner))return;
 const c=context(actor),author=card.author;
 if(!c||!author?.active||!author.isGM&&!actor.testUserPermission?.(author,'OWNER')||meta.actor!==actor.uuid||meta.feature!==c.feature.uuid||meta.focus!==c.focus.uuid||remaining(c.feature)<1||typeof meta.request!=='string')return;
 const id=c.activity.id??c.activity._id,targets=values(c.activity.consumption?.targets).map(t=>{
  const data=t.toObject?.()??foundry.utils.deepClone(t);
  if(data.type==='itemUses'&&(data.target==='Compendium.dnd-players-handbook.classes.Item.phbmnkMonksFocus'||['monks-focus','focus-points',c.focus.id,c.focus.uuid].includes(data.target)))data.target=c.focus.id;
  if(data.type==='itemUses'&&!data.target)data.target=c.feature.id;return data;
 });
 if(!targets.some(t=>t.type==='itemUses'&&t.target===c.focus.id)||!targets.some(t=>t.type==='itemUses'&&t.target===c.feature.id))throw Error('Uncanny Metabolism is missing its native Focus recovery or feature cost.');
 const helper=c.feature.clone({['system.activities.'+id+'.consumption.targets']:targets},{keepId:true}),activity=helper.system.activities.get(id);
 const source=card.getAssociatedToken?.(),token=source?.document??source,self=token?.actor?.uuid===actor.uuid?[describeTarget(token)]:[{actor:actor.uuid,name:actor.name}];
 const activation={initiative:card.id,request:meta.request,actor:actor.uuid,feature:c.feature.uuid};
 const messageFlags={[ID]:{riderTriggered:true,manualDamageWorkflow:true,automaticMetabolism:activation}};
 let deltas,committed=false,usage,healing;
 const consumeHook=Hooks.on('dnd5e.postActivityConsumption',(_a,_u,message)=>{if(flag(message?.data,'automaticMetabolism')?.request===meta.request)deltas=message.data?.system?.deltas;});
 await card.setFlag(ID,'uncannyMetabolism',{request:meta.request,pending:true});
 try{
  // Use the source activity once. Its native consumption restores Focus and
  // spends the Long Rest use, and its native usage card appears after initiative.
  const result=await activity.use({consume:{action:false,resources:true,spellSlot:false},scaling:0,subsequentActions:false,concentration:{begin:false},create:{measuredTemplate:false}},{configure:false},{data:{system:{origin:card.id,targets:self},whisper:card.whisper??[],blind:card.blind??false,flags:messageFlags}});
  usage=result?.message;deltas=usage?.system?.deltas??deltas;
  if(!usage||!values(deltas?.item?.[c.feature.id]).some(d=>d.keyPath==='system.uses.spent'&&d.delta>0))throw Error('Uncanny Metabolism could not activate its native feature.');
  const restored=Math.max(0,-values(deltas?.item?.[c.focus.id]).filter(d=>d.keyPath==='system.uses.spent'&&d.delta<0).reduce((sum,d)=>sum+d.delta,0));
  // Foundry merges object flags. Explicitly clear pending; omitting it leaves
  // a completed activation hidden even after Focus was successfully restored.
  await card.setFlag(ID,'uncannyMetabolism',{request:meta.request,pending:false,automatic:true,actor:actor.uuid,feature:c.feature.uuid,focus:c.focus.uuid,restored,usage:usage.id,rest:flag(c.feature,'metabolismRest')??null,entries:[{actor:actor.uuid}],healing:{request:meta.request,pending:true}});committed=true;
  const capture=result=>{const ref=result?.system?.origin,origin=typeof ref==='string'?ref.replace(/^ChatMessage\./,''):ref?.id;if(result?.type==='healing'&&origin===usage.id&&flag(result,'automaticMetabolism')?.request===meta.request&&result.rolls?.length&&!flag(result,'pendingDamage'))healing=result;};
  const listeners=['createChatMessage','updateChatMessage'].map(event=>[event,Hooks.on(event,capture)]);
  try{
   // rollDamage does not spend again. Fast-forward the configured native
   // Martial Arts die + Monk level, retaining normal dice animation and HP Undo.
   const rolls=await activity.rollDamage({isCritical:false},{configure:false},{data:{system:{origin:usage.id,targets:self},whisper:card.whisper??[],blind:card.blind??false,flags:messageFlags}});
   for(const roll of rolls??[])if(roll.parent)capture(roll.parent);
   if(!healing)throw Error('Uncanny Metabolism healing was not published. Use its native feature card to roll healing.');
   await card.setFlag(ID,'uncannyMetabolism',{...flag(card,'uncannyMetabolism'),pending:false,healing:{request:meta.request,pending:false,card:healing.id}});
   await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(healing);
   if(flag(healing,'hpApplicationRecorded')!==true&&!values(flag(healing,'damageUndoHistory')).some(r=>r.actorUuid===actor.uuid)){
    const total=values(healing.rolls).filter(r=>r.options?.type==='healing').reduce((sum,r)=>sum+Math.max(0,Number(r.total)||0),0);
    if(!(total>0))throw Error('Review Uncanny Metabolism’s healing card before applying HP.');
    await actor.applyDamage([{type:'healing',value:total}],{origin:healing,originatingMessage:healing,...(token?.actor?.uuid===actor.uuid?{rsaAutoDamageToken:token.uuid}:{}),rsaUncannyMetabolism:true});
    if(flag(healing,'hpApplicationRecorded')!==true)await healing.setFlag(ID,'hpApplicationRecorded',true);
   }
   globalThis.Ugmuls55eAutomationChatRefresh?.card(healing);
  }finally{for(const[event,listener]of listeners)Hooks.off(event,listener);}
 }catch(error){
  if(committed)await card.setFlag(ID,'uncannyMetabolism',{...flag(card,'uncannyMetabolism'),pending:false,healing:{request:meta.request,pending:false,...(healing?{card:healing.id}:{failed:true})}});
  throw error;
 }finally{
  Hooks.off('dnd5e.postActivityConsumption',consumeHook);
  if(!committed){if(deltas)await activity.refund(deltas);if(usage?.delete)await usage.delete();await card.unsetFlag(ID,'uncannyMetabolism');}
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
 }
});}

export function renderMetabolism(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 for(const {card,node}of [{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))]){
  for(const old of node.querySelectorAll(':scope > .rsa-uncanny-metabolism'))old.remove();const record=flag(card,'uncannyMetabolism');if(card?.isContentVisible===false||!record||record.pending)continue;
  const note=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('div');note.className='rsa-uncanny-metabolism';title.textContent='Uncanny Metabolism';detail.textContent=record.restored+' Focus restored';note.append(title,detail);
  const status=document.createElement('div');status.textContent=record.healing?.pending?'Healing pending':record.healing?.failed?'Use the native feature card to heal':record.healing?.card?'Healing rolled':'';if(status.textContent)note.append(status);node.append(note);
 }
}
function report(error){console.error('Uncanny Metabolism',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'uncannyMetabolismAutomation',{name:'Monk: Uncanny Metabolism',hint:'Offer Uncanny Metabolism in initiative configuration. On a completed roll, activate its native feature card, restore Focus, consume its Long Rest use, roll native self-healing and apply it automatically.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 installMetabolismRoll();Hooks.on('dnd5e.preRollInitiativeDialogV2',prepareMetabolism);
 Hooks.on('createChatMessage',card=>restoreMetabolism(card).catch(report));Hooks.on('updateChatMessage',(card,changes={})=>{if(changes.rolls)restoreMetabolism(card).catch(report);});
 Hooks.on('dnd5e.renderChatMessage',renderMetabolism);

});
