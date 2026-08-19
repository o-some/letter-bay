# Letter Bay

Letter Bay ist ein Mobile-first-Sprachlern-Minispiel für **Tula’s Island / Chelonaki**.

## Repository

Dieses Repository ist die eigenständige Entwicklungsquelle für Letter Bay. Das Spiel wurde aus `o-some/tulasisland` ausgelagert, damit mehrere Tula’s-Island-Spiele parallel und unabhängig entwickelt werden können.

## Live

Nach erfolgreichem Pages-Deployment:

`https://o-some.github.io/letter-bay/`

## Architektur

Aktuell wird die bewährte Standalone-Struktur beibehalten:

- `index.html` – Loader/Fixes für Mobile und Bosswechsel
- `source.html` – vollständige Spiellogik und UI
- `assets/` – lokale Runtime-Assets
- `HANDOFF.md` – Übergabe für ChatGPT/Codex
- `docs/` – Migration, Assets und Tests

## Migration

Quelle: `o-some/tulasisland`

Quell-Commit: `892f676fbcef77ab49373aef7865d60afba0ebb7`

Rollback-Branch im Quellrepo: `pre-extraction-letter-bay-20260819`

Die alte Kopie in `tulasisland` darf erst entfernt werden, wenn alle Tests im neuen Repo bestanden sind.

## Deployment-Hinweis

Pages wird direkt über GitHub Actions aus `main` veröffentlicht. Ein manueller Commit nach Bot-Importen stößt das Pages-Deployment an, weil Bot-Pushes mit `GITHUB_TOKEN` keine weiteren Workflows auslösen.

## Codex

Vor Änderungen immer zuerst `README.md` und `HANDOFF.md` lesen. Keine anderen Spiele-Repositories verändern.
