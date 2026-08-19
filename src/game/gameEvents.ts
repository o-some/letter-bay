export type GameEvent =
  | { type: 'BOOT_COMPLETE' }
  | { type: 'ASSETS_READY' }
  | { type: 'START_BOSS' }
  | { type: 'WORD_READY'; wordId: string }
  | { type: 'LETTER_GUESSED'; letter: string; correct: boolean; wordSolved: boolean }
  | { type: 'FULL_WORD_GUESSED'; correct: boolean }
  | { type: 'WORD_REWARD_RESOLVED' }
  | { type: 'BOSS_HIT_RESOLVED' }
  | { type: 'BOSS_DEFEAT_RESOLVED' }
  | { type: 'HINT_USED' }
  | { type: 'JOKER_USED'; letter: string; wordSolved: boolean }
  | { type: 'CONTINUE_LEARNING' }
  | { type: 'PAUSE' }
  | { type: 'RESUME'; to: 'BOSS_INTRO' | 'PLAYER_INPUT' }
  | { type: 'RECOVER_FROM_ERROR'; to: 'BOSS_INTRO' | 'PLAYER_INPUT' }
  | { type: 'FAIL_SAFE'; message: string };

export type GameEffect =
  | { type: 'REQUEST_NEXT_WORD' }
  | { type: 'PLAY_FEEDBACK'; feedback: 'correct' | 'wrong' | 'word-solved' | 'boss-defeated' }
  | { type: 'SHOW_BOSS_INTRO'; bossIndex: number }
  | { type: 'SHOW_LOSS' }
  | { type: 'LOG_ERROR'; message: string };

export interface TransitionResult<State> {
  state: State;
  effects: GameEffect[];
  accepted: boolean;
}
