import {createEventQueue} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",enqueue=createEventQueue(),lastPaintedReminder=new WeakMap();
const values=value=>Array.from(value?.values?.()??value??[]);
const enabled=()=>game.settings.get(ID,"legendaryActionAutomation")===true;
const authority=()=>game.user?.isGM&&(!game.users?.activeGM||game.users.activeGM.id===game.user.id);
const managed=combatant=>combatant?.getFlag?.(ID,"legendaryActionSlot")??combatant?.flags?.[ID]?.legendaryActionSlot;
const operation={turnEvents:false,rsaLegendarySlot:true};
const incapacitated=new Set(["dead","incapacitated","unconscious","paralyzed","petrified","stunned"]);
function livingLegendary(actor){
    return actor?.type==="npc"&&Number(actor.system?.resources?.legact?.max)>0&&
        !(Number(actor.system?.attributes?.hp?.value)<=0)&&!values(actor.statuses).some(status=>incapacitated.has(status));
}
const playerTurn=c=>!!c.actor&&(c.actor.type==="character"||c.actor.hasPlayerOwner)&&Number.isFinite(c.initiative);
const availableLegendary=entries=>entries.some(c=>!c.defeated&&livingLegendary(c.actor)&&legendaryPoints(c.actor)>0);

export function legendaryActionSlot(combatant=game.combat?.combatant){
    // A real creature named Legendary Action must never become a free turn.
    return !!combatant&&combatant.hidden===true&&!combatant.actor&&!combatant.actorId&&!combatant.token&&!combatant.tokenId&&
        /^legendary actions?$/i.test(combatant.name?.trim()??"");
}
export function legendaryActor(actor,combat=game.combat){
    if(!combat?.started||!actor?.uuid)return false;
    // Chat activities may carry an actor snapshot. Read eligibility from the
    // live combat participant, including current HP and incapacitation.
    actor=values(combat.combatants).find(c=>c.actor?.uuid===actor.uuid&&!c.defeated)?.actor;
    return livingLegendary(actor);
}
export function legendaryPoints(actor){
    const resource=actor?.system?.resources?.legact;
    return Math.max(0,Number(resource?.value??(Number(resource?.max??0)-Number(resource?.spent??0)))||0);
}
export function legendaryActionUse(activityOrActor,combat=game.combat){
    const activity=activityOrActor?.item?activityOrActor:null,actor=activity?(activity.actor??activity.item.actor):activityOrActor;
    // Explicit reactions still spend a Reaction, including reactions to another
    // creature's legendary action. Only ordinary uses in this slot are exempt.
    if(String(activity?.activation?.type??"").startsWith("reaction"))return false;
    // Do not check remaining points here: the native legendary activity may
    // spend its last point before it opens a linked base attack. Native point
    // consumption and affordability checks remain entirely in the system.
    return !!(enabled()&&combat?.combatant&&legendaryActionSlot(combat.combatant)&&legendaryActor(actor,combat));
}
export function skipEmptyLegendarySlot(combat,changes){
    if(!authority())return;
    if(Object.hasOwn(changes,"turn")&&changes.turn===null||Object.hasOwn(changes,"round")&&changes.round<=0)return;
    if(!(combat.started||changes.started===true)||changes.started===false||!("turn" in changes||"round" in changes||changes.started===true))return;
    const turns=values(combat.turns),turn=changes.turn??combat.turn;
    if(!Number.isInteger(turn)||turn<0||turn>=turns.length||!legendaryActionSlot(turns[turn]))return;
    const target=turns[turn],link=managed(target),anchor=link&&values(combat.combatants).find(c=>c.id===link.after);
    if(!enabled()&&!link)return;
    if(enabled()&&(!link||anchor&&playerTurn(anchor)&&!anchor.defeated&&!anchor.isDefeated)&&availableLegendary(values(combat.combatants)))return;
    let index=turn,round=changes.round??combat.round;
    const direction=round<combat.round||round===combat.round&&turn<combat.turn?-1:1;
    for(let count=0;count<turns.length;count++){
        index+=direction;
        if(index>=turns.length){index=0;round++;}
        if(index<0){index=turns.length-1;round--;}
        if(!legendaryActionSlot(turns[index])){
            // Resolve the destination before the combat update commits. This
            // avoids a second update/extra start/end cycle for an empty slot.
            changes.turn=index;if(round!==(changes.round??combat.round))changes.round=round;return;
        }
    }
}
export function legendarySort(wrapped,a,b){
    const aSlot=managed(a),bSlot=managed(b);
    if(!aSlot&&!bSlot)return wrapped(a,b);
    // Foundry calls this comparator unbound, including on pre-operation
    // combat clones. Resolve anchors from the combatant's own parent.
    const combat=(aSlot?a:b).parent;
    const find=id=>combat?.combatants?.get?.(id)??values(combat?.combatants).find(c=>c.id===id);
    const aa=aSlot?find(aSlot.after)??a:a;
    const bb=bSlot?find(bSlot.after)??b:b;
    // Always invoke the remaining chain, including when both entries resolve
    // to one anchor. Only the slot's relative placement overrides its result.
    const result=wrapped(aa,bb);
    if(aa.id===bb.id)return aSlot&&bSlot?String(a.id).localeCompare(String(b.id)):aSlot?1:-1;
    if(result)return result;
    // Keep the native stable order for tied real combatants. An anchored
    // slot follows its player even when initiative values are identical.
    const entries=values(combat?.combatants);return entries.indexOf(aa)-entries.indexOf(bb);
}
export async function legendaryNextTurn(wrapped,...args){
    // Await placement before native Next Turn computes its destination.
    // The native method remains responsible for all start/end processing.
    try{await syncLegendarySlot(this);}catch(error){reportPlacement(error);}
    return wrapped(...args);
}
export function installLegendaryPlacement(Type=globalThis.CONFIG?.Combat?.documentClass){
    const prototype=Type?.prototype;if(!prototype||prototype.rsaLegendaryPlacement)return;
    const sort=prototype._sortCombatants,next=prototype.nextTurn;
    if(typeof sort!=="function"||typeof next!=="function")return;
    if(globalThis.libWrapper?.register&&Type===globalThis.CONFIG?.Combat?.documentClass){
        // Compose with Monk's Combat Details and other initiative wrappers.
        // Every comparison calls the next link, including slot/anchor pairs.
        libWrapper.register(ID,"CONFIG.Combat.documentClass.prototype._sortCombatants",legendarySort,"WRAPPER");
        libWrapper.register(ID,"CONFIG.Combat.documentClass.prototype.nextTurn",legendaryNextTurn,"WRAPPER");
    }else{
        // Standalone fallback for installations without libWrapper.
        prototype._sortCombatants=function(a,b){return legendarySort.call(this,sort.bind(this),a,b);};
        prototype.nextTurn=function(...args){return legendaryNextTurn.call(this,next.bind(this),...args);};
    }
    prototype.rsaLegendaryPlacement=true;
}
export function nextLegendaryPlayer(combat){
    const turns=values(combat.turns).filter(c=>!legendaryActionSlot(c));
    if(!turns.length)return null;
    const current=turns.findIndex(c=>c.id===combat.combatant?.id),start=Math.max(0,current);
    for(let offset=0;offset<turns.length;offset++){
        const entry=turns[(start+offset)%turns.length];
        if(!entry.defeated&&!entry.isDefeated&&playerTurn(entry))return entry;
    }
    return null;
}
export function syncLegendarySlot(combat){return enqueue(async()=>{
    if(!authority()||!combat?.combatants)return;
    const entries=values(combat.combatants),owned=entries.filter(managed);
    if(!combat.started){if(owned.length)await combat.deleteEmbeddedDocuments("Combatant",owned.map(c=>c.id),{...operation});return;}
    // Keep the active slot until its action chain finishes. Keep other parked
    // slots in place during combat even with no points: deleting/reinserting
    // them would renumber turns and collide with once-per-turn feature stamps.
    if(legendaryActionSlot(combat.combatant)||!enabled())return;
    const legendary=entries.some(c=>c.actor?.type==="npc"&&Number(c.actor.system?.resources?.legact?.max)>0);
    if(!legendary&&!owned.length)return;
    const realTurns=values(combat.turns).filter(c=>!legendaryActionSlot(c));
    const players=realTurns.filter(playerTurn),seen=new Set(),remove=[],updates=[],create=[];
    const manual=entries.find(c=>legendaryActionSlot(c)&&!managed(c));let adopted=false;
    for(const slot of owned){const after=managed(slot)?.after;if(seen.has(after))remove.push(slot.id);else seen.add(after);}
    for(const anchor of players){
        const slot=owned.find(c=>managed(c)?.after===anchor.id)??(!adopted&&manual?(adopted=true,manual):null);
        const following=realTurns[realTurns.findIndex(c=>c.id===anchor.id)+1];
        const initiative=following&&Number.isFinite(following.initiative)&&following.initiative<anchor.initiative?
            (anchor.initiative+following.initiative)/2:anchor.initiative-0.01;
        const data={name:"Legendary Action",type:"base",actorId:null,tokenId:null,hidden:true,defeated:false,
            img:"icons/svg/mystery-man.svg",initiative,flags:{[ID]:{legendaryActionSlot:{after:anchor.id}}}};
        if(!slot){if(legendary)create.push(data);continue;}
        const update={_id:slot.id};
        for(const key of ["name","hidden","defeated","initiative"])if(slot[key]!==data[key])update[key]=data[key];
        if(managed(slot)?.after!==anchor.id)update["flags."+ID+".legendaryActionSlot"]={after:anchor.id};
        if(Object.keys(update).length>1)updates.push(update);
    }
    // Native embedded operations preserve the active combatant and suppress
    // lifecycle events. Compatible updates are batched once per operation.
    if(remove.length)await combat.deleteEmbeddedDocuments("Combatant",remove,{...operation});
    if(updates.length)await combat.updateEmbeddedDocuments("Combatant",updates,{...operation});
    if(create.length)await combat.createEmbeddedDocuments("Combatant",create,{...operation});
});}
function visibleReminder(combat,entries){
    const slots=entries.filter(managed),current=slots.find(c=>c.id===combat.combatant?.id);
    const anchor=enabled()&&combat.started&&availableLegendary(entries)?nextLegendaryPlayer(combat):null;
    return current??(anchor?slots.find(c=>managed(c)?.after===anchor.id):null);
}
export function renderLegendarySlots(app,html){
    if(!game.user?.isGM)return;
    const combat=app.viewed??app.combat??game.combat,root=html?.[0]??html??app.element;
    if(!combat||!root?.querySelectorAll)return;
    const entries=values(combat.combatants),slots=entries.filter(managed),ids=new Set(slots.map(c=>c.id));
    const visible=visibleReminder(combat,entries);
    for(const row of root.querySelectorAll('[data-combatant-id]')){
        if(!ids.has(row.dataset.combatantId))continue;
        const show=row.dataset.combatantId===visible?.id;
        // Presentation only: never change documents or enqueue another render.
        row.hidden=!show;row.style.display=show?"":"none";
    }
    lastPaintedReminder.set(combat,visible?.id??null);
}
function reportPlacement(error){
    console.error("Legendary Action slot placement failed",error);
    ui.notifications.error("Legendary Action slot could not be placed: "+error.message);
}
function synchronize(combat){return syncLegendarySlot(combat).then(()=>{
    // Native resource recovery finishes after the initial tracker render. A
    // targeted tracker refresh shows the right next reminder without chat work.
    if(combat?.isView||game.combat?.id===combat?.id){
        const entries=values(combat.combatants);
        if(entries.some(managed)&&(visibleReminder(combat,entries)?.id??null)!==lastPaintedReminder.get(combat))globalThis.ui?.combat?.render?.();
    }
}).catch(reportPlacement); }
Hooks.once("init",()=>game.settings.register(ID,"legendaryActionAutomation",{
    name:"Legendary Action",hint:"Automatically provide a hidden Legendary Action slot after each player turn. Show only the current/upcoming reminder and skip slots when no eligible monster has points. Normal NPC turns stay in order. Ordinary legendary-monster uses in the slot bypass Reaction, Bonus Action, and spell-casting tracker markers. Explicit reactions and native resource costs remain unchanged.",scope:"world",config:true,type:Boolean,default:true
}));
Hooks.once("ready",()=>{
    globalThis.Ugmuls55eAutomationLegendaryAction={isSlot:legendaryActionSlot,isUse:legendaryActionUse};
    installLegendaryPlacement();
    for(const combat of values(game.combats))synchronize(combat);
    Hooks.on("preUpdateCombat",skipEmptyLegendarySlot);
    Hooks.on("renderCombatTracker",renderLegendarySlots);
    // Runs after native turn-end/start processing, including legendary-pool
    // recovery. Embedded reordering uses turnEvents:false and preserves the
    // active combatant through Foundry's native combatTurn operation option.
    Hooks.on("combatTurnChange",combat=>synchronize(combat));
    Hooks.on("updateCombat",(combat,changes,options)=>{if(!options?.rsaLegendarySlot&&!combat.started&&("round" in changes||"turn" in changes||"started" in changes))synchronize(combat);});
    for(const event of ["createCombatant","updateCombatant","deleteCombatant"])Hooks.on(event,(combatant,changes,options)=>{
        const opts=event==="updateCombatant"?options:changes;if(opts?.rsaLegendarySlot)return;synchronize(combatant.parent);
    });
    Hooks.on("updateSetting",setting=>{if(setting.key===ID+".legendaryActionAutomation")for(const combat of values(game.combats))synchronize(combat);});
});
