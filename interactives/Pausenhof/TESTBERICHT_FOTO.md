# TESTBERICHT_FOTO – Pausenhof Sport-Arena mit Kontaktanimationen

**Erstellt:** 2026-11-02 · **Testumgebung:** lokaler Python-HTTP-Server, Chromium headless (Playwright), Linux.

## Umsetzung
Die tatsächlich vom Paket geladene Datei `pausenhof/pausenhof.js` enthält innerhalb derselben IIFE einen begrenzten Effektpuffer (`fx`), `emit(x,y,color)` und `paintFX(c)`. Der Puffer fasst höchstens 24 Effekte; jeder nutzt `a.t` und lebt unter 0,4 Sekunden. Beim Spielstart wird er geleert. Die Effekte werden am Ende von `draw()` nach sämtlichen Spielfeldobjekten gezeichnet.

Treffer-/Kontaktanimationen sind für Elfmeter, Basketball, Tischtennis (Schläger, Wand, Boden), Dodgeball, Weitsprung, Zielwurf, Reaktionswand, Balance, Fitness-Rhythmus und Zeitstopp an den jeweiligen sichtbaren Kontaktpunkten eingebaut. `prefers-reduced-motion: reduce` zeichnet ausschließlich einen statisch größer werdenden, ausblendenden Ring und keine Funkenstrahlen.

Die Hintergrund-Reihenfolge ist quellengeprüft: zuerst das deckende Theme, danach innerhalb von `save()/restore()` das lokale Foto bei exakt `globalAlpha=.5`; Spielobjekte und FX werden anschließend wieder deckend gezeichnet. Assets bleiben lokal; das umgebende iframe wurde nicht verändert.

## Prüfungen – bestanden
- `node --check pausenhof/pausenhof.js`: bestanden.
- Quellassertionen: 20 Prüfpunkte für Puffer, Laufzeit, Obergrenze, Reduced-Motion-Zweig, Hintergrundreihenfolge, Zeichnungsreihenfolge und alle geforderten Auslöser: bestanden.
- Playwright-Interceptionstest: ein testweise nur in die ausgelieferte Netzwerkantwort injizierter Getter sah nach einem echten Elfmeter-Klick einen Effekt (`length=1`) und nach mehr als 0,6 Spielsekunden seit dem letzten Kontakt keinen (`length=0`). Der Test lief normal und mit reduzierter Bewegung; im reduzierten Zweig wurde der funkenfreie Ringpfad bestätigt. Der Getter ist nicht in der gelieferten JS-Datei enthalten.
- Abschließender Smoke-10: alle zehn Spiele wurden gestartet, erhielten Pointer-Eingaben, zeichneten ein nichtleeres Canvas und kehrten im selben iframe zurück. Pause/Fortsetzen sowie äußeres Schließen/erneutes Öffnen bestanden. Alle zehn lokalen WebP-Hintergründe dekodierten. Keine `console.error`, `console.assert` oder `pageerror`.

## Umfang
Der Smoke-Test ersetzt keine vollständigen, zufalls- und zeitabhängigen Durchläufe aller Spiele bis zu jedem Ergebnisdialog. Physik, Punktevergabe und Spielregeln wurden für die FX-Ergänzung nicht geändert.
