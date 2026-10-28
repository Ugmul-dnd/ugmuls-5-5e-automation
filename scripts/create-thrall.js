import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),wired=new WeakSet(),choices=new WeakMap();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const enabled=()=>game.settings.get(ID,"createThrallAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
export const thrallFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&((i.identifier??i.system?.identifier)==="create-thrall"||/^create thrall$/i.test(i.name??"")||[i._stats?.compendiumSource,i.flags?.core?.sourceId].some(r=>r?.endsWith(".phbwlkCreateThra"))));
export function thrallCastEligible(activity){return enabled()&&activity?.type==="summon"&&activity.item?.type==="spell"&&(activity.item.identifier??activity.item.system?.identifier)==="summon-aberration"&&!!thrallFeature(activity.actor??activity.item.actor);}
export function setThrallChoice(app,yes){
 let state=choices.get(app);if(!state){state={yes:false,concentration:{...app.config.concentration}};choices.set(app,state);}state.yes=yes===true;app.config.rsaCreateThrall=state.yes;
 app.config.concentration=state.yes?{...app.config.concentration,begin:false,end:false}:{...state.concentration};
 const box=app.element?.querySelector('[name="concentration.begin"]');if(box){box.checked=state.yes?false:!!app.config.concentration?.begin;box.disabled=state.yes;}
}
export function addThrallChoice(app){
 if(!thrallCastEligible(app.activity)||app.element?.querySelector('[data-create-thrall]'))return;
 const scaling=app.element?.querySelector('[data-application-part="scaling"]'),form=app.element?.matches?.("form")?app.element:app.element?.querySelector("form");if(!form)return;
 const field=document.createElement("fieldset");field.dataset.createThrall="true";const legend=document.createElement("legend");legend.textContent="Create Thrall";const row=document.createElement("div");row.className="form-group";const label=document.createElement("label");label.textContent="Create Thrall";const fields=document.createElement("div");fields.className="form-fields";const select=document.createElement("select");select.name="rsaCreateThrallChoice";
 for(const [value,text]of [["no","No"],["yes","Yes"]]){const option=document.createElement("option");option.value=value;option.textContent=text;select.append(option);}select.value=app.config.rsaCreateThrall?"yes":"no";select.addEventListener("change",event=>{event.stopPropagation();setThrallChoice(app,select.value==="yes");});fields.append(select);row.append(label,fields);field.append(legend,row);
 if(scaling)scaling.after(field);else form.prepend(field);
 if(app.config.rsaCreateThrall)setThrallChoice(app,true);
}
export function prepareThrallCast(activity,usage,dialog,message){
 if(!thrallCastEligible(activity))return;
 const Base=dialog.applicationClass;if(Base)dialog.applicationClass=class extends Base{
  _onRender(context,options){super._onRender(context,options);addThrallChoice(this);}
  async _prepareSubmitData(event,formData){const data=await super._prepareSubmitData(event,formData);const yes=choices.get(this)?.yes??this.config.rsaCreateThrall===true;data.rsaCreateThrall=yes;if(yes){data.concentration={...data.concentration,begin:false,end:false};data["concentration.begin"]=false;data["concentration.end"]=false;}delete data.rsaCreateThrallChoice;return data;}
 };
 if(wired.has(activity))return;wired.add(activity);const scaling=activity._prepareUsageScaling;
 activity._prepareUsageScaling=async function(config,messageConfig,item){
  await scaling.call(this,config,messageConfig,item);if(config.rsaCreateThrall!==true)return;
  if(!thrallCastEligible(this))throw Error("Create Thrall is no longer available.");
  config.concentration={...config.concentration,begin:false,end:false};
  const record={caster:this.actor.uuid,expires:Number(game.time?.worldTime??0)+60},updates={"system.duration":{value:"1",units:"minute"},["system.activities."+this.id+".duration"]:{override:true,value:"1",units:"minute",concentration:false},"system.properties":values(item.system.properties).filter(p=>p!=="concentration"),["flags."+ID+".createThrallCast"]:record};
  item.updateSource(updates);item.prepareFinalAttributes?.();
  messageConfig.data??={};messageConfig.data.flags??={};messageConfig.data.flags[ID]={...messageConfig.data.flags[ID],createThrallCast:record,activityOverrideData:item.toObject()};
 };
}
export function thrallTempHp(feature,actor){
 const heal=values(feature.system?.activities).find(a=>a.type==="heal"),formula=heal?.healing?.custom?.formula?.replace(/@abilitis\./g,"@abilities.");if(!formula)throw Error("Create Thrall has no temporary HP formula.");
 const value=new CONFIG.Dice.BasicRoll(formula,actor.getRollData()).evaluateSync().total;if(!Number.isFinite(value))throw Error("Create Thrall temporary HP could not be calculated.");return Math.max(0,value);
}
export function prepareThrallToken(activity,profile,config){
 const record=flag(activity.item,"createThrallCast");if(!thrallCastEligible(activity)||!record)return;
 if(Number(game.time?.worldTime??0)>=record.expires){ui.notifications.warn("This Create Thrall casting has expired. Recast Summon Aberration.");return false;}
 const actor=activity.actor,feature=thrallFeature(actor),temp=thrallTempHp(feature,actor);
 config.actorUpdates??={};config.actorUpdates["system.attributes.hp.temp"]=Math.max(Number(config.actor?.system?.attributes?.hp?.temp??0),temp);
 config.tokenUpdates??={};config.tokenUpdates.flags??={};config.tokenUpdates.flags[ID]={...config.tokenUpdates.flags[ID],createThrallSummon:record};
}
export function expireThralls(){return enqueue(async()=>{
 if(!authority())return;for(const scene of values(game.scenes)){const ids=values(scene.tokens).filter(t=>{const link=flag(t,"createThrallSummon");return link&&Number(game.time?.worldTime??0)>=link.expires;}).map(t=>t.id);if(ids.length)await scene.deleteEmbeddedDocuments("Token",ids);}
});}

// Explicit approved sources: token-backed spells are not necessarily creatures with their own turn.
export const AFTER_CASTER_SUMMONS=Object.freeze([
 "summon-aberration","animate-objects","giant-insect","summon-beast","summon-celestial","summon-construct","summon-dragon","summon-elemental","summon-fey","summon-fiend","summon-undead","summon-dinosaur","summon-plant","homunculus-servant","staff-of-the-python","domestic-wonder"
]);
const afterCasterSources=new Set(AFTER_CASTER_SUMMONS),sourceIds={aunSummonDinosvH:"summon-dinosaur",aunSummonPlantZd:"summon-plant"};
export function afterCasterSummon(item){
 const identifier=item?.identifier??item?.system?.identifier;
 if(afterCasterSources.has(identifier))return true;
 const refs=[item?.id,item?._id,item?._stats?.compendiumSource,item?.flags?.core?.sourceId].filter(Boolean);
 if(refs.some(ref=>Object.keys(sourceIds).some(id=>ref===id||ref.endsWith("."+id))))return true;
 // These Arcana spells ship without identifiers; also support their imported copies.
 return !identifier&&["Summon Dinosaur","Summon Plant"].includes(item?.name);
}
export function prepareAberrationCombat(activity,profile,data){
 if(activity?.type!=="summon"||!afterCasterSummon(activity.item)||game.settings.get(ID,"summonCombatAutomation")===false)return;
 const combat=game.combat,origin=activity.getUsageToken?.();
 if(!combat?.started)return;
 data.flags??={};data.flags[ID]??={};data.flags[ID].aberrationCombat={combat:combat.id,caster:activity.actor.uuid,item:activity.item.uuid,origin:origin?.document?.uuid??origin?.uuid};
}
export function addAberrationCombat(token,options={},userId){return enqueue(async()=>{
 const link=flag(token,"aberrationCombat"),combat=game.combats?.get(link?.combat);
 if(!authority()||!link||game.settings.get(ID,"summonCombatAutomation")===false||!combat?.started||combat.scene&&combat.scene.id!==token.parent?.id)return;
 const creator=game.users.get(userId),source=await fromUuid(link.item);
 if(!creator||!source||source.actor?.uuid!==link.caster||!afterCasterSummon(source)||!creator.isGM&&!source.actor.testUserPermission(creator,"OWNER"))return;
 const combatants=values(combat.combatants);
 if(combatants.some(c=>c.tokenId===token.id&&(c.sceneId??c.token?.parent?.id??token.parent?.id)===token.parent?.id))return;
 // Prefer the exact casting token. Unlinked/global combats have no scene field.
 const exact=link.origin?combatants.find(c=>c.token?.uuid===link.origin):null;
 const candidates=combatants.filter(c=>(c.actor?.uuid===link.caster||source.actor.id&&c.actorId===source.actor.id)&&(c.sceneId??c.token?.parent?.id??token.parent?.id)===token.parent?.id);
 const caster=exact??(candidates.length===1?candidates[0]:null);
 if(!caster)return;
 const initiative=Number.isFinite(caster.initiative)?Math.round((caster.initiative-0.01)*100)/100:null;
 await combat.createEmbeddedDocuments("Combatant",[{tokenId:token.id,sceneId:token.parent.id,actorId:token.actorId,hidden:token.hidden,initiative}]);
});}

Hooks.once("init",()=>game.settings.register(ID,"summonCombatAutomation",{name:"Add Summons to Combat",hint:"Supported summoned creatures join active combat immediately after their caster, at initiative minus 0.01. Includes approved summon spells, Staff of the Python and Domestic Wonder.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("init",()=>game.settings.register(ID,"createThrallAutomation",{name:"Great Old One: Create Thrall",hint:"Offer Create Thrall in Summon Aberration casting: no concentration, one-minute duration and native temporary HP. Linked Aberrations gain once-per-turn Psychic bonus damage against the caster’s Hex target.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.summonToken",prepareAberrationCombat);Hooks.on("createToken",(token,options,userId)=>{addAberrationCombat(token,options,userId).catch(console.error);});
 Hooks.on("dnd5e.preUseActivity",prepareThrallCast);Hooks.on("dnd5e.preSummonToken",prepareThrallToken);
 for(const event of ["updateWorldTime","canvasReady"])Hooks.on(event,()=>expireThralls().catch(console.error));expireThralls().catch(console.error);
});
