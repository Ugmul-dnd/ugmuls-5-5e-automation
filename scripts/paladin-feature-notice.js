const ID="ugmuls-5-5e-automation";
const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export async function paladinFeatureNotice(actor,{feature,target,weapon,transfer=false,source,user=game.user}={}){
 const text=feature==="sacred-weapon"?escape(actor.name)+" activated <strong>Sacred Weapon</strong> on <strong>"+escape(weapon)+"</strong>. Spent 1 Channel Divinity use.":transfer?escape(actor.name)+" transferred <strong>Vow of Enmity</strong> to <strong>"+escape(target)+"</strong>. No use spent; remaining duration unchanged.":escape(actor.name)+" activated <strong>Vow of Enmity</strong> against <strong>"+escape(target)+"</strong>. Spent 1 Channel Divinity use.";
 try{return await ChatMessage.create({user:user?.id,speaker:ChatMessage.getSpeaker({actor,...(source?{token:source,parent:source.parent,scene:source.parent}:{})}),content:'<p>'+text+'</p>',flags:{[ID]:{paladinFeatureNotice:{feature,action:transfer?"transferred":"activated",actor:actor.uuid}}}});}
 catch(error){console.warn("Paladin feature chat notice could not be posted",error);return null;}
}
