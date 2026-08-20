# Letter Bay V2 – Boss Reaction Staging Failure

Commit tested: `a1e03d27a8b9575d317393923ba1b64b647f1728`

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

[2m08:27:38[22m [34m[types][39m Generated [2m98ms[22m
[2m08:27:38[22m [34m[check][39m Getting diagnostics for Astro files in /home/runner/work/letter-bay/letter-bay...
[96msrc/game/animationEffects.ts[0m:[93m23[0m:[93m7[0m - [93mwarning[0m[90m ts(7027): [0mUnreachable code detected.

[7m23[0m       return [];
[7m  [0m [93m      ~~~~~~~~~~[0m

[96mtests/integration/animationEffects.test.ts[0m:[93m49[0m:[93m37[0m - [91merror[0m[90m ts(2345): [0mArgument of type '{ type: "PLAY_BOSS_REACTION"; defeated: false; }' is not assignable to parameter of type 'GameEffect'.
  Property 'bossIndex' is missing in type '{ type: "PLAY_BOSS_REACTION"; defeated: false; }' but required in type '{ type: "PLAY_BOSS_REACTION"; bossIndex: number; defeated: boolean; }'.

[7m49[0m     await expect(runAnimationEffect({ type: 'PLAY_BOSS_REACTION', defeated: false }, api, {})).resolves.toEqual([]);
[7m  [0m [91m                                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m

Result (25 files): 
- 1 error
- 0 warnings
- 1 hint

```
