import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),pending=new WeakMap(),reserved=new Map(),targets=new WeakMap(),wrapped=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"radiantSoulAutomation")===true,turn=()=>game.combat?.started?[game.combat.id,game.combat.round,game.combat.turn].join(":"):null;
export const radiantFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&(i.identifier??i.system?.identifier)==="radiant-soul"&&i.system?.source?.rules!=="2014");
const active=actor=>values(actor?.effects).some(e=>flag(e,"radiantSoul")&&!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired&&!e.system?.expired);
export async function syncRadiantSoul(actor){
 if(!actor)return;const feature=enabled()?radiantFeature(actor):null,effects=values(actor.effects).filter(e=>flag(e,"radiantSoul"));
 if(!feature){if(effects.length)await actor.deleteEmbeddedDocuments("ActiveEffect",effects.map(e=>e.id));return;}
 if(effects.length>1)await actor.deleteEmbeddedDocuments("ActiveEffect",effects.slice(1).map(e=>e.id));if(effects.length)return;
 await actor.createEmbeddedDocuments("ActiveEffect",[{name:"Radiant Soul",img:feature.img??"systems/dnd5e/icons/svg/damage/radiant.svg",type:"base",disabled:false,transfer:false,origin:feature.uuid,duration:{value:null,units:"seconds",expiry:null,expired:false},system:{changes:[],origin:{actor:actor.uuid,item:feature.uuid}},flags:{[ID]:{radiantSoul:true}},description:"Automatically add Radiant Soul to the first Fire or Radiant spell damage roll each turn, against one target. Disable this effect to suspend the bonus. Radiant resistance remains native."}]);
}
export function radiantContext(app){
 const activity=app.config?.subject,actor=activity?.actor??activity?.item?.actor,data=app.message?.data??{},card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),list=data.system?.targets?.length?data.system.targets:card?.system?.targets??[];
 const available=list.filter(t=>t.token),chosen=available.find(t=>t.token===targets.get(app))??available[0],feature=radiantFeature(actor);
 return {activity,actor,feature,available,target:chosen};
}
export function radiantUsed(actor,app){return !!(reserved.has(actor?.uuid)&&reserved.get(actor.uuid).app!==app)||!!turn()&&flag(actor,"radiantSoulTurn")===turn();}
export function radiantEligible(app){const c=radiantContext(app);return enabled()&&c.actor?.isOwner&&c.activity?.item?.type==="spell"&&["attack","save","damage"].includes(c.activity.type)&&!!c.feature&&active(c.actor)&&!!c.target&&!app.message?.data?.flags?.[ID]?.masteryGraze;}
export function radiantBonus(actor,feature){
 const damage=values(feature?.system?.activities).find(a=>a.type==="damage"),part=values(damage?.damage?.parts)[0],formula=part?.custom?.enabled?part.custom.formula:part?.bonus;if(!formula)return 0;
 const roll=new CONFIG.Dice.BasicRoll(formula,actor.getRollData?.()??{});if(roll.isDeterministic===false)return 0;return Math.max(0,Number(roll.evaluateSync().total)||0);
}
export function selectRadiantTarget(app,uuid){if(radiantContext(app).available.some(t=>t.token===uuid))targets.set(app,uuid);}
export function addRadiantTarget(app){
 if(!radiantEligible(app)||app.element.querySelector('[data-radiant-soul-target]'))return;
 const c=radiantContext(app);if(c.available.length<2||radiantUsed(c.actor,app))return;
 const field=app.element.querySelector('fieldset[data-application-part="configuration"]')??app.element.querySelector('[data-application-part="configuration"]');if(!field)return;
 const row=document.createElement("div");row.className="form-group";row.dataset.radiantSoulTarget="true";const label=document.createElement("label");label.textContent="Radiant Soul Target";const fields=document.createElement("div");fields.className="form-fields";const select=document.createElement("select");
 for(const t of c.available){const option=document.createElement("option");option.value=t.token;option.textContent=t.name??globalThis.fromUuidSync?.(t.token,{strict:false})?.name??"Target";select.append(option);}select.value=c.target.token;select.addEventListener("change",e=>{e.stopPropagation();selectRadiantTarget(app,select.value);app.rebuild();});fields.append(select);row.append(label,fields);field.append(row);
}
export function finalizeRadiant(app,rolls,{preview=false}={}){
 if(rolls.some(r=>r.options?.rsaRadiantSoul))return rolls;const existing=pending.get(app);if(existing)return [...rolls,existing.roll];
 if(!radiantEligible(app))return rolls;const c=radiantContext(app);if(radiantUsed(c.actor,app))return rolls;
 const base=rolls.find(r=>["fire","radiant"].includes(r.options?.type));if(!base)return rolls;
 const amount=radiantBonus(c.actor,c.feature);if(!(amount>0))return rolls;
 const roll=new CONFIG.Dice.DamageRoll(String(amount)+"[Radiant Soul]",{}, {type:base.options.type,types:[base.options.type],flavor:"Radiant Soul",properties:values(base.options.properties),isCritical:false,critical:{...base.options.critical,bonusDice:0,bonusDamage:""},rsaRadiantSoul:true});
 if(!preview){const entry={app,...c,roll,amount,turn:turn()};pending.set(app,entry);reserved.set(c.actor.uuid,entry);}return [...rolls,roll];
}
export async function commitRadiant(app,options){
 const entry=pending.get(app);if(!entry)return;
 try{
  if(!options?.dnd5e?.submitted)return;
  const c=radiantContext(app);if(entry.turn!==turn()||!radiantEligible(app)||radiantUsed(c.actor,app)||c.target.token!==entry.target.token)throw Error("Radiant Soul is no longer available for this turn or target. Reopen the damage roll.");
  const target=globalThis.fromUuidSync?.(entry.target.token,{strict:false});if(!target?.actor)throw Error("Radiant Soul’s target is no longer available.");
  if(entry.turn)await entry.actor.setFlag(ID,"radiantSoulTurn",entry.turn);
  app.message.data.flags??={};app.message.data.flags[ID]={...app.message.data.flags[ID],radiantSoul:{caster:entry.actor.uuid,target:entry.target.token,actor:target.actor.uuid,name:entry.target.name??target.name,amount:entry.amount,type:entry.roll.options.type,properties:values(entry.roll.options.properties),turn:entry.turn}};
 }finally{pending.delete(app);if(reserved.get(entry.actor.uuid)===entry)reserved.delete(entry.actor.uuid);}
}
export function installRadiantDamage(ActorType=CONFIG.Actor?.documentClass,TrayType=globalThis.customElements?.get?.("damage-application")){
 const p=TrayType?.prototype;if(p?.getMergedOptions&&!wrapped.has(p)){wrapped.add(p);const get=p.getMergedOptions;p.getMergedOptions=function(uuid){return {...get.call(this,uuid),rsaRadiantTarget:uuid};};}
 const a=ActorType?.prototype;if(!a?.calculateDamage||wrapped.has(a))return;wrapped.add(a);const calculate=a.calculateDamage;
 a.calculateDamage=function(damages,options={}){
  const ref=options.originatingMessage??options.origin,card=typeof ref==="string"?game.messages.get(ref.replace(/^ChatMessage\./,"")):ref,record=flag(card,"radiantSoul");
  if(!record||options.rsaUndoDamage||!Array.isArray(damages)||(options.rsaRadiantTarget?options.rsaRadiantTarget===record.target:this.uuid===record.actor))return calculate.call(this,damages,options);
  // Native trays aggregate matching damage types. Remove this one flat bonus before
  // multipliers/resistance for other recipients, without changing rolls or cached tray data.
  let remaining=record.amount;const filtered=damages.map(d=>{if(d.type!==record.type||values(d.properties).sort().join("|")!==values(record.properties).sort().join("|")||!(remaining>0))return d;const remove=Math.min(Math.max(0,Number(d.value)||0),remaining);remaining-=remove;return {...d,value:d.value-remove};});return calculate.call(this,filtered,options);
 };
}
export function renderRadiantSoul(card,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 for(const {message,node}of [{message:card,node:root},...values(root.querySelectorAll('.card-summary[data-message-id]')).map(node=>({message:game.messages.get(node.dataset.messageId),node}))]){
  node.querySelectorAll(':scope > .rsa-radiant-soul').forEach(n=>n.remove());const record=flag(message,"radiantSoul");if(!record||message?.type!=="damage"||message.isContentVisible===false||node.hidden)continue;
  const text=document.createElement("p");text.className="rsa-radiant-soul";text.textContent="Radiant Soul: +"+record.amount+" "+record.type+" to "+record.name;node.append(text);
 }
}
function actors(){return new Set([...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor))].filter(Boolean));}
function sync(actor){const gm=game.users.activeGM;if(actor&&(game.user.isGM&&(!gm||gm.id===game.user.id)||!gm&&actor.isOwner))enqueue(()=>syncRadiantSoul(actor)).catch(console.error);}
Hooks.once("init",()=>game.settings.register(ID,"radiantSoulAutomation",{name:"Celestial: Radiant Soul",hint:"Manage an on/off Radiant Soul effect. Automatically add the native Charisma bonus to the first Fire/Radiant spell damage roll each turn; select one recipient for area spells. The labeled bonus never doubles on a critical hit. Native Radiant resistance remains unchanged.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationRadiantSoul={finalizeRadiant,commitRadiant,addRadiantTarget};installRadiantDamage();for(const actor of actors())sync(actor);
 Hooks.on("canvasReady",()=>{for(const actor of actors())sync(actor);});for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,item=>{if(["feat","class","subclass"].includes(item.type))sync(item.actor);});Hooks.on("createActor",sync);Hooks.on("createToken",token=>sync(token.actor));
 Hooks.on("updateSetting",setting=>{if(setting.key===ID+".radiantSoulAutomation")for(const actor of actors())sync(actor);});Hooks.on("dnd5e.renderChatMessage",renderRadiantSoul);
 Hooks.on("dnd5e.preRollDamageV2",(config,dialog,message)=>{const app={config,message};if(!radiantEligible(app)||radiantUsed(radiantContext(app).actor,app)||!values(config.subject?.damage?.parts).some(p=>values(p.types).some(t=>["fire","radiant"].includes(t))))return;Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog("damage",dialog));dialog.configure=true;});
});
