/* Nach A-Frame laden. Verändert keine globale Cursor-Konfiguration. */
(function () {
  'use strict';

  function register() {
    if (!window.AFRAME || AFRAME.components['nawi-start']) return;

    AFRAME.registerComponent('nawi-start', {
      init: function () {
        this.lastVisible = null;
        this.el.classList.remove('clickable', 'link');

        this.onClick = () => {
          if (
            this.isPanelVisible() &&
            typeof window.openNawiLab === 'function'
          ) {
            window.openNawiLab();
          }
        };

        this.el.addEventListener('click', this.onClick);
        this.sync();
      },

      isPanelVisible: function () {
        const panel = this.el.closest('#panel-Nawi');
        if (!panel) return false;

        const visible = panel.getAttribute('visible');
        return visible === true || visible === 'true';
      },

      sync: function () {
        const visible = this.isPanelVisible();
        if (visible === this.lastVisible) return;

        this.lastVisible = visible;
        this.el.classList.toggle('clickable', visible);
        this.el.classList.toggle('link', visible);

        // Kein manueller refreshObjects()-Aufruf:
        // Der Raycaster erkennt Klassenänderungen automatisch.
      },

      tick: function () {
        this.sync();
      },

      remove: function () {
        this.el.removeEventListener('click', this.onClick);
        this.el.classList.remove('clickable', 'link');
      }
    });
  }

  if (window.AFRAME) {
    register();
  } else {
    document.addEventListener('aframe-loaded', register, { once: true });
  }
})();
