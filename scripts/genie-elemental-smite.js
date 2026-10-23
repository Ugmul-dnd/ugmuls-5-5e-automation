const ID="ugmuls-5-5e-automation",busy=new Set(),applying=new Set(),leases=new Map(),requests=new Map();
const values=c=>Array.from(c?.values?.()??c??[]),key=i=>i?.identifier??i?.system?.identifier;
export const GENIE_OPTIONS=Object.freeze({dao:{name:"Dao’s Crush",id:"csOPXyBgbuK3D3wh"},djinni:{name:"Djinni’s Escape",id:"DmXwETSKLiE7cMwb"},efreeti:{name:"Efreeti’s Fury",id:"6WxqQ31Gb4q53zhZ"},marid:{name:"Marid’s Surge",id:"fxMpNYe6o3Uro14z"}});
const enabled=()=>game.settings.get(ID,"genieElementalSmiteAutomation")===true;
const remaining=i=>Number(i?.system?.uses?.value??Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0))||0;
const describe=t=>({token:t.uuid,actor:t.actor.uuid,name:t.name,img:t.texture?.src});
export function genieSmiteContext(card){
 if(!enabled()||card?.type!=="damage"||card.getFlag?.(ID,"pendingDamage"))return null;
 const selected=card.getFlag?.(ID,"selectedSmite"),item=card.getAssociatedItem?.(),spell=selected?globalThis.fromUuidSync?.(selected.spell,{strict:false}):item;
 if(key(spell)!=="divine-smite"||spell?.system?.source?.rules==="2014")return null;
 const actor=card.getAssociatedActor?.()??spell.actor;
 const feature=values(actor?.items).find(i=>i.type==="feat"&&key(i)==="elemental-smite"&&i.system?.source?.rules!=="2014");
 const resource=values(actor?.items).find(i=>i.type==="feat"&&key(i)==="channel-divinity");
 const origin=typeof card.system?.origin==="string"?game.messages.get(card.system.origin.replace(/^ChatMessage\./,"")):card.system?.origin;
 const targets=card.system?.targets?.length?card.system.targets:origin?.system?.targets;
 if(!feature||!resource||targets?.length!==1)return null;
 const cast=selected?card.id:origin?.id??card.id;
 return {actor,feature,resource,targets,cast,used:!!actor.getFlag?.(ID,"genieElementalSmites")?.[cast]||!!game.messages.get(cast)?.getFlag?.(ID,"genieElementalSmiteUsed"),available:remaining(resource)>0};
}
export function prepareElementalSmite(feature,option){
 const spec=GENIE_OPTIONS[option];if(!spec)throw Error("Unknown Elemental Smite option.");
 const data=feature.toObject(),activity=data.system.activities[spec.id];if(!activity)throw Error(spec.name+" is missing its native activity.");
 data._id=foundry.utils.randomID();data.flags??={};data.flags[ID]={...data.flags[ID],genieElementalHelper:true};
 // Keep the native check for subsequent escape prompts; casting Dao never rolls it.
 let id=spec.id;
 if(option==="dao"){id="rsaGenieDaoApply";data.system.activities[id]={...structuredClone(activity),_id:id,type:"utility",name:spec.name,roll:{prompt:false,visible:false,formula:""}};delete data.system.activities[id].check;}
 const use=data.system.activities[id];use.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};
 use.target={override:true,prompt:false,template:{type:""},affects:{type:option==="djinni"?"self":"creature",count:option==="dao"?"1":"",choice:false}};
 if(option==="djinni"){
  use.duration={override:true,units:"spec",concentration:false,expiry:"sourceEnd"};
  const effect=data.effects.find(e=>e._id==="NrCdUkcfS1EuXE7v");if(!effect)throw Error("Djinni’s Escape is missing its native effect.");
  Object.assign(effect,{transfer:false,disabled:false,duration:{value:null,units:"seconds",expiry:"sourceEnd",expired:false}});
 }
 if(option==="efreeti")use.damage.critical={...use.damage.critical,allow:true};
 if(option==="dao"&&!data.effects.some(e=>e._id==="5eS5mKboaQxPHEJz"))throw Error("Dao’s Crush is missing its native effect.");
 return {data,id};
}
function sourceToken(card,actor){const t=card.getAssociatedToken?.()??actor.token;return t?.document??t;}
export function genieNearby(card,actor,feet){
 const source=sourceToken(card,actor),a=source?.object;if(!a?.center)return [];
 const units=globalThis.canvas?.scene?.grid?.units,range=/^(m|meter|metre|meters|metres)$/i.test(units??"")?feet*0.3048:feet;
 return values(source.parent?.tokens).filter(t=>{const b=t.object;if(!t.actor||!b?.center||t.hidden||(!game.user.isGM&&b.visible===false))return false;
  const distance=canvas.grid.measurePath([a.center,b.center]).distance;
  return Number.isFinite(distance)&&distance<=range&&!a.checkCollision?.(b.center,{type:"sight",mode:"any"});
 });
}
export function furyEnemies(card,actor){
 const source=sourceToken(card,actor),disposition=Number(source?.disposition);
 return genieNearby(card,actor,30).filter(t=>t.actor?.uuid!==actor.uuid&&Number.isFinite(disposition)&&disposition!==0&&Number.isFinite(Number(t.disposition))&&Number(t.disposition)!==0&&Math.sign(Number(t.disposition))!==Math.sign(disposition));
}
export function bindFuryTargets(root,choices){
 let hovered=null,syncing=false;
 const inputs=()=>Array.from(root.querySelectorAll('[name="genie-target"]'));
 const clearHover=event=>{hovered?._onHoverOut?.(event??{});hovered=null;};
 const synchronize=(_user,token,targeted)=>{if(_user?.id!==game.user.id||syncing)return;const doc=token?.document??token,index=choices.findIndex(t=>t.uuid===doc?.uuid);if(index<0)return;
  if(targeted){syncing=true;try{for(const t of choices)if(t.uuid!==doc.uuid&&t.object?.isTargeted)t.object.setTarget(false,{user:game.user,releaseOthers:false});}finally{syncing=false;}}
  for(const input of inputs())if(targeted||Number(input.value)===index)input.checked=targeted&&Number(input.value)===index;
 };
 for(const input of inputs()){
  const token=choices[Number(input.value)]?.object,row=input.closest('label')??input;
  row.addEventListener('mouseenter',event=>{clearHover(event);token?._onHoverIn?.(event,{hoverOutOthers:true});hovered=token;});
  row.addEventListener('mouseleave',clearHover);
  input.addEventListener('change',()=>{if(!input.checked)return;syncing=true;try{for(const t of choices)t.object?.setTarget?.(t.object===token,{user:game.user,releaseOthers:false});}finally{syncing=false;}});
 }
 const selected=choices.findIndex(t=>t.object?.isTargeted);if(selected>=0)for(const input of inputs())input.checked=Number(input.value)===selected;
 const hook=Hooks.on('targetToken',synchronize);
 return ()=>{clearHover();Hooks.off('targetToken',hook);};
}
export async function chooseTargets(card,context,option){
 if(option==="dao")return context.targets;
 if(option==="djinni")return [];
 const choices=(option==="efreeti"?furyEnemies(card,context.actor):genieNearby(card,context.actor,10)).filter(t=>!context.targets.some(target=>target.token===t.uuid));
 if(option==="efreeti"&&!choices.length)return context.targets;
 const esc=s=>foundry.utils.escapeHTML(String(s));
 const content='<p>'+ (option==="efreeti"?'Choose the second creature within 30 feet of the Paladin.':'Choose additional creatures in your 10-foot emanation. The Divine Smite target is included.')+'</p>'+choices.map((t,i)=>'<label style="display:block"><input type="'+(option==="efreeti"?'radio':'checkbox')+'" name="genie-target" value="'+i+'"> '+esc(t.name)+'</label>').join('');
 let cleanup=()=>{};let selected;try{selected=await foundry.applications.api.DialogV2.wait({window:{title:GENIE_OPTIONS[option].name},content,render:(_event,dialog)=>{cleanup();if(option==="efreeti")cleanup=bindFuryTargets(dialog.element,choices);},buttons:[{action:"use",label:"Use Elemental Smite",default:true,callback:(_event,button)=>Array.from(button.form.querySelectorAll('[name="genie-target"]:checked'),input=>choices[Number(input.value)])},{action:"cancel",label:"Cancel",callback:()=>null}],close:()=>null,rejectClose:false});}finally{cleanup();}
 if(!selected)return null;if(option==="efreeti"&&selected.length!==1)throw Error("Choose one second creature.");
 // Recheck range after the choice; do not spend a use on stale selections.
 const allowed=new Set((option==="efreeti"?furyEnemies(card,context.actor):genieNearby(card,context.actor,10)).map(t=>t.uuid));
 if(selected.some(t=>!allowed.has(t.uuid)))throw Error("A chosen creature is no longer in range or visible.");
 return [...context.targets,...selected.map(describe)];
}
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
function reserve(card,user,nonce){
 const c=genieSmiteContext(card);if(!c||c.used||!c.available||!(user?.isGM||c.actor.testUserPermission?.(user,"OWNER")))throw Error("Elemental Smite is no longer available to this user.");
 const lease=leases.get(c.actor.uuid);if(lease&&lease.expires>Date.now())throw Error("Another Elemental Smite choice is being completed for this Paladin.");
 leases.set(c.actor.uuid,{nonce,user:user.id,cast:c.cast,expires:Date.now()+120000});return c.actor.uuid;
}
async function reserveUse(card){
 const nonce=foundry.utils.randomID(),gm=game.users.activeGM;
 if(!gm||gm.id===game.user.id)return {actor:reserve(card,game.user,nonce),nonce};
 return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{requests.delete(nonce);reject(Error("The GM did not respond. No Channel Divinity use was spent."));},10000);requests.set(nonce,{resolve,reject,timer});game.socket.emit("module."+ID,{action:"genieSmiteReserve",card:card.id,nonce,user:game.user.id,gm:gm.id});});
}
async function releaseUse(lease,card,result){
 if(!lease)return;const gm=game.users.activeGM;
 const packet={action:"genieSmiteRelease",...lease,user:game.user.id,gm:gm?.id,message:result?.message?.id};
 if(!gm||gm.id===game.user.id)await release(packet);else game.socket.emit("module."+ID,packet);
}
async function release(packet){
 const lease=leases.get(packet.actor);if(!lease||lease.nonce!==packet.nonce||lease.user!==packet.user)return;
 try{if(packet.message){const child=game.messages.get(packet.message),meta=child?.getFlag?.(ID,"genieElementalSmite");if(meta?.cast!==lease.cast||meta?.actor!==packet.actor)throw Error("Elemental Smite completion did not match its reserved cast.");const root=game.messages.get(lease.cast);if(root)await root.setFlag(ID,"genieElementalSmiteUsed",{option:meta.option,message:child.id});}}
 finally{leases.delete(packet.actor);}
}
async function receive(packet){
 if(packet?.action==="genieSmiteReserved"&&packet.user===game.user.id){const pending=requests.get(packet.nonce);if(!pending)return;clearTimeout(pending.timer);requests.delete(packet.nonce);if(packet.error)pending.reject(Error(packet.error));else pending.resolve({actor:packet.actor,nonce:packet.nonce});return;}
 if(!authority()||packet?.gm!==game.user.id)return;
 if(packet.action==="genieSmiteReserve"){try{const user=game.users.get(packet.user);if(!user?.active)throw Error("The requesting user is no longer connected.");const actor=reserve(game.messages.get(packet.card),user,packet.nonce);game.socket.emit("module."+ID,{action:"genieSmiteReserved",user:packet.user,nonce:packet.nonce,actor});}catch(error){game.socket.emit("module."+ID,{action:"genieSmiteReserved",user:packet.user,nonce:packet.nonce,error:error.message});}}
 if(packet.action==="genieSmiteRelease")await release(packet);
}
export async function useElementalSmite(card,option,{selectTargets=chooseTargets}={}){
 const context=genieSmiteContext(card);if(!context||!GENIE_OPTIONS[option])throw Error("This card is not an eligible Divine Smite.");
 const {actor,feature,resource,cast}=context;
 if(!actor.isOwner||!(game.user.isGM||actor.testUserPermission?.(game.user,"OWNER")))throw Error("Only the Paladin’s owner or GM can use Elemental Smite.");
 if(context.used||!context.available||busy.has(actor.uuid))throw Error("Elemental Smite has already been used for this cast, or no Channel Divinity use remains.");
 busy.add(actor.uuid);let charged=false,committed=false,spent,lease,result;
 try{
  const targets=await selectTargets(card,context,option);if(targets===null)return;
  const current=genieSmiteContext(card);if(!current||current.used||!current.available)throw Error("Elemental Smite is no longer available.");
  const {data,id}=prepareElementalSmite(feature,option),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
  lease=await reserveUse(card);
  spent=Number(resource.system.uses.spent??0);await resource.update({"system.uses.spent":spent+1});charged=true;
  result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{system:{targets},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,genieElementalSmite:{option,cast,actor:actor.uuid,feature:feature.uuid,source:card.uuid}}}}});
  if(!result?.message)return;
  committed=true;
  const ledger={...actor.getFlag(ID,"genieElementalSmites"),[cast]:{option,message:result.message.id}};
  await actor.setFlag(ID,"genieElementalSmites",Object.fromEntries(Object.entries(ledger).slice(-100)));
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);
  if(option==="efreeti")await rollEfreetiFury(helper.system.activities.get(id),result.message,card,targets,data);
  return result;
 }finally{try{if(charged&&!committed)await resource.update({"system.uses.spent":spent});}finally{try{await releaseUse(lease,card,result);}finally{busy.delete(actor.uuid);}}}
}
export async function rollEfreetiFury(activity,usage,source,targets,data){
 const attackId=source.getFlag?.(ID,"damageAttackId"),attack=attackId?game.messages.get(attackId):null;
 const isCritical=attack?.rolls?.[0]?.isCritical===true||source.rolls?.some(roll=>roll.options?.isCritical===true)===true;
 const options={configure:true,options:{defaultButton:isCritical?"critical":"normal"}};
 const dialog=globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("damage",options)??options;
 await activity.rollDamage({isCritical},dialog,{data:{system:{origin:usage.id,targets},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,genieElementalSmite:{...usage.getFlag(ID,"genieElementalSmite"),isCritical}}}}});
}
export async function applyDaoCrush(card){
 if(!game.user.isGM||(game.users.activeGM&&game.users.activeGM.id!==game.user.id)||card.getFlag?.(ID,"genieElementalSmite")?.option!=="dao"||card.getFlag(ID,"genieDaoApplied")||applying.has(card.id))return;
 applying.add(card.id);try{
  const meta=card.getFlag(ID,"genieElementalSmite"),feature=await fromUuid(meta.feature),target=card.system?.targets?.[0];
  if(key(feature)!=="elemental-smite"||!target?.token)return;
  const actor=(await fromUuid(target.token))?.actor;if(!actor)return;
  const activity=card.getAssociatedActivity({scaled:true}),effects=await activity.getApplicableEffects(),effect=effects.find(e=>e.id==="5eS5mKboaQxPHEJz");if(!effect)throw Error("Dao’s Crush effect could not be resolved.");
  const tray=document.createElement("effect-application");tray.chatMessage=card;
  const applied=await globalThis.Ugmuls55eAutomationEffectUndo.apply(card,card,effect,actor,tray);
  if(applied)await globalThis.Ugmuls55eAutomationRecurring?.registerRecurringEffect(applied,{spell:feature,level:0,sourceCard:card});
  await card.setFlag(ID,"genieDaoApplied",true);
 }finally{applying.delete(card.id);}
}
export function renderElementalSmite(message,html){
 const root=html instanceof HTMLElement?html:html?.[0];if(!root)return;
 const entries=[{card:message,root},...Array.from(root.querySelectorAll('.card-summary[data-message-id]'),node=>({card:game.messages.get(node.dataset.messageId),root:node})).filter(e=>e.card&&!e.root.hidden)];
 for(const entry of entries){entry.root.querySelectorAll(':scope > .rsa-genie-smite-actions').forEach(node=>node.remove());
  if(entry.card.isContentVisible===false)continue;const context=genieSmiteContext(entry.card);if(!context||!context.actor.isOwner||context.used||!context.available)continue;
  const controls=document.createElement("div");controls.className="rsa-attack-actions rsa-genie-smite-actions";
  for(const [option,spec]of Object.entries(GENIE_OPTIONS)){if(!context.feature.system.activities.get(spec.id))continue;const button=document.createElement("button");button.type="button";button.textContent="Elemental Smite — "+spec.name;button.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();for(const b of controls.children)b.disabled=true;try{await useElementalSmite(entry.card,option);}catch(error){report(error);}finally{globalThis.Ugmuls55eAutomationChatRefresh?.card(entry.card);}});controls.append(button);}
  entry.root.append(controls);
 }
}
function report(error){console.error("Genie Elemental Smite",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"genieElementalSmiteAutomation",{name:"Genie Elemental Smite Assistance",hint:"Offer the four Elemental Smite choices after Divine Smite damage. Spend one Channel Divinity use, apply Dao’s grapple with an action escape, and reuse native effects, saves and damage. Teleporting and forced movement remain manual.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{game.socket?.on("module."+ID,packet=>receive(packet).catch(report));Hooks.on("dnd5e.renderChatMessage",renderElementalSmite);for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>applyDaoCrush(card).catch(report));});
