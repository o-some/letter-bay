# Letter Bay – Handoff

## Zweck
Sprachlern-Minispiel für Tula’s Island. Wörter werden gegen eine Piratenflotte gelöst.

## Repository
`o-some/letter-bay`

## Source Migration
- Quelle: `o-some/tulasisland/public/letter-bay/`
- Source Commit: `892f676fbcef77ab49373aef7865d60afba0ebb7`
- Rollback-Branch Quelle: `pre-extraction-letter-bay-20260819`

## Plattform
- iPhone Safari – kritisch
- Android Chrome
- Desktop Chrome/Safari
- Mobile-first

## Aktuelle Kernfunktionen
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
- `.github/workflows/migrate-letter-bay.yml`
- `.github/workflows/pages.yml`

## Regeln für Codex/ChatGPT
- Ausschließlich dieses Repo bearbeiten.
- Vor jedem Write aktuellen `main` neu lesen.
- Kein Force-Push.
- Keine funktionierende Funktion ohne ausdrückliche Anweisung entfernen.
- Mobile und Bosswechsel nach Änderungen testen.
- `HANDOFF.md` nach größeren Änderungen aktualisieren.

## Do not touch
Die alte Kopie in `o-some/tulasisland` nicht löschen, solange `docs/TEST_CHECKLIST.md` nicht vollständig freigegeben ist.
