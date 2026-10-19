import {getRegionSpellTable} from "./region-library.js";
export function prepareAuraOfLife(activity,usage){
 if((activity?.item?.identifier??activity?.item?.system?.identifier)!=="aura-of-life"||activity.id!=="dnd5eactivity000"||!activity.target?.template?.type||getRegionSpellTable()[activity.item.name]?.enabled===false)return;
 usage.create??={};usage.create.measuredTemplate=true;
 // The book represents Create Aura as a 1-HP healing activity. Casting only
 // places the resistance Region; reviving allies remains a manual table action.
 usage.subsequentActions=false;
}
Hooks.once("ready",()=>Hooks.on("dnd5e.preUseActivity",prepareAuraOfLife));
