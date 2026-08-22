import { AnimationController } from './animationController';
import { playBossWordReaction, type BossReactionSequenceResult } from './bossReactionSequence';
import { BossReactionSelector, TulaReactionSelector } from '../data/bossReactions';

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
    __lbSetBossImage?: (element: Element | null, index: number) => void;
    __lbSyncBossImages?: (index?: number) => void;
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
  image.onload = () => image?.classList.remove('lb-boss-image-fallback');
  image.onerror = () => {
    image?.classList.add('lb-boss-image-fallback');
    if (image) image.alt = `${BOSS_NAMES[safeIndex]} – Grafik konnte nicht geladen werden`;
  };
  image.alt = BOSS_NAMES[safeIndex] ?? `Boss ${safeIndex + 1}`;
  image.dataset.bossIndex = String(safeIndex + 1);
  if (image.getAttribute('src') !== src) image.src = src;
}

function syncBossImages(baseUrl: string, forcedIndex?: number): void {
  const index = forcedIndex === undefined
    ? currentBossIndex()
    : Math.max(0, Math.min(BOSS_FILES.length - 1, forcedIndex));
  setBossImage(document.getElementById('bossArt'), index, baseUrl);
  setBossImage(document.getElementById('introArt'), index, baseUrl);
  document.querySelectorAll('#route .boss-card .mini').forEach((element, routeIndex) => {
    setBossImage(element, routeIndex, baseUrl);
  });
}

function buildSpeechBubble(className: string): HTMLElement {
  const bubble = document.createElement('div');
  bubble.className = `lb-reaction-bubble ${className}`;

  const name = document.createElement('small');
  name.className = 'lb-boss-reaction-name';
  const quote = document.createElement('strong');
  quote.className = 'lb-boss-reaction-quote';
  bubble.append(name, quote);
  return bubble;
}

function ensureDuoDialogue(arena: HTMLElement): HTMLElement {
  let dialogue = arena.querySelector<HTMLElement>('.lb-duo-reaction');
  if (dialogue) return dialogue;

  dialogue = document.createElement('div');
  dialogue.className = 'lb-duo-reaction';
  dialogue.hidden = true;
  dialogue.tabIndex = 0;
  dialogue.setAttribute('role', 'status');
  dialogue.setAttribute('aria-live', 'polite');
  dialogue.setAttribute('aria-label', 'Tula und der Pirat reagieren auf das gelöste Wort');

  dialogue.append(
    buildSpeechBubble('lb-tula-reaction-dialogue'),
    buildSpeechBubble('lb-boss-reaction-dialogue'),
  );

  const hint = document.createElement('span');
  hint.className = 'lb-boss-reaction-skip';
  hint.textContent = 'Tippen zum Überspringen';
  dialogue.append(hint);
  arena.append(dialogue);
  return dialogue;
}

function setSpeechBubble(
  bubble: Element | null,
  speakerName: string,
  text: string,
  enabled: boolean,
  fallback: string,
): void {
  if (!(bubble instanceof HTMLElement)) return;
  const name = bubble.querySelector<HTMLElement>('.lb-boss-reaction-name');
  const quote = bubble.querySelector<HTMLElement>('.lb-boss-reaction-quote');
  if (name) name.textContent = speakerName.toLocaleUpperCase('de-DE');
  if (quote) quote.textContent = enabled ? `„${text}“` : fallback;
}

function setDuoDialogue(
  dialogue: HTMLElement,
  bossName: string,
  bossText: string,
  tulaText: string,
  enabled: boolean,
): void {
  setSpeechBubble(
    dialogue.querySelector('.lb-tula-reaction-dialogue'),
    'Tula',
    tulaText,
    enabled,
    'Super gemacht!',
  );
  setSpeechBubble(
    dialogue.querySelector('.lb-boss-reaction-dialogue'),
    bossName,
    bossText,
    enabled,
    'Autsch – guter Treffer!',
  );
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

type ReactionControl = HTMLInputElement | HTMLButtonElement;
const reactionControlState = new Map<ReactionControl, boolean>();

function lockReactionInputs(locked: boolean): void {
  const selectors = ['#answer', '#answerForm button', '#hint', '#joker'];

  if (locked) {
    document.body.dataset.lbGamePhase = 'BOSS_REACTION';
    reactionControlState.clear();
    for (const selector of selectors) {
      const control = document.querySelector<ReactionControl>(selector);
      if (!control) continue;
      reactionControlState.set(control, control.disabled);
      control.disabled = true;
    }
    return;
  }

  for (const [control, wasDisabled] of reactionControlState) {
    if (control.isConnected) control.disabled = wasDisabled;
  }
  reactionControlState.clear();
  delete document.body.dataset.lbGamePhase;
}

export function installBossReactionRuntime(options: BossReactionBrowserOptions): void {
  const baseUrl = normalizeBase(options.baseUrl);
  const bossSelector = new BossReactionSelector();
  const tulaSelector = new TulaReactionSelector();
  const controller = new AnimationController();
  let observer: MutationObserver | undefined;
  let reactionRunning = false;

  // The legacy game calls sprite(el, bossIndex) on every HUD/route update.
  // Expose an explicit image hook so every boss transition can synchronously
  // select the correct standalone PNG instead of relying on MutationObserver timing.
  window.__lbSetBossImage = (element, index) => setBossImage(element, index, baseUrl);
  window.__lbSyncBossImages = (index) => syncBossImages(baseUrl, index);

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
    const tula = document.querySelector('.arena .tula');
    if (!(arena instanceof HTMLElement) || !(boss instanceof HTMLElement) || !(tula instanceof HTMLElement)) {
      reactionRunning = false;
      return { status: 'fallback', animationResults: [], elapsedMs: 0 };
    }

    syncBossImages(baseUrl, request.bossIndex);
    const dialogue = ensureDuoDialogue(arena);
    const bossReaction = bossSelector.select(request.bossIndex, request.defeated ? 'defeated' : 'normal');
    const tulaReaction = tulaSelector.select();
    setDuoDialogue(
      dialogue,
      request.bossName,
      bossReaction.text,
      tulaReaction,
      options.dialogueEnabled,
    );
    arena.dataset.reactionActive = 'true';
    lockReactionInputs(true);
    createImpactParticles(arena, boss);

    try {
      return await playBossWordReaction({
        boss,
        tula,
        arena,
        dialogue,
        defeated: request.defeated,
      }, { controller });
    } finally {
      lockReactionInputs(false);
      delete arena.dataset.reactionActive;
      dialogue.hidden = true;
      reactionRunning = false;
    }
  };
}
