import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const reactionData = JSON.parse(readFileSync('public/data/boss-reactions.json', 'utf8')) as {
  normal: string[];
  defeated: string[];
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

test('solved word moves the boss center, speaks, returns and keeps the app viewport stable', async ({ page }) => {
  const clues = legacyClueMap();
  await page.goto('/letter-bay/v2/?bossReaction=1');
  await expect(page.locator('#introName')).toHaveText('Pirat Kai');
  await page.locator('#start').click();
  await expectBossLoaded(page);

  const before = await page.locator('#bossArt').boundingBox();
  const beforeViewport = await page.evaluate(() => ({
    y: window.scrollY,
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));
  expect(before).not.toBeNull();

  await solveWithHint(page, clues);

  const dialogue = page.locator('.lb-boss-reaction-dialogue');
  await expect(dialogue).toBeVisible({ timeout: 4_000 });
  await expect(page.locator('body')).toHaveAttribute('data-lb-game-phase', 'BOSS_REACTION');
  const quote = (await dialogue.locator('.lb-boss-reaction-quote').textContent())?.replace(/[„“]/g, '') ?? '';
  expect(reactionData.normal).toContain(quote);
  await expect(page.locator('#answer')).toBeDisabled();
  await expect(page.locator('#hint')).toBeDisabled();

  const during = await page.locator('#bossArt').boundingBox();
  expect(during).not.toBeNull();
  if (before && during) {
    expect(Math.abs(during.x - before.x)).toBeGreaterThan(10);
    expect(during.width).toBeGreaterThanOrEqual(before.width);
  }

  const duringViewport = await page.evaluate(() => ({
    y: window.scrollY,
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));
  expect(duringViewport.y).toBe(beforeViewport.y);
  expect(duringViewport.height).toBeLessThanOrEqual(beforeViewport.height + 2);

  await expect(dialogue).toBeHidden({ timeout: 6_000 });
  await expect(page.locator('#answer')).toBeEnabled({ timeout: 6_000 });
  await expect(page.locator('body')).not.toHaveAttribute('data-lb-game-phase', 'BOSS_REACTION');
  await expectBossLoaded(page);

  const after = await page.locator('#bossArt').boundingBox();
  if (before && after) {
    expect(Math.abs(after.x - before.x)).toBeLessThan(6);
  }

  const afterViewport = await page.evaluate(() => ({
    y: window.scrollY,
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));
  expect(afterViewport.y).toBe(beforeViewport.y);
  expect(afterViewport.height).toBeLessThanOrEqual(beforeViewport.height + 2);
});

test('third solved word uses a defeat line and reaches Boss 2 without a hanging transition', async ({ page }) => {
  const clues = legacyClueMap();
  await page.goto('/letter-bay/v2/?bossReaction=1');
  await page.locator('#start').click();

  for (let round = 0; round < 3; round += 1) {
    await solveWithHint(page, clues);
    const dialogue = page.locator('.lb-boss-reaction-dialogue');
    await expect(dialogue).toBeVisible({ timeout: 4_000 });
    const quote = (await dialogue.locator('.lb-boss-reaction-quote').textContent())?.replace(/[„“]/g, '') ?? '';
    if (round === 2) expect(reactionData.defeated).toContain(quote);
    if (round < 2) await expect(page.locator('#answer')).toBeEnabled({ timeout: 6_000 });
  }

  await expect(page.locator('#intro')).toHaveClass(/show/, { timeout: 8_000 });
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
