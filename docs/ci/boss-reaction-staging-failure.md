# Letter Bay V2 – Boss Reaction Staging Failure

Commit tested: `109f3c2fc3a6969485142950618f228960d32878`

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

[2m10:05:38[22m [34m[types][39m Generated [2m107ms[22m
[2m10:05:38[22m [34m[check][39m Getting diagnostics for Astro files in /home/runner/work/letter-bay/letter-bay...
[96msrc/game/animationEffects.ts[0m:[93m23[0m:[93m7[0m - [93mwarning[0m[90m ts(7027): [0mUnreachable code detected.

[7m23[0m       return [];
[7m  [0m [93m      ~~~~~~~~~~[0m

[96msrc/game/bossReactionBrowser.ts[0m:[93m199[0m:[93m31[0m - [91merror[0m[90m ts(2339): [0mProperty 'select' does not exist on type 'BossReactionSelector'.

[7m199[0m     const reaction = selector.select(request.bossIndex, request.defeated ? 'defeated' : 'normal');
[7m   [0m [91m                              ~~~~~~[0m

[96msrc/game/bossReactionSequence.ts[0m:[93m197[0m:[93m29[0m - [91merror[0m[90m ts(2345): [0mArgument of type '"bossReactionDefeat" | "bossReactionReturn"' is not assignable to parameter of type 'AnimationName'.
  Type '"bossReactionDefeat"' is not assignable to type 'AnimationName'.

[7m197[0m     const exit = await play(input.defeated ? 'bossReactionDefeat' : 'bossReactionReturn', input.boss);
[7m   [0m [91m                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m
[96msrc/game/bossReactionSequence.ts[0m:[93m193[0m:[93m16[0m - [91merror[0m[90m ts(2345): [0mArgument of type '"bossReactionDialogueOut"' is not assignable to parameter of type 'AnimationName'.

[7m193[0m     await play('bossReactionDialogueOut', input.dialogue);
[7m   [0m [91m               ~~~~~~~~~~~~~~~~~~~~~~~~~[0m
[96msrc/game/bossReactionSequence.ts[0m:[93m183[0m:[93m35[0m - [91merror[0m[90m ts(2345): [0mArgument of type '"bossReactionDialogueIn"' is not assignable to parameter of type 'AnimationName'.

[7m183[0m     const dialogueIn = await play('bossReactionDialogueIn', input.dialogue);
[7m   [0m [91m                                  ~~~~~~~~~~~~~~~~~~~~~~~~[0m
[96msrc/game/bossReactionSequence.ts[0m:[93m177[0m:[93m32[0m - [91merror[0m[90m ts(2345): [0mArgument of type '"bossReactionAdvance"' is not assignable to parameter of type 'AnimationName'.

[7m177[0m     const advance = await play('bossReactionAdvance', input.boss);
[7m   [0m [91m                               ~~~~~~~~~~~~~~~~~~~~~[0m

Result (27 files): 
- 5 errors
- 0 warnings
- 1 hint

```
