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
  tula: HTMLElement;
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
  if (reducedMotion) return 1.025;
  if (viewportWidth < 380) return 1.08;
  if (viewportWidth <= 760) return 1.10;
  return 1.12;
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

function firstBlockingStatus(results: AnimationRunResult[]): BossReactionStatus | null {
  for (const result of results) {
    const status = outcomeToStatus(result.outcome);
    if (status) return status;
  }
  return null;
}

export async function playBossWordReaction(
  input: BossReactionSequenceInput,
  options: BossReactionSequenceOptions = {},
): Promise<BossReactionSequenceResult> {
  const controller = options.controller ?? new AnimationController();
  const holdMs = options.holdMs ?? 2500;
  const minSkipMs = options.minSkipMs ?? 650;
  const hardTimeoutMs = options.hardTimeoutMs ?? 5500;
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
    input.tula.style.removeProperty('transform');
    input.tula.style.removeProperty('filter');
    input.tula.style.removeProperty('--lb-boss-reaction-dx');
    input.tula.style.removeProperty('--lb-boss-reaction-scale');
    input.tula.style.removeProperty('--lb-boss-reaction-overshoot');
  };

  try {
    const tulaRect = input.tula.getBoundingClientRect();
    const arenaRect = input.arena.getBoundingClientRect();
    const viewportWidth = typeof window === 'undefined' ? arenaRect.width : window.innerWidth;
    const scale = visualScale(viewportWidth, reducedMotion);
    const targetCenterX = arenaRect.left + arenaRect.width * .43;
    const tulaCenterX = tulaRect.left + tulaRect.width / 2;
    const dx = reducedMotion ? 0 : Math.max(0, targetCenterX - tulaCenterX);

    input.tula.style.setProperty('--lb-boss-reaction-dx', `${dx.toFixed(2)}px`);
    input.tula.style.setProperty('--lb-boss-reaction-scale', scale.toFixed(3));
    input.tula.style.setProperty('--lb-boss-reaction-overshoot', (scale + (reducedMotion ? 0 : .025)).toFixed(3));

    const impact = await controller.play('bossReactionImpact', input.boss, localAbort.signal);
    results.push(impact);
    const impactStatus = outcomeToStatus(impact.outcome);
    if (impactStatus === 'aborted') {
      return { status: hardTimedOut ? 'timeout' : 'aborted', animationResults: results, elapsedMs: now() - startedAt };
    }

    const [advance, hit] = await Promise.all([
      controller.play('bossReactionAdvance', input.tula, localAbort.signal),
      controller.play('bossHit', input.boss, localAbort.signal),
    ]);
    results.push(advance, hit);
    const attackStatus = firstBlockingStatus([advance, hit]);
    if (attackStatus === 'aborted') {
      return { status: hardTimedOut ? 'timeout' : 'aborted', animationResults: results, elapsedMs: now() - startedAt };
    }

    // Keep Tula in the attack position during the dialogue; WebKit can otherwise drop
    // the completed WAAPI transform before the 2.5 s reaction hold is finished.
    input.tula.style.transform = `translate3d(${dx.toFixed(2)}px,0,0) scale(${scale.toFixed(3)})`;
    input.tula.style.filter = 'brightness(1.08) drop-shadow(0 9px 12px rgba(0,16,29,.45))';

    input.dialogue.hidden = false;
    input.dialogue.setAttribute('data-visible', 'true');
    const dialogueIn = await controller.play('bossReactionDialogueIn', input.dialogue, localAbort.signal);
    results.push(dialogueIn);
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

    const dialogueOut = await controller.play('bossReactionDialogueOut', input.dialogue, localAbort.signal);
    results.push(dialogueOut);
    input.dialogue.hidden = true;
    input.dialogue.removeAttribute('data-visible');

    if (input.defeated) {
      const [returnTula, defeatBoss] = await Promise.all([
        controller.play('bossReactionReturn', input.tula, localAbort.signal),
        controller.play('bossReactionDefeat', input.boss, localAbort.signal),
      ]);
      results.push(returnTula, defeatBoss);
      const exitStatus = firstBlockingStatus([returnTula, defeatBoss]);
      if (exitStatus === 'timeout') {
        return { status: 'timeout', animationResults: results, elapsedMs: now() - startedAt };
      }
      if (exitStatus === 'aborted') {
        return { status: hardTimedOut ? 'timeout' : 'aborted', animationResults: results, elapsedMs: now() - startedAt };
      }
      if (exitStatus === 'fallback' || attackStatus === 'fallback' || impactStatus === 'fallback') {
        return { status: 'fallback', animationResults: results, elapsedMs: now() - startedAt };
      }
    } else {
      const returnTula = await controller.play('bossReactionReturn', input.tula, localAbort.signal);
      results.push(returnTula);
      const exitStatus = outcomeToStatus(returnTula.outcome);
      if (exitStatus === 'timeout') {
        return { status: 'timeout', animationResults: results, elapsedMs: now() - startedAt };
      }
      if (exitStatus === 'aborted') {
        return { status: hardTimedOut ? 'timeout' : 'aborted', animationResults: results, elapsedMs: now() - startedAt };
      }
      if (exitStatus === 'fallback' || attackStatus === 'fallback' || impactStatus === 'fallback') {
        return { status: 'fallback', animationResults: results, elapsedMs: now() - startedAt };
      }
      await delay(40, localAbort.signal);
    }

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
