/* Pausenhof iframe launcher: same-origin, bounded and recoverable. */
(()=>{'use strict';
 let frame=null, wrap=null, timer=0, lastFocus=null, opener=null;
 const own=document.currentScript;
 const base=own&&own.src||location.href;
 const childURL=new URL('pausenhof/pausenhof.html?v=20261106-vier-spiele', base).href;
 const cssURL=new URL('pausenhof-loader.css?v=20261106-vier-spiele', base).href;
 // Self-contained host integration: inject the sibling stylesheet once; no tour/index edit needed.
 if(![...document.styleSheets].some(s=>s.href===cssURL)){const link=document.createElement('link');link.rel='stylesheet';link.href=cssURL;link.dataset.pausenhofLoader='';(document.head||document.documentElement).append(link);}
 function focusExit(){wrap?.querySelector('.pausenhof-exit')?.focus()}
 function close(){clearTimeout(timer);timer=0; if(!wrap)return; const old=wrap; frame=null;wrap=null;old.remove();document.body.classList.remove('pausenhof-open'); lastFocus?.focus?.();}
 function failure(){if(!wrap||!frame)return;let s=wrap.querySelector('.pausenhof-status');s.innerHTML='<strong>Sport-Arena konnte nicht geladen werden.</strong><br>Prüfen Sie den Pfad <code>pausenhof/pausenhof.html</code>. <button type="button">Erneut versuchen</button>';s.hidden=false;s.querySelector('button').onclick=()=>{close();open()};focusExit()}
 function open(){if(wrap){focusExit();return} lastFocus=document.activeElement;wrap=document.createElement('div');wrap.id='pausenhofDialog';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('aria-label','Pausenhof Sport-Arena');
  const shell=document.createElement('div');shell.className='pausenhof-shell'; const status=document.createElement('div');status.className='pausenhof-status';status.textContent='Sport-Arena wird geladen …'; const x=document.createElement('button');x.className='pausenhof-exit';x.type='button';x.setAttribute('aria-label','Sport-Arena schließen');x.textContent='×';x.onclick=close;
  frame=document.createElement('iframe');frame.title='Pausenhof Sport-Arena';frame.src=childURL;frame.setAttribute('allow','');frame.setAttribute('referrerpolicy','same-origin');shell.append(frame,x,status);wrap.append(shell);document.body.append(wrap);document.body.classList.add('pausenhof-open');timer=setTimeout(failure,7000);focusExit();}
 window.openPausenhofModule=open;window.closePausenhofModule=close;window.openHofSports=open;
 window.addEventListener('message',e=>{if(e.origin!==location.origin||!frame||e.source!==frame.contentWindow||!e.data)return;if(e.data.type==='pausenhof-ready'){clearTimeout(timer);const s=wrap?.querySelector('.pausenhof-status');if(s)s.hidden=true;frame.contentWindow.postMessage({type:'pausenhof-open'},location.origin)}else if(e.data.type==='pausenhof-close')close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&wrap){e.preventDefault();close()}},true);
 // Deliberately does not create/change #pausenhof-game-button; the canonical football scene owns it.
 document.dispatchEvent(new Event('pausenhof-loader-ready'));
})();