const ID="ugmuls-5-5e-automation",values=c=>Array.from(c?.values?.()??c??[]);let bridge=false;
const resolve=ref=>ref?globalThis.fromUuidSync?.(ref,{strict:false}):null;
const enabled=()=>game.settings.get(ID,"cunningStrikeAutomation")===true;
export function terrifySource(effect){
 const marked=effect.getFlag?.(ID,"terrifySource")??effect.flags?.[ID]?.terrifySource;if(marked)return marked;
 const ref=effect.system?.origin?.message,card=resolve(ref)??(ref?game.messages?.get(ref.replace(/^ChatMessage\./,"")):null),record=card?.getFlag?.(ID,"cunningStrikeSave");
 if(record?.choice==="terrify")return card.getAssociatedActor?.()?.uuid;
 const source=resolve(effect.system?.origin?.activity)?.item??resolve(effect._stats?.duplicateSource)?.parent;
 return (source?.identifier??source?.system?.identifier)==="strike-fear"&&effect.name==="Strike Fear: Terrify"?source.actor?.uuid:null;
}
export function terrifyAdvantage(actor,target){
 if(!enabled()||!actor?.uuid||!target)return false;const victim=target.actor??target;
 return values(victim.effects).some(effect=>!effect.disabled&&effect.active!==false&&!effect.duration?.expired&&!effect.system?.expired&&values(effect.statuses).includes("frightened")&&terrifySource(effect)===actor.uuid);
}
export function prepareTerrifyEffect(effect){
 if(effect.parent?.documentName!=="Actor")return;const source=terrifySource(effect);if(source)effect.updateSource({origin:source,["flags."+ID+".terrifySource"]:source});
}
export function registerTerrifyRule(api=globalThis.ac5e?.usageRules){
 if(bridge||!game.modules?.get?.("automated-conditions-5e")?.active||!api?.register)return bridge;
 bridge=!!api.register({key:"rsaStrikeFearTerrify",scope:"universal",hook:"attack",target:"subject",mode:"advantage",name:"Strike Fear — Terrify",persistent:false,evaluate:s=>{const subject=resolve(s.actorUuid);return terrifyAdvantage(subject?.actor??subject,resolve(s.opponentUuid)??resolve(s.opponentActorUuid));}});return bridge;
}
export function terrifyDefaults(config,dialog,message){
 if(bridge&&game.modules?.get?.("automated-conditions-5e")?.active||config.subject?.type!=="attack")return;
 const actor=config.subject.actor??config.subject.item?.actor,recorded=message?.data?.system?.targets,targets=recorded?.length?recorded.map(t=>resolve(t.token)).filter(Boolean):values(game.user?.targets).map(t=>t.document??t);
 if(targets.length!==1||!terrifyAdvantage(actor,targets[0]))return;
 const dis=config.disadvantage===true||(config.rolls??[]).some(r=>r.options?.disadvantage===true||r.options?.advantageMode===-1);
 config.advantage=true;for(const roll of config.rolls??[]){roll.options??={};Object.assign(roll.options,{advantage:true,advantageMode:dis?0:1});}
 dialog.options??={};dialog.options.defaultButton=dis?"normal":"advantage";
}
Hooks.on("ac5e.usageRulesReady",({usageRules}={})=>registerTerrifyRule(usageRules));
Hooks.once("ready",()=>{registerTerrifyRule();Hooks.on("preCreateActiveEffect",prepareTerrifyEffect);Hooks.on("dnd5e.preRollAttackV2",terrifyDefaults);});
