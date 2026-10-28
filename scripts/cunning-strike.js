const ID="ugmuls-5-5e-automation",choices=new WeakMap(),jobs=new Set();
const values=x=>Array.from(x?.values?.()??x??[]),key=x=>x?.identifier??x?.system?.identifier;
const enabled=()=>game.settings.get(ID,"cunningStrikeAutomation")===true;
export const cunningFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="cunning-strike"&&i.system?.source?.rules!=="2014");
export const terrifyFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="strike-fear"&&i.system?.source?.rules!=="2014");
export const deviousFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&key(i)==="devious-strikes"&&i.system?.source?.rules!=="2014");
const actorFor=app=>(app.message?.data?.speaker?ChatMessage.getSpeakerActor(app.message.data.speaker):null)??app.config?.subject?.actor;
export function cunningContext(app){
 const data=app.message?.data??{},pending=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),origin=data.system?.origin??pending?.system?.origin;
 const usage=typeof origin==="string"?game.messages.get(origin.replace(/^ChatMessage\./,"")):origin;
 const id=data.flags?.[ID]?.damageAttackId??pending?.getFlag?.(ID,"damageAttackId");
 const attack=(id?game.messages.get(id):null)??(usage?.type==="attack"?usage:values(usage?.getAssociatedRolls?.("attack")).sort((a,b)=>b.timestamp-a.timestamp)[0]);
 const targets=data.system?.targets?.length?data.system.targets:pending?.system?.targets?.length?pending.system.targets:usage?.system?.targets??[];
 const target=targets.length===1?globalThis.fromUuidSync?.(targets[0].token,{strict:false}):null,actor=actorFor(app),feature=cunningFeature(actor);
 return {actor,feature,attack,target,record:targets[0],hit:!!target&&attack?.system?.evaluatedTargets?.some(t=>t.token===target.uuid&&t.isMiss===false)};
}
export function cunningOptions(actor,target){
 const feature=cunningFeature(actor),scion=terrifyFeature(actor),devious=deviousFeature(actor),activities=values(feature?.system?.activities),advanced=values(devious?.system?.activities),size=target?.actor?.system?.traits?.size;
 const kit=values(actor?.items).some(i=>i.type==="tool"&&(key(i)==="poisoners-kit"||/poisoner['’]?s kit/i.test(i.name??"")));
 return [{key:"poison",label:"Poison",allowed:kit,activity:activities.find(a=>a.type==="save"&&(a.id==="n64fvJMT9fPUy7DH"||a.name==="Poison"))},
 {key:"trip",label:"Trip",allowed:["tiny","sm","med","lg"].includes(size),activity:activities.find(a=>a.type==="save"&&(a.id==="dWcCw1vTWRMx4YzD"||a.name==="Trip"))},
 {key:"withdraw",label:"Withdraw",allowed:true,activity:activities.find(a=>a.type==="utility"&&(a.id==="m2bRZ1YeD3yf9nV7"||a.name==="Withdraw"))},
 {key:"terrify",label:"Terrify",cost:1,feature:scion,allowed:true,activity:values(scion?.system?.activities).find(a=>a.type==="save"&&(a.id==="p0Sf2KiK0hWXSc6x"||a.name==="Terrify"))},
 {key:"daze",label:"Daze",cost:2,feature:devious,allowed:true,activity:advanced.find(a=>a.type==="save"&&(a.id==="4TnBjQTJzt9UjUos"||a.name==="Daze"))},
 {key:"obscure",label:"Obscure",cost:3,feature:devious,allowed:true,activity:advanced.find(a=>a.type==="save"&&(a.id==="ki4lIPVGNA0HjEzH"||a.name==="Obscure"))},
 {key:"knock-out",label:"Knock Out",cost:6,feature:devious,allowed:true,activity:advanced.find(a=>a.type==="save"&&(a.id==="3eq7lcmpkJJBU2KO"||a.name==="Knock Out"))}
 ].filter(o=>o.activity).map(o=>({...o,feature:o.feature??feature,cost:o.cost??1}));
}
export function selectCunning(app,selected){choices.set(app,selected.filter(Boolean));}
function available(app){const c=cunningContext(app);return enabled()&&c.actor?.isOwner&&c.feature&&c.hit&&app.config?.subject?.type==="attack"&&app.config.subject.item?.type==="weapon"&&!app.message?.data?.flags?.[ID]?.masteryGraze;}
export function sneakDiceBudget(actor){
 const sneak=values(actor?.items).find(i=>i.type==='feat'&&(key(i)==='sneak-attack'||/^sneak attack$/i.test(i.name??'')));
 const damage=values(sneak?.system?.activities).find(a=>a.damage?.parts?.length),source=damage?.getDamageConfig?.()?.rolls?.[0];
 if(!source?.parts?.length)return null;
 const formula=source.parts.map(p=>typeof p==='string'?Roll.replaceFormulaData(p,source.data??actor.getRollData()):'').join('+'),dice=[...formula.matchAll(/(?<![\w.])(\d+)d6(?!\d)/g)];
 return dice.length===1?Number(dice[0][1]):null;
}
export function addCunningChoices(app,sneakSelected){
 if(!enabled()||!cunningFeature(actorFor(app)))return;
 const root=app.element,fieldset=root.querySelector('[data-application-part="configuration"] fieldset')??root.querySelector('fieldset');if(!fieldset)return;
 const c=cunningContext(app),options=cunningOptions(c.actor,c.target),count=values(c.actor?.items).some(i=>key(i)==="improved-cunning-strike")?2:1,selected=choices.get(app)??[],budget=sneakDiceBudget(c.actor);
 const affordable=(option,index)=>budget===null||!option?.cost||option.cost+(options.find(o=>o.key===selected[1-index])?.cost??0)<=budget;
 for(let index=0;index<count;index++){
  const existing=root.querySelector('[data-cunning-choice="'+index+'"]');
  if(existing){const select=existing.querySelector('select');if(select){select.disabled=!sneakSelected||!available(app);for(const el of select.options??[]){const option=options.find(o=>o.key===el.value);el.disabled=!!el.value&&(!option?.allowed||selected[1-index]===el.value||!affordable(option,index));}select.value=selected[index]??'';}continue;}
  const row=document.createElement('div');row.className='form-group';row.dataset.cunningChoice=String(index);
  const label=document.createElement('label');label.textContent=count===1?'Cunning Strike':'Cunning Strike '+(index+1);
  const fields=document.createElement('div');fields.className='form-fields';const select=document.createElement('select');select.setAttribute('aria-label',label.textContent);select.disabled=!sneakSelected||!available(app);
  for(const option of [{key:'',label:'None',allowed:true},...options]){const el=document.createElement('option');el.value=option.key;el.textContent=option.label+(option.cost?' — '+option.cost+' Sneak Attack '+(option.cost===1?'die':'dice'):'')+(option.key==='poison'&&!option.allowed?' (Poisoner’s Kit required)':option.key==='trip'&&!option.allowed?' (Large or smaller only)':'');el.disabled=!option.allowed||!affordable(option,index)||!!option.key&&selected[1-index]===option.key;select.append(el);}
  select.value=selected[index]??'';select.addEventListener('change',event=>{event.stopPropagation();const next=[...(choices.get(app)??[])];next[index]=select.value;choices.set(app,next);app.rebuild();});
  fields.append(select);row.append(label,fields);fieldset.append(row);
 }
}
export function reduceCunning(app,source,{preview=false}={}){
 const selected=(choices.get(app)??[]).filter(Boolean);if(!selected.length||!enabled())return source;
 if(!available(app))throw Error('Cunning Strike needs a confirmed single-target weapon hit. Reopen the damage prompt.');
 const c=cunningContext(app),limit=values(c.actor.items).some(i=>key(i)==='improved-cunning-strike')?2:1,options=cunningOptions(c.actor,c.target);
 if(selected.length>limit||new Set(selected).size!==selected.length||selected.some(k=>!options.some(o=>o.key===k&&o.allowed)))throw Error('The selected Cunning Strike options are no longer available.');
 const cost=selected.reduce((sum,k)=>sum+options.find(o=>o.key===k).cost,0);
 const parts=source.parts.map(p=>typeof p==='string'?Roll.replaceFormulaData(p,source.data??c.actor.getRollData()):p),dice=[];
 parts.forEach((p,index)=>{if(typeof p==='string')for(const m of p.matchAll(/(?<![\w.])(\d+)d6(?!\d)/g))dice.push({index,number:Number(m[1]),offset:m.index,length:m[0].length});});
 if(dice.length!==1||dice[0].number<cost)throw Error('Cunning Strike needs enough native Sneak Attack dice for its cost.');
 const d=dice[0],part=parts[d.index];parts[d.index]=part.slice(0,d.offset)+(d.number-cost)+'d6'+part.slice(d.offset+d.length);
 const job={actor:c.actor.uuid,feature:c.feature.id,target:c.target.uuid,choices:selected,cost};
 return {...source,parts,options:{...source.options,flavor:'Sneak Attack — '+selected.map(k=>options.find(o=>o.key===k).label).join(' + ')+' (−'+cost+' dice)',rsaCunningStrike:job}};
}
export function prepareTerrifyData(data,id,actor){
 const activity=data.system.activities[id];
 // Imported/older owned features can retain a save activity without a usable
 // effect profile. Make the generated save self-contained; leave the item alone.
 const profiles=new Set((activity.effects??[]).map(e=>e._id));
 data.effects??=[];
 let effect=data.effects.find(e=>profiles.has(e._id)&&((e.statuses??[]).includes('frightened')||/terrify/i.test(e.name??'')))??data.effects.find(e=>e._id==='QCrtOB3YmjifFdTO'||e.name==='Strike Fear: Terrify');
 if(!effect){effect={_id:'QCrtOB3YmjifFdTO',img:'systems/dnd5e/icons/svg/statuses/frightened.svg',type:'base',system:{changes:[]}};data.effects.push(effect);}
 effect.name='Strike Fear: Terrify';effect.disabled=false;effect.transfer=false;effect.origin=actor.uuid;
 effect.statuses=Array.from(new Set([...(effect.statuses??[]),'frightened']));
 effect.duration={value:60,units:'seconds',expiry:'turnStart',expired:false};effect.start=null;
 effect.flags??={};effect.flags[ID]={...effect.flags[ID],terrifySource:actor.uuid};effect.flags.dnd5e={...effect.flags.dnd5e,isTemporary:true};
 activity.effects=[{_id:effect._id,onSave:false}];activity.appliedEffects=[effect._id];
 return effect;
}
const authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export async function resolveCunning(card){
 const job=card?.rolls?.find(r=>r.options?.rsaCunningStrike)?.options.rsaCunningStrike;
 if(!enabled()||!authority()||!job||card.type!=='damage'||card.getFlag?.(ID,'pendingDamage')||card.getFlag?.(ID,'hpApplicationRecorded')!==true||jobs.has(card.id))return;
 const ledger=card.getFlag(ID,'cunningResolved')??[];if(job.choices.every(k=>ledger.includes(k)))return;
 jobs.add(card.id);
 try{
 const actor=await fromUuid(job.actor),target=await fromUuid(job.target),feature=actor?.items?.get(job.feature);
 if(!actor||!target?.actor||key(feature)!=='cunning-strike'||job.choices.length>2||new Set(job.choices).size!==job.choices.length)return;
 const source=card.getAssociatedActor?.();if(source?.uuid!==actor.uuid)return;
 if(!card.author?.isGM&&!actor.testUserPermission?.(card.author,'OWNER'))return;
 const limit=values(actor.items).some(i=>key(i)==='improved-cunning-strike')?2:1;if(job.choices.length>limit)return;
 // Recorded damage recipients, never current canvas selection, own the follow-up.
 if(!(card.system?.targets??[]).some(t=>t.token===job.target))return;
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  for(const choice of job.choices){
   if(ledger.includes(choice))continue;
   if(choice==='withdraw'){ledger.push(choice);await card.setFlag(ID,'cunningResolved',[...ledger]);continue;}
   const option=cunningOptions(actor,target).find(o=>o.key===choice);if(!option||!option.allowed)throw Error('Cunning Strike '+choice+' is no longer valid for this target.');
   const sourceFeature=option.feature,data=sourceFeature.toObject(),id=option.activity.id,use=data.system.activities[id];
   if(choice==='terrify')prepareTerrifyData(data,id,actor);
   if(choice==='trip'){
    const icon='systems/dnd5e/icons/svg/statuses/prone.svg';
    data.img=icon;use.img=icon;
    const ids=new Set((use.effects??[]).map(profile=>profile._id??profile.uuid?.split('.').at(-1)));
    for(const effect of data.effects??[])if(ids.has(effect._id))effect.img=icon;
   }
   // Preserve the owned feature UUID on this disposable copy so applied effects resolve their source.
   data._id=sourceFeature.id;
   if(['daze','obscure','knock-out'].includes(choice)){
    const effectIds=new Set((use.effects??[]).map(profile=>profile._id??profile.uuid?.split('.').at(-1)));
    for(const effect of data.effects??[])if(effectIds.has(effect._id)){
     effect.flags??={};effect.flags[ID]={...effect.flags[ID],deviousStrike:{choice,feature:sourceFeature.uuid}};
     effect.flags.dnd5e={...effect.flags.dnd5e,isTemporary:true};
     effect.duration=choice==='knock-out'?{value:60,units:'seconds',expiry:'turnStart',expired:false}:{value:null,units:'seconds',expiry:'targetEnd',expired:false};
    }
    const icons={obscure:'systems/dnd5e/icons/svg/statuses/blinded.svg','knock-out':'systems/dnd5e/icons/svg/statuses/unconscious.svg'};
    if(icons[choice]){data.img=use.img=icons[choice];for(const effect of data.effects??[])if(effectIds.has(effect._id))effect.img=icons[choice];}
   }
   use.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};use.activation={type:'',value:null,override:true};use.damage={...use.damage,parts:[],onSave:'none'};
   if(choice==='poison')globalThis.Ugmuls55eAutomationEnvenom?.prepareEnvenomPoison(data,id,actor);
   use.target={override:true,prompt:false,template:{type:''},affects:{type:'creature',count:'1',choice:false}};
   const helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
   const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false}},{configure:false},{data:{system:{targets:[{...((card.system.targets??[]).find(t=>t.token===job.target))}]},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,...(data.flags?.[ID]?.envenomPoison?{envenomPoison:data.flags[ID].envenomPoison}:{}),cunningStrikeSave:{damageId:card.id,choice,target:job.target,sourceFeature:sourceFeature.uuid}}}}});
   if(!result?.message)throw Error('Could not create the Cunning Strike save card.');
   ledger.push(choice);await card.setFlag(ID,'cunningResolved',[...ledger]);
  }
 }finally{jobs.delete(card.id);}
}
function report(error){console.error('Cunning Strike',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'cunningStrikeAutomation',{name:'Cunning Strike Assistance',hint:'Choose Cunning Strike and owned Devious Strikes options with Sneak Attack. Deduct dice before critical scaling; save options follow applied damage. Poison requires a carried Poisoner’s Kit. Withdraw movement stays manual.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationCunning={addCunningChoices,reduceCunning};for(const event of ['createChatMessage','updateChatMessage'])Hooks.on(event,card=>{if(card?.rolls?.some(r=>r.options?.rsaCunningStrike))resolveCunning(card).catch(report);});});

const live=effect=>!effect.disabled&&effect.active!==false&&!effect.duration?.expired&&effect.system?.expired!==true;
const deviousFlag=effect=>effect.getFlag?.(ID,'deviousStrike')??effect.flags?.[ID]?.deviousStrike;
function deviousFromCard(effect,changes={}){
 const ref=changes.system?.origin?.message??changes['system.origin.message']??effect.system?.origin?.message;
 const card=ref?(globalThis.fromUuidSync?.(ref,{strict:false})??game.messages.get(ref.replace(/^ChatMessage\./,''))):null;
 const link=card?.getFlag?.(ID,'cunningStrikeSave');
 return ['daze','obscure','knock-out'].includes(link?.choice)?{choice:link.choice,feature:link.sourceFeature}:null;
}
function deviousApplication(effect,changes={}){
 const marker=deviousFromCard(effect,changes)??deviousFlag(effect);if(!marker)return null;
 const combat=game.combat,start=CONFIG.ActiveEffect.documentClass.getEffectStart();
 const applied=combat?.started?{combat:combat.id,round:combat.round,turn:combat.turn}:null;
 return {start,marker:{...marker,...(applied?{applied}:{})},duration:marker.choice==='knock-out'?{value:60,units:'seconds',expiry:'turnStart',expired:false}:{value:null,units:'seconds',expiry:'targetEnd',expired:false}};
}
export function prepareDeviousEffect(effect){
 if(effect.parent?.documentName!=='Actor')return;
 const entry=deviousApplication(effect);if(!entry)return;
 effect.updateSource({start:entry.start,duration:entry.duration,['flags.'+ID+'.deviousStrike']:entry.marker,'flags.dnd5e.isTemporary':true});
}
export function prepareDeviousUpdate(effect,changes){
 if(effect.parent?.documentName!=='Actor'||(!changes.start&&!changes.system?.origin?.message&&!changes['system.origin.message']))return;
 // Undo restores the recorded application clock rather than starting a new duration.
 if(changes.flags?.[ID]?.deviousStrike?.applied||changes['flags.'+ID+'.deviousStrike']?.applied)return;
 const entry=deviousApplication(effect,changes);if(!entry)return;
 changes.duration=entry.duration;changes['flags.'+ID+'.deviousStrike']=entry.marker;changes['flags.dnd5e.isTemporary']=true;
}
const endingDevious=new Set();
export async function expireDeviousTurn(combat,changes={}){
 if(!authority()||combat.started===false||!(Object.hasOwn(changes,'turn')||Object.hasOwn(changes,'round')))return;
 const previous=combat.previous;if(!previous?.combatantId||previous.round===combat.round&&previous.turn===combat.turn)return;
 const actor=combat.combatants.get(previous.combatantId)?.actor;if(!actor||endingDevious.has(actor.uuid))return;
 const ids=[];
 // Only the outgoing combatant is inspected; no scene/world scan on turn changes.
 for(const effect of values(actor.effects)){
  const marker=deviousFlag(effect)??deviousFromCard(effect);if(!['daze','obscure'].includes(marker?.choice))continue;
  const fallback=effect.start,created=marker.applied??(fallback?{combat:fallback.combat?.id??fallback.combat??fallback.combatId,round:fallback.round,turn:fallback.turn}:null);
  if(created?.combat!==combat.id||!Number.isInteger(created.round)||!Number.isInteger(created.turn))continue;
  if(previous.round>created.round||previous.round===created.round&&previous.turn>created.turn)ids.push(effect.id);
 }
 if(!ids.length)return;endingDevious.add(actor.uuid);
 try{await actor.deleteEmbeddedDocuments('ActiveEffect',ids);}finally{endingDevious.delete(actor.uuid);}
}
export async function wakeDeviousTarget(actor,amount,options={}){
 if(!Number.isFinite(amount)||amount<=0||options.rsaUndoDamage)return;
 const effects=values(actor?.effects).filter(e=>live(e)&&(deviousFlag(e)??deviousFromCard(e))?.choice==='knock-out');if(!effects.length)return;
 const ref=options.origin??options.originatingMessage,origin=typeof ref==='string'?game.messages.get(ref.replace(/^ChatMessage\./,'')):ref;
 if(!authority()){if(game.users.activeGM&&actor.isOwner)game.socket.emit('module.'+ID,{action:'deviousDamageTaken',actor:actor.uuid,effects:effects.map(e=>e.id),amount,source:origin?.id,user:game.user.id,gm:game.users.activeGM.id});return;}
 await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(origin);
 const ids=effects.filter(e=>live(e)&&values(actor.effects).includes(e)).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments('ActiveEffect',ids);
}
Hooks.once('ready',()=>{
 Hooks.on('preCreateActiveEffect',prepareDeviousEffect);
 Hooks.on('preUpdateActiveEffect',prepareDeviousUpdate);
 Hooks.on('updateCombat',(combat,changes)=>expireDeviousTurn(combat,changes).catch(report));
 Hooks.on('dnd5e.applyDamage',(actor,amount,options)=>wakeDeviousTarget(actor,amount,options).catch(report));
 game.socket.on('module.'+ID,packet=>{
  if(packet?.action!=='deviousDamageTaken'||!authority()||packet.gm!==game.user.id||!Number.isFinite(packet.amount)||packet.amount<=0)return;
  const user=game.users.get(packet.user),actor=globalThis.fromUuidSync?.(packet.actor,{strict:false});if(!user?.active||!actor||!(user.isGM||actor.testUserPermission?.(user,'OWNER')))return;
  const allowed=new Set(packet.effects??[]),effects=values(actor.effects).filter(e=>allowed.has(e.id)&&live(e)&&(deviousFlag(e)??deviousFromCard(e))?.choice==='knock-out');
  Promise.resolve().then(async()=>{await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(game.messages.get(packet.source));const ids=effects.filter(e=>live(e)&&values(actor.effects).includes(e)).map(e=>e.id);if(ids.length)await actor.deleteEmbeddedDocuments('ActiveEffect',ids);}).catch(report);
 });
});
