// Presentation only: keep the existing buttons, listeners, source identities,
// disabled states and eligibility. No resource or reaction mutation here.
const rules=[
 ['.rsa-mirror-image','mirror-image','Roll for your remaining duplicates to see whether one intercepts this attack.'],
 ['.rsa-unbreakable-majesty','unbreakable-majesty','Resolve the attacker’s Charisma save to determine whether this attack can proceed.'],
 ['.rsa-countercharm','countercharm','Use your Reaction to let the creature reroll its failed charm or fear save with Advantage.'],
 ['.rsa-guided-strike','guided-strike','Spend Channel Divinity to add +10 to this attack roll. Helping another creature uses your Reaction.'],
 ['[data-rsa-shield]','shield','Cast Shield as a Reaction to gain +5 AC until the start of your next turn, including against this attack.'],
 ['.rsa-sentinel-death','sentinel-at-deaths-door','Spend a use and your Reaction to halve this damage before resistance.'],
 ['.rsa-modify-magic','modify-magic','Spend Channel Divinity to modify this spell with the selected option.'],
 ['.rsa-flash-actions','flash-of-genius','Spend a use and your Reaction to add your Intelligence modifier to this failed check or save.'],
 ['.rsa-restore-balance','restore-balance','Spend a use and your Reaction to cancel Advantage or Disadvantage, using the first original d20.'],
 ['.rsa-bend-luck','bend-luck','Spend a Sorcery Point and your Reaction to add or subtract your native Bend Luck roll from this D20 Test.'],
 ['.rsa-bastion','bastion-of-law','Spend dice from this protective ward to reduce the incoming damage by their total.'],
 ['.rsa-song-defense','song-of-defense','While Bladesong is active, use your Reaction and a spell slot to reduce damage by five times the slot’s level.'],
 ['.rsa-projected-ward','projected-ward','Use your Reaction to have your Arcane Ward absorb damage to the selected creature.'],
 ['.rsa-burning-life','crown-of-spellfire','Spend Hit Point Dice to reduce the incoming damage by the roll’s total.'],
 ['.rsa-cosmic-omen','cosmic-omen','Spend a use and your Reaction to add Weal or subtract Woe from this D20 Test.'],
 ['.rsa-bardic-actions','bardic-inspiration','Roll and spend the granted Bardic Inspiration die, adding it to this failed D20 Test.'],
 ['.rsa-cutting-actions','cutting-words','Use your Reaction and a Bardic Inspiration use to subtract your Bardic die from this roll.'],
 ['[data-rsa-parry]','parry','Use your Reaction and a Superiority Die to reduce this melee damage by the die plus your higher Strength or Dexterity modifier.'],
 ['.rsa-deflect-actions','deflect-attacks','Use your Reaction to reduce this incoming attack’s damage.'],
 ['.rsa-protective-field','protective-field','Use your Reaction and a Psionic Energy Die to reduce damage to the selected creature by the die plus your Intelligence modifier.'],
 ['.rsa-steel-deflect','steel-defender','Use the defender’s Reaction to impose Disadvantage on this attack against another creature.'],
 ['.rsa-warding-flare','warding-flare','Spend a Warding Flare use and your Reaction to impose Disadvantage on this attack.'],
 ['.rsa-defensive-duelist','defensive-duelist','Use your Reaction to add your Proficiency Bonus to AC against melee attacks until your next turn.'],
 ['.rsa-lucky','lucky','Spend a Luck Point to impose Disadvantage on this incoming attack. Advantage cancels normally.'],
 ['.rsa-mage-slayer','mage-slayer','Spend your Guarded Mind use to succeed on this failed Intelligence, Wisdom or Charisma save.'],
 ['.rsa-deflect','deflect-attacks','Use your Reaction to reduce this attack’s damage. If reduced to zero, you can spend a Focus Point to redirect it.'],
 ['[data-rsa-empowered]','empowered-spell','Spend a Sorcery Point to reroll selected damage dice and use their new results.'],
 ['[data-rsa-weapon-feat]','weapon-feat','Apply the selected weapon feat’s benefit to this attack.'],
 ['[data-rsa-seeking]','seeking-spell','Spend a Sorcery Point to reroll this missed spell attack and use the new roll.'],
 ['[data-rsa-precision]','precision-attack','Add a Superiority Die to this missed attack. Relentless can replace it with a free d8 when available.'],
 ['.rsa-own-luck-actions','dark-ones-own-luck','Spend a use to add your native Dark One’s Own Luck die to this failed check or save.'],
 ['.rsa-focus-actions','fanatical-focus','While raging, reroll this failed saving throw and use the new result.'],
 ['.rsa-indomitable','indomitable','Spend a use to reroll this failed saving throw with your Fighter level added.'],
 ['.rsa-disciplinedSurvivor','disciplined-survivor','Spend a Focus Point to reroll this failed saving throw and use the new result.'],
 ['.rsa-shared-resilience','shared-resilience','Use your Reaction and a Focus Point to let the creature reroll its failed saving throw.'],
 ['.rsa-homing-actions','homing-strikes','Spend a Psionic Energy Die and add it to this missed attack. Spend the die only if the attack hits.'],
 ['.rsa-peerless-actions','peerless-skill','Add your Bardic die to this failed attack or ability check, spending the use only if it succeeds.'],
 ['.rsa-valor-actions','combat-inspiration','Spend the granted Bardic die for the selected Combat Inspiration benefit.'],
 ['.rsa-uncanny-actions','uncanny-dodge','Use your Reaction to halve this attack’s damage against you, if you can see the attacker.'],
 ['.rsa-chain-resistance','investment-of-the-chain-master','Spend your Reaction to grant your familiar Resistance against this damage.'],
 ['.rsa-superior-defense','superior-hunters-defense','Spend your Reaction to resist the selected damage type for this hit and the rest of the current turn.'],
 ['.rsa-rebuke-actions','elemental-rebuke','Use your Reaction to halve the triggering damage and retaliate with Elemental Rebuke.'],
 ['.rsa-beguiling','beguiling-defenses','Use your Reaction to halve this hit and force a Wisdom save. On failure, the attacker takes Psychic damage equal to the damage you take.'],
 ['.rsa-instinctive-charm','instinctive-charm','Use your Reaction to force a Wisdom save. On failure, redirect this attack to another eligible creature.'],
 ['.rsa-illusory-self','illusory-self','Use your Reaction to interpose an illusory duplicate, causing this attack to miss.'],
 // Follow-up abilities are presentation peers, not pre-application reactions.
 // Registering them here must not add a reactive automation hold.
 ['.rsa-superior-prey','superior-hunters-prey','Once per turn after damaging your marked creature, choose another visible enemy within 30 feet of it and apply the Hunter’s Mark damage already rolled. No additional dice are rolled.'],
 ['.rsa-psionic-strike','psionic-power','Spend one Psionic Energy Die after dealing weapon damage to add your native Psionic Strike damage to this hit.'],
 ['.rsa-hand-of-harm','hand-of-harm','After dealing unarmed damage, add your native Hand of Harm damage. Spend one Focus Point unless this use is free.'],
 ['.rsa-rend-mind','rend-mind','After a Psychic Blade Sneak Attack hit, use Rend Mind to force a saving throw against its native Stunned effect.'],
 ['.rsa-lifedrinker-healing','lifedrinker','Spend one Hit Point Die to roll Lifedrinker’s native self-healing.'],
 ['.rsa-alchemical-eruption','chemical-mastery','After dealing Acid, Fire or Poison spell damage on your turn, spend an Alchemical Eruption use to deal the native extra damage to the chosen recipient.'],
 ['.rsa-genie-smite-actions','elemental-smite','Spend one Channel Divinity use to apply the selected Elemental Smite benefit after Divine Smite damage.'],
 ['.rsa-chilling-actions','chilling-retribution','Spend your Reaction and a use to force the attacker’s Wisdom save. On failure, it is Stunned with Speed 0 until the end of your next turn.'],
 ['.rsa-fount-moonlight','fount-of-moonlight','Spend your Reaction to force the attacker to save against Blindness.'],
 ['.rsa-stalkers-flurry','stalkers-flurry','Choose a different creature within 5 feet of the original target and within your weapon’s range, then make one attack with the same weapon.'],
 ['[data-rsa-cleave]','cleave','After a Cleave hit, select another creature and make your extra Cleave attack with the same weapon.'],
 ['.rsa-wild-ram','power-of-the-wilds','While the Ram power is active, knock a Large or smaller creature Prone after hitting it with a melee attack.'],
 ['[data-rsa-relentless-rage-roll]','relentless-rage','Make your Relentless Rage saving throw to recover Hit Points and keep raging after being reduced to 0 Hit Points.'],
 ['[data-rsa-strength-grave-activate]','power-of-shadow','Make Strength of the Grave’s Charisma saving throw to recover from being reduced to 0 Hit Points.']
];
const values=v=>Array.from(v?.values?.()??v??[]);
const normalize=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const procedural=/(?:ask\b.*\bgm|\bundo\b|already (?:used|applied|spent)|no .*remaining|not available|unavailable|locked)/i;

function sourceIcon(card,id,label){
    // Resolve only this message's source, recipients and captured reaction
    // actors. Never enumerate all actors or recent messages to find an icon.
    const actors=new Set([card?.getAssociatedActor?.()]);
    const resolve=ref=>{try{return typeof ref==='string'?globalThis.fromUuidSync?.(ref,{strict:false}):ref;}catch{return null;}};
    for(const target of card?.system?.targets??[])actors.add(resolve(target.token)?.actor??resolve(target.actor));
    for(const [key,snapshot]of Object.entries(card?.flags?.['ugmuls-5-5e-automation']??{})){
        if(!/snapshot$/i.test(key))continue;
        for(const entry of values(snapshot?.entries))actors.add(resolve(entry.actor));
    }
    const candidates=[];
    for(const actor of actors){
        if(!actor)continue;
        const item=values(actor.items).find(item=>normalize(item.identifier??item.system?.identifier)===normalize(id)||normalize(item.name)===normalize(id));
        if(item?.img)candidates.push({actor,img:item.img});
    }
    return (candidates.find(c=>label.includes(c.actor.name))??candidates[0])?.img;
}

export function presentReactionButtons(root){
    if(!root?.querySelectorAll)return;
    for(const button of root.querySelectorAll('button')){
        if(button.dataset.rsaReactionPresented)continue;
        const rule=rules.find(([selector])=>button.closest(selector));if(!rule)continue;
        const [,id,fallback]=rule;
        const original=button.textContent.trim()||button.getAttribute('aria-label')||id.replaceAll('-',' ');
        const label=original.split(/\s+[—·]\s+/).filter(part=>!procedural.test(part)).join(' — ').trim();
        const native=button.dataset.tooltip??button.title;
        const effect=id==='weapon-feat'&&button.dataset.rsaWeaponFeat==='piercer'?'Reroll one weapon damage die and use its new result. Riders are excluded; once per turn.':fallback;
        const describesEffect=native&&/\b(?:add|subtract|reduce|resist|halve|reroll|roll|spend|use|cast|gain|force|impose|succeed|cancel|grant|damage|advantage)\b/i.test(native);
        const description=button.dataset.rsaReactionDescription||(!describesEffect||procedural.test(native)?effect:native);
        const tooltip=label+'. '+description;
        let icon=button.querySelector('img');
        if(!icon){
            const messageId=button.closest('[data-message-id]')?.dataset.messageId;
            const img=button.dataset.rsaReactionIcon??sourceIcon(game.messages.get(messageId),id,label);
            icon=img?null:button.querySelector('i,svg,dnd5e-icon');
            if(!icon){icon=document.createElement('img');icon.src=img??'icons/svg/d20.svg';}
        }
        icon.setAttribute('aria-hidden','true');if(icon.tagName==='IMG')icon.alt='';
        // Keep the actual button, its disabled state and all listeners intact.
        button.replaceChildren(icon);button.classList.add('rsa-reaction-icon');
        button.dataset.rsaReactionPresented='true';button.dataset.tooltip=tooltip;
        delete button.dataset.tooltipHtml;button.removeAttribute('title');button.setAttribute('aria-label',tooltip);
    }
}

// Loaded last: feature renderers and unified footer placement must finish first.
Hooks.once('ready',()=>Hooks.on('dnd5e.renderChatMessage',(_card,html)=>presentReactionButtons(html?.[0]??html)));
