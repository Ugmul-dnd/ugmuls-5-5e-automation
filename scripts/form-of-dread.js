import {dreadContext} from "./dread-ambusher.js";
import {createEventQueue,describeTarget,isRollAdjustmentLocked} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),choices=new WeakMap(),fearEffects=new Map(),prepared=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"formOfDreadAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const resolve=ref=>globalThis.fromUuidSync?.(ref,{strict:false}),live=e=>e&&!e.disabled&&e.active!==false&&!e.duration?.expired;
const turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
const name=d=>d?.name?.trim().toLowerCase(),key=d=>d?.identifier??d?.system?.identifier;
export const formFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&(key(i)==="form-of-dread"||name(i)==="form of dread"));
export const activeForms=actor=>values(actor?.effects).filter(e=>live(e)&&["form of dread","form of dread (necrotic husk)"].includes(name(e)));
const superior=e=>name(e)==="form of superior dread";
export function syncSuperior(actor){return enqueue(async()=>{
 if(!authority()||!enabled()||!actor?.createEmbeddedDocuments)return;
 const feature=formFeature(actor),existing=values(actor.effects).filter(superior),owns=values(actor.items).some(i=>i.type==="feat"&&(key(i)==="superior-dread"||name(i)==="superior dread"));
 if(!existing.length&&!owns)return;
 const active=!!feature&&owns&&activeForms(actor).length>0;
 if(!active){const updates=existing.filter(e=>!e.disabled).map(e=>({_id:e.id,disabled:true}));if(updates.length)await actor.updateEmbeddedDocuments("ActiveEffect",updates);return;}
 const effect=existing[0];
 if(effect){if(effect.disabled||effect.duration?.expired||effect.duration?.value!=null||effect.duration?.expiry!=null)await effect.update({disabled:false,"duration.expired":false,"duration.value":null,"duration.expiry":null});return;}
 const template=values(feature.effects).find(superior);if(!template)throw Error("Form of Dread is missing its native Superior Dread effect.");
 const data=template.toObject();delete data._id;data.disabled=false;data.transfer=false;data.origin=feature.uuid;data.start=null;
 // The base form owns expiry. This linked effect cannot outlive it or expire early.
 data.duration={value:null,units:"seconds",expiry:null,expired:false};data.flags??={};data.flags[ID]={...data.flags[ID],superiorDreadLink:feature.uuid};
 await actor.createEmbeddedDocuments("ActiveEffect",[data]);
});}
export function fearContext(app){
 const c=dreadContext(app),feature=formFeature(c.actor),save=values(feature?.system?.activities).find(a=>a.type==="save"&&name(a)==="frightful avatar");
 const data=app.message?.data??{},pending=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),records=data.system?.targets??pending?.system?.targets??c.attack?.system?.targets??[];
 const hits=values(c.attack?.system?.evaluatedTargets).filter(t=>t.isMiss===false&&records.some(r=>r.token===t.token)).map(t=>resolve(t.token)).filter(t=>t?.actor);
 const choice=choices.get(app),target=hits.find(t=>t.uuid===choice?.target)??hits[0];return {...c,feature,save,hits,target};
}
export function fearEligible(app){const c=fearContext(app);return enabled()&&c.actor?.isOwner&&!!c.save&&c.activity?.type==="attack"&&activeForms(c.actor).length>0&&!!c.target&&!app.message?.data?.flags?.[ID]?.masteryGraze&&!isRollAdjustmentLocked(c.attack);}
export function fearUsed(actor){return !!turn()&&flag(actor,"frightfulAvatarTurn")?.turn===turn();}
export function selectFear(app,yes,target){choices.set(app,{yes:yes===true,target:target??choices.get(app)?.target});}
export function addFearChoice(app){
 const c=fearContext(app);if(!enabled()||!c.feature||!activeForms(c.actor).length||c.activity?.type!=="attack")return;
 const row=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"frightful-avatar",label:"Frightful Avatar",value:choices.get(app)?.yes===true,used:fearUsed(c.actor),disabled:!fearEligible(app),change:yes=>selectFear(app,yes)});
 row?.querySelector?.("[data-frightful-target]")?.remove();
 if(row&&c.hits.length>1){const select=document.createElement("select");select.dataset.frightfulTarget="true";select.setAttribute("aria-label","Frightful Avatar target");for(const target of c.hits){const option=document.createElement("option");option.value=target.uuid;option.textContent=target.name??target.actor.name;select.append(option);}select.value=c.target.uuid;select.addEventListener("change",()=>selectFear(app,choices.get(app)?.yes,select.value));row.querySelector(".form-fields")?.append(select);}
}
export function commitFear(app,options){
 if(!options?.dnd5e?.submitted||choices.get(app)?.yes!==true){if(app.message?.data?.flags?.[ID])delete app.message.data.flags[ID].frightfulAvatar;return;}
 if(!game.users.activeGM&&!game.user.isGM)throw Error("Frightful Avatar requires a connected GM to resolve the target save.");
 if(!fearEligible(app))throw Error("Frightful Avatar requires an active Form of Dread and a confirmed attack hit.");
 const c=fearContext(app);if(fearUsed(c.actor))throw Error("Frightful Avatar has already been used this turn.");
 app.message.data.flags??={};app.message.data.flags[ID]??={};app.message.data.flags[ID].frightfulAvatar={actor:c.actor.uuid,feature:c.feature.uuid,attack:c.attack.id,target:c.target.uuid,turn:turn(),user:game.user.id};
}
export function buildFear(feature,actor){
 const data=feature.toObject(),native=values(feature.system.activities).find(a=>a.type==="save"&&name(a)==="frightful avatar"),id=native?.id,use=data.system.activities[id];if(!use)throw Error("Form of Dread is missing Frightful Avatar.");
 const ids=new Set(values(use.effects).map(e=>e._id)),effect=data.effects.find(e=>ids.has(e._id));if(!effect)throw Error("Frightful Avatar is missing its native Frightened effect.");
 data.name="Frightful Avatar";data.system.activities={[id]:use};data.effects=[effect];data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};
 use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.activation={type:"special",override:true};use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};use.range={override:true,units:"any"};use.damage={parts:[],onSave:"none"};use.duration={override:true,units:"spec",concentration:false,expiry:"sourceEnd"};
 use.effects=[{_id:effect._id,onSave:false}];use.appliedEffects=[effect._id];if(use.flags?.dnd5e)delete use.flags.dnd5e.dependentOn;
 Object.assign(effect,{disabled:false,transfer:false,start:null,statuses:["frightened"],duration:{value:null,units:"seconds",expiry:"sourceEnd",expired:false}});effect.system??={};effect.system.origin={...effect.system.origin,actor:actor.uuid,item:feature.uuid};effect.flags??={};effect.flags.dnd5e={...effect.flags.dnd5e,isTemporary:true};
 return {data,id};
}
export function resolveFear(card){return enqueue(async()=>{
 const meta=flag(card,"frightfulAvatar");if(!authority()||!enabled()||!meta||card.type!=="damage"||!card.rolls?.length||flag(card,"pendingDamage")||flag(card,"frightfulAvatarResolved"))return;
 const actor=card.getAssociatedActor?.(),user=game.users.get(meta.user),attack=game.messages.get(meta.attack),target=resolve(meta.target),feature=formFeature(actor),activity=attack?.getAssociatedActivity?.();
 if(!user?.active||!actor||actor.uuid!==meta.actor||!(user.isGM||actor.testUserPermission?.(user,"OWNER"))||!(card.author?.isGM||card.author?.id===user.id)||feature?.uuid!==meta.feature||activity?.type!=="attack"||attack.getAssociatedActor?.()?.uuid!==actor.uuid||!target?.actor||!card.system?.targets?.some(t=>t.token===meta.target)||!attack.system?.evaluatedTargets?.some(t=>t.token===meta.target&&t.isMiss===false)||!activeForms(actor).length||meta.turn!==turn()||flag(card,"damageAttackId")&&flag(card,"damageAttackId")!==attack.id)return;
 // Damage may already be applied by the time its card reaches this queue.
 // Eligibility checked the lock in configuration; this save never adjusts damage.
 const prior=flag(actor,"frightfulAvatarTurn");if(prior?.attack===attack.id||turn()&&prior?.turn===turn())return;
 const {data,id}=buildFear(feature,actor),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
 let published=false;await actor.setFlag(ID,"frightfulAvatarTurn",{turn:turn(),attack:attack.id,card:card.id});
 try{
  const tokenRef=attack.getAssociatedToken?.(),token=tokenRef?.document??tokenRef;
  const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{speaker:card.speaker,system:{targets:[describeTarget(target)]},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,frightfulAvatarSave:{damage:card.id,attack:attack.id,actor:actor.uuid,combatant:token?.combatant?.id,applied:game.combat?.started?{combat:game.combat.id,round:game.combat.round,turn:game.combat.turn}:null}}}}});
  if(!result?.message)throw Error("Frightful Avatar could not create its saving throw card.");published=true;await card.setFlag(ID,"frightfulAvatarResolved",result.message.id);
 }catch(error){if(!published){if(prior)await actor.setFlag(ID,"frightfulAvatarTurn",prior);else await actor.unsetFlag(ID,"frightfulAvatarTurn");}throw error;}
});}
function fearRecord(link,effect){
 const damage=game.messages.get(link.damage),stamp=flag(damage,"frightfulAvatar")?.turn?.split(":");
 const applied=link.applied??(stamp?.length===3?{combat:stamp[0],round:Number(stamp[1]),turn:Number(stamp[2])}:null);
 return {caster:link.actor,combatant:link.combatant,applied};
}
export function installFearPreparation(Type=globalThis.customElements?.get?.("effect-application")){
 const p=Type?.prototype;if(!p?._prepareEffectData||prepared.has(p))return;prepared.add(p);const prepare=p._prepareEffectData;
 p._prepareEffectData=async function(...args){
  const operation=await prepare.apply(this,args),link=flag(this.chatMessage,"frightfulAvatarSave");if(!link)return operation;
  // Apply to the final native operation, including refreshes of an existing
  // Frightened effect, which otherwise retain its previous duration/source.
  operation.data.duration={value:null,units:"seconds",expiry:"sourceEnd",expired:false};operation.data.start=CONFIG.ActiveEffect.documentClass.getEffectStart();
  operation.data.system??={};operation.data.system.origin={...operation.data.system.origin,actor:link.actor};
  operation.data.flags??={};operation.data.flags[ID]={...operation.data.flags[ID],frightfulFear:fearRecord(link)};
  return operation;
 };
}
export function indexFear(effect,deleted=false){
 if(!effect?.uuid)return;fearEffects.delete(effect.uuid);if(deleted||!live(effect)||effect.parent?.documentName!=="Actor")return;
 let record=flag(effect,"frightfulFear");
 // Recover effects applied before this fix by their exact source message.
 if(!record){const ref=effect.system?.origin?.message,card=ref&&(resolve(ref)??game.messages.get(ref.replace(/^ChatMessage\./,""))),link=flag(card,"frightfulAvatarSave");if(link)record=fearRecord(link,effect);}
 if(record?.applied)fearEffects.set(effect.uuid,{effect,record});
}
export function expireFear(combat,changes={},ending=false){return enqueue(async()=>{
 if(!authority()||!enabled()||!ending&&!("turn"in changes||"round"in changes||changes.started===false))return;
 const prior=combat.previous,source=prior?.combatantId?combat.combatants.get(prior.combatantId)?.actor:null,batches=new Map();
 for(const [uuid,{effect,record}]of fearEffects){
  if(!live(effect)||!values(effect.parent?.effects).some(e=>e.uuid===uuid)){fearEffects.delete(uuid);continue;}
  const applied=record.applied;if(applied.combat!==combat.id)continue;
  const after=prior&&(prior.round>applied.round||prior.round===applied.round&&prior.turn>applied.turn);
  if(!ending&&combat.started!==false&&!(after&&(record.combatant?prior.combatantId===record.combatant:source?.uuid===record.caster)))continue;
  const actor=effect.parent;if(!batches.has(actor))batches.set(actor,[]);batches.get(actor).push(effect.id);
 }
 // Native expiry can already have queued an update for these same IDs.
 // Keep the documents available for that update and subsequent native refreshes;
 // deleting here races the registry and tombstones unlinked token effects.
 for(const [actor,ids]of batches){
  const current=new Map(values(actor.effects).map(e=>[e.id,e]));
  const updates=ids.filter(id=>live(current.get(id))).map(_id=>({_id,disabled:true,"duration.expired":true}));
  if(updates.length)await actor.updateEmbeddedDocuments("ActiveEffect",updates);
 }
});}
function report(error){console.error("Form of Dread",error);ui.notifications.error(error.message);}
const actorOf=d=>d?.documentName==="Actor"?d:d?.actor??(d?.parent?.documentName==="Actor"?d.parent:d?.parent?.actor);
function changed(doc){const actor=actorOf(doc);if(actor&&(formFeature(actor)||values(actor.effects).some(superior)))syncSuperior(actor).catch(report);}
Hooks.once("init",()=>game.settings.register(ID,"formOfDreadAutomation",{name:"Undead: Form of Dread",hint:"Link Superior Dread to an active Form of Dread, and offer optional Frightful Avatar on confirmed weapon or spell attack damage once per turn. Uses the native Wisdom save and Frightened effect with source-turn-end expiry.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 installFearPreparation();
 globalThis.Ugmuls55eAutomationFormOfDread={addFearChoice,commitFear};
 for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect","createItem","updateItem","deleteItem"])Hooks.on(event,changed);
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{if(flag(card,"frightfulAvatar"))resolveFear(card).catch(report);});
 for(const event of ["createActiveEffect","updateActiveEffect"])Hooks.on(event,effect=>indexFear(effect));Hooks.on("deleteActiveEffect",effect=>indexFear(effect,true));
 Hooks.on("updateCombat",(combat,changes)=>expireFear(combat,changes).catch(report));Hooks.on("deleteCombat",combat=>expireFear(combat,{},true).catch(report));
 const rebuild=()=>{fearEffects.clear();const actors=new Map([...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor))].filter(Boolean).map(a=>[a.uuid,a]));for(const actor of actors.values()){changed(actor);for(const effect of values(actor.effects))indexFear(effect);}};
 Hooks.on("canvasReady",rebuild);rebuild();
});
