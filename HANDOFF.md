# Letter Bay – Handoff

## Zweck
Sprachlern-Minispiel für Tula’s Island. Wörter werden gegen eine Piratenflotte gelöst.

## Repository
`o-some/letter-bay`

## V2 Entwicklungsstatus

- Baseline `main`: `12c65e56c8f6ec842c643f5a6f236b415603c0d6`
- Sicherer Rollback-Branch: `backup/letter-bay-before-v2-20260819`
- V2-Arbeitsbranch: `feature/letter-bay-v2`
- Aktuelle Phase: **Phase 0 – Baseline**
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

## Phase-0-Befund

Die aktuelle Runtime ist noch Standalone-HTML ohne Astro/TypeScript/Testsystem.

Kritische Legacy-Risiken:

1. `source.html` enthält weiterhin CSS-Sprite-Bosslogik.
2. `index.html` repariert diese Laufzeitdarstellung durch echte `<img>`-Elemente und MutationObserver.
3. Bossbilder sind in der dokumentierten iPhone-Baseline in Intro und Route sichtbar ausgefallen.
4. Timer- und Scrollsteuerung ist auf mehrere Stellen verteilt.
5. Wort-, Boss-, UI- und Spiellogik liegen stark gekoppelt in `source.html`.
6. GitHub Pages besitzt noch kein Build-/Test-Gate.

Vollständiger Befund: `docs/V2_BASELINE.md`.

## Kritische Regressionstests
1. Boss 1 starten.
2. Drei Wörter lösen.
3. Boss 2 Intro öffnen.
4. `Bosskampf starten` auf iPhone muss reagieren.
5. Nach Bossstart muss die Ansicht oben am Spiel stehen.
6. Bossgrafik muss in Intro, Arena und Route sichtbar sein.
7. Kein wachsender Leerraum / unkontrolliertes Scrollen nach neuen Wörtern.

## Wichtige Dateien
- `index.html`
- `source.html`
- `assets/`
- `docs/V2_BASELINE.md`
- `docs/V2_PARITY_CONTRACT.md`
- `tests/baseline/legacy-contract.mjs`
- `.github/workflows/pages.yml`

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
