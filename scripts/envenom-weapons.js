const ID='ugmuls-5-5e-automation',values=x=>Array.from(x?.values?.()??x??[]);
export const envenomFeature=actor=>values(actor?.items).find(item=>item.type==='feat'&&item.system?.source?.rules!=='2014'&&((item.identifier??item.system?.identifier)==='envenom-weapons'||/^envenom weapons$/i.test(item.name?.trim()??'')));
export function prepareEnvenomPoison(data,id,actor){
 if(game.settings.get(ID,'envenomWeaponsAutomation')!==true)return null;
 const feature=envenomFeature(actor),activity=values(feature?.system?.activities).find(a=>a.type==='save'&&(a.id==='JCB7zQI08np5YFon'||a.name==='Poison'));
 const native=feature?.toObject(),source=native?.system?.activities?.[activity?.id],save=data.system?.activities?.[id];
 if(!source?.damage?.parts?.length||save?.type!=='save')return null;
 const parts=structuredClone(source.damage.parts);
 // The official 2024 text says 2d6; its shipped activity mistakenly contains 2d8.
 // Correct only that known default and preserve custom formulas/scaling.
 if(activity.id==='JCB7zQI08np5YFon'&&parts.length===1&&!parts[0].custom?.enabled&&Number(parts[0].number)===2&&Number(parts[0].denomination)===8&&!parts[0].bonus)parts[0].denomination=6;
 save.damage={...save.damage,parts:parts.map(p=>({...p,types:['poison']})),onSave:'none',critical:{allow:false}};
 const marker={feature:feature.uuid,activity:id};data.flags??={};data.flags[ID]={...data.flags[ID],envenomPoison:marker};return marker;
}
export async function rollEnvenomDamage(activity,usage,{event=null,dialog}={}){
 const marker=usage?.getFlag?.(ID,'envenomPoison');if(!marker||activity?.id!==marker.activity||!activity.item?.isOwner)return;
 const targets=usage.system?.targets??[],outcomes=targets.map(t=>usage.system.outcomes?.get(t.token));
 if(!outcomes.length||outcomes.some(o=>!['success','failure'].includes(o))||!outcomes.includes('failure'))return;
 if(values(usage.getAssociatedRolls?.('damage')).some(card=>card.rolls?.length&&!card.getFlag?.(ID,'pendingDamage')))return;
 const data=usage.getFlag(ID,'activityOverrideData')??activity.item.toObject();
 const configuration=dialog??globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.('damage',{configure:true})??{configure:true};
 // SaveActivity's native Damage action is fire-and-forget and omits origin.
 // Await the actual roll with the recorded source, targets and helper snapshot.
 return activity.rollDamage({event,isCritical:false},configuration,{data:{system:{origin:usage.id,targets,onSave:'none'},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,envenomPoison:marker,activityOverrideData:data}}}});
}
export function installEnvenomChatActions(Type=CONFIG.DND5E?.activityTypes?.save?.documentClass){
 const p=Type?.prototype;if(!p?.onChatAction||Object.hasOwn(p,'rsaEnvenomChat'))return;
 const action=p.onChatAction;
 p.onChatAction=async function(event,target,message){
  const name=target?.dataset?.action??message?.system?.getButton?.(target)?.action;
  if(name!=='rollDamage'||!message?.getFlag?.(ID,'envenomPoison'))return action.call(this,event,target,message);
  target.disabled=true;try{return await rollEnvenomDamage(this,message,{event});}finally{target.disabled=false;}
 };
 p.rsaEnvenomChat=true;
}
export function envenomRecord(card){
 if(card?.type!=='damage')return null;
 const ref=card.system?.origin,usage=typeof ref==='string'?game.messages.get(ref.replace(/^ChatMessage\./,'')):ref;
 const marker=card.getFlag?.(ID,'envenomPoison')??usage?.getFlag?.(ID,'envenomPoison');if(!marker)return null;
 const activity=card.getAssociatedActivity?.({scaled:true});
 return !activity||activity.id===marker.activity?marker:null;
}
export function installEnvenomResistance(Type=customElements.get('damage-application')){
 const p=Type?.prototype;if(!p?.getMergedOptions||p.rsaEnvenomResistance)return;
 const get=p.getMergedOptions;
 p.getMergedOptions=function(uuid){
  const options=get.call(this,uuid);if(!envenomRecord(this.chatMessage)||options.ignore===true||options.ignore?.resistance===true)return options;
  const resistance=new Set(options.ignore?.resistance||[]);resistance.add('poison');
  return {...options,ignore:{...options.ignore,resistance}};
 };
 p.rsaEnvenomResistance=true;
}
Hooks.once('init',()=>game.settings.register(ID,'envenomWeaponsAutomation',{name:'Envenom Weapons Assistance',hint:'Add the Assassin’s native Envenom damage to initial and recurring Cunning Strike Poison saves. Prompt damage only on failed saves, bypass Poison resistance and preserve immunity. Correct the book activity’s default 2d8 to its stated 2d6 on generated copies.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationEnvenom={prepareEnvenomPoison,rollEnvenomDamage};installEnvenomResistance();installEnvenomChatActions();});
