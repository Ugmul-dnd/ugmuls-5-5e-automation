const AC = "automated-conditions-5e", COVER = "simplecover5e";
const corrected = new WeakSet(), remembered = new WeakMap(), bound = new WeakSet();
let integration, helpers;
function enabled() {
 return game.modules.get(AC)?.active && game.modules.get(COVER)?.active
  && !game.modules.get("midi-qol")?.active;
}
function state(config) { return config?.options?.[AC] ?? config?.[AC] ?? config?.rolls?.[0]?.options?.[AC]; }
function covers(message) { return message?.data?.flags?.[COVER]?.targets ?? message?.flags?.[COVER]?.targets; }
function key(target, index) { return target.tokenUuid ? "token:" + target.tokenUuid : "actor:" + target.uuid + ":index:" + index; }
function bonus(cover) {
 if (cover === "none") return 0;
 if (cover === "half") return Number(CONFIG.DND5E.statusEffects.coverHalf?.coverBonus ?? 2);
 if (cover === "threeQuarters") return Number(CONFIG.DND5E.statusEffects.coverThreeQuarters?.coverBonus ?? 5);
 return null;
}
// Correct only AC5e's Simple Cover baseline. Its own finalizer retains additive
// and static AC rules, total cover and per-token target bookkeeping.
export function correctCover(config, rollConfig, message, root) {
 if (!enabled() || config?.hookType !== "attack" || !integration) return false;
 const targets = config.options?.targets;
 if (!Array.isArray(targets)) return false;
 const rawDescriptors = covers(message) ?? remembered.get(config);
 const descriptors = rawDescriptors?.map((entry, index) => ({ ...entry, newCover: root?.querySelector?.('select[name="simplecover5e.targets.' + index + '.newCover"]')?.value || entry.newCover }));
 if (descriptors) remembered.set(config, descriptors);
 const map = config.preAC5eConfig?.simpleCoverTargetAcByKey;
 let changed = false;
 for (const [index, target] of targets.entries()) {
  const descriptor = descriptors?.find(entry => entry.tokenUuid ? entry.tokenUuid === target.tokenUuid : entry.uuid === target.uuid);
  const entry = map?.[key(target, index)];
  if (!descriptor && !entry) continue;
  const actor = fromUuidSync(target.tokenUuid)?.actor ?? fromUuidSync(target.uuid);
  const ac = actor?.system?.attributes?.ac;
  if (!ac || !Number.isFinite(ac.value)) continue;
  // Native explicit AC overrides do not include the prepared cover field.
  const included = Number.isFinite(ac.override) ? 0 : Number(ac.cover ?? 0);
  if (!Number.isFinite(included) || included <= 0) continue;
  let value;
  if (descriptor) {
   const descriptorIndex = descriptors.indexOf(descriptor);
   const select = root?.querySelector?.('select[name="simplecover5e.targets.' + descriptorIndex + '.newCover"]');
   const cover = select?.value || descriptor.newCover || descriptor.originalCover || "none";
   if (!["none", "half", "threeQuarters", "total"].includes(cover)) continue;
   value = cover === "total" ? 999 : ac.value - included + bonus(cover);
  } else {
   // Builds may clone the state and omit the message. AC5e rebuilds this map
   // from sheet AC each time; mark entries to make repeated hooks idempotent.
   if (corrected.has(entry) || entry.total || entry.ac === 999) continue;
   const resolved = entry.ac - ac.value;
   if (![0, 2, 5].includes(resolved)) continue;
   value = entry.ac - included;
  }
  config.preAC5eConfig ??= {};
  const next = { ac: value, total: value === 999 };
  (config.preAC5eConfig.simpleCoverTargetAcByKey ??= {})[key(target, index)] = next;
  corrected.add(next);
  changed = true;
 }
 if (!changed) return false;
 if (game.modules.get(COVER)?.api?.getLibraryMode?.()) {
  // The upstream finalizer aggregates only mapped targets. Keep unaffected
  // recipients in the map as well, so mixed-target attacks use the right AC.
  for (const [index, target] of targets.entries()) {
   const targetKey = key(target, index);
   if (config.preAC5eConfig.simpleCoverTargetAcByKey[targetKey]) continue;
   const descriptor = descriptors?.find(entry => entry.tokenUuid ? entry.tokenUuid === target.tokenUuid : entry.uuid === target.uuid);
   const actor = fromUuidSync(target.tokenUuid)?.actor ?? fromUuidSync(target.uuid);
   if (!descriptor || !Number.isFinite(actor?.system?.attributes?.ac?.value)) continue;
   const cover = descriptor.newCover ?? descriptor.originalCover ?? "none";
   if (!["none", "half", "threeQuarters", "total"].includes(cover)) continue;
   config.preAC5eConfig.simpleCoverTargetAcByKey[targetKey] = { ac: cover === "total" ? 999 : actor.system.attributes.ac.value + bonus(cover), total: cover === "total" };
  }
  integration.finalizeSimpleCover5eTargets(config, rollConfig ?? {}, message);
 }
 else finalizeStandalone(config, rollConfig ?? {}, message);
 // AC5e's tooltip is rebuilt after several stages. Keep its cover row honest
 // without modifying any actor data or the save bonus on the native effect.
 if (descriptors) {
  integration.applySimpleCover5eTooltip(config, { data: { flags: { [COVER]: { targets: descriptors } } } });
  let row = 0;
  for (const descriptor of descriptors) {
   const cover = descriptor.newCover ?? descriptor.originalCover ?? "none";
   if (cover === "none") continue;
   const entry = config.simpleCoverEntries?.[row++];
   const ac = fromUuidSync(descriptor.uuid)?.system?.attributes?.ac;
   if (!entry || !ac || Number.isFinite(ac.override)) continue;
   entry.base -= Number(ac.cover ?? 0);
   if (entry.ac !== 999) entry.ac -= Number(ac.cover ?? 0);
  }
 }
 if (config.tooltipObj?.attack) delete config.tooltipObj.attack;
 const tooltip = helpers?._getTooltip?.(config);
 if (tooltip !== undefined) {
  for (const button of root?.querySelectorAll?.(".ac5e-button") ?? []) button.setAttribute("data-tooltip", tooltip);
  for (const roll of rollConfig?.rolls ?? []) if (roll.options?.[AC]) roll.options[AC].chatTooltip = tooltip;
  if (rollConfig?.options?.[AC]) rollConfig.options[AC].chatTooltip = tooltip;
 }
 return true;
}
// Simple Cover's standalone workflow has already resolved geometry and ignored
// cover. AC5e still builds its tooltip from sheet AC plus that bonus. Use the
// same corrected baseline for the displayed and committed target, without
// switching the world mode or editing either module's API/settings.
function finalizeStandalone(config, rollConfig, message) {
 const targets = config.options.targets;
 const map = config.preAC5eConfig.simpleCoverTargetAcByKey;
 for (const [index, target] of targets.entries()) {
  const entry = map[key(target, index)];
  if (!entry || entry.total) continue; // Standalone owns total-cover blocking.
  const ac = helpers.getAlteredTargetValueOrThreshold(entry.ac, config.targetADC ?? [], "acBonus");
  target.ac = ac;
  (config.initialTargetADCs ??= {})[key(target, index)] = { ac: entry.ac };
  (config.alteredTargetADCs ??= {})[key(target, index)] = { ac };
 }
 const finite = targets.map(target => target.ac).filter(ac => typeof ac === "number" && Number.isFinite(ac) && ac !== 999);
 if (!finite.length) return;
 config.alteredTargetADC = Math.min(...finite);
 const initial = Object.values(config.initialTargetADCs ?? {}).map(entry => entry.ac).filter(ac => Number.isFinite(ac) && ac !== 999);
 if (initial.length) config.initialTargetADC = Math.min(...initial);
 config.finalizedTargets = foundry.utils.duplicate(targets);
 rollConfig.target = config.alteredTargetADC;
 (rollConfig.options ??= {}).target = config.alteredTargetADC;
 for (const roll of rollConfig.rolls ?? []) {
  roll.target = config.alteredTargetADC;
  (roll.options ??= {}).target = config.alteredTargetADC;
 }
 if (message?.data) {
  foundry.utils.setProperty(message, "data.flags." + AC + ".finalizedTargets", foundry.utils.duplicate(targets));
  const recorded = message.data.system?.targets;
  for (const target of recorded ?? []) {
   const updated = targets.find(entry => target.tokenUuid ? entry.tokenUuid === target.tokenUuid : entry.uuid === (target.uuid ?? target.actor));
   if (updated) target.ac = updated.ac;
  }
 }
}
Hooks.once("ready", async () => {
 if (!enabled()) return;
 try {
  [integration, helpers] = await Promise.all([
   import("/modules/automated-conditions-5e/scripts/integrations/ac5e-simplecover5e.mjs"),
   import("/modules/automated-conditions-5e/scripts/ac5e-helpers.mjs")
  ]);
 } catch (error) { console.warn("Ugmuls 5.5e | Cover compatibility unavailable", error); return; }
 Hooks.on("ac5e.prepareAttributions", (config, roll, dialog, message) => correctCover(config, roll, message));
 Hooks.on("dnd5e.postBuildAttackRollConfig", (process, roll, index, options = {}) => {
  const config = state(process) ?? state(roll);
  if (!correctCover(config, process, options.app?.message)) return;
  if (config?.finalizedTargets && roll?.options?.[AC]) roll.options[AC].finalizedTargets = foundry.utils.duplicate(config.finalizedTargets);
  if (config && Number.isFinite(config.alteredTargetADC)) {
   roll.target = config.alteredTargetADC;
   if (roll.options) roll.options.target = config.alteredTargetADC;
  }
 });
 Hooks.on("renderD20RollConfigurationDialog", app => {
  const refresh = () => correctCover(state(app.config), app.config, app.message, app.element);
  queueMicrotask(refresh);
  if (!app.element || bound.has(app.element)) return;
  bound.add(app.element);
  app.element.addEventListener("change", () => queueMicrotask(refresh));
 });
});
