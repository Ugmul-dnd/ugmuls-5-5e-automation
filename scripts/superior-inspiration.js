import {createEventQueue} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const feature=(actor,id)=>values(actor?.items).find(i=>i.type==='feat'&&key(i)===id&&i.system?.source?.rules!=='2014');
export async function recoverSuperiorInspiration(card){return enqueue(async()=>{
 if(game.settings.get(ID,'superiorInspirationAutomation')!==true||card?.type!=='check'||card.system?.type!=='initiative'||!card.rolls?.some(r=>r._evaluated&&r.d20)||card.getFlag?.(ID,'superiorInspiration'))return;
 const actor=card.getAssociatedActor?.(),gm=game.users.activeGM;
 // The GM processes player initiative too; without a GM, only the owner can mutate their own resource.
 if(gm?game.user.id!==gm.id:!actor?.isOwner)return;
 if(!actor||!card.author?.isGM&&!actor.testUserPermission?.(card.author,'OWNER')||!feature(actor,'superior-inspiration'))return;
 const inspiration=feature(actor,'bardic-inspiration');if(!inspiration)return;
 const max=Number(inspiration.system.uses?.max),spent=Number(inspiration.system.uses?.spent??0),available=Number(inspiration.system.uses?.value??max-spent);
 if(!Number.isFinite(max)||!Number.isFinite(spent)||!Number.isFinite(available)||max<=0||spent<0)return;
 const restored=Math.max(0,Math.min(spent,Math.min(2,max)-available));
 // Record the initiative once, even if no recovery is needed. Updating or rerendering
 // its card must never refill Inspiration after it is subsequently spent.
 await card.setFlag(ID,'superiorInspiration',{actor:actor.uuid,name:actor.name,item:inspiration.uuid,restored});
 try{if(restored>0)await inspiration.update({'system.uses.spent':spent-restored});}
 catch(error){await card.unsetFlag(ID,'superiorInspiration');throw error;}
});}
export function renderSuperiorInspiration(message,html){
 const root=html?.[0]??html;if(!root?.querySelectorAll)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(node=>!node.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){
  for(const old of node.querySelectorAll(':scope > .rsa-superior-inspiration'))old.remove();
  const record=card?.getFlag?.(ID,'superiorInspiration');
  if(card?.type!=='check'||card.system?.type!=='initiative'||card.isContentVisible===false||!record||!(record.restored>0))continue;
  const note=document.createElement('div');note.className='rsa-superior-inspiration';
  note.textContent=(record.name??card.getAssociatedActor?.()?.name??'Bard')+' used Superior Inspiration';
  note.title='Restored '+record.restored+' Bardic Inspiration use'+(record.restored===1?'':'s')+'.';node.append(note);
 }
}
Hooks.once('init',()=>game.settings.register(ID,'superiorInspirationAutomation',{name:'Bard: Superior Inspiration',hint:'When the Bard rolls Initiative, restore expended Bardic Inspiration until two uses are available. Do not reduce higher balances or exceed the native maximum.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{Hooks.on('dnd5e.renderChatMessage',renderSuperiorInspiration);Hooks.on('createChatMessage',card=>recoverSuperiorInspiration(card).catch(error=>{console.error('Superior Inspiration',error);ui.notifications.error('Could not restore Superior Inspiration.');}));});
