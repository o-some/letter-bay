import { describe, expect, it, vi } from 'vitest';
import { runAnimationEffect } from '../../src/game/animationEffects';
import type { BattleAnimationSequences } from '../../src/game/battleAnimations';

function sequences(): { api: BattleAnimationSequences; calls: string[] } {
  const calls: string[] = [];
  const result = (name: string) => [{
    name: 'celebrate' as const,
    outcome: 'finished' as const,
    reducedMotion: false,
    elapsedMs: 1,
  }];
  return {
    calls,
    api: {
      correctLetter: vi.fn(async () => { calls.push('correct'); return result('correct'); }),
      wrongLetter: vi.fn(async () => { calls.push('wrong'); return result('wrong'); }),
      wordSolved: vi.fn(async () => { calls.push('word'); return result('word'); }),
      bossIntro: vi.fn(async () => { calls.push('intro'); return result('intro'); }),
      bossDefeated: vi.fn(async () => { calls.push('defeated'); return result('defeated'); }),
    },
  };
}

describe('typed game effects map to semantic animation sequences', () => {
  it('maps correct/wrong/word/boss feedback without dispatching game events', async () => {
    const { api, calls } = sequences();
    const targets = {};

    await runAnimationEffect({ type: 'PLAY_FEEDBACK', feedback: 'correct' }, api, targets);
    await runAnimationEffect({ type: 'PLAY_FEEDBACK', feedback: 'wrong' }, api, targets);
    await runAnimationEffect({ type: 'PLAY_FEEDBACK', feedback: 'word-solved' }, api, targets);
    await runAnimationEffect({ type: 'PLAY_FEEDBACK', feedback: 'boss-defeated' }, api, targets);
    await runAnimationEffect({ type: 'SHOW_BOSS_INTRO', bossIndex: 2 }, api, targets);

    expect(calls).toEqual(['correct', 'wrong', 'word', 'defeated', 'intro']);
  });

  it('leaves non-animation effects untouched', async () => {
    const { api, calls } = sequences();
    await expect(runAnimationEffect({ type: 'REQUEST_NEXT_WORD' }, api, {})).resolves.toEqual([]);
    await expect(runAnimationEffect({ type: 'SHOW_LOSS' }, api, {})).resolves.toEqual([]);
    await expect(runAnimationEffect({ type: 'LOG_ERROR', message: 'test' }, api, {})).resolves.toEqual([]);
    expect(calls).toEqual([]);
  });
});
