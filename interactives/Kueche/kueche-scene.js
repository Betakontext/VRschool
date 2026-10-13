/* Nach A-Frame laden: Klickklassen werden ausschließlich auf #kueche-start gesetzt. */
(function registerKuecheStart() {
  function install() {
    if (!window.AFRAME || AFRAME.components['kueche-start']) return;
    AFRAME.registerComponent('kueche-start', {
      init: function () {
        const el = this.el;
        const panel = document.getElementById('panel-Kueche');
        const enabled = () => !!panel && panel.offsetParent !== null &&
          panel.getAttribute('visible') !== 'false' && !panel.hidden &&
          getComputedStyle(panel).display !== 'none' && getComputedStyle(panel).visibility !== 'hidden';
        this.sync = () => {
          const active = enabled();
          el.classList.toggle('link', active);
          el.classList.toggle('clickable', active);
          el.setAttribute('visible', active);
        };
        this.open = (event) => {
          if (!enabled()) return;
          event?.preventDefault?.();
          window.openKuecheModule?.();
        };
        el.addEventListener('click', this.open);
        el.addEventListener('triggerdown', this.open);
        this.observer = new MutationObserver(this.sync);
        if (panel) this.observer.observe(panel, {attributes:true, attributeFilter:['visible','style','class','hidden']});
        this.sync();
      },
      remove: function () {
        this.el.removeEventListener('click', this.open);
        this.el.removeEventListener('triggerdown', this.open);
        this.observer?.disconnect();
      }
    });
  }
  if (window.AFRAME) install(); else document.addEventListener('aframe-loaded', install, {once:true});
})();
