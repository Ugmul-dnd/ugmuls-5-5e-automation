// Foundry marks min/max-clamped dice as rerolled while retaining an effective
// count. Keep those finalized dice, but exclude genuine discarded reroll history.
export const finalD20Results=results=>(results??[]).filter(r=>Number.isFinite(r.result)&&(!r.rerolled||Number.isFinite(r.count)&&(r.active!==false||r.discarded===true)));
export const d20ResultValue=result=>Number.isFinite(result.count)?result.count:result.result;
