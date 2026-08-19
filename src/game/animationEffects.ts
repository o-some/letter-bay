import type { GameEffect } from './gameEvents';
import type { AnimationRunResult } from './animationController';
import type { BattleAnimationSequences, BattleAnimationTargets } from './battleAnimations';

export async function runAnimationEffect(
  effect: GameEffect,
  sequences: BattleAnimationSequences,
  targets: BattleAnimationTargets,
  signal?: AbortSignal,
): Promise<AnimationRunResult[]> {
  switch (effect.type) {
    case 'PLAY_FEEDBACK':
      switch (effect.feedback) {
        case 'correct':
          return sequences.correctLetter(targets, signal);
        case 'wrong':
          return sequences.wrongLetter(targets, signal);
        case 'word-solved':
          return sequences.wordSolved(targets, signal);
        case 'boss-defeated':
          return sequences.bossDefeated(targets, signal);
      }
      return [];

    case 'SHOW_BOSS_INTRO':
      return sequences.bossIntro(targets, signal);

    case 'REQUEST_NEXT_WORD':
    case 'SHOW_LOSS':
    case 'LOG_ERROR':
      return [];
  }
}
