import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../source.html', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

const bosses = [
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
];

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

for (const boss of bosses) {
  assert.ok(source.includes(boss) || index.includes(boss), `Missing boss name: ${boss}`);
}

for (const file of bossFiles) {
  const path = new URL(`../../assets/bosses/${file}`, import.meta.url);
  assert.ok(fs.existsSync(path), `Missing boss asset: ${file}`);
  assert.ok(index.includes(file), `Bootstrap does not map boss asset: ${file}`);
}

[
  'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ',
  'id="start"',
  'id="continue"',
  'id="hint"',
  'id="joker"',
  'id="answerForm"',
  'function bossDown',
  'function clampScroll',
  'Das wird beim nächsten Mal besser',
  'YEAH!',
].forEach(anchor => assert.ok(source.includes(anchor), `Missing legacy contract anchor: ${anchor}`));

assert.ok(index.includes('letter-bay-boss-image'), 'Bosses must have real <img> runtime support in current baseline wrapper');

console.log('Letter Bay legacy static parity contract: PASS');
