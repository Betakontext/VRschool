# Einbau – Pausenhof iframe

`interactives/Pausenhof/` unverändert neben die bestehende Tour kopieren. Der vorhandene Aufruf `openPausenhofModule()` bleibt bestehen; Loader-Shell, CSS, Scene-Integration und same-origin-Handshake wurden beibehalten.

```html
<script src="interactives/Pausenhof/pausenhof-loader.js"></script>
<script src="interactives/Pausenhof/pausenhof-scene.js"></script>
```

Der Loader bindet seine CSS-Datei selbst ein. Child und Loader tragen `v=20250617` als Cache-Buster. Das äußere X schließt nur das iframe. Die dauerhafte Taste **Zur Spielauswahl** im Child wechselt ausschließlich die Child-Ansicht und sendet keinen Close-PostMessage.

## Die zehn Ein-Aktions-Spiele

1. Elfmeter: Eck-Fadenkreuz antippen. 2. Basketball: im grünen Zeitfenster loslassen. 3. Tischtennis: Schläger horizontal bewegen, automatischer Schlag. 4. Dodgeball: Bahn wechseln. 5. Weitsprung: einmal am Balken springen. 6. Zeitstopp: bei Zielzeit stoppen. 7. Zielwurf: Scheibe antippen. 8. Reaktionswand: grün, nicht rot. 9. Balance: links/rechts halten. 10. Fitness: links/rechts im Takt tippen.
