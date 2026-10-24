const ID="ugmuls-5-5e-automation",pending=new WeakSet();
const values=c=>Array.from(c?.values?.()??c??[]);
const authority=()=>game.user?.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id);
function ownedAura(region){const f=region?.flags?.[ID];return !!(f&&(f.paladinAura||f.monsterAura||f.flamingSphereToken||f.guardianToken||f.casterUserId));}
export async function migrateAuraGrid(region){
 if(!authority()||!ownedAura(region)||region.flags[ID].auraGridVersion===1||pending.has(region))return;
 const shapes=values(region.shapes);if(!shapes.some(s=>s.type==="emanation"))return;
 pending.add(region);
 try{
  const update={["flags."+ID+".auraGridVersion"]:1};
  if(shapes.some(s=>s.type==="emanation"&&s.gridBased!==true))update.shapes=shapes.map(shape=>{const data=shape.toObject?.()??structuredClone(shape);if(data.type==="emanation")data.gridBased=true;return data;});
  await region.update(update);
 }finally{pending.delete(region);}
}
function sceneAuras(scene){if(!authority())return;return Promise.all(values(scene?.regions).map(region=>migrateAuraGrid(region)));}
function report(error){console.error("Aura grid shape migration",error);}
Hooks.once("ready",()=>{
 for(const event of ["createRegion","updateRegion"])Hooks.on(event,region=>{migrateAuraGrid(region).catch(report);});
 Hooks.on("canvasReady",()=>sceneAuras(globalThis.canvas?.scene)?.catch(report));
 for(const scene of values(game.scenes))sceneAuras(scene)?.catch(report);
});
