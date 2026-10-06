import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderExclusiveEquipment } from './generate.mjs';

const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
export function validateExclusiveEquipmentPresentation({ identity, localization, generated, generatedText, frontend }) {
  assert.equal(identity?.schemaVersion, 1, 'identity schema mismatch');
  assert.equal(localization?.schemaVersion, 1, 'localization schema mismatch');
  assert.equal(generated?.schemaVersion, 1, 'generated schema mismatch');
  assert.ok(Array.isArray(identity.records) && identity.records.length === 167, 'identity population must be 167');
  assert.ok(Array.isArray(localization.records) && localization.records.length === 167, 'localization population must be 167');
  assert.ok(Array.isArray(generated.equipment) && generated.equipment.length === 167, 'generated population must be 167');
  const identityIds = identity.records.map((record) => record.equipmentId);
  const localizedIds = localization.records.map((record) => record.equipmentId);
  const generatedIds = generated.equipment.map((record) => record.equipmentId);
  assert.equal(new Set(identityIds).size, 167, 'duplicate identity Equipment ID');
  assert.equal(new Set(localizedIds).size, 167, 'duplicate localization Equipment ID');
  assert.equal(new Set(generatedIds).size, 167, 'duplicate generated Equipment ID');
  const sortedIds = (ids) => [...ids].sort((a, b) => a - b);
  assert.deepEqual(sortedIds(localizedIds), sortedIds(identityIds), 'localization ID set differs from identity');
  assert.deepEqual(generatedIds, sortedIds(identityIds), 'generated IDs differ from sorted identity IDs');
  for (const record of generated.equipment) {
    assert.deepEqual(Object.keys(record).sort(), ['effectDescriptionKo', 'equipmentId', 'nameKo'], 'unsupported generated fields');
    assert.ok(typeof record.nameKo === 'string' && record.nameKo.trim(), 'missing Korean name');
    assert.ok(typeof record.effectDescriptionKo === 'string' && record.effectDescriptionKo.trim(), 'missing Korean effect');
  }
  assert.equal(generatedText, renderExclusiveEquipment(identity, localization), 'generated artifact is stale or non-deterministic');
  assert.ok(frontend.includes("fetch('./generated/exclusive-equipment.v1.json')"), 'frontend fetch path is missing');
  return { count: generated.equipment.length, uniqueIds: new Set(generatedIds).size, fresh: true };
}
async function main() {
  const [identity, localization, generatedText, frontend] = await Promise.all([
    readJson('canonical/exclusive-equipment.v1.json'),
    readJson('canonical/exclusive-equipment-localizations-ko.v1.json'),
    readFile(resolve('generated/exclusive-equipment.v1.json'), 'utf8'),
    readFile(resolve('app.js'), 'utf8'),
  ]);
  const result = validateExclusiveEquipmentPresentation({ identity, localization, generated: JSON.parse(generatedText), generatedText, frontend });
  process.stdout.write('Exclusive Equipment presentation: PASS (' + result.count + ' records; exact IDs, fields, and freshness)\n');
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main();
