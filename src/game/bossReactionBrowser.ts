import { AnimationController } from './animationController';
import { playBossWordReaction, type BossReactionSequenceResult } from './bossReactionSequence';
import { BossReactionSelector } from '../data/bossReactions';

const BOSS_FILES = [
  'level-01-pirat-kai.png',
  'level-02-kapitaen-brax.png',
  'level-03-blackfinn.png',
  'level-04-alt-kapitaen-roderick.png',
  'level-05-piratenbaron-vargas.png',
  'level-06-kapitaen-ironhook.png',
  'level-07-admiral-thorne.png',
  'level-08-kartenmeister-corvin.png',
  'level-09-schattenfuerst-azrak.png',
  'level-10-piratenkoenig-varkos.png',
] as const;

const BOSS_NAMES = [
  'Pirat Kai',
  'Kapitän Brax',
  'Blackfinn',
  'Alt-Kapitän Roderick',
  'Piratenbaron Vargas',
  'Kapitän Ironhook',
  'Admiral Thorne',
  'Kartenmeister Corvin',
  'Schattenfürst Azrak',
  'Piratenkönig Varkos',
] as const;

export interface BossReactionRequest {
  defeated: boolean;
  bossIndex: number;
  bossName: string;
}

export interface BossReactionBrowserOptions {
  baseUrl: string;
  enabled: boolean;
  dialogueEnabled: boolean;
}

declare global {
  interface Window {
    __lbBossReaction?: (request: BossReactionRequest) => Promise<BossReactionSequenceResult>;
    __lbV2Ready?: () => void;
  }
}

function normalizeBase(baseUrl: string): string {
  const leading = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  return leading.endsWith('/') ? leading : `${leading}/`;
}

function bossUrl(baseUrl: string, index: number): string {
  const safeIndex = Math.max(0, Math.min(BOSS_FILES.length - 1, index));
  return `${normalizeBase(baseUrl)}assets/bosses/${BOSS_FILES[safeIndex]}`;
}

function currentBossIndex(): number {
  const levelText = document.getElementById('bossLevel')?.textContent ?? '';
  const match = levelText.match(/LEVEL\s+(\d+)/i);
  if (match) return Math.max(0, Math.min(9, Number(match[1]) - 1));
  const name = document.getElementById('bossName')?.textContent?.trim() ?? '';
  const found = BOSS_NAMES.indexOf(name as (typeof BOSS_NAMES)[number]);
  return found < 0 ? 0 : found;
}

function setBossImage(element: Element | null, index: number, baseUrl: string): void {
  if (!(element instanceof HTMLElement)) return;
  const safeIndex = Math.max(0, Math.min(BOSS_FILES.length - 1, index));
  let image = element.querySelector<HTMLImageElement>('.letter-bay-boss-image');
  if (!image) {
    image = document.createElement('img');
    image.className = 'letter-bay-boss-image';
    image.decoding = 'async';
    image.loading = element.classList.contains('mini') ? 'lazy' : 'eager';
    element.replaceChildren(image);
  }
  const src = bossUrl(baseUrl, safeIndex);
  if (image.getAttribute('src') !== src) image.src = src;
  image.alt = BOSS_NAMES[safeIndex] ?? `Boss ${safeIndex + 1}`;
  image.dataset.bossIndex = String(safeIndex + 1);
  image.onerror = () => {
    image?.classList.add('lb-boss-image-fallback');
    if (image) image.alt = `${BOSS_NAMES[safeIndex]} – Grafik konnte nicht geladen werden`;
  };
}

function syncBossImages(baseUrl: string): void {
  const index = currentBossIndex();
  setBossImage(document.getElementById('bossArt'), index, baseUrl);
  setBossImage(document.getElementById('introArt'), index, baseUrl);
  document.querySelectorAll('#route .boss-card .mini').forEach((element, routeIndex) => {
    setBossImage(element, routeIndex, baseUrl);
  });
}

function ensureDialogue(arena: HTMLElement): HTMLElement {
  let dialogue = arena.querySelector<HTMLElement>('.lb-boss-reaction-dialogue');
  if (dialogue) return dialogue;

  dialogue = document.createElement('div');
  dialogue.className = 'lb-boss-reaction-dialogue';
  dialogue.hidden = true;
  dialogue.tabIndex = 0;
  dialogue.setAttribute('role', 'status');
  dialogue.setAttribute('aria-live', 'polite');

  const name = document.createElement('small');
  name.className = 'lb-boss-reaction-name';
  const quote = document.createElement('strong');
  quote.className = 'lb-boss-reaction-quote';
  const hint = document.createElement('span');
  hint.className = 'lb-boss-reaction-skip';
  hint.textContent = 'Tippen zum Überspringen';
  dialogue.append(name, quote, hint);
  arena.append(dialogue);
  return dialogue;
}

function setDialogue(dialogue: HTMLElement, bossName: string, text: string, enabled: boolean): void {
  const name = dialogue.querySelector<HTMLElement>('.lb-boss-reaction-name');
  const quote = dialogue.querySelector<HTMLElement>('.lb-boss-reaction-quote');
  if (name) name.textContent = bossName.toLocaleUpperCase('de-DE');
  if (quote) quote.textContent = enabled ? `„${text}“` : 'Starker Treffer!';
}

function createImpactParticles(arena: HTMLElement, boss: HTMLElement): void {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const arenaRect = arena.getBoundingClientRect();
  const bossRect = boss.getBoundingClientRect();
  const originX = bossRect.left + bossRect.width / 2 - arenaRect.left;
  const originY = bossRect.top + bossRect.height * .35 - arenaRect.top;

  for (let index = 0; index < 8; index += 1) {
    const particle = document.createElement('span');
    particle.className = 'lb-boss-impact-particle';
    particle.textContent = index % 3 === 0 ? '✦' : '•';
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    arena.append(particle);
    const angle = (Math.PI * 2 * index) / 8;
    const distance = 24 + (index % 3) * 11;
    const animation = particle.animate([
      { transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .18 },
      {
        transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px),calc(-50% + ${Math.sin(angle) * distance}px)) scale(.35)`,
        opacity: 0,
      },
    ], { duration: 480 + index * 12, easing: 'cubic-bezier(.15,.75,.2,1)' });
    void animation.finished.finally(() => particle.remove());
  }
}

function lockReactionInputs(locked: boolean): void {
  document.body.dataset.lbGamePhase = locked ? 'BOSS_REACTION' : '';
  for (const selector of ['#answer', '#answerForm button', '#hint', '#joker']) {
    const control = document.querySelector<HTMLInputElement | HTMLButtonElement>(selector);
    if (control && locked) control.disabled = true;
  }
  if (!locked) delete document.body.dataset.lbGamePhase;
}

export function installBossReactionRuntime(options: BossReactionBrowserOptions): void {
  const baseUrl = normalizeBase(options.baseUrl);
  const selector = new BossReactionSelector();
  const controller = new AnimationController();
  let observer: MutationObserver | undefined;
  let reactionRunning = false;

  window.__lbV2Ready = () => {
    syncBossImages(baseUrl);
    observer?.disconnect();
    observer = new MutationObserver(() => requestAnimationFrame(() => syncBossImages(baseUrl)));
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  };

  if (!options.enabled) {
    delete window.__lbBossReaction;
    return;
  }

  window.__lbBossReaction = async (request) => {
    if (reactionRunning) {
      return { status: 'fallback', animationResults: [], elapsedMs: 0 };
    }
    reactionRunning = true;
    const arena = document.getElementById('arena');
    const boss = document.getElementById('bossArt');
    if (!(arena instanceof HTMLElement) || !(boss instanceof HTMLElement)) {
      reactionRunning = false;
      return { status: 'fallback', animationResults: [], elapsedMs: 0 };
    }

    syncBossImages(baseUrl);
    const dialogue = ensureDialogue(arena);
    const reaction = selector.select(request.bossIndex, request.defeated ? 'defeated' : 'normal');
    setDialogue(dialogue, request.bossName, reaction.text, options.dialogueEnabled);
    lockReactionInputs(true);
    createImpactParticles(arena, boss);

    try {
      return await playBossWordReaction({
        boss,
        arena,
        dialogue,
        defeated: request.defeated,
      }, { controller });
    } finally {
      lockReactionInputs(false);
      dialogue.hidden = true;
      reactionRunning = false;
    }
  };
}
