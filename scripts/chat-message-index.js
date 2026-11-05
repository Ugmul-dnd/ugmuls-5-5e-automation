const ID='ugmuls-5-5e-automation';
let state=null;
const flag=(card,key)=>card?.getFlag?.(ID,key)??card?.flags?.[ID]?.[key];
const selectors={
 type:card=>card.type,
 origin:card=>typeof card.system?.origin==='string'?card.system.origin.replace(/^ChatMessage\./,''):card.system?.origin?.id,
 damageAttackId:card=>flag(card,'damageAttackId'),
 movementDamage:card=>flag(card,'movementDamage')?.key,
 sharedCardKeys:card=>flag(card,'sharedCardKeys'),
 relentlessRageHealing:card=>flag(card,'relentlessRageHealing')
};
function remove(node){
 if(node.previous)node.previous.next=node.next;else state.first=node.next;
 if(node.next)node.next.previous=node.previous;else state.last=node.previous;
 for(const [name,keys]of Object.entries(node.keys))for(const key of keys){const bucket=state.buckets[name].get(key);bucket?.delete(node.id);if(!bucket?.size)state.buckets[name].delete(key);}
 state.nodes.delete(node.id);
}
function put(card){
 if(!card?.id)return;
 let node=state.nodes.get(card.id);
 if(node){for(const [name,keys]of Object.entries(node.keys))for(const key of keys){const bucket=state.buckets[name].get(key);bucket?.delete(node.id);if(!bucket?.size)state.buckets[name].delete(key);}}
 else{
  node={id:card.id,order:++state.serial,previous:state.last,next:null};
  if(state.last)state.last.next=node;else state.first=node;state.last=node;state.nodes.set(node.id,node);
 }
 node.keys={};
 for(const [name,select]of Object.entries(selectors)){
  const value=select(card),keys=[...new Set((Array.isArray(value)?value:[value]).filter(v=>typeof v==='string'&&v.length))];if(keys.length)node.keys[name]=keys;
  for(const key of keys){let bucket=state.buckets[name].get(key);if(!bucket)state.buckets[name].set(key,bucket=new Map());bucket.set(node.id,node);}
 }
}
function ensure(){
 const collection=game.messages,size=collection?.size??collection?.length;
 if(state?.collection===collection&&(size===undefined||state.nodes.size===size))return;
 state={collection,nodes:new Map(),buckets:Object.fromEntries(Object.keys(selectors).map(k=>[k,new Map()])),serial:0,first:null,last:null};
 for(const card of collection?.values?.()??collection??[])put(card);
}
export function indexedMessages(name,key){
 ensure();const nodes=state.buckets[name]?.get(key);if(!nodes)return [];
 return [...nodes.values()].sort((a,b)=>a.order-b.order).map(n=>game.messages.get(n.id)).filter(Boolean);
}
export function latestIndexedMessage(name,key,predicate=()=>true){
 ensure();let latest=null,result=null;
 for(const node of state.buckets[name]?.get(key)?.values()??[]){if(latest&&node.order<=latest.order)continue;const card=game.messages.get(node.id);if(card&&predicate(card)){latest=node;result=card;}}
 return result;
}
export function recentIndexedMessages(limit=100){
 ensure();const cards=[];
 for(let node=state.last;node&&cards.length<limit;node=node.previous){const card=game.messages.get(node.id);if(card)cards.push(card);}
 return cards.reverse();
}
// Incremental maintenance keeps insertion order stable when flags/rolls change.
// No actor, resource or rendering event invalidates this document-link index.
export function updateMessageIndex(card){if(state?.collection===game.messages)put(card);}
export function deleteMessageIndex(card){if(state?.collection===game.messages){const node=state.nodes.get(card.id);if(node)remove(node);}}
Hooks.once('ready',()=>{
 for(const event of ['createChatMessage','updateChatMessage'])Hooks.on(event,updateMessageIndex);
 Hooks.on('deleteChatMessage',deleteMessageIndex);
});
