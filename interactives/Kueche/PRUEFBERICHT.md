# Reparaturbericht – Quinoa-Küche

## Tatsächliche Ursache
Die Spielressourcen und der Loader-Pfad waren im gelieferten Archiv bereits konsistent: Der Loader löst `kueche/kueche.html` relativ zu sich auf und alle in der Spielseite referenzierten Dateien existieren.

Die weiße/leere iframe-Ansicht entstand durch einen Initialisierungsfehler: `#mensaGame` ist absichtlich mit `display:none` initialisiert. Nach dem iframe-Laden sandte der Loader jedoch `kueche-module-start`; dessen Handler rief nur `startMensaGame()` auf. Diese Funktion blendet lediglich die Begrüßung aus und macht den versteckten Spielcontainer **nicht** sichtbar. `openMensaGame()` (welches Display, ARIA-Status, Begrüßung und Rezeptliste initialisiert) wurde nicht aufgerufen.

## Änderung
- Loader sendet nach `load` `kueche-module-open`.
- Der Spiel-Handler führt dafür `openMensaGame()` aus. Der alte `kueche-module-start`-Befehl bleibt kompatibel und ruft erst `openMensaGame()`, dann `startMensaGame()` auf.
- Der Loader nutzt jetzt die Modal-Gestaltung der Bibliothek: abgedunkelter transparenter Hintergrund, gepolsterte abgerundete iframe-Fläche und runder X-Button. Der relative Pfad und die Szene-Komponente blieben unverändert.

## Prüfungen
- JavaScript-Syntax (`node --check`) für alle drei JavaScript-Dateien: erfolgreich.
- Relative Ressourcen geprüft: `kueche.html` → `kueche.css`, `kueche.js`, `assets/mg-cook-logo.jpg`; alle vorhanden.
- Lokaler Chromium-Smoke-Test: Öffnen zeigt `#mensaGame` (display block, aria-hidden false) plus Begrüßung ohne pageerror/Konsolenfehler; X entfernt das Modal; erneutes Öffnen zeigt den Inhalt erneut.

Kein manueller WebXR-/Headset- oder vollständiger Gameplay-Durchlauf wurde durchgeführt.
