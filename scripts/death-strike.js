import {sneakAttackContext} from "./sneak-attack.js";
const ID='ugmuls-5-5e-automation',creating=new Set(),resolving=new Set(),values=x=>Array.from(x?.values?.()??x??[]);
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),enabled=()=>game.settings.get(ID,'deathStrikeAutomation')===true;
export const deathStrikeFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&((i.identifier??i.system?.identifier)==='death-strike'||/^death strike$/i.test(i.name?.trim()??'')));
const firstRound=actor=>game.combat?.started&&game.combat.round===1&&values(game.combat.combatants).some(c=>c.actor?.uuid===actor?.uuid);
export function recordDeathStrikeAttack(card){if(!enabled()||card.type!=='attack'||!card.rolls?.length)return;const actor=card.getAssociatedActor?.();if(deathStrikeFeature(actor)&&firstRound(actor))card.updateSource({['flags.'+ID+'.deathStrikeAttack']:{round:1,actor:actor.uuid,combat:game.combat.id}});}
export function tagDeathStrike(app,rolls){
 if(!enabled()||app.config?.subject?.type!=='attack'||app.config.subject.item?.type!=='weapon'||app.message?.data?.flags?.[ID]?.masteryGraze)return rolls;
 const sneak=rolls.find(r=>r.options?.rsaSneakAttack);if(!sneak||sneak.options.rsaDeathStrike)return rolls;
 const {attack,targets}=sneakAttackContext(app),actor=app.config.subject.actor??app.config.subject.item?.actor,feature=deathStrikeFeature(actor),record=attack?.getFlag?.(ID,'deathStrikeAttack')??attack?.getFlag?.(ID,'assassinateAttack');
 if(!feature||targets.length!==1||!attack?.system?.evaluatedTargets?.some(t=>t.token===targets[0].token&&t.isMiss===false)||(record?record.round!==1||record.actor!==actor.uuid:!firstRound(actor)))return rolls;
 sneak.options.rsaDeathStrike={actor:actor.uuid,feature:feature.id,attack:attack.id,target:targets[0].token,round:1};return rolls;
}
const jobFor=card=>card?.rolls?.find(r=>r.options?.rsaDeathStrike)?.options.rsaDeathStrike;
function saveFor(card){const id=card?.getFlag?.(ID,'deathStrikeSaveId');return id?game.messages.get(id):null;}
export function deathStrikeReady(card){
 const job=jobFor(card);if(!job)return true;
 const save=saveFor(card),outcome=save?.system?.outcomes?.get(job.target),done=card.getFlag?.(ID,'deathStrikeResolved');
 return !!save&&['success','failure'].includes(outcome)&&done?.save===save.id&&done.outcome===outcome;
}
export async function createDeathStrikeSave(card){
 const job=jobFor(card);if(!authority()||!job||card.type!=='damage'||card.getFlag?.(ID,'pendingDamage')||creating.has(card.id))return;
 const existing=saveFor(card);if(existing)return resolveDeathStrikeSave(existing);
 creating.add(card.id);
 try{
  const actor=await fromUuid(job.actor),target=await fromUuid(job.target),feature=deathStrikeFeature(actor),attack=game.messages.get(job.attack);
  if(!feature||feature.id!==job.feature||card.getAssociatedActor?.()?.uuid!==actor.uuid||(!card.author?.isGM&&!actor.testUserPermission?.(card.author,'OWNER'))||!target?.actor||!(card.system?.targets??[]).some(t=>t.token===job.target)||!attack?.system?.evaluatedTargets?.some(t=>t.token===job.target&&t.isMiss===false))return;
  const round=attack.getFlag?.(ID,'deathStrikeAttack')??attack.getFlag?.(ID,'assassinateAttack');if(job.round!==1||(round?round.round!==1||round.actor!==actor.uuid:!firstRound(actor)))return;
  const source=values(feature.system?.activities).find(a=>a.type==='save');if(!source)throw Error('Death Strike needs its native Constitution save activity.');
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  const data=feature.toObject(),id=source.id,use=data.system.activities[id];data._id=feature.id;data.effects=[];
  use.damage={...use.damage,parts:[],onSave:'none'};use.effects=[];use.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};use.activation={type:'special',override:true};
  use.target={override:true,prompt:false,template:{type:''},affects:{type:'creature',count:'1',choice:false}};
  const helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
  const descriptor=card.system.targets.find(t=>t.token===job.target);
  const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false}},{configure:false},{data:{system:{targets:[descriptor]},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,deathStrikeSave:{damageId:card.id,attack:job.attack,target:job.target}}}}});
  if(!result?.message)throw Error('Could not create the Death Strike save card.');
  await card.setFlag(ID,'deathStrikeSaveId',result.message.id);await resolveDeathStrikeSave(result.message);
 }finally{creating.delete(card.id);}
}
export async function resolveDeathStrikeSave(card){
 const ref=card?.system?.origin,usage=card?.getFlag?.(ID,'deathStrikeSave')?card:typeof ref==='string'?game.messages.get(ref.replace(/^ChatMessage\./,'')):ref;
 const link=usage?.getFlag?.(ID,'deathStrikeSave');if(!authority()||!link||resolving.has(usage.id))return;
 const damage=game.messages.get(link.damageId),outcome=usage.system?.outcomes?.get(link.target);
 if(!damage||damage.getFlag?.(ID,'deathStrikeSaveId')!==usage.id||!['success','failure'].includes(outcome)||deathStrikeReady(damage))return;
 resolving.add(usage.id);
 try{await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(usage);if(usage.system.outcomes.get(link.target)!==outcome)return;
  await damage.setFlag(ID,'deathStrikeResolved',{save:usage.id,outcome});globalThis.Ugmuls55eAutomationChatRefresh?.card(damage);
 }finally{resolving.delete(usage.id);}
}
function halfReaction(card,uuid){const attack=game.messages.get(jobFor(card)?.attack),id=uuid?.split('.').at(-1);return !!(attack?.getFlag?.(ID,'uncannyDodges')?.[id]||attack?.getFlag?.(ID,'elementalRebukes')?.[id]);}
export function deathStrikeFactor(card,uuid){const job=jobFor(card);if(!job||job.target!==uuid||!deathStrikeReady(card))return null;return (card.getFlag(ID,'deathStrikeResolved').outcome==='failure'?2:1)*(halfReaction(card,uuid)?0.5:1);}
export function installDeathStrikeDamage(Type=customElements.get('damage-application')){
 const p=Type?.prototype;if(!p?.getMergedOptions||p.rsaDeathStrike)return;const get=p.getMergedOptions,apply=p._onApplyDamage,states=new WeakMap();
 p.getMergedOptions=function(uuid){
  const factor=deathStrikeFactor(this.chatMessage,uuid);if(factor===null)return get.call(this,uuid);
  let targets=states.get(this);if(!targets)states.set(this,targets=new Map());const signature=this.chatMessage.getFlag(ID,'deathStrikeResolved').outcome+':'+factor;
  if(targets.get(uuid)!==signature){targets.set(uuid,signature);const target=this.getTargetOptions?.(uuid);if(target)target.multiplier=factor;const options=get.call(this,uuid);if(target)target.multiplier=factor;return {...options,multiplier:factor};}
  return get.call(this,uuid);
 };
 if(apply)p._onApplyDamage=function(event){if(!deathStrikeReady(this.chatMessage)){ui.notifications.warn('Resolve the Death Strike save before applying this attack’s damage.');return;}return apply.call(this,event);};
 p.rsaDeathStrike=true;
}
export function renderDeathStrike(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),root:node})).filter(e=>e.card&&!e.root.hidden)];
 for(const {card,root:node}of entries){node.querySelectorAll(':scope > .rsa-death-strike').forEach(el=>el.remove());const job=jobFor(card);if(!job||card.isContentVisible===false)continue;
  for(const tray of node.querySelectorAll('damage-application'))tray.refreshMultiplier?.();
  const note=document.createElement('div');note.className='rsa-death-strike';note.textContent=deathStrikeReady(card)?'Death Strike: '+(card.getFlag(ID,'deathStrikeResolved').outcome==='failure'?'double damage':'normal damage'):'Death Strike: waiting for the Constitution save.';node.append(note);
 }
}
function report(error){console.error('Death Strike',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'deathStrikeAutomation',{name:'Death Strike Assistance',hint:'First-round Sneak Attack hits prompt the native Death Strike Constitution save. Wait for the save and dice animations before applying damage; double the existing attack damage on failure without rolling Sneak Attack again.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationDeathStrike={tagDeathStrike,ready:deathStrikeReady};installDeathStrikeDamage();Hooks.on('preCreateChatMessage',recordDeathStrikeAttack);Hooks.on('dnd5e.renderChatMessage',renderDeathStrike);
 for(const event of ['createChatMessage','updateChatMessage'])Hooks.on(event,card=>{if(jobFor(card))createDeathStrikeSave(card).catch(report);else if(card?.type==='usage'||card?.type==='save')resolveDeathStrikeSave(card).catch(report);});
});
