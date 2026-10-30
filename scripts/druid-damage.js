import {firearmContext} from './arcane-firearm.js';
import {createEventQueue,isRollAdjustmentLocked} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',choices=new WeakMap(),pending=new WeakMap(),settlements=new WeakMap(),requests=new Map(),waiting=new Map(),wrapped=new WeakSet(),enqueue=createEventQueue();
let lunarMemory,memoryWrites=Promise.resolve();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}},message=r=>typeof r==='string'?game.messages.get(r.replace(/^ChatMessage\./,'')):r;
const enabled=k=>game.settings.get(ID,k==='form'?'lunarFormAutomation':k==='lunar'?'lunarRadianceAutomation':k==='primal'?'primalStrikeAutomation':'potentSpellcastingAutomation')===true,turn=()=>game.combat?.started?[game.combat.id,game.combat.round,game.combat.turn].join(':'):null,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function druidOwner(actor){
 // Wild Shape copies flags and class features into a new actor. Keep the turn
 // ledger on the original actor so transforming/reverting cannot refresh it.
 const original=actor?.getFlag?.('dnd5e','originalActor')??actor?.flags?.dnd5e?.originalActor;
 return actor?.isPolymorphed&&original?(game.actors.get(original)??actor):actor;
}
export function druidFeature(actor,kind){const id=kind==='form'?'lunar-form':kind==='lunar'?'improved-circle-forms':kind==='primal'?'elemental-fury-primal-strike':'elemental-fury-potent-spellcasting',name=kind==='form'?'Lunar Form':kind==='lunar'?'Improved Circle Forms':kind==='primal'?'Elemental Fury: Primal Strike':'Elemental Fury: Potent Spellcasting';return values(actor?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)===id||i.name?.trim().toLowerCase()===name.toLowerCase()));}
export function druidContext(app){
 const c=firearmContext(app),data=app.message?.data??{},card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),origin=message(data.system?.origin??card?.system?.origin),attackId=data.flags?.[ID]?.damageAttackId??flag(card,'damageAttackId');
 // Never guess between multiple attacks from the same usage card.
 const attacks=values(c.cast?.getAssociatedRolls?.('attack')),attack=attackId?game.messages.get(attackId):origin?.type==='attack'?origin:attacks.length===1?attacks[0]:null;
 const actor=card?.getAssociatedActor?.()??c.actor,owner=druidOwner(actor),targets=[card?.system?.targets,data.system?.targets,attack?.system?.targets].find(t=>t?.length)??[];
 return {...c,actor,owner,card,attack,targets,form:druidFeature(actor,'form')??druidFeature(owner,'form'),primal:druidFeature(actor,'primal')??druidFeature(owner,'primal'),potent:druidFeature(actor,'potent')??druidFeature(owner,'potent'),lunar:druidFeature(actor,'lunar')??druidFeature(owner,'lunar')};
}
function ownTurn(c){return !turn()||druidOwner(game.combat.combatant?.actor)?.uuid===c.owner?.uuid;}
export function primalUsed(c){return !!flag(c.attack,'primalStrike')||!!turn()&&flag(c.owner,'primalStrikeTurn')?.turn===turn();}
function primalValid(c){
 const target=c.targets.length===1?c.targets[0]:null,item=c.activity?.item,beast=c.actor?.isPolymorphed&&c.actor?.flags?.dnd5e?.transformOptions?.preset==='wildshape';
 return !!c.primal&&c.activity?.type==='attack'&&(item?.type==='weapon'||beast&&item?.type==='feat')&&!!target&&values(c.attack?.system?.evaluatedTargets).some(t=>t.token===target.token&&t.isMiss===false)&&ownTurn(c)&&!isRollAdjustmentLocked(c.attack)&&!primalUsed(c);
}
export function lunarFormUsed(c){return !!flag(c.attack,'lunarForm')||!!turn()&&flag(c.owner,'lunarFormTurn')?.turn===turn();}
function lunarFormValid(c){
 const target=c.targets.length===1?c.targets[0]:null;
 return !!c.form&&c.actor?.isPolymorphed&&c.actor.flags?.dnd5e?.transformOptions?.preset==='wildshape'&&c.activity?.type==='attack'&&['weapon','feat'].includes(c.activity.item?.type)&&!!target&&values(c.attack?.system?.evaluatedTargets).some(t=>t.token===target.token&&t.isMiss===false)&&!isRollAdjustmentLocked(c.attack)&&!lunarFormUsed(c);
}
export function druidEligible(app,kind){
 const c=druidContext(app),flags=app.message?.data?.flags?.[ID]??{};
 if(!enabled(kind)||!c.actor?.isOwner||!c.owner?.isOwner||c.card&&isRollAdjustmentLocked(c.card)||flags.masteryGraze)return false;
 if(kind==='form')return lunarFormValid(c);
 if(kind==='lunar')return !!c.lunar&&c.actor.isPolymorphed&&c.actor.flags?.dnd5e?.transformOptions?.preset==='wildshape'&&c.activity?.type==='attack'&&!isRollAdjustmentLocked(c.attack)&&values(c.attack?.system?.evaluatedTargets).some(t=>t.isMiss===false&&c.targets.some(target=>target.token===t.token));
 return kind==='primal'?primalValid(c):!!c.potent&&c.item?.type==='spell'&&Number(c.item.system?.level)===0&&['attack','save','damage'].includes(c.activity?.type);
}
export function primalFormula(c,kind='primal'){
 const damage=values(c[kind]?.system?.activities).find(a=>a.type==='damage'),part=values(damage?.damage?.parts)[0];if(!part)throw Error('Primal Strike is missing its native damage activity.');
 const formula=part.custom?.enabled?part.custom.formula:part.formula??`${part.number}d${part.denomination}${part.bonus?' + '+part.bonus:''}`;
 // Resolve native scaling from the retained Druid, not the Beast CR.
 return {formula:CONFIG.Dice.BasicRoll.replaceFormulaData(formula,c.owner.getRollData(),{missing:0}),types:values(part.types),critical:damage.damage.critical?.allow!==false};
}
function lunarMemories(){if(!lunarMemory){const stored=game.settings.get(ID,'lunarRadianceChoices');lunarMemory=stored&&typeof stored==='object'?{...stored}:{};}return lunarMemory;}
function lunarKey(app){const c=druidContext(app);return c.owner?.uuid?`${game.user.id}:${c.owner.uuid}`:null;}
export function lunarChoice(app){
 const state=choices.get(app)??{};if(state.lunar)return state.lunar.yes===true;
 const key=lunarKey(app),yes=!!key&&lunarMemories()[key]===true;choices.set(app,{...state,lunar:{yes}});return yes;
}
export function selectDruid(app,kind,yes,extra={}){
 const state=choices.get(app)??{};choices.set(app,{...state,[kind]:{...state[kind],...extra,yes:yes===true}});
 if(kind==='lunar'&&druidEligible(app,'lunar')){
  const key=lunarKey(app),memory=lunarMemories();if(key&&memory[key]!==yes){memory[key]=yes===true;const snapshot={...memory};
   memoryWrites=memoryWrites.then(()=>game.settings.set(ID,'lunarRadianceChoices',snapshot)).catch(error=>console.warn('Could not remember Lunar Radiance choice',error));
  }
 }
}
function damageParts(app,rolls){return rolls.slice(0,app.config?.rolls?.length??1).map((roll,index)=>({roll,index,type:roll.options?.type??values(roll.options?.types)[0]})).filter(p=>p.type&&!['healing','temphp'].includes(p.type));}
export function addDruidChoices(app){
 if(druidEligible(app,'lunar'))globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:'lunar-radiance',label:'Lunar Radiance — Radiant damage',value:lunarChoice(app),change:yes=>selectDruid(app,'lunar',yes)});
 const c=druidContext(app);for(const kind of ['primal','potent','form']){
  if(!enabled(kind)||!c[kind])continue;const state=choices.get(app)?.[kind]??{},eligible=druidEligible(app,kind),used=kind==='form'?lunarFormUsed(c):kind==='primal'&&primalUsed(c),parts=damageParts(app,app.rolls??[]);if(!parts.length)continue;
  const row=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:kind==='form'?'lunar-form':kind==='primal'?'primal-strike':'potent-spellcasting',label:kind==='form'?'Lunar Form - 2d10 Radiant':kind==='primal'?'Primal Strike':'Potent Spellcasting',value:state.yes!==false,used,disabled:!eligible,change:yes=>selectDruid(app,kind,yes)});
  for(const old of values(row?.querySelectorAll?.('[data-druid-option]')))old.remove();if(!row)continue;
  const options=kind==='primal'?primalFormula(c).types:kind==='potent'&&parts.length>1?parts.map(p=>String(p.index)):[];if(!options.length)continue;
  const select=document.createElement('select');select.dataset.druidOption=kind;select.disabled=!eligible||used;select.setAttribute('aria-label',kind==='primal'?'Primal Strike damage type':'Potent Spellcasting damage roll');
  for(const option of options){const node=document.createElement('option');node.value=option;node.textContent=kind==='primal'?(CONFIG.DND5E.damageTypes[option]?.label??option):`Roll ${Number(option)+1} — ${parts.find(p=>p.index===Number(option))?.type}`;select.append(node);}select.value=String(state.option??options[0]);select.addEventListener('change',()=>{selectDruid(app,kind,choices.get(app)?.[kind]?.yes!==false,{option:select.value});app.rebuild();});row.querySelector('.form-fields')?.append(select);
 }
}
export function lunarDamageRoll(roll,convert){
 const prior=roll.options?.rsaLunarRadianceOriginal,type=roll.options?.type??values(roll.options?.types)[0];
 if(convert&&prior||!convert&&!prior||['healing','temphp'].includes(type))return roll;
 const copy=roll.constructor.fromData(foundry.utils.deepClone(roll.toJSON())),original=prior??{type:roll.options?.type,types:values(roll.options?.types),damageType:roll.data?.roll?.damageType};
 const target=convert?'radiant':original.type??original.types[0];copy.options.type=convert?'radiant':original.type;copy.options.types=convert?['radiant']:[...original.types];
 const rewrite=terms=>{for(const term of terms??[]){if(term.options?.flavor===type)term.options.flavor=target;for(const child of term.rolls??[])rewrite(child.terms);if(term.roll)rewrite(term.roll.terms);}};rewrite(copy.terms);
 if(copy.data?.roll){if(convert)copy.data.roll.damageType='radiant';else if(original.damageType===undefined)delete copy.data.roll.damageType;else copy.data.roll.damageType=original.damageType;}
 if(convert)copy.options.rsaLunarRadianceOriginal=original;else delete copy.options.rsaLunarRadianceOriginal;copy.resetFormula?.();return copy;
}
export function finalizeDruid(app,rolls,{preview=false}={}){
 if(!preview)pending.delete(app);const count=app.config?.rolls?.length??1,convert=druidEligible(app,'lunar')&&lunarChoice(app);
 // Convert only native attack parts. Appended Primal Strike and other riders
 // keep their independently selected damage types, original dice and crit state.
 const original=rolls.filter(r=>!r.options?.rsaPrimalStrike&&!r.options?.rsaPotentSpellcasting&&!r.options?.rsaLunarForm).map((r,i)=>i<count?lunarDamageRoll(r,convert):r),parts=damageParts(app,original);if(!parts.length)return original;const c=druidContext(app),result=[...original];
 for(const kind of ['primal','potent','form']){const state=choices.get(app)?.[kind];if(state?.yes===false||!druidEligible(app,kind))continue;
  const part=parts.find(p=>kind==='potent'&&p.index===Number(state?.option))??parts[0],label=kind==='form'?'Lunar Form':kind==='primal'?'Primal Strike':'Potent Spellcasting';let formula,type,isCritical=false;
  if(kind==='primal'||kind==='form'){const native=primalFormula(c,kind);formula=native.formula;type=native.types.includes(state?.option)?state.option:native.types[0];isCritical=native.critical&&part.roll.options?.isCritical===true;if(!preview)pending.set(app,[...(pending.get(app)??[]),{...c,kind,turn:turn(),type,formula}]);}
  else{const bonus=Number(c.actor.system?.abilities?.wis?.mod);if(!Number.isFinite(bonus))throw Error('Potent Spellcasting requires a valid Wisdom modifier.');formula=String(bonus);type=part.type;}
  result.push(new CONFIG.Dice.DamageRoll(`${formula}[${label}]`,{}, {type,types:[type],properties:values(part.roll.options?.properties),flavor:label,isCritical,critical:{...part.roll.options?.critical,bonusDice:0,bonusDamage:''},[kind==='form'?'rsaLunarForm':kind==='primal'?'rsaPrimalStrike':'rsaPotentSpellcasting']:true}));
 }return result;
}
export async function druidOperation(operation,payload,user=game.user){
 if(!authority()||!user?.active)throw Error('A connected GM is required for Primal Strike.');
 const kind=payload.kind==='form'?'form':'primal',ledger=kind==='form'?'lunarFormTurn':'primalStrikeTurn',mark=kind==='form'?'lunarForm':'primalStrike';
 if(operation!=='claim'){const e=requests.get(payload.request);if(!e||e.user!==user.id||e.kind!==kind)return;if(operation==='rollback'){if(flag(e.owner,ledger)?.request===payload.request)await e.owner.setFlag(ID,ledger,e.previous??null);if(flag(e.attack,mark)?.request===payload.request)await e.attack.unsetFlag(ID,mark);}requests.delete(payload.request);return;}
 if(requests.has(payload.request))return;
 const actor=resolve(payload.actor),attack=game.messages.get(payload.attack),activity=attack?.getAssociatedActivity?.(),c={actor,owner:druidOwner(actor),attack,activity,targets:attack?.system?.targets??[]};c[kind]=druidFeature(actor,kind)??druidFeature(c.owner,kind);
 if(!enabled(kind)||!actor||!(user.isGM||actor.testUserPermission?.(user,'OWNER'))||attack?.getAssociatedActor?.()?.uuid!==actor.uuid||!(kind==='form'?lunarFormValid(c):primalValid(c))||payload.turn!==turn()||typeof payload.request!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(payload.request))throw Error('Primal Strike is no longer available for this hit or turn.');
 const native=primalFormula(c,kind);if(!native.types.includes(payload.type)||native.formula!==payload.formula)throw Error('Primal Strike damage changed. Reopen the roll.');
 const previous=flag(c.owner,ledger),record={request:payload.request,turn:turn(),actor:actor.uuid,type:payload.type};
 if(turn())await c.owner.setFlag(ID,ledger,record);
 try{await attack.setFlag(ID,mark,record);}catch(error){if(turn()&&flag(c.owner,ledger)?.request===payload.request)await c.owner.setFlag(ID,ledger,previous??null);throw error;}
 requests.set(payload.request,{owner:c.owner,attack,previous,kind,user:user.id});if(requests.size>256)requests.delete(requests.keys().next().value);
}
function operate(operation,payload){const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return enqueue(()=>druidOperation(operation,payload));const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Primal Strike.'));},10000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'druidDamageOperation',operation,payload,request,user:game.user.id,gm:gm.id});});}
export async function commitDruid(app,options){
 const entries=pending.get(app);pending.delete(app);if(!entries||!options?.dnd5e?.submitted)return;
 const claimed=[];
 try{for(const e of entries){
  if(!druidEligible(app,e.kind)||e.turn!==turn())throw Error('Druid damage changed. Reopen the roll configuration.');
  const payload={kind:e.kind,request:foundry.utils.randomID(),actor:e.actor.uuid,attack:e.attack.id,turn:e.turn,type:e.type,formula:e.formula};await operate('claim',payload);claimed.push(payload);
 }}catch(error){for(const payload of claimed)await operate('rollback',payload);throw error;}
 settlements.set(app.message,claimed);app.message.data??={};app.message.data.flags??={};app.message.data.flags[ID]??={};
 for(const payload of claimed)app.message.data.flags[ID][payload.kind==='form'?'lunarForm':'primalStrike']=payload;
}
export function installDruidRoll(Type=CONFIG.Dice.DamageRoll){
 if(!Type?.build||wrapped.has(Type))return;wrapped.add(Type);const build=Type.build,configure=Type.buildConfigure;
 if(configure)Type.buildConfigure=async function(config,dialog,message){const rolls=await configure.call(this,config,dialog,message);if(dialog.configure!==false||!rolls?.length)return rolls;const app={config,message};const result=finalizeDruid(app,rolls);await commitDruid(app,{dnd5e:{submitted:true}});return result;};
 Type.build=async function(config,dialog,message={}){let success=false;try{const result=await build.call(this,config,dialog,message);success=!!result?.length;return result;}finally{const payload=settlements.get(message);if(payload){settlements.delete(message);for(const entry of payload)await operate(success?'keep':'rollback',entry);}}};
}
Hooks.once('init',()=>{game.settings.register(ID,'lunarRadianceChoices',{scope:'client',config:false,type:Object,default:{}});for(const [setting,name,hint]of [['lunarFormAutomation','Moon Druid: Lunar Form','Offer native bonus Radiant damage once per turn on a Wild Shape attack hit. Defaults Yes; disabled after use.'],['lunarRadianceAutomation','Moon Druid: Lunar Radiance','Offer optional Radiant conversion for attacks that hit while using Wild Shape with Improved Circle Forms. Remember the last choice per user/Druid across forms and reloads; preserve dice, criticals and separate rider types.'],['primalStrikeAutomation','Druid: Primal Strike','Offer native elemental damage on a weapon or Wild Shape Beast hit once on your own turn. Preserve scaling and critical hits.'],['potentSpellcastingAutomation','Druid: Potent Spellcasting','Add a labeled Wisdom bonus to cantrip damage for a character with Potent Spellcasting. Defaults Yes; healing and leveled spells are excluded.']])game.settings.register(ID,setting,{name,hint,scope:'world',config:true,type:Boolean,default:true});});
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationDruidDamage={addDruidChoices,finalizeDruid,commitDruid};installDruidRoll();
 Hooks.on('dnd5e.preRollDamageV2',(config,dialog,message)=>{const c=druidContext({config,message});if(dialog.configure!==false&&(enabled('primal')&&c.primal||enabled('potent')&&c.potent||enabled('lunar')&&c.lunar||enabled('form')&&c.form))Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog('damage',dialog));});
 game.socket.on('module.'+ID,packet=>{if(packet?.action==='druidDamageReply'&&packet.user===game.user.id){const e=waiting.get(packet.request);if(!e)return;waiting.delete(packet.request);clearTimeout(e.timer);packet.error?e.reject(Error(packet.error)):e.resolve();return;}
  if(packet?.action!=='druidDamageOperation'||!authority()||packet.gm!==game.user.id||!['claim','keep','rollback'].includes(packet.operation))return;const user=game.users.get(packet.user);if(!user?.active)return;enqueue(()=>druidOperation(packet.operation,packet.payload,user)).then(()=>game.socket.emit('module.'+ID,{action:'druidDamageReply',request:packet.request,user:user.id}),error=>game.socket.emit('module.'+ID,{action:'druidDamageReply',request:packet.request,user:user.id,error:error.message}));
 });
});
