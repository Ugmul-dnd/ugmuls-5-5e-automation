import {createEventQueue,describeTarget} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),wrapped=new WeakSet(),tracked=new Map(),reverting=new Set();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const resolve=ref=>typeof ref==="string"?globalThis.fromUuidSync?.(ref,{strict:false}):ref;
const enabled=()=>game.settings.get(ID,"semblanceOfLifeAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export const semblanceFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="semblance-of-life");
const remaining=i=>Number(i?.system?.uses?.value??(Number(i?.system?.uses?.max)-Number(i?.system?.uses?.spent??0)))||0;
const tokenDoc=t=>t?.document??t;
const summonAcId="dnd5eACBonus".padEnd(16,"0");
function validTint(data){
 const texture=(data.prototypeToken??={}).texture??={},tint=texture.tint;
 // Prepared token textures contain Color objects. Cloning a saved appearance
 // can strip their prototype, producing {} which ColorField casts to blank.
 const color=typeof tint==="object"&&tint!==null?tint.css:tint;
 texture.tint=typeof color==="number"&&Number.isInteger(color)&&color>=0&&color<=0xffffff?"#"+color.toString(16).padStart(6,"0"):typeof color==="string"&&/^#[0-9a-f]{6}$/i.test(color.trim())?color.trim():"#ffffff";
 return data;
}
async function removeCompanionAc(actor){const effects=values(actor.effects).filter(e=>(e.id??e._id)===summonAcId),data=effects.map(e=>e.toObject?.()??foundry.utils.deepClone(e));if(effects.length)await actor.deleteEmbeddedDocuments("ActiveEffect",effects.map(e=>e.id??e._id));return data;}
async function restoreCompanionAc(actor,data){const ids=new Set(values(actor.effects).map(e=>e.id??e._id)),missing=(data??[]).filter(e=>e._id===summonAcId&&!ids.has(e._id));if(missing.length)await actor.createEmbeddedDocuments("ActiveEffect",missing,{keepId:true});}
async function restoreFormItems(actor,items){const ids=new Set(values(actor.items).map(i=>i.id??i._id)),missing=(items??[]).filter(i=>!ids.has(i._id));if(missing.length)await actor.createEmbeddedDocuments("Item",missing,{keepId:true});}
function linkedVestige(token,actor){
 if(key(token?.actor)!=="vestige-companion")return false;
 const origin=resolve(flag(token.actor,"semblanceForm")?.companionOrigin??token.actor.getFlag?.("dnd5e","summon.origin")),item=origin?.item??origin;
 return key(item)==="vestige-companion"&&item.actor?.uuid===actor.uuid;
}
export function validSemblanceTarget(source,target,actor){
 if(!source?.actor||source.actor.uuid!==actor?.uuid||!target?.actor||source.parent?.id!==target.parent?.id||target.actorLink===true||!linkedVestige(target,actor)||target.actor.isPolymorphed||flag(target.actor,"semblanceForm")||Number(target.actor.system?.attributes?.hp?.value)<=0)return false;
 if(source.level&&target.level&&source.level!==target.level)return false;
 const scene=source.parent,size=scene.grid.size,a={x:source.x+source.width*size/2,y:source.y+source.height*size/2},b={x:target.x+target.width*size/2,y:target.y+target.height*size/2};
 const grid=scene.grid.measurePath?scene.grid:globalThis.canvas?.scene?.id===scene.id?canvas.grid:null;
 const distance=grid?.measurePath?.([a,b])?.distance,limit=/^(m|meters?|metres?)$/i.test(scene.grid.units??"ft")?27.432:90;
 return Number.isFinite(distance)&&Math.max(distance,Math.abs(Number(source.elevation??0)-Number(target.elevation??0)))<=limit;
}
export function semblanceProfiles(activity,target){
 const companion=target?.actor,summon=companion?.getFlag?.("dnd5e","summon"),origin=resolve(summon?.origin),native=values(origin?.system?.activities).find(a=>a.id===summon?.activity),profile=values(native?.profiles).find(p=>p._id===summon?.profile);
 const ids=[profile?.uuid,companion?._stats?.compendiumSource,companion?._stats?.duplicateSource].filter(Boolean);
 const byId={aunCelestialVest:"celestial",aunFiendishVesti:"fiend",aunUndeadVestige:"undead"};
 // AU 1.0.2's Celestial companion omits its creature type. Its native summon
 // profile/compendium identity is authoritative; do not guess from token names.
 const type=ids.map(ref=>byId[ref.split('.').at(-1)]).find(Boolean)??companion?.system?.details?.type?.value;
 const feature=activity?.item;if(key(feature)!=="semblance-of-life")return [];
 // The published feature links each creature type to its native summon activity.
 const names={celestial:"Summon Celestial",fiend:"Summon Fiend",undead:"Summon Undead"};
 return values(feature.system?.activities).filter(a=>a.type==="summon"&&a.name===names[type]).flatMap(a=>values(a.profiles).map(p=>({activity:a,profile:p})));
}
export async function prepareSemblanceSpirit(activity,profile,companion){
 const base=await fromUuid(profile.uuid);if(!base?.toObject)throw Error("The native spirit stat block could not be loaded.");
 // Invoke the native feature's scaling and enchantment generation without
 // creating a spare token or changing the unscaled compendium/sidebar actor.
 const {actorUpdates,tokenUpdates}=await activity.getChanges(base,profile,{profile:profile._id}),data=base.toObject(),{items=[],effects=[],...rest}=actorUpdates;
 foundry.utils.mergeObject(data,rest);data.prototypeToken=foundry.utils.mergeObject(data.prototypeToken??{},tokenUpdates??{});
 const level=Number(activity.actor?.getRollData?.().classes?.warlock?.levels??activity.actor?.classes?.warlock?.system?.levels);
 if(!Number.isFinite(level)||level<14)throw Error("Semblance of Life requires Warlock level 14.");
 const spellLevel=Math.min(Math.floor(level/2),9);
 foundry.utils.mergeObject(data,{"flags.dnd5e.summon.level":spellLevel,"system.attributes.spell.level":spellLevel});
 const mergeEmbedded=(original,updates)=>{const map=new Map((original??[]).map(d=>[d._id,d]));for(const update of updates)map.set(update._id,foundry.utils.mergeObject(map.get(update._id)??{},update));return [...map.values()];};
 data.items=mergeEmbedded(data.items,items);data.effects=mergeEmbedded(data.effects,effects);
 const divine=values(companion.items).find(i=>key(i)==="divine-power");if(!divine)throw Error("The Vestige is missing its native Divine Power feature.");
 data.items=data.items.filter(i=>key(i)!=="divine-power");data.items.push(divine.toObject());
 data.system.attributes.hd=foundry.utils.deepClone(companion.toObject().system.attributes.hd);
 delete data._id;delete data.folder;data.prototypeToken.actorLink=false;
 // Actor construction already prepares native data. Calling prepareData again
 // redefines D&D5e 6's non-configurable movement shims (such as "walk").
 const prepared=new CONFIG.Actor.documentClass(validTint(data));
 const ac=Number(prepared.system.attributes.ac.value);if(!Number.isFinite(ac))throw Error("The scaled spirit has no valid AC.");
 // Native Transform bakes source AC.value into its flat AC. Passing the source
 // AC bonus effect too would count that bonus again. Prepare first, then bake
 // the effective AC into a separate, once-prepared transformation source.
 const baked=prepared.toObject();delete baked._id;baked.system.attributes.ac={...baked.system.attributes.ac,calcs:["flat"],flat:ac,override:null};delete baked.system.attributes.ac.calc;
 baked.effects=(baked.effects??[]).filter(e=>!(e.system?.changes??e.changes??[]).some(c=>c.key?.startsWith("system.attributes.ac.")));
 const nativeIds=new Set(values(companion.effects).map(e=>e.id??e._id));baked.effects=baked.effects.filter(e=>!nativeIds.has(e._id));
 const spirit=new CONFIG.Actor.documentClass(validTint(baked));
 const hp=Number(spirit.system.attributes.hp.max);if(!Number.isFinite(hp)||hp<=0)throw Error("The scaled spirit has no valid maximum HP.");
 return {spirit,hp};
}
function settings(pool){return new dnd5e.dataModels.settings.TransformationSetting({keep:["hp","tempHP","bio"],merge:[],effects:["all"],other:[],spellLists:[],minimumAC:"",tempFormula:String(pool),transformTokens:true});}
export function transformSemblance(actor,choice,user=game.user){return enqueue(async()=>{
 const feature=semblanceFeature(actor),source=resolve(choice?.source),target=resolve(choice?.target),request=choice?.request;
 if(!authority()||!enabled()||!feature||!user?.active||!(user.isGM||actor.testUserPermission?.(user,"OWNER"))||typeof request!=="string")throw Error("Semblance of Life requires your manifested Vestige within 90 feet and a connected GM.");
 const prior=flag(actor,"semblanceRequests")??[];if(prior.includes(request))return;
 if(!validSemblanceTarget(source,target,actor))throw Error("Select your manifested, untransformed Vestige within 90 feet.");
 const activity=values(feature.system.activities).find(a=>a.id===choice.activity),entry=semblanceProfiles({item:feature},target).find(e=>e.activity===activity&&e.profile._id===choice.profile);
 if(!entry||remaining(feature)<1)throw Error("Choose a spirit matching the Vestige’s type and an available Semblance of Life use.");
 const level=Number(actor.getRollData?.().classes?.warlock?.levels??actor.classes?.warlock?.system?.levels);if(!Number.isFinite(level)||level<14)throw Error("Semblance of Life requires Warlock level 14.");
 const {spirit,hp}=await prepareSemblanceSpirit(activity,entry.profile,target.actor);
 if(!validSemblanceTarget(source,target,actor)||remaining(feature)<1)throw Error("The Vestige or feature use changed before transformation.");
 const spent=Number(feature.system.uses.spent??0),pool=Math.max(Number(target.actor.system.attributes.hp.temp??0),hp),companionOrigin=target.actor.getFlag("dnd5e","summon.origin"),original=target.actor.toObject();
 const formula=original.system.attributes.hp.formula??"",die=Number(target.actor.system.attributes.hd.denomination??formula.match(/d(\d+)/i)?.[1]);
 if(!Number.isFinite(die)||die<=0)throw Error("The Vestige’s native Hit Dice denomination could not be read.");
 // NPCs with a blank HP formula infer their Hit Die from creature size. Pin
 // just the denomination with zero base dice, retaining native HD bonus effects
 // rather than adding the scaled companion's Hit Dice a second time.
 const hitDiceFormula=/\d*d\d+/i.test(formula)?formula:"0d"+die;
 if(original.flags?.[ID])delete original.flags[ID].semblanceEnded;
 const appearance=Object.fromEntries(["name","width","height","alpha","lockRotation","ring","texture"].filter(k=>target[k]!==undefined).map(k=>[k,foundry.utils.deepClone(target[k]?.toObject?.()??target[k])]));
 let charged=false,transformed=false,card,removedAc=[];
 try{
  await feature.update({"system.uses.spent":spent+1});charged=true;
  const result=await activity.use({consume:false,concentration:{begin:false},create:{summons:false,measuredTemplate:false},subsequentActions:false,rsaSemblanceInternal:true},{configure:false},{data:{system:{targets:[describeTarget(target)]},flags:{[ID]:{semblanceUse:{request,token:target.uuid,actor:actor.uuid,source:source.uuid},riderTriggered:true}}}});
  card=result?.message;if(!card)throw Error("Semblance of Life could not create its native usage card.");
  if(!validSemblanceTarget(source,target,actor))throw Error("The Vestige moved or changed before transformation.");
  removedAc=await removeCompanionAc(target.actor);
  await target.actor.transformInto(spirit,settings(pool),{renderSheet:false});
  if(!target.actor.isPolymorphed)throw Error("Native transformation did not complete.");transformed=true;
  await restoreFormItems(target.actor,spirit.toObject().items);
  const state={spellLevel:Math.min(Math.floor(level/2),9),request,caster:actor.uuid,feature:feature.uuid,companionOrigin,card:card.id,pool,spiritHp:hp,expires:Number(game.time.worldTime)+3600,original,appearance,hitDiceFormula,spiritEffects:values(spirit.effects).map(e=>e.id??e._id)};
  await target.actor.update({["flags."+ID+".semblanceForm"]:state,"flags.dnd5e.summon.level":state.spellLevel,"system.attributes.hp.formula":hitDiceFormula});tracked.set(target.uuid,target);
  if(flag(target.actor,"semblanceEnded"))await target.actor.unsetFlag(ID,"semblanceEnded");
  await actor.setFlag(ID,"semblanceRequests",[...prior.slice(-63),request]);
  globalThis.Ugmuls55eAutomationChatRefresh?.card(card);return target;
 }catch(error){
  transformed ||= target.actor.isPolymorphed;
  let restored=target.actor;
  if(transformed){try{const result=await target.actor.revertOriginalForm({renderSheet:false});restored=result?.actor??result??target.actor;transformed=false;}catch(revertError){console.error("Semblance rollback",revertError);}}
  if(!transformed&&removedAc.length)await restoreCompanionAc(restored,removedAc);
  if(charged&&!transformed)await feature.update({"system.uses.spent":Math.max(0,Number(feature.system.uses.spent??0)-1)});
  if(card)await card.setFlag(ID,"semblanceFailed",true);throw error;
 }
});}
export function installSemblanceRevert(Type){
 const p=Type?.prototype;if(!p?.revertOriginalForm||wrapped.has(p))return;wrapped.add(p);const revert=p.revertOriginalForm;
 p.revertOriginalForm=async function(...args){
  const state=flag(this,"semblanceForm");if(!state)return revert.apply(this,args);
  const token=this.token,ref=token?.uuid??this.uuid;if(reverting.has(ref))return;reverting.add(ref);
  const hp=this.system.attributes.hp,hd=this.system.attributes.hd,divine=values(this.items).find(i=>key(i)==="divine-power"),spent=Number(divine?.system?.uses?.spent??0);
  const undoForm=args[0]?.rsaSemblanceReason==="depleted"?this.toObject():null;
  if(undoForm?.flags?.[ID]){delete undoForm.flags[ID].semblanceForm;delete undoForm.flags[ID].semblanceEnded;}
  try{
   let result,restored;
   if(state.original&&this.isToken!==false&&token){
    // Native unlinked reversion deletes/recreates the token, invalidating
    // recorded damage targets and Undo actor UUIDs. Feed the saved original
    // form back through native Transform instead, retaining this token's ID.
    const data=foundry.utils.deepClone(state.original);delete data._id;data.effects=[];
    data.prototypeToken=foundry.utils.mergeObject(data.prototypeToken??{},state.appearance??{});data.system.attributes.hd=foundry.utils.deepClone(hd.toObject?.()??hd);
    const originalForm=new CONFIG.Actor.documentClass(validTint(data));
    await this.transformInto(originalForm,settings(state.newerTemp?Number(hp.temp??0):0),{renderSheet:false});
    restored=token.actor;result=token;
    // ActorDelta tombstones from the forward transform survive actor.update.
    // Recreate missing original items explicitly to resurrect their stable IDs.
    await restoreFormItems(restored,state.original.items);
    const introduced=new Set(state.spiritEffects??[]),ids=values(restored.effects).filter(e=>introduced.has(e.id??e._id)).map(e=>e.id??e._id);
    if(ids.length)await restored.deleteEmbeddedDocuments("ActiveEffect",ids);
    await restoreCompanionAc(restored,state.original.effects);
    await restored.update({[state.original.flags?.dnd5e?.summon?.level===undefined?"flags.dnd5e.summon.-=level":"flags.dnd5e.summon.level"]:state.original.flags?.dnd5e?.summon?.level??null,name:state.original.name,"flags.dnd5e.-=isPolymorphed":null,"flags.dnd5e.-=originalActor":null,"flags.dnd5e.-=previousActorIds":null,"flags.dnd5e.-=transformOptions":null});
    await token.update({name:state.appearance?.name??state.original.name,"flags.dnd5e.-=previousActorData":null,"flags.dnd5e.-=previousTokenData":null});
   }else{result=await revert.apply(this,args);restored=result?.actor??result;}
   if(!restored?.update)return result;
   await restored.update({"system.attributes.hp.value":hp.value,"system.attributes.hp.temp":state.newerTemp?Number(hp.temp??0):0,"system.attributes.hd.spent":Number(hd.spent??0),"system.attributes.hp.formula":state.original?.system.attributes.hp.formula??hp.formula});
   const power=values(restored.items).find(i=>key(i)==="divine-power");if(power&&Number(power.system.uses.spent??0)!==spent)await power.update({"system.uses.spent":spent});
   if(flag(restored,"semblanceForm"))await restored.unsetFlag(ID,"semblanceForm");tracked.delete(ref);
   if(undoForm)await restored.setFlag(ID,"semblanceEnded",{state,form:undoForm});
   else if(flag(restored,"semblanceEnded"))await restored.unsetFlag(ID,"semblanceEnded");
   const card=game.messages.get(state.card);if(card)await card.setFlag(ID,"semblanceReverted",true);return result;
  }finally{reverting.delete(ref);}
 };
}
export function captureSemblanceTemp(actor,changes,options={}){
 const state=flag(actor,"semblanceForm"),next=changes['system.attributes.hp.temp']??changes.system?.attributes?.hp?.temp;
 if(!state||next===undefined||options.rsaUndoDamage||reverting.has(actor.token?.uuid))return;
 // A later, larger temp-HP grant belongs to its own source and must survive
 // ending this form. Damage reductions do not transfer ownership of the pool.
 if(Number(next)>Number(actor.system.attributes.hp.temp??0)&&!state.newerTemp)changes['flags.'+ID+'.semblanceForm.newerTemp']=true;
}
function semblanceLevel(state){const caster=resolve(state.caster),level=Number(caster?.getRollData?.().classes?.warlock?.levels??caster?.classes?.warlock?.system?.levels);return state.spellLevel??(Number.isFinite(level)?Math.min(Math.floor(level/2),9):undefined);}
export function expireSemblance(){return enqueue(async()=>{
 if(!authority()||!enabled())return;
 for(const [uuid,stored]of tracked){if(reverting.has(uuid))continue;const token=resolve(uuid)??stored,state=flag(token.actor,"semblanceForm");if(!state||!token.actor.isPolymorphed){tracked.delete(uuid);continue;}
  // Native Transform keeps host flags. Repair older forms once as well as new forms.
  const spellLevel=semblanceLevel(state);if(spellLevel!==undefined&&token.actor.getFlag("dnd5e","summon.level")!==spellLevel)await token.actor.update({"flags.dnd5e.summon.level":spellLevel});
  const depleted=Number(token.actor.system.attributes.hp.temp??0)<=0;
  if(depleted||Number(game.time.worldTime)>=state.expires)await token.actor.revertOriginalForm({renderSheet:false,rsaSemblanceReason:depleted?"depleted":"expired"});
 }
});}
export function restoreSemblanceUndo(actor){return enqueue(async()=>{
 const ended=flag(actor,"semblanceEnded"),token=actor?.token;
 if(!authority()||!enabled()||!token||!ended||actor.isPolymorphed||Number(actor.system.attributes.hp.temp??0)<=0||Number(game.time.worldTime)>=ended.state.expires)return;
 const data=foundry.utils.deepClone(ended.form);delete data._id;
 const ids=new Set(values(actor.effects).map(e=>e.id??e._id));data.effects=(data.effects??[]).filter(e=>!ids.has(e._id));
 data.system.attributes.hd=foundry.utils.deepClone(actor.system.attributes.hd.toObject?.()??actor.system.attributes.hd);
 const divine=values(actor.items).find(i=>key(i)==="divine-power");if(divine)data.items=data.items.filter(i=>key(i)!=="divine-power").concat([divine.toObject()]);
 const form=new CONFIG.Actor.documentClass(validTint(data)),removedAc=await removeCompanionAc(actor);
 try{await actor.transformInto(form,settings(Number(actor.system.attributes.hp.temp)),{renderSheet:false});}catch(error){await restoreCompanionAc(actor,removedAc);throw error;}
 await restoreFormItems(token.actor,data.items);
 await token.actor.update({["flags."+ID+".semblanceForm"]:ended.state,"flags.dnd5e.summon.level":semblanceLevel(ended.state),"system.attributes.hp.formula":ended.state.hitDiceFormula});await token.actor.unsetFlag(ID,"semblanceEnded");tracked.set(token.uuid,token);
 const card=game.messages.get(ended.state.card);if(card)await card.setFlag(ID,"semblanceReverted",false);
});}
function rebuild(){tracked.clear();for(const scene of values(game.scenes))for(const token of values(scene.tokens))if(flag(token.actor,"semblanceForm"))tracked.set(token.uuid,token);}
async function choose(activity){
 const actor=activity.actor,raw=tokenDoc(activity.getUsageToken?.()),source=raw??values(canvas.scene?.tokens).find(t=>t.actor?.uuid===actor.uuid),targets=values(source?.parent?.tokens).filter(t=>validSemblanceTarget(source,t,actor));
 if(!targets.length)throw Error("No linked, untransformed Vestige within 90 feet. Manifest your Vestige Companion first (using its native unlinked summon token).");
 const entries=targets.flatMap(t=>semblanceProfiles(activity,t).filter(e=>e.activity.id===activity.id).map(e=>({target:t,...e})));if(!entries.length)throw Error("This summon activity does not match your Vestige’s creature type.");
 const labels=await Promise.all(entries.map(async e=>e.profile.name||(await fromUuid(e.profile.uuid))?.name||e.activity.name));
 const escape=foundry.utils.escapeHTML,selection=await foundry.applications.api.DialogV2.wait({window:{title:"Semblance of Life"},rejectClose:false,content:'<p>Transform your existing Vestige. Retain its HP, Hit Dice, and Divine Power; gain the spirit’s scaled statistics and temporary HP for up to 1 hour.</p><select name="semblanceChoice">'+entries.map((e,i)=>'<option value="'+i+'">'+escape(e.target.name)+' — '+escape(labels[i])+'</option>').join('')+'</select>',buttons:[{action:"transform",label:"Transform Vestige",default:true,callback:(event,button,dialog)=>dialog.element.querySelector('[name="semblanceChoice"]').value},{action:"cancel",label:"Cancel",callback:()=>null}]});
 if(selection===null||selection===false||selection===undefined)return null;const entry=entries[Number(selection)];if(!entry)throw Error("Invalid Vestige selection.");
 return {source:source.uuid,target:entry.target.uuid,activity:entry.activity.id,profile:entry.profile._id,request:foundry.utils.randomID()};
}
export function installSemblanceUse(Type){
 const p=Type?.prototype;if(!p?.use||wrapped.has(p))return;wrapped.add(p);const use=p.use,ownUse=Object.hasOwn(p,"use");
 p.use=async function(usage={},...args){
  // Summon normally inherits use(). Respect shared wrappers installed later
  // rather than pinning all summon activities to an early base implementation.
  if(!enabled()||key(this.item)!=="semblance-of-life"||this.type!=="summon"||usage.rsaSemblanceInternal)return (ownUse?use:Object.getPrototypeOf(p).use).call(this,usage,...args);
  try{
   if(!this.actor?.isOwner)throw Error("Only the Warlock’s owner can use Semblance of Life.");if(remaining(this.item)<1)throw Error("No Semblance of Life uses remain.");
   const choice=await choose(this);if(!choice)return;const gm=game.users.activeGM;
   if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"semblanceTransform",actor:this.actor.uuid,choice,user:game.user.id,gm:gm.id});else await transformSemblance(this.actor,choice);
  }catch(error){report(error);}
 };
}
export function renderSemblance(message,html){
 const root=html instanceof HTMLElement?html:html?.[0];if(!root)return;const entries=[{card:message,root}];for(const node of root.querySelectorAll('.card-summary[data-message-id]')){const card=game.messages.get(node.dataset.messageId);if(card&&!node.hidden)entries.push({card,root:node});}
 for(const e of entries){const link=flag(e.card,"semblanceUse");if(!link)continue;e.root.querySelectorAll(':scope > .rsa-semblance').forEach(n=>n.remove());
  for(const button of e.root.querySelectorAll('[data-action="placeSummons"]'))button.hidden=true;
  const actor=resolve(link.actor);if(e.card.isContentVisible===false||!(game.user.isGM||actor?.isOwner)||flag(e.card,"semblanceReverted")||flag(e.card,"semblanceFailed"))continue;
  const button=document.createElement("button");button.type="button";button.className="rsa-semblance";button.textContent="Revert Vestige";button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();button.disabled=true;const gm=game.users.activeGM;if(gm&&gm.id!==game.user.id)game.socket.emit("module."+ID,{action:"semblanceRevert",card:e.card.id,user:game.user.id,gm:gm.id});else revertFromCard(e.card,game.user).catch(report).finally(()=>{button.disabled=false;});});e.root.append(button);
 }
}
async function revertFromCard(card,user){
 if(!authority())return;const link=flag(card,"semblanceUse"),actor=resolve(link?.actor),token=resolve(link?.token),state=flag(token?.actor,"semblanceForm");
 if(!user?.active||!actor||!(user.isGM||actor.testUserPermission(user,"OWNER"))||!state||state.request!==link.request)return;
 await enqueue(()=>token.actor.revertOriginalForm({renderSheet:false}));
}
function report(error){console.error("Semblance of Life",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"semblanceOfLifeAutomation",{name:"Vestige: Semblance of Life",hint:"Use native summon scaling and Transform on the linked Vestige within 90 feet. Preserve HP, Hit Dice and Divine Power, grant spirit HP as temporary HP, and revert at 0 temporary HP or after 1 hour. Requires an active GM.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 installSemblanceUse(CONFIG.DND5E.activityTypes.summon?.documentClass);installSemblanceRevert(CONFIG.Actor.documentClass);rebuild();
 Hooks.on("canvasReady",()=>{rebuild();expireSemblance().catch(report);});Hooks.on("preUpdateActor",captureSemblanceTemp);Hooks.on("updateActor",(actor,changes,options)=>{if(options?.rsaUndoDamage&&flag(actor,"semblanceEnded"))restoreSemblanceUndo(actor).catch(report);else if(flag(actor,"semblanceForm"))expireSemblance().catch(report);});Hooks.on("updateWorldTime",()=>expireSemblance().catch(report));Hooks.on("deleteToken",token=>tracked.delete(token.uuid));Hooks.on("dnd5e.renderChatMessage",renderSemblance);
 expireSemblance().catch(report);
 game.socket.on("module."+ID,packet=>{
  if(packet?.action==="semblanceError"&&packet.user===game.user.id){ui.notifications.error(packet.error);return;}
  if(!["semblanceTransform","semblanceRevert"].includes(packet?.action)||!authority()||packet.gm!==game.user.id)return;
  const user=game.users.get(packet.user);if(!user?.active)return;
  const task=packet.action==="semblanceTransform"?transformSemblance(resolve(packet.actor),packet.choice,user):revertFromCard(game.messages.get(packet.card),user);
  task.catch(error=>{report(error);game.socket.emit("module."+ID,{action:"semblanceError",user:user.id,error:error.message});});
 });
});
