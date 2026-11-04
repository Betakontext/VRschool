# Testbericht – Fußball-Elfmeter-Änderung

**Stand:** Football-Auslieferung (keine Basketball-Umbenennung). Die Änderungen liegen ausschließlich im Laufzeitpfad `kind === 'pen'` und in den Elfmeter-Hinweisen.

## Implementiert

- Vier lesbare Fußball-Helfer im Runtime-Code: `penInit`, `penAct`, `penUpdate`, `penDraw`.
- Das Tor hat den vorderen weißen Rechteckrahmen **x=180..720, y=90..300**, ein perspektivisches Rücknetz und schattierte Pfosten. Der gemusterte Fußball steht sichtbar bei **(450,420)**.
- Beim Loslassen wird der Maus-/Finger-Endpunkt eingefroren. Gedrückthalten lädt die Kraft; der breite grüne Bereich ist sichtbar. Auch ein kurzer Druck erhält die nutzbare Mindestkraft **0,35**. Die Flugzeit beträgt abhängig von der Kraft **0,70 bis 0,895 Sekunden** (und liegt damit im geforderten Bereich 0,7–1,0 s).
- Der Torwart hat Kopf, Trikot-Torso, Beine, Arme und Handschuhe. Nach einer kurzen Verzögerung taucht er nur begrenzt zur Seite. Die geometrische Parade ist absichtlich auf zentrale erreichbare Ziele begrenzt; Torecken sind einfache Tore.
- Der Ball bleibt nach der Ankunft kurz sichtbar. Bei Tor: Rücknetz-Ripple/Partikel, genau einmal +100, danach Reset. Nach acht Schüssen endet die Runde.
- Pointer-Cancel, Capture-Verlust, Pause und Fokusverlust löschen einen begonnenen Ladezustand; sie lösen keinen Schuss aus.

## Ausgeführte Verifikation

1. `node --check pausenhof/pausenhof.js`: bestanden.
2. `node --check pausenhof-loader.js`: bestanden.
3. Headless-Chromium/Playwright im echten iframe: Ein gezielter Eckschuss auf (205,110) erzielte `TOR! +100`; ein zentraler Schuss auf (450,210) löste `GEHALTEN` durch die Keeper-Tauchbewegung aus. Keine Page-Errors.
4. Der Test bestätigt die Runtime-Namen `penInit`, `penAct`, `penUpdate`, `penDraw`. Die Basketball-Zweige wurden nicht ersetzt oder verändert.

## Grenzen

Die gezielte Prüfung deckt Maus-/iframe-Interaktion sowie die Tor-/Paradepfade ab. Sie ist kein visueller Pixelvergleich für alle Viewports oder Touchgeräte.
