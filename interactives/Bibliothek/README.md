# Bibliothek-Modul

Isoliertes Spiel **„QUINOA BIBLIOTHEK“ / Bibliothek Escape-Abenteuer**. Sämtliche Moduldateien liegen unter `interactives/Bibliothek/`; das Spiel wird same-origin in einem Iframe geöffnet. Die Spielbilder liegen lokal in `bibliothek/assets/`.

## Paketbaum
```text
interactives/Bibliothek/
├── README.md
├── PRUEFBERICHT.md
├── QUELLE.md
├── bibliothek-loader.js
├── bibliothek-loader.css
├── bibliothek-scene.js
└── bibliothek/
    ├── bibliothek.html
    ├── bibliothek.css
    ├── bibliothek.js
    └── assets/
        ├── embedded-1.jpg
        └── embedded-2.jpg
```

## Integration
Die Pfade sind vom Dokument aus zu lesen, das die Schultour ausliefert. Beide Dateien befinden sich im Paket unter `interactives/Bibliothek/`.

```html
<!-- nach A-Frame im Head -->
<script src="interactives/Bibliothek/bibliothek-scene.js"></script>

<!-- am Ende des Body -->
<script defer src="interactives/Bibliothek/bibliothek-loader.js"></script>
```

Füge im sichtbaren `#panel-Bibliothek` den A-Frame-Startbutton ein:
```html
<a-entity id="bibliothek-start" bibliothek-start position="0 1.6 -3" role="button" tabindex="0">
  <a-plane geometry="primitive: plane; width: 2.8; height: 1.15" material="color:#315e72; shader:flat"></a-plane>
  <a-text value="Bibliotheksabenteuer starten" align="center" color="#fff" position="0 0 .02"></a-text>
</a-entity>
```

`bibliothek-start` wird nur bei sichtbarem `#panel-Bibliothek` klickbar und ruft `openBibliothekModule()` auf. Der Loader öffnet exakt die neben ihm liegende Datei `bibliothek/bibliothek.html` (aufgelöst relativ zu `bibliothek-loader.js`).
