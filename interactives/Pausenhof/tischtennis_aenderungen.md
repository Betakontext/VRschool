# Tischtennis – Änderung und Prüfbericht

## Umgesetzt
- **Nur Tischtennis in `pausenhof/pausenhof.js`** sowie dessen Spielbeschreibung/Bedienhinweis geändert. Die drei anderen Kacheln und ihre Spielzweige, alle lokalen Fotos, `interactives/Pausenhof`-Struktur, Loader, äußeres X und die interne Auswahl wurden nicht verändert.
- Maus steuert den roten unteren Schläger horizontal. Die Position wird mit begrenzter Geschwindigkeit angefahren, sodass auch ein Sprung des Mauszeigers nicht als Schläger-Teleport wirkt.
- Beide Schläger sind als Tischtennisschläger gezeichnet: sichtbarer Holzrand und Griff, Schatten sowie ovale rote bzw. schwarze Belagfläche.
- Kollisionsprüfung verwendet Ballkreis gegen die sichtbare Belagellipse (mit Randdistanz), keine Rechtecktrefferfläche. Physik wird in höchstens 5-Canvas-Pixel-Schritten integriert; das verhindert Tunneln bei schnellen Bällen. Ein Kontakt-Lock unterbindet Mehrfachtreffer, bis der Ball die Schlägerzone verlassen hat.
- Abprallwinkel folgen der relativen Trefferposition; die Schlägerbewegung wirkt moderat auf die X-Komponente. Die Ballgeschwindigkeit wächst pro Schlägerkontakt und ist auf 560 begrenzt.
- Der Gegner nimmt seinen Zielpunkt nur in Reaktionsintervallen neu auf, erhält dabei einen zeitlich stabilen Zufallsfehler, und fährt höchstens 260 px/s. Er kann daher ehrlich verfehlen; keine Zufalls-Teleports. Treffer, Fehlwürfe und Gegnerfehler nutzen die vorhandenen `emit`-Kontakt-/Effekte.

## Prinzipien, keine Codeübernahme
Als reine Gestaltungsprinzipien berücksichtigt: kontaktpositionsabhängiger Abprallwinkel (PySDL2-Pong-Tutorial: https://pysdl2.readthedocs.io/en/latest/tutorial/pong.html) und schrittweise Beschleunigung mit Deckel (Kevin’s Guides: https://kevinsguides.com/guides/code/java/javaprojs/simple-2d-pong/). Es wurde kein externer Code oder Download verwendet.

## Prüfbericht (tatsächlich ausgeführt)
- `node --check` für alle Paket-JS-Dateien: bestanden.
- `node tischtennis_tests.js`: bestanden – Konturkontakt/knapp daneben, Geschwindigkeitsanstieg und 560-Deckel, keine Doppelberührung, begrenzter zufälliger Gegner.
- Vorhandener Chromium/Playwright-Integrationstest `vier_spiele_test.py`: bestanden (lokales Chromium verfügbar). Geprüft wurden die vier Auswahlen, Start/Rückkehr im selben iframe, Pause, äußeres Schließen/erneutes Öffnen sowie responsive/reduced-motion-Ablauf.
