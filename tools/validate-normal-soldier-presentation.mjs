import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { renderNormalSoldiers } from './generate.mjs';

const exactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(`${label} fields were ${actual.join(',')}; expected ${wanted.join(',')}`);
};

export function validateNormalSoldierPresentation(identities, localizations, baseStats, generatedText) {
  const expectedText = renderNormalSoldiers(identities, localizations, baseStats);
  if (generatedText !== expectedText) throw new Error('generated NORMAL Soldier presentation is stale or non-deterministic');
  const generated = JSON.parse(generatedText);
  exactKeys(generated, ['schemaVersion', 'soldiers'], 'generated NORMAL Soldier data');
  if (generated.schemaVersion !== 1 || !Array.isArray(generated.soldiers) || generated.soldiers.length !== 56) {
    throw new Error('unsupported NORMAL Soldier presentation population/schema');
  }
  const expectedIds = identities.records.filter((record) => record.entity === 'Soldier' && record.variant === 'NORMAL').map((record) => record.id).sort((a, b) => a - b);
  const actualIds = generated.soldiers.map((record) => record.normalSoldierId);
  if (new Set(actualIds).size !== actualIds.length) throw new Error('NORMAL Soldier IDs are not unique');
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) throw new Error('generated NORMAL Soldier IDs differ from current canonical identity set or ordering');
  for (const record of generated.soldiers) {
    exactKeys(record, ['normalSoldierId', 'nameKo', 'baseStats'], `NORMAL Soldier ${record.normalSoldierId}`);
    if (!Number.isInteger(record.normalSoldierId) || typeof record.nameKo !== 'string' || !record.nameKo.trim()) {
      throw new Error(`malformed generated NORMAL Soldier ${String(record.normalSoldierId)}`);
    }
    exactKeys(record.baseStats, ['hp', 'attack', 'defense', 'magicDefense'], `NORMAL Soldier ${record.normalSoldierId} base stats`);
    if (!Object.values(record.baseStats).every(Number.isFinite)) throw new Error(`malformed base stats for NORMAL Soldier ${record.normalSoldierId}`);
  }
  return generated;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
  const [identities, localizations, baseStats, generatedText] = await Promise.all([
    readJson('canonical/soldiers.v1.json'),
    readJson('canonical/normal-soldier-localizations-ko.v1.json'),
    readJson('canonical/normal-soldier-base-stats.v1.json'),
    readFile(resolve('generated/normal-soldiers.v1.json'), 'utf8'),
  ]);
  const generated = validateNormalSoldierPresentation(identities, localizations, baseStats, generatedText);
  process.stdout.write(`NORMAL Soldier presentation: PASS (${generated.soldiers.length} records; exact IDs, fields and freshness)\n`);
}
