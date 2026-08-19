# Letter Bay – Handoff

## Zweck
Sprachlern-Minispiel für Tula’s Island. Wörter werden gegen eine Piratenflotte gelöst.

## Repository
`o-some/letter-bay`

## V2 Entwicklungsstatus

- Baseline `main`: `12c65e56c8f6ec842c643f5a6f236b415603c0d6`
- Sicherer Rollback-Branch: `backup/letter-bay-before-v2-20260819`
- V2-Arbeitsbranch: `feature/letter-bay-v2`
- Phase 0: **PASS**
- Phase 1 – Testnetz und Kompatibilität: **PASS**
- Nächste Phase: **Phase 2 – State Machine**
- Finaler Phase-1-Validierungslauf: GitHub Actions `32307481759` / `quality` = `success`
- `main` darf während der V2-Entwicklung nicht direkt beschrieben werden.
- Kein Merge ohne ausdrückliche Freigabe.

## Source Migration
- Quelle: `o-some/tulasisland/public/letter-bay/`
- Source Commit: `892f676fbcef77ab49373aef7865d60afba0ebb7`
- Rollback-Branch Quelle: `pre-extraction-letter-bay-20260819`

## Plattform
- iPhone Safari – kritisch
- Android Chrome
- Desktop Chrome/Safari
- Mobile-first

## Aktuelle Kernfunktionen / Bestandsschutz
- Wortspiel mit A–Z/Ä/Ö/Ü
- Ganzwort-Lösung
- HP für Tula und Boss
- 10 Boss-Level
- Hinweis und Muschel-Joker
- Bosswechsel
- Sieg/Niederlage
- positive Rückmeldungen
- Boss-Intro
- Piratenflotten-Route

## Phase-1-Architektur

Die Legacy-Runtime bleibt unverändert unter `public/legacy/` erhalten. Astro dient nun als sichere Kompatibilitätsschicht mit GitHub-Pages-Base `/letter-bay/`.

Routing:

```text
/letter-bay/                 -> Legacy als sicherer Standard
/letter-bay/?engine=legacy   -> Legacy
/letter-bay/?engine=v2       -> V2-Kompatibilität -> Legacy
```

Neue V2-Funktionen bleiben per Feature Flags standardmäßig deaktiviert, bis ihre jeweilige Phase vollständig getestet ist.

## Phase-1-Teststatus

Alle verpflichtenden Gates sind grün:

- Lockfile / npm ci
- Lint
- Astro/TypeScript Typecheck
- Unit Tests
- Legacy Contract
- Astro Build
- Boss-/Asset Integrity
- Playwright Chromium Desktop
- Playwright WebKit iPhone-Viewport
- Boss 1 -> Boss 2
- Bossbilder in Intro, Route und Arena
- Scroll-Clamp

Details: `docs/PHASE_1_IMPLEMENTATION.md` und `docs/ci/phase1-status.md`.

## Kritische Regressionstests
1. Boss 1 starten.
2. Drei Wörter lösen.
3. Boss 2 Intro öffnen.
4. `Bosskampf starten` auf iPhone muss reagieren.
5. Nach Bossstart muss die Ansicht oben am Spiel stehen.
6. Bossgrafik muss in Intro, Arena und Route sichtbar sein.
7. Kein wachsender Leerraum / unkontrolliertes Scrollen nach neuen Wörtern.

## Wichtige Dateien
- `package.json`
- `astro.config.mjs`
- `tsconfig.json`
- `src/pages/index.astro`
- `src/pages/v2/index.astro`
- `src/game/featureFlags.ts`
- `src/game/compatRouter.ts`
- `public/legacy/index.html`
- `public/legacy/source.html`
- `docs/V2_BASELINE.md`
- `docs/V2_PARITY_CONTRACT.md`
- `docs/PHASE_1_IMPLEMENTATION.md`
- `tests/baseline/legacy-contract.mjs`
- `tests/e2e/phase1-compat.spec.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/pages.yml`

## Phase 2 – verbindlicher nächster Schritt

Phase 2 führt eine explizite, typisierte Game State Machine ein. Sie muss zunächst mit `v2StateMachine: false` integriert werden und darf die Legacy-Runtime nicht verändern. Erst nach Unit-, Integration- und E2E-Parität darf die Flag im V2-Pfad testweise aktiviert werden.

Zentrale Ziele:

- explizite Zustände statt `done` + Timer-Kaskaden,
- zentraler Game State,
- zentralisierte Events,
- Eingaben ausschließlich in zulässigen Zuständen,
- keine dauerhaft blockierenden Übergänge,
- Boss 1 -> Boss 2 als verpflichtender Regressionstest.

## Regeln für Codex/ChatGPT
- Ausschließlich dieses Repo bearbeiten.
- Vor jedem Write aktuellen `main` neu lesen.
- Nur auf `feature/letter-bay-v2` arbeiten, solange V2 nicht freigegeben ist.
- Backup-Branch nicht verändern.
- Kein Force-Push.
- Keine funktionierende Funktion ohne bestandenen Ersatztest entfernen.
- Mobile und Bosswechsel nach Änderungen testen.
- `HANDOFF.md` und `CHANGELOG.md` nach jeder Phase aktualisieren.

## Do not touch
Die alte Kopie in `o-some/tulasisland` nicht löschen. `main` und `backup/letter-bay-before-v2-20260819` nicht verändern, solange keine separate Freigabe vorliegt.
