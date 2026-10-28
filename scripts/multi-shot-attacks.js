const ID="ugmuls-5-5e-automation",windows=new Map();
export function shotCount(activity,message) {
    const item=activity?.item;
    const name=(item?.identifier??item?.system?.identifier??item?.name??"").toLowerCase().replace(/\s+/g,"-");
    if(activity?.type!=="attack")return 0;
    if(name==="eldritch-blast") {
        const level=Number(activity.actor?.system?.details?.level??item.actor?.system?.details?.level??1);
        return 1+Number(level>=5)+Number(level>=11)+Number(level>=17);
    }
    if(name==="scorching-ray") {
        const level=Number(message?.system?.level??(Number(item.system.level??2)+Number(message?.system?.scaling??0)));
        return Math.max(3,level+1);
    }
    return 0;
}
export async function fireNextShot(state) {
    if(state.busy||state.firstPending||state.remaining<1||!game.messages.get(state.message.id))return;
    const activity=state.resolveActivity?state.resolveActivity():(state.message.getAssociatedActivity?.({scaled:true})??state.activity);
    if(!activity?.item?.isOwner)return;
    if(game.user.targets?.size!==1){ui.notifications.warn("Select one target for the next attack.");return;}
    state.busy=true;state.window?.render({force:true});
    try {
        // Reuse the scaled activity and original usage, without another use or
        // resource consumption. Native attack cards retain the new live target.
        const rolls=await activity.rollAttack({}, {}, {data:{system:{origin:state.message.id},...(state.attackFlags?{flags:state.attackFlags}:{})}});
        if(rolls?.length){state.remaining--;state.attacksCompleted=(state.attacksCompleted??0)+1;if(state.attackFlags?.[ID]?.flurryOfBlows)await state.message.setFlag?.(ID,"flurryAttackStarted",true);}
    } finally {
        state.busy=false;
        if(state.remaining===0)await state.window?.close();
        else state.window?.render({force:true});
    }
}
export class MultiShotWindow extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS={id:"rsa-multi-shot-{id}",window:{title:"Remaining Spell Attacks",resizable:false},position:{width:320,height:"auto"}};
    constructor(state){super({id:`rsa-shots-${state.message.id}`,...(state.title?{window:{title:state.title}}:{})});this.shotState=state;}
    async _renderHTML() {
        const state=this.shotState,name=foundry.utils.escapeHTML(state.label??state.activity.item.name),actions=state.getActions?.(state)??[];
        const buttons=list=>list.map(a=>`<button type="button" data-rsa-counter-action="${foundry.utils.escapeHTML(a.key)}" style="display:block;width:100%;white-space:normal;height:auto;min-height:32px;margin-bottom:12px;" ${state.busy||state.firstPending||!state.remaining||a.disabled?"disabled":""}>${foundry.utils.escapeHTML(a.label)}</button>`).join("");
        return `<div style="padding:12px;"><strong style="display:block;margin-bottom:14px;">${name}</strong>${buttons(actions.filter(a=>a.placement==="beforeCount"))}<p>${state.remaining} Pending Attack${state.remaining===1?"":"s"}</p>
            <p>Select your next target on the map.</p><button type="button" style="margin-bottom:10px;" data-rsa-next-shot ${state.busy||state.firstPending||!state.remaining?"disabled":""}>${state.busy?"Rolling…":"Attack"}</button>${buttons(actions.filter(a=>a.placement!=="beforeCount"))}</div>`;

    }
    _replaceHTML(result,content){content.innerHTML=result;}
    _onRender(context,options){
        super._onRender(context,options);
        const report=err=>{console.error("Additional attack/action failed",err);ui.notifications.error(err.message??"Could not complete the next action.");};
        this.element.querySelector("[data-rsa-next-shot]")?.addEventListener("click",()=>fireNextShot(this.shotState).catch(report));
        for(const button of this.element.querySelectorAll("[data-rsa-counter-action]"))button.addEventListener("click",()=>{
            const action=this.shotState.getActions?.(this.shotState)?.find(a=>a.key===button.dataset.rsaCounterAction);
            if(action&&!action.disabled&&!this.shotState.busy&&this.shotState.remaining>0)Promise.resolve().then(()=>action.run()).catch(report);
        });
    }
    async close(options){windows.delete(this.shotState.message.id);return super.close(options);}
}
export function settleFirstShot(app,options) {
    const origin=app.message?.data?.system?.origin;
    const state=windows.get(typeof origin==="string"?origin:origin?.id);
    if(!state?.firstPending)return;
    state.firstPending=false;
    if(!options?.dnd5e?.submitted)state.remaining++;
    state.window.render({force:true});
}
Hooks.once("init",()=>game.settings.register(ID,"multiShotAttacks",{name:"Additional Spell Attacks",hint:"Show a remaining-attacks window for Eldritch Blast and Scorching Ray. Choose targets between attacks; reuse the original cast without spending more slots.",scope:"world",config:true,type:Boolean,default:true}));
Hooks.once("ready",()=>{
    globalThis.Ugmuls55eAutomationMultiShot={settleFirstShot};
    Hooks.on("dnd5e.postUseActivity",(activity,usage,results)=>{
        const message=results?.message;
        if(game.settings.get(ID,"multiShotAttacks")!==true||!message||message.author?.id!==game.user.id||!activity.item?.isOwner||usage.subsequentActions===false)return;
        const total=shotCount(activity,message);if(total<2||windows.has(message.id))return;
        const state={activity,message,remaining:total-1,firstPending:true,busy:false};
        state.window=new MultiShotWindow(state);windows.set(message.id,state);state.window.render({force:true});
    });
    Hooks.on("ugmuls55eAutomation.castReady",(activity,message)=>{
        if(game.settings.get(ID,"multiShotAttacks")!==true||windows.has(message.id))return;
        const total=shotCount(activity,message);if(total<2)return;
        const state={activity,message,remaining:total-1,firstPending:true,busy:false};
        state.window=new MultiShotWindow(state);windows.set(message.id,state);state.window.render({force:true});
    });
    Hooks.on("createChatMessage",message=>{
        if(message.type!=="attack")return;
        const origin=message.system?.origin;
        const state=windows.get(typeof origin==="string"?origin:origin?.id);
        if(state?.firstPending){state.firstPending=false;state.window.render({force:true});}
    });
    Hooks.on("deleteChatMessage",message=>windows.get(message.id)?.window.close());
});

export function openAttackCounter({activity,message,total,label,title,resolveActivity,attackFlags,getActions}){
 if(!message?.id||!Number.isInteger(total)||total<1||windows.has(message.id))return;
 const state={activity,message,remaining:total,firstPending:false,busy:false,label,title,resolveActivity,attackFlags,getActions};
 state.window=new MultiShotWindow(state);windows.set(message.id,state);state.window.render({force:true});return state;
}
