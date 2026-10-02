import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { renderSpSoldiers } from './generate.mjs';

const exactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(`${label} fields were ${actual.join(',')}; expected ${wanted.join(',')}`);
};

export function validateSpSoldierPresentation(identities, localizations, baseStats, relations, generatedText) {
  const expectedText = renderSpSoldiers(identities, localizations, baseStats, relations);
  if (generatedText !== expectedText) throw new Error('generated SP Soldier presentation is stale or non-deterministic');
  const generated = JSON.parse(generatedText);
  exactKeys(generated, ['schemaVersion', 'soldiers'], 'generated SP Soldier data');
  if (generated.schemaVersion !== 1 || !Array.isArray(generated.soldiers)) throw new Error('unsupported SP Soldier presentation schema');
  const expectedIds = identities.records.filter((record) => record.variant === 'SP').map((record) => record.id).sort((a, b) => a - b);
  if (generated.soldiers.length !== expectedIds.length) throw new Error('generated SP Soldier count differs from current admitted identity set');
  const actualIds = generated.soldiers.map((record) => record.spSoldierId);
  if (new Set(actualIds).size !== actualIds.length) throw new Error('generated SP Soldier IDs are not unique');
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) throw new Error('generated SP Soldier IDs differ from canonical set or ordering');
  for (const record of generated.soldiers) {
    exactKeys(record, ['spSoldierId', 'nameKo', 'normalSoldierId', 'baseStats'], `SP Soldier ${record.spSoldierId}`);
    if (!Number.isInteger(record.spSoldierId) || typeof record.nameKo !== 'string' || !record.nameKo || !Number.isInteger(record.normalSoldierId)) {
      throw new Error(`malformed generated SP Soldier ${String(record.spSoldierId)}`);
    }
    exactKeys(record.baseStats, ['hp', 'attack', 'defense', 'magicDefense'], `SP Soldier ${record.spSoldierId} base stats`);
    if (!Object.values(record.baseStats).every(Number.isFinite)) throw new Error(`malformed base stats for SP Soldier ${record.spSoldierId}`);
  }
  return generated;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
  const [identities, localizations, baseStats, relations, generatedText] = await Promise.all([
    readJson('canonical/soldiers.v1.json'),
    readJson('canonical/sp-soldier-localizations-ko.v1.json'),
    readJson('canonical/sp-soldier-base-stats.v1.json'),
    readJson('canonical/sp-soldier-normal-relations.v1.json'),
    readFile(resolve('generated/sp-soldiers.v1.json'), 'utf8'),
  ]);
  const generated = validateSpSoldierPresentation(identities, localizations, baseStats, relations, generatedText);
  process.stdout.write(`SP Soldier presentation: PASS (${generated.soldiers.length} records; canonical parity, exact schema, order and freshness)\n`);
}
