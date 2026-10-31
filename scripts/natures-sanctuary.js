const ID='ugmuls-5-5e-automation',pending=new Map();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier;
const resistance=e=>values(e.system?.changes).find(c=>c.key==='system.traits.dr.value')?.value;
export function sanctuaryWard(item){
 const actor=item.actor,ward=values(actor?.items).find(i=>i.type==='feat'&&key(i)==='natures-ward'&&i.system?.source?.rules!=='2014');if(!ward)return null;
 const active=values(ward.effects).find(e=>!e.disabled&&!e.isSuppressed&&!e.duration?.expired&&resistance(e));
 const type=active?resistance(active):({arid:'fire',polar:'cold',temperate:'lightning',tropical:'poison'})[actor?.getFlag?.(ID,'landSelection')?.type??actor?.flags?.[ID]?.landSelection?.type];
 return values(item.effects).find(e=>resistance(e)===type&&values(e.statuses).includes('coverHalf'))??null;
}
async function coverOnly(item){
 const existing=values(item.effects).find(e=>e.getFlag?.(ID,'sanctuaryCoverSource')??e.flags?.[ID]?.sanctuaryCoverSource);if(existing)return existing;
 if(pending.has(item.uuid))return pending.get(item.uuid);
 const task=(async()=>{const source=values(item.effects).find(e=>values(e.statuses).includes('coverHalf'));if(!source)throw Error('Nature’s Sanctuary is missing its native Half Cover effect.');
  const data=source.toObject();delete data._id;delete data.folder;delete data.start;data.name='Nature’s Sanctuary: Half Cover';data.disabled=false;data.transfer=false;data.statuses=['coverHalf'];data.system={...data.system,changes:[]};data.flags={...data.flags,[ID]:{...data.flags?.[ID],sanctuaryCoverSource:true}};
  return (await item.createEmbeddedDocuments('ActiveEffect',[data]))[0];})();pending.set(item.uuid,task);try{return await task;}finally{pending.delete(item.uuid);}
}
export async function sanctuaryRegionEffects(config,item,configured){
 if(config?.regionEffectSelector!=='naturesSanctuary'||key(item)!=='natures-sanctuary'||item.system?.source?.rules==='2014')return configured;
 if(!configured?.length)return [];
 const effect=sanctuaryWard(item)??await coverOnly(item);
 // One native area effect: cover is a status, never an additional AC change.
 // The native Region behavior handles entry, exit, movement and deletion.
 return [{id:'sanctuaryBuff01',name:'Sanctuary',effectUuid:effect.uuid}];
}
Hooks.once('ready',()=>{globalThis.Ugmuls55eAutomationSanctuary={regionEffects:sanctuaryRegionEffects};});
