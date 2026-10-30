import {firearmContext} from './arcane-firearm.js';
import {createEventQueue,isRollAdjustmentLocked} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',choices=new WeakMap(),pending=new WeakMap(),settlements=new WeakMap(),requests=new Map(),waiting=new Map(),wrapped=new WeakSet(),enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}},message=r=>typeof r==='string'?game.messages.get(r.replace(/^ChatMessage\./,'')):r;
const enabled=k=>game.settings.get(ID,k==='primal'?'primalStrikeAutomation':'potentSpellcastingAutomation')===true,turn=()=>game.combat?.started?[game.combat.id,game.combat.round,game.combat.turn].join(':'):null,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function druidOwner(actor){
 // Wild Shape copies flags and class features into a new actor. Keep the turn
 // ledger on the original actor so transforming/reverting cannot refresh it.
 const original=actor?.getFlag?.('dnd5e','originalActor')??actor?.flags?.dnd5e?.originalActor;
 return actor?.isPolymorphed&&original?(game.actors.get(original)??actor):actor;
}
export function druidFeature(actor,kind){const id=kind==='primal'?'elemental-fury-primal-strike':'elemental-fury-potent-spellcasting',name=kind==='primal'?'Elemental Fury: Primal Strike':'Elemental Fury: Potent Spellcasting';return values(actor?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)===id||i.name?.trim().toLowerCase()===name.toLowerCase()));}
export function druidContext(app){
 const c=firearmContext(app),data=app.message?.data??{},card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),origin=message(data.system?.origin??card?.system?.origin),attackId=data.flags?.[ID]?.damageAttackId??flag(card,'damageAttackId');
 // Never guess between multiple attacks from the same usage card.
 const attacks=values(c.cast?.getAssociatedRolls?.('attack')),attack=attackId?game.messages.get(attackId):origin?.type==='attack'?origin:attacks.length===1?attacks[0]:null;
 const actor=card?.getAssociatedActor?.()??c.actor,owner=druidOwner(actor),targets=[card?.system?.targets,data.system?.targets,attack?.system?.targets].find(t=>t?.length)??[];
 return {...c,actor,owner,card,attack,targets,primal:druidFeature(actor,'primal')??druidFeature(owner,'primal'),potent:druidFeature(actor,'potent')??druidFeature(owner,'potent')};
}
function ownTurn(c){return !turn()||druidOwner(game.combat.combatant?.actor)?.uuid===c.owner?.uuid;}
export function primalUsed(c){return !!flag(c.attack,'primalStrike')||!!turn()&&flag(c.owner,'primalStrikeTurn')?.turn===turn();}
function primalValid(c){
 const target=c.targets.length===1?c.targets[0]:null,item=c.activity?.item,beast=c.actor?.isPolymorphed&&c.actor?.flags?.dnd5e?.transformOptions?.preset==='wildshape';
 return !!c.primal&&c.activity?.type==='attack'&&(item?.type==='weapon'||beast&&item?.type==='feat')&&!!target&&values(c.attack?.system?.evaluatedTargets).some(t=>t.token===target.token&&t.isMiss===false)&&ownTurn(c)&&!isRollAdjustmentLocked(c.attack)&&!primalUsed(c);
}
export function druidEligible(app,kind){
 const c=druidContext(app),flags=app.message?.data?.flags?.[ID]??{};
 if(!enabled(kind)||!c.actor?.isOwner||!c.owner?.isOwner||c.card&&isRollAdjustmentLocked(c.card)||flags.masteryGraze)return false;
 return kind==='primal'?primalValid(c):!!c.potent&&c.item?.type==='spell'&&Number(c.item.system?.level)===0&&['attack','save','damage'].includes(c.activity?.type);
}
export function primalFormula(c){
 const damage=values(c.primal?.system?.activities).find(a=>a.type==='damage'),part=values(damage?.damage?.parts)[0];if(!part)throw Error('Primal Strike is missing its native damage activity.');
 const formula=part.custom?.enabled?part.custom.formula:part.formula??`${part.number}d${part.denomination}${part.bonus?' + '+part.bonus:''}`;
 // Resolve native scaling from the retained Druid, not the Beast CR.
 return {formula:CONFIG.Dice.BasicRoll.replaceFormulaData(formula,c.owner.getRollData(),{missing:0}),types:values(part.types),critical:damage.damage.critical?.allow!==false};
}
export function selectDruid(app,kind,yes,extra={}){const state=choices.get(app)??{};choices.set(app,{...state,[kind]:{...state[kind],...extra,yes:yes===true}});}
function damageParts(app,rolls){return rolls.slice(0,app.config?.rolls?.length??1).map((roll,index)=>({roll,index,type:roll.options?.type??values(roll.options?.types)[0]})).filter(p=>p.type&&!['healing','temphp'].includes(p.type));}
export function addDruidChoices(app){
 const c=druidContext(app);for(const kind of ['primal','potent']){
  if(!enabled(kind)||!c[kind])continue;const state=choices.get(app)?.[kind]??{},eligible=druidEligible(app,kind),used=kind==='primal'&&primalUsed(c),parts=damageParts(app,app.rolls??[]);if(!parts.length)continue;
  const row=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:kind==='primal'?'primal-strike':'potent-spellcasting',label:kind==='primal'?'Primal Strike':'Potent Spellcasting',value:state.yes!==false,used,disabled:!eligible,change:yes=>selectDruid(app,kind,yes)});
  for(const old of values(row?.querySelectorAll?.('[data-druid-option]')))old.remove();if(!row)continue;
  const options=kind==='primal'?primalFormula(c).types:parts.length>1?parts.map(p=>String(p.index)):[];if(!options.length)continue;
  const select=document.createElement('select');select.dataset.druidOption=kind;select.disabled=!eligible||used;select.setAttribute('aria-label',kind==='primal'?'Primal Strike damage type':'Potent Spellcasting damage roll');
  for(const option of options){const node=document.createElement('option');node.value=option;node.textContent=kind==='primal'?(CONFIG.DND5E.damageTypes[option]?.label??option):`Roll ${Number(option)+1} — ${parts.find(p=>p.index===Number(option))?.type}`;select.append(node);}select.value=String(state.option??options[0]);select.addEventListener('change',()=>{selectDruid(app,kind,choices.get(app)?.[kind]?.yes!==false,{option:select.value});app.rebuild();});row.querySelector('.form-fields')?.append(select);
 }
}
export function finalizeDruid(app,rolls,{preview=false}={}){
 if(!preview)pending.delete(app);const original=rolls.filter(r=>!r.options?.rsaPrimalStrike&&!r.options?.rsaPotentSpellcasting),parts=damageParts(app,original);if(!parts.length)return original;const c=druidContext(app),result=[...original];
 for(const kind of ['primal','potent']){const state=choices.get(app)?.[kind];if(state?.yes===false||!druidEligible(app,kind))continue;
  const part=parts.find(p=>kind==='potent'&&p.index===Number(state?.option))??parts[0],label=kind==='primal'?'Primal Strike':'Potent Spellcasting';let formula,type,isCritical=false;
  if(kind==='primal'){const native=primalFormula(c);formula=native.formula;type=native.types.includes(state?.option)?state.option:native.types[0];isCritical=native.critical&&part.roll.options?.isCritical===true;if(!preview)pending.set(app,{...c,turn:turn(),type,formula});}
  else{const bonus=Number(c.actor.system?.abilities?.wis?.mod);if(!Number.isFinite(bonus))throw Error('Potent Spellcasting requires a valid Wisdom modifier.');formula=String(bonus);type=part.type;}
  result.push(new CONFIG.Dice.DamageRoll(`${formula}[${label}]`,{}, {type,types:[type],properties:values(part.roll.options?.properties),flavor:label,isCritical,critical:{...part.roll.options?.critical,bonusDice:0,bonusDamage:''},[kind==='primal'?'rsaPrimalStrike':'rsaPotentSpellcasting']:true}));
 }return result;
}
export async function druidOperation(operation,payload,user=game.user){
 if(!authority()||!user?.active)throw Error('A connected GM is required for Primal Strike.');
 if(operation!=='claim'){const e=requests.get(payload.request);if(!e||e.user!==user.id)return;if(operation==='rollback'){if(flag(e.owner,'primalStrikeTurn')?.request===payload.request)await e.owner.setFlag(ID,'primalStrikeTurn',e.previous??null);if(flag(e.attack,'primalStrike')?.request===payload.request)await e.attack.unsetFlag(ID,'primalStrike');}requests.delete(payload.request);return;}
 if(requests.has(payload.request))return;
 const actor=resolve(payload.actor),attack=game.messages.get(payload.attack),activity=attack?.getAssociatedActivity?.(),c={actor,owner:druidOwner(actor),attack,activity,targets:attack?.system?.targets??[]};c.primal=druidFeature(actor,'primal')??druidFeature(c.owner,'primal');
 if(!enabled('primal')||!actor||!(user.isGM||actor.testUserPermission?.(user,'OWNER'))||attack?.getAssociatedActor?.()?.uuid!==actor.uuid||!primalValid(c)||payload.turn!==turn()||typeof payload.request!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(payload.request))throw Error('Primal Strike is no longer available for this hit or turn.');
 const native=primalFormula(c);if(!native.types.includes(payload.type)||native.formula!==payload.formula)throw Error('Primal Strike damage changed. Reopen the roll.');
 const previous=flag(c.owner,'primalStrikeTurn'),record={request:payload.request,turn:turn(),actor:actor.uuid,type:payload.type};
 if(turn())await c.owner.setFlag(ID,'primalStrikeTurn',record);
 try{await attack.setFlag(ID,'primalStrike',record);}catch(error){if(turn()&&flag(c.owner,'primalStrikeTurn')?.request===payload.request)await c.owner.setFlag(ID,'primalStrikeTurn',previous??null);throw error;}
 requests.set(payload.request,{owner:c.owner,attack,previous,user:user.id});if(requests.size>256)requests.delete(requests.keys().next().value);
}
function operate(operation,payload){const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return enqueue(()=>druidOperation(operation,payload));const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Primal Strike.'));},10000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'druidDamageOperation',operation,payload,request,user:game.user.id,gm:gm.id});});}
export async function commitDruid(app,options){
 const e=pending.get(app);pending.delete(app);if(!e||!options?.dnd5e?.submitted)return;if(!druidEligible(app,'primal')||e.turn!==turn())throw Error('Primal Strike changed. Reopen the roll configuration.');
 const payload={request:foundry.utils.randomID(),actor:e.actor.uuid,attack:e.attack.id,turn:e.turn,type:e.type,formula:e.formula};await operate('claim',payload);settlements.set(app.message,payload);
 app.message.data??={};app.message.data.flags??={};app.message.data.flags[ID]={...app.message.data.flags[ID],primalStrike:payload};
}
export function installDruidRoll(Type=CONFIG.Dice.DamageRoll){
 if(!Type?.build||wrapped.has(Type))return;wrapped.add(Type);const build=Type.build,configure=Type.buildConfigure;
 if(configure)Type.buildConfigure=async function(config,dialog,message){const rolls=await configure.call(this,config,dialog,message);if(dialog.configure!==false||!rolls?.length)return rolls;const app={config,message};const result=finalizeDruid(app,rolls);await commitDruid(app,{dnd5e:{submitted:true}});return result;};
 Type.build=async function(config,dialog,message={}){let success=false;try{const result=await build.call(this,config,dialog,message);success=!!result?.length;return result;}finally{const payload=settlements.get(message);if(payload){settlements.delete(message);await operate(success?'keep':'rollback',payload);}}};
}
Hooks.once('init',()=>{for(const [setting,name,hint]of [['primalStrikeAutomation','Druid: Primal Strike','Offer native elemental damage on a weapon or Wild Shape Beast hit once on your own turn. Preserve scaling and critical hits.'],['potentSpellcastingAutomation','Druid: Potent Spellcasting','Add a labeled Wisdom bonus to cantrip damage for a character with Potent Spellcasting. Defaults Yes; healing and leveled spells are excluded.']])game.settings.register(ID,setting,{name,hint,scope:'world',config:true,type:Boolean,default:true});});
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationDruidDamage={addDruidChoices,finalizeDruid,commitDruid};installDruidRoll();
 Hooks.on('dnd5e.preRollDamageV2',(config,dialog,message)=>{const c=druidContext({config,message});if(dialog.configure!==false&&(enabled('primal')&&c.primal||enabled('potent')&&c.potent))Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog('damage',dialog));});
 game.socket.on('module.'+ID,packet=>{if(packet?.action==='druidDamageReply'&&packet.user===game.user.id){const e=waiting.get(packet.request);if(!e)return;waiting.delete(packet.request);clearTimeout(e.timer);packet.error?e.reject(Error(packet.error)):e.resolve();return;}
  if(packet?.action!=='druidDamageOperation'||!authority()||packet.gm!==game.user.id||!['claim','keep','rollback'].includes(packet.operation))return;const user=game.users.get(packet.user);if(!user?.active)return;enqueue(()=>druidOperation(packet.operation,packet.payload,user)).then(()=>game.socket.emit('module.'+ID,{action:'druidDamageReply',request:packet.request,user:user.id}),error=>game.socket.emit('module.'+ID,{action:'druidDamageReply',request:packet.request,user:user.id,error:error.message}));
 });
});
