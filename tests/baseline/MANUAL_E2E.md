# Letter Bay – Baseline Manual E2E

## Ziel

Den Legacy-Stand vor V2 reproduzierbar prüfen.

## Boss 1 → Boss 2

1. Live-Seite auf iPhone Safari öffnen.
2. Boss-1-Intro prüfen.
3. `Bosskampf starten` tippen.
4. Drei Wörter erfolgreich lösen.
5. Boss-2-Intro prüfen.
6. `Bosskampf starten` tippen.
7. Prüfen, dass Eingabe/Tastatur aktiv ist.
8. Prüfen, dass Scrollposition nicht unter den Spielkopf springt.
9. Prüfen, dass Bossbild in Intro, Arena und Route sichtbar ist.

## Niederlage

1. Tula durch Fehler auf 0 HP bringen.
2. Motivationsdialog prüfen.
3. `Weiterlernen` tippen.
4. Prüfen, dass eine neue Runde bedienbar startet.

## Scroll

1. Mindestens fünf Wortwechsel durchführen.
2. Nach jedem Wechsel `scrollY <= scrollHeight - innerHeight` sicherstellen.
3. Prüfen, dass kein zusätzlicher leerer Bereich anwächst.

## Baseline 2026-08-19

Vor V2 dokumentierte visuelle Fehler:

- Boss 1 Intro: Bossbild fehlt.
- Boss 2 Intro: Bossbild fehlt.
- Piratenflotte: Bossbilder fehlen.

Screenshots liegen unter `docs/baseline/screenshots/`.
