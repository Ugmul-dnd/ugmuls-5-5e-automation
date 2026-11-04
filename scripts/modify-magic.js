import {createEventQueue,isRollAdjustmentLocked,linkedHpCards,describeTarget} from './shared-activity-card.js';
import {subtractCuttingWords} from './cutting-words.js';
import {omenRollSnapshot} from './cosmic-omen.js';
const ID='ugmuls-5-5e-automation',FORT='ZR5vb5qEtDJMKLE6',TEN='1zzz89hBFGmH3XRl',enqueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,'modifyMagicAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),owns=(a,u)=>!!u?.active&&(u.isGM||a?.testUserPermission?.(u,'OWNER'));
const resolve=r=>{try{return typeof r==='string'?(globalThis.fromUuidSync?.(r,{strict:false})??game.messages.get(r.replace(/^ChatMessage\./,''))):r;}catch{return null;}},doc=t=>t?.document??t;
const visible=(c,u)=>c?.isContentVisible!==false&&(u?.isGM||!c.blind&&(!c.whisper?.length||c.author?.id===u?.id||c.whisper.some(w=>(w.id??w)===u?.id)));
const unable=a=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>a?.statuses?.has(s));
export const modifyFeature=a=>values(a?.items).find(i=>i.type==='feat'&&key(i)==='modify-magic'&&i.system?.source?.rules!=='2014');
export function modifySource(card,user=game.user,{capture=false,presentation=false}={}){
 if(!enabled()||!visible(card,user))return null;
 const cast=card?.type==='usage'?card:resolve(card?.system?.origin);if(cast?.type!=='usage'||!visible(cast,user))return null;
 const activity=cast.getAssociatedActivity?.(),item=activity?.item??cast.getAssociatedItem?.(),actor=activity?.actor??cast.getAssociatedActor?.(),feature=modifyFeature(actor);
 const resource=values(actor?.items).find(i=>key(i)==='channel-divinity'&&i.system?.source?.rules!=='2014');
 const snapshot=flag(cast,'modifyMagicSnapshot');
 if(!capture&&(!snapshot?.eligible||snapshot.actor!==actor?.uuid||snapshot.feature!==feature?.uuid||snapshot.resource!==resource?.uuid))return null;
 if(item?.type!=='spell'||!feature||!resource||!owns(actor,user)||!presentation&&unable(actor)||!capture&&flag(cast,'targetsConfirmationPending')||flag(cast,'targetsConfirmationCanceled')||flag(cast,'modifyMagicUsed')||flag(cast,'modifyMagicPending'))return null;
 const remaining=Number(resource.system?.uses?.value??(Number(resource.system?.uses?.max)-Number(resource.system?.uses?.spent??0)));
 if(!presentation&&(!Number.isFinite(remaining)||remaining<1))return null;
 return {cast,actor,feature,resource};
}
function activityOf(c,id){return values(c.feature.system?.activities).find(a=>(a.id??a._id)===id);}
export function fortifyingTargets(c,user=game.user){
 const allowed=flag(c.cast,'modifyMagicSnapshot')?.fortifying??[];
 return values(c.cast.system?.targets).map(t=>resolve(t.token)).filter(t=>t?.actor&&allowed.includes(t.uuid)&&(user.isGM||!t.hidden));
}
export function tenaciousEligible(card,index=0,user=game.user,{capture=false,presentation=false}={}){
 const c=modifySource(card,user,{presentation:presentation||capture}),roll=card?.rolls?.[index];if(!c||card.type!=='save'||!Number.isInteger(index)||index<0||!roll?._evaluated||!roll.d20||isRollAdjustmentLocked(card)||!activityOf(c,TEN)?.roll?.formula)return null;
 if(!capture&&!flag(card,'modifyMagicSaveSnapshot')?.indexes?.includes(index))return null;
 const dc=roll.options?.target;if(dc===null||dc===undefined||!String(dc).trim()||!Number.isFinite(Number(dc))||Number(roll.total)<Number(dc))return null;
 const target=doc(card.getAssociatedToken?.());
 if(!target?.actor||!flag(c.cast,'modifyMagicSnapshot')?.tenacious?.includes(target.uuid))return null;
 if(!values(c.cast.system?.targets).some(t=>t.token===target.uuid||t.actor===target.actor.uuid))return null;
 // Only the target's first save against this cast qualifies, never repeat saves.
 if(index!==0||values(c.cast.getAssociatedRolls?.('save')).some(s=>s.id!==card.id&&s.getAssociatedActor?.()?.uuid===target.actor.uuid&&(s.timestamp<card.timestamp||s.timestamp===card.timestamp&&s.id<card.id)))return null;
 return c;
}
export function modifyCastSnapshot(card){
 const c=modifySource(card,game.user,{capture:true});if(!c)return {eligible:false};
 const source=doc(card.getAssociatedToken?.())??doc(c.actor.token),fortifying=[],tenacious=[];
 // Snapshot scene relationships once, including targets chosen by pending area confirmation.
 const tokens=new Map([...values(source?.parent?.tokens),...values(card.system?.targets).map(t=>resolve(t.token))].filter(Boolean).map(t=>[t.uuid,t]));
 for(const target of tokens.values()){
  if(!target.actor)continue;
  if(target.actor.uuid===c.actor.uuid||source&&Number.isFinite(source.disposition)&&source.disposition!==0&&target.disposition===source.disposition)fortifying.push(target.uuid);
  if(!source||source.parent?.uuid!==target.parent?.uuid||!(Number(source.disposition)*Number(target.disposition)<0)||target.hidden||target.object?.isVisible===false||c.actor.statuses?.has('blinded')||!source.object?.center||!target.object?.center)continue;
  const a=values(source.levels),b=values(target.levels);if(a.length&&b.length&&!a.some(l=>b.includes(l))||source.object.checkCollision?.(target.object.center,{type:'sight',mode:'any'}))continue;
  tenacious.push(target.uuid);
 }
 return {eligible:true,actor:c.actor.uuid,feature:c.feature.uuid,resource:c.resource.uuid,fortifying:activityOf(c,FORT)?fortifying:[],tenacious:activityOf(c,TEN)?.roll?.formula?tenacious:[]};
}
export function snapshotModifyMagic(card){
 // Creation only: never backfill old history from render, resource or character updates.
 if(card.type==='usage')card.updateSource({['flags.'+ID+'.modifyMagicSnapshot']:modifyCastSnapshot(card)});
 if(card.type==='save')card.updateSource({['flags.'+ID+'.modifyMagicSaveSnapshot']:{indexes:tenaciousEligible(card,0,game.user,{capture:true})?[0]:[]}});
}
function refresh(card,cast){for(const c of [card,cast,...values(cast?.getAssociatedRolls?.('save')),...linkedHpCards(card)])globalThis.Ugmuls55eAutomationChatRefresh?.card(c);}
export function useModifyMagic(card,mode,index=0,targetUuid=null,user=game.user){return enqueue(async()=>{
 if(!authority())throw Error('A connected GM is required for Modify Magic.');
 let c=mode==='tenacious'?tenaciousEligible(card,index,user):mode==='fortifying'&&card?.type==='usage'?modifySource(card,user):null;
 if(!c)throw Error('Modify Magic is unavailable. Undo applied damage/effects before changing a save.');
 const native=activityOf(c,mode==='tenacious'?TEN:FORT),target=mode==='fortifying'?fortifyingTargets(c,user).find(t=>t.uuid===targetUuid):null;
 if(!native||mode==='fortifying'&&!target)throw Error('Target exactly one friendly recorded target of this spell.');
 const snapshot=omenRollSnapshot(card);let charged=false,committed=false;
 try{
  if(mode==='tenacious'){
   await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
   c=tenaciousEligible(card,index,user);if(!c||omenRollSnapshot(card)!==snapshot)throw Error('The save or resources changed.');
  }
  await c.cast.setFlag(ID,'modifyMagicPending',true);
  const spent=Number(c.resource.system.uses.spent??0);
  await c.resource.update({'system.uses.spent':spent+1});charged=true;
  if(mode==='tenacious'){
   const bonus=await new CONFIG.Dice.BasicRoll(native.roll.formula,c.actor.getRollData?.()??{}).evaluate();
   if(!Number.isFinite(bonus.total))throw Error('Tenacious Spell could not be rolled.');
   const adjusted=await subtractCuttingWords(card.rolls[index],bonus,{flavor:'Tenacious Spell'});
   if(game.dice3d?.showForRoll){const animation=game.dice3d.showForRoll(bonus,user,true,card.whisper?.length?card.whisper:null,card.blind??false,card.id,card.speaker);await(globalThis.Ugmuls55eAutomationWaitForAnimation?.(animation)??animation);}
   if(omenRollSnapshot(card)!==snapshot||isRollAdjustmentLocked(card)||!owns(c.actor,user)||unable(c.actor)||modifyFeature(c.actor)?.uuid!==c.feature.uuid||!values(c.actor.items).includes(c.resource))throw Error('The save or Cleric changed.');
   const rolls=[...card.rolls];rolls[index]=adjusted;
   const skip=card.getFlag?.('dice-so-nice','skip');
   try{await card.update({rolls,['flags.'+ID+'.tenaciousSpell']:{cast:c.cast.id,total:bonus.total,index},'flags.dice-so-nice.skip':true});committed=true;}
   finally{if(skip===undefined)await card.unsetFlag('dice-so-nice','skip');else await card.setFlag('dice-so-nice','skip',skip);}
  }else{
   const data=c.feature.toObject(),a=data.system.activities[FORT];data.system.activities={[FORT]:a};data.effects=[];
   a.activation={type:'special',override:true};a.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};a.target={override:true,prompt:false,affects:{type:'creature',count:'1'},template:{type:''}};
   const helper=new CONFIG.Item.documentClass(data,{parent:c.actor});helper.prepareFinalAttributes?.();
   const healing=helper.system.activities.get(FORT),targets=[describeTarget(target)],flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,modifyMagicSource:c.cast.id}};
   const result=await healing.use({consume:false,subsequentActions:false,concentration:{begin:false},create:{measuredTemplate:false}},{configure:false},{data:{system:{targets},flags}});
   if(!result?.message)throw Error('Fortifying Spell was canceled.');
   const rolls=await healing.rollDamage({isCritical:false},{configure:false},{data:{system:{origin:result.message.id,targets},flags}});
   if(!rolls?.length)throw Error('The temporary HP card could not be created.');committed=true;
  }
  await c.cast.setFlag(ID,'modifyMagicUsed',{mode,card:card.id,target:targetUuid});
 }catch(error){if(charged&&!committed)await c.resource.update({'system.uses.spent':Math.max(0,Number(c.resource.system.uses.spent??0)-1)});throw error;}
 finally{
  // A committed result must never become eligible again if recording its metadata fails.
  if(committed&&!flag(c.cast,'modifyMagicUsed'))await c.cast.setFlag(ID,'modifyMagicUsed',{mode,card:card.id,target:targetUuid});
  await c.cast.unsetFlag(ID,'modifyMagicPending');refresh(card,c.cast);
 }
});}
function request(card,mode,index,target){const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id){game.socket.emit('module.'+ID,{action:'modifyMagic',gm:gm.id,user:game.user.id,card:card.id,mode,index,target});return;}return useModifyMagic(card,mode,index,target);}
export function renderModifyMagic(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){
  for(const old of node.querySelectorAll(':scope > .rsa-modify-magic'))old.remove();
  if(!card||!visible(card,game.user)||!enabled())continue;
  const c=modifySource(card,game.user,{presentation:true}),row=document.createElement('div');row.className='rsa-attack-actions rsa-modify-magic';
  const add=(label,mode,index=0)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.tooltip='Spend one Channel Divinity use; one Modify Magic option per spell.';button.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();let target=null;if(mode==='fortifying'){const selected=values(game.user.targets).map(doc);if(selected.length!==1||!fortifyingTargets(c).some(t=>t.uuid===selected[0].uuid)){ui.notifications.warn('Target exactly one friendly recorded target of this spell.');return;}target=selected[0].uuid;}button.disabled=true;try{await request(card,mode,index,target);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}});row.append(button);};
  if(card.type==='usage'&&c&&activityOf(c,FORT)&&fortifyingTargets(c).length)add('Modify Magic — Fortifying Spell','fortifying');
  for(let i=0;i<(card.rolls?.length??0);i++)if(tenaciousEligible(card,i,game.user,{presentation:true}))add('Modify Magic — Tenacious Spell −1d6','tenacious',i);
  const record=flag(card,'tenaciousSpell');if(record){const label=document.createElement('span');label.textContent='Tenacious Spell: −'+record.total;row.append(label);}
  if(row.childNodes.length)node.append(row);
 }
}
function report(error){console.error('Modify Magic',error);ui.notifications.warn(error.message);}
export function modifyReady(card){const root=card?.type==='usage'?card:resolve(card?.system?.origin);return !flag(root,'modifyMagicPending');}
Hooks.once('init',()=>game.settings.register(ID,'modifyMagicAutomation',{name:'Arcana Cleric: Modify Magic',hint:'Offer native Fortifying Spell on spell usage cards with friendly targets and Tenacious Spell on successful enemy first saves. Require Channel Divinity, recorded spell targets and one option per cast. Preserve native temporary HP Apply/Undo and original save dice.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationModifyMagic={eligible:tenaciousEligible,ready:modifyReady};
 Hooks.on('dnd5e.renderChatMessage',renderModifyMagic);
 Hooks.on('preCreateChatMessage',snapshotModifyMagic);
 game.socket.on('module.'+ID,p=>{if(p?.action==='modifyMagicError'&&p.user===game.user.id){ui.notifications.warn(p.error);globalThis.Ugmuls55eAutomationChatRefresh?.card(game.messages.get(p.card));return;}if(p?.action!=='modifyMagic'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user),card=game.messages.get(p.card);if(user?.active&&card)useModifyMagic(card,p.mode,p.index,p.target,user).catch(error=>game.socket.emit('module.'+ID,{action:'modifyMagicError',user:user.id,card:card.id,error:error.message}));});
});
