# Letter Bay V2 – Phase 0 Baseline

**Erfasst:** 2026-08-19  
**Repository:** `o-some/letter-bay`  
**Baseline `main`:** `12c65e56c8f6ec842c643f5a6f236b415603c0d6`  
**Rollback:** `backup/letter-bay-before-v2-20260819`  
**Arbeitsbranch:** `feature/letter-bay-v2`

## Sicherheitsstatus

- `main` und Rollback-Branch sind zum V2-Start identisch und zeigen auf `12c65e56c8f6ec842c643f5a6f236b415603c0d6`.
- `feature/letter-bay-v2` wurde aus diesem unveränderten Stand erzeugt.
- Phase 0 verändert keine Gameplay-Funktion und wird nicht nach `main` gemerged.

## Aktuelle Architektur

Die Runtime ist eine Standalone-Implementierung ohne Astro-Build:

- `index.html`: Bootstrap/Loader sowie Runtime-Patches für Bossbilder und Scrollverhalten.
- `source.html`: UI, CSS, Wörter, Bossdaten und Spiellogik in einer monolithischen HTML-Datei.
- `assets/`: Tula-, Hintergrund- und Bossgrafiken.
- `.github/workflows/pages.yml`: statisches Pages-Deployment nur aus `main`.
- kein `package.json`, kein `astro.config.mjs`, kein `tsconfig.json`, kein automatisiertes Unit-/Integration-/E2E-Testnetz.

## Aktuelle Spielsteuerung

Der Legacy-State besteht unter anderem aus `boss`, `bhp`, `thp`, `score`, `shells`, `current`, `used`, `done`, `hintUsed`, `jokerUsed`, `deck` und `advanceTimer`.

Wichtige Funktionen sind `guess()`, `winWord()`, `loseWord()`, `bossDown()`, `nextWord()`, `hud()` und `route()`. Es gibt keine explizite State Machine; Zustandsgrenzen werden über `done`, deaktivierte Controls und Timer hergestellt.

## Technische Risikobaseline

### P0 – Bossdarstellung doppelt

`source.html` enthält weiterhin CSS-Sprite-Rendering, während `index.html` zur Laufzeit echte Boss-`<img>`-Elemente injiziert. Das erzeugt zwei konkurrierende Renderpfade plus MutationObserver-Reparaturlogik. Die realen iPhone-Screenshots zeigen leere Bossflächen.

### P0 – Timergetriebene Übergänge

Treffer, Cheer, Wortwechsel, Bosswechsel und Scrollreparaturen verwenden mehrere `setTimeout()`-basierte Abläufe. Das ist die zentrale Regressionfläche für doppelte Aktionen und blockierte Übergänge.

### P1 – Scrollsteuerung verteilt

`source.html` besitzt `clampScroll()`, `index.html` ergänzt weitere Scroll-Listener und verzögerte `scrollTo()`-Aufrufe. V2 braucht eine einzige Scrollinstanz.

### P1 – Daten/UI/Logik gekoppelt

Wörter, Bosse, CSS, Markup und Logik liegen weitgehend gemeinsam in `source.html`. Das erschwert Tests und Mehrsprachigkeit.

### P1 – Deployment ohne Qualitätsgate

Vor dem Pages-Deployment gibt es aktuell keine Build-, Type-, Unit-, Integration- oder Browser-E2E-Gates.

### P2 – Legacy-Sprite bleibt erhalten

`boss-sprite-dropbox-v2.webp` bleibt in Phase 0 unangetastet und darf erst nach nachgewiesener V2-Parität deaktiviert/archiviert werden.

## Assetinventar

### Individuelle Bosse

1. `assets/bosses/level-01-pirat-kai.png`
2. `assets/bosses/level-02-kapitaen-brax.png`
3. `assets/bosses/level-03-blackfinn.png`
4. `assets/bosses/level-04-alt-kapitaen-roderick.png`
5. `assets/bosses/level-05-piratenbaron-vargas.png`
6. `assets/bosses/level-06-kapitaen-ironhook.png`
7. `assets/bosses/level-07-admiral-thorne.png`
8. `assets/bosses/level-08-kartenmeister-corvin.png`
9. `assets/bosses/level-09-schattenfuerst-azrak.png`
10. `assets/bosses/level-10-piratenkoenig-varkos.png`

### Tula / Welt

- `assets/creative/tula_profile.webp`
- `assets/creative/tula_waving.webp`
- `assets/creative/world_harbor.webp`
- `assets/creative-v2/home_cinematic_island.webp`

### Legacy

- `boss-sprite-dropbox-v2.webp`

## Reale iPhone-Safari-Fehlerbaseline

Die drei Screenshots stammen aus echten Sitzungen unmittelbar vor V2 und werden absichtlich als Fehlerbaseline archiviert:

- `docs/baseline/screenshots/iphone-level-1-intro-missing-boss.webp` – Level 1 / Pirat Kai, Startbutton sichtbar, Bossgrafik fehlt.
- `docs/baseline/screenshots/iphone-level-2-intro-missing-boss.webp` – Level 2 / Kapitän Brax, Startbutton sichtbar, Bossgrafik fehlt.
- `docs/baseline/screenshots/iphone-route-missing-boss-images.webp` – Piratenflotte sichtbar, Bosskarten ohne Bossbilder.

## Parity-Baseline

Status: `STATIC PASS` = im Code nachweisbar; `MANUAL PASS` = durch vorhandene Sitzung belegt; `FAIL` = sichtbare Regression; `PENDING` = Phase 1 muss automatisieren/erneut prüfen.

| Funktion | Baseline |
|---|---|
| Boss-Intro erscheint | MANUAL PASS |
| Boss-1-/Boss-2-Startbutton vorhanden | STATIC PASS |
| A–Z/Ä/Ö/Ü | STATIC PASS |
| Einzelbuchstaben | STATIC PASS |
| richtige/falsche Buchstabenlogik | STATIC PASS |
| Ganzwort-Lösung | STATIC PASS |
| Boss HP 3/3 / Tula HP 7/7 | STATIC PASS |
| Hinweis / Muschel-Joker | STATIC PASS |
| Punkte / Muscheln | STATIC PASS |
| Sieg / Niederlage / Weiterlernen | STATIC PASS |
| Bosswechsel | STATIC PASS / E2E PENDING |
| 10 Bossnamen | STATIC PASS |
| Bossbild Intro | **FAIL** |
| Bossbild Arena | PENDING |
| Bossbilder Route | **FAIL** |
| positive Rückmeldungen | STATIC PASS |
| Scroll kontrolliert | PENDING |
| kein wachsender Leerraum | PENDING |
| HP + Tastatur mobile erreichbar | PENDING |

## Baseline-Testartefakte

- `tests/baseline/legacy-contract.mjs` prüft zentrale statische Legacy-Anker und alle zehn Bossdateien ohne externe Bibliotheken.
- `tests/baseline/MANUAL_E2E.md` beschreibt den Boss-1→Boss-2-, Verlust- und Scroll-Smoke-Test.
- `docs/V2_PARITY_CONTRACT.md` ist der verbindliche Bestandsschutz.

## Build-/Teststatus Phase 0

| Gate | Status | Grund |
|---|---|---|
| Build | N/A | noch kein Buildsystem |
| Typecheck | N/A | noch kein TypeScript |
| Unit | N/A | noch kein Framework |
| Integration | N/A | noch kein Framework |
| Static Contract | PREPARED | CI folgt Phase 1 |
| E2E | MANUAL/PARTIAL | reale iPhone-Baseline archiviert |
| iPhone Safari | MANUAL EVIDENCE | drei Screenshots |
| Android Chrome | PENDING | Phase 1 |
| Desktop | PENDING | Phase 1 |

`N/A` ist kein Erfolg, sondern dokumentierte fehlende Infrastruktur.

## Gate für Phase 1

Phase 1 darf erst als bestanden gelten, wenn Legacy-Fallback, Astro-/Build-/Testinfrastruktur und Parity-Prüfungen vorhanden sind und insbesondere Bossbilder in Intro/Arena/Route, Boss 1→Boss 2 sowie Scroll-/Leerraumregression zuverlässig getestet werden. `main` muss währenddessen unverändert bleiben.
