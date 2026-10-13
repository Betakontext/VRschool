# Küchen-Spielmodul

Lokales **MENSA / KOCH-AG**-Spiel im Iframe. Der Loader ergänzt nur das Öffnen und Schließen; sein CSS wird beim Laden automatisch in den Host-`head` eingefügt.

## Einbindung 1 – `head`, nach A-Frame

Binde die Szenen-Komponente **nach** dem A-Frame-Skript ein:

```html
<script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
<script src="interactives/Kueche/kueche-scene.js"></script>
```

## Einbindung 2 – direkt innerhalb von `#panel-Kueche`

```html
<a-entity id='kueche-start' kueche-start geometry='primitive: plane; width: 1.8; height: 0.65' material='shader: flat; color: #159ed0; side: double' position='0 -0.9 0.04'>
  <a-text value='Koch-AG starten' width='2.7' align='center' anchor='center' position='0 0 0.02'></a-text>
</a-entity>
```

Der Startbutton ist damit selbst eine geometrische `a-entity`; sein einziges Kind ist der Text. Keine statischen Klassen wie `.link` oder `.clickable` eintragen: `kueche-scene.js` setzt und entfernt diese Klassen ausschließlich auf dem Root `#kueche-start`, sobald `#panel-Kueche` sichtbar bzw. verborgen ist.

## Einbindung 3 – am Ende von `body`

```html
<script defer src="interactives/Kueche/kueche-loader.js"></script>
```

Der Loader fügt `kueche-loader.css` automatisch ein und öffnet das Spiel aus `interactives/Kueche/kueche/kueche.html`. `openKuecheModule()` und `closeKuecheModule()` stehen optional global bereit.

## Paketlayout

Alle Spielressourcen liegen unter `interactives/Kueche/kueche/`. Die Spielseite lädt CSS, JavaScript und `assets/mg-cook-logo.jpg` relativ zu diesem Ordner. Siehe `PRUEFBERICHT.md` für frühere Extraktionshinweise.
