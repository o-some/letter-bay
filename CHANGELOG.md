# Changelog

Alle wesentlichen Änderungen an Letter Bay werden hier dokumentiert.

## [Unreleased] – Letter Bay V2

### Phase 2 – State Machine

- typisierten zentralen `GameState` mit den verbindlichen V2-Spielphasen eingeführt.
- `GameEvent`- und `GameEffect`-Vertrag ergänzt, damit Spiellogik und UI entkoppelt werden können.
- deterministischen `transitionGameState`-Reducer und `GameMachine`-Wrapper ohne Timer implementiert.
- Eingaben außerhalb `PLAYER_INPUT` bzw. später `MASTERY_CHALLENGE` werden abgewiesen.
- expliziten `ERROR_RECOVERY`-Pfad mit kontrollierter Wiederaufnahme ergänzt.
- Legacy-Paritätsregeln für Boss-HP, Tula-HP, Punkte, Muscheln, Hinweis, Joker und drei Wörter pro Boss dokumentiert und im Code fixiert.
- Unit Tests für Bootflow, Input Gates, Buchstaben-/Verlustlogik, Hinweis/Joker und Fail-Safe ergänzt.
- Integrationstests für drei Wörter -> Boss 2, exakte Legacy-Belohnungen, HP-Reset pro Wort und Niederlagen-Recovery ergänzt.
- Phase-2-CI um Integration-/State-Machine-Paritätsgate erweitert.
- bestehende WebKit/iPhone- und Chromium-E2E-Regressionen weiterhin grün gehalten.
- finaler isolierter Phase-2-Validierungslauf `32308257027` vollständig grün.
- State Machine bleibt über `v2StateMachine: false` noch deaktiviert; die Legacy-Runtime wurde nicht verändert.
- temporärer Validierungs-PR nicht gemerged.
- `main` und Rollback-Branch unverändert gelassen.

### Phase 1 – Testnetz und Kompatibilität

- Astro-7-Grundstruktur mit GitHub-Pages-Base `/letter-bay/` angelegt.
- Legacy-Runtime unverändert unter `public/legacy/` gespiegelt.
- sicherer Standard bleibt Legacy; `?engine=v2` nutzt bis zur kontrollierten Aktivierung ebenfalls den Legacy-Kompatibilitätsmodus.
- alle V2-Feature-Flags standardmäßig deaktiviert.
- zehn individuelle Boss-PNGs und Tula-/Weltassets in `public/` gespiegelt.
- Asset-Integritätsprüfung für PNG-Signatur, Dateigröße und Alpha-Kanal ergänzt.
- Unit-Testbasis mit Vitest ergänzt.
- E2E-Testbasis mit Playwright für WebKit/iPhone und Chromium/Desktop ergänzt.
- Boss 1 -> Boss 2 automatisiert getestet.
- Bossbilder in Intro, Arena und Piratenflotte automatisiert auf geladenes Bild geprüft.
- WebKit-Bildprüfung auf deterministisches Warten umgestellt, statt Bild-Loading als Race Condition zu behandeln.
- TypeScript-/Node-Typisierung korrigiert.
- reproduzierbares `package-lock.json` erzeugt.
- CI-Gate für Lint, Typecheck, Unit, Legacy Contract, Build, Asset Integrity und E2E eingerichtet.
- zukünftiges Pages-Deployment auf `dist` und Quality Gates vorbereitet.
- finaler isolierter Validierungslauf `32307481759` vollständig grün.
- temporäre Validierungs-PRs nicht gemerged.
- `main` und Rollback-Branch unverändert gelassen.

### Phase 0 – Baseline

- Sicherheitsbranch `backup/letter-bay-before-v2-20260819` als unveränderten Rücksprung bestätigt.
- Entwicklungsbranch `feature/letter-bay-v2` vom sicheren Baseline-Commit erstellt.
- V2-Baseline, Parity Contract und statisches Regressionstest-Skript dokumentiert.
- reale iPhone-Safari-Fehlerbaseline mit fehlenden Bossgrafiken archiviert.
- keine Gameplay-Funktion verändert.
- kein Merge auf `main`.
