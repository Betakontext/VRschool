/* Registrierung nach A-Frame: kueche-start ist ausschließlich im sichtbaren Küchenpanel anklickbar. */
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
        const sync = () => {
          const active = enabled();
          el.classList.toggle('link', active);
          el.classList.toggle('clickable', active);
          el.setAttribute('visible', active);
        };
        const open = (event) => {
          if (!enabled()) return;
          event?.preventDefault?.();
          window.openKuecheModule?.();
        };
        el.addEventListener('click', open);
        el.addEventListener('triggerdown', open);
        const observer = new MutationObserver(sync);
        if (panel) observer.observe(panel, {attributes:true, attributeFilter:['visible','style','class','hidden']});
        sync();
        this.remove = () => observer.disconnect();
      }
    });
  }
  if (window.AFRAME) install(); else document.addEventListener('aframe-loaded', install, {once:true});
})();
