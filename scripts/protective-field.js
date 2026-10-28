import {createEventQueue,isRollAdjustmentLocked,isHealingCard} from "./shared-activity-card.js";
import {psiWarriorResource} from "./psionic-strike.js";
import {reactionUsed,recordReactionUse} from "./reaction-tracker.js";
import {flashRange} from "./flash-of-genius.js";
import {seekingSnapshot} from "./seeking-spell.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=c=>Array.from(c?.values?.()??c??[]),unable=a=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>a.statuses?.has(s));
const origin=c=>typeof c?.system?.origin==="string"?game.messages.get(c.system.origin.replace(/^ChatMessage\./,"")):c?.system?.origin;
export function fieldFriendly(source,target){
 const a=source?.document??source,b=target?.document??target;if(!a?.actor||!b?.actor)return false;if(a.actor.uuid===b.actor.uuid)return true;
 const disposition=Number(a.disposition),recipient=Number(b.disposition);return Number.isFinite(disposition)&&disposition!==0&&disposition===recipient;
}
export function fieldCandidates(card,user=game.user){
 if(game.settings.get(ID,"protectiveFieldAutomation")!==true||card?.type!=="damage"||isHealingCard(card)||card.getFlag?.(ID,"pendingDamage")||card.getFlag?.(ID,"protectiveFieldPending")||card.getFlag?.(ID,"deflectPending")||isRollAdjustmentLocked(card)||!card.rolls?.length||card.rolls.some(r=>!r._evaluated)||!card.rolls.some(r=>r.total>0))return [];
 const entries=[],seen=new Set(),records=card.getFlag?.(ID,"protectiveFields")??[];
 for(const descriptor of card.system?.targets??[]){const target=globalThis.fromUuidSync?.(descriptor.token,{strict:false});if(!target?.actor)continue;
  const onSave=card.system?.onSave,outcome=origin(card)?.system?.outcomes?.get(target.uuid);if(onSave&&(!['success','failure'].includes(outcome)||outcome==='success'&&onSave==='none'))continue;
  for(const token of values(target.parent?.tokens??globalThis.canvas?.scene?.tokens)){
   const actor=token.actor;if(!actor||!fieldFriendly(token,target)||seen.has(actor.uuid+':'+target.uuid)||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||unable(actor)||actor.statuses?.has("blinded")&&actor.uuid!==target.actor.uuid||reactionUsed(actor)||!flashRange(token,target))continue;
   const resource=psiWarriorResource(actor),reaction=values(resource?.system?.activities).find(a=>a.id==='IasIclPwvvEjwvzf'||a.name==='Protective Field'),formula=reaction?.healing?.custom?.formula;
   const remaining=Number(resource?.system?.uses?.value??Number(resource?.system?.uses?.max)-Number(resource?.system?.uses?.spent??0));
   if(!reaction||!formula||remaining<1||!Number.isFinite(remaining)||records.some(r=>r.actor===actor.uuid&&r.target===target.uuid))continue;
   seen.add(actor.uuid+':'+target.uuid);entries.push({actor,token,target,resource,reaction,formula});
  }
 }return entries;
}
export function fieldReduction(card,actor,uuid){return values(card?.getFlag?.(ID,"protectiveFields")).filter(r=>r.targetActor===actor?.uuid&&(!uuid||r.target===uuid)).reduce((n,r)=>n+(r.kind==="deflect"?Math.max(0,Number(r.total)||0):Math.max(1,Number(r.total)||1)),0);}
export function reduceFieldDamage(actor,damages,options={}){
 const ref=options.originatingMessage??options.origin,card=typeof ref==='string'?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
 if(!card||options.rsaUndoDamage||Number(options.multiplier??1)<=0)return;
 let left=fieldReduction(card,actor,options.rsaProtectiveFieldTarget);if(!left)return;
 // Apply the flat reduction to this recipient's damage descriptions before
 // native resistance/vulnerability calculations. Never alter the shared rolls.
 for(const damage of damages){if(['healing','temphp','maximum'].includes(damage.type)||damage.value<=0)continue;const reduction=Math.min(damage.value,left);damage.value-=reduction;left-=reduction;if(left<=0)break;}
}
export function applyField(card,actorUuid,targetUuid,user=game.user){return enqueue(async()=>{
 let c=fieldCandidates(card,user).find(e=>e.actor.uuid===actorUuid&&e.target.uuid===targetUuid);if(!c)throw Error("Protective Field needs unapplied damage, a visible recipient within 30 feet, an Energy Die and a Reaction.");
 const before=seekingSnapshot(card),spent=Number(c.resource.system.uses.spent??0);let charged=false,committed=false,marker;
 try{
  await card.setFlag(ID,"protectiveFieldPending",{actor:actorUuid,target:targetUuid});
  const roll=await new CONFIG.Dice.BasicRoll(c.formula,c.actor.getRollData?.()??{}).evaluate();
  if(seekingSnapshot(card)!==before||isRollAdjustmentLocked(card)||reactionUsed(c.actor)||Number(c.resource.system.uses.spent??0)!==spent||!flashRange(c.token,c.target)||!fieldFriendly(c.token,c.target)||unable(c.actor))throw Error("Protective Field’s damage or eligibility changed.");
  await c.resource.update({"system.uses.spent":spent+1});charged=true;marker=await recordReactionUse(c.reaction,{}, {message:{id:card.id}});
  const tracked=game.settings.get(ID,"reactionTracker")===true&&game.combat?.started&&values(game.combat.combatants).some(x=>x.actor?.uuid===actorUuid);if(tracked&&marker?.getFlag?.(ID,"reactionUsage")!==card.id)throw Error("Could not reserve the Fighter’s Reaction.");
  if(game.dice3d?.showForRoll){const animation=game.dice3d.showForRoll(roll,user,true,card.whisper?.length?card.whisper:null,card.blind??false,card.id,card.speaker);await(globalThis.Ugmuls55eAutomationWaitForAnimation?.(animation)??animation);
   // The local DSN promise only covers the GM. The reduction is shown under
   // this card ID on every client; wait for their tracked queues as well.
   await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  }
  if(seekingSnapshot(card)!==before||isRollAdjustmentLocked(card)||!fieldFriendly(c.token,c.target))throw Error("The damage or recipient changed during Protective Field.");
  const record={actor:actorUuid,name:c.actor.name,target:targetUuid,targetActor:c.target.actor.uuid,targetName:c.target.name,total:Math.max(1,Number(roll.total)||1),formula:roll.formula??c.formula};
  await card.setFlag(ID,"protectiveFields",[...(card.getFlag(ID,"protectiveFields")??[]),record]);committed=true;return record;
 }catch(error){if(charged&&!committed)await c.resource.update({"system.uses.spent":Math.max(0,Number(c.resource.system.uses.spent??0)-1)});if(!committed&&marker?.getFlag?.(ID,"reactionUsage")===card.id)await marker.update({disabled:true});throw error;}
 finally{await card.unsetFlag(ID,"protectiveFieldPending");globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
});}
export function installFieldDamage(Type=globalThis.customElements?.get('damage-application')){
 const p=Type?.prototype;if(!p?.getMergedOptions||p.rsaProtectiveField)return;const get=p.getMergedOptions,apply=p._onApplyDamage;
 p.getMergedOptions=function(uuid){return {...get.call(this,uuid),rsaProtectiveFieldTarget:uuid};};
 if(apply)p._onApplyDamage=function(event){if((this.chatMessage?.getFlag?.(ID,"protectiveFieldPending")||this.chatMessage?.getFlag?.(ID,"deflectPending"))){ui.notifications.warn("Wait for the damage reduction to finish rolling.");return;}return apply.call(this,event);};p.rsaProtectiveField=true;
}
function report(error){console.error('Protective Field',error);ui.notifications.error(error.message);}
export function fieldBreakdown(card){
 const total=(card?.rolls??[]).reduce((sum,roll)=>['healing','temphp','maximum'].includes(roll.options?.type)?sum:sum+Math.max(0,Number(roll.total)||0),0),groups=new Map();
 for(const record of card?.getFlag?.(ID,'protectiveFields')??[]){const key=record.target+":"+(record.label??"Protective Field");let group=groups.get(key);if(!group)groups.set(key,group={target:record.target,name:record.targetName,reduction:0,...(record.label?{label:record.label}:{})});group.reduction+=record.kind==="deflect"?Math.max(0,Number(record.total)||0):Math.max(1,Number(record.total)||1);}
 const remaining=new Map();return Array.from(groups.values(),g=>{const left=remaining.get(g.target)??total,reduction=Math.min(left,g.reduction);remaining.set(g.target,left-reduction);return {...g,reduction};});
}
export function fieldDisplayTotal(card,total){
 const rows=fieldBreakdown(card),targets=card.system?.targets??[];if(!rows.length||!targets.length)return total;
 const reductions=targets.map(t=>rows.filter(r=>r.target===t.token).reduce((n,r)=>n+r.reduction,0));
 // A shared area roll has no single adjusted total when recipients differ.
 return reductions.every(n=>n===reductions[0])?Math.max(0,total-reductions[0]):total;
}
export function renderFieldTotal(card,node){
 if(card.isContentVisible===false)return;const summary=node.matches?.('.card-summary[data-message-id]')?node:null;
 for(const total of node.querySelectorAll('button.dice-roll .result > strong.total')){
  if((total.closest?.('.card-summary[data-message-id]')??null)!==summary)continue;
  const base=Number(total.dataset.rsaFieldOriginalTotal??total.textContent);if(!Number.isFinite(base))continue;
  const adjusted=fieldDisplayTotal(card,base);if(adjusted!==base||total.dataset.rsaFieldOriginalTotal!==undefined){total.dataset.rsaFieldOriginalTotal=String(base);total.textContent=String(adjusted);}
 }
}
export function renderFieldBreakdown(card,node){
 const summary=node.matches?.('.card-summary[data-message-id]')?node:null;
 for(const tooltip of node.querySelectorAll('.dice-tooltip')){
  if((tooltip.closest?.('.card-summary[data-message-id]')??null)!==summary)continue;
  tooltip.querySelectorAll('.rsa-field-breakdown').forEach(n=>n.remove());if(card.isContentVisible===false)continue;
  for(const record of fieldBreakdown(card)){
   const section=document.createElement('section');section.className='tooltip-part rsa-field-breakdown';
   const dice=document.createElement('div');dice.className='dice';const rolls=document.createElement('ol');rolls.className='dice-rolls';const amount=document.createElement('li');amount.className='constant';amount.textContent='−'+record.reduction;rolls.append(amount);
   const total=document.createElement('div');total.className='total';const label=document.createElement('span');label.className='label';label.textContent=(record.label??'Protective Field')+((card.system?.targets?.length??0)>1?' — '+record.name:'');label.dataset.tooltip='Reduction for '+record.name+' only, before multipliers and resistances.';
   const value=document.createElement('span');value.className='value';value.textContent='−'+record.reduction;total.append(label,value);dice.append(rolls,total);section.append(dice);tooltip.append(section);
  }
 }
}
export function renderField(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;const entries=[{card:message,node:root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){renderFieldTotal(card,node);renderFieldBreakdown(card,node);node.querySelectorAll(':scope > .rsa-protective-field').forEach(n=>n.remove());if(card.isContentVisible===false)continue;const candidates=fieldCandidates(card),records=(card.getFlag?.(ID,'protectiveFields')??[]).filter(r=>r.kind!=="deflect");if(!candidates.length&&!records.length)continue;
 const controls=document.createElement('div');controls.className='rsa-attack-actions rsa-protective-field';for(const c of candidates){const button=document.createElement('button');button.type='button';button.textContent='Protective Field';button.dataset.tooltip=c.actor.name+' → '+c.target.name;button.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();button.disabled=true;try{const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'protectiveField',card:card.id,actor:c.actor.uuid,target:c.target.uuid,user:game.user.id,gm:gm.id});else await applyField(card,c.actor.uuid,c.target.uuid);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});controls.append(button);}
 for(const r of records){const note=document.createElement('span');note.textContent='Protective Field: −'+r.total+' to '+r.targetName+' ('+r.name+')';controls.append(note);}node.append(controls);
 }
}
Hooks.once('init',()=>game.settings.register(ID,'protectiveFieldAutomation',{name:'Protective Field Assistance',hint:'Offer Protective Field on incoming damage cards for self or visible creatures within 30 feet. Spend one Fighter Energy Die and Reaction; reduce only that recipient’s damage before native resistances. Undo HP application before using it.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 installFieldDamage();Hooks.on('dnd5e.preCalculateDamage',reduceFieldDamage);Hooks.on('dnd5e.renderChatMessage',renderField);
 for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect','updateItem','deleteItem','updateCombat'])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request('protectiveField',doc,changes));
 game.socket.on('module.'+ID,packet=>{if(packet?.action==='protectiveFieldError'&&packet.user===game.user.id){ui.notifications.error(packet.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(packet.card));return;}
 if(packet?.action!=='protectiveField'||!game.user.isGM||game.users.activeGM?.id!==game.user.id||packet.gm!==game.user.id)return;const user=game.users.get(packet.user),card=game.messages.get(packet.card);if(!user?.active||!card)return;applyField(card,packet.actor,packet.target,user).catch(error=>{report(error);game.socket.emit('module.'+ID,{action:'protectiveFieldError',card:card.id,user:user.id,error:error.message});});});
});
