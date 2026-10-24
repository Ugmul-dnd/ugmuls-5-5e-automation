const ID="ugmuls-5-5e-automation",values=c=>Array.from(c?.values?.()??c??[]),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k];
const live=e=>!e.disabled&&!e.duration?.expired&&!e.system?.expired;
export async function syncPaladinLights(actor,{removed=[]}={}){
 const controls=[...values(actor.effects),...removed],sacred=game.settings.get(ID,"sacredWeaponAutomation")!==false&&values(actor.effects).some(e=>live(e)&&flag(e,"sacredWeapon")&&values(actor.items).some(i=>i.uuid===flag(e,"sacredWeapon").weapon&&i.system?.equipped===true));
 const holy=game.settings.get(ID,"holyNimbusAutomation")!==false&&values(actor.effects).some(e=>live(e)&&flag(e,"holyNimbus"))&&!["incapacitated","unconscious","stunned","paralyzed","petrified","dead"].some(s=>actor.statuses?.has(s));
 const radius=Number(actor.system?.scale?.paladin?.aura?.value??actor.system?.scale?.paladin?.aura)||30;
 const scenes=new Set([...values(game.scenes),globalThis.canvas?.scene].filter(Boolean)),records=[];
 for(const scene of scenes)for(const token of values(scene.tokens).filter(t=>t.actor?.uuid===actor.uuid)){
  const old=flag(token,"paladinLight"),legacy=controls.flatMap(e=>flag(e,"sacredWeapon")?.lights??[]).find(r=>r.token===token.uuid),state=old??legacy;
  const current={bright:Number(token.light?.bright??0),dim:Number(token.light?.dim??0)};
  if(!sacred&&!holy){if(!state)continue;const updates={};for(const k of ["bright","dim"])if(current[k]===state.applied[k]&&current[k]!==state.before[k])updates["light."+k]=state.before[k];if(old)updates["flags."+ID+".-=paladinLight"]=null;if(Object.keys(updates).length)await token.update(updates);continue;}
  const before={...(state?.before??current)};if(state)for(const k of ["bright","dim"])if(current[k]!==state.applied[k])before[k]=current[k];
  const scale=/^(m|meters?|metres?)$/i.test(scene.grid?.units??"")?0.3048:1,applied={bright:Math.max(before.bright,(sacred?20:0)*scale,(holy?radius:0)*scale),dim:Math.max(before.dim,(sacred?40:0)*scale,(holy?radius:0)*scale)},record={token:token.uuid,before,applied};
  const updates={};for(const k of ["bright","dim"])if(current[k]!==applied[k])updates["light."+k]=applied[k];
  const stored={before,applied,sunlight:holy};if(JSON.stringify(old)!==JSON.stringify(stored))updates["flags."+ID+".paladinLight"]=stored;
  if(Object.keys(updates).length)await token.update(updates);records.push(record);
 }
 return records;
}
