(function () {
  'use strict';

  const loaderScript = document.currentScript;
  const moduleBase = new URL('.', loaderScript.src);
  const page = new URL('werkstatt/werkstatt.html', moduleBase).href;

  let dialog = null;
  let frame = null;
  let loading = null;
  let opener = null;
  let priorOverflow = '';
  let ready = false;
  let openPending = false;
  let opening = false;
  let loadTimer = null;

  function validMessage(event) {
    return Boolean(
      frame &&
      event.source === frame.contentWindow &&
      event.origin === location.origin
    );
  }

  function closeWorkshop() {
    if (!dialog || dialog.hidden) return;

    clearTimeout(loadTimer);
    loadTimer = null;

    dialog.hidden = true;
    dialog.setAttribute('aria-hidden', 'true');

    if (frame) {
      frame.remove();
      frame = null;
    }

    ready = false;
    openPending = false;
    document.body.style.overflow = priorOverflow;

    if (opener && opener.isConnected && typeof opener.focus === 'function') {
      opener.focus();
    }

    opener = null;
  }

  function makeDialog() {
    const style = document.createElement('style');

    style.textContent = `
      #werkstattDialog {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        background: rgba(0, 0, 0, 0.72);
      }

      #werkstattDialog[hidden] {
        display: none;
      }

      #werkstattDialog:not([hidden]) {
        display: grid;
        place-items: center;
        padding: 24px;
        box-sizing: border-box;
      }

      #werkstattDialog iframe {
        position: relative;
        z-index: 1;
        display: block;
        width: 100%;
        max-width: none;
        min-width: 0;
        height: calc(100vh - 48px);
        height: calc(100dvh - 48px);
        border: 0;
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.45);
      }

      #werkstattDialog .werkstatt-exit {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 3;
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, 0.85);
        border-radius: 8px;
        color: #fff;
        background: #222;
        font: 32px/1 Arial, sans-serif;
        cursor: pointer;
      }

      #werkstattDialog .werkstatt-exit:hover {
        background: #444;
      }

      #werkstattDialog .werkstatt-exit:focus-visible {
        outline: 3px solid #ffcc00;
        outline-offset: 3px;
      }

      #werkstattDialog .werkstatt-loading {
        position: absolute;
        inset: 24px;
        z-index: 2;
        display: grid;
        place-items: center;
        padding: 20px;
        border-radius: 12px;
        color: #fff;
        background: #222;
        text-align: center;
        font: 16px/1.5 Arial, sans-serif;
        pointer-events: none;
      }

      #werkstattDialog .werkstatt-loading[hidden] {
        display: none;
      }

      @media (max-width: 600px) {
        #werkstattDialog:not([hidden]) {
          padding: 12px;
        }

        #werkstattDialog iframe {
          height: calc(100vh - 24px);
          height: calc(100dvh - 24px);
        }

        #werkstattDialog .werkstatt-loading {
          inset: 12px;
        }
      }
    `;

    document.head.appendChild(style);

    dialog = document.createElement('div');
    dialog.id = 'werkstattDialog';
    dialog.hidden = true;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-hidden', 'true');
    dialog.setAttribute('aria-label', 'Werkstattspiel');

    loading = document.createElement('div');
    loading.className = 'werkstatt-loading';
    loading.setAttribute('role', 'status');
    loading.textContent = 'Werkstattspiel wird geladen…';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'werkstatt-exit';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Werkstattspiel schließen');
    closeButton.addEventListener('click', closeWorkshop);

    dialog.append(loading, closeButton);
    document.body.appendChild(dialog);
  }

  function sendOpen() {
    if (!ready || !frame) return;

    frame.contentWindow.postMessage(
      { type: 'werkstatt-open' },
      location.origin
    );

    openPending = false;
  }

  window.openWorkshop = async function () {
    if (opening || (dialog && !dialog.hidden)) return;
    opening = true;

    try {
      const scene = document.querySelector('a-scene');

      if (
        scene &&
        typeof scene.is === 'function' &&
        scene.is('vr-mode') &&
        typeof scene.exitVR === 'function'
      ) {
        try {
          await scene.exitVR();
        } catch (error) {
          console.warn('VR konnte nicht beendet werden.', error);
        }
      }

      if (!dialog) makeDialog();

      opener = document.activeElement;
      priorOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      ready = false;
      openPending = true;

      loading.textContent = 'Werkstattspiel wird geladen…';
      loading.hidden = false;

      dialog.hidden = false;
      dialog.setAttribute('aria-hidden', 'false');

      const currentFrame = document.createElement('iframe');
      currentFrame.title = 'Werkstattspiel';
      currentFrame.allow = 'fullscreen';
      currentFrame.src = page;

      currentFrame.addEventListener('error', function () {
        if (frame !== currentFrame) return;

        clearTimeout(loadTimer);
        loading.hidden = false;
        loading.textContent =
          'Laden fehlgeschlagen. Bitte schließen und erneut versuchen.';
      });

      frame = currentFrame;

      loadTimer = setTimeout(function () {
        if (frame === currentFrame && !ready) {
          loading.textContent =
            'Das Werkstattspiel antwortet nicht. ' +
            'Bitte schließen und erneut versuchen.';
        }
      }, 15000);

      dialog.appendChild(currentFrame);
      dialog.querySelector('.werkstatt-exit').focus();
    } finally {
      opening = false;
    }
  };

  window.addEventListener('message', function (event) {
    if (!validMessage(event) || !event.data) return;

    if (event.data.type === 'werkstatt-ready') {
      ready = true;
      clearTimeout(loadTimer);
      loadTimer = null;

      if (loading) loading.hidden = true;
      if (openPending) sendOpen();
    } else if (event.data.type === 'werkstatt-close') {
      closeWorkshop();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && dialog && !dialog.hidden) {
      event.preventDefault();
      closeWorkshop();
    }
  });

  document.addEventListener('click', function (event) {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest('[data-open-workshop]');

    if (button) {
      event.preventDefault();
      window.openWorkshop();
    }
  });
})();
