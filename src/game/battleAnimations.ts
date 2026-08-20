import {
  AnimationController,
  type AnimationRunResult,
  type AnimationTargetLike,
} from './animationController';

export interface BattleAnimationTargets {
  key?: AnimationTargetLike | null;
  letterGhost?: AnimationTargetLike | null;
  word?: AnimationTargetLike | null;
  tula?: AnimationTargetLike | null;
  boss?: AnimationTargetLike | null;
  celebration?: AnimationTargetLike | null;
}

export interface BattleAnimationSequences {
  correctLetter(targets: BattleAnimationTargets, signal?: AbortSignal): Promise<AnimationRunResult[]>;
  wrongLetter(targets: BattleAnimationTargets, signal?: AbortSignal): Promise<AnimationRunResult[]>;
  wordSolved(targets: BattleAnimationTargets, signal?: AbortSignal): Promise<AnimationRunResult[]>;
  bossIntro(targets: BattleAnimationTargets, signal?: AbortSignal): Promise<AnimationRunResult[]>;
  bossDefeated(targets: BattleAnimationTargets, signal?: AbortSignal): Promise<AnimationRunResult[]>;
}

function compact(results: Array<AnimationRunResult | undefined>): AnimationRunResult[] {
  return results.filter((result): result is AnimationRunResult => result !== undefined);
}

export function createBattleAnimationSequences(
  controller: AnimationController,
): BattleAnimationSequences {
  return {
    async correctLetter(targets, signal) {
      const first = await controller.playSequence([
        { name: 'keyCorrect', target: targets.key },
        { name: 'letterToWord', target: targets.letterGhost },
      ], signal);
      if (signal?.aborted) return first;

      const [tula, boss] = await Promise.all([
        controller.play('tulaAttack', targets.tula, signal),
        controller.play('bossHit', targets.boss, signal),
      ]);
      return [...first, ...compact([tula, boss])];
    },

    async wrongLetter(targets, signal) {
      const key = await controller.play('keyWrong', targets.key, signal);
      if (signal?.aborted) return [key];

      const [boss, tula] = await Promise.all([
        controller.play('bossAttack', targets.boss, signal),
        controller.play('tulaHit', targets.tula, signal),
      ]);
      return compact([key, boss, tula]);
    },

    async wordSolved(targets, signal) {
      const word = await controller.play('wordSolved', targets.word, signal);
      if (signal?.aborted) return [word];

      const [tula, boss, celebrate] = await Promise.all([
        controller.play('tulaAttack', targets.tula, signal),
        controller.play('bossHit', targets.boss, signal),
        controller.play('celebrate', targets.celebration ?? targets.tula, signal),
      ]);
      return compact([word, tula, boss, celebrate]);
    },

    async bossIntro(targets, signal) {
      return [await controller.play('bossIntro', targets.boss, signal)];
    },

    async bossDefeated(targets, signal) {
      const boss = await controller.play('bossDefeated', targets.boss, signal);
      if (signal?.aborted) return [boss];
      const celebrate = await controller.play('celebrate', targets.celebration ?? targets.tula, signal);
      return compact([boss, celebrate]);
    },
  };
}
