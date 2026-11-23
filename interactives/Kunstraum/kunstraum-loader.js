/* defer im <head>: currentScript wird synchron bei Ausführung als Modulbasis gesichert. */
(() => {
  'use strict';
  const own = document.currentScript;
  const base = new URL('.', own ? own.src : location.href).href;
  const cssHref = new URL('kunstraum-loader.css', base).href;
  if (!document.querySelector(`link[data-kunstraum-loader-css="${cssHref}"]`)) {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssHref;
    link.dataset.kunstraumLoaderCss = cssHref; document.head.appendChild(link);
  }
  let dialog = null;
  let opener = null;
  let pausedScene = null;
  let previousBodyOverflow = null;
  const endVR = () => { const scene = document.querySelector('a-scene'); if (scene?.is?.('vr-mode')) scene.exitVR?.(); };
  const close = () => {
    if (!dialog) return;
    const node = dialog; dialog = null;
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('message', onMessage);
    endVR(); node.remove();
    if(previousBodyOverflow !== null){document.body.style.overflow=previousBodyOverflow;previousBodyOverflow=null;}
    if (pausedScene) { pausedScene.play?.(); pausedScene = null; }
    opener?.focus?.(); opener = null;
  };
  const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
  const onMessage = e => { if (e.origin === location.origin && e.source === dialog?.querySelector('iframe')?.contentWindow && e.data?.type === 'kunstraum-module-close') close(); };
  window.openKunstraumModule = () => {
    opener = document.activeElement;
    close();
    pausedScene = document.querySelector('a-scene'); pausedScene?.pause?.();
    previousBodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    dialog = document.createElement('div'); dialog.className = 'kunstraum-dialog'; dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true'); dialog.setAttribute('aria-label','Quinoa-Kunstatelier');
    dialog.innerHTML = '<button type="button" class="kunstraum-dialog__close" aria-label="Kunstraum schließen" title="Kunstraum schließen">×</button><iframe title="Quinoa-Kunstatelier" allow="fullscreen" src="'+new URL('kunstraum/kunstraum.html?v=realism3',base).href+'"></iframe>';
    const closeButton = dialog.querySelector('.kunstraum-dialog__close');
    closeButton.addEventListener('click', close);
    const frame = dialog.querySelector('iframe'); frame.addEventListener('error', close, {once:true}); frame.addEventListener('abort', close, {once:true});
    document.body.appendChild(dialog); closeButton.focus(); document.addEventListener('keydown', onKey, true); window.addEventListener('message', onMessage);
    frame.addEventListener('load', () => frame.contentWindow?.postMessage({type:'kunstraum-module-open'}, '*'), {once:true});
  };
  window.closeKunstraumModule = close;
})();

window.openArtStudio = window.openKunstraumModule;
window.closeArtStudio = window.closeKunstraumModule;

