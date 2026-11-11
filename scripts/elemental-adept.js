import {startupActors} from "./startup-actors.js";
import {createEventQueue,isHealingCard} from "./shared-activity-card.js";
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),installed=new WeakSet();
export const ADEPT_TYPES=['acid','cold','fire','lightning','thunder'];
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,'elementalAdeptAutomation')===true;
const authority=()=>game.user.isGM&&game.users.activeGM?.id===game.user.id;
const live=effect=>!effect.disabled&&effect.active!==false&&!effect.isSuppressed&&!effect.duration?.expired&&!effect.system?.expired;
const isAdept=item=>item?.type==='feat'&&item.system?.source?.rules!=='2014'&&((item.identifier??item.system?.identifier)==='elemental-adept'||/^elemental adept(?:\s*[:(—-].*)?$/i.test(item.name?.trim()??''));
export const adeptFeatures=actor=>values(actor?.items).filter(isAdept);
const effects=actor=>values(actor?.effects).filter(e=>flag(e,'elementalAdept'));
export async function syncElementalAdept(actor){
 if(!authority()||!actor)return;
 const features=adeptFeatures(actor),managed=effects(actor);
 if(!features.length){if(managed.length)await actor.deleteEmbeddedDocuments('ActiveEffect',managed.map(e=>e.id));return;}
 // Disabling automation suspends benefits without discarding the player's
 // element selections. Existing effects are never reset to their defaults.
 if(!enabled())return;
 const feature=features[0],creates=[],updates=[],deletes=[];
 for(const type of ADEPT_TYPES){
  const matches=managed.filter(e=>flag(e,'elementalAdept')?.type===type),keep=matches.find(live)??matches[0];
  deletes.push(...matches.filter(e=>e!==keep).map(e=>e.id));
  if(keep){
   const meta=flag(keep,'elementalAdept');
   if(meta.feature!==feature.uuid||keep.origin!==feature.uuid)updates.push({_id:keep.id,origin:feature.uuid,'system.origin.item':feature.uuid,['flags.'+ID+'.elementalAdept']:{...meta,type,feature:feature.uuid}});
   continue;
  }
  const label=type[0].toUpperCase()+type.slice(1);
  creates.push({name:'Elemental Adept — '+label,img:'systems/dnd5e/icons/svg/damage/'+type+'.svg',type:'base',disabled:true,transfer:false,origin:feature.uuid,
   duration:{value:null,units:'seconds',expiry:null,expired:false},
   description:'Enable for an Elemental Adept damage type you have chosen. Your spells ignore '+label+' Resistance, but not Immunity. Matching spell damage dice treat a result of 1 as 2. Disable this effect to suspend these benefits.',
   system:{changes:[],origin:{actor:actor.uuid,item:feature.uuid}},flags:{[ID]:{elementalAdept:{type,feature:feature.uuid}}}});
 }
 if(deletes.length)await actor.deleteEmbeddedDocuments('ActiveEffect',deletes);
 if(updates.length)await actor.updateEmbeddedDocuments('ActiveEffect',updates);
 if(creates.length)await actor.createEmbeddedDocuments('ActiveEffect',creates);
}
export function adeptTypes(actor){
 if(!enabled()||!adeptFeatures(actor).length)return new Set();
 return new Set(effects(actor).filter(live).map(e=>flag(e,'elementalAdept')?.type).filter(t=>ADEPT_TYPES.includes(t)));
}
function sourceCard(ref){return typeof ref==='string'?game.messages.get(ref.replace(/^ChatMessage\./,''))??globalThis.fromUuidSync?.(ref,{strict:false}):ref;}
export function elementalAdeptOptions(ref,options={}){
 if(!enabled()||options.rsaUndoDamage||options.ignore===true||options.ignore?.resistance===true)return options;
 const card=sourceCard(ref),item=card?.getAssociatedActivity?.()?.item??card?.getAssociatedItem?.();
 if(card?.type!=='damage'||isHealingCard(card)||item?.type!=='spell')return options;
 const types=adeptTypes(card.getAssociatedActor?.());if(!types.size)return options;
 const resistance=new Set(options.ignore?.resistance??[]);for(const type of types)resistance.add(type);
 return {...options,ignore:{...options.ignore,resistance}};
}
export function installElementalAdept(Type=globalThis.customElements?.get('damage-application')){
 const p=Type?.prototype;if(!p?.getMergedOptions||installed.has(p))return;installed.add(p);
 const get=p.getMergedOptions;p.getMergedOptions=function(uuid){return elementalAdeptOptions(this.chatMessage,get.call(this,uuid));};
}
function rollActor(app){
 const data=app.message?.data,pending=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),speaker=data?.speaker??pending?.speaker;
 return (speaker?globalThis.ChatMessage?.getSpeakerActor?.(speaker):null)??pending?.getAssociatedActor?.()??sourceCard(data?.system?.origin)?.getAssociatedActor?.()??app.config?.subject?.actor??app.config?.subject?.item?.actor;
}
function damageType(value,fallback){const type=typeof value==='string'?value.trim().toLowerCase():'';return type&&(Object.hasOwn(globalThis.CONFIG?.DND5E?.damageTypes??{},type)||ADEPT_TYPES.includes(type))?type:fallback;}
export function minimumAdeptDice(roll,types){
 if(roll._evaluated)return roll;
 let eligible=false,needsMinimum=false;
 function visit(current,inherited,apply=false){
  const type=damageType(current.options?.type,inherited);
  for(const term of current.terms??[]){
   const termType=damageType(term.options?.flavor??term.flavor,type);
   if(term instanceof foundry.dice.terms.DiceTerm&&!term.isDeterministic&&types.has(termType)){
    eligible=true;const mods=term.modifiers??[],minimum=Math.max(2,...mods.filter(m=>/^min\d+$/.test(m)).map(m=>Number(m.slice(3))));
    if(!mods.includes('min'+minimum))needsMinimum=true;
    if(apply)term.modifiers=[...mods.filter(m=>!/^min\d+$/.test(m)),'min'+minimum];
   }
   if(Array.isArray(term.rolls)){
    for(const child of term.rolls)visit(child,termType,apply);
    if(apply&&Array.isArray(term.terms))term.terms=term.rolls.map(child=>child.formula);
   }else if(Array.isArray(term.roll?.terms)&&typeof term.roll.resetFormula==='function'){
    visit(term.roll,termType,apply);if(apply)term.term=term.roll.formula;
   }
  }
  if(apply)current.resetFormula();
 }
 visit(roll,roll.options?.type);
 if(!eligible||!needsMinimum&&roll.options?.rsaElementalAdept)return roll;
 const copy=roll.constructor.fromData(foundry.utils.deepClone(roll.toJSON()));visit(copy,copy.options?.type,true);copy.options.rsaElementalAdept=true;return copy;
}
export function finalizeElementalAdept(app,rolls){
 if(!enabled()||app.config?.subject?.item?.type!=='spell')return rolls;
 const types=adeptTypes(rollActor(app));if(!types.size)return rolls;
 return rolls.map(roll=>minimumAdeptDice(roll,types));
}
function synchronize(actor){if(!authority()||!actor||!adeptFeatures(actor).length&&!effects(actor).length)return;enqueue(()=>syncElementalAdept(actor)).catch(report);}
function refresh(doc){globalThis.Ugmuls55eAutomationChatRefresh?.request('elementalAdept',doc);}
function report(error){console.error('Elemental Adept',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'elementalAdeptAutomation',{name:'Elemental Adept Assistance',hint:'Create five disabled elemental effects. Enable the type(s) chosen for Elemental Adept: spells ignore matching Resistance and matching damage dice treat 1 as 2. Immunity remains unchanged.',scope:'world',config:true,type:Boolean,default:true,onChange:()=>{for(const actor of startupActors()){synchronize(actor);refresh(actor);}}}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationElementalAdept={finalize:finalizeElementalAdept};installElementalAdept();
 for(const actor of startupActors())synchronize(actor);
 for(const event of ['createItem','updateItem','deleteItem'])Hooks.on(event,item=>{const actor=item.actor??item.parent;if(isAdept(item)||effects(actor).length){synchronize(actor);refresh(item);}});
 for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect'])Hooks.on(event,effect=>{if(flag(effect,'elementalAdept'))refresh(effect);});
 Hooks.on('createActor',synchronize);Hooks.on('createToken',token=>synchronize(token.actor));
 Hooks.on('canvasReady',()=>{for(const actor of new Set(values(globalThis.canvas?.scene?.tokens).map(t=>t.actor).filter(Boolean)))synchronize(actor);});
 Hooks.on('dnd5e.preRollDamageV2',(config,dialog,message)=>{if(config.subject?.item?.type!=='spell'||!adeptTypes(rollActor({config,message})).size)return;const configure=dialog.configure;Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog('damage',dialog));if(configure===false)dialog.configure=false;});
 // Native post-configuration runs for both dialogs and skipped/automatic
 // rolls, before evaluation and Dice So Nice. Preview uses the same finalizer.
 Hooks.on('dnd5e.postDamageRollConfiguration',(rolls,config,_dialog,message)=>{const result=finalizeElementalAdept({config,message},rolls);if(result!==rolls)rolls.splice(0,rolls.length,...result);});
 Hooks.on('dnd5e.preCalculateDamage',(_actor,_damages,options)=>{const next=elementalAdeptOptions(options.originatingMessage??options.origin,options);if(next!==options)options.ignore=next.ignore;});
});
