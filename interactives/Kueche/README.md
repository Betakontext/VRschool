# Küchen-Spielmodul

Extraktion des in `index02.txt` enthaltenen **MENSA / KOCH-AG**-Spiels (V117–V133; finale Spiel-Logik V133). Das Spiel läuft lokal im Iframe; `kueche/assets/mg-cook-logo.jpg` wurde aus dem ursprünglichen eingebetteten Data-URI lokalisiert. Der Bridge-Code ergänzt ausschließlich Start/Schließen zwischen Iframe und Loader.

## Einbindung 1 – in den Head, **nach** A-Frame
```html
<script defer src="interactives/Kueche/kueche-loader.js"></script>
<script src="interactives/Kueche/kueche-scene.js"></script>
```

## Einbindung 2 – direkt in `#panel-Kueche` (die Plane liegt am selben Entity)
```html
<a-entity id="kueche-start" kueche-start class="link clickable" position="0 1.6 -3">
  <a-plane geometry="primitive: plane; width: 2.6; height: 1.25" material="color: #159ed0; shader: flat"></a-plane>
  <a-text value="Küchenabenteuer starten" align="center" color="#fff" position="0 0 .02"></a-text>
</a-entity>
```

`kueche-start` prüft bei jeder Panel-Änderung `#panel-Kueche`; nur bei sichtbarem Panel trägt das Start-Entity die Klickklassen `.link` und `.clickable`. Es wird kein `raycaster.refreshObjects` verwendet. `openKuecheModule()` und `closeKuecheModule()` sind optional global verfügbar.

## Finales Paketlayout
Alle Spieldateien liegen unter `interactives/Kueche/kueche/`. Der Loader lädt das Iframe relativ zu seiner eigenen URL als `kueche/kueche.html`; daraus ergibt sich im finalen Layout `interactives/Kueche/kueche/kueche.html`. Die Spielseite lädt `kueche.css`, `kueche.js` und `assets/mg-cook-logo.jpg` jeweils relativ zu diesem Ordner.

Siehe `PRUEFBERICHT.md` für die tatsächlich ausgeführten Prüfungen und Grenzen.
