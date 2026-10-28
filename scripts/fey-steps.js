import {describeTarget,isEligibleTarget,isEligibleHealingTarget} from "./shared-activity-card.js";
import {sendSavePrompt} from "./save-prompts.js";
const ID="ugmuls-5-5e-automation",pending=new Map(),timers=new Map(),running=new Set();let bridge=false;
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"feyStepsAutomation")===true,resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
const feature=(actor,id)=>values(actor?.items).find(i=>i.type==="feat"&&key(i)===id),live=e=>!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired;
const choices={refreshing:{label:"Refreshing Step",feature:"steps-of-the-fey",activity:"QUbshQXhUDQqlu2s"},taunting:{label:"Taunting Step",feature:"steps-of-the-fey",activity:"48TdRWDqCVcC9mh4"},disappearing:{label:"Disappearing Step",feature:"misty-escape",activity:"KMyLMOnvFbMuoRYa"},dreadful:{label:"Dreadful Step",feature:"misty-escape",activity:"kj8zIhPbjs4UIHtc"}};
export function feyOptions(actor){return Object.entries(choices).filter(([,spec])=>!!feature(actor,spec.feature)).map(([id,spec])=>({id,...spec}));}
export function feyCast(activity){return enabled()&&activity?.item?.type==="spell"&&key(activity.item)==="misty-step"&&!!feature(activity.actor??activity.item.actor,"steps-of-the-fey");}
export function position(token){return {x:token.x,y:token.y,elevation:token.elevation??0,width:token.width??1,height:token.height??1};}
export function feyMoved(token,record){return ["x","y","elevation"].some(k=>Number(token[k]??0)!==Number(record.departure[k]??0));}
function executor(card){const author=typeof card.author==="string"?game.users.get(card.author):card.author;return author?.active?author.id:game.users.activeGM?.id;}
function allowed(card){const actor=resolve(flag(card,"feyStep")?.caster);return !!actor&&(game.user.isGM||actor.isOwner);}
function addCastFields(app){
 if(!feyCast(app.activity)||app.element?.querySelector('[data-fey-steps]'))return;
 const form=app.element?.matches?.("form")?app.element:app.element?.querySelector("form");if(!form)return;
 const field=document.createElement("fieldset");field.dataset.feySteps="true";field.innerHTML='<legend>Steps of the Fey</legend><div class="form-group"><label>Fey Step</label><div class="form-fields"><select name="rsaFeyChoice"></select></div></div>';
 const select=field.querySelector('[name="rsaFeyChoice"]');
 for(const option of [{id:"none",label:"None"},...feyOptions(app.actor)]){const node=document.createElement("option");node.value=option.id;node.textContent=option.label;select.append(node);}
 select.value=app.config.rsaFeyChoice??"none";
 select.addEventListener("change",e=>{e.stopPropagation();app.config.rsaFeyChoice=select.value;});
 const scaling=app.element.querySelector('[data-application-part="scaling"]');if(scaling)scaling.after(field);else form.prepend(field);
}
export function prepareFeyCast(activity,usage,dialog,message){
 if(!feyCast(activity))return;const token=activity.getUsageToken?.();if(!token)return;
 const departure=position(token),Base=dialog.applicationClass;
 if(Base)dialog.applicationClass=class extends Base{
  _onRender(context,options){super._onRender(context,options);addCastFields(this);}
  async _prepareSubmitData(event,formData){
   // Native change handling can rerender the form while super yields. Snapshot submitted values first.
   const choice=formData?.object?.rsaFeyChoice??this.element?.querySelector('[name="rsaFeyChoice"]')?.value??this.config.rsaFeyChoice??"none";
   const site=formData?.object?.rsaFeySite??this.element?.querySelector('[name="rsaFeySite"]')?.value??this.config.rsaFeySite??"arrival";
   const data=await super._prepareSubmitData(event,formData);data.rsaFeyChoice=choice;data.rsaFeySite=site;this.config.rsaFeyChoice=choice;this.config.rsaFeySite=site;return data;
  }
 };
 const scale=activity._prepareUsageScaling;
 activity._prepareUsageScaling=async function(config,messageConfig,item){
  await scale.call(this,config,messageConfig,item);const choice=config.rsaFeyChoice;if(!choice||choice==="none")return;
  if(!feyOptions(this.actor).some(o=>o.id===choice))throw Error("This Fey Step option is no longer available.");
  messageConfig.data??={};messageConfig.data.flags??={};messageConfig.data.flags[ID]={...messageConfig.data.flags[ID],feyStep:{choice,site:config.rsaFeySite==="departure"?"departure":"arrival",departure,token:token.uuid,caster:this.actor.uuid,stage:"waiting",created:Date.now()}};
 };
}
export function registerFeyStep(card){
 const record=flag(card,"feyStep");if(card?.type!=="usage"||!record||!enabled())return;
 if(record.stage!=="waiting"||Date.now()-record.created>300000){if(pending.get(record.token)===card.id)pending.delete(record.token);return;}
 if(executor(card)!==game.user.id)return;
 pending.set(record.token,card.id);const token=resolve(record.token);if(token&&feyMoved(token,record))scheduleFeyArrival(token);
}
export function scheduleFeyArrival(token){
 const id=pending.get(token?.uuid),card=game.messages.get(id),record=flag(card,"feyStep");if(!id||record?.stage!=="waiting"||!feyMoved(token,record))return;
 clearTimeout(timers.get(token.uuid));timers.set(token.uuid,setTimeout(()=>{timers.delete(token.uuid);completeFeyStep(card).catch(report);},500));
}
export function feyCandidates(source,point,range,{healing=false}={}){
 const scene=source.parent,size=scene.grid.size,units=/^(m|meters?|metres?)$/i.test(scene.grid.units??"ft")?0.3048:1,limit=range*units;
 return values(scene.tokens).filter(token=>{
  if(healing?!isEligibleHealingTarget(token):!isEligibleTarget(token))return false;
  // Only Refreshing Step requires a visible recipient. Area saves do not require sight,
  // and arrival vision may still be updating after a teleport.
  if(healing&&token.object?.isVisible===false&&token.uuid!==source.uuid)return false;
  if(!healing&&token.uuid===source.uuid)return false;
  const aLevels=values(source.levels),bLevels=values(token.levels);if(aLevels.length&&bLevels.length&&!aLevels.some(l=>bLevels.includes(l)))return false;
  const a={x:point.x+size/2,y:point.y+size/2},b={x:token.x+size/2,y:token.y+size/2};
  // Measure nearest occupied grid-square centers, respecting scene diagonal rules.
  const ax=Math.max(a.x,Math.min(b.x,a.x+(point.width-1)*size)),ay=Math.max(a.y,Math.min(b.y,a.y+(point.height-1)*size));
  const bx=Math.max(b.x,Math.min(ax,b.x+((token.width??1)-1)*size)),by=Math.max(b.y,Math.min(ay,b.y+((token.height??1)-1)*size));
  const distance=globalThis.canvas?.grid?.measurePath?.([{x:ax,y:ay},{x:bx,y:by}])?.distance;
  return Number.isFinite(distance)&&Math.max(distance,Math.abs(Number(token.elevation??0)-Number(point.elevation??0)))<=limit;
 });
}

export function dreadfulGroups(source,record){return {departure:feyCandidates(source,record.departure,5),arrival:feyCandidates(source,position(source),5)};}
export function validateDreadfulSelection(source,record,selection,groups){
 if(!selection||!["departure","arrival"].includes(selection.site)||!Array.isArray(selection.indexes))return null;
 const current=new Set(dreadfulGroups(source,record)[selection.site].map(t=>t.uuid)),seen=new Set();
 const targets=selection.indexes.map(i=>groups[selection.site][i]).filter(t=>t&&current.has(t.uuid)&&!seen.has(t.uuid)&&seen.add(t.uuid));
 return {site:selection.site,targets};
}
export function bindDreadfulPicker(root,groups){
 let hovered;
 const clear=event=>{hovered?._onHoverOut?.(event??{});hovered=null;};
 const sync=()=>{const site=root.querySelector('[name="feyArea"]:checked')?.value;for(const field of root.querySelectorAll('[data-fey-group]'))field.disabled=field.dataset.feyGroup!==site;};
 for(const input of root.querySelectorAll('[name="feyArea"]'))input.addEventListener("change",sync);
 for(const row of root.querySelectorAll('[data-fey-token]')){
  row.addEventListener("mouseenter",event=>{clear(event);const token=Object.values(groups).flat().find(t=>t.uuid===row.dataset.feyToken)?.object;if(token&&!token.hover){token._onHoverIn?.(event,{hoverOutOthers:true});hovered=token;}});
  row.addEventListener("mouseleave",clear);
 }
 sync();return clear;
}
export async function chooseDreadfulTargets(source,record){
 const groups=dreadfulGroups(source,record);if(!groups.departure.length&&!groups.arrival.length){ui.notifications.info("No eligible creatures within 5 feet of either Fey Step location. Use Choose Targets on the cast card to retry.");return null;}
 const preferred=record.site==="departure"?"departure":"arrival",selected=groups[preferred].length?preferred:preferred==="arrival"?"departure":"arrival",escape=foundry.utils.escapeHTML;
 const content='<p>Choose one location, then confirm the creatures affected. Hover a creature to highlight it on the map.</p>'+["departure","arrival"].map(site=>'<section style="margin:10px 0"><label style="font-weight:bold"><input type="radio" name="feyArea" value="'+site+'" '+(selected===site?'checked':'')+' '+(!groups[site].length?'disabled':'')+'> '+(site==="arrival"?'Arrival — where you landed':'Departure — where you left')+'</label><fieldset data-fey-group="'+site+'" style="display:grid;gap:6px;margin-top:6px;max-height:220px;overflow:auto" '+(selected!==site?'disabled':'')+'>'+(groups[site].length?groups[site].map((token,index)=>'<label data-fey-token="'+escape(token.uuid)+'"><input type="checkbox" name="feyTarget-'+site+'" value="'+index+'" checked> '+escape(token.name)+'</label>').join(''):'<p>No creatures within 5 feet.</p>')+'</fieldset></section>').join('');
 let cleanup=()=>{};
 try{
  const selection=await foundry.applications.api.DialogV2.wait({window:{title:"Dreadful Step — Choose Targets"},position:{width:460},content,rejectClose:false,render:(_event,dialog)=>{cleanup();cleanup=bindDreadfulPicker(dialog.element,groups);},buttons:[{action:"confirm",label:"Confirm Targets",default:true,callback:(_event,button)=>{const site=button.form.querySelector('[name="feyArea"]:checked')?.value;if(!["departure","arrival"].includes(site))return null;return {site,indexes:values(button.form.querySelectorAll('[name="feyTarget-'+site+'"]:checked')).map(n=>Number(n.value))};}},{action:"cancel",label:"Cancel",callback:()=>null}]});
  return validateDreadfulSelection(source,record,selection,groups);
 }finally{cleanup();}
}

async function chooseTargets(source,record){
 if(record.choice==="dreadful")return chooseDreadfulTargets(source,record);
 const refreshing=record.choice==="refreshing",point=refreshing||record.site==="arrival"&&record.choice==="dreadful"?position(source):record.departure,range=refreshing?10:5;
 const targets=feyCandidates(source,point,range,{healing:refreshing});if(!targets.length){ui.notifications.info("No eligible creatures within range for "+choices[record.choice].label+(record.choice==="dreadful"?" at "+record.site:"")+". Use the location controls on the cast card to retry.");return null;}
 const escape=foundry.utils.escapeHTML;
 const content='<p>'+escape(choices[record.choice].label)+(refreshing?' — choose one recipient within 10 feet.':' — confirm creatures within 5 feet of '+(record.choice==="taunting"||record.site!=="arrival"?'your departure.':'your arrival.'))+'</p><div style="display:grid;gap:6px;max-height:320px;overflow:auto">'+targets.map((t,i)=>'<label><input type="'+(refreshing?'radio':'checkbox')+'" name="feyTarget" value="'+i+'" '+(!refreshing||t.uuid===source.uuid?'checked':'')+'> '+escape(t.name)+'</label>').join('')+'</div>';
 const selected=await foundry.applications.api.DialogV2.wait({window:{title:choices[record.choice].label},position:{width:420},content,rejectClose:false,buttons:[{action:"confirm",label:"Confirm",callback:(_e,b)=>values(b.form.querySelectorAll('[name="feyTarget"]:checked')).map(n=>Number(n.value))},{action:"cancel",label:"Cancel",callback:()=>null}]});
 if(!Array.isArray(selected))return null;
 const currentPoint=refreshing||record.site==="arrival"&&record.choice==="dreadful"?position(source):record.departure;
 const current=new Set(feyCandidates(source,currentPoint,range,{healing:refreshing}).map(t=>t.uuid));return selected.map(i=>targets[i]).filter(t=>t&&current.has(t.uuid)).slice(0,refreshing?1:targets.length);
}
export function buildFeyExtra(actor,record){
 const spec=choices[record.choice],owned=feature(actor,spec.feature),data=owned?.toObject(),native=data?.system?.activities?.[spec.activity];if(!native)throw Error(spec.label+" is missing its native activity.");
 data._id=foundry.utils.randomID();data.name=spec.label;data.system.activities={[spec.activity]:native};data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};data.flags[ID]={feyStepExtra:{kind:record.choice,caster:actor.uuid}};
 native.activation={type:"special",override:true};native.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};native.range={units:"any",override:true};native.target={override:true,prompt:false,affects:{type:record.choice==="disappearing"?"self":"creature",choice:false},template:{type:""}};
 if(record.choice==="dreadful")native.damage.onSave="none";
 if(record.choice==="taunting"||record.choice==="disappearing"){
  const ids=new Set((native.effects??[]).map(e=>e._id));data.effects=(data.effects??[]).filter(e=>ids.has(e._id));
  for(const effect of data.effects){effect.transfer=false;effect.disabled=false;effect.start=null;effect.duration={value:game.combat?.started?null:6,units:"seconds",expiry:"sourceStart",expired:false};effect.system??={};effect.system.origin={...effect.system.origin,actor:actor.uuid};effect.flags??={};effect.flags.dnd5e={...effect.flags.dnd5e,isTemporary:true};effect.flags[ID]={...effect.flags[ID],feyStepEffect:{kind:record.choice,caster:actor.uuid,...(game.combat?.started?{applied:{combat:game.combat.id,round:game.combat.round,turn:game.combat.turn}}:{})}};}
 }
 return {data,id:spec.activity};
}
export async function completeFeyStep(card){
 const record=flag(card,"feyStep");if(game.messages.get(card?.id)!==card||!enabled()||record?.stage!=="waiting"||running.has(card.id)||executor(card)!==game.user.id||!allowed(card))return;
 const source=resolve(record.token),actor=source?.actor;if(!source||actor?.uuid!==record.caster||!feature(actor,"steps-of-the-fey"))return;
 if(Date.now()-record.created>300000){await card.setFlag(ID,"feyStep",{...record,stage:"canceled"});pending.delete(record.token);return;}
 running.add(card.id);let created=false;
 try{
  const selected=record.choice==="disappearing"?[source]:await chooseTargets(source,record);if(selected===null)return;
  const targets=Array.isArray(selected)?selected:selected.targets,site=selected.site??record.site;
  if(!targets.length){await card.setFlag(ID,"feyStep",{...record,site,stage:"done"});pending.delete(record.token);return;}
  const {data,id}=buildFeyExtra(actor,record),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();const activity=helper.system.activities.get(id),descriptors=targets.map(describeTarget);
  const flags={[ID]:{riderTriggered:true,regionTriggered:true,activityOverrideData:data,feyStepExtra:{kind:record.choice,caster:actor.uuid,cast:card.id},...(record.choice==="disappearing"?{manualDamageWorkflow:true}:{})},dnd5e:{item:{data}}};
  const result=await activity.use({consume:false,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:descriptors},flags}});
  if(!result?.message)throw Error("Could not create the Fey Step extra card.");created=true;
  await card.setFlag(ID,"feyStep",{...record,site,stage:"done",extra:result.message.id});pending.delete(record.token);
  if(activity.type==="heal")await globalThis.Ugmuls55eAutomationHealing.roll(activity,result.message,{system:{origin:result.message.id,targets:descriptors},flags});
  else if(activity.type==="save")for(const target of targets)await sendSavePrompt(result.message,target,"region");
  else if(record.choice==="disappearing"){
   const tray=document.createElement("effect-application");tray.chatMessage=result.message;
   let applied=0;for(const effect of await activity.getApplicableEffects())if(await globalThis.Ugmuls55eAutomationEffectUndo.apply(result.message,result.message,effect,actor,tray))applied++;
   if(applied){await result.message.setFlag(ID,"outcomeEffectsApplied",true);globalThis.Ugmuls55eAutomationChatRefresh?.card(result.message);}
  }
 }catch(error){if(created)ui.notifications.warn("The extra card is available in chat; use it to finish this Fey Step.");throw error;}
 finally{running.delete(card.id);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
}
export function renderFeyArrival(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).map(node=>({card:game.messages.get(node.dataset.messageId),node}))];
 for(const {card,node}of entries){node.querySelectorAll(':scope > .rsa-fey-arrival').forEach(n=>n.remove());const r=flag(card,"feyStep");if(!r||r.stage!=="waiting"||!allowed(card)||!enabled()||node.hidden)continue;
  const row=document.createElement("div");row.className="rsa-fey-arrival";const p=document.createElement("p");p.textContent=choices[r.choice].label+": move your token. The extra opens automatically after movement. Use the controls below to resolve it manually.";row.append(p);
  for(const [action,label]of [["confirm",r.choice==="dreadful"?"Choose Targets":"Confirm Arrival"],["cancel","Cancel Extras"]]){const b=document.createElement(action==="cancel"?"a":"button");if(action!=="cancel")b.type="button";else {b.href="#";b.style.display="block";b.style.textAlign="center";b.style.marginTop="6px";}b.textContent=label;b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();requestArrival(card,action);});row.append(b);}node.append(row);
 }
}
async function supersedeFeyStep(activity,result){
 if(!feyCast(activity)||!result?.message)return;const token=activity.getUsageToken?.(),old=game.messages.get(pending.get(token?.uuid));if(!old||old.id===result.message.id||executor(old)!==game.user.id||running.has(old.id))return;
 const r=flag(old,"feyStep");if(r?.stage==="waiting"){await old.setFlag(ID,"feyStep",{...r,stage:"canceled"});pending.delete(r.token);clearTimeout(timers.get(r.token));timers.delete(r.token);}
}
function requestArrival(card,action){game.socket.emit("module."+ID,{action:"feyArrival",card:card.id,user:game.user.id,operation:action});handleArrival(card,action).catch(report);}
export async function handleArrival(card,action){
 if(executor(card)!==game.user.id||!allowed(card)||running.has(card.id))return;
 const r=flag(card,"feyStep");if(r?.stage!=="waiting")return;
 clearTimeout(timers.get(r.token));timers.delete(r.token);
 if(action==="cancel"){await card.setFlag(ID,"feyStep",{...r,stage:"canceled"});pending.delete(r.token);return;}
 if(action==="arrival"||action==="departure"){
  if(r.choice!=="dreadful")return;
  await card.setFlag(ID,"feyStep",{...r,site:action});
  // Explicit resolution selects the area, rather than just resuming the old cast choice.
  clearTimeout(timers.get(r.token));timers.delete(r.token);
 }
 await completeFeyStep(card);
}
export function tauntedAgainst(actor,target){return enabled()&&!!target&&values(actor?.effects).some(e=>live(e)&&flag(e,"feyStepEffect")?.kind==="taunting"&&flag(e,"feyStepEffect").caster!==target.uuid);}
function tauntDefaults(config,dialog,message){
 if(bridge&&game.modules?.get("automated-conditions-5e")?.active||config.subject?.type!=="attack")return;
 const actor=config.subject.actor,targets=message?.data?.system?.targets??[];if(targets.length!==1)return;const doc=resolve(targets[0].token??targets[0].actor),target=doc?.actor??doc;if(!tauntedAgainst(actor,target))return;
 config.disadvantage=true;for(const roll of config.rolls??[]){roll.options??={};const adv=!!(config.advantage||roll.options.advantage||roll.options.advantageMode===1);Object.assign(roll.options,{disadvantage:true,advantage:adv,advantageMode:adv?0:-1});}dialog.options??={};dialog.options.defaultButton=config.advantage||config.rolls?.[0]?.options?.advantageMode===0?"normal":"disadvantage";
}
function registerTaunt(api=globalThis.ac5e?.usageRules){if(bridge||!api?.register)return;bridge=!!api.register({key:"rsaTauntingStep",scope:"universal",hook:"attack",target:"subject",mode:"disadvantage",name:"Taunting Step",persistent:false,evaluate:s=>{const a=resolve(s.actorUuid),t=resolve(s.opponentActorUuid??s.opponentUuid);return tauntedAgainst(a?.actor??a,t?.actor??t);}});}
async function clearDisappearing(actor,ids=null){if(!actor?.isOwner)return;for(const effect of values(actor.effects))if((!ids||ids.includes(effect.id))&&live(effect)&&flag(effect,"feyStepEffect")?.kind==="disappearing")await effect.delete();}
export async function clearAfterAttack(card){
 // The completion handshake is GM-authoritative. Unrelated attacks and player
 // clients must not start waits for an effect they cannot expire.
 if(!enabled()||!game.user.isGM||game.users.activeGM&&game.users.activeGM.id!==game.user.id)return;
 const actor=card.getAssociatedActor?.(),ids=values(actor?.effects).filter(e=>live(e)&&flag(e,"feyStepEffect")?.kind==="disappearing").map(e=>e.id);
 if(!actor?.isOwner||!ids.length)return;
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);await clearDisappearing(actor,ids);
}
const expiring=new Set();
export async function expireFeyStepTurn(combat,changes={}){
 if(!enabled()||!game.user.isGM||game.users.activeGM&&game.users.activeGM.id!==game.user.id||!combat?.started||!("turn"in changes||"round"in changes))return;
 const caster=combat.combatant?.actor??combat.combatant?.token?.actor;if(!caster||expiring.has(caster.uuid))return;
 const actors=new Map([...values(game.actors),...values(combat.combatants).map(c=>c.actor??c.token?.actor),...values(globalThis.canvas?.scene?.tokens).map(t=>t.actor)].filter(Boolean).map(a=>[a.uuid,a]));
 expiring.add(caster.uuid);
 try{for(const actor of actors.values()){
  const ids=values(actor.effects).filter(effect=>{const link=flag(effect,"feyStepEffect"),stamp=link?.applied;
   if(link?.caster!==caster.uuid||!["taunting","disappearing"].includes(link.kind))return false;
   // Legacy effects without our stamp expire on the next observed caster turn.
   return !stamp||stamp.combat===combat.id&&(combat.round>stamp.round||combat.round===stamp.round&&combat.turn>stamp.turn);
  }).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
 }}finally{expiring.delete(caster.uuid);}
}
function report(error){console.error("Steps of the Fey",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"feyStepsAutomation",{name:"Archfey: Steps of the Fey",hint:"Choose a Misty Step extra during casting. After the caster token moves, resolve the extra using recorded departure or current arrival. Chat controls allow manual confirmation or cancellation. Native free casts and spell slots remain unchanged.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerTaunt(usageRules));
Hooks.once("ready",()=>{
 Hooks.on("updateCombat",(combat,changes)=>expireFeyStepTurn(combat,changes).catch(report));
 registerTaunt();Hooks.on("dnd5e.preUseActivity",(activity,usage)=>{if(activity.item?.type==="spell")usage.rsaFeyInvisibleBefore=values(activity.actor?.effects).filter(e=>live(e)&&flag(e,"feyStepEffect")?.kind==="disappearing").map(e=>e.id);});Hooks.on("dnd5e.preUseActivity",prepareFeyCast);
 Hooks.on("createChatMessage",card=>{registerFeyStep(card);if(card.type==="attack"&&card.rolls?.length)clearAfterAttack(card).catch(report);});
 Hooks.on("updateChatMessage",card=>{if(flag(card,"feyStep"))registerFeyStep(card);});
 Hooks.on("updateToken",(token,changes)=>{if(["x","y","elevation"].some(k=>k in changes))scheduleFeyArrival(token);});
 Hooks.on("deleteToken",token=>{pending.delete(token.uuid);clearTimeout(timers.get(token.uuid));timers.delete(token.uuid);});
 Hooks.on("deleteChatMessage",card=>{const r=flag(card,"feyStep");if(r&&pending.get(r.token)===card.id){pending.delete(r.token);clearTimeout(timers.get(r.token));timers.delete(r.token);}});
 Hooks.on("dnd5e.renderChatMessage",renderFeyArrival);
 game.socket.on("module."+ID,packet=>{if(packet?.action!=="feyArrival")return;const card=game.messages.get(packet.card),user=game.users.get(packet.user),actor=resolve(flag(card,"feyStep")?.caster);if(!card||!user?.active||!actor||!user.isGM&&!actor.testUserPermission(user,"OWNER")||!["confirm","cancel","arrival","departure"].includes(packet.operation))return;handleArrival(card,packet.operation).catch(report);});
 Hooks.on("dnd5e.preRollAttackV2",tauntDefaults);Hooks.on("dnd5e.postBuildAttackRollConfig",(config,roll,index,{app,formData}={})=>{if(!formData)tauntDefaults({...config,rolls:[roll]},{options:{}},app?.message);});
 Hooks.on("dnd5e.postUseActivity",(activity,usage,result)=>{supersedeFeyStep(activity,result).catch(report);if(activity.item?.type==="spell"&&!flag(result?.message,"feyStepExtra"))clearDisappearing(activity.actor,usage.rsaFeyInvisibleBefore??[]).catch(report);});
 Hooks.on("dnd5e.applyDamage",(actor,amount,options)=>{if(!(amount>0))return;const ref=options.origin??options.originatingMessage,card=typeof ref==="string"?game.messages.get(ref):ref;clearDisappearing(card?.getAssociatedActor?.()).catch(report);});
});
