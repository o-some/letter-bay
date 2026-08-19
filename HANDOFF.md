# Letter Bay – Handoff

## Zweck
Sprachlern-Minispiel für Tula’s Island. Wörter werden gegen eine Piratenflotte gelöst.

## Repository
`o-some/letter-bay`

## V2 Entwicklungsstatus

- Baseline `main`: `12c65e56c8f6ec842c643f5a6f236b415603c0d6`
- Sicherer Rollback-Branch: `backup/letter-bay-before-v2-20260819`
- V2-Arbeitsbranch: `feature/letter-bay-v2`
- Phase 0 – Baseline: **PASS**
- Phase 1 – Testnetz und Kompatibilität: **PASS**
- Phase 2 – State Machine: **PASS**
- Nächste Phase: **Phase 3 – Animationsfundament**
- Phase-1-Validierung: GitHub Actions `32307481759` = `success`
- Phase-2-Validierung: GitHub Actions `32308257027` = `success`
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

## Bestandsschutz
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

Die Legacy-Runtime bleibt unverändert unter `public/legacy/` erhalten. Astro dient als sichere Kompatibilitätsschicht mit GitHub-Pages-Base `/letter-bay/`.

```text
/letter-bay/                 -> Legacy als sicherer Standard
/letter-bay/?engine=legacy   -> Legacy
/letter-bay/?engine=v2       -> V2-Kompatibilität -> Legacy
```

Neue V2-Funktionen bleiben per Feature Flags standardmäßig deaktiviert, bis ihre jeweilige Phase vollständig getestet ist.

## Phase-2-State-Machine

Neue Kernmodule:

- `src/game/gameState.ts`
- `src/game/gameEvents.ts`
- `src/game/gameMachine.ts`

Die State Machine ist aktuell noch nicht als aktive Gameplay-Runtime eingeschaltet. `v2StateMachine` bleibt `false`. Dadurch bleibt die Legacy-Oberfläche unverändert, während das neue Zustandsmodell separat getestet wird.

Abgedeckt sind unter anderem:

- `BOOTING`
- `LOADING_ASSETS`
- `BOSS_INTRO`
- `WORD_DISCOVERY`
- `PLAYER_INPUT`
- `WORD_SOLVED`
- `BOSS_HIT`
- `BOSS_DEFEATED`
- `LOSS`
- `PAUSED`
- `ERROR_RECOVERY`

Eingaben werden außerhalb erlaubter Lernzustände abgewiesen. Der Reducer enthält keine Timer.

## Teststatus

Alle verpflichtenden Gates sind grün:

- npm ci
- Lint
- Astro/TypeScript Typecheck
- Unit Tests
- Integration / State-Machine-Parität
- Legacy Contract
- Astro Build
- Boss-/Asset Integrity
- Playwright Chromium Desktop
- Playwright WebKit iPhone-Viewport
- Boss 1 -> Boss 2
- Bossbilder in Intro, Route und Arena
- Scroll-Clamp

Details:

- `docs/PHASE_1_IMPLEMENTATION.md`
- `docs/PHASE_2_STATE_MACHINE.md`
- `docs/ci/phase1-status.md`
- `docs/ci/phase2-status.md`

## Kritische Regressionstests
1. Boss 1 starten.
2. Drei Wörter lösen.
3. Boss 2 Intro öffnen.
4. `Bosskampf starten` auf iPhone muss reagieren.
5. Nach Bossstart muss die Ansicht oben am Spiel stehen.
6. Bossgrafik muss in Intro, Arena und Route sichtbar sein.
7. Kein wachsender Leerraum / unkontrolliertes Scrollen nach neuen Wörtern.

## Phase 3 – verbindlicher nächster Schritt

Phase 3 baut ein kontrolliertes Animationssystem. Keine Animation darf Spielzustände eigenständig oder über unkoordinierte Timer verändern.

Pflicht:

- zentraler `AnimationController`,
- Promise-basierter Abschluss,
- Sicherheits-Timeout je Animation,
- `prefers-reduced-motion`,
- richtige Buchstaben: Taste -> Wort -> Tula -> Boss,
- falsche Buchstaben: sanfter Bossangriff -> Tula-Reaktion,
- Wort gelöst: klarer Lern-/Treffer-Moment,
- Bossintro und Boss-Sieg nicht blockierend,
- bestehende Legacy-Runtime weiter unangetastet.

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
