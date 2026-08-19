import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const roots = ['src', 'scripts', 'tests'];
const forbidden = [
  '/tulasisland/' + 'letter-bay/',
  'window.location.href = ' + '"javascript:',
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(path));
    else paths.push(path);
  }
  return paths;
}

const files = (await Promise.all(roots.map(walk))).flat();
const checked = files.filter((file) => ['.ts', '.mjs', '.astro', '.css'].includes(extname(file)));
const failures = [];

for (const file of checked) {
  const text = await readFile(file, 'utf8');
  for (const token of forbidden) {
    if (text.includes(token)) failures.push(`${file}: forbidden token ${token}`);
  }
  if (text.includes('\r')) failures.push(`${file}: CR characters are not allowed`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Letter Bay lint: ${checked.length} files checked.`);
