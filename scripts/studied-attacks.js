import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=c=>Array.from(c?.values?.()??c??[]),resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;const lastInputs=new WeakMap();let bridge=false;
const enabled=()=>game.settings.get(ID,"studiedAttacksAutomation")===true,authority=()=>game.user.isGM&&game.users.activeGM?.id===game.user.id;
export const studiedFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&i.system?.source?.rules!=="2014"&&(i.identifier??i.system?.identifier)==="studied-attacks");
const marker=e=>e.getFlag?.(ID,"studiedAttacks")??e.flags?.[ID]?.studiedAttacks;
const live=e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
export function matchingStudied(actor,targets){return values(actor?.effects).filter(e=>live(e)&&marker(e)&&targets.some(t=>{const token=typeof t==='string'?resolve(t):t?.document??t,m=marker(e);return token&&(m.targetToken===token.uuid||m.targetActor===(token.actor?.uuid??token.uuid));}));}
export function studiedAdvantage(actor,target){return enabled()&&!!studiedFeature(actor)&&matchingStudied(actor,[target]).length>0;}
export function recordStudiedAttack(card){
 if(!enabled()||card.type!=="attack"||!card.rolls?.length)return;const actor=card.getAssociatedActor?.();if(!studiedFeature(actor))return;
 const targets=values(card.system?.targets).map(t=>t.token).filter(Boolean),combat=game.combat,applied=combat?.started?{combat:combat.id,round:combat.round,turn:combat.turn}:null;
 card.updateSource({["flags."+ID+".studiedAttack"]:{actor:actor.uuid,applied,consume:matchingStudied(actor,targets).map(e=>e.id)}});
}
export function syncStudiedAttack(card){return enqueue(async()=>{
 if(!authority()||!enabled()||card?.type!=="attack"||!card.rolls?.length)return;
 const actor=card.getAssociatedActor?.(),feature=studiedFeature(actor),record=card.getFlag?.(ID,"studiedAttack");if(!feature||record?.actor!==actor?.uuid)return;
 lastInputs.set(card,studiedInputSignature(card));
 const consumed=card.getFlag?.(ID,"studiedConsumed");
 if(!consumed){const ids=values(actor.effects).filter(e=>(record.consume??[]).includes(e.id)&&marker(e)).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);await card.setFlag(ID,"studiedConsumed",true);}
 const ledger={...card.getFlag?.(ID,"studiedGrants")};let changed=false;
 const current=new Set(values(card.system?.targets).map(t=>t.token)),orphaned=values(actor.effects).filter(e=>marker(e)?.sourceAttack===card.id&&!current.has(marker(e).targetToken));
 if(orphaned.length){await actor.deleteEmbeddedDocuments("ActiveEffect",orphaned.map(e=>e.id));for(const effect of orphaned)ledger[marker(effect).targetToken]={miss:false};changed=true;}
 for(const target of card.system?.evaluatedTargets??[]){const token=resolve(target.token);if(!token?.actor||['vehicle','group'].includes(token.actor.type))continue;
  const existing=values(actor.effects).filter(e=>marker(e)?.sourceAttack===card.id&&marker(e).targetToken===token.uuid),prior=ledger[token.uuid];
  if(target.isMiss===true){
   if(prior?.miss===true)continue;
   // A later miss against the same creature refreshes one benefit, not a stack.
   const old=matchingStudied(actor,[token]);if(old.length)await actor.deleteEmbeddedDocuments("ActiveEffect",old.map(e=>e.id));
   const data={name:"Studied Attacks — "+token.name,img:feature.img??"icons/svg/target.svg",disabled:false,transfer:false,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:null,units:"seconds",expiry:null,expired:false},system:{changes:[],origin:{actor:actor.uuid,message:card.uuid}},flags:{dnd5e:{isTemporary:true},[ID]:{studiedAttacks:{actor:actor.uuid,sourceAttack:card.id,targetToken:token.uuid,targetActor:token.actor.uuid,applied:record.applied}}}};
   const effect=(await actor.createEmbeddedDocuments("ActiveEffect",[data]))?.[0];if(!effect)throw Error("Could not record Studied Attacks.");ledger[token.uuid]={miss:true,effect:effect.id};changed=true;
  }else if(target.isMiss===false){if(existing.length)await actor.deleteEmbeddedDocuments("ActiveEffect",existing.map(e=>e.id));if(prior?.miss!==false){ledger[token.uuid]={miss:false};changed=true;}}
 }
 if(changed)await card.setFlag(ID,"studiedGrants",ledger);
});}
export function registerStudiedRule(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return bridge;
 bridge=!!api.register({key:"rsaStudiedAttacks",scope:"universal",hook:"attack",target:"subject",mode:"advantage",name:"Studied Attacks",persistent:false,evaluate:(s,c={})=>{const subject=c.subjectToken?.actor??resolve(s.actorUuid),actor=subject?.actor??subject,target=c.opponentToken??resolve(s.opponentUuid)??resolve(s.opponentActorUuid);return studiedAdvantage(actor,target);}});return bridge;
}
export function studiedDefaults(config,dialog,message){
 if(bridge&&game.modules?.get?.("automated-conditions-5e")?.active||config.subject?.type!=="attack")return;
 const actor=config.subject.actor??config.subject.item?.actor,recorded=message?.data?.system?.targets,targets=recorded?.length?recorded.map(t=>resolve(t.token)).filter(Boolean):values(game.user?.targets).map(t=>t.document??t);
 if(targets.length!==1||!studiedAdvantage(actor,targets[0]))return;
 let disadvantage=config.disadvantage===true;config.advantage=true;for(const roll of config.rolls??[]){roll.options??={};const dis=config.disadvantage===true||roll.options.disadvantage===true||roll.options.advantageMode===-1;disadvantage ||= dis;Object.assign(roll.options,{advantage:true,disadvantage:dis,advantageMode:dis?0:1});}
 dialog.options??={};dialog.options.defaultButton=disadvantage?"normal":"advantage";
}
export function prepareStudiedButtons(app,context){const dialog={options:{}};studiedDefaults(app.config,dialog,app.message);const selected=dialog.options.defaultButton;if(selected)for(const key of ['advantage','normal','disadvantage'])if(context.buttons?.[key])context.buttons[key].default=key===selected;return selected;}
export async function expireStudied(combat,changes={}){
 if(!authority()||!('turn'in changes||'round'in changes||changes.started===false))return;
 const actors=changes.started===false?values(combat.combatants).map(c=>c.actor):[combat.combatants.get(combat.previous?.combatantId)?.actor];
 for(const actor of new Set(actors.filter(Boolean))){const ids=values(actor.effects).filter(e=>{const m=marker(e);if(!m)return false;if(changes.started===false)return !m.applied||m.applied.combat===combat.id;
  const previous=combat.previous;if(!previous||previous.round===combat.round&&previous.turn===combat.turn)return false;return !m.applied||m.applied.combat===combat.id&&(previous.round>m.applied.round||previous.round===m.applied.round&&previous.turn>m.applied.turn);
 }).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);}
}
function studiedInputSignature(card){return JSON.stringify({rolls:values(card.rolls).map(r=>r.toJSON?.()??r),targets:card.system?.targets});}
export function shouldProcessStudiedUpdate(card,changes){return studiedInputChanged(changes)&&lastInputs.get(card)!==studiedInputSignature(card);}
export function studiedInputChanged(changes={}){
 // Effect bookkeeping and render/DSN flags must not reinterpret an old attack.
 // Only an actual reroll/mode correction or explicit retarget changes its grant.
 return Object.hasOwn(changes,"rolls")||Object.hasOwn(changes,"system.targets")||Object.hasOwn(changes.system??{},"targets");
}
function report(error){console.error("Studied Attacks",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"studiedAttacksAutomation",{name:"Studied Attacks Assistance",hint:"A missed attack grants target-specific Advantage on your next attack against that creature, expiring at the end of your next turn. Consumes on a committed attack, including one whose Advantage is cancelled by Disadvantage.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerStudiedRule(usageRules));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationStudied={prepareStudiedButtons};registerStudiedRule();Hooks.on("dnd5e.preRollAttackV2",studiedDefaults);Hooks.on("preCreateChatMessage",recordStudiedAttack);
 Hooks.on("createChatMessage",card=>{if(card?.type==='attack')syncStudiedAttack(card).catch(report);});
 Hooks.on("updateChatMessage",(card,changes)=>{if(card?.type==='attack'&&shouldProcessStudiedUpdate(card,changes))syncStudiedAttack(card).catch(report);});
 Hooks.on("updateCombat",(c,d)=>expireStudied(c,d).catch(report));Hooks.on("deleteCombat",c=>expireStudied(c,{started:false}).catch(report));
});
