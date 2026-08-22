import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const bossFiles = [
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

function legacyClueMap(): Map<string, string> {
  const html = readFileSync('public/legacy/source.html', 'utf8');
  const match = html.match(/,W=(\[\[.*\]\]);const \$=s=>/s);
  if (!match) throw new Error('Could not extract legacy word table');
  const words = Function(`"use strict"; return ${match[1]};`)() as Array<[string, string, string]>;
  return new Map(words.map(([word, , clue]) => [clue, word]));
}

async function activateStart(page: Page, projectName: string) {
  const start = page.locator('#start');
  await expect(start).toBeVisible();
  await expect(start).toBeEnabled();
  if (projectName.startsWith('webkit')) await start.tap();
  else await start.click();
  await expect(page.locator('#intro')).not.toHaveClass(/show/);
}

async function expectLoadedImage(locator: Locator) {
  await expect(locator).toHaveCount(1);
  await expect(locator).toBeVisible();
  await expect.poll(
    () => locator.evaluate((image) => {
      if (!(image instanceof HTMLImageElement)) return false;
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return image.complete
        && image.naturalWidth > 0
        && image.naturalHeight > 0
        && rect.width > 4
        && rect.height > 4
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity || '1') > .2;
    }),
    { timeout: 10_000, intervals: [100, 250, 500] },
  ).toBe(true);
}

async function expectBossImages(page: Page) {
  await expect(page.locator('#introArt .letter-bay-boss-image')).toHaveCount(1);
  await expect(page.locator('#route .letter-bay-boss-image')).toHaveCount(10);
  await expect.poll(
    () => page.locator('.letter-bay-boss-image').evaluateAll((images) =>
      images.length >= 11 && images.every((image) =>
        image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
      ),
    ),
    { timeout: 10_000, intervals: [100, 250, 500] },
  ).toBe(true);
}

async function expectPortraitAppFitsViewport(page: Page) {
  const metrics = await page.evaluate(() => {
    const compact = window.matchMedia('(max-width:760px) and (min-height:620px) and (max-height:1000px)').matches;
    const root = document.documentElement;
    const body = document.body;
    const wrap = document.querySelector('.wrap');
    const route = document.querySelector('.route');
    return {
      compact,
      innerHeight: window.innerHeight,
      scrollHeight: Math.max(root.scrollHeight, body.scrollHeight),
      scrollY: window.scrollY,
      wrapBottom: wrap?.getBoundingClientRect().bottom ?? 0,
      routeBottom: route?.getBoundingClientRect().bottom ?? 0,
    };
  });

  if (!metrics.compact) return;

  expect(metrics.scrollY).toBeLessThanOrEqual(1);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.innerHeight + 2);
  expect(metrics.wrapBottom).toBeLessThanOrEqual(metrics.innerHeight + 2);
  expect(metrics.routeBottom).toBeLessThanOrEqual(metrics.innerHeight + 2);
}

test('public root opens the validated V2 engine by default', async ({ page }) => {
  await page.goto('/letter-bay/');
  await expect(page).toHaveURL(/\/letter-bay\/v2\/$/);
  await expect(page.locator('#intro')).toHaveClass(/show/);
  await expect(page.locator('#introName')).toHaveText('Pirat Kai');
  await expectBossImages(page);
});

test('explicit legacy fallback remains available and all boss assets render', async ({ page }) => {
  await page.goto('/letter-bay/?engine=legacy');
  await expect(page).toHaveURL(/\/letter-bay\/legacy\/index\.html\?engine=legacy/);
  await expect(page.locator('#intro')).toHaveClass(/show/);
  await expect(page.locator('#introName')).toHaveText('Pirat Kai');
  await expectBossImages(page);
});

test('V2 entry preserves legacy gameplay parity while adding the V2 shell', async ({ page }) => {
  await page.goto('/letter-bay/?engine=v2');
  await expect(page).toHaveURL(/\/letter-bay\/v2\/$/);
  await expect(page.locator('#introName')).toHaveText('Pirat Kai');
  await expectBossImages(page);
});

test('portrait mobile battle fits one app viewport without vertical scrolling', async ({ page }, testInfo) => {
  await page.goto('/letter-bay/');
  await activateStart(page, testInfo.project.name);
  await expect(page.locator('#keyboard .key')).toHaveCount(29);
  await expect(page.locator('.route')).toBeVisible();
  await expectPortraitAppFitsViewport(page);
});

test('whole-word input keeps an iOS-safe font size so focus does not auto-zoom', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('webkit'), 'iOS focus zoom guard is validated in WebKit mobile projects.');
  await page.goto('/letter-bay/');
  await activateStart(page, testInfo.project.name);
  const input = page.locator('#answer');
  await input.focus();
  const fontSize = await input.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(16);
});

test('all ten standalone boss PNGs can be synchronized into the arena', async ({ page }, testInfo) => {
  await page.goto('/letter-bay/?engine=v2');
  await activateStart(page, testInfo.project.name);

  for (let index = 0; index < bossFiles.length; index += 1) {
    await page.evaluate((bossIndex) => {
      const runtime = window as Window & {
        __lbSetBossImage?: (element: Element | null, index: number) => void;
      };
      runtime.__lbSetBossImage?.(document.getElementById('bossArt'), bossIndex);
    }, index);

    const image = page.locator('#bossArt .letter-bay-boss-image');
    await expect(image).toHaveAttribute('data-boss-index', String(index + 1));
    await expect(image).toHaveAttribute('src', new RegExp(`${bossFiles[index].replace('.', '\\.')}$`));
    await expectLoadedImage(image);
  }
});

test('Boss 1 transitions to Boss 2 and remains playable', async ({ page }, testInfo) => {
  const clues = legacyClueMap();
  await page.goto('/letter-bay/');
  await activateStart(page, testInfo.project.name);
  await expectPortraitAppFitsViewport(page);

  for (let round = 0; round < 3; round += 1) {
    await page.locator('#hint').click();
    await expect(page.locator('#msg')).toContainText('Hinweis:');
    const message = (await page.locator('#msg').textContent()) ?? '';
    const clue = message.replace(/^Hinweis:\s*/, '');
    const answer = clues.get(clue);
    if (!answer) throw new Error(`Unknown clue: ${clue}`);
    await page.locator('#answer').fill(answer);
    await page.locator('#answerForm button[type="submit"]').click();
    if (round < 2) await expect(page.locator('#answer')).toBeEnabled({ timeout: 6_000 });
    if (round < 2) await expectPortraitAppFitsViewport(page);
  }

  await expect(page.locator('#intro')).toHaveClass(/show/, { timeout: 9_000 });
  await expect(page.locator('#introName')).toHaveText('Kapitän Brax');
  const introBoss = page.locator('#introArt .letter-bay-boss-image');
  await expect(introBoss).toHaveAttribute('src', /level-02-kapitaen-brax\.png$/);
  await expectLoadedImage(introBoss);

  await activateStart(page, testInfo.project.name);
  await expect(page.locator('#bossLevel')).toContainText('LEVEL 2');
  await expect(page.locator('#keyboard .key')).toHaveCount(29);
  const arenaBoss = page.locator('#bossArt .letter-bay-boss-image');
  await expect(arenaBoss).toHaveAttribute('data-boss-index', '2');
  await expect(arenaBoss).toHaveAttribute('src', /level-02-kapitaen-brax\.png$/);
  await expectLoadedImage(arenaBoss);
  await expectPortraitAppFitsViewport(page);

  const scrollState = await page.evaluate(() => ({
    y: window.scrollY,
    max: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
    bodyHeight: document.body.scrollHeight,
  }));
  expect(scrollState.y).toBeLessThanOrEqual(scrollState.max + 1);
  expect(scrollState.bodyHeight).toBeLessThan(3000);
});
