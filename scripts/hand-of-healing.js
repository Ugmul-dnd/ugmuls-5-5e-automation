import {mercyFlurryEnabled} from "./mercy-flurry.js";
import {describeTarget} from "./shared-activity-card.js";
const ID="ugmuls-5-5e-automation",values=v=>Array.from(v?.values?.()??v??[]),key=i=>i?.identifier??i?.system?.identifier;
export function healingHand(actor){const item=values(actor?.items).find(i=>i.type==="feat"&&key(i)==="hand-of-healing"&&i.system?.source?.rules!=="2014");const activity=values(item?.system?.activities).find(a=>a.type==="heal");return activity?{item,activity}:null;}
export function healingTouch(source,target){
 if(!source?.actor||!target?.actor||source.parent?.id!==target.parent?.id||target.hidden||target.object?.visible===false)return false;
 if(source.actor.uuid===target.actor.uuid)return true;
 const scene=source.parent,size=Number(scene.grid?.size),center=t=>t.getCenterPoint?.()??t.object?.center,a=center(source),b=center(target);if(!a||!b)return false;
 let points=[a,b];
 if(Number.isFinite(size)&&size>0&&[source.x,source.y,target.x,target.y].every(Number.isFinite)){
  const point=(t,p)=>scene.grid.type===0?{x:Math.max(t.x,Math.min(t.x+Number(t.width??1)*size,p.x)),y:Math.max(t.y,Math.min(t.y+Number(t.height??1)*size,p.y))}:{x:t.x+size*(0.5+Math.max(0,Math.min(Math.ceil(Number(t.width??1))-1,Math.round((p.x-t.x)/size-0.5)))),y:t.y+size*(0.5+Math.max(0,Math.min(Math.ceil(Number(t.height??1))-1,Math.round((p.y-t.y)/size-0.5))))};
  points=[point(source,b),point(target,a)];
 }
 const limit=/^(m|meters?|metres?)$/i.test(String(scene.grid?.units??"ft"))?1.524:5,distance=globalThis.canvas?.grid?.measurePath(points)?.distance;
 return Number.isFinite(distance)&&distance<=limit+1e-6&&!source.object?.checkCollision?.(points[1],{origin:points[0],type:"sight",mode:"any"});
}
export function prepareFlurryHealing(item,activity){
 const data=item.toObject(),id=activity.id,use=data.system.activities[id];data.system.activities={[id]:use};data.effects=[];
 use.activation={type:"special",override:true};use.consumption={spellSlot:false,targets:[],scaling:{allowed:false}};use.effects=[];
 use.target={override:true,prompt:false,template:{type:""},affects:{type:"creature",count:"1",choice:false}};use.range={override:true,units:"touch"};
 return{data,id};
}
export async function healFromFlurry(state,actor){
 if(state.busy||state.firstPending||state.remaining<1||!mercyFlurryEnabled(state.message,actor)&&(state.healingUsed||state.message.getFlag?.(ID,"flurryHealingUsed"))||!game.messages.get(state.message.id)||state.message.author?.id!==game.user.id||!actor?.isOwner)return;
 const native=healingHand(actor);if(!native)return;
 const targets=values(game.user.targets).map(t=>t.document??t);if(targets.length!==1){ui.notifications.warn("Select one creature to receive Hand of Healing.");return;}
 const source=state.message.getAssociatedToken?.()??actor.token??values(globalThis.canvas?.scene?.tokens).find(t=>t.actor?.uuid===actor.uuid),sourceDoc=source?.document??source,target=targets[0];
 if(!healingTouch(sourceDoc,target)){ui.notifications.warn("Hand of Healing needs a creature you can touch within 5 feet.");return;}
 state.busy=true;state.window?.render({force:true});let usage,completed=false;
 try{
  const {data,id}=prepareFlurryHealing(native.item,native.activity),helper=new CONFIG.Item.documentClass(data,{parent:actor});helper.prepareFinalAttributes?.();
  const records=[describeTarget(target)],flags={dnd5e:{item:{data}},[ID]:{riderTriggered:true,activityOverrideData:data,flurryHealing:{source:state.message.id,actor:actor.uuid,target:target.uuid}}};
  const result=await helper.system.activities.get(id).use({consume:false,subsequentActions:false,create:{measuredTemplate:false}},{configure:false},{data:{system:{targets:records},flags}});usage=result?.message;if(!usage)throw Error("Hand of Healing could not create its healing card.");
  const rolls=await helper.system.activities.get(id).rollDamage({isCritical:false},{configure:false},{data:{system:{origin:usage.id,targets:records},flags}});if(!rolls?.length)throw Error("Hand of Healing did not complete. Its Flurry attack remains available.");
  completed=true;state.healingUsed=true;state.remaining--;
  await state.message.setFlag(ID,"flurryHealingUsed",{message:usage.id,target:target.uuid});
 }catch(error){if(!completed&&usage)await usage.setFlag(ID,"manualDamageWorkflow",true);throw error;}
 finally{state.busy=false;if(state.remaining===0)await state.window?.close();else state.window?.render({force:true});}
}
export function flurryHealingActions(state,actor){
 if(!healingHand(actor))return[];const used=!mercyFlurryEnabled(state.message,actor)&&(state.healingUsed||state.message.getFlag?.(ID,"flurryHealingUsed"));
 return[{key:"hand-of-healing",label:used?"Hand of Healing — Used":"Hand of Healing — Replace 1 Attack",disabled:!!used,run:()=>healFromFlurry(state,actor)}];
}
