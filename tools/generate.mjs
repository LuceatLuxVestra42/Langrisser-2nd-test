import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function renderGenerated(canonical) {
  const heroes = [...canonical.records]
    .sort((a, b) => a.id - b.id)
    .map(({ id, nameEng, portrait }) => ({ id, nameEng, portrait }));
  return `${JSON.stringify({ schemaVersion: 1, heroes }, null, 2)}\n`;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const inputPath = resolve('canonical/heroes.v1.json');
  const outputPath = resolve('generated/hero-slice.v1.json');
  const canonical = JSON.parse(await readFile(inputPath, 'utf8'));
  await writeFile(outputPath, renderGenerated(canonical), 'utf8');
  process.stdout.write(`Generated ${outputPath}\n`);
}
