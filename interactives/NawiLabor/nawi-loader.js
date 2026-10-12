/* Nawi iframe loader: same-origin, accessible and repeat-safe. */
(function(){'use strict';let active=null;let savedOverflow='';let opener=null;let timer=null;

// Stylesheet relativ zur Loader-Datei automatisch laden.
const stylesheetId = 'nawi-loader-styles';

if (!document.getElementById(stylesheetId)) {
  const stylesheet = document.createElement('link');
  stylesheet.id = stylesheetId;
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL(
    './nawi-loader.css',
    document.currentScript.src
  ).href;
  document.head.appendChild(stylesheet);
}

// Modulpfad während der Ausführung des Loader-Scripts speichern.
const loaderScript = document.currentScript;
const moduleBase = new URL(
  '.',
  loaderScript.src
);

function base() {
  return moduleBase;
}

function clean(reason) {
  if (!active) return;
  clearTimeout(timer);
  timer = null;

  const frame = active;
  const dialog = frame.closest('.nawi-frame-dialog');
  active = null;

  if (dialog) dialog.remove();
  else frame.remove();

  document.body.style.overflow = savedOverflow;
  if (opener && opener.focus) opener.focus();
  opener = null;
}

function abort(){if(active&&active.contentWindow)active.contentWindow.postMessage({channel:'nawi-labor',type:'nawi-abort'},location.origin)}
function openNawiLab(){if(active)return;const scene=document.querySelector('a-scene');if(scene&&scene.is&&scene.is('vr-mode')&&scene.exitVR)scene.exitVR();opener=document.activeElement;savedOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
 const dialog=document.createElement('div');dialog.className='nawi-frame-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Nawi-Labor');
 const close=document.createElement('button');close.type='button';close.className='nawi-frame-abort';close.textContent='Labor abbrechen';close.setAttribute('aria-label','Labor abbrechen (Fortschritt wird verworfen)');
 const frame=document.createElement('iframe');frame.title='Nawi-Labor';frame.className='nawi-frame';frame.src=new URL('nawi/nawi.html',base()).href;frame.setAttribute('allow','fullscreen');
 close.addEventListener('click',abort);dialog.append(close,frame);document.body.append(dialog);active=frame;close.focus();
 frame.addEventListener('error',()=>{alert('Das Nawi-Labor konnte nicht geladen werden.');clean('load-error')});
 timer=setTimeout(()=>{if(active===frame){alert('Das Nawi-Labor antwortet nicht.');clean('timeout')}},12000);
}
window.openNawiLab=openNawiLab;
window.addEventListener('message',e=>{if(e.origin!==location.origin||!active||e.source!==active.contentWindow||!e.data||e.data.channel!=='nawi-labor')return;if(e.data.type==='nawi-ready'){clearTimeout(timer);active.contentWindow.postMessage({channel:'nawi-labor',type:'nawi-open'},location.origin)}else if(e.data.type==='nawi-close')clean(e.data.reason)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();abort();}});
})();
