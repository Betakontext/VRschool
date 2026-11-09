# QUINOA – Das Schattenarchiv

## Spiel starten
1. ZIP entpacken (nicht im ZIP öffnen).
2. `Bibliothek/bibliothek/bibliothek.html` in Chrome, Edge oder Firefox öffnen.
3. Wenn du das Spiel in ein größeres Projekt einbaust, ersetze dort den **gesamten Bibliothek-Ordner**. Alte Dateien im Browser ggf. mit Strg+Shift+R neu laden.

## Rätsel
Freie Erkundung, vier Zahlen, eine Reihenfolge und ein versteckter Messingschlüssel. Der Globus wurde entfernt und die mittlere Schreibtischschublade ersetzt das Fundstück. Die Tür selbst ist nicht anklickbar; das Tastenfeld rechts daneben ist der Zugang.

## Atmosphäre
Regen am Fenster und Echtzeituhr mit drei Zeigern; alte Papier-Hinweise mit stufenweiser Freischaltung. Logo: vom Nutzer bereitgestellt.


## MASTER-EDITION
Öffne `bibliothek/bibliothek.html` direkt im Browser. Der gerahmte Plan im Raum ist eine Atmosphäre- und Rätselkomponente; alle Fundstücke, Tastenkombinationen und Hinweisstufen funktionieren wie zuvor.

Exit-Fix: Rotes X und „Verlassen“ beim Sieg beenden die Bibliothek. Im Hauptprojekt wird das Overlay geschlossen; bei direkt geöffneter HTML-Datei wird die Spielseite verlassen (about:blank), da Browser normale Tabs nicht zuverlässig per JavaScript schließen lassen.


Wichtig: Zur echten Bibliotheks-Fotoansicht zurueckkehren funktioniert, wenn das Spiel ueber bibliothek-loader.js im Hauptprojekt geoeffnet wird. Der Loader liegt dieser ZIP bei. Bei direkt per Doppelklick gestarteter Einzel-HTML gibt es keine uebergeordnete Fotoansicht: dann schliesst sich das Spiel bzw. wechselt zu einer leeren Seite.


## Neue Zufallscodes
Bei jedem neuen Laden des Spiels wird aus vier unterschiedlichen Ziffern ein neuer Code erzeugt. Fundorte und Hinweise zeigen die aktuellen Ziffern, das Schloss akzeptiert nur genau diese Kombination. Bei erneutem Spielstart wird neu gewuerfelt. Die letzte Kombination wird lokal im Browser gespeichert, um eine direkte Wiederholung zu verhindern.


## Interaktive Rätsel (09.11.2026)
Regal: schmalen Buchrücken mit Stern in der Detailansicht identifizieren und wählen. Uhr: Sanduhrprägung der Messingplakette auswählen. Fluchtplan: die verkratzte Unterkante des Rahmens untersuchen. Teppich: die sichtbar umgeschlagene Ecke anheben (Position wechselt je Spielrunde). Schreibtisch: Papiere zur Seite bewegen, hohl klingendes Brett prüfen, Kerbe lösen. Die vier Zahlen und die Anordnung des gesuchten Buchs wechseln weiterhin bei jedem Spielstart. Alle vier Gegenstände bleiben unabhängig untersuchbar.
