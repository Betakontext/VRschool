/* Iframe-Overlay für das isolierte Bibliotheks-Spiel. */
(function () {
  var script = document.currentScript;
  /* Loader: .../interactives/Bibliothek/bibliothek-loader.js
     Iframe: .../interactives/Bibliothek/bibliothek/bibliothek.html */
  var gameUrl = new URL('bibliothek/bibliothek.html', script.src).href;
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('bibliothek-loader.css', script.src).href;
  document.head.appendChild(css);
  var dialog;
  function cleanup() { if (!dialog) return; window.removeEventListener('message', receive); document.removeEventListener('keydown', esc); dialog.remove(); dialog = null; }
  function receive(e) { if (e.origin === location.origin && e.data && e.data.type === 'bibliothek-close') cleanup(); }
  function esc(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
  function close() { if (dialog && dialog.querySelector('iframe').contentWindow) dialog.querySelector('iframe').contentWindow.postMessage({type:'bibliothek-request-close'}, location.origin); setTimeout(cleanup, 80); }
  function open() { if (dialog) return; dialog = document.createElement('div'); dialog.className = 'bibliothek-module-overlay'; dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.innerHTML = '<button class="bibliothek-module-close" type="button" aria-label="Bibliothek schließen">×</button><iframe title="Quinoa Bibliothek – Escape-Abenteuer" src="' + gameUrl + '"></iframe>'; dialog.querySelector('button').onclick = close; document.body.appendChild(dialog); window.addEventListener('message', receive); document.addEventListener('keydown', esc); }
  window.openBibliothekModule = open; window.closeBibliothekModule = close;
}());
