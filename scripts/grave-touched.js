import {dreadContext} from "./dread-ambusher.js";
import {activeForms} from "./form-of-dread.js";
import {createEventQueue,isRollAdjustmentLocked} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",channel="module."+ID,enqueue=createEventQueue(),choices=new WeakMap(),pending=new WeakMap(),settlements=new WeakMap(),claims=new Map(),waiting=new Map(),wrapped=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],key=d=>d?.identifier??d?.system?.identifier;
const enabled=()=>game.settings.get(ID,"graveTouchedAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
const resolve=ref=>typeof ref==="string"?(globalThis.fromUuidSync?.(ref,{strict:false})??game.messages.get(ref.replace(/^ChatMessage\./,""))):ref,live=e=>e&&!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired;
export const graveFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&i.system?.source?.rules!=="2014"&&(key(i)==="grave-touched"||i.name?.trim().toLowerCase()==="grave touched"));
const active=actor=>!!graveFeature(actor)&&values(actor?.effects).some(e=>flag(e,"graveTouched")&&live(e));
export async function syncGrave(actor){
 if(!authority()||!actor)return;const feature=enabled()?graveFeature(actor):null,effects=values(actor.effects).filter(e=>flag(e,"graveTouched"));
 if(!feature){if(effects.length)await actor.deleteEmbeddedDocuments("ActiveEffect",effects.map(e=>e.id));return;}
 if(effects.length>1)await actor.deleteEmbeddedDocuments("ActiveEffect",effects.slice(1).map(e=>e.id));if(effects.length)return;
 await actor.createEmbeddedDocuments("ActiveEffect",[{name:"Grave Touched",img:feature.img??"systems/dnd5e/icons/svg/damage/necrotic.svg",type:"base",origin:feature.uuid,disabled:false,transfer:false,duration:{value:null,units:"seconds",expiry:null,expired:false},system:{changes:[],origin:{actor:actor.uuid,item:feature.uuid}},flags:{[ID]:{graveTouched:true}},description:"Qualifying Necrotic damage ignores resistance, not immunity. Offer optional spell damage conversion and Dreaded Necrosis in damage configuration. Disable this effect to suspend these benefits."}]);
}
export function graveContext(app){
 const c=dreadContext(app),data=app.message?.data??{},card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app);let origin=resolve(data.system?.origin??card?.system?.origin);if(origin?.type==="attack")origin=resolve(origin.system?.origin);
 const records=data.system?.targets?.length?data.system.targets:card?.system?.targets??c.attack?.system?.targets??[],hits=values(c.attack?.system?.evaluatedTargets).filter(t=>t.isMiss===false&&records.some(r=>r.token===t.token));
 const target=hits.find(t=>t.token===choices.get(app)?.target)??hits[0];return {...c,feature:graveFeature(c.actor),origin,hits,target:target?.token,records};
}
export function stampGraveCast(activity,usage,dialog,message){
 const actor=activity?.actor??activity?.item?.actor;if(!enabled()||!active(actor)||activity?.item?.type!=="spell")return;
 message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],graveCast:{actor:actor.uuid,turn:turn()}};
}
const conversion=c=>flag(c.origin,"graveConversion"),used=(actor,k)=>!!turn()&&flag(actor,k)?.turn===turn();
function eligible(c){return enabled()&&c.actor?.isOwner&&active(c.actor)&&["attack","save","damage"].includes(c.activity?.type)&&!isRollAdjustmentLocked(c.attack)&&!c.activity?.item?.system?.healing;}
export function conversionEligible(c){return eligible(c)&&c.activity.item?.type==="spell"&&!!c.origin&&(!!conversion(c)||flag(c.origin,"graveCast")?.actor===c.actor.uuid&&flag(c.origin,"graveCast")?.turn===turn()&&!used(c.actor,"graveConversionTurn"));}
export function selectGrave(app,kind,value){choices.set(app,{...choices.get(app),[kind]:value});}
function convertRoll(roll){
 const copy=roll.constructor.fromData(foundry.utils.deepClone(roll.toJSON()));const original=roll.options.type;copy.options.type="necrotic";copy.options.types=["necrotic"];
 const rewrite=terms=>{for(const term of terms??[]){if(term.options?.flavor===original)term.options.flavor="necrotic";for(const child of term.rolls??[])rewrite(child.terms);if(term.roll)rewrite(term.roll.terms);}};rewrite(copy.terms);if(copy.data?.roll)copy.data.roll.damageType="necrotic";copy.resetFormula?.();return copy;
}
export function necrosisDice(rolls){return rolls.flatMap((roll,index)=>roll.options?.type==="necrotic"&&!roll.options?.rsaDreadedNecrosis?values(roll.dice).filter(d=>Number.isInteger(d.faces)&&d.faces>1).map(d=>({key:index+":"+d.faces,faces:d.faces,roll})):[]).filter((d,i,a)=>a.findIndex(x=>x.key===d.key)===i);}
export function finalizeGrave(app,rolls,{preview=false}={}){
 if(!preview)pending.delete(app);
 const c=graveContext(app);if(!eligible(c))return rolls;rolls=rolls.filter(r=>!r.options?.rsaDreadedNecrosis);const selected=choices.get(app)??{},inherited=conversion(c),convert=!!inherited||selected.convert===true&&conversionEligible(c);
 const count=app.config?.rolls?.length??1,result=rolls.map((r,i)=>convert&&i<count&&!['healing','temphp'].includes(r.options?.type)?convertRoll(r):r);
 const dice=necrosisDice(result),die=dice.find(d=>d.key===selected.die)??dice[0];let extra;
 if(!result.some(r=>r.options?.rsaDreadedNecrosis)&&selected.dread===true&&c.activity.type==="attack"&&c.target&&activeForms(c.actor).length&&!used(c.actor,"dreadedNecrosisTurn")&&die){
  extra=new CONFIG.Dice.DamageRoll(`1d${die.faces}[Dreaded Necrosis]`,{}, {type:"necrotic",types:["necrotic"],properties:values(die.roll.options?.properties),flavor:"Dreaded Necrosis",isCritical:c.activity.damage?.critical?.allow!==false&&die.roll.options?.isCritical===true,critical:{...die.roll.options?.critical,bonusDice:0,bonusDamage:""},rsaDreadedNecrosis:true});result.push(extra);
 }
 if(!preview&&(convert&&!inherited||extra))pending.set(app,{...c,convert:convert&&!inherited,extra,faces:die?.faces,turn:turn()});return result;
}
function updateRow(row,yes,disabled,usedFlag=false){const select=row?.querySelector?.("select");if(select){select.disabled=disabled||usedFlag;select.value=yes&&!select.disabled?"yes":"no";}row?.classList?.toggle("rsa-savage-used",disabled||usedFlag);}
export function addGraveChoices(app){
 const c=graveContext(app);if(!eligible(c))return;const selected=choices.get(app)??{},inherited=!!conversion(c);
 if(c.activity.item?.type==="spell"){
  const row=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"arcane-necrosis",label:"Arcane Necrosis — Necrotic spell damage",value:inherited||selected.convert===true,locked:inherited,disabled:!conversionEligible(c),used:!inherited&&used(c.actor,"graveConversionTurn"),change:yes=>selectGrave(app,"convert",yes)});updateRow(row,inherited||selected.convert===true,inherited||!conversionEligible(c),!inherited&&used(c.actor,"graveConversionTurn"));if(inherited){const select=row?.querySelector?.("select");if(select)select.value="yes";}
 }
 if(c.activity.type!=="attack"||!activeForms(c.actor).length||!c.target)return;
 const dice=necrosisDice(finalizeGrave(app,app.rolls??[],{preview:true}));const row=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"dreaded-necrosis",label:"Dreaded Necrosis — extra Necrotic die",value:selected.dread===true,disabled:!dice.length,used:used(c.actor,"dreadedNecrosisTurn"),change:yes=>selectGrave(app,"dread",yes)});updateRow(row,selected.dread===true,!dice.length,used(c.actor,"dreadedNecrosisTurn"));
 for(const el of values(row?.querySelectorAll?.("[data-grave-selector]")))el.remove();
 const chooser=(kind,entries,current)=>{if(!row||entries.length<2)return;const select=document.createElement("select");select.dataset.graveSelector=kind;select.setAttribute("aria-label",kind==="die"?"Dreaded Necrosis damage die":"Dreaded Necrosis target");for(const [value,label]of entries){const option=document.createElement("option");option.value=value;option.textContent=label;select.append(option);}select.value=current??entries[0][0];select.addEventListener("change",()=>{selectGrave(app,kind,select.value);app.rebuild();});row.querySelector(".form-fields")?.append(select);};
 chooser("die",dice.map(d=>[d.key,"d"+d.faces+" — "+(d.roll.options.flavor??"Necrotic damage")]),selected.die);chooser("target",c.hits.map(t=>[t.token,resolve(t.token)?.name??"Target"]),c.target);
}
export async function graveOperation(action,payload,user=game.user){
 if(!authority()||!user?.active)throw Error("A connected GM is required for Grave Touched.");
 if(action!=="claim"){
  const prior=claims.get(payload.request);if(!prior||prior.user!==user.id)return;
  if(action==="rollback"){
   const changes={};for(const [key,value]of Object.entries(prior.flags))if(flag(prior.actor,key)?.request===payload.request)changes[`flags.${ID}.${key}`]=value??null;
   if(Object.keys(changes).length)await prior.actor.update(changes);
   if(prior.convert&&flag(prior.origin,"graveConversion")?.request===payload.request)await prior.origin.unsetFlag(ID,"graveConversion");
  }
  claims.delete(payload.request);return;
 }
 if(claims.has(payload.request))return;
 const actor=resolve(payload.actor),origin=game.messages.get(payload.origin),attack=game.messages.get(payload.attack),activity=origin?.getAssociatedActivity?.();
 if(!enabled()||!actor||!(user.isGM||actor.testUserPermission?.(user,"OWNER"))||!active(actor)||payload.turn!==turn()||origin?.getAssociatedActor?.()?.uuid!==actor.uuid||typeof payload.request!=="string"||!payload.convert&&!payload.dread)throw Error("Grave Touched is no longer available for this roll.");
 const changes={},flags={};let convert=payload.convert&&!flag(origin,"graveConversion");
 if(convert){if(activity?.item?.type!=="spell"||flag(origin,"graveCast")?.actor!==actor.uuid||flag(origin,"graveCast")?.turn!==turn()||used(actor,"graveConversionTurn"))throw Error("Arcane Necrosis is already used this turn, or this spell was not just cast.");flags.graveConversionTurn=flag(actor,"graveConversionTurn");changes[`flags.${ID}.graveConversionTurn`]={turn:turn(),request:payload.request,cast:origin.id};}
 if(payload.dread){if(!activeForms(actor).length||used(actor,"dreadedNecrosisTurn")||attack?.getAssociatedActor?.()?.uuid!==actor.uuid||attack.getAssociatedActivity?.()?.type!=="attack"||!values(attack.system?.evaluatedTargets).some(t=>t.token===payload.target&&t.isMiss===false)||resolve(attack.system?.origin)?.id!==origin.id||!Number.isInteger(payload.faces)||payload.faces<2)throw Error("Dreaded Necrosis requires a confirmed hit, an active form and an unused turn.");flags.dreadedNecrosisTurn=flag(actor,"dreadedNecrosisTurn");changes[`flags.${ID}.dreadedNecrosisTurn`]={turn:turn(),request:payload.request,attack:attack.id};}
 await actor.update(changes);
 try{if(convert)await origin.setFlag(ID,"graveConversion",{actor:actor.uuid,turn:turn(),request:payload.request});}
 catch(error){await actor.update(Object.fromEntries(Object.entries(flags).map(([key,value])=>[`flags.${ID}.${key}`,value??null])));throw error;}
 claims.set(payload.request,{actor,origin,convert,flags,user:user.id});if(claims.size>256)claims.delete(claims.keys().next().value);
}
function operate(action,payload){
 const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return enqueue(()=>graveOperation(action,payload));
 const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error("The GM did not answer the Grave Touched request."));},10000);waiting.set(request,{resolve,reject,timer});game.socket.emit(channel,{action:"graveOperation",operation:action,payload,request,user:game.user.id,gm:gm.id});});
}
export async function commitGrave(app,options){
 const entry=pending.get(app);pending.delete(app);if(!entry||!options?.dnd5e?.submitted)return;
 const c=graveContext(app);if(!eligible(c)||entry.turn!==turn()||c.origin?.id!==entry.origin?.id||entry.extra&&c.target!==entry.target)throw Error("Grave Touched changed. Reopen the damage dialog.");
 const payload={request:foundry.utils.randomID(),actor:c.actor.uuid,origin:c.origin?.id,attack:c.attack?.id,target:c.target,convert:entry.convert,dread:!!entry.extra,faces:entry.faces,turn:entry.turn};await operate("claim",payload);settlements.set(app.message,payload);
 if(entry.extra){app.message.data.flags??={};app.message.data.flags[ID]={...app.message.data.flags[ID],dreadedNecrosis:{actor:c.actor.uuid,target:c.target,creature:resolve(c.target)?.actor?.uuid,properties:values(entry.extra.options.properties)}};}
}
export function installGraveRoll(Type=CONFIG.Dice.DamageRoll){
 if(!Type?.build||wrapped.has(Type))return;wrapped.add(Type);const build=Type.build;
 Type.build=async function(config,dialog,message={}){let success=false;try{const result=await build.call(this,config,dialog,message);success=!!result?.length;return result;}finally{const payload=settlements.get(message);if(payload){settlements.delete(message);try{await operate(success?"keep":"rollback",payload);}catch(error){report(error);}}}};
}

function warlockItem(item){return item?.system?.classIdentifier==="warlock"||item?.system?.sourceItem==="class:warlock"||key(item?.class)==="warlock"||[item?._stats?.compendiumSource,item?._stats?.duplicateSource,item?.flags?.core?.sourceId].some(r=>/\.(rhwUPFormofDreOJ|rhwUPGraveToucq1|rhwUPNecroticHYI|rhwUPSuperiorDCk)$/.test(r??""));}
export function graveOptions(card,options){
 card=resolve(card);if(!enabled()||options.rsaUndoDamage||options.ignore===true||options.ignore?.resistance===true)return options;
 const actor=card?.getAssociatedActor?.(),activity=card?.getAssociatedActivity?.(),item=activity?.item??card?.getAssociatedItem?.();if(!active(actor)||!(activity?.type==="attack"||["spell","feat"].includes(item?.type)&&warlockItem(item)))return options;
 const resistance=new Set(options.ignore?.resistance??[]);resistance.add("necrotic");return {...options,ignore:{...options.ignore,resistance}};
}
export function installGraveDamage(ActorType=CONFIG.Actor?.documentClass,TrayType=globalThis.customElements?.get?.("damage-application")){
 const p=TrayType?.prototype;if(p?.getMergedOptions&&!wrapped.has(p)){wrapped.add(p);const get=p.getMergedOptions;p.getMergedOptions=function(uuid){return {...graveOptions(this.chatMessage,get.call(this,uuid)),rsaGraveTarget:uuid};};}
 const a=ActorType?.prototype;if(!a?.calculateDamage||wrapped.has(a))return;wrapped.add(a);const calculate=a.calculateDamage;
 a.calculateDamage=function(damages,options={}){
  const card=resolve(options.originatingMessage??options.origin),meta=flag(card,"dreadedNecrosis"),next=graveOptions(card,options);
  if(!meta||options.rsaUndoDamage||!Array.isArray(damages)||(options.rsaGraveTarget?options.rsaGraveTarget===meta.target:this.uuid===meta.creature))return calculate.call(this,damages,next);
  let amount=(card.rolls??[]).filter(r=>r.options?.rsaDreadedNecrosis).reduce((n,r)=>n+Number(r.total??0),0);const props=values(meta.properties).sort().join("|");
  const filtered=damages.map(d=>{if(d.type!=="necrotic"||values(d.properties).sort().join("|")!==props||!(amount>0))return d;const remove=Math.min(Math.max(0,Number(d.value)||0),amount);amount-=remove;return {...d,value:d.value-remove};});return calculate.call(this,filtered,next);
 };
}
const actors=()=>new Set([...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor))].filter(Boolean));
function synchronize(actor){if(authority()&&actor&&(graveFeature(actor)||values(actor.effects).some(e=>flag(e,"graveTouched"))))enqueue(()=>syncGrave(actor)).catch(report);}
function report(error){console.error("Grave Touched",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"graveTouchedAutomation",{name:"Undead: Grave Touched",hint:"Manage a Grave Touched effect. Qualifying Necrotic damage ignores resistance, preserving immunity. Offer optional spell conversion and an extra Necrotic die on Form of Dread hits, each once per turn.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationGraveTouched={addGraveChoices,finalizeGrave,commitGrave};installGraveDamage();installGraveRoll();
 for(const actor of actors())synchronize(actor);Hooks.on("canvasReady",()=>{for(const actor of actors())synchronize(actor);});
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,item=>{if(item.type==="feat")synchronize(item.actor);});Hooks.on("createToken",token=>synchronize(token.actor));Hooks.on("createActor",synchronize);
 Hooks.on("updateSetting",setting=>{if(setting.key===ID+".graveTouchedAutomation")for(const actor of actors())synchronize(actor);});Hooks.on("dnd5e.preUseActivity",stampGraveCast);
 Hooks.on("dnd5e.preRollDamageV2",(config,dialog,message)=>{if(!eligible(graveContext({config,message})))return;const configure=dialog.configure;Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog("damage",dialog));if(configure===false)dialog.configure=false;});
 Hooks.on("dnd5e.postDamageRollConfiguration",(rolls,config,dialog,message)=>{if(dialog.configure===false){const result=finalizeGrave({config,message},rolls);rolls.splice(0,rolls.length,...result);}});
 Hooks.on("dnd5e.preCalculateDamage",(actor,damages,options)=>{const next=graveOptions(options.originatingMessage??options.origin,options);if(next!==options)options.ignore=next.ignore;});
 game.socket.on(channel,packet=>{
  if(packet?.action==="graveReply"&&packet.user===game.user.id){const entry=waiting.get(packet.request);if(!entry)return;waiting.delete(packet.request);clearTimeout(entry.timer);packet.error?entry.reject(Error(packet.error)):entry.resolve();return;}
  if(packet?.action!=="graveOperation"||!authority()||packet.gm!==game.user.id)return;const user=game.users.get(packet.user);if(!user?.active||!["claim","keep","rollback"].includes(packet.operation))return;
  enqueue(()=>graveOperation(packet.operation,packet.payload,user)).then(()=>game.socket.emit(channel,{action:"graveReply",request:packet.request,user:user.id}),error=>game.socket.emit(channel,{action:"graveReply",request:packet.request,user:user.id,error:error.message}));
 });
});
