/* defer im <head>: currentScript wird synchron bei Ausführung als Modulbasis gesichert. */
(() => {
  'use strict';
  const own = document.currentScript;
  const base = new URL('.', own ? own.src : location.href).href;
  const cssHref = new URL('kueche-loader.css', base).href;
  if (!document.querySelector(`link[data-kueche-loader-css="${cssHref}"]`)) {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssHref;
    link.dataset.kuecheLoaderCss = cssHref; document.head.appendChild(link);
  }
  let dialog = null;
  let opener = null;
  const endVR = () => { const scene = document.querySelector('a-scene'); if (scene?.is?.('vr-mode')) scene.exitVR?.(); };
  const close = () => {
    if (!dialog) return;
    const node = dialog; dialog = null;
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('message', onMessage);
    endVR(); node.remove();
    opener?.focus?.(); opener = null;
  };
  const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
  const onMessage = e => { if (e.data?.type === 'kueche-module-close') close(); };
  window.openKuecheModule = () => {
    opener = document.activeElement;
    close();
    dialog = document.createElement('div'); dialog.className = 'kueche-dialog'; dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true'); dialog.setAttribute('aria-label','Quinoa-Küchenabenteuer');
    dialog.innerHTML = '<button type="button" class="kueche-dialog__close" aria-label="Küchenspiel schließen" title="Küchenspiel schließen">×</button><iframe title="Quinoa-Küchenabenteuer" allow="fullscreen" src="'+new URL('kueche/kueche.html',base).href+'"></iframe>';
    const closeButton = dialog.querySelector('.kueche-dialog__close');
    closeButton.addEventListener('click', close);
    const frame = dialog.querySelector('iframe'); frame.addEventListener('error', close, {once:true}); frame.addEventListener('abort', close, {once:true});
    document.body.appendChild(dialog); closeButton.focus(); document.addEventListener('keydown', onKey, true); window.addEventListener('message', onMessage);
    frame.addEventListener('load', () => frame.contentWindow?.postMessage({type:'kueche-module-open'}, '*'), {once:true});
  };
  window.closeKuecheModule = close;
})();
