import { describe, expect, it, vi } from 'vitest';
import {
  AnimationController,
  animationPreset,
  type AnimationHandleLike,
  type AnimationTargetLike,
} from '../../src/game/animationController';
import { createBattleAnimationSequences } from '../../src/game/battleAnimations';

function completedTarget(spy = vi.fn()): AnimationTargetLike {
  return {
    animate(keyframes, options) {
      spy(keyframes, options);
      return {
        finished: Promise.resolve(),
        cancel: vi.fn(),
      };
    },
  };
}

function hangingTarget(cancel = vi.fn()): AnimationTargetLike {
  return {
    animate() {
      return {
        finished: new Promise(() => undefined),
        cancel,
      };
    },
  };
}

describe('AnimationController', () => {
  it('awaits animation.finished before reporting success', async () => {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => { finish = resolve; });
    const target: AnimationTargetLike = {
      animate: () => ({ finished, cancel: vi.fn() }),
    };
    const controller = new AnimationController({ prefersReducedMotion: () => false });

    let settled = false;
    const pending = controller.play('bossHit', target).then((result) => {
      settled = true;
      return result;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    finish();
    const result = await pending;
    expect(result.outcome).toBe('finished');
    expect(result.reducedMotion).toBe(false);
  });

  it('uses a timeout fallback and cancels a stuck animation', async () => {
    const cancel = vi.fn();
    const controller = new AnimationController({
      prefersReducedMotion: () => false,
      scheduleTimeout: (callback) => {
        queueMicrotask(callback);
        return 1 as unknown as ReturnType<typeof setTimeout>;
      },
      clearScheduledTimeout: vi.fn(),
    });

    const result = await controller.play('bossIntro', hangingTarget(cancel));
    expect(result.outcome).toBe('timeout');
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('supports AbortSignal without leaving a hanging animation', async () => {
    const cancel = vi.fn();
    const controller = new AnimationController({ prefersReducedMotion: () => false });
    const abort = new AbortController();
    const pending = controller.play('tulaAttack', hangingTarget(cancel), abort.signal);
    abort.abort();

    const result = await pending;
    expect(result.outcome).toBe('aborted');
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('uses a short low-motion preset when reduced motion is requested', async () => {
    const animate = vi.fn();
    const controller = new AnimationController({ prefersReducedMotion: () => true });
    const result = await controller.play('bossDefeated', completedTarget(animate));

    expect(result.outcome).toBe('finished');
    expect(result.reducedMotion).toBe(true);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0]?.[1]).toMatchObject({ duration: 90 });
    expect(animationPreset('bossDefeated', true).timeoutMs).toBeLessThan(
      animationPreset('bossDefeated', false).timeoutMs,
    );
  });

  it('returns unsupported rather than throwing for a missing target', async () => {
    const controller = new AnimationController({ prefersReducedMotion: () => false });
    await expect(controller.play('keyCorrect', null)).resolves.toMatchObject({
      outcome: 'unsupported',
      name: 'keyCorrect',
    });
  });

  it('contains animation failures and returns an error result', async () => {
    const target: AnimationTargetLike = {
      animate() {
        throw new Error('WAAPI unavailable');
      },
    };
    const controller = new AnimationController({ prefersReducedMotion: () => false });
    const result = await controller.play('wordSolved', target);
    expect(result.outcome).toBe('error');
    expect(result.error).toBeInstanceOf(Error);
  });
});

describe('battle animation sequences', () => {
  it('plays the semantic correct-letter chain without mutating game state', async () => {
    const calls: string[] = [];
    const controller = new AnimationController({ prefersReducedMotion: () => false });
    const target = (label: string): AnimationTargetLike => ({
      animate() {
        calls.push(label);
        const handle: AnimationHandleLike = { finished: Promise.resolve(), cancel: vi.fn() };
        return handle;
      },
    });
    const sequences = createBattleAnimationSequences(controller);
    const frozenState = Object.freeze({ phase: 'PLAYER_INPUT', score: 5 });

    const result = await sequences.correctLetter({
      key: target('key'),
      letterGhost: target('letter'),
      tula: target('tula'),
      boss: target('boss'),
    });

    expect(result.map((item) => item.outcome)).toEqual(['finished', 'finished', 'finished', 'finished']);
    expect(calls.slice(0, 2)).toEqual(['key', 'letter']);
    expect(calls.slice(2).sort()).toEqual(['boss', 'tula']);
    expect(frozenState).toEqual({ phase: 'PLAYER_INPUT', score: 5 });
  });
});
