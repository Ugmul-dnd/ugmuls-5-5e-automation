import {faerieSource,outlinedEffect} from "./guided-precision.js";
const bridges=new Set(),values=v=>Array.from(v?.values?.()??v??[]),resolve=r=>{if(typeof r!=='string')return r;try{return globalThis.fromUuidSync?.(r,{strict:false});}catch{return null;}};
export function outlinedTarget(actor){return values(actor?.appliedEffects??actor?.effects).some(e=>outlinedEffect(e)&&!!faerieSource(e));}
function token(ref){const doc=resolve(ref);if(doc?.documentName==='Token'||doc?.object&&doc?.actor)return doc.document??doc;const actor=doc?.actor??doc;return actor?.token??values(globalThis.canvas?.scene?.tokens).find(t=>t.actor?.uuid===actor?.uuid);}
export function outlinedAdvantage(source,target){
 const a=source?.document??source,b=target?.document??target;
 if(!a?.actor||!b?.actor||a.parent?.id!==b.parent?.id||b.hidden||a.actor.statuses?.has('blinded')||!outlinedTarget(b.actor))return false;
 if(!a.object?.center||!b.object?.center)return false;
 return !a.object.checkCollision?.(b.object.center,{type:'sight',mode:'any'});
}
export function registerOutlined(api=globalThis.ac5e?.usageRules){
 if(!game.modules?.get?.('automated-conditions-5e')?.active||!api?.register)return false;
 try{const registered=!!api.register({key:'rsaFaerieFireOutlined',scope:'universal',hook:'attack',target:'subject',mode:'advantage',name:'Faerie Fire — Outlined',persistent:false,evaluate:s=>outlinedAdvantage(token(s.tokenUuid??s.actorUuid),token(s.opponentTokenUuid??s.opponentUuid??s.opponentActorUuid))});if(registered)bridges.add('attack');return registered;}catch(error){console.warn('Faerie Fire advantage integration',error);return false;}
}
export function outlinedDefaults(config,dialog,message){
 if(config.subject?.type!=='attack'||bridges.has('attack')&&game.modules?.get?.('automated-conditions-5e')?.active)return;
 const targets=message?.data?.system?.targets??values(game.user.targets).map(t=>({token:(t.document??t).uuid}));if(targets.length!==1)return;
 const speaker=message?.data?.speaker,source=speaker?.scene&&speaker?.token?token('Scene.'+speaker.scene+'.Token.'+speaker.token):config.subject.getUsageToken?.();
 if(!outlinedAdvantage(source,token(targets[0].token??targets[0].actor)))return;
 config.advantage=true;
 for(const roll of config.rolls??[]){roll.options??={};const o=roll.options,state=o['automated-conditions-5e']??config.options?.['automated-conditions-5e'];const disadvantage=state?.modeCounts?!!state.modeCounts.disadvantages?.present:!!config.disadvantage||!!o.disadvantage||o.advantageMode===-1;Object.assign(o,{advantage:true,disadvantage,advantageMode:disadvantage?0:1});}
 dialog.options??={};dialog.options.defaultButton=config.rolls?.[0]?.options?.disadvantage?'normal':'advantage';return dialog.options.defaultButton;
}
export function prepareOutlinedButtons(app,context){const choice=outlinedDefaults({...app.config,rolls:app.rolls??app.config.rolls},{options:{}},app.message);if(choice)for(const [key,b]of Object.entries(context.buttons??{}))b.default=key===choice;}
Hooks.on('ac5e.usageRulesReady',({usageRules}={})=>registerOutlined(usageRules));
Hooks.once('ready',()=>{registerOutlined();globalThis.Ugmuls55eAutomationOutlined={prepareOutlinedButtons};Hooks.on('dnd5e.preRollAttackV2',outlinedDefaults);});
