# Klassenraum – Integration

Archiv **in `interactives/` entpacken**. Ergebnis: `interactives/Klassenraum/`.

Im Host genau diese zwei kanonischen Dateien einbinden:
```html
<script src="./interactives/Klassenraum/klassenraum-loader.js"></script>
<script src="./interactives/Klassenraum/klassenraum-scene.js"></script>
```
Ein vorhandener Szenenknopf darf inline `onclick="openKlassenraumModule()"` aufrufen. In A-Frame alternativ `klassenraum-start` setzen. Der Loader löst seine Spielseite stets relativ zur eigenen Script-URL als `klassenraum/klassenraum.html` auf.

## Inhalt
Nur drei Stationen: **Schätzmeister**, **Versteckte Dinge**, **Dart-Reaktion**. Es sind keine externen Assets oder Bibliotheken nötig. Ergebnisse werden nur beim expliziten Rundenende bzw. der automatischen Spielauswertung einmal lokal gespeichert; blockierter `localStorage` wird abgefangen.

## Fehlerursache und Reparatur
Das neuere Eingangszip enthielt zusätzlich bytegleiche Unterstrich-Kopien (`klassenraum_loader.js`, `klassenraum_scene.js`) und zehn Spiele. Das ältere Zip hatte zwar nur Bindestrich-Dateien, lud im Loader aber `index.html`; dieses leitete auf eine andere Seite weiter und besaß keinen sichtbaren Fehlerzustand. Das begünstigt ein weißes iframe bei Pfad-/Handshake-Problemen. Die Auslieferung hat deshalb **nur** die zwei Bindestrich-Skripte, einen unmittelbaren Lade-/Timeout-Fehler mit Wiederholen, sowie validierte `origin`- und `source`-Nachrichten. Der Loader fragt `a-scene` ab (nicht `window.scene`) und beendet VR vor dem Overlay, falls aktiv.

Über HTTP(S) testen, nicht über `file://`, z. B. `python3 -m http.server` im Verzeichnis oberhalb von `interactives`.
