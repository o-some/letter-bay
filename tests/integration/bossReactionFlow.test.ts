import { describe, expect, it } from 'vitest';
import { GameMachine } from '../../src/game/gameMachine';
import { createInitialGameState } from '../../src/game/gameState';

function readyWord(): GameMachine {
  const machine = new GameMachine(createInitialGameState({ sessionId: 'reaction-flow' }));
  machine.dispatch({ type: 'BOOT_COMPLETE' });
  machine.dispatch({ type: 'ASSETS_READY' });
  machine.dispatch({ type: 'START_BOSS' });
  machine.dispatch({ type: 'WORD_READY', wordId: 'word-1' });
  return machine;
}

function solveAndReward(machine: GameMachine) {
  expect(machine.dispatch({ type: 'FULL_WORD_GUESSED', correct: true }).state.phase).toBe('WORD_SOLVED');
  return machine.dispatch({ type: 'WORD_REWARD_RESOLVED' });
}

describe('boss reaction state integration', () => {
  it('locks in BOSS_REACTION and awards HP/score/shells only once', () => {
    const machine = readyWord();
    const reward = solveAndReward(machine);

    expect(reward.state.phase).toBe('BOSS_REACTION');
    expect(reward.state.bossHp).toBe(2);
    expect(reward.state.score).toBe(17);
    expect(reward.state.shells).toBe(2);
    expect(reward.effects).toEqual([{ type: 'PLAY_BOSS_REACTION', bossIndex: 0, defeated: false }]);

    const duplicate = machine.dispatch({ type: 'WORD_REWARD_RESOLVED' });
    expect(duplicate.accepted).toBe(false);
    expect(machine.state.bossHp).toBe(2);
    expect(machine.state.score).toBe(17);
    expect(machine.state.shells).toBe(2);

    expect(machine.dispatch({ type: 'FULL_WORD_GUESSED', correct: true }).accepted).toBe(false);
    expect(machine.dispatch({ type: 'HINT_USED' }).accepted).toBe(false);
    expect(machine.dispatch({ type: 'JOKER_USED', letter: 'A', wordSolved: false }).accepted).toBe(false);

    expect(machine.dispatch({ type: 'BOSS_REACTION_RESOLVED' }).state.phase).toBe('BOSS_HIT');
    const next = machine.dispatch({ type: 'BOSS_HIT_RESOLVED' });
    expect(next.state.phase).toBe('WORD_DISCOVERY');
    expect(next.effects).toEqual([{ type: 'REQUEST_NEXT_WORD' }]);
  });

  it('goes directly from the third boss reaction into BOSS_DEFEATED', () => {
    const machine = readyWord();

    for (let round = 0; round < 3; round += 1) {
      if (round > 0) machine.dispatch({ type: 'WORD_READY', wordId: `word-${round + 1}` });
      const reward = solveAndReward(machine);
      expect(reward.state.phase).toBe('BOSS_REACTION');
      const resolved = machine.dispatch({ type: 'BOSS_REACTION_RESOLVED' });
      if (round < 2) {
        expect(resolved.state.phase).toBe('BOSS_HIT');
        machine.dispatch({ type: 'BOSS_HIT_RESOLVED' });
      } else {
        expect(resolved.state.phase).toBe('BOSS_DEFEATED');
        expect(machine.state.bossHp).toBe(0);
        expect(machine.state.shells).toBe(18);
        expect(resolved.effects).toEqual([{ type: 'PLAY_FEEDBACK', feedback: 'boss-defeated' }]);
      }
    }
  });
});
