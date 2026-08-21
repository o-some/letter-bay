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

async function startBattle(page: Page, projectName: string) {
  const start = page.locator('#start');
  await expect(start).toBeVisible();
  if (projectName.startsWith('webkit')) await start.tap();
  else await start.click();
  await expect(page.locator('#intro')).not.toHaveClass(/show/);
}

async function solveWithHint(page: Page, clues: Map<string, string>) {
  await page.locator('#hint').click();
  await expect(page.locator('#msg')).toContainText('Hinweis:');
  const message = (await page.locator('#msg').textContent()) ?? '';
  const answer = clues.get(message.replace(/^Hinweis:\s*/, ''));
  if (!answer) throw new Error(`Unknown clue: ${message}`);
  await page.locator('#answer').fill(answer);
  await page.locator('#answerForm button[type="submit"]').click();
}

test('arena momentum turns solved words into territory and chain progress', async ({ page }, testInfo) => {
  const clues = legacyClueMap();
  await page.goto('/letter-bay/');
  await startBattle(page, testInfo.project.name);

  const choice = page.locator('.lb-attack-choice');
  await expect(choice).toBeVisible();
  await expect(page.locator('.lb-boss-intent')).toContainText('Druckangriff');
  await expect(page.locator('#answer')).toBeDisabled();
  await page.locator('.lb-attack-button.attack-safe').click();
  await expect(choice).toBeHidden();
  await expect(page.locator('#answer')).toBeEnabled();

  const beforeTula = await page.locator('.arena .tula').boundingBox();
  await solveWithHint(page, clues);
  await expect(page.locator('#arena')).toHaveAttribute('data-lb-momentum', '1');
  await expect(page.locator('#arena')).toHaveAttribute('data-lb-chain-stage', '1');
  await expect(page.locator('.lb-duo-reaction')).toBeVisible({ timeout: 4_000 });

  await expect(choice).toBeVisible({ timeout: 7_000 });
  await expect(page.locator('.lb-boss-intent')).toContainText('Offene Deckung');
  await page.locator('.lb-attack-button.attack-bold').click();
  await solveWithHint(page, clues);
  await expect(page.locator('#arena')).toHaveAttribute('data-lb-momentum', '3');
  await expect(page.locator('#arena')).toHaveAttribute('data-lb-chain-stage', '3');

  const afterTula = await page.locator('.arena .tula').boundingBox();
  expect(beforeTula).not.toBeNull();
  expect(afterTula).not.toBeNull();
  if (beforeTula && afterTula) expect(afterTula.x).toBeGreaterThan(beforeTula.x + 5);

  const viewport = await page.evaluate(() => ({
    y: window.scrollY,
    max: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
  }));
  expect(viewport.y).toBeLessThanOrEqual(viewport.max + 1);
});

test('precision attack shields the first momentum mistake without changing Tula HP rules', async ({ page }, testInfo) => {
  await page.goto('/letter-bay/');
  await startBattle(page, testInfo.project.name);
  await page.locator('.lb-attack-button.attack-precision').click();

  const hpBefore = await page.locator('#tulaHpText').textContent();
  const answer = page.locator('#answer');
  await answer.fill('FALSCHESWORT');
  await page.locator('#answerForm button[type="submit"]').click();

  await expect(page.locator('#arena')).toHaveAttribute('data-lb-momentum', '0');
  await expect(page.locator('.lb-momentum-pulse')).toContainText('Präzision schützt');
  await expect(page.locator('#tulaHpText')).not.toHaveText(hpBefore ?? '');
  await expect(page.locator('#tulaHpText')).toHaveText('6 / 7');
});

test('arena momentum can be disabled without changing the V2 gameplay fallback', async ({ page }, testInfo) => {
  await page.goto('/letter-bay/?arenaMomentum=0');
  await startBattle(page, testInfo.project.name);
  await expect(page.locator('.lb-attack-choice')).toHaveCount(0);
  await expect(page.locator('#answer')).toBeEnabled();
  await expect(page.locator('#keyboard .key')).toHaveCount(29);
});
