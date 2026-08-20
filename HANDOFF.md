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
- Mobile One-Screen Layout Refinement: **PASS**
- Cinematic Boss Word Reaction: **PASS**
- Nächste Phase: **Phase 4 – Lernkarte und Meisteraufgaben**
- Phase-1-Validierung: GitHub Actions `32307481759` = `success`
- Phase-2-Validierung: GitHub Actions `32308257027` = `success`
- Phase-3-Validierung: GitHub Actions `32309129223` = `success`
- Mobile-Layout-Validierung: Commit `da5f34209da29bafd0b1f9f88f372f51e7965b7b` = alle CI-Gates `success`
- Boss-Reaction-Validierung: GitHub Actions `32386778964` = `success`
- Boss-Reaction-Teststand: `ab00b5024c76abfa6814249da1b934819dc80314`
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
/letter-bay/?engine=v2       -> V2 Runtime auf Legacy-Gameplaybasis
```

Neue V2-Funktionen bleiben per Feature Flags kontrolliert. Die verifizierten Flags `bossWordReaction` und `bossReactionDialogue` sind im V2-Pfad aktiviert; die Legacy-Route bleibt davon unberührt.

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

`enhancedAnimations` bleibt weiterhin `false`. Die Legacy-Oberfläche bleibt als funktionaler Fallback erhalten, bis der echte V2-Pfad vollständig freigegeben wird.

## Mobile One-Screen Layout

Die portrait-mobile Legacy-Kompatibilitätsansicht wurde als sichere Designverfeinerung kompakter gemacht, ohne Gameplay-Funktionen zu entfernen.

Zielbereich:

```text
max-width: 760px
min-height: 620px
max-height: 1000px
```

Dort gilt:

- die App nutzt `100dvh` und Safe-Area-Padding,
- vertikales Seitenscrollen ist deaktiviert,
- Header, Titel, HP, Arena, Puzzle, Tastatur, Tools und Piratenflotte liegen in einem festen vertikalen Grid,
- vertikale Abstände und Höhen wurden ungefähr 10–15 % reduziert,
- Wort und Tastatur bleiben lesbar,
- Piratenflotte bleibt als kompakte horizontale Leiste sichtbar,
- extrem kurze beziehungsweise Landschafts-Viewports behalten bewusst die scrollbare Fallback-Darstellung, damit keine Controls abgeschnitten werden.

Automatischer WebKit-Test prüft für die iPhone-Viewports:

- `scrollY <= 1`,
- `scrollHeight <= innerHeight + 2`,
- `.wrap` endet innerhalb des Viewports,
- `.route` endet innerhalb des Viewports,
- die Bedingung bleibt auch nach neuen Wörtern und beim Boss-1-zu-Boss-2-Wechsel erfüllt.

## Cinematic Boss Word Reaction

Die verifizierte Bossreaktion läuft im V2-Pfad nach einem vollständig gelösten Wort automatisch.

Ablauf:

```text
Wort gelöst
→ Input Lock
→ Impact/Glow + kleine Partikel
→ Boss bewegt sich zur Arenamitte
→ wechselnder positiver Boss-Spruch
→ ungefähr 2,5 Sekunden Reaktionszeit
→ Boss kehrt weich zurück
→ nächstes Wort
```

Bei Boss-HP `0` wird ein eigener Kapitulationssatz verwendet und anschließend direkt die Defeat-/Level-Transition ausgeführt.

Technische Sicherheiten:

- 22 normale Reaktionssätze und 10 Kapitulationssätze,
- keine direkte Satzwiederholung pro Boss und Reaktionstyp,
- `BOSS_REACTION` als expliziter Input-Lock-Zustand,
- Controls werden nach der Reaktion auf ihren vorherigen Disabled-State zurückgesetzt,
- insbesondere der Ganzwort-Submit-Button bleibt nicht mehr versehentlich gesperrt,
- Boss-Zentralpose wird nach WAAPI-Abschluss explizit als Inline-Transform persistiert, damit WebKit/Safari sie während des Dialogs sichtbar hält,
- 5-Sekunden-Hard-Timeout und `AbortSignal` verhindern hängende Sequenzen,
- Reduced Motion wird respektiert,
- kein `scrollIntoView()` und kein zusätzlicher Layout-Spacer,
- Bossgrafiken bleiben echte einzelne PNG-Dateien,
- V2-Ready-Synchronisierung wird nach `document.write()` zuverlässig erneut ausgeführt,
- Startbutton besitzt einen deduplizierten Touch-/Click-Pfad, damit der Bosskampf auf iPhone per echtem Tap startet.

## Teststatus

Alle verpflichtenden Gates sind grün:

- npm ci
- Lint
- Astro/TypeScript Typecheck
- Unit Tests
- AnimationController: finished / timeout / abort / reduced motion / Fehlerpfade
- Boss-Reaction-Selector / Wiederholungsvermeidung
- Integration / State-Machine-Parität
- Boss-Reaction-State und einmalige Reward-Verbuchung
- Legacy Contract
- Astro Build
- Boss-/Asset Integrity
- Playwright Chromium Desktop 1440×900
- Playwright WebKit iPhone 393×852
- Playwright WebKit iPhone 430×932
- echter Touch-/Tap-Start auf WebKit
- Boss bewegt sich während Dialog sichtbar zur Mitte
- Boss kehrt nach Dialog zur Ausgangsposition zurück
- Ganzwort-Submit wird nach Reaktion wieder freigegeben
- Boss 1 -> Boss 2
- Bossbilder in Intro, Route und Arena
- Scroll-Clamp
- One-Screen-Mobile-Layout ohne vertikales Seitenscrollen

Finaler Boss-Reaction-Gate-Lauf:

```text
GitHub Actions: 32386778964
Commit: ab00b5024c76abfa6814249da1b934819dc80314
Result: SUCCESS
```

Details:

- `docs/PHASE_1_IMPLEMENTATION.md`
- `docs/PHASE_2_STATE_MACHINE.md`
- `docs/PHASE_3_ANIMATIONS.md`
- `docs/ci/phase1-status.md`
- `docs/ci/phase2-status.md`
- `docs/ci/phase3-status.md`
- `tests/e2e/phase1-compat.spec.ts`
- `tests/e2e/boss-reaction.spec.ts`

## Kritische Regressionstests
1. Boss 1 Intro laden.
2. `Bosskampf starten` auf iPhone per echtem Tap ausführen.
3. Drei Wörter lösen.
4. Nach jedem Wort Bossreaktion zur Mitte und Rückkehr prüfen.
5. Nach Reaktion Ganzwort-Submit, Hinweis und Tastatur erneut benutzen können.
6. Boss 2 Intro öffnen.
7. `Bosskampf starten` bei Boss 2 auf iPhone erneut per Tap ausführen.
8. Bossgrafik in Intro, Arena und Route sichtbar halten.
9. Kein wachsender Leerraum / unkontrolliertes Scrollen nach neuen Wörtern.
10. Portrait-iPhone: vollständige Kampfoberfläche bleibt ohne vertikales Seitenscrollen sichtbar.

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
- `HANDOFF.md` und `CHANGELOG.md` nach jeder Phase bzw. relevanten Design-Regression aktualisieren.

## Do not touch
Die alte Kopie in `o-some/tulasisland` nicht löschen. `main` und `backup/letter-bay-before-v2-20260819` nicht verändern, solange keine separate Freigabe vorliegt.
