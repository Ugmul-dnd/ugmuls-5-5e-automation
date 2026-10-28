// Native aggregateDamageTerms lists dice in reverse term order but omits the
// subtraction sign. Mirror that order for presentation without altering rolls.
export function damageDiceSigns(roll){
 const dice=[];
 for(let index=(roll?.terms?.length??0)-1;index>=0;index--){
  const term=roll.terms[index];
  if(typeof term.getTooltipData!=="function")continue;
  let sign=1;
  for(let cursor=index-1;cursor>=0&&typeof roll.terms[cursor]?.operator==="string";cursor--){
   const operator=roll.terms[cursor].operator;
   if(operator!=="+"&&operator!=="-"){sign=0;break;}
   if(operator==="-")sign*=-1;
  }
  for(const result of term.getTooltipData()?.rolls??[])dice.push({negative:sign<0,result:result.result,flavor:term.options?.flavor??term.flavor??""});
 }
 return dice;
}
export function renderNegativeDamage(card,node){
 if(card?.type!=="damage"||card.isContentVisible===false)return;
 const aggregate=globalThis.CONFIG?.DND5E?.aggregateDamageDisplay;
 const build=globalThis.dnd5e?.dice?.aggregateDamageRolls;
 if(aggregate&&!build)return;
 const rolls=aggregate?build(card.rolls??[]):card.rolls??[];
 const summary=node.matches?.('.card-summary[data-message-id]')?node:null;
 for(const tooltip of node.querySelectorAll('.dice-tooltip')){
  if((tooltip.closest?.('.card-summary[data-message-id]')??null)!==summary)continue;
  const parts=Array.from(tooltip.querySelectorAll(':scope > .tooltip-part')).filter(part=>!part.classList.contains('rsa-field-breakdown'));
  if(parts.length!==rolls.length)continue;
  for(const [index,part]of parts.entries()){
   const signs=damageDiceSigns(rolls[index]),nodes=part.querySelectorAll('.dice-rolls > li.roll');
   // Complex/pool breakdowns may flatten differently. Leave them native unless
   // the dice map exactly, rather than labeling an unrelated result.
   if(signs.length!==nodes.length)continue;
   for(const [i,die]of Array.from(nodes).entries()){
    if(!signs[i].negative||die.dataset.rsaNegativeDamage)continue;
    const minus=document.createElement('span');minus.textContent='−';minus.className='rsa-damage-minus';
    die.prepend(minus);die.dataset.rsaNegativeDamage='true';
    die.dataset.tooltip=(signs[i].flavor||'Damage reduction')+': −'+signs[i].result+' (subtracted)';
   }
  }
 }
}
export function renderDamageSigns(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 renderNegativeDamage(message,root);
 for(const node of root.querySelectorAll('.card-summary[data-message-id]')){
  const card=game.messages.get(node.dataset.messageId);if(card&&!node.hidden)renderNegativeDamage(card,node);
 }
}
Hooks.once('ready',()=>Hooks.on('dnd5e.renderChatMessage',renderDamageSigns));
