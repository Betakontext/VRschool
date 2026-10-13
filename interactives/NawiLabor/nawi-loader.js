/* Nawi iframe loader: same-origin, accessible and repeat-safe. */
(function(){
  'use strict';
  // Save the base synchronously: callbacks do not have document.currentScript.
  const own=document.currentScript;
  const moduleBase=new URL('.',own&&own.src ? own.src : location.href).href;
  const cssHref=new URL('nawi-loader.css',moduleBase).href;
  if(!document.querySelector('link[data-nawi-loader-css="'+cssHref+'"]')){
    const link=document.createElement('link');
    link.rel='stylesheet'; link.href=cssHref; link.dataset.nawiLoaderCss=cssHref;
    document.head.appendChild(link);
  }
  let active=null, savedOverflow='', opener=null, timer=null, opening=false, generation=0;
  function restore(){document.body.style.overflow=savedOverflow;if(opener&&opener.focus)opener.focus();opener=null;}
  function clean(){
    if(!active)return;
    clearTimeout(timer);timer=null;
    const state=active;active=null;opening=false;
    if(state.dialog&&state.dialog.isConnected)state.dialog.remove();
    restore();
  }
  function abort(){
    // Always remove the host overlay first; an unresponsive game cannot trap the tour.
    const state=active;
    if(!state){if(opening){generation++;opening=false;}return;}
    const frame=state.frame;
    if(frame&&frame.contentWindow)frame.contentWindow.postMessage({channel:'nawi-labor',type:'nawi-abort'},location.origin);
    clean();
  }
  async function openNawiLab(){
    if(active||opening)return;
    opening=true;
    const request=++generation;
    const scene=document.querySelector('a-scene');
    try{if(scene&&scene.is&&scene.is('vr-mode')&&scene.exitVR)await scene.exitVR();}
    catch(err){console.warn('Nawi-Labor: VR konnte nicht beendet werden.',err);}
    if(request!==generation||active){opening=false;return;}
    opener=document.activeElement;savedOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const dialog=document.createElement('div');
    dialog.className='nawi-frame-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Nawi-Labor');
    const close=document.createElement('button');
    close.type='button';close.className='nawi-frame-abort';close.textContent='×';
    close.setAttribute('aria-label','Nawi-Labor schließen (Fortschritt wird verworfen)');close.title='Nawi-Labor schließen';
    const frame=document.createElement('iframe');
    frame.title='Nawi-Labor';frame.className='nawi-frame';frame.src=new URL('nawi/nawi.html',moduleBase).href;frame.setAttribute('allow','fullscreen');
    active={dialog:dialog,frame:frame,generation:request};
    close.addEventListener('click',abort);dialog.append(close,frame);document.body.appendChild(dialog);close.focus();opening=false;
    frame.addEventListener('error',()=>{if(active&&active.frame===frame)clean();},{once:true});
    frame.addEventListener('abort',()=>{if(active&&active.frame===frame)clean();},{once:true});
    timer=setTimeout(()=>{if(active&&active.frame===frame)clean();},12000);
  }
  window.openNawiLab=openNawiLab;
  window.closeNawiLab=abort;
  window.addEventListener('message',e=>{
    const state=active;
    if(e.origin!==location.origin||!state||e.source!==state.frame.contentWindow||!e.data||e.data.channel!=='nawi-labor')return;
    if(e.data.type==='nawi-ready'){
      clearTimeout(timer);timer=null;
      state.frame.contentWindow.postMessage({channel:'nawi-labor',type:'nawi-open'},location.origin);
    }else if(e.data.type==='nawi-close')clean();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(active||opening)){e.preventDefault();abort();}});
})();
