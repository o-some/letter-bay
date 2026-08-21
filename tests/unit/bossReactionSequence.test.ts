import { describe, expect, it, vi } from 'vitest';
import { AnimationController } from '../../src/game/animationController';
import {
  bossReactionVisualScale,
  playBossWordReaction,
} from '../../src/game/bossReactionSequence';

interface FakeElementOptions {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  hanging?: boolean;
}

function fakeElement(options: FakeElementOptions = {}): HTMLElement {
  const values = new Map<string, string>();
  const attributes = new Map<string, string>();
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  const rect = {
    left: options.left ?? 0,
    top: options.top ?? 0,
    width: options.width ?? 100,
    height: options.height ?? 100,
    right: (options.left ?? 0) + (options.width ?? 100),
    bottom: (options.top ?? 0) + (options.height ?? 100),
    x: options.left ?? 0,
    y: options.top ?? 0,
    toJSON: () => ({}),
  };
  return {
    hidden: false,
    style: {
      setProperty: (name: string, value: string) => { values.set(name, value); },
      removeProperty: (name: string) => values.delete(name) ? '' : '',
    },
    getBoundingClientRect: () => rect,
    setAttribute: (name: string, value: string) => { attributes.set(name, value); },
    removeAttribute: (name: string) => { attributes.delete(name); },
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      const set = listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.get(type)?.delete(listener);
    },
    animate: () => ({
      finished: options.hanging ? new Promise(() => undefined) : Promise.resolve(),
      cancel: vi.fn(),
    }),
  } as unknown as HTMLElement;
}

describe('cinematic solved-word reaction sequence', () => {
  it('moves Tula forward, hits the boss, holds dialogue and returns Tula safely', async () => {
    const controller = new AnimationController({ prefersReducedMotion: () => false });
    const hold = vi.fn().mockResolvedValue('finished' as const);
    const result = await playBossWordReaction({
      boss: fakeElement({ left: 270, width: 90 }),
      tula: fakeElement({ left: 12, width: 92 }),
      arena: fakeElement({ left: 0, width: 390, height: 120 }),
      dialogue: fakeElement(),
      defeated: false,
    }, {
      controller,
      hold,
      prefersReducedMotion: () => false,
    });

    expect(result.status).toBe('finished');
    expect(hold).toHaveBeenCalledTimes(1);
    expect(result.animationResults.map((entry) => entry.name)).toEqual([
      'bossReactionImpact',
      'bossReactionAdvance',
      'bossHit',
      'bossReactionDialogueIn',
      'bossReactionDialogueOut',
      'bossReactionReturn',
    ]);
  });

  it('returns Tula while the defeated boss uses the defeat exit', async () => {
    const result = await playBossWordReaction({
      boss: fakeElement({ left: 270, width: 90 }),
      tula: fakeElement({ left: 12, width: 92 }),
      arena: fakeElement({ left: 0, width: 390, height: 120 }),
      dialogue: fakeElement(),
      defeated: true,
    }, {
      hold: vi.fn().mockResolvedValue('finished' as const),
      prefersReducedMotion: () => false,
    });

    const names = result.animationResults.map((entry) => entry.name);
    expect(names).toContain('bossReactionReturn');
    expect(names.at(-1)).toBe('bossReactionDefeat');
  });

  it('falls through safely when a controlled animation times out', async () => {
    const controller = new AnimationController({
      prefersReducedMotion: () => false,
      scheduleTimeout: (callback) => {
        queueMicrotask(callback);
        return 1 as unknown as ReturnType<typeof setTimeout>;
      },
      clearScheduledTimeout: vi.fn(),
    });
    const result = await playBossWordReaction({
      boss: fakeElement({ hanging: true }),
      tula: fakeElement(),
      arena: fakeElement({ width: 390, height: 120 }),
      dialogue: fakeElement(),
      defeated: false,
    }, { controller, hold: vi.fn().mockResolvedValue('finished') });

    expect(['timeout', 'fallback']).toContain(result.status);
  });

  it('honors AbortSignal without leaving the sequence running', async () => {
    const abort = new AbortController();
    abort.abort();
    const result = await playBossWordReaction({
      boss: fakeElement(),
      tula: fakeElement(),
      arena: fakeElement({ width: 390 }),
      dialogue: fakeElement(),
      defeated: false,
      signal: abort.signal,
    });
    expect(result.status).toBe('aborted');
  });

  it('reduces Tula attack scale for reduced motion and narrow phones', () => {
    expect(bossReactionVisualScale(393, true)).toBe(1.025);
    expect(bossReactionVisualScale(375, false)).toBeLessThanOrEqual(1.10);
    expect(bossReactionVisualScale(1440, false)).toBeGreaterThan(1.10);
  });
});
