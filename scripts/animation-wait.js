// Animations are presentation, never a dependency on another user keeping a window active.
export async function waitForVisibleAnimation(animation,{document:doc=globalThis.document,window:win=globalThis.window}={}){
 const pending=Promise.resolve(animation);
 const inactive=()=>doc?.hidden===true||doc?.hasFocus?.()===false;
 if(inactive()){pending.catch(error=>console.warn("Background dice animation failed",error));return;}
 let release;const background=new Promise(resolve=>release=resolve);
 const visibility=()=>{if(inactive())release();};
 const blur=()=>release();
 doc?.addEventListener?.("visibilitychange",visibility);win?.addEventListener?.("blur",blur);
 try{visibility();await Promise.race([pending,background]);}
 finally{doc?.removeEventListener?.("visibilitychange",visibility);win?.removeEventListener?.("blur",blur);}
}
const ID="ugmuls-5-5e-automation";
// Include the DSN setup delay in the visibility-aware wait: background tabs
// throttle timers too, so acknowledging must not depend on that delay firing.
export async function waitForClientRollAnimations(ids,wait,{document:doc=globalThis.document,window:win=globalThis.window}={}){
 if(doc?.hidden===true||doc?.hasFocus?.()===false)return;
 const animation=(async()=>{
  await new Promise(resolve=>setTimeout(resolve,100));
  const rolls=ids.map(id=>game.messages.get(id)).filter(card=>card&&card.visible!==false&&card.isContentVisible!==false);
  await Promise.all(rolls.map(wait));
 })();
 await waitForVisibleAnimation(animation,{document:doc,window:win});
}
let syncing;
export function configureInactiveDice(){
 if(syncing)return syncing;
 if(game.settings.get(ID,"backgroundAnimationSafety")!==true||!game.modules?.get?.("dice-so-nice")?.active||!game.user?.setFlag)return Promise.resolve();
 if(game.user.getFlag("dice-so-nice","settings")?.skipAnimationOnInactiveTab===true)return Promise.resolve();
 // Use DSN's own per-user preference, changing only this field. Do not patch
 // its renderer/queue or touch another user's document from a player client.
 syncing=Promise.resolve().then(()=>game.user.setFlag("dice-so-nice","settings.skipAnimationOnInactiveTab",true)).finally(()=>{syncing=null;});return syncing;
}
function configure(){configureInactiveDice().catch(error=>console.warn("Background dice configuration failed",error));}
Hooks.once("init",()=>game.settings.register(ID,"backgroundAnimationSafety",{name:"Skip Dice in Inactive Tabs",hint:"Enable Dice So Nice’s per-user skip-inactive-tab option on connected clients so hidden dice are not queued for replay. Visible clients still finish dice before automation results. Disabling this stops enforcement; existing Dice So Nice preferences can then be changed manually.",scope:"world",config:true,type:Boolean,default:true,onChange:configure}));
Hooks.once("ready",()=>{
 globalThis.Ugmuls55eAutomationWaitForAnimation=waitForVisibleAnimation;
 globalThis.Ugmuls55eAutomationClientRollWait=waitForClientRollAnimations;
 configure();Hooks.on("diceSoNiceReady",configure);
 Hooks.on("updateUser",(user,changes)=>{if(user.id===game.user.id&&(changes.flags?.["dice-so-nice"]||Object.keys(changes).some(k=>k.startsWith("flags.dice-so-nice."))))configure();});
});
