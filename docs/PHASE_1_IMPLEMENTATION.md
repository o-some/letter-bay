# Letter Bay V2 – Phase 1 Implementation

Status: **PASS – QUALITY GATE GREEN**

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

## Validierung

Finaler isolierter Phase-1-Validierungslauf:

```text
GitHub Actions Run: 32307481759
Job: quality
Conclusion: success
```

Ergebnisse:

- npm/Lockfile: PASS
- npm ci: PASS
- Lint: PASS
- Typecheck: PASS
- Unit Tests: PASS
- Legacy Contract: PASS
- Astro Build: PASS
- Asset Integrity: PASS
- Browser Installation: PASS
- E2E WebKit/iPhone: PASS
- E2E Chromium/Desktop: PASS
- Boss 1 -> Boss 2: PASS
- Bossbilder Intro/Route/Arena: PASS
- Scroll-Clamp im E2E: PASS

Der temporäre Validierungs-PR wurde nach erfolgreichem Test geschlossen und nicht gemerged.

## Phase-1-Gate

**BESTANDEN.**

Phase 2 darf auf `feature/letter-bay-v2` beginnen. `main` und der Rollback-Branch bleiben unverändert. Die neue State Machine wird zunächst mit Feature Flag implementiert und darf das bestehende Verhalten nicht verändern.
