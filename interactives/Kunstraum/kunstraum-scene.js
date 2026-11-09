/* Kunstraum scene bridge: one guarded A-Frame launch surface, without touching tour info UI. */
(() => {
  'use strict';
  const BUTTON_ID = 'kunstraum-start-button';
  let sequence = 0, loaderOpen = null;
  function visibleInAncestors(el) {
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      if (node.hasAttribute('visible') && String(node.getAttribute('visible')).toLowerCase() === 'false') return false;
      if (node.object3D && node.object3D.visible === false) return false;
    }
    return true;
  }
  function safeOpen() {
    const mine = ++sequence;
    const scene = document.querySelector('a-scene');
    const launch = () => { if (mine === sequence && typeof loaderOpen === 'function') loaderOpen(); };
    if (scene && scene.is && scene.is('vr-mode') && typeof scene.exitVR === 'function') {
      Promise.resolve(scene.exitVR()).then(launch).catch((err) => console.error('Kunstraum: VR konnte nicht beendet werden', err));
    } else launch();
  }
  function registerComponent() {
    if (!window.AFRAME || !AFRAME.registerComponent || AFRAME.components['kunstraum-start']) return false;
    AFRAME.registerComponent('kunstraum-start', { init() {
      this.onActivate = () => { if (visibleInAncestors(this.el)) safeOpen(); };
      this.el.addEventListener('click', this.onActivate);
    }, remove() { this.el.removeEventListener('click', this.onActivate); } });
    return true;
  }
  function addButton() {
    registerComponent();
    const panel = document.querySelector('#panel-Kunstraum');
    if (!panel || document.getElementById(BUTTON_ID)) return;
    const button = document.createElement('a-plane');
    button.id = BUTTON_ID;
    button.setAttribute('position', '0 -0.95 0.04');
    button.setAttribute('width', '1.8'); button.setAttribute('height', '.55');
    button.setAttribute('color', '#70464a'); button.setAttribute('material', 'shader: flat; opacity: 0.96');
    button.setAttribute('class', 'clickable link');
    button.setAttribute('kunstraum-start', '');
    button.setAttribute('aria-label', 'Kreativatelier öffnen');
    const label = document.createElement('a-text');
    label.setAttribute('value', 'Kreativatelier öffnen'); label.setAttribute('align', 'center');
    label.setAttribute('width', '1.65'); label.setAttribute('position', '0 0 0.012'); label.setAttribute('color', '#fff8ef');
    button.appendChild(label); panel.appendChild(button);
    // Use an already registered rounded-thumbnail only; never require or register it.
    if (AFRAME.components && AFRAME.components['rounded-thumbnail']) button.setAttribute('rounded-thumbnail', '');
  }
  function hookLoader() {
    const rawOpen = window.openKunstraumModule, rawClose = window.closeKunstraumModule;
    if (!rawOpen || rawOpen.__kunstraumScene) return;
    loaderOpen = rawOpen;
    function guardedOpen() { safeOpen(); }
    guardedOpen.__kunstraumScene = true;
    window.openKunstraumModule = guardedOpen;
    window.closeKunstraumModule = function () { sequence++; return rawClose && rawClose(); };
  }
  document.addEventListener('kunstraum-loader-ready', hookLoader);
  const boot = () => { addButton(); hookLoader(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
  // Supports an A-Frame scene/panel created after this head script without a permanent listener loop.
  const observer = new MutationObserver(() => { addButton(); if (document.getElementById(BUTTON_ID)) observer.disconnect(); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
