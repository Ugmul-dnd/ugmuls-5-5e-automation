const ID="ugmuls-5-5e-automation",dialogs=new Set(),converting=new Set();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier;
const enabled=()=>game.settings.get(ID,"fontOfMagicAutomation")===true;
export const fontItem=item=>enabled()&&item?.type==="feat"&&key(item)==="font-of-magic"&&item.system?.source?.rules!=="2014";
export function fontContext(actor){
 const feature=values(actor?.items).find(fontItem),activities=values(feature?.system?.activities),create=activities.find(a=>(a.id??a._id)==="rYDgagyWjp6f3jtO"||a.name==="Regain Spell Slot"),recover=activities.find(a=>(a.id??a._id)==="qAphJay1yKd7VWxH"||a.name==="Regain Sorcery Points"),spent=Number(feature?.system?.uses?.spent??0),max=Number(feature?.system?.uses?.max),level=Number(values(actor?.items).find(i=>i.type==="class"&&key(i)==="sorcerer")?.system?.levels??actor?.system?.classes?.sorcerer?.levels);
 const combatant=globalThis.Ugmuls55eAutomationCompanions?.effectiveCombatant(actor,game.combat)??values(game.combat?.combatants).find(c=>c.actor?.uuid===actor?.uuid);
 return {actor,feature,create,recover,spent,max,points:max-spent,level,inCombat:!!game.combat?.started&&!!combatant,ownTurn:!combatant||game.combat?.combatant?.id===combatant.id,bonusUsed:globalThis.Ugmuls55eAutomationResources?.bonusActionUsed(actor)===true};
}
export function fontCost(context,level){
 const target=values(context.create?.consumption?.targets).find(t=>t.type==="itemUses"&&!t.target),roll=target&&new CONFIG.Dice.BasicRoll(String(target.value),{...(context.feature.getRollData?.()??context.actor.getRollData?.()??{}),scaling:level});
 if(!roll||roll.isDeterministic===false)throw Error("Font of Magic is missing its native conversion formula.");const cost=Number(roll.evaluateSync().total);if(!Number.isInteger(cost)||cost<1)throw Error("Font of Magic cost could not be resolved.");return cost;
}
function slot(actor,level){return actor.system?.spells?.["spell"+level];}
function quantity(selection,level){const count=Number(selection?.[level]??0);if(!Number.isInteger(count)||count<0)throw Error("Select whole numbers of spell slots.");return count;}
export function fontTotals(context,mode,selection={}){
 let points=0,count=0;for(const [level,value]of Object.entries(selection)){if(!/^[1-9]$/.test(level))throw Error("Invalid spell level.");const n=quantity(selection,level);if(!n)continue;count+=n;points+=n*(mode==="create"?fontCost(context,Number(level)):Number(level));}return {points,count};
}
export function fontRows(actor,mode,selection={}){
 const c=fontContext(actor);if(!c.feature||!c.create||!c.recover||!["create","recover"].includes(mode))return [];
 const totals=fontTotals(c,mode,selection),rows=[];
 for(let level=1;level<=(mode==="create"?Math.min(5,Number(c.create.consumption?.scaling?.max)||5):9);level++){
  const data=slot(actor,level);if(!data||!Number.isFinite(Number(data.max))||Number(data.max)<1)continue;
  if(mode==="create"&&(!Number.isFinite(c.level)||c.level<Math.max(2,2*level-1)))continue;
  const rate=mode==="create"?fontCost(c,level):level,n=quantity(selection,level),budget=(mode==="create"?c.points:c.spent)-(totals.points-n*rate);
  let limit=Math.max(0,Math.floor(budget/rate));
  if(mode==="recover")limit=Math.min(limit,Math.max(0,Number(data.value)||0));
  else if(c.inCombat)limit=c.bonusUsed||!c.ownTurn?0:Math.min(limit,Math.max(0,1-(totals.count-n)));
  rows.push({level,rate,available:Number(data.value)||0,value:n,limit});
 }return rows;
}
export function validateFont(actor,mode,selection,user=game.user){
 const c=fontContext(actor);if(!enabled()||!c.feature||!c.create||!c.recover||!actor.isOwner||!(user?.isGM||actor.testUserPermission?.(user,"OWNER"))||!["create","recover"].includes(mode)||!Number.isFinite(c.max)||!Number.isInteger(c.spent)||c.spent<0||c.spent>c.max)throw Error("Font of Magic is unavailable.");
 const totals=fontTotals(c,mode,selection);if(!totals.count)throw Error("Select at least one spell slot.");
 if(totals.points>(mode==="create"?c.points:c.spent))throw Error(mode==="create"?"Not enough Sorcery Points.":"The selected slots would exceed your Sorcery Point maximum.");
 if(mode==="create"&&c.inCombat&&(c.bonusUsed||!c.ownTurn||totals.count>1))throw Error("Creating a slot requires one available Bonus Action on your turn.");
 const rows=fontRows(actor,mode,selection);for(const [level,value]of Object.entries(selection)){const n=quantity(selection,level);if(n&&!rows.some(r=>r.level===Number(level)&&n<=r.limit))throw Error("Those spell slots are no longer available. Review your selection.");}
 return {...c,...totals,mode,selection:Object.fromEntries(Object.entries(selection).filter(([,n])=>Number(n)>0).map(([l,n])=>[l,Number(n)]))};
}
export function fontConversionData(context){
 const activity=context.mode==="create"?context.create:context.recover,id=activity.id??activity._id,data=context.feature.toObject(),source=data.system.activities[id];if(!source)throw Error("Font of Magic is missing its source activity.");
 source.name=context.mode==="create"?"Create Spell Slots":"Recover Sorcery Points";source.consumption={...source.consumption,spellSlot:false,scaling:{allowed:false},targets:[{type:"itemUses",target:"",value:String(context.mode==="create"?context.points:-context.points),scaling:{mode:""}},...Object.entries(context.selection).map(([level,count])=>({type:"spellSlots",target:level,value:String(context.mode==="create"?-count:count),scaling:{mode:""}}))]};
 data.system.activities={[id]:source};return {data,id};
}
export async function convertFont(actor,mode,selection){
 if(converting.has(actor.uuid))throw Error("Font of Magic is already being processed.");converting.add(actor.uuid);
 try{const context=validateFont(actor,mode,selection),{data,id}=fontConversionData(context),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
  // Native consumption owns the slot/point updates, Bonus Action tracking and pending-use cancellation.
  return await helper.system.activities.get(id).use({scaling:0,create:{measuredTemplate:false},subsequentActions:false},{configure:false},{data:{flags:{[ID]:{activityOverrideData:data,fontOfMagic:{mode,slots:context.selection,points:context.points}},dnd5e:{item:{data}}}}});
 }finally{converting.delete(actor.uuid);}
}
export class FontOfMagicDialog extends foundry.applications.api.ApplicationV2{
 static DEFAULT_OPTIONS={window:{title:"Font of Magic"},position:{width:360,height:"auto"}};
 constructor(item){super({id:"rsa-font-"+item.actor.id});this.item=item;this.mode="create";this.selection={};}
 async _renderHTML(){const c=fontContext(this.item.actor),rows=fontRows(c.actor,this.mode,this.selection),totals=fontTotals(c,this.mode,this.selection);let valid=true;try{validateFont(c.actor,this.mode,this.selection);}catch{valid=false;}
 return '<div style="padding:8px"><p><strong>Sorcery Points: '+c.points+' / '+c.max+'</strong></p><label>Conversion <select data-font-mode><option value="create" '+(this.mode==='create'?'selected':'')+'>Sorcery Points → Spell Slots</option><option value="recover" '+(this.mode==='recover'?'selected':'')+'>Spell Slots → Sorcery Points</option></select></label><p>'+(this.mode==='create'?'Choose the slots to create. Created slots last until your Long Rest. In combat, create one slot per Bonus Action.':'Choose the slots to expend. Each returns Sorcery Points equal to its level.')+'</p><fieldset><legend>'+(this.mode==='create'?'Create Spell Slots':'Recover Sorcery Points')+'</legend>'+rows.map(r=>'<label style="display:flex;align-items:center;gap:8px;margin:8px 0"><span style="flex:0 0 auto;min-width:90px;white-space:nowrap"><strong>Level '+r.level+'</strong><br><small>'+(this.mode==='create'?'Cost ':'Recover ')+r.rate+' SP'+(this.mode==='recover'?' · '+r.available+' slots available':'')+'</small></span><select data-font-level="'+r.level+'" style="flex:0 0 7ch;width:7ch;min-width:7ch;margin-left:4px">'+Array.from({length:r.limit+1},(_,n)=>'<option value="'+n+'" '+(r.value===n?'selected':'')+'>'+n+'</option>').join('')+'</select></label>').join('')+'</fieldset><p><strong>'+(this.mode==='create'?'Cost: ':'Recover: ')+totals.points+' Sorcery Points</strong></p><button type="button" data-font-confirm '+(!valid||this.committing?'disabled':'')+'>Confirm</button><button type="button" data-font-cancel>Cancel</button></div>';}
 _replaceHTML(result,content){content.innerHTML=result;}
 _onRender(context,options){super._onRender(context,options);this.element.querySelector('[data-font-mode]').addEventListener('change',e=>{if(this.committing)return;this.mode=e.target.value;this.selection={};this.render({force:true});});for(const select of this.element.querySelectorAll('[data-font-level]'))select.addEventListener('change',()=>{if(this.committing)return;this.selection[select.dataset.fontLevel]=Number(select.value);this.render({force:true});});this.element.querySelector('[data-font-cancel]').addEventListener('click',()=>{if(!this.committing)this.close();});this.element.querySelector('[data-font-confirm]').addEventListener('click',async()=>{if(this.committing)return;this.committing=true;this.element.querySelector('[data-font-confirm]').disabled=true;try{const result=await convertFont(this.item.actor,this.mode,this.selection);if(result?.message){this.completed=true;await this.close();}else{this.committing=false;this.render({force:true});}}catch(error){this.committing=false;ui.notifications.warn(error.message);this.render({force:true});}});}
}
export async function openFont(item){if(!fontItem(item)||!item.actor?.isOwner||dialogs.has(item.actor.uuid))return;dialogs.add(item.actor.uuid);const app=new FontOfMagicDialog(item),close=app.close;app.close=async function(...args){if(this.committing&&!this.completed)return this;try{return await close.apply(this,args);}finally{dialogs.delete(item.actor.uuid)}};try{await app.render({force:true});return app;}catch(error){dialogs.delete(item.actor.uuid);throw error;}}
Hooks.once("init",()=>game.settings.register(ID,"fontOfMagicAutomation",{name:"Sorcerer: Font of Magic",hint:"Open a budget-aware popup to convert spell slots and Sorcery Points with native resource and Bonus Action handling.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{globalThis.Ugmuls55eAutomationFont={isItem:fontItem,open:openFont};});
