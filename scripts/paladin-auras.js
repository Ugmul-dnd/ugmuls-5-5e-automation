const ID = "ugmuls-5-5e-automation";
const managedSources = new Set(), warned = new Set(), scenes = new Map(), pendingScenes = new Set();
const alacrityGrants = new Map(), previousTurns = new WeakMap();
let timer = null, processing = false;
const sceneTasks = new Map(), speedMembership = new Map();
const auraScene = () => game.scenes?.active ?? globalThis.canvas?.scene;
const flag = (doc, key) => doc?.getFlag?.(ID, key) ?? doc?.flags?.[ID]?.[key];
const identifier = item => item?.identifier ?? item?.system?.identifier;
const enabled = () => game.settings.get(ID, "paladinAuraAutomation") === true;
const authority = () => game.user?.isGM && (!game.users.activeGM || game.users.activeGM.id === game.user.id);
const featureKeys = new Set(["aura-of-protection", "aura-expansion", "aura-of-courage", "aura-of-devotion", "aura-of-warding", "aura-of-alacrity", "aura-of-elemental-shielding"]);
export const elementalTypes = ["acid", "cold", "fire", "lightning", "thunder"];
const values = collection => Array.from(collection?.values?.() ?? collection ?? []);
export function auraFeature(actor, key) {
    return values(actor?.items).find(item => item.type === "feat" && item.system?.source?.rules !== "2014" &&
        (identifier(item) === key || item.name?.trim().toLowerCase() === key.replaceAll("-", " ")));
}
export function paladinLevel(actor) {
    return Number(values(actor?.items).find(item => item.type === "class" && identifier(item) === "paladin")?.system?.levels ?? 0);
}
export function auraIncapacitated(actor) {
    return ["incapacitated", "unconscious", "stunned", "paralyzed", "petrified", "dead"].some(status => actor?.statuses?.has(status));
}
function rawActive(effect) { return !effect.disabled && !effect.duration?.expired && !effect.system?.expired; }
export function auraElement(actor) {
    const item = auraFeature(actor, "aura-of-elemental-shielding");
    if (!item) return null;
    const copies = values(actor.effects).filter(effect => rawActive(effect) &&
        (flag(effect, "genieShielding")?.item === item?.uuid || item?.uuid &&
            [effect.system?.origin?.item, effect._stats?.duplicateSource, effect._stats?.compendiumSource].some(ref => typeof ref === "string" && (ref === item.uuid || ref.startsWith(item.uuid + ".")))));
    for (const effect of [...copies, ...values(item?.effects).filter(rawActive)]) {
        const change = (effect.system?.changes ?? []).find(c => c.key === "system.traits.dr.value" && elementalTypes.includes(c.value));
        if (change) return change.value;
    }
    // Preserve old menu choices until the feature card has taken control.
    const choice = flag(actor, "paladinAuraElement");
    return flag(actor, "paladinAuraElementManaged") !== true && elementalTypes.includes(choice) ? choice : null;
}
export function auraProfile(token) {
    const actor = token?.actor, level = paladinLevel(actor), feature = auraFeature(actor, "aura-of-protection");
    if (!actor || !feature || level < 6 || flag(actor, "paladinAuraDisabled") === true) return null;
    const nativeRadius = Number(actor.system?.scale?.paladin?.aura?.value ?? actor.system?.scale?.paladin?.aura);
    const resistances = [];
    if (level >= 7 && auraFeature(actor, "aura-of-warding")) resistances.push("necrotic", "psychic", "radiant");
    if (level >= 7 && auraFeature(actor, "aura-of-elemental-shielding")) { const element = auraElement(actor); if (element) resistances.push(element); }
    return {token, actor, feature, radius: nativeRadius > 0 ? nativeRadius : level >= 18 ? 30 : 10,
        bonus: Math.max(1, Number(actor.system?.abilities?.cha?.mod) || 0), active: !auraIncapacitated(actor),
        courage: level >= 10 && !!auraFeature(actor, "aura-of-courage"),
        devotion: level >= 7 && !!auraFeature(actor, "aura-of-devotion"),
        alacrity: level >= 7 && !!auraFeature(actor, "aura-of-alacrity"), resistances};
}
export function auraAllied(source, target) {
    return !!target?.actor && (source.actor.uuid === target.actor.uuid ||
        Number(source.disposition) !== 0 && Number(source.disposition) === Number(target.disposition));
}
function legacyEmitter(actor) {
    const effects = [...values(actor?.effects), ...values(actor?.items).flatMap(i => values(i.effects))];
    return effects.some(effect => effect.type === "auraeffects.aura" && rawActive(effect) &&
        (featureKeys.has(identifier(effect.parent)) ||
            /aura of (protection|courage|devotion|warding|alacrity|elemental shielding)|^(protected|courageous|devoted|(?:acid|cold|fire|lightning|thunder) shielding)$/i.test(effect.name ?? "") ||
            /phbpdn(?:Protection|CourageAur|DevotionAu|WardingAur|AlacrityAu)|hofOngAuraofElem/.test([effect.origin, effect.system?.origin?.item, effect._stats?.duplicateSource].filter(Boolean).join(" "))));
}
function sourceLink(region) { return flag(region, "paladinAura"); }
function ownedEffect(effect) { return flag(effect, "paladinAuraBuff"); }
function refreshManagedSources() {
    const before = new Set(managedSources); managedSources.clear();
    for (const scene of values(game.scenes).filter(scene => scene === auraScene())) for (const region of values(scene.regions)) {
        const link = sourceLink(region); if (link?.actor) managedSources.add(link.actor);
    }
    // Reset local derived data only when native self-effect management changes.
    for (const uuid of new Set([...before, ...managedSources])) if (before.has(uuid) !== managedSources.has(uuid)) {
        globalThis.fromUuidSync?.(uuid, {strict:false})?.reset?.();
    }
}
export function suppressNativeAuraEffect(effect) {
    if (!enabled()) return false;
    if (flag(effect, "genieShielding")) return managedSources.has(effect.actor?.uuid ?? effect.parent?.uuid);
    const item = effect.parent?.documentName === "Item" ? effect.parent : effect.item;
    if (!item || !["aura-of-protection", "aura-of-elemental-shielding"].includes(identifier(item)) || item.system?.source?.rules === "2014") return false;
    return effect.transfer === true && managedSources.has(item.actor?.uuid ?? item.parent?.uuid);
}
export function installAuraSuppression(Type = globalThis.CONFIG?.ActiveEffect?.documentClass) {
    const proto = Type?.prototype; if (!proto || proto._rsaPaladinAuraSuppression) return;
    let base = proto, descriptor;
    while (base && !(descriptor = Object.getOwnPropertyDescriptor(base, "isSuppressed"))) base = Object.getPrototypeOf(base);
    if (!descriptor?.get) return;
    Object.defineProperty(proto, "isSuppressed", {configurable:true, get() { return suppressNativeAuraEffect(this) || descriptor.get.call(this); }});
    Object.defineProperty(proto, "_rsaPaladinAuraSuppression", {value:true});
}
function sameLevels(a, b) { return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort()); }
function regionNeedsUpdate(region, data) {
    const old = region.shapes?.[0], next = data.shapes[0];
    return region.name !== data.name || region.visibility !== data.visibility || (region.attachment?.token?.id ?? region.attachment?.token) !== data.attachment.token ||
        Number(old?.radius) !== Number(next.radius) || old?.type !== "emanation" ||
        ["width", "height", "shape"].some(key => old?.base?.[key] !== next.base[key]) || !sameLevels(region.levels ?? [], data.levels ?? []);
}
export async function ensurePaladinRegion(scene, profile) {
    const {token, actor, radius} = profile, scale = Number(scene.grid.size) / Number(scene.grid.distance);
    if (!(scale > 0)) return null;
    const regions = values(scene.regions).filter(r => sourceLink(r)?.token === token.uuid), region = regions[0];
    const levels = values(token.levels);
    if (!levels.length && token.level) levels.push(token.level.id ?? token.level);
    if (!levels.length && globalThis.canvas?.scene === scene && canvas.level?.id) levels.push(canvas.level.id);
    const meters = /^(m|meters?|metres?)$/i.test(String(scene.grid.units ?? "ft")), sceneRadius = meters ? radius * .3048 : radius;
    const data = {name:"Paladin Aura — " + token.name, color:game.user.color,
        shapes:[{type:"emanation", radius:sceneRadius * scale, base:{type:"token", x:token.x, y:token.y, width:token.width, height:token.height, shape:token.shape, rotation:0}}],
        attachment:{token:token.id}, levels, restriction:{enabled:true, type:"move"},
        visibility:flag(actor, "paladinAuraVisible") === true ? CONST.REGION_VISIBILITY.ALWAYS : CONST.REGION_VISIBILITY.GAMEMASTER,
        highlightMode:"coverage", flags:{[ID]:{paladinAura:{token:token.uuid, actor:actor.uuid, item:profile.feature.uuid}}}};
    if (regions.length > 1) await scene.deleteEmbeddedDocuments("Region", regions.slice(1).map(r => r.id));
    if (region) { if (regionNeedsUpdate(region, data)) await region.update(data); return region; }
    return (await scene.createEmbeddedDocuments("Region", [data]))[0];
}
function inside(target, profile) {
    if (!auraAllied(profile.token, target)) return false;
    if (target.uuid === profile.token.uuid) return true;
    const a = values(profile.token.levels), b = values(target.levels);
    if (a.length && b.length && !a.some(level => b.includes(level))) return false;
    return target.testInsideRegion?.(profile.region) === true;
}
export function aggregateAuraBenefits(actor, profiles) {
    const available = profiles.filter(p => p.active), preference = flag(actor, "paladinAuraPreferred");
    const sorted = [...available].sort((a,b) => b.bonus - a.bonus || a.token.uuid.localeCompare(b.token.uuid));
    const protection = sorted.find(p => p.actor.uuid === preference) ?? sorted[0];
    const resistances = [...new Set(available.flatMap(p => p.resistances))].sort();
    const immunity = [available.some(p => p.courage) ? "frightened" : null, available.some(p => p.devotion) ? "charmed" : null].filter(Boolean);
    const changes = [];
    if (protection) changes.push({key:"system.bonuses.abilities.save", value:String(protection.bonus), type:"add"});
    for (const value of resistances) changes.push({key:"system.traits.dr.value", value, type:"add"});
    for (const value of immunity) changes.push({key:"system.traits.ci.value", value, type:"add"});
    return {changes, protection:protection?.actor.uuid ?? null, bonus:protection?.bonus ?? 0, resistances, immunity,
        sources:[...new Set(available.map(p => p.token.uuid))].sort()};
}
function changeSignature(changes) { return JSON.stringify(values(changes).map(c => ({key:c.key, type:c.type, value:String(c.value)}))); }
async function syncBuff(actor, scene, profiles) {
    const benefit = aggregateAuraBenefits(actor, profiles), effects = values(actor.effects).filter(ownedEffect), existing = effects[0];
    if (!benefit.changes.length) { if (effects.length) await actor.deleteEmbeddedDocuments("ActiveEffect", effects.map(e => e.id)); return; }
    const record = {...benefit, scene:scene.uuid}, data = {name:"Paladin Aura", img:"icons/magic/defensive/barrier-shield-dome-blue-purple.webp", type:"base", disabled:false, transfer:false, origin:benefit.protection,
        system:{changes:benefit.changes, origin:{actor:benefit.protection}}, statuses:[], duration:{value:null, units:"seconds", expiry:null, expired:false},
        flags:{[ID]:{paladinAuraBuff:record}, autoanimations:{version:5, isEnabled:false, isCustomized:false, killAnim:true}}};
    if (effects.length > 1) await actor.deleteEmbeddedDocuments("ActiveEffect", effects.slice(1).map(e => e.id));
    if (!existing) await actor.createEmbeddedDocuments("ActiveEffect", [data]);
    else if (existing.disabled || changeSignature(existing.system?.changes) !== changeSignature(data.system.changes) || ownedEffect(existing)?.scene !== scene.uuid || existing.origin !== benefit.protection || existing.system?.origin?.actor !== benefit.protection) await existing.update(data);
}
const combatStamp = (combat = game.combat) => combat?.started ? `${combat.id}:${combat.round}:${combat.turn}` : null;
function ownAlacrity(actor) { return paladinLevel(actor) >= 7 && values(auraFeature(actor, "aura-of-alacrity")?.effects).some(e => rawActive(e) && (e.system?.changes ?? []).some(c => c.key === "system.attributes.movement.speed")); }
export async function grantAlacrity(actor, sources, {start=false} = {}) {
    if (!sources.length || ownAlacrity(actor)) return;
    const combat = game.combat, stamp = combatStamp(), now = Number(game.time?.worldTime ?? 0);
    const existing = values(actor.effects).find(e => flag(e, "paladinAlacrity"));
    const priorRecord = flag(existing, "paladinAlacrity");
    const grants = alacrityGrants.get(actor.uuid) ?? new Map((priorRecord?.sources ?? []).map(source => [source, priorRecord.grant])); alacrityGrants.set(actor.uuid, grants);
    let fresh = false;
    for (const source of sources) {
        const key = source.token.uuid, previous = grants.get(key);
        if (!stamp || previous !== stamp) { grants.set(key, stamp ?? "outside"); fresh = true; }
    }
    if (!fresh && !start) return;
    if (!stamp && existing && !existing.disabled && Number(flag(existing, "paladinAlacrity").until) > now + 5) return;
    const record = {sources:sources.map(s => s.token.uuid).sort(), combat:stamp ? combat.id : null,
        ends:stamp && combat.combatant?.actor?.uuid === actor.uuid ? 2 : 1, until:now + 12, grant:stamp};
    const sourceActor = sources[0].actor.uuid;
    const data = {name:"Aura of Alacrity", origin:sourceActor, img:"icons/skills/movement/feet-winged-sandals-tan.webp", type:"base", disabled:false, transfer:false,
        system:{changes:[{key:"system.attributes.movement.speed", value:10, type:"add"}], origin:{actor:sourceActor}}, statuses:[],
        duration:{value:null, units:"seconds", expiry:null, expired:false}, flags:{[ID]:{paladinAlacrity:record}, autoanimations:{version:5,isEnabled:false,killAnim:true}}};
    if (existing) await existing.update(data); else await actor.createEmbeddedDocuments("ActiveEffect", [data]);
}
export async function syncPaladinScene(scene, options = {}) {
    if (!authority() || !scene) return;
    const task = (sceneTasks.get(scene.uuid) ?? Promise.resolve()).catch(() => {}).then(() => synchronizePaladinScene(scene, options));
    sceneTasks.set(scene.uuid, task);
    try { return await task; } finally { if (sceneTasks.get(scene.uuid) === task) sceneTasks.delete(scene.uuid); }
}
async function synchronizePaladinScene(scene, {turnStartActor=null} = {}) {
    if (!authority() || scene !== auraScene()) return;
    scenes.set(scene.uuid, scene);
    const tokens = values(scene.tokens), profiles = [];
    if (enabled()) for (const token of tokens) {
        const profile = auraProfile(token); if (!profile) continue;
        if (legacyEmitter(profile.actor)) {
            if (!warned.has(profile.actor.uuid)) { warned.add(profile.actor.uuid); ui.notifications.warn("Disable the old Aura Effects Paladin aura on " + profile.actor.name + " to use the unified Paladin aura without duplicate bonuses."); }
            continue;
        }
        const region = await ensurePaladinRegion(scene, profile); if (region) profiles.push({...profile, region});
    }
    const wanted = new Set(profiles.map(p => p.token.uuid));
    const obsolete = values(scene.regions).filter(r => sourceLink(r) && !wanted.has(sourceLink(r).token));
    if (obsolete.length) await scene.deleteEmbeddedDocuments("Region", obsolete.map(r => r.id));
    refreshManagedSources();
    const actors = new Map(tokens.filter(t => t.actor).map(t => [t.actor.uuid, t.actor]));
    for (const actor of values(game.actors)) if (values(actor.effects).some(e => ownedEffect(e))) actors.set(actor.uuid, actor);
    const priorSpeed = speedMembership.get(scene.uuid) ?? new Set(), nextSpeed = new Set();
    for (const actor of actors.values()) {
        // Repair old timed buffs once without changing their remaining duration.
        for (const effect of values(actor.effects)) {
            const source = flag(effect, "paladinAlacrity")?.sources?.map(uuid => tokens.find(t => t.uuid === uuid)?.actor).find(Boolean);
            if (source && (effect.origin !== source.uuid || effect.system?.origin?.actor !== source.uuid)) await effect.update({origin:source.uuid, system:{...effect.system, origin:{...effect.system?.origin, actor:source.uuid}}});
        }
        const actorTokens = tokens.filter(t => t.actor?.uuid === actor.uuid), inRange = profiles.filter(p => p.active && actorTokens.some(t => inside(t,p)));
        await syncBuff(actor, scene, inRange);
        const speedSources = inRange.filter(p => p.alacrity && p.actor.uuid !== actor.uuid);
        for (const profile of speedSources) nextSpeed.add(actor.uuid + ":" + profile.token.uuid);
        const entered = speedSources.filter(profile => !priorSpeed.has(actor.uuid + ":" + profile.token.uuid));
        if (enabled()) await grantAlacrity(actor, turnStartActor === actor.uuid ? speedSources : entered, {start:turnStartActor === actor.uuid});
        else { const ids = values(actor.effects).filter(e => flag(e, "paladinAlacrity")).map(e => e.id); if (ids.length) await actor.deleteEmbeddedDocuments("ActiveEffect", ids); }
    }
    speedMembership.set(scene.uuid, nextSpeed);
}
export function queuePaladinScene(scene = auraScene()) {
    if (!authority() || !scene || scene !== auraScene()) return;
    scenes.set(scene.uuid, scene); pendingScenes.add(scene.uuid);
    if (!processing && timer === null) timer = setTimeout(() => {timer = null; flushPaladinAuras().catch(report);}, 60);
}
export async function flushPaladinAuras() {
    if (processing) return;
    processing = true;
    try { while (pendingScenes.size) { const ids = [...pendingScenes]; pendingScenes.clear(); for (const id of ids) await syncPaladinScene(scenes.get(id)); } }
    finally { processing = false; }
}
function actorScene(actor) {
    if (!actor) return;
    const scene = auraScene();
    if (values(scene?.tokens).some(t => t.actor?.uuid === actor.uuid) || values(actor.effects).some(ownedEffect)) queuePaladinScene(scene);
}
function externalEffect(effect) {
    if (ownedEffect(effect) || flag(effect, "paladinAlacrity")) return;
    const actor = effect.actor ?? (effect.parent?.documentName === "Actor" ? effect.parent : effect.parent?.actor);
    if (auraFeature(actor, "aura-of-protection")) actorScene(actor);
}
export async function processAlacrityTurn(combat, changes) {
    if (!authority() || !("turn" in changes || "round" in changes || changes.started === false)) return;
    const old = previousTurns.get(combat), current = combat.started ? combat.combatant?.actor?.uuid : null;
    const actors = new Map([...values(game.actors), ...values(combat.combatants).map(c => c.actor)].filter(Boolean).map(a => [a.uuid,a]));
    for (const actor of actors.values()) {
        for (const effect of values(actor.effects)) {
            const record = flag(effect, "paladinAlacrity"); if (!record || record.combat !== combat.id) continue;
            if (!combat.started || changes.started === false) { await effect.delete(); continue; }
            if (old?.actor === actor.uuid && old.stamp !== combatStamp(combat)) {
                if (record.ends <= 1) await effect.delete();
                else await effect.setFlag(ID, "paladinAlacrity", {...record, ends:record.ends-1});
            }
        }
    }
    previousTurns.set(combat, {actor:current, stamp:combatStamp(combat)});
    if (combat.scene) await syncPaladinScene(combat.scene, {turnStartActor:current});
}
export async function expireAlacrity() {
    if (!authority()) return;
    const now = Number(game.time?.worldTime ?? 0), actors = new Map([...values(game.actors), ...values(globalThis.canvas?.scene?.tokens).map(t => t.actor)].filter(Boolean).map(a=>[a.uuid,a]));
    for (const actor of actors.values()) for (const effect of values(actor.effects)) {
        const record = flag(effect, "paladinAlacrity"); if (record && !record.combat && record.until <= now) await effect.delete();
    }
}
async function auraDialog(actor) {
    if (!actor?.isOwner) return;
    const escape = foundry.utils.escapeHTML, source = !!auraFeature(actor, "aura-of-protection"), genie = !!auraFeature(actor,"aura-of-elemental-shielding");
    const sourceActors = [...new Map(values(globalThis.canvas?.scene?.tokens).filter(t=>auraProfile(t)).map(t=>[t.actor.uuid,t.actor])).values()];
    const choice = await foundry.applications.api.DialogV2.wait({window:{title:"Paladin aura — " + actor.name},position:{width:460},rejectClose:false,
        content:(source ? '<div class="form-group"><label>Enable this Paladin’s aura</label><input type="checkbox" name="enabled" '+(flag(actor,"paladinAuraDisabled")!==true?'checked':'')+'></div><div class="form-group"><label>Show aura region to players</label><input type="checkbox" name="visible" '+(flag(actor,"paladinAuraVisible")===true?'checked':'')+'></div>' : '') +
        (genie ? '<p>Elemental Shielding: '+escape(auraElement(actor) ?? 'not selected')+'. Change it by clicking a resistance on the Aura of Elemental Shielding feature card.</p>' : '') +
        '<div class="form-group"><label>Preferred Aura of Protection</label><select name="preferred"><option value="">Highest available bonus</option>'+sourceActors.map(a=>'<option value="'+escape(a.uuid)+'" '+(flag(actor,"paladinAuraPreferred")===a.uuid?'selected':'')+'>'+escape(a.name)+'</option>').join('')+'</select></div><p>Protection bonuses do not stack. Other aura benefits are combined. Visual animations are not created.</p>',
        buttons:[{action:"save",label:"Save",callback:(_event,button)=>Object.fromEntries(new FormData(button.form))},{action:"cancel",label:"Cancel",callback:()=>null}]});
    if (!choice) return;
    const updates = {["flags."+ID+".paladinAuraPreferred"]:choice.preferred ?? ""};
    if (source) {updates["flags."+ID+".paladinAuraDisabled"] = choice.enabled !== "on"; updates["flags."+ID+".paladinAuraVisible"] = choice.visible === "on";}
    if (genie && elementalTypes.includes(choice.element)) updates["flags."+ID+".paladinAuraElement"] = choice.element;
    await actor.update(updates);
}
function menuActor(app) { const actor=app.actor??app.document??app.object; return actor?.documentName==="Actor"&&actor.isOwner?actor:null; }
export function addAuraMenu(app,controls) { const actor=menuActor(app);if(!actor||controls.some(c=>c.action==="rsaPaladinAura"))return;controls.push({action:"rsaPaladinAura",label:"Paladin aura",icon:"fa-solid fa-shield-halved",ownership:"OWNER",onClick:()=>auraDialog(actor).catch(report)}); }
function report(error) {console.error("Unified Paladin aura",error);ui.notifications.error("Could not update the Paladin aura. Check the console.");}
Hooks.once("init",()=>{
    game.settings.register(ID,"paladinAuraAutomation",{name:"Unified Paladin Auras",hint:"Create one attached, invisible-by-default aura per Paladin. Combine Protection, Courage and supported oath benefits, expand with Paladin level, and pause while Incapacitated. Choose Genie resistance on its feature card; set overlapping Protection preference from the actor-window Paladin aura menu. Disable old Aura Effects Paladin emitters first.",scope:"world",config:true,type:Boolean,default:true});
    installAuraSuppression();
});
Hooks.once("ready",()=>{
    refreshManagedSources();
    for (const combat of values(game.combats)) previousTurns.set(combat, {actor:combat.combatant?.actor?.uuid, stamp:combatStamp(combat)});
    globalThis.Ugmuls55eAutomationPaladinAuras={queue:queuePaladinScene,sync:syncPaladinScene,flush:flushPaladinAuras};
    Hooks.on("canvasReady",()=>queuePaladinScene());
    Hooks.on("updateScene",(scene,changes)=>{if("active" in changes){refreshManagedSources();queuePaladinScene();}});
    for (const event of ["createToken","deleteToken"]) Hooks.on(event,token=>queuePaladinScene(token.parent));
    Hooks.on("updateToken",(token,changes)=>{if(["x","y","elevation","width","height","shape","disposition","level","levels","actorId","actorData"].some(k=>k in changes))queuePaladinScene(token.parent);});
    for (const event of ["createItem","updateItem","deleteItem"]) Hooks.on(event,item=>{if(item.type==="class"||featureKeys.has(identifier(item)))actorScene(item.actor??item.parent);});
    Hooks.on("updateActor",actor=>actorScene(actor));
    for (const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect"]) Hooks.on(event,externalEffect);
    for (const event of ["createRegion","deleteRegion"]) Hooks.on(event,region=>{if(sourceLink(region)){refreshManagedSources();queuePaladinScene(region.parent);}});
    Hooks.on("updateRegion",region=>{if(sourceLink(region))queuePaladinScene(region.parent);});
    Hooks.on("preUpdateCombat",combat=>previousTurns.set(combat,{actor:combat.combatant?.actor?.uuid,stamp:combatStamp(combat)}));
    Hooks.on("updateCombat",(combat,changes)=>processAlacrityTurn(combat,changes).catch(report));
    Hooks.on("deleteCombat",combat=>processAlacrityTurn(combat,{started:false}).catch(report));
    Hooks.on("updateWorldTime",()=>expireAlacrity().catch(report));
    Hooks.on("updateSetting",setting=>{if(setting.key===ID+".paladinAuraAutomation")for(const scene of values(game.scenes))queuePaladinScene(scene);});
    Hooks.on("getHeaderControlsApplicationV2",addAuraMenu);
    Hooks.on("getActorSheetHeaderButtons",(app,buttons)=>{const actor=menuActor(app);if(actor&&!buttons.some(b=>b.class==="rsa-paladin-aura"))buttons.push({label:"Paladin aura",class:"rsa-paladin-aura",icon:"fa-solid fa-shield-halved",onclick:()=>auraDialog(actor).catch(report)});});
    queuePaladinScene();
});
