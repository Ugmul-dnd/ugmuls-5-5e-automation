// Shared same-turn Actor discovery for feature setup and explicit recovery.
// No hooks: consumers decide when to request this short-lived snapshot.
let actorDiscovery=null;
export function startupActors(){
 const actors=game.actors,scenes=game.scenes;
 if(actorDiscovery?.actors===actors&&actorDiscovery.scenes===scenes)return actorDiscovery.list;
 const found=new Map();for(const actor of actors?.values?.()??actors??[])if(actor)found.set(actor.uuid,actor);
 for(const scene of scenes?.values?.()??scenes??[])for(const token of scene.tokens?.values?.()??scene.tokens??[])if(token.actor)found.set(token.actor.uuid,token.actor);
 const snapshot={actors,scenes,list:Object.freeze([...found.values()])};actorDiscovery=snapshot;
 // Ready hooks share one discovery pass. Later setting changes/recovery get a
 // fresh view, including newly created/deleted synthetic actors and tokens.
 queueMicrotask(()=>{if(actorDiscovery===snapshot)actorDiscovery=null;});return snapshot.list;
}
