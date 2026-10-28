const ID="ugmuls-5-5e-automation",running=new Set();let bridge=false;
const values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"focusedStrikeAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const live=e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired;
const feature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="focused-strike"&&i.system?.source?.rules!=="2014");
const resolve=ref=>typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref;
export async function applyFocusedStrike(card){
 if(!authority()||!enabled()||card?.type!=="usage"||running.has(card.id))return;
 const activity=card.getAssociatedActivity?.(),link=flag(card,"stunningStrike"),actor=card.getAssociatedActor?.()??activity?.actor,owned=feature(actor);
 if(!owned||!link&&!(activity?.type==="save"&&key(activity.item)==="stunning-strike"))return;
 if(link&&link.casterActor!==actor.uuid)return;
 const targets=(card.system?.targets??[]).filter(t=>(!link||t.token===link.targetToken)&&["success","failure"].includes(card.system.outcomes?.get(t.token))&&!values(flag(card,"focusedStrikeApplied")).includes(t.token));
 if(!targets.length)return;running.add(card.id);
 try{
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  for(const target of targets){
   const token=await fromUuid(target.token),victim=token?.actor;if(!victim)continue;
   const combat=game.combat,stamp=combat?.started?{combat:combat.id,round:combat.round,turn:combat.turn}:null;
   const data={name:"Focused Strike — "+actor.name,img:owned.img??"icons/svg/daze.svg",type:"base",disabled:false,transfer:false,origin:actor.uuid,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:combat?.started?null:6,units:"seconds",expiry:"sourceStart",expired:false},statuses:[],description:"Disadvantage on saving throws against spells cast by "+actor.name+" until the start of their next turn.",system:{changes:[],origin:{actor:actor.uuid,item:owned.uuid,message:card.uuid}},flags:{dnd5e:{isTemporary:true},[ID]:{focusedStrike:{caster:actor.uuid,source:card.id,stamp}}}};
   const existing=values(victim.effects).find(e=>flag(e,"focusedStrike")?.caster===actor.uuid);
   if(existing)await existing.update(data);else await victim.createEmbeddedDocuments("ActiveEffect",[data]);
   await card.setFlag(ID,"focusedStrikeApplied",[...new Set([...values(flag(card,"focusedStrikeApplied")),target.token])]);
  }
 }finally{running.delete(card.id);}
}
export function focusedSpellSave(actor,origin){
 if(!enabled())return false;origin=resolve(origin);
 const activity=origin?.getAssociatedActivity?.({scaled:true}),item=activity?.item??origin?.getAssociatedItem?.(),caster=origin?.getAssociatedActor?.()??activity?.actor;
 if(item?.type!=="spell"||!caster?.uuid)return false;
 return values(actor?.effects).some(e=>live(e)&&flag(e,"focusedStrike")?.caster===caster.uuid);
}
export function focusedSaveDefaults(config,dialog,message){
 if(bridge&&game.modules?.get?.("automated-conditions-5e")?.active)return;
 const actor=config.subject?.actor??config.subject,origin=message?.data?.system?.origin;
 if(!focusedSpellSave(actor,origin))return;
 config.disadvantage=true;
 for(const roll of config.rolls??[]){roll.options??={};const adv=!!(config.advantage||roll.options.advantage||roll.options.advantageMode===1);Object.assign(roll.options,{disadvantage:true,advantage:adv,advantageMode:adv?0:-1});}
 dialog.options??={};dialog.options.defaultButton=config.advantage||config.rolls?.[0]?.options?.advantage?"normal":"disadvantage";
}
export function registerFocusedStrike(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return bridge;
 try{bridge=!!api.register({key:"rsaFocusedStrike",scope:"universal",hook:"save",target:"subject",mode:"disadvantage",name:"Focused Strike",persistent:false,evaluate:s=>focusedSpellSave(globalThis.fromUuidSync?.(s.actorUuid,{strict:false}),s.options?.originatingMessageId)});}catch(error){console.warn("Focused Strike condition integration",error);bridge=false;}return bridge;
}
export async function expireFocusedStrike(combat,changes={},ending=false){
 if(!authority()||!ending&&!("turn"in changes||"round"in changes||"started"in changes))return;
 const source=combat.combatant?.actor?.uuid,actors=new Map([...values(game.actors),...values(globalThis.canvas?.scene?.tokens).map(t=>t.actor),...values(combat.combatants).map(c=>c.actor)].filter(Boolean).map(a=>[a.uuid,a]));
 for(const actor of actors.values()){
  const ids=values(actor.effects).filter(e=>{const m=flag(e,"focusedStrike");if(!m?.stamp||m.stamp.combat!==combat.id)return false;return ending||combat.started===false||m.caster===source&&(m.stamp.round!==combat.round||m.stamp.turn!==combat.turn);}).map(e=>e.id);
  if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
 }
}
function report(error){console.error("Focused Strike",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"focusedStrikeAutomation",{name:"Focused Strike Assistance",hint:"After Stunning Strike resolves, apply spell-save Disadvantage against the originating Mystic Arts Monk only, regardless of the stun outcome, until the start of that Monk's next turn.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerFocusedStrike(usageRules));
Hooks.once("ready",()=>{
 registerFocusedStrike();Hooks.on("dnd5e.preRollSavingThrowV2",focusedSaveDefaults);
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{const origin=card.type==="usage"?card:resolve(card.system?.origin);if(origin)applyFocusedStrike(origin).catch(report);});
 Hooks.on("updateCombat",(c,d)=>expireFocusedStrike(c,d).catch(report));Hooks.on("deleteCombat",c=>expireFocusedStrike(c,{},true).catch(report));
});
