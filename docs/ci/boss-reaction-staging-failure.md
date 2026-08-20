# Letter Bay V2 – Boss Reaction Staging Failure

Commit tested: `d29a3d605f194a64fcd0cf546cfa08dbc2e6c0a2`

| Gate | Outcome |
|---|---|
| staged bundle | success |
| lockfile | success |
| npm ci | success |
| lint | success |
| typecheck | failure |
| unit | success |
| integration | success |
| legacy contract | success |
| build | success |
| asset integrity | success |
| browser install | success |
| E2E | success |

## Typecheck output
```text

> letter-bay@2.0.0-alpha.1 typecheck
> astro check

[2m08:23:47[22m [34m[types][39m Generated [2m114ms[22m
[2m08:23:47[22m [34m[check][39m Getting diagnostics for Astro files in /home/runner/work/letter-bay/letter-bay...
[96msrc/game/animationEffects.ts[0m:[93m23[0m:[93m7[0m - [93mwarning[0m[90m ts(7027): [0mUnreachable code detected.

[7m23[0m       return [];
[7m  [0m [93m      ~~~~~~~~~~[0m

[96mtests/integration/animationEffects.test.ts[0m:[93m15[0m:[93m5[0m - [91merror[0m[90m ts(2741): [0mProperty 'bossWordReaction' is missing in type '{ correctLetter: Mock<() => Promise<{ name: "celebrate"; outcome: "finished"; reducedMotion: boolean; elapsedMs: number; }[]>>; wrongLetter: Mock<() => Promise<{ name: "celebrate"; outcome: "finished"; reducedMotion: boolean; elapsedMs: number; }[]>>; wordSolved: Mock<...>; bossIntro: Mock<...>; bossDefeated: Mock<....' but required in type 'BattleAnimationSequences'.

[7m15[0m     api: {
[7m  [0m [91m    ~~~[0m
[96mtests/integration/animationEffects.test.ts[0m:[93m7[0m:[93m19[0m - [93mwarning[0m[90m ts(6133): [0m'name' is declared but its value is never read.

[7m7[0m   const result = (name: string) => [{
[7m [0m [93m                  ~~~~[0m

Result (25 files): 
- 1 error
- 0 warnings
- 2 hints

```
