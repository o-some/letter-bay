import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

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
];

const pngSignature = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);

async function assertBossSet(root) {
  for (const file of bossFiles) {
    const path = join(root, file);
    const metadata = await stat(path);
    if (metadata.size < 100_000) throw new Error(`${path}: unexpectedly small (${metadata.size})`);
    const data = await readFile(path);
    if (!data.subarray(0,8).equals(pngSignature)) throw new Error(`${path}: invalid PNG signature`);
    const colorType = data[25];
    if (colorType !== 4 && colorType !== 6) throw new Error(`${path}: PNG has no alpha channel`);
  }
}

await assertBossSet('public/assets/bosses');
await assertBossSet('public/legacy/assets/bosses');

for (const file of [
  'public/assets/creative/tula_profile.webp',
  'public/assets/creative/tula_waving.webp',
  'public/assets/creative/world_harbor.webp',
  'public/assets/creative-v2/home_cinematic_island.webp',
  'public/legacy/index.html',
  'public/legacy/source.html',
]) {
  const metadata = await stat(file);
  if (metadata.size === 0) throw new Error(`${file}: empty`);
}

console.log('Letter Bay asset integrity: PASS');
