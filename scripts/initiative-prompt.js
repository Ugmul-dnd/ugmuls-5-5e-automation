const ID='ugmuls-5-5e-automation',CAROUSEL='combat-tracker-dock',pending=new WeakSet(),installed=new WeakSet();

export function carouselInitiativeTarget(event){
 if(game.settings.get(ID,'overrideInitiativePrompt')!==true||game.modules.get(CAROUSEL)?.active!==true)return null;
 const button=event.target?.closest?.('.roll-initiative'),dock=ui.combatDock,root=dock?.element?.[0]??dock?.element;
 if(!button||!root?.contains?.(button))return null;
 const portrait=button.closest('.combatant-portrait[data-combatant-id]'),combatant=dock.combat?.combatants?.get(portrait?.dataset.combatantId),actor=combatant?.actor;
 if(!portrait||!combatant?.isOwner||!actor?.isOwner||typeof actor.rollInitiativeDialog!=='function')return null;
 return {dock,combatant,actor};
}
export async function promptCarouselInitiative(event){
 const context=carouselInitiativeTarget(event);if(!context)return false;
 // Capture only the carousel's native dice control before its fast-roll handler
 // runs. The native actor dialog retains system/modifier hooks and roll modes.
 event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
 const {actor,dock}=context;if(pending.has(actor))return true;pending.add(actor);
 try{await actor.rollInitiativeDialog({event},{configure:true});}
 finally{pending.delete(actor);if(ui.combatDock===dock&&dock.element)await dock.updateOrder?.();}
 return true;
}
export function installInitiativePrompt(root=globalThis.document){
 if(!root?.addEventListener||installed.has(root))return;installed.add(root);
 root.addEventListener('click',event=>{promptCarouselInitiative(event).catch(error=>{console.error('Override initiative prompt',error);ui.notifications.error(error.message);});},true);
}
Hooks.once('init',()=>game.settings.register(ID,'overrideInitiativePrompt',{
 name:'Override initiative prompt',hint:'Open the native D&D5e initiative configuration when clicking a combatant’s dice in Carousel Combat Tracker. Review advantage/disadvantage, modifiers, roll visibility, and initiative features before rolling. Disable to retain Carousel’s fast roll.',
 scope:'world',config:true,type:Boolean,default:true
}));
Hooks.once('ready',()=>{if(game.modules.get(CAROUSEL)?.active)installInitiativePrompt();});
