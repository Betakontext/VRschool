/* Same-origin, bounded Kunstraum iframe launcher. */
(() => { 'use strict';
  let frame, wrap, timer = 0, pingTimer = 0, lastFocus, previousOverflow, nonce = 0;
  const script = document.currentScript;
  const base = (script && script.src) || location.href;
  const childURL = new URL('kunstraum/kunstraum.html', base);
  const cssURL = new URL('kunstraum-loader.css', base).href;
  if (!document.querySelector('link[data-kunstraum-loader]')) { const link=document.createElement('link'); link.rel='stylesheet'; link.href=cssURL; link.dataset.kunstraumLoader=''; (document.head||document.documentElement).appendChild(link); }
  const validSource = (event) => frame && event.origin === location.origin && event.source === frame.contentWindow && frame.src && new URL(frame.src, location.href).origin === childURL.origin && new URL(frame.src, location.href).pathname === childURL.pathname;
  const exit = () => wrap && wrap.querySelector('.kunstraum-exit');
  function restoreFocus() { if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); }
  function close() { nonce++; clearTimeout(timer); clearInterval(pingTimer); timer=pingTimer=0; if (!wrap) return; const old=wrap; frame=undefined; wrap=undefined; old.remove(); document.body.style.overflow=previousOverflow || ''; restoreFocus(); }
  function failure() { if (!wrap || !frame) return; const status=wrap.querySelector('.kunstraum-status'); status.innerHTML='<strong>Das Kreativatelier konnte nicht geladen werden.</strong><br>Prüfen Sie den lokalen Pfad <code>kunstraum/kunstraum.html</code>. <button type="button">Erneut versuchen</button>'; status.hidden=false; status.querySelector('button').onclick=() => { close(); open(); }; exit().focus(); }
  function focusFrame() { frame && frame.focus(); }
  function open() { if (wrap) { exit().focus(); return; } const id=++nonce; lastFocus=document.activeElement; previousOverflow=document.body.style.overflow; document.body.style.overflow='hidden';
    wrap=document.createElement('div'); wrap.id='kunstraumDialog'; wrap.setAttribute('role','dialog'); wrap.setAttribute('aria-modal','true'); wrap.setAttribute('aria-label','Kunstraum: Kreativatelier');
    const shell=document.createElement('div'); shell.className='kunstraum-shell'; const status=document.createElement('div'); status.className='kunstraum-status'; status.textContent='Kreativatelier wird geladen …';
    const x=document.createElement('button'); x.type='button'; x.className='kunstraum-exit'; x.setAttribute('aria-label','Kreativatelier schließen'); x.textContent='×'; x.onclick=close;
    frame=document.createElement('iframe'); frame.title='Kunstraum – Kreativatelier'; frame.src=childURL.href; frame.setAttribute('referrerpolicy','same-origin'); frame.onload=() => { if (id===nonce) frame.contentWindow.postMessage({type:'kunstraum-ping'}, location.origin); };
    shell.append(frame,x,status); wrap.appendChild(shell); document.body.appendChild(wrap); timer=setTimeout(failure,7000); pingTimer=setInterval(() => { if (id===nonce && frame) frame.contentWindow.postMessage({type:'kunstraum-ping'}, location.origin); },300); x.focus();
  }
  window.openKunstraumModule=open; window.closeKunstraumModule=close;
  window.addEventListener('message',(event) => { if (!validSource(event) || !event.data) return; if (event.data.type==='kunstraum-ready') { clearTimeout(timer); clearInterval(pingTimer); timer=pingTimer=0; const s=wrap && wrap.querySelector('.kunstraum-status'); if(s)s.hidden=true; frame.contentWindow.postMessage({type:'kunstraum-open'},location.origin); } else if(event.data.type==='kunstraum-close') close(); else if(event.data.type==='kunstraum-focus-boundary') (event.data.edge==='first' ? exit() : focusFrame()).focus(); });
  document.addEventListener('keydown',(event) => { if (!wrap) return; if(event.key==='Escape'){event.preventDefault();close();return;} if(event.key==='Tab' && document.activeElement===exit() && !event.shiftKey){event.preventDefault();focusFrame();} },true);
  document.dispatchEvent(new Event('kunstraum-loader-ready'));
})();
