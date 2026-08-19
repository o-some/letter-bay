export const GAME_PHASES = [
  'BOOTING',
  'LOADING_ASSETS',
  'BOSS_INTRO',
  'WORD_DISCOVERY',
  'PLAYER_INPUT',
  'RESOLVING_LETTER',
  'RESOLVING_WORD',
  'WORD_SOLVED',
  'MASTERY_CHALLENGE',
  'MASTERY_RESULT',
  'BOSS_HIT',
  'BOSS_DEFEATED',
  'LEVEL_TRANSITION',
  'LOSS',
  'RECOVERY_TRAINING',
  'PAUSED',
  'ERROR_RECOVERY',
] as const;

export type GamePhase = (typeof GAME_PHASES)[number];

export interface LegacyParityRules {
  bossHpPerBattle: number;
  tulaHpPerWord: number;
  wordsPerBoss: number;
  resetTulaHpOnNewWord: boolean;
  wordBaseScore: number;
  shellsPerWord: number;
  shellsPerBoss: number;
  hintScoreCost: number;
  jokerScoreCost: number;
}

export const LEGACY_PARITY_RULES: Readonly<LegacyParityRules> = Object.freeze({
  bossHpPerBattle: 3,
  tulaHpPerWord: 7,
  wordsPerBoss: 3,
  resetTulaHpOnNewWord: true,
  wordBaseScore: 10,
  shellsPerWord: 2,
  shellsPerBoss: 12,
  hintScoreCost: 2,
  jokerScoreCost: 4,
});

export interface GameState {
  phase: GamePhase;
  bossIndex: number;
  bossHp: number;
  tulaHp: number;
  score: number;
  shells: number;
  energy: number;
  combo: number;
  currentWordId: string | null;
  guessedLetters: string[];
  wrongLetters: string[];
  selectedHelper: string | null;
  hintUsed: boolean;
  jokerUsed: boolean;
  wordsSolvedThisBoss: number;
  lastError: string | null;
  sessionId: string;
}

export interface InitialStateOptions {
  sessionId?: string;
  bossIndex?: number;
  score?: number;
  shells?: number;
}

export function createInitialGameState(
  options: InitialStateOptions = {},
  rules: LegacyParityRules = LEGACY_PARITY_RULES,
): GameState {
  return {
    phase: 'BOOTING',
    bossIndex: options.bossIndex ?? 0,
    bossHp: rules.bossHpPerBattle,
    tulaHp: rules.tulaHpPerWord,
    score: options.score ?? 0,
    shells: options.shells ?? 0,
    energy: 0,
    combo: 0,
    currentWordId: null,
    guessedLetters: [],
    wrongLetters: [],
    selectedHelper: null,
    hintUsed: false,
    jokerUsed: false,
    wordsSolvedThisBoss: 0,
    lastError: null,
    sessionId: options.sessionId ?? 'letter-bay-session',
  };
}

export function canAcceptLearningInput(phase: GamePhase): boolean {
  return phase === 'PLAYER_INPUT' || phase === 'MASTERY_CHALLENGE';
}
