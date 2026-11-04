import {firearmContext} from './arcane-firearm.js';
import {isRollAdjustmentLocked} from './shared-activity-card.js';
import {paidHealingSlotLevel,hasPaidHealingSlot} from './blessed-healer.js';
const ID='ugmuls-5-5e-automation',wrapped=new WeakSet();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],enabled=()=>game.settings.get(ID,'discipleLifeAutomation')===true,turn=()=>game.combat?.started?[game.combat.id,game.combat.round,game.combat.turn].join(':'):null;
export const discipleFeature=a=>values(a?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&((i.identifier??i.system?.identifier)==='disciple-of-life'||i.id==='phbclcDiscipleOf'||i.name?.trim().toLowerCase()==='disciple of life'||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.phbclcDiscipleOf'))));
export function captureDiscipleCast(activity,usage,message){
 if(!enabled()||activity?.item?.type!=='spell')return;const actor=activity.actor??activity.item.actor,feature=discipleFeature(actor),level=paidHealingSlotLevel(actor,message.data?.system);
 message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],discipleLifeCast:feature&&level?{actor:actor.uuid,feature:feature.uuid,level,turn:turn()}:{eligible:false}};
}
export function discipleContext(app){
 if(!enabled())return null;const c=firearmContext(app),snapshot=flag(c.cast,'discipleLifeCast'),feature=discipleFeature(c.actor),card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app);
 if(c.item?.type!=='spell'||!c.actor?.isOwner||!feature||!snapshot?.level||snapshot.actor!==c.actor.uuid||snapshot.feature!==feature.uuid||snapshot.turn!==turn()||!hasPaidHealingSlot(c.cast.system)||flag(c.cast,'targetsConfirmationCanceled')||card&&isRollAdjustmentLocked(card))return null;
 return {...c,feature,level:snapshot.level};
}
export function discipleBonus(c){
 const native=values(c.feature.system.activities).find(a=>a.type==='heal'),formula=native?.healing?.custom?.enabled?native.healing.custom.formula:native?.healing?.formula;
 if(!formula)throw Error('Disciple of Life is missing its native healing formula.');const roll=new CONFIG.Dice.BasicRoll(String(formula).replace(/@scaling\b/g,String(c.level)),c.actor.getRollData?.()??{});if(roll.isDeterministic===false)throw Error('Disciple of Life requires a flat healing bonus.');const amount=Number(roll.evaluateSync().total);if(!Number.isFinite(amount)||amount<=0)throw Error('Disciple of Life healing could not be calculated.');return amount;
}
function healingPart(app,rolls){return rolls.slice(0,app.config?.rolls?.length??1).find(r=>r.options?.type==='healing'&&!r.options?.rsaDiscipleLife);}
export function addDiscipleNote(app){
 const c=discipleContext(app);if(!c||!healingPart(app,app.rolls??[])){app.element?.querySelector?.('[data-rsa-choice="disciple-of-life"]')?.remove();return;}
 globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:'disciple-of-life',label:'Disciple of Life (+'+discipleBonus(c)+' HP)',value:true,locked:true});
}
export function finalizeDisciple(app,rolls){
 const original=rolls.filter(r=>!r.options?.rsaDiscipleLife),c=discipleContext(app),part=healingPart(app,original);if(!c||!part)return original;
 const bonus=discipleBonus(c),roll=new CONFIG.Dice.DamageRoll(String(bonus)+'[Disciple of Life]',{}, {type:'healing',types:['healing'],flavor:'Disciple of Life',isCritical:false,critical:{allow:false,bonusDice:0,bonusDamage:''},properties:values(part.options?.properties),rsaDiscipleLife:true});
 return [...original,roll];
}
export function installDiscipleRoll(Type=CONFIG.Dice.DamageRoll){
 if(!Type?.buildConfigure||wrapped.has(Type))return;wrapped.add(Type);const configure=Type.buildConfigure;Type.buildConfigure=async function(config,dialog,message){const rolls=await configure.call(this,config,dialog,message);return dialog.configure===false&&rolls?.length?finalizeDisciple({config,message},rolls):rolls;};
}
Hooks.once('init',()=>game.settings.register(ID,'discipleLifeAutomation',{name:'Life Cleric: Disciple of Life',hint:'On the turn a slot-funded spell is cast, add the native 2 + spell-slot-level HP bonus to its healing roll and show a labeled configuration note. Preserve original dice, targets and native Apply/Undo; exclude temporary HP, slotless casts and later-turn healing.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationDisciple={addNote:addDiscipleNote,finalize:finalizeDisciple};installDiscipleRoll();Hooks.on('dnd5e.postActivityConsumption',captureDiscipleCast);
 Hooks.on('dnd5e.preRollDamageV2',(config,dialog,message)=>{if(!discipleContext({config,message}))return;const configure=dialog.configure;Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog('damage',dialog)??dialog);if(configure===false)dialog.configure=false;});
});
