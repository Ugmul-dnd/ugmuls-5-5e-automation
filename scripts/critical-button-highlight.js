const AC="automated-conditions-5e",painted=new WeakMap();
export function highlightCriticalButton(app){
 const root=app?.element,button=root?.querySelector?.('button[data-action="critical"]');if(!button)return;
 const state=app.config?.options?.[AC]??app.config?.[AC]??app.config?.rolls?.[0]?.options?.[AC];
 const mode=state?.defaultButton??app.options?.defaultButton,critical=app.config?.critical?.allow!==false&&app.config?.isCritical===true&&mode==="critical";
 const previous=painted.get(button);
 if(!critical||!game.modules?.get?.(AC)?.active||game.settings.get(AC,"buttonColorEnabled")!==true){if(previous){Object.assign(button.style,previous);button.classList.remove('rsa-critical-recommendation');painted.delete(button);}return;}
 // AC5e owns its own highlighted buttons. Fill only its unpainted native
 // critical recommendation; no roll mode, keyboard focus or rules are changed.
 if(button.classList.contains('ac5e-button'))return;
 if(!previous)painted.set(button,{backgroundColor:button.style.backgroundColor??'',border:button.style.border??'',color:button.style.color??''});
 const background=game.settings.get(AC,"buttonColorBackground"),border=game.settings.get(AC,"buttonColorBorder"),text=game.settings.get(AC,"buttonColorText");
 if(background)button.style.backgroundColor=background;if(border)button.style.border='1px solid '+border;if(text)button.style.color=text;button.classList.add('rsa-critical-recommendation');
}
Hooks.once("ready",()=>Hooks.on("renderDamageRollConfigurationDialog",app=>queueMicrotask(()=>highlightCriticalButton(app))));
