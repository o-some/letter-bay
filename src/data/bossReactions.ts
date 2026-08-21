export const NORMAL_BOSS_REACTIONS = Object.freeze([
  'Autsch! Guter Treffer!',
  'Nicht schlecht – du wirst immer besser!',
  'Respekt! Das war ein richtig guter Treffer.',
  'Okay, okay – das war stark!',
  'Das war ein Volltreffer.',
  'Du hast mich erwischt!',
  'Da muss ich mich wohl mehr anstrengen.',
  'Das war clever gelöst.',
  'Starker Zug!',
  'Den Treffer habe ich gespürt.',
  'Diese Runde geht an dich!',
  'Arrr – das war beeindruckend gelöst!',
  'Du hast Köpfchen. Das muss ich dir lassen.',
  'So leicht wird das nicht …',
  'Hm. Gut gemacht.',
  'Das hat gesessen!',
  'Ich gebe mich noch nicht geschlagen!',
  'Du wirst wirklich besser.',
  'Das Wort war stark gewählt.',
  'Treffer. Respekt!',
  'Damit habe ich nicht gerechnet.',
  'Das war knapp – aber richtig stark.'
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
  'Ich kapituliere. Dein Wissen war stärker.'
] as const);

export const TULA_REACTIONS = Object.freeze([
  'Yeah! Super gemacht!',
  'Stark! Weiter so!',
  'Treffer! Das war klasse!',
  'Sehr gut gelöst!',
  'Wow, du bist richtig gut!',
  'Weiter so – wir schaffen das!',
  'Perfekt! Genau so!',
  'Mega! Das Wort saß!',
  'Richtig stark gelernt!',
  'Juhu! Nächster Treffer!',
  'Das war richtig clever!',
  'Yes! Gemeinsam sind wir stark!',
  'Toll gemacht! Bleib dran!',
  'Super! Der Boss wackelt schon!',
  'Genau richtig! Weiter geht’s!',
  'Starker Zug – ich bin bereit!',
  'Klasse! Noch so ein Wort!',
  'Das war ein Sprach-Volltreffer!'
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

function selectWithoutImmediateRepeat(
  pool: readonly string[],
  previous: string | undefined,
  random: () => number,
): string {
  const choices = pool.filter((entry) => entry !== previous);
  const source = choices.length > 0 ? choices : pool;
  const normalizedRandom = Math.min(.999999, Math.max(0, random()));
  return source[Math.floor(normalizedRandom * source.length)] ?? source[0] ?? '';
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
    const text = selectWithoutImmediateRepeat(pool, this.#lastByBoss.get(key), this.#random);
    this.#lastByBoss.set(key, text);
    return { bossIndex, kind, text };
  }

  reset(): void {
    this.#lastByBoss.clear();
  }
}

export class TulaReactionSelector {
  readonly #random: () => number;
  #last: string | undefined;

  constructor(options: BossReactionSelectorOptions = {}) {
    this.#random = options.random ?? Math.random;
  }

  select(): string {
    const text = selectWithoutImmediateRepeat(TULA_REACTIONS, this.#last, this.#random);
    this.#last = text;
    return text;
  }

  reset(): void {
    this.#last = undefined;
  }
}
