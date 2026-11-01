const ID='ugmuls-5-5e-automation',BOOK='rhwSSBeastsofIjA';let bridge=false;
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,doc=t=>t?.document??t;
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],enabled=()=>game.settings.get(ID,'beastsIllOmenAutomation')===true;
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
const queues=new Map();
export const omenBeastFeature=a=>values(a?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)==='beasts-of-ill-omen'||i.name?.trim().toLowerCase()==='beasts of ill omen'||[i._stats?.compendiumSource,i._stats?.duplicateSource].some(r=>r?.endsWith('.'+BOOK))));
export const omenBeastSummon=a=>a?.type==='summon'&&a.item?.type==='spell'&&a.item.system?.source?.rules!=='2014'&&(key(a.item)==='summon-beast'||[a.item._stats?.compendiumSource,a.item._stats?.duplicateSource].some(r=>r?.endsWith('.phbsplSummonBeas')));
export function prepareOmenBeast(activity,profile,data){
 if(!enabled()||!omenBeastSummon(activity)||!omenBeastFeature(activity.actor))return;
 data.flags??={};data.flags[ID]??={};data.flags[ID].omenBeast={caster:activity.actor.uuid,item:activity.item.uuid,activity:activity.id};
}
export function omenBeastLink(token){
 const marked=flag(token,'omenBeast'),native=token?.actor?.flags?.dnd5e?.summon;
 if(marked){const caster=resolve(marked.caster),item=resolve(marked.item),activity=item?.system?.activities?.get?.(marked.activity);if(native?.origin!==marked.item||native?.activity!==marked.activity||item&&(!omenBeastSummon(activity)||item.actor?.uuid!==marked.caster))return null;return caster&&omenBeastFeature(caster)?{...marked,casterActor:caster}:null;}
 // Recover existing native summons without changing their source actors or summon lifecycle.
 const item=resolve(native?.origin),activity=item?.system?.activities?.get?.(native?.activity);
 return omenBeastSummon(activity)&&omenBeastFeature(item.actor)?{caster:item.actor.uuid,item:item.uuid,activity:activity.id,casterActor:item.actor}:null;
}
export async function syncOmenBeast(token,{remove=false}={}){
 if(!authority()||!token?.parent)return;const scene=token.parent,link=!remove&&enabled()?omenBeastLink(token):null;
 const regions=values(scene.regions).filter(r=>flag(r,'omenBeastAura')?.token===token.uuid);
 if(!link){if(regions.length)await scene.deleteEmbeddedDocuments('Region',regions.map(r=>r.id));return;}
 const scale=Number(scene.grid?.size)/Number(scene.grid?.distance);if(!(scale>0))return;
 const radius=(/^(m|meters?|metres?)$/i.test(scene.grid.units??'ft')?5*0.3048:5)*scale;
 const levels=values(token.levels);if(!levels.length&&token.level)levels.push(token.level.id??token.level);
 const data={name:'Beasts of Ill Omen — '+token.name,color:game.user.color,shapes:[{type:'emanation',gridBased:true,radius,base:{type:'token',x:token.x,y:token.y,width:token.width,height:token.height,shape:token.shape,rotation:0}}],attachment:{token:token.id},levels,restriction:{enabled:true,type:'move'},visibility:CONST.REGION_VISIBILITY.LAYER_UNLOCKED,highlightMode:'coverage',flags:{[ID]:{omenBeastAura:{token:token.uuid,caster:link.caster,item:link.item}}}};
 if(regions.length>1)await scene.deleteEmbeddedDocuments('Region',regions.slice(1).map(r=>r.id));
 const current=regions[0];if(!current){await scene.createEmbeddedDocuments('Region',[data]);return;}
 const old=values(current.shapes)[0];if(['width','height','shape'].some(k=>old?.base?.[k]!==token[k])||old?.radius!==radius||old?.gridBased!==true||current.attachment?.token!==token.id||flag(current,'omenBeastAura')?.caster!==link.caster||JSON.stringify(values(current.levels).sort())!==JSON.stringify([...levels].sort()))await current.update(data);
}
function schedule(token,options){if(!token?.uuid)return Promise.resolve();const prior=queues.get(token.uuid)??Promise.resolve();const task=prior.catch(()=>{}).then(()=>syncOmenBeast(token,options));queues.set(token.uuid,task);return task.finally(()=>{if(queues.get(token.uuid)===task)queues.delete(token.uuid);});}
function rollToken(actor,card,ref){
 const explicit=doc(resolve(ref));if(ref)return explicit?.actor?.uuid===actor?.uuid?explicit:null;
 const own=doc(actor?.token);if(own?.actor?.uuid===actor?.uuid)return own;
 const targets=values(card?.system?.targets).filter(t=>t.actor===actor?.uuid).map(t=>doc(resolve(t.token))).filter(Boolean);if(targets.length===1)return targets[0];
 const tokens=values(globalThis.canvas?.scene?.tokens).filter(t=>t.actor?.uuid===actor?.uuid);return tokens.length===1?tokens[0]:null;
}
export function omenBeastSave(actor,origin,tokenRef){
 if(!enabled()||!actor||!origin)return false;
 const card=typeof origin==='string'?game.messages.get(origin.replace(/^ChatMessage\./,''))??resolve(origin):origin;
 const activity=card?.getAssociatedActivity?.({scaled:true}),item=activity?.item??card?.getAssociatedItem?.(),caster=item?.actor??activity?.actor;
 if(activity?.type!=='save'||item?.type!=='spell'||!caster||!omenBeastFeature(caster))return false;
 const target=rollToken(actor,card,tokenRef),scene=target?.parent;if(!scene)return false;
 return values(scene.regions).some(region=>{const aura=flag(region,'omenBeastAura');if(aura?.caster!==caster.uuid)return false;
  const beast=doc(resolve(aura.token)),link=omenBeastLink(beast);if(beast?.parent!==scene||link?.caster!==caster.uuid||Number(beast.actor?.system?.attributes?.hp?.value)<=0||beast.actor?.statuses?.has('dead')||beast.combatant?.defeated)return false;
  // Native summon disposition follows its owner. Only enemies receive this benefit.
  if(!(Number(beast.disposition)*Number(target.disposition)<0))return false;
  const a=values(beast.levels),b=values(target.levels);if(a.length&&b.length&&!a.some(l=>b.includes(l)))return false;
  return target.testInsideRegion?.(region)===true;
 });
}
export function omenBeastDefaults(config,dialog,message){
 if(bridge&&game.modules?.get?.('automated-conditions-5e')?.active)return;
 const actor=config.subject?.actor??config.subject,speaker=message?.data?.speaker,token=speaker?.scene&&speaker?.token?`Scene.${speaker.scene}.Token.${speaker.token}`:null;
 if(!omenBeastSave(actor,message?.data?.system?.origin,token))return;
 config.disadvantage=true;for(const roll of config.rolls??[]){roll.options??={};const adv=!!(config.advantage||roll.options.advantage||roll.options.advantageMode===1);Object.assign(roll.options,{advantage:adv,disadvantage:true,advantageMode:adv?0:-1});}
 dialog.options??={};dialog.options.defaultButton=config.advantage||config.rolls?.[0]?.options?.advantage?'normal':'disadvantage';
}
export function registerOmenBeast(api=globalThis.ac5e?.usageRules){if(bridge||!game.modules?.get?.('automated-conditions-5e')?.active||!api?.register)return bridge;
 try{bridge=!!api.register({key:'rsaBeastsIllOmen',scope:'universal',hook:'save',target:'subject',mode:'disadvantage',name:'Beasts of Ill Omen',persistent:false,evaluate:s=>omenBeastSave(resolve(s.actorUuid),s.options?.originatingMessageId,s.tokenUuid)});}catch(error){console.warn('Beasts of Ill Omen AC5E integration',error);}return bridge;
}
function report(e){console.error('Beasts of Ill Omen',e);}
async function recover(){if(!authority())return;for(const scene of values(game.scenes)){const tokens=values(scene.tokens);for(const token of tokens)if(flag(token,'omenBeast')||omenBeastLink(token))await schedule(token);const stale=values(scene.regions).filter(r=>flag(r,'omenBeastAura')&&!tokens.some(t=>t.uuid===flag(r,'omenBeastAura').token));if(stale.length)await scene.deleteEmbeddedDocuments('Region',stale.map(r=>r.id));}}
Hooks.once('init',()=>game.settings.register(ID,'beastsIllOmenAutomation',{name:'Shadow: Beasts of Ill Omen',hint:'Attach a 5-foot aura to Summon Beast castings, including upcasts. Enemies inside have Disadvantage only on saves against the summoning Sorcerer’s spells, with normal Advantage cancellation.',scope:'world',config:true,type:Boolean,default:true,onChange:()=>recover().catch(report)}));
Hooks.on('ac5e.usageRulesReady',({usageRules}={})=>registerOmenBeast(usageRules));
Hooks.once('ready',()=>{registerOmenBeast();Hooks.on('dnd5e.summonToken',prepareOmenBeast);
 Hooks.on('createToken',(token,options,userId)=>{if(!authority()||!flag(token,'omenBeast'))return;const user=game.users.get(userId),caster=resolve(flag(token,'omenBeast').caster);if(user?.isGM||user?.active&&caster?.testUserPermission(user,'OWNER'))schedule(token).catch(report);});
 Hooks.on('deleteToken',token=>{if(flag(token,'omenBeast')||omenBeastLink(token))schedule(token,{remove:true}).catch(report);});
 Hooks.on('updateToken',(token,changes)=>{if(['width','height','shape','levels'].some(k=>k in changes)&&(flag(token,'omenBeast')||omenBeastLink(token)))schedule(token).catch(report);});
 for(const event of ['createItem','updateItem','deleteItem'])Hooks.on(event,item=>{const actor=item.actor;if(!authority()||!actor||!omenBeastFeature({items:[item]}))return;for(const scene of values(game.scenes))for(const region of values(scene.regions)){if(flag(region,'omenBeastAura')?.caster!==actor.uuid)continue;const token=resolve(flag(region,'omenBeastAura').token);if(token)schedule(token).catch(report);}});
 Hooks.on('canvasReady',()=>recover().catch(report));recover().catch(report);Hooks.on('dnd5e.preRollSavingThrowV2',omenBeastDefaults);
});
