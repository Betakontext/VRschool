# Quinoa Kunstraum – Aufbau wie die Küche

## Starten
Den gesamten Ordner Kunstraum kopieren. Im übergeordneten Ordner ein Terminal öffnen:

    python -m http.server 8000

Dann http://localhost:8000/interactives/Kunstraum/ öffnen.

## Struktur
- kunstraum-loader.js / .css: Tour-Dialog mit eigenständigem iframe, Escape und Rückkehr zur Tour
- kunstraum-scene.js: bestehender Tour-Startknopf, Klick, Touch und VR-Blick
- kunstraum/kunstraum.html: vollständige Spielseite
- kunstraum/kunstraum.css: Originalstile plus Küchenatelier-Design
- kunstraum/kunstraum.js: bisherige Mal- und Galeriefunktionen
- kunstraum/kunstraum-boot.js: Start und Rückkehr
- kunstraum/assets/: Original-Logo

## In die Tour einbauen
Die vorherige inline Kunstraum-App samt ihrer CSS-/JS-Blöcke entfernen, damit es keine doppelten IDs und Listener gibt. Den vorhandenen artStudioLaunch-Startknopf und panel-Kunstraum samt Positionen behalten.
Vor </body> laden:

    <script src="interactives/Kunstraum/kunstraum-loader.js"></script>
    <script src="interactives/Kunstraum/kunstraum-scene.js"></script>

openArtStudio() bleibt als kompatibler Einstieg erhalten. Alternativ openKunstraumModule().
Die Galerie nutzt weiterhin quinoa-schuelergalerie-v2 im Browser-localStorage. Gespeicherte Bilder werden nicht automatisch auf andere PCs übertragen. Für bestehende Bilder denselben Browser und dieselbe localhost-Adresse einschließlich Port verwenden.

Alle bisherigen Pinsel, Radiergummi, Farben, Mischpalette, Vorlagen, Rückgängig/Wiederholen und Galeriefunktionen bleiben erhalten. Das Design orientiert sich an der beigefügten Küche, ohne deren Kochfunktionen oder schwere 3D-Abhängigkeiten zu übernehmen.

Der ZIP-Inhalt wird in den Projekt-Hauptordner entpackt. Nur interactives/Kunstraum ersetzen, nicht den Hauptindex. Die beigefügte index.html ist lediglich der eigenständige Modul-Einstieg.

## Atelier 3D
Echte lokale Three.js-Szene: Fenster, Holzboden, Regale, Farbtöpfe, Tische, Hocker, gerahmte Bilder, Pflanze, Schatten und dezente Partikel. Keine externen Downloads erforderlich. Bei fehlendem WebGL bleibt ein CSS-Hintergrund sichtbar. Reduzierte Bewegung wird berücksichtigt. Rechts eine feste Werkzeugkarte ohne inneres Scrollen. Bei sehr geringer Fensterhöhe scrollt nur die Gesamtseite, damit alle Werkzeuge zugänglich bleiben. Mal- und Galerielogik unverändert.

## Realismus-Update
Der sichtbare Raum ist jetzt ein lokal eingebundener, KI-generierter fotorealistischer Hintergrund statt der einfachen 3D-Geometrie. Er ist ein 2D-Bild mit Raumtiefe, keine frei begehbare 3D-Szene. Dezente Licht- und Pinselanimationen ergänzen die Oberfläche. Die frühere 3D-Szene bleibt als Quelldatei enthalten, wird jedoch nicht mehr geladen.
Auswaschen dauert 1,4 Sekunden: Farbauswahl und Malen sind währenddessen gesperrt. Danach muss neue Farbe aufgenommen werden. Radieren bleibt unabhängig möglich. Der Wasserbecher zeigt beim Auswaschen eine Farbfahne; der Pinselstatus zeigt sauber bzw. die aufgenommene Farbe.
Technische Referenzen: https://threejs.org/manual/pages/materials.html und https://threejs.org/manual/pages/shadows.html . Keine externen Laufzeit-Dienste erforderlich.
