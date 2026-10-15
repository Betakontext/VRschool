/* Bibliothek: Start nur im sichtbaren Panel. */
(function () {
  if (!window.AFRAME) { console.warn('bibliothek-start benötigt A-Frame.'); return; }
  AFRAME.registerComponent('bibliothek-start', {
    init: function () {
      this.panel = document.getElementById('panel-Bibliothek');
      this.sync = this.sync.bind(this); this.open = this.open.bind(this);
      this.el.addEventListener('click', this.open);
      this.el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') this.open(e); }.bind(this));
      if (this.panel) { this.panel.addEventListener('componentchanged', this.sync); this.panel.addEventListener('attributechanged', this.sync); }
      this.sync();
    },
    sync: function () {
      var shown = !!(this.panel && this.panel.getAttribute('visible'));
      this.el.classList.toggle('link', shown); this.el.classList.toggle('clickable', shown);
      this.el.setAttribute('visible', shown); this.el.setAttribute('aria-disabled', String(!shown));
    },
    open: function (e) { if (e) { e.preventDefault(); e.stopPropagation(); } if (this.panel && this.panel.getAttribute('visible') && window.openBibliothekModule) window.openBibliothekModule(); },
    remove: function () { this.el.removeEventListener('click', this.open); if(this.panel){this.panel.removeEventListener('componentchanged',this.sync);this.panel.removeEventListener('attributechanged',this.sync);} }
  });
}());