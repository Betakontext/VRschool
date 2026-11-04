# Die verschlossene Bibliothek – Escape Room (Neufassung)

## Starten
`bibliothek/bibliothek.html` im Browser öffnen. Für die Integration in eine bestehende A-Frame-Schultour sind `bibliothek-loader.js`, `bibliothek-loader.css` und `bibliothek-scene.js` aus dem Original enthalten. Die neue HTML-Datei läuft auch eigenständig und benötigt keine 3D-Bibliothek.

## Spielprinzip
- Alle Gegenstände sind von Anfang an unabhängig anklickbar.
- Vier Zahlen werden über Archivregal (8), Uhr (4), Bild (2) und Teppich (7) gefunden.
- Die Archivnotiz und das Türschild liefern die Reihenfolge Wissen → Zeit → Bild → Boden.
- Im Globus befindet sich der Schlüssel. Das Türschloss benötigt Schlüssel und Code 8427.
- Ein Fundstück-Menü sammelt alle Beweise; Hinweise sind in drei Stufen ohne Wartezeit verfügbar.
- Kein Countdown, keine erzwungene Schrittfolge, kein kompliziertes Schlüssel-Ziehen.

## Darstellung
Neu gestalteter perspektivischer 2,5D-Raum mit Beleuchtung, Wand- und Bodentexturen, Bücherregal, Uhr, Gemälde, Schreibtisch, Globus, Teppich und Tür. Es ist **kein frei begehbarer WebGL-3D-Raum**. Fonts können optional online geladen werden; lokale Fallbacks sind vorhanden.
