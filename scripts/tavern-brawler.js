const ID="ugmuls-5-5e-automation";
export function tavernEligible(app){
 const activity=app.config?.subject,item=activity?.item;
 const actor=(app.message?.data?.speaker?globalThis.ChatMessage?.getSpeakerActor(app.message.data.speaker):null)??activity?.actor??item?.actor;
 return game.settings.get(ID,"tavernBrawlerAutomation")===true&&actor?.isOwner&&activity?.type==="attack"&&
  !app.message?.data?.flags?.[ID]?.masteryGraze&&
  (activity.attack?.type?.classification==="unarmed"||item?.system?.type?.value==="unarmed"||
   ["unarmed-strike","empowered-strike","empowered-strikes","elemental-strike","elemental-strikes"].includes(item?.identifier??item?.system?.identifier)||/^(unarmed|empowered|elemental) strikes?$/i.test(item?.name?.trim()??""))&&
  Array.from(actor.items??[]).some(i=>i.type==="feat"&&((i.identifier??i.system?.identifier)==="tavern-brawler"||/^tavern brawler$/i.test(i.name?.trim()??"")));
}
export function rerollUnarmedOnes(roll){
 if(roll._evaluated||roll.options?.rsaTavernBrawler)return roll;
 const copy=roll.constructor.fromData(roll.toJSON());let changed=false;
 function visit(current){
  for(const term of current.terms??[]){
   if(term instanceof foundry.dice.terms.DiceTerm&&!term.isDeterministic){
    // r1 rerolls once, keeping the replacement even when it is another 1.
    // Preserve explicit existing reroll policies rather than stacking rerolls.
    if(!(term.modifiers??[]).some(m=>/^r/i.test(m))){term.modifiers=[...(term.modifiers??[]),"r1"];changed=true;}
   }
   if(Array.isArray(term.rolls)){for(const child of term.rolls)visit(child);if(Array.isArray(term.terms))term.terms=term.rolls.map(r=>r.formula);}
   else if(Array.isArray(term.roll?.terms)&&typeof term.roll.resetFormula==="function"){visit(term.roll);term.term=term.roll.formula;}
  }
  current.resetFormula();
 }
 visit(copy);if(!changed)return roll;copy.options.rsaTavernBrawler=true;return copy;
}
export function finalizeTavernBrawler(app,rolls){
 if(!tavernEligible(app))return rolls;
 // Feat-based Unarmed/Empowered Strikes store their strike damage in the
 // first activity part, without the weapon-only `base` marker. Restrict the
 // fallback to that original configured part, never appended feature riders.
 const configured=app.config.rolls??[],base=configured.findIndex(part=>part.base===true);
 const index=base>=0?base:configured.length?0:-1;
 return rolls.map((roll,i)=>i===index?rerollUnarmedOnes(roll):roll);
}
Hooks.once("init",()=>game.settings.register(ID,"tavernBrawlerAutomation",{name:"Tavern Brawler Assistance",hint:"Reroll unarmed strike base damage dice showing 1 once, including native Monk scaling. Keep the new result.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationTavernBrawler={finalize:finalizeTavernBrawler};
 Hooks.on("dnd5e.preRollDamageV2",(config,dialog,message)=>{
  if(!tavernEligible({config,message}))return;
  const configure=dialog.configure;
  Object.assign(dialog,globalThis.Ugmuls55eAutomationDamage.configurePromptDialog("damage",dialog));
  if(configure===false)dialog.configure=false;
 });
 Hooks.on("dnd5e.postDamageRollConfiguration",(rolls,config,_dialog,message)=>{const result=finalizeTavernBrawler({config,message},rolls);if(result!==rolls)rolls.splice(0,rolls.length,...result);});
});
