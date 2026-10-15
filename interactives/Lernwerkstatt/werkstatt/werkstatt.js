// ===== WERKSTATT MODUL – KONSOLIDIERTE SPIELLOGIK =====
(function () {
  'use strict';

  // Verhindert doppelte Initialisierung bei mehrfacher Einbindung.
  if (window.__werkstattGameInstalled) return;
  window.__werkstattGameInstalled = true;

  const $ = id => document.getElementById(id);
  const root = () => $('workshopOverlay');
  const all = selector => [...(root()?.querySelectorAll(selector) || [])];
  const find = selector => root()?.querySelector(selector) || null;

  const timers = new Set();
  const intervals = new Set();
  const cancelInteractions = new Set();

  let initialized = false;
  let activeWorkshopHand = null;
  let statusTimer = null;
  let hintTimer = null;
  let guideKey = '';
  let quizBusy = false;
  let priorOverflow = '';
  let opener = null;
  let printJob = null;
  let screwJob = null;
  let tapeJob = null;

  const bitHomes = new Map();

  const createState = () => ({
    goggles: false,
    ears: false,
    project: null,
    done: {
      wood: false,
      screw: false,
      print: false,
      assemble: false
    },
    cutLength: 0,
    tapeReady: false,
    tapeRetracted: false,
    ruler: false,
    rulerParked: false,
    pencilParked: false,
    markCount: 0,
    sawStopReady: false,
    stopGuideX: 0,
    stopAside: false,
    sawOn: false,
    boardAligned: false,
    cut: 0,
    wasteStored: false,
    sandCount: 0,
    bit: null,
    screws: 0,
    currentScrewAngle: 0,
    model: null,
    color: null,
    material: null,
    quality: null,
    printing: false,
    printReady: false,
    placed: 0,
    montageStep: 0,
    dowels: 0,
    hammerHits: 0,
    puzzleFinished: false,
    quiz: 0
  });

  const ws = createState();

  const quiz = [
    {
      q: 'Warum muss die Säge fest montiert sein?',
      a: [
        'Damit die Maschine sicher steht und das Werkstück kontrolliert bearbeitet werden kann',
        'Damit man sie während des Sägens herumtragen kann',
        'Nur wegen der Farbe'
      ],
      c: 0
    },
    {
      q: 'Was muss vor dem Sägen passieren?',
      a: [
        'Messen, markieren und Werkzeuge sicher ablegen',
        'Direkt sägen',
        'Erst schrauben'
      ],
      c: 0
    },
    {
      q: 'Welcher Bit passt zu einer Kreuzschraube?',
      a: ['Schlitz', 'Kreuz', 'Inbus'],
      c: 1
    },
    {
      q: 'Was zeigt eine glatt geschliffene Kante?',
      a: ['Splitter sind entfernt', 'Holz ist nass', 'Schrauben fehlen'],
      c: 0
    }
  ];

  const models = {
    tag: ['Namensschild', 'modelTag', 125, 30],
    logo: ['3D-Logo', 'modelLogo', 78, 72],
    gear: ['Zahnrad', 'modelGear', 78, 78],
    hook: ['Werkzeughaken', 'modelHook', 60, 88],
    star: ['Quinoa-Stern', 'modelStar', 82, 80],
    keychain: ['Schlüsselanhänger', 'modelKeychain', 108, 40],
    stand: ['Handyhalter', 'modelStand', 86, 82],
    cube: ['3D-Würfel', 'modelCube', 78, 78],
    rocket: ['Mini-Rakete', 'modelRocket', 62, 94],
    medal: ['Werkstatt-Medaille', 'modelMedal', 78, 78],
    robot: ['Mini-Roboter', 'modelRobot', 72, 82],
    molecule: ['Molekül-Modell', 'modelMolecule', 62, 62],
    trophy: ['Quinoa-Pokal', 'modelTrophy', 70, 86]
  };

  const colors = {
    green: '#16a34a',
    orange: '#f59e0b',
    red: '#dc2626',
    purple: '#7c3aed',
    white: '#f8fafc',
    black: '#111827',
    blue: '#2563eb'
  };

  const qualities = {
    fine: { label: 'Fein · 0,12 mm', seconds: 55, layers: 320 },
    normal: { label: 'Standard · 0,20 mm', seconds: 42, layers: 220 },
    draft: { label: 'Schnell · 0,28 mm', seconds: 30, layers: 140 }
  };

  function later(fn, ms) {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  }

  function every(fn, ms) {
    const id = setInterval(fn, ms);
    intervals.add(id);
    return id;
  }

  function stopTimeout(id) {
    if (id == null) return;
    clearTimeout(id);
    timers.delete(id);
  }

  function stopInterval(id) {
    if (id == null) return;
    clearInterval(id);
    intervals.delete(id);
  }

  function clearJobs() {
    timers.forEach(clearTimeout);
    intervals.forEach(clearInterval);
    timers.clear();
    intervals.clear();
    statusTimer = null;
    hintTimer = null;
    printJob = null;
    screwJob = null;
    tapeJob = null;
    quizBusy = false;
  }

  function visible() {
    const o = root();
    return !!o && o.style.display === 'block';
  }

  function text(id, value) {
    const e = $(id);
    if (e) e.textContent = value;
  }

  function cls(id, names, on) {
    const e = $(id);
    if (!e) return;
    names.split(' ').filter(Boolean).forEach(name => {
      e.classList.toggle(name, on);
    });
  }

  function style(id, property, value, priority = '') {
    $(id)?.style.setProperty(property, value, priority);
  }

  function removeStyle(id, properties) {
    const e = $(id);
    if (!e) return;
    properties.forEach(p => e.style.removeProperty(p));
  }

  function overlap(a, b, margin = 0) {
    return !(
      a.right < b.left - margin ||
      a.left > b.right + margin ||
      a.bottom < b.top - margin ||
      a.top > b.bottom + margin
    );
  }

  function steps(value) {
    text('wsSteps', value);
  }

  function woodStage(n) {
    all('#woodStageBar span').forEach(e => {
      const value = Number(e.dataset.stage);
      e.classList.toggle('active', value === n);
      e.classList.toggle('done', value < n);
    });
  }

  function clearGuides() {
    all('.ws-guided').forEach(e => e.classList.remove('ws-guided'));
    $('wsActionHint')?.classList.remove(
      'show', 'below', 'side-right', 'side-left', 'tape-high'
    );
    stopTimeout(hintTimer);
    hintTimer = null;
  }

  function guideTargetFor(value) {
    const s = value.toLowerCase();
    const rules = [
      ['schutzbrille anziehen', '#wsGoggles'],
      ['gehörschutz anziehen', '#wsEars'],
      ['maßband', '#tapeHook'],
      ['lineal aus', '#wsRuler'],
      ['lineal in', '#wsRuler'],
      ['bleistift', '#wsPencil'],
      ['werkzeuge ordentlich', '.tool-cup'],
      ['längenanschlag', '#sawStopSlider'],
      ['anschlaghaken', '#wsBoard'],
      ['sägekopf', '#circularSaw'],
      ['säge ausschalten', '#sawSwitch'],
      ['anschlag mit der hand', '#sawStopSystem'],
      ['restholz', '#wastePiece'],
      ['schleifklotz', '#sandBlockV32'],
      ['kreuz-bit', '#bitDropZone'],
      ['akkuschrauber', '#wsDriver'],
      ['holzdübel', '.dowel-hole:not(.filled)'],
      ['holzleim', '#toolGlue'],
      ['gummihammer', '#toolHammer'],
      ['anschlagwinkel', '#toolAngle'],
      ['festgespannt', '#toolClamp'],
      ['druck starten', '#wsPrintStart'],
      ['entnahme', '#wsPrintTake']
    ];
    return rules.find(([needle]) => s.includes(needle))?.[1] || '';
  }

  function placeActionHint(h, target, value) {
    if (!h || !target || !root()) return;

    const low = value.toLowerCase();
    if (
      low.includes('restholz') ||
      low.includes('zurücklegen') ||
      low.includes('schnitt fertig') ||
      low.includes('anschlag mit der hand')
    ) {
      h.classList.remove('show');
      return;
    }

    if (target.id === 'tapeHook' && (ws.ruler || ws.markCount > 0)) {
      h.classList.remove('show');
      return;
    }

    const r = target.getBoundingClientRect();
    const o = root().getBoundingClientRect();

    h.classList.remove('below', 'side-right', 'side-left', 'tape-high');

    const labels = [
      ['länge auswählen', 'LÄNGE WÄHLEN'],
      ['lineal', 'LINEAL ANLEGEN'],
      ['bleistift', 'ROT MARKIEREN'],
      ['anschlag auf', 'ANSCHLAG EINSTELLEN'],
      ['brett', 'BRETT ANLEGEN'],
      ['einschalten', 'SÄGE EIN'],
      ['ausschalten', 'SÄGE AUS'],
      ['säge am griff', 'SÄGE LANGSAM SENKEN']
    ];

    h.textContent = target.id === 'tapeHook'
      ? `MAẞBAND BIS ${ws.cutLength || 'ZIEL'} CM ZIEHEN`
      : labels.find(([needle]) => low.includes(needle))?.[1] || value;

    const edge = Math.min(145, o.width / 2);
    const x = r.left - o.left + r.width / 2;
    h.style.left = Math.max(edge, Math.min(o.width - edge, x)) + 'px';

    const offset = target.id === 'sawStopSlider'
      ? 64
      : target.id === 'tapeHook' ? 48 : 8;

    h.style.top = Math.max(8, r.top - o.top - offset) + 'px';
    h.classList.add('show');

    stopTimeout(hintTimer);
    hintTimer = later(() => h.classList.remove('show'), 5000);
  }

  function status(value) {
    const e = $('wsStatus');
    if (!e) return;

    stopTimeout(statusTimer);
    clearGuides();

    e.textContent = value;
    e.classList.remove('auto-hidden');

    const selector = guideTargetFor(value);
    const target = selector ? find(selector) : null;

    if (
      target?.getClientRects().length &&
      getComputedStyle(target).visibility !== 'hidden'
    ) {
      target.classList.add('ws-guided');
      placeActionHint($('wsActionHint'), target, value);
    }

    statusTimer = later(() => {
      e.classList.add('auto-hidden');
      clearGuides();
    }, 4200);
  }

  function sawIsUp() {
    return (parseFloat($('circularSaw')?.style.top) || 22) <= 35;
  }

  function currentWoodStep() {
    if (!ws.cutLength) return ['length', '#cutLengthPicker', '1. Gewünschte Länge auswählen'];
    if (!ws.tapeReady) return ['tape', '#tapeHook', `2. Maßband bis ${ws.cutLength} cm herausziehen`];
    if (!ws.ruler) return ['ruler', '#wsRuler', '3. Lineal aus dem Becher an die blaue Hilfe legen'];
    if (ws.markCount < 20) return ['pencil', '#wsPencil', '4. Mit dem Bleistift entlang des Lineals markieren'];
    if (!ws.rulerParked || !ws.pencilParked) return ['cup', '.tool-cup', '5. Lineal und Bleistift zurücklegen'];
    if (!ws.sawStopReady) return ['stop', '#sawStopSlider', `6. Sägeanschlag auf ${ws.cutLength} cm einstellen`];
    if (!ws.boardAligned) return ['board', '#wsBoard', '7. Brett bei ausgeschalteter Säge anlegen'];
    if (ws.cut < 100 && !ws.sawOn) return ['on', '#sawSwitch', '8. Säge einschalten'];
    if (ws.cut < 100) return ['cut', '#circularSaw', '9. Säge am Griff langsam senken'];
    if (!sawIsUp()) return ['raise', '#circularSaw', '10. Sägekopf nach oben führen'];
    if (ws.sawOn) return ['off', '#sawSwitch', '11. Säge ausschalten'];
    if (!ws.stopAside) return ['aside', '#sawStopSystem', '12. Anschlag mit der Hand nach links schieben'];
    if (!ws.wasteStored) return ['waste', '#wastePiece', '13. Restholz ins Regal legen'];
    return ['finished', '#wsBoard', '14. Fertiges Holz zur Schleifstation bringen'];
  }

  function updateWoodStationGuide(force = false) {
    if (!$('wsWoodPanel')?.classList.contains('show')) {
      guideKey = '';
      return;
    }

    const [key, selector, value] = currentWoodStep();
    if (!force && key === guideKey) return;

    guideKey = key;
    clearGuides();

    const target = find(selector);
    if (!target?.getClientRects().length) return;
    target.classList.add('ws-guided');
    placeActionHint($('wsActionHint'), target, value);
  }

  function updateEssentialWoodHint() {
    const h = $('essentialWoodHint');
    if (!h) return;

    if (!$('wsWoodPanel')?.classList.contains('show')) {
      h.className = 'essential-wood-hint';
      return;
    }

    const [key] = currentWoodStep();
    const messages = {
      length: ['tape', 'ZUERST LÄNGE WÄHLEN – DANN AM MAẞBAND ZIEHEN'],
      tape: ['tape', `AM MAẞBAND ZIEHEN – BIS ${ws.cutLength} CM`],
      ruler: ['mark', 'LINEAL AN DIE BLAUE HILFE LEGEN'],
      pencil: ['mark', 'MIT DEM STIFT ROT MARKIEREN'],
      cup: ['cup', 'LINEAL UND STIFT ZURÜCK IN DEN BECHER'],
      stop: ['stop', `SÄGEANSCHLAG AUF ${ws.cutLength} CM EINSTELLEN`],
      board: ['align', 'SÄGE AUS LASSEN · HOLZ AM ANSCHLAG EINRASTEN'],
      on: ['power', 'HOLZ EINGERASTET · SÄGE EINSCHALTEN'],
      cut: ['cut', `SÄGE LANGSAM SENKEN · ${Math.round(ws.cut)} %`],
      raise: ['raise', 'SÄGEKOPF NACH OBEN FÜHREN'],
      off: ['poweroff', 'SÄGEKOPF OBEN · SÄGE AUSSCHALTEN']
    };

    const message = messages[key];
    if (!message) {
      h.className = 'essential-wood-hint';
      return;
    }

    h.className = `essential-wood-hint ${message[0]} show`;
    h.textContent = message[1];

    if (key === 'pencil') {
      const g = $('markGuide')?.getBoundingClientRect();
      const a = $('woodArea')?.getBoundingClientRect();
      if (g && a) {
        h.style.left = Math.max(8, Math.min(a.width - 150, g.left - a.left + 24)) + 'px';
      }
    }
  }

  function startUiLoop() {
    every(() => {
      if (!visible()) return;
      updateWoodStationGuide();
      updateEssentialWoodHint();
      root()?.classList.toggle(
        'marking-in-progress',
        ws.tapeReady && (!ws.rulerParked || !ws.pencilParked)
      );
      text('assemblyMissionCount', `${ws.placed} / 4`);
    }, 150);
  }

  function pointWorkshopArm(x, y) {
    const o = root();
    if (!o) return;
    const r = o.getBoundingClientRect();
    const left = activeWorkshopHand
      ? activeWorkshopHand === 'left'
      : x < r.left + r.width / 2;

    const arm = $(left ? 'wsArmLeft' : 'wsArmRight');
    const other = $(left ? 'wsArmRight' : 'wsArmLeft');
    if (!arm) return;

    const sx = r.width * (left ? 0.37 : 0.63);
    const sy = r.height * 0.91;
    const dx = x - r.left - sx;
    const dy = y - r.top - sy;
    const length = Math.max(150, Math.min(430, Math.hypot(dx, dy)));
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    arm.classList.add('grabbing');
    arm.classList.remove('resting');
    arm.style.width = length + 'px';
    arm.style.top = (sy - 26) + 'px';
    arm.style.left = (left ? sx : sx - length) + 'px';
    arm.style.right = 'auto';
    arm.style.transform = `rotate(${left ? angle : angle + 180}deg)`;

    if (other) {
      other.classList.remove('grabbing');
      other.classList.add('resting');
      other.style.cssText = '';
    }
  }

  function resetWorkshopArms() {
    activeWorkshopHand = null;
    ['wsArmLeft', 'wsArmRight'].forEach(id => {
      const e = $(id);
      if (!e) return;
      e.classList.remove('grabbing');
      e.classList.add('resting');
      e.style.cssText = '';
    });
  }

  function showHand(hand, x, y) {
    if (hand) {
      const p = hand.offsetParent || root();
      const r = p?.getBoundingClientRect() || { left: 0, top: 0 };
      hand.classList.add('show');
      hand.style.left = (x - r.left - 95) + 'px';
      hand.style.top = (y - r.top - 22) + 'px';
    }
    pointWorkshopArm(x, y);
  }

  function hideHands() {
    all('.ws-hand').forEach(e => e.classList.remove('show'));
    resetWorkshopArms();
  }

  // Eine Drag-Steuerung pro Element, inklusive Abbruchbehandlung.
  function drag(el, area, move, drop, hand, options = {}) {
    if (!el || !area || el.dataset.wsDragBound) return;
    el.dataset.wsDragBound = '1';
    el.style.touchAction = 'none';

    let pointer = null;
    let dx = 0;
    let dy = 0;

    function finish(e, cancelled = false) {
      if (pointer === null) return;
      if (e && e.pointerId !== pointer) return;

      const id = pointer;
      pointer = null;

      try {
        if (el.hasPointerCapture(id)) el.releasePointerCapture(id);
      } catch (_) {}

      el.classList.remove(
        'dragging', 'dragging-bit', 'dragging-saw', 'dragging-driver'
      );
      hideHands();

      if (cancelled) options.cancel?.();
      else drop?.(e, el);
    }

    cancelInteractions.add(() => finish(null, true));

    el.addEventListener('pointerdown', e => {
      if (!visible() || pointer !== null || e.button > 0) return;
      if (options.guard && !options.guard(e, el)) return;

      if (el.classList.contains('part') && el.classList.contains('placed')) return;

      if (el.id === 'wastePiece' && (
        ws.sawOn || ws.cut < 100 || !ws.stopAside ||
        !sawIsUp() || ws.wasteStored
      )) {
        status('Restholz erst nach vollständigem Schnitt, angehobenem Sägekopf, AUS und weggerücktem Anschlag anfassen.');
        return;
      }

      if (el.id === 'wsBoard' && (
        ws.sawOn || (ws.cut > 0 && ws.cut < 100)
      )) {
        status('Das Brett darf während des Sägens nicht bewegt werden.');
        return;
      }

      if (el.id === 'wsBoard' && ws.cut >= 100) return;

      if (el.id === 'wsBoard' && (
        !ws.sawStopReady || ws.markCount < 20 ||
        !ws.rulerParked || !ws.pencilParked
      )) {
        status('Zuerst markieren, Werkzeuge ablegen und Längenanschlag einstellen.');
        return;
      }

      if (el.id === 'circularSaw' && (!ws.boardAligned || (
        !ws.sawOn && ws.cut === 0
      ))) {
        status('Brett zuerst bei AUS ausrichten und die Säge einschalten.');
        return;
      }

      e.preventDefault();
      pointer = e.pointerId;
      activeWorkshopHand = el.id === 'wsPencil'
        ? 'right'
        : e.clientX < root().getBoundingClientRect().left +
          root().getBoundingClientRect().width / 2 ? 'left' : 'right';

      const a = area.getBoundingClientRect();
      const before = el.getBoundingClientRect();

      if (el.classList.contains('bit-piece')) {
        area.appendChild(el);
        el.style.position = 'absolute';
      }

      if (el.classList.contains('in-cup')) {
        el.classList.remove('in-cup', 'parked');
      }

      // Alte parallele CSS-Translations ausschalten.
      if (el.id === 'sandBlockV32') {
        el.style.setProperty('--sand-x', '0px');
        el.style.setProperty('--sand-y', '0px');
      }
      if (el.id === 'wsDriver') {
        el.style.setProperty('--driver-x', '0px');
        el.style.setProperty('--driver-y', '0px');
      }

      el.style.setProperty('left', (before.left - a.left) + 'px', 'important');
      el.style.setProperty('top', (before.top - a.top) + 'px', 'important');
      el.style.setProperty('right', 'auto', 'important');
      el.style.setProperty('bottom', 'auto', 'important');

      if (el.id === 'wsPencil') {
        el.classList.add('right-hand-pencil');
        el.style.setProperty('transform', 'rotate(8deg)', 'important');
      }

      if (el.id === 'wsRuler') ws.rulerParked = false;
      if (el.id === 'wsPencil') ws.pencilParked = false;
      if (el.id === 'wsBoard') {
        ws.boardAligned = false;
        el.classList.remove('stop-snapped');
      }

      const r = el.getBoundingClientRect();
      dx = e.clientX - r.left;
      dy = e.clientY - r.top;

      try {
        el.setPointerCapture(pointer);
      } catch (_) {}

      el.classList.add('dragging');
      if (el.classList.contains('bit-piece')) el.classList.add('dragging-bit');
      if (el.id === 'circularSaw') el.classList.add('dragging-saw');
      if (el.id === 'wsDriver') el.classList.add('dragging-driver');

      options.start?.(e, el);
      showHand(hand, e.clientX, e.clientY);
    });

    el.addEventListener('pointermove', e => {
      if (e.pointerId !== pointer) return;
      e.preventDefault();

      const a = area.getBoundingClientRect();
      let x = e.clientX - a.left - dx;
      let y = e.clientY - a.top - dy;

      if (options.constrain) {
        x = Math.max(0, Math.min(a.width - el.offsetWidth, x));
        y = Math.max(0, Math.min(a.height - el.offsetHeight, y));
      }

      if (el.id === 'circularSaw') {
        y = Math.max(22, Math.min(150, y));
      } else if (el.id === 'wsBoard') {
        y = 125;
      }

      if (el.id !== 'circularSaw') {
        el.style.setProperty('left', x + 'px', 'important');
      }
      el.style.setProperty('top', y + 'px', 'important');

      showHand(hand, e.clientX, e.clientY);
      move?.(e, el, a);
    });

    el.addEventListener('pointerup', e => finish(e));
    el.addEventListener('pointercancel', e => finish(e, true));
    el.addEventListener('lostpointercapture', e => finish(e, true));
  }

  function cancelAllInteractions() {
    cancelInteractions.forEach(fn => fn());
    hideHands();
  }

  function setSawPower(on) {
    ws.sawOn = !!on;
    cls('sawSwitch', 'on', ws.sawOn);
    cls('circularSaw', 'running', ws.sawOn);
  }

  function returnSaw() {
    const saw = $('circularSaw');
    if (!saw) return;
    saw.classList.remove('cut-aligned', 'saw-track-lock', 'dragging-saw');
    saw.classList.add('saw-returning');
    saw.style.setProperty('top', '22px', 'important');
    saw.style.setProperty('--saw-angle', '-24deg');
    later(() => saw.classList.remove('saw-returning'), 420);
  }

  function reset() {
    cancelAllInteractions();
    clearJobs();
    Object.assign(ws, createState());
    guideKey = '';
    clearGuides();

    all('.ws-panel,.ws-card').forEach(e => e.classList.remove('show', 'done'));
    all('.ws-guided').forEach(e => e.classList.remove('ws-guided'));

    ['wsCardScrew', 'wsCardPrint', 'wsCardAssemble'].forEach(id => cls(id, 'locked', true));
    cls('wsCardWood', 'locked', false);

    cls('wsSafety', 'goggles-on ears-on gear-complete', false);
    text('wsGoggles', 'Schutzbrille anziehen');
    text('wsEars', 'Gehörschutz anziehen');
    all('.ws-gear button,.bit-piece,.model-card,.color-swatch').forEach(e => {
      e.classList.remove('active', 'selected', 'loaded-bit');
    });

    all('.part').forEach(e => {
      e.classList.remove('placed', 'wrong-part', 'snap-fly', 'dragging');
      e.dataset.placed = '0';
      ['left', 'top', 'right', 'bottom'].forEach(p => e.style.removeProperty(p));
    });
    all('.snap-slot').forEach(e => e.classList.remove('filled'));
    all('#assemblyLiveBuild i').forEach(e => e.classList.remove('built'));
    all('.dowel-hole').forEach(e => e.classList.remove('filled'));
    all('.montage-tool').forEach(e => {
      e.classList.remove('done', 'ready');
      e.classList.add('locked');
    });
    cls('toolDowel', 'locked', false);
    cls('toolDowel', 'ready', true);
    cls('assemblyArea', 'dowel-step', false);
    cls('assemblyMontage', 'show', false);
    cls('assemblyLiveBuild', 'hammered clamped puzzle-complete', false);
    cls('assemblyGlue', 'show', false);
    cls('angleBadge', 'show', false);
    cls('puzzleCompleteFx', 'show', false);
    cls('assemblyHammerVisual', 'hit', false);
    style('assemblyProgressBar', 'width', '0%');
    text('assemblyProgressText', 'BAUFORTSCHRITT 0%');
    setMontageProgress(0);
    $('assemblyFx')?.replaceChildren();

    $('markCanvas')?.replaceChildren();
    style('cutProgress', 'height', '0');
    cls('circularSaw', 'running cut-aligned dragging-saw saw-track-lock saw-finished saw-returning', false);
    removeStyle('circularSaw', ['left', 'top', 'right']);
    style('circularSaw', '--saw-angle', '-24deg');
    cls('wsBoard', 'cut-ready dragging saw-locked stop-snapped', false);
    style('wsBoard', 'left', '10%');
    style('wsBoard', 'top', '125px');

    cls('wastePiece', 'show stored separating safe-to-move dragging', false);
    removeStyle('wastePiece', ['left', 'top', 'right', 'bottom', '--separate']);
    cls('wasteShelf', 'ready', false);

    ['wsRuler', 'wsPencil'].forEach(id => {
      cls(id, 'parked tool-step-ok right-hand-pencil brief-guide-done marking snapped-pencil', false);
      cls(id, 'in-cup', true);
      removeStyle(id, ['left', 'top', 'right', 'bottom', 'transform']);
    });

    cls('toolParking', 'ready', false);
    find('.tool-cup')?.classList.remove('cup-ready');
    root()?.classList.remove('adjusting-saw-measure', 'marking-in-progress');

    cls('markGuide', 'ready ruler-target mark-finished', false);
    removeStyle('markGuide', ['left']);
    removeStyle('cutProgress', ['left']);
    cls('tapeCase', 'ready', false);
    style('tapeBlade', 'width', '0');
    style('tapeHook', 'left', '77px');
    text('tapeReadout', '0 cm');
    $('tapeScale')?.replaceChildren();
    text('chosenLength', 'Noch nicht gewählt');
    all('#cutLengthPicker button').forEach(e => e.classList.remove('selected'));
    text('tapeLiveHint', 'MAẞBAND: 0 cm herausgezogen');
    text('sawMeasureHint', 'SÄGEANSCHLAG: IST 20 cm · SOLL –');
    cls('tapeLiveHint', 'active', false);
    cls('sawMeasureHint', 'active', false);

    if ($('sawStopSlider')) $('sawStopSlider').value = '20';
    text('sawStopValue', 'IST: 20 cm');
    text('sawTargetValue', 'SOLL: –');
    style('sawStopMarker', 'left', '18px');
    cls('sawStopSystem', 'ready attached needs-aside aside compact-20', false);
    removeStyle('sawStopSystem', ['transform']);
    if ($('sawStopSlider')) $('sawStopSlider').disabled = false;

    setSawPower(false);
    if ($('sawSwitch')) $('sawSwitch').disabled = false;
    if ($('sawAfterHint')) {
      $('sawAfterHint').className = 'saw-after-hint';
      $('sawAfterHint').textContent = '';
    }

    cls('smoothShine', 'show', false);
    $('splinterLayer')?.replaceChildren();
    style('sandProgressBar', 'width', '0%');
    cls('sandBlockV32', 'grit80 grit180 dragging', false);
    removeStyle('sandBlockV32', ['left', 'top', 'right', 'bottom', '--sand-x', '--sand-y']);
    all('.sandpaper-sheet').forEach(e => e.classList.toggle('active', e.textContent.includes('K120')));

    all('.screw').forEach(e => {
      e.classList.remove('done', 'placed-screw', 'wrong-angle', 'driving');
      e.style.removeProperty('--screw-angle');
      e.dataset.angle = '0';
    });
    all('.loose-screw').forEach(e => e.classList.remove('used'));
    all('.screw-depth span').forEach(e => e.style.width = '0%');
    find('.screw-board')?.classList.remove('cracked');
    ['--crack-x', '--crack-y'].forEach(p => find('.screw-board')?.style.removeProperty(p));

    bitHomes.forEach((home, bit) => {
      if (home.next?.parentNode === home.parent) home.parent.insertBefore(bit, home.next);
      else home.parent.appendChild(bit);
      bit.style.cssText = home.style;
    });

    cls('wsDriver', 'bit-loaded drilling dragging-driver dragging', false);
    removeStyle('wsDriver', ['left', 'top', 'right', 'bottom', '--driver-x', '--driver-y']);
    if ($('screwAngleSlider')) $('screwAngleSlider').value = '0';
    text('screwAngleReadout', '0°');
    style('screwProgress', 'display', 'none');

    style('printProgress', 'width', '0%');
    style('printObject', 'width', '0');
    style('printObject', 'height', '0');
    removeStyle('printObject', ['--print-color']);
    if ($('printObject')) $('printObject').className = 'print-object';
    cls('printerHead', 'printing', false);
    removeStyle('printerHead', ['left', 'top']);
    $('printerScreen')?.parentElement.classList.remove('print-finished', 'is-printing');
    all('#wsPrintPanel button,#wsPrintPanel select').forEach(e => e.disabled = false);
    if ($('wsPrintStart')) $('wsPrintStart').disabled = true;
    if ($('wsMaterial')) $('wsMaterial').value = '';
    if ($('wsQuality')) $('wsQuality').value = '';
    style('wsPrintTake', 'display', 'none');
    text('layerCounter', 'SCHICHT 0');
    text('printTimeBadge', 'DRUCKZEIT --:--');
    text('printSummary', 'Wähle Modell, Material, Farbe und Qualität.');
    text('printerScreen', 'MODELL: –\nMATERIAL: –\nFORTSCHRITT: 0%');
    cls('printVictory', 'show', false);

    if ($('assembledProduct')) $('assembledProduct').className = 'assembled-product box';
    style('attachPrintBtn', 'display', 'none');
    cls('wsFinalDisplay', 'show', false);
    cls('wsQuiz', 'show', false);
    cls('wsWelcome', 'show', false);
    if ($('essentialWoodHint')) $('essentialWoodHint').className = 'essential-wood-hint';

    all('.wood-chip,.saw-dust-cloud,.sanding-dust,.sanding-chip').forEach(e => e.remove());
  }

  window.openWorkshop = function () {
    if (!initialize()) return;
    if (!visible()) {
      opener = document.activeElement;
      priorOverflow = document.body.style.overflow;
    }
    reset();

    const logo = $('wsQuinoaLogo');
    const source = document.querySelector('.school-logo-top img');
    if (logo && source && !logo.getAttribute('src')) logo.src = source.src;

    root().style.display = 'block';
    root().setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    cls('wsWelcome', 'show', true);
    style('wsSafety', 'display', 'none');
    cls('wsProjectPicker', 'show', false);
    style('wsMenu', 'display', 'none');

    startUiLoop();
    status('Willkommen in der Quinoa-Werkstatt.');
    steps('Werkstatt-Erlebnis starten');
  };

  window.startWorkshopExperience = function () {
    if (!visible()) return;
    cls('wsWelcome', 'show', false);
    style('wsSafety', 'display', 'block');
    status('Zuerst Schutzbrille anziehen und Gehörschutz anziehen.');
    steps('1. Sicherheitsausrüstung anziehen');
  };

  window.closeWorkshop = function () {
    const wasVisible = visible();
    cancelAllInteractions();
    clearJobs();
    setSawPower(false);
    ws.printing = false;

    cls('printerHead', 'printing', false);
    cls('wsDriver', 'drilling', false);
    all('.screw.driving').forEach(e => e.classList.remove('driving'));
    clearGuides();

    if (root()) {
      root().style.display = 'none';
      root().setAttribute('aria-hidden', 'true');
    }

    if (wasVisible) {
      document.body.style.overflow = priorOverflow;
      opener?.focus?.();
      opener = null;
    }

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'werkstatt-close' }, location.origin);
    }
  };

  window.toggleWsGear = function (type) {
    if (!visible() || !['goggles', 'ears'].includes(type) || ws[type]) return;
    ws[type] = true;
    cls(type === 'goggles' ? 'wsGoggles' : 'wsEars', 'active', true);
    text(
      type === 'goggles' ? 'wsGoggles' : 'wsEars',
      type === 'goggles' ? 'Schutzbrille sitzt ✓' : 'Gehörschutz sitzt ✓'
    );
    cls('wsSafety', type === 'goggles' ? 'goggles-on' : 'ears-on', true);

    if (ws.goggles && ws.ears) {
      cls('wsSafety', 'gear-complete', true);
      status('Sicherheits-Check bestanden.');
      steps('2. Projekt beginnen');
      later(() => {
        style('wsSafety', 'display', 'none');
        window.chooseWsProject('box');
      }, 1250);
    }
  };

  window.chooseWsProject = function (project) {
    if (!ws.goggles || !ws.ears) return;
    if (!['box', 'stool', 'holder'].includes(project)) return;
    ws.project = project;
    root().dataset.project = project;

    const names = project === 'stool'
      ? { base: 'Sitzfläche', side1: 'Bein links', side2: 'Bein rechts', back: 'Querstrebe' }
      : { base: 'Boden', side1: 'Seite links', side2: 'Seite rechts', back: 'Rückwand' };

    all('.snap-slot').forEach(e => e.textContent = names[e.dataset.slot] || '');
    cls('wsProjectPicker', 'show', false);
    style('wsMenu', 'display', 'grid');
    status('Beginne mit Messen, Markieren und Sägen.');
    steps('3. Holz messen, markieren und sägen');
  };

  window.openWsStation = function (name) {
    const panels = {
      wood: 'wsWoodPanel',
      sand: 'wsSandPanel',
      screw: 'wsScrewPanel',
      print: 'wsPrintPanel',
      assemble: 'wsAssemblePanel'
    };

    if (!panels[name] || !visible()) return;

    const allowed = ws.project && ws.goggles && ws.ears &&
      (name !== 'sand' || (ws.cut >= 100 && ws.wasteStored && !ws.sawOn)) &&
      (name !== 'assemble' || ws.done.wood) &&
      (name !== 'screw' || ws.montageStep === 5) &&
      (name !== 'print' || ws.done.screw);

    if (!allowed || ws.sawOn) {
      status('Diese Station ist noch gesperrt oder die Säge läuft. Arbeitsreihenfolge einhalten.');
      return;
    }

    cancelAllInteractions();
    clearGuides();
    style('wsMenu', 'display', 'none');
    all('.ws-panel').forEach(e => e.classList.remove('show'));
    cls(panels[name], 'show', true);

    if (name === 'wood') {
      woodStage(ws.cutLength ? 2 : 1);
      updateWoodStationGuide(true);
    }
    if (name === 'sand' && !ws.done.wood && !find('.splinter')) buildSplinters();
  };

  window.backToWsMenu = function () {
    if (ws.sawOn || ws.printing) {
      status(ws.sawOn ? 'Säge zuerst ausschalten.' : 'Der Druck läuft noch.');
      return;
    }
    cancelAllInteractions();
    all('.ws-panel').forEach(e => e.classList.remove('show'));
    clearGuides();
    style('wsMenu', 'display', 'grid');
  };

  function checkParking(el) {
    const cup = find('.tool-cup');
    return !!cup && overlap(el.getBoundingClientRect(), cup.getBoundingClientRect(), 55);
  }

  function snapIntoCup(el) {
    ['left', 'top', 'right', 'bottom', 'transform'].forEach(p => el.style.removeProperty(p));
    el.classList.remove('right-hand-pencil', 'marking', 'snapped-pencil');
    el.classList.add('in-cup', 'parked');
  }

  function updateParking() {
    if (!ws.rulerParked || !ws.pencilParked) return;
    find('.tool-cup')?.classList.add('cup-ready');
    status(`Werkzeuge ordentlich im Becher. Längenanschlag auf ${ws.cutLength} cm einstellen.`);
  }

  window.chooseCutLength = function (value) {
    const cm = Number(value);
    if (!Number.isFinite(cm) || cm <= 0 || !ws.project) return;

    if (ws.markCount > 0 || ws.cut > 0 || ws.sawOn) {
      status('Nach Beginn der Markierung bleibt die Länge fest. Für eine andere Länge die Werkstatt neu starten.');
      return;
    }

    stopInterval(tapeJob);
    tapeJob = null;

    Object.assign(ws, {
      cutLength: cm,
      tapeReady: false,
      tapeRetracted: false,
      ruler: false,
      rulerParked: false,
      pencilParked: false,
      markCount: 0,
      sawStopReady: false,
      boardAligned: false
    });

    ['wsRuler', 'wsPencil'].forEach(id => {
      cls(id, 'tool-step-ok parked', false);
      if ($(id)) snapIntoCup($(id));
      cls(id, 'parked', false);
    });

    const slider = $('sawStopSlider');
    if (slider) slider.value = String(cm === 20 ? 21 : 20);

    text('sawTargetValue', `SOLL: ${cm} cm`);
    text('sawStopValue', `IST: ${slider?.value || 20} cm`);
    cls('sawStopSystem', 'ready attached', false);
    cls('wsBoard', 'stop-snapped', false);
    cls('markGuide', 'ready ruler-target mark-finished', false);
    cls('tapeCase', 'ready', false);
    $('markCanvas')?.replaceChildren();
    style('tapeBlade', 'width', '0');
    style('tapeHook', 'left', '77px');
    text('tapeReadout', '0 cm');

    const scale = $('tapeScale');
    scale?.replaceChildren();

    for (let n = 0; scale && n <= cm; n += 5) {
      const label = document.createElement('span');
      label.className = 'tape-number';
      label.textContent = n;
      label.style.left = (n * 9) + 'px';
      scale.appendChild(label);
    }

    text('chosenLength', `Ziel: ${cm} cm`);
    all('#cutLengthPicker button').forEach(e => {
      e.classList.toggle('selected', parseInt(e.textContent, 10) === cm);
    });

    text('tapeLiveHint', `MAẞBAND: 0 cm / ZIEL ${cm} cm`);
    text('sawMeasureHint', `SÄGEANSCHLAG: IST ${slider?.value || 20} cm · SOLL ${cm} cm`);
    woodStage(2);
    status(`${cm} cm gewählt. Maßband am Metallhaken nach rechts ziehen.`);
    steps(`3. Maßband bis ${cm} cm herausziehen`);
  };

  window.updateSawStop = function (value) {
    const v = Number(value);
    const sys = $('sawStopSystem');
    const area = $('woodArea');
    if (!sys || !area || !Number.isFinite(v)) return;

    if (ws.sawOn || ws.cut > 0 || ws.markCount < 20 ||
        !ws.rulerParked || !ws.pencilParked) {
      status('Längenanschlag erst nach Markierung und Werkzeugablage einstellen; nicht während des Schnitts.');
      return;
    }

    const a = area.getBoundingClientRect();
    const s = sys.getBoundingClientRect();
    const hookX = a.width * 0.56 - v * 9;

    text('sawStopValue', `IST: ${v} cm`);
    style('sawStopMarker', 'left', (hookX - (s.left - a.left)) + 'px');
    text('sawMeasureHint', `SÄGEANSCHLAG: IST ${v} cm · SOLL ${ws.cutLength} cm`);

    ws.sawStopReady = !!ws.cutLength && v === ws.cutLength;
    ws.boardAligned = false;
    cls('wsBoard', 'stop-snapped', false);
    cls('sawStopSystem', 'ready attached', ws.sawStopReady);
    cls('sawStopSystem', 'compact-20', v === 20);

    status(ws.sawStopReady
      ? `Anschlaghaken steht ${v} cm vom Sägeblatt entfernt. Brett bei AUS anlegen.`
      : `SOLL ${ws.cutLength || '?'} cm, IST ${v} cm – Säge bleibt gesperrt.`);
  };

  function retractTape() {
    if (ws.tapeRetracted) return;
    ws.tapeRetracted = true;
    let width = parseFloat($('tapeBlade')?.style.width) || 0;

    tapeJob = every(() => {
      width = Math.max(0, width - 12);
      style('tapeBlade', 'width', width + 'px');
      style('tapeHook', 'left', (77 + width) + 'px');
      text('tapeReadout', `${Math.round(width / 9)} cm`);

      if (width === 0) {
        stopInterval(tapeJob);
        tapeJob = null;
        cls('tapeCase', 'ready', false);
        woodStage(5);
        status('Markierung fertig. Lineal und Bleistift sicher zurücklegen.');
      }
    }, 35);
  }

  function finishMarking() {
    if (ws.markCount < 20) return;
    cls('markGuide', 'mark-finished', true);
    cls('wsPencil', 'brief-guide-done', true);

    const canvas = $('markCanvas');
    if (canvas && !canvas.querySelector('.final-mark-line')) {
      const a = $('woodArea').getBoundingClientRect();
      const g = $('markGuide').getBoundingClientRect();
      const line = document.createElement('div');
      line.className = 'mark-segment final-mark-line';
      line.style.left = (g.left - a.left) + 'px';
      line.style.top = (g.top - a.top) + 'px';
      line.style.height = g.height + 'px';
      canvas.appendChild(line);
    }
    retractTape();
  }

  function wireWood() {
    const area = $('woodArea');
    if (!area) return;

    const ruler = $('wsRuler');
    const pencil = $('wsPencil');
    const board = $('wsBoard');
    const saw = $('circularSaw');
    const hand = $('wsWoodHand');
    const hook = $('tapeHook');
    const stop = $('sawStopSystem');

    if (hook) {
      hook.style.touchAction = 'none';
      let pointer = null;

      const endTape = e => {
        if (pointer === null || (e && e.pointerId !== pointer)) return;
        const id = pointer;
        pointer = null;
        try { if (hook.hasPointerCapture(id)) hook.releasePointerCapture(id); } catch (_) {}
        cls('tapeLiveHint', 'active', false);
      };
      cancelInteractions.add(() => endTape());

      hook.addEventListener('pointerdown', e => {
        if (!visible() || pointer !== null || e.button > 0) return;
        if (!ws.cutLength || ws.tapeReady) {
          if (!ws.cutLength) status('Zuerst die gewünschte Länge auswählen.');
          return;
        }
        e.preventDefault();
        pointer = e.pointerId;
        hook.setPointerCapture(pointer);
        cls('tapeLiveHint', 'active', true);
      });

      hook.addEventListener('pointermove', e => {
        if (e.pointerId !== pointer) return;
        const a = area.getBoundingClientRect();

        // Länge bleibt logisch exakt; die Darstellung skaliert bei schmalen Flächen.
        const target = Math.max(1, Math.min(ws.cutLength * 9, a.width - 170));
        const width = Math.max(0, Math.min(target, e.clientX - a.left - 122));
        const live = Math.min(ws.cutLength, Math.round(width / target * ws.cutLength));

        style('tapeBlade', 'width', width + 'px');
        style('tapeHook', 'left', (77 + width) + 'px');
        text('tapeReadout', `${live} cm`);
        text('tapeLiveHint', `MAẞBAND: ${live} cm / ZIEL ${ws.cutLength} cm`);

        all('.tape-number').forEach(label => {
          label.style.left = (Number(label.textContent) / ws.cutLength * target) + 'px';
        });

        if (width >= target - Math.min(8, target * 0.03) && !ws.tapeReady) {
          ws.tapeReady = true;
          style('tapeBlade', 'width', target + 'px');
          style('tapeHook', 'left', (77 + target) + 'px');
          const br = $('tapeBlade').getBoundingClientRect();
          const x = br.left - a.left + br.width;
          style('markGuide', 'left', x + 'px', 'important');
          style('cutProgress', 'left', (x + 2.5) + 'px', 'important');
          cls('tapeCase', 'ready', true);
          cls('markGuide', 'ruler-target', true);
          text('tapeReadout', `${ws.cutLength} cm`);
          woodStage(3);
          status('Messung fertig. Lineal aus dem Becher an die blaue Hilfe legen.');
        }
      });

      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => {
        hook.addEventListener(type, endTape);
      });
    }

    if (stop) {
      let pointer = null;
      let startX = 0;
      let shift = 0;

      const finishStop = (e, cancelled = false) => {
        if (pointer === null || (e && e.pointerId !== pointer)) return;
        const id = pointer;
        pointer = null;
        try { if (stop.hasPointerCapture(id)) stop.releasePointerCapture(id); } catch (_) {}
        if (!cancelled && shift <= -150) window.moveSawStopAside();
        else if (!ws.stopAside) stop.style.removeProperty('transform');
      };
      cancelInteractions.add(() => finishStop(null, true));

      stop.addEventListener('pointerdown', e => {
        if (e.target.closest('input') || !stop.classList.contains('needs-aside') ||
            ws.sawOn || pointer !== null || e.button > 0) return;
        pointer = e.pointerId;
        startX = e.clientX;
        shift = 0;
        stop.setPointerCapture(pointer);
        e.preventDefault();
      });
      stop.addEventListener('pointermove', e => {
        if (e.pointerId !== pointer) return;
        shift = Math.min(0, e.clientX - startX);
        stop.style.setProperty('transform', `translateX(${shift}px)`, 'important');
      });
      stop.addEventListener('pointerup', e => finishStop(e));
      stop.addEventListener('pointercancel', e => finishStop(e, true));
      stop.addEventListener('lostpointercapture', e => finishStop(e, true));
    }

    $('sawStopSlider')?.addEventListener('pointerdown', () => {
      cls('sawMeasureHint', 'active', true);
      root()?.classList.add('adjusting-saw-measure');
    });
    ['pointerup', 'pointercancel', 'blur'].forEach(type => {
      $('sawStopSlider')?.addEventListener(type, () => {
        cls('sawMeasureHint', 'active', false);
        root()?.classList.remove('adjusting-saw-measure');
      });
    });
    // Funktioniert auch ohne Inline-oninput im HTML.
    $('sawStopSlider')?.addEventListener('input', e => {
      if (!e.target.hasAttribute('oninput')) window.updateSawStop(e.target.value);
    });

    drag(ruler, area, null, () => {
      if (checkParking(ruler) && ws.markCount >= 20) {
        ws.rulerParked = true;
        snapIntoCup(ruler);
        updateParking();
        return;
      }
      if (!ws.tapeReady) {
        status('Gewählte Länge zuerst vollständig mit dem Maßband messen.');
        return;
      }

      const a = area.getBoundingClientRect();
      const r = ruler.getBoundingClientRect();
      const g = $('markGuide').getBoundingClientRect();

      if (Math.abs(r.right - g.left) < 120 || Math.abs(r.left - g.left) < 120) {
        style('wsRuler', 'left', (g.left - a.left - r.width + 6) + 'px', 'important');
        style('wsRuler', 'top', (g.top - a.top - 38) + 'px', 'important');
        ws.ruler = true;
        cls('wsRuler', 'tool-step-ok', true);
        cls('markGuide', 'ruler-target', false);
        cls('markGuide', 'ready', true);
        woodStage(4);
        status('Lineal eingerastet. Mit dem Bleistift an der Kante markieren.');
      } else {
        ws.ruler = false;
        status('Lineal in die gestrichelte Fläche legen.');
      }
    }, hand, {
      start() { if (ws.markCount < 20) ws.ruler = false; }
    });

    let lastMark = null;
    drag(pencil, area, (e, el, a) => {
      if (!ws.ruler || ws.markCount >= 20) return;

      const g = $('markGuide').getBoundingClientRect();
      const p = el.getBoundingClientRect();
      const near = Math.abs((p.left - 34) - (g.left + g.width / 2)) < 100;
      if (!near) {
        lastMark = null;
        el.classList.remove('marking', 'snapped-pencil');
        return;
      }

      el.style.setProperty('left', (g.left - a.left + 34 + g.width / 2) + 'px', 'important');
      el.classList.add('marking', 'snapped-pencil');

      const ratio = Math.max(0, Math.min(1, (e.clientY - g.top) / Math.max(1, g.height)));
      const current = Math.round(ratio * 19);
      const from = lastMark === null ? current : lastMark;

      for (let i = Math.min(from, current); i <= Math.max(from, current); i++) {
        if ($('markCanvas').querySelector(`[data-i="${i}"]`)) continue;
        const segment = document.createElement('div');
        segment.className = 'mark-segment';
        segment.dataset.i = i;
        segment.style.left = (g.left - a.left) + 'px';
        segment.style.top = (g.top - a.top + i / 19 * g.height) + 'px';
        $('markCanvas').appendChild(segment);
        ws.markCount++;
      }

      lastMark = current;
      finishMarking();
    }, () => {
      pencil.classList.remove('marking', 'snapped-pencil');
      lastMark = null;
      if (checkParking(pencil) && ws.markCount >= 20) {
        ws.pencilParked = true;
        snapIntoCup(pencil);
        updateParking();
      }
    }, hand, {
      cancel() {
        lastMark = null;
        pencil.classList.remove('marking', 'snapped-pencil');
      }
    });

    let guideOffset = null;
    const shiftMarks = x => {
      style('markGuide', 'left', x + 'px', 'important');
      style('cutProgress', 'left', (x + 2.5) + 'px', 'important');
      all('.mark-segment').forEach(e => e.style.left = x + 'px');
    };

    drag(board, area, (e, el) => {
      const x = parseFloat(el.style.left) + (guideOffset || 0);
      shiftMarks(x);
    }, () => {
      const a = area.getBoundingClientRect();
      const b = board.getBoundingClientRect();
      const g = $('markGuide').getBoundingClientRect();
      const hookX = a.left + a.width * 0.56 - ws.cutLength * 9;
      const delta = hookX - b.left;

      if (ws.sawStopReady && Math.abs(delta) < 120) {
        style('wsBoard', 'left', ((parseFloat(board.style.left) || 0) + delta) + 'px', 'important');

        // Markierung auf die tatsächliche Sägeposition bringen.
        shiftMarks(a.width * 0.56 - g.width / 2);
        ws.boardAligned = true;
        cls('wsBoard', 'stop-snapped', true);
        status('Holzkante am Anschlag. Markierung unter dem Sägeblatt.');
      } else {
        status('Linke Holzkante näher an den L-förmigen Anschlaghaken schieben.');
      }
      guideOffset = null;
    }, hand, {
      start() {
        guideOffset = $('markGuide').getBoundingClientRect().left -
          board.getBoundingClientRect().left;
      },
      cancel() { guideOffset = null; }
    });

    let lastChipTime = 0;
    drag(saw, area, (e, el, a) => {
      if (!ws.sawOn) return;

      const g = $('markGuide').getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const sawTop = parseFloat(el.style.top) || 22;

      // Die Säge bewegt sich auf einer festen vertikalen Bahn.
      el.style.setProperty('left', (g.left - a.left + g.width / 2 - r.width * 0.62) + 'px', 'important');
      el.classList.add('cut-aligned', 'saw-track-lock');

      const penetration = Math.max(0, Math.min(100, (sawTop - 22) / 128 * 100));
      ws.cut = Math.max(ws.cut, penetration);
      style('cutProgress', 'height', (ws.cut * g.height / 100) + 'px');

      if (penetration > 4 && performance.now() - lastChipTime > 100) {
        lastChipTime = performance.now();
        spawnChips(g.left + g.width / 2, Math.min(g.bottom, e.clientY));
      }

      if (ws.cut >= 99) {
        ws.cut = 100;
        style('cutProgress', 'height', g.height + 'px');
        cls('wsBoard', 'saw-locked', true);
      }
    }, () => {
      returnSaw();
      if (ws.cut >= 100) {
        status('Schnitt fertig. Sägekopf ist oben – Säge ausschalten.');
      }
    }, hand, {
      cancel: returnSaw
    });

    drag($('wastePiece'), area, null, (e, waste) => {
      if (ws.sawOn || !ws.stopAside || !sawIsUp()) return;
      const shelf = $('wasteShelf');
      if (shelf && overlap(waste.getBoundingClientRect(), shelf.getBoundingClientRect())) {
        ws.wasteStored = true;
        cls('wastePiece', 'stored', true);
        cls('wasteShelf', 'ready', true);
        cls('wsBoard', 'cut-ready', true);
        cls('circularSaw', 'saw-finished', true);
        if ($('sawAfterHint')) $('sawAfterHint').className = 'saw-after-hint';
        status('Restholz sicher im Regal. Fertiges Holz anklicken.');
      } else {
        status('Restholz in das markierte Regal legen.');
      }
    }, hand);

    board?.addEventListener('click', () => {
      if (ws.cut < 100 || ws.sawOn) return;
      if (!ws.wasteStored) {
        status('Zuerst Anschlag zur Seite schieben und Restholz ins Regal legen.');
        return;
      }
      cls('wsWoodPanel', 'show', false);
      cls('wsSandPanel', 'show', true);
      if (!ws.done.wood && !find('.splinter')) buildSplinters();
      status('Die raue rechte Schnittkante mit dem Schleifklotz glätten.');
      steps('4. Schnittkante schleifen');
    });
  }

  window.toggleWsSaw = function () {
    // Ausschalten ist nie durch Vorbedingungen blockiert.
    if (ws.sawOn) {
      setSawPower(false);

      if (ws.cut >= 100) {
        if (!sawIsUp()) returnSaw();
        releaseWaste();
        status('Säge aus. Anschlag mit der Hand nach links zur Seite schieben.');
      } else {
        returnSaw();
        status('Säge ausgeschaltet. Für die Fortsetzung Brett unverändert lassen.');
      }
      return;
    }

    if (ws.cut >= 100) {
      status('Schnitt abgeschlossen. Säge bleibt aus.');
      return;
    }

    if (!ws.goggles || !ws.ears || !ws.rulerParked || !ws.pencilParked ||
        ws.markCount < 20 || !ws.sawStopReady || !ws.boardAligned) {
      status('Säge bleibt aus: Sicherheitsausrüstung, Markierung, Werkzeugablage und Brettausrichtung prüfen.');
      return;
    }

    const area = $('woodArea').getBoundingClientRect();
    const g = $('markGuide').getBoundingClientRect();
    const saw = $('circularSaw');
    const width = saw.getBoundingClientRect().width;
    style('circularSaw', 'left', (g.left - area.left + g.width / 2 - width * 0.62) + 'px', 'important');
    style('circularSaw', 'top', '22px', 'important');
    style('circularSaw', 'right', 'auto', 'important');
    setSawPower(true);
    if ($('sawStopSlider')) $('sawStopSlider').disabled = true;
    status('Säge läuft. Sägekopf am Griff langsam absenken.');
  };

  function releaseWaste() {
    if (ws.cut < 100 || ws.sawOn) return;
    const a = $('woodArea').getBoundingClientRect();
    const g = $('markGuide').getBoundingClientRect();
    style('wastePiece', 'left', (g.left - a.left + 14) + 'px');
    style('wastePiece', 'top', '125px');
    cls('wastePiece', 'show', true);
    cls('wastePiece', 'safe-to-move', ws.stopAside);
    cls('sawStopSystem', 'needs-aside', !ws.stopAside);
    woodStage(6);

    if ($('sawAfterHint')) {
      $('sawAfterHint').className = 'saw-after-hint show-waste';
      text('sawAfterHint', 'SÄGE AUS – ANSCHLAG ZUERST ZUR SEITE SCHIEBEN');
    }
  }

  window.moveSawStopAside = function () {
    if (ws.cut < 100 || ws.sawOn || !sawIsUp() || ws.stopAside) return;
    ws.stopAside = true;
    cls('sawStopSystem', 'needs-aside attached', false);
    cls('sawStopSystem', 'aside', true);
    style('sawStopSystem', 'transform', 'translateX(-230px)', 'important');
    cls('wastePiece', 'safe-to-move', true);
    text('sawAfterHint', 'ANSCHLAG WEG – RESTHOLZ FREIGEGEBEN');
    status('Restholz jetzt in das Regal legen.');
  };

  function particle(area, className, x, y, lifetime = 800) {
    if (!area) return;
    const e = document.createElement('div');
    e.className = className;
    e.style.left = x + 'px';
    e.style.top = y + 'px';
    e.style.setProperty('--x', (Math.random() * 100 - 50) + 'px');
    e.style.setProperty('--y', (-10 - Math.random() * 65) + 'px');
    area.appendChild(e);
    later(() => e.remove(), lifetime);
  }

  function spawnChips(x, y) {
    const area = $('woodArea');
    const a = area.getBoundingClientRect();
    for (let i = 0; i < 5; i++) {
      particle(area, 'wood-chip' + (i < 2 ? ' big-chip' : ''), x - a.left, y - a.top);
    }
    particle(area, 'saw-dust-cloud', x - a.left, y - a.top, 950);
  }

  function buildSplinters() {
    const area = $('sandingArea');
    const wood = area?.querySelector('.sand-wood');
    const layer = $('splinterLayer');
    if (!area || !wood || !layer) return;

    const a = area.getBoundingClientRect();
    const w = wood.getBoundingClientRect();
    layer.replaceChildren();
    ws.sandCount = 0;
    style('sandProgressBar', 'width', '0%');

    // Alle Splitter befinden sich an der tatsächlich zu schleifenden Schnittkante.
    for (let i = 0; i < 64; i++) {
      const s = document.createElement('div');
      s.className = 'splinter';
      s.style.left = (w.right - a.left - 14 + Math.random() * 5) + 'px';
      s.style.top = (w.top - a.top + 4 + i * (w.height - 8) / 63) + 'px';
      s.style.transform = `rotate(${80 + Math.random() * 20}deg)`;
      layer.appendChild(s);
    }
  }

  window.selectSandGrit = function (grit, button) {
    if (![80, 120, 180].includes(Number(grit))) return;
    all('.sandpaper-sheet').forEach(e => e.classList.remove('active'));
    button?.classList.add('active');
    cls('sandBlockV32', 'grit80', Number(grit) === 80);
    cls('sandBlockV32', 'grit180', Number(grit) === 180);
    status(`K${grit} eingesetzt. Schleifklotz über die rechte Schnittkante führen.`);
  };

  function wireSand() {
    const area = $('sandingArea');
    drag($('sandBlockV32'), area, (e, el, a) => {
      if (ws.done.wood) return;
      const b = el.getBoundingClientRect();
      let removed = 0;

      all('.splinter:not(.removed)').forEach(s => {
        if (!overlap(b, s.getBoundingClientRect())) return;
        s.classList.add('removed');
        ws.sandCount++;
        removed++;
      });

      const total = all('.splinter').length || 64;
      style('sandProgressBar', 'width', Math.min(100, ws.sandCount / total * 100) + '%');

      if (removed) {
        particle(area, 'sanding-dust', e.clientX - a.left, e.clientY - a.top);
        particle(area, 'sanding-chip', e.clientX - a.left, e.clientY - a.top);
      }

      if (ws.sandCount >= total) {
        ws.done.wood = true;
        cls('smoothShine', 'show', true);
        cls('wsCardWood', 'done', true);
        cls('wsCardAssemble', 'locked', false);
        status('Schnittkante glatt. Holzteile zusammenstecken und anschließend montieren.');
        steps('5. Holzteile zusammenstecken und montieren');
        later(window.backToWsMenu, 1100);
      }
    }, null, $('wsSandHand'), { constrain: true });
  }

  function crackWoodAt(screw) {
    const board = find('.screw-board');
    if (!board || board.classList.contains('cracked')) return;
    const b = board.getBoundingClientRect();
    const r = screw.getBoundingClientRect();
    board.style.setProperty('--crack-x', Math.max(12, Math.min(88, (r.left + r.width / 2 - b.left) / b.width * 100)) + '%');
    board.style.setProperty('--crack-y', Math.max(3, Math.min(30, (r.top + r.height / 2 - b.top) / b.height * 100)) + '%');
    board.classList.add('cracked');
  }

  function cancelScrewJob() {
    stopTimeout(screwJob);
    screwJob = null;
    cls('wsDriver', 'drilling', false);
    all('.screw.driving').forEach(e => e.classList.remove('driving'));
    style('screwProgress', 'display', 'none');
  }

  function wireScrew() {
    const area = $('screwArea');
    const driver = $('wsDriver');
    const zone = $('bitDropZone');
    const hand = $('wsScrewHand');
    if (!area || !driver) return;

    let target = null;
    const cancelDriving = () => {
      cancelScrewJob();
      target = null;
    };
    cancelInteractions.add(cancelDriving);

    all('.bit-piece').forEach(bit => {
      bitHomes.set(bit, {
        parent: bit.parentNode,
        next: bit.nextSibling,
        style: bit.style.cssText
      });

      drag(bit, area, null, () => {
        if (!zone || !overlap(bit.getBoundingClientRect(), zone.getBoundingClientRect())) return;
        cancelDriving();
        all('.bit-piece').forEach(e => e.classList.remove('selected', 'loaded-bit'));
        ws.bit = bit.dataset.bit;
        bit.classList.add('selected');
        cls('wsDriver', 'bit-loaded', ws.bit === 'cross');
        bit.classList.toggle('loaded-bit', ws.bit === 'cross');
        status(ws.bit === 'cross'
          ? 'Kreuz-Bit eingesetzt. Akkuschrauber ruhig an eine gerade eingesetzte Schraube halten.'
          : 'Dieser Bit passt nicht. Kreuz-Bit einsetzen.');
      }, hand);
    });

    drag(driver, area, () => {
      if (ws.bit !== 'cross' || ws.done.screw || find('.screw-board.cracked')) {
        cancelDriving();
        return;
      }

      const tip = driver.querySelector('.inserted-bit');
      if (!tip) return;
      const t = tip.getBoundingClientRect();
      const tx = t.right;
      const ty = t.top + t.height / 2;

      const found = all('.screw.placed-screw:not(.done)').find(s => {
        const r = s.getBoundingClientRect();
        return Math.hypot(tx - r.left - r.width / 2, ty - r.top - r.height / 2) < 55;
      }) || null;

      if (found === target) return;
      cancelDriving();
      target = found;
      if (!found) return;

      if (found.classList.contains('wrong-angle')) {
        crackWoodAt(found);
        target = null;
        status('Stopp: Holz an schräger Schraube beschädigt. Schraubstation zurücksetzen.');
        return;
      }

      const r = found.getBoundingClientRect();
      const a = area.getBoundingClientRect();
      style('screwProgress', 'left', (r.left - a.left - 8) + 'px');
      style('screwProgress', 'top', (r.top - a.top - 8) + 'px');
      style('screwProgress', 'display', 'block');
      cls('wsDriver', 'drilling', true);
      found.classList.add('driving');
      status('Akkuschrauber ruhig und gerade halten …');

      screwJob = later(() => {
        screwJob = null;
        if (target !== found || !visible() || found.classList.contains('done')) return;
        found.classList.add('done');
        found.querySelector('.screw-depth span')?.style.setProperty('width', '100%');
        cancelDriving();
        ws.screws++;
        status(`Schraube ${ws.screws} von 3 eingedreht.`);

        if (ws.screws >= 3) {
          ws.done.screw = true;
          cls('wsCardScrew', 'done', true);
          cls('wsCardPrint', 'locked', false);
          steps('7. 3D-Druckteil auswählen und drucken');
          later(window.backToWsMenu, 850);
        }
      }, 1200);
    }, cancelDriving, hand, {
      constrain: true,
      cancel: cancelDriving
    });

    all('.screw').forEach(s => {
      s.addEventListener('click', () => {
        if (!s.classList.contains('wrong-angle') || s.classList.contains('done')) return;
        // Vor dem Schrauben darf eine schiefe Schraube korrigiert werden.
        s.classList.remove('wrong-angle');
        s.dataset.angle = '0';
        s.style.setProperty('--screw-angle', '0deg');
        status('Schraube gerade ausgerichtet. Jetzt Akkuschrauber ansetzen.');
      });
    });
  }

  window.setScrewAngle = function (value) {
    const v = Number(value);
    if (!Number.isFinite(v)) return;
    ws.currentScrewAngle = v;
    text('screwAngleReadout', `${v > 0 ? '+' : ''}${v}°`);
  };

  window.placeLooseScrew = function (n, button) {
    if (ws.montageStep !== 5 || ws.done.screw || !button ||
        button.classList.contains('used') || find('.screw-board.cracked')) return;

    const screw = all('.screw').find(e => e.dataset.screw === String(n));
    if (!screw) return;
    const angle = ws.currentScrewAngle;
    screw.dataset.angle = angle;
    screw.style.setProperty('--screw-angle', angle + 'deg');
    screw.classList.add('placed-screw');
    screw.classList.toggle('wrong-angle', Math.abs(angle) > 5);
    button.classList.add('used');

    status(Math.abs(angle) > 5
      ? 'Schraube schief. Vor dem Schrauben anklicken und gerade ausrichten.'
      : `Schraube ${n} gerade eingesetzt. Akkuschrauber ansetzen.`);
  };

  window.resetScrewStation = function () {
    if (ws.done.screw) {
      status('Schraubstation bereits abgeschlossen. Für einen neuen Versuch Werkstatt neu starten.');
      return;
    }

    cancelAllInteractions();
    cancelScrewJob();
    ws.screws = 0;
    ws.currentScrewAngle = 0;
    all('.screw').forEach(s => {
      s.classList.remove('done', 'placed-screw', 'wrong-angle', 'driving');
      s.style.removeProperty('--screw-angle');
      s.dataset.angle = '0';
      s.querySelector('.screw-depth span')?.style.setProperty('width', '0%');
    });
    all('.loose-screw').forEach(e => e.classList.remove('used'));
    const board = find('.screw-board');
    board?.classList.remove('cracked');
    ['--crack-x', '--crack-y'].forEach(p => board?.style.removeProperty(p));
    removeStyle('wsDriver', ['left', 'top', 'right', 'bottom', '--driver-x', '--driver-y']);
    if ($('screwAngleSlider')) $('screwAngleSlider').value = '0';
    text('screwAngleReadout', '0°');
    cls('wsResetScrew', 'resetting', true);
    later(() => cls('wsResetScrew', 'resetting', false), 600);
    status('Station zurückgesetzt. Schrauben gerade einsetzen; eingesetzter Bit bleibt erhalten.');
  };

  function printConfigLocked() {
    return ws.printing || ws.printReady || ws.done.print;
  }

  function printTime(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function screen(lines) {
    const e = $('printerScreen');
    if (!e) return;
    e.replaceChildren();
    lines.forEach((line, i) => {
      if (i) e.appendChild(document.createElement('br'));
      e.appendChild(document.createTextNode(line));
    });
  }

  function updatePrint() {
    const model = models[ws.model]?.[0] || '–';
    const quality = qualities[ws.quality];
    const duration = quality ? printTime(quality.seconds) : '--:--';

    text('printSummary', `Modell: ${model} | ${ws.material || '–'} | Farbe: ${ws.color || '–'} | ${quality?.label || '–'} | Dauer ${duration}`);
    screen([
      `MODELL: ${model}`,
      `MATERIAL: ${ws.material || '–'}`,
      `QUALITÄT: ${quality?.label || '–'}`,
      `ZEIT: ${duration}`,
      'STATUS: BEREIT'
    ]);
    text('printTimeBadge', `DRUCKZEIT ${duration}`);
    if ($('wsPrintStart')) {
      $('wsPrintStart').disabled = !(
        ws.done.screw && ws.model && ws.color && ws.material && quality
      ) || printConfigLocked();
    }
  }

  window.selectWsModel = function (m) {
    if (printConfigLocked() || !models[m]) return;
    ws.model = m;
    all('.model-card').forEach(e => e.classList.remove('selected'));
    cls(models[m][1], 'selected', true);
    if ($('printObject')) $('printObject').className = 'print-object ' + m;
    updatePrint();
  };

  window.selectWsColor = function (c) {
    if (printConfigLocked() || !colors[c]) return;
    ws.color = c;
    all('.color-swatch').forEach(e => e.classList.toggle('selected', e.dataset.color === c));
    style('printObject', '--print-color', colors[c]);
    updatePrint();
  };

  window.selectWsMaterial = function (v) {
    if (printConfigLocked()) return;
    const select = $('wsMaterial');
    if (select && ![...select.options].some(o => o.value === v)) return;
    ws.material = v || null;
    updatePrint();
  };

  window.selectWsQuality = function (v) {
    if (printConfigLocked()) return;
    ws.quality = qualities[v] ? v : null;
    updatePrint();
  };

  window.startWsPrint = function () {
    if (printConfigLocked() || !ws.done.screw || !models[ws.model] ||
        !colors[ws.color] || !ws.material || !qualities[ws.quality]) return;

    ws.printing = true;
    const model = models[ws.model];
    const quality = qualities[ws.quality];
    const box = $('printerScreen')?.parentElement;
    const started = performance.now();
    const duration = quality.seconds * 1000;

    box?.classList.add('is-printing');
    cls('printerHead', 'printing', true);
    all('#wsPrintPanel button,#wsPrintPanel select').forEach(e => e.disabled = true);
    style('printObject', 'width', model[2] + 'px');
    style('printObject', 'height', '2px');

    function tickPrint() {
      const elapsed = performance.now() - started;
      const ratio = Math.min(1, elapsed / duration);
      const percent = ratio * 100;
      const height = Math.max(2, model[3] * ratio);
      const layer = Math.max(1, Math.ceil(quality.layers * ratio));
      const remaining = Math.max(0, (duration - elapsed) / 1000);
      const sweep = (elapsed / 650) % 2;
      const travel = sweep <= 1 ? sweep : 2 - sweep;
      const x = 105 + travel * 245;

      style('printerHead', 'left', x + 'px');
      style('printerHead', 'top', (193 - height) + 'px');
      style('extrusionLine', 'left', (x + 23) + 'px');
      style('extrusionLine', 'top', (210 - height) + 'px');
      style('printProgress', 'width', percent + '%');
      style('printObject', 'height', height + 'px');
      text('layerCounter', `SCHICHT ${layer} / ${quality.layers}`);
      text('printTimeBadge', `RESTZEIT ${printTime(remaining)}`);
      screen([
        `MODELL: ${model[0]}`,
        `MATERIAL: ${ws.material}`,
        `SCHICHT: ${layer}`,
        `RESTZEIT: ${printTime(remaining)}`,
        `STATUS: DRUCKT ${Math.round(percent)}%`
      ]);

      if (ratio < 1) return;

      stopInterval(printJob);
      printJob = null;
      ws.printing = false;
      cls('printerHead', 'printing', false);
      box?.classList.remove('is-printing');
      box?.classList.add('print-finished');
      text('printTimeBadge', 'DRUCK FERTIG · ABKÜHLEN');
      screen([`MODELL: ${model[0]}`, `MATERIAL: ${ws.material}`, 'STATUS: ABKÜHLEN']);
      status('Druck abgeschlossen. Kurze simulierte Abkühlphase abwarten.');

      later(() => {
        ws.printReady = true;
        style('wsPrintTake', 'display', 'inline-block');
        if ($('wsPrintTake')) $('wsPrintTake').disabled = false;
        text('printTimeBadge', 'FERTIG · ENTNAHME BEREIT');
        screen([`MODELL: ${model[0]}`, `MATERIAL: ${ws.material}`, 'STATUS: ENTNAHME BEREIT']);
        status('Bauteil bereit zur Entnahme.');
      }, 1500);
    }

    tickPrint();
    printJob = every(tickPrint, 75);
  };

  window.takeWsPrint = function () {
    if (!ws.printReady || ws.done.print) return;
    ws.printReady = false;
    ws.done.print = true;
    style('wsPrintTake', 'display', 'none');
    cls('wsCardPrint', 'done', true);
    style('attachPrintBtn', 'display', 'inline-block');
    cls('printVictory', 'show', true);
    status(`${models[ws.model][0]} entnommen. Zusatzteil am Holzkörper befestigen.`);
    steps('8. Gedrucktes Zusatzteil befestigen');
    later(() => {
      cls('printVictory', 'show', false);
      window.backToWsMenu();
    }, 1700);
  };

  function assemblySparks(slot) {
    const fx = $('assemblyFx');
    const area = $('assemblyArea');
    if (!slot || !fx || !area) return;
    const a = area.getBoundingClientRect();
    const r = slot.getBoundingClientRect();

    for (let i = 0; i < 14; i++) {
      const spark = document.createElement('i');
      spark.className = 'assembly-spark';
      spark.style.left = (r.left - a.left + r.width / 2) + 'px';
      spark.style.top = (r.top - a.top + r.height / 2) + 'px';
      spark.style.setProperty('--x', (Math.cos(i / 14 * Math.PI * 2) * 65) + 'px');
      spark.style.setProperty('--y', (Math.sin(i / 14 * Math.PI * 2) * 45) + 'px');
      fx.appendChild(spark);
      later(() => spark.remove(), 800);
    }
  }

  function unlockMontage(done, next) {
    cls(done, 'ready locked', false);
    cls(done, 'done', true);
    if (next) {
      cls(next, 'locked', false);
      cls(next, 'ready', true);
    }
  }

  function setMontageProgress(value) {
    style('montageProgressBar', 'width', value + '%');
    text('montageProgressText', `MONTAGE ${value}%`);
  }

  function finishPuzzleBuild() {
    if (ws.puzzleFinished || ws.placed < 4) return;
    ws.puzzleFinished = true;

    // Das Puzzle beendet NICHT die Montage.
    cls('assemblyLiveBuild', 'puzzle-complete', true);
    cls('puzzleCompleteFx', 'show', true);
    text('assemblyProgressText', 'BAUPUZZLE 100% – MONTAGE FOLGT');
    cls('assemblyMontage', 'show', true);
    cls('assemblyArea', 'dowel-step', true);
    status('Grundform steht. Beide Holzdübel einsetzen, danach Leim, Hammer, Winkel und Zwinge verwenden.');
    steps('5. Werkstück vollständig montieren');
    later(() => cls('puzzleCompleteFx', 'show', false), 1600);
  }

  window.insertAssemblyDowel = function (el) {
    if (ws.placed < 4 || ws.montageStep !== 0 ||
        !el?.classList.contains('dowel-hole') || el.classList.contains('filled')) return;
    el.classList.add('filled');
    assemblySparks(el);
    ws.dowels++;
    setMontageProgress(ws.dowels * 10);
    status(`Holzdübel ${ws.dowels} von 2 eingesetzt.`);

    if (ws.dowels >= 2) {
      ws.montageStep = 1;
      cls('assemblyArea', 'dowel-step', false);
      unlockMontage('toolDowel', 'toolGlue');
      status('Beide Holzdübel sitzen. Holzleim dünn auftragen.');
    }
  };

  window.startMontageTool = function (tool) {
    if (ws.placed < 4 || ws.montageStep >= 5) return;

    if (tool === 'dowel' && ws.montageStep === 0) {
      const hole = find('.dowel-hole:not(.filled)');
      if (hole) window.insertAssemblyDowel(hole);
      return;
    }

    if (tool === 'glue' && ws.montageStep === 1) {
      cls('assemblyGlue', 'show', true);
      ws.montageStep = 2;
      setMontageProgress(40);
      unlockMontage('toolGlue', 'toolHammer');
      status('Holzleim aufgetragen. Drei kontrollierte Gummihammer-Schläge ausführen.');
      return;
    }

    if (tool === 'hammer' && ws.montageStep === 2) {
      const hammer = $('assemblyHammerVisual');
      // Laufende Schlaganimation verhindert hektische Mehrfachklicks.
      if (hammer?.classList.contains('hit')) return;

      ws.hammerHits++;
      if (hammer) {
        hammer.classList.remove('hit');
        void hammer.offsetWidth;
        hammer.classList.add('hit');
      }
      cls('assemblyLiveBuild', 'hammered', true);
      later(() => {
        cls('assemblyLiveBuild', 'hammered', false);
        cls('assemblyHammerVisual', 'hit', false);
      }, 420);

      status(`Gummihammer: Schlag ${ws.hammerHits} von 3.`);
      if (ws.hammerHits >= 3) {
        ws.montageStep = 3;
        setMontageProgress(60);
        unlockMontage('toolHammer', 'toolAngle');
      }
      return;
    }

    if (tool === 'angle' && ws.montageStep === 3) {
      cls('angleBadge', 'show', true);
      ws.montageStep = 4;
      setMontageProgress(80);
      unlockMontage('toolAngle', 'toolClamp');
      status('Anschlagwinkel geprüft. Werkstück mit der Zwinge festspannen.');
      return;
    }

    if (tool === 'clamp' && ws.montageStep === 4) {
      cls('assemblyLiveBuild', 'clamped', true);
      ws.montageStep = 5;
      setMontageProgress(100);
      unlockMontage('toolClamp', null);
      cls('wsCardScrew', 'locked', false);
      status('Werkstück festgespannt. Jetzt mit Akkuschrauber verschrauben.');
      steps('6. Kreuz-Bit einsetzen und Körper verschrauben');
      later(window.backToWsMenu, 1300);
      return;
    }

    status('Zuerst den markierten Montageschritt ausführen.');
  };

  function wireAssembly() {
    const area = $('assemblyArea');
    all('.part').forEach(part => {
      drag(part, area, null, () => {
        if (part.classList.contains('placed')) return;
        const slot = all('.snap-slot').find(e => e.dataset.slot === part.dataset.part);
        if (!slot || slot.classList.contains('filled')) return;

        const r = part.getBoundingClientRect();
        const s = slot.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        if (cx > s.left && cx < s.right && cy > s.top && cy < s.bottom) {
          part.classList.add('snap-fly', 'placed');
          part.dataset.placed = '1';
          slot.classList.add('filled');
          slot.textContent = '✓ ' + slot.textContent.replace(/^✓\s*/, '');

          const liveClass = {
            base: 'build-base',
            side1: 'build-left',
            side2: 'build-right',
            back: 'build-back'
          }[part.dataset.part];
          $('assemblyLiveBuild')?.querySelector('.' + liveClass)?.classList.add('built');
          assemblySparks(slot);
          ws.placed++;

          const percent = ws.placed * 25;
          style('assemblyProgressBar', 'width', percent + '%');
          text('assemblyProgressText', `BAUFORTSCHRITT ${percent}%`);
          status(`Teil eingerastet – ${ws.placed} von 4.`);

          if (ws.placed === 4) {
            if ($('assembledProduct')) {
              $('assembledProduct').className = 'assembled-product show ' + ws.project;
            }
            finishPuzzleBuild();
          }
        } else {
          part.classList.add('wrong-part');
          later(() => part.classList.remove('wrong-part'), 450);
          status('Passende leuchtende Bauform suchen.');
        }
      }, null, {
        guard: () => ws.done.wood
      });
    });
  }

  window.attachPrintedPart = function () {
    if (ws.placed < 4 || ws.montageStep !== 5 ||
        !ws.done.wood || !ws.done.screw || !ws.done.print || ws.done.assemble) {
      status('Zuerst Holz bearbeiten, vollständig montieren, verschrauben und Druckteil entnehmen.');
      return;
    }

    ws.done.assemble = true;
    cls('wsCardAssemble', 'done', true);
    all('.ws-panel').forEach(e => e.classList.remove('show'));
    style('wsMenu', 'display', 'none');
    cls('wsFinalDisplay', 'show', true);

    const names = {
      stool: 'Dein Mini-Werkstatthocker',
      holder: 'Dein Stiftehalter',
      box: 'Deine Mini-Holzkiste'
    };
    text('wsFinalText', `${names[ws.project]} ist fertig – inklusive ${models[ws.model][0]}.`);
    status('Werkstück erfolgreich fertiggestellt!');
    steps('9. Sicherheitsquiz abschließen');
  };

  window.startWsQuiz = function () {
    if (!ws.done.assemble) return;
    quizBusy = false;
    ws.quiz = 0;
    cls('wsFinalDisplay', 'show', false);
    cls('wsQuiz', 'show', true);
    renderQuiz();
  };

  function renderQuiz() {
    const q = quiz[ws.quiz];
    const box = $('wsQuizOptions');
    if (!q || !box) return;
    quizBusy = false;
    text('wsQuizProgress', `Frage ${ws.quiz + 1} von ${quiz.length}`);
    text('wsQuizQuestion', q.q);
    box.replaceChildren();

    q.a.forEach((value, index) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = value;
      b.addEventListener('click', () => answerQuiz(index, b));
      box.appendChild(b);
    });
  }

  function answerQuiz(index, button) {
    if (quizBusy) return;
    const q = quiz[ws.quiz];
    if (!q) return;

    if (index !== q.c) {
      button.style.background = '#fee2e2';
      status('Nicht ganz. Überlege noch einmal.');
      return;
    }

    quizBusy = true;
    button.style.background = '#dcfce7';
    all('#wsQuizOptions button').forEach(e => e.disabled = true);

    later(() => {
      ws.quiz++;
      if (ws.quiz >= quiz.length) {
        cls('wsQuiz', 'show', false);
        status('Werkstatt erfolgreich abgeschlossen.');
        steps('✅ Werkstatt abgeschlossen');
        later(window.closeWorkshop, 900);
      } else {
        renderQuiz();
      }
    }, 500);
  }

  function initialize() {
    if (initialized) return true;
    if (!root()) {
      console.error('Werkstatt: #workshopOverlay fehlt.');
      return false;
    }

    initialized = true;

    // TextContent statt HTML-Strings für variable Bildschirmtexte.
    if ($('printerScreen')) $('printerScreen').style.whiteSpace = 'pre-line';

    wireWood();
    wireSand();
    wireScrew();
    wireAssembly();

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && visible()) {
        e.preventDefault();
        window.closeWorkshop();
      }
    });

    window.addEventListener('blur', () => {
      cancelAllInteractions();
      if (ws.sawOn) {
        setSawPower(false);
        returnSaw();
        if (ws.cut >= 100) releaseWaste();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) return;
      cancelAllInteractions();
      if (ws.sawOn) {
        setSawPower(false);
        returnSaw();
        if (ws.cut >= 100) releaseWaste();
      }
    });

    window.addEventListener('message', e => {
      if (
        window.parent === window ||
        e.source !== window.parent ||
        e.origin !== location.origin ||
        !e.data
      ) return;

      if (e.data.type === 'werkstatt-open') window.openWorkshop();
      if (e.data.type === 'werkstatt-close') window.closeWorkshop();
    });

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'werkstatt-ready' }, location.origin);
    }

    return true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
