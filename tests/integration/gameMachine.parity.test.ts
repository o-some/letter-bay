import { describe, expect, it } from 'vitest';
import { GameMachine } from '../../src/game/gameMachine';
import { createInitialGameState } from '../../src/game/gameState';

function bootIntoBoss(machine: GameMachine) {
  machine.dispatch({ type: 'BOOT_COMPLETE' });
  machine.dispatch({ type: 'ASSETS_READY' });
  expect(machine.state.phase).toBe('BOSS_INTRO');
}

function startWord(machine: GameMachine, wordId: string) {
  const start = machine.dispatch({ type: 'START_BOSS' });
  expect(start.effects).toContainEqual({ type: 'REQUEST_NEXT_WORD' });
  machine.dispatch({ type: 'WORD_READY', wordId });
  expect(machine.state.phase).toBe('PLAYER_INPUT');
  expect(machine.state.tulaHp).toBe(7);
}

function solveCurrentWord(machine: GameMachine) {
  machine.dispatch({ type: 'FULL_WORD_GUESSED', correct: true });
  expect(machine.state.phase).toBe('WORD_SOLVED');
  machine.dispatch({ type: 'WORD_REWARD_RESOLVED' });
  expect(machine.state.phase).toBe('BOSS_HIT');
  machine.dispatch({ type: 'BOSS_HIT_RESOLVED' });
}

describe('Legacy parity flows through the typed state machine', () => {
  it('reproduces three solved words -> Boss 2 intro with legacy rewards', () => {
    const machine = new GameMachine(createInitialGameState({ sessionId: 'boss-parity' }));
    bootIntoBoss(machine);

    startWord(machine, 'word-1');
    solveCurrentWord(machine);
    expect(machine.state.phase).toBe('WORD_DISCOVERY');
    expect(machine.state.bossHp).toBe(2);
    expect(machine.state.score).toBe(17);
    expect(machine.state.shells).toBe(2);

    machine.dispatch({ type: 'WORD_READY', wordId: 'word-2' });
    solveCurrentWord(machine);
    expect(machine.state.phase).toBe('WORD_DISCOVERY');
    expect(machine.state.bossHp).toBe(1);
    expect(machine.state.score).toBe(34);
    expect(machine.state.shells).toBe(4);

    machine.dispatch({ type: 'WORD_READY', wordId: 'word-3' });
    solveCurrentWord(machine);
    expect(machine.state.phase).toBe('BOSS_DEFEATED');
    expect(machine.state.bossHp).toBe(0);
    expect(machine.state.score).toBe(51);
    expect(machine.state.shells).toBe(18);

    const nextBoss = machine.dispatch({ type: 'BOSS_DEFEAT_RESOLVED' });
    expect(nextBoss.state.phase).toBe('BOSS_INTRO');
    expect(nextBoss.state.bossIndex).toBe(1);
    expect(nextBoss.state.bossHp).toBe(3);
    expect(nextBoss.effects).toEqual([{ type: 'SHOW_BOSS_INTRO', bossIndex: 1 }]);
  });

  it('resets Tula to 7 HP for each new word exactly like legacy', () => {
    const machine = new GameMachine(createInitialGameState({ sessionId: 'hp-parity' }));
    bootIntoBoss(machine);
    startWord(machine, 'word-a');

    machine.dispatch({ type: 'FULL_WORD_GUESSED', correct: false });
    machine.dispatch({ type: 'FULL_WORD_GUESSED', correct: false });
    expect(machine.state.tulaHp).toBe(5);

    machine.dispatch({ type: 'FULL_WORD_GUESSED', correct: true });
    machine.dispatch({ type: 'WORD_REWARD_RESOLVED' });
    machine.dispatch({ type: 'BOSS_HIT_RESOLVED' });
    machine.dispatch({ type: 'WORD_READY', wordId: 'word-b' });

    expect(machine.state.tulaHp).toBe(7);
  });

  it('recovers from loss without changing boss HP or solved-word progress', () => {
    const machine = new GameMachine(createInitialGameState({ sessionId: 'loss-parity' }));
    bootIntoBoss(machine);
    startWord(machine, 'word-loss');

    for (let index = 0; index < 7; index += 1) {
      machine.dispatch({ type: 'FULL_WORD_GUESSED', correct: false });
    }

    expect(machine.state.phase).toBe('LOSS');
    expect(machine.state.bossHp).toBe(3);
    expect(machine.state.wordsSolvedThisBoss).toBe(0);

    const recover = machine.dispatch({ type: 'CONTINUE_LEARNING' });
    expect(recover.state.phase).toBe('WORD_DISCOVERY');
    expect(recover.state.tulaHp).toBe(7);
    expect(recover.state.bossHp).toBe(3);
    expect(recover.effects).toEqual([{ type: 'REQUEST_NEXT_WORD' }]);
  });
});
