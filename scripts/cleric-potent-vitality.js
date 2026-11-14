import {createEventQueue,describeTarget,actorClassLevel,nativeActivityVisible} from './shared-activity-card.js';
import {tokenDistance} from './shared-distance.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],enabled=()=>game.settings.get(ID,'clericPotentVitalityAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),owns=(a,u)=>!!u?.active&&(u.isGM||a?.testUserPermission?.(u,'OWNER')),doc=t=>t?.document??t;
const resolve=r=>{try{return typeof r==='string'?(globalThis.fromUuidSync?.(r,{strict:false})??game.messages.get(r.replace(/^ChatMessage\./,''))):r;}catch{return null;}},origin=c=>resolve(c?.system?.origin);
// Resolve the parent's native temporary-HP activity, never a descriptive upgrade item.
// Older actor fixtures may lack class data; retain the owned Improved feature fallback below.
const vitalityHealing=(feature,actor)=>values(feature?.system?.activities).find(a=>a.type==='heal'&&values(a.healing?.types).includes('temphp')&&a.isHidden!==true&&(!Number.isFinite(actorClassLevel(actor,a.visibility?.identifier??'cleric'))||nativeActivityVisible(a,actor)));
const healingId=a=>a?.id??a?._id;
export function potentVitalityFeature(actor){
 const feats=values(actor?.items).filter(i=>i.type==='feat'&&i.system?.source?.rules!=='2014');
 const improved=feats.find(i=>key(i)==='improved-blessed-strikes');
 const level=actorClassLevel(actor,'cleric');
 const native=feats.find(i=>key(i)==='potent-spellcasting'&&values(i.system?.activities).some(a=>a.type==='heal'&&values(a.healing?.types).includes('temphp')));
 if(native){if(!vitalityHealing(native,actor))return null;const minimum=Math.max(14,Number(vitalityHealing(native,actor).visibility?.level?.min)||0);return level?level>=minimum?native:null:improved?native:null;}
 if(!feats.some(i=>key(i)==='blessed-strikes-potent-spellcasting'))return null;
 return improved&&vitalityHealing(improved,actor)?improved:null;
}
export function potentVitalitySource(card){if(!enabled()||card?.type!=='damage'||flag(card,'pendingDamage')||flag(card,'potentVitalitySource'))return null;const activity=card.getAssociatedActivity?.(),item=activity?.item??card.getAssociatedItem?.();if(item?.type!=='spell'||Number(item.system?.level)!==0||!['attack','save','damage'].includes(activity?.type)||!(item.system?.classIdentifier==='cleric'||item.system?.sourceItem==='class:cleric'||item.system?.class?.identifier==='cleric'))return null;
 // Wait for actual HP/temporary-HP loss, including damage on a successful save.
 // Immunity, zero damage, preview rolls and fully undone applications do not qualify.
 if(!values(flag(card,'damageUndoHistory')).some(r=>values(r.changes).some(c=>['value','temp'].includes(c.key)&&Number(c.before)>Number(c.after))))return null;
 let cast=origin(card);for(let i=0;cast?.type==='attack'&&i<3;i++)cast=origin(cast);const actor=card.getAssociatedActor?.()??activity.actor,feature=potentVitalityFeature(actor);if(!cast||cast.type!=='usage'||!feature)return null;return {card,cast,actor,feature,healing:vitalityHealing(feature,actor)};}
function vitalityLink(cast){
 const offer=flag(cast,'potentVitalityOffer');return offer?.source?{...offer,cast:cast.id}:flag(game.messages.get(offer?.card),'potentVitalityPrompt');
}
export function offerPotentVitality(card){
 if(!authority()||!potentVitalitySource(card))return Promise.resolve();
 return enqueue(async()=>{
  const c=potentVitalitySource(card);if(!c)return;
  if(!flag(c.cast,'potentVitalityUsed')){
   const link=vitalityLink(c.cast);
   if(!link||link.source!==card.id||link.feature!==c.feature.uuid||link.activity!==healingId(c.healing))await c.cast.setFlag(ID,'potentVitalityOffer',{source:card.id,actor:c.actor.uuid,feature:c.feature.uuid,activity:healingId(c.healing)});
  }
  globalThis.Ugmuls55eAutomationChatRefresh?.card(c.cast);
 });
}
export function potentVitalityTarget(c,target,user=game.user){if(!target?.actor||!owns(c.actor,user)||!user.isGM&&target.hidden)return false;const token=doc(c.cast.getAssociatedToken?.())??doc(c.actor.token);if(!token||token.parent?.uuid!==target.parent?.uuid)return false;const limit=/^(m|meters?|metres?)$/i.test(token.parent.grid?.units??'ft')?18.288:60;return tokenDistance(token,target)<=limit+1e-7;}
export function usePotentVitality(prompt,targetUuid,user=game.user){return enqueue(async()=>{if(!authority())throw Error('A connected GM is required for Potent Spellcasting.');const legacy=flag(prompt,'potentVitalityPrompt'),link=legacy??vitalityLink(prompt),card=game.messages.get(link?.source),c=potentVitalitySource(card),target=resolve(targetUuid),expected=c&&vitalityLink(c.cast);if(!c||c.cast.id!==link.cast||c.actor.uuid!==link.actor||c.feature.uuid!==link.feature||expected?.source!==card.id||expected?.feature!==c.feature.uuid||link.activity&&link.activity!==healingId(c.healing)||legacy&&flag(c.cast,'potentVitalityOffer')?.card!==prompt.id||!legacy&&prompt.id!==c.cast.id||flag(c.cast,'potentVitalityUsed'))throw Error('Potent Spellcasting is no longer available for this cast.');if(!potentVitalityTarget(c,target,user))throw Error('Target yourself or one creature within 60 feet.');const healing=c.healing,id=healingId(healing),data=c.feature.toObject(),a=data.system.activities[id];if(!a)throw Error('The native Potent Spellcasting healing action is unavailable.');data.name='Potent Spellcasting — Temporary HP';data.system.identifier='rsa-cleric-potent-vitality';data.system.activities={[id]:a};data.effects=[];a.activation={type:'special',override:true};a.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};a.target={override:true,prompt:false,affects:{type:'creature',count:'1'},template:{type:''}};const helper=new CONFIG.Item.documentClass(data,{parent:c.actor});helper.prepareFinalAttributes?.();const targets=[describeTarget(target)],flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,potentVitalitySource:c.cast.id}};let committed=false;await c.cast.setFlag(ID,'potentVitalityUsed',{pending:true,target:target.uuid});try{const native=helper.system.activities.get(id),result=await native.use({consume:false,subsequentActions:false,concentration:{begin:false},create:{measuredTemplate:false}},{configure:false},{data:{system:{targets},flags}});if(!result?.message)throw Error('Potent Spellcasting was canceled.');const rolls=await native.rollDamage({isCritical:false},{configure:false},{data:{system:{origin:result.message.id,targets},flags}});if(!rolls?.length)throw Error('The temporary HP card could not be created.');committed=true;await c.cast.setFlag(ID,'potentVitalityUsed',{usage:result.message.id,target:target.uuid});return rolls;}finally{if(!committed)await c.cast.unsetFlag(ID,'potentVitalityUsed');globalThis.Ugmuls55eAutomationChatRefresh?.card(c.cast);}});}
export function renderPotentVitality(card,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 // Old reminder documents remain in history, but their action now lives on
 // the source roll. Never delete chat documents or write flags during render.
 if(flag(card,'potentVitalityPrompt')){root.hidden=true;return;}
 for(const old of root.querySelectorAll('.rsa-potent-vitality'))old.remove();
 const entries=card.type==='damage'?[{card,node:root}]:[];
 for(const node of root.querySelectorAll('.card-summary[data-message-id]')){const child=game.messages.get(node.dataset.messageId);if(child?.type==='damage'&&!node.hidden)entries.push({card:child,node});}
 const placed=new Set();
 for(const entry of entries){
  const c=potentVitalitySource(entry.card);if(!c||card.visible===false||entry.card.visible===false||card.isContentVisible===false||entry.card.isContentVisible===false||!owns(c.actor,game.user)||flag(c.cast,'potentVitalityUsed')||placed.has(c.cast.id))continue;
  const link=vitalityLink(c.cast);if(link?.source!==entry.card.id||link.feature!==c.feature.uuid||link.activity&&link.activity!==healingId(c.healing))continue;
  placed.add(c.cast.id);
  const group=document.createElement('div');group.className='rsa-attack-actions rsa-potent-vitality';
  const button=document.createElement('button');button.type='button';button.dataset.clericPotentVitality='';button.textContent='Potent Spellcasting — Temporary HP';if(c.feature.img)button.dataset.rsaReactionIcon=c.feature.img;
  button.addEventListener('click',event=>{
   event.preventDefault();event.stopPropagation();if(button.disabled)return;
   const targets=[...new Set(values(game.user.targets).map(t=>doc(t).uuid))];
   if(targets.length!==1||!potentVitalityTarget(c,resolve(targets[0]),game.user)){ui.notifications.warn('Target yourself or one creature within 60 feet.');return;}
   button.disabled=true;const gm=game.users.activeGM;
   if(gm&&gm.id!==game.user.id)game.socket.emit('module.'+ID,{action:'potentVitalityUse',card:c.cast.id,target:targets[0],user:game.user.id,gm:gm.id});
   else usePotentVitality(c.cast,targets[0]).catch(report).finally(()=>globalThis.Ugmuls55eAutomationChatRefresh?.card(c.cast));
  });
  group.append(button);entry.node.append(group);
 }
}
function report(error){console.error('Cleric Potent Spellcasting',error);ui.notifications.warn(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'clericPotentVitalityAutomation',{name:'Cleric: Improved Potent Spellcasting',hint:'After Cleric cantrip damage is applied, offer a temporary HP icon beside its Apply/Undo controls. Target yourself or one creature within 60 feet. One use per cast, with native temporary HP and Apply/Undo.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{Hooks.on('createChatMessage',card=>offerPotentVitality(card).catch(report));Hooks.on('updateChatMessage',(card,change)=>{if(card.type!=='damage'||!(Object.hasOwn(change??{},'flags.'+ID+'.damageUndoHistory')||Object.hasOwn(change?.flags?.[ID]??{},'damageUndoHistory')))return;offerPotentVitality(card).catch(report);});Hooks.on('dnd5e.renderChatMessage',renderPotentVitality);for(const event of ['createItem','updateItem','deleteItem'])Hooks.on(event,item=>{if(enabled()&&['potent-spellcasting','blessed-strikes-potent-spellcasting','improved-blessed-strikes','cleric'].includes(key(item)))globalThis.Ugmuls55eAutomationChatRefresh?.request('potentVitality',item);});game.socket.on('module.'+ID,p=>{if(p?.action==='potentVitalityError'&&p.user===game.user.id){ui.notifications.warn(p.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(p.card));return;}if(p?.action!=='potentVitalityUse'||!authority()||p.gm!==game.user.id)return;const prompt=game.messages.get(p.card),user=game.users.get(p.user);if(prompt&&user?.active)usePotentVitality(prompt,p.target,user).catch(error=>game.socket.emit('module.'+ID,{action:'potentVitalityError',card:prompt.id,user:user.id,error:error.message}));});});
