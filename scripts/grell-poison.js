import {triggerEntry} from "./trigger-library.js";
const ID="ugmuls-5-5e-automation",running=new Set(),completed=new Map();
const authority=()=>game.user?.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export function grellAttack(card){
 if(card?.type!=="attack")return false;
 const activity=card?.getAssociatedActivity?.(),item=activity?.item;
 return card?.type==="attack"&&activity?.id==="CJhwfRfVMm9BZJR2"&&(item?.identifier??item?.system?.identifier)==="paralyzing-tentacles"&&triggerEntry("mm-grell-paralyzing-tentacles")?.enabled===true;
}
export function pitFiendAttack(card){if(card?.type!=="attack")return false;const activity=card?.getAssociatedActivity?.(),item=activity?.item,entry=triggerEntry("mm-damage-pit-fiend");return card?.type==="attack"&&entry?.enabled===true&&activity?.id===entry.initialAttackId&&(item?.identifier??item?.system?.identifier)==="bite";}
export function buildPitFiendPoison(item){const data=item.toObject(),id="fM7YmQ4hBtRXJkMe",save=data.system.activities[id];if(!save||save.type!=="save")throw Error("Pit Fiend is missing its native poison saving throw.");data.system.activities={[id]:save};save.save.ability=["con"];save.damage={...save.damage,parts:[]};save.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};save.activation={type:"special",override:true};save.duration={units:"inst",concentration:false,override:true};save.target={override:true,prompt:false,affects:{type:"creature",count:"1",choice:false},template:{type:""}};const entry=triggerEntry("mm-damage-pit-fiend");const nativePoison=(data.effects??[]).find(effect=>effect._id===entry?.effectId||effect.name==="Poisoned"&&(effect.statuses??[]).includes("poisoned"));if(!nativePoison){data.effects??=[];data.effects.push({_id:entry?.effectId??"O1edMGJIx0MF1uze",name:"Poisoned",type:"base",img:"systems/dnd5e/icons/svg/statuses/poisoned.svg",disabled:false,transfer:false,statuses:["poisoned"],duration:{value:60,units:"seconds",expiry:"turnStart",expired:false},system:{changes:[]}});}const poisonEffect=nativePoison??data.effects.at(-1);save.effects=[{_id:poisonEffect._id,onSave:false,level:{}}];const profiles=(save.effects??[]).map(profile=>{const effectId=profile._id??profile.uuid?.split(".").at(-1);return {...profile,_id:effectId,uuid:null};});const ids=new Set(profiles.map(e=>e._id));data.effects=(data.effects??[]).filter(e=>ids.has(e._id));save.effects=profiles.filter(profile=>data.effects.some(effect=>effect._id===profile._id));data.system.description={value:"<p>Constitution saving throw. On failure, the target is Poisoned.</p>",chat:""};const quiet={version:5,isEnabled:false,isCustomized:false,killAnim:true};data.flags??={};data.flags.autoanimations=quiet;save.flags??={};save.flags.autoanimations=quiet;return {data,id};}
export function buildGrellPoison(item){
 const data=item.toObject(),id="MEc8vUTPipCkqjyq",save=data.system.activities[id];
 if(!save||save.type!=="save")throw Error("Grell is missing its native poison saving throw.");
 data.system.activities={[id]:save};save.damage={...save.damage,parts:[]};
 data.system.description={value:"<p>Constitution saving throw. On failure, the target is Poisoned and Paralyzed.</p>",chat:""};
 const applied=new Set((save.effects??[]).map(effect=>effect._id));data.effects=(data.effects??[]).filter(effect=>applied.has(effect._id));
 save.activation={type:"special",override:true};save.target={override:true,prompt:false,affects:{type:"creature",count:"1",choice:false},template:{type:""}};
 save.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};save.duration={units:"inst",concentration:false,override:true};
 const quiet={version:5,isEnabled:false,isCustomized:false,killAnim:true};data.flags??={};data.flags.autoanimations=quiet;save.flags??={};save.flags.autoanimations=quiet;
 return {data,id};
}
export async function triggerGrellPoison(card){
 if(!authority()||(!grellAttack(card)&&!pitFiendAttack(card))||running.has(card.id))return;
 const stored=card.getFlag(ID,"grellPoisonSaves");
 const sent=new Map(Array.isArray(stored)?stored.map(entry=>[entry.token,entry.cardId]):Object.entries(stored??{}));
 const prior=completed.get(card.id);if(prior)for(const [token,id]of prior)sent.set(token,id);
 const hits=Array.from(card.system.evaluatedTargets??[]).filter(target=>target.isMiss===false&&!sent.has(target.token));if(!hits.length)return;
 running.add(card.id);
 try{
  await globalThis.Ugmuls55eAutomationNpcDamage?.waitForWorkflowAnimations?.(card);
  const current=card.system.evaluatedTargets??[],source=card.getAssociatedActivity().item;
  for(const hit of hits){
   if(!current.some(target=>target.token===hit.token&&target.isMiss===false))continue;
   const token=await fromUuid(hit.token);if(!token?.actor)continue;
   const {data,id}=pitFiendAttack(card)?buildPitFiendPoison(source):buildGrellPoison(source),item=new CONFIG.Item.documentClass(data,{parent:source.actor});item.prepareFinalAttributes?.();
   const result=await item.system.activities.get(id).use({consume:false,scaling:0,concentration:{begin:false},create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{system:{targets:[{token:token.uuid,actor:token.actor.uuid,name:token.name,img:token.texture?.src}]},flags:{dnd5e:{item:{data}},[ID]:{riderTriggered:true,grellPoisonAttack:card.id,...(pitFiendAttack(card)?{monsterPoisonData:data}:{})}}}});
   if(!result?.message?.id)throw Error("Grell's poison save card was not created.");
   sent.set(hit.token,result.message.id);completed.set(card.id,new Map(sent));
   // UUIDs contain dots. Store them as values, never as flag object keys;
   // native document updates expand dotted keys and otherwise lose the guard.
   await card.setFlag(ID,"grellPoisonSaves",[...sent].map(([token,cardId])=>({token,cardId})));
  }
 }finally{running.delete(card.id);}
}
Hooks.once("ready",()=>{
 Hooks.on("deleteChatMessage",card=>completed.delete(card.id));
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,card=>{triggerGrellPoison(card).catch(error=>{console.error("Monster poison save",error);ui.notifications.error("Monster poison save could not start. Check the card before retrying.");});});
});
