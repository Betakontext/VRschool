# Quinoa Küchenatelier · Stand 9 · Reparierte Schnitt-Erkennung

## Einbau

ZIP vollständig entpacken. Den enthaltenen Ordner `Kueche` im Schulprojekt unter `interactives` ersetzen und die Seite mit Strg+F5 neu laden. Einstieg und Loader bleiben kompatibel: `interactives/Kueche/kueche/kueche.html`. Alle Spielressourcen liegen lokal im Paket.

## Start und Rezept

Die Begrüßung bietet die fünf Gerichte zur Auswahl an. Nach der Auswahl bleiben die anderen Gerichte gesperrt, bis die Runde mit Anrichten und Aufräumen abgeschlossen ist. „Neu beginnen“ startet dasselbe Gericht neu. Nach dem Abschluss sind die anderen Gerichte wieder frei.

Die Stationen wechseln automatisch, sobald die Aufgabe wirklich erledigt ist. Die laufende Aufgabe steht unter der Küche; markierte Zielbereiche helfen beim Ablegen. Für die Mausaktionen bleiben alternative Bedientasten vorhanden.

## Waschen und selbst schneiden

Jede Zutat einzeln wählen und unter dem Wasserstrahl waschen. Nur diese Zutat wird gezählt.

Das Messer am Griff anklicken/antippen. Danach folgt es der Maus frei über die Arbeitsfläche. Die Klinge über eine Zutat bewegen; zum Schneiden die Maustaste gedrückt halten und hoch/runter bewegen. Nur Zutaten unter der Klinge werden geschnitten. Nach dem letzten Schnitt den Griff zur markierten Ablage rechts führen und dort ablegen. Erst dann beginnt das Wiegen. Ohne 3D-Grafik: Arbeitsfläche fokussieren, Enter zum Aufnehmen, ↑/↓ zum Schneiden, Escape zum Ablegen.

Erdbeeren haben eine spitz zulaufende Form, kleine Samen und einen Blattkelch. Gurken haben einen länglichen Körper, Schale und helle Schnittflächen mit Kernen. Die Farben bleiben beim Schneiden erhalten. Glasschüssel, Rührschüssel und Salatschüssel stehen außerhalb der Schneidefläche.

## Wiegen und Zutaten transportieren

Die beschriftete Packung greifen, über die Glasschüssel ziehen und dosieren. Das Ziel steht in Gramm, zum Beispiel 120 g. Bei passendem Gewicht loslassen. Die gefüllte Schüssel und alle Schnittstücke bleiben sichtbar; sie werden beim Stationswechsel nicht gelöscht.

Zum Zugeben die gefüllte Glasschüssel greifen und über dem passenden Gefäß loslassen. Das Auskippen ist sichtbar animiert. Danach steht die leere Glasschüssel wieder auf der Waage. Geschnittenes Gemüse mit dem Schneidebrett zum Kochgefäß bewegen und dort auskippen. Zu frühe oder falsche Umfüllversuche verändern die Zutaten nicht; die Vorbereitung wird wieder sicher abgestellt.

## Nudelgericht mit der Maus

Der leere Topf steht von Anfang an auf dem hinteren Kochfeld.

1. Topf greifen und unter dem Wasserhahn abstellen.
2. Wasserhahn gedrückt halten und 1.000 ml füllen.
3. Topf zurück auf das hintere Kochfeld bewegen.
4. Herdregler drehen, bis das Wasser kocht. Der Regler ist sowohl direkt am Herd als auch in der Bedienleiste bedienbar.
5. Die Glasschüssel mit den gewogenen Nudeln zum kochenden Topf bewegen und auskippen.
6. Die Nudeln garen lassen. Hitze, Blasen und Dampf zeigen den Vorgang.
7. Topf über dem Becken auskippen: Das Wasser läuft ab, die Nudeln bleiben darin.
8. Den Topf selbst zur Pfanne bewegen und die Nudeln hineinkippen.
9. Pfanne erhitzen und das vorbereitete Gemüse vom Schneidebrett dazugeben.
10. Den Löffel aufnehmen und durch die Pfanne bewegen. Zutaten und Nudeln bewegen sich mit.
11. Benutzten Topf und Löffel selbst ins Becken stellen.
12. Aus der Pfanne auf den Teller portionieren und anschließend aufräumen.

## Die anderen Gerichte

- Curry: Gewogenen Reis aus der Glasschüssel in den Reiskocher geben, starten und Gemüse-Curry separat zubereiten. Das Schnittgemüse kommt mit dem Brett in die Pfanne.
- Suppe: Brühe aufsetzen, erhitzen und gewogene Kartoffeln sowie Schnittgemüse aus den jeweiligen Gefäßen dazugeben.
- Pfannkuchen: Gewogenes Mehl in die Rührschüssel geben, mit dem Schneebesen durch Mausbewegungen mischen, Schüssel über der heißen Crêpeplatte auskippen und den Pfannkuchen mit dem Pfannenwender wenden. Beim Anrichten die geschnittenen Beeren vom Brett auf den Teller geben.
- Salat: Gewogenen Salat und Schnittgemüse in die kalte Salatschüssel geben und behutsam mischen. Die Schüssel steht hinter dem Schneidebereich.

## Anrichten, Putzen und Darstellung

Das Kochgefäß bzw. den Pfannenwender zum Teller ziehen und dort loslassen. Die drei Portionierbewegungen leeren das Kochgefäß. Die freigestellten Tellergrafiken ohne Foto-Tischhintergrund bleiben erhalten. Die Bilder sind fotorealistische KI-Bearbeitungen; das Spiel erzeugt kein echtes Foto des simulierten Kochergebnisses. Quellen und Bearbeitungshinweis: BILDQUELLEN.md.

Der zusammenhängende gelb-grüne Schwamm reinigt nur berührte Flecken. Auf einer sauberen Fläche entstehen weder zusätzlicher Reinigungsfortschritt noch neue Wischspuren. Ein dezenter Ring markiert den nächsten Fleck. Feuchte Spuren verblassen. Die Runde endet automatisch, wenn die benutzten Utensilien abgelegt und die Flecken entfernt sind.

## Prüfung

Der vollständige Spielcode mit der lokalen Three.js-Geometrie wurde automatisiert mit simuliertem Renderer geprüft. Alle fünf Gerichte sind sowohl im Maus-Eingabetest als auch mit Tastatur-/Bedienhilfen abgeschlossen worden. Besonders geprüft: Begrüßung; sofortige Rezept-Sperre und Freigabe am Ende; freie Messerführung; nur getroffene Zutaten schneiden; eigene Messerablage als Voraussetzung; Gramm-Wiegen; sichtbare Vorbereitung beim Stationswechsel; Umfüllen ohne sofortiges Verschwinden; falsche Reihenfolgen ohne Zutatenverlust; Topf von Beginn an auf dem Herd; Wasserhahn und Herdregler; selbst bewegter Topf beim Abgießen und Umfüllen; Rührbewegung; Pfannkuchen-Vorbereitung; leere Kochgefäße nach dem Anrichten; örtliches Reinigen und automatischer Abschluss. Syntax, Dateien und ZIP-Integrität wurden geprüft.

Die Vorschau-Infrastruktur war hier nicht verfügbar. Eine vollständige visuelle Browser- und Geräteprüfung ist deshalb nicht bestätigt. Das Fenster verwendet weiterhin die adaptive, platzsparende Anordnung. Garzeit und Temperaturverhalten sind für das Spiel verkürzt und keine Anleitung zur tatsächlichen Lebensmittelsicherheit.

## Schnitt-Reparatur · Stand 9

Die vorige Schnittprüfung verwendete einen einzelnen Punkt an der Klinge und zählte den Schnitt erst fast auf Bretthöhe. Dadurch konnte die sichtbare Schneide eine Zutat durchqueren, ohne dass das Spiel einen Schnitt registrierte.

Jetzt prüft das Spiel die gesamte geschärfte Kante einschließlich Spitze und Ferse, die räumlichen Grenzen des sichtbaren Zutatenkörpers und den Bewegungsweg der Schneide zwischen den Mausmeldungen. Ein tatsächlicher Abwärtskontakt zählt auch vor dem Erreichen des Bretts. Auch schnelle Bewegungen, bei denen die Klinge zwischen zwei Meldungen ganz durch die Zutat läuft, werden erkannt. Pro Abwärtsbewegung wird ein Schnitt gezählt; für einen weiteren Schnitt muss die Klinge wieder angehoben werden. Reines Anheben, Stillhalten oder Bewegen durch leeren Raum erzeugt keinen Schnitt.

Im Spiel steht oben `Stand 9`. Beim Einbau den ganzen Küchenordner ersetzen und mit Strg+F5 neu laden, damit nicht die alte JavaScript-Datei verwendet wird. Die übrigen Kochabläufe wurden beibehalten.

Gezielte Regressionsprüfungen: Kontakt am äußeren Ende der Schneide außerhalb des früheren Prüfpunkts; kurze Schnitte vor Bretthöhe bei Tomate, Erdbeere, Gurke und Salat; Erkennung eines schnellen vollständigen Durchgangs zwischen zwei Mausmeldungen; keine Mehrfachzählung beim Niederhalten oder kleinen Zittern; kein Schnitt beim Anheben, Stillhalten oder neben Zutaten. Zusätzlich sind alle fünf Rezepte im automatisierten Maus-/Geometrietest und im Tastatur-/Ersatzmodus abgeschlossen worden. Der Renderer ist in diesen Tests simuliert; ein visueller Test auf deinem Gerät ist damit nicht bestätigt.

## Stand 10 · Direkte Mausbewegung
Messer einmal am Griff aufnehmen. Über einer Zutat bleibt die Klinge zum Schneiden fixiert. Die Maus ohne gedrückte Taste hoch und runter bewegen. Seitlich bewegen, um die nächste Zutat anzusteuern. Zum Zurücklegen die markierte Ablage anklicken. Ein Klick allein erzeugt keinen Schnitt und setzt den Schnittzyklus nicht zurück. Pfeiltasten bleiben verfügbar.
