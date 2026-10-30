import {createEventQueue} from "./shared-activity-card.js";
import {storageRecipients} from "./spell-storing-item.js";
const ID="ugmuls-5-5e-automation",TABLE="Compendium.dnd-forge-artificer.tables.RollTable.efaExperimentalE",enqueue=createEventQueue(),wrapped=new WeakSet(),busy=new Set(),waiting=new Map(),completed=new WeakSet();
const values=v=>v?.values?Array.from(v.values()):Array.isArray(v)?v:Object.values(v??{}),flag=(d,k)=>d?.getFlag?.(ID,k)??d?.flags?.[ID]?.[k],resolve=ref=>typeof ref==="string"?globalThis.fromUuidSync?.(ref,{strict:false}):ref;
const enabled=()=>game.settings.get(ID,"experimentalElixirAutomation")===true,authority=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.id===game.user.id),owns=(actor,user)=>!!user?.active&&!!actor&&(user.isGM||actor.testUserPermission?.(user,"OWNER"));
export const elixirFeature=actor=>values(actor?.items).find(i=>i.type==="feat"&&i.system?.source?.rules!=="2014"&&((i.identifier??i.system?.identifier)==="experimental-elixir"||i.name?.trim().toLowerCase()==="experimental elixir"));
const restActivity=feature=>values(feature?.system?.activities).find(a=>a.type==="utility"&&a.activation?.type==="longRest");
const actors=()=>new Map([...values(game.actors),...values(game.scenes).flatMap(s=>values(s.tokens).map(t=>t.actor))].filter(Boolean).map(a=>[a.uuid,a]));
function party(actor,user,scene){const list=scene||user.viewedScene?storageRecipients(actor,user,scene):[];return [...new Map([actor,...list.filter(a=>a.type==="character")].map(a=>[a.uuid,a])).values()];}
function validate(actor,user){if(!authority()||!enabled()||!elixirFeature(actor)||!owns(actor,user))throw Error("Experimental Elixirs require your Alchemist and a connected GM.");}
export function elixirCount(actor){const feature=elixirFeature(actor),formula=restActivity(feature)?.roll?.formula;if(!formula)throw Error("The native Experimental Elixir count formula is unavailable.");const roll=new CONFIG.Dice.BasicRoll(formula,feature.getRollData?.()??actor.getRollData?.()??{});if(roll.isDeterministic===false)throw Error("The elixir count must be deterministic.");const count=Number(roll.evaluateSync().total);if(!Number.isInteger(count)||count<1||count>20)throw Error("The native Experimental Elixir count could not be resolved.");return count;}
async function choices(){const table=await fromUuid(TABLE);if(!table?.formula)throw Error("The native Experimental Elixir table is unavailable.");const options=values(table.results).filter(r=>r.documentUuid&&r.range?.[0]>=1&&r.range?.[1]<6).map(r=>({face:Number(r.range[0]),uuid:r.documentUuid,name:r.name}));if(options.length!==5)throw Error("Experimental Elixir needs the five native elixir results.");return {table,options};}
export async function newElixirRest(actor,rest,user=game.user){
 validate(actor,user);const previous=flag(actor,"elixirState");if(previous?.rest===rest)return previous;
 // Inventory expiry runs only at this creator's completed Long Rest, never on
 // drinking, target rests, or effect expiry. Applied buffs are left to native expiry.
 for(const recipient of actors().values()){const ids=values(recipient.items).filter(i=>flag(i,"experimentalElixir")?.creator===actor.uuid).map(i=>i.id);if(ids.length)await recipient.deleteEmbeddedDocuments("Item",ids);}
 const state={rest,cycle:foundry.utils.randomID(),batch:null};await actor.setFlag(ID,"elixirState",state);return state;
}
export async function beginElixirs(actor,payload={},user=game.user){
 validate(actor,user);const recipients=party(actor,user,payload.scene),{table,options}=await choices();let state=flag(actor,"elixirState")??{cycle:foundry.utils.randomID(),batch:null};
 if(!state.batch){
  const count=elixirCount(actor),rolls=[];for(let i=0;i<count;i++)rolls.push(await new CONFIG.Dice.BasicRoll(table.formula).evaluate());
  const faces=rolls.map(r=>Number(r.total));if(faces.some(n=>!Number.isInteger(n)||n<1||n>6))throw Error("The Experimental Elixir table did not produce valid results.");
  const level=Number(actor.classes?.artificer?.system?.levels??actor.getRollData?.().classes?.artificer?.levels),mod=Number(actor.system?.abilities?.int?.mod);if(!Number.isFinite(level)||!Number.isFinite(mod))throw Error("The Alchemist’s level or Intelligence modifier is unavailable.");
  state={...state,batch:{id:foundry.utils.randomID(),faces,rolls:rolls.map(r=>r.toJSON()),level,mod,scene:payload.scene??user.viewedScene??null,created:false}};await actor.setFlag(ID,"elixirState",state);
 }
 return {batch:state.batch,options,recipients:recipients.map(a=>({uuid:a.uuid,name:a.name}))};
}
export function buildElixir(source,batch,creator,row){
 const data=source.toObject(),tier=batch.level>=15?2:batch.level>=9?1:0;delete data._id;delete data.folder;delete data.ownership;
 data.system.quantity=1;data.system.uses={...data.system.uses,spent:0,max:"1",recovery:[],autoDestroy:true};
 const activities=Object.values(data.system.activities??{}),healing=activities.filter(a=>a.type==="heal").sort((a,b)=>Number(a.healing?.number)-Number(b.healing?.number));
 if(healing.length){const selected=healing[Math.min(tier,healing.length-1)];selected.healing.bonus=String(batch.mod);selected.description??={};selected.description.chatFlavor="Created by "+creator.name;data.system.activities={[selected._id]:selected};}
 else{
  const effect=(data.effects??[]).find(e=>tier===0?!/\+\d+$/.test(e.name??""):e.name?.endsWith("+"+tier));if(!effect)throw Error("The native elixir is missing its level-scaled effect.");data.effects=[effect];
  for(const activity of activities){activity.effects=[{_id:effect._id}];activity.appliedEffects=[effect._id];activity.duration={override:true,concentration:false,units:effect.duration.units,value:String(effect.duration.value)};}
 }
 data.flags??={};data.flags[ID]={...data.flags[ID],experimentalElixir:{creator:creator.uuid,batch:batch.id,row,level:batch.level,mod:batch.mod}};data._stats={...data._stats,compendiumSource:source.uuid};return data;
}
export async function distributeElixirs(actor,payload,user=game.user){
 validate(actor,user);const state=flag(actor,"elixirState"),batch=state?.batch;if(!batch||batch.id!==payload.batch)throw Error("This elixir batch was replaced by a newer Long Rest.");if(batch.created)return batch.distribution;
 const recipients=party(actor,user,payload.scene),allowed=new Map(recipients.map(a=>[a.uuid,a])),{options}=await choices(),rows=payload.rows;
 if(!Array.isArray(rows)||rows.length!==batch.faces.length)throw Error("Assign an elixir and recipient for every row.");
 const groups=new Map();
 for(const [index,row]of rows.entries()){
  const face=batch.faces[index],option=options.find(o=>o.uuid===row.elixir),recipient=allowed.get(row.target);if(!option||!recipient||face!==6&&option.face!==face)throw Error("An elixir result or recipient is no longer valid.");
  const source=await fromUuid(option.uuid);if(source?.type!=="consumable")throw Error("The native elixir item could not be loaded.");const data=buildElixir(source,batch,actor,index);if(!groups.has(recipient))groups.set(recipient,[]);groups.get(recipient).push(data);
 }
 const created=[];try{
  for(const [recipient,data]of groups){const items=await recipient.createEmbeddedDocuments("Item",data);created.push({recipient,ids:items.map(i=>i.id)});}
  const distribution=rows.map((row,index)=>({roll:batch.faces[index],elixir:options.find(o=>o.uuid===row.elixir).name,target:allowed.get(row.target).name}));
  await actor.setFlag(ID,"elixirState",{...state,batch:{...batch,created:true,distribution}});return distribution;
 }catch(error){for(const {recipient,ids}of created)await recipient.deleteEmbeddedDocuments("Item",ids);throw error;}
}
const dispatch=(operation,actor,payload,user=game.user)=>operation==="begin"?beginElixirs(actor,payload,user):operation==="rest"?newElixirRest(actor,payload.rest,user):distributeElixirs(actor,payload,user);
function operate(operation,actor,payload={}){
 const gm=game.users.activeGM;if(!gm&&!game.user.isGM)return Promise.reject(Error("A connected GM is required to distribute elixirs to the party."));if(!gm||gm.id===game.user.id)return enqueue(()=>dispatch(operation,actor,payload));
 const request=foundry.utils.randomID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(request);reject(Error("The GM did not answer the elixir request."));},45000);waiting.set(request,{resolve,reject,timer});game.socket.emit("module."+ID,{action:"experimentalElixir",operation,actor:actor.uuid,payload,request,user:game.user.id,gm:gm.id});});
}
export async function elixirWindow(actor){
 if(busy.has(actor.uuid))return;busy.add(actor.uuid);
 try{
  const scene=globalThis.canvas?.scene?.id,catalog=await operate("begin",actor,{scene}),{batch,options,recipients}=catalog;if(batch.created){ui.notifications.info("This Long Rest’s experimental elixirs have already been created.");return;}
  if(game.dice3d?.showForRoll){const rolls=batch.rolls.map(r=>CONFIG.Dice.BasicRoll.fromData(r)),pool=Roll.fromTerms([foundry.dice.terms.PoolTerm.fromRolls(rolls)]),animation=game.dice3d.showForRoll(pool,game.user,true);if(globalThis.Ugmuls55eAutomationWaitForAnimation)await globalThis.Ugmuls55eAutomationWaitForAnimation(animation);else await animation;}
  const escape=foundry.utils.escapeHTML,content='<p>Choose the effect for any 6s, then assign each elixir. Items are created only when you click Create &amp; Distribute.</p><table><thead><tr><th>#</th><th>d6</th><th>Elixir</th><th>Target PC</th></tr></thead><tbody>'+batch.faces.map((face,i)=>{const fixed=options.find(o=>o.face===face),choice=face===6?'<select name="elixir'+i+'">'+options.map(o=>'<option value="'+escape(o.uuid)+'">'+escape(o.name)+'</option>').join('')+'</select>':escape(fixed.name)+'<input type="hidden" name="elixir'+i+'" value="'+escape(fixed.uuid)+'">';return '<tr><td>'+(i+1)+'</td><td>'+face+(face===6?' — Choose':'')+'</td><td>'+choice+'</td><td><select name="target'+i+'">'+recipients.map(a=>'<option value="'+escape(a.uuid)+'"'+(a.uuid===actor.uuid?' selected':'')+'>'+escape(a.name)+'</option>').join('')+'</select></td></tr>';}).join('')+'</tbody></table>';
  const rows=await foundry.applications.api.DialogV2.wait({window:{title:"Create Experimental Elixirs"},position:{width:760},content,rejectClose:false,buttons:[{action:"create",label:"Create & Distribute",default:true,callback:(_e,b)=>batch.faces.map((_,i)=>({elixir:b.form.elements['elixir'+i].value,target:b.form.elements['target'+i].value}))},{action:"cancel",label:"Close — Keep Rolls",callback:()=>null}]});if(!rows)return;
  const result=await operate("distribute",actor,{scene,batch:batch.id,rows});ui.notifications.info("Created and distributed "+result.length+" experimental elixirs.");return result;
 }finally{busy.delete(actor.uuid);}
}
export function installElixirCreation(Type=CONFIG.DND5E.activityTypes.utility?.documentClass){
 const p=Type?.prototype;if(!p?.use||wrapped.has(p))return;wrapped.add(p);const own=Object.hasOwn(p,"use"),use=p.use;
 p.use=async function(...args){if(!enabled()||this.item!==elixirFeature(this.actor)||this.id!==restActivity(this.item)?.id)return (own?use:Object.getPrototypeOf(p).use).apply(this,args);if(!owns(this.actor,game.user))throw Error("Only the Alchemist’s owner can create these elixirs.");return elixirWindow(this.actor);};
}
export async function completedElixirRest(actor,result,config={}){
 if(!enabled()||!result||completed.has(result)||(config.type??result.type)!=="long"||!actor?.isOwner||!elixirFeature(actor))return;completed.add(result);await operate("rest",actor,{rest:result.message?.id??foundry.utils.randomID()});
}
function report(error){console.error("Experimental Elixir",error);ui.notifications.error(error.message);}
Hooks.once("init",()=>game.settings.register(ID,"experimentalElixirAutomation",{name:"Alchemist: Experimental Elixirs",hint:"Create and distribute the native Long Rest elixir batch from its rest-card or feature action. Roll each result, choose on 6, assign party PCs, and expire unused elixirs at the creator’s next Long Rest.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
 installElixirCreation();Hooks.on("dnd5e.restCompleted",(a,r,c)=>completedElixirRest(a,r,c).catch(report));
 Hooks.on("createChatMessage",card=>{if(authority()&&enabled()&&card.type==="rest"&&card.system?.type==="long"){const actor=card.getAssociatedActor?.();if(elixirFeature(actor))enqueue(()=>newElixirRest(actor,card.id)).catch(report);}});
 game.socket.on("module."+ID,packet=>{if(packet?.action==="experimentalElixirReply"&&packet.user===game.user.id){const entry=waiting.get(packet.request);if(!entry)return;waiting.delete(packet.request);clearTimeout(entry.timer);packet.error?entry.reject(Error(packet.error)):entry.resolve(packet.result);return;}
  if(packet?.action!=="experimentalElixir"||!authority()||packet.gm!==game.user.id||!["begin","rest","distribute"].includes(packet.operation))return;const user=game.users.get(packet.user),actor=resolve(packet.actor);if(!owns(actor,user))return;
  enqueue(()=>dispatch(packet.operation,actor,packet.payload,user)).then(result=>game.socket.emit("module."+ID,{action:"experimentalElixirReply",request:packet.request,user:user.id,result}),error=>game.socket.emit("module."+ID,{action:"experimentalElixirReply",request:packet.request,user:user.id,error:error.message}));
 });
});
