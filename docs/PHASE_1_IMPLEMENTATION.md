# Letter Bay V2 – Phase 1 Implementation

Status: **IMPLEMENTED / CI VALIDATION PENDING**

## Ziel

Phase 1 baut ausschließlich die sichere technische Grundlage aus der V2-Spezifikation:

- Astro-Grundstruktur,
- GitHub-Pages-Base `/letter-bay/`,
- expliziter Legacy-Fallback,
- expliziter `?engine=v2`-Kompatibilitätseinstieg,
- CI-Grundlage,
- Unit-/E2E-Basis,
- Asset-Integritätsprüfung,
- unverändertes Gameplay während der Architektur-Migration.

## Sicherheitsprinzip

Die aktuelle Legacy-Runtime wird unter `public/legacy/` unverändert weitergeführt. V2 implementiert in Phase 1 **noch keine neue Spiellogik**.

Routing:

```text
/letter-bay/                 -> legacy (sicherer Standard)
/letter-bay/?engine=legacy   -> legacy
/letter-bay/?engine=v2       -> V2-Kompatibilität -> legacy
```

Damit bleibt der Parity Contract erhalten, während Phase 2 die State Machine separat aufbauen kann.

## Assets

Die zehn individuellen Boss-PNGs und die Tula-/Weltassets liegen sowohl unter `public/assets/` für V2 als auch unter `public/legacy/assets/` für die unveränderte Legacy-Runtime.

## CI

CI prüft:

1. Lockfile/Installation,
2. Lint,
3. Astro/TypeScript-Diagnostik,
4. Unit Tests,
5. Legacy Contract,
6. Astro Build,
7. Asset-Signaturen,
8. Playwright auf WebKit/iPhone-Viewport und Chromium/Desktop,
9. Boss 1 -> Boss 2,
10. Bossbilder in Intro/Route/Arena.

## Stop-Gate

Phase 1 gilt erst als abgeschlossen, wenn CI grün ist und die Phase-1-E2E-Tests die Bossbilder sowie Boss 1 -> Boss 2 erfolgreich bestätigen.
