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

describe('cinematic boss reaction sequence', () => {
  it('finishes, holds dialogue and returns a surviving boss safely', async () => {
    const controller = new AnimationController({ prefersReducedMotion: () => false });
    const hold = vi.fn().mockResolvedValue('finished' as const);
    const result = await playBossWordReaction({
      boss: fakeElement({ left: 270, width: 90 }),
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
      'bossReactionDialogueIn',
      'bossReactionDialogueOut',
      'bossReactionReturn',
    ]);
  });

  it('uses the defeat exit instead of returning to combat position', async () => {
    const result = await playBossWordReaction({
      boss: fakeElement({ left: 270, width: 90 }),
      arena: fakeElement({ left: 0, width: 390, height: 120 }),
      dialogue: fakeElement(),
      defeated: true,
    }, {
      hold: vi.fn().mockResolvedValue('finished' as const),
      prefersReducedMotion: () => false,
    });

    expect(result.animationResults.at(-1)?.name).toBe('bossReactionDefeat');
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
      arena: fakeElement({ width: 390 }),
      dialogue: fakeElement(),
      defeated: false,
      signal: abort.signal,
    });
    expect(result.status).toBe('aborted');
  });

  it('reduces boss scale for reduced motion and narrow phones', () => {
    expect(bossReactionVisualScale(393, true)).toBe(1.04);
    expect(bossReactionVisualScale(375, false)).toBeLessThanOrEqual(1.12);
    expect(bossReactionVisualScale(1440, false)).toBeGreaterThan(1.14);
  });
});
