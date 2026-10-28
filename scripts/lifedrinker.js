import {pactWeapon} from "./eldritch-smite.js";
import {dreadContext} from "./dread-ambusher.js";
import {isRollAdjustmentLocked,createEventQueue} from "./shared-activity-card.js";
const types=["necrotic","psychic","radiant"],damageTypes=new WeakMap();
const ID="ugmuls-5-5e-automation",selected=new WeakMap(),pending=new WeakMap(),reserved=new Map(),commitQueue=createEventQueue();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
const turn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
const enabled=()=>game.settings.get(ID,"lifedrinkerAutomation")===true;
export const lifedrinkerFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&(key(i)==="lifedrinker"||/^lifedrinker$/i.test(i.name?.trim()??"")));
export function lifedrinkerContext(app){
 const {activity,actor,attack}=dreadContext(app),feature=lifedrinkerFeature(actor),data=app.message?.data??{},card=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app);
 const targets=data.system?.targets?.length?data.system.targets:card?.system?.targets?.length?card.system.targets:attack?.system?.targets??[];
 const descriptor=targets.length===1?targets[0]:null,target=descriptor?.token?globalThis.fromUuidSync?.(descriptor.token,{strict:false}):null;
 const hit=!!target?.actor&&values(attack?.system?.evaluatedTargets).some(t=>t.token===target.uuid&&t.isMiss===false);
 const damage=values(feature?.system?.activities).find(a=>a.type==="damage"&&a.damage?.parts?.length);
 return {activity,actor,attack,feature,damage,target,hit};
}
const reservationKey=c=>JSON.stringify([c.actor?.uuid,turn()]);
export function lifedrinkerUsed(c,app){
 if(!c.actor||!c.target?.actor)return false;
 const reservation=reserved.get(reservationKey(c));if(reservation&&reservation.app!==app)return true;
 const prior=c.actor.getFlag?.(ID,"lifedrinkerTurn");
 return !!turn()&&prior?.turn===turn();
}
export function lifedrinkerEligible(app){
 const c=lifedrinkerContext(app);
 return enabled()&&c.actor?.isOwner&&!!c.feature&&!!c.damage&&c.activity?.type==="attack"&&c.activity.item?.type==="weapon"&&pactWeapon(c.activity.item)&&c.hit&&!app.message?.data?.flags?.[ID]?.masteryGraze&&!isRollAdjustmentLocked(c.attack);
}
export function selectLifedrinker(app,yes){selected.set(app,yes===true);}
export function selectLifedrinkerType(app,type){if(types.includes(type))damageTypes.set(app,type);}
const chosenType=app=>{const type=damageTypes.get(app)??game.settings.get(ID,"lastLifedrinkerType");return types.includes(type)?type:"necrotic";};
export function addLifedrinkerChoice(app){
 const c=lifedrinkerContext(app);if(!enabled()||!c.feature||c.activity?.type!=="attack"||c.activity.item?.type!=="weapon")return;
 const used=lifedrinkerUsed(c,app),eligible=lifedrinkerEligible(app);
 const row=globalThis.Ugmuls55eAutomationDamage?.addDamageChoice(app,{key:"lifedrinker",label:"Lifedrinker",value:selected.get(app)!==false,disabled:!eligible,used,change:yes=>selectLifedrinker(app,yes)});
 const select=row?.querySelector?.("select");if(select){select.disabled=!eligible||used;select.value=eligible&&!used&&selected.get(app)!==false?"yes":"no";}
 row?.classList?.toggle("rsa-savage-used",!eligible||used);
 if(row&&!row.querySelector('[data-lifedrinker-type]')){const chooser=document.createElement("select");chooser.dataset.lifedrinkerType="true";chooser.setAttribute("aria-label","Lifedrinker damage type");for(const type of types){const option=document.createElement("option");option.value=type;option.textContent=type[0].toUpperCase()+type.slice(1);chooser.append(option);}chooser.value=chosenType(app);chooser.addEventListener("change",()=>{selectLifedrinkerType(app,chooser.value);app.rebuild();});row.querySelector(".form-fields")?.append(chooser);}
}
export function finalizeLifedrinker(app,rolls,{preview=false}={}){
 if(rolls.some(r=>r.options?.rsaLifedrinker))return rolls;
 const entry=pending.get(app);if(entry)return [...rolls,entry.roll];
 if(selected.get(app)===false||!lifedrinkerEligible(app))return rolls;
 const c=lifedrinkerContext(app);if(lifedrinkerUsed(c,app))return rolls;
 const type=chosenType(app),roll=new CONFIG.Dice.DamageRoll("1d6[Lifedrinker]",{}, {type,types:[...types],flavor:"Lifedrinker",isCritical:c.damage.damage?.critical?.allow!==false&&rolls[0]?.options?.isCritical===true,critical:{...rolls[0]?.options?.critical,bonusDice:0,bonusDamage:""},rsaLifedrinker:true});
 if(!preview){const entry={...c,app,roll,turn:turn(),reservation:reservationKey(c)};pending.set(app,entry);reserved.set(entry.reservation,entry);}
 return [...rolls,roll];
}
export function commitLifedrinker(app,options){if(app.config?.subject?.type==="heal")return commitLifedrinkerHealing(app,options);return commitQueue(async()=>{
 const entry=pending.get(app);if(!entry)return;
 try{
  if(!options?.dnd5e?.submitted)return;
  const c=lifedrinkerContext(app);
  if(entry.turn!==turn()||!lifedrinkerEligible(app)||c.actor.uuid!==entry.actor.uuid||c.feature.uuid!==entry.feature.uuid||c.target.uuid!==entry.target.uuid||lifedrinkerUsed(c,app))throw Error("Lifedrinker is no longer available for this target. Reopen the damage prompt.");
  if(entry.turn){
   
   await c.actor.setFlag(ID,"lifedrinkerTurn",{turn:entry.turn,attack:c.attack.id});
  }
  app.message.data.flags??={};app.message.data.flags[ID]={...app.message.data.flags[ID],lifedrinker:{actor:c.actor.uuid,feature:c.feature.uuid,target:c.target.uuid,creature:c.target.actor.uuid,turn:entry.turn,type:entry.roll.options.type}};
  await game.settings.set(ID,"lastLifedrinkerType",entry.roll.options.type);
 }catch(error){ui.notifications.error(error.message);throw error;}
 finally{pending.delete(app);if(reserved.get(entry.reservation)===entry)reserved.delete(entry.reservation);}
});}
Hooks.once("init",()=>game.settings.register(ID,"lifedrinkerAutomation",{name:"Warlock: Lifedrinker",hint:"Offer optional 1d6 Necrotic/Psychic/Radiant damage on pact-weapon hits once per turn, then an optional Hit Die healing action on the resulting damage card.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{globalThis.Ugmuls55eAutomationLifedrinker={addLifedrinkerChoice,finalizeLifedrinker,commitLifedrinker};});

Hooks.once("init",()=>game.settings.register(ID,"lastLifedrinkerType",{scope:"client",config:false,type:String,default:"necrotic"}));

const healingQueue=createEventQueue(),healingWindows=new Set();
export function hitDiceChoices(actor){return values(actor?.items).filter(i=>i.type==="class").map(item=>({item,faces:Number(String(item.system.hd?.denomination??item.system.hitDice??"").replace(/^d/,"")),remaining:Number(item.system.hd?.value??(Number(item.system.levels??0)-Number(item.system.hd?.spent??item.system.hitDiceUsed??0)))})).filter(c=>c.remaining>0&&c.faces>0).sort((a,b)=>b.faces-a.faces);}
export function lifedrinkerHealingContext(card,user=game.user){
 if(!enabled()||card?.type!=="damage"||!card.rolls?.length||card.getFlag?.(ID,"pendingDamage")||!card.rolls.some(r=>r.options?.rsaLifedrinker))return null;
 const meta=card.getFlag?.(ID,"lifedrinker"),actor=card.getAssociatedActor?.();
 if(!meta||!actor||meta.actor!==actor.uuid||meta.turn!==turn()||!lifedrinkerFeature(actor)||!(user.isGM||actor.testUserPermission?.(user,"OWNER"))||card.getFlag?.(ID,"lifedrinkerHealed"))return null;
 const prior=actor.getFlag?.(ID,"lifedrinkerHealingTurn");if(prior?.card===card.id||turn()&&prior?.turn===turn())return null;
 const dice=hitDiceChoices(actor);return dice.length?{actor,meta,dice,card}:null;
}
export async function commitLifedrinkerHealing(app,options){return healingQueue(async()=>{
 const meta=app.message?.data?.flags?.[ID]?.lifedrinkerHealing;if(!meta||!options?.dnd5e?.submitted)return;
 const card=game.messages.get(meta.source),c=lifedrinkerHealingContext(card);if(!c||c.actor.uuid!==meta.actor)throw Error("Lifedrinker healing is no longer available for this turn.");
 const die=c.dice.find(d=>d.item.id===meta.classId);if(!die)throw Error("No remaining Hit Die of the selected type.");
 const spent=Number(die.item.system.hd?.spent??die.item.system.hitDiceUsed??0),path=die.item.system.hd?"system.hd.spent":"system.hitDiceUsed";
 await die.item.update({[path]:spent+1});
 try{await c.actor.setFlag(ID,"lifedrinkerHealingTurn",{turn:turn(),card:card.id});}
 catch(error){await die.item.update({[path]:spent});throw error;}
});}
export function buildLifedrinkerHealing(feature,die,actor){
 const data=feature.toObject(),use=Object.values(data.system.activities).find(a=>a.type==="heal");if(!use)throw Error("Lifedrinker has no native healing activity.");
 const id=use._id;data.system.activities={[id]:use};data.effects=[];data.flags??={};data.flags.dnd5e={...data.flags.dnd5e,riders:{activity:[],effect:[],item:[]}};
 use.name="Lifedrinker — Healing";use.activation={type:"special",override:true};use.consumption={targets:[],spellSlot:false,scaling:{allowed:false}};use.effects=[];use.appliedEffects=[];use.target={override:true,prompt:false,template:{type:""},affects:{type:"self",choice:false}};use.range={units:"self",override:true};use.duration={units:"inst",override:true,concentration:false};
 use.healing={types:["healing"],custom:{enabled:true,formula:"max(1, 1d"+die.faces+" + "+Number(actor.system.abilities.con.mod)+")"},scaling:{number:1}};
 return {data,id};
}
export async function useLifedrinkerHealing(card){
 let c=lifedrinkerHealingContext(card);if(!c||!c.actor.isOwner||healingWindows.has(c.actor.uuid))return;
 const actor=c.actor;healingWindows.add(actor.uuid);
 try{
  let die=c.dice[0];
  if(new Set(c.dice.map(d=>d.faces)).size>1){
   const selected=await foundry.applications.api.DialogV2.prompt({window:{title:"Lifedrinker — Choose Hit Die"},content:'<div class="form-group"><label>Hit Die</label><div class="form-fields"><select name="hitDie">'+c.dice.map((d,i)=>'<option value="'+i+'">d'+d.faces+' ('+d.remaining+' remaining)</option>').join("")+'</select></div></div>',ok:{label:"Continue",callback:(_e,b)=>Number(b.form.elements.hitDie.value)},rejectClose:false});if(selected===null)return;die=c.dice[selected];if(!die)return;
  }
  c=lifedrinkerHealingContext(card);if(!c||!c.dice.some(d=>d.item.id===die.item.id))return;
  const {data,id}=buildLifedrinkerHealing(lifedrinkerFeature(actor),die,actor),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
  const ref=card.getAssociatedToken?.()??actor.token,token=ref?.document??ref,targets=[{actor:actor.uuid,...(token?.actor?.uuid===actor.uuid?{token:token.uuid}:{}),name:actor.name,img:actor.img}];
  const flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,lifedrinkerHealing:{source:card.id,actor:actor.uuid,classId:die.item.id}}};
  const activity=helper.system.activities.get(id),result=await activity.use({consume:false,subsequentActions:false,create:{measuredTemplate:false},concentration:{begin:false}},{configure:false},{data:{speaker:card.speaker,system:{targets},flags}});
  if(!result?.message)throw Error("Lifedrinker could not create its healing card.");
  const dialog=globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("damage",{configure:true})??{configure:true};
  await activity.rollDamage({isCritical:false},dialog,{data:{speaker:card.speaker,system:{origin:result.message.id,targets},flags}});
 }finally{healingWindows.delete(actor.uuid);globalThis.Ugmuls55eAutomationChatRefresh?.card(card);}
}
export function renderLifedrinkerHealing(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 const entries=[{card:message,node:root},...values(root.querySelectorAll(".card-summary[data-message-id]")).map(node=>({card:game.messages.get(node.dataset.messageId),node})).filter(e=>e.card&&!e.node.hidden)];
 for(const {card,node}of entries){node.querySelectorAll(":scope > .rsa-lifedrinker-healing").forEach(n=>n.remove());if(card.isContentVisible===false||!lifedrinkerHealingContext(card))continue;
  const row=document.createElement("div");row.className="rsa-attack-actions rsa-lifedrinker-healing";const button=document.createElement("button");button.type="button";button.textContent="Lifedrinker — Heal (1 Hit Die)";button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();button.disabled=true;useLifedrinkerHealing(card).catch(error=>{console.error("Lifedrinker healing",error);ui.notifications.error(error.message);});});row.append(button);node.append(row);
 }
}
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.renderChatMessage",renderLifedrinkerHealing);
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{
  const meta=card.getFlag?.(ID,"lifedrinkerHealing");if(card.type!=="healing"||!card.rolls?.length||!meta||!game.user.isGM||game.users.activeGM?.id!==game.user.id)return;
  const source=game.messages.get(meta.source);if(source&&!source.getFlag?.(ID,"lifedrinkerHealed")&&source.getFlag?.(ID,"lifedrinker")?.actor===meta.actor)source.setFlag(ID,"lifedrinkerHealed",card.id).then(()=>globalThis.Ugmuls55eAutomationChatRefresh?.card(source)).catch(console.error);
 });
 for(const event of ["updateItem","deleteItem","updateActor","updateCombat"])Hooks.on(event,(doc,changes)=>globalThis.Ugmuls55eAutomationChatRefresh?.request("lifedrinker",doc,changes));
});
