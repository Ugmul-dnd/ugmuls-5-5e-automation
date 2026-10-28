const ID="ugmuls-5-5e-automation",selected=new WeakMap(),pending=new WeakMap(),reserved=new Map();
const enabled=()=>game.settings.get(ID,"sneakAttackAutomation")===true;
export const sneakFeature=actor=>Array.from(actor?.items??[]).find(item=>item.type==="feat"&&
    (item.identifier==="sneak-attack"||item.system?.identifier==="sneak-attack"||/^sneak attack$/i.test(item.name?.trim()??"")));
export const combatTurn=()=>game.combat?.started?`${game.combat.id}:${game.combat.round}:${game.combat.turn}`:null;
export function sneakUsed(actor) {
    const turn=combatTurn();if(!turn)return false;
    return reserved.get(actor?.uuid)===turn||Array.from(actor?.effects??[]).some(effect=>!effect.disabled&&effect.active!==false&&
        effect.getFlag?.(ID,"sneakTurn")===turn);
}
function actorFor(app){return (app.message?.data?.speaker?ChatMessage.getSpeakerActor(app.message.data.speaker):null)??app.config.subject?.actor;}
function eligible(app){return enabled()&&app.config.subject?.type==="attack"&&app.config.subject.item?.type==="weapon"&&
    !app.message?.data?.flags?.[ID]?.masteryGraze&&actorFor(app)?.isOwner&&sneakFeature(actorFor(app));}
export function sneakAttackContext(app) {
    const data=app.message?.data??{},pending=globalThis.Ugmuls55eAutomationPendingDamage?.pendingCard?.(app),origin=data.system?.origin??pending?.system?.origin;
    const usage=typeof origin==="string"?game.messages.get(origin.replace(/^ChatMessage\./,"")):origin;
    const explicit=data.flags?.[ID]?.damageAttackId??pending?.getFlag?.(ID,"damageAttackId");
    const attack=explicit?game.messages.get(explicit):usage?.type==="attack"?usage:Array.from(usage?.getAssociatedRolls?.("attack")??[]).sort((a,b)=>b.timestamp-a.timestamp)[0];
    const targets=data.system?.targets?.length?data.system.targets:pending?.system?.targets?.length?pending.system.targets:attack?.system?.targets?.length?attack.system.targets:usage?.system?.targets??[];
    return {attack,targets};
}
const unableToFight=actor=>["incapacitated","unconscious","stunned","paralyzed","petrified","dead"].some(status=>actor?.statuses?.has?.(status))||actor?.system?.attributes?.hp?.value===0;
export function adjacentSneakAlly(app,attack,targets) {
    const actor=actorFor(app),item=app.config?.subject?.item,properties=item?.system?.properties;
    const finesse=properties?.has?.("fin")||Array.from(properties??[]).includes("fin");
    const ranged=app.config?.subject?.attack?.type?.value==="ranged"||["simpleR","martialR"].includes(item?.system?.type?.value);
    if(!finesse&&!ranged||targets.length!==1)return false;
    const target=globalThis.fromUuidSync?.(targets[0].token,{strict:false});
    const speaker=attack?.speaker,source=attack?.getAssociatedToken?.()??(speaker?.scene&&speaker?.token?globalThis.fromUuidSync?.('Scene.'+speaker.scene+'.Token.'+speaker.token,{strict:false}):actor?.token);
    const rogue=source?.document??source,scene=target?.parent,grid=globalThis.canvas?.grid;
    if(!target?.actor||!rogue||rogue.parent?.id!==scene?.id||!grid?.measurePath)return false;
    const disposition=Number(rogue.disposition),targetDisposition=Number(target.disposition);
    // Be conservative for neutral/unknown allegiances; the manual selector remains available.
    if(!Number.isFinite(disposition)||!disposition||!Number.isFinite(targetDisposition)||!targetDisposition||Math.sign(disposition)===Math.sign(targetDisposition))return false;
    const size=Number(scene.grid?.size??globalThis.canvas?.dimensions?.size),units=String(scene.grid?.units??"ft"),limit=/^(m|meters?|metres?)$/i.test(units)?1.524:5;
    if(!Number.isFinite(size)||size<=0)return false;
    // Measure between the closest occupied square centers, so large creatures count at their edges.
    const point=(token,towards)=>{const width=Number(token.width??1),height=Number(token.height??1);
        if(scene.grid?.type===0)return {x:Math.max(Number(token.x),Math.min(Number(token.x)+width*size,towards.x)),y:Math.max(Number(token.y),Math.min(Number(token.y)+height*size,towards.y))};
        return {x:Number(token.x)+size*(0.5+Math.max(0,Math.min(Math.ceil(width)-1,Math.round((towards.x-Number(token.x))/size-0.5)))),y:Number(token.y)+size*(0.5+Math.max(0,Math.min(Math.ceil(height)-1,Math.round((towards.y-Number(token.y))/size-0.5))))};};
    const center=token=>({x:Number(token.x)+Number(token.width??1)*size/2,y:Number(token.y)+Number(token.height??1)*size/2});
    for(const ally of scene.tokens??[]){
        if(!ally.actor||ally.uuid===target.uuid||ally.actor.uuid===actor?.uuid||Number(ally.disposition)!==disposition||unableToFight(ally.actor)||!game.user.isGM&&ally.hidden)continue;
        if(Math.abs(Number(ally.elevation??0)-Number(target.elevation??0))>limit)continue;
        const a=point(ally,center(target)),b=point(target,center(ally)),distance=grid.measurePath([a,b]).distance;
        if(Number.isFinite(distance)&&distance<=limit)return true;
    }
    return false;
}
export function sneakDefault(app) {
    const {attack,targets}=sneakAttackContext(app),options=attack?.rolls?.[0]?.options;
    if(!options)return false;
    const mode=options.advantageMode;
    if(mode===1)return true;
    if(mode===-1||mode===undefined&&options.disadvantage===true&&options.advantage!==true)return false;
    return adjacentSneakAlly(app,attack,targets);
}
export function addSneakChoice(app) {
    if(!eligible(app))return;
    const used=sneakUsed(actorFor(app));
    if(!selected.has(app))selected.set(app,sneakDefault(app));
    if(used)selected.set(app,false);
    const group=globalThis.Ugmuls55eAutomationDamage.addDamageChoice(app,{
        key:"sneak",label:"Sneak Attack",used,
        value:selected.get(app),disabled:used,change:yes=>{selected.set(app,yes);globalThis.Ugmuls55eAutomationCunning?.addCunningChoices(app,yes&&!sneakUsed(actorFor(app)));}
    });
    if(group)group.dataset.rsaSneak="";
    globalThis.Ugmuls55eAutomationCunning?.addCunningChoices(app,selected.get(app)===true&&!used);
}
export function finalizeSneak(app,rolls,{preview=false}={}) {
    if(preview&&!selected.has(app))selected.set(app,sneakDefault(app));
    if(!eligible(app)||selected.get(app)!==true||sneakUsed(actorFor(app))||rolls.some(roll=>roll.options?.rsaSneakAttack))return rolls;
    const actor=actorFor(app),feature=sneakFeature(actor);
    const activity=Array.from(feature.system?.activities??[]).find(activity=>activity.damage?.parts?.length);
    const source=activity?.getDamageConfig?.()?.rolls?.[0];
    if(!source?.parts?.length){if(!preview)ui.notifications.warn("Sneak Attack needs a configured damage activity on its feature.");return rolls;}
    const base=rolls[0]?.options??{},policy={...base.critical,bonusDice:0,bonusDamage:""};
    let config={...source,options:{...source.options,type:base.type,types:base.type?[base.type]:[],flavor:"Sneak Attack",isCritical:base.isCritical===true,
        critical:policy,rsaSneakAttack:true}};
    config=globalThis.Ugmuls55eAutomationCunning?.reduceCunning(app,config,{preview})??config;
    const extra=CONFIG.Dice.DamageRoll.fromConfig(config,{critical:policy});
    const turn=combatTurn();if(turn&&!preview){reserved.set(actor.uuid,turn);pending.set(app,{actor,turn});}
    const result=[...rolls,extra];
    const assassin=globalThis.Ugmuls55eAutomationAssassinate?.finalizeAssassinateDamage(app,result)??result;
    return globalThis.Ugmuls55eAutomationDeathStrike?.tagDeathStrike(app,assassin)??assassin;
}
export async function commitSneak(app,options) {
    const entry=pending.get(app);if(!entry)return;
    const {actor,turn}=entry;
    try {if(options?.dnd5e?.submitted)await saveUsedMarker(actor,{
        name:"Sneak Attack - used",img:sneakFeature(actor)?.img,disabled:false,transfer:false,
        system:{changes:[]},flags:{[ID]:{sneakTurn:turn,sneakCombat:game.combat?.id}}
    });}finally {if(reserved.get(actor.uuid)===turn)reserved.delete(actor.uuid);pending.delete(app);}
}
export async function resetSneakTurn(combat,changes) {
    if(!game.user.isGM||(game.users.activeGM&&game.users.activeGM.id!==game.user.id)||!("turn" in changes||"round" in changes||changes.started===false))return;
    const turn=combat.started?`${combat.id}:${combat.round}:${combat.turn}`:null;
    const actors=new Map(Array.from(combat.combatants??[]).filter(entry=>entry.actor).map(entry=>[entry.actor.uuid,entry.actor]));
    for(const actor of actors.values()) {
        const ids=Array.from(actor.effects??[]).filter(effect=>effect.getFlag?.(ID,"sneakCombat")===combat.id&&effect.getFlag(ID,"sneakTurn")!==turn).map(effect=>effect.id);
        if(ids.length)await actor.deleteEmbeddedDocuments("ActiveEffect",ids);
    }
}
Hooks.once("init",()=>game.settings.register(ID,"sneakAttackAutomation",{name:"Sneak Attack Assistance",hint:"Offer Sneak Attack on weapon damage dialogs. Advantage or an eligible nearby ally checks it by default. The ally check requires a finesse/ranged weapon and no effective Disadvantage; other cases can be selected manually. Resets after each combat turn.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
    globalThis.Ugmuls55eAutomationSneak={addSneakChoice,finalizeSneak,commitSneak};
    Hooks.on("updateCombat",(combat,changes)=>resetSneakTurn(combat,changes).catch(err=>console.error("Ugmuls 5.5e Automation | Sneak Attack reset failed:",err)));
});

function saveUsedMarker(actor,data) {
    return globalThis.Ugmuls55eAutomationResources?.reuseMarker?globalThis.Ugmuls55eAutomationResources.reuseMarker(actor,data,"sneakTurn"):
        actor.createEmbeddedDocuments("ActiveEffect",[data]);
}
