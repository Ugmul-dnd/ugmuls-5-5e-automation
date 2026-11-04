const ID='ugmuls-5-5e-automation',running=new Set(),waiting=new Map();
const values=v=>Array.from(v?.values?.()??v??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),live=e=>!!e&&!e.disabled&&!e.isSuppressed&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
export function charmedByBard(effect,bard){
 if(!live(effect)||!values(effect.statuses).includes('charmed'))return false;
 const origin=effect.system?.origin??{},source=effect.getSourceActor?.()??resolve(origin.actor),direct=source?.actor??source;
 if(direct?.uuid)return direct.uuid===bard.uuid;
 for(const ref of [origin.activity,origin.item,effect.origin]){const d=resolve(ref),actor=d?.actor??d?.item?.actor??(d?.documentName==='Actor'?d:null);if(actor?.uuid)return actor.uuid===bard.uuid;}
 return false;
}
export function majestyCharmTargets(actor,targets){return targets.flatMap(t=>{const token=resolve(t.token),effect=values(token?.actor?.appliedEffects??token?.actor?.effects).find(e=>charmedByBard(e,actor));return effect?[{token:token.uuid,actor:token.actor.uuid,effect:effect.uuid}]:[];});}
export function majestyFailureEligible(card,token){
 if(game.settings.get(ID,'mantleMajestyAutomation')!==true||card?.type!=='usage'||card.getFlag?.(ID,'targetsConfirmationPending')||card.getFlag?.(ID,'targetsConfirmationCanceled'))return false;
 const meta=flag(card,'majestyCommand'),activity=card.getAssociatedActivity?.({scaled:true}),actor=card.getAssociatedActor?.()??activity?.actor;
 if(!meta?.free||activity?.type!=='save'||(activity.item?.identifier??activity.item?.system?.identifier)!=='command'||activity.activation?.type!=='bonus'||!actor||!token?.actor||!values(card.system?.targets).some(t=>t.token===token.uuid))return false;
 const entry=meta.charmed?.find(t=>t.token===token.uuid&&t.actor===token.actor.uuid);if(!entry)return false;
 return values(token.actor.appliedEffects??token.actor.effects).some(e=>e.uuid===entry.effect&&charmedByBard(e,actor));
}
export async function applyMajestyFailure(card,token,user=game.user){
 if(!authority()||!user?.active||!(user.isGM||card?.author?.id===user.id||token?.actor?.testUserPermission?.(user,'OWNER')))throw Error('A connected GM must resolve Mantle of Majesty’s automatic save failure.');
 if(!majestyFailureEligible(card,token))return false;if(card.system.outcomes?.has(token.uuid))return true;
 const key=card.id+':'+token.uuid;if(running.has(key))return true;running.add(key);
 try{
  const activity=card.getAssociatedActivity({scaled:true}),dc=Number(activity.save?.dc?.value),ability=typeof activity.save?.ability==='string'?activity.save.ability:values(activity.save?.ability)[0];if(!Number.isFinite(dc)||!ability)throw Error('Mantle of Majesty needs Command’s native save DC and ability.');
  // Use the existing fixed-result D20Roll pattern for automatic saves. No die
  // is rolled, so inspiration, mode adjustments and reroll controls cannot change it.
  const roll=await new CONFIG.Dice.D20Roll(String(dc-1),{},{target:dc}).evaluate();
  if(!majestyFailureEligible(card,token))return false;
  const result=await ChatMessage.create({type:'save',speaker:ChatMessage.getSpeaker({actor:token.actor,scene:token.parent,token}),flavor:'Mantle of Majesty — Automatic Failure',rolls:[roll],system:{...activity.messageSources,origin:card.id,ability},whisper:card.whisper??[],blind:card.blind??false,flags:{[ID]:{majestyAutomaticFailure:true}}});
  await card.system.onDescendentRefresh?.(result);return true;
 }finally{running.delete(key);}
}
export async function automaticMajestySave(card,token){
 if(!majestyFailureEligible(card,token))return false;
 const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return applyMajestyFailure(card,token);
 const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Mantle of Majesty.'));},10000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'majestyFailure',request,card:card.id,token:token.uuid,user:game.user.id,gm:gm.id});});
}
async function resolveUsage(card){if(!authority()||card?.type!=='usage'||!flag(card,'majestyCommand')?.free)return;for(const t of card.system?.targets??[]){const token=resolve(t.token);if(token&&majestyFailureEligible(card,token))await applyMajestyFailure(card,token);}}
function report(error){console.error('Mantle of Majesty save',error);ui.notifications.error(error.message);}
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationMajesty={automaticSave:automaticMajestySave};
 for(const event of ['createChatMessage','updateChatMessage'])Hooks.on(event,(card,change)=>{if(event==='createChatMessage'||change?.system||Object.keys(change??{}).some(k=>k.startsWith('system.')||k.includes('majestyCommand')||k.includes('targetsConfirmationPending')))resolveUsage(card).catch(report);});
 Hooks.on('dnd5e.preRollSavingThrowV2',(config,dialog,message)=>{const ref=message.data?.system?.origin,card=typeof ref==='string'?game.messages.get(ref.replace(/^ChatMessage\./,'')):ref;if(!flag(card,'majestyCommand')?.free)return;const speaker=message.data?.speaker,targets=values(card.system?.targets).map(t=>resolve(t.token)).filter(t=>t?.actor?.uuid===config.subject?.uuid&&(!speaker?.token||t.id===speaker.token));if(targets.length===1&&majestyFailureEligible(card,targets[0])){automaticMajestySave(card,targets[0]).catch(report);return false;}});
 Hooks.on('dnd5e.renderChatMessage',(message,html)=>{const root=html?.[0]??html;if(!root?.querySelectorAll)return;for(const {card,node}of [{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))])if(flag(card,'majestyAutomaticFailure')&&card.isContentVisible!==false){const total=node.querySelector('.dice-total');if(total)total.textContent='Mantle of Majesty — Failure';}});
 game.socket.on('module.'+ID,p=>{if(p?.action==='majestyFailureReply'&&p.user===game.user.id){const job=waiting.get(p.request);if(!job)return;waiting.delete(p.request);clearTimeout(job.timer);p.error?job.reject(Error(p.error)):job.resolve(p.result);return;}if(p?.action!=='majestyFailure'||!authority()||p.gm!==game.user.id)return;const user=game.users.get(p.user),card=game.messages.get(p.card),token=resolve(p.token);if(!user?.active||!card||!token)return;applyMajestyFailure(card,token,user).then(result=>game.socket.emit('module.'+ID,{action:'majestyFailureReply',request:p.request,user:user.id,result}),error=>game.socket.emit('module.'+ID,{action:'majestyFailureReply',request:p.request,user:user.id,error:error.message}));});
});
