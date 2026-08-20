import {
  AnimationController,
  type AnimationOutcome,
  type AnimationRunResult,
} from './animationController';

export type BossReactionStatus = 'finished' | 'skipped' | 'timeout' | 'aborted' | 'fallback';

export interface BossReactionSequenceResult {
  status: BossReactionStatus;
  animationResults: AnimationRunResult[];
  elapsedMs: number;
}

export interface BossReactionSequenceInput {
  boss: HTMLElement;
  arena: HTMLElement;
  dialogue: HTMLElement;
  defeated: boolean;
  signal?: AbortSignal;
}

export interface BossReactionSequenceOptions {
  controller?: AnimationController;
  holdMs?: number;
  minSkipMs?: number;
  hardTimeoutMs?: number;
  now?: () => number;
  prefersReducedMotion?: () => boolean;
  hold?: (
    dialogue: HTMLElement,
    holdMs: number,
    minSkipMs: number,
    signal: AbortSignal,
  ) => Promise<'finished' | 'skipped' | 'aborted'>;
}

function defaultReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

function visualScale(viewportWidth: number, reducedMotion: boolean): number {
  if (reducedMotion) return 1.04;
  if (viewportWidth < 380) return 1.10;
  if (viewportWidth <= 760) return 1.14;
  return 1.18;
}

function outcomeToStatus(outcome: AnimationOutcome): BossReactionStatus | null {
  if (outcome === 'timeout') return 'timeout';
  if (outcome === 'aborted') return 'aborted';
  if (outcome === 'unsupported' || outcome === 'error') return 'fallback';
  return null;
}

function delay(ms: number, signal: AbortSignal): Promise<'finished' | 'aborted'> {
  if (signal.aborted) return Promise.resolve('aborted');
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve('aborted');
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve('finished');
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function defaultHold(
  dialogue: HTMLElement,
  holdMs: number,
  minSkipMs: number,
  signal: AbortSignal,
): Promise<'finished' | 'skipped' | 'aborted'> {
  if (signal.aborted) return 'aborted';

  let skipEnabled = false;
  let settled = false;

  return new Promise((resolve) => {
    const finish = (value: 'finished' | 'skipped' | 'aborted') => {
      if (settled) return;
      settled = true;
      clearTimeout(minTimer);
      clearTimeout(holdTimer);
      dialogue.removeEventListener('click', onSkip);
      dialogue.removeEventListener('keydown', onKey);
      signal.removeEventListener('abort', onAbort);
      resolve(value);
    };
    const onSkip = () => {
      if (skipEnabled) finish('skipped');
    };
    const onKey = (event: KeyboardEvent) => {
      if (!skipEnabled) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        finish('skipped');
      }
    };
    const onAbort = () => finish('aborted');
    const minTimer = setTimeout(() => { skipEnabled = true; }, minSkipMs);
    const holdTimer = setTimeout(() => finish('finished'), holdMs);

    dialogue.addEventListener('click', onSkip);
    dialogue.addEventListener('keydown', onKey);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export async function playBossWordReaction(
  input: BossReactionSequenceInput,
  options: BossReactionSequenceOptions = {},
): Promise<BossReactionSequenceResult> {
  const controller = options.controller ?? new AnimationController();
  const holdMs = options.holdMs ?? 2500;
  const minSkipMs = options.minSkipMs ?? 650;
  const hardTimeoutMs = options.hardTimeoutMs ?? 5000;
  const now = options.now ?? (() => globalThis.performance?.now?.() ?? Date.now());
  const prefersReducedMotion = options.prefersReducedMotion ?? defaultReducedMotion;
  const hold = options.hold ?? defaultHold;
  const startedAt = now();
  const reducedMotion = prefersReducedMotion();
  const localAbort = new AbortController();
  const results: AnimationRunResult[] = [];
  let hardTimedOut = false;
  let externalAbortHandler: (() => void) | undefined;

  if (input.signal?.aborted) {
    return { status: 'aborted', animationResults: [], elapsedMs: 0 };
  }

  if (input.signal) {
    externalAbortHandler = () => localAbort.abort();
    input.signal.addEventListener('abort', externalAbortHandler, { once: true });
  }

  const hardTimer = setTimeout(() => {
    hardTimedOut = true;
    localAbort.abort();
  }, hardTimeoutMs);

  const cleanup = () => {
    input.dialogue.hidden = true;
    input.dialogue.removeAttribute('data-visible');
    input.boss.style.removeProperty('transform');
    input.boss.style.removeProperty('filter');
    input.boss.style.removeProperty('--lb-boss-reaction-dx');
    input.boss.style.removeProperty('--lb-boss-reaction-scale');
    input.boss.style.removeProperty('--lb-boss-reaction-overshoot');
  };

  try {
    const bossRect = input.boss.getBoundingClientRect();
    const arenaRect = input.arena.getBoundingClientRect();
    const viewportWidth = typeof window === 'undefined' ? arenaRect.width : window.innerWidth;
    const scale = visualScale(viewportWidth, reducedMotion);
    const targetCenterX = arenaRect.left + arenaRect.width * .59;
    const bossCenterX = bossRect.left + bossRect.width / 2;
    const dx = reducedMotion ? 0 : targetCenterX - bossCenterX;

    input.boss.style.setProperty('--lb-boss-reaction-dx', `${dx.toFixed(2)}px`);
    input.boss.style.setProperty('--lb-boss-reaction-scale', scale.toFixed(3));
    input.boss.style.setProperty('--lb-boss-reaction-overshoot', (scale + (reducedMotion ? 0 : .03)).toFixed(3));

    const play = async (name: Parameters<AnimationController['play']>[0], target: HTMLElement) => {
      const result = await controller.play(name, target, localAbort.signal);
      results.push(result);
      return result;
    };

    const impact = await play('bossReactionImpact', input.boss);
    const impactStatus = outcomeToStatus(impact.outcome);
    if (impactStatus === 'aborted') {
      return { status: hardTimedOut ? 'timeout' : 'aborted', animationResults: results, elapsedMs: now() - startedAt };
    }

    const advance = await play('bossReactionAdvance', input.boss);
    const advanceStatus = outcomeToStatus(advance.outcome);
    if (advanceStatus === 'aborted') {
      return { status: hardTimedOut ? 'timeout' : 'aborted', animationResults: results, elapsedMs: now() - startedAt };
    }

    // WebKit can discard a finished WAAPI transform once the Animation object becomes collectable.
    // Persist the cinematic center pose as inline transform for the dialogue hold, then animate back.
    input.boss.style.transform = `translate3d(${dx.toFixed(2)}px,0,0) scale(${scale.toFixed(3)})`;
    input.boss.style.filter = 'brightness(1.08)';

    input.dialogue.hidden = false;
    input.dialogue.setAttribute('data-visible', 'true');
    const dialogueIn = await play('bossReactionDialogueIn', input.dialogue);
    if (outcomeToStatus(dialogueIn.outcome) === 'aborted') {
      return { status: hardTimedOut ? 'timeout' : 'aborted', animationResults: results, elapsedMs: now() - startedAt };
    }

    const holdResult = await hold(
      input.dialogue,
      reducedMotion ? Math.min(holdMs, 1800) : holdMs,
      minSkipMs,
      localAbort.signal,
    );
    if (holdResult === 'aborted') {
      return { status: hardTimedOut ? 'timeout' : 'aborted', animationResults: results, elapsedMs: now() - startedAt };
    }

    await play('bossReactionDialogueOut', input.dialogue);
    input.dialogue.hidden = true;
    input.dialogue.removeAttribute('data-visible');

    const exit = await play(input.defeated ? 'bossReactionDefeat' : 'bossReactionReturn', input.boss);
    const exitStatus = outcomeToStatus(exit.outcome);
    if (exitStatus === 'timeout') {
      return { status: 'timeout', animationResults: results, elapsedMs: now() - startedAt };
    }
    if (exitStatus === 'aborted') {
      return { status: hardTimedOut ? 'timeout' : 'aborted', animationResults: results, elapsedMs: now() - startedAt };
    }
    if (exitStatus === 'fallback' || advanceStatus === 'fallback' || impactStatus === 'fallback') {
      return { status: 'fallback', animationResults: results, elapsedMs: now() - startedAt };
    }

    if (!input.defeated) await delay(40, localAbort.signal);
    return {
      status: holdResult === 'skipped' ? 'skipped' : 'finished',
      animationResults: results,
      elapsedMs: Math.max(0, now() - startedAt),
    };
  } catch {
    return {
      status: hardTimedOut ? 'timeout' : 'fallback',
      animationResults: results,
      elapsedMs: Math.max(0, now() - startedAt),
    };
  } finally {
    clearTimeout(hardTimer);
    if (input.signal && externalAbortHandler) input.signal.removeEventListener('abort', externalAbortHandler);
    cleanup();
  }
}

export { visualScale as bossReactionVisualScale };
