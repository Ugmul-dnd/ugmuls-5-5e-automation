import {polarStrikesFeature} from "./frigid-explorer.js";
import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),values=v=>Array.from(v?.values?.()??v??[]);
const marker=e=>e.getFlag?.(ID,"bitingCold")??e.flags?.[ID]?.bitingCold;
const enabled=()=>game.settings.get(ID,"polarStrikesAutomation")===true;
const authority=()=>game.user.isGM&&game.users.activeGM?.id===game.user.id;
export async function syncBitingCold(actor){
 if(!actor)return;const feature=enabled()?polarStrikesFeature(actor):null,effects=values(actor.effects).filter(marker);
 if(!feature){if(effects.length)await actor.deleteEmbeddedDocuments("ActiveEffect",effects.map(e=>e.id));return;}
 if(effects.length>1)await actor.deleteEmbeddedDocuments("ActiveEffect",effects.slice(1).map(e=>e.id));
 if(effects.length)return;
 await actor.createEmbeddedDocuments("ActiveEffect",[{name:"Biting Cold",img:feature.img??"icons/magic/water/snowflake-ice-blue.webp",origin:feature.uuid,disabled:false,transfer:false,system:{changes:[],origin:{actor:actor.uuid,item:feature.uuid}},flags:{[ID]:{bitingCold:true}},description:"Weapon attacks, Ranger spells, and Ranger features ignore Cold resistance. Cold immunity still applies. Disable this effect to suspend the bypass."}]);
}
export function bitingColdSource(card){
 const actor=card?.getAssociatedActor?.(),item=card?.getAssociatedItem?.(),activity=card?.getAssociatedActivity?.();
 if(!enabled()||!polarStrikesFeature(actor)||!values(actor?.effects).some(e=>marker(e)&&!e.disabled&&e.active!==false&&!e.duration?.expired&&!e.system?.expired))return false;
 if(item?.type==="weapon")return activity?.type==="attack";
 if(item?.type==="spell")return (item.system?.classIdentifier??item.system?.sourceItem?.replace(/^class:/,""))==="ranger";
 if(item?.type!=="feat")return false;
 return item.system?.sourceItem==="class:ranger"||item.class?.system?.identifier==="ranger"||[item._stats?.compendiumSource,item.flags?.core?.sourceId].some(r=>r?.includes(".hofWiw"));
}
export function coldOptions(card,options){
 if(options.rsaUndoDamage||!bitingColdSource(card)||options.ignore===true||options.ignore?.resistance===true)return options;
 const resistance=new Set(options.ignore?.resistance??[]);resistance.add("cold");return {...options,ignore:{...options.ignore,resistance}};
}
export function installBitingCold(Type=globalThis.customElements?.get("damage-application")){
 const p=Type?.prototype;if(!p?.getMergedOptions||p.rsaBitingCold)return;
 const get=p.getMergedOptions;p.getMergedOptions=function(uuid){return coldOptions(this.chatMessage,get.call(this,uuid));};p.rsaBitingCold=true;
}
const actors=()=>new Set([...values(game.actors),...values(globalThis.canvas?.scene?.tokens).map(t=>t.actor)].filter(Boolean));
function synchronize(actor){if(authority())enqueue(()=>syncBitingCold(actor)).catch(error=>console.error("Biting Cold",error));}
Hooks.once("ready",()=>{
 installBitingCold();for(const actor of actors())synchronize(actor);
 Hooks.on("canvasReady",()=>{for(const actor of actors())synchronize(actor);});
 for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,item=>{if(item.type==="feat"||item.type==="class")synchronize(item.actor);});
 Hooks.on("createToken",token=>synchronize(token.actor));Hooks.on("createActor",synchronize);
 Hooks.on("updateSetting",setting=>{if(setting.key===ID+".polarStrikesAutomation")for(const actor of actors())synchronize(actor);});
 Hooks.on("dnd5e.preCalculateDamage",(actor,damages,options)=>{const next=coldOptions(options.origin??options.originatingMessage,options);if(next!==options)options.ignore=next.ignore;});
});
