# Grafik-Änderungen und Teststatus

Die zehn lokalen WebP-Fotos unter `pausenhof/assets/backgrounds/` bleiben Teil des Pakets und werden nun zur Laufzeit tatsächlich im Canvas verwendet. Je Spiel lädt `BG[kind]` das passende thematische Foto; `draw()` zeichnet es vor der prozeduralen Gestaltung. `theme()` wird als Effekt mit `globalAlpha=.5` darübergelegt. Die genaue Zuordnung, Quellen und der tatsächlich ausgeführte Browser-Smoke stehen in `TESTBERICHT_FOTO.md`; frühere Behauptungen, es gebe keine Bilder bzw. nur prozedurale Hintergründe, sind überholt.
