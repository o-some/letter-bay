# Letter Bay V2 – Phase 3 Animationsfundament

Status: **PASS – QUALITY GATE GREEN**

## Ziel

Phase 3 baut ein kontrolliertes Animationssystem, ohne die bestehende Legacy-Runtime zu verändern oder bereits V2-Gameplay zu aktivieren.

## Implementiert

### `src/game/animationController.ts`

Zentraler AnimationController mit:

- Web-Animations-API-kompatiblen Targets,
- Promise-basiertem Abschluss über `finished`,
- Sicherheits-Timeout pro Animation,
- kontrolliertem `AbortSignal`,
- Fehlerkapselung statt ungefangenem Abbruch,
- `prefers-reduced-motion`-Pfad,
- sequenziellem Abspielen ohne Timer-Kaskaden.

Semantische Animationen:

- `keyCorrect`
- `letterToWord`
- `tulaAttack`
- `bossHit`
- `keyWrong`
- `bossAttack`
- `tulaHit`
- `wordSolved`
- `bossIntro`
- `bossDefeated`
- `celebrate`

### `src/game/battleAnimations.ts`

Definiert hochwertige, aber kurze Lernkampf-Sequenzen:

- richtiger Buchstabe: Taste -> Buchstabe -> Tula-Angriff -> Boss-Reaktion,
- falscher Buchstabe: Tastaturfeedback -> Bossangriff -> Tula-Reaktion,
- Wort gelöst: Wortmoment -> Angriff/Treffer/Jubel,
- Bossintro,
- Boss besiegt.

Parallelisierung wird nur dort verwendet, wo sie semantisch zusammengehört. Die Sequenzen verändern keinen `GameState`.

### `src/game/animationEffects.ts`

Brücke zwischen typisierten `GameEffect`s und Animationssequenzen. Die Animationsebene darf keine eigenen Game Events dispatchen und dadurch den Zustand nicht heimlich verändern.

### `src/styles/animations.css`

Performance-Grundlage:

- `transform` / `opacity` / `filter`,
- `will-change` nur an Motion Targets,
- keine layoutintensiven Daueranimationen,
- Letter-Ghost für späteres sichtbares Einfliegen von Buchstaben,
- reduzierte Motion optimiert `will-change` auf Opacity.

## Sicherheitsverhalten

Keine Animation darf einen Bosskampf blockieren:

```text
animation.finished
ODER
Sicherheits-Timeout
ODER
AbortSignal
→ kontrolliertes Ergebnis
→ aufrufende Spiellogik kann weiterlaufen
```

Fehlende Targets ergeben `unsupported`, nicht einen Crash. Eine fehlerhafte Web Animations API wird als `error` zurückgegeben.

## Reduced Motion

Wenn `prefers-reduced-motion: reduce` aktiv ist:

- keine großen Translationen,
- kurzer 90-ms-Opacity-Preset,
- deutliches Feedback bleibt erhalten,
- deutlich kürzerer Timeout.

## Tests

`tests/unit/animationController.test.ts` prüft:

- echtes Warten auf `finished`,
- Timeout-Fallback für hängende Animationen,
- Abbruch mit `AbortSignal`,
- Reduced-Motion-Preset,
- fehlende Targets,
- WAAPI-Fehler,
- semantische Correct-Letter-Sequenz,
- keine Mutation eines fremden Game-State-Objekts.

`tests/integration/animationEffects.test.ts` prüft:

- korrektes Mapping der typisierten Game Effects auf die semantischen Sequenzen,
- keine Animation bei nicht-visuellen Effects.

Die komplette bestehende WebKit/iPhone-/Chromium-E2E-Suite bleibt zusätzlich aktiv.

## CI-Validierung

Finaler isolierter Phase-3-Lauf:

```text
GitHub Actions Run: 32309129223
Job: quality
Conclusion: success
```

Alle Gates waren erfolgreich:

- npm / Lockfile,
- npm ci,
- Lint,
- Typecheck,
- Unit Tests inklusive AnimationController,
- Integration Tests,
- Legacy Contract,
- Astro Build,
- Asset Integrity,
- Browser Setup,
- E2E WebKit + Chromium,
- Boss 1 -> Boss 2.

## Aktivierungsstatus

`enhancedAnimations` bleibt weiterhin **false**. Phase 3 liefert das sichere Fundament; die Legacy-Runtime bleibt unverändert. Die neue Animationsebene wird erst mit dem echten V2-Gameplay verbunden, wenn der entsprechende V2-Pfad unter Tests aktiviert wird.

## Nächste Phase

Phase 4 darf Lernkarte und Meisteraufgaben implementieren:

- Bedeutung,
- Übersetzung,
- Bild,
- Aussprache-Schnittstelle,
- kurze Mastery Challenges,
- Lernstatus.

Die Lernlogik muss separat von UI und Animationen bleiben und darf die bestehende Drei-Wörter-pro-Boss-Parität nicht still verändern.
