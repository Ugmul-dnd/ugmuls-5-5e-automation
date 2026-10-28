const ID="ugmuls-5-5e-automation",OPTION="rsaIndomitableMight",installed=new WeakSet(),values=v=>Array.from(v?.values?.()??v??[]);
export function mightFeature(actor){return values(actor?.items).find(item=>item.type==="feat"&&(item.identifier??item.system?.identifier)==="indomitable-might"&&item.system?.source?.rules!=="2014");}
export function prepareMight(rolls,config,dialog,message){
 if(game.settings.get(ID,"indomitableMightAutomation")!==true||!["save","check"].includes(message?.data?.type)||message.data.flags?.[ID]?.automaticGrappleFailure)return;
 const actor=config.subject?.actor??config.subject,feature=mightFeature(actor),score=actor?.system?.abilities?.str?.value;
 if(!feature||!Number.isFinite(score)||score<=0)return;
 for(const roll of rolls){
  const ability=roll.data?.abilityId??roll.data?.roll?.ability??roll.options?.ability??config.ability;
  if(ability!=="str")continue;
  roll.options??={};roll.options[OPTION]={actor:actor.uuid,feature:feature.uuid,score};
 }
}
export function applyMightFloor(roll,total){
 const record=roll.options?.[OPTION];
 if(!record||!Number.isFinite(total)||!Number.isFinite(record.score))return total;
 record.original=total;record.replaced=total<record.score;
 return record.replaced?record.score:total;
}
export function installMightTotal(Type=CONFIG.Dice.D20Roll){
 const prototype=Type?.prototype;if(!prototype||installed.has(prototype)||typeof prototype._evaluateTotal!=="function")return;
 const evaluate=prototype._evaluateTotal;
 prototype._evaluateTotal=function(...args){return applyMightFloor(this,evaluate.apply(this,args));};
 // Foundry v14 evaluates initial rolls through its AST, bypassing
 // _evaluateTotal. Clamp after each native evaluation path as well.
 for(const method of ['_evaluate','_evaluateSync']){
  const original=prototype[method];if(typeof original!=='function')continue;
  if(method==='_evaluate')prototype[method]=async function(...args){const result=await original.apply(this,args);this._total=applyMightFloor(this,this._total);return result;};
  else prototype[method]=function(...args){const result=original.apply(this,args);this._total=applyMightFloor(this,this._total);return result;};
 }
 installed.add(prototype);
}
export function renderMight(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 root.querySelectorAll('[data-rsa-might]').forEach(node=>node.remove());
 for(const name of root.querySelectorAll('.icon-row .pill.target, .message-header .message-sender')){
  const summary=name.closest('.card-summary[data-message-id]'),card=summary?game.messages.get(summary.dataset.messageId):message;
  if(!card||card.isContentVisible===false||!["check","save"].includes(card.type))continue;
  const records=values(card.rolls).map(roll=>roll.options?.[OPTION]).filter(record=>record?.replaced);if(!records.length)continue;
  const label=document.createElement('span');label.dataset.rsaMight='';label.textContent=' (Indomitable Might)';
  label.title=records.map(record=>'Indomitable Might: '+record.original+' replaced by Strength '+record.score+'.').join(' ');name.append(label);
 }
}
Hooks.once('init',()=>game.settings.register(ID,'indomitableMightAutomation',{name:'Indomitable Might Assistance',hint:'Automatically replace Strength check and Strength saving throw totals below the character’s Strength score with that score. Keep the rolled dice and mark replaced results with Indomitable Might.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{
 installMightTotal();
 Hooks.on('dnd5e.postAbilityCheckRollConfiguration',prepareMight);
 Hooks.on('dnd5e.postSavingThrowRollConfiguration',prepareMight);
 Hooks.on('dnd5e.renderChatMessage',(message,html)=>queueMicrotask(()=>renderMight(message,html)));
});
