import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{});
const marker=e=>e?.getFlag?.(ID,"psychicSpells")??e?.flags?.[ID]?.psychicSpells;
const enabled=()=>game.settings.get(ID,"psychicSpellsAutomation")===true;
export const psychicSpellsFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&((i.identifier??i.system?.identifier)==="psychic-spells"||/^psychic spells$/i.test(i.name?.trim()??"")||[i._stats?.compendiumSource,i._stats?.duplicateSource,i.flags?.core?.sourceId].some(r=>r?.endsWith(".phbwlkPsychicSpe"))));
export async function syncPsychicSpells(actor){
 if(!actor)return;const feature=enabled()?psychicSpellsFeature(actor):null,effects=values(actor.effects).filter(marker);
 if(!feature){if(effects.length)await actor.deleteEmbeddedDocuments("ActiveEffect",effects.map(e=>e.id));return;}
 if(effects.length>1)await actor.deleteEmbeddedDocuments("ActiveEffect",effects.slice(1).map(e=>e.id));
 // Preserve the player's disabled state instead of reactivating on every sync.
 if(effects.length)return;
 await actor.createEmbeddedDocuments("ActiveEffect",[{name:"Psychic Spells",img:feature.img??"systems/dnd5e/icons/svg/damage/psychic.svg",disabled:false,transfer:false,origin:feature.uuid,duration:{value:null,units:"seconds",expiry:null,expired:false},system:{changes:[],origin:{actor:actor.uuid,item:feature.uuid}},flags:{[ID]:{psychicSpells:true}},description:"Your Warlock spell damage rolls can use Psychic instead of their normal damage type. Disable this effect to suspend the option. Components remain table-managed."}]);
}
export function psychicSpellEligible(activity){
 const item=activity?.item,actor=activity?.actor??item?.actor;
 if(!enabled()||item?.type!=="spell"||!["attack","save","damage"].includes(activity?.type)||!psychicSpellsFeature(actor))return false;
 const cls=item.system?.classIdentifier||(/^(class|subclass):/.test(item.system?.sourceItem??"")?item.system.sourceItem.split(":")[1]:"");
 if(cls!=="warlock")return false;
 return values(actor.effects).some(e=>marker(e)&&!e.disabled&&e.active!==false&&!e.isSuppressed&&!e.duration?.expired&&!e.system?.expired);
}
let rememberedTypes;let memoryWrites=Promise.resolve();
function memories(){if(!rememberedTypes){const stored=game.settings.get(ID,"psychicSpellDamageTypes");rememberedTypes=stored&&typeof stored==="object"?{...stored}:{};}return rememberedTypes;}
function spellMemoryKey(activity,index){const item=activity.item,actor=activity.actor??item.actor;return actor?.uuid&&item.id?[actor.uuid,item.id,activity.id??"damage",index].join("|"):null;}
export function psychicDamageTypes(process,part,index=0,{formData}={}){
 if(!psychicSpellEligible(process?.subject))return;
 for(const [offset,roll]of (part?[part]:process.rolls??[]).entries()){const options=roll.options??={},types=values(options.types),damageTypes=globalThis.CONFIG?.DND5E?.damageTypes;
  const valid=t=>damageTypes?Object.hasOwn(damageTypes,t):!!t&&!["healing","temphp","maximum"].includes(t);
  if(!valid(options.type)&&!types.some(valid))continue;
  options.types=[...new Set([...types,...(options.type?[options.type]:[]),"psychic"])];
  const key=spellMemoryKey(process.subject,part?index:offset);if(!key)continue;
  options.rsaPsychicMemory={key,allowed:[...options.types]};
  // Native formula redraws carry the user's new selection. Only seed defaults
  // on initial construction, never over an edit in the open dialog.
  if(!formData){const saved=memories()[key];if(options.types.includes(saved))options.type=saved;}
 }
}
export function rememberPsychicDamage(card){
 if(card?.type!=="damage"||card.author?.id!==game.user.id||!enabled()||!card.rolls?.length)return;
 let changed=false;const saved=memories();
 for(const roll of card.rolls){const record=roll.options?.rsaPsychicMemory,type=roll.options?.type;if(!record?.key||!record.allowed?.includes(type)||saved[record.key]===type)continue;saved[record.key]=type;changed=true;}
 if(changed){const snapshot={...saved};memoryWrites=memoryWrites.catch(()=>{}).then(()=>game.settings.set(ID,"psychicSpellDamageTypes",snapshot)).catch(error=>console.warn("Psychic Spells choice memory",error));}
 return memoryWrites;
}
function actors(){return new Set([...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor))].filter(Boolean));}
function synchronize(actor){const gm=game.users.activeGM;if(actor&&(game.user.isGM&&(!gm||gm.id===game.user.id)||!gm&&actor.isOwner))return enqueue(()=>syncPsychicSpells(actor)).catch(error=>console.error("Psychic Spells",error));}
Hooks.once("init",()=>game.settings.register(ID,"psychicSpellsAutomation",{name:"Great Old One: Psychic Spells",hint:"Manage a passive Psychic Spells effect that adds Psychic to native Warlock spell damage-type choices. Disable the effect to suspend it. Other classes’ spells and component handling remain unchanged.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("init",()=>game.settings.register(ID,"psychicSpellDamageTypes",{scope:"client",config:false,type:Object,default:{}}));
Hooks.once("ready",()=>{
 for(const actor of actors())synchronize(actor);
 Hooks.on("canvasReady",()=>{for(const actor of actors())synchronize(actor);});
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,item=>{if(["feat","class","subclass"].includes(item.type))synchronize(item.actor);});
 Hooks.on("createActor",synchronize);Hooks.on("createToken",token=>synchronize(token.actor));
 Hooks.on("updateSetting",setting=>{if(setting.key===ID+".psychicSpellsAutomation")for(const actor of actors())synchronize(actor);});
 Hooks.on("dnd5e.preRollDamageV2",(config,dialog)=>{if(!psychicSpellEligible(config.subject))return;psychicDamageTypes(config);const configure=dialog.configure;Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog?.("damage",dialog)??{});if(configure===false)dialog.configure=false;});
 Hooks.on("dnd5e.postBuildDamageRollConfig",psychicDamageTypes);
 for(const event of ["createChatMessage","updateChatMessage"])Hooks.on(event,rememberPsychicDamage);
});
