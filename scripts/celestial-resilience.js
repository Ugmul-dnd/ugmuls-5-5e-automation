import {createEventQueue,describeTarget,isEligibleHealingTarget} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),wrapped=new WeakSet(),completed=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"celestialResilienceAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export const resilienceFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="celestial-resilience"&&i.system?.source?.rules!=="2014");
function sourceToken(actor,scene=globalThis.canvas?.scene){return actor?.token?.parent?.id===scene?.id?actor.token:values(globalThis.canvas?.tokens?.controlled).map(t=>t.document??t).find(t=>t.parent?.id===scene?.id&&t.actor?.uuid===actor?.uuid)??values(scene?.tokens).find(t=>t.actor?.uuid===actor?.uuid);}
export function resilienceCandidates(actor,source=sourceToken(actor)){
 if(!source?.actor||!source.parent)return [];
 const seen=new Set(),levels=values(source.levels);
 return values(source.parent.tokens).filter(t=>{
  if(!isEligibleHealingTarget(t)||t.actor.uuid===actor.uuid||seen.has(t.actor.uuid)||t.disposition!==source.disposition||source.disposition===0||t.object?.isVisible===false||t.combatant?.defeated||t.actor.statuses?.has("dead"))return false;
  const targetLevels=values(t.levels);if(levels.length&&targetLevels.length&&!levels.some(l=>targetLevels.includes(l)))return false;seen.add(t.actor.uuid);return true;
 });
}
function stateFor(actor,config){
 if(!config.rsaCelestialResilience){const source=sourceToken(actor);config.rsaCelestialResilience={request:foundry.utils.randomID(),source:source?.uuid??null,scene:source?.parent?.id??null,targets:Object.fromEntries(resilienceCandidates(actor,source).slice(0,5).map(t=>[t.id,true]))};}
 return config.rsaCelestialResilience;
}
function selectedUuids(actor,state,source=sourceToken(actor)){
 const wanted=new Set(Object.entries(state?.targets??{}).filter(([,yes])=>yes===true).map(([id])=>id));
 return resilienceCandidates(actor,source).filter(t=>wanted.has(t.id)).slice(0,5).map(t=>t.uuid);
}
export function resilienceRestFields(actor,config={}){
 if(!enabled()||!actor?.isOwner||!resilienceFeature(actor)||actor.type==="group")return [];
 const state=stateFor(actor,config);return resilienceCandidates(actor).map(t=>({name:"rsaCelestialResilience.targets."+t.id,field:new foundry.data.fields.BooleanField({label:t.name,required:false}),value:state.targets?.[t.id]===true}));
}
export function wireResilienceLimit(root){
 const inputs=values(root?.querySelectorAll?.('[name^="rsaCelestialResilience.targets."]'));if(!inputs.length)return;
 const sync=changed=>{if(changed?.checked&&inputs.filter(i=>i.checked).length>5)changed.checked=false;const count=inputs.filter(i=>i.checked).length;for(const input of inputs)input.disabled=!input.checked&&count>=5;};
 for(const input of inputs)input.addEventListener("change",()=>sync(input));sync();
}
function snapshotTargets(root,actor,state){const inputs=values(root?.querySelectorAll?.('[name^="rsaCelestialResilience.targets."]'));if(!inputs.length)return {...state,targets:{}};return {...state,targets:Object.fromEntries(inputs.map(input=>[input.name.split('.').at(-1),input.checked===true]))};}
export function installResilienceRest(Type){
 const p=Type?.prototype;if(!p||wrapped.has(p))return;wrapped.add(p);const prepare=p._prepareContext,render=p._onRender,process=p._processFormData;
 p._prepareContext=async function(...args){const context=await prepare.apply(this,args);if(!["short","long"].includes(this.config?.type)||this.isPartyGroup)return context;const fields=resilienceRestFields(this.actor,this.config);if(fields.length){for(const f of fields)f.input=context.inputs?.createCheckboxInput;context.formSections??=[];context.formSections.push({legend:"Celestial Resilience — Choose up to 5 allies",fields});}return context;};
 p._onRender=function(...args){const result=render?.apply(this,args);wireResilienceLimit(this.element);return result;};
 if(process)p._processFormData=function(...args){const state=this.config?.rsaCelestialResilience,snapshot=state?snapshotTargets(this.element,this.actor,state):null,data=process.apply(this,args);if(snapshot)data.rsaCelestialResilience=snapshot;return data;};
}
export function cunningEligible(activity){return enabled()&&activity?.type==="utility"&&key(activity.item)==="magical-cunning"&&!!resilienceFeature(activity.actor??activity.item.actor);}
function addCunningFields(app){
 if(!cunningEligible(app.activity)||app.element?.querySelector('[data-celestial-resilience]'))return;
 const state=stateFor(app.actor,app.config),candidates=resilienceCandidates(app.actor),escape=foundry.utils.escapeHTML,field=document.createElement("fieldset");field.dataset.celestialResilience="true";
 field.innerHTML='<legend>Celestial Resilience</legend><p>You gain temporary HP. Choose up to 5 visible allies to receive temporary HP as well.</p><div style="display:grid;gap:6px;max-height:220px;overflow:auto">'+candidates.map(t=>'<label><input type="checkbox" name="rsaCelestialResilience.targets.'+escape(t.id)+'" '+(state.targets?.[t.id]?'checked':'')+'> '+escape(t.name)+'</label>').join('')+(candidates.length?'':'<p>No visible friendly creatures on this scene.</p>')+'</div>';
 const consumption=app.element.querySelector('[data-application-part="consumption"]'),form=app.element.matches?.("form")?app.element:app.element.querySelector("form");if(consumption)consumption.after(field);else form?.append(field);wireResilienceLimit(field);
 for(const input of field.querySelectorAll('input'))input.addEventListener("change",e=>{e.stopPropagation();app.config.rsaCelestialResilience=snapshotTargets(field,app.actor,state);});
}
export function prepareCunningResilience(activity,usage,dialog){
 if(!cunningEligible(activity))return;stateFor(activity.actor,usage);const Base=dialog.applicationClass;if(!Base)return;
 dialog.applicationClass=class extends Base{
  _onRender(context,options){super._onRender(context,options);addCunningFields(this);}
  async _prepareSubmitData(event,formData){const snapshot=snapshotTargets(this.element,this.actor,stateFor(this.actor,this.config)),data=await super._prepareSubmitData(event,formData);data.rsaCelestialResilience=snapshot;return data;}
 };
}
export function buildResilienceHealing(feature,self){
 const data=feature.toObject(),id=self?"e0Z4QVl2xhKrnzlY":"RcOD8an5PifIcVfn",activity=data.system?.activities?.[id];
 if(activity?.type!=="heal"||!values(activity.healing?.types).includes("temphp"))throw Error("Celestial Resilience is missing its native temporary HP activity.");
 data._id=foundry.utils.randomID();data.system.activities={[id]:activity};data.effects=[];data.system.uses={max:"",spent:0,recovery:[]};data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};
 activity.activation={type:"special",override:true};activity.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};activity.range={units:"any",override:true};activity.target={override:true,prompt:false,affects:{type:"creature",choice:false},template:{type:""}};activity.effects=[];return {data,id};
}
async function grantHealing(actor,feature,recipients,self,request){
 if(!recipients.length)return;
 const {data,id}=buildResilienceHealing(feature,self),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();const activity=helper.system.activities.get(id),targets=recipients.map(r=>r.token?describeTarget(r.token):{actor:r.actor.uuid,name:r.actor.name,img:r.actor.img});
 const marker={actor:actor.uuid,request,self},flags={[ID]:{riderTriggered:true,manualDamageWorkflow:true,activityOverrideData:data,celestialResilienceGrant:marker},dnd5e:{item:{data}}};
 const result=await activity.use({consume:false,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets},flags}});
 if(!result?.message)throw Error("Celestial Resilience could not create its temporary HP card.");
 let healing;const capture=card=>{if(["healing","damage"].includes(card.type)&&(typeof card.system?.origin==="string"?card.system.origin.replace(/^ChatMessage\./,""):card.system?.origin?.id)===result.message.id&&card.rolls?.length&&!flag(card,"pendingDamage"))healing=card;};
 const hooks=["createChatMessage","updateChatMessage"].map(event=>[event,Hooks.on(event,capture)]);let rolls;
 try{rolls=await activity.rollDamage({isCritical:false},{configure:false},{data:{system:{origin:result.message.id,targets},flags}});}finally{for(const[event,hook]of hooks)Hooks.off(event,hook);}
 if(!healing)throw Error("Celestial Resilience’s rolled card is available in chat; apply its temporary HP manually.");
 const amount=Math.max(0,values(rolls).reduce((n,r)=>n+(Number(r.total)||0),0));
 for(const recipient of recipients)await recipient.actor.applyDamage([{type:"temphp",value:amount}],{origin:healing,originatingMessage:healing});
 await healing.setFlag(ID,"hpApplicationRecorded",true);globalThis.Ugmuls55eAutomationChatRefresh?.card(healing);
}
export async function grantResilience(actor,state,request,user=game.user){
 if(!authority()||!enabled()||!actor||!resilienceFeature(actor)||!user?.active||!user.isGM&&!actor.testUserPermission(user,"OWNER")||typeof request!=="string")return;
 const prior=flag(actor,"celestialResilienceRequests")??[];if(prior.includes(request))return;
 const source=state?.source?globalThis.fromUuidSync?.(state.source,{strict:false}):sourceToken(actor);if(source&&source.actor?.uuid!==actor.uuid)return;
 const allowed=new Set(selectedUuids(actor,state,source)),allies=resilienceCandidates(actor,source).filter(t=>allowed.has(t.uuid)).map(token=>({token,actor:token.actor}));
 await actor.setFlag(ID,"celestialResilienceRequests",[...prior.slice(-63),request]);
 const feature=resilienceFeature(actor);await grantHealing(actor,feature,[{token:source,actor}],true,request);await grantHealing(actor,feature,allies,false,request);
}
async function requestResilience(actor,state,request,sourceCard=null){
 const gm=game.users.activeGM;if(!gm&&!game.user.isGM)throw Error("A connected GM is required to grant Celestial Resilience temporary HP.");if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"celestialResilience",actor:actor.uuid,state,request,sourceCard,user:game.user.id,gm:gm.id});else await enqueue(()=>grantResilience(actor,state,request));
}
export async function completedResilienceRest(actor,result,config={}){
 if(!enabled()||!actor?.isOwner||!result||completed.has(result)||!resilienceFeature(actor)||!["short","long"].includes(config.type??result.type))return;
 completed.add(result);const state=stateFor(actor,config);await requestResilience(actor,state,"rest:"+state.request,result.message?.id??null);
}
export async function completedCunningResilience(activity,usage,result){
 if(!cunningEligible(activity)||!result?.message||!activity.actor?.isOwner)return;
 await requestResilience(activity.actor,stateFor(activity.actor,usage),"cunning:"+result.message.id,result.message.id);
}
function report(error){console.error("Celestial Resilience",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"celestialResilienceAutomation",{name:"Celestial Resilience",hint:"Choose up to five visible friendly creatures in Short/Long Rest and Magical Cunning dialogs. Completion grants native temporary HP amounts to the Warlock and chosen allies, preserving higher temporary HP. No fixed distance limit; caster is separate from the five allies.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 for(const type of ["short","long"])installResilienceRest(CONFIG.DND5E.restTypes?.[type]?.dialogClass);
 Hooks.on("dnd5e.restCompleted",(actor,result,config)=>completedResilienceRest(actor,result,config).catch(report));Hooks.on("dnd5e.preUseActivity",prepareCunningResilience);Hooks.on("dnd5e.postUseActivity",(activity,usage,result)=>completedCunningResilience(activity,usage,result).catch(report));
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="celestialResilienceError"&&packet.user===game.user.id){ui.notifications.error(packet.error);return;}
  if(packet?.action!=="celestialResilience"||!authority()||packet.gm!==game.user.id)return;
  const actor=globalThis.fromUuidSync?.(packet.actor,{strict:false}),user=game.users.get(packet.user);if(!actor||!user?.active||!user.isGM&&!actor.testUserPermission(user,"OWNER"))return;
  if(packet.sourceCard){const card=game.messages.get(packet.sourceCard);if(!card||card.getAssociatedActor?.()?.uuid!==actor.uuid)return;}
  enqueue(()=>grantResilience(actor,packet.state,packet.request,user)).catch(error=>{report(error);game.socket.emit("module."+ID,{action:"celestialResilienceError",user:user.id,error:error.message});});
 });
});
