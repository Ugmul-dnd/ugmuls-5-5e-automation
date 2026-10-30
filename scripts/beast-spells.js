const ID='ugmuls-5-5e-automation',wrapped=new WeakSet(),busy=new WeakSet();
const values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
export const beastSpellsFeature=actor=>values(actor?.items).find(i=>i.type==='feat'&&i.system?.source?.rules!=='2014'&&(key(i)==='beast-spells'||i.name?.trim().toLowerCase()==='beast spells'));
export function beastSpellEligible(item){
 if(item?.type!=='spell')return false;const s=item.system??{};
 return (Number(s.level)===0||Number(s.prepared)>0)&&s.materials?.consumed!==true&&!(Number(s.materials?.cost)>0);
}
export function beastSpellPlan(actor){
 const spells=values(actor.items).filter(i=>i.type==='spell'),moon=values(actor.items).some(i=>i.type==='subclass'&&key(i)==='moon'||i.type==='feat'&&key(i)==='circle-of-the-moon-spells');
 // Match the native Moon-list lookup, including separately owned Druid copies
 // of Moon spells. This permission is independent of Beast Spells restrictions.
 const moonIds=moon?new Set(globalThis.dnd5e?.registry?.spellLists?.forType?.('subclass:moon')?.identifiers??[]):new Set();
 return {hostSpells:new Set(spells.map(i=>i.id??i._id)),allowed:new Set(spells.filter(i=>moon&&(i.system?.sourceItem==='subclass:moon'||moonIds.has(key(i)))||beastSpellEligible(i)).map(i=>i.id??i._id))};
}
export function filterBeastSpellData(data,plan){
 if(Array.isArray(data?.items))data.items=data.items.filter(i=>i.type!=='spell'||!plan.hostSpells.has(i._id)||plan.allowed.has(i._id));
 return data;
}
export function installBeastSpells(Type){
 const p=Type?.prototype;if(!p?.transformInto||wrapped.has(p))return;wrapped.add(p);const transform=p.transformInto;
 p.transformInto=async function(source,settings,...args){
  if(game.settings.get(ID,'beastSpellsAutomation')!==true||settings?.preset!=='wildshape'||settings.keep?.has('self')||!beastSpellsFeature(this))return transform.call(this,source,settings,...args);
  if(busy.has(this))throw Error('A Wild Shape transformation is already in progress.');busy.add(this);
  const hooks=[];
  try{
   const plan=beastSpellPlan(this),data=settings.toObject();data.keep=[...new Set([...values(settings.keep),'spells'])];data.spellLists=[];
   const expanded=new settings.constructor(data);
   // Linked transformations expose their payload through the native transform
   // hook. Unlinked tokens skip that hook, so filter only their final native
   // actor update. Filter before creation/update rather than importing spells
   // afterwards; native item IDs and their spell/activity metadata stay intact.
   hooks.push(['dnd5e.transformActorV2',Hooks.on('dnd5e.transformActorV2',(host,_source,changes)=>{if(host===this)filterBeastSpellData(changes,plan);})]);
   const transformedName=`${this.name} (${source.name})`;
   if(this.isToken)hooks.push(['preUpdateActor',Hooks.on('preUpdateActor',(actor,changes)=>{if(actor.uuid===this.uuid&&changes.name===transformedName)filterBeastSpellData(changes,plan);})]);
   const result=await transform.call(this,source,expanded,...args);
   if(result&&this.isToken){
    // Native unlinked transforms compute deletion tombstones before the final
    // actor-update hook. Embedded-array updates do not delete omitted items,
    // so remove any excluded original spells still inherited by the ActorDelta
    // in one batch. Native previousActorData restores them when reverting.
    const actor=this.token?.actor??this,ids=values(actor.items).filter(i=>i.type==='spell'&&plan.hostSpells.has(i.id??i._id)&&!plan.allowed.has(i.id??i._id)).map(i=>i.id??i._id);
    if(ids.length)await actor.deleteEmbeddedDocuments('Item',ids);
   }
   return result;
  }finally{for(const [event,hook]of hooks)Hooks.off(event,hook);busy.delete(this);}
 };
}
Hooks.once('init',()=>game.settings.register(ID,'beastSpellsAutomation',{name:'Druid: Beast Spells',hint:'Retain eligible prepared spells and known cantrips on the native Wild Shape Spells tab when Beast Spells is owned. Exclude costly/consumed material spells while independently preserving Circle of the Moon spell access.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>installBeastSpells(CONFIG.Actor.documentClass));
