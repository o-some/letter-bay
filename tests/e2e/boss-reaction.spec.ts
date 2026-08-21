import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const reactionData = JSON.parse(readFileSync('public/data/boss-reactions.json', 'utf8')) as {
  normal: string[];
  defeated: string[];
  tula: string[];
};

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

test('solved word moves Tula toward VS, boss takes the hit, both speak, then Tula returns', async ({ page }) => {
  const clues = legacyClueMap();
  await page.goto('/letter-bay/?engine=v2');
  await expect(page.locator('#introName')).toHaveText('Pirat Kai');
  await page.locator('#start').click();
  await expectBossLoaded(page);

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
    expect(duringTula.width).toBeGreaterThanOrEqual(beforeTula.width);
  }
  if (beforeBoss && duringBoss) {
    expect(Math.abs(duringBoss.x - beforeBoss.x)).toBeLessThan(10);
  }

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
