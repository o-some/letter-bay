export type AttackChoiceId = 'safe' | 'bold' | 'precision';
export type BossIntentId = 'pressure' | 'opening' | 'steady';

export interface ArenaTurnRequest {
  bossIndex: number;
  bossName: string;
  bossHp: number;
}

export interface ArenaMistakeRequest {
  kind: 'letter' | 'word';
}

export interface ArenaSolvedRequest {
  defeated: boolean;
}

export interface ArenaMomentumOptions {
  enabled: boolean;
}

export interface AttackChoice {
  id: AttackChoiceId;
  title: string;
  subtitle: string;
  solveMomentum: number;
  mistakeMomentum: number;
  firstMistakeShield?: boolean;
}

export interface BossIntent {
  id: BossIntentId;
  title: string;
  description: string;
  icon: string;
  solveBonus: number;
  mistakePenalty: number;
}

export const ATTACK_CHOICES: readonly AttackChoice[] = Object.freeze([
  {
    id: 'safe',
    title: 'Sicherer Angriff',
    subtitle: 'Stabil: +1 / −1 Momentum',
    solveMomentum: 1,
    mistakeMomentum: -1,
  },
  {
    id: 'bold',
    title: 'Mutiger Angriff',
    subtitle: 'Mehr Raum: +2 / −2 Momentum',
    solveMomentum: 2,
    mistakeMomentum: -2,
  },
  {
    id: 'precision',
    title: 'Präzisionsangriff',
    subtitle: 'Der erste Fehler kostet kein Momentum',
    solveMomentum: 1,
    mistakeMomentum: -1,
    firstMistakeShield: true,
  },
]);

export const BOSS_INTENTS: readonly BossIntent[] = Object.freeze([
  {
    id: 'pressure',
    title: 'Druckangriff',
    description: 'Fehler drücken Tula stärker zurück.',
    icon: '⚓',
    solveBonus: 0,
    mistakePenalty: 1,
  },
  {
    id: 'opening',
    title: 'Offene Deckung',
    description: 'Ein gelöstes Wort bringt extra Momentum.',
    icon: '🎯',
    solveBonus: 1,
    mistakePenalty: 0,
  },
  {
    id: 'steady',
    title: 'Wachsame Deckung',
    description: 'Normaler Schlagabtausch ohne Zusatzregel.',
    icon: '🛡️',
    solveBonus: 0,
    mistakePenalty: 0,
  },
]);

export function clampMomentum(value: number): number {
  return Math.max(-3, Math.min(3, value));
}

export function momentumDeltaForSolve(attack: AttackChoice, intent: BossIntent): number {
  return attack.solveMomentum + intent.solveBonus;
}

export function momentumDeltaForMistake(
  attack: AttackChoice,
  intent: BossIntent,
  precisionShieldAvailable: boolean,
): { delta: number; precisionShieldAvailable: boolean } {
  if (attack.firstMistakeShield && precisionShieldAvailable) {
    return { delta: 0, precisionShieldAvailable: false };
  }
  return {
    delta: attack.mistakeMomentum - intent.mistakePenalty,
    precisionShieldAvailable,
  };
}

function byId<T extends { id: string }>(items: readonly T[], id: string): T {
  return items.find((item) => item.id === id) ?? items[0];
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function controls(): Array<HTMLInputElement | HTMLButtonElement> {
  return Array.from(document.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
    '#answer, #answerForm button, #hint, #joker, #keyboard .key',
  ));
}

function setControlsLocked(locked: boolean): void {
  for (const control of controls()) control.disabled = locked;
}

function ensureArenaChrome(arena: HTMLElement): {
  hud: HTMLElement;
  marker: HTMLElement;
  intent: HTMLElement;
  choice: HTMLElement;
  chain: HTMLElement;
} {
  let hud = arena.querySelector<HTMLElement>('.lb-momentum-hud');
  if (!hud) {
    hud = createElement('div', 'lb-momentum-hud');
    hud.setAttribute('aria-label', 'Momentum im Bosskampf');
    hud.innerHTML = '<span>TULA</span><div class="lb-momentum-track"><i class="lb-momentum-marker"></i></div><span>BOSS</span>';
    arena.append(hud);
  }

  let marker = hud.querySelector<HTMLElement>('.lb-momentum-marker');
  if (!marker) {
    marker = createElement('i', 'lb-momentum-marker');
    hud.append(marker);
  }

  let intent = arena.querySelector<HTMLElement>('.lb-boss-intent');
  if (!intent) {
    intent = createElement('div', 'lb-boss-intent');
    intent.hidden = true;
    arena.append(intent);
  }

  let choice = arena.querySelector<HTMLElement>('.lb-attack-choice');
  if (!choice) {
    choice = createElement('div', 'lb-attack-choice');
    choice.hidden = true;
    choice.setAttribute('role', 'dialog');
    choice.setAttribute('aria-label', 'Wähle deinen Angriff');
    arena.append(choice);
  }

  let chain = arena.querySelector<HTMLElement>('.lb-arena-chain');
  if (!chain) {
    chain = createElement('div', 'lb-arena-chain');
    chain.setAttribute('aria-hidden', 'true');
    chain.innerHTML = [
      '<span class="lb-chain-rope" title="Seil"></span>',
      '<span class="lb-chain-barrel" title="Fass"></span>',
      '<span class="lb-chain-cannon" title="Kanone"></span>',
      '<span class="lb-chain-flag" title="Flagge"></span>',
    ].join('');
    arena.append(chain);
  }

  return { hud, marker, intent, choice, chain };
}

function renderMomentum(arena: HTMLElement, marker: HTMLElement, momentum: number): void {
  const clamped = clampMomentum(momentum);
  arena.dataset.lbMomentum = String(clamped);
  marker.style.left = `${50 + clamped * 14}%`;

  const tulaAdvance = clamped > 0 ? clamped * 3.7 : clamped * 0.7;
  const bossAdvance = clamped < 0 ? Math.abs(clamped) * 3.7 : -clamped * 0.7;
  arena.style.setProperty('--lb-tula-territory', `${tulaAdvance.toFixed(1)}%`);
  arena.style.setProperty('--lb-boss-territory', `${bossAdvance.toFixed(1)}%`);

  const chainStage = Math.max(0, clamped);
  arena.dataset.lbChainStage = String(chainStage);
}

function renderIntent(element: HTMLElement, bossName: string, intent: BossIntent): void {
  element.hidden = false;
  element.innerHTML = `<strong>${intent.icon} ${bossName}: ${intent.title}</strong><span>${intent.description}</span>`;
}

function showMomentumPulse(arena: HTMLElement, text: string, positive: boolean): void {
  const pulse = createElement('div', `lb-momentum-pulse ${positive ? 'positive' : 'negative'}`, text);
  arena.append(pulse);
  const animation = pulse.animate([
    { opacity: 0, transform: 'translate(-50%,8px) scale(.94)' },
    { opacity: 1, transform: 'translate(-50%,0) scale(1)', offset: .28 },
    { opacity: 0, transform: 'translate(-50%,-10px) scale(.98)' },
  ], { duration: 850, easing: 'cubic-bezier(.2,.8,.2,1)' });
  void animation.finished.finally(() => pulse.remove());
}

export function installArenaMomentumRuntime(options: ArenaMomentumOptions): void {
  let momentum = 0;
  let currentBossIndex = -1;
  let turnCounter = 0;
  let currentAttack: AttackChoice = ATTACK_CHOICES[0];
  let currentIntent: BossIntent = BOSS_INTENTS[2];
  let precisionShieldAvailable = false;

  const prepare = () => {
    if (!options.enabled) return;
    const arena = document.getElementById('arena');
    if (!(arena instanceof HTMLElement)) return;
    const { marker } = ensureArenaChrome(arena);
    renderMomentum(arena, marker, momentum);
  };

  window.__lbArenaPrepare = prepare;

  if (!options.enabled) {
    delete window.__lbArenaTurn;
    delete window.__lbArenaMistake;
    delete window.__lbArenaSolved;
    delete window.__lbArenaReset;
    return;
  }

  window.__lbArenaReset = () => {
    momentum = 0;
    currentBossIndex = -1;
    turnCounter = 0;
    currentAttack = ATTACK_CHOICES[0];
    currentIntent = BOSS_INTENTS[2];
    precisionShieldAvailable = false;
    prepare();
  };

  window.__lbArenaTurn = (request: ArenaTurnRequest) => {
    const arena = document.getElementById('arena');
    if (!(arena instanceof HTMLElement)) return;
    const { marker, intent, choice } = ensureArenaChrome(arena);

    if (request.bossIndex !== currentBossIndex) {
      currentBossIndex = request.bossIndex;
      momentum = 0;
      turnCounter = 0;
    }

    currentIntent = BOSS_INTENTS[(request.bossIndex + turnCounter) % BOSS_INTENTS.length];
    turnCounter += 1;
    precisionShieldAvailable = false;
    renderMomentum(arena, marker, momentum);
    renderIntent(intent, request.bossName, currentIntent);

    choice.hidden = false;
    choice.innerHTML = '<small>DEIN ZUG</small><strong>Wähle deinen Angriff</strong><div class="lb-attack-buttons"></div>';
    const buttons = choice.querySelector<HTMLElement>('.lb-attack-buttons');
    if (!buttons) return;

    setControlsLocked(true);
    for (const attack of ATTACK_CHOICES) {
      const button = createElement('button', `lb-attack-button attack-${attack.id}`);
      button.type = 'button';
      button.innerHTML = `<b>${attack.title}</b><span>${attack.subtitle}</span>`;
      button.addEventListener('click', () => {
        currentAttack = attack;
        precisionShieldAvailable = attack.firstMistakeShield === true;
        choice.hidden = true;
        arena.dataset.lbAttack = attack.id;
        setControlsLocked(false);
        const answer = document.getElementById('answer');
        if (answer instanceof HTMLInputElement) answer.focus({ preventScroll: true });
      }, { once: true });
      buttons.append(button);
    }
  };

  window.__lbArenaMistake = (_request: ArenaMistakeRequest) => {
    const arena = document.getElementById('arena');
    if (!(arena instanceof HTMLElement)) return;
    const { marker } = ensureArenaChrome(arena);
    const result = momentumDeltaForMistake(currentAttack, currentIntent, precisionShieldAvailable);
    precisionShieldAvailable = result.precisionShieldAvailable;
    if (result.delta === 0) {
      showMomentumPulse(arena, 'Präzision schützt dein Momentum', true);
      return;
    }
    momentum = clampMomentum(momentum + result.delta);
    renderMomentum(arena, marker, momentum);
    showMomentumPulse(arena, `Momentum ${result.delta}`, false);
  };

  window.__lbArenaSolved = (request: ArenaSolvedRequest) => {
    const arena = document.getElementById('arena');
    if (!(arena instanceof HTMLElement)) return;
    const { marker } = ensureArenaChrome(arena);
    const delta = request.defeated ? 3 : momentumDeltaForSolve(currentAttack, currentIntent);
    momentum = request.defeated ? 3 : clampMomentum(momentum + delta);
    renderMomentum(arena, marker, momentum);
    showMomentumPulse(arena, request.defeated ? 'Arena gewonnen!' : `Momentum +${delta}`, true);
  };
}

declare global {
  interface Window {
    __lbArenaPrepare?: () => void;
    __lbArenaTurn?: (request: ArenaTurnRequest) => void;
    __lbArenaMistake?: (request: ArenaMistakeRequest) => void;
    __lbArenaSolved?: (request: ArenaSolvedRequest) => void;
    __lbArenaReset?: () => void;
  }
}
