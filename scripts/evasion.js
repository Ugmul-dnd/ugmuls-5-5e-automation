import {isHealingCard,isRollAdjustmentLocked,linkedHpCards} from "./shared-activity-card.js";
const ID='ugmuls-5-5e-automation',values=x=>Array.from(x?.values?.()??x??[]);
export const evasionFeature=actor=>values(actor?.items).find(item=>item.type==='feat'&&((item.identifier??item.system?.identifier)==='evasion'||/^evasion$/i.test(item.name?.trim()??'')));
function originOf(card){const ref=card?.system?.origin;return typeof ref==='string'?game.messages.get(ref.replace(/^ChatMessage\./,'')):ref;}
function saveAbility(activity,usage,token){
 const abilities=typeof activity?.save?.ability==='string'?[activity.save.ability]:values(activity?.save?.ability);
 if(abilities.length===1)return abilities[0];
 // Optional save-ability choices must use the actual recorded roll, not assume Dexterity.
 const saves=values(usage?.getAssociatedRolls?.('save')).filter(card=>card.getAssociatedToken?.()?.uuid===token.uuid||card.speaker?.token===token.id&&(!card.speaker.scene||card.speaker.scene===token.parent?.id));
 return saves.sort((a,b)=>(b.timestamp??0)-(a.timestamp??0))[0]?.rolls?.[0]?.options?.ability;
}
export function evasionContext(card,uuid){
 if(game.settings.get(ID,'evasionAutomation')!==true||card?.type!=='damage'||isHealingCard(card)||card.getFlag?.(ID,'pendingDamage'))return null;
 const usage=originOf(card);if(!usage)return null;
 const activity=card.getAssociatedActivity?.({scaled:true})??usage.getAssociatedActivity?.({scaled:true});
 if(activity?.type!=='save'||(card.system?.onSave??activity.damage?.onSave)!=='half')return null;
 const token=globalThis.fromUuidSync?.(uuid,{strict:false}),actor=token?.actor;
 if(!actor||!evasionFeature(actor)||['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(status=>actor.statuses?.has(status)))return null;
 const targets=card.system?.targets?.length?card.system.targets:usage.system?.targets??[];
 if(!targets.some(t=>t.token===uuid)||saveAbility(activity,usage,token)!=='dex')return null;
 const outcome=usage.system?.outcomes?.get(uuid);if(!['success','failure'].includes(outcome))return null;
 return {actor,token,outcome,multiplier:outcome==='success'?0:0.5};
}
export function installEvasionDamage(Type=customElements.get('damage-application')){
 const p=Type?.prototype;if(!p?.getMergedOptions||p.rsaEvasion)return;
 const get=p.getMergedOptions,states=new WeakMap();
 p.getMergedOptions=function(uuid){
  let targets=states.get(this);if(!targets)states.set(this,targets=new Map());
  const previous=targets.get(uuid),targetOptions=this.getTargetOptions?.(uuid);
  // Applied damage stays locked; Undo makes eligibility/outcome changes effective again.
  if(previous&&isRollAdjustmentLocked(this.chatMessage))return get.call(this,uuid);
  const evasion=evasionContext(this.chatMessage,uuid);
  if(evasion){
   if(!previous)targets.set(uuid,{before:targetOptions?.multiplier,forced:evasion.multiplier});else previous.forced=evasion.multiplier;
   if(targetOptions)targetOptions.multiplier=evasion.multiplier;
  }else if(previous){
   if(targetOptions?.multiplier===previous.forced){if(previous.before===undefined)delete targetOptions.multiplier;else targetOptions.multiplier=previous.before;}
   targets.delete(uuid);
  }
  const options=get.call(this,uuid);
  // Replace the save multiplier, rather than multiplying the normal save reduction again.
  return evasion?{...options,multiplier:evasion.multiplier}:options;
 };
 p.rsaEvasion=true;
}
export function renderEvasionSaveLabels(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 root.querySelectorAll('[data-rsa-evasion-save]').forEach(el=>el.remove());
 if(game.settings.get(ID,'evasionAutomation')!==true)return;
 for(const name of root.querySelectorAll('.save-summary .pill.target')){
  const summary=name.closest('.card-summary[data-message-id]'),card=summary?game.messages.get(summary.dataset.messageId):message;
  if(!card||card.isContentVisible===false)continue;
  const usage=card.type==='usage'?card:originOf(card),activity=card.getAssociatedActivity?.({scaled:true})??usage?.getAssociatedActivity?.({scaled:true});
  if(activity?.type!=='save'||activity.damage?.onSave!=='half')continue;
  const row=name.closest('[data-target-uuid]'),ref=row?.dataset.targetUuid;
  const speaker=card.type==='save'?card.speaker:null;
  const token=ref?globalThis.fromUuidSync?.(ref,{strict:false}):speaker?.scene&&speaker?.token?globalThis.fromUuidSync?.('Scene.'+speaker.scene+'.Token.'+speaker.token,{strict:false}):card.type==='save'?card.getAssociatedToken?.():null;
  const doc=token?.document??token;if(!doc?.actor||!evasionFeature(doc.actor)||saveAbility(activity,usage,doc)!=='dex')continue;
  const inactive=['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(status=>doc.actor.statuses?.has(status));
  const label=document.createElement('span');label.dataset.rsaEvasionSave='';label.textContent=inactive?' (Evasion inactive)':' (Evasion)';
  label.title=inactive?'Evasion does not apply while Incapacitated.':'Evasion: no damage on a successful save; half on failure.';
  name.append(label);
 }
}
export function renderEvasion(message,html){
 // Pending rows may be added by later chat-render hooks in the same dispatch.
 queueMicrotask(()=>renderEvasionSaveLabels(message,html));
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),root:node})).filter(e=>e.card&&!e.root.hidden)];
 for(const {card,root:node}of entries){
  node.querySelectorAll(':scope > .rsa-evasion-summary').forEach(el=>el.remove());if(card.isContentVisible===false||card.type!=='damage')continue;
  const entries=(card.system?.targets??[]).map(t=>evasionContext(card,t.token)).filter(Boolean);if(!entries.length)continue;
  // Collapsed/grouped chat trays may not have run their connectedCallback yet.
  // Native recorded-target build events refresh the multiplier once the list exists.
  for(const tray of node.querySelectorAll('damage-application'))if(tray.targetList?.querySelectorAll)tray.refreshMultiplier?.();
  const note=document.createElement('div');note.className='rsa-evasion-summary';note.style.cssText='padding:4px 8px;font-size:0.85em;';note.textContent=entries.map(e=>'Evasion: '+e.actor.name+' — '+(e.multiplier===0?'no damage':'half damage')).join(' · ');node.append(note);
 }
}
function refreshSaveDamage(card){
 if(card?.type!=='save'||game.settings.get(ID,'evasionAutomation')!==true)return;
 const usage=originOf(card);
 if(!(usage?.system?.targets??[]).some(t=>evasionFeature(globalThis.fromUuidSync?.(t.token,{strict:false})?.actor)))return;
 for(const damage of linkedHpCards(card))globalThis.Ugmuls55eAutomationChatRefresh?.card(damage);
}
Hooks.once('init',()=>game.settings.register(ID,'evasionAutomation',{name:'Evasion Assistance',hint:'For any actor with Evasion, force no damage on successful Dexterity half-damage saves and half damage on failure. Applies per target, excludes Incapacitated actors and leaves other saving throws unchanged.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 installEvasionDamage();Hooks.on('dnd5e.renderChatMessage',renderEvasion);
 for(const event of ['createChatMessage','updateChatMessage','deleteChatMessage'])Hooks.on(event,refreshSaveDamage);
 for(const event of ['createActiveEffect','updateActiveEffect','deleteActiveEffect','updateItem','deleteItem'])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request('evasion',doc,changes));
});
