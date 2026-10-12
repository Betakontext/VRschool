/* Same-origin bridge; preserves original completion guard. */
(function(){'use strict';
 const send=(type,extra)=>parent.postMessage(Object.assign({type:type,channel:'nawi-labor'},extra||{}),location.origin);
 function closed(){const o=document.getElementById('nawiLabOverlay');return !o||o.getAttribute('aria-hidden')==='true'||getComputedStyle(o).display==='none';}
 function abort(){const o=document.getElementById('nawiLabOverlay'); if(o){o.style.display='none';o.setAttribute('aria-hidden','true');} send('nawi-close',{reason:'abort'});}
 const wait=()=>{ if(typeof window.openNawiLab!=='function'||typeof window.closeNawiLab!=='function'){setTimeout(wait,10);return;}
  const original=window.closeNawiLab;
  window.closeNawiLab=function(){const was=closed(), result=original.apply(this,arguments); if(!was&&closed()) send('nawi-close',{reason:'complete'}); return result;};
  send('nawi-ready');
 };
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||!e.data||e.data.channel!=='nawi-labor')return; if(e.data.type==='nawi-open')window.openNawiLab(); if(e.data.type==='nawi-abort')abort();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();abort();}});
 wait();
})();