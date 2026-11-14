// Read native Sorcerer feature state for Metamagic and Wild Magic.
// Roll advantage and spell DC bonuses belong to the native feature.
export function innateSorceryActive(actor) {
    const feature=Array.from(actor?.items??[]).find(item=>item.type==="feat"&&
        ((item.identifier??item.system?.identifier)==="innate-sorcery"||/^innate sorcery$/i.test(item.name??"")));
    const sources=new Set(Array.from(feature?.effects??[]).map(effect=>effect.uuid).filter(Boolean));
    return Array.from(actor?.effects??[]).some(effect=>!effect.disabled&&effect.active!==false&&!effect.duration?.expired&&effect.system?.expired!==true&&
        (/^innate sorcery(?:\s*\([^)]*\))?$/i.test(effect.name?.trim()??"")||sources.has(effect._stats?.duplicateSource)||sources.has(effect._stats?.compendiumSource)||
            (!!feature?.uuid&&effect.system?.origin?.item===feature.uuid)));
}
export function isSorcererSpell(item) {
    return item?.type==="spell"&&(item.system?.classIdentifier==="sorcerer"||(!item.system?.classIdentifier&&item.system?.sourceItem==="class:sorcerer"));
}
