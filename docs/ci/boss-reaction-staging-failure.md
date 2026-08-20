# Letter Bay V2 – Boss Reaction Staging Failure

Commit tested: `4dd05e760a14d46eed927d88eabe71115ee03bdb`

| Gate | Outcome |
|---|---|
| staged bundle | success |
| lockfile | success |
| npm ci | success |
| lint | success |
| typecheck | failure |
| unit | failure |
| integration | success |
| legacy contract | success |
| build | success |
| asset integrity | success |
| browser install | success |
| E2E | failure |

## Typecheck output
```text

> letter-bay@2.0.0-alpha.1 typecheck
> astro check

[2m10:11:49[22m [34m[types][39m Generated [2m97ms[22m
[2m10:11:49[22m [34m[check][39m Getting diagnostics for Astro files in /home/runner/work/letter-bay/letter-bay...
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

[96mtests/integration/animationEffects.test.ts[0m:[93m15[0m:[93m5[0m - [91merror[0m[90m ts(2741): [0mProperty 'bossWordReaction' is missing in type '{ correctLetter: Mock<() => Promise<{ name: "celebrate"; outcome: "finished"; reducedMotion: boolean; elapsedMs: number; }[]>>; wrongLetter: Mock<() => Promise<{ name: "celebrate"; outcome: "finished"; reducedMotion: boolean; elapsedMs: number; }[]>>; wordSolved: Mock<...>; bossIntro: Mock<...>; bossDefeated: Mock<....' but required in type 'BattleAnimationSequences'.

[7m15[0m     api: {
[7m  [0m [91m    ~~~[0m

Result (30 files): 
- 6 errors
- 0 warnings
- 1 hint

```
