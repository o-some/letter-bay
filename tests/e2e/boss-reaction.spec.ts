import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const reactionData = JSON.parse(readFileSync('public/data/boss-reactions.json', 'utf8')) as {
  normal: string[];
  defeated: string[];
  tula: string[];
};

type Rect = { x: number; y: number; width: number; height: number };

function legacyClueMap(): Map<string, string> {
  const html = readFileSync('public/legacy/source.html', 'utf8');
  const match = html.match(/,W=(\[\[.*\]\]);const \$=s=>/s);
  if (!match) throw new Error('Could not extract legacy word table');
  const words = Function(`"use strict"; return ${match[1]};`)() as Array<[string, string, string]>;
  return new Map(words.map(([word, , clue]) => [clue, word]));
}

async function solveWithHint(page: import('@playwright/test').Page, clues: Map<string, string>) {
  await page.locator('#hint').click();
  await expect(page.locator('#msg')).toContainText('Hinweis:');
  const message = (await page.locator('#msg').textContent()) ?? '';
  const clue = message.replace(/^Hinweis:\s*/, '');
  const answer = clues.get(clue);
  if (!answer) throw new Error(`Unknown clue: ${clue}`);
  await page.locator('#answer').fill(answer);
  await page.locator('#answerForm button[type="submit"]').click();
}

async function expectBossLoaded(page: import('@playwright/test').Page) {
  await expect.poll(() => page.locator('#bossArt .letter-bay-boss-image').evaluate((image) =>
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
  )).toBe(true);
}

function isInside(inner: Rect, outer: Rect, tolerance = 2): boolean {
  return inner.x >= outer.x - tolerance
    && inner.y >= outer.y - tolerance
    && inner.x + inner.width <= outer.x + outer.width + tolerance
    && inner.y + inner.height <= outer.y + outer.height + tolerance;
}

function isHorizontallyInside(inner: Rect, outer: Rect, tolerance = 6): boolean {
  return inner.x >= outer.x - tolerance
    && inner.x + inner.width <= outer.x + outer.width + tolerance;
}

function centerInside(inner: Rect, outer: Rect): boolean {
  const x = inner.x + inner.width / 2;
  const y = inner.y + inner.height / 2;
  return x >= outer.x
    && x <= outer.x + outer.width
    && y >= outer.y
    && y <= outer.y + outer.height;
}

function overlaps(a: Rect, b: Rect, tolerance = 0): boolean {
  return !(
    a.x + a.width <= b.x + tolerance
    || b.x + b.width <= a.x + tolerance
    || a.y + a.height <= b.y + tolerance
    || b.y + b.height <= a.y + tolerance
  );
}

function containsCenter(container: Rect, target: Rect): boolean {
  const x = target.x + target.width / 2;
  const y = target.y + target.height / 2;
  return x >= container.x
    && x <= container.x + container.width
    && y >= container.y
    && y <= container.y + container.height;
}

async function expectReadableArenaDuringDialogue(page: import('@playwright/test').Page) {
  const arena = await page.locator('#arena').boundingBox();
  const tula = await page.locator('.arena .tula').boundingBox();
  const boss = await page.locator('#bossArt').boundingBox();
  const vs = await page.locator('.arena .vs').boundingBox();
  const tulaBubble = await page.locator('.lb-tula-reaction-dialogue').boundingBox();
  const bossBubble = await page.locator('.lb-boss-reaction-dialogue').boundingBox();

  expect(arena).not.toBeNull();
  expect(tula).not.toBeNull();
  expect(boss).not.toBeNull();
  expect(vs).not.toBeNull();
  expect(tulaBubble).not.toBeNull();
  expect(bossBubble).not.toBeNull();
  if (!arena || !tula || !boss || !vs || !tulaBubble || !bossBubble) return;

  // Fighters use scale/attack transforms during this moment. Validate the visual
  // contract that matters: no lateral clipping, centers stay in the arena and
  // both fighters remain on their own side of the VS marker.
  expect(isHorizontallyInside(tula, arena)).toBe(true);
  expect(isHorizontallyInside(boss, arena)).toBe(true);
  expect(centerInside(tula, arena)).toBe(true);
  expect(centerInside(boss, arena)).toBe(true);

  // Static UI and bubbles must remain fully contained.
  expect(isInside(vs, arena)).toBe(true);
  expect(isInside(tulaBubble, arena)).toBe(true);
  expect(isInside(bossBubble, arena)).toBe(true);
  expect(overlaps(tulaBubble, bossBubble, 2)).toBe(false);
  expect(overlaps(tulaBubble, vs, 1)).toBe(false);
  expect(overlaps(bossBubble, vs, 1)).toBe(false);
  expect(containsCenter(tulaBubble, tula)).toBe(false);
  expect(containsCenter(bossBubble, boss)).toBe(false);
  expect(tula.x + tula.width / 2).toBeLessThan(vs.x + vs.width / 2);
  expect(boss.x + boss.width / 2).toBeGreaterThan(vs.x + vs.width / 2);
}

async function expectBaselineFightersInsideArena(page: import('@playwright/test').Page) {
  const arena = await page.locator('#arena').boundingBox();
  const tula = await page.locator('.arena .tula').boundingBox();
  const boss = await page.locator('#bossArt').boundingBox();
  expect(arena).not.toBeNull();
  expect(tula).not.toBeNull();
  expect(boss).not.toBeNull();
  if (!arena || !tula || !boss) return;
  expect(isHorizontallyInside(tula, arena, 2)).toBe(true);
  expect(isHorizontallyInside(boss, arena, 2)).toBe(true);
  expect(centerInside(tula, arena)).toBe(true);
  expect(centerInside(boss, arena)).toBe(true);
}

test('solved word moves Tula toward VS, boss takes the hit, both speak, then Tula returns', async ({ page }) => {
  const clues = legacyClueMap();
  await page.goto('/letter-bay/?engine=v2');
  await expect(page.locator('#introName')).toHaveText('Pirat Kai');
  await page.locator('#start').click();
  await expectBossLoaded(page);
  await expectBaselineFightersInsideArena(page);

  const beforeTula = await page.locator('.arena .tula').boundingBox();
  const beforeBoss = await page.locator('#bossArt').boundingBox();
  const beforeViewport = await page.evaluate(() => ({
    y: window.scrollY,
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));
  expect(beforeTula).not.toBeNull();
  expect(beforeBoss).not.toBeNull();

  await solveWithHint(page, clues);

  const dialogue = page.locator('.lb-duo-reaction');
  const tulaBubble = page.locator('.lb-tula-reaction-dialogue');
  const bossBubble = page.locator('.lb-boss-reaction-dialogue');
  await expect(dialogue).toBeVisible({ timeout: 4_000 });
  await expect(tulaBubble).toBeVisible();
  await expect(bossBubble).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-lb-game-phase', 'BOSS_REACTION');

  const tulaQuote = (await tulaBubble.locator('.lb-boss-reaction-quote').textContent())?.replace(/[„“]/g, '') ?? '';
  const bossQuote = (await bossBubble.locator('.lb-boss-reaction-quote').textContent())?.replace(/[„“]/g, '') ?? '';
  expect(reactionData.tula).toContain(tulaQuote);
  expect(reactionData.normal).toContain(bossQuote);
  await expect(page.locator('#answer')).toBeDisabled();
  await expect(page.locator('#hint')).toBeDisabled();

  const duringTula = await page.locator('.arena .tula').boundingBox();
  const duringBoss = await page.locator('#bossArt').boundingBox();
  expect(duringTula).not.toBeNull();
  expect(duringBoss).not.toBeNull();
  if (beforeTula && duringTula) {
    expect(duringTula.x - beforeTula.x).toBeGreaterThan(20);
  }
  if (beforeBoss && duringBoss) {
    expect(Math.abs(duringBoss.x - beforeBoss.x)).toBeLessThan(12);
  }

  await expectReadableArenaDuringDialogue(page);

  const duringViewport = await page.evaluate(() => ({
    y: window.scrollY,
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));
  expect(duringViewport.y).toBe(beforeViewport.y);
  expect(duringViewport.height).toBeLessThanOrEqual(beforeViewport.height + 2);

  await expect(dialogue).toBeHidden({ timeout: 7_000 });
  await expect(page.locator('#answer')).toBeEnabled({ timeout: 7_000 });
  await expect(page.locator('#answerForm button[type="submit"]')).toBeEnabled({ timeout: 7_000 });
  await expect(page.locator('body')).not.toHaveAttribute('data-lb-game-phase', 'BOSS_REACTION');
  await expectBossLoaded(page);

  const afterTula = await page.locator('.arena .tula').boundingBox();
  const afterBoss = await page.locator('#bossArt').boundingBox();
  if (beforeTula && afterTula) expect(Math.abs(afterTula.x - beforeTula.x)).toBeLessThan(6);
  if (beforeBoss && afterBoss) expect(Math.abs(afterBoss.x - beforeBoss.x)).toBeLessThan(6);

  const afterViewport = await page.evaluate(() => ({
    y: window.scrollY,
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));
  expect(afterViewport.y).toBe(beforeViewport.y);
  expect(afterViewport.height).toBeLessThanOrEqual(beforeViewport.height + 2);
});

test('arena character layout remains readable during dual dialogue', async ({ page }) => {
  const clues = legacyClueMap();
  await page.goto('/letter-bay/?engine=v2');
  await page.locator('#start').click();
  await expectBossLoaded(page);
  await expectBaselineFightersInsideArena(page);

  const baseline = await page.evaluate(() => ({
    y: window.scrollY,
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));

  await solveWithHint(page, clues);
  await expect(page.locator('.lb-duo-reaction')).toBeVisible({ timeout: 4_000 });
  await expectReadableArenaDuringDialogue(page);

  const during = await page.evaluate(() => ({
    y: window.scrollY,
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));
  expect(during.y).toBe(baseline.y);
  expect(during.height).toBeLessThanOrEqual(baseline.height + 2);
});

test('additional required 375x667 and 768x1024 viewports preserve arena geometry', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Extra viewport sweep runs once in Chromium.');
  const clues = legacyClueMap();

  for (const viewport of [{ width: 375, height: 667 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/letter-bay/?engine=v2');
    await page.locator('#start').click();
    await expectBossLoaded(page);
    await expectBaselineFightersInsideArena(page);
    await solveWithHint(page, clues);
    await expect(page.locator('.lb-duo-reaction')).toBeVisible({ timeout: 4_000 });
    await expectReadableArenaDuringDialogue(page);

    const metrics = await page.evaluate(() => ({
      y: window.scrollY,
      max: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
    }));
    expect(metrics.y).toBeLessThanOrEqual(metrics.max + 1);
  }
});

test('third solved word uses a defeat line and reaches Boss 2 without a hanging transition', async ({ page }) => {
  const clues = legacyClueMap();
  await page.goto('/letter-bay/?engine=v2');
  await page.locator('#start').click();

  for (let round = 0; round < 3; round += 1) {
    await solveWithHint(page, clues);
    const dialogue = page.locator('.lb-duo-reaction');
    const bossBubble = page.locator('.lb-boss-reaction-dialogue');
    const tulaBubble = page.locator('.lb-tula-reaction-dialogue');
    await expect(dialogue).toBeVisible({ timeout: 4_000 });
    await expect(tulaBubble).toBeVisible();
    await expect(bossBubble).toBeVisible();
    const bossQuote = (await bossBubble.locator('.lb-boss-reaction-quote').textContent())?.replace(/[„“]/g, '') ?? '';
    const tulaQuote = (await tulaBubble.locator('.lb-boss-reaction-quote').textContent())?.replace(/[„“]/g, '') ?? '';
    expect(reactionData.tula).toContain(tulaQuote);
    if (round === 2) expect(reactionData.defeated).toContain(bossQuote);
    if (round < 2) {
      await expect(page.locator('#answer')).toBeEnabled({ timeout: 7_000 });
      await expect(page.locator('#answerForm button[type="submit"]')).toBeEnabled({ timeout: 7_000 });
    }
  }

  await expect(page.locator('#intro')).toHaveClass(/show/, { timeout: 10_000 });
  await expect(page.locator('#introName')).toHaveText('Kapitän Brax');
  await expect.poll(() => page.locator('#introArt .letter-bay-boss-image').evaluate((image) =>
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
  )).toBe(true);

  await page.locator('#start').click();
  await expect(page.locator('#intro')).not.toHaveClass(/show/);
  await expect(page.locator('#bossLevel')).toContainText('LEVEL 2');
  await expect(page.locator('#keyboard .key')).toHaveCount(29);
  await expectBossLoaded(page);

  const metrics = await page.evaluate(() => ({
    y: window.scrollY,
    max: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
  }));
  expect(metrics.y).toBeLessThanOrEqual(metrics.max + 1);
});
