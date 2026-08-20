export const NORMAL_BOSS_REACTIONS = Object.freeze([
  'Wow – das hast du richtig gut gemacht!',
  'Stark! Damit habe ich nicht gerechnet.',
  'Respekt! Das war ein richtig guter Treffer.',
  'Nicht schlecht – du wirst immer besser!',
  'Autsch! Das Wort saß.',
  'Sehr gut gelöst!',
  'Du bist schlauer, als ich dachte.',
  'Okay, okay – das war stark!',
  'Das war ein Volltreffer.',
  'Du hast mich erwischt!',
  'Unglaublich – das war richtig gut.',
  'Da muss ich mich wohl mehr anstrengen.',
  'Wow! Du lernst wirklich schnell.',
  'Das war clever gelöst.',
  'Starker Zug!',
  'Nicht übel, kleine Sprachpiratin!',
  'Den Treffer habe ich gespürt.',
  'Sehr stark – weiter so!',
  'Dieses Wort gehörte eindeutig dir.',
  'Okay, diese Runde geht an dich!',
  'Arrr – das war beeindruckend gelöst!',
  'Du hast Köpfchen. Das muss ich dir lassen.',
] as const);

export const DEFEATED_BOSS_REACTIONS = Object.freeze([
  'Wow – du hast mich besiegt. Ich gebe mich geschlagen!',
  'Respekt! Diesen Kampf hast du gewonnen.',
  'Arrr … ich gebe auf. Du warst zu stark!',
  'Okay, ich kapituliere. Das war beeindruckend.',
  'Du hast gewonnen – verdient!',
  'Ich ziehe mich zurück. Du hast mich überzeugt.',
  'Stark gespielt. Ich gebe mich geschlagen.',
  'Diese Runde gehört dir. Respekt!',
  'Meine Flagge ist unten – du hast gewonnen!',
  'Ich kapituliere. Dein Wissen war stärker.',
] as const);

export type BossReactionKind = 'normal' | 'defeated';

export interface BossReactionSelection {
  bossIndex: number;
  kind: BossReactionKind;
  text: string;
}

export interface BossReactionSelectorOptions {
  random?: () => number;
}

export class BossReactionSelector {
  readonly #random: () => number;
  readonly #lastByBoss = new Map<string, string>();

  constructor(options: BossReactionSelectorOptions = {}) {
    this.#random = options.random ?? Math.random;
  }

  select(bossIndex: number, kind: BossReactionKind): BossReactionSelection {
    const pool = kind === 'defeated' ? DEFEATED_BOSS_REACTIONS : NORMAL_BOSS_REACTIONS;
    const key = `${bossIndex}:${kind}`;
    const previous = this.#lastByBoss.get(key);
    const choices = pool.filter((entry) => entry !== previous);
    const source = choices.length > 0 ? choices : pool;
    const normalizedRandom = Math.min(.999999, Math.max(0, this.#random()));
    const text = source[Math.floor(normalizedRandom * source.length)] ?? source[0];
    this.#lastByBoss.set(key, text);
    return { bossIndex, kind, text };
  }

  reset(): void {
    this.#lastByBoss.clear();
  }
}
