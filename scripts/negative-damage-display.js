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
  const parts=Array.from(tooltip.querySelectorAll(':scope > .tooltip-part')).filter(part=>!part.classList.contains('rsa-field-breakdown')&&!part.classList.contains('rsa-parry-breakdown')&&!part.classList.contains('rsa-cutting-breakdown'));
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
export function d20DiceSigns(roll){
 const groups=[];
 // BasicRoll renders one tooltip part per die in forward order, unlike
 // aggregate damage. Keep each die's results together (including discarded).
 for(const [index,term]of (roll?.terms??[]).entries()){
  if(typeof term.getTooltipData!=='function')continue;
  let sign=1;
  for(let cursor=index-1;cursor>=0&&typeof roll.terms[cursor]?.operator==='string';cursor--){
   const operator=roll.terms[cursor].operator;
   if(operator!=='+'&&operator!=='-'){sign=0;break;}
   if(operator==='-')sign*=-1;
  }
  groups.push({negative:sign<0,flavor:term.options?.flavor??term.flavor??'',rolls:term.getTooltipData()?.rolls??[]});
 }
 return groups;
}
export function renderNegativeD20(card,node){
 if(!['attack','save','check'].includes(card?.type)||card.isContentVisible===false)return;
 const summary=node.matches?.('.card-summary[data-message-id]')?node:null;
 const tooltips=Array.from(node.querySelectorAll('.dice-tooltip')).filter(t=>(t.closest?.('.card-summary[data-message-id]')??null)===summary);
 if(tooltips.length!==(card.rolls?.length??0))return;
 for(const [index,tooltip]of tooltips.entries()){
  const groups=d20DiceSigns(card.rolls[index]);
  const parts=Array.from(tooltip.querySelectorAll(':scope > .tooltip-part')).filter(p=>!p.classList.contains('constant-term')&&!p.classList.contains('rsa-field-breakdown'));
  // Nested/pool expressions can have another native layout. Do not guess
  // which die is a penalty unless every part and result maps exactly.
  if(parts.length!==groups.length||parts.some((p,i)=>p.querySelectorAll('.dice-rolls > li.roll').length!==groups[i].rolls.length))continue;
  for(const [i,part]of parts.entries()){
   const group=groups[i];if(!group.negative)continue;
   for(const [j,die]of Array.from(part.querySelectorAll('.dice-rolls > li.roll')).entries()){
    if(die.dataset.rsaNegativeD20)continue;
    const minus=document.createElement('span');minus.textContent='−';minus.className='rsa-roll-minus';die.prepend(minus);die.dataset.rsaNegativeD20='true';
    die.dataset.tooltip=(group.flavor||'Roll penalty')+': −'+group.rolls[j].result+' (subtracted)';
   }
   const total=part.querySelector('.total .value');
   if(total&&!total.dataset.rsaNegativeD20){if(!/^[−-]/.test(total.textContent.trim()))total.textContent='−'+total.textContent.trim();total.dataset.rsaNegativeD20='true';}
  }
 }
}
export function renderDamageSigns(message,html){
 const root=html?.querySelectorAll?html:html?.[0];if(!root)return;
 renderNegativeDamage(message,root);
 renderNegativeD20(message,root);
 renderParryBreakdown(message,root);
 renderCuttingBreakdown(message,root);
 for(const node of root.querySelectorAll('.card-summary[data-message-id]')){
  const card=game.messages.get(node.dataset.messageId);if(card&&!node.hidden){renderNegativeDamage(card,node);renderNegativeD20(card,node);renderParryBreakdown(card,node);renderCuttingBreakdown(card,node);}
 }
}
// Native damage tooltips omit flat negative NumericTerms. Show the committed
// Parry receipt without modifying dice, formulas, totals or aggregation.
export function renderParryBreakdown(card,node){
 if(card?.type!=='damage'||card.isContentVisible===false)return;
 const parry=card.getFlag?.('ugmuls-5-5e-automation','parry');
 if(!(parry?.reduction>0))return;
 const summary=node.matches?.('.card-summary[data-message-id]')?node:null;
 for(const tooltip of node.querySelectorAll('.dice-tooltip')){
  if((tooltip.closest?.('.card-summary[data-message-id]')??null)!==summary)continue;
  if(tooltip.querySelector('.rsa-parry-breakdown'))continue;
  const row=document.createElement('section');row.className='tooltip-part rsa-parry-breakdown';
  const dice=document.createElement('div');dice.className='dice';
  const total=document.createElement('div');total.className='total';
  const label=document.createElement('span');label.className='label';label.textContent='Parry'+(parry.name?' — '+parry.name:'');
  const value=document.createElement('span');value.className='value';value.textContent='−'+parry.reduction;
  total.append(label,value);dice.append(total);row.append(dice);tooltip.append(row);
 }
}
// Receipt-only presentation: read evaluated terms, never reconstruct/evaluate dice.
export function appendReductionRoll(list,data){
 if(!data)return false;if(typeof data==='string'){try{data=JSON.parse(data);}catch{return false;}}
 if(!(data.terms??[]).some(t=>Number.isFinite(t.faces)&&Array.isArray(t.results)))return false;
 let hasDice=false,sign=1;for(const term of data.terms??[]){
  if(term.operator){sign=term.operator==='-'?-1:1;continue;}
  if(Number.isFinite(term.faces)&&Array.isArray(term.results)){for(const result of term.results){const die=document.createElement('li');die.className='roll die d'+term.faces+(result.discarded||result.active===false?' discarded':'');die.textContent=String(result.result);die.dataset.tooltip='d'+term.faces+' rolled '+result.result;list.append(die);hasDice=true;}}
  else if(Number.isFinite(term.number)&&term.number!==0){const value=sign*term.number,constant=document.createElement('li');constant.className='constant';constant.textContent=(value>=0?'+':'−')+Math.abs(value);list.append(constant);}sign=1;
 }return hasDice;
}
export function cuttingTooltipParts(card){
 const build=globalThis.dnd5e?.dice?.aggregateDamageRolls,rolls=globalThis.CONFIG?.DND5E?.aggregateDamageDisplay&&build?build(card.rolls??[]):card.rolls??[];
 return rolls.map(roll=>{let reduction=0,constant=0,sign=1;for(const term of roll.terms??[]){if(term.operator){sign=term.operator==='-'?-1:1;continue;}if(term.options?.rsaCuttingWords)reduction+=Number(term.number??term.total)||0;else if(Number.isFinite(term.number))constant+=sign*term.number;sign=1;}return {reduction,constant};});
}
export function renderCuttingBreakdown(card,node){
 if(card?.type!=='damage'||card.isContentVisible===false)return;const receipts=Object.values(card.getFlag?.('ugmuls-5-5e-automation','cuttingWords')??{});if(!receipts.length)return;
 const groups=cuttingTooltipParts(card),applied=groups.reduce((n,g)=>n+g.reduction,0);if(!(applied>0))return;const summary=node.matches?.('.card-summary[data-message-id]')?node:null;
 for(const tooltip of node.querySelectorAll('.dice-tooltip')){
  if((tooltip.closest?.('.card-summary[data-message-id]')??null)!==summary)continue;
  tooltip.querySelectorAll('.rsa-cutting-breakdown').forEach(row=>row.remove());
  const parts=Array.from(tooltip.querySelectorAll(':scope > .tooltip-part')).filter(part=>!part.classList.contains('rsa-cutting-breakdown')&&!part.classList.contains('rsa-field-breakdown')&&!part.classList.contains('rsa-parry-breakdown'));
  if(parts.length===groups.length)for(const [index,part]of parts.entries()){const group=groups[index];if(!group.reduction)continue;const total=part.querySelector('.total .value');if(total){const base=Number(total.dataset.rsaCuttingBase??total.textContent);if(Number.isFinite(base)){total.dataset.rsaCuttingBase=String(base);total.textContent=String(base+group.reduction);}}for(const constant of part.querySelectorAll('.dice-rolls > .constant')){constant.hidden=group.constant===0;constant.textContent=(group.constant>=0?'+':'−')+Math.abs(group.constant);}}
  const row=document.createElement('section');row.className='tooltip-part rsa-cutting-breakdown';const dice=document.createElement('div');dice.className='dice';const results=document.createElement('ol');results.className='dice-rolls';let shown=false;for(const receipt of receipts)shown=appendReductionRoll(results,receipt.roll)||shown;if(!shown){const amount=document.createElement('li');amount.className='constant';amount.textContent='−'+applied;results.append(amount);}const total=document.createElement('div');total.className='total';const label=document.createElement('span');label.className='label';label.textContent='Cutting Words';label.dataset.tooltip='Rolled '+receipts.reduce((n,r)=>n+(Number(r.total)||0),0)+'; applied reduction '+applied+'.';const value=document.createElement('span');value.className='value';value.textContent='−'+applied;total.append(label,value);dice.append(results,total);row.append(dice);tooltip.append(row);
 }
}
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationReductionTooltip={appendRoll:appendReductionRoll};Hooks.on('dnd5e.renderChatMessage',renderDamageSigns);});
