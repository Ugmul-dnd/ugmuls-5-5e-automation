// Resolve only the book's deterministic Storm die count before the native
// dialog builds its rolls; preserve bonuses, damage types and critical options.
export function simplifyStormDamage(config,part){
 const activity=config.subject,item=activity?.item;
 if(![item?.identifier,item?.system?.identifier].includes("jallarzis-storm-of-radiance")&&!/^Jallarzi[’']s Storm of Radiance$/i.test(item?.name??""))return;
 for(const roll of part?[part]:config.rolls??[]){
  const level=Number(roll.data?.item?.level??activity.getRollData?.().item?.level);
  roll.parts=(roll.parts??[]).map(part=>typeof part!=="string"?part:part.replace(/\(\s*(@item\.level|\d+)\s*-\s*3\s*\)\s*d10\b/g,(formula,value)=>{
   const dice=(value==="@item.level"?level:Number(value))-3;
   return Number.isInteger(dice)&&dice>0?dice+"d10":formula;
  }));
 }
}
Hooks.once("ready",()=>{
 Hooks.on("dnd5e.preRollDamageV2",config=>simplifyStormDamage(config));
 Hooks.on("dnd5e.postBuildDamageRollConfig",(process,roll)=>simplifyStormDamage(process,roll));
});
