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
- Phase 3 – Animationsfundament: **PASS**
- Nächste Phase: **Phase 4 – Lernkarte und Meisteraufgaben**
- Phase-1-Validierung: GitHub Actions `32307481759` = `success`
- Phase-2-Validierung: GitHub Actions `32308257027` = `success`
- Phase-3-Validierung: GitHub Actions `32309129223` = `success`
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

Kernmodule:

- `src/game/gameState.ts`
- `src/game/gameEvents.ts`
- `src/game/gameMachine.ts`

Die State Machine ist noch nicht als aktive Gameplay-Runtime eingeschaltet. `v2StateMachine` bleibt `false`. Eingaben werden außerhalb erlaubter Lernzustände abgewiesen. Der Reducer enthält keine Timer.

## Phase-3-Animationsfundament

Kernmodule:

- `src/game/animationController.ts`
- `src/game/battleAnimations.ts`
- `src/game/animationEffects.ts`
- `src/styles/animations.css`

Eigenschaften:

- Promise-basiertes Warten auf `animation.finished`,
- Sicherheits-Timeout gegen blockierte Animationen,
- `AbortSignal` für kontrollierte Abbrüche,
- Fehler und fehlende Targets führen zu sicheren Ergebnissen statt Absturz,
- `prefers-reduced-motion` nutzt einen kurzen Low-Motion-Pfad,
- Animationen verändern den Game State nicht eigenständig,
- semantische Sequenzen für richtigen/falschen Buchstaben, Wortlösung, Bossintro und Boss-Sieg.

`enhancedAnimations` bleibt weiterhin `false`. Die Legacy-Oberfläche bleibt unverändert, bis der echte V2-Pfad kontrolliert aktiviert wird.

## Teststatus

Alle verpflichtenden Gates sind grün:

- npm ci
- Lint
- Astro/TypeScript Typecheck
- Unit Tests
- AnimationController: finished / timeout / abort / reduced motion / Fehlerpfade
- Integration / State-Machine-Parität
- Animation-Effect-Mapping
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
- `docs/PHASE_3_ANIMATIONS.md`
- `docs/ci/phase1-status.md`
- `docs/ci/phase2-status.md`
- `docs/ci/phase3-status.md`

## Kritische Regressionstests
1. Boss 1 starten.
2. Drei Wörter lösen.
3. Boss 2 Intro öffnen.
4. `Bosskampf starten` auf iPhone muss reagieren.
5. Nach Bossstart muss die Ansicht oben am Spiel stehen.
6. Bossgrafik muss in Intro, Arena und Route sichtbar sein.
7. Kein wachsender Leerraum / unkontrolliertes Scrollen nach neuen Wörtern.

## Phase 4 – verbindlicher nächster Schritt

Phase 4 implementiert die Lernkarte und erste Meisteraufgaben getrennt von Kampfanimation und UI.

Pflicht:

- typisiertes `WordEntry`-Datenmodell,
- Bedeutung / Übersetzung / Hinweis / Beispielsatz als strukturierte Lerndaten,
- Aussprache-Schnittstelle ohne Autoplay-Zwang,
- kurze Mastery Challenges,
- mindestens Bild-/Übersetzungs-/Artikel-/Satz-geeignete Aufgabentypen vorbereiten,
- Lernstatus getrennt vom reinen Bossfortschritt speichern,
- keine stille Änderung an drei Wörtern pro Boss,
- keine Aktivierung im Legacy-Pfad.

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
