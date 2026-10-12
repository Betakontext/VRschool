/* Verbindet den Werkstatt-Button in A-Frame mit dem Spiel-Loader. */
AFRAME.registerComponent('werkstatt-start', {
  init() {
    this.panel = this.el.closest('#panel-Werkstatt');
    this.active = null;

    this.onClick = (event) => {
      event.stopPropagation();

      if (!this.isAvailable()) return;

      if (typeof window.openWorkshop !== 'function') {
        console.error(
          'Werkstatt-Loader fehlt: openWorkshop() ist nicht verfügbar.'
        );
        return;
      }

      window.openWorkshop();
    };

    this.el.addEventListener('click', this.onClick);
  },

  isAvailable() {
    return Boolean(
      this.panel &&
      this.panel.getAttribute('visible') === true &&
      this.el.sceneEl.dataset.fading !== '1'
    );
  },

  tick() {
    const available = this.isAvailable();
    if (available === this.active) return;

    this.active = available;

    // Unsichtbare Buttons dürfen keine Cursor-Ziele bleiben.
    this.el.classList.toggle('clickable', available);
    this.el.classList.toggle('link', available);

    // Nach dem Raumwechsel auch eine mögliche Hover-Skalierung zurücksetzen.
    if (!available) this.el.setAttribute('scale', '1 1 1');
  },

  remove() {
    this.el.removeEventListener('click', this.onClick);
    this.el.classList.remove('clickable', 'link');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  const cursor = document.getElementById('tour-cursor');
  if (!scene || !cursor) return;

  const configureCursor = (vr) => {
    cursor.setAttribute('cursor', {
      rayOrigin: vr ? 'entity' : 'mouse',
      fuse: vr,
      fuseTimeout: 900
    });
    cursor.setAttribute('visible', vr);
  };

  scene.addEventListener('enter-vr', () => configureCursor(true));
  scene.addEventListener('exit-vr', () => configureCursor(false));
  configureCursor(scene.is('vr-mode'));
});

