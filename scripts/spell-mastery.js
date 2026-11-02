const ID='ugmuls-5-5e-automation',pending=new WeakMap();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),enabled=()=>game.settings.get(ID,'spellMasteryAutomation')===true;
export function masteredSpell(item){if(item?.type!=='spell'||!Number.isInteger(Number(item.system?.level))||Number(item.system?.level)<1||Number(item.system?.level)>9)return false;return values(item.effects).some(effect=>effect.type==='enchantment'&&effect.transfer!==false&&effect.isAppliedEnchantment!==false&&!effect.disabled&&!effect.isSuppressed&&effect.active!==false&&!effect.duration?.expired&&!effect.system?.expired&&(effect.name?.trim().toLowerCase()==='mastered'||values(effect.system?.changes).some(c=>c.key==='name'&&/(?:^|,\s*)mastered\s*$/i.test(String(c.value??'')))));}
function sourceItem(activity){const item=activity?.item,actor=activity?.actor??item?.actor;return actor?.items?.get?.(item?.id)??item;}
export function masteryLevel(activity,config={}){const item=sourceItem(activity),base=Number(item?.system?.level),slot=config.spell?.slot,actor=activity?.actor??item?.actor;const level=Number(actor?.system?.spells?.[slot]?.level??(/^spell[1-9]$/.test(slot??'')?Number(slot.slice(5)):NaN));return Number.isFinite(level)?level:base+Math.max(0,Number(config.scaling)||0);}
function setConsumption(config,value){if(config.consume===false)return;if(config.consume===true)config.consume={action:true,resources:true,spellSlot:value};else{config.consume??={};config.consume.spellSlot=value;}}
const followup=(usage,message)=>usage.cause?.activity||['regionTriggered','riderTriggered','recurringTrigger'].some(k=>message?.data?.flags?.[ID]?.[k]);
export function prepareSpellMastery(activity,usage,dialog,message){const item=sourceItem(activity),actor=activity?.actor??item?.actor;if(!enabled()||!actor?.isOwner||!masteredSpell(item)||followup(usage,message)||usage.consume===false||item.getFlag?.('dnd5e','spellLevel'))return;
 const state={activity,manual:false};pending.set(message,state);setConsumption(usage,masteryLevel(activity,usage)>Number(item.system.level));
 const Base=dialog.applicationClass;if(!Base||dialog.configure===false)return;
 dialog.applicationClass=class extends Base{async _prepareSubmitData(event,formData){const data=await super._prepareSubmitData(event,formData),name=event?.target?.name;if(name==='consume.spellSlot')state.manual=true;if(name==='spell.slot'||name==='scalingValue'){state.manual=false;const config={...this.config,...data,spell:{...this.config?.spell,...data.spell}};setConsumption(data,!enabled()||!masteredSpell(sourceItem(activity))||masteryLevel(activity,config)>Number(sourceItem(activity).system.level));}return data;}};
}
export function revalidateSpellMastery(activity,usage,message){const state=pending.get(message);if(!state||state.manual||usage.consume===false)return;
 // If the live enchantment disappeared during configuration, discard the automatic waiver.
 if(!enabled()||!masteredSpell(sourceItem(activity)))setConsumption(usage,true);
}
Hooks.once('init',()=>game.settings.register(ID,'spellMasteryAutomation',{name:'Wizard: Spell Mastery',hint:'For spells with an active Mastered enchantment, default Consume Spell Slot off at base level and on when selecting an upcast level. Native manual checkbox overrides remain available.',scope:'world',config:true,type:Boolean,default:true}));
Hooks.once('ready',()=>{Hooks.on('dnd5e.preUseActivity',prepareSpellMastery);Hooks.on('dnd5e.preActivityConsumption',revalidateSpellMastery);});
