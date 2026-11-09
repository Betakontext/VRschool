# Kunstraum · Vorlage zur Weiterentwicklung

Eigenständiges iframe-Modul unter `interactives/Kunstraum/`. Es ist ein gestalteter, navigierbarer Starter und **keine bereits vorhandene Kunst-Anwendung**. Die interne Übersicht und der Atelier-Überblick bleiben im selben iframe.

Der Loader verwendet ausschließlich lokale, zu seinem Skript relative URLs, bindet seine CSS einmal ein und prüft beim Handshake Origin, Fensterquelle und iframe-Ziel. Das äußere × bleibt beim Laden, bei Fehlern und nach interner Navigation erreichbar.
