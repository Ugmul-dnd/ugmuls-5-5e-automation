import {createEventQueue,isRollAdjustmentLocked,isHealingCard} from './shared-activity-card.js';
import {damageDice,rerollDamageDice} from './empowered-spell.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),open=new Set();
const kinds={crusher:'bludgeoning',slasher:'slashing',piercer:'piercing'};
const values=collection=>Array.from(collection?.values?.()??collection??[]);
const flag=(doc,key)=>doc?.getFlag?.(ID,key);
const enabled=key=>game.settings.get(ID,key+'Automation')===true;
const actorOf=card=>card?.getAssociatedActor?.()??card?.getAssociatedActivity?.()?.actor;
const owns=(actor,user)=>!!user&&(user.isGM||actor?.testUserPermission?.(user,'OWNER'));
const visible=(card,user)=>card?.isContentVisible!==false&&!!user&&(user.isGM||!card?.blind&&(!card?.whisper?.length||card.whisper.some(w=>(w.id??w)===user.id)));
const authority=()=>game.user.isGM&&game.users.activeGM?.id===game.user.id;
const resolve=ref=>typeof ref==='string'?game.messages.get(ref.replace(/^ChatMessage\./,'')):ref;
export const featTurn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
export const weaponFeat=(actor,key)=>values(actor?.items).find(item=>item.type==='feat'&&item.system?.source?.rules!=='2014'&&((item.identifier??item.system?.identifier)===key||item.name?.trim().toLowerCase()===key));
export function featAttack(card){
 const explicit=flag(card,'damageAttackId');if(explicit)return resolve(explicit);
 const origin=resolve(card?.system?.origin);if(origin?.type==='attack')return origin;
 // Ambiguous multiattacks require the recorded link, never totals or live selection.
 const attacks=values(origin?.getAssociatedRolls?.('attack'));return attacks.length===1?attacks[0]:null;
}
export function featContext(card,key,user=game.user){
 if(!Object.hasOwn(kinds,key)||!enabled(key)||card?.type!=='damage'||isHealingCard(card)||!visible(card,user)||flag(card,'masteryGraze')||flag(card,'grappleNoDamage'))return null;
 const actor=actorOf(card),feature=weaponFeat(actor,key),attack=featAttack(card);
 if(!feature||!owns(actor,user)||attack?.type!=='attack'||actorOf(attack)?.uuid!==actor.uuid)return null;
 const recorded=card.system?.targets??attack.system?.targets??[];
 const hits=values(attack.system?.evaluatedTargets).filter(t=>t.isMiss===false&&recorded.some(r=>r.token===t.token));
 if(!hits.length||!card.rolls?.some(r=>r.options?.type===kinds[key]&&r.total>0))return null;
 const current=featTurn(),snapshot=flag(card,'weaponFeatTurn');
 if(snapshot!==current)return null;
 return {actor,feature,attack,hits,current,key};
}
export function featUsed(actor,key){const turn=featTurn();return !!turn&&flag(actor,'weaponFeatTurns')?.[key]===turn;}
const critical=card=>card.rolls?.some(r=>r.options?.isCritical===true);
const historyHas=(card,key)=>values(flag(card,'effectUndoHistory')).some(r=>r.weaponFeat===key);
export function piercerWeaponDice(card){
 const item=card?.getAssociatedItem?.()??featAttack(card)?.getAssociatedItem?.();
 if(item?.type!=='weapon')return [];
 let index=card.rolls?.findIndex(roll=>roll.options?.rsaPiercerWeaponDice)??-1;
 if(index<0){
  // Older cards have no marker. Native weapon base damage is the first roll;
  // verify it against the recorded weapon rather than searching rider dice.
  const faces=Number(item.system?.damage?.base?.denomination),term=card.rolls?.[0]?.terms?.[0];
  const die=term instanceof foundry.dice.terms.Die?term:card.rolls?.[0]?.options?.rsaSavageAttacker?term?.rolls?.[0]?.terms?.[0]:null;
  if(!faces||die?.faces!==faces)return [];index=0;
 }
 // Only the weapon's first term (or kept Savage weapon pool) is eligible.
 // A rider can use the same die size and damage type, so neither identifies it.
 const path=new RegExp('^'+index+'\\.0\\.(?:\\d+|p\\d+\\.0\\.\\d+)$');
 return damageDice(card.rolls).filter(die=>path.test(die.key));
}
export function canUseWeaponFeat(card,key,user=game.user){
 if(key!=='piercer')return false;
 const c=featContext(card,key,user);if(!c||isRollAdjustmentLocked(card))return false;
 if(key==='piercer')return !featUsed(c.actor,key)&&!flag(card,'piercerUsed')&&piercerWeaponDice(card).length>0;
}
const signature=card=>JSON.stringify(card.rolls.map(r=>r.toJSON()));
async function markTurn(actor,key){if(featTurn())await actor.update({['flags.'+ID+'.weaponFeatTurns.'+key]:featTurn()});}
const refresh=card=>{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);const origin=resolve(card.system?.origin);if(origin)globalThis.Ugmuls55eAutomationChatRefresh?.card(origin);};
async function pause(card){if(globalThis.Ugmuls55eAutomationReactive?.enabled())await globalThis.Ugmuls55eAutomationReactive.stop(card);else await card.setFlag(ID,'manualDamageWorkflow',true);}
async function animate(card,dice,user){
 if(!dice.length||!game.dice3d?.showForRoll)return;
 const visual=Roll.fromTerms(dice.flatMap((die,i)=>i?[new foundry.dice.terms.OperatorTerm({operator:'+'}),die]:[die]));
 try{const task=game.dice3d.showForRoll(visual,user,true,card.whisper?.length?card.whisper:null,card.blind??false,card.id,card.speaker);await(globalThis.Ugmuls55eAutomationWaitForAnimation?.(task)??task);}catch(error){console.warn('Weapon feat dice animation',error);}
}
export async function applyPiercer(card,keys,expected,user=game.user){
 if(!authority()||!canUseWeaponFeat(card,'piercer',user))throw Error('Piercer is unavailable. Undo applied damage first.');
 if(!Array.isArray(keys)||keys.length!==1||!piercerWeaponDice(card).some(d=>d.key===keys[0]))throw Error('Select exactly one weapon damage die.');
 if(signature(card)!==expected)throw Error('The damage changed. Open Piercer again.');
 const c=featContext(card,'piercer',user),turn=featTurn(),previous=flag(c.actor,'weaponFeatTurns')?.piercer;
 await pause(card);const result=await rerollDamageDice(card.rolls,keys);await animate(card,result.visual,user);
 if(!canUseWeaponFeat(card,'piercer',user)||signature(card)!==expected||featTurn()!==turn)throw Error('The card or turn changed during Piercer.');
 let marked=false,committed=false;
 try{await markTurn(c.actor,'piercer');marked=true;
  const now=featContext(card,'piercer',user);
  if(!now||now.feature.uuid!==c.feature.uuid||now.attack.id!==c.attack.id||isRollAdjustmentLocked(card)||signature(card)!==expected||featTurn()!==turn)throw Error('The card or turn changed during Piercer.');
  await card.update({rolls:result.rolls,['flags.'+ID+'.piercerUsed']:true});committed=true;
 }finally{if(marked&&!committed&&turn&&flag(c.actor,'weaponFeatTurns')?.piercer===turn)await c.actor.update({['flags.'+ID+'.weaponFeatTurns.piercer']:previous??null});}
 refresh(card);await globalThis.Ugmuls55eAutomationReactive?.completed(card);
}
export async function choosePiercer(card){
 if(open.has(card.id)||!canUseWeaponFeat(card,'piercer'))return;open.add(card.id);
 try{const expected=signature(card),escape=foundry.utils.escapeHTML;
  const key=await foundry.applications.api.DialogV2.wait({window:{title:'Piercer'},position:{width:460},rejectClose:false,
   content:'<p>Select one weapon damage die to reroll. Extra rider dice are excluded. You must use the new result. Once per turn.</p><div class="rsa-empowered-dice">'+piercerWeaponDice(card).map(d=>'<label><input type="radio" name="piercer-die" value="'+d.key+'"><span><strong>'+d.value+'</strong><small>d'+d.faces+' '+escape(String(d.flavor))+'</small></span></label>').join('')+'</div>',
   buttons:[{action:'confirm',label:'Reroll',default:true,callback:(event,button,dialog)=>dialog.element.querySelector('input:checked')?.value},{action:'cancel',label:'Cancel',callback:()=>null}]});
  if(key)await dispatch(card,'piercer',{keys:[key],expected});
 }finally{open.delete(card.id);}
}
export function captureFeatTurn(card,data){
 if((data?.type??card.type)!=='damage')return;
 const actor=actorOf(card);if(!Object.keys(kinds).some(key=>enabled(key)&&weaponFeat(actor,key)))return;
 card.updateSource({['flags.'+ID+'.weaponFeatTurn']:featTurn()});
}
export function finalizePiercer(app,rolls){
 const data=app.message?.data,attack=resolve(data?.flags?.[ID]?.damageAttackId);
 const actor=actorOf(attack)??(data?.speaker?ChatMessage.getSpeakerActor(data.speaker):null)??app.config?.subject?.actor??app.config?.subject?.item?.actor;
 if(!enabled('piercer')||!weaponFeat(actor,'piercer')||app.config?.subject?.type!=='attack'||app.message?.data?.flags?.[ID]?.masteryGraze)return rolls;
 const weaponBase=app.config.rolls?.findIndex(r=>r.base===true)??-1;
 if(app.config.subject.item?.type==='weapon'&&rolls[weaponBase]&&!rolls[weaponBase].options?.rsaPiercerWeaponDice){
  const copy=rolls[weaponBase].constructor.fromData(foundry.utils.deepClone(rolls[weaponBase].toJSON()));
  copy.options.rsaPiercerWeaponDice=true;rolls=[...rolls];rolls[weaponBase]=copy;
 }
 if(rolls.some(r=>r.options?.rsaPiercerCritical))return rolls;
 const base=app.config.rolls?.findIndex(r=>r.base===true)??-1,index=rolls[base]?.options?.type==='piercing'?base:rolls.findIndex(r=>r.options?.type==='piercing'),roll=rolls[index];
 if(!roll||roll._evaluated||roll.options?.type!=='piercing'||roll.options.rsaPiercerCritical)return rolls;
 const copy=roll.constructor.fromData(foundry.utils.deepClone(roll.toJSON())),die=copy.terms[0];
 if(!(die instanceof foundry.dice.terms.Die))return rolls;
 copy.options.critical={...copy.options.critical,bonusDice:Number(copy.options.critical?.bonusDice??0)+1};copy.options.rsaPiercerCritical=true;
 if(copy.options.isCritical){
  if(copy.options.critical.powerfulCritical){const flat=copy.terms[2];if(!(flat instanceof foundry.dice.terms.NumericTerm))return rolls;flat.number+=die.faces;}
  else die.number+=1;
 }
 copy.resetFormula();const result=[...rolls];result[index]=copy;return result;
}
const benefitActive=(actor,key)=>values(actor?.effects).some(e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&flag(e,'weaponFeatBenefit')===key&&enabled(key.startsWith('crusher')?'crusher':'slasher'));
export function featModes(actor,target){return {advantage:benefitActive(target,'crusherCritical'),disadvantage:benefitActive(actor,'slasherCritical')};}
export function registerFeatConditions(api=globalThis.ac5e?.usageRules){
 if(typeof api?.register!=='function')return false;
 try{const registrations=[];
 for(const [key,mode]of [['crusherCritical','advantage'],['slasherCritical','disadvantage']])registrations.push(api.register({key:'rsa'+key,scope:'universal',hook:'attack',target:'subject',mode,name:key==='crusherCritical'?'Crusher':'Slasher',persistent:false,evaluate:(sandbox,context={})=>{
  const ref=key==='crusherCritical'?(context.opponentToken?.actor??globalThis.fromUuidSync?.(sandbox.opponentUuid,{strict:false})?.actor):(context.subjectToken?.actor??globalThis.fromUuidSync?.(sandbox.actorUuid,{strict:false}));return benefitActive(ref,key);
 }}));return registrations.every(Boolean);
 }catch(error){console.warn('Weapon feat conditions',error);return false;}
}
export function featRollDefaults(config,dialog,message){
 if(config.subject?.type!=='attack'||game.modules?.get('automated-conditions-5e')?.active&&bridge)return;
 const targets=message?.data?.system?.targets??values(game.user.targets).map(t=>({token:(t.document??t).uuid}));
 const target=targets.length===1?globalThis.fromUuidSync?.(targets[0].token,{strict:false})?.actor:null;
 const modes=featModes(config.subject.actor,target);if(!modes.advantage&&!modes.disadvantage)return;
 config.advantage||=modes.advantage;config.disadvantage||=modes.disadvantage;
 for(const roll of config.rolls??[]){roll.options??={};const o=roll.options;o.advantage=!!(o.advantage||o.advantageMode===1||config.advantage);o.disadvantage=!!(o.disadvantage||o.advantageMode===-1||config.disadvantage);o.advantageMode=o.advantage===o.disadvantage?0:o.advantage?1:-1;}
 const mode=config.rolls?.[0]?.options?.advantageMode??(config.advantage===config.disadvantage?0:config.advantage?1:-1);dialog.options??={};dialog.options.defaultButton=mode===1?'advantage':mode===-1?'disadvantage':'normal';
}
export async function applyFeatEffect(card,c,key,target){
 const native=values(c.feature.effects)[0];if(!native)throw Error('The native '+c.feature.name+' effect is missing.');
 const benefit=key==='slow'?'slasherSlow':c.key+'Critical';
 const data=native.toObject();data._id=key==='slow'?'rsaSlasherSlow00':benefit==='crusherCritical'?'rsaCrusherCrit00':'rsaSlasherCrit00';
 const source=new CONFIG.ActiveEffect.documentClass(data,{parent:c.feature});
 const existing=values(target.effects).find(e=>flag(e,'weaponFeatBenefit')===benefit);
 const tray=document.createElement('effect-application');tray.chatMessage=card;
 const prepare=tray._prepareEffectData;
 tray._prepareEffectData=async function(effect,actor){
  const operation=await prepare.call(this,effect,actor);if(existing){operation.action='update';operation.data._id=existing.id;}
  operation.data.name=c.feature.name+(key==='slow'?' — Hamstring':' — Critical');operation.data.transfer=false;operation.data.disabled=false;
  operation.data.duration={rounds:null,turns:null,seconds:null,value:null,expired:false,expiry:'sourceStart'};operation.data.start=CONFIG.ActiveEffect.documentClass.getEffectStart();
  operation.data.system??={};operation.data.system.origin={actor:c.actor.uuid,item:c.feature.uuid,message:card.uuid};
  operation.data.system.changes=key==='slow'?['walk','burrow','climb','fly','swim'].filter(k=>target.system?.attributes?.movement?.[k]>0).map(k=>({key:'system.attributes.movement.'+k,type:'add',value:String(-Math.min(target.system.attributes.movement[k],dnd5e.utils.convertLength(10,'ft',target.system.attributes.movement.units??'ft',{strict:false})))})):[];
  operation.data.flags??={};operation.data.flags[ID]={...operation.data.flags[ID],weaponFeatBenefit:benefit};operation.data.flags.dnd5e={...operation.data.flags.dnd5e,isTemporary:false};return operation;
 };
 const undo=globalThis.Ugmuls55eAutomationEffectUndo;if(!undo)throw Error('Effect Undo support is unavailable.');
 const applied=await undo.apply(card,card,source,target,tray,{replace:existing});if(!applied)throw Error('The feat effect could not be applied.');
 // Annotate the shared receipt, so Undo removes eligibility locks with the effect.
 const history=values(flag(card,'effectUndoHistory'));if(history.length){history[history.length-1]={...history.at(-1),weaponFeat:benefit};await card.setFlag(ID,'effectUndoHistory',history);}
}
const crusherPending=new Map();
function crusherCriticalContext(card){
 if(!authority()||card?.type!=='damage'||!enabled('crusher')||flag(card,'pendingDamage')||flag(card,'crusherCriticalApplied')||historyHas(card,'crusherCritical')||!critical(card))return null;
 const c=featContext(card,'crusher');return c?.hits.length===1&&!isRollAdjustmentLocked(card)?c:null;
}
export function applyCrusherCritical(card){
 if(!card?.id)return Promise.resolve();
 if(crusherPending.has(card.id))return crusherPending.get(card.id);
 const c=crusherCriticalContext(card);if(!c)return Promise.resolve();
 const expected=signature(card),token=c.hits[0].token;
 const task=(async()=>{
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  const target=await fromUuid(token),now=crusherCriticalContext(card);
  if(!target?.actor||!now||now.feature.uuid!==c.feature.uuid||now.attack.id!==c.attack.id||now.hits[0].token!==token||signature(card)!==expected)return;
  await applyFeatEffect(card,now,'critical',target.actor);
  // Keep this receipt after Effect Undo: unrelated updates must not silently
  // reapply a debuff the GM deliberately removed. Renders never mutate effects.
  await card.setFlag(ID,'crusherCriticalApplied',true);refresh(card);
 })().finally(()=>{if(crusherPending.get(card.id)===task)crusherPending.delete(card.id);});
 crusherPending.set(card.id,task);return task;
}
const slasherPending=new Map();
function slasherContext(card){
 if(!authority()||card?.type!=='damage'||!enabled('slasher')||flag(card,'pendingDamage'))return null;
 const c=featContext(card,'slasher');if(c?.hits.length!==1||isRollAdjustmentLocked(card))return null;
 const slow=!featUsed(c.actor,'slasher')&&!flag(card,'slasherSlowApplied')&&!historyHas(card,'slasherSlow');
 const enhanced=critical(card)&&!flag(card,'slasherCriticalApplied')&&!historyHas(card,'slasherCritical');
 return slow||enhanced?{...c,slow,enhanced}:null;
}
export function applySlasher(card){
 if(!card?.id)return Promise.resolve();
 if(slasherPending.has(card.id))return slasherPending.get(card.id);
 if(!slasherContext(card))return Promise.resolve();
 // Serialize different cards as well: one actor can land several hits while
 // effect creation awaits the server, but only the first can spend Hamstring.
 const task=enqueue(async()=>{
  const c=slasherContext(card);if(!c)return;
  const expected=signature(card),token=c.hits[0].token;
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  const target=await fromUuid(token),now=slasherContext(card);
  if(!target?.actor||!now||now.feature.uuid!==c.feature.uuid||now.attack.id!==c.attack.id||now.hits[0].token!==token||signature(card)!==expected)return;
  if(now.slow){
   const previous=flag(now.actor,'weaponFeatTurns')?.slasher,turn=featTurn();let marked=false,committed=false;
   try{
    await markTurn(now.actor,'slasher');marked=true;
    const latest=featContext(card,'slasher');
    if(!latest||latest.feature.uuid!==now.feature.uuid||latest.attack.id!==now.attack.id||latest.hits.length!==1||latest.hits[0].token!==token||featTurn()!==turn||signature(card)!==expected||isRollAdjustmentLocked(card))return;
    await applyFeatEffect(card,latest,'slow',target.actor);committed=true;
    await card.update({['flags.'+ID+'.slasherSlowApplied']:true,['flags.'+ID+'.slasherUsed']:turn});
   }finally{if(marked&&!committed&&turn&&flag(now.actor,'weaponFeatTurns')?.slasher===turn)await now.actor.update({['flags.'+ID+'.weaponFeatTurns.slasher']:previous??null});}
  }
  const enhanced=slasherContext(card);
  if(enhanced?.enhanced&&enhanced.hits[0].token===token&&signature(card)===expected){
   await applyFeatEffect(card,enhanced,'critical',target.actor);
   await card.setFlag(ID,'slasherCriticalApplied',true);
  }
  // Persistent component receipts intentionally survive Effect Undo, matching
  // Crusher: rerenders and unrelated updates must respect the GM's correction.
  refresh(card);
 }).finally(()=>{if(slasherPending.get(card.id)===task)slasherPending.delete(card.id);});
 slasherPending.set(card.id,task);return task;
}
export async function applyAutomaticWeaponFeats(card){
 // Avoid competing shared Undo-history writes for mixed damage types.
 await applyCrusherCritical(card);await applySlasher(card);
}
async function dispatch(card,key,data){const gm=game.users.activeGM;if(!gm)throw Error('A connected GM is required.');if(gm.id!==game.user.id){game.socket.emit('module.'+ID,{action:'weaponFeat',messageId:card.id,key,...data,userId:game.user.id,gmId:gm.id});return;}return enqueue(()=>applyPiercer(card,data.keys,data.expected));}
const report=error=>{console.error('Weapon feat',error);ui.notifications.error(error.message);};
export function renderWeaponFeats(card,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const entries=[...(card.type==='damage'?[{card,node:root}]:[]),...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(node=>!node.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries)for(const key of Object.keys(kinds)){
  const selector='[data-rsa-weapon-feat="'+key+'"]',old=node.querySelector(selector),c=key==='piercer'?featContext(card,key):null;if(!c){old?.remove();continue;}
  if(old){old.disabled=!canUseWeaponFeat(card,key);continue;}
  const face=node.querySelector('.chat-card')??node;let controls=face.querySelector('.rsa-damage-actions');if(!controls){controls=document.createElement('div');controls.className='rsa-attack-actions rsa-damage-actions';face.append(controls);}
  const button=document.createElement('button');button.type='button';button.dataset.rsaWeaponFeat=key;button.textContent=c.feature.name;button.disabled=!canUseWeaponFeat(card,key);
  button.dataset.tooltip=isRollAdjustmentLocked(card)?'Undo applied damage first.':key==='piercer'?'Reroll one weapon damage die; riders excluded. Use the new result. Once per turn.':'Choose the optional hit or critical benefit.';
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();choosePiercer(card).catch(report);});controls.append(button);
 }
}
let bridge=false;
Hooks.once('init',()=>{for(const key of Object.keys(kinds))game.settings.register(ID,key+'Automation',{name:key[0].toUpperCase()+key.slice(1)+' Assistance',hint:key==='crusher'?'Automatically apply Crusher critical-hit advantage until the start of your next turn. Movement is manual.':key==='slasher'?'Automatically apply Hamstring once per turn on a slashing hit and attack disadvantage on a critical hit, until the start of your next turn.':'Offer selective damage-card controls, native effects and once-per-turn tracking. Undo applied damage before adjusting.',scope:'world',config:true,type:Boolean,default:true});});
Hooks.on('ac5e.usageRulesReady',({usageRules}={})=>{bridge=registerFeatConditions(usageRules);});
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationWeaponFeats={finalizePiercer,applyCrusherCritical,applySlasher,applyAutomaticWeaponFeats,available:card=>Object.keys(kinds).some(key=>canUseWeaponFeat(card,key))};bridge=registerFeatConditions();
 Hooks.on('preCreateChatMessage',captureFeatTurn);Hooks.on('dnd5e.renderChatMessage',renderWeaponFeats);Hooks.on('dnd5e.preRollAttackV2',featRollDefaults);
 Hooks.on('createChatMessage',card=>{applyAutomaticWeaponFeats(card).catch(report);});
 Hooks.on('updateChatMessage',(card,changes)=>{
  if(card.type!=='damage'||!changes)return;
  const keys=['rolls','type','system.targets','system.origin','flags.'+ID+'.damageAttackId','flags.'+ID+'.pendingDamage'];
  if(keys.some(key=>Object.hasOwn(changes,key))||['targets','origin'].some(key=>Object.hasOwn(changes.system??{},key))||['damageAttackId','pendingDamage'].some(key=>Object.hasOwn(changes.flags?.[ID]??{},key)))applyCrusherCritical(card).catch(report);
 });
 Hooks.on('dnd5e.preRollDamageV2',(config,dialog)=>{if(!weaponFeat(config.subject?.actor,'piercer')||!enabled('piercer'))return;const configure=dialog.configure;Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog('damage',dialog));if(configure===false)dialog.configure=false;});
 for(const event of ['createItem','updateItem','deleteItem','updateActor','createActiveEffect','updateActiveEffect','deleteActiveEffect'])Hooks.on(event,doc=>{for(const key of Object.keys(kinds))globalThis.Ugmuls55eAutomationChatRefresh?.request(key,doc);});
 Hooks.on('updateCombat',(combat,changes)=>{if(['turn','round','started'].some(key=>key in changes))for(const key of Object.keys(kinds))globalThis.Ugmuls55eAutomationChatRefresh?.request(key,combat);});
 game.socket.on('module.'+ID,packet=>{
  if(packet?.action==='weaponFeatError'&&packet.userId===game.user.id){ui.notifications.error(packet.error);return;}
  if(packet?.action!=='weaponFeat'||!authority()||packet.gmId!==game.user.id)return;
  const card=game.messages.get(packet.messageId),user=game.users.get(packet.userId);if(!user?.active||packet.key!=='piercer')return;
  enqueue(()=>applyPiercer(card,packet.keys,packet.expected,user)).catch(error=>{report(error);game.socket.emit('module.'+ID,{action:'weaponFeatError',userId:user.id,error:error.message});});
 });
});
