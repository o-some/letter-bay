import { describe, expect, it } from 'vitest';
import { GameMachine, transitionGameState } from '../../src/game/gameMachine';
import { createInitialGameState } from '../../src/game/gameState';

function readyMachine(): GameMachine {
  const machine = new GameMachine(createInitialGameState({ sessionId: 'test' }));
  machine.dispatch({ type: 'BOOT_COMPLETE' });
  machine.dispatch({ type: 'ASSETS_READY' });
  machine.dispatch({ type: 'START_BOSS' });
  machine.dispatch({ type: 'WORD_READY', wordId: 'word-1' });
  return machine;
}

describe('Letter Bay game state machine', () => {
  it('boots through asset loading into the boss intro deterministically', () => {
    const machine = new GameMachine(createInitialGameState());
    expect(machine.state.phase).toBe('BOOTING');
    expect(machine.dispatch({ type: 'BOOT_COMPLETE' }).state.phase).toBe('LOADING_ASSETS');
    const intro = machine.dispatch({ type: 'ASSETS_READY' });
    expect(intro.state.phase).toBe('BOSS_INTRO');
    expect(intro.effects).toEqual([{ type: 'SHOW_BOSS_INTRO', bossIndex: 0 }]);
  });

  it('rejects learning input outside PLAYER_INPUT', () => {
    const state = createInitialGameState();
    const transition = transitionGameState(state, {
      type: 'LETTER_GUESSED',
      letter: 'A',
      correct: true,
      wordSolved: false,
    });
    expect(transition.accepted).toBe(false);
    expect(transition.state).toEqual(state);
  });

  it('mirrors legacy letter scoring and loss behavior', () => {
    const machine = readyMachine();
    machine.dispatch({ type: 'LETTER_GUESSED', letter: 'A', correct: true, wordSolved: false });
    expect(machine.state.score).toBe(1);
    expect(machine.state.guessedLetters).toEqual(['A']);

    for (const letter of ['B', 'C', 'D', 'E', 'F', 'G', 'H']) {
      machine.dispatch({ type: 'LETTER_GUESSED', letter, correct: false, wordSolved: false });
    }
    expect(machine.state.tulaHp).toBe(0);
    expect(machine.state.phase).toBe('LOSS');
  });

  it('charges hint and joker costs only once', () => {
    const machine = readyMachine();
    machine.dispatch({ type: 'LETTER_GUESSED', letter: 'A', correct: true, wordSolved: false });
    machine.dispatch({ type: 'LETTER_GUESSED', letter: 'E', correct: true, wordSolved: false });
    machine.dispatch({ type: 'LETTER_GUESSED', letter: 'I', correct: true, wordSolved: false });
    machine.dispatch({ type: 'LETTER_GUESSED', letter: 'O', correct: true, wordSolved: false });
    machine.dispatch({ type: 'LETTER_GUESSED', letter: 'U', correct: true, wordSolved: false });
    expect(machine.state.score).toBe(5);

    expect(machine.dispatch({ type: 'HINT_USED' }).accepted).toBe(true);
    expect(machine.state.score).toBe(3);
    expect(machine.dispatch({ type: 'HINT_USED' }).accepted).toBe(false);
    expect(machine.state.score).toBe(3);

    expect(machine.dispatch({ type: 'JOKER_USED', letter: 'N', wordSolved: false }).accepted).toBe(true);
    expect(machine.state.score).toBe(0);
    expect(machine.dispatch({ type: 'JOKER_USED', letter: 'R', wordSolved: false }).accepted).toBe(false);
    expect(machine.state.score).toBe(0);
  });

  it('fails safe without trapping the session', () => {
    const machine = readyMachine();
    const failed = machine.dispatch({ type: 'FAIL_SAFE', message: 'asset test' });
    expect(failed.state.phase).toBe('ERROR_RECOVERY');
    expect(failed.effects).toEqual([{ type: 'LOG_ERROR', message: 'asset test' }]);
    expect(machine.dispatch({ type: 'RECOVER_FROM_ERROR', to: 'PLAYER_INPUT' }).state.phase).toBe('PLAYER_INPUT');
  });
});
