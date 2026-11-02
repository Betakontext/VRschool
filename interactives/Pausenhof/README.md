# Pausenhof · Geschicklichkeit – mausoptimiert

**Einbaupfad:** `interactives/Pausenhof/`. Die vorhandene Einbindung ruft weiterhin `window.openPausenhofModule()` auf; `pausenhof-scene.js`, `football-model.js` und die aufrufende Index-Datei sind nicht Bestandteil dieser Änderung.

## Änderungen
Nur `pausenhof/pausenhof.js` wurde für Mausspiel optimiert. Der iframe-Loader, die Außen-Schließen-Schaltfläche (X), der abgedunkelte Rand und das interne „Zur Spielauswahl“ bleiben unverändert. Die Canvas-Koordinaten werden aus `getBoundingClientRect()` auf 900×500 umgerechnet.

- Linksklick für Timing, Sprung, Stoppuhr und Zielwurf; Basketball: linke Taste halten/loslassen.
- Tischtennis-Paddel, Dodgeball-Bahn und Balance folgen dem Mauszeiger horizontal.
- Reaktionswand und Fitnessflächen sind direkt anklickbar.
- Pointer Capture, linke Taste, `pointercancel`/Capture-Verlust-Aufräumen sowie begrenztes Delta (`max. 40 ms`) verhindern hängende Eingaben und Zeitsprünge.
- Fokusverlust/ausgeblendete Seite pausiert. Interne Rückkehr und Ergebnis beenden RAF und Listener über `AbortController`.

Tastatur- und die vorhandenen Bildschirmtasten bleiben als Ergänzung erhalten.
