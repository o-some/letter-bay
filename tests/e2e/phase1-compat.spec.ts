import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

function legacyClueMap(): Map<string, string> {
  const html = readFileSync('public/legacy/source.html', 'utf8');
  const match = html.match(/,W=(\[\[.*\]\]);const \$=s=>/s);
  if (!match) throw new Error('Could not extract legacy word table');
  const words = Function(`"use strict"; return ${match[1]};`)() as Array<[string, string, string]>;
  return new Map(words.map(([word, , clue]) => [clue, word]));
}

async function expectBossImages(page: Page) {
  await expect(page.locator('#introArt .letter-bay-boss-image')).toHaveCount(1);
  await expect(page.locator('#route .letter-bay-boss-image')).toHaveCount(10);
  const loaded = await page.locator('.letter-bay-boss-image').evaluateAll((images) =>
    images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0),
  );
  expect(loaded).toBe(true);
}

test('legacy is the safe default and all boss assets render', async ({ page }) => {
  await page.goto('/letter-bay/?engine=legacy');
  await expect(page).toHaveURL(/\/letter-bay\/legacy\/index\.html\?engine=legacy/);
  await expect(page.locator('#intro')).toHaveClass(/show/);
  await expect(page.locator('#introName')).toHaveText('Pirat Kai');
  await expectBossImages(page);
});

test('V2 entry preserves legacy parity during phase 1', async ({ page }) => {
  await page.goto('/letter-bay/?engine=v2');
  await expect(page).toHaveURL(/\/letter-bay\/legacy\/index\.html\?engine=v2-compat/);
  await expect(page.locator('#introName')).toHaveText('Pirat Kai');
  await expectBossImages(page);
});

test('Boss 1 transitions to Boss 2 and remains playable', async ({ page }) => {
  const clues = legacyClueMap();
  await page.goto('/letter-bay/?engine=v2');
  await page.locator('#start').click();
  await expect(page.locator('#intro')).not.toHaveClass(/show/);

  for (let round = 0; round < 3; round += 1) {
    await page.locator('#hint').click();
    await expect(page.locator('#msg')).toContainText('Hinweis:');
    const message = (await page.locator('#msg').textContent()) ?? '';
    const clue = message.replace(/^Hinweis:\s*/, '');
    const answer = clues.get(clue);
    if (!answer) throw new Error(`Unknown clue: ${clue}`);
    await page.locator('#answer').fill(answer);
    await page.locator('#answerForm button[type="submit"]').click();
    if (round < 2) await expect(page.locator('#answer')).toBeEnabled({ timeout: 5_000 });
  }

  await expect(page.locator('#intro')).toHaveClass(/show/, { timeout: 6_000 });
  await expect(page.locator('#introName')).toHaveText('Kapitän Brax');
  expect(await page.locator('#introArt .letter-bay-boss-image').evaluate((image) =>
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
  )).toBe(true);

  await page.locator('#start').click();
  await expect(page.locator('#intro')).not.toHaveClass(/show/);
  await expect(page.locator('#bossLevel')).toContainText('LEVEL 2');
  await expect(page.locator('#keyboard .key')).toHaveCount(29);
  expect(await page.locator('#bossArt .letter-bay-boss-image').evaluate((image) =>
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
  )).toBe(true);

  const scrollState = await page.evaluate(() => ({
    y: window.scrollY,
    max: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
    bodyHeight: document.body.scrollHeight,
  }));
  expect(scrollState.y).toBeLessThanOrEqual(scrollState.max + 1);
  expect(scrollState.bodyHeight).toBeLessThan(3000);
});
