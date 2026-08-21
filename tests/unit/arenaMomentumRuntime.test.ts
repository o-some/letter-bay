import { describe, expect, it } from 'vitest';
import {
  ATTACK_CHOICES,
  BOSS_INTENTS,
  clampMomentum,
  momentumDeltaForMistake,
  momentumDeltaForSolve,
} from '../../src/game/arenaMomentumRuntime';

describe('arena momentum rules', () => {
  it('clamps momentum to the visible arena range', () => {
    expect(clampMomentum(-9)).toBe(-3);
    expect(clampMomentum(0)).toBe(0);
    expect(clampMomentum(8)).toBe(3);
  });

  it('keeps safe, bold and precision attacks meaningfully different', () => {
    const safe = ATTACK_CHOICES.find((entry) => entry.id === 'safe')!;
    const bold = ATTACK_CHOICES.find((entry) => entry.id === 'bold')!;
    const precision = ATTACK_CHOICES.find((entry) => entry.id === 'precision')!;
    const steady = BOSS_INTENTS.find((entry) => entry.id === 'steady')!;

    expect(momentumDeltaForSolve(safe, steady)).toBe(1);
    expect(momentumDeltaForSolve(bold, steady)).toBe(2);
    expect(momentumDeltaForMistake(safe, steady, false).delta).toBe(-1);
    expect(momentumDeltaForMistake(bold, steady, false).delta).toBe(-2);
    expect(momentumDeltaForMistake(precision, steady, true)).toEqual({
      delta: 0,
      precisionShieldAvailable: false,
    });
  });

  it('applies readable boss intent bonuses without touching HP or rewards', () => {
    const safe = ATTACK_CHOICES.find((entry) => entry.id === 'safe')!;
    const pressure = BOSS_INTENTS.find((entry) => entry.id === 'pressure')!;
    const opening = BOSS_INTENTS.find((entry) => entry.id === 'opening')!;

    expect(momentumDeltaForMistake(safe, pressure, false).delta).toBe(-2);
    expect(momentumDeltaForSolve(safe, opening)).toBe(2);
  });
});
