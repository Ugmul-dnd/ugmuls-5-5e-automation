import {describeTarget,isEligibleTarget,isEligibleHealingTarget,isRollAdjustmentLocked,linkedHpCards} from './shared-activity-card.js';
const ID='ugmuls-5-5e-automation',rolling=new Set(),values=v=>Array.from(v?.values?.()??v??[]),doc=t=>t?.document??t;
const enabled=()=>game.settings.get(ID,'landsAidAutomation')===true;
export const landsAidActivity=a=>enabled()&&a?.type==='save'&&a.item?.type==='feat'&&(a.item.identifier??a.item.system?.identifier)==='lands-aid'&&a.item.system?.source?.rules!=='2014';
export function landsAidCandidates(source,regions,healing=false){
 source=doc(source);if(!source||!regions.length)return [];
 const hostile=CONST.TOKEN_DISPOSITIONS.HOSTILE,friendly=CONST.TOKEN_DISPOSITIONS.FRIENDLY;
 return values(canvas.tokens?.placeables).map(doc).filter(t=>t.object?.isVisible!==false&&(healing?isEligibleHealingTarget(t)&&t.disposition===source.disposition:isEligibleTarget(t))&&regions.some(r=>t.testInsideRegion?.(r))&&(healing||t.uuid!==source.uuid&&t.disposition===(source.disposition===hostile?friendly:hostile)));
}
export class LandsAidTargets extends foundry.applications.api.ApplicationV2{
 static DEFAULT_OPTIONS={window:{title:'Land’s Aid — Confirm Targets'},position:{width:660,height:'auto'}};
 constructor(activity,message,source,regions){super({id:'rsa-lands-aid-'+message.id});Object.assign(this,{activity,message,source:doc(source),regions,excluded:new Set(),hooks:[],healing:null});}
 damage(){return landsAidCandidates(this.source,this.regions).filter(t=>!this.excluded.has(t.uuid));}
 async _renderHTML(){
  const escape=foundry.utils.escapeHTML,damage=landsAidCandidates(this.source,this.regions),healing=landsAidCandidates(this.source,this.regions,true);
  if(!healing.some(t=>t.uuid===this.healing))this.healing=(healing.find(t=>t.uuid===this.source.uuid)??healing.find(t=>t.disposition===this.source.disposition)??healing[0])?.uuid??'';
  return '<div style="padding:12px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:18px"><section><h3>Damage / Save</h3><p>Enemies in the area. Uncheck any to exclude them.</p>'+damage.map(t=>'<label style="display:flex;gap:8px;align-items:center;margin:7px 0"><input type="checkbox" data-lands-damage="'+escape(t.uuid)+'" '+(!this.excluded.has(t.uuid)?'checked':'')+'><span>'+escape(t.name)+'</span></label>').join('')+(!damage.length?'<p>No enemies in the area.</p>':'')+'</section><section><h3>Healing</h3><p>Choose one creature in the same area.</p><select data-lands-healing aria-label="Healing target">'+healing.map(t=>'<option value="'+escape(t.uuid)+'" '+(t.uuid===this.healing?'selected':'')+'>'+escape(t.name)+'</option>').join('')+(!healing.length?'<option value="">No eligible creature in the area</option>':'')+'</select></section></div><footer style="display:flex;gap:8px;margin-top:16px"><button type="button" data-lands-confirm>Confirm Targets</button><button type="button" data-lands-cancel>Cancel Cast</button></footer></div>';
 }
 _replaceHTML(result,content){content.innerHTML=result;}
 _onRender(context,options){super._onRender(context,options);
  for(const input of this.element.querySelectorAll('[data-lands-damage]'))input.addEventListener('change',()=>{if(input.checked)this.excluded.delete(input.dataset.landsDamage);else this.excluded.add(input.dataset.landsDamage);});
  this.element.querySelector('[data-lands-healing]').addEventListener('change',event=>{this.healing=event.currentTarget.value;});
  this.element.querySelector('[data-lands-cancel]').addEventListener('click',()=>this.close());
  this.element.querySelector('[data-lands-confirm]').addEventListener('click',async()=>{
   if(this.committing)return;this.committing=true;
   try{const heal=landsAidCandidates(this.source,this.regions,true).find(t=>t.uuid===this.healing),damage=this.damage().map(describeTarget);
    if(!heal&&landsAidCandidates(this.source,this.regions,true).length)throw Error('Choose one healing target in the area.');
    await this.message.update({['flags.'+ID+'.landsAidHealing']:{target:heal?describeTarget(heal):null,activity:this.activity.uuid,regions:this.regions.map(r=>r.uuid),rolled:false}});
    canvas.tokens.setTargets(damage.map(t=>t.token.split('.').at(-1)));this.confirmed=true;this.finish(damage);await this.close();
   }catch(error){this.committing=false;ui.notifications.warn(error.message);}
  });
 }
 choose(){return new Promise((resolve,reject)=>{this.finish=resolve;for(const name of ['updateToken','updateActor','deleteToken'])this.hooks.push([name,Hooks.on(name,document=>{const token=doc(document);if(this.rendered&&(name==='updateActor'?values(canvas.tokens?.placeables).some(t=>t.actor?.uuid===document.uuid):token.parent===this.source.parent))this.render({force:true});})]);Promise.resolve(this.render({force:true})).catch(error=>{this.cleanup();reject(error);});});}
 cleanup(){for(const [name,id]of this.hooks)Hooks.off(name,id);this.hooks=[];}
 async close(options){if(this.committing&&!this.confirmed)return this;this.cleanup();if(!this.confirmed)this.finish?.(null);return super.close(options);}
}
export async function rollLandsAidHealing(activity,message){
 if(!landsAidActivity(activity)||message.author?.id!==game.user.id||rolling.has(message.id))return;
 const selection=message.getFlag?.(ID,'landsAidHealing');if(!selection?.target||selection.rolled||selection.activity!==activity.uuid)return;
 const healing=values(activity.item.system?.activities).find(a=>a.type==='heal');if(!healing)throw Error('Land’s Aid is missing its native healing activity.');
 rolling.add(message.id);try{
  // Reuse the sibling native healing activity and the SAME usage origin. It
  // rolls without use(), so no second Wild Shape use or template is created.
  const rolls=await healing.rollDamage({},globalThis.Ugmuls55eAutomationDamage?.configurePromptDialog('damage',{configure:true})??{configure:true},{data:{system:{origin:message.id,targets:[selection.target]},flags:{[ID]:{landsAidHealingSource:message.id}}}});
  if(rolls?.length)await message.update({['flags.'+ID+'.landsAidHealing']:{...selection,rolled:true}});
 }finally{rolling.delete(message.id);}
}
export function landsAidRoot(card){
 const ref=card?.system?.origin,root=card?.type==='usage'?card:typeof ref==='string'?game.messages?.get(ref.replace(/^ChatMessage\./,'')):ref;
 const item=root?.getAssociatedItem?.()??root?.getAssociatedActivity?.()?.item;
 return (item?.identifier??item?.system?.identifier)==='lands-aid'?root:null;
}
export function landsAidPart(card){const root=landsAidRoot(card);return !root?null:card.type==='usage'?'usage':card.type==='healing'||card.getFlag?.(ID,'landsAidHealingSource')?'healing':card.type==='damage'?'damage':null;}
export async function retargetLandsAid(card,targets){
 const root=landsAidRoot(card),part=landsAidPart(card);if(!root||!['usage','healing'].includes(part))return;
 if(!game.user.isGM&&!card.isOwner)throw Error('You do not own this result card.');
 const cards=part==='usage'?[root,...linkedHpCards(root).filter(c=>landsAidPart(c)==='damage')]:[card];
 // The save branch owns damage only. An applied healing sibling must not lock
 // or retarget its unrelated saves and damage.
 if(cards.some(c=>c!==root&&isRollAdjustmentLocked(c)))throw Error('Undo this result before changing its targets.');
 if(cards.some(c=>!game.user.isGM&&!c.isOwner))throw Error('Ask the GM to retarget these linked result cards.');
 const source=doc(root.getAssociatedToken?.()??root.getAssociatedActivity?.()?.getUsageToken?.());if(!source)throw Error('The Land’s Aid caster token is unavailable.');
 const friendly=CONST.TOKEN_DISPOSITIONS.FRIENDLY,hostile=CONST.TOKEN_DISPOSITIONS.HOSTILE;
 const tokens=[...new Map(values(targets).map(doc).filter(t=>t?.actor&&t.parent?.id===source.parent?.id&&(part==='healing'?isEligibleHealingTarget(t)&&t.disposition===source.disposition:isEligibleTarget(t)&&t.disposition===(source.disposition===hostile?friendly:hostile))).map(t=>[t.uuid,t])).values()];
 if(part==='healing'&&tokens.length>1)throw Error('Choose only one friendly healing target.');
 const descriptors=tokens.map(describeTarget);
 // Keep the primary save usage and its exact linked damage cards together.
 // Healing retains an independent target list and never follows this update.
 for(const message of cards){message._targetState??={checked:new Map()};message._targetState.mode='targeted';message._targetState.checked?.clear?.();await message.update({'system.targets':descriptors,['flags.'+ID+'.retargeted']:true},{rsaRetarget:true});}
 for(const message of cards)globalThis.Ugmuls55eAutomationChatRefresh?.card(message);
}
Hooks.once('init',()=>game.settings.register(ID,'landsAidAutomation',{name:'Druid: Land’s Aid',hint:'Confirm enemy save/damage targets and one healing target in the same placed area. Roll both native activities under one usage card and spend Wild Shape once.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationLandsAid={isActivity:landsAidActivity,chooseTargets:(...args)=>new LandsAidTargets(...args).choose(),heal:rollLandsAidHealing,part:landsAidPart,retarget:retargetLandsAid};});
