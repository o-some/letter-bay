import type { GameEffect, GameEvent, TransitionResult } from './gameEvents';
import {
  LEGACY_PARITY_RULES,
  canAcceptLearningInput,
  type GameState,
  type LegacyParityRules,
} from './gameState';

const INPUT_EVENTS = new Set<GameEvent['type']>([
  'LETTER_GUESSED',
  'FULL_WORD_GUESSED',
  'HINT_USED',
  'JOKER_USED',
]);

function result(
  state: GameState,
  accepted: boolean,
  effects: GameEffect[] = [],
): TransitionResult<GameState> {
  return { state, accepted, effects };
}

function uniqueAppend(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value];
}

function normalizedLetter(letter: string): string {
  return letter.trim().toLocaleUpperCase('de-DE');
}

export function transitionGameState(
  state: Readonly<GameState>,
  event: GameEvent,
  rules: LegacyParityRules = LEGACY_PARITY_RULES,
): TransitionResult<GameState> {
  if (INPUT_EVENTS.has(event.type) && !canAcceptLearningInput(state.phase)) {
    return result({ ...state }, false);
  }

  switch (event.type) {
    case 'BOOT_COMPLETE':
      if (state.phase !== 'BOOTING') return result({ ...state }, false);
      return result({ ...state, phase: 'LOADING_ASSETS' }, true);

    case 'ASSETS_READY':
      if (state.phase !== 'LOADING_ASSETS') return result({ ...state }, false);
      return result(
        { ...state, phase: 'BOSS_INTRO' },
        true,
        [{ type: 'SHOW_BOSS_INTRO', bossIndex: state.bossIndex }],
      );

    case 'START_BOSS':
      if (state.phase !== 'BOSS_INTRO') return result({ ...state }, false);
      return result(
        { ...state, phase: 'WORD_DISCOVERY', currentWordId: null },
        true,
        [{ type: 'REQUEST_NEXT_WORD' }],
      );

    case 'WORD_READY':
      if (state.phase !== 'WORD_DISCOVERY') return result({ ...state }, false);
      return result({
        ...state,
        phase: 'PLAYER_INPUT',
        currentWordId: event.wordId,
        tulaHp: rules.resetTulaHpOnNewWord ? rules.tulaHpPerWord : state.tulaHp,
        guessedLetters: [],
        wrongLetters: [],
        hintUsed: false,
        jokerUsed: false,
        combo: 0,
        lastError: null,
      }, true);

    case 'LETTER_GUESSED': {
      if (state.phase !== 'PLAYER_INPUT') return result({ ...state }, false);
      const letter = normalizedLetter(event.letter);
      if (!letter || state.guessedLetters.includes(letter) || state.wrongLetters.includes(letter)) {
        return result({ ...state }, false);
      }

      if (event.correct) {
        const next = {
          ...state,
          guessedLetters: uniqueAppend(state.guessedLetters, letter),
          score: state.score + 1,
          phase: event.wordSolved ? 'WORD_SOLVED' as const : 'PLAYER_INPUT' as const,
        };
        return result(next, true, [
          { type: 'PLAY_FEEDBACK', feedback: event.wordSolved ? 'word-solved' : 'correct' },
        ]);
      }

      const tulaHp = Math.max(0, state.tulaHp - 1);
      const lost = tulaHp === 0;
      return result({
        ...state,
        tulaHp,
        wrongLetters: uniqueAppend(state.wrongLetters, letter),
        combo: 0,
        phase: lost ? 'LOSS' : 'PLAYER_INPUT',
      }, true, [
        { type: 'PLAY_FEEDBACK', feedback: 'wrong' },
        ...(lost ? [{ type: 'SHOW_LOSS' } as const] : []),
      ]);
    }

    case 'FULL_WORD_GUESSED': {
      if (state.phase !== 'PLAYER_INPUT') return result({ ...state }, false);
      if (event.correct) {
        return result(
          { ...state, phase: 'WORD_SOLVED' },
          true,
          [{ type: 'PLAY_FEEDBACK', feedback: 'word-solved' }],
        );
      }
      const tulaHp = Math.max(0, state.tulaHp - 1);
      const lost = tulaHp === 0;
      return result({
        ...state,
        tulaHp,
        combo: 0,
        phase: lost ? 'LOSS' : 'PLAYER_INPUT',
      }, true, [
        { type: 'PLAY_FEEDBACK', feedback: 'wrong' },
        ...(lost ? [{ type: 'SHOW_LOSS' } as const] : []),
      ]);
    }

    case 'HINT_USED':
      if (state.phase !== 'PLAYER_INPUT' || state.hintUsed) return result({ ...state }, false);
      return result({
        ...state,
        hintUsed: true,
        score: Math.max(0, state.score - rules.hintScoreCost),
      }, true);

    case 'JOKER_USED': {
      if (state.phase !== 'PLAYER_INPUT' || state.jokerUsed) return result({ ...state }, false);
      const letter = normalizedLetter(event.letter);
      if (!letter) return result({ ...state }, false);
      return result({
        ...state,
        jokerUsed: true,
        score: Math.max(0, state.score - rules.jokerScoreCost),
        guessedLetters: uniqueAppend(state.guessedLetters, letter),
        phase: event.wordSolved ? 'WORD_SOLVED' : 'PLAYER_INPUT',
      }, true, event.wordSolved ? [{ type: 'PLAY_FEEDBACK', feedback: 'word-solved' }] : []);
    }

    case 'WORD_REWARD_RESOLVED': {
      if (state.phase !== 'WORD_SOLVED') return result({ ...state }, false);
      const bossHp = Math.max(0, state.bossHp - 1);
      const bossDefeated = bossHp === 0;
      return result({
        ...state,
        phase: 'BOSS_HIT',
        bossHp,
        wordsSolvedThisBoss: state.wordsSolvedThisBoss + 1,
        score: state.score + rules.wordBaseScore + state.tulaHp,
        shells: state.shells + rules.shellsPerWord + (bossDefeated ? rules.shellsPerBoss : 0),
      }, true, [{ type: 'PLAY_FEEDBACK', feedback: 'word-solved' }]);
    }

    case 'BOSS_HIT_RESOLVED':
      if (state.phase !== 'BOSS_HIT') return result({ ...state }, false);
      if (state.bossHp === 0) {
        return result(
          { ...state, phase: 'BOSS_DEFEATED' },
          true,
          [{ type: 'PLAY_FEEDBACK', feedback: 'boss-defeated' }],
        );
      }
      return result(
        { ...state, phase: 'WORD_DISCOVERY', currentWordId: null },
        true,
        [{ type: 'REQUEST_NEXT_WORD' }],
      );

    case 'BOSS_DEFEAT_RESOLVED':
      if (state.phase !== 'BOSS_DEFEATED') return result({ ...state }, false);
      if (state.bossIndex >= 9) return result({ ...state }, true);
      return result({
        ...state,
        phase: 'BOSS_INTRO',
        bossIndex: state.bossIndex + 1,
        bossHp: rules.bossHpPerBattle,
        tulaHp: rules.tulaHpPerWord,
        currentWordId: null,
        guessedLetters: [],
        wrongLetters: [],
        wordsSolvedThisBoss: 0,
        hintUsed: false,
        jokerUsed: false,
      }, true, [{ type: 'SHOW_BOSS_INTRO', bossIndex: state.bossIndex + 1 }]);

    case 'CONTINUE_LEARNING':
      if (state.phase !== 'LOSS') return result({ ...state }, false);
      return result({
        ...state,
        phase: 'WORD_DISCOVERY',
        tulaHp: rules.tulaHpPerWord,
        currentWordId: null,
        guessedLetters: [],
        wrongLetters: [],
        hintUsed: false,
        jokerUsed: false,
      }, true, [{ type: 'REQUEST_NEXT_WORD' }]);

    case 'PAUSE':
      if (state.phase !== 'PLAYER_INPUT' && state.phase !== 'BOSS_INTRO') return result({ ...state }, false);
      return result({ ...state, phase: 'PAUSED' }, true);

    case 'RESUME':
      if (state.phase !== 'PAUSED') return result({ ...state }, false);
      return result({ ...state, phase: event.to }, true);

    case 'FAIL_SAFE':
      return result(
        { ...state, phase: 'ERROR_RECOVERY', lastError: event.message },
        true,
        [{ type: 'LOG_ERROR', message: event.message }],
      );

    case 'RECOVER_FROM_ERROR':
      if (state.phase !== 'ERROR_RECOVERY') return result({ ...state }, false);
      return result({ ...state, phase: event.to, lastError: null }, true);

    default:
      return result({ ...state }, false);
  }
}

export class GameMachine {
  #state: GameState;
  readonly #rules: LegacyParityRules;

  constructor(initialState: GameState, rules: LegacyParityRules = LEGACY_PARITY_RULES) {
    this.#state = structuredClone(initialState);
    this.#rules = rules;
  }

  get state(): Readonly<GameState> {
    return this.#state;
  }

  dispatch(event: GameEvent): TransitionResult<GameState> {
    const transition = transitionGameState(this.#state, event, this.#rules);
    if (transition.accepted) this.#state = transition.state;
    return transition;
  }
}
