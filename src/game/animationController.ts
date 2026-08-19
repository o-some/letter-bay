export type AnimationName =
  | 'keyCorrect'
  | 'letterToWord'
  | 'tulaAttack'
  | 'bossHit'
  | 'keyWrong'
  | 'bossAttack'
  | 'tulaHit'
  | 'wordSolved'
  | 'bossIntro'
  | 'bossDefeated'
  | 'celebrate';

export type AnimationOutcome =
  | 'finished'
  | 'timeout'
  | 'aborted'
  | 'unsupported'
  | 'error';

export interface AnimationRunResult {
  name: AnimationName;
  outcome: AnimationOutcome;
  reducedMotion: boolean;
  elapsedMs: number;
  error?: unknown;
}

export interface AnimationHandleLike {
  finished: Promise<unknown>;
  cancel(): void;
}

export interface AnimationTargetLike {
  animate(keyframes: Keyframe[], options: KeyframeAnimationOptions): AnimationHandleLike;
}

export interface AnimationPreset {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  timeoutMs: number;
}

export interface AnimationControllerOptions {
  prefersReducedMotion?: () => boolean;
  now?: () => number;
  scheduleTimeout?: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearScheduledTimeout?: (id: ReturnType<typeof setTimeout>) => void;
}

const STANDARD_PRESETS: Readonly<Record<AnimationName, AnimationPreset>> = Object.freeze({
  keyCorrect: {
    keyframes: [
      { transform: 'translateY(0) scale(1)', filter: 'brightness(1)' },
      { transform: 'translateY(3px) scale(.94)', filter: 'brightness(1.65)', offset: 0.45 },
      { transform: 'translateY(0) scale(1.04)', filter: 'brightness(1.2)' },
    ],
    options: { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' },
    timeoutMs: 500,
  },
  letterToWord: {
    keyframes: [
      { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
      { transform: 'translate3d(var(--lb-letter-dx,0),var(--lb-letter-dy,-44px),0) scale(1.18)', opacity: 1, offset: 0.72 },
      { transform: 'translate3d(var(--lb-letter-dx,0),var(--lb-letter-dy,-44px),0) scale(.9)', opacity: 0 },
    ],
    options: { duration: 420, easing: 'cubic-bezier(.22,.78,.25,1)', fill: 'forwards' },
    timeoutMs: 750,
  },
  tulaAttack: {
    keyframes: [
      { transform: 'translate3d(0,0,0) scale(1)' },
      { transform: 'translate3d(8px,-2px,0) scale(1.045)', offset: 0.52 },
      { transform: 'translate3d(0,0,0) scale(1)' },
    ],
    options: { duration: 360, easing: 'cubic-bezier(.2,.8,.25,1)' },
    timeoutMs: 700,
  },
  bossHit: {
    keyframes: [
      { transform: 'translate3d(0,0,0) rotate(0deg)', filter: 'brightness(1)' },
      { transform: 'translate3d(9px,-1px,0) rotate(1.5deg)', filter: 'brightness(1.8)', offset: 0.35 },
      { transform: 'translate3d(-4px,0,0) rotate(-.8deg)', filter: 'brightness(1.25)', offset: 0.65 },
      { transform: 'translate3d(0,0,0) rotate(0deg)', filter: 'brightness(1)' },
    ],
    options: { duration: 430, easing: 'cubic-bezier(.25,.7,.2,1)' },
    timeoutMs: 800,
  },
  keyWrong: {
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(-2px)' },
      { transform: 'translateX(0)' },
    ],
    options: { duration: 300, easing: 'ease-out' },
    timeoutMs: 600,
  },
  bossAttack: {
    keyframes: [
      { transform: 'translate3d(0,0,0) scale(1)' },
      { transform: 'translate3d(-8px,-1px,0) scale(1.045)', offset: 0.52 },
      { transform: 'translate3d(0,0,0) scale(1)' },
    ],
    options: { duration: 380, easing: 'cubic-bezier(.2,.8,.25,1)' },
    timeoutMs: 720,
  },
  tulaHit: {
    keyframes: [
      { transform: 'translate3d(0,0,0)', filter: 'brightness(1)' },
      { transform: 'translate3d(-7px,1px,0)', filter: 'brightness(1.45)', offset: 0.38 },
      { transform: 'translate3d(3px,0,0)', filter: 'brightness(1.15)', offset: 0.68 },
      { transform: 'translate3d(0,0,0)', filter: 'brightness(1)' },
    ],
    options: { duration: 430, easing: 'cubic-bezier(.25,.7,.2,1)' },
    timeoutMs: 800,
  },
  wordSolved: {
    keyframes: [
      { transform: 'scale(1)', filter: 'brightness(1)', letterSpacing: 'normal' },
      { transform: 'scale(1.035)', filter: 'brightness(1.6)', letterSpacing: '.03em', offset: 0.55 },
      { transform: 'scale(1)', filter: 'brightness(1.15)', letterSpacing: 'normal' },
    ],
    options: { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' },
    timeoutMs: 900,
  },
  bossIntro: {
    keyframes: [
      { transform: 'translate3d(36px,0,0) scale(.94)', opacity: 0 },
      { transform: 'translate3d(0,0,0) scale(1.025)', opacity: 1, offset: 0.74 },
      { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
    ],
    options: { duration: 620, easing: 'cubic-bezier(.16,.78,.18,1)', fill: 'both' },
    timeoutMs: 1050,
  },
  bossDefeated: {
    keyframes: [
      { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 1 },
      { transform: 'translate3d(7px,3px,0) rotate(2deg)', opacity: 1, offset: 0.38 },
      { transform: 'translate3d(28px,5px,0) rotate(5deg)', opacity: .25 },
    ],
    options: { duration: 700, easing: 'cubic-bezier(.25,.65,.25,1)', fill: 'forwards' },
    timeoutMs: 1150,
  },
  celebrate: {
    keyframes: [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(-7px) scale(1.05)', offset: 0.48 },
      { transform: 'translateY(0) scale(1)' },
    ],
    options: { duration: 560, easing: 'cubic-bezier(.2,.9,.25,1)' },
    timeoutMs: 950,
  },
});

const REDUCED_PRESET: AnimationPreset = Object.freeze({
  keyframes: [
    { opacity: .82 },
    { opacity: 1 },
  ],
  options: { duration: 90, easing: 'linear' },
  timeoutMs: 260,
});

export function animationPreset(name: AnimationName, reducedMotion = false): AnimationPreset {
  return reducedMotion ? REDUCED_PRESET : STANDARD_PRESETS[name];
}

export class AnimationController {
  readonly #prefersReducedMotion: () => boolean;
  readonly #now: () => number;
  readonly #scheduleTimeout: AnimationControllerOptions['scheduleTimeout'];
  readonly #clearScheduledTimeout: AnimationControllerOptions['clearScheduledTimeout'];

  constructor(options: AnimationControllerOptions = {}) {
    this.#prefersReducedMotion = options.prefersReducedMotion ?? (() =>
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    );
    this.#now = options.now ?? (() => globalThis.performance?.now?.() ?? Date.now());
    this.#scheduleTimeout = options.scheduleTimeout ?? ((callback, delayMs) => setTimeout(callback, delayMs));
    this.#clearScheduledTimeout = options.clearScheduledTimeout ?? ((id) => clearTimeout(id));
  }

  async play(
    name: AnimationName,
    target: AnimationTargetLike | null | undefined,
    signal?: AbortSignal,
  ): Promise<AnimationRunResult> {
    const startedAt = this.#now();
    const reducedMotion = this.#prefersReducedMotion();
    const preset = animationPreset(name, reducedMotion);

    if (!target || typeof target.animate !== 'function') {
      return this.#result(name, 'unsupported', reducedMotion, startedAt);
    }

    if (signal?.aborted) {
      return this.#result(name, 'aborted', reducedMotion, startedAt);
    }

    let animation: AnimationHandleLike;
    try {
      animation = target.animate(preset.keyframes, preset.options);
    } catch (error) {
      return this.#result(name, 'error', reducedMotion, startedAt, error);
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let abortHandler: (() => void) | undefined;

    const timeout = new Promise<AnimationOutcome>((resolve) => {
      timer = this.#scheduleTimeout?.(() => resolve('timeout'), preset.timeoutMs);
    });

    const aborted = new Promise<AnimationOutcome>((resolve) => {
      if (!signal) return;
      abortHandler = () => resolve('aborted');
      signal.addEventListener('abort', abortHandler, { once: true });
    });

    const finished = Promise.resolve(animation.finished)
      .then<AnimationOutcome>(() => 'finished')
      .catch<AnimationOutcome>(() => signal?.aborted ? 'aborted' : 'error');

    try {
      const outcome = await Promise.race([finished, timeout, aborted]);
      if (outcome !== 'finished') {
        try { animation.cancel(); } catch { /* best-effort cleanup */ }
      }
      return this.#result(name, outcome, reducedMotion, startedAt);
    } finally {
      if (timer !== undefined) this.#clearScheduledTimeout?.(timer);
      if (signal && abortHandler) signal.removeEventListener('abort', abortHandler);
    }
  }

  async playSequence(
    steps: ReadonlyArray<{ name: AnimationName; target: AnimationTargetLike | null | undefined }>,
    signal?: AbortSignal,
  ): Promise<AnimationRunResult[]> {
    const results: AnimationRunResult[] = [];
    for (const step of steps) {
      if (signal?.aborted) break;
      const result = await this.play(step.name, step.target, signal);
      results.push(result);
      if (result.outcome === 'aborted') break;
    }
    return results;
  }

  #result(
    name: AnimationName,
    outcome: AnimationOutcome,
    reducedMotion: boolean,
    startedAt: number,
    error?: unknown,
  ): AnimationRunResult {
    return {
      name,
      outcome,
      reducedMotion,
      elapsedMs: Math.max(0, this.#now() - startedAt),
      ...(error === undefined ? {} : { error }),
    };
  }
}
