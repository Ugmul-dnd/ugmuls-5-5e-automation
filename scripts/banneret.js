import {describeTarget,isEligibleHealingTarget} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",values=v=>Array.from(v?.values?.()??v??[]),doc=t=>t?.document??t;
const active=()=>game.settings.get(ID,"banneretAutomation")===true;
const resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
export function banneretActivity(activity){return active()&&activity?.type==="heal"&&activity.item?.type==="feat"&&!!activity.id&&({"group-recovery":"GKue41K0GkjUEzJk","team-tactics":"prA3XGTjuTOdIxOe"})[activity.item.identifier??activity.item.system?.identifier]===activity.id;}
export function banneretLimit(activity){return Math.max(1,Math.floor(Number(activity.actor?.system?.abilities?.cha?.mod??activity.item?.actor?.system?.abilities?.cha?.mod)||0));}
export function banneretRange(activity){const size=Number(activity.target?.template?.size);if(Number.isFinite(size)&&size>0)return size;const actor=activity.actor??activity.item?.actor;return values(actor?.items).some(item=>(item.identifier??item.system?.identifier)==="inspiring-commander")?60:30;}
export function banneretCandidates(activity,source,regions=[]){
 source=doc(source);if(!source?.actor)return [];
 return values(globalThis.canvas?.tokens?.placeables).filter(token=>{
  const target=doc(token);
  if(!isEligibleHealingTarget(target)||target.actor.uuid===source.actor.uuid||token.isVisible===false||target.disposition!==source.disposition||target.disposition===0)return false;
  if(regions.length)return regions.some(region=>target.testInsideRegion?.(region));
  if(!source.object?.center||!token.center)return false;
  const units=String(source.parent?.grid?.units??canvas.scene?.grid?.units??"ft").toLowerCase(),range=banneretRange(activity)*(/^(m|meters?|metres?)$/.test(units)?0.3048:1);
  const distance=canvas.grid.measurePath([source.object.center,token.center]).distance;
  return Number.isFinite(distance)&&distance<=range;
 });
}
export function validateBanneretTargets(activity,source,targets,regions=[]){
 const allowed=new Set(banneretCandidates(activity,source,regions).map(token=>doc(token).uuid));
 const seen=new Set();return targets.filter(target=>{if(!allowed.has(target.token)||seen.has(target.actor))return false;seen.add(target.actor);return true;}).slice(0,banneretLimit(activity));
}
export class BanneretTargets extends foundry.applications.api.ApplicationV2{
 static DEFAULT_OPTIONS={window:{title:"Select Banneret Allies"},position:{width:440,height:"auto"}};
 constructor(activity,message,source,regions=[]){super({id:"rsa-banneret-"+message.id});Object.assign(this,{activity,message,source:doc(source),regions,chosen:new Set(),hooks:[]});}
 candidates(){return banneretCandidates(this.activity,this.source,this.regions);}
 sync(){
  if(this.syncing)return;this.syncing=true;
  try{
   const allowed=new Set(this.candidates().map(token=>token.id)),selected=new Set(),actors=new Set();
   for(const token of values(game.user.targets)){
    if(!allowed.has(token.id)||selected.size>=banneretLimit(this.activity)||actors.has(token.actor?.uuid)){token.setTarget(false,{user:game.user,releaseOthers:false});continue;}
    selected.add(token.id);actors.add(token.actor.uuid);
   }
   this.chosen=selected;
  }finally{this.syncing=false;}
 }
 async _renderHTML(){
  this.sync();const escape=foundry.utils.escapeHTML,max=banneretLimit(this.activity);
  return '<div style="padding:12px"><p>Select up to <strong>'+max+'</strong> allies within '+banneretRange(this.activity)+' feet. Click an ally here or target them on the map.</p><p>'+this.chosen.size+' / '+max+' selected</p><div style="display:grid;gap:5px;max-height:360px;overflow-y:auto">'+this.candidates().map(token=>'<button type="button" data-banneret-token="'+escape(token.id)+'" aria-pressed="'+this.chosen.has(token.id)+'" '+(!this.chosen.has(token.id)&&this.chosen.size>=max?'disabled':'')+' style="display:flex;align-items:center;gap:8px"><input type="checkbox" tabindex="-1" style="pointer-events:none" '+(this.chosen.has(token.id)?'checked':'')+'><img src="'+escape(doc(token).texture?.src??token.actor.img)+'" alt="" style="width:28px;height:28px;object-fit:contain"><span>'+escape(token.name)+'</span></button>').join('')+'</div><footer style="display:flex;gap:8px;margin-top:12px"><button type="button" data-banneret-confirm '+(!this.chosen.size?'disabled':'')+'>Confirm Allies</button><button type="button" data-banneret-cancel>Cancel</button></footer></div>';
 }
 _replaceHTML(result,content){this.clearHover();content.innerHTML=result;}
 clearHover(event={}){this.hovered?._onHoverOut?.(event);this.hovered=null;}
 _onRender(context,options){
  super._onRender(context,options);
  for(const button of this.element.querySelectorAll('[data-banneret-token]')){
   button.addEventListener('click',()=>{const token=this.candidates().find(token=>token.id===button.dataset.banneretToken);if(!token)return;token.setTarget(!this.chosen.has(token.id),{user:game.user,releaseOthers:false});this.sync();this.render({force:true});});
   button.addEventListener('mouseenter',event=>{this.clearHover(event);const token=this.candidates().find(token=>token.id===button.dataset.banneretToken);if(token&&!token.hover){token._onHoverIn?.(event,{hoverOutOthers:true});this.hovered=token;}});
   button.addEventListener('mouseleave',event=>this.clearHover(event));
  }
  this.element.querySelector('[data-banneret-confirm]').addEventListener('click',async()=>{
   this.sync();const selected=this.candidates().filter(token=>this.chosen.has(token.id)).map(token=>describeTarget(doc(token)));
   const valid=validateBanneretTargets(this.activity,this.source,selected,this.regions);if(!valid.length)return;
   this.confirmed=true;this.finish(valid);await this.close();
  });
  this.element.querySelector('[data-banneret-cancel]').addEventListener('click',()=>this.close());
 }
 choose(){return new Promise((resolve,reject)=>{
  this.finish=resolve;this.sync();
  this.hooks.push(['targetToken',Hooks.on('targetToken',user=>{if(user.id!==game.user.id||this.syncing)return;this.sync();if(this.rendered)this.render({force:true});})]);
  for(const name of ['updateToken','updateActor'])this.hooks.push([name,Hooks.on(name,()=>{if(this.rendered)this.render({force:true});})]);
  Promise.resolve(this.render({force:true})).catch(error=>{for(const[name,id]of this.hooks)Hooks.off(name,id);reject(error);});
 });}
 async close(options){this.clearHover();for(const[name,id]of this.hooks)Hooks.off(name,id);this.hooks=[];if(!this.confirmed)this.finish?.(null);return super.close(options);}
}
export function prepareTeamTactics(effect){
 if(!active()||effect.parent?.documentName!=="Actor")return;
 const activity=resolve(effect.system?.origin?.activity),item=activity?.item??resolve(effect._stats?.duplicateSource)?.parent??resolve(effect.origin);
 if((item?.identifier??item?.system?.identifier)!=="team-tactics"||item.type!=="feat")return;
 const changes=values(effect.system?.changes).map(change=>({...change}));
 const keys=["system.rolls.attack.mode","system.attributes.init.roll.mode","system.attributes.death.roll.mode",...['str','dex','con','int','wis','cha'].flatMap(ability=>['check','save'].map(kind=>'system.abilities.'+ability+'.'+kind+'.roll.mode'))];
 for(const key of keys)if(!changes.some(change=>change.key===key))changes.push({key,value:1,type:"add",priority:null});
 const combat=game.combat,applied=combat?.started?{combat:combat.id,round:combat.round,turn:combat.turn}:null;
 effect.updateSource({"system.changes":changes,start:CONFIG.ActiveEffect.documentClass.getEffectStart(),duration:{value:null,units:"seconds",expiry:"sourceStart",expired:false},"system.origin.actor":item.actor?.uuid,"flags.dnd5e.isTemporary":true,["flags."+ID+".teamTactics"]:{source:item.actor?.uuid,applied}});
}
const ending=new Set();
export async function expireTeamTactics(combat,changes={}){
 if(!active()||!game.user.isGM||game.users.activeGM&&game.users.activeGM.id!==game.user.id||!combat.started||!combat.combatant||!('turn'in changes||'round'in changes))return;
 const caster=combat.combatant.actor;if(!caster||ending.has(caster.uuid))return;
 const actors=new Map(values(game.actors).map(actor=>[actor.uuid,actor]));for(const token of values(globalThis.canvas?.scene?.tokens))if(token.actor)actors.set(token.actor.uuid,token.actor);
 ending.add(caster.uuid);try{for(const actor of actors.values()){
  const ids=values(actor.effects).filter(effect=>{const marker=effect.getFlag?.(ID,'teamTactics'),applied=marker?.applied;return marker?.source===caster.uuid&&applied?.combat===combat.id&&(combat.round>applied.round||combat.round===applied.round&&combat.turn>applied.turn);}).map(effect=>effect.id);
  if(ids.length)await actor.deleteEmbeddedDocuments('ActiveEffect',ids);
 }}finally{ending.delete(caster.uuid);}
}
Hooks.once('init',()=>game.settings.register(ID,'banneretAutomation',{name:'Banneret Ally Selection and Team Tactics',hint:'Choose up to Charisma modifier allies (minimum one), excluding self, for manual Group Recovery or Team Tactics. Apply complete D20 Test Advantage through the start of the Banneret’s next turn.',scope:'world',config:true,type:Boolean,default:true}));
const selections=new WeakMap();
Hooks.once('ready',()=>{
 globalThis.Ugmuls55eAutomationBanneret={isActivity:banneretActivity,
  chooseTargets:async(activity,message,source,regions)=>{selections.set(activity,{source,regions});try{const result=await new BanneretTargets(activity,message,source,regions).choose();if(result===null)selections.delete(activity);return result;}catch(error){selections.delete(activity);throw error;}},
  validateTargets:(activity,source,targets)=>{const context=selections.get(activity);selections.delete(activity);return validateBanneretTargets(activity,context?.source??source,targets,context?.regions??[]);}};
 Hooks.on('preCreateActiveEffect',prepareTeamTactics);
 Hooks.on('updateCombat',(combat,changes)=>expireTeamTactics(combat,changes).catch(error=>{console.error('Team Tactics expiry',error);ui.notifications.error(error.message);}));
});
