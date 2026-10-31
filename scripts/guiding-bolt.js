import {createEventQueue} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',bridges=new Set(),enqueue=createEventQueue(),liveCards=new WeakSet(),consumed=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier;
const resolve=ref=>{if(typeof ref!=='string')return ref;try{return fromUuidSync(ref,{strict:false});}catch{return null;}};
const flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],enabled=()=>game.settings.get(ID,'guidingBoltAutomation')===true;
function token(ref){const doc=resolve(ref);if(doc?.documentName==='Token'||doc?.actor&&doc?.parent)return doc.document??doc;const actor=doc?.actor??doc;return actor?.token??values(canvas.scene?.tokens).find(t=>t.actor?.uuid===actor?.uuid);}
export function guidingEffect(effect){
 if(!effect||effect.disabled||effect.active===false||effect.isSuppressed||effect.duration?.expired||effect.system?.expired)return false;
 const refs=[effect.system?.origin?.item,effect.system?.origin?.activity,effect.origin,effect._stats?.duplicateSource,effect._stats?.compendiumSource],message=resolve(effect.system?.origin?.message);
 const spell=[...refs.map(resolve),message?.getAssociatedItem?.()].filter(Boolean).map(d=>d.item??(d.type==='spell'?d:d.parent)).find(i=>i?.type==='spell'&&key(i)==='guiding-bolt');
 const native=refs.some(r=>typeof r==='string'&&/phbsplGuidingBol(?:\.|$)/.test(r));
 return !!(spell||native)&&(effect.name?.trim().toLowerCase()==='guiding bolt'||effect.id==='rHzZCeXfdeTcYyk8'||values(effect.statuses).includes('marked')||refs.some(r=>typeof r==='string'&&r.endsWith('.rHzZCeXfdeTcYyk8')));
}
export function guidingEffects(actor){return values(actor?.appliedEffects??actor?.effects).filter(guidingEffect);}
export function guidingAdvantage(source,target){const a=source?.document??source,b=target?.document??target;return enabled()&&!!a?.actor&&!!b?.actor&&a.parent?.id===b.parent?.id&&guidingEffects(b.actor).length>0;}
const stamp=e=>JSON.stringify({origin:e.origin??null,source:e.system?.origin?.message??null,start:e.start??null,modified:e._stats?.modifiedTime??null});
export function registerGuiding(api=globalThis.ac5e?.usageRules){if(!game.modules?.get?.('automated-conditions-5e')?.active||!api?.register)return false;try{const ok=!!api.register({key:'rsaGuidingBolt',scope:'universal',hook:'attack',target:'subject',mode:'advantage',name:'Guiding Bolt — Next Attack',persistent:false,evaluate:s=>guidingAdvantage(token(s.tokenUuid??s.actorUuid),token(s.opponentTokenUuid??s.opponentUuid??s.opponentActorUuid))});if(ok)bridges.add('attack');return ok;}catch(error){console.warn('Guiding Bolt advantage integration',error);return false;}}
export function guidingAttack(config,dialog,message={},{snapshot=true}={}){
 if(!enabled()||config.subject?.type!=='attack')return;const targets=message?.data?.system?.targets??values(game.user.targets).map(t=>({token:(t.document??t).uuid}));if(targets.length!==1)return;
 const target=token(targets[0].token??targets[0].actor),speaker=message?.data?.speaker,source=speaker?.scene&&speaker?.token?token('Scene.'+speaker.scene+'.Token.'+speaker.token):config.subject.getUsageToken?.();if(!guidingAdvantage(source,target))return;
 if(snapshot){message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],guidingBoltAttack:{target:target.uuid,effects:guidingEffects(target.actor).map(e=>({uuid:e.uuid,stamp:stamp(e)}))}};}
 if(bridges.has('attack')&&game.modules?.get?.('automated-conditions-5e')?.active)return;
 config.advantage=true;for(const roll of config.rolls??[]){const o=roll.options??={},state=o['automated-conditions-5e']??config.options?.['automated-conditions-5e'],dis=state?.modeCounts?!!state.modeCounts.disadvantages?.present:!!config.disadvantage||!!o.disadvantage||o.advantageMode===-1;Object.assign(o,{advantage:true,disadvantage:dis,advantageMode:dis?0:1});}
 dialog.options??={};dialog.options.defaultButton=config.rolls?.[0]?.options?.disadvantage?'normal':'advantage';return dialog.options.defaultButton;
}
export function prepareGuidingButtons(app,context){const choice=guidingAttack({...app.config,rolls:app.rolls??app.config.rolls},{options:{}},app.message,{snapshot:false});if(choice)for(const[key,b]of Object.entries(context.buttons??{}))b.default=key===choice;}
export function consumeGuiding(card){return enqueue(async()=>{
 if(!enabled()||!game.user.isGM||game.users.activeGM&&game.users.activeGM.id!==game.user.id||card?.type!=='attack'||!card.rolls?.some(r=>r.d20&&r._evaluated)||consumed.has(card))return;consumed.add(card);
 const snapshot=flag(card,'guidingBoltAttack'),actor=card.getAssociatedActor?.(),author=card.author;if(!snapshot||!author||!(author.isGM||actor?.testUserPermission?.(author,'OWNER'))||!card.system?.targets?.some(t=>t.token===snapshot.target))return;
 const target=resolve(snapshot.target);if(!target?.actor)return;
 for(const entry of snapshot.effects??[]){const effect=resolve(entry.uuid);if(effect?.parent?.uuid!==target.actor.uuid||!guidingEffect(effect)||stamp(effect)!==entry.stamp)continue;await effect.update({disabled:true,['flags.'+ID+'.guidingBoltConsumedBy']:card.id});}
});}
Hooks.once('init',()=>game.settings.register(ID,'guidingBoltAutomation',{name:'Guiding Bolt: Next Attack Advantage',hint:'Recognize the native Guiding Bolt effect, offer next-attack Advantage through AC5E, and consume the exact captured effect after an attack is actually rolled, hit or miss. Canceling does not consume it; newer applications are preserved.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.on('ac5e.usageRulesReady',({usageRules}={})=>registerGuiding(usageRules));
Hooks.once('ready',()=>{registerGuiding();globalThis.Ugmuls55eAutomationGuidingBolt={prepareGuidingButtons};Hooks.on('dnd5e.preRollAttackV2',guidingAttack);Hooks.on('createChatMessage',card=>{if(card.type==='attack'){liveCards.add(card);consumeGuiding(card).catch(console.error);}});Hooks.on('updateChatMessage',card=>{if(liveCards.has(card))consumeGuiding(card).catch(console.error);});});
