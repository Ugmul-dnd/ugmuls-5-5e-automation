const ID='ugmuls-5-5e-automation',SOURCE='WyUCK5w0TSWq7i7N',installed=new WeakSet();
const key=i=>i?.identifier??i?.system?.identifier;
export function repairThrallsProfiles(data){if(data.type!=='spell'||key(data)!=='animate-dead')return false;let repaired=false;for(const effect of data.effects??[]){if(effect.disabled||!([effect._stats?.compendiumSource,effect._stats?.duplicateSource].some(ref=>ref?.endsWith('.'+SOURCE))||effect.name==='Undead Thralls (Animate Dead)'))continue;for(const change of effect.system?.changes??[]){if(change.key!=='activities[summon].profiles'||change.type!=='override'||typeof change.value!=='string')continue;try{JSON.parse(change.value);continue;}catch{}let profiles;try{profiles=JSON.parse(change.value.replace(/}\s*{/g,'}, {'));}catch{continue;}if(!Array.isArray(profiles)||profiles.length!==2||!profiles.every(p=>typeof p._id==='string'&&typeof p.uuid==='string'&&p.uuid.startsWith('Compendium.')&&typeof p.count==='string')||!profiles.some(p=>p.uuid.endsWith('.mmSkeleton000000'))||!profiles.some(p=>p.uuid.endsWith('.mmZombie00000000')))continue;
 // Native Change values support arrays. Keep the official actor UUIDs, profile
 // IDs, counts and the other HP/damage enchantment changes intact.
 change.value=profiles;repaired=true;}}return repaired;}
export function prepareThrallsCompatibility(activity,usage,dialog,message){if(activity?.type!=='summon'||key(activity.item)!=='animate-dead')return;const item=activity.item,data=item.toObject();if(!repairThrallsProfiles(data))return;const old=activity.profiles?.find(p=>p._id===usage.summons?.profile);item.updateSource(data);item.prepareFinalAttributes();const current=item.system.activities.get(activity.id);if(!current)return;
 // The dialog still holds the pre-hook Activity reference; give it the same
 // repaired profile choices as the freshly prepared temporary item.
 activity.profiles=current.profiles;const profiles=current.profiles,selected=profiles.find(p=>p._id===usage.summons?.profile)??profiles.find(p=>old?.uuid&&p.uuid===old.uuid);if(usage.summons)usage.summons.profile=selected?._id??'';
 message.data??={};message.data.flags??={};message.data.flags[ID]={...message.data.flags[ID],thrallsProfilesRepaired:true,activityOverrideData:data};message.data.flags.dnd5e={...message.data.flags.dnd5e,item:{...message.data.flags.dnd5e?.item,data}};
}
export function installAnimateDeadPlacement(Type){const p=Type?.prototype;if(!p?.getPlacement||installed.has(p))return;installed.add(p);const placement=p.getPlacement;p.getPlacement=function(token,profile,options){
 // Table-managed corpse/control counts are separate from token placement.
 // Each cast or later Summon click places one undead; leave all stat scaling.
 return placement.call(this,token,key(this.item)==='animate-dead'?{...profile,count:'1'}:profile,options);
};}
Hooks.once('ready',()=>{installAnimateDeadPlacement(CONFIG.DND5E.activityTypes?.summon?.documentClass);Hooks.on('dnd5e.preUseActivity',prepareThrallsCompatibility);});
