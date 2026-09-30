import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PINNED_COMMIT = '6475e63ee23d18adf733756c26a14fa9e3ed662c';
const fail = (message) => { throw new Error(`SP Soldier relation validation failed: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const pairKey = (spId, normalId) => `${spId}:${normalId}`;

export function validateSpSoldierRelation({ soldiers, relations, soldierInfo, spSoldierInfo, manifest }) {
  check(soldiers.schemaVersion === 1 && Array.isArray(soldiers.records), 'Soldier canonical schema mismatch');
  check(relations.schemaVersion === 1 && Array.isArray(relations.records), 'relation canonical schema mismatch');
  check(manifest.source?.commit === PINNED_COMMIT, 'source commit mismatch');
  check(manifest.source?.repository === 'LuceatLuxVestra42/langrisser-future-guide', 'source repository mismatch');
  check(manifest.source?.sourceVersionStatus === 'unknown', 'source version must remain unknown');

  const normalCanonical = new Set(soldiers.records.filter(r => r.variant === 'NORMAL').map(r => r.id));
  const spCanonical = new Set(soldiers.records.filter(r => r.variant === 'SP').map(r => r.id));
  const sourceBySp = new Map();
  const expectedPairs = new Set();
  for (const row of spSoldierInfo.records) {
    check(Number.isInteger(row.ID) && Number.isInteger(row.NormalSoliderId), 'source relation endpoint missing or malformed');
    check(!sourceBySp.has(row.ID), `duplicate/conflicting source relation for SP ${row.ID}`);
    sourceBySp.set(row.ID, row.NormalSoliderId);
    expectedPairs.add(pairKey(row.ID, row.NormalSoliderId));
    check(spCanonical.has(row.ID), `SP endpoint canonical identity missing: ${row.ID}`);
    check(normalCanonical.has(row.NormalSoliderId), `NORMAL target canonical identity missing: ${row.NormalSoliderId}`);
    check(soldierInfo.records.filter(r => r.ID === row.ID).length === 1, `SP SoldierInfo endpoint missing or duplicate: ${row.ID}`);
    check(soldierInfo.records.filter(r => r.ID === row.NormalSoliderId).length === 1, `NORMAL SoldierInfo endpoint missing or duplicate: ${row.NormalSoliderId}`);
  }

  const actualPairs = new Set();
  const relationBySp = new Map();
  for (const row of relations.records) {
    check(Number.isInteger(row.spSoldierId) && Number.isInteger(row.normalSoldierId), 'canonical relation endpoint malformed');
    check(!relationBySp.has(row.spSoldierId), `duplicate/conflicting canonical relation for SP ${row.spSoldierId}`);
    relationBySp.set(row.spSoldierId, row.normalSoldierId);
    const key = pairKey(row.spSoldierId, row.normalSoldierId);
    check(!actualPairs.has(key), `duplicate canonical SP/NORMAL relation ${key}`);
    actualPairs.add(key);
    check(spCanonical.has(row.spSoldierId), `relation SP endpoint is dangling: ${row.spSoldierId}`);
    check(normalCanonical.has(row.normalSoldierId), `relation NORMAL target is dangling: ${row.normalSoldierId}`);
    const expectedProvenance = row.spSoldierId === 5115 && row.normalSoldierId === 115
      ? 'evidence/source/configdata/ConfigDataSPSoldierInfo.record-5115.v1.json#ID=5115/NormalSoliderId'
      : `evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json#ID=${row.spSoldierId}/NormalSoliderId`;
    check(row.provenance === expectedProvenance, `relation provenance mismatch for SP ${row.spSoldierId}`);
  }
  check(actualPairs.size === expectedPairs.size && [...expectedPairs].every(item => actualPairs.has(item)), 'canonical relation set differs from explicit source fields');
  check(relationBySp.get(5115) === 115, '5115 → 115 regression relation missing or changed');
  return { relationCount: actualPairs.size };
}

export async function loadAndValidateSpSoldierRelation(root = process.cwd()) {
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [soldiers, relations, soldierInfo, spSoldierInfo, manifest] = await Promise.all([
    read('canonical/soldiers.v1.json'),
    read('canonical/sp-soldier-normal-relations.v1.json'),
    read('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json'),
    read('evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json'),
    read('evidence/source/configdata/sp-soldier-population.source-manifest.v1.json'),
  ]);
  return validateSpSoldierRelation({ soldiers, relations, soldierInfo, spSoldierInfo, manifest });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await loadAndValidateSpSoldierRelation();
  process.stdout.write(`SP Soldier relation population: PASS (${result.relationCount} explicit relations)\\n`);
}
