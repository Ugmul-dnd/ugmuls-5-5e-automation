import {indexedMessages} from './chat-message-index.js';
import {createEventQueue} from './shared-activity-card.js';
import {blessingDistance} from './dark-ones-blessing.js';
import {inspiredRoll} from './bardic-inspiration.js';
const ID='ugmuls-5-5e-automation',enqueue=createEventQueue(),installed=new WeakSet(),sessions=new Map(),waiting=new Map(),initiativeCards=new Map(),active=new WeakMap();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier,flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,'tandemFootworkAutomation')===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
const resolve=r=>{try{return typeof r==='string'?globalThis.fromUuidSync?.(r,{strict:false}):r;}catch{return null;}};
const unable=a=>['incapacitated','unconscious','dead','stunned','paralyzed','petrified'].some(s=>a?.statuses?.has(s));
export function tandemContext(actor){
 const feature=values(actor?.items).find(i=>i.type==='feat'&&key(i)==='tandem-footwork'&&i.system?.source?.rules!=='2014'),resource=values(actor?.items).find(i=>i.type==='feat'&&key(i)==='bardic-inspiration'&&i.system?.source?.rules!=='2014'),activity=values(feature?.system?.activities).find(a=>(a.id??a._id)==='dnd5eactivity000');
 return enabled()&&feature&&resource&&activity?.roll?.formula&&!unable(actor)?{actor,feature,resource,activity}:null;
}
const remaining=r=>Number(r?.system?.uses?.value??Number(r?.system?.uses?.max)-Number(r?.system?.uses?.spent??0));
function sourceToken(actor){const own=actor?.token?.document??actor?.token;if(own?.parent)return own;const controlled=values(globalThis.canvas?.tokens?.controlled).map(t=>t.document??t).filter(t=>t.actor?.uuid===actor?.uuid);if(controlled.length===1)return controlled[0];const viewed=globalThis.ui?.combat?.viewed??game.combats?.viewed??game.combat,matches=values(viewed?.combatants).filter(c=>c.actor?.uuid===actor?.uuid||c.token?.actor?.uuid===actor?.uuid).map(c=>c.token?.document??c.token).filter(Boolean);if(matches.length===1)return matches[0];const tokens=values(globalThis.canvas?.scene?.tokens).filter(t=>t.actor?.uuid===actor?.uuid);return tokens.length===1?tokens[0]:null;}
export function tandemAlly(source,target){
 if(!source?.actor||!target?.actor||source.parent?.id!==target.parent?.id)return false;if(source.uuid===target.uuid)return true;
 if(!source.disposition||source.disposition!==target.disposition)return false;
 const limit=/^(m|meters?|metres?)$/i.test(String(source.parent.grid?.units))?9.144:30;if(blessingDistance(source,target)>limit)return false;
 const viewer=target.object,center=source.object?.center;if(!viewer?.center||!center)return false;
 const sight=!target.actor.statuses?.has('blinded')&&!source.actor.statuses?.has('invisible')&&!viewer.checkCollision?.(center,{type:'sight',mode:'any'});
 if(sight)return true;
 if(target.actor.statuses?.has('deafened'))return false;
 // Token.checkCollision explicitly rejects sound in Foundry v14. Sound walls
 // use the polygon backend directly, without inventing a Token sound source.
 const backend=CONFIG.Canvas?.polygonBackends?.sound;if(!backend?.testCollision)return false;
 const origin={...center,elevation:Number(source.elevation??0)},destination={...viewer.center,elevation:Number(target.elevation??0)},config={type:'sound',mode:'any',level:globalThis.canvas?.level};
 return !source.parent.testSurfaceCollision?.(origin,destination,config)&&!backend.testCollision(origin,destination,config);
}
export function tandemCombat(source){
 if(!source?.parent)return null;
 const candidates=[globalThis.ui?.combat?.viewed,game.combats?.viewed,game.combat,...values(game.combats)].filter(Boolean);
 // Scene-less and non-active encounters are valid when their roster contains
 // this exact token. The sidebar's viewed encounter takes precedence.
 return candidates.find(c=>values(c.combatants).some(t=>(t.token?.document??t.token)?.uuid===source.uuid))??candidates.find(c=>c.scene?.id===source.parent.id)??null;
}
const combatFor=tandemCombat;
function indexCard(card){if(card?.type!=='check'||card.system?.type!=='initiative')return;const token=card.getAssociatedToken?.(),id=(token?.document??token)?.uuid;if(id)initiativeCards.set(id,card.id);}
async function writeRollCard(card,data){const skip=card.getFlag?.('dice-so-nice','skip');try{await card.update({...data,'flags.dice-so-nice.skip':true});}finally{if(skip===undefined)await card.unsetFlag('dice-so-nice','skip');else await card.setFlag('dice-so-nice','skip',skip);}}
export async function tandemOperation(operation,payload,user=game.user){return enqueue(async()=>{
 if(!authority()||!user?.active)throw Error('A connected GM is required for Tandem Footwork.');
 if(operation==='claim'){
  if(sessions.has(payload.request))throw Error('Tandem Footwork was already selected.');
  const source=resolve(payload.source),c=tandemContext(source?.actor),requested=payload.combat?game.combats.get(payload.combat):null,combat=payload.combat?requested:combatFor(source);
  if(combat&&combat.scene?.id!==source?.parent?.id&&!values(combat.combatants).some(t=>(t.token?.document??t.token)?.uuid===source?.uuid))throw Error('The selected encounter does not contain the Bard’s token.');
  if(!c||!(user.isGM||c.actor.testUserPermission?.(user,'OWNER'))||!combat||remaining(c.resource)<1)throw Error('Tandem Footwork needs an available Bardic Inspiration, a placed Bard and an active encounter.');
  const recipients=values(combat.combatants).filter(t=>t.token?.uuid!==source.uuid&&tandemAlly(source,t.token));
  const bonusRoll=await new CONFIG.Dice.BasicRoll(c.activity.roll.formula,c.actor.getRollData?.()??{}).evaluate(),bonus=Number(bonusRoll.total);
  if(!Number.isFinite(bonus)||bonus<1||!tandemContext(c.actor)||remaining(c.resource)<1)throw Error('Tandem Footwork could not roll the native Inspiration die.');
  await c.resource.update({'system.uses.spent':Number(c.resource.system.uses.spent??0)+1});
  sessions.set(payload.request,{...c,source:source.uuid,combat:combat.id,recipients:recipients.map(t=>t.id),bonus,roll:bonusRoll.toJSON(),user:user.id,committed:false});
  return {request:payload.request,bonus,roll:bonusRoll.toJSON(),source:source.uuid,combat:combat.id};
 }
 const s=sessions.get(payload.request);if(!s||s.user!==user.id&&!user.isGM)return;
 if(operation==='finish'){
  if(!s.committed&&!s.used)await s.resource.update({'system.uses.spent':Math.max(0,Number(s.resource.system.uses.spent??0)-1)});
  sessions.delete(payload.request);return;
 }
 if(operation!=='commit'||s.committed)return;
 const card=game.messages.get(payload.card),meta=card?.rolls?.[0]?.options?.rsaTandemFootwork,combat=game.combats.get(s.combat);
 if(card?.type!=='check'||card.system?.type!=='initiative'||card.getAssociatedActor?.()?.uuid!==s.actor.uuid||meta?.request!==payload.request||meta.bonus!==s.bonus||!combat)throw Error('Tandem Footwork is not linked to this initiative roll.');
 s.used=true; // The Bard has already rolled with the bonus; its use is committed even if an ally update needs recovery.
 const updates=[],rollbacks=[],changedCards=[];
 try{
  for(const id of s.recipients){const target=combat.combatants.get(id);if(!target)continue;
   if(Number.isFinite(target.initiative)){
    const linked=game.messages.get(initiativeCards.get(target.token?.uuid));
    if(linked?.rolls?.length===1&&linked.getAssociatedToken?.()?.uuid===target.token?.uuid&&linked.rolls[0].total===target.initiative){
     const original=[...linked.rolls],bonus=await new CONFIG.Dice.BasicRoll(String(s.bonus)).evaluate(),adjusted=await inspiredRoll(linked.rolls[0],bonus),previous=flag(linked,'tandemFootwork');
     await writeRollCard(linked,{rolls:[adjusted],['flags.'+ID+'.tandemFootwork']:[...values(previous),{request:payload.request,name:s.actor.name,bonus:s.bonus}]});changedCards.push({card:linked,rolls:original,previous});
    }
    updates.push({_id:id,initiative:target.initiative+s.bonus});rollbacks.push({_id:id,initiative:target.initiative});
   }else{
    const before=flag(target,'tandemPending')??{};
    updates.push({_id:id,['flags.'+ID+'.tandemPending']:{...before,[payload.request]:{bonus:s.bonus,name:s.actor.name}}});rollbacks.push({_id:id,['flags.'+ID+'.tandemPending']:before});
   }
  }
  if(updates.length)await combat.updateEmbeddedDocuments('Combatant',updates);s.committed=true;
  await card.setFlag(ID,'tandemFootwork',[{request:payload.request,name:s.actor.name,bonus:s.bonus}]);
 }catch(error){
  if(s.committed)throw error;
  // Isolate restoration failures so a rejected tracker write cannot prevent
  // restoring the original dice on successfully updated initiative cards.
  const restores=await Promise.allSettled([...(rollbacks.length?[combat.updateEmbeddedDocuments('Combatant',rollbacks)]:[]),...changedCards.map(entry=>writeRollCard(entry.card,{rolls:entry.rolls,['flags.'+ID+'.tandemFootwork']:entry.previous??[]}))]);
  for(const result of restores)if(result.status==='rejected')console.error('Tandem Footwork restoration',result.reason);
  throw error;
 }
});}
function operate(operation,payload){const gm=game.users.activeGM;if(!gm||gm.id===game.user.id)return tandemOperation(operation,payload);const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error('The GM did not answer Tandem Footwork.'));},15000);waiting.set(request,{resolve,reject,timer});game.socket.emit('module.'+ID,{action:'tandemOperation',operation,payload,request,user:game.user.id,gm:gm.id});});}
function appendBonus(roll,bonus){roll.terms.push(new foundry.dice.terms.OperatorTerm({operator:'+'}),new foundry.dice.terms.NumericTerm({number:bonus,options:{flavor:'Tandem Footwork'}}));roll.resetFormula();if(roll._evaluated)roll._total=roll._evaluateTotal();}
export function addTandemField(app,config,c){
 for(const old of app.element.querySelectorAll('[data-tandem-footwork]'))old.remove();
 const mode=app.element.querySelector('[name="rollMode"]'),box=mode?.closest('fieldset')??app.element.querySelector('[data-application-part="configuration"] fieldset');if(!box)return;
 const row=document.createElement('div'),label=document.createElement('label'),fields=document.createElement('div');
 const input=document.createElement(globalThis.customElements?.get?.('dnd5e-checkbox')?'dnd5e-checkbox':'input');
 row.className='form-group';row.dataset.tandemFootwork='';label.textContent='Tandem Footwork ('+Math.max(0,remaining(c.resource))+'/'+c.resource.system.uses.max+')';
 fields.className='form-fields';fields.style.justifyContent='flex-end';if(input.localName==='input')input.type='checkbox';input.style.flex='0 0 auto';input.style.margin='0';
 const source=sourceToken(c.actor),reason=!(remaining(c.resource)>=1)?'No Bardic Inspiration uses available.':!source?'Select the Bard’s token.':!combatFor(source)?'The Bard’s token is not linked to a viewed encounter.':null;
 input.checked=!reason&&config.rsaTandemFootwork===true;input.disabled=!!reason;
 input.setAttribute('aria-label','Tandem Footwork');input.title=reason??'Spend one Bardic Inspiration; share one die roll with allies within 30 feet who can see or hear you.';row.title=input.title;
 input.addEventListener('change',()=>{config.rsaTandemFootwork=input.checked;});fields.append(input);row.append(label,fields);
 const modeRow=mode?.closest('.form-group');if(modeRow)modeRow.after(row);else box.append(row);
}
export function prepareTandem(config,dialog){
 const c=tandemContext(config.subject);if(!c||config.evaluate!==false||!config.hookNames?.includes('initiativeDialog'))return;
 const Base=dialog.applicationClass??CONFIG.Dice.D20Roll.DefaultConfigurationDialog;
 dialog.applicationClass=class extends Base{_onRender(context,options){super._onRender(context,options);addTandemField(this,config,c);}};
}
export function installTandem(ActorType=CONFIG.Actor.documentClass,RollType=CONFIG.Dice.D20Roll){
 if(RollType?.buildConfigure&&!installed.has(RollType)){installed.add(RollType);const build=RollType.buildConfigure;RollType.buildConfigure=async function(config,dialog,message){const rolls=await build.call(this,config,dialog,message);if(!rolls?.length||!config.rsaTandemFootwork)return rolls;
  const actor=config.subject,source=sourceToken(actor);if(!source)throw Error('Select the Bard’s token for Tandem Footwork.');if(active.has(actor))throw Error('Finish the Bard’s pending initiative roll first.');
  const meta=await operate('claim',{request:foundry.utils.randomID(),source:source.uuid,combat:combatFor(source)?.id});active.set(actor,meta);appendBonus(rolls[0],meta.bonus);rolls[0].options.rsaTandemFootwork=meta;
  if(game.dice3d?.showForRoll){const roll=CONFIG.Dice.BasicRoll.fromData(meta.roll),mode=message?.rollMode,whisper=mode==='selfroll'?[game.user.id]:['gmroll','blindroll'].includes(mode)?values(game.users).filter(u=>u.isGM).map(u=>u.id):null;await game.dice3d.showForRoll(roll,game.user,true,whisper,mode==='blindroll');}return rolls;
 };}
 const p=ActorType?.prototype;if(!p||installed.has(p))return;installed.add(p);const get=p.getInitiativeRollConfig,use=p.rollInitiativeDialog;
 p.getInitiativeRollConfig=function(...args){const config=get.apply(this,args);if(!config)return config;const source=sourceToken(this),combat=combatFor(source),combatant=values(combat?.combatants).find(c=>c.token?.uuid===source?.uuid),pending=flag(combatant,'tandemPending');if(pending&&Object.keys(pending).length){config.parts.push(String(Object.values(pending).reduce((n,e)=>n+Number(e.bonus),0))+'[Tandem Footwork]');config.options.rsaTandemPending={combat:combat.id,combatant:combatant.id,entries:pending};}return config;};
 p.rollInitiativeDialog=async function(...args){try{return await use.apply(this,args);}finally{const meta=active.get(this);if(meta){active.delete(this);try{if(meta.card)await operate('commit',{request:meta.request,card:meta.card});}finally{await operate('finish',{request:meta.request});}}}};
}
async function created(card){indexCard(card);if(card?.type!=='check'||card.system?.type!=='initiative')return;const meta=card.rolls?.[0]?.options?.rsaTandemFootwork;if(!meta)return;const local=active.get(card.getAssociatedActor?.());if(local?.request===meta.request)local.card=card.id;if(authority())await tandemOperation('commit',{request:meta.request,card:card.id});}
export function renderTandem(message,html){const root=html?.[0]??html;if(!root?.querySelectorAll)return;for(const {card,node}of [{card:message,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).filter(n=>!n.hidden).map(node=>({card:game.messages.get(node.dataset.messageId),node}))]){for(const old of node.querySelectorAll(':scope > .rsa-tandem-footwork'))old.remove();if(!card||card.isContentVisible===false)continue;const records=flag(card,'tandemFootwork')??Object.values(card.rolls?.[0]?.options?.rsaTandemPending?.entries??{});for(const e of records){const note=document.createElement('div');note.className='rsa-tandem-footwork';note.textContent='Tandem Footwork +'+e.bonus+' ('+e.name+')';node.append(note);}}}
function report(error){console.error('Tandem Footwork',error);ui.notifications.error(error.message);}
Hooks.once('init',()=>game.settings.register(ID,'tandemFootworkAutomation',{name:'Dance Bard: Tandem Footwork',hint:'Add an optional initiative configuration checkbox. Spend one Inspiration and share its native die roll with the Bard and eligible allied encounter participants within 30 feet, including allies yet to roll.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{installTandem();for(const card of indexedMessages("type","check"))indexCard(card);Hooks.on('dnd5e.preRollInitiativeDialogV2',prepareTandem);Hooks.on('createChatMessage',card=>created(card).catch(report));Hooks.on('dnd5e.renderChatMessage',renderTandem);Hooks.on('deleteChatMessage',card=>{for(const [token,id]of initiativeCards)if(id===card.id)initiativeCards.delete(token);});Hooks.on('updateCombatant',(c,change)=>{if(authority()&&Number.isFinite(change.initiative)&&flag(c,'tandemPending'))c.unsetFlag(ID,'tandemPending').catch(report);});
 game.socket.on('module.'+ID,p=>{if(p?.action==='tandemReply'&&p.user===game.user.id){const e=waiting.get(p.request);if(!e)return;waiting.delete(p.request);clearTimeout(e.timer);p.error?e.reject(Error(p.error)):e.resolve(p.result);return;}if(p?.action!=='tandemOperation'||!authority()||p.gm!==game.user.id||!['claim','commit','finish'].includes(p.operation))return;const user=game.users.get(p.user);if(!user?.active)return;tandemOperation(p.operation,p.payload,user).then(result=>game.socket.emit('module.'+ID,{action:'tandemReply',user:user.id,request:p.request,result}),error=>game.socket.emit('module.'+ID,{action:'tandemReply',user:user.id,request:p.request,error:error.message}));});
});
