import { describe, expect, it } from 'vitest';
import {
  BossReactionSelector,
  DEFEATED_BOSS_REACTIONS,
  NORMAL_BOSS_REACTIONS,
  TULA_REACTIONS,
  TulaReactionSelector,
} from '../../src/data/bossReactions';

describe('boss reaction dialogue selector', () => {
  it('provides at least twenty normal and eight defeat reactions', () => {
    expect(NORMAL_BOSS_REACTIONS.length).toBeGreaterThanOrEqual(20);
    expect(DEFEATED_BOSS_REACTIONS.length).toBeGreaterThanOrEqual(8);
  });

  it('selects from the correct pool', () => {
    const selector = new BossReactionSelector({ random: () => 0 });
    const normal = selector.select(0, 'normal');
    const defeated = selector.select(0, 'defeated');
    expect(NORMAL_BOSS_REACTIONS).toContain(normal.text);
    expect(DEFEATED_BOSS_REACTIONS).toContain(defeated.text);
  });

  it('does not repeat the same sentence directly for the same boss and kind', () => {
    const selector = new BossReactionSelector({ random: () => 0 });
    const first = selector.select(1, 'normal').text;
    const second = selector.select(1, 'normal').text;
    expect(second).not.toBe(first);
  });

  it('tracks normal and defeated pools independently', () => {
    const selector = new BossReactionSelector({ random: () => 0 });
    const normal = selector.select(2, 'normal');
    const defeated = selector.select(2, 'defeated');
    expect(normal.kind).toBe('normal');
    expect(defeated.kind).toBe('defeated');
  });

  it('gives Tula a separate rotating encouragement pool', () => {
    expect(TULA_REACTIONS.length).toBeGreaterThanOrEqual(12);
    const selector = new TulaReactionSelector({ random: () => 0 });
    const first = selector.select();
    const second = selector.select();
    expect(TULA_REACTIONS).toContain(first);
    expect(TULA_REACTIONS).toContain(second);
    expect(second).not.toBe(first);
  });
});
