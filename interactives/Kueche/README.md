# Quinoa · Küchenatelier

Überarbeitete Version des angehängten Küchenmoduls. Eigenständige, lokale Three.js-Szene mit perspektivischer Kamera, Schatten und plastischen Küchengegenständen; kein externes 3D-CDN zur Laufzeit nötig.

## Spielablauf

Fünf Gerichte, je sechs Stationen: Waschen, Schneiden, Wiegen, Kochen/Mischen, Anrichten und Aufräumen. Maus, Touch und alternative Bedientasten. Kamera umschalten und näher herangehen. Optionale synthetische Geräusche sind anfänglich ausgeschaltet.

- Wasser halten, 16 Schneidbewegungen ausführen.
- Hauptzutat selbst wiegen (±3 g). Die übrigen Zutaten sind als Rezeptportion vorbereitet.
- Herd vorheizen, Zutaten zugeben, Temperatur und Rühren beeinflussen Garung und Bräunung. Restwärme bleibt erhalten. Pfannkuchen müssen gewendet werden. Salat kommt ohne Hitze aus.
- Drei Portionierbewegungen und Garnitur; anschließend Arbeitsplatte wischen.
- Kochzeiten sind spielerisch verkürzt, keine reale Gar- oder Hygieneanleitung. Der kleine Beilagentopf ist eine visuelle Begleitung, kein separat bedienbarer Garvorgang.

## Einbindung

Die Dateien `kueche-loader.js`, `kueche-loader.css` und `kueche-scene.js` aus der Vorlage bleiben erhalten. Im gelieferten ZIP liegt der neue Spieleinstieg weiterhin unter `Kueche/kueche/kueche.html`. Den kompletten Ordner im bisherigen Projekt austauschen. Die bestehende A-Frame-Szene wird weiter über `kueche-scene.js` gestartet.

Das Spiel verwendet JavaScript-Module und muss über HTTP(S) bereitgestellt werden. Ein direkter `file://`-Doppelklick wird von Browsern blockiert. Zum lokalen Test im entpackten Ordner `python3 -m http.server 8080` ausführen und `http://localhost:8080/Kueche/kueche/kueche.html` öffnen. WebGL muss verfügbar sein. Google Fonts ist optional; ohne Netzwerk greifen Systemschriften. Alle Bilder und die 3D-Engine liegen im Paket.

## Bildmaterial

Küchenhintergrund: KI-generiert, fotorealistische Atelierküche mit leerer Walnussinsel, hellem Stein, warmem Tageslicht und Messingarmatur. Mit dem integrierten Bildgenerator erstellt. Die Gerichtefotos von Unsplash dienen als Servierideen, nicht als Screenshot oder exakte Abbildung des simulierten Ergebnisses. Bildquellen stehen in `BILDQUELLEN.md`.

## Prüfung

JavaScript-Syntax geprüft; lokale Asset-Verweise geprüft. Funktionsprüfungen bestanden: Gewichtstoleranz, Übergewichtskorrektur, untere Gewichtsgrenze, Schneidfortschritt, Zutatenvoraussetzung, Salatmischen, Garniturvoraussetzung und Reinigung. Lokale Vorschau-Infrastruktur nicht verfügbar; die privat veröffentlichte Seite verlangte im Testbrowser eine Anmeldung. Daher keine vollständige visuelle oder End-to-End-Browserprüfung bestätigt.
