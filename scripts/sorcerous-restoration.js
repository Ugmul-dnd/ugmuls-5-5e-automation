const ID="ugmuls-5-5e-automation",wrapped=new WeakSet(),prepared=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),key=i=>i?.identifier??i?.system?.identifier;
const enabled=()=>game.settings.get(ID,"sorcerousRestorationAutomation")===true;
export function sorcerousRestoration(actor){
    if(!enabled()||!actor?.isOwner||actor.type==="group")return {available:false};
    const items=values(actor?.items),feature=items.find(i=>i.type==="feat"&&key(i)==="sorcerous-restoration"&&i.system?.source?.rules!=="2014");
    const activity=values(feature?.system?.activities).find(a=>(a.id??a._id)==="H8hZYUmd4BHU3mek"||a.name==="Restore Sorcery Points");
    const target=values(activity?.consumption?.targets).find(t=>t.type==="itemUses"&&t.target);
    const resource=target&&(actor.items?.get?.(target.target)??items.find(i=>i.id===target.target||i.uuid===target.target||i._stats?.compendiumSource===target.target)??items.find(i=>key(i)==="font-of-magic"||key(i)==="sorcery-points"));
    const spent=Number(feature?.system?.uses?.spent??0),max=Number(feature?.system?.uses?.max),pointsSpent=Number(resource?.system?.uses?.spent??0);
    let amount=0;
    if(target?.value&&resource){const roll=new CONFIG.Dice.BasicRoll(String(target.value),feature.getRollData?.()??actor.getRollData?.()??{});if(roll.isDeterministic!==false){const total=Number(roll.evaluateSync().total);if(Number.isInteger(total)&&total<0)amount=-total;}}
    return {feature,resource,spent,pointsSpent,amount,recover:Math.min(amount,pointsSpent),available:enabled()&&actor?.isOwner&&actor.type!=="group"&&!!activity&&!!resource&&Number.isInteger(spent)&&max>spent&&Number.isInteger(pointsSpent)&&pointsSpent>0&&amount>0};
}
export function restorationFields(actor,config={}){
    const c=sorcerousRestoration(actor);if(!c.available)return [];
    return [{name:"rsaSorcerousRestoration",field:new foundry.data.fields.BooleanField({label:"Recover "+c.recover+" Sorcery Point"+(c.recover===1?"":"s")+" (once per Long Rest)",required:false}),value:config.rsaSorcerousRestoration===true}];
}
export function installRestorationRest(Type){
    const p=Type?.prototype;if(!p||wrapped.has(p)||typeof p._prepareContext!=="function")return;wrapped.add(p);const prepare=p._prepareContext,process=p._processFormData;
    p._prepareContext=async function(...args){const context=await prepare.apply(this,args);if(this.config?.type!=="short"||this.isPartyGroup)return context;const fields=restorationFields(this.actor,this.config);if(fields.length){for(const field of fields)field.input=context.inputs?.createCheckboxInput;context.formSections??=[];context.formSections.push({legend:"Sorcerous Restoration",fields});}return context;};
    if(process)p._processFormData=function(...args){const selected=this.element?.querySelector?.('[name="rsaSorcerousRestoration"]')?.checked===true,data=process.apply(this,args);if(this.config?.type==="short"&&!this.isPartyGroup)data.rsaSorcerousRestoration=selected;return data;};
}
const projected=(data,path,fallback)=>Object.hasOwn(data,path)?data[path]:foundry.utils.getProperty(data,path)??fallback;
export function prepareSorcerousRestoration(actor,result,config={},user=game.user){
    if(!result||prepared.has(result)||(config.type??result.type)!=="short"||config.rsaSorcerousRestoration!==true)return;
    const c=sorcerousRestoration(actor);if(!c.available||!(user?.isGM||actor.testUserPermission?.(user,"OWNER")))throw Error("Sorcerous Restoration is unavailable or already used since your last Long Rest.");
    const path="system.uses.spent",featureUpdate=(result.updateItems??[]).find(i=>i._id===c.feature.id),resourceUpdate=(result.updateItems??[]).find(i=>i._id===c.resource.id);
    const spent=Number(projected(featureUpdate??{},path,c.spent)),points=Number(projected(resourceUpdate??{},path,c.pointsSpent));
    if(spent!==c.spent||!Number.isInteger(points)||points<0||points>c.pointsSpent)throw Error("Sorcery resources changed during this rest. Reopen Short Rest.");
    const recover=Math.min(c.amount,points);if(!recover)return;
    // Both changes join the native rest's item update: preview/cancel never spend a use.
    result.updateItems??=[];
    if(resourceUpdate)resourceUpdate[path]=points-recover;else result.updateItems.push({_id:c.resource.id,[path]:points-recover});
    if(featureUpdate)featureUpdate[path]=spent+1;else result.updateItems.push({_id:c.feature.id,[path]:spent+1});
    prepared.add(result);
}
Hooks.once("init",()=>game.settings.register(ID,"sorcerousRestorationAutomation",{name:"Sorcerer: Sorcerous Restoration",hint:"Offer Sorcerous Restoration during Short Rest. Recover the native Sorcery Point amount and spend its once-per-Long-Rest use only when completing the rest.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{installRestorationRest(CONFIG.DND5E.restTypes?.short?.dialogClass);Hooks.on("dnd5e.preRestCompleted",(actor,result,config)=>{try{return prepareSorcerousRestoration(actor,result,config);}catch(error){console.error("Sorcerous Restoration",error);ui.notifications.error(error.message);return false;}});});
