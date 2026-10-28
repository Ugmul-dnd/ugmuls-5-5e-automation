import {hollowWrathState} from "./hollow-wrath-aura.js";
import {dreadContext} from "./dread-ambusher.js";
const ID="ugmuls-5-5e-automation",BOOK="rhwHWAncientMibA";
const values=v=>Array.from(v?.values?.()??v??[]);
export function ancientFeature(actor){return values(actor?.items).find(i=>i.type==="feat"&&([i._stats?.compendiumSource,i._stats?.duplicateSource,i.flags?.core?.sourceId].some(r=>r?.endsWith("."+BOOK))||(i.identifier??i.system?.identifier)==="ancient-might"||/^ancient might$/i.test(i.name?.trim()??"")));}
export function ancientBonus(app){
 if(game.settings.get(ID,"ancientMightAutomation")!==true||app.message?.data?.flags?.[ID]?.masteryGraze)return null;
 const {activity,actor,attack}=dreadContext(app),feature=ancientFeature(actor);
 if(activity?.type!=="attack"||!actor?.isOwner||!feature||!hollowWrathState(actor,null,{ignoreAuraSetting:true}))return null;
 const pending=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app);
 const targets=app.message?.data?.system?.targets??pending?.system?.targets??attack?.system?.targets??[];
 if(!targets.length)return null;
 for(const target of targets){
  const token=target.token?globalThis.fromUuidSync?.(target.token,{strict:false}):null;
  const recipient=token?.actor??(target.actor?globalThis.fromUuidSync?.(target.actor,{strict:false}):null);
  if(!recipient?.statuses?.has("frightened"))return null;
  if(attack&& !values(attack.system?.evaluatedTargets).some(t=>t.token===target.token&&t.isMiss===false))return null;
 }
 // The book's optional manual toggle already contributes this same bonus.
 const effects=[...values(actor.effects),...values(feature.effects)];
 if(effects.some(e=>!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired&&(e.name==="Ominous Strikes"||e.id==="j5ASLyxNMNlVfsoY")))return null;
 const wisdom=Number(actor.system?.abilities?.wis?.mod);
 return Number.isFinite(wisdom)&&wisdom!==0?wisdom:null;
}
export function finalizeAncient(app,rolls){
 if(!rolls.length||rolls.some(r=>r.options?.rsaAncientMight))return rolls;
 const bonus=ancientBonus(app);if(bonus===null)return rolls;
 const type=rolls[0].options?.type;if(!type)return rolls;
 return [...rolls,new CONFIG.Dice.DamageRoll(`${bonus}[Ominous Strikes]`,{},{type,types:[type],flavor:"Ominous Strikes",isCritical:false,critical:{bonusDice:0,bonusDamage:""},rsaAncientMight:true})];
}
Hooks.once("init",()=>game.settings.register(ID,"ancientMightAutomation",{name:"Hollow Warden: Ancient Might",hint:"Automatically add Wisdom modifier to attack damage against Frightened creatures while Wrath of the Wild is active. Persistent Wrath remains manual.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{globalThis.Ugmuls55eAutomationAncient={finalizeAncient};});
