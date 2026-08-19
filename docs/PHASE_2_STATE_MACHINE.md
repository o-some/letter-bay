# Letter Bay V2 – Phase 2 State Machine

Status: **PASS – QUALITY GATE GREEN**

## Ziel

Phase 2 führt eine explizite, typisierte Zustandsmaschine ein, ohne die bestehende Legacy-Runtime zu verändern oder zu ersetzen.

## Implementiert

- `src/game/gameState.ts`
  - vollständige Phase-Typen aus der V2-Spezifikation,
  - zentraler `GameState`,
  - explizite Legacy-Paritätsregeln,
  - Eingaben nur in `PLAYER_INPUT` bzw. später `MASTERY_CHALLENGE`.
- `src/game/gameEvents.ts`
  - typisierte Game Events,
  - typisierte Side Effects,
  - keine UI-/DOM-Abhängigkeiten.
- `src/game/gameMachine.ts`
  - deterministischer Pure-Reducer,
  - `GameMachine`-Wrapper,
  - keine Timer,
  - ungültige Events werden abgewiesen,
  - Fail-Safe-Zustand mit kontrollierter Recovery.

## Legacy-Parität

Die State Machine bildet bewusst die aktuelle Legacy-Mechanik ab:

- Boss: 3 HP,
- Tula: 7 HP pro Wort,
- Tula-HP wird bei jedem neuen Wort auf 7 zurückgesetzt,
- richtig geratener Einzelbuchstabe: +1 Punkt,
- Wortabschluss: `10 + verbleibende Tula-HP`,
- +2 Muscheln pro Wort,
- +12 zusätzliche Muscheln bei Boss-Sieg,
- Hinweis: -2 Punkte, nur einmal,
- Joker: -4 Punkte, nur einmal,
- drei gelöste Wörter führen zum nächsten Boss-Intro,
- Niederlage verändert Boss-HP und bereits gelöste Bosswörter nicht.

Diese Regeln sind ein Paritätsvertrag, keine Aussage darüber, dass jedes Balancing später unverändert bleiben muss. Änderungen daran benötigen später eine bewusste Produktentscheidung und neue Tests.

## Tests

### Unit

`tests/unit/gameMachine.test.ts` prüft:

- Boot -> Asset Loading -> Boss Intro,
- Input Gate außerhalb `PLAYER_INPUT`,
- Buchstaben-Scoring,
- sieben Fehler -> `LOSS`,
- Hinweis-/Jokerkosten nur einmal,
- Fail Safe -> Recovery.

### Integration

`tests/integration/gameMachine.parity.test.ts` prüft:

- drei Wörter -> Boss 2 Intro,
- exakte Legacy-Punkte und Muscheln,
- Tula-HP-Reset pro Wort,
- Niederlage -> Weiterlernen ohne Boss-Fortschrittsverlust.

### Bestehende Browser-Regression

Die Phase-1-Playwright-Suite bleibt unverändert aktiv und prüft weiterhin:

- WebKit/iPhone-Viewport,
- Chromium/Desktop,
- Bossbilder Intro/Route/Arena,
- Boss 1 -> Boss 2,
- Tastatur,
- Scroll-Clamp.

## CI-Validierung

Finaler isolierter Lauf:

```text
GitHub Actions Run: 32308257027
Job: quality
Conclusion: success
```

Alle Gates einschließlich Unit, Integration, Legacy Contract, Build, Asset Integrity und E2E sind grün.

## Sicherheitsstatus

- `v2StateMachine` bleibt standardmäßig `false`.
- Legacy-Runtime wurde nicht verändert.
- kein Merge auf `main`.
- temporärer Validierungs-PR wurde nicht gemerged und nach Erfolg geschlossen.
- `main` und der Backup-Branch bleiben unverändert.

## Nächste Phase

Phase 3 darf das Animationsfundament auf der typisierten Architektur aufbauen. Animationen müssen Promise-basiert bzw. über `animation.finished` kontrolliert werden und einen Timeout-Fallback besitzen. Sie dürfen den State niemals dauerhaft blockieren.
